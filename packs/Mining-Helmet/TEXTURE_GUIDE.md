# 🎨 Mining Helmet — Texture Modification & UV Mapping Guide

This technical guide details the exact pixel mapping, palette structure, and UV offsets used to transform the vanilla **Golden Helmet** texture into the custom **Mining Helmet** (`custom:mining_helmet`).

---

## 📐 Overview of Assets

| Asset Type | File Path | Resolution | Format | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Armor Model Texture** | `textures/models/armor/mining_helmet_1.png` | 64 × 32 | PNG (RGBA) | Renders on the player/armor stand humanoid head model |
| **Inventory Item Icon** | `textures/items/mining_helmet.png` | 16 × 16 | PNG (RGBA) | Displayed in inventory, hotbar, and crafting results |
| **Attachable Hook** | `attachables/mining_helmet.json` | JSON | Bedrock 1.10+ | Binds model texture to `geometry.humanoid.armor.helmet` |
| **Item Texture Hook** | `textures/item_texture.json` | JSON | Bedrock Atlas | Maps `mining_helmet` icon to `textures/items/mining_helmet` |

---

## 🎨 Color Palette & Hex Reference

```
┌─────────────────┬───────────┬────────────────────────────────────────┐
│ Region          │ Hex Color │ Role / Description                     │
├─────────────────┼───────────┼────────────────────────────────────────┤
│ Gold Crown      │ #FFEB73   │ Hard hat top specular highlights       │
│ Gold Base Body  │ #FECD2D   │ Standard industrial gold hard hat body │
│ Gold Shadow     │ #C39114   │ Side temples, bevels, and under-brim   │
│ Rubber Lip/Rim  │ #202226   │ Heavy-duty bottom protective gasket    │
│ Metallic Mount  │ #3C4048   │ Dark gray forehead lantern bracket     │
│ Lamp Core Light │ #FFFFF0   │ Center bulb maximum emission cluster   │
│ Lamp Amber Glow │ #FFDC46   │ Warm halogen ambient lens fringe       │
└─────────────────┴───────────┴────────────────────────────────────────┘
```

---

## 🛠️ Detailed Pixel Mapping

### 1. Armor Model (`textures/models/armor/mining_helmet_1.png` — 64 × 32)
The standard Bedrock humanoid armor model uses a 64×32 canvas with two head layers:

#### A. Inner Head Base (UV: `0, 0` to `32, 16`)
- **Top Face (`8, 0` to `16, 8`):** Alternating `#FECD2D` and `#FFEB73` crown surface.
- **Front Face (`8, 8` to `16, 16`):** Solid `#FECD2D` base.
- **Side Faces (`0, 8` to `8, 16` & `16, 8` to `24, 16`):** Shaded `#C39114` gold.

#### B. Outer Helmet Shell (UV: `32, 0` to `64, 16`)
The outer layer inflates over the player's skull and contains the helmet features:
- **Top Cap (`40, 0` to `48, 8`):** Main hardhat ridge with `#FFEB73` center ridge lines at `X: 43..44`.
- **Front Face (`40, 8` to `48, 16`):**
  - **Forehead Lantern Bracket (Coordinates `X: 42..45, Y: 10..13`):**
    - A 4×4 dark metallic mount (`#3C4048`) centered squarely above the brow line.
  - **Centered Glowing Headlamp (Coordinates `X: 43..44, Y: 11..12`):**
    - Upper bulb pixels: `#FFFFF0` (intense white/daylight lens).
    - Lower bulb pixels: `#FFDC46` (warm halogen glow fringe).
  - **Rubber Rim Lining (Coordinates `X: 40..47, Y: 15`):**
    - A continuous 1-pixel dark rubber line (`#202226`) wrapping the entire bottom edge.
- **Side & Rear Panels (`32..39, 8..16`, `48..55, 8..16`, `56..63, 8..16`):**
  - Gold hardhat shell with the matching dark rubber lip at `Y: 15`.

---

### 2. Item Icon (`textures/items/mining_helmet.png` — 16 × 16)
- **Hard Hat Silhouette:** Modeled directly after `gold_helmet.png` from `X: 3..13, Y: 2..12`.
- **Mount & Headlamp:**
  - Bracket pixels at `(6, 5)`, `(9, 5)`, `(6, 7)`, `(9, 7)` using `#3C4048`.
  - Twin bulb pixels at `(7, 6)`, `(8, 6)` using glowing `#FFFFF0`.
  - Lens warmth at `(7, 7)`, `(8, 7)` using `#FFDC46`.
- **Rubber Gasket Brim:** Bottom row `Y: 10` shaded in dark rubber `#202226`.

---

## 📦 Blockbench / Image Editor Instructions

1. Open Blockbench $\rightarrow$ **Minecraft Skin / Entity Model** or open any standard pixel art editor (Aseprite, Photoshop, GIMP).
2. Load the vanilla `textures/models/armor/gold_1.png` file as a starting layer.
3. Apply the 4×4 bracket and 2×2 glowing bulb cluster to the front outer head UV `[40, 8, 48, 16]`.
4. Paint the bottom-most pixel row of the helmet shell (`Y: 15`) with the dark rubber rim `#202226`.
5. Export as a 32-bit PNG with alpha transparency preserved.
