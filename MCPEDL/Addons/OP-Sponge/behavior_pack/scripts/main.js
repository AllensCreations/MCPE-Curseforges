import { system, world } from "@minecraft/server";

const WATER = new Set(["minecraft:water", "minecraft:flowing_water"]);
const BASE_CAPACITY = 256;
const BASE_RANGE = 16;
const LEVEL_RANGE = 2;
const EXTREME_CAPACITY = 100000;
const EXTREME_RANGE = 2048;
const BATCH = 200;
const SPARKLES = 16;
const NEIGHBORS = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

const SPONGES = new Map();

function register(name, capacity, range, sparkle) {
  SPONGES.set(`allenscreations:${name}`, {
    filled: `allenscreations:${name}_wet`,
    capacity,
    range,
    sparkle,
  });
}

register("op_sponge", BASE_CAPACITY, BASE_RANGE, false);
for (let level = 1; level <= 10; level++) {
  register(`super_sponge_${level}`, BASE_CAPACITY * (level + 1), BASE_RANGE + level * LEVEL_RANGE, true);
}
register("extreme_sponge_1", EXTREME_CAPACITY, EXTREME_RANGE, true);

function keyOf(location) {
  return `${location.x},${location.y},${location.z}`;
}

function readBlock(dimension, location) {
  try {
    return dimension.getBlock(location);
  } catch (error) {
    return undefined;
  }
}

function sparkle(dimension, origin) {
  for (let i = 0; i < SPARKLES; i++) {
    try {
      dimension.spawnParticle("minecraft:villager_happy", {
        x: origin.x + Math.random(),
        y: origin.y + Math.random(),
        z: origin.z + Math.random(),
      });
    } catch (error) {
      return;
    }
  }
}

function* absorb(dimension, origin, spongeId, sponge) {
  const found = [];
  const seen = new Set();
  let frontier = [origin];
  let reads = 0;
  for (let distance = 1; distance <= sponge.range && frontier.length > 0 && found.length < sponge.capacity; distance++) {
    const next = [];
    for (const cell of frontier) {
      for (const step of NEIGHBORS) {
        if (found.length >= sponge.capacity) {
          break;
        }
        const location = { x: cell.x + step.x, y: cell.y + step.y, z: cell.z + step.z };
        const key = keyOf(location);
        if (seen.has(key)) {
          continue;
        }
        const block = readBlock(dimension, location);
        reads++;
        if (reads % BATCH === 0) {
          yield;
        }
        if (block && WATER.has(block.typeId)) {
          seen.add(key);
          found.push(location);
          next.push(location);
        }
      }
    }
    frontier = next;
  }
  if (found.length === 0) {
    return;
  }
  const current = readBlock(dimension, origin);
  if (!current || current.typeId !== spongeId) {
    return;
  }
  let removed = 0;
  for (const location of found) {
    const block = readBlock(dimension, location);
    if (block && WATER.has(block.typeId)) {
      block.setType("minecraft:air");
    }
    removed++;
    if (removed % BATCH === 0) {
      yield;
    }
  }
  const after = readBlock(dimension, origin);
  if (!after || after.typeId !== spongeId) {
    return;
  }
  after.setType(sponge.filled);
  if (sponge.sparkle) {
    sparkle(dimension, origin);
  }
}

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const block = event.block;
  const sponge = SPONGES.get(block.typeId);
  if (!sponge) {
    return;
  }
  const origin = { x: block.location.x, y: block.location.y, z: block.location.z };
  system.runJob(absorb(block.dimension, origin, block.typeId, sponge));
});
