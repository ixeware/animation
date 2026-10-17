"""TikTok account stats and comments, for planning the next videos (STYLE_BIBLE rules 38-40).

    python3 tools/tiktok.py stats the64files [out.json]     views, likes, comments, shares, saves of every video
    python3 tools/tiktok.py comments the64files out_dir/     out_dir/<video id>.json: every comment and reply

Public pages and TikTok's web comment API, no login. Keeps no user names. Needs curl_cffi and yt-dlp (with
curl-cffi, for --impersonate).
"""
import datetime, json, re, subprocess, sys, time
from pathlib import Path

from curl_cffi import requests

S = requests.Session(impersonate="chrome")


def rehydration(url):
    html = S.get(url).text
    m = re.search(r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)</script>', html, re.S)
    return json.loads(m.group(1))["__DEFAULT_SCOPE__"] if m else {}


def list_ids(user):
    out = subprocess.run(["yt-dlp", "--impersonate", "chrome", "--flat-playlist", "-J", f"https://www.tiktok.com/@{user}"],
                         capture_output=True, text=True).stdout
    return [e["id"] for e in json.loads(out).get("entries", [])] if out else []


def stats(user):
    u = rehydration(f"https://www.tiktok.com/@{user}").get("webapp.user-detail", {}).get("userInfo", {}).get("stats", {})
    print(f"followers {u.get('followerCount')}  likes {u.get('heartCount')}  videos {u.get('videoCount')}")
    rows = []
    for vid in list_ids(user):
        it = rehydration(f"https://www.tiktok.com/@{user}/video/{vid}").get("webapp.video-detail", {}).get("itemInfo", {}).get("itemStruct", {})
        st = it.get("stats", {}) or it.get("statsV2", {})
        rows.append({"id": vid, "date": datetime.datetime.fromtimestamp(int(it.get("createTime", 0)), datetime.UTC).strftime("%Y-%m-%d %H:%M"),
                     "dur": it.get("video", {}).get("duration"), "views": int(st.get("playCount", 0)), "likes": int(st.get("diggCount", 0)),
                     "comments": int(st.get("commentCount", 0)), "shares": int(st.get("shareCount", 0)), "saves": int(st.get("collectCount", 0) or 0),
                     "desc": it.get("desc") or ""})
        r = rows[-1]
        print(f"{r['date']}  {r['dur']}s  views {r['views']:>7}  likes {r['likes']:>6}  com {r['comments']:>4}  sh {r['shares']:>4}  sv {r['saves']:>4}  | {r['desc'][:60]}", flush=True)
        time.sleep(1.5)
    return rows


def _page(url, referer):
    for attempt in range(3):
        r = S.get(url, headers={"Referer": referer})
        if r.status_code == 200 and r.text.strip():
            return r.json()
        time.sleep(2 + attempt * 3)
    return {}


def _row(c, parent=None):
    return {"cid": c.get("cid"), "parent": parent, "text": c.get("text") or "", "likes": c.get("digg_count", 0),
            "replies": c.get("reply_comment_total", 0), "time": c.get("create_time"), "lang": c.get("comment_language")}


def comments(user, out_dir):
    out_dir = Path(out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    for v in stats(user):
        vid, ref = v["id"], f"https://www.tiktok.com/@{user}/video/{v['id']}"
        S.get(ref)  # cookies for this video
        out, seen, cursor = [], set(), 0
        while True:
            d = _page(f"https://www.tiktok.com/api/comment/list/?aid=1988&aweme_id={vid}&count=50&cursor={cursor}", ref)
            cs = d.get("comments") or []
            for c in cs:
                if c.get("cid") in seen:
                    continue
                seen.add(c.get("cid")); out.append(_row(c))
                rc = 0
                while c.get("reply_comment_total", 0) > 0:
                    rd = _page(f"https://www.tiktok.com/api/comment/list/reply/?aid=1988&item_id={vid}&comment_id={c['cid']}&count=50&cursor={rc}", ref)
                    rs = rd.get("comments") or []
                    for x in rs:
                        if x.get("cid") not in seen:
                            seen.add(x.get("cid")); out.append(_row(x, c["cid"]))
                    if not rd.get("has_more") or not rs:
                        break
                    rc = rd.get("cursor", rc + len(rs)); time.sleep(0.8)
            if not d.get("has_more") or not cs:
                break
            cursor = d.get("cursor", cursor + len(cs)); time.sleep(1.0)
        (out_dir / f"{vid}.json").write_text(json.dumps({**v, "comments_scraped": out}, ensure_ascii=False, indent=0))
        print(f"  {vid}: {len(out)} of {v['comments']} comments", flush=True)
        time.sleep(1.5)


if __name__ == "__main__":
    cmd, user = sys.argv[1], sys.argv[2]
    if cmd == "stats":
        rows = stats(user)
        if len(sys.argv) > 3:
            Path(sys.argv[3]).write_text(json.dumps(rows, ensure_ascii=False, indent=1))
    elif cmd == "comments":
        comments(user, sys.argv[3])
