import { world } from "@minecraft/server";

const CAPACITY = 256;
const MAX_DISTANCE = 16;
const NEIGHBORS = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

const SPONGES = new Map([
  [
    "allenscreations:op_sponge",
    {
      filled: "allenscreations:op_sponge_wet",
      liquids: new Set(["minecraft:water", "minecraft:flowing_water"]),
    },
  ],
]);

function keyOf(x, y, z) {
  return `${x},${y},${z}`;
}

function readBlock(dimension, location) {
  try {
    return dimension.getBlock(location);
  } catch (error) {
    return undefined;
  }
}

function findLiquid(origin, dimension, liquids) {
  const seen = new Set([keyOf(origin.x, origin.y, origin.z)]);
  const found = [];
  let frontier = [{ x: origin.x, y: origin.y, z: origin.z }];
  for (let distance = 1; distance <= MAX_DISTANCE && frontier.length > 0 && found.length < CAPACITY; distance++) {
    const next = [];
    for (const cell of frontier) {
      for (const step of NEIGHBORS) {
        if (found.length >= CAPACITY) {
          break;
        }
        const location = { x: cell.x + step.x, y: cell.y + step.y, z: cell.z + step.z };
        const key = keyOf(location.x, location.y, location.z);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const block = readBlock(dimension, location);
        if (block && liquids.has(block.typeId)) {
          found.push(location);
          next.push(location);
        }
      }
    }
    frontier = next;
  }
  return found;
}

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const block = event.block;
  const sponge = SPONGES.get(block.typeId);
  if (!sponge) {
    return;
  }
  const dimension = block.dimension;
  const found = findLiquid(block.location, dimension, sponge.liquids);
  if (found.length === 0) {
    return;
  }
  for (const location of found) {
    const target = readBlock(dimension, location);
    if (target) {
      target.setType("minecraft:air");
    }
  }
  block.setType(sponge.filled);
});
