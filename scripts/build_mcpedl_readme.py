#!/usr/bin/env python3
"""Builds MCPEDL/README.md: every pack grouped by type, with Version, Source, Package and AI review.

Generated file. The Build Changed Packs & Sync Catalogs workflow runs this after the per-pack AI review
files are refreshed. Output has no dates, so an unchanged repo gives an identical file.

The AI review link is the pack's file MCPEDL/AI Review/<Name>.txt. Only files that exist
are linked; a missing one shows "-".

Usage: python3 scripts/build_mcpedl_readme.py [--check] [--root DIR]
  --check  write nothing, exit 1 when MCPEDL/README.md is out of date.
"""
import argparse
import os
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote

CATEGORIES = (("Addons", "Add-ons"), ("Maps", "Maps"), ("Script", "Scripts"), ("Minigame", "Minigames"))
CHANGELOG_TOP = re.compile(r"(?m)^## \[v?(\d+(?:\.\d+){0,2})\]")
RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/"
GITHUB_RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/"


def get_ai_kits(root: Path):
    bedrock_dir = root / "reference" / "bedrock-samples"
    zips = sorted(bedrock_dir.glob("bedrock-reference-pack-*.zip"))
    if zips:
        bundle_path = zips[-1].relative_to(root).as_posix()
        bundle_label = f"Bedrock Reference Bundle ({zips[-1].stem.replace('bedrock-reference-pack-', 'v')})"
    else:
        bundle_path = "reference/bedrock-samples/bedrock-reference-pack.zip"
        bundle_label = "Complete Bedrock Reference Bundle (Samples, Schemas & Types Zip)"

    return (
        ("New Pack Kit (zip: map and scripts)", "MCPEDL/AI Review/New-Pack.zip"),
        ("Update Pack Kit (zip: map and scripts)", "MCPEDL/AI Review/Update-Pack.zip"),
        ("Repo Maintenance Kit (zip: map and scripts)", "MCPEDL/AI Review/Maintenance.zip"),
        ("Vanilla Bedrock Reference (JSON.gz)", "reference/bedrock-samples/bedrock-samples.min.json.gz"),
        (bundle_label, bundle_path),
        ("Minecraft Script API TypeScript Definitions (.d.ts Zip)", "reference/typescript-definitions/minecraft-bedrock-types.zip"),
    )


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


def _norm(v):
    """'6' -> 'v6'; '14.0.1' stays '14.0.1'. Both forms are used in the changelogs."""
    return f"v{v}" if re.fullmatch(r"\d+", v) else v


def _tuple(v):
    parts = [int(x) for x in v.lstrip("v").split(".")]
    return tuple(parts + [0] * (3 - len(parts)))


def pack_version(project):
    """Newest changelog heading (## [v6] or ## [14.0.1]); the Behavior Pack manifest only when there is none."""
    c = project / "CHANGELOG.md"
    if c.is_file():
        m = CHANGELOG_TOP.search(c.read_text(encoding="utf-8", errors="replace"))
        if m:
            return _norm(m.group(1))
    mv = manifest_version(project)
    return _norm(".".join(map(str, mv)).replace(".0.0", "")) if mv else "-"


def manifest_version(project):
    m = project / "behavior_pack" / "manifest.json"
    try:
        v = json.loads(m.read_text(encoding="utf-8"))["header"]["version"]
        return tuple(v) if isinstance(v, list) else None
    except (OSError, ValueError, KeyError, TypeError):
        return None


def version_mismatch(project):
    """Warning text when the changelog's newest version differs from the manifest's, else None."""
    v, mv = pack_version(project), manifest_version(project)
    if v == "-" or mv is None:
        return None
    return None if _tuple(v) == tuple(mv) else f"version mismatch {project.parent.name}/{project.name}: changelog {v}, manifest {'.'.join(map(str, mv))}"


def render(root):
    mcpedl = root / "MCPEDL"
    sections, counts, warnings = [], [], []

    # AI Review Kits section
    kit_rows = ["| Kit | Download |", "| :-- | :-- |"]
    for kit_label, kit_rel in get_ai_kits(root):
        kit_path = root / kit_rel
        if kit_path.is_file():
            kit_rows.append(f"| **{kit_label}** | [Download]({GITHUB_RAW}{quote(kit_rel)}) |")
        else:
            kit_rows.append(f"| **{kit_label}** | *(not yet built)* |")
    ai_kits_section = "## AI Review Kits\n\n" + "\n".join(kit_rows) + "\n"

    for cat, label in CATEGORIES:

        base = mcpedl / cat
        projects = sorted((p for p in base.iterdir() if p.is_dir() and not p.name.startswith(".")),
                          key=lambda p: pack_title(p).lower()) if base.is_dir() else []
        if not projects:
            continue
        counts.append(f"{len(projects)} {label}")
        rows = ["| Pack | Version | Source | Package | AI review |", "| :-- | :-- | :-- | :-- | :-- |"]
        for p in projects:
            review = mcpedl / "AI Review" / f"{p.name}.txt"
            if not review.is_file():
                warnings.append(f"no AI review file for {cat}/{p.name}")
            ai = f"[Download]({RAW}{quote(review.relative_to(root).as_posix())})" if review.is_file() else "-"
            listing = root / "Package" / f"{p.name}.listing.md"
            pkg = f"[Package]({link(mcpedl, listing)})" if listing.is_file() else "-"
            mismatch = version_mismatch(p)
            if mismatch:
                warnings.append(mismatch)
            title = pack_title(p).replace("|", "/")
            rows.append(f"| **{title}** | {pack_version(p)} | [Source]({link(mcpedl, p)}) | {pkg} | {ai} |")
        sections.append(f"## {label}\n\n" + "\n".join(rows) + "\n")
    body = HEADER + ("\n" + " · ".join(counts) + "\n" if counts else "\nNo packs yet.\n")
    body += "\n" + ai_kits_section
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
