import { EntityComponentTypes } from "@minecraft/server";
import { createLogger } from "./logger.js";

const log = createLogger("inventory");

export function getContainer(player) {
  const inventory = player.getComponent(EntityComponentTypes.Inventory);
  if (!inventory || !inventory.container) {
    log.error("player has no inventory container");
    return undefined;
  }
  return inventory.container;
}

export function scanInventory(player, predicate) {
  const container = getContainer(player);
  const found = [];
  if (!container) {
    return found;
  }
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item && predicate(item)) {
      found.push({ slot, typeId: item.typeId, amount: item.amount });
    }
  }
  log.step("scan found " + found.length + " matching stacks in " + container.size + " slots");
  return found;
}

export function readSlot(player, slot) {
  const container = getContainer(player);
  return container ? container.getItem(slot) : undefined;
}

export function consume(player, needs) {
  const container = getContainer(player);
  if (!container) {
    return false;
  }
  for (const [slot, need] of needs) {
    const item = container.getItem(slot);
    if (!item || item.typeId !== need.typeId || item.amount < need.count) {
      log.warn("consume check failed for slot " + slot + " expecting " + need.count + " of " + need.typeId + " got " + (item ? item.amount + " of " + item.typeId : "nothing"));
      return false;
    }
  }
  for (const [slot, need] of needs) {
    const item = container.getItem(slot);
    if (item.amount <= need.count) {
      container.setItem(slot, undefined);
    } else {
      item.amount -= need.count;
      container.setItem(slot, item);
    }
  }
  log.step("consumed items from " + needs.size + " slots");
  return true;
}

export function giveOrDrop(player, item) {
  const container = getContainer(player);
  let leftover = item;
  if (container) {
    leftover = container.addItem(item);
  }
  if (leftover) {
    log.warn("inventory full, dropping the result");
    player.dimension.spawnItem(leftover, player.location);
  } else {
    log.step("result item added to inventory");
  }
}
