import { world, system } from "@minecraft/server";
import { sortContainer } from "./sort_engine.js";
import { getPrefs, isSettingsBook, openSettings } from "./sort_ui.js";
import { PARTICLES } from "./feedback_profile.js";

const CONTAINER_IDS = new Set(["minecraft:chest", "minecraft:trapped_chest", "minecraft:barrel"]);

const QUICK_STACK_RADIUS = 6;
const lastContainerSort = new Map();

function isSortableContainer(typeId) {
  if (typeId === "minecraft:ender_chest") return false;
  return CONTAINER_IDS.has(typeId) || typeId.endsWith("chest") || typeId.endsWith("shulker_box");
}

function isAutoSortFeather(item) {
  return (
    !!item &&
    item.typeId === "allenscreations:auto_sort_feather"
  );
}

function isRestockFeather(item) {
  return (
    !!item &&
    item.typeId === "allenscreations:restock_feather"
  );
}

function getBackpack(player) {
  return player.getComponent("minecraft:inventory").container;
}

function feedback(player, prefs, message, { sound = "random.orb", pitch = 1.3, block } = {}) {
  player.onScreenDisplay.setActionBar(message);
  if (!prefs.soundFeedback) return;
  try {
    player.playSound(sound, { pitch });
    if (block && PARTICLES) {
      player.playSound("block.barrel.close");
      block.dimension.spawnParticle("minecraft:villager_happy", {
        x: block.location.x + 0.5,
        y: block.location.y + 1.2,
        z: block.location.z + 0.5,
      });
    }
  } catch {
  }
}

function sortBackpack(player) {
  const prefs = getPrefs(player);
  const start = prefs.includeHotbar ? 0 : 9;
  sortContainer(getBackpack(player), start, 35, prefs.sortMode);
  feedback(player, prefs, "§a[OneClickSort] §fBackpack sorted!");
}

function sortBlockContainer(player, block) {
  try {
    const container = block.getComponent("minecraft:inventory")?.container;
    if (!container) return;
    const prefs = getPrefs(player);
    sortContainer(container, 0, container.size - 1, prefs.sortMode);
    feedback(player, prefs, "§a[OneClickSort] §fChest organized!", { block });
  } catch (e) {
    console.warn(`[ALN:OneClickSort] Container sort failed: ${e}`);
  }
}

function contentSignature(container) {
  let s = "";
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    s += it ? `${it.typeId}x${it.amount};` : ";";
  }
  return s;
}

function findNearbyContainers(player) {
  const dim = player.dimension;
  const o = player.location;
  const cx = Math.floor(o.x), cy = Math.floor(o.y), cz = Math.floor(o.z);
  const found = [];

  for (let dx = -QUICK_STACK_RADIUS; dx <= QUICK_STACK_RADIUS; dx++) {
    for (let dy = -QUICK_STACK_RADIUS; dy <= QUICK_STACK_RADIUS; dy++) {
      for (let dz = -QUICK_STACK_RADIUS; dz <= QUICK_STACK_RADIUS; dz++) {
        let block;
        try {
          block = dim.getBlock({ x: cx + dx, y: cy + dy, z: cz + dz });
        } catch {
          continue;
        }
        if (!block || !isSortableContainer(block.typeId)) continue;
        const container = block.getComponent("minecraft:inventory")?.container;
        if (!container) continue;

        if (container.size === 54) {
          const sig = contentSignature(container);
          const dupe = found.some(
            (f) =>
              f.container.size === 54 &&
              f.block.typeId === block.typeId &&
              Math.abs(f.block.x - block.x) + Math.abs(f.block.y - block.y) + Math.abs(f.block.z - block.z) === 1 &&
              f.sig === sig
          );
          if (dupe) continue;
          found.push({ block, container, sig });
        } else {
          found.push({ block, container, sig: null });
        }
      }
    }
  }
  return found;
}

function stockChest(player, block) {
  try {
    const container = block.getComponent("minecraft:inventory")?.container;
    if (!container) return;
    const prefs = getPrefs(player);
    const backpack = getBackpack(player);

    const types = new Set();
    for (let i = 0; i < container.size; i++) {
      const it = container.getItem(i);
      if (it) types.add(it.typeId);
    }

    let movedItems = 0;
    for (let slot = 9; slot <= 35; slot++) {
      let item = backpack.getItem(slot);
      if (!item || isAutoSortFeather(item) || isRestockFeather(item)) continue;
      if (!types.has(item.typeId)) continue;
      const before = item.amount;
      let leftover;
      try {
        leftover = container.addItem(item);
      } catch {
        continue;
      }
      const after = leftover ? leftover.amount : 0;
      if (after < before) movedItems += before - after;
      backpack.setItem(slot, leftover);
    }

    if (movedItems > 0) sortContainer(container, 0, container.size - 1, prefs.sortMode);
    feedback(
      player,
      prefs,
      `§b[Stock] §fStocked §e${movedItems} §fitems into the chest!`,
      { block }
    );
  } catch (e) {
    console.warn(`[ALN:OneClickSort] Chest stock failed: ${e}`);
  }
}

function countStackable(container, item) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    if (it && item.isStackableWith(it)) total += it.amount;
  }
  return total;
}

function pullEverything(backpack, targets, prefs, touched) {
  const templates = [];
  for (let i = 0; i <= 35; i++) {
    const it = backpack.getItem(i);
    if (!it || isAutoSortFeather(it) || isRestockFeather(it) || it.maxAmount <= 1) continue;
    if (!templates.some((tpl) => tpl.isStackableWith(it))) templates.push(it);
  }

  let pulled = 0;
  for (const tpl of templates) {
    let full = false;
    for (let t = 0; t < targets.length && !full; t++) {
      const container = targets[t].container;
      let allowed = prefs.keepOneInChest ? countStackable(container, tpl) - 1 : Infinity;
      for (let s = 0; s < container.size && allowed > 0 && !full; s++) {
        const stored = container.getItem(s);
        if (!stored || !tpl.isStackableWith(stored)) continue;
        const move = Math.min(stored.amount, allowed);
        const piece = stored.clone();
        piece.amount = move;
        let left;
        try {
          left = backpack.addItem(piece);
        } catch {
          full = true;
          continue;
        }
        const added = move - (left ? left.amount : 0);
        if (left) full = true;
        if (added <= 0) continue;
        allowed -= added;
        pulled += added;
        touched.add(t);
        if (stored.amount - added > 0) {
          stored.amount -= added;
          container.setItem(s, stored);
        } else {
          container.setItem(s, undefined);
        }
      }
    }
  }
  return pulled;
}

function restock(player) {
  const prefs = getPrefs(player);
  const backpack = getBackpack(player);
  const targets = findNearbyContainers(player);
  const slots = [];
  for (let i = 0; i <= 35; i++) slots.push(i);

  let pulledItems = 0;
  const touched = new Set();

  for (const slot of slots) {
    const held = backpack.getItem(slot);
    if (!held || isAutoSortFeather(held) || isRestockFeather(held)) continue;
    let need = held.maxAmount - held.amount;
    if (need <= 0) continue;

    for (let t = 0; t < targets.length && need > 0; t++) {
      const container = targets[t].container;
      let allowed = prefs.keepOneInChest ? countStackable(container, held) - 1 : Infinity;
      for (let s = 0; s < container.size && need > 0 && allowed > 0; s++) {
        const stored = container.getItem(s);
        if (!stored || !held.isStackableWith(stored)) continue;
        const move = Math.min(need, stored.amount, allowed);
        allowed -= move;
        held.amount += move;
        need -= move;
        pulledItems += move;
        touched.add(t);
        if (stored.amount - move > 0) {
          stored.amount -= move;
          container.setItem(s, stored);
        } else {
          container.setItem(s, undefined);
        }
      }
    }
    backpack.setItem(slot, held);
  }

  if (prefs.getEverything) pulledItems += pullEverything(backpack, targets, prefs, touched);

  feedback(
    player,
    prefs,
    `§d[Restock] §fPulled §e${pulledItems} §fitems from §a${touched.size} §fnearby chests!`
  );
}

export function registerTriggers() {
  world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;
    if (!player || !item) return;

    if (isSettingsBook(item)) {
      openSettings(player);
      return;
    }
    if (!isAutoSortFeather(item) && !isRestockFeather(item)) return;
    if (player.isSneaking) return;

    const last = lastContainerSort.get(player.id);
    if (last !== undefined && system.currentTick - last < 5) return;

    if (isRestockFeather(item)) restock(player);
    else sortBackpack(player);
  });

  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, itemStack } = event;
    if (event.isFirstEvent === false) return;
    if (!player.isSneaking) return;
    if (!isSortableContainer(block.typeId)) return;
    const sortChest = isAutoSortFeather(itemStack);
    if (!sortChest && !isRestockFeather(itemStack)) return;

    event.cancel = true;
    lastContainerSort.set(player.id, system.currentTick);
    system.run(() => (sortChest ? sortBlockContainer(player, block) : stockChest(player, block)));
  });

  world.afterEvents.playerLeave.subscribe((e) => lastContainerSort.delete(e.playerId));
}
