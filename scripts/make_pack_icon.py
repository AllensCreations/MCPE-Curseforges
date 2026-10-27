#!/usr/bin/env python3
"""Turn image1.* inside a pack folder into that pack's pack_icon.png, then delete image1.*.

Looks in MCPEDL/<category>/<project>/behavior_pack/ and .../resource_pack/ (also the
project root). The image is center-cropped to 1:1 and resized to 256x256 (PNG).
"""
import glob, os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 256
EXTS = ("png", "jpg", "jpeg", "webp", "bmp", "gif")

def find_sources():
    found = []
    for ext in EXTS:
        for pat in (f"MCPEDL/*/*/behavior_pack/image1.{ext}",
                    f"MCPEDL/*/*/resource_pack/image1.{ext}",
                    f"MCPEDL/*/*/image1.{ext}"):
            found += glob.glob(os.path.join(ROOT, pat))
            found += glob.glob(os.path.join(ROOT, pat.replace(ext, ext.upper())))
    return sorted(set(found))

def main():
    sources = find_sources()
    if not sources:
        print("No image1.* found. Nothing to do.")
        return 0
    for src in sources:
        folder = os.path.dirname(src)
        dest = os.path.join(folder, "pack_icon.png")
        img = ImageOps.exif_transpose(Image.open(src)).convert("RGBA")
        side = min(img.size)                       # largest centered 1:1 square
        left, top = (img.width - side) // 2, (img.height - side) // 2
        img = img.crop((left, top, left + side, top + side))
        img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
        img.save(dest, "PNG", optimize=True)
        os.remove(src)
        print(f"{os.path.relpath(src, ROOT)} -> {os.path.relpath(dest, ROOT)} (deleted source)")
    return 0

if __name__ == "__main__":
    sys.exit(main())
