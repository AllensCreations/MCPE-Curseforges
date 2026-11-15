import { world, system, ItemStack } from "@minecraft/server";
import { getReplacement, isRare } from "./random_loot_table.js";

const PROCESSED_TAG = "aln_randomized";
const ITEM_ENTITY = "minecraft:item";
const PLAYER_ENTITY = "minecraft:player";
const RADIUS = 1.5;
const ZONE_TICKS = 3;
const MAX_STACKS = 64;

let active = false;
let zones = [];
const recentSpawns = new Map();

export function setActive(value) {
  active = value === true;
  if (!active) {
    zones = [];
    recentSpawns.clear();
  }
}

export function isActive() {
  return active;
}

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function announce(player, originalStack, replacementStack) {
  if (!player) return;
  try {
    player.onScreenDisplay.setActionBar({
      rawtext: [
        { text: "§d[CHAOS DROP] §f" },
        { translate: originalStack.localizationKey },
        { text: " §7-> §a" },
        { translate: replacementStack.localizationKey },
        { text: "!" }
      ]
    });
  } catch (e) {}
}

function processItem(entity, player) {
  try {
    if (!entity.isValid) return;
    if (entity.typeId !== ITEM_ENTITY) return;
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
    const sample = new ItemStack(replacementId, 1);
    const maxAmount = Math.max(1, sample.maxAmount);
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
    if (isRare(replacementId)) announce(player, original, sample);
  } catch (e) {}
}

function pruneZones(tick) {
  zones = zones.filter((zone) => tick - zone.tick <= ZONE_TICKS);
}

function pruneSpawns(tick) {
  if (recentSpawns.size < 128) return;
  for (const [id, spawnTick] of recentSpawns) {
    if (tick - spawnTick > ZONE_TICKS) recentSpawns.delete(id);
  }
}

function openZone(dimension, location, player) {
  const tick = system.currentTick;
  pruneZones(tick);
  zones.push({ dimension, location, player, tick });
  let nearby;
  try {
    nearby = dimension.getEntities({
      type: ITEM_ENTITY,
      location,
      maxDistance: RADIUS,
      excludeTags: [PROCESSED_TAG]
    });
  } catch (e) {
    return;
  }
  for (const entity of nearby) {
    const spawnTick = recentSpawns.get(entity.id);
    if (spawnTick !== undefined && tick - spawnTick <= ZONE_TICKS) processItem(entity, player);
  }
}

function onItemSpawned(entity) {
  const tick = system.currentTick;
  recentSpawns.set(entity.id, tick);
  pruneSpawns(tick);
  pruneZones(tick);
  let dimension;
  let location;
  try {
    dimension = entity.dimension;
    location = entity.location;
  } catch (e) {
    return;
  }
  for (const zone of zones) {
    if (zone.dimension.id !== dimension.id) continue;
    if (distanceSquared(zone.location, location) > RADIUS * RADIUS) continue;
    processItem(entity, zone.player);
    return;
  }
}

export function registerDropHooks() {
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (!active) return;
    try {
      if (entity.typeId === ITEM_ENTITY) onItemSpawned(entity);
    } catch (e) {}
  });

  world.afterEvents.playerBreakBlock.subscribe(({ player, block, dimension }) => {
    if (!active) return;
    try {
      const center = { x: block.location.x + 0.5, y: block.location.y + 0.5, z: block.location.z + 0.5 };
      openZone(dimension, center, player);
    } catch (e) {}
  });

  world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
    if (!active) return;
    try {
      if (deadEntity.typeId === PLAYER_ENTITY) return;
      const location = deadEntity.location;
      const dimension = deadEntity.dimension;
      const attacker = damageSource ? damageSource.damagingEntity : undefined;
      const player = attacker && attacker.typeId === PLAYER_ENTITY ? attacker : undefined;
      openZone(dimension, location, player);
    } catch (e) {}
  });
}
