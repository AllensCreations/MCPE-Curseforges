import { world, system, EntityComponentTypes } from "@minecraft/server";

const CONFIG = {
  cats: true,
  wolves: true,
  parrots: true,
  horses: true,
  allTamed: false
};

const PET_TYPES = new Set([
  "minecraft:cat",
  "minecraft:wolf",
  "minecraft:parrot",
  "minecraft:horse",
  "minecraft:donkey",
  "minecraft:mule",
  "minecraft:skeleton_horse",
  "minecraft:zombie_horse"
]);

function isTamed(entity) {
  try {
    const tameable = entity.getComponent(EntityComponentTypes.Tameable);
    return !!tameable && tameable.isTamed;
  } catch {
    return false;
  }
}

function isProtected(entity) {
  if (!entity || !entity.isValid) return false;
  const type = entity.typeId;

  if (type === "minecraft:cat") return CONFIG.cats || CONFIG.allTamed;
  if (type === "minecraft:wolf") return CONFIG.wolves || CONFIG.allTamed;
  if (type === "minecraft:parrot") return CONFIG.parrots || CONFIG.allTamed;
  if (
    type === "minecraft:horse" ||
    type === "minecraft:donkey" ||
    type === "minecraft:mule" ||
    type === "minecraft:skeleton_horse" ||
    type === "minecraft:zombie_horse"
  ) return CONFIG.horses || CONFIG.allTamed;

  return CONFIG.allTamed && PET_TYPES.has(type) && isTamed(entity);
}

function protect(entity) {
  if (!isProtected(entity) || !isTamed(entity)) return;

  try {
    const health = entity.getComponent(EntityComponentTypes.Health);
    if (!health) return;

    if (health.currentValue < health.effectiveMax) {
      health.setCurrentValue(health.effectiveMax);
    }

    const options = { amplifier: 255, showParticles: false };
    entity.addEffect("resistance", 40, options);
    entity.addEffect("regeneration", 40, options);
    entity.addEffect("fire_resistance", 40, options);
  } catch {}
}

system.runInterval(() => {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      const dimension = world.getDimension(dimensionId);
      for (const entity of dimension.getEntities()) {
        if (PET_TYPES.has(entity.typeId)) protect(entity);
      }
    } catch {}
  }
}, 1);

world.afterEvents.entityHurt.subscribe((event) => {
  protect(event.hurtEntity);
});
