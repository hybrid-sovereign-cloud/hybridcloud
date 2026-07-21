#!/usr/bin/env python3
"""Scrub lab-specific hostnames from the tree using patterns in scrub-patterns.txt (gitignored).

Copy scrub-patterns.txt.example to scrub-patterns.txt and list old=new lines.
"""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parents[1]
patterns_file = ROOT / "scripts" / "scrub-patterns.txt"
if not patterns_file.exists():
    print("Missing scripts/scrub-patterns.txt — copy from scrub-patterns.txt.example")
    sys.exit(1)
repls = []
for line in patterns_file.read_text().splitlines():
    if not line or line.startswith("#") or "=" not in line: continue
    old, new = line.split("=", 1)
    repls.append((old, new))
repls.sort(key=lambda x: -len(x[0]))
changed = 0
for path in ROOT.rglob("*"):
    if not path.is_file() or ".git" in path.parts: continue
    if path.name.startswith("scrub-"): continue
    try: text = path.read_text(encoding="utf-8")
    except Exception: continue
    orig = text
    for old, new in repls:
        text = text.replace(old, new)
    if text != orig:
        path.write_text(text)
        changed += 1
        print(path.relative_to(ROOT))
print(f"updated {changed} files")
