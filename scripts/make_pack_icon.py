#!/usr/bin/env python3
"""Turn icon.* inside a pack folder into pack_icon.png, then delete icon.*.

Looks only at the top of MCPEDL/<category>/<project>/behavior_pack/ and
.../resource_pack/. The image is center-cropped to 1:1 and resized to 256x256.
Safe to run every time: does nothing when no icon.* file exists.
"""
import glob, os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 256
EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}

def main():
    n = 0
    for pack in ("behavior_pack", "resource_pack"):
        folder_glob = os.path.join(ROOT, "MCPEDL", "*", "*", pack)
        for folder in sorted(glob.glob(folder_glob)):
            for name in sorted(os.listdir(folder)):
                stem, ext = os.path.splitext(name)
                if stem.lower() != "icon" or ext.lower() not in EXTS:
                    continue
                src = os.path.join(folder, name)
                dest = os.path.join(folder, "pack_icon.png")
                img = ImageOps.exif_transpose(Image.open(src)).convert("RGBA")
                side = min(img.size)
                left, top = (img.width - side) // 2, (img.height - side) // 2
                img = img.crop((left, top, left + side, top + side))
                img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
                img.save(dest, "PNG", optimize=True)
                os.remove(src)
                print(f"[Pack Icon] {os.path.relpath(src, ROOT)} -> {os.path.relpath(dest, ROOT)} (icon deleted)")
                n += 1
    if n == 0:
        print("[Pack Icon] No icon.* files found.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
