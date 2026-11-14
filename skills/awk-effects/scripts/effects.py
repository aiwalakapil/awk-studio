#!/usr/bin/env python3
"""Effects: put scroll-stopping effects on a video from a small JSON list, in one render.

Usage:
  effects.py --list
  effects.py VIDEO --spec cues.json [-o OUT.mp4] [--lang hi] [--fast-matte] [--preview T]

cues.json  (t = seconds, or "@word" / "@word+0.3" = when that word is spoken)
[
  {"fx": "title-behind",  "t": 0.2, "dur": 2.5, "props": {"text": "AI SE|KAMAI"}},
  {"fx": "glass-widgets", "t": "@views", "dur": 3, "props": {"items": [{"icon": "🔥", "title": "Views", "value": "4.2L"}]}},
  {"fx": "transition",    "t": 9.8, "dur": 0.4, "props": {"kind": "whip"}}
]
--preview T renders only stills at second T (fast check) into OUT_preview_T.png.
"""
import argparse, json, subprocess, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

FX_DOC = {
    "title-behind":   ("behind", "Big title behind the person.  text: 'TOP|LINE' (| = new line), y: 0.27, size, color"),
    "glass-widgets":  ("front",  "Floating glass cards around the person.  items: [{icon,title,value}] (max 4)"),
    "spotlight":      ("front",  "Dims everything except a circle on the face.  label, glitter: true, x/y (0-1) or face, r"),
    "checklist":      ("front",  "Glass list that ticks items one by one.  title, items: [..], every: sec, strike: true, y"),
    "orbit-text":     ("both",   "Words orbit around the head (pass behind it).  text: 'A · B · C', radius, speed"),
    "money-counter":  ("front",  "Number counts up.  from, to, prefix: '₹', suffix, label, count: sec, color, y"),
    "iphone-ui":      ("front",  "iOS notification or toggle.  kind: notification|toggle, app, title, body, icon, when"),
    "news-cut":       ("front",  "Breaking-news look with flash, banner and ticker.  tag, headline, ticker"),
    "freeze-callout": ("front",  "Freeze frame + name label (character intro).  name, sub"),
    "chart":          ("front",  "Bars grow in a glass card.  title, bars: [{label,value}], prefix, suffix, y"),
    "transition":     ("front",  "kind: zoom-punch | zoom-through | whip | shake | glitch | flash | light-leak (dur 0.3-0.6)"),
}
NEEDS_FACE = {"spotlight", "orbit-text", "glass-widgets", "freeze-callout"}
NEEDS_SRC = {"transition", "news-cut"}


def resolve_t(t, words):
    if isinstance(t, (int, float)):
        return float(t)
    s = str(t)
    if not s.startswith("@"):
        return float(s)
    word, off = s[1:], 0.0
    for sign in "+-":
        if sign in word[1:]:
            i = word.rindex(sign); off = float(word[i:]); word = word[:i]; break
    for w in words:
        if awk.word_match(word, w["w"]):
            return max(0.0, w["s"] + off)
    raise SystemExit(f"word '{word}' not heard in the video (check the transcript, or use seconds)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video", nargs="?"); ap.add_argument("--spec"); ap.add_argument("-o", "--out")
    ap.add_argument("--lang", default="hi"); ap.add_argument("--fast-matte", action="store_true")
    ap.add_argument("--preview", type=float, help="only render stills at this second")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    if a.list or not a.video:
        for k, (layer, doc) in FX_DOC.items():
            print(f"  {k:15s} [{layer:6s}] {doc}")
        return
    src = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "_fx.mp4")
    cues = json.loads(Path(a.spec).read_text())
    w, h = awk.video_size(src); dur = awk.duration(src)

    words = None
    for c in cues:
        if c["fx"] not in FX_DOC:
            raise SystemExit(f"unknown effect '{c['fx']}'. Run --list")
        if isinstance(c["t"], str) and c["t"].startswith("@"):
            words = words or awk.transcribe(src, a.lang)
        c["t"] = round(resolve_t(c["t"], words), 3)
        c["dur"] = float(c.get("dur", 2.5))
        c.setdefault("props", {})
    cues.sort(key=lambda c: c["t"])

    behind = any(FX_DOC[c["fx"]][0] in ("behind", "both") for c in cues)
    need_face = behind or any(c["fx"] in NEEDS_FACE for c in cues)
    mask = faces = None
    if need_face:
        mask, faces_json = awk.vision(src, a.fast_matte)
        faces = awk.face_track(faces_json, dur)
    staged = awk.stage(src) if any(c["fx"] in NEEDS_SRC for c in cues) else ""
    for c in cues:   # freeze frames: grab the still
        if c["fx"] == "freeze-callout":
            png = awk.STUDIO / "public" / "_in" / f"{src.stem}_freeze_{c['t']:.2f}.png"
            awk.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{c['t']:.3f}", "-i", src, "-frames:v", "1", png])
            c["props"]["still"] = f"_in/{png.name}"

    print(f"{len(cues)} effects: " + ", ".join(f"{c['fx']}@{c['t']:.1f}s" for c in cues))
    base = {"cues": cues, "faces": faces or [], "duration": dur, "width": w, "height": h, "src": staged}
    alpha = ["--codec=prores", "--prores-profile=4444", "--pixel-format=yuva444p10le", "--image-format=png"]
    tmp = out.parent / f".{out.stem}_layers"; tmp.mkdir(exist_ok=True)

    if a.preview is not None:
        frame = int(a.preview * awk.FPS)
        pv = out.with_name(f"{out.stem}_preview_{a.preview:g}.png")
        layers = []
        for layer in (["behind"] if behind else []) + ["front"]:
            lp = tmp / f"{layer}.png"
            pf = awk.STUDIO / "out" / f".props_fx_{layer}.json"; pf.write_text(json.dumps({**base, "layer": layer}, ensure_ascii=False))
            subprocess.run(["npx", "remotion", "still", "src/index.ts", "FxLayer", str(lp), f"--props={pf}", f"--frame={frame}", "--log=error"], cwd=awk.STUDIO, check=True)
            layers.append(lp)
        bg = tmp / "bg.png"; awk.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a.preview), "-i", src, "-frames:v", "1", bg])
        if behind:
            mk = tmp / "mk.png"; awk.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a.preview), "-i", mask, "-frames:v", "1", mk])
            g = "[0][1]overlay[b];[2]format=gray,boxblur=2:1[m];[0][m]alphamerge[fg];[b][fg]overlay[x];[x][3]overlay"
            awk.run(["ffmpeg", "-y", "-loglevel", "error", "-i", bg, "-i", layers[0], "-i", mk, "-i", layers[1], "-filter_complex", g, pv])
        else:
            awk.run(["ffmpeg", "-y", "-loglevel", "error", "-i", bg, "-i", layers[0], "-filter_complex", "[0][1]overlay", pv])
        print("preview:", pv); return

    files = {}
    for layer in (["behind"] if behind else []) + ["front"]:
        if layer == "front" and not any(FX_DOC[c["fx"]][0] in ("front", "both") for c in cues):
            continue
        files[layer] = tmp / f"{layer}.mov"
        awk.remotion_render("FxLayer", files[layer], {**base, "layer": layer}, alpha)
        print("  ✓ layer", layer)

    ins = ["-i", str(src)]; g = []; cur = "[0:v]"
    if "behind" in files:
        ins += ["-i", str(files["behind"]), "-i", str(mask)]
        g += [f"[0:v]split=2[v0][v1]", f"[v0][1:v]overlay=eof_action=pass[b]",
              f"[2:v]format=gray,scale={w}:{h},boxblur=2:1[m]", "[v1][m]alphamerge[fg]", "[b][fg]overlay=eof_action=pass[x]"]
        cur = "[x]"
    if "front" in files:
        idx = len(ins) // 2
        ins += ["-i", str(files["front"])]
        g.append(f"{cur}[{idx}:v]overlay=eof_action=pass[y]"); cur = "[y]"
    if not g:
        raise SystemExit("nothing to render")
    g[-1] = g[-1][: g[-1].rindex("[")] + "[vout]"
    awk.run(["ffmpeg", "-y", "-loglevel", "error", "-stats", *ins, "-filter_complex", ";".join(g), "-map", "[vout]", "-map", "0:a?",
             "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(out)])
    for f in files.values():
        f.unlink(missing_ok=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
