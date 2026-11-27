import { system } from "@minecraft/server";
import { SNAKE_IDS, SMALL_PREY, SWELL_EVENT, PREY_WINDOW_TICKS } from "./constants.js";
import { isLive } from "./util.js";

const recentPrey = new Map();

function purge(now) {
  for (const [id, entry] of [...recentPrey]) {
    if (now - entry.tick > PREY_WINDOW_TICKS) recentPrey.delete(id);
  }
}

export function onPythonHit(event) {
  const python = event.damagingEntity;
  const victim = event.hitEntity;
  if (!python || !victim || python.typeId !== SNAKE_IDS.PYTHON) return;
  if (!SMALL_PREY.has(victim.typeId)) return;
  const now = system.currentTick;
  purge(now);
  recentPrey.set(victim.id, { python, tick: now });
}

function swell(python) {
  if (!isLive(python)) return;
  try {
    python.triggerEvent(SWELL_EVENT);
  } catch {
    return;
  }
}

export function onPreyDeath(event) {
  let victimId;
  let victimType;
  try {
    victimId = event.deadEntity.id;
    victimType = event.deadEntity.typeId;
  } catch {
    return;
  }
  if (!SMALL_PREY.has(victimType)) return;
  const now = system.currentTick;
  let killer;
  try {
    killer = event.damageSource ? event.damageSource.damagingEntity : undefined;
  } catch {
    killer = undefined;
  }
  if (killer && killer.typeId === SNAKE_IDS.PYTHON) {
    recentPrey.delete(victimId);
    swell(killer);
    return;
  }
  const entry = recentPrey.get(victimId);
  recentPrey.delete(victimId);
  if (entry && now - entry.tick <= PREY_WINDOW_TICKS) swell(entry.python);
}
