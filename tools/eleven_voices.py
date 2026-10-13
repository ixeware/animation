"""Find an ElevenLabs narrator that sounds like a reference voice.

    ELEVENLABS_API_KEY=... python3 tools/eleven_voices.py REF_VOCALS.wav OUT_DIR [--search "deep documentary narrator"]

Collects candidates (voices already in the account, including premade ones, plus the public voice library filtered to
male English narrative/documentary voices), downloads every preview, scores it against the reference with an ECAPA
speaker embedding (speechbrain) and writes OUT_DIR/ranking.json and OUT_DIR/top.mp3 (top previews back to back).
The chosen voice_id goes into script.json -> "voice_fx": {"sts": {"voice_id": ...}}. Library voices must be added to
the account first (the script prints the call), premade ones work as they are.
"""
import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np
import requests

API = 'https://api.elevenlabs.io/v1'


def get(path, **params):
    r = requests.get(API + path, headers={'xi-api-key': os.environ['ELEVENLABS_API_KEY']}, params=params, timeout=60)
    r.raise_for_status()
    return r.json()


def candidates(search):
    out = {}
    for v in get('/voices').get('voices', []):
        out[v['voice_id']] = {'name': v['name'], 'source': v.get('category', 'account'), 'labels': v.get('labels', {}), 'preview': v.get('preview_url')}
    for q in [search, 'documentary narrator', 'storyteller deep', 'history narrator']:
        lib = get('/shared-voices', page_size=60, language='en', gender='male', search=q, sort='usage_character_count_1y')
        for v in lib.get('voices', []):
            out.setdefault(v['voice_id'], {'name': v['name'], 'source': 'library', 'public_owner_id': v.get('public_owner_id'),
                                           'labels': {k: v.get(k) for k in ('accent', 'age', 'use_case', 'descriptive')}, 'preview': v.get('preview_url')})
    return {k: v for k, v in out.items() if v['preview']}


def load(path_or_bytes, sr=16000):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', '-' if isinstance(path_or_bytes, bytes) else str(path_or_bytes), '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                       input=path_or_bytes if isinstance(path_or_bytes, bytes) else None, capture_output=True, check=True)
    return np.frombuffer(p.stdout, np.float32).copy()


def main(ref, out_dir, search='deep documentary narrator'):
    out = Path(out_dir); (out / 'prev').mkdir(parents=True, exist_ok=True)
    from speechbrain.inference.speaker import EncoderClassifier
    import torch
    enc = EncoderClassifier.from_hparams('speechbrain/spkrec-ecapa-voxceleb', savedir=str(out / 'ecapa'))
    emb = lambda a: torch.nn.functional.normalize(enc.encode_batch(torch.from_numpy(a)[None]).squeeze(), dim=0)
    r = load(ref)
    # reference: speech-only chunks of the vocal stem
    e_ref = emb(r[: 16000 * 60])
    rows = []
    for vid, c in candidates(search).items():
        f = out / 'prev' / f'{vid}.mp3'
        if not f.exists():
            try:
                f.write_bytes(requests.get(c['preview'], timeout=60).content)
            except Exception as e:  # noqa: BLE001 - a dead preview link just skips the voice
                print('skip', c['name'], e); continue
        a = load(f)
        if len(a) < 16000: continue
        score = float((emb(a) * e_ref).sum())
        rows.append({'voice_id': vid, 'score': round(score, 3), **c})
        print(f"{score:.3f}  {c['source']:9s} {c['name']}")
    rows.sort(key=lambda x: -x['score'])
    (out / 'ranking.json').write_text(json.dumps(rows, indent=1, ensure_ascii=False))
    top = rows[:6]
    lst = out / 'top.txt'
    lst.write_text(''.join(f"file '{(out / 'prev' / (x['voice_id'] + '.mp3')).resolve()}'\n" for x in top))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', str(lst), '-c:a', 'libmp3lame', '-q:a', '3', str(out / 'top.mp3')], check=True)
    for x in top:
        print(f"TOP {x['score']:.3f} {x['name']} ({x['source']}) voice_id={x['voice_id']}")
        if x['source'] == 'library':
            print(f"     add to account: POST {API}/voices/add/{x.get('public_owner_id')}/{x['voice_id']}  json={{'new_name': '{x['name']}'}}")


if __name__ == '__main__':
    args = sys.argv[1:]
    s = 'deep documentary narrator'
    if '--search' in args:
        i = args.index('--search'); s = args[i + 1]; del args[i:i + 2]
    main(*args, search=s)
