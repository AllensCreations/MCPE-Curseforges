import { system } from "@minecraft/server";
import { isDoor, isUpperDoorHalf } from "./lockdata.js";

function partsAt(dimension, location) {
  const block = dimension.getBlock(location);
  if (!block) return [];
  if (!isDoor(block)) return [block];
  const lowerY = isUpperDoorHalf(block) ? location.y - 1 : location.y;
  return [
    dimension.getBlock({ x: location.x, y: lowerY, z: location.z }),
    dimension.getBlock({ x: location.x, y: lowerY + 1, z: location.z }),
  ].filter(Boolean);
}

function readOpen(block) {
  const value = block.permutation.getState("open_bit");
  return typeof value === "boolean" ? value : undefined;
}

function writeOpen(block, value) {
  try {
    block.setPermutation(block.permutation.withState("open_bit", value));
  } catch (error) {
    return;
  }
}

export function openState(block) {
  return readOpen(block);
}

export function holdShut(dimension, location, wasOpen) {
  const parts = partsAt(dimension, location);
  for (const part of parts) {
    const current = readOpen(part);
    if (current === undefined) continue;
    writeOpen(part, !current);
    writeOpen(part, current);
  }
  if (wasOpen !== false) return;
  for (const delay of [2, 5]) {
    system.runTimeout(() => {
      for (const part of partsAt(dimension, location)) {
        if (readOpen(part) === true) writeOpen(part, false);
      }
    }, delay);
  }
}
