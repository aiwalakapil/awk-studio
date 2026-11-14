"""Shared helpers for AI Wala Kapil Studio skills: ffmpeg/whisper wrappers and paths."""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # awk-studio/
STUDIO = ROOT / "studio"                             # Remotion project
SFX_DIR = ROOT / "sfx"
MODEL = Path(os.environ.get("AWK_WHISPER_MODEL", "~/whisper-models/ggml-large-v3-turbo.bin")).expanduser()
FPS = 30


def run(cmd, quiet=True):
    """Run a command list; raise with stderr on failure."""
    r = subprocess.run([str(c) for c in cmd], capture_output=True, text=True, errors="replace")
    if r.returncode != 0:
        sys.stderr.write(r.stderr[-3000:])
        raise SystemExit(f"command failed: {cmd[0]}")
    if not quiet:
        print(r.stdout)
    return r.stdout


def duration(path) -> float:
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]).strip())


def video_size(path):
    out = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
               "stream=width,height:stream_side_data=rotation", "-of", "json", path])
    st = json.loads(out)["streams"][0]
    w, h = st["width"], st["height"]
    rot = 0
    for sd in st.get("side_data_list", []) or []:
        rot = int(sd.get("rotation", 0) or 0)
    if abs(rot) == 90:
        w, h = h, w
    return w, h


def has_audio(path) -> bool:
    out = run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", path])
    return bool(out.strip())


def check_tools(*names):
    missing = [n for n in names if not shutil.which(n)]
    if missing:
        raise SystemExit(f"missing tools: {', '.join(missing)} (brew install {' '.join(missing)})")


def transcribe(media, lang="hi", cache=True):
    """Word-level timings via whisper.cpp. Returns [{'w','s','e'}] in seconds.
    Cached next to the media as <name>.words.json."""
    media = Path(media)
    cache_file = media.with_suffix(media.suffix + f".{lang}.words.json")
    if cache and cache_file.exists() and cache_file.stat().st_mtime >= media.stat().st_mtime:
        return json.loads(cache_file.read_text())
    check_tools("whisper-cli", "ffmpeg")
    if not MODEL.exists():
        raise SystemExit(f"whisper model not found at {MODEL} (set AWK_WHISPER_MODEL)")
    tmp = cache_file.with_suffix(".16k.wav")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", media, "-vn", "-ar", "16000", "-ac", "1", tmp])
    base = str(tmp)[:-4]
    run(["whisper-cli", "-m", MODEL, "-l", lang, "-ml", "1", "-sow", "-oj", "-of", base, "-np", "-f", tmp])
    tx = json.loads(Path(base + ".json").read_bytes().decode("utf-8", "replace"))["transcription"]
    words = []
    for t in tx:
        w = t["text"].strip()
        if not w or w.startswith("[") or w.startswith("("):
            continue
        words.append({"w": w, "s": round(t["offsets"]["from"] / 1000, 3), "e": round(t["offsets"]["to"] / 1000, 3)})
    tmp.unlink(missing_ok=True); Path(base + ".json").unlink(missing_ok=True)
    cache_file.write_text(json.dumps(words, ensure_ascii=False))
    return words


def phrases(words, gap=0.6):
    """Group words into phrases split on pauses longer than `gap` seconds."""
    out, cur = [], []
    for w in words:
        if cur and w["s"] - cur[-1]["e"] > gap:
            out.append(cur); cur = []
        cur.append(w)
    if cur:
        out.append(cur)
    return [{"s": p[0]["s"], "e": p[-1]["e"], "words": p, "text": " ".join(x["w"] for x in p)} for p in out]


def norm(w):
    # keep Devanagari vowel signs / virama (they are not \w in Python)
    return re.sub(r"[^\w\u0900-\u0963\u0966-\u097F]", "", w.lower())


def stage(src, name=None):
    """Make a media file visible to Remotion (studio/public/_in/), using an APFS clone (no extra disk)."""
    d = STUDIO / "public" / "_in"; d.mkdir(parents=True, exist_ok=True)
    dst = d / (name or Path(src).name.replace(" ", "_"))
    if not dst.exists() or dst.stat().st_size != Path(src).stat().st_size:
        dst.unlink(missing_ok=True)
        if subprocess.run(["cp", "-c", str(src), str(dst)]).returncode != 0:
            shutil.copy2(src, dst)
    return f"_in/{dst.name}"


def remotion_render(comp, out, props: dict, extra=()):
    props_file = STUDIO / "out" / f".props_{comp}.json"
    props_file.parent.mkdir(parents=True, exist_ok=True)
    props_file.write_text(json.dumps(props, ensure_ascii=False))
    cmd = ["npx", "remotion", "render", "src/index.ts", comp, str(Path(out).resolve()), f"--props={props_file}", "--log=error", *extra]
    r = subprocess.run(cmd, cwd=STUDIO)
    if r.returncode != 0:
        raise SystemExit("remotion render failed")
    return out
