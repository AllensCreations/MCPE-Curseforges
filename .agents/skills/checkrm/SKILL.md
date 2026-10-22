# checkrm: Documentation Audit, Bedrock Samples and Minecraft Wiki Reference

## Authority

- `INSTRUCTIONS.md` (core policy) and `README_GUIDELINES.md` (all README, DESCRIPTION, and CHANGELOG rules and templates) are authoritative. This skill defines only the audit workflow and the Samples and Wiki references. It does not restate or override them. If either file cannot be read, stop and report it instead of working from memory.
- The user's explicit scope and source accuracy outrank any template.

## Scope and Modes

Handles documentation and catalog maintenance only. Do not change gameplay code, manifests, UUIDs, versions, dependencies, pack settings, assets, workflows, or release configuration unless the user explicitly asks.

- **Repository-wide audit:** the user says `/checkrm`, asks to check all projects, or names no single project.
- **Individual project:** the user names a project, slug, or folder, or asks to create, repair, or update one project's documentation.
- **Documentation-only:** if the user says so, touch no gameplay files, manifests, assets, scripts, or workflows.

Discover the actual folder structure first. Do not assume a folder or file exists, and do not silently substitute a similarly named project; report ambiguity or a missing target.

## Procedure

### 1. Discover

Identify the target project, its current README and DESCRIPTION, manifests, scripts and configuration, entities, items, blocks, recipes, functions, loot tables, animations, language files, and assets, plus the parent category catalog, root README, and builds README.

### 2. Audit status

For repository-wide checks run:

```bash
python3 scripts/check_readme_status.py
```

It reports missing or incomplete documentation (for example `Not yet written`, scaffold stubs containing `## Source Files`, DESCRIPTION files missing gameplay sections, README files that contain product information instead of a download link, and broken relative links or orphaned build directories). `--fix` generates standard documentation for detected stubs; review its output before keeping it. If the script is absent or fails, inspect manually and report the limitation.

### 3. Verify project facts

Read the relevant files before writing any claim: manifests, entry points, entity and component files, items, blocks, recipes, functions, loot tables, language files, pack relationships, and settings. For scripts and maps, read their real entry points, configuration, and usage.

Establish, when evidence permits: what the project does, which features exist, how they are activated or configured, whether settings persist, required packs and dependencies, supported versions, known limitations, and achievement and experiment status (classification rules are in `INSTRUCTIONS.md`). Never infer a feature from a name alone, and distinguish implemented behavior from planned behavior.

When a document names a vanilla item or block, verify its name and sprite against the Minecraft Wiki and Bedrock Samples sections below instead of writing it from memory or title-casing the identifier.

### 4. Check references before writing

Before creating or substantially rewriting a README or DESCRIPTION, read the root README, the category catalog, the builds README, and two or three well-documented projects of the same category. Reuse conventions, not project-specific claims. Verify a reference's links, image paths, and claims before adopting anything from it.

### 5. Write or update

Follow `README_GUIDELINES.md` for file roles, writing rules, and templates. Migrating an older add-on moves verified README content into DESCRIPTION.md and leaves a download-only README. Do not add a feature merely because it was requested if it is not implemented. Omit installation steps entirely if the user asks.

### 6. Images, badges, links

- README.md files contain no images. DESCRIPTION.md images are limited to requested item sprites and crafting diagrams, following the recipe image rules in `INSTRUCTIONS.md`. Confirm every image exists and use absolute raw GitHub URLs.
- Do not add badges. Verify any existing badge and its destination, or remove it. Leave no placeholders in finished files.
- Verify that every link destination exists.

### 7. Synchronize catalogs and builds

Check whether the project appears in its category catalog, the root README, and the builds README. Update only relevant entries, search first to avoid duplicates, and keep established ordering. Inspect any build script before running it. A known command:

```bash
python3 scripts/auto_bump_and_build.py --project "<Project-Name>" --no-bump
```

Use `--no-bump` unless the user explicitly requests a version bump. Never claim a build or sync completed if it failed or was not run.

### 8. Verify

1. Re-read the whole edited file, and check headings, lists, and links.
2. Confirm each documented feature has source evidence and that no verified content was lost.
3. Run `python3 scripts/validate_manifest_titles.py --project <project-path>` when applicable: one `(vX.Y.Z)` suffix matching `header.version`, `by AllensCreations` exactly once in the manifest description, and matching Behavior Pack and Resource Pack versions.
4. Run `python3 scripts/check_readme_status.py` again. Expect `0` needing update and `[LINK INTEGRITY] All relative links valid`; fix broken links before finishing.
5. Check the add-on LOCK marker (rule in `INSTRUCTIONS.md`) for projects under `MCPEDL/addons/` and `MCPEDL/new_addons/`. Report the exact project path of any missing or invalid marker and do not call the project build-ready.
6. Review the final diff for scope. If a check was not run, say so.

### 9. Report

State briefly: projects audited or updated; README, DESCRIPTION, catalog, and build files changed; commands run and results; missing assets, unresolved links, or unverifiable information; remaining projects needing attention. Never report success for a check that was not run or did not pass, and never claim every project was audited if some were inaccessible.

## Minecraft Wiki Item Reference

The [Minecraft Wiki item list](https://minecraft.wiki/w/Item) is the reference for official item names, how items are grouped, and what their inventory sprites look like. Use it together with Bedrock Samples, never instead of it.

- **Division of authority:**
  - Item and block **identifiers**, textures, recipes, and components come from Bedrock Samples (the Wiki page does not list internal IDs).
  - Player-facing **display names** follow the Wiki's item name for Bedrock Edition, confirmed against `resource_pack/texts/en_US.lang` in Samples (keys such as `item.<id>.name` and `tile.<id>.name`). The lang file is the in-game truth when the Wiki is unreachable or disagrees; report any disagreement instead of picking silently.
  - Never derive a display name by title-casing an identifier. Vanilla names often differ from IDs (for example `experience_bottle` is Bottle o' Enchanting, `hay_block` is Hay Bale, `ender_eye` is Eye of Ender, `wooden_door` is Oak Door, `golden_rail` is Powered Rail, `magma` is Magma Block).
- **Edition tags:** the item list marks entries `[BE only]` or `[JE only]`. Do not document or sell an item as available if it is Java-only. Spectral Arrow, for example, is not a Bedrock item.
- **Sprite naming on the Wiki:** inventory renders are `Invicon_<Title_Case_Name>.png` (for example `Invicon_Acacia_Button.png`) and flat sprites are `ItemSprite_<lowercase-hyphenated-name>.png` (for example `ItemSprite_acacia-boat.png`). Look sprites up by the Wiki name, not the identifier.
- **Fetching:** use WebFetch or WebSearch on the page. Shell access to `minecraft.wiki` is often blocked by network policy; if a request is refused, report it, do not route around it, and fall back to Bedrock Samples (`en_US.lang` for names, `textures/` for sprites).
- **Licensing and images:** Wiki text and images are community content under their own license and Mojang's asset terms. Do not copy Wiki images or large blocks of Wiki text into the repository unless the user asks and the license and attribution are handled. By default, generate sprites and recipe diagrams from Bedrock Samples textures, and use the Wiki only to confirm names, edition availability, and what an icon should look like.
- **Mismatches:** the Wiki, `en_US.lang`, and Samples can lag each other across releases. Check the Samples version in `version.json` and state the version a name or availability claim was verified against.

## Mojang Bedrock Samples Reference

Mojang's official [bedrock-samples](https://github.com/mojang/bedrock-samples) repository is the source of truth for vanilla Bedrock identifiers, textures, recipes, components, entity definitions, and data formats. It is cloned at `/root/bedrock-samples/`.

- Layout: `resource_pack/` (textures in `textures/items/`, `textures/blocks/`, `textures/models/armor/`, `textures/ui/`; `attachables/`; `texts/`) and `behavior_pack/` (`items/`, `entities/`, `recipes/`, `loot_tables/`).
- Content changes between releases. Verify the checked-out version and confirm each path exists before relying on a file, value, or schema. Do not hardcode values such as armor defense or durability from memory; read the actual definitions.
- Item identifiers do not always match texture filenames. Inventory all recipes first, build an explicit ingredient-to-texture mapping, and use texture atlas or index metadata when helpful. Report all unresolved items together and fail clearly rather than substituting a placeholder.
- Item and block texture indexes (`textures/item_texture.json`, `textures/terrain_texture.json`) begin with a `//` comment line, so strip comment lines before parsing them as JSON. Many vanilla items have no entry keyed by identifier, and many block textures are `.tga` rather than `.png`, so check both extensions before calling a texture missing.
- Block inventory icons are rendered in game from top and side textures. Flat `textures/blocks/` files are not inventory icons; render an isometric view from the real face textures when a cube-style sprite is needed.
- An identifier that is valid in one place may not exist in Bedrock (for example `oak_door` is `wooden_door`). Confirm an identifier appears in Samples recipes, loot tables, or trades, or in the game's own item registry, before documenting it.
- Custom items use the add-on's own resource-pack textures. Vanilla recipes in `behavior_pack/recipes/` are the reference for recipe format, group tags, and ingredient identifiers.
- If the checkout is missing or lacks the asset, report the limitation and do not pretend it was sourced. When only GitHub is reachable, a sparse `git clone --filter=blob:none --sparse` followed by `git sparse-checkout set --no-cone <paths>` works even when raw file downloads are blocked. In CI, clone or fetch Samples and set the checkout root explicitly. Do not report success until generation finishes, PNGs are committed, and image references resolve.
- Scale 16x16 textures with nearest-neighbor interpolation to keep pixel art crisp:

```python
from PIL import Image

icon = Image.open("/root/bedrock-samples/resource_pack/textures/items/<verified_file>.png").convert("RGBA")
icon = icon.resize((44, 44), Image.Resampling.NEAREST)
```
