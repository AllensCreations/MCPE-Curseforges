// economy.js - OneBlock regeneration engine, pricing tables, coin wallet, shared vault.
import { world, system } from "@minecraft/server";

export const ORIGIN = { x: 0, y: 64, z: 0 };
export const OBJECTIVE = "sovereign_coins";
// Breaking the core pays this share of the market price (the drops can still be sold in the ledger).
export const BREAK_BOUNTY_RATE = 0.5;

// ---------------------------------------------------------------------------
// Base price table (coins per item). Works for block ids and item ids.
// ---------------------------------------------------------------------------
export const BASE_PRICES = {
  "minecraft:dirt": 0.05, "minecraft:grass_block": 0.05, "minecraft:oak_log": 0.5,
  "minecraft:cobblestone": 0.1, "minecraft:stone": 0.1, "minecraft:sand": 0.1, "minecraft:gravel": 0.1,
  "minecraft:coal": 1, "minecraft:coal_ore": 1,
  "minecraft:raw_copper": 1, "minecraft:copper_ore": 1, "minecraft:copper_ingot": 1.2,
  "minecraft:raw_iron": 5, "minecraft:iron_ore": 5, "minecraft:iron_ingot": 5.5,
  "minecraft:raw_gold": 12, "minecraft:gold_ore": 12, "minecraft:gold_ingot": 13,
  "minecraft:redstone": 0.5, "minecraft:redstone_ore": 2,
  "minecraft:lapis_lazuli": 1, "minecraft:lapis_ore": 4,
  "minecraft:diamond": 50, "minecraft:diamond_ore": 50,
  "minecraft:emerald": 40, "minecraft:emerald_ore": 40,
  "minecraft:wheat": 0.5, "minecraft:carrot": 0.3, "minecraft:potato": 0.3, "minecraft:beetroot": 0.3,
};

// [block id, weight, unlocks after N total core breaks]
const GEN_TABLE = [
  ["minecraft:dirt", 30, 0], ["minecraft:grass_block", 20, 0], ["minecraft:oak_log", 14, 0],
  ["minecraft:cobblestone", 26, 0], ["minecraft:sand", 8, 0], ["minecraft:gravel", 6, 0],
  ["minecraft:stone", 20, 50], ["minecraft:coal_ore", 12, 100], ["minecraft:copper_ore", 8, 150],
  ["minecraft:iron_ore", 8, 250], ["minecraft:redstone_ore", 5, 400], ["minecraft:lapis_ore", 4, 500],
  ["minecraft:gold_ore", 3, 700], ["minecraft:diamond_ore", 1.5, 1000], ["minecraft:emerald_ore", 1, 1500],
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round3 = (v) => Math.round(v * 1000) / 1000;
export const prettyName = (id) => id.replace("minecraft:", "").replace(/_/g, " ");

// ---------------------------------------------------------------------------
// Dynamic market: each item has a multiplier (0.5x-1.5x) + short history.
// Selling pushes it down; it recovers and drifts randomly every minute.
// ---------------------------------------------------------------------------
function loadMarket() {
  const raw = world.getDynamicProperty("sv_market");
  if (typeof raw !== "string") return {};
  try { const o = JSON.parse(raw); return o && typeof o === "object" ? o : {}; } catch { return {}; }
}
function saveMarket(m) { world.setDynamicProperty("sv_market", JSON.stringify(m)); }

export function getPrice(id, market = loadMarket()) {
  const base = BASE_PRICES[id];
  if (base === undefined) return 0;
  return base * (market[id]?.x ?? 1);
}

/** Rows for the trend screen: { id, base, price, x, change } sorted by base price (desc). */
export function getMarketView() {
  const m = loadMarket();
  return Object.keys(BASE_PRICES).map((id) => {
    const e = m[id] ?? { x: 1, h: [1] };
    const h = e.h ?? [1];
    const prev = h.length > 1 ? h[h.length - 2] : e.x;
    return { id, base: BASE_PRICES[id], price: BASE_PRICES[id] * e.x, x: e.x, change: e.x - prev };
  }).sort((a, b) => b.base - a.base);
}

function tickMarket() {
  const m = loadMarket();
  for (const id of Object.keys(BASE_PRICES)) {
    const e = m[id] ?? { x: 1, h: [1] };
    e.x = round3(clamp(e.x + (1 - e.x) * 0.1 + (Math.random() - 0.5) * 0.06, 0.5, 1.5));
    e.h = (e.h ?? []).concat(e.x).slice(-8);
    m[id] = e;
  }
  saveMarket(m);
}

// ---------------------------------------------------------------------------
// Wallet: whole coins live on the scoreboard (sovereign_coins); the fractional
// part (0.05 coin drops etc.) is kept in a per-player dynamic property.
// ---------------------------------------------------------------------------
function objective() {
  const sb = world.scoreboard;
  return sb.getObjective(OBJECTIVE) ?? sb.addObjective(OBJECTIVE, "§6Sovereign Coins");
}
export function getBalance(player) {
  let whole = 0;
  try { whole = objective().getScore(player) ?? 0; } catch { whole = 0; }
  const frac = player.getDynamicProperty("sv_frac");
  return whole + (typeof frac === "number" ? frac : 0);
}
function setBalance(player, total) {
  const whole = Math.floor(total + 1e-9);
  objective().setScore(player, whole);
  player.setDynamicProperty("sv_frac", round3(Math.max(0, total - whole)));
}
export function addCoins(player, amount) {
  if (!(amount > 0)) return;
  setBalance(player, getBalance(player) + amount);
}
export function spendCoins(player, cost) {
  const bal = getBalance(player);
  if (!(cost >= 0) || bal + 1e-9 < cost) return false;
  setBalance(player, bal - cost);
  return true;
}

// Shared vault (pays worker wages for everyone).
export const getVault = () => {
  const v = world.getDynamicProperty("sv_vault");
  return typeof v === "number" ? v : 0;
};
export const addVault = (amt) => world.setDynamicProperty("sv_vault", round3(getVault() + amt));
export function spendVault(amt) {
  if (getVault() + 1e-9 < amt) return false;
  world.setDynamicProperty("sv_vault", round3(Math.max(0, getVault() - amt)));
  return true;
}

// ---------------------------------------------------------------------------
// Inventory selling. Only priced, un-renamed, lore-free stacks are touched.
// ---------------------------------------------------------------------------
function sellable(item) {
  if (!item || BASE_PRICES[item.typeId] === undefined) return false;
  if (item.nameTag) return false;
  try { if (item.getLore().length > 0) return false; } catch { return false; }
  return true;
}

export function previewSale(player) {
  const c = player.getComponent("minecraft:inventory")?.container;
  const out = { total: 0, count: 0, lines: [] };
  if (!c) return out;
  const market = loadMarket();
  const tally = {};
  for (let i = 0; i < c.size; i++) {
    const it = c.getItem(i);
    if (!sellable(it)) continue;
    tally[it.typeId] = (tally[it.typeId] ?? 0) + it.amount;
  }
  for (const [id, amt] of Object.entries(tally)) {
    const value = getPrice(id, market) * amt;
    out.lines.push({ id, amount: amt, value });
    out.total += value; out.count += amt;
  }
  out.lines.sort((a, b) => b.value - a.value);
  return out;
}

export function sellInventory(player) {
  const c = player.getComponent("minecraft:inventory")?.container;
  const result = { total: 0, count: 0 };
  if (!c) return result;
  const market = loadMarket();
  for (let i = 0; i < c.size; i++) {
    const it = c.getItem(i);
    if (!sellable(it)) continue;
    const e = market[it.typeId] ?? { x: 1, h: [1] };
    result.total += BASE_PRICES[it.typeId] * e.x * it.amount; // price before this sale's pressure
    result.count += it.amount;
    e.x = round3(clamp(e.x - 0.004 * it.amount, 0.5, 1.5));
    market[it.typeId] = e;
    c.setItem(i, undefined);
  }
  if (result.count > 0) { saveMarket(market); addCoins(player, result.total); }
  return result;
}

// ---------------------------------------------------------------------------
// Origin block: generation + break handling.
// ---------------------------------------------------------------------------
const brokenCount = () => { const v = world.getDynamicProperty("sv_broken"); return typeof v === "number" ? v : 0; };

export function pickBlock() {
  const pool = GEN_TABLE.filter((e) => brokenCount() >= e[2]);
  let roll = Math.random() * pool.reduce((s, e) => s + e[1], 0);
  for (const e of pool) { roll -= e[1]; if (roll <= 0) return e[0]; }
  return pool[0][0];
}

export function regenerateOrigin(dimension = world.getDimension("overworld")) {
  try { dimension.getBlock(ORIGIN)?.setType(pickBlock()); } catch { /* chunk not loaded; upkeep retries */ }
}
export function countCoreBreak() { world.setDynamicProperty("sv_broken", brokenCount() + 1); }

export function initEconomy() {
  world.afterEvents.playerBreakBlock.subscribe((ev) => {
    const { block, player, brokenBlockPermutation } = ev;
    if (block.dimension.id !== "minecraft:overworld") return;
    const l = block.location;
    if (l.x !== ORIGIN.x || l.y !== ORIGIN.y || l.z !== ORIGIN.z) return;
    const id = brokenBlockPermutation.type.id;
    const value = getPrice(id) * BREAK_BOUNTY_RATE;
    countCoreBreak();
    system.run(() => {
      regenerateOrigin(block.dimension);
      if (value > 0) {
        addCoins(player, value);
        player.onScreenDisplay.setActionBar(`§6+${value.toFixed(2)} coins §7(${prettyName(id)})`);
      }
    });
  });

  // Core upkeep: wait for void_cleaned, replace the placeholder once, refill if empty.
  system.runInterval(() => {
    if (!world.getAllPlayers().some((p) => p.hasTag("void_cleaned"))) return;
    const dim = world.getDimension("overworld");
    let b;
    try { b = dim.getBlock(ORIGIN); } catch { return; }
    if (!b) return;
    const started = world.getDynamicProperty("sv_core_started") === true;
    if (b.typeId === "minecraft:air" || (!started && b.typeId === "minecraft:dirt")) {
      regenerateOrigin(dim);
      world.setDynamicProperty("sv_core_started", true);
    }
  }, 20);

  system.runInterval(tickMarket, 1200); // market drift every 60 s
}
