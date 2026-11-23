import { world, system, ItemStack, EntityComponentTypes } from "@minecraft/server";
import { LEDGER_ID, PROP } from "./config.js";
import { containerOf } from "./util.js";
import { slotOf } from "./slots.js";

const CATCH_RADIUS = 4;
const CHECK_TICKS = 20;

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

export function ensureLedger(player) {
  if (slotOf(player) === undefined) return;
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
    stack = entity.getComponent(EntityComponentTypes.Item)?.itemStack;
  } catch (e) {
    if (attempt === 0) system.run(() => catchDrop(entity, 1));
    return;
  }
  if (!stack || stack.typeId !== LEDGER_ID) return;
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

export function startLedgerKeeper() {
  world.afterEvents.entitySpawn.subscribe((event) => {
    catchDrop(event.entity, 0);
  });
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      try {
        settleLedger(player);
      } catch (e) {}
    }
  }, CHECK_TICKS);
}
