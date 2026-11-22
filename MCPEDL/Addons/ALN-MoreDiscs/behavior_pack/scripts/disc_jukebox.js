import * as mc from "@minecraft/server";

const { world, system } = mc;

const DISCS = {
  "aln:music_disc_neon_horizon": { track: 1, title: "Neon Horizon", seconds: 76, sound: "record.neon_horizon" },
  "aln:music_disc_ember_lantern": { track: 2, title: "Ember Lantern", seconds: 82, sound: "record.ember_lantern" },
  "aln:music_disc_quiet_tides": { track: 3, title: "Quiet Tides", seconds: 85, sound: "record.quiet_tides" },
  "aln:music_disc_crystal_caverns": { track: 4, title: "Crystal Caverns", seconds: 58, sound: "record.crystal_caverns" },
  "aln:music_disc_starlight_express": { track: 5, title: "Starlight Express", seconds: 70, sound: "record.starlight_express" },
  "aln:music_disc_midnight_drive": { track: 6, title: "Midnight Drive", seconds: 75, sound: "record.midnight_drive" },
  "aln:music_disc_sunlit_meadow": { track: 7, title: "Sunlit Meadow", seconds: 55, sound: "record.sunlit_meadow" },
  "aln:music_disc_deepslate_echoes": { track: 8, title: "Deepslate Echoes", seconds: 85, sound: "record.deepslate_echoes" },
  "aln:music_disc_pixel_parade": { track: 9, title: "Pixel Parade", seconds: 71, sound: "record.pixel_parade" },
  "aln:music_disc_golden_hour": { track: 10, title: "Golden Hour", seconds: 84, sound: "record.golden_hour" },
  "aln:music_disc_first_night": { track: 11, title: "First Night", seconds: 80, sound: "record.first_night" },
  "aln:music_disc_cobblestone_dawn": { track: 12, title: "Cobblestone Dawn", seconds: 70, sound: "record.cobblestone_dawn" },
  "aln:music_disc_crafting_table_memories": { track: 13, title: "Crafting Table Memories", seconds: 60, sound: "record.crafting_table_memories" },
  "aln:music_disc_alpha_sunrise": { track: 14, title: "Alpha Sunrise", seconds: 76, sound: "record.alpha_sunrise" },
  "aln:music_disc_beta_lullaby": { track: 15, title: "Beta Lullaby", seconds: 63, sound: "record.beta_lullaby" },
  "aln:music_disc_village_dusk": { track: 16, title: "Village Dusk", seconds: 72, sound: "record.village_dusk" },
  "aln:music_disc_wooden_pickaxe": { track: 17, title: "Wooden Pickaxe", seconds: 73, sound: "record.wooden_pickaxe" },
  "aln:music_disc_torchlight": { track: 18, title: "Torchlight", seconds: 86, sound: "record.torchlight" },
  "aln:music_disc_dirt_house_blues": { track: 19, title: "Dirt House Blues", seconds: 65, sound: "record.dirt_house_blues" },
  "aln:music_disc_bedtime_beacon": { track: 20, title: "Bedtime Beacon", seconds: 92, sound: "record.bedtime_beacon" },
  "aln:music_disc_rainy_window": { track: 21, title: "Rainy Window", seconds: 78, sound: "record.rainy_window" },
  "aln:music_disc_old_world_seed": { track: 22, title: "Old World Seed", seconds: 58, sound: "record.old_world_seed" },
  "aln:music_disc_minecart_lullaby": { track: 23, title: "Minecart Lullaby", seconds: 63, sound: "record.minecart_lullaby" },
  "aln:music_disc_lava_lamp_nights": { track: 24, title: "Lava Lamp Nights", seconds: 89, sound: "record.lava_lamp_nights" },
  "aln:music_disc_sheep_counting": { track: 25, title: "Sheep Counting", seconds: 66, sound: "record.sheep_counting" },
  "aln:music_disc_snowy_taiga_walk": { track: 26, title: "Snowy Taiga Walk", seconds: 74, sound: "record.snowy_taiga_walk" },
  "aln:music_disc_floppy_disk_summer": { track: 27, title: "Floppy Disk Summer", seconds: 68, sound: "record.floppy_disk_summer" },
  "aln:music_disc_creeper_waltz": { track: 28, title: "Creeper Waltz", seconds: 70, sound: "record.creeper_waltz" },
  "aln:music_disc_pixel_postcards": { track: 29, title: "Pixel Postcards", seconds: 76, sound: "record.pixel_postcards" },
  "aln:music_disc_sunset_hotbar": { track: 30, title: "Sunset Hotbar", seconds: 70, sound: "record.sunset_hotbar" }
};

const JUKEBOX = "minecraft:jukebox";
const STATE_KEY = "aln_morediscs:active";
const STATE_VERSION = 2;
const EVENT_STARTED = "aln:disc_started";
const EVENT_STOPPED = "aln:disc_stopped";
const EVENT_QUERY = "aln:disc_query";
const CHECK_INTERVAL = 40;
const SOUND_VOLUME = 4;
const MAINHAND = (mc.EquipmentSlot && mc.EquipmentSlot.Mainhand) || "Mainhand";

// Every disc that sits in a Jukebox, playing or finished, keyed by dimension and position.
const stored = new Map();
let loaded = false;

function keyOf(dimensionId, x, y, z) {
  return `${dimensionId}|${x}|${y}|${z}`;
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    const raw = world.getDynamicProperty(STATE_KEY);
    if (typeof raw !== "string") return;
    for (const entry of JSON.parse(raw)) {
      if (entry && entry.v === STATE_VERSION && typeof entry.id === "string" && DISCS[entry.disc]) {
        entry.playing = false;
        stored.set(entry.id, entry);
      }
    }
  } catch (error) {
    stored.clear();
  }
}

function save() {
  try {
    world.setDynamicProperty(STATE_KEY, JSON.stringify([...stored.values()]));
  } catch (error) {}
}

function send(eventId, payload) {
  try {
    world.getDimension("overworld").runCommand(`scriptevent ${eventId} ${JSON.stringify(payload)}`);
  } catch (error) {}
}

function spawnNotes(dimension, x, y, z) {
  try {
    dimension.spawnParticle("minecraft:note_particle", { x: x + 0.5, y: y + 1.2, z: z + 0.5 });
  } catch (error) {}
}

function stopSound(disc) {
  for (const other of stored.values()) {
    if (other.playing && other.disc === disc) return;
  }
  try {
    world.getDimension("overworld").runCommand(`stopsound @a ${DISCS[disc].sound}`);
  } catch (error) {}
}

function stopPlaying(entry, reason) {
  if (!entry.playing) return;
  entry.playing = false;
  save();
  send(EVENT_STOPPED, { id: entry.id, disc: entry.disc, track: entry.track, reason });
  if (reason !== "ended") stopSound(entry.disc);
}

function removeDisc(entry, reason, dimension, dropHeight) {
  stopPlaying(entry, reason);
  stored.delete(entry.id);
  save();
  try {
    dimension.spawnItem(new mc.ItemStack(entry.disc, 1), { x: entry.x + 0.5, y: entry.y + dropHeight, z: entry.z + 0.5 });
  } catch (error) {}
}

function startTrack(dimension, entry) {
  entry.playing = true;
  entry.startedAt = Date.now();
  save();
  send(EVENT_STARTED, entry);
  try {
    dimension.playSound(DISCS[entry.disc].sound, { x: entry.x + 0.5, y: entry.y + 1, z: entry.z + 0.5 }, { volume: SOUND_VOLUME, pitch: 1 });
  } catch (error) {}
  spawnNotes(dimension, entry.x, entry.y, entry.z);
}

function heldSlot(player) {
  try {
    return player.getComponent("minecraft:equippable").getEquipmentSlot(MAINHAND);
  } catch (error) {}
  try {
    return player.getComponent("minecraft:inventory").container.getSlot(player.selectedSlotIndex);
  } catch (error) {}
  return undefined;
}

function takeHeldDisc(player, discId) {
  try {
    const slot = heldSlot(player);
    if (!slot) return false;
    const item = slot.getItem();
    if (!item || item.typeId !== discId) return false;
    if (item.amount > 1) slot.amount = item.amount - 1;
    else slot.setItem(undefined);
    const after = slot.getItem();
    return !(after && after.typeId === discId && after.amount >= item.amount);
  } catch (error) {
    return false;
  }
}

function insertDisc(player, dimensionId, location, discId) {
  load();
  const disc = DISCS[discId];
  const dimension = world.getDimension(dimensionId);
  const id = keyOf(dimensionId, location.x, location.y, location.z);
  if (stored.has(id)) return;
  let block;
  try {
    block = dimension.getBlock(location);
  } catch (error) {
    return;
  }
  if (!block || block.typeId !== JUKEBOX) return;
  if (!takeHeldDisc(player, discId)) return;
  const entry = {
    v: STATE_VERSION,
    id,
    dim: dimensionId,
    x: location.x,
    y: location.y,
    z: location.z,
    disc: discId,
    track: disc.track,
    title: disc.title,
    seconds: disc.seconds,
    startedAt: 0,
    playing: false,
  };
  stored.set(id, entry);
  startTrack(dimension, entry);
}

function ejectDisc(id) {
  load();
  const entry = stored.get(id);
  if (!entry) return;
  removeDisc(entry, "ejected", world.getDimension(entry.dim), 1.1);
}

function vanillaRecordInside(block) {
  try {
    const recordPlayer = block.getComponent("minecraft:record_player");
    return !!(recordPlayer && recordPlayer.getRecord());
  } catch (error) {
    return false;
  }
}

function tick() {
  load();
  if (stored.size === 0) return;
  const now = Date.now();
  for (const entry of [...stored.values()]) {
    let dimension;
    let block;
    try {
      dimension = world.getDimension(entry.dim);
      block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
    } catch (error) {
      continue;
    }
    if (!block) continue;
    if (block.typeId !== JUKEBOX) {
      removeDisc(entry, "broken", dimension, 0.5);
      continue;
    }
    if (!entry.playing) continue;
    if (now - entry.startedAt >= entry.seconds * 1000 + 2000) {
      stopPlaying(entry, "ended");
      continue;
    }
    spawnNotes(dimension, entry.x, entry.y, entry.z);
  }
}

export function getActiveDiscs() {
  load();
  return [...stored.values()].filter((entry) => entry.playing);
}

export function initDiscJukebox() {
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player, itemStack, isFirstEvent } = event;
    if (!isFirstEvent || block.typeId !== JUKEBOX) return;
    if (player.isSneaking && itemStack) return;
    load();
    const dimensionId = block.dimension.id;
    const location = { x: block.location.x, y: block.location.y, z: block.location.z };
    const id = keyOf(dimensionId, location.x, location.y, location.z);
    if (stored.has(id)) {
      event.cancel = true;
      system.run(() => ejectDisc(id));
      return;
    }
    const held = itemStack ? itemStack.typeId : undefined;
    if (!held || !DISCS[held] || vanillaRecordInside(block)) return;
    event.cancel = true;
    system.run(() => insertDisc(player, dimensionId, location, held));
  });

  world.afterEvents.playerBreakBlock.subscribe((event) => {
    if (event.brokenBlockPermutation.type.id !== JUKEBOX) return;
    const { x, y, z } = event.block.location;
    const id = keyOf(event.block.dimension.id, x, y, z);
    system.run(() => {
      load();
      const entry = stored.get(id);
      if (entry) removeDisc(entry, "broken", world.getDimension(entry.dim), 0.5);
    });
  });

  system.afterEvents.scriptEventReceive.subscribe(
    (event) => {
      if (event.id !== EVENT_QUERY) return;
      load();
      for (const entry of stored.values()) {
        if (entry.playing) send(EVENT_STARTED, entry);
      }
    },
    { namespaces: ["aln"] }
  );

  system.runInterval(tick, CHECK_INTERVAL);
}
