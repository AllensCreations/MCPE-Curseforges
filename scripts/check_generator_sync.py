#!/usr/bin/env python3
"""Fail if the build_payload.py embedded in INSTRUCTIONS.md differs from scripts/build_payload.py.

Usage: python scripts/check_generator_sync.py [--fix]   (--fix rewrites the embedded copy)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MD = ROOT / "INSTRUCTIONS.md"
SRC = ROOT / "scripts" / "build_payload.py"
BLOCK = re.compile(r"(### 8\. `build_payload\.py`.*?```python\n)(.*?)(\n```)", re.S)


def main() -> int:
    if not MD.is_file() or not SRC.is_file():
        print("INSTRUCTIONS.md or scripts/build_payload.py is missing")
        return 1
    text = MD.read_text(encoding="utf-8")
    m = BLOCK.search(text)
    if not m:
        print("Could not find the python block under '### 8. build_payload.py' (Part 4) in INSTRUCTIONS.md")
        return 1
    want = SRC.read_text(encoding="utf-8").rstrip("\n")
    if m.group(2).replace("\r\n", "\n") == want:
        print("OK: embedded script matches scripts/build_payload.py")
        return 0
    if "--fix" in sys.argv:
        MD.write_text(text[:m.start(2)] + want + text[m.end(2):], encoding="utf-8")
        print("Fixed: embedded script rewritten from scripts/build_payload.py")
        return 0
    print("MISMATCH: INSTRUCTIONS.md embeds a different build_payload.py. Run with --fix.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
