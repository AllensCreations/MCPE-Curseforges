---
name: mcpe-pack-update
description: Use for any change to an existing project, workflow, script or doc in the MCPE-Curseforges repository (update, fix, add, rename). Delivers every change as ONE self-contained Termux update script (<Pack>_v<Version>_<rand>.sh) containing the spec and rich UI.
---

# mcpe-pack-update: Update Delivery

## Authority

- `INSTRUCTIONS.md` is the policy source. `PACK_GENERATOR_INSTRUCTIONS.md` is its standalone copy for generation. The script flow is `INSTRUCTIONS.md` "Termux Script Rules", built with `scripts/make_update_script.py`. Where to look each rule up: the `mcpe-context7` skill. This skill is a short working checklist and never restates or overrides them.
- **Precedence** (as in `PACK_GENERATOR_INSTRUCTIONS.md`): factual accuracy and the user's requested scope, then Part 1, then Part 2, then this skill. Part 4 of the generator file never overrides Parts 1 and 2.
- If these files disagree with each other or with a script in `scripts/`, tell the user exactly what differs instead of choosing silently. If `INSTRUCTIONS.md` cannot be read, stop and report it instead of working from memory.
- Achievements line (every project type): always `Yes, achievement-friendly.` Keep any cheats or world-setting caveat as a following sentence.

## Scope

- Use for changes to an existing project (`MCPEDL/Addons|Maps|Script|Minigame/<Name>/`), a workflow, a script, a catalog or any repo doc.
- Read-only audit or report: use `checkrm`.
- New project from an idea: follow `PACK_GENERATOR_INSTRUCTIONS.md` Part 4 (ask the type first, base64 payload).

## Procedure

1. Read `INSTRUCTIONS.md` Parts 1 and 2 before writing anything, through Context7 as the `mcpe-context7` skill says. `make_update_script.py`, `apply_update.py`, and `pixel_json_to_png.py` are complete in the pack's review zip (`<Pack>.zip`) under `files/`; run them from there.
2. Find the destination folder: the path the user named, otherwise the matching project folder. Do not substitute a similar name; report ambiguity or a missing target.
3. Read the real source (manifests, scripts, items, recipes, loot tables, functions, lang files) before writing any claim. Source priority when sources disagree: the project's own files, Mojang Bedrock Samples, official Minecraft Creator Documentation, Minecraft Wiki, Bedrock Wiki.
4. Make the smallest possible change. No unrelated rewrites. Never invent features, versions, links, assets, test results or compatibility. Never write comments in shipped `.js`, `.mcfunction` or `.json` files.
5. Generate the spec, convert it with `make_update_script.py` into a single self-contained `<Pack>_v<Version>_<rand>.sh` file, and provide the one-line run command for the user.

## The update script

Generate the spec with `apply_update.py` directives (replace, replace-all, insert-after, insert-before, create, overwrite, delete, changelog).
Then build the single `.sh` using:
```bash
python3 files/scripts/make_update_script.py spec.txt --out-dir .
```
This produces ONE single `.sh` file (`<PackName>_v<Version>_<rand>.sh`) that contains the embedded update payload, ANSI colored status UI, automated git rebase, validation checks, commit, and push.

## Reply

1. Attach or output the single `.sh` file (`<PackName>_v<Version>_<rand>.sh`).
2. Give the single Termux command:
```bash
bash ~/storage/downloads/<PackName>_v<Version>_*.sh
```
3. Brief summary of what changed and what checks ran.
4. **Save in AI memory**: Every finished output, applied change summary, and spec version must be retained in AI memory/scratch notes so context is preserved across turns without relying on session replay.
