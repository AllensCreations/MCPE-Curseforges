import {
  world,
  system,
  ItemStack,
  EnchantmentType,
  BlockInventoryComponent,
  EntityInventoryComponent,
} from "@minecraft/server";

export const ITEM_ID = "aln:chest_log";
export const LIST_KEY = "aln_chestlog_list";
export const CONTAINER_TYPES = new Set([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel",
]);

const MAX_KNOWN = 150;
const ALERT_COOLDOWN = 600;
const alertTicks = new Map();
const suppressed = new Map();

export function markSuppressed(player) {
  suppressed.set(player.id, system.currentTick);
}

export function isSuppressed(player) {
  const tick = suppressed.get(player.id);
  return tick !== undefined && system.currentTick - tick <= 3;
}

export function dimensionColor(dimensionId) {
  if (dimensionId.includes("nether")) return "§c";
  if (dimensionId.includes("the_end")) return "§d";
  return "§a";
}

export function coloredName(entry) {
  return dimensionColor(entry.dimensionId) + entry.name;
}

export function itemDisplayName(item) {
  if (item.nameTag) return item.nameTag;
  return item.typeId
    .replace(/^[^:]+:/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getInventory(player) {
  const component = player.getComponent(EntityInventoryComponent.componentId);
  return component ? component.container : undefined;
}

export function loadList(player) {
  const raw = player.getDynamicProperty(LIST_KEY);
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveList(player, list) {
  try {
    player.setDynamicProperty(LIST_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function sameLocation(a, b) {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z;
}

export function matchEntry(list, dimensionId, location) {
  return list.findIndex(
    (entry) =>
      entry.dimensionId === dimensionId &&
      (sameLocation(entry.location, location) || sameLocation(entry.partner, location))
  );
}

function resolveContainer(entry) {
  try {
    const dimension = world.getDimension(entry.dimensionId);
    const block = dimension.getBlock(entry.location);
    if (!block) return { state: "unloaded" };
    if (!CONTAINER_TYPES.has(block.typeId)) return { state: "gone" };
    const component = block.getComponent(BlockInventoryComponent.componentId);
    if (!component || !component.container) return { state: "gone" };
    return { state: "loaded", container: component.container, block };
  } catch {
    return { state: "unloaded" };
  }
}

function serializeItem(item) {
  const record = { typeId: item.typeId, amount: item.amount };
  if (item.nameTag) record.nameTag = item.nameTag;
  const lore = item.getLore();
  if (lore.length > 0) record.lore = lore;
  const enchantable = item.getComponent("minecraft:enchantable");
  if (enchantable) {
    const list = enchantable.getEnchantments();
    if (list.length > 0) {
      record.enchantments = list.map((e) => ({ id: e.type.id, level: e.level }));
    }
  }
  return record;
}

function buildStack(record, amount) {
  const item = new ItemStack(record.typeId, amount);
  if (record.nameTag) item.nameTag = record.nameTag;
  if (record.lore && record.lore.length > 0) item.setLore(record.lore);
  if (record.enchantments && record.enchantments.length > 0) {
    const enchantable = item.getComponent("minecraft:enchantable");
    if (enchantable) {
      for (const e of record.enchantments) {
        try {
          enchantable.addEnchantment({ type: new EnchantmentType(e.id), level: e.level });
        } catch {}
      }
    }
  }
  return item;
}

function recordKey(record) {
  return JSON.stringify([
    record.typeId,
    record.nameTag ?? "",
    record.lore ?? [],
    record.enchantments ?? [],
  ]);
}

function enqueue(entry, item) {
  if (!Array.isArray(entry.pendingQueue)) entry.pendingQueue = [];
  const record = serializeItem(item);
  const key = recordKey(record);
  const hit = entry.pendingQueue.find((r) => recordKey(r) === key);
  if (hit) hit.amount += record.amount;
  else entry.pendingQueue.push(record);
}

function rememberType(entry, typeId) {
  if (!Array.isArray(entry.known)) entry.known = [];
  if (entry.known.includes(typeId)) return;
  entry.known.push(typeId);
  if (entry.known.length > MAX_KNOWN) entry.known.shift();
}

function pendingTypes(entry) {
  return (entry.pendingQueue ?? []).map((r) => r.typeId);
}

export function refreshKnown(entry) {
  const resolved = resolveContainer(entry);
  if (resolved.state !== "loaded") return;
  const types = new Set(pendingTypes(entry));
  const container = resolved.container;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) types.add(item.typeId);
  }
  entry.known = Array.from(types).slice(0, MAX_KNOWN);
}

function entryTypeSet(entry) {
  const resolved = resolveContainer(entry);
  if (resolved.state === "loaded") {
    refreshKnown(entry);
    return new Set(entry.known);
  }
  return new Set([...(entry.known ?? []), ...pendingTypes(entry)]);
}

export function sortContainer(container) {
  try {
    const stacks = [];
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (item) stacks.push(item);
    }
    const merged = [];
    for (const item of stacks) {
      let remaining = item.amount;
      for (const target of merged) {
        if (remaining <= 0) break;
        if (target.amount < target.maxAmount && target.isStackableWith(item)) {
          const move = Math.min(target.maxAmount - target.amount, remaining);
          target.amount += move;
          remaining -= move;
        }
      }
      if (remaining > 0) {
        const copy = item.clone();
        copy.amount = remaining;
        merged.push(copy);
      }
    }
    merged.sort((a, b) => a.typeId.localeCompare(b.typeId) || b.amount - a.amount);
    if (merged.length > container.size) return;
    for (let i = 0; i < container.size; i++) {
      container.setItem(i, i < merged.length ? merged[i] : undefined);
    }
  } catch {}
}

function sortEntry(entry) {
  const resolved = resolveContainer(entry);
  if (resolved.state === "loaded") sortContainer(resolved.container);
}

function depositItem(entry, part) {
  const amount = part.amount;
  const resolved = resolveContainer(entry);
  if (resolved.state === "loaded") {
    let rest;
    try {
      rest = resolved.container.addItem(part);
    } catch {
      return { stored: 0, queued: false };
    }
    rememberType(entry, part.typeId);
    return { stored: amount - (rest ? rest.amount : 0), queued: false };
  }
  if (resolved.state === "unloaded") {
    enqueue(entry, part);
    rememberType(entry, part.typeId);
    return { stored: amount, queued: true };
  }
  return { stored: 0, queued: false };
}

export function runDeposit(player, list, plan) {
  const inventory = getInventory(player);
  if (!inventory) return { total: 0, chests: 0 };
  const snapshot = list.map((entry) => JSON.stringify(entry.pendingQueue ?? []));
  const results = [];
  const loadedHits = new Set();
  const queuedHits = new Set();

  for (const step of plan) {
    const held = inventory.getItem(step.slot);
    if (!held || held.typeId !== step.typeId) continue;
    let left = Math.min(step.amount, held.amount);
    let stored = 0;
    let queued = 0;
    for (const index of step.targets) {
      if (left <= 0) break;
      const part = held.clone();
      part.amount = left;
      const out = depositItem(list[index], part);
      if (out.stored > 0) {
        stored += out.stored;
        left -= out.stored;
        if (out.queued) {
          queued += out.stored;
          queuedHits.add(index);
        } else {
          loadedHits.add(index);
        }
      }
    }
    results.push({ slot: step.slot, held, stored, queued });
  }

  const queuedTotal = results.reduce((sum, r) => sum + r.queued, 0);
  let saved = saveList(player, list);
  if (!saved && queuedTotal > 0) {
    list.forEach((entry, i) => {
      entry.pendingQueue = JSON.parse(snapshot[i]);
    });
    for (const r of results) {
      r.stored -= r.queued;
      r.queued = 0;
    }
    queuedHits.clear();
    saveList(player, list);
    player.onScreenDisplay.setActionBar("§c[ChestLog] §fCould not buffer items for unloaded chests.");
  }

  let total = 0;
  for (const r of results) {
    if (r.stored <= 0) continue;
    total += r.stored;
    const remain = r.held.amount - r.stored;
    if (remain <= 0) {
      inventory.setItem(r.slot, undefined);
    } else {
      const keep = r.held.clone();
      keep.amount = remain;
      inventory.setItem(r.slot, keep);
    }
  }

  for (const index of loadedHits) sortEntry(list[index]);
  return { total, chests: new Set([...loadedHits, ...queuedHits]).size };
}

export function depositAll(player) {
  const list = loadList(player);
  if (list.length === 0) {
    player.onScreenDisplay.setActionBar("§e[ChestLog] §fNo chests registered yet.");
    return;
  }
  const inventory = getInventory(player);
  if (!inventory) return;
  const sets = list.map(entryTypeSet);
  const plan = [];
  for (let slot = 0; slot < 36; slot++) {
    const item = inventory.getItem(slot);
    if (!item || item.typeId === ITEM_ID) continue;
    const targets = [];
    sets.forEach((set, index) => {
      if (set.has(item.typeId)) targets.push(index);
    });
    if (targets.length > 0) plan.push({ slot, typeId: item.typeId, amount: item.amount, targets });
  }
  const result = runDeposit(player, list, plan);
  player.onScreenDisplay.setActionBar(
    `§a[ChestLog] §fSorted & deposited §e${result.total} §fitems across §b${result.chests} §fchests!`
  );
}

function alertFull(player, entry) {
  const last = alertTicks.get(entry.id);
  if (last !== undefined && system.currentTick - last < ALERT_COOLDOWN) return;
  alertTicks.set(entry.id, system.currentTick);
  const waiting = entry.pendingQueue.reduce((sum, r) => sum + r.amount, 0);
  player.onScreenDisplay.setActionBar(
    `§c[ChestLog] ${coloredName(entry)} §fis full. §e${waiting} §fitems are waiting.`
  );
}

function flushEntry(player, entry) {
  if (!Array.isArray(entry.pendingQueue) || entry.pendingQueue.length === 0) return false;
  const resolved = resolveContainer(entry);
  if (resolved.state !== "loaded") return false;
  let changed = false;
  let blocked = false;
  const remainingQueue = [];
  for (const record of entry.pendingQueue) {
    let remaining = record.amount;
    if (!blocked) {
      let max;
      try {
        max = new ItemStack(record.typeId, 1).maxAmount;
      } catch {
        remainingQueue.push(record);
        continue;
      }
      while (remaining > 0) {
        const amount = Math.min(remaining, max);
        let rest;
        try {
          rest = resolved.container.addItem(buildStack(record, amount));
        } catch {
          blocked = true;
          break;
        }
        const moved = amount - (rest ? rest.amount : 0);
        remaining -= moved;
        if (moved > 0) changed = true;
        if (rest) {
          blocked = true;
          break;
        }
      }
    }
    if (remaining > 0) remainingQueue.push({ ...record, amount: remaining });
  }
  entry.pendingQueue = remainingQueue;
  if (blocked && remainingQueue.length > 0) alertFull(player, entry);
  return changed;
}

function flushPlayer(player) {
  const list = loadList(player);
  let dirty = false;
  for (const entry of list) {
    if (!entry.pendingQueue || entry.pendingQueue.length === 0) continue;
    const before = JSON.stringify(entry.pendingQueue);
    const changed = flushEntry(player, entry);
    if (changed) {
      refreshKnown(entry);
      sortEntry(entry);
    }
    if (JSON.stringify(entry.pendingQueue) !== before) dirty = true;
  }
  if (dirty) saveList(player, list);
}

function flushAtLocation(player, dimensionId, location) {
  const list = loadList(player);
  const index = matchEntry(list, dimensionId, location);
  if (index < 0) return;
  const entry = list[index];
  const changed = flushEntry(player, entry);
  refreshKnown(entry);
  if (changed) sortEntry(entry);
  saveList(player, list);
}

export function initSync() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      try {
        flushPlayer(player);
      } catch {}
    }
  }, 20);

  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, itemStack, isFirstEvent } = event;
    if (!isFirstEvent || !CONTAINER_TYPES.has(block.typeId)) return;
    if (itemStack && itemStack.typeId === ITEM_ID && player.isSneaking) return;
    const dimensionId = block.dimension.id;
    const location = { x: block.x, y: block.y, z: block.z };
    system.run(() => {
      try {
        flushAtLocation(player, dimensionId, location);
      } catch {}
    });
  });
}
