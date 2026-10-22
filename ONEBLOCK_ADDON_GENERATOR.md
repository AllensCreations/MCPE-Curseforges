# OneBlock Add-on Generator (AI Agent Instructions) - v2

Send this file to an AI agent together with your OneBlock idea. The agent builds a complete OneBlock add-on and returns it as **one line of base64** (inline, or as a `.b64` file if long). You paste that into the GitHub workflow **Create OneBlock Add-on from Base64**, which creates `MCPEDL/maps/<Map-Name>/` and builds the Creative, Survival, and Hardcore worlds from `Mcpeworlds/`.

If you can read the repository AllensCreations/MCPE-Curseforges, read `INSTRUCTIONS.md`, `README_GUIDELINES.md`, and **`scripts/build_oneblock_variants_from_template.py`** first. The script is the real source of truth: if this file and the script disagree, the script wins. If you cannot read the repo, the rules below are self-sufficient.

**What changed in v2:** the builder has hard requirements that v1 did not list (Section 3). A v1 payload failed the build for missing them.

---

## 1. Hard rules for the agent

- **Never write base64 by hand.** Create the files, build the ZIP, and encode it by actually running code (Section 9). If you cannot run code, stop and say so; output the file tree with full contents plus the packaging script and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Separate verified facts from assumptions.
- Never claim an in-game test. Building the ZIP proves structure only.
- Look up the **latest stable** Minecraft Bedrock release and **latest stable** `@minecraft/server` and `@minecraft/server-ui` versions from official Minecraft Creator documentation (or the Script API docs for the current release) at the time of the work. Do not use remembered versions. No preview/beta/RC unless a requested feature requires it, and then say so in the README.
- `min_engine_version` is the lowest game version the implementation needs, as a 3-number array (e.g. `[1, 26, 50]` for release 26.50). If you cannot confirm which game version first shipped the module version you use, say so.
- Source priority: the add-on's own files, then Mojang Bedrock Samples, then official Creator Documentation, then Minecraft Wiki, then Bedrock Wiki.
- No AI-generated images. Use real vanilla texture names, user-supplied textures, or omit icons.
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
├── scripts/main.js        (only if Script API is needed)
├── items/ blocks/ entities/ recipes/ loot_tables/ texts/   (as needed)
resource_pack/              (optional)
├── manifest.json
└── textures/ texts/ ...
```

**Never include:** world data (`db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`), `.mcworld`/`.mcpack`/`.mcaddon`/`.zip` files, or symlinks. Allowed types: `.json .js .mcfunction .md .txt .lang .png .jpg .jpeg .tga .ogg`. Limits: 500 files, 5 MB per file, 25 MB total, **48,000 bytes for the ZIP**.

---

## 3. Builder hard requirements (the build fails without these)

The builder (`verify_archive`) checks the finished world for all of the following. Treat each as mandatory.

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
4. **Manifests are valid:** each pack manifest has `header.uuid` and `header.version` (a list). The world links **only the behavior pack** (a resource pack is linked only if `resource_pack/manifest.json` exists). The builder writes the link files; never ship them.
5. **No LevelDB:** the world foundation is database-free. Never ship `db/` files.

**Local self-test (run it, do not skip):** before packaging, run a check that mirrors these rules against your build folder: required files exist, `tick.json` first value is `void_cleaner`, the exact cleaner line is present in `void_cleaner.mcfunction`, every `tick.json` function file exists, all JSON parses, manifest UUIDs are unique and valid. Report the result.

---

## 4. `oneblock.json`

```json
{
  "enabled": true,
  "name": "Display Name of the Map"
}
```

Only these fields. `name` is the display name; the folder name is chosen by the user in the workflow. World names become `<name> - Creative|Survival|Hardcore`.

---

## 5. Manifests

Applies to both `behavior_pack/manifest.json` and (if present) `resource_pack/manifest.json`.

- `format_version`: 2.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`: exactly one terminal version suffix, equal to `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` **exactly once**. Keep attribution out of the name.
- Fresh, valid, unique UUIDs (v4) for each header and module. Never reuse one.
- If a resource pack exists, the behavior pack's `dependencies` includes its `header.uuid` with a matching version.
- Script modules (`@minecraft/server`, `@minecraft/server-ui`) use the latest stable versions looked up in Section 1, never beta. Script module entry: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`.
- No experiments unless the feature truly needs one; name it in the README if so.

---

## 6. Mechanics requirements

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

## 7. Recipes

Every custom crafting recipe needs the unlock the recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

Array-style recipe formats use `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas; compare against Bedrock Samples. The importer rejects any file in `behavior_pack/recipes/` without `AlwaysUnlocked`.

---

## 8. Documentation files

- `README.md`: short and download-focused. Title, one-paragraph description, install note. **No download links and no claims that `.mcworld` archives exist** (the sync script adds them after the build). Include an "Achievements and experiments" line using exactly one of: *Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*, plus "No experiment requirement detected in the inspected files." or the experiment name. State **source created, not tested in game**.
- `DESCRIPTION.md`: player-facing features. Only features that exist in the files.
- `CHANGELOG.md`: starts with the first version entry.

---

## 9. Packaging (run this, do not hand-write)

1. Create the project under `build/<Map-Name>/` using the Section 2 layout.
2. Run the Section 3 self-test.
3. From the folder containing `build/`, run:

```python
import base64, io, pathlib, sys, zipfile

src = pathlib.Path("build/Map-Name")          # change Map-Name
buf = io.BytesIO()
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in sorted(src.rglob("*")):
        if p.is_file():
            z.write(p, p.relative_to(src).as_posix())   # forward slashes, no wrapping folder
data = buf.getvalue()
print("ZIP bytes:", len(data), file=sys.stderr)
if len(data) > 48000:
    sys.exit("ZIP too large for a workflow input. Deliver payload.b64 as a file.")
pathlib.Path("payload.b64").write_text(base64.b64encode(data).decode("ascii"))
```

4. The base64 is **one single line**: no line breaks, spaces, or code fences.
5. Decode it back and confirm the ZIP opens and contains the Section 3 files.
6. If you cannot print the full base64 reliably in chat, deliver `payload.b64` as a downloadable file instead of retyping it. Never retype it from memory. If the ZIP is over 48,000 bytes, the user commits the file to `MCPE-Curseforges/MCPEDL/incoming/<name>.b64` and passes that path to the workflow.

---

## 10. Final self-check before replying

- [ ] `oneblock.json` is valid JSON with `enabled` and `name`.
- [ ] `tick.json` is valid, lists `void_cleaner` first, and every listed function file exists.
- [ ] `void_cleaner.mcfunction` contains the exact required `fill -16 -64 -16 16 -64 16 air` line.
- [ ] `oneblock_setup.mcfunction` exists and is harmless.
- [ ] Both manifests: title `Name (vX.Y.Z)` matches `header.version`; same version in both packs; `by AllensCreations` exactly once; UUIDs valid and unique.
- [ ] If a resource pack exists, the behavior pack depends on its UUID.
- [ ] All recipes have `AlwaysUnlocked`.
- [ ] No world data, nested archives, or pack link files.
- [ ] Module versions are latest stable, looked up on the date of the work, with the date recorded.
- [ ] README states achievement status, experiments, and "not tested in game".
- [ ] The base64 came from running the packaging script and decodes back to a valid ZIP.

---

## 11. Reply format

1. Suggested map folder name (letters, numbers, `.` `_` `-`).
2. The base64 (one-line code block) **or** the `.b64` file.
3. A short summary: what the add-on does, target game version, `min_engine_version` (and whether that is verified), module versions with the date checked, achievement and experiment status, any deviations from this file (for example a script teleport), and verification status ("source created and packaged, not tested in game").
4. Next steps:
   - GitHub, Actions, **Create OneBlock Add-on from Base64**, Run workflow.
   - Enter the map name and paste the base64. **If the map folder already exists from an earlier run, set overwrite to true.**
   - If the build fails, paste the error log (and the relevant part of `scripts/build_oneblock_variants_from_template.py`) back to the agent so it can fix the payload.
   - Download the Creative world from the run's artifacts or from `MCPEDL/maps/<Map-Name>/`, then test it in Minecraft.
