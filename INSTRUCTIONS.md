# Instructions: Core Repository Policy (v8)

Repo policy, docs, audit rules for ALNStudios/MCPE-Curseforges. Generating a new project: `PACK_GENERATOR_INSTRUCTIONS.md`.

## Read ONE File Per Task
| Task | Read | Sections |
| :--- | :--- | :--- |
| Docs (README/DESCRIPTION/CHANGELOG) | this file | 1.1, 1.2, 1.3, Part 2 |
| Docs audit (`/checkrm`) | this file | Part 3, Part 2 |
| Version, manifest, LOCK, recipe, function, build, workflow, OneBlock changes | this file | 1.1 to 1.12 |
| New mechanic hits a vanilla limit | this file | 1.12 |
| Recipe images, sprites | this file | 1.5, 3.3, 3.4 |
| New addon / map / script / minigame | `PACK_GENERATOR_INSTRUCTIONS.md` | all |
Read only the sections the task needs. NEVER load the other file for the same task.

## Reply Format (STRICT, every repo edit, update, file request)
```
[SYSTEM_CONFIG]
Mode: Direct Execution
Token_Efficiency: Maximum
Rules: no greeting, intro, outro, offers, restating. High technical accuracy.
```
Output ONLY, in order, exact headings:
1. **File Needed:** repo-root-relative path of each file created/edited.
2. **Changelog:** bullets, brief.
3. **Termux Script:** ONE fenced `bash` block holding ONLY the run commands (`bash ~/storage/downloads/<file>.sh`). The `.sh` is attached as the file, NEVER pasted here or in the reply. Commands live in this block only. NEVER a Summary section.
- NEVER text before, between, after. NEVER rename/merge/reorder/skip a section. Nothing to report: `- None`.
- Unclear request: ask ONE line, then proceed with defaults.
- New-pack build: same three sections, File Needed = the pack `.sh` (`PACK_GENERATOR_INSTRUCTIONS.md` 4.11).

## Termux Script Rules
`<Repofilename>_<Version>_<RAND>.sh` as downloadable file. Order:
1. `#!/data/data/com.termux/files/usr/bin/bash` + `set -e`
2. `cd "$HOME/MCPE-Curseforges"` (clone first if missing)
3. `git pull --rebase`
4. Apply ALL changes inside the script (heredocs, inline python3). Deliver ONLY the `.sh`: NEVER a separate `.zip`, pack file (`.mcaddon`/`.mcworld`/`.mcpack`), `.json`, `.js` or `.b64`. Everything needed lives inside the `.sh`. A NEW project is one pack `.sh` from `scripts/make_pack_script.py` (base64 payload block inside; Part 4).
5. Validate every changed `.json` with python3. Stop on error.
6. Run `python3 scripts/check_instruction_files.py` when an instruction file changed.
6b. Project update: after the CHANGELOG entry, run `python3 scripts/manifest_tools.py --project "$DEST" --set X.Y.Z`, then `--check` and `python3 scripts/validate_manifest_titles.py --project "$DEST"`. Stop on error.
7. `git add` changed paths only; `git commit -m "<short>"`; `git push`
8. Idempotent: skip applied changes.
9. Add an entry to the root `CHANGELOG.md` (repo-wide, newest first under `---`): `## YYYY-MM-DD - [Update Name]`, then `### Added` / `### Improved & Balanced` / `### Fixed` with `- **Title**: what changed`. Every script does this, tooling-only changes included.
10. After a successful push, delete the script itself: `rm -f -- "$SELF"` (SELF = absolute path saved before `cd`; last line, only reached when everything above passed).
CHANGELOG.md mandatory in every project update (Part 2 format, new `X.Y.Z` heading == script filename version). Manifest versions: the update script sets them with `manifest_tools.py --set X.Y.Z` (never by hand-editing JSON). NEVER edit README download links by hand (build aligns them).

## Precedence
Part 1 wins. Part 2-3 never override it. Generator file never overrides this file. Accuracy and requested scope outrank any template. Section numbers refer to this file.

---

## Part 1: Core Policy

### 1.1 Accuracy
- Accuracy and requested scope outrank any template.
- ALWAYS inspect source files before claims. Ask only if an unresolved choice affects gameplay, compatibility, distribution, data loss, or versioning. Else use defaults.
- NEVER invent features, versions, links, assets, test results, compatibility, achievement support, performance, platform behavior. Separate verified facts from assumptions.
- NEVER claim in-game test/function run/gameplay result unless tested in Minecraft. Archive/JSON/syntax checks prove structure only.
- Source priority (report disagreements, NEVER choose silently): 1 add-on's own files; 2 Mojang Bedrock Samples (https://github.com/Mojang/bedrock-samples): vanilla ids, textures, recipes, components, formats; 3 Minecraft Creator Docs (https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable): stable versions, API; 4 Minecraft Wiki (https://minecraft.wiki/): display names, edition, icon look; 5 Bedrock Wiki (https://wiki.bedrock.dev/): formats, techniques. Sources 4-5 NEVER override 1-3 on ids, versions, API.
- NEVER comments in shipped `.js`, `.mcfunction`, `.json`. Explanations go in docs or handoff.
- NEVER imply Mojang/Microsoft endorsement.
- `.sh` names: `(Repofilename)_(Version)_(Rand).sh`. Repofilename = project/folder/file changed, no extension, no spaces (hyphens). Version = new `X.Y.Z` or instruction version (`v5`). Rand = >=5 random lowercase/digits, fresh each time (`head -c 200 /dev/urandom | tr -dc 'a-z0-9' | head -c 6`), NEVER reused. Example `Dirtbound_1.2.0_k7q2x.sh`. Same name in reply and run command.

### 1.2 Versions and Compatibility
Latest stable:
- ALWAYS look up latest stable Bedrock release and Script API module versions at time of work. Record date. NEVER trust numbers in this file or memory.
- Refs: Creator Docs; Script API versioning (https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning?view=minecraft-bedrock-stable); `@minecraft/server` and `@minecraft/server-ui` stable references; latest platform version guidance. Community wikis NEVER pick versions or confirm API.
- Pick highest stable module version supported by target game and every dependency (check peers). NEVER preview/beta/RC unless a requested feature needs it; then disclose in docs and handoff.
- Game version and module version are separate. NEVER infer one from the other.

Engine:
- `min_engine_version` = lowest game version the pack needs. 3-integer array, real looked-up value. NEVER `[0,0,0]`. NEVER hardcode a minimum in docs.
- Manifest `format_version` = 2. Item/block `format_version` NEVER newer than `min_engine_version`.
- Compatibility line states only a verified minimum. NEVER "or newer" unverified.
- Updating old pack: ALWAYS keep UUIDs, persistent ids, working behavior. Upgrade deps deliberately. Raising `min_engine_version` drops players: say so in CHANGELOG.

Achievements/experiments (every new pack, meaningful update):
- ALWAYS inspect manifests, deps, stable-vs-preview imports, JSON, components, scripts, functions, world settings. Confirm experiment needs against current docs, NEVER keyword match. Stable Script API alone != experiment or achievements disabled.
- Pack files NEVER establish an existing world's settings.
- Nothing found: write "No experiment requirement detected in the inspected files."
- Prefer stable implementation. NEVER silently weaken a feature to dodge an experiment.
- Status: Likely achievement-friendly | Not achievement-friendly / may disable achievements | Unknown / needs confirmation. ALWAYS `Likely achievement-friendly` for `MCPEDL/Addons/` (keep caveats).
- Admin commands (`give_controller`, `end_game`, setup functions) = optional recovery tools. Cheats disable achievements in that world: say so wherever documented.
- Handoff: achievement status, experiments (none/required name/unknown), evidence, scope.

Implementation:
1. ALWAYS inspect manifest, entry points, imports, structure first.
2. Confirm each API member exists in the chosen stable module version.
3. Prefer event-driven logic. NEVER per-tick polling, broad entity searches, expensive block scans without need.
4. Vanilla JSON components and `.mcfunction` when simpler. Script API when needed.
5. Fix obvious malformed files.
6. Handoff records: target game version, `min_engine_version`, module versions, preview/experimental needs, references + date, verification status (source created | package built | in-game tested, NEVER mixed).

### 1.3 Version Format and Manifests
- Version = `X.Y.Z` ONLY (Bedrock `header.version` = 3 non-negative ints). NEVER `X.Y.Z.A`. No fourth part, no Alpha. Same `X.Y.Z` in `metadata.version`, `(vX.Y.Z)` titles, changelog headings, package names, README links, snapshots.
- X = Release, Y = Beta, Z = Update. Update: Z+1 (1.2.3 -> 1.2.4). Beta: Y+1, Z=0 (1.2.4 -> 1.3.0). Release: X+1, Y=Z=0 (1.3.0 -> 2.0.0). Default = Update. Beta/Release only on request or CurseForge publish task.
- Manifest title = `Add-on Name (vX.Y.Z)` (e.g. `Vanilla Quality of Life (v1.3.4)`). Exactly one terminal suffix, equals `header.version`, BP/RP match. NEVER duplicate suffixes. `scripts/validate_manifest_titles.py [--project <path>]` fails the job on violation (also notes non-fail: format_version != 2, missing/zero `min_engine_version`, missing `metadata.authors`).
- `header.description` contains `by ALNStudios` exactly once. NEVER attribution in title.
- NEVER change pack UUIDs or world storage keys to rename a title. NEVER regenerate header UUIDs (breaks worlds).
- Build sync: every processed project aligns all source manifests to one highest `X.Y.Z`: `header.version`, `metadata.version`, title suffix, module versions, same-project BP/RP deps. Fills `metadata.authors` (`ALNStudios`), optional `metadata.license`.
- Snapshots: `builds/<pack>/versions/V<X.Y.Z>/` (packages, `source.zip`, `source.sha256`, `build_info.json`). Refreshed when source/packages differ. Last 5 kept.
- NOTHING auto-bumps. The new version is written in CHANGELOG.md AND, in the same update script, into every source manifest with `python3 scripts/manifest_tools.py --project <path> --set X.Y.Z` (header.version, metadata.version, title suffix, module and dependency versions; UUIDs untouched; never lowers), so every update changes the build. Publish to CurseForge uploads the newest changelog version as written and groups every entry since the last publish. The passive build (`Build Changed Packs & Sync Catalogs`) aligns each pack to its highest existing version and rebuilds. `--bump` / `AUTO_BUMP_MANIFEST=true` remain in `scripts/auto_bump_and_build.py` for manual use only.
- Package name: `<Shortcut> VX.Y.Z.<ext>` (example `MiningHelmet V1.0.2.mcaddon`). Shortcut = short, letters and digits only (NEVER `-`, `_`, spaces, `by ALNStudios`, parentheses), close to the add-on name, kept in `scripts/pack_shortcuts.json` by project folder (fallback: folder name joined). Custom via `metadata.package_filename` or `PACK_FILENAME_TEMPLATE`; MUST contain `V{version}` and no parenthesis, else the default is used. CurseForge upload copy uses the same name. `python3 scripts/rename_packages.py --check|--apply` renames old packages and repairs references.
- Creator name `ALNStudios`. `python3 scripts/rename_brand.py --apply` migrates old name. NEVER rename lowercase namespaces (`allenscreations:`).
- Tools: `python3 scripts/manifest_tools.py --project <path> --check|--align|--bump` (`--all --check`). `sync_manifest_versions.py`: deps and `min_engine_version` maintenance; set `min_engine_version` by hand after lookup. `sync_project_docs.py` NOT in build: edit DESCRIPTION/CHANGELOG deliberately. `sync_readme_links.py [--check]` repairs README links (runs after every build).
- LOCK: every `MCPEDL/Addons/` project has `LOCK` at root starting `ALNStudios Add-on Lock v1`. Importer creates it, build enforces it. Missing/invalid = release-blocking: report path, NEVER call build-ready. Safeguard only, not encryption.

### 1.4 Recipe Unlock
- ALWAYS unlock every custom crafting recipe by default. Shaped = object `"unlock": { "context": "AlwaysUnlocked" }`. Shapeless = array `"unlock": [{ "context": "AlwaysUnlocked" }]`. NEVER mix forms in one recipe. Validators accept either; generator writes these.
- Covers `minecraft:recipe_shaped`, `minecraft:recipe_shapeless` only. NEVER add `unlock` to furnace/brewing/smithing/other unless Samples shows support.
- Validators parse JSON and check `unlock` key. NEVER text search for `AlwaysUnlocked`.
- NEVER change ingredients, result, count, station/tags, shaped/shapeless structure. NEVER rely on recipe-book discovery unless asked.
- Applies to all new recipes and any recipe touched. Check type against Samples first.

### 1.5 Recipe Images and Sprites
- Optional. ONLY on request or project instructions, ONLY for DESCRIPTION. NEVER AI image generation unless asked.
- ALWAYS verified absolute raw GitHub URLs. Confirm image exists, committed, matches item/recipe. Remove outdated.
- Sprites: real texture from add-on or authoritative vanilla source. Inventory-style, NEVER cropped world textures. Block-only: build small isometric cube from verified top+side faces, NEVER stretch one face.
- Build diagrams by code from recipe JSON + add-on result texture + Samples vanilla textures (`BEDROCK_SAMPLES_ROOT`; workflow clones to `/tmp/bedrock-samples`). Recipe JSON authoritative. NEVER change a recipe to fit an image.
- Board: ONLY `scripts/CRAFTING_TABLE.svg` via `scripts/crafting_template.py` (ids `slot-0`..`slot-8` row-major, `slot-N-fill`, `output`, `output-fill`, `arrow`). NEVER `CRAFTINGBOARD.PNG`, screenshots, hand-drawn boards. SVG missing: stop, report.
- ALWAYS full 3x3. Shaped keeps exact placement + empties. Shapeless fills row-major. NEVER flatten to list. Show quantities and output count. Colors from the SVG, background NEVER transparent. Vanilla gray UI, crisp nearest-neighbor, no frames/gradients/glow/labels/emojis. One diagram per row at 400x222.
- Texture sources: 1 Samples; 2 Minecraft Wiki fallback ONLY if Samples has no usable inventory sprite; 3 NEVER third-party packs, guessed names, approximations.
- Wiki images: CC BY-NC-SA, conflicts with monetized pages. ONLY with explicit user approval of that image. Names `Invicon_<Title_Case_Name>.png`, `ItemSprite_<lowercase-hyphenated-name>.png`. Open file page, confirm license. Record file page URL, license, date in generator header comment or `scripts/ASSET_SOURCES.md`; add attribution to DESCRIPTION. NEVER bulk-copy. Wiki blocked: report, fall back to Samples.
- ALWAYS map every ingredient to a texture first (filenames differ from ids; `textures/items/` or `textures/blocks/`; verify path + item). NEVER substitute or skip. Report all unresolved together, stop.
- Optional platform listing images (user supplies both): clickable in Creator and Permissions, 16:9 JPEG `assets/Images/<slug>-curseforge.jpg`, `<slug>-mcpedl.jpg`, link to verified pack listing. NEVER placeholders or invented URLs. Pair only if both images and both URLs exist.
- Generators: `scripts/`, fail clearly on missing Samples/texture/recipe. Register in `.github/workflows/generate-recipe-images.yml` (`push.paths`, run step, commit step; keep `workflow_dispatch`). Workflow commits PNGs `[skip ci]`. NEVER call images published until workflow succeeded and PNGs exist.
- Technical reference: Bedrock Wiki explains; verify schema/ids/format version against Samples + current docs. Cite it as community docs; link, NEVER copy.

### 1.6 Function Files
Paths from repo root. A function file existing != it runs.
- Functions: `<project>/behavior_pack/functions/<name>.mcfunction`. Tick: `functions/tick.json` `values` = names without suffix (`oneblock_tick`).
- Before delivery: 1 inspect real manifest, functions, `tick.json`, install steps, report paths; 2 `tick.json` valid, right dir, names existing function; 3 check syntax, ids, coordinates, deps (scoreboards). NEVER make a score-dependent command the only initial-block path unless init guaranteed; 4 run available JSON/project validation, state what passed; 5 custom item delivered but block missing: diagnose item delivery and function execution separately (pack activation, world links, tick registration, name/path, command errors) BEFORE fallbacks or version bump.
- NEVER claim `tick.json` missing without inspecting installed/packaged copy.

### 1.7 OneBlock, Maps, Scripts, Minigames
General:
- OneBlock script = general pack. MUST work in any world. NEVER depend on a world's terrain/database/settings. Project-specific (coords, spawn, cleanup, shop) lives in that project's spec (Dirtbound below).
- `Mcpeworlds/{Creative,Survival,Hardcore}/` = ONLY world foundations (convenience targets, not a usage limit). NEVER old world ZIPs, `Oneblock-assets.mcworld`, `assets/Void_For_Workv2.mcworld`, persisted `assets/oneblock-template/`. NEVER recreate `create-mcpe-world.yml` or `scripts/create_mcpe_world.py`.
- NEVER create/fabricate/borrow/require `db/CURRENT` or LevelDB data (database-free void design). NEVER modify source foundations; build renames only the staged copy's world name.
- Build: `build-oneblock-variants.yml` copies each foundation to staging, keeps its `level.dat`, adds map BP + RP, packages `.mcworld` into `MCPEDL/Maps/<Map-Name>/`. Source: `MCPEDL/Maps/<Map-Name>/behavior_pack/`, `resource_pack/`.
- Maps ship Creative+Survival+Hardcore worlds. Add-ons/Scripts/Minigames: Creative test world only (fixed). NEVER separate tester package or `Tester Build/`. Add-on workflows NEVER misclassify a Map.
- One OneBlock gameplay pack per world (maps only). Installing a different one: remove the old pack folders + link entries from all 3 modes first. NEVER touch unrelated packs.
- Install per mode (identical in all three): `behavior_pack/` -> `<mode>/behavior_packs/<Map-Name>_BP/`, `resource_pack/` -> `<mode>/resource_packs/<Map-Name>_RP/`. Update = replace whole folder. Link files at world root `world_behavior_packs.json` / `world_resource_packs.json`: `[{ "pack_id": "<manifest header uuid>", "version": [1, 0, 0] }]`, replace same `pack_id` on update. NEVER invent UUID/version. Unresolved deps: stop, report path.
- Map README: download-focused. Link only compiled `.mcworld` that exist. NEVER claim an archive matches source unless checked. Same for `MCPEDL/Maps/README.md`.

Payload import:
- `PACK_GENERATOR_INSTRUCTIONS.md` is the generator file. Agent asks type (addon|map|script|minigame), returns single-line base64 ZIP made by running code, NEVER by hand. `project.json` = `{"type": "...", "name": "..."}`.
- `create-project-from-base64.yml`: folder name + base64 (or `.b64` under `MCPEDL/incoming/`) -> `scripts/import_project_payload.py` -> imports `scripts/build_payload.py` (same checks agent-side and repo-side).
- Destinations: addon `MCPEDL/Addons/<Name>/` (`.mcaddon`, Creative test world, importer writes `LOCK`); map `MCPEDL/Maps/<Name>/` (`.mcworld`, importer writes `oneblock.json`, builds 3 worlds); script `MCPEDL/Script/<Name>/` (`.mcpack`, Creative test world, no Controller); minigame `MCPEDL/Minigame/<Name>/` (`.mcaddon`, Controller, Creative test world).
- Importer validates BEFORE writing. Rejects unsafe paths, symlinks, world data (`db/`, `level.dat`), nested archives, shipped link files, disallowed types, bad manifests, recipes without unlock, per-type misses. Icons MUST match repo copies in `Mcpeworlds/assets/resources_pack/textures/items/` byte for byte.
- Map requires: `tick.json` lists `void_cleaner` first; `void_cleaner.mcfunction` starts with the Y=-64 fill line; `oneblock_setup.mcfunction` exists; Trader Ledger item + texture entry + `trader_ledger.png`. Others need no void cleaner/ledger.
- Folder name typed per run. NEVER hardcode. Payload with only `oneblock.json` still = map.
- Sections 1.3, 1.4, 1.6, 1.7 change: ALWAYS update `PACK_GENERATOR_INSTRUCTIONS.md`, `scripts/build_payload.py`, importer in the same change, then `scripts/selftest_project_types.py`. This file wins on conflict.

Scripts and minigames:
- Script project `MCPEDL/Script/<Name>/`: script BP + Creative `test_world.json`, `.mcpack`. Minigame `MCPEDL/Minigame/<Name>/`: BP + RP + Creative `test_world.json`, `.mcaddon`.
- Every Minigame ships Controller (`allenscreations:controller`, `controller.png` 16x16 at `Mcpeworlds/assets/resources_pack/textures/items/controller.png`). Opens form: **Start** + **How to play**; while running first button = **End Game**. State (idle/running/ended) in a world dynamic property. NEVER opt out.
- Only host/operator gets and uses it. Start works while idle. End Game asks confirm, calls `endGame()`, needs no cheats. How to play = second button, rules page + Back. Game ends via win/lose logic calling `endGame()`.
- Controller KEPT while game runs. `consumeOnStart: true` in `registerController` restores old behavior (Start consumes first Controller unless Creative; End Game only reachable by host still carrying one). Host/operator gets one on every spawn (incl. death) when carrying none; game end gives a fresh one.
- Stuck state: NEVER stay `running` forever. On world load, a script that cannot restore a live game resets to `idle` and gives Controller. `give_controller.mcfunction`, `end_game.mcfunction` ship with every Controller minigame but need cheats: last resort, NEVER only recovery.
- `test_world.json` = `{"mode": "Creative", "include_addons": ["Name", ...]}`. Includes from `MCPEDL/Addons/` only. `scripts/build_test_world.py [--project <folder>]` copies Creative foundation, installs project + includes, links packs, writes `<Name> - Test.mcworld` in project folder. Fails on missing include, duplicate UUIDs, unresolved dependency. Add-ons may omit `test_world.json`; Script/Minigame require it. Experiments/achievement state come from the foundation, unverified.
- Verify: manifest, `tick.json`, functions wired (1.6); installed pack matches source per mode; link entry matches manifest UUID+version; RP dependency resolves; script syntax checks pass. Importer, `build_oneblock_variants_from_template.py` (`verify_archive`), `build_test_world.py`, `scripts/selftest_project_types.py` run these. State exactly what passed. Structure checks NEVER prove Minecraft loaded the world.

Example spec: Dirtbound
- Core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. Trader Ledger = only shop access. No physical Trader Post.
- `void_cleaner.mcfunction`, once per player, guarded `tag=!void_cleaned`, order: 1 `execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air` (33x33 = 1,089 blocks; `fill 0 -64 0 15 -64 15 air` = 256, WRONG); 2 teleport untagged player to `(0,1,0)` (only function-side teleport); 3 Bedrock `(0,-1,0)`; 4 grass placeholder `(0,0,0)`; 5 world spawn `(0,1,0)`; 6 cleaning notice; 7 add `void_cleaned` ONLY once core Bedrock exists.
- Chunk loading: Bedrock does not keep spawn chunks loaded; fill on unloaded chunks fails silently. Final tag MUST be conditional: `execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned`. Guard the notice against retry spam. Unverified until tested in game (1.11).
- NEVER expand cleanup beyond this layer without approval.
- `tick.json`: `void_cleaner` before `oneblock_tick`. `oneblock_tick` restores only missing Bedrock. NEVER reset spawn, teleport, place/replace core.
- Script API owns core `(0,0,0)`, break rewards, stage progression; waits for `void_cleaned` before replacing the placeholder.
- Player tags persist: a source fix NEVER patches an imported world. Test with a fresh import.
- Mechanics change: update source, player docs, test checklists together; reinstall into all 3 world folders.

### 1.8 Workflows
- Workflows: `.github/workflows/`. ALWAYS read the actual file before editing or describing it. NEVER claim a run succeeded unless checked. NEVER trust summaries of workflows (they drift).
- Retired, NEVER recreate or reference: `update-min-version.yml`, `scripts/update_min_version.py`, `create-addon-scaffold.yml`, `test-crafting-template.yml`, `create-mcpe-world.yml`, `scripts/create_mcpe_world.py`, `scripts/check_generator_sync.py`.
- Version rules (1.3) changing workflow behavior: update the workflow in the same change.
- Key entry points: `auto-version-bump.yml` (Build Changed Packs & Sync Catalogs: passive, runs on every push, builds ALL, NEVER bumps), `publish-curseforge.yml` (ONLY CurseForge upload path; no bump; groups changelog since last publish), `delete-project.yml` (Delete Package: package + builds, changelog views, registry, catalog rows, dropdown), `collect-ai-review-files.yml` (AI hand-off: empty paths = bundle; paths = `.b64` Markdown export zipped as `(X.Y.Z) Filename.zip`), `create-project-from-base64.yml` (`commit_mode` default `pull_request`), `ci.yml` (PR checks).
- Helper scripts: `scripts/` (read each script for options). `scripts/check_instruction_files.py` fails CI when an instruction file breaks size/format rules.

### 1.9 Repository Layout
```
MCPE-Curseforges/
├── INSTRUCTIONS.md  PACK_GENERATOR_INSTRUCTIONS.md  README.md
├── scripts/  .github/workflows/  tests/
├── Mcpeworlds/{Creative,Survival,Hardcore}/
├── MCPEDL/{Addons,Maps,Script,Minigame}/<Name>/  MCPEDL/incoming/
└── builds/<Name>/ build_info.json  versions/V<X.Y.Z>/
```

### 1.10 Review and Security
AI payloads = untrusted until a person reviews. Human PR review is the real safeguard; checks reduce risk, NEVER prove safety.
- ALWAYS review `behavior_pack/scripts/` and every `.mcfunction` in the PR before merge. `direct` commit only for a payload you made and checked. PR mode needs "Allow GitHub Actions to create and approve pull requests".
- `build_payload.py` enforces: imports only `@minecraft/server`, `@minecraft/server-ui`, `@minecraft/vanilla-data`, relative files; `eval`/`Function` rejected; every `.js` passes `node --check`. Limits: eval test is a text pattern (misses `globalThis["ev"+"al"]`, aliasing, `import(variable)`). Reviewers MUST read scripts.
- Importer: payload size capped; duplicate/case-colliding ZIP entries and control chars rejected; folder names differing only by case or existing under another type refused unless `overwrite`; overwrite lists deleted files. Declared ZIP sizes can be forged: count actual bytes while extracting, stop at limit.
- UUIDs unique across `MCPEDL/` (own folder excluded). `min_engine_version` = real looked-up version.
- NEVER `${{ inputs.* }}` or step outputs inside `run:`. Pass via `env:`, quote.
- Docs MUST pass `build_payload.py` `DOC:` checks (failures, not warnings).

### 1.11 Known Untested Assumptions
Open until confirmed in game. NEVER state as fact in docs.
1. Void cleaner: Y=-64 fill succeeds for a player spawning in a fresh void world; conditional tag (1.7) retries correctly.
2. World host reports as Operator via `playerPermissionLevel` with cheats off (Controller reaches host on achievement-eligible world).
3. `isOp()` absent in 2.x `@minecraft/server` (Controller uses a helper). Re-check on every module bump.
4. Controller kept while running, returned on respawn, End Game confirm, `consumeOnStart: true` work across rejoin/death/reload. Only tested with mocked modules.
5. Shipped functions and Controller do not disable achievements unless an admin command is run.
6. Experiment/achievement state of each `Mcpeworlds/` foundation.

### 1.12 Vanilla Limits and Workarounds
Applies to every addon, map, script, minigame, item, entity, block, trade, recipe and enchantment, new or updated.
- A hardcoded vanilla limit blocks the requested mechanic (examples: mutually exclusive enchantments, item, entity or component caps, trade or recipe limits) AND the standard approach (behavior JSON, commands, crafting, enchanting) fails: NEVER drop the feature silently. The standard approach works: use it, no workaround.
- Lightest workaround first. 1) Data-driven: custom item, block, entity, recipe, loot, trade, spawn rule, animation controller, tag, component. 2) `@minecraft/server`: custom components, events, ItemStack and Entity APIs, dynamic properties, tags or scoreboard for state. 3) Structural: helper or proxy entity, swapped or replaced item or entity, tiered item variants, `.mcstructure` or template placement, function-driven effects.
- NEVER invent an API, component, event or behavior. Use only what the looked-up stable version (1.2) provides and the repo scripts accept. Cannot verify: say so in DESCRIPTION.md.
- Modular: one small file per workaround with one entry point (script: `behavior_pack/scripts/lib/<name>.js` imported relatively; data: its own function file, entity or item definition). Reuse an existing module. NEVER copy the logic per feature.
- Safe: idempotent setup, caps and cleanup for spawned entities and loops, nothing that corrupts worlds or other packs.
- Docs (Part 2): player-facing result only, no code or API names; the trade-off under Good To Know. State achievement and experiment impact per 1.2. NEVER claim tested in game unless tested.

---

## Part 2: Docs (README, DESCRIPTION, CHANGELOG)

Part 1 wins on conflict. `scripts/doc_template.py` enforces the templates below (`DOC:` failures). Script and file disagree: report it, follow the script for what the build accepts.

### 2.1 Roles
- README.md: version-free download landing page. Title, package format, direct link, 3 install steps, link to DESCRIPTION. NEVER gameplay text, badges, images, release version.
- DESCRIPTION.md: full product page. NEVER release version in title.
- CHANGELOG.md: player-visible changes only. Plain text, only source of truth.
- Catalogs (download source of truth, tables allowed): `MCPEDL/Addons/README.md#available-add-ons`, `MCPEDL/Maps/README.md#available-maps`, `MCPEDL/Script/README.md#available-scripts`, `MCPEDL/Minigame/README.md#available-minigames`, `builds/README.md#available-pack-and-map-builds`.
- ALWAYS move verified player-facing text from a long README into DESCRIPTION before replacing it. NEVER lose verified info. NEVER duplicate full descriptions.

### 2.2 Writing
- ALWAYS player-facing: what players do, how it behaves in game, what they need.
- ALWAYS in-game display names ("Diamond"). NEVER identifiers (`minecraft:diamond`), file/function/event/API/module names, JSON, config keys, tick intervals, code, hashes, build details.
- NEVER write `Script API` or `@minecraft/server`. Use "modern Minecraft Bedrock mechanics".
- NEVER BP/RP. Write "Behavior Pack", "Resource Pack", "Complete Pack (.mcaddon)".
- NEVER code blocks or edit-JSON/JS instructions. Config = in-game options, commands, tags.
- Tone: factual. NEVER hype, clickbait, rhetorical questions, filler, emojis.
- ALWAYS verify exact values, recipes, requirements from source or tests.
- NEVER claim "zero lag", universal multiplayer/Realms, achievement preservation, "no experimental features" without evidence for that exact claim. Exception: add-on Achievements line = `Likely achievement-friendly.` (keep cheats/world caveats).
- ALWAYS say cheats are needed when documenting a cheat-only function, and that cheats disable achievements in that world.
- Page quality: tagline = one concrete sentence (<=25 words, one verified number or item name) that doubles as CurseForge Summary. NEVER "adds items to the game". Explain a mechanic with one short example. One idea per feature card. Steps = numbered. Style check: `python3 scripts/doc_template.py --style <folder>`; rewrite every STYLE hint with a fact (advisory).

### 2.3 Layout
- Must render on GitHub, CurseForge, MCPEDL, Planet Minecraft.
- NEVER Markdown tables in README/DESCRIPTION. Use `### Feature Name` cards with `- **What Happens**: ...`.
- Paragraphs <=4 sentences. NEVER LaTeX. Use `->`.
- README: NEVER badges/images. DESCRIPTION: exactly the 2 template badges (Minecraft Bedrock "Stable Release", never a version) plus the 2 listing images. Other images: requested item sprites, recipe diagrams only. Only exception: generated "Collection Size" badge in root README (NEVER hand-edit, NEVER copy).
- Listing images: HTML, `width="45%"`, NEVER `height`, full raw URL `https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/<file>` (`curseforge.jpg`, `MCPEDL.jpg`). NEVER edit/copy them. `scripts/optimize_images.py` compresses (800 px, 200 KB, JPEG).
- NEVER duplicate version suffixes `(v1.2.0) (v1.2.1)`.
- NEVER copy a legacy MCPEDL description to CurseForge unchanged.
- Repo links: relative. Published pages: full URLs `https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>`, `.../raw/main/builds/<file>`.
- Spoiler (CurseForge `</>`): `<h2>Title</h2><div class="spoiler">content</div>`. Preview first. HTML only for listing images and a verified spoiler.
- Changelog views: `changelog_views/<Name>.github.md` + `.curseforge.html` generated by `scripts/build_changelog_views.py`. NEVER add HTML/folds/links to CHANGELOG.md. NEVER hand-edit views.
- Description view: `description_views/<Name>.curseforge.html` generated from DESCRIPTION.md by `scripts/build_description_views.py` (hero, feature cards, compatibility table; CurseForge-supported HTML only). DESCRIPTION.md stays the source. NEVER hand-edit views.
- Media: payloads contain no screenshots. Add them on the platform after publishing.

### 2.4 Attribution and keywords
- Creator links + listing images: DESCRIPTION only, in Creator and Permissions. NEVER in README, changelog, manifest description.
- Attribution block (no links), directly before Keywords, exactly:

```markdown
## Guidelines and Attribution

- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.

---
```

- Keywords: end of every DESCRIPTION, from real features. Anchors: `Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `ALNStudios`. Gameplay anchors only if verified.

```markdown
## Search & Discovery Keywords

Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [feature 1], [feature 2], [item or mob name], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.
```

### 2.5 Templates (STRICT)
- ALWAYS follow exactly: same headings, text, order, labels, bullet format. NEVER add/remove/rename/merge/reorder sections. NEVER boilerplate or text outside the template.
- Only optional section: `## Common Questions`, directly after How to Use, lines `- **Question**: answer`. Omit whole section without verified answers.
- ALWAYS replace every `[placeholder]` and `verified-...` marker. NEVER leave one.
- `.mcworld` installs may vary; multiple verified world variants may be listed. Accuracy and requested scope outrank template.

README.md (exactly 11 non-empty lines). Direct package URL if it exists, else official category catalog. Format = real (`.mcaddon`/`.mcpack`/`.mcworld`). `.mcworld` step 3 = `3. Find the imported world in your Worlds list and open it.` Preserve all verified world links.

```markdown
# [Pack Name]

Download the current release of **[Pack Name]** for Minecraft Bedrock Edition.

## Download

- **Package format:** `.mcaddon`
- **Direct download:** [Download [Pack Name] (.mcaddon)](verified-direct-download-link)

## Installation

1. Download the package using the link above.
2. Open the downloaded file with Minecraft to import it.
3. If the package contains a pack that must be enabled separately, activate it in your world's settings.

## Pack Information

For gameplay features, usage details, compatibility notes, and other project information, read the [full description](verified-DESCRIPTION-link).
```

DESCRIPTION.md (all project types; only Achievements wording is add-on specific). Portable Markdown. NEVER version in title, unverified features, placeholder images.

```markdown
# [Pack Name] — [Clear, factual subtitle]

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-Stable%20Release-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**[One concrete sentence, 25 words or fewer, with one verified number or item name. It doubles as the CurseForge Summary.]**

> [Two sentences at most. First: what the pack adds, with a verified name or number. Second: what changes in play or who it suits. Never write "adds items to the game".]

## Overview

[One short paragraph in plain words: what a player does with the pack from start to finish, and what is different from vanilla Minecraft.]

## Key Features

### [Feature Name]
- **What Happens**: [One or two sentences of player-facing behavior with verified numbers, ranges, and item names.]
- **How It Works**: [Optional. A short example such as "Right-click X with Y, then Z happens".]
- **Good To Know**: [Optional. A verified limit, cost, or interaction players ask about.]

Add separate feature cards for meaningful mechanics. Put relevant item lists, mob rosters, and verified crafting details inside the matching card; omit sections the pack does not need.

## How to Use

1. [First thing a player does, with the exact item or action.]
2. [Next step.]
3. [What they should see happen.]

## Common Questions

- **[Question players actually ask]**: [Verified answer in one or two sentences.]

(The Common Questions section is optional. Include it only with verified answers; otherwise omit the whole section. It comes directly after How to Use.)

## Compatibility

- Minecraft Bedrock Edition: [verified minimum version, only if verified]
- Experimental features: [verified status]
- Achievements: Likely achievement-friendly. [For Add-ons; use a factual status for other pack types.]
- Verification: [source created / package built / in-game tested; never conflate them]

## Creator and Permissions

- Creator: ALNStudios
- Profiles: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/alnstudios/)

<a href="https://www.curseforge.com/members/allenscreations/projects"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/curseforge.jpg" alt="CurseForge" width="45%"></a> <a href="https://mcpedl.com/user/alnstudios/"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/MCPEDL.jpg" alt="MCPEDL" width="45%"></a>

## Guidelines and Attribution

[Attribution block from Section 4.]

## Search & Discovery Keywords

[Keywords.]
```

CHANGELOG.md. Newest first. Groups: Added, Improved & Balanced, Fixed (bugs as in-game experience). NEVER links, URLs, badges, function/event names, JSON diffs, hashes, CI steps, unverified benefits. NEVER Keep a Changelog/SemVer mention. After the title go straight to entries.

```markdown
# Changelog — [Add-on Name]

---

## [1.0.0] - YYYY-MM-DD - [Update Name]

### Added
- **[Feature Title]**: [Clear summary of the new gameplay feature and how players use it].

### Improved & Balanced
- **[Enhancement Title]**: [Player-friendly description of tuning, balance, or visual changes].

### Fixed
- **[Fix Title]**: [What in-game bug or glitch was resolved].
```

---

## Part 3: checkrm (Docs Audit) and References

### 3.1 Authority and Scope
- Parts 1-2 authoritative. Part 1/2 unreadable: stop, report. NEVER work from memory.
- Docs and catalog maintenance ONLY. NEVER change gameplay code, manifests, UUIDs, versions, deps, pack settings, assets, workflows, release config unless explicitly asked. "Documentation-only" = touch none of those.
- Modes: repo-wide (`/checkrm`, "all projects", no single project named) | single project (name/slug/folder, or create/repair/update one project's docs).
- ALWAYS discover real folder structure first. NEVER assume a path or substitute a similar project. Report ambiguity/missing target.

### 3.2 Procedure
1. Discover: target project, README, DESCRIPTION, manifests, scripts, config, entities, items, blocks, recipes, functions, loot tables, lang files, assets; parent catalog, root README, builds README.
2. Audit: `python3 scripts/check_readme_status.py` (missing/incomplete docs, add-on READMEs with product info, short map/script READMEs, broken relative links, orphan build dirs; `--fix` makes stub docs, review output). Script absent/fails: inspect manually, report.
3. Verify facts BEFORE writing: what it does, features, activation/config, persistence, packs/deps, versions, limits, achievements/experiments (1.2). NEVER infer a feature from a name. Separate implemented from planned. Verify vanilla names/sprites against 3.3-3.4.
4. References: before creating/rewriting README or DESCRIPTION read root README, category catalog, builds README, 2-3 well-documented same-category projects. Reuse conventions, NEVER project-specific claims. Verify their links/images/claims first.
5. Write per Part 2. NEVER add an unimplemented feature because requested. Omit install steps if asked.
6. Images/badges/links: README none. DESCRIPTION 2 template badges + listing images, no other badges. Other images: requested sprites, recipe diagrams. Confirm assets exist, absolute raw URLs, verify link targets. No placeholders.
7. Sync catalogs and builds: check category catalog, root README, builds README. Update only relevant entries. Search first (no duplicates). Keep ordering. Inspect build scripts before running. `python3 scripts/auto_bump_and_build.py --project "<Project-Name>"` (never changes manifest versions). NEVER claim build/sync done if failed or not run.
8. Verify: re-read whole edited file (headings, lists, links); each feature has source evidence, no verified content lost; `python3 scripts/validate_manifest_titles.py --project <path>`; rerun `check_readme_status.py` (expect 0 needing update, `[LINK INTEGRITY] All relative links valid`); LOCK marker for `MCPEDL/Addons/`; review diff for scope. State any check not run.
9. Report briefly: projects audited/updated, files changed, commands + results, missing assets/links/unverifiable info, remaining work. NEVER report success for an unrun or failed check.
- Bulk remake: `python3 scripts/check_readme_status.py --remake standardize --all --check` previews; without `--check` writes. `standardize` keeps text, refreshes READMEs as version-free pages, strips versions from DESCRIPTION titles, fixes structure, adds missing CHANGELOG entry. `--remake rebuild --project <Name>` regenerates generic DESCRIPTION/README from source (`--all` needs `--confirm-rebuild`). Defaults (Verification, Achievements, Experimental features) are placeholders: replace with verified facts. `remake-docs.yml` = dry run + PR.

### 3.3 Minecraft Wiki Item Reference
- https://minecraft.wiki/w/Item = official names, grouping, sprite look. ALWAYS together with Samples, NEVER instead.
- Ids, textures, recipes, components: Samples. Display names: Wiki Bedrock name, confirmed against Samples `resource_pack/texts/en_US.lang` (`item.<id>.name`, `tile.<id>.name`). Lang file = in-game truth if Wiki unreachable/disagrees; report disagreement.
- NEVER title-case an identifier (`experience_bottle` = Bottle o' Enchanting, `hay_block` = Hay Bale, `ender_eye` = Eye of Ender, `wooden_door` = Oak Door, `golden_rail` = Powered Rail, `magma` = Magma Block).
- Edition tags `[BE only]`/`[JE only]`. NEVER document a Java-only item as available (Spectral Arrow is not Bedrock).

### 3.4 Mojang Bedrock Samples Reference
- Wiki sprite names: `Invicon_<Title_Case_Name>.png`, `ItemSprite_<lowercase-hyphenated-name>.png`. Look up by Wiki name, NEVER identifier. Fetch with available web tool; shell blocked: report, NEVER route around, fall back to Samples. Image license rules: 1.5.
- Wiki, `en_US.lang`, Samples lag each other. ALWAYS check Samples `version.json`, state the version a claim was verified against.
- Samples (https://github.com/mojang/bedrock-samples) = truth for vanilla ids, textures, recipes, components, entities, formats. Root `BEDROCK_SAMPLES_ROOT` (workflow clones to `/tmp/bedrock-samples`).
- Layout: `resource_pack/` (`textures/items/`, `textures/blocks/`, `textures/models/armor/`, `textures/ui/`, `attachables/`, `texts/`), `behavior_pack/` (`items/`, `entities/`, `recipes/`, `loot_tables/`).
- Content changes per release: ALWAYS verify checked-out version, confirm each path exists. NEVER hardcode values (armor defense, durability) from memory.
- Ids != texture filenames. Inventory all recipes, map every ingredient, report unresolved together. NEVER placeholder.
- `textures/item_texture.json`, `terrain_texture.json` start with a `//` comment line: strip before parsing. Many vanilla items have no id-keyed entry; many block textures are `.tga`: check both extensions before calling missing.
- Block icons render in game from top+side textures: build isometric view from real faces for cube sprites.
- An id valid elsewhere may not exist in Bedrock (`oak_door` = `wooden_door`). Confirm id appears in Samples recipes/loot tables/trades before documenting.
- Custom items use the add-on's own RP textures. Vanilla `behavior_pack/recipes/` = reference for recipe format, group tags, ingredient ids.
- Checkout missing/asset absent: report. Only GitHub reachable: `git clone --filter=blob:none --sparse` then `git sparse-checkout set --no-cone <paths>`.
- Scale 16x16 textures with nearest-neighbor (`Image.Resampling.NEAREST`).

---

## Final Self-Check (run before replying)
- [ ] Reply = three sections only (File Needed, Changelog, Termux Script).
- [ ] Every version `X.Y.Z`. No `X.Y.Z.A`. Script name `(Repofilename)_(Version)_(Rand).sh`, fresh Rand >=5.
- [ ] CHANGELOG.md updated, top heading == new version == script name version.
- [ ] Docs match Part 2 templates exactly, no placeholders, no unverified claims.
- [ ] No comments in `.js`/`.mcfunction`/`.json`. Recipes unlocked (1.4).
- [ ] Changed JSON validated. `check_instruction_files.py` passes if an instruction file changed.
- [ ] Verification stated: source created | package built | in-game tested, never mixed.

## Version History
- **v8:** Package names are `<Shortcut> VX.Y.Z.<ext>`; shortcut map in `scripts/pack_shortcuts.json`; `scripts/rename_packages.py` migrates old names.
- **v7:** Every changelog entry has a Name. Root `CHANGELOG.md` for the whole repo, updated by every script and included in the AI review bundle.
- **v6:** Nothing auto-bumps; build is passive; publish is its own workflow (no bump, groups changelog); Delete Package; scripts delete themselves after a successful push.
- **v5:** Telegram-style rewrite. NEVER/ALWAYS tags. Task index, one file per task. Three-section reply format. Workflow table removed (read the workflow files). Legacy four-part version notes removed. Templates synced to `doc_template.py`. Size cap 50 KB (`scripts/check_instruction_files.py`).
- **v4:** Reply format section.
- **v3:** Generator moved to `PACK_GENERATOR_INSTRUCTIONS.md`.
