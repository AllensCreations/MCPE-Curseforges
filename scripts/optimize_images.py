#!/usr/bin/env python3
import argparse, io, sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MAX_WIDTH = 800
MAX_BYTES = 200 * 1024


def optimize(path, check):
    original = path.read_bytes()
    img = Image.open(io.BytesIO(original))
    needs = img.width > MAX_WIDTH or len(original) > MAX_BYTES
    if check:
        return needs, len(original)
    if not needs:
        return False, len(original)
    img = img.convert("RGB")
    if img.width > MAX_WIDTH:
        img = img.resize((MAX_WIDTH, round(img.height * MAX_WIDTH / img.width)), Image.LANCZOS)
    best = None
    for quality in range(85, 34, -5):
        buf = io.BytesIO()
        img.save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
        best = buf.getvalue()
        if len(best) <= MAX_BYTES:
            break
    path.write_bytes(best)
    return True, len(best)


def main():
    p = argparse.ArgumentParser(description="Auto resize (max 800 px wide) and compress (max 200 KB) JPEG files.")
    p.add_argument("folder", nargs="?", default=str(ROOT / "assets" / "Images"))
    p.add_argument("--check", action="store_true", help="Report only; exit 1 if any image is too wide or too large.")
    args = p.parse_args()
    folder = Path(args.folder)
    files = sorted(f for f in folder.glob("*") if f.suffix.lower() in (".jpg", ".jpeg"))
    if not files:
        print(f"No JPEG files in {folder}", file=sys.stderr)
        return 2
    bad = 0
    for f in files:
        changed, size = optimize(f, args.check)
        bad += changed
        state = "needs optimizing" if args.check and changed else "optimized" if changed else "ok"
        print(f"{state:16} {f.name} {size // 1024} KB")
    return 1 if args.check and bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
