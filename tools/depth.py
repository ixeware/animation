"""Depth maps for 2.5D photo moves: python3 tools/depth.py photo.jpg [...] -> photo_depth.png next to each photo.

Depth Anything V2 (small) predicts relative depth; near = white. The map is dilated a little and blurred so
foreground edges carry their depth slightly past the silhouette (less tearing when the camera moves).
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from transformers import pipeline

pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf')
for f in map(Path, sys.argv[1:]):
    im = Image.open(f).convert('RGB')
    d = np.asarray(pipe(im)['depth'].resize(im.size, Image.BICUBIC), np.float32)
    d = (d - d.min()) / max(1e-6, d.max() - d.min())
    out = Image.fromarray((d * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(4))
    out.save(f.with_name(f.stem + '_depth.png'))
    print(f.name, im.size)
