---
name: awk-eleven-script
description: Convert a Hinglish reel/lecture script into an ElevenLabs Eleven v4 ready script (Devanagari Hindi + English words, numbers as words, emotion tags, one paragraph) and check it before spending credits. Use for "ElevenLabs ke liye script", "voiceover script", "TTS script banao", "AI voice script check".
---

# ElevenLabs script (AI Wala Kapil Studio)

These rules decide whether the voice sounds human.

## Convert (Claude does this)
1. Hindi words in **Devanagari**; English words (reel, caption, views, Claude, prompt, AI) stay **English**.
2. **Numbers as words**: `Day nine`, `पाँच गलतियाँ`, `सात slides`.
3. Tag at the start of a line: `[excited]` hook/promise/demo · `[serious]` problem hook · `[warmly]` motivation · `[confident]` CTA / "कल Day…".
4. Pauses: `…` short dramatic, `—` thinking, `।` end of sentence.
5. **One paragraph** (Enter splits the editor into blocks). Use ` … ` where a new paragraph would go.
6. Max 12–15 words per sentence.

## Check
```bash
python3 ~/.claude/skills/awk-eleven-script/scripts/check.py script.txt
```
Flags line breaks, digits, Roman Hindi, missing tags, long sentences; prints characters (≈ credits) and length. Fix until it prints ✓.

## Then in ElevenLabs
Voice **Viraj – Energetic, Clear Narrator** (Hindi) / **Rian** (English) · model **Eleven v4** · stability 40–50 · similarity 75 · press Generate **once**, listen to both versions, keep the one with no dropped word. Download MP3 44.1 kHz/192 kbps. Free plan = no commercial use; never clone a real person's voice without written permission; turn on "AI info" on Instagram.
