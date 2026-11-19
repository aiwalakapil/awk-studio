# AI Wala Kapil Studio

**Claude Code skills for video creators.** Edit videos by talking to Claude: no editing app, no timeline.

Free skill pack from the **AI Creator Masterclass** by AI Wala Kapil ([Instagram](https://www.instagram.com/aiwalakapil) · [YouTube](https://www.youtube.com/@aiwalakapil)). Works with Hindi, Hinglish and English.

[![Download ZIP](https://img.shields.io/badge/Download-ZIP-00E58F?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aiwalakapil/awk-studio/archive/refs/heads/main.zip)

**[⬇️ Download ZIP](https://github.com/aiwalakapil/awk-studio/archive/refs/heads/main.zip)** (no Git needed) · or `git clone` below.

## Skills (Tier 1)
| Skill | What it does |
|---|---|
| `awk-auto-cut` | Removes silences, filler sounds and repeated (bad) takes from a raw recording |
| `awk-captions` | Word-by-word highlight captions in Devanagari Hindi, Roman Hinglish or English |
| `awk-sfx` | Adds whooshes on cuts, pops on text, risers, hits and dings, mixed under the voice |
| `awk-audio-master` | Cleans the voice, ducks a music bed under speech, masters to −14 LUFS |
| `awk-step-clip` | Splits a long lecture into one short clip per step, with chapter card and step badge |
| `awk-course-look` | Renders intro sting, title card, chapter cards, step badges, win burst, lower third and end card |
| `awk-eleven-script` | Converts a script to ElevenLabs Eleven v4 format and checks it before you spend credits |

## Skills (Tier 2)
| Skill | What it does |
|---|---|
| `awk-effects` | 15 effects: text behind the head, glass widgets, spotlight, checklist, orbiting words or photos, clones, ₹ counter, iPhone notification, news cut, freeze-frame callout, bar chart, editing timeline, 3D photo, map fly-to, stock ticker, built-in world map, plus 8 transitions — timed by seconds or by a spoken word |
| `awk-auto-zoom` | Punch-in zooms on cuts and on chosen words, centred on the face |
| `awk-reframe` | 16:9 → 9:16 / 1:1 / 4:5 that follows the speaker's face |
| `awk-multi-export` | Instagram, YouTube Shorts (different endings), WhatsApp and 16:9 versions from one edit |
| `awk-broll-finder` | Stock-footage plan per line with Pexels / Pixabay / Envato links; downloads free Pexels clips and logs licences |

## Skills (Tier 3)
| Skill | What it does |
|---|---|
| `awk-carousel` | Instagram carousel (1080×1350 PNG slides) + animated video carousel from one JSON |
| `awk-finance-edit` | Recipe: raw finance talking head → reel with ₹ counters, charts, ticker, bank notifications, checklist |
| `awk-intro-3d` | 6-second 3D intros: flying metal letters + ring, or a spinning gold ₹ coin (16:9 / 9:16, with SFX) |
| `awk-whiteboard` | Whiteboard explainer from JSON: hand-written words, doodles, marker hand, page pans, voice-timed |
| `awk-cartoon-episode` | Kids cartoon episode from your Remotion cartoon template (scaffold + full production brief) |
| `awk-documentary` | Narrated documentary kit: fact-check log, script, shot list, licences, publishing, shorts plan |

A typical reel: `auto-cut → auto-zoom → effects → captions → sfx → audio-master → multi-export`.
Face tracking and the person matte use Apple Vision on your Mac (no upload, no API key).

## Example
Tell Claude Code:
> Clean up raw.mov, add Hindi captions and sound effects, put bed.mp3 under it and make it ready for Instagram.

Claude runs the skills in order and shows you what it removed before rendering.

## Install (macOS)
**Option A: Git**
```bash
brew install ffmpeg whisper-cpp node
git clone https://github.com/aiwalakapil/awk-studio.git
cd awk-studio && ./install.sh
```

**Option B: Download ZIP (no Git)**
1. Click **[Download ZIP](https://github.com/aiwalakapil/awk-studio/archive/refs/heads/main.zip)** (or the green **Code** button → **Download ZIP**).
2. Unzip it and move the `awk-studio-main` folder somewhere permanent, e.g. your home folder. The skills are linked from this folder, so don't delete it later.
3. In Terminal:
```bash
brew install ffmpeg whisper-cpp node
cd ~/awk-studio-main && bash install.sh
```
To update later, download the ZIP again, replace the folder and run `bash install.sh` again.
- **Whisper model:** download `ggml-large-v3-turbo.bin` from [huggingface.co/ggerganov/whisper.cpp](https://huggingface.co/ggerganov/whisper.cpp) into `~/whisper-models/`, or point `AWK_WHISPER_MODEL` at it.
- Restart Claude Code; the skills show up as `/awk-auto-cut`, `/awk-captions` and so on.

## Make it yours
Edit `studio/src/brand.json`:
```json
{
  "name": "Your Name",
  "role": "Your Channel · @yourhandle",
  "title": ["YOUR", "CHANNEL"],
  "tagline": "YOUR TAGLINE",
  "avatar": "brand/avatar.png",
  "cutout": "brand/cutout.png",
  "colors": {"accent": "#00E58F", "accent2": "#FFD84D", "ink": "#06110D"}
}
```
Add your photos as `studio/public/brand/avatar.png` (round, 512×512) and `studio/public/brand/cutout.png` (transparent PNG). No photos? The cards show your initial in a ring instead. Preview everything with `cd studio && npm run studio`.

## Requirements
- [Claude Code](https://claude.com/claude-code) (needs a paid Claude plan)
- macOS (Apple Vision for face tracking / matte; Xcode command line tools to build it)
- ffmpeg, whisper.cpp, Node 18+, Python 3.9+
- [Remotion](https://www.remotion.dev) is free for individuals and teams of up to 3 people; larger companies need a Remotion company license.

## Project layout
```
skills/   one folder per skill (SKILL.md + scripts)
lib/      shared Python helpers (whisper, ffmpeg, Remotion render)
studio/   Remotion project: brand, course look, captions, step clips
sfx/      sound effects generated from code (make_sfx.py)
```

## Licences
- Code: MIT.
- Sound effects in `sfx/` are generated by `sfx/make_sfx.py` and free to use.
- No Envato or other licensed media is included. Bring your own music and stock footage, and keep their licences.

## Also by our team
- **[GrowDM](https://www.growdm.ai)**: Instagram DM automation for creators (comment-to-DM, AI replies, link-in-bio), built by our team.
