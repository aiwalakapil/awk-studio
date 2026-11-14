#!/bin/bash
# Installs AI Wala Kapil Studio skills into Claude Code (~/.claude/skills) as symlinks.
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p ~/.claude/skills
for d in "$HERE"/skills/awk-*; do
  ln -sfn "$d" ~/.claude/skills/"$(basename "$d")"
  echo "installed $(basename "$d")"
done
command -v ffmpeg >/dev/null || echo "!! install ffmpeg:      brew install ffmpeg"
command -v whisper-cli >/dev/null || echo "!! install whisper.cpp: brew install whisper-cpp"
[ -f "${AWK_WHISPER_MODEL:-$HOME/whisper-models/ggml-large-v3-turbo.bin}" ] || echo "!! download the whisper model to ~/whisper-models/ggml-large-v3-turbo.bin (huggingface.co/ggerganov/whisper.cpp)"
[ -d "$HERE/studio/node_modules" ] || (cd "$HERE/studio" && npm install)
[ -f "$HERE/sfx/pop.wav" ] || python3 "$HERE/sfx/make_sfx.py"
echo "done. Restart Claude Code, then try: /awk-auto-cut"
