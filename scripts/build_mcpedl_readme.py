#!/usr/bin/env python3
"""Builds MCPEDL/README.md: every pack grouped by type, with Version, Source and AI review.

Generated file. The Build Changed Packs & Sync Catalogs workflow runs this after the per-pack AI review
files are refreshed. Output has no dates, so an unchanged repo gives an identical file.

The AI review link is the pack's own file MCPEDL/<Type>/<Name>/ai-review/<Name>.txt. Only files that exist
are linked; a missing one shows "-".

Usage: python3 scripts/build_mcpedl_readme.py [--check] [--root DIR]
  --check  write nothing, exit 1 when MCPEDL/README.md is out of date.
"""
import argparse
import os
import re
import sys
from pathlib import Path
from urllib.parse import quote

CATEGORIES = (("Addons", "Add-ons"), ("Maps", "Maps"), ("Script", "Scripts"), ("Minigame", "Minigames"))
CHANGELOG_TOP = re.compile(r"(?m)^## \[(\d+\.\d+\.\d+)\]")
RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/"
HEADER = (
    "# MCPEDL Catalog\n\n"
    "Generated file. Do not edit by hand: it is rebuilt with every build.\n"
)


def link(base, target):
    rel = os.path.relpath(target, base).replace(os.sep, "/")
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


def pack_version(project):
    c = project / "CHANGELOG.md"
    if c.is_file():
        m = CHANGELOG_TOP.search(c.read_text(encoding="utf-8", errors="replace"))
        if m:
            return m.group(1)
    return "-"


def render(root):
    mcpedl = root / "MCPEDL"
    sections, counts, warnings = [], [], []
    for cat, label in CATEGORIES:
        base = mcpedl / cat
        projects = sorted((p for p in base.iterdir() if p.is_dir() and not p.name.startswith(".")),
                          key=lambda p: pack_title(p).lower()) if base.is_dir() else []
        if not projects:
            continue
        counts.append(f"{len(projects)} {label}")
        rows = ["| Pack | Version | Source | AI review |", "| :-- | :-- | :-- | :-- |"]
        for p in projects:
            review = p / "ai-review" / f"{p.name}.txt"
            if not review.is_file():
                warnings.append(f"no AI review file for {cat}/{p.name}")
            ai = f"[Download]({RAW}{quote(review.relative_to(root).as_posix())})" if review.is_file() else "-"
            title = pack_title(p).replace("|", "/")
            rows.append(f"| **{title}** | {pack_version(p)} | [Source]({link(mcpedl, p)}) | {ai} |")
        sections.append(f"## {label}\n\n" + "\n".join(rows) + "\n")
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
