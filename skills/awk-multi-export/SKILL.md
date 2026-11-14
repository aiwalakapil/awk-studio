---
name: awk-multi-export
description: Export one finished edit as Instagram reel, YouTube Short (with a different ending), WhatsApp-sized file and an optional 16:9 YouTube version with blurred sides. Use for "sab platform ke liye export", "IG aur YT version", "WhatsApp ke liye chhota karo", "export".
---

# Multi-export (AI Wala Kapil Studio)

```bash
python3 ~/.claude/skills/awk-multi-export/scripts/export.py FINAL.mp4 --name Day9 \
   --end-ig ig_cta.mp4 --end-yt yt_subscribe.mp4 --wide
```
| File | What |
|---|---|
| `IG_Day9.mp4` | 1080×1920, high quality, + Instagram ending (`--end-ig`) |
| `YT_Day9.mp4` | 1080×1920, + YouTube ending (`--end-yt`, e.g. awk-course-look `99_EndCard.mp4`) |
| `WA_Day9.mp4` | 720×1280, sized to stay under ~16 MB for the WhatsApp channel |
| `YTwide_Day9.mp4` | 1920×1080 with blurred sides (`--wide`) |

Endings without audio get silence added automatically. Instagram and YouTube need different CTAs (comment keyword vs subscribe), so keep the main take CTA-free and let the endings carry it.
