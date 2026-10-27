#!/usr/bin/env python3
"""Guarantee every pack has a valid pack_icon.png (256x256 PNG, pack root).

Used two ways:
  * CLI (refresh workflow):  python3 scripts/make_pack_icon.py [--strict]
  * Imported by auto_bump_and_build.py so EVERY build gets the icon, not only
    the "Refresh Add-ons and Rebuild Packs" workflow.

Source lookup inside each behavior_pack/ and resource_pack/ (top level only,
case-insensitive): pack_icon.*, icon.*, logo.* in png/jpg/jpeg/webp/bmp/gif.
Fallbacks when a pack has none: the sibling pack's pack_icon.png, then an
icon image at the project root. Leftover source files are deleted after
conversion. Packs that still have no icon are reported loudly.
"""
import glob, os, sys
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 256
EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"}
STEMS = ["pack_icon", "packicon", "icon", "logo"]   # priority order
PACKS = ("behavior_pack", "resource_pack")


def _norm(stem):
    return stem.lower().replace(" ", "_").replace("-", "_")


def _find_sources(folder):
    found = []
    for name in os.listdir(folder):
        stem, ext = os.path.splitext(name)
        if ext.lower() in EXTS and _norm(stem) in STEMS and name != "pack_icon.png":
            found.append(name)
    return sorted(found, key=lambda n: (STEMS.index(_norm(os.path.splitext(n)[0])), n))


def _convert(src, dest):
    img = ImageOps.exif_transpose(Image.open(src)).convert("RGBA")
    side = min(img.size)
    left, top = (img.width - side) // 2, (img.height - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    tmp = dest + ".tmp"
    img.save(tmp, "PNG", optimize=True)
    os.replace(tmp, dest)


def _rel(p):
    return os.path.relpath(p, ROOT)


def ensure_pack_icon(pack_dir, fallbacks=(), warn=True):
    """Return True when pack_dir ends up with a usable pack_icon.png."""
    dest = os.path.join(pack_dir, "pack_icon.png")
    sources = _find_sources(pack_dir)
    try:
        if sources:
            _convert(os.path.join(pack_dir, sources[0]), dest)
            for s in sources:
                os.remove(os.path.join(pack_dir, s))
            print(f"[Pack Icon] {_rel(pack_dir)}/{sources[0]} -> pack_icon.png (sources removed: {len(sources)})")
            return True
        if os.path.isfile(dest):
            with Image.open(dest) as im:
                w, h = im.size
            if w != h or w > SIZE:
                _convert(dest, dest)
                print(f"[Pack Icon] {_rel(dest)} normalized to {SIZE}x{SIZE}")
            return True
        for fb in fallbacks:
            if os.path.isfile(fb):
                _convert(fb, dest)
                print(f"[Pack Icon] {_rel(dest)} created from {_rel(fb)}")
                return True
    except Exception as exc:  # corrupt image etc.
        print(f"[Pack Icon] ERROR in {_rel(pack_dir)}: {exc}", file=sys.stderr)
        return False
    if warn:
        print(f"[Pack Icon] WARNING: {_rel(pack_dir)} has NO pack_icon.png "
              f"(add icon.png next to manifest.json)", file=sys.stderr)
    return False


def ensure_project_icons(project_path):
    """Handle both packs of one project. Returns list of pack dirs still missing an icon."""
    dirs = {p: os.path.join(project_path, p) for p in PACKS}
    present = [p for p in PACKS if os.path.isdir(dirs[p])]
    project_srcs = []
    if os.path.isdir(project_path):
        project_srcs = [os.path.join(project_path, n) for n in _find_sources(project_path)]
        pi = os.path.join(project_path, "pack_icon.png")
        if os.path.isfile(pi):
            project_srcs.insert(0, pi)
    missing = []
    # first pass: packs that have their own icon; second pass: fill gaps from siblings
    done = {p: ensure_pack_icon(dirs[p], fallbacks=project_srcs, warn=False) for p in present}
    for p in present:
        if not done[p]:
            sib = [os.path.join(dirs[q], "pack_icon.png") for q in present if q != p]
            if not ensure_pack_icon(dirs[p], fallbacks=sib):
                missing.append(dirs[p])
    return missing


def main():
    strict = "--strict" in sys.argv
    missing, n = [], 0
    for project in sorted(glob.glob(os.path.join(ROOT, "MCPEDL", "*", "*"))):
        if not os.path.isdir(project):
            continue
        if any(os.path.isdir(os.path.join(project, p)) for p in PACKS):
            n += 1
            missing += ensure_project_icons(project)
    print(f"[Pack Icon] checked {n} project(s); {len(missing)} pack(s) without icon.")
    return 1 if (strict and missing) else 0


if __name__ == "__main__":
    sys.exit(main())
