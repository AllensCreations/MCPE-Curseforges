# ⛑️ Mining Helmet — Minecraft Bedrock Add-on

![Mining Helmet Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Mining-Helmet/1791946330457.jpg)

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.20.80%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Mining-Helmet/Mining_Helmet_AllensCreations.mcaddon)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Mining-Helmet/Mining_Helmet_AllensCreations.mcaddon)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

> **Created by AllensCreations**  
> *Hands-free dynamic following lighting for deep cave spelunking and night survival.*

---

## 📖 Overview

The **Mining Helmet** (`custom:mining_helmet`) is a production-ready equipment add-on for Minecraft Bedrock Edition. Equipped directly in your head armor slot, it illuminates your surroundings with high-intensity dynamic light (Light Level 15) that moves with you in real time—leaving both your main hand and offhand completely free for pickaxes, swords, and shields.

Built on the stable **Bedrock Script API (`@minecraft/server`)**, it uses temporary native `minecraft:light_block` updates that automatically clean up upon movement, unequip, dimension change, death, or disconnect—guaranteeing zero permanent light residue in your world.

---

## 🎨 Custom Item Texture & Visuals

### ⛑️ Mining Helmet Item Texture (`custom:mining_helmet`)

![Mining Helmet Item Texture](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Mining-Helmet/mining_helmet_preview.png)

> **Handcrafted 16×16 Item Texture:** Modeled with an industrial gold hard hat body, raised central crown impact ridges, a heavy-duty dark rubber rim gasket, and a centered dark alloy mounting bracket holding an electric white-hot glowing headlamp.

| Attribute | Specification |
| :--- | :--- |
| **Identifier** | `custom:mining_helmet` |
| **Texture File** | [`resource_pack/textures/items/mining_helmet.png`](resource_pack/textures/items/mining_helmet.png) |
| **Atlas Hook** | [`resource_pack/textures/item_texture.json`](resource_pack/textures/item_texture.json) |
| **Native Resolution** | 16 × 16 PNG (RGBA 32-bit pixel art) |
| **Equip Slot** | Head Armor (`slot.armor.head`) |
| **Dynamic Light Emission** | Real-time Light Level 15 following beam |
| **Durability** | 165 uses (Gold grade, repairable on an anvil using Gold Ingots) |
| **Defense** | 2 Armor points |
| **Model Texture** | [`textures/models/armor/mining_helmet_1.png`](resource_pack/textures/models/armor/mining_helmet_1.png) (64 × 32 Humanoid) |

#### 🎨 Palette & Color Reference
- **Hard Hat Crown & Body:** Specular highlight `#FFF176` / `#FFEB73`, industrial gold base `#FBC02D` / `#FECD2D`, and depth shade `#F57F17` / `#C46200`.
- **Protective Rim & Gasket:** Heavy-duty vulcanized rubber `#2E2822` / `#202226`.
- **Forehead Bracket:** Dark alloy steel mounting plate `#37474F`.
- **Headlamp Bulb Core:** Intense electric white `#FFFFFF` with warm halogen emission halo `#FFF9C4` & `#FFE082`.

👉 *For full UV offset coordinates, humanoid armor mesh attachment, and Blockbench mapping instructions, consult the [Technical Texture & UV Mapping Guide](TEXTURE_GUIDE.md).*

---

## 🌟 Feature Highlights

- **💡 Hands-Free Level 15 Dynamic Light:** Emits maximum brightness directly from your forehead lantern as you walk, sprint, or dig.
- **🧹 Fail-Proof Zero-Residue Cleanup:** Light blocks are instantly restored back to `air` whenever you move away, take off the helmet, die, or leave the game.
- **🛡️ Gold/Iron Grade Armor Protection:** Provides 2 Armor defense points with 165 durability, repairable on an anvil using Gold Ingots.
- **✨ Full Enchantment Support:** Supports Unbreaking, Protection, Mending, Aqua Affinity, and Respiration via Enchanting Table and Anvils.
- **🎨 Custom Golden Helmet Model & Textures:** Features an open-face miner hard hat with raised crown ribs, dark rubber lining along the bottom rim, and a centered metallic headlamp bracket with glowing bulb pixels.

---

## 🛠️ Crafting Recipes

Craft your Mining Helmet at any standard Crafting Table using either of the following recipes:

### Recipe 1: Lantern + Golden Helmet (Recommended — As Shown on Banner)
```
[   ] [   Lantern   ] [   ]
[   ] [ Gold Helmet ] [   ]
[   ] [             ] [   ]
→ Yields: 1x Mining Helmet
```
> 💡 *Combine a vanilla Lantern with a Golden Helmet to forge your hands-free Mining Helmet!*

### Recipe 2: Torch + Golden Helmet (Early Game)
```
[   ] [    Torch    ] [   ]
[   ] [ Gold Helmet ] [   ]
[   ] [             ] [   ]
→ Yields: 1x Mining Helmet
```

---

## 📥 Direct Downloads

| Package | Format | Size | Description | Download Link |
| :--- | :--- | :--- | :--- | :--- |
| **Mining Helmet Add-on** | `.mcaddon` | ~750 KB | Complete all-in-one pack (Behavior Pack + Resource Pack with high-res banner icon) | [⬇️ **Download .mcaddon**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Mining-Helmet/Mining_Helmet_AllensCreations.mcaddon) |

---

## 🚀 Installation Guide

### 📱 Android, iOS & iPadOS
1. Click the download link to save `Mining_Helmet_AllensCreations.mcaddon`.
2. Tap the file in your browser or Files app and select **Open with Minecraft**.
3. Minecraft will import both the Behavior Pack and Resource Pack.
4. Open your World Settings $\rightarrow$ **Behavior Packs** $\rightarrow$ Activate **Mining Helmet BP by AllensCreations**.
5. Enable **Beta APIs** under the Experiments tab if your version prompts for it.

### 💻 Windows 10 / 11
1. Double-click `Mining_Helmet_AllensCreations.mcaddon` to install.
2. Activate both packs in your World Settings.

---

## 📜 Terms of Use & Guidelines

- **Creator Attribution:** Created by **AllensCreations**.
- **Content Creators:** You are free to feature this add-on in YouTube, TikTok, or Twitch videos! Please link back to this repository.
- **Redistribution:** Do not re-upload to third-party app stores or behind paid link-shorteners.
