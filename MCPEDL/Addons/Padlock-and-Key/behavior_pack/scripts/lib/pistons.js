import { system } from "@minecraft/server";
import { clearLock, findLock, isLockable, isLockedFloor, lockPassword, locksNear, propertyKey, setLock } from "./lockdata.js";

const FACING_VECTORS = [
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: 0, z: 1 },
  { x: -1, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
];
const PISTON_IDS = new Set(["minecraft:piston", "minecraft:sticky_piston"]);
const MOVING_ID = "minecraft:moving_block";
const MAX_PUSH = 12;
const MAX_WAIT_TICKS = 40;

const pendingKeys = new Set();

function shifted(pos, dir, steps) {
  return { x: pos.x + dir.x * steps, y: pos.y + dir.y * steps, z: pos.z + dir.z * steps };
}

function facingIndex(block) {
  const index = block.permutation.getState("facing_direction");
  return typeof index === "number" && FACING_VECTORS[index] ? index : -1;
}

function blockAt(dimension, pos) {
  try {
    return dimension.getBlock(pos);
  } catch (error) {
    return undefined;
  }
}

function isProtected(block) {
  return (isLockable(block) && findLock(block) !== null) || isLockedFloor(block);
}

export function isPiston(block) {
  return PISTON_IDS.has(block.typeId);
}

export function isPending(key) {
  return pendingKeys.has(key);
}

export function pistonChainHitsLock(piston) {
  const index = facingIndex(piston);
  if (index < 0) return false;
  for (let step = 1; step <= MAX_PUSH; step++) {
    const cell = blockAt(piston.dimension, shifted(piston.location, FACING_VECTORS[index], step));
    if (!cell || cell.isAir || cell.isLiquid) return false;
    if (isProtected(cell)) return true;
  }
  return false;
}

export function pistonAimedAt(block) {
  for (let index = 0; index < FACING_VECTORS.length; index++) {
    for (let step = 1; step <= MAX_PUSH; step++) {
      const cell = blockAt(block.dimension, shifted(block.location, FACING_VECTORS[index], -step));
      if (!cell || cell.isAir || cell.isLiquid) break;
      if (isPiston(cell) && facingIndex(cell) === index) return true;
    }
  }
  return false;
}

function settled(plans) {
  return plans.every((plan) => {
    const origin = blockAt(plan.dimension, plan.origin);
    const dest = blockAt(plan.dimension, plan.to);
    return !!origin && !!dest && origin.typeId !== MOVING_ID && dest.typeId !== MOVING_ID;
  });
}

function finish(plans) {
  const toKeys = new Set(plans.map((plan) => plan.toKey));
  const fromKeys = new Set(plans.map((plan) => plan.fromKey));
  const valid = [];
  for (const plan of plans) {
    const origin = blockAt(plan.dimension, plan.origin);
    const dest = blockAt(plan.dimension, plan.to);
    if (!origin || !dest || !isLockable(dest)) continue;
    if (plan.type && dest.typeId !== plan.type) continue;
    if (isLockable(origin) && !toKeys.has(plan.fromKey)) continue;
    if (lockPassword(plan.toKey) !== undefined && !fromKeys.has(plan.toKey)) continue;
    valid.push(plan);
  }
  for (const plan of valid) clearLock(plan.fromKey);
  for (const plan of valid) setLock(plan.toKey, plan.password);
  for (const plan of plans) pendingKeys.delete(plan.fromKey);
}

export function followLocks(event) {
  const { piston, block, isExpanding } = event;
  const dimension = block.dimension;
  const at = block.location;
  if (!locksNear(dimension, at.x - 16, at.x + 16, at.z - 16, at.z + 16)) return;
  const index = facingIndex(block);
  if (index < 0) return;
  const facing = FACING_VECTORS[index];
  const dir = isExpanding ? facing : shifted({ x: 0, y: 0, z: 0 }, facing, -1);
  const seeds = [];
  try {
    for (const location of piston.getAttachedBlocksLocations()) seeds.push(location);
  } catch (error) {
    seeds.length = 0;
  }
  for (let step = 1; step <= MAX_PUSH + 1; step++) seeds.push(shifted(block.location, facing, step));
  const plans = new Map();
  for (const seed of seeds) {
    for (const origin of [seed, shifted(seed, dir, -1)]) {
      const fromKey = propertyKey(dimension, origin.x, origin.y, origin.z);
      if (plans.has(fromKey) || pendingKeys.has(fromKey)) continue;
      const password = lockPassword(fromKey);
      if (password === undefined) continue;
      const here = blockAt(dimension, origin);
      const to = shifted(origin, dir, 1);
      plans.set(fromKey, {
        dimension,
        origin,
        to,
        fromKey,
        toKey: propertyKey(dimension, to.x, to.y, to.z),
        password,
        type: here && isLockable(here) ? here.typeId : undefined,
      });
    }
  }
  if (plans.size === 0) return;
  const list = [...plans.values()];
  for (const plan of list) pendingKeys.add(plan.fromKey);
  let waited = 0;
  const step = () => {
    waited += 1;
    if (!settled(list) && waited < MAX_WAIT_TICKS) {
      system.runTimeout(step, 1);
      return;
    }
    finish(list);
  };
  system.runTimeout(step, 2);
}
