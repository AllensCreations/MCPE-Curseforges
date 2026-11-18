import { world, system, EquipmentSlot } from "@minecraft/server";
import {
  HEADPHONES_ID,
  JUKEBOX_ID,
  LISTEN_TAG,
  MUTE_WINDOW_TICKS,
  PREFIX,
  formatTime,
  parsePairing,
  readJukebox
} from "./headphone_common.js";

const STREAM_INTERVAL_TICKS = 5;
const PAIRED = "\u00a7aPaired \u00a78| ";
const listening = new Set();
const streams = new Map();

function stopAudio(player) {
  const stream = streams.get(player.id);
  if (stream) {
    streams.delete(player.id);
    try {
      player.runCommand("stopsound @s " + stream.soundId);
    } catch (error) {}
  }
  try {
    if (player.hasTag(LISTEN_TAG)) {
      player.removeTag(LISTEN_TAG);
    }
  } catch (error) {}
}

function ensureStream(player, status) {
  const current = streams.get(player.id);
  if (current && current.trackStart === status.startTick && current.soundId === status.info.soundId) {
    return current;
  }
  if (system.currentTick - status.startTick < MUTE_WINDOW_TICKS + 2) {
    return undefined;
  }
  if (current) {
    stopAudio(player);
  }
  try {
    player.addTag(LISTEN_TAG);
    player.playSound(status.info.soundId, { volume: 1.0 });
  } catch (error) {}
  const stream = {
    soundId: status.info.soundId,
    name: status.info.name,
    total: status.info.totalSeconds,
    trackStart: status.startTick,
    startedTick: system.currentTick
  };
  streams.set(player.id, stream);
  return stream;
}

function streamElapsed(stream) {
  const seconds = (system.currentTick - stream.startedTick) / 20;
  return stream.total === undefined ? seconds : Math.min(seconds, stream.total);
}

function nowPlaying(stream) {
  const total = stream.total === undefined ? "--:--" : formatTime(stream.total);
  return (
    PREFIX +
    PAIRED +
    "\u00a7fNow Playing: \u00a7e" +
    stream.name +
    " \u00a78| \u00a7b[ " +
    formatTime(streamElapsed(stream)) +
    " / " +
    total +
    " ]"
  );
}

function renderFeedAndStream(player, item) {
  const pairing = parsePairing(item);
  if (!pairing) {
    stopAudio(player);
    return PREFIX + "\u00a77Not paired. Sneak and use on a Jukebox.";
  }
  let dimension;
  try {
    dimension = world.getDimension(pairing.dimension);
  } catch (error) {
    stopAudio(player);
    return PREFIX + PAIRED + "\u00a7cJukebox dimension is unavailable.";
  }
  const location = { x: pairing.x, y: pairing.y, z: pairing.z };
  if (!dimension.isChunkLoaded(location)) {
    stopAudio(player);
    return PREFIX + PAIRED + "\u00a7cJukebox is not loaded.";
  }
  const block = dimension.getBlock(location);
  if (!block || block.typeId !== JUKEBOX_ID) {
    stopAudio(player);
    return PREFIX + PAIRED + "\u00a7cJukebox no longer exists.";
  }
  const status = readJukebox(block, pairing.dimension);
  if (status.state === "empty") {
    stopAudio(player);
    return PREFIX + PAIRED + "\u00a77Jukebox has no disc.";
  }
  if (status.state === "stopped") {
    const stream = streams.get(player.id);
    if (stream && stream.total !== undefined && streamElapsed(stream) < stream.total) {
      return nowPlaying(stream);
    }
    stopAudio(player);
    return PREFIX + PAIRED + "\u00a77Waiting for the next track. \u00a78| \u00a7e" + status.info.name;
  }
  if (status.state !== "playing") {
    stopAudio(player);
    return PREFIX + PAIRED + "\u00a7cJukebox data unavailable.";
  }
  const stream = ensureStream(player, status);
  if (!stream) {
    return PREFIX + PAIRED + "\u00a77Syncing...";
  }
  return nowPlaying(stream);
}

system.runInterval(() => {
  const present = new Set();
  for (const player of world.getAllPlayers()) {
    present.add(player.id);
    try {
      const equippable = player.getComponent("minecraft:equippable");
      const head = equippable ? equippable.getEquipment(EquipmentSlot.Head) : undefined;
      if (head && head.typeId === HEADPHONES_ID) {
        listening.add(player.id);
        player.onScreenDisplay.setActionBar(renderFeedAndStream(player, head));
      } else if (listening.has(player.id)) {
        listening.delete(player.id);
        stopAudio(player);
        player.onScreenDisplay.setActionBar("");
      } else if (player.hasTag(LISTEN_TAG)) {
        player.removeTag(LISTEN_TAG);
      }
    } catch (error) {
      continue;
    }
  }
  for (const id of listening) {
    if (!present.has(id)) {
      listening.delete(id);
      streams.delete(id);
    }
  }
}, STREAM_INTERVAL_TICKS);
