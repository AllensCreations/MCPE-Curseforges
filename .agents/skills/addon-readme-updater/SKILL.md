---
name: addon-readme-updater
description: >-
  Inspects new or scaffolded Minecraft Bedrock add-ons across MCPEDL/new_addons and MCPEDL/addons,
  analyzes their scripts, entities, animation controllers, language files, and manifests,
  and generates or updates a comprehensive, standardized README.md while synchronizing parent catalogs.
---

# Add-on README Updater Skill

Use this skill whenever a new Minecraft Bedrock add-on is created, scaffolded, or modified without complete documentation. This workflow inspects all source files (scripts, entity JSONs, animation controllers, texts, and manifests) to generate or update the pack's `README.md` with rich gameplay documentation, and synchronizes the parent catalog READMEs.

---

## Workflow Steps

### Step 1: Identify the Target Add-on
1. If a path is provided (e.g. `MCPEDL/new_addons/<Addon-Name>` or `MCPEDL/addons/<Addon-Name>`), target that specific directory.
2. If no path is provided, discover add-ons needing documentation:
   - Check all folders under `MCPEDL/new_addons/` and `MCPEDL/addons/`.
   - Identify folders missing a `README.md` or containing template placeholders (e.g. `<!-- TODO: Describe what this addon does. -->`).

### Step 2: Comprehensive Source Inspection
Read and analyze all source files within the add-on folder:
- **Manifests** (`behavior_pack/manifest.json`, `resource_pack/manifest.json`):
  - Extract display name, pack description, version, and `min_engine_version`.
  - Confirm `"metadata"` with `"authors": ["AllensCreations"]` and `"product_type": "addon"`.
- **Scripts** (`behavior_pack/scripts/**/*.js`, `*.ts`):
  - Scan for Bedrock Script API events (`system.runInterval`, `world.afterEvents.*`, `world.beforeEvents.*`).
  - Extract custom commands, chat interactions, item use triggers, and scoreboards.
- **Entity Definitions** (`behavior_pack/entities/**/*.json`):
  - Inspect components: `minecraft:tameable`, `minecraft:is_tamed`, `minecraft:rideable`, `minecraft:interact`, `minecraft:behavior.*`, `minecraft:damage_sensor`, etc.
  - Note interaction items (e.g., sweet berries, bones), sitting pose triggers, health buffs, and equipment slots.
- **Resource Pack Definitions** (`resource_pack/animation_controllers/`, `resource_pack/entity/`, `resource_pack/texts/en_US.lang`):
  - Inspect animation controllers for custom states, sitting curl-ups, charging animations, or sound triggers.
  - Check `en_US.lang` for action strings (e.g., `action.interact.sit`, `action.interact.equip`).
- **Functions, Items, and Recipes** (`behavior_pack/functions/`, `behavior_pack/items/`, `behavior_pack/recipes/`).

### Step 3: Generate the Standardized Add-on `README.md`
Write the add-on's `README.md` adhering to the AllensCreations documentation standard.
**Style Rule**: Do not use emojis in headings, feature lists, or text. Maintain a clean, professional, and technical markdown tone consistent with existing packs like `Vanilla-Quality-of-Life` and `Mining-Helmet`.

```markdown
# [Addon-Name] — Minecraft Bedrock Addon

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-[ENGINE_VER]%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v[VER]-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-[.MCPACK_OR_.MCADDON]-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: [Concise 1-2 sentence description]

---

## Overview

[In-depth summary describing what the add-on does, why it was created, and how it enhances the Minecraft Bedrock survival or multiplayer experience.]

---

## Features

- **[Feature Name]**: Detailed explanation of the mechanic.
- **[Feature Name]**: Detailed explanation of the mechanic.
- **[Feature Name]**: Detailed explanation of the mechanic.

---

## How It Works & In-Game Usage

[Step-by-step instructions or mechanics table detailing items needed, interact prompts, commands, sitting/standing triggers, and technical components.]

| Interaction / Action | Requirement / Item | In-Game Result |
| :--- | :--- | :--- |
| ... | ... | ... |

---

## Installation

1. Download the \`.[mcaddon/mcpack]\` file from the [releases](../README.md).
2. Open or double-tap the file to auto-import into Minecraft Bedrock.
3. Apply the **[Addon-Name] BP** (and **RP** if applicable) in your world settings.
4. Ensure appropriate experiments or cheats settings match the add-on requirements.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Video & Showcase: Content creators may feature this addon with credit to AllensCreations.
- Redistribution: Do not re-upload or provide direct monetized download bypasses.
- Rights: All rights reserved for AllensCreations.

---

© All rights reserved for AllensCreations.
```

### Step 4: Synchronize Parent Catalogs
1. **Category Catalog** (`MCPEDL/<folder>/README.md`):
   - Update or add the project row in the table under `## Available Source Add-ons`.
2. **Root Catalog** (`README.md`):
   - Ensure the project row exists under `## Active Add-ons Catalog`.
   - Update the detailed project overview section (`### Add-on X: ...`).
3. **Builds Catalog** (`builds/README.md`):
   - Ensure download links reflect the compiled `.mcaddon` or `.mcpack`.
4. Alternatively, execute:
   ```bash
   python3 scripts/auto_bump_and_build.py --project "<Addon-Name>" --no-bump
   ```
   to auto-sync all catalogs with the updated metadata and rebuilt packages.
