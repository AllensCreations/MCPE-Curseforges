/**
 * Domino Ore Miner Module
 * Created by AllensCreations — MCPE Curseforges
 *
 * Implements sneak-activated 26-neighbor breadth-first domino ore mining.
 */

import { system, ItemStack } from "@minecraft/server";
import { CONFIG, getOreInfo, getPickaxeTier, PICKAXE_TIERS } from "./config.js";
import { checkToolSafety, applyToolDurabilityDamage, notifyToolProtection, getMainhandTool } from "./durability_helper.js";

/**
 * 26 3D neighbor coordinate offsets
 */
const NEIGHBOR_OFFSETS_26 = [];
for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dy === 0 && dz === 0) continue;
      NEIGHBOR_OFFSETS_26.push({ x: dx, y: dy, z: dz });
    }
  }
}

/**
 * Calculates Fortune drop quantity following vanilla Minecraft drop distribution.
 *
 * @param {number} fortuneLevel
 * @param {number} minBase
 * @param {number} maxBase
 * @returns {number}
 */
function calculateFortuneDropCount(fortuneLevel, minBase = 1, maxBase = 1) {
  const baseCount = minBase === maxBase
    ? minBase
    : Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;

  if (fortuneLevel <= 0) return baseCount;

  // Vanilla fortune multiplier formula: max(1, random roll from 0 to fortuneLevel + 1)
  const multiplier = Math.max(1, Math.floor(Math.random() * (fortuneLevel + 2)));
  return Math.min(baseCount * multiplier, 64);
}

/**
 * Executes domino ore mining on the connected ore vein.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} startLoc
 * @param {string} startBlockId
 * @param {() => void} onComplete
 */
export function executeDominoOreMiner(player, dimension, startLoc, startBlockId, onComplete) {
  if (!CONFIG.DOMINO_ORE_MINER_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const startOreInfo = getOreInfo(startBlockId);
  if (!startOreInfo) {
    if (onComplete) onComplete();
    return;
  }

  // Validate tool tier
  const initialTool = getMainhandTool(player);
  const toolTier = getPickaxeTier(initialTool?.typeId);
  if (toolTier < startOreInfo.minTier) {
    // Tool is too weak to mine this ore
    if (onComplete) onComplete();
    return;
  }

  // Iterative BFS queue
  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];
  const visited = new Set();
  const startKey = `${startLoc.x},${startLoc.y},${startLoc.z}`;
  visited.add(startKey);

  const cluster = [];

  while (queue.length > 0 && cluster.length < CONFIG.MAX_ORE_CLUSTER_SIZE) {
    const current = queue.shift();

    for (const offset of NEIGHBOR_OFFSETS_26) {
      const nx = current.x + offset.x;
      const ny = current.y + offset.y;
      const nz = current.z + offset.z;
      const key = `${nx},${ny},${nz}`;

      if (visited.has(key)) continue;
      visited.add(key);

      // Bound search within valid Minecraft world building limits
      if (ny < -64 || ny > 320) continue;

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: ny, z: nz });
        if (!neighborBlock) continue;

        const neighborOreInfo = getOreInfo(neighborBlock.typeId);
        // Strict category match
        if (neighborOreInfo && neighborOreInfo.category === startOreInfo.category) {
          cluster.push({
            x: nx,
            y: ny,
            z: nz,
            blockId: neighborBlock.typeId,
            oreInfo: neighborOreInfo,
          });
          queue.push({ x: nx, y: ny, z: nz });

          if (cluster.length >= CONFIG.MAX_ORE_CLUSTER_SIZE) break;
        }
      } catch (err) {}
    }
  }

  if (cluster.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  /**
   * Helper to break a single ore block in the cluster.
   * @param {{ x: number, y: number, z: number, blockId: string, oreInfo: any }} target
   * @returns {boolean} True if can continue, false if stopped due to tool safety/tier
   */
  const breakTargetOre = (target) => {
    // Revalidate tool safety before each secondary break
    const safety = checkToolSafety(player, "pickaxe");
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      return false;
    }

    const currentTool = safety.tool;
    const currentTier = getPickaxeTier(currentTool?.typeId);
    if (currentTier < target.oreInfo.minTier) {
      return false;
    }

    // Check tool enchantments (Silk Touch & Fortune)
    let silkTouch = false;
    let fortuneLevel = 0;

    try {
      const enchantable = currentTool.getComponent("minecraft:enchantable");
      if (enchantable) {
        silkTouch = Boolean(enchantable.getEnchantment("silk_touch"));
        const fortune = enchantable.getEnchantment("fortune");
        if (fortune && typeof fortune.level === "number") {
          fortuneLevel = fortune.level;
        }
      }
    } catch (e) {}

    // Break block and drop items at block coordinate
    try {
      const centerPos = { x: target.x + 0.5, y: target.y + 0.5, z: target.z + 0.5 };

      if (silkTouch) {
        dimension.spawnItem(new ItemStack(target.blockId, 1), centerPos);
        dimension.getBlock({ x: target.x, y: target.y, z: target.z })?.setType("minecraft:air");
        try {
          dimension.playSound("dig.stone", centerPos, { volume: 0.8, pitch: 1.0 });
        } catch (pe) {}
      } else if (fortuneLevel > 0 && target.oreInfo.dropItem && target.oreInfo.dropItem !== target.blockId) {
        const minDrop = target.oreInfo.minDrop || 1;
        const maxDrop = target.oreInfo.maxDrop || 1;
        const count = calculateFortuneDropCount(fortuneLevel, minDrop, maxDrop);

        dimension.spawnItem(new ItemStack(target.oreInfo.dropItem, count), centerPos);
        dimension.getBlock({ x: target.x, y: target.y, z: target.z })?.setType("minecraft:air");
        try {
          dimension.playSound("dig.stone", centerPos, { volume: 0.8, pitch: 1.0 });
        } catch (pe) {}
      } else {
        dimension.runCommand(`setblock ${target.x} ${target.y} ${target.z} air destroy`);
      }

      applyToolDurabilityDamage(player);
      return true;
    } catch (err) {
      return true;
    }
  };

  // Instantaneous single-tick burst execution
  if (CONFIG.INSTANT_BURST) {
    for (const target of cluster) {
      if (!player || !player.isValid()) break;
      const ok = breakTargetOre(target);
      if (!ok) break;
    }
    if (onComplete) onComplete();
    return;
  }

  // Paced fallback execution
  let index = 0;
  const intervalId = system.runInterval(() => {
    if (!player || !player.isValid()) {
      system.clearRun(intervalId);
      if (onComplete) onComplete();
      return;
    }

    const batchLimit = Math.min(index + (CONFIG.BLOCKS_PER_TICK || 6), cluster.length);
    while (index < batchLimit) {
      const target = cluster[index++];
      const ok = breakTargetOre(target);
      if (!ok) {
        system.clearRun(intervalId);
        if (onComplete) onComplete();
        return;
      }
    }

    if (index >= cluster.length) {
      system.clearRun(intervalId);
      if (onComplete) onComplete();
    }
  }, 1);
}
