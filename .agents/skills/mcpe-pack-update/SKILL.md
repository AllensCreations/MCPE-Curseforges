---
name: mcpe-pack-update
description: Use for any change to an existing project, workflow, script or doc in the MCPE-Curseforges repository (update, fix, add, rename). Delivers every change as ONE update spec file (spec_vN.txt) that the user turns into a Termux .sh with scripts/make_update_script.py. Not for read-only audits (use checkrm) and not for building a new project from an idea (use PACK_GENERATOR_INSTRUCTIONS.md Part 4).
---

# mcpe-pack-update: Update Spec Delivery

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

1. Read `INSTRUCTIONS.md` Parts 1 and 2 before writing anything, through Context7 as the `mcpe-context7` skill says. `make_update_script.py` and `apply_update.py` are complete in the pack's review zip (`<Pack>.zip`) under `files/`; run them from there.
2. Find the destination folder: the path the user named, otherwise the matching project folder. Do not substitute a similar name; report ambiguity or a missing target. Ask at most one question, and only if the answer changes gameplay, compatibility, distribution, data loss or versioning.
3. Read the real source (manifests, scripts, items, recipes, loot tables, functions, lang files) before writing any claim. Source priority when sources disagree, and report the disagreement: the project's own files, Mojang Bedrock Samples, official Minecraft Creator Documentation, Minecraft Wiki, Bedrock Wiki.
4. Make the smallest possible change. No unrelated rewrites. Never invent features, versions, links, assets, test results or compatibility. Never write comments in shipped `.js`, `.mcfunction` or `.json` files.
5. Write the spec (below), test it (below), then reply (below). For changes to an existing project, never deliver a .sh: this overrides any older "deliver the .sh" wording. A NEW pack still follows `mcpe-new-pack` and delivers its generated .sh.

## The spec

File name: `spec_vN.txt`, a downloadable file. N = CURRENT VERSION + 1, read from the attached repo export, never guessed. The user builds the .sh on their phone with `scripts/make_update_script.py`.

Format (`scripts/apply_update.py`):

- Start: `@@ version vN`, then `@@ project MCPEDL/<Category>/<Name>`, then one `@@ file <path relative to the project>` block per file.
- Directives: replace/with, replace-all, insert-after, insert-before, delete, append, create, overwrite, changelog. Remove files with `@@ delete-file <repo-root path>`.
- Small change: replace/insert only. Anchors are copied from the attached export, never from memory, and must occur exactly once. Do not end an anchor with a newline.
- Large redesign: `@@ overwrite` (new content must exceed 60% of the old file) or `@@ create` for new files. Never many fragile edits.
- A content line that starts with `@@` is written `@@@`.
- End with `@@ changelog <Update Name>` using `### Added`, `### Improved & Balanced`, `### Fixed` and `- **Title**: text`. Never touch manifest versions or README links.
- New pixel textures: `@@ create` the pixel JSON under `texture_sources/`, then add the PNG step to the Termux commands.
- Keep README.md and DESCRIPTION.md accurate (INSTRUCTIONS Part 2 template). Never claim an in-game test.

**Test before delivering.** Apply the spec to the export text in the sandbox with `apply_update.py` (`--dry-run`, then a real run on a copy). Check every anchor, validate each changed JSON, run `node --check` on JS. Report every check not run.

## Versions

- N is the current version from the attached export plus one. `apply_update.py` rejects a stale version, so a stale spec cannot run on a newer repo.
- Never edit manifest versions or the README version or download link. The auto-version-bump workflow does that on push.

## Docs

- The changelog entry is mandatory on every update and is written with the final `@@ changelog <Update Name>` directive. Never edit or delete older entries; correct them in the new entry.
- After the change, check the README.md and DESCRIPTION.md in the destination. Edit them only if the change makes them inaccurate or incomplete. Never remove verified content.
- Follow the Part 2 templates in `INSTRUCTIONS.md` exactly (`scripts/doc_template.py` fails the build on deviation): same headings, same heading text, same order, same labels, no added sections, no boilerplate, no placeholders. README is version-free and DESCRIPTION has no release version in its title.
- Writing, layout, attribution, keywords and the README and DESCRIPTION templates are defined in `INSTRUCTIONS.md` Part 2. Read them there; do not copy them into the script from memory.

## Reply

1. `spec_vN.txt` as a downloadable file.
2. These Termux commands, with N and the project filled in:

```
cd ~/MCPE-Curseforges && git checkout -- Package changelog_views && git pull --rebase --autostash
python3 scripts/make_update_script.py ~/storage/downloads/spec_vN.txt --out-dir ~/storage/downloads --verify ~/MCPE-Curseforges
bash ~/storage/downloads/<Name>_vN_*.sh
```

Only when textures changed, then:

```
python3 scripts/pixel_json_to_png.py MCPEDL/<Category>/<Name>
git add MCPEDL/<Category>/<Name>/resource_pack/textures
git commit -m "<short>" && git pull --rebase --autostash && git push
```

3. Two or three sentences: what changed, which checks ran, what is unverified. Add `Docs queried (YYYY-MM-DD): <library IDs and topics>`.
