# OneBlock Add-on Generator (AI Agent Instructions) - v3

**Version:** v3 Â· **Status:** Current

Send this file to an AI agent together with your OneBlock idea. The agent builds a complete OneBlock add-on and returns it as **one line of base64** (inline, or as a `.b64` file if long). You paste that into the GitHub workflow **Create OneBlock Add-on from Base64**, which creates `MCPEDL/maps/<Map-Name>/` and builds the Creative, Survival, and Hardcore worlds from `Mcpeworlds/`.

If you can read the repository AllensCreations/MCPE-Curseforges, read `INSTRUCTIONS.md`, `README_GUIDELINES.md`, and **`scripts/build_oneblock_variants_from_template.py`** first. The script is the real source of truth: if this file and the script disagree, the script wins. If you cannot read the repo, the rules below are self-sufficient.

**What changed in v3:** added Section 12 (shared repository assets, including `traders_ledger.png`). Section 3 gained an explicit self-test failure policy. Minor wording and consistency improvements throughout.

---

## 1. Hard rules for the agent

- **Never write base64 by hand.** Create the files, build the ZIP, and encode it by actually running code (Section 9). If you cannot run code, stop and say so; output the file tree with full contents plus the packaging script and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Separate verified facts from assumptions.
- Never claim an in-game test. Building the ZIP proves structure only.
- Look up the **latest stable** Minecraft Bedrock release and **latest stable** `@minecraft/server` and `@minecraft/server-ui` versions from official Minecraft Creator documentation (or the Script API docs for the current release) at the time of the work. Do not use remembered versions. No preview/beta/RC unless a requested feature requires it, and then say so in the README.
- `min_engine_version` is the lowest game version the implementation needs, as a 3-number array (e.g. `[1, 26, 50]` for release 1.26.50). If you cannot confirm which game version first shipped the module version you use, say so.
- Source priority: the add-on's own files, then Mojang Bedrock Samples, then official Creator Documentation, then Minecraft Wiki, then Bedrock Wiki.
- No AI-generated images. Use real vanilla texture names, user-supplied textures, repository-shared textures (Section 12), or omit icons.
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
â”œâ”€â”€ manifest.json
â”œâ”€â”€ functions/
â”‚   â”œâ”€â”€ tick.json
â”‚   â”œâ”€â”€ void_cleaner.mcfunction      (REQUIRED, see Section 3)
â”‚   â”œâ”€â”€ oneblock_setup.mcfunction    (REQUIRED, see Section 3)
â”‚   â”œâ”€â”€ oneblock_tick.mcfunction
â”‚   â””â”€â”€ ... other .mcfunction files
â”œâ”€â”€ scripts/main.js        (only if Script API is needed)
â”œâ”€â”€ items/ blocks/ entities/ recipes/ loot_tables/ texts/   (as needed)
resource_pack/              (optional)
â”œâ”€â”€ manifest.json
â””â”€â”€ textures/ texts/ ...
```

**Never include:** world data (`db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`), `.mcworld`/`.mcpack`/`.mcaddon`/`.zip` files, or symlinks. Allowed types: `.json .js .mcfunction .md .txt .lang .png .jpg .jpeg .tga .ogg`. Limits: 500 files, 5 MB per file, 25 MB total, **48,000 bytes for the ZIP**.

---

## 3. Builder hard requirements (the build fails without these)

The builder (`verify_archive`) checks the finished world for all of the following. Treat each as mandatory. **If the local self-test at the end of this section fails, stop and fix every issue before packaging. Do not deliver a ZIP that fails the self-test.**

1. **`behavior_pack/functions/tick.json` exists**, is valid JSON, has a non-empty `"values"` list, and **`void_cleaner` is the first entry**.

   ```json
   { "values": ["void_cleaner", "oneblock_tick"] }
   ```

   Every name listed must exist as `functions/<name>.mcfunction`.
2. **`behavior_pack/functions/void_cleaner.mcfunction` exists and contains this exact line** (character for character, on its own line, no trailing spaces):

   ```
   execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
   ```

   Put it as the first command. This is required even if your core is at a different height; it only clears a 33Ã—33 patch at the world's bottom layer (Y=âˆ’64). You may add more commands after it.
3. **`behavior_pack/functions/oneblock_setup.mcfunction` exists.** The builder only checks that the file exists. Its intended role is not documented, so keep it harmless and idempotent (for example, creating your scoreboard objective). Do **not** list it in `tick.json` unless you intentionally want it to run every tick. State in the README that it is a manual or optional setup function.
4. **Manifests are valid:** each pack manifest has `header.uuid` and `header.version` (a list). The builder writes the world's pack-link files; never ship them yourself.
5. **No LevelDB:** the world foundation is database-free. Never ship `db/` files.

**Local self-test (run it, do not skip):** before packaging, run a check that mirrors these rules against your build folder:

- Required files exist (`tick.json`, `void_cleaner.mcfunction`, `oneblock_setup.mcfunction`).
- `tick.json` first value is `void_cleaner`.
- The exact cleaner line is present in `void_cleaner.mcfunction`.
- Every function name in `tick.json` exists as a `.mcfunction` file.
- All JSON files parse without error.
- Manifest UUIDs are unique and valid (v4).
- Any shared asset required by the add-on is present (see Section 12).

Report the result inline. If any check fails, fix it and re-run before packaging.

---

## 4. `oneblock.json`

```json
{
  "enabled": true,
  "name": "Display Name of the Map"
}
```

Only these two fields. `name` is the display name; the folder name is chosen by the user in the workflow. World names become `<name> - Creative`, `<name> - Survival`, and `<name> - Hardcore`.

---

## 5. Manifests

Applies to both `behavior_pack/manifest.json` and (if present) `resource_pack/manifest.json`.

- `format_version`: 2.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`: exactly one terminal version suffix, matching `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` **exactly once**. Keep attribution out of the name.
- Fresh, valid, unique UUIDs (v4) for every `header` and `module` across both packs. Never reuse a UUID between packs or between runs.
- If a resource pack exists, the behavior pack's `dependencies` array must include the resource pack's `header.uuid` with a matching version array.
- Script modules (`@minecraft/server`, `@minecraft/server-ui`) use the latest stable versions looked up per Section 1, never beta. Script module entry fields: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`.
- No experiments unless the feature truly requires one; name the experiment in the README if so.

---

## 6. Mechanics requirements

The add-on must work in any database-free void world. It must not depend on specific terrain, a database, or world settings.

Use this pipeline (the Dirtbound reference design) unless the user specifies otherwise:

- `void_cleaner.mcfunction` runs every tick but each command is guarded by `tag=!void_cleaned`, in this order: (1) the required Y=âˆ’64 clear line from Section 3; (2) clear the starting area if needed; (3) teleport the untagged player to spawn (the only function-side player teleport); (4) place Bedrock under the core; (5) place a placeholder at the core only if the spot is empty; (6) set world spawn; (7) send a welcome notice; (8) add the `void_cleaned` tag **last**.
- **Protect the core from later joiners:** any clear of the core area must be skipped once the core exists (for example `unless block <bedrock_position> bedrock`), and the placeholder must only be placed if the spot is air. Otherwise a second player joining will wipe the island.
- `oneblock_tick` may restore only missing Bedrock, and only if a player already has `void_cleaned`. It must not reset spawn, teleport players, or place or replace the core.
- If a Script API owns the core block, break rewards, and progression, it waits until a player has `void_cleaned` before replacing the placeholder.
- Default coordinates: core `(0,0,0)`, Bedrock `(0,âˆ’1,0)`, spawn `(0,1,0)`. If the user provides other coordinates, use theirs and verify that any `fill` command covers what it claims to clear.
- Do not make a score-dependent command the only way an initial block is created.
- If the user's idea requires a player teleport from script (for example a boundary guard), allow it only in script, state it in the summary, and leave the function-side pipeline unchanged. If an idea cannot work with the `void_cleaner`-first pipeline, say so instead of silently changing it.
- Prefer event-driven logic over per-tick polling, broad entity searches, or block scans.

---

## 7. Recipes

Every custom crafting recipe needs the `unlock` field the recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

Array-style recipe formats use `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas; compare against Bedrock Samples. The importer rejects any file in `behavior_pack/recipes/` that omits `AlwaysUnlocked`.

---

## 8. Documentation files

- `README.md`: short and download-focused. Title, one-paragraph description, install note. **No download links and no claims that `.mcworld` archives exist** (the sync script adds them after the build). Include an "Achievements and experiments" line using exactly one of: *Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*, plus either "No experiment requirement detected in the inspected files." or the experiment name. State **source created, not tested in game**.
- `DESCRIPTION.md`: player-facing feature list. Only features that are present in the delivered files.
- `CHANGELOG.md`: starts with the first version entry.

---

## 9. Packaging (run this, do not hand-write)

1. Create the project under `build/<Map-Name>/` using the Section 2 layout.
2. Run the Section 3 self-test and fix any failures before continuing.
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
5. Decode it back and confirm the ZIP opens and contains the Section 3 required files.
6. If you cannot print the full base64 reliably in chat, deliver `payload.b64` as a downloadable file. Never retype it from memory. If the ZIP exceeds 48,000 bytes, the user commits the file to `MCPE-Curseforges/MCPEDL/incoming/<name>.b64` and passes that path to the workflow.

---

## 10. Final self-check before replying

- [ ] `oneblock.json` is valid JSON with `enabled` and `name`.
- [ ] `tick.json` is valid, lists `void_cleaner` first, and every listed function file exists.
- [ ] `void_cleaner.mcfunction` contains the exact required `fill -16 -64 -16 16 -64 16 air` line.
- [ ] `oneblock_setup.mcfunction` exists and is harmless/idempotent.
- [ ] Both manifests: title `Name (vX.Y.Z)` matches `header.version`; same version in both packs; `by AllensCreations` exactly once; all UUIDs valid, unique, and v4.
- [ ] If a resource pack exists, the behavior pack's `dependencies` includes its UUID with a matching version.
- [ ] All recipes have `AlwaysUnlocked`.
- [ ] No world data, nested archives, or pack-link files shipped.
- [ ] Module versions are latest stable, looked up on the date of the work, with the date recorded.
- [ ] README states achievement status, experiment status, and "not tested in game".
- [ ] Any shared repository asset required by this add-on is included (Section 12 checklist).
- [ ] The base64 came from running the packaging script and decodes back to a valid ZIP.

---

## 11. Reply format

1. Suggested map folder name (letters, numbers, `.` `_` `-` only).
2. The base64 (one-line code block) **or** the `.b64` file.
3. A short summary covering: what the add-on does; target game version; `min_engine_version` (and whether that version is verified); module versions with the lookup date; achievement and experiment status; any shared assets included (Section 12); any deviations from this file (e.g. a script teleport); and verification status ("source created and packaged, not tested in game").
4. Next steps:
   - GitHub â†’ Actions â†’ **Create OneBlock Add-on from Base64** â†’ Run workflow.
   - Enter the map name and paste the base64. **If the map folder already exists from an earlier run, set overwrite to true.**
   - If the build fails, paste the error log (and the relevant part of `scripts/build_oneblock_variants_from_template.py`) back to the agent so it can fix the payload.
   - Download the Creative world from the run's artifacts or from `MCPEDL/maps/<Map-Name>/`, then test it in Minecraft.

---

## 12. Shared repository assets

Some textures and other media live permanently in the repository at `Mcpeworlds/assets/resources_pack/textures/` and must be copied into the add-on's resource pack rather than recreated or omitted.

### 12.1 `traders_ledger.png`

**Source path in repo:** `Mcpeworlds/assets/resources_pack/textures/items/traders_ledger.png`

**Destination path in add-on:** `resource_pack/textures/items/traders_ledger.png`

**When to include:** include this file whenever the add-on uses any trader, shop, ledger, currency, or economy mechanic â€” for example a Wandering Trader reward, a custom trade item, a coin/gem economy, or any item that references the `traders_ledger` texture path. Do **not** include it for add-ons that have no trader or economy content.

**Rules:**

- Copy the file exactly; never regenerate, resize, or replace it with a different image.
- If the agent cannot access the repository at build time, it must stop and tell the user to supply the file manually before packaging. It must not substitute a placeholder PNG or omit the file silently.
- When the file is included, the resource pack `manifest.json` must exist (create it if it does not), and the behavior pack `dependencies` must reference the resource pack's UUID as required by Section 5.
- Add `traders_ledger.png present: yes` to the Section 11 summary.
- Add a checklist item to the Section 3 self-test: confirm `resource_pack/textures/items/traders_ledger.png` exists in the build folder.

### 12.2 Adding more shared assets in the future

To register a new shared asset, add a subsection here following the pattern of 12.1: source path, destination path, when to include, and any special rules. The agent treats every subsection under Section 12 as a mandatory rule.
