import { world, system, GameMode } from "@minecraft/server";
import {
  SCAN_RADIUS,
  MAX_KEYS,
  MAX_SLOTS,
  registerKey,
  clearLedger,
  ledgerSize,
  slotCount,
  clearBuffer,
  dropBuffer,
} from "./memory.js";

export const CARRIER_TAG = "cc_carrier";
export const UNIT_TAG = "cc_unit";
export const ACTIVATED_MESSAGE = "§6[ COPPER-CARRIER ] §bFlying Sorting Unit Activated! Range: 64 Blocks.";

const ALLAY_ID = "minecraft:allay";
const GOLEM_ID = "minecraft:copper_golem";
const INGOT_ID = "minecraft:copper_ingot";
const SHEARS_ID = "minecraft:shears";
const GOLEM_PROP = "cc:golem";
const OWNER_PROP = "cc:owner";
const DIMENSIONS = ["overworld", "nether", "the_end"];
const ANCHOR_INTERVAL = 2;
const DISCOVER_INTERVAL = 100;
const ANCHOR_OFFSET_Y = 0.55;
const MISS_LIMIT = 20;
const ORPHAN_LIMIT = 6;
const GOLEM_SEARCH_RADIUS = 8;
const USE_COOLDOWN = 6;

const carriers = new Map();
const orphans = new Map();
const lastUse = new Map();

export function getCarriers() {
  return [...carriers.values()];
}

export function say(player, text) {
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch {
    return;
  }
}

function emitParticle(dimension, id, position) {
  try {
    dimension.spawnParticle(id, position);
    return true;
  } catch {
    return false;
  }
}

export function burst(dimension, location, strong) {
  const base = { x: location.x, y: location.y + 0.8, z: location.z };
  const count = strong ? 6 : 2;
  for (let i = 0; i < count; i++) {
    const point = {
      x: base.x + (Math.random() - 0.5) * 1.2,
      y: base.y + Math.random() * 0.8,
      z: base.z + (Math.random() - 0.5) * 1.2,
    };
    if (!emitParticle(dimension, "minecraft:electric_spark_particle", point)) {
      emitParticle(dimension, "minecraft:villager_happy", point);
    }
  }
  try {
    dimension.playSound(strong ? "note.pling" : "random.orb", base, {
      volume: 0.7,
      pitch: strong ? 1.6 : 1.2,
    });
  } catch {
    return;
  }
}

function createState(allay, golem) {
  return {
    id: allay.id,
    allay,
    golem,
    golemId: golem.id,
    lastLoc: allay.location,
    dim: allay.dimension,
    misses: 0,
    phase: "idle",
    dest: null,
    stuck: 0,
    candidates: new Set(),
    blocked: new Map(),
    cycle: 0,
  };
}

function attach(player, allay, golem) {
  allay.addTag(CARRIER_TAG);
  golem.addTag(UNIT_TAG);
  allay.setDynamicProperty(GOLEM_PROP, golem.id);
  allay.setDynamicProperty(OWNER_PROP, player.id);
  const state = createState(allay, golem);
  carriers.set(allay.id, state);
  return state;
}

export function releaseCarrier(state, dropItems) {
  carriers.delete(state.id);
  if (dropItems) dropBuffer(state.id, state.allay, state.dim, state.lastLoc);
  clearBuffer(state.id, state.allay);
  untagGolem(state);
  try {
    if (state.allay.isValid) {
      clearLedger(state.allay);
      state.allay.removeTag(CARRIER_TAG);
      state.allay.setDynamicProperty(GOLEM_PROP, undefined);
      state.allay.setDynamicProperty(OWNER_PROP, undefined);
    }
  } catch {
    return;
  }
}

function untagGolem(state) {
  try {
    if (state.golem.isValid) state.golem.removeTag(UNIT_TAG);
  } catch {
    return;
  }
}

function discover() {
  for (const id of DIMENSIONS) {
    let list;
    try {
      list = world.getDimension(id).getEntities({ tags: [CARRIER_TAG] });
    } catch {
      continue;
    }
    for (const allay of list) {
      const known = carriers.get(allay.id);
      if (known && known.allay.isValid) continue;
      const golemId = allay.getDynamicProperty(GOLEM_PROP);
      const golem = typeof golemId === "string" ? world.getEntity(golemId) : undefined;
      if (golem && golem.isValid) {
        orphans.delete(allay.id);
        if (known) {
          known.allay = allay;
          known.golem = golem;
          known.misses = 0;
        } else {
          carriers.set(allay.id, createState(allay, golem));
        }
        continue;
      }
      const misses = (orphans.get(allay.id) ?? 0) + 1;
      orphans.set(allay.id, misses);
      if (misses >= ORPHAN_LIMIT) {
        orphans.delete(allay.id);
        allay.removeTag(CARRIER_TAG);
        clearLedger(allay);
      }
    }
  }
}

function anchorAll() {
  for (const state of [...carriers.values()]) {
    const allay = state.allay;
    if (!allay.isValid) continue;
    const at = allay.location;
    state.lastLoc = at;
    state.dim = allay.dimension;
    if (!state.golem.isValid) {
      const found = world.getEntity(state.golemId);
      if (found && found.isValid) {
        state.golem = found;
        state.misses = 0;
      } else {
        state.misses++;
        if (state.misses >= MISS_LIMIT) releaseCarrier(state, true);
        continue;
      }
    }
    try {
      state.golem.teleport({ x: at.x, y: at.y + ANCHOR_OFFSET_Y, z: at.z }, { dimension: allay.dimension });
    } catch {
      continue;
    }
  }
}

function isCreative(player) {
  try {
    return player.getGameMode() === GameMode.Creative;
  } catch {
    return false;
  }
}

function consumeHeldIngot(player) {
  try {
    const container = player.getComponent("minecraft:inventory").container;
    const slot = player.selectedSlotIndex;
    const held = container.getItem(slot);
    if (!held || held.typeId !== INGOT_ID) return false;
    if (held.amount > 1) {
      held.amount -= 1;
      container.setItem(slot, held);
    } else {
      container.setItem(slot, undefined);
    }
    return true;
  } catch {
    return false;
  }
}

function findFreeGolem(allay) {
  const nearby = allay.dimension.getEntities({
    type: GOLEM_ID,
    location: allay.location,
    maxDistance: GOLEM_SEARCH_RADIUS,
  });
  return nearby.find((entity) => !entity.hasTag(UNIT_TAG));
}

function spawnGolem(player, allay) {
  if (!isCreative(player) && !consumeHeldIngot(player)) return undefined;
  try {
    return allay.dimension.spawnEntity(GOLEM_ID, allay.location);
  } catch {
    say(player, "§6[ COPPER-CARRIER ] §cA Copper Golem could not be spawned here.");
    return undefined;
  }
}

function handleIngot(player, allay) {
  if (!allay.isValid || !player.isValid) return;
  const existing = carriers.get(allay.id);
  if (existing) {
    say(
      player,
      `§6[ COPPER-CARRIER ] §bBuffer ${slotCount(allay)}/${MAX_SLOTS} slots | Ledger ${ledgerSize(allay)}/${MAX_KEYS} items`
    );
    return;
  }
  const golem = findFreeGolem(allay) ?? spawnGolem(player, allay);
  if (!golem) return;
  attach(player, allay, golem);
  burst(allay.dimension, allay.location, true);
  say(player, ACTIVATED_MESSAGE);
}

function handleShears(player, allay) {
  const state = carriers.get(allay.id);
  if (!state) return;
  releaseCarrier(state, true);
  say(player, "§6[ COPPER-CARRIER ] §bSorting unit released. Buffered items were dropped.");
}

function ownedCarrierNear(player) {
  let best;
  let bestDistance = SCAN_RADIUS;
  for (const state of carriers.values()) {
    if (!state.allay.isValid || state.allay.dimension.id !== player.dimension.id) continue;
    if (state.allay.getDynamicProperty(OWNER_PROP) !== player.id) continue;
    const a = state.allay.location;
    const b = player.location;
    const distance = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    if (distance <= bestDistance) {
      best = state;
      bestDistance = distance;
    }
  }
  return best;
}

function handleRegister(player, block) {
  let container;
  try {
    container = block.getComponent("minecraft:inventory")?.container;
  } catch {
    return;
  }
  if (!container) return;
  const state = ownedCarrierNear(player);
  if (!state) {
    say(player, "§6[ COPPER-CARRIER ] §cNo flying sorting unit of yours is within 64 blocks.");
    return;
  }
  const types = new Set();
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) types.add(item.typeId);
  }
  if (types.size === 0) {
    say(player, "§6[ COPPER-CARRIER ] §cPut sample items in the container first.");
    return;
  }
  const { x, y, z } = block.location;
  let added = 0;
  let full = false;
  for (const typeId of types) {
    const result = registerKey(state.allay, typeId, x, y, z, block.dimension.id);
    if (result === "full") full = true;
    else added++;
  }
  const suffix = full ? " §c(ledger full)" : "";
  say(
    player,
    `§6[ COPPER-CARRIER ] §bRegistered ${added} item types to ${x}, ${y}, ${z}. Ledger ${ledgerSize(state.allay)}/${MAX_KEYS}${suffix}`
  );
  burst(block.dimension, { x: x + 0.5, y, z: z + 0.5 }, false);
}

function handleDeath(deadEntity) {
  let id;
  try {
    id = deadEntity.id;
  } catch {
    return;
  }
  const direct = carriers.get(id);
  if (direct) {
    releaseCarrier(direct, true);
    return;
  }
  for (const state of carriers.values()) {
    if (state.golemId === id) {
      releaseCarrier(state, true);
      return;
    }
  }
}

export function initCarrier() {
  world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target, itemStack } = event;
    if (!itemStack || target.typeId !== ALLAY_ID) return;
    const useIngot = itemStack.typeId === INGOT_ID;
    const useShears = itemStack.typeId === SHEARS_ID && target.hasTag(CARRIER_TAG);
    if (!useIngot && !useShears) return;
    event.cancel = true;
    system.run(() => {
      const now = system.currentTick;
      if (now - (lastUse.get(player.id) ?? -USE_COOLDOWN) < USE_COOLDOWN) return;
      lastUse.set(player.id, now);
      if (useIngot) handleIngot(player, target);
      else handleShears(player, target);
    });
  });

  world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, itemStack, isFirstEvent } = event;
    if (!isFirstEvent || !itemStack || itemStack.typeId !== INGOT_ID || !player.isSneaking) return;
    handleRegister(player, block);
  });

  world.afterEvents.entityDie.subscribe((event) => handleDeath(event.deadEntity));
  world.afterEvents.playerLeave.subscribe((event) => lastUse.delete(event.playerId));

  system.runInterval(anchorAll, ANCHOR_INTERVAL);
  system.runInterval(discover, DISCOVER_INTERVAL);
}
