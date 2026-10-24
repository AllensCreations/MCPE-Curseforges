// All tunable numbers live here. Block and item ids are written without the "minecraft:" prefix.
export const CURRENCY = ":minecoin:";
export const LEDGER_ID = "allenscreations:trader_ledger";
export const CORE = { x: 0, y: 0, z: 0 };
export const FLOOR_Y = -1;
export const DIRT_REWARD = 1;
export const MAX_BALANCE = 2000000000;
export const HISTORY_MAX = 15;
export const MAX_CHESTS_PER_PLAYER = 3;
export const MARKET_CFG = { depth: 80, halfLifeMin: 20, maxSupply: 5000, rotateMs: 7200000, hot: 1.25, cold: 0.85 };

// Island levels: permitted build area is x/z in [min, max]. Each level contains the previous one.
export const ISLAND_LEVELS = [
  { name: "Starter Island", size: 9, min: -4, max: 4, cost: 0 },
  { name: "First Expansion", size: 17, min: -8, max: 8, cost: 250 },
  { name: "Development Expansion", size: 33, min: -16, max: 16, cost: 1000 },
  { name: "Industrial Expansion", size: 65, min: -32, max: 32, cost: 4000 },
  { name: "Frontier Permit", size: 67, min: -33, max: 33, cost: 1000 },
  { name: "Sovereign Frontier", size: 69, min: -34, max: 34, cost: 1500 },
];

// Block licenses. blocks = { block id: spawn weight }.
export const LICENSES = [
  { id: "t1", name: "Tier 1: Dirt Foundation", cost: 0, req: null, blocks: { dirt: 100 } },
  { id: "t1b", name: "Tier 1 Option: Soil Variety", cost: 25, req: "t1", blocks: { grass_block: 20, coarse_dirt: 15, podzol: 10, dirt_with_roots: 8 } },
  { id: "t2", name: "Tier 2: Woodland", cost: 40, req: "t1", blocks: { oak_log: 6, birch_log: 6, spruce_log: 6, jungle_log: 6, acacia_log: 6, dark_oak_log: 6, mangrove_log: 6, cherry_log: 6, pale_oak_log: 6, stripped_oak_log: 3, stripped_birch_log: 3, stripped_spruce_log: 3, stripped_jungle_log: 3, stripped_acacia_log: 3, stripped_dark_oak_log: 3, stripped_mangrove_log: 3, stripped_cherry_log: 3, stripped_pale_oak_log: 3, oak_leaves: 5, birch_leaves: 5, spruce_leaves: 5, jungle_leaves: 5, acacia_leaves: 5, dark_oak_leaves: 5, mangrove_leaves: 5, cherry_leaves: 5, pale_oak_leaves: 5, oak_planks: 6, birch_planks: 6, spruce_planks: 6, jungle_planks: 6, acacia_planks: 6, dark_oak_planks: 6, mangrove_planks: 6, cherry_planks: 6, pale_oak_planks: 6 } },
  { id: "t3", name: "Tier 3: Stoneworks", cost: 150, req: "t2", blocks: { stone: 30, cobblestone: 30, andesite: 12, diorite: 12, granite: 12, polished_andesite: 6, polished_diorite: 6, polished_granite: 6, tuff: 10, gravel: 10, stone_bricks: 6, mossy_cobblestone: 4 } },
  { id: "t4", name: "Tier 4: The Ore Rush", cost: 400, req: "t3", blocks: { coal_ore: 20, copper_ore: 14, iron_ore: 12, deepslate_coal_ore: 6, deepslate_copper_ore: 5, deepslate_iron_ore: 4, raw_copper_block: 3, raw_iron_block: 3 } },
  { id: "t5", name: "Tier 5: Precious Resources", cost: 900, req: "t4", blocks: { gold_ore: 8, redstone_ore: 12, lapis_ore: 8, quartz_ore: 6, deepslate_gold_ore: 3, deepslate_redstone_ore: 4, deepslate_lapis_ore: 3 } },
  { id: "t6", name: "Tier 6: Rare Minerals", cost: 2000, req: "t5", blocks: { diamond_ore: 3, emerald_ore: 3, amethyst_block: 4, deepslate_diamond_ore: 1, deepslate_emerald_ore: 1 } },
  { id: "t7", name: "Tier 7: Earth and Construction", cost: 4000, req: "t6", blocks: { sand: 14, red_sand: 10, clay: 14, mud: 10, packed_mud: 8, mud_bricks: 5, hardened_clay: 10, white_terracotta: 4, orange_terracotta: 4, magenta_terracotta: 4, light_blue_terracotta: 4, yellow_terracotta: 4, lime_terracotta: 4, pink_terracotta: 4, gray_terracotta: 4, light_gray_terracotta: 4, cyan_terracotta: 4, purple_terracotta: 4, blue_terracotta: 4, brown_terracotta: 4, green_terracotta: 4, red_terracotta: 4, black_terracotta: 4 } },
  { id: "t8", name: "Tier 8: Nether Materials", cost: 8000, req: "t7", blocks: { netherrack: 20, basalt: 10, blackstone: 10, magma: 6, glowstone: 6, nether_bricks: 8, soul_sand: 5 } },
  { id: "t9", name: "Tier 9: Forbidden Riches", cost: 16000, req: "t8", blocks: { obsidian: 6, crying_obsidian: 3, ancient_debris: 2 } },
  { id: "t10", name: "Tier 10: Sovereign Endgame", cost: 32000, req: "t9", blocks: { end_stone: 10, purpur_block: 8, end_bricks: 6 } },
];

// Never allowed in the regeneration pool, whatever the tables say.
export const UNSAFE_BLOCK = /water|lava|fire|tnt|portal|command|structure|barrier|spawner|piston|powder|bedrock|sponge/;

export const CATS = ["wood", "stone", "ore", "gem", "earth", "nether", "end", "mob", "crop"];

// [item id, base, min, max, required license, category]. Dirt is intentionally absent (fixed mining reward only).
export const MARKET = [
  ["oak_log", 3, 2, 5, "t2", "wood"], ["birch_log", 3, 2, 5, "t2", "wood"], ["spruce_log", 3, 2, 5, "t2", "wood"],
  ["jungle_log", 4, 2, 6, "t2", "wood"], ["acacia_log", 3, 2, 5, "t2", "wood"], ["dark_oak_log", 4, 2, 6, "t2", "wood"],
  ["mangrove_log", 4, 2, 6, "t2", "wood"], ["stripped_oak_log", 4, 2, 6, "t2", "wood"], ["stripped_spruce_log", 4, 2, 6, "t2", "wood"],
  ["cobblestone", 2, 1, 3, "t3", "stone"], ["stone", 3, 1, 5, "t3", "stone"], ["andesite", 2, 1, 3, "t3", "stone"],
  ["diorite", 2, 1, 3, "t3", "stone"], ["granite", 2, 1, 3, "t3", "stone"], ["tuff", 2, 1, 3, "t3", "stone"], ["gravel", 2, 1, 3, "t3", "stone"],
  ["coal", 6, 3, 9, "t4", "ore"], ["raw_copper", 5, 3, 8, "t4", "ore"], ["raw_iron", 9, 5, 14, "t4", "ore"],
  ["copper_ingot", 8, 5, 12, "t4", "ore"], ["iron_ingot", 12, 7, 18, "t4", "ore"],
  ["redstone", 4, 2, 7, "t5", "ore"], ["lapis_lazuli", 6, 3, 10, "t5", "ore"], ["quartz", 9, 5, 14, "t5", "ore"],
  ["raw_gold", 20, 12, 30, "t5", "ore"], ["gold_ingot", 28, 16, 42, "t5", "ore"],
  ["amethyst_shard", 10, 6, 15, "t6", "gem"], ["emerald", 90, 55, 135, "t6", "gem"], ["diamond", 120, 70, 180, "t6", "gem"],
  ["sand", 3, 2, 5, "t7", "earth"], ["red_sand", 4, 2, 6, "t7", "earth"], ["clay_ball", 3, 2, 5, "t7", "earth"],
  ["mud", 3, 2, 5, "t7", "earth"], ["packed_mud", 4, 2, 6, "t7", "earth"], ["hardened_clay", 5, 3, 8, "t7", "earth"],
  ["netherrack", 1, 1, 2, "t8", "nether"], ["basalt", 3, 2, 5, "t8", "nether"], ["blackstone", 3, 2, 5, "t8", "nether"],
  ["magma", 4, 2, 6, "t8", "nether"], ["glowstone_dust", 6, 3, 9, "t8", "nether"],
  ["obsidian", 40, 25, 60, "t9", "nether"], ["crying_obsidian", 70, 42, 105, "t9", "nether"], ["ancient_debris", 300, 200, 450, "t9", "nether"],
  ["end_stone", 6, 3, 9, "t10", "end"], ["purpur_block", 8, 5, 12, "t10", "end"],
  ["rotten_flesh", 2, 1, 3, "t1", "mob"], ["bone", 3, 2, 5, "t1", "mob"], ["string", 4, 2, 6, "t1", "mob"],
  ["feather", 2, 1, 3, "t1", "mob"], ["leather", 4, 2, 6, "t1", "mob"], ["gunpowder", 8, 5, 12, "t1", "mob"],
  ["ender_pearl", 25, 15, 38, "t1", "mob"], ["blaze_rod", 30, 18, 45, "t1", "mob"],
  ["wheat", 3, 2, 5, "t1", "crop"], ["carrot", 2, 1, 3, "t1", "crop"], ["potato", 2, 1, 3, "t1", "crop"], ["beetroot", 2, 1, 3, "t1", "crop"],
];

// Biome Chest: each chest picks one biome the player's licenses allow, then rolls that biome's loot.
export const BIOMES = [
  { name: "Cherry Grove", loot: [["cherry_sapling", 20, 1, 3, "t2"], ["cherry_log", 15, 2, 5, "t2"], ["pink_petals", 15, 1, 4, "t2"], ["cherry_planks", 12, 4, 8, "t2"], ["stick", 10, 2, 6, "t2"]] },
  { name: "Mangrove Swamp", loot: [["mangrove_propagule", 20, 1, 3, "t2"], ["mangrove_log", 15, 2, 5, "t2"], ["mud", 15, 3, 8, "t7"], ["mangrove_planks", 12, 4, 8, "t2"], ["stick", 10, 2, 6, "t2"]] },
  { name: "Jungle", loot: [["jungle_sapling", 20, 1, 3, "t2"], ["jungle_log", 15, 2, 5, "t2"], ["cocoa_beans", 15, 2, 6, "t2"], ["melon_seeds", 12, 2, 6, "t2"], ["bamboo", 10, 4, 10, "t2"]] },
  { name: "Dark Forest", loot: [["dark_oak_sapling", 20, 1, 3, "t2"], ["dark_oak_log", 15, 2, 5, "t2"], ["red_mushroom", 12, 1, 4, "t2"], ["brown_mushroom", 12, 1, 4, "t2"], ["dark_oak_planks", 12, 4, 8, "t2"]] },
  { name: "Savanna", loot: [["acacia_sapling", 20, 1, 3, "t2"], ["acacia_log", 15, 2, 5, "t2"], ["wheat_seeds", 15, 2, 6, "t1"], ["acacia_planks", 12, 4, 8, "t2"], ["stick", 10, 2, 6, "t2"]] },
  { name: "Taiga", loot: [["spruce_sapling", 20, 1, 3, "t2"], ["spruce_log", 15, 2, 5, "t2"], ["sweet_berries", 15, 2, 6, "t2"], ["spruce_planks", 12, 4, 8, "t2"], ["stick", 10, 2, 6, "t2"]] },
  { name: "Desert", loot: [["cactus", 20, 1, 3, "t3"], ["dead_bush", 15, 1, 3, "t3"], ["sugar_cane", 15, 2, 6, "t3"], ["sand", 12, 4, 10, "t7"], ["bamboo", 10, 2, 6, "t2"]] },
  { name: "Pale Garden", loot: [["pale_oak_sapling", 20, 1, 3, "t3"], ["pale_oak_log", 15, 2, 5, "t3"], ["pale_moss_carpet", 12, 2, 6, "t3"], ["pale_oak_planks", 12, 4, 8, "t3"]] },
];

// Natural Loot Contracts. loot = [item id, weight, min amount, max amount, required license].
export const CONTRACTS = [
  { id: "basic", name: "Basic Supply Chest", cost: 100, req: "t1", intervalMs: 300000, rolls: [3, 5], loot: [
    ["dirt", 30, 3, 8, "t1"], ["wheat_seeds", 20, 1, 4, "t1"], ["bread", 10, 1, 2, "t1"], ["apple", 10, 1, 2, "t1"],
    ["carrot", 8, 1, 3, "t1"], ["potato", 8, 1, 3, "t1"], ["oak_log", 20, 2, 5, "t2"], ["stick", 15, 2, 6, "t2"]] },
  { id: "builder", name: "Builder's Chest", cost: 350, req: "t3", intervalMs: 450000, rolls: [3, 5], loot: [
    ["cobblestone", 30, 8, 24, "t3"], ["stone", 15, 4, 12, "t3"], ["andesite", 10, 4, 10, "t3"], ["oak_planks", 20, 8, 16, "t2"],
    ["glass", 12, 4, 12, "t3"], ["spruce_planks", 10, 8, 16, "t2"], ["gravel", 8, 4, 12, "t3"]] },
  { id: "biome", name: "Biome Chest", cost: 600, req: "t2", intervalMs: 360000, rolls: [3, 5], loot: [], biomes: BIOMES },
  { id: "miner", name: "Miner's Chest", cost: 900, req: "t4", intervalMs: 600000, rolls: [3, 5], loot: [
    ["coal", 30, 4, 10, "t4"], ["raw_copper", 20, 3, 8, "t4"], ["raw_iron", 18, 2, 6, "t4"], ["raw_gold", 6, 1, 3, "t5"],
    ["torch", 12, 4, 12, "t4"], ["iron_nugget", 10, 3, 9, "t4"]] },
  { id: "treasure", name: "Treasure Chest", cost: 2500, req: "t5", intervalMs: 900000, rolls: [2, 3], loot: [
    ["iron_ingot", 14, 3, 8, "t4"], ["redstone", 15, 4, 12, "t5"], ["lapis_lazuli", 14, 4, 10, "t5"], ["gold_ingot", 6, 2, 5, "t5"],
    ["amethyst_shard", 10, 2, 6, "t6"], ["emerald", 3, 1, 3, "t6"], ["diamond", 3, 1, 2, "t6"]] },
  { id: "sovereign", name: "Sovereign Chest", cost: 7500, req: "t8", intervalMs: 1200000, rolls: [3, 5], loot: [
    ["gold_ingot", 14, 4, 10, "t5"], ["emerald", 10, 2, 4, "t6"], ["diamond", 8, 1, 3, "t6"], ["obsidian", 10, 2, 5, "t9"],
    ["end_stone", 12, 8, 16, "t10"], ["purpur_block", 8, 4, 12, "t10"], ["netherrack", 10, 8, 24, "t8"], ["ancient_debris", 1, 1, 1, "t9"]] },
];

export const nice = (id) => id.replace("minecraft:", "").split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");

// Dirt keeps at least this share of the OneBlock pool once any other license is owned.
export const DIRT_SHARE = 0.25;
// Loot and chest contents must never contain fluids, buckets, biome or structure items.
export const LOOT_DENY = /bucket|water|lava|fluid|milk|honey|powder|snow|ice|structure|spawn_egg|command|barrier|firework|map|tnt|fire|portal|sponge|bedrock|shulker|jigsaw|debug|border|light_block|knowledge|allow|deny|reserved|moving|chalkboard|info_update|lightning|dragon_egg|mob_head|player_head|written|spawner|end_portal/;

// Feature 5: contract upgrades (level 1 to 3). Each level adds one roll and cuts the wait time.
export const UPGRADE_MAX = 3;
export const UPGRADE_CUT = 0.2;

// Feature 6: golden chests. [item id, min, max, required license]
export const GOLDEN_CHANCE = 0.1;
export const GOLDEN_LOOT = [
  ["amethyst_shard", 2, 4, "t6"], ["gold_ingot", 2, 4, "t5"], ["diamond", 1, 2, "t6"], ["emerald", 1, 3, "t6"],
];

// Feature 9: achievements. Each grants coins once.
export const ACHIEVEMENTS = [
  { id: "first_diamond", name: "Diamond Drop", desc: "Mine a diamond from the OneBlock", reward: 50 },
  { id: "first_contract", name: "Chest Hunter", desc: "Activate a Natural Loot Contract", reward: 50 },
  { id: "sell_1000", name: "Market Regular", desc: "Sell 1,000 items", reward: 150 },
  { id: "island_max", name: "Frontier Owner", desc: "Reach the largest island", reward: 300 },
  { id: "all_licenses", name: "Sovereign Collector", desc: "Own every block license", reward: 500 },
];

// One-tap shop: only purchases at or above this many coins ask for a confirmation.
export const BIG_CONFIRM = 2000;

// Auto-Miner: permanent world-wide levels. step = ticks between OneBlock breaks (1 tick at the top level).
// Each Minecraft day it runs AUTO_DAILY_TICKS (2 minutes) and then reports that it is exhausted.
export const AUTO_LEVELS = [
  { cost: 100, step: 10 },
  { cost: 400, step: 6 },
  { cost: 1500, step: 4 },
  { cost: 5000, step: 2 },
  { cost: 15000, step: 1 },
];
export const AUTO_DAILY_TICKS = 2400;

// Basic Supply Chest: chance per OneBlock break (times the contract level) that the OneBlock becomes a loot chest.
export const BASIC_CHEST_CHANCE = 0.05;
