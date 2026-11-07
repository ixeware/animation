#!/usr/bin/env python3
# Cut the fish out of the Stockfish logo (a cod over a green 2x2 tile): fish pixels are yellow-grey (hue 45-65),
# the tile is green to teal (hue 105-180). Keep the biggest fish region, soften the edge, take the green spill off it,
# and turn the fish level: head to the left, back up (the eye sits on the back side of the head, the barbel under the chin). argv: source png, output png, preview png
import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
src, out, prev = sys.argv[1:4]
a = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255
R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
mx, mn = np.maximum(np.maximum(R, G), B), np.minimum(np.minimum(R, G), B)
d = mx - mn + 1e-6
S = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
H = np.where(mx == R, (60 * (G - B) / d) % 360, np.where(mx == G, 60 * (B - R) / d + 120, 60 * (R - G) / d + 240))
opaque = A > 0.5
tile = opaque & (H > 82) & (H < 200) & (S > 0.08)
fish = ndi.binary_opening(opaque & ~tile, iterations=1)
lab, n = ndi.label(fish)
sizes = ndi.sum(fish, lab, range(1, n + 1))
keep = ndi.binary_fill_holes(lab == (int(np.argmax(sizes)) + 1))
keep = ndi.binary_fill_holes(ndi.binary_closing(keep, iterations=2))
alpha = np.minimum(ndi.gaussian_filter(ndi.binary_erosion(keep, iterations=1).astype(np.float32), 0.8), A)
rim = keep & ndi.binary_dilation(~keep, iterations=3)
G2 = np.where(rim | ((alpha > 0.02) & (alpha < 0.98)), np.minimum(G, (R + B) / 2 + 0.03), G)
img = Image.fromarray((np.clip(np.dstack([R, G2, B, alpha]), 0, 1) * 255).astype(np.uint8), 'RGBA')
# the long axis (PCA of the mask), pointed from the head (lower left) to the tail (upper right)
ys, xs = np.nonzero(keep)
c = np.cov(np.vstack([xs - xs.mean(), ys - ys.mean()]))
w, v = np.linalg.eigh(c); ax = v[:, np.argmax(w)]
if ax[1] > 0: ax = -ax
phi = np.degrees(np.arctan2(ax[1], ax[0]))
img = img.rotate(phi, resample=Image.BICUBIC, expand=True)  # head left, tail right; the eye and the back up, the barbel under the chin
img = img.crop(img.getchannel('A').point(lambda q: 255 if q > 8 else 0).getbbox())
img.save(out)
bg = Image.new('RGBA', img.size, (35, 120, 190, 255)); bg.alpha_composite(img); bg.convert('RGB').save(prev)
print('axis angle', round(float(phi), 1), 'size', img.size)
