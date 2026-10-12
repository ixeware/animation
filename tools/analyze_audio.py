"""Пословные тайминги, паузы, темп речи, басовые удары и характеристики голоса и музыки.

    python3 analyze_audio.py OUT_DIR/<user>

Для каждого поста нужны a16.wav и sep/htdemucs/a44/{vocals,no_vocals}.wav (см. analyze_tiktok.sh).
Пишет words.json и печатает сводку.
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np
import whisper

NOTES = "C C# D D# E F F# G G# A A# B".split()


def transcribe(model, wav):
    r = model.transcribe(str(wav), word_timestamps=True, language="en")
    return [(w["word"].strip(), round(w["start"], 2), round(w["end"], 2))
            for s in r["segments"] for w in s["words"]]


def phrases(words, gap=0.5):
    out, cur = [], []
    for i, (t, s, e) in enumerate(words):
        cur.append((t, s))
        nxt = words[i + 1][1] if i + 1 < len(words) else e + 9
        if t[-1:] in ".,!?" or nxt - e > gap:
            out.append((cur[0][1], " ".join(w for w, _ in cur), nxt - e))
            cur = []
    return out


def booms(mus, words):
    y, sr = librosa.load(mus, sr=22050, mono=True)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512))
    f = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = librosa.amplitude_to_db(S[f < 120].sum(0), ref=1.0)
    low -= low.max()
    t = librosa.frames_to_time(np.arange(len(low)), sr=sr, hop_length=512)
    d = np.diff(low, prepend=low[0])
    hits = []
    for i in np.where((d > 12) & (low > -22))[0]:
        if not hits or t[i] - hits[-1] > 0.8:
            hits.append(float(t[i]))
    near = lambda x: min(words, key=lambda w: abs(w[1] - x))[0] if words else ""
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    chroma = librosa.feature.chroma_cqt(y=librosa.effects.hpss(y)[0], sr=sr).mean(1)
    return [(h, near(h)) for h in hits], float(np.atleast_1d(tempo)[0]), \
        [NOTES[i] for i in np.argsort(chroma)[::-1][:4]]


def voice_f0(voc):
    y, sr = librosa.load(voc, sr=16000, duration=40)
    f0, _, _ = librosa.pyin(y, fmin=60, fmax=400, sr=sr)
    f0 = f0[~np.isnan(f0)]
    p10, p50, p90 = np.percentile(f0, [10, 50, 90])
    return p50, 12 * np.log2(p90 / p10)


def main(root):
    model = whisper.load_model("small")
    for d in sorted(Path(root).iterdir()):
        if not (d / "a16.wav").exists():
            continue
        words = transcribe(model, d / "a16.wav")
        (d / "words.json").write_text(json.dumps(words, ensure_ascii=False))
        dur = words[-1][2] - words[0][1]
        print(f"\n== {d.name}: {len(words)} слов, {dur:.1f} с, {len(words) / dur * 60:.0f} слов/мин")
        for t, text, gap in phrases(words):
            print(f"  {t:5.1f}  {text}" + (f"   [пауза {gap:.1f}]" if gap >= 0.6 else ""))
        sep = d / "sep" / "htdemucs" / "a44"
        if sep.exists():
            hits, tempo, keys = booms(str(sep / "no_vocals.wav"), words)
            f0, rng = voice_f0(str(sep / "vocals.wav"))
            print(f"  музыка: ~{tempo:.0f} BPM, тоны {keys}; голос: F0 {f0:.0f} Гц, диапазон {rng:.1f} пт")
            print("  BOOM: " + ", ".join(f"{h:.1f}s~{w}" for h, w in hits))


if __name__ == "__main__":
    main(sys.argv[1])
