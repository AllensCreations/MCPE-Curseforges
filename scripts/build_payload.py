#!/usr/bin/env python3
"""OneBlock payload builder: ONE file that installs the Trader Ledger assets, checks the
project, builds the ZIP, writes payload.b64 and round-trips it.

Usage:  python build_payload.py build/Map-Name [--ledger-sha256 HEX] [--out payload.b64] [--check-only]

  --ledger-sha256  only if you used the repo's trader_ledger.png and its hash differs from the
                   embedded one (the repo copy wins; report the new hash to the user).
  --check-only     run the checks, do not build the ZIP.

Structural checks only. They mirror scripts/import_oneblock_payload.py and the builder's
verify_archive; if the scripts and this file ever disagree, the scripts win.
Exit codes: 0 ok, 1 checks failed, 2 packaging or round-trip failed.
"""
import argparse, base64, hashlib, io, json, re, struct, sys, zipfile
from pathlib import Path, PurePosixPath

# ---------------------------------------------------------------- constants
LEDGER_SHA256 = "fecc64905334511d97569611666ffa28a8941683a20e30ca5926ecb9ffd9c001"
LEDGER_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA/0lEQVR42mNgGAUDDBgJKTgy0eI/pZbY5J/AaQ8TLglbdan/tupS/6nhS3zmMA26KCj3Vkdx7bE7nymyoD1LDm90sBAyYNXKSrItDwtvJ6hmwKOAhViFfFJGRBv66dk58h3w5P2vwRkCMBDVXotTblllM+0dQAp45qnBEH8fVUy5wOn/3Qn7GOniAAYGBgYFP1kU/oNNjykLAXKCOdVCg4GBgYFh9okbIywNwAA2nw+9goiSYKZ5OYDPUeipnq5pQGr7DYK14eBLAzKCbIMzDZBSw5ECBn82JKZVQ5NmOawli56KyQGV0x4xHL75jHFoRQHCxXIU9w1w+X4UDAoAACWbTR1cQx13AAAAAElFTkSuQmCC"
ITEM_TEXTURE = {
    "resource_pack_name": "dirtbound_kingdom",
    "texture_name": "atlas.items",
    "texture_data": {"trader_ledger": {"textures": "textures/items/trader_ledger"}},
}
LEDGER_ITEM = {
    "format_version": "1.20.80",
    "minecraft:item": {
        "description": {"identifier": "allenscreations:trader_ledger", "menu_category": {"category": "items"}},
        "components": {
            "minecraft:max_stack_size": 1,
            "minecraft:icon": {"textures": {"default": "trader_ledger"}},
            "minecraft:display_name": {"value": "OneBlock Trader"},
            "minecraft:use_animation": "spyglass",
            "minecraft:use_modifiers": {"use_duration": 0.1, "movement_modifier": 1},
        },
    },
}
CLEANER = "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air"
ATTRIBUTION = "by AllensCreations"
UUID_V4 = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.I)
TITLE = re.compile(r"^.+ \(v(\d+)\.(\d+)\.(\d+)\)$")
ALLOWED = {".json", ".js", ".mcfunction", ".md", ".txt", ".lang", ".png", ".jpg", ".jpeg", ".tga", ".ogg"}
BLOCKED = (".mcworld", ".mcpack", ".mcaddon", ".zip")
MAX_FILES, MAX_FILE, MAX_TOTAL, ZIP_LIMIT = 500, 5 * 1024 * 1024, 25 * 1024 * 1024, 48000
STRICT_JSON = ("oneblock.json", "behavior_pack/manifest.json", "resource_pack/manifest.json",
               "behavior_pack/functions/tick.json", "resource_pack/textures/item_texture.json",
               "behavior_pack/items/trader_ledger.json")
REQUIRED = ("oneblock.json", "README.md", "DESCRIPTION.md", "CHANGELOG.md",
            "behavior_pack/manifest.json", "resource_pack/manifest.json",
            "behavior_pack/functions/tick.json", "behavior_pack/functions/void_cleaner.mcfunction",
            "behavior_pack/functions/oneblock_setup.mcfunction", "behavior_pack/items/trader_ledger.json",
            "resource_pack/textures/item_texture.json", "resource_pack/textures/items/trader_ledger.png")


# ------------------------------------------------------ step 1: ledger assets
def install_ledger(root: Path) -> None:
    """Create the three Trader Ledger files if missing. Never overwrites an existing PNG."""
    png = base64.b64decode(LEDGER_PNG_B64, validate=True)
    assert hashlib.sha256(png).hexdigest() == LEDGER_SHA256, "embedded PNG is corrupt"
    p = root / "resource_pack/textures/items/trader_ledger.png"
    if not p.exists():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(png)
        print("installed  resource_pack/textures/items/trader_ledger.png")
    t = root / "resource_pack/textures/item_texture.json"
    if not t.exists():
        t.parent.mkdir(parents=True, exist_ok=True)
        t.write_text(json.dumps(ITEM_TEXTURE, indent=2) + "\n", encoding="utf-8")
        print("installed  resource_pack/textures/item_texture.json")
    else:  # keep the add-on's own entries, make sure the ledger entry is right
        data = json.loads(t.read_text(encoding="utf-8-sig"))
        want = ITEM_TEXTURE["texture_data"]["trader_ledger"]
        if data.get("texture_data", {}).get("trader_ledger") != want or data.get("texture_name") != "atlas.items":
            data["texture_name"] = "atlas.items"
            data.setdefault("texture_data", {})["trader_ledger"] = want
            t.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            print("repaired   item_texture.json trader_ledger entry")
    i = root / "behavior_pack/items/trader_ledger.json"
    if not i.exists():
        i.parent.mkdir(parents=True, exist_ok=True)
        i.write_text(json.dumps(LEDGER_ITEM, indent=2) + "\n", encoding="utf-8")
        print("installed  behavior_pack/items/trader_ledger.json")


# ----------------------------------------------------------- step 2: checks
def run_checks(root: Path, ledger_sha: str):
    fails, warns = [], []

    def check(ok, msg):
        if not ok:
            fails.append(msg)

    def jload(rel, strict=True):
        try:
            return json.loads((root / rel).read_text(encoding="utf-8-sig"))
        except Exception as exc:
            (fails if strict else warns).append(f"{rel}: missing or invalid JSON ({exc})")
            return None

    files = [p for p in root.rglob("*") if p.is_file()]
    total = 0
    check(len(files) <= MAX_FILES, f"{len(files)} files (max {MAX_FILES})")
    for p in files:
        rel = p.relative_to(root).as_posix()
        low = PurePosixPath(rel.lower())
        size = p.stat().st_size
        total += size
        check(size <= MAX_FILE, f"{rel}: over 5 MB")
        check(low.suffix in ALLOWED, f"{rel}: file type not allowed")
        check("db" not in low.parts and low.name != "level.dat", f"{rel}: world data not allowed")
        check(low.name not in ("world_behavior_packs.json", "world_resource_packs.json"), f"{rel}: link files not allowed")
        check(not rel.lower().endswith(BLOCKED), f"{rel}: nested archive")
        check(not p.is_symlink(), f"{rel}: symlink")
        check(not rel.startswith("Mcpeworlds/"), f"{rel}: Mcpeworlds paths must not be shipped")
        if low.suffix == ".json" and rel not in STRICT_JSON and not rel.startswith("behavior_pack/recipes/"):
            jload(rel, strict=False)  # importer only warns on these
    check(total <= MAX_TOTAL, f"total {total} bytes (max 25 MB)")
    for rel in REQUIRED:
        check((root / rel).is_file(), f"missing required file: {rel}")

    cfg = jload("oneblock.json")
    if isinstance(cfg, dict):
        check(isinstance(cfg.get("name"), str) and cfg["name"].strip(), "oneblock.json needs a non-empty name")
        check(cfg.get("enabled") is True, "oneblock.json enabled must be true")

    tick = jload("behavior_pack/functions/tick.json")
    vals = (tick or {}).get("values")
    check(isinstance(vals, list) and bool(vals), "tick.json needs a non-empty values list")
    if isinstance(vals, list) and vals:
        check(vals[0] == "void_cleaner", "tick.json: first entry must be void_cleaner")
        for v in vals:
            check((root / f"behavior_pack/functions/{v}.mcfunction").is_file(), f"tick.json names {v} but its .mcfunction is missing")
        if "oneblock_setup" in vals:
            warns.append("oneblock_setup is listed in tick.json and will run every tick; intended?")
    cl = root / "behavior_pack/functions/void_cleaner.mcfunction"
    if cl.is_file():
        lines = cl.read_text(encoding="utf-8").splitlines()
        check(CLEANER in lines, "void_cleaner.mcfunction lacks the exact required fill line")
        cmds = [x for x in lines if x.strip() and not x.lstrip().startswith("#")]
        check(bool(cmds) and cmds[0] == CLEANER, "the required fill line must be the first command")

    uuids, versions, huuid = [], {}, {}
    for label in ("behavior_pack", "resource_pack"):
        m = jload(f"{label}/manifest.json")
        if not isinstance(m, dict):
            continue
        check(m.get("format_version") == 2, f"{label}: format_version must be 2")
        h = m.get("header") or {}
        uuid, ver, name, desc = h.get("uuid"), h.get("version"), h.get("name", ""), h.get("description", "")
        check(isinstance(uuid, str) and bool(UUID_V4.match(uuid)), f"{label}: header.uuid missing or not a v4 UUID")
        check(isinstance(ver, list) and len(ver) == 3 and all(isinstance(x, int) for x in ver), f"{label}: header.version must be [x,y,z]")
        t = TITLE.match(name) if isinstance(name, str) else None
        check(bool(t), f"{label}: header.name must end with one (vX.Y.Z)")
        if t and isinstance(ver, list):
            check([int(x) for x in t.groups()] == ver, f"{label}: title version does not match header.version")
            check(name.count("(v") == 1, f"{label}: duplicated version suffix in name")
        check(isinstance(desc, str) and desc.count(ATTRIBUTION) == 1, f"{label}: description needs '{ATTRIBUTION}' exactly once")
        check(ATTRIBUTION not in str(name), f"{label}: keep attribution out of the name")
        uuids.append(uuid)
        mods = m.get("modules") or []
        check(bool(mods), f"{label}: no modules")
        for mod in mods:
            uuids.append(mod.get("uuid"))
            check(isinstance(mod.get("uuid"), str) and bool(UUID_V4.match(mod["uuid"])), f"{label}: module uuid missing or invalid")
        versions[label], huuid[label] = ver, uuid
        if label == "resource_pack":
            check(any(x.get("type") == "resources" for x in mods), "resource_pack needs a 'resources' module")
    check(len(uuids) == len(set(uuids)), "UUIDs must all be unique (headers and modules)")
    check(versions.get("behavior_pack") == versions.get("resource_pack"), "behavior and resource pack versions must match")
    bp = jload("behavior_pack/manifest.json") or {}
    dep = [d for d in bp.get("dependencies") or [] if d.get("uuid") == huuid.get("resource_pack")]
    check(bool(dep), "behavior pack must depend on the resource pack header.uuid")
    if dep:
        check(dep[0].get("version") == versions.get("resource_pack"), "resource pack dependency version must match")
    for d in bp.get("dependencies") or []:
        if any(w in str(d.get("version", "")).lower() for w in ("beta", "rc", "preview")):
            warns.append(f"preview/beta dependency {d.get('module_name')}: allowed only if a requested feature needs it; say so in the README")

    rec = root / "behavior_pack/recipes"
    for p in rec.glob("**/*.json") if rec.is_dir() else []:
        check(b"AlwaysUnlocked" in p.read_bytes(), f"{p.relative_to(root).as_posix()}: missing AlwaysUnlocked")

    png = root / "resource_pack/textures/items/trader_ledger.png"
    if png.is_file():
        d = png.read_bytes()
        check(hashlib.sha256(d).hexdigest() == ledger_sha, "trader_ledger.png is not a byte-for-byte copy (SHA-256 mismatch)")
        check(d[:8] == b"\x89PNG\r\n\x1a\n" and struct.unpack(">II", d[16:24]) == (32, 32), "trader_ledger.png must be a 32x32 PNG")
    its = jload("resource_pack/textures/item_texture.json") or {}
    check(its.get("texture_name") == "atlas.items", "item_texture.json: texture_name must be atlas.items")
    check(((its.get("texture_data") or {}).get("trader_ledger") or {}).get("textures") == "textures/items/trader_ledger",
          "item_texture.json: trader_ledger entry missing or wrong path")
    item = (jload("behavior_pack/items/trader_ledger.json") or {}).get("minecraft:item") or {}
    check((item.get("description") or {}).get("identifier") == "allenscreations:trader_ledger", "trader_ledger.json: identifier must be allenscreations:trader_ledger")
    icon = ((item.get("components") or {}).get("minecraft:icon") or {}).get("textures", {}).get("default")
    check(icon == "trader_ledger", "trader_ledger.json: icon default must be trader_ledger")

    readme = root / "README.md"
    if readme.is_file():
        low = readme.read_text(encoding="utf-8").lower()
        if "not tested in game" not in low:
            warns.append("README.md should state: source created, not tested in game")
        if "http://" in low or "https://" in low:
            warns.append("README.md contains a link: no download links allowed")
    return fails, warns, len(files), total


# ------------------------------------------- step 3: ZIP, base64, round-trip
def pack(root: Path, out: Path) -> int:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(root.rglob("*")):
            if p.is_file():
                info = zipfile.ZipInfo(p.relative_to(root).as_posix(), date_time=(2020, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.external_attr = 0o644 << 16
                z.writestr(info, p.read_bytes(), compresslevel=9)
    data = buf.getvalue()
    out.write_text(base64.b64encode(data).decode("ascii"), encoding="ascii")  # always one line
    back = zipfile.ZipFile(io.BytesIO(base64.b64decode(out.read_text(), validate=True)))
    names = set(back.namelist())
    missing = set(REQUIRED) - names
    if back.testzip() is not None or missing:
        print(f"ROUND-TRIP FAILED: {back.testzip()} / missing {sorted(missing)}")
        sys.exit(2)
    print(f"ZIP bytes: {len(data)}   payload.b64 chars: {out.stat().st_size}   round-trip OK ({len(names)} files)")
    if len(data) > ZIP_LIMIT:
        print(f"ZIP is over {ZIP_LIMIT} bytes: do NOT paste it into the workflow. Deliver {out.name} as a file "
              "(commit to MCPEDL/incoming/<name>.b64 and use payload_file).")
    return len(data)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", help="e.g. build/Map-Name")
    ap.add_argument("--ledger-sha256", default=LEDGER_SHA256)
    ap.add_argument("--out", default="payload.b64")
    ap.add_argument("--check-only", action="store_true")
    a = ap.parse_args()
    root = Path(a.project)
    if not root.is_dir():
        sys.exit(f"Project folder not found: {root}")
    install_ledger(root)
    fails, warns, n, total = run_checks(root, a.ledger_sha256)
    for w in sorted(set(warns)):
        print("WARNING:", w)
    if fails:
        print("SELF-TEST FAILED")
        for f in sorted(set(fails)):
            print(" -", f)
        sys.exit(1)
    print(f"SELF-TEST PASSED ({n} files, {total} bytes)")
    if not a.check_only:
        pack(root, Path(a.out))
        print("BUILD OK. Structure only: not tested in game.")


if __name__ == "__main__":
    main()
