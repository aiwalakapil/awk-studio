#!/usr/bin/env python3
"""Whiteboard explainer from a JSON board: hand-written words, doodles, marker hand, page pans, voice.

Usage:
  whiteboard.py board.json [-o OUT.mp4] [--still SECONDS]

board.json:
{"voice": "rule72.mp3", "lang": "hi", "vertical": false, "footnote": "*approx · guaranteed nahi",
 "pages_at": [12.4],                       # seconds when the camera pans to the next page (page 2 starts at x = 1920)
 "items": [
   {"text": "Paisa DOUBLE kab hoga?", "at": 0.1, "x": 150, "y": 190, "size": 104, "bold": true},
   {"shape": "bulb", "at": "@सवाल", "x": 1720, "y": 360, "s": 1, "color": "orange"},
   {"text": "RULE OF 72", "at": 3.5, "x": 230, "y": 470, "size": 160, "color": "blue", "bold": true},
   {"shape": "box", "at": 4.6, "x": 190, "y": 315, "w": 990, "h": 210, "color": "blue"},
   {"shape": "circle", "at": 12.0, "x": 1290, "y": 830, "r": 85, "color": "red"},
   {"shape": "arrow", "at": 12.8, "from": [2080, 900], "to": [3720, 892]},
   {"shape": "moneybag", "at": 13.1, "x": 2230, "y": 880, "s": 0.55},
   {"path": "M 0 0 Q 50 -40 100 0", "at": 14, "x": 2400, "y": 500, "s": 2, "color": "green"}
 ]}
"at": seconds or "@word" (spoken word in the voice). "until" is optional (auto from length).
Shapes: circle, box, underline, arrow, check, cross, bulb, moneybag, coin, star, house, up, down.
Colours: ink, blue, red, green, orange, purple or #hex. Board is 1920x1080 per page (1080x1920 when vertical).
"""
import argparse, json, math, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

COL = {"ink": "#1d1d1f", "blue": "#1f5fd1", "red": "#d6332f", "green": "#178a3c", "orange": "#e8861a", "purple": "#6b2fb3"}
SHAPES = {   # paths drawn around (0, 0), scaled by s
    "bulb": "M 60 230 Q -20 180 0 100 Q 30 30 100 30 Q 175 35 195 100 Q 210 180 135 230 L 132 275 L 65 275 Z M 70 300 L 128 300 M 80 322 L 118 322 M 100 -10 L 100 -45 M 0 20 L -25 -5 M 200 20 L 225 -5",
    "moneybag": "M -40 -150 L 40 -150 L 25 -122 Q 112 -92 102 -30 Q 96 0 0 0 Q -96 0 -102 -30 Q -112 -92 -25 -122 Z M -34 -126 L 34 -126",
    "check": "M -60 0 L -15 45 L 70 -55",
    "cross": "M -50 -50 L 50 50 M 50 -50 L -50 50",
    "star": "M 0 -80 L 22 -25 L 80 -25 L 34 10 L 50 70 L 0 35 L -50 70 L -34 10 L -80 -25 L -22 -25 Z",
    "house": "M -90 0 L -90 -110 L 0 -190 L 90 -110 L 90 0 Z M -25 0 L -25 -60 L 25 -60 L 25 0",
    "up": "M 0 80 L 0 -80 M -40 -40 L 0 -80 L 40 -40",
    "down": "M 0 -80 L 0 80 M -40 40 L 0 80 L 40 40",
    "coin": "M 60 0 A 60 60 0 1 1 -60 0 A 60 60 0 1 1 60 0 M -20 -25 L 25 -25 M -20 -5 L 25 -5 M -20 -25 Q 25 -25 20 -5 Q 15 12 -15 12 L 20 40",
}


def circle(r):
    pts = [(r * math.cos(t) * (1 + 0.04 * math.sin(3 * t)), r * 0.92 * math.sin(t)) for t in [i / 24 * 2 * math.pi + 0.3 for i in range(27)]]
    return "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in pts)


def build(item):
    c = item.get("color", "ink"); c = COL.get(c, c)
    if "text" in item:
        return {"kind": "text", "text": item["text"], "x": item["x"], "y": item["y"], "size": item.get("size", 90), "color": c, "weight": 700 if item.get("bold") else 400}
    sh = item.get("shape")
    w = item.get("w_line", 8)
    if "path" in item:
        return {"kind": "path", "d": item["path"], "tx": item.get("x", 0), "ty": item.get("y", 0), "sc": item.get("s", 1), "color": c, "w": w}
    if sh == "circle":
        return {"kind": "path", "d": circle(item.get("r", 80)), "tx": item["x"], "ty": item["y"], "color": c, "w": w}
    if sh == "box":
        x, y, ww, hh = item["x"], item["y"], item["w"], item["h"]
        return {"kind": "path", "d": f"M {x} {y + 5} L {x + ww} {y} L {x + ww + 6} {y + hh} L {x + 4} {y + hh + 6} Z", "color": c, "w": w}
    if sh == "underline":
        x, y, ww = item["x"], item["y"], item["w"]
        return {"kind": "path", "d": f"M {x} {y} Q {x + ww / 2} {y + 18} {x + ww} {y - 6}", "color": c, "w": w + 2}
    if sh == "arrow":
        (x1, y1), (x2, y2) = item["from"], item["to"]
        a = math.atan2(y2 - y1, x2 - x1); L = 34
        h1 = (x2 - L * math.cos(a - 0.5), y2 - L * math.sin(a - 0.5)); h2 = (x2 - L * math.cos(a + 0.5), y2 - L * math.sin(a + 0.5))
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 - item.get("bend", 0)
        return {"kind": "path", "d": f"M {x1} {y1} Q {mx} {my} {x2} {y2} M {h1[0]:.0f} {h1[1]:.0f} L {x2} {y2} L {h2[0]:.0f} {h2[1]:.0f}", "color": c, "w": w}
    if sh in SHAPES:
        return {"kind": "path", "d": SHAPES[sh], "tx": item["x"], "ty": item["y"], "sc": item.get("s", 1), "color": c, "w": w}
    raise SystemExit(f"unknown shape '{sh}'")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("board"); ap.add_argument("-o", "--out"); ap.add_argument("--still", type=float)
    a = ap.parse_args()
    bp = Path(a.board).resolve(); B = json.loads(bp.read_text())
    words = []
    voice = None
    if B.get("voice"):
        vp = Path(B["voice"]).expanduser(); vp = vp if vp.is_absolute() else bp.parent / vp
        wav = awk.STUDIO / "public" / "_in" / f"{vp.stem}_wb.wav"; wav.parent.mkdir(parents=True, exist_ok=True)
        awk.run(["ffmpeg", "-y", "-loglevel", "error", "-i", vp, "-ar", "48000", "-ac", "2", wav])
        voice = f"_in/{wav.name}"
        if any(isinstance(i.get("at"), str) for i in B["items"]):
            words = awk.transcribe(vp.resolve(), B.get("lang", "hi"))
    items = []
    for it in B["items"]:
        t = it["at"]
        if isinstance(t, str) and t.startswith("@"):
            w = next((x for x in words if awk.word_match(t[1:], x["w"])), None)
            if not w:
                raise SystemExit(f"word '{t[1:]}' not heard in the voice")
            t = w["s"]
        t = float(t)
        built = build(it)
        dur = it.get("until", None)
        if dur is None:
            dur = t + (max(0.4, 0.055 * len(it["text"])) if "text" in it else 0.6)
        built.update({"a": round(t, 3), "b": round(float(dur), 3)})
        items.append(built)
    W, H = (1080, 1920) if B.get("vertical") else (1920, 1080)
    total = max([i["b"] for i in items] + [0]) + 1.5
    if voice:
        total = max(total, awk.duration(awk.STUDIO / "public" / voice) + 0.8)
    props = {"items": items, "pages": B.get("pages_at", []), "voice": voice, "footnote": B.get("footnote"), "duration": total, "width": W, "height": H}
    out = Path(a.out).resolve() if a.out else bp.with_suffix(".mp4")
    if a.still is not None:
        pf = awk.STUDIO / "out" / ".props_wb.json"; pf.write_text(json.dumps(props, ensure_ascii=False))
        png = out.with_suffix(f".{a.still:g}.png")
        subprocess.run(["npx", "remotion", "still", "src/index.ts", "Whiteboard", str(png), f"--props={pf}", f"--frame={int(a.still * 30)}", "--log=error"], cwd=awk.STUDIO, check=True)
        print("wrote", png); return
    awk.remotion_render("Whiteboard", out, props, ["--crf=18"])
    print(f"wrote {out} ({total:.1f}s, {len(items)} items)")


if __name__ == "__main__":
    main()
