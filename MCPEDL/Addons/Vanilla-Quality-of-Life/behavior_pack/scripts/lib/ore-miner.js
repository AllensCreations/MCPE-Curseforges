import { addGroupedDrop, removeBlockAt, spawnGroupedDrops } from "./blocks.js";
import { CONFIG } from "./config.js";
import { applyToolDurabilityDamage, checkToolSafety, notifyToolProtection } from "./durability.js";
import { getMainhandTool, isGameMode } from "./utils.js";

export const PICKAXE_TIERS = {
  "minecraft:wooden_pickaxe": 1,
  "minecraft:golden_pickaxe": 1,
  "minecraft:stone_pickaxe": 2,
  "minecraft:iron_pickaxe": 3,
  "minecraft:diamond_pickaxe": 4,
  "minecraft:netherite_pickaxe": 5,
};

export function isPickaxe(typeId) {
  if (!typeId) return false;
  return Boolean(PICKAXE_TIERS[typeId]) || typeId.endsWith("_pickaxe");
}

export function getPickaxeTier(typeId) {
  return PICKAXE_TIERS[typeId] || (typeId?.endsWith("_pickaxe") ? 3 : 0);
}

export const ORE_DEFINITIONS = {
  "minecraft:coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:deepslate_coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:deepslate_iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:deepslate_copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:deepslate_lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:deepslate_gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:nether_gold_ore": { category: CONFIG.NETHER_GOLD_POLICY, minTier: 1, dropItem: "minecraft:gold_nugget", minDrop: 2, maxDrop: 6 },
  "minecraft:redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:deepslate_diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:deepslate_emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:nether_quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:ancient_debris": { category: "ancient_debris", minTier: 4, dropItem: "minecraft:ancient_debris" },
};

export function getOreInfo(blockId) {
  if (!blockId) return null;
  return ORE_DEFINITIONS[blockId] || null;
}

export const NEIGHBOR_OFFSETS_26 = (() => {
  const offsets = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        offsets.push({ dx, dy, dz });
      }
    }
  }
  return offsets;
})();

export const FORTUNE_AFFECTED_ORE_CATEGORIES = new Set([
  "coal", "iron", "copper", "gold", "lapis", "nether_gold", "diamond", "emerald", "quartz",
]);

export function calculateRedstoneDropCount(fortuneLevel, minBase = 4, maxBase = 5) {
  const base = Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
  return base + (fortuneLevel > 0 ? Math.floor(Math.random() * (fortuneLevel + 1)) : 0);
}

export const ORE_XP = {
  coal: [0, 2],
  lapis: [2, 5],
  redstone: [1, 5],
  diamond: [3, 7],
  emerald: [3, 7],
  quartz: [2, 5],
  nether_gold: [0, 1],
};

export function rollOreExperience(category) {
  const range = ORE_XP[category];
  if (!range) return 0;
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

export function awardChainExperience(player, dimension, loc, total) {
  if (!loc || total <= 0) return;
  const orbs = Math.min(total, CONFIG.XP_ORB_LIMIT);
  for (let i = 0; i < orbs; i++) {
    try {
      dimension.spawnEntity("minecraft:xp_orb", { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 });
    } catch (e) {}
  }
  const rest = total - orbs;
  if (rest > 0) {
    try {
      player.addExperience(rest);
    } catch (e) {}
  }
}

export function calculateFortuneDropCount(fortuneLevel, minBase = 1, maxBase = 1, fortuneApplies = true) {
  const baseCount = minBase === maxBase
    ? minBase
    : Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
  if (fortuneLevel <= 0 || !fortuneApplies) return baseCount;
  const multiplier = Math.max(1, Math.floor(Math.random() * (fortuneLevel + 2)));
  return Math.min(baseCount * multiplier, 64);
}

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

  const targetCategory = startOreInfo.category;
  const maxClusterSize = targetCategory === "ancient_debris"
    ? (CONFIG.MAX_ANCIENT_DEBRIS_CLUSTER_SIZE || 4)
    : CONFIG.MAX_ORE_CLUSTER_SIZE;
  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const blocksToBreak = [];

  while (queue.length > 0 && blocksToBreak.length < maxClusterSize) {
    const current = queue.shift();

    for (const offset of NEIGHBOR_OFFSETS_26) {
      if (blocksToBreak.length >= maxClusterSize) break;

      const nx = current.x + offset.dx;
      const ny = current.y + offset.dy;
      const nz = current.z + offset.dz;
      const key = `${nx},${ny},${nz}`;

      if (visited.has(key)) continue;
      visited.add(key);

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: ny, z: nz });
        if (!neighborBlock) continue;

        const neighborInfo = getOreInfo(neighborBlock.typeId);
        if (!neighborInfo) continue;

        if (neighborInfo.category === targetCategory) {
          const loc = { x: nx, y: ny, z: nz, typeId: neighborBlock.typeId };
          blocksToBreak.push(loc);
          queue.push(loc);
        }
      } catch (e) {}
    }
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  const tool = getMainhandTool(player);
  const toolTypeId = tool?.typeId;
  if (!isPickaxe(toolTypeId)) {
    if (onComplete) onComplete();
    return;
  }
  const toolTier = getPickaxeTier(toolTypeId);

  let hasSilkTouch = false;
  let fortuneLevel = 0;
  const creative = isGameMode(player, "creative");
  const drops = new Map();
  let xpTotal = 0;
  let xpPos;

  try {
    const enchantable = tool?.getComponent("minecraft:enchantable") || tool?.getComponent("enchantable");
    if (enchantable) {
      for (const ench of enchantable.getEnchantments()) {
        const enchId = (ench.type?.id || ench.id || "").toLowerCase();
        if (enchId.includes("silk_touch")) hasSilkTouch = true;
        if (enchId.includes("fortune")) fortuneLevel = Math.max(fortuneLevel, ench.level);
      }
    }
  } catch (e) {}

  for (const blockData of blocksToBreak) {
    if (!player || !player.isValid) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    const oreInfo = getOreInfo(blockData.typeId);
    if (!oreInfo) continue;

    if (!creative && toolTier < oreInfo.minTier) break;

    try {
      removeBlockAt(dimension, blockData);
      if (creative) continue;
      if (hasSilkTouch) {
        addGroupedDrop(drops, blockData, blockData.typeId, 1);
      } else {
        const dropId = oreInfo.dropItem || blockData.typeId;
        const count = !oreInfo.dropItem
          ? 1
          : oreInfo.category === "redstone"
            ? calculateRedstoneDropCount(fortuneLevel, oreInfo.minDrop || 4, oreInfo.maxDrop || 5)
            : calculateFortuneDropCount(
                fortuneLevel,
                oreInfo.minDrop || 1,
                oreInfo.maxDrop || 1,
                FORTUNE_AFFECTED_ORE_CATEGORIES.has(oreInfo.category)
              );
        addGroupedDrop(drops, blockData, dropId, count);
        const xp = rollOreExperience(oreInfo.category);
        if (xp > 0) {
          xpTotal += xp;
          if (!xpPos) xpPos = blockData;
        }
      }
      applyToolDurabilityDamage(player);
    } catch (err) {}
  }

  spawnGroupedDrops(dimension, drops);
  awardChainExperience(player, dimension, xpPos, xpTotal);

  if (onComplete) onComplete();
}
