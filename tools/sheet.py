"""Contact sheets from a finished video, for the frame-by-frame review (CLAUDE.md, step 9) and for notes in reference/:
python3 tools/sheet.py video.mp4 out.jpg 1.0 2.5 ... [--cols 6] [--w 360]   frames at these times
python3 tools/sheet.py video.mp4 out.jpg --every 1 [--cols 12] [--w 180]     a frame every second of the whole video
Each frame carries its time in the corner, so a frame on the sheet can be found in scenes.js.
"""
import subprocess
import sys
from io import BytesIO

from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]


def opt(k, default):
    if '--' + k not in args:
        return default
    i = args.index('--' + k)
    v = float(args[i + 1])
    del args[i:i + 2]
    return v


cols, w, every = int(opt('cols', 6)), int(opt('w', 360)), opt('every', 0)
video, out, times = args[0], args[1], [float(x) for x in args[2:]]
if every:
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video],
                               capture_output=True, text=True, check=True).stdout)
    times = [round(every / 2 + i * every, 2) for i in range(int(dur / every))]
h = round(w * 16 / 9)
try:
    font = ImageFont.truetype('DejaVuSansMono-Bold.ttf', max(12, w // 15))
except OSError:
    font = ImageFont.load_default()
sheet = Image.new('RGB', (min(cols, len(times)) * w, -(-len(times) // cols) * h), 'black')
for i, t in enumerate(times):
    png = subprocess.run(['ffmpeg', '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1',
                          '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True, check=True).stdout
    im = Image.open(BytesIO(png)).convert('RGB').resize((w, h), Image.LANCZOS)
    d, label = ImageDraw.Draw(im), f'{t:g} s'
    x0, y0, x1, y1 = d.textbbox((0, 0), label, font=font)
    pad = max(3, w // 60)
    d.rectangle((0, h - (y1 - y0) - 3 * pad, x1 - x0 + 2 * pad, h), fill=(0, 0, 0))
    d.text((pad - x0, h - (y1 - y0) - 1.5 * pad - y0), label, font=font, fill=(235, 235, 235))
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=84, optimize=True)
print(out, len(times), 'frames', sheet.size)
