---
name: awk-whiteboard
description: Make a whiteboard explainer video from a JSON board - words hand-written left to right (Latin and Devanagari), doodles drawn with a marker hand (circle, box, underline, arrow, tick, bulb, money bag, coin, star, house, up/down, any SVG path), camera pans between pages, marker sound, timed to a voiceover by seconds or spoken words. Use for "whiteboard video", "whiteboard animation", "explainer on a board", "finance whiteboard", "rule of 72 style".
---

# Whiteboard (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-whiteboard/scripts/whiteboard.py board.json --still 11.2   # check one moment
python3 ~/.claude/skills/awk-whiteboard/scripts/whiteboard.py board.json -o rule72.mp4
```
Board format, shapes and colours: see the header of `scripts/whiteboard.py`. Each page is 1920×1080 (page 2 starts at x = 1920); `"pages_at": [12.4]` pans to page 2 at 12.4 s. `"vertical": true` makes 1080×1920 pages.

## Workflow for Claude
1. Write the voice script (ElevenLabs: use **awk-eleven-script**), generate the voice, put its path in `"voice"`.
2. Plan the board like a teacher: title top-left, one idea at a time, big numbers, a circle or underline on the answer, an arrow to the next idea. Max ~10 items per page.
3. Time items with `"at": "@word"` so the pen moves exactly when the word is spoken; give long sentences an `"until"`.
4. Render stills at 3–4 moments, look at them (overlaps? text off the board?), then render.
5. Add a footnote for money claims ("approx · guaranteed nahi"). Then **awk-captions** (optional) and **awk-audio-master**.
