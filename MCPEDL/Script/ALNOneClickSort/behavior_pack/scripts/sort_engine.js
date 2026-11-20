
const ORE_EXACT = new Set([
  "diamond", "emerald", "coal", "redstone", "lapis_lazuli",
  "quartz", "amethyst_shard", "netherite_scrap",
]);
const REDSTONE_KEYS = [
  "hopper", "piston", "observer", "repeater", "comparator", "torch", "chest", "barrel",
];

function shortId(typeId) {
  const i = typeId.indexOf(":");
  return i >= 0 ? typeId.slice(i + 1) : typeId;
}

function safeHas(item, componentId) {
  try {
    return item.hasComponent(componentId);
  } catch {
    return false;
  }
}

function categoryOf(item) {
  const id = shortId(item.typeId);
  if (safeHas(item, "minecraft:durability")) return 0;
  if (id.endsWith("ore") || id.endsWith("ingot") || ORE_EXACT.has(id)) return 1;
  if (safeHas(item, "minecraft:food") || id.endsWith("potion")) return 2;
  if (REDSTONE_KEYS.some((k) => id.includes(k))) return 3;
  return 4;
}

function compareId(a, b) {
  return a.typeId < b.typeId ? -1 : a.typeId > b.typeId ? 1 : 0;
}

function makeComparator(sortMode) {
  if (sortMode === 1) {
    return (a, b) => compareId(a, b) || b.amount - a.amount;
  }
  if (sortMode === 2) {
    return (a, b) => b.amount - a.amount || compareId(a, b);
  }
  return (a, b) =>
    categoryOf(a) - categoryOf(b) || compareId(a, b) || b.amount - a.amount;
}

function consolidate(items) {
  const merged = [];
  for (const source of items) {
    const item = source.clone();
    for (const target of merged) {
      if (item.amount <= 0) break;
      if (target.amount >= target.maxAmount) continue;
      if (!target.isStackableWith(item)) continue;
      const move = Math.min(target.maxAmount - target.amount, item.amount);
      target.amount += move;
      item.amount -= move;
    }
    if (item.amount > 0) merged.push(item);
  }
  return merged;
}

export function sortContainer(container, startSlot, endSlot, sortMode = 0) {
  const last = Math.min(endSlot, container.size - 1);
  const first = Math.max(0, startSlot);
  if (last < first) return;

  const items = [];
  for (let slot = first; slot <= last; slot++) {
    const item = container.getItem(slot);
    if (item) items.push(item);
  }

  const sorted = consolidate(items).sort(makeComparator(sortMode));

  for (let slot = first, i = 0; slot <= last; slot++, i++) {
    container.setItem(slot, sorted[i]);
  }
}
