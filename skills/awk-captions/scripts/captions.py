#!/usr/bin/env python3
"""Word-by-word highlight captions (Hindi / Hinglish / English).

Usage:
  captions.py VIDEO [-o OUT.mp4] [--lang hi|en|auto] [--script script.txt]
              [--words 3] [--position center|bottom] [--size PX] [--json-only]

--script: the exact script text (any spelling you want on screen: Devanagari, Roman
Hinglish or English). Its words are placed on whisper's timings, so spelling is yours,
timing is whisper's. Without it, whisper's own words are used.
Writes OUT.captions.json (editable) and, unless --json-only, the burned-in video.
Re-run with --from-json to render after hand-editing the JSON.
"""
import argparse, difflib, json, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "lib"))
import awk

BREAK = re.compile(r"[।?,.!…—:;\"]$")


def align(script_words, ww):
    """Put script tokens on whisper word timings (matched where possible, interpolated between)."""
    a = [awk.norm(t) for t in script_words]
    b = [awk.norm(w["w"]) for w in ww]
    times = [None] * len(script_words)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (ww[blk.b + k]["s"], ww[blk.b + k]["e"])
    first, last = (ww[0]["s"], ww[0]["e"]), (ww[-1]["s"], ww[-1]["e"])
    if times[0] is None: times[0] = first
    if times[-1] is None: times[-1] = last
    known = [i for i, t in enumerate(times) if t is not None]
    for i0, i1 in zip(known, known[1:]):
        for k in range(i0 + 1, i1):
            f = (k - i0) / (i1 - i0)
            s = times[i0][1] + (times[i1][0] - times[i0][1]) * f
            times[k] = (s, s + (times[i1][0] - times[i0][1]) / (i1 - i0))
    return [{"w": t, "s": round(times[i][0], 3), "e": round(times[i][1], 3)} for i, t in enumerate(script_words)]


def chunk(words, n):
    chunks, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        gap = words[i + 1]["s"] - w["e"] if i + 1 < len(words) else 9
        if len(cur) >= n or BREAK.search(w["w"]) or gap > 0.35:
            chunks.append(cur); cur = []
    if cur:
        chunks.append(cur)
    out = []
    for c in chunks:
        ws = [{**w, "w": w["w"].strip("।,\"")} for w in c if w["w"].strip("।,\"")]
        if ws:
            out.append({"s": ws[0]["s"], "e": ws[-1]["e"], "text": " ".join(w["w"] for w in ws), "words": ws})
    # no gaps shorter than 0.2s between chunks (avoids flicker)
    for x, y in zip(out, out[1:]):
        if y["s"] - x["e"] < 0.2:
            x["e"] = y["s"]
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video"); ap.add_argument("-o", "--out")
    ap.add_argument("--lang", default="hi"); ap.add_argument("--script")
    ap.add_argument("--words", type=int, default=3, help="max words on screen at once")
    ap.add_argument("--position", default=None, choices=["center", "bottom"])
    ap.add_argument("--size", type=int); ap.add_argument("--json-only", action="store_true")
    ap.add_argument("--from-json", help="skip transcription, render this captions JSON")
    a = ap.parse_args()

    src = Path(a.video).resolve()
    out = Path(a.out).resolve() if a.out else src.with_name(src.stem + "_captions.mp4")
    js = Path(str(out) + ".captions.json")
    w, h = awk.video_size(src)
    dur = awk.duration(src)

    if a.from_json:
        chunks = json.loads(Path(a.from_json).read_text())["chunks"]
    else:
        ww = awk.transcribe(src, a.lang)
        if a.script:
            toks = Path(a.script).read_text().replace("…", "… ").split()
            ww = align(toks, ww)
        chunks = chunk(ww, a.words)
        js.write_text(json.dumps({"video": str(src), "chunks": chunks}, ensure_ascii=False, indent=1))
        print(f"{len(chunks)} caption chunks -> {js}")
        for c in chunks[:8]:
            print(f"  {c['s']:6.2f}  {c['text']}")
    if a.json_only:
        return

    position = a.position or ("center" if h > w else "bottom")
    props = {"src": awk.stage(src), "chunks": chunks, "duration": dur, "width": w, "height": h, "position": position}
    if a.size:
        props["size"] = a.size
    awk.remotion_render("Captions", out, props, ["--crf=18"])
    print("wrote", out)


if __name__ == "__main__":
    main()
