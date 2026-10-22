# OneBlock Add-on Generator (AI Agent Instructions)

Send this file to an AI agent together with your OneBlock idea. The agent builds a complete OneBlock add-on and returns it as **one line of base64**. You paste that line into the GitHub workflow **Create OneBlock Add-on from Base64**, which creates the project in `MCPEDL/maps/<Map-Name>/` and builds the Creative, Survival, and Hardcore worlds from `Mcpeworlds/`.

If you can read the repository AllensCreations/MCPE-Curseforges, read `INSTRUCTIONS.md` and `README_GUIDELINES.md` first; they win over this file. If you cannot, the rules below are self-sufficient.

---

## 1. Hard rules for the agent

- **Never write base64 by hand.** Language models cannot produce reliable base64 or ZIP bytes from memory. Create the files, build the ZIP, and encode it by actually running code (Section 8). If you cannot run code, stop and say so. Instead, output the file tree with every file's full contents and the packaging script, and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Separate verified facts from assumptions.
- Never claim an in-game test, function execution, or gameplay result. Building the ZIP proves structure only.
- Look up the **latest stable** Minecraft Bedrock release and **latest stable** `@minecraft/server` module version from the official Minecraft Creator documentation at the time of the work. Do not use remembered version numbers. Never use preview, beta, or RC versions unless a requested feature requires them, and then say so in the README.
- Set `min_engine_version` to the lowest game version the implementation actually needs.
- Source priority for vanilla identifiers, components, and formats: the add-on's own files, then Mojang Bedrock Samples (https://github.com/Mojang/bedrock-samples), then official Minecraft Creator Documentation, then Minecraft Wiki, then Bedrock Wiki. The wikis never override the first three.
- No AI-generated images. If you add a pack icon or item texture, derive it from real vanilla or user-supplied textures; otherwise omit it.

---

## 2. What the agent delivers

A ZIP archive, base64-encoded as a single line, whose **root** is the project folder contents (no wrapping folder needed; one wrapping folder is tolerated):

```
oneblock.json
README.md
DESCRIPTION.md
CHANGELOG.md
behavior_pack/
├── manifest.json
├── functions/
│   ├── tick.json
│   ├── void_cleaner.mcfunction
│   ├── oneblock_tick.mcfunction
│   └── ... other .mcfunction files
├── scripts/main.js        (only if Script API is needed)
├── items/ blocks/ entities/ recipes/ loot_tables/ texts/   (as needed)
resource_pack/              (only if textures, items, or lang need it)
├── manifest.json
└── textures/ texts/ ...
```

**Never include:** world data (`db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`), `.mcworld`/`.mcpack`/`.mcaddon`/`.zip` files, or symlinks. The world comes from `Mcpeworlds/`, and the builder writes the pack link files. The importer rejects any payload that includes these.

Allowed file types: `.json .js .mcfunction .md .txt .lang .png .jpg .jpeg .tga .ogg`. Limits: 500 files, 5 MB per file, 25 MB total, and **48,000 bytes for the ZIP itself** (see Section 8).

---

## 3. `oneblock.json`

```json
{
  "enabled": true,
  "name": "Display Name of the Map"
}
```

These are the only fields the builder is known to read. Do not add others. `name` is the display name; the folder name is chosen by the user in the workflow.

---

## 4. Manifests

Applies to both `behavior_pack/manifest.json` and `resource_pack/manifest.json`.

- `format_version`: 2.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`, for example `Dirtbound Kingdom (v1.0.0)`. Exactly one terminal version suffix, and it equals `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` **exactly once**. Keep attribution out of the name.
- Generate fresh, valid, unique UUIDs (version 4) for each pack header and each module. Never reuse a UUID.
- If a resource pack exists, the behavior pack's `dependencies` includes the resource pack's `header.uuid` with a matching version.
- Script API dependencies (`@minecraft/server`, `@minecraft/server-ui`) use the latest stable versions looked up in Section 1, never beta.
- Do not introduce experiments. Prefer a stable, non-experimental implementation that keeps the requested behavior. If something truly requires an experiment, say which one in the README.

---

## 5. Mechanics requirements

The OneBlock script must work in any world it is added to. It must not depend on a specific world's terrain, database, or settings. The world foundations in `Mcpeworlds/` are database-free void worlds.

**Pipeline requirement:** the current builder requires `tick.json` to list `void_cleaner` as its **first** entry. Use this structure unless the user specifies otherwise (it is the Dirtbound reference design):

- `void_cleaner.mcfunction` runs once per player, guarded by `tag=!void_cleaned`, in this order: clear the starting layer, teleport the untagged player to the spawn point (the only player teleport anywhere), place Bedrock under the core, place a placeholder at the core, set world spawn, send a notice, add the `void_cleaned` tag.
- `tick.json` lists `void_cleaner` before `oneblock_tick`.
- `oneblock_tick` may restore only missing Bedrock. It must not reset spawn, teleport players, or place or replace the core.
- If a Script API owns the core block, break rewards, and stage progression, it waits until the player has `void_cleaned` before replacing the placeholder.
- Dirtbound's coordinates are core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. If the user gives different coordinates, use theirs, and verify any `fill` volume covers the area it claims to clear.
- Do not make a score-dependent command the only path that creates an initial block unless scoreboard initialization is guaranteed.

Function files: every name listed in `tick.json` must exist as `behavior_pack/functions/<name>.mcfunction`. Prefer event-driven logic over per-tick polling, broad entity searches, or block scans.

If the user's idea cannot work with the `void_cleaner`-first pipeline, say so instead of silently changing it.

---

## 6. Recipes

Every custom crafting recipe must contain the unlock the recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

Array-style recipe formats use `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas. Compare the recipe type against Bedrock Samples before choosing syntax. The importer rejects any file in `behavior_pack/recipes/` without `AlwaysUnlocked`.

---

## 7. Documentation files

- `README.md`: short and download-focused. Title, one-paragraph description, install note. **Do not add download links or claim `.mcworld` archives exist**; the sync script adds those after the build. Include an "Achievements and experiments" line using exactly one of: *Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*, plus "No experiment requirement detected in the inspected files." or the experiment name. Never promise achievements stay enabled.
- `DESCRIPTION.md`: player-facing feature summary. Only describe features that exist in the files.
- `CHANGELOG.md`: starts with the first version entry.
- State the verification status honestly: **source created, not tested in game**.

---

## 8. Packaging (run this, do not hand-write)

1. Create the project under `build/<Map-Name>/` using the layout in Section 2.
2. Run this script from the folder that contains `build/`:

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
    sys.exit("ZIP too large for a workflow input. Shrink it or deliver payload.b64 as a file.")
pathlib.Path("payload.b64").write_text(base64.b64encode(data).decode("ascii"))
print(pathlib.Path("payload.b64").read_text())
```

3. The base64 must be **one single line**: no line breaks, spaces, or code fences inside it.
4. If the ZIP is over 48,000 bytes, GitHub's workflow input limit (about 65,535 characters) will not fit it. Deliver `payload.b64` as a downloadable file instead; the user commits it to `MCPE-Curseforges/MCPEDL/incoming/<name>.b64` and passes that path to the workflow.

---

## 9. Final self-check before replying

- [ ] `oneblock.json` is valid JSON with `enabled` and `name`.
- [ ] Both manifests: title `Name (vX.Y.Z)` matches `header.version`; both packs share a version; `by AllensCreations` appears exactly once; all UUIDs are valid and unique.
- [ ] The behavior pack depends on the resource pack's UUID (if a resource pack exists).
- [ ] `tick.json` is valid, lists `void_cleaner` first, and every listed function file exists.
- [ ] All recipes have `AlwaysUnlocked`.
- [ ] No world data, nested archives, or pack link files are included.
- [ ] Module versions are latest stable and looked up, not remembered. Any preview requirement is stated.
- [ ] README states achievement status and experiments, and says the add-on is not tested in game.
- [ ] The base64 came from running the packaging script and is a single line.

---

## 10. Reply format

1. Suggested map folder name (letters, numbers, `.` `_` `-`).
2. The base64 in **one code block, one line**.
3. A short summary: what the add-on does, target game version, `min_engine_version`, module versions used (with the date they were checked), achievement and experiment status, and verification status ("source created and packaged, not tested in game").
4. A reminder of what to do next:
   - GitHub → Actions → **Create OneBlock Add-on from Base64** → Run workflow.
   - Enter the map name, paste the base64, and run.
   - Download the Creative world from the run's artifacts or from `MCPEDL/maps/<Map-Name>/`, then test it in Minecraft.
