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
    "orbit-text":     ("both",   "Words OR photos orbit the head (pass behind it).  text: 'A · B · C' | images: [paths], size: 0.2, radius, speed"),
    "money-counter":  ("front",  "Number counts up.  from, to, prefix: '₹', suffix, label, count: sec, color, y"),
    "iphone-ui":      ("front",  "iOS notification or toggle.  kind: notification|toggle, app, title, body, icon, when"),
    "news-cut":       ("front",  "Breaking-news look with flash, banner and ticker.  tag, headline, ticker"),
    "freeze-callout": ("front",  "Freeze frame + name label (character intro).  name, sub"),
    "chart":          ("front",  "Bars grow in a glass card.  title, bars: [{label,value}], prefix, suffix, y"),
    "transition":     ("front",  "kind: zoom-punch | zoom-through | whip | shake | glitch | flash | light-leak | zoom-hold (dur 0.3-0.6)"),
    "edit-timeline":  ("front",  "Editing-app timeline with tracks and a moving playhead.  title, tracks, seconds, y"),
    "clone":          ("clone",  "Split into side-by-side panels of the same person, each a moment apart (no overlap).  count: 2 (extra copies), lag: 0.4, crop: 0.62 (width share), bottom: 0.6 (cut above burned-in text), y: 0.2, label, labelY"),
    "photo-3d":       ("front",  "Full-screen 2.5D parallax of a photo (subject cut out automatically).  photo: path, label, direction: 1|-1"),
    "ticker":         ("front",  "Stock-market ticker strip (finance).  items: [{s: 'NIFTY', v: '+0.8%'}], tag: 'LIVE', y: 0.86, speed"),
    "map-flyto":      ("front",  "Fly into a point of any map image and drop a pin (x, y 0-1, zoom, label), OR pins: [{x,y,label}] popping one by one + title.  image: 'world' = built-in world map with pins/target as {lat, lon}"),
}
NEEDS_FACE = {"spotlight", "orbit-text", "glass-widgets", "freeze-callout", "title-behind"}
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


def photo_layers(photo, w, h):
    """Background + cut-out subject PNGs (Apple Vision matte), both cover-cropped to the video size."""
    d = awk.STUDIO / "public" / "_in"; d.mkdir(parents=True, exist_ok=True)
    stem = photo.stem.replace(" ", "_")
    bg, fg = d / f"{stem}_p3d_bg.png", d / f"{stem}_p3d_fg.png"
    if not (bg.exists() and fg.exists()):
        cover = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
        awk.run(["ffmpeg", "-y", "-loglevel", "error", "-i", photo, "-vf", cover, "-frames:v", "1", bg])
        clip = d / f"{stem}_p3d.mp4"
        awk.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", bg, "-t", "0.2", "-r", "30", "-pix_fmt", "yuv420p", clip])
        mask, _ = awk.vision(clip, False)
        awk.run(["ffmpeg", "-y", "-loglevel", "error", "-i", bg, "-i", mask, "-filter_complex",
                 "[1:v]format=gray,boxblur=1:1[m];[0:v][m]alphamerge", "-frames:v", "1", fg])
    return f"_in/{bg.name}", f"_in/{fg.name}"


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
    clones = [c for c in cues if c["fx"] == "clone"]
    need_face = behind or clones or any(c["fx"] in NEEDS_FACE for c in cues)
    mask = faces = None
    if need_face:
        mask, faces_json = awk.vision(src, a.fast_matte)
        faces = awk.face_track(faces_json, dur)
    staged = awk.stage(src) if any(c["fx"] in NEEDS_SRC for c in cues) else ""
    for c in cues:   # local images used by effects -> Remotion public/_in
        pr = c["props"]
        if isinstance(pr.get("images"), list):
            pr["images"] = [awk.stage(Path(x).expanduser().resolve()) for x in pr["images"]]
        if c["fx"] == "map-flyto" and pr.get("image") == "world":
            # built-in public-domain world map; pins / target can be given as lat, lon
            pr["image"], pr["aspect"] = "maps/world.svg", 2000 / 789
            ll = lambda q: {**q, "x": (q["lon"] + 180) / 360, "y": (84 - q["lat"]) / 142} if "lat" in q else q
            pr["pins"] = [ll(q) for q in pr.get("pins", [])]
            if "lat" in pr:
                pr.update({k: v for k, v in ll(pr).items() if k in ("x", "y")})
        elif pr.get("image") and Path(str(pr["image"])).expanduser().exists():
            ip = Path(pr["image"]).expanduser().resolve()
            iw, ih = awk.video_size(ip)
            pr.setdefault("aspect", iw / ih)
            pr["image"] = awk.stage(ip)
        if c["fx"] == "photo-3d":
            pr["bg"], pr["fg"] = photo_layers(Path(pr["photo"]).expanduser().resolve(), w, h)
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
        if layer == "front" and not any(FX_DOC[c["fx"]][0] in ("front", "both") or (c["fx"] == "clone" and c["props"].get("label")) for c in cues):
            continue
        files[layer] = tmp / f"{layer}.mov"
        awk.remotion_render("FxLayer", files[layer], {**base, "layer": layer}, alpha)
        print("  ✓ layer", layer)

    ins = ["-i", str(src)]; g = []; cur = "[vb]"
    matte = "behind" in files or bool(clones)
    # clone = a 3-panel scene: blurred background + N cut-outs of the person, each a moment apart in time, side by side
    panels = []   # (cue, n, x0, cropW)
    for c in clones:
        n = int(c["props"].get("count", 2)) + 1
        i0, i1 = int(c["t"] * awk.FPS), int((c["t"] + c["dur"]) * awk.FPS)
        fx = [f[0] for f in (faces or [])[i0:i1] if f] or [w / 2]
        cx = sum(fx) / len(fx)
        cropW = int(w * float(c["props"].get("crop", 0.62))) // 2 * 2
        x0 = int(max(0, min(w - cropW, cx - cropW / 2)))
        c["_crop_bottom"] = int(h * float(c["props"].get("bottom", 1.0))) // 2 * 2   # <1 skips burned-in boxes below the chest
        panels.append((c, n, x0, cropW))
    nvc = sum(1 + n for _, n, _, _ in panels)
    vs = ["[vb]"] + (["[vcut]"] if matte else []) + [f"[vc{i}]" for i in range(nvc)]
    g.append(f"[0:v]split={len(vs)}{''.join(vs)}" if len(vs) > 1 else "[0:v]null[vb]")
    if "behind" in files:
        ins += ["-i", str(files["behind"])]
        g.append(f"{cur}[{len(ins) // 2 - 1}:v]overlay=eof_action=pass[b]"); cur = "[b]"
    windows = []
    if matte:
        ins += ["-i", str(mask)]
        nm = sum(n for _, n, _, _ in panels)
        ms = ["[mcut]"] + [f"[mc{i}]" for i in range(nm)]
        g.append(f"[{len(ins) // 2 - 1}:v]format=gray,scale={w}:{h},boxblur=2:1" + (f",split={len(ms)}{''.join(ms)}" if len(ms) > 1 else "[mcut]"))
        vi = mi = 0
        for ci, (c, n, x0, cropW) in enumerate(panels):
            t0, t1 = c["t"], c["t"] + c["dur"]
            lag = float(c["props"].get("lag", 0.4))
            pw = (w // n) // 2 * 2
            cb = c["_crop_bottom"]
            ph = int(cb * pw / cropW) // 2 * 2
            fade = cb < h   # soft fade at the cut edge, panels sit higher in the frame
            py = h - ph if not fade else int(h * float(c["props"].get("y", 0.2)))
            g.append(f"[vc{vi}]boxblur=40:4,eq=brightness=-0.18:saturation=0.8[cbg{ci}]"); vi += 1
            scene = f"[cbg{ci}]"
            order = sorted(range(n), key=lambda k: abs(k - (n - 1) / 2), reverse=True)   # centre panel drawn last
            for k in order:
                lagk = abs(k - (n - 1) / 2) * 2 * lag / max(1, n - 1)    # centre = live, sides a moment behind
                fd = f",geq=lum='lum(X,Y)':cb='cb(X,Y)':cr='cr(X,Y)':a='alpha(X,Y)*min(1,(H-Y)/{max(20, ph // 6)})'" if fade else ""
                g.append(f"[vc{vi}][mc{mi}]alphamerge,setpts=PTS+{lagk:.3f}/TB,crop={cropW}:{cb}:{x0}:0,scale={pw}:{ph}{fd}[pn{ci}_{k}]"); vi += 1; mi += 1
                g.append(f"{scene}[pn{ci}_{k}]overlay=x={k * (w // n) + (w // n - pw) // 2}:y={py}:eof_action=pass[sc{ci}_{k}]"); scene = f"[sc{ci}_{k}]"
            g.append(f"{cur}{scene}overlay=eof_action=pass:enable='between(t,{t0:.3f},{t1:.3f})'[k{ci}]"); cur = f"[k{ci}]"
            windows.append((t0, t1))
        g.append("[vcut][mcut]alphamerge[fg]")
        off = "+".join(f"between(t,{a0:.3f},{a1:.3f})" for a0, a1 in windows)
        g.append(f"{cur}[fg]overlay=eof_action=pass" + (f":enable='not({off})'" if windows else "") + "[x]"); cur = "[x]"
    if "front" in files:
        ins += ["-i", str(files["front"])]
        g.append(f"{cur}[{len(ins) // 2 - 1}:v]overlay=eof_action=pass[y]"); cur = "[y]"
    if len(g) == 1:
        raise SystemExit("nothing to render")
    g[-1] = g[-1][: g[-1].rindex("[")] + "[vout]"
    awk.run(["ffmpeg", "-y", "-loglevel", "error", "-stats", *ins, "-filter_complex", ";".join(g), "-map", "[vout]", "-map", "0:a?",
             "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", str(out)])
    for f in files.values():
        f.unlink(missing_ok=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
