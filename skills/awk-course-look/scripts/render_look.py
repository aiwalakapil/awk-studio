#!/usr/bin/env python3
"""Course Look pack for one lecture: every card, sting and overlay, ready for OBS or the edit.

Usage:
  render_look.py lecture.json [-d OUTDIR] [--only TitleCard,EndCard] [--stills-only]

lecture.json:
  {"lecture": 4, "title": "Editing + Cover", "result": "Pehli reel POST 🎉", "part": "BOOTCAMP",
   "next": "Growth System", "steps": ["Cuts", "Auto captions", "Text hook", "Music + SFX", "Cover", "POST"],
   "win": {"text": "PROUD MOMENT!", "sub": "Pehli reel live ✅"},
   "name": "…", "role": "…"}          # optional; default comes from studio/src/brand.json

Output (OUTDIR, default ./L04_look/):
  video  (mp4):  00_IntroSting, 01_TitleCard, Chapter_S01…, PhoneToLaptop, 99_EndCard
  alpha  (mov, ProRes 4444, drop on top of any clip): StepBadge_S01…, WinBurst, LowerThird
  stills (png):  TitleCard, EndCard, StepBadge_S01… (for OBS image sources)
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

ALPHA = ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png"]


def still(comp, out, props, frame):
    import subprocess
    pf = awk.STUDIO / "out" / f".props_still_{comp}.json"; pf.parent.mkdir(parents=True, exist_ok=True)
    pf.write_text(json.dumps(props, ensure_ascii=False))
    r = subprocess.run(["npx", "remotion", "still", "src/index.ts", comp, str(out), f"--props={pf}", f"--frame={frame}", "--log=error"], cwd=awk.STUDIO)
    if r.returncode:
        raise SystemExit(f"still failed: {comp}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lecture_json"); ap.add_argument("-d", "--outdir")
    ap.add_argument("--only", help="comma list of pieces to render")
    ap.add_argument("--stills-only", action="store_true")
    a = ap.parse_args()
    L = json.loads(Path(a.lecture_json).read_text())
    n = L["lecture"]; steps = L.get("steps", []); total = len(steps)
    out = Path(a.outdir).resolve() if a.outdir else Path.cwd() / f"L{n:02d}_look"
    out.mkdir(parents=True, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None
    want = lambda k: only is None or k in only

    title = {"lecture": n, "title": L["title"], "result": L.get("result", ""), "part": L.get("part", "")}
    end = {"next": L.get("next", "")}

    # stills for OBS
    if want("TitleCard"): still("TitleCard", out / "TitleCard.png", title, 120)
    if want("EndCard"): still("EndCard", out / "EndCard.png", end, 120)
    for i, s in enumerate(steps, 1):
        if want("StepBadge"):
            still("StepBadge", out / f"StepBadge_S{i:02d}.png", {"step": i, "total": total, "title": s}, 45)
    if a.stills_only:
        print("stills in", out); return

    jobs = []
    if want("IntroSting"): jobs.append(("IntroSting", out / "00_IntroSting.mp4", {}, []))
    if want("TitleCard"): jobs.append(("TitleCard", out / "01_TitleCard.mp4", title, []))
    for i, s in enumerate(steps, 1):
        p = {"step": i, "total": total, "title": s}
        if want("ChapterCard"): jobs.append(("ChapterCard", out / f"Chapter_S{i:02d}.mp4", p, []))
        if want("StepBadge"): jobs.append(("StepBadge", out / f"StepBadge_S{i:02d}.mov", p, ALPHA))
    if want("PhoneToLaptop"): jobs.append(("PhoneToLaptop", out / "PhoneToLaptop.mp4", {}, []))
    if want("WinBurst"): jobs.append(("WinBurst", out / "WinBurst.mov", L.get("win", {}), ALPHA))
    if want("LowerThird"):
        brand = json.loads((awk.STUDIO / "src" / "brand.json").read_text())
        jobs.append(("LowerThird", out / "LowerThird.mov", {"name": L.get("name", brand["name"]), "role": L.get("role", brand["role"])}, ALPHA))
    if want("EndCard"): jobs.append(("EndCard", out / "99_EndCard.mp4", end, []))

    for comp, path, props, extra in jobs:
        awk.remotion_render(comp, path, props, extra or ["--crf=16"])
        print("  ✓", path.name)
    print(f"{len(jobs)} pieces in {out}")


if __name__ == "__main__":
    main()
