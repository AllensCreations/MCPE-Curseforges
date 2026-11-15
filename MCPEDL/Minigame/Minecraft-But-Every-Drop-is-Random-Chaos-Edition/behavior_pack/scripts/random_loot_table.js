import { world, ItemTypes } from "@minecraft/server";

const SEED_KEY = "aln_chaos_seed";
const NAMESPACE = "minecraft:";

const POOL_NAMES = [
  "stone", "cobblestone", "granite", "diorite", "andesite", "deepslate", "cobbled_deepslate", "tuff", "calcite",
  "dirt", "grass_block", "podzol", "mycelium", "mud", "packed_mud", "mud_bricks", "sand", "red_sand", "gravel", "clay",
  "sandstone", "red_sandstone", "oak_log", "spruce_log", "birch_log", "jungle_log", "acacia_log", "dark_oak_log",
  "mangrove_log", "cherry_log", "pale_oak_log", "crimson_stem", "warped_stem", "oak_planks", "spruce_planks",
  "birch_planks", "jungle_planks", "acacia_planks", "dark_oak_planks", "mangrove_planks", "cherry_planks",
  "bamboo_planks", "crimson_planks", "warped_planks", "oak_sapling", "spruce_sapling", "birch_sapling",
  "jungle_sapling", "acacia_sapling", "dark_oak_sapling", "cherry_sapling", "oak_leaves", "spruce_leaves",
  "glass", "white_wool", "obsidian", "crying_obsidian", "netherrack", "soul_sand", "soul_soil", "basalt",
  "blackstone", "glowstone", "end_stone", "purpur_block", "prismarine", "sea_lantern", "ice", "packed_ice",
  "blue_ice", "snow", "cactus", "sugar_cane", "bamboo", "kelp", "pumpkin", "melon_block", "hay_block",
  "bookshelf", "tnt", "sponge", "wet_sponge", "slime", "honey_block", "moss_block", "amethyst_block",
  "dripstone_block", "pointed_dripstone", "sculk", "sculk_sensor", "copper_block", "iron_block", "gold_block",
  "diamond_block", "emerald_block", "lapis_block", "redstone_block", "coal_block", "netherite_block",
  "quartz_block", "bone_block", "magma", "nether_wart_block", "warped_wart_block", "shroomlight",
  "crafting_table", "furnace", "blast_furnace", "smoker", "chest", "barrel", "ender_chest", "anvil",
  "enchanting_table", "brewing_stand", "cauldron", "beacon", "conduit", "jukebox", "note_block", "lectern",
  "grindstone", "loom", "smithing_table", "stonecutter_block", "cartography_table", "fletching_table",
  "composter", "bell", "lantern", "soul_lantern", "torch", "soul_torch", "campfire", "soul_campfire",
  "ladder", "scaffolding", "rail", "golden_rail", "detector_rail", "activator_rail", "piston", "sticky_piston",
  "observer", "dispenser", "dropper", "hopper", "lever", "stone_button", "redstone_torch", "redstone_lamp",
  "daylight_detector", "target", "lightning_rod", "tripwire_hook", "trapped_chest", "comparator", "repeater",
  "wooden_door", "iron_door", "trapdoor", "iron_trapdoor", "fence", "fence_gate", "oak_stairs", "stone_stairs",
  "cobblestone_wall", "white_bed", "oak_sign", "oak_boat", "web", "vine", "waterlily", "sea_pickle",
  "glow_lichen", "azalea", "flowering_azalea", "yellow_flower", "red_flower", "cornflower", "lily_of_the_valley",
  "sunflower", "lilac", "rose_bush", "peony", "torchflower", "pitcher_plant", "spore_blossom", "big_dripleaf",
  "hanging_roots", "mangrove_roots", "coal", "charcoal", "raw_iron", "raw_gold", "raw_copper", "iron_ingot",
  "gold_ingot", "copper_ingot", "iron_nugget", "gold_nugget", "diamond", "emerald", "lapis_lazuli", "redstone",
  "quartz", "amethyst_shard", "netherite_scrap", "netherite_ingot", "ancient_debris", "coal_ore", "iron_ore",
  "gold_ore", "copper_ore", "lapis_ore", "redstone_ore", "diamond_ore", "emerald_ore", "deepslate_coal_ore",
  "deepslate_iron_ore", "deepslate_gold_ore", "deepslate_copper_ore", "deepslate_lapis_ore",
  "deepslate_redstone_ore", "deepslate_diamond_ore", "deepslate_emerald_ore", "nether_gold_ore", "quartz_ore",
  "flint", "clay_ball", "brick", "netherbrick", "stick", "string", "feather", "leather", "paper", "book", "bone",
  "bone_meal", "gunpowder", "slime_ball", "ender_pearl", "ender_eye", "blaze_rod", "blaze_powder", "ghast_tear",
  "magma_cream", "nether_star", "prismarine_shard", "prismarine_crystals", "phantom_membrane", "rabbit_hide",
  "rabbit_foot", "spider_eye", "fermented_spider_eye", "ink_sac", "glow_ink_sac", "glowstone_dust", "sugar",
  "egg", "heart_of_the_sea", "nautilus_shell", "shulker_shell", "dragon_breath", "breeze_rod", "wind_charge",
  "echo_shard", "goat_horn", "turtle_scute", "armadillo_scute", "honeycomb", "honey_bottle", "glass_bottle",
  "bucket", "water_bucket", "lava_bucket", "milk_bucket", "bowl", "name_tag", "lead", "saddle", "compass",
  "clock", "map", "shears", "flint_and_steel", "fishing_rod", "carrot_on_a_stick", "spyglass", "brush",
  "elytra", "totem_of_undying", "trident", "bow", "crossbow", "arrow", "spectral_arrow", "shield",
  "firework_rocket", "firework_star", "minecart", "chest_minecart", "tnt_minecart", "hopper_minecart",
  "experience_bottle", "enchanted_book", "golden_apple", "enchanted_golden_apple", "golden_carrot",
  "glistering_melon_slice", "apple", "bread", "cookie", "cake", "pumpkin_pie", "mushroom_stew", "beetroot_soup",
  "rabbit_stew", "suspicious_stew", "baked_potato", "potato", "poisonous_potato", "carrot", "beetroot", "wheat",
  "wheat_seeds", "pumpkin_seeds", "melon_seeds", "beetroot_seeds", "melon_slice", "sweet_berries",
  "glow_berries", "dried_kelp", "cooked_beef", "beef", "cooked_porkchop", "porkchop", "cooked_chicken",
  "chicken", "cooked_mutton", "mutton", "cooked_rabbit", "rabbit", "cooked_cod", "cod", "cooked_salmon",
  "salmon", "tropical_fish", "pufferfish", "rotten_flesh", "chorus_fruit", "popped_chorus_fruit", "cocoa_beans",
  "wooden_sword", "wooden_pickaxe", "wooden_axe", "wooden_shovel", "wooden_hoe", "stone_sword", "stone_pickaxe",
  "stone_axe", "stone_shovel", "stone_hoe", "iron_sword", "iron_pickaxe", "iron_axe", "iron_shovel", "iron_hoe",
  "golden_sword", "golden_pickaxe", "golden_axe", "golden_shovel", "golden_hoe", "diamond_sword",
  "diamond_pickaxe", "diamond_axe", "diamond_shovel", "diamond_hoe", "netherite_sword", "netherite_pickaxe",
  "netherite_axe", "netherite_shovel", "netherite_hoe", "mace", "leather_helmet", "leather_chestplate",
  "leather_leggings", "leather_boots", "chainmail_helmet", "chainmail_chestplate", "chainmail_leggings",
  "chainmail_boots", "iron_helmet", "iron_chestplate", "iron_leggings", "iron_boots", "golden_helmet",
  "golden_chestplate", "golden_leggings", "golden_boots", "diamond_helmet", "diamond_chestplate",
  "diamond_leggings", "diamond_boots", "netherite_helmet", "netherite_chestplate", "netherite_leggings",
  "netherite_boots", "turtle_helmet", "netherite_upgrade_smithing_template", "white_dye", "red_dye", "blue_dye",
  "green_dye", "black_dye", "music_disc_13", "music_disc_cat", "music_disc_pigstep", "dragon_egg"
];

const RARE_NAMES = [
  "netherite_ingot", "netherite_scrap", "netherite_block", "ancient_debris", "diamond", "diamond_block",
  "emerald_block", "diamond_sword", "diamond_pickaxe", "diamond_axe", "diamond_shovel", "diamond_hoe",
  "diamond_helmet", "diamond_chestplate", "diamond_leggings", "diamond_boots", "netherite_sword",
  "netherite_pickaxe", "netherite_axe", "netherite_shovel", "netherite_hoe", "netherite_helmet",
  "netherite_chestplate", "netherite_leggings", "netherite_boots", "elytra", "totem_of_undying", "nether_star",
  "beacon", "conduit", "enchanted_golden_apple", "trident", "heart_of_the_sea", "nautilus_shell", "shulker_shell",
  "dragon_breath", "dragon_egg", "mace", "breeze_rod", "echo_shard", "enchanted_book",
  "netherite_upgrade_smithing_template"
];

const rareSet = new Set(RARE_NAMES.map((name) => NAMESPACE + name));

let pool = [];
let mapping = new Map();
let seed = 0;
let ready = false;

function createRandom(initial) {
  let state = initial | 0;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashId(text, salt) {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function freshSeed() {
  return Math.floor(Math.random() * 2147483646) + 1;
}

function resolvePool() {
  const found = [];
  const seen = new Set();
  for (const name of POOL_NAMES) {
    const id = NAMESPACE + name;
    if (seen.has(id)) continue;
    seen.add(id);
    let type;
    try {
      type = ItemTypes.get(id);
    } catch (e) {
      type = undefined;
    }
    if (type) found.push(id);
  }
  return found;
}

function build(seedValue) {
  seed = seedValue;
  if (pool.length === 0) pool = resolvePool();
  const count = pool.length;
  const random = createRandom(seedValue);
  const order = pool.map((_, index) => index);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const swap = order[i];
    order[i] = order[j];
    order[j] = swap;
  }
  if (count > 1) {
    for (let i = 0; i < count; i++) {
      if (order[i] === i) {
        const j = (i + 1) % count;
        const swap = order[i];
        order[i] = order[j];
        order[j] = swap;
      }
    }
  }
  mapping = new Map();
  for (let i = 0; i < count; i++) mapping.set(pool[i], pool[order[i]]);
}

function ensureReady() {
  if (ready) return;
  const stored = world.getDynamicProperty(SEED_KEY);
  const value = typeof stored === "number" ? stored : freshSeed();
  if (typeof stored !== "number") world.setDynamicProperty(SEED_KEY, value);
  build(value);
  ready = true;
}

export function initLootTable() {
  try {
    ensureReady();
  } catch (e) {
    ready = false;
  }
}

export function reshuffle() {
  const value = freshSeed();
  world.setDynamicProperty(SEED_KEY, value);
  build(value);
  ready = true;
  return value;
}

export function getReplacement(typeId) {
  ensureReady();
  const direct = mapping.get(typeId);
  if (direct) return direct;
  if (pool.length === 0) return typeId;
  return pool[hashId(typeId, seed) % pool.length];
}

export function isRare(typeId) {
  return rareSet.has(typeId);
}

export function getSeed() {
  ensureReady();
  return seed;
}

export function getPoolSize() {
  ensureReady();
  return pool.length;
}
