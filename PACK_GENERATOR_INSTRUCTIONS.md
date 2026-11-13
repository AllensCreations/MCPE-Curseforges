# Pack Generator Instructions (AI Agent, v20)

Builds a complete **addon**, **map**, **script**, or **minigame** from the user's idea. Returns ONE Termux `.sh` pack script that carries the whole project inside it (as base64). No other file is delivered.

Self-contained for generation. Read ONLY this file for a build task. Maintenance, workflows, audits, recipe images: `INSTRUCTIONS.md`. Numbers (1.x, 2.x, 4.x) refer to this file.

| Part | Covers |
| :--- | :--- |
| 1 (excerpt) | Accuracy, versions, manifests, recipe unlock, functions, security, untested assumptions |
| 2 | README, DESCRIPTION, CHANGELOG rules, templates |
| 4 | Generator: ask type, build, check, deliver, reply |

Precedence: Part 1 wins. Part 2 follows Part 1. Part 4 follows both. `INSTRUCTIONS.md` wins on conflict. Accuracy and requested scope outrank any template. Script and file disagree: tell the user.
Order of work: read Parts 1-2, then Part 4 from 4.0. Unclear request: ask ONE line, then proceed.

---

## Part 1 (excerpt): Core Policy

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
- Package name: `<Shortcut> VX.Y.Z.<ext>`; shortcut (letters and digits only) comes from `scripts/pack_shortcuts.json` by project folder, else the folder name joined. Custom via `metadata.package_filename` or `PACK_FILENAME_TEMPLATE`; MUST contain `V{version}` and no parenthesis.
- Creator name `ALNStudios`. `python3 scripts/rename_brand.py --apply` migrates old name. NEVER rename lowercase namespaces (`allenscreations:`).
- Tools: `python3 scripts/manifest_tools.py --project <path> --check|--align|--bump` (`--all --check`). `sync_manifest_versions.py`: deps and `min_engine_version` maintenance; set `min_engine_version` by hand after lookup. `sync_project_docs.py` NOT in build: edit DESCRIPTION/CHANGELOG deliberately. `sync_readme_links.py [--check]` repairs README links (runs after every build).
- LOCK: every `MCPEDL/Addons/` project has `LOCK` at root starting `ALNStudios Add-on Lock v1`. Importer creates it, build enforces it. Missing/invalid = release-blocking: report path, NEVER call build-ready. Safeguard only, not encryption.

### 1.4 Recipe Unlock
- ALWAYS unlock every custom crafting recipe by default. Shaped = object `"unlock": { "context": "AlwaysUnlocked" }`. Shapeless = array `"unlock": [{ "context": "AlwaysUnlocked" }]`. NEVER mix forms in one recipe. Validators accept either; generator writes these.
- Covers `minecraft:recipe_shaped`, `minecraft:recipe_shapeless` only. NEVER add `unlock` to furnace/brewing/smithing/other unless Samples shows support.
- Validators parse JSON and check `unlock` key. NEVER text search for `AlwaysUnlocked`.
- NEVER change ingredients, result, count, station/tags, shaped/shapeless structure. NEVER rely on recipe-book discovery unless asked.
- Applies to all new recipes and any recipe touched. Check type against Samples first.

### 1.6 Function Files
Paths from repo root. A function file existing != it runs.
- Functions: `<project>/behavior_pack/functions/<name>.mcfunction`. Tick: `functions/tick.json` `values` = names without suffix (`oneblock_tick`).
- Before delivery: 1 inspect real manifest, functions, `tick.json`, install steps, report paths; 2 `tick.json` valid, right dir, names existing function; 3 check syntax, ids, coordinates, deps (scoreboards). NEVER make a score-dependent command the only initial-block path unless init guaranteed; 4 run available JSON/project validation, state what passed; 5 custom item delivered but block missing: diagnose item delivery and function execution separately (pack activation, world links, tick registration, name/path, command errors) BEFORE fallbacks or version bump.
- NEVER claim `tick.json` missing without inspecting installed/packaged copy.

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
1. Void cleaner: Y=-64 fill succeeds for a player spawning in a fresh void world; conditional tag (4.5) retries correctly.
2. World host reports as Operator via `playerPermissionLevel` with cheats off (Controller reaches host on achievement-eligible world).
3. `isOp()` absent in 2.x `@minecraft/server` (Controller uses a helper). Re-check on every module bump.
4. Controller kept while running, returned on respawn, End Game confirm, `consumeOnStart: true` work across rejoin/death/reload. Only tested with mocked modules.
5. Shipped functions and Controller do not disable achievements unless an admin command is run.
6. Experiment/achievement state of each `Mcpeworlds/` foundation.

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

## Part 4: Pack Generator

Agent builds a full project from the user's idea and returns ONE `.sh` pack script (`scripts/make_pack_script.py`). The user runs it in Termux (`bash <file>.sh` creates the project, builds worlds, pushes; `bash <file>.sh stage` only copies it to `MCPEDL/incoming/`) or runs GitHub workflow **Create Project from Base64** with `payload_file` = the `.sh` (the workflow only reads the payload block, it never runs the file).

Source of truth = scripts: `scripts/build_payload.py` (packager + checks), `scripts/doc_template.py`, `scripts/import_project_payload.py`, `scripts/build_test_world.py` from ALNStudios/MCPE-Curseforges. ALWAYS read them before building. Disagreement with this file: tell the user. Repo unreadable: ask user to paste `build_payload.py` + `doc_template.py`, use that exact text. NEVER rewrite a script from memory. NEVER use a stale copy.

### 4.0 Ask the type first
Type unknown: ask exactly this, wait:
> What do you want to make: **addon** (.mcaddon), **map** (.mcworld), **script** (.mcpack), or **minigame** (.mcaddon with the Controller item)?

NEVER guess the type. At most ONE more question, only if the answer changes the build.

| Type | Folder | Extra |
|---|---|---|
| addon | `MCPEDL/Addons/<Name>/` | `.mcaddon`; Creative test world |
| map | `MCPEDL/Maps/<Name>/` | `.mcworld`; Creative, Survival, Hardcore worlds |
| script | `MCPEDL/Script/<Name>/` | `.mcpack`; BP only; Creative test world |
| minigame | `MCPEDL/Minigame/<Name>/` | `.mcaddon`; Controller, RP, Creative test world |

### 4.1 Hard rules
- NEVER write base64 or the `.sh` by hand. Create files in scratch `build/<Name>/`, then RUN `make_pack_script.py` (4.8). Cannot run code: reply `CANNOT BUILD` (4.11). NEVER invent base64.
- Deliver ONLY the one pack `.sh`. NEVER deliver a separate `.zip`, pack file (`.mcaddon`/`.mcworld`/`.mcpack`), `.json`, `.js`, `.b64` or any other file; every file lives inside the `.sh`. `build/` is scratch: never delivered, never committed.
- NEVER invent features, versions, links, assets, results, compatibility. ZIP build proves structure only.
- ALWAYS look up latest stable Bedrock + `@minecraft/server` + `@minecraft/server-ui` at time of work, record date (1.2). NEVER preview/beta/RC unless a requested feature needs it (then disclose in DESCRIPTION). `min_engine_version` per 1.2. Cannot confirm which game version first shipped your module version: say so.
- Art: NEVER AI-generated images. NEVER CurseForge/MCPEDL listing images in the payload (linked by URL from `assets/Images/`). Trader Ledger (maps) and Controller (minigames) icons ONLY from the repo copy that `build_payload.py` installs. Other textures: real vanilla names, user-supplied, or omit.
- Gap in the idea: choose the most reasonable option, state it in DESCRIPTION.md.
- Shell may be plain `sh`: NEVER brace expansion. After creating files, list them, confirm they exist.
- `.sh` names: 1.1 rule (`(Repofilename)_(Version)_(Rand).sh`).
- NEVER comments in `.js`, `.mcfunction`, `.json`. Prefer event-driven logic. NEVER claim a README/catalog link to a `.mcworld` that does not exist yet.
- Every reply = the three 4.11 sections (File Needed, Changelog, Termux Script). NEVER a Summary section.
- Vanilla limit blocks a requested mechanic: follow 4.12.

### 4.2 Delivery layout
ZIP root = project folder contents, built in `build/<Name>/`:
```
project.json          REQUIRED: {"type": "addon|map|script|minigame", "name": "Display Name"}
README.md  DESCRIPTION.md  CHANGELOG.md
test_world.json       script/minigame REQUIRED. addon optional. map: NEVER.
behavior_pack/manifest.json
behavior_pack/...     functions/ items/ blocks/ entities/ recipes/ loot_tables/ texts/ scripts/main.js
resource_pack/        map/minigame REQUIRED. addon optional. script FORBIDDEN.
```
- NEVER ship `oneblock.json` (importer writes for maps), `LOCK` (importer writes for add-ons), another type's `project.json`.
- NEVER include: `db/`, `level.dat`, `world_behavior_packs.json`, `world_resource_packs.json`, `.mcworld/.mcpack/.mcaddon/.zip`, symlinks, `Mcpeworlds/...` or `assets/...` paths. NEVER name a file/folder exactly `db`.
- Limits (see `build_payload.py`): 500 files, 5 MB/file, 25 MB total. Delivery = the one pack `.sh`, nothing else.

### 4.3 Manifests (all types)
`behavior_pack/manifest.json` and `resource_pack/manifest.json` (if present). Part 1 (1.2, 1.3) applies.
- `format_version` 2. `min_engine_version` = looked-up 3-int array, NEVER `[0,0,0]`.
- `header.name` = `Add-on Name (vX.Y.Z)`: one terminal suffix == `header.version`. Both packs same version.
- `header.description` contains `by ALNStudios` exactly once. NEVER in name.
- Fresh unique v4 UUIDs for every header and module. NEVER reuse/copy from examples.
- RP exists: BP `dependencies` include `{ "uuid": "<RP header.uuid>", "version": [x, y, z] }` matching.
- Script module: `"type": "script"`, `"language": "javascript"`, `"entry": "scripts/main.js"`; deps `{ "module_name": "@minecraft/server", "version": "<latest stable string>" }`. Add `@minecraft/server-ui` for forms (always for Controller).
- NEVER experiments unless needed (name in docs). Deps/imports ONLY `@minecraft/server`, `@minecraft/server-ui`, `@minecraft/vanilla-data`.
- RP template (replace every placeholder; run `python3 -m json.tool`):
```json
{
  "format_version": 2,
  "header": {
    "name": "Add-on Name (v1.0.0)",
    "description": "Textures for the add-on. by ALNStudios",
    "uuid": "<fresh uuid v4>",
    "version": [1, 0, 0],
    "min_engine_version": [LOOKED_UP_MAJOR, LOOKED_UP_MINOR, LOOKED_UP_PATCH]
  },
  "modules": [
    { "type": "resources", "uuid": "<fresh uuid v4>", "version": [1, 0, 0] }
  ],
  "metadata": { "authors": ["ALNStudios"], "product_type": "addon" }
}
```

### 4.4 Type: addon
- `.mcaddon`. BP required, RP optional. No void cleaner, ledger, Controller.
- `functions/tick.json` names MUST exist as `functions/<name>.mcfunction`.
- `test_world.json` optional (Creative). NEVER create `LOCK`.

### 4.5 Type: map (OneBlock)
Works in any database-free void world. NEVER depend on terrain, database, world settings.
Required (`build_payload.py` installs the 3 ledger files if missing):
```
behavior_pack/functions/tick.json              {"values": ["void_cleaner", "oneblock_tick"]}  void_cleaner FIRST
behavior_pack/functions/void_cleaner.mcfunction
behavior_pack/functions/oneblock_setup.mcfunction
behavior_pack/items/trader_ledger.json
resource_pack/textures/item_texture.json
resource_pack/textures/items/trader_ledger.png
```
1. `tick.json` valid, non-empty `values`, `void_cleaner` first, every name exists.
2. `void_cleaner.mcfunction` FIRST command, own line, no trailing spaces:
   ```
   execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
   ```
3. `oneblock_setup.mcfunction`: exists, harmless, idempotent. NEVER in `tick.json`. DESCRIPTION says in plain words (no file name) that the optional setup command needs cheats and cheats disable achievements.
4. Trader Ledger MANDATORY, ONLY from repo copy (32x32 RGBA `Mcpeworlds/assets/resources_pack/textures/items/trader_ledger.png`). Identifier stays `allenscreations:trader_ledger`; display name may change. NEVER redraw/recolor/resize/re-encode. NEVER copy the whole `Mcpeworlds/assets/`.
5. Ledger role follows the idea (Dirtbound: only way to open a shop menu). No role: still ship, say so in DESCRIPTION.md.

Pipeline (Dirtbound design) unless user says otherwise. `void_cleaner.mcfunction` runs every tick, each command guarded `tag=!void_cleaned`, order: (1) required Y=-64 line; (2) teleport untagged player to spawn (only function-side teleport); (3) Bedrock under core; (4) placeholder at core only if empty; (5) world spawn; (6) optional notice; (7) add `void_cleaned` tag LAST, CONDITIONAL on core Bedrock existing (`execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned`). Without the tag every guarded command repeats forever; unconditional tag never retries a fill on unloaded chunks. NEVER add a "clear starting area" step.
- ALWAYS skip any core-area clear once the core exists.
- `oneblock_tick`: restores only missing Bedrock, only if a player has `void_cleaned`. NEVER reset spawn, teleport, place/replace core.
- Script API owning the core waits for `void_cleaned` before replacing the placeholder.
- Dirtbound coords: core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. User coords win; every `fill` MUST cover what it claims to clear.
- Script teleport only in script, state it in summary. Idea cannot fit the `void_cleaner`-first pipeline: say so, NEVER silently change it.

### 4.6 Types: script and minigame
Script: standalone BP for general logic. `project.json` type `script`, `behavior_pack/manifest.json`, `behavior_pack/scripts/main.js`, required Creative `test_world.json`. NEVER RP or Controller. Always `.mcpack`.

Minigame: playable challenge driven by a script. `project.json` type `minigame`, BP + RP, required Creative `test_world.json`. Always `.mcaddon`. Uses the Controller.

Required (`build_payload.py` installs Controller files if missing):
```
behavior_pack/manifest.json                    script module + @minecraft/server + @minecraft/server-ui
behavior_pack/scripts/main.js                  the game only; imports ./controller.js
behavior_pack/scripts/controller.js            fixed copy installed by build_payload.py, NEVER edited
behavior_pack/items/controller.json
behavior_pack/functions/give_controller.mcfunction
behavior_pack/functions/end_game.mcfunction
resource_pack/manifest.json
resource_pack/textures/item_texture.json
resource_pack/textures/items/controller.png    16 x 16, from repo, NEVER redrawn
test_world.json
```
Controller (item `allenscreations:controller`; NEVER opt out): form with **Start**, **How to play** (this order); while running the first button = **End Game**.
- Only host/operator gets/uses it, via `isHost` in `controller.js`, NEVER `player.isOp()` alone. Start works while not running (re-read state after form closes). Running: End Game -> confirm form (**End Game** / **Back**) -> `endGame()`, no cheats. How to play: rules + Back.
- KEPT while the game runs. `consumeOnStart: true` restores old behavior (Start consumes first Controller unless `getGameMode()` is `GameMode.Creative`; End Game then only reachable by a host still carrying one).
- Game logic calls `endGame()` on win/lose. `endGame()` sets `ended`, gives host/operator a fresh Controller if none.
- Stuck state: NEVER `running` after reload with no live game. Reset to `idle` on world load, give Controller (1.11 item 4). `give_controller`/`end_game` need cheats: last resort.
- Giving: host/operator on every spawn incl. death when carrying none (`consumeOnStart: true`: first spawn when not `running`; Creative operators always). State `idle|running|ended` in a world dynamic property.
- Form shows state and whether Controller is kept. NEVER add Restart/other buttons. Fill `gameInfo` and `howToPlay` with real goal, controls, ending.
- `controller.js` installed when `main.js` calls `registerController(`; check fails if it differs, NEVER edit. Write BP manifest with looked-up `min_engine_version` BEFORE running the script (item JSON takes `format_version` from it). You write `resource_pack/manifest.json` (4.3, fresh UUIDs, same version) and add its dependency + `@minecraft/server-ui` to the BP manifest. NEVER copy anything else from `Mcpeworlds/assets/`.
`main.js` template:
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
- `title`, `gameInfo`, `howToPlay` required; `consumeOnStart` optional (default false). `onStart(player)` throws: state -> `idle`, Controller returned. `onEnd()` runs via `endGame()`. Script event `allenscreations:end` also ends the game. Template `win()` only sends a message: REPLACE with real logic. Old inline Controllers pass with a warning.
- `test_world.json` (required script/minigame, optional addon; empty list if none): `{ "mode": "Creative", "include_addons": ["Magnetic-Satchel", "Mining-Helmet"] }`. `mode` MUST be `Creative`. `include_addons` = existing `MCPEDL/Addons/` folder names, <=10, no duplicates; importer rejects missing. ONLY add-ons the user named or the idea clearly needs; cannot verify a name: ask once. Workflow builds `<Name> - Test.mcworld`; fails on duplicate UUIDs/unresolved deps. README NEVER claims the `.mcworld` exists. Terrain: build from script/functions, NEVER world data.

### 4.7 Recipes
- Every custom shaped/shapeless crafting recipe: unlock per 1.4. Other recipe types: no `unlock`.

### 4.8 Build the pack script
NEVER hand-write ZIP, base64 or the `.sh`. `scripts/make_pack_script.py` installs missing Ledger/Controller files, runs every `build_payload.py` check, builds the ZIP in memory and writes ONE Termux `.sh` that carries the project as a base64 block at its end. It writes nothing else. The importer reads that same block.
1. Create `build/<Name>/` per 4.2 incl. `project.json` + BP manifest with looked-up `min_engine_version`. `build/` is scratch.
2. Get `scripts/make_pack_script.py`, `build_payload.py`, `import_project_payload.py`, `doc_template.py` (repo or pasted), all in one folder next to `build/`.
3. `python3 make_pack_script.py build/Name` (`--check-only` to test only).
4. Fix every failure incl. every `DOC:`, rerun. Put the SELF-TEST PASSED + PACK SCRIPT OK + BUILD OK result after the file name in File Needed. Proves structure only. Node MUST be installed for syntax check; if output says not checked, say so.
5. Run `python3 doc_template.py --style build/Name`; rewrite every STYLE hint with a specific fact, rebuild.
6. Deliver ONLY `<Name>_<Version>_<Rand>.sh` (fresh Rand, 1.1 rule). NEVER retype or edit it.

### 4.9 Final self-check before replying
- [ ] Type asked/given before building.
- [ ] SELF-TEST PASSED + PACK SCRIPT OK + BUILD OK printed; exactly one `.sh` delivered, no other file.
- [ ] Module versions latest stable, date recorded. `min_engine_version` looked up, docs state only a verified minimum.
- [ ] Docs state achievement status (+cheats caveat), experiments, "not tested in game"; no `DOC:` failures; no STYLE hints; tagline one concrete sentence.
- [ ] Every README/DESCRIPTION/CHANGELOG matches Part 2 exactly, no placeholders, DESCRIPTION has both listing images.
- [ ] Map: `oneblock_setup` harmless+idempotent; `void_cleaner` ends with conditional `void_cleaned` tag.
- [ ] Script: BP only, `.mcpack`, no Controller/RP, real `main.js` logic, listed add-ons exist.
- [ ] Minigame: form exactly Start + How to play; real `gameInfo`/`howToPlay`; real logic calling `endGame()`; stuck-state recovery; listed add-ons exist.
- [ ] No comments in scripts/functions/JSON. Versions `X.Y.Z` only.
- [ ] No `Mcpeworlds/assets/` file copied except ledger/controller; nothing from `assets/Images/`.
- [ ] Any `.sh` named `(Repofilename)_(Version)_(Rand).sh`, fresh Rand >=5.
- [ ] Reply = only the three 4.11 sections (or one exception).

### 4.10 Build failures
Paste the workflow error log back to the agent. Find the rule here and the check in `build_payload.py`/`doc_template.py`.
| Message contains | Fix |
|---|---|
| `type must be one of` | `project.json` type: addon, map, script, minigame. |
| `File type not allowed` / `world data not allowed` / `link files not allowed` | Remove it (4.2). |
| `header.name must end with one (vX.Y.Z)` / `title version does not match` | One suffix == `header.version`, both packs. |
| `description needs 'by ALNStudios' exactly once` | Once per description, never in name. |
| `must depend on the resource pack header.uuid` | Add dependency (4.3). |
| `first entry must be void_cleaner` / `lacks the exact required fill line` / `the last command must add the void_cleaned tag` | Fix `tick.json`, `void_cleaner.mcfunction` (4.5). |
| `missing required file` | Add the file for your type. |
| `is not a byte-for-byte copy` | Use the repo PNG unchanged. |
| `controller.js must be the unchanged generator copy` | Delete it, rerun the script. |
| `registerController needs ...` | Fill the call's fields. |
| `import ... is not allowed` / `eval and the Function constructor` / `syntax error` | Fix the named line. |
| `min_engine_version must be 3 integers` | Use looked-up game version. |
| `format_version ... newer than min_engine_version` | Raise `min_engine_version` or lower item `format_version`. |
| `is already used by MCPEDL/...` | Fresh UUIDs. |
| `Name clash` / `already exists` / `also exists under` | Other folder name or `overwrite` true. |
| `add-on '<x>' not found` | Fix name in `test_world.json`. |
| `missing the unlock context` | Add unlock (1.4). |
| `clickable CurseForge image` / `clickable MCPEDL image` | Paste the exact HTML line from 2.5 into Creator and Permissions. |
| `run scripts/optimize_images.py` | Compress `assets/Images/` (workflow does it). |
| `old hardcoded-version Minecraft Bedrock badge` | Use the version-free badge from 2.5. |
| `DOC: ...` | Fix exactly what it names; template in 2.5. |

### 4.11 Reply format
Every reply = exactly these three sections, this order, these headings (`INSTRUCTIONS.md` Reply Format). NOTHING before, between or after. NEVER a Summary section. Empty: `- None`.

**File Needed:** the one pack `.sh`, attached as the downloadable file, then its check result on the same line, e.g. `<Name>_<Version>_<Rand>.sh (SELF-TEST PASSED, PACK SCRIPT OK, BUILD OK)`. No other file.

**Changelog:** brief bullets: what the project does; `min_engine_version` and module versions with the check date (verified or not verified); deviations from this file or `None`; `Source created, not tested in game.`

**Termux Script:** ONE fenced `bash` block with ONLY the run commands, nothing else inside it:
```bash
bash ~/storage/downloads/<file>.sh
bash ~/storage/downloads/<file>.sh stage
```
First line creates the project and pushes. Second line only stages it for GitHub workflow **Create Project from Base64** (`payload_file` = `<file>.sh`). Use one or both lines as the user needs.

Exceptions (INSTEAD of the three sections, nothing else):
- Cannot run code: `CANNOT BUILD` and one line why. No files, no base64.
- Build failed, unfixable: `BUILD FAILED`, exact failing lines from `make_pack_script.py`, the rule each names. No `.sh`.
- Type unknown: only the 4.0 question.

### 4.12 Vanilla Limits and Workarounds
Applies to every addon, map, script, minigame, item, entity, block, trade, recipe and enchantment, new or updated.
- A hardcoded vanilla limit blocks the requested mechanic (examples: mutually exclusive enchantments, item, entity or component caps, trade or recipe limits) AND the standard approach (behavior JSON, commands, crafting, enchanting) fails: NEVER drop the feature silently. The standard approach works: use it, no workaround.
- Lightest workaround first. 1) Data-driven: custom item, block, entity, recipe, loot, trade, spawn rule, animation controller, tag, component. 2) `@minecraft/server`: custom components, events, ItemStack and Entity APIs, dynamic properties, tags or scoreboard for state. 3) Structural: helper or proxy entity, swapped or replaced item or entity, tiered item variants, `.mcstructure` or template placement, function-driven effects.
- NEVER invent an API, component, event or behavior. Use only what the looked-up stable version (1.2) provides and the repo scripts accept. Cannot verify: say so in DESCRIPTION.md.
- Modular: one small file per workaround with one entry point (script: `behavior_pack/scripts/lib/<name>.js` imported relatively; data: its own function file, entity or item definition). Reuse an existing module. NEVER copy the logic per feature.
- Safe: idempotent setup, caps and cleanup for spawned entities and loops, nothing that corrupts worlds or other packs.
- Docs (Part 2): player-facing result only, no code or API names; the trade-off under Good To Know. State achievement and experiment impact per 1.2. NEVER claim tested in game unless tested.
