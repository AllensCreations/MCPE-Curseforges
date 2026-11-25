---
name: mcpe-context7
description: Use before looking up ANY Bedrock API member, vanilla id, texture, recipe, component, manifest field or version for the MCPE-Curseforges repo. Routes each need to one of the three Context7 libraries and says when a script must come from the kit zip instead.
---

# mcpe-context7: Where to Look Things Up

## Authority

- `INSTRUCTIONS.md` 1.16 (copy in the kit zip's instruction files) is the policy. This skill is only its routing table and never overrides it.
- Repo rules, scripts and pack files come from the **kit zip** (`New-Pack.zip`, `Maintenance.zip` or the pack's review zip), NOT from Context7. The zip is always fresher.

## Libraries (ONLY these three, IDs exactly, `query-docs` only)

- `/microsoftdocs/minecraft-creator`: `@minecraft/server` and `@minecraft/server-ui` API, JSON schemas, stable and module versions.
- `/mojang/bedrock-samples`: vanilla ids, textures, recipes, components, entities, formats, `version.json`.
- `/websites/wiki_bedrock_dev`: manifest structure, scripting guides, techniques.

NEVER call `resolve-library-id`. NEVER query any other library.

## Repo lookups (from the kit zip, NOT Context7)

Repo rules, scripts, instruction files, `DOCS_RULES.md`, `PACK_GENERATOR_INSTRUCTIONS.md`, `docs/mcicons-index.md`, `docs/bedrock-guide.md` and all script files come from the kit zip under `files/`. Read them from there. Context7 no longer indexes this repo.

## Rules

1. Query first, write second. Batch: at most ONE `query-docs` call per needed `libraryId`, covering every topic needed from it. NEVER two calls to the same `libraryId`. Name the exact member, file, id or schema and the game or module version. All three calls may go in one parallel turn.
2. Verify every import, class, method, property and JSON field against the retrieved text. NEVER `mojang-minecraft`, `world.events` or 1.x syntax.
3. Empty or doubtful result: no sequential retry loop. Say "not verified". NEVER fill the gap from memory.
4. Versions come only from retrieved text. State the exact version used and the query date.
5. Handoff bullet: `Docs queried (YYYY-MM-DD): <library IDs and topics>`.
6. Library IDs, query text and the word Context7 NEVER go into shipped files or player-facing docs.

## Scripts that must run

- `make_pack_script.py`, `build_payload.py`, `import_project_payload.py`, `doc_template.py`, `pixel_json_to_png.py`, `make_update_script.py` and `apply_update.py` need their COMPLETE unchanged text.
- The complete files are in the kit zip (`New-Pack.zip`, `Maintenance.zip` or the pack's review zip `<Pack>.zip`) under `files/`. Unzip, run from there, NEVER retype or edit them.
- No zip: stop and ask the user to attach the zip. NEVER rewrite a script from memory.

## Icons (MCicons)

- Any vanilla item or block icon (recipe diagrams, sprites, README or listing images, UI art): use MCicons ONLY. It is the release file `reference/mcicons/mcicons-<ver>.tgz` in the repo (`package/dist/icons/minecraft_<id>.png`, 64x64, only `minecraft:` ids). Read it with `scripts/lib/mcicons.py` (`has_icon(id)`, `icon_image(id)`), never retype or guess a PNG.
- No icon for the id (custom ids, newer items): report it. NO fallback to Samples, the Wiki, another icon site or a third-party pack.
- `docs/mcicons-index.md` (in the kit zip under `files/`) lists every icon id it holds: check it before using an icon.
- The `.tgz` itself is not in the kit zips. To run code that reads the pixels it must be in the clone; if it is missing, ask the user to attach it. NEVER substitute a lookalike.
- Every manifest (BP and RP) carries `metadata.authors` = `["ALNStudios"]` and `metadata.product_type` = `"addon"`, always.
- Keep its `ASSET-NOTICE.md` with any redistributed icon.

## Reading the directory map

- The map lists directories with file counts. Pick the folder, then read the file from the zip. For exact file text of a pack, ask for a Collect Files export of that path.
- NEVER edit generated folders and files: `builds/`, `Package/`, `changelog_views/`, `MCPEDL/AI Review/`, `MCPEDL/README.md`, `builds/README.md`.
