"""Dub a finished episode into another language (rule 75: the French versions).

    python3 audio/dub.py episodes/<ep> fr --take <mp3 made on the ElevenLabs website>
    node render.mjs <ep> [--scale 2] --caps fr --out fr/video.mp4      # the picture with the French captions
    then mux build/fr/video.mp4 with build/fr/mix.wav and encode as in CLAUDE.md -> "<name>_FR.mp4"

episodes/<ep>/script_<lang>.json holds the voice and the translated narration as beats: `fr`, what the voice says (an
audio "tag" may come before it), `text`, its caption (digits allowed), `colors`, as in script.json. Each beat is
anchored to a word of the English narration, [phrase id, word index] in build/timings.json (the timeline of the
delivered film), so every sentence keeps its shot. The voice is one TTS request per phrase or, with --take, one take of
the whole text made on the ElevenLabs website (free accounts cannot use library voices through the API). Either way it
is transcribed (Scribe), matched to the script word by word and cut between the beats at the quietest point; each beat
starts on its anchor (its first heard word, not a breath before it) and is sped up only as much as its slot needs (up
to voice_fx.max_tempo, inner pauses squeezed to voice_fx.max_gap). The music, effects and ambience are the episode's
own stems (build/stems_*.wav): the ducking under the English voice is undone and done again under the new one, the
effects dip under it too (mix.sfx_duck), and the new voice sits at the English voice's loudness, so the balance of the
approved mix stays.

Writes build/<lang>/narration.wav, timings.json, captions.json (the new words with their times, drawn by
`render.mjs --caps <lang>`) and mix.wav; with --video and --out, also a quick .mp4 over the delivered picture (its
captions stay English). TTS and transcription requests need ELEVENLABS_API_KEY; answers are cached in
build/<lang>/tts_cache, so a re-run costs no credits.
"""
import argparse
import base64
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

import numpy as np
import requests
import soundfile as sf

sys.path.insert(0, str(Path(__file__).parent))
import mix as M  # noqa: E402
import tts as T  # noqa: E402

SR = T.SR
VOICE_CHAIN = ('highpass=f=70,equalizer=f=140:t=q:w=1.0:g=2.5,equalizer=f=3200:t=q:w=1.2:g=2,'
               'acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=4,aecho=0.8:0.5:28|47:0.12|0.08')  # as mix.py


def synth(v, text, prev, nxt, cache):
    """ElevenLabs with-timestamps -> (mono audio at SR, character alignment of `text`)."""
    model = v.get('model', 'eleven_multilingual_v2')
    body = {'text': text, 'model_id': model,
            'voice_settings': {'stability': v.get('stability', 0.4), 'similarity_boost': v.get('similarity', 0.8),
                               'style': v.get('style', 0.3), 'use_speaker_boost': True, 'speed': v.get('speed', 1.0)}}
    if model.startswith('eleven_v3'):
        body['voice_settings'] = {'stability': v.get('stability', 0.5), 'similarity_boost': v.get('similarity', 0.8)}
    elif not model.startswith('eleven_v4'):  # v3 and v4 read [audio tags] and are not stitched to their neighbours
        if prev: body['previous_text'] = prev
        if nxt: body['next_text'] = nxt
    if v.get('language_code'): body['language_code'] = v['language_code']
    if v.get('seed') is not None: body['seed'] = v['seed']
    key = hashlib.sha1(json.dumps([v['voice_id'], body], sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    cache.mkdir(parents=True, exist_ok=True)
    f = cache / f'el_{key}.json'
    if not f.exists():
        k = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
        r = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{v['voice_id']}/with-timestamps",
                          params={'output_format': 'mp3_44100_128'}, headers={'xi-api-key': k}, json=body, timeout=180)
        if r.status_code != 200:
            sys.exit(f'ElevenLabs {r.status_code}: {r.text[:300]}')
        f.write_text(r.text, encoding='utf-8')
    d = json.loads(f.read_text(encoding='utf-8'))
    al = d.get('alignment') or d.get('normalized_alignment')
    return T.decode(base64.b64decode(d['audio_base64'])), al


def char_times(al, text):
    """Start and end time of every character of `text` (the alignment can differ slightly from the request)."""
    chars = al['characters']; st, en = al['character_start_times_seconds'], al['character_end_times_seconds']
    if ''.join(chars) == text:
        return st, en
    s, e = [None] * len(text), [None] * len(text)
    for blk in difflib.SequenceMatcher(None, text, ''.join(chars), autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            s[blk.a + k], e[blk.a + k] = st[blk.b + k], en[blk.b + k]
    last = 0.0
    for i in range(len(text)):  # characters the alignment skipped take the time of their neighbour
        if s[i] is None: s[i] = e[i] = last
        last = e[i]
    return s, e


def letters(text, c0, c1):
    return [i for i in range(c0, c1) if text[i].isalnum()]


def say_number(n, lang='fr'):
    """A whole number as it is read, in French (0 to 999 999: 149 -> cent quarante-neuf); other languages keep the digits."""
    if lang != 'fr':
        return str(n)
    units = 'zéro un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze quinze seize'.split()
    tens = {2: 'vingt', 3: 'trente', 4: 'quarante', 5: 'cinquante', 6: 'soixante'}

    def b100(x):
        if x < 17: return units[x]
        if x < 20: return 'dix-' + units[x - 10]
        t, u = divmod(x, 10)
        if t == 7: return 'soixante et onze' if x == 71 else 'soixante-' + b100(x - 60)
        if t == 9: return 'quatre-vingt-' + b100(x - 80)
        if t == 8: return 'quatre-vingts' if u == 0 else 'quatre-vingt-' + units[u]
        return tens[t] if u == 0 else tens[t] + (' et un' if u == 1 else '-' + units[u])

    def b1000(x):
        h, r = divmod(x, 100)
        if h == 0: return b100(r)
        head = 'cent' if h == 1 else units[h] + (' cents' if r == 0 else ' cent')
        return head if r == 0 else head + ' ' + b100(r)
    if n < 1000:
        return b1000(n)
    th, r = divmod(n, 1000)
    head = 'mille' if th == 1 else b1000(th) + ' mille'
    return head if r == 0 else head + ' ' + b1000(r)


def tok(w):
    """A loose key for a word: no accents, no punctuation, no silent final s/x/e (tir = tire, leurs = leur, aux = au)."""
    w = re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', w.lower()).encode('ascii', 'ignore').decode())
    return re.sub(r'[sxe]+$', '', w) or w


def transcribe(a, lang, cache):
    """ElevenLabs Scribe on one take -> [(word, start, end)] as heard, numbers spelt out (cached; speech-to-text is
    billed in hours of audio, not in TTS credits)."""
    import io
    cache.mkdir(parents=True, exist_ok=True)
    f = cache / f"stt_{hashlib.sha1(a.astype(np.float32).tobytes()).hexdigest()[:16]}.json"
    if not f.exists():
        buf = io.BytesIO(); sf.write(buf, a, SR, format='FLAC')
        k = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
        r = requests.post('https://api.elevenlabs.io/v1/speech-to-text', headers={'xi-api-key': k}, timeout=300,
                          data={'model_id': 'scribe_v2', 'language_code': lang, 'tag_audio_events': 'false', 'timestamps_granularity': 'word'},
                          files={'file': ('take.flac', buf.getvalue(), 'audio/flac')})
        if r.status_code != 200:
            sys.exit(f'ElevenLabs speech-to-text {r.status_code}: {r.text[:300]}')
        f.write_text(r.text, encoding='utf-8')
    out = []
    for w in json.loads(f.read_text(encoding='utf-8')).get('words', []):
        if w.get('type', 'word') != 'word': continue
        if re.fullmatch(r'\d+\W?', w['text']):
            out += [(x, w['start'], w['end']) for x in say_number(int(re.sub(r'\D', '', w['text'])), lang).split()]
        else:
            out.append((w['text'], w['start'], w['end']))
    return out


def match(words, heard):
    """For each script word, the index of the heard word it matches (in order), or None. Words are compared by their
    hyphen-separated parts, so a hyphenation the transcript does not share still matches ("Cinquante et unième" heard as
    one word "Cinquante-et-unième": all three script words take that word, and the beat's first word lands on its anchor)."""
    def parts(ws):
        toks, own = [], []
        for i, w in enumerate(ws):
            for p in w.split('-'):
                t = tok(p)
                if re.search(r'[a-z0-9]', t): toks.append(t); own.append(i)
        return toks, own
    a, oa = parts(words); b, ob = parts([h[0] for h in heard])
    m = [None] * len(words)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            i = oa[blk.a + k]
            if m[i] is None: m[i] = ob[blk.b + k]
    return m


def tidy(seg, pre=0.03, post=0.08, thr=-38, keep=None):
    """Trim a beat to its sound (with a little air; never after `keep` s, the start of its first word), short fades.
    Returns the trimmed beat, its voiced onset and where the trim began (s)."""
    hop = int(0.005 * SR); db = T._env_db(seg, hop)
    idx = np.where(db > thr)[0]
    if not len(idx):
        return seg[:0], 0.0, 0.0
    first = idx[0] * hop if keep is None else min(idx[0] * hop, max(0, int(keep * SR)))
    s0 = max(0, first - int(pre * SR)); s1 = min(len(seg), (idx[-1] + 1) * hop + int(post * SR))
    out = seg[s0:s1].copy()
    f0, f1 = min(len(out), int(0.004 * SR)), min(len(out), int(0.03 * SR))
    out[:f0] *= np.linspace(0, 1, f0); out[len(out) - f1:] *= np.linspace(1, 0, f1)
    return out, (idx[0] * hop - s0) / SR, s0 / SR


def take(sc, p, say, prev, nxt, lang, cache, words, owner, retakes):
    """The phrase's first take whose transcript holds every beat (expressive engines drop words now and then): new
    seeds until each beat has at least 3/4 of its words and the phrase 9/10, else the best one."""
    best = None
    for k in range(retakes):
        v = dict(sc['voice'])
        if p.get('seed') is not None: v['seed'] = p['seed'] + k
        elif k: v['seed'] = 1000 + 37 * k
        audio, al = synth(v, say, prev, nxt, cache)
        heard = transcribe(audio, lang, cache)
        m = match(words, heard)
        cov = [float(np.mean([m[i] is not None for i in range(len(words)) if owner[i] == j] or [1.0])) for j in range(max(owner) + 1)]
        score = (min(cov), float(np.mean(cov)))
        if best is None or score > best[0]: best = (score, audio, al, heard, m, v.get('seed'))
        if min(cov) >= 0.75 and np.mean(cov) >= 0.9: break
        print(f"  [{p['id']}] retake {k + 1}: heard {' '.join(h[0] for h in heard)!r}")
    (sc_min, sc_mean), audio, al, heard, m, seed = best
    if sc_min < 0.75: print(f"  [{p['id']}] WARNING: words missing in the best take ({sc_min:.2f})")
    return audio, al, heard, m, seed


def script_words(beats):
    """The words of the beats as the voice says them (marks alone are not words), and the beat of each."""
    words, owner = [], []
    for j, b in enumerate(beats):
        for w in b['fr'].split():
            if re.search(r'\w', w): words.append(w); owner.append(j)
    return words, owner


def external_takes(path, sc, lang, cache):
    """A narration recorded outside the API (on the ElevenLabs website: the whole script in one file, any pauses):
    transcribed, matched to the script word by word and cut into its phrases at the quietest point between them.
    -> {phrase id: (audio, heard words, matches)}, as an API take would give them."""
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True)
    a = np.frombuffer(p.stdout, np.float32).copy()
    heard = transcribe(a, lang, cache)
    per = [script_words(ph['beats'])[0] for ph in sc['phrases']]
    words = [w for ws in per for w in ws]; owner = [pi for pi, ws in enumerate(per) for _ in ws]
    m = match(words, heard)
    cuts = [0]
    for pi in range(len(per) - 1):
        last = [i for i in range(len(words)) if owner[i] == pi and m[i] is not None]
        nxt = [i for i in range(len(words)) if owner[i] == pi + 1 and m[i] is not None]
        t0 = heard[m[last[-1]]][2] if last else cuts[-1] / SR
        t1 = heard[m[nxt[0]]][1] if nxt else t0
        cuts.append(max(cuts[-1], T.quiet_cut(a, t0, max(t0, t1))))
    cuts.append(len(a))
    out = {}
    for pi, ph in enumerate(sc['phrases']):
        c0, c1 = cuts[pi], cuts[pi + 1]
        hs = [(h[0], h[1] - c0 / SR, h[2] - c0 / SR) for h in heard if c0 / SR - 0.05 <= h[1] < c1 / SR]
        pm = match(per[pi], hs)
        miss = [per[pi][i] for i in range(len(pm)) if pm[i] is None]
        if miss: print(f"  [{ph['id']}] not heard in the take: {' '.join(miss)}")
        out[ph['id']] = (a[c0:c1], hs, pm)
    return out


def alignment_from_words(say, spans, beats, heard, m):
    """A character alignment of `say`, rebuilt from the heard word times (for a take made outside the API)."""
    st, en, wi = [None] * len(say), [None] * len(say), 0
    for (c0, _), b in zip(spans, beats):
        for mt in re.finditer(r'\S+', b['fr']):
            if not re.search(r'\w', mt.group()): continue
            hi = m[wi]; wi += 1
            if hi is None: continue
            for c in range(c0 + mt.start(), c0 + mt.end()): st[c], en[c] = heard[hi][1], heard[hi][2]
    last = 0.0
    for i in range(len(say)):
        if st[i] is None: st[i] = en[i] = last
        last = en[i]
    return {'characters': list(say), 'character_start_times_seconds': st, 'character_end_times_seconds': en}


def build_voice(ep, lang, sc, t, cache, only=None, external=None):
    """All phrases -> beats placed on their anchors. Returns the narration track and the beat table. `external`:
    takes recorded outside the API (external_takes) instead of TTS requests."""
    fx = sc.get('voice_fx', {}); base, kmax, gap = fx.get('tempo', 1.0), fx.get('max_tempo', 1.15), fx.get('max_gap', 0.3)
    dur = t['duration']; n = int(round(dur * SR))
    beats = []
    for p in sc['phrases']:
        for b in p['beats']:
            at = b['at']
            if isinstance(at, (list, tuple)):
                ph = next(q for q in t['phrases'] if q['id'] == at[0]); at = ph['words'][at[1]]['s']
            beats.append({'phrase': p['id'], 'fr': b['fr'], 'at': float(at), 'text': b.get('text', b['fr']), 'colors': b.get('colors', {})})
    for i, b in enumerate(beats):  # each beat's slot ends at the next anchor; the last one where the English voice ended
        b['until'] = beats[i + 1]['at'] if i + 1 < len(beats) else t['phrases'][-1]['words'][-1]['e'] + sc.get('end_slack', 0.3)
    track = np.zeros(n, np.float32); cursor = 0.0; k_used = []
    phrases = sc['phrases']
    for pi, p in enumerate(phrases):
        if only and p['id'] not in only:
            continue
        say, spans, c = '', [], 0
        for b in p['beats']:
            if say: say += ' '; c += 1
            if b.get('tag'):  # an eleven_v3 audio tag ([tense]...) before the beat: read by the model, never a word of the beat
                say += b['tag'] + ' '; c += len(b['tag']) + 1
            spans.append((c, c + len(b['fr']))); say += b['fr']; c += len(b['fr'])
        prev = ' '.join(b['fr'] for b in phrases[pi - 1]['beats']) if pi else ''
        nxt = ' '.join(b['fr'] for b in phrases[pi + 1]['beats']) if pi + 1 < len(phrases) else ''
        words, owner = script_words(p['beats'])
        if external is not None:
            audio, heard, m = external[p['id']]; seed = None
            al = alignment_from_words(say, spans, p['beats'], heard, m)
        else:
            audio, al, heard, m, seed = take(sc, p, say, prev, nxt, lang, cache, words, owner, fx.get('retakes', 4))
        st, en = char_times(al, say)

        def heard_edge(j, last):  # end of the beat's last heard word, or start of its first one
            idx = [i for i in range(len(words)) if owner[i] == j and m[i] is not None]
            return None if not idx else heard[m[idx[-1]]][2] if last else heard[m[idx[0]]][1]
        cuts = [0]
        for j, ((a0, a1), (b0, b1)) in enumerate(zip(spans, spans[1:])):  # cut between beats where the words really are
            t0, t1 = heard_edge(j, True), heard_edge(j + 1, False)
            if t0 is None: t0 = en[letters(say, a0, a1)[-1]]
            if t1 is None or t1 <= t0: t1 = max(t0, st[letters(say, b0, b1)[0]])
            cuts.append(T.quiet_cut(audio, t0, t1))
        cuts.append(len(audio))
        mine = [b for b in beats if b['phrase'] == p['id']]
        for j, b in enumerate(mine):
            w0 = heard_edge(j, False)
            w0 = None if w0 is None else w0 - cuts[j] / SR  # its first word, in the segment
            seg, onset, trim0 = tidy(audio[cuts[j]:cuts[j + 1]], keep=w0)
            if w0 is not None: onset = max(0.0, w0 - trim0)  # the first word, not a breath before it, lands on the anchor
            kin = kout = np.array([0.0, 1e9])
            if gap:
                seg, (kin, kout) = T.squeeze(seg, gap, with_map=True); onset = float(np.interp(onset * SR, kin, kout)) / SR
            slot = b['until'] - b['at'] - 0.06
            d0 = len(seg) / SR - onset  # onset to end, at speed 1
            k = max(base, min(kmax, d0 / max(0.05, slot)))
            a = T.tempo(seg, k); on = onset / k; d = len(a) / SR - on
            start = max(b['at'] - on, cursor)
            s0 = int(round(start * SR)); a = a[:max(0, n - s0)]
            track[s0:s0 + len(a)] += a
            cursor = start + len(a) / SR + 0.04
            b.update(start=round(start + on, 3), end=round(start + len(a) / SR, 3), tempo=round(k, 3), seed=seed,
                     late=round(start + on - b['at'], 3), over=round(max(0.0, start + len(a) / SR - b['until']), 3))
            # each spoken word on the film's timeline: its heard time carried through the cut, the trim, the squeeze, the tempo
            place = lambda tr, c0=cuts[j] / SR, t0=trim0, ki=kin, ko=kout, st0=start, kk=k: st0 + float(np.interp((tr - c0 - t0) * SR, ki, ko)) / SR / kk
            idx = [i for i in range(len(words)) if owner[i] == j]
            spoken = [[words[i], *((place(heard[m[i]][1]), place(heard[m[i]][2])) if m[i] is not None else (None, None))] for i in idx]
            b['words'] = caption_words(b, fill_times(spoken, b['start'], b['end']), lang)
            k_used.append(k)
    return track, beats


def fill_times(spoken, s0, e0):
    """Words the transcript missed get times between their neighbours, in proportion to their length."""
    out = [list(x) for x in spoken]
    i = 0
    while i < len(out):
        if out[i][1] is not None: i += 1; continue
        j = i
        while j < len(out) and out[j][1] is None: j += 1
        a = out[i - 1][2] if i else s0
        z = out[j][1] if j < len(out) else e0
        L = np.cumsum([0] + [len(w[0]) + 1 for w in out[i:j]]); L = L / L[-1]
        for k in range(i, j): out[k][1], out[k][2] = a + (z - a) * L[k - i], a + (z - a) * L[k - i + 1]
        i = j
    return out


def caption_words(b, spoken, lang):
    """The beat's caption (its `text`: digits allowed, 149–0 for 'cent quarante-neuf à zéro') with the time of each word,
    taken from the spoken words it stands for; a lone mark (! ? :) joins the word before it, French style."""
    disp = []
    for w in b['text'].split(' '):  # plain spaces only: a no-break space keeps "20 000" one caption word
        if not w: continue
        if disp and not re.search(r'\w', w): disp[-1] = (disp[-1][0] + ' ' + w, disp[-1][1]); continue
        disp.append((w, w))
    def keys(w):
        if re.search(r'\d', w):
            w = re.sub(r'(?<=\d)[  ](?=\d)', '', w)  # 20 000 -> 20000 -> vingt mille
            return [tok(y) for x in re.findall(r'\d+', w) for y in say_number(int(x), lang).split()]
        return [tok(w)]
    flat, own = [], []
    for di, (w, _) in enumerate(disp):
        for kk in keys(w): flat.append(kk); own.append(di)
    sm = difflib.SequenceMatcher(None, flat, [tok(s[0]) for s in spoken], autojunk=False)
    hit = [[] for _ in disp]
    for blk in sm.get_matching_blocks():
        for k in range(blk.size): hit[own[blk.a + k]].append(blk.b + k)
    times = [(min(spoken[x][1] for x in h), max(spoken[x][2] for x in h)) if h else (None, None) for h in hit]
    times = [t[1:] for t in fill_times([[w, *tm] for (w, _), tm in zip(disp, times)], b['start'], b['end'])]
    return [{'w': w, 's': round(s, 3), 'e': round(e, 3), 'c': b['colors'].get(base, 'lime')} for (w, base), (s, e) in zip(disp, times)]


def stereo(x):
    return x if x.ndim == 2 else np.stack([x, x], 1)


def envelope(x, win=0.08):
    """mix.envelope (a centred moving RMS, scaled to its peak) through an FFT: the same numbers, seconds instead of minutes."""
    from scipy.signal import fftconvolve
    n = int(win * SR)
    e = np.sqrt(np.clip(fftconvolve(x.astype(np.float64) ** 2, np.ones(n) / n, 'same'), 0, None))
    return e / max(1e-6, e.max())


def duck_gain(voice, depth):
    return 1 - depth * np.clip(envelope(voice[:, 0], 0.25) * 2.2, 0, 1)


def mix_lang(ep, lang, narr, sc):
    import pyloudnorm as pyln
    b, out = Path(ep) / 'build', Path(ep) / 'build' / lang
    cfg = json.loads((Path(ep) / 'script.json').read_text(encoding='utf-8')).get('mix', {})
    vv_en = stereo(sf.read(b / 'stems_voice.wav', dtype='float32')[0]); n = len(vv_en)
    m = stereo(sf.read(b / 'stems_music.wav', dtype='float32')[0])[:n]
    fx = stereo(sf.read(b / 'stems_sfx.wav', dtype='float32')[0])[:n]
    amb = stereo(sf.read(b / 'stems_amb.wav', dtype='float32')[0])[:n] if (b / 'stems_amb.wav').exists() else np.zeros((n, 2), np.float32)
    v = M.ffilter(np.pad(narr, (0, max(0, n - len(narr))))[:n], VOICE_CHAIN)[:n]
    vv = stereo(np.pad(v, (0, n - len(v))))
    meter = pyln.Meter(SR)
    lv_en, lv = meter.integrated_loudness(vv_en), meter.integrated_loudness(vv)
    vv = vv * 10 ** ((lv_en - lv) / 20)  # the new voice at the loudness of the English one: the approved balance stays
    if cfg.get('engine') == 'v2':
        d = cfg.get('duck', 0.45)
        m = m * (duck_gain(vv, d) / duck_gain(vv_en, d))[:, None]
        if np.abs(amb).max() > 1e-5:
            da = cfg.get('amb_duck', 0.3)
            amb = amb * (duck_gain(vv, da) / duck_gain(vv_en, da))[:, None]
    else:  # the v1 bed (music + effects in one stem) keeps the English dips; it dips under the new voice as well
        m = m * duck_gain(vv, 0.3)[:, None]
    fx = fx * duck_gain(vv, sc.get('mix', {}).get('sfx_duck', 0.3))[:, None]
    mixd = vv + m + fx + amb
    sf.write(out / 'stems_voice.wav', vv, SR); sf.write(out / 'stems_music.wav', m, SR); sf.write(out / 'stems_sfx.wav', fx, SR)
    if np.abs(amb).max() > 1e-5: sf.write(out / 'stems_amb.wav', amb, SR)
    sf.write(out / 'mix_raw.wav', (mixd / max(1e-6, np.abs(mixd).max()) * 0.9).astype(np.float32), SR)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', out / 'mix_raw.wav', '-af',
                    'alimiter=limit=0.9:attack=3:release=50,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', out / 'mix.wav'], check=True)
    print(f'  voice {lv_en:.1f} LUFS (as the English), music re-ducked under it, effects ducked by {sc.get("mix", {}).get("sfx_duck", 0.3)}')
    return out / 'mix.wav'


def mux(video, wav, dst):
    vd = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(video)],
                              capture_output=True, text=True, check=True).stdout)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(video), '-i', str(wav), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '160k', '-t', f'{vd:.3f}', '-movflags', '+faststart', str(dst)], check=True)
    print('->', dst)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ep'); ap.add_argument('lang')
    ap.add_argument('--video', help='the delivered film, whose picture is kept'); ap.add_argument('--out')
    ap.add_argument('--only', help='phrase ids, comma-separated: synthesize those only (a check, no mix)')
    ap.add_argument('--take', help='the whole narration recorded outside the API (the ElevenLabs website), instead of TTS requests')
    a = ap.parse_args()
    ep = Path(a.ep); out = ep / 'build' / a.lang; out.mkdir(parents=True, exist_ok=True)
    sc = json.loads((ep / f'script_{a.lang}.json').read_text(encoding='utf-8'))
    t = json.loads((ep / 'build' / 'timings.json').read_text(encoding='utf-8'))
    ext = external_takes(a.take, sc, a.lang, out / 'tts_cache') if a.take else None
    narr, beats = build_voice(ep, a.lang, sc, t, out / 'tts_cache', a.only.split(',') if a.only else None, ext)
    for b in beats:
        if 'start' not in b: continue
        flag = '  LATE' if b['late'] > 0.12 else ''
        flag += '  OVER' if b['over'] > 0 else ''
        print(f"{b['at']:6.2f} {b['start']:6.2f}-{b['end']:6.2f} slot {b['until'] - b['at']:4.2f} x{b['tempo']:.2f}{flag}  {b['fr']}")
    sf.write(out / 'narration.wav', narr, SR)
    (out / 'timings.json').write_text(json.dumps({'duration': t['duration'], 'lang': a.lang, 'beats': beats}, indent=1, ensure_ascii=False), encoding='utf-8')
    # the captions of this version, in the engine's timings format: node render.mjs <ep> --caps <lang>
    caps = [{'id': p['id'], 'words': [w for b in beats if b['phrase'] == p['id'] for w in b.get('words', [])]} for p in sc['phrases']]
    (out / 'captions.json').write_text(json.dumps({'duration': t['duration'], 'phrases': [c for c in caps if c['words']]}, indent=1, ensure_ascii=False), encoding='utf-8')
    if a.only:
        return
    wav = mix_lang(ep, a.lang, narr, sc)
    if a.video and a.out:
        mux(a.video, wav, a.out)


if __name__ == '__main__':
    main()
