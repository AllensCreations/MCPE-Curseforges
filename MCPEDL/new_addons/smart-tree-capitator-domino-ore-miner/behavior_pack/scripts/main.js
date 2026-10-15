/**
 * Smart Tree Capitator & Domino Ore Miner
 * Created by AllensCreations — MCPE Curseforges
 *
 * Single-file self-contained Script API implementation.
 * Target: Minecraft Bedrock 1.21+ / Script API @minecraft/server 1.13.0+
 */

import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  TREE_CAPITATOR_ENABLED: true,
  DOMINO_ORE_MINER_ENABLED: true,
  MAX_TREE_BLOCKS: 128,
  MAX_TREE_HEIGHT: 320,
  TREE_HORIZONTAL_RANGE: 2,
  TREE_DOWNWARD_RANGE: 0,
  MATCH_TREE_SPECIES: true,
  MAX_ORE_CLUSTER_SIZE: 64,
  INSTANT_BURST: true,
  BLOCKS_PER_TICK: 6,
  DURABILITY_SAFETY_THRESHOLD: 5,
  ALERT_SOUND: "note.bass",
  ALERT_PITCH: 0.7,
  ALERT_VOLUME: 1.0,
  NETHER_GOLD_POLICY: "nether_gold",
};

// ─── Tool & Block Identifiers ─────────────────────────────────────────────────

const AXE_IDENTIFIERS = new Set([
  "minecraft:wooden_axe",
  "minecraft:stone_axe",
  "minecraft:iron_axe",
  "minecraft:golden_axe",
  "minecraft:diamond_axe",
  "minecraft:netherite_axe",
]);

const PICKAXE_TIERS = {
  "minecraft:wooden_axe": 1,
  "minecraft:golden_axe": 1,
  "minecraft:wooden_pickaxe": 1,
  "minecraft:golden_pickaxe": 1,
  "minecraft:stone_pickaxe": 2,
  "minecraft:iron_pickaxe": 3,
  "minecraft:diamond_pickaxe": 4,
  "minecraft:netherite_pickaxe": 5,
};

function isAxe(typeId) {
  if (!typeId) return false;
  return AXE_IDENTIFIERS.has(typeId) || typeId.endsWith("_axe");
}

function isPickaxe(typeId) {
  if (!typeId) return false;
  return Boolean(PICKAXE_TIERS[typeId]) || typeId.endsWith("_pickaxe");
}

function getPickaxeTier(typeId) {
  return PICKAXE_TIERS[typeId] || (typeId?.endsWith("_pickaxe") ? 3 : 0);
}

const ELIGIBLE_LOGS = new Set([
  // Oak
  "minecraft:oak_log", "minecraft:stripped_oak_log", "minecraft:oak_wood", "minecraft:stripped_oak_wood",
  // Spruce
  "minecraft:spruce_log", "minecraft:stripped_spruce_log", "minecraft:spruce_wood", "minecraft:stripped_spruce_wood",
  // Birch
  "minecraft:birch_log", "minecraft:stripped_birch_log", "minecraft:birch_wood", "minecraft:stripped_birch_wood",
  // Jungle
  "minecraft:jungle_log", "minecraft:stripped_jungle_log", "minecraft:jungle_wood", "minecraft:stripped_jungle_wood",
  // Acacia
  "minecraft:acacia_log", "minecraft:stripped_acacia_log", "minecraft:acacia_wood", "minecraft:stripped_acacia_wood",
  // Dark Oak
  "minecraft:dark_oak_log", "minecraft:stripped_dark_oak_log", "minecraft:dark_oak_wood", "minecraft:stripped_dark_oak_wood",
  // Mangrove
  "minecraft:mangrove_log", "minecraft:stripped_mangrove_log", "minecraft:mangrove_wood", "minecraft:stripped_mangrove_wood",
  "minecraft:mangrove_roots", "minecraft:muddy_mangrove_roots",
  // Cherry
  "minecraft:cherry_log", "minecraft:stripped_cherry_log", "minecraft:cherry_wood", "minecraft:stripped_cherry_wood",
  // Pale Oak
  "minecraft:pale_oak_log", "minecraft:stripped_pale_oak_log", "minecraft:pale_oak_wood", "minecraft:stripped_pale_oak_wood",
  // Nether Fungi
  "minecraft:crimson_stem", "minecraft:stripped_crimson_stem", "minecraft:crimson_hyphae", "minecraft:stripped_crimson_hyphae",
  "minecraft:warped_stem", "minecraft:stripped_warped_stem", "minecraft:warped_hyphae", "minecraft:stripped_warped_hyphae",
]);

function isEligibleLog(blockId) {
  if (!blockId) return false;
  if (ELIGIBLE_LOGS.has(blockId)) return true;
  return /(log|wood|stem|hyphae|mangrove_roots)$/i.test(blockId);
}

function getWoodSpecies(typeId) {
  if (!typeId) return null;
  const match = typeId.match(/(dark_oak|pale_oak|oak|spruce|birch|jungle|acacia|mangrove|cherry|crimson|warped)/i);
  return match ? match[1].toLowerCase() : null;
}

function isMatchingLog(blockId, targetSpecies) {
  if (!isEligibleLog(blockId)) return false;
  if (!CONFIG.MATCH_TREE_SPECIES || !targetSpecies) return true;
  const species = getWoodSpecies(blockId);
  return !species || species === targetSpecies;
}

const ORE_DEFINITIONS = {
  // Coal (Tier 1: Wood+)
  "minecraft:coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:deepslate_coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },

  // Iron (Tier 2: Stone+)
  "minecraft:iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:deepslate_iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },

  // Copper (Tier 2: Stone+)
  "minecraft:copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:deepslate_copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },

  // Lapis Lazuli (Tier 2: Stone+)
  "minecraft:lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:deepslate_lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },

  // Gold (Tier 3: Iron+)
  "minecraft:gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:deepslate_gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },

  // Nether Gold (Tier 1: Wood+)
  "minecraft:nether_gold_ore": {
    category: CONFIG.NETHER_GOLD_POLICY,
    minTier: 1,
    dropItem: "minecraft:gold_nugget",
    minDrop: 2,
    maxDrop: 6,
  },

  // Redstone (Tier 3: Iron+)
  "minecraft:redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },

  // Diamond (Tier 3: Iron+)
  "minecraft:diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:deepslate_diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },

  // Emerald (Tier 3: Iron+)
  "minecraft:emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:deepslate_emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },

  // Nether Quartz (Tier 1: Wood+)
  "minecraft:quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:nether_quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },

  // Ancient Debris (Tier 4: Diamond+)
  "minecraft:ancient_debris": { category: "ancient_debris", minTier: 4, dropItem: "minecraft:ancient_debris" },
};

function getOreInfo(blockId) {
  if (!blockId) return null;
  return ORE_DEFINITIONS[blockId] || null;
}

const NEIGHBOR_OFFSETS_26 = [];
for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dy === 0 && dz === 0) continue;
      NEIGHBOR_OFFSETS_26.push({ x: dx, y: dy, z: dz });
    }
  }
}

// ─── Durability & Tool Protection Helpers ─────────────────────────────────────

function getMainhandTool(player) {
  if (!player || !player.isValid()) return undefined;
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return undefined;
  return equippable.getEquipment(EquipmentSlot.Mainhand);
}

function checkToolSafety(player) {
  if (!player || !player.isValid()) {
    return { safe: false, remaining: 0 };
  }

  const tool = getMainhandTool(player);
  if (!tool) {
    return { safe: false, remaining: 0 };
  }

  const durabilityComp = tool.getComponent("minecraft:durability");
  if (!durabilityComp) {
    return { safe: true, tool, remaining: 9999 };
  }

  const remaining = durabilityComp.maxDurability - durabilityComp.damage;
  if (remaining <= CONFIG.DURABILITY_SAFETY_THRESHOLD) {
    return { safe: false, tool, remaining };
  }

  return { safe: true, tool, remaining };
}

function applyToolDurabilityDamage(player) {
  if (!player || !player.isValid()) return false;

  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return false;

  const tool = equippable.getEquipment(EquipmentSlot.Mainhand);
  if (!tool) return false;

  const durabilityComp = tool.getComponent("minecraft:durability");
  if (!durabilityComp) return true;

  let unbreakingLevel = 0;
  try {
    const enchantable = tool.getComponent("minecraft:enchantable");
    if (enchantable) {
      const unbreaking = enchantable.getEnchantment("unbreaking");
      if (unbreaking && typeof unbreaking.level === "number") {
        unbreakingLevel = unbreaking.level;
      }
    }
  } catch (err) {}

  const shouldTakeDamage = unbreakingLevel > 0
    ? (Math.random() < 1.0 / (unbreakingLevel + 1))
    : true;

  if (shouldTakeDamage) {
    durabilityComp.damage += 1;

    if (durabilityComp.damage >= durabilityComp.maxDurability) {
      equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
      try {
        player.playSound("random.break", { volume: 1.0, pitch: 0.9 });
      } catch (e) {}
      return false;
    }

    equippable.setEquipment(EquipmentSlot.Mainhand, tool);
  }

  return true;
}

function notifyToolProtection(player, remainingDurability) {
  if (!player || !player.isValid()) return;

  try {
    player.playSound(CONFIG.ALERT_SOUND, {
      volume: CONFIG.ALERT_VOLUME,
      pitch: CONFIG.ALERT_PITCH,
    });
  } catch (e) {}

  try {
    player.onScreenDisplay.setActionBar(
      `§e[Tool Protection] §cStopped mining to save tool! §6(${remainingDurability} durability left)`
    );
  } catch (e) {}
}

function calculateFortuneDropCount(fortuneLevel, minBase = 1, maxBase = 1) {
  const baseCount = minBase === maxBase
    ? minBase
    : Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;

  if (fortuneLevel <= 0) return baseCount;
  const multiplier = Math.max(1, Math.floor(Math.random() * (fortuneLevel + 2)));
  return Math.min(baseCount * multiplier, 64);
}

// ─── Tree Capitator Execution ─────────────────────────────────────────────────

function executeTreeCapitator(player, dimension, startLoc, startBlockId, onComplete) {
  if (typeof startBlockId === "function") {
    onComplete = startBlockId;
    startBlockId = null;
  }
  if (!CONFIG.TREE_CAPITATOR_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const targetSpecies = startBlockId ? getWoodSpecies(startBlockId) : null;
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const blocksToBreak = [];
  let currentFootprints = [{ x: startLoc.x, z: startLoc.z }];

  // Layer 0: Target block 24 sides (~-2 ~ ~-2 to ~2 ~ ~2, excluding center)
  for (let dx = -CONFIG.TREE_HORIZONTAL_RANGE; dx <= CONFIG.TREE_HORIZONTAL_RANGE; dx++) {
    for (let dz = -CONFIG.TREE_HORIZONTAL_RANGE; dz <= CONFIG.TREE_HORIZONTAL_RANGE; dz++) {
      if (dx === 0 && dz === 0) continue;
      const nx = startLoc.x + dx;
      const nz = startLoc.z + dz;
      const key = `${nx},${startLoc.y},${nz}`;
      if (visited.has(key)) continue;
      visited.add(key);

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: startLoc.y, z: nz });
        if (neighborBlock && isMatchingLog(neighborBlock.typeId, targetSpecies)) {
          blocksToBreak.push({ x: nx, y: startLoc.y, z: nz });
          currentFootprints.push({ x: nx, z: nz });
          if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
        }
      } catch (e) {}
    }
    if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
  }

  // Upper Layers: Expanded footprint upward (~2 to ~-2 range)
  for (let dy = 1; dy <= CONFIG.MAX_TREE_HEIGHT; dy++) {
    if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
    if (currentFootprints.length === 0) break;

    const nextFootprints = [];
    const layerY = startLoc.y + dy;

    const uniqueCenters = [];
    const centerKeys = new Set();
    for (const fp of currentFootprints) {
      const ck = `${fp.x},${fp.z}`;
      if (!centerKeys.has(ck)) {
        centerKeys.add(ck);
        uniqueCenters.push(fp);
      }
    }

    let foundInLayer = false;

    for (const center of uniqueCenters) {
      if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;

      for (let dx = -CONFIG.TREE_HORIZONTAL_RANGE; dx <= CONFIG.TREE_HORIZONTAL_RANGE; dx++) {
        for (let dz = -CONFIG.TREE_HORIZONTAL_RANGE; dz <= CONFIG.TREE_HORIZONTAL_RANGE; dz++) {
          const bx = center.x + dx;
          const bz = center.z + dz;
          const key = `${bx},${layerY},${bz}`;

          if (visited.has(key)) continue;
          visited.add(key);

          try {
            const block = dimension.getBlock({ x: bx, y: layerY, z: bz });
            if (block && isMatchingLog(block.typeId, targetSpecies)) {
              blocksToBreak.push({ x: bx, y: layerY, z: bz });
              nextFootprints.push({ x: bx, z: bz });
              foundInLayer = true;
              if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
            }
          } catch (e) {}
        }
        if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
      }
    }

    if (!foundInLayer) break;
    currentFootprints = nextFootprints;
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  // Break felled logs
  for (const pos of blocksToBreak) {
    if (!player || !player.isValid()) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    try {
      dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air destroy`);
      applyToolDurabilityDamage(player);
    } catch (err) {}
  }

  if (onComplete) onComplete();
}

// ─── Domino Ore Miner Execution ───────────────────────────────────────────────

function executeDominoOreMiner(player, dimension, startLoc, startBlockId, onComplete) {
  if (!CONFIG.DOMINO_ORE_MINER_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const startOreInfo = getOreInfo(startBlockId);
  if (!startOreInfo) {
    if (onComplete) onComplete();
    return;
  }

  const initialTool = getMainhandTool(player);
  const toolTier = getPickaxeTier(initialTool?.typeId);
  if (toolTier < startOreInfo.minTier) {
    if (onComplete) onComplete();
    return;
  }

  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

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

      if (ny < -64 || ny > 320) continue;

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: ny, z: nz });
        if (!neighborBlock) continue;

        const neighborOreInfo = getOreInfo(neighborBlock.typeId);
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

  for (const target of cluster) {
    if (!player || !player.isValid()) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    const currentTool = safety.tool;
    const currentTier = getPickaxeTier(currentTool?.typeId);
    if (currentTier < target.oreInfo.minTier) break;

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
    } catch (err) {}
  }

  if (onComplete) onComplete();
}

// ─── Event Dispatcher ─────────────────────────────────────────────────────────

const activeOperations = new Set();

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, player, dimension, itemStackBeforeBreak } = event;

  if (!player || !player.isValid()) return;
  if (!player.isSneaking) return;
  if (activeOperations.has(player.id)) return;

  const startLoc = {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z),
  };
  const brokenTypeId = brokenBlockPermutation?.type?.id;
  if (!brokenTypeId) return;

  const tool = getMainhandTool(player) || itemStackBeforeBreak;
  if (!tool) return;

  const toolTypeId = tool.typeId;

  // Tree Capitator
  if (isAxe(toolTypeId) && isEligibleLog(brokenTypeId)) {
    activeOperations.add(player.id);
    try {
      executeTreeCapitator(player, dimension, startLoc, brokenTypeId, () => {
        activeOperations.delete(player.id);
      });
    } catch (err) {
      activeOperations.delete(player.id);
    }
    return;
  }

  // Domino Ore Miner
  if (isPickaxe(toolTypeId) && getOreInfo(brokenTypeId)) {
    activeOperations.add(player.id);
    try {
      executeDominoOreMiner(player, dimension, startLoc, brokenTypeId, () => {
        activeOperations.delete(player.id);
      });
    } catch (err) {
      activeOperations.delete(player.id);
    }
    return;
  }
});
