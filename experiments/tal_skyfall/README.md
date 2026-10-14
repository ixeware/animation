# Tal vs Hecht · Skyfall edit (one-off test)

A cinematic music edit in the style of chess "FX" edits, separate from the episode engine (nothing in `engine/` or the
episodes is changed; piece sprites and the shatter effect are only imported).

- Game: Tal – Hecht, Varna Olympiad 1962 (`data/hecht.json`, from the pgnmentor Tal collection). Six moves where Tal leaves
  material en prise and Stockfish 17.1 (depth 20) keeps them within ~0.3 of best: 17.Nc4, 18.e5, 19.exf6 (the queen),
  21.Bf5, 24.Bc4, 25.g3.
- Timing follows the Skyfall clip from the reference edit (~152 BPM grid, hits at 14.0, 25.3, 41.4, 51.7 s). The song is not
  in the repo; put it at `build/skyfall.m4a` to mux a preview.
- `node render.mjs --stills 1,14,26` for stills, `node render.mjs --workers 4` for `build/video.mp4`.
