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

Optional post-processing of every phrase (script.json -> "voice_fx"):
  {"tempo": 1.1}                                   faster delivery, pitch kept (ffmpeg atempo)
A phrase can hold its breath: "hold": {"after": "it,", "sec": 1.0} puts a second of silence after that word
(a list of them for several). A phrase can have its own "tempo" and "max_gap", and "take": n asks ElevenLabs v3 for
another reading of the same line.
  {"engine": 2}                                    pauses are cut only in true silence and cross-faded, a hold goes into
                                                   the silence between the two words, a take that stops while the voice
                                                   still sounds is faded out, every take is checked against the script
A take that ends in a long tail of hiss or a stray click (trim() keeps it): "tail_db": -45 cuts the phrase after its last
30 ms that is louder than that many dB under the take's peak.
  {"sts": {"voice_id": "...", "model": "eleven_multilingual_sts_v2", "stability": 0.5, "similarity_boost": 0.85}}
                                                   ElevenLabs speech-to-speech: our take keeps its timing and
                                                   intonation, the timbre becomes the chosen narrator (env ELEVENLABS_API_KEY)
Word timings are re-measured with whisper after post-processing.
"""
import base64
import hashlib
import io
import json
import shutil
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


def squeeze(a, max_gap=0.25, thr_db=-32, fade=0.02):
    """Shorten silences inside a take to at most max_gap seconds (dramatic engines pause a lot)."""
    hop = int(0.01 * SR)
    n = len(a) // hop
    if n < 3:
        return a
    rms = np.sqrt(np.mean(a[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    quiet = 20 * np.log10(rms / (rms.max() + 1e-12)) < thr_db
    out, i, keep, f = [], 0, int(max_gap * SR), int(fade * SR)
    while i < n:
        j = i
        while j < n and quiet[j] == quiet[i]:
            j += 1
        seg = a[i * hop:(j * hop if j < n else len(a))]
        if quiet[i] and 0 < i and j < n and len(seg) > keep:  # an inner pause: keep its two ends, cross-faded
            h = keep // 2
            seg = np.concatenate([seg[:h] * np.r_[np.ones(h - f), np.linspace(1, 0, f)], seg[-h:] * np.r_[np.linspace(0, 1, f), np.ones(h - f)]])
        out.append(seg)
        i = j
    return np.concatenate(out)


# ---------- voice_fx "engine": 2 (witty2 v5). The first engine cut words: squeeze() called anything 32 dB under the
# loudest frame a pause (a soft "s", a breath) and butt-joined its two ends through zero, a hold was spliced half-way
# between two whisper word times (inside a drawn-out word as often as not), and eleven_v3 takes that stop while the
# voice still sounds were left with a hard edge ----------
def level(a, hop=0.005, win=0.02):
    """Short-time level in dB under the take's loudest frame, one value per hop; (levels, hop in samples, window)."""
    h, w = int(hop * SR), int(win * SR)
    n = max(1, (len(a) - w) // h + 1)
    idx = np.minimum(np.arange(n)[:, None] * h + np.arange(w)[None, :], len(a) - 1)
    r = np.sqrt(np.mean(a[idx] ** 2, axis=1) + 1e-12)
    return 20 * np.log10(r / (r.max() + 1e-12)), h, w


def xjoin(parts, fade=0.015):
    """Concatenate with short cross-fades (no dip to zero at a joint)."""
    out = parts[0].copy()
    for p in parts[1:]:
        f = min(int(fade * SR), len(out), len(p))
        if f > 0:
            w = np.linspace(0, 1, f)
            out[-f:] = out[-f:] * (1 - w) + p[:f] * w
        out = np.concatenate([out, p[f:]])
    return out


def tail_fix(a):
    """Repair the end of a take that stops while the voice still sounds: if the level dips (not to silence) and climbs
    again into the cut, the next sound had begun, so stop at the dip; then fade what is left of the last word out.
    A plosive's burst after its closure (a dip to silence) is kept. Also a 5 ms fade-in."""
    a = a.copy(); f = min(len(a), int(0.005 * SR)); a[:f] *= np.linspace(0, 1, f)
    L, h, w = level(a)
    if len(L) < 60 or L[-4:].max() < -50:
        return a  # it ends in silence
    q = np.where(L < -50)[0]
    if len(q) and len(L) - 1 - q[-1] <= 24:  # the last silence is within 120 ms of the end: what follows it is cut short
        e = int(q[-1]); b = e
        while b > 0 and L[b - 1] < -50: b -= 1
        if (e - b + 1) * h >= 0.15 * SR:  # too long a silence for a plosive's closure: a new sound (a breath) had begun
            a = a[:b * h + w // 2 + int(0.03 * SR)].copy()
            return a
    tail = L[-50:]  # the last 250 ms
    m = int(np.argmin(tail))
    if tail[m] > -50 and tail[-4:].max() - tail[m] >= 6 and m >= 10:
        a = a[:(len(L) - 50 + m) * h + w // 2].copy()
        L, h, w = level(a)
    f = min(len(a), int((0.07 if L[-20:].min() > -38 else 0.025) * SR))  # a held vowel or "s": a longer release
    a[-f:] *= np.linspace(1, 0, f) ** 1.5
    return a


def squeeze2(a, max_gap=0.16):
    """Shorten the pauses inside a take to max_gap of true silence. The word before keeps its whole decay (to -50 dB,
    0.25 s at most), the word after its soft onset (0.12 s at most); a breath between them goes with the silence.
    The two ends are cross-faded."""
    L, h, w = level(a)
    n = len(L)
    if n < 20:
        return a
    quiet = L < -32
    g = max(1, int(max_gap * SR / h / 2))
    keep, pos, i = [], 0, 0
    while i < n:
        j = i
        while j < n and quiet[j] == quiet[i]:
            j += 1
        if quiet[i] and 0 < i and j < n and (j - i) * h > max_gap * SR:
            sil = np.where(L[i:j] < -50)[0]
            if len(sil):
                a0 = i + min(int(sil[0]), int(0.25 * SR / h))               # the word before has died away
                b0 = i + max(int(sil[-1]) + 1, (j - i) - int(0.12 * SR / h))  # the word after begins
            else:  # no true silence: a breath or a long soft tail; keep 0.12 s after and 0.08 s before
                a0, b0 = i + int(0.12 * SR / h) - g, j - int(0.08 * SR / h) + g
            ka, kb = a0 + g, b0 - g
            if kb - ka >= 4:
                keep.append(a[pos:ka * h + w // 2]); pos = kb * h + w // 2
        i = j
    keep.append(a[pos:])
    return xjoin(keep)


def hold_point(a, t_next, lo, hi):
    """Where a held breath goes: the middle of the silence that best separates the word before from the word after.
    t_next is whisper's start of the next word (its starts are better than its ends); lo..hi bound the search (s)."""
    L, h, w = level(a)
    sil = L < -45
    runs, i = [], 0
    while i < len(L):
        j = i
        while j < len(L) and sil[j] == sil[i]:
            j += 1
        if sil[i] and (j - i) * h >= 0.02 * SR:
            c = ((i + j) / 2 * h + w / 2) / SR
            if lo <= c <= hi:
                runs.append(((j - i) * h / SR - 0.6 * abs(c - (t_next - 0.05)), c))
        i = j
    if runs:
        return int(max(runs)[1] * SR)
    k0, k1 = max(0, int((t_next - 0.2) * SR / h)), min(len(L), int((t_next + 0.1) * SR / h) + 1)
    return int((k0 + int(np.argmin(L[k0:k1]))) * h + w // 2)  # no silence there: the quietest instant before the next word


def tempo(a, k):
    """Change speed without changing pitch."""
    if abs(k - 1) < 1e-3:
        return a
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', f'atempo={k}',
                        '-f', 'f32le', '-'], input=a.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()


class VoiceChanger:
    """ElevenLabs speech-to-speech on one phrase; cached by input audio + settings."""
    def __init__(self, v, cache):
        self.v, self.cache = v, cache
        cache.mkdir(parents=True, exist_ok=True)

    def __call__(self, a):
        key = hashlib.sha1(json.dumps(self.v, sort_keys=True).encode() + a.astype(np.float32).tobytes()).hexdigest()[:16]
        f = self.cache / f'sts_{key}.mp3'
        if not f.exists():
            k = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
            buf = io.BytesIO(); sf.write(buf, a, SR, format='WAV', subtype='PCM_16')
            settings = {x: self.v[x] for x in ('stability', 'similarity_boost', 'style', 'use_speaker_boost') if x in self.v}
            r = requests.post(f"https://api.elevenlabs.io/v1/speech-to-speech/{self.v['voice_id']}", headers={'xi-api-key': k},
                              params={'output_format': 'mp3_44100_128'}, timeout=180,
                              data={'model_id': self.v.get('model', 'eleven_multilingual_sts_v2'), 'voice_settings': json.dumps(settings),
                                    'remove_background_noise': 'false'},
                              files={'audio': ('phrase.wav', buf.getvalue(), 'audio/wav')})
            if r.status_code != 200:
                sys.exit(f'ElevenLabs speech-to-speech failed: {r.status_code} {r.text[:300]}')
            f.write_bytes(r.content)
        return decode(f.read_bytes())


class Kokoro:
    def __init__(self, v):
        from kokoro import KPipeline
        self.v, self.pipe = v, KPipeline(lang_code='a')
        self.ratio = 2 ** (-v.get('pitch_semitones', 0) / 12)  # tape-style deepen

    def __call__(self, text, prev, nxt):
        text = untag(text)  # eleven_v3 audio tags ([serious]...) would be read out loud
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


TAG = re.compile(r'\[[^\]]*\]\s*')
untag = lambda s: TAG.sub('', s).strip()  # [excited] So... -> So...


class Cached:
    def __init__(self, v, cache, ep=None):
        self.v, self.cache, self.ep = v, cache, ep
        cache.mkdir(parents=True, exist_ok=True)

    def key(self, *parts):
        return hashlib.sha1(json.dumps([self.v, *parts], sort_keys=True).encode()).hexdigest()[:16]


class ElevenLabs(Cached):
    def __call__(self, text, prev, nxt, take=0):
        f = self.cache / f"el_{self.key(text, prev, nxt)}.json"
        if self.v.get('model', '').startswith('eleven_v3'):  # v3 ignores the neighbours: key on the text alone
            legacy, f = f, self.cache / f"el_{self.key(text)}.json"
            if not f.exists() and legacy.exists(): shutil.copyfile(legacy, f)
            if take: f = self.cache / f"el_{self.key(text, 'take', take)}.json"  # another reading: its own seed and file
        if not f.exists():
            key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
            v = self.v
            model = v.get('model', 'eleven_multilingual_v2')
            body = {'text': text, 'model_id': model,
                    'voice_settings': {'stability': v.get('stability', 0.4), 'similarity_boost': v.get('similarity', 0.8),
                                       'style': v.get('style', 0.3), 'use_speaker_boost': True, 'speed': v.get('speed', 1.0)}}
            if model.startswith('eleven_v3'):  # v3 reads [audio tags] in the text; no request stitching, stability is 0 / 0.5 / 1
                body['voice_settings'] = {'stability': v.get('stability', 0.5), 'similarity_boost': v.get('similarity', 0.8)}
                if v.get('seed') is not None: body['seed'] = v['seed']
                if take: body['seed'] = 1000 + take
            else:
                body.update(previous_text=prev, next_text=nxt)
            r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voice_id']}/with-timestamps",
                              params={'output_format': 'mp3_44100_128'}, headers={'xi-api-key': key}, timeout=120, json=body)
            if r.status_code != 200: sys.exit(f'ElevenLabs {r.status_code}: {r.text[:300]}')
            f.write_text(r.text)
        d = json.loads(f.read_text())
        al = d.get('alignment') or d.get('normalized_alignment')
        if TAG.search(text):  # character timings would include the [tags]: measure the words with whisper instead
            return recognize(decode(base64.b64decode(d['audio_base64'])), untag(text))
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
    x = resample_poly(a, 160, 441).astype(np.float32)

    def heard(prompt):
        res = _asr.transcribe(x, language='en', word_timestamps=True, initial_prompt=prompt, fp16=False)
        return [(w['word'].strip(), max(w['start'], onset if i == 0 else 0), w['end'])
                for i, w in enumerate(w for s in res['segments'] for w in s['words'])]
    h = heard(text)
    # the prompt can make whisper skip the opening sentence (it "already read" it), which piles those words onto
    # one instant; the unprompted pass then has the true times
    if text and len(h) < len(text.split()) - 1:
        hb = heard(None)
        if len(hb) > len(h): h = hb
    return a, h


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
            score = similar(text, blind(a))
            if best is None or score > best[0]: best = (score, a, heard)
            if score >= 0.97:
                break
            print(f'  retake ({score:.2f}): {text!r}')
        return best[1], best[2]


def blind(a):
    """Unprompted transcription for verification (a prompt would make whisper 'hear' the script)."""
    recognize(a[:SR // 10], '')  # make sure the model is loaded
    return _asr.transcribe(resample_poly(a, 160, 441).astype(np.float32), language='en', fp16=False)['text']


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
    fx = script.get('voice_fx', {})
    eng2 = fx.get('engine') == 2  # see level(): pauses cut only in true silence, holds in the gap, take ends repaired
    sts = VoiceChanger(fx['sts'], build / 'tts_cache') if fx.get('sts') else None
    ph = script['phrases']
    out, phrases = [], []
    t = script.get('lead_in', 0.0)
    out.append(np.zeros(int(t * SR)))
    for i, p in enumerate(ph):
        say = p.get('say', p['text'])
        kw = {'take': p['take']} if p.get('take') and prov == 'elevenlabs' else {}  # "take": n -> another reading of the line
        audio, heard = tts(say, ph[i - 1].get('say', ph[i - 1]['text']) if i else '', ph[i + 1].get('say', ph[i + 1]['text']) if i + 1 < len(ph) else '', **kw)
        k_tempo, gap = p.get('tempo', fx.get('tempo', 1)), p.get('max_gap', fx.get('max_gap'))  # a phrase can have its own
        if eng2: audio = tail_fix(trim(audio)[0])
        if k_tempo != 1 or sts or gap:
            audio = tempo(trim(audio)[0], k_tempo)
            if gap: audio = (squeeze2 if eng2 else squeeze)(audio, gap)
            if sts: audio = sts(audio)
            audio, heard = recognize(audio, untag(say))  # timings change with tempo and voice: measure again
        if eng2:  # every take is checked by ear, so to speak: an unprompted transcription against the script
            sc = similar(untag(say), blind(audio))
            if sc < 0.9: print(f"  [{p['id']}] CHECK THE TAKE: heard {sc:.2f} of the line: {blind(audio)!r}")
        audio, cut = trim(audio)
        if p.get('tail_db') is not None:  # a tail of hiss or a click after the last word: cut after the last loud 30 ms
            n = int(0.03 * SR); k = len(audio) // n
            r = np.sqrt((audio[:k * n].reshape(k, n) ** 2).mean(axis=1) + 1e-12)
            loud = np.where(20 * np.log10(r / max(1e-9, np.abs(audio).max())) > p['tail_db'])[0]
            if len(loud):
                e = min(len(audio), (loud[-1] + 1) * n + int(0.08 * SR)); f = min(e, int(0.02 * SR))
                audio = audio[:e].copy(); audio[-f:] *= np.linspace(1, 0, f)
        if p.get('echo'):  # [delay s, decay]: a shouted line rings out like in a hall
            dl, dk = p['echo']; n = int(dl * SR)
            out_e = np.concatenate([audio, np.zeros(n * 4)])
            for k in range(1, 5): out_e[n * k:n * k + len(audio)] += audio * dk ** k
            audio = out_e
        dur = len(audio) / SR
        caps = p['text'].split()
        heard = [(w, s - cut, e - cut) for w, s, e in heard]
        if len(heard) == len(caps):
            spans = [(max(0.0, s), min(dur, e)) for _, s, e in heard]
        else:
            print(f"  [{p['id']}] {len(heard)} heard vs {len(caps)} words -> aligned")
            spans = align(caps, heard, dur)
        holds = p.get('hold') or []  # {"after": word, "sec": s}: a held breath inside the line, for a big move to land in
        for hd in sorted([holds] if isinstance(holds, dict) else holds, key=lambda hd: -caps.index(hd['after'])):
            k = caps.index(hd['after']); hs = hd['sec']
            if eng2 and k + 1 < len(spans):  # in the silence between the two words, wherever whisper put their edges
                n0 = hold_point(audio, spans[k + 1][0], spans[k][0] + 0.05, spans[k + 1][1] - 0.03)
                spans = [(max(s, n0 / SR) + hs, max(e, n0 / SR) + hs) if i > k else (min(s, n0 / SR), min(e, n0 / SR)) for i, (s, e) in enumerate(spans)]
            else:
                n0 = int(((spans[k][1] + spans[k + 1][0]) / 2 if k + 1 < len(spans) else spans[k][1]) * SR)
                spans = [(s + hs, e + hs) if i > k else (s, e) for i, (s, e) in enumerate(spans)]
            f = int(0.01 * SR)
            audio = audio.copy(); audio[max(0, n0 - f):n0] *= np.linspace(1, 0, n0 - max(0, n0 - f)); audio[n0:n0 + f] *= np.linspace(0, 1, len(audio[n0:n0 + f]))
            audio = np.concatenate([audio[:n0], np.zeros(int(hs * SR)), audio[n0:]])
            dur = len(audio) / SR
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
