"""Our own cinematic BOOM for shown moves, stamps and camera fly-arounds, built from scratch (no samples from anyone
else's video).

The design follows the profile measured on the hits of a reference short (Oct 2026): almost all energy below 90 Hz,
a sub that falls from ~110-120 Hz to ~45 Hz in the first 0.3 s, a slow swell into the peak, a long tail (-20 dB only
after 0.55-0.9 s) and hardly anything above 2 kHz. A driven second harmonic keeps it audible on phone speakers.
Writes audio/samples/boom_move_*.flac (key moves, fly-arounds) and boom_big_*.flac (mate, the biggest reveals) and
registers them in manifest.json.

    python3 audio/sfx_boom.py
"""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
OUT = Path(__file__).resolve().parent / 'samples'


def lp(x, f, order=4):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def boom(seed, f0=115, f1=44, decay=0.36, swell=0.06, room=0.3, dur=2.4):
    r = np.random.default_rng(seed)
    n = int(dur * SR); t = np.arange(n) / SR; th = t - swell; after = th >= 0; tp = np.maximum(th, 0)
    # 1. the sub: a sine falling f0 -> f1, 6 ms attack, long exponential decay, driven for odd harmonics
    f = f1 + (f0 - f1) * np.exp(-tp / 0.065)
    ph = 2 * np.pi * np.cumsum(np.where(after, f, 0)) / SR
    env = (1 - np.exp(-tp / 0.006)) * np.exp(-tp / decay) * after
    sub = np.tanh(1.8 * np.sin(ph) * env) / np.tanh(1.8)
    # 2. the second harmonic, shorter: the part a phone speaker reproduces
    h2 = np.sin(2 * ph + 0.3) * (1 - np.exp(-tp / 0.004)) * np.exp(-tp / (decay * 0.35)) * after
    # 3. body: a burst of low noise under the attack, the "thump" texture
    body = lp(r.standard_normal(n), 230) * (1 - np.exp(-tp / 0.003)) * np.exp(-tp / 0.09) * after
    body /= np.abs(body).max() + 1e-9
    # 4. a soft swell of low air into the hit (the peak arrives a beat after the onset, as in the reference)
    sw_n = int(swell * SR); u = np.arange(sw_n) / max(1, sw_n)
    pre = np.zeros(n); pre[:sw_n] = bp(r.standard_normal(sw_n), 60, 500) * u ** 2.5
    pre /= np.abs(pre).max() + 1e-9
    dry = 0.9 * sub + 0.22 * h2 + 0.3 * body + 0.12 * pre
    # 5. room: a synthetic hall (decaying low-passed noise), decorrelated per channel for width
    ir_t = np.arange(int(1.8 * SR)) / SR
    out = []
    for ch in range(2):
        ir = lp(r.standard_normal(len(ir_t)), 1400) * np.exp(-ir_t / 0.32) * (1 - np.exp(-ir_t / 0.01))
        ir /= np.sqrt((ir ** 2).sum()) + 1e-9
        wet = fftconvolve(dry, ir)[:n]
        out.append(dry + room * wet / (np.abs(wet).max() + 1e-9) * np.abs(dry).max())
    x = np.stack(out, 1)
    fade = np.ones(n); fade[-int(0.3 * SR):] = np.linspace(1, 0, int(0.3 * SR)) ** 2; x *= fade[:, None]
    return x / np.abs(x).max() * 0.89


VARIANTS = {
    'boom_move': [dict(seed=31, f0=118, f1=44, decay=0.28), dict(seed=32, f0=108, f1=42, decay=0.31),
                  dict(seed=33, f0=124, f1=47, decay=0.27), dict(seed=34, f0=112, f1=40, decay=0.33)],
    'boom_big': [dict(seed=41, f0=120, f1=36, decay=0.55, swell=0.09, room=0.42, dur=3.2),
                 dict(seed=42, f0=110, f1=34, decay=0.6, swell=0.1, room=0.45, dur=3.4)],
}


def main():
    man_p = OUT / 'manifest.json'; man = json.loads(man_p.read_text())
    for sid, vs in VARIANTS.items():
        files = []
        for k, v in enumerate(vs):
            f = f'{sid}_{k}.flac'; sf.write(OUT / f, boom(**v), SR, subtype='PCM_24'); files.append(f)
        man[sid] = {'files': files, 'prompt': 'own design: falling sub boom with a swell, driven 2nd harmonic, low thump, hall tail'
                    + (' (long, for mate and the biggest reveals)' if sid == 'boom_big' else ' (shown moves, fly-arounds, stamps)'),
                    'source': 'synthesized by audio/sfx_boom.py'}
        print(sid, files)
    man_p.write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
