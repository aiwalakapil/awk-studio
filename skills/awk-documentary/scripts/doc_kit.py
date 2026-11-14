#!/usr/bin/env python3
"""Documentary production kit: creates the docs/ checklist for one episode.

Usage:
  doc_kit.py <episode_folder> --title "Cold Case Earth: The Signal" [--minutes 18] [--lang en|hi]

Creates docs/01..10 (script, voice script, shot list, footage & licences, data & credits, publishing,
permissions, channel kit, fact-check log, shorts plan). Claude fills them in order; nothing is
published until 09-fact-check-log has no open rows.
"""
import argparse
from pathlib import Path

DOCS = {
 "01-script-reader.md": "# {title}: script (reader version)\n\nTarget length: ~{minutes} min (≈ {words} words at 140 wpm).\n\n## Cold open (0:00–0:45)\nThe strangest true moment of the story, no context yet.\n\n## Act 1 — The mystery\n\n## Act 2 — The investigation\n\n## Act 3 — The answer (and what it means)\n\n## Ending + CTA\n\n> Every factual sentence gets a [n] marker that points to a row in 09-fact-check-log.md.\n",
 "02-script-voice.txt": "# Voice script (paste into ElevenLabs). One paragraph per beat. Numbers as words. No [n] markers.\n",
 "03-shot-list.csv": "beat,start_s,end_s,narration_snippet,visual_type,source,file,notes\n# visual_type: broll | map | chart | photo-3d | archive | title | quote\n# rule: a new visual every ~3.5 s; never more than 6 s on one image\n",
 "04-envato-and-footage.md": "# Footage and licences\n\n| File | Source (Envato/Pexels/own) | Licence / item ID | Used at | Notes |\n|---|---|---|---|---|\n",
 "05-data-and-credits.md": "# Data and credits\n\n| Chart / map | Data source (URL) | Date accessed | Licence | On-screen credit |\n|---|---|---|---|---|\n\nMaps: built-in world map = Natural Earth (public domain).\n",
 "06-publishing-package.md": "# Publishing package\n\n## Title options\n1.\n2.\n3.\n\n## Description\n\n## Chapters\n0:00 Cold open\n\n## Tags\n\n## Thumbnail text (max 4 words)\n\n## Settings\n- Altered or synthetic content: check (AI narration)\n- Captions: upload docs/captions.srt\n",
 "07-permission-emails.md": "# Permission requests (only if using someone else's photos/footage)\n\n| To | Asset | Sent | Reply |\n|---|---|---|---|\n",
 "08-channel-kit.md": "# Channel kit\n\n- Name / handle:\n- Avatar / banner:\n- Voice (ElevenLabs voice name, model, settings):\n- Music style:\n",
 "09-fact-check-log.md": "# Fact-check log\n\n| # | Claim (as narrated) | Source 1 | Source 2 | Status (open/ok/changed) | Note |\n|---|---|---|---|---|---|\n",
 "10-shorts-plan.md": "# Shorts from this episode\n\n| # | Start–end | Hook line | Reframe/captions done |\n|---|---|---|---|\n",
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder"); ap.add_argument("--title", required=True)
    ap.add_argument("--minutes", type=int, default=12); ap.add_argument("--lang", default="en")
    a = ap.parse_args()
    d = Path(a.folder).expanduser() / "docs"; d.mkdir(parents=True, exist_ok=True)
    for name, body in DOCS.items():
        p = d / name
        if not p.exists():
            p.write_text(body.format(title=a.title, minutes=a.minutes, words=a.minutes * 140))
    (d.parent / "footage").mkdir(exist_ok=True); (d.parent / "voice").mkdir(exist_ok=True)
    print(f"kit ready: {d}")
    for name in DOCS:
        print("  ", name)


if __name__ == "__main__":
    main()
