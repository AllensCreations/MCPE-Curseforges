import { world, system } from "@minecraft/server";

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
const EVENT_STARTED = "aln:disc_started";
const EVENT_STOPPED = "aln:disc_stopped";
const EVENT_QUERY = "aln:disc_query";
const PLAY_FROM_SCRIPT = false;
const CHECK_INTERVAL = 40;
const SETTLE_DELAY = 3;
const SOUND_VOLUME = 4;

const active = new Map();
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
      if (entry && typeof entry.id === "string" && DISCS[entry.disc]) active.set(entry.id, entry);
    }
  } catch (error) {
    active.clear();
  }
}

function save() {
  try {
    world.setDynamicProperty(STATE_KEY, JSON.stringify([...active.values()]));
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
  if (!PLAY_FROM_SCRIPT) return;
  for (const other of active.values()) {
    if (other.disc === disc) return;
  }
  try {
    world.getDimension("overworld").runCommand(`stopsound @a ${DISCS[disc].sound}`);
  } catch (error) {}
}

function stopTrack(id, reason) {
  const entry = active.get(id);
  if (!entry) return;
  active.delete(id);
  save();
  send(EVENT_STOPPED, { id, disc: entry.disc, track: entry.track, reason });
  stopSound(entry.disc);
}

function startTrack(dimension, x, y, z, discId) {
  const disc = DISCS[discId];
  if (!disc) return;
  const id = keyOf(dimension.id, x, y, z);
  const previous = active.get(id);
  if (previous && previous.disc === discId) return;
  if (previous) stopTrack(id, "replaced");
  const entry = {
    id,
    dim: dimension.id,
    x,
    y,
    z,
    disc: discId,
    track: disc.track,
    title: disc.title,
    seconds: disc.seconds,
    startedAt: Date.now(),
  };
  active.set(id, entry);
  save();
  send(EVENT_STARTED, entry);
  if (PLAY_FROM_SCRIPT) {
    try {
      dimension.playSound(disc.sound, { x: x + 0.5, y: y + 1, z: z + 0.5 }, { volume: SOUND_VOLUME, pitch: 1 });
    } catch (error) {}
  }
  spawnNotes(dimension, x, y, z);
}

function settle(dimensionId, location, heldTypeId) {
  load();
  const dimension = world.getDimension(dimensionId);
  const { x, y, z } = location;
  const id = keyOf(dimensionId, x, y, z);
  let block;
  try {
    block = dimension.getBlock(location);
  } catch (error) {
    return;
  }
  if (!block) return;
  if (block.typeId !== JUKEBOX) {
    stopTrack(id, "broken");
    return;
  }
  let known = false;
  let recordId;
  try {
    const player = block.getComponent("minecraft:record_player");
    if (player) {
      const record = player.getRecord();
      recordId = record ? record.typeId : undefined;
      known = true;
    }
  } catch (error) {}
  if (known) {
    if (recordId && DISCS[recordId]) startTrack(dimension, x, y, z, recordId);
    else stopTrack(id, "ejected");
    return;
  }
  if (active.has(id)) stopTrack(id, "ejected");
  else if (heldTypeId && DISCS[heldTypeId]) startTrack(dimension, x, y, z, heldTypeId);
}

function tick() {
  load();
  if (active.size === 0) return;
  const now = Date.now();
  for (const [id, entry] of [...active]) {
    let block;
    try {
      block = world.getDimension(entry.dim).getBlock({ x: entry.x, y: entry.y, z: entry.z });
    } catch (error) {
      continue;
    }
    if (!block) continue;
    if (block.typeId !== JUKEBOX) {
      stopTrack(id, "broken");
      continue;
    }
    if (now - entry.startedAt >= entry.seconds * 1000 + 2000) {
      stopTrack(id, "ended");
      continue;
    }
    spawnNotes(block.dimension, entry.x, entry.y, entry.z);
  }
}

export function getActiveDiscs() {
  load();
  return [...active.values()];
}

export function initDiscJukebox() {
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { block, player, itemStack, isFirstEvent } = event;
    if (!isFirstEvent || block.typeId !== JUKEBOX) return;
    if (player.isSneaking && itemStack) return;
    const dimensionId = block.dimension.id;
    const location = { x: block.location.x, y: block.location.y, z: block.location.z };
    const held = itemStack ? itemStack.typeId : undefined;
    system.runTimeout(() => settle(dimensionId, location, held), SETTLE_DELAY);
  });

  world.afterEvents.playerBreakBlock.subscribe((event) => {
    if (event.brokenBlockPermutation.type.id !== JUKEBOX) return;
    const { x, y, z } = event.block.location;
    const id = keyOf(event.block.dimension.id, x, y, z);
    system.run(() => {
      load();
      stopTrack(id, "broken");
    });
  });

  system.afterEvents.scriptEventReceive.subscribe(
    (event) => {
      if (event.id !== EVENT_QUERY) return;
      load();
      for (const entry of active.values()) send(EVENT_STARTED, entry);
    },
    { namespaces: ["aln"] }
  );

  system.runInterval(tick, CHECK_INTERVAL);
}
