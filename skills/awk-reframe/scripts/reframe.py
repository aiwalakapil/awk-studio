#!/usr/bin/env python3
"""Reframe: turn a 16:9 video into 9:16 (or 1:1 / 4:5) that keeps the face in frame.

Usage:
  reframe.py VIDEO [-o OUT] [--ratio 9:16|1:1|4:5] [--zoom 1.0] [--fast]
Face tracking is Apple Vision (on-device), smoothed so the frame glides instead of jumping.
"""
import argparse, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

SIZES = {"9:16": (1080, 1920), "1:1": (1080, 1080), "4:5": (1080, 1350), "16:9": (1920, 1080)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("-o", "--out")
    ap.add_argument("--ratio", default="9:16", choices=SIZES); ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--fast", action="store_true")
    a = ap.parse_args()
    src = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else src.with_name(f"{src.stem}_{a.ratio.replace(':', 'x')}.mp4")
    sw, sh = awk.video_size(src); dur = awk.duration(src)
    _, faces_json = awk.vision(src, a.fast)
    faces = awk.face_track(faces_json, dur)
    # slower smoothing than effects: a camera operator, not a tracker
    W = 15
    faces = [[sum(v[i] for v in faces[max(0, k - W):k + W + 1]) / len(faces[max(0, k - W):k + W + 1]) for i in range(3)] for k in range(len(faces))]
    w, h = SIZES[a.ratio]
    awk.remotion_render("Reframe", out, {"src": awk.stage(src), "srcW": sw, "srcH": sh, "faces": faces, "duration": dur, "width": w, "height": h, "zoom": a.zoom}, ["--crf=18"])
    print("wrote", out)


if __name__ == "__main__":
    main()
