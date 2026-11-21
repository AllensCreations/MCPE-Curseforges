# Bedrock Add-on Guide (ALNStudios / MCPE-Curseforges)

Hand-written. Versions below come from Context7 queries on 2026-11-21 or from this repository's own manifests. Anything not retrieved is marked "not verified".

## Target versions

- Target game: Minecraft Bedrock 1.21 and newer. Repo manifests use `min_engine_version` `[1, 26, 60]` most often, then `[1, 21, 0]`.
- `@minecraft/server-ui`: Context7 (`/microsoftdocs/minecraft-creator`, 2026-11-21) lists 2.0.0, 2.1.0, 2.2.0 and 2.3.0 as stable, 2.3.0 the latest stable; 2.4.0-rc and 2.5.0-beta are pre-release. The docs state 2.x.x is the latest as of Minecraft 1.26.70-beta.24.
- `@minecraft/server`: latest stable version NOT VERIFIED (the query did not return it). The repo's manifests use 2.9.0 to 2.11.0 (2.11.0 in 26 manifests). Query it again before writing a new dependency version, and treat a version that is not in the retrieved text as "not verified".
- Never use `mojang-minecraft`, `world.events` or 1.x-era script imports.

## Architecture

An add-on is a behavior pack (BP) and a resource pack (RP) that depend on each other.

- BP: gameplay. Items, blocks, entities, recipes, loot tables, functions, and the script module.
- RP: visuals and text. Textures, models, sounds, UI, language files.
- Script API: a BP module of `type` `script`, `language` `javascript`, `entry` `scripts/main.js`, using `@minecraft/server` and `@minecraft/server-ui`.
- Every BP with a `main.js` also has `scripts/lib/README.md` (script notes for the AI review: one line per script file, events and ids used, limits). `scripts/lib/*.js` is optional and holds shared helpers; `main.js` imports them by relative path with the `.js` extension (`import "./lib/<name>.js";`, relative `./file.js` form verified 2026-11-21 on `/websites/wiki_bedrock_dev`; named exports from lib files not verified). Add it only when one file is too big.
- Packs link by pack UUID in `dependencies`; script modules link by `module_name` and `version`.

## Manifest setup

Structure (`/websites/wiki_bedrock_dev`, 2026-11-21): `format_version`, `header`, `modules`, `dependencies`, optional `metadata`.

- BP module `type` is `data`. RP module `type` is `resources`. A script module `type` is `script`.
- Header: `name`, `description`, `uuid`, `version`, `min_engine_version`.
- Each module has its own `uuid`, different from the header `uuid`.
- Pack dependency: `{ "uuid": "<other pack header uuid>", "version": [x, y, z] }`.
- Script dependency: `{ "module_name": "@minecraft/server", "version": "<version>" }`, same form for `@minecraft/server-ui`.
- Repo convention: all manifests use `format_version` 2 (the wiki example shows 3; keep 2 in this repo). BP and RP manifests of one pack share the same `header.version`. Title ends with the version suffix, for example `Vanilla Quality of Life (v2)` (see `docs/instructions-reference.md` 1.3).
- Missing or zero `min_engine_version` and missing `metadata.authors` are reported by `validate_manifest_titles.py`.

## Folder structure

```text
MCPEDL/<Addons|Maps|Script|Minigame>/<Name>/
  behavior_pack/   manifest.json, items/, recipes/, scripts/ (main.js, lib/README.md, optional lib/*.js), subpacks/, LOCK
  resource_pack/   manifest.json, textures/, texts/, ui/
  assets/          listing images
  CHANGELOG.md  README.md  DESCRIPTION.md  LOCK
MCPEDL/AI Review/  GENERATED AI review files (<Pack>.txt, <Pack>.zip, kits)
builds/            GENERATED packages and snapshots
Package/           GENERATED listing kits
changelog_views/   GENERATED
scripts/           build, validate, package and update tooling; lib/ holds import-only Python modules
docs/              the only folder Context7 indexes
.agents/skills/    agent skills
.github/workflows/ CI and dispatch workflows
```

Generated folders and files are never edited: `builds/`, `Package/`, `changelog_views/`, `MCPEDL/AI Review/`, `MCPEDL/README.md`.

## Where the rules live

- All coding rules, conventions and review standards: `docs/instructions-reference.md`.
- Scripts, workflows and the update spec format: `docs/scripts-and-workflows.md`.
