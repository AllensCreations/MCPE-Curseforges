# Vanilla Quality of Life by AllensCreations

A lightweight, high-polish, data-driven Quality of Life behavior pack for Minecraft Bedrock (1.26.x Preview & 1.21.x).

Built using **100% pure vanilla JSON overrides** without any Script API engine dependencies, making it universally compatible across Bedrock platforms (PC, Mobile, Consoles, Dedicated Servers, and Realms).

---

## 🌟 Included Features

### 1. 🛡️ Pet & Mount Friendly-Fire Immunity
- **Tamed Wolves, Cats & Parrots**: Immune to all player-inflicted damage (sweeping attacks, accidental sword swings, arrows).
- **Tamed Horses, Donkeys, Mules & Llamas**: Protected from player friendly fire.
- **Explosion Immunity for Tamed Companions**: Tamed pets take 0 damage from creeper ambushes and accidental TNT/block explosions.

### 2. 🪢 Universal Leashing
- **Lead Villagers**: Easily guide villagers between trading halls, boats, and beds without minecart tracks or boats.
- **Lead Sea Turtles**: Move and protect breeding turtles effortlessly.

### 3. 💀 All Mob Head Drops on Player Kill
- **Zombie, Husk, Drowned**: 2.5% base chance (+1% per Looting level) to drop a **Zombie Head**.
- **Skeleton, Stray, Bogged**: 2.5% base chance (+1% per Looting level) to drop a **Skeleton Skull**.
- **Creeper**: 2.5% base chance (+1% per Looting level) to drop a **Creeper Head**.
- **Piglin, Zombified Piglin**: 2.5% base chance (+1% per Looting level) to drop a **Piglin Head**.
- **Wither Skeleton**: 10% base chance (+5% per Looting level) to drop a **Wither Skeleton Skull**.
- **Ender Dragon**: Guaranteed **Dragon Head** + **Elytra** + **Dragon's Breath** upon defeat.
- **PvP Player Head**: Players drop a **Player Head** when killed by another player in combat.

### 4. 💎 Wandering Trader Collector Shop (Diamond Blocks $\rightarrow$ Mob Heads)
- The Wandering Trader now sells every mob head for **1 Block of Diamonds**:
  - 1 Diamond Block $\rightarrow$ 1 Zombie Head
  - 1 Diamond Block $\rightarrow$ 1 Skeleton Skull
  - 1 Diamond Block $\rightarrow$ 1 Creeper Head
  - 1 Diamond Block $\rightarrow$ 1 Wither Skeleton Skull
  - 1 Diamond Block $\rightarrow$ 1 Piglin Head
  - 1 Diamond Block $\rightarrow$ 1 Player Head
  - 1 Diamond Block $\rightarrow$ 1 Dragon Head
- Also stocks rare biome items: Spore Blossoms, Wither Roses, Nautilus Shells, Bundles, Cherry Saplings, and Heart of the Sea.

### 5. 📦 100% Guaranteed Shulker Shells
- Every Shulker in End Cities drops **2 Shulker Shells** (1 complete Shulker Box per kill).

### 6. 🛏️ Automatic Single-Player Sleep
- Automatically sets `playersSleepingPercentage` to `0` on world tick so 1 player sleeping skips the night on Realms/multiplayer without cheats.

### 7. 🌱 Natural & Flora Crafting
- **Dirt + Seed $\rightarrow$ Grass Block**: 1 Dirt + 1 Seed (Wheat, Pumpkin, Melon, Beetroot, Torchflower, or Pitcher Pod) = **1 Grass Block**.
- **Guaranteed Flint**: 3 Gravel = **3 Flint** (shapeless).
- **Mossy Cobblestone & Stone Bricks**: 1 Cobblestone/Stone Brick + 1 Moss Block (or Vine) = **1 Mossy Block**.
- **Craftable Cobwebs**: 4 String + 1 Slimeball = **1 Cobweb**.
- **Craftable Spore Blossom**: 1 Moss Block + 1 Flowering Azalea + 1 Vine = **1 Spore Blossom**.
- **Renewable Calcite**: 1 Diorite + 1 Bone Meal = **1 Calcite**.
- **Craftable Bell**: 1 Gold Block + 3 Stone + 2 Sticks = **1 Bell**.
- **Renewable Sand**: 1 Sandstone / Red Sandstone = **4 Sand / Red Sand**.
- **Glow Ink Sac Synthesis**: 1 Ink Sac + 1 Glowstone Dust = **1 Glow Ink Sac**.
- **Prismarine Shard Synthesis**: 1 Quartz + 1 Lapis Lazuli + 2 Sand = **2 Prismarine Shards**.

### 8. 🪜 Fair 8-Stair Crafting Yield (95 Stair Types)
- 6 blocks yield **8 stairs** across all wood types, stones, deepslate, copper, tuff, and resin.

### 9. ⛓️ Fair Chain Crafting Yield
- 1 Iron/Copper Ingot + 2 Nuggets = **4 Chains** (instead of only 1).

### 10. ♻️ Complete Recycling & Uncrafting
- **2 Slabs $\rightarrow$ 1 Full Block**: Recombine extra slabs into solid blocks.
- **4 Stairs $\rightarrow$ 3 Full Blocks**: Recycle leftover stairs back into building blocks.
- **Wool $\rightarrow$ String**: 1 Wool (any color) = **4 String**.
- **Smelt Rotten Flesh**: Smelt or smoke Rotten Flesh to get **Leather**.
- **Amethyst, Quartz, Clay, Glowstone, Magma, Honeycomb, Melons, Nether Wart**: Fully uncraftable back into item ingredients.
- **Nether Brick Blocks**: Uncraft back into 4 Nether Brick items.
- **Ice Decompacting**: 1 Blue Ice = 9 Packed Ice; 1 Packed Ice = 9 Regular Ice.
- **Coarse Dirt Sifting**: 4 Coarse Dirt = 2 Dirt + 2 Gravel.
- **Craftable Saddles, Name Tags & Horse Armors**.

---

## 🚀 Installation

### Option 1: Direct `.mcpack` Double-Click (Recommended)
1. Transfer or double-click `Vanilla_QoL_AllensCreations.mcpack`.
2. Minecraft Bedrock will automatically launch and import the pack.
3. Open your World Settings -> **Behavior Packs** -> Activate **Vanilla Quality of Life by AllensCreations**.

### Option 2: Manual Folder Install
Copy the `vanilla_qol_allenscreations` folder to your Bedrock `behavior_packs` directory:
- **Windows**: `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\behavior_packs\`
- **Android**: `Android/data/com.mojang.minecraftpe/files/games/com.mojang/behavior_packs/`
- **Dedicated Server**: Place inside the `behavior_packs/` folder in your server directory.
