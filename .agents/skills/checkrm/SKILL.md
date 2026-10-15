---
name: checkrm
description: >-
  Audits, creates, updates, and verifies documentation across the AllensCreations
  MCPE-Curseforges repository. Supports individual project updates and
  repository-wide scans across MCPEDL/addons, MCPEDL/new_addons, MCPEDL/script,
  and MCPEDL/maps. Inspects scripts, manifests, entities, animation controllers,
  language files, recipes, presets, assets, and gameplay mechanics. Creates or
  updates README.md files, checks logos and banners, synchronizes parent
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

The README template in this skill is the fallback standard. When repository
files are accessible, inspect existing documentation to learn the repository's
current conventions.

Before creating or substantially rewriting a README:

1. Inspect the repository root `README.md`, if present.
2. Inspect two or three relevant, well-documented project READMEs, if available.
3. Prefer reference projects from the same category as the target.
4. Inspect the relevant category catalog and the builds README, if present.
5. Identify the established badge formats, title style, banner placement,
   section order, image-link conventions, feature tables, compatibility wording,
   attribution, and formatting.
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
- Preserve useful verified content in an existing README.
- Avoid duplicate sections and duplicate catalog entries.
- Do not add raw HTML to README files unless the repository's established
  format or a specific user request requires it.
- Do not include installation instructions when the user explicitly asks to omit
  them.

## Default Add-on README Template

Use this template when no suitable repository reference exists. Replace
placeholders with verified information. Remove optional badges or sections when
their destinations or claims cannot be verified.

```markdown
# [Project Name] — [Project Type]

![Project Banner](verified-relative-banner-path)

[![Minecraft Bedrock](verified-version-badge)](verified-destination)
[![Achievement Friendly](verified-achievement-badge)](verified-destination)
[![Release](verified-release-badge)](verified-destination)
[![Format](verified-format-badge)](verified-destination)

Creator: AllensCreations

[Concise factual description of the project.]

---

## Overview

Explain what the project does and what players can expect.

## Features

List only verified features.

## How It Works

Explain actual gameplay mechanics, controls, interactions, and configuration.

## Compatibility

Document verified requirements and known limitations. Do not guess the
Minecraft version or claim achievement compatibility without evidence.

## Credits and Permissions

- Creator: AllensCreations.
- Give appropriate credit when featuring the project.
- Do not re-upload the project or bypass its official distribution channels.
- All rights reserved for AllensCreations.

---

Copyright AllensCreations.
```

The template is a baseline, not a requirement to keep sections that do not fit a
project. For scripts, maps, tools, and other non-add-on projects, adapt the
sections to describe the actual project type.

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
- Incomplete documentation missing gameplay sections (`## Overview`, `## Features`, `## How It Works`)
- Missing `README.md`

Use `python3 scripts/check_readme_status.py --fix` to automatically generate standard documentation for any detected stubs.

If the script is absent or fails, inspect project folders and README files
manually. Report the limitation rather than pretending the audit succeeded.

For individual projects, inspect the target README directly and check whether
it is missing, incomplete, stale, or inconsistent with the source files.

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
- What assets are available for the README.

Do not infer a feature from a name alone. Confirm it from implementation or
reliable documentation.

## Step 5 — Check Logos, Banners, and Preview Images

Look for existing project logos, banners, screenshots, and previews in the
repository.

- Reuse existing relevant assets when appropriate.
- Verify each relative path and filename.
- Do not invent an asset path or use a broken image link.
- Do not label a logo or banner as supplied unless the asset exists.
- Do not create or replace image assets unless the user asks for that work.
- If no image is available, omit the image or use the repository's established
  missing-image convention, if one exists.
- Use only images relevant to the target project.

## Step 6 — Create or Update the README

Write a README that fits the project category and repository style.

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
- Keep descriptions concise and factual.
- Explain meaningful features rather than listing unsupported claims.
- Use relative image paths that resolve from the README location.
- Use working links only.
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

After updating a project's README, inspect the repository to determine whether
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
2. Check headings, lists, tables, badges, image paths, and links.
3. Check that each documented feature is supported by project evidence.
4. Check that no placeholders remain in finished documentation.
5. Check that no duplicate catalog entries were introduced.
6. Check that existing verified content was not accidentally removed.
7. Run the repository's README status checker, when available:

```bash
python3 scripts/check_readme_status.py
```

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
7. Check logos, banners, badges, and image paths.
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
6. Verify images, badges, links, and claims.
7. Update relevant catalogs only when necessary.
8. Run applicable validation commands.
9. Review the final diff.
10. Report the files changed and any remaining uncertainty.

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
- README files created or changed.
- Catalog or build documentation files changed.
- Validation commands run and their results.
- Missing assets, unresolved links, or information that could not be verified.
- Any remaining projects that need attention.

Never report a successful check, build, synchronization, or test unless its
result confirms success.
