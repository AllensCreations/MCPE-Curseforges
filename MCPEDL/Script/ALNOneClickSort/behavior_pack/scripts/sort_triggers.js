import { world, system } from "@minecraft/server";
import { sortContainer } from "./sort_engine.js";
import { getPrefs, isSettingsBook, openSettings } from "./sort_ui.js";

const CONTAINER_IDS = new Set(["minecraft:chest", "minecraft:trapped_chest", "minecraft:barrel"]);
const STACK_TARGETS = CONTAINER_IDS;
const QUICK_STACK_RADIUS = 6;
const lastContainerSort = new Map();

function isSortableContainer(typeId) {
  return CONTAINER_IDS.has(typeId) || typeId.endsWith("shulker_box");
}

function isAutoSortFeather(item) {
  return (
    !!item &&
    item.typeId === "minecraft:feather" &&
    typeof item.nameTag === "string" &&
    item.nameTag.trim().toLowerCase() === "auto-sort"
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
    if (block) {
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
        if (!block || !STACK_TARGETS.has(block.typeId)) continue;
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

function quickStack(player) {
  const prefs = getPrefs(player);
  const backpack = getBackpack(player);
  const targets = findNearbyContainers(player);

  const typeSets = targets.map((t) => {
    const set = new Set();
    for (let i = 0; i < t.container.size; i++) {
      const it = t.container.getItem(i);
      if (it) set.add(it.typeId);
    }
    return set;
  });

  let movedItems = 0;
  const touched = new Set();

  for (let slot = 9; slot <= 35; slot++) {
    let item = backpack.getItem(slot);
    if (!item || isAutoSortFeather(item)) continue;

    for (let t = 0; t < targets.length && item; t++) {
      if (!typeSets[t].has(item.typeId)) continue;
      const before = item.amount;
      const leftover = targets[t].container.addItem(item);
      const after = leftover ? leftover.amount : 0;
      if (after < before) {
        movedItems += before - after;
        touched.add(t);
      }
      item = leftover;
    }
    backpack.setItem(slot, item);
  }

  for (const t of touched) {
    const c = targets[t].container;
    sortContainer(c, 0, c.size - 1, prefs.sortMode);
  }

  feedback(
    player,
    prefs,
    `§b[QuickStack] §fStacked §e${movedItems} §fitems into §a${touched.size} §fnearby chests!`
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
    if (!isAutoSortFeather(item)) return;

    const last = lastContainerSort.get(player.id);
    if (last !== undefined && system.currentTick - last < 5) return;

    if (player.isSneaking) quickStack(player);
    else sortBackpack(player);
  });

  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, itemStack } = event;
    if (event.isFirstEvent === false) return;
    if (!player.isSneaking) return;
    if (!isSortableContainer(block.typeId)) return;
    if (itemStack && !isAutoSortFeather(itemStack)) return;

    event.cancel = true;
    lastContainerSort.set(player.id, system.currentTick);
    system.run(() => sortBlockContainer(player, block));
  });

  world.afterEvents.playerLeave.subscribe((e) => lastContainerSort.delete(e.playerId));
}
