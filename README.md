# 🎮 MCPE Curseforges — Addon Collections by AllensCreations

A curated collection of modular, production-ready Minecraft Bedrock (MCPE) Add-ons and Behavior Packs.

---

## 📂 Included Packs

| Pack Name | Type | Target Version | Download | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Vanilla Quality of Life** | Behavior Pack (Data-driven) | 1.21.x – 1.26.x Preview | [`builds/Vanilla_QoL_AllensCreations.mcpack`](builds/Vanilla_QoL_AllensCreations.mcpack) | ✅ Active (v1.2.0) |

---

## 🌟 Featured Pack: Vanilla Quality of Life (v1.2.0)

A lightweight, scriptless, data-driven Quality of Life overhaul designed for pure vanilla gameplay without conflicting with other mods.

### 🌟 Key Highlights & Feature Suite

1. **🪢 Universal Leashing across ALL Mobs & Pacification**:
   - **All 101+ Mobs Can Be Leashed**: Hostiles (Zombies, Skeletons, Creepers, Endermen, Wardens, Withers, Ghasts), Neutrals, Bosses, Aquatic mobs, and Vehicles.
   - **Hostiles Pacified While Leashed**: Hostile mobs cannot target or attack you while attached to a lead, making zoo and farm transport safe and fun.
   - **Villagers & Wandering Traders**: **Sneak + Right-Click** attaches a lead cleanly; normal click opens the trade window.

2. **🛡️ Pet & Mount Friendly-Fire & Explosion Immunity**:
   - Tamed dogs, cats, parrots, horses, donkeys, mules, and llamas take **zero damage** from player attacks, sweeps, and Creeper/TNT explosions.

3. **🍃 Fast Leaf Decay**:
   - Floating leaves rapidly decay within **1–2 seconds** after tree trunks are cut down.

4. **🪚 Full Stonecutter Woodcutter**:
   - The Stonecutter now cuts all wood types (Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Bamboo, Crimson, Warped):
     - Logs $\rightarrow$ 4 Planks, 8 Slabs, 4 Stairs
     - Planks $\rightarrow$ Slabs (2x), Stairs (1x), Trapdoors (1x), Fences (1x), Fence Gates (1x) at fair 1:1 ratios.

5. **🧪 16x Potion & Milk Bucket Stacking**:
   - Regular Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to **16** in inventory.

6. **🗡️ Offhand Equipment Support**:
   - Torches, Soul Torches, Lanterns, Soul Lanterns, Clocks, Compasses, and Recovery Compasses are equipable in the **Offhand slot**.

7. **💀 All Mob Head Trophy Drops on Player Kill**:
   - 2.5% base chance (+1% per Looting level) on player kills for **Zombie Heads**, **Skeleton Skulls**, **Creeper Heads**, and **Piglin Heads**.
   - Guaranteed **Dragon Head** + **Elytra** from the Ender Dragon.
   - **Player Heads** dropped in PvP combat.

8. **💎 Wandering Trader Collector Shop**:
   - Trade **1 Block of Diamonds** for any mob head (Zombie, Skeleton, Creeper, Wither Skeleton, Piglin, Player, Dragon).

9. **📦 100% Guaranteed Shulker Shells**:
   - Shulkers always drop **2 shells** upon death.

10. **🛏️ Automatic Single-Player Sleep**:
    - Automatically sets `playersSleepingPercentage 0` for seamless multiplayer sleep.

11. **🌱 Synthesis & Landscaping Recipes**:
    - Dirt + any Seed $\rightarrow$ **Grass Block**.
    - 3 Gravel $\rightarrow$ **3 Flint** (guaranteed).
    - 3 Sugar Cane $\rightarrow$ **6 Paper**.
    - 6 Glass Panes $\rightarrow$ **2 Glass Blocks**.
    - Cobblestone / Stone Bricks + Moss/Vine $\rightarrow$ **Mossy blocks**.
    - 8 Concrete Powder + 1 Water Bottle $\rightarrow$ **8 solid Concrete + 1 Glass Bottle**.
    - 2 Basalt + 2 Cobblestone $\rightarrow$ **4 Tuff**.
    - 1 Blast Furnace / Smoker $\rightarrow$ **1 regular Furnace**.
    - Repeaters & Comparators craftable with Cobblestone, Deepslate, or Blackstone.

---

## 📥 Installation

1. Download [`Vanilla_QoL_AllensCreations.mcpack`](builds/Vanilla_QoL_AllensCreations.mcpack).
2. Open or tap the file to automatically import it into Minecraft Bedrock.
3. Open your World Settings $\rightarrow$ **Behavior Packs** $\rightarrow$ Activate the pack.

---

## 🛠️ Repository Structure

```
MCPE-Curseforges/
├── builds/
│   └── Vanilla_QoL_AllensCreations.mcpack
├── packs/
│   └── Vanilla-Quality-of-Life/
│       ├── entities/       (101+ universal leashable mobs & protections)
│       ├── functions/      (Auto sleep & fast leaf decay tick)
│       ├── items/          (16x potions, milk & offhand equipables)
│       ├── loot_tables/    (Shulker shells & all mob head drops)
│       ├── recipes/        (250+ fair stairs, woodcutter, recycling)
│       ├── trading/        (Diamond Block mob head collector trades)
│       ├── manifest.json
│       ├── pack_icon.png
│       └── README.md
└── README.md
```
