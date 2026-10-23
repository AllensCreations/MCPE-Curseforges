import { world, system, BlockTypes, ItemStack } from "@minecraft/server";
import { CORE, FLOOR_Y, CURRENCY, LICENSES, UNSAFE_BLOCK, ISLAND_LEVELS, CONTRACTS, MAX_CHESTS_PER_PLAYER, LEDGER_ID, nice, DIRT_SHARE, LOOT_DENY, BIOMES, ACHIEVEMENTS, GOLDEN_CHANCE, GOLDEN_LOOT, UPGRADE_MAX, UPGRADE_CUT } from "./config.js";
import { loadPlayer, savePlayer, loadWorld, saveWorld, hasLic, canAfford, addCoins, spend, log, islandLevel, inBounds, ITEMS, quote, recordSale } from "./store.js";

const dimOf = () => world.getDimension("overworld");
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const full = (id) => "minecraft:" + id;

// ---- OneBlock core ----
export const core = { armed: false, pending: false };
export const isCore = (b) => b.dimension.id === "minecraft:overworld" && b.x === CORE.x && b.y === CORE.y && b.z === CORE.z;
export const isFoundation = (b) => b.dimension.id === "minecraft:overworld" && b.x === CORE.x && b.y === CORE.y - 1 && b.z === CORE.z;

const validBlock = new Map();
export function usable(id) {
  if (!validBlock.has(id)) validBlock.set(id, !UNSAFE_BLOCK.test(id) && !!BlockTypes.get(id));
  return validBlock.get(id);
}

export function poolFor(d) {
  const pool = [];
  for (const L of LICENSES) {
    if (!hasLic(d, L.id)) continue;
    for (const [b, w] of Object.entries(L.blocks)) {
      if (usable(full(b)) && w > 0) pool.push([full(b), w]);
    }
  }
  if (!pool.length) return [["minecraft:dirt", 1]];
  // Dirt floor: keep Dirt at a minimum share so rarer blocks cannot crowd it out.
  const i = pool.findIndex((e) => e[0] === "minecraft:dirt");
  if (i >= 0) {
    const others = pool.reduce((s, e, k) => (k === i ? s : s + e[1]), 0);
    pool[i][1] = Math.max(pool[i][1], Math.ceil((others * DIRT_SHARE) / (1 - DIRT_SHARE)));
  }
  return pool;
}

export function pickBlock(pool) {
  let r = Math.random() * pool.reduce((s, e) => s + e[1], 0);
  for (const [id, w] of pool) { r -= w; if (r < 0) return id; }
  return pool[0][0];
}

export function regenerate(player) {
  const b = dimOf().getBlock(CORE);
  if (!b) return false;
  const id = pickBlock(player ? poolFor(loadPlayer(player)) : [["minecraft:dirt", 1]]);
  try { b.setType(id); } catch (e) {
    try { b.setType("minecraft:dirt"); } catch (e2) { return false; }
  }
  core.armed = true;
  core.pending = false;
  return true;
}

// Recovery: re-arm after reloads, regenerate if the core vanished (only once a player finished setup).
export function coreWatch() {
  const ready = world.getAllPlayers().some((p) => p.hasTag("void_cleaned") && p.dimension.id === "minecraft:overworld");
  if (!ready) return;
  const b = dimOf().getBlock(CORE);
  if (!b) return;
  if (!b.isAir) { core.armed = true; core.pending = false; return; }
  if (!core.pending) { core.pending = true; system.run(() => regenerate(null)); }
}


// ---- OneBlock automation subscription ----
export const AUTO_MINE_COST = 100;
export const AUTO_MINE_TICKS = 600; // 30 real-time seconds at 20 ticks/second.
const AUTO_MINE_STEP = 4;
const currentDay = () => world.getDay();

export function autoMineStatus() {
  const a = loadWorld().autoMine;
  const day = currentDay();
  const active = !!a && a.expiresDay > day && (a.usedTicks || 0) < AUTO_MINE_TICKS;
  const available = !a || a.purchaseDay !== day;
  if (!active) {
    return { active: false, available, usedTicks: a && a.purchaseDay === day ? (a.usedTicks || 0) : 0, remainingTicks: a && a.purchaseDay === day ? Math.max(0, AUTO_MINE_TICKS - (a.usedTicks || 0)) : AUTO_MINE_TICKS, cost: AUTO_MINE_COST };
  }
  return { active: true, available: false, usedTicks: a.usedTicks || 0, remainingTicks: Math.max(0, AUTO_MINE_TICKS - (a.usedTicks || 0)), cost: AUTO_MINE_COST };
}

export function buyAutoMine(p) {
  const w = loadWorld();
  const day = currentDay();
  const a = w.autoMine;
  if (a && a.purchaseDay === day) {
    const remaining = Math.max(0, AUTO_MINE_TICKS - (a.usedTicks || 0));
    return { ok: false, msg: remaining > 0 ? "The OneBlock automation subscription is already active for this Minecraft day. Remaining time: " + Math.ceil(remaining / 20) + " seconds." : "You have used today's 30-second automation allowance. You can purchase another subscription when the next Minecraft day begins." };
  }
  const d = loadPlayer(p);
  if (!spend(d, AUTO_MINE_COST)) return { ok: false, msg: "Not enough " + CURRENCY + ". You need " + AUTO_MINE_COST + ", you have " + d.coins + "." };
  w.autoMine = { owner: p.id, purchaseDay: day, expiresDay: day + 1, usedTicks: 0 };
  log(d, "Bought OneBlock automation subscription for " + AUTO_MINE_COST + " " + CURRENCY);
  savePlayer(p, d);
  saveWorld(w);
  return { ok: true, msg: "Subscription purchased for " + AUTO_MINE_COST + " " + CURRENCY + ". Automation can run for up to 30 seconds this Minecraft day. It expires when the next Minecraft day begins." };
}

const AUTO_DROPS = {
  "minecraft:coal_ore": "minecraft:coal", "minecraft:deepslate_coal_ore": "minecraft:coal",
  "minecraft:copper_ore": "minecraft:raw_copper", "minecraft:deepslate_copper_ore": "minecraft:raw_copper",
  "minecraft:iron_ore": "minecraft:raw_iron", "minecraft:deepslate_iron_ore": "minecraft:raw_iron",
  "minecraft:gold_ore": "minecraft:raw_gold", "minecraft:deepslate_gold_ore": "minecraft:raw_gold",
  "minecraft:redstone_ore": "minecraft:redstone", "minecraft:deepslate_redstone_ore": "minecraft:redstone",
  "minecraft:lapis_ore": "minecraft:lapis_lazuli", "minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli",
  "minecraft:diamond_ore": "minecraft:diamond", "minecraft:deepslate_diamond_ore": "minecraft:diamond",
  "minecraft:emerald_ore": "minecraft:emerald", "minecraft:deepslate_emerald_ore": "minecraft:emerald",
  "minecraft:quartz_ore": "minecraft:quartz", "minecraft:glowstone": "minecraft:glowstone_dust"
};

function storeAutoDrop(container, blockId) {
  let stack;
  try { stack = new ItemStack(AUTO_DROPS[blockId] || blockId, 1); } catch (e) { return false; }
  for (let i = 0; i < container.size; i++) {
    const old = container.getItem(i);
    if (old && old.typeId === stack.typeId && old.amount < old.maxAmount) {
      const moved = Math.min(stack.amount, old.maxAmount - old.amount);
      old.amount += moved;
      stack.amount -= moved;
      container.setItem(i, old);
      if (stack.amount <= 0) return true;
    }
  }
  for (let i = 0; i < container.size; i++) {
    if (!container.getItem(i)) { container.setItem(i, stack); return true; }
  }
  return false;
}

export function autoMineTick() {
  const w = loadWorld();
  const a = w.autoMine;
  const day = currentDay();
  if (!a || a.expiresDay <= day || a.usedTicks >= AUTO_MINE_TICKS) return;
  const player = world.getAllPlayers().find((p) => p.id === a.owner && p.dimension.id === "minecraft:overworld" && p.hasTag("void_cleaned"));
  if (!player) return;
  a.usedTicks = Math.min(AUTO_MINE_TICKS, (a.usedTicks || 0) + 1);
  if (a.usedTicks % 20 === 0 || a.usedTicks >= AUTO_MINE_TICKS) saveWorld(w);
  if (a.usedTicks % AUTO_MINE_STEP !== 0) return;
  if (!core.armed || core.pending) return;
  const dim = dimOf();
  let chestBlock = dim.getBlock({ x: CORE.x, y: CORE.y + 1, z: CORE.z });
  if (!chestBlock) return;
  if (chestBlock.typeId !== "minecraft:chest") {
    if (!chestBlock.isAir) return;
    try { chestBlock.setType("minecraft:chest"); } catch (e) { return; }
    chestBlock = dim.getBlock({ x: CORE.x, y: CORE.y + 1, z: CORE.z });
  }
  const container = chestBlock?.getComponent("minecraft:inventory")?.container;
  const coreBlock = dim.getBlock(CORE);
  if (!container || !coreBlock || coreBlock.isAir) return;
  if (!storeAutoDrop(container, coreBlock.typeId)) {
    a.usedTicks = AUTO_MINE_TICKS;
    saveWorld(w);
    try { player.sendMessage("Automation paused: the OneBlock collection chest is full."); } catch (e) {}
    return;
  }
  core.armed = false;
  core.pending = true;
  if (!regenerate(player)) core.pending = false;
  if (a.usedTicks >= AUTO_MINE_TICKS) {
    saveWorld(w);
    try { player.sendMessage("OneBlock automation time is up for today."); } catch (e) {}
  }
}

// ---- Wallet ----
export function credit(p, n, label) {
  const d = loadPlayer(p);
  addCoins(d, n);
  d.mined += 1;
  savePlayer(p, d);
  try { p.onScreenDisplay.setActionBar("+" + n + " " + CURRENCY + "   Balance: " + d.coins); } catch (e) { /* ignore */ }
}

// ---- Licenses ----
export function buyLicense(p, id) {
  const L = LICENSES.find((x) => x.id === id);
  const d = loadPlayer(p);
  if (!L || L.cost <= 0) return { ok: false, msg: "That license cannot be purchased." };
  if (hasLic(d, id)) return { ok: false, msg: "You already own " + L.name + "." };
  if (L.req && !hasLic(d, L.req)) return { ok: false, msg: "Requires " + LICENSES.find((x) => x.id === L.req).name + " first." };
  if (!spend(d, L.cost)) return { ok: false, msg: "Not enough " + CURRENCY + ". You need " + L.cost + ", you have " + d.coins + "." };
  d.lic.push(id);
  log(d, "Bought " + L.name + " for " + L.cost);
  if (d.lic.length >= LICENSES.length) grantAch(p, d, "all_licenses");
  savePlayer(p, d);
  return { ok: true, msg: "License purchased: " + L.name + ". Its blocks can now appear at the OneBlock. Balance: " + d.coins + " " + CURRENCY };
}

// ---- Selling ----
const plain = (it) => !it.nameTag && it.getLore().length === 0;
export function inventoryCounts(p) {
  const c = p.getComponent("minecraft:inventory").container;
  const m = new Map();
  for (let i = 0; i < c.size; i++) {
    const it = c.getItem(i);
    if (it && ITEMS.has(it.typeId) && plain(it)) m.set(it.typeId, (m.get(it.typeId) || 0) + it.amount);
  }
  return m;
}
function removeItems(p, id, qty) {
  const c = p.getComponent("minecraft:inventory").container;
  let left = qty;
  for (let i = 0; i < c.size && left > 0; i++) {
    const it = c.getItem(i);
    if (!it || it.typeId !== id || !plain(it)) continue;
    const take = Math.min(left, it.amount);
    if (take === it.amount) c.setItem(i, undefined);
    else { it.amount -= take; c.setItem(i, it); }
    left -= take;
  }
  return qty - left;
}
export function sell(p, id, qty) {
  const it = ITEMS.get(id);
  const d = loadPlayer(p);
  if (!it) return { ok: false, msg: "The market does not buy that item." };
  if (!hasLic(d, it.lic)) return { ok: false, msg: "You need " + LICENSES.find((l) => l.id === it.lic).name + " to trade this item." };
  if (!Number.isSafeInteger(qty) || qty < 1) return { ok: false, msg: "Invalid quantity." };
  const have = inventoryCounts(p).get(id) || 0;
  if (have < qty) return { ok: false, msg: "You only have " + have + " of that item now. Nothing was sold." };
  const removed = removeItems(p, id, qty);
  if (removed < 1) return { ok: false, msg: "Could not remove items. Nothing was sold." };
  const w = loadWorld();
  const q = quote(w, id, removed);
  addCoins(d, q.total);
  recordSale(w, id, removed);
  log(d, "Sold " + removed + " " + nice(id) + " for " + q.total);
  d.sold = (d.sold || 0) + removed;
  if (d.sold >= 1000) grantAch(p, d, "sell_1000");
  savePlayer(p, d);
  saveWorld(w);
  return { ok: true, msg: "Receipt: sold " + removed + " " + nice(id) + " for " + q.total + " " + CURRENCY + ".\nBalance: " + d.coins + " " + CURRENCY };
}

// ---- Island expansion ----
export function buyIsland(p, targetIdx) {
  const w = loadWorld();
  const d = loadPlayer(p);
  const cur = Math.min(Math.max(0, w.lvl | 0), ISLAND_LEVELS.length - 1);
  if (targetIdx !== cur + 1 || !ISLAND_LEVELS[targetIdx]) return { ok: false, msg: "That permit is no longer available. Nothing was charged." };
  const N = ISLAND_LEVELS[targetIdx];
  const O = ISLAND_LEVELS[cur];
  if (!canAfford(d, N.cost)) return { ok: false, msg: "Not enough " + CURRENCY + ". You need " + N.cost + ", you have " + d.coins + "." };
  const dim = dimOf();
  const corners = [[N.min, N.min], [N.min, N.max], [N.max, N.min], [N.max, N.max]];
  if (corners.some(([x, z]) => !dim.getBlock({ x, y: FLOOR_Y, z }))) return { ok: false, msg: "The new area is not loaded. Stand near the OneBlock and try again. Nothing was charged." };
  // Floor only the new ring, and only where the space is empty (keep), so existing blocks are never touched.
  const strips = [
    [N.min, N.min, N.max, O.min - 1], [N.min, O.max + 1, N.max, N.max],
    [N.min, O.min, O.min - 1, O.max], [O.max + 1, O.min, N.max, O.max],
  ];
  for (const [x1, z1, x2, z2] of strips) {
    if (x1 > x2 || z1 > z2) continue;
    try { dim.runCommand("fill " + x1 + " " + FLOOR_Y + " " + z1 + " " + x2 + " " + FLOOR_Y + " " + z2 + " grass_block replace air"); } catch (e) { /* nothing to fill */ }
  }
  spend(d, N.cost);
  w.lvl = targetIdx;
  log(d, "Bought " + N.name + " (" + N.size + "x" + N.size + ") for " + N.cost);
  if (targetIdx === ISLAND_LEVELS.length - 1) grantAch(p, d, "island_max");
  savePlayer(p, d);
  saveWorld(w);
  return { ok: true, msg: N.name + " granted. Your island may now be built on up to " + N.size + " x " + N.size + " blocks around the OneBlock. Balance: " + d.coins + " " + CURRENCY };
}

// ---- Loot contracts ----
export function buyContract(p, id) {
  const C = CONTRACTS.find((c) => c.id === id);
  const d = loadPlayer(p);
  if (!C) return { ok: false, msg: "Unknown contract." };
  if (d.con.includes(id)) return { ok: false, msg: C.name + " is already active. You were not charged." };
  if (!hasLic(d, C.req)) return { ok: false, msg: "Requires " + LICENSES.find((l) => l.id === C.req).name + "." };
  if (!spend(d, C.cost)) return { ok: false, msg: "Not enough " + CURRENCY + ". You need " + C.cost + ", you have " + d.coins + "." };
  d.con.push(id);
  log(d, "Activated " + C.name + " for " + C.cost);
  grantAch(p, d, "first_contract");
  savePlayer(p, d);
  nextAt.set(p.id + ":" + id, Date.now() + C.intervalMs);
  return { ok: true, msg: C.name + " is active. Chests will appear on your island over time. Balance: " + d.coins + " " + CURRENCY };
}
export function cancelContract(p, id) {
  const d = loadPlayer(p);
  if (!d.con.includes(id)) return { ok: false, msg: "That contract is not active." };
  d.con = d.con.filter((c) => c !== id);
  log(d, "Cancelled " + CONTRACTS.find((c) => c.id === id).name);
  savePlayer(p, d);
  return { ok: true, msg: "Contract cancelled. No refund is issued." };
}

const nextAt = new Map();
function trySpawn(p, C, d) {
  const dim = dimOf();
  const w = loadWorld();
  // Drop records for chests that no longer exist; keep records whose area is unloaded.
  w.chests = w.chests.filter((r) => { const b = dim.getBlock({ x: r.x, y: r.y, z: r.z }); return !b || b.typeId === "minecraft:chest"; });
  if (w.chests.filter((r) => r.o === p.id).length >= MAX_CHESTS_PER_PLAYER) { saveWorld(w); return false; }
  const L = ISLAND_LEVELS[islandLevel()];
  const options = (C.biomes ? C.biomes : [{ name: C.name, loot: C.loot }]).map((b) => ({ b, e: b.loot.filter((x) => hasLic(d, x[4]) && BlockOrItemOk(x[0])) })).filter((o) => o.e.length);
  if (!options.length) return false;
  const pick = options[rnd(0, options.length - 1)];
  const entries = pick.e;
  const label = C.biomes ? pick.b.name + " Biome Chest" : C.name;
  for (let t = 0; t < 40; t++) {
    const x = rnd(L.min, L.max), z = rnd(L.min, L.max);
    if (x === CORE.x && z === CORE.z) continue;
    const floor = dim.getBlock({ x, y: FLOOR_Y, z });
    const spot = dim.getBlock({ x, y: FLOOR_Y + 1, z });
    const above = dim.getBlock({ x, y: FLOOR_Y + 2, z });
    if (!floor || !spot || !above) continue;
    if (floor.isAir || floor.isLiquid || floor.typeId === "minecraft:bedrock" || !spot.isAir || !above.isAir) continue;
    if (nearLiquid(dim, x, FLOOR_Y + 1, z)) continue;
    if (w.chests.some((r) => r.x === x && r.z === z)) continue;
    spot.setType("minecraft:chest");
    const cont = spot.getComponent("minecraft:inventory").container;
    const lvl = (d.up && d.up[C.id]) || 1;
    const rolls = rnd(C.rolls[0] + lvl - 1, C.rolls[1] + lvl - 1);
    const total = entries.reduce((s, e) => s + e[1], 0);
    for (let r = 0; r < rolls; r++) {
      let pick = Math.random() * total, e = entries[0];
      for (const c of entries) { pick -= c[1]; if (pick < 0) { e = c; break; } }
      const slot = rnd(0, cont.size - 1);
      if (cont.getItem(slot)) continue;
      cont.setItem(slot, new ItemStack(full(e[0]), rnd(e[2], e[3])));
    }
    const golden = Math.random() < GOLDEN_CHANCE;
    if (golden) {
      const gl = GOLDEN_LOOT.filter((x) => hasLic(d, x[3]));
      if (gl.length) {
        const pick2 = gl[rnd(0, gl.length - 1)];
        for (let s = 0; s < cont.size; s++) {
          if (!cont.getItem(s)) { cont.setItem(s, new ItemStack(full(pick2[0]), rnd(pick2[1], pick2[2]))); break; }
        }
      }
    }
    w.chests.push({ x, y: FLOOR_Y + 1, z, o: p.id, c: C.id, g: golden ? 1 : 0 });
    saveWorld(w);
    p.sendMessage((golden ? "Golden " : "") + label + " has appeared on your island at " + x + ", " + (FLOOR_Y + 1) + ", " + z + ".");
    return true;
  }
  saveWorld(w);
  return false;
}
const itemOk = new Map();
function BlockOrItemOk(id) {
  if (!itemOk.has(id)) { let ok = true; try { new ItemStack(full(id), 1); } catch (e) { ok = false; } itemOk.set(id, ok && !UNSAFE_BLOCK.test(id) && !LOOT_DENY.test(id)); }
  return itemOk.get(id);
}

export function contractTick() {
  const now = Date.now();
  for (const p of world.getAllPlayers()) {
    if (p.dimension.id !== "minecraft:overworld" || !p.hasTag("void_cleaned")) continue;
    const d = loadPlayer(p);
    for (const id of d.con) {
      const C = CONTRACTS.find((c) => c.id === id);
      if (!C) continue;
      const key = p.id + ":" + id;
      if (!nextAt.has(key)) nextAt.set(key, now + intervalFor(d, C));
      if (now >= nextAt.get(key)) {
        nextAt.set(key, now + intervalFor(d, C));
        try { trySpawn(p, C, d); } catch (e) { console.warn("[SovereignMarket] chest spawn failed: " + e); }
      }
    }
  }
}

// ---- Ledger item: always kept in the last hotbar slot (slot 9) ----
export const LEDGER_SLOT = 8;
export function ensureLedger(p) {
  const c = p.getComponent("minecraft:inventory").container;
  // Remove any extra ledgers from other slots (only one is allowed).
  for (let i = 0; i < c.size; i++) {
    if (i === LEDGER_SLOT) continue;
    const it = c.getItem(i);
    if (it && it.typeId === LEDGER_ID) c.setItem(i, undefined);
  }
  const cur = c.getItem(LEDGER_SLOT);
  if (cur && cur.typeId === LEDGER_ID) {
    if (cur.amount !== 1) { cur.amount = 1; c.setItem(LEDGER_SLOT, cur); }
    return;
  }
  // Move whatever occupies slot 9 out of the way, without deleting it.
  if (cur) {
    let empty = -1;
    for (let i = 0; i < c.size; i++) if (!c.getItem(i)) { empty = i; break; }
    if (empty >= 0) c.setItem(empty, cur);
    else p.dimension.spawnItem(cur, p.location);
  }
  c.setItem(LEDGER_SLOT, new ItemStack(LEDGER_ID, 1));
}

// Removes ledgers lying on the ground near a player, so a thrown ledger never duplicates.
export function clearDroppedLedgers(p) {
  try {
    for (const e of p.dimension.getEntities({ type: "minecraft:item", location: p.location, maxDistance: 8 })) {
      const s = e.getComponent("minecraft:item") && e.getComponent("minecraft:item").itemStack;
      if (s && s.typeId === LEDGER_ID) e.remove();
    }
  } catch (e) { /* ignore */ }
}

// True if any block in the 3x3x3 box is liquid or unloaded. Chests never spawn beside water or lava.
function nearLiquid(dim, x, y, z) {
  for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
    const b = dim.getBlock({ x: x + dx, y: y + dy, z: z + dz });
    if (!b || b.isLiquid) return true;
  }
  return false;
}

// Startup audit: logs every loot id and license block that the game does not recognize, so typos are visible.
export function auditLoot() {
  const bad = new Set();
  for (const C of CONTRACTS) for (const e of C.loot) if (!BlockOrItemOk(e[0])) bad.add("loot:" + e[0]);
  for (const B of BIOMES) for (const e of B.loot) if (!BlockOrItemOk(e[0])) bad.add("biome:" + e[0]);
  for (const L of LICENSES) for (const b of Object.keys(L.blocks)) if (!usable("minecraft:" + b)) bad.add("block:" + b);
  if (bad.size) console.warn("[SovereignMarket] skipped unknown ids: " + [...bad].join(", "));
  else console.warn("[SovereignMarket] loot and block ids all recognized");
}

// Removes stray liquid from the permitted island area (replace only; never touches other blocks).
// Limited to 67x67x5 so it stays under the fill command's 32,768 block cap.
export function sweepLiquids() {
  const L = ISLAND_LEVELS[islandLevel()];
  const dim = dimOf();
  for (const f of ["flowing_water", "water", "flowing_lava", "lava"]) {
    try { dim.runCommand("fill " + L.min + " 0 " + L.min + " " + L.max + " 4 " + L.max + " air replace " + f); } catch (e) { /* none found */ }
  }
}

// ---- Feature 5: contract upgrades ----
export const intervalFor = (d, C) => Math.round(C.intervalMs * (1 - UPGRADE_CUT * (((d.up && d.up[C.id]) || 1) - 1)));
export function upgradeCost(C, lvl) { return Math.round(C.cost * 0.5 * (lvl + 1)); }
export function upgradeContract(p, id) {
  const C = CONTRACTS.find((c) => c.id === id);
  const d = loadPlayer(p);
  if (!C || !d.con.includes(id)) return { ok: false, msg: "That contract is not active." };
  const lvl = (d.up && d.up[id]) || 1;
  if (lvl >= UPGRADE_MAX) return { ok: false, msg: C.name + " is already at the maximum level." };
  const cost = upgradeCost(C, lvl);
  if (!spend(d, cost)) return { ok: false, msg: "Not enough " + CURRENCY + ". You need " + cost + ", you have " + d.coins + "." };
  d.up = { ...(d.up || {}), [id]: lvl + 1 };
  log(d, "Upgraded " + C.name + " to level " + (lvl + 1) + " for " + cost);
  savePlayer(p, d);
  return { ok: true, msg: C.name + " is now level " + (lvl + 1) + ". Balance: " + d.coins + " " + CURRENCY };
}

// ---- Feature 9: achievements ----
export function grantAch(p, d, id) {
  if (!d.ach) d.ach = [];
  if (d.ach.includes(id)) return;
  const A = ACHIEVEMENTS.find((a) => a.id === id);
  if (!A) return;
  d.ach.push(id);
  addCoins(d, A.reward);
  log(d, "Achievement: " + A.name + " (+" + A.reward + ")");
  try { p.sendMessage("\u00a7aAchievement unlocked: " + A.name + " (+" + A.reward + " " + CURRENCY + ")"); } catch (e) { /* player left */ }
}
