"""Shots too short to read: every stretch between two picture changes that lasts less than a threshold.

    python3 tools/shortshots.py <video> [--min 0.6] [--scene 0.22]

A shot of a few frames between two other shots reads as a flash, a "25th frame" (witty2 v5: a 0.3 s fast-forward
through ten moves; a room lit for 0.33 s before it went dark). Run it on the finished file with the frame-by-frame
look (CLAUDE.md, step 9). Stretches of 1-3 frames are the blurred frames of a whip or a zoom, and a planned flash
(a slash, a negative) shows up too: look at each line and decide; anything from 0.1 s to the threshold is a shot to
lengthen or to cut. Needs ffmpeg.
"""
import re, subprocess, sys

args = sys.argv[1:]
video = args[0]
least = float(args[args.index('--min') + 1]) if '--min' in args else 0.6
scene = float(args[args.index('--scene') + 1]) if '--scene' in args else 0.22
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout)
out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', video, '-vf', f"scale=270:480,select='gt(scene,{scene})',metadata=print:file=-", '-an', '-f', 'null', '-'],
                     capture_output=True, text=True).stdout
cuts = [float(x) for x in re.findall(r'pts_time:([0-9.]+)', out)]
print(f'{len(cuts)} picture changes in {dur:.1f} s')
n = 0
for a, b in zip([0.0] + cuts, cuts + [dur]):
    if b - a < least and b < dur - 0.05:
        kind = 'transition frames' if b - a < 0.1 else 'SHORT SHOT'
        n += kind == 'SHORT SHOT'
        print(f'  {a:6.2f} -> {b:6.2f}  {b - a:.2f} s  {kind}')
print(f'{n} short shot(s) to look at' if n else 'no shot shorter than %.1f s' % least)
