---
name: awk-sfx
description: Add sound effects (whoosh on cuts, pop on captions, riser, hit, ding, success) to a video at the right moments and mix them under the voice. Use for "SFX lagao", "sound effects", "whoosh on cuts", "pop sound on text", "sound design".
---

# SFX placer (AI Wala Kapil Studio)

Own sounds (made from math in `awk-studio/sfx/make_sfx.py`, free to share): `pop click ding success whoosh whoosh2 riser hit`.

## Run
```bash
python3 ~/.claude/skills/awk-sfx/scripts/sfx.py --list
python3 ~/.claude/skills/awk-sfx/scripts/sfx.py VIDEO.mp4 -o VIDEO_sfx.mp4 \
   --edl RAW_cut.mp4.edl.json --captions VIDEO_cap.mp4.captions.json --events events.json
```
- `--edl` (from awk-auto-cut): whoosh on every cut.
- `--captions` (from awk-captions): pop on every 3rd chunk (`--every N`) and after long pauses.
- `--events`: your own cues `[{"t": 0.0, "sfx": "riser", "gain": -14}, {"t": 2.1, "sfx": "hit"}]`.
- `--level -16` base level; cues closer than 0.25 s are thinned. The final cue list is saved as `OUT.sfx.json`.

## Taste rules (from the reels)
- Hook: riser into the first big text, a hit when it lands.
- Whoosh on cuts and transitions, pop on text boxes, ding/success on a "win moment" or ✅.
- Fewer is better: if every caption pops, nothing pops. Voice must stay clearly on top.
- Envato SFX can be used too: copy the .wav into `awk-studio/sfx/` locally (never commit Envato files).
Run **awk-audio-master** after this.
