import { world, system, BlockTypes, ItemStack } from "@minecraft/server";
import { CORE, FLOOR_Y, CURRENCY, LICENSES, UNSAFE_BLOCK, ISLAND_LEVELS, CONTRACTS, MAX_CHESTS_PER_PLAYER, LEDGER_ID, nice, DIRT_SHARE, LOOT_DENY, BIOMES, ACHIEVEMENTS, GOLDEN_CHANCE, GOLDEN_LOOT, UPGRADE_MAX, UPGRADE_CUT, AUTO_LEVELS, AUTO_DAILY_TICKS, BASIC_CHEST_CHANCE, BORDER_BLOCK, MILESTONE_EVERY, MILESTONE_COINS_PER_TIER, JACKPOT_CHANCE, JACKPOT_MIN_PER_TIER, JACKPOT_MAX_PER_TIER } from "./config.js";
import { loadPlayer, savePlayer, loadWorld, saveWorld, hasLic, canAfford, addCoins, spend, log, islandLevel, inBounds, ITEMS, quote, recordSale, highestTier } from "./store.js";

const dimOf = () => world.getDimension("overworld");
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const full = (id) => "minecraft:" + id;

// ---- OneBlock core ----
export const core = { armed: false, pending: false, jackpot: false };
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

// auto = true when the Auto-Miner breaks the block: no jackpot and no milestone bonus, but chests still appear.
export function regenerate(player, auto = false) {
  const b = dimOf().getBlock(CORE);
  if (!b) return false;
  let d = null;
  try { d = player ? loadPlayer(player) : null; } catch (e) { d = null; }
  let id = pickBlock(d ? poolFor(d) : [["minecraft:dirt", 1]]);
  core.jackpot = false;
  let chest = false, bonus = false;
  if (d && !auto && d.bonus) {
    // Milestone reward: the next OneBlock is a bonus loot chest.
    chest = true; bonus = true;
    d.bonus = false;
    savePlayer(player, d);
  } else if (d && !auto && Math.random() < JACKPOT_CHANCE) {
    id = "minecraft:gold_block";
    core.jackpot = true;
  } else if (d && d.con.includes("basic") && Math.random() < BASIC_CHEST_CHANCE * ((d.up && d.up.basic) || 1)) {
    // Basic Supply Chest contract: the OneBlock sometimes turns into a loot chest instead of a block.
    chest = true;
  }
  if (chest) id = "minecraft:chest";
  try { b.setType(id); } catch (e) {
    chest = false; bonus = false; core.jackpot = false;
    try { b.setType("minecraft:dirt"); } catch (e2) { return false; }
  }
  if (chest) { try { fillOneBlockChest(b, d, bonus); } catch (e) { console.warn("[SovereignMarket] oneblock chest: " + e); } }
  if (core.jackpot && player) { try { player.onScreenDisplay.setActionBar("\u00a76JACKPOT block! Break it for coins."); } catch (e) { /* ignore */ } }
  core.armed = true;
  core.pending = false;
  return true;
}

// Fills a chest-shaped OneBlock. Bonus chests roll the loot of every contract the player's licenses allow.
function fillOneBlockChest(block, d, bonus) {
  let entries, rolls;
  if (bonus) {
    entries = CONTRACTS.flatMap((c) => c.loot).filter((x) => hasLic(d, x[4]) && BlockOrItemOk(x[0]));
    rolls = rnd(6, 8);
  } else {
    const C = CONTRACTS.find((c) => c.id === "basic");
    const lvl = (d.up && d.up.basic) || 1;
    entries = C.loot.filter((x) => hasLic(d, x[4]) && BlockOrItemOk(x[0]));
    rolls = rnd(C.rolls[0] + lvl - 1, C.rolls[1] + lvl - 1);
  }
  const cont = block.getComponent("minecraft:inventory")?.container;
  if (!cont || !entries.length) return;
  const total = entries.reduce((sum, e) => sum + e[1], 0);
  for (let r = 0; r < rolls; r++) {
    let pick = Math.random() * total, e = entries[0];
    for (const c of entries) { pick -= c[1]; if (pick < 0) { e = c; break; } }
    const slot = rnd(0, cont.size - 1);
    if (cont.getItem(slot)) continue;
    cont.setItem(slot, new ItemStack(full(e[0]), rnd(e[2], e[3])));
  }
}

// Recovery: re-arm after reloads, regenerate if the core vanished (only once a player finished setup).
export function coreWatch() {
  const ready = world.getAllPlayers().some((p) => p.hasTag("void_cleaned") && p.dimension.id === "minecraft:overworld");
  if (!ready) return;
  const b = dimOf().getBlock(CORE);
  if (!b) return;
  if (!b.isAir) { core.armed = true; core.pending = false; return; }
  if (!core.pending) {
    core.pending = true;
    system.run(() => {
      let ok = false;
      try { ok = regenerate(null); } catch (e) { console.warn("[SovereignMarket] regenerate: " + e); }
      if (!ok) core.pending = false;
    });
  }
}


// ---- Auto-Miner (permanent levels, 2 minutes per Minecraft day) ----
const currentDay = () => world.getDay();

// Cached record: undefined = not loaded yet, null = not owned. The per-tick check reads only this variable.
let autoCache;
function autoState() {
  if (autoCache === undefined) {
    const a = loadWorld().autoMine;
    autoCache = a && a.lvl ? a : null;
  }
  return autoCache;
}
function persistAuto() {
  const w = loadWorld();
  w.autoMine = autoCache || null;
  saveWorld(w);
}
function rolloverAuto(a) {
  const day = currentDay();
  if (a.day === day) return;
  a.day = day; a.used = 0; a.msg = false; a.full = false;
  persistAuto();
}

export function autoStatus() {
  const a = autoState();
  if (a) rolloverAuto(a);
  const level = a ? a.lvl : 0;
  const used = a ? a.used || 0 : 0;
  return {
    level,
    on: !!a && a.on !== false,
    step: level ? AUTO_LEVELS[level - 1].step : 0,
    next: AUTO_LEVELS[level] || null,
    leftSecs: Math.ceil(Math.max(0, AUTO_DAILY_TICKS - used) / 20),
  };
}

export function buyAutoLevel(p) {
  const a = autoState();
  const level = a ? a.lvl : 0;
  const nxt = AUTO_LEVELS[level];
  if (!nxt) return { ok: false, msg: "The Auto-Miner is already at the maximum level." };
  const d = loadPlayer(p);
  if (!spend(d, nxt.cost)) return { ok: false, msg: "Not enough " + CURRENCY + ". You need " + nxt.cost + ", you have " + d.coins + "." };
  autoCache = { lvl: level + 1, on: a ? a.on !== false : true, day: a ? a.day : currentDay(), used: a ? a.used || 0 : 0, msg: a ? !!a.msg : false, full: false };
  log(d, "Bought Auto-Miner Lv" + (level + 1) + " for " + nxt.cost);
  savePlayer(p, d);
  persistAuto();
  return { ok: true, msg: "Auto-Miner Lv" + (level + 1) + " ready: it breaks the OneBlock every " + nxt.step + " tick" + (nxt.step === 1 ? "" : "s") + ", about 2 minutes per Minecraft day. Balance: " + d.coins + " " + CURRENCY };
}

export function toggleAuto(p) {
  const a = autoState();
  if (!a) return { ok: false, msg: "You do not own the Auto-Miner yet." };
  a.on = a.on === false;
  persistAuto();
  if (a.on) {
    // Break the OneBlock right away so the player sees it start.
    rolloverAuto(a);
    // The instant break uses the same daily time as a normal break, so toggling cannot give free breaks.
    if ((a.used || 0) < AUTO_DAILY_TICKS) {
      let broke = false;
      try { broke = mineOnce(p, a, true); } catch (e) { /* ignore */ }
      if (broke) {
        a.used = Math.min(AUTO_DAILY_TICKS, (a.used || 0) + AUTO_LEVELS[a.lvl - 1].step);
        persistAuto();
      }
    }
  }
  return { ok: true, msg: "Auto-Miner is now " + (a.on ? "ON" : "OFF") + "." };
}

const AUTO_DROPS = {
  "minecraft:grass_block": "minecraft:dirt", "minecraft:coal_ore": "minecraft:coal", "minecraft:deepslate_coal_ore": "minecraft:coal",
  "minecraft:copper_ore": "minecraft:raw_copper", "minecraft:deepslate_copper_ore": "minecraft:raw_copper",
  "minecraft:iron_ore": "minecraft:raw_iron", "minecraft:deepslate_iron_ore": "minecraft:raw_iron",
  "minecraft:gold_ore": "minecraft:raw_gold", "minecraft:deepslate_gold_ore": "minecraft:raw_gold",
  "minecraft:redstone_ore": "minecraft:redstone", "minecraft:deepslate_redstone_ore": "minecraft:redstone",
  "minecraft:lapis_ore": "minecraft:lapis_lazuli", "minecraft:deepslate_lapis_ore": "minecraft:lapis_lazuli",
  "minecraft:diamond_ore": "minecraft:diamond", "minecraft:deepslate_diamond_ore": "minecraft:diamond",
  "minecraft:emerald_ore": "minecraft:emerald", "minecraft:deepslate_emerald_ore": "minecraft:emerald",
  "minecraft:quartz_ore": "minecraft:quartz", "minecraft:glowstone": "minecraft:glowstone_dust",
  "minecraft:stone": "minecraft:cobblestone", "minecraft:deepslate": "minecraft:cobbled_deepslate", "minecraft:clay": "minecraft:clay_ball",
  "minecraft:melon_block": "minecraft:melon_slice", "minecraft:nether_gold_ore": "minecraft:gold_nugget", "minecraft:mycelium": "minecraft:dirt",
  "minecraft:red_mushroom_block": "minecraft:red_mushroom", "minecraft:brown_mushroom_block": "minecraft:brown_mushroom"
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

// Moves everything from a chest-shaped OneBlock into the collection chest. False if the collection chest is full.
function moveChestLoot(coreBlock, dest) {
  const inv = coreBlock.getComponent("minecraft:inventory")?.container;
  if (!inv) return true;
  for (let i = 0; i < inv.size; i++) {
    const it = inv.getItem(i);
    if (!it) continue;
    const left = dest.addItem(it);
    inv.setItem(i, left);
    if (left) return false;
  }
  return true;
}

// Break animation: a real "destroy" setblock plays the crack particles and sound. Its item drops are removed,
// because what the OneBlock held was already stored in the collection chest.
function breakEffect(dim) {
  try { dim.runCommand("setblock " + CORE.x + " " + CORE.y + " " + CORE.z + " air destroy"); } catch (e) { return; }
  const sweep = () => {
    try {
      for (const e of dim.getEntities({ type: "minecraft:item", location: { x: CORE.x + 0.5, y: CORE.y + 0.5, z: CORE.z + 0.5 }, maxDistance: 1.5 })) e.remove();
    } catch (e) { /* ignore */ }
  };
  sweep();
  system.run(sweep);
}

function mineOnce(player, a, fx) {
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
  const stored = coreBlock.typeId === "minecraft:chest" ? moveChestLoot(coreBlock, container) : storeAutoDrop(container, coreBlock.typeId);
  if (!stored) {
    if (!a.full) {
      a.full = true;
      persistAuto();
      try { player.sendMessage("Auto-Miner paused: the collection chest above the OneBlock is full. Empty it to resume."); } catch (e) { /* ignore */ }
    }
    return;
  }
  a.full = false;
  core.armed = false;
  core.pending = true;
  if (fx) breakEffect(dim);
  if (!regenerate(player, true)) { core.pending = false; return false; }
  return true;
}

function announceExhausted(player, a) {
  a.msg = true;
  persistAuto();
  try {
    player.sendMessage("\u00a7cAuto-mining is exhausted. It recharges when the next Minecraft day begins.");
    player.onScreenDisplay.setActionBar("\u00a7cAuto-mining exhausted");
  } catch (e) { /* ignore */ }
}

export function autoMineTick() {
  const a = autoState();
  if (!a || a.on === false) return; // idle: no world read, no player scan
  rolloverAuto(a);
  if ((a.used || 0) >= AUTO_DAILY_TICKS && a.msg) return;
  const player = world.getAllPlayers().find((p) => p.dimension.id === "minecraft:overworld" && p.hasTag("void_cleaned"));
  if (!player) return;
  if ((a.used || 0) >= AUTO_DAILY_TICKS) { announceExhausted(player, a); return; }
  a.used = (a.used || 0) + 1;
  if (a.used % 20 === 0) persistAuto();
  const step = AUTO_LEVELS[a.lvl - 1].step;
  if (a.used % 10 === 1) { try { player.onScreenDisplay.setActionBar("\u00a7bAuto-Miner Lv" + a.lvl + "   " + Math.ceil((AUTO_DAILY_TICKS - a.used) / 20) + "s left"); } catch (e) { /* ignore */ } }
  // Fast levels show the break effect every 4th break so the screen stays readable.
  if (a.used % step === 0) mineOnce(player, a, step >= 4 || a.used % 4 === 0);
  if (a.used >= AUTO_DAILY_TICKS) announceExhausted(player, a);
}

// ---- Wallet ----
// Called for every hand break of the OneBlock. Dirt no longer pays: items are sold at the market.
// Handles the jackpot block and the milestone bonus.
export function onHandBreak(p, typeId) {
  const d = loadPlayer(p);
  d.mined += 1;
  const tier = highestTier(d);
  const notes = [];
  if (core.jackpot && typeId === "minecraft:gold_block") {
    const amt = rnd(JACKPOT_MIN_PER_TIER * tier, JACKPOT_MAX_PER_TIER * tier);
    addCoins(d, amt);
    log(d, "Jackpot block: +" + amt);
    notes.push("\u00a76JACKPOT! +" + amt + " " + CURRENCY);
  }
  if (d.mined % MILESTONE_EVERY === 0) {
    const c = MILESTONE_COINS_PER_TIER * tier;
    addCoins(d, c);
    d.bonus = true;
    log(d, "Milestone " + d.mined + " breaks: +" + c);
    notes.push("\u00a7aMilestone: " + d.mined + " breaks! +" + c + " " + CURRENCY + ". Your next OneBlock is a bonus chest.");
  }
  savePlayer(p, d);
  for (const n of notes) { try { p.sendMessage(n); p.onScreenDisplay.setActionBar(n); } catch (e) { /* ignore */ } }
}

// Has this player finished the mandatory How to Play guide?
export const tutorialDone = (p, d) => !!d.tutDone || (d.ach || []).includes("tutorial") || p.hasTag("tutorial_done");

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
  const before = q.unit;
  addCoins(d, q.total);
  recordSale(w, id, removed);
  const after = quote(w, id, 1).unit;
  log(d, "Sold " + removed + " " + nice(id) + " for " + q.total);
  d.sold = (d.sold || 0) + removed;
  if (d.sold >= 1000) grantAch(p, d, "sell_1000");
  savePlayer(p, d);
  saveWorld(w);
  return { ok: true, msg: "Receipt: sold " + removed + " " + nice(id) + " for " + q.total + " " + CURRENCY + ".\nMarket price: " + Math.round(before * 10) / 10 + " -> " + Math.round(after * 10) / 10 + " each.\nBalance: " + d.coins + " " + CURRENCY };
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
  // Every block of the new border must be loaded, or the ring would be drawn only in part after the coins are taken.
  for (let i = N.min; i <= N.max; i++) {
    if (![[i, N.min], [i, N.max], [N.min, i], [N.max, i]].every(([x, z]) => dim.getBlock({ x, y: FLOOR_Y, z }))) return { ok: false, msg: "The new area is not loaded. Stand near the OneBlock and try again. Nothing was charged." };
  }
  // Only the border is drawn: the old border is removed and a new ring is placed on the edge of the new area.
  // Nothing inside the area is filled, so players build their own land.
  const edges = (L) => [[L.min, L.min, L.max, L.min], [L.min, L.max, L.max, L.max], [L.min, L.min + 1, L.min, L.max - 1], [L.max, L.min + 1, L.max, L.max - 1]];
  for (const [x1, z1, x2, z2] of edges(O)) {
    try { dim.runCommand("fill " + x1 + " " + FLOOR_Y + " " + z1 + " " + x2 + " " + FLOOR_Y + " " + z2 + " air replace " + BORDER_BLOCK); } catch (e) { /* no old border here */ }
  }
  for (const [x1, z1, x2, z2] of edges(N)) {
    for (const under of ["air", "grass_block"]) {
      try { dim.runCommand("fill " + x1 + " " + FLOOR_Y + " " + z1 + " " + x2 + " " + FLOOR_Y + " " + z2 + " " + BORDER_BLOCK + " replace " + under); } catch (e) { /* nothing to replace */ }
    }
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
      if (!C || id === "basic") continue; // Basic Supply Chest lives inside the OneBlock pool, not on a timer
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
// Works in stripes of 32 rows so every fill stays under the fill command's 32,768 block cap on any island size.
export function sweepLiquids() {
  const L = ISLAND_LEVELS[islandLevel()];
  const dim = dimOf();
  for (const f of ["flowing_water", "water", "flowing_lava", "lava"]) {
    for (let z = L.min; z <= L.max; z += 32) {
      const z2 = Math.min(L.max, z + 31);
      try { dim.runCommand("fill " + L.min + " 0 " + z + " " + L.max + " 4 " + z2 + " air replace " + f); } catch (e) { /* none found */ }
    }
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
