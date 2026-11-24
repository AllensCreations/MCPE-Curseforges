#!/usr/bin/env python3
"""Builds MCPEDL/README.md: every pack grouped by type, with Version, Status, Source, Package and AI review.

Generated file. The Build Changed Packs & Sync Catalogs workflow runs this after the per-pack AI review
files are refreshed. Output has no dates, so an unchanged repo gives an identical file.

The AI review link is the pack's versioned zip MCPEDL/AI Review/<Name>-<version>.zip which contains the
review <Name>.txt and a files/scripts/ folder with make_update_script.py, apply_update.py and helpers.
Only zips that exist are linked; a missing one shows "-".

Usage: python3 scripts/build_mcpedl_readme.py [--check] [--root DIR]
  --check  write nothing, exit 1 when MCPEDL/README.md is out of date.
"""
import argparse
import os
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import quote

CATEGORIES = (("Addons", "Add-ons"), ("Maps", "Maps"), ("Script", "Scripts"), ("Minigame", "Minigames"))
CHANGELOG_TOP = re.compile(r"(?m)^## \[v?(\d+(?:\.\d+){0,2})\]")
RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/"
GITHUB_RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/"


def file_exists_in_repo(root: Path, rel_path: str) -> bool:
    target = root / rel_path
    if target.is_file():
        return True
    try:
        res = subprocess.run(
            ["git", "-C", str(root), "ls-files", "--error-unmatch", rel_path],
            capture_output=True,
            text=True,
        )
        return res.returncode == 0
    except Exception:
        return False


def get_ai_kits(root: Path):
    bedrock_dir = root / "reference" / "bedrock-samples"
    zips = sorted(bedrock_dir.glob("bedrock-reference-pack-*.zip"))
    if not zips:
        try:
            res = subprocess.run(
                ["git", "-C", str(root), "ls-files", "reference/bedrock-samples/bedrock-reference-pack-*.zip"],
                capture_output=True,
                text=True,
            )
            if res.returncode == 0 and res.stdout.strip():
                zips = [root / p for p in res.stdout.strip().splitlines()]
        except Exception:
            pass
    if zips:
        bundle_path = zips[-1].relative_to(root).as_posix()
        bundle_label = f"Bedrock Reference Bundle ({zips[-1].stem.replace('bedrock-reference-pack-', 'v')})"
    else:
        bundle_path = "reference/bedrock-samples/bedrock-reference-pack.zip"
        bundle_label = "Complete Bedrock Reference Bundle (Samples, Schemas & Types Zip)"

    return (
        ("New Pack Kit (zip: map and scripts)", "MCPEDL/AI Review/New-Pack.zip"),
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


def pack_status(root: Path, cat: str, project_name: str, current_ver: str, registry: dict):
    key = f"MCPEDL/{cat}/{project_name}"
    entry = registry.get(key)
    if not entry or not entry.get("last_published_version"):
        return "⚪ Not Published"

    pid = entry.get("project_id", "")
    pub_v = _norm(str(entry["last_published_version"]))
    link_text = f"[{pub_v}](https://www.curseforge.com/projects/{pid})" if pid else pub_v
    if current_ver != "-" and _tuple(current_ver) > _tuple(pub_v):
        return f"🟡 Update Ready ({link_text} → {current_ver})"
    return f"🟢 Published ({link_text})"


def render(root):
    mcpedl = root / "MCPEDL"
    sections, counts, warnings = [], [], []

    registry_path = root / "builds" / "Curseforge_IDs.json"
    registry = {}
    if registry_path.is_file():
        try:
            registry = json.loads(registry_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            registry = {}

    # AI Review Kits section
    kit_rows = ["| Kit | Download |", "| :-- | :-- |"]
    for kit_label, kit_rel in get_ai_kits(root):
        if file_exists_in_repo(root, kit_rel):
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
        rows = ["| Pack | Version | Status | Source | Package | AI review |", "| :-- | :-- | :-- | :-- | :-- | :-- |"]
        for p in projects:
            ver = pack_version(p)
            status = pack_status(root, cat, p.name, ver, registry)
            review_txt = mcpedl / "AI Review" / f"{p.name}.txt"
            # Find versioned zip: <Name>-<ver>.zip; fall back to unversioned <Name>.zip
            review_zips = sorted((mcpedl / "AI Review").glob(f"{p.name}-*.zip"))
            review_zip = review_zips[-1] if review_zips else mcpedl / "AI Review" / f"{p.name}.zip"
            if not review_txt.is_file():
                warnings.append(f"no AI review file for {cat}/{p.name}")
            ai = f"[Download]({RAW}{quote(review_zip.relative_to(root).as_posix())})" if review_zip.is_file() else "-"
            listing = root / "Package" / f"{p.name}.listing.md"
            pkg = f"[Package]({link(mcpedl, listing)})" if listing.is_file() else "-"
            mismatch = version_mismatch(p)
            if mismatch:
                warnings.append(mismatch)
            title = pack_title(p).replace("|", "/")
            rows.append(f"| **{title}** | {ver} | {status} | [Source]({link(mcpedl, p)}) | {pkg} | {ai} |")
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
