---
name: awk-carousel
description: Make an Instagram carousel (1080x1350 slides as PNG) and an animated video version from one JSON - hook, numbered points, lists, reel-vs-carousel compare, quote and save/share CTA slides in the AI Wala Kapil look. Use for "carousel banao", "Instagram carousel", "slides for a post", "7 slide post", "swipe post".
---

# Carousel maker (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-carousel/scripts/carousel.py day9.json            # slide_01.png … slide_07.png
python3 ~/.claude/skills/awk-carousel/scripts/carousel.py day9.json --video    # + carousel_video.mp4 (swipe animation)
python3 ~/.claude/skills/awk-carousel/scripts/carousel.py day9.json --only 3   # re-render one slide
```

`"plain": true` hides the 1/7 counter and Swipe/Save (single post or story card).

Slide types: `hook` (chip, title, sub, image) · `point` (n, icon, title, body, image) · `list` (title, items) · `compare` (title, left/right {head, items}) · `quote` (text, by) · `cta` (title, sub, actions). Full example in the script header.

## The 7-slide formula (Day 9)
1. **Hook**: a question or bold claim, max 8 words, about the viewer's pain or dream (not the tool).
2. **Pain**: the problem in their words.
3–5. **One point per slide**: big text, few words, a number.
6. **Proof / compare / quote**.
7. **CTA**: save + share line ("kisi creator dost ko bhejo jo…").

## Workflow for Claude
- Write the JSON from the topic (Hinglish, short lines), render, then **look at every PNG** and fix overflow (shorten text rather than shrink fonts).
- Colours, name and handle come from `studio/src/brand.json`.
- Phone users: the same structure works in Canva (1080×1350); give them the slide texts.
