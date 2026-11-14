---
name: awk-cartoon-episode
description: Produce a complete kids' cartoon episode (Hindi, Remotion, 1920x1080) from your cartoon template - characters with lip-sync and blinking, story scenes, title card, mascot, music and SFX, subtitles, thumbnail and YouTube upload details - with estimated voice timings first and real ElevenLabs voices dropped in later. Use for "cartoon episode", "Dadi Himansh episode", "festival cartoon", "kids story video", "bachchon ki kahani".
---

# Cartoon episode (AI Wala Kapil Studio)

## Start
```bash
python3 ~/.claude/skills/awk-cartoon-episode/scripts/new_episode.py lohri-cartoon
```
This clones the cartoon template registered in `~/.awk/templates.json` (APFS clone: instant, no extra disk), empties `out/` and `voice/raw/`, and prints the **brief** to follow. Read the brief fully before writing anything.

## The pipeline (from the brief)
1. **Script** `voice/script.md` in the template's table format (`| L01 | scene note | H | Devanagari line |`), short child-friendly lines; `python3 voice/fake_voice.py` → estimated timings.
2. **Timeline** `src/scenes.config.ts` + `src/episode.tsx`; `node tl.mjs` prints frames.
3. **Scenes** `src/scenes/*.tsx` using the kit (`useG`, `sp`, `ramp`, `Bubble`, `Tag`, `Burst`…) and characters; time everything with `at(lineId, word)`, never hard-coded frames.
4. **Sound** `src/sounds.ts` + music plan. **Thumbnail** `src/Thumb.tsx`.
5. **Verify**: `npx tsc --noEmit -p .`, `node stills.mjs <frames…>` (2+ per scene), look at every still; fix cut-offs, overlaps, empty emoji boxes in SVG text, static shots.
6. **Render** with `--concurrency=3 --crf=20`, extract 6 frames and look. Write `out/YouTube_Upload_Details.md` (Made for Kids: Yes).
7. **Voices later**: record lines in ElevenLabs (Dadi = Dulari Didi, Himansh = Amit), save `voice/raw/L01.mp3…`, `python3 voice/build_voice.py`, re-render — no scene changes.

## Non-negotiable rules
- Respect: never depict any Islamic prophet or the Sikh Gurus as a figure, face or silhouette; deities only in dignified traditional form; stay factual ("कई जगह" where traditions vary); no scary or violent imagery.
- Only touch your own episode folder; never edit the template or other episodes.
- Emoji only in HTML text, never inside SVG `<text>`.
