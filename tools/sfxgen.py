"""Add a sound effect to the library (audio/samples) with the ElevenLabs sound-generation model.

    python3 tools/sfxgen.py <id> "<prompt>" [--sec 1.2] [--n 2] [--influence 0.6] [--keep 0,2]

Makes n variants, trims the silence off both ends (10 ms of lead-in is kept, so a cue lands on the sound),
peak-normalizes to -1 dBFS, writes audio/samples/<id>_<k>.flac and adds the id to manifest.json with its prompt.
--keep picks which of the n variants go into the library (after listening or looking at them; default: all).
Raw downloads are cached in build/sfx_cache so a re-run costs no credits. Needs ELEVENLABS_API_KEY.
"""
import argparse, hashlib, json, os, subprocess, sys
from pathlib import Path
import numpy as np
import requests
import soundfile as sf

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
SAMPLES = ROOT / 'audio' / 'samples'
CACHE = ROOT / 'build' / 'sfx_cache'


def decode(data):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], input=data, capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).reshape(-1, 2).copy()


def fetch(prompt, sec, influence, k):
    CACHE.mkdir(parents=True, exist_ok=True)
    f = CACHE / (hashlib.sha1(json.dumps([prompt, sec, influence, k]).encode()).hexdigest()[:16] + '.mp3')
    if not f.exists():
        key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
        r = requests.post('https://api.elevenlabs.io/v1/sound-generation', params={'output_format': 'mp3_44100_128'}, headers={'xi-api-key': key},
                          timeout=180, json={'text': prompt, 'duration_seconds': sec, 'prompt_influence': influence})
        if r.status_code != 200: sys.exit(f'ElevenLabs {r.status_code}: {r.text[:300]}')
        f.write_bytes(r.content)
    return decode(f.read_bytes())


def tidy(x, thr_db=-45, lead=0.01, tail=0.05):
    m = np.abs(x).max(axis=1); pk = m.max()
    loud = np.where(m > pk * 10 ** (thr_db / 20))[0]
    s, e = max(0, loud[0] - int(lead * SR)), min(len(x), loud[-1] + int(tail * SR))
    x = x[s:e].copy(); f = min(len(x), int(0.03 * SR)); x[-f:] *= np.linspace(1, 0, f)[:, None]
    return x / pk * 10 ** (-1 / 20)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('id'); ap.add_argument('prompt')
    ap.add_argument('--sec', type=float, default=1.2); ap.add_argument('--n', type=int, default=2)
    ap.add_argument('--influence', type=float, default=0.6); ap.add_argument('--keep', default=None)
    a = ap.parse_args()
    keep = [int(k) for k in a.keep.split(',')] if a.keep else list(range(a.n))
    files = []
    for k in range(a.n):
        x = tidy(fetch(a.prompt, a.sec, a.influence, k))
        mono = x.mean(axis=1); n = int(0.01 * SR); fr = len(mono) // n
        env = np.sqrt((mono[:fr * n].reshape(fr, n) ** 2).mean(axis=1)); pk = int(np.argmax(env))
        sp = np.abs(np.fft.rfft(mono)); fq = np.fft.rfftfreq(len(mono), 1 / SR)
        print(f'  variant {k}: {len(x) / SR:.2f}s, loudest at {pk * 0.01:.2f}s, spectral centroid {int((sp * fq).sum() / sp.sum())} Hz' + ('' if k in keep else '  (not kept)'))
        if k in keep:
            f = f'{a.id}_{len(files)}.flac'; sf.write(SAMPLES / f, x, SR); files.append(f)
        sf.write(CACHE / f'{a.id}_variant{k}.wav', x, SR)
    man = json.loads((SAMPLES / 'manifest.json').read_text())
    man[a.id] = {'files': files, 'prompt': a.prompt, 'source': 'ElevenLabs sound generation'}
    (SAMPLES / 'manifest.json').write_text(json.dumps(dict(sorted(man.items())), indent=1) + '\n')
    print(f'{a.id}: {files}')


if __name__ == '__main__':
    main()
