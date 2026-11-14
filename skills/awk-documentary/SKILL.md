---
name: awk-documentary
description: Plan and produce a long-form narrated documentary episode (YouTube) - research and fact-check log, 3-act script, voice script, shot list with a new visual every ~3.5 s, licensed footage log, maps, data charts, captions, chapters, publishing package and shorts plan - using the studio's map, chart, B-roll and caption tools. Use for "documentary", "explainer documentary", "long video with narration", "Cold Case Earth style", "faceless documentary channel".
---

# Documentary (AI Wala Kapil Studio)

## Start
```bash
python3 ~/.claude/skills/awk-documentary/scripts/doc_kit.py ~/Videos/ep1 --title "The Signal" --minutes 15
```
Creates `docs/01..10` (script, voice script, shot list, footage & licences, data & credits, publishing, permissions, channel kit, fact-check log, shorts plan), plus `footage/` and `voice/`.

## Pipeline
1. **Research → 09-fact-check-log.md** first: every claim gets two sources. Nothing ships with an "open" row.
2. **Script (01)**: cold open (strangest true moment, 0:00–0:45), 3 acts (mystery → investigation → answer), ending + CTA. ~140 words/min.
3. **Voice (02)**: numbers as words, one paragraph per beat; ElevenLabs on a paid plan if the channel will be monetised. Clean + loudness with **awk-audio-master** (no music yet).
4. **Shot list (03)**: a new visual every ~3.5 s, never >6 s on one image. Visual types → tools:
   - footage → **awk-broll-finder** (Pexels) or Envato (log every file in 04)
   - maps → **awk-effects** `map-flyto` (`"image": "world"` with lat/lon pins; Natural Earth, public domain)
   - numbers → `chart`, `money-counter`; quotes/titles → `news-cut`, `freeze-callout`; photos → `photo-3d`
5. **Assemble** in Remotion or your editor, then **awk-captions** (or SRT), **awk-audio-master** with a music bed (−14 LUFS).
6. **Publish (06)**: titles, description, chapters from the real voice timings, tags, thumbnail (max 4 words), "altered or synthetic content" answered honestly for AI narration.
7. **Shorts (10)**: 3–5 moments → **awk-reframe** / captions → **awk-multi-export**.

Reference implementation (if you have it): the path under `"documentary"` in `~/.awk/templates.json`.
