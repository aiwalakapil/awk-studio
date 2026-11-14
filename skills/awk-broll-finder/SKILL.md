---
name: awk-broll-finder
description: Plan and fetch B-roll / stock footage for a script or video - one visual idea per line, search links for Pexels, Pixabay and Envato, optional automatic download of free Pexels portrait clips with a licence log. Use for "b-roll dhoondo", "stock footage", "stock clips for my script", "visuals for this video", "broll".
---

# B-roll finder (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-broll-finder/scripts/broll.py --video VIDEO.mp4 -o broll_plan.json     # or --script script.txt
# Claude: fill "keywords" for each line (2-3 short English visual searches)
python3 ~/.claude/skills/awk-broll-finder/scripts/broll.py --plan broll_plan.json --download -d broll --per 2
```

## Workflow for Claude
1. Read each line and write **visual** searches, not the words said: "रील पे views नहीं आ रहे" → `phone scrolling reels`, `sad person phone night`. Skip lines where the speaker's face matters (hook, CTA).
2. Prefer portrait (9:16) clips; 3–5 s each; one B-roll every 6–10 s keeps retention without losing the face.
3. Download needs a free Pexels API key in `PEXELS_API_KEY` (the user creates it at pexels.com/api; never ask them to paste it in chat — they export it in their own terminal). Without it, give the user the printed links.
4. Every downloaded clip is logged in `broll/LICENSES.md`. Envato clips: the user downloads them in the Envato app ("Claim Clear"/licensed) and adds a row by hand.
5. Place clips with awk-effects or your editor; never use clips from YouTube/Instagram/Google Images.
