/** Team Inventory v1.0.9 — AllensCreations
 * Shared main inventory, offhand, armor, and selected hotbar slot.
 * Persistent world dynamic property storage; two-tick change detection.
 */
import { world, system, ItemStack, EquipmentSlot, EnchantmentTypes } from "@minecraft/server";

const VERSION = "1.0.9";
const STORAGE_KEY = "allenscreations:hivemind_v106";
const SLOT_COUNT = 36;
const SCAN_INTERVAL = 2;
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, EquipmentSlot.Offhand];
let master = null;
let syncing = false;
let initialized = false;
let tickBusy = false;
const snapshots = new Map();
const pendingDeath = new Map();

function safe(fn, fallback = undefined) { try { return fn(); } catch { return fallback; } }
function inventoryOf(player) { return safe(() => player.getComponent("minecraft:inventory")?.container); }
function equipmentOf(player) { return safe(() => player.getComponent("minecraft:equippable")); }
function clone(item) { return item ? safe(() => item.clone(), undefined) : undefined; }

function serializeItem(item) {
  if (!item) return null;
  const out = { id: item.typeId, amount: item.amount };
  safe(() => { if (item.nameTag) out.nameTag = item.nameTag; });
  safe(() => { const lore = item.getLore(); if (lore?.length) out.lore = lore; });
  safe(() => { const d = item.getComponent("minecraft:durability"); if (d) out.damage = d.damage; });
  safe(() => {
    const c = item.getComponent("minecraft:enchantable");
    if (c) out.enchants = c.getEnchantments().map(e => ({ id: e.type.id, level: e.level }));
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
  return JSON.stringify(serializeItem(a)) === JSON.stringify(serializeItem(b));
}
function readPlayer(player) {
  const c = inventoryOf(player);
  if (!c) return null;
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => clone(c.getItem(i)));
  const eq = equipmentOf(player);
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = clone(safe(() => eq?.getEquipment(slot)));
  return { slots, equipment, selected: safe(() => player.selectedSlotIndex, 0) };
}
function serializeState(state) {
  return {
    slots: state.slots.map(serializeItem),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, serializeItem(state.equipment[slot])])),
    selected: state.selected ?? 0
  };
}
function deserializeState(data) {
  if (!data || !Array.isArray(data.slots) || data.slots.length !== SLOT_COUNT) return null;
  return {
    slots: data.slots.map(deserializeItem),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, deserializeItem(data.equipment?.[slot] ?? null)])),
    selected: Number.isInteger(data.selected) && data.selected >= 0 && data.selected <= 8 ? data.selected : 0
  };
}
function persist() {
  if (!master) return;
  safe(() => world.setDynamicProperty(STORAGE_KEY, JSON.stringify(serializeState(master))));
}
function loadPersisted() {
  const raw = safe(() => world.getDynamicProperty(STORAGE_KEY));
  if (typeof raw !== "string" || !raw) return null;
  return safe(() => deserializeState(JSON.parse(raw)), null);
}
function snapshot(player, state) { snapshots.set(player.id, state ?? readPlayer(player)); }
function applyState(player, state = master) {
  if (!state) return;
  const c = inventoryOf(player), eq = equipmentOf(player);
  if (!c) return;
  for (let i = 0; i < SLOT_COUNT; i++) safe(() => c.setItem(i, clone(state.slots[i])));
  for (const slot of EQUIPMENT_SLOTS) safe(() => eq?.setEquipment(slot, clone(state.equipment[slot])));
  safe(() => { player.selectedSlotIndex = state.selected; });
  snapshot(player, readPlayer(player));
}
function emptyState() {
  return { slots: Array(SLOT_COUNT).fill(undefined), equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, undefined])), selected: 0 };
}
function slotName(i) { return i < 9 ? `hotbar ${i + 1}` : `inventory slot ${i + 1}`; }
function warnConflict(player, description) {
  safe(() => player.sendMessage(`§e[Team Inventory] Inventory conflict in ${description}; both item changes were preserved when possible.`));
}
function spawnSafely(player, item) {
  if (!item) return false;
  return !!safe(() => { player.dimension.spawnItem(clone(item), player.location); return true; }, false);
}
function stateDiff(a, b) {
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) if (!sameItem(a.slots[i], b.slots[i])) slots.push(i);
  const equipment = EQUIPMENT_SLOTS.filter(s => !sameItem(a.equipment[s], b.equipment[s]));
  return { slots, equipment, selected: a.selected !== b.selected };
}
function applyDetectedChanges(detected) {
  const slotWinners = new Map();
  const equipmentWinners = new Map();
  let changed = false;
  for (const { player, current, previous } of detected) {
    const changes = stateDiff(previous, current);
    for (const i of changes.slots) {
      const item = clone(current.slots[i]);
      if (!slotWinners.has(i)) slotWinners.set(i, { item, player });
      else {
        const winner = slotWinners.get(i);
        if (!sameItem(winner.item, item)) {
          if (item) spawnSafely(player, item);
          warnConflict(player, slotName(i));
        }
      }
    }
    for (const slot of changes.equipment) {
      const item = clone(current.equipment[slot]);
      if (!equipmentWinners.has(slot)) equipmentWinners.set(slot, { item, player });
      else {
        const winner = equipmentWinners.get(slot);
        if (!sameItem(winner.item, item)) {
          if (item) spawnSafely(player, item);
          warnConflict(player, String(slot));
        }
      }
    }
    if (changes.selected) { master.selected = current.selected; changed = true; }
  }
  for (const [i, winner] of slotWinners) { master.slots[i] = clone(winner.item); changed = true; }
  for (const [slot, winner] of equipmentWinners) { master.equipment[slot] = clone(winner.item); changed = true; }
  if (changed) {
    syncing = true;
    try { for (const p of world.getAllPlayers()) applyState(p, master); }
    finally { syncing = false; }
    persist();
  }
}
function initialize(players) {
  master = loadPersisted();
  if (!master) {
    const first = players[0];
    master = first ? (readPlayer(first) ?? emptyState()) : emptyState();
    persist();
  }
  initialized = true;
  syncing = true;
  try { for (const p of players) applyState(p, master); }
  finally { syncing = false; }
}
function syncTick() {
  if (syncing || tickBusy) return;
  tickBusy = true;
  try {
    const players = world.getAllPlayers();
    if (!players.length) return;
    if (!initialized) { initialize(players); return; }
    for (const p of players) if (!snapshots.has(p.id)) {
      syncing = true;
      try { applyState(p, master); }
      finally { syncing = false; }
    }
    const detected = [];
    for (const p of players) {
      const before = snapshots.get(p.id), current = readPlayer(p);
      if (!before || !current) continue;
      const diff = stateDiff(before, current);
      if (diff.slots.length || diff.equipment.length || diff.selected) detected.push({ player: p, current, previous: before });
    }
    if (detected.length) applyDetectedChanges(detected);
  } finally { tickBusy = false; }
}

// Preserve the actual keepInventory gamerule. If vanilla death drops are enabled, vanilla
// drops may overlap with scripted shared drops; the pack does not change the world's gamerule.
world.afterEvents.entityDie.subscribe(event => {
  const dead = event.deadEntity;
  if (dead.typeId !== "minecraft:player" || !master) return;
  const id = dead.id;
  if (pendingDeath.has(id)) return;
  pendingDeath.set(id, true);
  const dim = dead.dimension, loc = { x: dead.location.x, y: dead.location.y + 0.5, z: dead.location.z };
  const coords = `${Math.floor(dead.location.x)}, ${Math.floor(dead.location.y)}, ${Math.floor(dead.location.z)}`;
  let dropped = 0;
  syncing = true;
  try {
    for (const item of master.slots) if (item && safe(() => { dim.spawnItem(clone(item), loc); return true; }, false)) dropped++;
    for (const slot of EQUIPMENT_SLOTS) { const item = master.equipment[slot]; if (item && safe(() => { dim.spawnItem(clone(item), loc); return true; }, false)) dropped++; }
    master = emptyState();
    for (const p of world.getAllPlayers()) applyState(p, master);
    persist();
    world.sendMessage(`§c[Team Inventory] ${dead.name ?? "A player"} died at ${coords}. Shared inventory dropped once (${dropped} stacks).`);
  } finally {
    syncing = false;
    system.runTimeout(() => pendingDeath.delete(id), 40);
  }
});

world.beforeEvents.playerLeave.subscribe(event => snapshots.delete(event.player.id));
world.afterEvents.playerSpawn.subscribe(event => {
  // Show the join message even if this is the world's first player and sync has not initialized yet.
  if (event.initialSpawn) {
    system.run(() => safe(() => event.player.runCommand("function team_inventory/join_message")));
  }

  if (!initialized || !master) return;
  syncing = true;
  try { applyState(event.player, master); }
  finally { syncing = false; }
});

system.runInterval(() => {
  try { syncTick(); }
  catch (error) {
    syncing = false;
    safe(() => world.sendMessage("§c[Team Inventory] Sync paused for this check after an internal error."));
  }
}, SCAN_INTERVAL);
