import { EntityComponentTypes } from "@minecraft/server";

export function getContainer(player) {
  const inventory = player.getComponent(EntityComponentTypes.Inventory);
  return inventory ? inventory.container : undefined;
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
  return true;
}

export function giveOrDrop(player, item) {
  const container = getContainer(player);
  let leftover = item;
  if (container) {
    leftover = container.addItem(item);
  }
  if (leftover) {
    player.dimension.spawnItem(leftover, player.location);
  }
}
