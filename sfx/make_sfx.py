#!/usr/bin/env python3
"""Generates the studio's own SFX from math (no samples), so they can be shared freely."""
import subprocess
from pathlib import Path
D = Path(__file__).resolve().parent
SFX = {
    # name: (duration, expression or filtergraph)
    "pop":     ("0.16", "aevalsrc='0.9*sin(2*PI*(380+1400*exp(-38*t))*t)*exp(-26*t)':s=48000:d=0.16"),
    "click":   ("0.05", "aevalsrc='0.8*sin(2*PI*2400*t)*exp(-140*t)':s=48000:d=0.05"),
    "ding":    ("1.2",  "aevalsrc='0.5*(sin(2*PI*1318*t)+0.5*sin(2*PI*2636*t)+0.25*sin(2*PI*3954*t))*exp(-4.5*t)':s=48000:d=1.2"),
    "success": ("0.7",  "aevalsrc='0.45*(sin(2*PI*784*t)*exp(-9*t)*lt(t,0.12)+sin(2*PI*1046*t)*exp(-7*(t-0.12))*gte(t,0.12)*lt(t,0.24)+sin(2*PI*1568*t)*exp(-5*(t-0.24))*gte(t,0.24))':s=48000:d=0.7"),
    "whoosh":  ("0.5",  "anoisesrc=d=0.5:c=pink:r=48000:a=0.9,bandpass=f=1400:w=1800,afade=t=in:d=0.22:curve=exp,afade=t=out:st=0.22:d=0.28:curve=exp"),
    "whoosh2": ("0.9",  "anoisesrc=d=0.9:c=brown:r=48000:a=1,highpass=f=300,lowpass=f=5000,afade=t=in:d=0.45:curve=qsin,afade=t=out:st=0.45:d=0.45:curve=qsin,aecho=0.6:0.4:40:0.3"),
    "riser":   ("1.6",  "aevalsrc='0.35*sin(2*PI*(200*t+300*t*t))*t/1.6+0.25*(random(0)*2-1)*pow(t/1.6,2)':s=48000:d=1.6,afade=t=out:st=1.5:d=0.1"),
    "marker":  ("2.0",  "anoisesrc=d=2:c=pink:r=48000:a=1,bandpass=f=3200:w=2600,tremolo=f=11:d=0.85,tremolo=f=3.3:d=0.5"),
    "hit":     ("0.8",  "aevalsrc='0.9*sin(2*PI*(55+90*exp(-20*t))*t)*exp(-5*t)+0.3*(random(0)*2-1)*exp(-40*t)':s=48000:d=0.8"),
}
for name, (d, src) in SFX.items():
    out = D / f"{name}.wav"
    raw = D / f".{name}.raw.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", src, "-c:a", "pcm_f32le", str(raw)], check=True)
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True)
    peak = float(r.stderr.split("max_volume:")[1].split("dB")[0])
    gain = -3.0 - peak  # peak-normalise every sound to -3 dBFS
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af", f"volume={gain}dB,alimiter=limit=0.71,aformat=sample_fmts=s16:channel_layouts=stereo", str(out)], check=True)
    raw.unlink()
    print(f"made {out.name} ({gain:+.1f} dB)")
