// Shared constants: ids, saved-data keys, island layout and the lucky block type table with each type's chance.
export const LUCKY = "allenscreations:lucky_block";
export const TIP_KEY = "lucky_tip_shown";
export const BUILT_KEY = "island_built";
export const TUTORIAL_KEY = "tutorial_left";
export const SETUP_TAG = "void_cleaned";
export const CORE = { x: 0, y: 64, z: 0 };
export const SPAWN_BLOCK = { x: 0, y: 65, z: 0 };
export const SPAWN_STAND = { x: 0.5, y: 65, z: 0.5 };
export const CHEST_AT = { x: -1, y: 65, z: -1 };
export const STARTER = [
  ["minecraft:oak_sapling", 3],
  ["minecraft:bone_meal", 4],
  ["minecraft:bread", 4],
  ["minecraft:bucket", 1],
];

export const TYPES = {
  "allenscreations:lucky_block": { theme: "", label: "§eAll-Round", weight: 17 },
  "allenscreations:lucky_farming": { theme: "F", label: "§aFarming", weight: 14 },
  "allenscreations:lucky_building": { theme: "B", label: "§6Building", weight: 20 },
  "allenscreations:lucky_combat": { theme: "C", label: "§cCombat", weight: 14 },
  "allenscreations:lucky_mining": { theme: "M", label: "§bMining", weight: 14 },
  "allenscreations:lucky_mystic": { theme: "Y", label: "§dMystic", weight: 12 },
  "allenscreations:lucky_treasure": { theme: "T", label: "§3Treasure", weight: 9 },
};

const TOTAL_WEIGHT = Object.values(TYPES).reduce((sum, type) => sum + type.weight, 0);
for (const type of Object.values(TYPES)) type.chance = Math.round((type.weight * 100) / TOTAL_WEIGHT);
