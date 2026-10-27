import { world, system, ItemStack, EquipmentSlot, EnchantmentTypes, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const STORAGE_KEY = "allenscreations:hivemind_v106";
const STATE_KEY = "allenscreations:team_state";
const CONTROLLER_ID = "allenscreations:controller";
const MAX_STORED = 30000;
const MAX_APPLY_RETRIES = 10;
const ERROR_COOLDOWN = 200;
const SLOT_COUNT = 36;
const SCAN_INTERVAL = 2;
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, EquipmentSlot.Offhand];

let master = null;
let syncing = false;
let initialized = false;
let tickBusy = false;
let warnedSize = false;
let stripControllers = false;
let lastErrorTick = -ERROR_COOLDOWN;
const snapshots = new Map();
const pendingDeath = new Map();
const applyFails = new Map();

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
function inventoryOf(player) { return safe(() => player.getComponent("minecraft:inventory")?.container); }
function equipmentOf(player) { return safe(() => player.getComponent("minecraft:equippable")); }
function clone(item) { return item ? safe(() => item.clone(), undefined) : undefined; }
function isAlive(player) {
  if (!safe(() => player.isValid, false)) return false;
  return safe(() => player.getComponent("minecraft:health")?.currentValue > 0, true);
}
function livePlayers() { return world.getAllPlayers().filter(isAlive); }

function serializeItem(item) {
  if (!item) return null;
  const out = { id: item.typeId, amount: item.amount };
  safe(() => { if (item.nameTag) out.nameTag = item.nameTag; });
  safe(() => { const lore = item.getLore(); if (lore?.length) out.lore = lore; });
  safe(() => { const d = item.getComponent("minecraft:durability"); if (d) out.damage = d.damage; });
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
    return item;
  });
}
function sameItem(a, b) {
  if (!a || !b) return !a && !b;
  if (a.typeId !== b.typeId || a.amount !== b.amount) return false;
  return JSON.stringify(serializeItem(a)) === JSON.stringify(serializeItem(b));
}
function readPlayer(player) {
  const c = inventoryOf(player);
  if (!c) return null;
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => clone(safe(() => c.getItem(i))));
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
  const json = JSON.stringify(serializeState(master));
  if (json.length > MAX_STORED) {
    if (!warnedSize) {
      warnedSize = true;
      safe(() => world.sendMessage("§e[Team Inventory] The shared inventory is too large to save. It will not persist until it is smaller."));
    }
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
function emptyState() {
  return { slots: Array(SLOT_COUNT).fill(undefined), equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, undefined])), selected: 0 };
}
function stateDiff(a, b) {
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) if (!sameItem(a.slots[i], b.slots[i])) slots.push(i);
  const equipment = EQUIPMENT_SLOTS.filter(s => !sameItem(a.equipment[s], b.equipment[s]));
  return { slots, equipment, selected: a.selected !== b.selected };
}
function applyState(player, state = master) {
  if (!state) return;
  const c = inventoryOf(player), eq = equipmentOf(player);
  if (!c) return;
  for (let i = 0; i < SLOT_COUNT; i++) safe(() => c.setItem(i, clone(state.slots[i])));
  for (const slot of EQUIPMENT_SLOTS) safe(() => eq?.setEquipment(slot, clone(state.equipment[slot])));
  safe(() => { player.selectedSlotIndex = state.selected; });
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
function slotName(i) { return i < 9 ? `hotbar ${i + 1}` : `inventory slot ${i + 1}`; }
function warnConflict(player, description) {
  safe(() => player.sendMessage(`§e[Team Inventory] Inventory conflict in ${description}; both item changes were preserved when possible.`));
}
function spawnAt(dimension, item, location) {
  if (!item) return false;
  return !!safe(() => { dimension.spawnItem(clone(item), location); return true; }, false);
}
function spawnSafely(player, item) {
  return spawnAt(player.dimension, item, player.location);
}
function placeItem(state, item) {
  const i = state.slots.findIndex(s => !s);
  if (i < 0) return false;
  state.slots[i] = clone(item);
  return true;
}
function hasControllerState(state) { return state.slots.some(s => s?.typeId === CONTROLLER_ID); }
function mergeInto(state, player) {
  const read = readPlayer(player);
  if (!read) return;
  read.slots.forEach((item, i) => {
    if (!item) return;
    if (item.typeId === CONTROLLER_ID && (stripControllers || hasControllerState(state))) return;
    if (!state.slots[i]) state.slots[i] = clone(item);
    else if (!placeItem(state, item)) spawnSafely(player, item);
  });
  for (const slot of EQUIPMENT_SLOTS) {
    const item = read.equipment[slot];
    if (!item) continue;
    if (!state.equipment[slot]) state.equipment[slot] = clone(item);
    else if (!placeItem(state, item)) spawnSafely(player, item);
  }
}
function applyDetectedChanges(detected) {
  const slotWinners = new Map();
  const equipmentWinners = new Map();
  let changed = false;
  let selectedTaken = false;
  for (const { player, current, previous } of detected) {
    const changes = stateDiff(previous, current);
    for (const i of changes.slots) {
      const item = clone(current.slots[i]);
      if (!slotWinners.has(i)) slotWinners.set(i, { item, player });
      else if (!sameItem(slotWinners.get(i).item, item)) {
        if (item) spawnSafely(player, item);
        warnConflict(player, slotName(i));
      }
    }
    for (const slot of changes.equipment) {
      const item = clone(current.equipment[slot]);
      if (!equipmentWinners.has(slot)) equipmentWinners.set(slot, { item, player });
      else if (!sameItem(equipmentWinners.get(slot).item, item)) {
        if (item) spawnSafely(player, item);
        warnConflict(player, String(slot));
      }
    }
    if (changes.selected && !selectedTaken) {
      selectedTaken = true;
      master.selected = current.selected;
      changed = true;
    }
  }
  for (const [i, winner] of slotWinners) { master.slots[i] = clone(winner.item); changed = true; }
  for (const [slot, winner] of equipmentWinners) { master.equipment[slot] = clone(winner.item); changed = true; }
  if (changed) {
    withSync(() => { for (const p of livePlayers()) applyState(p, master); });
    persist();
  }
}
function initialize(players) {
  master = loadPersisted();
  if (!master) {
    master = emptyState();
    for (const p of players) mergeInto(master, p);
    master.selected = safe(() => players[0].selectedSlotIndex, 0);
    persist();
  }
  stripControllers = false;
  initialized = true;
  withSync(() => { for (const p of players) applyState(p, master); });
}
function syncTick() {
  if (syncing || tickBusy) return;
  tickBusy = true;
  try {
    if (!isRunning()) return;
    const players = livePlayers();
    if (!players.length) return;
    if (!initialized) { initialize(players); return; }
    for (const p of players) if (!snapshots.has(p.id)) withSync(() => applyState(p, master));
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

function resetSharing() {
  master = null;
  initialized = false;
  snapshots.clear();
  applyFails.clear();
  safe(() => world.setDynamicProperty(STORAGE_KEY, undefined));
}
function hasController(player) {
  const inv = inventoryOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) return true;
  }
  return false;
}
function giveController(player) {
  if (hasController(player)) return;
  inventoryOf(player)?.addItem(new ItemStack(CONTROLLER_ID, 1));
}
function consumeController(player) {
  if (isCreative(player)) return;
  const inv = inventoryOf(player);
  const slot = player.selectedSlotIndex;
  if (inv?.getItem(slot)?.typeId !== CONTROLLER_ID) return;
  inv.setItem(slot, undefined);
  player.playSound("random.break");
  player.sendMessage("The Controller broke.");
}
function startGame(player) {
  resetSharing();
  stripControllers = !isCreative(player);
  setState("running");
  consumeController(player);
  world.sendMessage("§a[Team Inventory] Sharing started. Everyone's items are being combined.");
}
function endGame() {
  resetSharing();
  setState("ended");
  world.sendMessage("§e[Team Inventory] Sharing ended. Everyone keeps their current items.");
}
function restartGame(player) {
  if (!isRunning() || !master) {
    startGame(player);
    return;
  }
  master = emptyState();
  persist();
  withSync(() => { for (const p of livePlayers()) applyState(p, master); });
  if (isCreative(player)) giveController(player);
  else {
    player.playSound("random.break");
    player.sendMessage("The Controller broke.");
  }
  world.sendMessage("§e[Team Inventory] Shared inventory was emptied.");
}
async function openController(player, attempt = 0) {
  const state = getState();
  const note = isCreative(player) ? "Creative: the Controller is kept." : "Start and Restart use up the Controller.";
  const form = new ActionFormData()
    .title("Controller")
    .body(`State: ${state}\n${note}\nRestart empties the shared inventory.`)
    .button("Start")
    .button("Restart")
    .button("End");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) {
    if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
      system.runTimeout(() => openController(player, attempt + 1), 10);
    }
    return;
  }
  if (res.selection === 0) {
    if (state === "running") player.sendMessage("Already running.");
    else startGame(player);
  } else if (res.selection === 1) {
    restartGame(player);
  } else if (res.selection === 2) {
    if (state === "running") endGame();
    else player.sendMessage("Nothing to end.");
  }
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === CONTROLLER_ID) openController(source);
});

world.afterEvents.entityDie.subscribe(event => {
  const dead = event.deadEntity;
  if (dead.typeId !== "minecraft:player" || !master || !isRunning()) return;
  const id = dead.id;
  if (pendingDeath.has(id)) return;
  pendingDeath.set(id, true);
  const dim = dead.dimension;
  const loc = { x: dead.location.x, y: dead.location.y + 0.5, z: dead.location.z };
  const coords = `${Math.floor(dead.location.x)}, ${Math.floor(dead.location.y)}, ${Math.floor(dead.location.z)}`;
  const vanillaDrops = safe(() => world.gameRules.keepInventory === false, false);
  const stacks = [...master.slots, ...EQUIPMENT_SLOTS.map(s => master.equipment[s])].filter(Boolean);
  let dropped = 0;
  withSync(() => {
    for (const item of stacks) if (vanillaDrops || spawnAt(dim, item, loc)) dropped++;
    master = emptyState();
    for (const p of livePlayers()) applyState(p, master);
    persist();
    world.sendMessage(`§c[Team Inventory] ${dead.name ?? "A player"} died at ${coords}. Shared inventory dropped once (${dropped} stacks).`);
  });
  system.runTimeout(() => pendingDeath.delete(id), 40);
});

world.beforeEvents.playerLeave.subscribe(event => {
  snapshots.delete(event.player.id);
  applyFails.delete(event.player.id);
});

world.afterEvents.playerSpawn.subscribe(event => {
  const player = event.player;
  if (event.initialSpawn !== false && !isRunning()) system.run(() => giveController(player));
  if (event.initialSpawn !== false && isRunning()) {
    system.run(() => {
      const result = safe(() => player.runCommand("function team_inventory/join_message"), null);
      if (!result || result.successCount < 1) {
        safe(() => player.sendMessage("§a[Team Inventory] §fSyncing shared inventory..."));
      }
    });
  }
  snapshots.delete(player.id);
  applyFails.delete(player.id);
});

system.runInterval(() => {
  try { syncTick(); }
  catch {
    syncing = false;
    if (system.currentTick - lastErrorTick >= ERROR_COOLDOWN) {
      lastErrorTick = system.currentTick;
      safe(() => world.sendMessage("§c[Team Inventory] Sync paused for this check after an internal error."));
    }
  }
}, SCAN_INTERVAL);
