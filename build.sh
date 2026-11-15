#!/usr/bin/env bash
# Build an episode end to end: narration -> animation -> score/SFX mix -> final.mp4
#   ./build.sh fischer
#   SCALE=2 ./build.sh plea2005     # 4K: 2160x3840 (STYLE_BIBLE rule 67; every film from plea2005 on)
# Requirements: python3 with kokoro (TTS), numpy, scipy, soundfile; node + playwright; ffmpeg.
set -euo pipefail
EP=${1:?episode name}
cd "$(dirname "$0")"
python3 audio/tts.py "episodes/$EP"            # build/narration.wav + timings.json
node render.mjs "$EP" --workers "${WORKERS:-4}" --scale "${SCALE:-1}"  # build/video.mp4 + cues.json
python3 audio/mix.py "episodes/$EP"            # build/mix.wav + final.mp4
echo "done: episodes/$EP/build/final.mp4"
