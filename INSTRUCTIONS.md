# Instructions: Core Repository Policy (v3)

Instruction file for AllensCreations/MCPE-Curseforges covering repository policy, documentation, and audits. The AI-agent project generator now lives in its own file, `PACK_GENERATOR_INSTRUCTIONS.md`.

| Part | Covers |
| :--- | :--- |
| Part 1 | Core policy: accuracy, versions, manifests, recipes, images, functions, OneBlock, workflows, layout, security, known untested assumptions |
| Part 2 | README, DESCRIPTION, and CHANGELOG rules, attribution, keywords, templates |
| Part 3 | `checkrm` documentation audit workflow, Minecraft Wiki and Bedrock Samples references |

The generator (asks addon / map / script, returns a base64 ZIP built by `scripts/build_payload.py`) is in `PACK_GENERATOR_INSTRUCTIONS.md`. It carries its own copy of the rules it needs, and this file wins on any conflict.

**Precedence.** Part 1 wins on any conflict. Parts 2 and 3 follow Part 1 and never override them. `PACK_GENERATOR_INSTRUCTIONS.md` follows this file and never overrides it. Factual accuracy and the user's requested scope outrank any template. The scripts in `scripts/` enforce these rules; if a script and this file disagree, report the difference to the user and follow this file for documents, the script for what the importer will accept. **Section numbers refer to the Part they appear in**; a reference to another Part names it.

**Which file to read.** Documentation work: Parts 1 (Sections 1 to 2), 2, 3. Build, workflow, or OneBlock changes: Part 1 (Sections 6 to 10). Generating a new add-on, map, or script: `PACK_GENERATOR_INSTRUCTIONS.md`.

---

## Part 1: Core Policy

### 1. Precedence and Accuracy

- Factual accuracy and the user's requested scope outrank any template. Do not follow conflicting examples blindly.
- Inspect source files before making claims. Ask the user only when an unresolved choice could materially affect gameplay, compatibility, distribution, data loss, or versioning. For ordinary style choices, use the defaults and proceed.
- Never invent features, versions, links, assets, test results, compatibility, achievement support, performance guarantees, or platform behavior. Separate verified facts from assumptions.
- Never claim an in-game test, function execution, or gameplay result unless it was actually tested in Minecraft. Archive, JSON, and syntax checks prove structure only.
- **Source priority.** When sources disagree, use this order and report the disagreement instead of choosing silently:
  1. The add-on's own files (manifests, JSON, scripts, textures).
  2. Mojang [Bedrock Samples](https://github.com/Mojang/bedrock-samples) for vanilla identifiers, textures, recipes, components, and data formats.
  3. Official [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable) for stable versions and API availability.
  4. [Minecraft Wiki](https://minecraft.wiki/) for display names, Bedrock/Java availability, and the appearance of icons and assets.
  5. [Bedrock Wiki](https://wiki.bedrock.dev/) for community-documented formats, techniques, and troubleshooting.

  Sources 4 and 5 are community-maintained and can lag behind releases. They never override 1 to 3 on identifiers, versions, or API availability.
- **No comments in shipped code.** Do not write comments in `.js`, `.mcfunction`, or `.json` files; keep code short and self-explanatory. Explanations belong in documentation or the handoff.
- **Shell script file names.** Whenever you give the user a `.sh` file (including a command or script handed over because you cannot run code), name it `(Repofilename)_(Version)_(Rand).sh`. `Repofilename` is the repository file, project, or folder the script works on, without its extension and with no spaces (use hyphens); `Version` is that item's current version as `X.Y.Z` (or the instruction file's version, such as `v3`); `Rand` is at least 5 random lowercase letters or digits, for example `Dirtbound_1.2.0_k7q2x.sh` or `INSTRUCTIONS_v3_m4p7z9.sh`. Generate a fresh `Rand` every time (for example `head -c 200 /dev/urandom | tr -dc 'a-z0-9' | head -c 6`) and never reuse a name from an earlier reply or an existing file, so running a new script can never overwrite or re-run an older one. Use the exact same name in the reply and in the command that runs it.
- **Not an official product.** Public documentation must not imply endorsement by Mojang or Microsoft (see Part 2, Section 4).

---

### 2. Versions and Compatibility

#### Always look up the latest stable

- Do not rely on version numbers written in this file or remembered from training. When creating or updating a pack, look up the **latest stable** Minecraft Bedrock release and the **latest stable** Script API module versions from the official Minecraft Creator documentation at the time of the work, and record the date checked.
- Official references:
  - [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable)
  - [Script API versioning](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning?view=minecraft-bedrock-stable)
  - [`@minecraft/server` stable reference](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable)
  - [`@minecraft/server-ui` stable reference](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable)
  - [Latest platform version guidance](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/latestplatformversion?view=minecraft-bedrock-stable)
- Community references ([Bedrock Wiki](https://wiki.bedrock.dev/), [Minecraft Wiki](https://minecraft.wiki/)) are never used to pick versions or confirm API availability.
- Select the highest stable module version supported by the target game and every other dependency in the pack, checking peer-dependency requirements. Never use preview, beta, or RC versions unless a requested feature requires them, and then say so in the documentation and handoff.
- Game versions and Script API module versions are separate systems; do not infer one from the other.

#### Engine version policy

- `min_engine_version` is the lowest game version the implementation actually needs, as a 3-integer array. It must be a real, looked-up version; `[0, 0, 0]` is a placeholder and is rejected.
- Do not hardcode a minimum (such as 1.26) in this file or in generated documentation. A new pack targets the latest stable release at the time of the work, and its `min_engine_version` is the lowest version that supports every feature it uses. If a pack needs the newest release, say which feature requires it.
- Preview and Beta builds are not a target. They are used only when a requested feature requires them, with a warning in the documentation.
- `format_version` of a manifest is `2`. Item and block JSON `format_version` must not be newer than `min_engine_version`.
- The compatibility line in `DESCRIPTION.md` states the verified minimum, for example "Minecraft Bedrock Edition: 1.21.0 or newer", only with a version that was verified. Do not write "or newer" for a version you did not verify.
- When updating an older pack, preserve UUIDs, persistent identifiers, and working behavior. Upgrade dependencies deliberately, not wholesale. Raising `min_engine_version` drops older players, so say so in the CHANGELOG.

#### Achievement and experiment assessment

Do this for every new pack and meaningful update. A compatible API version does not by itself establish achievement compatibility or experiment status.

- Inspect manifests, dependencies, stable-versus-preview imports, content JSON, components, scripts, functions, and any included world settings. Confirm suspected experiment requirements against current official documentation, not just a keyword match. Stable Script API or JavaScript use alone does not mean experiments are required or achievements are disabled.
- Inspect world experiment toggles and cheats/achievement settings separately when world settings are available. Pack files cannot establish the settings of an existing player world.
- If nothing is found, write "No experiment requirement detected in the inspected files." This does not prove every world setting or future version is safe.
- Prefer a stable, non-experimental implementation that preserves the requested behavior. Do not silently weaken a feature to avoid an experiment.
- Achievement status is one of: **Likely achievement-friendly** (no disabling condition found), **Not achievement-friendly / may disable achievements** (requires cheats, experiments, preview-only features, or another documented condition), or **Unknown / needs confirmation**. Never promise achievements stay enabled without verifying the exact game version, pack, and world setup.
- **Admin commands count.** Functions that need cheats or operator status (`give_controller`, `end_game`, manual setup functions) are optional recovery tools. Using cheats in a world disables achievements in that world, so say this wherever such a function is documented and do not mark a pack "Likely achievement-friendly" without that caveat.
- Handoff summary: achievement status, experiments (none detected / required with name / unknown), evidence, and scope (what was inspected, and whether actual world settings were available).

#### Implementation rules

1. Inspect the existing manifest, entry points, imports, and structure before editing.
2. Confirm each API member's availability against the chosen stable module version.
3. Prefer event-driven logic over per-tick polling, repeated broad entity searches, or expensive block scans.
4. Use vanilla JSON components and `.mcfunction` files when simpler; use Script API where the feature needs it.
5. Avoid knowingly malformed files and fix obvious issues as you go.
6. Record in handoffs: target game version, `min_engine_version`, module versions used, any preview/experimental requirement, references checked with the date, and verification status (source created, package built, or in-game tested; never conflate these).

---

### 3. Manifest Title, Attribution, and LOCK Marker

- Every Behavior Pack and Resource Pack manifest title is `Add-on Name (vX.Y.Z)`, for example `Vanilla Quality of Life (v1.3.0)`. Update it whenever the release version changes; release automation must preserve this.
- Put `by AllensCreations` in `header.description` exactly once. Normalize existing descriptions rather than appending duplicates. Keep attribution out of the title.
- Do not change pack UUIDs or world storage keys just to rename a title.
- **Title validator**, run in the release workflow, failing the job on any violation and reporting errors rather than rewriting titles. For every manifest under `MCPEDL/`:
  - exactly one terminal `(vX.Y.Z)` suffix;
  - that version matches `header.version`;
  - no malformed or duplicated suffixes;
  - `behavior_pack/` and `resource_pack/` versions match when both exist.
- Run it for one project with `python3 scripts/validate_manifest_titles.py --project <project-path>`.

#### Version, UUID, and engine sync

- The release workflow runs `scripts/sync_manifest_versions.py` before bumping. For every project it processes, it sets every source pack's `header.version` and module versions to the project's highest version, rewrites the `(vX.Y.Z)` title suffix to match, updates dependency versions that point at a pack in the same project, keeps installed world copies and world link files (`world_behavior_packs.json`, `world_resource_packs.json`) in step with the source manifests, and replaces invalid or duplicate **module** UUIDs.
- **Pack header UUIDs are never regenerated.** Changing one breaks existing worlds. The only UUID repair applied to a dependency is repointing a single unresolved Behavior Pack dependency to the project's own Resource Pack header UUID, and the workflow logs it. A duplicate header UUID across projects, or an invalid one, is a failure for a person to fix.
- `min_engine_version` is synced between a project's packs by raising the lower one, never lowering. With "Raise min_engine_version" on (default), it is also raised to the newest item or block `format_version` the Behavior Pack contains (Section 2). This drops older players, so add it to the CHANGELOG.
- After the rebuild, `scripts/sync_manifest_versions.py --verify-only` runs `scripts/check_manifest_versions.py` on the processed projects and fails the job before anything is committed. `check-manifest-versions.yml` checks every manifest on pull requests and on demand.

- `scripts/sync_project_docs.py` runs after the rebuild for the same projects. It sets the version in each `DESCRIPTION.md` title line to the manifest version, and adds a `## [X.Y.Z] - YYYY-MM-DD` entry to `CHANGELOG.md` when the newest entry is older than the manifest version (creating the file if it is missing). The entry only names the areas that changed (items, blocks, gameplay scripts, and so on) or says it was a maintenance release. It never invents features, so edit it to describe what players will notice. It never touches a changelog whose newest entry is already newer than the manifest.

- `scripts/sync_readme_links.py` runs on every release, after the rebuild, over every README: root `README.md`, `builds/README.md`, `builds/<project>/README.md`, `MCPEDL/<category>/README.md`, each project README, and `Mcpeworlds/README.md`. It finds links by their target, not by label text, so a download link to a package that a rebuild deleted is repointed to the current file (a map with its own world archives points to the first of Creative, Survival, Hardcore). A project with no package at all is linked to its project page instead, and the run reports it. It refreshes the version in catalog rows and add-on headings, reports links to files that do not exist and headings that do not exist, and never invents a download. `python3 scripts/sync_readme_links.py --check` previews. The workflow `sync-readmes.yml` runs it on demand.

#### Add-on LOCK marker

- Every project under `MCPEDL/addons/` and `MCPEDL/new_addons/` has a `LOCK` file at its root beginning with `AllensCreations Add-on Lock v1`.
- `scripts/import_project_payload.py` creates it and the build script enforces it. A missing or invalid marker is release-blocking: report the exact project path and do not call the project build-ready.
- It is a repository and build safeguard only. It does not encrypt source, stop edits, or prevent extraction of a distributable package.

---

### 4. Recipe Unlock Rule

Every custom **crafting** recipe (shaped and shapeless) must be unlocked by default using the schema its recipe type requires:

Shaped recipes use an object and shapeless recipes use an array, which is the form `scripts/ensure_recipe_unlocks.py` writes:

```json
"unlock": { "context": "AlwaysUnlocked" }
"unlock": [{ "context": "AlwaysUnlocked" }]
```

- Use the object form in `minecraft:recipe_shaped` and the array form in `minecraft:recipe_shapeless`. Validators accept either form so a hand-written recipe is not rejected for the other one; the generator always writes the form above. Do not mix schemas inside one recipe.
- Compare an existing recipe's type against the Bedrock Samples reference before choosing syntax.
- The rule covers `minecraft:recipe_shaped` and `minecraft:recipe_shapeless` only. Furnace, brewing, smithing, and other recipe types follow their own vanilla schema and are not given an `unlock` field unless Samples shows that type supports one.
- Validators must parse the JSON and check the `unlock` key of the recipe object; a plain text search for the word `AlwaysUnlocked` is not sufficient.
- Do not change ingredients, result, count, station/tags, or shaped/shapeless structure. Do not rely on recipe-book discovery unless the user asks.
- Apply to all new recipes and any existing recipe you touch.

---

### 5. Recipe Images and Item Sprites

#### When to create

- Optional. Create diagrams or sprites only when the user requests them or project instructions require them, and only for `DESCRIPTION.md`.
- Never use AI image generation unless the user explicitly asks.
- Use verified absolute raw GitHub URLs. Confirm every referenced image exists, is committed, and matches the item or recipe. Remove outdated images.
- Item sprites use the real texture from the add-on or an authoritative vanilla source.

#### Diagram rules

- Build diagrams programmatically from the actual recipe JSON, the add-on's real result texture, and vanilla textures from Mojang's Bedrock Samples (root from the `BEDROCK_SAMPLES_ROOT` environment variable; the recipe-image workflow clones it to `/tmp/bedrock-samples`). The recipe JSON is authoritative for ingredients, quantities, result, count, and shaped/shapeless behavior. Never change a recipe to fit an image.
- **Board reference:** `scripts/CRAFTING_TABLE.svg` is the only authorized reference, rendered through `scripts/crafting_template.py`, which reads slot positions from the SVG's ids (`slot-0` to `slot-8` in row-major order, `slot-N-fill`, `output`, `output-fill`, `arrow`). Any PNG export is derived from it. Never use `CRAFTINGBOARD.PNG`, screenshots, hand-drawn boards, or remembered interfaces. If the SVG is missing or unreadable, stop and report it.
- Always show the full 3x3 grid. Shaped recipes keep exact row/column placement and empty cells; shapeless ingredients fill cells in row-major order. Never flatten to a list. Show quantities and the output count in the output slot.
- Colors come from `scripts/CRAFTING_TABLE.svg`. Do not hardcode board colors and do not leave the background transparent.
- Style: plain vanilla-style gray UI, crisp nearest-neighbor pixel art, consistent icon size, precise alignment. No ornate frames, gradients, glow, labels, or emojis.
- Present one diagram per row at the SVG's native 400x222 size.

#### Textures

- Use inventory-style item sprites, never cropped world textures. If only block-face textures exist, build a small isometric cube from verified matching faces (top and side); never stretch one face.
- **Source order for vanilla textures and icons:**
  1. Bedrock Samples is the primary source for vanilla names, identifiers, and textures.
  2. The Minecraft Wiki confirms what an icon should look like, the official display name, and edition availability. It is a **fallback image source only when Samples has no usable inventory-style sprite**.
  3. No third-party packs, guessed filenames, or approximate icons.
- **Using the Minecraft Wiki as an image source:**
  - Wiki images are CC BY-NC-SA (NonCommercial, ShareAlike) unless the file page says otherwise. That conflicts with monetized platform pages and with the all-rights-reserved block in Part 2. Use a Wiki image only when the user explicitly approves that specific image after hearing this; otherwise use Samples or report the gap.
  - Look sprites up by Wiki name: `Invicon_<Title_Case_Name>.png` for inventory renders and `ItemSprite_<lowercase-hyphenated-name>.png` for flat sprites.
  - Open the file page first and confirm license and attribution.
  - Record every Wiki-sourced image (file page URL, license, date retrieved) in the generator's header comment or in `scripts/ASSET_SOURCES.md`, and add attribution to the project's `DESCRIPTION.md` when published. (Generator scripts in `scripts/` may carry comments; the no-comments rule covers shipped pack files only.)
  - Prefer Samples-derived sprites. Do not bulk-copy Wiki images or large blocks of Wiki text.
  - If network policy blocks `minecraft.wiki`, report it and fall back to Samples. Do not route around the block.
- Inspect the add-on's whole recipe directory first and build an explicit ingredient-to-texture mapping for every ingredient. Filenames often differ from item IDs (Enchanted Golden Apple uses the golden apple texture), and files may be under `textures/items/` or `textures/blocks/`. Verify each path exists and depicts the correct item.
- Never substitute another icon or skip an ingredient. Report all unresolved ingredients together and stop.

#### Generators and workflow

- Keep generators in `scripts/`. They must fail clearly if the Samples pack, a texture, or a recipe file is missing.
- Register every generator in `.github/workflows/generate-recipe-images.yml`: add its path to `push.paths`, add an explicit run step, and stage its output in the commit step. Keep `workflow_dispatch` enabled.
- The workflow checks out Bedrock Samples, installs Pillow, runs generators, and commits PNGs with `[skip ci]`. It reruns when recipe JSON, source textures, generators, or the workflow change.
- Keep generated PNGs in the repository; a correct URL does not prove the file exists.
- Do not call images generated or published until the workflow succeeds and the PNGs exist. If a generator fails, fix the first unmapped ingredient at its source and rerun.

#### Technical reference

- Use the Bedrock Wiki to understand a format or technique, then verify the exact schema, identifiers, and format version against Bedrock Samples and current official documentation before writing it into a pack.
- Cite the Bedrock Wiki page in handoff notes when it informed a decision and note that it is community documentation. Link to it instead of copying its text.

---

### 6. Function Files

Applies whenever creating, editing, or debugging a `.mcfunction`. A function file existing does not mean it runs. Resolve paths from the repository root.

- Functions: `<project>/behavior_pack/functions/<name>.mcfunction`.
- Tick registration: `<project>/behavior_pack/functions/tick.json`, whose `values` list names relative to `functions/` without the `.mcfunction` suffix (for example `oneblock_tick`).
- Functions meant only to be called explicitly still live in `functions/`; verify the caller.

Before delivery:

1. Inspect the real `manifest.json`, function files, `tick.json`, and install steps. Report the paths inspected.
2. Confirm `tick.json` is valid JSON, in the right directory, and names an existing function.
3. Check command syntax, identifiers, coordinates, and dependencies such as scoreboards. Do not make a score-dependent command the only path that creates an initial block unless initialization is guaranteed.
4. Run available JSON and project validation and state exactly what passed.
5. If a player receives a custom item but an expected block does not appear, treat item delivery and function execution as separate paths. Diagnose pack activation, world pack links, tick registration, function name/path, and command errors before adding fallbacks or bumping the version.

Do not claim `tick.json` is missing without inspecting the installed or packaged copy.

---

### 7. OneBlock Scripts

#### General use

- A OneBlock script is a general-purpose pack. It must work in any world it is added to and must not depend on a specific world's terrain, database, or settings.
- Anything specific to one project (coordinates, spawn, cleanup, shop access) belongs to that project's own spec, not to these general rules. Dirtbound's spec at the end of this section is a worked example.
- The three folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/` are convenience delivery targets, not a limit on where a script can be used.

#### Workflow

The authoritative world foundations are the direct folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/`. The OneBlock build workflow copies each matching foundation into a temporary staging directory, preserves its valid `level.dat`, integrates the map's current Behavior Pack and Resource Pack, then packages the completed world as a `.mcworld` inside `MCPEDL/maps/<Map-Name>/`.

1. Keep map source packs in `MCPEDL/maps/<Map-Name>/behavior_pack/` and `resource_pack/` (when required), with the project's docs and configuration.
2. Use `Mcpeworlds/` as the only source of world foundations. Do not use old world ZIPs, `Oneblock-assets.mcworld`, `assets/Void_For_Workv2.mcworld`, or a persisted `assets/oneblock-template/`. Do not recreate the retired `create-mcpe-world.yml` workflow or `scripts/create_mcpe_world.py`.
3. Preserve the intentional database-free void design: never create, fabricate, borrow, or require `db/CURRENT` or LevelDB data.
4. On relevant source, foundation, builder, or instruction changes, `build-oneblock-variants.yml` automatically builds Creative, Survival, and Hardcore worlds and synchronizes the map README. Manual dispatch remains available.
5. Validate the generated archive structure and pack references. Report structural checks separately from Minecraft gameplay testing.

For maps, Creative is the primary and only designated in-game test world (a script's `test_world.json` chooses its own mode). Do not create a separate `.mcaddon` tester package or a `Tester Build/` folder. Unrelated add-on build workflows must not misclassify a map as a standalone add-on.

#### Creating a project from an AI-generated payload

- `PACK_GENERATOR_INSTRUCTIONS.md` is the instruction file given to an AI agent. The agent first asks which type the user wants (**addon**, **map**, or **script**), then returns a single-line base64 ZIP produced by running code, never written by hand. The ZIP's `project.json` (`{"type": "addon|map|script", "name": "..."}`) carries the type.
- `create-project-from-base64.yml` takes the folder name plus the base64 (or a `.b64` path under `MCPEDL/incoming/`) and runs `scripts/import_project_payload.py`, which imports `scripts/build_payload.py`, so the agent-side and repo-side checks are the same code.
- Destinations: addon -> `MCPEDL/new_addons/<Name>/` (the importer writes the `LOCK` markers); map -> `MCPEDL/maps/<Name>/` (the importer writes `oneblock.json`; Creative, Survival, and Hardcore worlds are built in the same run); script -> `MCPEDL/script/<Name>/` (a test world is built).
- The importer validates before writing anything. It rejects unsafe paths, symlinks, world data (`db/`, `level.dat`), nested archives, shipped pack link files, disallowed file types, bad manifests, recipes without the required unlock, and the per-type requirements below. Icons must match the repo copies under `Mcpeworlds/assets/resources_pack/textures/items/` byte for byte.
- Map requirements: `tick.json` lists `void_cleaner` first, `void_cleaner.mcfunction` starts with the required Y=-64 fill line, `oneblock_setup.mcfunction` exists, and the Trader Ledger item, texture entry, and `trader_ledger.png` are present. Add-ons and scripts do not need the void cleaner or the ledger.
- The folder name is typed per run; never hardcode one in a workflow or script. A payload with only `oneblock.json` (no `project.json`) is still accepted as a map.
- When Sections 3, 4, 6, or 7 change, update `PACK_GENERATOR_INSTRUCTIONS.md`, `scripts/build_payload.py`, and the importer in the same change, then run `scripts/selftest_project_types.py`. This file wins on any conflict.
- These checks prove structure only. Never claim the add-on, map, script, or world works in Minecraft until tested in game.

#### Scripts and test worlds

- A script project is `MCPEDL/script/<Name>/` with `behavior_pack/` (script module, `scripts/main.js`), `resource_pack/`, `project.json`, `test_world.json`, and the documentation files.
- Every script ships the Controller item (`allenscreations:controller`, texture `controller.png`, a 16 x 16 icon kept at `Mcpeworlds/assets/resources_pack/textures/items/controller.png`). Using it opens a form with **Start** and **How to play**; the script keeps the state (idle, running, ended) in a world dynamic property. A project may opt out with `"controller": false` in `project.json`.
- Only the host or an operator receives and can use the Controller. **Start** works while no game is running. **How to play** opens a page with the rules and a Back button. The game ends through its own win or lose logic, which calls `endGame()`.
- **Survival breaks the Controller, Creative keeps it.** Start consumes the first Controller found in the player's inventory unless the player is in Creative. When the game ends, the script gives the host or operator a fresh Controller if they have none.
- **Stuck-state recovery.** The game state must not be able to stay `running` forever. On world load, a script that cannot restore a live game must reset the state to `idle` and give the host or operator a Controller. `give_controller.mcfunction` and `end_game.mcfunction` ship with every Controller script but need cheats, so they are a last resort and never the only recovery path.
- `test_world.json` is `{"mode": "Creative", "include_addons": ["Name", ...]}`. Included add-ons are looked up in `MCPEDL/addons/` and `MCPEDL/new_addons/`. `scripts/build_test_world.py` copies `Mcpeworlds/<mode>`, installs the script and every included add-on, links all packs, and writes `<Name> - Test.mcworld` into the project folder. It fails on a missing include, duplicate pack UUIDs, or an unresolved pack dependency. Experiments and achievement state come from the foundation and are not verified.
- `build-test-world.yml` rebuilds test worlds on demand. Add-ons may also carry a `test_world.json`.
- The one-OneBlock-pack-per-world rule applies to maps only; a script test world may link several packs.

#### Installing into the world folders

Repeat for each mode folder, with identical results in all three:

- Copy `behavior_pack/` to `<mode>/behavior_packs/<Map-Name>_BP/` and `resource_pack/` (if present) to `<mode>/resource_packs/<Map-Name>_RP/`. Create the directories if missing; use the same folder names in every mode.
- On an update, replace the whole pack folder so no stale files remain.
- Write or update the link file at the world root: `world_behavior_packs.json` (and `world_resource_packs.json` for a Resource Pack), one entry per pack using the exact manifest header values:
  ```json
  [{ "pack_id": "<manifest header uuid>", "version": [1, 0, 0] }]
  ```
  Replace the entry with the same `pack_id` on update. Never invent a UUID or version.
- Only one OneBlock gameplay pack may own the platform and core. Before installing a different OneBlock script, remove the previously installed OneBlock pack folders and link entries from all three modes. Leave unrelated packs alone.
- Do not modify the source foundations under `Mcpeworlds/`. The build copies the selected foundation and may rename only the staged copy's world name metadata. `db/CURRENT` and LevelDB data must remain absent in the source and output. If the Behavior Pack's dependencies are unresolved, stop and report the exact path.

#### Verification

- Manifest, `tick.json`, and function files are valid and wired correctly (Section 6).
- Each mode folder's installed pack matches the source, and each link entry matches the manifest's UUID and version.
- The Resource Pack dependency UUID resolves, when one exists.
- Script files pass available syntax checks.
- The importer, `build_oneblock_variants_from_template.py` (`verify_archive`), and `build_test_world.py` run these checks when a project is created or rebuilt; `scripts/selftest_project_types.py` exercises all three project types end to end.
- State precisely what passed. Structural checks never prove Minecraft loaded the world or that progression works.

#### Map README

- Download-focused. Link Creative, Survival, and Hardcore only to compiled `.mcworld` files that actually exist in `MCPEDL/maps/<Map-Name>/`, and keep the source version aligned with the current Behavior Pack. Do not claim an archive matches the current source unless it was checked. Catalog entries in `MCPEDL/maps/README.md` follow the same rule.

#### Example project spec: Dirtbound

- Core `(0,0,0)`, Bedrock `(0,-1,0)`, world spawn `(0,1,0)`. The custom Trader Ledger item is the only shop access; there is no physical Trader Post.
- `void_cleaner.mcfunction` runs once per player, guarded by `tag=!void_cleaned`, in this order:
  1. `execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air` (33x33 = 1,089 blocks on Y=-64; `fill 0 -64 0 15 -64 15 air` clears only 256 and is wrong)
  2. teleport the untagged player to `(0,1,0)` (the only function-side teleport)
  3. Bedrock at `(0,-1,0)`
  4. grass placeholder at `(0,0,0)`
  5. set world spawn to `(0,1,0)`
  6. send the cleaning notice
  7. add the `void_cleaned` tag, **only once the core Bedrock exists** (see below)
- **Chunk loading.** Bedrock does not keep spawn chunks loaded the way Java does. If the fill runs while its chunks are unloaded, it fails silently. To make the cleanup self-healing, the final tag command must be conditional on the result, for example `execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned`, so a failed cleanup retries on the next tick instead of being marked done. The notice (step 6) must not spam while retrying, so guard it the same way or accept that the retry window is short. This design is unverified until tested in game (Section 11).
- Do not expand cleanup beyond this layer without approval. (`PACK_GENERATOR_INSTRUCTIONS.md` says the same; neither Part adds a "clear starting area" step.)
- `tick.json` lists `void_cleaner` before `oneblock_tick`. `oneblock_tick` may restore only missing Bedrock; it must not reset spawn, teleport players, or place/replace the core.
- The Script API owns the core at `(0,0,0)`, break rewards, and stage progression, and waits until a player has `void_cleaned` before replacing the grass placeholder.
- Player tags persist in saved worlds, so a source fix does not patch an already-imported world. To test a fix, import a fresh copy of the updated world as a new world.
- When mechanics change, update source, player-facing docs, and test checklists together, and reinstall into all three world folders.

---

### 8. Workflows

Workflows live in `.github/workflows/`. The roles below are a summary and will drift; **read the actual workflow file before editing it or describing what it does**, and never claim a workflow ran or succeeded unless its run was checked.

| Workflow | Role |
| :--- | :--- |
| `auto-version-bump.yml` | Single release workflow. On push to main it bumps versions, rebuilds packs, and registers new projects; daily and on manual run it refreshes and rebuilds without bumping. Every run syncs project, category, builds, root and OneBlock map READMEs and audits README status. Must keep manifest titles in the `Name (vX.Y.Z)` format (Section 3). |
| `check-manifest-versions.yml` | Checks every manifest for version, UUID, dependency, import, and engine-version problems. Runs on pull requests, on pushes that touch manifests, and on demand. |
| `remake-docs.yml` | Remakes README, DESCRIPTION, and CHANGELOG for all projects or one (`standardize` keeps text, `rebuild` regenerates add-on docs). Dry run and pull request by default. |
| `sync-readmes.yml` | Makes every README link and version match the real builds (fixes 404 download links). Dry run option. The release workflow runs the same sync. |
| `build-oneblock-variants.yml` | Builds the Creative, Survival, and Hardcore database-free `.mcworld` archives into `MCPEDL/maps/<Map-Name>/`. |
| `create-project-from-base64.yml` | Manual run: decodes a base64 ZIP into the matching `MCPEDL/` folder and builds the worlds that type needs. `commit_mode` defaults to `pull_request`; `direct` pushes straight to the branch. |
| `build-test-world.yml` | Manual run: rebuilds `<Name> - Test.mcworld`. |
| `apply-generator-upgrade.yml` | Manual run: applies a reviewed upgrade ZIP; dry run by default. |
| `generate-recipe-images.yml` | Regenerates recipe diagrams (Section 5). |
| `ci.yml` | Pull-request checks: Python syntax, manifest titles, README audit (advisory), crafting template test, and the project pipeline self-test (`selftest_project_types.py --fake-foundation`). |
| `update-min-version.yml` | Manual run: sets `min_engine_version` in the manifests of chosen projects to a looked-up version. It does not edit this file or any README. |
| `manage-addon-status.yml` | Manages add-on status. |
| `delete-project.yml` | Deletes a project. |
| `collect-ai-review-files.yml` | Bundles the instruction file, scripts, workflows, and icon hashes for AI review. |
| `export-repo-to-txt.yml` | Exports chosen paths to readable TXT for AI use. |
| `extract-zip-to-folder.yml` | Extracts a repository ZIP into a chosen folder. |
| `cleanup_unused.yml` | Removes leftovers; dry run by default. |

Retired, do not recreate or reference: `create-addon-scaffold.yml`, `test-crafting-template.yml`, `create-mcpe-world.yml`, `scripts/create_mcpe_world.py`.

Helper scripts in `scripts/` (read the script for exact options):

- `check_readme_status.py` (also `--remake standardize|rebuild`, `--check`), `remake_docs.py`, `sync_readme_links.py` (`--check` previews, `--strict` fails on broken links), `check_manifest_versions.py`, `sync_manifest_versions.py` (`--check` reports without writing, `--verify-only` runs the checker on the selected projects), `sync_project_docs.py` (DESCRIPTION heading and CHANGELOG entry; `--check` reports without writing), `validate_manifest_titles.py`, `auto_bump_and_build.py` (`--no-bump` for documentation-only work), `sync_dispatch_choices.py`, `crafting_template.py`, `build_oneblock_variants_from_template.py` (reads `ONEBLOCK_MAP`), `sync_oneblock_map_readmes.py`, `import_project_payload.py`, `build_payload.py`, `build_test_world.py`, `cleanup_unused.py`, `delete_project.py`, `manage_addon_status.py`, `ensure_recipe_unlocks.py`, `update_min_version.py` (manifests only), the recipe image generators, `selftest_project_types.py`. `tests/test_crafting_template.py` is run by CI.
- `check_generator_sync.py` is retired: nothing is embedded in this file any more (`PACK_GENERATOR_INSTRUCTIONS.md`, Section 8). Do not recreate it.

When a rule in this file changes a workflow's behavior (titles, paths, versions), update the workflow in the same change.

---

### 9. Repository Organization

```
MCPE-Curseforges/
├── INSTRUCTIONS.md
├── README.md
├── scripts/
├── .github/workflows/
├── Mcpeworlds/{Creative,Survival,Hardcore}/
├── MCPEDL/
│   ├── addons/<Addon-Name>/
│   ├── new_addons/
│   ├── incoming/
│   ├── script/<Project-Name>/
│   └── maps/<Map-Name>/
└── builds/<Name>/
    └── versions/V<x.y.z>/   (auto-saved packages + source.zip per release, last 5 kept)
```

---

### 10. Review and Security Policy

AI-generated payloads are untrusted input until a person reviews them. **Human review of the pull request is the real safeguard; the automated checks below reduce risk but cannot prove safety.**

- **Review before merge.** `create-project-from-base64.yml` opens a pull request by default. Review `behavior_pack/scripts/` and every `.mcfunction` in the PR before merging. Choose `direct` only for a payload you generated and checked yourself. The PR option needs "Allow GitHub Actions to create and approve pull requests" enabled in the repository's Actions settings.
- **Script rules enforced by `build_payload.py`:** imports are limited to `@minecraft/server`, `@minecraft/server-ui`, `@minecraft/vanilla-data`, and relative files; `eval` and the `Function` constructor are rejected; every `.js` file must pass `node --check`.
- **Known limits of those checks.** The `eval`/`Function` test is a text pattern. It does not stop indirect forms such as `globalThis["ev"+"al"]`, aliasing, or `import(variable)`. Reviewers must read the scripts.
- **Importer limits:** the base64 payload is capped; duplicate and case-colliding ZIP entries and control characters in paths are rejected; folder names that differ only by case, or that exist under another project type, are refused unless `overwrite` is on; an overwrite warns with the files it deletes. The declared uncompressed size in a ZIP header can be forged, so the importer must count actual bytes while extracting and stop at the limit.
- **Identifiers:** pack UUIDs must be unique across `MCPEDL/` (the project's own folder is excluded so an overwrite can keep its UUIDs), and `min_engine_version` must be a real looked-up version.
- **Workflow hygiene:** never place `${{ inputs.* }}` or step outputs directly inside a `run:` script. Pass them through `env:` and quote the variable.
- **Upgrade ZIPs** (`apply-generator-upgrade.yml`) can overwrite scripts and workflows. Read the dry-run plan first and only upload ZIPs you built yourself.
- **Generated docs** must pass the documentation checks in `build_payload.py` (messages starting with `DOC:`) with no warnings.

---

### 11. Known Untested Assumptions

Treat these as open until confirmed in game, and do not state them as fact in documentation.

1. **Void cleaner chunk loading.** Whether the Y=-64 fill succeeds for a player spawning in a fresh void world, and whether the conditional tag fix in Section 7 retries correctly.
2. **Host permissions.** That the world host is reported as an Operator by `playerPermissionLevel` with cheats off, so the Controller reaches the host on a normal (achievement-eligible) world.
3. **`isOp()` availability.** That `isOp()` is absent in the 2.x `@minecraft/server` module, which is why the Controller uses a helper. Re-check against the current stable module whenever the version changes.
4. **Controller consumption.** That consuming the Controller in Survival and restoring it on game end behaves correctly across rejoin, death, and world reload.
5. **Achievement impact.** That shipped functions and the Controller do not disable achievements unless an admin command is actually run.
6. **Foundation settings.** The experiment and achievement state of each `Mcpeworlds/` foundation.

---

## Part 2: README, DESCRIPTION, and CHANGELOG Guidelines

All documentation rules, player-facing writing, creator links, attribution, and templates. Part 1 still applies in full, wins on any conflict, and its accuracy rules govern everything written here.

### 1. File Roles

> **Uniform structure.** Every add-on `README.md` is a download landing page in the same layout: title with `(vX.Y.Z)`, `## Download` with version, format, and direct link, `## Installation` with three steps, and `## Add-on Information` linking `DESCRIPTION.md`. It never contains features, overviews, recipes, images, badges, or gameplay documentation. `DESCRIPTION.md` holds the full product description.

| File | Purpose |
| :--- | :--- |
| Add-on `README.md` | Download landing page: name, verified version, direct `.mcaddon`/`.mcpack` link (or catalog link), package format, short generic import steps, link to `DESCRIPTION.md`. |
| Add-on `DESCRIPTION.md` | Full product page: overview, features, usage, recipes, compatibility, achievement/experiment status, creator links, attribution, search keywords. |
| `CHANGELOG.md` | Concise, player-visible changes only. |
| Root and category catalogs | Project lists with version, source, and download links. May use compact tables. |

- **Maps and scripts:** the README is the product page, because `check_readme_status.py` audits `README.md` for these types: an Overview or Features section and at least 25 non-empty lines, plus the achievement, experiment, and verification lines. Map READMEs link only `.mcworld` files that exist (Part 1, Section 7).
- A new add-on gets both files. When updating an older add-on, move verified README content into `DESCRIPTION.md` before replacing the README. Never lose verified information or duplicate full descriptions across both.
- Catalogs are the download source of truth:
  - Existing Add-ons: `MCPEDL/addons/README.md#available-add-ons`
  - New Add-ons: `MCPEDL/new_addons/README.md#available-add-ons`
  - Maps: `MCPEDL/maps/README.md#available-maps`
  - Scripts & Challenges: `MCPEDL/script/README.md#available-scripts`
  - Master builds: `builds/README.md#available-pack-and-map-builds`

### 2. Player-Facing Writing

Applies to every public README, DESCRIPTION, CHANGELOG, and catalog entry. Write for players, not developers.

- Lead with the player experience: what players can do, how it behaves in-game, what they need.
- Use in-game display names ("Diamond", "Totem of Undying"), never identifiers such as `minecraft:diamond`.
- Exclude source terminology: file names, function/event/API/module names, JSON components, config keys, tick intervals, code snippets, stack traces, commit hashes, and build details.
- Never mention `Script API` or `@minecraft/server`; use phrasing such as "modern Minecraft Bedrock mechanics".
- No "BP" or "RP". Write "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- No code blocks and no instructions to edit JavaScript or JSON. Present configurable behavior as in-game options, commands, or tags.
- Tone: polished and factual. No hype, clickbait, rhetorical questions, filler, or emojis.
- Include exact values, recipes, and requirements only when verified from source or tests.
- Do not claim "zero lag", universal multiplayer or Realms compatibility, achievement preservation, or "no experimental features" without evidence for that exact claim.
- Where a function or command that needs cheats is mentioned, say it needs cheats and that using cheats disables achievements in that world.

### 3. Layout and Platform Formatting

- Documentation must render cleanly on GitHub, CurseForge, MCPEDL, and Planet Minecraft.
- No Markdown tables in project READMEs or DESCRIPTIONs. Use `### Feature Name` cards with short bullets (`- **What Happens**: ...`). Catalogs may use tables.
- Paragraphs of 3-4 sentences at most. Avoid LaTeX notation; use `->` or a Unicode arrow.
- **No badges and no images in any project README** (add-ons, maps, scripts). DESCRIPTIONs may include only item sprites and crafting recipe diagrams, and only when requested or required (Part 1, Section 5). Version badges, including shields.io badges, are not used in project documentation; the version appears in the title and compatibility line. The one exception is the generated "Collection Size" badge in the root `README.md`, written by `auto_bump_and_build.py` and `delete_project.py`; do not hand-edit it and do not copy it into other files.
- Never allow duplicate suffixes such as `(v1.2.0) (v1.2.1)`.
- Never copy a legacy MCPEDL description to CurseForge unchanged; adjust in CurseForge's `</>` editor.
- Use relative paths for links between repository files. Use full URLs in published pages:
  - `https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>`
  - `https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/<file>`
- If HTML image sizing is needed, use relative widths and omit fixed height.
- Collapsible spoilers (CurseForge `</>` editor): `<h2>Spoiler Title</h2><div class="spoiler">content</div>`. Preview on the target platform first.

### 4. Creator Profile Links and Attribution

Both belong in `DESCRIPTION.md` only, never in a project README, changelog, or manifest description.

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

Put the profile links in the Creator and Permissions section. Put this block immediately before the final Search & Discovery Keywords section:

```markdown
## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for AllensCreations.
```

### 5. Search & Discovery Keywords

Every add-on `DESCRIPTION.md` ends with a keyword section built from its real features, not generic filler: general anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `AllensCreations`), feature anchors from the description, and gameplay anchors (such as `survival QoL`, `achievement friendly MCPE`) only if verified.

```markdown
---

## Search & Discovery Keywords

Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [feature 1], [feature 2], [item or mob name], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
```

### 6. Templates

**Strict template rule.** Follow the matching template below exactly for every `README.md`, `DESCRIPTION.md`, and `CHANGELOG.md` you write or update: same headings, same heading text, same order, same labels, same list and bullet format. Do not add, remove, rename, merge, or reorder sections, and do not add boilerplate, extra notes, or text outside the template. Replace every `[placeholder]` and `verified-...` marker with verified content and leave none behind. The only allowed deviations are the ones the templates and Section 1 already name (map and script READMEs as product pages, and a section's content when a fact cannot be verified, in which case say so inside that section rather than dropping it). Factual accuracy and the user's requested scope still outrank the template.

**Add-on README.md**

```markdown
# [Add-on Name] (vX.Y.Z)

Download the current release of **[Add-on Name]** for Minecraft Bedrock Edition.

## Download

- **Version:** X.Y.Z
- **Package format:** `.mcaddon`
- **Direct download:** [Download [Add-on Name] (.mcaddon)](verified-direct-download-link)

## Installation

1. Download the package using the link above.
2. Open the downloaded file with Minecraft to import it.
3. If the package contains a pack that must be enabled separately, activate it in your world's settings.

## Add-on Information

For gameplay features, usage details, recipes, compatibility notes, and other project information, read the [full description](verified-DESCRIPTION-link).
```

Use a verified direct package URL when one exists; otherwise link the official catalog. Keep an add-on README at 24 non-empty lines or fewer and keep the exact `**Download:**` (or `**Direct download:**`) label, the `## Installation` heading, and the `## Add-on Information` heading with the `DESCRIPTION.md` link, because `check_readme_status.py` and `build_payload.py` check them.

**Add-on DESCRIPTION.md**

```markdown
# [Add-on Name] (vX.Y.Z) — [Clear, factual subtitle]

**By AllensCreations**

[Concise customer-facing summary.]

## Overview

[Verified description of the in-game experience.]

## Key Features

### [Feature Name]
- **What Happens**: [Player-facing behavior, using normal Minecraft names.]

## How to Use

[Verified player actions, requirements, crafting, and in-game behavior.]

## Compatibility

- Minecraft Bedrock Edition: [verified minimum version, only if verified]
- Experimental features: [verified status]
- Achievements: [verified status; do not promise without evidence]
- Verification: [source created / package built / in-game tested; never conflate them]

## Creator and Permissions

[CurseForge and MCPEDL profile links.]

## Guidelines and Attribution

[Attribution block.]

---

## Search & Discovery Keywords

[Keywords.]
```

**CHANGELOG.md**

- Newest release first, with headings `## [X.Y.Z] - YYYY-MM-DD`. Group entries under `### Added`, `### Improved & Balanced`, and `### Fixed` (bugs described by in-game experience).
- No hyperlinks, raw URLs, linked names, or badges.
- No boilerplate: after `# Changelog — [Add-on Name]`, go straight to release entries. No mention of Keep a Changelog or Semantic Versioning.
- Explain player impact. No function names, event names, JSON or type diffs, commit hashes, or CI steps. No unverified benefits.

```markdown
# Changelog — [Add-on Name]

---

## [1.0.0] - YYYY-MM-DD

### Added
- **[Feature Title]**: [Clear summary of the new gameplay feature and how players use it].

### Improved & Balanced
- **[Enhancement Title]**: [Player-friendly description of tuning, balance, or visual changes].

### Fixed
- **[Fix Title]**: [What in-game bug or glitch was resolved].
```

---

## Part 3: checkrm, Documentation Audit, Bedrock Samples and Minecraft Wiki Reference

### 1. Authority

- Parts 1 and 2 are authoritative. This Part defines only the audit workflow and the Samples and Wiki references. If Part 1 or Part 2 cannot be read, stop and report it instead of working from memory.
- The user's explicit scope and source accuracy outrank any template.

### 2. Scope and Modes

Handles documentation and catalog maintenance only. Do not change gameplay code, manifests, UUIDs, versions, dependencies, pack settings, assets, workflows, or release configuration unless the user explicitly asks.

- **Repository-wide audit:** the user says `/checkrm`, asks to check all projects, or names no single project.
- **Individual project:** the user names a project, slug, or folder, or asks to create, repair, or update one project's documentation.
- **Documentation-only:** if the user says so, touch no gameplay files, manifests, assets, scripts, or workflows.

Discover the actual folder structure first. Do not assume a folder or file exists, and do not silently substitute a similarly named project; report ambiguity or a missing target.

### 3. Procedure

1. **Discover.** Identify the target project, its README and DESCRIPTION, manifests, scripts, configuration, entities, items, blocks, recipes, functions, loot tables, language files, and assets, plus the parent category catalog, root README, and builds README.
2. **Audit status.** For repository-wide checks run `python3 scripts/check_readme_status.py`. It reports missing or incomplete documentation, add-on READMEs that contain product information instead of a download link, map and script READMEs that are too short, broken relative links, and orphaned build directories. `--fix` generates standard documentation for detected stubs; review its output before keeping it. If the script is absent or fails, inspect manually and report the limitation.
3. **Verify project facts.** Read the relevant files before writing any claim. Establish, when evidence permits: what the project does, which features exist, how they are activated or configured, whether settings persist, required packs and dependencies, supported versions, known limitations, and achievement and experiment status (Part 1, Section 2). Never infer a feature from a name alone, and distinguish implemented behavior from planned behavior. When a document names a vanilla item or block, verify its name and sprite against Sections 4 and 5 below.
4. **Check references before writing.** Before creating or substantially rewriting a README or DESCRIPTION, read the root README, the category catalog, the builds README, and two or three well-documented projects of the same category. Reuse conventions, not project-specific claims. Verify a reference's links, image paths, and claims before adopting anything from it.
5. **Write or update.** Follow Part 2. Do not add a feature merely because it was requested if it is not implemented. Omit installation steps entirely if the user asks.
6. **Images, badges, links.** README.md files contain no images and no badges. DESCRIPTION.md images are limited to requested item sprites and crafting diagrams, with absolute raw GitHub URLs that you have confirmed exist. Remove any existing badge. Leave no placeholders. Verify that every link destination exists.
7. **Synchronize catalogs and builds.** Check whether the project appears in its category catalog, the root README, and the builds README. Update only relevant entries, search first to avoid duplicates, and keep established ordering. Inspect any build script before running it. A known command is `python3 scripts/auto_bump_and_build.py --project "<Project-Name>" --no-bump`. Use `--no-bump` unless the user explicitly requests a version bump. Never claim a build or sync completed if it failed or was not run.
8. **Verify.**
   1. Re-read the whole edited file, and check headings, lists, and links.
   2. Confirm each documented feature has source evidence and that no verified content was lost.
   3. Run `python3 scripts/validate_manifest_titles.py --project <project-path>` when applicable.
   4. Run `python3 scripts/check_readme_status.py` again. Expect `0` needing update and `[LINK INTEGRITY] All relative links valid`.
   5. Check the add-on LOCK marker (Part 1, Section 3) for projects under `MCPEDL/addons/` and `MCPEDL/new_addons/`.
   6. Review the final diff for scope. If a check was not run, say so.
9. **Report.** State briefly: projects audited or updated; files changed; commands run and results; missing assets, unresolved links, or unverifiable information; remaining projects needing attention. Never report success for a check that was not run or did not pass.

**Remaking documentation in bulk.** `python3 scripts/check_readme_status.py --remake standardize --all --check` previews, and the same command without `--check` writes. `standardize` keeps existing text: it rebuilds each add-on README as the download page, fixes DESCRIPTION structure (title version, By line, Compatibility lines, Creator links, the exact attribution block, the keyword section), and adds a missing CHANGELOG entry. `--remake rebuild --project <Name>` replaces an add-on's DESCRIPTION and README with generic text built from source files (maps and scripts are never rebuilt), and `--all` needs `--confirm-rebuild`. Added defaults (Verification, Achievements, Experimental features) are conservative placeholders and generated changelog entries are generic, so replace them with verified facts. The workflow `remake-docs.yml` runs the same thing with a dry run and a pull request.

### 4. Minecraft Wiki Item Reference

The [Minecraft Wiki item list](https://minecraft.wiki/w/Item) is the reference for official item names, grouping, and inventory sprite appearance. Use it together with Bedrock Samples, never instead of it.

- **Division of authority:** identifiers, textures, recipes, and components come from Bedrock Samples. Player-facing display names follow the Wiki's Bedrock name, confirmed against `resource_pack/texts/en_US.lang` in Samples (keys such as `item.<id>.name` and `tile.<id>.name`). The lang file is the in-game truth when the Wiki is unreachable or disagrees; report any disagreement.
- Never derive a display name by title-casing an identifier. Vanilla names often differ from IDs (`experience_bottle` is Bottle o' Enchanting, `hay_block` is Hay Bale, `ender_eye` is Eye of Ender, `wooden_door` is Oak Door, `golden_rail` is Powered Rail, `magma` is Magma Block).
- **Edition tags:** the item list marks entries `[BE only]` or `[JE only]`. Do not document an item as available if it is Java-only (Spectral Arrow is not a Bedrock item).
- **Sprite naming on the Wiki:** `Invicon_<Title_Case_Name>.png` and `ItemSprite_<lowercase-hyphenated-name>.png`. Look sprites up by the Wiki name, not the identifier.
- **Fetching:** read the page with whatever web fetch or search tool your environment provides. If shell access to `minecraft.wiki` is blocked, report it, do not route around it, and fall back to Bedrock Samples.
- **Licensing and images:** the image rules in Part 1, Section 5 apply.
- **Mismatches:** the Wiki, `en_US.lang`, and Samples can lag each other across releases. Check the Samples version in `version.json` and state the version a claim was verified against.

### 5. Mojang Bedrock Samples Reference

Mojang's [bedrock-samples](https://github.com/mojang/bedrock-samples) repository is the source of truth for vanilla Bedrock identifiers, textures, recipes, components, entity definitions, and data formats. Its checkout root is `BEDROCK_SAMPLES_ROOT`; the recipe-image workflow clones it to `/tmp/bedrock-samples`.

- Layout: `resource_pack/` (textures in `textures/items/`, `textures/blocks/`, `textures/models/armor/`, `textures/ui/`; `attachables/`; `texts/`) and `behavior_pack/` (`items/`, `entities/`, `recipes/`, `loot_tables/`).
- Content changes between releases. Verify the checked-out version and confirm each path exists before relying on a file, value, or schema. Do not hardcode values such as armor defense or durability from memory.
- Item identifiers do not always match texture filenames. Inventory all recipes first, build an explicit ingredient-to-texture mapping, and report all unresolved items together rather than substituting a placeholder.
- The texture indexes (`textures/item_texture.json`, `textures/terrain_texture.json`) begin with a `//` comment line, so strip comment lines before parsing. Many vanilla items have no entry keyed by identifier, and many block textures are `.tga` rather than `.png`, so check both extensions before calling a texture missing.
- Block inventory icons are rendered in game from top and side textures. Render an isometric view from the real face textures when a cube-style sprite is needed.
- An identifier valid elsewhere may not exist in Bedrock (`oak_door` is `wooden_door`). Confirm an identifier appears in Samples recipes, loot tables, or trades before documenting it.
- Custom items use the add-on's own resource-pack textures. Vanilla recipes in `behavior_pack/recipes/` are the reference for recipe format, group tags, and ingredient identifiers.
- If the checkout is missing or lacks the asset, report the limitation. When only GitHub is reachable, a sparse `git clone --filter=blob:none --sparse` followed by `git sparse-checkout set --no-cone <paths>` works even when raw downloads are blocked.
- Scale 16x16 textures with nearest-neighbor interpolation to keep pixel art crisp (`Image.Resampling.NEAREST` in Pillow).

---
