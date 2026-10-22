# Repository Instructions

Single source of truth for AllensCreations/MCPE-Curseforges. Specialized skills still apply alongside this file: `.agents/skills/checkrm/SKILL.md` (audit workflow), `.agents/skills/mcpe-readme/SKILL.md` (commercial-but-factual writing), and the Mojang samples skill (vanilla reference assets).

---

## 1. Precedence and Accuracy

- Factual accuracy and the user's requested scope outrank any template. Do not follow conflicting examples blindly.
- Inspect source files before making claims. Ask the user only when an unresolved choice could materially affect gameplay, compatibility, distribution, data loss, or versioning. For ordinary style choices, use the defaults and proceed.
- Never invent features, versions, links, assets, test results, compatibility, achievement support, performance guarantees, or platform behavior. Separate verified facts from assumptions.
- Never claim an in-game test, function execution, or gameplay result unless it was actually tested in Minecraft. Archive, JSON, and syntax checks prove structure only.

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

## 3. Documentation

### File roles

| File | Purpose |
| :--- | :--- |
| Add-on `README.md` | Download landing page: name, verified version, direct `.mcaddon`/`.mcpack` link (or catalog link), package format, short generic import steps, link to `DESCRIPTION.md`. |
| Add-on `DESCRIPTION.md` | Full customer-facing product page: overview, features, usage, recipes, compatibility, achievement/experiment status, creator links, attribution, search keywords. |
| `CHANGELOG.md` | Concise, player-visible changes only. |
| Root and category catalogs | Project lists with version, source, and download links. May use compact tables. |

- A project README contains no features, recipes, compatibility claims, images, creator bios, keywords, or changelog text.
- A new add-on gets both files: a download-only README and a DESCRIPTION starter.
- When updating an older add-on, move verified README content into `DESCRIPTION.md` before replacing the README. Never lose verified information or duplicate full descriptions across both.
- Catalogs are the download source of truth:
  - Existing Add-ons: `MCPEDL/addons/README.md#available-add-ons`
  - New Add-ons: `MCPEDL/new_addons/README.md#available-add-ons`
  - Maps: `MCPEDL/maps/README.md#available-maps`
  - Scripts & Challenges: `MCPEDL/script/README.md#available-scripts`
  - Master builds: `builds/README.md#available-pack-and-map-builds`

### Player-facing writing

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

### Layout and platform formatting

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
- Images: READMEs have none. DESCRIPTIONs may include only item sprites and crafting recipe diagrams, and only when requested or required by the project (Section 6).

### Creator profile links and attribution

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

### Search & Discovery Keywords

Every add-on `DESCRIPTION.md` ends with a keyword section built from its real features, not generic filler: general anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `AllensCreations`), feature anchors from the description, and gameplay anchors (such as `survival QoL`, `achievement friendly MCPE`) only if verified.

```markdown
---

## Search & Discovery Keywords

Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [feature 1], [feature 2], [item or mob name], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
```

### Templates

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

Use a verified direct package URL when one exists; otherwise link the official catalog.

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

## 4. Manifest Title and Creator Attribution

- Every Behavior Pack and Resource Pack manifest title is `Add-on Name (vX.Y.Z)`, for example `Vanilla Quality of Life (v1.3.0)`. Update it whenever the release version changes; release automation must preserve this.
- Put `by AllensCreations` in `header.description` exactly once. Normalize existing descriptions rather than appending duplicates. Keep attribution out of the title.
- Do not change pack UUIDs or world storage keys just to rename a title.
- **Title validator**, run in the release workflow, failing the job on any violation and reporting errors rather than rewriting titles. For every manifest under `MCPEDL/`:
  - exactly one terminal `(vX.Y.Z)` suffix;
  - that version matches `header.version`;
  - no malformed or duplicated suffixes;
  - `behavior_pack/` and `resource_pack/` versions match when both exist.

---

## 5. Recipe Unlock Rule

Every custom crafting recipe must be unlocked by default using the schema its recipe type requires:

```json
"unlock": { "context": "AlwaysUnlocked" }
```

- Formats that use an array take the equivalent form, `"unlock": [{ "context": "AlwaysUnlocked" }]`. Do not mix schemas.
- Compare an existing recipe's type against the Bedrock Samples reference before choosing syntax.
- Do not change ingredients, result, count, station/tags, or shaped/shapeless structure. Do not rely on recipe-book discovery unless the user asks.
- Apply to all new recipes and any existing recipe you touch.

---

## 6. Recipe Images and Item Sprites

### When to create

- Optional. Create diagrams or sprites only when the user requests them or project instructions require them, and only for `DESCRIPTION.md`.
- Never use AI image generation unless the user explicitly asks.
- Use verified absolute raw GitHub URLs. Confirm every referenced image exists, is committed, and matches the item or recipe. Remove outdated images.
- Item sprites use the real texture from the add-on or an authoritative vanilla source.

### Diagram rules

- Build diagrams programmatically from the actual recipe JSON, the add-on's real result texture, and vanilla textures from Mojang's [Bedrock Samples](https://github.com/Mojang/bedrock-samples) (checked out at `/root/bedrock-samples/resource_pack/textures/`). The recipe JSON is authoritative for ingredients, quantities, result, count, and shaped/shapeless behavior. Never change a recipe to fit an image.
- **Board reference:** `scripts/CRAFTING_TABLE.svg` is the only authorized reference, rendered through the shared `scripts/crafting_template.py`. Any PNG export is derived from it and never a separate reference. Never use `CRAFTINGBOARD.PNG`, screenshots, hand-drawn boards, or remembered interfaces. If the SVG is missing or unreadable, stop and report it.
- Always show the full 3x3 grid. Shaped recipes keep exact row/column placement and empty cells; shapeless ingredients fill cells in row-major order. Never flatten to a list. Show quantities and the output count in the SVG's output slot.
- Colors: ingredient slots `#8A8A8A` (matching the SVG), diagram background solid `#8B8B8B`.
- Style: plain vanilla-style gray UI, crisp nearest-neighbor pixel art, consistent icon size, precise alignment. No ornate frames, gradients, glow, labels, or emojis.
- Present one diagram per row at the SVG's native 400x222 size.

### Textures

- Use inventory-style item sprites, never cropped world textures. If only block-face textures exist, build a small isometric cube from verified matching faces (top and side); never stretch one face.
- Bedrock Samples is the only source for vanilla names, identifiers, and textures. No third-party packs, guessed filenames, or approximate icons.
- Inspect the add-on's whole recipe directory first and build an explicit ingredient-to-texture mapping for every ingredient. Filenames often differ from item IDs (for example, Enchanted Golden Apple uses the golden apple texture), and files may be under `textures/items/` or `textures/blocks/`. Verify each path exists and depicts the correct item.
- Never substitute another icon or skip an ingredient. Report all unresolved ingredients together and stop.

### Generators and workflow

- Keep generators in `scripts/`. They must fail clearly if the Samples pack, a texture, or a recipe file is missing.
- Register every generator in `.github/workflows/generate-recipe-images.yml`: add its path to `push.paths`, add an explicit run step, and stage its output in the commit step. Keep `workflow_dispatch` enabled.
- The workflow checks out Bedrock Samples, installs Pillow, runs generators, and commits PNGs with `[skip ci]`. It reruns when recipe JSON, source textures, generators, or the workflow change.
- Keep generated PNGs in the repository; a correct URL does not prove the file exists.
- Do not call images generated or published until the workflow succeeds and the PNGs exist. If a generator fails, fix the first unmapped ingredient at its source and rerun.
- Confirm output item IDs map to the correct custom texture and that referenced filenames match what the generator produces.

---

## 7. Function Files

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

## 8. OneBlock Scripts

### General use

- A OneBlock script is a general-purpose pack. It must work in any world it is added to and must not depend on a specific world's terrain, database, or settings.
- Anything specific to one project (coordinates, spawn, cleanup, shop access) belongs to that project's own spec, not to these general rules. Dirtbound's spec is at the end of this section as a worked example.
- The three folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/` are convenience delivery targets, not a limit on where a script can be used.

### Workflow

You supply a OneBlock script (new or an update). Claude does not build worlds or archives as part of this; `.mcworld` files are compiled into `builds/<Map-Name>/` by `build-oneblock-variants.yml` from the `Mcpeworlds/` folders. Claude:

1. Saves the source in `MCPEDL/maps/<Map-Name>/`: `behavior_pack/`, `resource_pack/` if the Behavior Pack depends on it, `pack_icon.png`, and `README.md`.
2. Installs the pack(s) into all three `Mcpeworlds/` folders.
3. Verifies the result and reports exactly what was checked.

Creative is the primary in-game test world. Do not create a separate `.mcaddon` tester package or a `Tester Build/` folder.

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
- Do not modify `level.dat`, `level.dat_old`, `levelname.txt`, `db/`, or world settings, and never create, fabricate, or borrow a world database. If the Behavior Pack's dependencies are unresolved, stop and report the exact path.

### Verification

- Manifest, `tick.json`, and function files are valid and wired correctly (Section 7).
- Each mode folder's installed pack matches the source, and each link entry matches the manifest's UUID and version.
- The Resource Pack dependency UUID resolves, when one exists.
- Script files pass available syntax checks.
- The `validate-oneblock-source.yml` workflow should run on changes to a OneBlock map under `MCPEDL/maps/` or to `Mcpeworlds/**` and cover the checks above.
- State precisely what passed. Structural checks never prove Minecraft loaded the world or that progression works.

### Map README

- Download-focused. Link the Creative, Survival, and Hardcore worlds only to compiled `.mcworld` files that actually exist in `builds/<Map-Name>/`, and keep the version aligned with the current Behavior Pack. Do not claim an archive matches the current source unless it was checked. Catalog entries in `MCPEDL/maps/README.md` follow the same rule.

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

## 9. Workflows

Workflows in `.github/workflows/`. Roles below come from file names and recent commit messages; read the actual workflow file before editing it or describing what it does.

| Workflow | Role |
| :--- | :--- |
| `auto-version-bump.yml` | Bumps release versions. Must keep manifest titles in the `Name (vX.Y.Z)` format (Section 4). |
| `create-addon-scaffold.yml` | Scaffolds a new add-on with a download-only README and a DESCRIPTION starter. |
| `create-mcpe-world.yml` | Creates and persists the extracted OneBlock world template for future builds. |
| `build-oneblock-variants.yml` | Builds the Creative, Survival, and Hardcore `.mcworld` archives into `builds/<Map-Name>/` and refreshes the map README. |
| `refresh-build-packs.yml` | Scheduled refresh of projects and rebuild of packs in `builds/`. |
| `generate-recipe-images.yml` | Regenerates recipe diagrams (Section 6). |
| `manage-addon-status.yml` | Manages add-on status. |
| `delete-project.yml` | Deletes a project. |

- Never claim a workflow ran or succeeded unless its run was checked.
- When a rule in this file changes a workflow's behavior (titles, paths, versions), update the workflow in the same change.

---

## 10. Repository Organization

```
MCPE-Curseforges/
├── INSTRUCTIONS.md
├── README.md                      # Catalog of active add-ons, maps, scripts
├── scripts/                       # Generators, validators, crafting_template.py, CRAFTING_TABLE.svg
├── .github/workflows/
├── Mcpeworlds/{Creative,Survival,Hardcore}/   # World folders that receive OneBlock scripts
├── MCPEDL/
│   ├── addons/<Addon-Name>/       # behavior_pack/, resource_pack/, README.md, DESCRIPTION.md
│   ├── new_addons/
│   ├── script/<Project-Name>/     # behavior_pack/, pack_icon.png, README.md
│   └── maps/<Map-Name>/           # OneBlock script source: behavior_pack/, pack_icon.png, README.md
└── builds/<Name>/                 # Compiled .mcaddon / .mcpack / .mcworld
```
