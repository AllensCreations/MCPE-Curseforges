import { world } from "@minecraft/server";

export const PROPERTY_PREFIX = "lock:";
export const HOPPER_ID = "minecraft:hopper";

const EXACT_NAMES = new Set([
  "chest",
  "trapped_chest",
  "barrel",
  "furnace",
  "lit_furnace",
  "blast_furnace",
  "lit_blast_furnace",
  "smoker",
  "lit_smoker",
  "hopper",
  "brewing_stand",
  "dispenser",
  "dropper",
  "chiseled_bookshelf",
  "crafter",
  "decorated_pot",
]);
const NAME_SUFFIXES = ["_door", "trapdoor", "fence_gate", "shulker_box", "chest"];
const DIMENSION_CODES = {
  "minecraft:overworld": "o",
  "minecraft:nether": "n",
  "minecraft:the_end": "e",
};
const CODE_DIMENSIONS = {
  o: "minecraft:overworld",
  n: "minecraft:nether",
  e: "minecraft:the_end",
};

export const SIDES = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

export function isLockable(block) {
  const id = block.typeId;
  if (!id.startsWith("minecraft:")) return false;
  const name = id.slice(10);
  return EXACT_NAMES.has(name) || NAME_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

export function isDoor(block) {
  return block.typeId.endsWith("_door");
}

export function isOpenable(block) {
  const id = block.typeId;
  return id.endsWith("_door") || id.endsWith("trapdoor") || id.includes("fence_gate");
}

export function isContainer(block) {
  return isLockable(block) && !isOpenable(block);
}

function isPairable(block) {
  const id = block.typeId;
  return id.endsWith("chest") && !id.endsWith("ender_chest");
}

export function isUpperDoorHalf(block) {
  return isDoor(block) && block.permutation.getState("upper_block_bit") === true;
}

export function lockPosition(block) {
  const { x, y, z } = block.location;
  return { x, y: isUpperDoorHalf(block) ? y - 1 : y, z };
}

export function propertyKeyFor(code, x, y, z) {
  return `${PROPERTY_PREFIX}${code}:${x},${y},${z}`;
}

export function propertyKey(dimension, x, y, z) {
  return propertyKeyFor(DIMENSION_CODES[dimension.id] ?? dimension.id, x, y, z);
}

export function parseKey(key) {
  if (!key.startsWith(PROPERTY_PREFIX)) return undefined;
  const rest = key.slice(PROPERTY_PREFIX.length);
  const cut = rest.lastIndexOf(":");
  if (cut < 1) return undefined;
  const [x, y, z] = rest.slice(cut + 1).split(",").map(Number);
  if (![x, y, z].every(Number.isInteger)) return undefined;
  return { code: rest.slice(0, cut), x, y, z };
}

export function dimensionFromCode(code) {
  try {
    return world.getDimension(CODE_DIMENSIONS[code] ?? code);
  } catch (error) {
    return undefined;
  }
}

const locks = new Map();
const chunkCounts = new Map();
let indexReady = false;

function chunkKey(code, x, z) {
  return `${code}:${x >> 4},${z >> 4}`;
}

function track(key, password) {
  const parsed = parseKey(key);
  if (!parsed) return;
  if (!locks.has(key)) {
    const chunk = chunkKey(parsed.code, parsed.x, parsed.z);
    chunkCounts.set(chunk, (chunkCounts.get(chunk) ?? 0) + 1);
  }
  locks.set(key, { ...parsed, password });
}

function untrack(key) {
  const entry = locks.get(key);
  if (!entry) return;
  locks.delete(key);
  const chunk = chunkKey(entry.code, entry.x, entry.z);
  const left = (chunkCounts.get(chunk) ?? 1) - 1;
  if (left > 0) chunkCounts.set(chunk, left);
  else chunkCounts.delete(chunk);
}

function ensureIndex() {
  if (indexReady) return;
  for (const key of world.getDynamicPropertyIds()) {
    if (!key.startsWith(PROPERTY_PREFIX)) continue;
    const password = world.getDynamicProperty(key);
    if (typeof password === "string") track(key, password);
  }
  indexReady = true;
}

export function lockCount() {
  ensureIndex();
  return locks.size;
}

export function lockPassword(key) {
  ensureIndex();
  return locks.get(key)?.password;
}

export function setLock(key, password) {
  ensureIndex();
  world.setDynamicProperty(key, password);
  track(key, password);
}

export function clearLock(key) {
  ensureIndex();
  world.setDynamicProperty(key, undefined);
  untrack(key);
}

export function listLocks() {
  ensureIndex();
  return [...locks.entries()].map(([key, entry]) => ({ key, ...entry }));
}

export function locksNear(dimension, minX, maxX, minZ, maxZ) {
  ensureIndex();
  if (locks.size === 0) return false;
  const code = DIMENSION_CODES[dimension.id] ?? dimension.id;
  for (let cx = minX >> 4; cx <= maxX >> 4; cx++) {
    for (let cz = minZ >> 4; cz <= maxZ >> 4; cz++) {
      if (chunkCounts.has(`${code}:${cx},${cz}`)) return true;
    }
  }
  return false;
}

export function chestParts(block) {
  const parts = [block];
  if (!isPairable(block)) return parts;
  for (const side of SIDES) {
    const neighbor = block.dimension.getBlock({
      x: block.location.x + side.x,
      y: block.location.y,
      z: block.location.z + side.z,
    });
    if (neighbor && neighbor.typeId === block.typeId) parts.push(neighbor);
  }
  return parts;
}

export function lockParts(block) {
  if (!isDoor(block)) return chestParts(block);
  const lower = lockPosition(block);
  return [block.dimension.getBlock(lower), block.dimension.getBlock({ x: lower.x, y: lower.y + 1, z: lower.z })].filter(Boolean);
}

export function findLock(block) {
  const here = block.location;
  if (!locksNear(block.dimension, here.x - 1, here.x + 1, here.z - 1, here.z + 1)) return null;
  const origin = lockPosition(block);
  const ownKey = propertyKey(block.dimension, origin.x, origin.y, origin.z);
  const own = lockPassword(ownKey);
  if (own !== undefined) return { key: ownKey, password: own };
  if (!isPairable(block)) return null;
  for (const part of chestParts(block)) {
    if (part === block) continue;
    const key = propertyKey(block.dimension, part.location.x, part.location.y, part.location.z);
    const value = lockPassword(key);
    if (value !== undefined) return { key, password: value };
  }
  return null;
}

export function hasHopperBelow(block) {
  return chestParts(block).some((part) => part.below()?.typeId === HOPPER_ID);
}

export function hasSolidFloor(block) {
  return chestParts(block).every((part) => {
    const below = part.below();
    return !!below && !below.isAir && !below.isLiquid && below.typeId !== HOPPER_ID && !below.typeId.endsWith("rail");
  });
}

export function isLockedFloor(block) {
  const here = block.location;
  if (!locksNear(block.dimension, here.x - 1, here.x + 1, here.z - 1, here.z + 1)) return false;
  const above = block.above();
  if (!above || !isLockable(above)) return false;
  if (!isContainer(above) && !isDoor(above)) return false;
  return findLock(above) !== null;
}
