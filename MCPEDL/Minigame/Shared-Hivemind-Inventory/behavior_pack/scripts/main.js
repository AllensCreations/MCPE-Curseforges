import { world, system, ItemStack, EquipmentSlot, EnchantmentTypes, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { hardTick, hardReset, hardKillAll } from "./hard_mode.js";
import { createLayout } from "./layout.js";
import { registerController, openController } from "./controller.js";

const NAMESPACE = "allenscreations";
const CONTROLLER_ID = `${NAMESPACE}:controller`;
const LEGACY_SETTINGS_ID = `${NAMESPACE}:team_settings`;
const STATE_KEY = "game_state";
const STORAGE_KEY = "allenscreations:hivemind_v106";
const MEMBERS_KEY = "allenscreations:team_members";
const CLEAR_KEY = "allenscreations:team_clear";
const KEEP_KEY = "allenscreations:team_keep";
const SHARE_PREFIX = "allenscreations:team_share_";
const HARD_KEY = "allenscreations:hard_mode";
const HARD_HEALTH_KEY = "allenscreations:hard_health";
const HARD_HUNGER_KEY = "allenscreations:hard_hunger";
const NAMES_KEY = "allenscreations:team_names";
const LAYOUT_KEY = "allenscreations:layout";
const TITLE = "§l§bALN§dStudios §6Controller";
const GAME_INFO = "Everyone shares one inventory. Use this menu before Start to choose the mode and layout. Hard Health and Hard Hunger only apply in Hard mode.";
const HOW_TO_PLAY = "Use the Controller and choose Start. After a short countdown, everyone's main inventory, armor, offhand and Ender Chest items are combined into one shared inventory, and anything one player picks up, uses or drops changes it for the whole team.\n\nPlayers who join while a game runs add their own items to the team.\n\nBefore Start, use the Controller menu to choose Normal or Hard mode and a Shared or Personal layout. Its Team button lists who is on the team.\n\nIf anyone dies, the whole shared inventory drops once and is emptied for the team. The Ender Chest is kept. Creative and Spectator players are not part of it.\n\nWith Personal layout, each player arranges their own inventory and hotbar while the items stay shared.\n\nIn Hard mode, health and hunger are shared too, and you can turn either one off in the Controller menu. If one player dies, everyone dies.\n\nThe host or an operator ends the game with the End Game button or the function end_game. The shared items are then divided between the players, and anyone offline gets their share when they join again, so nothing is duplicated.";
const OPERATOR_LEVEL = 2;
const MAX_STORED = 30000;
const MAX_CHUNKS = 4;
const MAX_APPLY_RETRIES = 10;
const ERROR_COOLDOWN = 200;
const INV_SLOTS = 36;
const ENDER_SLOTS = 27;
const SLOT_COUNT = INV_SLOTS + ENDER_SLOTS;
const SAFETY_SCAN = 5;
const START_COUNTDOWN = 5;
const PERSONAL_SCAN = 4;
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, EquipmentSlot.Offhand];

let master = null;
let syncing = false;
let initialized = false;
let tickBusy = false;
let warnedSize = false;
let warnedNear = false;
let needMerge = false;
let rulesChecked = false;
let counting = false;
let countdownId = 0;
let hardMsgLock = false;
let chunked = 0;
let lastErrorTick = -ERROR_COOLDOWN;
const snapshots = new Map();
const pendingDeath = new Map();
const lastSeen = new Map();
const joinMerge = new Set();
const applyFails = new Map();
const knownMembers = new Set();
const dirty = new Set();

function safe(fn, fallback = undefined) { try { return fn(); } catch { return fallback; } }
function withSync(fn) {
  syncing = true;
  try { fn(); } finally { syncing = false; }
}
const getState = () => {
  const v = world.getDynamicProperty(STATE_KEY);
  return typeof v === "string" ? v : "idle";
};
const setState = (s) => world.setDynamicProperty(STATE_KEY, s);
const isRunning = () => safe(getState, "idle") === "running";
const isCreative = (player) => safe(() => player.getGameMode() === GameMode.Creative, false);
const isHost = (player) => safe(() => (typeof player.isOp === "function" ? player.isOp() : player.playerPermissionLevel === OPERATOR_LEVEL), false);
const containerOf = (player) => safe(() => player.getComponent(EntityComponentTypes.Inventory)?.container);
const enderOf = (player) => safe(() => player.getComponent("minecraft:ender_inventory")?.container);
const isHard = () => safe(() => world.getDynamicProperty(HARD_KEY) === "1", false);
const isPersonal = () => safe(() => world.getDynamicProperty(LAYOUT_KEY) === "personal", false);
const isHardHealth = () => safe(() => world.getDynamicProperty(HARD_HEALTH_KEY) !== "0", true);
const isHardHunger = () => safe(() => world.getDynamicProperty(HARD_HUNGER_KEY) !== "0", true);
const isHostItem = (item) => item.typeId === CONTROLLER_ID || item.typeId === LEGACY_SETTINGS_ID;
function equipmentOf(player) { return safe(() => player.getComponent("minecraft:equippable")); }
function clone(item) { return item ? safe(() => item.clone(), undefined) : undefined; }
function isAlive(player) {
  if (!safe(() => player.isValid, false)) return false;
  return safe(() => player.getComponent("minecraft:health")?.currentValue > 0, true);
}
function shares(player) {
  return isAlive(player) && !isCreative(player) && safe(() => player.getGameMode() !== GameMode.Spectator, true);
}
function sharingPlayers() { return world.getAllPlayers().filter(shares); }

function loadSet(key) {
  const raw = safe(() => world.getDynamicProperty(key));
  const list = typeof raw === "string" ? safe(() => JSON.parse(raw), []) : [];
  return new Set(Array.isArray(list) ? list : []);
}
function saveSet(key, set) {
  safe(() => world.setDynamicProperty(key, set.size ? JSON.stringify([...set]) : undefined));
}

function serializeItem(item) {
  if (!item) return null;
  const out = { id: item.typeId, amount: item.amount };
  safe(() => { if (item.nameTag) out.nameTag = item.nameTag; });
  safe(() => { const lore = item.getLore(); if (lore?.length) out.lore = lore; });
  safe(() => { const d = item.getComponent("minecraft:durability"); if (d) out.damage = d.damage; });
  safe(() => {
    const c = item.getComponent("minecraft:dyeable")?.color;
    if (c) out.color = { red: c.red, green: c.green, blue: c.blue };
  });
  safe(() => { if (item.lockMode && item.lockMode !== "none") out.lock = item.lockMode; });
  safe(() => { if (item.keepOnDeath) out.keep = true; });
  safe(() => { const on = item.getCanPlaceOn(); if (on?.length) out.placeOn = on; });
  safe(() => { const off = item.getCanDestroy(); if (off?.length) out.destroy = off; });
  safe(() => {
    const c = item.getComponent("minecraft:enchantable");
    if (c) {
      const list = c.getEnchantments();
      if (list.length) out.enchants = list.map(e => ({ id: e.type.id, level: e.level }));
    }
  });
  return out;
}
function deserializeItem(data) {
  if (!data?.id || !Number.isInteger(data.amount) || data.amount < 1) return undefined;
  return safe(() => {
    const item = new ItemStack(data.id, data.amount);
    if (data.nameTag) item.nameTag = data.nameTag;
    if (data.lore) safe(() => item.setLore(data.lore));
    if (Number.isFinite(data.damage)) safe(() => { const d = item.getComponent("minecraft:durability"); if (d) d.damage = data.damage; });
    if (data.enchants?.length) safe(() => {
      const c = item.getComponent("minecraft:enchantable");
      if (c) c.addEnchantments(data.enchants.map(e => ({ type: EnchantmentTypes.get(e.id), level: e.level })).filter(e => e.type));
    });
    safe(() => { if (data.color) { const c = item.getComponent("minecraft:dyeable"); if (c) c.color = data.color; } });
    safe(() => { if (data.lock) item.lockMode = data.lock; });
    safe(() => { if (data.keep) item.keepOnDeath = true; });
    safe(() => { if (data.placeOn?.length) item.setCanPlaceOn(data.placeOn); });
    safe(() => { if (data.destroy?.length) item.setCanDestroy(data.destroy); });
    return item;
  });
}
const signatures = new WeakMap();
function signatureOf(item) {
  let s = signatures.get(item);
  if (s === undefined) {
    const data = serializeItem(item);
    delete data.amount;
    s = JSON.stringify(data);
    signatures.set(item, s);
  }
  return s;
}
function sameItem(a, b) {
  if (!a || !b) return !a && !b;
  if (a.typeId !== b.typeId || a.amount !== b.amount) return false;
  return signatureOf(a) === signatureOf(b);
}
function identityKey(item) {
  const s = serializeItem(item);
  delete s.amount;
  delete s.damage;
  return JSON.stringify(s);
}
function damageOf(item) { return safe(() => item.getComponent("minecraft:durability")?.damage, 0) ?? 0; }
function isDelta(prev, cur) {
  return !!prev && !!cur && prev.typeId === cur.typeId && identityKey(prev) === identityKey(cur);
}
function applyDeltas(base, deltas) {
  const item = clone(base);
  if (!item) return undefined;
  let amount = item.amount;
  let damage = damageOf(item);
  for (const d of deltas) {
    amount += d.amount;
    damage += d.damage;
  }
  amount = Math.min(Math.max(amount, 0), item.maxAmount);
  if (amount < 1) return undefined;
  item.amount = amount;
  const dur = safe(() => item.getComponent("minecraft:durability"));
  if (dur) {
    if (damage >= dur.maxDurability) return undefined;
    dur.damage = Math.max(damage, 0);
  }
  return item;
}
function visible(item) { return item && !isHostItem(item) ? clone(item) : undefined; }
function readPlayer(player) {
  const c = containerOf(player);
  if (!c) return null;
  const e = enderOf(player);
  const personal = isPersonal();
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => visible(safe(() => (i < INV_SLOTS ? (personal ? undefined : c.getItem(i)) : e?.getItem(i - INV_SLOTS)))));
  const eq = equipmentOf(player);
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = visible(safe(() => eq?.getEquipment(slot)));
  return { slots, equipment };
}
function serializeState(state) {
  return {
    slots: state.slots.map(serializeItem),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, serializeItem(state.equipment[slot])])),
    pool: isPersonal() ? layout.serialize() : undefined
  };
}
function deserializeState(data) {
  if (!data || !Array.isArray(data.slots) || (data.slots.length !== SLOT_COUNT && data.slots.length !== INV_SLOTS)) return null;
  return {
    slots: Array.from({ length: SLOT_COUNT }, (_, i) => deserializeItem(data.slots[i] ?? null)),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, deserializeItem(data.equipment?.[slot] ?? null)])),
    pool: data.pool
  };
}
function persist() {
  if (!master) return;
  const json = JSON.stringify(serializeState(master));
  if (json.length > MAX_STORED * MAX_CHUNKS) {
    safe(() => clearStored());
    if (!warnedSize) {
      warnedSize = true;
      safe(() => world.sendMessage("§e[Team Inventory] The shared inventory is too large to save. It will not persist until it is smaller."));
    }
    return;
  }
  warnedSize = false;
  const limit = MAX_STORED * MAX_CHUNKS;
  if (json.length > limit * 0.8 && !warnedNear) {
    warnedNear = true;
    safe(() => world.sendMessage("§e[Team Inventory] The shared inventory is close to the save limit. Keep it smaller or it will stop saving."));
  } else if (json.length < limit * 0.7) warnedNear = false;
  safe(() => writeStored(json));
}
function loadPersisted() {
  let raw = safe(() => world.getDynamicProperty(STORAGE_KEY));
  if (typeof raw !== "string" || !raw) return null;
  if (raw.startsWith("chunks:")) {
    const parts = Number.parseInt(raw.slice(7), 10);
    if (!Number.isInteger(parts) || parts < 2 || parts > MAX_CHUNKS) return null;
    raw = "";
    for (let i = 0; i < parts; i++) {
      const piece = safe(() => world.getDynamicProperty(`${STORAGE_KEY}:${i}`));
      if (typeof piece !== "string") return null;
      raw += piece;
    }
    chunked = parts;
  }
  return safe(() => deserializeState(JSON.parse(raw)), null);
}
function clearStored() {
  world.setDynamicProperty(STORAGE_KEY, undefined);
  for (let i = 0; i < MAX_CHUNKS; i++) world.setDynamicProperty(`${STORAGE_KEY}:${i}`, undefined);
  chunked = 0;
}
function writeStored(json) {
  const parts = Math.ceil(json.length / MAX_STORED);
  if (parts <= 1) {
    if (chunked) clearStored();
    world.setDynamicProperty(STORAGE_KEY, json);
    return;
  }
  for (let i = 0; i < MAX_CHUNKS; i++) {
    world.setDynamicProperty(`${STORAGE_KEY}:${i}`, i < parts ? json.slice(i * MAX_STORED, (i + 1) * MAX_STORED) : undefined);
  }
  world.setDynamicProperty(STORAGE_KEY, `chunks:${parts}`);
  chunked = parts;
}
function emptyState() {
  return { slots: Array(SLOT_COUNT).fill(undefined), equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, undefined])) };
}
function stateDiff(a, b) {
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) if (!sameItem(a.slots[i], b.slots[i])) slots.push(i);
  const equipment = EQUIPMENT_SLOTS.filter(s => !sameItem(a.equipment[s], b.equipment[s]));
  return { slots, equipment };
}
function writeState(player, state, full = false) {
  const skipInv = isPersonal() && !full;
  const c = containerOf(player);
  const eq = equipmentOf(player);
  if (!c) return;
  const ender = enderOf(player);
  for (let i = 0; i < SLOT_COUNT; i++) {
    const box = i < INV_SLOTS ? c : ender;
    const at = i < INV_SLOTS ? i : i - INV_SLOTS;
    if (!box || (skipInv && i < INV_SLOTS)) continue;
    const live = safe(() => box.getItem(at));
    if (!sameItem(visible(live), state.slots[i])) safe(() => box.setItem(at, clone(state.slots[i])));
  }
  for (const slot of EQUIPMENT_SLOTS) {
    const live = safe(() => eq?.getEquipment(slot));
    if (!sameItem(visible(live), state.equipment[slot])) safe(() => eq?.setEquipment(slot, clone(state.equipment[slot])));
  }
}
function applyState(player, state = master) {
  if (!state || !containerOf(player)) return;
  writeState(player, state);
  const read = readPlayer(player);
  const fails = applyFails.get(player.id) ?? 0;
  const diff = read ? stateDiff(state, read) : null;
  if (diff && !diff.slots.length && !diff.equipment.length) {
    applyFails.delete(player.id);
    snapshots.set(player.id, read);
  } else if (fails >= MAX_APPLY_RETRIES) {
    applyFails.delete(player.id);
    if (read) snapshots.set(player.id, read);
  } else {
    applyFails.set(player.id, fails + 1);
    snapshots.delete(player.id);
  }
}
function slotName(i) { if (i >= INV_SLOTS) return `Ender Chest slot ${i - INV_SLOTS + 1}`; return i < 9 ? `hotbar ${i + 1}` : `inventory slot ${i + 1}`; }
function warnConflict(player, description) {
  safe(() => player.sendMessage(`§e[Team Inventory] Inventory conflict in ${description}; your extra item was dropped at your feet.`));
}
function spawnAt(dimension, item, location) {
  if (!item) return false;
  return !!safe(() => { dimension.spawnItem(clone(item), location); return true; }, false);
}
function spawnSafely(player, item) { return spawnAt(player.dimension, item, player.location); }
const layout = createLayout({ INV_SLOTS, safe, containerOf, visible, serializeItem, deserializeItem });
function inventoryStacks() {
  return isPersonal() ? layout.stacks() : master.slots.slice(0, INV_SLOTS).filter(Boolean);
}
function placeItem(state, item, ender = false) {
  const from = ender ? INV_SLOTS : 0;
  const to = ender ? SLOT_COUNT : INV_SLOTS;
  for (let i = from; i < to; i++) {
    if (!state.slots[i]) {
      state.slots[i] = clone(item);
      return true;
    }
  }
  return false;
}
function mergeInto(state, player) {
  const read = readPlayer(player);
  if (!read) return;
  read.slots.forEach((item, i) => {
    if (!item) return;
    if (!state.slots[i]) state.slots[i] = clone(item);
    else if (!placeItem(state, item, i >= INV_SLOTS)) spawnSafely(player, item);
  });
  for (const slot of EQUIPMENT_SLOTS) {
    const item = read.equipment[slot];
    if (!item) continue;
    if (!state.equipment[slot]) state.equipment[slot] = clone(item);
    else if (!placeItem(state, item)) spawnSafely(player, item);
  }
}
function adoptLive(state, players) {
  for (const p of players) {
    const read = readPlayer(p);
    if (!read) continue;
    read.slots.forEach((item, i) => {
      if (item && state.slots[i] && sameItem(state.slots[i], item)) state.slots[i] = item;
    });
    for (const slot of EQUIPMENT_SLOTS) {
      const item = read.equipment[slot];
      if (item && state.equipment[slot] && sameItem(state.equipment[slot], item)) state.equipment[slot] = item;
    }
  }
}
function resolveGroup(base, entries) {
  const deltas = [];
  const replacements = [];
  for (const e of entries) {
    if (isDelta(e.prev, e.cur)) deltas.push({ amount: e.cur.amount - e.prev.amount, damage: damageOf(e.cur) - damageOf(e.prev) });
    else replacements.push(e);
  }
  if (!replacements.length) return { item: applyDeltas(base, deltas), losers: [] };
  const winner = replacements[0];
  const losers = replacements.slice(1).filter(e => e.cur && !sameItem(winner.cur, e.cur));
  return { item: clone(winner.cur), losers };
}
function applyDetectedChanges(detected) {
  const groups = new Map();
  const add = (key, entry) => {
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  };
  for (const { player, current, previous } of detected) {
    const d = stateDiff(previous, current);
    for (const i of d.slots) add(`s${i}`, { player, prev: previous.slots[i], cur: current.slots[i] });
    for (const slot of d.equipment) add(`e${slot}`, { player, prev: previous.equipment[slot], cur: current.equipment[slot] });
  }
  for (const [key, entries] of groups) {
    const isSlot = key[0] === "s";
    const id = key.slice(1);
    const base = isSlot ? master.slots[Number(id)] : master.equipment[id];
    const { item, losers } = resolveGroup(base, entries);
    for (const e of losers) {
      spawnSafely(e.player, e.cur);
      warnConflict(e.player, isSlot ? slotName(Number(id)) : id);
    }
    if (isSlot) master.slots[Number(id)] = item;
    else master.equipment[id] = item;
  }
  if (groups.size) {
    withSync(() => { for (const p of sharingPlayers()) applyState(p, master); });
    persist();
  }
}
function absorbJoiner(player, players) {
  if (isPersonal()) layout.absorb(player, players);
  else {
    mergeInto(master, player);
    for (const o of players) if (o.id !== player.id) applyState(o, master);
  }
  persist();
  safe(() => player.sendMessage("§a[Team Inventory] §fYour items were added to the team inventory."));
}
function initialize(players) {
  const merge = needMerge;
  needMerge = false;
  const members = loadSet(MEMBERS_KEY);
  const joiners = merge || !members.size ? [] : players.filter(p => !members.has(p.id));
  master = merge ? null : loadPersisted();
  if (master) {
    adoptLive(master, players);
    for (const p of joiners) {
      mergeInto(master, p);
      safe(() => p.sendMessage("§a[Team Inventory] §fYour items were added to the team inventory."));
    }
  }
  else {
    master = emptyState();
    if (merge) for (const p of players) mergeInto(master, p);
    else if (players[0]) mergeInto(master, players[0]);
  }
  if (isPersonal()) {
    layout.prime(players);
    if (merge) layout.build(players);
    else if (master.pool) layout.load(master.pool);
    else layout.build(players.slice(0, 1));
    if (!merge) for (const p of joiners) layout.absorb(p, []);
    for (const p of players) layout.adopt(p);
  }
  persist();
  initialized = true;
  withSync(() => { for (const p of players) applyState(p, master); });
}
function loadNames() {
  const raw = safe(() => world.getDynamicProperty(NAMES_KEY));
  const names = typeof raw === "string" ? safe(() => JSON.parse(raw), {}) : {};
  return names && typeof names === "object" && !Array.isArray(names) ? names : {};
}
function rememberNames(players) {
  const names = loadNames();
  let changed = false;
  for (const p of players) {
    if (names[p.id] !== p.name) {
      names[p.id] = p.name;
      changed = true;
    }
  }
  if (changed) safe(() => world.setDynamicProperty(NAMES_KEY, JSON.stringify(names)));
}
function pruneNames(keep) {
  const names = loadNames();
  const next = {};
  for (const id of keep) if (names[id]) next[id] = names[id];
  safe(() => world.setDynamicProperty(NAMES_KEY, Object.keys(next).length ? JSON.stringify(next) : undefined));
}
function trackMembers(players) {
  const fresh = players.filter(p => !knownMembers.has(p.id));
  if (!fresh.length) return;
  const members = loadSet(MEMBERS_KEY);
  for (const p of fresh) {
    knownMembers.add(p.id);
    members.add(p.id);
  }
  saveSet(MEMBERS_KEY, members);
  rememberNames(fresh);
}
function hasStoredGame() {
  return typeof safe(() => world.getDynamicProperty(STORAGE_KEY)) === "string";
}
function syncTick(full = true) {
  if (syncing || tickBusy) return;
  tickBusy = true;
  try {
    if (counting) return;
    if (!isRunning()) {
      dirty.clear();
      if (initialized || !hasStoredGame()) return;
      safe(() => setState("running"));
    }
    if (!rulesChecked) {
      rulesChecked = true;
      safe(() => { world.gameRules.keepInventory = true; });
    }
    const players = sharingPlayers();
    if (!players.length) return;
    for (const p of players) {
      safe(() => lastSeen.set(p.id, { dimension: p.dimension, location: { x: p.location.x, y: p.location.y, z: p.location.z } }));
    }
    if (system.currentTick % 40 === 0) {
      safe(() => { if (world.gameRules.keepInventory !== true) world.gameRules.keepInventory = true; });
    }
    if (!initialized) {
      initialize(players);
      trackMembers(players);
      return;
    }
    for (const p of players) {
      if (snapshots.has(p.id)) continue;
      if (joinMerge.delete(p.id)) withSync(() => absorbJoiner(p, players));
      withSync(() => applyState(p, master));
    }
    trackMembers(players);
    if (full && isPersonal() && layout.step(players)) persist();
    const detected = [];
    for (const p of players) {
      if (!full && !dirty.has(p.id)) continue;
      const before = snapshots.get(p.id);
      const current = readPlayer(p);
      if (!before || !current) continue;
      const diff = stateDiff(before, current);
      if (diff.slots.length || diff.equipment.length) detected.push({ player: p, current, previous: before });
    }
    dirty.clear();
    if (detected.length) applyDetectedChanges(detected);
  } finally { tickBusy = false; }
}

function applyKeepInventory() {
  const prev = safe(() => world.gameRules.keepInventory);
  if (typeof prev === "boolean" && safe(() => world.getDynamicProperty(KEEP_KEY)) === undefined) {
    safe(() => world.setDynamicProperty(KEEP_KEY, prev ? "1" : "0"));
  }
  safe(() => { world.gameRules.keepInventory = true; });
}
function restoreKeepInventory() {
  const prev = safe(() => world.getDynamicProperty(KEEP_KEY));
  if (prev === undefined) return;
  safe(() => { world.gameRules.keepInventory = prev === "1"; });
  safe(() => world.setDynamicProperty(KEEP_KEY, undefined));
}
function resetSharing() {
  master = null;
  layout.reset();
  initialized = false;
  needMerge = false;
  snapshots.clear();
  applyFails.clear();
  knownMembers.clear();
  safe(() => clearStored());
}

function removeHostItems(player, ids = [CONTROLLER_ID, LEGACY_SETTINGS_ID]) {
  const inv = containerOf(player);
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    const id = inv.getItem(i)?.typeId;
    if (id && ids.includes(id)) inv.setItem(i, undefined);
  }
}

function beginCountdown() {
  const token = ++countdownId;
  counting = true;
  let left = START_COUNTDOWN;
  world.sendMessage(`§a[Team Inventory] Sharing starts in ${left} seconds. Mode: ${isHard() ? "Hard" : "Normal"}, Layout: ${isPersonal() ? "Personal" : "Shared"}.`);
  const step = () => {
    if (token !== countdownId || !isRunning()) return;
    left--;
    if (left <= 0) {
      counting = false;
      startSharing();
      return;
    }
    for (const p of world.getAllPlayers()) safe(() => p.playSound("random.click"));
    world.sendMessage(`§e[Team Inventory] ${left}...`);
    system.runTimeout(step, 20);
  };
  system.runTimeout(step, 20);
}
function startSharing() {
  resetSharing();
  hardReset();
  needMerge = true;
  rulesChecked = true;
  saveSet(MEMBERS_KEY, new Set());
  pruneNames(loadSet(CLEAR_KEY));
  applyKeepInventory();
  world.sendMessage("§a[Team Inventory] Sharing started. Everyone's items are being combined.");
}
function distribute(online, holder, others, shares) {
  const ids = [...online.map(p => p.id), ...others];
  const states = new Map(ids.map(id => [id, emptyState()]));
  let k = 0;
  for (const item of inventoryStacks()) {
    if (!item) continue;
    if (!placeItem(states.get(ids[k % ids.length]), item)) spawnSafely(holder, item);
    k++;
  }
  const held = states.get(holder.id);
  for (let i = INV_SLOTS; i < SLOT_COUNT; i++) held.slots[i] = clone(master.slots[i]);
  for (const slot of EQUIPMENT_SLOTS) held.equipment[slot] = clone(master.equipment[slot]);
  for (const p of online) writeState(p, states.get(p.id), true);
  for (const id of others) shares.set(id, states.get(id));
}
function endGame(source) {
  countdownId++;
  counting = false;
  const online = sharingPlayers();
  const holder = online.find(p => p.id === source?.id && isHost(p)) ?? online.find(isHost) ?? online[0];
  const onlineIds = new Set(online.map(p => p.id));
  const others = [...loadSet(MEMBERS_KEY)].filter(id => !onlineIds.has(id));
  withSync(() => {
    const shares = new Map();
    if (master && holder) distribute(online, holder, others, shares);
    else if (master && isAlive(source)) {
      const stacks = [...inventoryStacks(), ...master.slots.slice(INV_SLOTS), ...EQUIPMENT_SLOTS.map(s => master.equipment[s])].filter(Boolean);
      for (const item of stacks) spawnAt(source.dimension, item, source.location);
    }
    const pending = loadSet(CLEAR_KEY);
    for (const id of others) {
      const state = shares.get(id) ?? emptyState();
      const other = world.getAllPlayers().find(p => p.id === id);
      if (other && isAlive(other)) writeState(other, state, true);
      else {
        saveShare(id, state);
        pending.add(id);
      }
    }
    saveSet(CLEAR_KEY, pending);
  });
  saveSet(MEMBERS_KEY, new Set());
  resetSharing();
  hardReset();
  restoreKeepInventory();
  world.sendMessage(holder ? `§e[Team Inventory] Sharing ended. The shared items were divided between the players, and ${holder.name} holds the armor.` : "§e[Team Inventory] Sharing ended.");
}
function saveShare(id, state) {
  const data = {
    slots: state.slots.map(serializeItem),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, serializeItem(state.equipment[slot])]))
  };
  safe(() => world.setDynamicProperty(SHARE_PREFIX + id, JSON.stringify(data)));
}
function takeShare(id) {
  const raw = safe(() => world.getDynamicProperty(SHARE_PREFIX + id));
  if (typeof raw !== "string") return null;
  safe(() => world.setDynamicProperty(SHARE_PREFIX + id, undefined));
  return safe(() => deserializeState(JSON.parse(raw)), null);
}

function teamText() {
  const all = world.getAllPlayers();
  const sharing = new Set(sharingPlayers().map(p => p.id));
  const names = loadNames();
  const nameOf = (id) => all.find(p => p.id === id)?.name ?? names[id] ?? "Unknown player";
  const lines = [];
  if (isRunning() && !counting) {
    const members = loadSet(MEMBERS_KEY);
    for (const id of sharing) members.add(id);
    lines.push("§aSharing:");
    for (const p of all) if (sharing.has(p.id)) lines.push(`- ${p.name}`);
    const idle = all.filter(p => !sharing.has(p.id));
    if (idle.length) {
      lines.push("§eOnline, not sharing:");
      for (const p of idle) lines.push(`- ${p.name}`);
    }
    const offline = [...members].filter(id => !all.some(p => p.id === id));
    if (offline.length) {
      lines.push("§7Offline team members:");
      for (const id of offline) lines.push(`- ${nameOf(id)}`);
    }
  } else {
    lines.push(counting ? "§7The game is about to start." : "§7No game is running.");
  }
  const waiting = [...loadSet(CLEAR_KEY)].filter(id => typeof safe(() => world.getDynamicProperty(SHARE_PREFIX + id)) === "string");
  if (waiting.length) {
    lines.push("§6Share waiting for:");
    for (const id of waiting) lines.push(`- ${nameOf(id)}`);
  }
  return lines.join("\n");
}

async function showTeam(player) {
  const form = new ActionFormData().title(TITLE).body(teamText()).button("Back");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res.canceled) openController(player);
}

function toggleSetting(player, key, on, off) {
  if (isRunning()) {
    player.sendMessage("Settings can only be changed before Start.");
    return;
  }
  safe(() => world.setDynamicProperty(key, safe(() => world.getDynamicProperty(key)) === on ? off : on));
  system.run(() => openController(player));
}

function controllerExtras() {
  const lock = isRunning() ? " (locked)" : "";
  return [
    { label: `Mode: ${isHard() ? "Hard" : "Normal"}${lock}`, run: p => toggleSetting(p, HARD_KEY, "1", undefined) },
    { label: `Layout: ${isPersonal() ? "Personal" : "Shared"}${lock}`, run: p => toggleSetting(p, LAYOUT_KEY, "personal", undefined) },
    { label: `Hard Health: ${isHardHealth() ? "Shared" : "Separate"}${lock}`, run: p => toggleSetting(p, HARD_HEALTH_KEY, "0", undefined) },
    { label: `Hard Hunger: ${isHardHunger() ? "Shared" : "Separate"}${lock}`, run: p => toggleSetting(p, HARD_HUNGER_KEY, "0", undefined) },
    { label: "Team", run: p => showTeam(p) }
  ];
}

registerController({
  title: TITLE,
  gameInfo: GAME_INFO,
  howToPlay: HOW_TO_PLAY,
  consumeOnStart: true,
  extras: controllerExtras,
  onStart: () => beginCountdown(),
  onEnd: () => endGame()
});

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== CONTROLLER_ID || isHost(source)) return;
  removeHostItems(source);
  source.sendMessage("Only the host or an operator can hold this item.");
});

world.afterEvents.worldLoad.subscribe(() => {
  for (const p of world.getAllPlayers()) if (isHost(p)) removeHostItems(p, [LEGACY_SETTINGS_ID]);
});

function dropSharedInventory(dead) {
  const id = safe(() => dead.id);
  if (id === undefined || pendingDeath.has(id)) return;
  pendingDeath.set(id, true);
  const seen = lastSeen.get(id);
  const dim = safe(() => dead.dimension) ?? seen?.dimension ?? world.getDimension("overworld");
  const at = safe(() => ({ x: dead.location.x, y: dead.location.y, z: dead.location.z })) ?? seen?.location ?? { x: 0, y: 64, z: 0 };
  const loc = { x: at.x, y: at.y + 0.5, z: at.z };
  safe(() => { world.gameRules.keepInventory = true; });
  const stacks = [...inventoryStacks(), ...EQUIPMENT_SLOTS.map(s => master.equipment[s])].filter(Boolean);
  const failed = [];
  withSync(() => {
    for (const item of stacks) if (!spawnAt(dim, item, loc)) failed.push(item);
    const kept = master.slots.slice(INV_SLOTS);
    master = emptyState();
    kept.forEach((item, i) => { master.slots[INV_SLOTS + i] = item; });
    safe(() => containerOf(dead)?.clearAll());
    for (const p of sharingPlayers()) applyState(p, master);
    if (isPersonal()) {
      layout.clear();
      for (const p of sharingPlayers()) layout.adopt(p);
    }
    persist();
  });
  if (failed.length) {
    system.runTimeout(() => {
      for (const item of failed) spawnAt(dim, item, loc);
    }, 2);
  }
  system.runTimeout(() => { pendingDeath.delete(id); lastSeen.delete(id); }, 40);
}
function teamDeath(dead) {
  if (!hardMsgLock) {
    hardMsgLock = true;
    safe(() => world.sendMessage(`§c[Team Inventory] ${dead.name} died, so the whole team dies.`));
    system.runTimeout(() => { hardMsgLock = false; }, 40);
  }
  hardKillAll(sharingPlayers());
}

world.afterEvents.entityDie.subscribe(event => {
  const dead = event.deadEntity;
  if (safe(() => dead.typeId) !== "minecraft:player" || !isRunning() || counting || isCreative(dead)) return;
  if (master) dropSharedInventory(dead);
  if (isHard()) teamDeath(dead);
});

world.beforeEvents.playerLeave.subscribe(event => {
  snapshots.delete(event.player.id);
  applyFails.delete(event.player.id);
  joinMerge.delete(event.player.id);
});

world.afterEvents.playerSpawn.subscribe(event => {
  const player = event.player;
  const pending = loadSet(CLEAR_KEY);
  if (pending.has(player.id)) {
    system.run(() => {
      withSync(() => writeState(player, takeShare(player.id) ?? emptyState(), true));
      pending.delete(player.id);
      saveSet(CLEAR_KEY, pending);
    });
  }
  if (event.initialSpawn !== false) {
    if (isHost(player)) system.run(() => removeHostItems(player, [LEGACY_SETTINGS_ID]));
    else system.run(() => removeHostItems(player));
    if (isRunning() && initialized && !counting && shares(player) && !loadSet(MEMBERS_KEY).has(player.id)) joinMerge.add(player.id);
    if (isRunning()) {
      system.run(() => {
        const result = safe(() => player.runCommand("function team_inventory/join_message"), null);
        if (!result || result.successCount < 1) {
          safe(() => player.sendMessage("§a[Team Inventory] §fSyncing shared inventory..."));
        }
      });
    }
  }
  snapshots.delete(player.id);
  applyFails.delete(player.id);
});

const hasInventoryEvent = typeof world.afterEvents.playerInventoryItemChange?.subscribe === "function";
if (hasInventoryEvent) {
  world.afterEvents.playerInventoryItemChange.subscribe(event => {
    if (isRunning() && !counting) dirty.add(event.player.id);
  });
}

function guardedTick(full) {
  try { syncTick(full); }
  catch {
    syncing = false;
    if (system.currentTick - lastErrorTick >= ERROR_COOLDOWN) {
      lastErrorTick = system.currentTick;
      safe(() => world.sendMessage("§c[Team Inventory] Sync paused for this check after an internal error."));
    }
  }
}

system.runInterval(() => {
  const full = isPersonal() ? system.currentTick % PERSONAL_SCAN === 0 : !hasInventoryEvent || system.currentTick % SAFETY_SCAN === 0;
  if (full || dirty.size) guardedTick(full);
}, 1);

system.runInterval(() => {
  try {
    if (isRunning() && !counting && isHard()) hardTick(sharingPlayers(), { health: isHardHealth(), hunger: isHardHunger() });
    else hardReset();
  } catch {}
}, 1);
