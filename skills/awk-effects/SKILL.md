---
name: awk-effects
description: Add scroll-stopping effects to a talking video in one render - text behind the head, glass widgets, spotlight with glitter, ticking checklist, words orbiting the head, ₹ money counter, iPhone notification/toggle, breaking-news cut, freeze-frame name callout, animated bar chart and transitions (zoom punch, zoom-through, whip, shake, glitch, flash, light leak). Use for "effects lagao", "text behind head", "glass widgets", "spotlight", "checklist animation", "news style", "freeze frame intro", "transition", "/effects".
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
 {"fx": "orbit-text",    "t": 2.6, "dur": 2.8, "props": {"text": "FORM · LINK · BIO · FREE"}},
 {"fx": "transition",    "t": "@फटाफट", "dur": 0.4, "props": {"kind": "zoom-punch"}},
 {"fx": "checklist",     "t": 5.4, "dur": 3.0, "props": {"title": "Kya karna hai", "items": ["Bio link kholo", "Form fill karo", "Submit"], "every": 0.6}},
 {"fx": "iphone-ui",     "t": "@DM", "dur": 2.2, "props": {"app": "Instagram", "title": "aiwalakapil", "body": "New message", "icon": "📩"}},
 {"fx": "spotlight",     "t": 10.8, "dur": 2.0, "props": {"label": "Description mein link", "glitter": true}},
 {"fx": "glass-widgets", "t": 13.0, "dur": 3.0, "props": {"items": [{"icon": "🔥", "title": "Views", "value": "4.2L"}]}},
 {"fx": "money-counter", "t": 16.2, "dur": 2.4, "props": {"to": 50000, "label": "Course ki value"}},
 {"fx": "chart",         "t": 18.8, "dur": 2.6, "props": {"title": "Registrations", "bars": [{"label": "Day 1", "value": 58}, {"label": "Day 2", "value": 111}]}},
 {"fx": "news-cut",      "t": 21.5, "dur": 2.0, "props": {"headline": "FREE AI class shuru!"}},
 {"fx": "freeze-callout","t": 24.0, "dur": 1.6, "props": {"name": "KAPIL", "sub": "AI Wala Kapil"}}
]
```

## How it works
- `tools/awkvision` (Apple Vision, on-device) makes a person matte + face track once per video (cached as `VIDEO.matte.mp4`, `VIDEO.faces.json`; first build compiles the Swift tool, ~1 min per 25 s of 60 fps 4K-sourced video, `--fast-matte` for quicker).
- Remotion renders a transparent **behind** layer (under the person) and **front** layer; ffmpeg stacks: video → behind → person cut-out → front.
- Spotlight, orbit, glass widgets and freeze-callout follow the face automatically.

## Workflow for Claude
1. Transcribe or read the script, pick 4–8 moments (hook in the first 2 s, numbers, lists, CTA). Don't stack effects back to back; 1–3 s each, a breather between.
2. Always `--preview T` a few key moments and look at them before the full render.
3. Order in a reel: **auto-cut → auto-zoom → effects → captions → sfx → audio-master** (zooms and transitions redraw the video, so captions go after).
4. Text behind head needs the head **below** the title area: works best with head-and-shoulders framing and space above the head.
5. Glass cards are tinted (not blurred) so they read on any footage.
