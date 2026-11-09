"""Sheets for the eye review of a film (the review step in CLAUDE.md), from `node render.mjs <ep> --review --step 0.5`.

    python3 tools/review_sheet.py episodes/<ep> [--min 300] [--per 12]

- build/review/frames_NN.jpg: the frames, `--per` to a sheet (4 across) at 360x640, each with its time and, in red,
  the QA findings of that frame;
- build/review/people_NN.jpg: every character bigger than `--min` px tall (a player's box or a cartoon face), cropped
  with some room round it and scaled to 520 px tall, 5 across: heads, shoulders, hands, layering and props are judged
  here, at a size where a wrong turn of the head or a sleeve sticking out is plain to see.
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def font(size):
    for name in ('DejaVuSansMono-Bold.ttf', 'consolab.ttf', 'arialbd.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def label(img, text, color=(240, 240, 240), size=22, y=None):
    d = ImageDraw.Draw(img); f = font(size)
    x0, y0, x1, y1 = d.textbbox((0, 0), text, font=f)
    yy = img.height - (y1 - y0) - 10 if y is None else y
    d.rectangle([4, yy - 4, 12 + x1 - x0, yy + y1 - y0 + 6], fill=(10, 10, 10))
    d.text((8 - x0, yy - y0), text, font=f, fill=color)


def main(ep, min_h=300, per=12):
    rev = Path(ep) / 'build' / 'review'
    frames = json.loads((rev / 'review.json').read_text(encoding='utf-8'))
    for old in list(rev.glob('frames_*.jpg')) + list(rev.glob('people_*.jpg')):
        old.unlink()
    # the frames
    cols, fw, fh = 4, 360, 640
    for s in range(0, len(frames), per):
        chunk = frames[s:s + per]; rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * fw, rows * fh), (0, 0, 0))
        for i, fr in enumerate(chunk):
            im = Image.open(rev / fr['file']).convert('RGB').resize((fw, fh), Image.LANCZOS)
            label(im, f"{fr['t']:.2f}s  shot {fr['shot']}")
            if fr['issues']:
                label(im, '; '.join(f"{x['type']}: {x['what']}" for x in fr['issues'])[:60], color=(255, 90, 80), size=16, y=8)
            sheet.paste(im, ((i % cols) * fw, (i // cols) * fh))
        sheet.save(rev / f'frames_{s // per:02d}.jpg', quality=88)
    # the people, large
    crops = []
    for fr in frames:
        im = None
        for p in fr['people']:
            if p['h'] < min_h: continue
            pad = 0.12 * max(p['w'], p['h'])
            box = [max(0, p['x'] - pad), max(0, p['y'] - pad), min(1080, p['x'] + p['w'] + pad), min(1920, p['y'] + p['h'] + pad)]
            if box[2] - box[0] < 40 or box[3] - box[1] < 40: continue
            im = im or Image.open(rev / fr['file']).convert('RGB')
            c = im.crop(tuple(int(v) for v in box)); k = 520 / c.height
            c = c.resize((max(1, int(c.width * k)), 520), Image.LANCZOS)
            if c.width > 520: c = c.crop(((c.width - 520) // 2, 0, (c.width - 520) // 2 + 520, 520))
            label(c, f"{fr['t']:.2f}s {p['label']}", size=18)
            crops.append(c)
    cols, cw, ch, per_sheet = 5, 520, 520, 20
    for s in range(0, len(crops), per_sheet):
        chunk = crops[s:s + per_sheet]; rows = (len(chunk) + cols - 1) // cols
        sheet = Image.new('RGB', (cols * cw, rows * ch), (24, 24, 24))
        for i, c in enumerate(chunk):
            sheet.paste(c, ((i % cols) * cw + (cw - c.width) // 2, (i // cols) * ch))
        sheet.save(rev / f'people_{s // per_sheet:02d}.jpg', quality=88)
    n_issue = sum(len(f['issues']) for f in frames)
    print(f'{len(frames)} frames -> {(len(frames) + per - 1) // per} frame sheets; {len(crops)} people crops -> '
          f'{(len(crops) + per_sheet - 1) // per_sheet} people sheets; QA findings: {n_issue}  ({rev})')


if __name__ == '__main__':
    a = sys.argv[1:]
    opt = lambda k, d: float(a[a.index(k) + 1]) if k in a else d
    main(a[0], min_h=opt('--min', 300), per=int(opt('--per', 12)))
