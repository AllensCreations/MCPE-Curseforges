import { world, system } from "@minecraft/server";
import { HOPPER_ID, WATCH_INTERVAL, WATCH_RADIUS, WATCH_TICKS } from "./constants.js";
import { distribute } from "./distribute.js";
import { blockKey, hasLinks, linkedHopperKeys, parseKey } from "./registry.js";

const ignored = new Set();

function nearLinkedHopper(entity) {
  if (!hasLinks()) return false;
  const loc = entity.location;
  const dimensionId = entity.dimension.id;
  for (const key of linkedHopperKeys()) {
    const info = parseKey(key);
    if (!info || info.dimensionId !== dimensionId) continue;
    if (
      Math.abs(info.x + 0.5 - loc.x) <= WATCH_RADIUS &&
      Math.abs(info.y + 1 - loc.y) <= WATCH_RADIUS + 2 &&
      Math.abs(info.z + 0.5 - loc.z) <= WATCH_RADIUS
    ) {
      return true;
    }
  }
  return false;
}

function hopperBelow(entity) {
  const l = entity.location;
  const block = entity.dimension.getBlock({
    x: Math.floor(l.x),
    y: Math.floor(l.y - 0.1),
    z: Math.floor(l.z),
  });
  return block && block.typeId === HOPPER_ID ? block : undefined;
}

function isValid(entity) {
  const flag = entity.isValid;
  return typeof flag === "function" ? entity.isValid() : Boolean(flag);
}

function catchItem(entity) {
  const block = hopperBelow(entity);
  if (!block) return;
  const stack = entity.getComponent("minecraft:item")?.itemStack;
  if (!stack) return;
  const result = distribute(blockKey(block), stack);
  if (result.accepted === 0) return;
  const loc = entity.location;
  const dimension = entity.dimension;
  entity.remove();
  if (result.remaining > 0) {
    const rest = stack.clone();
    rest.amount = result.remaining;
    const spawned = dimension.spawnItem(rest, loc);
    ignored.add(spawned.id);
  }
}

function watch(entity) {
  let ticks = 0;
  const handle = system.runInterval(() => {
    ticks += WATCH_INTERVAL;
    try {
      if (!isValid(entity) || ticks > WATCH_TICKS) {
        system.clearRun(handle);
        return;
      }
      if (!entity.isOnGround) return;
      catchItem(entity);
      system.clearRun(handle);
    } catch {
      system.clearRun(handle);
    }
  }, WATCH_INTERVAL);
}

export function initItemCatcher() {
  world.afterEvents.entitySpawn.subscribe((event) => {
    try {
      const entity = event.entity;
      if (entity.typeId !== "minecraft:item") return;
      if (ignored.has(entity.id)) {
        ignored.delete(entity.id);
        return;
      }
      if (!nearLinkedHopper(entity)) return;
      watch(entity);
    } catch {
      return;
    }
  });
}
