---
name: checkrm
description: >-
  Audits, creates, updates, and verifies documentation across the AllensCreations
  MCPE-Curseforges repository. Supports individual project updates and
  repository-wide scans across MCPEDL/addons, MCPEDL/new_addons, MCPEDL/script,
  and MCPEDL/maps. Inspects scripts, manifests, entities, animation controllers,
  language files, recipes, presets, assets, and gameplay mechanics. Creates or
  updates README.md and DESCRIPTION.md files, checks logos and banners, synchronizes parent
  catalogs and build references, and verifies the final documentation status.
  Trigger with /checkrm or requests to create, update, audit, or repair project
  documentation.
---

# checkrm — README and Documentation Audit

## Purpose

Use this skill to audit, create, update, and verify project documentation in the
AllensCreations MCPE-Curseforges repository.

Supported project locations include:

- `MCPEDL/addons`
- `MCPEDL/new_addons`
- `MCPEDL/script`
- `MCPEDL/maps`

The repository may contain additional categories. Discover the actual structure
before making assumptions.

This skill handles documentation and catalog maintenance. Do not change
gameplay code, manifests, pack behavior, assets, or project configuration unless
the user explicitly requests those changes.

## Operating Modes

Choose the mode from the user's request.

### Repository-wide audit

Use this mode when the user says `/checkrm`, asks to check all projects, asks for
a repository-wide README audit, or does not specify a single project.

### Individual project

Use this mode when the user names a project, slug, or project folder, or asks to
create, repair, or update one project's README.

### Documentation-only request

If the user explicitly requests documentation only, do not modify gameplay
files, manifests, assets, scripts, workflows, or pack configuration.

## README Structure and Reference Standards

`INSTRUCTIONS.md` defines shared policy and `README_GUIDELINES.md` is the canonical README/CHANGELOG style guide. This skill defines the audit workflow. Its template is a fallback only and must not override either document or the user's explicit instructions. Inspect existing documentation to learn current conventions.

For individual add-ons, audit both README.md (download-focused landing page) and DESCRIPTION.md (complete customer-facing product information). README.md should include release/download details, package format, generic import steps, and a link to DESCRIPTION.md. When migrating an existing project, move full verified product content into DESCRIPTION.md. Before finishing a documentation audit, verify the project's manifest titles and creator attribution with `python3 scripts/validate_manifest_titles.py --project <project-path>` when applicable. Confirm each title has exactly one `(vX.Y.Z)` suffix matching `header.version`, the manifest description contains `by AllensCreations` exactly once, and paired Behavior Pack/Resource Pack displayed versions match. Include the official [CurseForge](https://www.curseforge.com/members/allenscreations/projects) and [MCPEDL](https://mcpedl.com/user/allenscreations/) profile links in DESCRIPTION.md only.

Before creating or substantially rewriting README.md or DESCRIPTION.md:

1. Inspect the repository root `README.md`, if present.
2. Inspect two or three relevant, well-documented project DESCRIPTION.md files for add-on product content, and README.md files for download-link conventions.
3. Prefer reference projects from the same category as the target.
4. Inspect the relevant category catalog and the builds README, if present.
5. Identify established title style, section order, feature-card conventions,
   compatibility wording, attribution, and formatting. For add-on descriptions,
   do not embed or create images.
6. Reuse appropriate repository conventions without copying project-specific
   features or unsupported claims.
7. If no references are accessible, use the templates and rules in this skill.

Do not assume a reference README is correct just because it exists. Check its
links, image paths, claims, and structure before adopting its conventions.

The embedded template defines the baseline structure. Repository conventions
may add or rearrange sections when that better fits the project category, but
must not override the accuracy and style rules below.

## Required Writing Style

- Use direct, factual, technical language.
- Do not use emojis in headings, bullets, tables, or body text.
- Do not use clickbait hooks, rhetorical questions, hype, buzzwords, or marketing
  filler.
- Avoid phrases such as "Tired of...", "Meet your new best friend",
  "revolutionary", and "production-ready" unless directly required and factually
  justified.
- Do not claim a feature exists unless verified from source files or other
  reliable project evidence.
- Do not claim compatibility, achievement support, performance, security, or
  testing status without evidence.
- Do not invent release versions, download links, screenshots, assets, credits,
  dependencies, or project details.
- Preserve useful verified content in DESCRIPTION.md for add-ons; keep individual add-on README.md files focused on downloading/importing and linking to DESCRIPTION.md.
- Avoid duplicate sections and duplicate catalog entries.
- Do not add raw HTML to README files unless the repository's established
  format or a specific user request requires it.
- Do not include installation instructions when the user explicitly asks to omit
  them.

## Default Add-on README.md Template (Download Focus)

```markdown
# [Add-on Name] (vX.Y.Z)

Download the current release of **[Add-on Name]** for Minecraft Bedrock Edition.

## Download

- **Version:** X.Y.Z
- **Package format:** `.mcaddon`
- **Direct download:** [Download [Add-on Name] (.mcaddon)](verified-direct-download-link)

## Installation

1. Download the package using the link above.
2. Open the downloaded file with Minecraft to import it.
3. If the package contains a pack that must be enabled separately, activate it in your world's settings.

## Add-on Information

For gameplay features, usage details, recipes, compatibility notes, and other project information, read the [full description](verified-DESCRIPTION-link).
```

If no direct release file exists, link only to the relevant official download catalog.

## DESCRIPTION.md Product Page

Use `README_GUIDELINES.md` to create a complete, polished, player-facing product description in DESCRIPTION.md. Preserve verified existing details during migration. Keep source identifiers and developer internals out of public prose.

## Step 1 — Discover the Repository

Before editing, inspect the available repository files and identify:

- The target project directory.
- Its current README, if any.
- Behavior-pack and resource-pack manifests, where applicable.
- Source scripts and configuration.
- Entities, components, animation controllers, animations, render controllers,
  items, blocks, recipes, functions, loot tables, and language files, where
  applicable.
- Images, logos, banners, previews, and other referenced assets.
- Parent category catalog files.
- Root README and build-output README files.
- Existing scripts used to generate, audit, or synchronize documentation.

Do not assume a folder or file exists. Check the actual repository structure.

## Step 2 — Select the Target

For an individual request, use the project path or slug supplied by the user.
Search the supported project folders if the location is unclear.

For a repository-wide audit, inspect all supported project categories that
actually exist. Include any additional project category only when the repository
structure or user request indicates it is in scope.

Do not silently substitute a similarly named project if the requested target
cannot be found. Report the ambiguity or missing target.

## Step 3 — Audit README Status

For repository-wide checks, run the repository's existing status checker when
available:

```bash
python3 scripts/check_readme_status.py
```

Use its output to identify missing or incomplete documentation, including
statuses such as:

- `Not yet written`
- `Logo: Not supplied`
- `Banner: Not supplied`
- Newly scaffolded stubs (e.g., contains `## Source Files`, `Review the included manifests...`, or generic one-line descriptions)
- Incomplete DESCRIPTION.md files missing gameplay sections (`## Overview`, `## Features`, `## How It Works`)
- Missing `README.md` or `DESCRIPTION.md` for an individual add-on
- Individual add-on README.md files containing product information instead of only a download link
- Broken relative markdown links or image targets across all repository catalogs and build readmes

The script automatically audits relative links in repository README.md and DESCRIPTION.md files and reports dead links or orphaned build directories.

Use `python3 scripts/check_readme_status.py --fix` to automatically generate standard documentation for any detected stubs.

If the script is absent or fails, inspect project folders and README files
manually. Report the limitation rather than pretending the audit succeeded.

For individual add-ons, inspect README.md for download-link-only compliance and DESCRIPTION.md for complete, accurate product information. For maps and scripts, follow the appropriate category-specific documentation format.

## Step 4 — Verify Project Information

Read the relevant project files before writing claims.

For Minecraft Bedrock add-ons, inspect applicable files such as:

- `manifest.json` in each pack.
- JavaScript or TypeScript entry points.
- Entity JSON files and component groups.
- Item, block, recipe, loot-table, and function files.
- Animation and render-controller files.
- Animation controllers.
- Resource definitions and textures.
- Language files and user-facing strings.
- Behavior-pack and resource-pack relationships.
- Configuration properties, presets, and subpacks.

For scripts, maps, and other projects, inspect their actual entry points,
configuration, dependencies, assets, and usage instructions.

Determine, when evidence permits:

- What the project does.
- Which features are implemented.
- How features are activated or configured.
- Whether settings persist.
- Required packs, modules, dependencies, or experiments.
- Supported version information.
- Known limitations.
- Whether achievement-friendly behavior is supported.
- What assets are available for DESCRIPTION.md.

Do not infer a feature from a name alone. Confirm it from implementation or
reliable documentation.

## Step 5 — Check Logos, Banners, and Preview Images

Keep individual add-on README.md files image-free. In add-on DESCRIPTION.md,
allow only item sprites and crafting recipe diagrams as images. Do not add
promotional banners, generic screenshots, or unrelated artwork. Verify all
image targets and use absolute raw GitHub URLs for published embeds. Crafting
diagrams must follow the source-based workflow in INSTRUCTIONS.md: use `assets/CRAFTINGBOARD.PNG` as the required board reference, put all ingredients in one vertical column only, and use recognizable inventory-style Minecraft item icons for ingredients and output. Keep ingredient identities, requirements, result, and count faithful to the actual recipe JSON. The image is a simplified guide rather than a literal crafting-grid pattern. If the reference asset is missing at that path, report it instead of guessing or substituting a board.

## Step 6 — Create or Update Project Documentation

For add-ons, write product information to DESCRIPTION.md and keep README.md limited to the download link. For other project categories, follow the user's latest explicit direction and repository standards.

For add-ons, include relevant sections from the following list:

1. Project title.
2. Verified banner or logo.
3. Relevant, working badges.
4. Creator and concise description.
5. Overview.
6. Features.
7. How It Works or Mechanics.
8. Configuration or settings, if present.
9. Compatibility and requirements.
10. Installation, when appropriate and not prohibited.
11. Known limitations, when verified.
12. Credits and permissions.
13. Copyright notice.

Not every section is required for every project. Do not add empty headings or
irrelevant sections just to match a template.

For scripts and tools, document purpose, requirements, usage, configuration,
and limitations when supported by evidence.

For maps, document the gameplay premise, objectives, included content,
requirements, and known limitations when supported by evidence.

For any project:

- Use the actual project name and correct project type.
- Keep descriptions concise, polished, player-focused, and factual; avoid hype and filler.
- Explain meaningful features rather than listing unsupported claims.
- Never claim achievement support, no experimental features, compatibility, performance, or testing status without evidence.
- Individual add-on README.md files must be image-free. DESCRIPTION.md may embed item sprites and crafting recipe diagrams only; verify those assets exist and use absolute raw GitHub URLs. Other project categories and catalogs may follow their own image rules.
- Verify that every link destination exists.
- Keep formatting consistent with verified repository conventions.
- Do not include internal analysis or instructions to the assistant in the
  published README.
- Do not include a feature merely because it was requested if it was not
  implemented.

## Step 7 — Verify Badges and Compatibility Claims

Before including badges, verify the relevant information and destination.

- Minecraft version badges must match verified project information.
- Release badges must point to a real release or valid repository destination.
- Achievement-friendly claims must be supported by the implementation or
  reliable testing evidence.
- Format badges must accurately describe the project.
- Do not use placeholders such as `verified-version-badge` in a finished README.
- Remove badges that cannot be verified.
- Do not state that a project was tested on a version unless evidence confirms
  that testing occurred.
- Do not claim that experiments are unnecessary unless the project setup and
  implementation support that statement.

## Step 8 — Document Features and Mechanics Accurately

For each documented feature, identify the source or other evidence supporting
 the claim.

Explain mechanics clearly enough for a user or developer to understand them.
Where applicable, document:

- Default behavior.
- User-configurable options.
- Toggles and presets.
- Controls or activation conditions.
- Persistent versus temporary settings.
- Required pack combinations.
- Important limitations or edge cases.

Distinguish implemented behavior from planned behavior. Do not promise future
features unless the user explicitly asks to document a roadmap.

## Step 9 — Handle Installation Instructions Carefully

Include installation instructions when they are useful and supported by the
project format.

For Minecraft Bedrock add-ons, verify the available pack files and actual
activation requirements before writing the instructions.

If the user says not to include installation instructions, omit the entire
installation section. Do not reintroduce it in another section.

Do not invent download locations, file names, or installation steps.

## Step 10 — Synchronize Catalogs and Build Documentation

After updating a project's README.md and/or DESCRIPTION.md, inspect the repository to determine whether
the project is listed in:

- Its category catalog.
- The root README or project index.
- The builds README or other generated documentation.

Update only relevant entries. Preserve established ordering and formatting.

Before adding an entry, search for an existing entry to avoid duplication.
Verify paths and links. Do not create a new catalog file if the repository uses
an existing catalog structure.

If the repository provides an established build or synchronization script,
inspect its usage and effects before running it.

A known command may be:

```bash
python3 scripts/auto_bump_and_build.py --project "<Project-Name>" --no-bump
```

Run it only if the script exists and its behavior is appropriate for the task.
Use `--no-bump` when updating documentation without intentionally incrementing a
project version. Do not run a version bump unless the user explicitly requests
one.

Do not claim that a build or synchronization completed if the command failed or
was not run.

## Step 11 — Verify the Final Changes

After editing:

1. Re-read the complete target README.
2. Check headings, lists, tables, badges, and links; confirm README.md files contain no images and DESCRIPTION.md images are limited to item sprites and crafting recipe diagrams.
3. Check that each documented feature is supported by project evidence.
4. Check that no placeholders remain in finished documentation.
5. Check that no duplicate catalog entries were introduced.
6. Check that existing verified content was not accidentally removed.
7. Run the repository's documentation status checker, which audits README/DESCRIPTION status and relative links across product pages, catalogs, and builds:

```bash
python3 scripts/check_readme_status.py
```

Ensure output shows `0` needs update and confirms `[LINK INTEGRITY] All relative links valid`. If any broken link is detected, resolve it immediately before committing.
8. If the repository has a suitable validation or build command, run it when
   appropriate and safe.
9. Review the final diff and ensure changes remain within the user's requested
   scope.

If a check cannot be run, state that it was not run. Do not report unverified
success.

## Repository-Wide Audit Procedure

When the user requests `/checkrm` or a repository-wide audit:

1. Discover all relevant project folders and catalogs.
2. Run `python3 scripts/check_readme_status.py` if available.
3. Review the status report and identify missing or incomplete documentation.
4. Inspect each affected project and its actual implementation.
5. Inspect reference READMEs to confirm current repository conventions.
6. Create or repair each README using verified project information.
7. Check badges and links; confirm add-on descriptions use only permitted item sprites and crafting recipe diagrams.
8. Synchronize relevant catalogs and generated documentation.
9. Run appropriate repository scripts without unintended version changes.
10. Run the status checker again.
11. Review the diff and summarize completed work, remaining issues, and checks
    that could not be performed.

Do not claim that every project was audited if some folders or files were
inaccessible or excluded.

## Individual Project Update Procedure

When the user requests a single project update:

1. Locate the exact project.
2. Inspect its existing README and source files.
3. Inspect relevant reference READMEs and catalogs.
4. Identify missing, stale, or inaccurate documentation.
5. Create or update the README.
6. Verify badges, links, and claims; keep README.md image-free and limit DESCRIPTION.md images to item sprites and crafting recipe diagrams.
7. Update relevant catalogs only when necessary.
8. Run applicable validation commands.
9. Review the final diff.
10. Report the files changed and any remaining uncertainty.

## Clarify Material Ambiguities

If source files or existing rules leave a decision unresolved that could materially affect gameplay, compatibility, user data, release/version behavior, or distribution, ask the user before implementing that decision. For ordinary documentation choices, apply `INSTRUCTIONS.md` and `README_GUIDELINES.md` and proceed.

## Change Boundaries and Safety

Unless explicitly requested, do not:

- Change gameplay logic or source code.
- Change manifests, UUIDs, version numbers, dependencies, or pack settings.
- Modify, remove, or create project assets.
- Change workflows or release configuration.
- Publish releases or upload files.
- Perform a version bump.
- Delete project files.
- Replace project-specific information with assumptions.
- Make unrelated formatting changes across the repository.

Documentation changes must reflect the actual project, not change the project to
match the README.

## Completion Report

After the work, provide a concise factual summary that includes:

- Projects audited or updated.
- README.md files created or changed.
- DESCRIPTION.md files created or changed.
- Catalog or build documentation files changed.
- Validation commands run and their results.
- Missing assets, unresolved links, or information that could not be verified.
- Any remaining projects that need attention.

Never report a successful check, build, synchronization, or test unless its
result confirms success.

## Add-on LOCK Marker Audit

For projects under `MCPEDL/addons/` and `MCPEDL/new_addons/`, verify that the project root contains a `LOCK` file beginning with `AllensCreations Add-on Lock v1`. Missing or invalid markers are release-blocking: report the exact project path and do not claim the project is build-ready. Confirm the scaffold workflow creates the marker and the build script enforces it. The marker is only a repository/build safeguard; it does not encrypt source, stop source edits, or prevent extraction of a distributable package.

