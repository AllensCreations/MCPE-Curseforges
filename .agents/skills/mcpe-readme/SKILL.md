---
name: mcpe-readme
description: Download-only README, commercial DESCRIPTION, and link-free CHANGELOG standards for Minecraft Bedrock packs, add-ons, maps, and scripts. Enforces player-first writing and zero developer clutter.
---

# Commercial DESCRIPTION and Changelog Guidelines for Minecraft Bedrock

This skill defines download-focused README.md, commercial DESCRIPTION.md, and link-free CHANGELOG.md rules for Minecraft Bedrock add-ons, maps, and scripts. Follow repository `INSTRUCTIONS.md` for shared policy and `README_GUIDELINES.md` for canonical rules. Source accuracy and the user's requested scope override any template.

---

## Part 1: README.md and DESCRIPTION.md Guidelines

### 1. Strictly Forbidden (Zero Developer Clutter)
Individual add-on README.md files are download-focused landing pages; detailed product information belongs in DESCRIPTION.md. Include the add-on name/version, direct download link (or official download catalog if no direct file is available), package format, concise generic import steps, and a link to DESCRIPTION.md. Do not duplicate feature details, recipes, compatibility claims, images, attribution, SEO, or changelog content there. DESCRIPTION.md is the player-facing product page and follows the rules below:
- **Version information:** For add-on project README headings, include the verified release version as `# Add-on Name (vX.Y.Z)` and keep it synchronized with the pack manifest. Never omit a required version or duplicate the suffix. Put `by AllensCreations` in the manifest description, not the title.
- **Creator profile links:** Include [CurseForge](https://www.curseforge.com/members/allenscreations/projects) and [MCPEDL](https://mcpedl.com/user/allenscreations/) in DESCRIPTION.md, never in the download-only README.md. Do not put these links in the short in-game manifest description.
- ❌ **No Script API References**: Never mention `Script API` or `@minecraft/server` in badges, text, or tables. Use player-facing terms like "modern Minecraft Bedrock mechanics".
- ❌ **No Code Blocks**: Do not include markdown code blocks (` ```javascript `, ` ```json `, ` ```text `).
- ❌ **No Markdown Tables in Project READMEs**: Do not use Markdown tables (`| ... | ... |`) in individual project READMEs. Tables break on mobile screens by forcing horizontal overflow and awkward scrolling. Use clean mobile card sections (`### [Feature / Item Name]` with bullet points) instead.
- ❌ **No Developer Internal Keywords**: Never mention `Beta APIs`, `manifest.json`, event handlers (`entityHitBlock`, `entityHurt`), or tick timing logic (`staggered 10-tick interval`).
- ❌ **No Dev Shorthand**: Avoid "BP" and "RP". Use "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- ❌ **No Code Configuration Tutorials**: Never instruct players to edit JavaScript files. Present configurable behaviors as clean card highlights or in-game commands/tags.

### 2. Commercial Showcase & Mobile-First Writing Style
- **Mobile-First Card Layout**: Highlight features, interactions, equipment stats, and recipes in concise Markdown cards with clear headings (`### [Feature Name]`) and clean bullet points (`- **Description**: ...` or `- **What Happens**: ...`). This renders smoothly on mobile phones, tablets, and desktop displays without horizontal clipping.
- **Focus on Player Benefits**: Explain verified gameplay benefits in polished, clear language without hype or filler.
- **Short & Punchy Sections**: Keep paragraphs under 3-4 sentences. Use bullet points and clean mobile cards instead of dense text walls.
- **Evidence-based benefits:** Describe performance, activation conditions, multiplayer, enchantments, and durability only as far as source inspection or tests verify. Never claim "zero lag," universal device/Realms compatibility, achievement preservation, or complete enchantment/durability preservation without evidence.

### 3. Formatting, External Readability & SEO
To ensure the markdown renders identically on external platforms (MCPEDL, CurseForge, web portals, mobile apps):
1. **Controlled Images in Add-on Documentation**:
   Individual add-on `README.md` files must not embed images. Add-on `DESCRIPTION.md` files may include item sprites and crafting recipe diagrams only, using verified absolute raw GitHub URLs. Do not include promotional banners, general screenshots, or unrelated artwork. Crafting diagrams must follow the source-based workflow in `INSTRUCTIONS.md`.
2. **Absolute Navigation & Download Links**:
   For individual add-on README.md files, use a verified direct package download URL when available, or link only to the official download catalog. Put source navigation and all other links in DESCRIPTION.md. Use verified full GitHub URLs for published links. Relative links are appropriate for internal repository references where useful:
   ```
   https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>
   https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/<file>
   ```
3. **Bottom Search & Discovery Keywords (SEO) — Grounded in DESCRIPTION.md**:
   Every individual project `DESCRIPTION.md` should end with a tailored SEO section, with attribution/copyright immediately before it. Do not force SEO into directory catalogs or generic repository documentation. **Do NOT use generic placeholder keywords alone.**
   - **Use the Add-on's DESCRIPTION.md as the Basis**: Extract terms directly from the pack's actual features, mechanics, mob types, item names, commands, and gameplay benefits described across its cards and overview.
   - **Structure**: Include high-intent player search phrases that directly match what the specific add-on offers.
   - **Formula**:
     1. General Bedrock anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `AllensCreations`).
     2. Specific feature anchors extracted from the README (e.g. for Mining Helmet: `dynamic lighting add-on`, `wearable lantern Bedrock`, `cave light mod MCPE`; for Monster Companions: `tame hostile mobs`, `pet creeper add-on`, `rideable spider Bedrock`).
     3. Gameplay keywords (e.g. `survival QoL`, `no experimental features add-on`, `achievement friendly MCPE`).

   ```markdown
   ---

   ## Search & Discovery Keywords

   Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [Core Feature 1 from DESCRIPTION.md], [Core Feature 2 from DESCRIPTION.md], [Item/Mob Name from DESCRIPTION.md], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
   ```

### 4. Standard Project README Template

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

Keep README focused on downloading and importing. Put detailed customer-facing product information in DESCRIPTION.md.

### 5. Standard Project DESCRIPTION.md Template

Use the existing product-page template in `README_GUIDELINES.md` for overview, features, usage, compatibility, attribution, and search keywords.

---

## Overview

[Two or three concise sentences explaining the verified gameplay purpose, expected use, and relevant limitations. Mention achievement support, setup requirements, or multiplayer only when verified.]

---

## Key Features

### [Feature Name]
- **Description**: [Player-focused explanation of what it does]

### [Feature Name]
- **Description**: [Player-focused explanation of what it does]

---

## How It Works

### [Interaction Name]
- **Requirement**: [Required Item / Key / Action]
- **What Happens**: [In-game result and visual feedback]

---

## Compatibility

- Minecraft Bedrock Edition: [verified minimum version]
- Experimental features: [state only after checking the project]
- Achievements: [state only when supported by evidence or testing]
- Supported platforms and multiplayer: [list only verified targets]

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
```

---

## Part 2: CHANGELOG.md Guidelines

CHANGELOG files communicate updates directly to players and community users. They must also be written in a **promotional, player-facing voice** without internal developer clutter:

### 1. Structure & Conventions
- Maintain entries in reverse-chronological order (newest release at the top).
- Follow Semantic Versioning: `## [X.Y.Z] - YYYY-MM-DD`.
- Organize under clear, descriptive headings:
  - `### Added` — New gameplay features, items, creatures, or mechanics.
  - `### Improved & Balanced` — Refinements, performance boosts, or tuning.
  - `### Fixed` — Bug fixes described in terms of in-game experience (not line numbers or stack traces).

### 2. Player-First Language in Changelogs
- **No links in changelogs:** Never add hyperlinks, raw URLs, Markdown links, linked project names, badges, or link references anywhere in CHANGELOG.md.
- ✅ **DO explain player impact**:
  - *"Decorative leaf protection: Custom player-placed hedges and bushes are now safely ignored by the tree capitator."*
  - *"Smooth dynamic lighting: Equipping or holding torches now illuminates dark caverns with zero stutter."*
- ❌ **DON'T include developer internals**:
  - Do NOT cite function names like `executeTreeCapitator()`, `permutation.getState("persistent_bit")`, or `world.afterEvents`.
  - Do NOT paste JSON diffs, TypeScript types, or AST changes.
  - Do NOT reference commit hashes or CI pipeline steps.

### 3. Standard CHANGELOG.md Template

```markdown
# Changelog — [Add-on Name]

All notable updates and improvements to the **[Add-on Name]** add-on by AllensCreations are documented in this file.

---

## [1.0.0] - YYYY-MM-DD

### Added
- **[Feature Title]**: [Clear, exciting summary of the newly added gameplay feature and how players use it].

### Improved & Balanced
- **[Enhancement Title]**: [Player-friendly description of performance tuning, balance changes, or visual upgrades].

### Fixed
- **[Fix Title]**: [Description of what in-game bug or glitch was resolved].
```
