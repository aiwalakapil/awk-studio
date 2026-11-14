#!/usr/bin/env python3
"""Carousel maker: Instagram carousel slides (1080x1350 PNG) + an animated video carousel from one JSON.

Usage:
  carousel.py carousel.json [-d OUTDIR] [--video] [--only 3]

carousel.json:
{"series": "DAY 9 · AI SE CAROUSEL", "handle": "@aiwalakapil",
 "slides": [
  {"type": "hook",    "chip": "DAY 9", "title": "Reels pe views nahi aa rahe?", "sub": "Carousel try karo", "image": "photo.png"},
  {"type": "point",   "n": 1, "icon": "🎯", "title": "Pehli slide = hook", "body": "Sawaal ya bold claim, max 8 shabd"},
  {"type": "list",    "title": "7 slides ka formula", "items": ["Hook", "Problem", "3 points", "Example", "CTA"]},
  {"type": "compare", "title": "Reel vs Carousel", "left": {"head": "Sirf reel", "items": ["..."]}, "right": {"head": "Reel + carousel", "items": ["..."]}},
  {"type": "quote",   "text": "Reel dikhati hai, carousel yaad rakhwata hai", "by": "AI Wala Kapil"},
  {"type": "cta",     "title": "Save karo 🔖", "sub": "Kal ke post ke liye", "actions": ["🔖 Save", "↗ Share", "➕ Follow"]}
 ]}
Slide types: hook, point, list, compare, quote, cta. Local image paths are copied in automatically.
"""
import argparse, json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

SLIDE_F = 90


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec"); ap.add_argument("-d", "--outdir"); ap.add_argument("--video", action="store_true")
    ap.add_argument("--only", type=int, help="render only this slide number (1-based)")
    a = ap.parse_args()
    spec_path = Path(a.spec).resolve()
    spec = json.loads(spec_path.read_text())
    for s in spec["slides"]:
        if s.get("image"):
            ip = Path(s["image"]).expanduser()
            ip = ip if ip.is_absolute() else spec_path.parent / ip
            s["image"] = awk.stage(ip.resolve())
    out = Path(a.outdir).resolve() if a.outdir else spec_path.parent / f"{spec_path.stem}_slides"
    out.mkdir(parents=True, exist_ok=True)
    pf = awk.STUDIO / "out" / ".props_carousel.json"; pf.parent.mkdir(parents=True, exist_ok=True)
    pf.write_text(json.dumps(spec, ensure_ascii=False))
    n = len(spec["slides"])
    for i in range(n):
        if a.only and i + 1 != a.only:
            continue
        png = out / f"slide_{i + 1:02d}.png"
        subprocess.run(["npx", "remotion", "still", "src/index.ts", "Carousel", str(png), f"--props={pf}",
                        f"--frame={i * SLIDE_F + 60}", "--log=error"], cwd=awk.STUDIO, check=True)
        print("  ✓", png.name)
    if a.video:
        mp4 = out / "carousel_video.mp4"
        awk.remotion_render("Carousel", mp4, spec, ["--crf=18"])
        print("  ✓", mp4.name)
    print(f"{n} slides in {out}")


if __name__ == "__main__":
    main()
