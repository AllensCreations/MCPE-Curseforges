// Direct block removal and grouped item drops.
import { ItemStack, BlockPermutation } from "@minecraft/server";
import { CONFIG } from "./config.js";

export function removeBlockAt(dimension, pos) {
  const block = dimension.getBlock({ x: pos.x, y: pos.y, z: pos.z });
  if (!block) return undefined;
  const typeId = block.typeId;
  let waterlogged = false;
  try {
    waterlogged = block.isWaterlogged === true;
  } catch (e) {}
  block.setPermutation(BlockPermutation.resolve("minecraft:air"));
  if (waterlogged) {
    try {
      block.setWaterlogged(true);
    } catch (e) {}
  }
  return typeId;
}

export function addGroupedDrop(drops, pos, typeId, count) {
  const size = CONFIG.DROP_GROUP_SIZE;
  const key = `${Math.floor(pos.x / size)},${Math.floor(pos.y / size)},${Math.floor(pos.z / size)}|${typeId}`;
  const entry = drops.get(key);
  if (entry) {
    entry.count += count;
  } else {
    drops.set(key, { typeId, count, x: pos.x, y: pos.y, z: pos.z });
  }
}

export function spawnGroupedDrops(dimension, drops) {
  for (const entry of drops.values()) {
    let maxStack = 64;
    try {
      maxStack = new ItemStack(entry.typeId, 1).maxAmount || 64;
    } catch (e) {}
    let remaining = entry.count;
    while (remaining > 0) {
      const amount = Math.min(remaining, maxStack);
      try {
        dimension.spawnItem(new ItemStack(entry.typeId, amount), {
          x: entry.x + 0.5,
          y: entry.y + 0.5,
          z: entry.z + 0.5,
        });
      } catch (e) {}
      remaining -= amount;
    }
  }
}
