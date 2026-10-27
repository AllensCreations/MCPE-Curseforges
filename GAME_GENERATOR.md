# Game Generator (AI Agent Instructions) - v6

Send this file to an AI agent together with your idea. The agent builds a complete project and returns it as **one line of base64** (inline, or as a `.b64` file if long). You paste it into the GitHub workflow **Create Project from Base64**, which puts it in the right `MCPEDL/` folder and builds the worlds that type needs.

If you can read the repository AllensCreations/MCPE-Curseforges, read `INSTRUCTIONS.md`, `README_GUIDELINES.md`, **`scripts/build_payload.py`** (the checks), **`scripts/import_project_payload.py`** and **`scripts/build_test_world.py`** first. The scripts are the real source of truth: if this file and a script disagree, the script wins, and you tell the user what differs. If you cannot read the repo, this file is self-sufficient: Section 8 contains the full packaging script.

**What changed in v6**
- **The Controller breaks in Survival.** Start and Restart use up the Controller unless the player is in Creative; End never does. Creative players always keep it.
- **`give_controller` function** ships with every Controller script (`/function give_controller`) so a broken Controller can be replaced.
- **Better Controller form:** it shows the game state and whether the Controller will be kept.
- **No comments in scripts.** Code, functions and JSON ship without comments; the checker warns about them.
- The checker verifies the Creative check, the break logic and the give function.

**What changed in v5**
- **One generator for three types: addon, map, script.** Step 0 asks which one.
- **Scripts get a Controller item** (your `pixel_controller.png`, shipped as `controller.png`) that opens a Start / Restart / End form.
- **Scripts get a test world**: `test_world.json` lists the add-ons to include, and the workflow builds `<Name> - Test.mcworld`.
- The importer now runs the same check code as `build_payload.py`, so passing the script means passing the import.

---

## 0. First: ask the type

If the user has not already said it, ask exactly this one question and wait for the answer:

> What do you want to make: **addon**, **map** (OneBlock), or **script** (a mini-game or challenge with a Controller and a test world)?

Do not guess the type from the idea. Do not continue until you have it. Then follow Sections 1 to 3, the one section for that type (4, 5, or 6), and Sections 7 to 11. Ask at most one more question, and only if the answer would change what you build.

| Type | Folder it lands in | Extra files it needs |
|---|---|---|
| addon | `MCPEDL/new_addons/<Name>/` | none; optional `test_world.json` |
| map | `MCPEDL/maps/<Name>/` | void cleaner, setup function, Trader Ledger (Section 5) |
| script | `MCPEDL/script/<Name>/` | Controller, `give_controller` function, `test_world.json` (Section 6) |

---

## 1. Hard rules for the agent (all types)

- **Never write base64 by hand.** Create the files, build the ZIP, and encode it by actually running code (Section 8). If you cannot run code, stop and say so; output the file tree with full contents plus the script and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Separate verified facts from assumptions.
- Never claim an in-game test. Building the ZIP proves structure only.
- Look up the **latest stable** Minecraft Bedrock release and **latest stable** `@minecraft/server` and `@minecraft/server-ui` versions from the official Minecraft Creator documentation at the time of the work. Do not use remembered versions. No preview/beta/RC unless a requested feature requires it, and then say so in the README. Record the date you checked.
- `min_engine_version` is the lowest game version the implementation needs, as a 3-number array. If you cannot confirm which game version first shipped the module version you use, say so.
- Source priority: the project's own files, then Mojang Bedrock Samples, then official Creator Documentation, then Minecraft Wiki, then Bedrock Wiki.
- **Art:** no AI-generated images, ever. The Trader Ledger (maps) and Controller (scripts) icons come only from the repo copy or the copy embedded in Section 8. For any other texture use real vanilla texture names, user-supplied textures, or omit the icon.
- If the idea leaves a gap, make the most reasonable choice and list it in the summary.
- Shell tip: the environment may be plain `sh`, so do not use brace expansion like `mkdir -p a/{b,c}`. After creating files, list them and confirm they exist.
- Never write comments in `.js`, `.mcfunction` or `.json` files, and keep code short and self-explanatory. Explanations belong in your reply, not in the files.
- Prefer event-driven logic over per-tick polling, broad entity searches, or block scans.

---

## 2. What the agent delivers

A ZIP whose **root** is the project folder contents (one wrapping folder is tolerated). Everything is built in `build/<Name>/`:

```
project.json          REQUIRED, all types: {"type": "addon|map|script", "name": "Display Name"}
README.md  DESCRIPTION.md  CHANGELOG.md
test_world.json       script: REQUIRED. addon: optional. map: do not ship.
behavior_pack/manifest.json
behavior_pack/...     functions/ (scripts with a Controller also need give_controller.mcfunction) items/ blocks/ entities/ recipes/ loot_tables/ texts/ scripts/main.js
resource_pack/        map and script: REQUIRED. addon: optional.
```

Do not ship `oneblock.json` (the importer writes it for maps), `LOCK` files (the importer writes them for add-ons), or `project.json` for a different type than you are building.

**Never include:** world data (`db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`), `.mcworld`/`.mcpack`/`.mcaddon`/`.zip` files, symlinks, or any `Mcpeworlds/...` path. Allowed types: `.json .js .mcfunction .md .txt .lang .png .jpg .jpeg .tga .ogg`. Limits: 500 files, 5 MB per file, 25 MB total, **48,000 bytes for the ZIP** (about 64,000 base64 characters, just under the 65,535-character cap of a workflow text input; bigger payloads go through a `.b64` file).

The importer also rejects any folder or file named exactly `db`, so never name a folder that.

---

## 3. Manifests (all types)

Applies to `behavior_pack/manifest.json` and, when present, `resource_pack/manifest.json`.

- `format_version`: 2. `header.min_engine_version` is a 3-number array.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`: one terminal version suffix equal to `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` **exactly once**. Keep attribution out of the name.
- Fresh, valid, unique UUIDs (v4) for every header and module. Never reuse one.
- If a resource pack exists, the behavior pack's `dependencies` includes `{ "uuid": "<resource pack header.uuid>", "version": [x, y, z] }` with the matching version.
- Script modules: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`, and dependencies written as `{ "module_name": "@minecraft/server", "version": "<latest stable string>" }`. Add `@minecraft/server-ui` when the pack uses forms (always for the Controller).
- No experiments unless the feature truly needs one; name it in the README if so.

Resource pack template:

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

---

## 4. Type: addon

- Behavior pack required; resource pack optional. No void cleaner, no ledger, no controller.
- If you ship `functions/tick.json`, every name in it must exist as `functions/<n>.mcfunction`.
- A `test_world.json` is optional. Add one when the user wants a test world for the add-on (Section 6 describes the format).
- The importer writes the `LOCK` markers; do not create them.

---

## 5. Type: map (OneBlock)

The map must work in any database-free void world. It must not depend on specific terrain, a database, or world settings.

**Required files** (the script installs the three ledger files if missing):

```
behavior_pack/functions/tick.json              {"values": ["void_cleaner", "oneblock_tick"]}  void_cleaner FIRST
behavior_pack/functions/void_cleaner.mcfunction
behavior_pack/functions/oneblock_setup.mcfunction
behavior_pack/items/trader_ledger.json
resource_pack/textures/item_texture.json
resource_pack/textures/items/trader_ledger.png
```

1. `tick.json` is valid JSON with a non-empty `values` list, `void_cleaner` first, and every name exists as a `.mcfunction`.
2. `void_cleaner.mcfunction` has this exact line as its **first command**, on its own line, no trailing spaces:
   ```
   execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
   ```
3. `oneblock_setup.mcfunction` only has to exist. Keep it harmless and idempotent (for example, creating a scoreboard objective). Do not list it in `tick.json`. Say in the README it is a manual or optional function.
4. **Trader Ledger** is mandatory and comes only from the repo copy or Section 8. It is `Mcpeworlds/assets/resources_pack/textures/items/trader_ledger.png`, a 32 x 32 RGBA PNG (a small brown ledger book with a green bookmark). Ship it as `trader_ledger.png`; `item_texture.json` points to that name without `.png`. The item identifier stays `allenscreations:trader_ledger`; you may change its display name. Never redraw, recolor, resize, or re-encode it, and never copy the whole `Mcpeworlds/assets/` folder.
5. The ledger's role follows the idea. The Dirtbound reference map makes it the only way to open a Script API shop menu (`give_trader.mcfunction` gives it, and the script restores a missing one on join). If the idea gives it no role, still ship it and say so in the summary.

**Pipeline** (Dirtbound reference design) unless the user specifies otherwise. `void_cleaner.mcfunction` runs every tick, but each command is guarded by `tag=!void_cleaned`, in this order: (1) the required Y=-64 line above; (2) clear the starting area if needed; (3) teleport the untagged player to spawn (the only function-side teleport); (4) place Bedrock under the core; (5) place a placeholder at the core only if empty; (6) set world spawn.

- Protect the core from later joiners: any clear of the core area must be skipped once the core exists (for example `unless block <bedrock position> bedrock`).
- `oneblock_tick` may restore only missing Bedrock, and only if a player already has `void_cleaned`. It must not reset spawn, teleport players, or place or replace the core.
- If a Script API owns the core block, break rewards, and progression, it waits until a player has `void_cleaned` before replacing the placeholder.
- Dirtbound coordinates: core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. If the user gives others, use theirs and make sure any `fill` covers what it claims to clear.
- A script teleport (for example a boundary guard) is allowed only in script; state it in the summary and keep the function-side pipeline unchanged. If an idea cannot work with the `void_cleaner`-first pipeline, say so instead of silently changing it.

---

## 6. Type: script

A script is a mini-game or challenge driven by the Script API. It works in any world; it does not depend on specific terrain.

**Required files** (the script installs the five Controller files if missing):

```
behavior_pack/manifest.json                    script module + @minecraft/server + @minecraft/server-ui
behavior_pack/scripts/main.js
behavior_pack/items/controller.json
behavior_pack/functions/give_controller.mcfunction   exact line: give @s allenscreations:controller
resource_pack/manifest.json
resource_pack/textures/item_texture.json       entry "controller" -> "textures/items/controller"
resource_pack/textures/items/controller.png    16 x 16, from the repo or Section 8, never redrawn
test_world.json
```

**The Controller.** Every script ships the repo's Controller icon (the user's `pixel_controller.png`, 16 x 16, shipped as `controller.png`) as item `allenscreations:controller`. Using it opens a form with exactly three buttons: **Start**, **Restart**, **End**. The user can opt out with `"controller": false` in `project.json`; then none of the Controller files are needed.

- **Survival breaks it, Creative keeps it.** Start and Restart leave the game running, so they consume the Controller from the player's selected slot unless `getGameMode()` is `GameMode.Creative`. End never consumes it. After it breaks, End and Restart need a fresh one.
- **Getting a new one.** `give_controller.mcfunction` (`/function give_controller`, needs cheats) is always shipped. The item also stays in the creative inventory (`menu_category`). Say in the README and summary that a Survival-only world without cheats can get stuck, because the user chose this behavior.
- **Giving it.** The script gives it on a player's first spawn when they do not already carry one, and only if the game is not `running` (Creative players always get one). Game state (`idle`, `running`, `ended`) lives in a world dynamic property so it survives rejoining.
- **The form** shows the state and a one-line note on whether the Controller will be kept. Keep the three labels `"Start"`, `"Restart"`, `"End"` exactly.

**Controller texture pack (resource pack).** The icon is `Mcpeworlds/assets/resources_pack/textures/items/controller.png` in the repo, a 16 x 16 PNG. The importer compares your copy to that file byte for byte.

- Never draw, recolor, resize or re-save it, and never write its base64 by hand. Running `build_payload.py` installs it for you as `resource_pack/textures/items/controller.png`.
- The same run also creates `resource_pack/textures/item_texture.json` (`atlas.items`, entry `controller` pointing to `textures/items/controller`), `behavior_pack/items/controller.json` (identifier `allenscreations:controller`, icon `controller`, display name `Controller`, stack size 1) and `behavior_pack/functions/give_controller.mcfunction`. It never overwrites an existing PNG.
- You still write `resource_pack/manifest.json` yourself (Section 3 template, fresh UUIDs, same version as the behavior pack) and add its dependency to the behavior pack manifest, plus `@minecraft/server-ui`.
- Do not copy anything else from `Mcpeworlds/assets/`. Do not ship a resource pack for a script with `"controller": false` unless it has its own textures.
- If the script needs other textures, add them next to the Controller icon and extend `item_texture.json` without removing the `controller` entry.

Starting point for `main.js` (adapt it and put your game logic inside `startGame`, `restartGame` and `endGame`; confirm every member against the stable module versions you chose, including `getGameMode()` and `GameMode`; do not add comments):

```js
import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const CONTROLLER_ID = "allenscreations:controller";
const STATE_KEY = "game_state";

const getState = () => {
  const v = world.getDynamicProperty(STATE_KEY);
  return typeof v === "string" ? v : "idle";
};
const setState = (s) => world.setDynamicProperty(STATE_KEY, s);
const isCreative = (player) => player.getGameMode() === GameMode.Creative;
const containerOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

function startGame() {
  setState("running");
  world.sendMessage("Game started.");
}
function endGame() {
  setState("ended");
  world.sendMessage("Game ended.");
}
function restartGame() {
  if (getState() === "running") endGame();
  startGame();
}

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
  const slot = player.selectedSlotIndex;
  if (inv?.getItem(slot)?.typeId !== CONTROLLER_ID) return;
  inv.setItem(slot, undefined);
  player.playSound("random.break");
  player.sendMessage("The Controller broke.");
}

async function openController(player, attempt = 0) {
  const state = getState();
  const note = isCreative(player) ? "Creative: the Controller is kept." : "Start and Restart use up the Controller.";
  const form = new ActionFormData()
    .title("Controller")
    .body(`State: ${state}\n${note}`)
    .button("Start")
    .button("Restart")
    .button("End");
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
    if (state === "running") {
      player.sendMessage("Already running.");
      return;
    }
    startGame();
    consumeController(player);
  } else if (res.selection === 1) {
    restartGame();
    consumeController(player);
  } else if (res.selection === 2) {
    if (state === "running") endGame();
    else player.sendMessage("Nothing to end.");
  }
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === CONTROLLER_ID) openController(source);
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn) return;
  if (isCreative(player) || getState() !== "running") giveController(player);
});
```

**The test world.** `test_world.json` is required for scripts (use an empty list if no add-ons are wanted) and optional for add-ons:

```json
{ "mode": "Creative", "include_addons": ["Magnetic-Satchel", "Mining-Helmet"] }
```

- `mode` is `Creative`, `Survival`, or `Hardcore` (default `Creative`).
- `include_addons` holds folder names that already exist under `MCPEDL/addons/` or `MCPEDL/new_addons/`, at most 10, no duplicates. The importer rejects a name that does not exist. Use only add-ons the user named or that the idea clearly needs; if you cannot verify a name exists, ask the user once.
- The workflow builds `<Name> - Test.mcworld` into the project folder with the script and every listed add-on installed. It fails on duplicate pack UUIDs or an unresolved pack dependency.
- The README must not claim the `.mcworld` exists; it is added after the build. In the summary, say which add-ons are included and why.
- The test world uses the void foundation of the chosen mode. If the script needs terrain, build it from script or functions, not from world data.

---

## 7. Recipes and documentation (all types)

- Every custom crafting recipe needs the unlock the recipe type requires: `"unlock": { "context": "AlwaysUnlocked" }` (array-style recipe formats use `"unlock": [{ "context": "AlwaysUnlocked" }]`). Do not mix schemas; compare against Bedrock Samples. The importer rejects any file in `behavior_pack/recipes/` without `AlwaysUnlocked`.
- `README.md`: short, download-focused. Title, one-paragraph description, install note. **No download links and no claims that `.mcworld` archives exist.** Include one achievement line using exactly one of *Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*, an experiments line (for example "No experiment requirement detected in the inspected files."), and the sentence "Source created, not tested in game." For a map, mention the Trader Ledger; for a script, mention the Controller.
- `DESCRIPTION.md`: player-facing features. Only features that exist in the files. Never mention `Script API` or `@minecraft/` modules. Use in-game display names, no code blocks.
- `CHANGELOG.md`: starts with the first version entry.

---

## 8. `build_payload.py` v6 (run this, do not hand-write)

One script does the whole job: installs missing Trader Ledger or Controller files, runs every check, builds the ZIP, writes `payload.b64` (always one line) and round-trips it. The repo's importer imports this same file.

1. Create the project under `build/<Name>/` using the Section 2 layout, including `project.json`.
2. Save the script below as `build_payload.py` next to `build/`.
3. Run `python build_payload.py build/Name`. Add `--check-only` to test without building.
4. Fix every failure it prints and run it again. Paste the final output (SELF-TEST PASSED and BUILD OK) into your reply. It proves structure only.
5. Deliver `payload.b64`: one single line, no line breaks, spaces or code fences. If the ZIP is under 48,000 bytes you may paste it inline; otherwise deliver the file and tell the user to commit it to `MCPE-Curseforges/MCPEDL/incoming/<n>.b64` and pass that path as `payload_file`. Never retype it from memory.

```python
#!/usr/bin/env python3
"""Project payload builder v6 for AllensCreations/MCPE-Curseforges.

One script for all three project types: addon, map (OneBlock), script.
It installs the mandatory repo assets that are missing, runs every structural check,
builds the ZIP, writes payload.b64 (one line) and round-trips it.
scripts/import_project_payload.py imports this same file, so the agent-side checks and
the repo-side checks cannot drift apart.

Usage:  python build_payload.py build/Project-Name [--out payload.b64] [--check-only]
Needs build/Project-Name/project.json:  {"type": "addon|map|script", "name": "Display Name"}
Structural checks only: never proof that anything works in Minecraft.
Exit codes: 0 ok, 1 checks failed, 2 packaging or round-trip failed.
"""
import argparse, base64, hashlib, io, json, re, struct, sys, zipfile
from pathlib import Path, PurePosixPath

TYPES = ("addon", "map", "script")
MODES = ("Creative", "Survival", "Hardcore")
LEDGER_SHA256 = "fecc64905334511d97569611666ffa28a8941683a20e30ca5926ecb9ffd9c001"
LEDGER_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA/0lEQVR42mNgGAUDDBgJKTgy0eI/pZbY5J/AaQ8TLglbdan/tupS/6nhS3zmMA26KCj3Vkdx7bE7nymyoD1LDm90sBAyYNXKSrItDwtvJ6hmwKOAhViFfFJGRBv66dk58h3w5P2vwRkCMBDVXotTblllM+0dQAp45qnBEH8fVUy5wOn/3Qn7GOniAAYGBgYFP1kU/oNNjykLAXKCOdVCg4GBgYFh9okbIywNwAA2nw+9goiSYKZ5OYDPUeipnq5pQGr7DYK14eBLAzKCbIMzDZBSw5ECBn82JKZVQ5NmOawli56KyQGV0x4xHL75jHFoRQHCxXIU9w1w+X4UDAoAACWbTR1cQx13AAAAAElFTkSuQmCC"
CONTROLLER_SHA256 = "c2f833f915003f333991bc098df114f1765fc2b8ecd2ccda98b7d6128f2d234a"
CONTROLLER_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAQVJREFUOE9jZKAQMFKonwHdgP9EGgjXh2zAf8ln78D6n0sJMcDYMAORxUBsBgaI5TADwJqVUlLgDvj/4QWKYxgFJOD8e3PmgC0B6QcZANd8dNs6BmuvILBCkCJkADN81/QbDG6ZGmB5kCFwA6AmgvXADEEPj8dCaxlk3wUzrL15lsHw8HlUA0A2ILsAV2AyZl9i+D9VD9MFyP6PD/AA6285lAqma+xmg+mFG3ZghAM8EK2srMCSoMCCGQDTgMyHBe6xY8dQA1ExxAduOlQSwxcwS0AS99dsQQ0DmAEwk3GEwX+YIcgGgNSCoxJkCDEGwDTD0gHYADQbceURDHVUz0y4oh+nOABgcXsLMipB8AAAAABJRU5ErkJggg=="
ASSET_DIR = "Mcpeworlds/assets/resources_pack/textures/items"  # repo copies, used by the importer

LEDGER_TEXTURE = {"resource_pack_name": "dirtbound_kingdom", "texture_name": "atlas.items",
                  "texture_data": {"trader_ledger": {"textures": "textures/items/trader_ledger"}}}
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
CONTROLLER_ENTRY = {"textures": "textures/items/controller"}
CONTROLLER_ITEM = {
    "format_version": "1.20.80",
    "minecraft:item": {
        "description": {"identifier": "allenscreations:controller", "menu_category": {"category": "items"}},
        "components": {
            "minecraft:max_stack_size": 1,
            "minecraft:icon": {"textures": {"default": "controller"}},
            "minecraft:display_name": {"value": "Controller"},
            "minecraft:use_animation": "spyglass",
            "minecraft:use_modifiers": {"use_duration": 0.1, "movement_modifier": 1},
        },
    },
}
GIVE_LINE = "give @s allenscreations:controller"
CLEANER = "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air"
ATTRIBUTION = "by AllensCreations"
NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
UUID_V4 = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$", re.I)
TITLE = re.compile(r"^.+ \(v(\d+)\.(\d+)\.(\d+)\)$")
ALLOWED = {".json", ".js", ".mcfunction", ".md", ".txt", ".lang", ".png", ".jpg", ".jpeg", ".tga", ".ogg"}
BLOCKED = (".mcworld", ".mcpack", ".mcaddon", ".zip")
MAX_FILES, MAX_FILE, MAX_TOTAL, ZIP_LIMIT = 500, 5 * 1024 * 1024, 25 * 1024 * 1024, 48000
ACHIEVEMENT = ("likely achievement-friendly", "not achievement-friendly", "unknown / needs confirmation")
COMMON_REQUIRED = ("project.json", "README.md", "DESCRIPTION.md", "CHANGELOG.md", "behavior_pack/manifest.json")
MAP_REQUIRED = ("resource_pack/manifest.json", "behavior_pack/functions/tick.json",
                "behavior_pack/functions/void_cleaner.mcfunction", "behavior_pack/functions/oneblock_setup.mcfunction",
                "behavior_pack/items/trader_ledger.json", "resource_pack/textures/item_texture.json",
                "resource_pack/textures/items/trader_ledger.png")
CONTROLLER_REQUIRED = ("resource_pack/manifest.json", "behavior_pack/items/controller.json",
                       "resource_pack/textures/item_texture.json", "resource_pack/textures/items/controller.png",
                       "behavior_pack/functions/give_controller.mcfunction")


def _png(b64, sha):
    data = base64.b64decode(b64, validate=True)
    assert hashlib.sha256(data).hexdigest() == sha, "embedded PNG is corrupt"
    return data


def read_project(root):
    try:
        return json.loads((Path(root) / "project.json").read_text(encoding="utf-8-sig"))
    except Exception:
        return None


def wants_controller(pj):
    return isinstance(pj, dict) and pj.get("type") == "script" and pj.get("controller", True) is not False


def _write_json(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def _install_icon(root, key, png_bytes, entry, label, base_texture):
    png = root / f"resource_pack/textures/items/{key}.png"
    if not png.exists():
        png.parent.mkdir(parents=True, exist_ok=True)
        png.write_bytes(png_bytes)
        print(f"installed  {png.relative_to(root).as_posix()}")
    t = root / "resource_pack/textures/item_texture.json"
    if not t.exists():
        _write_json(t, base_texture)
        print("installed  resource_pack/textures/item_texture.json")
        return
    try:
        data = json.loads(t.read_text(encoding="utf-8-sig"))
    except Exception:
        return  # run_checks reports invalid JSON
    if data.get("texture_name") != "atlas.items" or data.get("texture_data", {}).get(key) != entry:
        data["texture_name"] = "atlas.items"
        data.setdefault("texture_data", {})[key] = entry
        _write_json(t, data)
        print(f"repaired   item_texture.json {key} entry")


def install_assets(root):
    """Create the mandatory icon + item files if missing. Never overwrites an existing PNG."""
    pj = read_project(root)
    if not isinstance(pj, dict):
        return
    if pj.get("type") == "map":
        _install_icon(root, "trader_ledger", _png(LEDGER_PNG_B64, LEDGER_SHA256),
                      LEDGER_TEXTURE["texture_data"]["trader_ledger"], "ledger", LEDGER_TEXTURE)
        i = root / "behavior_pack/items/trader_ledger.json"
        if not i.exists():
            _write_json(i, LEDGER_ITEM)
            print("installed  behavior_pack/items/trader_ledger.json")
    elif wants_controller(pj):
        base = {"resource_pack_name": "allenscreations", "texture_name": "atlas.items",
                "texture_data": {"controller": CONTROLLER_ENTRY}}
        _install_icon(root, "controller", _png(CONTROLLER_PNG_B64, CONTROLLER_SHA256), CONTROLLER_ENTRY, "controller", base)
        i = root / "behavior_pack/items/controller.json"
        if not i.exists():
            _write_json(i, CONTROLLER_ITEM)
            print("installed  behavior_pack/items/controller.json")
        g = root / "behavior_pack/functions/give_controller.mcfunction"
        if not g.exists():
            g.parent.mkdir(parents=True, exist_ok=True)
            g.write_text(GIVE_LINE + "\n", encoding="utf-8")
            print("installed  behavior_pack/functions/give_controller.mcfunction")


def _png_size(d):
    if d[:8] != b"\x89PNG\r\n\x1a\n" or len(d) < 24:
        return None
    return struct.unpack(">II", d[16:24])


def run_checks(root, repo_root=None, folder=None):
    """Return (fails, warns, file_count, total_bytes).
    repo_root (importer only): compare icons to the repo copies and verify test_world includes exist.
    folder (importer only): the folder name the project will get, so it cannot include itself."""
    root = Path(root)
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

    pj = jload("project.json")
    ptype = pj.get("type") if isinstance(pj, dict) else None
    check(ptype in TYPES, f"project.json: type must be one of {', '.join(TYPES)}")
    if isinstance(pj, dict):
        check(isinstance(pj.get("name"), str) and bool(pj["name"].strip()), "project.json needs a non-empty name")
        check(pj.get("controller", True) in (True, False), "project.json: controller must be true or false")
    strict = {"project.json", "behavior_pack/manifest.json", "resource_pack/manifest.json", "behavior_pack/functions/tick.json",
              "resource_pack/textures/item_texture.json", "behavior_pack/items/trader_ledger.json",
              "behavior_pack/items/controller.json", "test_world.json", "oneblock.json"}

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
        if low.suffix == ".json" and rel not in strict and not rel.startswith("behavior_pack/recipes/"):
            jload(rel, strict=False)
    check(total <= MAX_TOTAL, f"total {total} bytes (max 25 MB)")
    for rel in COMMON_REQUIRED:
        check((root / rel).is_file(), f"missing required file: {rel}")
    controller = wants_controller(pj)
    if ptype == "map":
        for rel in MAP_REQUIRED:
            check((root / rel).is_file(), f"missing required file: {rel}")
    if controller:
        for rel in CONTROLLER_REQUIRED:
            check((root / rel).is_file(), f"missing required file: {rel}")
    if ptype == "script":
        check((root / "behavior_pack/scripts/main.js").is_file(), "missing required file: behavior_pack/scripts/main.js")
        check((root / "test_world.json").is_file(), "missing required file: test_world.json (scripts always get a test world)")

    # oneblock.json is optional in the payload (the importer writes it for maps); if present it must agree
    if (root / "oneblock.json").is_file() and ptype == "map":
        cfg = jload("oneblock.json")
        if isinstance(cfg, dict):
            check(cfg.get("enabled") is True, "oneblock.json enabled must be true")
            if isinstance(pj, dict):
                check(cfg.get("name") == pj.get("name"), "oneblock.json name must equal project.json name")

    # tick.json: required for maps, validated whenever present
    tick_p = root / "behavior_pack/functions/tick.json"
    if ptype == "map" or tick_p.is_file():
        tick = jload("behavior_pack/functions/tick.json")
        vals = (tick or {}).get("values")
        check(isinstance(vals, list) and bool(vals), "tick.json needs a non-empty values list")
        if isinstance(vals, list) and vals:
            if ptype == "map":
                check(vals[0] == "void_cleaner", "tick.json: first entry must be void_cleaner")
            for v in vals:
                check((root / f"behavior_pack/functions/{v}.mcfunction").is_file(), f"tick.json names {v} but its .mcfunction is missing")
            if "oneblock_setup" in vals:
                warns.append("oneblock_setup is listed in tick.json and will run every tick; intended?")
    if ptype == "map":
        cl = root / "behavior_pack/functions/void_cleaner.mcfunction"
        if cl.is_file():
            lines = cl.read_text(encoding="utf-8").splitlines()
            check(CLEANER in lines, "void_cleaner.mcfunction lacks the exact required fill line")
            cmds = [x for x in lines if x.strip() and not x.lstrip().startswith("#")]
            check(bool(cmds) and cmds[0] == CLEANER, "the required fill line must be the first command")

    uuids, versions, huuid, bpm = [], {}, {}, {}
    labels = ["behavior_pack"] + (["resource_pack"] if (root / "resource_pack/manifest.json").is_file() else [])
    for label in labels:
        m = jload(f"{label}/manifest.json")
        if not isinstance(m, dict):
            continue
        if label == "behavior_pack":
            bpm = m
        check(m.get("format_version") == 2, f"{label}: format_version must be 2")
        h = m.get("header") or {}
        uuid, ver, name, desc = h.get("uuid"), h.get("version"), h.get("name", ""), h.get("description", "")
        check(isinstance(uuid, str) and bool(UUID_V4.match(uuid)), f"{label}: header.uuid missing or not a v4 UUID")
        check(isinstance(ver, list) and len(ver) == 3 and all(isinstance(x, int) for x in ver), f"{label}: header.version must be [x,y,z]")
        mev = h.get("min_engine_version")
        if not (isinstance(mev, list) and len(mev) == 3 and all(isinstance(x, int) for x in mev)):
            warns.append(f"{label}: header.min_engine_version should be a 3-number array")
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
            if mod.get("type") == "script":
                entry = mod.get("entry")
                check(isinstance(entry, str) and (root / label / entry).is_file(), f"{label}: script module entry file missing")
                check(mod.get("language") == "javascript", f"{label}: script module language must be javascript")
        versions[label], huuid[label] = ver, uuid
        if label == "resource_pack":
            check(any(x.get("type") == "resources" for x in mods), "resource_pack needs a 'resources' module")
    check(len(uuids) == len(set(uuids)), "UUIDs must all be unique (headers and modules)")
    if "resource_pack" in versions:
        check(versions.get("behavior_pack") == versions.get("resource_pack"), "behavior and resource pack versions must match")
        dep = [d for d in bpm.get("dependencies") or [] if d.get("uuid") == huuid.get("resource_pack")]
        check(bool(dep), "behavior pack must depend on the resource pack header.uuid")
        if dep:
            check(dep[0].get("version") == versions.get("resource_pack"), "resource pack dependency version must match")
    modnames = {}
    for d in bpm.get("dependencies") or []:
        if "module_name" in d:
            modnames[d["module_name"]] = d.get("version")
            check(isinstance(d.get("version"), str) and bool(d.get("version")), f"dependency {d['module_name']} needs a version string")
        if any(w in str(d.get("version", "")).lower() for w in ("beta", "rc", "preview")):
            warns.append(f"preview/beta dependency {d.get('module_name')}: allowed only if a requested feature needs it; say so in the README")
    has_script = any(x.get("type") == "script" for x in bpm.get("modules") or [])
    if ptype == "script":
        check(has_script, "script project: behavior_pack manifest needs a script module")
    if has_script:
        check("@minecraft/server" in modnames, "script module needs a @minecraft/server dependency")
    if controller:
        check("@minecraft/server-ui" in modnames, "controller needs a @minecraft/server-ui dependency")

    rec = root / "behavior_pack/recipes"
    for p in rec.glob("**/*.json") if rec.is_dir() else []:
        check(b"AlwaysUnlocked" in p.read_bytes(), f"{p.relative_to(root).as_posix()}: missing AlwaysUnlocked")

    def icon_checks(key, ident, item_rel, want_sha, size, asset):
        png = root / f"resource_pack/textures/items/{key}.png"
        if png.is_file():
            d = png.read_bytes()
            ref = (Path(repo_root) / ASSET_DIR / f"{key}.png") if repo_root else None
            if ref is not None:
                check(ref.is_file(), f"repo asset {ASSET_DIR}/{key}.png is missing")
                if ref.is_file():
                    check(d == ref.read_bytes(), f"{key}.png is not a byte-for-byte copy of the repo asset")
            else:
                check(hashlib.sha256(d).hexdigest() == want_sha, f"{key}.png is not a byte-for-byte copy (SHA-256 mismatch)")
            check(_png_size(d) == size, f"{key}.png must be a {size[0]}x{size[1]} PNG")
        its = jload("resource_pack/textures/item_texture.json") or {}
        check(its.get("texture_name") == "atlas.items", "item_texture.json: texture_name must be atlas.items")
        check(((its.get("texture_data") or {}).get(key) or {}).get("textures") == f"textures/items/{key}",
              f"item_texture.json: {key} entry missing or wrong path")
        item = (jload(item_rel) or {}).get("minecraft:item") or {}
        check((item.get("description") or {}).get("identifier") == ident, f"{item_rel}: identifier must be {ident}")
        icon = ((item.get("components") or {}).get("minecraft:icon") or {}).get("textures", {}).get("default")
        check(icon == key, f"{item_rel}: icon default must be {key}")

    if ptype == "map":
        icon_checks("trader_ledger", "allenscreations:trader_ledger", "behavior_pack/items/trader_ledger.json", LEDGER_SHA256, (32, 32), "ledger")
    if controller:
        icon_checks("controller", "allenscreations:controller", "behavior_pack/items/controller.json", CONTROLLER_SHA256, (16, 16), "controller")
        mj = root / "behavior_pack/scripts/main.js"
        if mj.is_file():
            js = mj.read_text(encoding="utf-8")
            check("allenscreations:controller" in js, "main.js never mentions allenscreations:controller")
            check("ActionFormData" in js, "main.js must open the controller with ActionFormData")
            for label in ("Start", "Restart", "End"):
                check(f'"{label}"' in js or f"'{label}'" in js, f"main.js: controller button '{label}' not found")
            check("getGameMode" in js and "GameMode.Creative" in js, "main.js: the controller must check GameMode.Creative with getGameMode()")
            check("setItem" in js and "selectedSlotIndex" in js, "main.js: Start/Restart must consume the controller outside Creative")
            if "setInterval" in js or "system.runInterval" in js:
                warns.append("main.js uses a repeating timer; confirm it is not a per-tick scan")

    gf = root / "behavior_pack/functions/give_controller.mcfunction"
    if controller and gf.is_file():
        check(GIVE_LINE in gf.read_text(encoding="utf-8").splitlines(), "give_controller.mcfunction must contain: " + GIVE_LINE)
    for rel in ("behavior_pack/scripts/main.js",):
        src = root / rel
        if src.is_file() and any(re.match(r"\s*(//|/\*)", ln) for ln in src.read_text(encoding="utf-8").splitlines()):
            warns.append(rel + ": remove comments (v6: no comments in scripts)")
    for fn in (root / "behavior_pack/functions").glob("**/*.mcfunction") if (root / "behavior_pack/functions").is_dir() else []:
        if any(ln.lstrip().startswith("#") for ln in fn.read_text(encoding="utf-8").splitlines()):
            warns.append(fn.relative_to(root).as_posix() + ": remove comments (v6: no comments in functions)")

    # test_world.json (required for scripts, optional for add-ons)
    tw_p = root / "test_world.json"
    if tw_p.is_file():
        if ptype == "map":
            warns.append("test_world.json is ignored for maps (maps already build Creative/Survival/Hardcore worlds)")
        tw = jload("test_world.json")
        if isinstance(tw, dict):
            check(tw.get("mode", "Creative") in MODES, f"test_world.json: mode must be one of {', '.join(MODES)}")
            inc = tw.get("include_addons", [])
            check(isinstance(inc, list) and len(inc) <= 10 and all(isinstance(x, str) and NAME_RE.match(x) for x in inc),
                  "test_world.json: include_addons must be a list of up to 10 add-on folder names")
            if isinstance(inc, list):
                check(len(inc) == len(set(inc)), "test_world.json: duplicate include_addons entry")
                if folder:
                    check(folder not in inc, "test_world.json: a project cannot include itself")
                if repo_root:
                    for n in inc:
                        ok = any((Path(repo_root) / "MCPEDL" / d / n / pk / "manifest.json").is_file()
                                 for d in ("addons", "new_addons") for pk in ("behavior_pack", "resource_pack"))
                        check(ok, f"test_world.json: add-on '{n}' not found under MCPEDL/addons or MCPEDL/new_addons")
            for k in tw:
                if k not in ("mode", "include_addons"):
                    warns.append(f"test_world.json: unknown key '{k}' ignored")
        elif tw is not None:
            fails.append("test_world.json must be a JSON object")

    readme = root / "README.md"
    if readme.is_file():
        low = readme.read_text(encoding="utf-8").lower()
        if "not tested in game" not in low:
            warns.append("README.md should state: source created, not tested in game")
        if "http://" in low or "https://" in low:
            warns.append("README.md contains a link: no download links allowed")
        if ".mcworld" in low:
            warns.append("README.md mentions .mcworld: archives are added after the build, do not claim them")
        if not any(a in low for a in ACHIEVEMENT):
            warns.append("README.md needs one achievement status line (Likely achievement-friendly / Not achievement-friendly / Unknown)")
    desc_p = root / "DESCRIPTION.md"
    if desc_p.is_file():
        dl = desc_p.read_text(encoding="utf-8").lower()
        if "script api" in dl or "@minecraft/" in dl:
            warns.append("DESCRIPTION.md must not mention Script API or @minecraft modules (README_GUIDELINES)")
    return fails, warns, len(files), total


def pack(root, out):
    root = Path(root)
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
    want = {p.relative_to(root).as_posix() for p in root.rglob("*") if p.is_file()}
    if back.testzip() is not None or names != want:
        print(f"ROUND-TRIP FAILED: {back.testzip()} / diff {sorted(names ^ want)}")
        sys.exit(2)
    print(f"ZIP bytes: {len(data)}   payload.b64 chars: {out.stat().st_size}   round-trip OK ({len(names)} files)")
    if len(data) > ZIP_LIMIT:
        print(f"ZIP is over {ZIP_LIMIT} bytes: do NOT paste it into the workflow. Deliver {out.name} as a file "
              "(commit to MCPEDL/incoming/<n>.b64 and use payload_file).")
    return len(data)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("project", help="e.g. build/Project-Name")
    ap.add_argument("--out", default="payload.b64")
    ap.add_argument("--check-only", action="store_true")
    a = ap.parse_args()
    root = Path(a.project)
    if not root.is_dir():
        sys.exit(f"Project folder not found: {root}")
    if read_project(root) is None:
        sys.exit('Missing or invalid project.json. Create it first: {"type": "addon|map|script", "name": "Display Name"}')
    install_assets(root)
    fails, warns, n, total = run_checks(root)
    for w in sorted(set(warns)):
        print("WARNING:", w)
    fails = [f for f in fails if f]
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

## 9. Final self-check before replying

`build_payload.py` already checks structure, manifests, UUIDs, dependencies, recipes, and the type-specific files. By hand, confirm only:

- [ ] You asked for (or were given) the type before building.
- [ ] The script printed SELF-TEST PASSED and BUILD OK, and the base64 came from `payload.b64`, not from typing.
- [ ] Module versions are latest stable, looked up on the date of the work, with the date recorded.
- [ ] README states achievement status, experiments, and "not tested in game".
- [ ] Map: `oneblock_setup.mcfunction` is harmless and idempotent, and the README says it is manual or optional.
- [ ] Script: the form has Start, Restart, End; the game logic is real (the template functions only send messages); Start/Restart consume the Controller outside Creative; each listed add-on exists.
- [ ] No comments in any script, function or JSON file.
- [ ] No file from `Mcpeworlds/assets/` other than the ledger or controller files was copied (no stray file named `1`).

---

## 10. If the build fails

Paste the workflow's error log back to the agent. Common messages and fixes:

| Message contains | Fix |
|---|---|
| `type must be one of` | `project.json` needs `"type": "addon"`, `"map"`, or `"script"`. |
| `File type not allowed: <path>` | Delete that file or use an allowed extension. |
| `World data must not be included` / `world data not allowed` | Remove `level.dat` or any folder/file named `db`. |
| `link files not allowed` | Remove `world_behavior_packs.json` / `world_resource_packs.json`. |
| `header.name must end with one (vX.Y.Z)` | Use `Name (v1.0.0)`, one suffix only. |
| `title version does not match header.version` | Make the title and `header.version` agree, in both packs. |
| `description needs 'by AllensCreations' exactly once` | Put it once in each description, never in the name. |
| `must depend on the resource pack header.uuid` | Add `{ "uuid": <resource pack header.uuid>, "version": [x,y,z] }` to the behavior pack dependencies. |
| `first entry must be void_cleaner` / `lacks the exact required fill line` | Fix `tick.json` / `void_cleaner.mcfunction` (Section 5). |
| `missing required file: ...` | Add the named file; see the list for your type. |
| `is not a byte-for-byte copy` | Use the repo or embedded PNG unchanged; never re-save it. |
| `main.js: controller button 'End' not found` | Keep the three labels `"Start"`, `"Restart"`, `"End"` in `main.js`. |
| `controller must check GameMode.Creative` / `must consume the controller` | Keep the Creative check and the consume step from the Section 6 template. |
| `give_controller.mcfunction must contain` | The file must have the line `give @s allenscreations:controller`. |
| `remove comments` | Strip comments from the named file (warning only). |
| `add-on '<x>' not found` | Fix the folder name in `test_world.json` or remove it. |
| `Duplicate pack UUID` / `depends on pack ... not included` | The included add-on clashes with or needs another pack: change the list. |
| `missing the AlwaysUnlocked unlock context` | Add the unlock to the recipe (Section 7). |
| `already exists. Re-run with overwrite enabled` | Set `overwrite` to true in the workflow. |

If the message is not listed, check the relevant script in `scripts/` and tell the user which rule it enforces.

---

## 11. Reply format

1. Type, and the suggested folder name (letters, numbers, `.` `_` `-`).
2. The base64 (one-line code block) **or** the `.b64` file.
3. A short summary: what it does, target game version, `min_engine_version` (and whether verified), module versions with the date checked, achievement and experiment status, the icon asset (Ledger or Controller: repo or embedded copy, hash verified), for a script the included add-ons, any deviations from this file, and the `build_payload.py` result.
4. Next steps:
   - GitHub, Actions, **Create Project from Base64**, Run workflow.
   - Enter the folder name and paste the base64. **If the folder already exists, set overwrite to true.**
   - Download the generated world from the run's artifacts or from the project folder and test it in Minecraft.
   - To change which add-ons a test world includes later, edit `test_world.json` and run **Build Test World**.
   - If the build fails, paste the error log back to the agent (Section 10).
