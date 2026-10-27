# Instructions: Combined Repository Policy

Single instruction file for AllensCreations/MCPE-Curseforges. It merges four sources so an AI agent only needs to read one file:

| Part | Covers | Replaces |
| :--- | :--- | :--- |
| Part 1 | Core policy: accuracy, versions, manifests, recipes, images, functions, OneBlock, workflows, repository layout | `INSTRUCTIONS.md` |
| Part 2 | README, DESCRIPTION, and CHANGELOG rules, attribution, keywords, templates | `README_GUIDELINES.md` |
| Part 3 | `checkrm` documentation audit workflow, Minecraft Wiki and Bedrock Samples references | `.agents/skills/checkrm/SKILL.md` |
| Part 4 | AI-agent project generator: asks addon / map / script, returns a base64 ZIP, with the full `build_payload.py` | `GAME_GENERATOR.md` |

**Precedence.** Part 1 wins on any conflict. Parts 2 and 3 follow Part 1 and never override it. Part 4 follows Parts 1 to 3 and never overrides them. Factual accuracy and the user's requested scope outrank any template. **Section numbers refer to the Part they appear in**; a reference to another Part names it.

**Which Part to read.** Documentation work: Parts 1 (Sections 1 to 2), 2, 3. Generating a new add-on, map, or script: Parts 1 and 4 (plus 2 for docs). Build, workflow, or OneBlock changes: Part 1 (Sections 6 to 9).

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

---

### 2. Versions and Compatibility

#### Always use the latest stable

- Do not rely on version numbers written in this file or remembered from training. When creating or updating a pack, look up the **latest stable** Minecraft Bedrock release and the **latest stable** Script API module versions from the official Minecraft Creator documentation at the time of the work.
- Official references:
  - [Minecraft Creator Documentation](https://learn.microsoft.com/en-us/minecraft/creator/?view=minecraft-bedrock-stable)
  - [Script API versioning](https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning?view=minecraft-bedrock-stable)
  - [`@minecraft/server` stable reference](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable)
  - [`@minecraft/server-ui` stable reference](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server-ui/minecraft-server-ui?view=minecraft-bedrock-stable)
  - [Latest platform version guidance](https://learn.microsoft.com/en-us/minecraft/creator/documents/practices/latestplatformversion?view=minecraft-bedrock-stable)
- Supplementary community references (never used to pick versions or confirm API availability):
  - [Bedrock Wiki](https://wiki.bedrock.dev/) for add-on file formats, components, Molang, animation controllers, entity, block, and item techniques, and troubleshooting guides.
  - [Minecraft Wiki](https://minecraft.wiki/) for vanilla names, edition availability, and icon appearance.
- Select the highest stable module version supported by the target game and every other dependency in the pack, checking peer-dependency requirements. Never use preview, beta, or RC versions unless a requested feature requires them, and then say so clearly.
- Game versions and Script API module versions are separate systems; do not infer one from the other.
- Set `min_engine_version` to the lowest game version the implementation actually needs, not automatically the newest release.
- When updating an older pack, preserve UUIDs, persistent identifiers, and working behavior. Upgrade dependencies deliberately, not wholesale.

#### Achievement and experiment assessment

Do this for every new pack and meaningful update. A compatible API version does not by itself establish achievement compatibility or experiment status.

- Inspect manifests, dependencies, stable-versus-preview imports, content JSON, components, scripts, functions, and any included world settings. Confirm suspected experiment requirements against current official documentation, not just a keyword match. Stable Script API or JavaScript use alone does not mean experiments are required or achievements are disabled.
- Inspect world experiment toggles and cheats/achievement settings separately when world settings are available. Pack files cannot establish the settings of an existing player world.
- If nothing is found, write "No experiment requirement detected in the inspected files." This does not prove every world setting or future version is safe.
- Prefer a stable, non-experimental implementation that preserves the requested behavior. Do not silently weaken a feature to avoid an experiment.
- Achievement status is one of: **Likely achievement-friendly** (no disabling condition found), **Not achievement-friendly / may disable achievements** (requires cheats, experiments, preview-only features, or another documented condition), or **Unknown / needs confirmation**. Never promise achievements stay enabled without verifying the exact game version, pack, and world setup.
- Handoff summary: achievement status, experiments (none detected / required with name / unknown), evidence, and scope (what was inspected, and whether actual world settings were available).

#### Implementation rules

1. Inspect the existing manifest, entry points, imports, and structure before editing.
2. Confirm each API member's availability against the chosen stable module version.
3. Prefer event-driven logic over per-tick polling, repeated broad entity searches, or expensive block scans.
4. Use vanilla JSON components and `.mcfunction` files when simpler; use Script API where the feature needs it.
5. Avoid knowingly malformed files and fix obvious issues as you go. Use existing build/check workflows only as needed.
6. Record in notes or handoffs: target game version, `min_engine_version`, module versions used, any preview/experimental requirement, references checked with the date, and verification status (source created, package built, or in-game tested; never conflate these).

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

#### Add-on LOCK marker

- Every project under `MCPEDL/addons/` and `MCPEDL/new_addons/` has a `LOCK` file at its root beginning with `AllensCreations Add-on Lock v1`.
- The scaffold workflow creates it and the build script enforces it. A missing or invalid marker is release-blocking: report the exact project path and do not call the project build-ready.
- It is a repository and build safeguard only. It does not encrypt source, stop edits, or prevent extraction of a distributable package.

---

### 4. Recipe Unlock Rule

Every custom crafting recipe must be unlocked by default using the schema its recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

- Formats that use an array take the equivalent form, `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas.
- Compare an existing recipe's type against the Bedrock Samples reference before choosing syntax.
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

- Build diagrams programmatically from the actual recipe JSON, the add-on's real result texture, and vanilla textures from Mojang's [Bedrock Samples](https://github.com/Mojang/bedrock-samples) (root taken from the `BEDROCK_SAMPLES_ROOT` environment variable; the recipe-image workflow clones it to `/tmp/bedrock-samples`). The recipe JSON is authoritative for ingredients, quantities, result, count, and shaped/shapeless behavior. Never change a recipe to fit an image.
- **Board reference:** `scripts/CRAFTING_TABLE.svg` is the only authorized reference, rendered through the shared `scripts/crafting_template.py`, which reads slot positions from the SVG's ids (`slot-0` to `slot-8` in row-major order, `slot-N-fill`, `output`, `output-fill`, `arrow`). Any PNG export is derived from it and never a separate reference. Never use `CRAFTINGBOARD.PNG`, screenshots, hand-drawn boards, or remembered interfaces. If the SVG is missing or unreadable, stop and report it.
- Always show the full 3x3 grid. Shaped recipes keep exact row/column placement and empty cells; shapeless ingredients fill cells in row-major order. Never flatten to a list. Show quantities and the output count in the SVG's output slot.
- Colors: take every color (background, slot fill, edges, arrow) from `scripts/CRAFTING_TABLE.svg`. Do not hardcode board colors in a generator, and do not leave the background transparent.
- Style: plain vanilla-style gray UI, crisp nearest-neighbor pixel art, consistent icon size, precise alignment. No ornate frames, gradients, glow, labels, or emojis.
- Present one diagram per row at the SVG's native 400x222 size.

#### Textures

- Use inventory-style item sprites, never cropped world textures. If only block-face textures exist, build a small isometric cube from verified matching faces (top and side); never stretch one face.
- **Source order for vanilla textures and icons:**
  1. Bedrock Samples (see Part 3) is the primary source for vanilla names, identifiers, and textures.
  2. The [Minecraft Wiki](https://minecraft.wiki/) is the approved reference for icons and assets. Use it to confirm what an item or block icon should look like, to confirm the official display name and edition availability, and as a **fallback image source only when Samples has no usable inventory-style sprite** (for example, cube-style block icons or items whose texture cannot be mapped).
  3. No third-party packs, guessed filenames, or approximate icons.
- **Using the Minecraft Wiki as an image source:**
  - Wiki images are CC BY-NC-SA (NonCommercial, ShareAlike) unless the file page says otherwise. That conflicts with monetized platform pages and with the all-rights-reserved block in Part 2. Use a Wiki image only when the user explicitly approves that specific image after hearing this; otherwise use Samples or report the gap.
  - Look sprites up by the Wiki name, not the identifier: `Invicon_<Title_Case_Name>.png` for inventory renders and `ItemSprite_<lowercase-hyphenated-name>.png` for flat sprites.
  - Open the image's file page first and confirm its license and attribution. Wiki text and most images are community content under their own license (CC BY-NC-SA 3.0 unless the file page says otherwise), plus Mojang's asset terms.
  - Record every Wiki-sourced image (file page URL, license, date retrieved) in the generator's header comment or in `scripts/ASSET_SOURCES.md`, and add attribution to the project's `DESCRIPTION.md` when the image is published.
  - Prefer Samples-derived sprites whenever both are available. Do not bulk-copy Wiki images or large blocks of Wiki text into the repository.
  - If network policy blocks `minecraft.wiki`, report it and fall back to Samples. Do not route around the block.
- Inspect the add-on's whole recipe directory first and build an explicit ingredient-to-texture mapping for every ingredient. Filenames often differ from item IDs (for example, Enchanted Golden Apple uses the golden apple texture), and files may be under `textures/items/` or `textures/blocks/`. Verify each path exists and depicts the correct item.
- Never substitute another icon or skip an ingredient. Report all unresolved ingredients together and stop.

#### Generators and workflow

- Keep generators in `scripts/`. They must fail clearly if the Samples pack, a texture, or a recipe file is missing.
- Register every generator in `.github/workflows/generate-recipe-images.yml`: add its path to `push.paths`, add an explicit run step, and stage its output in the commit step. Keep `workflow_dispatch` enabled.
- The workflow checks out Bedrock Samples, installs Pillow, runs generators, and commits PNGs with `[skip ci]`. It reruns when recipe JSON, source textures, generators, or the workflow change.
- Keep generated PNGs in the repository; a correct URL does not prove the file exists.
- Do not call images generated or published until the workflow succeeds and the PNGs exist. If a generator fails, fix the first unmapped ingredient at its source and rerun.
- Confirm output item IDs map to the correct custom texture and that referenced filenames match what the generator produces.

#### Technical reference

- Use the [Bedrock Wiki](https://wiki.bedrock.dev/) to understand a file format, component, or technique, then verify the exact schema, identifiers, and format version against Bedrock Samples and the current official documentation before writing it into a pack.
- Cite the Bedrock Wiki page in handoff notes when it informed a decision, and note that it is community documentation. Link to it instead of copying its text.

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
- Anything specific to one project (coordinates, spawn, cleanup, shop access) belongs to that project's own spec, not to these general rules. Dirtbound's spec is at the end of this section as a worked example.
- The three folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/` are convenience delivery targets, not a limit on where a script can be used.

#### Workflow

The authoritative world foundations are the direct folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/`. The OneBlock build workflow copies each matching foundation into a temporary staging directory, preserves its valid `level.dat`, integrates the map's current Behavior Pack and Resource Pack, then packages the completed world as a `.mcworld` inside `MCPEDL/maps/<Map-Name>/`.

1. Keep map source packs in `MCPEDL/maps/<Map-Name>/behavior_pack/` and `resource_pack/` (when required), with the project's docs and configuration.
2. Use `Mcpeworlds/` as the only source of world foundations. Do not use old world ZIPs, `Oneblock-assets.mcworld`, `assets/Void_For_Workv2.mcworld`, or a persisted `assets/oneblock-template/` as a substitute. Do not recreate the retired `create-mcpe-world.yml` workflow or `scripts/create_mcpe_world.py`, which depended on a template containing a world database.
3. Preserve the intentional database-free void design: never create, fabricate, borrow, or require `db/CURRENT` or LevelDB data.
4. On relevant source, foundation, builder, or instruction changes, `build-oneblock-variants.yml` automatically builds Creative, Survival, and Hardcore worlds and synchronizes the map README. Manual dispatch remains available.
5. Validate the generated archive structure and pack references. Report structural checks separately from Minecraft gameplay testing.

For maps, Creative is the primary and only designated in-game test world (a script's `test_world.json` chooses its own mode). Do not create a separate `.mcaddon` tester package or a `Tester Build/` folder. The map project keeps the source add-ons and its generated `.mcworld` deliveries together; unrelated add-on build workflows must not misclassify this map as a standalone add-on.

#### Creating a project from an AI-generated payload

- Part 4 is the instruction file given to an AI agent. The agent first asks which type the user wants (**addon**, **map**, or **script**), then returns a single-line base64 ZIP produced by running code, never written by hand. The ZIP's `project.json` (`{"type": "addon|map|script", "name": "..."}`) carries the type.
- `create-project-from-base64.yml` takes the folder name plus the base64 (or a `.b64` path under `MCPEDL/incoming/`) and runs `scripts/import_project_payload.py`. The importer imports `scripts/build_payload.py`, so the agent-side and repo-side checks are the same code.
- Destinations: addon -> `MCPEDL/new_addons/<Name>/` (the importer writes the `LOCK` markers); map -> `MCPEDL/maps/<Name>/` (the importer writes `oneblock.json`; Creative, Survival, and Hardcore worlds are built in the same run); script -> `MCPEDL/script/<Name>/` (a test world is built, see below).
- The importer validates before writing anything. It rejects unsafe paths, symlinks, world data (`db/`, `level.dat`), nested archives, shipped pack link files, disallowed file types, bad manifests (title `Name (vX.Y.Z)` matching `header.version`, `by AllensCreations` exactly once, matching BP/RP versions, RP dependency), recipes without `AlwaysUnlocked`, and the per-type requirements below. Icons must match the repo copies under `Mcpeworlds/assets/resources_pack/textures/items/` byte for byte.
- Map requirements: `tick.json` lists `void_cleaner` first, `void_cleaner.mcfunction` starts with the required Y=-64 fill line, `oneblock_setup.mcfunction` exists, and the Trader Ledger item, texture entry, and `trader_ledger.png` are present. Add-ons and scripts do not need the void cleaner or the ledger.
- The folder name is typed per run; never hardcode one in a workflow or script. A payload with only `oneblock.json` (no `project.json`) is still accepted as a map.
- When Sections 3, 4, 6, or 7 change, update Part 4, `scripts/build_payload.py`, and the importer in the same change, then run `scripts/selftest_project_types.py` and `scripts/check_generator_sync.py`. This file wins on any conflict.
- These checks prove structure only. Never claim the add-on, map, script, or world works in Minecraft until tested in game.

#### Scripts and test worlds

- A script project is `MCPEDL/script/<Name>/` with `behavior_pack/` (script module, `scripts/main.js`), `resource_pack/`, `project.json`, `test_world.json`, and the documentation files.
- Every script ships the Controller item (`allenscreations:controller`, texture `controller.png`, a 16 x 16 icon kept at `Mcpeworlds/assets/resources_pack/textures/items/controller.png`). Using it opens a form with **Start** and **How to play**; the script keeps the state (idle, running, ended) in a world dynamic property. A project may opt out with `"controller": false` in `project.json`.
- Only the host or an operator receives and can use the Controller. **Start** works while no game is running. **How to play** opens a page with the game's rules and a Back button. The game ends through its own win or lose logic, which calls `endGame()`.
- **Survival breaks the Controller, Creative keeps it.** Start consumes the first Controller found in the player's inventory (switching slots does not avoid it) unless the player is in Creative. When the game ends, the script gives the host or operator a fresh Controller if they have none. `give_controller.mcfunction` (`give @s allenscreations:controller`) and `end_game.mcfunction` (`scriptevent allenscreations:end`) ship with every Controller script, need cheats, and are not form buttons.
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
- Only one OneBlock gameplay pack may own the platform and core. Before installing a different OneBlock script, remove the previously installed OneBlock pack folders and link entries from all three modes (its source stays in its own `MCPEDL/maps/` folder). Leave unrelated packs alone.
- Do not modify the source foundations under `Mcpeworlds/`. The build copies the selected foundation and may rename only the staged copy's world name metadata; it must preserve the selected valid `level.dat` content otherwise. Never create, fabricate, borrow, or require a world database. `db/CURRENT` and actual LevelDB data must remain absent in the source and output. If the Behavior Pack's dependencies are unresolved, stop and report the exact path.

#### Verification

- Manifest, `tick.json`, and function files are valid and wired correctly (Section 6).
- Each mode folder's installed pack matches the source, and each link entry matches the manifest's UUID and version.
- The Resource Pack dependency UUID resolves, when one exists.
- Script files pass available syntax checks.
- The importer, `build_oneblock_variants_from_template.py` (`verify_archive`), and `build_test_world.py` run these checks when a project is created or rebuilt; `scripts/selftest_project_types.py` exercises all three project types end to end. There is no separate source-validation workflow.
- State precisely what passed. Structural checks never prove Minecraft loaded the world or that progression works.

#### Map README

- Download-focused. Link Creative, Survival, and Hardcore only to compiled `.mcworld` files that actually exist in `MCPEDL/maps/<Map-Name>/`, and keep the source version aligned with the current Behavior Pack. The OneBlock build workflow publishes all three archives there after successful structural validation. Do not claim an archive matches the current source unless it was checked. Catalog entries in `MCPEDL/maps/README.md` follow the same rule.

#### Example project spec: Dirtbound

- Core `(0,0,0)`, Bedrock `(0,-1,0)`, world spawn `(0,1,0)`. The custom Trader Ledger item is the only shop access; there is no physical Trader Post.
- `void_cleaner.mcfunction` runs once per player, guarded by `tag=!void_cleaned`, in this order:
  1. `execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air` (33x33 = 1,089 blocks on Y=-64; `fill 0 -64 0 15 -64 15 air` clears only 256 and is wrong)
  2. teleport the untagged player to `(0,1,0)` (the only player teleport anywhere)
  3. Bedrock at `(0,-1,0)`
  4. grass placeholder at `(0,0,0)`
  5. set world spawn to `(0,1,0)`
  6. send the cleaning notice
  7. add the `void_cleaned` tag
- Do not expand cleanup beyond this layer without approval.
- `tick.json` lists `void_cleaner` before `oneblock_tick`. `oneblock_tick` may restore only missing Bedrock; it must not reset spawn, teleport players, or place/replace the core.
- The Script API owns the core at `(0,0,0)`, break rewards, and stage progression, and waits until a player has `void_cleaned` before replacing the grass placeholder.
- Player tags persist in saved worlds, so a source fix does not patch an already-imported world. To test a fix, import a fresh copy of the updated world as a new world.
- When mechanics change, update source, player-facing docs, and test checklists together, and reinstall into all three world folders.

---

### 8. Workflows

Workflows in `.github/workflows/`. Roles below come from file names and recent commit messages; read the actual workflow file before editing it or describing what it does.

| Workflow | Role |
| :--- | :--- |
| `auto-version-bump.yml` | Bumps release versions. Must keep manifest titles in the `Name (vX.Y.Z)` format (Section 3). |
| `create-addon-scaffold.yml` | Scaffolds a new add-on with a download-only README and a DESCRIPTION starter. |
| `build-oneblock-variants.yml` | Automatically builds the Creative, Survival, and Hardcore database-free `.mcworld` archives into `MCPEDL/maps/<Map-Name>/` when relevant sources or foundations change; manual dispatch is also available. |
| `create-project-from-base64.yml` | Manual run: decodes a base64 ZIP (type addon, map, or script from `project.json`) into the matching `MCPEDL/` folder and builds the worlds that type needs (Section 7). `commit_mode` defaults to `pull_request` so the import is reviewed before it reaches the branch; `direct` pushes straight to it. |
| `build-test-world.yml` | Manual run: rebuilds `<Name> - Test.mcworld` for scripts and add-ons that have `test_world.json`. |
| `apply-generator-upgrade.yml` | Manual run: applies a reviewed upgrade ZIP (new files, deletions listed in `upgrade_manifest.json`); dry run by default. |
| `refresh-build-packs.yml` | Scheduled refresh of projects and rebuild of packs in `builds/`. |
| `generate-recipe-images.yml` | Regenerates recipe diagrams (Section 5). |
| `manage-addon-status.yml` | Manages add-on status. |
| `delete-project.yml` | Deletes a project. |
| `collect-ai-review-files.yml` | Bundles the instruction file, scripts, workflows, and icon hashes into one downloadable archive for AI review. |
| `export-repo-to-txt.yml` | Exports chosen repository paths to readable TXT (plus Part 1) for AI use. |
| `extract-zip-to-folder.yml` | Extracts a ZIP that is already in the repository into a chosen folder. |
| `cleanup_unused.yml` | Removes leftovers (old payloads, `*.importing` folders, obsolete workflow files); dry run by default. |
| `test-crafting-template.yml` | Manual run of the crafting template test; commits nothing. |

Retired: `create-mcpe-world.yml` and `scripts/create_mcpe_world.py` (they required a template containing a world database, which conflicts with the database-free design in Section 7). Do not recreate them or reference them from other workflows or docs.

Helper scripts in `scripts/`:

- `check_readme_status.py`: audits README and DESCRIPTION status and relative links (`--fix` generates stub documentation).
- `validate_manifest_titles.py`: the title validator from Section 3.
- `auto_bump_and_build.py`: bumps versions and builds packs. Use `--no-bump` for documentation-only work.
- `crafting_template.py`: shared recipe board renderer.
- `build_oneblock_variants_from_template.py`: builds the three OneBlock world modes from `Mcpeworlds/` and a map's packs (Section 7). Reads `ONEBLOCK_MAP` to build one map.
- `sync_oneblock_map_readmes.py`: synchronizes a map README with the generated `.mcworld` archives.
- `import_project_payload.py`: validates and imports a base64 ZIP into `MCPEDL/new_addons/`, `maps/`, or `script/` (Section 7).
- `build_payload.py`: the agent-side packager and the shared check code the importer uses. Its text is also embedded in Part 4.
- `build_test_world.py`: builds a script or add-on test world with chosen add-ons (Section 7).
- `cleanup_unused.py`, `delete_project.py`, `manage_addon_status.py`: leftover cleanup, project deletion with catalog cleanup, and add-on promotion from `new_addons/` to `addons/`.
- `ensure_recipe_unlocks.py`: adds the `AlwaysUnlocked` context to custom shaped and shapeless recipes (Section 4).
- `generate_recipe_images.py`, `generate_grand_banquets_recipe_images.py`, `generate_monster_companions_recipe_image.py`, `convert_crafting_recipe_svgs_to_png.py`, `test_crafting_template.py`: recipe diagram generators and their test (Section 5).
- `selftest_project_types.py`: end-to-end test of all three project types in a throwaway copy of the repo.
- `check_generator_sync.py`: fails when the script embedded in Part 4 differs from `scripts/build_payload.py`.

- Never claim a workflow ran or succeeded unless its run was checked.
- When a rule in this file changes a workflow's behavior (titles, paths, versions), update the workflow in the same change.

---

### 9. Repository Organization

```
MCPE-Curseforges/
├── INSTRUCTIONS.md                # This combined file: core policy, documentation guidelines, checkrm audit, game generator
├── README.md                      # Catalog of active add-ons, maps, scripts
├── scripts/                       # Generators, validators, crafting_template.py, CRAFTING_TABLE.svg
├── .github/workflows/
├── Mcpeworlds/{Creative,Survival,Hardcore}/   # Database-free world foundations; source of all OneBlock worlds
├── MCPEDL/
│   ├── addons/<Addon-Name>/       # behavior_pack/, resource_pack/, README.md, DESCRIPTION.md
│   ├── new_addons/
│   ├── incoming/                  # Temporary .b64 payloads for create-project-from-base64.yml
│   ├── script/<Project-Name>/     # behavior_pack/, resource_pack/, project.json, test_world.json, README.md, <Name> - Test.mcworld
│   └── maps/<Map-Name>/           # project.json, oneblock.json, OneBlock source packs + generated Creative/Survival/Hardcore .mcworld files, README.md
└── builds/<Name>/                 # Compiled .mcaddon / .mcpack / .mcworld
```

---

### 10. Review and Security Policy

AI-generated payloads are untrusted input until a person reviews them. Structural checks never prove safety or correctness.

- **Review before merge.** `create-project-from-base64.yml` opens a pull request by default (`commit_mode: pull_request`). Review `behavior_pack/scripts/` and every `.mcfunction` in the PR before merging. Choose `direct` only for a payload you generated and checked yourself. The PR option needs "Allow GitHub Actions to create and approve pull requests" enabled in the repository's Actions settings.
- **Script rules enforced by `build_payload.py`:** dependencies and imports are limited to `@minecraft/server`, `@minecraft/server-ui`, and `@minecraft/vanilla-data` (plus relative files); `eval` and the `Function` constructor are rejected; every `.js` file must pass `node --check`. The workflow installs Node for that check; without Node the checker warns instead.
- **Importer limits:** declared uncompressed size is checked before any file is read; the base64 payload is capped; duplicate and case-colliding ZIP entries and control characters in paths are rejected; folder names that differ only by case, or that exist under another project type, are refused unless `overwrite` is on; an overwrite warns with the files it deletes.
- **Identifiers:** pack UUIDs must be unique across `MCPEDL/` (the project's own folder is excluded so an overwrite can keep its UUIDs), and `min_engine_version` must be a real looked-up version, never a placeholder.
- **Workflow hygiene:** never place `${{ inputs.* }}` or step outputs directly inside a `run:` script. Pass them through `env:` and quote the variable.
- **Upgrade ZIPs** (`apply-generator-upgrade.yml`) can overwrite scripts and workflows. Read the dry-run plan first and only upload ZIPs you built yourself.
- **Generated docs** must pass the documentation checks in `build_payload.py` (messages starting with `DOC:`) with no warnings, because `check_readme_status.py` audits the same files.

---

## Part 2: README, DESCRIPTION, and CHANGELOG Guidelines

All documentation rules, player-facing writing, creator links, attribution, and templates. Part 1 still applies in full, wins on any conflict, and its accuracy rules (never invent facts, never claim untested results) govern everything written here.

---

### 1. File Roles

| File | Purpose |
| :--- | :--- |
| Add-on `README.md` | Download landing page: name, verified version, direct `.mcaddon`/`.mcpack` link (or catalog link), package format, short generic import steps, link to `DESCRIPTION.md`. |
| Add-on `DESCRIPTION.md` | Full customer-facing product page: overview, features, usage, recipes, compatibility, achievement/experiment status, creator links, attribution, search keywords. |
| `CHANGELOG.md` | Concise, player-visible changes only. |
| Root and category catalogs | Project lists with version, source, and download links. May use compact tables. |

- **Add-ons:** the README is download-only: no features, recipes, compatibility claims, images, creator bios, keywords, or changelog text. All of that lives in `DESCRIPTION.md`.
- **Maps and scripts:** the README is the product page, because `check_readme_status.py` audits `README.md` (not `DESCRIPTION.md`) for these types: an Overview or Features section and at least 25 non-empty lines, plus the achievement, experiment, and verification lines. Map READMEs link only `.mcworld` files that exist (Part 1, Section 7).
- Generated payloads (Part 4) follow the same rules.
- A new add-on gets both files: a download-only README and a DESCRIPTION starter.
- When updating an older add-on, move verified README content into `DESCRIPTION.md` before replacing the README. Never lose verified information or duplicate full descriptions across both.
- Catalogs are the download source of truth:
  - Existing Add-ons: `MCPEDL/addons/README.md#available-add-ons`
  - New Add-ons: `MCPEDL/new_addons/README.md#available-add-ons`
  - Maps: `MCPEDL/maps/README.md#available-maps`
  - Scripts & Challenges: `MCPEDL/script/README.md#available-scripts`
  - Master builds: `builds/README.md#available-pack-and-map-builds`

### 2. Player-Facing Writing

Applies to every public README, DESCRIPTION, CHANGELOG, and catalog entry. Write for players, not developers.

- Lead with the player experience: what players can do, how it behaves in-game, what they need.
- Use in-game display names ("Diamond", "Totem of Undying"), never identifiers such as `minecraft:diamond`. Same for blocks, mobs, enchantments, and effects. Identifiers stay in implementation files and are not changed for appearance.
- Exclude source terminology: file names, function/event/API/module names, JSON components, config keys, tick intervals, code snippets, stack traces, commit hashes, and build details.
- Never mention `Script API` or `@minecraft/server`; use phrasing such as "modern Minecraft Bedrock mechanics".
- Describe mechanics, not code ("The ability activates when you use the relic").
- No "BP" or "RP". Write "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- No code blocks and no instructions to edit JavaScript or JSON. Present configurable behavior as in-game options, commands, or tags.
- Tone: polished and factual. No hype, clickbait, rhetorical questions, filler, or emojis.
- Include exact values, recipes, and requirements only when verified from source or tests.
- Do not claim "zero lag", universal multiplayer or Realms compatibility, achievement preservation, or "no experimental features" without evidence for that exact claim.
- Technical detail is allowed only when the user asks for technical documentation; otherwise translate requirements into plain player language.

### 3. Layout and Platform Formatting

- Documentation must render cleanly on GitHub, CurseForge, MCPEDL, and Planet Minecraft.
- No Markdown tables in project READMEs or DESCRIPTIONs; they overflow on mobile. Use `### Feature Name` cards with short bullets (`- **What Happens**: ...`). Catalogs may use tables.
- Paragraphs of 3-4 sentences at most. Avoid LaTeX notation; use `->` or a Unicode arrow.
- No redundant version badges. Never allow duplicate suffixes such as `(v1.2.0) (v1.2.1)`.
- Never copy a legacy MCPEDL description to CurseForge unchanged; the platforms use different backends, so adjust in CurseForge's `</>` editor.
- Use relative paths for links between repository files. Use full URLs in published pages:
  - `https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>`
  - `https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/<file>`
- If HTML image sizing is needed, use relative widths and omit fixed height.
- Collapsible spoilers (CurseForge `</>` editor): `<h2>Spoiler Title</h2><div class="spoiler">content</div>`. Preview on the target platform first and do not promise cross-platform behavior.
- Images: READMEs have none. DESCRIPTIONs may include only item sprites and crafting recipe diagrams, and only when requested or required by the project (see "Recipe Images and Item Sprites" in Part 1).

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

**Project README.md**

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

**Project DESCRIPTION.md**

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

- Minecraft Bedrock Edition: [verified minimum version]
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
- No hyperlinks, raw URLs, linked names, or badges anywhere.
- No boilerplate: after `# Changelog — [Add-on Name]`, go straight to release entries (an optional `---` is fine). No intro sentence and no mention of Keep a Changelog or Semantic Versioning.
- Explain player impact, for example "Decorative leaf protection: Hedges and bushes you place are now ignored by the tree capitator." No function names, event names, JSON or type diffs, commit hashes, or CI steps. No unverified benefits.

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

- Part 1 (core policy) and Part 2 (all README, DESCRIPTION, and CHANGELOG rules and templates) are authoritative. This Part defines only the audit workflow and the Samples and Wiki references. It does not restate or override them. If Part 1 or Part 2 cannot be read, stop and report it instead of working from memory.
- The user's explicit scope and source accuracy outrank any template.

### 2. Scope and Modes

Handles documentation and catalog maintenance only. Do not change gameplay code, manifests, UUIDs, versions, dependencies, pack settings, assets, workflows, or release configuration unless the user explicitly asks.

- **Repository-wide audit:** the user says `/checkrm`, asks to check all projects, or names no single project.
- **Individual project:** the user names a project, slug, or folder, or asks to create, repair, or update one project's documentation.
- **Documentation-only:** if the user says so, touch no gameplay files, manifests, assets, scripts, or workflows.

Discover the actual folder structure first. Do not assume a folder or file exists, and do not silently substitute a similarly named project; report ambiguity or a missing target.

### 3. Procedure

1. **Discover.** Identify the target project, its current README and DESCRIPTION, manifests, scripts and configuration, entities, items, blocks, recipes, functions, loot tables, animations, language files, and assets, plus the parent category catalog, root README, and builds README.
2. **Audit status.** For repository-wide checks run `python3 scripts/check_readme_status.py`. It reports missing or incomplete documentation (`Not yet written`, scaffold stubs containing `## Source Files`, DESCRIPTION files missing gameplay sections, add-on READMEs that contain product information instead of a download link, map and script READMEs that are too short, broken relative links, orphaned build directories). `--fix` generates standard documentation for detected stubs; review its output before keeping it. If the script is absent or fails, inspect manually and report the limitation.
3. **Verify project facts.** Read the relevant files before writing any claim: manifests, entry points, entity and component files, items, blocks, recipes, functions, loot tables, language files, pack relationships, and settings. Establish, when evidence permits: what the project does, which features exist, how they are activated or configured, whether settings persist, required packs and dependencies, supported versions, known limitations, and achievement and experiment status (Part 1, Section 2). Never infer a feature from a name alone, and distinguish implemented behavior from planned behavior. When a document names a vanilla item or block, verify its name and sprite against Sections 4 and 5 below instead of writing it from memory or title-casing the identifier.
4. **Check references before writing.** Before creating or substantially rewriting a README or DESCRIPTION, read the root README, the category catalog, the builds README, and two or three well-documented projects of the same category. Reuse conventions, not project-specific claims. Verify a reference's links, image paths, and claims before adopting anything from it.
5. **Write or update.** Follow Part 2 for file roles, writing rules, and templates. Migrating an older add-on moves verified README content into `DESCRIPTION.md` and leaves a download-only README. Do not add a feature merely because it was requested if it is not implemented. Omit installation steps entirely if the user asks.
6. **Images, badges, links.** README.md files contain no images. DESCRIPTION.md images are limited to requested item sprites and crafting diagrams, following Part 1, Section 5, with absolute raw GitHub URLs that you have confirmed exist. Do not add badges; verify any existing badge and its destination, or remove it. Leave no placeholders in finished files. Verify that every link destination exists.
7. **Synchronize catalogs and builds.** Check whether the project appears in its category catalog, the root README, and the builds README. Update only relevant entries, search first to avoid duplicates, and keep established ordering. Inspect any build script before running it. A known command is `python3 scripts/auto_bump_and_build.py --project "<Project-Name>" --no-bump`. Use `--no-bump` unless the user explicitly requests a version bump. Never claim a build or sync completed if it failed or was not run.
8. **Verify.**
   1. Re-read the whole edited file, and check headings, lists, and links.
   2. Confirm each documented feature has source evidence and that no verified content was lost.
   3. Run `python3 scripts/validate_manifest_titles.py --project <project-path>` when applicable.
   4. Run `python3 scripts/check_readme_status.py` again. Expect `0` needing update and `[LINK INTEGRITY] All relative links valid`; fix broken links before finishing.
   5. Check the add-on LOCK marker (Part 1, Section 3) for projects under `MCPEDL/addons/` and `MCPEDL/new_addons/`. Report the exact project path of any missing or invalid marker and do not call the project build-ready.
   6. Review the final diff for scope. If a check was not run, say so.
9. **Report.** State briefly: projects audited or updated; README, DESCRIPTION, catalog, and build files changed; commands run and results; missing assets, unresolved links, or unverifiable information; remaining projects needing attention. Never report success for a check that was not run or did not pass, and never claim every project was audited if some were inaccessible.

### 4. Minecraft Wiki Item Reference

The [Minecraft Wiki item list](https://minecraft.wiki/w/Item) is the reference for official item names, how items are grouped, and what their inventory sprites look like. Use it together with Bedrock Samples, never instead of it.

- **Division of authority:** item and block identifiers, textures, recipes, and components come from Bedrock Samples (the Wiki page does not list internal IDs). Player-facing display names follow the Wiki's item name for Bedrock Edition, confirmed against `resource_pack/texts/en_US.lang` in Samples (keys such as `item.<id>.name` and `tile.<id>.name`). The lang file is the in-game truth when the Wiki is unreachable or disagrees; report any disagreement instead of picking silently.
- Never derive a display name by title-casing an identifier. Vanilla names often differ from IDs (`experience_bottle` is Bottle o' Enchanting, `hay_block` is Hay Bale, `ender_eye` is Eye of Ender, `wooden_door` is Oak Door, `golden_rail` is Powered Rail, `magma` is Magma Block).
- **Edition tags:** the item list marks entries `[BE only]` or `[JE only]`. Do not document or sell an item as available if it is Java-only (Spectral Arrow is not a Bedrock item).
- **Sprite naming on the Wiki:** `Invicon_<Title_Case_Name>.png` for inventory renders and `ItemSprite_<lowercase-hyphenated-name>.png` for flat sprites. Look sprites up by the Wiki name, not the identifier.
- **Fetching:** read the page with whatever web fetch or search tool your environment provides. Shell access to `minecraft.wiki` is often blocked by network policy; if a request is refused, report it, do not route around it, and fall back to Bedrock Samples (`en_US.lang` for names, `textures/` for sprites).
- **Licensing and images:** the image rules in Part 1, Section 5 apply. By default, generate sprites and recipe diagrams from Bedrock Samples textures and use the Wiki only to confirm names, edition availability, and what an icon should look like.
- **Mismatches:** the Wiki, `en_US.lang`, and Samples can lag each other across releases. Check the Samples version in `version.json` and state the version a name or availability claim was verified against.

### 5. Mojang Bedrock Samples Reference

Mojang's official [bedrock-samples](https://github.com/mojang/bedrock-samples) repository is the source of truth for vanilla Bedrock identifiers, textures, recipes, components, entity definitions, and data formats. Its checkout root is the `BEDROCK_SAMPLES_ROOT` environment variable; the recipe-image workflow clones it to `/tmp/bedrock-samples`.

- Layout: `resource_pack/` (textures in `textures/items/`, `textures/blocks/`, `textures/models/armor/`, `textures/ui/`; `attachables/`; `texts/`) and `behavior_pack/` (`items/`, `entities/`, `recipes/`, `loot_tables/`).
- Content changes between releases. Verify the checked-out version and confirm each path exists before relying on a file, value, or schema. Do not hardcode values such as armor defense or durability from memory; read the actual definitions.
- Item identifiers do not always match texture filenames. Inventory all recipes first, build an explicit ingredient-to-texture mapping, and use texture atlas or index metadata when helpful. Report all unresolved items together and fail clearly rather than substituting a placeholder.
- The texture indexes (`textures/item_texture.json`, `textures/terrain_texture.json`) begin with a `//` comment line, so strip comment lines before parsing them as JSON. Many vanilla items have no entry keyed by identifier, and many block textures are `.tga` rather than `.png`, so check both extensions before calling a texture missing.
- Block inventory icons are rendered in game from top and side textures. Flat `textures/blocks/` files are not inventory icons; render an isometric view from the real face textures when a cube-style sprite is needed.
- An identifier that is valid in one place may not exist in Bedrock (`oak_door` is `wooden_door`). Confirm an identifier appears in Samples recipes, loot tables, or trades before documenting it.
- Custom items use the add-on's own resource-pack textures. Vanilla recipes in `behavior_pack/recipes/` are the reference for recipe format, group tags, and ingredient identifiers.
- If the checkout is missing or lacks the asset, report the limitation and do not pretend it was sourced. When only GitHub is reachable, a sparse `git clone --filter=blob:none --sparse` followed by `git sparse-checkout set --no-cone <paths>` works even when raw file downloads are blocked. Do not report success until generation finishes, PNGs are committed, and image references resolve.
- Scale 16x16 textures with nearest-neighbor interpolation to keep pixel art crisp:

```python
import os
from PIL import Image

samples = os.environ.get("BEDROCK_SAMPLES_ROOT", "/tmp/bedrock-samples")
icon = Image.open(f"{samples}/resource_pack/textures/items/<verified_file>.png").convert("RGBA")
icon = icon.resize((44, 44), Image.Resampling.NEAREST)
```

---

## Part 4: Game Generator (AI Agent Instructions, v8)

Instructions for an AI agent that builds a complete project from the user's idea and returns it as **one line of base64**. The user pastes it into the GitHub workflow **Create Project from Base64**, which puts it in the right `MCPEDL/` folder and builds the worlds that type needs.

If you can read the repository AllensCreations/MCPE-Curseforges, read this file plus `scripts/build_payload.py` (the checks), `scripts/import_project_payload.py` and `scripts/build_test_world.py` first. The scripts are the real source of truth: if this Part and a script disagree, the script wins, and you tell the user what differs. If you cannot read the repo, this Part is self-sufficient: Section 8 contains the full packaging script.

Parts 1 to 3 apply to everything you generate (accuracy, versions, manifest titles, recipe unlocks, documentation style). This Part adds only what is specific to generating a project.

---

### 0. First: ask the type

If the user has not already said it, ask exactly this one question and wait for the answer:

> What do you want to make: **addon**, **map** (OneBlock), or **script** (a mini-game or challenge with a Controller and a test world)?

Do not guess the type from the idea. Do not continue until you have it. Then follow Sections 1 to 3, the one section for that type (4, 5, or 6), and Sections 7 to 11. Ask at most one more question, and only if the answer would change what you build.

| Type | Folder it lands in | Extra files it needs |
|---|---|---|
| addon | `MCPEDL/new_addons/<Name>/` | none; optional `test_world.json` |
| map | `MCPEDL/maps/<Name>/` | void cleaner, setup function, Trader Ledger (Section 5) |
| script | `MCPEDL/script/<Name>/` | Controller, `give_controller` function, `test_world.json` (Section 6) |

---

### 1. Hard rules for the agent (all types)

- **Never write base64 by hand.** Create the files, build the ZIP, and encode it by actually running code (Section 8). If you cannot run code, stop and say so; output the file tree with full contents plus the script and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Never claim an in-game test; building the ZIP proves structure only (Part 1, Section 1).
- Look up the **latest stable** Minecraft Bedrock release and **latest stable** `@minecraft/server` and `@minecraft/server-ui` versions from the official Minecraft Creator documentation at the time of the work, and record the date you checked (Part 1, Section 2). No preview/beta/RC unless a requested feature requires it, and then say so in the README.
- `min_engine_version` is the lowest game version the implementation needs, as a 3-number array. If you cannot confirm which game version first shipped the module version you use, say so.
- Source priority is the one in Part 1, Section 1.
- **Art:** a generated payload never contains AI-generated images (Part 1 allows them only on an explicit user request, which this generator does not take). The Trader Ledger (maps) and Controller (scripts) icons come only from the repo copy or the copy embedded in Section 8. For any other texture use real vanilla texture names, user-supplied textures, or omit the icon.
- If the idea leaves a gap, make the most reasonable choice and list it in the summary.
- Shell tip: the environment may be plain `sh`, so do not use brace expansion like `mkdir -p a/{b,c}`. After creating files, list them and confirm they exist.
- Never write comments in `.js`, `.mcfunction` or `.json` files, and keep code short and self-explanatory. Explanations belong in your reply, not in the files.
- Prefer event-driven logic over per-tick polling, broad entity searches, or block scans.

---

### 2. What the agent delivers

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

### 3. Manifests (all types)

Applies to `behavior_pack/manifest.json` and, when present, `resource_pack/manifest.json`. The title and attribution rules of Part 1, Section 3 apply in full.

- `format_version`: 2. `header.min_engine_version` is a 3-number array.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`: one terminal version suffix equal to `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` **exactly once**. Keep attribution out of the name.
- Fresh, valid, unique UUIDs (v4) for every header and module. Never reuse one.
- If a resource pack exists, the behavior pack's `dependencies` includes `{ "uuid": "<resource pack header.uuid>", "version": [x, y, z] }` with the matching version.
- Script modules: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`, and dependencies written as `{ "module_name": "@minecraft/server", "version": "<latest stable string>" }`. Add `@minecraft/server-ui` when the pack uses forms (always for the Controller).
- No experiments unless the feature truly needs one; name it in the documentation if so.
- `min_engine_version` is the looked-up game version as 3 integers. `[0, 0, 0]` is a placeholder and is rejected.
- Dependencies and imports are limited to `@minecraft/server`, `@minecraft/server-ui`, and `@minecraft/vanilla-data`. `eval` and the `Function` constructor are rejected, and every `.js` file must pass `node --check` (install Node if it is missing).

Resource pack template (replace every `<fresh uuid v4>` and replace `[0, 0, 0]` with the game version you looked up; the checker rejects the placeholder):

```json
{
  "format_version": 2,
  "header": {
    "name": "Add-on Name (v1.0.0)",
    "description": "Textures for the add-on. by AllensCreations",
    "uuid": "<fresh uuid v4>",
    "version": [1, 0, 0],
    "min_engine_version": [0, 0, 0]
  },
  "modules": [
    { "type": "resources", "uuid": "<fresh uuid v4>", "version": [1, 0, 0] }
  ],
  "metadata": { "authors": ["AllensCreations"], "product_type": "addon" }
}
```

---

### 4. Type: addon

- Behavior pack required; resource pack optional. No void cleaner, no ledger, no controller.
- If you ship `functions/tick.json`, every name in it must exist as `functions/<n>.mcfunction`.
- A `test_world.json` is optional. Add one when the user wants a test world for the add-on (Section 6 describes the format).
- The importer writes the `LOCK` markers; do not create them.

---

### 5. Type: map (OneBlock)

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
5. The ledger's role follows the idea. The Dirtbound reference map (Part 1, Section 7) makes it the only way to open a Script API shop menu (`give_trader.mcfunction` gives it, and the script restores a missing one on join). If the idea gives it no role, still ship it and say so in the summary.

**Pipeline** (Dirtbound reference design) unless the user specifies otherwise. `void_cleaner.mcfunction` runs every tick, but each command is guarded by `tag=!void_cleaned`, in this order: (1) the required Y=-64 line above; (2) clear the starting area if needed; (3) teleport the untagged player to spawn (the only function-side teleport); (4) place Bedrock under the core; (5) place a placeholder at the core only if empty; (6) set world spawn; (7) optionally send a notice; (8) **add the `void_cleaned` tag as the very last command**. Without step 8 every guarded command, including the teleport, repeats every tick forever. Part 1, Section 7 lists the same order for Dirtbound.

- Protect the core from later joiners: any clear of the core area must be skipped once the core exists (for example `unless block <bedrock position> bedrock`).
- `oneblock_tick` may restore only missing Bedrock, and only if a player already has `void_cleaned`. It must not reset spawn, teleport players, or place or replace the core.
- If a Script API owns the core block, break rewards, and progression, it waits until a player has `void_cleaned` before replacing the placeholder.
- Dirtbound coordinates: core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. If the user gives others, use theirs and make sure any `fill` covers what it claims to clear.
- A script teleport (for example a boundary guard) is allowed only in script; state it in the summary and keep the function-side pipeline unchanged. If an idea cannot work with the `void_cleaner`-first pipeline, say so instead of silently changing it.

---

### 6. Type: script

A script is a mini-game or challenge driven by the Script API. It works in any world; it does not depend on specific terrain.

**Required files** (the script installs the six Controller files if missing):

```
behavior_pack/manifest.json                    script module + @minecraft/server + @minecraft/server-ui
behavior_pack/scripts/main.js
behavior_pack/items/controller.json
behavior_pack/functions/give_controller.mcfunction   exact line: give @s allenscreations:controller
behavior_pack/functions/end_game.mcfunction          exact line: scriptevent allenscreations:end
resource_pack/manifest.json
resource_pack/textures/item_texture.json       entry "controller" -> "textures/items/controller"
resource_pack/textures/items/controller.png    16 x 16, from the repo or Section 8, never redrawn
test_world.json
```

**The Controller.** Every script ships the repo's Controller icon (the user's `pixel_controller.png`, 16 x 16, shipped as `controller.png`) as item `allenscreations:controller`. Using it opens a form with exactly two buttons: **Start** and **How to play**. The user can opt out with `"controller": false` in `project.json`; then none of the Controller files are needed.

- Only the host or an operator receives and can use the Controller (`player.isOp()`). **Start** works while the game is not running, and re-reads the game state after the form closes because another player may have changed it while it was open. **How to play** opens a second form that shows the rules text and a Back button.
- **Survival breaks it, Creative keeps it.** Start consumes the first Controller found in the player's inventory (not just the selected slot, so switching slots does not avoid it) unless `getGameMode()` is `GameMode.Creative`.
- **How the game ends.** Your game logic calls `endGame()` on its win or lose condition. `endGame()` sets the state to `ended` and gives the host or operator a fresh one if they have none, so a Survival world cannot get stuck without one.
- **Admin functions.** `give_controller.mcfunction` (`/function give_controller`) and `end_game.mcfunction` (`/function end_game`, which sends the `allenscreations:end` script event the script listens for) are always shipped and need cheats. They are not form buttons. The item also stays in the creative inventory (`menu_category`).
- **Giving it.** The script gives it only to the host or an operator on their first spawn, when they do not already carry one and the game is not `running` (Creative operators always get one). Game state (`idle`, `running`, `ended`) lives in a world dynamic property so it survives rejoining.
- **The form** shows the state and a one-line statement of whether the Controller will be kept. Keep the two labels `"Start"` and `"How to play"` exactly, in that order, and do not add Restart or End buttons.
- **How to play text.** Replace the `HOW_TO_PLAY` constant in the template with the real rules of your game: goal, controls, and how it ends.

**Controller texture pack (resource pack).** The icon is `Mcpeworlds/assets/resources_pack/textures/items/controller.png` in the repo, a 16 x 16 PNG. The importer compares your copy to that file byte for byte.

- Never draw, recolor, resize or re-save it, and never write its base64 by hand. Running `build_payload.py` installs it for you as `resource_pack/textures/items/controller.png`.
- The same run also creates `resource_pack/textures/item_texture.json` (`atlas.items`, entry `controller` pointing to `textures/items/controller`), `behavior_pack/items/controller.json` (identifier `allenscreations:controller`, icon `controller`, display name `Controller`, stack size 1, `format_version` taken from your behavior pack's `min_engine_version`, never lower than 1.20.80) `behavior_pack/functions/give_controller.mcfunction` and `behavior_pack/functions/end_game.mcfunction`. It never overwrites an existing PNG.
- Write `behavior_pack/manifest.json` with the looked-up `min_engine_version` before running the script, because the item JSON takes its `format_version` from it.
- You still write `resource_pack/manifest.json` yourself (Section 3 template, fresh UUIDs, same version as the behavior pack) and add its dependency to the behavior pack manifest, plus `@minecraft/server-ui`.
- Do not copy anything else from `Mcpeworlds/assets/`. Do not ship a resource pack for a script with `"controller": false` unless it has its own textures.
- If the script needs other textures, add them next to the Controller icon and extend `item_texture.json` without removing the `controller` entry.

Starting point for `main.js` (adapt it and put your game logic around `startGame` and `endGame`, calling `endGame()` from your win or lose condition; confirm every member against the stable module versions you chose, including `getGameMode()` and `GameMode`; do not add comments):

```js
import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
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
  for (const p of world.getAllPlayers()) if (p.isOp()) giveController(p);
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
    if (itemStack?.typeId === CONTROLLER_ID && source.isOp()) openController(source);
});

system.afterEvents.scriptEventReceive.subscribe(({ id }) => {
  if (id === "allenscreations:end" && getState() === "running") endGame();
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn) return;
  if (player.isOp() && (isCreative(player) || getState() !== "running")) giveController(player);
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

### 7. Recipes and documentation (all types)

Documentation follows Part 2 exactly; `build_payload.py` prints a `DOC:` warning for each rule it can check, and the final run must show none.

- Every custom crafting recipe needs the unlock the recipe type requires (Part 1, Section 4): `"unlock": { "context": "AlwaysUnlocked" }`, or `"unlock": [{ "context": "AlwaysUnlocked" }]` for array-style formats. Do not mix schemas; compare against Bedrock Samples. The importer rejects any file in `behavior_pack/recipes/` without `AlwaysUnlocked`.
- **Add-on `README.md`:** the Part 2 download-only template, at most 24 non-empty lines: title with version, `**Download:**` link, `## Installation`, `## Add-on Information` linking `DESCRIPTION.md`. Until a package exists, link the official catalog page (`https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/new_addons/README.md#available-add-ons`). No other links, no `.mcworld` claims, no features.
- **Map and script `README.md`:** the product page (Part 2, Section 1): an Overview or Features section and at least 25 non-empty lines. For a map, mention the Trader Ledger; for a script, the Controller. Never claim a `.mcworld` exists; archives are added after the build.
- **Compatibility lines** go in `DESCRIPTION.md` for add-ons and in `README.md` for maps and scripts (the checker accepts them in either file): exactly one of *Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*; an experiments line (for example "No experiment requirement detected in the inspected files."); and the sentence "Source created, not tested in game."
- **`DESCRIPTION.md`:** the Part 2 template, including the Creator and Permissions links, the Guidelines and Attribution block, and the Search & Discovery Keywords section. Only features that exist in the files. Never mention `Script API` or `@minecraft/` modules. Use in-game display names, no code blocks, no Markdown tables.
- **`CHANGELOG.md`:** the Part 2 format, starting with `## [1.0.0] - YYYY-MM-DD`, with `### Added` entries, no links.

---

---

### 8. `build_payload.py` v8 (run this, do not hand-write)

One script does the whole job: installs missing Trader Ledger or Controller files, runs every check, builds the ZIP, writes `payload.b64` (always one line) and round-trips it. The repo's importer imports this same file.

1. Create the project under `build/<Name>/` using the Section 2 layout, including `project.json` and a behavior pack manifest with the looked-up `min_engine_version`.
2. Save the script below as `build_payload.py` next to `build/`.
3. Run `python build_payload.py build/Name`. Add `--check-only` to test without building.
4. Fix every failure and every `DOC:` warning it prints and run it again. Paste the final output (SELF-TEST PASSED and BUILD OK) into your reply. It proves structure only. Node must be installed so the script syntax check runs; if the output says syntax was not checked, say so in your reply.
5. Deliver `payload.b64`: one single line, no line breaks, spaces or code fences. If the ZIP is under 48,000 bytes you may paste it inline; otherwise deliver the file and tell the user to commit it to `MCPE-Curseforges/MCPEDL/incoming/<n>.b64` and pass that path as `payload_file`. Never retype it from memory.

```python
#!/usr/bin/env python3
"""Project payload builder v8 for AllensCreations/MCPE-Curseforges.

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
import argparse, base64, hashlib, io, json, re, shutil, struct, subprocess, sys, tempfile, zipfile
from pathlib import Path, PurePosixPath

TYPES = ("addon", "map", "script")
MODES = ("Creative", "Survival", "Hardcore")
DEST_DIR = {"addon": "new_addons", "map": "maps", "script": "script"}
MIN_ITEM_FORMAT = [1, 20, 80]
CONTROLLER_LABELS = ("Start", "How to play")
LEDGER_SHA256 = "fecc64905334511d97569611666ffa28a8941683a20e30ca5926ecb9ffd9c001"
LEDGER_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA/0lEQVR42mNgGAUDDBgJKTgy0eI/pZbY5J/AaQ8TLglbdan/tupS/6nhS3zmMA26KCj3Vkdx7bE7nymyoD1LDm90sBAyYNXKSrItDwtvJ6hmwKOAhViFfFJGRBv66dk58h3w5P2vwRkCMBDVXotTblllM+0dQAp45qnBEH8fVUy5wOn/3Qn7GOniAAYGBgYFP1kU/oNNjykLAXKCOdVCg4GBgYFh9okbIywNwAA2nw+9goiSYKZ5OYDPUeipnq5pQGr7DYK14eBLAzKCbIMzDZBSw5ECBn82JKZVQ5NmOawli56KyQGV0x4xHL75jHFoRQHCxXIU9w1w+X4UDAoAACWbTR1cQx13AAAAAElFTkSuQmCC"
CONTROLLER_SHA256 = "c2f833f915003f333991bc098df114f1765fc2b8ecd2ccda98b7d6128f2d234a"
CONTROLLER_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAQVJREFUOE9jZKAQMFKonwHdgP9EGgjXh2zAf8ln78D6n0sJMcDYMAORxUBsBgaI5TADwJqVUlLgDvj/4QWKYxgFJOD8e3PmgC0B6QcZANd8dNs6BmuvILBCkCJkADN81/QbDG6ZGmB5kCFwA6AmgvXADEEPj8dCaxlk3wUzrL15lsHw8HlUA0A2ILsAV2AyZl9i+D9VD9MFyP6PD/AA6285lAqma+xmg+mFG3ZghAM8EK2srMCSoMCCGQDTgMyHBe6xY8dQA1ExxAduOlQSwxcwS0AS99dsQQ0DmAEwk3GEwX+YIcgGgNSCoxJkCDEGwDTD0gHYADQbceURDHVUz0y4oh+nOABgcXsLMipB8AAAAABJRU5ErkJggg=="
ASSET_DIR = "Mcpeworlds/assets/resources_pack/textures/items"  # repo copies, used by the importer

LEDGER_TEXTURE = {"resource_pack_name": "dirtbound_kingdom", "texture_name": "atlas.items",
                  "texture_data": {"trader_ledger": {"textures": "textures/items/trader_ledger"}}}
LEDGER_ITEM = {
    "format_version": "",
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
    "format_version": "",
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
END_LINE = "scriptevent allenscreations:end"
ALLOWED_MODULES = ("@minecraft/server", "@minecraft/server-ui", "@minecraft/vanilla-data")
REPO_URL = "https://github.com/AllensCreations/MCPE-Curseforges/tree/main/"
GAMEPLAY_HEADING = re.compile(r"^##\s+.*(overview|feature|mechanic|how it works|about|rule|system|gameplay)", re.I | re.M)
IMPORT_RE = re.compile(r"""(?:\bimport\b[^;]*?\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']""")
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
                       "behavior_pack/functions/give_controller.mcfunction", "behavior_pack/functions/end_game.mcfunction")


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


def item_format_version(root):
    try:
        m = json.loads((Path(root) / "behavior_pack/manifest.json").read_text(encoding="utf-8-sig"))
        mev = m["header"]["min_engine_version"]
        if isinstance(mev, list) and len(mev) == 3 and all(isinstance(x, int) and not isinstance(x, bool) for x in mev) and mev != [0, 0, 0]:
            return ".".join(str(x) for x in max(mev, MIN_ITEM_FORMAT))
    except Exception:
        pass
    return None


def _item(template, root):
    fv = item_format_version(root)
    if fv is None:
        sys.exit("Set behavior_pack/manifest.json header.min_engine_version to the looked-up game version before running this script: the shipped item JSON takes its format_version from it.")
    return {**template, "format_version": fv}


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
            _write_json(i, _item(LEDGER_ITEM, root))
            print("installed  behavior_pack/items/trader_ledger.json")
    elif wants_controller(pj):
        base = {"resource_pack_name": "allenscreations", "texture_name": "atlas.items",
                "texture_data": {"controller": CONTROLLER_ENTRY}}
        _install_icon(root, "controller", _png(CONTROLLER_PNG_B64, CONTROLLER_SHA256), CONTROLLER_ENTRY, "controller", base)
        i = root / "behavior_pack/items/controller.json"
        if not i.exists():
            _write_json(i, _item(CONTROLLER_ITEM, root))
            print("installed  behavior_pack/items/controller.json")
        g = root / "behavior_pack/functions/give_controller.mcfunction"
        if not g.exists():
            g.parent.mkdir(parents=True, exist_ok=True)
            g.write_text(GIVE_LINE + "\n", encoding="utf-8")
            print("installed  behavior_pack/functions/give_controller.mcfunction")
        e = root / "behavior_pack/functions/end_game.mcfunction"
        if not e.exists():
            e.parent.mkdir(parents=True, exist_ok=True)
            e.write_text(END_LINE + "\n", encoding="utf-8")
            print("installed  behavior_pack/functions/end_game.mcfunction")


def _png_size(d):
    if d[:8] != b"\x89PNG\r\n\x1a\n" or len(d) < 24:
        return None
    return struct.unpack(">II", d[16:24])


def _has_comment(src):
    i, n, q = 0, len(src), None
    while i < n:
        c = src[i]
        if q:
            if c == "\\":
                i += 2
                continue
            if c == q or (q != "`" and c == "\n"):
                q = None
            i += 1
            continue
        if c in "\"'`":
            q = c
        elif c == "/" and i + 1 < n and src[i + 1] in "/*":
            return True
        i += 1
    return False


def _node_syntax(path):
    """Return (ran, error). Uses node --check on a .mjs copy; ran is False when node is missing."""
    node = shutil.which("node")
    if not node:
        return False, ""
    with tempfile.TemporaryDirectory() as t:
        tmp = Path(t) / "check.mjs"
        shutil.copyfile(path, tmp)
        r = subprocess.run([node, "--check", str(tmp)], capture_output=True, text=True)
    if r.returncode == 0:
        return True, ""
    errs = [ln for ln in r.stderr.splitlines() if "Error" in ln]
    return True, (errs[-1] if errs else "syntax error").strip()


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
            check(bool(cmds) and re.search(r"\btag\b.*\badd\s+void_cleaned\b", cmds[-1]) is not None,
                  "void_cleaner.mcfunction: the last command must add the void_cleaned tag, otherwise every command repeats every tick")

    uuids, versions, huuid, bpm, mevs = [], {}, {}, {}, {}
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
        if not (isinstance(mev, list) and len(mev) == 3 and all(isinstance(x, int) and not isinstance(x, bool) for x in mev)) or mev == [0, 0, 0]:
            fails.append(f"{label}: header.min_engine_version must be 3 integers (the looked-up game version), not a placeholder")
        mevs[label] = mev
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
    if repo_root:
        mine = {u.lower() for u in uuids if isinstance(u, str)}
        for mp in sorted((Path(repo_root) / "MCPEDL").glob("*/*/*/manifest.json")):
            proj = mp.parent.parent
            if folder and proj.name == folder and proj.parent.name == DEST_DIR.get(ptype):
                continue
            try:
                other = json.loads(mp.read_text(encoding="utf-8-sig"))
            except Exception:
                continue
            ids = [(other.get("header") or {}).get("uuid")] + [m.get("uuid") for m in other.get("modules") or []]
            for u in ids:
                if isinstance(u, str) and u.lower() in mine:
                    fails.append(f"UUID {u} is already used by MCPEDL/{proj.parent.name}/{proj.name}: generate fresh UUIDs")
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
            check(d["module_name"] in ALLOWED_MODULES, f"dependency {d['module_name']} is not allowed (allowed: {', '.join(ALLOWED_MODULES)})")
        if any(w in str(d.get("version", "")).lower() for w in ("beta", "rc", "preview")):
            warns.append(f"preview/beta dependency {d.get('module_name')}: allowed only if a requested feature needs it; say so in the README")
    has_script = any(x.get("type") == "script" for x in bpm.get("modules") or [])
    if ptype == "script":
        check(has_script, "script project: behavior_pack manifest needs a script module")
    if has_script:
        check("@minecraft/server" in modnames, "script module needs a @minecraft/server dependency")
    if controller:
        check("@minecraft/server-ui" in modnames, "controller needs a @minecraft/server-ui dependency")
    mev_bp = mevs.get("behavior_pack")
    if isinstance(mev_bp, list) and len(mev_bp) == 3 and all(isinstance(x, int) for x in mev_bp) and mev_bp != [0, 0, 0]:
        for item_rel in ("behavior_pack/items/trader_ledger.json", "behavior_pack/items/controller.json"):
            ip = root / item_rel
            if not ip.is_file():
                continue
            try:
                fv = [int(x) for x in str(json.loads(ip.read_text(encoding="utf-8-sig")).get("format_version", "")).split(".")]
            except Exception:
                continue
            if len(fv) == 3 and fv > mev_bp:
                warns.append(f"{item_rel}: format_version {'.'.join(map(str, fv))} is newer than min_engine_version {'.'.join(map(str, mev_bp))}: raise min_engine_version")

    rec = root / "behavior_pack/recipes"
    for p in rec.glob("**/*.json") if rec.is_dir() else []:
        check(b"AlwaysUnlocked" in p.read_bytes(), f"{p.relative_to(root).as_posix()}: missing AlwaysUnlocked")

    def icon_checks(key, ident, item_rel, want_sha, size):
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

    scripts_dir = root / "behavior_pack/scripts"
    for jp in sorted(scripts_dir.rglob("*.js")) if scripts_dir.is_dir() else []:
        jrel = jp.relative_to(root).as_posix()
        jtxt = jp.read_text(encoding="utf-8")
        for spec in IMPORT_RE.findall(jtxt):
            check(spec in ALLOWED_MODULES or spec.startswith(("./", "../")),
                  f"{jrel}: import of '{spec}' is not allowed (only {', '.join(ALLOWED_MODULES)} and relative files)")
        check(not re.search(r"\beval\s*\(|\bFunction\s*\(", jtxt), f"{jrel}: eval and the Function constructor are not allowed")
        if _has_comment(jtxt):
            warns.append(jrel + ": remove comments (no comments in scripts)")
        ran, err = _node_syntax(jp)
        if ran and err:
            fails.append(f"{jrel}: syntax error: {err}")
        elif not ran:
            warns.append(f"{jrel}: syntax not checked (node not found)")

    if ptype == "map":
        icon_checks("trader_ledger", "allenscreations:trader_ledger", "behavior_pack/items/trader_ledger.json", LEDGER_SHA256, (32, 32))
    if controller:
        icon_checks("controller", "allenscreations:controller", "behavior_pack/items/controller.json", CONTROLLER_SHA256, (16, 16))
        mj = root / "behavior_pack/scripts/main.js"
        if mj.is_file():
            js = mj.read_text(encoding="utf-8")
            check("allenscreations:controller" in js, "main.js never mentions allenscreations:controller")
            check("ActionFormData" in js, "main.js must open the controller with ActionFormData")
            btn = []
            for label in CONTROLLER_LABELS:
                mt = re.search(r"\.button\(\s*[\"']" + label + r"[\"']", js)
                check(mt is not None, f"main.js: controller button '{label}' not found")
                btn.append(mt.start() if mt else None)
            if all(x is not None for x in btn):
                check(btn == sorted(btn), "main.js: controller buttons must be added in the order Start, How to play")
            check(re.search(r"\.button\(\s*[\"'](?:Restart|End)[\"']", js) is None, "main.js: the controller form must not have Restart or End buttons")
            check(re.search(r"getGameMode\(\)\s*[!=]==?\s*GameMode\.Creative", js) is not None,
                  "main.js: the controller must check GameMode.Creative with getGameMode()")
            check(re.search(r"\.setItem\(", js) is not None, "main.js: Start must consume the controller outside Creative (setItem)")
            check("scriptEventReceive" in js and "allenscreations:end" in js, "main.js: must handle the allenscreations:end script event")
            if "setInterval" in js or "system.runInterval" in js:
                warns.append("main.js uses a repeating timer; confirm it is not a per-tick scan")

    gf = root / "behavior_pack/functions/give_controller.mcfunction"
    if controller and gf.is_file():
        check(GIVE_LINE in gf.read_text(encoding="utf-8").splitlines(), "give_controller.mcfunction must contain: " + GIVE_LINE)
    ef = root / "behavior_pack/functions/end_game.mcfunction"
    if controller and ef.is_file():
        check(END_LINE in ef.read_text(encoding="utf-8").splitlines(), "end_game.mcfunction must contain: " + END_LINE)
    for fn in (root / "behavior_pack/functions").glob("**/*.mcfunction") if (root / "behavior_pack/functions").is_dir() else []:
        if any(ln.lstrip().startswith("#") for ln in fn.read_text(encoding="utf-8").splitlines()):
            warns.append(fn.relative_to(root).as_posix() + ": remove comments (no comments in functions)")

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

    readme, desc_p, chg = root / "README.md", root / "DESCRIPTION.md", root / "CHANGELOG.md"
    rtext = readme.read_text(encoding="utf-8") if readme.is_file() else ""
    dtext = desc_p.read_text(encoding="utf-8") if desc_p.is_file() else ""
    ctext = chg.read_text(encoding="utf-8") if chg.is_file() else ""
    both = (rtext + "\n" + dtext).lower()
    if rtext or dtext:
        if "not tested in game" not in both:
            warns.append("DOC: README.md or DESCRIPTION.md should state: source created, not tested in game")
        if not any(a in both for a in ACHIEVEMENT):
            warns.append("DOC: needs one achievement status line (Likely achievement-friendly / Not achievement-friendly / Unknown)")
        if "experiment" not in both:
            warns.append("DOC: needs an experiments line (for example: No experiment requirement detected in the inspected files.)")
    for url in re.findall(r"https?://[^\s)>\]]+", rtext):
        if not url.startswith(REPO_URL) or "/raw/" in url:
            warns.append(f"DOC: README.md link not allowed (only {REPO_URL}... pages, no downloads): {url}")
    if ".mcworld" in rtext.lower():
        warns.append("DOC: README.md mentions .mcworld: archives are added after the build, do not claim them")
    for name, text in (("README.md", rtext), ("DESCRIPTION.md", dtext)):
        low = text.lower()
        if "script api" in low or "@minecraft/" in low:
            warns.append(f"DOC: {name} must not mention Script API or @minecraft modules (Part 2)")
        if any(ln.lstrip().startswith("|") for ln in text.splitlines()):
            warns.append(f"DOC: {name} must not contain Markdown tables (Part 2)")
    nonempty = lambda t: len([ln for ln in t.splitlines() if ln.strip()])
    if ptype == "addon":
        rl = [ln for ln in rtext.splitlines() if ln.strip()]
        okr = (bool(rl) and rl[0].startswith("# ") and len(rl) <= 24
               and re.search(r"\*\*(?:Direct download|Download):\*\*\s*\[[^]]+\]\([^)]+\)", rtext) is not None
               and "## Installation" in rtext and "## Add-on Information" in rtext and "DESCRIPTION.md" in rtext)
        if not okr:
            warns.append("DOC: add-on README.md must follow the Part 2 template (title, **Download:** link, ## Installation, "
                         "## Add-on Information linking DESCRIPTION.md, at most 24 lines)")
        page, page_name = dtext, "DESCRIPTION.md"
    else:
        page, page_name = rtext, "README.md"
    if page and (GAMEPLAY_HEADING.search(page) is None or nonempty(page) < 25):
        warns.append(f"DOC: {page_name} is the product page for this type: needs an Overview/Features section and at least 25 non-empty lines")
    if dtext:
        for h in ("## Guidelines and Attribution", "## Search & Discovery Keywords"):
            if h not in dtext:
                warns.append(f"DOC: DESCRIPTION.md lacks '{h}' (Part 2)")
    if ctext:
        if re.search(r"https?://", ctext):
            warns.append("DOC: CHANGELOG.md must not contain links (Part 2)")
        if re.search(r"(?m)^## \[\d+\.\d+\.\d+\] - \d{4}-\d{2}-\d{2}", ctext) is None:
            warns.append("DOC: CHANGELOG.md needs entries like '## [1.0.0] - YYYY-MM-DD' (Part 2)")
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

### 9. Final self-check before replying

`build_payload.py` already checks structure, manifests, UUIDs, dependencies, recipes, and the type-specific files. By hand, confirm only:

- [ ] You asked for (or were given) the type before building.
- [ ] The script printed SELF-TEST PASSED and BUILD OK, and the base64 came from `payload.b64`, not from typing.
- [ ] Module versions are latest stable, looked up on the date of the work, with the date recorded.
- [ ] The documentation states achievement status, experiments, and "not tested in game" in the file Section 7 names, and the run shows no `DOC:` warnings.
- [ ] Map: `oneblock_setup.mcfunction` is harmless and idempotent, and the README says it is manual or optional. `void_cleaner` ends by adding the `void_cleaned` tag.
- [ ] Script: the form has exactly Start and How to play; `HOW_TO_PLAY` holds the real rules; the game logic is real (the template functions only send messages) and calls `endGame()` on its win or lose condition; Start consumes the Controller outside Creative; `end_game` and `give_controller` exist; each listed add-on exists.
- [ ] No comments in any script, function or JSON file.
- [ ] No file from `Mcpeworlds/assets/` other than the ledger or controller files was copied (no stray file named `1`).

---

### 10. If the build fails

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
| `main.js: controller button '<label>' not found` | Keep the two labels `"Start"` and `"How to play"` in `main.js`. |
| `the controller form must not have Restart or End buttons` | Remove them; the form has only Start and How to play. |
| `the controller must check GameMode.Creative` / `must consume the controller` | Keep the Creative check and the consume step from the Section 6 template. |
| `give_controller.mcfunction must contain` | The file must have the line `give @s allenscreations:controller`. |
| `remove comments` | Strip comments from the named file (warning only). |
| `is not allowed (allowed: ...)` / `import of ... is not allowed` | Use only `@minecraft/server`, `@minecraft/server-ui`, `@minecraft/vanilla-data`, and relative imports. |
| `eval and the Function constructor` | Remove them. |
| `syntax error` | Fix the line `node --check` reports. |
| `controller buttons must be added in the order` | Add `.button("Start")`, then `.button("How to play")`. |
| `the last command must add the void_cleaned tag` | End `void_cleaner.mcfunction` with the command that adds the `void_cleaned` tag (Section 5). |
| `format_version ... is newer than min_engine_version` | Raise `min_engine_version`, or lower the item `format_version` to it. |
| `Set behavior_pack/manifest.json header.min_engine_version` | Write the manifest with the looked-up game version before running the script. |
| `Name clash` / `Declared uncompressed size` | Pick another folder name, or enable overwrite if replacing is intended; shrink the payload under 25 MB. |
| `allenscreations:end script event` / `end_game.mcfunction must contain` | Keep the `scriptEventReceive` handler from the Section 6 template and the line `scriptevent allenscreations:end`. |
| `min_engine_version must be 3 integers` | Replace the placeholder with the looked-up game version. |
| `is already used by MCPEDL/...` | Generate fresh UUIDs; only an overwrite of the same folder may keep its own. |
| `Duplicate or case-colliding ZIP entry` | Remove the repeated file name. |
| `also exists under MCPEDL/...` | Pick another folder name, or enable overwrite if replacing that folder is intended. |
| `DOC: ...` | Fix the documentation rule it names (Section 7, Part 2). |
| `add-on '<x>' not found` | Fix the folder name in `test_world.json` or remove it. |
| `Duplicate pack UUID` / `depends on pack ... not included` | The included add-on clashes with or needs another pack: change the list. |
| `missing the AlwaysUnlocked unlock context` | Add the unlock to the recipe (Section 7). |
| `already exists. Re-run with overwrite enabled` | Set `overwrite` to true in the workflow. |

If the message is not listed, check the relevant script in `scripts/` and tell the user which rule it enforces.

---

### 11. Reply format

1. Type, and the suggested folder name (letters, numbers, `.` `_` `-`).
2. The base64 (one-line code block) **or** the `.b64` file.
3. A short summary: what it does, target game version, `min_engine_version` (and whether verified), module versions with the date checked, achievement and experiment status, the icon asset (Ledger or Controller: repo or embedded copy, hash verified), for a script the included add-ons, any deviations from this Part, and the `build_payload.py` result.
4. Next steps:
   - GitHub, Actions, **Create Project from Base64**, Run workflow.
   - Enter the folder name and paste the base64. **If the folder already exists, set overwrite to true.** Leave `commit_mode` on `pull_request`, then review and merge the pull request it opens.
   - Download the generated world from the run's artifacts or from the project folder and test it in Minecraft.
   - To change which add-ons a test world includes later, edit `test_world.json` and run **Build Test World**.
   - If the build fails, paste the error log back to the agent (Section 10).
