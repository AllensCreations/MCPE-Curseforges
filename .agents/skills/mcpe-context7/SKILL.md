---
name: mcpe-context7
description: Use before looking up ANY repo rule, repo script, Bedrock API member, vanilla id, texture, recipe, component, manifest field or version for the MCPE-Curseforges repo. Routes each need to one of the four Context7 libraries and says when a script must come from the kit zip instead.
---

# mcpe-context7: Where to Look Things Up

## Authority

- `INSTRUCTIONS.md` 1.16 (copy in `docs/instructions-reference.md`) is the policy. This skill is only its routing table and never overrides it.
- An AI review kit (`*_tools.txt` inside the kit zip) holds a directory map and skills, no file contents. That is on purpose: read what the task needs through Context7, not from a pasted dump.

## Libraries (ONLY these four, IDs exactly, `query-docs` only)

- `/microsoftdocs/minecraft-creator`: `@minecraft/server` and `@minecraft/server-ui` API, JSON schemas, stable and module versions.
- `/mojang/bedrock-samples`: vanilla ids, textures, recipes, components, entities, formats, `version.json`.
- `/websites/wiki_bedrock_dev`: manifest structure, scripting guides, techniques.
- `/allenscreations/mcpe-curseforges`: this repo's rules, script summaries and Bedrock guide. Context7 indexes ONLY `docs/`.

NEVER call `resolve-library-id`. NEVER query any other library.

## Repo lookups (`/allenscreations/mcpe-curseforges`, `docs/` only)

- `docs/instructions-reference.md`: `INSTRUCTIONS.md`, `DOCS_RULES.md`, `PACK_GENERATOR_INSTRUCTIONS.md` (Reply Format, Termux Script Rules, versions 1.3, recipes 1.4 and 1.5, templates 2.5, new packs Part 4).
- `docs/scripts-and-workflows.md`: summary of every script and workflow, update spec syntax (`apply_update.py`, `make_update_script.py`).
- `docs/mcicons-index.md`: every Minecraft icon id in MCicons (generated).
- `docs/bedrock-guide.md`: add-on architecture, folder structure, manifest setup, target API versions.
- Meaning of a build or doc check message: query the exact message text with the script name.

## Rules

1. Query first, write second. Batch: at most ONE `query-docs` call per needed `libraryId`, covering every topic needed from it, all calls in one parallel turn. NEVER two calls to the same `libraryId`. Name the exact member, file, id or schema and the game or module version.
2. Verify every import, class, method, property and JSON field against the retrieved text. NEVER `mojang-minecraft`, `world.events` or 1.x syntax.
3. Empty or doubtful result: no sequential retry loop. Say "not verified". NEVER fill the gap from memory.
4. Versions come only from retrieved text. State the exact version used and the query date.
5. Handoff bullet: `Docs queried (YYYY-MM-DD): <library IDs and topics>`.
6. Library IDs, query text and the word Context7 NEVER go into shipped files or player-facing docs.

## Scripts that must run

- `make_pack_script.py`, `build_payload.py`, `import_project_payload.py`, `doc_template.py`, `pixel_json_to_png.py`, `make_update_script.py` and `apply_update.py` need their COMPLETE unchanged text. A Context7 snippet is not enough.
- The complete files are in the kit zip (`New-Pack.zip`, `Update-Pack.zip` or `Maintenance.zip`) under `files/`. Unzip, run from there, NEVER retype or edit them.
- No zip and only partial text from a query: stop and ask the user to attach the zip. NEVER rewrite a script from memory.
- A file attached in the conversation or read from a clone wins over the Context7 index. Context7 shows the repo as last indexed. Tell the user about any difference.

## Icons (MCicons)

- Any vanilla item or block icon (recipe diagrams, sprites, README or listing images, UI art): use MCicons FIRST. It is the release file `reference/mcicons/mcicons-<ver>.tgz` in the repo (`package/dist/icons/minecraft_<id>.png`, 64x64, only `minecraft:` ids). It is NOT in Context7: read it with `scripts/lib/mcicons.py` (`has_icon(id)`, `icon_image(id)`), never retype or guess a PNG.
- No icon for the id (custom ids, newer items): fall back to Samples (`/mojang/bedrock-samples`), then the Minecraft Wiki only if both lack a usable sprite. NEVER another icon site or third-party pack.
- Context7 cannot index the binary `.tgz`, but `docs/mcicons-index.md` (`/allenscreations/mcpe-curseforges`) lists every icon id it holds: query it to check an id before using an icon.
- The `.tgz` itself is not in the kit zips. To run code that reads the pixels it must be in the clone; if it is missing, ask the user to attach it. NEVER substitute a lookalike.
- Every manifest (BP and RP) carries `metadata.authors` = `["ALNStudios"]` and `metadata.product_type` = `"addon"`, always.
- Keep its `ASSET-NOTICE.md` with any redistributed icon.

## Reading the directory map

- The map lists directories with file counts. Pick the folder, then query for the file. For exact file text of a pack, ask for a Collect Files export of that path.
- NEVER edit generated folders and files: `builds/`, `Package/`, `changelog_views/`, `MCPEDL/AI Review/`, `MCPEDL/README.md`, `builds/README.md`.
