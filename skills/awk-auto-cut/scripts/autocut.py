#!/usr/bin/env python3
"""Auto-cut: removes silences, filler words and repeated (bad) takes from a talking video.

Usage:
  autocut.py INPUT [-o OUT] [--lang hi] [--gap 0.5] [--pad 0.12] [--no-retakes] [--no-fillers] [--dry-run]

Writes OUT (default <input>_cut.mp4) and OUT.edl.json (kept ranges, cut points in the
output timeline, and everything removed with the reason).
"""
import argparse, difflib, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

# Only whole pauses-to-pause chunks made of these are dropped ("हम" is NOT here: it means "we").
FILLERS = {"um", "umm", "uh", "uhh", "hmm", "hm", "ah", "अं", "अम", "हम्म", "उम", "उं", "आ", "अ", "अह", "ऊं"}

FILLERS_N = {awk.norm(x) for x in FILLERS}


def silences(src, noise_db, min_len):
    """ffmpeg silencedetect -> [(start, end)]"""
    import re, subprocess
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-vn", "-af",
                        f"silencedetect=noise={noise_db}dB:d={min_len}", "-f", "null", "-"],
                       capture_output=True, text=True, errors="replace")
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    if len(en) < len(st):
        en.append(awk.duration(src))
    return list(zip(st, en))


def is_retake(a, b):
    """True if phrase b looks like a fresh attempt at phrase a (same opening words)."""
    wa = [awk.norm(w["w"]) for w in a["words"]]
    wb = [awk.norm(w["w"]) for w in b["words"]][: max(len(wa), 3)]
    if len(wa) < 2 or not wb:
        return False
    n = min(len(wa), len(wb), 6)
    head = difflib.SequenceMatcher(None, wa[:n], wb[:n]).ratio()
    return head >= 0.6


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input"); ap.add_argument("-o", "--out")
    ap.add_argument("--lang", default="hi")
    ap.add_argument("--gap", type=float, default=0.3, help="pauses longer than this (s) are cut")
    ap.add_argument("--pad", type=float, default=0.08, help="breathing room kept around speech (s)")
    ap.add_argument("--noise", type=float, default=-32, help="silence threshold in dB (raise to -30 for noisy rooms)")
    ap.add_argument("--no-retakes", action="store_true"); ap.add_argument("--no-fillers", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--crf", default="18")
    ap.add_argument("--height", type=int, help="downscale output to this height (e.g. 1080 for 4K sources)")
    a = ap.parse_args()

    src = Path(a.input).resolve()
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "_cut.mp4")
    total = awk.duration(src)
    words = awk.transcribe(src, a.lang)
    removed = []
    # speech regions = gaps between silences
    sil = silences(src, a.noise, a.gap)
    regions, t0 = [], 0.0
    for s0, s1 in sil:
        if s0 - t0 > 0.05:
            regions.append([t0, s0])
        t0 = s1
    if total - t0 > 0.05:
        regions.append([t0, total])
    ph = []
    for r0, r1 in regions:
        ws = [w for w in words if r0 - 0.05 <= (w["s"] + w["e"]) / 2 <= r1 + 0.05]
        ph.append({"s": r0, "e": r1, "words": ws, "text": " ".join(w["w"] for w in ws)})
    kept = []
    for p in ph:
        if not p["words"] and p["e"] - p["s"] < 0.6:
            removed.append({"s": p["s"], "e": p["e"], "reason": "noise", "text": ""}); continue
        if not a.no_fillers and p["words"] and all(awk.norm(w["w"]) in FILLERS_N for w in p["words"]):
            removed.append({"s": p["s"], "e": p["e"], "reason": "filler", "text": p["text"]}); continue
        kept.append(p)
    ph = kept
    if not a.no_retakes:
        kept = []
        for i, p in enumerate(ph):
            if any(is_retake(p, q) for q in ph[i + 1: i + 3]):
                removed.append({"s": p["s"], "e": p["e"], "reason": "retake", "text": p["text"]})
            else:
                kept.append(p)
        ph = kept

    segs = []
    for p in ph:
        s0, e0 = max(0.0, p["s"] - a.pad), min(total, p["e"] + a.pad)
        if segs and s0 - segs[-1][1] < 0.15:
            segs[-1][1] = max(segs[-1][1], e0)
        else:
            segs.append([s0, e0])
    segs = [[round(x, 3), round(y, 3)] for x, y in segs if y - x > 0.2]
    if not segs:
        raise SystemExit("nothing left after cutting")

    cuts, t = [], 0.0
    for s, e in segs[:-1]:
        t += e - s; cuts.append(round(t, 3))
    new_len = sum(e - s for s, e in segs)
    edl = {"source": str(src), "duration_in": round(total, 2), "duration_out": round(new_len, 2),
           "segments": segs, "cuts": cuts, "removed": sorted(removed, key=lambda r: r["s"])}
    edl_path = Path(str(out) + ".edl.json")
    edl_path.write_text(json.dumps(edl, ensure_ascii=False, indent=1))

    print(f"{total:.1f}s -> {new_len:.1f}s  ({len(segs)} segments, {len(cuts)} cuts)")
    for r in edl["removed"]:
        print(f"  - {r['s']:7.2f}-{r['e']:7.2f}  {r['reason']:7s} {r['text'][:70]}")
    if a.dry_run:
        print("dry run, EDL:", edl_path); return

    has_a = awk.has_audio(src)
    lines = []
    for i, (s, e) in enumerate(segs):
        lines.append(f"[0:v]trim=start={s}:end={e},setpts=PTS-STARTPTS[v{i}];")
        if has_a:
            d = e - s
            lines.append(f"[0:a]atrim=start={s}:end={e},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0, d - 0.015):.3f}:d=0.015[a{i}];")
    ins = "".join(f"[v{i}]" + (f"[a{i}]" if has_a else "") for i in range(len(segs)))
    vout = "[vc]" if a.height else "[v]"
    lines.append(f"{ins}concat=n={len(segs)}:v=1:a={1 if has_a else 0}{vout}" + ("[a]" if has_a else "") + (";" if a.height else ""))
    if a.height:
        lines.append(f"[vc]scale=-2:{a.height}:flags=lanczos[v]")
    script = Path(str(out) + ".filter.txt"); script.write_text("\n".join(lines))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-stats", "-i", src, "-/filter_complex", script, "-map", "[v]"]
    if has_a:
        cmd += ["-map", "[a]", "-c:a", "aac", "-b:a", "192k"]
    cmd += ["-c:v", "libx264", "-crf", a.crf, "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
    awk.run(cmd)
    script.unlink(missing_ok=True)
    print("wrote", out, "and", edl_path)


if __name__ == "__main__":
    main()
