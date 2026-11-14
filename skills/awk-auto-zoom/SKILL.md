---
name: awk-auto-zoom
description: Automatic punch-in zooms for talking videos - a steady 12% zoom on every other segment between cuts (hides jump cuts) plus a quick punch on chosen words. Use for "auto zoom", "zoom in on cuts", "punch in", "jump cut hide karo", "important word pe zoom".
---

# Auto-zoom (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-auto-zoom/scripts/autozoom.py VIDEO.mp4 -o VIDEO_zoom.mp4 --edl RAW_cut.mp4.edl.json --words "free,link,₹"
```
- `--edl` from awk-auto-cut gives the exact cut points; without it, pauses (and word gaps when music hides the pauses) are used, kept to 1.2–4 s segments.
- `--words`: comma list; English words also match whisper's Devanagari spelling (link ↔ लिंक, form ↔ फॉर्म, free ↔ फ्री…).
- `--amount 0.12` steady zoom; punches are 20 %. `--dry-run` writes the cue list only (`OUT.zoom.json`), which you can merge into an awk-effects spec.
- Zooms centre on the face (Apple Vision track).
- Run **before** captions (zoom would enlarge burned-in captions).
