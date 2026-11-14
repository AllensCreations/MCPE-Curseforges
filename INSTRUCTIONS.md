# Instructions: Core Repository Policy (v14)

Repo policy, docs rules for AllensCreations/MCPE-Curseforges (creator name `ALNStudios`). Generating a new project: `PACK_GENERATOR_INSTRUCTIONS.md`.

## Read Only What the Task Needs
| Task | Read | Sections |
| :--- | :--- | :--- |
| Docs (README/DESCRIPTION/CHANGELOG) | this file + `DOCS_RULES.md` | 1.1 to 1.3; 2.1 to 2.5 |
| Docs audit (`/checkrm`) | this file + `DOCS_RULES.md` | 1.1; all of `DOCS_RULES.md` |
| Version, manifest, LOCK, recipe, function, build, workflow, OneBlock changes | this file | 1.1 to 1.12 |
| New mechanic hits a vanilla limit | this file | 1.12 |
| Recipe images, sprites | this file + `DOCS_RULES.md` | 1.5; 3.3, 3.4 |
| New addon / map / script / minigame | `PACK_GENERATOR_INSTRUCTIONS.md` | all |
Read only the files and sections the task needs. Changing an instruction file: read both.

## Reply Format (STRICT: repo edits, updates, `.sh` deliveries)
`[SYSTEM_CONFIG] Direct Execution. Maximum token efficiency. No greeting, intro, outro, offers, restating. High technical accuracy.`
Questions, reviews, discussion: free-form.
Output ONLY, in order, exact headings:
1. **File Needed:** repo-root-relative path of each file created/edited.
2. **Changelog:** bullets, brief.
3. **Termux Script:** ONE fenced `bash` block holding ONLY the run commands (`bash ~/storage/downloads/<file>.sh`). The `.sh` is attached as the file, NEVER pasted here or in the reply. Commands live in this block only. NEVER a Summary section.
- NEVER text before, between, after. NEVER rename/merge/reorder/skip a section. Nothing to report: `- None`.
- Ask only when 1.1 allows, one line; else proceed with defaults.
- `/checkrm` audit report goes under **Changelog**: projects audited or updated, checks run and results, gaps.
- New-pack build: same three sections, File Needed = the pack `.sh` (`PACK_GENERATOR_INSTRUCTIONS.md` 4.11).

## Termux Script Rules
`.sh` named per 1.1, attached as a downloadable file. Order:
1. `#!/data/data/com.termux/files/usr/bin/bash` + `set -e`
2. `cd "$HOME/MCPE-Curseforges"` (clone first if missing)
3. `git pull --rebase`
4. Apply ALL changes inside the script. PROJECT UPDATE = search and replace: write a spec and run `python3 scripts/make_update_script.py spec.txt` (format in `scripts/apply_update.py`: `@@ replace`/`replace-all`/`insert-after`/`insert-before`/`delete`/`append`/`create`, exact match, atomic, idempotent; `--verify <clone>` dry-runs it). Size decides the method. SMALL update (a few edits, under about 60% of any file touched): search and replace only. LARGE update (most of a file, many new files, a redesign): use the best method, `@@ create`/`@@ overwrite` in the same spec, never many fragile edits. Either way ONE `.sh`. The tool also sets the manifest version, validates JSON/JS, writes both changelogs. Deliver ONLY the `.sh`: NEVER a separate `.zip`, pack file (`.mcaddon`/`.mcworld`/`.mcpack`), `.json`, `.js` or `.b64`. A NEW project is one pack `.sh` from `scripts/make_pack_script.py` (`PACK_GENERATOR_INSTRUCTIONS.md` Part 4).
5. Validate every changed `.json` with python3. Stop on error.
6. Run `python3 scripts/check_instruction_files.py` when an instruction file changed.
6b. Project update: after the CHANGELOG entry, run `python3 scripts/manifest_tools.py --project "$DEST" --set X.Y.Z`, then `--check` and `python3 scripts/validate_manifest_titles.py --project "$DEST"`. Stop on error.
7. `git add` changed paths only; `git commit -m "<short>"`; `git push`
8. Idempotent: skip applied changes.
9. Add an entry to the root `CHANGELOG.md` (repo-wide, newest first under `---`): `## [X.Y.Z] - YYYY-MM-DD - [Update Name]` (X.Y.Z = `REPO_VERSION`, set by `apply_update.py`, never by hand), then `### Added` / `### Improved & Balanced` / `### Fixed` with `- **Title**: what changed`. Every script does this, tooling-only changes included.
10. After a successful push, delete the script itself: `rm -f -- "$SELF"` (SELF = absolute path saved before `cd`; last line, only reached when everything above passed).
Every project update writes CHANGELOG.md (Part 2 format; heading version == `.sh` name version). Manifest versions: 1.3. NEVER edit README download links by hand (build aligns them).

## Scripts: Agent vs Termux
- `scripts/` is reference: read it to learn the workflow. The Termux `.sh` and CI run it.
- Agents MAY run only: test scripts (`scripts/test_*.py`), `scripts/selftest_project_types.py`, `scripts/make_update_script.py` (build the `.sh`, `--verify`), `scripts/check_instruction_files.py`.
- Agents NEVER run scripts that change the repo (build, bump, publish, delete, import, sync, rename).
- Project checks (`check_readme_status.py`, `validate_manifest_titles.py`, `manifest_tools.py --check`): the agent reads and reports; the `.sh` runs them.

## Precedence
Part 1 wins. `DOCS_RULES.md` never overrides it. Generator file never overrides this file. Accuracy and requested scope outrank any template. Section numbers refer to this file.

---

## Part 1: Core Policy

### 1.1 Accuracy
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
- Status: Add-ons (`MCPEDL/Addons/`) = ALWAYS `Likely achievement-friendly` (add-ons are achievement-friendly by Mojang's rules; keep cheat/world caveats). Other types: Likely achievement-friendly | Not achievement-friendly / may disable achievements | Unknown / needs confirmation.
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
- Optional per-pack listing images (distinct from the profile banners in 2.3; user supplies both): clickable in Creator and Permissions, 16:9 JPEG `assets/Images/<slug>-curseforge.jpg`, `<slug>-mcpedl.jpg`, link to verified pack listing. NEVER placeholders or invented URLs. Pair only if both images and both URLs exist.
- Generators: `scripts/`, fail clearly on missing Samples/texture/recipe. Register in `.github/workflows/generate-recipe-images.yml` (`push.paths`, run step, commit step; keep `workflow_dispatch`). Workflow commits PNGs `[skip ci]`. NEVER call images published until workflow succeeded and PNGs exist.
- Technical reference: Bedrock Wiki explains; verify schema/ids/format version against Samples + current docs. Cite it as community docs; link, NEVER copy.

### 1.6 Function Files
Paths from repo root. A function file existing != it runs.
- Functions: `<project>/behavior_pack/functions/<name>.mcfunction`. Tick: `functions/tick.json` `values` = names without suffix (`oneblock_tick`).
- Before delivery: 1 inspect real manifest, functions, `tick.json`, install steps, report paths; 2 `tick.json` valid, right dir, names existing function; 3 check syntax, ids, coordinates, deps (scoreboards). NEVER make a score-dependent command the only initial-block path unless init guaranteed; 4 validate JSON and `node --check` JS directly (project scripts run in the `.sh`), state what passed; 5 custom item delivered but block missing: diagnose item delivery and function execution separately (pack activation, world links, tick registration, name/path, command errors) BEFORE fallbacks or version bump.
- NEVER claim `tick.json` missing without inspecting installed/packaged copy.

### 1.7 OneBlock, Maps, Scripts, Minigames
General:
- OneBlock script = general pack. MUST work in any world. NEVER depend on a world's terrain/database/settings. Project-specific (coords, spawn, cleanup, shop) lives in that project's spec (Dirtbound: `SPEC.md` in its folder).
- `Mcpeworlds/{Creative,Survival,Hardcore}/` = ONLY world foundations (convenience targets, not a usage limit). NEVER old world ZIPs, `Oneblock-assets.mcworld`, `assets/Void_For_Workv2.mcworld`, persisted `assets/oneblock-template/`.
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
- Importer validates BEFORE writing. Rejects unsafe paths, symlinks, world data (`db/`, `level.dat`), nested archives, shipped link files, disallowed types, bad manifests, recipes without unlock, per-type misses. Icons MUST match repo copies in `Mcpeworlds/assets/resources_pack/textures/items/` byte for byte. Payload size capped; duplicate/case-colliding ZIP entries and control chars rejected; folder names differing only by case or existing under another type refused unless `overwrite` (lists deleted files); count actual bytes while extracting (declared ZIP sizes can be forged).
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

Project specs live in the project folder (Dirtbound: `MCPEDL/Maps/OneBlock-Dirtbound-Kingdom-Beta/SPEC.md`).

### 1.8 Workflows
- Workflows: `.github/workflows/`. ALWAYS read the actual file before editing or describing it. NEVER claim a run succeeded unless checked. NEVER trust summaries of workflows (they drift).
- Retired, NEVER recreate or reference: `update-min-version.yml`, `scripts/update_min_version.py`, `create-addon-scaffold.yml`, `test-crafting-template.yml`, `create-mcpe-world.yml`, `scripts/create_mcpe_world.py`, `scripts/check_generator_sync.py`.
- Version rules (1.3) changing workflow behavior: update the workflow in the same change.
- Entry points: read the workflow file; never rely on a summary of it.
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
- UUIDs unique across `MCPEDL/` (own folder excluded). `min_engine_version` = real looked-up version.
- NEVER `${{ inputs.* }}` or step outputs inside `run:`. Pass via `env:`, quote.
- Docs MUST pass `build_payload.py` `DOC:` checks (failures, not warnings).

### 1.11 Known Untested Assumptions
Open until confirmed in game. NEVER state as fact in docs.
1. Void cleaner: Y=-64 fill succeeds for a player spawning in a fresh void world; conditional tag (Dirtbound `SPEC.md`) retries correctly.
2. World host reports as Operator via `playerPermissionLevel` with cheats off (Controller reaches host on achievement-eligible world).
3. `isOp()` absent in 2.x `@minecraft/server` (Controller uses a helper). Re-check on every module bump.
4. Controller behavior across rejoin, death, reload. Tested only with mocked modules.
5. Shipped functions and Controller do not disable achievements unless an admin command is run.
6. Experiment/achievement state of each `Mcpeworlds/` foundation.

### 1.12 Vanilla Limits and Workarounds
Applies to every addon, map, script, minigame, item, entity, block, trade, recipe and enchantment, new or updated.
- A hardcoded vanilla limit blocks the requested mechanic (examples: mutually exclusive enchantments, item, entity or component caps, trade or recipe limits) AND the standard approach (behavior JSON, commands, crafting, enchanting) fails: NEVER drop the feature silently. The standard approach works: use it, no workaround.
- Lightest workaround first. 1) Data-driven: custom item, block, entity, recipe, loot, trade, spawn rule, animation controller, tag, component. 2) `@minecraft/server`: custom components, events, ItemStack and Entity APIs, dynamic properties, tags or scoreboard for state. 3) Structural: helper or proxy entity, swapped or replaced item or entity, tiered item variants, `.mcstructure` or template placement, function-driven effects.
- NEVER invent an API, component, event or behavior. Use only what the looked-up stable version (1.2) provides and the repo scripts accept. Cannot verify: say so in DESCRIPTION.md.
- Modular: one small file per workaround with one entry point (script: `behavior_pack/scripts/lib/<name>.js` imported relatively; data: its own function file, entity or item definition). Reuse an existing module. NEVER copy the logic per feature.
- Safe: idempotent setup, caps and cleanup for spawned entities and loops, nothing that corrupts worlds or other packs.
- Docs (`DOCS_RULES.md`): player-facing result only, no code or API names; the trade-off under Good To Know. State achievement and experiment impact per 1.2.

### 1.13 ALN UI Redesign (UI skin)
- `assets/aln-ui-redesign/` is the shared UI skin (formerly Cheatstick UI): `README.txt` (how to apply), `design.json` (tokens), `textures/`, `preview_reference.png`.
- Any pack that adds or changes a menu, form, HUD or screen reads `README.txt` and `design.json` first and ships the skin in its Resource Pack: textures copied in (never linked), tokens reused (NEVER invent colors or layout). Version the Resource Pack with `manifest_tools.py --set` like every update.
- Pack task needs the skin: ask for Collect Files `paths` = `assets/aln-ui-redesign, <pack folder>/resource_pack`. NEVER edit the shared folder from a pack task unless asked.
- Menu text uses the shared Pixelify Sans glyph font in `assets/aln-ui-redesign/font/` (its README.txt has the steps): copy the glyph sheet into the Resource Pack `font/`, wrap strings with `pixelify()`.

### 1.14 ALNStudios Redesigned UI Standard (every add-on with a menu)
Placeholders `<PackName>`, `<MainAction>`, `<version>`. NEVER hardcode one pack.
- Main menu: ONE ActionForm, exactly 3 buttons: `<MainAction>`, About, Exit. X also exits. Menus loop; every sub-screen has Back.
- Title `§l§6@ALNStudios §e<PackName>§r (v<version>)` = the ONLY colored form text. Script version constant == manifest version, bumped together.
- Colors ONLY in title and action bar. Body, labels, slider labels, buttons, summaries: default color + `§l`, `§r` after bold. NEVER `§f §7 §e §a` etc. in forms.
- About: title `About ALNStudios`. Body: creator, `<PackName>` + version, one line on the pack, CurseForge and MCPEDL profile text (plain, not clickable), not-affiliated-with-Mojang line. One Back button to main menu. Icon = `assets/aln-ui-redesign/about_icon.png` shipped in the RP as `textures/ui/aln/about_icon` (no `.png`); RP or file missing: `textures/items/name_tag`.
- Icons: `<MainAction>` icon matches the pack, only if the pack needs one and a verified path exists (else none). About and Exit always have an icon. ONLY paths verified in Mojang `resource_pack/textures/item_texture.json` (bedrock-samples). NEVER guess; no verified path = no icon. `wooden_` -> `wood_`, `golden_` -> `gold_`. Spears `textures/items/spear/<wood|stone|copper|iron|gold|diamond|netherite>_spear`. Nautilus armor `textures/items/nautilus_armor/<material>_nautilus_armor`.
- Feedback: `player.onScreenDisplay.setActionBar`, NEVER chat. Green success, yellow warning, red error. Second message chained with `system.runTimeout(..., 50)`.
- Slider/modal forms: header = item or context name, label = current state, divider after every control. Optional form methods go through a guarded helper (a missing method NEVER crashes). Read `formValues` filtering numbers.
- NEVER slide or fade animations in UI JSON. Use the skin in `assets/aln-ui-redesign/` (1.13).

---

## Parts 2 and 3: Docs, Audit, References (moved)
`DOCS_RULES.md`: README, DESCRIPTION and CHANGELOG rules and templates (2.1 to 2.5); `/checkrm` audit procedure and the Minecraft Wiki and Bedrock Samples references (3.1 to 3.4).

---

## Final Self-Check (run before replying)
- [ ] Reply = three sections only (File Needed, Changelog, Termux Script).
- [ ] Versions per 1.3, script name per 1.1.
- [ ] CHANGELOG.md updated, top heading == new version == script name version.
- [ ] Docs match the `DOCS_RULES.md` templates exactly, no placeholders, no unverified claims.
- [ ] No comments in `.js`/`.mcfunction`/`.json`. Recipes unlocked (1.4).
- [ ] Changed JSON validated. Instruction file changed: `scripts/check_instruction_files.py` passes.

## Version History
- **v14:** `CHECKRM_REFERENCE.md` merged into `DOCS_RULES.md` (Part 3); 1.8 entry-point list removed; one `requirements.txt` for workflows.
- **v13:** Docs rules and templates moved to `DOCS_RULES.md` (single source for both instruction files); the generator's Part 1 excerpt is kept identical to this file by the checker.
- **v12:** Part 3 moved to `CHECKRM_REFERENCE.md`; Dirtbound spec moved to its project folder; scripts reference-only for agents; duplicates and contradictions removed; size cap 60,000 bytes.
