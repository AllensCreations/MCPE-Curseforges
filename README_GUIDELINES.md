# Commercial & Promotional README Instructions

This document provides guidelines and instructions for writing, formatting, and maintaining all `README.md` documentation across **MCPE-Curseforges** so they are clean, simple, and optimized for commercial presentation and promotion on platforms like MCPEDL, CurseForge, PlanetMinecraft, and web portals.

---

## 1. Core Rule: Zero Developer Clutter & Evergreen Content
README files are marketing and player showcase pages. They must not contain internal developer artifacts, code jargon, or ephemeral version labels:
- ❌ **No Add-on Versions**: Do not put the add-on version (e.g. `Release-v1.0.3`, `v1.3.1`, or release badges) in the `README.md`. Keep documentation evergreen and decoupled from version bumps.
- ❌ **No Script API References**: Never mention `Script API` or `@minecraft/server` in badges, text, or tables. Use player-facing terms like "modern Minecraft Bedrock mechanics".
- ❌ **No Code Blocks**: Do not include markdown code blocks (` ```javascript `, ` ```json `, ` ```text `).
- ❌ **No Developer Internal Keywords**: Never mention `Beta APIs`, `manifest.json`, event handlers (`entityHitBlock`, `entityHurt`), or tick timing logic (`staggered 10-tick interval`).
- ❌ **No Dev Shorthand**: Avoid "BP" and "RP". Use "Behavior Pack", "Resource Pack", or "Complete Pack (.mcaddon)".
- ❌ **No Code Configuration Tutorials**: Never instruct players to edit JavaScript files. Present configurable behaviors as clean tables or in-game commands/tags.

---

## 2. Commercial Showcase Writing Style
- **Focus on Player Benefits**: Emphasize ease of use, survival convenience, exciting immersion, and multiplayer fun.
- **Short & Punchy Sections**: Keep paragraphs under 3-4 sentences. Use bullet points and clean tables instead of dense text walls.
- **Player-Friendly Performance Reassurance**:
  - Instead of technical profiling: *"Zero idle lag—only activates when interacting with blocks or mobs."*
  - Instead of API versions: *"Optimized for smooth survival worlds and multiplayer Realms."*
  - Instead of item serialization: *"Preserves all tool enchantments, custom anvil names, and durability."*

---

## 3. Formatting & External Platform Compatibility
To ensure the markdown renders identically on external platforms (MCPEDL, CurseForge, web portals):
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

---

## 4. Standard Project README Template

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
