"""Mix narration + procedural score + SFX cues and mux with the rendered video.

script.json "mix": {"engine": "v2"} uses the sample library in audio/samples (ElevenLabs-generated SFX), a separate SFX bus
with a hall reverb, and levels matched to @chess.history (bed ~7 LU under the voice, big hits about as loud as the voice).

    python3 audio/mix.py episodes/fischer       (needs build/narration.wav, build/cues.json, build/video.mp4)

Levels follow the reference: voice on top, music+SFX bed 6–8 LU under it, master ~ -16 LUFS.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

sys.path.insert(0, str(Path(__file__).parent))
import music  # noqa: E402
import sfx  # noqa: E402

SR = sfx.SR


def ffilter(x, chain, sr=SR):
    """Run audio through an ffmpeg filter chain (float32 wav in/out)."""
    p = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(sr), '-ac', str(x.shape[1] if x.ndim > 1 else 1),
                        '-i', '-', '-af', chain, '-f', 'f32le', '-ar', str(sr), '-'],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    y = np.frombuffer(p.stdout, np.float32).copy()
    return y.reshape(-1, x.shape[1]) if x.ndim > 1 else y


def envelope(x, win=0.08):
    n = int(win * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, 'same'))
    return e / max(1e-6, e.max())


# ---------------------------------------------------------------- v2: real samples, SFX bus with reverb, music ducked
SAMPLES = Path(__file__).parent / 'samples'
# old synth cue ids -> sample ids, so scenes written for the synth bank use the library
ALIAS = {'whoosh': 'whoosh_fast', 'boom': 'boom_cine', 'hit': 'hit_punch', 'clack': 'piece', 'tick': 'clock_press', 'ting': 'reveal_bell',
         'pluck': 'success', 'sparkle': 'shimmer', 'clock': 'clock_tick', 'shutter': 'camera', 'cheer': 'applause', 'sting': 'dun_dun'}


def load_samples():
    man = json.loads((SAMPLES / 'manifest.json').read_text())
    bank = {}
    for sid, d in man.items():
        bank[sid] = []
        for f in d['files']:
            x, sr = sf.read(SAMPLES / f, dtype='float32', always_2d=True)
            if sr != SR:
                from math import gcd
                g = gcd(SR, sr); x = resample_poly(x, SR // g, sr // g, axis=0)
            bank[sid].append(x if x.shape[1] == 2 else np.repeat(x, 2, 1))
    return bank


def reverb_ir(sec=1.9, seed=7):
    """Synthetic hall: a few early reflections, then decorrelated noise with an exponential decay, darker as it decays."""
    from scipy.signal import butter, sosfilt
    n = int(sec * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed)
    ir = r.standard_normal((n, 2)) * np.exp(-6.9 * t / sec)[:, None]
    ir = sosfilt(butter(2, 5500, 'low', fs=SR, output='sos'), ir, axis=0)
    for d, g in [(0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.041, 0.22)]:
        k = int(d * SR); ir[k, 0] += g; ir[int(k * 1.13), 1] += g
    ir[:int(0.008 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(0, keepdims=True))


def short_term(x, meter, win=0.4):
    n = int(win * SR); out = []
    for s0 in range(0, len(x) - n, n // 2):
        seg_ = x[s0:s0 + n]
        out.append(meter.integrated_loudness(seg_) if np.abs(seg_).max() > 1e-4 else -99)
    return np.array(out)


def music_fx(m, fxs, n):
    """Cut the music out before a big hit ('mute'), muffle a passage ('lp', low-pass at f Hz), or let it play loud for a
    moment ('boost', db; the drop after a big move, released over 0.35 s after t1), with short ramps."""
    if not fxs:
        return m
    t = np.arange(n) / SR
    def ramp(t0, t1, r):  # 0..1 over [t0, t1] with r-second ramps
        return np.clip(np.minimum((t - t0) / r + 1, (t1 - t) / r + 1), 0, 1) * ((t > t0 - r) & (t < t1 + r))
    gain, boost, blend, f_lp = np.ones(n), np.ones(n), np.zeros(n), 900
    for fx in fxs:
        if fx['kind'] == 'mute':
            gain = np.minimum(gain, 1 - ramp(fx['t0'], fx['t1'], 0.015))
        elif fx['kind'] == 'boost':
            k = np.clip(np.minimum((t - fx['t0']) / 0.005 + 1, (fx['t1'] - t) / 0.35 + 1), 0, 1) * ((t > fx['t0'] - 0.005) & (t < fx['t1'] + 0.35))
            boost = np.maximum(boost, 10 ** (fx.get('db', 6) * k / 20))
        elif fx['kind'] == 'lp':
            blend = np.maximum(blend, ramp(fx['t0'], fx['t1'], 0.12)); f_lp = fx.get('f', f_lp)
    if blend.any():
        muf = ffilter(m, f'lowpass=f={f_lp},lowpass=f={f_lp}')[:n]
        m = m * (1 - blend[:, None]) + muf * blend[:, None]
    return m * (gain * boost)[:, None]


def mix_v2(b, meta, vv, n, dur, cfg):
    import pyloudnorm as pyln
    from scipy.signal import fftconvolve
    meter = pyln.Meter(SR)
    lv = meter.integrated_loudness(vv)
    # music, ducked under the voice and set `music_gap` LU below it
    m = music.render(meta['music'], dur)[:n]
    m = np.pad(m, ((0, n - len(m)), (0, 0)))
    m = m * (1 - cfg.get('duck', 0.45) * np.clip(envelope(vv[:, 0], 0.25) * 2.2, 0, 1))[:, None]
    # music EQ: 'music_air' dB of highs above 5 kHz (default +4), optional 'music_lp' low-pass to tame ringing tops
    m = ffilter(m, f"highshelf=f=5000:g={cfg.get('music_air', 4)},equalizer=f=250:t=q:w=1:g=-2.5" + (f",lowpass=f={cfg['music_lp']}" if cfg.get('music_lp') else ''))[:n]
    lm = meter.integrated_loudness(m)
    m *= 10 ** ((lv - cfg.get('music_gap', 8) - lm) / 20)
    m = music_fx(m, meta.get('musicFx', []), n)
    # SFX from the sample library (variants in turn), synth bank as the fallback
    bank, synth = load_samples(), sfx.render_all()
    fx = np.zeros((n, 2)); used = {}; r = np.random.default_rng(3)
    for c in sorted(meta['cues'], key=lambda c: c['t']):
        sid = c['id'] if c['id'] in bank else ALIAS.get(c['id'], c['id'])
        if sid in bank:
            k = used.get(sid, 0); used[sid] = k + 1; x = bank[sid][k % len(bank[sid])]
        elif c['id'] in synth:
            x = np.repeat(synth[c['id']][:, None], 2, 1)
        else:
            print('  unknown sfx', c['id']); continue
        s = int(c['t'] * SR)
        if s >= n: continue
        x = x[:n - s] * c.get('gain', 1); pan = r.uniform(-0.3, 0.3)
        fx[s:s + len(x), 0] += x[:, 0] * np.sqrt(0.5 * (1 - pan)) * 1.41
        fx[s:s + len(x), 1] += x[:, 1] * np.sqrt(0.5 * (1 + pan)) * 1.41
    ir = reverb_ir(cfg.get('reverb_sec', 2.3))
    wet = np.stack([fftconvolve(fx[:, ch], ir[:, ch])[:n] for ch in range(2)], 1)
    fx = fx + wet * cfg.get('reverb', 0.45)
    fx = ffilter(fx, 'acompressor=threshold=-20dB:ratio=2.5:attack=4:release=140:makeup=1')[:n]
    st = short_term(fx, meter); act = st[st > -70]
    if len(act):  # the loud moments of the SFX bus land `sfx_gap` LU under the voice
        fx *= 10 ** ((lv - cfg.get('sfx_gap', 0.5) - np.percentile(act, 90)) / 20)
    print(f'  v2: voice {lv:.1f} LUFS, music {lv - cfg.get("music_gap", 8):.1f}, sfx p90 {lv - cfg.get("sfx_gap", 0.5):.1f} LUFS; samples used: {sum(used.values())}')
    return m, fx


def main(ep):
    b = Path(ep) / 'build'
    meta = json.loads((b / 'cues.json').read_text())
    dur = meta['duration']
    n = int(dur * SR)

    # voice: 24k -> 44.1k, clean + warm + compressed, slight room
    v, vsr = sf.read(b / 'narration.wav', dtype='float32')
    if vsr != SR:
        from math import gcd
        g = gcd(SR, vsr); v = resample_poly(v, SR // g, vsr // g)
    v = v[:n]
    v = np.pad(v, (0, n - len(v)))
    v = ffilter(v, 'highpass=f=70,equalizer=f=140:t=q:w=1.0:g=2.5,equalizer=f=3200:t=q:w=1.2:g=2,'
                   'acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=4,'
                   'aecho=0.8:0.5:28|47:0.12|0.08')
    v = v[:n]

    script = json.loads((Path(ep) / 'script.json').read_text())
    cfg = script.get('mix', {})
    if cfg.get('engine') == 'v2':
        vv = np.stack([v, v], 1)
        m, fx = mix_v2(b, meta, vv, n, dur, cfg)
        mixd = vv + m + fx
        sf.write(b / 'stems_voice.wav', vv, SR); sf.write(b / 'stems_music.wav', m, SR); sf.write(b / 'stems_sfx.wav', fx, SR)
        return finish(b, mixd)
    # music with ducking under the voice
    m = music.render(meta['music'], dur)[:n]
    m = np.pad(m, ((0, n - len(m)), (0, 0)))
    duck = 1 - 0.55 * np.clip(envelope(v, 0.25) * 2.2, 0, 1)
    m = m * duck[:, None]

    # SFX
    bank = sfx.render_all()
    fx = np.zeros((n, 2))
    r = np.random.default_rng(3)
    for c in meta['cues']:
        x = bank.get(c['id'])
        if x is None:
            print('  unknown sfx', c['id']); continue
        s = int(c['t'] * SR)
        if s >= n:
            continue
        x = x[:n - s] * c.get('gain', 1)
        pan = r.uniform(-0.25, 0.25)
        fx[s:s + len(x), 0] += x * np.sqrt(0.5 * (1 - pan))
        fx[s:s + len(x), 1] += x * np.sqrt(0.5 * (1 + pan))

    vv = np.stack([v, v], 1)
    # bed = music + SFX, brightened, then leveled to sit `bed_gap` LU under the voice (reference: 0.4-6 LU)
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    bed = m * 0.62 + fx * 0.38
    bed = ffilter(bed, 'highshelf=f=5000:g=4,equalizer=f=250:t=q:w=1:g=-2')[:n]
    gap = script.get('mix', {}).get('bed_gap', meta.get('bed_gap', 4.0))
    lv, lb = meter.integrated_loudness(vv), meter.integrated_loudness(bed)
    bed *= 10 ** ((lv - gap - lb) / 20)
    # rider: no 3-second stretch of the bed may rise more than 1 LU above its target (dense openings, big hits)
    win, hop = int(3 * SR), int(0.5 * SR)
    centers, gains = [], []
    for s0 in range(0, max(1, n - win), hop):
        seg_ = bed[s0:s0 + win]
        l = meter.integrated_loudness(seg_) if np.abs(seg_).max() > 1e-5 else -99
        gains.append(min(1.0, 10 ** ((lv - gap + 1 - l) / 20))); centers.append(s0 + win // 2)
    if gains:
        g = np.interp(np.arange(n), centers, gains)
        g = np.convolve(g, np.ones(int(0.4 * SR)) / int(0.4 * SR), mode='same')
        bed *= g[:, None]
    print(f'  voice {lv:.1f} LUFS, bed {lb:.1f} -> {lv - gap:.1f} LUFS (gap {gap} LU, rider min gain {min(gains or [1]):.2f})')
    m, fx = bed, np.zeros_like(bed)
    mixd = vv * 1.0 + bed
    sf.write(b / 'stems_voice.wav', vv, SR); sf.write(b / 'stems_music.wav', m, SR); sf.write(b / 'stems_sfx.wav', fx, SR)
    return finish(b, mixd)


def finish(b, mixd):
    sf.write(b / 'mix_raw.wav', (mixd / max(1e-6, np.abs(mixd).max()) * 0.9).astype(np.float32), SR)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', b / 'mix_raw.wav', '-af',
                    'alimiter=limit=0.9:attack=3:release=50,loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100', b / 'mix.wav'], check=True)
    if (b / 'video.mp4').exists():
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', b / 'video.mp4', '-i', b / 'mix.wav', '-map', '0:v', '-map', '1:a',
                        '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', b / 'final.mp4'], check=True)
        print('->', b / 'final.mp4')
    print('->', b / 'mix.wav')


if __name__ == '__main__':
    main(sys.argv[1])
