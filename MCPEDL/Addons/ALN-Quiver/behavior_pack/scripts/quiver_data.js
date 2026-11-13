import { ItemStack } from "@minecraft/server";

export const QUIVER_IDS = ["aln:quiver", "aln:quiver_half", "aln:quiver_full"];
export const CAPACITY = 256;
export const ARROW_ID = "minecraft:arrow";
const DATA_KEY = "aln_data";

export function isQuiver(item) {
  return !!item && QUIVER_IDS.includes(item.typeId);
}

export function tierFor(count) {
  if (count <= 0) return QUIVER_IDS[0];
  if (count < 128) return QUIVER_IDS[1];
  return QUIVER_IDS[2];
}

export function readCount(item) {
  try {
    const raw = item.getDynamicProperty(DATA_KEY);
    if (typeof raw !== "string") return 0;
    const n = Math.floor(Number(JSON.parse(raw)?.items?.[ARROW_ID]));
    return Number.isFinite(n) ? Math.max(0, Math.min(CAPACITY, n)) : 0;
  } catch {
    return 0;
  }
}

export function buildQuiver(count, source) {
  const n = Math.max(0, Math.min(CAPACITY, count));
  const stack = new ItemStack(tierFor(n), 1);
  stack.setDynamicProperty(DATA_KEY, JSON.stringify({ v: 1, items: { [ARROW_ID]: n } }));
  stack.setLore([`§7Capacity: §e${n} / ${CAPACITY}`]);
  if (source && source.nameTag) stack.nameTag = source.nameTag;
  return stack;
}

export function isPlainArrow(item) {
  if (!item || item.typeId !== ARROW_ID) return false;
  try {
    if (item.getComponent("minecraft:potion")) return false;
  } catch {}
  const key = String(item.localizationKey || "").toLowerCase();
  return !(key.includes("tipped") || key.includes("effect"));
}

export function findQuiverSlot(container) {
  for (let i = 0; i < container.size; i++) {
    if (isQuiver(container.getItem(i))) return i;
  }
  return -1;
}

export function setQuiverCount(container, slot, count) {
  const old = container.getItem(slot);
  if (!isQuiver(old)) return false;
  container.setItem(slot, buildQuiver(count, old));
  return true;
}

export function countPlainArrows(container) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    if (isPlainArrow(it)) total += it.amount;
  }
  return total;
}
