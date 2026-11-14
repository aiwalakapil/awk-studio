#!/usr/bin/env python3
"""3D intro: metal letters + glowing ring (logo) or a spinning gold coin (coin), with SFX. 6 seconds.

Usage:
  intro3d.py --kind logo --line1 "AI WALA" --line2 "KAPIL" --sub "AI CREATOR MASTERCLASS" [-o intro.mp4]
  intro3d.py --kind coin --line1 "FINANCE" --line2 "WITH HIMANSH" --symbol ₹ --vertical
Options: --vertical (1080x1920), --color1/--color2/--glow (hex), --no-sfx, --still FRAME (png preview).
3D text is Latin letters/numbers only (put Hindi in --sub). Rendered with the ANGLE GL backend.
"""
import argparse, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--kind", choices=["logo", "coin"], default="logo")
    ap.add_argument("--line1", required=True); ap.add_argument("--line2", default=""); ap.add_argument("--sub", default="")
    ap.add_argument("--symbol", default="₹"); ap.add_argument("--color1"); ap.add_argument("--color2"); ap.add_argument("--glow")
    ap.add_argument("--vertical", action="store_true"); ap.add_argument("--no-sfx", action="store_true")
    ap.add_argument("--still", type=int); ap.add_argument("-o", "--out")
    a = ap.parse_args()
    comp = ("Logo3D" if a.kind == "logo" else "Coin3D") + ("Vertical" if a.vertical else "")
    props = {"line1": a.line1, "line2": a.line2, "sfx": not a.no_sfx}
    if a.kind == "logo":
        props["sub"] = a.sub
        for k in ("color1", "color2", "glow"):
            if getattr(a, k):
                props[k] = getattr(a, k)
    else:
        props["symbol"] = a.symbol
    out = Path(a.out or f"{a.kind}_intro{'_9x16' if a.vertical else ''}.{'png' if a.still is not None else 'mp4'}").resolve()
    if a.still is not None:
        import json
        pf = awk.STUDIO / "out" / ".props_3d.json"; pf.parent.mkdir(parents=True, exist_ok=True); pf.write_text(json.dumps(props, ensure_ascii=False))
        subprocess.run(["npx", "remotion", "still", "src/index.ts", comp, str(out), f"--props={pf}", f"--frame={a.still}", "--gl=angle", "--log=error"], cwd=awk.STUDIO, check=True)
    else:
        awk.remotion_render(comp, out, props, ["--gl=angle", "--crf=16"])
    print("wrote", out)


if __name__ == "__main__":
    main()
