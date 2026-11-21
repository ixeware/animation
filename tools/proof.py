"""Proof of who had the video first: the fingerprint of the finished file, written down before the video is published.

    python3 tools/proof.py <the file that goes to TikTok> [note]

Adds a row to business/proofs.md: the time (UTC), the file's name, size, length, picture size and SHA-256. Commit and
push it BEFORE posting: the push time on GitHub is somebody else's clock, and it shows this exact file existed before
anybody could have copied it (CLAUDE.md, step 10; STYLE_BIBLE rule 70). YouTube has taken a copy for the original
before; with the row and the file itself the order of events can be shown to anyone.
Keep the file: a hash proves nothing without the file it was taken from. Needs ffprobe.
"""
import datetime, hashlib, os, subprocess, sys

if len(sys.argv) < 2:
    sys.exit(__doc__)
path, note = sys.argv[1], ' '.join(sys.argv[2:])
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
log = os.path.join(root, 'business', 'proofs.md')

h = hashlib.sha256()
with open(path, 'rb') as f:
    for chunk in iter(lambda: f.read(1 << 20), b''):
        h.update(chunk)
probe = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration',
                        '-of', 'default=nw=1:nk=1', path], capture_output=True, text=True).stdout.split()
size = f'{probe[0]}×{probe[1]}' if len(probe) >= 3 else '?'
dur = f'{float(probe[-1]):.2f} s' if probe else '?'
now = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

if not os.path.exists(log):
    with open(log, 'w', encoding='utf-8') as f:
        f.write('# Отпечатки готовых роликов до публикации\n\n'
                'Каждая строка записана `python3 tools/proof.py <файл>` и запушена до публикации ролика: время пуша на GitHub\n'
                'показывает, что этот файл существовал раньше любой копии (STYLE_BIBLE, правило 70). Проверка: `sha256sum <файл>`.\n\n'
                '| Записано (UTC) | Файл | Байт | Длина | Кадр | SHA-256 | Заметка |\n|---|---|---|---|---|---|---|\n')
with open(log, 'a', encoding='utf-8') as f:
    f.write(f'| {now} | `{os.path.basename(path)}` | {os.path.getsize(path)} | {dur} | {size} | `{h.hexdigest()}` | {note} |\n')
print(f'{os.path.basename(path)}  {h.hexdigest()}\n-> {os.path.relpath(log, root)}; now commit and push it, then post the video')
