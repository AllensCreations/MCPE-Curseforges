import { world, system, ItemStack, ItemTypes } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

const CORE = { x: 0, y: 0, z: 0 };
const BEDROCK = { x: 0, y: -1, z: 0 };
const LEDGER = "allenscreations:trader_ledger";
const COINS = "obm_coins";
const MINED = "obm_mined";
const TOTAL = "obm_total";
const GLOBAL_KEY = "OneBlockNaturalMarket";
const POOL_KEY = "obm_purchased_blocks";
const READY_EVENT = "allenscreations:oneblock_ready";
const CATEGORIES = [
  { name: "Building Blocks", icon: "textures/blocks/stone" },
  { name: "Tools & Gear", icon: "textures/items/iron_pickaxe" },
  { name: "Farming", icon: "textures/items/wheat" },
  { name: "Food", icon: "textures/items/bread" },
  { name: "Combat", icon: "textures/items/iron_sword" },
  { name: "Ores & Minerals", icon: "textures/items/diamond" },
  { name: "Redstone", icon: "textures/items/redstone" },
  { name: "Mob Drops", icon: "textures/items/bone" },
  { name: "Nether", icon: "textures/blocks/netherrack" },
  { name: "Endgame", icon: "textures/items/ender_pearl" }
];
const MILESTONES = [
  { unlock: 0, id: "minecraft:dirt", reward: 1 },
  { unlock: 50, id: "minecraft:oak_log", reward: 1 },
  { unlock: 150, id: "minecraft:cobblestone", reward: 2 },
  { unlock: 350, id: "minecraft:coal_ore", reward: 2 },
  { unlock: 700, id: "minecraft:iron_ore", reward: 3 },
  { unlock: 1200, id: "minecraft:gold_ore", reward: 3 },
  { unlock: 2000, id: "minecraft:diamond_ore", reward: 4 },
  { unlock: 3000, id: "minecraft:obsidian", reward: 5 },
  { unlock: 4500, id: "minecraft:ancient_debris", reward: 6 },
  { unlock: 6000, id: "minecraft:netherite_block", reward: 8 }
];
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
  ["furnace", 10, 1, "Building Blocks", 0, true, "textures/blocks/furnace_front"],
  ["wooden_pickaxe", 8, 1, "Tools & Gear", 0, false, "textures/items/wood_pickaxe"],
  ["wooden_axe", 8, 1, "Tools & Gear", 0, false, "textures/items/wood_axe"],
  ["wooden_shovel", 5, 1, "Tools & Gear", 0, false, "textures/items/wood_shovel"],
  ["wooden_sword", 6, 1, "Combat", 0, false, "textures/items/wood_sword"],
  ["cobblestone", 3, 16, "Building Blocks", 1, true, "textures/blocks/cobblestone"],
  ["stone", 5, 16, "Building Blocks", 1, true, "textures/blocks/stone"],
  ["glass", 6, 16, "Building Blocks", 1, true, "textures/blocks/glass"],
  ["bricks", 12, 8, "Building Blocks", 1, true, "textures/blocks/brick"],
  ["oak_door", 6, 4, "Building Blocks", 1, true, "textures/blocks/door_oak_lower"],
  ["oak_fence", 5, 8, "Building Blocks", 1, true, "textures/blocks/fence_oak"],
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
  ["lantern", 12, 4, "Building Blocks", 2, true, "textures/blocks/lantern"],
  ["iron_pickaxe", 45, 1, "Tools & Gear", 2, false, "textures/items/iron_pickaxe"],
  ["iron_axe", 40, 1, "Tools & Gear", 2, false, "textures/items/iron_axe"],
  ["iron_sword", 38, 1, "Combat", 2, false, "textures/items/iron_sword"],
  ["iron_shovel", 24, 1, "Tools & Gear", 2, false, "textures/items/iron_shovel"],
  ["shield", 35, 1, "Combat", 2, false, "textures/items/shield"],
  ["bow", 30, 1, "Combat", 2, false, "textures/items/bow_standby"],
  ["arrow", 3, 16, "Combat", 2, false, "textures/items/arrow"],
  ["pumpkin_seeds", 4, 8, "Farming", 2, false, "textures/items/seeds_pumpkin"],
  ["melon_seeds", 4, 8, "Farming", 2, false, "textures/items/seeds_melon"],
  ["hay_block", 10, 4, "Farming", 2, true, "textures/blocks/hay_block_side"],
  ["redstone", 14, 8, "Redstone", 3, false, "textures/items/redstone_dust"],
  ["redstone_torch", 12, 8, "Redstone", 3, true, "textures/blocks/redstone_torch_on"],
  ["lever", 8, 4, "Redstone", 3, true, "textures/blocks/lever"],
  ["piston", 25, 2, "Redstone", 3, true, "textures/blocks/piston_top"],
  ["dispenser", 18, 1, "Redstone", 3, true, "textures/blocks/dispenser_front_horizontal"],
  ["hopper", 30, 1, "Redstone", 3, true, "textures/blocks/hopper"],
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
  ["shulker_box", 150, 1, "Endgame", 8, true, "textures/blocks/shulker_top"],
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
  ["mangrove_log", 4, 8, "Building Blocks", 1, true, "textures/blocks/mangrove_log"],
  ["cherry_log", 4, 8, "Building Blocks", 1, true, "textures/blocks/cherry_log"],
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
  ["sugar_cane", 3, 8, "Farming", 1, true, "textures/blocks/reeds"],
  ["bamboo", 4, 8, "Farming", 1, true, "textures/blocks/bamboo_stalk"],
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
  ["repeater", 18, 4, "Redstone", 3, true, "textures/blocks/repeater"],
  ["comparator", 24, 2, "Redstone", 4, true, "textures/blocks/comparator"],
  ["observer", 28, 2, "Redstone", 4, true, "textures/blocks/observer"],
  ["dropper", 18, 2, "Redstone", 3, true, "textures/blocks/dropper_front_horizontal"],
  ["sticky_piston", 32, 2, "Redstone", 4, true, "textures/blocks/piston_top_sticky"],
  ["daylight_detector", 26, 1, "Redstone", 4, true, "textures/blocks/daylight_detector_top"],
  ["target", 22, 2, "Redstone", 4, true, "textures/blocks/target_side"],
  ["tripwire_hook", 8, 4, "Redstone", 3, false, "textures/items/tripwire_hook"],
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
  ["crimson_stem", 8, 8, "Nether", 5, true, "textures/blocks/huge_fungus/crimson_stem"],
  ["warped_stem", 8, 8, "Nether", 5, true, "textures/blocks/huge_fungus/warped_stem"],
  ["glowstone_dust", 15, 8, "Nether", 5, false, "textures/items/glowstone_dust"],
  ["soul_torch", 5, 8, "Nether", 5, true, "textures/blocks/soul_torch"],
  ["ender_chest", 120, 1, "Endgame", 6, true, "textures/blocks/ender_chest_front"],
  ["end_crystal", 120, 1, "Endgame", 8, false, "textures/items/end_crystal"],
  ["dragon_breath", 90, 1, "Endgame", 8, false, "textures/items/dragon_breath"],
  ["conduit", 350, 1, "Endgame", 8, true, "textures/blocks/conduit"],
  ["heart_of_the_sea", 160, 1, "Endgame", 7, false, "textures/items/heartofthesea"]
].map(([raw, price, amount, category, tier, block, icon]) => ({
  id: "minecraft:" + raw, raw, price, amount, category, tier, block, icon,
  name: raw.split("_").map(s => s[0].toUpperCase() + s.slice(1)).join(" ")
}));

const objectiveCache = new Map();
function objective(name) {
  let obj = objectiveCache.get(name);
  if (!obj) {
    obj = world.scoreboard.getObjective(name) ?? world.scoreboard.addObjective(name, name);
    objectiveCache.set(name, obj);
  }
  return obj;
}
function readScore(name, identity) {
  try { return objective(name).getScore(identity) ?? 0; } catch { return 0; }
}
function writeScore(name, identity, value) {
  try { objective(name).setScore(identity, Math.max(0, Math.floor(value))); return true; } catch { return false; }
}
function balance(player) { return readScore(COINS, player); }
function personalBreaks(player) { return readScore(MINED, player); }
function totalBreaks() { return readScore(TOTAL, GLOBAL_KEY); }
function setBalance(player, amount) { return writeScore(COINS, player, amount); }
function inventoryOf(player) { return player.getComponent("minecraft:inventory")?.container; }
function itemAvailable(item) {
  try { return !!ItemTypes.get(item.id); } catch { return false; }
}
function tell(player, message) { try { player.sendMessage("§6[Natural Market] §r" + message); } catch {} }
function showBalance(player) {
  try { player.onScreenDisplay.setActionBar("§6Coins: §e" + balance(player) + " §8| §7Blocks: §f" + personalBreaks(player)); } catch {}
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
    tell(player, "Free one inventory slot and rejoin to receive your Natural Market Ledger.");
    return false;
  }
  try {
    inv.addItem(new ItemStack(LEDGER, 1));
    tell(player, "Your Natural Market Ledger is ready. Use it to open the market.");
    return true;
  } catch { return false; }
}
function hasScore(name, player) {
  try { return objective(name).getScore(player) !== undefined; } catch { return false; }
}
function initializePlayer(player) {
  if (!hasScore(COINS, player)) writeScore(COINS, player, 50);
  if (!hasScore(MINED, player)) writeScore(MINED, player, 0);
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
  const pool = new Set(MILESTONES.filter(m => totalBreaks() >= m.unlock).map(m => m.id));
  try {
    const stored = world.getDynamicProperty(POOL_KEY);
    if (typeof stored === "string") {
      for (const id of JSON.parse(stored)) if (typeof id === "string" && !["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"].includes(id)) pool.add(id);
    }
  } catch {}
  return [...pool];
}
function addBlockToPool(item) {
  if (!item.block || ["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"].includes(item.id)) return;
  const stored = currentPool();
  if (!stored.includes(item.id)) stored.push(item.id);
  try { world.setDynamicProperty(POOL_KEY, JSON.stringify(stored)); } catch {}
}
function coreBlock() {
  const pool = currentPool();
  return pool[Math.floor(Math.random() * pool.length)] ?? "minecraft:dirt";
}
function ensureCore() {
  const players = world.getAllPlayers();
  if (!players.some(p => p.hasTag("void_cleaned"))) return;
  try {
    const dimension = world.getDimension("overworld");
    const bedrock = dimension.getBlock(BEDROCK);
    if (bedrock && bedrock.typeId === "minecraft:air") bedrock.setType("minecraft:bedrock");
    const core = dimension.getBlock(CORE);
    if (core && (core.typeId === "minecraft:air" || core.typeId === "minecraft:grass_block")) core.setType(coreBlock());
  } catch {}
}
function marketMain(player) {
  const form = new ActionFormData()
    .title("NATURAL MARKET")
    .body("§6Coins: §e" + balance(player) + "§r\nPersonal breaks: " + personalBreaks(player) +
      "\nShared breaks: " + totalBreaks() + "\nUnlocked tier: " + (unlockedTier(player) + 1) + " / 10\n\nChoose a market section.");
  form.button("Building Blocks", CATEGORIES[0].icon)
    .button("Tools & Gear", CATEGORIES[1].icon)
    .button("Farming", CATEGORIES[2].icon)
    .button("Food", CATEGORIES[3].icon)
    .button("Combat", CATEGORIES[4].icon)
    .button("Ores & Minerals", CATEGORIES[5].icon)
    .button("Redstone", CATEGORIES[6].icon)
    .button("Mob Drops", CATEGORIES[7].icon)
    .button("Nether", CATEGORIES[8].icon)
    .button("Endgame", CATEGORIES[9].icon)
    .button("Sell Eligible Items", "textures/items/gold_ingot")
    .button("Balance & Progress", "textures/items/emerald");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection < CATEGORIES.length) return showCategory(player, CATEGORIES[r.selection].name);
    if (r.selection === CATEGORIES.length) return sellEligible(player);
    if (r.selection === CATEGORIES.length + 1) {
      const next = MILESTONES.find(m => m.unlock > personalBreaks(player));
      tell(player, "Balance: " + balance(player) + " Coins. Personal breaks: " + personalBreaks(player) +
        ". Shared breaks: " + totalBreaks() + ". " + (next ? "Next core milestone: " + next.unlock + " shared breaks." : "All core milestones reached."));
      showBalance(player);
    }
  }).catch(() => tell(player, "The market menu could not open. Try using the Ledger again."));
}
function showCategory(player, category) {
  const tier = unlockedTier(player);
  const items = CATALOG.filter(item => item.category === category && item.tier <= tier && itemAvailable(item));
  const locked = CATALOG.filter(item => item.category === category && item.tier > tier);
  const form = new ActionFormData().title(category.toUpperCase())
    .body("Balance: " + balance(player) + " Coins\nUnlocked supplies: " + items.length +
      (locked.length ? "\nMore supplies unlock as you mine the core." : "") + "\nSelect an item to inspect it.");
  for (const item of items) form.button(item.name + " ×" + item.amount + "\n§e" + item.price + " Coins each", item.icon);
  form.button("Back to Market", "textures/items/book_normal");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection === items.length) return marketMain(player);
    const item = items[r.selection];
    if (item) confirmPurchase(player, item);
  }).catch(() => tell(player, "This category could not open."));
}
function confirmPurchase(player, item) {
  const totalPrice = item.price * item.amount;
  const form = new MessageFormData()
    .title(item.name)
    .body("Purchase " + item.amount + " × " + item.name + " for " + totalPrice + " Coins?\n\nPrice per item: " + item.price + " Coins. Your balance: " + balance(player) + " Coins.")
    .button1("Buy")
    .button2("Cancel");
  showForm(form, player).then(r => {
    if (!r.canceled && r.selection === 0) purchase(player, item);
  }).catch(() => tell(player, "Purchase confirmation could not open."));
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
  else tell(player, "Purchased " + delivered + " × " + item.name + " for " + charged + " Coins.");
  addBlockToPool(item);
  showBalance(player);
}
function sellEligible(player) {
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const values = new Map(CATALOG.map(item => [item.id, Math.max(1, Math.floor(item.price / 2))]));
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
  if (!count) return tell(player, "You have no eligible market items to sell.");
  const form = new MessageFormData().title("SELL ELIGIBLE ITEMS")
    .body("Sell " + count + " eligible item(s) for " + payout + " Coins? Items not listed in the market are kept.")
    .button1("Sell")
    .button2("Cancel");
  showForm(form, player).then(r => {
    if (r.canceled || r.selection !== 0) return;
    if (!setBalance(player, balance(player) + payout)) return tell(player, "Balance update failed; your items were kept.");
    for (const slot of slots) inv.setItem(slot, undefined);
    tell(player, "Sold " + count + " eligible item(s) for " + payout + " Coins.");
    showBalance(player);
  }).catch(() => tell(player, "The sell confirmation could not open."));
}
let coreBreakPending = false;
function onCoreBreak(player) {
  const personal = personalBreaks(player) + 1;
  const total = totalBreaks() + 1;
  writeScore(MINED, player, personal);
  writeScore(TOTAL, GLOBAL_KEY, total);
  const milestone = [...MILESTONES].reverse().find(m => total >= m.unlock) ?? MILESTONES[0];
  writeScore(COINS, player, balance(player) + milestone.reward);
  if (MILESTONES.some(m => m.unlock > 0 && m.unlock === total)) {
    world.sendMessage("§6[Natural Market] §rA new core milestone has been reached. More block types can now appear.");
  }
  tell(player, "Core mined: +" + milestone.reward + " Coins.");
  showBalance(player);
}
world.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id !== READY_EVENT) return;
  system.run(() => ensureCore());
});
world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack?.typeId !== LEDGER) return;
  const player = event.source;
  if (player?.typeId === "minecraft:player") system.run(() => marketMain(player));
});
world.afterEvents.playerBreakBlock.subscribe(event => {
  const location = event.block.location;
  const player = event.player;
  if (!player || event.block.dimension.id !== "minecraft:overworld") return;
  if (location.x !== CORE.x || location.y !== CORE.y || location.z !== CORE.z || coreBreakPending) return;
  coreBreakPending = true;
  system.runTimeout(() => {
    try {
      if (player.hasTag("void_cleaned")) {
        onCoreBreak(player);
        const block = world.getDimension("overworld").getBlock(CORE);
        if (block && block.typeId === "minecraft:air") block.setType(coreBlock());
      }
    } catch {}
    coreBreakPending = false;
  }, 1);
});
world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(() => {
    initializePlayer(event.player);
    if (event.player.hasTag("void_cleaned")) ensureCore();
  }, 10);
});
world.afterEvents.playerLeave.subscribe(event => {
  objectiveCache.clear();
});
system.run(() => {
  objective(COINS);
  objective(MINED);
  objective(TOTAL);
});
