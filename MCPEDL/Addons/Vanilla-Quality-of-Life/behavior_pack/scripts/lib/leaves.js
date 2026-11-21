import { CONFIG } from "./config.js";
import { addGroupedDrop, removeBlockAt, spawnGroupedDrops } from "./blocks.js";
import { isGameMode } from "./utils.js";

const NEIGHBORS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

const LEAF_LOOT = {
  oak: { sapling: 0.05, apple: 0.005 },
  dark_oak: { sapling: 0.05, apple: 0.005 },
  spruce: { sapling: 0.05 },
  birch: { sapling: 0.05 },
  jungle: { sapling: 0.025 },
  acacia: { sapling: 0.05 },
  cherry: { sapling: 0.05 },
  pale_oak: { sapling: 0.05 },
};
const STICK_CHANCE = 0.02;

function isPersistent(block) {
  try {
    return block.permutation.getState("persistent_bit") === true;
  } catch (e) {
    return false;
  }
}

function getBlockSafe(dimension, x, y, z) {
  try {
    return dimension.getBlock({ x, y, z });
  } catch (e) {
    return undefined;
  }
}

function touchesLog(dimension, pos, isTreeLog) {
  for (const [dx, dy, dz] of NEIGHBORS) {
    const b = getBlockSafe(dimension, pos.x + dx, pos.y + dy, pos.z + dz);
    if (b && isTreeLog(b.typeId)) return true;
  }
  return false;
}

function rollLeafDrops(drops, pos, species) {
  const scale = CONFIG.LEAF_DROP_SCALE;
  const loot = LEAF_LOOT[species];
  if (Math.random() < loot.sapling * scale) {
    addGroupedDrop(drops, pos, `minecraft:${species}_sapling`, 1);
  }
  if (loot.apple && Math.random() < loot.apple * scale) {
    addGroupedDrop(drops, pos, "minecraft:apple", 1);
  }
  if (Math.random() < STICK_CHANCE * scale) {
    addGroupedDrop(drops, pos, "minecraft:stick", 1 + Math.floor(Math.random() * 2));
  }
}

export function clearTreeLeaves(player, dimension, logPositions, species, isTreeLog) {
  if (!CONFIG.LEAF_CLEARING_ENABLED || !LEAF_LOOT[species]) return;
  const leafId = `minecraft:${species}_leaves`;

  const found = new Map();
  let frontier = logPositions;
  for (let depth = 1; depth <= CONFIG.LEAF_CLEAR_RANGE && frontier.length > 0; depth++) {
    const next = [];
    for (const cur of frontier) {
      for (const [dx, dy, dz] of NEIGHBORS) {
        const x = cur.x + dx;
        const y = cur.y + dy;
        const z = cur.z + dz;
        const key = `${x},${y},${z}`;
        if (found.has(key)) continue;
        const block = getBlockSafe(dimension, x, y, z);
        if (!block || block.typeId !== leafId || isPersistent(block)) continue;
        const pos = { x, y, z };
        found.set(key, pos);
        next.push(pos);
        if (found.size >= CONFIG.MAX_LEAVES_CLEARED) break;
      }
      if (found.size >= CONFIG.MAX_LEAVES_CLEARED) break;
    }
    if (found.size >= CONFIG.MAX_LEAVES_CLEARED) break;
    frontier = next;
  }
  if (found.size === 0) return;

  const keep = new Set();
  let seeds = [];
  for (const [key, pos] of found) {
    if (touchesLog(dimension, pos, isTreeLog)) {
      keep.add(key);
      seeds.push(pos);
    }
  }
  for (let depth = 1; depth < CONFIG.LEAF_CLEAR_RANGE && seeds.length > 0; depth++) {
    const next = [];
    for (const cur of seeds) {
      for (const [dx, dy, dz] of NEIGHBORS) {
        const key = `${cur.x + dx},${cur.y + dy},${cur.z + dz}`;
        if (!found.has(key) || keep.has(key)) continue;
        keep.add(key);
        next.push(found.get(key));
      }
    }
    seeds = next;
  }

  const creative = isGameMode(player, "creative");
  const drops = new Map();
  for (const [key, pos] of found) {
    if (keep.has(key)) continue;
    try {
      const removed = removeBlockAt(dimension, pos);
      if (removed && !creative) rollLeafDrops(drops, pos, species);
    } catch (e) {}
  }
  spawnGroupedDrops(dimension, drops);
}
