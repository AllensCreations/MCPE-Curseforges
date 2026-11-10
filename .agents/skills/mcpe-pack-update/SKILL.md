---
name: mcpe-pack-update
description: Use for any change to an existing project, workflow, script or doc in the MCPE-Curseforges repository (update, fix, add, rename). Delivers every change as ONE Termux .sh script that pulls, patches, bumps the changelog version, commits and pushes. Not for read-only audits (use checkrm) and not for building a new project from an idea (use PACK_GENERATOR_INSTRUCTIONS.md Part 4).
---

# mcpe-pack-update: Termux Script Delivery

## Authority

- `INSTRUCTIONS.md` is the policy source. `PACK_GENERATOR_INSTRUCTIONS.md` is its standalone copy for generation. The script flow is defined by the AI prompt inside `.github/workflows/export-repo-to-txt.yml`. This skill is a short working checklist and never restates or overrides them.
- **Precedence** (as in `PACK_GENERATOR_INSTRUCTIONS.md`): factual accuracy and the user's requested scope, then Part 1, then Part 2, then this skill. Part 4 of the generator file never overrides Parts 1 and 2.
- If these files disagree with each other or with a script in `scripts/`, tell the user exactly what differs instead of choosing silently. If `INSTRUCTIONS.md` cannot be read, stop and report it instead of working from memory.
- Add-on Achievements line: always `Likely achievement-friendly.` Keep any cheats or world-setting caveat that applies.

## Scope

- Use for changes to an existing project (`MCPEDL/Addons|Maps|Script|Minigame/<Name>/`), a workflow, a script, a catalog or any repo doc.
- Read-only audit or report: use `checkrm`.
- New project from an idea: follow `PACK_GENERATOR_INSTRUCTIONS.md` Part 4 (ask the type first, base64 payload).

## Procedure

1. Read `INSTRUCTIONS.md` Parts 1 and 2 and the AI prompt in `.github/workflows/export-repo-to-txt.yml` from the current clone before writing anything.
2. Find the destination folder: the path the user named, otherwise the matching project folder. Do not substitute a similar name; report ambiguity or a missing target. Ask at most one question, and only if the answer changes gameplay, compatibility, distribution, data loss or versioning.
3. Read the real source (manifests, scripts, items, recipes, loot tables, functions, lang files) before writing any claim. Source priority when sources disagree, and report the disagreement: the project's own files, Mojang Bedrock Samples, official Minecraft Creator Documentation, Minecraft Wiki, Bedrock Wiki.
4. Make the smallest possible change. No unrelated rewrites. Never invent features, versions, links, assets, test results or compatibility. Never write comments in shipped `.js`, `.mcfunction` or `.json` files.
5. Write the script (below), test it (below), then reply (below).

## The script

File name: `(Repofilename)_(Version)_(Rand).sh`

- `Repofilename`: the project, folder or file being changed, no extension, no spaces (hyphens allowed).
- `Version`: that item's new version as X.Y.Z, or the instruction file's version (such as `v9`) when the instruction file itself is the item.
- `Rand`: at least 5 random lowercase letters or digits, generated fresh every time with `head -c 400 /dev/urandom | tr -dc 'a-z0-9' | head -c 6`, never reused from an earlier reply or an existing file.
- Use the exact same name in the reply, in the run command and in the script's own checks.

The script must, in this order:

1. `#!/data/data/com.termux/files/usr/bin/bash` and `set -e`.
2. Put the destination in a `DEST=` variable and use it for every path and for `git add`.
3. `cd "$HOME/MCPE-Curseforges"`, or `git clone` the repo URL first if the folder is missing.
4. `git pull --rebase --autostash` (keeps any local edits, so a second run is safe).
5. Apply every change inside the script: heredocs for new or replaced files, inline `python3` for patching. Patch by exact match; abort if the expected old text is missing or not unique; skip a patch whose new text is already present.
6. Confirm the highest current version (manifest or top CHANGELOG entry) is the one expected, so a stale script cannot run on a newer repo.
7. Validate every changed `.json` file with `python3` and stop on error.
8. Verify the top CHANGELOG heading equals the new version and the version in the script file name; stop on mismatch.
9. `git add` only the changed paths, `git commit -m "<short message>"`, `git push`. If the user says they will commit themselves, stop after the checks, run `git status --short`, and do not commit or push.
10. Be safe to run twice: if everything is already applied, print "Nothing to commit" and exit cleanly.

Do not use brace expansion when creating files in the sandbox shell, which may be plain `sh`. After creating files, list them and confirm they exist.

**Test before delivering.** Run the script in the sandbox against a clone with a local bare repo as the remote (point `HOME` at a temp folder), run it a second time to confirm it does nothing, then run `python3 scripts/check_readme_status.py` and `python3 scripts/validate_manifest_titles.py --project <path>`. For projects under `MCPEDL/Addons/`, confirm the `LOCK` marker exists. Report every check not run. Never claim a build, push or in-game test that did not happen.

## Versions

- Take the highest of the manifest version and the top CHANGELOG.md entry and add exactly 0.0.1 to the patch number (1.2.3 becomes 1.2.4, 1.2.9 becomes 1.2.10, no rollover). Use that one version for the CHANGELOG entry and the script file name. Use a different bump only if the user asks.
- Never edit manifest versions or the README version or download link. The auto-version-bump workflow does that on push.
- Never reuse or overwrite an existing version heading. If the heading for the new version already exists (script run twice), skip adding it.
- Date for the CHANGELOG entry: `TZ=Asia/Singapore date +%F`.

## Docs

- `CHANGELOG.md` is mandatory on every update. Add the new entry directly under the first `---`. Never edit or delete older entries, even to correct them; correct them in the new entry.
- After the change, check the README.md and DESCRIPTION.md in the destination. Edit them only if the change makes them inaccurate or incomplete. Never remove verified content.
- Follow the Part 2 templates in `INSTRUCTIONS.md` exactly (`scripts/doc_template.py` fails the build on deviation): same headings, same heading text, same order, same labels, no added sections, no boilerplate, no placeholders. README is version-free and DESCRIPTION has no release version in its title.
- Writing, layout, attribution, keywords and the README and DESCRIPTION templates are defined in `INSTRUCTIONS.md` Part 2. Read them there; do not copy them into the script from memory.

## Reply

1. The `.sh` file as a downloadable file.
2. These steps, exactly.

First time only:
```
pkg update -y && pkg install -y git python
termux-setup-storage
git config --global user.name "ALNStudios"
git config --global user.email "your-email@example.com"
git config --global credential.helper store
```
Every update:
```
bash ~/storage/downloads/<Repofilename>_<Version>_<Rand>.sh
```
Download the `.sh` to the Downloads folder first and use its exact file name, including the random characters. At the push prompt, the password is a GitHub Personal Access Token (repo scope), not the account password.

3. One or two sentences on what changed, which checks ran, and anything unverified.
