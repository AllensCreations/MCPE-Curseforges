/**
 * Item Database & Verification Engine for Alphabet Scavenger Hunt
 * Sourced from PrismarineJS/minecraft-data (Bedrock edition standards)
 * Created by AllensCreations
 */

/**
 * Common Bedrock items mapping from item typeId to official in-game display name.
 * Sourced from PrismarineJS/minecraft-data (data/bedrock/items.json).
 */
export const BEDROCK_ITEM_DISPLAY_NAMES = {
  // Foods & Plants
  "cooked_beef": "Steak",
  "beef": "Raw Beef",
  "cooked_porkchop": "Cooked Porkchop",
  "porkchop": "Raw Porkchop",
  "cooked_mutton": "Cooked Mutton",
  "mutton": "Raw Mutton",
  "cooked_chicken": "Cooked Chicken",
  "chicken": "Raw Chicken",
  "cooked_rabbit": "Cooked Rabbit",
  "rabbit": "Raw Rabbit",
  "cooked_cod": "Cooked Cod",
  "cod": "Raw Cod",
  "cooked_salmon": "Cooked Salmon",
  "salmon": "Raw Salmon",
  "tropical_fish": "Tropical Fish",
  "pufferfish": "Pufferfish",
  "bread": "Bread",
  "apple": "Apple",
  "golden_apple": "Golden Apple",
  "enchanted_golden_apple": "Enchanted Golden Apple",
  "carrot": "Carrot",
  "golden_carrot": "Golden Carrot",
  "potato": "Potato",
  "baked_potato": "Baked Potato",
  "poisonous_potato": "Poisonous Potato",
  "beetroot": "Beetroot",
  "beetroot_soup": "Beetroot Soup",
  "sweet_berries": "Sweet Berries",
  "glow_berries": "Glow Berries",
  "melon_slice": "Melon Slice",
  "glistering_melon_slice": "Glistering Melon Slice",
  "cookie": "Cookie",
  "cake": "Cake",
  "pumpkin_pie": "Pumpkin Pie",
  "mushroom_stew": "Mushroom Stew",
  "rabbit_stew": "Rabbit Stew",
  "suspicious_stew": "Suspicious Stew",
  "honey_bottle": "Honey Bottle",
  "honeycomb": "Honeycomb",
  "chorus_fruit": "Chorus Fruit",
  "popped_chorus_fruit": "Popped Chorus Fruit",
  "wheat": "Wheat",
  "wheat_seeds": "Wheat Seeds",
  "pumpkin_seeds": "Pumpkin Seeds",
  "melon_seeds": "Melon Seeds",
  "beetroot_seeds": "Beetroot Seeds",
  "torchflower_seeds": "Torchflower Seeds",
  "pitcher_pod": "Pitcher Pod",
  "sugar_cane": "Sugar Cane",
  "sugar": "Sugar",
  "egg": "Egg",
  "kelp": "Kelp",
  "dried_kelp": "Dried Kelp",
  "sea_pickle": "Sea Pickle",

  // Minerals & Raw Materials
  "coal": "Coal",
  "charcoal": "Charcoal",
  "raw_iron": "Raw Iron",
  "iron_ingot": "Iron Ingot",
  "raw_copper": "Raw Copper",
  "copper_ingot": "Copper Ingot",
  "raw_gold": "Raw Gold",
  "gold_ingot": "Gold Ingot",
  "diamond": "Diamond",
  "emerald": "Emerald",
  "netherite_ingot": "Netherite Ingot",
  "netherite_scrap": "Netherite Scrap",
  "quartz": "Nether Quartz",
  "amethyst_shard": "Amethyst Shard",
  "lapis_lazuli": "Lapis Lazuli",
  "redstone": "Redstone Dust",
  "glowstone_dust": "Glowstone Dust",
  "gold_nugget": "Gold Nugget",
  "iron_nugget": "Iron Nugget",
  "flint": "Flint",
  "clay_ball": "Clay Ball",
  "brick": "Brick",
  "netherbrick": "Nether Brick",
  "slime_ball": "Slimeball",
  "magma_cream": "Magma Cream",
  "bone": "Bone",
  "bone_meal": "Bone Meal",
  "feather": "Feather",
  "leather": "Leather",
  "rabbit_hide": "Rabbit Hide",
  "rabbit_foot": "Rabbit's Foot",
  "string": "String",
  "stick": "Stick",
  "gunpowder": "Gunpowder",
  "rotten_flesh": "Rotten Flesh",
  "spider_eye": "Spider Eye",
  "fermented_spider_eye": "Fermented Spider Eye",
  "blaze_rod": "Blaze Rod",
  "blaze_powder": "Blaze Powder",
  "ghast_tear": "Ghast Tear",
  "ender_pearl": "Ender Pearl",
  "eye_of_ender": "Eye of Ender",
  "shulker_shell": "Shulker Shell",
  "nautilus_shell": "Nautilus Shell",
  "heart_of_the_sea": "Heart of the Sea",
  "prismarine_shard": "Prismarine Shard",
  "prismarine_crystals": "Prismarine Crystals",
  "ink_sac": "Ink Sac",
  "glow_ink_sac": "Glow Ink Sac",
  "breeze_rod": "Breeze Rod",
  "wind_charge": "Wind Charge",
  "heavy_core": "Heavy Core",

  // Tools & Weapons
  "wooden_sword": "Wooden Sword",
  "wooden_pickaxe": "Wooden Pickaxe",
  "wooden_axe": "Wooden Axe",
  "wooden_shovel": "Wooden Shovel",
  "wooden_hoe": "Wooden Hoe",
  "stone_sword": "Stone Sword",
  "stone_pickaxe": "Stone Pickaxe",
  "stone_axe": "Stone Axe",
  "stone_shovel": "Stone Shovel",
  "stone_hoe": "Stone Hoe",
  "iron_sword": "Iron Sword",
  "iron_pickaxe": "Iron Pickaxe",
  "iron_axe": "Iron Axe",
  "iron_shovel": "Iron Shovel",
  "iron_hoe": "Iron Hoe",
  "golden_sword": "Golden Sword",
  "golden_pickaxe": "Golden Pickaxe",
  "golden_axe": "Golden Axe",
  "golden_shovel": "Golden Shovel",
  "golden_hoe": "Golden Hoe",
  "diamond_sword": "Diamond Sword",
  "diamond_pickaxe": "Diamond Pickaxe",
  "diamond_axe": "Diamond Axe",
  "diamond_shovel": "Diamond Shovel",
  "diamond_hoe": "Diamond Hoe",
  "netherite_sword": "Netherite Sword",
  "netherite_pickaxe": "Netherite Pickaxe",
  "netherite_axe": "Netherite Axe",
  "netherite_shovel": "Netherite Shovel",
  "netherite_hoe": "Netherite Hoe",
  "bow": "Bow",
  "crossbow": "Crossbow",
  "arrow": "Arrow",
  "mace": "Mace",
  "shield": "Shield",
  "trident": "Trident",
  "shears": "Shears",
  "fishing_rod": "Fishing Rod",
  "flint_and_steel": "Flint and Steel",

  // Armor
  "leather_helmet": "Leather Cap",
  "leather_chestplate": "Leather Tunic",
  "leather_leggings": "Leather Pants",
  "leather_boots": "Leather Boots",
  "chainmail_helmet": "Chainmail Helmet",
  "chainmail_chestplate": "Chainmail Chestplate",
  "chainmail_leggings": "Chainmail Leggings",
  "chainmail_boots": "Chainmail Boots",
  "iron_helmet": "Iron Helmet",
  "iron_chestplate": "Iron Chestplate",
  "iron_leggings": "Iron Leggings",
  "iron_boots": "Iron Boots",
  "golden_helmet": "Golden Helmet",
  "golden_chestplate": "Golden Chestplate",
  "golden_leggings": "Golden Leggings",
  "golden_boots": "Golden Boots",
  "diamond_helmet": "Diamond Helmet",
  "diamond_chestplate": "Diamond Chestplate",
  "diamond_leggings": "Diamond Leggings",
  "diamond_boots": "Diamond Boots",
  "netherite_helmet": "Netherite Helmet",
  "netherite_chestplate": "Netherite Chestplate",
  "netherite_leggings": "Netherite Leggings",
  "netherite_boots": "Netherite Boots",
  "turtle_helmet": "Turtle Shell",
  "elytra": "Elytra",

  // Utilities & Common Blocks
  "torch": "Torch",
  "soul_torch": "Soul Torch",
  "lantern": "Lantern",
  "soul_lantern": "Soul Lantern",
  "campfire": "Campfire",
  "soul_campfire": "Soul Campfire",
  "crafting_table": "Crafting Table",
  "furnace": "Furnace",
  "blast_furnace": "Blast Furnace",
  "smoker": "Smoker",
  "chest": "Chest",
  "barrel": "Barrel",
  "ender_chest": "Ender Chest",
  "shulker_box": "Shulker Box",
  "anvil": "Anvil",
  "grindstone": "Grindstone",
  "smithing_table": "Smithing Table",
  "stonecutter": "Stonecutter",
  "loom": "Loom",
  "composter": "Composter",
  "cauldron": "Cauldron",
  "bucket": "Bucket",
  "water_bucket": "Water Bucket",
  "lava_bucket": "Lava Bucket",
  "milk_bucket": "Milk Bucket",
  "compass": "Compass",
  "clock": "Clock",
  "spyglass": "Spyglass",
  "lead": "Lead",
  "name_tag": "Name Tag",
  "saddle": "Saddle",
  "paper": "Paper",
  "book": "Book",
  "writable_book": "Book and Quill",
  "written_book": "Written Book",
  "map": "Empty Map",
  "glass_bottle": "Glass Bottle",
  "potion": "Potion",
  "splash_potion": "Splash Potion",
  "lingering_potion": "Lingering Potion",
  "bed": "Bed",
  "bell": "Bell",
  "brewing_stand": "Brewing Stand",
  "beacon": "Beacon",
  "conduit": "Conduit",
  "lodestone": "Lodestone",
  "respawn_anchor": "Respawn Anchor",
  "experience_bottle": "Bottle o' Enchanting",
  "totem_of_undying": "Totem of Undying",
  "fire_charge": "Fire Charge",
  "tnt": "TNT",
  "cobweb": "Cobweb",

  // Wood & Building Basics
  "oak_log": "Oak Log",
  "oak_planks": "Oak Planks",
  "spruce_log": "Spruce Log",
  "spruce_planks": "Spruce Planks",
  "birch_log": "Birch Log",
  "birch_planks": "Birch Planks",
  "jungle_log": "Jungle Log",
  "jungle_planks": "Jungle Planks",
  "acacia_log": "Acacia Log",
  "acacia_planks": "Acacia Planks",
  "dark_oak_log": "Dark Oak Log",
  "dark_oak_planks": "Dark Oak Planks",
  "mangrove_log": "Mangrove Log",
  "mangrove_planks": "Mangrove Planks",
  "cherry_log": "Cherry Log",
  "cherry_planks": "Cherry Planks",
  "bamboo_block": "Block of Bamboo",
  "bamboo_planks": "Bamboo Planks",
  "crimson_stem": "Crimson Stem",
  "crimson_planks": "Crimson Planks",
  "warped_stem": "Warped Stem",
  "warped_planks": "Warped Planks",
  "ladder": "Ladder",
  "scaffolding": "Scaffolding",
  "cobblestone": "Cobblestone",
  "stone": "Stone",
  "dirt": "Dirt",
  "sand": "Sand",
  "gravel": "Gravel",
  "andesite": "Andesite",
  "diorite": "Diorite",
  "granite": "Granite",
  "deepslate": "Deepslate",
  "tuff": "Tuff",
  "calcite": "Calcite",
  "dripstone_block": "Dripstone Block",
  "pointed_dripstone": "Pointed Dripstone",
  "moss_block": "Moss Block",
  "glass": "Glass"
};

/**
 * Extracts all searchable word tokens for an item from:
 * 1) Raw item identifier tokens (split by underscore)
 * 2) Official in-game display name tokens from PrismarineJS/minecraft-data
 * 3) Custom anvil nametag tokens (if renamed by the player)
 *
 * @param {string} typeId e.g. "minecraft:cooked_beef"
 * @param {string|null} customNameTag optional custom anvil name
 * @returns {string[]} array of uppercase word tokens
 */
export function getItemSearchTokens(typeId, customNameTag = null) {
  const tokens = new Set();
  const rawId = typeId.replace(/^.*:/, "").toLowerCase();

  // 1. Raw ID full string & underscore-split words
  tokens.add(rawId);
  for (const part of rawId.split("_")) {
    if (part.length > 0) tokens.add(part);
  }

  // 2. Official display name from PrismarineJS/minecraft-data
  const mappedDisplayName = BEDROCK_ITEM_DISPLAY_NAMES[rawId];
  if (mappedDisplayName) {
    const cleanDisplay = mappedDisplayName.toLowerCase();
    tokens.add(cleanDisplay);
    for (const word of cleanDisplay.split(/[\s_\-']+/)) {
      if (word.length > 0) tokens.add(word);
    }
  } else {
    // Fallback: title-cased words from rawId
    for (const part of rawId.split("_")) {
      if (part.length > 0) tokens.add(part);
    }
  }

  // 3. Custom anvil nametag (if renamed)
  if (customNameTag && typeof customNameTag === "string") {
    const cleanCustom = customNameTag.trim().toLowerCase();
    tokens.add(cleanCustom);
    for (const word of cleanCustom.split(/[\s_\-']+/)) {
      if (word.length > 0) tokens.add(word);
    }
  }

  return Array.from(tokens);
}

/**
 * Determines whether an item matches the target letter.
 * Returns true if ANY search token (word) starts with the target letter.
 *
 * @param {string} typeId e.g. "minecraft:cooked_beef"
 * @param {string} letter e.g. "S" (Steak) or "B" (Beef) or "C" (Cooked)
 * @param {string|null} customNameTag
 * @returns {boolean}
 */
export function itemMatchesTargetLetter(typeId, letter, customNameTag = null) {
  if (!typeId || !letter) return false;
  const targetChar = letter.trim().charAt(0).toLowerCase();
  const tokens = getItemSearchTokens(typeId, customNameTag);

  for (const token of tokens) {
    if (token.length > 0 && token.charAt(0) === targetChar) {
      return true;
    }
  }

  return false;
}

/**
 * Produces clean display name for notifications (no emojis)
 * @param {string} typeId
 * @returns {string}
 */
export function getFriendlyItemName(typeId) {
  const rawId = typeId.replace(/^.*:/, "").toLowerCase();
  if (BEDROCK_ITEM_DISPLAY_NAMES[rawId]) {
    return BEDROCK_ITEM_DISPLAY_NAMES[rawId];
  }
  return rawId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
