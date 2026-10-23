// economy.js - OneBlock regeneration engine, phases, pricing, market events, wallet, ranks, vault.
import { world, system, DisplaySlotId, ObjectiveSortOrder } from "@minecraft/server";
import { vaultKey } from "./teams.js";
import { getStat, bumpStat } from "./stats.js";

export const ORIGIN = { x: 0, y: 64, z: 0 };
export const OBJECTIVE = "sovereign_coins";
export const BREAK_BOUNTY_RATE = 0.5;       // share of market price paid for breaking the core
export const SELL_AMOUNTS = [1, 8, 16, 32, 64]; // the only quantities the ledger sells

// ---------------------------------------------------------------------------
// Base prices (coins per item). Works for block ids and item ids.
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

// ---------------------------------------------------------------------------
// Progression: phases unlock by total core breaks (shared by the whole world).
// Each phase: +10% break coins, richer blocks, and gates permits/worker upgrades.
// ---------------------------------------------------------------------------
export const PHASES = [
  { name: "Dirt Age", min: 0 }, { name: "Stone Age", min: 50 }, { name: "Copper Age", min: 150 },
  { name: "Iron Age", min: 300 }, { name: "Redstone Age", min: 500 }, { name: "Golden Age", min: 800 },
  { name: "Diamond Age", min: 1200 }, { name: "Emerald Age", min: 2000 },
];
// [block id, weight, phase index that unlocks it]
const GEN_TABLE = [
  ["minecraft:dirt", 30, 0], ["minecraft:grass_block", 20, 0], ["minecraft:oak_log", 14, 0],
  ["minecraft:cobblestone", 26, 0], ["minecraft:sand", 8, 0], ["minecraft:gravel", 6, 0],
  ["minecraft:stone", 20, 1], ["minecraft:coal_ore", 12, 1], ["minecraft:copper_ore", 8, 2],
  ["minecraft:iron_ore", 8, 3], ["minecraft:redstone_ore", 5, 4], ["minecraft:lapis_ore", 4, 4],
  ["minecraft:gold_ore", 3, 5], ["minecraft:diamond_ore", 1.5, 6], ["minecraft:emerald_ore", 1, 7],
];
// Player ranks by lifetime coins earned: +5% coins per rank.
const RANKS = [
  { name: "Peasant", min: 0 }, { name: "Merchant", min: 100 }, { name: "Trader", min: 1000 },
  { name: "Magnate", min: 10000 }, { name: "Sovereign", min: 100000 },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round3 = (v) => Math.round(v * 1000) / 1000;
export const prettyName = (id) => id.replace("minecraft:", "").replace(/_/g, " ");

const brokenCount = () => { const v = world.getDynamicProperty("sv_broken"); return typeof v === "number" ? v : 0; };
export function getPhaseInfo() {
  const count = brokenCount();
  let index = 0;
  PHASES.forEach((p, i) => { if (count >= p.min) index = i; });
  const next = PHASES[index + 1];
  return { index, name: PHASES[index].name, count, start: PHASES[index].min, nextMin: next ? next.min : null, nextName: next ? next.name : null };
}
const phaseMult = () => 1 + 0.1 * getPhaseInfo().index;

export function getRankInfo(player) {
  const e = player.getDynamicProperty("sv_earned");
  const earned = typeof e === "number" ? e : 0;
  let index = 0;
  RANKS.forEach((r, i) => { if (earned >= r.min) index = i; });
  const next = RANKS[index + 1];
  return { index, name: RANKS[index].name, earned, nextMin: next ? next.min : null, nextName: next ? next.name : null };
}
// +5% per rank, +10% per prestige.
export const incomeMult = (player) => 1 + 0.05 * getRankInfo(player).index + 0.1 * getStat(player, "prestige");

// ---------------------------------------------------------------------------
// Market: per-item multiplier (0.5x-1.5x) + history, plus one random event at a time.
// ---------------------------------------------------------------------------
const ORES = ["minecraft:coal", "minecraft:coal_ore", "minecraft:raw_copper", "minecraft:copper_ore", "minecraft:raw_iron", "minecraft:iron_ore"];
const GEMS = ["minecraft:diamond", "minecraft:diamond_ore", "minecraft:emerald", "minecraft:emerald_ore"];
const CROPS = ["minecraft:wheat", "minecraft:carrot", "minecraft:potato", "minecraft:beetroot"];
const EVENTS = [
  { name: "Ore Rush", mult: 1.4, mins: 5, ids: ORES, text: "Coal, copper and iron pay 40% more!" },
  { name: "Gem Boom", mult: 1.5, mins: 4, ids: GEMS, text: "Diamonds and emeralds pay 50% more!" },
  { name: "Harvest Festival", mult: 2, mins: 5, ids: CROPS, text: "Crops pay double!" },
  { name: "Lumber Shortage", mult: 2, mins: 4, ids: ["minecraft:oak_log"], text: "Logs pay double!" },
  { name: "Stone Glut", mult: 0.6, mins: 4, ids: ["minecraft:cobblestone", "minecraft:stone", "minecraft:dirt", "minecraft:sand", "minecraft:gravel"], text: "Common blocks pay 40% less." },
  { name: "Market Crash", mult: 0.7, mins: 3, ids: null, text: "Everything pays 30% less." },
];

function loadMarket() {
  const raw = world.getDynamicProperty("sv_market");
  if (typeof raw !== "string") return {};
  try { const o = JSON.parse(raw); return o && typeof o === "object" ? o : {}; } catch { return {}; }
}
const saveMarket = (m) => world.setDynamicProperty("sv_market", JSON.stringify(m));

function eventMult(market, id) {
  const def = market._ev ? EVENTS[market._ev.i] : null;
  if (!def) return 1;
  return def.ids === null || def.ids.includes(id) ? def.mult : 1;
}
export function getActiveEvent() {
  const m = loadMarket();
  const def = m._ev ? EVENTS[m._ev.i] : null;
  return def ? { name: def.name, text: def.text, mult: def.mult, minsLeft: m._ev.mins } : null;
}
function unitPrice(id, market) {
  const base = BASE_PRICES[id];
  if (base === undefined) return 0;
  return base * (market[id]?.x ?? 1) * eventMult(market, id);
}
export const getPrice = (id) => unitPrice(id, loadMarket());
/** What this player is paid per item right now (market x event x rank). */
export const sellPrice = (player, id) => unitPrice(id, loadMarket()) * incomeMult(player);

export function getMarketView() {
  const m = loadMarket();
  return Object.keys(BASE_PRICES).map((id) => {
    const e = m[id] ?? { x: 1, h: [1] };
    const h = e.h ?? [1];
    const prev = h.length > 1 ? h[h.length - 2] : e.x;
    return { id, base: BASE_PRICES[id], price: unitPrice(id, m), x: e.x, change: e.x - prev };
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
  if (m._ev) {
    m._ev.mins -= 1;
    if (m._ev.mins <= 0) {
      world.sendMessage(`§6[Market] §7The ${EVENTS[m._ev.i]?.name ?? "event"} has ended.`);
      delete m._ev;
    }
  } else if (world.getAllPlayers().length > 0 && Math.random() < 0.12) {
    const i = Math.floor(Math.random() * EVENTS.length);
    m._ev = { i, mins: EVENTS[i].mins };
    world.sendMessage(`§6[Market] §d${EVENTS[i].name}! §f${EVENTS[i].text} §7(${EVENTS[i].mins} min)`);
  }
  saveMarket(m);
}

// ---------------------------------------------------------------------------
// Wallet: whole coins on the scoreboard, fractions in a dynamic property.
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
  const e = player.getDynamicProperty("sv_earned");
  player.setDynamicProperty("sv_earned", round3((typeof e === "number" ? e : 0) + amount)); // drives rank
  const l = player.getDynamicProperty("sv_s_life");
  player.setDynamicProperty("sv_s_life", round3((typeof l === "number" ? l : 0) + amount));  // lifetime, never reset
}
/** Coins that do NOT count toward rank (transfers, trades, refunds). */
export function giveCoins(player, amount) { if (amount > 0) setBalance(player, getBalance(player) + amount); }
export function resetWallet(player) { setBalance(player, 0); player.setDynamicProperty("sv_earned", 0); }
export function spendCoins(player, cost) {
  const bal = getBalance(player);
  if (!(cost >= 0) || bal + 1e-9 < cost) return false;
  setBalance(player, bal - cost);
  return true;
}
// Worker vaults: one per team, or a personal one when not in a team (keyed by vaultKey).
const vaults = () => {
  const raw = world.getDynamicProperty("sv_vaults");
  if (typeof raw !== "string") return {};
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : {}; } catch { return {}; }
};
export const getVault = (pid) => vaults()[vaultKey(pid)] ?? 0;
function setVault(pid, amt) { const v = vaults(); v[vaultKey(pid)] = round3(Math.max(0, amt)); world.setDynamicProperty("sv_vaults", JSON.stringify(v)); }
export const addVault = (pid, amt) => setVault(pid, getVault(pid) + amt);
export function spendVault(pid, amt) {
  if (getVault(pid) + 1e-9 < amt) return false;
  setVault(pid, getVault(pid) - amt);
  return true;
}

// ---------------------------------------------------------------------------
// Selling: pick an item, then one of 1 / 8 / 16 / 32 / 64. Only priced, un-renamed,
// lore-free stacks are touched.
// ---------------------------------------------------------------------------
function sellable(item) {
  if (!item || BASE_PRICES[item.typeId] === undefined || item.nameTag) return false;
  try { if (item.getLore().length > 0) return false; } catch { return false; }
  return true;
}
const inv = (player) => player.getComponent("minecraft:inventory")?.container;

/** [{ id, amount }] of sellable items, most valuable first. */
export function listSellable(player) {
  const c = inv(player);
  if (!c) return [];
  const tally = {};
  for (let i = 0; i < c.size; i++) {
    const it = c.getItem(i);
    if (sellable(it)) tally[it.typeId] = (tally[it.typeId] ?? 0) + it.amount;
  }
  const m = loadMarket();
  return Object.entries(tally).map(([id, amount]) => ({ id, amount, v: unitPrice(id, m) * amount }))
    .sort((a, b) => b.v - a.v).map(({ id, amount }) => ({ id, amount }));
}
export function countOf(player, id) {
  const c = inv(player);
  if (!c) return 0;
  let n = 0;
  for (let i = 0; i < c.size; i++) { const it = c.getItem(i); if (it?.typeId === id && sellable(it)) n += it.amount; }
  return n;
}
export function heldItemId(player) {
  try { return inv(player)?.getItem(player.selectedSlotIndex)?.typeId; } catch { return undefined; }
}
/** Sells exactly qty (must be in SELL_AMOUNTS and owned). Returns { sold, total }. */
export function sellItem(player, id, qty) {
  const none = { sold: 0, total: 0 };
  const c = inv(player);
  if (!c || !SELL_AMOUNTS.includes(qty) || BASE_PRICES[id] === undefined || countOf(player, id) < qty) return none;
  const market = loadMarket();
  const unit = unitPrice(id, market) * incomeMult(player);
  let need = qty;
  for (let i = 0; i < c.size && need > 0; i++) {
    const it = c.getItem(i);
    if (!it || it.typeId !== id || !sellable(it)) continue;
    const take = Math.min(need, it.amount);
    if (take === it.amount) c.setItem(i, undefined); else { it.amount -= take; c.setItem(i, it); }
    need -= take;
  }
  const sold = qty - need;
  const e = market[id] ?? { x: 1, h: [1] };
  e.x = round3(clamp(e.x - 0.004 * sold, 0.5, 1.5)); // selling pushes the price down
  market[id] = e;
  saveMarket(market);
  addCoins(player, unit * sold);
  return { sold, total: unit * sold };
}

/** Removes exactly qty of an item (no payment). Used for contracts and trade escrow. */
export function removeItems(player, id, qty) {
  const c = inv(player);
  if (!c || qty < 1 || countOf(player, id) < qty) return false;
  let need = qty;
  for (let i = 0; i < c.size && need > 0; i++) {
    const it = c.getItem(i);
    if (!it || it.typeId !== id || !sellable(it)) continue;
    const take = Math.min(need, it.amount);
    if (take === it.amount) c.setItem(i, undefined); else { it.amount -= take; c.setItem(i, it); }
    need -= take;
  }
  return need === 0;
}
/** Auto-sell: sells every sellable stack in a container at (1 - fee) of the player's price. */
export function sellContainer(container, player, rate) {
  const market = loadMarket();
  let total = 0, count = 0;
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    if (!sellable(it)) continue;
    total += unitPrice(it.typeId, market) * incomeMult(player) * rate * it.amount;
    count += it.amount;
    const e = market[it.typeId] ?? { x: 1, h: [1] };
    e.x = round3(clamp(e.x - 0.004 * it.amount, 0.5, 1.5));
    market[it.typeId] = e;
    container.setItem(i, undefined);
  }
  if (count > 0) { saveMarket(market); addCoins(player, total); }
  return { total, count };
}

// Items the core can currently yield (used by contracts): block -> what it drops.
const DROPS = {
  "minecraft:grass_block": "minecraft:dirt", "minecraft:stone": "minecraft:cobblestone", "minecraft:coal_ore": "minecraft:coal",
  "minecraft:copper_ore": "minecraft:raw_copper", "minecraft:iron_ore": "minecraft:raw_iron", "minecraft:redstone_ore": "minecraft:redstone",
  "minecraft:lapis_ore": "minecraft:lapis_lazuli", "minecraft:gold_ore": "minecraft:raw_gold", "minecraft:diamond_ore": "minecraft:diamond",
  "minecraft:emerald_ore": "minecraft:emerald",
};
export function unlockedItems() {
  const phase = getPhaseInfo().index;
  const set = new Set();
  for (const [id, , ph] of GEN_TABLE) if (phase >= ph) { const d = DROPS[id] ?? id; if (BASE_PRICES[d] !== undefined) set.add(d); }
  return [...set];
}
const phaseListeners = [];
export const onPhaseUp = (fn) => phaseListeners.push(fn);

// ---------------------------------------------------------------------------
// Origin block: generation, phase-ups and break rewards.
// ---------------------------------------------------------------------------
export function pickBlock() {
  const phase = getPhaseInfo().index;
  const pool = GEN_TABLE.filter((e) => phase >= e[2]);
  let roll = Math.random() * pool.reduce((s, e) => s + e[1], 0);
  for (const e of pool) { roll -= e[1]; if (roll <= 0) return e[0]; }
  return pool[0][0];
}
export function regenerateOrigin(dimension = world.getDimension("overworld")) {
  try { dimension.getBlock(ORIGIN)?.setType(pickBlock()); } catch { /* chunk not loaded; upkeep retries */ }
}

/** Counts a core break (player or worker) and celebrates phase-ups with a coin gift. */
export function countCoreBreak() {
  const before = getPhaseInfo().index;
  world.setDynamicProperty("sv_broken", brokenCount() + 1);
  const after = getPhaseInfo();
  if (after.index > before) {
    for (const fn of phaseListeners) { try { fn(after.index); } catch (e) { console.warn(`[Sovereign Market] ${e}`); } }
    world.sendMessage(`§6[Sovereign Market] §ePHASE UP: §f${after.name}! §7New blocks, permits and upgrades unlock. Everyone gets ${after.index * 100} coins.`);
    for (const p of world.getAllPlayers()) {
      addCoins(p, after.index * 100);
      try { p.onScreenDisplay.setTitle("§6Phase Up!", { subtitle: `§f${after.name}` }); } catch { /* ignore */ }
    }
  }
}

export function initEconomy() {
  world.afterEvents.playerBreakBlock.subscribe((ev) => {
    const { block, player, brokenBlockPermutation } = ev;
    if (block.dimension.id !== "minecraft:overworld") return;
    const l = block.location;
    if (l.x !== ORIGIN.x || l.y !== ORIGIN.y || l.z !== ORIGIN.z) return;
    const id = brokenBlockPermutation.type.id;
    const value = getPrice(id) * BREAK_BOUNTY_RATE * phaseMult() * incomeMult(player);
    countCoreBreak();
    bumpStat(player, "breaks");
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

  system.runInterval(tickMarket, 1200); // market drift + events every 60 s

  // Coin sidebar: everyone's coins, richest first.
  world.afterEvents.worldLoad.subscribe(() => {
    try {
      world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: objective(), sortOrder: ObjectiveSortOrder.Descending });
    } catch (e) { console.warn(`[Sovereign Market] sidebar: ${e}`); }
  });
}
