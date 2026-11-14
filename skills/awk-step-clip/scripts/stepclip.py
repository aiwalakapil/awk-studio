#!/usr/bin/env python3
"""Step clips: cuts a full lecture recording into one short clip per step.

Usage:
  stepclip.py LECTURE.mp4 --lecture 9 [--lang hi] [--plan-only]
  stepclip.py LECTURE.mp4 --lecture 9 --steps steps.json [--only 3] [-d OUTDIR]

1. Without --steps it listens for "Step 2…" / "स्टेप दो…" in the recording (the recording
   rule: pause 1 sec and say "Step N" at every new step) and writes LECTURE.steps.json:
   [{"step": 1, "start": 63.2, "end": 241.0, "title": "…", "done": "Ye ban gaya"}]
   Edit titles / times there, then run again with --steps.
2. Each clip = 1.5 s chapter card + the step + "STEP n/N" badge + a "✅ done" card at the end.
   Named L09_S03_<slug>.mp4.
"""
import argparse, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

NUM = {"1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "11": 11, "12": 12,
       "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
       "eleven": 11, "twelve": 12, "वन": 1, "टू": 2, "थ्री": 3, "फोर": 4, "फाइव": 5, "सिक्स": 6, "सेवन": 7, "एट": 8,
       "नाइन": 9, "टेन": 10, "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "छः": 6, "सात": 7,
       "आठ": 8, "नौ": 9, "दस": 10, "ग्यारह": 11, "बारह": 12, "ek": 1, "do": 2, "teen": 3, "char": 4, "paanch": 5}
STEP = {"step", "स्टेप", "स्टैप"}
NUM_N = {awk.norm(k): v for k, v in NUM.items()}
STEP_N = {awk.norm(k) for k in STEP}


def slug(t):
    t = re.sub(r"[^\w\s-]", "", t.lower()).strip()
    return re.sub(r"\s+", "-", t)[:40] or "step"


def detect(words, total):
    marks = []
    for i, w in enumerate(words[:-1]):
        if awk.norm(w["w"]) in STEP_N:
            n = NUM_N.get(awk.norm(words[i + 1]["w"]))
            if n and (not marks or n != marks[-1]["step"]):
                t_num = words[i + 1]["e"]
                title = " ".join(x["w"] for x in words[i + 2:i + 7] if x["s"] - t_num < 2.0).strip(" ,।—")
                marks.append({"step": n, "start": round(max(0, w["s"] - 0.4), 2), "title": title[:40]})
    for k, m in enumerate(marks):
        m["end"] = marks[k + 1]["start"] if k + 1 < len(marks) else round(total, 2)
        m["done"] = "Ye ban gaya"
    return marks


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("--lecture", type=int, required=True)
    ap.add_argument("--steps"); ap.add_argument("--lang", default="hi")
    ap.add_argument("--plan-only", action="store_true"); ap.add_argument("--only", type=int)
    ap.add_argument("-d", "--outdir")
    a = ap.parse_args()

    src = Path(a.video).resolve()
    total = awk.duration(src)
    if a.steps:
        steps = json.loads(Path(a.steps).read_text())
    else:
        steps = detect(awk.transcribe(src, a.lang), total)
        plan = src.with_suffix(".steps.json")
        plan.write_text(json.dumps(steps, ensure_ascii=False, indent=1))
        print(f"found {len(steps)} steps -> {plan}")
        for s in steps:
            print(f"  STEP {s['step']:2d}  {s['start']:7.1f}-{s['end']:7.1f}  {s['title']}")
        if not steps:
            print("  no 'Step N' markers heard. Write the steps file by hand (same format) and pass --steps.")
        if a.plan_only or not steps:
            return

    outdir = Path(a.outdir).resolve() if a.outdir else src.parent / f"L{a.lecture:02d}_steps"
    outdir.mkdir(parents=True, exist_ok=True)
    staged = awk.stage(src)
    n = len(steps)
    for s in steps:
        if a.only and s["step"] != a.only:
            continue
        name = outdir / f"L{a.lecture:02d}_S{s['step']:02d}_{slug(s['title'])}.mp4"
        props = {"src": staged, "start": s["start"], "end": s["end"], "step": s["step"], "total": n,
                 "title": s["title"], "done": s.get("done", "Ye ban gaya")}
        awk.remotion_render("StepClip", name, props, ["--crf=20"])
        print(f"  ✓ {name.name}  ({s['end'] - s['start']:.0f}s)")
    print("clips in", outdir)


if __name__ == "__main__":
    main()
