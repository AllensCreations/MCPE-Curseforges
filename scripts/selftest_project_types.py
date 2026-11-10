#!/usr/bin/env python3
"""End-to-end self-test of the addon / map / script pipeline, in a throwaway copy of the repo.

Builds a sample payload of each type with scripts/build_payload.py, imports it with
scripts/import_project_payload.py, builds the test world (scripts/build_test_world.py) and the
OneBlock worlds (existing builder), then proves that broken payloads are rejected.
Uses the real Mcpeworlds/<mode> foundations when present; use --fake-foundation to fabricate
minimal ones (only for sandbox runs). Structural only: no Minecraft involved.

Usage: python scripts/selftest_project_types.py [--fake-foundation]
"""
from __future__ import annotations

import argparse
import base64
import importlib.util
import io
import json
import os
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
PY = sys.executable
results: list[tuple[bool, str]] = []


def ok(cond: bool, label: str) -> None:
    results.append((bool(cond), label))
    print(("PASS  " if cond else "FAIL  ") + label)


def run(args, cwd, env=None, expect=0):
    e = dict(os.environ)
    e.update(env or {})
    r = subprocess.run([PY, *args], cwd=cwd, capture_output=True, text=True, env=e)
    return r.returncode, (r.stdout + r.stderr)


def fake_level_dat(path: Path, name: str) -> None:
    tag = b"\x08" + struct.pack("<H", 9) + b"LevelName" + struct.pack("<H", len(name)) + name.encode()
    body = b"\x0a\x00\x00" + tag + b"\x00"
    path.write_bytes(struct.pack("<II", 10, len(body)) + body)


def manifest(name, kind, rp_uuid=None, script=False, ui=False):
    v = [1, 0, 0]
    m = {"format_version": 2,
         "header": {"name": f"{name} (v1.0.0)", "description": "Sample. by ALNStudios", "uuid": str(uuid.uuid4()),
                    "version": v, "min_engine_version": [1, 21, 0]},
         "modules": [{"type": "data" if kind == "bp" else "resources", "uuid": str(uuid.uuid4()), "version": v}],
         "metadata": {"authors": ["ALNStudios"]}}
    if kind == "bp":
        deps = []
        if rp_uuid:
            deps.append({"uuid": rp_uuid, "version": v})
        if script:
            m["modules"].append({"type": "script", "language": "javascript", "uuid": str(uuid.uuid4()), "version": v, "entry": "scripts/main.js"})
            deps.append({"module_name": "@minecraft/server", "version": "0.0.0-sample"})
        if ui:
            deps.append({"module_name": "@minecraft/server-ui", "version": "0.0.0-sample"})
        if deps:
            m["dependencies"] = deps
    return m


MAIN_JS = r'''import { world } from "@minecraft/server";
import { registerController, endGame } from "./controller.js";

function win() {
  world.sendMessage("You won.");
  endGame();
}

registerController({
  title: "Sample Game",
  gameInfo: "Type: Challenge\nPlayers: 1 or more\nGoal: Replace this text with a short description of the game.",
  howToPlay: "Goal: replace this text.\nControls: replace this text.\nHow it ends: replace this text.",
  onStart: () => {
    world.sendMessage("Game started.");
  },
  onEnd: () => {
    world.sendMessage("Game ended.");
  },
});
'''
DOCS = {"README.md": "# X\nSource created, not tested in game.\nLikely achievement-friendly.\nNo experiment requirement detected in the inspected files.\n",
        "DESCRIPTION.md": "# X\nPlayer text.\nThis is an unofficial community creation. It is not an official Minecraft product.\n", "CHANGELOG.md": "# Changelog\n---\n\n## [1.0.0] - 2026-01-01\n\n### Added\n- First version.\n"}


def write(p: Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def sample(root: Path, ptype: str, name: str, **kw) -> Path:
    d = root / "build" / name
    shutil.rmtree(d, ignore_errors=True)
    import doc_template as dtp
    for f, t in dtp.compliant_docs(ptype, name.replace("-", " "), "1.0.0").items():
        write(d / f, t)
    pj = {"type": ptype, "name": name.replace("-", " ")}
    if kw.get("controller") is False:
        pj["controller"] = False
    write(d / "project.json", json.dumps(pj))
    rp = manifest(name, "rp")
    needs_rp = ptype in ("map", "minigame") or kw.get("with_rp")
    script = ptype in ("script", "minigame") or kw.get("script", False)
    bpm = manifest(name, "bp", rp["header"]["uuid"] if needs_rp else None, script=script, ui=ptype == "minigame")
    write(d / "behavior_pack/manifest.json", json.dumps(bpm))
    if needs_rp:
        write(d / "resource_pack/manifest.json", json.dumps(rp))
    if script:
        write(d / "behavior_pack/scripts/main.js", MAIN_JS)
    if ptype == "map":
        write(d / "behavior_pack/functions/tick.json", json.dumps({"values": ["void_cleaner", "oneblock_tick"]}))
        write(d / "behavior_pack/functions/void_cleaner.mcfunction", "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air\nsetblock 0 -1 0 bedrock\nexecute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned\n")
        write(d / "behavior_pack/functions/oneblock_tick.mcfunction", "scoreboard objectives add sample dummy\n")
        write(d / "behavior_pack/functions/oneblock_setup.mcfunction", "scoreboard objectives add sample dummy\n")
    if ptype in ("script", "minigame"):
        write(d / "test_world.json", json.dumps({"mode": "Creative", "include_addons": kw.get("include", [])}))
    return d


def build_payload(root: Path, d: Path):
    out = root / "MCPEDL" / "incoming" / f"{d.name}.b64"
    out.parent.mkdir(parents=True, exist_ok=True)
    return run([str(root / "scripts/build_payload.py"), str(d), "--out", str(out)], root), out


def do_import(root: Path, d: Path, out: Path, overwrite=False):
    args = [str(root / "scripts/import_project_payload.py"), "--name", d.name, "--payload-file", f"MCPEDL/incoming/{out.name}"]
    return run(args + (["--overwrite"] if overwrite else []), root)


def main() -> int:
    import remake_docs
    import doc_template
    profile_urls = (remake_docs.CF_URL, remake_docs.MP_URL)
    duplicate_profiles = (
        "# Sample\n\n## Creator Profiles\n\n"
        f"- [CurseForge Profile]({profile_urls[0]})\n"
        f"- [MCPEDL Profile]({profile_urls[1]})\n\n"
        "## Creator and Permissions\n\n- Creator: ALNStudios\n"
        f"- Profiles: [CurseForge Profile]({profile_urls[0]}) · "
        f"[MCPEDL Profile]({profile_urls[1]})\n\n"
        "## Search & Discovery Keywords\n\nMinecraft Bedrock, Sample.\n"
    )
    standardized = remake_docs.standardize_description(
        duplicate_profiles, "Sample", "1.0.0", "1.21.0", [], "selftest", addon=True
    )
    standardized_badge_errors = []
    doc_template.check_description_badges(standardized, standardized_badge_errors)
    ok(
        all(standardized.count(f"]({url})") == 1 for url in profile_urls)  # markdown links once; the listing images add <a href> copies
        and not standardized_badge_errors
        and "- Achievements: Likely achievement-friendly." in standardized,
        "description: standardization applies profile, badge, and achievement policy",
    )
    hero_images = (
        "\n[![CurseForge — Sample](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/sample-curseforge.jpg)]"
        "(https://www.curseforge.com/minecraft/mc-mods/sample)\n"
        "[![MCPEDL — Sample](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/sample-mcpedl.jpg)]"
        "(https://mcpedl.com/sample/)\n"
    )
    for ptype in ("addon", "map", "script", "minigame"):
        description = doc_template.compliant_docs(ptype, "Sample Pack", "1.0.0")["DESCRIPTION.md"]
        badge_errors = []
        doc_template.check_description_badges(description, badge_errors)
        has_expected_achievement_label = ptype != "addon" or (
            "- Achievements: Likely achievement-friendly." in description
        )
        ok(
            not badge_errors
            and has_expected_achievement_label
            and description.count("\n\n\n") == 0,
            f"description: {ptype} template applies badge and achievement policy",
        )

    ap = argparse.ArgumentParser()
    ap.add_argument("--fake-foundation", action="store_true")
    a = ap.parse_args()
    with tempfile.TemporaryDirectory(prefix="selftest-") as tmp:
        root = Path(tmp)
        shutil.copytree(REPO / "scripts", root / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copytree(REPO / "Mcpeworlds" / "assets", root / "Mcpeworlds" / "assets")
        spec = importlib.util.spec_from_file_location("selftest_auto_bump", root / "scripts/auto_bump_and_build.py")
        pack_builder = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(pack_builder)
        sys.path.insert(0, str(root / "scripts"))
        upload_spec = importlib.util.spec_from_file_location(
            "selftest_prepare_curseforge_upload",
            root / "scripts/prepare_curseforge_upload.py",
        )
        uploader = importlib.util.module_from_spec(upload_spec)
        upload_spec.loader.exec_module(uploader)
        uploader.REPO_ROOT = root
        uploader.builder.REPO_ROOT = str(root)

        image_project = sample(root, "addon", "Description-Image-Test")
        image_description = image_project / "DESCRIPTION.md"
        image_description.write_text(
            image_description.read_text(encoding="utf-8").replace(
                "## Creator and Permissions", "## Creator and Permissions\n" + hero_images
            ),
            encoding="utf-8",
        )
        image_errors = doc_template.check_docs(image_project, "addon")
        image_notices = []
        remake_docs.style_report(image_description, image_notices, "image-test")
        ok(not image_errors and not image_notices,
           "description: clickable platform listing images pass validation and style checks")

        generated_source = sample(root, "addon", "Description-Template-Test")
        generated_project = root / "MCPEDL/Addons/Description-Template-Test"
        generated_project.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(generated_source, generated_project)
        (generated_project / "DESCRIPTION.md").unlink()
        remake_docs.crs.REPO_ROOT = str(root)
        remake_docs.crs.auto_generate_readme(str(generated_project))
        generated_errors = []
        generated_text = (generated_project / "DESCRIPTION.md").read_text(encoding="utf-8")
        doc_template.check_description(
            generated_text, doc_template.manifest_version(generated_project), generated_errors
        )
        doc_template.check_description_badges(generated_text, generated_errors)
        ok(
            not generated_errors
            and "**A player-focused Minecraft Bedrock add-on.**" in generated_text
            and "> Description-Template-Test adds gameplay behavior" in generated_text,
            "description: auto-generation follows the player-focused template",
        )

        upload_source = sample(root, "addon", "Curseforge-Test")
        upload_project = root / "MCPEDL/Addons/Curseforge-Test"
        upload_project.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(upload_source, upload_project)
        uploader.save_info("MCPEDL/Addons/Curseforge-Test", "1742470")
        package, _, project_id, info_path, changed_manifests, version = uploader.prepare(
            "MCPEDL/Addons/Curseforge-Test", "beta"
        )
        saved = json.loads(info_path.read_text(encoding="utf-8"))["MCPEDL/Addons/Curseforge-Test"]
        ok(
            package.is_file()
            and package.suffix == ".mcaddon"
            and project_id == "1742470"
            and saved["project_id"] == "1742470"
            and version == "1.1.0"  # all project versions use X.Y.Z
            and bool(changed_manifests)
            and json.loads((upload_project / "behavior_pack/manifest.json").read_text())["header"][
                "version"
            ] == [1, 1, 0],
            "CurseForge: Beta increments the minor generation and syncs manifests to X.Y.Z",
        )
        _, _, reused_id, _, unchanged_manifests, _ = uploader.prepare(
            "MCPEDL/Addons/Curseforge-Test", "beta", bump=False
        )
        ok(reused_id == "1742470" and not unchanged_manifests,
           "CurseForge: reuses saved project ID on later runs")
        for kind, category, extension in (
            ("script", "Script", ".mcpack"),
            ("minigame", "Minigame", ".mcaddon"),
        ):
            name = f"Curseforge-{kind.title()}-Test"
            source = sample(root, kind, name)
            project = root / "MCPEDL" / category / name
            project.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source, project)
            uploader.save_info(f"MCPEDL/{category}/{name}", "1742471")
            package, _, _, _, _, _ = uploader.prepare(f"MCPEDL/{category}/{name}", "beta")
            ok(package.is_file() and package.suffix == extension,
               f"CurseForge: builds {kind} packages")
        variants = root / "MCPEDL/Maps/Variant-Test"
        variants.mkdir(parents=True)
        survival_world = variants / "Variant Test - Survival.mcworld"
        survival_world.touch()
        ok(
            uploader.find_map_package(variants, None, "Survival") == survival_world,
            "CurseForge: selects requested map variant",
        )

        for mode in ("Creative", "Survival", "Hardcore"):
            w = root / "Mcpeworlds" / mode
            w.mkdir(parents=True, exist_ok=True)
            if a.fake_foundation:
                fake_level_dat(w / "level.dat", mode)
                (w / "levelname.txt").write_text(mode)
            else:
                shutil.copy(REPO / "Mcpeworlds" / mode / "level.dat", w / "level.dat")
                for extra in ("level.dat_old", "levelname.txt"):
                    if (REPO / "Mcpeworlds" / mode / extra).is_file():
                        shutil.copy(REPO / "Mcpeworlds" / mode / extra, w / extra)

        map_source = sample(root, "map", "Curseforge-Map-Test")
        map_project = root / "MCPEDL/Maps/Curseforge-Map-Test"
        map_project.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(map_source, map_project)
        write(map_project / "oneblock.json", json.dumps({"enabled": True, "name": "Curseforge Map Test"}))
        uploader.save_info("MCPEDL/Maps/Curseforge-Map-Test", "1742472")
        map_package, _, _, _, _, _ = uploader.prepare(
            "MCPEDL/Maps/Curseforge-Map-Test", "beta", "Survival"
        )
        ok(
            map_package.suffix == ".mcworld"
            and re.search(r" - Survival v\(\d+\.\d+\.\d+\)\.mcworld$", map_package.name)
            and map_package.is_file(),
            "CurseForge: rebuilds and selects a map world variant",
        )

        # 1. add-on
        d = sample(root, "addon", "Sample-Addon", with_rp=True)
        (r, log), out = build_payload(root, d)
        ok(r == 0, "addon: build_payload passes")
        r, log = do_import(root, d, out)
        dest = root / "MCPEDL/Addons/Sample-Addon"
        ok(r == 0 and dest.is_dir(), "addon: imported into MCPEDL/Addons")
        primary, built = pack_builder.rebuild_project_packages(str(dest), "MCPEDL/Addons")
        ok(primary and primary.endswith(".mcaddon") and [item[1] for item in built] == ["mcaddon"],
           "addon: release builder emits only .mcaddon")
        ok((dest / "LOCK").read_text().startswith("ALNStudios Add-on Lock v1") and (dest / "behavior_pack/LOCK").is_file(), "addon: LOCK markers written")
        r, log = do_import(root, d, out)
        ok(r != 0 and "already exists" in log, "addon: second import without overwrite is refused")
        r, log = do_import(root, d, out, overwrite=True)
        ok(r == 0, "addon: overwrite works")

        # 2. minigame with controller + included add-on
        d = sample(root, "minigame", "Sample-Minigame", include=["Sample-Addon"])
        (r, log), out = build_payload(root, d)
        ok(r == 0, "minigame: build_payload installs controller assets and passes")
        ok((d / "resource_pack/textures/items/controller.png").read_bytes() == (REPO / "Mcpeworlds/assets/resources_pack/textures/items/controller.png").read_bytes(),
           "minigame: controller.png equals the repo asset byte for byte")
        ok("\"End Game\"" in (d / "behavior_pack/scripts/controller.js").read_text(encoding="utf-8"), "minigame: controller.js has the End Game button")
        r, log = do_import(root, d, out)
        sd = root / "MCPEDL/Minigame/Sample-Minigame"
        ok(r == 0 and (sd / "test_world.json").is_file(), "minigame: imported into MCPEDL/Minigame")
        primary, built = pack_builder.rebuild_project_packages(str(sd), "MCPEDL/Minigame")
        ok(primary and primary.endswith(".mcaddon") and [item[1] for item in built] == ["mcaddon"],
           "minigame: release builder emits only .mcaddon")
        r, log = run([str(root / "scripts/build_test_world.py"), "--project", "MCPEDL/Minigame/Sample-Minigame"], root)
        wp = sd / "Sample Minigame - Test.mcworld"
        ok(r == 0 and wp.is_file(), "minigame: Creative test world built")
        if wp.is_file():
            z = zipfile.ZipFile(wp)
            n = z.namelist()
            bl = json.loads(z.read("world_behavior_packs.json"))
            ok(len(bl) == 2 and any(x.startswith("behavior_packs/Sample-Minigame_BP/") for x in n)
               and any(x.startswith("behavior_packs/Sample-Addon_BP/") for x in n), "minigame: test world holds the minigame and included add-on")
            ok(not any(x.startswith("db/") for x in n) and "level.dat" in n, "minigame: test world is database-free")
            ok(z.read("levelname.txt").decode() == "Sample Minigame - Test", "minigame: world is named '<name> - Test'")
            (r, log), out = build_payload(root, d)
            if r == 0:
                with zipfile.ZipFile(io.BytesIO(base64.b64decode(out.read_text(encoding="ascii")))) as payload:
                    names = payload.namelist()
                ok(not any(name.endswith(" - Test.mcworld") for name in names),
                   "minigame: generated test world is excluded from payload")
            else:
                ok(False, "minigame: generated test world is excluded from payload")

        # 3. standalone Script projects remain BP-only and import into Script/
        d = sample(root, "script", "Sample-Script")
        (r, log), out = build_payload(root, d)
        ok(r == 0, "script: BP-only payload validates without Controller assets")
        r, log = do_import(root, d, out)
        script_dest = root / "MCPEDL/Script/Sample-Script"
        ok(r == 0 and script_dest.is_dir(), "script: imported into MCPEDL/Script")
        primary, built = pack_builder.rebuild_project_packages(str(script_dest), "MCPEDL/Script")
        ok(primary and primary.endswith(".mcpack") and [item[1] for item in built] == ["mcpack"],
           "script: release builder emits only .mcpack")

        # 4. map (legacy builder untouched)
        d = sample(root, "map", "Sample-Map")
        (r, log), out = build_payload(root, d)
        ok(r == 0, "map: build_payload installs ledger assets and passes")
        r, log = do_import(root, d, out)
        ok(r == 0 and (root / "MCPEDL/Maps/Sample-Map/oneblock.json").is_file(), "map: imported, oneblock.json written")
        r, log = run([str(root / "scripts/build_oneblock_variants_from_template.py")], root, env={"ONEBLOCK_MAP": "Sample-Map"})
        ok(r == 0 and len(list((root / "MCPEDL/Maps/Sample-Map").glob("*.mcworld"))) == 3, "map: existing builder still makes 3 worlds")

        # 5. legacy payload: oneblock.json only
        d = sample(root, "map", "Legacy-Map")
        (d / "project.json").unlink()
        write(d / "oneblock.json", json.dumps({"enabled": True, "name": "Legacy Map"}))
        write(d / "project.json", json.dumps({"type": "map", "name": "Legacy Map"}))
        (r, log), out = build_payload(root, d)
        (d / "project.json").unlink()  # simulate an old agent that never wrote it
        import_zip = root / "MCPEDL/incoming/legacy.b64"
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zz:
            for p in sorted(d.rglob("*")):
                if p.is_file():
                    zz.write(p, p.relative_to(d).as_posix())
        import_zip.write_text(base64.b64encode(buf.getvalue()).decode())
        r, log = run([str(root / "scripts/import_project_payload.py"), "--name", "Legacy-Map", "--payload-file", "MCPEDL/incoming/legacy.b64"], root)
        ok(r == 0 and "Legacy payload" in log, "legacy: oneblock.json-only payload still imports as a map")

        # 6. rejections
        def reject(label, mutate, needle, ptype="minigame", name="Bad", **kw):
            d = sample(root, ptype, name, **kw)
            (rr, _), out = build_payload(root, d)
            mutate(d)
            ZIP = root / "MCPEDL/incoming/bad.b64"
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w") as zz:
                for p in sorted(d.rglob("*")):
                    if p.is_file():
                        zz.write(p, p.relative_to(d).as_posix())
            ZIP.write_text(base64.b64encode(buf.getvalue()).decode())
            r, log = run([str(root / "scripts/import_project_payload.py"), "--name", "Bad", "--payload-file", "MCPEDL/incoming/bad.b64", "--overwrite"], root)
            ok(r != 0 and needle in log, f"rejected: {label}")

        reject("add-on README that does not follow the template", lambda d: write(d / "README.md", (d / "README.md").read_text() + "\n## Features\n\n- fast\n"), "exactly 11", ptype="addon")
        reject("add-on DESCRIPTION with an extra section", lambda d: write(d / "DESCRIPTION.md", (d / "DESCRIPTION.md").read_text().replace("## How to Use", "## Recipes\n\nx\n\n## How to Use")), "sections must be exactly", ptype="addon")
        reject("DESCRIPTION missing a required badge", lambda d: write(d / "DESCRIPTION.md", (d / "DESCRIPTION.md").read_text().replace(doc_template.DESCRIPTION_BADGES[0] + "\n", "")), "include this badge exactly once", ptype="addon")
        reject("DESCRIPTION duplicating a required badge", lambda d: write(d / "DESCRIPTION.md", (d / "DESCRIPTION.md").read_text().replace(doc_template.DESCRIPTION_BADGES[0], doc_template.DESCRIPTION_BADGES[0] + "\n" + doc_template.DESCRIPTION_BADGES[0])), "include this badge exactly once", ptype="addon")
        reject("add-on DESCRIPTION with an edited attribution block", lambda d: write(d / "DESCRIPTION.md", (d / "DESCRIPTION.md").read_text().replace("Do not re-upload this pack", "Feel free to re-upload this pack")), "attribution block", ptype="addon")
        reject("CHANGELOG with a link", lambda d: write(d / "CHANGELOG.md", (d / "CHANGELOG.md").read_text().replace("Players can use the new creation.", "See https://example.com now.")), "links or URLs", ptype="addon")
        reject("minigame README with a Markdown table", lambda d: write(d / "README.md", (d / "README.md").read_text() + "\n| a | b |\n"), "Markdown table")
        reject("minigame without test_world.json", lambda d: (d / "test_world.json").unlink(), "test_world.json")
        reject("minigame including an add-on that does not exist", lambda d: write(d / "test_world.json", json.dumps({"include_addons": ["Nope-Addon"]})), "not found")
        reject("tampered controller.png", lambda d: (d / "resource_pack/textures/items/controller.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 40), "controller.png")
        reject("controller.js edited (How to play removed)", lambda d: write(d / "behavior_pack/scripts/controller.js", (d / "behavior_pack/scripts/controller.js").read_text().replace('.button("How to play")', "")), "unchanged generator copy")
        reject("main.js without gameInfo", lambda d: write(d / "behavior_pack/scripts/main.js", MAIN_JS.replace("gameInfo:", "gameinfo:")), "non-empty gameInfo")
        reject("main.js with an empty howToPlay", lambda d: write(d / "behavior_pack/scripts/main.js", re.sub(r"howToPlay: \"[^\n]*\",", "howToPlay: \"\",", MAIN_JS)), "non-empty howToPlay")
        reject("map whose void cleaner adds the tag without checking the core Bedrock", lambda d: write(d / "behavior_pack/functions/void_cleaner.mcfunction", "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air\nexecute as @a[tag=!void_cleaned] run tag @s add void_cleaned\n"), "core Bedrock", ptype="map")
        reject("shaped recipe without AlwaysUnlocked", lambda d: write(d / "behavior_pack/recipes/a.json", json.dumps({"format_version": "1.20.10", "minecraft:recipe_shaped": {"description": {"identifier": "x:a"}, "tags": ["crafting_table"], "pattern": ["#"], "key": {"#": {"item": "minecraft:stick"}}, "result": {"item": "minecraft:stick"}}})), "AlwaysUnlocked", ptype="addon")
        reject("recipe file that is not valid JSON", lambda d: write(d / "behavior_pack/recipes/a.json", "{"), "invalid JSON", ptype="addon")
        reject("dynamic import with a computed specifier", lambda d: write(d / "behavior_pack/scripts/main.js", MAIN_JS + "const m = 'x';\nimport(m);\n"), "dynamic import")
        reject("map whose void cleaner never adds the tag", lambda d: write(d / "behavior_pack/functions/void_cleaner.mcfunction", "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air\n"), "void_cleaned tag", ptype="map")
        reject("payload reusing UUIDs of an imported project", lambda d: write(d / "behavior_pack/manifest.json", (root / "MCPEDL/Addons/Sample-Addon/behavior_pack/manifest.json").read_text()), "already used by")
        reject("world data (db folder)", lambda d: write(d / "behavior_pack/db/x.json", "{}"), "world data")
        reject("map without the void cleaner line", lambda d: write(d / "behavior_pack/functions/void_cleaner.mcfunction", "say hi\n"), "void_cleaner", ptype="map")
        reject("non-Creative test world foundation", lambda d: write(d / "test_world.json", json.dumps({"mode": "Survival"})), "Creative foundation")
        d = sample(root, "addon", "Furnace-Addon")
        write(d / "behavior_pack/recipes/f.json", json.dumps({"format_version": "1.20.10", "minecraft:recipe_furnace": {"description": {"identifier": "x:f"}, "tags": ["furnace"], "input": "minecraft:sand", "output": "minecraft:glass"}}))
        write(d / "behavior_pack/recipes/ok.json", json.dumps({"format_version": "1.20.10", "minecraft:recipe_shapeless": {"description": {"identifier": "x:s"}, "tags": ["crafting_table"], "ingredients": [{"item": "minecraft:stick"}], "result": {"item": "minecraft:stick"}, "unlock": [{"context": "AlwaysUnlocked"}]}}))
        (r, log), out = build_payload(root, d)
        ok(r == 0, "addon: furnace recipe needs no unlock, shapeless recipe with unlock passes")
        d = sample(root, "script", "NoCtl", controller=False)
        (r, log), out = build_payload(root, d)
        ok(r == 0 and not (d / "resource_pack").exists(), "script: no Controller assets are installed")

    failed = [l for c, l in results if not c]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
