import { ItemStack } from "@minecraft/server";
import { IDS, VALUE, KEYS } from "./config.js";

export const inventoryOf = (player) => player.getComponent("inventory")?.container;

export function getBalance(player) {
  const v = player.getDynamicProperty(KEYS.vault);
  return typeof v === "number" && v > 0 ? Math.floor(v) : 0;
}

export function setBalance(player, value) {
  player.setDynamicProperty(KEYS.vault, Math.max(0, Math.floor(value)));
}

export function breakdown(value) {
  const c = Math.floor(value / 100);
  const rest = value - c * 100;
  const g = Math.floor(rest / 10);
  return { c, g, s: rest - g * 10 };
}

export function describeValue(value) {
  const b = breakdown(value);
  const parts = [];
  if (b.c) parts.push(`§a${b.c} Cursed`);
  if (b.g) parts.push(`§6${b.g} Gold`);
  if (b.s || !parts.length) parts.push(`§f${b.s} Silver`);
  return parts.join("§r§f, ");
}

export function looseCounts(player) {
  const counts = { [IDS.silver]: 0, [IDS.gold]: 0, [IDS.cursed]: 0 };
  const c = inventoryOf(player);
  if (!c) return counts;
  for (let i = 0; i < c.size; i++) {
    const it = c.getItem(i);
    if (it && it.typeId in counts) counts[it.typeId] += it.amount;
  }
  return counts;
}

export const countsValue = (counts) =>
  Object.keys(counts).reduce((sum, k) => sum + VALUE[k] * counts[k], 0);

export function takeLoose(player, typeId, amount) {
  const c = inventoryOf(player);
  if (!c) return 0;
  let left = amount;
  for (let i = 0; i < c.size && left > 0; i++) {
    const it = c.getItem(i);
    if (!it || it.typeId !== typeId) continue;
    if (it.amount <= left) {
      left -= it.amount;
      c.setItem(i, undefined);
    } else {
      it.amount -= left;
      c.setItem(i, it);
      left = 0;
    }
  }
  return amount - left;
}

export function giveStack(player, stack) {
  const c = inventoryOf(player);
  const rest = c ? c.addItem(stack) : stack;
  if (rest) player.dimension.spawnItem(rest, player.location);
}

export function giveAmount(player, typeId, amount, decorate) {
  let left = amount;
  while (left > 0) {
    const n = Math.min(64, left);
    const stack = new ItemStack(typeId, n);
    if (decorate) decorate(stack);
    giveStack(player, stack);
    left -= n;
  }
}

export function depositAll(player) {
  const counts = looseCounts(player);
  let total = 0;
  for (const typeId of Object.keys(counts)) {
    if (!counts[typeId]) continue;
    const taken = takeLoose(player, typeId, counts[typeId]);
    total += taken * VALUE[typeId];
  }
  if (total > 0) setBalance(player, getBalance(player) + total);
  return total;
}

export function withdrawCoin(player, typeId, count) {
  const cost = VALUE[typeId] * count;
  if (getBalance(player) < cost) return false;
  setBalance(player, getBalance(player) - cost);
  giveAmount(player, typeId, count);
  return true;
}

export function withdrawAll(player) {
  const value = getBalance(player);
  if (value <= 0) return 0;
  const b = breakdown(value);
  setBalance(player, 0);
  if (b.c) giveAmount(player, IDS.cursed, b.c);
  if (b.g) giveAmount(player, IDS.gold, b.g);
  if (b.s) giveAmount(player, IDS.silver, b.s);
  return value;
}

export function compressLoose(player) {
  const counts = looseCounts(player);
  let s = counts[IDS.silver];
  let g = counts[IDS.gold] + Math.floor(s / 10);
  s %= 10;
  const c = counts[IDS.cursed] + Math.floor(g / 10);
  g %= 10;
  if (s === counts[IDS.silver] && g === counts[IDS.gold] && c === counts[IDS.cursed]) return false;
  takeLoose(player, IDS.silver, counts[IDS.silver]);
  takeLoose(player, IDS.gold, counts[IDS.gold]);
  takeLoose(player, IDS.cursed, counts[IDS.cursed]);
  if (c) giveAmount(player, IDS.cursed, c);
  if (g) giveAmount(player, IDS.gold, g);
  if (s) giveAmount(player, IDS.silver, s);
  return true;
}
