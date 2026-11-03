import { world, system, ItemStack, EquipmentSlot, EnchantmentTypes, EntityComponentTypes, GameMode } from "@minecraft/server";

const STORAGE_KEY = "allenscreations:phase_team_inventory_v1";
const KEEP_KEY = "allenscreations:phase_team_keep";
const SCAN_INTERVAL = 2;
const MAX_STORED = 30000;
const INV_SLOTS = 36;
const ENDER_SLOTS = 27;
const SLOT_COUNT = INV_SLOTS + ENDER_SLOTS;
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, EquipmentSlot.Offhand];

let master = null;
let initialized = false;
let syncing = false;
let busy = false;
let warnedSize = false;
let rulesChecked = false;
let lastErrorTick = -200;
const snapshots = new Map();
const pendingDeath = new Set();
const applyFails = new Map();

function safe(fn, fallback = undefined) { try { return fn(); } catch { return fallback; } }
function withSync(fn) { syncing = true; try { fn(); } finally { syncing = false; } }
function isCreative(player) { return safe(() => player.getGameMode() === GameMode.Creative, false); }
function eligible(player) {
  if (!safe(() => player.isValid, false) || isCreative(player)) return false;
  if (safe(() => player.getGameMode() === GameMode.Spectator, false)) return false;
  return safe(() => player.getComponent(EntityComponentTypes.Health)?.currentValue > 0, true);
}
function playersSharing() { return world.getAllPlayers().filter(eligible); }
function inventoryOf(player) { return safe(() => player.getComponent(EntityComponentTypes.Inventory)?.container); }
function enderOf(player) { return safe(() => player.getComponent("minecraft:ender_inventory")?.container); }
function equipmentOf(player) { return safe(() => player.getComponent("minecraft:equippable")); }
function clone(item) { return item ? safe(() => item.clone()) : undefined; }
function visible(item) { return item ? clone(item) : undefined; }
function damageOf(item) { return safe(() => item.getComponent("minecraft:durability")?.damage, 0) ?? 0; }

function serializeItem(item) {
  if (!item) return null;
  const out = { id: item.typeId, amount: item.amount };
  safe(() => { if (item.nameTag) out.nameTag = item.nameTag; });
  safe(() => { const lore = item.getLore(); if (lore?.length) out.lore = lore; });
  safe(() => { const d = item.getComponent("minecraft:durability"); if (d) out.damage = d.damage; });
  safe(() => {
    const c = item.getComponent("minecraft:enchantable");
    if (c) { const list = c.getEnchantments(); if (list.length) out.enchants = list.map(e => ({ id: e.type.id, level: e.level })); }
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
    return item;
  });
}
function sameItem(a, b) {
  if (!a || !b) return !a && !b;
  if (a.typeId !== b.typeId || a.amount !== b.amount) return false;
  return JSON.stringify(serializeItem(a)) === JSON.stringify(serializeItem(b));
}
function identityKey(item) { const s = serializeItem(item); delete s.amount; delete s.damage; return JSON.stringify(s); }
function isDelta(prev, cur) { return !!prev && !!cur && prev.typeId === cur.typeId && identityKey(prev) === identityKey(cur); }
function applyDeltas(base, deltas) {
  const item = clone(base); if (!item) return undefined;
  let amount = item.amount, damage = damageOf(item);
  for (const d of deltas) { amount += d.amount; damage += d.damage; }
  amount = Math.min(Math.max(amount, 0), item.maxAmount);
  if (amount < 1) return undefined;
  item.amount = amount;
  const durability = safe(() => item.getComponent("minecraft:durability"));
  if (durability) { if (damage >= durability.maxDurability) return undefined; durability.damage = Math.max(damage, 0); }
  return item;
}
function emptyState() {
  return { slots: Array(SLOT_COUNT).fill(undefined), equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, undefined])) };
}
function readPlayer(player) {
  const inv = inventoryOf(player); if (!inv) return null;
  const ender = enderOf(player); const eq = equipmentOf(player);
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => visible(safe(() => i < INV_SLOTS ? inv.getItem(i) : ender?.getItem(i - INV_SLOTS))));
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = visible(safe(() => eq?.getEquipment(slot)));
  return { slots, equipment };
}
function serializeState(state) {
  return { slots: state.slots.map(serializeItem), equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, serializeItem(state.equipment[s])])) };
}
function deserializeState(data) {
  if (!data || !Array.isArray(data.slots) || (data.slots.length !== SLOT_COUNT && data.slots.length !== INV_SLOTS)) return null;
  return {
    slots: Array.from({ length: SLOT_COUNT }, (_, i) => deserializeItem(data.slots[i] ?? null)),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, deserializeItem(data.equipment?.[s] ?? null)]))
  };
}
function persist() {
  if (!master) return;
  const json = JSON.stringify(serializeState(master));
  if (json.length > MAX_STORED) {
    safe(() => world.setDynamicProperty(STORAGE_KEY, undefined));
    if (!warnedSize) { warnedSize = true; safe(() => world.sendMessage("§e[Team Inventory] Shared inventory is too large to persist. Free some inventory space.")); }
    return;
  }
  warnedSize = false;
  safe(() => world.setDynamicProperty(STORAGE_KEY, json));
}
function loadPersisted() {
  const raw = safe(() => world.getDynamicProperty(STORAGE_KEY));
  if (typeof raw !== "string" || !raw) return null;
  return safe(() => deserializeState(JSON.parse(raw)), null);
}
function stateDiff(a, b) {
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) if (!sameItem(a.slots[i], b.slots[i])) slots.push(i);
  const equipment = EQUIPMENT_SLOTS.filter(s => !sameItem(a.equipment[s], b.equipment[s]));
  return { slots, equipment };
}
function writeState(player, state) {
  const inv = inventoryOf(player); if (!inv) return;
  const ender = enderOf(player); const eq = equipmentOf(player);
  for (let i = 0; i < SLOT_COUNT; i++) {
    const box = i < INV_SLOTS ? inv : ender; const at = i < INV_SLOTS ? i : i - INV_SLOTS;
    if (!box) continue;
    const live = safe(() => box.getItem(at));
    if (!sameItem(visible(live), state.slots[i])) safe(() => box.setItem(at, clone(state.slots[i])));
  }
  for (const slot of EQUIPMENT_SLOTS) {
    const live = safe(() => eq?.getEquipment(slot));
    if (!sameItem(visible(live), state.equipment[slot])) safe(() => eq?.setEquipment(slot, clone(state.equipment[slot])));
  }
}
function applyState(player) {
  if (!master || !inventoryOf(player)) return;
  writeState(player, master);
  const read = readPlayer(player); const diff = read ? stateDiff(master, read) : null;
  const fails = applyFails.get(player.id) ?? 0;
  if (diff && !diff.slots.length && !diff.equipment.length) { applyFails.delete(player.id); snapshots.set(player.id, read); }
  else if (fails >= 10) { applyFails.delete(player.id); if (read) snapshots.set(player.id, read); }
  else { applyFails.set(player.id, fails + 1); snapshots.delete(player.id); }
}
function spawnAt(dimension, item, location) {
  if (!item) return false;
  return !!safe(() => { dimension.spawnItem(clone(item), location); return true; }, false);
}
function spawnSafely(player, item) { return spawnAt(player.dimension, item, player.location); }
function slotName(i) { return i >= INV_SLOTS ? `Ender Chest slot ${i - INV_SLOTS + 1}` : i < 9 ? `hotbar ${i + 1}` : `inventory slot ${i + 1}`; }
function warnConflict(player, name) { safe(() => player.sendMessage(`§e[Team Inventory] Conflict in ${name}; the extra item was dropped at your feet.`)); }
function mergeInto(state, player) {
  const read = readPlayer(player); if (!read) return;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const item = read.slots[i]; if (!item) continue;
    if (!state.slots[i]) state.slots[i] = clone(item);
    else {
      let placed = false;
      for (let j = i < INV_SLOTS ? 0 : INV_SLOTS; j < (i < INV_SLOTS ? INV_SLOTS : SLOT_COUNT); j++) {
        if (!state.slots[j]) { state.slots[j] = clone(item); placed = true; break; }
      }
      if (!placed) spawnSafely(player, item);
    }
  }
  for (const slot of EQUIPMENT_SLOTS) {
    const item = read.equipment[slot]; if (!item) continue;
    if (!state.equipment[slot]) state.equipment[slot] = clone(item);
    else {
      const free = state.slots.findIndex((v, i) => i < INV_SLOTS && !v);
      if (free >= 0) state.slots[free] = clone(item); else spawnSafely(player, item);
    }
  }
}
function adoptLive(state, online) {
  for (const p of online) {
    const read = readPlayer(p); if (!read) continue;
    read.slots.forEach((item, i) => { if (item && state.slots[i] && sameItem(state.slots[i], item)) state.slots[i] = item; });
    for (const slot of EQUIPMENT_SLOTS) { const item = read.equipment[slot]; if (item && state.equipment[slot] && sameItem(state.equipment[slot], item)) state.equipment[slot] = item; }
  }
}
function resolveGroup(base, entries) {
  const deltas = [], replacements = [];
  for (const e of entries) {
    if (isDelta(e.prev, e.cur)) deltas.push({ amount: e.cur.amount - e.prev.amount, damage: damageOf(e.cur) - damageOf(e.prev) });
    else replacements.push(e);
  }
  if (!replacements.length) return { item: applyDeltas(base, deltas), losers: [] };
  const winner = replacements[0];
  return { item: clone(winner.cur), losers: replacements.slice(1).filter(e => e.cur && !sameItem(winner.cur, e.cur)) };
}
function applyChanges(detected) {
  const groups = new Map();
  const add = (key, entry) => { if (!groups.has(key)) groups.set(key, []); groups.get(key).push(entry); };
  for (const { player, current, previous } of detected) {
    const d = stateDiff(previous, current);
    for (const i of d.slots) add(`s${i}`, { player, prev: previous.slots[i], cur: current.slots[i] });
    for (const slot of d.equipment) add(`e${slot}`, { player, prev: previous.equipment[slot], cur: current.equipment[slot] });
  }
  for (const [key, entries] of groups) {
    const isSlot = key[0] === "s", id = key.slice(1);
    const base = isSlot ? master.slots[Number(id)] : master.equipment[id];
    const { item, losers } = resolveGroup(base, entries);
    for (const e of losers) { spawnSafely(e.player, e.cur); warnConflict(e.player, isSlot ? slotName(Number(id)) : id); }
    if (isSlot) master.slots[Number(id)] = item; else master.equipment[id] = item;
  }
  if (groups.size) { withSync(() => { for (const p of playersSharing()) applyState(p); }); persist(); }
}
function initialize(online) {
  master = loadPersisted();
  if (master) adoptLive(master, online);
  else { master = emptyState(); for (const p of online) mergeInto(master, p); }
  persist(); initialized = true;
  withSync(() => { for (const p of online) applyState(p); });
  world.sendMessage("§a[Team Inventory] Automatic shared inventory is active.");
}
function applyKeepInventory() {
  const prev = safe(() => world.gameRules.keepInventory);
  if (typeof prev === "boolean" && safe(() => world.getDynamicProperty(KEEP_KEY)) === undefined) safe(() => world.setDynamicProperty(KEEP_KEY, prev ? "1" : "0"));
  safe(() => { world.gameRules.keepInventory = true; });
}
function syncTick() {
  if (syncing || busy) return;
  busy = true;
  try {
    if (!rulesChecked) { rulesChecked = true; applyKeepInventory(); }
    const online = playersSharing(); if (!online.length) return;
    if (!initialized) { initialize(online); return; }
    for (const p of online) if (!snapshots.has(p.id)) withSync(() => applyState(p));
    const detected = [];
    for (const p of online) {
      const previous = snapshots.get(p.id), current = readPlayer(p);
      if (!previous || !current) continue;
      const diff = stateDiff(previous, current);
      if (diff.slots.length || diff.equipment.length) detected.push({ player: p, current, previous });
    }
    if (detected.length) applyChanges(detected);
  } finally { busy = false; }
}

world.afterEvents.playerSpawn.subscribe(event => {
  snapshots.delete(event.player.id); applyFails.delete(event.player.id);
  if (event.initialSpawn !== false) system.run(() => safe(() => event.player.sendMessage("§a[Team Inventory] §fSyncing shared inventory...")));
});
world.beforeEvents.playerLeave.subscribe(event => { snapshots.delete(event.player.id); applyFails.delete(event.player.id); });
world.afterEvents.entityDie.subscribe(event => {
  const dead = event.deadEntity;
  if (dead.typeId !== "minecraft:player" || !master || isCreative(dead) || pendingDeath.has(dead.id)) return;
  pendingDeath.add(dead.id);
  const stacks = [...master.slots.slice(0, INV_SLOTS), ...EQUIPMENT_SLOTS.map(s => master.equipment[s])].filter(Boolean);
  const location = { x: dead.location.x, y: dead.location.y + 0.5, z: dead.location.z };
  withSync(() => {
    for (const item of stacks) spawnAt(dead.dimension, item, location);
    for (let i = 0; i < INV_SLOTS; i++) master.slots[i] = undefined;
    for (const slot of EQUIPMENT_SLOTS) master.equipment[slot] = undefined;
    for (const p of playersSharing()) applyState(p);
    persist();
  });
  system.runTimeout(() => pendingDeath.delete(dead.id), 40);
});

system.runInterval(() => {
  try { syncTick(); }
  catch {
    syncing = false;
    if (system.currentTick - lastErrorTick >= 200) {
      lastErrorTick = system.currentTick;
      safe(() => world.sendMessage("§c[Team Inventory] Sync paused for this check after an internal error."));
    }
  }
}, SCAN_INTERVAL);
