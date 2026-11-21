import { ItemStack, system, world } from "@minecraft/server";
import { getPhaseLength, ONEBLOCK_POS } from "./config.js";
import { NETHER_PHASES, END_PHASES, OVERWORLD_PHASES } from "./phases.js";
import { RARITY_TIERS } from "./rarities.js";

export function rollRarityTier() {
  const total = 100.0;
  let rand = Math.random() * total;
  for (let i = 0; i < RARITY_TIERS.length; i++) {
    if (rand < RARITY_TIERS[i].weight) {
      return i;
    }
    rand -= RARITY_TIERS[i].weight;
  }
  return 0;
}

export function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = Math.random() * total;
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

export function getDimKey(dimensionId) {
  if (dimensionId.includes("nether")) return "nether";
  if (dimensionId.includes("the_end") || dimensionId.includes("end")) return "end";
  return "overworld";
}

export function getPhasesForDim(dimKey) {
  switch (dimKey) {
    case "nether": return NETHER_PHASES;
    case "end": return END_PHASES;
    default: return OVERWORLD_PHASES;
  }
}

// Computes progressive phase index and progress from block count
export function getDimensionState(dimKey) {
  const countProp = `ob_${dimKey}_count`;
  const count = world.getDynamicProperty(countProp) ?? 0;
  const phases = getPhasesForDim(dimKey);

  let accumulated = 0;
  let phaseIndex = 0;
  let progressInPhase = 0;
  let currentPhaseLength = getPhaseLength(0);

  for (let i = 0; i < phases.length; i++) {
    const len = getPhaseLength(i);
    if (accumulated + len > count || i === phases.length - 1) {
      phaseIndex = i;
      progressInPhase = Math.max(0, count - accumulated);
      currentPhaseLength = len;
      break;
    }
    accumulated += len;
  }

  return {
    count,
    phaseIndex,
    phase: phases[phaseIndex],
    progressInPhase,
    currentPhaseLength
  };
}

export function getCardinalFromCoords(dx, dz) {
  try {
    const deg = ((Math.atan2(dz, dx) * 180) / Math.PI + 360) % 360;
    const directions = ["East", "South-East", "South", "South-West", "West", "North-West", "North", "North-East"];
    const cardinalIdx = Math.round(deg / 45) % 8;
    return directions[cardinalIdx];
  } catch (e) {
    return "North";
  }
}

// Drops item precisely hovering above OneBlock at (0.5, 65.2, 0.5) with zero velocity
export function hoverDropAboveOneBlock(dimension, itemStack) {
  let itemEntity;
  try {
    itemEntity = dimension.spawnItem(itemStack, { x: 0.5, y: 65.2, z: 0.5 });
  } catch (err) {
    return false;
  }
  try { itemEntity.clearVelocity(); } catch (err) {}
  return true;
}

export function dropAtPlayer(player, itemStack) {
  try {
    player.dimension.spawnItem(itemStack, player.location);
    return true;
  } catch (err) {
    return false;
  }
}

export function buildTradeStacks(itemId, count) {
  const stacks = [];
  try {
    const maxAmount = Math.max(1, new ItemStack(itemId, 1).maxAmount);
    let left = count;
    while (left > 0) {
      const amount = Math.min(left, maxAmount);
      stacks.push(new ItemStack(itemId, amount));
      left -= amount;
    }
  } catch (err) {
    return [];
  }
  return stacks;
}

// Spawns a real Minecraft Chest block ABOVE ONEBLOCK_POS at (0, 65, 0) and populates it with items
export function spawnOneBlockChest(dimension, items = []) {
  try {
    const chestPos = { x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y + 1, z: ONEBLOCK_POS.z };

    // Remove any lingering chest_minecart entities around OneBlock
    try {
      const existing = dimension.getEntities({
        type: "minecraft:chest_minecart",
        location: { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 },
        maxDistance: 2.5
      });
      for (const ent of existing) ent.remove();
    } catch (ee) {}

    const block = dimension.getBlock(chestPos);
    if (block) {
      if (block.typeId !== "minecraft:chest") {
        if (!block.isAir) {
          // Never destroy a player-built block: drop the loot instead
          for (const it of items) {
            try { if (it instanceof ItemStack) dimension.spawnItem(it, { x: chestPos.x + 0.5, y: chestPos.y + 0.2, z: chestPos.z + 0.5 }); } catch (se) {}
          }
          return;
        }
        block.setType("minecraft:chest");
      }

      // Populate chest inventory container on next tick once block entity is instantiated
      system.runTimeout(() => {
        try {
          const cb = dimension.getBlock(chestPos);
          if (cb && cb.typeId === "minecraft:chest") {
            const chestComp = cb.getComponent("minecraft:inventory");
            if (chestComp && chestComp.container) {
              spawnScatteredLootInChest(chestComp.container, items);
            }
          }
        } catch (ie) {}
      }, 1);

      dimension.spawnParticle("minecraft:totem_particle", { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 });
      dimension.playSound("random.chestopen", chestPos, { volume: 1.0, pitch: 1.0 });
    }
  } catch (e) {}
}

// Scatters loot across random single-chest slots (0-26) with realistic splitting, like vanilla structure loot chests
export function spawnScatteredLootInChest(container, chestItems = []) {
  try {
    if (!container || !chestItems || chestItems.length === 0) return;

    // Available slot indices [0..container.size - 1] (single chest: 0..26)
    const availableSlots = [];
    for (let s = 0; s < container.size; s++) {
      availableSlots.push(s);
    }
    // Fisher-Yates shuffle
    for (let i = availableSlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
    }

    // Deconstruct chest items into smaller stacks if count > 4 for authentic structure chest distribution
    const itemsToPlace = [];
    for (const entry of chestItems) {
      if (!entry) continue;
      if (entry instanceof ItemStack) {
        itemsToPlace.push(entry);
        continue;
      }
      let itemId = typeof entry === "string" ? entry : (entry.id || entry.typeId);
      let count = entry.count || entry.amount || 1;
      if (!itemId) continue;

      if (count > 4 && Math.random() < 0.75) {
        const half = Math.floor(count / 2);
        const rem = count - half;
        try { itemsToPlace.push(new ItemStack(itemId, half)); } catch (e) {}
        try { itemsToPlace.push(new ItemStack(itemId, rem)); } catch (e) {}
      } else {
        try {
          itemsToPlace.push(new ItemStack(itemId, count));
        } catch (e) {}
      }
    }

    // Place into randomized slots
    for (const stack of itemsToPlace) {
      if (availableSlots.length === 0) break;
      const slot = availableSlots.pop();
      try {
        if (container.getItem(slot)) container.addItem(stack); else container.setItem(slot, stack);
      } catch (e) {
        try { container.addItem(stack); } catch (e2) {}
      }
    }
  } catch (err) {}
}

// Finds players who broke the block or are near the island (radius 48 blocks) for clean multiplayer notifications
export function getNearbyIslandPlayers(dimension, loc, maxDistance = 48, breakerPlayer = null) {
  const nearby = new Set();
  if (breakerPlayer) nearby.add(breakerPlayer);
  try {
    for (const p of world.getAllPlayers()) {
      if (p.dimension.id === dimension.id) {
        const dx = p.location.x - loc.x;
        const dy = p.location.y - loc.y;
        const dz = p.location.z - loc.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= maxDistance) {
          nearby.add(p);
        }
      }
    }
  } catch (e) {}
  return Array.from(nearby);
}
