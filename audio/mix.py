"""Mix narration + procedural score + SFX cues and mux with the rendered video.

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
    y = np.frombuffer(p.stdout, np.float32)
    return y.reshape(-1, x.shape[1]) if x.ndim > 1 else y


def envelope(x, win=0.08):
    n = int(win * SR)
    e = np.sqrt(np.convolve(x ** 2, np.ones(n) / n, 'same'))
    return e / max(1e-6, e.max())


def main(ep):
    b = Path(ep) / 'build'
    meta = json.loads((b / 'cues.json').read_text())
    dur = meta['duration']
    n = int(dur * SR)

    # voice: 24k -> 44.1k, clean + warm + compressed, slight room
    v, vsr = sf.read(b / 'narration.wav', dtype='float32')
    v = resample_poly(v, 147, 80)[:n]
    v = np.pad(v, (0, n - len(v)))
    v = ffilter(v, 'highpass=f=70,equalizer=f=140:t=q:w=1.0:g=2.5,equalizer=f=3200:t=q:w=1.2:g=2,'
                   'acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=4,'
                   'aecho=0.8:0.5:28|47:0.12|0.08')
    v = v[:n]

    # music with ducking under the voice
    m = music.render(meta['music'], dur)[:n]
    m = np.pad(m, ((0, n - len(m)), (0, 0)))
    duck = 1 - 0.45 * np.clip(envelope(v, 0.25) * 2.2, 0, 1)
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
    mixd = vv * 1.0 + m * 0.46 + fx * 0.23
    sf.write(b / 'stems_voice.wav', vv, SR); sf.write(b / 'stems_music.wav', m, SR); sf.write(b / 'stems_sfx.wav', fx, SR)
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
