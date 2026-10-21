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
- **Images are optional, not a per-description requirement:** do not automatically create or add an item preview or crafting recipe diagram to every add-on `DESCRIPTION.md`. Create recipe diagrams or item previews only when the user explicitly requests them or the specific project instructions require them. When requested, generate them from actual pack textures and recipe JSON, then register the generator in `.github/workflows/generate-recipe-images.yml` so updates are automatic.
- Source vanilla item textures from `/root/bedrock-samples/resource_pack/textures/`. Confirm every file exists in the checked-out sample version before using it. Do not redraw, approximate, or substitute unrelated icons.
- Read the actual recipe JSON first and use it as the source of truth for ingredient identities, quantities, result, and output count.
- **Sole crafting-board reference — strict rule:** `assets/CRAFTING_TABLE.svg` is the only authorized reference for the crafting interface. Always read and render this exact SVG as the source of truth for board layout, proportions, ingredient slots, borders, arrow, output slot, and colors. A PNG such as `assets/CRAFTING_TABLE.png` is only a generated raster export of that SVG for processing; it is never an independent reference and must never be used to design, infer, or replace the board. Never use `CRAFTINGBOARD.PNG`, screenshots, another crafting-board image, a hand-drawn GUI, or a remembered Minecraft interface as a substitute. All generators must use the shared `scripts/crafting_template.py` renderer, which reads and renders `assets/CRAFTING_TABLE.svg` directly. Do not independently render a board in a generator. If the SVG is missing or unreadable, stop and report the problem instead of using any other board.
- **Ingredient placement color:** use solid `#8A8A8A` for the ingredient-placement spaces, matching `assets/CRAFTING_TABLE.svg`. Keep that color distinct from the output slot's `#8B8B8B` unless the template itself is deliberately revised.
- **Recipe diagram background:** fill transparent/background areas with solid `#8B8B8B`; do not leave the overall recipe diagram background transparent.
- **Recipe layout:** use the placement spaces in `assets/CRAFTING_TABLE.svg` as the guide. Arrange ingredients to communicate the recipe clearly while preserving the template. Include every required ingredient from the actual recipe JSON and show quantities where relevant. For shaped recipes, reflect the actual placement pattern when practical; for shapeless recipes, use a clear arrangement. The underlying recipe JSON remains authoritative for ingredients, quantities, result, output count, and shaped/shapeless behavior.
- Use inventory-style Minecraft item appearances for every ingredient and output: use the correct inventory/hotbar sprite, not a cropped world texture. If only block-face textures exist, build a small crisp isometric inventory-style block icon from verified matching faces. Use nearest-neighbor scaling for pixel art and keep icons clean, recognizable, and consistently sized.
- **Strict official-source rule:** use Mojang's official Bedrock Samples repository as the required reference for vanilla item/block names, identifiers, and textures. Inspect the actual checked-out sample files and verify every texture path before mapping it. Do not use third-party packs, guessed filenames, remembered aliases, AI-generated substitutes, or approximate icons. If the exact vanilla texture cannot be located, report the unresolved item and stop rather than substituting a different texture.
- **Recipe image art direction — simple and majestic:** make diagrams feel like a polished, authentic Minecraft Bedrock crafting interface: restrained vanilla-style gray UI, square ingredient slots, a familiar crafting arrow, and a clearly separated output slot. Keep pixel art crisp with nearest-neighbor scaling, clean transparency, consistent icon sizing, balanced spacing, and precise alignment. The result should look elegant through clarity and composition, not decoration.
- Avoid ornate frames, fantasy backgrounds, gradients, decorative flourishes, promotional text, extra labels, emojis, glow effects, or visual effects that do not belong in a normal Minecraft crafting interface. Do not let styling obscure ingredients, recipe shape, output, or count.
- Every recipe diagram must show a regular 3x3 crafting grid derived directly from `assets/CRAFTING_TABLE.svg`. For shaped recipes, place each ingredient in its exact row and column from the recipe JSON, preserving empty cells. For shapeless recipes, place each ingredient in a separate cell in row-major order. Never flatten a recipe into a vertical list. Keep ingredient identities, requirements, result, and output count faithful to the recipe JSON.
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
- Recipe diagrams and item-preview sheets must be based on the real recipe definitions and texture assets. Confirm that output item IDs map to the correct custom texture, the rendered count matches the recipe, all ingredients are represented faithfully, and every crafting board is rendered directly from the sole reference `assets/CRAFTING_TABLE.svg`. Any PNG export is derived from that SVG and is not a separate reference. Confirm all referenced output filenames are produced. Keep published `DESCRIPTION.md` image URLs aligned with the generated filenames.
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
│   ├── Void_For_Workv2.mcworld    # Designated source world archive when supplied
│   └── oneblock-template/         # Extracted complete world (level.dat + db/), generated by builder
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

## 8. World Sources and OneBlock Reference Policy

- The canonical editable references are `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/`. Edit these folders directly. Do not keep `.mcworld.zip` copies or a nested `Extracted/` directory. Preserve each mode's metadata/settings unless the user requests a change.
- For Dirtbound's own OneBlock mechanics, keep the Bedrock foundation at `(0, -1, 0)`, the evolving core at `(0, 0, 0)`, and world spawn at `(0, 1, 0)`. The custom Trader Ledger item is the only shop access method; do not create a physical Trader Post block.
- Preserve template database data and terrain except for the explicitly requested cleanup command. Every OneBlock map must include a `void_cleaner.mcfunction`; for Dirtbound, use the approved first-join commands guarded by `tag=!void_cleaned`: clear x/z `-16..16` at y `-64`, teleport the joining player to `(0,1,0)`, place Bedrock at `(0,-1,0)`, grass at `(0,0,0)`, set world spawn to `(0,1,0)`, notify players that cleaning is done, and add the `void_cleaned` tag. This requested Dirtbound cleaner intentionally performs its setup once per player, and its only player teleport is the explicit first-join command in the cleaner. Do not expand the cleanup beyond this specified layer without approval.
- Separate the first-join Void Cleaner from ongoing recovery. The cleaner sets the starting floor/spawn and creates the grass placeholder at `(0,0,0)`; the Script API must replace that placeholder with the evolving OneBlock core at `(0,0,0)`. The recurring tick function may restore only Bedrock at `(0,-1,0)` . It must **not** reset world spawn every tick or place/replace the evolving central core; the gameplay script owns core break rewards and stage progression. Never let two tick-enabled packs manage the same platform/core.
- The editable folders under `Mcpeworlds/{Creative,Survival,Hardcore}/` are the canonical, intentionally database-free void foundations. Keep them database-free. When `db/` is absent, `scripts/build_oneblock_variants_from_template.py` must initialize a fresh empty LevelDB only in temporary staging for that specific output. Never add the generated database to the source folders or borrow another world's database/chunks/terrain. If a source contains a partially present database, fail and report it rather than overwriting it.
- Each enabled OneBlock project automatically produces Creative, Survival, and Hardcore variants when relevant map source/configuration files or `Mcpeworlds/` foundations change, using the matching direct source folders in `Mcpeworlds/`. Those complete templates are authoritative for each mode's terrain, chunks, metadata, and settings; preserve them rather than forcing mode flags or borrowing data from one shared source world.
- Preserve complete world data in source-world builds: `level.dat`, `level.dat_old` when supplied, `levelname.txt`, all `db/` LevelDB files, world pack manifests, and other original world files. Link exact pack manifest UUIDs and versions through `world_behavior_packs.json` and, when applicable, `world_resource_packs.json` at the world root. Verify archive contents and pack links before delivery.
- Do not claim gameplay progression, block regeneration, or in-game success from archive structure checks alone.

## 9. Bedrock Function Files, Automatic Execution, and World Pack Linking

These checks are mandatory whenever creating, editing, packaging, or debugging a Bedrock `.mcfunction` file. Do not assume that a function runs just because the file exists in the archive.

### Canonical repository paths

- Resolve all paths from the repository root; do not guess the current working directory.
- For a Behavior Pack stored in a project folder, place function files at `<project>/behavior_pack/functions/<function_name>.mcfunction`.
- Place the automatic tick function registration at `<project>/behavior_pack/functions/tick.json`. The `values` array must list function names relative to `functions/`, without the `.mcfunction` suffix (for example, `oneblock_tick`).
- A function intended to run only when explicitly called must still be under `functions/`; document and verify the caller rather than assuming automatic execution.
- When building a `.mcworld`, the final archive must include the pack under the world's `behavior_packs/<pack-folder>/` directory and a `world_behavior_packs.json` file at the **world root**. Each entry must use the exact Behavior Pack manifest header UUID and version. If a Resource Pack is included, likewise verify `world_resource_packs.json` against its exact manifest UUID and version.
- A `.mcaddon` intended for manual import is not a substitute for a complete `.mcworld`. For a map request, use the project world builder and the approved source world assets; do not deliver only an add-on archive.

### Required verification before delivery

1. Inspect the project's actual `manifest.json`, function files, `functions/tick.json`, and build script before editing. Use the repository-relative paths above and report the paths you inspected.
2. Confirm the manifest UUID/version exactly matches the world link file. Never invent UUIDs, versions, or directories.
3. Confirm `functions/tick.json` is valid JSON, is in the exact `behavior_pack/functions/` directory, and registers the intended function name. Confirm that the referenced `.mcfunction` file exists at the matching path.
4. Inspect commands for correct Bedrock syntax, valid block/item identifiers, coordinate assumptions, and dependencies such as scoreboards. Do not let a score-dependent command be the only path that creates the initial block unless initialization is guaranteed and verified.
5. Build the requested archive, then inspect its ZIP contents. For `.mcworld`, verify `level.dat`, the world database (`db/`), the pack files, `world_behavior_packs.json`, and any required `world_resource_packs.json` are present at the expected paths. Verify each world pack entry against the corresponding manifest.
6. Run available JSON, archive, and project validation tests. State precisely what passed. Static checks prove archive structure and configuration only; they do **not** prove Minecraft actually executed a function. Never claim in-game success without an actual in-game test.
7. If the player receives a custom item but the initial block does not appear, treat item delivery and function execution as separate paths. Diagnose pack activation, world pack links, tick registration, function path/name, command errors, and the built archive before adding more fallback commands or increasing the version.

Do not claim that `tick.json` is missing or misplaced without inspecting the final packaged archive. The correct source location for the tick registration is `behavior_pack/functions/tick.json`; the world pack link file is a separate requirement for a self-contained `.mcworld`.

## 10. OneBlock Three-Variant Workflow — Mandatory

Every new OneBlock map project must generate and publish three complete `.mcworld` files: **Creative**, **Survival**, and **Hardcore**.

### Project opt-in

- Keep the map source at `MCPEDL/maps/<Map-Name>/` (the repository's canonical folder spelling is lowercase `maps`).
- The map must include `behavior_pack/manifest.json`. Include `resource_pack/manifest.json` when the Behavior Pack depends on that Resource Pack.
- Add `oneblock.json` beside the pack folders to opt the project into automatic generation. Minimal example:
  ```json
  {
    "enabled": true,
    "name": "My OneBlock Map"
  }
  ```
- The `name` value is the player-facing base name used in output filenames. `enabled: false` disables generation for that project.

### Output layout

The workflow writes and commits all three worlds into the same map folder:

```
MCPEDL/maps/<Map-Name>/
├── oneblock.json
├── behavior_pack/
├── resource_pack/                 # Optional unless required by the Behavior Pack
├── <Map-Name> - Creative.mcworld
├── <Map-Name> - Survival.mcworld
└── <Map-Name> - Hardcore.mcworld
```

### Authoritative world-reference policy

- Use `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/` as the canonical editable mode-specific references. Keep the three folders directly inside `Mcpeworlds/`; do not add duplicate `.mcworld.zip` snapshots. Do not substitute another mode's template or use `CreateWorld/McpeWorld.html` as a finished world archive.
- Read the selected extracted reference and the builder before changing world generation. Preserve each selected reference's own world metadata and mode settings; only make changes required to name the Dirtbound world and link the map's actual packs.
- The three editable references are intentionally database-free void foundations. The builder creates a fresh empty LevelDB in temporary staging for each output when `db/` is absent; it must not modify source folders, borrow another world's database, or claim that any pre-existing chunks/terrain were preserved. An existing but incomplete `db/` folder is an error.
- If the user supplies newer references, use `scripts/sync_mcpeworld_templates.py` to validate the direct editable folders, `level.dat`, and Void Cleaner. Database-free folders are valid; if a `db/` folder exists but is incomplete, report it and stop rather than overwriting it.

### Automatic execution and verification

- Relevant source changes automatically trigger `.github/workflows/build-oneblock-variants.yml`, which attempts to rebuild all three world modes and synchronize the map README. The workflow can also be run manually. No in-game test confirmation or separate rebuild approval is required for the automation.
- Every change under an opted-in OneBlock map, `Mcpeworlds/**`, the builder, or the validator must also trigger `.github/workflows/validate-oneblock-source.yml`. This pipeline validates pack manifests and dependencies, tick/function wiring, Script API syntax, the three mode-specific template files, and the world builder.
- Do not regenerate world archives merely because map-source or reference files changed. Keep the current `.mcworld` files untouched until the Creative mechanics have been tested in Minecraft and the user approves a rebuild. Automated structural checks are not a substitute for testing in Minecraft, and never claim gameplay verification without an actual game test.
- A successful ZIP/LevelDB/manifest check is a structural build check, not proof that Minecraft loaded the map or that its custom OneBlock progression works. Never claim in-game verification without an actual game test.
- If a project's pack manifest is missing, malformed, or has an unresolved Resource Pack UUID dependency, fail the build and report the exact source path. Never generate fake pack UUIDs for the map's actual packs or silently omit required packs.

## OneBlock Creative-World Testing and Download Layout

- The **Creative .mcworld is the primary in-game test world** for OneBlock maps. Do not create or publish a separate .mcaddon tester package or a `Tester Build/` folder.
- Generate the Creative, Survival, and Hardcore `.mcworld` variants together in the same map project directory. The Creative world is the one the user imports first to test the actual gameplay; the other two variants are kept alongside it.
- The individual map `README.md` must provide clearly labeled download links for Creative, Survival, and Hardcore worlds. `.github/workflows/sync-oneblock-map-readmes.yml` and `scripts/sync_oneblock_map_readmes.py` synchronize the README from current manifests and actual world archives on map/reference changes and after approved builds. The Creative world is the primary in-game test world; do not advertise a separate add-on package.
- Every OneBlock map must use setup translated to its own coordinates and the requested cleanup scope. For Dirtbound, only the explicit first-join cleaner may teleport players, to `(0,1,0)`; ongoing tick recovery must never teleport players. The shared builder must use the correct mode-specific `Mcpeworlds/` template.
- Every OneBlock map must ship a `void_cleaner.mcfunction` and call it from setup. For Dirtbound, the cleaner has highest startup priority: list `void_cleaner` first in `behavior_pack/functions/tick.json`, before `oneblock_tick`. The Script API must not initialize/replace the core until a player has the `void_cleaned` tag, confirming the first-join cleaner ran. Use the approved first-join sequence: fill `(-16,-64,-16)` to `(16,-64,16)` with air, teleport untagged players to `(0,1,0)`, set Bedrock at `(0,-1,0)`, set grass at `(0,0,0)`, set world spawn at `(0,1,0)`, send the cleaning notice, tag players `void_cleaned`. `oneblock_tick.mcfunction` may recover only missing Bedrock, never reset world spawn every tick or replace the evolving core. The custom Trader Ledger item is the only shop access method; no physical Trader Post block is used. The Script API owns the OneBlock at `(0,0,0)`, core break handling, and stage progression. No second tick-enabled pack may compete with it.
- Keep the three world files, README links, and map catalog aligned to actual committed filenames and the current pack version. The automatic package workflow rebuilds .mcpack, .mcaddon, and enabled OneBlock .mcworld outputs on repository pushes and pull requests, and can also be started manually. The world builder creates a fresh empty LevelDB in temporary staging when a canonical void source has no `db/`; it never changes the source folder or borrows another world's data. Never claim an in-game test passed based only on archive or syntax checks.

## Dirtbound Cleaner and Editable World Templates (2026-10)

- Always select repository `AllensCreations/MCPE-Curseforges` and read this file plus the affected source files before making changes.
- The authoritative editable reference folders are `Mcpeworlds/Creative/`, `Mcpeworlds/Survival/`, and `Mcpeworlds/Hardcore/`. Keep these folders directly inside `Mcpeworlds/`; do not keep duplicate `.mcworld.zip` archives or a nested `Extracted/` directory.
- Edit the relevant mode folder directly. The automatic package workflow rebuilds the three OneBlock world archives when repository changes are pushed or a pull request is opened/updated; `.github/workflows/build-oneblock-variants.yml` also remains available for manual runs. The three source folders intentionally omit LevelDB, so the builder creates an independent empty database only in temporary staging. It never borrows terrain/database data from another world or adds generated databases to source folders. Do not create a Tester Build. Creative remains the primary in-game test world.
- Dirtbound's core is exactly `(0,0,0)`, Bedrock is `(0,-1,0)`, and spawn is `(0,1,0)`. The custom Trader Ledger item is the only shop access method; there is no physical Trader Post at `(2,1,0)`. Update source mechanics, player-facing docs, test checklists, and generated worlds together when these mechanics change.
- The Void Cleaner command must be exactly `execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air`. This clears 33×33 = 1,089 blocks on the single layer Y=-64. A command using `fill 0 -64 0 15 -64 15 air` clears only 16×16 = 256 blocks and is incorrect.
- The cleaner is guarded by `tag=!void_cleaned`; it does not rerun for a player who already has that tag. To test a source fix, import the newly built Creative `.mcworld` as a new world. Updating a repository file does not patch an already-imported world or erase its saved player tags.
- Startup priority: `behavior_pack/functions/tick.json` must list `void_cleaner` before `oneblock_tick`. Script API core initialization must wait until a player has `void_cleaned`, so the grass placeholder placed by the cleaner cannot overwrite or race the first stage block.
- Validate source syntax and archive structure, but never claim the world has been tested in Minecraft unless it has actually been opened and tested in-game.


## Automatic OneBlock Map README Synchronization

- The workflow `.github/workflows/sync-oneblock-map-readmes.yml` synchronizes map download pages when relevant sources change and can also be run manually.
- `scripts/sync_oneblock_map_readmes.py` updates each enabled `oneblock.json` map's README using the current Behavior Pack version and actual Creative, Survival, and Hardcore archive files. It checks archive structure and pack UUID/version links before saying that archives match the current source.
- The automatic package workflow rebuilds enabled OneBlock `.mcworld` archives on repository pushes and pull requests; `.github/workflows/build-oneblock-variants.yml` remains available for manual runs. For the intentionally database-free source folders, the builder creates a fresh empty LevelDB only in temporary staging, with no borrowed terrain or database. An existing incomplete `db/` folder is an error.
- Archive and syntax checks do not prove gameplay was tested in Minecraft.
