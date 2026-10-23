// trade.js - coin transfers and a player trade board with item escrow.
import { world, ItemStack } from "@minecraft/server";
import { spendCoins, giveCoins, getPrice, removeItems } from "./economy.js";

export const TRANSFER_AMOUNTS = [10, 50, 100, 500, 1000];
export const PRICE_STEPS = [1, 1.5, 2, 3];   // listing price as a multiple of market value
const MAX_LISTINGS = 24;

const read = (key, fb) => {
  const raw = world.getDynamicProperty(key);
  if (typeof raw !== "string") return fb;
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : fb; } catch { return fb; }
};
const write = (key, v) => world.setDynamicProperty(key, JSON.stringify(v));
export const listBoard = () => { const b = read("sv_board", []); return Array.isArray(b) ? b : []; };

export function transferCoins(from, to, amount) {
  if (from.id === to.id || !TRANSFER_AMOUNTS.includes(amount) || !spendCoins(from, amount)) return false;
  giveCoins(to, amount);
  return true;
}

/** Credits coins to a seller who may be offline; applied the next time they spawn. */
function credit(sellerId, amount) {
  const p = world.getAllPlayers().find((q) => q.id === sellerId);
  if (p) { giveCoins(p, amount); p.sendMessage(`§6[Trade] §fYour listing sold: +${amount} coins.`); return; }
  const pend = read("sv_pending", {});
  pend[sellerId] = (pend[sellerId] ?? 0) + amount;
  write("sv_pending", pend);
}
export function applyPending(player) {
  const pend = read("sv_pending", {});
  const a = pend[player.id];
  if (typeof a === "number" && a > 0) {
    giveCoins(player, a);
    delete pend[player.id];
    write("sv_pending", pend);
    player.sendMessage(`§6[Trade] §fWhile you were away your listings earned ${a} coins.`);
  }
}

function give(player, id, qty) {
  const left = player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(id, qty));
  if (left) player.dimension.spawnItem(left, player.location);
}

export function postListing(player, id, qty, step) {
  const board = listBoard();
  if (board.length >= MAX_LISTINGS) return { ok: false, msg: "The board is full." };
  if (!PRICE_STEPS.includes(step) || !removeItems(player, id, qty)) return { ok: false, msg: "You do not have those items." };
  const price = Math.max(1, Math.round(getPrice(id) * qty * step));
  board.push({ k: `${Date.now()}${Math.floor(Math.random() * 1000)}`, id, q: qty, p: price, s: player.id, sn: player.name });
  write("sv_board", board);
  return { ok: true, msg: `Listed ${qty} for ${price} coins.` };
}
export function buyListing(player, key) {
  const board = listBoard();
  const i = board.findIndex((l) => l.k === key);
  if (i < 0) return { ok: false, msg: "That listing is gone." };
  const l = board[i];
  if (l.s === player.id) return { ok: false, msg: "That is your own listing." };
  if (!spendCoins(player, l.p)) return { ok: false, msg: "Not enough coins." };
  board.splice(i, 1);
  write("sv_board", board);
  credit(l.s, l.p);
  give(player, l.id, l.q);
  return { ok: true, msg: `Bought ${l.q} for ${l.p} coins.` };
}
export function cancelListing(player, key) {
  const board = listBoard();
  const i = board.findIndex((l) => l.k === key && l.s === player.id);
  if (i < 0) return { ok: false, msg: "Listing not found." };
  const [l] = board.splice(i, 1);
  write("sv_board", board);
  give(player, l.id, l.q);
  return { ok: true, msg: "Listing cancelled, items returned." };
}
