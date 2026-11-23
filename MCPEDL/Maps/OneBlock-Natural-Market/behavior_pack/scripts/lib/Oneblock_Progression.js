/**
 * Oneblock_Progression.js
 * Pure Data Pool Foundation for OneBlock Maps, Add-ons, and Minigames.
 * Target: Minecraft Bedrock 1.26.50 (all ids are Bedrock ids, not Java ids).
 *
 * ARCHITECTURE PRINCIPLE:
 * - This file ONLY holds the DATA POOLS (Blocks, Chest Loot, Mobs, Phase Milestones & Themes).
 * - Pack-specific gameplay logic, spawn mechanics, triggers, chest roll rates, custom events,
 *   cooldowns, and island systems belong inside the individual pack's scripts.
 * - Packs import or read from this progression pool without mutating the shared definitions.
 *
 * PROGRESSION ORDER (classic OneBlock):
 *   Overworld biomes -> Caves & Deep Dark -> Nether -> The End.
 *   1 Plains, 2 Underground, 3 Snowy Taiga, 4 Ocean, 5 Jungle, 6 Desert, 7 Badlands,
 *   8 Savanna Plains, 9 Dark Forest & Mushroom Fields, 10 Mangrove Swamp, 11 Cherry Grove,
 *   12 Pale Garden, 13 Windswept Highlands, 14 Craftsman's Workshop, 15 Deepslate Depths,
 *   16 Deep Dark, 17 Nether Wastes, 18 Crimson & Warped Forests, 19 Bastion & Basalt Deltas,
 *   20 The End, 21 End City & Void Horizon (final, endless).
 *
 * UNLOCK MODEL:
 * - Each phase lists only what it UNLOCKS. Earlier content is never removed.
 * - OneblockPoolProvider.sampleBlock/sampleChestItem/sampleMob(phase) sample from every
 *   phase up to the current one. The newest phase gets 40% of the weight, older phases share the rest.
 * - Pass { exclusive: true } to sample the current phase only, or { currentShare: 0.6 } to tune.
 * - The last phase keeps unlocking nothing new: the full pool stays active forever.
 *
 * POOL NOTES:
 * - Block pools hold full solid blocks only (no plants or fluids), so they survive on the OneBlock.
 * - Chest pools hold no buckets, fluids, powders, spawn eggs, spawners or shulker items.
 * - Mob pools may include water mobs (ocean) or very strong mobs (warden); packs may filter them.
 * - `blocksRequired` is per phase (not cumulative). The last phase never ends.
 */

/**
 * @typedef {Object} BlockPoolEntry
 * @property {string} id - Minecraft block identifier (e.g. "minecraft:grass_block")
 * @property {number} weight - Relative probability weight in the pool
 * @property {Record<string, any>} [states] - Optional block state permutations
 */

/**
 * @typedef {Object} ChestPoolEntry
 * @property {string} id - Minecraft item identifier (e.g. "minecraft:oak_sapling")
 * @property {number} min - Minimum stack count
 * @property {number} max - Maximum stack count
 * @property {number} weight - Relative weight in the pool
 */

/**
 * @typedef {Object} MobPoolEntry
 * @property {string} id - Entity identifier (e.g. "minecraft:cow")
 * @property {number} weight - Relative spawn weight in the pool
 */

/**
 * @typedef {Object} PhaseDataPool
 * @property {number} phase - Phase index (1-based)
 * @property {string} name - Phase title
 * @property {string} description - Lore / theme description
 * @property {number} blocksRequired - Base block break milestone to finish phase
 * @property {string} bedrockReplacement - Safe fallback block when breaking
 * @property {BlockPoolEntry[]} blocks - Block pool
 * @property {ChestPoolEntry[]} chests - Chest item loot pool
 * @property {MobPoolEntry[]} mobs - Entity spawn pool
 */

/**
 * Foundation Phase Pools
 * @type {PhaseDataPool[]}
 */
export const ONEBLOCK_PROGRESSION_POOLS = [
  // ───────────────────────── OVERWORLD ─────────────────────────
  {
    phase: 1,
    name: "Plains & Early Roots",
    description: "The humble beginnings of survival. Gather wood, dirt, and early agricultural supplies.",
    blocksRequired: 150,
    bedrockReplacement: "minecraft:grass_block",
    blocks: [
      { id: "minecraft:grass_block", weight: 33 },
      { id: "minecraft:dirt", weight: 27 },
      { id: "minecraft:oak_log", weight: 18 },
      { id: "minecraft:oak_leaves", weight: 9 },
      { id: "minecraft:birch_log", weight: 5 },
      { id: "minecraft:clay", weight: 4 },
      { id: "minecraft:sand", weight: 4 }
    ],
    chests: [
      { id: "minecraft:oak_sapling", min: 1, max: 3, weight: 22 },
      { id: "minecraft:wheat_seeds", min: 2, max: 6, weight: 20 },
      { id: "minecraft:apple", min: 1, max: 4, weight: 16 },
      { id: "minecraft:carrot", min: 1, max: 3, weight: 12 },
      { id: "minecraft:potato", min: 1, max: 3, weight: 10 },
      { id: "minecraft:bone", min: 1, max: 3, weight: 10 },
      { id: "minecraft:bread", min: 1, max: 2, weight: 10 }
    ],
    mobs: [
      { id: "minecraft:chicken", weight: 35 },
      { id: "minecraft:pig", weight: 30 },
      { id: "minecraft:sheep", weight: 25 },
      { id: "minecraft:cow", weight: 10 }
    ]
  },
  {
    phase: 2,
    name: "Underground Cavern",
    description: "Dig deep into stone layers, uncovering coal, raw iron, and subterranean minerals.",
    blocksRequired: 250,
    bedrockReplacement: "minecraft:stone",
    blocks: [
      { id: "minecraft:stone", weight: 30 },
      { id: "minecraft:cobblestone", weight: 22 },
      { id: "minecraft:gravel", weight: 10 },
      { id: "minecraft:andesite", weight: 7 },
      { id: "minecraft:diorite", weight: 5 },
      { id: "minecraft:granite", weight: 5 },
      { id: "minecraft:coal_ore", weight: 10 },
      { id: "minecraft:iron_ore", weight: 7 },
      { id: "minecraft:copper_ore", weight: 4 }
    ],
    chests: [
      { id: "minecraft:torch", min: 4, max: 12, weight: 25 },
      { id: "minecraft:coal", min: 2, max: 6, weight: 20 },
      { id: "minecraft:iron_nugget", min: 3, max: 8, weight: 15 },
      { id: "minecraft:raw_iron", min: 1, max: 3, weight: 14 },
      { id: "minecraft:raw_copper", min: 1, max: 4, weight: 10 },
      { id: "minecraft:bread", min: 2, max: 5, weight: 8 },
      { id: "minecraft:string", min: 1, max: 3, weight: 8 }
    ],
    mobs: [
      { id: "minecraft:zombie", weight: 30 },
      { id: "minecraft:skeleton", weight: 25 },
      { id: "minecraft:spider", weight: 25 },
      { id: "minecraft:bat", weight: 15 },
      { id: "minecraft:creeper", weight: 5 }
    ]
  },
  {
    phase: 3,
    name: "Snowy Taiga & Tundra",
    description: "Frozen spruce forests and packed snow. Gather leather, berries, and cold-weather supplies.",
    blocksRequired: 300,
    bedrockReplacement: "minecraft:snow",
    blocks: [
      { id: "minecraft:snow", weight: 20 },
      { id: "minecraft:spruce_log", weight: 20 },
      { id: "minecraft:spruce_leaves", weight: 12 },
      { id: "minecraft:podzol", weight: 10 },
      { id: "minecraft:dirt", weight: 8 },
      { id: "minecraft:stone", weight: 10 },
      { id: "minecraft:ice", weight: 8 },
      { id: "minecraft:packed_ice", weight: 6 },
      { id: "minecraft:blue_ice", weight: 3 },
      { id: "minecraft:coal_ore", weight: 3 }
    ],
    chests: [
      { id: "minecraft:spruce_sapling", min: 1, max: 3, weight: 22 },
      { id: "minecraft:sweet_berries", min: 2, max: 5, weight: 25 },
      { id: "minecraft:leather", min: 1, max: 3, weight: 15 },
      { id: "minecraft:rabbit_hide", min: 1, max: 3, weight: 12 },
      { id: "minecraft:iron_ingot", min: 1, max: 2, weight: 12 },
      { id: "minecraft:cooked_salmon", min: 1, max: 2, weight: 9 },
      { id: "minecraft:emerald", min: 1, max: 1, weight: 5 }
    ],
    mobs: [
      { id: "minecraft:wolf", weight: 25 },
      { id: "minecraft:fox", weight: 20 },
      { id: "minecraft:rabbit", weight: 20 },
      { id: "minecraft:stray", weight: 20 },
      { id: "minecraft:polar_bear", weight: 15 }
    ]
  },
  {
    phase: 4,
    name: "Ocean Floor",
    description: "Sunken sands, prismarine ruins, and coral beds from the depths of the ocean.",
    blocksRequired: 350,
    bedrockReplacement: "minecraft:sand",
    blocks: [
      { id: "minecraft:sand", weight: 18 },
      { id: "minecraft:gravel", weight: 14 },
      { id: "minecraft:clay", weight: 12 },
      { id: "minecraft:prismarine", weight: 12 },
      { id: "minecraft:prismarine_bricks", weight: 8 },
      { id: "minecraft:dark_prismarine", weight: 4 },
      { id: "minecraft:sea_lantern", weight: 3 },
      { id: "minecraft:sandstone", weight: 9 },
      { id: "minecraft:tube_coral_block", weight: 5 },
      { id: "minecraft:brain_coral_block", weight: 5 },
      { id: "minecraft:bubble_coral_block", weight: 5 },
      { id: "minecraft:horn_coral_block", weight: 5 }
    ],
    chests: [
      { id: "minecraft:kelp", min: 2, max: 6, weight: 20 },
      { id: "minecraft:sea_pickle", min: 1, max: 3, weight: 15 },
      { id: "minecraft:cod", min: 2, max: 4, weight: 15 },
      { id: "minecraft:salmon", min: 1, max: 3, weight: 12 },
      { id: "minecraft:prismarine_shard", min: 2, max: 5, weight: 12 },
      { id: "minecraft:prismarine_crystals", min: 1, max: 3, weight: 8 },
      { id: "minecraft:ink_sac", min: 1, max: 3, weight: 8 },
      { id: "minecraft:nautilus_shell", min: 1, max: 1, weight: 6 },
      { id: "minecraft:heart_of_the_sea", min: 1, max: 1, weight: 4 }
    ],
    mobs: [
      { id: "minecraft:drowned", weight: 55 },
      { id: "minecraft:turtle", weight: 30 },
      { id: "minecraft:squid", weight: 15 }
    ]
  },
  {
    phase: 5,
    name: "Jungle Canopy",
    description: "Dense jungle growth, mossy ruins, bamboo groves, and rare jungle materials.",
    blocksRequired: 400,
    bedrockReplacement: "minecraft:moss_block",
    blocks: [
      { id: "minecraft:jungle_log", weight: 22 },
      { id: "minecraft:jungle_leaves", weight: 18 },
      { id: "minecraft:grass_block", weight: 12 },
      { id: "minecraft:dirt", weight: 8 },
      { id: "minecraft:mossy_cobblestone", weight: 8 },
      { id: "minecraft:moss_block", weight: 8 },
      { id: "minecraft:bamboo_block", weight: 8 },
      { id: "minecraft:melon_block", weight: 6 },
      { id: "minecraft:mud", weight: 4 },
      { id: "minecraft:lapis_ore", weight: 6 }
    ],
    chests: [
      { id: "minecraft:bamboo", min: 2, max: 5, weight: 20 },
      { id: "minecraft:jungle_sapling", min: 1, max: 3, weight: 18 },
      { id: "minecraft:melon_seeds", min: 1, max: 3, weight: 16 },
      { id: "minecraft:cocoa_beans", min: 2, max: 4, weight: 16 },
      { id: "minecraft:vine", min: 2, max: 4, weight: 10 },
      { id: "minecraft:lapis_lazuli", min: 2, max: 6, weight: 10 },
      { id: "minecraft:golden_apple", min: 1, max: 1, weight: 5 },
      { id: "minecraft:emerald", min: 1, max: 2, weight: 5 }
    ],
    mobs: [
      { id: "minecraft:ocelot", weight: 28 },
      { id: "minecraft:parrot", weight: 28 },
      { id: "minecraft:panda", weight: 16 },
      { id: "minecraft:skeleton", weight: 14 },
      { id: "minecraft:creeper", weight: 14 }
    ]
  },
  {
    phase: 6,
    name: "Desert Dunes",
    description: "Scorched sands and buried temples. Sandstone, gold, and ancient desert loot.",
    blocksRequired: 400,
    bedrockReplacement: "minecraft:sandstone",
    blocks: [
      { id: "minecraft:sand", weight: 35 },
      { id: "minecraft:sandstone", weight: 22 },
      { id: "minecraft:cut_sandstone", weight: 9 },
      { id: "minecraft:smooth_sandstone", weight: 7 },
      { id: "minecraft:chiseled_sandstone", weight: 4 },
      { id: "minecraft:hardened_clay", weight: 9 },
      { id: "minecraft:gold_ore", weight: 6 },
      { id: "minecraft:coal_ore", weight: 8 }
    ],
    chests: [
      { id: "minecraft:cactus", min: 1, max: 4, weight: 20 },
      { id: "minecraft:gold_nugget", min: 3, max: 9, weight: 18 },
      { id: "minecraft:gold_ingot", min: 1, max: 3, weight: 12 },
      { id: "minecraft:bone", min: 2, max: 5, weight: 15 },
      { id: "minecraft:spider_eye", min: 1, max: 3, weight: 15 },
      { id: "minecraft:rotten_flesh", min: 2, max: 6, weight: 10 },
      { id: "minecraft:emerald", min: 1, max: 2, weight: 6 },
      { id: "minecraft:diamond", min: 1, max: 1, weight: 4 }
    ],
    mobs: [
      { id: "minecraft:husk", weight: 35 },
      { id: "minecraft:rabbit", weight: 20 },
      { id: "minecraft:skeleton", weight: 20 },
      { id: "minecraft:camel", weight: 15 },
      { id: "minecraft:spider", weight: 10 }
    ]
  },
  {
    phase: 7,
    name: "Badlands Mesa",
    description: "Layered red clay and rich gold veins carved into towering mesas.",
    blocksRequired: 450,
    bedrockReplacement: "minecraft:hardened_clay",
    blocks: [
      { id: "minecraft:hardened_clay", weight: 22 },
      { id: "minecraft:red_sand", weight: 20 },
      { id: "minecraft:red_sandstone", weight: 14 },
      { id: "minecraft:cut_red_sandstone", weight: 8 },
      { id: "minecraft:smooth_red_sandstone", weight: 6 },
      { id: "minecraft:coarse_dirt", weight: 10 },
      { id: "minecraft:gold_ore", weight: 12 },
      { id: "minecraft:iron_ore", weight: 8 }
    ],
    chests: [
      { id: "minecraft:gold_ingot", min: 1, max: 4, weight: 20 },
      { id: "minecraft:gold_nugget", min: 4, max: 10, weight: 18 },
      { id: "minecraft:raw_gold", min: 1, max: 3, weight: 15 },
      { id: "minecraft:iron_ingot", min: 1, max: 3, weight: 12 },
      { id: "minecraft:clay_ball", min: 2, max: 6, weight: 10 },
      { id: "minecraft:bone", min: 2, max: 4, weight: 10 },
      { id: "minecraft:emerald", min: 1, max: 2, weight: 8 },
      { id: "minecraft:golden_apple", min: 1, max: 1, weight: 7 }
    ],
    mobs: [
      { id: "minecraft:skeleton", weight: 25 },
      { id: "minecraft:zombie", weight: 25 },
      { id: "minecraft:spider", weight: 20 },
      { id: "minecraft:creeper", weight: 15 },
      { id: "minecraft:armadillo", weight: 15 }
    ]
  },
  {
    phase: 8,
    name: "Savanna Plains",
    description: "Flat-topped acacia trees, golden hay, and wandering herds across the dry grassland.",
    blocksRequired: 450,
    bedrockReplacement: "minecraft:coarse_dirt",
    blocks: [
      { id: "minecraft:acacia_log", weight: 28 },
      { id: "minecraft:acacia_leaves", weight: 22 },
      { id: "minecraft:acacia_planks", weight: 10 },
      { id: "minecraft:stripped_acacia_log", weight: 8 },
      { id: "minecraft:hay_block", weight: 6 },
      { id: "minecraft:coarse_dirt", weight: 14 },
      { id: "minecraft:grass_block", weight: 12 }
    ],
    chests: [
      { id: "minecraft:acacia_sapling", min: 1, max: 3, weight: 22 },
      { id: "minecraft:wheat", min: 2, max: 5, weight: 16 },
      { id: "minecraft:leather", min: 1, max: 3, weight: 14 },
      { id: "minecraft:bread", min: 2, max: 4, weight: 12 },
      { id: "minecraft:lead", min: 1, max: 1, weight: 10 },
      { id: "minecraft:hay_block", min: 1, max: 2, weight: 8 },
      { id: "minecraft:saddle", min: 1, max: 1, weight: 6 },
      { id: "minecraft:golden_carrot", min: 1, max: 2, weight: 6 },
      { id: "minecraft:name_tag", min: 1, max: 1, weight: 6 }
    ],
    mobs: [
      { id: "minecraft:horse", weight: 28 },
      { id: "minecraft:donkey", weight: 18 },
      { id: "minecraft:llama", weight: 18 },
      { id: "minecraft:sheep", weight: 16 },
      { id: "minecraft:zombie", weight: 10 },
      { id: "minecraft:skeleton", weight: 10 }
    ]
  },
  {
    phase: 9,
    name: "Dark Forest & Mushroom Fields",
    description: "Towering dark oaks and giant glowing mushrooms growing from rich mycelium.",
    blocksRequired: 500,
    bedrockReplacement: "minecraft:dark_oak_planks",
    blocks: [
      { id: "minecraft:dark_oak_log", weight: 20 },
      { id: "minecraft:dark_oak_leaves", weight: 18 },
      { id: "minecraft:dark_oak_planks", weight: 6 },
      { id: "minecraft:stripped_dark_oak_log", weight: 6 },
      { id: "minecraft:mycelium", weight: 14 },
      { id: "minecraft:brown_mushroom_block", weight: 12 },
      { id: "minecraft:red_mushroom_block", weight: 12 },
      { id: "minecraft:mushroom_stem", weight: 8 },
      { id: "minecraft:grass_block", weight: 4 }
    ],
    chests: [
      { id: "minecraft:dark_oak_sapling", min: 1, max: 3, weight: 20 },
      { id: "minecraft:brown_mushroom", min: 2, max: 5, weight: 16 },
      { id: "minecraft:red_mushroom", min: 2, max: 5, weight: 16 },
      { id: "minecraft:mushroom_stew", min: 1, max: 1, weight: 10 },
      { id: "minecraft:bone_meal", min: 2, max: 5, weight: 10 },
      { id: "minecraft:bowl", min: 1, max: 3, weight: 8 },
      { id: "minecraft:glass_bottle", min: 1, max: 3, weight: 8 },
      { id: "minecraft:emerald", min: 1, max: 3, weight: 8 },
      { id: "minecraft:totem_of_undying", min: 1, max: 1, weight: 4 }
    ],
    mobs: [
      { id: "minecraft:mooshroom", weight: 30 },
      { id: "minecraft:witch", weight: 15 },
      { id: "minecraft:zombie", weight: 15 },
      { id: "minecraft:skeleton", weight: 15 },
      { id: "minecraft:vindicator", weight: 10 },
      { id: "minecraft:spider", weight: 10 },
      { id: "minecraft:evoker", weight: 5 }
    ]
  },
  {
    phase: 10,
    name: "Mangrove Swamp",
    description: "Muddy roots, mangrove trees, and murky swamp life.",
    blocksRequired: 450,
    bedrockReplacement: "minecraft:mud",
    blocks: [
      { id: "minecraft:mud", weight: 24 },
      { id: "minecraft:mangrove_log", weight: 18 },
      { id: "minecraft:mangrove_leaves", weight: 12 },
      { id: "minecraft:mangrove_roots", weight: 8 },
      { id: "minecraft:muddy_mangrove_roots", weight: 12 },
      { id: "minecraft:packed_mud", weight: 6 },
      { id: "minecraft:mud_bricks", weight: 4 },
      { id: "minecraft:clay", weight: 6 },
      { id: "minecraft:moss_block", weight: 4 },
      { id: "minecraft:mangrove_planks", weight: 3 },
      { id: "minecraft:dirt", weight: 3 }
    ],
    chests: [
      { id: "minecraft:mangrove_propagule", min: 1, max: 3, weight: 22 },
      { id: "minecraft:slime_ball", min: 1, max: 4, weight: 20 },
      { id: "minecraft:clay_ball", min: 2, max: 6, weight: 15 },
      { id: "minecraft:brown_mushroom", min: 1, max: 3, weight: 12 },
      { id: "minecraft:red_mushroom", min: 1, max: 3, weight: 10 },
      { id: "minecraft:spider_eye", min: 1, max: 3, weight: 8 },
      { id: "minecraft:lead", min: 1, max: 1, weight: 8 },
      { id: "minecraft:experience_bottle", min: 1, max: 2, weight: 5 }
    ],
    mobs: [
      { id: "minecraft:frog", weight: 25 },
      { id: "minecraft:slime", weight: 25 },
      { id: "minecraft:bogged", weight: 20 },
      { id: "minecraft:witch", weight: 15 },
      { id: "minecraft:zombie", weight: 15 }
    ]
  },
  {
    phase: 11,
    name: "Cherry Grove",
    description: "A peaceful pink-blossom meadow on the mountainside.",
    blocksRequired: 500,
    bedrockReplacement: "minecraft:grass_block",
    blocks: [
      { id: "minecraft:cherry_log", weight: 20 },
      { id: "minecraft:cherry_leaves", weight: 24 },
      { id: "minecraft:grass_block", weight: 20 },
      { id: "minecraft:dirt", weight: 10 },
      { id: "minecraft:stripped_cherry_log", weight: 8 },
      { id: "minecraft:cherry_planks", weight: 12 },
      { id: "minecraft:stone", weight: 6 }
    ],
    chests: [
      { id: "minecraft:cherry_sapling", min: 1, max: 3, weight: 22 },
      { id: "minecraft:pink_petals", min: 2, max: 6, weight: 22 },
      { id: "minecraft:apple", min: 1, max: 3, weight: 16 },
      { id: "minecraft:bone_meal", min: 2, max: 5, weight: 15 },
      { id: "minecraft:amethyst_shard", min: 1, max: 3, weight: 10 },
      { id: "minecraft:golden_carrot", min: 1, max: 2, weight: 10 },
      { id: "minecraft:cookie", min: 1, max: 3, weight: 5 }
    ],
    mobs: [
      { id: "minecraft:pig", weight: 25 },
      { id: "minecraft:sheep", weight: 25 },
      { id: "minecraft:rabbit", weight: 20 },
      { id: "minecraft:bee", weight: 15 },
      { id: "minecraft:donkey", weight: 15 }
    ]
  },
  {
    phase: 12,
    name: "Pale Garden",
    description: "A silent, grey forest of pale oak, pale moss, and resin. The creaking stir at night.",
    blocksRequired: 500,
    bedrockReplacement: "minecraft:pale_moss_block",
    blocks: [
      { id: "minecraft:pale_oak_log", weight: 24 },
      { id: "minecraft:pale_oak_leaves", weight: 20 },
      { id: "minecraft:pale_moss_block", weight: 18 },
      { id: "minecraft:dirt", weight: 10 },
      { id: "minecraft:pale_oak_planks", weight: 10 },
      { id: "minecraft:stripped_pale_oak_log", weight: 8 },
      { id: "minecraft:coarse_dirt", weight: 6 },
      { id: "minecraft:resin_block", weight: 4 }
    ],
    chests: [
      { id: "minecraft:pale_oak_sapling", min: 1, max: 3, weight: 22 },
      { id: "minecraft:resin_clump", min: 2, max: 6, weight: 22 },
      { id: "minecraft:open_eyeblossom", min: 1, max: 2, weight: 15 },
      { id: "minecraft:closed_eyeblossom", min: 1, max: 2, weight: 10 },
      { id: "minecraft:bone_meal", min: 2, max: 6, weight: 11 },
      { id: "minecraft:bone", min: 1, max: 3, weight: 10 },
      { id: "minecraft:resin_brick", min: 1, max: 3, weight: 10 }
    ],
    mobs: [
      { id: "minecraft:creaking", weight: 50 },
      { id: "minecraft:zombie", weight: 20 },
      { id: "minecraft:skeleton", weight: 15 },
      { id: "minecraft:spider", weight: 15 }
    ]
  },

  {
    phase: 13,
    name: "Windswept Highlands",
    description: "Rocky peaks, old spruce taiga, and emerald veins high above the valleys.",
    blocksRequired: 550,
    bedrockReplacement: "minecraft:stone",
    blocks: [
      { id: "minecraft:stone", weight: 18 },
      { id: "minecraft:gravel", weight: 8 },
      { id: "minecraft:andesite", weight: 6 },
      { id: "minecraft:cobblestone", weight: 6 },
      { id: "minecraft:spruce_log", weight: 14 },
      { id: "minecraft:spruce_leaves", weight: 10 },
      { id: "minecraft:spruce_planks", weight: 6 },
      { id: "minecraft:stripped_spruce_log", weight: 4 },
      { id: "minecraft:podzol", weight: 8 },
      { id: "minecraft:mossy_cobblestone", weight: 8 },
      { id: "minecraft:coarse_dirt", weight: 6 },
      { id: "minecraft:emerald_ore", weight: 6 }
    ],
    chests: [
      { id: "minecraft:emerald", min: 1, max: 3, weight: 20 },
      { id: "minecraft:spruce_sapling", min: 1, max: 3, weight: 14 },
      { id: "minecraft:iron_ingot", min: 2, max: 4, weight: 14 },
      { id: "minecraft:cooked_mutton", min: 1, max: 3, weight: 12 },
      { id: "minecraft:coal", min: 2, max: 6, weight: 10 },
      { id: "minecraft:leather", min: 1, max: 3, weight: 10 },
      { id: "minecraft:copper_ingot", min: 2, max: 5, weight: 8 },
      { id: "minecraft:bone", min: 1, max: 3, weight: 8 },
      { id: "minecraft:diamond", min: 1, max: 1, weight: 4 }
    ],
    mobs: [
      { id: "minecraft:goat", weight: 25 },
      { id: "minecraft:llama", weight: 20 },
      { id: "minecraft:wolf", weight: 15 },
      { id: "minecraft:skeleton", weight: 15 },
      { id: "minecraft:zombie", weight: 10 },
      { id: "minecraft:creeper", weight: 10 },
      { id: "minecraft:spider", weight: 5 }
    ]
  },
  {
    phase: 14,
    name: "Craftsman's Workshop",
    description: "A village of builders: wool, glass, concrete, bookshelves, colored clay, and copper.",
    blocksRequired: 600,
    bedrockReplacement: "minecraft:cobblestone",
    blocks: [
      { id: "minecraft:white_wool", weight: 5 },
      { id: "minecraft:orange_wool", weight: 3 },
      { id: "minecraft:red_wool", weight: 3 },
      { id: "minecraft:blue_wool", weight: 3 },
      { id: "minecraft:green_wool", weight: 3 },
      { id: "minecraft:yellow_wool", weight: 3 },
      { id: "minecraft:black_wool", weight: 3 },
      { id: "minecraft:glass", weight: 8 },
      { id: "minecraft:tinted_glass", weight: 2 },
      { id: "minecraft:bookshelf", weight: 6 },
      { id: "minecraft:chiseled_bookshelf", weight: 3 },
      { id: "minecraft:white_concrete", weight: 3 },
      { id: "minecraft:orange_concrete", weight: 2 },
      { id: "minecraft:red_concrete", weight: 2 },
      { id: "minecraft:blue_concrete", weight: 2 },
      { id: "minecraft:light_gray_concrete", weight: 2 },
      { id: "minecraft:black_concrete", weight: 2 },
      { id: "minecraft:white_terracotta", weight: 3 },
      { id: "minecraft:orange_terracotta", weight: 3 },
      { id: "minecraft:yellow_terracotta", weight: 3 },
      { id: "minecraft:brown_terracotta", weight: 3 },
      { id: "minecraft:red_terracotta", weight: 3 },
      { id: "minecraft:light_gray_terracotta", weight: 3 },
      { id: "minecraft:copper_block", weight: 4 },
      { id: "minecraft:cut_copper", weight: 4 },
      { id: "minecraft:exposed_copper", weight: 2 },
      { id: "minecraft:weathered_copper", weight: 2 },
      { id: "minecraft:oxidized_copper", weight: 2 },
      { id: "minecraft:copper_grate", weight: 2 },
      { id: "minecraft:chiseled_copper", weight: 2 },
      { id: "minecraft:oak_planks", weight: 5 },
      { id: "minecraft:crafting_table", weight: 4 }
    ],
    chests: [
      { id: "minecraft:book", min: 1, max: 3, weight: 14 },
      { id: "minecraft:paper", min: 2, max: 6, weight: 14 },
      { id: "minecraft:emerald", min: 1, max: 3, weight: 14 },
      { id: "minecraft:copper_ingot", min: 2, max: 6, weight: 12 },
      { id: "minecraft:iron_ingot", min: 1, max: 3, weight: 10 },
      { id: "minecraft:glass_bottle", min: 1, max: 3, weight: 8 },
      { id: "minecraft:bread", min: 2, max: 4, weight: 8 },
      { id: "minecraft:wheat", min: 2, max: 5, weight: 6 },
      { id: "minecraft:gold_ingot", min: 1, max: 2, weight: 6 },
      { id: "minecraft:diamond", min: 1, max: 1, weight: 4 },
      { id: "minecraft:experience_bottle", min: 1, max: 2, weight: 4 }
    ],
    mobs: [
      { id: "minecraft:villager", weight: 30 },
      { id: "minecraft:pillager", weight: 20 },
      { id: "minecraft:cat", weight: 15 },
      { id: "minecraft:vindicator", weight: 15 },
      { id: "minecraft:iron_golem", weight: 10 },
      { id: "minecraft:wandering_trader", weight: 5 },
      { id: "minecraft:zombie_villager", weight: 5 }
    ]
  },

  // ─────────────────────── DEEP CAVES ───────────────────────
  {
    phase: 15,
    name: "Deepslate Depths",
    description: "Dark deepslate caverns rich in diamonds, redstone, copper, and trial chamber tuff.",
    blocksRequired: 600,
    bedrockReplacement: "minecraft:deepslate",
    blocks: [
      { id: "minecraft:deepslate", weight: 30 },
      { id: "minecraft:cobbled_deepslate", weight: 20 },
      { id: "minecraft:tuff", weight: 12 },
      { id: "minecraft:tuff_bricks", weight: 3 },
      { id: "minecraft:calcite", weight: 2 },
      { id: "minecraft:deepslate_coal_ore", weight: 6 },
      { id: "minecraft:deepslate_iron_ore", weight: 7 },
      { id: "minecraft:deepslate_copper_ore", weight: 5 },
      { id: "minecraft:deepslate_gold_ore", weight: 4 },
      { id: "minecraft:deepslate_redstone_ore", weight: 5 },
      { id: "minecraft:deepslate_lapis_ore", weight: 4 },
      { id: "minecraft:deepslate_diamond_ore", weight: 2 }
    ],
    chests: [
      { id: "minecraft:redstone", min: 3, max: 8, weight: 18 },
      { id: "minecraft:lapis_lazuli", min: 2, max: 6, weight: 14 },
      { id: "minecraft:raw_gold", min: 1, max: 3, weight: 14 },
      { id: "minecraft:raw_copper", min: 2, max: 5, weight: 14 },
      { id: "minecraft:copper_ingot", min: 2, max: 6, weight: 10 },
      { id: "minecraft:amethyst_shard", min: 2, max: 5, weight: 10 },
      { id: "minecraft:iron_ingot", min: 2, max: 4, weight: 8 },
      { id: "minecraft:wind_charge", min: 2, max: 5, weight: 6 },
      { id: "minecraft:diamond", min: 1, max: 1, weight: 6 }
    ],
    mobs: [
      { id: "minecraft:zombie", weight: 20 },
      { id: "minecraft:skeleton", weight: 20 },
      { id: "minecraft:creeper", weight: 15 },
      { id: "minecraft:cave_spider", weight: 15 },
      { id: "minecraft:breeze", weight: 10 },
      { id: "minecraft:silverfish", weight: 10 },
      { id: "minecraft:copper_golem", weight: 5 },
      { id: "minecraft:bat", weight: 5 }
    ]
  },
  {
    phase: 16,
    name: "Deep Dark",
    description: "Ancient sculk-infested depths where echo shards hide and the warden sleeps.",
    blocksRequired: 600,
    bedrockReplacement: "minecraft:deepslate",
    blocks: [
      { id: "minecraft:deepslate", weight: 25 },
      { id: "minecraft:sculk", weight: 25 },
      { id: "minecraft:cobbled_deepslate", weight: 12 },
      { id: "minecraft:deepslate_bricks", weight: 10 },
      { id: "minecraft:deepslate_tiles", weight: 6 },
      { id: "minecraft:sculk_catalyst", weight: 6 },
      { id: "minecraft:bone_block", weight: 6 },
      { id: "minecraft:calcite", weight: 5 },
      { id: "minecraft:tuff", weight: 5 }
    ],
    chests: [
      { id: "minecraft:experience_bottle", min: 1, max: 3, weight: 20 },
      { id: "minecraft:amethyst_shard", min: 2, max: 5, weight: 16 },
      { id: "minecraft:echo_shard", min: 1, max: 2, weight: 14 },
      { id: "minecraft:glow_berries", min: 2, max: 6, weight: 14 },
      { id: "minecraft:book", min: 1, max: 2, weight: 14 },
      { id: "minecraft:disc_fragment_5", min: 1, max: 1, weight: 8 },
      { id: "minecraft:diamond", min: 1, max: 1, weight: 8 },
      { id: "minecraft:recovery_compass", min: 1, max: 1, weight: 6 }
    ],
    mobs: [
      { id: "minecraft:zombie", weight: 30 },
      { id: "minecraft:skeleton", weight: 28 },
      { id: "minecraft:creeper", weight: 15 },
      { id: "minecraft:bat", weight: 15 },
      { id: "minecraft:silverfish", weight: 10 },
      { id: "minecraft:warden", weight: 2 }
    ]
  },

  // ───────────────────────── NETHER ─────────────────────────
  {
    phase: 17,
    name: "Nether Wastes",
    description: "Volcanic heat, soul sand, and glowing quartz from the depths of the Nether.",
    blocksRequired: 700,
    bedrockReplacement: "minecraft:netherrack",
    blocks: [
      { id: "minecraft:netherrack", weight: 38 },
      { id: "minecraft:soul_sand", weight: 12 },
      { id: "minecraft:soul_soil", weight: 8 },
      { id: "minecraft:quartz_ore", weight: 12 },
      { id: "minecraft:nether_gold_ore", weight: 10 },
      { id: "minecraft:magma", weight: 6 },
      { id: "minecraft:glowstone", weight: 6 },
      { id: "minecraft:gravel", weight: 5 },
      { id: "minecraft:dried_ghast", weight: 3 }
    ],
    chests: [
      { id: "minecraft:nether_wart", min: 1, max: 4, weight: 22 },
      { id: "minecraft:glowstone_dust", min: 2, max: 6, weight: 18 },
      { id: "minecraft:quartz", min: 2, max: 5, weight: 18 },
      { id: "minecraft:magma_cream", min: 1, max: 3, weight: 12 },
      { id: "minecraft:ghast_tear", min: 1, max: 1, weight: 10 },
      { id: "minecraft:blaze_rod", min: 1, max: 2, weight: 10 },
      { id: "minecraft:gold_nugget", min: 3, max: 9, weight: 10 }
    ],
    mobs: [
      { id: "minecraft:zombified_piglin", weight: 35 },
      { id: "minecraft:magma_cube", weight: 20 },
      { id: "minecraft:strider", weight: 15 },
      { id: "minecraft:skeleton", weight: 13 },
      { id: "minecraft:ghast", weight: 12 },
      { id: "minecraft:happy_ghast", weight: 5 }
    ]
  },
  {
    phase: 18,
    name: "Crimson & Warped Forests",
    description: "Giant fungal forests of red and teal, home to hoglins, piglins, and striders.",
    blocksRequired: 700,
    bedrockReplacement: "minecraft:netherrack",
    blocks: [
      { id: "minecraft:crimson_nylium", weight: 15 },
      { id: "minecraft:crimson_stem", weight: 14 },
      { id: "minecraft:nether_wart_block", weight: 12 },
      { id: "minecraft:warped_nylium", weight: 15 },
      { id: "minecraft:warped_stem", weight: 14 },
      { id: "minecraft:warped_wart_block", weight: 12 },
      { id: "minecraft:shroomlight", weight: 6 },
      { id: "minecraft:netherrack", weight: 12 }
    ],
    chests: [
      { id: "minecraft:crimson_fungus", min: 1, max: 3, weight: 18 },
      { id: "minecraft:warped_fungus", min: 1, max: 3, weight: 18 },
      { id: "minecraft:nether_wart", min: 2, max: 5, weight: 14 },
      { id: "minecraft:weeping_vines", min: 2, max: 5, weight: 12 },
      { id: "minecraft:twisting_vines", min: 2, max: 5, weight: 12 },
      { id: "minecraft:shroomlight", min: 1, max: 2, weight: 10 },
      { id: "minecraft:glowstone_dust", min: 2, max: 5, weight: 8 },
      { id: "minecraft:gold_nugget", min: 3, max: 8, weight: 8 }
    ],
    mobs: [
      { id: "minecraft:hoglin", weight: 30 },
      { id: "minecraft:piglin", weight: 30 },
      { id: "minecraft:strider", weight: 20 },
      { id: "minecraft:enderman", weight: 20 }
    ]
  },
  {
    phase: 19,
    name: "Bastion & Basalt Deltas",
    description: "Blackstone fortresses, gilded treasure, and rare ancient debris.",
    blocksRequired: 800,
    bedrockReplacement: "minecraft:blackstone",
    blocks: [
      { id: "minecraft:blackstone", weight: 25 },
      { id: "minecraft:polished_blackstone", weight: 12 },
      { id: "minecraft:polished_blackstone_bricks", weight: 10 },
      { id: "minecraft:chiseled_polished_blackstone", weight: 4 },
      { id: "minecraft:gilded_blackstone", weight: 6 },
      { id: "minecraft:basalt", weight: 12 },
      { id: "minecraft:nether_brick", weight: 8 },
      { id: "minecraft:netherrack", weight: 6 },
      { id: "minecraft:magma", weight: 5 },
      { id: "minecraft:obsidian", weight: 5 },
      { id: "minecraft:crying_obsidian", weight: 4 },
      { id: "minecraft:ancient_debris", weight: 3 }
    ],
    chests: [
      { id: "minecraft:gold_ingot", min: 2, max: 6, weight: 20 },
      { id: "minecraft:golden_carrot", min: 2, max: 4, weight: 12 },
      { id: "minecraft:obsidian", min: 1, max: 3, weight: 12 },
      { id: "minecraft:crying_obsidian", min: 1, max: 3, weight: 10 },
      { id: "minecraft:iron_ingot", min: 2, max: 5, weight: 10 },
      { id: "minecraft:blaze_rod", min: 1, max: 2, weight: 8 },
      { id: "minecraft:quartz", min: 4, max: 8, weight: 8 },
      { id: "minecraft:arrow", min: 4, max: 12, weight: 8 },
      { id: "minecraft:netherite_scrap", min: 1, max: 1, weight: 6 },
      { id: "minecraft:diamond", min: 1, max: 1, weight: 6 }
    ],
    mobs: [
      { id: "minecraft:piglin", weight: 28 },
      { id: "minecraft:piglin_brute", weight: 20 },
      { id: "minecraft:wither_skeleton", weight: 20 },
      { id: "minecraft:blaze", weight: 15 },
      { id: "minecraft:hoglin", weight: 12 },
      { id: "minecraft:magma_cube", weight: 5 }
    ]
  },

  // ───────────────────────── THE END ─────────────────────────
  {
    phase: 20,
    name: "The End",
    description: "The dimension beyond the stars. Pale end stone, obsidian pillars, and chorus.",
    blocksRequired: 800,
    bedrockReplacement: "minecraft:end_stone",
    blocks: [
      { id: "minecraft:end_stone", weight: 60 },
      { id: "minecraft:end_bricks", weight: 15 },
      { id: "minecraft:obsidian", weight: 15 },
      { id: "minecraft:crying_obsidian", weight: 5 },
      { id: "minecraft:purpur_block", weight: 5 }
    ],
    chests: [
      { id: "minecraft:chorus_fruit", min: 2, max: 6, weight: 30 },
      { id: "minecraft:ender_pearl", min: 1, max: 3, weight: 27 },
      { id: "minecraft:ender_eye", min: 1, max: 2, weight: 14 },
      { id: "minecraft:diamond", min: 1, max: 2, weight: 10 },
      { id: "minecraft:popped_chorus_fruit", min: 2, max: 5, weight: 10 },
      { id: "minecraft:end_rod", min: 1, max: 4, weight: 4 },
      { id: "minecraft:dragon_breath", min: 1, max: 1, weight: 5 }
    ],
    mobs: [
      { id: "minecraft:enderman", weight: 70 },
      { id: "minecraft:endermite", weight: 25 },
      { id: "minecraft:shulker", weight: 5 }
    ]
  },
  {
    phase: 21,
    name: "End City & Void Horizon",
    description: "Floating purpur cities and deep void treasures. The final, endless phase.",
    blocksRequired: 1000,
    bedrockReplacement: "minecraft:end_stone",
    blocks: [
      { id: "minecraft:purpur_block", weight: 25 },
      { id: "minecraft:end_stone", weight: 25 },
      { id: "minecraft:purpur_pillar", weight: 14 },
      { id: "minecraft:end_bricks", weight: 12 },
      { id: "minecraft:obsidian", weight: 8 },
      { id: "minecraft:crying_obsidian", weight: 6 },
      { id: "minecraft:amethyst_block", weight: 5 },
      { id: "minecraft:diamond_ore", weight: 5 }
    ],
    chests: [
      { id: "minecraft:ender_pearl", min: 1, max: 3, weight: 18 },
      { id: "minecraft:diamond", min: 1, max: 3, weight: 16 },
      { id: "minecraft:chorus_fruit", min: 2, max: 6, weight: 15 },
      { id: "minecraft:emerald", min: 2, max: 4, weight: 12 },
      { id: "minecraft:chorus_flower", min: 1, max: 2, weight: 10 },
      { id: "minecraft:ender_eye", min: 1, max: 2, weight: 10 },
      { id: "minecraft:experience_bottle", min: 2, max: 6, weight: 10 },
      { id: "minecraft:netherite_scrap", min: 1, max: 1, weight: 5 },
      { id: "minecraft:elytra", min: 1, max: 1, weight: 2 },
      { id: "minecraft:totem_of_undying", min: 1, max: 1, weight: 2 }
    ],
    mobs: [
      { id: "minecraft:enderman", weight: 55 },
      { id: "minecraft:endermite", weight: 25 },
      { id: "minecraft:shulker", weight: 20 }
    ]
  }
];

// Alias for backward compatibility
export const ONEBLOCK_PROGRESSION = ONEBLOCK_PROGRESSION_POOLS;

/** Share of total weight given to the newest phase in unlock mode (0..1). */
const DEFAULT_CURRENT_SHARE = 0.4;

/**
 * Pure Data Pool Accessor
 * Only provides sampling and lookup against the pools.
 * Pack rules (spawn rates, mechanics) are implemented by the pack.
 */
export class OneblockPoolProvider {
  /**
   * @param {PhaseDataPool[]} [pools]
   */
  constructor(pools = ONEBLOCK_PROGRESSION_POOLS) {
    this.pools = pools;
    this._unlockCache = new Map();
  }

  /**
   * Get phase data pool by 1-based number
   * @param {number} phaseNumber
   * @returns {PhaseDataPool}
   */
  getPhasePool(phaseNumber) {
    const clampedIndex = Math.max(1, Math.min(phaseNumber, this.pools.length)) - 1;
    return this.pools[clampedIndex];
  }

  /**
   * Calculate milestone phase from broken block count
   * @param {number} totalBreaks
   * @returns {{ phase: PhaseDataPool, phaseIndex: number, phaseBreaks: number, isLastPhase: boolean }}
   */
  getPhaseFromBreaks(totalBreaks) {
    let accumulated = 0;
    for (let i = 0; i < this.pools.length; i++) {
      const p = this.pools[i];
      if (totalBreaks < accumulated + p.blocksRequired) {
        return {
          phase: p,
          phaseIndex: i + 1,
          phaseBreaks: totalBreaks - accumulated,
          isLastPhase: false
        };
      }
      accumulated += p.blocksRequired;
    }
    const last = this.pools[this.pools.length - 1];
    return {
      phase: last,
      phaseIndex: this.pools.length,
      phaseBreaks: totalBreaks - accumulated,
      isLastPhase: true
    };
  }

  /**
   * Pick random item from a weighted pool
   * @template {{ weight: number }} T
   * @param {T[]} pool
   * @returns {T}
   */
  static sampleWeighted(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    let rand = Math.random() * totalWeight;
    for (const item of pool) {
      if (rand < item.weight) return item;
      rand -= item.weight;
    }
    return pool[pool.length - 1];
  }

  /**
   * Cumulative "unlock" pool: everything introduced in phases 1..phaseNumber.
   * The current phase gets `currentShare` of the total weight so new content
   * feels fresh; the remainder is split evenly across earlier phases.
   * Duplicate ids are merged. Returns new objects; shared pools are never mutated.
   * @param {number} phaseNumber - 1-based phase (clamped; also valid past the last phase)
   * @param {"blocks"|"chests"|"mobs"} kind
   * @param {number} [currentShare] - 0..1 share for the current phase
   * @returns {Array<{ id: string, weight: number, min?: number, max?: number }>}
   */
  getUnlockedPool(phaseNumber, kind, currentShare = DEFAULT_CURRENT_SHARE) {
    const upto = Math.max(1, Math.min(Math.floor(phaseNumber) || 1, this.pools.length));
    const key = `${kind}:${upto}:${currentShare}`;
    const cached = this._unlockCache.get(key);
    if (cached) return cached;

    const merged = new Map();
    for (let i = 0; i < upto; i++) {
      const list = this.pools[i][kind];
      const sum = list.reduce((s, e) => s + e.weight, 0);
      const share = upto === 1 ? 1 : (i === upto - 1 ? currentShare : (1 - currentShare) / (upto - 1));
      for (const e of list) {
        const w = (e.weight / sum) * share * 100;
        const prev = merged.get(e.id);
        if (!prev) {
          merged.set(e.id, { ...e, weight: w });
        } else {
          prev.weight += w;
          if (kind === "chests") {
            prev.min = Math.min(prev.min, e.min);
            prev.max = Math.max(prev.max, e.max);
          }
        }
      }
    }
    const out = [...merged.values()];
    this._unlockCache.set(key, out);
    return out;
  }

  /**
   * Resolve the pool to sample from.
   * Default = unlock mode (earlier phases stay available). `exclusive: true` = this phase only.
   */
  _resolvePool(phaseNumber, kind, options = {}) {
    if (options.exclusive) return this.getPhasePool(phaseNumber)[kind];
    return this.getUnlockedPool(phaseNumber, kind, options.currentShare);
  }

  /** Sample a block (unlock mode by default) */
  sampleBlock(phaseNumber, options) {
    return OneblockPoolProvider.sampleWeighted(this._resolvePool(phaseNumber, "blocks", options));
  }

  /** Sample a chest item (unlock mode by default) */
  sampleChestItem(phaseNumber, options) {
    return OneblockPoolProvider.sampleWeighted(this._resolvePool(phaseNumber, "chests", options));
  }

  /** Sample a mob (unlock mode by default) */
  sampleMob(phaseNumber, options) {
    return OneblockPoolProvider.sampleWeighted(this._resolvePool(phaseNumber, "mobs", options));
  }
}

// Backward-compatible alias
export const OneBlockProgressionManager = OneblockPoolProvider;
