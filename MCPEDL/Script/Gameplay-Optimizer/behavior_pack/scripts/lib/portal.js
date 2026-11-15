import { world, system } from "@minecraft/server";
import { getSettings } from "./settings.js";

const PORTAL_BLOCK = "minecraft:portal";
const OVERWORLD = "minecraft:overworld";
const NETHER = "minecraft:nether";
const CHECK_TICKS = 10;
const MAX_TICKS = 400;
const HOLD_TICKS = 100;
const HALF_SPAN = 16;
const OUTSIDE_LIMIT = 3;
const AREA_PREFIX = "aln_portal_";
const active = new Map();

function manager() {
  return world.tickingAreaManager;
}

function release(playerId) {
  const state = active.get(playerId);
  if (!state) return;
  active.delete(playerId);
  try {
    const mgr = manager();
    if (mgr && mgr.hasTickingArea(state.area)) mgr.removeTickingArea(state.area);
  } catch (e) {
    return;
  }
}

function inPortal(player) {
  try {
    return player.dimension.getBlock(player.location)?.typeId === PORTAL_BLOCK;
  } catch (e) {
    return false;
  }
}

function destinationOf(player) {
  const from = player.dimension.id;
  const loc = player.location;
  const y = Math.min(120, Math.max(0, Math.floor(loc.y)));
  if (from === OVERWORLD) {
    return { dimensionId: NETHER, x: Math.floor(loc.x / 8), y, z: Math.floor(loc.z / 8) };
  }
  if (from === NETHER) {
    return { dimensionId: OVERWORLD, x: Math.floor(loc.x * 8), y, z: Math.floor(loc.z * 8) };
  }
  return null;
}

function begin(player, now) {
  const mgr = manager();
  if (!mgr) return;
  const target = destinationOf(player);
  if (!target) return;
  const options = {
    dimension: world.getDimension(target.dimensionId),
    from: { x: target.x - HALF_SPAN, y: target.y, z: target.z - HALF_SPAN },
    to: { x: target.x + HALF_SPAN, y: target.y, z: target.z + HALF_SPAN },
  };
  if (!mgr.hasCapacity(options)) return;
  const area = `${AREA_PREFIX}${player.id}`;
  if (mgr.hasTickingArea(area)) return;
  active.set(player.id, { area, started: now, outside: 0, holding: false });
  mgr.createTickingArea(area, options).catch(() => release(player.id));
}

function sweep() {
  const settings = getSettings();
  if (!settings.portalPreload && active.size === 0) return;
  const now = system.currentTick;
  const present = new Set();
  for (const player of world.getAllPlayers()) {
    present.add(player.id);
    const state = active.get(player.id);
    const inside = inPortal(player);
    if (!state) {
      if (settings.portalPreload && inside) {
        try {
          begin(player, now);
        } catch (e) {
          release(player.id);
        }
      }
      continue;
    }
    if (state.holding) continue;
    state.outside = inside ? 0 : state.outside + 1;
    if (state.outside >= OUTSIDE_LIMIT || now - state.started > MAX_TICKS) release(player.id);
  }
  for (const id of [...active.keys()]) {
    if (!present.has(id)) release(id);
  }
}

export function startPortalPreload() {
  world.afterEvents.worldLoad.subscribe(() => {
    try {
      manager()?.removeAllTickingAreas();
    } catch (e) {
      active.clear();
    }
    active.clear();
    system.runInterval(sweep, CHECK_TICKS);
  });

  world.afterEvents.playerDimensionChange.subscribe(({ player }) => {
    const state = active.get(player.id);
    if (!state) return;
    state.holding = true;
    system.runTimeout(() => release(player.id), HOLD_TICKS);
  });

  world.afterEvents.playerLeave.subscribe(({ playerId }) => release(playerId));
}
