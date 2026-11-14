#!/usr/bin/env python3
"""SFX placer: adds whoosh / pop / riser / ding sounds at the right moments.

Usage:
  sfx.py VIDEO [-o OUT] [--edl X.edl.json] [--captions X.captions.json]
               [--events events.json] [--every 3] [--level -16] [--list]

Sources of cues (combine any):
  --edl       every cut from awk-auto-cut gets a soft whoosh
  --captions  a pop on every Nth caption chunk (--every, default 3) and after long pauses
  --events    your own list: [{"t": 4.2, "sfx": "riser", "gain": -10}, ...]
--level sets the default SFX level in dB under full scale (voice should stay on top).
Writes OUT (video copied, audio mixed) and OUT.sfx.json (the final cue list).
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

DEFAULT_GAIN = {"whoosh": -6, "whoosh2": -4, "pop": -4, "click": -6, "ding": -8, "success": -6, "riser": -6, "hit": -4}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", nargs="?"); ap.add_argument("-o", "--out")
    ap.add_argument("--edl"); ap.add_argument("--captions"); ap.add_argument("--events")
    ap.add_argument("--every", type=int, default=0, help="pop on every Nth caption chunk (0 = no caption pops; they get repetitive fast)")
    ap.add_argument("--level", type=float, default=-20, help="base SFX level (dB); keep SFX well under the voice")
    ap.add_argument("--list", action="store_true", help="list available sounds")
    a = ap.parse_args()

    sounds = {p.stem: p for p in sorted(awk.SFX_DIR.glob("*.wav"))}
    if a.list or not a.video:
        print("sounds:", ", ".join(sounds)); return

    src = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "_sfx.mp4")
    dur = awk.duration(src)
    cues = []
    if a.edl:
        for i, t in enumerate(json.loads(Path(a.edl).read_text())["cuts"]):
            cues.append({"t": max(0, t - 0.18), "sfx": "whoosh" if i % 2 == 0 else "whoosh2"})
    if a.captions:
        ch = json.loads(Path(a.captions).read_text())["chunks"]
        for i, c in enumerate(ch):
            after_pause = i > 0 and c["s"] - ch[i - 1]["e"] > 0.6
            if (a.every and i % a.every == 0) or (a.every and after_pause):
                cues.append({"t": c["s"], "sfx": "pop"})
    if a.events:
        cues += json.loads(Path(a.events).read_text())
    # drop cues that crowd each other (< 0.25 s apart), keeping user events first
    cues.sort(key=lambda c: (c["t"], "gain" not in c))
    clean = []
    for c in cues:
        if c["sfx"] not in sounds:
            raise SystemExit(f"unknown sound '{c['sfx']}'. Available: {', '.join(sounds)}")
        if 0 <= c["t"] < dur and (not clean or c["t"] - clean[-1]["t"] >= 0.25):
            clean.append({"t": round(c["t"], 3), "sfx": c["sfx"], "gain": c.get("gain", DEFAULT_GAIN.get(c["sfx"], -6) + a.level + 10)})
    if not clean:
        raise SystemExit("no cues: pass --edl, --captions or --events")

    used = sorted({c["sfx"] for c in clean})
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src]
    for s in used:
        cmd += ["-i", sounds[s]]
    idx = {s: i + 1 for i, s in enumerate(used)}
    counts = {s: sum(1 for c in clean if c["sfx"] == s) for s in used}
    g, labels, k = [], [], {s: 0 for s in used}
    for s in used:
        outs = "".join(f"[{s}{j}]" for j in range(counts[s]))
        g.append(f"[{idx[s]}:a]asplit={counts[s]}{outs}" if counts[s] > 1 else f"[{idx[s]}:a]anull{outs}")
    for n, c in enumerate(clean):
        s = c["sfx"]; ms = int(c["t"] * 1000)
        g.append(f"[{s}{k[s]}]adelay={ms}|{ms},volume={c['gain']}dB[c{n}]"); k[s] += 1
        labels.append(f"[c{n}]")
    base = "[0:a]" if awk.has_audio(src) else None
    if base is None:
        g.append(f"anullsrc=r=48000:cl=stereo,atrim=0:{dur}[base]"); base = "[base]"
    g.append(f"{base}{''.join(labels)}amix=inputs={len(labels) + 1}:duration=first:normalize=0,alimiter=limit=0.95[a]")
    script = Path(str(out) + ".sfx.filter.txt"); script.write_text(";\n".join(g))
    cmd += ["-/filter_complex", script, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", out]
    awk.run(cmd)
    script.unlink(missing_ok=True)
    Path(str(out) + ".sfx.json").write_text(json.dumps(clean, indent=1))
    print(f"{len(clean)} SFX cues ({', '.join(f'{s}×{counts[s]}' for s in used)}) -> {out}")


if __name__ == "__main__":
    main()
