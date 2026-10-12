"""Narration: one TTS clip per phrase, assembled with scripted pauses.
Writes build/narration.wav (44.1 kHz mono) and build/timings.json (phrase + word timestamps).

    python3 audio/tts.py episodes/fischer

Providers (script.json -> "voice": {"provider": ...}):
  kokoro      local, free. {"name": "am_michael", "speed": 0.9, "pitch_semitones": -1.5}
  fish        Fish Audio, env FISH_API_KEY.  {"reference_id": "...", "model": "s1", "speed": 1.0}
  chatterbox  local, free (MIT), voice cloning from a clip. {"reference_fish_id": "..."} or {"reference": "ref.wav"},
              {"exaggeration": 0.6, "cfg_weight": 0.35}
  elevenlabs  ElevenLabs, env ELEVENLABS_API_KEY.
              {"voice_id": "...", "model": "eleven_multilingual_v2", "stability": 0.4, ...}
API responses are cached in build/tts_cache/, so re-runs cost no credits.
"""
import base64
import hashlib
import io
import json
import os
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import requests
import soundfile as sf
from scipy.signal import resample_poly

SR = 44100


def trim(a, thr=0.004, pad=0.08):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a, 0.0
    s = max(0, idx[0] - int(pad * SR))
    e = min(len(a), idx[-1] + int(pad * SR))
    return a[s:e], s / SR


def decode(data):
    """Any audio bytes -> mono float32 @ SR (via ffmpeg)."""
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                       input=data, capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()


def words_from_chars(chars, starts, ends):
    """Character alignment -> [(word, start, end)] split on whitespace."""
    out, cur = [], None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur: out.append(tuple(cur)); cur = None
            continue
        if cur is None: cur = [ch, s, e]
        else: cur[0] += ch; cur[2] = e
    if cur: out.append(tuple(cur))
    return out


_norm = lambda w: re.sub(r'[^a-z0-9]', '', w.lower())


def align(caps, heard, dur):
    """Map caption words onto recognized (word, s, e); unmatched words are interpolated by length."""
    import difflib
    a, b = [_norm(c) for c in caps], [_norm(h[0]) for h in heard]
    times = [None] * len(caps)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (heard[blk.b + k][1], heard[blk.b + k][2])
    # anchors at both ends, then fill gaps proportionally to word length
    if times[0] is None: times[0] = (heard[0][1] if heard else 0.0, None)
    if times[-1] is None: times[-1] = (None, heard[-1][2] if heard else dur)
    i = 0
    while i < len(caps):
        if times[i] is not None and None not in times[i]:
            i += 1; continue
        j = i
        while j < len(caps) and (times[j] is None or None in times[j]): j += 1
        t0 = times[i - 1][1] if i > 0 else (times[i][0] if times[i] and times[i][0] is not None else 0.0)
        t1 = times[j][0] if j < len(caps) else (times[-1][1] if times[-1] and times[-1][1] is not None else dur)
        wts = np.array([len(c) + 1 for c in caps[i:j]], float)
        edges = t0 + np.concatenate([[0], np.cumsum(wts)]) / wts.sum() * max(0.05, t1 - t0)
        for k in range(i, j): times[k] = (edges[k - i], edges[k - i + 1])
        i = j
    return times


class Kokoro:
    def __init__(self, v):
        from kokoro import KPipeline
        self.v, self.pipe = v, KPipeline(lang_code='a')
        self.ratio = 2 ** (-v.get('pitch_semitones', 0) / 12)  # tape-style deepen

    def __call__(self, text, prev, nxt):
        audio, toks, off = [], [], 0.0
        for r in self.pipe(text, voice=self.v['name'], speed=self.v.get('speed', 1.0) * self.ratio):
            a = r.audio.numpy()
            for t in r.tokens or []:
                if t.start_ts is not None and t.end_ts is not None:
                    toks.append((t.text, t.start_ts + off, t.end_ts + off, t.whitespace))
            audio.append(a); off += len(a) / 24000
        a = resample_poly(np.concatenate(audio), int(round(SR * self.ratio / 100)), 240)
        words, cur = [], None
        for x, s, e, ws in toks:
            cur = [x, s, e] if cur is None else [cur[0] + x, cur[1], e]
            if ws: words.append(tuple(cur)); cur = None
        if cur: words.append(tuple(cur))
        return a, [(w, s * self.ratio, e * self.ratio) for w, s, e in words if re.search(r'\w', w)]


class Cached:
    def __init__(self, v, cache, ep=None):
        self.v, self.cache, self.ep = v, cache, ep
        cache.mkdir(parents=True, exist_ok=True)

    def key(self, *parts):
        return hashlib.sha1(json.dumps([self.v, *parts], sort_keys=True).encode()).hexdigest()[:16]


class ElevenLabs(Cached):
    def __call__(self, text, prev, nxt):
        f = self.cache / f"el_{self.key(text, prev, nxt)}.json"
        if not f.exists():
            key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
            v = self.v
            r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voice_id']}/with-timestamps",
                              params={'output_format': 'mp3_44100_128'}, headers={'xi-api-key': key}, timeout=120,
                              json={'text': text, 'model_id': v.get('model', 'eleven_multilingual_v2'),
                                    'previous_text': prev, 'next_text': nxt,
                                    'voice_settings': {'stability': v.get('stability', 0.4), 'similarity_boost': v.get('similarity', 0.8),
                                                       'style': v.get('style', 0.3), 'use_speaker_boost': True, 'speed': v.get('speed', 1.0)}})
            if r.status_code != 200: sys.exit(f'ElevenLabs {r.status_code}: {r.text[:300]}')
            f.write_text(r.text)
        d = json.loads(f.read_text())
        al = d.get('alignment') or d.get('normalized_alignment')
        return decode(base64.b64decode(d['audio_base64'])), words_from_chars(
            al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds'])


class Fish(Cached):

    def __call__(self, text, prev, nxt):
        f = self.cache / f"fish_{self.key(text)}.wav"
        if not f.exists():
            key = os.environ.get('FISH_API_KEY') or sys.exit('FISH_API_KEY is not set')
            v = self.v
            r = requests.post('https://api.fish.audio/v1/tts', timeout=180,
                              headers={'Authorization': f'Bearer {key}', 'model': v.get('model', 's1')},
                              json={'text': v.get('prefix', '') + text, 'reference_id': v['reference_id'], 'format': 'wav',
                                    'sample_rate': SR, 'normalize': True, 'latency': 'normal',
                                    'temperature': v.get('temperature', 0.7), 'top_p': v.get('top_p', 0.7),
                                    'prosody': {'speed': v.get('speed', 1.0), 'volume': 0}})
            if r.status_code != 200: sys.exit(f'Fish {r.status_code}: {r.text[:300]}')
            f.write_bytes(r.content)
        return recognize(decode(f.read_bytes()), text)


_asr = None


def recognize(a, text):
    """No timestamps from the engine: trim, recognize the clip and return heard words with times."""
    global _asr
    a, _ = trim(a)  # trim first: whisper snaps the first word to 0 after silence
    onset = np.argmax(np.abs(a) > 0.01) / SR
    if _asr is None:
        import whisper
        _asr = whisper.load_model('small')
    res = _asr.transcribe(resample_poly(a, 160, 441).astype(np.float32), language='en',
                          word_timestamps=True, initial_prompt=text, fp16=False)
    return a, [(w['word'].strip(), max(w['start'], onset if i == 0 else 0), w['end'])
               for i, w in enumerate(w for s in res['segments'] for w in s['words'])]


class Chatterbox(Cached):
    """Local, free (MIT). Zero-shot cloning from a reference clip: either a local file
    ("reference": path relative to the episode) or a public Fish voice sample ("reference_fish_id")."""
    _m = None

    def ref(self):
        v = self.v
        if v.get('reference'):
            return str(self.ep / v['reference'])
        if v.get('reference_fish_id'):
            f = self.cache / f"ref_{v['reference_fish_id']}.wav"
            if not f.exists():
                d = requests.get(f"https://api.fish.audio/model/{v['reference_fish_id']}", timeout=30).json()
                sf.write(f, decode(requests.get(d['samples'][0]['audio'], timeout=60).content), SR)
            return str(f)
        return None

    def take(self, text, seed):
        f = self.cache / f"cb_{self.key(text, seed)}.wav"
        if not f.exists():
            import torch
            from chatterbox.tts import ChatterboxTTS
            if Chatterbox._m is None:
                Chatterbox._m = ChatterboxTTS.from_pretrained(device='cuda' if torch.cuda.is_available() else 'cpu')
            m, v = Chatterbox._m, self.v
            torch.manual_seed(seed)
            wav = m.generate(text, audio_prompt_path=self.ref(), exaggeration=v.get('exaggeration', 0.6),
                             cfg_weight=v.get('cfg_weight', 0.35), temperature=v.get('temperature', 0.8))
            sf.write(f, wav.squeeze().numpy(), m.sr)
        a, sr = sf.read(f, dtype='float32')
        from math import gcd
        g = gcd(SR, sr)
        return recognize(resample_poly(a, SR // g, sr // g), text)

    def __call__(self, text, prev, nxt):
        # generative TTS sometimes slurs or drops words: verify each take with ASR, retry with new seeds
        seed0, best = self.v.get('seed', 7), None
        for k in range(self.v.get('retries', 6)):
            a, heard = self.take(text, seed0 + k)
            score = similar(text, ' '.join(w for w, _, _ in heard))
            if best is None or score > best[0]: best = (score, a, heard)
            if score >= 0.97:
                break
            print(f'  retake ({score:.2f}): {text!r} heard {" ".join(w for w, _, _ in heard)!r}')
        return best[1], best[2]


def similar(a, b):
    """Letter-level similarity of script vs recognized text; digits are spelled out on both sides."""
    import difflib
    from num2words import num2words
    n = lambda s: re.sub(r'[^a-z]', '', re.sub(r'\d+', lambda m: num2words(int(m.group())), s.lower()))
    return difflib.SequenceMatcher(None, n(a), n(b)).ratio()


def main(ep):
    ep = Path(ep)
    script = json.loads((ep / 'script.json').read_text())
    v = script['voice']
    build = ep / 'build'; build.mkdir(exist_ok=True)
    prov = v.get('provider', 'kokoro')
    need = {'fish': 'FISH_API_KEY', 'elevenlabs': 'ELEVENLABS_API_KEY'}.get(prov)
    cached = (build / 'tts_cache').exists() and any((build / 'tts_cache').glob(('el' if prov == 'elevenlabs' else prov) + '_*'))
    if need and not os.environ.get(need) and not cached and v.get('fallback'):
        print(f'{need} is not set -> falling back to {v["fallback"]["provider"]}')
        v = v['fallback']; prov = v['provider']
    tts = {'kokoro': lambda: Kokoro(v), 'fish': lambda: Fish(v, build / 'tts_cache'),
           'elevenlabs': lambda: ElevenLabs(v, build / 'tts_cache'), 'chatterbox': lambda: Chatterbox(v, build / 'tts_cache', ep)}[prov]()
    ph = script['phrases']
    out, phrases = [], []
    t = script.get('lead_in', 0.0)
    out.append(np.zeros(int(t * SR)))
    for i, p in enumerate(ph):
        say = p.get('say', p['text'])
        audio, heard = tts(say, ph[i - 1].get('say', ph[i - 1]['text']) if i else '', ph[i + 1].get('say', ph[i + 1]['text']) if i + 1 < len(ph) else '')
        audio, cut = trim(audio)
        dur = len(audio) / SR
        caps = p['text'].split()
        heard = [(w, s - cut, e - cut) for w, s, e in heard]
        if len(heard) == len(caps):
            spans = [(max(0.0, s), min(dur, e)) for _, s, e in heard]
        else:
            print(f"  [{p['id']}] {len(heard)} heard vs {len(caps)} words -> aligned")
            spans = align(caps, heard, dur)
        words = [{'w': c, 's': round(t + s, 3), 'e': round(t + e, 3), 'c': p.get('colors', {}).get(c, 'lime')}
                 for c, (s, e) in zip(caps, spans)]
        phrases.append({'id': p['id'], 'text': p['text'], 's': round(t, 3), 'e': round(t + dur, 3), 'words': words})
        print(f"{t:6.2f}-{t + dur:6.2f}  {p['text']}")
        out += [audio, np.zeros(int(p.get('pause', 0.5) * SR))]
        t += dur + p.get('pause', 0.5)
    tail = script.get('tail', 1.0)
    out.append(np.zeros(int(tail * SR))); t += tail
    a = np.concatenate(out).astype(np.float32)
    a /= max(1e-6, np.abs(a).max()) / 0.9
    sf.write(build / 'narration.wav', a, SR)
    (build / 'timings.json').write_text(json.dumps({'duration': round(t, 3), 'voice': prov, 'phrases': phrases}, indent=1))
    print(f'total {t:.2f}s ({prov})')


if __name__ == '__main__':
    main(sys.argv[1])
