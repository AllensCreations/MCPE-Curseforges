# 📋 Repository Guidelines & Markdown Standards

This document establishes the official documentation and packaging standards for all add-ons, behavior packs, resource packs, and custom maps in the **MCPE Curseforges** repository by **AllensCreations**.

All documentation files (`README.md` across repository root, packs, and maps) must strictly follow these rules to ensure seamless rendering across **CurseForge**, **MCPEDL**, **Planet Minecraft**, and **GitHub**.

---

## 1. 📝 Pure Markdown Compatibility (No Raw HTML)

CurseForge and several Minecraft add-on platforms use strict Markdown parsers that strip, break, or misalign raw HTML tags.

### Rules:
- **NO Raw HTML Tags:** Never use `<p>`, `<p align="center">`, `<div>`, `<img ...>`, `<br/>`, `<details>`, or `<summary>`.
- **Standard Image Syntax Only:** Always embed images using pure Markdown:
  ```markdown
  ![Description of Image](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/path/to/image.jpg)
  ```
- **Absolute GitHub URLs:** All images and file download links must use absolute GitHub raw links pointing to the `main` branch. This guarantees that images and downloads work regardless of where the markdown description is displayed or syndicated.
  - Image pattern: `https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/<Pack-Name>/<image-file>`
  - Download pattern: `https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/builds/<Pack-Name>/<filename>.mcaddon`
- **Clean Unicode Formatting:** Avoid LaTeX notation like `$\rightarrow$`. Use clean Unicode arrows (`→`) and standard bullet points.

---

## 2. 🎮 Player-Focused Descriptions (Zero Inside / Engine Jargon)

Pack descriptions are read by players, server owners, and content creators. Descriptions must be exciting, clear, and focused on survival gameplay.

### Rules:
- **No Developer Jargon:** Do not include internal Minecraft entity JSON component names or code parameters (e.g., do NOT mention `stop_distance: 4.5`, `random.levelup`, `minecraft:behavior.follow_owner`, `priority`, or `components`).
- **Translate Mechanics to Player Experience:**
  - *Incorrect:* "Companions use `stop_distance: 4.5` and teleport when distance > 20 to avoid occlusion."
  - *Correct:* "Companions maintain a respectful perimeter so they never crowd your camera or obstruct your view in combat. If you sprint far ahead, they safely catch up behind you."
- **Clear Gameplay Highlights:** Focus on what players can do, how items are crafted, and how mechanics enhance survival.

---

## 3. 🚫 No "How to Download" Tutorials

Do not include step-by-step device tutorials (e.g., "Step 1: Click the file. Step 2: Open with Minecraft...") in pack `README.md` files.

### Rules:
- **Reason:** CurseForge, MCPEDL, and Bedrock browsers have their own native installation buttons, app handlers, and instructions. Step-by-step tutorials clutter the description.
- **Provide a Direct Downloads Table Instead:** Present available packages cleanly in a standard Markdown table:
  ```markdown
  ## 📥 Downloads

  | Package | Format | Description | Download Link |
  | :--- | :--- | :--- | :--- |
  | **All-In-One Pack** | `.mcaddon` | Complete Behavior and Resource Pack | [⬇️ Download (.mcaddon)](URL) |
  ```

---

## 4. 📜 Mandatory Terms of Use & Content Creation Section

Every pack and map `README.md` must conclude with this standardized Terms of Use section:

```markdown
## 📜 Terms of Use & Guidelines

- **Creator Attribution:** Created by **AllensCreations**.
- **Rights & Reservation:** All rights reserved for AllensCreations.
- **Content Creators (YouTube, TikTok, Twitch):** You are 100% welcome to showcase this pack in videos, live streams, and reviews! Please include credit to **AllensCreations** and link to the official download page or this GitHub repository.
- **No Direct Re-uploading:** Do not re-upload this pack, its individual files, or modified copies to any website, app store, or file-sharing service.
- **No Paywalls or Link Shorteners:** It is strictly prohibited to distribute this pack behind paywalls, ad-gate links (e.g., AdFly, Linkvertise, Boost.ink), or paid monetization walls.
- **Server & Realm Use:** You are free to use this pack on your personal worlds, private servers, and Bedrock Realms.

---

© All rights reserved for AllensCreations.
```

---

## 5. 🚀 MCPEDL & CurseForge Distribution Prerequisites

Before importing or synchronizing any project from CurseForge to MCPEDL, ensure that you have already:
- Connected your Curseforge Account.
- Your project has an image with the title "MCPEDL" (no quotes). In Markdown: `![MCPEDL](image.jpg "MCPEDL")`.
- Your project files are already approved on CurseForge.
- Your project has the third party sharing option enabled in CurseForge project settings.

---

## 6. 🖼️ Visual Assets & Images

Whenever visual assets (promotional banners, artwork, item previews, recipe infographics) are stored in the repository, incorporate them directly into the pack description:

1. **Hero Banner:** Placed near the top below the main title.
2. **Pack Artwork / Logo:** Displayed in the About section.
3. **Recipe / Feature Infographics:** Placed in the corresponding mechanic section.
4. **Item Sprites:** Displayed alongside crafting and usage explanations.

All images must be optimized and stored in the respective `packs/<Pack-Name>/` folder.

---

## 6. 📁 Repository Organization

Keep the repository structure clean and organized:

```
MCPE-Curseforges/
├── INSTRUCTIONS.md                # This standards file
├── README.md                      # Catalog of all active packs, maps & minigames
├── banner.jpg                     # Master repository banner
├── packs/                         # Source folders for packs & addons
│   ├── <Pack-Name>/
│   │   ├── behavior_pack/         # BP source code
│   │   ├── resource_pack/         # RP source code
│   │   ├── README.md              # CurseForge-ready description
│   │   └── <images>               # Banners, infographics, previews
│   └── README.md
├── minigames/                     # Source folders for minigames & challenges
│   ├── <Game-Name>/
│   │   ├── behavior_pack/         # BP source code & game scripts
│   │   ├── pack_icon.png          # 1:1 square icon
│   │   └── README.md              # CurseForge-ready description
│   └── README.md
├── maps/                          # Source folders for custom maps
│   ├── <Map-Name>/
│   └── README.md
└── builds/                        # Compiled distribution archives
    ├── <Pack-Name>/               # .mcaddon / .mcpack binaries
    ├── <Game-Name>/               # .mcaddon / .mcpack binaries
    └── <Map-Name>/                # .mcworld binaries
```
