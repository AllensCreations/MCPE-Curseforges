import { EntityComponentTypes, EquipmentSlot } from "@minecraft/server";

export const MAX_STACK_SIZE = Infinity;
export const MERGE_RADIUS = 4.0;
export const MERGE_INTERVAL_TICKS = 25;
export const STACK_COUNT_PROPERTY = "aln_stack_count";
export const STACK_TAG = "aln_stacked_mob";
export const NAME_PREFIX = "§6[x";
export const PERSISTENT_TAG = "aln_persistent_host";
export const JOBS_PER_TICK = 4;
export const MAX_ENTITIES_PER_JOB = 300;
export const DIMENSION_IDS = ["overworld", "nether", "the_end"];

const FARM_ANIMALS = [
  "minecraft:cow",
  "minecraft:pig",
  "minecraft:sheep",
  "minecraft:chicken",
  "minecraft:rabbit",
  "minecraft:mooshroom",
  "minecraft:goat",
  "minecraft:frog",
];

const GRINDER_MOBS = [
  "minecraft:zombie",
  "minecraft:skeleton",
  "minecraft:spider",
  "minecraft:cave_spider",
  "minecraft:creeper",
  "minecraft:drowned",
  "minecraft:husk",
  "minecraft:stray",
  "minecraft:blaze",
  "minecraft:magma_cube",
  "minecraft:slime",
  "minecraft:enderman",
  "minecraft:witch",
  "minecraft:zombie_pigman",
  "minecraft:guardian",
  "minecraft:bogged",
  "minecraft:breeze",
];

export const STACKABLE_MOBS = new Set([...FARM_ANIMALS, ...GRINDER_MOBS]);
export const FARM_ANIMAL_SET = new Set(FARM_ANIMALS);

export const MIXED_SPAWN_MOBS = new Set([
  "minecraft:zombie",
  "minecraft:husk",
  "minecraft:drowned",
  "minecraft:zombie_pigman",
]);
export const MIXED_BABY_CHANCE = 0.05;

const NAME_OVERRIDES = {
  "minecraft:zombie_pigman": "Zombified Piglin",
};

const BABY_SPAWN_EVENTS = {
  "minecraft:zombie": "minecraft:as_baby",
  "minecraft:husk": "minecraft:as_baby",
  "minecraft:drowned": "minecraft:as_baby",
  "minecraft:zombie_pigman": "minecraft:as_baby",
};

const SLIME_SIZE_EVENTS = { 1: "spawn_small", 2: "spawn_medium", 4: "spawn_large" };

const GEAR_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet,
  EquipmentSlot.Mainhand,
  EquipmentSlot.Offhand,
];

const DEFAULT_HELD_ITEM = {
  "minecraft:skeleton": "minecraft:bow",
  "minecraft:stray": "minecraft:bow",
  "minecraft:bogged": "minecraft:bow",
};

export const COOKED_BY_RAW = {
  "minecraft:beef": "minecraft:cooked_beef",
  "minecraft:porkchop": "minecraft:cooked_porkchop",
  "minecraft:muttonRaw": "minecraft:muttonCooked",
  "minecraft:chicken": "minecraft:cooked_chicken",
  "minecraft:rabbit": "minecraft:cooked_rabbit",
};

export const WOOL_BY_COLOR = [
  "minecraft:white_wool",
  "minecraft:orange_wool",
  "minecraft:magenta_wool",
  "minecraft:light_blue_wool",
  "minecraft:yellow_wool",
  "minecraft:lime_wool",
  "minecraft:pink_wool",
  "minecraft:gray_wool",
  "minecraft:light_gray_wool",
  "minecraft:cyan_wool",
  "minecraft:purple_wool",
  "minecraft:blue_wool",
  "minecraft:brown_wool",
  "minecraft:green_wool",
  "minecraft:red_wool",
  "minecraft:black_wool",
];

export const LOOT = {
  "minecraft:cow": { xp: [1, 3], drops: [["minecraft:leather", 0, 2], ["minecraft:beef", 1, 3]] },
  "minecraft:pig": { xp: [1, 3], drops: [["minecraft:porkchop", 1, 3]] },
  "minecraft:sheep": { xp: [1, 3], drops: [["minecraft:muttonRaw", 1, 2]] },
  "minecraft:chicken": { xp: [1, 3], drops: [["minecraft:feather", 0, 2], ["minecraft:chicken", 1, 1]] },
  "minecraft:rabbit": {
    xp: [1, 3],
    drops: [["minecraft:rabbit_hide", 0, 1], ["minecraft:rabbit", 0, 1]],
    rare: [{ ids: ["minecraft:rabbit_foot"], chance: 0.1, bonus: 0.03 }],
  },
  "minecraft:mooshroom": { xp: [1, 3], drops: [["minecraft:leather", 0, 2], ["minecraft:beef", 1, 3]] },
  "minecraft:goat": { xp: [1, 3], drops: [] },
  "minecraft:frog": { xp: [1, 3], drops: [] },
  "minecraft:zombie": {
    xp: [5, 5],
    babyXp: 12,
    drops: [["minecraft:rotten_flesh", 0, 2]],
    rare: [{ ids: ["minecraft:iron_ingot", "minecraft:carrot", "minecraft:potato"], chance: 0.025, bonus: 0.01 }],
  },
  "minecraft:skeleton": { xp: [5, 5], drops: [["minecraft:arrow", 0, 2], ["minecraft:bone", 0, 2]] },
  "minecraft:spider": { xp: [5, 5], drops: [["minecraft:string", 0, 2], ["minecraft:spider_eye", 0, 1]] },
  "minecraft:cave_spider": { xp: [5, 5], drops: [["minecraft:string", 0, 2], ["minecraft:spider_eye", 0, 1]] },
  "minecraft:creeper": { xp: [5, 5], drops: [["minecraft:gunpowder", 0, 2]] },
  "minecraft:drowned": {
    xp: [5, 5],
    babyXp: 12,
    drops: [["minecraft:rotten_flesh", 0, 2]],
    rare: [{ ids: ["minecraft:copper_ingot"], chance: 0.11, bonus: 0.02 }],
  },
  "minecraft:husk": { xp: [5, 5], babyXp: 12, drops: [["minecraft:rotten_flesh", 0, 2]] },
  "minecraft:stray": { xp: [5, 5], drops: [["minecraft:arrow", 0, 2], ["minecraft:bone", 0, 2]] },
  "minecraft:blaze": { xp: [10, 10], drops: [["minecraft:blaze_rod", 0, 1]] },
  "minecraft:magma_cube": { xp: "variant", drops: [["minecraft:magma_cream", 0, 1]] },
  "minecraft:slime": { xp: "variant", drops: [["minecraft:slime_ball", 0, 2]] },
  "minecraft:enderman": { xp: [5, 5], drops: [["minecraft:ender_pearl", 0, 1]] },
  "minecraft:witch": {
    xp: [5, 5],
    drops: [["minecraft:redstone", 4, 8]],
    rolled: {
      rolls: [1, 3],
      entries: [
        ["minecraft:glowstone_dust", 0, 2, 1],
        ["minecraft:sugar", 0, 2, 1],
        ["minecraft:spider_eye", 0, 2, 1],
        ["minecraft:glass_bottle", 0, 2, 1],
        ["minecraft:gunpowder", 0, 2, 1],
        ["minecraft:stick", 0, 2, 2],
      ],
    },
  },
  "minecraft:zombie_pigman": {
    xp: [5, 5],
    babyXp: 12,
    drops: [["minecraft:rotten_flesh", 0, 1], ["minecraft:gold_nugget", 0, 1]],
    rare: [{ ids: ["minecraft:gold_ingot"], chance: 0.025, bonus: 0.01 }],
  },
  "minecraft:guardian": {
    xp: [10, 10],
    drops: [["minecraft:prismarine_shard", 0, 2]],
    rolled: {
      rolls: [1, 1],
      entries: [
        ["minecraft:fish", 1, 1, 2],
        ["minecraft:prismarine_crystals", 1, 1, 2],
        [null, 0, 0, 1],
      ],
    },
  },
  "minecraft:bogged": { xp: [5, 5], drops: [["minecraft:arrow", 0, 2], ["minecraft:bone", 0, 2]] },
  "minecraft:breeze": { xp: [10, 10], drops: [["minecraft:breeze_rod", 1, 2]] },
};

export const stackCache = new Map();

function component(entity, id) {
  try {
    return entity.getComponent(id);
  } catch (error) {
    return undefined;
  }
}

export function mobName(typeId, isBaby) {
  const base =
    NAME_OVERRIDES[typeId] ??
    typeId
      .replace("minecraft:", "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  return isBaby ? "Baby " + base : base;
}

export function stackLabel(count, typeId, isBaby) {
  return "§6[x" + count + "] §f" + mobName(typeId, isBaby);
}

export function readMeta(entity) {
  const color = component(entity, EntityComponentTypes.Color);
  const variant = component(entity, EntityComponentTypes.Variant);
  const mark = component(entity, EntityComponentTypes.MarkVariant);
  const skin = component(entity, EntityComponentTypes.SkinId);
  return {
    isBaby: !MIXED_SPAWN_MOBS.has(entity.typeId) && component(entity, EntityComponentTypes.IsBaby) !== undefined,
    sheared: component(entity, EntityComponentTypes.IsSheared) !== undefined,
    charged: component(entity, EntityComponentTypes.IsCharged) !== undefined,
    color: color ? color.value : -1,
    variant: variant ? variant.value : -1,
    mark: mark ? mark.value : -1,
    skin: skin ? skin.value : -1,
  };
}

export function mergeKey(typeId, meta) {
  return [typeId, meta.isBaby, meta.sheared, meta.charged, meta.color, meta.variant, meta.mark, meta.skin].join("|");
}

function hasGear(entity) {
  const equippable = component(entity, EntityComponentTypes.Equippable);
  if (!equippable) return false;
  for (const slot of GEAR_SLOTS) {
    try {
      const item = equippable.getEquipment(slot);
      if (!item) continue;
      if (slot === EquipmentSlot.Mainhand && item.typeId === DEFAULT_HELD_ITEM[entity.typeId]) continue;
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

export function isStackExcluded(entity) {
  if (component(entity, EntityComponentTypes.IsTamed) !== undefined) return true;
  if (!MIXED_SPAWN_MOBS.has(entity.typeId) && hasGear(entity)) return true;
  const leash = component(entity, EntityComponentTypes.Leashable);
  if (leash && leash.isLeashed) return true;
  const name = entity.nameTag;
  if (name && name.length > 0) {
    return !(entity.hasTag(STACK_TAG) && name.startsWith(NAME_PREFIX));
  }
  return false;
}

export function getStackCount(entity) {
  try {
    const value = entity.getDynamicProperty(STACK_COUNT_PROPERTY);
    if (typeof value === "number" && value >= 1) return Math.floor(value);
  } catch (error) {
    return 1;
  }
  return 1;
}

export function rememberStack(entity, count, meta) {
  const location = entity.location;
  stackCache.set(entity.id, {
    count,
    typeId: entity.typeId,
    dimensionId: entity.dimension.id,
    location: { x: location.x, y: location.y, z: location.z },
    meta,
  });
}

export function applyStack(entity, count, meta) {
  entity.setDynamicProperty(STACK_COUNT_PROPERTY, count);
  if (!entity.hasTag(STACK_TAG)) entity.addTag(STACK_TAG);
  entity.nameTag = stackLabel(count, entity.typeId, meta.isBaby);
  rememberStack(entity, count, meta);
}

export function spawnOptionsFor(typeId, meta, persistent) {
  const options = { initialPersistence: persistent };
  if (meta.isBaby) {
    options.spawnEvent = BABY_SPAWN_EVENTS[typeId] ?? "minecraft:entity_born";
  } else if (meta.variant > 0 && SLIME_SIZE_EVENTS[meta.variant] && (typeId === "minecraft:slime" || typeId === "minecraft:magma_cube")) {
    options.spawnEvent = SLIME_SIZE_EVENTS[meta.variant];
  }
  return options;
}

export function restoreAppearance(entity, meta) {
  try {
    if (meta.color >= 0) {
      const color = component(entity, EntityComponentTypes.Color);
      if (color) color.value = meta.color;
    }
    if (meta.sheared && component(entity, EntityComponentTypes.IsSheared) === undefined) {
      entity.triggerEvent("minecraft:on_sheared");
    }
    if (meta.charged && component(entity, EntityComponentTypes.IsCharged) === undefined) {
      entity.triggerEvent("minecraft:become_charged");
    }
  } catch (error) {
    return;
  }
}
