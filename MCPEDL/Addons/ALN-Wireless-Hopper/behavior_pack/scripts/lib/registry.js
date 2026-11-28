import { world } from "@minecraft/server";
import { DIM_CODES, MAX_HOPPERS, MAX_RECEIVERS, PROP_LINKS } from "./constants.js";

let cache = null;

function load() {
  if (cache) return cache;
  let raw;
  try {
    raw = world.getDynamicProperty(PROP_LINKS);
  } catch {
    raw = undefined;
  }
  let data = {};
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      data = {};
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) data = {};
  cache = data;
  return cache;
}

function save() {
  try {
    world.setDynamicProperty(PROP_LINKS, JSON.stringify(cache));
  } catch {
    return;
  }
}

export function makeKey(dimensionId, x, y, z) {
  const code = DIM_CODES[dimensionId] ?? dimensionId;
  return `${code}|${x}|${y}|${z}`;
}

export function blockKey(block) {
  const l = block.location;
  return makeKey(block.dimension.id, l.x, l.y, l.z);
}

export function parseKey(key) {
  if (typeof key !== "string") return undefined;
  const p = key.split("|");
  if (p.length !== 4) return undefined;
  const entry = Object.entries(DIM_CODES).find(([, code]) => code === p[0]);
  const dimensionId = entry ? entry[0] : p[0];
  const x = Number(p[1]);
  const y = Number(p[2]);
  const z = Number(p[3]);
  if (![x, y, z].every(Number.isFinite)) return undefined;
  return { dimensionId, x, y, z };
}

export function getReceivers(hopperKey) {
  const data = load();
  return Array.isArray(data[hopperKey]) ? data[hopperKey].slice() : [];
}

export function hasLinks() {
  return Object.keys(load()).length > 0;
}

export function linkedHopperKeys() {
  return Object.keys(load());
}

export function toggleReceiver(hopperKey, receiverKey) {
  const data = load();
  const list = Array.isArray(data[hopperKey]) ? data[hopperKey] : [];
  const index = list.indexOf(receiverKey);
  if (index >= 0) {
    list.splice(index, 1);
    if (list.length === 0) delete data[hopperKey];
    else data[hopperKey] = list;
    save();
    return "removed";
  }
  if (list.length >= MAX_RECEIVERS) return "full";
  if (!data[hopperKey] && Object.keys(data).length >= MAX_HOPPERS) return "limit";
  list.push(receiverKey);
  data[hopperKey] = list;
  save();
  return "added";
}

export function dropReceiver(hopperKey, receiverKey) {
  const data = load();
  const list = data[hopperKey];
  if (!Array.isArray(list)) return;
  const index = list.indexOf(receiverKey);
  if (index < 0) return;
  list.splice(index, 1);
  if (list.length === 0) delete data[hopperKey];
  save();
}

export function removeHopper(hopperKey) {
  const data = load();
  if (!(hopperKey in data)) return;
  delete data[hopperKey];
  save();
}
