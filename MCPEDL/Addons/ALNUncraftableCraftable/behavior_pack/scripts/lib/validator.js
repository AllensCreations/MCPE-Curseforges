import { ItemStack } from "@minecraft/server";

export function getContainer(player) {
  const inventory = player.getComponent("minecraft:inventory");
  if (!inventory || !inventory.container) {
    return undefined;
  }
  return inventory.container;
}

function countItem(container, type) {
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item && item.typeId === type) {
      total += item.amount;
    }
  }
  return total;
}

export function evaluate(player, recipe) {
  const container = getContainer(player);
  const lines = recipe.inputs.map((input) => ({
    name: input.name,
    need: input.count,
    have: container ? countItem(container, input.type) : 0,
  }));
  return { ok: !!container && lines.every((line) => line.have >= line.need), lines };
}

function removeItems(container, type, count) {
  let left = count;
  for (let slot = 0; slot < container.size && left > 0; slot++) {
    const item = container.getItem(slot);
    if (!item || item.typeId !== type) {
      continue;
    }
    const take = Math.min(left, item.amount);
    left -= take;
    if (take >= item.amount) {
      container.setItem(slot, undefined);
    } else {
      const reduced = item.clone();
      reduced.amount = item.amount - take;
      container.setItem(slot, reduced);
    }
  }
  return left === 0;
}

export function craft(player, recipe) {
  const container = getContainer(player);
  if (!container) {
    return { ok: false, reason: "Inventory unavailable." };
  }
  const check = evaluate(player, recipe);
  if (!check.ok) {
    return { ok: false, reason: "You are missing ingredients." };
  }
  const snapshot = [];
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    snapshot.push(item ? item.clone() : undefined);
  }
  let consumed = true;
  for (const input of recipe.inputs) {
    if (!removeItems(container, input.type, input.count)) {
      consumed = false;
      break;
    }
  }
  let leftover = undefined;
  if (consumed) {
    leftover = container.addItem(new ItemStack(recipe.output.type, recipe.output.count));
  }
  if (!consumed || leftover) {
    for (let slot = 0; slot < snapshot.length; slot++) {
      container.setItem(slot, snapshot[slot]);
    }
    return { ok: false, reason: consumed ? "Not enough inventory space." : "Crafting failed. Nothing was consumed." };
  }
  return { ok: true, reason: "" };
}
