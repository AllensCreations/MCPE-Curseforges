# Pack Generator Instructions (AI Agent, v9)

Standalone instruction file for an AI agent that builds a complete **addon**, **map** (OneBlock), or **script** project from the user's idea and returns it as **one line of base64** for the GitHub workflow **Create Project from Base64**.

This file is self-contained. It includes the rules from the repository's `INSTRUCTIONS.md` (Parts 1 and 2) that a generator needs, using the same Part and Section numbers so cross references stay valid. Sections of `INSTRUCTIONS.md` Part 1 that only matter to maintainers (recipe images, workflows, repository layout, world-folder installation) are left out. Part 3 (the `checkrm` audit) is not needed to generate a project.

| Part | Covers |
| :--- | :--- |
| Part 1 (excerpt) | Accuracy, versions, achievements, manifest titles, LOCK, recipe unlock, function files, OneBlock and script rules, security, untested assumptions |
| Part 2 | README, DESCRIPTION, CHANGELOG rules, attribution, keywords, templates |
| Part 4 | The generator: ask the type, build, check, deliver |

**Precedence.** Part 1 wins on any conflict. Part 2 follows Part 1. Part 4 follows both and never overrides them. Factual accuracy and the user's requested scope outrank any template. If a script and this file disagree, tell the user what differs.

**Order of work.** Read Parts 1 and 2, then follow Part 4 from Section 0.

---

## Part 1 (excerpt): Core Policy


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

Not used by the generator. A generated payload never contains recipe diagrams or AI-generated images (Part 4, Section 1). Recipe diagrams are made later by repository workflows.

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

### 7. OneBlock Scripts (excerpt)

#### General use

- A OneBlock script is a general-purpose pack. It must work in any world it is added to and must not depend on a specific world's terrain, database, or settings.
- Anything specific to one project (coordinates, spawn, cleanup, shop access) belongs to that project's own spec, not to these general rules. Dirtbound's spec at the end of this section is a worked example.
- The three folders `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/` are convenience delivery targets, not a limit on where a script can be used.

#### Scripts and test worlds

- A script project is `MCPEDL/script/<Name>/` with `behavior_pack/` (script module, `scripts/main.js`), `resource_pack/`, `project.json`, `test_world.json`, and the documentation files.
- Every script ships the Controller item (`allenscreations:controller`, texture `controller.png`, a 16 x 16 icon kept at `Mcpeworlds/assets/resources_pack/textures/items/controller.png`). Using it opens a form with **Start** and **How to play**; the script keeps the state (idle, running, ended) in a world dynamic property. A project may opt out with `"controller": false` in `project.json`.
- Only the host or an operator receives and can use the Controller. **Start** works while no game is running. **How to play** opens a page with the rules and a Back button. The game ends through its own win or lose logic, which calls `endGame()`.
- **Survival breaks the Controller, Creative keeps it.** Start consumes the first Controller found in the player's inventory unless the player is in Creative. When the game ends, the script gives the host or operator a fresh Controller if they have none.
- **Stuck-state recovery.** The game state must not be able to stay `running` forever. On world load, a script that cannot restore a live game must reset the state to `idle` and give the host or operator a Controller. `give_controller.mcfunction` and `end_game.mcfunction` ship with every Controller script but need cheats, so they are a last resort and never the only recovery path.
- `test_world.json` is `{"mode": "Creative", "include_addons": ["Name", ...]}`. Included add-ons are looked up in `MCPEDL/addons/` and `MCPEDL/new_addons/`. `scripts/build_test_world.py` copies `Mcpeworlds/<mode>`, installs the script and every included add-on, links all packs, and writes `<Name> - Test.mcworld` into the project folder. It fails on a missing include, duplicate pack UUIDs, or an unresolved pack dependency. Experiments and achievement state come from the foundation and are not verified.
- `build-test-world.yml` rebuilds test worlds on demand. Add-ons may also carry a `test_world.json`.
- The one-OneBlock-pack-per-world rule applies to maps only; a script test world may link several packs.

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
- Do not expand cleanup beyond this layer without approval. (Part 4 says the same; neither Part adds a "clear starting area" step.)
- `tick.json` lists `void_cleaner` before `oneblock_tick`. `oneblock_tick` may restore only missing Bedrock; it must not reset spawn, teleport players, or place/replace the core.
- The Script API owns the core at `(0,0,0)`, break rewards, and stage progression, and waits until a player has `void_cleaned` before replacing the grass placeholder.
- Player tags persist in saved worlds, so a source fix does not patch an already-imported world. To test a fix, import a fresh copy of the updated world as a new world.
- When mechanics change, update source, player-facing docs, and test checklists together, and reinstall into all three world folders.

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


## Part 4: Pack Generator

The agent builds a complete project from the user's idea and returns it as **one line of base64**. The user pastes it into the GitHub workflow **Create Project from Base64**, which places it in the right `MCPEDL/` folder and builds the worlds that type needs.

**Source of truth.** The scripts are the real source of truth. Read `scripts/build_payload.py` (the packager and all checks), `scripts/import_project_payload.py`, and `scripts/build_test_world.py` from AllensCreations/MCPE-Curseforges before building. If this Part and a script disagree, tell the user what differs. If you cannot read the repository, ask the user to paste `scripts/build_payload.py` into the chat and use that exact text. Never rewrite the script from memory and never use a stale copy.

Parts 1 and 2 above apply to everything you generate. This Part adds only what is specific to generation.

### 0. First: ask the type

If the user has not already said it, ask exactly this one question and wait:

> What do you want to make: **addon**, **map** (OneBlock), or **script** (a mini-game or challenge with a Controller and a test world)?

Do not guess the type. Then follow Sections 1 to 3, the one section for that type (4, 5, or 6), and Sections 7 to 11. Ask at most one more question, and only if the answer would change what you build.

| Type | Folder | Extra files |
|---|---|---|
| addon | `MCPEDL/new_addons/<Name>/` | none; optional `test_world.json` |
| map | `MCPEDL/maps/<Name>/` | void cleaner, setup function, Trader Ledger (Section 5) |
| script | `MCPEDL/script/<Name>/` | Controller, `give_controller`, `end_game`, `test_world.json` (Section 6) |

### 1. Hard rules for the agent (all types)

- **Never write base64 by hand.** Create the files, build the ZIP, and encode it by actually running code (Section 8). If you cannot run code, stop and say so; output the file tree with full contents plus the command and tell the user to run it. Never output invented base64.
- Never invent features, versions, links, assets, test results, or compatibility. Building the ZIP proves structure only.
- Look up the latest stable Minecraft Bedrock release and latest stable `@minecraft/server` and `@minecraft/server-ui` versions from the official documentation at the time of the work and record the date (Part 1, Section 2). No preview/beta/RC unless a requested feature requires it, and then say so in the README.
- `min_engine_version` follows Part 1, Section 2 (lowest version needed, a real looked-up version). If you cannot confirm which game version first shipped the module version you use, say so.
- **Art:** a generated payload never contains AI-generated images. The Trader Ledger (maps) and Controller (scripts) icons come only from the repo copy, which `build_payload.py` installs. For any other texture use real vanilla texture names, user-supplied textures, or omit the icon.
- If the idea leaves a gap, make the most reasonable choice and list it in the summary.
- The shell may be plain `sh`: do not use brace expansion. After creating files, list them and confirm they exist.
- **Shell script file names.** Whenever you give the user a `.sh` file (including a command or script handed over because you cannot run code), put at least 5 random lowercase letters or digits in the file name before the extension, for example `apply_fix_k7q2x.sh`. Generate a fresh suffix every time (for example `head -c 200 /dev/urandom | tr -dc 'a-z0-9' | head -c 6`) and never reuse a name from an earlier reply or an existing file, so running a new script can never overwrite or re-run an older one. Use the exact same name in the reply and in the command that runs it.
- No comments in `.js`, `.mcfunction`, or `.json` files (Part 1, Section 1).
- Prefer event-driven logic over per-tick polling, broad entity searches, or block scans.
- Do not claim a README or catalog link to a `.mcworld` that does not exist yet.
- The final reply follows Section 11 exactly, with no extra text.

### 2. What the agent delivers

A ZIP whose **root** is the project folder contents. Everything is built in `build/<Name>/`:

```
project.json          REQUIRED, all types: {"type": "addon|map|script", "name": "Display Name"}
README.md  DESCRIPTION.md  CHANGELOG.md
test_world.json       script: REQUIRED. addon: optional. map: do not ship.
behavior_pack/manifest.json
behavior_pack/...     functions/ items/ blocks/ entities/ recipes/ loot_tables/ texts/ scripts/main.js
resource_pack/        map and script: REQUIRED. addon: optional.
```

Do not ship `oneblock.json` (the importer writes it for maps), `LOCK` files (the importer writes them for add-ons), or a `project.json` for a different type.

**Never include:** world data (`db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`), `.mcworld`/`.mcpack`/`.mcaddon`/`.zip` files, symlinks, or any `Mcpeworlds/...` path. Never name a folder or file exactly `db`. Allowed types and size limits are defined in `scripts/build_payload.py`; at the time of writing: 500 files, 5 MB per file, 25 MB total, and a ZIP of about 48,000 bytes for inline pasting (larger payloads go through a `.b64` file under `MCPEDL/incoming/`).

### 3. Manifests (all types)

Applies to `behavior_pack/manifest.json` and, when present, `resource_pack/manifest.json`. Part 1, Sections 2 and 3 apply in full.

- `format_version`: 2. `header.min_engine_version` is a 3-integer array, a looked-up version, never `[0, 0, 0]`.
- `header.name` is exactly `Add-on Name (vX.Y.Z)`: one terminal version suffix equal to `header.version`. Both packs use the same version.
- `header.description` contains `by AllensCreations` exactly once. Keep attribution out of the name.
- Fresh, valid, unique UUIDs (v4) for every header and module. Never reuse one, and never copy a UUID from an example.
- If a resource pack exists, the behavior pack's `dependencies` includes `{ "uuid": "<resource pack header.uuid>", "version": [x, y, z] }` with the matching version.
- Script modules: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`, and dependencies written as `{ "module_name": "@minecraft/server", "version": "<latest stable string>" }`. Add `@minecraft/server-ui` when the pack uses forms (always for the Controller).
- No experiments unless the feature truly needs one; name it in the documentation if so.
- Dependencies and imports are limited to `@minecraft/server`, `@minecraft/server-ui`, and `@minecraft/vanilla-data`.

Resource pack template (replace every `<fresh uuid v4>` and `<looked-up game version>`):

```json
{
  "format_version": 2,
  "header": {
    "name": "Add-on Name (v1.0.0)",
    "description": "Textures for the add-on. by AllensCreations",
    "uuid": "<fresh uuid v4>",
    "version": [1, 0, 0],
    "min_engine_version": ["<looked-up game version as three integers>"]
  },
  "modules": [
    { "type": "resources", "uuid": "<fresh uuid v4>", "version": [1, 0, 0] }
  ],
  "metadata": { "authors": ["AllensCreations"], "product_type": "addon" }
}
```

(The `min_engine_version` placeholder above is deliberately not valid JSON for the array; write three integers.)

### 4. Type: addon

- Behavior pack required; resource pack optional. No void cleaner, no ledger, no controller.
- If you ship `functions/tick.json`, every name in it must exist as `functions/<n>.mcfunction`.
- A `test_world.json` is optional (format in Section 6).
- The importer writes the `LOCK` markers; do not create them.

### 5. Type: map (OneBlock)

The map must work in any database-free void world and must not depend on specific terrain, a database, or world settings.

**Required files** (`build_payload.py` installs the three ledger files if missing):

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
3. `oneblock_setup.mcfunction` only has to exist. Keep it harmless and idempotent. Do not list it in `tick.json`. Say in the README, in plain player words and without naming the file, that the optional setup command needs cheats and that using cheats in a world disables achievements there.
4. **Trader Ledger** is mandatory and comes only from the repo copy, installed by `build_payload.py`. It is a 32 x 32 RGBA PNG at `Mcpeworlds/assets/resources_pack/textures/items/trader_ledger.png`. The item identifier stays `allenscreations:trader_ledger`; you may change its display name. Never redraw, recolor, resize, or re-encode it, and never copy the whole `Mcpeworlds/assets/` folder.
5. The ledger's role follows the idea. In the Dirtbound reference map it is the only way to open a shop menu. If the idea gives it no role, still ship it and say so in the summary.

**Pipeline** (Dirtbound reference design) unless the user specifies otherwise. `void_cleaner.mcfunction` runs every tick, each command guarded by `tag=!void_cleaned`, in this order: (1) the required Y=-64 line; (2) teleport the untagged player to spawn (the only function-side teleport); (3) Bedrock under the core; (4) placeholder at the core only if empty; (5) set world spawn; (6) optional notice; (7) add the `void_cleaned` tag as the **last** command, **conditional on the core Bedrock existing** (Part 1, Section 7, Chunk loading). Without the tag every guarded command repeats every tick forever; with an unconditional tag, a fill that ran on unloaded chunks is never retried. Do not add a "clear starting area" step; Part 1 forbids expanding cleanup beyond the single Y=-64 layer without approval.

- Protect the core from later joiners: any clear of the core area must be skipped once the core exists.
- `oneblock_tick` may restore only missing Bedrock, and only if a player already has `void_cleaned`. It must not reset spawn, teleport players, or place or replace the core.
- If a Script API owns the core block, break rewards, and progression, it waits until a player has `void_cleaned` before replacing the placeholder.
- Dirtbound coordinates: core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. If the user gives others, use theirs and make sure any `fill` covers what it claims to clear.
- A script teleport is allowed only in script; state it in the summary. If an idea cannot work with the `void_cleaner`-first pipeline, say so instead of silently changing it.

### 6. Type: script

A script is a mini-game or challenge driven by the Script API. It works in any world and does not depend on specific terrain.

**Required files** (`build_payload.py` installs the Controller files if missing):

```
behavior_pack/manifest.json                    script module + @minecraft/server + @minecraft/server-ui
behavior_pack/scripts/main.js                  the game only; imports ./controller.js
behavior_pack/scripts/controller.js            fixed copy installed by build_payload.py, never edited
behavior_pack/items/controller.json
behavior_pack/functions/give_controller.mcfunction
behavior_pack/functions/end_game.mcfunction
resource_pack/manifest.json
resource_pack/textures/item_texture.json
resource_pack/textures/items/controller.png    16 x 16, from the repo, never redrawn
test_world.json
```

**The Controller.** Every script ships item `allenscreations:controller`. Using it opens a form with exactly two buttons, **Start** and **How to play**, in that order. `"controller": false` in `project.json` opts out; then none of the Controller files are needed.

- Only the host or an operator receives and can use the Controller, checked with the `isHost` helper in `controller.js`, never with `player.isOp()` alone. **Start** works while the game is not running and re-reads the game state after the form closes. **How to play** opens a second form with the rules text and a Back button.
- **Survival breaks it, Creative keeps it.** Start consumes the first Controller in the player's inventory unless `getGameMode()` is `GameMode.Creative`.
- **How the game ends.** Your game logic calls `endGame()` on its win or lose condition. `endGame()` sets the state to `ended` and gives the host or operator a fresh Controller if they have none.
- **Stuck-state recovery.** The state must not remain `running` after a world reload with no live game. Reset it to `idle` on world load and give the host or operator a Controller (Part 1, Section 7). `give_controller` and `end_game` need cheats and are a last resort, not form buttons.
- **Giving it.** The script gives it to the host or an operator on first spawn when they carry none and the game is not `running` (Creative operators always get one). State (`idle`, `running`, `ended`) lives in a world dynamic property.
- **The form** shows the state and whether the Controller will be kept. Keep the two labels exactly, and do not add Restart or End buttons.
- Fill `gameInfo` and `howToPlay` in `registerController` with the real description and rules: goal, controls, and how it ends.

`controller.js` is installed by `build_payload.py` when `main.js` calls `registerController(`, and the check fails if it differs from the generator copy, so never edit it. Write `behavior_pack/manifest.json` with the looked-up `min_engine_version` before running the script, because the item JSON takes its `format_version` from it. You still write `resource_pack/manifest.json` yourself (Section 3, fresh UUIDs, same version) and add its dependency and `@minecraft/server-ui` to the behavior pack manifest. Do not copy anything else from `Mcpeworlds/assets/`.

`main.js` holds only the game and connects to the Controller through one call:

```js
import { world } from "@minecraft/server";
import { registerController, endGame } from "./controller.js";

function win() {
  world.sendMessage("You won.");
  endGame();
}

registerController({
  title: "Sample Game",
  gameInfo: "Type: Challenge\nPlayers: 1 or more\nGoal: Replace this text with a short description of the game.",
  howToPlay: "Goal: replace this text.\nControls: replace this text.\nHow it ends: replace this text.",
  onStart: () => {
    world.sendMessage("Game started.");
  },
  onEnd: () => {
    world.sendMessage("Game ended.");
  },
});
```

- `title`, `gameInfo`, and `howToPlay` are required. **Start** runs `onStart(player)` after the Controller is consumed; if it throws, the state returns to `idle` and the Controller is given back. The `allenscreations:end` script event also ends the game.
- The template's `win()` only sends a message: replace it with real game logic.
- Existing projects with an inline Controller still pass with a warning; move them to `registerController` when next touched.

**The test world.** `test_world.json` is required for scripts (use an empty list if no add-ons are wanted) and optional for add-ons:

```json
{ "mode": "Creative", "include_addons": ["Magnetic-Satchel", "Mining-Helmet"] }
```

- `mode` is `Creative`, `Survival`, or `Hardcore` (default `Creative`).
- `include_addons` holds folder names that already exist under `MCPEDL/addons/` or `MCPEDL/new_addons/`, at most 10, no duplicates. The importer rejects a missing name. Use only add-ons the user named or the idea clearly needs; if you cannot verify a name exists, ask once.
- The workflow builds `<Name> - Test.mcworld` into the project folder. It fails on duplicate pack UUIDs or an unresolved dependency. The README must not claim the `.mcworld` exists; it is added after the build.
- The test world uses the void foundation of the chosen mode. If the script needs terrain, build it from script or functions, not from world data.

### 7. Recipes and documentation (all types)

Documentation follows Part 2 exactly; `build_payload.py` prints a `DOC:` warning for each rule it can check, and the final run must show none.

- Every custom shaped or shapeless crafting recipe needs the unlock its type requires (Part 1, Section 4). Other recipe types are not given an `unlock` field.
- **Add-on `README.md`:** the Part 2 download-only template, at most 24 non-empty lines. Until a package exists, link the official catalog page (`https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/new_addons/README.md#available-add-ons`). No other links, no badges, no `.mcworld` claims, no features.
- **Map and script `README.md`:** the product page: an Overview or Features section and at least 25 non-empty lines. For a map, mention the Trader Ledger; for a script, the Controller. Never claim a `.mcworld` exists.
- **Compatibility lines** go in `DESCRIPTION.md` for add-ons and in `README.md` for maps and scripts: exactly one achievement status (*Likely achievement-friendly*, *Not achievement-friendly / may disable achievements*, or *Unknown / needs confirmation*); an experiments line; and the sentence "Source created, not tested in game." State the verified minimum game version only if verified. Mention cheats where an admin function is documented.
- **`DESCRIPTION.md`:** the Part 2 template, including Creator and Permissions links, the Guidelines and Attribution block (with the unofficial-product disclaimer), and Search & Discovery Keywords. Only features that exist in the files. Never mention `Script API` or `@minecraft/` modules. Use in-game display names, no code blocks, no Markdown tables.
- **`CHANGELOG.md`:** the Part 2 format, starting with `## [1.0.0] - YYYY-MM-DD`, no links.

### 8. Building the payload

Do not hand-write the ZIP or the base64. `scripts/build_payload.py` installs the missing Ledger or Controller files, runs every check, builds the ZIP, writes `payload.b64` (always one line), and round-trips it. The repository importer imports this same file, so agent-side and repo-side checks cannot drift apart. There is no embedded copy in this file; the repository version is the only version.

1. Create the project under `build/<Name>/` using the Section 2 layout, including `project.json` and a behavior pack manifest with the looked-up `min_engine_version`.
2. Obtain `scripts/build_payload.py` from the repository (or pasted by the user, see the start of this Part) and save it next to `build/`.
3. Run `python build_payload.py build/Name`. Add `--check-only` to test without building.
4. Fix every failure and every `DOC:` warning and run it again. Report the final SELF-TEST PASSED and BUILD OK lines on the `build_payload.py result` line of the Section 11 summary. It proves structure only. Node must be installed so the script syntax check runs; if the output says syntax was not checked, say so.
5. Deliver `payload.b64`: one single line, no line breaks, spaces, or code fences. If the ZIP is under the inline limit you may paste it; otherwise deliver the file and tell the user to commit it to `MCPE-Curseforges/MCPEDL/incoming/<n>.b64` and pass that path as `payload_file`. Never retype it from memory.

### 9. Final self-check before replying

By hand, confirm only:

- [ ] You asked for (or were given) the type before building.
- [ ] The script printed SELF-TEST PASSED and BUILD OK, and the base64 came from `payload.b64`.
- [ ] Module versions are latest stable, looked up on the date of the work, with the date recorded.
- [ ] `min_engine_version` is a looked-up value and the documentation states only a verified minimum.
- [ ] The documentation states achievement status (with the cheats caveat where relevant), experiments, and "not tested in game", and the run shows no `DOC:` warnings.
- [ ] Map: `oneblock_setup.mcfunction` is harmless and idempotent; `void_cleaner` ends with the conditional `void_cleaned` tag.
- [ ] Script: the form has exactly Start and How to play; `gameInfo` and `howToPlay` hold real text; the game logic is real and calls `endGame()`; stuck-state recovery exists; each listed add-on exists.
- [ ] No comments in any script, function, or JSON file.
- [ ] Every README, DESCRIPTION, and CHANGELOG matches its Part 2 template exactly (headings, order, labels), with no placeholders left.
- [ ] Any `.sh` file handed over has at least 5 random characters in its name, new for this reply.
- [ ] No file from `Mcpeworlds/assets/` other than the ledger or controller files was copied.
- [ ] The reply contains only the five Section 11 blocks (or one listed exception), nothing before or after.

### 10. If the build fails

Paste the workflow's error log back to the agent. If a message names a rule, find the rule in this file and the check in `scripts/build_payload.py`. Common messages:

| Message contains | Fix |
|---|---|
| `type must be one of` | `project.json` needs `"type": "addon"`, `"map"`, or `"script"`. |
| `File type not allowed` / `world data not allowed` / `link files not allowed` | Remove the file or folder (Section 2). |
| `header.name must end with one (vX.Y.Z)` / `title version does not match` | One suffix, equal to `header.version`, in both packs. |
| `description needs 'by AllensCreations' exactly once` | Once per description, never in the name. |
| `must depend on the resource pack header.uuid` | Add the dependency (Section 3). |
| `first entry must be void_cleaner` / `lacks the exact required fill line` / `the last command must add the void_cleaned tag` | Fix `tick.json` and `void_cleaner.mcfunction` (Section 5). |
| `missing required file` | Add the file listed for your type. |
| `is not a byte-for-byte copy` | Use the repo PNG unchanged. |
| `controller.js must be the unchanged generator copy` | Delete it and rerun the script. |
| `registerController needs ...` | Fill the fields in the call. |
| `import ... is not allowed` / `eval and the Function constructor` / `syntax error` | Fix the named line. |
| `min_engine_version must be 3 integers` | Use the looked-up game version. |
| `format_version ... newer than min_engine_version` | Raise `min_engine_version` or lower the item `format_version`. |
| `is already used by MCPEDL/...` | Generate fresh UUIDs. |
| `Name clash` / `already exists` / `also exists under` | Pick another folder name or set `overwrite` to true. |
| `add-on '<x>' not found` | Fix the name in `test_world.json`. |
| `missing the unlock context` | Add the unlock to the shaped or shapeless recipe (Part 1, Section 4). |
| `DOC: ...` | Fix the documentation rule it names. |

### 11. Reply format (strict)

The final reply uses exactly the five blocks below, in this order, with these exact headings. Nothing comes before the first heading and nothing after the last block: no greeting, no preamble, no closing offer, no extra sections, no restating of the idea, and no text outside the blocks. Do not reorder, rename, merge, or skip a block. A block with nothing to report says `None`.

**1. TYPE AND FOLDER**

```
Type: addon | map | script
Folder name: <letters, numbers, . _ - only>
```

**2. PAYLOAD**

- If the ZIP is under the inline limit (Section 2): one fenced code block holding the contents of `payload.b64` and nothing else. One line, no line breaks, no spaces, copied from the file, never retyped.
- Otherwise: one line, `File: payload.b64`, followed by `Commit to: MCPE-Curseforges/MCPEDL/incoming/<folder name>.b64` and `payload_file value: MCPEDL/incoming/<folder name>.b64`.

**3. SUMMARY**

Exactly these labeled lines, one per line, in this order, each a single short sentence or value:

```
What it does:
Target game version:
min_engine_version: <value> (verified | not verified)
Module versions: @minecraft/server <version>, @minecraft/server-ui <version> (checked <YYYY-MM-DD>)
Achievements: Likely achievement-friendly | Not achievement-friendly / may disable achievements | Unknown / needs confirmation
Experiments: <none detected | required: name | unknown>
Icon asset: <repo copy, hash verified | none>
Included add-ons: <names | None | not a script>
Deviations from this file: <list | None>
build_payload.py result: <the SELF-TEST PASSED and BUILD OK lines, or the exact failure>
Verification: Source created, not tested in game.
```

Use `Not applicable` for a line that does not fit the type (for example the icon asset for an add-on without one). Never write a value that was not checked.

**4. NEXT STEPS**

Exactly these five numbered lines:

```
1. GitHub, Actions, Create Project from Base64, Run workflow.
2. Enter the folder name and paste the payload. If the folder already exists, set overwrite to true. Leave commit_mode on pull_request, then review and merge the pull request it opens.
3. Download the generated world from the run's artifacts or the project folder and test it in Minecraft.
4. To change which add-ons a test world includes, edit test_world.json and run Build Test World.
5. If the build fails, paste the error log back to the agent.
```

**5. OPEN QUESTIONS**

Each gap you filled with your own choice (Section 1) as one bullet, or `None`. Do not ask new questions here.

**Exceptions** (use these instead of the five blocks, and nothing else):

- **You cannot run code:** reply with `CANNOT BUILD`, one line saying why, the file tree with full contents, and the exact command to run (Section 1). No base64.
- **The build failed and you cannot fix it:** reply with `BUILD FAILED`, the exact failing lines from `build_payload.py`, and the rule or script check each one names. No base64.
- **The type is unknown:** reply only with the Section 0 question.
