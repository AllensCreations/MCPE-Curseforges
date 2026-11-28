---
name: mcpe-new-pack
description: Create a NEW addon, map, script or minigame for the MCPE-Curseforges repo. ONLY use for truly new projects that do NOT yet exist in MCPEDL/. For ANY change to an existing pack, use mcpe-pack-update instead (delivers a .sh update script, NEVER base64).
---

# mcpe-new-pack: Build a New Pack

## !! CRITICAL: Existing pack? Use mcpe-pack-update instead !!

This skill is for **truly new projects only** — packs that do NOT yet exist under `MCPEDL/`.

If the user is asking for a **change, fix, addition or update to a pack that already exists**, stop immediately and use the `mcpe-pack-update` skill. That skill delivers a `.sh` update script via `make_update_script.py`. It NEVER uses a base64 payload.

**Signs you must switch to mcpe-pack-update:**
- The user says "update", "fix", "add", "change" or "improve" and names an existing pack.
- The pack folder already exists under `MCPEDL/Addons/`, `MCPEDL/Maps/`, `MCPEDL/Script/`, or `MCPEDL/Minigame/`.
- You can see a `CHANGELOG.md`, `manifest.json`, or `project.json` for the named pack.

## Authority

- This skill is the entry point and a checklist. It never restates or overrides policy. The rules live in `PACK_GENERATOR_INSTRUCTIONS.md` (Part 4), `INSTRUCTIONS.md` and `DOCS_RULES.md`. On any conflict `INSTRUCTIONS.md` wins, then `DOCS_RULES.md`, then the generator file.
- The complete scripts below are in `New-Pack.zip` (the kit zip) under `files/`: unzip and run them, never retype them. Everything else is read through Context7 (`mcpe-context7` skill); `New-Pack_tools.txt` (inside the same zip) holds only a directory map and the skills.
- If a required file cannot be read, stop and say which one. NEVER work from memory or from an old copy.
- Updating an existing pack is a different job: use the `mcpe-pack-update` skill and `INSTRUCTIONS.md` "Termux Script Rules".

## Do these in order

1. **Read first, then build.** `INSTRUCTIONS.md` (Reply Format, Termux Script Rules, 1.1 to 1.4, 1.7, 1.12), then `DOCS_RULES.md` (2.1 to 2.5), then ALL of `PACK_GENERATOR_INSTRUCTIONS.md`. Read these from the kit zip (`New-Pack.zip`) under `files/` — the zip always wins over any external index. Then read the scripts that decide what passes: `scripts/build_payload.py`, `scripts/doc_template.py`, `scripts/import_project_payload.py`, `scripts/make_pack_script.py` (plus `scripts/pixel_json_to_png.py` when drawing textures).
2. **Type.** If the user did not say addon, map, script or minigame, ask the exact question in 4.0 and wait. NEVER guess.
3. **Research & Plan (~90% confidence).** Conduct thorough research (~90% completeness) on requested mechanics, vanilla Bedrock components, dependencies, and latest Bedrock Script APIs. Query Context7 (`/microsoftdocs/minecraft-creator`, `/mojang/bedrock-samples`, `/websites/wiki_bedrock_dev`) for the latest stable Bedrock release and `@minecraft/server` / `@minecraft/server-ui` versions now, and verify every API member and JSON field before using it. Record the date. Present the structured Plan to the user (architecture, APIs, components, files, UX) and wait for user approval or changes before building any files.
4. **Build** the project in scratch `build/<Name>/` using the 4.2 layout (after user approves the plan). Fresh v4 UUIDs for every header and module. Write the BP manifest (with the looked-up `min_engine_version`) BEFORE running the script.
   Icons: vanilla item and block icons from MCicons only (`mcpe-context7` skill, Icons section; no fallback); custom textures only as pixel JSON.
   Scripts: TypeScript (`.ts`) is standard for all new packs: write your scripts under `behavior_pack/scripts/` (e.g. `main.ts`, `lib/*.ts`). `scripts/make_pack_script.py` and `scripts/compile_typescript.py` automatically compile them to comment-free `.js` for Bedrock runtime compatibility.
5. **Run `scripts/make_pack_script.py build/<Name>`.** Fix every failure, including every `DOC:` line, and rerun until SELF-TEST PASSED, PACK SCRIPT OK and BUILD OK print. Then `python3 doc_template.py --style build/<Name>`, rewrite every STYLE hint with a specific fact, rebuild.
6. **Deliver** exactly ONE file: `<Name>_<Version>_<Rand>.sh`. Reply in the three sections of 4.11 and nothing else.

## Most often missed

- NEVER write base64, a ZIP or the `.sh` by hand. NEVER hand-edit the `.sh`. Cannot run code: reply `CANNOT BUILD`.
- No other deliverable: no `.zip`, `.mcaddon`, `.mcworld`, `.mcpack`, `.json`, `.js`, `.b64`. `build/` is scratch and is never delivered.
- There is no test world. NEVER ship `test_world.json` (the build rejects it) and NEVER promise a `- Test.mcworld`.
- The importer creates `assets/snapshots`, `assets/recipes` and `assets/items` for the pack. NEVER ship `assets/`, `Mcpeworlds/` or listing images in the payload.
- Every custom crafting recipe needs `AlwaysUnlocked` (1.4). Every custom recipe and item shown in DESCRIPTION gets its image from `scripts/generate_recipe_images.py` after import (1.5).
- Docs follow the templates in `DOCS_RULES.md` 2.5 exactly: README is the 11-line download landing page, DESCRIPTION has the exact section order, both badges and both listing images, and says `not tested in game`, the achievement status and the experiments status.
- No comments in `.js`, `.mcfunction` or `.json`. Versions are `X.Y.Z` only. `by ALNStudios` appears once per description, never in a name.
- Map: `void_cleaner` first in `tick.json`, exact fill line, conditional `void_cleaned` tag, Trader Ledger from the repo copy. Minigame: Controller from the repo copy (it already is the ALN UI Redesign menu: never edit or replace it), `registerController` with `title`, `version` equal to the BP manifest, `about`, real `gameInfo` and `howToPlay` with no color codes, real logic that calls `endGame()`. NEVER build your own form. Script: Behavior Pack only, `.mcpack`.
- Never claim anything was tested in Minecraft. The checks prove structure only.

## After the pack is in the repo

- Register the CurseForge project ID with the **Register CurseForge ID** workflow. It saves the ID, refreshes the publish dropdown and then starts **Build Changed Packs & Sync Catalogs** by itself. Nothing else needs to be run by hand.
- Versions never change on a build. Only an update script or **Publish to CurseForge** moves them.

## Before replying (tick every line)

- [ ] I read the three instruction files and the four scripts through Context7 or this export, not from memory, and every API member was verified in a query result.
- [ ] Type was given or asked. Versions and `min_engine_version` were looked up today and the date is recorded.
- [ ] SELF-TEST PASSED, PACK SCRIPT OK and BUILD OK were printed by a real run; exactly one `.sh` exists.
- [ ] No `DOC:` failures, no STYLE hints, no placeholders, no `test_world.json`, no `assets/` in the payload.
- [ ] Reply = **File Needed**, **Changelog**, **Termux Script**, in that order, no text before, between or after, no Summary. The `.sh` is attached, never pasted.
- [ ] Finished output saved in AI memory: the pack name, version, and generation details are saved in persistent AI memory.
