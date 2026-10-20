# Repository Guidelines and Markdown Standards

This document establishes repository-wide documentation standards for AllensCreations/MCPE-Curseforges.

## Instruction Precedence and Accuracy

- This file defines shared policy. `README_GUIDELINES.md` defines detailed README/CHANGELOG style; `.agents/skills/checkrm/SKILL.md` defines audit workflow; `.agents/skills/mcpe-readme/SKILL.md` defines commercial-but-factual writing; the Mojang samples skill covers vanilla reference assets.
- Apply these documents together. Factual accuracy and the user's requested scope take priority over any template. Use this shared policy plus the relevant specialized skill; do not follow conflicting examples blindly.
- Inspect source files before making claims. Ask the user when an unresolved choice could materially affect gameplay, compatibility, distribution, data loss, or release/version behavior. For ordinary style choices, apply these defaults and proceed.
- Never invent features, versions, links, assets, test results, compatibility, achievement support, performance guarantees, or platform behavior. Distinguish verified facts from assumptions and untested claims.

Repository documentation must render cleanly across CurseForge, MCPEDL, Planet Minecraft, and GitHub. Individual add-on README.md files are download-focused landing pages with release details, a direct download, basic import instructions, and a link to DESCRIPTION.md. DESCRIPTION.md contains the full player-facing product information. Root and category catalog README.md files remain catalogs.

---

## Default Minecraft Bedrock Target

- From now on, target **Minecraft Bedrock 1.26+** for new add-ons and features unless the user explicitly requests another target.
- Treat 1.26+ as the minimum target family, not a promise that every later retail release is identical. Set each pack's `min_engine_version` to the lowest version its actual features support.
- For Script API projects, follow [SCRIPT_API_COMPATIBILITY.md](SCRIPT_API_COMPATIBILITY.md) as the central reference. Recheck the official stable API documentation when choosing dependencies; its dated version snapshot must not be treated as permanently current.
- Prefer stable APIs and the highest stable module versions supported by the actual target game. Do not use preview/RC dependencies by default.

---

## Graphify Repository Reference

- Reference repository: https://github.com/Graphify-Labs/graphify
- Use Graphify as an optional reference for graph-based codebase exploration and dependency/relationship mapping when relevant to repository analysis.
- Before adopting or integrating it into a workflow, inspect its current documentation and supported setup; do not assume it is installed or available in every environment.
- Treat generated graphs as navigation aids, not as authoritative proof. Verify behavior against source files, manifests, tests, and workflow definitions.

---

## 1. Markdown and CurseForge / MCPEDL Compatibility

All documentation must render cleanly across GitHub, CurseForge, and synced MCPEDL pages.

### Rules:
- **Controlled images in add-on descriptions:** Individual add-on `DESCRIPTION.md` files may include item sprites and crafting recipe diagrams as images, following the established source-based workflow below. Do not include promotional banners, general screenshots, or unrelated artwork. Individual add-on `README.md` files remain download-focused and must not embed images. Do not create images outside the permitted item-sprite and crafting-diagram uses unless the user asks.
- **Internal references:** Relative paths are appropriate for links between repository files where useful; avoid relative image embeds in published READMEs intended for external platforms.
- **CurseForge HTML editor:** If HTML image sizing is explicitly needed, use relative widths and omit fixed height so images can scale proportionally.
- **Spoiler Markup:** When adding collapsible spoilers (crafting recipes, detailed tables, changelogs), use the official markup in CurseForge's `</>` editor:
  `<h2>Spoiler Title</h2><div class="spoiler">spoiler content...</div>`
  Platform support and rendering can change. Preview the result on the target platform and use this markup only where it is confirmed to work; do not promise cross-platform spoiler behavior without verification.
- **No Raw Blind Copying:** Never copy an entire legacy MCPEDL description to CurseForge and expect it to transfer flawlessly. CurseForge and MCPEDL run on different backends; adjust formatting in the `</>` code editor.
- **Relative Paths:** Use clean, relative paths for local assets (e.g., `banner.jpg`, `1791889944961.jpg`, `recipe_lantern.png`).
- **Clean Formatting:** Avoid LaTeX notation like `$\rightarrow$`. Use clean arrows (`->` or unicode arrows) and standard bullet points.
- **Writing style:** Use polished, player-focused commercial writing that remains factual. Avoid hype, clickbait, rhetorical questions, and filler.
- **No Emojis:** Do not include emojis in headings, titles, bullet points, or body text.

---

## Add-on Display Title and Creator Attribution (Required)

- Every Behavior Pack and Resource Pack manifest display title must include the exact release version in this format: `Add-on Name (vX.Y.Z)`, for example `Vanilla Quality of Life (v1.3.0)`.
- Keep the creator attribution out of the title. Put the phrase `by AllensCreations` in the manifest `header.description`.
- When the release version changes, update the manifest title to the same version. The release automation must preserve this rule.
- Apply this rule to newly created and updated add-ons; do not change pack UUIDs or world storage keys just to rename a title.
- Manifest `header.description` must contain `by AllensCreations` exactly once. Preserve the existing description and normalize attribution instead of appending duplicates.
- A title validator must check every project manifest under `MCPEDL/`: require exactly one terminal `(vX.Y.Z)` suffix, require that version to match `header.version`, and reject malformed or duplicated version suffixes. For an add-on with both `behavior_pack/` and `resource_pack/` manifests, their displayed release versions must match.
- Run the validator in the release workflow and fail the job on any violation. The validator must report errors rather than silently rewriting titles.
- **Creator profile links for published project descriptions:** Include both official profiles in `DESCRIPTION.md` (not the download-only project `README.md`) as clickable, descriptive titles instead of displaying the raw URLs:
  - [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
  - [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)
  Use standard Markdown links so the title is clickable on supported platforms. Keep these links in player-facing documentation, not in the short in-game manifest description.

---

## 2. Technical and Factual Descriptions (Zero Marketing Slop)

### Mandatory Customer-Facing / Commercial Presentation

Treat every public-facing add-on product description as a polished product listing written for a Minecraft player or customer, not for another developer. This applies to DESCRIPTION.md, changelogs, catalog descriptions, feature lists, crafting explanations, promotional copy, and player-facing notices. Individual add-on README.md files remain focused on downloading and importing the package; detailed product information belongs in DESCRIPTION.md.

- **Lead with the player experience.** Explain what players can do, how a feature behaves in-game, what they need, and what benefit it provides. Use natural customer language rather than implementation notes.
- **Do not expose developer-looking details in public descriptions.** Avoid source-code terminology, internal file names, variable/function names, event names, API/module names, JSON component names, raw configuration keys, technical identifiers, code snippets, stack traces, commit hashes, and build-workflow details unless the user specifically requests technical documentation.
- **Never use Minecraft internal item identifiers as player-facing names.** Do not write identifiers such as `minecraft:diamond`, `minecraft:totem_of_undying`, `minecraft:iron_pickaxe`, or other namespace-and-underscore identifiers in a public README or changelog. Use the normal in-game display name instead, such as “Diamond,” “Totem of Undying,” or “Iron Pickaxe.” Apply the same rule to blocks, mobs, enchantments, effects, and other game content: use the familiar player-facing name.
- **Keep internal identifiers inside implementation files only.** Technical IDs may be used where the game requires them in JSON, JavaScript, functions, recipes, localization keys, manifests, and other source files. Do not alter valid source identifiers just to make them look customer-friendly; change only public-facing prose and display text when appropriate.
- **Describe mechanics, not code.** For example, write “The ability activates when you use the relic” instead of describing an event handler, script callback, component, or tick interval. Explain controls and requirements from the player's perspective.
- **Use customer-friendly names consistently.** Prefer the in-game display name or a clear, readable feature name. Avoid snake_case, namespace prefixes, file extensions, raw enum values, and developer abbreviations in headings, bullets, tables, badges, and captions.
- **Changelog links — forbidden.** Do not add hyperlinks, raw URLs, linked project names, badges, or link references anywhere in a project's `CHANGELOG.md`. Changelogs must contain only concise, player-facing descriptions of changes. README download-link rules do not apply to DESCRIPTION.md.
- **Changelog boilerplate — forbidden:** Do not add introductory paragraphs explaining that changes will be documented in the file, or naming Keep a Changelog / Semantic Versioning with links. After `# Changelog — [Project Name]`, go directly to the release entries (an optional `---` separator is fine). Keep the changelog focused on dated, player-visible changes.
- **Commercial does not mean exaggerated.** Keep the presentation polished and appealing but factual. Do not invent benefits, use clickbait, add filler, or promise unverified compatibility, performance, achievements, or features.
- **Exceptions:** Keep technical details in source code, internal developer notes, or a technical document when the user explicitly asks for them. When a public-facing guide must mention a requirement, translate it into clear player language and include only what the player needs to know.


Pack descriptions must be polished, player-focused, and commercially presentable without sacrificing accuracy.

### Rules:
- No Developer Jargon in Player Guides: Translate internal JSON components into clear player mechanics.
- No AI Slop or Marketing Hype: Avoid rhetorical questions, buzzwords, exaggerated superlatives, and filler.
- Clear Gameplay Highlights: Include exact values, recipes, requirements, and specifications only when verified from project sources or reliable tests.
- Do not claim "zero lag," universal multiplayer/Realms compatibility, achievement preservation, or no experimental features unless evidence supports that exact claim.

---

## 3. README.md and DESCRIPTION.md Responsibilities

- **Individual add-on `README.md` files are download-focused landing pages.** Include the add-on name and verified version, direct `.mcaddon`/`.mcpack` download or official catalog link, package format, short generic import instructions, and a link to the project's `DESCRIPTION.md`. Do not duplicate feature lists, recipes, detailed usage, compatibility claims, screenshots, banners, creator bios, SEO keywords, or changelog content in README; those belong in `DESCRIPTION.md`.
- **Move all player-facing add-on information to `DESCRIPTION.md`.** This is the customer-facing product page. It contains the commercial-but-factual overview, features, usage, recipes, compatibility, achievement/experimental status, creator attribution, profile links, permissions, and search keywords where appropriate. Use images only for item sprites and crafting recipe diagrams, following the established workflow; do not add banners or general screenshots. Never lose existing verified information when migrating from README.md.
- **Do not confuse project pages with directory catalogs.** Root and category catalog README files may continue listing available projects, versions, and download links as their purpose requires. The download-only rule applies to individual project README files.
- **Apply the same split to existing add-ons when updating them:** preserve/move the current informative README content into `DESCRIPTION.md`, then replace the individual README with the short download-link page. Avoid duplicate full descriptions across both files.
- **New add-on scaffold:** create both files. Generate a download-only README and a DESCRIPTION.md starter that the add-on documentation workflow/agent fills with verified, player-facing details.
- **Semi-root catalogs as download source of truth:** centralize release links in these catalogs:
  - Existing Add-ons: [`MCPEDL/addons/README.md`](MCPEDL/addons/README.md#available-add-ons)
  - New Add-ons: [`MCPEDL/new_addons/README.md`](MCPEDL/new_addons/README.md#available-add-ons)
  - Maps: [`MCPEDL/maps/README.md`](MCPEDL/maps/README.md#available-maps)
  - Scripts & Challenges: [`MCPEDL/script/README.md`](MCPEDL/script/README.md#available-scripts)
  - Master Compiled Builds: [`builds/README.md`](builds/README.md#available-pack-and-map-builds)
- Directory catalogs may use a compact table with project name, version, source, and download. Keep those catalog tables separate from individual DESCRIPTION.md product pages.

---

## 4. CurseForge <-> MCPEDL Synchronization Protocol

When publishing and synchronizing projects between CurseForge and MCPEDL:
1. **Match Project Slug:** Ensure the CurseForge project slug exactly matches the slug in your MCPEDL URL (e.g., `https://mcpedl.com/<project-slug>/` <-> `curseforge.com/minecraft/mc-addons/<project-slug>`).
2. **Upload Thumbnail Labeled "MCPEDL":**
   - Navigate to the **Images** tab in your CurseForge project dashboard.
   - Upload the project banner/thumbnail (recommended ~720x340px).
   - Edit the image title/caption strictly to **`MCPEDL`** (exact case-sensitive text).
   - Ensure it is within the **first 20 images** uploaded to the project.
3. **Enable 3rd Party Sharing:**
   - In CurseForge project settings, toggle **"Allow 3rd party distribution / sharing"** to **ON**. This allows the MCPEDL sync bot to fetch files, thumbnails, and descriptions.

---

## 5. Mandatory Guidelines and Attribution Section

Every individual add-on DESCRIPTION.md that includes attribution must place that section immediately before its final Search & Discovery Keywords section. Download-only project READMEs and catalog READMEs do not need project-specific SEO or attribution boilerplate.

```markdown
## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
```

---

## 6. Add-on Description Image Rules

- Individual add-on `README.md` files must remain text-only download pages with no embedded images.
- Individual add-on `DESCRIPTION.md` files may show **item sprites** and **crafting recipe diagrams** as images when they help explain the add-on.
- Do not add promotional banners, generic screenshots, or unrelated artwork to add-on descriptions.
- Use verified absolute raw GitHub URLs for published image embeds so they render on external platforms.
- Do not reference missing assets; confirm every referenced image exists and matches the item or recipe being described.

---



## 6A. Minecraft Bedrock Recipe Images — Mandatory Source-Based Workflow

- **Never use AI image generation** for crafting recipe diagrams, item previews, or other Minecraft pack visuals unless the user explicitly asks for AI-generated artwork. The default is source-based images.
- For crafting recipe diagrams, build the image programmatically from the actual recipe JSON, the add-on's real result-item texture, and vanilla ingredient textures from Mojang's official [Bedrock Samples](https://github.com/Mojang/bedrock-samples) repository.
- **Mandatory for every add-on:** whenever an add-on contains a custom item, include a real texture-based item preview in `DESCRIPTION.md`; whenever it contains a crafting recipe, include a generated recipe diagram in `DESCRIPTION.md`. If both apply, include both. Do not leave custom items or recipes undocumented visually just because the feature already exists. Generate the images from actual pack textures and recipe JSON, then register the generator in `.github/workflows/generate-recipe-images.yml` so updates are automatic.
- Source vanilla item textures from `/root/bedrock-samples/resource_pack/textures/`. Confirm every file exists in the checked-out sample version before using it. Do not redraw, approximate, or substitute unrelated icons.
- Read the actual recipe JSON first and use it as the source of truth for ingredient identities, quantities, result, and output count.
- **Crafting board visual reference:** use the repository image at `assets/CRAFTINGBOARD2.PNG` as the standard visual reference for the crafting board/interface on all future recipe diagrams. Inspect the actual image before implementing a generator or changing recipe art. The board's nine open spaces are the ingredient-placement area, and the single separate slot marked `1` is the output-item slot. Match the reference's appearance and proportions as closely as practical; do not replace it with an unrelated interface. If the file cannot be found at that exact path or its contents cannot be accessed, report that and ask for the asset to be made available—do not invent a substitute reference.
- **Recipe diagram background:** fill transparent/background areas with solid `#8B8B8B`; do not leave the overall recipe diagram background transparent.
- **Single-column recipe layout is mandatory:** arrange recipe ingredients in one vertical column only. Never place ingredient slots in two or more side-by-side columns, and do not use a 3×3 ingredient grid in the generated recipe diagram. Place the output item/count in a clearly separated output area. Include every required ingredient from the actual recipe JSON and show quantities where relevant. Treat the image as a compact recipe guide, not a literal crafting-grid pattern; the underlying recipe JSON remains authoritative for shaped/shapeless behavior and exact ingredients.
- Use inventory-style Minecraft item appearances for every ingredient and output: use the correct inventory/hotbar sprite, not a cropped world texture. If only block-face textures exist, build a small crisp isometric inventory-style block icon from verified matching faces. Use nearest-neighbor scaling for pixel art and keep icons clean, recognizable, and consistently sized.
- **Strict official-source rule:** use Mojang's official Bedrock Samples repository as the required reference for vanilla item/block names, identifiers, and textures. Inspect the actual checked-out sample files and verify every texture path before mapping it. Do not use third-party packs, guessed filenames, remembered aliases, AI-generated substitutes, or approximate icons. If the exact vanilla texture cannot be located, report the unresolved item and stop rather than substituting a different texture.
- **Recipe image art direction — simple and majestic:** make diagrams feel like a polished, authentic Minecraft Bedrock crafting interface: restrained vanilla-style gray UI, square ingredient slots, a familiar crafting arrow, and a clearly separated output slot. Keep pixel art crisp with nearest-neighbor scaling, clean transparency, consistent icon sizing, balanced spacing, and precise alignment. The result should look elegant through clarity and composition, not decoration.
- Avoid ornate frames, fantasy backgrounds, gradients, decorative flourishes, promotional text, extra labels, emojis, glow effects, or visual effects that do not belong in a normal Minecraft crafting interface. Do not let styling obscure ingredients, recipe shape, output, or count.
- For every recipe diagram, keep the single-column ingredient layout even when the underlying recipe is shaped. Do not imply that the vertical display is the in-game crafting-grid pattern; the real recipe JSON defines crafting behavior. Keep all ingredient identities, ingredient requirements, output item, and output count faithful to the recipe JSON.
- **Distinguish block items from flat inventory items:** map an ingredient according to its actual recipe identifier. Use the verified `textures/items/emerald.png` for Emerald. For Block of Emerald and Pumpkin, where the official Samples provide block-face textures rather than a separate flat inventory sprite, render a small crisp 3D/isometric inventory-style icon from the verified matching official textures instead of showing one stretched face. Never display a block texture for a different item or silently change the recipe ingredient.
- **Inventory-style icon rule for all current and future recipe references:** every ingredient, output, and item preview must look like the item as players recognize it in the Minecraft inventory/hotbar—not like a cropped world texture. First locate and use the correct official inventory/item sprite from the checked-out Bedrock Samples. Only use a block texture directly when that texture itself is the correct inventory-style sprite for that item. If Samples provides only world-face textures for a placeable block, build a small crisp isometric/cube icon from the verified matching faces (including top and side where available); never stretch a single face to stand in for the whole block. Apply this rule to every vanilla ingredient and every custom item preview, not only Emerald or Pumpkin. Keep the ingredient identity and recipe ID unchanged. For all future add-ons and recipe generators, make this the default.
- Save the final standalone PNG in the relevant add-on folder and update its DESCRIPTION.md to embed the verified image using an absolute raw GitHub URL. Do not reference a missing image or leave an outdated recipe screenshot in place.
- Item sprites shown in DESCRIPTION.md must use the real item/entity texture from the add-on or an authoritative vanilla texture source; do not substitute unrelated icons.
- Keep Python recipe-image generators under `scripts/`; they must read actual recipe JSON and fail clearly if the sample texture pack, ingredient texture, result texture, or recipe file is missing. Do not silently omit unmapped ingredients or claim an image was sourced from Bedrock Samples unless the texture paths and assets were checked.
- Use `.github/workflows/generate-recipe-images.yml` to regenerate registered recipe diagrams when their recipes, source textures, or generators change. The workflow checks out Mojang Bedrock Samples, installs Pillow, runs the registered generators, and commits updated PNGs. When adding a generator for another add-on, register it in that workflow and ensure its DESCRIPTION.md points to the generated PNG with a verified absolute raw GitHub URL. Workflow-generated commits use `[skip ci]` to prevent loops.
- Do not change recipe ingredients, result count, or shaped/shapeless behavior just to match an image. The recipe JSON is authoritative; update the diagram to match it.

### Recipe Generator Reliability and Workflow Registration

- Before adding or changing a recipe-image generator, inspect the add-on's complete recipe directory and collect every ingredient item ID used by all supported recipes. Build and review an explicit texture mapping for every ingredient rather than fixing only the first reported missing texture.
- Vanilla item IDs do not always match Bedrock Samples texture filenames. Maintain explicit, source-verified aliases where needed (for example, `minecraft:enchanted_golden_apple` uses the vanilla golden-apple texture asset). Resolve aliases against the checked-out Bedrock Samples tree and fail clearly if no correct texture exists; never substitute an unrelated item icon or silently skip an ingredient.
- Confirm the expected Bedrock Samples texture path for each mapped ingredient in the currently checked-out sample repository. Some textures may be under `textures/items/` and others under `textures/blocks/`; only use a path after verifying the file exists and depicts the correct ingredient.
- Register every generator in `.github/workflows/generate-recipe-images.yml` in both places: add the script path to the workflow's `push.paths` filter so edits trigger the workflow, and add an explicit generation step. Also stage every generated image directory/file in the commit step.
- The workflow must regenerate images when relevant recipe JSON, source textures, generator scripts, or the workflow itself changes. Keep `workflow_dispatch` enabled for manual reruns after a failure.
- When a generator fails, use the first missing/unmapped ingredient as a diagnostic, fix the mapping or path in source, and rerun the workflow. Do not report the image set as generated until the workflow completes successfully and the expected output PNGs exist.
- Recipe diagrams and item-preview sheets must be based on the real recipe definitions and texture assets. Confirm that output item IDs map to the correct custom texture, the rendered count matches the recipe, all ingredients appear in one vertical column, the crafting board follows `assets/CRAFTINGBOARD.PNG`, and all referenced output filenames are produced. Keep published `DESCRIPTION.md` image URLs aligned with the generated filenames.
- Keep generated image files in the repository so published raw GitHub URLs resolve. A correct Markdown image URL alone is not proof that the PNG exists or that the generator succeeded.


## Minecraft Bedrock Crafting Recipe Unlock Rule — Mandatory

- **Every custom crafting recipe must be explicitly unlocked by default.** Include the Bedrock recipe unlock component:
  `"unlock": { "context": "AlwaysUnlocked" }`
  in every applicable recipe JSON, following the exact schema supported by the target recipe type and Minecraft version.
- For recipe formats that use an array of unlock entries, use the equivalent supported form, for example `"unlock": [{ "context": "AlwaysUnlocked" }]`, only when that is the schema required by that recipe format. Do not mix schemas or copy the wrong unlock structure.
- Do not rely on recipe discovery, item pickup, recipe-book progression, or experimental unlock behavior for custom recipes unless the user explicitly requests that behavior.
- Preserve the recipe's correct ingredients, result item and count, crafting station/tags, and shaped or shapeless structure. Add the unlock rule without changing gameplay balance.
- When editing an existing recipe, inspect its actual recipe type and compare its structure with the repository's Bedrock Samples reference before choosing the unlock syntax.
- Apply this rule to all new recipes and when touching existing recipes. Do not claim the recipe was tested in-game unless it was actually tested.

---

## 7. Repository Organization

```
MCPE-Curseforges/
├── INSTRUCTIONS.md                # This standards file
├── README.md                      # Catalog of all active addons, maps & scripts
├── assets/                        # Master media and configuration assets
│   ├── banner.jpg                 # Master repository banner
│   ├── mcpedl.png                 # Master brand logo
│   └── oneblock-assets/           # Authoritative OneBlock reference modules
│       ├── catalog.json           # Catalog manifest of all 24 curated assets
│       ├── *.json                 # Settings, HUD, mechanics, and phases (1-15)
├── MCPEDL/                        # Consolidated projects directory (Addons, Scripts, Maps)
│   ├── addons/                    # Source folders for add-ons & packs
│   │   ├── <Addon-Name>/
│   │   │   ├── behavior_pack/     # BP source code
│   │   │   ├── resource_pack/     # RP source code
│   │   │   ├── README.md          # Download link only
│   │   │   ├── DESCRIPTION.md     # Customer-facing product information
│   │   │   └── <images>           # Banners, infographics, previews
│   │   └── README.md
│   ├── script/                    # Source folders for scripts, minigames & challenges
│   │   ├── <Project-Name>/
│   │   │   ├── behavior_pack/     # BP source code & game scripts
│   │   │   ├── pack_icon.png      # 1:1 square icon
│   │   │   └── README.md          # Documentation
│   │   └── README.md
│   └── maps/                      # Source folders for custom maps
│       ├── <Map-Name>/
│       │   ├── behavior_pack/
│       │   ├── pack_icon.png
│       │   └── README.md          # Documentation
│       └── README.md
└── builds/                        # Compiled distribution archives
    ├── <Addon-Name>/              # .mcaddon / .mcpack binaries
    ├── <Project-Name>/            # .mcaddon / .mcpack binaries
    └── <Map-Name>/                # .mcworld binaries
```

---

## 8. OneBlock Game Standards and Reference Assets

When developing, updating, or generating any OneBlock maps, add-ons, or minigames in this repository, you **MUST** reference [`assets/oneblock-assets/`](assets/oneblock-assets/catalog.json) as the official single source of truth:

1. **Pure Reference Baseline (Zero Image Clutter):**
   - The reference folder [`assets/oneblock-assets/`](assets/oneblock-assets/) contains strictly non-image assets. It houses the definitive core assets for OneBlock maps:
     - **[`text_in_the_block.json`](assets/oneblock-assets/text_in_the_block.json)**: The authoritative configuration, offset, template, and interval specifications for the floating holographic text rendered directly on/above the OneBlock altar.
     - **[`level.dat`](assets/oneblock-assets/level.dat)**: The official Minecraft Bedrock world level data containing the master world generator, gamerules, spawn coordinates, and difficulty settings.
     - **[`instant_block_renewal.json`](assets/oneblock-assets/instant_block_renewal.json)**: 1-tick instant auto-renewal mechanism that spawns the next block faster than player gravity fall acceleration.
     - **[`player_elevation_snap.json`](assets/oneblock-assets/player_elevation_snap.json)**: Active player anti-fall protection that monitors vertical coordinates, snaps the player back to y=65.0, and runs `clearVelocity()` to neutralize downward falling momentum.
   - All OneBlock world builds and scripts must use these reference files as their foundational baseline.

## Add-on LOCK Marker and Build Safeguards

- Every project folder under `MCPEDL/addons/` and `MCPEDL/new_addons/` must contain a root-level `LOCK` file beginning with `AllensCreations Add-on Lock v1`.
- The Base64 scaffold workflow creates the marker automatically for every new add-on.
- `scripts/auto_bump_and_build.py` must stop with a clear error when an add-on lacks the valid marker; do not bypass this validation for routine or explicit builds.
- Keep source files editable in GitHub. `LOCK` is a repository/build safeguard, not encryption, access control, or DRM; it cannot prevent source edits or extraction of distributed packages.
- Do not claim that the marker prevents copying. Any optional JavaScript minification or obfuscation must be separately tested and must not replace editable source.


---

## Script API Version and Documentation Guide

Use [Jayly's Script API References](https://github.com/JaylyDev/scriptapi-docs) and its [published documentation](https://jaylydev.github.io/scriptapi-docs/) as a practical reference for Script API classes, methods, events, examples, and usage patterns.

The default target for new work is Minecraft Bedrock **1.26+**. Use [SCRIPT_API_COMPATIBILITY.md](SCRIPT_API_COMPATIBILITY.md) as the repository's central compatibility reference and dated version snapshot. Always recheck the linked official stable pages when selecting API dependencies.

### Required API research workflow

1. **Inspect the target pack first.** Read its `manifest.json`, script entry points, imports, and current `min_engine_version` before changing dependencies. Record each module independently, such as `@minecraft/server` and `@minecraft/server-ui`; they have separate version numbers and do not require separate JavaScript files.
2. **Check current stable versions instead of guessing.** Verify the latest stable module versions and their Minecraft compatibility using the official [Minecraft Creator Script API documentation](https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/) and current official release/changelog information. Use Jayly's references to investigate available API members and examples. Do not treat a documentation repository's newest generated page, a version found in local metadata, or a remembered version number as proof that it is the newest stable release.
3. **Choose compatible versions, not blindly the numerically highest versions.** Select module versions supported by the target Bedrock release and the pack's minimum engine version. Check each dependency independently. Do not use beta/preview APIs for stable, achievement-friendly packs unless the requested feature requires them and the compatibility impact is made clear.
4. **Verify every API call.** Confirm imported names, event availability, method signatures, argument types, return values, and version availability in the references. Prefer documented event-driven APIs over polling or per-tick loops when appropriate. Use `.mcfunction` for suitable command-based or scheduled behavior when it is simpler and reliable; do not replace Script API logic without checking behavior and compatibility.
5. **Upgrade deliberately.** Do not automatically bump every existing add-on whenever a newer API is found. Check breaking changes and test the affected pack first. Keep compatible existing dependencies until an upgrade is validated; apply the current compatible stable versions to new projects.
6. **Report evidence accurately.** When recommending or changing API versions, state the module name, selected version, target Bedrock compatibility, and references checked. Distinguish verified current versions from versions merely present in repository metadata. Never claim an API is latest or compatible unless the relevant source confirms it.

Jayly's documentation is a useful secondary reference for API exploration and examples, not a substitute for checking official version/compatibility information or testing the actual add-on.

### Stable API Version Policy (Microsoft Recommendation)

- **Use the highest stable Script API module version supported by the Minecraft Bedrock version being targeted.** This is the preferred default, not simply the highest version published overall.
- Verify compatibility for every dependency independently, including modules such as `@minecraft/server` and `@minecraft/server-ui`. Do not select a version that the target game version or the pack's minimum engine version does not support.
- Confirm the choice against Microsoft's official Minecraft Creator documentation and release information, then use Jayly's references to verify the API members and signatures. If the highest stable version supported by the target is unclear, investigate further rather than guessing.

## Community Feedback and Add-on Suggestions

- In player-facing DESCRIPTION.md files, invite players to leave a comment or report if they find a bug, a feature that does not work as expected, or another issue.
- Also welcome add-on ideas and feature suggestions; make it clear that AllensCreations is open to community suggestions.
- Keep the note friendly, concise, and natural. Suggested wording: "Found a bug or a feature that isn't working? Please leave a comment and let me know. Have an idea for another add-on or a new feature? Suggestions are always welcome!"
- Do not imply that every suggestion will be implemented or that every reported issue will be fixed immediately.
- Add this note to player-facing descriptions where appropriate; do not insert it into technical files, manifests, or catalog pages where it would be out of place.

## Automatic Achievement and Experiment Compatibility Assessment

For every new pack and every meaningful update, automatically inspect the actual source files and classify both achievement friendliness and experiment requirements. Do this as part of pack creation; do not stop pack creation for a separate validation stage.

### Required assessment

- Inspect all relevant pack manifests, `min_engine_version`, `dependencies`, Script API module versions, item/block/entity JSON, component and feature usage, scripts, functions, and any supplied world/template settings.
- Detect explicit preview/beta module dependencies, preview-only APIs, experimental content features, required world experiment toggles, and features whose documented behavior depends on experiments.
- Distinguish **pack-level evidence** from **world-level settings**. A pack's files may reveal that an experiment is required, but cannot prove which toggles are enabled in a player's existing world unless that world configuration is available and actually inspected.
- Treat stable Script API usage alone as neither automatic proof that achievements are disabled nor proof that they remain enabled. Determine the classification from the complete feature set and current official Minecraft Creator documentation.
- If no experimental dependency or feature is found, report **“No experiment requirement detected in the inspected files”**, not an absolute guarantee. If evidence is incomplete, report **“Unknown / needs confirmation”**.
- Classify achievement compatibility conservatively:
  - **Likely achievement-friendly:** inspected implementation uses supported stable features and no known achievement-disabling requirement was identified.
  - **Not achievement-friendly / achievements may be disabled:** the pack or requested setup explicitly requires cheats, experiments, preview-only features, or another documented achievement-disabling condition.
  - **Unknown / needs confirmation:** evidence is incomplete, the world settings were not inspected, or current platform rules are unclear.
- Do not infer that an add-on is achievement-friendly just because it uses no experiments, or infer that it needs experiments just because it contains JavaScript. Check the specific features and current documentation.
- Where an experiment is avoidable, prefer a compatible stable alternative if it can deliver the requested behavior without undermining the feature. Do not silently remove or weaken requested functionality just to avoid experiments.
- Include a concise assessment in the handoff and, when relevant to players, the README. State the evidence and limitations; never promise achievement preservation unless that exact setup is verified.
- When world settings are available, inspect experiment toggles and cheats/achievement-related settings separately from the pack source. Do not change a user's world settings without explicit permission.

### Handoff format

- **Achievement status:** Likely achievement-friendly / Not achievement-friendly or may disable achievements / Unknown.
- **Experiments:** None detected / Required (name the specific toggle or feature) / Unknown.
- **Evidence:** Short list of the manifest, API, JSON, script, or world-setting findings that support the result.
- **Scope:** Pack files inspected and whether the actual world settings were available.

## Development Quality, Safety, and Definition of Done

### 1. Checks and Honest Reporting

- **Create the requested pack first. Do not make routine validation a prerequisite or stop to present a validation plan.** Use the repository's existing build/check workflow only when it is needed to produce the requested package or resolve an obvious implementation blocker.
- Apply essential compatibility knowledge while creating the files; do not knowingly add malformed required files or dependencies that the target game cannot support.
- For Script API changes, use the official documentation and the central [SCRIPT_API_COMPATIBILITY.md](SCRIPT_API_COMPATIBILITY.md) reference to choose compatible stable modules.
- Distinguish source creation, package creation, automated checks, and actual Minecraft in-game testing. Never claim a build, check, or in-game test occurred unless it actually did.
- Keep the handoff concise. Mention a failed or unavailable check only when it affects delivery, compatibility, or the user's next step.

### 2. Git and Branch Safety

- Confirm the repository, target branch, and working-tree state before editing or committing. Follow the user's explicit repository and branch instructions.
- Prefer an isolated working branch for substantial or risky changes. Work directly on `main` when the user explicitly requests it or the established task instructions require it.
- Review the diff before committing and keep changes scoped to the requested task. Do not overwrite unrelated user changes.
- Never force-push, discard uncommitted work, rewrite shared history, or delete a branch without explicit authorization.
- Commit and push only when authorized by the user's request or established task instructions. Report the actual commit and push result; do not imply a remote push succeeded if it did not.

### 3. Bug-Fix Protocol and Regression Checks

- For reported bugs, trace the relevant source, reproduce the issue when possible, and identify the likely root cause before changing code.
- Fix the underlying cause rather than masking symptoms. If reproduction is not possible, state that limitation and validate the fix through available static checks or targeted tests.
- Check related behavior for regressions, especially shared scripts, item interactions, inventory behavior, multiplayer-sensitive logic, and other features that use the same events or APIs.
- Preserve existing working mechanics and user-facing behavior unless changing them is necessary for the requested fix. Do not introduce unrelated features or refactor unrelated files.

### 4. Release and Package Consistency

- When a release changes, synchronize applicable pack manifest versions and titles, README version references, changelogs, compiled packages, and catalog entries.
- Preserve pack UUIDs, world/storage identifiers, player data, and other persistent identifiers unless the user explicitly requests a migration and its risks are addressed.
- Preserve required root-level `LOCK` markers and follow the repository's build safeguards. A lock marker is not encryption or protection against source extraction.
- Validate the final package structure and ensure compiled outputs correspond to the intended source revision. Do not describe a package as rebuilt or updated unless that action actually succeeded.

### 5. Design Before Substantial Implementation

- For substantial new features, first establish intended behavior, activation conditions, scope, edge cases, compatibility requirements, and acceptance criteria.
- Assess Script API feasibility and version support before implementation. Consider vanilla JSON components, events, and `.mcfunction` files where appropriate; choose the simplest reliable compatible approach.
- Identify likely performance costs, multiplayer implications, and potential conflicts with existing add-on mechanics before implementation.
- Ask the user only when a material gameplay, compatibility, data-loss, distribution, or release decision remains unresolved. Otherwise use repository conventions and proceed with reasonable defaults.

### 6. Performance and Compatibility

- Prefer event-driven behavior when appropriate over unnecessary per-tick polling, repeated broad entity queries, or expensive block scans.
- Keep loops and scheduled work bounded. Avoid repeated work when state can be cached safely, and account for cleanup and player/entity lifecycle changes.
- Test edge cases relevant to the feature, such as unavailable items, broken tools, full inventories, unloaded areas, multiplayer interactions, and invalid or missing entities, when applicable.
- Do not claim zero lag, universal compatibility, achievement friendliness, or multiplayer/Realms support without evidence for the specific implementation and target version.

### 7. Minimal, Focused Changes

- Change only the files necessary to fulfill the request. Follow existing repository conventions and preserve unrelated formatting, comments, behavior, and features.
- Avoid broad rewrites, duplicate documentation, unnecessary dependencies, and new custom items or commands unless requested or clearly necessary.
- Update only the affected instruction or documentation sections when possible; do not rewrite the entire documentation set for a narrow change.
- Keep player-facing writing concise and factual, following the download-only README and commercial DESCRIPTION.md standards.

### 8. Definition of Done and Handoff

A task may be reported as complete when the requested changes are implemented, relevant available checks have been run, affected documentation and version metadata are updated when needed, and the requested commit/push actions have actually succeeded.

At handoff, summarize:
- What changed and which projects/files were affected.
- Which checks were run and their results.
- What was not tested or remains uncertain, including any in-game tests the user should perform.
- The commit and branch, and whether changes were pushed, when applicable.

Never report unfinished work as complete. If a build, test, commit, or push fails, state the failure and what remains to be done.

## AI Agent Pixel-Art Asset Generation Standard

When an AI agent creates or edits pixel-art assets for an add-on—including item textures, entity textures, block textures, icons, particles, or other pixel-based artwork—prefer a structured, palette-indexed pixel-data workflow like the user's supplied JSON example when it is suitable for the task.

### Preferred source format

- Represent each asset as an object with a descriptive `name`, a square `size` (for example, 16 or 32), a `palette` mapping integer IDs to hex colors, and a `pixels` two-dimensional array of palette IDs.
- Reserve palette ID `0` for transparency, using `#00000000`, unless the target format has a documented reason to use a different convention.
- Keep palette colors deliberate and limited where practical. Use contrast, shading, outlines, and highlights to create readable Minecraft-style pixel art at the target resolution.
- Every pixel value must reference a key that exists in the palette. Each row must contain exactly `size` values, and the `pixels` array must contain exactly `size` rows.
- Keep names unique and descriptive when defining multiple assets in one JSON document. Use valid JSON: double-quoted strings, no comments, and no trailing commas.
- Treat this JSON as an editable source representation, not automatically as a Minecraft-native asset. Convert or export it to the actual required PNG/texture/model/animation format and place it at the correct resource-pack path before claiming the asset is integrated.

### Asset-specific requirements

- **Item/block textures:** Match the intended pixel dimensions and transparent-background requirements. Check the in-game item/block rendering context and preserve Minecraft's pixel-art style.
- **Entity textures:** Confirm the target entity's expected texture dimensions, UV layout, and model mapping before drawing. A square palette grid alone does not guarantee compatibility with the entity model.
- **Icons and other assets:** Follow the target file format's dimensions, alpha, and layout requirements. Use the indexed pixel workflow when it fits; use a different appropriate structured or image workflow when the asset requires it.
- Do not invent or assume that a texture, UV map, model, or animation is compatible. Inspect existing pack assets or authoritative references where available.

### Integration notes

- Generate and integrate the asset as part of pack creation; do not stop the workflow for a separate routine validation stage.
- Keep the pixel data, palette references, row dimensions, exported image dimensions, transparency, and resource-pack paths consistent with the target format while implementing.
- Use existing checks only when needed to resolve a clear issue or produce the requested package. Do not claim visual or in-game testing unless it actually occurred.

Use this approach as the preferred editable workflow, not an absolute restriction: prioritize a valid, maintainable asset that works with the target Minecraft Bedrock format.

## AI Agent Workflow: Build the Pack First

- **Default to creating the complete pack immediately.** When the user requests a new add-on or feature, proceed with implementation using repository conventions rather than stopping to present a design or validation plan first, unless a material decision is genuinely unclear or the user explicitly asks for planning only.
- Generate and integrate the necessary pack files, including manifests, JSON, JavaScript, `.mcfunction` files, textures, and other assets as required by the requested feature.
- For pixel-art assets, prefer the palette-indexed JSON workflow described in the AI Agent Pixel-Art Asset Generation Standard when suitable, and export it to the actual required game asset format.
- **Do not make routine validation a separate gate before creating the pack.** Prioritize implementation and packaging. Use existing build workflows or checks when needed to produce the requested deliverable, resolve clear blockers as part of the work, and avoid unnecessary back-and-forth over routine implementation details.
- Keep essential compatibility safeguards: inspect the target pack and follow its supported Bedrock/API conventions; do not knowingly introduce incompatible versions or malformed required files. If a genuine blocker prevents implementation, explain it briefly and continue with any useful work that can be completed.
- Do not claim that a pack was built, tested in-game, committed, or pushed unless that action actually succeeded. Clearly distinguish a created source pack from a successfully compiled or in-game-tested pack.
- Keep responses concise and focus on the created or changed files and the result. Provide testing notes only when relevant to a blocker, an important limitation, or the user's next step.


## Mandatory Mojang Bedrock Samples Reference

- Always use the official Mojang Bedrock Samples repository as the primary reference for vanilla Minecraft Bedrock assets, item/block identifiers, texture paths, recipes, entity definitions, components, and supported data formats. This applies to all add-on creation, updates, recipe diagrams, and other tasks involving vanilla Minecraft content.
- Before implementing, inspect the checked-out Samples version and actual files relevant to the task. Do not rely only on remembered filenames, guessed aliases, old examples, or third-party texture lists.
- For recipe images, inspect the add-on's complete recipe set first, then resolve every vanilla ingredient through the current Samples texture assets and, where useful, the official texture atlas/index metadata. Resolve namespace IDs to real texture filenames deliberately; item IDs and PNG filenames do not always match.
- Build a complete ingredient-to-texture mapping before rendering any images. Report all unresolved ingredients together before generation where practical, instead of repeatedly failing on one missing item per run. Add documented aliases only after verifying the target texture exists and represents the correct vanilla item. Never silently substitute an unrelated texture.
- Confirm custom ingredients/results against the add-on's own resource pack and vanilla ingredients against Mojang Samples. If a correct asset is absent or ambiguous, stop with a clear error or use another verified official reference; never create a misleading image.
- Workflows that use Samples must fetch/clone it reproducibly, set its root path explicitly, and run the generator against that checkout. Update the relevant workflow whenever new generators or output paths are added, and do not claim images are published until generated files are committed and their links resolve.
