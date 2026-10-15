/**
 * Vanilla Quality of Life — Comprehensive Survival QoL Suite
 * Created by AllensCreations — MCPE Curseforges
 *
 * Integrated Capabilities:
 * 1. Offhand Utility Quick-Swap (Double-sneak / Sneak + Use in air / /scriptevent qol:swap)
 * 2. Real-Time Dynamic Handheld & Offhand Lighting (Torches, Lanterns via light_block)
 * 3. Passive Auto-Switch Tools (Intelligent Slot 1 tool & weapon switcher)
 * 4. Smart Tree Capitator (Sneak-axe felling with 5x5 footprint & downward stump sweep)
 * 5. Domino Ore Miner (Sneak-pickaxe contiguous 26-neighbor ore vein mining)
 * 6. Durability Safety Guard (Automatic tool protection stopping at 5 durability)
 *
 * Target: Minecraft Bedrock 1.21+ / Script API @minecraft/server 1.13.0+
 */

import { world, system, EquipmentSlot, ItemStack, BlockPermutation } from "@minecraft/server";

const VERSION = "1.3.0";
const LOG_PREFIX = "[Vanilla QoL]";

// ─── Configuration ────────────────────────────────────────────────────────────

const CONFIG = {
  // Offhand Quick-Swap & Dynamic Light
  SWAP_WINDOW_TICKS: 14,
  SWAP_COOLDOWN_TICKS: 8,
  LIGHT_UPDATE_TICKS: 4,

  // Passive Auto-Switch Tools (Slot 1)
  AUTO_SWITCH_SLOT: 0, // Slot 1 in UI (0-indexed)
  SWITCH_MARGIN: 3,
  LOW_DURABILITY_USES: 15,
  LOW_DURABILITY_PENALTY: 100,
  RAYCAST_DISTANCE: 6,
  RETRY_TICKS: 2,
  COMBAT_COOLDOWN_TICKS: 10,
  WEB_CHECK_INTERVAL: 2,
  WEB_INTERACTION_WINDOW: 12,
  WEB_COMBAT_COOLDOWN: 40,

  // Smart Tree Capitator
  TREE_CAPITATOR_ENABLED: true,
  MAX_TREE_BLOCKS: 128,
  MAX_TREE_HEIGHT: 320,
  TREE_HORIZONTAL_RANGE: 2, // 5x5 footprint (~2 to ~-2)
  TREE_DOWNWARD_RANGE: 2,   // dy: -1..-2 stump sweep
  MATCH_TREE_SPECIES: true,

  // Domino Ore Miner
  DOMINO_ORE_MINER_ENABLED: true,
  MAX_ORE_CLUSTER_SIZE: 64,
  INSTANT_BURST: true,
  NETHER_GOLD_POLICY: "nether_gold",

  // Durability Safety Guard
  DURABILITY_SAFETY_THRESHOLD: 5,
  ALERT_SOUND: "note.bass",
  ALERT_PITCH: 0.7,
  ALERT_VOLUME: 1.0,
};

// ─── Offhand & Dynamic Light Constants ───────────────────────────────────────

const SUPPORTED_OFFHAND_ITEMS = new Set([
  "minecraft:torch",
  "minecraft:soul_torch",
  "minecraft:lantern",
  "minecraft:soul_lantern",
  "minecraft:clock",
  "minecraft:compass",
  "minecraft:recovery_compass",
]);

const LIGHT_LEVELS = {
  "minecraft:torch": 14,
  "minecraft:soul_torch": 10,
  "minecraft:lantern": 15,
  "minecraft:soul_lantern": 10,
};

/** @type {Map<string, any>} */
const qolPlayerState = new Map();

function getQolState(id) {
  let state = qolPlayerState.get(id);
  if (!state) {
    state = {
      sneakHeld: false,
      sneakCount: 0,
      sneakTimer: 0,
      lastSwapTick: -9999,
      lightDim: undefined,
      lightX: undefined,
      lightY: undefined,
      lightZ: undefined,
      lightLevel: 0,
    };
    qolPlayerState.set(id, state);
  }
  return state;
}

function shortId(typeId) {
  return typeId && typeId.startsWith("minecraft:") ? typeId.slice("minecraft:".length) : typeId;
}

function describeItem(item) {
  if (!item) return "Empty";
  const name = item.nameTag ? `"${item.nameTag}"` : shortId(item.typeId);
  return item.amount > 1 ? `${name} x${item.amount}` : name;
}

function getEquipment(player) {
  try {
    return player.getComponent("minecraft:equippable") || player.getComponent("equippable");
  } catch (e) {
    return undefined;
  }
}

function getContainer(player) {
  try {
    const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    return inv ? inv.container : undefined;
  } catch (e) {
    return undefined;
  }
}

function cloneStack(item) {
  if (!item) return undefined;
  try {
    if (typeof item.clone === "function") return item.clone();
  } catch (e) {}
  try {
    const copy = new ItemStack(item.typeId, item.amount);
    if (item.nameTag) copy.nameTag = item.nameTag;
    return copy;
  } catch (e) {
    return undefined;
  }
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
  for (const cmd of commands) {
    try {
      player.runCommand(cmd);
    } catch (e) {}
  }
}

function writeOffhand(player, equipment, item) {
  if (item) {
    try {
      const copy = cloneStack(item);
      equipment.setEquipment(EquipmentSlot.Offhand, copy);
      if (offhandMatches(equipment, item)) return true;
    } catch (e) {}
  } else {
    try {
      equipment.setEquipment(EquipmentSlot.Offhand, undefined);
      if (offhandMatches(equipment, undefined)) return true;
    } catch (e) {}
  }
  forceOffhand(player, item);
  return offhandMatches(equipment, item);
}

function writeMainhand(player, equipment, item) {
  try {
    const accepted = equipment.setEquipment(EquipmentSlot.Mainhand, item ? cloneStack(item) : undefined);
    if (accepted !== false) return true;
  } catch (e) {}
  try {
    const container = getContainer(player);
    if (container) {
      container.setItem(player.selectedSlotIndex, item ? cloneStack(item) : undefined);
      return true;
    }
  } catch (e) {}
  return false;
}

function swapHands(player) {
  const state = getQolState(player.id);
  if (system.currentTick - state.lastSwapTick < CONFIG.SWAP_COOLDOWN_TICKS) return false;

  const equipment = getEquipment(player);
  if (!equipment) return false;

  let main;
  let off;
  try {
    main = equipment.getEquipment(EquipmentSlot.Mainhand);
    off = equipment.getEquipment(EquipmentSlot.Offhand);
  } catch (e) {
    return false;
  }

  const mainAllowed = main && SUPPORTED_OFFHAND_ITEMS.has(main.typeId);
  const offAllowed = off && SUPPORTED_OFFHAND_ITEMS.has(off.typeId);

  if (!mainAllowed && !offAllowed) {
    return false;
  }

  const mainCopy = cloneStack(main);
  const offCopy = cloneStack(off);

  if (!writeOffhand(player, equipment, mainCopy)) {
    writeOffhand(player, equipment, offCopy);
    writeMainhand(player, equipment, mainCopy);
    return false;
  }

  if (!writeMainhand(player, equipment, offCopy)) {
    writeOffhand(player, equipment, offCopy);
    writeMainhand(player, equipment, mainCopy);
    return false;
  }

  state.lastSwapTick = system.currentTick;

  try {
    player.playSound("armor.equip_generic", { pitch: 1.15, volume: 0.85 });
    player.onScreenDisplay.setActionBar(
      `§6Offhand: §f${describeItem(mainCopy)} §8| §eMain: §f${describeItem(offCopy)}`
    );
  } catch (e) {}

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
  } catch (e) {
    return false;
  }
}

function clearPlacedLight(state) {
  if (!state || state.lightDim === undefined || state.lightX === undefined) return;
  try {
    const block = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
    if (block && isLightBlock(block.typeId)) {
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
    }
  } catch (e) {}
  state.lightDim = undefined;
  state.lightX = undefined;
  state.lightY = undefined;
  state.lightZ = undefined;
  state.lightLevel = 0;
}

function placeLightBlock(dim, x, y, z, level) {
  try {
    const block = dim.getBlock({ x, y, z });
    if (!canHoldLight(block)) return false;
    try {
      block.setPermutation(BlockPermutation.resolve("minecraft:light_block", { block_light_level: level }));
      return true;
    } catch {
      try {
        block.setPermutation(BlockPermutation.resolve(`minecraft:light_block_${level}`));
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
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
  } catch (e) {
    clearPlacedLight(state);
    return;
  }

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
  if (!placed) return;

  if (
    state.lightDim &&
    (state.lightDim !== dim || state.lightX !== x || state.lightY !== y || state.lightZ !== z)
  ) {
    try {
      const old = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
      if (old && isLightBlock(old.typeId)) {
        old.setPermutation(BlockPermutation.resolve("minecraft:air"));
      }
    } catch (e) {}
  }

  state.lightDim = dim;
  state.lightX = x;
  state.lightY = y;
  state.lightZ = z;
  state.lightLevel = level;
}

// ─── Passive Auto-Switch Tools Engine ─────────────────────────────────────────

const ToolCategory = {
  PICKAXE: "pickaxe",
  AXE: "axe",
  SHOVEL: "shovel",
  LEAVES: "leaves",
  WEB: "web",
  SHEARS_OR_SWORD: "shears_or_sword",
  HOE: "hoe",
  WEAPON: "weapon",
};

const TIER_SCORES = {
  netherite: 50,
  diamond: 40,
  iron: 30,
  stone: 20,
  golden: 15,
  gold: 15,
  wooden: 10,
  wood: 10,
};

const IGNORED_BLOCKS = new Set([
  "air", "cave_air", "void_air", "water", "flowing_water", "lava", "flowing_lava",
  "bedrock", "barrier", "structure_void", "light_block", "portal", "end_portal",
  "end_portal_frame", "end_gateway",
]);

const NON_COMBAT_ENTITIES = new Set([
  "item", "arrow", "spectral_arrow", "xp_orb", "experience_orb", "snowball", "egg",
  "splash_potion", "lingering_potion", "ender_pearl", "eye_of_ender_signal",
  "lightning_bolt", "armor_stand", "painting", "item_frame", "glow_item_frame",
  "leash_knot", "boat", "chest_boat", "minecart", "chest_minecart", "hopper_minecart",
  "tnt_minecart", "command_block_minecart", "tnt", "falling_block",
]);

const recentCombat = new Map();
const pendingSwaps = new Map();
const webInteraction = new Map();

function normalizeId(id) {
  return (id ?? "").replace(/^minecraft:/, "").toLowerCase();
}

function getMaterialTier(id) {
  for (const [tier, score] of Object.entries(TIER_SCORES)) {
    if (id.includes(tier)) return score;
  }
  return 0;
}

function readDurability(item) {
  try {
    const dur = item?.getComponent("minecraft:durability") || item?.getComponent("durability");
    if (!dur) return null;
    const max = dur.maxDurability;
    const damage = dur.damage;
    return {
      remaining: Math.max(0, max - damage),
      fraction: max > 0 ? (max - damage) / max : 1,
    };
  } catch {
    return null;
  }
}

function readEnchantments(item) {
  const result = { efficiency: 0, fortune: 0, silk: 0, sharpness: 0 };
  try {
    const enchants = item?.getComponent("minecraft:enchantable") || item?.getComponent("enchantable");
    if (!enchants) return result;
    for (const ench of enchants.getEnchantments()) {
      const type = (ench.type?.id || ench.id || "").toLowerCase();
      if (type.includes("efficiency")) result.efficiency = ench.level;
      if (type.includes("fortune")) result.fortune = ench.level;
      if (type.includes("silk_touch")) result.silk = ench.level;
      if (type.includes("sharpness")) result.sharpness = ench.level;
    }
  } catch {}
  return result;
}

function scoreItem(item, category, slot, blockId) {
  if (!item?.typeId) return -Infinity;
  const id = normalizeId(item.typeId);
  let score = 0;

  switch (category) {
    case ToolCategory.PICKAXE:
      if (!id.endsWith("_pickaxe")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.AXE:
      if (!id.endsWith("_axe")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.SHOVEL:
      if (!id.endsWith("_shovel")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.HOE:
      if (!id.endsWith("_hoe")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.LEAVES:
      if (id.includes("shears")) score = 100;
      else if (id.endsWith("_hoe")) score = 50 + getMaterialTier(id);
      else if (id.endsWith("_sword")) score = 20 + getMaterialTier(id);
      else return -Infinity;
      break;
    case ToolCategory.WEB:
      if (id.includes("shears")) score = 100;
      else if (id.endsWith("_sword")) score = 50 + getMaterialTier(id);
      else return -Infinity;
      break;
    case ToolCategory.SHEARS_OR_SWORD:
      if (id.includes("shears")) score = 100;
      else if (id.endsWith("_sword")) score = 50 + getMaterialTier(id);
      else return -Infinity;
      break;
    case ToolCategory.WEAPON:
      if (id.endsWith("_sword")) score = 100 + getMaterialTier(id);
      else if (id.endsWith("_axe")) score = 80 + getMaterialTier(id);
      else if (id.endsWith("_mace")) score = 90;
      else return -Infinity;
      break;
    default:
      return -Infinity;
  }

  const enchants = readEnchantments(item);
  score += enchants.efficiency * 2;
  score += enchants.sharpness * 3;

  if (category === ToolCategory.PICKAXE && blockId) {
    if (blockId.endsWith("_ore")) {
      score += enchants.fortune * 1.5;
      if (enchants.silk > 0) score -= 8;
    }
  }

  const durability = readDurability(item);
  if (durability) {
    if (durability.remaining <= CONFIG.LOW_DURABILITY_USES) {
      score -= CONFIG.LOW_DURABILITY_PENALTY;
    } else {
      score += durability.fraction;
    }
  }

  return score;
}

function getRequiredToolCategory(typeId) {
  if (!typeId) return null;
  const id = normalizeId(typeId);
  if (IGNORED_BLOCKS.has(id)) return null;

  if (id === "web" || id.includes("cobweb")) return ToolCategory.WEB;

  if (
    id.endsWith("concrete_powder") || id.includes("sand") || id.includes("gravel") ||
    id.includes("clay") || id.includes("dirt") || id === "grass_block" ||
    id.includes("podzol") || id.includes("mycelium") || id.includes("farmland") ||
    id.includes("mud") || id.includes("soul_soil") || id.includes("snow")
  ) {
    return ToolCategory.SHOVEL;
  }

  if (id === "ender_chest") return ToolCategory.PICKAXE;
  if (id.includes("leaves")) return ToolCategory.LEAVES;

  if (
    id.includes("wool") || id.includes("vine") || id.includes("fern") ||
    id === "tallgrass" || id === "seagrass" || id === "hanging_roots" ||
    id === "deadbush" || id === "tripwire"
  ) {
    return ToolCategory.SHEARS_OR_SWORD;
  }

  if (
    id === "hay_block" || id === "target" || id === "sponge" || id === "wet_sponge" ||
    id.includes("sculk") || id.includes("moss_block") || id.includes("moss_carpet") ||
    id.includes("wart_block") || id === "shroomlight"
  ) {
    return ToolCategory.HOE;
  }

  if (
    id.endsWith("_log") || id.endsWith("_wood") || id.endsWith("_stem") || id.endsWith("_hyphae") ||
    id.startsWith("stripped_") || id.includes("planks") || id.includes("crafting_table") ||
    id.includes("cartography_table") || id.includes("fletching_table") || id.includes("smithing_table") ||
    id.includes("loom") || id.includes("composter") || id === "chest" || id === "trapped_chest" ||
    id === "barrel" || id.includes("bookshelf") || id === "lectern" || id.includes("pumpkin") ||
    id.includes("melon") || id === "cocoa" || id.includes("beehive") || id === "bee_nest" ||
    id.includes("ladder") || id.includes("sign") || id.includes("mushroom_stem") ||
    id.includes("mushroom_block") || id === "jukebox" || id === "daylight_detector" ||
    id === "note_block" || id.includes("bamboo_block") || id.includes("bamboo_mosaic") ||
    (id.endsWith("_fence") && !id.includes("nether_brick")) || id.endsWith("_fence_gate")
  ) {
    return ToolCategory.AXE;
  }

  const woodMaterials = [
    "oak", "spruce", "birch", "jungle", "acacia", "dark_oak",
    "mangrove", "cherry", "bamboo", "crimson", "warped", "pale_oak",
  ];
  if (
    woodMaterials.some((mat) => id.includes(mat)) && !id.includes("petrified") &&
    (id.endsWith("_door") || id.endsWith("_trapdoor") || id.endsWith("_button") ||
     id.endsWith("_pressure_plate") || id.endsWith("_stairs") || id.endsWith("_slab"))
  ) {
    return ToolCategory.AXE;
  }

  if (
    id.includes("stone") || id.includes("cobble") || id.includes("deepslate") ||
    id.includes("ore") || id.includes("granite") || id.includes("diorite") ||
    id.includes("andesite") || id.includes("tuff") || id.includes("calcite") ||
    id.includes("basalt") || id.includes("blackstone") || id.includes("obsidian") ||
    id.includes("ancient_debris") || id.includes("brick") || id.includes("terracotta") ||
    (id.includes("concrete") && !id.endsWith("concrete_powder")) || id.includes("sandstone") ||
    id.includes("prismarine") || id.includes("netherrack") || id.includes("end_stone") ||
    id.includes("purpur") || id.includes("magma") || id.includes("copper") ||
    id.includes("iron") || id.includes("gold") || id.includes("diamond") ||
    id.includes("emerald") || id.includes("lapis") || id.includes("redstone") ||
    id.includes("netherite") || id.includes("amethyst") || id.includes("dripstone") ||
    id.includes("furnace") || id.includes("smoker") || id.includes("hopper") ||
    id.includes("dispenser") || id.includes("dropper") || id.includes("cauldron") ||
    id.includes("anvil") || id.includes("enchanting_table") || id.includes("brewing_stand") ||
    id.includes("grindstone") || id.includes("stonecutter") || id.includes("bell") ||
    id.includes("lantern") || id.includes("chain") || id.includes("spawner") ||
    id.includes("vault") || id.includes("crafter")
  ) {
    return ToolCategory.PICKAXE;
  }

  return null;
}

function switchPlayerSlot1Tool(player, category, blockTypeId) {
  if (!player || player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) {
    return false;
  }

  const container = getContainer(player);
  if (!container) return false;

  const blockId = normalizeId(blockTypeId);
  const currentScore = scoreItem(container.getItem(CONFIG.AUTO_SWITCH_SLOT), category, CONFIG.AUTO_SWITCH_SLOT, blockId);

  let bestSlot = -1;
  let bestScore = -Infinity;

  for (let slot = 1; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (!item) continue;
    const score = scoreItem(item, category, slot, blockId);
    if (score > bestScore) {
      bestScore = score;
      bestSlot = slot;
    }
  }

  if (bestSlot === -1 || bestScore === -Infinity) return false;
  if (currentScore !== -Infinity && bestScore < currentScore + CONFIG.SWITCH_MARGIN) return false;

  try {
    container.swapItems(bestSlot, CONFIG.AUTO_SWITCH_SLOT, container);
    return true;
  } catch {
    return false;
  }
}

function isCombatTarget(entity) {
  if (!entity?.typeId) return false;
  const id = normalizeId(entity.typeId);
  if (NON_COMBAT_ENTITIES.has(id)) return false;
  try {
    return id === "player" || !!entity.getComponent("minecraft:health");
  } catch {
    return false;
  }
}

function isWeb(block) {
  if (!block?.typeId) return false;
  const id = normalizeId(block.typeId);
  return id === "web" || id.includes("cobweb");
}

function blockKey(block) {
  if (!block) return "";
  const { x, y, z } = block.location;
  return `${block.typeId}@${x},${y},${z}`;
}

function clearPendingSwap(playerId) {
  const runId = pendingSwaps.get(playerId);
  if (runId !== undefined) {
    system.clearRun(runId);
    pendingSwaps.delete(playerId);
  }
}

function scheduleSwapRetry(player, category, blockTypeId) {
  clearPendingSwap(player.id);
  const runId = system.runTimeout(() => {
    pendingSwaps.delete(player.id);
    try {
      if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) return;
      switchPlayerSlot1Tool(player, category, blockTypeId);
    } catch {}
  }, CONFIG.RETRY_TICKS);
  pendingSwaps.set(player.id, runId);
}

function getTargetBlock(player) {
  try {
    return player.getBlockFromViewDirection({
      maxDistance: CONFIG.RAYCAST_DISTANCE,
      includeLiquidBlocks: false,
      includePassableBlocks: true,
    })?.block;
  } catch {
    return undefined;
  }
}

// ─── Durability Safety Protection Helper ──────────────────────────────────────

function getMainhandTool(player) {
  try {
    const eq = getEquipment(player);
    return eq ? eq.getEquipment(EquipmentSlot.Mainhand) : undefined;
  } catch (e) {
    return undefined;
  }
}

function checkToolSafety(player) {
  const tool = getMainhandTool(player);
  if (!tool) return { safe: true, remaining: 9999 };

  try {
    const durComp = tool.getComponent("minecraft:durability") || tool.getComponent("durability");
    if (!durComp) return { safe: true, remaining: 9999 };

    const remaining = durComp.maxDurability - durComp.damage;
    if (remaining <= CONFIG.DURABILITY_SAFETY_THRESHOLD) {
      return { safe: false, remaining };
    }
    return { safe: true, remaining };
  } catch (e) {
    return { safe: true, remaining: 9999 };
  }
}

function applyToolDurabilityDamage(player) {
  const eq = getEquipment(player);
  if (!eq) return;

  const tool = eq.getEquipment(EquipmentSlot.Mainhand);
  if (!tool) return;

  try {
    const durComp = tool.getComponent("minecraft:durability") || tool.getComponent("durability");
    if (!durComp) return;

    let unbreakingLevel = 0;
    try {
      const enchComp = tool.getComponent("minecraft:enchantable") || tool.getComponent("enchantable");
      if (enchComp) {
        for (const ench of enchComp.getEnchantments()) {
          const enchId = (ench.type?.id || ench.id || "").toLowerCase();
          if (enchId.includes("unbreaking")) {
            unbreakingLevel = ench.level;
            break;
          }
        }
      }
    } catch (e) {}

    const shouldDamage = unbreakingLevel > 0
      ? Math.random() < 1 / (unbreakingLevel + 1)
      : true;

    if (shouldDamage) {
      durComp.damage += 1;
      eq.setEquipment(EquipmentSlot.Mainhand, tool);
    }
  } catch (e) {}
}

function notifyToolProtection(player, remainingDurability) {
  try {
    player.playSound(CONFIG.ALERT_SOUND, {
      pitch: CONFIG.ALERT_PITCH,
      volume: CONFIG.ALERT_VOLUME,
    });
    player.onScreenDisplay.setActionBar(
      `§e[Tool Protection] §cStopped mining to save tool! §6(${remainingDurability} durability left)`
    );
  } catch (e) {}
}

// ─── Smart Tree Capitator Engine ──────────────────────────────────────────────

const AXE_IDENTIFIERS = new Set([
  "minecraft:wooden_axe", "minecraft:stone_axe", "minecraft:iron_axe",
  "minecraft:golden_axe", "minecraft:diamond_axe", "minecraft:netherite_axe",
]);

function isAxe(typeId) {
  if (!typeId) return false;
  return AXE_IDENTIFIERS.has(typeId) || typeId.endsWith("_axe");
}

const ELIGIBLE_LOGS = new Set([
  "minecraft:oak_log", "minecraft:stripped_oak_log", "minecraft:oak_wood", "minecraft:stripped_oak_wood",
  "minecraft:spruce_log", "minecraft:stripped_spruce_log", "minecraft:spruce_wood", "minecraft:stripped_spruce_wood",
  "minecraft:birch_log", "minecraft:stripped_birch_log", "minecraft:birch_wood", "minecraft:stripped_birch_wood",
  "minecraft:jungle_log", "minecraft:stripped_jungle_log", "minecraft:jungle_wood", "minecraft:stripped_jungle_wood",
  "minecraft:acacia_log", "minecraft:stripped_acacia_log", "minecraft:acacia_wood", "minecraft:stripped_acacia_wood",
  "minecraft:dark_oak_log", "minecraft:stripped_dark_oak_log", "minecraft:dark_oak_wood", "minecraft:stripped_dark_oak_wood",
  "minecraft:mangrove_log", "minecraft:stripped_mangrove_log", "minecraft:mangrove_wood", "minecraft:stripped_mangrove_wood",
  "minecraft:mangrove_roots", "minecraft:muddy_mangrove_roots",
  "minecraft:cherry_log", "minecraft:stripped_cherry_log", "minecraft:cherry_wood", "minecraft:stripped_cherry_wood",
  "minecraft:pale_oak_log", "minecraft:stripped_pale_oak_log", "minecraft:pale_oak_wood", "minecraft:stripped_pale_oak_wood",
  "minecraft:crimson_stem", "minecraft:stripped_crimson_stem", "minecraft:crimson_hyphae", "minecraft:stripped_crimson_hyphae",
  "minecraft:warped_stem", "minecraft:stripped_warped_stem", "minecraft:warped_hyphae", "minecraft:stripped_warped_hyphae",
]);

function isEligibleLog(blockId) {
  if (!blockId) return false;
  if (ELIGIBLE_LOGS.has(blockId)) return true;
  return /(log|wood|stem|hyphae|mangrove_roots)$/i.test(blockId);
}

function getWoodSpecies(typeId) {
  if (!typeId) return null;
  const match = typeId.match(/(dark_oak|pale_oak|oak|spruce|birch|jungle|acacia|mangrove|cherry|crimson|warped)/i);
  return match ? match[1].toLowerCase() : null;
}

function isMatchingLog(blockId, targetSpecies) {
  if (!isEligibleLog(blockId)) return false;
  if (!CONFIG.MATCH_TREE_SPECIES || !targetSpecies) return true;
  const species = getWoodSpecies(blockId);
  return !species || species === targetSpecies;
}

function executeTreeCapitator(player, dimension, startLoc, startBlockId, onComplete) {
  if (typeof startBlockId === "function") {
    onComplete = startBlockId;
    startBlockId = null;
  }
  if (!CONFIG.TREE_CAPITATOR_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const targetSpecies = startBlockId ? getWoodSpecies(startBlockId) : null;
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const blocksToBreak = [];
  let currentFootprints = [{ x: startLoc.x, z: startLoc.z }];

  // Downward search for stumps & roots (dy = -1 down to -CONFIG.TREE_DOWNWARD_RANGE)
  for (let dy = -1; dy >= -CONFIG.TREE_DOWNWARD_RANGE; dy--) {
    const layerY = startLoc.y + dy;
    let foundBelow = false;

    for (let dx = -CONFIG.TREE_HORIZONTAL_RANGE; dx <= CONFIG.TREE_HORIZONTAL_RANGE; dx++) {
      for (let dz = -CONFIG.TREE_HORIZONTAL_RANGE; dz <= CONFIG.TREE_HORIZONTAL_RANGE; dz++) {
        const bx = startLoc.x + dx;
        const bz = startLoc.z + dz;
        const key = `${bx},${layerY},${bz}`;
        if (visited.has(key)) continue;
        visited.add(key);

        try {
          const block = dimension.getBlock({ x: bx, y: layerY, z: bz });
          if (block && isMatchingLog(block.typeId, targetSpecies)) {
            blocksToBreak.push({ x: bx, y: layerY, z: bz });
            foundBelow = true;
            if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
          }
        } catch (e) {}
      }
      if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
    }
    if (!foundBelow) break;
  }

  // Layer 0: Horizontal perimeter neighbors (~2 to ~-2)
  for (let dx = -CONFIG.TREE_HORIZONTAL_RANGE; dx <= CONFIG.TREE_HORIZONTAL_RANGE; dx++) {
    for (let dz = -CONFIG.TREE_HORIZONTAL_RANGE; dz <= CONFIG.TREE_HORIZONTAL_RANGE; dz++) {
      if (dx === 0 && dz === 0) continue;
      const nx = startLoc.x + dx;
      const nz = startLoc.z + dz;
      const key = `${nx},${startLoc.y},${nz}`;
      if (visited.has(key)) continue;
      visited.add(key);

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: startLoc.y, z: nz });
        if (neighborBlock && isMatchingLog(neighborBlock.typeId, targetSpecies)) {
          blocksToBreak.push({ x: nx, y: startLoc.y, z: nz });
          currentFootprints.push({ x: nx, z: nz });
          if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
        }
      } catch (e) {}
    }
    if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
  }

  // Upper Layers: Expanded 5x5 footprint upward (~2 to ~-2)
  for (let dy = 1; dy <= CONFIG.MAX_TREE_HEIGHT; dy++) {
    if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
    if (currentFootprints.length === 0) break;

    const nextFootprints = [];
    const layerY = startLoc.y + dy;

    const uniqueCenters = [];
    const centerKeys = new Set();
    for (const fp of currentFootprints) {
      const ck = `${fp.x},${fp.z}`;
      if (!centerKeys.has(ck)) {
        centerKeys.add(ck);
        uniqueCenters.push(fp);
      }
    }

    let foundInLayer = false;

    for (const center of uniqueCenters) {
      if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;

      for (let dx = -CONFIG.TREE_HORIZONTAL_RANGE; dx <= CONFIG.TREE_HORIZONTAL_RANGE; dx++) {
        for (let dz = -CONFIG.TREE_HORIZONTAL_RANGE; dz <= CONFIG.TREE_HORIZONTAL_RANGE; dz++) {
          const bx = center.x + dx;
          const bz = center.z + dz;
          const key = `${bx},${layerY},${bz}`;

          if (visited.has(key)) continue;
          visited.add(key);

          try {
            const block = dimension.getBlock({ x: bx, y: layerY, z: bz });
            if (block && isMatchingLog(block.typeId, targetSpecies)) {
              blocksToBreak.push({ x: bx, y: layerY, z: bz });
              nextFootprints.push({ x: bx, z: bz });
              foundInLayer = true;
              if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
            }
          } catch (e) {}
        }
        if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
      }
    }

    if (!foundInLayer) break;
    currentFootprints = nextFootprints;
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  // Break felled logs
  for (const pos of blocksToBreak) {
    if (!player || !player.isValid()) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    try {
      dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air destroy`);
      applyToolDurabilityDamage(player);
    } catch (err) {}
  }

  if (onComplete) onComplete();
}

// ─── Domino Ore Miner Engine ──────────────────────────────────────────────────

const PICKAXE_TIERS = {
  "minecraft:wooden_axe": 1,
  "minecraft:golden_axe": 1,
  "minecraft:wooden_pickaxe": 1,
  "minecraft:golden_pickaxe": 1,
  "minecraft:stone_pickaxe": 2,
  "minecraft:iron_pickaxe": 3,
  "minecraft:diamond_pickaxe": 4,
  "minecraft:netherite_pickaxe": 5,
};

function isPickaxe(typeId) {
  if (!typeId) return false;
  return Boolean(PICKAXE_TIERS[typeId]) || typeId.endsWith("_pickaxe");
}

function getPickaxeTier(typeId) {
  return PICKAXE_TIERS[typeId] || (typeId?.endsWith("_pickaxe") ? 3 : 0);
}

const ORE_DEFINITIONS = {
  "minecraft:coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:deepslate_coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:deepslate_iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:deepslate_copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:deepslate_lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:deepslate_gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:nether_gold_ore": { category: CONFIG.NETHER_GOLD_POLICY, minTier: 1, dropItem: "minecraft:gold_nugget", minDrop: 2, maxDrop: 6 },
  "minecraft:redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:deepslate_diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:deepslate_emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:nether_quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:ancient_debris": { category: "ancient_debris", minTier: 4, dropItem: "minecraft:ancient_debris" },
};

function getOreInfo(blockId) {
  if (!blockId) return null;
  return ORE_DEFINITIONS[blockId] || null;
}

const NEIGHBOR_OFFSETS_26 = (() => {
  const offsets = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        offsets.push({ dx, dy, dz });
      }
    }
  }
  return offsets;
})();

function calculateFortuneDropCount(fortuneLevel, minBase = 1, maxBase = 1) {
  const baseCount = minBase === maxBase
    ? minBase
    : Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;
  if (fortuneLevel <= 0) return baseCount;
  const multiplier = Math.max(1, Math.floor(Math.random() * (fortuneLevel + 2)));
  return Math.min(baseCount * multiplier, 64);
}

function executeDominoOreMiner(player, dimension, startLoc, startBlockId, onComplete) {
  if (!CONFIG.DOMINO_ORE_MINER_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const startOreInfo = getOreInfo(startBlockId);
  if (!startOreInfo) {
    if (onComplete) onComplete();
    return;
  }

  const targetCategory = startOreInfo.category;
  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const blocksToBreak = [];

  while (queue.length > 0 && blocksToBreak.length < CONFIG.MAX_ORE_CLUSTER_SIZE) {
    const current = queue.shift();

    for (const offset of NEIGHBOR_OFFSETS_26) {
      if (blocksToBreak.length >= CONFIG.MAX_ORE_CLUSTER_SIZE) break;

      const nx = current.x + offset.dx;
      const ny = current.y + offset.dy;
      const nz = current.z + offset.dz;
      const key = `${nx},${ny},${nz}`;

      if (visited.has(key)) continue;
      visited.add(key);

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: ny, z: nz });
        if (!neighborBlock) continue;

        const neighborInfo = getOreInfo(neighborBlock.typeId);
        if (!neighborInfo) continue;

        if (neighborInfo.category === targetCategory) {
          const loc = { x: nx, y: ny, z: nz, typeId: neighborBlock.typeId };
          blocksToBreak.push(loc);
          queue.push(loc);
        }
      } catch (e) {}
    }
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  const tool = getMainhandTool(player);
  const toolTypeId = tool?.typeId;
  const toolTier = getPickaxeTier(toolTypeId);

  let hasSilkTouch = false;
  let fortuneLevel = 0;

  try {
    const enchantable = tool?.getComponent("minecraft:enchantable") || tool?.getComponent("enchantable");
    if (enchantable) {
      for (const ench of enchantable.getEnchantments()) {
        const enchId = (ench.type?.id || ench.id || "").toLowerCase();
        if (enchId.includes("silk_touch")) hasSilkTouch = true;
        if (enchId.includes("fortune")) fortuneLevel = Math.max(fortuneLevel, ench.level);
      }
    }
  } catch (e) {}

  for (const blockData of blocksToBreak) {
    if (!player || !player.isValid()) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    const oreInfo = getOreInfo(blockData.typeId);
    if (!oreInfo) continue;

    if (toolTier < oreInfo.minTier) break;

    try {
      if (hasSilkTouch) {
        dimension.runCommand(`setblock ${blockData.x} ${blockData.y} ${blockData.z} air`);
        dimension.spawnItem(new ItemStack(blockData.typeId, 1), {
          x: blockData.x + 0.5,
          y: blockData.y + 0.5,
          z: blockData.z + 0.5,
        });
      } else {
        const dropId = oreInfo.dropItem;
        if (dropId) {
          const count = calculateFortuneDropCount(
            fortuneLevel,
            oreInfo.minDrop || 1,
            oreInfo.maxDrop || 1
          );
          dimension.runCommand(`setblock ${blockData.x} ${blockData.y} ${blockData.z} air`);
          dimension.spawnItem(new ItemStack(dropId, count), {
            x: blockData.x + 0.5,
            y: blockData.y + 0.5,
            z: blockData.z + 0.5,
          });
        } else {
          dimension.runCommand(`setblock ${blockData.x} ${blockData.y} ${blockData.z} air destroy`);
        }
      }
      applyToolDurabilityDamage(player);
    } catch (err) {}
  }

  if (onComplete) onComplete();
}

// ─── Event Subscriptions & Global Dispatcher ──────────────────────────────────

const activeMiningOperations = new Set();

// 1. Offhand Sneak + Use/Tap in Air Quick-Swap
world.beforeEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const itemStack = event.itemStack;

  if (!player || !player.isSneaking) return;
  if (!itemStack || !SUPPORTED_OFFHAND_ITEMS.has(itemStack.typeId)) return;

  event.cancel = true;
  system.run(() => {
    swapHands(player);
  });
});

// 2. Passive Auto-Switch: Ordinary blocks via hit block
world.afterEvents.entityHitBlock.subscribe((event) => {
  try {
    const player = event.damagingEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) return;

    const block = event.hitBlock;
    if (!block) return;

    const category = getRequiredToolCategory(block.typeId);
    if (!category) return;

    const now = system.currentTick;
    const lastCombat = recentCombat.get(player.id) ?? -Infinity;
    if (now - lastCombat < CONFIG.COMBAT_COOLDOWN_TICKS) return;

    webInteraction.set(player.id, {
      key: blockKey(block),
      lastInteractionTick: now,
    });

    if (!switchPlayerSlot1Tool(player, category, block.typeId)) {
      scheduleSwapRetry(player, category, block.typeId);
    }
  } catch (e) {}
});

// 3. Passive Auto-Switch: Mob combat weapon switch
world.afterEvents.entityHitEntity.subscribe((event) => {
  try {
    const player = event.damagingEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) return;
    if (!isCombatTarget(event.hitEntity)) return;

    recentCombat.set(player.id, system.currentTick);
    clearPendingSwap(player.id);
    webInteraction.delete(player.id);

    switchPlayerSlot1Tool(player, ToolCategory.WEAPON);
  } catch (e) {}
});

// 4. Sneak Block Break: Smart Tree Capitator & Domino Ore Miner
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, player, dimension, itemStackBeforeBreak } = event;

  if (!player || !player.isValid()) return;
  if (!player.isSneaking) return;
  if (activeMiningOperations.has(player.id)) return;

  const startLoc = {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z),
  };
  const brokenTypeId = brokenBlockPermutation?.type?.id;
  if (!brokenTypeId) return;

  const tool = getMainhandTool(player) || itemStackBeforeBreak;
  if (!tool) return;

  const toolTypeId = tool.typeId;

  // Tree Capitator
  if (isAxe(toolTypeId) && isEligibleLog(brokenTypeId)) {
    activeMiningOperations.add(player.id);
    try {
      executeTreeCapitator(player, dimension, startLoc, brokenTypeId, () => {
        activeMiningOperations.delete(player.id);
      });
    } catch (err) {
      activeMiningOperations.delete(player.id);
    }
    return;
  }

  // Domino Ore Miner
  if (isPickaxe(toolTypeId) && getOreInfo(brokenTypeId)) {
    activeMiningOperations.add(player.id);
    try {
      executeDominoOreMiner(player, dimension, startLoc, brokenTypeId, () => {
        activeMiningOperations.delete(player.id);
      });
    } catch (err) {
      activeMiningOperations.delete(player.id);
    }
    return;
  }
});

// 5. 1-Tick RunInterval: Double-sneak offhand detection & dynamic handheld lighting
system.runInterval(() => {
  let players;
  try {
    players = world.getAllPlayers();
  } catch (e) {
    return;
  }

  const tick = system.currentTick;
  const doLight = tick % CONFIG.LIGHT_UPDATE_TICKS === 0;

  for (const player of players) {
    try {
      const state = getQolState(player.id);
      const sneaking = !!player.isSneaking;

      if (sneaking && !state.sneakHeld) {
        state.sneakCount += 1;
        state.sneakTimer = 0;
      }
      state.sneakHeld = sneaking;

      if (state.sneakCount > 0) {
        state.sneakTimer += 1;
        if (state.sneakTimer > CONFIG.SWAP_WINDOW_TICKS) {
          state.sneakCount = 0;
          state.sneakTimer = 0;
        }
      }

      if (state.sneakCount >= 2) {
        state.sneakCount = 0;
        state.sneakTimer = 0;
        swapHands(player);
      }

      if (doLight) {
        updatePlayerLight(player, state);
      }
    } catch (e) {}
  }
}, 1);

// 6. Web Interaction Interval: Auto-switch shears for cobwebs
system.runInterval(() => {
  const now = system.currentTick;

  for (const player of world.getAllPlayers()) {
    try {
      if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) {
        webInteraction.delete(player.id);
        continue;
      }

      const lastCombat = recentCombat.get(player.id) ?? -Infinity;
      if (now - lastCombat < CONFIG.WEB_COMBAT_COOLDOWN) continue;

      const block = getTargetBlock(player);
      if (!isWeb(block)) {
        webInteraction.delete(player.id);
        continue;
      }

      const key = blockKey(block);
      const state = webInteraction.get(player.id);

      if (!state || state.key !== key) {
        webInteraction.set(player.id, {
          key,
          lastInteractionTick: now,
          initialTick: now,
        });
        continue;
      }

      const elapsed = now - state.initialTick;
      if (elapsed < CONFIG.WEB_INTERACTION_WINDOW) continue;

      if (now - state.lastInteractionTick > CONFIG.WEB_INTERACTION_WINDOW) {
        webInteraction.delete(player.id);
        continue;
      }

      const inventory = getContainer(player);
      const held = inventory?.getItem(CONFIG.AUTO_SWITCH_SLOT);
      if (held && normalizeId(held.typeId).includes("shears")) continue;

      switchPlayerSlot1Tool(player, ToolCategory.WEB, block.typeId);
      webInteraction.set(player.id, {
        key,
        initialTick: now,
        lastInteractionTick: now,
      });
    } catch (e) {}
  }
}, CONFIG.WEB_CHECK_INTERVAL);

// 7. Player Lifecycle Cleanups
world.afterEvents.playerLeave.subscribe((event) => {
  const id = event.playerId;
  if (!id) return;
  const state = qolPlayerState.get(id);
  if (state) clearPlacedLight(state);
  qolPlayerState.delete(id);
  recentCombat.delete(id);
  webInteraction.delete(id);
  clearPendingSwap(id);
  activeMiningOperations.delete(id);
});

if (world.afterEvents.playerDimensionChange) {
  world.afterEvents.playerDimensionChange.subscribe((event) => {
    try {
      const state = getQolState(event.player.id);
      clearPlacedLight(state);
    } catch (e) {}
  });
}

// 8. Custom Script Event Command (/scriptevent qol:swap)
system.afterEvents.scriptEventReceive.subscribe((event) => {
  try {
    if (event.id === "qol:swap") {
      const player = event.sourceEntity;
      if (player && player.typeId === "minecraft:player") {
        swapHands(player);
      }
    }
  } catch (e) {}
});

console.warn(`${LOG_PREFIX} v${VERSION} Initialized. All QoL, Auto-Switch, Tree Capitator & Domino Ore Miner systems active.`);
