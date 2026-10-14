# ⛑️ Mining Helmet — Dynamic Hands-Free Lighting Add-on [Bedrock / MCPE]

![Mining Helmet Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Mining-Helmet/1791946330457.jpg)

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.20.80%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Mining-Helmet/Mining_Helmet_AllensCreations.mcaddon)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Mining-Helmet/Mining_Helmet_AllensCreations.mcaddon)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

> **Created by AllensCreations**  
> *Illuminate your deepest cave expeditions without holding a single torch! Hands-free Level 15 dynamic light that follows your gaze wherever you mine.*

---

## 1. 🔦 Catchy Title & Hook

### Tired of holding torches in the dark or spamming them across every cavern floor?
Meet the **Mining Helmet** (`custom:mining_helmet`) — the ultimate survival quality-of-life equipment for Minecraft Bedrock Edition! Slip this industrial gold hard hat onto your head armor slot, and watch pitch-black ravines, deepslate caves, and Nether fortresses instantly light up with **Level 15 real-time dynamic following light**. Keep your main hand gripped on your trusty pickaxe and your offhand locked onto your shield while your forehead lantern paves the way through the abyss!

---

## 2. 📖 About the Addon (Overview)

Mining in Minecraft survival has always presented a frustrating dilemma: do you waste inventory space holding torches, sacrifice your offhand shield, or constantly stop mining every 5 seconds to place down lights?

The **Mining Helmet Add-on** completely solves this problem with an authentic vanilla-faithful solution:
- **Hands-Free Exploration:** Your helmet acts as an active headlamp. Move through unlit caverns, dig out strip mines, or brave the night surface without placing a single torch.
- **Bedrock Script API Powered:** Unlike outdated behavior packs that flood your world with permanent phantom blocks, this add-on utilizes `@minecraft/server` to dynamically project temporary native `minecraft:light_block` emission around your head in real time.
- **Fail-Proof Zero Residue:** Every light source is strictly tracked and automatically wiped clean the split second you step away, unequip the helmet, switch dimensions, die, or disconnect. Your survival world stays 100% clean and pristine!
- **Survival-Balanced Protection:** Functions as full head armor offering 2 Defense points with 165 durability. Repair it at an anvil with Gold Ingots and enchant it with your favorite armor spells!

---

## 3. ⚡ How It Works (Gameplay & Mechanics)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HOW THE SYSTEM OPERATES                         │
├────────────────────────────────────────────────────────────────────────┤
│  1. Craft & Equip       ➔  Slip custom:mining_helmet into head slot.   │
│  2. Real-Time Tracking  ➔  Engine samples player head position (tick). │
│  3. Dynamic Beam        ➔  Places temporary Light Level 15 at player.  │
│  4. Zero-Residue Cleanup➔  Restores previous block to air immediately. │
└────────────────────────────────────────────────────────────────────────┘
```

### 💡 Core Mechanics Breakdown
- **🔆 True Level 15 Dynamic Emission:** Casts the maximum light level possible in Minecraft Bedrock. Monsters cannot spawn within your immediate personal light perimeter while moving.
- **🧹 Fail-Proof Cleanup Engine:** 
  - Walking or running restores the previous block back to `air` instantly.
  - Unequipping the helmet immediately extinguishes the beam.
  - Dimension travel (Overworld $\leftrightarrow$ Nether $\leftrightarrow$ End) safely unregisters and clears light positions.
  - Player death or world logouts trigger instantaneous cleanup callbacks—**zero ghost light blocks, zero lag, and zero world corruption.**
- **🛡️ Durability & Defense Specs:**
  - **Defense:** 2 Armor points (equivalent to standard Golden/Iron grade protection).
  - **Durability:** 165 uses.
  - **Anvil Repair Material:** Gold Ingots (`minecraft:gold_ingot`).
- **✨ Full Enchantment Compatibility:**
  - Fully compatible with Enchanting Tables and Anvil enchanted books:
  - Supports **Protection (I–IV)**, **Unbreaking (I–III)**, **Mending**, **Aqua Affinity**, and **Respiration (I–III)**.

### 🎮 Step-by-Step Usage Guide for Players
1. **Craft your Mining Helmet** at any standard 3×3 Crafting Table using either a **Lantern** or a **Torch** combined with a **Golden Helmet**.
2. **Equip the Helmet** directly onto your head armor slot in your inventory.
3. **Step into the dark!** High-intensity light immediately emanates from your forehead.
4. **Mine, fight, and sprint freely** with both hands occupied by your sword, pickaxe, food, or shield!

---

## 4. 🛠️ Crafting Recipes & Items (Minecraft UI / HTML-Ready)

### ⛑️ Custom Item: Mining Helmet (`custom:mining_helmet`)

![Mining Helmet Item Texture](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Mining-Helmet/mining_helmet_preview.png)

> **Custom Item Icon:** Handcrafted 16×16 Bedrock pixel art featuring an industrial gold miner hard hat with reinforced crown deflection ridges, vulcanized dark rubber rim gasket, and a front-mounted metallic bracket containing an electric white-hot glowing headlamp.

| Attribute | Specification |
| :--- | :--- |
| **Identifier** | `custom:mining_helmet` |
| **Equip Slot** | Head Armor (`slot.armor.head`) |
| **Light Level** | Dynamic Level 15 Light Emission |
| **Defense Value** | 2 Armor Points |
| **Base Durability** | 165 Durability |
| **Repair Material** | Gold Ingot (`minecraft:gold_ingot`) |
| **Enchantability** | Full table/anvil support (Protection, Mending, Unbreaking, Aqua Affinity, Respiration) |

---

### 🔨 Recipe 1: Lantern + Golden Helmet (Recommended — As Shown on Banner)

Combine a standard Lantern with a Golden Helmet to forge your heavy-duty industrial Mining Helmet.

#### 🎨 HTML/CSS Minecraft 3×3 Crafting Grid UI
*(Ready to render or capture via `html2image` / `wkhtmltoimage`)*

```html
<!-- START: Mining Helmet Crafting Grid (Recipe 1 - Lantern) -->
<div style="display:inline-block; background:#c6c6c6; border:4px solid; border-color:#ffffff #555555 #555555 #ffffff; padding:16px; font-family:'Courier New', monospace, sans-serif; box-shadow:4px 4px 0px #00000088;">
  <div style="font-size:14px; font-weight:bold; color:#3f3f3f; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">Crafting Table (3x3)</div>
  <div style="display:flex; align-items:center; gap:20px;">
    <!-- 3x3 Grid -->
    <div style="display:grid; grid-template-columns:repeat(3, 44px); grid-template-rows:repeat(3, 44px); gap:4px; background:#8b8b8b; padding:4px; border:2px solid; border-color:#373737 #ffffff #ffffff #373737;">
      <!-- Row 1 -->
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center; font-size:20px;" title="Lantern">🏮</div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <!-- Row 2 -->
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center; font-size:20px;" title="Golden Helmet">👑</div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <!-- Row 3 -->
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
    </div>
    <!-- Arrow -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <span style="font-size:32px; color:#555555; font-weight:bold; line-height:1;">➔</span>
    </div>
    <!-- Result Slot -->
    <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; padding:4px;">
      <div style="width:56px; height:56px; background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center; font-size:28px;" title="Mining Helmet (Yield: 1)">⛑️</div>
    </div>
  </div>
  <div style="margin-top:10px; font-size:12px; color:#4a4a4a;">Yields: 1x Mining Helmet</div>
</div>
<!-- END: Mining Helmet Crafting Grid -->
```

#### 📋 Text Fallback Grid
```
[     ] [ Lantern ] [     ]
[     ] [Gold Helm] [     ]
[     ] [         ] [     ]
→ Yields: 1x Mining Helmet
```

---

### 🔨 Recipe 2: Torch + Golden Helmet (Early Game Recipe)

Craft your initial headlamp early in survival using a simple Torch and Golden Helmet.

#### 🎨 HTML/CSS Minecraft 3×3 Crafting Grid UI
*(Ready to render or capture via `html2image` / `wkhtmltoimage`)*

```html
<!-- START: Mining Helmet Crafting Grid (Recipe 2 - Torch) -->
<div style="display:inline-block; background:#c6c6c6; border:4px solid; border-color:#ffffff #555555 #555555 #ffffff; padding:16px; font-family:'Courier New', monospace, sans-serif; box-shadow:4px 4px 0px #00000088;">
  <div style="font-size:14px; font-weight:bold; color:#3f3f3f; margin-bottom:12px; text-transform:uppercase; letter-spacing:1px;">Crafting Table (3x3)</div>
  <div style="display:flex; align-items:center; gap:20px;">
    <!-- 3x3 Grid -->
    <div style="display:grid; grid-template-columns:repeat(3, 44px); grid-template-rows:repeat(3, 44px); gap:4px; background:#8b8b8b; padding:4px; border:2px solid; border-color:#373737 #ffffff #ffffff #373737;">
      <!-- Row 1 -->
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center; font-size:20px;" title="Torch">🕯️</div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <!-- Row 2 -->
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center; font-size:20px;" title="Golden Helmet">👑</div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <!-- Row 3 -->
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
      <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center;"></div>
    </div>
    <!-- Arrow -->
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
      <span style="font-size:32px; color:#555555; font-weight:bold; line-height:1;">➔</span>
    </div>
    <!-- Result Slot -->
    <div style="background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; padding:4px;">
      <div style="width:56px; height:56px; background:#8b8b8b; border:2px solid; border-color:#373737 #ffffff #ffffff #373737; display:flex; align-items:center; justify-content:center; font-size:28px;" title="Mining Helmet (Yield: 1)">⛑️</div>
    </div>
  </div>
  <div style="margin-top:10px; font-size:12px; color:#4a4a4a;">Yields: 1x Mining Helmet</div>
</div>
<!-- END: Mining Helmet Crafting Grid -->
```

#### 📋 Text Fallback Grid
```
[     ] [  Torch  ] [     ]
[     ] [Gold Helm] [     ]
[     ] [         ] [     ]
→ Yields: 1x Mining Helmet
```

---

## 5. 📥 Installation & Experimental Settings Guide

### 📱 Easy Installation Steps
1. **Download the All-In-One Bundle:** Grab the latest [`Mining_Helmet_AllensCreations.mcaddon`](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Mining-Helmet/Mining_Helmet_AllensCreations.mcaddon).
2. **Import into Minecraft:** Tap or double-click the `.mcaddon` file. Minecraft will launch automatically and import both the Behavior Pack and Resource Pack with success notifications.
3. **Activate in World Settings:**
   - Open your World Settings $\rightarrow$ **Behavior Packs** $\rightarrow$ Activate **Mining Helmet BP by AllensCreations**.
   - Under **Resource Packs**, verify **Mining Helmet RP by AllensCreations** is active.

### ⚙️ Required Experimental Features Checklist
To allow the dynamic lighting Script API to function properly, verify the following toggle in your world settings:

- [x] **Beta APIs** $\rightarrow$ **ENABLED** *(Required for `@minecraft/server` real-time dynamic light block placement and cleanup)*
- [ ] Holiday Creator Features $\rightarrow$ *Not needed (Uses modern 1.20+ format)*
- [ ] Upcoming Creator Features $\rightarrow$ *Not needed*
- [ ] Molang Features $\rightarrow$ *Not needed*

---

## 6. 📜 Terms of Use & Guidelines

- **Creator Attribution:** Created by **AllensCreations**. Always credit "AllensCreations" and link to this repository/MCPEDL page when sharing.
- **Content Creators & Streamers:** You are 100% free and encouraged to showcase, review, or use this add-on in your YouTube, TikTok, Twitch, or Kick videos and live streams! Please include a link back to this official page in your description.
- **Redistribution Policy:** Strictly **DO NOT** re-upload this pack, `.mcaddon`, or modified source files to third-party file hosters, app stores, or behind paid link shorteners (Linkvertise, AdFly, etc.). Direct players to the official page.
- **Feedback & Bug Reporting:** Have a suggestion, found a bug, or want to contribute? File an issue or join the discussion in our [GitHub Repository](https://github.com/AllensCreations/MCPE-Curseforges) or community Discord server!
