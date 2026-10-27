import { world, EntityInitializationCause, system } from "@minecraft/server";

/**
 * Selective Mob Controller by AllensCreations
 * Preset: Invasion & Raids
 *
 * Enforces strict spawn filtering via script purge guard and throttles
 * death loot drops to eliminate clutter lag from 75-mob swarms.
 */

// Permitted mob identifiers for this preset
export const ALLOWED_MOBS = new Set(['minecraft:pillager', 'minecraft:vindicator', 'minecraft:witch', 'minecraft:ravager', 'minecraft:evoker', 'minecraft:vex']);

// Universal exemptions: Utility, ambient, bosses, and villagers
export const UNIVERSAL_EXEMPTIONS = new Set([
  "minecraft:player",
  "minecraft:villager_v2",
  "minecraft:villager",
  "minecraft:iron_golem",
  "minecraft:wandering_trader",
  "minecraft:ender_dragon",
  "minecraft:wither",
  "minecraft:elder_guardian",
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:spectral_arrow",
  "minecraft:splash_potion",
  "minecraft:lingering_potion",
  "minecraft:thrown_trident",
  "minecraft:small_fireball",
  "minecraft:fireball",
  "minecraft:dragon_fireball",
  "minecraft:wither_skull",
  "minecraft:wither_skull_dangerous",
  "minecraft:shulker_bullet",
  "minecraft:wind_charge_projectile",
  "minecraft:breeze_wind_charge_projectile",
  "minecraft:egg",
  "minecraft:snowball",
  "minecraft:ender_pearl",
  "minecraft:eye_of_ender_signal",
  "minecraft:lightning_bolt",
  "minecraft:boat",
  "minecraft:chest_boat",
  "minecraft:minecart",
  "minecraft:chest_minecart",
  "minecraft:hopper_minecart",
  "minecraft:tnt_minecart",
  "minecraft:command_block_minecart"
]);

export const ENABLE_INSTANT_PURGE = true;

function isExempt(entity, typeId) {
  // 1. Universal survival utilities & NPCs
  if (UNIVERSAL_EXEMPTIONS.has(typeId)) return true;

  // 2. Modded / Third-party add-on entities
  if (!typeId.startsWith("minecraft:")) return true;

  // 3. Tamed pets protection
  const tameable = entity.getComponent("minecraft:tameable");
  if (tameable && tameable.isValid() && tameable.isTamed) return true;

  return false;
}

world.afterEvents.entitySpawn.subscribe((event) => {
  const entity = event.entity;
  if (!entity || !entity.isValid()) return;

  const typeId = entity.typeId;
  const cause = event.cause;

  // Only purge naturally spawned entities (Layer 1 Guard)
  if (cause === EntityInitializationCause.Spawned) {
    if (isExempt(entity, typeId)) return;

    if (!ALLOWED_MOBS.has(typeId)) {
      if (ENABLE_INSTANT_PURGE) {
        try {
          entity.remove();
        } catch (e) {
          system.run(() => {
            if (entity.isValid()) entity.remove();
          });
        }
      }
    }
  }
});

// Loot reduction for massive swarms: keep 30% of drops to prevent ground item lag
world.afterEvents.entityDie.subscribe((event) => {
  const deadEntity = event.deadEntity;
  if (!deadEntity) return;

  const loc = deadEntity.location;
  const dim = deadEntity.dimension;

  system.run(() => {
    try {
      const items = dim.getEntities({
        type: "minecraft:item",
        location: loc,
        maxDistance: 3
      });

      for (const item of items) {
        if (Math.random() > 0.3) {
          item.remove();
        }
      }
    } catch (e) {}
  });
});
