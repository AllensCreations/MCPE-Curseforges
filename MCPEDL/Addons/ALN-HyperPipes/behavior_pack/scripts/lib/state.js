import { world, ItemStack } from "@minecraft/server";
import { PROP_PREFIX, PIPE_RECEIVER } from "./constants.js";

const DIM_CODES = { overworld: "o", nether: "n", the_end: "e" };
const DIM_NAMES = { o: "overworld", n: "nether", e: "the_end" };

export const records = new Map();
export const active = new Set();

function dimCode(dimension) {
  const short = String(dimension.id).replace("minecraft:", "");
  return DIM_CODES[short];
}

export function keyFor(dimension, location) {
  const code = dimCode(dimension);
  if (!code) return undefined;
  return `${PROP_PREFIX}${code}_${location.x}_${location.y}_${location.z}`;
}

function parseKey(key) {
  const parts = key.slice(PROP_PREFIX.length).split("_");
  if (parts.length < 4) return undefined;
  const code = parts[0];
  const coords = parts.slice(1).map(Number);
  if (!DIM_NAMES[code] || coords.some((n) => !Number.isFinite(n))) return undefined;
  return { code, x: coords[0], y: coords[1], z: coords[2] };
}

export function dimensionOf(rec) {
  return world.getDimension(DIM_NAMES[rec.code]);
}

export function blockOf(rec) {
  try {
    return dimensionOf(rec).getBlock({ x: rec.x, y: rec.y, z: rec.z });
  } catch (error) {
    return undefined;
  }
}

function refreshActive(rec) {
  if (rec.receiver || rec.item) active.add(rec);
  else active.delete(rec);
}

export function saveRecord(rec) {
  const data = {};
  if (rec.filter) data.f = rec.filter;
  if (rec.receiver) data.r = 1;
  if (rec.item) data.b = { i: rec.item.typeId, n: rec.item.amount };
  if (rec.rr) data.c = rec.rr;
  try {
    world.setDynamicProperty(rec.key, JSON.stringify(data));
  } catch (error) {
    return;
  }
  rec.dirty = false;
}

export function ensureRecord(block) {
  const key = keyFor(block.dimension, block.location);
  if (!key) return undefined;
  let rec = records.get(key);
  if (!rec) {
    const parsed = parseKey(key);
    rec = {
      key,
      code: parsed.code,
      x: parsed.x,
      y: parsed.y,
      z: parsed.z,
      receiver: block.typeId === PIPE_RECEIVER,
      filter: undefined,
      item: undefined,
      rr: 0,
      dirty: true,
    };
    records.set(key, rec);
    saveRecord(rec);
  } else {
    const isReceiver = block.typeId === PIPE_RECEIVER;
    if (rec.receiver !== isReceiver) {
      rec.receiver = isReceiver;
      rec.dirty = true;
    }
  }
  refreshActive(rec);
  return rec;
}

export function lookupRecord(block) {
  const key = keyFor(block.dimension, block.location);
  return key ? records.get(key) : undefined;
}

export function setItem(rec, item) {
  rec.item = item && item.amount > 0 ? item : undefined;
  rec.dirty = true;
  refreshActive(rec);
}

export function setFilter(rec, typeId) {
  rec.filter = typeId;
  rec.dirty = true;
}

export function dropRecord(rec) {
  if (rec.item) {
    try {
      dimensionOf(rec).spawnItem(rec.item, { x: rec.x + 0.5, y: rec.y + 0.5, z: rec.z + 0.5 });
    } catch (error) {
      rec.item = undefined;
    }
  }
  records.delete(rec.key);
  active.delete(rec);
  try {
    world.setDynamicProperty(rec.key, undefined);
  } catch (error) {
    return;
  }
}

export function loadRecords() {
  let ids = [];
  try {
    ids = world.getDynamicPropertyIds();
  } catch (error) {
    return;
  }
  for (const id of ids) {
    if (!id.startsWith(PROP_PREFIX) || records.has(id)) continue;
    const parsed = parseKey(id);
    if (!parsed) continue;
    let data = {};
    try {
      data = JSON.parse(String(world.getDynamicProperty(id)));
    } catch (error) {
      data = {};
    }
    const rec = {
      key: id,
      code: parsed.code,
      x: parsed.x,
      y: parsed.y,
      z: parsed.z,
      receiver: data.r === 1,
      filter: typeof data.f === "string" ? data.f : undefined,
      item: undefined,
      rr: Number.isInteger(data.c) ? data.c : 0,
      dirty: false,
    };
    if (data.b && typeof data.b.i === "string" && Number.isInteger(data.b.n) && data.b.n > 0) {
      try {
        rec.item = new ItemStack(data.b.i, data.b.n);
      } catch (error) {
        rec.item = undefined;
      }
    }
    records.set(id, rec);
    refreshActive(rec);
  }
}
