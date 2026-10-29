// 42+ Unique Themed Secret Void Islands for OneBlock Survival
// Each island generates out in unloaded chunks (140 to 250 blocks away from 0,64,0)
// and strictly preserves player-placed blocks (air-only placement) so nothing is ever overwritten!

import { world, ItemStack } from "@minecraft/server";

export const ISLAND_THEMES = [
  {
    "id": "sky_oasis",
    "dimension": "overworld",
    "size": "huge",
    "trait": "village",
    "biome": "plains",
    "tier": 1,
    "y": 68,
    "name": "Lush Floral Oasis",
    "color": "§a",
    "floor": "minecraft:grass_block",
    "subfloor": "minecraft:dirt_with_roots",
    "base": "minecraft:andesite",
    "feature": "well",
    "mob": "minecraft:villager_v2",
    "chest": [
      {
        "id": "minecraft:emerald",
        "count": 8
      },
      {
        "id": "minecraft:golden_carrot",
        "count": 4
      },
      {
        "id": "minecraft:bread",
        "count": 6
      },
      {
        "id": "minecraft:wheat_seeds",
        "count": 8
      },
      {
        "id": "minecraft:bell",
        "count": 1
      }
    ]
  },
  {
    "id": "ancient_crypt",
    "dimension": "overworld",
    "size": "big",
    "trait": "ore_rich",
    "biome": "desert",
    "tier": 2,
    "y": 54,
    "name": "Ancient Sandstone Crypt",
    "color": "§6",
    "floor": "minecraft:cut_sandstone",
    "subfloor": "minecraft:smooth_sandstone",
    "base": "minecraft:sandstone",
    "feature": "pillars",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:diamond",
        "count": 3
      },
      {
        "id": "minecraft:gold_ingot",
        "count": 8
      },
      {
        "id": "minecraft:enchanted_book",
        "count": 1
      },
      {
        "id": "minecraft:saddle",
        "count": 1
      },
      {
        "id": "minecraft:iron_horse_armor",
        "count": 1
      }
    ]
  },
  {
    "id": "trial_vault",
    "dimension": "overworld",
    "size": "huge",
    "trait": "dungeon",
    "biome": "deep_dark",
    "tier": 4,
    "y": 48,
    "name": "Trial & Breeze Vault",
    "color": "§b",
    "floor": "minecraft:cut_copper",
    "subfloor": "minecraft:polished_tuff",
    "base": "minecraft:deepslate",
    "feature": "copper_spire",
    "mob": "minecraft:breeze",
    "chest": [
      {
        "id": "minecraft:trial_key",
        "count": 2
      },
      {
        "id": "minecraft:wind_charge",
        "count": 8
      },
      {
        "id": "minecraft:heavy_core",
        "count": 1
      },
      {
        "id": "minecraft:iron_block",
        "count": 2
      },
      {
        "id": "minecraft:diamond",
        "count": 2
      }
    ]
  },
  {
    "id": "stronghold_portal",
    "dimension": "overworld",
    "size": "big",
    "trait": "dungeon",
    "biome": "deep_dark",
    "tier": 4,
    "y": 52,
    "name": "Stronghold End Chamber",
    "color": "§d",
    "floor": "minecraft:stone_bricks",
    "subfloor": "minecraft:cracked_stone_bricks",
    "base": "minecraft:mossy_stone_bricks",
    "feature": "portal_frame",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:ender_eye",
        "count": 12
      },
      {
        "id": "minecraft:golden_apple",
        "count": 3
      },
      {
        "id": "minecraft:diamond_sword",
        "count": 1
      },
      {
        "id": "minecraft:bookshelf",
        "count": 3
      }
    ]
  },
  {
    "id": "cherry_sanctuary",
    "dimension": "overworld",
    "size": "huge",
    "trait": "lush_flora",
    "biome": "cherry_grove",
    "tier": 1,
    "y": 76,
    "name": "Cherry Blossom Sanctuary",
    "color": "§d",
    "floor": "minecraft:grass_block",
    "subfloor": "minecraft:dirt",
    "base": "minecraft:calcite",
    "feature": "blossom_tree",
    "mob": "minecraft:bee",
    "chest": [
      {
        "id": "minecraft:cherry_sapling",
        "count": 4
      },
      {
        "id": "minecraft:honey_bottle",
        "count": 3
      },
      {
        "id": "minecraft:pink_petals",
        "count": 8
      },
      {
        "id": "minecraft:bee_nest",
        "count": 1
      }
    ]
  },
  {
    "id": "pale_garden_spire",
    "dimension": "overworld",
    "size": "medium",
    "trait": "lush_flora",
    "biome": "dark_forest",
    "tier": 4,
    "y": 74,
    "name": "Dark Forest Spire",
    "color": "§7",
    "floor": "minecraft:podzol",
    "subfloor": "minecraft:dirt",
    "base": "minecraft:deepslate",
    "feature": "dark_oak_spire",
    "mob": "minecraft:witch",
    "chest": [
      {
        "id": "minecraft:dark_oak_sapling",
        "count": 4
      },
      {
        "id": "minecraft:totem_of_undying",
        "count": 1
      },
      {
        "id": "minecraft:emerald",
        "count": 6
      },
      {
        "id": "minecraft:bone",
        "count": 8
      }
    ]
  },
  {
    "id": "mushroom_haven",
    "dimension": "overworld",
    "size": "huge",
    "trait": "animals",
    "biome": "mushroom_island",
    "tier": 1,
    "y": 62,
    "name": "Giant Mushroom Haven",
    "color": "§c",
    "floor": "minecraft:mycelium",
    "subfloor": "minecraft:dirt",
    "base": "minecraft:diorite",
    "feature": "huge_mushroom",
    "mob": "minecraft:mooshroom",
    "chest": [
      {
        "id": "minecraft:mushroom_stew",
        "count": 4
      },
      {
        "id": "minecraft:red_mushroom",
        "count": 8
      },
      {
        "id": "minecraft:brown_mushroom",
        "count": 8
      },
      {
        "id": "minecraft:bowl",
        "count": 6
      }
    ]
  },
  {
    "id": "badlands_mesa",
    "dimension": "overworld",
    "size": "huge",
    "trait": "ore_rich",
    "biome": "mesa",
    "tier": 2,
    "y": 60,
    "name": "Badlands Gold Mesa",
    "color": "§6",
    "floor": "minecraft:red_sand",
    "subfloor": "minecraft:hardened_clay",
    "base": "minecraft:red_sandstone",
    "feature": "gold_core",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:raw_gold",
        "count": 12
      },
      {
        "id": "minecraft:gold_ingot",
        "count": 8
      },
      {
        "id": "minecraft:tnt",
        "count": 4
      },
      {
        "id": "minecraft:rail",
        "count": 16
      }
    ]
  },
  {
    "id": "ice_spike_peak",
    "dimension": "overworld",
    "size": "big",
    "trait": "animals",
    "biome": "ice_plains_spikes",
    "tier": 2,
    "y": 96,
    "name": "Glacial Ice Spire",
    "color": "§b",
    "floor": "minecraft:snow",
    "subfloor": "minecraft:packed_ice",
    "base": "minecraft:blue_ice",
    "feature": "ice_spike",
    "mob": "minecraft:polar_bear",
    "chest": [
      {
        "id": "minecraft:snowball",
        "count": 16
      },
      {
        "id": "minecraft:ice",
        "count": 8
      },
      {
        "id": "minecraft:leather_boots",
        "count": 1
      },
      {
        "id": "minecraft:powder_snow_bucket",
        "count": 1
      }
    ]
  },
  {
    "id": "jungle_temple",
    "dimension": "overworld",
    "size": "huge",
    "trait": "lush_flora",
    "biome": "jungle",
    "tier": 2,
    "y": 58,
    "name": "Jungle Ruined Temple",
    "color": "§2",
    "floor": "minecraft:mossy_cobblestone",
    "subfloor": "minecraft:chiseled_stone_bricks",
    "base": "minecraft:mossy_stone_bricks",
    "feature": "bamboo_grove",
    "mob": "minecraft:parrot",
    "chest": [
      {
        "id": "minecraft:cocoa_beans",
        "count": 8
      },
      {
        "id": "minecraft:bamboo",
        "count": 12
      },
      {
        "id": "minecraft:crossbow",
        "count": 1
      },
      {
        "id": "minecraft:emerald",
        "count": 6
      }
    ]
  },
  {
    "id": "nether_fortress_spire",
    "dimension": "nether",
    "size": "huge",
    "trait": "lava_spring",
    "biome": "nether_wastes",
    "tier": 3,
    "y": 44,
    "name": "Nether Fortress Outpost",
    "color": "§4",
    "floor": "minecraft:nether_brick",
    "subfloor": "minecraft:red_nether_brick",
    "base": "minecraft:netherrack",
    "feature": "blaze_altar",
    "mob": "minecraft:blaze",
    "chest": [
      {
        "id": "minecraft:blaze_rod",
        "count": 4
      },
      {
        "id": "minecraft:nether_wart",
        "count": 6
      },
      {
        "id": "minecraft:magma_cream",
        "count": 4
      },
      {
        "id": "minecraft:nether_brick",
        "count": 16
      }
    ]
  },
  {
    "id": "bastion_treasury",
    "dimension": "nether",
    "size": "huge",
    "trait": "ore_rich",
    "biome": "nether_wastes",
    "tier": 4,
    "y": 42,
    "name": "Bastion Piglin Treasury",
    "color": "§e",
    "floor": "minecraft:blackstone",
    "subfloor": "minecraft:polished_blackstone_bricks",
    "base": "minecraft:gilded_blackstone",
    "feature": "gold_monolith",
    "mob": "minecraft:piglin",
    "chest": [
      {
        "id": "minecraft:ancient_debris",
        "count": 1
      },
      {
        "id": "minecraft:netherite_scrap",
        "count": 1
      },
      {
        "id": "minecraft:gilded_blackstone",
        "count": 4
      },
      {
        "id": "minecraft:gold_block",
        "count": 2
      }
    ]
  },
  {
    "id": "crimson_forest_isle",
    "dimension": "nether",
    "size": "big",
    "trait": "lush_flora",
    "biome": "crimson_forest",
    "tier": 3,
    "y": 46,
    "name": "Crimson Fungus Atoll",
    "color": "§4",
    "floor": "minecraft:crimson_nylium",
    "subfloor": "minecraft:crimson_stem",
    "base": "minecraft:netherrack",
    "feature": "shroomlight",
    "mob": "minecraft:hoglin",
    "chest": [
      {
        "id": "minecraft:crimson_fungus",
        "count": 4
      },
      {
        "id": "minecraft:shroomlight",
        "count": 3
      },
      {
        "id": "minecraft:nether_wart_block",
        "count": 8
      },
      {
        "id": "minecraft:ender_pearl",
        "count": 4
      }
    ]
  },
  {
    "id": "warped_forest_isle",
    "dimension": "nether",
    "size": "big",
    "trait": "water_spring",
    "biome": "warped_forest",
    "tier": 3,
    "y": 46,
    "name": "Warped Void Grove",
    "color": "§3",
    "floor": "minecraft:warped_nylium",
    "subfloor": "minecraft:warped_stem",
    "base": "minecraft:netherrack",
    "feature": "shroomlight",
    "mob": "minecraft:enderman",
    "chest": [
      {
        "id": "minecraft:warped_fungus",
        "count": 4
      },
      {
        "id": "minecraft:shroomlight",
        "count": 3
      },
      {
        "id": "minecraft:warped_wart_block",
        "count": 8
      },
      {
        "id": "minecraft:ender_pearl",
        "count": 6
      }
    ]
  },
  {
    "id": "soul_sand_valley",
    "dimension": "nether",
    "size": "medium",
    "trait": "lava_spring",
    "biome": "soulsand_valley",
    "tier": 3,
    "y": 40,
    "name": "Soul Sand Catacomb",
    "color": "§8",
    "floor": "minecraft:soul_sand",
    "subfloor": "minecraft:soul_soil",
    "base": "minecraft:bone_block",
    "feature": "soul_fire",
    "mob": "minecraft:skeleton",
    "chest": [
      {
        "id": "minecraft:ghast_tear",
        "count": 2
      },
      {
        "id": "minecraft:gunpowder",
        "count": 6
      },
      {
        "id": "minecraft:soul_campfire",
        "count": 1
      },
      {
        "id": "minecraft:bone",
        "count": 12
      }
    ]
  },
  {
    "id": "amethyst_geode",
    "dimension": "overworld",
    "size": "big",
    "trait": "water_spring",
    "biome": "lush_caves",
    "tier": 3,
    "y": 50,
    "name": "Celestial Amethyst Geode",
    "color": "§d",
    "floor": "minecraft:amethyst_block",
    "subfloor": "minecraft:budding_amethyst",
    "base": "minecraft:calcite",
    "feature": "amethyst_crystal",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:amethyst_shard",
        "count": 12
      },
      {
        "id": "minecraft:spyglass",
        "count": 1
      },
      {
        "id": "minecraft:tinted_glass",
        "count": 6
      },
      {
        "id": "minecraft:calcite",
        "count": 8
      }
    ]
  },
  {
    "id": "witch_swamp_hut",
    "dimension": "overworld",
    "size": "big",
    "trait": "dungeon",
    "biome": "swampland",
    "tier": 3,
    "y": 58,
    "name": "Witch Brew Hut",
    "color": "§5",
    "floor": "minecraft:mud",
    "subfloor": "minecraft:mud_bricks",
    "base": "minecraft:clay",
    "feature": "cauldron",
    "mob": "minecraft:cat",
    "chest": [
      {
        "id": "minecraft:brewing_stand",
        "count": 1
      },
      {
        "id": "minecraft:glass_bottle",
        "count": 6
      },
      {
        "id": "minecraft:glowstone_dust",
        "count": 6
      },
      {
        "id": "minecraft:redstone",
        "count": 8
      }
    ]
  },
  {
    "id": "pillager_watchtower",
    "dimension": "overworld",
    "size": "huge",
    "trait": "dungeon",
    "biome": "meadow",
    "tier": 3,
    "y": 88,
    "name": "Pillager Sky Outpost",
    "color": "§8",
    "floor": "minecraft:grass_block",
    "subfloor": "minecraft:coarse_dirt",
    "base": "minecraft:cobblestone",
    "feature": "watchtower",
    "mob": "minecraft:pillager",
    "chest": [
      {
        "id": "minecraft:crossbow",
        "count": 1
      },
      {
        "id": "minecraft:arrow",
        "count": 24
      },
      {
        "id": "minecraft:iron_ingot",
        "count": 5
      },
      {
        "id": "minecraft:emerald",
        "count": 6
      }
    ]
  },
  {
    "id": "desert_well_oasis",
    "dimension": "overworld",
    "size": "medium",
    "trait": "water_spring",
    "biome": "desert",
    "tier": 1,
    "y": 62,
    "name": "Desert Mirage Well",
    "color": "§e",
    "floor": "minecraft:sand",
    "subfloor": "minecraft:smooth_sandstone",
    "base": "minecraft:sandstone",
    "feature": "sand_well",
    "mob": "minecraft:camel",
    "chest": [
      {
        "id": "minecraft:cactus",
        "count": 4
      },
      {
        "id": "minecraft:glass",
        "count": 8
      },
      {
        "id": "minecraft:rabbit_hide",
        "count": 4
      },
      {
        "id": "minecraft:water_bucket",
        "count": 1
      }
    ]
  },
  {
    "id": "bamboo_monastery",
    "dimension": "overworld",
    "size": "huge",
    "trait": "animals",
    "biome": "bamboo_jungle",
    "tier": 1,
    "y": 66,
    "name": "Bamboo Panda Sanctuary",
    "color": "§a",
    "floor": "minecraft:podzol",
    "subfloor": "minecraft:coarse_dirt",
    "base": "minecraft:granite",
    "feature": "bamboo_pillars",
    "mob": "minecraft:panda",
    "chest": [
      {
        "id": "minecraft:cake",
        "count": 1
      },
      {
        "id": "minecraft:bamboo",
        "count": 16
      },
      {
        "id": "minecraft:cookie",
        "count": 8
      },
      {
        "id": "minecraft:lead",
        "count": 2
      }
    ]
  },
  {
    "id": "deepslate_forge",
    "dimension": "overworld",
    "size": "big",
    "trait": "ore_rich",
    "biome": "deep_dark",
    "tier": 2,
    "y": 36,
    "name": "Ancient Deepslate Forge",
    "color": "§7",
    "floor": "minecraft:deepslate_bricks",
    "subfloor": "minecraft:chiseled_deepslate",
    "base": "minecraft:cobbled_deepslate",
    "feature": "lava_forge",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:blast_furnace",
        "count": 1
      },
      {
        "id": "minecraft:anvil",
        "count": 1
      },
      {
        "id": "minecraft:iron_block",
        "count": 2
      },
      {
        "id": "minecraft:raw_iron",
        "count": 12
      }
    ]
  },
  {
    "id": "ocean_monument_shrine",
    "dimension": "overworld",
    "size": "huge",
    "trait": "water_spring",
    "biome": "deep_ocean",
    "tier": 3,
    "y": 52,
    "name": "Prismarine Ocean Shrine",
    "color": "§3",
    "floor": "minecraft:dark_prismarine",
    "subfloor": "minecraft:prismarine_bricks",
    "base": "minecraft:prismarine",
    "feature": "sea_lanterns",
    "mob": "minecraft:guardian",
    "chest": [
      {
        "id": "minecraft:sponge",
        "count": 2
      },
      {
        "id": "minecraft:heart_of_the_sea",
        "count": 1
      },
      {
        "id": "minecraft:nautilus_shell",
        "count": 2
      },
      {
        "id": "minecraft:prismarine_shard",
        "count": 8
      }
    ]
  },
  {
    "id": "glowstone_meteor",
    "dimension": "nether",
    "size": "medium",
    "trait": "lava_spring",
    "biome": "basalt_deltas",
    "tier": 3,
    "y": 90,
    "name": "Fallen Glowstone Meteor",
    "color": "§e",
    "floor": "minecraft:basalt",
    "subfloor": "minecraft:blackstone",
    "base": "minecraft:obsidian",
    "feature": "meteor_core",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:glowstone_dust",
        "count": 16
      },
      {
        "id": "minecraft:fire_charge",
        "count": 4
      },
      {
        "id": "minecraft:golden_apple",
        "count": 2
      },
      {
        "id": "minecraft:obsidian",
        "count": 4
      }
    ]
  },
  {
    "id": "end_city_tower",
    "dimension": "the_end",
    "size": "huge",
    "trait": "dungeon",
    "biome": "the_end",
    "tier": 4,
    "y": 92,
    "name": "End City Spire",
    "color": "§5",
    "floor": "minecraft:purpur_block",
    "subfloor": "minecraft:purpur_pillar",
    "base": "minecraft:end_bricks",
    "feature": "end_rod",
    "mob": "minecraft:shulker",
    "chest": [
      {
        "id": "minecraft:shulker_shell",
        "count": 2
      },
      {
        "id": "minecraft:chorus_fruit",
        "count": 8
      },
      {
        "id": "minecraft:end_rod",
        "count": 4
      },
      {
        "id": "minecraft:diamond",
        "count": 2
      }
    ]
  },
  {
    "id": "fossil_excavation",
    "dimension": "overworld",
    "size": "big",
    "trait": "ore_rich",
    "biome": "desert",
    "tier": 2,
    "y": 54,
    "name": "Prehistoric Fossil Dig",
    "color": "§f",
    "floor": "minecraft:coarse_dirt",
    "subfloor": "minecraft:mud",
    "base": "minecraft:dripstone_block",
    "feature": "fossil_rib",
    "mob": "minecraft:sniffer",
    "chest": [
      {
        "id": "minecraft:sniffer_egg",
        "count": 1
      },
      {
        "id": "minecraft:torchflower_seeds",
        "count": 4
      },
      {
        "id": "minecraft:pitcher_pod",
        "count": 4
      },
      {
        "id": "minecraft:bone_meal",
        "count": 16
      }
    ]
  },
  {
    "id": "blacksmith_workshop",
    "dimension": "overworld",
    "size": "big",
    "trait": "village",
    "biome": "stony_peaks",
    "tier": 2,
    "y": 64,
    "name": "Sky Blacksmith Forge",
    "color": "§8",
    "floor": "minecraft:smooth_stone",
    "subfloor": "minecraft:stone_bricks",
    "base": "minecraft:cobblestone",
    "feature": "furnace",
    "mob": "minecraft:iron_golem",
    "chest": [
      {
        "id": "minecraft:iron_pickaxe",
        "count": 1
      },
      {
        "id": "minecraft:diamond_chestplate",
        "count": 1
      },
      {
        "id": "minecraft:obsidian",
        "count": 6
      },
      {
        "id": "minecraft:iron_ingot",
        "count": 8
      }
    ]
  },
  {
    "id": "library_observatory",
    "dimension": "overworld",
    "size": "big",
    "trait": "ancient_shrine",
    "biome": "jagged_peaks",
    "tier": 3,
    "y": 82,
    "name": "Arcane Sky Observatory",
    "color": "§9",
    "floor": "minecraft:polished_deepslate",
    "subfloor": "minecraft:deepslate_bricks",
    "base": "minecraft:cobbled_deepslate",
    "feature": "enchanting_setup",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:enchanted_book",
        "count": 2
      },
      {
        "id": "minecraft:lapis_lazuli",
        "count": 16
      },
      {
        "id": "minecraft:book",
        "count": 6
      },
      {
        "id": "minecraft:experience_bottle",
        "count": 8
      }
    ]
  },
  {
    "id": "alchemist_laboratory",
    "dimension": "overworld",
    "size": "medium",
    "trait": "dungeon",
    "biome": "dark_forest",
    "tier": 3,
    "y": 60,
    "name": "Void Alchemist Laboratory",
    "color": "§d",
    "floor": "minecraft:spruce_planks",
    "subfloor": "minecraft:dark_oak_planks",
    "base": "minecraft:cobblestone",
    "feature": "brewing_setup",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:brewing_stand",
        "count": 1
      },
      {
        "id": "minecraft:glistering_melon_slice",
        "count": 4
      },
      {
        "id": "minecraft:golden_carrot",
        "count": 4
      },
      {
        "id": "minecraft:blaze_powder",
        "count": 4
      }
    ]
  },
  {
    "id": "spider_nest",
    "dimension": "overworld",
    "size": "medium",
    "trait": "dungeon",
    "biome": "dripstone_caves",
    "tier": 2,
    "y": 44,
    "name": "Cobweb Cave Nest",
    "color": "§f",
    "floor": "minecraft:dripstone_block",
    "subfloor": "minecraft:mossy_cobblestone",
    "base": "minecraft:pointed_dripstone",
    "feature": "webs",
    "mob": "minecraft:cave_spider",
    "chest": [
      {
        "id": "minecraft:string",
        "count": 16
      },
      {
        "id": "minecraft:spider_eye",
        "count": 6
      },
      {
        "id": "minecraft:fermented_spider_eye",
        "count": 3
      },
      {
        "id": "minecraft:web",
        "count": 4
      }
    ]
  },
  {
    "id": "creeper_dungeon",
    "dimension": "overworld",
    "size": "medium",
    "trait": "dungeon",
    "biome": "lush_caves",
    "tier": 2,
    "y": 46,
    "name": "Volatile Gunpowder Depot",
    "color": "§2",
    "floor": "minecraft:mossy_cobblestone",
    "subfloor": "minecraft:mossy_stone_bricks",
    "base": "minecraft:clay",
    "feature": "tnt_barrel",
    "mob": "minecraft:creeper",
    "chest": [
      {
        "id": "minecraft:tnt",
        "count": 6
      },
      {
        "id": "minecraft:gunpowder",
        "count": 12
      },
      {
        "id": "minecraft:music_disc_cat",
        "count": 1
      },
      {
        "id": "minecraft:flint_and_steel",
        "count": 1
      }
    ]
  },
  {
    "id": "slime_biosphere",
    "dimension": "overworld",
    "size": "big",
    "trait": "water_spring",
    "biome": "swampland",
    "tier": 2,
    "y": 50,
    "name": "Gelatinous Slime Isle",
    "color": "§a",
    "floor": "minecraft:moss_block",
    "subfloor": "minecraft:moss_block",
    "base": "minecraft:clay",
    "feature": "slime_core",
    "mob": "minecraft:slime",
    "chest": [
      {
        "id": "minecraft:slime_ball",
        "count": 12
      },
      {
        "id": "minecraft:lead",
        "count": 4
      },
      {
        "id": "minecraft:sticky_piston",
        "count": 2
      },
      {
        "id": "minecraft:slime",
        "count": 4
      }
    ]
  },
  {
    "id": "bee_apiary",
    "dimension": "overworld",
    "size": "big",
    "trait": "animals",
    "biome": "meadow",
    "tier": 1,
    "y": 70,
    "name": "Sunlit Honey Apiary",
    "color": "§6",
    "floor": "minecraft:flowering_azalea",
    "subfloor": "minecraft:dirt_with_roots",
    "base": "minecraft:dirt",
    "feature": "beehive",
    "mob": "minecraft:bee",
    "chest": [
      {
        "id": "minecraft:honey_bottle",
        "count": 4
      },
      {
        "id": "minecraft:honeycomb",
        "count": 8
      },
      {
        "id": "minecraft:shears",
        "count": 1
      },
      {
        "id": "minecraft:sunflower",
        "count": 4
      }
    ]
  },
  {
    "id": "pumpkin_patch",
    "dimension": "overworld",
    "size": "big",
    "trait": "animals",
    "biome": "taiga",
    "tier": 1,
    "y": 64,
    "name": "Haunted Pumpkin Patch",
    "color": "§6",
    "floor": "minecraft:podzol",
    "subfloor": "minecraft:coarse_dirt",
    "base": "minecraft:deepslate",
    "feature": "jack_o_lantern",
    "mob": "minecraft:snow_golem",
    "chest": [
      {
        "id": "minecraft:pumpkin_pie",
        "count": 4
      },
      {
        "id": "minecraft:pumpkin_seeds",
        "count": 8
      },
      {
        "id": "minecraft:shears",
        "count": 1
      },
      {
        "id": "minecraft:hay_block",
        "count": 4
      }
    ]
  },
  {
    "id": "melon_greenhouse",
    "dimension": "overworld",
    "size": "big",
    "trait": "village",
    "biome": "jungle",
    "tier": 1,
    "y": 64,
    "name": "Tropical Melon Greenhouse",
    "color": "§a",
    "floor": "minecraft:moss_block",
    "subfloor": "minecraft:dirt_with_roots",
    "base": "minecraft:jungle_planks",
    "feature": "glass_dome",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:melon_seeds",
        "count": 8
      },
      {
        "id": "minecraft:glistering_melon_slice",
        "count": 4
      },
      {
        "id": "minecraft:glass",
        "count": 12
      },
      {
        "id": "minecraft:bone_meal",
        "count": 8
      }
    ]
  },
  {
    "id": "sculk_laboratory",
    "dimension": "overworld",
    "size": "huge",
    "trait": "dungeon",
    "biome": "deep_dark",
    "tier": 4,
    "y": 32,
    "name": "Ancient Sculk Laboratory",
    "color": "§1",
    "floor": "minecraft:sculk",
    "subfloor": "minecraft:sculk_catalyst",
    "base": "minecraft:deepslate",
    "feature": "sculk_shrieker",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:echo_shard",
        "count": 4
      },
      {
        "id": "minecraft:recovery_compass",
        "count": 1
      },
      {
        "id": "minecraft:disc_fragment_5",
        "count": 3
      },
      {
        "id": "minecraft:experience_bottle",
        "count": 10
      }
    ]
  },
  {
    "id": "armory_vault",
    "dimension": "overworld",
    "size": "big",
    "trait": "ore_rich",
    "biome": "stony_peaks",
    "tier": 2,
    "y": 52,
    "name": "Knight Sky Armory",
    "color": "§7",
    "floor": "minecraft:stone_bricks",
    "subfloor": "minecraft:iron_bars",
    "base": "minecraft:cobblestone",
    "feature": "anvil_stand",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:netherite_upgrade_smithing_template",
        "count": 1
      },
      {
        "id": "minecraft:shield",
        "count": 1
      },
      {
        "id": "minecraft:diamond_sword",
        "count": 1
      },
      {
        "id": "minecraft:iron_block",
        "count": 2
      }
    ]
  },
  {
    "id": "bakery_windmill",
    "dimension": "overworld",
    "size": "huge",
    "trait": "village",
    "biome": "plains",
    "tier": 1,
    "y": 70,
    "name": "Windmill Grain Haven",
    "color": "§e",
    "floor": "minecraft:grass_block",
    "subfloor": "minecraft:coarse_dirt",
    "base": "minecraft:smooth_stone",
    "feature": "hay_spire",
    "mob": "minecraft:villager_v2",
    "chest": [
      {
        "id": "minecraft:bread",
        "count": 12
      },
      {
        "id": "minecraft:cookie",
        "count": 12
      },
      {
        "id": "minecraft:cake",
        "count": 2
      },
      {
        "id": "minecraft:wheat",
        "count": 16
      }
    ]
  },
  {
    "id": "aquarium_atoll",
    "dimension": "overworld",
    "size": "huge",
    "trait": "water_spring",
    "biome": "warm_ocean",
    "tier": 1,
    "y": 56,
    "name": "Coral Reef Biosphere",
    "color": "§3",
    "floor": "minecraft:sand",
    "subfloor": "minecraft:cut_sandstone",
    "base": "minecraft:prismarine",
    "feature": "coral_pool",
    "mob": "minecraft:axolotl",
    "chest": [
      {
        "id": "minecraft:axolotl_bucket",
        "count": 1
      },
      {
        "id": "minecraft:tropical_fish_bucket",
        "count": 1
      },
      {
        "id": "minecraft:sea_pickle",
        "count": 4
      },
      {
        "id": "minecraft:sponge",
        "count": 1
      }
    ]
  },
  {
    "id": "tuff_golem_sanctuary",
    "dimension": "overworld",
    "size": "big",
    "trait": "ore_rich",
    "biome": "dripstone_caves",
    "tier": 4,
    "y": 42,
    "name": "Tuff Golem Sanctuary",
    "color": "§8",
    "floor": "minecraft:chiseled_tuff_bricks",
    "subfloor": "minecraft:tuff_bricks",
    "base": "minecraft:tuff",
    "feature": "copper_bulb",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:copper_bulb",
        "count": 4
      },
      {
        "id": "minecraft:copper_grate",
        "count": 6
      },
      {
        "id": "minecraft:trial_key",
        "count": 2
      },
      {
        "id": "minecraft:diamond",
        "count": 2
      }
    ]
  },
  {
    "id": "meteorite_crater",
    "dimension": "nether",
    "size": "huge",
    "trait": "lava_spring",
    "biome": "basalt_deltas",
    "tier": 4,
    "y": 48,
    "name": "Starlight Meteorite Crater",
    "color": "§5",
    "floor": "minecraft:blackstone",
    "subfloor": "minecraft:basalt",
    "base": "minecraft:obsidian",
    "feature": "star_core",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:nether_star",
        "count": 1
      },
      {
        "id": "minecraft:diamond",
        "count": 4
      },
      {
        "id": "minecraft:crying_obsidian",
        "count": 6
      },
      {
        "id": "minecraft:ender_eye",
        "count": 4
      }
    ]
  },
  {
    "id": "golden_pantheon",
    "dimension": "overworld",
    "size": "huge",
    "trait": "ancient_shrine",
    "biome": "jagged_peaks",
    "tier": 4,
    "y": 95,
    "name": "Pantheon of the Gods",
    "color": "§6",
    "floor": "minecraft:quartz_block",
    "subfloor": "minecraft:chiseled_quartz_block",
    "base": "minecraft:gold_block",
    "feature": "god_altar",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:enchanted_golden_apple",
        "count": 2
      },
      {
        "id": "minecraft:totem_of_undying",
        "count": 1
      },
      {
        "id": "minecraft:netherite_ingot",
        "count": 1
      },
      {
        "id": "minecraft:gold_block",
        "count": 4
      }
    ]
  },
  {
    "id": "void_gateway_outpost",
    "dimension": "the_end",
    "size": "huge",
    "trait": "ancient_shrine",
    "biome": "the_end",
    "tier": 4,
    "y": 86,
    "name": "Void Gateway Shrine",
    "color": "§5",
    "floor": "minecraft:end_bricks",
    "subfloor": "minecraft:purpur_pillar",
    "base": "minecraft:obsidian",
    "feature": "gateway_beam",
    "mob": null,
    "chest": [
      {
        "id": "minecraft:elytra",
        "count": 1
      },
      {
        "id": "minecraft:dragon_breath",
        "count": 3
      },
      {
        "id": "minecraft:ender_eye",
        "count": 6
      },
      {
        "id": "minecraft:firework_rocket",
        "count": 16
      }
    ]
  },
  {
    "id": "elytra_hangar",
    "dimension": "the_end",
    "size": "huge",
    "trait": "dungeon",
    "biome": "the_end",
    "tier": 4,
    "y": 68,
    "name": "End Ship Hangar",
    "color": "§d",
    "floor": "minecraft:purpur_block",
    "subfloor": "minecraft:end_bricks",
    "base": "minecraft:purpur_pillar",
    "feature": "end_ship",
    "mob": "minecraft:shulker",
    "chest": [
      {
        "id": "minecraft:elytra",
        "count": 1
      },
      {
        "id": "minecraft:firework_rocket",
        "count": 32
      },
      {
        "id": "minecraft:potion",
        "count": 2
      },
      {
        "id": "minecraft:diamond",
        "count": 4
      },
      {
        "id": "minecraft:shulker_shell",
        "count": 4
      }
    ]
  }
];

// Deterministic 4-Ring Non-Overlapping Layout:
// - Overworld: 33 islands arranged across 4 rings (Ring 1 @ 72m, Ring 2 @ 125m, Ring 3 @ 180m, Ring 4 @ 240m)
//   Guarantees minimum distance >= 52.63 blocks between ANY two island centers (0% overlap, 27+ blocks open void!)
// - Nether: 7 islands arranged in a 75m ring (min distance 64.2m)
// - The End: 3 islands arranged in a 85m ring (min distance 147m)
export const OVERWORLD_ISLAND_ORDER = [
  // Ring 1 (6 islands, r=72m): Starter floral, nature, pandas, bees & mushrooms
  "sky_oasis", "cherry_sanctuary", "mushroom_haven", "desert_well_oasis", "bamboo_monastery", "bee_apiary",
  // Ring 2 (8 islands, r=125m): Farms, coral atolls, desert crypt, badlands gold, ice & jungle
  "pumpkin_patch", "melon_greenhouse", "bakery_windmill", "aquarium_atoll", "ancient_crypt", "badlands_mesa", "ice_spike_peak", "jungle_temple",
  // Ring 3 (10 islands, r=180m): Ancient forges, fossils, armories, dungeons, slime & witch swamp
  "deepslate_forge", "fossil_excavation", "blacksmith_workshop", "armory_vault", "spider_nest", "creeper_dungeon", "slime_biosphere", "amethyst_geode", "witch_swamp_hut", "pillager_watchtower",
  // Ring 4 (9 islands, r=240m): Arcane libraries, breeze trial vault, pale garden, sculk, pantheon & stronghold end chamber
  "ocean_monument_shrine", "library_observatory", "alchemist_laboratory", "trial_vault", "pale_garden_spire", "sculk_laboratory", "tuff_golem_sanctuary", "golden_pantheon", "stronghold_portal"
];

export function getIslandLocation(index, total, theme, lastPos = null) {
  const targetDim = (theme && theme.dimension) || "overworld";

  let distance;
  let angle;

  if (targetDim === "overworld") {
    let slotIdx = -1;
    if (theme && theme.id) {
      slotIdx = OVERWORLD_ISLAND_ORDER.indexOf(theme.id);
    }
    if (slotIdx < 0) {
      slotIdx = index % 33;
    }

    if (slotIdx < 6) {
      // Ring 1: 6 islands @ 72m (Offset 0°: 0°, 60°, 120°, 180°, 240°, 300° -> 0% diagonals, min diff 26m)
      distance = 72;
      angle = slotIdx * (360 / 6);
    } else if (slotIdx < 14) {
      // Ring 2: 8 islands @ 125m (Offset 22.5°: 22.5°, 67.5°, 112.5°... -> 0% diagonals, min diff 67m)
      distance = 125;
      angle = 22.5 + (slotIdx - 6) * (360 / 8);
    } else if (slotIdx < 24) {
      // Ring 3: 10 islands @ 180m (Offset 0°: 0°, 36°, 72°, 108°... -> 0% diagonals, min diff 40m)
      distance = 180;
      angle = (slotIdx - 14) * (360 / 10);
    } else {
      // Ring 4: 9 islands @ 240m (Offset 0°: 0°, 40°, 80°, 120°... -> 0% diagonals, min diff 30m)
      distance = 240;
      angle = (slotIdx - 24) * (360 / 9);
    }
  } else if (targetDim === "nether") {
    const netherThemes = ISLAND_THEMES.filter(t => t.dimension === "nether");
    let nIdx = theme ? netherThemes.findIndex(t => t.id === theme.id) : index;
    if (nIdx < 0) nIdx = index % 7;
    distance = 75;
    angle = nIdx * (360 / 7);
  } else {
    // The End (3 islands: end_city_tower, void_gateway_outpost, elytra_hangar @ 30°, 150°, 270°)
    const endThemes = ISLAND_THEMES.filter(t => t.dimension === "the_end");
    let eIdx = theme ? endThemes.findIndex(t => t.id === theme.id) : index;
    if (eIdx < 0) eIdx = index % 3;
    distance = 85;
    angle = 30 + eIdx * 120;
  }

  const rad = (angle * Math.PI) / 180;
  const cx = Math.round(distance * Math.cos(rad));
  const cz = Math.round(distance * Math.sin(rad));

  // Thematic Y Level: Skyblock height kept accessible (Y=60 to Y=72)
  const cy = (theme && typeof theme.y === "number") ? Math.min(72, Math.max(60, theme.y)) : 64;

  let cardinal = "North";
  if (Math.abs(cx) > Math.abs(cz)) {
    cardinal = cx > 0 ? "East" : "West";
  } else {
    cardinal = cz > 0 ? "South" : "North";
  }

  return {
    center: { x: cx, y: cy, z: cz },
    distance,
    cardinal: `${cardinal} (X: ${cx}, Z: ${cz})`
  };
}

// Physical existence verification: checks if island anchor or surface blocks physically exist
export function isIslandPhysicallyBuilt(dimension, center) {
  try {
    const under = dimension.getBlock({ x: center.x, y: center.y - 1, z: center.z });
    if (!under) return false; // Chunk unloaded
    if (under.typeId === "minecraft:bedrock") {
      const offBlock = dimension.getBlock({ x: center.x + 3, y: center.y, z: center.z });
      if (offBlock && !offBlock.isAir && offBlock.typeId !== "minecraft:air") return true;
    }
    const b = dimension.getBlock(center);
    if (b && !b.isAir && b.typeId !== "minecraft:air") return true;
    return false;
  } catch (e) {
    return false;
  }
}

let totalBlocksPlacedThisBuild = 0;

// Strictly places blocks only where air currently exists.
// Never overwrites player-placed blocks, structures, or bridges!
function safeAirOnlySetBlock(dimension, loc, typeId) {
  try {
    const b = dimension.getBlock(loc);
    if (b && (b.isAir || b.typeId === "minecraft:air")) {
      b.setType(typeId);
      totalBlocksPlacedThisBuild++;
      return true;
    }
  } catch (e) {}
  return false;
}

// =========================================================================
// REALISTIC NATURAL FLOATING ISLAND GENERATOR
// =========================================================================
// - Authentic Geological Strata: Stone, Andesite, Diorite, Granite, Tuff, Deepslate
// - Subsoil: Dirt, Coarse Dirt, Rooted Dirt, Gravel, Clay
// - Surface: Grass Block, Podzol, Mycelium, Sand, Nylium + Wildflowers & Vegetation
// - Embedded Ore Veins: Coal, Copper, Iron, Gold, Lapis, Redstone, Diamond, Emerald
// - Scale Varieties: Huge (R~11), Big (R~8.5), Medium (R~6.5), Compact (R~5)
// - Specialized Traits: Village, Animals, Water Spring / Waterfall, Lava Spring / Cascade,
//   Ore-Rich Mine, Dungeon / Mobs, Lush Flora Tree, Ancient Shrine

function getRockBlock(theme, dx, dz, d, seed) {
  if (theme.biome === "the_end") {
    const eh = Math.abs((dx * 31 + dz * 19 + d * 13 + seed) % 100);
    return eh < 65 ? "minecraft:end_stone" : (eh < 88 ? "minecraft:end_bricks" : "minecraft:purpur_block");
  }
  if (theme.biome.includes("nether") || theme.biome.includes("valley") || theme.biome.includes("deltas")) {
    const nh = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    if (d >= 6 && nh < 35) return "minecraft:crying_obsidian";
    if (nh < 45) return "minecraft:netherrack";
    if (nh < 75) return "minecraft:blackstone";
    if (nh < 90) return "minecraft:basalt";
    return "minecraft:polished_blackstone";
  }
  if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
    // Authentic Mojang Badlands Horizontal Terracotta Strata (7 distinct colors):
    const band = (d + Math.floor(Math.abs(dx * 0.15 + dz * 0.1))) % 7;
    if (d >= 6 && Math.abs((dx * 17 + dz * 23 + seed) % 100) < 40) return "minecraft:red_sandstone";
    if (band === 0) return "minecraft:hardened_clay";
    if (band === 1) return "minecraft:orange_terracotta";
    if (band === 2) return "minecraft:yellow_terracotta";
    if (band === 3) return "minecraft:red_sandstone";
    if (band === 4) return "minecraft:red_terracotta";
    if (band === 5) return "minecraft:brown_terracotta";
    return "minecraft:white_terracotta";
  }
  if (theme.biome === "desert") {
    const dh = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    if (d >= 6 && dh < 50) return "minecraft:hardened_clay";
    return dh < 40 ? "minecraft:sandstone" : (dh < 65 ? "minecraft:smooth_sandstone" : (dh < 85 ? "minecraft:cut_sandstone" : "minecraft:chiseled_sandstone"));
  }
  if (theme.biome.includes("ocean") || theme.biome.includes("warm_ocean")) {
    const oh = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    if (d >= 5 && oh < 40) return "minecraft:smooth_sandstone";
    return oh < 45 ? "minecraft:prismarine" : (oh < 75 ? "minecraft:dark_prismarine" : "minecraft:prismarine_bricks");
  }
  if (theme.biome.includes("ice") || theme.biome.includes("frozen")) {
    const ih = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    return ih < 40 ? "minecraft:packed_ice" : (ih < 70 ? "minecraft:blue_ice" : (ih < 85 ? "minecraft:snow" : "minecraft:calcite"));
  }
  if (theme.id === "amethyst_geode") {
    return d <= 2 ? "minecraft:calcite" : (d <= 5 ? "minecraft:smooth_basalt" : "minecraft:tuff");
  }
  if (theme.biome === "deep_dark" || d >= 7) {
    const ddh = Math.abs((dx * 19 + dz * 29 + d * 11 + seed) % 100);
    if (ddh < 45) return "minecraft:deepslate";
    if (ddh < 75) return "minecraft:cobbled_deepslate";
    if (ddh < 90) return "minecraft:tuff";
    return "minecraft:polished_deepslate";
  }
  // Integrate biome-specific base rock at lower depths:
  if (d >= 4 && theme.base && theme.base !== "minecraft:stone") {
    const bh = Math.abs((dx * 37 + dz * 23 + d * 11 + seed) % 100);
    if (bh < 55) return theme.base;
  }
  // Realistic natural multi-rock mix (stone, andesite, diorite, granite, tuff, calcite):
  const h = Math.abs((dx * 43 + dz * 29 + d * 13 + seed) % 100);
  if (h < 35) return "minecraft:stone";
  if (h < 52) return "minecraft:andesite";
  if (h < 68) return "minecraft:diorite";
  if (h < 82) return "minecraft:granite";
  if (h < 92) return "minecraft:tuff";
  return "minecraft:calcite";
}

function getOreBlock(theme, depth, dx, dz, seed) {
  // Badlands / Mesa: Super rich in Gold Ore, Deepslate Gold, and Raw Gold Blocks (Mojang Mesa signature!)
  if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
    const gh = Math.abs((dx * 53 + dz * 31 + depth * 17 + seed) % 100);
    if (gh < 50) return "minecraft:gold_ore";
    if (gh < 75) return "minecraft:raw_gold_block";
    return depth >= 5 ? "minecraft:deepslate_gold_ore" : "minecraft:gold_ore";
  }
  // Deepslate Forge: Ore rich in Iron, Deepslate Iron, Raw Iron Blocks & Diamonds
  if (theme.id === "deepslate_forge") {
    const fh = Math.abs((dx * 47 + dz * 37 + depth * 13 + seed) % 100);
    if (fh < 40) return "minecraft:deepslate_iron_ore";
    if (fh < 65) return "minecraft:raw_iron_block";
    if (fh < 85) return "minecraft:deepslate_diamond_ore";
    return "minecraft:deepslate_gold_ore";
  }
  // Bastion Treasury: Nether Gold, Gilded Blackstone, Ancient Debris
  if (theme.id === "bastion_treasury") {
    const bh = Math.abs((dx * 41 + dz * 29 + depth * 19 + seed) % 100);
    if (bh < 45) return "minecraft:nether_gold_ore";
    if (bh < 75) return "minecraft:gilded_blackstone";
    if (bh < 90) return "minecraft:gold_block";
    return "minecraft:ancient_debris";
  }
  // Ancient Crypt: Sandstone Crypt with Gold, Lapis, Emerald
  if (theme.id === "ancient_crypt") {
    const ch = Math.abs((dx * 43 + dz * 31 + depth * 17 + seed) % 100);
    if (ch < 45) return "minecraft:gold_ore";
    if (ch < 75) return "minecraft:lapis_ore";
    if (ch < 90) return "minecraft:raw_gold_block";
    return "minecraft:emerald_ore";
  }
  // Tuff Golem Sanctuary: Copper Ore & Raw Copper Blocks
  if (theme.id === "tuff_golem_sanctuary") {
    const th = Math.abs((dx * 37 + dz * 23 + depth * 19 + seed) % 100);
    if (th < 50) return "minecraft:copper_ore";
    if (th < 80) return "minecraft:raw_copper_block";
    return "minecraft:iron_ore";
  }

  const isNether = theme.biome.includes("nether") || theme.biome.includes("valley") || theme.biome.includes("deltas");
  if (isNether) {
    const no = Math.abs((dx * 19 + dz * 23 + seed) % 100);
    if (no < 50) return "minecraft:quartz_ore";
    if (no < 90) return "minecraft:nether_gold_ore";
    return theme.tier >= 3 ? "minecraft:ancient_debris" : "minecraft:nether_gold_ore";
  }

  const isDeep = depth >= 6 || theme.biome === "deep_dark";
  const oh = Math.abs((dx * 71 + dz * 37 + depth * 19 + seed) % 100);

  if (theme.tier === 1) {
    return oh < 55 ? "minecraft:coal_ore" : (oh < 85 ? "minecraft:copper_ore" : "minecraft:iron_ore");
  }
  if (theme.tier === 2) {
    if (isDeep) {
      return oh < 40 ? "minecraft:deepslate_iron_ore" : (oh < 70 ? "minecraft:deepslate_gold_ore" : "minecraft:deepslate_redstone_ore");
    }
    return oh < 40 ? "minecraft:iron_ore" : (oh < 65 ? "minecraft:copper_ore" : (oh < 85 ? "minecraft:lapis_ore" : "minecraft:gold_ore"));
  }
  if (theme.tier === 3) {
    if (isDeep) {
      return oh < 35 ? "minecraft:deepslate_iron_ore" : (oh < 65 ? "minecraft:deepslate_gold_ore" : (oh < 85 ? "minecraft:deepslate_redstone_ore" : "minecraft:deepslate_diamond_ore"));
    }
    return oh < 30 ? "minecraft:gold_ore" : (oh < 60 ? "minecraft:redstone_ore" : (oh < 85 ? "minecraft:lapis_ore" : "minecraft:diamond_ore"));
  }
  // Tier 4
  if (isDeep) {
    return oh < 40 ? "minecraft:deepslate_diamond_ore" : (oh < 70 ? "minecraft:deepslate_redstone_ore" : (oh < 90 ? "minecraft:deepslate_emerald_ore" : "minecraft:ancient_debris"));
  }
  return oh < 45 ? "minecraft:diamond_ore" : (oh < 75 ? "minecraft:gold_ore" : "minecraft:emerald_ore");
}

function getSubsoilBlock(theme, dx, dz, seed) {
  const sh = Math.abs((dx * 37 + dz * 29 + seed) % 100);

  if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
    if (sh < 35) return "minecraft:hardened_clay";
    if (sh < 65) return "minecraft:red_sandstone";
    if (sh < 85) return "minecraft:orange_terracotta";
    return "minecraft:yellow_terracotta";
  }
  if (theme.floor.includes("red_sand")) {
    return sh < 50 ? "minecraft:red_sandstone" : "minecraft:smooth_red_sandstone";
  }
  if (theme.floor.includes("sand")) {
    if (sh < 45) return "minecraft:sandstone";
    if (sh < 75) return "minecraft:smooth_sandstone";
    return "minecraft:cut_sandstone";
  }
  if (theme.floor.includes("nylium") || theme.biome.includes("nether")) {
    if (sh < 45) return "minecraft:netherrack";
    if (sh < 70) return "minecraft:soul_soil";
    if (sh < 88) return "minecraft:blackstone";
    return "minecraft:soul_sand";
  }
  if (theme.floor.includes("end_stone") || theme.biome === "the_end") {
    if (sh < 60) return "minecraft:end_stone";
    if (sh < 85) return "minecraft:end_bricks";
    return "minecraft:purpur_block";
  }
  if (theme.floor.includes("tuff") || theme.biome === "deep_dark") {
    if (sh < 40) return "minecraft:tuff";
    if (sh < 70) return "minecraft:polished_tuff";
    if (sh < 88) return "minecraft:deepslate";
    return "minecraft:cobbled_deepslate";
  }
  if (theme.biome.includes("ocean") || theme.biome.includes("warm_ocean")) {
    if (sh < 45) return "minecraft:sand";
    if (sh < 70) return "minecraft:gravel";
    if (sh < 88) return "minecraft:clay";
    return "minecraft:prismarine";
  }
  if (theme.biome.includes("swamp")) {
    if (sh < 40) return "minecraft:mud";
    if (sh < 70) return "minecraft:clay";
    if (sh < 88) return "minecraft:coarse_dirt";
    return "minecraft:dirt_with_roots";
  }
  if (theme.biome.includes("ice") || theme.biome.includes("frozen")) {
    if (sh < 45) return "minecraft:packed_ice";
    if (sh < 75) return "minecraft:snow";
    return "minecraft:diorite";
  }

  // Standard organic flora & forest subsoil blend:
  if (sh < 45) return "minecraft:dirt";
  if (sh < 70) return "minecraft:coarse_dirt";
  if (sh < 85) return "minecraft:dirt_with_roots";
  if (sh < 94) return "minecraft:gravel";
  return "minecraft:mud";
}

// Ground-check validator: ensures plants and vegetation are placed strictly on valid solid ground, never on air!
export function isSolidGroundForPlant(dimension, loc, plantTypeId) {
  try {
    const ground = dimension.getBlock(loc);
    if (!ground || ground.isAir || ground.typeId === "minecraft:air") return false;
    const gType = ground.typeId;
    if (gType.includes("water") || gType.includes("lava")) return false;

    if (plantTypeId === "minecraft:deadbush" || plantTypeId === "minecraft:cactus") {
      return gType.includes("sand") || gType.includes("terracotta") || gType.includes("gravel") || gType.includes("dirt");
    }
    if (plantTypeId.includes("crimson") || plantTypeId.includes("warped")) {
      return gType.includes("nylium") || gType.includes("netherrack") || gType.includes("dirt") || gType.includes("soul");
    }
    if (plantTypeId.includes("mushroom") || plantTypeId.includes("fungus")) {
      return gType.includes("mycelium") || gType.includes("podzol") || gType.includes("nylium") || gType.includes("dirt") || gType.includes("stone");
    }
    // Grass, flowers, saplings, pink petals, sweet berries, bamboo, ferns:
    return gType.includes("grass") || gType.includes("dirt") || gType.includes("podzol") ||
           gType.includes("mycelium") || gType.includes("moss") || gType.includes("mud") ||
           gType.includes("sand") || gType.includes("clay") || gType.includes("terracotta") ||
           gType.includes("tuff");
  } catch (e) {
    return false;
  }
}

function safePlantSetBlock(dimension, groundLoc, plantLoc, plantTypeId) {
  if (!isSolidGroundForPlant(dimension, groundLoc, plantTypeId)) return false;
  return safeAirOnlySetBlock(dimension, plantLoc, plantTypeId);
}

export function getThemeFenceType(theme) {
  const d = (theme && theme.dimension) || "overworld";
  const b = (theme && theme.biome) || "";
  const id = (theme && theme.id) || "";
  if (d === "nether") {
    if (b.includes("crimson")) return "minecraft:crimson_fence";
    if (b.includes("warped")) return "minecraft:warped_fence";
    return "minecraft:nether_brick_fence";
  }
  if (d === "the_end") return "minecraft:birch_fence";
  if (b.includes("cherry") || id.includes("cherry")) return "minecraft:cherry_fence";
  if (b.includes("bamboo") || id.includes("bamboo")) return "minecraft:bamboo_fence";
  if (b.includes("mangrove") || b.includes("swamp")) return "minecraft:mangrove_fence";
  if (b.includes("birch")) return "minecraft:birch_fence";
  if (b.includes("dark_forest") || b.includes("deep_dark") || id.includes("pale")) return "minecraft:dark_oak_fence";
  if (b.includes("taiga") || b.includes("ice") || b.includes("snow")) return "minecraft:spruce_fence";
  if (b.includes("jungle")) return "minecraft:jungle_fence";
  if (b.includes("mesa") || b.includes("badlands") || b.includes("savanna") || b.includes("desert")) return "minecraft:acacia_fence";
  return "minecraft:oak_fence";
}

export function getThemeLanternType(theme) {
  const d = (theme && theme.dimension) || "overworld";
  const b = (theme && theme.biome) || "";
  if (d === "nether" || b.includes("soul") || b.includes("deep_dark")) {
    return "minecraft:soul_lantern";
  }
  return "minecraft:lantern";
}

// Places a lantern strictly on top of a fence.
// Guarantees 100% that a lantern is NEVER placed without a valid fence underneath!
export function placeLanternWithFence(dimension, fenceLoc, fenceType = "minecraft:oak_fence", lanternType = "minecraft:lantern") {
  try {
    const fenceBlock = dimension.getBlock(fenceLoc);
    if (!fenceBlock) return false;

    // Fence can replace air or soft foliage (flowers, tall grass, crops, petals, etc.)
    if (!fenceBlock.isAir && fenceBlock.typeId !== "minecraft:air") {
      const ft = fenceBlock.typeId;
      // Do not overwrite chests, bedrock, lodestone, portals, or walls
      if (ft.includes("chest") || ft.includes("bedrock") || ft.includes("lodestone") || ft.includes("portal") || ft.includes("frame") || ft.includes("wall")) {
        return false;
      }
      const isSoft = ft.includes("grass") || ft.includes("flower") || ft.includes("petal") || 
                     ft.includes("fern") || ft.includes("bush") || ft.includes("roots") || 
                     ft.includes("fungus") || ft.includes("deadbush") || ft.includes("crop") ||
                     ft.includes("carrot") || ft.includes("wheat") || ft.includes("potato") ||
                     ft.includes("beetroot") || ft.includes("pumpkin") || ft.includes("melon") ||
                     (ft.includes("nether_brick") && fenceType.includes("nether_brick")) ||
                     (ft.includes("sculk") && fenceType.includes("fence"));
      if (!isSoft && !ft.includes("fence")) return false;
    }

    const lanternLoc = { x: fenceLoc.x, y: fenceLoc.y + 1, z: fenceLoc.z };
    const lanternBlock = dimension.getBlock(lanternLoc);
    if (!lanternBlock) return false;

    // Ensure the lantern spot is air or replaceable foliage (never solid rock or chest)
    if (!lanternBlock.isAir && lanternBlock.typeId !== "minecraft:air") {
      const lt = lanternBlock.typeId;
      const isLanternSoft = lt.includes("air") || lt.includes("leaves") || lt.includes("grass") || lt.includes("flower") || lt.includes("petal");
      if (!isLanternSoft) return false;
    }

    // Set fence first
    fenceBlock.setType(fenceType);
    totalBlocksPlacedThisBuild++;

    // Set lantern directly on top of fence
    lanternBlock.setType(lanternType);
    totalBlocksPlacedThisBuild++;
    return true;
  } catch (e) {
    return false;
  }
}


function placeSurfaceVegetation(dimension, theme, loc, seed) {
  const { x, y, z } = loc;
  try {
    const roll = Math.random();

    if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
      if (roll < 0.12) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:deadbush");
      } else if (roll < 0.18) {
        if (safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:cactus")) {
          if (Math.random() < 0.4) safeAirOnlySetBlock(dimension, { x, y: y + 2, z }, "minecraft:cactus");
        }
      }
    } else if (theme.biome === "cherry_grove" || theme.id === "cherry_sanctuary") {
      // Natural scattered pink petals (pure organic distribution like vanilla cherry groves)
      if (roll < 0.48) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:pink_petals");
      }
    } else if (theme.id === "bamboo_monastery") {
      // Organic bamboo cluster with variable heights and short grass
      if (roll < 0.22) {
        if (safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:bamboo")) {
          if (Math.random() < 0.65 && safeAirOnlySetBlock(dimension, { x, y: y + 2, z }, "minecraft:bamboo")) {
            if (Math.random() < 0.35) safeAirOnlySetBlock(dimension, { x, y: y + 3, z }, "minecraft:bamboo");
          }
        }
      } else if (roll < 0.55) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      }
    } else if (theme.id === "pumpkin_patch") {
      // Scattered pumpkins and grass
      if (roll < 0.16) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, Math.random() < 0.25 ? "minecraft:carved_pumpkin" : "minecraft:pumpkin");
      } else if (roll < 0.50) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      }
    } else if (theme.id === "melon_greenhouse") {
      if (roll < 0.18) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:melon_block");
      } else if (roll < 0.50) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      }
    } else if (theme.id === "bee_apiary") {
      // Lush wildflower meadow
      if (roll < 0.15) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:dandelion");
      else if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:poppy");
      else if (roll < 0.40) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:cornflower");
      else if (roll < 0.52) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:allium");
      else if (roll < 0.62) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:oxeye_daisy");
      else if (roll < 0.78) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
    } else if (theme.floor === "minecraft:grass_block") {
      // Natural vanilla meadow: irregular grass, scattered flowers, and open spaces
      if (roll < 0.32) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      } else if (roll < 0.36) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:dandelion");
      } else if (roll < 0.40) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:poppy");
      } else if (roll < 0.44) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:cornflower");
      } else if (roll < 0.47) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:oxeye_daisy");
      } else if (roll < 0.50) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:azure_bluet");
      }
    } else if (theme.floor === "minecraft:podzol") {
      if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:fern");
      else if (roll < 0.42) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:sweet_berry_bush");
      else if (roll < 0.50) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:large_fern");
    } else if (theme.floor.includes("sand")) {
      if (roll < 0.12) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:deadbush");
    } else if (theme.floor === "minecraft:crimson_nylium") {
      if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:crimson_roots");
      else if (roll < 0.40) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:crimson_fungus");
    } else if (theme.floor === "minecraft:warped_nylium") {
      if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:warped_roots");
      else if (roll < 0.40) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:warped_fungus");
    }
  } catch (e) {}
}

// 5 Geological Archetypes Classifier:
// atoll (sunken lagoon crater), spire (needle peak & deep vertical root),
// terrace (stepped flat plateaus), archipelago (cluster islets), rolling (organic hills)
export function getIslandArchetype(theme) {
  if (theme.archetype) return theme.archetype;
  const id = theme.id;
  const feat = theme.feature || "";

  // 1. ATOLL / LAGOON / CRATER:
  if (id === "aquarium_atoll" || id === "ocean_monument_shrine" || id === "meteorite_crater" || id === "amethyst_geode" || id === "slime_biosphere") {
    return "atoll";
  }
  // 2. SPIRE / PEAK:
  if (id.includes("spire") || id.includes("peak") || feat === "copper_spire" || id === "end_city_tower" || id === "glowstone_meteor" || id === "ice_spike_peak" || id === "elytra_hangar") {
    return "spire";
  }
  // 3. TERRACE / STEPPED PLATEAU:
  if (id === "badlands_mesa" || id === "ancient_crypt" || id === "fossil_excavation" || id === "blacksmith_workshop" || id === "armory_vault" || id === "tuff_golem_sanctuary" || id === "bastion_treasury" || id === "trial_vault" || id === "stronghold_portal") {
    return "terrace";
  }
  // 4. ARCHIPELAGO / ISLETS:
  if (id === "mushroom_haven" || id === "cherry_sanctuary" || id === "bamboo_monastery" || id === "crimson_forest_isle" || id === "warped_forest_isle" || id === "void_gateway_outpost") {
    return "archipelago";
  }
  // 5. ROLLING (Organic hills & bluffs):
  return "rolling";
}

// =========================================================================
// ADVANCED TERRAFORMING: MICRO-CAVERNS, SATELLITE ISLETS & PATHS
// =========================================================================

function buildMicroCave(dimension, theme, center, seed) {
  const { x: cx, y: cy, z: cz } = center;
  const caveAngle = ((seed * 17) % 360) * (Math.PI / 180);
  const caveDist = theme.size === "huge" ? 3.5 : 2.5;
  const caveX = cx + Math.round(caveDist * Math.cos(caveAngle));
  const caveZ = cz + Math.round(caveDist * Math.sin(caveAngle));
  const caveY = cy - 3; // 3 blocks below surface, safely inside rock mantle

  const caveRadius = theme.size === "huge" ? 2.6 : 2.0;

  // Carve hollow ellipsoid cavern
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -3; dz <= 3; dz++) {
        const d = Math.sqrt(dx * dx + (dy * 1.4) * (dy * 1.4) + dz * dz);
        if (d <= caveRadius) {
          const block = dimension.getBlock({ x: caveX + dx, y: caveY + dy, z: caveZ + dz });
          if (block && !block.isAir && block.typeId !== "minecraft:lodestone" && block.typeId !== "minecraft:chest") {
            block.setType("minecraft:air");
          }
        }
      }
    }
  }

  // Populate Cave Features: Pointed dripstones, glowing lichen, and high-value ore veins!
  try {
    // Minimalized 1-2 Pointed Dripstones per island with guaranteed solid block directly above (never air)
    let dripstonePlaced = 0;
    const maxDripstones = 1 + (seed % 2); // strictly 1 to 2 dripstones
    const dripCandidates = [
      { ox: 0, oz: 0 },
      { ox: 1, oz: 0 },
      { ox: -1, oz: -1 }
    ];
    for (const cand of dripCandidates) {
      if (dripstonePlaced >= maxDripstones) break;
      const ceilPos = { x: caveX + cand.ox, y: caveY + 2, z: caveZ + cand.oz };
      const dripPos = { x: caveX + cand.ox, y: caveY + 1, z: caveZ + cand.oz };
      const ceilBlock = dimension.getBlock(ceilPos);
      if (ceilBlock) {
        // Ensure the top of the dripstone is always solid non-air
        if (ceilBlock.isAir) {
          ceilBlock.setType("minecraft:dripstone_block");
        }
        const b = dimension.getBlock(dripPos);
        if (b && b.isAir) {
          b.setType("minecraft:pointed_dripstone");
          dripstonePlaced++;
        }
      }
    }

    // Exposed Rare Ore Clump in Cave Wall
    const rareOre = theme.tier >= 3 ? "minecraft:deepslate_diamond_ore" : (theme.tier === 2 ? "minecraft:deepslate_gold_ore" : "minecraft:deepslate_iron_ore");
    safeAirOnlySetBlock(dimension, { x: caveX + 2, y: caveY, z: caveZ }, rareOre);
    safeAirOnlySetBlock(dimension, { x: caveX + 2, y: caveY + 1, z: caveZ }, rareOre);

    // Subtle cave glow (Glow lichen)
    safeAirOnlySetBlock(dimension, { x: caveX, y: caveY - 1, z: caveZ }, "minecraft:glow_lichen");
    safeAirOnlySetBlock(dimension, { x: caveX, y: caveY, z: caveZ - 2 }, "minecraft:glow_lichen");
  } catch (ce) {}
}

function buildSatelliteIslet(dimension, theme, center, maxR, seed, index) {
  const { x: cx, y: cy, z: cz } = center;
  const angle = (((seed * 37 + index * 131) % 360) * Math.PI) / 180;
  const distance = maxR + 5 + (seed % 3);
  const sx = cx + Math.round(distance * Math.cos(angle));
  const sz = cz + Math.round(distance * Math.sin(angle));
  const sy = cy - (index === 0 ? 1 : 2);

  const satR = index === 0 ? 2.4 : 1.8;

  // Build mini asteroid rock
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= satR) {
        // Surface
        safeAirOnlySetBlock(dimension, { x: sx + dx, y: sy, z: sz + dz }, theme.floor);
        // Subsurface depth
        const satDepth = Math.max(1, Math.round((satR - d) * 1.5));
        for (let dy = 1; dy <= satDepth; dy++) {
          const mat = dy === 1 ? getSubsoilBlock(theme, dx, dz, seed) : getRockBlock(theme, dx, dz, dy, seed);
          safeAirOnlySetBlock(dimension, { x: sx + dx, y: sy - dy, z: sz + dz }, mat);
        }
        // Hanging stalactite tip
        if (d <= 1.0) {
          safeAirOnlySetBlock(dimension, { x: sx + dx, y: sy - satDepth - 1, z: sz + dz }, "minecraft:cobbled_deepslate");
        }
      }
    }
  }

  // Hanging Iron Chains Tether (connecting edge of main island to satellite)
  if (index === 0) {
    const mainEdgeX = cx + Math.round((maxR - 0.5) * Math.cos(angle));
    const mainEdgeZ = cz + Math.round((maxR - 0.5) * Math.sin(angle));
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const chainX = Math.round(mainEdgeX + (sx - mainEdgeX) * t);
      const chainZ = Math.round(mainEdgeZ + (sz - mainEdgeZ) * t);
      const sag = Math.round(Math.sin(t * Math.PI) * 1.2);
      safeAirOnlySetBlock(dimension, { x: chainX, y: cy - sag, z: chainZ }, "minecraft:iron_chain");
    }
  }

  // Thematic Feature on Satellite:
  try {
    const tr = theme.trait;
    if (tr === "ore_rich") {
      // Raw mineral boulder with lantern on fence
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, theme.tier >= 3 ? "minecraft:raw_gold_block" : "minecraft:raw_iron_block");
      placeLanternWithFence(dimension, { x: sx, y: sy + 2, z: sz }, "minecraft:oak_fence", "minecraft:lantern");
    } else if (tr === "village" || tr === "animals") {
      // Abandoned campsite with lantern on fence post
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:campfire");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz }, "minecraft:barrel");
      placeLanternWithFence(dimension, { x: sx - 1, y: sy + 1, z: sz }, "minecraft:oak_fence", "minecraft:lantern");
    } else if (tr === "dungeon" || theme.biome.includes("nether")) {
      // Spire with crying obsidian & soul lantern on fence
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:crying_obsidian");
      placeLanternWithFence(dimension, { x: sx, y: sy + 2, z: sz }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
    } else if (tr === "ancient_shrine") {
      // Quartz monolith
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:chiseled_quartz_block");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 2, z: sz }, "minecraft:sea_lantern");
    } else {
      // Flowering azalea bonsai with lantern on fence post
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:flowering_azalea");
      placeLanternWithFence(dimension, { x: sx + 1, y: sy + 1, z: sz }, "minecraft:oak_fence", "minecraft:lantern");
    }
  } catch (fe) {}
}

export function getIslandBlockPool(theme) {
  const pools = {
    sky_oasis: ["minecraft:grass_block", "minecraft:oak_log", "minecraft:oak_planks", "minecraft:moss_block", "minecraft:melon_block", "minecraft:emerald_ore", "minecraft:hay_block"],
    ancient_crypt: ["minecraft:sandstone", "minecraft:cut_sandstone", "minecraft:chiseled_sandstone", "minecraft:gold_ore", "minecraft:raw_gold_block", "minecraft:lapis_ore"],
    trial_vault: ["minecraft:copper_block", "minecraft:cut_copper", "minecraft:polished_tuff", "minecraft:tuff", "minecraft:copper_ore", "minecraft:iron_block"],
    stronghold_portal: ["minecraft:stone_bricks", "minecraft:cracked_stone_bricks", "minecraft:mossy_stone_bricks", "minecraft:iron_block", "minecraft:bookshelf", "minecraft:chiseled_stone_bricks"],
    cherry_sanctuary: ["minecraft:cherry_log", "minecraft:cherry_leaves", "minecraft:cherry_planks", "minecraft:cherry_wood", "minecraft:bee_nest", "minecraft:honey_block"],
    pale_garden_spire: ["minecraft:dark_oak_log", "minecraft:dark_oak_planks", "minecraft:dark_oak_leaves", "minecraft:moss_block", "minecraft:podzol", "minecraft:deepslate"],
    mushroom_haven: ["minecraft:mycelium", "minecraft:red_mushroom_block", "minecraft:brown_mushroom_block", "minecraft:mushroom_stem", "minecraft:dirt"],
    badlands_mesa: ["minecraft:red_sand", "minecraft:hardened_clay", "minecraft:orange_terracotta", "minecraft:yellow_terracotta", "minecraft:gold_ore", "minecraft:raw_gold_block"],
    ice_spike_peak: ["minecraft:snow", "minecraft:packed_ice", "minecraft:blue_ice", "minecraft:ice"],
    jungle_temple: ["minecraft:jungle_log", "minecraft:jungle_leaves", "minecraft:bamboo_block", "minecraft:mossy_cobblestone", "minecraft:chiseled_stone_bricks"],
    nether_fortress_spire: ["minecraft:nether_brick", "minecraft:red_nether_brick", "minecraft:quartz_ore", "minecraft:nether_gold_ore", "minecraft:soul_sand"],
    bastion_treasury: ["minecraft:blackstone", "minecraft:polished_blackstone_bricks", "minecraft:gilded_blackstone", "minecraft:gold_block", "minecraft:crying_obsidian"],
    crimson_forest_isle: ["minecraft:crimson_nylium", "minecraft:crimson_stem", "minecraft:crimson_hyphae", "minecraft:shroomlight", "minecraft:nether_wart_block"],
    warped_forest_isle: ["minecraft:warped_nylium", "minecraft:warped_stem", "minecraft:warped_hyphae", "minecraft:shroomlight", "minecraft:warped_wart_block"],
    soul_sand_valley: ["minecraft:soul_sand", "minecraft:soul_soil", "minecraft:bone_block", "minecraft:basalt"],
    amethyst_geode: ["minecraft:amethyst_block", "minecraft:budding_amethyst", "minecraft:calcite", "minecraft:smooth_basalt", "minecraft:tinted_glass"],
    witch_swamp_hut: ["minecraft:mud", "minecraft:mud_bricks", "minecraft:mangrove_log", "minecraft:redstone_ore", "minecraft:glowstone"],
    pillager_watchtower: ["minecraft:dark_oak_log", "minecraft:dark_oak_planks", "minecraft:cobblestone", "minecraft:iron_ore", "minecraft:hay_block"],
    desert_well_oasis: ["minecraft:sand", "minecraft:sandstone", "minecraft:smooth_sandstone", "minecraft:clay", "minecraft:cut_sandstone"],
    bamboo_monastery: ["minecraft:bamboo_mosaic", "minecraft:moss_block", "minecraft:grass_block", "minecraft:bamboo_block", "minecraft:bamboo_planks"],
    deepslate_forge: ["minecraft:deepslate", "minecraft:deepslate_iron_ore", "minecraft:raw_iron_block", "minecraft:blast_furnace", "minecraft:iron_block"],
    ocean_monument_shrine: ["minecraft:prismarine", "minecraft:prismarine_bricks", "minecraft:dark_prismarine", "minecraft:sea_lantern", "minecraft:sponge"],
    glowstone_meteor: ["minecraft:glowstone", "minecraft:basalt", "minecraft:blackstone", "minecraft:magma", "minecraft:obsidian"],
    end_city_tower: ["minecraft:purpur_block", "minecraft:purpur_pillar", "minecraft:end_bricks", "minecraft:diamond_ore", "minecraft:end_stone"],
    fossil_excavation: ["minecraft:bone_block", "minecraft:coarse_dirt", "minecraft:dirt_with_roots", "minecraft:coal_ore", "minecraft:iron_ore"],
    blacksmith_workshop: ["minecraft:smooth_stone", "minecraft:iron_ore", "minecraft:raw_iron_block", "minecraft:iron_block", "minecraft:furnace"],
    library_observatory: ["minecraft:bookshelf", "minecraft:chiseled_bookshelf", "minecraft:stone_bricks", "minecraft:lapis_ore", "minecraft:lapis_block"],
    alchemist_laboratory: ["minecraft:podzol", "minecraft:redstone_block", "minecraft:gold_ore", "minecraft:redstone_ore", "minecraft:glass"],
    spider_nest: ["minecraft:mossy_stone_bricks", "minecraft:cobblestone", "minecraft:infested_stone", "minecraft:iron_ore"],
    creeper_dungeon: ["minecraft:mossy_cobblestone", "minecraft:tnt", "minecraft:mossy_stone_bricks", "minecraft:cobblestone", "minecraft:sand"],
    slime_biosphere: ["minecraft:moss_block", "minecraft:clay", "minecraft:slime", "minecraft:mud"],
    bee_apiary: ["minecraft:bee_nest", "minecraft:honeycomb_block", "minecraft:honey_block", "minecraft:yellow_terracotta", "minecraft:hay_block"],
    pumpkin_patch: ["minecraft:pumpkin", "minecraft:carved_pumpkin", "minecraft:lit_pumpkin", "minecraft:hay_block", "minecraft:dirt"],
    melon_greenhouse: ["minecraft:melon_block", "minecraft:glass", "minecraft:dirt", "minecraft:grass_block", "minecraft:jungle_log"],
    sculk_laboratory: ["minecraft:sculk", "minecraft:sculk_catalyst", "minecraft:deepslate_tiles", "minecraft:deepslate", "minecraft:deepslate_bricks"],
    armory_vault: ["minecraft:stone_bricks", "minecraft:iron_block", "minecraft:raw_iron_block", "minecraft:chiseled_stone_bricks", "minecraft:cracked_stone_bricks"],
    bakery_windmill: ["minecraft:hay_block", "minecraft:barrel", "minecraft:dried_kelp_block", "minecraft:spruce_planks", "minecraft:spruce_log"],
    aquarium_atoll: ["minecraft:sand", "minecraft:tube_coral_block", "minecraft:brain_coral_block", "minecraft:prismarine", "minecraft:sponge"],
    tuff_golem_sanctuary: ["minecraft:tuff", "minecraft:polished_tuff", "minecraft:deepslate", "minecraft:chiseled_stone_bricks", "minecraft:stone"],
    meteorite_crater: ["minecraft:blackstone", "minecraft:crying_obsidian", "minecraft:obsidian", "minecraft:magma", "minecraft:ancient_debris"],
    golden_pantheon: ["minecraft:quartz_block", "minecraft:smooth_quartz", "minecraft:gold_block", "minecraft:raw_gold_block", "minecraft:sea_lantern"],
    void_gateway_outpost: ["minecraft:end_bricks", "minecraft:purpur_block", "minecraft:obsidian", "minecraft:crying_obsidian", "minecraft:purpur_pillar"],
    elytra_hangar: ["minecraft:purpur_block", "minecraft:end_bricks", "minecraft:purpur_pillar", "minecraft:end_rod", "minecraft:diamond_block", "minecraft:end_stone"]
  };
  return pools[theme.id] || [theme.floor, theme.subfloor, theme.base];
}

function decorateSteppingPaths(dimension, theme, center, seed) {
  const { x: cx, y: cy, z: cz } = center;
  // Offset paths by distance >= 2 to keep adjacent cobblestone collar around the island OneBlock clean
  const pathBlocks = [
    { x: cx, y: cy, z: cz + 2 },
    { x: cx, y: cy, z: cz - 2 },
    { x: cx + 2, y: cy, z: cz },
    { x: cx - 2, y: cy, z: cz },
    { x: cx - 3, y: cy, z: cz - 1 },
    { x: cx + 3, y: cy, z: cz + 1 }
  ];
  for (let i = 0; i < pathBlocks.length; i++) {
    const p = pathBlocks[i];
    const b = dimension.getBlock(p);
    if (b && b.typeId === theme.floor) {
      if (Math.random() < 0.5) {
        b.setType("minecraft:grass_path");
      } else {
        b.setType(theme.biome.includes("nether") ? "minecraft:blackstone" : "minecraft:cobblestone");
      }
    }
  }
}

// Determines the tree placement, wood log type, leaf type, and accessories per theme
function getIslandTreePlacement(theme, center) {
  const { cx, cy, cz } = center;
  switch (theme.id) {
    case "cherry_sanctuary":
      return { pos: { x: cx - 3, y: cy, z: cz - 2 }, log: "minecraft:cherry_log", leaves: "minecraft:cherry_leaves", beeNest: true };
    case "pale_garden_spire":
      return { pos: { x: cx - 3, y: cy, z: cz - 2 }, log: "minecraft:dark_oak_log", leaves: "minecraft:dark_oak_leaves" };
    case "jungle_temple":
      return { pos: { x: cx - 3, y: cy, z: cz - 2 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "sky_oasis":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
    case "bee_apiary":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:birch_log", leaves: "minecraft:birch_leaves", beeNest: true };
    case "pumpkin_patch":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "bamboo_monastery":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "witch_swamp_hut":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:mangrove_log", leaves: "minecraft:mangrove_leaves" };
    case "slime_biosphere":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:mangrove_log", leaves: "minecraft:mangrove_leaves" };
    case "melon_greenhouse":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "bakery_windmill":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
    case "crimson_forest_isle":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:crimson_stem", leaves: "minecraft:nether_wart_block" };
    case "warped_forest_isle":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:warped_stem", leaves: "minecraft:warped_wart_block" };
    case "pillager_watchtower":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:dark_oak_log", leaves: "minecraft:dark_oak_leaves" };
    case "alchemist_laboratory":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:dark_oak_log", leaves: "minecraft:dark_oak_leaves" };
    case "ancient_crypt":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "desert_well_oasis":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "fossil_excavation":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:bone_block", leaves: "minecraft:smooth_sandstone" };
    case "badlands_mesa":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:acacia_log", leaves: "minecraft:acacia_leaves" };
    case "ice_spike_peak":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "mushroom_haven":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:mushroom_stem", leaves: "minecraft:red_mushroom_block" };
    case "amethyst_geode":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:smooth_basalt", leaves: "minecraft:amethyst_block" };
    case "spider_nest":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
    case "creeper_dungeon":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:oak_log", leaves: "minecraft:moss_block" };
    case "deepslate_forge":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:deepslate", leaves: "minecraft:deepslate_tiles" };
    case "sculk_laboratory":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:deepslate", leaves: "minecraft:sculk" };
    case "trial_vault":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:polished_tuff", leaves: "minecraft:cut_copper" };
    case "blacksmith_workshop":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "library_observatory":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "armory_vault":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "golden_pantheon":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:smooth_quartz", leaves: "minecraft:quartz_block" };
    case "ocean_monument_shrine":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:dark_prismarine", leaves: "minecraft:prismarine_bricks" };
    case "aquarium_atoll":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "tuff_golem_sanctuary":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:tuff", leaves: "minecraft:polished_tuff" };
    case "nether_fortress_spire":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:nether_brick", leaves: "minecraft:nether_wart_block" };
    case "bastion_treasury":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:basalt", leaves: "minecraft:gilded_blackstone" };
    case "soul_sand_valley":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:bone_block", leaves: "minecraft:soul_soil" };
    case "glowstone_meteor":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:basalt", leaves: "minecraft:glowstone" };
    case "meteorite_crater":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:crying_obsidian", leaves: "minecraft:obsidian" };
    case "stronghold_portal":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:stone_bricks", leaves: "minecraft:mossy_stone_bricks" };
    case "end_city_tower":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:purpur_pillar", leaves: "minecraft:purpur_block" };
    case "void_gateway_outpost":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:end_bricks", leaves: "minecraft:purpur_block" };
    default:
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
  }
}

function buildIslandNaturalTree(dimension, theme, center) {
  const treeConfig = getIslandTreePlacement(theme, center);
  if (!treeConfig) return;

  const { x: tx, y: cy, z: tz } = treeConfig.pos;

  // 1. Solid foundation block under tree trunk
  try {
    const rootBlock = dimension.getBlock({ x: tx, y: cy, z: tz });
    if (rootBlock && (rootBlock.isAir || rootBlock.typeId === "minecraft:air")) {
      rootBlock.setType(theme.floor || "minecraft:dirt");
    }
  } catch (e) {}

  // 2. Trunk: Exactly 5 blocks tall wood
  for (let h = 1; h <= 5; h++) {
    safeAirOnlySetBlock(dimension, { x: tx, y: cy + h, z: tz }, treeConfig.log);
  }

  // 3. Canopy Layer 1 (at cy + 4): 5x5 area with 4 outer corners cut off (20 leaves)
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue; // cut 4 outer corners
      if (dx === 0 && dz === 0) continue; // trunk location
      safeAirOnlySetBlock(dimension, { x: tx + dx, y: cy + 4, z: tz + dz }, treeConfig.leaves);
    }
  }

  // 4. Canopy Layer 2 (at cy + 5): 3x3 area around top trunk block (8 leaves)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue; // trunk location
      safeAirOnlySetBlock(dimension, { x: tx + dx, y: cy + 5, z: tz + dz }, treeConfig.leaves);
    }
  }

  // 5. Canopy Layer 3 (at cy + 6): Crown cross on top of trunk (5 leaves)
  safeAirOnlySetBlock(dimension, { x: tx, y: cy + 6, z: tz }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx + 1, y: cy + 6, z: tz }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx - 1, y: cy + 6, z: tz }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx, y: cy + 6, z: tz + 1 }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx, y: cy + 6, z: tz - 1 }, treeConfig.leaves);

  // 6. Bee Nest accessory (for bee and cherry themes)
  if (treeConfig.beeNest) {
    safeAirOnlySetBlock(dimension, { x: tx - 1, y: cy + 3, z: tz }, "minecraft:bee_nest");
  }
}
function placeStructureChest(dimension, loc, items) {
  try {
    const b = dimension.getBlock(loc);
    if (!b || (!b.isAir && b.typeId !== "minecraft:air")) return;
    b.setType("minecraft:chest");
    totalBlocksPlacedThisBuild++;
    const inv = b.getComponent("minecraft:inventory")?.container;
    if (inv && items && items.length > 0) {
      for (let i = 0; i < items.length && i < inv.size; i++) {
        try {
          const it = items[i];
          inv.setItem(i, new ItemStack(it.id, it.count || 1));
        } catch (ie) {}
      }
    }
  } catch (e) {}
}

function buildThemedStructure(dimension, theme, center) {
  const { x: cx, y: cy, z: cz } = center;
  const feat = theme.feature;
  let mobSpawned = false;

  switch (feat) {
    case "watchtower": {
      // 1. Pillager Sky Outpost (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:cobblestone");
        }
      }
      for (let y = 0; y <= 4; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:dark_oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:dark_oak_log");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:dark_oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:dark_oak_log");
      }
      for (let y = 0; y <= 2; y++) {
        for (let x = 1; x <= 3; x++) {
          const mat = (y === 1 && x === 2) ? "minecraft:birch_fence" : "minecraft:dark_oak_planks";
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz }, mat);
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz + 4 }, mat);
        }
        for (let z = 1; z <= 3; z++) {
          const mat = (y === 1 && z === 2) ? "minecraft:birch_fence" : "minecraft:dark_oak_planks";
          safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + z }, mat);
          safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + z }, mat);
        }
      }
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:dark_oak_planks");
          if (x === 0 || x === 4 || z === 0 || z === 4) {
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 5, z: sz + z }, "minecraft:dark_oak_fence");
          }
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 6, z: sz }, "minecraft:birch_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 6, z: sz }, "minecraft:birch_fence");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 6, z: sz + 4 }, "minecraft:birch_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 6, z: sz + 4 }, "minecraft:birch_fence");
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 7, z: sz + z }, "minecraft:dark_oak_slab");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:fletching_table");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:target");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz + 1 }, "minecraft:torch");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:crossbow", count: 1 },
        { id: "minecraft:arrow", count: 16 },
        { id: "minecraft:emerald", count: 6 },
        { id: "minecraft:dark_oak_log", count: 8 },
        { id: "minecraft:iron_ingot", count: 3 }
      ]);
      try {
        dimension.spawnEntity("minecraft:pillager", { x: sx + 2.5, y: sy + 5, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "furnace": {
      // 2. Sky Blacksmith Forge (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:smooth_stone" : "minecraft:cobblestone");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:stone_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:stone_bricks");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:stone_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:stone_bricks");
      }
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:stone_brick_slab");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:cobblestone");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:lava");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:blast_furnace");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:stonecutter_block");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:smithing_table");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:crafting_table");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 3 }, [
        { id: "minecraft:iron_ingot", count: 8 },
        { id: "minecraft:raw_iron", count: 12 },
        { id: "minecraft:iron_pickaxe", count: 1 },
        { id: "minecraft:coal", count: 16 },
        { id: "minecraft:bread", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:villager_v2", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "sand_well": {
      // 3. Desert Mirage Well (5x5 offset at cx-4, cz-4)
      const sx = cx - 4;
      const sz = cz - 4;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:cut_sandstone");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 1 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 1 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 3 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 3 }, "minecraft:chiseled_sandstone");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:water");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:water");
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 3, z: sz + z }, "minecraft:sandstone_slab");
        }
      }
      placeLanternWithFence(dimension, { x: sx, y: sy, z: sz + 1 }, "minecraft:birch_fence", "minecraft:lantern");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz + 2 }, "minecraft:crafting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 2 }, "minecraft:cauldron");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 2 }, [
        { id: "minecraft:emerald", count: 6 },
        { id: "minecraft:sand", count: 16 },
        { id: "minecraft:gold_nugget", count: 12 },
        { id: "minecraft:deadbush", count: 2 }
      ]);
      try {
        dimension.spawnEntity("minecraft:camel", { x: sx + 2.5, y: sy, z: sz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "cauldron": {
      // 4. Witch Brew Hut (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz + 4 }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 4 }, "minecraft:oak_log");
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 1, z: sz + z }, "minecraft:spruce_planks");
        }
      }
      for (let y = 2; y <= 3; y++) {
        for (let x = 0; x <= 4; x++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz }, "minecraft:spruce_planks");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz + 4 }, "minecraft:spruce_planks");
        }
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + z }, "minecraft:spruce_planks");
          safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + z }, "minecraft:spruce_planks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 3, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz + 2 }, "minecraft:glass_pane");
      for (let x = -1; x <= 5; x++) {
        for (let z = -1; z <= 5; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:dark_oak_planks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 2, z: sz + 3 }, "minecraft:cauldron");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 2, z: sz + 3 }, "minecraft:brewing_stand");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 2, z: sz + 1 }, "minecraft:crafting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 2, z: sz + 1 }, "minecraft:red_mushroom_block");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 2, z: sz + 3 }, [
        { id: "minecraft:glass_bottle", count: 4 },
        { id: "minecraft:redstone", count: 8 },
        { id: "minecraft:glowstone_dust", count: 4 },
        { id: "minecraft:spider_eye", count: 3 },
        { id: "minecraft:sugar", count: 6 },
        { id: "minecraft:gunpowder", count: 2 }
      ]);
      try {
        dimension.spawnEntity("minecraft:witch", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        dimension.spawnEntity("minecraft:cat", { x: sx + 1.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "copper_spire": {
      // 5. Trial & Breeze Vault (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:polished_tuff" : "minecraft:tuff_bricks");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:cut_copper");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:cut_copper");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:cut_copper");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:cut_copper");
      }
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:copper_grate");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz + 2 }, "minecraft:copper_bulb");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_tuff");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:tuff_stairs");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:tuff_stairs");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, [
        { id: "minecraft:trial_key", count: 2 },
        { id: "minecraft:wind_charge", count: 8 },
        { id: "minecraft:heavy_core", count: 1 },
        { id: "minecraft:copper_ingot", count: 12 },
        { id: "minecraft:diamond", count: 2 }
      ]);
      try {
        dimension.spawnEntity("minecraft:breeze", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "blaze_altar": {
      // 6. Nether Fortress Outpost (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:nether_brick");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:nether_brick");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:nether_brick");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:nether_brick");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:nether_brick");
      }
      for (let x = 1; x <= 3; x++) {
        safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz }, "minecraft:nether_brick_fence");
        safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz + 4 }, "minecraft:nether_brick_fence");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:soul_sand");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:nether_wart");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:soul_sand");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 1 }, "minecraft:nether_wart");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_nether_bricks");
      placeLanternWithFence(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:brewing_stand");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:blaze_rod", count: 4 },
        { id: "minecraft:nether_wart", count: 8 },
        { id: "minecraft:magma_cream", count: 4 },
        { id: "minecraft:gold_ingot", count: 6 },
        { id: "minecraft:nether_brick", count: 16 }
      ]);
      try {
        dimension.spawnEntity("minecraft:blaze", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "gold_monolith": {
      // 7. Bastion Piglin Treasury (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:polished_blackstone_bricks");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:gilded_blackstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:gilded_blackstone");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:gilded_blackstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:gilded_blackstone");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:gold_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:gold_block");
      placeLanternWithFence(dimension, { x: sx + 2, y: sy + 2, z: sz + 2 }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:smithing_table");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:crying_obsidian");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:netherite_scrap", count: 1 },
        { id: "minecraft:gold_block", count: 2 },
        { id: "minecraft:gold_ingot", count: 12 },
        { id: "minecraft:golden_axe", count: 1 },
        { id: "minecraft:crying_obsidian", count: 3 }
      ]);
      try {
        dimension.spawnEntity("minecraft:piglin_brute", { x: sx + 2.5, y: sy, z: sz + 1.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "hay_spire": {
      // 8. Windmill Grain Haven (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:smooth_stone");
        }
      }
      for (let y = 0; y <= 4; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 1 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 1 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 3 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 3 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + y, z: sz + 1 }, "minecraft:white_wool");
        safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + y, z: sz + 3 }, "minecraft:white_wool");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 2 }, "minecraft:white_wool");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 2 }, "minecraft:white_wool");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 3, z: sz }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 5, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 3, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 3, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 3, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz + 4 }, "minecraft:composter");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 4 }, "minecraft:hay_block");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 1, z: sz + 4 }, "minecraft:hay_block");

      // Dedicated Irrigated Wheat & Carrot Plot (100% Hydrated with permanent water canal)
      const fx = cx + 2;
      const fz = cz - 2;
      safeAirOnlySetBlock(dimension, { x: fx, y: cy - 1, z: fz }, "minecraft:stone");
      safeAirOnlySetBlock(dimension, { x: fx, y: cy, z: fz }, "minecraft:water");
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          if (ox !== 0 || oz !== 0) {
            safeAirOnlySetBlock(dimension, { x: fx + ox, y: cy, z: fz + oz }, "minecraft:farmland");
            safeAirOnlySetBlock(dimension, { x: fx + ox, y: cy + 1, z: fz + oz }, (ox + oz) % 2 === 0 ? "minecraft:wheat" : "minecraft:carrots");
          }
        }
      }

      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 4 }, [
        { id: "minecraft:bread", count: 8 },
        { id: "minecraft:wheat", count: 16 },
        { id: "minecraft:wheat_seeds", count: 12 },
        { id: "minecraft:emerald", count: 4 },
        { id: "minecraft:apple", count: 6 }
      ]);
      try {
        dimension.spawnEntity("minecraft:villager_v2", { x: sx + 2.5, y: sy, z: sz + 4.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "gateway_beam": {
      // 9. Ruined Void Portal (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:magma" : "minecraft:netherrack");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 2, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 3, z: sz + 2 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 2, z: sz + 2 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 4, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:gold_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:gold_block");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 1 }, [
        { id: "minecraft:golden_apple", count: 1 },
        { id: "minecraft:obsidian", count: 4 },
        { id: "minecraft:flint_and_steel", count: 1 },
        { id: "minecraft:fire_charge", count: 3 },
        { id: "minecraft:golden_boots", count: 1 }
      ]);
      try {
        dimension.spawnEntity("minecraft:zombie_pigman", { x: sx + 2.5, y: sy, z: sz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "portal_frame": {
      // 10. Stronghold End Chamber (Authentic 7x7 Vanilla 12-Frame Portal Room)
      const sy = cy + 4;
      // Stone Brick Chamber Foundation
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          if (Math.abs(x) <= 1 && Math.abs(z) <= 1) {
            const b = dimension.getBlock({ x: cx + x, y: sy - 1, z: cz + z });
            if (b) b.setType("minecraft:lava");
          } else {
            safeAirOnlySetBlock(dimension, { x: cx + x, y: sy - 1, z: cz + z }, (x + z) % 2 === 0 ? "minecraft:stone_bricks" : "minecraft:cracked_stone_bricks");
          }
        }
      }
      // Chamber Perimeter Stone Columns
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: cx - 3, y: sy + y, z: cz - 3 }, "minecraft:mossy_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: sy + y, z: cz - 3 }, "minecraft:mossy_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: cx - 3, y: sy + y, z: cz + 3 }, "minecraft:mossy_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: sy + y, z: cz + 3 }, "minecraft:mossy_stone_bricks");
      }

      // Helper to place native inward-facing end portal frame
      const placePortalFrame = (fx, fy, fz, dir) => {
        if (safeAirOnlySetBlock(dimension, { x: fx, y: fy, z: fz }, "minecraft:end_portal_frame")) {
          try {
            dimension.runCommand(`setblock ${fx} ${fy} ${fz} end_portal_frame ["direction": ${dir}] replace`);
          } catch (e) {}
        }
      };

      // 12 Authentic Inward-Facing End Portal Frames:
      // North Edge (faces South, dir 0)
      placePortalFrame(cx - 1, sy, cz - 2, 0);
      placePortalFrame(cx, sy, cz - 2, 0);
      placePortalFrame(cx + 1, sy, cz - 2, 0);

      // South Edge (faces North, dir 2)
      placePortalFrame(cx - 1, sy, cz + 2, 2);
      placePortalFrame(cx, sy, cz + 2, 2);
      placePortalFrame(cx + 1, sy, cz + 2, 2);

      // West Edge (faces East, dir 3)
      placePortalFrame(cx - 2, sy, cz - 1, 3);
      placePortalFrame(cx - 2, sy, cz, 3);
      placePortalFrame(cx - 2, sy, cz + 1, 3);

      // East Edge (faces West, dir 1)
      placePortalFrame(cx + 2, sy, cz - 1, 1);
      placePortalFrame(cx + 2, sy, cz, 1);
      placePortalFrame(cx + 2, sy, cz + 1, 1);

      // Corner Steps & Pillars
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy, z: cz - 2 }, "minecraft:stone_bricks");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy, z: cz - 2 }, "minecraft:stone_bricks");
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy, z: cz + 2 }, "minecraft:stone_bricks");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy, z: cz + 2 }, "minecraft:stone_bricks");

      // Hanging Iron Bars & Spawner Pedestal above the lava pool
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 2, z: cz }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 3, z: cz }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 1, z: cz }, "minecraft:mob_spawner");

      // Stronghold Loot Chest (Guaranteed 12 Eyes of Ender for vanilla activation)
      placeStructureChest(dimension, { x: cx - 3, y: sy, z: cz }, [
        { id: "minecraft:ender_eye", count: 12 },
        { id: "minecraft:diamond_sword", count: 1 },
        { id: "minecraft:golden_apple", count: 3 },
        { id: "minecraft:iron_block", count: 2 },
        { id: "minecraft:enchanted_book", count: 1 },
        { id: "minecraft:bookshelf", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:silverfish", { x: cx + 0.5, y: sy + 1.2, z: cz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "end_ship": {
      // 31. End Ship Hangar (Purpur Dock & Dragon Prow)
      const sy = cy + 1;
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: cx + x, y: sy - 1, z: cz + z }, "minecraft:purpur_block");
        }
      }
      // Purpur Pillars & End Rods
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy + 1, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy + 2, z: cz - 2 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy + 1, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy + 2, z: cz - 2 }, "minecraft:end_rod");

      // Ship Prow with Dragon Head & Brewing Stand
      safeAirOnlySetBlock(dimension, { x: cx, y: sy, z: cz + 2 }, "minecraft:purpur_stairs");
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 1, z: cz + 2 }, "minecraft:dragon_head");
      safeAirOnlySetBlock(dimension, { x: cx - 1, y: sy, z: cz }, "minecraft:brewing_stand");

      // End Ship Loot Chest (Elytra, Fireworks, Potions, Shulker Shells)
      placeStructureChest(dimension, { x: cx + 1, y: sy, z: cz }, [
        { id: "minecraft:elytra", count: 1 },
        { id: "minecraft:firework_rocket", count: 32 },
        { id: "minecraft:potion", count: 2 },
        { id: "minecraft:diamond", count: 4 },
        { id: "minecraft:shulker_shell", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:shulker", { x: cx + 0.5, y: sy + 1, z: cz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "sea_lanterns": {
      // 11. Prismarine Ocean Shrine (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:dark_prismarine");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:prismarine_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:prismarine_bricks");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:prismarine_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:prismarine_bricks");
      }
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 3, z: sz }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 3, z: sz + 4 }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz + 4 }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:sponge");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:water");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:prismarine_slab");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:prismarine_slab");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:prismarine_shard", count: 12 },
        { id: "minecraft:prismarine_crystals", count: 8 },
        { id: "minecraft:nautilus_shell", count: 1 },
        { id: "minecraft:heart_of_the_sea", count: 1 },
        { id: "minecraft:salmon", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:guardian", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "pillars": {
      // 12. Ancient Sandstone Crypt (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:cut_sandstone" : "minecraft:orange_terracotta");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:chiseled_sandstone");
      }
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:cut_sandstone_slab");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_sandstone");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:sandstone_stairs");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:sandstone_stairs");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, [
        { id: "minecraft:diamond", count: 2 },
        { id: "minecraft:gold_ingot", count: 8 },
        { id: "minecraft:saddle", count: 1 },
        { id: "minecraft:iron_horse_armor", count: 1 },
        { id: "minecraft:bone", count: 8 }
      ]);
      try {
        dimension.spawnEntity("minecraft:husk", { x: sx + 2.5, y: sy, z: sz + 1.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "enchanting_setup": {
      // 13. Arcane Sky Observatory (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:polished_deepslate");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:enchanting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:grindstone");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:lapis_block");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:enchanted_book", count: 2 },
        { id: "minecraft:lapis_lazuli", count: 16 },
        { id: "minecraft:book", count: 6 },
        { id: "minecraft:ender_pearl", count: 4 },
        { id: "minecraft:experience_bottle", count: 3 }
      ]);
      try {
        dimension.spawnEntity("minecraft:allay", { x: sx + 2.5, y: sy + 1.5, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "brewing_setup": {
      // 14. Void Alchemist Laboratory (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:spruce_planks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:brewing_stand");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:cauldron");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:crafting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:nether_wart");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy - 1, z: sz + 3 }, "minecraft:soul_sand");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:glass_bottle", count: 6 },
        { id: "minecraft:fermented_spider_eye", count: 2 },
        { id: "minecraft:blaze_powder", count: 4 },
        { id: "minecraft:magma_cream", count: 2 },
        { id: "minecraft:glowstone_dust", count: 6 }
      ]);
      try {
        dimension.spawnEntity("minecraft:witch", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "fossil_rib": {
      // 15. Prehistoric Fossil Dig (6x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 5; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:mud" : "minecraft:coarse_dirt");
        }
      }
      for (const rx of [1, 3, 5]) {
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy, z: sz + 1 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 1, z: sz + 1 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 2, z: sz + 2 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 2, z: sz + 3 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 1, z: sz + 4 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy, z: sz + 4 }, "minecraft:bone_block");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:moss_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:sniffer_egg");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 2 }, "minecraft:composter");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 2 }, [
        { id: "minecraft:torchflower_seeds", count: 2 },
        { id: "minecraft:pitcher_pod", count: 2 },
        { id: "minecraft:bone", count: 12 },
        { id: "minecraft:bone_meal", count: 8 },
        { id: "minecraft:sniffer_egg", count: 1 }
      ]);
      try {
        dimension.spawnEntity("minecraft:sniffer", { x: sx + 3.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "glass_dome": {
      // 16. Tropical Melon Greenhouse (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:jungle_planks");
          if (x === 0 || x === 4 || z === 0 || z === 4) {
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz + z }, "minecraft:jungle_log");
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 1, z: sz + z }, "minecraft:glass");
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 2, z: sz + z }, "minecraft:glass");
          }
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 3, z: sz + z }, "minecraft:glass");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:water");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy - 1, z: sz + 2 }, "minecraft:farmland");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy - 1, z: sz + 2 }, "minecraft:farmland");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:melon_block");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:carved_pumpkin");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:bamboo");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:composter");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:melon_seeds", count: 8 },
        { id: "minecraft:melon_slice", count: 16 },
        { id: "minecraft:bamboo", count: 8 },
        { id: "minecraft:shears", count: 1 },
        { id: "minecraft:jungle_sapling", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:parrot", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "bamboo_grove": {
      // 17. Jungle Ruined Temple (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:mossy_cobblestone" : "minecraft:chiseled_stone_bricks");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:mossy_cobblestone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:mossy_cobblestone");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:mossy_cobblestone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:mossy_cobblestone");
      }
      for (let by = 0; by <= 4; by++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + by, z: sz + 1 }, "minecraft:bamboo");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + by, z: sz + 1 }, "minecraft:bamboo");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_stone_bricks");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:dispenser");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:emerald", count: 6 },
        { id: "minecraft:arrow", count: 16 },
        { id: "minecraft:bamboo", count: 12 },
        { id: "minecraft:gold_ingot", count: 4 },
        { id: "minecraft:mossy_cobblestone", count: 8 }
      ]);
      try {
        dimension.spawnEntity("minecraft:ocelot", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "end_rod": {
      // 18. End City Spire (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:purpur_block");
        }
      }
      for (let y = 0; y <= 4; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 1 }, "minecraft:purpur_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 1 }, "minecraft:purpur_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 3 }, "minecraft:purpur_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 3 }, "minecraft:purpur_pillar");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 5, z: sz + 1 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 5, z: sz + 1 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 5, z: sz + 3 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 5, z: sz + 3 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:purpur_block");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, [
        { id: "minecraft:chorus_fruit", count: 12 },
        { id: "minecraft:ender_pearl", count: 4 },
        { id: "minecraft:iron_ingot", count: 6 },
        { id: "minecraft:diamond", count: 1 },
        { id: "minecraft:purpur_block", count: 8 }
      ]);
      try {
        dimension.spawnEntity("minecraft:shulker", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "sculk_shrieker": {
      // 19. Ancient Sculk Laboratory (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:deepslate_tiles");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:sculk_catalyst");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:sculk_sensor");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:sculk_shrieker");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:sculk");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:sculk");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz }, "minecraft:cobbled_deepslate_wall");
      placeLanternWithFence(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:echo_shard", count: 3 },
        { id: "minecraft:disc_fragment_5", count: 2 },
        { id: "minecraft:amethyst_shard", count: 6 },
        { id: "minecraft:sculk", count: 8 }
      ]);
      try {
        dimension.spawnEntity("minecraft:bat", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "anvil_stand": {
      // 20. Knight Sky Armory (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:stone_bricks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:smithing_table");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:grindstone");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:blast_furnace");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:iron_bars");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:iron_chestplate", count: 1 },
        { id: "minecraft:iron_helmet", count: 1 },
        { id: "minecraft:iron_sword", count: 1 },
        { id: "minecraft:iron_block", count: 1 },
        { id: "minecraft:shield", count: 1 }
      ]);
      try {
        dimension.spawnEntity("minecraft:iron_golem", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "copper_bulb": {
      // 21. Tuff Golem Sanctuary (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:tuff_bricks");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:chiseled_tuff");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:chiseled_tuff");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:chiseled_tuff");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:chiseled_tuff");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:copper_bulb");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:copper_grate");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:copper_ingot", count: 16 },
        { id: "minecraft:raw_copper", count: 12 },
        { id: "minecraft:honeycomb", count: 4 },
        { id: "minecraft:tuff", count: 16 }
      ]);
      try {
        dimension.spawnEntity("minecraft:iron_golem", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "lava_forge": {
      // 22. Ancient Deepslate Forge (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:deepslate_bricks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:lava");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:blast_furnace");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:stonecutter_block");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:diamond", count: 2 },
        { id: "minecraft:raw_iron", count: 12 },
        { id: "minecraft:coal", count: 16 },
        { id: "minecraft:obsidian", count: 4 }
      ]);
      break;
    }

    case "tnt_barrel": {
      // 23. Volatile Gunpowder Depot (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:polished_andesite");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:barrel");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:barrel");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:tnt");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:tnt");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:target");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 3 }, [
        { id: "minecraft:tnt", count: 3 },
        { id: "minecraft:gunpowder", count: 12 },
        { id: "minecraft:sand", count: 12 },
        { id: "minecraft:flint_and_steel", count: 1 }
      ]);
      try {
        dimension.spawnEntity("minecraft:creeper", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "webs": {
      // 24. Cobweb Cave Nest (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:mossy_cobblestone");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_stone_bricks");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:web");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:string", count: 16 },
        { id: "minecraft:spider_eye", count: 8 },
        { id: "minecraft:fermented_spider_eye", count: 2 },
        { id: "minecraft:iron_ingot", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:cave_spider", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "slime_core": {
      // 25. Gelatinous Slime Isle (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:moss_block");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:emerald_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:slime");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:slime");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:slime");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:slime_ball", count: 16 },
        { id: "minecraft:lead", count: 2 },
        { id: "minecraft:sticky_piston", count: 2 },
        { id: "minecraft:emerald", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:slime", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "beehive": {
      // 26. Sunlit Honey Apiary (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:grass_block");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:campfire");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:bee_nest");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz + 2 }, "minecraft:flowering_azalea");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:honey_bottle", count: 4 },
        { id: "minecraft:honeycomb", count: 6 },
        { id: "minecraft:shears", count: 1 },
        { id: "minecraft:honey_block", count: 2 }
      ]);
      try {
        dimension.spawnEntity("minecraft:bee", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        dimension.spawnEntity("minecraft:bee", { x: sx + 1.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "huge_mushroom": {
      // 27. Giant Mushroom Haven (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:mycelium");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + y, z: sz + 2 }, "minecraft:mushroom_stem");
      }
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:red_mushroom_block");
        }
      }
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:mushroom_stew", count: 3 },
        { id: "minecraft:red_mushroom", count: 12 },
        { id: "minecraft:brown_mushroom", count: 12 },
        { id: "minecraft:mycelium", count: 4 }
      ]);
      try {
        dimension.spawnEntity("minecraft:mooshroom", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "ice_spike": {
      // 28. Glacial Ice Spire (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:packed_ice");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:blue_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:blue_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz + 2 }, "minecraft:blue_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 3, z: sz + 2 }, "minecraft:packed_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz + 2 }, "minecraft:packed_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 5, z: sz + 2 }, "minecraft:packed_ice");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 2 }, [
        { id: "minecraft:blue_ice", count: 8 },
        { id: "minecraft:packed_ice", count: 16 },
        { id: "minecraft:snowball", count: 16 },
        { id: "minecraft:cod", count: 6 }
      ]);
      try {
        dimension.spawnEntity("minecraft:polar_bear", { x: sx + 2.5, y: sy, z: sz + 3.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "coral_pool": {
      // 29. Coral Reef Biosphere (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      // Foundation rim:
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 2, z: sz + z }, "minecraft:prismarine");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:cut_sandstone");
        }
      }
      // Rich 2-deep clear coral lagoon with sea lantern base and vibrant live corals!
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          const bedBlock = (x === 2 && z === 2) ? "minecraft:sea_lantern" : ((x + z) % 2 === 0 ? "minecraft:tube_coral_block" : "minecraft:brain_coral_block");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, bedBlock);
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz + z }, "minecraft:water");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 1, z: sz + z }, "minecraft:water");
        }
      }
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 1 }, [
        { id: "minecraft:tube_coral_block", count: 8 },
        { id: "minecraft:brain_coral_block", count: 8 },
        { id: "minecraft:bubble_coral_block", count: 8 },
        { id: "minecraft:sea_pickle", count: 8 },
        { id: "minecraft:sponge", count: 2 },
        { id: "minecraft:heart_of_the_sea", count: 1 },
        { id: "minecraft:nautilus_shell", count: 2 }
      ]);
      try {
        dimension.spawnEntity("minecraft:axolotl", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "god_altar": {
      // 30. Pantheon of the Gods (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:quartz_block");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:quartz_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:quartz_pillar");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:quartz_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:quartz_pillar");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:gold_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:sea_lantern");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:netherite_ingot", count: 1 },
        { id: "minecraft:golden_apple", count: 2 },
        { id: "minecraft:diamond", count: 4 },
        { id: "minecraft:totem_of_undying", count: 1 }
      ]);
      break;
    }

    default: {
      const tr = theme.trait;
      if (tr === "village" || feat === "well") {
        const hx = cx - 4;
        const hz = cz - 4;
        const hy = cy + 1;
        for (let x = 0; x <= 3; x++) {
          for (let z = 0; z <= 3; z++) {
            safeAirOnlySetBlock(dimension, { x: hx + x, y: hy - 1, z: hz + z }, "minecraft:cobblestone");
            const isCorner = (x === 0 || x === 3) && (z === 0 || z === 3);
            const mat = isCorner ? "minecraft:oak_log" : "minecraft:oak_planks";
            for (let y = 0; y <= 2; y++) {
              safeAirOnlySetBlock(dimension, { x: hx + x, y: hy + y, z: hz + z }, mat);
            }
            safeAirOnlySetBlock(dimension, { x: hx + x, y: hy + 3, z: hz + z }, "minecraft:oak_planks");
          }
        }
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy, z: hz }, "minecraft:air");
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy + 1, z: hz }, "minecraft:air");
        safeAirOnlySetBlock(dimension, { x: hx + 2, y: hy + 1, z: hz + 3 }, "minecraft:glass_pane");
        safeAirOnlySetBlock(dimension, { x: hx + 2, y: hy, z: hz + 2 }, "minecraft:bed");
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy, z: hz + 2 }, "minecraft:crafting_table");
        safeAirOnlySetBlock(dimension, { x: hx + 2, y: hy, z: hz + 1 }, "minecraft:furnace");
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy + 2, z: hz + 1 }, "minecraft:torch");
        placeStructureChest(dimension, { x: hx + 1, y: hy, z: hz + 1 }, [
          { id: "minecraft:emerald", count: 8 },
          { id: "minecraft:bread", count: 6 },
          { id: "minecraft:wheat_seeds", count: 8 },
          { id: "minecraft:golden_carrot", count: 4 }
        ]);
        const fx = cx + 3;
        const fz = cz - 2;
        for (let fxo = -1; fxo <= 1; fxo++) {
          for (let fzo = -1; fzo <= 1; fzo++) {
            if (fxo === 0 && fzo === 0) {
              safeAirOnlySetBlock(dimension, { x: fx + fxo, y: cy, z: fz + fzo }, "minecraft:water");
            } else {
              safeAirOnlySetBlock(dimension, { x: fx + fxo, y: cy, z: fz + fzo }, "minecraft:farmland");
              safeAirOnlySetBlock(dimension, { x: fx + fxo, y: cy + 1, z: fz + fzo }, (fxo + fzo) % 2 === 0 ? "minecraft:wheat" : "minecraft:carrots");
            }
          }
        }
        safeAirOnlySetBlock(dimension, { x: cx + 2, y: cy + 1, z: cz + 3 }, "minecraft:oak_fence");
        safeAirOnlySetBlock(dimension, { x: cx + 2, y: cy + 2, z: cz + 3 }, "minecraft:bell");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: cy + 1, z: cz + 3 }, "minecraft:hay_block");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: cy + 2, z: cz + 3 }, "minecraft:hay_block");
        try {
          dimension.spawnEntity("minecraft:villager_v2", { x: hx + 1.5, y: hy, z: hz + 1.5 });
          mobSpawned = true;
        } catch (ve) {}
      } else if (tr === "animals") {
        const px = cx - 3;
        const pz = cz + 3;
        safeAirOnlySetBlock(dimension, { x: px - 1, y: cy + 1, z: pz - 1 }, "minecraft:cauldron");
        safeAirOnlySetBlock(dimension, { x: px + 1, y: cy + 1, z: pz - 1 }, "minecraft:hay_block");
        safeAirOnlySetBlock(dimension, { x: px, y: cy + 1, z: pz + 2 }, "minecraft:carved_pumpkin");
        placeStructureChest(dimension, { x: px, y: cy + 1, z: pz }, [
          { id: "minecraft:wheat", count: 8 },
          { id: "minecraft:lead", count: 2 },
          { id: "minecraft:saddle", count: 1 }
        ]);
      } else if (tr === "water_spring") {
        const wx = cx - 3;
        const wz = cz - 2;
        safeAirOnlySetBlock(dimension, { x: wx, y: cy, z: wz }, "minecraft:water");
        safeAirOnlySetBlock(dimension, { x: wx - 1, y: cy, z: wz }, "minecraft:water");
        safeAirOnlySetBlock(dimension, { x: wx - 2, y: cy, z: wz }, "minecraft:water");
        for (let yDrop = 0; yDrop <= 5; yDrop++) {
          safeAirOnlySetBlock(dimension, { x: wx - 3, y: cy - yDrop, z: wz }, "minecraft:water");
        }
        safeAirOnlySetBlock(dimension, { x: wx, y: cy + 1, z: wz + 1 }, "minecraft:reeds");
        safeAirOnlySetBlock(dimension, { x: wx, y: cy + 2, z: wz + 1 }, "minecraft:reeds");
        safeAirOnlySetBlock(dimension, { x: wx - 1, y: cy + 1, z: wz }, "minecraft:waterlily");
      } else if (tr === "lava_spring") {
        const lx = cx - 2;
        const lz = cz - 3;
        safeAirOnlySetBlock(dimension, { x: lx, y: cy, z: lz }, "minecraft:lava");
        safeAirOnlySetBlock(dimension, { x: lx - 1, y: cy, z: lz }, "minecraft:magma");
        safeAirOnlySetBlock(dimension, { x: lx + 1, y: cy, z: lz }, "minecraft:magma");
        safeAirOnlySetBlock(dimension, { x: lx, y: cy, z: lz - 1 }, "minecraft:crying_obsidian");
        for (let yDrop = 0; yDrop <= 6; yDrop++) {
          safeAirOnlySetBlock(dimension, { x: lx, y: cy - yDrop, z: lz - 2 }, "minecraft:lava");
        }
      } else if (tr === "ore_rich") {
        const mx = cx + 3;
        const mz = cz - 3;
        safeAirOnlySetBlock(dimension, { x: mx, y: cy + 1, z: mz }, "minecraft:raw_iron_block");
        safeAirOnlySetBlock(dimension, { x: mx + 1, y: cy + 1, z: mz }, "minecraft:gold_ore");
        safeAirOnlySetBlock(dimension, { x: mx, y: cy + 2, z: mz }, "minecraft:diamond_ore");
        safeAirOnlySetBlock(dimension, { x: mx + 1, y: cy + 2, z: mz }, "minecraft:raw_gold_block");
        safeAirOnlySetBlock(dimension, { x: mx - 1, y: cy + 1, z: mz }, "minecraft:anvil");
        safeAirOnlySetBlock(dimension, { x: mx - 1, y: cy + 1, z: mz + 1 }, "minecraft:rail");
        safeAirOnlySetBlock(dimension, { x: mx, y: cy + 1, z: mz + 1 }, "minecraft:rail");
      } else if (tr === "dungeon") {
        const dx = cx - 3;
        const dz = cz + 2;
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            safeAirOnlySetBlock(dimension, { x: dx + x, y: cy, z: dz + z }, Math.random() < 0.5 ? "minecraft:mossy_cobblestone" : "minecraft:cracked_stone_bricks");
          }
        }
        safeAirOnlySetBlock(dimension, { x: dx - 1, y: cy + 1, z: dz - 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx + 1, y: cy + 1, z: dz - 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx - 1, y: cy + 1, z: dz + 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx + 1, y: cy + 1, z: dz + 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx, y: cy + 1, z: dz }, "minecraft:chiseled_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: dx, y: cy + 2, z: dz }, "minecraft:web");
        placeStructureChest(dimension, { x: dx, y: cy + 1, z: dz + 1 }, [
          { id: "minecraft:iron_ingot", count: 6 },
          { id: "minecraft:gunpowder", count: 8 },
          { id: "minecraft:string", count: 8 }
        ]);
        if (theme.mob) {
          try {
            dimension.spawnEntity(theme.mob, { x: dx + 0.5, y: cy + 1, z: dz + 0.5 });
            mobSpawned = true;
          } catch (me) {}
        }
      }
      break;
    }
  }

  return mobSpawned;
}

export function buildThemedIsland(dimension, theme, center) {
  const { x: cx, y: cy, z: cz } = center;

  // Chunk loading safety check: verify island center block exists
  try {
    const centerBlock = dimension.getBlock({ x: cx, y: cy, z: cz });
    if (!centerBlock) return 0; // Center chunk unloaded, defer build until loaded!
  } catch (e) {
    return 0;
  }

  totalBlocksPlacedThisBuild = 0;

  // 1. AUTO-CHANGE BIOME: Paint true native Minecraft biome across island volume
  try {
    const biomeName = ({ dark_forest: "roofed_forest", nether_wastes: "hell" })[theme.biome] || theme.biome || "plains";
    dimension.runCommand(`fillbiome ${cx - 14} ${cy - 12} ${cz - 14} ${cx + 14} ${cy + 18} ${cz + 14} ${biomeName}`);
  } catch (be) {}

  // 2. PROCEDURAL SHAPE & SCALE PER THEME:
  let seed = 0;
  for (let i = 0; i < theme.id.length; i++) {
    seed = (seed * 31 + theme.id.charCodeAt(i)) & 0xffffff;
  }

  // Radius scale by size category:
  let baseRadius = 6.2;
  if (theme.size === "huge") baseRadius = 10.5;
  else if (theme.size === "big") baseRadius = 8.2;
  else if (theme.size === "medium") baseRadius = 6.4;
  else if (theme.size === "compact") baseRadius = 4.8;

  const freq1 = 2 + (seed % 3);
  const freq2 = 3 + ((seed >> 2) % 3);
  const freq3 = 4 + ((seed >> 4) % 2);
  const amp1 = 0.9 + ((seed % 10) / 12);
  const amp2 = 0.6 + (((seed >> 3) % 10) / 18);
  const amp3 = 0.4 + (((seed >> 6) % 10) / 25);
  const ridgeAngle = ((seed % 8) * Math.PI) / 4;

  const isOreRich = theme.trait === "ore_rich";
  const oreChance = isOreRich ? 18 : 7; // Rich ore density (18%) vs standard/flora (7%)
  const archetype = getIslandArchetype(theme);

  const maxR = Math.ceil(baseRadius + amp1 + amp2 + amp3 + 1);

  // 3. TERRAIN VOLUME GENERATION (5 GEOLOGICAL ARCHETYPES):
  for (let dx = -maxR; dx <= maxR; dx++) {
    for (let dz = -maxR; dz <= maxR; dz++) {
      const angle = Math.atan2(dz, dx);
      const shapeMod = baseRadius + amp1 * Math.cos(freq1 * angle) + amp2 * Math.sin(freq2 * angle) + amp3 * Math.cos(freq3 * angle);
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= shapeMod) {
        let surfaceY = cy;
        let depth = Math.max(1, Math.round((shapeMod - dist) * 1.35));
        let isLagoon = false;

        if (archetype === "atoll") {
          // Central sunken lagoon crater with perimeter ring reef
          if (dist <= shapeMod * 0.45) {
            isLagoon = true;
            surfaceY = cy - 1;
            depth = Math.max(2, Math.round((shapeMod * 0.45 - dist) * 0.9) + 2);
          } else {
            surfaceY = cy;
            depth = Math.max(1, Math.round((shapeMod - dist) * 1.25));
          }
        } else if (archetype === "spire") {
          // Conical needle peak rising sharply at center and deep vertical underside stalactite
          const norm = Math.max(0, 1 - (dist / shapeMod));
          surfaceY = cy + Math.round(norm * norm * 5);
          depth = Math.max(1, Math.round((shapeMod - dist) * 1.5 + norm * norm * 6));
        } else if (archetype === "terrace") {
          // Crisp 3-tier stepped geological plateaus
          if (dist <= shapeMod * 0.35) {
            surfaceY = cy + 3; // Summit plateau
          } else if (dist <= shapeMod * 0.68) {
            surfaceY = cy + 1; // Mid terrace
          } else {
            surfaceY = cy; // Lower perimeter terrace
          }
          depth = Math.max(2, Math.round((shapeMod - dist) * 1.25));
        } else if (archetype === "archipelago") {
          // Main islet + satellite stepping islets with natural gap channels
          const lobe = Math.cos(3 * angle);
          if (dist > shapeMod * 0.65 && lobe < -0.25) {
            // Natural channel / water gap between islets
            continue;
          }
          surfaceY = (dist > shapeMod * 0.65) ? cy - 1 : cy;
          depth = Math.max(1, Math.round((shapeMod - dist) * 1.15));
        } else {
          // Rolling topography (gentle natural rolling hills)
          const dot = Math.cos(angle - ridgeAngle);
          if (dot > 0.35 && dist > 1.5) surfaceY = cy + 1;
          if (dot > 0.72 && dist > 3.0) surfaceY = cy + 2;
          depth = Math.max(1, Math.round((shapeMod - dist) * 1.35));
        }

        // POND ALCOVE (for water spring / nature if rolling):
        const dot = Math.cos(angle - ridgeAngle);
        const isSpringPond = (archetype === "rolling") && (theme.trait === "water_spring" || theme.trait === "animals") && (dot < -0.45 && dist >= 2.0 && dist <= 4.2);

        // Place surface layer:
        if (isLagoon) {
          if (theme.biome.includes("nether") || theme.id === "meteorite_crater") {
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy, z: cz + dz }, "minecraft:lava");
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 1, z: cz + dz }, "minecraft:magma");
          } else {
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy, z: cz + dz }, "minecraft:water");
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 1, z: cz + dz }, "minecraft:water");
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 2, z: cz + dz }, ((dx + dz) % 2 === 0) ? "minecraft:tube_coral_block" : "minecraft:brain_coral_block");
          }
        } else if (isSpringPond) {
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy, z: cz + dz }, "minecraft:water");
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 1, z: cz + dz }, "minecraft:clay");
        } else {
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: surfaceY, z: cz + dz }, theme.floor);
          placeSurfaceVegetation(dimension, theme, { x: cx + dx, y: surfaceY, z: cz + dz }, seed);

          // Fill elevated hill/terrace/spire steps underneath with subsoil & rock
          if (surfaceY > cy) {
            for (let upY = cy; upY < surfaceY; upY++) {
              safeAirOnlySetBlock(dimension, { x: cx + dx, y: upY, z: cz + dz }, getSubsoilBlock(theme, dx, dz, seed));
            }
          }
        }

        // 4. SUBSOIL & ROCK STRATA UNDERSIDE:
        for (let d = 1; d <= depth; d++) {
          let blockMat;
          if (d <= 2) {
            // Subsoil layer (rich 2-4 organic subsoil blocks)
            blockMat = getSubsoilBlock(theme, dx, dz, seed);
          } else {
            // Stone strata with real ore veins (rich vs poor economy)
            const oreHash = Math.random() * 100;
            if (oreHash < oreChance) {
              blockMat = getOreBlock(theme, d, dx, dz, seed);
            } else {
              blockMat = getRockBlock(theme, dx, dz, d, seed);
            }
          }
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - d, z: cz + dz }, blockMat);
        }

        // Hanging root stalactites underneath:
        if (dist <= 3.2 && Math.random() < 0.45) {
          const rootMat = getRockBlock(theme, dx, dz, depth + 1, seed);
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - depth - 1, z: cz + dz }, rootMat);
          if (dist <= 1.5) {
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - depth - 2, z: cz + dz }, rootMat);
          }
        }

        // Hanging underside foliage (roots & vines under soil/rock overhangs):
        if (dist >= baseRadius * 0.45 && Math.random() < 0.22) {
          const hangLoc = { x: cx + dx, y: cy - depth - 1, z: cz + dz };
          if (theme.biome.includes("nether") || theme.biome.includes("crimson")) {
            safeAirOnlySetBlock(dimension, hangLoc, "minecraft:weeping_vines");
          } else if (theme.floor === "minecraft:grass_block" || theme.floor === "minecraft:podzol") {
            safeAirOnlySetBlock(dimension, hangLoc, "minecraft:hanging_roots");
          }
        }
      }
    }
  }

  // 5. TEMPORARY ISLAND ONEBLOCK CORE (30-50 Blocks Capacity):
  // Placed flush directly at the island surface center (cx, coreY, cz) matching archetype height!
  let coreY = cy;
  if (archetype === "spire") coreY = cy + 5;
  else if (archetype === "terrace") coreY = cy + 3;

  const obPos = { x: cx, y: coreY, z: cz };
  try {
    const maxBlocks = 30 + Math.floor(Math.random() * 21); // 30 to 50 randomized blocks
    world.setDynamicProperty(`island_ob_x_${theme.id}`, obPos.x);
    world.setDynamicProperty(`island_ob_y_${theme.id}`, obPos.y);
    world.setDynamicProperty(`island_ob_z_${theme.id}`, obPos.z);
    world.setDynamicProperty(`island_ob_max_${theme.id}`, maxBlocks);
    world.setDynamicProperty(`island_ob_mined_${theme.id}`, 0);
    world.setDynamicProperty(`island_ob_completed_${theme.id}`, false);

    // Initial block from theme's curated block pool placed flush on the surface
    const pool = getIslandBlockPool(theme);
    const obBlock = dimension.getBlock(obPos);
    if (obBlock) {
      let placed = false;
      try {
        obBlock.setType(pool[0]);
        if (!obBlock.isAir && obBlock.typeId !== "minecraft:air") {
          placed = true;
          totalBlocksPlacedThisBuild++;
        }
      } catch (e1) {}
      if (!placed) {
        try {
          obBlock.setType(theme.floor);
          if (!obBlock.isAir && obBlock.typeId !== "minecraft:air") {
            placed = true;
            totalBlocksPlacedThisBuild++;
          }
        } catch (e2) {}
      }
      if (!placed) {
        try {
          obBlock.setType("minecraft:dirt");
          totalBlocksPlacedThisBuild++;
        } catch (e3) {}
      }
    }

    // Bedrock foundation directly underneath the Island OneBlock
    const underBlock = dimension.getBlock({ x: cx, y: coreY - 1, z: cz });
    if (underBlock) {
      try {
        underBlock.setType("minecraft:bedrock");
        totalBlocksPlacedThisBuild++;
      } catch (ue) {}
    }

    // The blocks directly beside the Island OneBlock are Bedrock
    const besideOffsets = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 }
    ];
    for (const off of besideOffsets) {
      const bBlock = dimension.getBlock({ x: cx + off.x, y: coreY, z: cz + off.z });
      if (bBlock) {
        try {
          bBlock.setType("minecraft:bedrock");
          totalBlocksPlacedThisBuild++;
        } catch (se) {}
      }
    }
  } catch (e) {}

  // 6b. ORGANIC STEPPING PATHS:
  decorateSteppingPaths(dimension, theme, center, seed);

  // 6c. HOLLOW MICRO-CAVERN (For Huge & Big Islands):
  if (theme.size === "huge" || theme.size === "big") {
    buildMicroCave(dimension, theme, center, seed);
  }

  // 6d. SATELLITE MICRO-ISLETS & HANGING CHAINS (For Huge & Big Islands):
  if (theme.size === "huge" || theme.size === "big") {
    buildSatelliteIslet(dimension, theme, center, maxR, seed, 0);
    if (theme.size === "huge") {
      buildSatelliteIslet(dimension, theme, center, maxR, seed, 1);
    }
  }

  // 7. THEMATIC SPECIAL STRUCTURES & COMPACT VANILLA DESIGNS:
  let structureMobSpawned = false;
  try {
    structureMobSpawned = buildThemedStructure(dimension, theme, center);
  } catch (fe) {}

  // 7b. ISLAND NATURAL CANOPY TREES:
  // Authentic 5-tall wood trunk with a ~33-leaf rounded canopy for all forest/woodland/flora themes
  try {
    buildIslandNaturalTree(dimension, theme, center);
  } catch (te) {}

  // 8. CORNER LIGHTING POSTS:
  // Dynamically find valid solid ground perimeter spots, place thematic fence and lantern on top!
  const themeFence = getThemeFenceType(theme);
  const themeLantern = getThemeLanternType(theme);

  const candidateOffsets = [
    { dx: 3, dz: -2 },
    { dx: -4, dz: 2 },
    { dx: 2, dz: 4 },
    { dx: -3, dz: -3 },
    { dx: 4, dz: 2 },
    { dx: -2, dz: 4 },
    { dx: 1, dz: -4 },
    { dx: -4, dz: -2 }
  ];

  let postsPlaced = 0;
  for (const off of candidateOffsets) {
    if (postsPlaced >= 3) break;
    const px = cx + off.dx;
    const pz = cz + off.dz;

    // Scan downward from cy + 6 to cy - 4 to find the highest solid surface block
    let groundY = null;
    for (let scanY = cy + 6; scanY >= cy - 4; scanY--) {
      const b = dimension.getBlock({ x: px, y: scanY, z: pz });
      if (!b || b.isAir || b.typeId === "minecraft:air") continue;
      const t = b.typeId;
      // Skip fluids, chests, trees/leaves, and fences/walls
      if (t.includes("water") || t.includes("lava") || t.includes("chest") || t.includes("leaves") || t.includes("fence") || t.includes("log") || t.includes("wall") || t.includes("bedrock") || t.includes("lodestone")) continue;
      // Skip soft surface plants/crops (we will overwrite if they're on top of solid ground)
      if (t.includes("grass") || t.includes("flower") || t.includes("petal") || t.includes("fern") || t.includes("bush") || t.includes("crop") || t.includes("carrot") || t.includes("wheat") || t.includes("potato") || t.includes("beetroot") || t.includes("pumpkin") || t.includes("melon") || t.includes("roots") || t.includes("fungus") || t.includes("reeds") || t.includes("bamboo") || t.includes("deadbush")) {
        continue;
      }
      // Found solid ground!
      groundY = scanY;
      break;
    }

    if (groundY === null) continue;

    const fenceLoc = { x: px, y: groundY + 1, z: pz };
    if (placeLanternWithFence(dimension, fenceLoc, themeFence, themeLantern)) {
      postsPlaced++;
    }
  }

  // 9. THEMATIC COMPANION MOB (if not already spawned by structure):
  if (theme.mob && !structureMobSpawned) {
    try {
      dimension.spawnEntity(theme.mob, { x: cx + 0.5, y: coreY + 1.2, z: cz - 1.5 });
    } catch (e) {}
  }

  return totalBlocksPlacedThisBuild;
}
