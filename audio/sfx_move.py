"""Our own chess-move sound, built from scratch in layers (no samples from anyone else's video).

The design follows the profile measured on the move hits of a reference short: a short airy swish into the hit,
a crisp knock of the piece on the board, a heavy sub thump that rings for ~0.4 s, and a light high sparkle.
Writes audio/samples/move_*.flac and move_capture_*.flac and registers them in manifest.json.

    python3 audio/sfx_move.py
"""
import json
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
OUT = Path(__file__).resolve().parent / 'samples'


def bp(x, lo, hi, order=4):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def hp(x, f, order=4):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def move(seed, capture=False):
    r = np.random.default_rng(seed)
    dur, hit = 0.75, 0.085                      # the swish runs into the hit at 85 ms
    n = int(dur * SR); t = np.arange(n) / SR; th = t - hit; after = th >= 0
    L = np.zeros(n); R = np.zeros(n)

    # 1. swish: band-passed noise swelling into the hit, sweeping up, panned from one side to the centre
    sw_n = int(hit * SR); u = np.arange(sw_n) / sw_n
    noise = r.standard_normal(sw_n)
    sw = 0.6 * bp(noise, 2600, 7000) + 0.4 * bp(noise, 6000, 14000)
    sw *= u ** 2.2 * (1 - np.exp(-(1 - u) * 60))
    pan = r.choice([-1, 1]) * (1 - u) * 0.7
    L[:sw_n] += sw * 0.30 * (1 - pan) / 2 * 2; R[:sw_n] += sw * 0.30 * (1 + pan) / 2 * 2

    # 2. knock: a 3 ms click plus damped partials of a felt-based piece on a wooden board
    click = hp(r.standard_normal(n), 1800) * np.exp(-np.maximum(th, 0) / 0.0018) * after
    det = 1 + r.uniform(-0.04, 0.04)
    knock = np.zeros(n)
    for f, a, d in [(1760, 1.0, 0.030), (2680, 0.55, 0.022), (3950, 0.32, 0.015), (430, 0.55, 0.060)]:
        knock += a * np.sin(2 * np.pi * f * det * th) * np.exp(-np.maximum(th, 0) / d) * after
    # 3. sub thump: a sine falling 120 -> 46 Hz (38 Hz for a capture), soft-clipped, ~0.4 s
    f0, f1 = (130, 38) if capture else (120, 46)
    ph = 2 * np.pi * np.cumsum(np.where(after, f1 + (f0 - f1) * np.exp(-np.maximum(th, 0) / 0.045), 0)) / SR
    env = (1 - np.exp(-np.maximum(th, 0) / 0.002)) * np.exp(-np.maximum(th, 0) / (0.2 if capture else 0.15)) * after
    thump = np.tanh(1.2 * np.sin(ph) * env) / np.tanh(1.2)
    # the wooden texture of the knock: a short burst of band-passed noise under the partials
    tap = bp(r.standard_normal(n), 700, 4500) * np.exp(-np.maximum(th, 0) / 0.008) * after
    # 4. sparkle: a little high air after the hit (the "holographic" glint)
    air = hp(r.standard_normal(n), 8500) * np.exp(-np.maximum(th, 0) / 0.07) * after
    glint = sum(np.sin(2 * np.pi * f * th + r.uniform(0, 6)) for f in (5200 * det, 7300 * det)) * np.exp(-np.maximum(th, 0) / 0.12) * after

    mono = 0.5 * click + 0.3 * knock + 0.35 * tap + 0.95 * thump + 0.05 * air + 0.015 * glint
    if capture:  # a crunchier, heavier hit: a burst of mid noise and a second, lower knock
        crunch = bp(r.standard_normal(n), 500, 3200) * np.exp(-np.maximum(th, 0) / 0.05) * after
        mono += 0.35 * crunch + 0.3 * np.sin(2 * np.pi * 310 * th) * np.exp(-np.maximum(th, 0) / 0.08) * after
    L += mono; R += mono
    # a touch of width on the air only
    d = int(0.0007 * SR); R[d:] += 0.03 * air[:-d]; L += 0.03 * air
    x = np.stack([L, R], 1)
    fade = np.ones(n); fade[-int(0.05 * SR):] = np.linspace(1, 0, int(0.05 * SR)); x *= fade[:, None]
    return x / np.abs(x).max() * 0.89


def main():
    man_p = OUT / 'manifest.json'; man = json.loads(man_p.read_text())
    for sid, cap, seeds in [('move', False, [11, 12, 13, 14]), ('move_capture', True, [21, 22])]:
        files = []
        for k, s in enumerate(seeds):
            f = f'{sid}_{k}.flac'; sf.write(OUT / f, move(s, cap), SR, subtype='PCM_24'); files.append(f)
        man[sid] = {'files': files, 'prompt': 'own layered design: swish into a wooden knock, a sub thump, a high glint' + (', heavier with a crunch (capture)' if cap else ''),
                    'source': 'synthesized by audio/sfx_move.py'}
        print(sid, files)
    man_p.write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
