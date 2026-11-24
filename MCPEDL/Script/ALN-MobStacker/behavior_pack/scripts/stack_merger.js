import { system, world } from "@minecraft/server";
import {
  DIMENSION_IDS,
  FARM_ANIMAL_SET,
  IDLE_PASSES_BEFORE_SLOWDOWN,
  IDLE_SLOW_FACTOR,
  JOBS_PER_TICK,
  MAX_ENTITIES_PER_JOB,
  MAX_STACK_SIZE,
  MERGE_INTERVAL_TICKS,
  MERGE_RADIUS,
  PERSISTENT_TAG,
  STACKABLE_MOBS,
  applyStack,
  getStackCount,
  isStackExcluded,
  mergeKey,
  readMeta,
  rememberStack,
  restoreAppearance,
  spawnMatching,
  stackCache,
  stackLabel,
} from "./stack_config.js";
import { clearTower, ensureTower, reconcileTowers } from "./stack_tower.js";

const RADIUS_SQUARED = MERGE_RADIUS * MERGE_RADIUS;
const queue = [];
const cursors = new Map();
let idlePasses = 0;
let idleSkip = 0;
let passMerged = false;

function cellOf(location) {
  return [
    Math.floor(location.x / MERGE_RADIUS),
    Math.floor(location.y / MERGE_RADIUS),
    Math.floor(location.z / MERGE_RADIUS),
  ];
}

function cellKey(x, y, z) {
  return x + "," + y + "," + z;
}

function placeHost(host, total) {
  const entity = host.entity;
  if (entity.hasTag(PERSISTENT_TAG) || (host.meta.isBaby && FARM_ANIMAL_SET.has(entity.typeId))) {
    applyStack(entity, total, host.meta);
    ensureTower(entity, total, host.meta);
    return;
  }
  let fresh;
  try {
    fresh = spawnMatching(entity.dimension, entity.typeId, host.location, host.meta, true);
  } catch (error) {
    fresh = undefined;
  }
  if (!fresh) {
    applyStack(entity, total, host.meta);
    ensureTower(entity, total, host.meta);
    return;
  }
  restoreAppearance(fresh, host.meta);
  fresh.addTag(PERSISTENT_TAG);
  stackCache.delete(entity.id);
  clearTower(entity.id);
  entity.remove();
  applyStack(fresh, total, host.meta);
  ensureTower(fresh, total, host.meta);
}

function mergeGroup(group) {
  group.sort((a, b) => b.count - a.count);
  const grid = new Map();
  group.forEach((item, index) => {
    const key = cellKey(...item.cell);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(index);
  });
  const used = new Set();
  for (let i = 0; i < group.length; i++) {
    if (used.has(i)) continue;
    used.add(i);
    const host = group[i];
    let total = host.count;
    let absorbed = 0;
    const [cx, cy, cz] = host.cell;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(cellKey(cx + dx, cy + dy, cz + dz));
          if (!bucket) continue;
          for (const j of bucket) {
            if (used.has(j)) continue;
            const other = group[j];
            const ox = other.location.x - host.location.x;
            const oy = other.location.y - host.location.y;
            const oz = other.location.z - host.location.z;
            if (ox * ox + oy * oy + oz * oz > RADIUS_SQUARED) continue;
            if (total + other.count > MAX_STACK_SIZE) continue;
            if (!other.entity.isValid) continue;
            total += other.count;
            used.add(j);
            stackCache.delete(other.entity.id);
            clearTower(other.entity.id);
            other.entity.remove();
            absorbed++;
          }
        }
      }
    }
    if (!host.entity.isValid) continue;
    if (absorbed > 0) {
      passMerged = true;
      placeHost(host, total);
    } else if (host.count > 1) {
      const entity = host.entity;
      const stale =
        entity.nameTag !== stackLabel(host.count, entity.typeId, host.meta.isBaby) ||
        (!entity.hasTag(PERSISTENT_TAG) && !(host.meta.isBaby && FARM_ANIMAL_SET.has(entity.typeId)));
      if (stale) {
        passMerged = true;
        placeHost(host, host.count);
      } else {
        rememberStack(entity, host.count, host.meta);
        ensureTower(entity, host.count, host.meta);
      }
    }
  }
}

function runJob(job) {
  reconcileTowers(job.dimension, job.typeId);
  let entities = job.dimension.getEntities({ type: job.typeId });
  if (entities.length === 0) return;
  if (entities.length > MAX_ENTITIES_PER_JOB) {
    const key = job.dimension.id + "|" + job.typeId;
    const start = (cursors.get(key) ?? 0) % entities.length;
    const end = start + MAX_ENTITIES_PER_JOB;
    cursors.set(key, end >= entities.length ? 0 : end);
    entities = entities.slice(start, end);
  }
  const groups = new Map();
  for (const entity of entities) {
    try {
      if (!entity.isValid || isStackExcluded(entity)) continue;
      const meta = readMeta(entity);
      const location = entity.location;
      const key = mergeKey(job.typeId, meta);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({
        entity,
        meta,
        location,
        cell: cellOf(location),
        count: getStackCount(entity),
      });
    } catch (error) {
      continue;
    }
  }
  for (const group of groups.values()) {
    try {
      mergeGroup(group);
    } catch (error) {
      continue;
    }
  }
}

function buildQueue() {
  if (queue.length > 0) return;
  if (idlePasses >= IDLE_PASSES_BEFORE_SLOWDOWN) {
    idleSkip++;
    if (idleSkip < IDLE_SLOW_FACTOR) return;
    idleSkip = 0;
  }
  idlePasses = passMerged ? 0 : idlePasses + 1;
  passMerged = false;
  for (const id of DIMENSION_IDS) {
    try {
      const dimension = world.getDimension(id);
      if (dimension.getPlayers().length === 0) continue;
      for (const typeId of STACKABLE_MOBS) queue.push({ dimension, typeId });
    } catch (error) {
      continue;
    }
  }
}

export function startMerger() {
  system.runInterval(buildQueue, MERGE_INTERVAL_TICKS);

  system.runInterval(() => {
    for (let i = 0; i < JOBS_PER_TICK && queue.length > 0; i++) {
      try {
        runJob(queue.shift());
      } catch (error) {
        continue;
      }
    }
  }, 1);

  world.afterEvents.entityRemove.subscribe((event) => {
    stackCache.delete(event.removedEntityId);
  });

  world.afterEvents.entitySpawn.subscribe((event) => {
    try {
      if (STACKABLE_MOBS.has(event.entity.typeId)) idlePasses = 0;
    } catch (error) {
      return;
    }
  });
}
