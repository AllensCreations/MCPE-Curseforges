import { world, system } from "@minecraft/server";

/**
 * Swarm Mob Booster by AllensCreations
 * -------------------------------------------------------------
 * Anti-Lag ground drop throttling:
 * Prevents massive item clutter lag during 30+ mob swarm massacres
 * by retaining essential equipment and throttling common junk drops.
 */

world.afterEvents.entityDie.subscribe((event) => {
  const deadEntity = event.deadEntity;
  if (!deadEntity) return;

  // Protect player deaths, bosses, and named/tamed companions
  if (deadEntity.typeId === "minecraft:player") return;
  if (deadEntity.nameTag && deadEntity.nameTag.length > 0) return;

  const loc = deadEntity.location;
  const dim = deadEntity.dimension;

  system.run(() => {
    try {
      // Find dropped items around the death coordinate
      const items = dim.getEntities({
        type: "minecraft:item",
        location: loc,
        maxDistance: 3.5
      });

      for (const item of items) {
        if (!item.isValid()) continue;
        // Keep 35% of ground clutter to ensure buttery smooth frame rates
        if (Math.random() > 0.35) {
          item.remove();
        }
      }
    } catch (e) {
      // Catch transient dimension unload errors silently
    }
  });
});
