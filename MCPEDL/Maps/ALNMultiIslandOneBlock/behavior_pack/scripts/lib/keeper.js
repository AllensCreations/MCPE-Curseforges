import { world, system, ItemStack, EntityComponentTypes } from "@minecraft/server";
import { LEDGER_ID, PROP } from "./config.js";
import { containerOf, findPlayer } from "./util.js";
import { slotOf } from "./slots.js";

const CATCH_RADIUS = 4;
const SWEEP_RADIUS = 10;
const CHECK_TICKS = 5;
const seen = new Map();

function isOwed(player) {
  return player.getDynamicProperty(PROP.LEDGER_OWED) === 1;
}

function setOwed(player, owed) {
  player.setDynamicProperty(PROP.LEDGER_OWED, owed ? 1 : 0);
}

function holdsLedger(player) {
  const inv = containerOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item && item.typeId === LEDGER_ID) return true;
  }
  return false;
}

export function settleLedger(player) {
  if (!isOwed(player)) return;
  if (holdsLedger(player)) {
    setOwed(player, false);
    return;
  }
  const inv = containerOf(player);
  if (!inv) return;
  let rest;
  try {
    rest = inv.addItem(new ItemStack(LEDGER_ID, 1));
  } catch (e) {
    return;
  }
  if (!rest) setOwed(player, false);
}

function ledgerStackOf(entity) {
  if (entity.typeId !== "minecraft:item") return undefined;
  const stack = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
  return stack && stack.typeId === LEDGER_ID ? stack : undefined;
}

function sweepDrops(dim, at) {
  let found = false;
  let list;
  try {
    list = dim.getEntities({ location: at, maxDistance: SWEEP_RADIUS });
  } catch (e) {
    return false;
  }
  for (const entity of list) {
    try {
      if (!ledgerStackOf(entity)) continue;
      entity.remove();
      found = true;
    } catch (e) {}
  }
  return found;
}

export function ensureLedger(id) {
  const player = findPlayer(id);
  if (!player || slotOf(player) === undefined) return;
  const before = seen.get(id);
  if (before) sweepDrops(before.dim, before.at);
  if (!holdsLedger(player)) setOwed(player, true);
  settleLedger(player);
}

function nearestPlayer(entity) {
  const at = entity.location;
  let best;
  let bestDist = CATCH_RADIUS * CATCH_RADIUS;
  for (const p of world.getAllPlayers()) {
    const l = p.location;
    const d = (l.x - at.x) ** 2 + (l.y - at.y) ** 2 + (l.z - at.z) ** 2;
    if (d <= bestDist) {
      best = p;
      bestDist = d;
    }
  }
  return best;
}

function catchDrop(entity, attempt) {
  let stack;
  try {
    if (entity.typeId !== "minecraft:item") return;
    stack = ledgerStackOf(entity);
    if (!stack) {
      if (attempt === 0) system.run(() => catchDrop(entity, 1));
      return;
    }
  } catch (e) {
    if (attempt === 0) system.run(() => catchDrop(entity, 1));
    return;
  }
  const owner = nearestPlayer(entity);
  try {
    entity.remove();
  } catch (e) {}
  if (!owner) return;
  setOwed(owner, true);
  system.run(() => {
    try {
      settleLedger(owner);
    } catch (e) {}
  });
}

function watch() {
  for (const player of world.getAllPlayers()) {
    try {
      if (slotOf(player) === undefined) continue;
      const has = holdsLedger(player);
      const before = seen.get(player.id);
      if (before && before.had && !has) {
        if (sweepDrops(before.dim, before.at)) setOwed(player, true);
      }
      if (has) {
        const l = player.location;
        seen.set(player.id, { had: true, dim: player.dimension, at: { x: l.x, y: l.y, z: l.z } });
      } else if (before) {
        seen.set(player.id, { had: false, dim: before.dim, at: before.at });
      }
      settleLedger(player);
    } catch (e) {}
  }
}

export function startLedgerKeeper() {
  world.afterEvents.entitySpawn.subscribe((event) => {
    catchDrop(event.entity, 0);
  });
  system.runInterval(watch, CHECK_TICKS);
}
