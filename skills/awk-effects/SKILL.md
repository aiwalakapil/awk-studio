---
name: awk-effects
description: Add scroll-stopping effects to a talking video in one render - stock B-roll cards, speaker tags, text behind the head, glass widgets, spotlight with glitter, ticking checklist, words or photos orbiting the head, clones of the person, ₹ money counter, iPhone notification/toggle, breaking-news cut, freeze-frame name callout, animated bar chart, editing-timeline overlay, 2.5D photo parallax, map fly-to with pin, and transitions (zoom punch, zoom-through, whip, shake, glitch, flash, light leak). Use for "effects lagao", "text behind head", "glass widgets", "spotlight", "checklist animation", "news style", "freeze frame intro", "transition", "/effects".
---

# Effects (AI Wala Kapil Studio)

One clip → many effects, one command. Timing by seconds **or by a spoken word** (`"@views"`, `"@कमाई+0.2"`; English words also match whisper's Devanagari spelling, e.g. link ↔ लिंक).

## Run
```bash
python3 ~/.claude/skills/awk-effects/scripts/effects.py --list                      # all effects + their props
python3 ~/.claude/skills/awk-effects/scripts/effects.py VIDEO.mp4 --spec fx.json --preview 3.2   # one still, fast
python3 ~/.claude/skills/awk-effects/scripts/effects.py VIDEO.mp4 --spec fx.json -o VIDEO_fx.mp4
```
`fx.json`:
```json
[
 {"fx": "title-behind",  "t": 0.0, "dur": 2.6, "props": {"text": "FREE|CLASS"}},
 {"fx": "orbit-text",    "t": 2.6, "dur": 4.0, "props": {"images": ["~/Pictures/a.png", "~/Pictures/b.png", "~/Pictures/c.png"], "size": 0.25}},
 {"fx": "clone",         "t": 6.9, "dur": 1.6, "props": {"count": 2, "lag": 0.4}},
 {"fx": "edit-timeline", "t": 8.6, "dur": 3.0, "props": {"title": "🎬 Aise video banti hai", "y": 0.6}},
 {"fx": "photo-3d",      "t": 12.0, "dur": 3.0, "props": {"photo": "~/Pictures/creator.png", "label": "Aap bhi creator ✨"}},
 {"fx": "map-flyto",     "t": 15.0, "dur": 3.0, "props": {"image": "~/maps/india.png", "x": 0.27, "y": 0.6, "label": "Mumbai"}},
 {"fx": "transition",    "t": "@फटाफट", "dur": 0.4, "props": {"kind": "zoom-punch"}},
 {"fx": "checklist",     "t": 5.4, "dur": 3.0, "props": {"title": "Kya karna hai", "items": ["Bio link kholo", "Form fill karo", "Submit"], "every": 0.6}},
 {"fx": "iphone-ui",     "t": "@DM", "dur": 2.2, "props": {"app": "Instagram", "title": "aiwalakapil", "body": "New message", "icon": "📩"}},
 {"fx": "spotlight",     "t": 10.8, "dur": 2.0, "props": {"label": "Description mein link", "glitter": true}},
 {"fx": "glass-widgets", "t": 13.0, "dur": 3.0, "props": {"items": [{"icon": "🔥", "title": "Views", "value": "4.2L"}]}},
 {"fx": "money-counter", "t": 16.2, "dur": 2.4, "props": {"to": 50000, "label": "Course ki value"}},
 {"fx": "chart",         "t": 18.8, "dur": 2.6, "props": {"title": "Registrations", "bars": [{"label": "Day 1", "value": 58}, {"label": "Day 2", "value": 111}]}},
 {"fx": "broll",         "t": 19.0, "dur": 2.5, "props": {"video": "~/Envato/lockers.mov", "mode": "card", "label": "Locker rent: ₹3,000/saal"}},
 {"fx": "tag",           "t": 0.0, "dur": 4.0, "props": {"text": "👤 CUSTOMER"}},
 {"fx": "news-cut",      "t": 21.5, "dur": 2.0, "props": {"headline": "FREE AI class shuru!"}},
 {"fx": "freeze-callout","t": 24.0, "dur": 1.6, "props": {"name": "KAPIL", "sub": "AI Wala Kapil"}}
]
```

## How it works
- `tools/awkvision` (Apple Vision, on-device) makes a person matte + face track once per video (cached as `VIDEO.matte.mp4`, `VIDEO.faces.json`; first build compiles the Swift tool, ~1 min per 25 s of 60 fps 4K-sourced video, `--fast-matte` for quicker).
- Remotion renders a transparent **behind** layer (under the person) and **front** layer; ffmpeg stacks: video → behind → person cut-out → front.
- Spotlight, orbit, glass widgets, title-behind and freeze-callout follow the face automatically.
- `clone` is composited by ffmpeg with the matte: copies of the person, shifted in time, sit beside them (not shown in `--preview`).
- `photo-3d` cuts the subject out of any photo (Apple Vision) and moves it against the background for depth.
- `map-flyto` takes any map image (x/y are fractions of the image); use a high-resolution map, small images look soft when zoomed.
- `broll` drops a stock clip (Envato/Pexels) in as a **card** above the speaker (speaker stays visible) or **full** screen; `tag` is a small pill for "who is speaking" in skits.
- Zooms/transitions that redraw the video are skipped automatically while a behind-the-person effect is on screen (they would hide it); the script prints what it skipped.
- Local paths in props (`images`, `image`, `photo`, `video`) are copied into the studio automatically.

## Workflow for Claude
1. Transcribe or read the script, pick 4–8 moments (hook in the first 2 s, numbers, lists, CTA). Don't stack effects back to back; 1–3 s each, a breather between.
2. Always `--preview T` a few key moments and look at them before the full render.
3. Order in a reel: **auto-cut → auto-zoom → effects → captions → sfx → audio-master** (zooms and transitions redraw the video, so captions go after).
4. Text behind head sizes itself to the space above the head; the hair covers the lower part of the last line (that's the look). Short words (≤ 8 letters per line) read best.
6. On a video that already has burned-in text boxes, put effects in the empty zones or use full-screen moments (news-cut, photo-3d, freeze-callout, spotlight) so nothing fights.
5. Glass cards are tinted (not blurred) so they read on any footage.
