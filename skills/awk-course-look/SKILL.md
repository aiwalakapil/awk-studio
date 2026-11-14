---
name: awk-course-look
description: Render the AI Creator Masterclass "Course Look" pack for a lecture - intro sting, title card, chapter cards, STEP badges, phone-to-laptop card, win burst, lower third and end card (mp4, transparent ProRes overlays and OBS PNGs). Use for "lecture ke cards banao", "title card", "intro", "OBS overlays", "course look", "end card".
---

# Course Look (AI Wala Kapil Studio)

Name, title, tagline, colours and photos come from `studio/src/brand.json`. Photos: `studio/public/brand/avatar.png` (round, 512×512) and `cutout.png` (transparent PNG); without them a ring with your initial is used. Fonts: Montserrat + Baloo 2 (Devanagari).

## Run
Write `L07.json`:
```json
{"lecture": 7, "title": "Phone Studio: Claude + Edits", "result": "Poori reel sirf phone se", "part": "PRO EDITING",
 "next": "Editing ki soch", "steps": ["Edit Plan", "Shoot", "Timeline", "Captions", "Transitions", "Effects", "Sound", "Faceless", "Export", "Insights"],
 "win": {"text": "PROUD MOMENT!", "sub": "Reel ready ✅"}}
```
```bash
python3 ~/.claude/skills/awk-course-look/scripts/render_look.py L07.json -d L07_look
python3 ~/.claude/skills/awk-course-look/scripts/render_look.py L07.json --stills-only     # only OBS PNGs
python3 ~/.claude/skills/awk-course-look/scripts/render_look.py L07.json --only TitleCard,EndCard
```

## Pieces
| File | Use |
|---|---|
| `00_IntroSting.mp4` (3 s) | Very start |
| `01_TitleCard.mp4` (5 s) / `TitleCard.png` | After the cold open / OBS Title scene |
| `Chapter_SNN.mp4` (2.5 s) | Between steps (wipe in/out) |
| `StepBadge_SNN.mov` (alpha) / `.png` | Top-left during a step / OBS image source |
| `PhoneToLaptop.mp4` (3 s) | "Phone wale yahan tak → ab laptop" |
| `WinBurst.mov` (alpha, 3 s) | Win moment (big file: ProRes 4444) |
| `LowerThird.mov` (alpha, 5 s) | Name strap |
| `99_EndCard.mp4` (6 s) / `EndCard.png` | Subscribe + next class |

Edit the look in `awk-studio/studio/src/look.tsx`; preview with `cd awk-studio/studio && npm run studio`. After any change render stills and look at them before rendering videos.
