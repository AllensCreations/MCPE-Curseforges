#!/usr/bin/env python3
"""Build a database-free test world (.mcworld) for a script or add-on project.

The project's own packs plus the add-ons listed in its test_world.json are installed into a copy
of Mcpeworlds/<mode>. Output: <project folder>/<Display Name> - Test.mcworld

test_world.json: {"mode": "Creative", "include_addons": ["Magnetic-Satchel", "Mining-Helmet"]}
Included add-ons are looked up in MCPEDL/addons/<Name> and MCPEDL/new_addons/<Name>.

Usage:
  python scripts/build_test_world.py --project MCPEDL/script/My-Script
  python scripts/build_test_world.py --all           # every script/add-on that has test_world.json
Structural checks only; never proof that anything works in Minecraft.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_payload as bp  # noqa: E402
from build_oneblock_variants_from_template import (  # noqa: E402  (existing, unchanged world helpers)
    locate_world_root, patch_level_dat, safe_name, validate_database_free_foundation,
)

MODES = bp.MODES


def load(p: Path):
    return json.loads(p.read_text(encoding="utf-8-sig"))


def find_addon(root: Path, name: str) -> Path:
    for d in ("addons", "new_addons"):
        p = root / "MCPEDL" / d / name
        if (p / "behavior_pack" / "manifest.json").is_file() or (p / "resource_pack" / "manifest.json").is_file():
            return p
    raise SystemExit(f"Included add-on '{name}' not found under MCPEDL/addons or MCPEDL/new_addons.")


def collect_packs(root: Path, project: Path, cfg: dict):
    """Return [(label, kind, source_dir, manifest)] for the project first, then each include."""
    sources = [(project.name, project)] + [(n, find_addon(root, n)) for n in cfg.get("include_addons", [])]
    packs = []
    for label, folder in sources:
        for kind in ("behavior_pack", "resource_pack"):
            mp = folder / kind / "manifest.json"
            if mp.is_file():
                packs.append((label, kind, folder / kind, load(mp)))
    uuids = {}
    for label, kind, _, m in packs:
        u = m["header"]["uuid"].lower()
        if u in uuids:
            raise SystemExit(f"Duplicate pack UUID {u} in {label}/{kind} and {uuids[u]}: cannot install both.")
        uuids[u] = f"{label}/{kind}"
    for label, kind, _, m in packs:
        for dep in m.get("dependencies") or []:
            if "uuid" in dep and dep["uuid"].lower() not in uuids:
                raise SystemExit(f"{label}/{kind} depends on pack {dep['uuid']} which is not included in the test world.")
    return packs


def build(root: Path, project: Path) -> Path:
    pj = load(project / "project.json") if (project / "project.json").is_file() else {"name": project.name}
    cfg = load(project / "test_world.json")
    mode = cfg.get("mode", "Creative")
    if mode not in MODES:
        raise SystemExit(f"{project.name}: mode must be one of {MODES}")
    source = root / "Mcpeworlds" / mode
    if not (source / "level.dat").is_file():
        raise SystemExit(f"Missing foundation {source}/level.dat")
    packs = collect_packs(root, project, cfg)
    world_name = f"{pj['name']} - Test"
    out = project / f"{safe_name(world_name)}.mcworld"
    staged = out.with_name(f".{out.name}.building")
    staged.unlink(missing_ok=True)
    notes = []
    with tempfile.TemporaryDirectory(prefix="testworld-") as tmp:
        stage = Path(tmp) / "w"
        stage.mkdir()
        shutil.copytree(source, stage, dirs_exist_ok=True)
        world = locate_world_root(stage)
        validate_database_free_foundation(world, f"{mode} Mcpeworlds foundation")
        for name in ("level.dat", "level.dat_old"):
            if (world / name).is_file():
                patch_level_dat(world / name, world_name)
        (world / "levelname.txt").write_text(world_name, encoding="utf-8")
        for folder in ("behavior_packs", "resource_packs"):
            if (world / folder).exists():
                shutil.rmtree(world / folder)
            (world / folder).mkdir()
        links = {"behavior_pack": [], "resource_pack": []}
        for label, kind, src, m in packs:
            suffix = "BP" if kind == "behavior_pack" else "RP"
            target = world / ("behavior_packs" if kind == "behavior_pack" else "resource_packs") / safe_name(f"{label}_{suffix}")
            shutil.copytree(src, target)
            links[kind].append({"pack_id": m["header"]["uuid"], "version": m["header"]["version"]})
            if any(any(w in str(d.get("version", "")).lower() for w in ("beta", "preview")) for d in m.get("dependencies") or []):
                notes.append(f"{label}/{kind} uses a beta module: the world may need the matching Beta APIs experiment")
        (world / "world_behavior_packs.json").write_text(json.dumps(links["behavior_pack"], indent=2) + "\n", encoding="utf-8")
        if links["resource_pack"]:
            (world / "world_resource_packs.json").write_text(json.dumps(links["resource_pack"], indent=2) + "\n", encoding="utf-8")
        else:
            (world / "world_resource_packs.json").unlink(missing_ok=True)
        with zipfile.ZipFile(staged, "w", zipfile.ZIP_DEFLATED) as z:
            for p in sorted(world.rglob("*")):
                rel = p.relative_to(world).as_posix()
                if p.is_dir():
                    z.writestr(rel.rstrip("/") + "/", "")
                else:
                    z.write(p, rel)
    verify(staged, links)
    staged.replace(out)
    for n in notes:
        print(f"::warning::{n}")
    print(f"Built {out.relative_to(root)} ({out.stat().st_size} bytes) with {len(packs)} pack(s): "
          + ", ".join(sorted({p[0] for p in packs})))
    print("Structural checks only: not tested in game. Experiments/achievement state come from the world foundation and are not verified here.")
    return out


def verify(path: Path, links) -> None:
    with zipfile.ZipFile(path) as z:
        names = set(z.namelist())
        if "level.dat" not in names or "levelname.txt" not in names or "world_behavior_packs.json" not in names:
            raise RuntimeError(f"{path.name}: missing level.dat, levelname.txt or world_behavior_packs.json")
        if any(n.startswith("db/") and not n.endswith("/") and n.split("/")[-1] not in {"CURRENT", "LOCK", "LOG", "LOG.old"}
               and not n.split("/")[-1].startswith("MANIFEST") for n in names) or "db/CURRENT" in names:
            raise RuntimeError(f"{path.name}: contains database data; the foundation must stay database-free")
        for kind, fname in (("behavior_pack", "world_behavior_packs.json"), ("resource_pack", "world_resource_packs.json")):
            if links[kind]:
                got = json.loads(z.read(fname))
                if got != links[kind]:
                    raise RuntimeError(f"{path.name}: {fname} does not match the installed packs")
        count_bp = len({n.split("/")[1] for n in names if n.startswith("behavior_packs/") and n.count("/") >= 2})
        if count_bp != len(links["behavior_pack"]):
            raise RuntimeError(f"{path.name}: expected {len(links['behavior_pack'])} behavior pack folder(s), found {count_bp}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--root", default=str(HERE.parent))
    a = ap.parse_args()
    root = Path(a.root).resolve()
    if a.all:
        projects = sorted(p.parent for d in ("script", "new_addons", "addons") for p in (root / "MCPEDL" / d).glob("*/test_world.json"))
    elif a.project:
        projects = [(root / a.project).resolve()]
    else:
        ap.error("give --project or --all")
    if not projects:
        print("No projects with test_world.json found.")
        return 0
    for p in projects:
        if not (p / "test_world.json").is_file():
            raise SystemExit(f"{p}: needs test_world.json")
        build(root, p)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
