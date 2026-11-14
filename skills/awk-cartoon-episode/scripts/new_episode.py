#!/usr/bin/env python3
"""Start a new cartoon episode from your cartoon template (APFS clone: instant, no extra disk).

Usage:
  new_episode.py <slug> [--parent DIR]          e.g. new_episode.py lohri-cartoon

The template is registered in ~/.awk/templates.json under "cartoon":
  {"cartoon": {"path": "/path/to/festival-template", "brief": "/path/to/BRIEF.md", "assets": "/path/to/festival-assets", "skip": ["out", "voice/raw"]}}
After cloning it empties out/ and voice/raw/, and prints the brief to follow.
"""
import argparse, json, shutil, subprocess, sys
from pathlib import Path

CFG = Path("~/.awk/templates.json").expanduser()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug"); ap.add_argument("--parent")
    a = ap.parse_args()
    if not CFG.exists():
        raise SystemExit(f"no {CFG}. Register your cartoon template there (see this script's header).")
    t = json.loads(CFG.read_text()).get("cartoon")
    if not t:
        raise SystemExit("no 'cartoon' entry in ~/.awk/templates.json")
    src = Path(t["path"]).expanduser()
    dst = (Path(a.parent).expanduser() if a.parent else src.parent) / a.slug
    if dst.exists():
        raise SystemExit(f"{dst} already exists")
    if subprocess.run(["cp", "-cR", str(src), str(dst)]).returncode != 0:
        shutil.copytree(src, dst, symlinks=True)
    for rel in t.get("skip", []):
        p = dst / rel
        if p.is_dir():
            shutil.rmtree(p); p.mkdir(parents=True)
    print(f"new episode: {dst}")
    if t.get("brief"):
        print(f"brief: {t['brief']}  (read it fully before writing anything)")
    if t.get("assets"):
        print(f"music/sfx library: {t['assets']}  (copy only what you use into public/)")
    for ex in t.get("examples", []):
        print(f"reference episode: {ex}")


if __name__ == "__main__":
    main()
