export const MOB_CATEGORIES = {
  overworld_hostiles: {
    name: "Overworld Hostiles",
    mobs: [
      { id: "minecraft:zombie", name: "Zombie" },
      { id: "minecraft:skeleton", name: "Skeleton" },
      { id: "minecraft:creeper", name: "Creeper" },
      { id: "minecraft:spider", name: "Spider" },
      { id: "minecraft:cave_spider", name: "Cave Spider" },
      { id: "minecraft:enderman", name: "Enderman" },
      { id: "minecraft:witch", name: "Witch" },
      { id: "minecraft:slime", name: "Slime" },
      { id: "minecraft:drowned", name: "Drowned" },
      { id: "minecraft:husk", name: "Husk" },
      { id: "minecraft:stray", name: "Stray" },
      { id: "minecraft:phantom", name: "Phantom" },
      { id: "minecraft:pillager", name: "Pillager" },
      { id: "minecraft:vindicator", name: "Vindicator" },
      { id: "minecraft:evoker", name: "Evoker" },
      { id: "minecraft:ravager", name: "Ravager" },
      { id: "minecraft:breeze", name: "Breeze" },
      { id: "minecraft:bogged", name: "Bogged" },
      { id: "minecraft:creaking", name: "Creaking" }
    ]
  },
  passive_neutral: {
    name: "Passive & Neutral Mobs",
    mobs: [
      { id: "minecraft:cow", name: "Cow" },
      { id: "minecraft:pig", name: "Pig" },
      { id: "minecraft:sheep", name: "Sheep" },
      { id: "minecraft:chicken", name: "Chicken" },
      { id: "minecraft:rabbit", name: "Rabbit" },
      { id: "minecraft:horse", name: "Horse" },
      { id: "minecraft:donkey", name: "Donkey" },
      { id: "minecraft:wolf", name: "Wolf" },
      { id: "minecraft:cat", name: "Cat" },
      { id: "minecraft:fox", name: "Fox" },
      { id: "minecraft:axolotl", name: "Axolotl" },
      { id: "minecraft:bee", name: "Bee" },
      { id: "minecraft:villager", name: "Villager" },
      { id: "minecraft:iron_golem", name: "Iron Golem" },
      { id: "minecraft:snow_golem", name: "Snow Golem" },
      { id: "minecraft:squid", name: "Squid" },
      { id: "minecraft:glow_squid", name: "Glow Squid" },
      { id: "minecraft:dolphin", name: "Dolphin" },
      { id: "minecraft:turtle", name: "Turtle" },
      { id: "minecraft:camel", name: "Camel" },
      { id: "minecraft:sniffer", name: "Sniffer" },
      { id: "minecraft:armadillo", name: "Armadillo" },
      { id: "minecraft:allay", name: "Allay" }
    ]
  },
  nether_end: {
    name: "Nether & End Mobs",
    mobs: [
      { id: "minecraft:zombie_pigman", name: "Zombified Piglin" },
      { id: "minecraft:piglin", name: "Piglin" },
      { id: "minecraft:piglin_brute", name: "Piglin Brute" },
      { id: "minecraft:hoglin", name: "Hoglin" },
      { id: "minecraft:zoglin", name: "Zoglin" },
      { id: "minecraft:blaze", name: "Blaze" },
      { id: "minecraft:ghast", name: "Ghast" },
      { id: "minecraft:magma_cube", name: "Magma Cube" },
      { id: "minecraft:wither_skeleton", name: "Wither Skeleton" },
      { id: "minecraft:strider", name: "Strider" },
      { id: "minecraft:endermite", name: "Endermite" },
      { id: "minecraft:shulker", name: "Shulker" }
    ]
  },
  bosses_rare: {
    name: "Bosses & Rare Mobs",
    mobs: [
      { id: "minecraft:warden", name: "Warden" },
      { id: "minecraft:elder_guardian", name: "Elder Guardian" },
      { id: "minecraft:guardian", name: "Guardian" },
      { id: "minecraft:wither", name: "Wither" },
      { id: "minecraft:ender_dragon", name: "Ender Dragon" }
    ]
  }
};

const RULES_KEY = "aln_spawn_rules";
const CONFIG_KEY = "aln_spawn_config";

export function getSpawnRules(world) {
  try {
    const raw = world.getDynamicProperty(RULES_KEY);
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    }
  } catch (e) {
  }
  const defaultRules = {};
  for (const catKey of Object.keys(MOB_CATEGORIES)) {
    for (const mob of MOB_CATEGORIES[catKey].mobs) {
      defaultRules[mob.id] = true;
    }
  }
  saveSpawnRules(world, defaultRules);
  return defaultRules;
}

export function saveSpawnRules(world, rules) {
  world.setDynamicProperty(RULES_KEY, JSON.stringify(rules));
}

export function getSpawnConfig(world) {
  try {
    const raw = world.getDynamicProperty(CONFIG_KEY);
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          blockSpawnEggs: Boolean(parsed.blockSpawnEggs),
          adminOnly: Boolean(parsed.adminOnly)
        };
      }
    }
  } catch (e) {
  }
  const defaultConfig = { blockSpawnEggs: false, adminOnly: false };
  saveSpawnConfig(world, defaultConfig);
  return defaultConfig;
}

export function saveSpawnConfig(world, config) {
  world.setDynamicProperty(CONFIG_KEY, JSON.stringify(config));
}

export function getAllMobIds() {
  const ids = [];
  for (const catKey of Object.keys(MOB_CATEGORIES)) {
    for (const mob of MOB_CATEGORIES[catKey].mobs) {
      ids.push(mob.id);
    }
  }
  return ids;
}
