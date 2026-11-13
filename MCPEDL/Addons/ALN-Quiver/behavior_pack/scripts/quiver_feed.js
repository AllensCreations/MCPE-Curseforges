import { world, system, ItemStack, GameMode } from "@minecraft/server";
import { ARROW_ID, findQuiverSlot, readCount, setQuiverCount, countPlainArrows, isPlainArrow, CAPACITY } from "./quiver_data.js";

const state = new Map();

function removeOnePlainArrow(c) {
  for (let i = 0; i < c.size; i++) {
    const it = c.getItem(i);
    if (!isPlainArrow(it)) continue;
    if (it.amount <= 1) c.setItem(i, undefined);
    else {
      it.amount -= 1;
      c.setItem(i, it);
    }
    return true;
  }
  return false;
}

function giveBack(c, id) {
  const entry = state.get(id);
  state.delete(id);
  if (!entry || countPlainArrows(c) < entry.expected) return;
  const slot = findQuiverSlot(c);
  if (slot < 0) return;
  const count = readCount(c.getItem(slot));
  if (count >= CAPACITY || !removeOnePlainArrow(c)) return;
  setQuiverCount(c, slot, count + 1);
}

function step(player) {
  const c = player.getComponent("inventory")?.container;
  if (!c) return;
  const held = c.getItem(player.selectedSlotIndex);
  const armed = !!held && (held.typeId === "minecraft:bow" || held.typeId === "minecraft:crossbow");
  if (!armed) {
    if (state.has(player.id)) giveBack(c, player.id);
    return;
  }
  if (player.getGameMode() === GameMode.Creative) return;
  const slot = findQuiverSlot(c);
  if (slot < 0) {
    state.delete(player.id);
    return;
  }
  const have = countPlainArrows(c);
  const entry = state.get(player.id);
  if (entry && have >= entry.expected) return;
  state.delete(player.id);
  if (have > 0) return;
  const count = readCount(c.getItem(slot));
  if (count <= 0) return;
  if (c.addItem(new ItemStack(ARROW_ID, 1))) return;
  setQuiverCount(c, slot, count - 1);
  state.set(player.id, { expected: have + 1 });
}

export function registerFeed() {
  system.runInterval(() => {
    for (const player of world.getPlayers()) {
      try {
        step(player);
      } catch {}
    }
  }, 4);
  world.afterEvents.playerLeave.subscribe((ev) => state.delete(ev.playerId));
}
