import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
import { LEDGER_ID } from "./config.js";

export function overworld() {
  return world.getDimension("overworld");
}

export function readJson(holder, key, fallback) {
  const raw = holder.getDynamicProperty(key);
  if (typeof raw !== "string") return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

export function writeJson(holder, key, value) {
  holder.setDynamicProperty(key, JSON.stringify(value));
}

export function findPlayer(id) {
  for (const p of world.getAllPlayers()) {
    if (p.id === id) return p;
  }
  return undefined;
}

export function later(fn, ticks) {
  return system.runTimeout(() => {
    try {
      fn();
    } catch (e) {}
  }, ticks);
}

export function wait(ticks) {
  return new Promise((resolve) => system.runTimeout(resolve, ticks));
}

export function niceName(typeId) {
  const raw = String(typeId).replace(/^[a-z0-9_.-]+:/, "");
  return raw
    .split("_")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function normalizeId(text) {
  let t = String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  if (!t) return "";
  if (!t.includes(":")) t = "minecraft:" + t;
  return t;
}

export function isValidItem(typeId) {
  if (typeof typeId !== "string" || typeId === "minecraft:air") return false;
  try {
    const stack = new ItemStack(typeId, 1);
    return stack.typeId === typeId;
  } catch (e) {
    return false;
  }
}

export function stackLimit(typeId) {
  try {
    return new ItemStack(typeId, 1).maxAmount;
  } catch (e) {
    return 64;
  }
}

export function containerOf(player) {
  return player.getComponent(EntityComponentTypes.Inventory)?.container;
}

function quiet(fn, fallback) {
  try {
    return fn();
  } catch (e) {
    return fallback;
  }
}

export function isPlain(item) {
  if (!item) return false;
  if (quiet(() => item.nameTag, undefined)) return false;
  if (quiet(() => item.getLore().length, 0) > 0) return false;
  const enchantable = quiet(() => item.getComponent("minecraft:enchantable"), undefined);
  if (enchantable && quiet(() => enchantable.getEnchantments().length, 0) > 0) return false;
  const durability = quiet(() => item.getComponent("minecraft:durability"), undefined);
  if (durability && quiet(() => durability.damage, 0) > 0) return false;
  return true;
}

export function plainInventory(player) {
  const totals = new Map();
  const inv = containerOf(player);
  if (!inv) return [];
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (!item || item.typeId === LEDGER_ID || !isPlain(item)) continue;
    totals.set(item.typeId, (totals.get(item.typeId) ?? 0) + item.amount);
  }
  return [...totals.entries()]
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => niceName(a.id).localeCompare(niceName(b.id)));
}

export function countPlain(player, typeId) {
  if (typeId === LEDGER_ID) return 0;
  const inv = containerOf(player);
  if (!inv) return 0;
  let total = 0;
  for (let i = 0; i < inv.size; i++) {
    const item = inv.getItem(i);
    if (item && item.typeId === typeId && isPlain(item)) total += item.amount;
  }
  return total;
}

export function removePlain(player, typeId, amount) {
  if (countPlain(player, typeId) < amount) return false;
  const inv = containerOf(player);
  let left = amount;
  for (let i = 0; i < inv.size && left > 0; i++) {
    const item = inv.getItem(i);
    if (!item || item.typeId !== typeId || !isPlain(item)) continue;
    const take = Math.min(left, item.amount);
    if (take === item.amount) {
      inv.setItem(i, undefined);
    } else {
      item.amount -= take;
      inv.setItem(i, item);
    }
    left -= take;
  }
  return left === 0;
}

export function giveItem(player, typeId, amount) {
  const inv = containerOf(player);
  const limit = stackLimit(typeId);
  let left = amount;
  while (left > 0) {
    const n = Math.min(left, limit);
    left -= n;
    const stack = new ItemStack(typeId, n);
    const rest = inv ? inv.addItem(stack) : stack;
    if (rest) player.dimension.spawnItem(rest, player.location);
  }
}

export function pickWeighted(list, weightOf) {
  let total = 0;
  for (const entry of list) total += weightOf(entry);
  if (total <= 0) return list[0];
  let roll = Math.random() * total;
  for (const entry of list) {
    roll -= weightOf(entry);
    if (roll < 0) return entry;
  }
  return list[list.length - 1];
}

export function isLoaded(dim, x, y, z) {
  try {
    return dim.getBlock({ x, y, z }) !== undefined;
  } catch (e) {
    return false;
  }
}

export function blockIdAt(dim, x, y, z) {
  try {
    return dim.getBlock({ x, y, z })?.typeId;
  } catch (e) {
    return undefined;
  }
}

export function runCmd(dim, command) {
  try {
    const result = dim.runCommand(command);
    return Boolean(result) && result.successCount > 0;
  } catch (e) {
    return false;
  }
}

export function addArea(dim, name, x, y, z) {
  return runCmd(dim, `tickingarea add circle ${x} ${y} ${z} 2 ${name} true`);
}

export function dropArea(dim, name) {
  return runCmd(dim, `tickingarea remove ${name}`);
}

export function isCreative(player) {
  try {
    return player.getGameMode() === GameMode.Creative;
  } catch (e) {
    return false;
  }
}
