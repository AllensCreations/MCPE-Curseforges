# OneBlock Progression Data Pool

Centralized, authoritative **Data Pool** for Minecraft Bedrock (MCPE) OneBlock worlds, add-ons, and minigames.

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

- **Blocks Pool**: Weighted list of block IDs available in each phase.
- **Chests Pool**: Weighted loot tables and item counts for each phase.
- **Mobs Pool**: Weighted entity spawn list for each phase.
- **Milestones**: Target `blocksRequired` per phase and base fallback blocks.
- **Pool Provider**: `OneblockPoolProvider` helper for clean sampling without hardcoding rates.

---

## AI Prompt Template (Copy & Paste for Updates)

When editing or updating [`Oneblock_Progression.js`](./Oneblock_Progression.js), paste this prompt into your AI assistant session:

```markdown
You are an expert Minecraft Bedrock add-on and script developer.

I have updated or need to modify the OneBlock progression pools in `Mcpeworlds/Progression/Oneblock_Progression.js`.

### Architecture Rules:
1. `Oneblock_Progression.js` must ONLY contain Data Pools (blocks, chests, mobs, phase milestones). Do NOT embed map-specific game logic or hardcoded spawn rates here; packs implement their own rules.
2. All block, item, and entity identifiers must be valid Minecraft Bedrock IDs (e.g., `minecraft:grass_block`, `minecraft:oak_log`).
3. Maintain ES Module exports: `ONEBLOCK_PROGRESSION_POOLS`, `ONEBLOCK_PROGRESSION`, and `OneblockPoolProvider`.
4. Validate that weights and min/max counts are balanced across phases.
5. Verify syntax using `node --input-type=module --check`.

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
