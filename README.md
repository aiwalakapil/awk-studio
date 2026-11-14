# AI Wala Kapil Studio — Claude Code skills for video creators

Free skill pack from the **AI Creator Masterclass** (AI Wala Kapil). Edit videos by talking to Claude: no editing app, no timeline.

## Tier 1 skills
| Skill | Kya karti hai |
|---|---|
| `awk-auto-cut` | Silence, filler aur galat takes khud kaat deti hai |
| `awk-captions` | Word-by-word highlight captions (Hindi / Hinglish / English) |
| `awk-sfx` | Cuts pe whoosh, text pe pop, riser, hit, ding |
| `awk-audio-master` | Voice saaf + music ducking + −14 LUFS |
| `awk-step-clip` | Lambi class → har step ki alag clip |
| `awk-course-look` | Intro, title, chapter cards, STEP badge, win burst, end card |
| `awk-eleven-script` | ElevenLabs v4 ke liye script + check |

Typical reel: `auto-cut → captions → sfx → audio-master`.

## Install (Mac)
```bash
brew install ffmpeg whisper-cpp node
git clone <this repo> awk-studio && cd awk-studio && ./install.sh
```
Whisper model: `~/whisper-models/ggml-large-v3-turbo.bin` (or set `AWK_WHISPER_MODEL`).
Put your own photo as `studio/public/brand/Kapil_Avatar_Round_512.png` and `Kapil_Cutout_Transparent.png` (or edit `studio/src/look.tsx`).

## Needs
Claude Code (paid Claude plan) · ffmpeg · whisper.cpp · Node 18+. Remotion is free for individuals and small teams (up to 3 people); bigger companies need a Remotion company license.

## Licences
Code: MIT. SFX in `sfx/` are generated from math by `sfx/make_sfx.py`, free to use. No Envato or other licensed media is included — bring your own.
