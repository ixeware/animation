"""Generate sound effects with ElevenLabs (text to SFX) into the sample library, audio/samples.

    python3 tools/eleven_sfx.py audio/samples/football.json            # every id in the list that is not in the library yet
    python3 tools/eleven_sfx.py audio/samples/football.json whistle net  # only these ids (regenerates them)

The list is JSON: {"id": {"prompt": "...", "duration": 1.2, "variants": 2, "loop": false, "influence": 0.5, "keep": 0}}.
One-shots are trimmed (silence before and after) and peak-normalised to -1 dBFS; loops (crowd beds) are kept whole,
since their ends were generated to join, and normalised to -6 dBFS. Files are FLAC at 44.1 kHz; manifest.json gets the
prompt and the source, like the rest of the library. API answers are cached in build/sfx_cache, so a re-run costs
nothing. Needs ELEVENLABS_API_KEY. The free tier does not grant commercial rights; a paid plan does.
"""
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import requests
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
LIB = ROOT / 'audio' / 'samples'
CACHE = ROOT / 'build' / 'sfx_cache'
SR = 44100


def decode(data):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-', '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], input=data, capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy().reshape(-1, 2)


def generate(spec, k):
    body = {'text': spec['prompt'], 'prompt_influence': spec.get('influence', 0.5), 'model_id': spec.get('model', 'eleven_text_to_sound_v2')}
    if spec.get('duration'): body['duration_seconds'] = spec['duration']
    if spec.get('loop'): body['loop'] = True
    key = hashlib.sha1(json.dumps([body, k], sort_keys=True).encode()).hexdigest()[:16]
    f = CACHE / f'sfx_{key}.mp3'
    if not f.exists():
        api = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
        r = requests.post('https://api.elevenlabs.io/v1/sound-generation', params={'output_format': 'mp3_44100_128'},
                          headers={'xi-api-key': api}, json=body, timeout=180)
        if r.status_code != 200:
            sys.exit(f'ElevenLabs SFX {r.status_code}: {r.text[:300]}')
        CACHE.mkdir(parents=True, exist_ok=True); f.write_bytes(r.content)
    return decode(f.read_bytes())


def tidy(x, loop):
    if loop:
        return x / max(1e-6, np.abs(x).max()) * 10 ** (-6 / 20)
    a = np.abs(x).max(1)
    on = np.where(a > a.max() * 0.02)[0]
    if len(on):
        s, e = max(0, on[0] - int(0.01 * SR)), min(len(x), on[-1] + int(0.12 * SR))
        x = x[s:e].copy()
        f = min(len(x) // 4, int(0.06 * SR))
        x[-f:] *= np.linspace(1, 0, f)[:, None]  # no click at the cut end
    return x / max(1e-6, np.abs(x).max()) * 10 ** (-1 / 20)


def main(lst, only):
    specs = json.loads(Path(lst).read_text(encoding='utf-8'))
    man_f = LIB / 'manifest.json'
    man = json.loads(man_f.read_text(encoding='utf-8'))
    for sid, spec in specs.items():
        if only and sid not in only:
            continue
        if not only and sid in man:
            print(f'{sid}: in the library'); continue
        files = []
        for k in range(spec.get('variants', 1)):
            x = tidy(generate(spec, k + spec.get('seed', 0)), spec.get('loop'))
            name = f'{sid}_{k}.flac'
            sf.write(LIB / name, x, SR, format='FLAC', subtype='PCM_16')
            files.append(name)
            print(f'{sid}: {name} {len(x) / SR:.2f}s')
        man[sid] = {'files': files, 'prompt': spec['prompt'], 'source': 'ElevenLabs sound generation', **({'loop': True} if spec.get('loop') else {})}
    man_f.write_text(json.dumps(man, indent=1, ensure_ascii=False) + '\n', encoding='utf-8')


if __name__ == '__main__':
    main(sys.argv[1], set(sys.argv[2:]))
