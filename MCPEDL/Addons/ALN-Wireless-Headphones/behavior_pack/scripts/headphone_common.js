import { world, system } from "@minecraft/server";

export const HEADPHONES_ID = "aln:headphones";
export const PAIR_KEY = "aln_paired_jukebox";
export const REGISTRY_KEY = "aln_hp_jukeboxes";
export const LISTEN_TAG = "aln_hp_listening";
export const JUKEBOX_ID = "minecraft:jukebox";
export const PREFIX = "\u00a7d[\u266b HEADPHONES] ";
export const MUTE_WINDOW_TICKS = 20;

const DISCS = {
  "13": ["C418 - 13", 178],
  "cat": ["C418 - cat", 185],
  "blocks": ["C418 - blocks", 345],
  "chirp": ["C418 - chirp", 185],
  "far": ["C418 - far", 174],
  "mall": ["C418 - mall", 197],
  "mellohi": ["C418 - mellohi", 96],
  "stal": ["C418 - stal", 150],
  "strad": ["C418 - strad", 188],
  "ward": ["C418 - ward", 251],
  "11": ["C418 - 11", 71],
  "wait": ["C418 - wait", 238],
  "pigstep": ["Lena Raine - Pigstep", 148],
  "otherside": ["Lena Raine - otherside", 195],
  "5": ["Samuel \u00c5berg - 5", 178],
  "relic": ["Aaron Cherof - Relic", 218],
  "creator": ["Lena Raine - Creator", 176],
  "creator_music_box": ["Lena Raine - Creator (Music Box)", 73],
  "precipice": ["Aaron Cherof - Precipice", 299],
  "tears": ["Amos Roddy - Tears", 175],
  "lava_chicken": ["Hyper Potions - Lava Chicken", 134],
  "bounce": ["fingerspit - Bounce", 234]
};

const sessions = new Map();

export function sessionKey(dimensionId, x, y, z) {
  return dimensionId + ":" + x + "," + y + "," + z;
}

export function discInfo(typeId) {
  const shortId = typeId.replace("minecraft:", "").replace(/^(music_disc_|record_)/, "");
  const known = DISCS[shortId];
  const soundId = "record." + shortId;
  if (known) {
    return { name: known[0], totalSeconds: known[1], soundId };
  }
  return { name: shortId.replace(/_/g, " "), totalSeconds: undefined, soundId };
}

export function formatTime(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

export function getRecordPlayer(block) {
  try {
    return block.getComponent("minecraft:record_player");
  } catch (error) {
    return undefined;
  }
}

export function resetSession(dimensionId, x, y, z) {
  sessions.delete(sessionKey(dimensionId, x, y, z));
}

export function readJukebox(block, dimensionId) {
  const player = getRecordPlayer(block);
  const key = sessionKey(dimensionId, block.location.x, block.location.y, block.location.z);
  if (!player) {
    sessions.delete(key);
    return { state: "invalid" };
  }
  let record;
  let playing = false;
  try {
    record = player.getRecord();
    playing = player.isPlaying();
  } catch (error) {
    sessions.delete(key);
    return { state: "invalid" };
  }
  if (!record) {
    sessions.delete(key);
    return { state: "empty" };
  }
  const info = discInfo(record.typeId);
  if (!playing) {
    sessions.delete(key);
    return { state: "stopped", info };
  }
  let session = sessions.get(key);
  if (!session || session.typeId !== record.typeId) {
    session = { typeId: record.typeId, startTick: system.currentTick };
    sessions.set(key, session);
  }
  let elapsedSeconds = (system.currentTick - session.startTick) / 20;
  if (info.totalSeconds !== undefined && elapsedSeconds >= info.totalSeconds + 2) {
    sessions.delete(key);
    return { state: "stopped", info };
  }
  if (info.totalSeconds !== undefined) {
    elapsedSeconds = Math.min(elapsedSeconds, info.totalSeconds);
  }
  return { state: "playing", info, elapsedSeconds, startTick: session.startTick };
}

export function parsePairing(item) {
  const raw = item.getDynamicProperty(PAIR_KEY);
  if (typeof raw !== "string") {
    return undefined;
  }
  try {
    const data = JSON.parse(raw);
    if (
      typeof data.x === "number" &&
      typeof data.y === "number" &&
      typeof data.z === "number" &&
      typeof data.dimension === "string"
    ) {
      return data;
    }
  } catch (error) {
    return undefined;
  }
  return undefined;
}

export function samePos(a, b) {
  return a.x === b.x && a.y === b.y && a.z === b.z && a.dimension === b.dimension;
}

export function loadRegistry() {
  const raw = world.getDynamicProperty(REGISTRY_KEY);
  if (typeof raw !== "string") {
    return [];
  }
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (error) {
    return [];
  }
}

export function saveRegistry(list) {
  world.setDynamicProperty(REGISTRY_KEY, JSON.stringify(list));
}

export function isRegistered(pos) {
  return loadRegistry().some((entry) => samePos(entry, pos));
}

export function addToRegistry(pos) {
  const list = loadRegistry();
  if (!list.some((entry) => samePos(entry, pos))) {
    list.push({ x: pos.x, y: pos.y, z: pos.z, dimension: pos.dimension });
    saveRegistry(list);
  }
}

export function removeFromRegistry(pos) {
  saveRegistry(loadRegistry().filter((entry) => !samePos(entry, pos)));
}

function areaName(pos) {
  const part = (n) => String(n).replace("-", "n");
  return "alnhp_" + pos.dimension.replace("minecraft:", "") + "_" + part(pos.x) + "_" + part(pos.y) + "_" + part(pos.z);
}

export function keepLoaded(pos) {
  try {
    const dimension = world.getDimension(pos.dimension);
    const result = dimension.runCommand(
      "tickingarea add circle " + pos.x + " " + pos.y + " " + pos.z + " 1 " + areaName(pos)
    );
    return result.successCount > 0;
  } catch (error) {
    return false;
  }
}

export function releaseLoaded(pos) {
  try {
    world.getDimension(pos.dimension).runCommand("tickingarea remove " + areaName(pos));
  } catch (error) {
    return;
  }
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const block = event.block;
  if (block.typeId !== JUKEBOX_ID) {
    return;
  }
  const dimensionId = block.dimension.id;
  const location = block.location;
  resetSession(dimensionId, location.x, location.y, location.z);
  system.runTimeout(() => {
    try {
      const fresh = block.dimension.getBlock(location);
      if (fresh && fresh.typeId === JUKEBOX_ID) {
        readJukebox(fresh, dimensionId);
      }
    } catch (error) {
      return;
    }
  }, 2);
});
