"""The hall's screen frames from the screenshots of Chessigma's review page (capture/cg_capture.cjs).

    python3 episodes/fivepoints/capture/cg_frames.py <dir with raw/<tag>_NNN.png> [episodes/fivepoints/photos/cg]

Each screenshot is the page at 1600x900 CSS pixels (x1.5). The left navigation is cut off (as the sponsor asked for
witty2: more room for the board, no account name); the board with its bar and the coach's panel are centred on a 16:9
screen filled with the page's own background. Writes <tag>_NNN.jpg at 1600x900 (scenes.js loads mart_078, art_057,
art_058).
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1]) / 'raw'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'episodes/fivepoints/photos/cg')
X0, X1 = 292, 1588          # CSS pixels: from just left of the evaluation bar to just right of the coach's panel
OUT.mkdir(parents=True, exist_ok=True)
n = 0
for f in sorted(SRC.glob('*_*.png')):
    im = Image.open(f).convert('RGB')
    k = im.width / 1600
    block = im.crop((round(X0 * k), 0, round(X1 * k), im.height))
    page = Image.new('RGB', im.size, im.getpixel((round((X0 + 4) * k), im.height // 2)))
    page.paste(block, ((im.width - block.width) // 2, 0))
    page.resize((1600, 900), Image.LANCZOS).save(OUT / (f.stem + '.jpg'), quality=88, optimize=True)
    n += 1
print(n, 'frames ->', OUT)
