import { world, system } from "@minecraft/server";
import { getSettings } from "./settings.js";

const PLAYER_TYPE = "minecraft:player";
const MIN_DURATION_TICKS = 10;
const SKIPPED = new Set(["minecraft:instant_health", "minecraft:instant_damage", "minecraft:saturation"]);
const pending = new Set();

export function startEffectParticles() {
  world.afterEvents.effectAdd.subscribe(({ entity, effect }) => {
    if (!getSettings().hideParticles) return;
    if (!entity || entity.typeId !== PLAYER_TYPE || !effect) return;
    if (SKIPPED.has(effect.typeId) || effect.duration < MIN_DURATION_TICKS) return;
    const key = `${entity.id}|${effect.typeId}`;
    if (pending.has(key)) {
      pending.delete(key);
      return;
    }
    pending.add(key);
    system.runTimeout(() => pending.delete(key), 40);
    try {
      entity.addEffect(effect.typeId, effect.duration, {
        amplifier: effect.amplifier,
        showParticles: false,
      });
    } catch (e) {
      pending.delete(key);
    }
  });
}
