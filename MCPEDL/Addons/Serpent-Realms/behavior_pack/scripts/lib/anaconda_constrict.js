import { system, EntityDamageCause } from "@minecraft/server";
import { SNAKE_IDS, SNAKE_ID_SET, LATCH } from "./constants.js";
import { isLive, distanceBetween } from "./util.js";

const latches = new Map();
let intervalHandle;

function release(victimId) {
  latches.delete(victimId);
  if (latches.size === 0 && intervalHandle !== undefined) {
    system.clearRun(intervalHandle);
    intervalHandle = undefined;
  }
}

function squeeze() {
  const now = system.currentTick;
  for (const [victimId, latch] of [...latches]) {
    const { victim, snake, startTick } = latch;
    if (!isLive(victim) || !isLive(snake)) {
      release(victimId);
      continue;
    }
    if (now - startTick >= LATCH.durationTicks || distanceBetween(victim, snake) > LATCH.maxDistance) {
      release(victimId);
      continue;
    }
    try {
      victim.addEffect("slowness", LATCH.slownessTicks, {
        amplifier: LATCH.slownessAmplifier,
        showParticles: true,
      });
      victim.applyDamage(LATCH.damage, {
        cause: EntityDamageCause.entityAttack,
        damagingEntity: snake,
      });
    } catch {
      release(victimId);
    }
  }
}

export function onAnacondaHit(event) {
  const snake = event.damagingEntity;
  const victim = event.hitEntity;
  if (!snake || !victim || snake.typeId !== SNAKE_IDS.ANACONDA) return;
  if (SNAKE_ID_SET.has(victim.typeId)) return;
  if (latches.has(victim.id)) return;
  latches.set(victim.id, { victim, snake, startTick: system.currentTick });
  if (intervalHandle === undefined) {
    intervalHandle = system.runInterval(squeeze, LATCH.intervalTicks);
  }
}
