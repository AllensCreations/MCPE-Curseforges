# CHECKRM Reference: Docs Audit, Wiki and Samples (v1)

Moved from `INSTRUCTIONS.md` Part 3. `INSTRUCTIONS.md` Part 1 wins on conflict; doc rules are in `DOCS_RULES.md`. Numbers 3.x refer to this file; 1.x and 2.x to `INSTRUCTIONS.md`.

### 3.1 Authority and Scope
- `INSTRUCTIONS.md` Part 1 and `DOCS_RULES.md` authoritative. Unreadable: stop, report. NEVER work from memory.
- Docs and catalog maintenance ONLY. NEVER change gameplay code, manifests, UUIDs, versions, deps, pack settings, assets, workflows, release config unless explicitly asked. "Documentation-only" = touch none of those.
- Modes: repo-wide (`/checkrm`, "all projects", no single project named) | single project (name/slug/folder, or create/repair/update one project's docs).
- ALWAYS discover real folder structure first. NEVER assume a path or substitute a similar project. Report ambiguity/missing target.

### 3.2 Procedure
1. Discover: target project, README, DESCRIPTION, manifests, scripts, config, entities, items, blocks, recipes, functions, loot tables, lang files, assets; parent catalog, builds README.
2. Audit by reading (agents do not run `scripts/check_readme_status.py`; the `.sh` runs it). It checks: missing/incomplete docs, add-on READMEs with product info, short map/script READMEs, broken relative links, orphan build dirs. Cover the same ground by hand and report.
3. Verify facts BEFORE writing: what it does, features, activation/config, persistence, packs/deps, versions, limits, achievements/experiments (1.2). NEVER infer a feature from a name. Separate implemented from planned. Verify vanilla names/sprites against 3.3-3.4.
4. References: before creating/rewriting README or DESCRIPTION read category catalog, builds README, 2-3 well-documented same-category projects. Reuse conventions, NEVER project-specific claims. Verify their links/images/claims first.
5. Write per `DOCS_RULES.md`. NEVER add an unimplemented feature because requested. Omit install steps if asked.
6. Images/badges/links: README none. DESCRIPTION 2 template badges + profile banners, no other badges. Other images: requested sprites, recipe diagrams. Confirm assets exist, absolute raw URLs, verify link targets. No placeholders.
7. Sync catalogs and builds: check category catalog, builds README. Update only relevant entries. Search first (no duplicates). Keep ordering. Inspect build scripts before running. The `.sh` or CI runs `scripts/auto_bump_and_build.py --project "<Project-Name>"` (never changes manifest versions). NEVER claim build/sync done if failed or not run.
8. Verify: re-read whole edited file (headings, lists, links); each feature has source evidence, no verified content lost; the `.sh` runs `scripts/validate_manifest_titles.py --project <path>` and `scripts/check_readme_status.py` (expect 0 needing update, `[LINK INTEGRITY] All relative links valid`); LOCK marker for `MCPEDL/Addons/`; review diff for scope. State any check not run.
9. Report under **Changelog** (`INSTRUCTIONS.md` Reply Format): projects audited/updated, files changed, commands + results, missing assets/links/unverifiable info, remaining work. NEVER report success for an unrun or failed check.
- Bulk remake (run by the `.sh` or `remake-docs.yml`, never by the agent): `python3 scripts/check_readme_status.py --remake standardize --all --check` previews; without `--check` writes. `standardize` keeps text, refreshes READMEs as version-free pages, strips versions from DESCRIPTION titles, fixes structure, adds missing CHANGELOG entry. `--remake rebuild --project <Name>` regenerates generic DESCRIPTION/README from source (`--all` needs `--confirm-rebuild`). Defaults (Verification, Achievements, Experimental features) are placeholders: replace with verified facts. `remake-docs.yml` = dry run + PR.

### 3.3 Minecraft Wiki Item Reference
- https://minecraft.wiki/w/Item = official names, grouping, sprite look. ALWAYS together with Samples, NEVER instead.
- Ids, textures, recipes, components: Samples. Display names: Wiki Bedrock name, confirmed against Samples `resource_pack/texts/en_US.lang` (`item.<id>.name`, `tile.<id>.name`). Lang file = in-game truth if Wiki unreachable/disagrees; report disagreement.
- NEVER title-case an identifier (`experience_bottle` = Bottle o' Enchanting, `hay_block` = Hay Bale, `ender_eye` = Eye of Ender, `wooden_door` = Oak Door, `golden_rail` = Powered Rail, `magma` = Magma Block).
- Edition tags `[BE only]`/`[JE only]`. NEVER document a Java-only item as available (Spectral Arrow is not Bedrock).

### 3.4 Mojang Bedrock Samples Reference
- Wiki sprite names: `Invicon_<Title_Case_Name>.png`, `ItemSprite_<lowercase-hyphenated-name>.png`. Look up by Wiki name, NEVER identifier. Fetch with available web tool; shell blocked: report, NEVER route around, fall back to Samples. Image license rules: 1.5.
- Wiki, `en_US.lang`, Samples lag each other. ALWAYS check Samples `version.json`, state the version a claim was verified against.
- Samples = truth for vanilla ids, textures, recipes, components, entities, formats (1.1 source priority). Root `BEDROCK_SAMPLES_ROOT` (workflow clones to `/tmp/bedrock-samples`).
- Layout: `resource_pack/` (`textures/items/`, `textures/blocks/`, `textures/models/armor/`, `textures/ui/`, `attachables/`, `texts/`), `behavior_pack/` (`items/`, `entities/`, `recipes/`, `loot_tables/`).
- Content changes per release: ALWAYS verify checked-out version, confirm each path exists. NEVER hardcode values (armor defense, durability) from memory.
- Ids != texture filenames. Inventory all recipes, map every ingredient, report unresolved together. NEVER placeholder.
- `textures/item_texture.json`, `terrain_texture.json` start with a `//` comment line: strip before parsing. Many vanilla items have no id-keyed entry; many block textures are `.tga`: check both extensions before calling missing.
- Block icons render in game from top+side textures: build isometric view from real faces for cube sprites.
- An id valid elsewhere may not exist in Bedrock (`oak_door` = `wooden_door`). Confirm id appears in Samples recipes/loot tables/trades before documenting.
- Custom items use the add-on's own RP textures. Vanilla `behavior_pack/recipes/` = reference for recipe format, group tags, ingredient ids.
- Checkout missing/asset absent: report. Only GitHub reachable: `git clone --filter=blob:none --sparse` then `git sparse-checkout set --no-cone <paths>`.
- Scale 16x16 textures with nearest-neighbor (`Image.Resampling.NEAREST`).
