import { world, system, ItemStack } from "@minecraft/server";

const CORE = { x: 0, y: 64, z: 0 };
const OVERWORLD = "minecraft:overworld";
const FALLBACK = "minecraft:oak_log";
const SAPLING_CHANCE = 0.3;

const BLOCK_POOL = [
  { id: "minecraft:oak_log", weight: 20 },
  { id: "minecraft:birch_log", weight: 12 },
  { id: "minecraft:spruce_log", weight: 12 },
  { id: "minecraft:cobblestone", weight: 24 },
  { id: "minecraft:stone", weight: 14 },
  { id: "minecraft:coal_ore", weight: 8 },
  { id: "minecraft:iron_ore", weight: 6 },
  { id: "minecraft:gold_ore", weight: 4 },
];

const SAPLINGS = {
  "minecraft:oak_log": "minecraft:oak_sapling",
  "minecraft:birch_log": "minecraft:birch_sapling",
  "minecraft:spruce_log": "minecraft:spruce_sapling",
};

const TOTAL_WEIGHT = BLOCK_POOL.reduce((sum, entry) => sum + entry.weight, 0);

function nextBlockId() {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const entry of BLOCK_POOL) {
    roll -= entry.weight;
    if (roll < 0) return entry.id;
  }
  return FALLBACK;
}

function isCore(location) {
  return location.x === CORE.x && location.y === CORE.y && location.z === CORE.z;
}

function dropSapling(dimension, brokenId) {
  const sapling = SAPLINGS[brokenId];
  if (!sapling || Math.random() >= SAPLING_CHANCE) return;
  try {
    dimension.spawnItem(new ItemStack(sapling, 1), { x: CORE.x + 0.5, y: CORE.y + 1, z: CORE.z + 0.5 });
  } catch (error) {
    console.warn("Sapling drop skipped: " + error);
  }
}

function regenerateCore(dimension) {
  const block = dimension.getBlock(CORE);
  if (!block) return;
  try {
    block.setType(nextBlockId());
  } catch (error) {
    block.setType(FALLBACK);
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  if (!isCore(event.block.location)) return;
  if (event.dimension.id !== OVERWORLD) return;
  const brokenId = event.brokenBlockPermutation.type.id;
  const dimension = event.dimension;
  system.run(() => {
    regenerateCore(dimension);
    dropSapling(dimension, brokenId);
  });
});
