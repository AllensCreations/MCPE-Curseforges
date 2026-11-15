import { system, world } from "@minecraft/server";
import {
  DIMENSION_IDS,
  MAX_STACK_SIZE,
  MERGE_INTERVAL_TICKS,
  MERGE_RADIUS,
  STACKABLE_MOBS,
  applyStack,
  getStackCount,
  isStackExcluded,
  mergeKey,
  readMeta,
  rememberStack,
  stackCache,
} from "./stack_config.js";

const RADIUS_SQUARED = MERGE_RADIUS * MERGE_RADIUS;

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
            other.entity.remove();
            absorbed++;
          }
        }
      }
    }
    if (absorbed > 0 && host.entity.isValid) {
      applyStack(host.entity, total, host.meta);
    } else if (host.count > 1 && host.entity.isValid) {
      rememberStack(host.entity, host.count, host.meta);
    }
  }
}

function mergeDimension(dimension) {
  for (const typeId of STACKABLE_MOBS) {
    let entities;
    try {
      entities = dimension.getEntities({ type: typeId });
    } catch (error) {
      continue;
    }
    if (entities.length === 0) continue;
    const groups = new Map();
    for (const entity of entities) {
      try {
        if (!entity.isValid || isStackExcluded(entity)) continue;
        const meta = readMeta(entity);
        const location = entity.location;
        const key = mergeKey(typeId, meta);
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
}

export function startMerger() {
  system.runInterval(() => {
    for (const id of DIMENSION_IDS) {
      try {
        mergeDimension(world.getDimension(id));
      } catch (error) {
        continue;
      }
    }
  }, MERGE_INTERVAL_TICKS);

  world.afterEvents.entityRemove.subscribe((event) => {
    stackCache.delete(event.removedEntityId);
  });
}
