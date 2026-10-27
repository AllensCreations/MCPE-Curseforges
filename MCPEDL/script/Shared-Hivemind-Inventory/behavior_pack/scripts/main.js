import { world, system, ItemStack, EquipmentSlot, EnchantmentTypes, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const CONTROLLER_ID = "allenscreations:controller";
const STATE_KEY = "allenscreations:team_state";
const STORAGE_KEY = "allenscreations:hivemind_v106";
const MEMBERS_KEY = "allenscreations:team_members";
const CLEAR_KEY = "allenscreations:team_clear";
const KEEP_KEY = "allenscreations:team_keep";
const TITLE = "§l§bAllens§dCreations §6Controller";
const HOW_TO_PLAY = "Use the Controller and choose Start. Everyone's main inventory, armor and offhand items are combined into one shared inventory, and anything one player picks up, uses or drops changes it for the whole team.\n\nIf anyone dies, the whole shared inventory drops once and is emptied for the team. Creative and Spectator players are not part of it.\n\nAn operator ends the game with the function end_game. The shared items are then divided between the players and everyone else is emptied, so nothing is duplicated.";
const OPERATOR_LEVEL = 2;
const MAX_STORED = 30000;
const MAX_APPLY_RETRIES = 10;
const ERROR_COOLDOWN = 200;
const SLOT_COUNT = 36;
const SCAN_INTERVAL = 1;
const ARMOR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
const EQUIPMENT_SLOTS = [...ARMOR_SLOTS, EquipmentSlot.Offhand];

let master = null;
let syncing = false;
let initialized = false;
let tickBusy = false;
let warnedSize = false;
let needMerge = false;
let rulesChecked = false;
let lastErrorTick = -ERROR_COOLDOWN;
const snapshots = new Map();
const pendingDeath = new Map();
const applyFails = new Map();
const knownMembers = new Set();

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
function visible(item) { return item && item.typeId !== CONTROLLER_ID ? clone(item) : undefined; }
function readPlayer(player) {
  const c = containerOf(player);
  if (!c) return null;
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => visible(safe(() => c.getItem(i))));
  const eq = equipmentOf(player);
  const equipment = {};
  for (const slot of EQUIPMENT_SLOTS) equipment[slot] = visible(safe(() => eq?.getEquipment(slot)));
  return { slots, equipment };
}
function serializeState(state) {
  return {
    slots: state.slots.map(serializeItem),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, serializeItem(state.equipment[slot])]))
  };
}
function deserializeState(data) {
  if (!data || !Array.isArray(data.slots) || data.slots.length !== SLOT_COUNT) return null;
  return {
    slots: data.slots.map(deserializeItem),
    equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(slot => [slot, deserializeItem(data.equipment?.[slot] ?? null)]))
  };
}
function persist() {
  if (!master) return;
  const json = JSON.stringify(serializeState(master));
  if (json.length > MAX_STORED) {
    safe(() => world.setDynamicProperty(STORAGE_KEY, undefined));
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
  return { slots: Array(SLOT_COUNT).fill(undefined), equipment: Object.fromEntries(EQUIPMENT_SLOTS.map(s => [s, undefined])) };
}
function stateDiff(a, b) {
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) if (!sameItem(a.slots[i], b.slots[i])) slots.push(i);
  const equipment = EQUIPMENT_SLOTS.filter(s => !sameItem(a.equipment[s], b.equipment[s]));
  return { slots, equipment };
}
function writeState(player, state) {
  const c = containerOf(player);
  const eq = equipmentOf(player);
  if (!c) return;
  for (let i = 0; i < SLOT_COUNT; i++) {
    const live = safe(() => c.getItem(i));
    if (!sameItem(visible(live), state.slots[i])) safe(() => c.setItem(i, clone(state.slots[i])));
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
function slotName(i) { return i < 9 ? `hotbar ${i + 1}` : `inventory slot ${i + 1}`; }
function warnConflict(player, description) {
  safe(() => player.sendMessage(`§e[Team Inventory] Inventory conflict in ${description}; your extra item was dropped at your feet.`));
}
function spawnAt(dimension, item, location) {
  if (!item) return false;
  return !!safe(() => { dimension.spawnItem(clone(item), location); return true; }, false);
}
function spawnSafely(player, item) { return spawnAt(player.dimension, item, player.location); }
function placeItem(state, item) {
  const i = state.slots.findIndex(s => !s);
  if (i < 0) return false;
  state.slots[i] = clone(item);
  return true;
}
function mergeInto(state, player) {
  const read = readPlayer(player);
  if (!read) return;
  read.slots.forEach((item, i) => {
    if (!item) return;
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
function initialize(players) {
  const merge = needMerge;
  needMerge = false;
  master = merge ? null : loadPersisted();
  if (master) adoptLive(master, players);
  else {
    master = emptyState();
    if (merge) for (const p of players) mergeInto(master, p);
    else if (players[0]) mergeInto(master, players[0]);
  }
  persist();
  initialized = true;
  withSync(() => { for (const p of players) applyState(p, master); });
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
}
function syncTick() {
  if (syncing || tickBusy) return;
  tickBusy = true;
  try {
    if (!isRunning()) return;
    if (!rulesChecked) {
      rulesChecked = true;
      safe(() => { world.gameRules.keepInventory = true; });
    }
    const players = sharingPlayers();
    if (!players.length) return;
    if (!initialized) {
      initialize(players);
      trackMembers(players);
      return;
    }
    for (const p of players) if (!snapshots.has(p.id)) withSync(() => applyState(p, master));
    trackMembers(players);
    const detected = [];
    for (const p of players) {
      const before = snapshots.get(p.id);
      const current = readPlayer(p);
      if (!before || !current) continue;
      const diff = stateDiff(before, current);
      if (diff.slots.length || diff.equipment.length) detected.push({ player: p, current, previous: before });
    }
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
  initialized = false;
  needMerge = false;
  snapshots.clear();
  applyFails.clear();
  knownMembers.clear();
  safe(() => world.setDynamicProperty(STORAGE_KEY, undefined));
}

function hasController(player) {
  const inv = containerOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) return true;
  }
  return false;
}
function giveController(player) {
  if (hasController(player)) return;
  containerOf(player)?.addItem(new ItemStack(CONTROLLER_ID, 1));
}
function removeController(player) {
  const inv = containerOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) {
      inv.setItem(i, undefined);
      return true;
    }
  }
  return false;
}
function consumeController(player) {
  if (isCreative(player)) return;
  if (removeController(player)) {
    player.playSound("random.break");
    player.sendMessage("The Controller broke.");
  }
}

function startGame(player) {
  resetSharing();
  setState("running");
  needMerge = true;
  rulesChecked = true;
  saveSet(MEMBERS_KEY, new Set());
  saveSet(CLEAR_KEY, new Set());
  applyKeepInventory();
  consumeController(player);
  world.sendMessage("§a[Team Inventory] Sharing started. Everyone's items are being combined.");
}
function distribute(online, holder) {
  const states = new Map(online.map(p => [p.id, emptyState()]));
  let k = 0;
  for (const item of master.slots) {
    if (!item) continue;
    placeItem(states.get(online[k++ % online.length].id), item);
  }
  const held = states.get(holder.id);
  for (const slot of EQUIPMENT_SLOTS) held.equipment[slot] = clone(master.equipment[slot]);
  for (const p of online) writeState(p, states.get(p.id));
}
function endGame(source) {
  const online = sharingPlayers();
  const holder = online.find(p => p.id === source?.id && isHost(p)) ?? online.find(isHost) ?? online[0];
  withSync(() => {
    if (master && holder) distribute(online, holder);
    else if (master && isAlive(source)) {
      const stacks = [...master.slots, ...EQUIPMENT_SLOTS.map(s => master.equipment[s])].filter(Boolean);
      for (const item of stacks) spawnAt(source.dimension, item, source.location);
    }
    const onlineIds = new Set(online.map(p => p.id));
    const pending = loadSet(CLEAR_KEY);
    for (const id of loadSet(MEMBERS_KEY)) {
      if (onlineIds.has(id)) continue;
      const other = world.getAllPlayers().find(p => p.id === id);
      if (other && isAlive(other)) writeState(other, emptyState());
      else pending.add(id);
    }
    saveSet(CLEAR_KEY, pending);
  });
  saveSet(MEMBERS_KEY, new Set());
  resetSharing();
  restoreKeepInventory();
  setState("ended");
  world.sendMessage(holder ? `§e[Team Inventory] Sharing ended. The shared items were divided between the players, and ${holder.name} holds the armor.` : "§e[Team Inventory] Sharing ended.");
  for (const p of world.getAllPlayers()) if (isHost(p)) giveController(p);
}

async function showHowToPlay(player) {
  const form = new ActionFormData().title(TITLE).body(HOW_TO_PLAY).button("Back");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res.canceled && res.selection === 0) openController(player);
}

async function openController(player, attempt = 0) {
  const note = isCreative(player) ? "Creative: the Controller is kept." : "Start uses up the Controller.";
  const form = new ActionFormData()
    .title(TITLE)
    .body(`§7State: §f${getState()}\n§7${note}`)
    .button("Start")
    .button("How to play");
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
    if (getState() === "running") {
      player.sendMessage("Already running.");
      return;
    }
    startGame(player);
  } else if (res.selection === 1) {
    showHowToPlay(player);
  }
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== CONTROLLER_ID) return;
  if (isHost(source)) {
    openController(source);
    return;
  }
  removeController(source);
  source.sendMessage("Only the host or an operator can hold the Controller.");
});

system.afterEvents.scriptEventReceive.subscribe(({ id, sourceEntity }) => {
  if (id === "allenscreations:end" && isRunning()) endGame(sourceEntity);
});

world.afterEvents.entityDie.subscribe(event => {
  const dead = event.deadEntity;
  if (dead.typeId !== "minecraft:player" || !master || !isRunning() || isCreative(dead)) return;
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
    for (const p of sharingPlayers()) applyState(p, master);
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
  const pending = loadSet(CLEAR_KEY);
  if (pending.has(player.id)) {
    system.run(() => {
      withSync(() => writeState(player, emptyState()));
      pending.delete(player.id);
      saveSet(CLEAR_KEY, pending);
    });
  }
  if (event.initialSpawn !== false) {
    if (isHost(player) && (isCreative(player) || !isRunning())) system.run(() => giveController(player));
    else if (!isHost(player)) system.run(() => removeController(player));
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
