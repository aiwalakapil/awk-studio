---
name: awk-audio-master
description: Final audio mix for a video - clean the voice, add a music bed that ducks under speech, and hit -14 LUFS / -1.5 dB true peak for Instagram and YouTube. Use for "audio theek karo", "music add karo", "ducking", "loudness", "final mix", "awaaz saaf karo".
---

# Audio master (AI Wala Kapil Studio)

Same chain as the reels (guide Part K7).

## Run
```bash
python3 ~/.claude/skills/awk-audio-master/scripts/master.py VIDEO.mp4 -o VIDEO_final.mp4 --music bed.mp3
```
Options: `--music-vol 0.13` (≈13 %, voice stays on top) · `--music-start 12` (start inside the track) · `--no-denoise` · `--lufs -14` · `--tp -1.5`.

## What it does
voice → highpass 80 Hz → light denoise (afftdn) → compressor 3:1 · music → loop to length → volume → fade in/out → sidechain duck under the voice · mix → measured gain to -14 LUFS → true-peak limiter. Video is copied untouched. Prints loudness before → after.

## Rules
- Music only from licensed sources: Envato "Claim Clear" tracks (log in `Assets/Envato/LICENSES.md`), YouTube Audio Library, or Pixabay. Never commit music to the repo.
- Always last in the chain (after captions and SFX).
- If the voice was ElevenLabs, speed it 1.05–1.08x **before** this step (`atempo=1.06`).
