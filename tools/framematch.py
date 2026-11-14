"""Where do still frames sit in a video: evidence that somebody's upload is a copy of ours.

    python3 tools/framematch.py <our video> <frame.jpg> [<frame.jpg> ...]

YouTube publishes a few frames of every video on its own server, without a sign-in:
https://i.ytimg.com/vi/<id>/frame0.jpg (the first frame) and oar1.jpg, oar2.jpg, oar3.jpg (three more, full size).
Download them and run this against our finished file: for each frame it prints the time of our closest frame and how
close it is (a mean squared difference; a match is far below the median). It shows which parts of our video the copy
contains; it does not give the copy's length (the three frames are not taken at fixed points). Needs ffmpeg, numpy, Pillow.
"""
import subprocess, sys
import numpy as np
from PIL import Image

video, imgs = sys.argv[1], sys.argv[2:]
w, h, fps = 108, 192, 10
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', video, '-vf', f'fps={fps},scale={w}:{h}', '-pix_fmt', 'gray', '-f', 'rawvideo', '-'],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
print(f'{video}: {len(fr)} frames, {len(fr) / fps:.1f} s')
for p in imgs:
    im = np.asarray(Image.open(p).convert('L').resize((w, h), Image.LANCZOS), np.float32)
    d = ((fr - im) ** 2).mean(axis=(1, 2))
    o = np.argsort(d)[:5]
    print(p, 'best', ', '.join(f'{i / fps:.1f}s ({d[i]:.0f})' for i in o), '| median', f'{np.median(d):.0f}')
