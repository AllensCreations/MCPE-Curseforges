#!/usr/bin/env python3
"""Synchronize live CurseForge status across root README.md, MCPEDL/README.md, and pack READMEs.

Usage:
  python3 scripts/sync_curseforge_status.py [--check] [--root DIR]
"""
import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATEGORIES = (("Addons", "Add-ons"), ("Maps", "Maps"), ("Script", "Scripts"), ("Minigame", "Minigames"))
START_MARKER = "<!-- CURSEFORGE-STATUS:START -->"
END_MARKER = "<!-- CURSEFORGE-STATUS:END -->"


def load_registry(root: Path) -> dict:
    reg_path = root / "builds" / "Curseforge_IDs.json"
    if reg_path.is_file():
        try:
            return json.loads(reg_path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            pass
    return {}


def pack_title(project: Path) -> str:
    desc = project / "DESCRIPTION.md"
    if desc.is_file():
        for line in desc.read_text(encoding="utf-8", errors="replace").splitlines():
            if line.startswith("# "):
                title = re.split(r"\s[—–-]\s", line[2:].strip(), maxsplit=1)[0].strip()
                title = re.sub(r"\s*\(v\d+\.\d+\.\d+\)\s*$", "", title)
                if title:
                    return title
                break
    return project.name.replace("-", " ").replace("_", " ")


def sync_root_readme(root: Path, registry: dict) -> bool:
    readme_path = root / "README.md"
    if not readme_path.is_file():
        return False
    text = readme_path.read_text(encoding="utf-8")

    rows = [
        "| Pack | Category | CurseForge Project | Version | Status |",
        "| :--- | :--- | :---: | :---: | :---: |"
    ]

    published_count = 0
    for cat_slug, cat_label in CATEGORIES:
        cat_dir = root / "MCPEDL" / cat_slug
        if not cat_dir.is_dir():
            continue
        for p in sorted(cat_dir.iterdir(), key=lambda x: pack_title(x).lower()):
            if not p.is_dir() or p.name.startswith("."):
                continue
            key = f"MCPEDL/{cat_slug}/{p.name}"
            entry = registry.get(key)
            if entry and entry.get("last_published_version"):
                published_count += 1
                pid = entry.get("project_id", "")
                ver = entry.get("last_published_version")
                cf_link = f"[{pid}](https://www.curseforge.com/projects/{pid})" if pid else "-"
                title = pack_title(p)
                p_rel = f"MCPEDL/{cat_slug}/{p.name}/README.md"
                rows.append(f"| [**{title}**]({p_rel}) | {cat_label} | {cf_link} | `v{ver}` | 🟢 Published |")

    table_content = f"\n### Published Packs on CurseForge ({published_count})\n\n" + "\n".join(rows) + "\n"

    if START_MARKER in text and END_MARKER in text:
        pattern = re.compile(rf"{re.escape(START_MARKER)}.*?{re.escape(END_MARKER)}", re.DOTALL)
        new_text = pattern.sub(f"{START_MARKER}{table_content}{END_MARKER}", text)
    else:
        insert_marker = "## Guidelines and Attribution"
        if insert_marker in text:
            block = f"## CurseForge Live Status\n{START_MARKER}{table_content}{END_MARKER}\n\n{insert_marker}"
            new_text = text.replace(insert_marker, block, 1)
        else:
            new_text = text.rstrip() + f"\n\n## CurseForge Live Status\n{START_MARKER}{table_content}{END_MARKER}\n"

    if new_text != text:
        readme_path.write_text(new_text, encoding="utf-8")
        return True
    return False


def sync_pack_readmes(root: Path, registry: dict) -> int:
    changed = 0
    for cat_slug, cat_label in CATEGORIES:
        cat_dir = root / "MCPEDL" / cat_slug
        if not cat_dir.is_dir():
            continue
        for p in cat_dir.iterdir():
            if not p.is_dir() or p.name.startswith("."):
                continue
            readme = p / "README.md"
            if not readme.is_file():
                continue
            text = readme.read_text(encoding="utf-8")
            key = f"MCPEDL/{cat_slug}/{p.name}"
            entry = registry.get(key)

            badge_start = "<!-- CURSEFORGE-BADGE:START -->"
            badge_end = "<!-- CURSEFORGE-BADGE:END -->"

            if entry and entry.get("last_published_version"):
                pid = entry.get("project_id", "")
                ver = entry.get("last_published_version")
                badge = (
                    f"{badge_start}\n"
                    f"[![CurseForge](https://img.shields.io/badge/CurseForge-v{ver}-orange?style=flat-square&logo=curseforge)](https://www.curseforge.com/projects/{pid})\n"
                    f"{badge_end}"
                )
            else:
                badge = (
                    f"{badge_start}\n"
                    f"[![CurseForge](https://img.shields.io/badge/CurseForge-Not%20Published-lightgrey?style=flat-square&logo=curseforge)](https://www.curseforge.com/members/allenscreations/projects)\n"
                    f"{badge_end}"
                )

            if badge_start in text and badge_end in text:
                pattern = re.compile(rf"{re.escape(badge_start)}.*?{re.escape(badge_end)}", re.DOTALL)
                new_text = pattern.sub(badge, text)
            else:
                lines = text.splitlines()
                if lines and lines[0].startswith("# "):
                    lines.insert(1, "\n" + badge)
                    new_text = "\n".join(lines) + ("\n" if text.endswith("\n") else "")
                else:
                    new_text = badge + "\n\n" + text

            if new_text != text:
                readme.write_text(new_text, encoding="utf-8")
                changed += 1
    return changed


def sync_mcpedl_readme(root: Path) -> bool:
    try:
        from scripts.build_mcpedl_readme import render
    except ImportError:
        import sys
        sys.path.insert(0, str(root / "scripts"))
        from build_mcpedl_readme import render

    body, warnings = render(root)
    out = root / "MCPEDL" / "README.md"
    old = out.read_text(encoding="utf-8") if out.is_file() else None
    if old != body:
        out.write_text(body, encoding="utf-8", newline="\n")
        return True
    return False


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=str(ROOT))
    args = parser.parse_args()
    root = Path(args.root).resolve()
    reg = load_registry(root)
    root_changed = sync_root_readme(root, reg)
    pack_changed = sync_pack_readmes(root, reg)
    mcpedl_changed = sync_mcpedl_readme(root)
    print(
        f"Synced CurseForge status: Root README {'updated' if root_changed else 'unchanged'}, "
        f"MCPEDL README {'updated' if mcpedl_changed else 'unchanged'}, "
        f"{pack_changed} pack README(s) updated."
    )


if __name__ == "__main__":
    main()
