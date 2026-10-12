"""Procedural sound effects (mono float32 @ 44.1 kHz). Every effect is synthesized, no samples."""
import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def noise(d):
    return rng.standard_normal(int(d * SR))


def env_exp(d, tau, attack=0.002):
    t = t_(d)
    return np.minimum(1, t / attack) * np.exp(-t / tau)


def sweep(f0, f1, d, curve='exp'):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def norm(x, peak=0.9):
    m = np.abs(x).max()
    return (x / m * peak).astype(np.float32) if m > 0 else x.astype(np.float32)


def boom():
    d = 2.2
    body = sweep(95, 34, d) * env_exp(d, 0.7, 0.004)
    click = lp(noise(0.03), 3000) * env_exp(0.03, 0.006)
    x = np.tanh(1.6 * body)
    x[:len(click)] += click * 0.6
    tail = lp(noise(d), 200) * env_exp(d, 0.5) * 0.25
    return norm(x + tail)


def hit():
    d = 1.0
    t = t_(d)
    thump = np.sin(2 * np.pi * 120 * t) * env_exp(d, 0.12)
    crack = lp(noise(d), 2500) * env_exp(d, 0.08)
    ring = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(410, 0.4), (1130, 0.25), (2210, 0.15)]) * env_exp(d, 0.35)
    return norm(thump + crack * 0.8 + ring * 0.5)


def clack():
    d = 0.18
    t = t_(d)
    x = bp(noise(d), 2000, 9000) * env_exp(d, 0.005) * 1.3
    x += (np.sin(2 * np.pi * 950 * t) * 0.6 + np.sin(2 * np.pi * 1580 * t) * 0.35) * env_exp(d, 0.025)
    x += np.sin(2 * np.pi * 160 * t) * env_exp(d, 0.03) * 0.5
    return norm(x)


def whoosh(d=0.55):
    x = noise(d)
    out = np.zeros_like(x)
    n = 12
    for i in range(n):  # sweeping band, piecewise
        a, b = i * len(x) // n, (i + 1) * len(x) // n
        c = 500 * (16 ** np.sin(np.pi * (i + 0.5) / n))
        out[a:b] = bp(x, c * 0.6, min(c * 1.6, 19000))[a:b]
    e = np.sin(np.pi * t_(d) / d) ** 2
    return norm(out * e)


def ting():
    d = 1.0
    t = t_(d)
    x = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(2793, 0.6), (4310, 0.3), (6190, 0.15), (8800, 0.08)]) * env_exp(d, 0.25)
    x[:300] += hp(noise(300 / SR), 4000) * 0.4
    return norm(x)


def static():
    d = 1.4
    x = bp(noise(d), 900, 5000) * (0.4 + 0.6 * (rng.random(int(d * SR)) > 0.97))
    return norm(lp(x, 6000) * np.sin(np.pi * t_(d) / d))


def shield():
    d = 0.6
    x = sweep(260, 1300, d) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t_(d))) * env_exp(d, 0.3, 0.02)
    return norm(x + ting()[:len(x)] * 0.2)


def tick():
    return norm(bp(noise(0.012), 2500, 6000) * env_exp(0.012, 0.002))


def alarm():
    out = []
    for f in (880, 660, 880, 660):
        tt = t_(0.11)
        out += [np.sign(np.sin(2 * np.pi * f * tt)) * 0.4 * env_exp(0.11, 0.2, 0.004), np.zeros(int(0.03 * SR))]
    return norm(lp(np.concatenate(out), 4000), 0.7)


def ks(freq, d=1.2, damp=0.996, bright=0.5):
    """Karplus-Strong pluck."""
    n = int(SR / freq)
    buf = rng.uniform(-1, 1, n) * bright + lp(rng.uniform(-1, 1, n), 2000) * (1 - bright)
    out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % n]
        buf[i % n] = damp * 0.5 * (buf[i % n] + buf[(i + 1) % n])
    return out


def pluck():
    return norm(ks(146.83, 1.0))


def riser(d=1.6):
    t = t_(d)
    x = hp(noise(d), 800) * (t / d) ** 2 * 0.5 + sweep(180, 1400, d) * (t / d) ** 1.5 * 0.4
    return norm(x)


def shimmer():
    d = 1.6
    out = np.zeros(int(d * SR))
    for i, f in enumerate([1174.7, 1480.0, 1760.0, 2349.3]):
        s = int(i * 0.07 * SR)
        tt = t_(d - i * 0.07)
        out[s:s + len(tt)] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt)) * env_exp(d - i * 0.07, 0.5)
    return norm(out)


def thud():
    d = 0.5
    t = t_(d)
    return norm(np.sin(2 * np.pi * (70 + 40 * np.exp(-t * 30)) * t) * env_exp(d, 0.1) + lp(noise(d), 800) * env_exp(d, 0.03) * 0.5)


def buzz():
    d = 0.55
    t = t_(d)
    x = np.sign(np.sin(2 * np.pi * 110 * t)) + np.sign(np.sin(2 * np.pi * 117 * t))
    return norm(lp(x, 2500) * np.minimum(1, (d - t) / 0.05) * np.minimum(1, t / 0.01), 0.7)


def whirr():
    d = 1.6
    t = t_(d)
    clicks = (np.sin(2 * np.pi * 24 * t) > 0.95).astype(float)
    x = bp(noise(d), 1500, 6000) * clicks * 0.8 + np.sin(2 * np.pi * 96 * t) * 0.15 + bp(noise(d), 200, 800) * 0.2
    return norm(x * np.minimum(1, t / 0.15) * np.minimum(1, (d - t) / 0.2))


def shutter():
    a = bp(noise(0.02), 2000, 8000) * env_exp(0.02, 0.004)
    gap = np.zeros(int(0.07 * SR))
    return norm(np.concatenate([a, gap, a * 0.7]))


def stamp():
    d = 0.5
    t = t_(d)
    x = np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 40)) * t) * env_exp(d, 0.08) + lp(noise(d), 3000) * env_exp(d, 0.02)
    return norm(np.tanh(2 * x))


def clock():
    out = np.zeros(int(2.0 * SR))
    for i in range(4):
        s = int(i * 0.5 * SR)
        tk = bp(noise(0.03), 1800 if i % 2 else 2400, 7000) * env_exp(0.03, 0.005)
        out[s:s + len(tk)] += tk
    return norm(out)


def lamp():
    d = 1.2
    t = t_(d)
    x = np.sin(2 * np.pi * 120 * t) * 0.3 * np.minimum(1, t / 0.05) * np.exp(-t / 0.8)
    x[:400] += bp(noise(400 / SR), 1000, 6000) * 0.8
    return norm(x)


def cheer():
    d = 2.6
    out = np.zeros(int(d * SR))
    for _ in range(900):  # claps
        s = int(rng.uniform(0, d - 0.05) * SR)
        c = bp(noise(0.02), rng.uniform(800, 1600), rng.uniform(2500, 5000)) * env_exp(0.02, 0.004)
        out[s:s + len(c)] += c * rng.uniform(0.3, 1)
    crowd = bp(noise(d), 300, 1800) * 0.25
    e = np.minimum(1, t_(d) / 0.3) * np.minimum(1, (d - t_(d)) / 0.8)
    return norm((out + crowd) * e)


def confetti():
    d = 1.2
    p = lp(noise(0.05), 3000) * env_exp(0.05, 0.01)
    rus = bp(noise(d), 3000, 9000) * (rng.random(int(d * SR)) > 0.9) * env_exp(d, 0.4) * 0.5
    rus[:len(p)] += p
    return norm(rus)


def poof():
    d = 0.7
    t = t_(d)
    x = lp(noise(d), 1200) * np.sin(np.pi * np.minimum(1, t / d)) ** 0.5 * np.exp(-t / 0.25)
    return norm(x)


def heartbeat():
    out = np.zeros(int(3.0 * SR))
    for k in range(3):
        for off, a in ((0, 1), (0.22, 0.7)):
            s = int((k * 0.85 + off) * SR)
            tt = t_(0.25)
            b = np.sin(2 * np.pi * (55 + 25 * np.exp(-tt * 30)) * tt) * env_exp(0.25, 0.07) * a
            out[s:s + len(b)] += b
    return norm(lp(out, 300))


def sting():
    d = 1.6
    t = t_(d)
    x = sum(2 * ((t * f) % 1) - 1 for f in (293.66, 311.13, 415.3, 587.3))
    x = lp(x, 2500) * np.minimum(1, t / 0.03) * np.exp(-t / 0.6) * (1 + 0.3 * np.sin(2 * np.pi * 7 * t))
    return norm(x)


def spit():
    d = 0.12
    return norm(np.concatenate([np.zeros(200), hp(noise(0.04), 1500) * env_exp(0.04, 0.01), lp(noise(0.08), 900) * env_exp(0.08, 0.02) * 0.6]))


def splat():
    d = 0.3
    t = t_(d)
    return norm(lp(noise(d), 1400) * env_exp(d, 0.05) + np.sin(2 * np.pi * (500 - 1200 * t) * t) * env_exp(d, 0.04) * 0.5)


def glass():
    """breaking glass: dense bright shards over a short low crack"""
    d = 1.4
    out = np.zeros(int(d * SR))
    crack = lp(noise(0.08), 2500) * env_exp(0.08, 0.02)
    out[:len(crack)] += crack * 1.2
    for _ in range(70):
        s0 = int(abs(rng.normal(0.05, 0.18)) * SR)
        dd = rng.uniform(0.05, 0.35)
        tt = t_(dd)
        f = rng.uniform(2500, 9500)
        sh = (np.sin(2 * np.pi * f * tt) + 0.5 * np.sin(2 * np.pi * f * 1.73 * tt)) * np.exp(-tt / (dd * 0.3))
        sh = sh + bp(noise(dd), 4000, 12000) * np.exp(-tt / 0.01) * 0.6
        e = min(len(out), s0 + len(sh))
        out[s0:e] += sh[:e - s0] * rng.uniform(0.15, 0.6)
    return norm(out)


def sparkle():
    d = 1.0
    out = np.zeros(int(d * SR))
    for i in range(9):
        s0 = int(i * 0.05 * SR); tt = t_(0.5); f = 2000 * 2 ** (i / 5)
        x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.12)
        out[s0:s0 + len(x)] += x * (1 - i / 12)
    return norm(out)


def tvoff():
    d = 0.6
    t = t_(d)
    x = sweep(1400, 60, 0.4)
    x = np.concatenate([x * env_exp(0.4, 0.2), np.zeros(len(t) - len(x))])
    return norm(x + hp(noise(d), 3000) * np.exp(-t / 0.15) * 0.4)


def creak():  # old wooden door hinge
    d = 0.9
    t = t_(d)
    f = 180 + 120 * np.sin(2 * np.pi * 0.9 * t) + 40 * np.sin(2 * np.pi * 7 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(t)) > 0.4)
    return norm(bp(x, 300, 3000) * np.sin(np.pi * t / d) ** 0.7, 0.7)


def fire():  # crackling flames
    d = 3.0
    x = lp(noise(d), 900) * 0.4
    for _ in range(160):
        s0 = int(rng.uniform(0, d - 0.03) * SR); c = bp(noise(0.012), 1500, 7000) * env_exp(0.012, 0.002)
        x[s0:s0 + len(c)] += c * rng.uniform(0.3, 1.2)
    e = np.minimum(1, t_(d) / 0.3) * np.minimum(1, (d - t_(d)) / 0.5)
    return norm(x * e)


def scatter():  # a whole chess set swept off the board
    d = 1.3
    out = np.zeros(int(d * SR))
    for i in range(26):
        s0 = int(abs(rng.normal(0.25, 0.22)) * SR); c = clack() * rng.uniform(0.25, 0.8)
        e = min(len(out), s0 + len(c)); out[s0:e] += c[:e - s0]
    sw = whoosh(0.5) * 0.8
    out[:len(sw)] += sw
    return norm(out)


def ratchet():  # clockwork winding
    d = 1.0
    out = np.zeros(int(d * SR))
    for i in range(14):
        s0 = int((i / 14) ** 0.9 * (d - 0.05) * SR); c = bp(noise(0.015), 2500, 8000) * env_exp(0.015, 0.003)
        out[s0:s0 + len(c)] += c
    return norm(out)


def typewriter():  # five keys and a bell
    d = 1.4
    out = np.zeros(int(d * SR))
    for i in range(5):
        s0 = int(i * 0.13 * SR); c = bp(noise(0.03), 1200, 6000) * env_exp(0.03, 0.006) + np.sin(2 * np.pi * 180 * t_(0.03)) * env_exp(0.03, 0.01) * 0.4
        out[s0:s0 + len(c)] += c
    s0 = int(0.75 * SR); b = ting()[:len(out) - s0] * 0.5
    out[s0:s0 + len(b)] += b
    return norm(out)


BANK = {name: fn for name, fn in globals().items()
        if callable(fn) and name in ('boom hit clack whoosh ting static shield tick alarm pluck riser shimmer thud buzz '
                                     'whirr shutter stamp clock lamp cheer confetti poof heartbeat sting spit splat tvoff glass sparkle '
                                     'creak fire scatter ratchet typewriter').split()}


def render_all():
    return {k: fn() for k, fn in BANK.items()}
