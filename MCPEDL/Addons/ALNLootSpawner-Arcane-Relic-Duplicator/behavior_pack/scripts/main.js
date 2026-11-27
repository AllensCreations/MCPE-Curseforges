import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const BLOCK_ID = "aln:loot_spawner";
const REGISTRY_PROP = "aln:spawners";
const LEGACY_ITEM = "aln:spawner_item";
const LEGACY_TYPE = "aln:spawner_type";
const LEGACY_TICK = "aln:spawner_tick";
const STEP_TICKS = 20;
const SAVE_EVERY_STEPS = 5;
const SWEEP_EVERY_STEPS = 10;
const SPARK_RANGE = 24;
const OUTPUT_CONTAINERS = new Set(["minecraft:chest", "minecraft:trapped_chest", "minecraft:barrel", "minecraft:hopper"]);
const FLOATING_DISPLAY = true;
const DISPLAY_TYPE = "minecraft:armor_stand";
const DISPLAY_TAG = "aln_loot_display";
const DISPLAY_RANGE = 24;
const DISPLAY_STEP = 2;
const HAND_HEIGHT = 0.95;
const CLICK_COOLDOWN = 6;
const DIMENSIONS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];

const RARITY = {
  common:   { label: "Common",   color: "§f", ticks: 160  },
  uncommon: { label: "Uncommon", color: "§a", ticks: 400  },
  rare:     { label: "Rare",     color: "§b", ticks: 1200 },
  epic:     { label: "Epic",     color: "§d", ticks: 4800 }
};

const EPIC_ITEMS = new Set([
  "minecraft:netherite_ingot","minecraft:netherite_scrap","minecraft:ancient_debris",
  "minecraft:enchanted_golden_apple","minecraft:totem_of_undying","minecraft:nether_star",
  "minecraft:elytra","minecraft:heavy_core"
]);

const RARE_ITEMS = new Set([
  "minecraft:diamond","minecraft:emerald","minecraft:gold_ingot","minecraft:ender_pearl",
  "minecraft:blaze_rod","minecraft:ghast_tear","minecraft:shulker_shell",
  "minecraft:music_disc_13","minecraft:music_disc_cat","minecraft:music_disc_blocks",
  "minecraft:music_disc_chirp","minecraft:music_disc_far","minecraft:music_disc_mall",
  "minecraft:music_disc_mellohi","minecraft:music_disc_stal","minecraft:music_disc_strad",
  "minecraft:music_disc_ward","minecraft:music_disc_11","minecraft:music_disc_wait",
  "minecraft:music_disc_otherside","minecraft:music_disc_5","minecraft:music_disc_pigstep",
  "minecraft:music_disc_relic","minecraft:heart_of_the_sea","minecraft:conduit",
  "minecraft:trident","minecraft:end_crystal","minecraft:beacon"
]);

const UNCOMMON_ITEMS = new Set([
  "minecraft:iron_ingot","minecraft:coal","minecraft:copper_ingot","minecraft:redstone",
  "minecraft:lapis_lazuli","minecraft:quartz","minecraft:cooked_beef","minecraft:cooked_porkchop",
  "minecraft:cooked_chicken","minecraft:cooked_mutton","minecraft:cooked_rabbit",
  "minecraft:cooked_salmon","minecraft:cooked_cod","minecraft:bread","minecraft:cake",
  "minecraft:potion","minecraft:splash_potion","minecraft:lingering_potion",
  "minecraft:experience_bottle","minecraft:book","minecraft:leather","minecraft:string"
]);

const BLOCKED_CONTAINERS = new Set([
  "minecraft:shulker_box","minecraft:undyed_shulker_box","minecraft:white_shulker_box",
  "minecraft:orange_shulker_box","minecraft:magenta_shulker_box","minecraft:light_blue_shulker_box",
  "minecraft:yellow_shulker_box","minecraft:lime_shulker_box","minecraft:pink_shulker_box",
  "minecraft:gray_shulker_box","minecraft:light_gray_shulker_box","minecraft:cyan_shulker_box",
  "minecraft:purple_shulker_box","minecraft:blue_shulker_box","minecraft:brown_shulker_box",
  "minecraft:green_shulker_box","minecraft:red_shulker_box","minecraft:black_shulker_box",
  "minecraft:bundle","minecraft:chest","minecraft:trapped_chest","minecraft:barrel"
]);

function getRarity(typeId) {
  if (EPIC_ITEMS.has(typeId))   return "epic";
  if (RARE_ITEMS.has(typeId))   return "rare";
  if (UNCOMMON_ITEMS.has(typeId)) return "uncommon";
  return "common";
}

let spawners = null;
let dirty = false;
let steps = 0;
let displayTick = 0;
const displays = new Map();
const angles = new Map();
const misses = new Map();
const lastClick = new Map();
let fallbackClock = 0;

if (typeof system.currentTick !== "number") {
  system.runInterval(() => { fallbackClock++; }, 1);
}

function nowTick() {
  return typeof system.currentTick === "number" ? system.currentTick : fallbackClock;
}

function keyOf(dimId, x, y, z) {
  return `${dimId}|${x}|${y}|${z}`;
}

function isLive(entity) {
  try {
    const flag = entity.isValid;
    return typeof flag === "function" ? flag.call(entity) === true : flag === true;
  } catch (e) {
    return false;
  }
}

function loadSpawners() {
  if (spawners) return spawners;
  spawners = new Map();
  try {
    const raw = world.getDynamicProperty(REGISTRY_PROP);
    if (typeof raw === "string" && raw) {
      for (const s of JSON.parse(raw)) {
        if (s && typeof s.item === "string" && typeof s.d === "string") {
          spawners.set(keyOf(s.d, s.x, s.y, s.z), s);
        }
      }
    }
  } catch (e) {}
  return spawners;
}

function saveSpawners() {
  try {
    world.setDynamicProperty(REGISTRY_PROP, JSON.stringify([...loadSpawners().values()]));
    dirty = false;
  } catch (e) {}
}

function importLegacy(block) {
  const loc = block.location;
  const legacyKey = `${loc.x}:${loc.y}:${loc.z}:${block.dimension.id}`;
  try {
    const item = world.getDynamicProperty(`${LEGACY_ITEM}_${legacyKey}`);
    if (typeof item !== "string" || !item) return undefined;
    const rarityProp = world.getDynamicProperty(`${LEGACY_TYPE}_${legacyKey}`);
    const tickProp = world.getDynamicProperty(`${LEGACY_TICK}_${legacyKey}`);
    const rarity = typeof rarityProp === "string" && RARITY[rarityProp] ? rarityProp : getRarity(item);
    const entry = {
      d: block.dimension.id, x: loc.x, y: loc.y, z: loc.z,
      item, rarity,
      left: typeof tickProp === "number" && tickProp > 0 ? tickProp : RARITY[rarity].ticks
    };
    loadSpawners().set(keyOf(entry.d, entry.x, entry.y, entry.z), entry);
    world.setDynamicProperty(`${LEGACY_ITEM}_${legacyKey}`, "");
    saveSpawners();
    return entry;
  } catch (e) {
    return undefined;
  }
}

function prettyName(typeId) {
  return typeId.replace("minecraft:", "").split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function ticksToTime(ticks) {
  const secs = Math.max(0, Math.ceil(ticks / 20));
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${secs}s`;
}

function nearbyPlayers(entry, range) {
  const out = [];
  try {
    for (const p of world.getAllPlayers()) {
      if (p.dimension.id !== entry.d) continue;
      const dx = p.location.x - entry.x;
      const dy = p.location.y - entry.y;
      const dz = p.location.z - entry.z;
      if (dx * dx + dy * dy + dz * dz <= range * range) out.push(p);
    }
  } catch (e) {}
  return out;
}

function centerOf(entry) {
  return { x: entry.x + 0.5, y: entry.y + 0.5, z: entry.z + 0.5 };
}

function findDisplays(dimension, entry) {
  try {
    return dimension.getEntities({ type: DISPLAY_TYPE, tags: [DISPLAY_TAG], location: centerOf(entry), maxDistance: 1.6 });
  } catch (e) {
    return [];
  }
}

function setHeld(stand, itemId) {
  try {
    const equip = stand.getComponent("minecraft:equippable");
    if (equip && equip.setEquipment("Offhand", new ItemStack(itemId, 1))) return true;
  } catch (e) {}
  try {
    stand.runCommand(`replaceitem entity @s slot.weapon.offhand 0 ${itemId}`);
    return true;
  } catch (e) {}
  return false;
}

function spawnDisplay(dimension, entry) {
  try {
    const stand = dimension.spawnEntity(DISPLAY_TYPE, { x: entry.x + 0.5, y: entry.y + 0.5 - HAND_HEIGHT, z: entry.z + 0.5 });
    stand.addTag(DISPLAY_TAG);
    try { stand.addEffect("invisibility", 20000000, { amplifier: 1, showParticles: false }); } catch (e) {}
    setHeld(stand, entry.item);
    return stand;
  } catch (e) {
    return undefined;
  }
}

function ensureDisplay(dimension, entry, key) {
  const cached = displays.get(key);
  if (cached && isLive(cached)) return cached;
  let stand;
  for (const candidate of findDisplays(dimension, entry)) {
    if (!stand) {
      stand = candidate;
      setHeld(stand, entry.item);
    } else {
      try { candidate.remove(); } catch (e) {}
    }
  }
  if (!stand) stand = spawnDisplay(dimension, entry);
  if (stand) displays.set(key, stand);
  else displays.delete(key);
  return stand;
}

function removeDisplay(dimension, entry, key) {
  const cached = displays.get(key);
  displays.delete(key);
  angles.delete(key);
  if (cached && isLive(cached)) {
    try { cached.remove(); } catch (e) {}
  }
  if (dimension) {
    for (const stand of findDisplays(dimension, entry)) {
      try { stand.remove(); } catch (e) {}
    }
  }
}

function animateDisplay(stand, entry, key) {
  const total = (RARITY[entry.rarity] || RARITY.common).ticks;
  const progress = Math.max(0, Math.min(1, 1 - entry.left / total));
  const angle = (angles.get(key) || 0) + 0.12 + 0.3 * progress;
  angles.set(key, angle);
  const bob = Math.sin(displayTick * 0.18) * 0.07;
  try {
    stand.teleport(
      { x: entry.x + 0.5, y: entry.y + 0.5 - HAND_HEIGHT + bob, z: entry.z + 0.5 },
      { facingLocation: { x: entry.x + 0.5 + Math.cos(angle) * 4, y: entry.y + 0.5, z: entry.z + 0.5 + Math.sin(angle) * 4 } }
    );
  } catch (e) {}
}

function isDisplay(entity) {
  try {
    return entity.typeId === DISPLAY_TYPE && entity.hasTag(DISPLAY_TAG);
  } catch (e) {
    return false;
  }
}

function sparks(dimension, entry, count) {
  for (let i = 0; i < count; i++) {
    try {
      dimension.spawnParticle("minecraft:basic_flame_particle", {
        x: entry.x + 0.15 + Math.random() * 0.7,
        y: entry.y + 0.2 + Math.random() * 0.7,
        z: entry.z + 0.15 + Math.random() * 0.7
      });
    } catch (e) {}
  }
}

function ejectDuplicate(dimension, entry) {
  let placed = false;
  try {
    const below = dimension.getBlock({ x: entry.x, y: entry.y - 1, z: entry.z });
    if (below && OUTPUT_CONTAINERS.has(below.typeId)) {
      const inv = below.getComponent("minecraft:inventory");
      if (inv && inv.container) {
        const leftover = inv.container.addItem(new ItemStack(entry.item, 1));
        placed = !leftover;
      }
    }
  } catch (e) {}
  if (!placed) {
    try {
      dimension.spawnItem(new ItemStack(entry.item, 1), { x: entry.x + 0.5, y: entry.y + 1.1, z: entry.z + 0.5 });
    } catch (e) {}
  }
  sparks(dimension, entry, 14);
  for (const p of nearbyPlayers(entry, SPARK_RANGE)) {
    try { p.playSound("random.orb"); } catch (e) {}
  }
}

function dropTemplate(dimension, entry) {
  try {
    dimension.spawnItem(new ItemStack(entry.item, 1), { x: entry.x + 0.5, y: entry.y + 0.5, z: entry.z + 0.5 });
  } catch (e) {}
}

function giveToPlayer(player, itemId) {
  let leftover = true;
  try {
    const inv = player.getComponent("minecraft:inventory");
    if (inv && inv.container) leftover = inv.container.addItem(new ItemStack(itemId, 1));
  } catch (e) {}
  if (leftover) {
    try {
      player.dimension.spawnItem(new ItemStack(itemId, 1), player.location);
    } catch (e) {}
  }
}

function takeOneFromPlayer(player, typeId) {
  try {
    const inv = player.getComponent("minecraft:inventory");
    if (!inv || !inv.container) return false;
    const container = inv.container;
    const selected = typeof player.selectedSlotIndex === "number" ? player.selectedSlotIndex : -1;
    const order = selected >= 0 ? [selected] : [];
    for (let i = 0; i < container.size; i++) {
      if (i !== selected) order.push(i);
    }
    for (const i of order) {
      const slot = container.getItem(i);
      if (slot && slot.typeId === typeId) {
        if (slot.amount > 1) {
          slot.amount -= 1;
          container.setItem(i, slot);
        } else {
          container.setItem(i, undefined);
        }
        return true;
      }
    }
  } catch (e) {}
  return false;
}

async function openSpawnerUI(player, key) {
  const entry = loadSpawners().get(key);
  if (!entry) return;
  const rar = RARITY[entry.rarity] || RARITY.common;
  const pct = Math.max(0, Math.min(100, Math.floor(((rar.ticks - entry.left) / rar.ticks) * 100)));

  const form = new ActionFormData()
    .title("Loot Spawner")
    .body(
      `Item: ${prettyName(entry.item)}\n` +
      `Rarity: ${rar.color}${rar.label}§r\n\n` +
      `Progress: ${pct}%\n` +
      `Next duplicate in: ${ticksToTime(entry.left)}`
    )
    .button("Retrieve Template Item")
    .button("Exit");

  let res;
  try { res = await form.show(player); } catch (e) { return; }
  if (!res || res.canceled || res.selection !== 0) return;
  retrieveTemplate(player, key);
}

function retrieveTemplate(player, key) {
  const reg = loadSpawners();
  const entry = reg.get(key);
  if (!entry) return;
  reg.delete(key);
  saveSpawners();
  let dimension;
  try { dimension = world.getDimension(entry.d); } catch (e) {}
  removeDisplay(dimension, entry, key);
  giveToPlayer(player, entry.item);
  try { player.playSound("random.orb"); } catch (e) {}
  const rar = RARITY[entry.rarity] || RARITY.common;
  player.onScreenDisplay.setActionBar(`§aTemplate retrieved: §r${prettyName(entry.item)} §8[${rar.color}${rar.label}§8]`);
}

function insertTemplate(player, block, key, heldTypeId) {
  if (!heldTypeId || heldTypeId === "minecraft:air" || heldTypeId === BLOCK_ID) {
    player.onScreenDisplay.setActionBar("§eHold an item and interact to insert it.");
    return;
  }
  if (BLOCKED_CONTAINERS.has(heldTypeId)) {
    player.onScreenDisplay.setActionBar("§cFilled containers cannot be inserted.");
    return;
  }
  if (!takeOneFromPlayer(player, heldTypeId)) return;

  const loc = block.location;
  const rarity = getRarity(heldTypeId);
  const entry = {
    d: block.dimension.id, x: loc.x, y: loc.y, z: loc.z,
    item: heldTypeId, rarity, left: RARITY[rarity].ticks
  };
  loadSpawners().set(key, entry);
  saveSpawners();
  if (FLOATING_DISPLAY) ensureDisplay(block.dimension, entry, key);
  sparks(block.dimension, entry, 8);
  try { player.playSound("beacon.activate"); } catch (e) {}
  const rar = RARITY[rarity];
  player.onScreenDisplay.setActionBar(`§bInserted: §r${prettyName(heldTypeId)} §8[${rar.color}${rar.label}§8]`);
}

function handleClick(player, block, heldTypeId, sneaking) {
  const loc = block.location;
  const key = keyOf(block.dimension.id, loc.x, loc.y, loc.z);
  const entry = loadSpawners().get(key) || importLegacy(block);
  if (entry) {
    if (sneaking) {
      openSpawnerUI(player, key);
    } else {
      retrieveTemplate(player, key);
    }
    return;
  }
  insertTemplate(player, block, key, heldTypeId);
}

function runClick(player, dimension, loc, heldTypeId, sneaking) {
  try {
    const block = dimension.getBlock(loc);
    if (!block || block.typeId !== BLOCK_ID) return;
    const who = String(player.id !== undefined ? player.id : player.name);
    const now = nowTick();
    const last = lastClick.get(who);
    if (last !== undefined && now - last < CLICK_COOLDOWN) return;
    lastClick.set(who, now);
    handleClick(player, block, heldTypeId, sneaking);
  } catch (e) {}
}

const beforeInteract = world.beforeEvents && world.beforeEvents.playerInteractWithBlock;
if (beforeInteract && typeof beforeInteract.subscribe === "function") {
  beforeInteract.subscribe((event) => {
    const block = event.block;
    if (!block || block.typeId !== BLOCK_ID) return;
    event.cancel = true;
    if (event.isFirstEvent === false) return;
    const player = event.player;
    const dimension = block.dimension;
    const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
    const held = event.itemStack ? event.itemStack.typeId : undefined;
    const sneaking = player.isSneaking === true;
    system.run(() => runClick(player, dimension, loc, held, sneaking));
  });
} else {
  world.afterEvents.playerInteractWithBlock.subscribe(({ player, block, beforeItemStack }) => {
    if (block.typeId !== BLOCK_ID) return;
    const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
    runClick(player, block.dimension, loc, beforeItemStack ? beforeItemStack.typeId : undefined, player.isSneaking === true);
  });
}

try {
  if (world.beforeEvents && world.beforeEvents.entityHurt && typeof world.beforeEvents.entityHurt.subscribe === "function") {
    world.beforeEvents.entityHurt.subscribe((event) => {
      if (isDisplay(event.hurtEntity)) event.cancel = true;
    });
  }
} catch (e) {}

try {
  if (world.beforeEvents && world.beforeEvents.playerInteractWithEntity && typeof world.beforeEvents.playerInteractWithEntity.subscribe === "function") {
    world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
      if (isDisplay(event.target)) event.cancel = true;
    });
  }
} catch (e) {}

try {
  world.afterEvents.entityDie.subscribe((event) => {
    const dead = event.deadEntity;
    let dimension;
    let where;
    try {
      if (!isDisplay(dead)) return;
      dimension = dead.dimension;
      where = dead.location;
    } catch (e) {
      return;
    }
    system.run(() => {
      let template;
      for (const entry of loadSpawners().values()) {
        if (entry.d === dimension.id && Math.abs(entry.x + 0.5 - where.x) <= 1.6 && Math.abs(entry.z + 0.5 - where.z) <= 1.6) template = entry.item;
      }
      try {
        for (const drop of dimension.getEntities({ type: "minecraft:item", location: where, maxDistance: 3 })) {
          const stack = drop.getComponent("minecraft:item").itemStack;
          if (stack && (stack.typeId === DISPLAY_TYPE || stack.typeId === template)) drop.remove();
        }
      } catch (e) {}
    });
  });
} catch (e) {}

function sweepOrphans() {
  const reg = loadSpawners();
  for (const dimId of DIMENSIONS) {
    let list;
    try {
      list = world.getDimension(dimId).getEntities({ type: DISPLAY_TYPE, tags: [DISPLAY_TAG] });
    } catch (e) {
      continue;
    }
    for (const stand of list) {
      let owned = false;
      try {
        for (const entry of reg.values()) {
          if (entry.d === dimId && Math.abs(entry.x + 0.5 - stand.location.x) <= 1.6 && Math.abs(entry.z + 0.5 - stand.location.z) <= 1.6) owned = true;
        }
        if (!owned) stand.remove();
      } catch (e) {}
    }
  }
}

system.runInterval(() => {
  const reg = loadSpawners();
  if (reg.size === 0) return;
  steps++;

  let changed = false;
  for (const [key, entry] of [...reg.entries()]) {
    let dimension;
    let block;
    try {
      dimension = world.getDimension(entry.d);
      block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
    } catch (e) {
      continue;
    }
    if (!block) continue;

    if (block.typeId !== BLOCK_ID) {
      const count = (misses.get(key) || 0) + 1;
      if (count >= 2) {
        dropTemplate(dimension, entry);
        removeDisplay(dimension, entry, key);
        reg.delete(key);
        misses.delete(key);
        changed = true;
      } else {
        misses.set(key, count);
      }
      continue;
    }
    misses.delete(key);

    const total = (RARITY[entry.rarity] || RARITY.common).ticks;
    entry.left -= STEP_TICKS;
    dirty = true;

    if (entry.left <= 0) {
      entry.left = total;
      ejectDuplicate(dimension, entry);
    } else if (nearbyPlayers(entry, SPARK_RANGE).length > 0) {
      const progress = 1 - entry.left / total;
      sparks(dimension, entry, 1 + Math.floor(progress * 5));
    }
  }

  if (changed || (dirty && steps % SAVE_EVERY_STEPS === 0)) saveSpawners();
  if (FLOATING_DISPLAY && steps % SWEEP_EVERY_STEPS === 0) sweepOrphans();
}, STEP_TICKS);

system.runInterval(() => {
  if (!FLOATING_DISPLAY) return;
  const reg = loadSpawners();
  if (reg.size === 0) return;
  displayTick++;
  for (const [key, entry] of reg.entries()) {
    if (nearbyPlayers(entry, DISPLAY_RANGE).length === 0) continue;
    let dimension;
    try {
      dimension = world.getDimension(entry.d);
      const block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
      if (!block || block.typeId !== BLOCK_ID) continue;
    } catch (e) {
      continue;
    }
    const stand = ensureDisplay(dimension, entry, key);
    if (stand) animateDisplay(stand, entry, key);
  }
}, DISPLAY_STEP);
