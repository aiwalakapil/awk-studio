#!/usr/bin/env python3
"""B-roll finder: a stock-footage plan for every line of a script or video, with licences logged.

Usage:
  broll.py --video VIDEO.mp4 [--lang hi] [-o broll_plan.json]          # lines from the transcript
  broll.py --script script.txt [-o broll_plan.json]                    # one line per sentence
  broll.py --plan broll_plan.json --download [-d broll/] [--per 2]     # fetch clips (needs PEXELS_API_KEY)

Step 1 writes broll_plan.json: [{"t": 3.2, "text": "...", "keywords": [], "links": {...}}].
Claude fills "keywords" (2-3 short ENGLISH visual searches per line, e.g. "phone typing close up").
Step 2 downloads portrait clips from Pexels (free licence, no attribution needed) and appends each
one to broll/LICENSES.md. Without an API key it prints search links for Pexels, Pixabay and Envato.
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk


def links(q):
    e = urllib.parse.quote(q)
    return {"pexels": f"https://www.pexels.com/search/videos/{e}/?orientation=portrait",
            "pixabay": f"https://pixabay.com/videos/search/{e}/",
            "envato": f"https://elements.envato.com/stock-video/{urllib.parse.quote(q.replace(' ', '-'))}"}


def lines_from_video(video, lang):
    words = awk.transcribe(Path(video).resolve(), lang)
    out, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[।?.!,]$", w["w"]) or len(cur) >= 12:
            out.append({"t": cur[0]["s"], "text": " ".join(x["w"] for x in cur)}); cur = []
    if cur:
        out.append({"t": cur[0]["s"], "text": " ".join(x["w"] for x in cur)})
    return out


def pexels(q, key, per):
    url = "https://api.pexels.com/videos/search?" + urllib.parse.urlencode({"query": q, "orientation": "portrait", "per_page": per, "size": "medium"})
    req = urllib.request.Request(url, headers={"Authorization": key, "User-Agent": "awk-studio-broll"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["videos"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video"); ap.add_argument("--script"); ap.add_argument("--lang", default="hi")
    ap.add_argument("--plan"); ap.add_argument("--download", action="store_true")
    ap.add_argument("-o", "--out", default="broll_plan.json"); ap.add_argument("-d", "--dir", default="broll")
    ap.add_argument("--per", type=int, default=2)
    a = ap.parse_args()

    if a.plan and a.download:
        plan = json.loads(Path(a.plan).read_text())
        key = os.environ.get("PEXELS_API_KEY")
        d = Path(a.dir); d.mkdir(exist_ok=True)
        lic = d / "LICENSES.md"
        if not lic.exists():
            lic.write_text("# B-roll licences\n\n| File | Source | Author | Licence | Used for |\n|---|---|---|---|---|\n")
        for i, row in enumerate(plan):
            for q in row.get("keywords", []):
                if not key:
                    print(f"  {row['t']:6.1f}s  {q:30s} {links(q)['pexels']}"); continue
                for v in pexels(q, key, a.per):
                    f = min((x for x in v["video_files"] if x.get("height") and x["height"] >= x.get("width", 0)),
                            key=lambda x: abs(x["height"] - 1920), default=None)
                    if not f:
                        continue
                    name = d / f"L{i + 1:02d}_{re.sub(r'[^a-z0-9]+', '-', q.lower())}_{v['id']}.mp4"
                    if not name.exists():
                        urllib.request.urlretrieve(f["link"], name)
                        with lic.open("a") as L:
                            L.write(f"| {name.name} | {v['url']} | {v['user']['name']} | Pexels licence (free, no attribution required) | {row['text'][:40]} |\n")
                    print("  ✓", name.name)
        if not key:
            print("\nNo PEXELS_API_KEY set: open the links above, or get a free key at pexels.com/api and export PEXELS_API_KEY.")
        return

    rows = lines_from_video(a.video, a.lang) if a.video else [
        {"t": None, "text": s.strip()} for s in re.split(r"(?<=[।?.!])\s+", Path(a.script).read_text()) if s.strip()]
    plan = [{**r, "keywords": [], "links": {}} for r in rows]
    Path(a.out).write_text(json.dumps(plan, ensure_ascii=False, indent=1))
    print(f"{len(plan)} lines -> {a.out}. Fill 'keywords' (English visual searches), then run with --plan {a.out} --download")


if __name__ == "__main__":
    main()
