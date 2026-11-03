import { world, system, ItemStack } from "@minecraft/server";
import { getCarriers, burst, say } from "./carrier.js";
import {
  SCAN_RADIUS,
  getLedger,
  getSlots,
  pruneSlots,
  bufferAdd,
  canAccept,
  isPlain,
  destinationKey,
} from "./memory.js";

const SORT_INTERVAL = 5;
const FULL_SWEEP_CYCLES = 8;
const FLY_STEP = 8;
const PICKUP_RANGE = 3;
const DELIVER_RANGE = 3;
const MAX_CANDIDATES = 96;
const RETRY_TICKS = 400;
const STUCK_LIMIT = 24;
const ITEM_ID = "minecraft:item";
const OWNER_PROP = "cc:owner";

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
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

function pickTarget(state, ledger) {
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
    if (!stack || !(stack.typeId in ledger) || !isPlain(stack) || !canAccept(allay, stack.typeId)) continue;
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

function nextDestination(state, ledger) {
  const now = system.currentTick;
  const dimensionId = state.allay.dimension.id;
  for (const slot of getSlots(state.allay)) {
    const entry = ledger[slot[0]];
    if (!entry || entry.d !== dimensionId) continue;
    if ((state.blocked.get(destinationKey(entry)) ?? 0) > now) continue;
    return entry;
  }
  return undefined;
}

function notifyOwner(state, moved) {
  const ownerId = state.allay.getDynamicProperty(OWNER_PROP);
  const owner = world.getAllPlayers().find((player) => player.id === ownerId);
  if (owner) say(owner, `§6[ COPPER-CARRIER ] §bSorted ${moved} items into storage.`);
}

function deliver(state, ledger) {
  const allay = state.allay;
  const entry = state.dest;
  const key = destinationKey(entry);
  const remaining = flyToward(allay, { x: entry.x + 0.5, y: entry.y + 1.6, z: entry.z + 0.5 });
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
    container = allay.dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z })?.getComponent("minecraft:inventory")?.container;
  } catch {
    container = undefined;
  }
  state.phase = "idle";
  state.dest = null;
  if (!container) {
    state.blocked.set(key, system.currentTick + RETRY_TICKS);
    return;
  }
  let moved = 0;
  let leftover = 0;
  for (const slot of getSlots(allay)) {
    const mapped = ledger[slot[0]];
    if (!mapped || destinationKey(mapped) !== key) continue;
    const refused = container.addItem(new ItemStack(slot[0], slot[1]));
    const left = refused ? refused.amount : 0;
    moved += slot[1] - left;
    slot[1] = left;
    leftover += left;
  }
  pruneSlots(allay);
  if (leftover > 0) state.blocked.set(key, system.currentTick + RETRY_TICKS);
  if (moved > 0) {
    burst(allay.dimension, allay.location, true);
    notifyOwner(state, moved);
  }
}

function tickCarrier(state) {
  const allay = state.allay;
  if (!allay.isValid) return;
  const ledger = getLedger(allay);
  if (Object.keys(ledger).length === 0) {
    state.phase = "idle";
    return;
  }
  if (state.phase === "deliver") {
    deliver(state, ledger);
    return;
  }
  state.cycle++;
  if (state.cycle % FULL_SWEEP_CYCLES === 1) sweep(state);
  const target = pickTarget(state, ledger);
  if (target) {
    state.phase = "collect";
    collect(state, target);
    return;
  }
  const entry = nextDestination(state, ledger);
  if (!entry) {
    state.phase = "idle";
    return;
  }
  state.phase = "deliver";
  state.dest = entry;
  deliver(state, ledger);
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
