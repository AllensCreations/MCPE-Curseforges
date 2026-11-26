import { system } from "@minecraft/server";
import {
  PIPE_RECEIVER,
  PIPE_FILTER,
  PIPE_JUNCTION,
  STATE_OUT,
  OFFSETS,
  OPPOSITE,
  SIDES,
  STEP_TICKS,
  PULL_EVERY,
  SWEEP_EVERY,
  MAX_BATCH,
  FURNACE_SLOT_INPUT,
  FURNACE_SLOT_FUEL,
  FURNACE_SLOT_OUTPUT,
  FUEL_IDS,
  isPipeId,
  isFurnaceId,
} from "./constants.js";
import {
  records,
  active,
  blockOf,
  dimensionOf,
  ensureRecord,
  lookupRecord,
  saveRecord,
  setItem,
  dropRecord,
} from "./state.js";

let cycle = 0;

export function outputOf(block) {
  const value = block.permutation.getState(STATE_OUT);
  return typeof value === "string" ? value : "north";
}

function neighbor(block, face) {
  const o = OFFSETS[face];
  const l = block.location;
  try {
    return block.dimension.getBlock({ x: l.x + o.x, y: l.y + o.y, z: l.z + o.z });
  } catch (error) {
    return undefined;
  }
}

function containerOf(block) {
  try {
    const inv = block.getComponent("minecraft:inventory");
    return inv ? inv.container : undefined;
  } catch (error) {
    return undefined;
  }
}

function outputsOf(block) {
  const out = outputOf(block);
  if (block.typeId === PIPE_JUNCTION) return [out, ...SIDES[out]];
  return [out];
}

function acceptsFrom(target, travelFace) {
  return !outputsOf(target).includes(OPPOSITE[travelFace]);
}

function insertFurnace(container, item) {
  const slot = FUEL_IDS.includes(item.typeId) ? FURNACE_SLOT_FUEL : FURNACE_SLOT_INPUT;
  const current = container.getItem(slot);
  if (!current) {
    container.setItem(slot, item);
    return undefined;
  }
  if (!current.isStackableWith(item) || current.amount >= current.maxAmount) return item;
  const add = Math.min(current.maxAmount - current.amount, item.amount);
  current.amount += add;
  container.setItem(slot, current);
  item.amount -= add;
  return item.amount > 0 ? item : undefined;
}

function insertInto(block, container, item) {
  if (isFurnaceId(block.typeId)) return insertFurnace(container, item);
  return container.addItem(item);
}

function deliver(rec, from, target, face, moved) {
  if (isPipeId(target.typeId)) {
    const trec = ensureRecord(target);
    if (!trec || trec.item || moved.has(trec.key)) return false;
    if (!acceptsFrom(target, face)) return false;
    if (target.typeId === PIPE_FILTER && trec.filter && trec.filter !== rec.item.typeId) return false;
    setItem(trec, rec.item);
    moved.add(trec.key);
    setItem(rec, undefined);
    return true;
  }
  const container = containerOf(target);
  if (!container) return false;
  const before = rec.item.amount;
  const leftover = insertInto(target, container, rec.item);
  if (!leftover || leftover.amount <= 0) {
    setItem(rec, undefined);
    return true;
  }
  if (leftover.amount !== before) {
    setItem(rec, leftover);
    return true;
  }
  return false;
}

function forward(rec, block, moved) {
  const out = outputOf(block);
  let faces = [out];
  if (block.typeId === PIPE_JUNCTION) {
    const all = [out, ...SIDES[out]];
    const start = rec.rr % all.length;
    faces = all.slice(start).concat(all.slice(0, start));
  }
  for (const face of faces) {
    const target = neighbor(block, face);
    if (!target) continue;
    if (deliver(rec, block, target, face, moved)) {
      if (block.typeId === PIPE_JUNCTION) rec.rr = (rec.rr + 1) % 3;
      return true;
    }
  }
  return false;
}

function wantedFilter(block, out) {
  const front = neighbor(block, out);
  if (!front || front.typeId !== PIPE_FILTER) return undefined;
  const frec = lookupRecord(front);
  return frec ? frec.filter : undefined;
}

function pull(rec, block) {
  const out = outputOf(block);
  const back = neighbor(block, OPPOSITE[out]);
  if (!back) return;
  const container = containerOf(back);
  if (!container) return;
  const want = wantedFilter(block, out);
  const furnace = isFurnaceId(back.typeId);
  const first = furnace ? FURNACE_SLOT_OUTPUT : 0;
  const last = furnace ? FURNACE_SLOT_OUTPUT : container.size - 1;
  for (let slot = first; slot <= last; slot++) {
    const stack = container.getItem(slot);
    if (!stack) continue;
    if (want && stack.typeId !== want) continue;
    const take = Math.min(stack.amount, MAX_BATCH);
    const taken = stack.clone();
    taken.amount = take;
    if (take >= stack.amount) {
      container.setItem(slot, undefined);
    } else {
      stack.amount -= take;
      container.setItem(slot, stack);
    }
    setItem(rec, taken);
    return;
  }
}

function step(rec, moved) {
  if (moved.has(rec.key)) return;
  const block = blockOf(rec);
  if (!block) return;
  if (!isPipeId(block.typeId)) {
    dropRecord(rec);
    return;
  }
  if (rec.item) forward(rec, block, moved);
  if (!rec.item && block.typeId === PIPE_RECEIVER && cycle % PULL_EVERY === 0) pull(rec, block);
}

function sweep() {
  for (const rec of Array.from(records.values())) {
    const block = blockOf(rec);
    if (block && !isPipeId(block.typeId)) dropRecord(rec);
  }
}

export function startNetwork() {
  system.runInterval(() => {
    cycle++;
    const moved = new Set();
    for (const rec of Array.from(active)) {
      if (records.has(rec.key)) step(rec, moved);
    }
    for (const rec of records.values()) {
      if (rec.dirty) saveRecord(rec);
    }
    if (cycle % SWEEP_EVERY === 0) sweep();
  }, STEP_TICKS);
}
