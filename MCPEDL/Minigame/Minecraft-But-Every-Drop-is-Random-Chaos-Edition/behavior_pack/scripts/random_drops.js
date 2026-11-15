import { world, system, ItemStack } from "@minecraft/server";
import { getReplacement } from "./random_loot_table.js";

const PROCESSED_TAG = "aln_randomized";
const ITEM_ENTITY = "minecraft:item";
const PLAYER_ENTITY = "minecraft:player";
const RADIUS_SQUARED = 1.5 * 1.5;
const ZONE_TICKS = 3;
const MAX_STACKS = 64;

let active = false;
let zones = [];
let pending = [];
const queue = [];
let jobRunning = false;
const maxAmounts = new Map();

export function setActive(value) {
  active = value === true;
  if (!active) {
    zones = [];
    pending = [];
    queue.length = 0;
  }
}

export function isActive() {
  return active;
}

function isNear(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz <= RADIUS_SQUARED;
}

function getMaxAmount(typeId) {
  let amount = maxAmounts.get(typeId);
  if (amount === undefined) {
    amount = Math.max(1, new ItemStack(typeId, 1).maxAmount);
    maxAmounts.set(typeId, amount);
  }
  return amount;
}

function processItem(entity) {
  try {
    if (!entity.isValid) return;
    if (entity.hasTag(PROCESSED_TAG)) return;
    const component = entity.getComponent("minecraft:item");
    if (!component) return;
    const original = component.itemStack;
    const replacementId = getReplacement(original.typeId);
    if (!replacementId || replacementId === original.typeId) {
      entity.addTag(PROCESSED_TAG);
      return;
    }
    const dimension = entity.dimension;
    const location = entity.location;
    const maxAmount = getMaxAmount(replacementId);
    let remaining = original.amount;
    let stacks = 0;
    while (remaining > 0 && stacks < MAX_STACKS) {
      const amount = Math.min(maxAmount, remaining);
      const spawned = dimension.spawnItem(new ItemStack(replacementId, amount), location);
      spawned.addTag(PROCESSED_TAG);
      remaining -= amount;
      stacks += 1;
    }
    entity.remove();
  } catch (e) {}
}

function* drain() {
  try {
    let index = 0;
    while (index < queue.length) {
      processItem(queue[index]);
      index += 1;
      yield;
    }
  } finally {
    queue.length = 0;
    jobRunning = false;
  }
}

function enqueue(entity) {
  queue.push(entity);
  if (jobRunning) return;
  jobRunning = true;
  system.runJob(drain());
}

function prune(tick) {
  if (zones.length > 0) zones = zones.filter((zone) => tick - zone.tick <= ZONE_TICKS);
  if (pending.length > 0) pending = pending.filter((item) => tick - item.tick <= ZONE_TICKS);
}

function openZone(dimensionId, location) {
  const tick = system.currentTick;
  prune(tick);
  zones.push({ dimensionId, location, tick });
  if (pending.length === 0) return;
  const rest = [];
  for (const item of pending) {
    if (item.dimensionId === dimensionId && isNear(item.location, location)) enqueue(item.entity);
    else rest.push(item);
  }
  pending = rest;
}

function onItemSpawned(entity) {
  const tick = system.currentTick;
  prune(tick);
  const dimensionId = entity.dimension.id;
  const location = entity.location;
  for (const zone of zones) {
    if (zone.dimensionId === dimensionId && isNear(zone.location, location)) {
      enqueue(entity);
      return;
    }
  }
  pending.push({ entity, dimensionId, location, tick });
}

export function registerDropHooks() {
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (!active) return;
    try {
      if (entity.typeId === ITEM_ENTITY) onItemSpawned(entity);
    } catch (e) {}
  });

  world.afterEvents.playerBreakBlock.subscribe(({ block, dimension }) => {
    if (!active) return;
    try {
      const center = { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 };
      openZone(dimension.id, center);
    } catch (e) {}
  });

  world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
    if (!active) return;
    try {
      if (deadEntity.typeId === PLAYER_ENTITY) return;
      openZone(deadEntity.dimension.id, deadEntity.location);
    } catch (e) {}
  });
}
