---
name: mcpe-readme
description: Commercial and promotional README and CHANGELOG standards for Minecraft Bedrock (MCPE) packs, add-ons, maps, and scripts. Enforces player-first showcase styling, mobile cards, absolute URLs, and zero developer clutter.
---

# Commercial & Promotional README and Changelog Guidelines for Minecraft Bedrock

This skill enforces strict rules, writing guidelines, and templates for creating and maintaining `README.md` and `CHANGELOG.md` files across Minecraft Bedrock (MCPE) add-ons, maps, and scripts. All documentation must be clean, evergreen, player-focused, and tailored for commercial presentation and promotion on platforms like MCPEDL, CurseForge, PlanetMinecraft, and web showcases.

---

## Part 1: README.md Guidelines

### 1. Strictly Forbidden (Zero Developer Clutter)
README files are player showcase pages. They must NEVER contain internal developer artifacts, code jargon, or ephemeral version labels:
- ❌ **No Add-on Versions**: Do not put the add-on version (e.g. `Release-v1.0.3`, `v1.3.1`, or release badges) in the `README.md`. Keep documentation evergreen and decoupled from version bumps.
- ❌ **No Script API References**: Never mention `Script API` or `@minecraft/server` in badges, text, or tables. Use player-facing terms like "modern Minecraft Bedrock mechanics".
- ❌ **No Code Blocks**: Do not include markdown code blocks (` ```javascript `, ` ```json `, ` ```text `).
- ❌ **No Markdown Tables in Project READMEs**: Do not use Markdown tables (`| ... | ... |`) in individual project READMEs. Tables break on mobile screens by forcing horizontal overflow and awkward scrolling. Use clean mobile card sections (`### [Feature / Item Name]` with bullet points) instead.
- ❌ **No Developer Internal Keywords**: Never mention `Beta APIs`, `manifest.json`, event handlers (`entityHitBlock`, `entityHurt`), or tick timing logic (`staggered 10-tick interval`).
- ❌ **No Dev Shorthand**: Avoid "BP" and "RP". Use "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- ❌ **No Code Configuration Tutorials**: Never instruct players to edit JavaScript files. Present configurable behaviors as clean card highlights or in-game commands/tags.

### 2. Commercial Showcase & Mobile-First Writing Style
- **Mobile-First Card Layout**: Highlight features, interactions, equipment stats, and recipes in concise Markdown cards with clear headings (`### [Feature Name]`) and clean bullet points (`- **Description**: ...` or `- **What Happens**: ...`). This renders smoothly on mobile phones, tablets, and desktop displays without horizontal clipping.
- **Focus on Player Benefits**: Emphasize ease of use, survival convenience, exciting immersion, and multiplayer fun.
- **Short & Punchy Sections**: Keep paragraphs under 3-4 sentences. Use bullet points and clean mobile cards instead of dense text walls.
- **Player-Friendly Performance Reassurance**:
  - Instead of technical profiling: *"Zero idle lag—only activates when interacting with blocks or mobs."*
  - Instead of API versions: *"Optimized for smooth survival worlds and multiplayer Realms."*
  - Instead of item serialization: *"Preserves all tool enchantments, custom anvil names, and durability."*

### 3. Formatting, External Readability & SEO
To ensure the markdown renders identically on external platforms (MCPEDL, CurseForge, web portals, mobile apps):
1. **Absolute Image URLs**:
   All image embeds (`<img>` or `![]()`) must use absolute raw URLs:
   ```
   https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/<path-to-image>
   ```
2. **Absolute Navigation & Download Links**:
   All markdown links pointing to directories, files, or downloads must use full GitHub URLs:
   ```
   https://github.com/AllensCreations/MCPE-Curseforges/tree/main/<path>
   https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/<file>
   ```
3. **Bottom Search & Discovery Keywords (SEO) — Grounded in the Add-on's README**:
   Every project `README.md` must conclude with a tailored SEO section. **Do NOT use generic placeholder keywords alone.**
   - **Use the Add-on's README as the Basis**: Extract terms directly from the pack's actual features, mechanics, mob types, item names, commands, and gameplay benefits described across its cards and overview.
   - **Structure**: Include high-intent player search phrases that directly match what the specific add-on offers.
   - **Formula**:
     1. General Bedrock anchors (`Minecraft Bedrock add-on`, `Minecraft PE mod`, `MCPEDL add-on`, `CurseForge Bedrock`, `AllensCreations`).
     2. Specific feature anchors extracted from the README (e.g. for Mining Helmet: `dynamic lighting add-on`, `wearable lantern Bedrock`, `cave light mod MCPE`; for Monster Companions: `tame hostile mobs`, `pet creeper add-on`, `rideable spider Bedrock`).
     3. Gameplay keywords (e.g. `survival QoL`, `no experimental features add-on`, `achievement friendly MCPE`).

   ```markdown
   ---

   ## Search & Discovery Keywords

   Minecraft Bedrock add-on, [Add-on Name] Bedrock mod, [Core Feature 1 from README], [Core Feature 2 from README], [Item/Mob Name from README], Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
   ```

### 4. Standard Project README Template

```markdown
# [Add-on Name] — [Exciting Promotional Subtitle] for Minecraft Bedrock

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/[category]/[slug]/banner.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)

**By AllensCreations**

**[HIGH IMPACT TAGLINE IN ALL CAPS]**

[One-sentence punchy summary of what the add-on delivers for players.]

---

## Overview

[2-3 engaging, descriptive sentences explaining what the add-on does in survival.]

[Mention achievement friendliness, zero setup required, and smooth multiplayer experience.]

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

- Minecraft Bedrock Edition 1.21.0+
- No experimental features required
- Preserves Xbox achievements
- Compatible with Mobile, Windows PC, Consoles, and Realms

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
