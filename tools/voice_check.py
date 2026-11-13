"""Check an episode's narration for cut words and odd pauses, and pick other readings of a line.

    python3 tools/voice_check.py episodes/<ep>                       report on every phrase
    python3 tools/voice_check.py episodes/<ep> --plot out.png [ids]  the loudness of the narration with its word marks
    python3 tools/voice_check.py episodes/<ep> --takes <id> 1,2,3 ["say text"]
                                                                    other readings of a phrase (ElevenLabs v3, seeds
                                                                    1000 + n; cached, so "take": n in script.json
                                                                    then costs nothing)
    python3 tools/voice_check.py --quota                             the credits left on the ElevenLabs account and the
                                                                    day they reset. Look before asking for readings:
                                                                    each one costs about a credit per character of
                                                                    the line, and the free plan has 10 000 a month

The report, per phrase (from the takes in build/tts_cache and build/narration.wav after audio/tts.py):
  ends     the level of the take's last 20 ms under its peak. eleven_v3 often stops a take while the last word still
           sounds: above -25 dB a vowel is cut, between -35 and -25 dB usually the release of a final t / k / s or a
           breath (audio/tts.py, voice_fx engine 2, fades either out; a reading that ends in silence is better: ask for
           another with --takes and set "take": n on the phrase)
  heard    what whisper hears without a prompt, against the script (1.00: word for word)
  pauses   silences longer than 0.25 s inside the take, before they are shortened
  f0       the median pitch and its range: a reading far off the others sounds like another speaker
  gaps     in the finished narration: silences inside the phrase longer than voice_fx.max_gap + 0.1 s that are not a
           scripted "hold" (an odd pause), and word marks closer than 30 ms (whisper lost a word: check the frames cut to it)
Needs ELEVENLABS_API_KEY only for readings that are not cached yet.
"""
import base64, json, sys
from pathlib import Path
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'audio'))
import tts  # noqa: E402

SR = tts.SR


def f0(a):
    """Rough pitch by autocorrelation: (median, 10th and 90th percentile) in Hz."""
    from scipy.signal import resample_poly
    x = resample_poly(a, 80, 441).astype(np.float64)
    sr, win, hop, out = 8000, 400, 80, []
    for i in range(0, len(x) - win, hop):
        fr = x[i:i + win] - x[i:i + win].mean()
        if np.sqrt((fr ** 2).mean()) < 0.01: continue
        ac = np.correlate(fr, fr, 'full')[win - 1:]
        lo, hi = sr // 350, sr // 60
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.45 * ac[0]: out.append(sr / k)
    return tuple(int(v) for v in (np.median(out), np.percentile(out, 10), np.percentile(out, 90))) if out else (0, 0, 0)


def runs(L, h, thr, min_s):
    """Stretches of the level track under thr dB that last at least min_s: [(start s, length s)]."""
    q, out, i = L < thr, [], 0
    while i < len(L):
        j = i
        while j < len(L) and q[j] == q[i]: j += 1
        if q[i] and i > 0 and j < len(L) and (j - i) * h / SR >= min_s: out.append((round(i * h / SR, 2), round((j - i) * h / SR, 2)))
        i = j
    return out


def take_stats(raw, say):
    raw, _ = tts.trim(raw)
    L, h, _ = tts.level(raw)
    txt = tts.blind(raw)
    return {'len': len(raw) / SR, 'ends': float(L[-4:].max()), 'heard': tts.similar(tts.untag(say), txt), 'text': txt.strip(), 'pauses': runs(L, h, -50, 0.25), 'f0': f0(raw)}


def report(ep):
    script = json.loads((ep / 'script.json').read_text())
    el = tts.ElevenLabs(script['voice'], ep / 'build' / 'tts_cache')
    fx = script.get('voice_fx', {})
    T = json.loads((ep / 'build' / 'timings.json').read_text()) if (ep / 'build' / 'timings.json').exists() else None
    import soundfile as sf
    nar = sf.read(ep / 'build' / 'narration.wav')[0] if (ep / 'build' / 'narration.wav').exists() else None
    bad = 0
    for p in script['phrases']:
        say = p.get('say', p['text'])
        f = el.cache / (f"el_{el.key(say, 'take', p['take'])}.json" if p.get('take') else f"el_{el.key(say)}.json")
        if not f.exists(): print(f"{p['id']:9s} no cached take (run audio/tts.py)"); continue
        s = take_stats(tts.decode(base64.b64decode(json.loads(f.read_text())['audio_base64'])), say)
        notes = []
        if s['ends'] > -25: notes.append(f"the take ends at {s['ends']:.0f} dB: cut while the voice sounds")
        elif s['ends'] > -35: notes.append(f"the take ends at {s['ends']:.0f} dB: a final consonant or a breath cut short (look at the plot)")
        if s['heard'] < 0.9: notes.append(f"heard {s['heard']:.2f}: {s['text']!r}")
        if T is not None and nar is not None:
            q = next(x for x in T['phrases'] if x['id'] == p['id'])
            seg = nar[int(q['s'] * SR):int(q['e'] * SR)]
            L, h, _ = tts.level(seg)
            holds = p.get('hold') or []
            n_hold = len([holds] if isinstance(holds, dict) else holds)
            odd = [r for r in runs(L, h, -50, p.get('max_gap', fx.get('max_gap', 0.25)) + 0.1)]
            if len(odd) > n_hold: notes.append(f'{len(odd) - n_hold} pause(s) longer than max_gap: {odd}')
            ws = q['words']
            piled = [ws[i]['w'] for i in range(1, len(ws)) if ws[i]['s'] - ws[i - 1]['s'] < 0.03]
            if piled: notes.append(f'word marks piled up at {piled}')
        bad += bool(notes)
        print(f"{p['id']:9s} {s['len']:5.2f}s  ends {s['ends']:4.0f} dB  heard {s['heard']:.2f}  f0 {s['f0']}  pauses {s['pauses']}" + (''.join('\n          ! ' + n for n in notes)))
    print(f'{bad} phrase(s) to look at' if bad else 'no phrase stands out')


def takes(ep, pid, nums, say=None):
    script = json.loads((ep / 'script.json').read_text())
    el = tts.ElevenLabs(script['voice'], ep / 'build' / 'tts_cache')
    say = say or next(x for x in script['phrases'] if x['id'] == pid).get('say')
    print(pid, repr(say))
    for n in nums:
        audio, _ = el(say, '', '', take=n)
        s = take_stats(audio, say)
        print(f"  take {n}: {s['len']:5.2f}s  ends {s['ends']:4.0f} dB  heard {s['heard']:.2f} {s['text']!r}  f0 {s['f0']}  pauses {s['pauses']}")


def plot(ep, out, ids=None):
    import soundfile as sf
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    a, sr = sf.read(ep / 'build' / 'narration.wav')
    ph = [p for p in json.loads((ep / 'build' / 'timings.json').read_text())['phrases'] if not ids or p['id'] in ids]
    fig, axs = plt.subplots(len(ph), 1, figsize=(16, 2.3 * len(ph)), squeeze=False)
    hop = int(0.005 * sr)
    for ax, p in zip(axs[:, 0], ph):
        s, e = p['s'] - 0.25, p['e'] + 0.35
        x = a[max(0, int(s * sr)):int(e * sr)]; n = len(x) // hop
        r = 20 * np.log10(np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1)) + 1e-6)
        ax.fill_between(max(0, s) + np.arange(n) * hop / sr, -90, r, color='#345', lw=0); ax.set_ylim(-80, 0); ax.set_xlim(s, e)
        for w in p['words']:
            ax.axvline(w['s'], color='g', lw=0.8); ax.axvline(w['e'], color='r', lw=0.6, ls=':'); ax.text(w['s'] + 0.01, -8, w['w'], fontsize=9)
        ax.set_ylabel(p['id']); ax.grid(axis='y', alpha=0.3)
    plt.tight_layout(); plt.savefig(out, dpi=70); print(out)


def quota():
    import datetime, os, requests
    key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
    r = requests.get('https://api.elevenlabs.io/v1/user/subscription', headers={'xi-api-key': key}, timeout=30)
    if r.status_code != 200: sys.exit(f'ElevenLabs {r.status_code}: {r.text[:200]}')
    d = r.json()
    reset = datetime.datetime.fromtimestamp(d['next_character_count_reset_unix'], datetime.timezone.utc)
    print(f"plan {d['tier']}: {d['character_count']} of {d['character_limit']} credits used, {d['character_limit'] - d['character_count']} left; resets {reset:%d %b %Y %H:%M} UTC")


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--quota': quota(); sys.exit()
    ep = Path(args[0])
    if '--takes' in args:
        i = args.index('--takes'); takes(ep, args[i + 1], [int(x) for x in args[i + 2].split(',')], args[i + 3] if len(args) > i + 3 else None)
    elif '--plot' in args:
        i = args.index('--plot'); plot(ep, args[i + 1], args[i + 2].split(',') if len(args) > i + 2 else None)
    else:
        report(ep)
