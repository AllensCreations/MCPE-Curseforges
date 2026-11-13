#!/usr/bin/env python3
"""Use a project's CurseForge logo as pack_icon.png for packs that have none.

  CURSEFORGE_API_KEY=... python3 scripts/fetch_curseforge_logo.py --project MCPEDL/Addons/Example --id 123456

Uses the CurseForge Core API (GET /v1/mods/{id} -> data.logo). This key is NOT the upload token: create one
at console.curseforge.com. A pack that already has a pack_icon (or icon/logo source image) is skipped.
Every problem (no key, no logo, network error) is a warning and exit 0, so registration never fails on it.
"""
import argparse
import json
import os
import sys
import tempfile
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_pack_icon as icons

API = "https://api.curseforge.com/v1/mods/{}"
TIMEOUT = 30


def _get(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
        return resp.read()


def logo_url(project_id, key, get=_get):
    data = json.loads(get(API.format(project_id), {"x-api-key": key, "Accept": "application/json"}))
    logo = (data.get("data") or {}).get("logo") or {}
    return logo.get("url") or logo.get("thumbnailUrl") or ""


def packs_needing_icon(project):
    """Pack folders with no pack_icon and no icon/logo source image."""
    out = []
    for name in icons.PACKS:
        folder = Path(project) / name
        if folder.is_dir() and not (folder / "pack_icon.png").is_file() and not icons._find_sources(str(folder)):
            out.append(folder)
    return out


def apply_logo(project, project_id, key, get=_get):
    targets = packs_needing_icon(project)
    if not targets:
        print("[Logo] every pack already has an icon; skipped.")
        return 0
    url = logo_url(project_id, key, get)
    parts = urlparse(url)
    if parts.scheme != "https" or not (parts.hostname or "").endswith("forgecdn.net"):
        print(f"::warning::CurseForge project {project_id} has no usable logo; skipped.")
        return 0
    raw = get(url)
    with tempfile.NamedTemporaryFile(suffix=".img", delete=False) as tmp:
        tmp.write(raw)
    try:
        for folder in targets:
            icons._convert(tmp.name, str(folder / "pack_icon.png"))
            print(f"[Logo] {folder}/pack_icon.png created from the CurseForge logo.")
    finally:
        os.unlink(tmp.name)
    return len(targets)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True)
    parser.add_argument("--id", required=True, dest="project_id")
    args = parser.parse_args()
    key = os.environ.get("CURSEFORGE_API_KEY", "").strip()
    if not key:
        print("::warning::CURSEFORGE_API_KEY is not set; logo skipped.")
        return
    try:
        apply_logo(args.project.strip("/"), args.project_id.strip(), key)
    except (OSError, ValueError, urllib.error.URLError) as exc:
        print(f"::warning::Logo skipped: {exc}")


if __name__ == "__main__":
    main()
