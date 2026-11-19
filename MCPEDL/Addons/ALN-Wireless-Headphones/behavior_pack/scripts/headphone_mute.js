import { world, system } from "@minecraft/server";
import {
  JUKEBOX_ID,
  LISTEN_TAG,
  MUTE_WINDOW_TICKS,
  loadRegistry,
  saveRegistry,
  releaseLoaded,
  keepLoaded,
  readJukebox
} from "./headphone_common.js";

const MUTE_INTERVAL_TICKS = 5;
const MUTE_RADIUS = 96;
const RETRY_TICKS = 100;

system.runInterval(() => {
  const list = loadRegistry();
  if (list.length === 0) {
    return;
  }
  const keep = [];
  let changed = false;
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
      if (entry.kept === false && system.currentTick % RETRY_TICKS < MUTE_INTERVAL_TICKS && keepLoaded(entry)) {
        entry.kept = true;
        changed = true;
      }
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
      const area = "x=" + entry.x + ",y=" + entry.y + ",z=" + entry.z + ",r=" + MUTE_RADIUS;
      const selector =
        system.currentTick - status.startTick <= MUTE_WINDOW_TICKS
          ? "@a[" + area + "]"
          : "@a[" + area + ",tag=!" + LISTEN_TAG + "]";
      try {
        dimension.runCommand("stopsound " + selector + " " + status.info.soundId);
      } catch (error) {}
    } catch (error) {
      keep.push(entry);
    }
  }
  if (changed || keep.length !== list.length) {
    saveRegistry(keep);
  }
}, MUTE_INTERVAL_TICKS);
