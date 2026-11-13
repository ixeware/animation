"""The TV's frames from the screenshots of Chessigma's review page (capture/tv_capture.cjs).

    python3 episodes/witty2/capture/tv_frames.py <dir with plyf/ply_000.png ...> [episodes/witty2/photos/tv]

Each screenshot is the page at 1600x900 CSS pixels (x1.5). The left navigation is cut off (the sponsor asked for it:
more room for the board, and it shows the account's name and streak); what is left, the board with its bar and the
coach's panel, is centred on a 16:9 screen filled with the page's own background. Writes ply_NNN.jpg at 1440x810 for
all plies and hd/ply_NNN.jpg at full size for the plies the sponsor block shows in close-up.
"""
import sys
from pathlib import Path
from PIL import Image

SRC = Path(sys.argv[1]) / 'plyf'
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else 'episodes/witty2/photos/tv')
X0, X1 = 292, 1588          # CSS pixels: from just left of the evaluation bar to just right of the coach's panel
HD = (11, 34, 102)          # the plies shown in close-up (scenes.js, the sponsor block)
(OUT / 'hd').mkdir(parents=True, exist_ok=True)
n = 0
for f in sorted(SRC.glob('ply_*.png')):
    im = Image.open(f).convert('RGB')
    k = im.width / 1600
    block = im.crop((round(X0 * k), 0, round(X1 * k), im.height))
    page = Image.new('RGB', im.size, im.getpixel((round((X0 + 4) * k), im.height // 2)))
    page.paste(block, ((im.width - block.width) // 2, 0))
    page.resize((1440, 810), Image.LANCZOS).save(OUT / (f.stem + '.jpg'), quality=86, optimize=True)
    if int(f.stem[4:]) in HD: page.save(OUT / 'hd' / (f.stem + '.jpg'), quality=90, optimize=True)
    n += 1
print(n, 'frames ->', OUT)
