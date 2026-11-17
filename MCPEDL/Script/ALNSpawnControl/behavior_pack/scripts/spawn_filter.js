import { world, EntityInitializationCause } from "@minecraft/server";
import { getSpawnRules, getSpawnConfig } from "./spawn_registry.js";

let blockedCount = 0;

export function getBlockedCount() {
  return blockedCount;
}

export function resetBlockedCount() {
  blockedCount = 0;
}

const IGNORED_TYPES = new Set([
  "minecraft:player",
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:snowball",
  "minecraft:egg",
  "minecraft:splash_potion",
  "minecraft:lingering_potion",
  "minecraft:ender_pearl",
  "minecraft:eye_of_ender_signal",
  "minecraft:firework_rocket",
  "minecraft:trident",
  "minecraft:wind_charge_projectile",
  "minecraft:breeze_wind_charge_projectile",
  "minecraft:shulker_bullet",
  "minecraft:wither_skull",
  "minecraft:wither_skull_dangerous",
  "minecraft:dragon_fireball",
  "minecraft:small_fireball",
  "minecraft:large_fireball",
  "minecraft:boat",
  "minecraft:chest_boat",
  "minecraft:minecart",
  "minecraft:chest_minecart",
  "minecraft:hopper_minecart",
  "minecraft:tnt_minecart",
  "minecraft:command_block_minecart"
]);

export function registerSpawnFilter() {
  world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (!entity || !entity.isValid) {
      return;
    }

    const typeId = entity.typeId;
    if (IGNORED_TYPES.has(typeId)) {
      return;
    }

    const rules = getSpawnRules(world);
    if (rules[typeId] !== false) {
      return;
    }

    const config = getSpawnConfig(world);
    if (!config.blockSpawnEggs) {
      const cause = event.cause;
      const isNaturalOrWorldGen =
        cause === EntityInitializationCause.Spawned ||
        cause === EntityInitializationCause.Born;

      if (!isNaturalOrWorldGen) {
        return;
      }
    }

    try {
      entity.remove();
      blockedCount++;
    } catch (e) {
    }
  });
}
