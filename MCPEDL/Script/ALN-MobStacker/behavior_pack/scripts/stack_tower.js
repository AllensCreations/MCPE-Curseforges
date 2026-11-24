import { system, world } from "@minecraft/server";
import {
  TOWER_HEIGHT,
  TOWER_MOB_HEIGHTS,
  TOWER_SYNC_TICKS,
  VISUAL_HOST_PROPERTY,
  VISUAL_TAG,
  readMeta,
  restoreAppearance,
  spawnMatching,
} from "./stack_config.js";

const EFFECT_TICKS = 20000000;
const towers = new Map();

function unitHeight(typeId, meta) {
  const base = TOWER_MOB_HEIGHTS[typeId];
  return meta.isBaby ? base * 0.5 : base;
}

function isFree(dimension, spot, height) {
  try {
    const feet = dimension.getBlock(spot);
    const head = dimension.getBlock({ x: spot.x, y: spot.y + height - 0.1, z: spot.z });
    const clear = (block) => !block || block.isAir || block.isLiquid;
    return clear(feet) && clear(head);
  } catch (error) {
    return false;
  }
}

function makeInert(entity) {
  try {
    entity.addEffect("resistance", EFFECT_TICKS, { amplifier: 255, showParticles: false });
    entity.addEffect("fire_resistance", EFFECT_TICKS, { amplifier: 0, showParticles: false });
    entity.addEffect("slowness", EFFECT_TICKS, { amplifier: 255, showParticles: false });
  } catch (error) {
    return;
  }
}

function spawnVisual(host, meta, level) {
  const location = host.location;
  const spot = { x: location.x, y: location.y + level * unitHeight(host.typeId, meta), z: location.z };
  const visual = spawnMatching(host.dimension, host.typeId, spot, meta, true);
  restoreAppearance(visual, meta);
  visual.addTag(VISUAL_TAG);
  visual.setDynamicProperty(VISUAL_HOST_PROPERTY, host.id);
  makeInert(visual);
  return visual;
}

function removeAll(entry) {
  for (const visual of entry.visuals) {
    try {
      if (visual.isValid) visual.remove();
    } catch (error) {
      continue;
    }
  }
  entry.visuals = [];
}

export function clearTower(hostId) {
  const entry = towers.get(hostId);
  if (!entry) return;
  removeAll(entry);
  towers.delete(hostId);
}

export function ensureTower(host, count, meta) {
  if (!TOWER_MOB_HEIGHTS[host.typeId]) return;
  let entry = towers.get(host.id);
  if (!entry) {
    entry = { host, meta, visuals: [] };
    towers.set(host.id, entry);
  }
  entry.host = host;
  entry.meta = meta;
  entry.visuals = entry.visuals.filter((visual) => visual.isValid);
  const height = unitHeight(host.typeId, meta);
  const location = host.location;
  let allowed = 0;
  const wanted = Math.min(TOWER_HEIGHT, count) - 1;
  for (let level = 1; level <= wanted; level++) {
    const spot = { x: location.x, y: location.y + level * height, z: location.z };
    if (!isFree(host.dimension, spot, height)) break;
    allowed = level;
  }
  while (entry.visuals.length > allowed) {
    try {
      entry.visuals.pop().remove();
    } catch (error) {
      continue;
    }
  }
  while (entry.visuals.length < allowed) {
    try {
      entry.visuals.push(spawnVisual(host, meta, entry.visuals.length + 1));
    } catch (error) {
      break;
    }
  }
  if (allowed === 0) towers.delete(host.id);
}

export function reconcileTowers(dimension, typeId) {
  if (!TOWER_MOB_HEIGHTS[typeId]) return;
  let visuals;
  try {
    visuals = dimension.getEntities({ type: typeId, tags: [VISUAL_TAG] });
  } catch (error) {
    return;
  }
  for (const visual of visuals) {
    try {
      const hostId = visual.getDynamicProperty(VISUAL_HOST_PROPERTY);
      let entry = towers.get(hostId);
      if (!entry || !entry.host.isValid) {
        const host = typeof hostId === "string" ? world.getEntity(hostId) : undefined;
        if (!host || !host.isValid) {
          visual.remove();
          continue;
        }
        entry = { host, meta: readMeta(host), visuals: [] };
        towers.set(hostId, entry);
      }
      if (!entry.visuals.some((known) => known.id === visual.id)) entry.visuals.push(visual);
    } catch (error) {
      continue;
    }
  }
}

function syncTowers() {
  for (const [hostId, entry] of towers) {
    const host = entry.host;
    if (!host.isValid) {
      clearTower(hostId);
      continue;
    }
    const location = host.location;
    const height = unitHeight(host.typeId, entry.meta);
    const rotation = host.getRotation();
    let level = 1;
    for (const visual of entry.visuals) {
      if (!visual.isValid) continue;
      const spot = { x: location.x, y: location.y + level * height, z: location.z };
      level++;
      try {
        visual.teleport(spot, { keepVelocity: false, rotation });
      } catch (error) {
        continue;
      }
    }
  }
}

export function startTower() {
  system.runInterval(syncTowers, TOWER_SYNC_TICKS);
}
