# Scripts and Workflows (summary)

Generated from the module docstrings in `scripts/` and the files in `.github/workflows/`. Rebuilt by `python3 scripts/build_context7_docs.py`. A script that must RUN needs its complete file (kit zip `files/`), never this summary.

## Workflows

| File | Name | Triggers | Scripts it runs |
| :--- | :--- | :--- | :--- |
| `build-and-sync.yml` | Build Changed Packs & Sync Catalogs | push, schedule, workflow_dispatch | scripts/migrate_three_part_versions.py<br>scripts/manifest_tools.py<br>scripts/ensure_recipe_unlocks.py<br>scripts/pixel_json_to_png.py<br>scripts/make_pack_icon.py<br>scripts/auto_bump_and_build.py<br>scripts/build_oneblock_variants_from_template.py<br>scripts/sync_oneblock_map_readmes.py<br>scripts/step_summary.py<br>scripts/sync_readme_links.py<br>scripts/build_changelog_views.py<br>scripts/remake_docs.py<br>scripts/convert_crafting_recipe_svgs_to_png.py<br>scripts/generate_recipe_images.py<br>scripts/recipe_image_report.py<br>scripts/build_listing_kits.py<br>scripts/sync_mcicons.py<br>scripts/build_bedrock_reference.py<br>scripts/sync_minecraft_types.py<br>scripts/bundle_bedrock_reference_pack.py<br>scripts/auto_ai_review.py<br>scripts/build_mcpedl_readme.py<br>scripts/validate_manifest_titles.py<br>scripts/check_manifest_versions.py<br>scripts/check_readme_status.py<br>scripts/git_push_retry.py |
| `build-center-ci.yml` | Build Center CI | pull_request, push | - |
| `ci.yml` | CI | pull_request, workflow_dispatch | scripts/migrate_three_part_versions.py<br>scripts/manifest_tools.py<br>scripts/validate_manifest_titles.py<br>scripts/check_manifest_versions.py<br>scripts/sync_dispatch_choices.py<br>scripts/check_instruction_files.py<br>scripts/build_context7_docs.py<br>scripts/selftest_project_types.py<br>scripts/run_repo_tests.py |
| `create-project-from-base64.yml` | Create Project from Base64 | workflow_dispatch | scripts/import_project_payload.py<br>scripts/build_oneblock_variants_from_template.py<br>scripts/sync_oneblock_map_readmes.py |
| `delete-project.yml` | Delete Package | workflow_dispatch | scripts/delete_project.py<br>scripts/git_push_retry.py |
| `generate-recipe-images.yml` | Generate Crafting Recipe Images | workflow_dispatch | scripts/convert_crafting_recipe_svgs_to_png.py<br>scripts/sync_mcicons.py<br>scripts/generate_recipe_images.py<br>scripts/git_push_retry.py |
| `optimize-images.yml` | Optimize Images | push, workflow_dispatch | scripts/optimize_images.py |
| `publish-curseforge.yml` | Publish to CurseForge | workflow_dispatch | scripts/migrate_three_part_versions.py<br>scripts/auto_publish_curseforge.py<br>scripts/git_push_retry.py |
| `register-curseforge-id.yml` | Register CurseForge ID | workflow_dispatch | scripts/register_curseforge_id.py<br>scripts/sync_dispatch_choices.py<br>scripts/fetch_curseforge_logo.py |
| `remake-docs.yml` | Remake Docs (README, DESCRIPTION, CHANGELOG) | workflow_dispatch | scripts/check_readme_status.py |

## AI review workflow

`build-and-sync.yml` runs `python3 scripts/auto_ai_review.py` and uploads the `ai-review-bundle` artifact. It ignores pushes that only touch `docs/**` or `context7.json`. The review prompt (`AI_PROMPT` in `scripts/collect_ai_review.py`) holds no rules: it tells the reviewer to query this documentation once.

- `collect_ai_review.py`: builds one export, or a shared kit zip (`New-Pack.zip`, `Maintenance.zip`: map text + scripts under `files/`; update scripts are packaged per-pack).
- `auto_ai_review.py`: refreshes the per-pack export of every pack whose files changed (hash stamps).

## Scripts

- `scripts/apply_update.py`: Search-and-replace updater for ALNStudios/MCPE-Curseforges (runs inside every update .sh).
- `scripts/auto_ai_review.py`: Refresh the AI review file of every package whose files changed.
- `scripts/auto_bump_and_build.py`: Pack Builder and Catalog Registrar for MCPE-Curseforges.
- `scripts/auto_publish_curseforge.py`: Manually publish one pack to CurseForge using its registered project ID.
- `scripts/build_bedrock_reference.py`: Turn a checkout of Mojang/bedrock-samples into ONE minimal JSON reference for add-on work.
- `scripts/build_changelog_views.py`: Build folded changelog views from the plain CHANGELOG.md of each project.
- `scripts/build_context7_docs.py`: Regenerate the generated Context7 pages in docs/ from the repo's own files.
- `scripts/build_listing_kits.py`: Build one Listing Kit per pack: every text you paste into a CurseForge listing, in one Markdown page.
- `scripts/build_mcpedl_readme.py`: Builds MCPEDL/README.md: every pack grouped by type, with Version, Source, Package and AI review.
- `scripts/build_oneblock_variants_from_template.py`: Build database-free OneBlock void worlds from the authoritative Mcpeworlds foundations.
- `scripts/build_payload.py`: Project payload builder v9 for ALNStudios/MCPE-Curseforges.
- `scripts/bundle_bedrock_reference_pack.py`: Bundles Bedrock reference materials into a unified FLAT zip distribution: reference/bedrock-samples/bedrock-reference-pack-<version>.zip
- `scripts/check_instruction_files.py`: Fail when INSTRUCTIONS.md or PACK_GENERATOR_INSTRUCTIONS.md break the repo rules.
- `scripts/check_loot_tables.py`: Compare a pack's loot tables with the vanilla tables in Mojang's bedrock-samples.
- `scripts/check_manifest_versions.py`: Check every pack manifest under MCPEDL/ for version problems that break imports or builds.
- `scripts/check_readme_status.py`: Scanner and Updater for add-on README.md and DESCRIPTION.md documentation status across MCPE-Curseforges.
- `scripts/collect_ai_review.py`: Build the AI review export of the given paths, or one of the three shared kits.
- `scripts/convert_crafting_recipe_svgs_to_png.py`: Export SVG assets to PNG. Crafting-table PNG is a derivative of CRAFTING_TABLE.svg, never a separate reference.
- `scripts/decompress_bedrock_samples.py`: Decompresses reference/bedrock-samples/bedrock-samples.min.json.gz into individual clean JSON and lang files inside a target directory (defaults to reference/bedrock-samples/decompressed/).
- `scripts/delete_project.py`: Delete Package: remove one package from MCPEDL/ and everything that depends on it.
- `scripts/doc_template.py`: Strict README, DESCRIPTION, and CHANGELOG template check (Part 2). Used by build_payload.py and as an audit tool.
- `scripts/ensure_recipe_unlocks.py`: Ensure every custom shaped/shapeless crafting recipe is always unlocked.
- `scripts/fetch_curseforge_logo.py`: Use a project's CurseForge logo as pack_icon.png for packs that have none.
- `scripts/generate_recipe_images.py`: Generate crafting recipe diagrams for ANY add-on pack (general generator, not tied to one pack).
- `scripts/git_push_retry.py`: Rebase onto the remote branch and push, retrying when another workflow pushed first.
- `scripts/import_project_payload.py`: Import a base64 ZIP produced by an AI agent into the repository.
- `scripts/make_lib_readmes.py`: Create behavior_pack/scripts/lib/README.md for packs that have a main.js (the AI review notes of the pack's scripts).
- `scripts/make_pack_icon.py`: Guarantee every pack has a valid pack_icon.png (256x256 PNG, pack root).
- `scripts/make_pack_script.py`: Pack script builder for ALNStudios/MCPE-Curseforges.
- `scripts/make_update_script.py`: Update script builder for ALNStudios/MCPE-Curseforges.
- `scripts/manifest_tools.py`: Manifest helpers shared by the build, publish and maintenance scripts.
- `scripts/migrate_three_part_versions.py`: One-time migration from legacy X.Y.Z.A (Release.Alpha.Beta.Update) to X.Y.Z (Release.Beta.Update).
- `scripts/optimize_images.py`: (no description)
- `scripts/pixel_json_to_png.py`: Turn pixel JSON into PNG textures. Standard library only (no Pillow), so it runs in Termux, GitHub and any AI sandbox.
- `scripts/prepare_curseforge_upload.py`: Build a pack and prepare its latest changelog entry for CurseForge.
- `scripts/prune_old_builds.py`: Prune old build snapshots across builds/ directories.
- `scripts/recipe_image_report.py`: Recipe image report for every pack. Report only: it never writes images and exits 0 unless --strict.
- `scripts/register_curseforge_id.py`: Save a pack's CurseForge project ID in builds/Curseforge_IDs.json (the one shared registry).
- `scripts/remake_docs.py`: Remake README.md, DESCRIPTION.md, and CHANGELOG.md for every project (or one) to the Part 2 standard.
- `scripts/rename_brand.py`: One-time migration: rename the creator brand across the whole repository.
- `scripts/rename_packages.py`: Rename every package to '<Shortcut> VX.Y.Z.<ext>' and repair every text reference to the old names.
- `scripts/run_repo_tests.py`: Whole-repo test runner for ALNStudios/MCPE-Curseforges.
- `scripts/selftest_project_types.py`: End-to-end self-test of the addon / map / script pipeline, in a throwaway copy of the repo.
- `scripts/step_summary.py`: Run a command, show its output in the log and add it to the GitHub step summary.
- `scripts/sync_dispatch_choices.py`: Keep the "Registered pack" dropdown of Publish to CurseForge in sync with the saved CurseForge IDs.
- `scripts/sync_manifest_versions.py`: Sync pack manifest versions, UUID references, and engine versions for MCPEDL projects, or verify them.
- `scripts/sync_mcicons.py`: Download the pinned MCicons release (iMumd/mcicons) into reference/mcicons/ as ONE file: mcicons-<version>.tgz.
- `scripts/sync_minecraft_types.py`: Syncs official Minecraft Bedrock Script API TypeScript definition (.d.ts) files from npm (@minecraft/server, @minecraft/server-ui, @minecraft/server-admin, @minecraft/server-net) into reference/typescript-definitions/.
- `scripts/sync_oneblock_map_readmes.py`: Synchronize README.md files for opted-in OneBlock map projects.
- `scripts/sync_project_docs.py`: Keep each project's DESCRIPTION.md heading version and CHANGELOG.md newest entry in step with its manifest version.
- `scripts/sync_readme_links.py`: Make every README in the repository agree with the real builds: fix download links, versions, and report broken links.
- `scripts/validate_manifest_titles.py`: Validate Minecraft Bedrock pack titles and three-part project versions.
- `scripts/lib/build_description_views.py`: Renderer library: the CurseForge description HTML built from a pack's DESCRIPTION.md.
- `scripts/lib/build_image_prompts.py`: Library: the Logo and Banner image prompt text built from a pack's DESCRIPTION.md.
- `scripts/lib/crafting_template.py`: Canonical renderer for the sole crafting-board source: scripts/CRAFTING_TABLE.svg.
- `scripts/lib/mcicons.py`: Minecraft item and block icons, read straight out of the MCicons release file reference/mcicons/mcicons-<ver>.tgz.

## Key snippets

### `scripts/apply_update.py` (docstring)

```text
Search-and-replace updater for ALNStudios/MCPE-Curseforges (runs inside every update .sh).

Applies a small text spec to a project instead of rewriting whole files. All-or-nothing: every edit is
checked in memory first, nothing is written if any edit fails. Safe to run twice (applied edits are skipped).

Spec format (lines starting with "@@ " are directives; a content line that must start with "@@" is written
"@@@"; the first "@" is removed):
  @@ version 1.2.4                      new X.Y.Z (must be the current highest + 0.0.1, or already applied)
                                        repo level (@@ project .): just the number, e.g. @@ version 80 (= REPO_VERSION + 1)
  @@ project MCPEDL/Addons/Mining-Helmet   folder every @@ file path is relative to ("." = repo root, no version step)
  @@ file behavior_pack/scripts/main.js
  @@ replace                            exact text that must occur ONCE (partial lines are fine)
  old text
  @@ with
  new text
  @@ replace-all ... @@ with ...        every occurrence
  @@ insert-after / @@ insert-before    anchor line(s) occurring once, then @@ with + the lines to insert
  @@ delete                             exact text occurring once (whole lines remove their newline too)
  @@ append                             text added to the end (skipped when already there)
  @@ create                             new file (error when it exists with other content)
  @@ overwrite                          whole-file replacement (only for new content over 60% of the file)
  @@ changelog Update Name              project CHANGELOG.md entry "## [X.Y.Z] - date - Update Name" + body
  @@ root-changelog Update Name         optional; default = same name and body in the root CHANGELOG.md
Block text is the lines between directives, joined with newlines (no trimming). Put no blank line before the
next directive unless the text needs it.

Usage: python3 scripts/apply_update.py SPEC --date YYYY-MM-DD [--root DIR] [--dry-run] [--touched FILE]
Exit: 0 ok, 1 spec or match error, 3 version is stale, 4 validation failed.
```

### `scripts/make_update_script.py` (docstring)

```text
Update script builder for ALNStudios/MCPE-Curseforges.

Turns a search-and-replace spec (format: see scripts/apply_update.py) into ONE Termux .sh named
<Repofilename>_<Version>_<Rand>.sh. The spec travels inside the .sh as a comment block, so the file is
small, readable and the only thing delivered. The .sh pulls, applies the edits with apply_update.py
(exact unique match, all-or-nothing, idempotent), sets the manifest version, writes both changelogs,
commits and pushes.

File removal: a line "@@ delete-file <path or glob>" (repo-root-relative, tracked files only, * does not cross a
folder, e.g. "scripts/old.py" or "MCPEDL/*/*/test_world.json") makes the .sh run "git rm" on every match. The
line is taken out of the spec before apply_update.py reads it, so older copies of apply_update.py still work.

Usage: python3 make_update_script.py spec.txt [--rand k7q2x] [--out-dir .] [--verify PATH_TO_REPO_CLONE]
  --verify  dry-runs the spec against a local clone and refuses to build if any edit would fail.
Run the .sh:  bash ~/storage/downloads/<file>.sh
```
