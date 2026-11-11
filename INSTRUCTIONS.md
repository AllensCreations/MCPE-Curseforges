# Instructions: Core Repository Policy (v4)

Repo policy, documentation, and audit rules for ALNStudios/MCPE-Curseforges. The AI-agent project generator is `PACK_GENERATOR_INSTRUCTIONS.md`.

| Part | Covers |
| :--- | :--- |
| Part 1 | Core policy: accuracy, versions, manifests, recipes, images, functions, OneBlock, workflows, layout, security, known untested assumptions |
| Part 2 | README, DESCRIPTION, and CHANGELOG rules, attribution, keywords, templates |
| Part 3 | `checkrm` documentation audit workflow, Minecraft Wiki and Bedrock Samples references |

The generator (asks Add-on / Map / Script / Minigame, returns a base64 ZIP built by `scripts/build_payload.py`) is in `PACK_GENERATOR_INSTRUCTIONS.md`. It carries its own copy of the rules it needs, and this file wins on any conflict.

**Precedence.** Part 1 wins on any conflict. Parts 2 and 3 follow Part 1 and never override them. `PACK_GENERATOR_INSTRUCTIONS.md` follows this file and never overrides it. Factual accuracy and the user's requested scope outrank any template. The scripts in `scripts/` enforce these rules; if a script and this file disagree, report the difference to the user and follow this file for documents, the script for what the importer will accept. **Section numbers refer to the Part they appear in**; a reference to another Part names it.

**Which file to read.** Documentation work: Parts 1 (Sections 1 to 2), 2, 3. Build, workflow, or OneBlock changes: Part 1 (Sections 6 to 10). Generating a new add-on, map, or script: `PACK_GENERATOR_INSTRUCTIONS.md`.

### Reply Format (strict: every repo edit, update, or file request)

```
[SYSTEM_CONFIG]
Mode: Direct Execution
Token_Efficiency: Maximum
Rules: no greeting, intro, outro, offers, or restating the request. High technical accuracy.
```

Output ONLY these three sections, in this order, with these exact headings:

1. **File Needed:** path of each file to create or edit (repo-root-relative).
2. **Changelog:** bulleted, brief summary of changes made.
3. **Termux Script:** ONE fenced `bash` block: the run command for the `.sh` (named per the Shell script file names rule; the script holds every change, see Section 1 and the workflow AI instructions).

- Nothing before, between, or after these sections.
- Never rename, merge, reorder, or skip a section. Nothing to report: write `- None`.
- Versions are `X.Y.Z` only. NEVER `X.Y.Z.A`.
- Exceptions: (1) generator build replies use `PACK_GENERATOR_INSTRUCTIONS.md` Section 11; (2) one question, one line, only when an unresolved choice could materially affect gameplay, compatibility, distribution, data loss, or versioning.

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
- **Shell script file names.** Any `.sh` handed to the user (including a command given because you cannot run code): `(Repofilename)_(Version)_(Rand).sh`. `Repofilename` = project/folder/file the script changes, no extension, no spaces (hyphens). `Version` = that item's new `X.Y.Z` (Update: Z+1; Beta: Y+1, Z=0; Release: X+1, Y=Z=0) or the instruction file's version (e.g. `v4`). `Rand` = at least 5 random lowercase letters/digits, fresh every time (e.g. `head -c 200 /dev/urandom | tr -dc 'a-z0-9' | head -c 6`), never reused from an earlier reply or existing file. Examples: `Dirtbound_1.2.0_k7q2x.sh`, `INSTRUCTIONS_v4_m4p7z9.sh`. Same name in the reply and in the run command.
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
- Achievement status is one of: **Likely achievement-friendly**, **Not achievement-friendly / may disable achievements**, or **Unknown / needs confirmation**. For every project under `MCPEDL/Addons/`, always use **Likely achievement-friendly** as the pack classification. This does not guarantee that achievements remain enabled in every world or game version; retain any relevant world-setting caveats.
- **Admin commands count.** Functions that need cheats or operator status (`give_controller`, `end_game`, manual setup functions) are optional recovery tools. Using cheats in a world disables achievements in that world, so say this wherever such a function is documented. Keep the required Add-on classification above, but include the caveat.
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

- Every Behavior Pack and Resource Pack manifest title is `Add-on Name (vX.Y.Z)`, for example `Vanilla Quality of Life (v1.3.4)`. Update it whenever the release version changes; release automation must preserve this.
- Put `by ALNStudios` in `header.description` exactly once. Normalize existing descriptions rather than appending duplicates. Keep attribution out of the title.
- Do not change pack UUIDs or world storage keys just to rename a title.
- **Title validator**, run in the release workflow, failing the job on any violation and reporting errors rather than rewriting titles. For every manifest under `MCPEDL/`:
  - exactly one terminal `(vX.Y.Z)` suffix;
  - that version matches `header.version`;
  - no malformed or duplicated suffixes;
  - `behavior_pack/` and `resource_pack/` versions match when both exist.
- Run it for one project with `python3 scripts/validate_manifest_titles.py --project <project-path>`.

#### Build and version behavior

- **One version everywhere: X.Y.Z.** Minecraft Bedrock `header.version` is exactly three non-negative integers, and the repository uses that same `X.Y.Z` in `metadata.version`, `(vX.Y.Z)` manifest titles, changelog headings, package filenames, README links and build snapshots. No fourth component or Alpha channel is supported. Legacy `X.Y.Z.A` maps to `X.Z.A`, and legacy `X.Y.Z` maps to `X.Z.0`, because the old Y represented Alpha, Z represented Beta, and A represented Updates (with omitted A treated as 0).
- **Version roles.** X is the Release generation, Y is the Beta generation, and Z is the Updating counter. An Update increments Z (`1.2.3 -> 1.2.4`); a Beta increments Y and resets Z (`1.2.4 -> 1.3.0`); a Release increments X and resets Y/Z (`1.3.0 -> 2.0.0`).
- **Build synchronization.** Every processed project aligns all source manifests (BP, RP and other packs) to one highest X.Y.Z version: `header.version`, `metadata.version`, terminal `(vX.Y.Z)` title suffix, module versions and same-project BP/RP dependency versions. Pack UUIDs are never changed. The build fills `metadata.authors` (`ALNStudios`) and optional `metadata.license`.
- **Build snapshots.** Each build creates or refreshes `builds/<pack>/versions/V<X.Y.Z>/` with packages, `source.zip`, `source.sha256` and `build_info.json`. Existing snapshots are refreshed when source or packages differ. The last 5 version folders are kept.
- **Automatic Update.** With `--bump` or `AUTO_BUMP_MANIFEST=true`, source changes since the current snapshot increment Z in every manifest before rebuilding. Ordinary build automation never increments Y or X; Beta and Release transitions are reserved for the CurseForge publishing task.
- **Package filenames follow the manifest.** Default shape: `<Name> by ALNStudios (VX.Y.Z).<ext>`. The version must remain three-part. Per-pack `metadata.package_filename` or the repository `PACK_FILENAME_TEMPLATE` can customize the title, but must retain `(V{version})` for README link repair.

- **Creator rename.** The creator name is `ALNStudios`. Builds migrate the old name in manifest `header.description` and `metadata.authors`; `python3 scripts/rename_brand.py --apply` migrates every other text file once. Lowercase namespaces such as `allenscreations:` are item identifiers and are never renamed.
- Explicit maintenance: `python3 scripts/migrate_three_part_versions.py` (one-time migration of manifests, changelogs, registry baselines and archival snapshots), then `python3 scripts/manifest_tools.py --project <path> --check|--align|--bump` (or `--all --check`) previews or applies the same alignment/bump the build uses. `sync_manifest_versions.py` remains for dependency and `min_engine_version` maintenance; set `min_engine_version` by hand after looking up the version. **Pack header UUIDs are never regenerated** because changing one breaks existing worlds.
- `scripts/validate_manifest_titles.py` checks manifest title/version consistency during the workflow and fails the job on violations. It also prints non-failing notes for `format_version` other than 2, a missing or `[0, 0, 0]` `min_engine_version`, and missing `metadata.authors`.
- `scripts/sync_project_docs.py` is not part of the build workflow. Update `DESCRIPTION.md` and `CHANGELOG.md` intentionally when preparing a release; do not infer player-facing changes from source filenames.

- `scripts/sync_readme_links.py` remains an explicit README maintenance tool. It finds links by their target and can refresh stale package links; `python3 scripts/sync_readme_links.py --check` previews changes. The build workflow runs it after every build to repair README links.

#### Add-on LOCK marker

- Every project under `MCPEDL/Addons/` has a `LOCK` file at its root beginning with `ALNStudios Add-on Lock v1`.
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

#### Optional platform listing images

- When the user supplies both platform images, add them as clickable links in the `Creator and Permissions` section. Keep the existing creator profile links; the image links should lead to the pack's own CurseForge and MCPEDL listings.
- Store optimized 16:9 JPEGs at `assets/Images/<project-slug>-curseforge.jpg` and `assets/Images/<project-slug>-mcpedl.jpg`. Do not create placeholders or invent listing URLs.
- Link each image with Markdown using the full raw GitHub asset URL and the verified listing URL:

  Replace the example pack name, asset slug, and listing paths with the actual verified values before publishing.

  ```markdown
  [![CurseForge — Pack name](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/pack-slug-curseforge.jpg)](https://www.curseforge.com/minecraft/mc-mods/verified-pack-page)
  [![MCPEDL — Pack name](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/pack-slug-mcpedl.jpg)](https://mcpedl.com/verified-pack-page/)
  ```

- Include the pair only when both images and both listing URLs are available. Preview the result on CurseForge and MCPEDL before using it in published descriptions; if either platform does not render clickable images, do not use the pair there.

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

The authoritative world foundations are the direct folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/`. The OneBlock build workflow copies each matching foundation into a temporary staging directory, preserves its valid `level.dat`, integrates the map's current Behavior Pack and Resource Pack, then packages the completed world as a `.mcworld` inside `MCPEDL/Maps/<Map-Name>/`.

1. Keep map source packs in `MCPEDL/Maps/<Map-Name>/behavior_pack/` and `resource_pack/` (when required), with the project's docs and configuration.
2. Use `Mcpeworlds/` as the only source of world foundations. Do not use old world ZIPs, `Oneblock-assets.mcworld`, `assets/Void_For_Workv2.mcworld`, or a persisted `assets/oneblock-template/`. Do not recreate the retired `create-mcpe-world.yml` workflow or `scripts/create_mcpe_world.py`.
3. Preserve the intentional database-free void design: never create, fabricate, borrow, or require `db/CURRENT` or LevelDB data.
4. On relevant source, foundation, builder, or instruction changes, `build-oneblock-variants.yml` automatically builds Creative, Survival, and Hardcore worlds and synchronizes the map README. Manual dispatch remains available.
5. Validate the generated archive structure and pack references. Report structural checks separately from Minecraft gameplay testing.

Maps ship as worlds generated from the Creative, Survival, and Hardcore foundations. Add-ons, Scripts, and Minigames use the Creative foundation for their test worlds; test-world mode is fixed to Creative. Do not create a separate tester package or `Tester Build/` folder. Unrelated Add-on build workflows must not misclassify a Map as a standalone Add-on.

#### Creating a project from an AI-generated payload

- `PACK_GENERATOR_INSTRUCTIONS.md` is the instruction file given to an AI agent. The agent first asks which type the user wants (**addon**, **map**, **script**, or **minigame**), then returns a single-line base64 ZIP produced by running code, never written by hand. The ZIP's `project.json` (`{"type": "addon|map|script|minigame", "name": "..."}`) carries the type.
- `create-project-from-base64.yml` takes the folder name plus the base64 (or a `.b64` path under `MCPEDL/incoming/`) and runs `scripts/import_project_payload.py`, which imports `scripts/build_payload.py`, so the agent-side and repo-side checks are the same code.
- Destinations and formats: addon -> `MCPEDL/Addons/<Name>/` (`.mcaddon`, Creative test world; importer writes `LOCK`); map -> `MCPEDL/Maps/<Name>/` (`.mcworld`; importer writes `oneblock.json`, then Creative, Survival, and Hardcore worlds are built); script -> `MCPEDL/Script/<Name>/` (`.mcpack`, Creative test world, no Controller); minigame -> `MCPEDL/Minigame/<Name>/` (`.mcaddon`, Controller item and Creative test world).
- The importer validates before writing anything. It rejects unsafe paths, symlinks, world data (`db/`, `level.dat`), nested archives, shipped pack link files, disallowed file types, bad manifests, recipes without the required unlock, and the per-type requirements below. Icons must match the repo copies under `Mcpeworlds/assets/resources_pack/textures/items/` byte for byte.
- Map requirements: `tick.json` lists `void_cleaner` first, `void_cleaner.mcfunction` starts with the required Y=-64 fill line, `oneblock_setup.mcfunction` exists, and the Trader Ledger item, texture entry, and `trader_ledger.png` are present. Add-ons, Scripts, and Minigames do not need the void cleaner or ledger.
- The folder name is typed per run; never hardcode one in a workflow or script. A payload with only `oneblock.json` (no `project.json`) is still accepted as a map.
- When Sections 3, 4, 6, or 7 change, update `PACK_GENERATOR_INSTRUCTIONS.md`, `scripts/build_payload.py`, and the importer in the same change, then run `scripts/selftest_project_types.py`. This file wins on any conflict.
- These checks prove structure only. Never claim the add-on, map, script, or world works in Minecraft until tested in game.

#### Scripts and test worlds

- A Script project is `MCPEDL/Script/<Name>/`, contains a script Behavior Pack and Creative `test_world.json`, and ships as `.mcpack`.
- A Minigame project is `MCPEDL/Minigame/<Name>/`, contains Behavior and Resource Packs plus Creative `test_world.json`, and ships as `.mcaddon`.
- Every Minigame ships the Controller item (`allenscreations:controller`, texture `controller.png`, a 16 x 16 icon kept at `Mcpeworlds/assets/resources_pack/textures/items/controller.png`). Using it opens a form with **Start** and **How to play**, and **End Game** takes the place of **Start** while a game is running; the script keeps the state (idle, running, ended) in a world dynamic property. Minigames cannot opt out.
- Only the host or an operator receives and can use the Controller. **Start** works while no game is running. While a game is running the first button reads **End Game** instead, asks to confirm, then calls `endGame()`; it needs no cheats. **How to play** is always the second button and opens a page with the rules and a Back button. The game also ends through its own win or lose logic, which calls `endGame()`.
- **The Controller is kept while a game runs**, so **End Game** stays reachable. A script may opt back into the old behavior with `consumeOnStart: true` in `registerController`: Start then consumes the first Controller found unless the player is in Creative, and **End Game** is only reachable by a host who still carries one. The host or operator receives a Controller on every spawn (including after death) when they carry none, and when the game ends the script gives a fresh one if they have none.
- **Stuck-state recovery.** The game state must not be able to stay `running` forever. On world load, a Minigame script that cannot restore a live game must reset the state to `idle` and give the host or operator a Controller. `give_controller.mcfunction` and `end_game.mcfunction` ship with every Controller Minigame but need cheats, so they are a last resort and never the only recovery path.
- `test_world.json` is `{"mode": "Creative", "include_addons": ["Name", ...]}`. Included add-ons are looked up only in `MCPEDL/Addons/`. `scripts/build_test_world.py` copies the Creative foundation, installs the project and any included add-ons, links all packs, and writes `<Name> - Test.mcworld` into the project folder. It fails on a missing include, duplicate pack UUIDs, or an unresolved pack dependency. Experiments and achievement state come from the foundation and are not verified.
- `scripts/build_test_world.py --project <folder>` (run by `create-project-from-base64.yml`) rebuilds Creative test worlds for Add-ons, Scripts, and Minigames. Add-ons may omit `test_world.json`; Script and Minigame payloads require it.
- The one-OneBlock-pack-per-world rule applies to maps only; test worlds may link several packs.

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
- The importer, `build_oneblock_variants_from_template.py` (`verify_archive`), and `build_test_world.py` run these checks when a project is created or rebuilt; `scripts/selftest_project_types.py` exercises all four project types end to end.
- State precisely what passed. Structural checks never prove Minecraft loaded the world or that progression works.

#### Map README

- Download-focused. Link Creative, Survival, and Hardcore only to compiled `.mcworld` files that actually exist in `MCPEDL/Maps/<Map-Name>/`, and keep the source version aligned with the current Behavior Pack. Do not claim an archive matches the current source unless it was checked. Catalog entries in `MCPEDL/Maps/README.md` follow the same rule.

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
| `auto-version-bump.yml` | Build Changed Packs & Sync Catalogs. Uses X.Y.Z everywhere: Update increments Z, Beta increments Y/reset Z, Release increments X/reset Y/Z. The first run executes `scripts/migrate_three_part_versions.py`, maps legacy X.Y.Z.A to X.Z.A and legacy X.Y.Z to X.Z.0, synchronizes every manifest/changelog/registry baseline, and archives old snapshots under `legacy_versions/`. Version-tooling changes trigger a full catalog rebuild without auto-bumping every project. Rebuilds packages and `builds/<pack>/versions/V<X.Y.Z>/` snapshots, syncs project/category/builds/root/OneBlock READMEs and download links, refreshes changelog views, and audits README status. Normal updates increment Z only when `bump_on_change` or `AUTO_BUMP_MANIFEST=true` is enabled. Runs on relevant pushes to main, after successful publishing, daily, and on manual run. A report-only step verifies snapshots. Manifest titles stay `Name (vX.Y.Z)` (Section 3). |
| `remake-docs.yml` | Remakes README, DESCRIPTION, and CHANGELOG for all projects or one (`standardize` keeps text, `rebuild` regenerates add-on docs). Dry run and pull request by default. |
| `build-oneblock-variants.yml` | Builds the Creative, Survival, and Hardcore database-free `.mcworld` archives into `MCPEDL/Maps/<Map-Name>/`. |
| `create-project-from-base64.yml` | Manual run: decodes a base64 ZIP into the matching `MCPEDL/` folder and builds the worlds that type needs. `commit_mode` defaults to `pull_request`; `direct` pushes straight to the branch. |
| `generate-recipe-images.yml` | Regenerates recipe diagrams (Section 5). |
| `ci.yml` | Pull-request checks: Python syntax, manifest titles, manifest versions/UUIDs/dependencies (`check_manifest_versions.py`), dropdown sync (advisory), tests, and the project pipeline self-test (`selftest_project_types.py --fake-foundation`). |
| `register-curseforge-id.yml` | Manual run, once per pack: saves the CurseForge project ID in `builds/Curseforge_IDs.json` and refreshes the publish dropdown (the dropdown edit needs the `WORKFLOW_PAT` secret). |
| `auto-version-bump.yml` (task `publish`) | Manual run, the only CurseForge upload path. Beta increments Y and resets Z; Release increments X and resets Y/Z. Only Beta and Release are publish channels. Update increments Z through normal build automation. All changelog, manifest, metadata, title, package and snapshot versions use X.Y.Z. CurseForge upload names use the same three-part version. Registry stores `last_published_version` and `last_release_version`; legacy Alpha fields are discarded. |
| `delete-project.yml` | Deletes a project. |
| `collect-ai-review-files.yml` | The one workflow for AI hand-off (it replaces the old export workflow). Empty paths: bundles the instruction file, scripts, workflows, and icon hashes as `ai-review-bundle.zip`. With paths: one Markdown export (index, AI instructions, file contents) in a zip named `(X.Y.Z) Filename.zip` after the first folder and its latest changelog version. It also rebuilds `changelog_views/` with `scripts/build_changelog_views.py` on every run (optional `commit_changelog_views` saves them to the repo). |

Retired, do not recreate or reference: `update-min-version.yml`, `scripts/update_min_version.py`, `create-addon-scaffold.yml`, `test-crafting-template.yml`, `create-mcpe-world.yml`, `scripts/create_mcpe_world.py`.

Helper scripts in `scripts/` (read the script for exact options):

- `check_readme_status.py` (also `--remake standardize|rebuild`, `--check`), `remake_docs.py`, `sync_readme_links.py` (`--check` previews, `--strict` fails on broken links), `check_manifest_versions.py`, `sync_manifest_versions.py` (`--check` reports without writing, `--verify-only` runs the checker on the selected projects), `sync_project_docs.py` (DESCRIPTION heading and CHANGELOG entry; `--check` reports without writing), `validate_manifest_titles.py`, `auto_bump_and_build.py` (`--all`, `--project`, `--base`, `--bump`, `--verify`), `manifest_tools.py` (manifest alignment, patch bump, `metadata.authors`, source hash; tested by `test_manifest_tools.py`), `sync_dispatch_choices.py`, `crafting_template.py`, `build_oneblock_variants_from_template.py` (reads `ONEBLOCK_MAP`), `sync_oneblock_map_readmes.py`, `import_project_payload.py`, `build_payload.py`, `build_test_world.py`, `delete_project.py`, `ensure_recipe_unlocks.py`, `git_push_retry.py` (rebase-and-push with retries for workflows that write to the branch), the recipe image generators, `selftest_project_types.py`. `tests/test_crafting_template.py` is run by CI.
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
│   ├── Addons/<Addon-Name>/
│   ├── Maps/<Map-Name>/
│   ├── Script/<Project-Name>/
│   ├── Minigame/<Project-Name>/
│   ├── incoming/
└── builds/<Name>/
    ├── build_info.json      (latest build: manifest + changelog version, hashes)
    └── versions/V<x.y.z.a>/   (packages, source.zip, source.sha256, build_info.json; refreshed in place when the source changes, last 5 kept)
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
- **Generated docs** must pass the documentation checks in `build_payload.py` (messages starting with `DOC:`). They are failures, not warnings, so a payload that deviates from the templates is rejected.

---

### 11. Known Untested Assumptions

Treat these as open until confirmed in game, and do not state them as fact in documentation.

1. **Void cleaner chunk loading.** Whether the Y=-64 fill succeeds for a player spawning in a fresh void world, and whether the conditional tag fix in Section 7 retries correctly.
2. **Host permissions.** That the world host is reported as an Operator by `playerPermissionLevel` with cheats off, so the Controller reaches the host on a normal (achievement-eligible) world.
3. **`isOp()` availability.** That `isOp()` is absent in the 2.x `@minecraft/server` module, which is why the Controller uses a helper. Re-check against the current stable module whenever the version changes.
4. **Controller handling.** That keeping the Controller while a game runs, giving it back on respawn, the End Game confirm form, and the `consumeOnStart: true` option behave correctly across rejoin, death, and world reload. The logic was exercised with mocked Minecraft modules, not in the game.
5. **Achievement impact.** That shipped functions and the Controller do not disable achievements unless an admin command is actually run.
6. **Foundation settings.** The experiment and achievement state of each `Mcpeworlds/` foundation.

---

## Part 2: README, DESCRIPTION, and CHANGELOG Guidelines

All documentation rules, player-facing writing, creator links, attribution, and templates. Part 1 still applies in full, wins on any conflict, and its accuracy rules govern everything written here.

### 1. File Roles

> **Uniform structure.** Every project `README.md` is a version-free download landing page: title, current package format and direct download, three installation steps, and a link to `DESCRIPTION.md`. `DESCRIPTION.md` holds the full product description and never includes the add-on's release version in its title. Release versions belong in manifests and `CHANGELOG.md`; verified Minecraft compatibility versions may remain in `DESCRIPTION.md`.

| File | Purpose |
| :--- | :--- |
| Project `README.md` | Download landing page: name, current package format and direct `.mcaddon`, `.mcpack`, or `.mcworld` link (or catalog link), short installation steps, and link to `DESCRIPTION.md`. No release version. |
| Project `DESCRIPTION.md` | Full product page: overview, features, usage, recipes, compatibility, achievement/experiment status, creator links, attribution, search keywords. No release version in the title. |
| `CHANGELOG.md` | Concise, player-visible changes only. |
| Root and category catalogs | Project lists with version, source, and download links. May use compact tables. |

- **Every project type:** the README is the download and installation page; the DESCRIPTION is the product page. Before replacing a long README, preserve its verified player-facing content in `DESCRIPTION.md`. Never lose verified information or duplicate full descriptions across both.
- Catalogs are the download source of truth:
  - Add-ons: `MCPEDL/Addons/README.md#available-add-ons` (`.mcaddon`)
  - Maps: `MCPEDL/Maps/README.md#available-maps` (`.mcworld`)
  - Scripts: `MCPEDL/Script/README.md#available-scripts` (`.mcpack`)
  - Minigames: `MCPEDL/Minigame/README.md#available-minigames` (`.mcaddon`, Controller item)
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
- Do not claim "zero lag", universal multiplayer or Realms compatibility, achievement preservation, or "no experimental features" without evidence for that exact claim. The one exception is the add-on Achievements line in DESCRIPTION.md, which always reads "Likely achievement-friendly." per the template (Part 2, Section 6), with any cheats or world-setting caveat kept.
- Where a function or command that needs cheats is mentioned, say it needs cheats and that using cheats disables achievements in that world.

### 3. Layout and Platform Formatting

- Documentation must render cleanly on GitHub, CurseForge, MCPEDL, and Planet Minecraft.
- No Markdown tables in project READMEs or DESCRIPTIONs. Use `### Feature Name` cards with short bullets (`- **What Happens**: ...`). Catalogs may use tables.
- Paragraphs of 3-4 sentences at most. Avoid LaTeX notation; use `->` or a Unicode arrow.
- **No badges and no images in any project README** (add-ons, maps, scripts). Every project `DESCRIPTION.md` must include the two Minecraft Bedrock and Format badges shown in Part 2's template; do not add other badges. Other DESCRIPTION images may only be requested item sprites, crafting recipe diagrams, or the paired clickable platform listing images described in Part 1, Section 5. Release versions are not shown in project README or DESCRIPTION titles; compatibility versions belong only in verified compatibility details. The one exception is the generated "Collection Size" badge in the root `README.md`, written by `auto_bump_and_build.py` and `delete_project.py`; do not hand-edit it and do not copy it into other files.
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

- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.
```

### 5. Search & Discovery Keywords

Every add-on `DESCRIPTION.md` ends with a keyword section built from its real features, not generic filler: general anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `ALNStudios`), feature anchors from the description, and gameplay anchors (such as `survival QoL`, `achievement friendly MCPE`) only if verified.

```markdown
---

## Search & Discovery Keywords

Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [feature 1], [feature 2], [item or mob name], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.
```

### 6. Templates

**Strict template rule (enforced).** `scripts/doc_template.py`, run by `build_payload.py` and the importer, fails the build on any deviation from the project README, DESCRIPTION, and CHANGELOG templates. Follow the matching template below exactly for every `README.md`, `DESCRIPTION.md`, and `CHANGELOG.md` you write or update: same headings, same heading text, same order, same labels, same list and bullet format. Do not add, remove, rename, merge, or reorder sections, and do not add boilerplate, extra notes, or text outside the template. Replace every `[placeholder]` and `verified-...` marker with verified content and leave none behind. Package installation text may vary for `.mcworld` files, and multiple verified world variants may be listed together. Factual accuracy and the user's requested scope still outrank the template.

**Project README.md**

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

Use a verified direct package URL when one exists; otherwise link the official category catalog. Keep project READMEs at 24 non-empty lines or fewer, use the package's actual format (`.mcaddon`, `.mcpack`, or `.mcworld`), and link to `DESCRIPTION.md`. Do not show the release version in the README. For `.mcworld`, the final installation step tells players to open the imported world. When a map offers multiple verified world variants, preserve all of those links.

**Project DESCRIPTION.md**

```markdown
# [Pack Name] — [Clear, factual subtitle]

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**[Short player-facing tagline]**

> [A concise, factual pitch: what players can do and what makes the experience useful or distinct.]

## Overview

[Explain the core gameplay loop and how the pack changes the player's experience.]

## Key Features

### [Feature Name]
- **What Happens**: [Player-facing behavior, using normal Minecraft names.]
- **How It Works**: [Optional verified detail, only when it helps players understand the feature.]

Add separate feature cards for meaningful mechanics. Put relevant item lists, mob rosters, and verified crafting details inside the matching card; omit sections the pack does not need. Keep crafting diagrams or item sprites only when they help explain a real feature.

## How to Use

[How players install, activate, craft, or use the pack, with verified requirements.]

## Compatibility

- Minecraft Bedrock Edition: [verified minimum version, only if verified]
- Experimental features: [verified status]
- Achievements: Likely achievement-friendly. [For Add-ons; use a factual status for other pack types.]
- Verification: [source created / package built / in-game tested; never conflate them]

## Creator and Permissions

- Creator: ALNStudios
- Profiles: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

When both listing images and verified pack-page URLs are available, place the paired clickable CurseForge and MCPEDL images here. Keep the profile links above as text links.

## Guidelines and Attribution

[Attribution block.]

---

## Search & Discovery Keywords

[Keywords.]
```

Use this as the visual structure: a clear title and tagline, a short highlighted pitch, scannable feature cards, then practical compatibility and creator details. Keep `DESCRIPTION.md` in portable Markdown rather than copying the reference's custom HTML/CSS or spoiler wrappers; rendering must remain clear on CurseForge, MCPEDL, and GitHub. Do not put a release version in the title, and do not add unverified features, compatibility promises, or placeholder images.

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
6. **Images, badges, links.** README.md files contain no images and no badges. Every DESCRIPTION.md includes the two exact badges in its template, with no additional badges. Other DESCRIPTION.md images are limited to requested item sprites, crafting diagrams, and (when both images and actual listing URLs are provided) the paired clickable CurseForge/MCPEDL listing images described in Part 1, Section 5. Confirm every asset exists, use absolute raw GitHub URLs, and verify every link destination. Leave no placeholders.
7. **Synchronize catalogs and builds.** Check whether the project appears in its category catalog, the root README, and the builds README. Update only relevant entries, search first to avoid duplicates, and keep established ordering. Inspect any build script before running it. A known command is `python3 scripts/auto_bump_and_build.py --project "<Project-Name>"`. The builder never changes manifest versions. Never claim a build or sync completed if it failed or was not run.
8. **Verify.**
   1. Re-read the whole edited file, and check headings, lists, and links.
   2. Confirm each documented feature has source evidence and that no verified content was lost.
   3. Run `python3 scripts/validate_manifest_titles.py --project <project-path>` when applicable.
   4. Run `python3 scripts/check_readme_status.py` again. Expect `0` needing update and `[LINK INTEGRITY] All relative links valid`.
   5. Check the add-on LOCK marker (Part 1, Section 3) for projects under `MCPEDL/Addons/`.
   6. Review the final diff for scope. If a check was not run, say so.
9. **Report.** State briefly: projects audited or updated; files changed; commands run and results; missing assets, unresolved links, or unverifiable information; remaining projects needing attention. Never report success for a check that was not run or did not pass.

**Remaking documentation in bulk.** `python3 scripts/check_readme_status.py --remake standardize --all --check` previews, and the same command without `--check` writes. `standardize` keeps existing product text: it refreshes project READMEs as version-free download pages, removes release versions from DESCRIPTION titles, fixes structure (By line, Compatibility lines, Creator links, attribution, keywords), and adds a missing CHANGELOG entry. `--remake rebuild --project <Name>` replaces the project's DESCRIPTION and README with generic text built from source files; `--all` needs `--confirm-rebuild`. Added defaults (Verification, Achievements, Experimental features) are conservative placeholders and generated changelog entries are generic, so replace them with verified facts. The workflow `remake-docs.yml` runs the same thing with a dry run and a pull request.

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
