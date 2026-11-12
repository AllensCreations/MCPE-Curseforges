import { world, system, ItemTypes } from "@minecraft/server";

const MARKER_PREFIX = "immortalpets:mode_";
const STORAGE_KEY = "immortalpets:selected_mode";
const PROTECTED_TAG = "immortalpets:protected";
const TRIGGER_NAME = "EID";
const DIMENSIONS = ["overworld", "nether", "the_end"];
const FALLBACK_INTERVAL = 200;

const TARGETS = {
  cat: ["minecraft:cat"],
  wolf: ["minecraft:wolf"],
  parrot: ["minecraft:parrot"],
  horse: ["minecraft:horse"],
  donkey: ["minecraft:donkey"],
  mule: ["minecraft:mule"],
  skeleton_horse: ["minecraft:skeleton_horse"],
  zombie_horse: ["minecraft:zombie_horse"],
  llamas: ["minecraft:llama", "minecraft:trader_llama"],
  all: [
    "minecraft:cat",
    "minecraft:wolf",
    "minecraft:parrot",
    "minecraft:horse",
    "minecraft:donkey",
    "minecraft:mule",
    "minecraft:skeleton_horse",
    "minecraft:zombie_horse",
    "minecraft:llama",
    "minecraft:trader_llama"
  ]
};

const CLEARED_EFFECTS = ["poison", "fatal_poison"];

let activeTypes = null;
let activeSet = null;

function readSavedMode() {
  try {
    const saved = world.getDynamicProperty(STORAGE_KEY);
    if (typeof saved === "string" && TARGETS[saved]) return saved;
  } catch {}
  return null;
}

function saveMode(mode) {
  try {
    if (world.getDynamicProperty(STORAGE_KEY) !== mode) {
      world.setDynamicProperty(STORAGE_KEY, mode);
    }
  } catch {}
}

function applyMode(mode) {
  activeTypes = TARGETS[mode];
  activeSet = new Set(activeTypes);
}

function resolveMode() {
  if (activeTypes) return;

  let found = [];
  try {
    found = Object.keys(TARGETS).filter((mode) =>
      ItemTypes.get(MARKER_PREFIX + mode)
    );
  } catch {}

  if (found.length === 1) {
    saveMode(found[0]);
    applyMode(found[0]);
    return;
  }

  applyMode(readSavedMode() || "all");
}

function isSelectedTamedPet(entity) {
  if (!activeSet || !activeSet.has(entity.typeId)) return false;
  try {
    return !!entity.getComponent("minecraft:is_tamed");
  } catch {
    return false;
  }
}

function runProtectionFunction(entity) {
  try {
    entity.dimension.runCommand("function immortalpets/protect_pet");
  } catch {}
}

function clearPoison(entity) {
  for (const effect of CLEARED_EFFECTS) {
    try {
      entity.removeEffect(effect);
    } catch {}
  }
}

function restoreHealth(entity) {
  try {
    const health = entity.getComponent("minecraft:health");
    if (health && health.currentValue < health.effectiveMax) {
      health.resetToMaxValue();
    }
  } catch {}
}

function registerPet(entity, applyEffects = true) {
  if (!isSelectedTamedPet(entity)) return false;

  if (entity.nameTag === TRIGGER_NAME) {
    try {
      entity.kill();
    } catch {}
    return false;
  }

  try {
    if (!entity.hasTag(PROTECTED_TAG)) entity.addTag(PROTECTED_TAG);
  } catch {}

  clearPoison(entity);
  if (applyEffects) runProtectionFunction(entity);
  return true;
}

function handleDamage(entity) {
  if (!registerPet(entity)) return;
  restoreHealth(entity);
}

world.afterEvents.entityTamed.subscribe((event) => {
  try {
    resolveMode();
    registerPet(event.entity);
  } catch {}
});

world.afterEvents.entitySpawn.subscribe((event) => {
  try {
    resolveMode();
    registerPet(event.entity);
  } catch {}
});

world.afterEvents.entityHurt.subscribe((event) => {
  try {
    resolveMode();
    handleDamage(event.hurtEntity);
  } catch {}
});

function scanForExistingPets() {
  resolveMode();

  for (const dimId of DIMENSIONS) {
    let dimension;
    try {
      dimension = world.getDimension(dimId);
    } catch {
      continue;
    }

    let hasProtectedPet = false;

    for (const type of activeTypes) {
      let entities;
      try {
        entities = dimension.getEntities({ type });
      } catch {
        continue;
      }

      for (const entity of entities) {
        try {
          if (registerPet(entity, false)) hasProtectedPet = true;
        } catch {}
      }
    }

    if (hasProtectedPet) {
      try {
        dimension.runCommand("function immortalpets/protect_pet");
      } catch {}
    }
  }
}

system.runTimeout(scanForExistingPets, 1);
system.runInterval(scanForExistingPets, FALLBACK_INTERVAL);
