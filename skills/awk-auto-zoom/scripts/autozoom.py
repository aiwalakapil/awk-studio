#!/usr/bin/env python3
"""Auto-zoom: punch-ins that hide jump cuts and hit the important words.

Usage:
  autozoom.py VIDEO [-o OUT] [--edl X.edl.json] [--words "free,link,₹"] [--amount 0.12] [--lang hi] [--dry-run]

- Every other segment between cuts gets a steady zoom (12%) centred on the face, so jump cuts feel intentional.
  Cuts come from --edl (awk-auto-cut) or, without it, from pauses in the speech.
- --words: a quick 20% punch on each of these words.
Runs through the effects engine (awk-effects), so it can be combined with other effects in one spec too.
"""
import argparse, json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("-o", "--out"); ap.add_argument("--edl")
    ap.add_argument("--words", default=""); ap.add_argument("--amount", type=float, default=0.12)
    ap.add_argument("--lang", default="hi"); ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    src = Path(a.video).resolve(); dur = awk.duration(src)
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "_zoom.mp4")
    words = awk.transcribe(src, a.lang)
    if a.edl:
        cuts = json.loads(Path(a.edl).read_text())["cuts"]
    else:
        cuts = [(s0 + s1) / 2 for s0, s1 in awk.silences(src, -32, 0.18)]   # mid-pause = natural cut point
        if len(cuts) < dur / 4:   # music under the voice hides pauses: use word starts after small gaps too
            cuts += [w["s"] for p, w in zip(words, words[1:]) if w["s"] - p["e"] > 0.08]
    # keep segments 1.2-4 s: drop crowded points, split long stretches at the nearest word start
    pts, last = [], 0.0
    for c in sorted(set(round(c, 2) for c in cuts)):
        if c - last >= 1.2 and dur - c >= 1.0:
            pts.append(c); last = c
    full, starts = [0.0] + pts + [dur], [w["s"] for w in words]
    pts = []
    for s0, s1 in zip(full, full[1:]):
        while s1 - s0 > 4.0:
            mid = s0 + (s1 - s0) / 2
            near = min(starts, key=lambda x: abs(x - mid)) if starts else mid
            near = near if s0 + 1.2 < near < s1 - 1.2 else mid
            pts.append(near); s0 = near
        if s1 < dur:
            pts.append(s1)
    cuts = pts
    bounds = [0.0] + [c for c in cuts if 0.3 < c < dur - 0.3] + [dur]
    cues = []
    for i, (s, e) in enumerate(zip(bounds, bounds[1:])):
        if i % 2 == 1 and e - s > 0.4:
            cues.append({"fx": "transition", "t": round(s, 3), "dur": round(e - s, 3), "props": {"kind": "zoom-hold", "amount": a.amount}})
    want = [x.strip() for x in a.words.split(",") if x.strip()]
    for w in words:
        if any(awk.word_match(x, w["w"]) for x in want):
            cues.append({"fx": "transition", "t": round(max(0, w["s"] - 0.05), 3), "dur": 0.6, "props": {"kind": "zoom-punch", "amount": 0.2}})
    cues.sort(key=lambda c: c["t"])
    spec = Path(str(out) + ".zoom.json"); spec.write_text(json.dumps(cues, ensure_ascii=False, indent=1))
    print(f"{len(cues)} zooms ({sum(c['props']['kind'] == 'zoom-punch' for c in cues)} word punches) -> {spec}")
    if a.dry_run:
        return
    fx = Path(__file__).resolve().parents[2] / "awk-effects" / "scripts" / "effects.py"
    subprocess.run([sys.executable, str(fx), str(src), "--spec", str(spec), "-o", str(out)], check=True)


if __name__ == "__main__":
    main()
