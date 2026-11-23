---
name: checkrm
description: Audit, repair, and synchronize README, DESCRIPTION, and CHANGELOG documentation and catalogs for the MCPE-Curseforges projects. Use for /checkrm, a repository-wide docs audit, or creating or fixing one project's documentation. Documentation and catalog work only.
---

# checkrm: Documentation Audit

## Authority

- `INSTRUCTIONS.md` is the only policy source. Part 1 is core policy, `DOCS_RULES.md` holds every README, DESCRIPTION, and CHANGELOG rule and template, and its Part 3 holds the audit workflow with the Minecraft Wiki and Bedrock Samples references. This skill is a short working checklist and never restates or overrides them. On any conflict, `INSTRUCTIONS.md` wins.
- There is no separate `README_GUIDELINES.md`. If `INSTRUCTIONS.md` cannot be read, stop and report it instead of working from memory.
- The user's explicit scope and source accuracy outrank any template.
- When the user wants the changes delivered as a Termux script to run on their phone, hand the edits to the `mcpe-pack-update` skill instead of applying them here.

## Scope and Modes

Documentation and catalog maintenance only. Do not change gameplay code, manifests, UUIDs, versions, dependencies, pack settings, assets, workflows, or release configuration unless the user explicitly asks.

- **Repository-wide audit:** the user says `/checkrm`, asks to check all projects, or names no single project.
- **Individual project:** the user names a project, slug, or folder, or asks to create, repair, or update one project's documentation.
- **Documentation-only:** if the user says so, touch no gameplay files, manifests, assets, scripts, or workflows.

Discover the real folder structure first. Do not assume a folder or file exists, and do not silently substitute a similarly named project; report ambiguity or a missing target.

## Procedure

Full wording is in `DOCS_RULES.md`, Section 3.2.

1. **Discover.** Target project, its README, DESCRIPTION, CHANGELOG, manifests, scripts, entities, items, blocks, recipes, functions, loot tables, language files, and assets, plus the category catalog, root README, and `builds/README.md`.
2. **Audit status.** Repository-wide: `python3 scripts/check_readme_status.py`. It reports stubs, incomplete DESCRIPTION files, READMEs that hold product text instead of a download link, broken relative links, and orphaned build directories. If it is absent or fails, inspect manually and report the limitation.
3. **Verify project facts.** Read the source before writing any claim. Never infer a feature from a name alone, and separate implemented from planned behavior. Establish achievement and experiment status by the rules in Part 1, Section 2.
4. **Check references.** Before creating or substantially rewriting a README or DESCRIPTION, read the root README, the category catalog, `builds/README.md`, and two or three well-documented projects of the same category. Reuse conventions, not project-specific claims.
5. **Write or update** by `DOCS_RULES.md`. Project READMEs are version-free download landing pages; the full product text lives in `DESCRIPTION.md` and never carries the release version in its title. Move verified README content into DESCRIPTION before shortening a README. Do not document a feature that is not implemented. Omit installation steps only if the user asks.
6. **Images, badges, links.** Rules: `DOCS_RULES.md` (README: no images or badges; DESCRIPTION: exact template badges, absolute raw GitHub URLs, no placeholders). Confirm each asset exists.
7. **Catalogs and builds.** Check the project's entries in its category catalog, the root README, and `builds/README.md`. Search before adding, keep established ordering, and update only relevant entries. Inspect a build script before running it. `python3 scripts/auto_bump_and_build.py --project "<Project-Name>"` rebuilds packages and syncs catalogs and never changes manifest versions. Never claim a build or sync completed if it failed or was not run.
8. **Verify.**
   1. Re-read the whole edited file; check headings, lists, and links.
   2. Confirm each documented feature has source evidence and no verified content was lost.
   3. `python3 scripts/validate_manifest_titles.py --project <project-path>` when applicable.
   4. `python3 scripts/check_readme_status.py` again. Expect `0` needing update and `[LINK INTEGRITY] All relative links valid`.
   5. For projects under `MCPEDL/Addons/`, check the `LOCK` marker (Part 1, Section 3). Report the exact path of any missing or invalid marker and do not call the project build-ready.
   6. Review the final diff for scope. If a check was not run, say so.
9. **Report.** Projects audited or updated; files changed; commands run and results; missing assets, unresolved links, or unverifiable information; projects still needing attention. Never report success for a check that was not run or did not pass, and never claim every project was audited if some were inaccessible. Every finished output and audit conclusion must always be saved in AI memory for ongoing session and future task continuity.

## Bulk remake

`python3 scripts/check_readme_status.py --remake standardize --all --check` previews; without `--check` it writes. `standardize` keeps product text and fixes structure. `--remake rebuild --project <Name>` rebuilds one project's DESCRIPTION and README from source (`--all` also needs `--confirm-rebuild`). Anything it adds as a default is a placeholder: replace it with verified facts.

## Wiki, Samples and icons

Full rules: `DOCS_RULES.md` 3.3 and 3.4.

- Identifiers, recipes and components come from Mojang Bedrock Samples; display names follow the Minecraft Wiki's Bedrock name, confirmed against `resource_pack/texts/en_US.lang` (the lang file wins; report the disagreement). State the Samples version (`version.json`) a claim was checked against.
- Never title-case an identifier (`hay_block` is Hay Bale). Never document a `[JE only]` item as available.
- Icons and sprites: MCicons ONLY (`reference/mcicons/mcicons-<ver>.tgz`, `scripts/lib/mcicons.py`; ids listed in `docs/mcicons-index.md`). No icon for the id: report it, never substitute. Never copy Wiki images or large Wiki text.
- If `minecraft.wiki` is blocked, report it and do not route around it.
