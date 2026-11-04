---
name: mcpe-pack-update
description: Use when the user asks to update, fix, add to, or create any pack, map, script, minigame, workflow or doc in the AllensCreations MCPE-Curseforges repository. Delivers every change as ONE Termux .sh script that pulls, patches, bumps the changelog version, commits and pushes.
---

# MCPE-Curseforges Pack Update (Termux script delivery)

Repo: https://github.com/AllensCreations/MCPE-Curseforges.git (branch `main`)

## 1. Before anything else

1. Read the repo's own rules from the current clone, not from memory: `INSTRUCTIONS.md` (all parts) and `.github/workflows/export-repo-to-txt.yml`. If either cannot be read, stop and say so.
2. **Precedence when sources disagree:** the user's request and verified facts > `INSTRUCTIONS.md` > this skill > the export workflow's embedded prompt. Known disagreements, already resolved:
   - DESCRIPTION title has **no** release version (`INSTRUCTIONS.md` Part 2). The old prompt's `(vX.Y.Z)` DESCRIPTION title is wrong; use the new version only in the CHANGELOG heading and the script file name.
   - Project README is **version-free** (no `**Version:**` line).
   - Add-on DESCRIPTION Achievements line stays `Likely achievement-friendly.` Do not change it to anything else without in-game evidence; add a caveat only if world settings or cheats can disable achievements.
3. Find the destination folder yourself: the project's folder under `MCPEDL/Addons|Maps|Script|Minigame/<Name>/`. If the user named a path, use it. If the name is ambiguous or missing, report that instead of guessing a similar one. Every path in the script starts from the repo root and stays inside that folder (plus `builds/` only if the rules require it).
4. Read the real source (manifests, scripts, items, recipes, loot tables, functions, lang files) before writing any claim. Do not infer a feature from a name.

## 2. Rules

1. Never invent features, versions, links, assets or test results.
2. Give only what changed. Smallest possible edits, no unrelated rewrites.
3. No notes or explanations in the deliverable unless asked.
4. Works for every project type. Keep the existing folder layout. A new project goes in its own new folder next to similar ones.
5. Do not change gameplay code, manifests, UUIDs, versions, dependencies or assets unless the request needs it.
6. Never edit or delete older CHANGELOG entries, even to fix a mistake in them. Correct it in the new entry instead.
7. You usually cannot push from the sandbox. Never claim something was pushed, built or tested unless it was.

## 3. Every update = ONE Termux script

File name: `<Repofilename>_<Version>_<RAND>.sh`

- `<Repofilename>`: the project, folder or file being changed, no extension, no spaces (hyphens allowed).
- `<Version>`: the new X.Y.Z (see Versions).
- `<RAND>`: at least 5 random lowercase letters or digits (for example `k7q2x`), freshly generated each time, never reused, so it can never overwrite or re-run an older script.
- Use the exact same file name in the reply steps and in the script's own `SCRIPT_NAME` variable.

The script must, in this order:

1. `#!/data/data/com.termux/files/usr/bin/bash` and `set -e`
2. Put the destination in a `DEST=` variable and use it for every path and for `git add`.
3. `cd "$HOME/MCPE-Curseforges"`, or `git clone` the repo URL first if the folder is missing.
4. `git pull --rebase`
5. Apply every change (code and docs) inside the script: heredocs for new or replaced files, inline `python3` for patching. Patch with exact-match replacement; abort if the expected old text is missing or not unique; skip a patch whose new text is already present.
6. Check that the current highest version (manifest vs top CHANGELOG entry) is what you expected, so a stale script cannot run on a newer repo.
7. Validate every changed `.json` file with `python3` and stop on error.
8. Verify the top CHANGELOG heading equals the new version and the version in the script file name; stop on mismatch.
9. `git add` only the changed paths, commit with a short message, `git push`.
10. Safe to run twice: if everything is already applied, print "Nothing to commit" and exit cleanly.

**Test before delivering.** In the sandbox, clone the repo, run the script against it using a local bare repo as the remote (`HOME` pointed at a temp folder), run it a second time to confirm it does nothing, then run:
`python3 scripts/check_readme_status.py`, `python3 scripts/validate_manifest_titles.py --project <path>` and, if the project is under `MCPEDL/Addons` or `MCPEDL/new_addons`, confirm the `LOCK` marker exists in the project root and in both packs. Report any check you did not run.

## 4. Versions

- Take the highest of the manifest version and the top CHANGELOG entry. Add exactly 0.0.1 to the patch number (1.2.3 -> 1.2.4, 1.2.9 -> 1.2.10, no rollover). Use that one version for the CHANGELOG entry and the script file name. Only use a different bump if the user asks.
- Never edit manifest versions or the README download link. The auto-version-bump workflow does that on push.
- Never reuse or overwrite an existing version heading. If the heading for the new version already exists (script run twice), skip adding it.
- Date: `TZ=Asia/Singapore date +%F` inside the script.

## 5. Docs (every update, inside the same script)

- CHANGELOG.md is **mandatory on every update**. Add a new entry directly under the first `---`, above the previous release.
- After the change, check README.md and DESCRIPTION.md in the destination. Edit them only if the change makes them inaccurate or incomplete. Never remove verified content.
- Follow the templates exactly (`scripts/doc_template.py` fails the build on deviation): same headings, same heading text, same order, same labels and bullet format. No added or merged sections, no boilerplate, no placeholders.
- Writing: player-facing only. In-game display names, never identifiers, file names, JSON, events, code, or "Script API". Write "Behavior Pack" / "Resource Pack", never BP/RP. No code blocks, emojis, hype, or rhetorical questions. No Markdown tables; use `### Feature Name` cards with `- **What Happens**: ...` bullets. Paragraphs of 4 sentences at most. State only verified facts. The Verification line says exactly one of: source created, package built, in-game tested; never mixed.
- Vanilla item and block names come from Bedrock Samples `en_US.lang` and the Minecraft Wiki, never from title-casing an identifier.
- If a README or DESCRIPTION mentions a command or function that needs cheats, say it needs cheats and disables achievements in that world.

### README.md (add-on, map, script, minigame): download landing page

At most 24 non-empty lines, no images, no badges, no version.

```
# [Name]

Download the current release of **[Name]** for Minecraft Bedrock Edition.

## Download

- **Package format:** `.mcaddon`
- **Direct download:** [Download [Name] (.mcaddon)](verified-direct-download-link)

## Installation

1. Download the package using the link above.
2. Open the downloaded file with Minecraft to import it.
3. If the package contains a pack that must be enabled separately, activate it in your world's settings.

## Pack Information

For gameplay features, usage details, compatibility notes, and other project information, read the [full description](verified-DESCRIPTION-link).
```

Use the package's real format (`.mcaddon`, `.mcpack`, `.mcworld`). For `.mcworld`, the last install step tells players to open the imported world; keep every verified world variant link. Use a verified direct package URL, otherwise the category catalog.

### DESCRIPTION.md section order

`# [Name] — [Clear, factual subtitle]` (no version), `**By AllensCreations**`, the two exact badges below, a bold tagline, a `>` pitch, `## Overview`, `## Key Features` (feature cards), `## How to Use`, `## Compatibility` (Minecraft Bedrock Edition, Experimental features, Achievements, Verification), `## Creator and Permissions` (CurseForge profile https://www.curseforge.com/members/allenscreations/projects and MCPEDL profile https://mcpedl.com/user/allenscreations/), `## Guidelines and Attribution`, then `---` and `## Search & Discovery Keywords` built from real features.

Existing projects may use a section order that already passes `check_readme_status.py`; do not reorder a passing file just to match this list.

Badges, exactly (the only badges allowed):

```
[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
```

Guidelines and Attribution block, exactly:

```
- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for AllensCreations.
```

### CHANGELOG.md

`# Changelog — [Name]`, `---`, then newest release first as `## [X.Y.Z] - YYYY-MM-DD`, grouped under `### Added`, `### Improved & Balanced`, `### Fixed` (bugs described by in-game experience). Entries are `- **Title**: player impact.` No links, URLs, badges, function or event names, hashes, or unverified benefits. Every entry needs at least one bullet; omit headings with no entries. For documentation-only changes, say so and add "No gameplay changes."

## 6. Reply format

1. The `.sh` file, delivered as a downloadable file named `<Repofilename>_<Version>_<RAND>.sh`.
2. Then exactly these steps:

First time only:
```
pkg update -y && pkg install -y git python
termux-setup-storage
git config --global user.name "AllensCreations"
git config --global user.email "your-email@example.com"
git config --global credential.helper store
```

Every update:
```
bash ~/storage/downloads/<Repofilename>_<Version>_<RAND>.sh
```

Download the `.sh` to your Downloads folder first and use its exact file name, including the random characters. At the push prompt, the password is your GitHub Personal Access Token (repo scope), not your account password.

3. One or two sentences stating what changed and which checks were run. List anything unverifiable or not run.
