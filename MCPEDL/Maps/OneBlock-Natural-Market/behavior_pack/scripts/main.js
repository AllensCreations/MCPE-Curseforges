import { world, system, ItemStack, ItemTypes, DisplaySlotId, ObjectiveSortOrder } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

const CORE = { x: 0, y: 64, z: 0 };
const BEDROCK = { x: 0, y: 63, z: 0 };
const LEDGER = "allenscreations:trader_ledger";
const COINS = "obm_coins";
const BOARD = "obm_coins_board";
const MINED = "obm_mined";
const TOTAL = "obm_total";
const GLOBAL_KEY = "OneBlockNaturalMarket";
const POOL_KEY = "obm_purchased_blocks";
const READY_EVENT = "allenscreations:oneblock_ready";
const UNSAFE_CORE = new Set([
  "minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava",
  "minecraft:oak_door", "minecraft:torch", "minecraft:redstone_torch", "minecraft:soul_torch",
  "minecraft:lever", "minecraft:ladder", "minecraft:oak_sapling", "minecraft:sugar_cane",
  "minecraft:bamboo", "minecraft:repeater", "minecraft:comparator", "minecraft:anvil", "minecraft:netherite_block"
]);
const MCICON_DIR = "textures/ui/natural_market/icons/";
const CATEGORIES = [
  { name: "Building Blocks", icon: MCICON_DIR + "stone" },
  { name: "Tools & Gear", icon: MCICON_DIR + "iron_pickaxe" },
  { name: "Farming", icon: MCICON_DIR + "wheat" },
  { name: "Food", icon: MCICON_DIR + "bread" },
  { name: "Combat", icon: MCICON_DIR + "iron_sword" },
  { name: "Ores & Minerals", icon: MCICON_DIR + "diamond" },
  { name: "Redstone", icon: MCICON_DIR + "redstone" },
  { name: "Mob Drops", icon: MCICON_DIR + "bone" },
  { name: "Spawn Eggs", icon: MCICON_DIR + "cow_spawn_egg" },
  { name: "Nether", icon: MCICON_DIR + "netherrack" },
  { name: "Endgame", icon: MCICON_DIR + "ender_pearl" }
];
const TIER_BLOCKS = [
  ["dirt"], ["coarse_dirt"], ["clay"],
  ["oak_log"], ["spruce_log"], ["birch_log"], ["jungle_log"], ["acacia_log"],
  ["cobblestone"], ["stone"], ["andesite"], ["diorite"], ["granite"],
  ["coal_ore", "copper_ore"], ["iron_ore"], ["gold_ore"], ["lapis_ore"], ["redstone_ore"],
  ["deepslate_iron_ore"], ["deepslate_gold_ore"], ["diamond_ore"], ["emerald_ore"],
  ["nether_gold_ore"], ["quartz_ore"],
  ["stone_bricks"], ["quartz_block"], ["purpur_block"], ["crying_obsidian"],
  ["ancient_debris"], ["obsidian"]
];
const MILESTONES = TIER_BLOCKS.map((ids, i) => ({
  unlock: i === 0 ? 0 : Math.round(10000 * Math.pow(i / (TIER_BLOCKS.length - 1), 1.6) / 10) * 10,
  ids: ids.map(id => "minecraft:" + id),
  reward: Math.round(1 + i * 11 / (TIER_BLOCKS.length - 1))
}));
const CATALOG = [
  ["dirt", 2, 16, "Building Blocks", 0, true, "textures/blocks/dirt"],
  ["coarse_dirt", 2, 16, "Building Blocks", 0, true, "textures/blocks/coarse_dirt"],
  ["sand", 2, 16, "Building Blocks", 0, true, "textures/blocks/sand"],
  ["gravel", 2, 16, "Building Blocks", 0, true, "textures/blocks/gravel"],
  ["oak_log", 3, 8, "Building Blocks", 0, true, "textures/blocks/log_oak"],
  ["oak_planks", 2, 16, "Building Blocks", 0, true, "textures/blocks/planks_oak"],
  ["stick", 2, 16, "Tools & Gear", 0, false, "textures/items/stick"],
  ["crafting_table", 5, 1, "Building Blocks", 0, true, "textures/blocks/crafting_table_front"],
  ["torch", 2, 16, "Building Blocks", 0, true, "textures/blocks/torch_on"],
  ["bread", 4, 4, "Food", 0, false, "textures/items/bread"],
  ["wheat_seeds", 2, 16, "Farming", 0, false, "textures/items/seeds_wheat"],
  ["oak_sapling", 4, 4, "Farming", 0, true, "textures/blocks/sapling_oak"],
  ["chest", 8, 1, "Building Blocks", 0, true, "textures/blocks/chest_front"],
  ["furnace", 10, 1, "Building Blocks", 0, true, "textures/blocks/furnace_front_off"],
  ["wooden_pickaxe", 8, 1, "Tools & Gear", 0, false, "textures/items/wood_pickaxe"],
  ["wooden_axe", 8, 1, "Tools & Gear", 0, false, "textures/items/wood_axe"],
  ["wooden_shovel", 5, 1, "Tools & Gear", 0, false, "textures/items/wood_shovel"],
  ["wooden_sword", 6, 1, "Combat", 0, false, "textures/items/wood_sword"],
  ["cobblestone", 3, 16, "Building Blocks", 1, true, "textures/blocks/cobblestone"],
  ["stone", 5, 16, "Building Blocks", 1, true, "textures/blocks/stone"],
  ["glass", 6, 16, "Building Blocks", 1, true, "textures/blocks/glass"],
  ["bricks", 12, 8, "Building Blocks", 1, true, "textures/blocks/brick"],
  ["oak_door", 6, 4, "Building Blocks", 1, true, "textures/items/door_wood"],
  ["oak_fence", 5, 8, "Building Blocks", 1, true, "textures/blocks/planks_oak"],
  ["ladder", 4, 8, "Building Blocks", 1, true, "textures/blocks/ladder"],
  ["stone_pickaxe", 16, 1, "Tools & Gear", 1, false, "textures/items/stone_pickaxe"],
  ["stone_axe", 15, 1, "Tools & Gear", 1, false, "textures/items/stone_axe"],
  ["stone_sword", 14, 1, "Combat", 1, false, "textures/items/stone_sword"],
  ["stone_shovel", 10, 1, "Tools & Gear", 1, false, "textures/items/stone_shovel"],
  ["carrot", 3, 8, "Farming", 1, false, "textures/items/carrot"],
  ["potato", 3, 8, "Farming", 1, false, "textures/items/potato"],
  ["wheat", 4, 8, "Farming", 1, false, "textures/items/wheat"],
  ["composter", 8, 1, "Farming", 1, true, "textures/blocks/composter_side"],
  ["bucket", 18, 1, "Farming", 1, false, "textures/items/bucket_empty"],
  ["iron_ingot", 20, 2, "Ores & Minerals", 2, false, "textures/items/iron_ingot"],
  ["coal", 8, 8, "Ores & Minerals", 2, false, "textures/items/coal"],
  ["coal_ore", 12, 4, "Ores & Minerals", 2, true, "textures/blocks/coal_ore"],
  ["iron_ore", 22, 4, "Ores & Minerals", 2, true, "textures/blocks/iron_ore"],
  ["stone_bricks", 10, 16, "Building Blocks", 2, true, "textures/blocks/stonebrick"],
  ["lantern", 12, 4, "Building Blocks", 2, true, "textures/items/lantern"],
  ["iron_pickaxe", 45, 1, "Tools & Gear", 2, false, "textures/items/iron_pickaxe"],
  ["iron_axe", 40, 1, "Tools & Gear", 2, false, "textures/items/iron_axe"],
  ["iron_sword", 38, 1, "Combat", 2, false, "textures/items/iron_sword"],
  ["iron_shovel", 24, 1, "Tools & Gear", 2, false, "textures/items/iron_shovel"],
  ["shield", 35, 1, "Combat", 2, false, ""],
  ["bow", 30, 1, "Combat", 2, false, "textures/items/bow_standby"],
  ["arrow", 3, 16, "Combat", 2, false, "textures/items/arrow"],
  ["pumpkin_seeds", 4, 8, "Farming", 2, false, "textures/items/seeds_pumpkin"],
  ["melon_seeds", 4, 8, "Farming", 2, false, "textures/items/seeds_melon"],
  ["hay_block", 10, 4, "Farming", 2, true, "textures/blocks/hay_block_side"],
  ["redstone", 14, 8, "Redstone", 3, false, "textures/items/redstone_dust"],
  ["redstone_torch", 12, 8, "Redstone", 3, true, "textures/blocks/redstone_torch_on"],
  ["lever", 8, 4, "Redstone", 3, true, "textures/items/lever"],
  ["piston", 25, 2, "Redstone", 3, true, "textures/blocks/piston_top_normal"],
  ["dispenser", 18, 1, "Redstone", 3, true, "textures/blocks/dispenser_front_horizontal"],
  ["hopper", 30, 1, "Redstone", 3, true, "textures/items/hopper"],
  ["iron_block", 90, 2, "Ores & Minerals", 3, true, "textures/blocks/iron_block"],
  ["gold_ingot", 35, 2, "Ores & Minerals", 3, false, "textures/items/gold_ingot"],
  ["gold_ore", 38, 4, "Ores & Minerals", 3, true, "textures/blocks/gold_ore"],
  ["anvil", 70, 1, "Tools & Gear", 3, true, "textures/blocks/anvil_base"],
  ["fishing_rod", 25, 1, "Tools & Gear", 3, false, "textures/items/fishing_rod_uncast"],
  ["shears", 28, 1, "Tools & Gear", 3, false, "textures/items/shears"],
  ["apple", 5, 8, "Food", 3, false, "textures/items/apple"],
  ["cooked_beef", 8, 8, "Food", 3, false, "textures/items/beef_cooked"],
  ["bone", 8, 8, "Mob Drops", 3, false, "textures/items/bone"],
  ["string", 8, 8, "Mob Drops", 3, false, "textures/items/string"],
  ["rotten_flesh", 3, 8, "Mob Drops", 3, false, "textures/items/rotten_flesh"],
  ["golden_apple", 80, 1, "Food", 4, false, "textures/items/apple_golden"],
  ["diamond", 60, 2, "Ores & Minerals", 4, false, "textures/items/diamond"],
  ["diamond_ore", 90, 4, "Ores & Minerals", 4, true, "textures/blocks/diamond_ore"],
  ["emerald", 65, 2, "Ores & Minerals", 4, false, "textures/items/emerald"],
  ["emerald_ore", 95, 4, "Ores & Minerals", 4, true, "textures/blocks/emerald_ore"],
  ["lapis_lazuli", 18, 8, "Ores & Minerals", 4, false, "textures/items/dye_powder_blue"],
  ["enchanting_table", 120, 1, "Tools & Gear", 4, true, "textures/blocks/enchanting_table_side"],
  ["diamond_pickaxe", 140, 1, "Tools & Gear", 4, false, "textures/items/diamond_pickaxe"],
  ["diamond_sword", 120, 1, "Combat", 4, false, "textures/items/diamond_sword"],
  ["diamond_axe", 130, 1, "Tools & Gear", 4, false, "textures/items/diamond_axe"],
  ["experience_bottle", 25, 4, "Tools & Gear", 4, false, "textures/items/experience_bottle"],
  ["ender_pearl", 35, 2, "Endgame", 5, false, "textures/items/ender_pearl"],
  ["blaze_rod", 40, 2, "Nether", 5, false, "textures/items/blaze_rod"],
  ["blaze_powder", 24, 4, "Nether", 5, false, "textures/items/blaze_powder"],
  ["netherrack", 12, 16, "Nether", 5, true, "textures/blocks/netherrack"],
  ["soul_sand", 15, 8, "Nether", 5, true, "textures/blocks/soul_sand"],
  ["nether_brick", 18, 8, "Nether", 5, true, "textures/blocks/nether_brick"],
  ["magma_block", 20, 8, "Nether", 5, true, "textures/blocks/magma"],
  ["obsidian", 30, 4, "Nether", 6, true, "textures/blocks/obsidian"],
  ["crying_obsidian", 45, 4, "Nether", 6, true, "textures/blocks/crying_obsidian"],
  ["ghast_tear", 55, 1, "Mob Drops", 6, false, "textures/items/ghast_tear"],
  ["nether_wart", 18, 8, "Farming", 6, false, "textures/items/nether_wart"],
  ["quartz", 24, 8, "Nether", 6, false, "textures/items/quartz"],
  ["quartz_block", 28, 8, "Nether", 6, true, "textures/blocks/quartz_block_side"],
  ["ender_eye", 65, 2, "Endgame", 7, false, "textures/items/ender_eye"],
  ["end_stone", 25, 16, "Endgame", 7, true, "textures/blocks/end_stone"],
  ["purpur_block", 32, 8, "Endgame", 7, true, "textures/blocks/purpur_block"],
  ["chorus_fruit", 20, 4, "Endgame", 7, false, "textures/items/chorus_fruit"],
  ["shulker_shell", 75, 1, "Endgame", 7, false, "textures/items/shulker_shell"],
  ["elytra", 800, 1, "Endgame", 8, false, "textures/items/elytra"],
  ["shulker_box", 150, 1, "Endgame", 8, true, "textures/blocks/shulker_top_undyed"],
  ["nether_star", 600, 1, "Endgame", 8, false, "textures/items/nether_star"],
  ["beacon", 750, 1, "Endgame", 8, true, "textures/blocks/beacon"],
  ["ancient_debris", 250, 2, "Nether", 8, true, "textures/blocks/ancient_debris_side"],
  ["netherite_ingot", 500, 1, "Ores & Minerals", 9, false, "textures/items/netherite_ingot"],
  ["netherite_block", 1200, 1, "Endgame", 9, true, "textures/blocks/netherite_block"],
  ["totem_of_undying", 900, 1, "Combat", 9, false, "textures/items/totem"],
  ["enchanted_golden_apple", 500, 1, "Food", 9, false, "textures/items/apple_golden"],
  ["spruce_log", 3, 8, "Building Blocks", 0, true, "textures/blocks/log_spruce"],
  ["birch_log", 3, 8, "Building Blocks", 0, true, "textures/blocks/log_birch"],
  ["jungle_log", 3, 8, "Building Blocks", 0, true, "textures/blocks/log_jungle"],
  ["acacia_log", 3, 8, "Building Blocks", 0, true, "textures/blocks/log_acacia"],
  ["dark_oak_log", 3, 8, "Building Blocks", 0, true, "textures/blocks/log_big_oak"],
  ["mangrove_log", 4, 8, "Building Blocks", 1, true, "textures/blocks/mangrove_log_side"],
  ["cherry_log", 4, 8, "Building Blocks", 1, true, "textures/blocks/cherry_log_top"],
  ["spruce_planks", 2, 16, "Building Blocks", 0, true, "textures/blocks/planks_spruce"],
  ["birch_planks", 2, 16, "Building Blocks", 0, true, "textures/blocks/planks_birch"],
  ["dark_oak_planks", 2, 16, "Building Blocks", 1, true, "textures/blocks/planks_big_oak"],
  ["sandstone", 4, 16, "Building Blocks", 1, true, "textures/blocks/sandstone_normal"],
  ["red_sandstone", 5, 16, "Building Blocks", 2, true, "textures/blocks/red_sandstone_normal"],
  ["moss_block", 8, 8, "Building Blocks", 2, true, "textures/blocks/moss_block"],
  ["mossy_cobblestone", 7, 16, "Building Blocks", 2, true, "textures/blocks/cobblestone_mossy"],
  ["granite", 4, 16, "Building Blocks", 1, true, "textures/blocks/stone_granite"],
  ["diorite", 4, 16, "Building Blocks", 1, true, "textures/blocks/stone_diorite"],
  ["andesite", 4, 16, "Building Blocks", 1, true, "textures/blocks/stone_andesite"],
  ["deepslate", 8, 16, "Building Blocks", 3, true, "textures/blocks/deepslate/deepslate"],
  ["calcite", 7, 16, "Building Blocks", 3, true, "textures/blocks/calcite"],
  ["tuff", 6, 16, "Building Blocks", 3, true, "textures/blocks/tuff"],
  ["terracotta", 8, 16, "Building Blocks", 3, true, "textures/blocks/hardened_clay"],
  ["white_wool", 6, 16, "Building Blocks", 1, true, "textures/blocks/wool_colored_white"],
  ["blue_wool", 7, 16, "Building Blocks", 2, true, "textures/blocks/wool_colored_blue"],
  ["packed_ice", 12, 8, "Building Blocks", 4, true, "textures/blocks/ice_packed"],
  ["snow_block", 5, 8, "Building Blocks", 2, true, "textures/blocks/snow"],
  ["brick_block", 12, 8, "Building Blocks", 2, true, "textures/blocks/brick"],
  ["stone_hoe", 12, 1, "Tools & Gear", 1, false, "textures/items/stone_hoe"],
  ["iron_hoe", 28, 1, "Tools & Gear", 2, false, "textures/items/iron_hoe"],
  ["diamond_hoe", 95, 1, "Tools & Gear", 4, false, "textures/items/diamond_hoe"],
  ["golden_pickaxe", 22, 1, "Tools & Gear", 3, false, "textures/items/gold_pickaxe"],
  ["golden_axe", 20, 1, "Tools & Gear", 3, false, "textures/items/gold_axe"],
  ["golden_sword", 18, 1, "Combat", 3, false, "textures/items/gold_sword"],
  ["crossbow", 48, 1, "Combat", 4, false, "textures/items/crossbow_standby"],
  ["trident", 280, 1, "Combat", 7, false, "textures/items/trident"],
  ["beetroot", 3, 8, "Farming", 1, false, "textures/items/beetroot"],
  ["beetroot_seeds", 3, 8, "Farming", 1, false, "textures/items/seeds_beetroot"],
  ["melon_slice", 3, 8, "Food", 1, false, "textures/items/melon"],
  ["pumpkin", 4, 4, "Farming", 1, true, "textures/blocks/pumpkin_side"],
  ["sugar_cane", 3, 8, "Farming", 1, true, "textures/items/reeds"],
  ["bamboo", 4, 8, "Farming", 1, true, "textures/blocks/bamboo_stem"],
  ["cocoa_beans", 4, 8, "Farming", 2, false, "textures/items/dye_powder_brown"],
  ["sweet_berries", 5, 8, "Farming", 2, false, "textures/items/sweet_berries"],
  ["cooked_chicken", 7, 8, "Food", 2, false, "textures/items/chicken_cooked"],
  ["cooked_porkchop", 8, 8, "Food", 2, false, "textures/items/porkchop_cooked"],
  ["cooked_mutton", 8, 8, "Food", 3, false, "textures/items/mutton_cooked"],
  ["baked_potato", 5, 8, "Food", 2, false, "textures/items/potato_baked"],
  ["golden_carrot", 18, 4, "Food", 4, false, "textures/items/carrot_golden"],
  ["pumpkin_pie", 10, 4, "Food", 3, false, "textures/items/pumpkin_pie"],
  ["cookie", 4, 8, "Food", 1, false, "textures/items/cookie"],
  ["cake", 20, 1, "Food", 3, false, "textures/items/cake"],
  ["redstone_block", 60, 2, "Redstone", 4, true, "textures/blocks/redstone_block"],
  ["repeater", 18, 4, "Redstone", 3, true, "textures/items/repeater"],
  ["comparator", 24, 2, "Redstone", 4, true, "textures/items/comparator"],
  ["observer", 28, 2, "Redstone", 4, true, "textures/blocks/observer_front"],
  ["dropper", 18, 2, "Redstone", 3, true, "textures/blocks/dropper_front_horizontal"],
  ["sticky_piston", 32, 2, "Redstone", 4, true, "textures/blocks/piston_top_sticky"],
  ["daylight_detector", 26, 1, "Redstone", 4, true, "textures/blocks/daylight_detector_top"],
  ["target", 22, 2, "Redstone", 4, true, "textures/blocks/target_side"],
  ["tripwire_hook", 8, 4, "Redstone", 3, false, "textures/blocks/trip_wire_source"],
  ["spider_eye", 8, 8, "Mob Drops", 3, false, "textures/items/spider_eye"],
  ["gunpowder", 10, 8, "Mob Drops", 3, false, "textures/items/gunpowder"],
  ["slime_ball", 18, 4, "Mob Drops", 4, false, "textures/items/slimeball"],
  ["leather", 8, 8, "Mob Drops", 3, false, "textures/items/leather"],
  ["feather", 5, 8, "Mob Drops", 2, false, "textures/items/feather"],
  ["ink_sac", 7, 8, "Mob Drops", 3, false, "textures/items/dye_powder_black"],
  ["prismarine_shard", 18, 4, "Mob Drops", 5, false, "textures/items/prismarine_shard"],
  ["prismarine_crystals", 20, 4, "Mob Drops", 5, false, "textures/items/prismarine_crystals"],
  ["rabbit_hide", 6, 8, "Mob Drops", 3, false, "textures/items/rabbit_hide"],
  ["nautilus_shell", 45, 1, "Mob Drops", 6, false, "textures/items/nautilus"],

  ["basalt", 10, 16, "Nether", 5, true, "textures/blocks/basalt_side"],
  ["blackstone", 10, 16, "Nether", 5, true, "textures/blocks/blackstone"],
  ["polished_blackstone", 12, 16, "Nether", 6, true, "textures/blocks/polished_blackstone"],
  ["crimson_stem", 8, 8, "Nether", 5, true, "textures/blocks/huge_fungus/crimson_log_top"],
  ["warped_stem", 8, 8, "Nether", 5, true, "textures/blocks/huge_fungus/warped_stem_top"],

  ["glowstone_dust", 15, 8, "Nether", 5, false, "textures/items/glowstone_dust"],
  ["soul_torch", 5, 8, "Nether", 5, true, "textures/blocks/soul_torch"],

  ["ender_chest", 120, 1, "Endgame", 6, true, "textures/blocks/ender_chest_front"],

  ["end_crystal", 120, 1, "Endgame", 8, false, "textures/items/end_crystal"],
  ["dragon_breath", 90, 1, "Endgame", 8, false, "textures/items/dragons_breath"],
  ["conduit", 350, 1, "Endgame", 8, true, "textures/blocks/conduit_base"],

  ["heart_of_the_sea", 160, 1, "Endgame", 7, false, "textures/items/heartofthesea_closed"]
].map(([raw, price, amount, category, tier, block, icon]) => ({
  id: "minecraft:" + raw, raw, price, amount, category, tier, block, icon,
  name: raw.split("_").map(s => s[0].toUpperCase() + s.slice(1)).join(" ")
}));

const OLD_TIER_TO_NEW = [0, 2, 4, 7, 12, 18, 21, 24, 26, 28];
const TIER_FIX = {
  oak_log: 1, oak_planks: 1, spruce_log: 1, birch_log: 1, jungle_log: 1, acacia_log: 1, dark_oak_log: 1,
  spruce_planks: 1, birch_planks: 1, stick: 1, crafting_table: 1, chest: 1,
  wooden_pickaxe: 1, wooden_axe: 1, wooden_shovel: 1, wooden_sword: 1,
  furnace: 2, torch: 3, coal: 3, coal_ore: 3,
  gold_ore: 5, gold_ingot: 5, golden_pickaxe: 5, golden_axe: 5, golden_sword: 5,
  lapis_lazuli: 8, crying_obsidian: 27, ancient_debris: 28, obsidian: 29
};
for (const item of CATALOG) {
  let t = OLD_TIER_TO_NEW[item.tier] ?? 0;
  if (item.category === "Redstone" && item.tier === 3) t = 9;
  item.tier = TIER_FIX[item.raw] ?? t;
}
function makeEntry(raw, price, amount, category, tier, block, icon) {
  return {
    id: "minecraft:" + raw, raw, price, amount, category, tier, block, icon,
    name: raw.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
  };
}
CATALOG.push(
  makeEntry("copper_ore", 14, 4, "Ores & Minerals", 3, true, "textures/blocks/copper_ore"),
  makeEntry("copper_ingot", 12, 4, "Ores & Minerals", 3, false, "textures/items/copper_ingot")
);
const SPAWN_EGGS = [
  ["chicken", 50, 9], ["pig", 60, 9], ["cow", 60, 10], ["sheep", 60, 10], ["rabbit", 70, 10],
  ["cat", 90, 11], ["wolf", 110, 11], ["horse", 130, 12], ["donkey", 130, 12], ["llama", 140, 12],
  ["fox", 120, 13], ["bee", 100, 13], ["zombie", 120, 13], ["skeleton", 150, 13],
  ["mooshroom", 160, 14], ["goat", 130, 14], ["frog", 120, 14], ["spider", 130, 14],
  ["turtle", 150, 15], ["axolotl", 150, 15], ["creeper", 200, 15],
  ["slime", 180, 16], ["panda", 220, 16], ["witch", 260, 17], ["camel", 240, 17],
  ["enderman", 320, 19], ["blaze", 350, 20], ["magma_cube", 260, 20]
];
for (const [mob, price, tier] of SPAWN_EGGS) {
  CATALOG.push(makeEntry(mob + "_spawn_egg", price, 1, "Spawn Eggs", tier, false, "textures/items/spawn_eggs/spawn_egg_" + mob));
}
const BASE_PRICE_FIX = { iron_block: 100, hay_block: 20, redstone_block: 70, netherite_block: 4500 };
const SELL_FIX = { netherite_block: 100, ancient_debris: 40, obsidian: 10 };
const priceMult = tier => (tier <= 5 ? 1 : 1 + (tier - 5) * 0.2);
for (const item of CATALOG) {
  const base = BASE_PRICE_FIX[item.raw] ?? item.price;
  item.sell = item.category === "Spawn Eggs" ? 0 : (SELL_FIX[item.raw] ?? Math.max(1, Math.floor(base / 2)));
  item.price = Math.max(1, Math.round(base * priceMult(item.tier)));
  item.icon = MCICON_DIR + item.raw;
}
const BUILDING_IDS = new Set(CATALOG.filter(i => i.category === "Building Blocks").map(i => i.id));
const LEDGER_PENDING = "obm_ledger_pending";
const DEBUG_TAG = "obm_debug";
const STATUS_EVENT = "allenscreations:obm_status";
const logLast = new Map();
function log(level, message, key) {
  if (key !== undefined) {
    if (logLast.get(key) === message) return;
    logLast.set(key, message);
  }
  const line = "[OBM][" + level + "] " + message;
  console.warn(line);
  try {
    for (const p of world.getAllPlayers()) if (p.hasTag(DEBUG_TAG)) p.sendMessage("§f" + line);
  } catch {}
}
function logError(context, error) {
  const stack = error && error.stack ? " | " + String(error.stack).split("\n")[0] : "";
  log("ERROR", context + ": " + error + stack, "err:" + context);
}
function statusReport() {
  try {
    const players = world.getAllPlayers();
    let core = "unknown", bedrock = "unknown";
    try {
      const dimension = world.getDimension("overworld");
      core = dimension.getBlock(CORE)?.typeId ?? "unloaded";
      bedrock = dimension.getBlock(BEDROCK)?.typeId ?? "unloaded";
    } catch (e) { core = "error: " + e; }
    return "players=" + players.length + " void_cleaned=" + players.filter(p => p.hasTag("void_cleaned")).length +
      " core=" + core + " bedrock=" + bedrock + " pool=" + currentPool().length + " shared_breaks=" + totalBreaks();
  } catch (e) { return "status failed: " + e; }
}
const objectiveCache = new Map();
function objective(name) {
  let obj = objectiveCache.get(name);
  if (!obj) {
    obj = world.scoreboard.getObjective(name) ?? world.scoreboard.addObjective(name, name === BOARD ? "Coins" : name);
    objectiveCache.set(name, obj);
  }
  return obj;
}
function readScore(name, identity) {
  try { return objective(name).getScore(identity) ?? 0; } catch { return 0; }
}
function writeScore(name, identity, value) {
  try {
    objective(name).setScore(identity, Math.max(0, Math.floor(value)));
    if (name === COINS) updateBoard(identity, value);
    return true;
  } catch { return false; }
}
function balance(player) { return readScore(COINS, player); }
function personalBreaks(player) { return readScore(MINED, player); }
function totalBreaks() { return readScore(TOTAL, GLOBAL_KEY); }
function setBalance(player, amount) { return writeScore(COINS, player, amount); }
function inventoryOf(player) { return player.getComponent("minecraft:inventory")?.container; }
function itemAvailable(item) {
  try { return !!ItemTypes.get(item.id); } catch { return false; }
}
function tell(player, message) { try { player.onScreenDisplay.setActionBar("§6[Market] §r" + message); } catch {} }

function showBalance(player) {
  try { player.onScreenDisplay.setActionBar("§6Coins: §e" + balance(player) + " §f| §fBlocks: §f" + personalBreaks(player)); } catch {}
}
function hasLedger(player) {
  const inv = inventoryOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === LEDGER) return true;
  return false;
}
function grantLedger(player) {
  if (hasLedger(player)) return true;
  const inv = inventoryOf(player);
  if (!inv || inv.emptySlotsCount < 1) {
    try { player.addTag(LEDGER_PENDING); } catch {}
    tell(player, "Free one inventory slot to receive your Natural Market Ledger.");
    return false;
  }
  try {
    inv.addItem(new ItemStack(LEDGER, 1));
    tell(player, "Your Natural Market Ledger is ready. Use it to open the market.");
    return true;
  } catch { return false; }
}
function restoreLedger(player) {
  if (hasLedger(player)) { try { player.removeTag(LEDGER_PENDING); } catch {} return; }
  const inv = inventoryOf(player);
  if (!inv || inv.emptySlotsCount < 1) { try { player.addTag(LEDGER_PENDING); } catch {} return; }
  try {
    for (const e of player.dimension.getEntities({ type: "minecraft:item", location: player.location, maxDistance: 24 })) {
      try { if (e.getComponent("minecraft:item")?.itemStack?.typeId === LEDGER) e.kill(); } catch {}
    }
  } catch {}
  try {
    inv.addItem(new ItemStack(LEDGER, 1));
    player.removeTag(LEDGER_PENDING);
    tell(player, "The Ledger returned to your inventory.");
  } catch (e) { logError("restoreLedger", e); }
}
function hasScore(name, player) {
  try { return objective(name).getScore(player) !== undefined; } catch { return false; }
}
function initializePlayer(player) {
  if (!hasScore(COINS, player)) writeScore(COINS, player, 50);
  if (!hasScore(MINED, player)) writeScore(MINED, player, 0);
  updateBoard(player, balance(player));
  showBalance(player);
  grantLedger(player);
}
function unlockedTier(player) {
  let tier = 0;
  const breaks = personalBreaks(player);
  for (let i = 0; i < MILESTONES.length; i++) if (breaks >= MILESTONES[i].unlock) tier = i;
  return tier;
}
function showForm(form, player, retries = 0) {
  return form.show(player).then(result => {
    if (result.canceled && result.cancelationReason === "UserBusy" && retries < 20) {
      return new Promise(resolve => system.runTimeout(() => resolve(showForm(form, player, retries + 1)), 10));
    }
    return result;
  });
}
function currentPool() {
  const pool = new Set(MILESTONES.filter(m => totalBreaks() >= m.unlock).flatMap(m => m.ids));
  for (const id of storedPool()) pool.add(id);
  return [...pool];
}
function storedPool() {
  try {
    const raw = world.getDynamicProperty(POOL_KEY);
    if (typeof raw !== "string") return [];
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    return list
      .filter(id => typeof id === "string")
      .map(id => id.includes(":") ? id : "minecraft:" + id)
      .filter(id => !UNSAFE_CORE.has(id) && !BUILDING_IDS.has(id));
  } catch { return []; }
}
function addBlockToPool(item) {
  if (!item.block || item.category === "Building Blocks" || UNSAFE_CORE.has(item.id)) return;
  const stored = storedPool();
  if (stored.includes(item.id)) return;
  stored.push(item.id);
  try { world.setDynamicProperty(POOL_KEY, JSON.stringify(stored.map(id => id.replace("minecraft:", "")))); } catch {}
}
function coreBlock() {
  const pool = currentPool();
  return pool[Math.floor(Math.random() * pool.length)] ?? "minecraft:dirt";
}
function placeCore(block) {
  for (let i = 0; i < 5; i++) {
    try { const id = coreBlock(); block.setType(id); log("INFO", "Core placed: " + id); return; } catch (e) { logError("placeCore", e); }
  }
  try { block.setType("minecraft:dirt"); log("WARN", "Core placed with the Dirt fallback."); } catch (e) { logError("placeCore fallback", e); }
}
function ensureCore() {
  const players = world.getAllPlayers();
  if (!players.some(p => p.hasTag("void_cleaned"))) {
    log("WARN", "Core check skipped: no online player has the void_cleaned tag yet (the void_cleaner / tick function may not be running).", "core_wait");
    return;
  }
  try {
    const dimension = world.getDimension("overworld");
    const below = dimension.getBlock(BEDROCK);
    if (below && below.typeId === "minecraft:bedrock") below.setType("minecraft:air");
    const core = dimension.getBlock(CORE);
    if (!core) log("WARN", "Core location 0 64 0 is not loaded.", "core_unloaded");
    if (core && (core.typeId === "minecraft:air" || core.typeId === "minecraft:grass_block")) {
      log("INFO", "Core was " + core.typeId + "; placing a new core.");
      placeCore(core);
    }
  } catch (e) { logError("ensureCore", e); }
}
const HIDE_PREFIX = "obm_hide_";
function nameHidden(player) { return world.getDynamicProperty(HIDE_PREFIX + player.name) === true; }
function boardLabel(player, hidden) {
  if (!hidden) return player.name;
  let h = 0;
  for (const ch of player.name) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return "Hidden " + (h + 1000);
}
function updateBoard(player, value) {
  try { objective(BOARD).setScore(boardLabel(player, nameHidden(player)), Math.max(0, Math.floor(value))); } catch {}
}
function setNameHidden(player, hidden) {
  try {
    const board = objective(BOARD);
    board.removeParticipant(boardLabel(player, !hidden));
    world.setDynamicProperty(HIDE_PREFIX + player.name, hidden);
    board.setScore(boardLabel(player, hidden), balance(player));
    return true;
  } catch (e) {
    logError("setNameHidden", e);
    return false;
  }
}
function showBoard() {
  try {
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: objective(BOARD), sortOrder: ObjectiveSortOrder.Descending });
  } catch (e) { logError("showBoard", e); }
}
function showAbout(player) {
  let form = new ModalFormData().title("ABOUT - NATURAL MARKET");
  form = addOptional(form, "header", "OneBlock Natural Market");
  form = addOptional(form, "label",
    "by ALNStudios\n\n" +
    "Start in the void on a single regenerating block.\n" +
    "Break the core to earn Coins and grow your block pool.\n" +
    "Use the Natural Market Ledger to buy supplies.\n\n" +
    "The Ledger cannot be dropped. It always returns to you.\n\n" +
    "Version: v16 | ALNStudios | CurseForge / MCPEDL");
  form = addOptional(form, "divider");
  form = form.toggle("Hide my name on the Coins scoreboard", { defaultValue: nameHidden(player) });
  form = form.submitButton("Save");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    const values = (r.formValues ?? []).filter(v => typeof v === "boolean");
    if (values.length !== 1) return tell(player, "The setting could not be read.");
    if (values[0] === nameHidden(player)) return;
    if (setNameHidden(player, values[0])) tell(player, values[0] ? "Your name is hidden on the scoreboard." : "Your name is shown on the scoreboard.");
    else tell(player, "The scoreboard setting could not be saved.");
  }).catch(e => { logError("showAbout", e); });
}
function marketMain(player) {
  const form = new ActionFormData()
    .title("NATURAL MARKET")
    .body("§6Coins: §e" + balance(player) + "§r\nPersonal breaks: " + personalBreaks(player) +
      "\nShared breaks: " + totalBreaks() + "\nUnlocked tier: " + (unlockedTier(player) + 1) + " / " + MILESTONES.length + "\n\nChoose a market section.");
  for (const c of CATEGORIES) form.button(c.name, c.icon);
  form
    .button("Sell Items", MCICON_DIR + "gold_ingot")
    .button("About", "textures/ui/icon_recipe_nature");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection < CATEGORIES.length) return showCategory(player, CATEGORIES[r.selection].name);
    if (r.selection === CATEGORIES.length) return showSellMenu(player);
    if (r.selection === CATEGORIES.length + 1) return showAbout(player);
  }).catch(e => { logError("marketMain", e); tell(player, "The market menu could not open. Try using the Ledger again."); });
}

function showCategory(player, category, page = 0) {
  const tier = unlockedTier(player);
  const items = CATALOG.filter(item => item.category === category && item.tier <= tier && itemAvailable(item));
  const locked = CATALOG.filter(item => item.category === category && item.tier > tier);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  const visible = items.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const form = new ActionFormData().title(category.toUpperCase())
    .body("§6Coins: §e" + balance(player) + "§r  |  Page " + (safePage + 1) + "/" + pageCount +
      "\nTap a supply slot to buy the listed bundle." +
      (locked.length ? "\nMore supplies unlock as you mine the core." : ""));
  for (const item of visible) {
    form.button(item.name + "\n§e" + item.amount + "x - " + (item.price * item.amount) + " Coins", item.icon || undefined);
  }
  if (safePage + 1 < pageCount) form.button("Next Page", "textures/ui/arrow_right");
  form.button("Back to Market", "textures/ui/arrow_left");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection < visible.length) return purchase(player, visible[r.selection]);
    const nextIndex = visible.length;
    if (safePage + 1 < pageCount && r.selection === nextIndex) return showCategory(player, category, safePage + 1);
    return marketMain(player);
  }).catch(e => { logError("showCategory", e); tell(player, "This category could not open."); });
}
function purchase(player, item) {
  if (item.tier > unlockedTier(player)) return tell(player, "Mine more central blocks to unlock this supply.");
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const funds = balance(player);
  const totalPrice = item.price * item.amount;
  if (funds < totalPrice) return tell(player, "Not enough Coins. You need " + totalPrice + " Coins.");
  let stack;
  try { stack = new ItemStack(item.id, item.amount); } catch { return tell(player, "This item is not available in the current game version."); }
  if (!setBalance(player, funds - totalPrice)) return tell(player, "Your balance could not be updated; no purchase was made.");
  let leftover;
  try { leftover = inv.addItem(stack); } catch { leftover = stack; }
  const delivered = item.amount - (leftover?.amount ?? 0);
  const charged = delivered * item.price;
  if (charged < totalPrice) setBalance(player, balance(player) + totalPrice - charged);
  if (delivered <= 0) return tell(player, "Inventory full. No Coins were taken.");
  if (delivered < item.amount) tell(player, "Only " + delivered + " item(s) fit; charged " + charged + " Coins.");
  else tell(player, "Purchased " + delivered + " x " + item.name + " for " + charged + " Coins.");
  addBlockToPool(item);
  showBalance(player);
}
function scanSellable(inv, values) {
  const slots = [];
  let payout = 0, count = 0;
  for (let i = 0; i < inv.size; i++) {
    const stack = inv.getItem(i);
    if (!stack) continue;
    const unit = values.get(stack.typeId);
    if (!unit) continue;
    slots.push(i);
    payout += unit * stack.amount;
    count += stack.amount;
  }
  return { slots, payout, count };
}
const LOCK_PREFIX = "obm_locks_";
const DEFAULT_LOCKED = new Set(CATALOG
  .filter(item => (item.category === "Tools & Gear" || item.category === "Combat") &&
    /(pickaxe|_axe|_shovel|_hoe|_sword)$|^(shears|fishing_rod|bow|crossbow|trident|shield)$/.test(item.raw))
  .map(item => item.raw));
function lockOverrides(player) {
  try {
    const raw = world.getDynamicProperty(LOCK_PREFIX + player.name);
    const data = typeof raw === "string" ? JSON.parse(raw) : {};
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}
function isLocked(overrides, item) {
  return Object.prototype.hasOwnProperty.call(overrides, item.raw) ? overrides[item.raw] === 1 : DEFAULT_LOCKED.has(item.raw);
}
function setLocked(player, items, locked) {
  const data = lockOverrides(player);
  for (const item of items) {
    if (locked === DEFAULT_LOCKED.has(item.raw)) delete data[item.raw];
    else data[item.raw] = locked ? 1 : 0;
  }
  try {
    world.setDynamicProperty(LOCK_PREFIX + player.name, JSON.stringify(data));
    return true;
  } catch (e) {
    logError("setLocked", e);
    tell(player, "Your lock list could not be saved.");
    return false;
  }
}
const addOptional = (form, method, ...args) => (typeof form[method] === "function" ? form[method](...args) : form);
function showLockForm(player, owned) {
  const locks = lockOverrides(player);
  let form = new ModalFormData().title("LOCK ITEMS");
  form = addOptional(form, "header", "Locked Items");
  form = addOptional(form, "label", "Switch an item on to lock it. Locked items are never sold.");
  for (const [item, amount] of owned) {
    form = form.toggle(item.name + " - " + amount + "x - " + item.sell + " Coins each", { defaultValue: isLocked(locks, item) });
  }
  form = form.submitButton("Save");
  showForm(form, player).then(r => {
    if (r.canceled) return showSellMenu(player);
    const values = (r.formValues ?? []).filter(v => typeof v === "boolean");
    if (values.length !== owned.length) {
      tell(player, "The lock list could not be read.");
      return showSellMenu(player);
    }
    const toLock = [], toUnlock = [];
    owned.forEach(([item], i) => (values[i] ? toLock : toUnlock).push(item));
    setLocked(player, toLock, true);
    setLocked(player, toUnlock, false);
    return showSellMenu(player);
  }).catch(e => { logError("showLockForm", e); tell(player, "The lock list could not open."); });
}
function showSellMenu(player) {
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const itemById = new Map(CATALOG.map(item => [item.id, item]));
  const totals = new Map();
  for (let i = 0; i < inv.size; i++) {
    const stack = inv.getItem(i);
    const item = stack && itemById.get(stack.typeId);
    if (item) totals.set(item, (totals.get(item) ?? 0) + stack.amount);
  }
  const owned = [...totals].sort((a, b) => a[0].name.localeCompare(b[0].name));
  if (!owned.length) return tell(player, "You have no market items to sell.");
  const locks = lockOverrides(player);
  let payout = 0, sellCount = 0, lockedCount = 0;
  for (const [item, amount] of owned) {
    if (isLocked(locks, item)) lockedCount += amount;
    else { payout += item.sell * amount; sellCount += amount; }
  }
  const form = new ActionFormData().title("SELL ITEMS")
    .body("Will sell: " + sellCount + " item(s) for " + payout + " Coins\nLocked: " + lockedCount + " item(s)")
    .button("§lLock / Unlock Items§r", MCICON_DIR + "iron_door")
    .button("§lSell All§r\nLocked items are kept", MCICON_DIR + "gold_ingot")
    .button("§lExit§r", MCICON_DIR + "oak_door");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection === 0) return showLockForm(player, owned);
    if (r.selection === 1) return sellUnlocked(player);
  }).catch(e => { logError("showSellMenu", e); tell(player, "The sell menu could not open."); });
}
function sellUnlocked(player) {
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const locks = lockOverrides(player);
  const values = new Map(CATALOG.filter(item => !isLocked(locks, item)).map(item => [item.id, item.sell]));
  const { payout, count } = scanSellable(inv, values);
  if (!count) return tell(player, "You have no unlocked market items to sell.");
  const form = new MessageFormData().title("SELL UNLOCKED ITEMS")
    .body("Sell " + count + " unlocked item(s) for " + payout + " Coins? Locked items and items not listed in the market are kept.")
    .button1("Sell")
    .button2("Cancel");
  showForm(form, player).then(r => {
    if (r.canceled || r.selection !== 0) return;
    const again = scanSellable(inv, values);
    if (again.payout !== payout || again.count !== count) return tell(player, "Your inventory changed. Open the sell option again.");
    if (!setBalance(player, balance(player) + payout)) return tell(player, "Balance update failed; your items were kept.");
    for (const slot of again.slots) inv.setItem(slot, undefined);
    tell(player, "Sold " + count + " eligible item(s) for " + payout + " Coins.");
    showBalance(player);
  }).catch(e => { logError("sellEligible", e); tell(player, "The sell confirmation could not open."); });
}
const RING = [
  { x: 1, z: 0 }, { x: 1, z: 1 }, { x: 0, z: 1 }, { x: -1, z: 1 },
  { x: -1, z: 0 }, { x: -1, z: -1 }, { x: 0, z: -1 }, { x: 1, z: -1 }
];
const NOT_SOLID = new Set(["minecraft:air", "minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"]);
function tutorialStep(player, total) {
  if (total < 1 || total > RING.length) return;
  const spot = RING[total - 1];
  try {
    const block = world.getDimension("overworld").getBlock({ x: CORE.x + spot.x, y: CORE.y, z: CORE.z + spot.z });
    if (block && block.typeId === "minecraft:air") block.setType("minecraft:grass_block");
    log("INFO", "Tutorial " + total + "/" + RING.length + ": block placed at " + (CORE.x + spot.x) + " " + CORE.y + " " + (CORE.z + spot.z) + ".");
  } catch (e) { logError("tutorialStep", e); }
  tell(player, total < RING.length
    ? "§eTutorial " + total + "/" + RING.length + ": a block was added beside the core. Keep mining!"
    : "§aTutorial complete: your 3x3 platform is ready.");
}
function rescuePhased() {
  const dimension = world.getDimension("overworld");
  for (const player of world.getAllPlayers()) {
    try {
      if (player.dimension.id !== "minecraft:overworld" || !player.hasTag("void_cleaned")) continue;
      const p = player.location;
      if (p.y >= CORE.y + 0.95 || p.y + 1.75 <= CORE.y + 0.05) continue;
      let stuck = false;
      for (let x = Math.floor(p.x - 0.25); x <= Math.floor(p.x + 0.25) && !stuck; x++) {
        for (let z = Math.floor(p.z - 0.25); z <= Math.floor(p.z + 0.25) && !stuck; z++) {
          if (Math.abs(x - CORE.x) > 1 || Math.abs(z - CORE.z) > 1) continue;
          const block = dimension.getBlock({ x, y: CORE.y, z });
          if (block && !NOT_SOLID.has(block.typeId)) stuck = true;
        }
      }
      if (!stuck) continue;
      player.teleport({ x: CORE.x + 0.5, y: CORE.y + 1, z: CORE.z + 0.5 }, { keepVelocity: false });
      log("INFO", player.name + " was inside the core platform and was moved on top of the core.");
    } catch (e) { logError("rescuePhased", e); }
  }
}
let coreBreakPending = false;
function onCoreBreak(player) {
  const personal = personalBreaks(player) + 1;
  const total = totalBreaks() + 1;
  writeScore(MINED, player, personal);
  writeScore(TOTAL, GLOBAL_KEY, total);
  tutorialStep(player, total);
  const milestone = [...MILESTONES].reverse().find(m => total >= m.unlock) ?? MILESTONES[0];
  writeScore(COINS, player, balance(player) + milestone.reward);
  if (MILESTONES.some(m => m.unlock > 0 && m.unlock === total)) {
    world.sendMessage("§6[Natural Market] §rA new core milestone has been reached. More block types can now appear.");
  }
  log("INFO", player.name + " mined the core: personal=" + personal + " shared=" + total + " reward=" + milestone.reward + ".");
  tell(player, "Core mined: +" + milestone.reward + " Coins.");
  showBalance(player);
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id === STATUS_EVENT) {
    const msg = statusReport();
    console.warn("[OBM][STATUS] " + msg);
    try { event.sourceEntity?.sendMessage("§e[OBM] " + msg); } catch {}
    return;
  }
  if (event.id !== READY_EVENT) return;
  log("INFO", "Ready event received from the tick function.");
  try {
    if (totalBreaks() < RING.length) event.sourceEntity?.sendMessage("§6[Tutorial] §rBreak the block you are standing on. Each of the first " + RING.length + " breaks adds a block beside it until a 3x3 platform surrounds the core.");
  } catch {}
  system.run(() => ensureCore());
});
world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack?.typeId !== LEDGER) return;
  const player = event.source;
  if (player?.typeId === "minecraft:player") {
    log("INFO", "Ledger used by " + player.name + ".");
    system.run(() => marketMain(player));
  }
});
if (!world.afterEvents.itemThrow) log("WARN", "itemThrow event is not available in this API version; using the dropped-item scan for the Ledger instead.");
world.afterEvents.itemThrow?.subscribe(event => {
  if (event.itemStack?.typeId !== LEDGER) return;
  const player = event.source;
  if (!player || player.typeId !== "minecraft:player") return;
  system.runTimeout(() => {
    try {
      const dimension = player.dimension;
      const nearbyEntities = dimension.getEntities({
        location: player.location,
        maxDistance: 20,
        type: "minecraft:item"
      });
      for (const entity of nearbyEntities) {
        try {
          const itemComp = entity.getComponent("minecraft:item");
          if (itemComp?.itemStack?.typeId === LEDGER) {
            entity.kill();
            break;
          }
        } catch {}
      }
      if (!hasLedger(player)) {
        const inv = inventoryOf(player);
        if (inv) {
          inv.addItem(new ItemStack(LEDGER, 1));
          tell(player, "The Ledger returned to your inventory.");
        }
      }
    } catch (e) { logError("itemThrow ledger return", e); }
  }, 5);
});

world.afterEvents.playerBreakBlock.subscribe(event => {
  const location = event.block.location;
  const player = event.player;
  if (!player || event.block.dimension.id !== "minecraft:overworld") return;
  if (location.x !== CORE.x || location.y !== CORE.y || location.z !== CORE.z || coreBreakPending) return;
  log("INFO", "Core break detected by " + player.name + " (void_cleaned tag=" + player.hasTag("void_cleaned") + ").");
  coreBreakPending = true;
  system.runTimeout(() => {
    try {
      if (player.hasTag("void_cleaned")) {
        onCoreBreak(player);
        const block = world.getDimension("overworld").getBlock(CORE);
        if (block && block.typeId === "minecraft:air") placeCore(block);
      }
    } catch (e) { logError("core break", e); }
    coreBreakPending = false;
  }, 1);
});
world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(() => {
    log("INFO", "Player spawned: " + event.player.name + " (void_cleaned tag=" + event.player.hasTag("void_cleaned") + ").");
    initializePlayer(event.player);
    if (event.player.hasTag("void_cleaned")) ensureCore();
  }, 10);
});
world.afterEvents.playerLeave.subscribe(event => {
  objectiveCache.clear();
});
system.run(() => {
  objective(COINS);
  objective(BOARD);
  showBoard();
  objective(MINED);
  objective(TOTAL);
});
system.runInterval(() => {
  try { ensureCore(); } catch (e) { logError("ensureCore interval", e); }
  log("INFO", statusReport(), "status");
}, 40);
system.runInterval(rescuePhased, 5);
system.run(() => log("INFO", "Script started and handlers registered. Debug chat: /tag @s add obm_debug. Status: /scriptevent allenscreations:obm_status"));
system.runInterval(() => {
  try {
    const players = world.getAllPlayers();
    for (const p of players) if (p.hasTag(LEDGER_PENDING)) restoreLedger(p);
    for (const entity of world.getDimension("overworld").getEntities({ type: "minecraft:item" })) {
      try {
        if (entity.getComponent("minecraft:item")?.itemStack?.typeId !== LEDGER) continue;
        const owner = players.find(p => p.dimension.id === "minecraft:overworld" && !hasLedger(p) && Math.hypot(p.location.x - entity.location.x, p.location.y - entity.location.y, p.location.z - entity.location.z) < 24);
        if (owner) restoreLedger(owner);
      } catch {}
    }
  } catch (e) { logError("ledger return scan", e); }
}, 20);
