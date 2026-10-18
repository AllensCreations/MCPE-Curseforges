// 15 Comprehensive Overworld Phases including all classic biomes & modern 1.20 - 1.26+ updates
// (Cherry Grove, Pale Garden, Trial Chambers/Tuff, Deepslate, Mangrove, Lush, etc.)
export const OVERWORLD_PHASES = [
  {
    name: "Plains & Forest",
    blocks: [
      { id: "minecraft:grass_block", weight: 35 },
      { id: "minecraft:dirt", weight: 25 },
      { id: "minecraft:oak_log", weight: 20 },
      { id: "minecraft:oak_leaves", weight: 15 },
      { id: "minecraft:clay", weight: 5 }
    ],
    chests: [
      { id: "minecraft:oak_sapling", min: 1, max: 3, weight: 20 },
      { id: "minecraft:wheat_seeds", min: 2, max: 6, weight: 20 },
      { id: "minecraft:apple", min: 1, max: 4, weight: 15 },
      { id: "minecraft:bone", min: 1, max: 3, weight: 15 },
      { id: "minecraft:bread", min: 1, max: 3, weight: 15 },
      { id: "minecraft:water_bucket", min: 1, max: 1, weight: 10 },
      { id: "minecraft:sugar_cane", min: 1, max: 2, weight: 5 }
    ],
    mobs: ["minecraft:sheep", "minecraft:pig", "minecraft:chicken", "minecraft:cow"]
  },
  {
    name: "Birch & Flower Forest",
    blocks: [
      { id: "minecraft:birch_log", weight: 30 },
      { id: "minecraft:birch_leaves", weight: 20 },
      { id: "minecraft:grass_block", weight: 25 },
      { id: "minecraft:dirt", weight: 15 },
      { id: "minecraft:moss_block", weight: 10 }
    ],
    chests: [
      { id: "minecraft:birch_sapling", min: 1, max: 3, weight: 25 },
      { id: "minecraft:dandelion", min: 1, max: 4, weight: 20 },
      { id: "minecraft:poppy", min: 1, max: 4, weight: 20 },
      { id: "minecraft:honeycomb", min: 1, max: 2, weight: 15 },
      { id: "minecraft:sweet_berries", min: 2, max: 5, weight: 20 }
    ],
    mobs: ["minecraft:bee", "minecraft:cow", "minecraft:rabbit"]
  },
  {
    name: "Cherry Grove",
    blocks: [
      { id: "minecraft:cherry_log", weight: 35 },
      { id: "minecraft:cherry_leaves", weight: 25 },
      { id: "minecraft:pink_petals", weight: 15 },
      { id: "minecraft:grass_block", weight: 15 },
      { id: "minecraft:dirt", weight: 10 }
    ],
    chests: [
      { id: "minecraft:cherry_sapling", min: 1, max: 3, weight: 35 },
      { id: "minecraft:pink_petals", min: 2, max: 6, weight: 25 },
      { id: "minecraft:honey_bottle", min: 1, max: 2, weight: 20 },
      { id: "minecraft:cherry_sign", min: 1, max: 2, weight: 20 }
    ],
    mobs: ["minecraft:sheep", "minecraft:pig", "minecraft:bee"]
  },
  {
    name: "Taiga & Spruce",
    blocks: [
      { id: "minecraft:spruce_log", weight: 35 },
      { id: "minecraft:spruce_leaves", weight: 25 },
      { id: "minecraft:podzol", weight: 20 },
      { id: "minecraft:dirt", weight: 10 },
      { id: "minecraft:mossy_cobblestone", weight: 10 }
    ],
    chests: [
      { id: "minecraft:spruce_sapling", min: 1, max: 3, weight: 30 },
      { id: "minecraft:sweet_berries", min: 2, max: 6, weight: 25 },
      { id: "minecraft:spruce_sign", min: 1, max: 2, weight: 15 },
      { id: "minecraft:campfire", min: 1, max: 1, weight: 10 }
    ],
    mobs: ["minecraft:wolf", "minecraft:fox", "minecraft:sheep"]
  },
  {
    name: "Underground Caves",
    blocks: [
      { id: "minecraft:stone", weight: 40 },
      { id: "minecraft:cobblestone", weight: 25 },
      { id: "minecraft:coal_ore", weight: 15 },
      { id: "minecraft:copper_ore", weight: 10 },
      { id: "minecraft:iron_ore", weight: 10 }
    ],
    chests: [
      { id: "minecraft:torch", min: 4, max: 12, weight: 30 },
      { id: "minecraft:coal", min: 3, max: 8, weight: 25 },
      { id: "minecraft:raw_iron", min: 2, max: 5, weight: 20 },
      { id: "minecraft:raw_copper", min: 3, max: 7, weight: 15 },
      { id: "minecraft:iron_ingot", min: 1, max: 3, weight: 10 }
    ],
    mobs: ["minecraft:bat", "minecraft:cow", "minecraft:sheep"]
  },
  {
    name: "Desert & Dunes",
    blocks: [
      { id: "minecraft:sand", weight: 45 },
      { id: "minecraft:sandstone", weight: 30 },
      { id: "minecraft:smooth_sandstone", weight: 15 },
      { id: "minecraft:deadbush", weight: 10 }
    ],
    chests: [
      { id: "minecraft:cactus", min: 1, max: 3, weight: 30 },
      { id: "minecraft:deadbush", min: 1, max: 2, weight: 20 },
      { id: "minecraft:glass", min: 2, max: 6, weight: 25 },
      { id: "minecraft:rabbit_hide", min: 1, max: 3, weight: 15 },
      { id: "minecraft:gold_nugget", min: 3, max: 8, weight: 10 }
    ],
    mobs: ["minecraft:husk", "minecraft:rabbit", "minecraft:camel"]
  },
  {
    name: "Savanna & Acacia",
    blocks: [
      { id: "minecraft:acacia_log", weight: 35 },
      { id: "minecraft:acacia_leaves", weight: 25 },
      { id: "minecraft:grass_block", weight: 20 },
      { id: "minecraft:coarse_dirt", weight: 20 }
    ],
    chests: [
      { id: "minecraft:acacia_sapling", min: 1, max: 3, weight: 35 },
      { id: "minecraft:saddle", min: 1, max: 1, weight: 10 },
      { id: "minecraft:wheat", min: 2, max: 6, weight: 25 },
      { id: "minecraft:leather", min: 1, max: 3, weight: 20 }
    ],
    mobs: ["minecraft:horse", "minecraft:donkey", "minecraft:llama", "minecraft:cow"]
  },
  {
    name: "Jungle & Bamboo",
    blocks: [
      { id: "minecraft:jungle_log", weight: 35 },
      { id: "minecraft:jungle_leaves", weight: 25 },
      { id: "minecraft:bamboo", weight: 15 },
      { id: "minecraft:melon_block", weight: 15 },
      { id: "minecraft:moss_block", weight: 10 }
    ],
    chests: [
      { id: "minecraft:jungle_sapling", min: 1, max: 3, weight: 25 },
      { id: "minecraft:cocoa_beans", min: 2, max: 6, weight: 25 },
      { id: "minecraft:melon_seeds", min: 1, max: 4, weight: 20 },
      { id: "minecraft:bamboo", min: 2, max: 5, weight: 20 },
      { id: "minecraft:cookie", min: 2, max: 6, weight: 10 }
    ],
    mobs: ["minecraft:parrot", "minecraft:ocelot", "minecraft:panda"]
  },
  {
    name: "Swamp & Mangrove",
    blocks: [
      { id: "minecraft:mangrove_log", weight: 30 },
      { id: "minecraft:mangrove_leaves", weight: 20 },
      { id: "minecraft:mud", weight: 25 },
      { id: "minecraft:clay", weight: 15 },
      { id: "minecraft:waterlily", weight: 10 }
    ],
    chests: [
      { id: "minecraft:mangrove_propagule", min: 1, max: 3, weight: 25 },
      { id: "minecraft:slime_ball", min: 1, max: 4, weight: 25 },
      { id: "minecraft:brown_mushroom", min: 1, max: 3, weight: 20 },
      { id: "minecraft:red_mushroom", min: 1, max: 3, weight: 20 }
    ],
    mobs: ["minecraft:frog", "minecraft:slime", "minecraft:witch"]
  },
  {
    name: "Pale Garden & Eerie Woods",
    blocks: [
      { id: "minecraft:pale_oak_log", weight: 35 },
      { id: "minecraft:pale_oak_leaves", weight: 25 },
      { id: "minecraft:pale_moss_block", weight: 20 },
      { id: "minecraft:pale_hanging_moss", weight: 10 },
      { id: "minecraft:creaking_heart", weight: 10 }
    ],
    chests: [
      { id: "minecraft:pale_oak_sapling", min: 1, max: 3, weight: 35 },
      { id: "minecraft:pale_moss_block", min: 2, max: 6, weight: 30 },
      { id: "minecraft:resin_clump", min: 2, max: 5, weight: 20 },
      { id: "minecraft:creaking_heart", min: 1, max: 1, weight: 15 }
    ],
    mobs: ["minecraft:creaking", "minecraft:skeleton"]
  },
  {
    name: "Trial Chambers & Tuff",
    blocks: [
      { id: "minecraft:tuff", weight: 35 },
      { id: "minecraft:polished_tuff", weight: 20 },
      { id: "minecraft:chiseled_tuff", weight: 15 },
      { id: "minecraft:copper_block", weight: 15 },
      { id: "minecraft:chiseled_copper", weight: 15 }
    ],
    chests: [
      { id: "minecraft:trial_key", min: 1, max: 2, weight: 30 },
      { id: "minecraft:heavy_core", min: 1, max: 1, weight: 10 },
      { id: "minecraft:wind_charge", min: 4, max: 12, weight: 35 },
      { id: "minecraft:raw_iron", min: 4, max: 8, weight: 25 }
    ],
    mobs: ["minecraft:breeze", "minecraft:bogged", "minecraft:silverfish"]
  },
  {
    name: "Deepslate & Caverns",
    blocks: [
      { id: "minecraft:deepslate", weight: 40 },
      { id: "minecraft:cobbled_deepslate", weight: 25 },
      { id: "minecraft:deepslate_iron_ore", weight: 10 },
      { id: "minecraft:deepslate_gold_ore", weight: 10 },
      { id: "minecraft:deepslate_redstone_ore", weight: 10 },
      { id: "minecraft:deepslate_diamond_ore", weight: 5 }
    ],
    chests: [
      { id: "minecraft:redstone", min: 4, max: 12, weight: 30 },
      { id: "minecraft:raw_gold", min: 2, max: 6, weight: 25 },
      { id: "minecraft:diamond", min: 1, max: 2, weight: 20 },
      { id: "minecraft:lapis_lazuli", min: 4, max: 10, weight: 20 },
      { id: "minecraft:lava_bucket", min: 1, max: 1, weight: 5 }
    ],
    mobs: ["minecraft:cave_spider", "minecraft:creeper", "minecraft:zombie"]
  },
  {
    name: "Snowy Tundra & Ice Peaks",
    blocks: [
      { id: "minecraft:snow", weight: 35 },
      { id: "minecraft:powder_snow", weight: 15 },
      { id: "minecraft:ice", weight: 25 },
      { id: "minecraft:packed_ice", weight: 15 },
      { id: "minecraft:blue_ice", weight: 10 }
    ],
    chests: [
      { id: "minecraft:snowball", min: 4, max: 16, weight: 35 },
      { id: "minecraft:leather_boots", min: 1, max: 1, weight: 20 },
      { id: "minecraft:string", min: 2, max: 6, weight: 25 },
      { id: "minecraft:ice", min: 2, max: 6, weight: 20 }
    ],
    mobs: ["minecraft:stray", "minecraft:polar_bear", "minecraft:snow_golem"]
  },
  {
    name: "Ocean & Lush Caves",
    blocks: [
      { id: "minecraft:prismarine", weight: 25 },
      { id: "minecraft:prismarine_bricks", weight: 20 },
      { id: "minecraft:moss_block", weight: 25 },
      { id: "minecraft:clay", weight: 15 },
      { id: "minecraft:sponge", weight: 15 }
    ],
    chests: [
      { id: "minecraft:prismarine_shard", min: 2, max: 6, weight: 25 },
      { id: "minecraft:glow_berries", min: 2, max: 6, weight: 25 },
      { id: "minecraft:heart_of_the_sea", min: 1, max: 1, weight: 15 },
      { id: "minecraft:nautilus_shell", min: 1, max: 2, weight: 20 },
      { id: "minecraft:axolotl_bucket", min: 1, max: 1, weight: 15 }
    ],
    mobs: ["minecraft:drowned", "minecraft:axolotl", "minecraft:glow_squid"]
  },
  {
    name: "End Portal Preparation",
    blocks: [
      { id: "minecraft:obsidian", weight: 40 },
      { id: "minecraft:crying_obsidian", weight: 25 },
      { id: "minecraft:iron_block", weight: 15 },
      { id: "minecraft:gold_block", weight: 12 },
      { id: "minecraft:diamond_block", weight: 8 }
    ],
    chests: [
      { id: "minecraft:ender_eye", min: 2, max: 6, weight: 35 },
      { id: "minecraft:end_portal_frame", min: 2, max: 4, weight: 30 },
      { id: "minecraft:diamond", min: 2, max: 5, weight: 20 },
      { id: "minecraft:golden_apple", min: 1, max: 2, weight: 15 }
    ],
    mobs: ["minecraft:enderman", "minecraft:creeper", "minecraft:skeleton"]
  }
];

// 7 Nether Phases (250 blocks each, natural blocks only)
export const NETHER_PHASES = [
  {
    name: "Nether Wastes",
    blocks: [
      { id: "minecraft:netherrack", weight: 55 },
      { id: "minecraft:quartz_ore", weight: 20 },
      { id: "minecraft:nether_gold_ore", weight: 15 },
      { id: "minecraft:magma", weight: 10 }
    ],
    chests: [
      { id: "minecraft:quartz", min: 4, max: 12, weight: 35 },
      { id: "minecraft:gold_nugget", min: 6, max: 18, weight: 35 },
      { id: "minecraft:fire_charge", min: 1, max: 3, weight: 20 },
      { id: "minecraft:cooked_porkchop", min: 2, max: 4, weight: 10 }
    ],
    mobs: ["minecraft:zombie_pigman", "minecraft:magma_cube"]
  },
  {
    name: "Crimson Forest",
    blocks: [
      { id: "minecraft:crimson_stem", weight: 35 },
      { id: "minecraft:crimson_nylium", weight: 30 },
      { id: "minecraft:nether_wart_block", weight: 20 },
      { id: "minecraft:shroomlight", weight: 15 }
    ],
    chests: [
      { id: "minecraft:crimson_fungus", min: 1, max: 4, weight: 30 },
      { id: "minecraft:nether_wart", min: 2, max: 6, weight: 30 },
      { id: "minecraft:shroomlight", min: 1, max: 3, weight: 20 },
      { id: "minecraft:porkchop", min: 2, max: 5, weight: 20 }
    ],
    mobs: ["minecraft:piglin", "minecraft:hoglin"]
  },
  {
    name: "Warped Forest",
    blocks: [
      { id: "minecraft:warped_stem", weight: 35 },
      { id: "minecraft:warped_nylium", weight: 30 },
      { id: "minecraft:warped_wart_block", weight: 20 },
      { id: "minecraft:shroomlight", weight: 15 }
    ],
    chests: [
      { id: "minecraft:warped_fungus", min: 1, max: 4, weight: 35 },
      { id: "minecraft:ender_pearl", min: 1, max: 3, weight: 35 },
      { id: "minecraft:warped_roots", min: 1, max: 4, weight: 20 },
      { id: "minecraft:shroomlight", min: 1, max: 2, weight: 10 }
    ],
    mobs: ["minecraft:enderman", "minecraft:strider"]
  },
  {
    name: "Soul Sand Valley",
    blocks: [
      { id: "minecraft:soul_sand", weight: 40 },
      { id: "minecraft:soul_soil", weight: 35 },
      { id: "minecraft:bone_block", weight: 15 },
      { id: "minecraft:blue_ice", weight: 10 }
    ],
    chests: [
      { id: "minecraft:bone", min: 4, max: 10, weight: 35 },
      { id: "minecraft:soul_torch", min: 2, max: 6, weight: 25 },
      { id: "minecraft:ghast_tear", min: 1, max: 2, weight: 25 },
      { id: "minecraft:gunpowder", min: 2, max: 5, weight: 15 }
    ],
    mobs: ["minecraft:skeleton", "minecraft:ghast"]
  },
  {
    name: "Basalt Deltas",
    blocks: [
      { id: "minecraft:basalt", weight: 45 },
      { id: "minecraft:smooth_basalt", weight: 25 },
      { id: "minecraft:blackstone", weight: 20 },
      { id: "minecraft:magma", weight: 10 }
    ],
    chests: [
      { id: "minecraft:magma_cream", min: 2, max: 6, weight: 35 },
      { id: "minecraft:lava_bucket", min: 1, max: 1, weight: 20 },
      { id: "minecraft:gold_ingot", min: 1, max: 3, weight: 25 },
      { id: "minecraft:fire_charge", min: 2, max: 4, weight: 20 }
    ],
    mobs: ["minecraft:magma_cube", "minecraft:strider"]
  },
  {
    name: "Nether Fortress",
    blocks: [
      { id: "minecraft:nether_brick", weight: 50 },
      { id: "minecraft:red_nether_brick", weight: 25 },
      { id: "minecraft:chiseled_nether_bricks", weight: 15 },
      { id: "minecraft:glowstone", weight: 10 }
    ],
    chests: [
      { id: "minecraft:blaze_rod", min: 1, max: 4, weight: 35 },
      { id: "minecraft:nether_wart", min: 2, max: 5, weight: 25 },
      { id: "minecraft:saddle", min: 1, max: 1, weight: 15 },
      { id: "minecraft:gold_ingot", min: 2, max: 6, weight: 25 }
    ],
    mobs: ["minecraft:blaze", "minecraft:wither_skeleton"]
  },
  {
    name: "Bastion Remnant & Netherite",
    blocks: [
      { id: "minecraft:blackstone", weight: 35 },
      { id: "minecraft:polished_blackstone_bricks", weight: 25 },
      { id: "minecraft:gilded_blackstone", weight: 20 },
      { id: "minecraft:ancient_debris", weight: 10 },
      { id: "minecraft:gold_block", weight: 10 }
    ],
    chests: [
      { id: "minecraft:netherite_scrap", min: 1, max: 2, weight: 20 },
      { id: "minecraft:netherite_upgrade_smithing_template", min: 1, max: 1, weight: 15 },
      { id: "minecraft:ancient_debris", min: 1, max: 2, weight: 25 },
      { id: "minecraft:gold_ingot", min: 3, max: 8, weight: 25 },
      { id: "minecraft:arrow", min: 4, max: 12, weight: 15 }
    ],
    mobs: ["minecraft:piglin_brute", "minecraft:piglin"]
  }
];

// 4 End Phases (250 blocks each, natural blocks only)
export const END_PHASES = [
  {
    name: "End Highlands",
    blocks: [
      { id: "minecraft:end_stone", weight: 65 },
      { id: "minecraft:end_bricks", weight: 25 },
      { id: "minecraft:obsidian", weight: 10 }
    ],
    chests: [
      { id: "minecraft:ender_pearl", min: 2, max: 8, weight: 40 },
      { id: "minecraft:arrow", min: 4, max: 16, weight: 30 },
      { id: "minecraft:experience_bottle", min: 2, max: 6, weight: 30 }
    ],
    mobs: ["minecraft:enderman"]
  },
  {
    name: "Chorus Plant Islands",
    blocks: [
      { id: "minecraft:end_stone", weight: 50 },
      { id: "minecraft:chorus_plant", weight: 30 },
      { id: "minecraft:chorus_flower", weight: 20 }
    ],
    chests: [
      { id: "minecraft:chorus_fruit", min: 4, max: 12, weight: 40 },
      { id: "minecraft:chorus_flower", min: 1, max: 3, weight: 30 },
      { id: "minecraft:end_rod", min: 1, max: 4, weight: 30 }
    ],
    mobs: ["minecraft:enderman", "minecraft:endermite"]
  },
  {
    name: "End City Ruins",
    blocks: [
      { id: "minecraft:purpur_block", weight: 40 },
      { id: "minecraft:purpur_pillar", weight: 25 },
      { id: "minecraft:end_bricks", weight: 20 },
      { id: "minecraft:end_rod", weight: 15 }
    ],
    chests: [
      { id: "minecraft:shulker_shell", min: 1, max: 2, weight: 35 },
      { id: "minecraft:diamond", min: 2, max: 6, weight: 25 },
      { id: "minecraft:iron_ingot", min: 3, max: 8, weight: 25 },
      { id: "minecraft:ender_chest", min: 1, max: 1, weight: 15 }
    ],
    mobs: ["minecraft:shulker", "minecraft:enderman"]
  },
  {
    name: "End Void Master",
    blocks: [
      { id: "minecraft:purpur_block", weight: 30 },
      { id: "minecraft:end_stone", weight: 30 },
      { id: "minecraft:obsidian", weight: 20 },
      { id: "minecraft:crying_obsidian", weight: 20 }
    ],
    chests: [
      { id: "minecraft:elytra", min: 1, max: 1, weight: 20 },
      { id: "minecraft:end_crystal", min: 1, max: 2, weight: 35 },
      { id: "minecraft:shulker_shell", min: 2, max: 4, weight: 25 },
      { id: "minecraft:nether_star", min: 1, max: 1, weight: 20 }
    ],
    mobs: ["minecraft:shulker", "minecraft:enderman"]
  }
];
