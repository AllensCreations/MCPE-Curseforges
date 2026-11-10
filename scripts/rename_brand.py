#!/usr/bin/env python3
"""One-time migration: rename the creator brand across the whole repository.

  python3 scripts/rename_brand.py            # preview
  python3 scripts/rename_brand.py --apply    # write changes

Replaces the exact, case-sensitive text 'ALNStudios' with 'ALNStudios' in text files
(manifests, DESCRIPTION/README/CHANGELOG, LOCK markers, scripts, workflows, docs) and renames
package files whose names contain it. GitHub URLs (github.com/AllensCreations/...) keep the GitHub account name. Lowercase identifiers such as the in-game namespace
'allenscreations:' and the lowercase profile URLs are NOT touched: changing a namespace would
break existing worlds. Pack UUIDs are never touched. The next build regenerates package names
and download links.
"""
import argparse
import os
import re

OLD, NEW = "ALNStudios", "ALNStudios"
PATTERN = re.compile(r"(?<![/\w])" + OLD)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SKIP_DIRS = {".git", "node_modules", "__pycache__"}
BINARY_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".mcpack", ".mcaddon", ".mcworld", ".zip", ".ogg", ".wav", ".mp3", ".fsb", ".ldb", ".log"}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    edited, renamed = [], []
    for root, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            path = os.path.join(root, name)
            if os.path.splitext(name)[1].lower() not in BINARY_EXT:
                try:
                    with open(path, encoding="utf-8", newline="") as fh:
                        text = fh.read()
                except (UnicodeDecodeError, OSError):
                    text = None
                if text is not None and PATTERN.search(text):
                    edited.append(os.path.relpath(path, ROOT))
                    if args.apply:
                        with open(path, "w", encoding="utf-8", newline="") as fh:
                            fh.write(PATTERN.sub(NEW, text))
            if OLD in name:
                renamed.append(os.path.relpath(path, ROOT))
                if args.apply:
                    os.replace(path, os.path.join(root, name.replace(OLD, NEW)))
    verb = "Updated" if args.apply else "Would update"
    for item in edited:
        print(f"{verb}: {item}")
    for item in renamed:
        print(f"{'Renamed' if args.apply else 'Would rename'}: {item}")
    print(f"{len(edited)} file(s) with text, {len(renamed)} file name(s).")
    if not args.apply:
        print("Preview only. Re-run with --apply.")


if __name__ == "__main__":
    main()
