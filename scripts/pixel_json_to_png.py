#!/usr/bin/env python3
"""Turn pixel JSON into PNG textures. Standard library only (no Pillow), so it runs in Termux, GitHub and any AI sandbox.

Source: <project>/texture_sources/*.json (never inside resource_pack/). Each file holds an array of textures
(a single object, or {"textures": [...]}, also works):

  {
    "name": "shepherds_pie",              lowercase letters, digits, underscore; becomes <name>.png
    "size": 16,                           16, 32, 64 or 128; pixels must be exactly size x size
    "folder": "items",                    optional: items (default), blocks, or items/<sub> e.g. items/banquet
    "palette": {"0": "#00000000", "1": "#3d2817"},   index -> #RRGGBB or #RRGGBBAA
    "pixels": [[0, 0, 1, ...], ...]       size rows, each with size palette indexes
  }

Output: <project>/resource_pack/textures/<folder>/<name>.png (nearest-neighbor exact pixels, same JSON = same PNG).
Every problem in every file is reported together; nothing is written unless all textures are valid.

Usage
  python3 scripts/pixel_json_to_png.py MCPEDL/Addons/<pack>     convert (also works on a build/<Name> scratch folder)
  python3 scripts/pixel_json_to_png.py <project> --check        validate only
  python3 scripts/pixel_json_to_png.py <project> --preview [FILE]   also write a contact sheet PNG to FILE (default
                                                                 ./pixel_preview.png, OUTSIDE the project so it never ships)
  python3 scripts/pixel_json_to_png.py <project> --input FILE   use this JSON file instead of texture_sources/*.json
Edit the JSON, never the PNG: the PNG is regenerated from it.
"""
from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import zlib
from pathlib import Path

SIZES = (16, 32, 64, 128)
NAME_RE = re.compile(r"^[a-z0-9_]+$")
FOLDER_RE = re.compile(r"^(items|blocks)(/[a-z0-9_]+)*$")
HEX_RE = re.compile(r"^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$")
SOURCE_DIR = "texture_sources"


# ---------------------------------------------------------------- PNG writer (RGBA, 8 bit, filter 0)
def _chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def encode_png(width: int, height: int, rgba_rows: list[bytes]) -> bytes:
    raw = b"".join(b"\x00" + row for row in rgba_rows)
    return (b"\x89PNG\r\n\x1a\n"
            + _chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
            + _chunk(b"IDAT", zlib.compress(raw, 9))
            + _chunk(b"IEND", b""))


# ---------------------------------------------------------------- validation
def parse_color(value) -> tuple[int, int, int, int] | None:
    m = HEX_RE.match(value) if isinstance(value, str) else None
    if not m:
        return None
    rgb = m.group(1)
    alpha = int(m.group(2), 16) if m.group(2) else 255
    return int(rgb[0:2], 16), int(rgb[2:4], 16), int(rgb[4:6], 16), alpha


def textures_in(doc):
    if isinstance(doc, dict) and isinstance(doc.get("textures"), list):
        return doc["textures"]
    if isinstance(doc, dict):
        return [doc]
    return doc if isinstance(doc, list) else None


def validate(tex, where: str) -> tuple[list[str], dict | None]:
    """-> (problems, normalized texture). normalized = name, folder, size, rows (list of list of RGBA tuples), notes."""
    errs: list[str] = []
    if not isinstance(tex, dict):
        return [f"{where}: each texture must be an object"], None
    name = tex.get("name")
    where = f"{where} '{name}'" if isinstance(name, str) else where
    if not isinstance(name, str) or not NAME_RE.match(name):
        errs.append(f"{where}: name must be lowercase letters, digits and underscore only")
    size = tex.get("size")
    if size not in SIZES or isinstance(size, bool):
        errs.append(f"{where}: size must be one of {', '.join(map(str, SIZES))}")
    folder = tex.get("folder", "items")
    if not isinstance(folder, str) or not FOLDER_RE.match(folder):
        errs.append(f"{where}: folder must be items, blocks or items/<name> (lowercase)")
    palette = tex.get("palette")
    colors: dict[int, tuple] = {}
    if not isinstance(palette, dict) or not palette:
        errs.append(f"{where}: palette must be an object like {{\"0\": \"#00000000\"}}")
    else:
        for key, value in palette.items():
            if not (isinstance(key, str) and key.isdigit()):
                errs.append(f"{where}: palette key {key!r} must be a whole number in quotes")
                continue
            rgba = parse_color(value)
            if rgba is None:
                errs.append(f"{where}: palette {key} = {value!r} is not #RRGGBB or #RRGGBBAA")
            else:
                colors[int(key)] = rgba
    pixels = tex.get("pixels")
    rows: list[list[tuple]] = []
    used: set[int] = set()
    if not isinstance(pixels, list):
        errs.append(f"{where}: pixels must be a list of rows")
    elif size in SIZES:
        if len(pixels) != size:
            errs.append(f"{where}: needs {size} rows, found {len(pixels)}")
        for y, row in enumerate(pixels):
            if not isinstance(row, list) or len(row) != size:
                errs.append(f"{where}: row {y} needs {size} values, found {len(row) if isinstance(row, list) else 'a non-list'}")
                continue
            out = []
            for x, idx in enumerate(row):
                if isinstance(idx, str) and idx.isdigit():
                    idx = int(idx)
                if isinstance(idx, bool) or not isinstance(idx, int) or idx not in colors:
                    errs.append(f"{where}: pixel ({x},{y}) uses {row[x]!r}, which is not in the palette")
                    out.append((0, 0, 0, 0))
                else:
                    used.add(idx)
                    out.append(colors[idx])
            rows.append(out)
    if errs:
        return errs, None
    if all(px[3] == 0 for r in rows for px in r):
        return [f"{where}: every pixel is transparent"], None
    unused = sorted(set(colors) - used)
    return [], {"name": name, "folder": folder, "size": size, "rows": rows,
                "notes": [f"{where}: unused palette entries {unused}"] if unused else []}


def load_all(sources: list[Path]):
    """-> (textures, problems, notes) across every source file."""
    textures, problems, notes, seen = [], [], [], {}
    for src in sources:
        label = src.name
        try:
            doc = json.loads(src.read_text(encoding="utf-8-sig"))
        except (OSError, json.JSONDecodeError) as exc:
            problems.append(f"{label}: cannot read JSON ({exc})")
            continue
        items = textures_in(doc)
        if items is None:
            problems.append(f"{label}: expected an array of textures")
            continue
        for i, tex in enumerate(items):
            errs, norm = validate(tex, f"{label}[{i}]")
            problems += errs
            if norm is None:
                continue
            key = (norm["folder"], norm["name"])
            if key in seen:
                problems.append(f"{label}[{i}] '{norm['name']}': duplicate of {seen[key]} (same folder and name)")
                continue
            seen[key] = f"{label}[{i}]"
            notes += norm["notes"]
            textures.append(norm)
    return textures, problems, notes


# ---------------------------------------------------------------- output
def to_png(tex: dict) -> bytes:
    rows = [b"".join(bytes(px) for px in row) for row in tex["rows"]]
    return encode_png(tex["size"], tex["size"], rows)


def preview_png(textures: list[dict], per_row: int = 6, tile: int = 128, gap: int = 12) -> bytes:
    """Contact sheet: every texture scaled to ~tile px over a light/dark checkerboard, for quick human review."""
    cols = min(per_row, max(1, len(textures)))
    rows_n = -(-len(textures) // cols)
    w, h = gap + cols * (tile + gap), gap + rows_n * (tile + gap)
    canvas = [[(38, 38, 42, 255)] * w for _ in range(h)]
    for n, tex in enumerate(textures):
        ox, oy = gap + (n % cols) * (tile + gap), gap + (n // cols) * (tile + gap)
        scale = max(1, tile // tex["size"])
        side = tex["size"] * scale
        for y in range(side):
            for x in range(side):
                r, g, b, a = tex["rows"][y // scale][x // scale]
                bg = 200 if ((x // 8) + (y // 8)) % 2 == 0 else 150
                canvas[oy + y][ox + x] = ((r * a + bg * (255 - a)) // 255, (g * a + bg * (255 - a)) // 255,
                                          (b * a + bg * (255 - a)) // 255, 255)
    return encode_png(w, h, [b"".join(bytes(px) for px in row) for row in canvas])


def find_sources(project: Path, explicit: str | None) -> list[Path]:
    if explicit:
        return [Path(explicit)]
    d = project / SOURCE_DIR
    return sorted(p for p in d.glob("*.json")) if d.is_dir() else []


def run(project: Path, *, check: bool = False, preview: Path | None = None, explicit: str | None = None, log=print) -> int:
    sources = find_sources(project, explicit)
    if not sources:
        log(f"No pixel JSON found (expected {project / SOURCE_DIR}/*.json).")
        return 0
    textures, problems, notes = load_all(sources)
    for n in notes:
        log(f"note   {n}")
    for p in problems:
        log(f"FAIL   {p}")
    if problems:
        log(f"Nothing written: {len(problems)} problem(s) above.")
        return 1
    if check:
        log(f"ok     {len(textures)} texture(s) valid")
        return 0
    base = project / "resource_pack" / "textures"
    for tex in textures:
        target = base / tex["folder"] / f"{tex['name']}.png"
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(to_png(tex))
        log(f"wrote  {target.relative_to(project).as_posix()}  ({tex['size']}x{tex['size']})")
    if preview:
        Path(preview).parent.mkdir(parents=True, exist_ok=True)
        Path(preview).write_bytes(preview_png(textures))
        log(f"wrote  {preview}  (review sheet, not part of the pack)")
    log(f"PIXEL TEXTURES OK: {len(textures)} PNG(s)")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", help="pack folder (repo pack or build/<Name>)")
    ap.add_argument("--check", action="store_true", help="validate only, write nothing")
    ap.add_argument("--preview", nargs="?", const="pixel_preview.png", metavar="FILE",
                    help="also write a contact sheet PNG (default ./pixel_preview.png, outside the project)")
    ap.add_argument("--input", help="use this JSON file instead of texture_sources/*.json")
    a = ap.parse_args(argv)
    project = Path(a.project)
    if not project.is_dir():
        print(f"Project folder not found: {project}")
        return 1
    return run(project, check=a.check, preview=Path(a.preview) if a.preview else None, explicit=a.input)


if __name__ == "__main__":
    sys.exit(main())
