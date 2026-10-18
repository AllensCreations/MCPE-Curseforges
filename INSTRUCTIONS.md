# Repository Guidelines and Markdown Standards

This document establishes repository-wide documentation standards for AllensCreations/MCPE-Curseforges.

## Instruction Precedence and Accuracy

- This file defines shared policy. `README_GUIDELINES.md` defines detailed README/CHANGELOG style; `.agents/skills/checkrm/SKILL.md` defines audit workflow; `.agents/skills/mcpe-readme/SKILL.md` defines commercial-but-factual writing; the Mojang samples skill covers vanilla reference assets.
- Apply these documents together. Factual accuracy and the user's requested scope take priority over any template. Use this shared policy plus the relevant specialized skill; do not follow conflicting examples blindly.
- Inspect source files before making claims. Ask the user when an unresolved choice could materially affect gameplay, compatibility, distribution, data loss, or release/version behavior. For ordinary style choices, apply these defaults and proceed.
- Never invent features, versions, links, assets, test results, compatibility, achievement support, performance guarantees, or platform behavior. Distinguish verified facts from assumptions and untested claims.

All documentation files (README.md across repository root, packs, and maps) must strictly follow these rules to ensure seamless rendering across CurseForge, MCPEDL, Planet Minecraft, and GitHub.

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
- **Published project README images:** Use verified absolute raw GitHub URLs so images render on external platforms. Example: `![Project banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/<project>/banner.jpg)`.
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
- **Creator profile links for published project descriptions:** Include both official profiles in the project's README description or creator/attribution section:
  - CurseForge: https://www.curseforge.com/members/allenscreations/projects
  - MCPEDL: https://mcpedl.com/user/allenscreations/
  Keep these public profile links in player-facing documentation, not in the short in-game manifest description.

---

## 2. Technical and Factual Descriptions (Zero Marketing Slop)

Pack descriptions must be polished, player-focused, and commercially presentable without sacrificing accuracy.

### Rules:
- No Developer Jargon in Player Guides: Translate internal JSON components into clear player mechanics.
- No AI Slop or Marketing Hype: Avoid rhetorical questions, buzzwords, exaggerated superlatives, and filler.
- Clear Gameplay Highlights: Include exact values, recipes, requirements, and specifications only when verified from project sources or reliable tests.
- Do not claim "zero lag," universal multiplayer/Realms compatibility, achievement preservation, or no experimental features unless evidence supports that exact claim.

---

## 3. Downloads Routed via Semi-Root Catalogs

To keep documentation clean and prevent dead download links across individual sub-projects:
- **No "Download & Installation" Sections in Individual READMEs:** Individual add-on, map, and script `README.md` files must not contain redundant download sections.
- **Semi-Root Catalogs as Source of Truth:** All download links (`.mcaddon`, `.mcpack`, `.mcworld`) are centralized in simplified semi-root directory READMEs:
  - Existing Add-ons: [`MCPEDL/addons/README.md`](MCPEDL/addons/README.md#available-add-ons)
  - New Add-ons: [`MCPEDL/new_addons/README.md`](MCPEDL/new_addons/README.md#available-add-ons)
  - Maps: [`MCPEDL/maps/README.md`](MCPEDL/maps/README.md#available-maps)
  - Scripts & Challenges: [`MCPEDL/script/README.md`](MCPEDL/script/README.md#available-scripts)
  - Master Compiled Builds: [`builds/README.md`](builds/README.md#available-pack-and-map-builds)
- **Simplified Directory Catalog Format:** Directory READMEs must use the clean 4-column layout:
  ```markdown
  | Add-on | Version | Source | Download |
  | :--- | :--- | :--- | :--- |
  | <Name> | <Version> | [Source](<slug>/) | [MCADDON](<url>) |
  ```
- **Badge Links:** Badges in individual READMEs link directly to their corresponding semi-root catalog anchor.

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

Every individual project README that includes attribution must place that section immediately before its final Search & Discovery Keywords section. Catalog READMEs do not need project-specific SEO or attribution boilerplate.

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

## 6. Visual Assets and Images

When relevant visual assets (promotional banners, artwork, item previews, recipe infographics) exist in the repository, consider incorporating them into the project description. Do not force irrelevant images into a README:

1. Hero Banner: Placed near the top below the main title.
2. Pack Artwork: Displayed in the Overview or Features section.
3. Recipe Infographics: Placed in the Crafting Recipes section as pre-rendered standalone PNG images.
4. Item Sprites: Displayed alongside item specifications.

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
│   │   │   ├── README.md          # Documentation
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

- In player-facing project descriptions or READMEs, invite players to leave a comment or report if they find a bug, a feature that does not work as expected, or another issue.
- Also welcome add-on ideas and feature suggestions; make it clear that AllensCreations is open to community suggestions.
- Keep the note friendly, concise, and natural. Suggested wording: "Found a bug or a feature that isn't working? Please leave a comment and let me know. Have an idea for another add-on or a new feature? Suggestions are always welcome!"
- Do not imply that every suggestion will be implemented or that every reported issue will be fixed immediately.
- Add this note to player-facing descriptions where appropriate; do not insert it into technical files, manifests, or catalog pages where it would be out of place.
