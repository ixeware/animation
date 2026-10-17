"""Procedural score in D minor, ~120 BPM, arranged by the episode's music sections.

Sections come from cues.json ("music": [{t, m}, ...]); each mood is a small arrangement of
synth instruments laid on a global beat grid so the cuts land on time.
"""
import functools

import numpy as np
from scipy.signal import fftconvolve

from sfx import SR, lp, hp, bp, noise, env_exp, ks, t_, rng

BPM = 120
BEAT = 60 / BPM


def hz(n):  # MIDI note -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


N = {k: v for k, v in zip('C C# D D# E F F# G G# A A# B'.split(), range(12))}


def note(name):  # 'D4' -> midi
    return 12 * (int(name[-1]) + 1) + N[name[:-1]]


# ---------- instruments ----------
@functools.lru_cache(maxsize=None)
def pizz(m, d=0.9):
    x = ks(hz(m), d, damp=0.994, bright=0.6)
    return lp(x, 7000) * env_exp(d, 0.35)


def saw(f, d, voices=3, det=0.006):
    t = t_(d)
    return sum(2 * ((t * f * (1 + det * (i - 1)) + rng.random()) % 1) - 1 for i in range(voices)) / voices


def pad(ms, d, cut=2600, att=0.6, rel=0.8):
    t = t_(d)
    x = sum(saw(hz(m), d) for m in ms) / len(ms)
    e = np.minimum(1, t / att) * np.minimum(1, (d - t) / rel)
    return lp(x, cut) * e


def strings(ms, d, cut=3960, att=0.25):
    t = t_(d)
    x = sum(saw(hz(m), d, 4, 0.004) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t)) for m in ms) / len(ms)
    return lp(x, cut) * np.minimum(1, t / att) * np.minimum(1, (d - t) / 0.3)


@functools.lru_cache(maxsize=None)
def piano(m, d=2.5, vel=1.0):
    t = t_(d)
    f = hz(m)
    x = sum(np.sin(2 * np.pi * f * k * t) * a * np.exp(-t * (1.2 + k * 0.9)) for k, a in [(1, 1), (2, 0.45), (3, 0.22), (4, 0.12), (5, 0.06)])
    x[:200] += lp(noise(200 / SR), 2500) * 0.15
    return x * np.minimum(1, t / 0.004) * vel


@functools.lru_cache(maxsize=None)
def bell(m, d=1.8):
    t = t_(d)
    f = hz(m)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) + 0.2 * np.sin(2 * np.pi * f * 5.4 * t)) * np.exp(-t / 0.45)


@functools.lru_cache(maxsize=None)
def bass(m, d=0.45):
    t = t_(d)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)
    return x * np.minimum(1, t / 0.01) * np.exp(-t / (d * 0.6))


def kick(d=0.35):
    t = t_(d)
    return np.sin(2 * np.pi * (48 + 70 * np.exp(-t * 28)) * t) * np.exp(-t / 0.12)


def snare(d=0.2, a=1.0):
    t = t_(d)
    return (bp(noise(d), 1200, 7000) * np.exp(-t / 0.05) + np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.04) * 0.6) * a


def hat(d=0.05):
    return hp(noise(d), 7000) * env_exp(d, 0.012)


def timpani(m=note('D2'), d=1.4):
    t = t_(d)
    return np.sin(2 * np.pi * hz(m) * t * (1 + 0.02 * np.exp(-t * 8))) * np.exp(-t / 0.5) + lp(noise(d), 300) * np.exp(-t / 0.05) * 0.3


# D minor progressions
CH = {
    'Dm': [note('D3'), note('F3'), note('A3')], 'Bb': [note('A#2'), note('D3'), note('F3')],
    'Gm': [note('G2'), note('A#2'), note('D3')], 'A': [note('A2'), note('C#3'), note('E3')],
    'F': [note('F2'), note('A2'), note('C3')], 'C': [note('C3'), note('E3'), note('G3')],
    'D': [note('D3'), note('F#3'), note('A3')], 'Eb': [note('D#3'), note('G3'), note('A#3')],
}
PROG = ['Dm', 'Bb', 'Gm', 'A']


class Score:
    def __init__(self, dur):
        self.dur = dur
        self.L = np.zeros(int((dur + 4) * SR))
        self.R = np.zeros_like(self.L)
        self.wet = np.zeros_like(self.L)

    def add(self, t, x, gain=1.0, pan=0.0, rev=0.25, until=None):
        if until is not None:  # hard section boundary with a short fade
            n = max(0, int((until - t) * SR))
            if n <= 0:
                return
            if len(x) > n:
                x = x[:n].copy(); f = min(len(x), int(0.04 * SR)); x[-f:] *= np.linspace(1, 0, f)
        s = int(t * SR)
        if s < 0 or s >= len(self.L):
            return
        x = x[:len(self.L) - s] * gain
        self.L[s:s + len(x)] += x * np.sqrt(0.5 * (1 - pan))
        self.R[s:s + len(x)] += x * np.sqrt(0.5 * (1 + pan))
        self.wet[s:s + len(x)] += x * rev

    def mix(self):
        d = 2.6
        tt = t_(d)
        ir = noise(d) * np.exp(-tt / 0.7)
        ir = lp(ir, 5000)
        w = fftconvolve(self.wet, ir)[:len(self.L)] * 0.035
        st = np.stack([self.L + w, self.R + np.roll(w, 331)], 1)
        return st[:int(self.dur * SR)]


def beats(a, b, div=1):
    """global beat-grid times in [a, b) at subdivision div (1 = quarter, 2 = eighth...)."""
    step = BEAT / div
    k = np.ceil(a / step - 1e-6)
    out = []
    while k * step < b - 1e-6:
        out.append(k * step); k += 1
    return out


def chord_at(t, prog=PROG, bars=1):
    return CH[prog[int(t / (BEAT * 4 * bars)) % len(prog)]]


# ---------- moods ----------
def m_hook(S, a, b):
    S.add(a, pad([note('D2'), note('A2'), note('D3')], b - a + 0.6, cut=1260, att=1.0), 0.55, rev=0.4, until=b + 0.3)
    for t in beats(a, b, 1):
        S.add(t, hat(), 0.18, pan=0.3, until=b)
    for i, t in enumerate(beats(a + 0.01, b, 0.5)):
        S.add(t, piano([note('D3'), note('F3'), note('E3'), note('A2')][i % 4], 2.0), 0.35, pan=-0.2, rev=0.5, until=b)


def m_intrigue(S, a, b):
    shaker(S, a, b, 0.06)
    for i, t in enumerate(beats(a, b, 2)):
        ch = chord_at(t)
        m = [ch[0], ch[1], ch[2], ch[1]][i % 4] + 12
        S.add(t, pizz(m), 0.5, pan=-0.35 + 0.7 * (i % 2), rev=0.2, until=b)
    for t in beats(a, b, 0.5):
        S.add(t, bass(chord_at(t)[0] - 12, 0.9), 0.5, until=b)
    for t in beats(a, b, 1):
        S.add(t, hat(), 0.12, pan=0.4, until=b)
    for i, t in enumerate(beats(a + BEAT * 2, b, 0.25)):
        S.add(t, bell([note('A5'), note('F5'), note('E5'), note('D5')][i % 4]), 0.12, pan=0.3, rev=0.5, until=b)


def shaker(S, a, b, gain=0.10):
    for i, t in enumerate(beats(a, b, 4)):
        S.add(t, hp(noise(0.06), 5000) * env_exp(0.06, 0.02), gain * (1.0 if i % 2 else 0.55), pan=0.45 * ((-1) ** i), until=b)


def m_tension(S, a, b):
    shaker(S, a, b, 0.12)
    for i, t in enumerate(beats(a, b, 4)):
        S.add(t, pizz(note('D4') + [0, 1, 0, 3][i % 4] + (i // 16) * 2), 0.45 + 0.3 * (t - a) / (b - a), pan=-0.3 + 0.6 * (i % 2), until=b)
    S.add(a, strings([note('D3'), note('D#3')], b - a, cut=3240, att=1.2), 0.3, until=b)
    for t in beats(a, b, 2):
        S.add(t, kick(), 0.35, until=b)


def m_drop(S, a, b):
    S.add(a, pad([note('D2')], b - a + 0.3, cut=300, att=(b - a) * 0.8), 0.08, until=b)


def m_hit(S, a, b):
    S.add(a, timpani(), 0.9, rev=0.5)
    S.add(a, strings(CH['D'] + [note('D4')], b - a + 0.8, cut=4680, att=0.05), 0.4, rev=0.5, until=b + 0.4)


def m_slam(S, a, b):  # the drop after the big move (the 9th second of the chess.history Kramnik–Topalov short)
    t = t_(1.8)
    S.add(a, np.sin(2 * np.pi * (36 + 34 * np.exp(-t * 7)) * t) * np.exp(-t / 0.9), 1.0, rev=0.05, until=b + 0.4)  # a falling sub
    S.add(a, kick(0.5), 0.9, until=b)
    S.add(a, pad(CH['Dm'] + [note('D4'), note('A4'), note('D5')], b - a + 0.5, cut=6500, att=0.008, rel=0.5), 0.6, rev=0.5, until=b + 0.4)
    S.add(a, hp(noise(1.8), 1800) * env_exp(1.8, 0.55, 0.004), 0.3, rev=0.3, until=b + 0.4)  # the airy wash
    for tt in beats(a + BEAT / 2, b, 2):  # an eighth-note bass pulse under it
        S.add(tt, bass(note('D2'), 0.24), 0.55, until=b)
    for tt in beats(a + BEAT, b, 1):
        S.add(tt, kick(), 0.65, until=b)


def m_glory(S, a, b):
    S.add(a, pad(CH['F'] + [note('A3')], b - a + 0.5, cut=3240, att=0.3), 0.45, rev=0.5, until=b + 0.3)
    for i, t in enumerate(beats(a, b, 2)):
        S.add(t, bell([note('F5'), note('A5'), note('C6'), note('A5')][i % 4]), 0.15, pan=0.4 * ((-1) ** i), rev=0.6, until=b)


def m_coldwar(S, a, b, intensity=0.0):
    shaker(S, a, b, 0.07)
    for i, t in enumerate(beats(a, b, 2)):  # low staccato string ostinato
        root = chord_at(t, PROG, 1)[0]
        S.add(t, strings([root - 12, root], 0.22, cut=2520, att=0.01), 0.42 + 0.2 * intensity, pan=-0.2, rev=0.15, until=b)
    for t in beats(a, b, 1):
        S.add(t, snare(a=0.35 if (t / BEAT) % 2 > 0.5 else 0.15), 0.45 + 0.2 * intensity, pan=0.2, until=b)
        if (t / BEAT) % 4 < 0.5:
            S.add(t, timpani(chord_at(t)[0] - 12), 0.45, rev=0.4, until=b)
    for t in beats(a, b, 0.25):  # brass-ish chord stabs every bar
        S.add(t, pad(chord_at(t), BEAT * 4, cut=2340 + 900 * intensity, att=0.08, rel=0.6), 0.32 + 0.15 * intensity, rev=0.4, until=b)
    if intensity:
        for t in beats(a, b, 4):
            S.add(t, hat(), 0.12, pan=0.5, until=b)


def m_build(S, a, b):
    shaker(S, a, b, 0.12)
    m_coldwar(S, a, b, intensity=1.0)
    S.add(a, strings([note('D4'), note('A4')], b - a, cut=5400, att=(b - a) * 0.8), 0.25, until=b)


def m_victory(S, a, b):
    S.add(a, timpani(), 1.0, rev=0.6)
    S.add(a, strings(CH['D'] + [note('D4'), note('F#4'), note('A4')], b - a + 1.0, cut=7200, att=0.08), 0.55, rev=0.6, until=b + 0.6)
    for i, m in enumerate([note('D5'), note('F#5'), note('A5'), note('D6')]):
        S.add(a + i * 0.12, bell(m), 0.25, pan=0.3, rev=0.6)


def m_void(S, a, b):
    S.add(a, pad([note('D5'), note('A5')], b - a + 0.5, cut=4500, att=1.5), 0.12, rev=0.8, until=b + 0.4)
    for t, m in zip(np.arange(a + 0.4, b, 1.5), [note('A4'), note('F4'), note('D4'), note('E4')]):
        S.add(t, piano(m, 3.0, 0.8), 0.4, pan=0.15, rev=0.9, until=b + 0.6)


def m_paranoia(S, a, b):
    S.add(a, strings([note('D3'), note('D#3'), note('A3')], b - a + 0.3, cut=2880, att=0.8), 0.32, rev=0.5, until=b + 0.2)
    t = t_(b - a)
    trem = strings([note('D#4')], b - a, cut=5400, att=0.4) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 8 * t)))
    S.add(a, trem, 0.12, pan=0.5, until=b)
    for tt in beats(a, b, 1):
        S.add(tt, hat(0.03), 0.2, pan=-0.6, until=b)


def m_exile(S, a, b):
    for t in beats(a, b, 2):
        S.add(t, bass(chord_at(t, ['Dm', 'Gm', 'Bb', 'A'], 1)[0] - 12, 0.35), 0.5, until=b)
    for t in beats(a, b, 0.25):
        S.add(t, pad(chord_at(t, ['Dm', 'Gm', 'Bb', 'A']), BEAT * 4, cut=1620, att=0.4), 0.3, rev=0.4, until=b)
    for i, t in enumerate(beats(a, b, 1)):
        S.add(t, piano([note('D4'), note('F4'), note('A4'), note('G4')][i % 4], 1.5, 0.6), 0.22, pan=0.2, rev=0.5, until=b)


def m_elegy(S, a, b):
    mel = ['A4', 'F4', 'E4', 'D4', 'A#3', 'D4', 'C#4', 'D4']
    for i, t in enumerate(np.arange(a + 0.1, b, BEAT * 1.5)):
        S.add(t, piano(note(mel[i % len(mel)]), 3.0, 0.9), 0.5, pan=0.1, rev=0.8, until=b + 0.5)
    for t in beats(a, b, 0.25):
        ch = chord_at(t, ['Dm', 'Bb', 'F', 'A'])
        S.add(t, pad(ch, BEAT * 4 + 0.4, cut=2160, att=0.8), 0.32, rev=0.6, until=b + 0.3)
        S.add(t, piano(ch[0] - 12, 3.0, 0.7), 0.35, rev=0.6, until=b + 0.3)


def m_finale(S, a, b):
    S.add(a, strings(CH['Dm'] + [note('D4'), note('A4'), note('D5')], b - a + 0.5, cut=6300, att=1.6), 0.5, rev=0.7, until=b)
    S.add(a, timpani(), 0.6, rev=0.6)
    for i, t in enumerate(np.arange(a + 0.2, b, BEAT)):
        S.add(t, bell([note('D5'), note('A5'), note('F5'), note('E5')][i % 4]), 0.15, pan=0.3 * ((-1) ** i), rev=0.7, until=b)


# --- The Mechanical Turk ---
def m_clockwork(S, a, b):  # music box over a ticking escapement and pizzicato bass
    box = ['D5', 'F5', 'A5', 'D6', 'C#6', 'A5', 'E5', 'G5']
    for i, t in enumerate(beats(a, b, 2)):
        S.add(t, bell(note(box[i % len(box)]), 1.2), 0.16, pan=0.35 * ((-1) ** i), rev=0.55, until=b)
    for i, t in enumerate(beats(a, b, 1)):
        S.add(t, bp(noise(0.02), 2400 if i % 2 else 1700, 7000) * env_exp(0.02, 0.004), 0.5, pan=-0.3 if i % 2 else 0.3, rev=0.1, until=b)
    for t in beats(a, b, 0.5):
        S.add(t, pizz(chord_at(t)[0] - 12, 1.2), 0.45, rev=0.25, until=b)
    S.add(a, pad([note('D3'), note('A3')], b - a + 0.4, cut=1500, att=1.2), 0.22, rev=0.5, until=b + 0.2)


def harpsi(m, d=0.6):  # bright plucked string, a cheap harpsichord
    return hp(ks(hz(m), d, damp=0.994, bright=0.95), 180)


def m_court(S, a, b):  # 18th-century court: harpsichord broken chords, light bass
    prog = ['Dm', 'A', 'Dm', 'C', 'F', 'Gm', 'A', 'Dm']
    for i, t in enumerate(beats(a, b, 2)):
        ch = chord_at(t, prog)
        S.add(t, harpsi([ch[0], ch[1], ch[2], ch[1]][i % 4] + 12), 0.4, pan=-0.25 + 0.5 * (i % 2), rev=0.3, until=b)
    for t in beats(a, b, 1):
        S.add(t, harpsi(chord_at(t, prog)[0] - 12 + 12, 0.9), 0.35, rev=0.3, until=b)
    shaker(S, a, b, 0.05)


def m_inferno(S, a, b):  # fire: low rumble, dissonant swell, slow drums
    t = t_(b - a + 0.5)
    rumble = lp(noise(b - a + 0.5), 180) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t))
    S.add(a, rumble, 0.5, rev=0.2, until=b + 0.3)
    S.add(a, strings([note('D3'), note('D#3'), note('A3'), note('C4')], b - a + 0.4, cut=2600, att=1.2), 0.35, rev=0.6, until=b + 0.3)
    for tt in beats(a, b, 0.5):
        S.add(tt, timpani(note('D2'), 1.2), 0.45, rev=0.4, until=b + 0.3)


def m_digital(S, a, b):  # modern pulse for the present day
    for i, t in enumerate(beats(a, b, 4)):
        m = chord_at(t, ['Dm', 'Bb', 'F', 'C'])[i % 3] + 24
        S.add(t, lp(saw(hz(m), 0.12, voices=2), 3200) * env_exp(0.12, 0.05), 0.16, pan=0.4 * ((-1) ** i), rev=0.3, until=b)
    for t in beats(a, b, 1):
        S.add(t, kick(), 0.7, until=b)
    for t in beats(a + BEAT / 2, b, 1):
        S.add(t, hat(), 0.16, pan=0.3, until=b)
    for t in beats(a, b, 0.25):
        S.add(t, pad(chord_at(t, ['Dm', 'Bb', 'F', 'C']), BEAT * 4, cut=2200, att=0.3), 0.25, rev=0.4, until=b)


# --- The Lewis chessmen ---
def m_norse(S, a, b):  # the medieval north: open drone, frame drum, a bowed Dorian tune
    S.add(a, pad([note('D2'), note('A2'), note('D3')], b - a + 0.6, cut=1100, att=1.0), 0.45, rev=0.5, until=b + 0.3)
    tune = ['D4', 'E4', 'F4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'D4', 'E4', 'A3']
    d = BEAT * 0.95
    for i, t in enumerate(beats(a, b, 1)):
        x = lp(saw(hz(note(tune[i % len(tune)])), d, voices=2, det=0.004), 2200) * np.minimum(1, t_(d) / 0.06) * np.minimum(1, (d - t_(d)) / 0.1)
        S.add(t, x, 0.12, pan=-0.2, rev=0.6, until=b)
    for i, t in enumerate(beats(a, b, 2)):
        if i % 4 in (0, 3):
            S.add(t, timpani(note('D2'), 0.6), 0.35 if i % 4 == 0 else 0.22, rev=0.3, until=b)


def m_auction(S, a, b):  # the saleroom: pizzicato ostinato over ticking, a slow rising string pad
    for i, t in enumerate(beats(a, b, 2)):
        S.add(t, pizz(chord_at(t, ['Dm', 'Dm', 'Bb', 'A'])[i % 3] + (12 if i % 2 else 0), 0.5), 0.35, pan=0.3 * ((-1) ** i), rev=0.25, until=b)
    for t in beats(a, b, 1):
        S.add(t, bp(noise(0.02), 2000, 7000) * env_exp(0.02, 0.004), 0.4, pan=0.2, rev=0.1, until=b)
    S.add(a, strings([note('D3'), note('A3'), note('D4')], b - a + 0.4, cut=3000, att=max(0.3, (b - a) * 0.8)), 0.3, rev=0.5, until=b + 0.2)


MOODS = {k[2:]: v for k, v in globals().items() if k.startswith('m_')}


def render(sections, dur):
    S = Score(dur)
    for sec, nxt in zip(sections, sections[1:]):
        if sec['m'] in MOODS:
            MOODS[sec['m']](S, sec['t'], nxt['t'])
    out = S.mix()
    return out / max(1e-6, np.abs(out).max()) * 0.9
