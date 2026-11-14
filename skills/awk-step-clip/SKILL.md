---
name: awk-step-clip
description: Split a long lecture/class recording into short Step Clips (one per step) with a chapter card, "STEP n/N" badge and a "done" card, named L09_S03_slug.mp4. Use for "step clips banao", "lecture ko steps mein todo", "har step ki alag video", "chapters to clips".
---

# Step clips (AI Wala Kapil Studio)

Course rule: every task in a lecture also exists as its own 1–4 min clip.

## Run
```bash
# 1. find steps (listens for "Step 2…" / "स्टेप दो…")
python3 ~/.claude/skills/awk-step-clip/scripts/stepclip.py LECTURE.mp4 --lecture 9 --plan-only
#    -> LECTURE.steps.json  [{"step":1,"start":63.2,"end":241.0,"title":"…","done":"Ye ban gaya"}]
# 2. fix titles (max ~4 words) and "done" lines, then render
python3 ~/.claude/skills/awk-step-clip/scripts/stepclip.py LECTURE.mp4 --lecture 9 --steps LECTURE.steps.json
```
`--only 3` renders one clip · `-d OUTDIR` (default `L09_steps/` next to the video).

## Workflow for Claude
- Recording rule: pause 1 sec and say "Step N" at every new step; then detection just works. If nothing is detected, build the steps file from the lecture's chapter list / transcript.
- Write short titles ("Auto captions", "Cover in Canva") and a real result in `done` ("Captions ready", "Reel posted").
- Run **awk-auto-cut** on the lecture first if it has long silences, then cut steps from the cut file.
- Upload clips to an unlisted "Step Clips" playlist; link them in the lecture description.
