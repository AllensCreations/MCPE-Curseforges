# Repository Guidelines and Markdown Standards

This document establishes the official documentation and packaging standards for all add-ons, behavior packs, resource packs, and custom maps in the MCPE Curseforges repository by AllensCreations.

All documentation files (README.md across repository root, packs, and maps) must strictly follow these rules to ensure seamless rendering across CurseForge, MCPEDL, Planet Minecraft, and GitHub.

---

## 1. Pure Markdown Compatibility (No Raw HTML)

CurseForge and several Minecraft add-on platforms use strict Markdown parsers that strip, break, or misalign raw HTML tags.

### Rules:
- NO Raw HTML Tags: Never use `<p>`, `<p align="center">`, `<div>`, `<img ...>`, `<br/>`, `<details>`, or `<summary>`.
- Standard Image Syntax Only: Always embed images using pure Markdown:
  `![MCPEDL](image.jpg "MCPEDL")`
- Relative Paths: Use clean, relative paths for local assets (e.g., `banner.jpg`, `1791889944961.jpg`, `recipe_lantern.png`).
- Clean Formatting: Avoid LaTeX notation like `$\rightarrow$`. Use clean arrows (`->` or unicode arrows) and standard bullet points.
- No Emojis: Do not include emojis in headings, titles, bullet points, or body text.

---

## 2. Technical and Factual Descriptions (Zero Marketing Slop)

Pack descriptions must be direct, technical, and focused on gameplay and mechanics.

### Rules:
- No Developer Jargon in Player Guides: Translate internal JSON components into clear player mechanics.
- No AI Slop or Marketing Hype: Avoid rhetorical questions, buzzwords, and promotional hype (e.g., "Tired of holding torches?", "Meet your new best friend!", "revolutionary").
- Clear Gameplay Highlights: Focus on exact values, light levels, durability points, crafting recipes, and technical specifications.

---

## 3. Direct Downloads

Present available packages cleanly in a standard Markdown table:

| Package | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **All-In-One Pack** | `.mcaddon` | Complete Behavior and Resource Pack | [Download (.mcaddon)](../../builds/<Pack-Name>/<filename>.mcaddon) |

---

## 4. Mandatory Guidelines and Attribution Section

Every pack and map README.md must conclude with this standardized section:

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

## 5. Visual Assets and Images

Whenever visual assets (promotional banners, artwork, item previews, recipe infographics) are stored in the repository, incorporate them directly into the pack description:

1. Hero Banner: Placed near the top below the main title.
2. Pack Artwork: Displayed in the Overview or Features section.
3. Recipe Infographics: Placed in the Crafting Recipes section as pre-rendered standalone PNG images.
4. Item Sprites: Displayed alongside item specifications.

---

## 6. Repository Organization

```
MCPE-Curseforges/
├── INSTRUCTIONS.md                # This standards file
├── README.md                      # Catalog of all active packs, maps & minigames
├── banner.jpg                     # Master repository banner
├── packs/                         # Source folders for packs & addons
│   ├── <Pack-Name>/
│   │   ├── behavior_pack/         # BP source code
│   │   ├── resource_pack/         # RP source code
│   │   ├── README.md              # Documentation
│   │   └── <images>               # Banners, infographics, previews
│   └── README.md
├── minigames/                     # Source folders for minigames & challenges
│   ├── <Game-Name>/
│   │   ├── behavior_pack/         # BP source code & game scripts
│   │   ├── pack_icon.png          # 1:1 square icon
│   │   └── README.md              # Documentation
│   └── README.md
├── maps/                          # Source folders for custom maps
│   ├── <Map-Name>/
│   │   ├── behavior_pack/
│   │   ├── pack_icon.png
│   │   └── README.md              # Documentation
│   └── README.md
└── builds/                        # Compiled distribution archives
    ├── <Pack-Name>/               # .mcaddon / .mcpack binaries
    ├── <Game-Name>/               # .mcaddon / .mcpack binaries
    └── <Map-Name>/                # .mcworld binaries
```
