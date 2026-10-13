/**
 * YGP! True Offhand Functionality v2.1.1
 * Created by YGP Studio / YGP Minecraft
 *
 * Keeps the v1.2.1 double-sneak swap.
 * Adds offhand/mainhand handheld light via minecraft:light_block.
 * Adds offhand Riptide Trident support using enchantable + durability APIs.
 */
import { world, system, EquipmentSlot, ItemStack, BlockPermutation } from "@minecraft/server";

const ADDON_VERSION = "2.1.1";
const LOG = "[YGP Offhand]";
const SWAP_WINDOW_TICKS = 14;
const SWAP_COOLDOWN_TICKS = 8;
const LIGHT_UPDATE_TICKS = 4;
const SPECIAL_COOLDOWN_TICKS = 8;
const FIREWORK_IMPULSE = 1.7;
const WIND_SPEED = 1.6;
const RIPTIDE_IMPULSE = { 1: 1.6, 2: 2.3, 3: 3.0 };
const RIPTIDE_UNDERWATER_SCALE = 0.75;

/** @type {Map<string, string>} */
const weatherByDimension = new Map();

const LIGHT_LEVELS = {
  "minecraft:torch": 14,
  "minecraft:soul_torch": 10,
  "minecraft:redstone_torch": 7,
  "minecraft:lantern": 15,
  "minecraft:soul_lantern": 10,
  "minecraft:copper_torch": 14,
  "minecraft:exposed_copper_torch": 14,
  "minecraft:weathered_copper_torch": 14,
  "minecraft:oxidized_copper_torch": 14,
  "minecraft:waxed_copper_torch": 14,
  "minecraft:waxed_exposed_copper_torch": 14,
  "minecraft:waxed_weathered_copper_torch": 14,
  "minecraft:waxed_oxidized_copper_torch": 14,
  "minecraft:copper_lantern": 15,
  "minecraft:exposed_copper_lantern": 15,
  "minecraft:weathered_copper_lantern": 15,
  "minecraft:oxidized_copper_lantern": 15,
  "minecraft:waxed_copper_lantern": 15,
  "minecraft:waxed_exposed_copper_lantern": 15,
  "minecraft:waxed_weathered_copper_lantern": 15,
  "minecraft:waxed_oxidized_copper_lantern": 15,
  "minecraft:copper_bulb": 15,
  "minecraft:exposed_copper_bulb": 15,
  "minecraft:weathered_copper_bulb": 15,
  "minecraft:oxidized_copper_bulb": 15,
  "minecraft:waxed_copper_bulb": 15,
  "minecraft:waxed_exposed_copper_bulb": 15,
  "minecraft:waxed_weathered_copper_bulb": 15,
  "minecraft:waxed_oxidized_copper_bulb": 15,
  "minecraft:glowstone": 15,
  "minecraft:shroomlight": 15,
  "minecraft:sea_lantern": 15,
  "minecraft:end_rod": 14,
  "minecraft:beacon": 15,
  "minecraft:jack_o_lantern": 15,
  "minecraft:campfire": 15,
  "minecraft:soul_campfire": 10,
  "minecraft:glow_berries": 14,
  "minecraft:cave_vines": 14,
  "minecraft:cave_vines_body": 14,
  "minecraft:blaze_rod": 7,
  "minecraft:magma": 3,
  "minecraft:magma_cream": 3,
  "minecraft:ochre_froglight": 15,
  "minecraft:verdant_froglight": 15,
  "minecraft:pearlescent_froglight": 15,
  "minecraft:crying_obsidian": 10,
  "minecraft:ender_chest": 7,
  "minecraft:glow_lichen": 7,
  "minecraft:conduit": 15,
  "minecraft:respawn_anchor": 15,
  "minecraft:redstone_lamp": 15,
  "minecraft:sea_pickle": 6,
  "minecraft:sculk_catalyst": 6,
  "minecraft:amethyst_cluster": 5,
  "minecraft:large_amethyst_bud": 4,
  "minecraft:medium_amethyst_bud": 2,
  "minecraft:small_amethyst_bud": 1,
  "minecraft:brewing_stand": 1,
  "minecraft:dragon_egg": 1,
  "minecraft:candle": 3,
  "minecraft:white_candle": 3,
  "minecraft:orange_candle": 3,
  "minecraft:magenta_candle": 3,
  "minecraft:light_blue_candle": 3,
  "minecraft:yellow_candle": 3,
  "minecraft:lime_candle": 3,
  "minecraft:pink_candle": 3,
  "minecraft:gray_candle": 3,
  "minecraft:light_gray_candle": 3,
  "minecraft:cyan_candle": 3,
  "minecraft:purple_candle": 3,
  "minecraft:blue_candle": 3,
  "minecraft:brown_candle": 3,
  "minecraft:green_candle": 3,
  "minecraft:red_candle": 3,
  "minecraft:black_candle": 3,
  "minecraft:open_eyeblossom": 2,
  "minecraft:firefly_bush": 2,
  "minecraft:trial_spawner": 4,
  "minecraft:ominous_trial_spawner": 8,
};

const SUPPORTED_ITEMS = [
  "minecraft:wooden_sword", "minecraft:stone_sword", "minecraft:copper_sword", "minecraft:iron_sword",
  "minecraft:golden_sword", "minecraft:diamond_sword", "minecraft:netherite_sword",
  "minecraft:bow", "minecraft:crossbow", "minecraft:shield", "minecraft:trident", "minecraft:mace",
  "minecraft:wooden_pickaxe", "minecraft:stone_pickaxe", "minecraft:copper_pickaxe", "minecraft:iron_pickaxe",
  "minecraft:golden_pickaxe", "minecraft:diamond_pickaxe", "minecraft:netherite_pickaxe",
  "minecraft:wooden_axe", "minecraft:stone_axe", "minecraft:copper_axe", "minecraft:iron_axe",
  "minecraft:golden_axe", "minecraft:diamond_axe", "minecraft:netherite_axe",
  "minecraft:wooden_shovel", "minecraft:stone_shovel", "minecraft:copper_shovel", "minecraft:iron_shovel",
  "minecraft:golden_shovel", "minecraft:diamond_shovel", "minecraft:netherite_shovel",
  "minecraft:wooden_hoe", "minecraft:stone_hoe", "minecraft:copper_hoe", "minecraft:iron_hoe",
  "minecraft:golden_hoe", "minecraft:diamond_hoe", "minecraft:netherite_hoe",
  "minecraft:leather_helmet", "minecraft:leather_chestplate", "minecraft:leather_leggings", "minecraft:leather_boots",
  "minecraft:copper_helmet", "minecraft:copper_chestplate", "minecraft:copper_leggings", "minecraft:copper_boots",
  "minecraft:chainmail_helmet", "minecraft:chainmail_chestplate", "minecraft:chainmail_leggings", "minecraft:chainmail_boots",
  "minecraft:iron_helmet", "minecraft:iron_chestplate", "minecraft:iron_leggings", "minecraft:iron_boots",
  "minecraft:golden_helmet", "minecraft:golden_chestplate", "minecraft:golden_leggings", "minecraft:golden_boots",
  "minecraft:diamond_helmet", "minecraft:diamond_chestplate", "minecraft:diamond_leggings", "minecraft:diamond_boots",
  "minecraft:netherite_helmet", "minecraft:netherite_chestplate", "minecraft:netherite_leggings", "minecraft:netherite_boots",
  "minecraft:turtle_helmet", "minecraft:elytra", "minecraft:wolf_armor",
  "minecraft:torch", "minecraft:soul_torch", "minecraft:redstone_torch",
  "minecraft:lantern", "minecraft:soul_lantern", "minecraft:copper_torch", "minecraft:copper_lantern",
  "minecraft:exposed_copper_torch", "minecraft:weathered_copper_torch", "minecraft:oxidized_copper_torch",
  "minecraft:exposed_copper_lantern", "minecraft:weathered_copper_lantern", "minecraft:oxidized_copper_lantern",
  "minecraft:water_bucket", "minecraft:lava_bucket", "minecraft:milk_bucket", "minecraft:powder_snow_bucket",
  "minecraft:cod_bucket", "minecraft:salmon_bucket", "minecraft:pufferfish_bucket", "minecraft:tropical_fish_bucket",
  "minecraft:axolotl_bucket", "minecraft:tadpole_bucket",
  "minecraft:fishing_rod", "minecraft:shears", "minecraft:flint_and_steel", "minecraft:lead",
  "minecraft:name_tag", "minecraft:compass", "minecraft:clock", "minecraft:recovery_compass",
  "minecraft:spyglass", "minecraft:map", "minecraft:empty_map", "minecraft:filled_map",
  "minecraft:bread", "minecraft:apple", "minecraft:golden_apple", "minecraft:enchanted_golden_apple",
  "minecraft:cooked_beef", "minecraft:cooked_porkchop", "minecraft:cooked_chicken", "minecraft:cooked_mutton",
  "minecraft:cooked_salmon", "minecraft:cooked_cod", "minecraft:baked_potato", "minecraft:carrot",
  "minecraft:cooked_rabbit", "minecraft:rabbit_stew", "minecraft:mushroom_stew", "minecraft:beetroot_soup",
  "minecraft:pumpkin_pie", "minecraft:cookie", "minecraft:cake", "minecraft:honey_bottle",
  "minecraft:sweet_berries", "minecraft:glow_berries", "minecraft:melon_slice", "minecraft:dried_kelp",
  "minecraft:totem_of_undying", "minecraft:ender_pearl", "minecraft:ender_eye", "minecraft:experience_bottle",
  "minecraft:firework_rocket", "minecraft:firework_star", "minecraft:enchanted_book", "minecraft:nether_star",
  "minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot", "minecraft:iron_ingot",
  "minecraft:copper_ingot", "minecraft:netherite_ingot", "minecraft:netherite_scrap",
  "minecraft:crafting_table", "minecraft:furnace", "minecraft:blast_furnace", "minecraft:smoker",
  "minecraft:anvil", "minecraft:enchanting_table", "minecraft:chest", "minecraft:ender_chest",
  "minecraft:trapped_chest", "minecraft:barrel", "minecraft:shulker_box",
  "minecraft:white_shulker_box", "minecraft:orange_shulker_box", "minecraft:magenta_shulker_box",
  "minecraft:light_blue_shulker_box", "minecraft:yellow_shulker_box", "minecraft:lime_shulker_box",
  "minecraft:pink_shulker_box", "minecraft:gray_shulker_box", "minecraft:light_gray_shulker_box",
  "minecraft:cyan_shulker_box", "minecraft:purple_shulker_box", "minecraft:blue_shulker_box",
  "minecraft:brown_shulker_box", "minecraft:green_shulker_box", "minecraft:red_shulker_box", "minecraft:black_shulker_box",
  "minecraft:arrow", "minecraft:spectral_arrow", "minecraft:tipped_arrow",
  "minecraft:potion", "minecraft:splash_potion", "minecraft:lingering_potion",
  "minecraft:glowstone", "minecraft:sea_lantern", "minecraft:shroomlight", "minecraft:crying_obsidian",
  "minecraft:beacon", "minecraft:conduit", "minecraft:respawn_anchor", "minecraft:end_rod",
  "minecraft:campfire", "minecraft:soul_campfire", "minecraft:jack_o_lantern",
  "minecraft:ochre_froglight", "minecraft:verdant_froglight", "minecraft:pearlescent_froglight",
  "minecraft:wind_charge", "minecraft:breeze_rod", "minecraft:heavy_core",
  "minecraft:trial_key", "minecraft:ominous_trial_key", "minecraft:ominous_bottle",
  "minecraft:armadillo_scute", "minecraft:crafter", "minecraft:bundle",
  "minecraft:goat_horn", "minecraft:brush", "minecraft:book", "minecraft:writable_book", "minecraft:written_book",
  "minecraft:saddle", "minecraft:carrot_on_a_stick", "minecraft:warped_fungus_on_a_stick",
  "minecraft:boat", "minecraft:oak_boat", "minecraft:spruce_boat", "minecraft:birch_boat",
  "minecraft:jungle_boat", "minecraft:acacia_boat", "minecraft:dark_oak_boat", "minecraft:mangrove_boat",
  "minecraft:cherry_boat", "minecraft:bamboo_raft", "minecraft:pale_oak_boat",
  "minecraft:minecart", "minecraft:chest_minecart", "minecraft:hopper_minecart", "minecraft:tnt_minecart",
  "minecraft:bed", "minecraft:white_bed", "minecraft:respawn_anchor",
  "minecraft:tnt", "minecraft:obsidian", "minecraft:ender_pearl",
];

/** @type {Map<string, any>} */
const playerState = new Map();

function log(message) {
  console.warn(`${LOG} ${message}`);
}

function getState(id) {
  let state = playerState.get(id);
  if (!state) {
    state = {
      sneakHeld: false,
      sneakCount: 0,
      sneakTimer: 0,
      lastSwapTick: -9999,
      welcomed: false,
      lightDim: undefined,
      lightX: undefined,
      lightY: undefined,
      lightZ: undefined,
      lightLevel: 0,
      lastOffhandId: undefined,
      lastSpecialTick: -9999,
      jumpHeld: false,
    };
    playerState.set(id, state);
  }
  return state;
}

function describeItem(item) {
  if (!item) return "empty";
  const name = item.nameTag ? `"${item.nameTag}"` : item.typeId;
  return item.amount > 1 ? `${name} x${item.amount}` : name;
}

function getEquipment(player) {
  try {
    return player.getComponent("minecraft:equippable") || player.getComponent("equippable");
  } catch (error) {
    log(`ERROR: equippable failed: ${error}`);
    return undefined;
  }
}

function getContainer(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    return inventory ? inventory.container : undefined;
  } catch (error) {
    log(`ERROR: inventory failed: ${error}`);
    return undefined;
  }
}

function cloneStack(item) {
  if (!item) return undefined;
  try {
    if (typeof item.clone === "function") return item.clone();
  } catch (error) {
    log(`ERROR: clone failed: ${error}`);
  }
  try {
    const copy = new ItemStack(item.typeId, item.amount);
    if (item.nameTag) copy.nameTag = item.nameTag;
    return copy;
  } catch (error) {
    log(`ERROR: fallback clone failed: ${error}`);
    return undefined;
  }
}

function shortId(typeId) {
  return typeId && typeId.startsWith("minecraft:") ? typeId.slice("minecraft:".length) : typeId;
}

function offhandMatches(equipment, item) {
  const readBack = equipment.getEquipment(EquipmentSlot.Offhand);
  if (!item) return !readBack;
  return !!(readBack && readBack.typeId === item.typeId);
}

function forceOffhand(player, item) {
  const id = item ? shortId(item.typeId) : "air";
  const amount = item ? item.amount : 1;
  const commands = item
    ? [
        `replaceitem entity @s slot.weapon.offhand 0 ${id} ${amount}`,
        `replaceitem entity @s slot.weapon.offhand 0 ${item.typeId} ${amount}`,
        `item replace entity @s slot.weapon.offhand with ${id} ${amount}`,
      ]
    : [
        "replaceitem entity @s slot.weapon.offhand 0 air",
        "item replace entity @s slot.weapon.offhand with air",
      ];
  for (const command of commands) {
    try {
      player.runCommand(command);
    } catch (error) {
      log(`ERROR: command failed (${command}): ${error}`);
    }
  }
}

function readEnchantList(item) {
  const list = [];
  if (!item) return list;
  const enchantable = getItemComponent(item, ["minecraft:enchantable", "enchantable"]);
  if (!enchantable || typeof enchantable.getEnchantments !== "function") return list;
  try {
    for (const enchantment of enchantable.getEnchantments() || []) {
      const type = enchantment.type;
      const id = typeof type === "string" ? type : type && type.id ? type.id : "";
      if (!id || !enchantment.level) continue;
      list.push({ id, type, level: enchantment.level });
    }
  } catch (error) {
    log(`ERROR: read enchants: ${error}`);
  }
  return list;
}

function applyEnchantList(item, list) {
  if (!item || !list || !list.length) return;
  const enchantable = getItemComponent(item, ["minecraft:enchantable", "enchantable"]);
  if (!enchantable || typeof enchantable.addEnchantment !== "function") return;
  for (const entry of list) {
    const attempts = [];
    if (entry.type) attempts.push(entry.type);
    if (entry.id) attempts.push(entry.id);
    if (entry.id && entry.id.startsWith("minecraft:")) attempts.push(entry.id.slice(10));
    else if (entry.id) attempts.push("minecraft:" + entry.id);
    for (const type of attempts) {
      try {
        enchantable.addEnchantment({ type, level: entry.level });
        break;
      } catch (error) {
        log(`ERROR: addEnchantment ${entry.id}: ${error}`);
      }
    }
  }
}

function keepEnchantments(player, equipment, item, saved) {
  if (!item || !saved || !saved.length) return;
  if (!offhandMatches(equipment, item)) return;
  let current;
  try { current = equipment.getEquipment(EquipmentSlot.Offhand); } catch (error) { return; }
  if (!current || readEnchantList(current).length >= saved.length) return;
  applyEnchantList(current, saved);
  try {
    if (typeof equipment.getEquipmentSlot === "function") {
      const slot = equipment.getEquipmentSlot(EquipmentSlot.Offhand);
      if (slot && typeof slot.setItem === "function") slot.setItem(current);
    }
  } catch (error) {
    log(`ERROR: enchant setItem: ${error}`);
  }
  if (!offhandMatches(equipment, item)) forceOffhand(player, item);
}

function writeOffhand(player, equipment, item) {
  const saved = readEnchantList(item);
  if (item) {
    try {
      const copy = cloneStack(item);
      applyEnchantList(copy, saved);
      const accepted = equipment.setEquipment(EquipmentSlot.Offhand, copy);
      if (offhandMatches(equipment, item)) {
        keepEnchantments(player, equipment, item, saved);
        return true;
      }
      if (accepted !== false && offhandMatches(equipment, item)) return true;
    } catch (error) {
      log(`ERROR: setEquipment offhand: ${error}`);
    }
  } else {
    try {
      equipment.setEquipment(EquipmentSlot.Offhand, undefined);
      if (offhandMatches(equipment, undefined)) return true;
    } catch (error) {
      log(`ERROR: clear offhand: ${error}`);
    }
  }
  forceOffhand(player, item);
  if (!offhandMatches(equipment, item)) return false;
  keepEnchantments(player, equipment, item, saved);
  if (!offhandMatches(equipment, item)) forceOffhand(player, item);
  return offhandMatches(equipment, item);
}

function writeMainhand(player, equipment, item) {
  try {
    const accepted = equipment.setEquipment(EquipmentSlot.Mainhand, item ? cloneStack(item) : undefined);
    if (accepted !== false) return true;
  } catch (error) {
    log(`ERROR: setEquipment mainhand: ${error}`);
  }
  try {
    const container = getContainer(player);
    if (container) {
      container.setItem(player.selectedSlotIndex, item ? cloneStack(item) : undefined);
      return true;
    }
  } catch (error) {
    log(`ERROR: hotbar write: ${error}`);
  }
  return false;
}

function hasElytra(player) {
  try {
    const equipment = getEquipment(player);
    const chest = equipment ? equipment.getEquipment(EquipmentSlot.Chest) : undefined;
    return !!(chest && chest.typeId === "minecraft:elytra");
  } catch (error) {
    log(`ERROR: elytra check: ${error}`);
    return false;
  }
}

function consumeOffhand(player, equipment, off) {
  if (!off) return false;
  const next = off.amount > 1 ? (() => {
    const copy = cloneStack(off);
    copy.amount = off.amount - 1;
    return copy;
  })() : undefined;
  return writeOffhand(player, equipment, next);
}

function getItemComponent(item, names) {
  if (!item) return undefined;
  for (const name of names) {
    try {
      const component = item.getComponent(name);
      if (component) return component;
    } catch (error) {
      log(`ERROR: getComponent ${name}: ${error}`);
    }
  }
  return undefined;
}

function getEnchantmentLevel(item, ids) {
  const enchantable = getItemComponent(item, ["minecraft:enchantable", "enchantable"]);
  if (!enchantable) return 0;
  for (const id of ids) {
    try {
      if (typeof enchantable.getEnchantment === "function") {
        const enchantment = enchantable.getEnchantment(id);
        if (enchantment && enchantment.level > 0) return enchantment.level;
      }
    } catch (error) {
      log(`ERROR: getEnchantment ${id}: ${error}`);
    }
    try {
      if (typeof enchantable.hasEnchantment === "function" && enchantable.hasEnchantment(id)) {
        return 1;
      }
    } catch (error) {
      log(`ERROR: hasEnchantment ${id}: ${error}`);
    }
  }
  return 0;
}

function getRiptideLevel(item) {
  if (!item || item.typeId !== "minecraft:trident") return 0;
  const level = getEnchantmentLevel(item, ["minecraft:riptide", "riptide"]);
  if (level < 1) return 0;
  return Math.min(3, level);
}

function isCreativeOrSpectator(player) {
  try {
    const mode = String(player.getGameMode()).toLowerCase();
    return mode.includes("creative") || mode.includes("spectator");
  } catch (error) {
    return false;
  }
}

function weatherLooksWet(value) {
  const text = String(value || "").toLowerCase();
  return text.includes("rain") || text.includes("thunder") || text.includes("storm");
}

function getTrackedWeather(dimension) {
  const id = dimension && dimension.id ? dimension.id : "minecraft:overworld";
  if (weatherByDimension.has(id)) return weatherByDimension.get(id);
  try {
    if (dimension && typeof dimension.getWeather === "function") {
      return dimension.getWeather();
    }
  } catch (error) {
    log(`ERROR: getWeather: ${error}`);
  }
  return undefined;
}

function canRainReachPlayer(player) {
  const dim = player.dimension;
  const x = Math.floor(player.location.x);
  const z = Math.floor(player.location.z);
  let y = Math.floor(player.location.y + 1.8);
  let steps = 0;
  while (steps < 96) {
    let block;
    try {
      block = dim.getBlock({ x, y, z });
    } catch (error) {
      return false;
    }
    if (!block) return true;
    try {
      if (block.isAir || isLightBlock(block.typeId)) {
        y += 1;
        steps += 1;
        continue;
      }
    } catch (error) {
      return false;
    }
    return false;
  }
  return true;
}

function isRiptideEnvironment(player) {
  try {
    if (player.isInWater) return { ok: true, underwater: true };
  } catch (error) {
    log(`ERROR: isInWater: ${error}`);
  }

  try {
    const feet = player.dimension.getBlock({
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y),
      z: Math.floor(player.location.z),
    });
    const feetId = feet && feet.typeId ? feet.typeId : "";
    if (feetId === "minecraft:water" || feetId === "minecraft:flowing_water") {
      return { ok: true, underwater: false };
    }
  } catch (error) {
    log(`ERROR: water block check: ${error}`);
  }

  const dimId = player.dimension && player.dimension.id ? player.dimension.id : "";
  if (dimId === "minecraft:nether" || dimId === "minecraft:the_end") {
    return { ok: false, underwater: false };
  }

  if (weatherLooksWet(getTrackedWeather(player.dimension)) && canRainReachPlayer(player)) {
    return { ok: true, underwater: false };
  }
  return { ok: false, underwater: false };
}

function applyRiptideDurability(player, equipment, trident) {
  if (isCreativeOrSpectator(player)) return "ok";
  const durability = getItemComponent(trident, ["minecraft:durability", "durability"]);
  if (!durability) return "unknown";

  try {
    if (durability.unbreakable) return "ok";
  } catch (error) {
    log(`ERROR: unbreakable flag: ${error}`);
  }

  const unbreaking = getEnchantmentLevel(trident, ["minecraft:unbreaking", "unbreaking"]);
  let shouldDamage = true;
  try {
    if (typeof durability.getDamageChance === "function") {
      const chance = durability.getDamageChance(unbreaking);
      shouldDamage = Math.random() * 100 < chance;
    } else if (unbreaking > 0) {
      shouldDamage = Math.random() < 1 / (unbreaking + 1);
    }
  } catch (error) {
    log(`ERROR: damage chance: ${error}`);
  }

  if (!shouldDamage) return "ok";

  try {
    const nextDamage = durability.damage + 1;
    if (nextDamage >= durability.maxDurability) {
      writeOffhand(player, equipment, undefined);
      try { player.playSound("random.break"); } catch (error) { log(`ERROR: break sound: ${error}`); }
      return "broke";
    }
    durability.damage = nextDamage;
    writeOffhand(player, equipment, trident);
    return "ok";
  } catch (error) {
    log(`ERROR: write riptide durability: ${error}`);
    return "unknown";
  }
}

function useOffhandRiptide(player) {
  const state = getState(player.id);
  if (system.currentTick - state.lastSpecialTick < SPECIAL_COOLDOWN_TICKS) return false;

  let gliding = false;
  try { gliding = !!player.isGliding; } catch (error) { gliding = false; }
  if (gliding && hasElytra(player)) {
    const equipmentPeek = getEquipment(player);
    const offPeek = equipmentPeek ? equipmentPeek.getEquipment(EquipmentSlot.Offhand) : undefined;
    if (offPeek && offPeek.typeId === "minecraft:firework_rocket") return false;
  }

  const equipment = getEquipment(player);
  if (!equipment) return false;
  const off = equipment.getEquipment(EquipmentSlot.Offhand);
  const level = getRiptideLevel(off);
  if (!level) return false;

  const env = isRiptideEnvironment(player);
  if (!env.ok) {
    try { player.playSound("note.bass"); } catch (error) { log(`ERROR: dry riptide sound: ${error}`); }
    return false;
  }

  const strength = (RIPTIDE_IMPULSE[level] || RIPTIDE_IMPULSE[1]) * (env.underwater ? RIPTIDE_UNDERWATER_SCALE : 1);
  if (!applyLookImpulse(player, strength)) return false;

  const sound = level >= 3 ? "item.trident.riptide_3" : level === 2 ? "item.trident.riptide_2" : "item.trident.riptide_1";
  try { player.playSound(sound); } catch (error) {
    try { player.playSound("item.trident.throw"); } catch (error2) { log(`ERROR: riptide sound: ${error2}`); }
  }
  try { player.playAnimation("animation.player.riptide"); } catch (error) {
    log(`ERROR: riptide animation: ${error}`);
  }

  applyRiptideDurability(player, equipment, off);
  state.lastSpecialTick = system.currentTick;
  log(`riptide level ${level} underwater=${env.underwater}`);
  return true;
}

function describeOffhandSpecial(player, off) {
  if (!off) return "§7Offhand special: none";
  if (off.typeId === "minecraft:firework_rocket") return "§6Offhand special: §fFirework boost while gliding";
  if (off.typeId === "minecraft:wind_charge") return "§6Offhand special: §fWind Charge use";
  const level = getRiptideLevel(off);
  if (level) return `§6Offhand special: §fRiptide ${level} Trident`;
  return "§7Offhand special: none";
}

function applyLookImpulse(player, strength) {
  const dir = player.getViewDirection();
  const vector = { x: dir.x * strength, y: dir.y * strength, z: dir.z * strength };
  try {
    player.applyImpulse(vector);
    return true;
  } catch (error) {
    log(`ERROR: applyImpulse: ${error}`);
  }
  try {
    player.applyKnockback({ x: dir.x * strength, z: dir.z * strength }, dir.y * strength);
    return true;
  } catch (error) {
    log(`ERROR: applyKnockback vector: ${error}`);
  }
  try {
    player.applyKnockback(dir.x, dir.z, strength, dir.y * strength);
    return true;
  } catch (error) {
    log(`ERROR: applyKnockback legacy: ${error}`);
    return false;
  }
}

function useOffhandFirework(player) {
  const state = getState(player.id);
  if (system.currentTick - state.lastSpecialTick < SPECIAL_COOLDOWN_TICKS) return false;
  if (!hasElytra(player)) return false;
  let gliding = false;
  try { gliding = !!player.isGliding; } catch (error) { return false; }
  if (!gliding) return false;

  const equipment = getEquipment(player);
  if (!equipment) return false;
  const off = equipment.getEquipment(EquipmentSlot.Offhand);
  if (!off || off.typeId !== "minecraft:firework_rocket") return false;

  if (!applyLookImpulse(player, FIREWORK_IMPULSE)) return false;
  try {
    const loc = player.location;
    const dir = player.getViewDirection();
    player.dimension.spawnEntity("minecraft:fireworks_rocket", {
      x: loc.x + dir.x,
      y: loc.y + 0.4,
      z: loc.z + dir.z,
    });
  } catch (error) {
    log(`ERROR: spawn firework entity: ${error}`);
  }
  try { player.playSound("firework.launch"); } catch (error) { log(`ERROR: firework sound: ${error}`); }
  consumeOffhand(player, equipment, off);
  state.lastSpecialTick = system.currentTick;
  log("firework boost");
  return true;
}

function useOffhandWindCharge(player) {
  const state = getState(player.id);
  if (system.currentTick - state.lastSpecialTick < SPECIAL_COOLDOWN_TICKS) return false;
  let gliding = false;
  try { gliding = !!player.isGliding; } catch (error) { gliding = false; }
  if (gliding) return false;

  const equipment = getEquipment(player);
  if (!equipment) return false;
  const off = equipment.getEquipment(EquipmentSlot.Offhand);
  if (!off || off.typeId !== "minecraft:wind_charge") return false;

  const loc = player.location;
  const dir = player.getViewDirection();
  try {
    const projectile = player.dimension.spawnEntity("minecraft:wind_charge_projectile", {
      x: loc.x + dir.x * 0.8,
      y: loc.y + 1.4 + dir.y * 0.8,
      z: loc.z + dir.z * 0.8,
    });
    try {
      projectile.applyImpulse({ x: dir.x * WIND_SPEED, y: dir.y * WIND_SPEED, z: dir.z * WIND_SPEED });
    } catch (error) {
      log(`ERROR: wind impulse: ${error}`);
    }
  } catch (error) {
    log(`ERROR: spawn wind charge: ${error}`);
    return false;
  }
  try { player.playSound("wind_charge.throw"); } catch (error) { log(`ERROR: wind sound: ${error}`); }
  consumeOffhand(player, equipment, off);
  state.lastSpecialTick = system.currentTick;
  log("wind charge thrown");
  return true;
}

function sendStatus(player) {
  const equipment = getEquipment(player);
  if (!equipment) {
    player.sendMessage("§c[YGP Offhand] Equipment API unavailable.");
    return;
  }
  const main = equipment.getEquipment(EquipmentSlot.Mainhand);
  const off = equipment.getEquipment(EquipmentSlot.Offhand);
  player.sendMessage(`§aMain hand: §f${describeItem(main)}`);
  player.sendMessage(`§bOffhand: §f${describeItem(off)}`);
  const level = getHeldLightLevel(main, off);
  player.sendMessage(level ? `§eHandheld light: §f${level}` : "§7No handheld light item.");
  const elytra = hasElytra(player);
  let gliding = false;
  try { gliding = !!player.isGliding; } catch (error) { log(`ERROR: isGliding: ${error}`); }
  player.sendMessage(`§dElytra: §f${elytra ? "equipped" : "none"}${gliding ? " §7(gliding)" : ""}`);
  player.sendMessage(describeOffhandSpecial(player, off));
  const riptide = getRiptideLevel(off);
  if (riptide) {
    const env = isRiptideEnvironment(player);
    player.sendMessage(env.ok ? `§bRiptide ready §7(level ${riptide}${env.underwater ? ", in water" : ", rain/water ok"})` : `§7Riptide ${riptide} needs water or rain.`);
  }
}

function sendHelp(player) {
  player.sendMessage(`§b§lYGP! True Offhand Functionality §r§av${ADDON_VERSION}`);
  player.sendMessage("§eHow to swap: §7sneak two times quickly.");
  player.sendMessage("§eHow to fly with Elytra:");
  player.sendMessage("§71. Put on Elytra.");
  player.sendMessage("§72. Put a Firework Rocket in your offhand.");
  player.sendMessage("§73. Press jump two times.");
  player.sendMessage("§74. Look up, then press jump to fly and boost.");
  player.sendMessage("§eWind Charge: §7put it in offhand, sneak, then use.");
  player.sendMessage("§eRiptide Trident: §7put a Riptide trident in offhand.");
  player.sendMessage("§7Stand in water or rain, sneak, then use.");
  player.sendMessage("§eTorch/lantern in offhand: §7gives moving light.");
}

function swapHands(player) {
  const state = getState(player.id);
  if (system.currentTick - state.lastSwapTick < SWAP_COOLDOWN_TICKS) return false;

  const equipment = getEquipment(player);
  if (!equipment) {
    player.sendMessage("§c[YGP Offhand] Equipment API unavailable.");
    return false;
  }

  let main;
  let off;
  try {
    main = equipment.getEquipment(EquipmentSlot.Mainhand);
    off = equipment.getEquipment(EquipmentSlot.Offhand);
  } catch (error) {
    log(`ERROR: read hands: ${error}`);
    return false;
  }

  if (!main && !off) {
    player.sendMessage("§7[YGP Offhand] Both hands are empty.");
    return false;
  }

  const mainCopy = cloneStack(main);
  const offCopy = cloneStack(off);
  log(`swap requested main=${describeItem(main)} off=${describeItem(off)}`);

  if (!writeOffhand(player, equipment, mainCopy)) {
    writeOffhand(player, equipment, offCopy);
    writeMainhand(player, equipment, mainCopy);
    player.sendMessage("§c[YGP Offhand] Could not place that item in the offhand.");
    log("swap failed: offhand write");
    return false;
  }

  if (!writeMainhand(player, equipment, offCopy)) {
    writeOffhand(player, equipment, offCopy);
    writeMainhand(player, equipment, mainCopy);
    player.sendMessage("§c[YGP Offhand] Swap cancelled. Items restored.");
    log("swap failed: mainhand write");
    return false;
  }

  state.lastSwapTick = system.currentTick;
  player.sendMessage(`§aSwapped. §bOffhand: §f${describeItem(mainCopy)} §8| §aMain: §f${describeItem(offCopy)}`);
  log(`swap successful main=${describeItem(offCopy)} off=${describeItem(mainCopy)}`);
  return true;
}

function isLightBlock(typeId) {
  return typeId === "minecraft:light_block" || (typeId && typeId.startsWith("minecraft:light_block"));
}

function canHoldLight(block) {
  if (!block) return false;
  try {
    if (block.isAir) return true;
    return isLightBlock(block.typeId);
  } catch (error) {
    return false;
  }
}

function clearPlacedLight(state) {
  if (state.lightDim === undefined || state.lightX === undefined) return;
  try {
    const block = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
    if (block && isLightBlock(block.typeId)) {
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
    }
  } catch (error) {
    log(`ERROR: clear light: ${error}`);
  }
  state.lightDim = undefined;
  state.lightX = undefined;
  state.lightY = undefined;
  state.lightZ = undefined;
  state.lightLevel = 0;
}

function placeLightBlock(dim, x, y, z, level) {
  const block = dim.getBlock({ x, y, z });
  if (!canHoldLight(block)) return false;
  try {
    block.setPermutation(BlockPermutation.resolve("minecraft:light_block", { block_light_level: level }));
    return true;
  } catch (error) {
    try {
      block.setPermutation(BlockPermutation.resolve(`minecraft:light_block_${level}`));
      return true;
    } catch (error2) {
      log(`ERROR: place light: ${error2}`);
      return false;
    }
  }
}

function getHeldLightLevel(main, off) {
  const offLevel = off ? LIGHT_LEVELS[off.typeId] || 0 : 0;
  const mainLevel = main ? LIGHT_LEVELS[main.typeId] || 0 : 0;
  return Math.max(offLevel, mainLevel);
}

function updatePlayerLight(player, state) {
  const equipment = getEquipment(player);
  if (!equipment) {
    clearPlacedLight(state);
    return;
  }

  let main;
  let off;
  try {
    main = equipment.getEquipment(EquipmentSlot.Mainhand);
    off = equipment.getEquipment(EquipmentSlot.Offhand);
  } catch (error) {
    clearPlacedLight(state);
    return;
  }

  const offId = off ? off.typeId : "";
  state.lastOffhandId = offId;
  const level = getHeldLightLevel(main, off);
  if (!level) {
    clearPlacedLight(state);
    return;
  }

  const dim = player.dimension;
  const x = Math.floor(player.location.x);
  let y = Math.floor(player.location.y + 0.2);
  const z = Math.floor(player.location.z);

  if (
    state.lightDim === dim &&
    state.lightX === x &&
    state.lightY === y &&
    state.lightZ === z &&
    state.lightLevel === level
  ) {
    return;
  }

  let placed = placeLightBlock(dim, x, y, z, level);
  if (!placed) {
    y += 1;
    placed = placeLightBlock(dim, x, y, z, level);
  }
  if (!placed) {
    return;
  }

  if (
    state.lightDim &&
    (state.lightDim !== dim || state.lightX !== x || state.lightY !== y || state.lightZ !== z)
  ) {
    try {
      const old = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
      if (old && isLightBlock(old.typeId)) {
        old.setPermutation(BlockPermutation.resolve("minecraft:air"));
      }
    } catch (error) {
      log(`ERROR: move light cleanup: ${error}`);
    }
  }

  state.lightDim = dim;
  state.lightX = x;
  state.lightY = y;
  state.lightZ = z;
  state.lightLevel = level;
}

function sendWelcome(player) {
  player.sendMessage(`§b§lYGP! True Offhand Functionality §r§av${ADDON_VERSION}`);
  player.sendMessage("§aSCRIPT LOADED SUCCESSFULLY");
  player.sendMessage("§7Created by YGP Studio / YGP Minecraft");
  player.sendMessage("§fYGP Minecraft: §bhttps://ygpminecraft.pages.dev/");
  player.sendMessage("§fYGP Studio: §bhttps://ygp-studio.vercel.app/");
  player.sendMessage("§fYojit Gaming Pro: §bhttps://youtube.com/@yojitgamingpro");
  player.sendMessage("§fYGP Minecraft: §bhttps://youtube.com/@ygpminecraft");
  player.sendMessage("§fYGP Tech: §bhttps://youtube.com/@ygptech_official");
  player.sendMessage("§6How to use:");
  player.sendMessage("§eSwap items: §7sneak two times quickly.");
  player.sendMessage("§eTorch or lantern in offhand: §7light follows you.");
  player.sendMessage("§eWind Charge: §7put it in offhand, sneak, then use.");
  player.sendMessage("§eRiptide Trident: §7offhand + water or rain, sneak, then use.");
  player.sendMessage("§eElytra + Firework:");
  player.sendMessage("§71. Wear Elytra and put a Firework Rocket in your offhand.");
  player.sendMessage("§72. Press jump two times.");
  player.sendMessage("§73. Look up, then press jump again to fly.");
  player.sendMessage("§cTurn OFF other offhand packs or they can block items.");
}

log("main.js evaluated");

world.afterEvents.playerSpawn.subscribe((event) => {
  try {
    const player = event.player;
    if (!player) return;
    getState(player.id);
    if (!event.initialSpawn) return;
    const state = getState(player.id);
    if (state.welcomed) return;
    state.welcomed = true;
    system.runTimeout(() => {
      try {
        sendWelcome(player);
      } catch (error) {
        log(`ERROR: welcome failed: ${error}`);
      }
    }, 40);
  } catch (error) {
    log(`ERROR: playerSpawn: ${error}`);
  }
});
log("startup event registered");

world.afterEvents.playerLeave.subscribe((event) => {
  const id = event.playerId;
  if (!id) return;
  const state = playerState.get(id);
  if (state) clearPlacedLight(state);
  playerState.delete(id);
});

if (world.afterEvents.playerDimensionChange) {
  world.afterEvents.playerDimensionChange.subscribe((event) => {
    try {
      const state = getState(event.player.id);
      clearPlacedLight(state);
    } catch (error) {
      log(`ERROR: dimension change: ${error}`);
    }
  });
}


if (world.afterEvents.weatherChange) {
  world.afterEvents.weatherChange.subscribe((event) => {
    try {
      const dim = event.dimension || "minecraft:overworld";
      weatherByDimension.set(dim, event.newWeather);
    } catch (error) {
      log(`ERROR: weatherChange: ${error}`);
    }
  });
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
  try {
    const id = event.id;
    if (id !== "ygp:swap" && id !== "ygp:status" && id !== "ygp:help" && id !== "ygp:use" && id !== "ygp:riptide") return;
    const player = event.sourceEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (id === "ygp:status") sendStatus(player);
    else if (id === "ygp:help") sendHelp(player);
    else if (id === "ygp:riptide") useOffhandRiptide(player);
    else if (id === "ygp:use") {
      if (!useOffhandFirework(player) && !useOffhandWindCharge(player)) useOffhandRiptide(player);
    } else swapHands(player);
  } catch (error) {
    log(`ERROR: scriptEvent: ${error}`);
  }
});

world.afterEvents.itemUse.subscribe((event) => {
  try {
    const player = event.source;
    if (!player) return;
    if (useOffhandFirework(player)) return;
    const used = event.itemStack ? event.itemStack.typeId : "";
    const sneaking = !!player.isSneaking;
    if (used === "minecraft:wind_charge" || sneaking) {
      if (useOffhandWindCharge(player)) return;
    }
    if (used === "minecraft:trident" || sneaking) useOffhandRiptide(player);
  } catch (error) {
    log(`ERROR: itemUse special: ${error}`);
  }
});

system.runInterval(() => {
  let players;
  try {
    players = world.getAllPlayers();
  } catch (error) {
    return;
  }

  const tick = system.currentTick;
  const doLight = tick % LIGHT_UPDATE_TICKS === 0;

  for (const player of players) {
    try {
      const state = getState(player.id);
      const sneaking = !!player.isSneaking;

      if (sneaking && !state.sneakHeld) {
        state.sneakCount += 1;
        state.sneakTimer = 0;
      }
      state.sneakHeld = sneaking;

      if (state.sneakCount > 0) {
        state.sneakTimer += 1;
        if (state.sneakTimer > SWAP_WINDOW_TICKS) {
          state.sneakCount = 0;
          state.sneakTimer = 0;
        }
      }

      if (state.sneakCount >= 2) {
        state.sneakCount = 0;
        state.sneakTimer = 0;
        swapHands(player);
      }

      let jumping = false;
      try { jumping = !!player.isJumping; } catch (error) { jumping = false; }
      if (jumping && !state.jumpHeld) useOffhandFirework(player);
      state.jumpHeld = jumping;

      if (doLight) updatePlayerLight(player, state);
    } catch (error) {
      log(`ERROR: tick: ${error}`);
    }
  }
}, 1);

system.run(() => {
  log("Script loaded successfully");
});
