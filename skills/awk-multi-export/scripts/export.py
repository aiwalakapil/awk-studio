#!/usr/bin/env python3
"""Multi-export: one master edit -> Instagram, YouTube Shorts, WhatsApp and (optional) YouTube 16:9 files.

Usage:
  export.py MASTER.mp4 [-d OUTDIR] [--name Day9] [--end-ig ig_end.mp4] [--end-yt yt_end.mp4] [--wide]

  IG_<name>.mp4     1080x1920, high quality, + --end-ig clip (e.g. "comment karo" CTA)
  YT_<name>.mp4     1080x1920, + --end-yt clip (e.g. "Subscribe" ending)
  WA_<name>.mp4     720x1280, small file for WhatsApp channel (kept under 16 MB if possible)
  YTwide_<name>.mp4 1920x1080 with blurred sides (--wide)
"""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

ENC = ["-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart"]


def render(master, end, w, h, out, extra):
    ins = ["-i", str(master)] + (["-i", str(end)] if end else [])
    fit = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30"
    if end:
        a1 = ("[1:a]aformat=sample_rates=48000:channel_layouts=stereo[a1]" if awk.has_audio(end)
              else f"anullsrc=r=48000:cl=stereo,atrim=0:{awk.duration(end):.3f}[a1]")   # silent end card
        g = (f"[0:v]{fit}[v0];[1:v]{fit}[v1];[0:a]aformat=sample_rates=48000:channel_layouts=stereo[a0];"
             f"{a1};[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]")
        awk.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-filter_complex", g, "-map", "[v]", "-map", "[a]", *ENC, *extra, str(out)])
    else:
        awk.run(["ffmpeg", "-y", "-loglevel", "error", *ins, "-vf", fit, "-map", "0:v", "-map", "0:a?", *ENC, *extra, str(out)])
    mb = out.stat().st_size / 1e6
    print(f"  ✓ {out.name}  {awk.duration(out):.1f}s  {mb:.1f} MB")
    return mb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("master"); ap.add_argument("-d", "--outdir"); ap.add_argument("--name")
    ap.add_argument("--end-ig"); ap.add_argument("--end-yt"); ap.add_argument("--wide", action="store_true")
    a = ap.parse_args()
    m = Path(a.master).resolve(); name = a.name or m.stem
    od = Path(a.outdir).resolve() if a.outdir else m.parent / f"{name}_exports"; od.mkdir(parents=True, exist_ok=True)
    dur = awk.duration(m)
    if dur > 90:
        print(f"  ! {dur:.0f}s: Instagram reels up to 3 min are allowed, but 25-60 s performs best")
    render(m, a.end_ig, 1080, 1920, od / f"IG_{name}.mp4", ["-crf", "18", "-preset", "slow"])
    render(m, a.end_yt, 1080, 1920, od / f"YT_{name}.mp4", ["-crf", "18", "-preset", "slow"])
    # WhatsApp: aim for < 16 MB
    kbps = max(800, int((15.5 * 8000) / max(1, dur)) - 128)
    render(m, None, 720, 1280, od / f"WA_{name}.mp4", ["-b:v", f"{min(kbps, 3000)}k", "-maxrate", f"{min(kbps, 3000)}k", "-bufsize", f"{2 * min(kbps, 3000)}k", "-preset", "slow"])
    if a.wide:
        out = od / f"YTwide_{name}.mp4"
        g = ("[0:v]split=2[a][b];[a]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,boxblur=30:3,eq=brightness=-0.08[bg];"
             "[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0,setsar=1,fps=30[v]")
        awk.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(m), "-filter_complex", g, "-map", "[v]", "-map", "0:a?", *ENC, "-crf", "18", str(out)])
        print(f"  ✓ {out.name}")
    print("exports in", od)


if __name__ == "__main__":
    main()
