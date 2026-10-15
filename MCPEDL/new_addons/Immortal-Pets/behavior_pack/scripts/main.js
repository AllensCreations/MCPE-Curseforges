import { world, system, ItemTypes } from "@minecraft/server";

const MARKERS = [
  ["cat", "immortalpets:mode_cat"],
  ["wolf", "immortalpets:mode_wolf"],
  ["parrot", "immortalpets:mode_parrot"],
  ["horse", "immortalpets:mode_horse"],
  ["all", "immortalpets:mode_all"]
];

const TARGETS = {
  cat: ["minecraft:cat"],
  wolf: ["minecraft:wolf"],
  parrot: ["minecraft:parrot"],
  horse: ["minecraft:horse"],
  all: ["minecraft:cat", "minecraft:wolf", "minecraft:parrot", "minecraft:horse"]
};

const DIMENSIONS = ["overworld", "nether", "the_end"];

let active = null;

function resolveTargets() {
  if (active) return active;
  for (const [mode, id] of MARKERS) {
    if (ItemTypes.get(id)) {
      active = TARGETS[mode];
      return active;
    }
  }
  active = TARGETS.all;
  return active;
}

function protect(entity) {
  if (!entity.getComponent("minecraft:is_tamed")) return;
  try {
    entity.addEffect("resistance", 400, { amplifier: 255, showParticles: false });
  } catch (e) {}
  const health = entity.getComponent("minecraft:health");
  if (health && health.currentValue < health.effectiveMax) {
    health.resetToMaxValue();
  }
}

system.runInterval(() => {
  const types = resolveTargets();
  for (const dimId of DIMENSIONS) {
    const dimension = world.getDimension(dimId);
    for (const type of types) {
      let entities;
      try {
        entities = dimension.getEntities({ type });
      } catch (e) {
        continue;
      }
      for (const entity of entities) {
        try {
          protect(entity);
        } catch (e) {}
      }
    }
  }
}, 100);
