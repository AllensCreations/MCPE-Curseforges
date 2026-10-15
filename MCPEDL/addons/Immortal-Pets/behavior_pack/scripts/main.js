import { world, system, ItemTypes } from "@minecraft/server";

const MARKER_PREFIX = "immortalpets:mode_";
const STORAGE_KEY = "immortalpets:selected_mode";
const TRIGGER_NAME = "EID";
const DIMENSIONS = ["overworld", "nether", "the_end"];
const EFFECT_TICKS = 100;
const CHECK_INTERVAL = 20;

const TARGETS = {
  cat: ["minecraft:cat"],
  wolf: ["minecraft:wolf"],
  parrot: ["minecraft:parrot"],
  horse: ["minecraft:horse"],
  donkey: ["minecraft:donkey"],
  mule: ["minecraft:mule"],
  skeleton_horse: ["minecraft:skeleton_horse"],
  zombie_horse: ["minecraft:zombie_horse"],
  all: [
    "minecraft:cat",
    "minecraft:wolf",
    "minecraft:parrot",
    "minecraft:horse",
    "minecraft:donkey",
    "minecraft:mule",
    "minecraft:skeleton_horse",
    "minecraft:zombie_horse"
  ]
};

const PROTECTION_EFFECTS = [
  ["resistance", 255],
  ["fire_resistance", 0],
  ["water_breathing", 0]
];

const CLEARED_EFFECTS = ["poison", "fatal_poison"];

let activeTypes = null;
let activeSet = null;

function readSavedMode() {
  try {
    const saved = world.getDynamicProperty(STORAGE_KEY);
    if (typeof saved === "string" && TARGETS[saved]) return saved;
  } catch (e) {}
  return null;
}

function saveMode(mode) {
  try {
    if (world.getDynamicProperty(STORAGE_KEY) !== mode) {
      world.setDynamicProperty(STORAGE_KEY, mode);
    }
  } catch (e) {}
}

function applyMode(mode) {
  activeTypes = TARGETS[mode];
  activeSet = new Set(activeTypes);
}

function resolveMode() {
  if (activeTypes) return true;
  const found = Object.keys(TARGETS).filter((mode) => ItemTypes.get(MARKER_PREFIX + mode));
  if (found.length === 1) {
    saveMode(found[0]);
    applyMode(found[0]);
    return true;
  }
  const saved = readSavedMode();
  if (saved) {
    applyMode(saved);
    return true;
  }
  activeTypes = TARGETS.all;
  activeSet = new Set(activeTypes);
  return true;
}

function isProtected(entity) {
  if (!activeSet || !activeSet.has(entity.typeId)) return false;
  return !!entity.getComponent("minecraft:is_tamed");
}

function protect(entity) {
  for (const [effect, amplifier] of PROTECTION_EFFECTS) {
    try {
      entity.addEffect(effect, EFFECT_TICKS, { amplifier, showParticles: false });
    } catch (e) {}
  }
  for (const effect of CLEARED_EFFECTS) {
    try {
      entity.removeEffect(effect);
    } catch (e) {}
  }
  const health = entity.getComponent("minecraft:health");
  if (health && health.currentValue < health.effectiveMax) {
    health.resetToMaxValue();
  }
}

function process(entity) {
  if (!isProtected(entity)) return;
  if (entity.nameTag === TRIGGER_NAME) {
    entity.kill();
    return;
  }
  protect(entity);
}

world.afterEvents.entityHurt.subscribe((event) => {
  try {
    resolveMode();
    process(event.hurtEntity);
  } catch (e) {}
});

system.runInterval(() => {
  resolveMode();
  for (const dimId of DIMENSIONS) {
    const dimension = world.getDimension(dimId);
    for (const type of activeTypes) {
      let entities;
      try {
        entities = dimension.getEntities({ type });
      } catch (e) {
        continue;
      }
      for (const entity of entities) {
        try {
          process(entity);
        } catch (e) {}
      }
    }
  }
}, CHECK_INTERVAL);
