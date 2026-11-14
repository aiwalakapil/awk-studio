---
name: awk-finance-edit
description: Edit a raw finance/money talking-head video into a finance-channel style reel - tight cuts, punch-in zooms on numbers, ₹ counters, before/after bar charts, stock ticker, glass "calculator" cards, bank notification, checklist of steps, captions, SFX and -14 LUFS. Use for "finance reel edit", "Himansh ki video edit", "money video", "SIP video edit", "client finance edit", "raw to final finance".
---

# Finance edit (AI Wala Kapil Studio)

A recipe that chains the studio skills for money content. **Input must be RAW footage** (no burned-in captions or graphics): effects on top of an already-edited video fight with the old graphics.

## Pipeline
```bash
K=~/.claude/skills
python3 $K/awk-auto-cut/scripts/autocut.py RAW.mov --height 1080 -o cut.mp4 --dry-run   # check, then without --dry-run
python3 $K/awk-auto-zoom/scripts/autozoom.py cut.mp4 --words "SIP,₹,lakh,crore,percent" --dry-run   # -> cut_zoom.mp4.zoom.json
# Claude writes fin_fx.json (below), merges the zoom cues, previews, then:
python3 $K/awk-effects/scripts/effects.py cut.mp4 --spec fin_fx.json -o fx.mp4
python3 $K/awk-captions/scripts/captions.py fx.mp4 -o cap.mp4 --json-only     # fix ₹ amounts / brand words, then --from-json
python3 $K/awk-sfx/scripts/sfx.py cap.mp4 --captions cap.mp4.captions.json --edl cut.mp4.edl.json -o sfx.mp4
python3 $K/awk-audio-master/scripts/master.py sfx.mp4 --music bed.mp3 -o FINAL.mp4
python3 $K/awk-multi-export/scripts/export.py FINAL.mp4 --name Ep1
```

## Which effect for which line
| When the speaker says… | Effect |
|---|---|
| a hook about money habits | `title-behind` ("FINANCE|REELS?") + `ticker` along the bottom |
| a calculator / SIP / returns | `glass-widgets` (🧮 SIP ₹5,000/mo · ⏳ 20 saal · 💰 ₹50 lakh) |
| a bank balance / alert | `iphone-ui` notification (app: Bank) or toggle ("Auto-transfer ₹1,000") |
| a comparison (A vs B, before/after) | `chart` with two bars |
| a final amount | `money-counter` (from 0 to the amount, ₹, Indian commas) |
| steps / rules | `checklist` (every 0.6–1.4 s, matching the speech) |
| a punchline | `spotlight` with a label, or `freeze-callout` |
| every number word | zoom punch (auto-zoom `--words`) |

## Rules for client work
- Numbers on screen must match what the speaker says (and be correct). Ask the client if a figure is an example.
- Add "Not financial advice / for education" in the caption or a small end card when the client wants it.
- Keep the client's brand (their `brand.json` copy: colours, handle) — don't put AI Wala Kapil branding on client videos.
- Deliver IG + YT + WhatsApp files with `awk-multi-export`; keep the effects spec so revisions are a one-line change.
