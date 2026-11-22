import { BlockPermutation, ItemStack, system, world } from "@minecraft/server";
import { activeCountdowns, ONEBLOCK_POS, TUTORIAL_BLOCKS, SURROUNDING_OFFSETS, lastKnownOneBlockType, activeLuckyRush, mainPending, lastProgressTick } from "./config.js";
import { getDimKey, getDimensionState, pickWeighted, spawnOneBlockChest, getPlayerDims } from "./helpers.js";
import { incrementDimensionCount } from "./phase-events.js";

// Handles automated block destruction/removal by Pistons, TNT, Creepers, or Environmental causes
export function handleAutomatedBlockDestruction(dimension) {
  try {
    const dimKey = getDimKey(dimension.id);
    if (activeCountdowns.get(dimKey)) return;

    const block = dimension.getBlock(ONEBLOCK_POS);
    const isLiquid = block && (block.typeId === "minecraft:water" || block.typeId === "minecraft:flowing_water" || block.typeId === "minecraft:lava" || block.typeId === "minecraft:flowing_lava");
    const isMissing = !block || block.isAir || block.typeId === "minecraft:air" || isLiquid;
    if (!isMissing) return;

    const state = getDimensionState(dimKey);
    const phase = state.phase;

    // Roll lucky chest spawn (5% chance) - only after Phase 3 in Overworld
    const isEarlyGame = (dimKey === "overworld" && (state.count < TUTORIAL_BLOCKS.length || state.phaseIndex <= 3));
    const rollChest = Math.random();
    if (!isEarlyGame && rollChest < 0.05 && phase && phase.chests && phase.chests.length > 0) {
      const items = [];
      const numItems = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numItems; i++) {
        const entry = pickWeighted(phase.chests);
        const count = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
        try {
          items.push(new ItemStack(entry.id, count));
        } catch (ie) {}
      }
      spawnOneBlockChest(dimension, items);
      dimension.playSound("random.chestopen", ONEBLOCK_POS, { pitch: 1.0, volume: 1.0 });
    }

    // Determine next block to regenerate
    let nextBlockType;
    if (dimKey === "overworld" && state.count < TUTORIAL_BLOCKS.length) {
      // Automated platform placement for the first 8 Dirts (steps 0 to 7)
      if (state.count < SURROUNDING_OFFSETS.length) {
        const offset = SURROUNDING_OFFSETS[state.count];
        try {
          const sideBlock = dimension.getBlock({ x: offset.x, y: 64, z: offset.z });
          if (sideBlock && sideBlock.isAir) {
            sideBlock.setType("minecraft:dirt");
            dimension.spawnParticle("minecraft:villager_happy", { x: offset.x + 0.5, y: 64.5, z: offset.z + 0.5 });
          }
        } catch (err) {}
      }

      if (state.count + 1 < TUTORIAL_BLOCKS.length) {
        nextBlockType = TUTORIAL_BLOCKS[state.count + 1].block;
      } else {
        nextBlockType = pickWeighted(phase.blocks).id;
      }
    } else {
      nextBlockType = pickWeighted(phase.blocks).id;
    }

    try {
      const b = dimension.getBlock(ONEBLOCK_POS);
      if (b) {
        b.setType(nextBlockType);
        lastKnownOneBlockType[dimKey] = nextBlockType;
      }
    } catch (pe) {}

    try {
      const cb = dimension.getBlock(ONEBLOCK_POS);
      if (cb && cb.isAir) cb.setType(dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt"));
    } catch (fb) {}

    // Advance progression for automated destruction (TNT, Piston, etc.)
    incrementDimensionCount(dimKey, dimension);
  } catch (err) {}
}

// Auto-renews the OneBlock immediately whenever it is detected as air or missing
export function renewOneBlock(dimension) {
  try {
    const dimKey = getDimKey(dimension.id);
    if (activeCountdowns.get(dimKey)) return false;

    // 1. Bedrock foundation at (0, 63, 0) directly below the OneBlock:
    // Guarantees gravity blocks (sand, gravel, concrete powder) never fall into the void!
    try {
      const bFloor = dimension.getBlock({ x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z });
      if (bFloor && bFloor.typeId !== "minecraft:bedrock") {
        bFloor.setType("minecraft:bedrock");
      }
    } catch (bfe) {}

    const block = dimension.getBlock(ONEBLOCK_POS);
    if (!block) return false;

    const bType = block.typeId;
    const isLiquid = bType === "minecraft:water" || bType === "minecraft:flowing_water" ||
                     bType === "minecraft:lava" || bType === "minecraft:flowing_lava";
    const isAir = block.isAir || bType === "minecraft:air" || isLiquid || bType === "minecraft:bedrock";

    if (!isAir) {
      lastKnownOneBlockType[dimKey] = bType;
      return false; // Block is already present and solid
    }

    // 2. Clear liquid if fluid flowed into the OneBlock slot
    if (isLiquid) {
      try { block.setType("minecraft:air"); } catch (ce) {}
    }

    // 3. Determine target block to renew based on active dimension & phase progression
    const state = getDimensionState(dimKey);
    const phase = state.phase;
    let nextBlockType;

    if (dimKey === "overworld" && state.count < TUTORIAL_BLOCKS.length) {
      nextBlockType = TUTORIAL_BLOCKS[state.count].block;
    } else if (activeLuckyRush.get(dimKey)) {
      const luckyBlocks = ["minecraft:gold_ore", "minecraft:iron_ore", "minecraft:diamond_ore", "minecraft:emerald_ore", "minecraft:lapis_ore"];
      nextBlockType = luckyBlocks[Math.floor(Math.random() * luckyBlocks.length)];
    } else if (phase && phase.blocks && phase.blocks.length > 0) {
      nextBlockType = pickWeighted(phase.blocks).id;
    } else {
      nextBlockType = dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt");
    }

    // 4. Place renewed block with fail-proof multi-tier fallbacks
    let renewed = false;
    try {
      block.setType(nextBlockType);
      if (!block.isAir && block.typeId !== "minecraft:air") {
        renewed = true;
        lastKnownOneBlockType[dimKey] = nextBlockType;
      }
    } catch (e1) {}

    if (!renewed) {
      try {
        block.setPermutation(BlockPermutation.resolve(nextBlockType));
        if (!block.isAir && block.typeId !== "minecraft:air") {
          renewed = true;
          lastKnownOneBlockType[dimKey] = nextBlockType;
        }
      } catch (e1b) {}
    }

    if (!renewed) {
      try {
        dimension.runCommand(`setblock ${ONEBLOCK_POS.x} ${ONEBLOCK_POS.y} ${ONEBLOCK_POS.z} ${nextBlockType}`);
        const checkB = dimension.getBlock(ONEBLOCK_POS);
        if (checkB && !checkB.isAir && checkB.typeId !== "minecraft:air") {
          renewed = true;
          lastKnownOneBlockType[dimKey] = nextBlockType;
        }
      } catch (e1c) {}
    }

    // Fallback 1: Dimension default block
    if (!renewed) {
      const dimDefault = dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt");
      try {
        block.setType(dimDefault);
        if (!block.isAir && block.typeId !== "minecraft:air") {
          renewed = true;
          lastKnownOneBlockType[dimKey] = dimDefault;
        }
      } catch (e2) {}

      if (!renewed) {
        try {
          block.setPermutation(BlockPermutation.resolve(dimDefault));
          if (!block.isAir && block.typeId !== "minecraft:air") {
            renewed = true;
            lastKnownOneBlockType[dimKey] = dimDefault;
          }
        } catch (e2b) {}
      }

      if (!renewed) {
        try {
          dimension.runCommand(`setblock ${ONEBLOCK_POS.x} ${ONEBLOCK_POS.y} ${ONEBLOCK_POS.z} ${dimDefault}`);
          renewed = true;
          lastKnownOneBlockType[dimKey] = dimDefault;
        } catch (e2c) {}
      }
    }

    // Fallback 2: Universal dirt
    if (!renewed) {
      try {
        block.setType("minecraft:dirt");
        lastKnownOneBlockType[dimKey] = "minecraft:dirt";
        renewed = true;
      } catch (e3) {
        try {
          dimension.runCommand(`setblock ${ONEBLOCK_POS.x} ${ONEBLOCK_POS.y} ${ONEBLOCK_POS.z} dirt`);
          lastKnownOneBlockType[dimKey] = "minecraft:dirt";
          renewed = true;
        } catch (e3b) {}
      }
    }

    // 5. Visual/Audio auto-renew feedback
    if (renewed) {
      try {
        dimension.spawnParticle("minecraft:villager_happy", { x: ONEBLOCK_POS.x + 0.5, y: ONEBLOCK_POS.y + 1.2, z: ONEBLOCK_POS.z + 0.5 });
        dimension.playSound("dig.stone", ONEBLOCK_POS, { pitch: 1.2, volume: 0.5 });
      } catch (pe) {}
    }

    return renewed;
  } catch (err) {
    return false;
  }
}

export function ensureOneBlock(dimension) {
  try {
    const dimKey = getDimKey(dimension.id);
    if (activeCountdowns.get(dimKey)) return;

    // Bedrock foundation guarantee at (0, 63, 0)
    if (system.currentTick % 20 === 0) {
      const bedrockPos = { x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z };
      try {
        const bFloor = dimension.getBlock(bedrockPos);
        if (bFloor && bFloor.typeId !== "minecraft:bedrock") {
          bFloor.setType("minecraft:bedrock");
        }
      } catch (bfe) {}
    }

    const block = dimension.getBlock(ONEBLOCK_POS);
    const isLiquid = block && (block.typeId === "minecraft:water" || block.typeId === "minecraft:flowing_water" || block.typeId === "minecraft:lava" || block.typeId === "minecraft:flowing_lava");
    const stuckBedrock = !!block && block.typeId === "minecraft:bedrock";
    const isMissing = !block || block.isAir || block.typeId === "minecraft:air" || isLiquid || stuckBedrock;

    // A block that vanished without any break/explosion handler counting it within 3 ticks
    // (piston, plant pop, decay) counts as progress once. Player breaks are never double counted.
    const pend = mainPending.get(dimKey);
    if (pend !== undefined && system.currentTick - pend >= 3) {
      mainPending.delete(dimKey);
      if ((lastProgressTick.get(dimKey) ?? -99) < pend) incrementDimensionCount(dimKey, dimension);
    }

    if (isMissing) {
      if (block && !stuckBedrock && lastKnownOneBlockType[dimKey] && !mainPending.has(dimKey)) {
        mainPending.set(dimKey, system.currentTick);
      }
      renewOneBlock(dimension);
    } else if (block) {
      lastKnownOneBlockType[dimKey] = block.typeId;
    }
  } catch (err) {}
}

// Cleanly removes any lingering scoreboard sidebar from the game
export function clearScoreboardObjective() {
  try { world.scoreboard.removeObjective("oneblock_stats"); } catch (e) {}
  try {
    const ow = world.getDimension("overworld");
    if (ow) {
      ow.runCommand("scoreboard objectives remove oneblock_stats");
    }
  } catch (ce) {}
}

// Ultra-Fast Auto-Renewal Loop (runs every 1 tick / 0.05s) to guarantee OneBlock NEVER stays air!
export function oneBlockRenewTick() {
  const active = getPlayerDims();
  for (const [key, dimId] of [["overworld", "overworld"], ["nether", "nether"], ["end", "the_end"]]) {
    if (!active[key]) continue;
    try {
      const dimension = world.getDimension(dimId);
      if (dimension) ensureOneBlock(dimension);
    } catch (e) {}
  }
}
