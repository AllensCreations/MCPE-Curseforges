# OneBlock Progression Data Pool

Centralized, authoritative **Data Pool** for Minecraft Bedrock (MCPE) OneBlock worlds, add-ons, and minigames.
Targets **Minecraft Bedrock 1.26.50**. All ids are Bedrock ids (for example `minecraft:magma`, `minecraft:quartz_ore`, `minecraft:hardened_clay`).

---

## 🏛️ Architecture & Separation of Concerns

> [!IMPORTANT]
> **`Oneblock_Progression.js` ONLY holds the Data Pools.**
> It specifies what blocks, items, mobs, and milestone thresholds exist in each phase.
>
> **Pack-Specific Rules Belong in the Pack:**
> All gameplay logic, chest spawn conditions, entity spawn rates, custom events, cooldowns, island mechanics, and marketplace triggers must remain in the **individual pack's scripts**. The pack reads from this data pool and applies its own rules.

---

## What `Oneblock_Progression.js` Contains

- **Blocks Pool**: Weighted list of full solid block ids per phase (no plants or fluids).
- **Chests Pool**: Weighted loot with item counts per phase (no buckets, fluids, powders, spawn eggs, spawners, or shulker items).
- **Mobs Pool**: Weighted entity spawn list per phase.
- **Milestones**: Per-phase `blocksRequired` and a fallback `bedrockReplacement` block.
- **Pool Provider**: `OneblockPoolProvider` helper for clean sampling without hardcoding rates.

---

## Progression Order (21 phases)

Classic OneBlock flow: Overworld biomes, then caves, then the Nether, then the End.

| # | Phase | Blocks to finish | Theme |
|---|-------|------------------|-------|
| 1 | Plains & Early Roots | 150 | Dirt, oak, farm basics |
| 2 | Underground Cavern | 250 | Stone, coal, iron, copper |
| 3 | Snowy Taiga & Tundra | 300 | Spruce, snow, ice |
| 4 | Ocean Floor | 350 | Prismarine, coral, sand |
| 5 | Jungle Canopy | 400 | Jungle, bamboo, moss |
| 6 | Desert Dunes | 400 | Sandstone, gold |
| 7 | Badlands Mesa | 450 | Red sand, clay, gold |
| 8 | Savanna Plains | 450 | Acacia, hay, horses |
| 9 | Dark Forest & Mushroom Fields | 500 | Dark oak, giant mushrooms, mycelium |
| 10 | Mangrove Swamp | 450 | Mud, mangrove roots |
| 11 | Cherry Grove | 500 | Cherry wood, petals |
| 12 | Pale Garden | 500 | Pale oak, resin, creaking |
| 13 | Windswept Highlands | 550 | Emerald ore, spruce, mossy stone |
| 14 | Craftsman's Workshop | 600 | Wool, glass, concrete, bookshelves, colored terracotta, copper |
| 15 | Deepslate Depths | 600 | Deepslate ores, tuff |
| 16 | Deep Dark | 600 | Sculk, echo shards |
| 17 | Nether Wastes | 700 | Netherrack, quartz, ghasts |
| 18 | Crimson & Warped Forests | 700 | Nylium, stems, hoglins |
| 19 | Bastion & Basalt Deltas | 800 | Blackstone, ancient debris |
| 20 | The End | 800 | End stone, obsidian |
| 21 | End City & Void Horizon | endless | Purpur, elytra, final phase |

`blocksRequired` is per phase, not cumulative. The last phase never ends. Total to reach phase 21: 10,050 blocks.

### Unlock model

Each phase lists only what it **unlocks**. Nothing is removed when you advance.

- `sampleBlock(phase)`, `sampleChestItem(phase)`, and `sampleMob(phase)` sample from phases 1 to the current phase.
- The newest phase gets 40% of the weight. Older phases share the other 60% evenly, so new content feels fresh.
- At phase 21 the full pool (163 blocks) stays active forever, with phase 21 still weighted highest.
- Duplicate ids are merged. Chest counts use the lowest min and highest max.
- Options: `{ exclusive: true }` samples the current phase only. `{ currentShare: 0.6 }` changes the newest-phase share.
- `getUnlockedPool(phase, "blocks" | "chests" | "mobs")` returns the merged weighted list if your pack wants to apply its own rules.

---

## AI Prompt Template (Copy & Paste for Updates)

When editing or updating [`Oneblock_Progression.js`](./Oneblock_Progression.js), paste this prompt into your AI assistant session:

```markdown
You are an expert Minecraft Bedrock add-on and script developer.

I have updated or need to modify the OneBlock progression pools in `Mcpeworlds/Progression/Oneblock_Progression.js`.

### Architecture Rules:
1. `Oneblock_Progression.js` must ONLY contain Data Pools (blocks, chests, mobs, phase milestones). Do NOT embed map-specific game logic or hardcoded spawn rates here; packs implement their own rules.
2. All block, item, and entity identifiers must be valid Minecraft Bedrock IDs (e.g., `minecraft:grass_block`, `minecraft:oak_log`). Use Bedrock names, not Java names (`minecraft:magma`, `minecraft:quartz_ore`, `minecraft:hardened_clay`).
3. Keep the classic order: Overworld biomes, caves, Nether, End. The final phase is endless. Each phase lists only what it unlocks; the provider merges earlier phases (unlock model).
4. Block pools: full solid blocks only (no plants, fluids, portals, spawners). Chest pools: no buckets, fluids, powders, spawn eggs, spawners, or shulker items.
5. Maintain ES Module exports: `ONEBLOCK_PROGRESSION_POOLS`, `ONEBLOCK_PROGRESSION`, `OneblockPoolProvider`, and `OneBlockProgressionManager`.
6. Validate that weights and min/max counts are balanced across phases (each pool sums to 100).
7. Verify syntax using `node --input-type=module --check`.

### My Changes / Pool Requirements:
[INSERT YOUR NEW PHASES, BLOCKS, CHEST ITEMS, OR MOBS HERE]
```

---

## Example: How Packs Consume the Data Pool

Inside a specific pack (e.g. `behavior_pack/scripts/game.js`), the pack defines its own rules (like spawn rates) and uses the data pool:

```javascript
import { OneblockPoolProvider } from "./lib/Oneblock_Progression.js";

const pool = new OneblockPoolProvider();

// The pack decides its own rules:
const PACK_RULES = {
  chestChance: 0.05,       // Pack-specific rule
  mobChance: 0.03,         // Pack-specific rule
  spawnBossEvery: 500      // Pack-specific mechanic
};

export function handleBlockBreak(player, blockLocation, currentPhase) {
  // Pack rule: Check if a chest should spawn
  if (Math.random() < PACK_RULES.chestChance) {
    const itemReward = pool.sampleChestItem(currentPhase);
    spawnChestWithItem(blockLocation, itemReward);
    return;
  }

  // Otherwise spawn next block from pool
  const nextBlock = pool.sampleBlock(currentPhase);
  setBlock(blockLocation, nextBlock.id);
}
```
