---
name: awk-reframe
description: Convert a landscape (16:9) video to vertical 9:16, square 1:1 or 4:5 while keeping the speaker's face in frame with smooth face tracking. Use for "16:9 se reel banao", "vertical karo", "reframe", "crop to 9:16", "podcast clip to short", "lecture clip to reel".
---

# Reframe (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-reframe/scripts/reframe.py LECTURE_clip.mp4 --ratio 9:16 -o clip_9x16.mp4
```
Options: `--ratio 9:16|1:1|4:5|16:9` · `--zoom 1.15` (tighter) · `--fast` (quicker face tracking).

- Follows the largest face with heavy smoothing (moves like a camera operator, not a jittery tracker); eyes sit a little above centre.
- With two people on screen it follows the bigger face. For split-screen podcasts cut the clip per speaker first.
- Typical use: cut a 30–60 s moment from a class recording → reframe → awk-captions → awk-sfx → awk-audio-master → post as a Short.
