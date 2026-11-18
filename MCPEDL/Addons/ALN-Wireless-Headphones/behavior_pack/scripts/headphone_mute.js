import { world, system } from "@minecraft/server";
import {
  JUKEBOX_ID,
  LISTEN_TAG,
  MUTE_WINDOW_TICKS,
  loadRegistry,
  saveRegistry,
  releaseLoaded,
  readJukebox
} from "./headphone_common.js";

const MUTE_INTERVAL_TICKS = 5;

system.runInterval(() => {
  const list = loadRegistry();
  if (list.length === 0) {
    return;
  }
  const keep = [];
  for (const entry of list) {
    let dimension;
    try {
      dimension = world.getDimension(entry.dimension);
    } catch (error) {
      keep.push(entry);
      continue;
    }
    const location = { x: entry.x, y: entry.y, z: entry.z };
    try {
      if (!dimension.isChunkLoaded(location)) {
        keep.push(entry);
        continue;
      }
      const block = dimension.getBlock(location);
      if (!block) {
        keep.push(entry);
        continue;
      }
      if (block.typeId !== JUKEBOX_ID) {
        releaseLoaded(entry);
        continue;
      }
      keep.push(entry);
      const status = readJukebox(block, entry.dimension);
      if (status.state !== "playing") {
        continue;
      }
      const everyone = status.info.aliased || system.currentTick - status.startTick <= MUTE_WINDOW_TICKS;
      const selector = everyone ? "@a" : "@a[tag=!" + LISTEN_TAG + "]";
      dimension.runCommand("stopsound " + selector + " " + status.info.soundId);
    } catch (error) {
      keep.push(entry);
    }
  }
  if (keep.length !== list.length) {
    saveRegistry(keep);
  }
}, MUTE_INTERVAL_TICKS);
