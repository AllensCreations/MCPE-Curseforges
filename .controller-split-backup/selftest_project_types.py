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
import json
import os
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
         "header": {"name": f"{name} (v1.0.0)", "description": "Sample. by AllensCreations", "uuid": str(uuid.uuid4()),
                    "version": v, "min_engine_version": [1, 21, 0]},
         "modules": [{"type": "data" if kind == "bp" else "resources", "uuid": str(uuid.uuid4()), "version": v}],
         "metadata": {"authors": ["AllensCreations"]}}
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


MAIN_JS = '''import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const CONTROLLER_ID = "allenscreations:controller";
const STATE_KEY = "game_state";
const HOW_TO_PLAY = "Replace this text with the real rules of the game.";

const getState = () => {
  const v = world.getDynamicProperty(STATE_KEY);
  return typeof v === "string" ? v : "idle";
};
const setState = (s) => world.setDynamicProperty(STATE_KEY, s);
const isCreative = (player) => player.getGameMode() === GameMode.Creative;
const containerOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

function hasController(player) {
  const inv = containerOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) return true;
  }
  return false;
}
function giveController(player) {
  if (hasController(player)) return;
  containerOf(player)?.addItem(new ItemStack(CONTROLLER_ID, 1));
}
function consumeController(player) {
  if (isCreative(player)) return;
  const inv = containerOf(player);
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) {
      inv.setItem(i, undefined);
      player.playSound("random.break");
      player.sendMessage("The Controller broke.");
      return;
    }
  }
}

function startGame() {
  setState("running");
  world.sendMessage("Game started.");
}
function endGame() {
  setState("ended");
  world.sendMessage("Game ended.");
  for (const p of world.getAllPlayers()) giveController(p);
}

async function showHowToPlay(player) {
  const form = new ActionFormData().title("How to play").body(HOW_TO_PLAY).button("Back");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res.canceled && res.selection === 0) openController(player);
}

async function openController(player, attempt = 0) {
  const note = isCreative(player) ? "Creative: the Controller is kept." : "Start uses up the Controller.";
  const form = new ActionFormData()
    .title("Controller")
    .body(`State: ${getState()}\n${note}`)
    .button("Start")
    .button("How to play");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) {
    if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
      system.runTimeout(() => openController(player, attempt + 1), 10);
    }
    return;
  }
  if (res.selection === 0) {
    if (getState() === "running") {
      player.sendMessage("Already running.");
      return;
    }
    startGame();
    consumeController(player);
  } else if (res.selection === 1) {
    showHowToPlay(player);
  }
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === CONTROLLER_ID) openController(source);
});

system.afterEvents.scriptEventReceive.subscribe(({ id }) => {
  if (id === "allenscreations:end" && getState() === "running") endGame();
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn) return;
  if (isCreative(player) || getState() !== "running") giveController(player);
});
'''
DOCS = {"README.md": "# X\nSource created, not tested in game.\nLikely achievement-friendly.\nNo experiment requirement detected in the inspected files.\n",
        "DESCRIPTION.md": "# X\nPlayer text.\n", "CHANGELOG.md": "# Changelog\n## 1.0.0\n- First version.\n"}


def write(p: Path, text: str) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding="utf-8")


def sample(root: Path, ptype: str, name: str, **kw) -> Path:
    d = root / "build" / name
    shutil.rmtree(d, ignore_errors=True)
    for f, t in DOCS.items():
        write(d / f, t)
    pj = {"type": ptype, "name": name.replace("-", " ")}
    if kw.get("controller") is False:
        pj["controller"] = False
    write(d / "project.json", json.dumps(pj))
    rp = manifest(name, "rp")
    needs_rp = ptype == "map" or (ptype == "script" and kw.get("controller") is not False) or kw.get("with_rp")
    script = ptype == "script" or kw.get("script", False)
    bpm = manifest(name, "bp", rp["header"]["uuid"] if needs_rp else None, script=script, ui=ptype == "script" and kw.get("controller") is not False)
    write(d / "behavior_pack/manifest.json", json.dumps(bpm))
    if needs_rp:
        write(d / "resource_pack/manifest.json", json.dumps(rp))
    if script:
        write(d / "behavior_pack/scripts/main.js", MAIN_JS)
    if ptype == "map":
        write(d / "behavior_pack/functions/tick.json", json.dumps({"values": ["void_cleaner", "oneblock_tick"]}))
        write(d / "behavior_pack/functions/void_cleaner.mcfunction", "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air\nexecute as @a[tag=!void_cleaned] run tag @s add void_cleaned\n")
        write(d / "behavior_pack/functions/oneblock_tick.mcfunction", "scoreboard objectives add sample dummy\n")
        write(d / "behavior_pack/functions/oneblock_setup.mcfunction", "scoreboard objectives add sample dummy\n")
    if ptype == "script":
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
    ap = argparse.ArgumentParser()
    ap.add_argument("--fake-foundation", action="store_true")
    a = ap.parse_args()
    with tempfile.TemporaryDirectory(prefix="selftest-") as tmp:
        root = Path(tmp)
        shutil.copytree(REPO / "scripts", root / "scripts", ignore=shutil.ignore_patterns("__pycache__"))
        shutil.copytree(REPO / "Mcpeworlds" / "assets", root / "Mcpeworlds" / "assets")
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

        # 1. add-on
        d = sample(root, "addon", "Sample-Addon", with_rp=True)
        (r, log), out = build_payload(root, d)
        ok(r == 0, "addon: build_payload passes")
        r, log = do_import(root, d, out)
        dest = root / "MCPEDL/new_addons/Sample-Addon"
        ok(r == 0 and dest.is_dir(), "addon: imported into MCPEDL/new_addons")
        ok((dest / "LOCK").read_text().startswith("AllensCreations Add-on Lock v1") and (dest / "behavior_pack/LOCK").is_file(), "addon: LOCK markers written")
        r, log = do_import(root, d, out)
        ok(r != 0 and "already exists" in log, "addon: second import without overwrite is refused")
        r, log = do_import(root, d, out, overwrite=True)
        ok(r == 0, "addon: overwrite works")

        # 2. script with controller + included add-on
        d = sample(root, "script", "Sample-Script", include=["Sample-Addon"])
        (r, log), out = build_payload(root, d)
        ok(r == 0, "script: build_payload installs controller assets and passes")
        ok((d / "resource_pack/textures/items/controller.png").read_bytes() == (REPO / "Mcpeworlds/assets/resources_pack/textures/items/controller.png").read_bytes(),
           "script: controller.png equals the repo asset byte for byte")
        r, log = do_import(root, d, out)
        sd = root / "MCPEDL/script/Sample-Script"
        ok(r == 0 and (sd / "test_world.json").is_file(), "script: imported into MCPEDL/script")
        r, log = run([str(root / "scripts/build_test_world.py"), "--project", "MCPEDL/script/Sample-Script"], root)
        wp = sd / "Sample Script - Test.mcworld"
        ok(r == 0 and wp.is_file(), "script: test world built")
        if wp.is_file():
            z = zipfile.ZipFile(wp)
            n = z.namelist()
            bl = json.loads(z.read("world_behavior_packs.json"))
            ok(len(bl) == 2 and any(x.startswith("behavior_packs/Sample-Script_BP/") for x in n)
               and any(x.startswith("behavior_packs/Sample-Addon_BP/") for x in n), "script: test world holds the script and the included add-on")
            ok(not any(x.startswith("db/") for x in n) and "level.dat" in n, "script: test world is database-free")
            ok(z.read("levelname.txt").decode() == "Sample Script - Test", "script: world is named '<name> - Test'")

        # 3. map (legacy builder untouched)
        d = sample(root, "map", "Sample-Map")
        (r, log), out = build_payload(root, d)
        ok(r == 0, "map: build_payload installs ledger assets and passes")
        r, log = do_import(root, d, out)
        ok(r == 0 and (root / "MCPEDL/maps/Sample-Map/oneblock.json").is_file(), "map: imported, oneblock.json written")
        r, log = run([str(root / "scripts/build_oneblock_variants_from_template.py")], root, env={"ONEBLOCK_MAP": "Sample-Map"})
        ok(r == 0 and len(list((root / "MCPEDL/maps/Sample-Map").glob("*.mcworld"))) == 3, "map: existing builder still makes 3 worlds")

        # 4. legacy payload: oneblock.json only
        d = sample(root, "map", "Legacy-Map")
        (d / "project.json").unlink()
        write(d / "oneblock.json", json.dumps({"enabled": True, "name": "Legacy Map"}))
        write(d / "project.json", json.dumps({"type": "map", "name": "Legacy Map"}))
        (r, log), out = build_payload(root, d)
        (d / "project.json").unlink()  # simulate an old agent that never wrote it
        import_zip = root / "MCPEDL/incoming/legacy.b64"
        import base64, io
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zz:
            for p in sorted(d.rglob("*")):
                if p.is_file():
                    zz.write(p, p.relative_to(d).as_posix())
        import_zip.write_text(base64.b64encode(buf.getvalue()).decode())
        r, log = run([str(root / "scripts/import_project_payload.py"), "--name", "Legacy-Map", "--payload-file", "MCPEDL/incoming/legacy.b64"], root)
        ok(r == 0 and "Legacy payload" in log, "legacy: oneblock.json-only payload still imports as a map")

        # 5. rejections
        def reject(label, mutate, needle, ptype="script", name="Bad", **kw):
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

        reject("script without test_world.json", lambda d: (d / "test_world.json").unlink(), "test_world.json")
        reject("script including an add-on that does not exist", lambda d: write(d / "test_world.json", json.dumps({"include_addons": ["Nope-Addon"]})), "not found")
        reject("tampered controller.png", lambda d: (d / "resource_pack/textures/items/controller.png").write_bytes(b"\x89PNG\r\n\x1a\n" + b"0" * 40), "controller.png")
        reject("main.js without the How to play button", lambda d: write(d / "behavior_pack/scripts/main.js", MAIN_JS.replace('.button("How to play")', "")), "'How to play'")
        reject("main.js with an extra Restart button", lambda d: write(d / "behavior_pack/scripts/main.js", MAIN_JS.replace('.button("How to play")', '.button("How to play").button("Restart")')), "must not have Restart or End")
        reject("map whose void cleaner never adds the tag", lambda d: write(d / "behavior_pack/functions/void_cleaner.mcfunction", "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air\n"), "void_cleaned tag", ptype="map")
        reject("payload reusing UUIDs of an imported project", lambda d: write(d / "behavior_pack/manifest.json", (root / "MCPEDL/new_addons/Sample-Addon/behavior_pack/manifest.json").read_text()), "already used by")
        reject("world data (db folder)", lambda d: write(d / "behavior_pack/db/x.json", "{}"), "world data")
        reject("map without the void cleaner line", lambda d: write(d / "behavior_pack/functions/void_cleaner.mcfunction", "say hi\n"), "void_cleaner", ptype="map")
        reject("test world mode typo", lambda d: write(d / "test_world.json", json.dumps({"mode": "Peaceful"})), "mode must be")
        d = sample(root, "script", "NoCtl", controller=False)
        (r, log), out = build_payload(root, d)
        ok(r == 0 and not (d / "resource_pack").exists(), "script: controller=false skips the controller assets")

    failed = [l for c, l in results if not c]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
