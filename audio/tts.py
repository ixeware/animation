"""Narration: one Kokoro clip per phrase, deepened by tape-style resampling, assembled with
scripted pauses. Writes narration.wav and timings.json (phrase + word timestamps).

    python3 audio/tts.py episodes/fischer
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

SR = 24000


def words_of(text):
    return text.split()


def trim(a, thr=0.004, pad=0.08):
    idx = np.where(np.abs(a) > thr)[0]
    if not len(idx):
        return a, 0
    s = max(0, idx[0] - int(pad * SR))
    e = min(len(a), idx[-1] + int(pad * SR))
    return a[s:e], s / SR


def synth(pipe, text, voice, speed):
    audio, toks, off = [], [], 0.0
    for r in pipe(text, voice=voice, speed=speed):
        a = r.audio.numpy()
        for t in r.tokens or []:
            if t.start_ts is not None and t.end_ts is not None:
                toks.append((t.text, t.start_ts + off, t.end_ts + off, t.whitespace))
        audio.append(a)
        off += len(a) / SR
    return np.concatenate(audio), toks


def token_words(toks):
    """Merge Kokoro tokens into whitespace-separated words with (start, end)."""
    out, cur = [], None
    for text, s, e, ws in toks:
        if cur is None:
            cur = [text, s, e]
        else:
            cur[0] += text
            cur[2] = e
        if ws:
            out.append(tuple(cur))
            cur = None
    if cur:
        out.append(tuple(cur))
    return [w for w in out if re.search(r"\w", w[0])]


def main(ep):
    ep = Path(ep)
    script = json.loads((ep / "script.json").read_text())
    v = script["voice"]
    # tape-style deepen: synthesize faster, then slow down -> pitch drops by the same ratio
    ratio = 2 ** (-v.get("pitch_semitones", 0) / 12)  # >1 when lowering pitch
    from kokoro import KPipeline
    pipe = KPipeline(lang_code="a")
    out, phrases = [], []
    t = script.get("lead_in", 0.0)
    out.append(np.zeros(int(t * SR)))
    for p in script["phrases"]:
        audio, toks = synth(pipe, p.get("say", p["text"]), v["name"], v["speed"] * ratio)
        # stretch by `ratio`: more samples at the same rate = slower + lower
        audio = resample_poly(audio, int(round(1000 * ratio)), 1000)
        toks = [(x, s * ratio, e * ratio, w) for x, s, e, w in toks]
        audio, cut = trim(audio)
        dur = len(audio) / SR
        caps = words_of(p["text"])
        tw = token_words(toks)
        if len(tw) == len(caps):
            spans = [(max(0.0, s - cut), min(dur, e - cut)) for _, s, e in tw]
        else:  # fall back: spread by character length
            print(f"  [{p['id']}] token/word mismatch {len(tw)} vs {len(caps)} -> proportional")
            w8 = np.array([len(c) + 2 for c in caps], float)
            edges = np.concatenate([[0], np.cumsum(w8) / w8.sum() * dur])
            spans = list(zip(edges[:-1], edges[1:]))
        words = [{"w": c, "s": round(t + s, 3), "e": round(t + e, 3),
                  "c": p.get("colors", {}).get(c, "lime")} for c, (s, e) in zip(caps, spans)]
        phrases.append({"id": p["id"], "text": p["text"], "s": round(t, 3), "e": round(t + dur, 3),
                        "words": words})
        print(f"{t:6.2f}-{t + dur:6.2f}  {p['text']}")
        out.append(audio)
        t += dur
        gap = p.get("pause", 0.5)
        out.append(np.zeros(int(gap * SR)))
        t += gap
    tail = script.get("tail", 1.0)
    out.append(np.zeros(int(tail * SR)))
    t += tail
    a = np.concatenate(out).astype(np.float32)
    a /= max(1e-6, np.abs(a).max()) / 0.9
    build = ep / "build"
    build.mkdir(exist_ok=True)
    sf.write(build / "narration.wav", a, SR)
    (build / "timings.json").write_text(json.dumps({"duration": round(t, 3), "phrases": phrases}, indent=1))
    print(f"total {t:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1])
