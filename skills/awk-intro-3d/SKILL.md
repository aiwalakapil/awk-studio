---
name: awk-intro-3d
description: Render a 6-second 3D intro - metal letters flying in with a glowing ring and particles (logo), or a spinning gold coin with ₹ (or any symbol) and raining coins (coin) - with sound effects, in 16:9 or 9:16. Use for "3D intro", "logo intro", "channel intro", "coin intro", "finance intro", "series opener".
---

# 3D intro (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-intro-3d/scripts/intro3d.py --kind logo --line1 "AI WALA" --line2 "KAPIL" --sub "AI CREATOR MASTERCLASS"
python3 ~/.claude/skills/awk-intro-3d/scripts/intro3d.py --kind coin --line1 "FINANCE" --line2 "WITH HIMANSH" --symbol ₹ --vertical
python3 ~/.claude/skills/awk-intro-3d/scripts/intro3d.py --kind logo --line1 "CLAUDE" --line2 "VIDEO PRO" --color1 "#D97757" --glow "#D97757" --still 130   # preview png
```
- Real 3D (three.js via @remotion/three, ANGLE renderer): bevelled metal letters, studio reflections, light sweep, glowing ring, particles; coin version drops, spins and shrinks while coins rain.
- 3D text is **Latin letters/numbers only** (the 3D font has no Devanagari). Put Hindi in `--sub` (2D text).
- `--vertical` = 1080×1920 (camera pulls back so long words fit). Colours default to `studio/src/brand.json`.
- SFX (riser, whooshes, hit, ding) are built in; `--no-sfx` for a silent version.
- Always render a `--still 130` first and look at it: if the first line is cut at the edges, shorten it.
