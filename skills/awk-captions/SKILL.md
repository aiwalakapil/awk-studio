---
name: awk-captions
description: Burn word-by-word highlight captions (Devanagari Hindi, Roman Hinglish or English) into a video with the AI Wala Kapil look, using whisper timings and Remotion. Use for "captions lagao", "subtitles", "auto captions", "word highlight captions", "Hindi captions".
---

# Captions (AI Wala Kapil Studio)

Big bold words, the spoken word lights up green, 2–4 words on screen.

## Run
```bash
# 1. make the editable captions JSON (look at it, fix spellings)
python3 ~/.claude/skills/awk-captions/scripts/captions.py VIDEO.mp4 -o VIDEO_cap.mp4 --json-only
# 2. render (re-uses the JSON you edited)
python3 ~/.claude/skills/awk-captions/scripts/captions.py VIDEO.mp4 -o VIDEO_cap.mp4 --from-json VIDEO_cap.mp4.captions.json
```
One-shot: drop `--json-only` / `--from-json`.

Options: `--lang hi|en` · `--words 3` (max on screen) · `--position center|bottom` (default: center for vertical, bottom for 16:9) · `--size PX` · `--script script.txt`.

## Spelling: `--script`
Whisper writes Hindi in Devanagari and sometimes misspells (e.g. "पेरों" for "पैरों"). If the user has the script, pass it with `--script`: its words (in any spelling — Devanagari, Roman Hinglish, English) are laid on whisper's timings. For Roman Hinglish captions this is the way: write/convert the script in Roman, then pass it.

## Workflow for Claude
- Run `--json-only` first, read the chunks, fix obvious mistakes in the JSON (brand words: Claude, Remotion, ElevenLabs, AI Wala Kapil), then render.
- Keep important visuals clear: vertical captions sit just below centre (chest height), 16:9 sits in the lower band.
- Rendering is Remotion (`awk-studio/studio`, composition `Captions`). Look at a few frames (`ffmpeg -ss T -i out.mp4 -frames:v 1 f.png`) before handing over.
