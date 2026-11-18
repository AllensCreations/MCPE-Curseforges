import { world, system, EquipmentSlot } from "@minecraft/server";
import {
  HEADPHONES_ID,
  PAIR_KEY,
  JUKEBOX_ID,
  PREFIX,
  formatTime,
  readJukebox,
  resetSession
} from "./headphone_common.js";

const STREAM_INTERVAL_TICKS = 10;
const listening = new Set();
const playerAudioState = new Map();

function stopPlayerAudio(player) {
  if (playerAudioState.has(player.id)) {
    playerAudioState.delete(player.id);
    try {
      player.stopMusic();
    } catch (e) {}
  }
}

function syncPlayerAudio(player, trackSoundId) {
  const current = playerAudioState.get(player.id);
  if (current !== trackSoundId) {
    playerAudioState.set(player.id, trackSoundId);
    try {
      player.playMusic(trackSoundId, {
        volume: 1.0,
        fade: 0.0,
        loop: false
      });
    } catch (e) {}
  }
}

function parsePairing(item) {
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

function renderFeedAndStream(player, item) {
  const pairing = parsePairing(item);
  if (!pairing) {
    stopPlayerAudio(player);
    return PREFIX + "\u00a77Not paired. Sneak and use on a Jukebox with a disc.";
  }
  let dimension;
  try {
    dimension = world.getDimension(pairing.dimension);
  } catch (error) {
    stopPlayerAudio(player);
    return PREFIX + "\u00a7cDisconnected. Jukebox dimension is unavailable.";
  }
  const location = { x: pairing.x, y: pairing.y, z: pairing.z };
  if (!dimension.isChunkLoaded(location)) {
    resetSession(pairing.dimension, pairing.x, pairing.y, pairing.z);
    stopPlayerAudio(player);
    return PREFIX + "\u00a7cDisconnected. Jukebox chunk is not loaded.";
  }
  const block = dimension.getBlock(location);
  if (!block || block.typeId !== JUKEBOX_ID) {
    stopPlayerAudio(player);
    return PREFIX + "\u00a7cDisconnected. Paired Jukebox no longer exists.";
  }
  const status = readJukebox(block, pairing.dimension);
  if (status.state === "empty") {
    stopPlayerAudio(player);
    return PREFIX + "\u00a77Jukebox has no disc.";
  }
  if (status.state === "stopped") {
    stopPlayerAudio(player);
    return PREFIX + "\u00a77Jukebox is not playing. \u00a78| \u00a7e" + status.info.name;
  }
  if (status.state !== "playing") {
    stopPlayerAudio(player);
    return PREFIX + "\u00a7cJukebox data unavailable.";
  }

  // Jukebox is actively playing: stream the music disc directly into the player's headphones
  if (status.info.soundId) {
    syncPlayerAudio(player, status.info.soundId);
  }

  const total = status.info.totalSeconds === undefined ? "--:--" : formatTime(status.info.totalSeconds);
  return (
    PREFIX +
    "\u00a7fNow Playing: \u00a7e" +
    status.info.name +
    " \u00a78| \u00a7b[ " +
    formatTime(status.elapsedSeconds) +
    " / " +
    total +
    " ]"
  );
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
        stopPlayerAudio(player);
        player.onScreenDisplay.setActionBar("");
      }
    } catch (error) {
      continue;
    }
  }
  for (const id of listening) {
    if (!present.has(id)) {
      listening.delete(id);
      playerAudioState.delete(id);
    }
  }
}, STREAM_INTERVAL_TICKS);
