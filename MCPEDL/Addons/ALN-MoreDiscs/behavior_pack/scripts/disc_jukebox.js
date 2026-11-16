import { world, system } from "@minecraft/server";

const DISCS = {
  "aln:disc_1": { track: 1, title: "Neon Horizon", seconds: 76, sound: "record.aln_track_1" },
  "aln:disc_2": { track: 2, title: "Ember Lantern", seconds: 82, sound: "record.aln_track_2" },
  "aln:disc_3": { track: 3, title: "Quiet Tides", seconds: 85, sound: "record.aln_track_3" },
  "aln:disc_4": { track: 4, title: "Crystal Caverns", seconds: 58, sound: "record.aln_track_4" },
  "aln:disc_5": { track: 5, title: "Starlight Express", seconds: 70, sound: "record.aln_track_5" }
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
