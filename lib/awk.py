"""Shared helpers for AI Wala Kapil Studio skills: ffmpeg/whisper wrappers and paths."""
import json, os, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]          # awk-studio/
STUDIO = ROOT / "studio"                             # Remotion project
SFX_DIR = ROOT / "sfx"
VISION = ROOT / "tools" / "awkvision"              # built from tools/awkvision.swift on first use
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


def vision(src, fast=False):
    """Person matte video + face track via tools/awkvision (cached next to the video)."""
    mask = src.with_suffix(src.suffix + ".matte.mp4"); faces = src.with_suffix(src.suffix + ".faces.json")
    if mask.exists() and faces.exists() and mask.stat().st_mtime > src.stat().st_mtime:
        return mask, faces
    if not VISION.exists():
        run(["xcrun", "swiftc", "-O", "-o", VISION, VISION.with_suffix(".swift")])
    print("matte + face track (Apple Vision)…")
    run([VISION, src, mask, faces] + (["--fast"] if fast else []))
    return mask, faces

def face_track(faces_json, dur):
    d = json.loads(Path(faces_json).read_text())
    pts = [(f[0], f[1] + f[3] / 2, f[2] + f[4] / 2, max(f[3], f[4])) for f in d["faces"] if len(f) == 5]
    n = int(dur * FPS) + 1
    if not pts:
        return [None] * n
    out, j = [], 0
    for k in range(n):
        t = k / FPS
        while j + 1 < len(pts) and pts[j + 1][0] <= t:
            j += 1
        a = pts[j]; b = pts[min(j + 1, len(pts) - 1)]
        u = 0 if b[0] == a[0] else max(0.0, min(1.0, (t - a[0]) / (b[0] - a[0])))
        out.append([a[i] + (b[i] - a[i]) * u for i in (1, 2, 3)])
    sm, W = [], 6   # smooth ±0.2 s so things don't jitter
    for k in range(n):
        win = out[max(0, k - W): k + W + 1]
        sm.append([round(sum(v[i] for v in win) / len(win), 1) for i in range(3)])
    return sm



# English creator words that whisper may write in Devanagari (and back)
ALIASES = {
    "link": ["लिंक"], "form": ["फॉर्म", "फार्म"], "free": ["फ्री"], "views": ["व्यूज", "व्यूज़", "व्यू"], "view": ["व्यू"],
    "reel": ["रील"], "reels": ["रील्स"], "video": ["वीडियो"], "comment": ["कमेंट"], "subscribe": ["सब्सक्राइब"],
    "follow": ["फॉलो"], "class": ["क्लास"], "course": ["कोर्स"], "ai": ["एआई"], "money": ["मनी"], "growth": ["ग्रोथ"],
    "bio": ["बायो"], "insta": ["इंस्टा"], "instagram": ["इंस्टाग्राम"], "youtube": ["यूट्यूब"], "claude": ["क्लॉड"],
    "prompt": ["प्रॉम्प्ट"], "caption": ["कैप्शन"], "hook": ["हुक"], "viral": ["वायरल"], "channel": ["चैनल"],
    "dm": ["डीएम"], "step": ["स्टेप"], "editing": ["एडिटिंग"], "edit": ["एडिट"], "content": ["कंटेंट"],
}
_ALIAS_N = {}
for k, vs in ALIASES.items():
    group = {norm(k)} | {norm(v) for v in vs}
    for g in group:
        _ALIAS_N[g] = group


def word_match(target, heard):
    """True if `heard` (from whisper) is the word `target`, in either script."""
    t, h = norm(target), norm(heard)
    if not t or not h:
        return False
    return t == h or h in _ALIAS_N.get(t, ()) or (len(t) > 3 and t in h)


def silences(src, noise_db=-32, min_len=0.3):
    """ffmpeg silencedetect -> [(start, end)] in seconds."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(src), "-vn", "-af",
                        f"silencedetect=noise={noise_db}dB:d={min_len}", "-f", "null", "-"],
                       capture_output=True, text=True, errors="replace")
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    if len(en) < len(st):
        en.append(duration(src))
    return list(zip(st, en))


def speech_threshold(src):
    """Silence threshold that adapts to the recording: loud speech level (80th percentile) minus 18 dB."""
    import array, math
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(src), "-vn", "-ac", "1", "-ar", "8000", "-f", "s16le", "-"],
                         capture_output=True).stdout
    a = array.array("h", pcm); n = 400
    if len(a) < n * 10:
        return -32.0
    db = sorted(20 * math.log10(max(1, math.sqrt(sum(x * x for x in a[i:i + n]) / n)) / 32768) for i in range(0, len(a) - n, n))
    return round(max(-50.0, min(-28.0, db[int(len(db) * 0.8)] - 18)), 1)
