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

## Progression Order (24 phases)

Classic OneBlock flow: Overworld biomes, then caves, then the Nether, then the End.

| # | Phase | Blocks to finish | Theme |
|---|-------|------------------|-------|
| 1 | Plains & Early Roots | 300 | Dirt, oak, farm basics |
| 2 | Underground Cavern | 500 | Stone, coal, iron, copper |
| 3 | Snowy Taiga & Tundra | 600 | Spruce, snow, ice |
| 4 | Ocean Floor | 700 | Prismarine, coral, sand |
| 5 | Jungle Canopy | 800 | Jungle, bamboo, moss |
| 6 | Desert Dunes | 800 | Sandstone, gold |
| 7 | Badlands Mesa | 900 | Red sand, clay, gold |
| 8 | Savanna Plains | 900 | Acacia, hay, horses |
| 9 | Dark Forest & Mushroom Fields | 1000 | Dark oak, giant mushrooms, mycelium |
| 10 | Mangrove Swamp | 900 | Mud, mangrove roots |
| 11 | Cherry Grove | 1000 | Cherry wood, petals |
| 12 | Pale Garden | 1000 | Pale oak, resin, creaking |
| 13 | Windswept Highlands | 1100 | Emerald ore, spruce, mossy stone |
| 14 | Frozen Peaks & Ice Spikes | 1100 | Packed and blue ice, calcite |
| 15 | Craftsman's Workshop | 1200 | Wool, glass, concrete, bookshelves, colored terracotta, copper |
| 16 | Lush & Dripstone Caves | 1200 | Moss, azalea, dripstone |
| 17 | Deepslate Depths | 1200 | Deepslate ores, tuff |
| 18 | Trial Chambers | 1300 | Tuff bricks, copper, breeze |
| 19 | Deep Dark | 1200 | Sculk, echo shards |
| 20 | Nether Wastes | 1400 | Netherrack, quartz, ghasts |
| 21 | Crimson & Warped Forests | 1400 | Nylium, stems, hoglins |
| 22 | Bastion & Basalt Deltas | 1600 | Blackstone, ancient debris |
| 23 | The End | 1600 | End stone, obsidian |
| 24 | End City & Void Horizon | 2000 (endless) | Purpur, elytra, final phase |

`blocksRequired` is per phase, not cumulative. The last phase never ends. Total to reach phase 24: 23,700 blocks.

### Unlock model

Each phase lists only what it **unlocks**. Nothing is removed when you advance.

- `sampleBlock(phase)`, `sampleChestItem(phase)`, and `sampleMob(phase)` sample from phases 1 to the current phase.
- The newest phase's share of the weight ramps from 40% (phase 2) to 60% (last phase). Older phases share the rest evenly, so new content feels fresh.
- At phase 24 the full pool (173 blocks) stays active forever, with phase 24 still weighted highest.
- Duplicate ids are merged. Chest counts use the lowest min and highest max.
- Options: `{ exclusive: true }` samples the current phase only. `{ currentShare: 0.5 }` fixes the newest-phase share.
- Mob tags: `aquatic` (needs water) and `boss` (very strong, such as the warden). `sampleMob` skips both by default. Use `{ excludeTags: [] }` to allow them, or pass your own tag list.
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
