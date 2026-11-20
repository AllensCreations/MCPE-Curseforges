---
name: mcpe-context7
description: Use before looking up ANY repo rule, repo script, Bedrock API member, vanilla id, texture, recipe, component, manifest field or version for the MCPE-Curseforges repo. Routes each need to one of the four Context7 libraries and says when a script must come from the kit zip instead.
---

# mcpe-context7: Where to Look Things Up

## Authority

- `INSTRUCTIONS.md` 1.16 is the policy. This skill is only its routing table and never overrides it.
- An AI review kit (`*_tools.txt`) holds a directory map and skills, no file contents. That is on purpose: read what the task needs through Context7, not from a pasted dump.

## Libraries (ONLY these four, IDs exactly, `query-docs` only)

- `/microsoftdocs/minecraft-creator`: `@minecraft/server` and `@minecraft/server-ui` API, JSON schemas, stable and module versions.
- `/mojang/bedrock-samples`: vanilla ids, textures, recipes, components, entities, formats, `version.json`.
- `/websites/wiki_bedrock_dev`: manifest structure, scripting guides, techniques.
- `/allenscreations/mcpe-curseforges`: this repo's instruction files, `scripts/` and skills.

NEVER call `resolve-library-id`. NEVER query any other library.

## Repo lookups (`/allenscreations/mcpe-curseforges`)

- Reply format, Termux script order: `INSTRUCTIONS.md Reply Format (STRICT)` and `Termux Script Rules`.
- Update spec syntax (`@@ replace`, `@@ create`, `@@ delete-file`): `scripts/apply_update.py spec format` and `scripts/make_update_script.py usage`.
- README, DESCRIPTION, CHANGELOG templates: `DOCS_RULES.md 2.5 Templates`.
- New pack, map, script, minigame: `PACK_GENERATOR_INSTRUCTIONS.md Part 4`.
- Versions and manifests: `INSTRUCTIONS.md 1.3`. Recipe unlock and images: 1.4 and 1.5. UI skin: 1.13 and 1.14.
- Meaning of a build or doc check message: query the exact message text with the script name, for example `build_payload.py void_cleaner`.

## Rules

1. Query first, write second. One topic per query. Name the exact member, file, id or schema and the game or module version.
2. Verify every import, class, method, property and JSON field against the retrieved text. NEVER `mojang-minecraft`, `world.events` or 1.x syntax.
3. Empty or doubtful result: retry once with a narrower query, then say "not verified". NEVER fill the gap from memory.
4. Versions come only from retrieved text. State the exact version used and the query date.
5. Handoff bullet: `Docs queried (YYYY-MM-DD): <library IDs and topics>`.
6. Library IDs, query text and the word Context7 NEVER go into shipped files or player-facing docs.

## Scripts that must run

- `make_pack_script.py`, `build_payload.py`, `import_project_payload.py`, `doc_template.py`, `pixel_json_to_png.py`, `make_update_script.py` and `apply_update.py` need their COMPLETE unchanged text. A Context7 snippet is not enough.
- The complete files are in the kit zip (`New-Pack_files.zip`, `Update-Pack_files.zip` or `tools_files.zip`) under `files/`. Unzip, run from there, NEVER retype or edit them.
- No zip and only partial text from a query: stop and ask the user to attach the zip. NEVER rewrite a script from memory.
- A file attached in the conversation or read from a clone wins over the Context7 index. Context7 shows the repo as last indexed. Tell the user about any difference.

## Reading the directory map

- The map lists directories with file counts. Pick the folder, then query for the file. For exact file text of a pack, ask for a Collect Files export of that path.
- NEVER edit generated folders and files: `builds/`, `Package/`, `changelog_views/`, `ai-review/`, `MCPEDL/README.md`, `builds/README.md`.
