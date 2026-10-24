# OneBlock Add-on Generator (AI Agent Instructions) - v4

Send this file to an AI agent together with your OneBlock idea. The agent builds a complete OneBlock add-on and returns it as **one line of base64** (inline, or as a `.b64` file if long). You paste that into the GitHub workflow **Create OneBlock Add-on from Base64**, which creates `MCPEDL/maps/<Map-Name>/` and builds the Creative, Survival, and Hardcore worlds from `Mcpeworlds/`.

If you can read the repository AllensCreations/MCPE-Curseforges, read `INSTRUCTIONS.md`, `README_GUIDELINES.md`, **`scripts/import_oneblock_payload.py`** (validates your ZIP) and **`scripts/build_oneblock_variants_from_template.py`** (builds the worlds) first. The scripts are the real source of truth: if this file and a script disagree, the script wins, and you should tell the user what differs. If you cannot read the repo, the rules below are self-sufficient, including the required texture (Section 4) and a ready-made self-test (Section 10).

**What changed in v4**
- **One script.** `build_payload.py` (Section 10) replaces the separate self-test and packaging snippets. It installs any missing Trader Ledger files from an embedded, hash-verified PNG, runs all checks, builds the ZIP, writes `payload.b64` and round-trips it.
- The checks now match the importer more closely: only the key JSON files must be strict, other JSON only warns. New warnings: `oneblock_setup` listed in `tick.json`, links in the README, missing "not tested in game".
- Sections 4 and 12 are shorter because the script covers what they used to repeat.

---

## 1. Hard rules for the agent

- **Never write base64 by hand** for the payload. Create the files, build the ZIP, and encode it by actually running code (Section 10). If you cannot run code, stop and say so; output the file tree with full contents plus the packaging script and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Separate verified facts from assumptions.
- Never claim an in-game test. Building the ZIP proves structure only.
- Look up the **latest stable** Minecraft Bedrock release and **latest stable** `@minecraft/server` and `@minecraft/server-ui` versions from official Minecraft Creator documentation (or the Script API docs for the current release) at the time of the work. Do not use remembered versions. No preview/beta/RC unless a requested feature requires it, and then say so in the README.
- `min_engine_version` is the lowest game version the implementation needs, as a 3-number array (e.g. `[1, 26, 50]` for release 26.50). If you cannot confirm which game version first shipped the module version you use, say so.
- Source priority: the add-on's own files, then Mojang Bedrock Samples, then official Creator Documentation, then Minecraft Wiki, then Bedrock Wiki.
- **Art:** no AI-generated images, ever. The Trader Ledger texture is mandatory and comes only from the repo copy or the embedded copy in Section 4. For any other texture use real vanilla texture names, user-supplied textures, or omit the icon.
- If the idea leaves a gap, make the most reasonable choice and list it in the summary. Ask at most one clarifying question, and only if the answer would change what you build.
- Shell tip: the packaging environment may be plain `sh`, so do not use brace expansion like `mkdir -p a/{b,c}`. Use a loop or separate commands. After creating files, list them and confirm they exist.

---

## 2. What the agent delivers

A ZIP whose **root** is the project folder contents (one wrapping folder is tolerated):

```
oneblock.json
README.md
DESCRIPTION.md
CHANGELOG.md
behavior_pack/
├── manifest.json
├── functions/
│   ├── tick.json
│   ├── void_cleaner.mcfunction      (REQUIRED, see Section 3)
│   ├── oneblock_setup.mcfunction    (REQUIRED, see Section 3)
│   ├── oneblock_tick.mcfunction
│   └── ... other .mcfunction files
├── items/
│   ├── trader_ledger.json           (REQUIRED, see Section 4)
│   └── ... other items
├── scripts/main.js        (only if Script API is needed)
└── blocks/ entities/ recipes/ loot_tables/ texts/   (as needed)
resource_pack/              (REQUIRED, because of the Trader Ledger texture)
├── manifest.json
└── textures/
    ├── item_texture.json                (REQUIRED, see Section 4)
    └── items/
        └── trader_ledger.png            (REQUIRED, see Section 4)
    (plus texts/ and other textures as needed)
```

**Never include:** world data (`db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`), `.mcworld`/`.mcpack`/`.mcaddon`/`.zip` files, symlinks, or any `Mcpeworlds/...` path. Allowed types: `.json .js .mcfunction .md .txt .lang .png .jpg .jpeg .tga .ogg`. Limits: 500 files, 5 MB per file, 25 MB total, **48,000 bytes for the ZIP** (base64 is about a third larger, so 48,000 bytes is about 64,000 characters, just under the 65,535-character cap on a workflow text input; bigger payloads go through a `.b64` file).

---

## 3. Builder and importer hard requirements (the build fails without these)

Two scripts check your work. The importer (`import_oneblock_payload.py`) checks the ZIP before anything is written. The builder (`verify_archive`) checks the finished world. Treat each item as mandatory.

1. **`behavior_pack/functions/tick.json` exists**, is valid JSON, has a non-empty `"values"` list, and **`void_cleaner` is the first entry**.
   ```json
   { "values": ["void_cleaner", "oneblock_tick"] }
   ```
   Every name listed must exist as `functions/<name>.mcfunction`.
2. **`behavior_pack/functions/void_cleaner.mcfunction` exists and contains this exact line** (character for character, on its own line, no trailing spaces):
   ```
   execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
   ```
   Put it as the first command. This is required even if your core is at a different height; it only clears a 33x33 patch at the world's bottom layer (Y=-64). You may add more commands after it.
3. **`behavior_pack/functions/oneblock_setup.mcfunction` exists.** The builder only checks that the file exists. Its intended role is not documented, so keep it harmless and idempotent (for example, creating your scoreboard objective). Do **not** list it in `tick.json` unless you intentionally want it to run every tick. Say in the README that it is a manual or optional setup function.
4. **Manifests are valid:** each pack manifest has `header.uuid` and `header.version` (a list). The world links the behavior pack and the resource pack; the builder writes the link files, never ship them.
5. **No LevelDB:** the world foundation is database-free. Never ship `db/` files.
6. **Importer path rules.** The importer rejects a file if any folder or file name in its path is exactly `db` (case-insensitive), if the file is named `level.dat`, if the extension is not in the allowed list, or if it is a nested archive or symlink. So never name a folder `db`, and never copy a whole folder from the repo (Section 4 explains why).
7. **Importer content rules.** Every file in `behavior_pack/recipes/` must contain `AlwaysUnlocked` (Section 8). Manifest names, descriptions, versions and dependencies follow Section 6.

**Run `build_payload.py` (Section 10) before delivering. Do not skip it.**

---

## 4. Mandatory asset: the Trader Ledger texture

Every OneBlock add-on ships the repo's Trader Ledger icon and an item that uses it. No exceptions and no substitute art.

**Facts (verified against the repo on 2026-10-22):**
- The file is `Mcpeworlds/assets/resources_pack/textures/items/trader_ledger.png`. The name is `trader_ledger` (singular "trader") and it sits in `textures/items/`. If the user calls it `traders_ledger.png`, they mean this file. Ship it as `trader_ledger.png`, because `item_texture.json` points to that name.
- It is a 32 x 32 RGBA PNG, 312 bytes, SHA-256 `fecc64905334511d97569611666ffa28a8941683a20e30ca5926ecb9ffd9c001`. It shows a small brown ledger book with a green bookmark.
- Its companion is `Mcpeworlds/assets/resources_pack/textures/item_texture.json`.
- **The scripts do not copy `Mcpeworlds/assets/` for you.** The importer only accepts what is inside your ZIP, and the builder only copies the map's own `resource_pack/` folder. The files must be inside the payload at the paths below.

**Required files in the payload:**

```
resource_pack/manifest.json
resource_pack/textures/item_texture.json
resource_pack/textures/items/trader_ledger.png
behavior_pack/items/trader_ledger.json
```

**Getting the PNG:** `build_payload.py` (Section 10) writes the three ledger files below if they are missing, using an embedded copy of the PNG whose SHA-256 it verifies. If you can read the repo and its copy differs from the hash above, the repo copy wins: place it at the path above before running the script, pass `--ledger-sha256 <new hash>`, and report the new hash to the user so this file can be updated. Never redraw, recolor, resize, re-encode, or generate a replacement.

**`resource_pack/textures/item_texture.json`** (the repo's file; copy it verbatim):

```json
{
  "resource_pack_name": "dirtbound_kingdom",
  "texture_name": "atlas.items",
  "texture_data": {
    "trader_ledger": {
      "textures": "textures/items/trader_ledger"
    }
  }
}
```

You may add entries for the add-on's own textures. Never remove or rename the `trader_ledger` entry, and never add a `.png` extension to the path.

**`behavior_pack/items/trader_ledger.json`** (taken from the Dirtbound Kingdom reference map):

```json
{
  "format_version": "1.20.80",
  "minecraft:item": {
    "description": {
      "identifier": "allenscreations:trader_ledger",
      "menu_category": { "category": "items" }
    },
    "components": {
      "minecraft:max_stack_size": 1,
      "minecraft:icon": { "textures": { "default": "trader_ledger" } },
      "minecraft:display_name": { "value": "OneBlock Trader" },
      "minecraft:use_animation": "spyglass",
      "minecraft:use_modifiers": { "use_duration": 0.1, "movement_modifier": 1 }
    }
  }
}
```

`minecraft:icon` > `textures` > `default` must equal the key in `item_texture.json` (`trader_ledger`). Keep the identifier fixed. You may change the display name to suit the map.

**What the ledger does** follows the user's idea. The reference map (Dirtbound Kingdom) makes it the only way to open a Script API shop menu: `behavior_pack/functions/give_trader.mcfunction` contains `give @s allenscreations:trader_ledger 1`, and the script restores a missing ledger when a player joins. Use that pattern unless the idea says otherwise. If the idea gives the ledger no role, still ship the texture and item, and say so in the summary.

**Traps:**
- Do not copy the `Mcpeworlds/assets/` folder wholesale. `textures/items/` also contains a 1-byte file named `1` with no extension, and the importer rejects it ("File type not allowed"). Copy exactly the files listed above.
- Do not put the PNG anywhere else (not `textures/blocks/`, not a renamed file). Do not ship a `Mcpeworlds/` path.

---

## 5. `oneblock.json`

```json
{
  "enabled": true,
  "name": "Display Name of the Map"
}
```

Only these fields. `name` is the display name; the folder name is chosen by the user in the workflow. World names become `<name> - Creative|Survival|Hardcore`.

---

## 6. Manifests

Applies to both `behavior_pack/manifest.json` and `resource_pack/manifest.json`. Both are required now.

- `format_version`: 2.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`: exactly one terminal version suffix, equal to `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` **exactly once**. Keep attribution out of the name.
- Fresh, valid, unique UUIDs (v4) for each header and module, four in total (two headers, plus the data module and the resources module; a script module adds a fifth). Never reuse one.
- The behavior pack's `dependencies` includes the resource pack's `header.uuid` with a matching version, written as `{ "uuid": "...", "version": [x, y, z] }`. Script modules are written as `{ "module_name": "@minecraft/server", "version": "<latest stable string>" }`.
- Script modules (`@minecraft/server`, `@minecraft/server-ui`) use the latest stable versions looked up in Section 1, never beta. Script module entry: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`.
- No experiments unless the feature truly needs one; name it in the README if so.

Resource pack manifest template:

```json
{
  "format_version": 2,
  "header": {
    "name": "Add-on Name (v1.0.0)",
    "description": "Textures for the add-on. by AllensCreations",
    "uuid": "<fresh uuid v4>",
    "version": [1, 0, 0],
    "min_engine_version": [1, 26, 0]
  },
  "modules": [
    { "type": "resources", "uuid": "<fresh uuid v4>", "version": [1, 0, 0] }
  ],
  "metadata": { "authors": ["AllensCreations"], "product_type": "addon" }
}
```

Use the same `min_engine_version` as the behavior pack unless you can verify a lower one.

---

## 7. Mechanics requirements

The add-on must work in any database-free void world. It must not depend on specific terrain, a database, or world settings.

Use this pipeline (the Dirtbound reference design) unless the user specifies otherwise:

- `void_cleaner.mcfunction` runs every tick but each command is guarded by `tag=!void_cleaned`, in this order: (1) the required Y=-64 clear line from Section 3; (2) clear the starting area if needed; (3) teleport the untagged player to spawn (the only function-side player teleport); (4) place Bedrock under the core; (5) place a placeholder at the core only if the spot is empty; (6) set world spawn; (7) send a notice; (8) add the `void_cleaned` tag **last**.
- **Protect the core from later joiners:** any clear of the core area must be skipped once the core exists (for example `unless block <bedrock position> bedrock`), and the placeholder only placed if the spot is air. Otherwise a second player joining wipes the island.
- `oneblock_tick` may restore only missing Bedrock, and only if a player already has `void_cleaned`. It must not reset spawn, teleport players, or place or replace the core.
- If a Script API owns the core block, break rewards, and progression, it waits until a player has `void_cleaned` before replacing the placeholder.
- Dirtbound coordinates are core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. If the user gives other coordinates, use theirs and make sure any `fill` covers what it claims to clear.
- Do not make a score-dependent command the only way an initial block is created.
- If the user's idea needs a player teleport from script (for example a boundary guard), allow it only in script, state it clearly in the summary, and keep the function-side pipeline unchanged. If an idea cannot work with the `void_cleaner`-first pipeline, say so instead of silently changing it.
- Prefer event-driven logic over per-tick polling, broad entity searches, or block scans.

---

## 8. Recipes

Every custom crafting recipe needs the unlock the recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

Array-style recipe formats use `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas; compare against Bedrock Samples. The importer rejects any file in `behavior_pack/recipes/` without `AlwaysUnlocked`.

---

## 9. Documentation files

- `README.md`: short and download-focused. Title, one-paragraph description, install note. **No download links and no claims that `.mcworld` archives exist** (the sync script adds them after the build). Include an "Achievements and experiments" line using exactly one of: *Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*, plus "No experiment requirement detected in the inspected files." or the experiment name. State **source created, not tested in game**. Mention that the Trader Ledger icon is the repository's own texture.
- `DESCRIPTION.md`: player-facing features. Only features that exist in the files. Describe the Trader Ledger as it actually behaves in this add-on.
- `CHANGELOG.md`: starts with the first version entry.

---

## 10. `build_payload.py` (run this, do not hand-write)

One script does the whole job: installs missing Trader Ledger files, runs every check from Section 3, 6 and 8 (mirroring the importer and builder), builds the ZIP, writes `payload.b64` (always, one line) and round-trips it.

1. Create the project under `build/<Map-Name>/` using the Section 2 layout. You do not need to create the three ledger files yourself; you may still edit `item_texture.json` to add the add-on's own textures, and edit the ledger item's display name.
2. Save the script below as `build_payload.py` next to `build/`.
3. Run `python build_payload.py build/Map-Name`. Add `--check-only` to test without building. Add `--ledger-sha256 <hash>` only if you used a repo copy of the PNG with a different hash.
4. Fix every failure it prints and run it again. Paste the final output (PASSED and BUILD OK) into your reply. It proves structure only.
5. Deliver `payload.b64`: one single line, no line breaks, spaces or code fences. If the ZIP is under 48,000 bytes you may paste it inline; otherwise deliver the file and tell the user to commit it to `MCPE-Curseforges/MCPEDL/incoming/<name>.b64` and pass that path as `payload_file`. Never retype it from memory.

```python
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
```

---

## 11. Final self-check before replying

`build_payload.py` already checks structure, manifests, UUIDs, dependencies, recipes, `tick.json`, `void_cleaner`, and the Trader Ledger files. By hand, confirm only:

- [ ] The script printed SELF-TEST PASSED and BUILD OK, and the base64 came from `payload.b64`, not from typing.
- [ ] Module versions are latest stable, looked up on the date of the work, with the date recorded.
- [ ] README states achievement status, experiments, and "not tested in game", and mentions the repository's own Trader Ledger icon.
- [ ] `oneblock_setup.mcfunction` is harmless and idempotent, and the README says it is a manual or optional function.
- [ ] No file from `Mcpeworlds/assets/` other than the ledger files was copied (no stray file named `1`).

---

## 12. If the build fails

Paste the workflow's error log back to the agent. Common messages and their fixes:

| Message contains | Fix |
|---|---|
| `File type not allowed: <path>` | Delete that file or use an allowed extension. A stray file named `1` from `Mcpeworlds/assets/` is the usual cause. |
| `World data must not be included` | Remove `level.dat` or any folder/file named `db`. |
| `Do not ship world pack link files` | Remove `world_behavior_packs.json` / `world_resource_packs.json`. |
| `header.name must end with one '(vX.Y.Z)'` | Use `Name (v1.0.0)`, one suffix only. |
| `title version ... does not match header.version` | Make the title and `header.version` agree, in both packs. |
| `header.description must contain 'by AllensCreations' exactly once` | Put it once in each description, never in the name. |
| `does not list the resource pack header.uuid in dependencies` | Add `{ "uuid": <resource pack header.uuid>, "version": [x,y,z] }` to the behavior pack dependencies. |
| `share the same header.uuid` / `versions ... must match` | Give each pack its own UUID; use one version for both. |
| `first entry must be 'void_cleaner'` | Fix `tick.json` (Section 3). |
| `names '<x>' but ... is missing` | Create `functions/<x>.mcfunction` or remove it from `tick.json`. |
| `missing the AlwaysUnlocked unlock context` | Add the unlock to the recipe (Section 8). |
| `missing required entries: ...` | Add the named file, typically `oneblock_setup.mcfunction`. |
| `does not contain the required 33x33 Y=-64 Void Cleaner command` | Add the exact line from Section 3. |
| `already exists. Re-run with overwrite enabled` | Set `overwrite` to true in the workflow. |

If the message is not listed, check the relevant script in `scripts/` and tell the user which rule it enforces.

---

## 13. Reply format

1. Suggested map folder name (letters, numbers, `.` `_` `-`).
2. The base64 (one-line code block) **or** the `.b64` file.
3. A short summary: what the add-on does, target game version, `min_engine_version` (and whether that is verified), module versions with the date checked, achievement and experiment status, the Trader Ledger asset (source: repo copy or embedded copy; SHA-256 verified; what the ledger does in this add-on), any deviations from this file (for example a script teleport), the `build_payload.py` result, and verification status ("source created and packaged, not tested in game").
4. Next steps:
   - GitHub, Actions, **Create OneBlock Add-on from Base64**, Run workflow.
   - Enter the map name and paste the base64. **If the map folder already exists from an earlier run, set overwrite to true.**
   - If the build fails, paste the error log (and the relevant part of the script in `scripts/`) back to the agent so it can fix the payload (Section 12).
   - Download the Creative world from the run's artifacts or from `MCPEDL/maps/<Map-Name>/`, then test it in Minecraft.
