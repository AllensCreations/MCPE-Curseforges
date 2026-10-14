---
name: mcpe-curseforges-readme
description: >-
  Standardized instructions and guidelines for creating and maintaining README.md
  documentation across all Minecraft Bedrock packs and minigames in MCPE-Curseforges.
---

# MCPE Curseforges README Documentation Standard

This skill establishes the strict formatting, structural, and visual rules for all `README.md` files within the `MCPE-Curseforges` repository. All future pack, minigame, and map documentation must follow this specification to maintain uniformity across the collection.

---

## Strict Rules and Prohibitions

1. **No Emojis:**
   - Do not include emojis anywhere in titles, headers, bullet points, table cells, or text bodies.
   - Use clean, standard Markdown text formatting instead.

2. **No Catchy Title Hooks or AI Slop:**
   - Avoid buzzwords, hyperbole, rhetorical questions, and marketing filler (e.g., "Tired of holding torches?", "Meet your new best friend!", "revolutionary", "production-ready").
   - Maintain a direct, technical, factual, and informative developer-grade tone.

3. **No Raw HTML for Crafting Recipes:**
   - Never embed raw HTML/CSS blocks for crafting tables.
   - Crafting grids must be pre-rendered as standalone PNG images (e.g., `recipe_lantern.png`, `recipe_torch.png`) matching the classic Minecraft GUI slot aesthetic, and embedded via standard Markdown image syntax:
     `![Crafting Recipe: Item Name](recipe_image.png)`

4. **Relative Image Paths Only:**
   - Never use `raw.githubusercontent.com` URLs for images, icons, or banners.
   - Always use repository-relative paths (e.g., `banner.jpg`, `recipe_lantern.png`, `packs/Mining-Helmet/1791946330457.jpg`).
   - This ensures images render reliably across private repositories, forks, and GitHub authenticated sessions.

---

## Standard README Structure

Every pack `README.md` must follow this order:

### 1. Header & Banner
- Level 1 Heading: `# <Pack Name> - <Brief Technical Descriptor> for Minecraft Bedrock`
- Showcase Banner Image: `![<Pack Name> Banner](<banner-file>)`
- Standard Bedrock Badges: Version compatibility, Release version, Format (`.MCADDON`), Platform.
- Creator and Description lines:
  ```markdown
  Creator: AllensCreations  
  Description: <Direct 1-sentence technical summary of the pack's functionality>
  ```

### 2. Overview
- Clear, factual explanation of the pack's concept, mechanics, and core systems.
- Explain the underlying engine (e.g., Bedrock Script API `@minecraft/server` or data-driven JSON components).
- Detail cleanup behavior, fail-safes, and performance characteristics (zero residue, zero lag).

### 3. Features & Specifications
- List all functional mechanics with exact values.
- Where tiered power, ranges, or durations exist (e.g., Torch = Light Level 10 vs. Lantern = Light Level 15), provide a structured comparison table:
  ```markdown
  | Equipment / Item | Value / Power Level | Type | Description |
  | :--- | :---: | :--- | :--- |
  ```
- Technical details: Durability, armor points, repair materials, enchantment support, command syntax.

### 4. Item & Texture Specifications
- Embedded item preview image: `![<Item Name> Texture](<item_preview>.png)`
- Attribute table:
  - Identifiers (`custom:...`)
  - Texture file path
  - Model file path
  - Native resolution (16x16 icon, 64x32 armor model)
  - Equipment slot
  - Repair item
  - Enchantability value

### 5. Crafting Recipes
- Embed pre-rendered recipe image: `![Crafting Recipe: <Recipe Name>](<recipe_image>.png)`
- Pattern description in text for accessibility.
- Result item and yield count.

### 6. Installation & Settings
- Numbered installation instructions for `.mcaddon` or `.mcpack`.
- Checklist of required Experimental Toggles (e.g., Beta APIs: ENABLED).

### 7. Guidelines & Attribution
- Creator attribution: AllensCreations.
- Content creator / video recording policy.
- Strict no-reupload / direct download bypass policy.
