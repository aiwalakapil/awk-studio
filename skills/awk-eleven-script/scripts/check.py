#!/usr/bin/env python3
"""Checks a script against the ElevenLabs v4 rules (Hinglish rules) before spending credits.

Usage: check.py script.txt      (or:  echo "..." | check.py -)
Exit code 1 if anything must be fixed.
"""
import re, sys

ROMAN_HINDI = {"hai", "hain", "nahi", "nahin", "kya", "aur", "ke", "ki", "ka", "ko", "se", "mein", "main", "pe", "par",
               "karo", "kar", "ho", "tum", "aap", "yeh", "ye", "woh", "wo", "bhi", "sirf", "ek", "do", "teen", "kaise",
               "kyun", "abhi", "kal", "aaj", "bahut", "accha", "achha", "dekho", "bhejo", "banao", "wala", "wali", "raha",
               "rahe", "rahi", "gaya", "gayi", "tha", "thi", "hoga", "chahiye", "matlab", "isliye", "lekin", "toh", "to"}
TAGS = re.compile(r"\[(excited|serious|warmly|confident|whispers|laughs|sighs|curious|sad|happy|calm)\]", re.I)


def main():
    text = sys.stdin.read() if len(sys.argv) < 2 or sys.argv[1] == "-" else open(sys.argv[1], encoding="utf-8").read()
    text = text.strip()
    problems, notes = [], []

    if "\n" in text:
        problems.append("Line breaks found: keep ONE paragraph (use ' … ' where a new paragraph would go).")
    digits = re.findall(r"\d+", text)
    if digits:
        problems.append(f"Numbers as digits {sorted(set(digits))}: write them as words (Day nine, पाँच).")
    if not re.match(r"\s*\[", text):
        problems.append("No emotion tag at the start: begin with [excited] or [serious].")
    words = re.findall(r"[A-Za-z]+", text)
    roman = sorted({w for w in words if w.lower() in ROMAN_HINDI})
    if len(roman) >= 3:
        problems.append(f"Roman Hindi words {roman[:10]}: write Hindi in Devanagari, keep only English words in English.")
    clean = TAGS.sub("", text)
    sentences = [s.strip() for s in re.split(r"[।?!.]", clean) if s.strip()]
    long = [s for s in sentences if len(s.split()) > 15]
    for s in long:
        problems.append(f"Sentence over 15 words ({len(s.split())}): \"{s[:60]}…\"")
    tags = [t.lower() for t in TAGS.findall(text)]
    if not any(t == "confident" for t in tags):
        notes.append("No [confident] tag: usually used on the CTA / 'kal Day…' line.")

    chars = len(text)
    nwords = len(clean.split())
    secs = nwords / 2.3   # Hinglish narration ≈ 2.3 words/s on Eleven v4
    print(f"characters: {chars} (≈ credits per generation; the ElevenLabs counter is exact)  words: {nwords}  ≈ length: {secs:.0f} s")
    print(f"tags used: {', '.join(tags) or 'none'}")
    if secs > 60:
        notes.append("Over ~60 s: a reel should usually be 25–45 s.")
    for p in problems:
        print("  ✗", p)
    for n in notes:
        print("  •", n)
    if not problems:
        print("  ✓ ready for ElevenLabs (Eleven v4, stability 40–50, similarity 75). Press Generate ONCE.")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
