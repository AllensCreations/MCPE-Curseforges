import { world } from "@minecraft/server";
import { PROP, GRID_STEP } from "./config.js";
import { readJson, writeJson } from "./util.js";

const CORE = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
];

const RING_TWO = [
  [0, -2],
  [0, 2],
  [-2, 0],
  [2, 0],
  [-2, -2],
  [2, 2],
  [2, -2],
  [-2, 2],
  [-1, -2],
  [1, 2],
  [2, -1],
  [-2, 1],
  [1, -2],
  [-1, 2],
  [2, 1],
  [-2, -1],
];

const LAST_RING = 5;
export const MAX_SLOTS = 8 + 16 + 24 + 32 + 40;

const cache = { slots: undefined, coords: undefined, rings: {} };

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function spreadRing(ring) {
  if (cache.rings[ring]) return cache.rings[ring];
  const cells = [];
  for (let i = -ring; i <= ring; i++) {
    for (let j = -ring; j <= ring; j++) {
      if (Math.max(Math.abs(i), Math.abs(j)) === ring) cells.push([i, j]);
    }
  }
  cells.sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
  const n = cells.length;
  let stride = Math.max(1, Math.round(n * 0.618));
  while (gcd(stride, n) !== 1) stride++;
  const ordered = [];
  for (let idx = 0; idx < n; idx++) ordered.push(cells[(idx * stride) % n]);
  cache.rings[ring] = ordered;
  return ordered;
}

function cellOf(slot) {
  if (!Number.isInteger(slot) || slot < 1) return undefined;
  if (slot <= 8) return CORE[slot - 1];
  if (slot <= 24) return RING_TWO[slot - 9];
  let offset = slot - 25;
  for (let ring = 3; ring <= LAST_RING; ring++) {
    const size = ring * 8;
    if (offset < size) return spreadRing(ring)[offset];
    offset -= size;
  }
  return undefined;
}

export function slotCoords(slot) {
  const cell = cellOf(slot);
  if (!cell) return undefined;
  return { x: cell[0] * GRID_STEP, z: cell[1] * GRID_STEP };
}

export function slotAt(x, z) {
  if (!cache.coords) {
    cache.coords = new Map();
    for (let s = 1; s <= MAX_SLOTS; s++) {
      const c = slotCoords(s);
      cache.coords.set(`${c.x},${c.z}`, s);
    }
  }
  return cache.coords.get(`${x},${z}`);
}

export function readSlots() {
  if (!cache.slots) cache.slots = readJson(world, PROP.SLOTS, {});
  return cache.slots;
}

function saveSlots() {
  writeJson(world, PROP.SLOTS, readSlots());
}

export function recordOf(slot) {
  return readSlots()[String(slot)];
}

export function recordOfPlayerId(id) {
  const slots = readSlots();
  for (const key of Object.keys(slots)) {
    if (slots[key].id === id) return { slot: Number(key), record: slots[key] };
  }
  return undefined;
}

export function firstFreeSlot() {
  const slots = readSlots();
  for (let s = 1; s <= MAX_SLOTS; s++) {
    if (!slots[String(s)]) return s;
  }
  return undefined;
}

const TIER_ENDS = [8, 24, 48, 80, 120];

export function randomFreeSlot() {
  const slots = readSlots();
  let start = 1;
  for (const end of TIER_ENDS) {
    const free = [];
    for (let s = start; s <= end; s++) {
      if (!slots[String(s)]) free.push(s);
    }
    if (free.length > 0) return free[Math.floor(Math.random() * free.length)];
    start = end + 1;
  }
  return undefined;
}

export function assignSlot(player, slot, trait) {
  readSlots()[String(slot)] = { id: player.id, name: player.name, trait, built: false };
  saveSlots();
  player.setDynamicProperty(PROP.SLOT, slot);
  player.setDynamicProperty(PROP.TRAIT, trait);
  player.setDynamicProperty(PROP.BREAKS, 0);
  world.setDynamicProperty(PROP.ISLAND_PREFIX + slot, 0);
}

export function markBuilt(slot) {
  const record = recordOf(slot);
  if (!record || record.built) return;
  record.built = true;
  saveSlots();
}

export function slotOf(player) {
  const stored = player.getDynamicProperty(PROP.SLOT);
  if (typeof stored === "number" && recordOf(stored)?.id === player.id) return stored;
  const found = recordOfPlayerId(player.id);
  if (!found) return undefined;
  player.setDynamicProperty(PROP.SLOT, found.slot);
  player.setDynamicProperty(PROP.TRAIT, found.record.trait);
  return found.slot;
}

export function traitOf(player) {
  const slot = slotOf(player);
  return slot === undefined ? undefined : recordOf(slot)?.trait;
}

export function usedSlotCount() {
  return Object.keys(readSlots()).length;
}
