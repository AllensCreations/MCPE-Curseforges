#!/usr/bin/env python3
"""Builds MCPEDL/README.md: every pack grouped by type, with Source, Download pack and AI review links.

Generated file. The mcpedl-readme.yml workflow reruns this on every change under MCPEDL/ or builds/, and after
Build Changed Packs & Sync Catalogs. Output has no dates, so an unchanged repo gives an identical file.

Only links to files that exist are written. A missing file shows "-". Nothing is invented.

Usage: python3 scripts/build_mcpedl_readme.py [--check] [--root DIR]
  --check  write nothing, exit 1 when MCPEDL/README.md is out of date.
"""
import argparse
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote

CATEGORIES = (
    ("Addons", "Add-ons", "available-add-ons"),
    ("Maps", "Maps", "available-maps"),
    ("Script", "Scripts", "available-scripts"),
    ("Minigame", "Minigames", "available-minigames"),
)
PKG_EXT = (".mcaddon", ".mcpack", ".mcworld")
VERSION = re.compile(r"[Vv](\d+)\.(\d+)\.(\d+)")
CHANGELOG_TOP = re.compile(r"(?m)^## \[(\d+\.\d+\.\d+)\]")
REVIEW = re.compile(r"review.*\.zip$", re.I)
SKIP_DIRS = {"versions", "assets", "behavior_pack", "resource_pack", ".git", "node_modules"}
HEADER = (
    "# MCPEDL Catalog\n\n"
    "Generated file. Do not edit by hand: it is rebuilt every time a pack or a build changes.\n"
)


def vkey(name):
    m = VERSION.search(name)
    return tuple(int(x) for x in m.groups()) if m else (0, 0, 0)


def walk(base, deep):
    if not base.is_dir():
        return
    for cur, dirs, files in os.walk(base):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS)
        for f in sorted(files):
            yield Path(cur) / f
        if not deep:
            break


def link(rel_from, target):
    rel = os.path.relpath(target, rel_from).replace(os.sep, "/")
    return "/".join(quote(p) for p in rel.split("/"))


def pack_title(project):
    d = project / "DESCRIPTION.md"
    if d.is_file():
        for line in d.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("# "):
                title = re.split(r"\s[—–-]\s", line[2:].strip(), maxsplit=1)[0].strip()
                title = re.sub(r"\s*\(v\d+\.\d+\.\d+\)\s*$", "", title)
                if title:
                    return title
                break
    return project.name.replace("-", " ").replace("_", " ")


def pack_version(project, packages):
    c = project / "CHANGELOG.md"
    if c.is_file():
        m = CHANGELOG_TOP.search(c.read_text(encoding="utf-8", errors="replace"))
        if m:
            return m.group(1)
    best = max((vkey(p.name) for p in packages), default=(0, 0, 0))
    return ".".join(map(str, best)) if best != (0, 0, 0) else "-"


def find_packages(root, cat, name):
    found = [f for d, deep in ((root / "builds" / name, True), (root / "MCPEDL" / cat / name, True))
             for f in walk(d, deep) if f.suffix.lower() in PKG_EXT]
    newest = {}
    for f in found:
        stem = VERSION.sub("", f.stem).strip(" -_")
        if stem not in newest or vkey(f.name) > vkey(newest[stem].name):
            newest[stem] = f
    return sorted(newest.values(), key=lambda p: p.name.lower())


def find_review(root, cat, name):
    found = [f for d in (root / "builds" / name, root / "MCPEDL" / cat / name)
             for f in walk(d, True) if REVIEW.search(f.name)]
    flat = re.sub(r"[^a-z0-9]", "", name.lower())
    found += [f for f in walk(root / "ai-review", True)
              if f.suffix.lower() == ".zip" and flat and flat in re.sub(r"[^a-z0-9]", "", f.stem.lower())]
    return max(found, key=lambda p: (vkey(p.name), p.name), default=None)


def render(root):
    mcpedl = root / "MCPEDL"
    sections, counts, warnings = [], [], []
    known = set()
    for cat, label, _anchor in CATEGORIES:
        base = mcpedl / cat
        projects = sorted((p for p in base.iterdir() if p.is_dir() and not p.name.startswith(".")),
                          key=lambda p: pack_title(p).lower()) if base.is_dir() else []
        if not projects:
            continue
        counts.append(f"{len(projects)} {label}")
        rows = ["| Pack | Version | Source | Download pack | AI review |", "| :-- | :-- | :-- | :-- | :-- |"]
        for p in projects:
            known.add(p.name)
            pkgs = find_packages(root, cat, p.name)
            review = find_review(root, cat, p.name)
            if not pkgs:
                warnings.append(f"no package file found for {cat}/{p.name}")
            if not review:
                warnings.append(f"no AI review zip found for {cat}/{p.name}")
            source = f"[Source]({link(mcpedl, p)})"
            if len(pkgs) == 1:
                dl = f"[Download ({pkgs[0].suffix.lower()})]({link(mcpedl, pkgs[0])})"
            elif pkgs:
                dl = "<br>".join(f"[{VERSION.sub('', x.stem).strip(' -_') or x.stem} ({x.suffix.lower()})]({link(mcpedl, x)})"
                                 for x in pkgs)
            else:
                dl = "-"
            ai = f"[AI review]({link(mcpedl, review)})" if review else "-"
            title = pack_title(p).replace("|", "/")
            rows.append(f"| **{title}** | {pack_version(p, pkgs)} | {source} | {dl} | {ai} |")
        sections.append(f"## {label}\n\n" + "\n".join(rows) + "\n")
    builds = root / "builds"
    if builds.is_dir():
        for d in sorted(builds.iterdir()):
            if d.is_dir() and d.name not in known:
                warnings.append(f"builds/{d.name} has no project under MCPEDL/ (orphan build folder)")
    body = HEADER + ("\n" + " · ".join(counts) + "\n" if counts else "\nNo packs yet.\n")
    if sections:
        body += "\n" + "\n".join(sections)
    return body, warnings


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    a = ap.parse_args()
    root = Path(a.root).resolve()
    if not (root / "MCPEDL").is_dir():
        print("ERROR: MCPEDL/ folder not found under", root)
        return 1
    body, warnings = render(root)
    for w in warnings:
        print("[WARN]", w)
    out = root / "MCPEDL" / "README.md"
    old = out.read_text(encoding="utf-8") if out.is_file() else None
    if old == body:
        print("MCPEDL/README.md is up to date")
        return 0
    if a.check:
        print("MCPEDL/README.md is out of date: run python3 scripts/build_mcpedl_readme.py")
        return 1
    out.write_text(body, encoding="utf-8", newline="\n")
    print("wrote MCPEDL/README.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
