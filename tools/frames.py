#!/usr/bin/env python3
"""Screen recordings as frames for a device screen in a scene (episodes/woodpecker: the phone with the Chessigma app).

    python3 tools/frames.py episodes/woodpecker [--fps 30]

Every episodes/<ep>/photos/rec/*.mp4 becomes episodes/<ep>/build/rec/<name>/001.jpg, 002.jpg, ... at the given rate,
and build/rec/index.json lists them: {"<name>": {"n": frames, "fps": rate, "dur": seconds}}. scenes.js loads the frames
it needs and draws the one for the story time. build/ is not in git, so run this before render.mjs on a fresh clone.
"""
import json
import subprocess
import sys
from pathlib import Path

args = sys.argv[1:]
fps = 30
if '--fps' in args:
    i = args.index('--fps'); fps = float(args[i + 1]); del args[i:i + 2]
ep = Path(args[0])
src, out = ep / 'photos' / 'rec', ep / 'build' / 'rec'
index = {}
for clip in sorted(src.glob('*.mp4')):
    d = out / clip.stem
    d.mkdir(parents=True, exist_ok=True)
    for old in d.glob('*.jpg'):
        old.unlink()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(clip), '-vf', f'fps={fps}', '-q:v', '3', str(d / '%03d.jpg')], check=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(clip)],
                               capture_output=True, text=True, check=True).stdout)
    n = len(list(d.glob('*.jpg')))
    index[clip.stem] = {'n': n, 'fps': fps, 'dur': round(dur, 3)}
    print(f'{clip.stem}: {n} frames, {dur:.2f} s')
out.mkdir(parents=True, exist_ok=True)
(out / 'index.json').write_text(json.dumps(index, indent=1))
print('->', out / 'index.json')
