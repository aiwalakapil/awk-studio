#!/usr/bin/env python3
"""Audio master: clean voice + music bed with ducking + -14 LUFS (Instagram/YouTube standard).

Usage:
  master.py VIDEO [-o OUT] [--music track.mp3] [--music-vol 0.13] [--music-start 0]
                  [--no-denoise] [--lufs -14] [--tp -1.5]

Chain (same as the AI Wala Kapil reels):
  voice: highpass 80 Hz -> light denoise -> compressor 3:1
  music: loops if short, ~13% volume, fades, ducks under the voice (sidechain)
  mix -> two-pass loudnorm (-14 LUFS, true peak -1.5 dB) -> limiter
Video stream is copied untouched. Prints the measured loudness before/after.
"""
import argparse, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk


def measure(cmd_in, graph, lufs, tp):
    """First loudnorm pass: returns the measured values."""
    import subprocess
    g = graph + f";[mix]loudnorm=I={lufs}:TP={tp}:LRA=11:print_format=json[o]"
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", *cmd_in, "-filter_complex", g, "-map", "[o]", "-f", "null", "-"],
                       capture_output=True, text=True, errors="replace")
    m = re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r.stderr, re.S)
    if not m:
        sys.stderr.write(r.stderr[-2000:]); raise SystemExit("loudness measure failed")
    return json.loads(m.group(0))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("-o", "--out")
    ap.add_argument("--music"); ap.add_argument("--music-vol", type=float, default=0.13)
    ap.add_argument("--music-start", type=float, default=0.0, help="start offset inside the music file (s)")
    ap.add_argument("--no-denoise", action="store_true")
    ap.add_argument("--lufs", type=float, default=-14); ap.add_argument("--tp", type=float, default=-1.5)
    a = ap.parse_args()

    src = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "_master.mp4")
    if not awk.has_audio(src):
        raise SystemExit("video has no audio")
    dur = awk.duration(src)

    inputs = ["-i", str(src)]
    voice = "highpass=f=80," + ("" if a.no_denoise else "afftdn=nf=-28:tn=1,") + \
            "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,aformat=sample_rates=48000:channel_layouts=stereo"
    if a.music:
        inputs = ["-i", str(src), "-stream_loop", "-1", "-ss", str(a.music_start), "-i", str(Path(a.music).resolve())]
        fade_out = max(0, dur - 1.5)
        graph = (f"[0:a]{voice},asplit=2[v][key];"
                 f"[1:a]atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,aformat=sample_rates=48000:channel_layouts=stereo,"
                 f"volume={a.music_vol},afade=t=in:d=1,afade=t=out:st={fade_out:.3f}:d=1.5[m];"
                 f"[m][key]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=350[duck];"
                 f"[v][duck]amix=inputs=2:duration=first:normalize=0[mix]")
    else:
        graph = f"[0:a]{voice}[mix]"

    m = measure(inputs, graph, a.lufs, a.tp)
    # linear gain to the target (keeps dynamics natural), limiter catches the peaks
    gain = a.lufs - float(m["input_i"])
    final = graph + f";[mix]volume={gain:.2f}dB,alimiter=limit={10 ** (a.tp / 20):.3f}:level=false,aresample=48000[a]"
    awk.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", final, "-map", "0:v?", "-map", "[a]",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", f"{dur:.3f}", str(out)])
    # verify
    import subprocess
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(out), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, errors="replace")
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", r.stderr); P = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r.stderr)
    print(f"before: {float(m['input_i']):.1f} LUFS  ->  after: {I[-1] if I else '?'} LUFS, true peak {P[-1] if P else '?'} dBFS")
    print("wrote", out)


if __name__ == "__main__":
    main()
