# Repository Instructions

Core policy for AllensCreations/MCPE-Curseforges. All README, DESCRIPTION, and CHANGELOG rules live in `README_GUIDELINES.md`, which must be followed together with this file; this file wins on any conflict. One skill, `.agents/skills/checkrm/SKILL.md`, covers the documentation audit workflow and the Mojang Bedrock Samples, Minecraft Wiki, and Bedrock Wiki references. It follows this file and `README_GUIDELINES.md` and never overrides them. AI-agent generation of add-ons, maps, and scripts is covered by `GAME_GENERATOR.md`, which follows this file and never overrides it.

---

## 1. Precedence and Accuracy

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

## 2. Versions and Compatibility

### Always use the latest stable

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

### Achievement and experiment assessment

Do this for every new pack and meaningful update. A compatible API version does not by itself establish achievement compatibility or experiment status.

- Inspect manifests, dependencies, stable-versus-preview imports, content JSON, components, scripts, functions, and any included world settings. Confirm suspected experiment requirements against current official documentation, not just a keyword match. Stable Script API or JavaScript use alone does not mean experiments are required or achievements are disabled.
- Inspect world experiment toggles and cheats/achievement settings separately when world settings are available. Pack files cannot establish the settings of an existing player world.
- If nothing is found, write "No experiment requirement detected in the inspected files." This does not prove every world setting or future version is safe.
- Prefer a stable, non-experimental implementation that preserves the requested behavior. Do not silently weaken a feature to avoid an experiment.
- Achievement status is one of: **Likely achievement-friendly** (no disabling condition found), **Not achievement-friendly / may disable achievements** (requires cheats, experiments, preview-only features, or another documented condition), or **Unknown / needs confirmation**. Never promise achievements stay enabled without verifying the exact game version, pack, and world setup.
- Handoff summary: achievement status, experiments (none detected / required with name / unknown), evidence, and scope (what was inspected, and whether actual world settings were available).

### Implementation rules

1. Inspect the existing manifest, entry points, imports, and structure before editing.
2. Confirm each API member's availability against the chosen stable module version.
3. Prefer event-driven logic over per-tick polling, repeated broad entity searches, or expensive block scans.
4. Use vanilla JSON components and `.mcfunction` files when simpler; use Script API where the feature needs it.
5. Avoid knowingly malformed files and fix obvious issues as you go. Use existing build/check workflows only as needed.
6. Record in notes or handoffs: target game version, `min_engine_version`, module versions used, any preview/experimental requirement, references checked with the date, and verification status (source created, package built, or in-game tested; never conflate these).

---

## 3. Manifest Title, Attribution, and LOCK Marker

- Every Behavior Pack and Resource Pack manifest title is `Add-on Name (vX.Y.Z)`, for example `Vanilla Quality of Life (v1.3.0)`. Update it whenever the release version changes; release automation must preserve this.
- Put `by AllensCreations` in `header.description` exactly once. Normalize existing descriptions rather than appending duplicates. Keep attribution out of the title.
- Do not change pack UUIDs or world storage keys just to rename a title.
- **Title validator**, run in the release workflow, failing the job on any violation and reporting errors rather than rewriting titles. For every manifest under `MCPEDL/`:
  - exactly one terminal `(vX.Y.Z)` suffix;
  - that version matches `header.version`;
  - no malformed or duplicated suffixes;
  - `behavior_pack/` and `resource_pack/` versions match when both exist.
- Run it for one project with `python3 scripts/validate_manifest_titles.py --project <project-path>`.

### Add-on LOCK marker

- Every project under `MCPEDL/addons/` and `MCPEDL/new_addons/` has a `LOCK` file at its root beginning with `AllensCreations Add-on Lock v1`.
- The scaffold workflow creates it and the build script enforces it. A missing or invalid marker is release-blocking: report the exact project path and do not call the project build-ready.
- It is a repository and build safeguard only. It does not encrypt source, stop edits, or prevent extraction of a distributable package.

---

## 4. Recipe Unlock Rule

Every custom crafting recipe must be unlocked by default using the schema its recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

- Formats that use an array take the equivalent form, `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas.
- Compare an existing recipe's type against the Bedrock Samples reference before choosing syntax.
- Do not change ingredients, result, count, station/tags, or shaped/shapeless structure. Do not rely on recipe-book discovery unless the user asks.
- Apply to all new recipes and any existing recipe you touch.

---

## 5. Recipe Images and Item Sprites

### When to create

- Optional. Create diagrams or sprites only when the user requests them or project instructions require them, and only for `DESCRIPTION.md`.
- Never use AI image generation unless the user explicitly asks.
- Use verified absolute raw GitHub URLs. Confirm every referenced image exists, is committed, and matches the item or recipe. Remove outdated images.
- Item sprites use the real texture from the add-on or an authoritative vanilla source.

### Diagram rules

- Build diagrams programmatically from the actual recipe JSON, the add-on's real result texture, and vanilla textures from Mojang's [Bedrock Samples](https://github.com/Mojang/bedrock-samples) (checked out at `/root/bedrock-samples/resource_pack/textures/`). The recipe JSON is authoritative for ingredients, quantities, result, count, and shaped/shapeless behavior. Never change a recipe to fit an image.
- **Board reference:** `scripts/CRAFTING_TABLE.svg` is the only authorized reference, rendered through the shared `scripts/crafting_template.py`, which reads slot positions from the SVG's ids (`slot-0` to `slot-8` in row-major order, `slot-N-fill`, `output`, `output-fill`, `arrow`). Any PNG export is derived from it and never a separate reference. Never use `CRAFTINGBOARD.PNG`, screenshots, hand-drawn boards, or remembered interfaces. If the SVG is missing or unreadable, stop and report it.
- Always show the full 3x3 grid. Shaped recipes keep exact row/column placement and empty cells; shapeless ingredients fill cells in row-major order. Never flatten to a list. Show quantities and the output count in the SVG's output slot.
- Colors: take every color (background, slot fill, edges, arrow) from `scripts/CRAFTING_TABLE.svg`. Do not hardcode board colors in a generator, and do not leave the background transparent.
- Style: plain vanilla-style gray UI, crisp nearest-neighbor pixel art, consistent icon size, precise alignment. No ornate frames, gradients, glow, labels, or emojis.
- Present one diagram per row at the SVG's native 400x222 size.

### Textures

- Use inventory-style item sprites, never cropped world textures. If only block-face textures exist, build a small isometric cube from verified matching faces (top and side); never stretch one face.
- **Source order for vanilla textures and icons:**
  1. Bedrock Samples (see the `checkrm` skill) is the primary source for vanilla names, identifiers, and textures.
  2. The [Minecraft Wiki](https://minecraft.wiki/) is the approved reference for icons and assets. Use it to confirm what an item or block icon should look like, to confirm the official display name and edition availability, and as a **fallback image source only when Samples has no usable inventory-style sprite** (for example, cube-style block icons or items whose texture cannot be mapped).
  3. No third-party packs, guessed filenames, or approximate icons.
- **Using the Minecraft Wiki as an image source:**
  - Look sprites up by the Wiki name, not the identifier: `Invicon_<Title_Case_Name>.png` for inventory renders and `ItemSprite_<lowercase-hyphenated-name>.png` for flat sprites.
  - Open the image's file page first and confirm its license and attribution. Wiki text and most images are community content under their own license (CC BY-NC-SA 3.0 unless the file page says otherwise), plus Mojang's asset terms.
  - Record every Wiki-sourced image (file page URL, license, date retrieved) in the generator's header comment or in `scripts/ASSET_SOURCES.md`, and add attribution to the project's `DESCRIPTION.md` when the image is published.
  - Prefer Samples-derived sprites whenever both are available. Do not bulk-copy Wiki images or large blocks of Wiki text into the repository.
  - If network policy blocks `minecraft.wiki`, report it and fall back to Samples. Do not route around the block.
- Inspect the add-on's whole recipe directory first and build an explicit ingredient-to-texture mapping for every ingredient. Filenames often differ from item IDs (for example, Enchanted Golden Apple uses the golden apple texture), and files may be under `textures/items/` or `textures/blocks/`. Verify each path exists and depicts the correct item.
- Never substitute another icon or skip an ingredient. Report all unresolved ingredients together and stop.

### Generators and workflow

- Keep generators in `scripts/`. They must fail clearly if the Samples pack, a texture, or a recipe file is missing.
- Register every generator in `.github/workflows/generate-recipe-images.yml`: add its path to `push.paths`, add an explicit run step, and stage its output in the commit step. Keep `workflow_dispatch` enabled.
- The workflow checks out Bedrock Samples, installs Pillow, runs generators, and commits PNGs with `[skip ci]`. It reruns when recipe JSON, source textures, generators, or the workflow change.
- Keep generated PNGs in the repository; a correct URL does not prove the file exists.
- Do not call images generated or published until the workflow succeeds and the PNGs exist. If a generator fails, fix the first unmapped ingredient at its source and rerun.
- Confirm output item IDs map to the correct custom texture and that referenced filenames match what the generator produces.

### Technical reference

- Use the [Bedrock Wiki](https://wiki.bedrock.dev/) to understand a file format, component, or technique, then verify the exact schema, identifiers, and format version against Bedrock Samples and the current official documentation before writing it into a pack.
- Cite the Bedrock Wiki page in handoff notes when it informed a decision, and note that it is community documentation. Link to it instead of copying its text.

---

## 6. Function Files

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

## 7. OneBlock Scripts

### General use

- A OneBlock script is a general-purpose pack. It must work in any world it is added to and must not depend on a specific world's terrain, database, or settings.
- Anything specific to one project (coordinates, spawn, cleanup, shop access) belongs to that project's own spec, not to these general rules. Dirtbound's spec is at the end of this section as a worked example.
- The three folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/` are convenience delivery targets, not a limit on where a script can be used.

### Workflow

The authoritative world foundations are the direct folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/`. The OneBlock build workflow copies each matching foundation into a temporary staging directory, preserves its valid `level.dat`, integrates the map's current Behavior Pack and Resource Pack, then packages the completed world as a `.mcworld` inside `MCPEDL/maps/<Map-Name>/`.

1. Keep map source packs in `MCPEDL/maps/<Map-Name>/behavior_pack/` and `resource_pack/` (when required), with the project's docs and configuration.
2. Use `Mcpeworlds/` as the only source of world foundations. Do not use old world ZIPs, `Oneblock-assets.mcworld`, `assets/Void_For_Workv2.mcworld`, or a persisted `assets/oneblock-template/` as a substitute. Do not recreate the retired `create-mcpe-world.yml` workflow or `scripts/create_mcpe_world.py`, which depended on a template containing a world database.
3. Preserve the intentional database-free void design: never create, fabricate, borrow, or require `db/CURRENT` or LevelDB data.
4. On relevant source, foundation, builder, or instruction changes, `build-oneblock-variants.yml` automatically builds Creative, Survival, and Hardcore worlds and synchronizes the map README. Manual dispatch remains available.
5. Validate the generated archive structure and pack references. Report structural checks separately from Minecraft gameplay testing.

Creative is the primary and only designated in-game test world. Do not create a separate `.mcaddon` tester package or a `Tester Build/` folder. The map project keeps the source add-ons and its generated `.mcworld` deliveries together; unrelated add-on build workflows must not misclassify this map as a standalone add-on.

### Creating a project from an AI-generated payload

- `GAME_GENERATOR.md` is the instruction file given to an AI agent. The agent first asks which type the user wants (**addon**, **map**, or **script**), then returns a single-line base64 ZIP produced by running code, never written by hand. The ZIP's `project.json` (`{"type": "addon|map|script", "name": "..."}`) carries the type.
- `create-project-from-base64.yml` takes the folder name plus the base64 (or a `.b64` path under `MCPEDL/incoming/`) and runs `scripts/import_project_payload.py`. The importer imports `scripts/build_payload.py`, so the agent-side and repo-side checks are the same code.
- Destinations: addon -> `MCPEDL/new_addons/<Name>/` (the importer writes the `LOCK` markers); map -> `MCPEDL/maps/<Name>/` (the importer writes `oneblock.json`; Creative, Survival, and Hardcore worlds are built in the same run); script -> `MCPEDL/script/<Name>/` (a test world is built, see below).
- The importer validates before writing anything. It rejects unsafe paths, symlinks, world data (`db/`, `level.dat`), nested archives, shipped pack link files, disallowed file types, bad manifests (title `Name (vX.Y.Z)` matching `header.version`, `by AllensCreations` exactly once, matching BP/RP versions, RP dependency), recipes without `AlwaysUnlocked`, and the per-type requirements below. Icons must match the repo copies under `Mcpeworlds/assets/resources_pack/textures/items/` byte for byte.
- Map requirements: `tick.json` lists `void_cleaner` first, `void_cleaner.mcfunction` starts with the required Y=-64 fill line, `oneblock_setup.mcfunction` exists, and the Trader Ledger item, texture entry, and `trader_ledger.png` are present. Add-ons and scripts do not need the void cleaner or the ledger.
- The folder name is typed per run; never hardcode one in a workflow or script. A payload with only `oneblock.json` (no `project.json`) is still accepted as a map.
- When Sections 3, 4, 6, or 7 change, update `GAME_GENERATOR.md`, `scripts/build_payload.py`, and the importer in the same change, then run `scripts/selftest_project_types.py` and `scripts/check_generator_sync.py`. This file wins on any conflict.
- These checks prove structure only. Never claim the add-on, map, script, or world works in Minecraft until tested in game.

### Scripts and test worlds

- A script project is `MCPEDL/script/<Name>/` with `behavior_pack/` (script module, `scripts/main.js`), `resource_pack/`, `project.json`, `test_world.json`, and the documentation files.
- Every script ships the Controller item (`allenscreations:controller`, texture `controller.png`, a 16 x 16 icon kept at `Mcpeworlds/assets/resources_pack/textures/items/controller.png`). Using it opens a form with **Start**, **Restart**, and **End**; the script keeps the state (idle, running, ended) in a world dynamic property. A project may opt out with `"controller": false` in `project.json`.
- `test_world.json` is `{"mode": "Creative", "include_addons": ["Name", ...]}`. Included add-ons are looked up in `MCPEDL/addons/` and `MCPEDL/new_addons/`. `scripts/build_test_world.py` copies `Mcpeworlds/<mode>`, installs the script and every included add-on, links all packs, and writes `<Name> - Test.mcworld` into the project folder. It fails on a missing include, duplicate pack UUIDs, or an unresolved pack dependency. Experiments and achievement state come from the foundation and are not verified.
- `build-test-world.yml` rebuilds test worlds on demand. Add-ons may also carry a `test_world.json`.
- The one-OneBlock-pack-per-world rule applies to maps only; a script test world may link several packs.

### Installing into the world folders

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

### Verification

- Manifest, `tick.json`, and function files are valid and wired correctly (Section 6).
- Each mode folder's installed pack matches the source, and each link entry matches the manifest's UUID and version.
- The Resource Pack dependency UUID resolves, when one exists.
- Script files pass available syntax checks.
- The importer, `build_oneblock_variants_from_template.py` (`verify_archive`), and `build_test_world.py` run these checks when a project is created or rebuilt; `scripts/selftest_project_types.py` exercises all three project types end to end. There is no separate source-validation workflow.
- State precisely what passed. Structural checks never prove Minecraft loaded the world or that progression works.

### Map README

- Download-focused. Link Creative, Survival, and Hardcore only to compiled `.mcworld` files that actually exist in `MCPEDL/maps/<Map-Name>/`, and keep the source version aligned with the current Behavior Pack. The OneBlock build workflow publishes all three archives there after successful structural validation. Do not claim an archive matches the current source unless it was checked. Catalog entries in `MCPEDL/maps/README.md` follow the same rule.

### Example project spec: Dirtbound

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

## 8. Workflows

Workflows in `.github/workflows/`. Roles below come from file names and recent commit messages; read the actual workflow file before editing it or describing what it does.

| Workflow | Role |
| :--- | :--- |
| `auto-version-bump.yml` | Bumps release versions. Must keep manifest titles in the `Name (vX.Y.Z)` format (Section 3). |
| `create-addon-scaffold.yml` | Scaffolds a new add-on with a download-only README and a DESCRIPTION starter. |
| `build-oneblock-variants.yml` | Automatically builds the Creative, Survival, and Hardcore database-free `.mcworld` archives into `MCPEDL/maps/<Map-Name>/` when relevant sources or foundations change; manual dispatch is also available. |
| `create-project-from-base64.yml` | Manual run: decodes a base64 ZIP (type addon, map, or script from `project.json`) into the matching `MCPEDL/` folder and builds the worlds that type needs (Section 7). |
| `build-test-world.yml` | Manual run: rebuilds `<Name> - Test.mcworld` for scripts and add-ons that have `test_world.json`. |
| `apply-generator-upgrade.yml` | Manual run: applies a reviewed upgrade ZIP (new files, deletions listed in `upgrade_manifest.json`); dry run by default. |
| `refresh-build-packs.yml` | Scheduled refresh of projects and rebuild of packs in `builds/`. |
| `generate-recipe-images.yml` | Regenerates recipe diagrams (Section 5). |
| `manage-addon-status.yml` | Manages add-on status. |
| `delete-project.yml` | Deletes a project. |

Retired: `create-mcpe-world.yml` and `scripts/create_mcpe_world.py` (they required a template containing a world database, which conflicts with the database-free design in Section 7). Do not recreate them or reference them from other workflows or docs.

Helper scripts in `scripts/`:

- `check_readme_status.py`: audits README and DESCRIPTION status and relative links (`--fix` generates stub documentation).
- `validate_manifest_titles.py`: the title validator from Section 3.
- `auto_bump_and_build.py`: bumps versions and builds packs. Use `--no-bump` for documentation-only work.
- `crafting_template.py`: shared recipe board renderer.
- `build_oneblock_variants_from_template.py`: builds the three OneBlock world modes from `Mcpeworlds/` and a map's packs (Section 7). Reads `ONEBLOCK_MAP` to build one map.
- `sync_oneblock_map_readmes.py`: synchronizes a map README with the generated `.mcworld` archives.
- `import_project_payload.py`: validates and imports a base64 ZIP into `MCPEDL/new_addons/`, `maps/`, or `script/` (Section 7).
- `build_payload.py`: the agent-side packager and the shared check code the importer uses. Its text is also embedded in `GAME_GENERATOR.md`.
- `build_test_world.py`: builds a script or add-on test world with chosen add-ons (Section 7).
- `selftest_project_types.py`: end-to-end test of all three project types in a throwaway copy of the repo.
- `check_generator_sync.py`: fails when the script embedded in `GAME_GENERATOR.md` differs from `scripts/build_payload.py`.

- Never claim a workflow ran or succeeded unless its run was checked.
- When a rule in this file changes a workflow's behavior (titles, paths, versions), update the workflow in the same change.

---

## 9. Repository Organization

```
MCPE-Curseforges/
├── INSTRUCTIONS.md
├── README_GUIDELINES.md
├── GAME_GENERATOR.md              # Instructions for AI agents: asks addon / map / script, returns base64
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
