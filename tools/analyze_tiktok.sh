#!/usr/bin/env bash
# Разбор TikTok-профиля: скачивание, кадры, склейки, пословная расшифровка, отделение голоса,
# поиск басовых ударов. Так был сделан reference/episodes.md.
#
#   pip install "yt-dlp[curl-cffi]" openai-whisper demucs librosa
#   tools/analyze_tiktok.sh OUT_DIR chess.history
#
# Скачивание идёт через scrape_tiktok.py из репозитория blud (tools/scrape_tiktok.py).
set -euo pipefail
OUT=$1; USER=$2
HERE=$(cd "$(dirname "$0")" && pwd)
SCRAPER=${SCRAPER:-$HERE/../../blud/tools/scrape_tiktok.py}

python3 "$SCRAPER" "$OUT" "$USER"

for d in "$OUT/$USER"/*/; do
  v="$d/video.mp4"; [ -f "$v" ] || continue
  echo "== $d"
  mkdir -p "$d/f"
  # Кадры 2 к/с и контактные листы 10x4 (по 20 с на лист)
  ffmpeg -v error -y -i "$v" -vf "fps=2,scale=270:480" "$d/f/%04d.jpg"
  ffmpeg -v error -y -i "$v" -vf "fps=2,scale=180:320,tile=10x4" "$d/sheet_%02d.jpg"
  # Склейки
  ffmpeg -i "$v" -vf "select='gt(scene,0.25)',showinfo" -f null - 2>&1 \
    | grep -o "pts_time:[0-9.]*" | cut -d: -f2 > "$d/scenes.txt"
  # Звук: моно 16 кГц для whisper, 44,1 кГц для demucs, спектрограмма
  ffmpeg -v error -y -i "$v" -ac 1 -ar 16000 "$d/a16.wav"
  ffmpeg -v error -y -i "$v" -ar 44100 "$d/a44.wav"
  ffmpeg -v error -y -i "$v" -lavfi "showspectrumpic=s=1800x500:legend=1:scale=log:fscale=log" "$d/spec.png"
  python3 -m demucs --two-stems=vocals -n htdemucs -o "$d/sep" "$d/a44.wav"
done

python3 "$HERE/analyze_audio.py" "$OUT/$USER"
