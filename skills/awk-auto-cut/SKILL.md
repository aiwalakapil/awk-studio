---
name: awk-auto-cut
description: Auto-cut a talking-head or lecture video - removes silences, pauses, filler sounds and repeated (bad) takes using whisper + ffmpeg. Use when the user says "silence kaato", "cut the pauses", "raw video clean karo", "jump cuts", "auto edit my raw", or gives a raw recording to tighten.
---

# Auto-cut (AI Wala Kapil Studio)

Cuts dead air and retakes from a raw recording. Hindi, Hinglish and English.

## Run
```bash
python3 ~/.claude/skills/awk-auto-cut/scripts/autocut.py RAW.mp4 --dry-run          # see what will be removed
python3 ~/.claude/skills/awk-auto-cut/scripts/autocut.py RAW.mp4 -o RAW_cut.mp4      # render
```
Options: `--lang hi|en` · `--gap 0.3` (pauses longer than this are cut; 0.5 for a calmer lecture) · `--pad 0.08` (breath kept around speech) · `--noise -32` (use -28 in a noisy room) · `--no-retakes` · `--height 1080` (downscale 4K) · `--crf 18`.

## What it does
1. whisper.cpp word timings (cached as `RAW.mp4.hi.words.json`).
2. ffmpeg `silencedetect` → speech chunks.
3. Drops chunks that are only fillers (umm, अं, हम्म…; "हम" is kept — it means "we"), short noises, and **retakes**: a chunk whose opening words are repeated in one of the next two chunks (the recording rule "galti ho to 3 sec chup, wahi line dobara").
4. Renders with 10–15 ms audio fades at every join (no clicks).

Writes `OUT.edl.json`: kept `segments`, `cuts` (times in the new video — feed to **awk-sfx** for whooshes) and every `removed` chunk with its reason.

## Workflow for Claude
- Always `--dry-run` first and show the user the removed list (time, reason, text). Ask before rendering if a "retake" looks like real content.
- For reels, follow with **awk-captions** → **awk-sfx** → **awk-audio-master**.
- 4K iPhone HEVC is slow (~1 min per minute of footage at 1080 output). Use `--height 1080` for reels.
