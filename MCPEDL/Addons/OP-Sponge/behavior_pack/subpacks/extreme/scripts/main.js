import { system, world } from "@minecraft/server";

const WATER = new Set(["minecraft:water", "minecraft:flowing_water"]);
const BASE_CAPACITY = 256;
const BASE_RANGE = 16;
const BATCH = 200;
const BOUND_XZ = 4096;
const BOUND_Y = 512;
const SWEEPS = 3;
const NEIGHBORS = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

const SPONGES = new Map();

function register(name, capacity, range) {
  SPONGES.set(`allenscreations:${name}`, {
    filled: `allenscreations:${name}_wet`,
    capacity,
    range,
  });
}

register("op_sponge", BASE_CAPACITY * 4, BASE_RANGE * 2);

function keyOf(origin, location) {
  const dx = location.x - origin.x + BOUND_XZ;
  const dz = location.z - origin.z + BOUND_XZ;
  const dy = location.y - origin.y + BOUND_Y;
  if (dx < 0 || dz < 0 || dy < 0 || dx >= 2 * BOUND_XZ || dz >= 2 * BOUND_XZ || dy >= 2 * BOUND_Y) {
    return -1;
  }
  return (dx * 2 * BOUND_XZ + dz) * 2 * BOUND_Y + dy;
}

function locationOf(origin, key) {
  const dy = key % (2 * BOUND_Y);
  const rest = Math.floor(key / (2 * BOUND_Y));
  const dz = rest % (2 * BOUND_XZ);
  const dx = Math.floor(rest / (2 * BOUND_XZ));
  return { x: origin.x + dx - BOUND_XZ, y: origin.y + dy - BOUND_Y, z: origin.z + dz - BOUND_XZ };
}

function readBlock(dimension, location) {
  try {
    return dimension.getBlock(location);
  } catch (error) {
    return undefined;
  }
}

function drain(block) {
  try {
    if (WATER.has(block.typeId)) {
      block.setType("minecraft:air");
      return true;
    }
    if (block.isWaterlogged) {
      block.setWaterlogged(false);
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

function* absorb(dimension, origin, spongeId, sponge) {
  const seen = new Set([keyOf(origin, origin)]);
  const drained = [];
  let frontier = [origin];
  let removed = 0;
  let reads = 0;
  for (let distance = 1; distance <= sponge.range && frontier.length > 0 && removed < sponge.capacity; distance++) {
    const next = [];
    for (const cell of frontier) {
      for (const step of NEIGHBORS) {
        if (removed >= sponge.capacity) {
          break;
        }
        const location = { x: cell.x + step.x, y: cell.y + step.y, z: cell.z + step.z };
        const key = keyOf(origin, location);
        if (key < 0 || seen.has(key)) {
          continue;
        }
        seen.add(key);
        reads++;
        if (reads % BATCH === 0) {
          yield;
        }
        const block = readBlock(dimension, location);
        if (block && drain(block)) {
          removed++;
          drained.push(key);
          next.push(location);
        }
      }
    }
    frontier = next;
  }
  if (removed === 0) {
    return;
  }
  for (let pass = 0; pass < SWEEPS; pass++) {
    const total = drained.length;
    let again = 0;
    for (let i = 0; i < total; i++) {
      reads++;
      if (reads % BATCH === 0) {
        yield;
      }
      const block = readBlock(dimension, locationOf(origin, drained[i]));
      if (block && drain(block)) {
        again++;
      }
    }
    if (again === 0) {
      break;
    }
  }
  const after = readBlock(dimension, origin);
  if (!after || after.typeId !== spongeId) {
    return;
  }
  after.setType(sponge.filled);
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
