import { world, system, EntityDamageCause } from "@minecraft/server";

const CRIT_MULTIPLIER = 1.5;
const CRIT_PARTICLE = "minecraft:critical_hit_emitter";

function isVanillaCrit(player) {
  return (
    player.isFalling &&
    !player.isOnGround &&
    !player.isInWater &&
    !player.isClimbing
  );
}

world.beforeEvents.entityHurt.subscribe(
  (event) => {
    const attacker = event.damageSource.damagingEntity;
    if (!attacker || attacker.typeId !== "minecraft:player") return;
    if (isVanillaCrit(attacker)) return;
    const target = event.hurtEntity;
    event.damage = event.damage * CRIT_MULTIPLIER;
    system.run(() => {
      try {
        target.dimension.spawnParticle(CRIT_PARTICLE, target.getHeadLocation());
      } catch (error) {
        return;
      }
    });
  },
  { allowedDamageCauses: [EntityDamageCause.entityAttack] }
);
