import { BlockPermutation } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { getContainer, isGameMode } from "./utils.js";

const SAPLING_SPECIES = new Set([
  "oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "cherry", "pale_oak",
]);
const LEGACY_SAPLING_SPECIES = new Set(["oak", "spruce", "birch", "jungle", "acacia", "dark_oak"]);

const SOIL_BLOCKS = new Set([
  "minecraft:dirt", "minecraft:grass_block", "minecraft:podzol", "minecraft:coarse_dirt",
  "minecraft:dirt_with_roots", "minecraft:moss_block", "minecraft:mud", "minecraft:mycelium",
]);

function saplingItemId(species) {
  return `minecraft:${species}_sapling`;
}

function resolveSaplingPermutation(species) {
  try {
    return BlockPermutation.resolve(saplingItemId(species));
  } catch (e) {}
  if (LEGACY_SAPLING_SPECIES.has(species)) {
    try {
      return BlockPermutation.resolve("minecraft:sapling", { sapling_type: species });
    } catch (e) {}
  }
  return null;
}

function findSaplingSlot(player, itemId) {
  const container = getContainer(player);
  if (!container) return null;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId === itemId) return { container, slot: i, item };
  }
  return null;
}

function consumeSapling(found) {
  const { container, slot, item } = found;
  if (item.amount > 1) {
    item.amount -= 1;
    container.setItem(slot, item);
  } else {
    container.setItem(slot, undefined);
  }
}

export function replantSaplings(player, dimension, startLoc, removed, species) {
  if (!CONFIG.REPLANT_SAPLINGS || !SAPLING_SPECIES.has(species)) return;
  const permutation = resolveSaplingPermutation(species);
  if (!permutation) return;

  const free = isGameMode(player, "creative") || !CONFIG.REPLANT_REQUIRES_SAPLING;
  const itemId = saplingItemId(species);
  const spots = [startLoc, ...removed.filter((p) => p.y === startLoc.y)];
  const seen = new Set();
  let planted = 0;

  for (const pos of spots) {
    if (planted >= CONFIG.MAX_REPLANT_SPOTS) break;
    const key = `${pos.x},${pos.z}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      const block = dimension.getBlock(pos);
      const below = dimension.getBlock({ x: pos.x, y: pos.y - 1, z: pos.z });
      if (!block || !below || !block.isAir || !SOIL_BLOCKS.has(below.typeId)) continue;
      let found = null;
      if (!free) {
        found = findSaplingSlot(player, itemId);
        if (!found) break;
      }
      block.setPermutation(permutation);
      planted++;
      if (found) consumeSapling(found);
    } catch (e) {}
  }
}
