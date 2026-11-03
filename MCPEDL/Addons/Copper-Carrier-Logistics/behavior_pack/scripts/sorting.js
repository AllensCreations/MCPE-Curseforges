import { world, system, ItemStack } from "@minecraft/server";
import { getCarriers, burst, say } from "./carrier.js";
import { SCAN_RADIUS, getSlots, pruneSlots, bufferAdd, canAccept, isPlain } from "./memory.js";

const SORT_INTERVAL = 5;
const FULL_SWEEP_CYCLES = 8;
const FLY_STEP = 8;
const PICKUP_RANGE = 3;
const DELIVER_RANGE = 3;
const MAX_CANDIDATES = 96;
const RETRY_TICKS = 400;
const STUCK_LIMIT = 24;
const SCAN_EVERY = 100;
const AREA_H = 12;
const AREA_V = 8;
const MAX_CONTAINERS = 80;
const CONTAINER_PATTERN = /(chest|barrel)$/;
const ITEM_ID = "minecraft:item";
const OWNER_PROP = "cc:owner";

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function spotKey(spot) {
  return `${spot.x}|${spot.y}|${spot.z}`;
}

function flyToward(allay, goal) {
  try {
    const from = allay.location;
    const total = distance(from, goal);
    if (total <= FLY_STEP) {
      allay.teleport(goal, { facingLocation: goal });
      return 0;
    }
    const ratio = FLY_STEP / total;
    allay.teleport(
      {
        x: from.x + (goal.x - from.x) * ratio,
        y: from.y + (goal.y - from.y) * ratio,
        z: from.z + (goal.z - from.z) * ratio,
      },
      { facingLocation: goal }
    );
    return total - FLY_STEP;
  } catch {
    return Infinity;
  }
}

function typesIn(container) {
  const types = new Set();
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) types.add(item.typeId);
  }
  return types;
}

function readContainer(block) {
  try {
    return block.getComponent("minecraft:inventory")?.container;
  } catch {
    return undefined;
  }
}

function scanArea(state) {
  const home = state.home;
  const found = [];
  let dimension;
  try {
    dimension = world.getDimension(home.d);
  } catch {
    return found;
  }
  for (let dx = -AREA_H; dx <= AREA_H; dx++) {
    for (let dy = -AREA_V; dy <= AREA_V; dy++) {
      for (let dz = -AREA_H; dz <= AREA_H; dz++) {
        if (found.length >= MAX_CONTAINERS) return found;
        let block;
        try {
          block = dimension.getBlock({ x: home.x + dx, y: home.y + dy, z: home.z + dz });
        } catch {
          continue;
        }
        if (!block || !CONTAINER_PATTERN.test(block.typeId) || block.typeId.includes("ender")) continue;
        const container = readContainer(block);
        if (!container) continue;
        found.push({
          x: home.x + dx,
          y: home.y + dy,
          z: home.z + dz,
          types: typesIn(container),
          gap: Math.hypot(dx, dy, dz),
        });
      }
    }
  }
  return found.sort((a, b) => a.gap - b.gap);
}

function sweep(state) {
  const allay = state.allay;
  const found = allay.dimension.getEntities({
    type: ITEM_ID,
    location: allay.location,
    maxDistance: SCAN_RADIUS,
  });
  for (const entity of found) {
    if (state.candidates.size >= MAX_CANDIDATES) break;
    state.candidates.add(entity);
  }
}

function readStack(entity) {
  try {
    return entity.getComponent("minecraft:item")?.itemStack;
  } catch {
    return undefined;
  }
}

function wantedTypes(state) {
  const wanted = new Set();
  for (const spot of state.containers) {
    for (const type of spot.types) wanted.add(type);
  }
  return wanted;
}

function pickTarget(state, wanted) {
  const allay = state.allay;
  const here = allay.location;
  let best;
  let bestDistance = SCAN_RADIUS;
  for (const entity of [...state.candidates]) {
    if (!entity.isValid) {
      state.candidates.delete(entity);
      continue;
    }
    const stack = readStack(entity);
    if (!stack || !wanted.has(stack.typeId) || !isPlain(stack) || !canAccept(allay, stack.typeId)) continue;
    const gap = distance(here, entity.location);
    if (gap <= bestDistance) {
      best = entity;
      bestDistance = gap;
    }
  }
  return best;
}

function collect(state, target) {
  const allay = state.allay;
  const stack = readStack(target);
  if (!stack) return;
  const spot = target.location;
  const remaining = flyToward(allay, { x: spot.x, y: spot.y + 0.4, z: spot.z });
  if (remaining === Infinity) {
    state.stuck++;
    if (state.stuck >= STUCK_LIMIT) state.candidates.delete(target);
    return;
  }
  state.stuck = 0;
  if (remaining > PICKUP_RANGE) return;
  const accepted = bufferAdd(allay, stack.typeId, stack.amount);
  const rest = stack.amount - accepted;
  state.candidates.delete(target);
  target.remove();
  if (rest > 0) allay.dimension.spawnItem(new ItemStack(stack.typeId, rest), spot);
  burst(allay.dimension, allay.location, false);
}

function nextDestination(state) {
  const now = system.currentTick;
  for (const slot of getSlots(state.allay)) {
    for (const spot of state.containers) {
      if (!spot.types.has(slot[0])) continue;
      if ((state.blocked.get(spotKey(spot)) ?? 0) > now) continue;
      return spot;
    }
  }
  return undefined;
}

function notifyOwner(state, moved) {
  const ownerId = state.allay.getDynamicProperty(OWNER_PROP);
  const owner = world.getAllPlayers().find((player) => player.id === ownerId);
  if (owner) say(owner, `§6[ COPPER-CARRIER ] §bSorted ${moved} items into storage.`);
}

function deliver(state) {
  const allay = state.allay;
  const spot = state.dest;
  const key = spotKey(spot);
  const remaining = flyToward(allay, { x: spot.x + 0.5, y: spot.y + 1.6, z: spot.z + 0.5 });
  if (remaining === Infinity) {
    state.stuck++;
    if (state.stuck >= STUCK_LIMIT) {
      state.blocked.set(key, system.currentTick + RETRY_TICKS);
      state.phase = "idle";
      state.stuck = 0;
    }
    return;
  }
  state.stuck = 0;
  if (remaining > DELIVER_RANGE) return;
  let container;
  try {
    container = readContainer(allay.dimension.getBlock({ x: spot.x, y: spot.y, z: spot.z }));
  } catch {
    container = undefined;
  }
  state.phase = "idle";
  state.dest = null;
  if (!container) {
    state.blocked.set(key, system.currentTick + RETRY_TICKS);
    state.nextScan = 0;
    return;
  }
  const live = typesIn(container);
  let moved = 0;
  let leftover = 0;
  for (const slot of getSlots(allay)) {
    if (!live.has(slot[0])) continue;
    const refused = container.addItem(new ItemStack(slot[0], slot[1]));
    const left = refused ? refused.amount : 0;
    moved += slot[1] - left;
    slot[1] = left;
    leftover += left;
  }
  pruneSlots(allay);
  if (leftover > 0 || moved === 0) state.blocked.set(key, system.currentTick + RETRY_TICKS);
  if (moved > 0) {
    burst(allay.dimension, allay.location, true);
    notifyOwner(state, moved);
  }
}

function tickCarrier(state) {
  const allay = state.allay;
  if (!allay.isValid || allay.dimension.id !== state.home.d) return;
  if (state.phase === "deliver") {
    deliver(state);
    return;
  }
  state.cycle++;
  if (state.cycle % FULL_SWEEP_CYCLES === 1) sweep(state);
  const working = state.candidates.size > 0 || getSlots(allay).length > 0;
  if (!working) {
    state.phase = "idle";
    return;
  }
  if (system.currentTick >= state.nextScan) {
    state.containers = scanArea(state);
    state.nextScan = system.currentTick + SCAN_EVERY;
  }
  if (state.containers.length === 0) {
    state.phase = "idle";
    return;
  }
  const target = pickTarget(state, wantedTypes(state));
  if (target) {
    state.phase = "collect";
    collect(state, target);
    return;
  }
  const spot = nextDestination(state);
  if (!spot) {
    state.phase = "idle";
    return;
  }
  state.phase = "deliver";
  state.dest = spot;
  deliver(state);
}

export function initSorting() {
  world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (!entity || entity.typeId !== ITEM_ID) return;
    for (const state of getCarriers()) {
      if (!state.allay.isValid || state.allay.dimension.id !== entity.dimension.id) continue;
      if (state.candidates.size >= MAX_CANDIDATES) continue;
      if (distance(state.allay.location, entity.location) <= SCAN_RADIUS) state.candidates.add(entity);
    }
  });

  system.runInterval(() => {
    for (const state of getCarriers()) {
      try {
        tickCarrier(state);
      } catch {
        continue;
      }
    }
  }, SORT_INTERVAL);
}
