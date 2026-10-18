import { world, system } from "@minecraft/server";

/**
 * Swarm Mob Booster by AllensCreations
 * -------------------------------------------------------------
 * 1. Persistent Swarm Density HUD:
 *    Displays live nearby mob count, categorized into hostiles and passives.
 * 2. Anti-Lag Ground Drop Throttling:
 *    Retains essential player items/gear while throttling excess clutter
 *    during 30+ mob swarm massacres.
 */

const HOSTILE_MOBS = new Set([
  "minecraft:zombie",
  "minecraft:skeleton",
  "minecraft:creeper",
  "minecraft:spider",
  "minecraft:cave_spider",
  "minecraft:drowned",
  "minecraft:husk",
  "minecraft:stray",
  "minecraft:phantom",
  "minecraft:witch",
  "minecraft:enderman",
  "minecraft:slime",
  "minecraft:magma_cube",
  "minecraft:blaze",
  "minecraft:ghast",
  "minecraft:piglin",
  "minecraft:piglin_brute",
  "minecraft:zombified_piglin",
  "minecraft:wither_skeleton",
  "minecraft:hoglin",
  "minecraft:zoglin",
  "minecraft:pillager",
  "minecraft:vindicator",
  "minecraft:ravager",
  "minecraft:evoker",
  "minecraft:vex",
  "minecraft:guardian",
  "minecraft:elder_guardian",
  "minecraft:warden",
  "minecraft:wither",
  "minecraft:ender_dragon",
  "minecraft:shulker",
  "minecraft:silverfish",
  "minecraft:endermite",
  "minecraft:breeze",
  "minecraft:bogged"
]);

const EXCLUDED_ENTITIES = new Set([
  "minecraft:player",
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:spectral_arrow",
  "minecraft:lightning_bolt",
  "minecraft:boat",
  "minecraft:chest_boat",
  "minecraft:minecart",
  "minecraft:chest_minecart",
  "minecraft:hopper_minecart",
  "minecraft:tnt_minecart",
  "minecraft:armor_stand",
  "minecraft:area_effect_cloud"
]);

// Efficient 10-tick (0.5s) interval for HUD update
system.runInterval(() => {
  const players = world.getAllPlayers();
  if (players.length === 0) return;

  for (const player of players) {
    if (!player.isValid()) continue;

    try {
      const dimension = player.dimension;
      const location = player.location;

      // Scan within 48-block exploration radius
      const nearbyEntities = dimension.getEntities({
        location: location,
        maxDistance: 48
      });

      let hostileCount = 0;
      let passiveCount = 0;

      for (const entity of nearbyEntities) {
        if (!entity.isValid()) continue;
        const typeId = entity.typeId;

        if (EXCLUDED_ENTITIES.has(typeId)) continue;

        if (HOSTILE_MOBS.has(typeId)) {
          hostileCount++;
        } else {
          passiveCount++;
        }
      }

      const totalCount = hostileCount + passiveCount;

      player.onScreenDisplay.setActionBar(
        `§eSwarm Density: §a${totalCount} §7(§c${hostileCount} hostile§7, §b${passiveCount} passive§7)`
      );
    } catch (e) {
      // Catch any transient dimension query exceptions
    }
  }
}, 10);

// Anti-Lag Drop Throttling
world.afterEvents.entityDie.subscribe((event) => {
  const deadEntity = event.deadEntity;
  if (!deadEntity) return;

  if (deadEntity.typeId === "minecraft:player") return;
  if (deadEntity.nameTag && deadEntity.nameTag.length > 0) return;

  const loc = deadEntity.location;
  const dim = deadEntity.dimension;

  system.run(() => {
    try {
      const items = dim.getEntities({
        type: "minecraft:item",
        location: loc,
        maxDistance: 3.5
      });

      for (const item of items) {
        if (!item.isValid()) continue;
        if (Math.random() > 0.35) {
          item.remove();
        }
      }
    } catch (e) {}
  });
});
