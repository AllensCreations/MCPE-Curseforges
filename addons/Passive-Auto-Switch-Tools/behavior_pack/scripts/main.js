/**
 * ==============================================================================
 * PASSIVE AUTO-SWITCH TOOLS -- MINECRAFT BEDROCK SCRIPT API
 * ==============================================================================
 * Version: 1.0.0
 * Target Engine: Minecraft Bedrock 1.21.0+ / v1.26 Standards
 * API Module: @minecraft/server v1.13.0+ (STABLE)
 * Author: AllensCreations
 *
 * System Architecture:
 * 1. Passive Background Raycast Loop:
 *    - Runs every 2 ticks (10Hz) via system.runInterval.
 *    - Uses player.getBlockFromViewDirection({ maxDistance: 6 }) to trace
 *      the block the player is actively targeting.
 *
 * 2. Slot 1 Activation Rule:
 *    - Hotbar index 0 corresponds to Slot 1 in the player's HUD.
 *    - The auto-switch engine ONLY activates when player.selectedSlotIndex === 0.
 *    - When holding slots 1 through 8 (food, building blocks, torches, weapons),
 *      the script remains 100% idle and transparent.
 *
 * 3. Intelligent Block-to-Tool Classification:
 *    - Pickaxe: Stones, deepslate, ores, obsidian, netherrack, bricks, terracotta,
 *      concrete, mineral blocks, metal containers, anvils, hoppers, furnaces.
 *    - Axe: Logs, wood, planks, fences, gates, wooden doors/trapdoors, chests,
 *      crafting tables, pumpkins, melons, bookshelves, ladders, composters.
 *    - Shovel: Dirt, grass, sand, gravel, clay, soul sand, mud, snow, concrete powder.
 *    - Shears / Sword: Leaves, cobwebs, wool, vines. Shears prioritized for wool/leaves.
 *    - Hoe: Hay blocks, target blocks, sculk blocks, sponges, moss, wart blocks.
 *
 * 4. Safe In-Place Inventory Swapping:
 *    - If Slot 1 already holds a matching tool, no action is taken (preserves
 *      the player's active tool selection, e.g., Silk Touch vs. Fortune).
 *    - If a different tool category is needed, scans inventory (0..35) for the
 *      highest-tier tool (Netherite > Diamond > Iron > Stone > Wood/Golden).
 *    - Executes container.swapItems(bestSlot, 0, container) to seamlessly swap
 *      items with zero duplication, preserving all durability, enchantments,
 *      custom name tags, and dynamic properties.
 * ==============================================================================
 */

import { world, system } from "@minecraft/server";

// ==============================================================================
// 1. TOOL DEFINITIONS & TIER SCORING
// ==============================================================================

/**
 * Recognized tool categories.
 * @enum {string}
 */
const ToolCategory = {
  PICKAXE: "pickaxe",
  AXE: "axe",
  SHOVEL: "shovel",
  SHEARS_OR_SWORD: "shears_or_sword",
  HOE: "hoe",
};

/**
 * Base tier priority scoring for tools. Higher score = higher priority.
 */
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

/**
 * Evaluates an ItemStack and returns its tool category and tier score.
 *
 * @param {import("@minecraft/server").ItemStack | undefined} item
 * @param {string} targetCategory
 * @param {number} slotIndex
 * @returns {number} Score >= 0 if matching tool, or -1 if invalid/non-matching.
 */
function evaluateToolScore(item, targetCategory, slotIndex) {
  if (!item || !item.typeId) return -1;

  const rawId = item.typeId.replace(/^minecraft:/, "").toLowerCase();

  // Pickaxe evaluation
  if (targetCategory === ToolCategory.PICKAXE) {
    if (!rawId.includes("pickaxe")) return -1;
    let score = getMaterialTier(rawId);
    if (slotIndex >= 1 && slotIndex <= 8) score += 1; // Slight hotbar preference
    return score;
  }

  // Axe evaluation
  if (targetCategory === ToolCategory.AXE) {
    if (!rawId.includes("axe") || rawId.includes("pickaxe")) return -1;
    let score = getMaterialTier(rawId);
    if (slotIndex >= 1 && slotIndex <= 8) score += 1;
    return score;
  }

  // Shovel evaluation
  if (targetCategory === ToolCategory.SHOVEL) {
    if (!rawId.includes("shovel") && !rawId.includes("spade")) return -1;
    let score = getMaterialTier(rawId);
    if (slotIndex >= 1 && slotIndex <= 8) score += 1;
    return score;
  }

  // Shears / Sword evaluation
  if (targetCategory === ToolCategory.SHEARS_OR_SWORD) {
    if (rawId.includes("shears")) {
      // Shears given top priority for leaves, wool, vines, cobwebs
      return 60 + (slotIndex >= 1 && slotIndex <= 8 ? 1 : 0);
    }
    if (rawId.includes("sword")) {
      let score = getMaterialTier(rawId) - 5; // Swords ranked slightly below shears
      if (slotIndex >= 1 && slotIndex <= 8) score += 1;
      return Math.max(score, 5);
    }
    return -1;
  }

  // Hoe evaluation
  if (targetCategory === ToolCategory.HOE) {
    if (!rawId.includes("hoe")) return -1;
    let score = getMaterialTier(rawId);
    if (slotIndex >= 1 && slotIndex <= 8) score += 1;
    return score;
  }

  return -1;
}

/**
 * Extracts material tier score from tool name.
 *
 * @param {string} rawId
 * @returns {number}
 */
function getMaterialTier(rawId) {
  for (const [tier, score] of Object.entries(TIER_SCORES)) {
    if (rawId.includes(tier)) return score;
  }
  return 25; // Default fallback for custom or unlisted addon tools
}

/**
 * Checks whether an item already matches the required tool category.
 *
 * @param {import("@minecraft/server").ItemStack | undefined} item
 * @param {string} targetCategory
 * @returns {boolean}
 */
function isItemMatchingCategory(item, targetCategory) {
  if (!item || !item.typeId) return false;
  const rawId = item.typeId.replace(/^minecraft:/, "").toLowerCase();

  switch (targetCategory) {
    case ToolCategory.PICKAXE:
      return rawId.includes("pickaxe");
    case ToolCategory.AXE:
      return rawId.includes("axe") && !rawId.includes("pickaxe");
    case ToolCategory.SHOVEL:
      return rawId.includes("shovel") || rawId.includes("spade");
    case ToolCategory.SHEARS_OR_SWORD:
      return rawId.includes("shears") || rawId.includes("sword");
    case ToolCategory.HOE:
      return rawId.includes("hoe");
    default:
      return false;
  }
}

// ==============================================================================
// 2. BLOCK-TO-TOOL CLASSIFICATION ENGINE
// ==============================================================================

/**
 * Fast set of blocks that never require any tool (air, fluids, bedrock, barriers).
 */
const IGNORED_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "water",
  "flowing_water",
  "lava",
  "flowing_lava",
  "bedrock",
  "barrier",
  "structure_void",
  "light_block",
  "portal",
  "end_portal",
  "end_portal_frame",
  "end_gateway",
]);

/**
 * Determines which tool category is needed for a targeted block typeId.
 *
 * @param {string} blockTypeId e.g., "minecraft:stone" or "minecraft:oak_log"
 * @returns {string | null} ToolCategory or null if no tool switch needed.
 */
function getRequiredToolCategory(blockTypeId) {
  if (!blockTypeId) return null;
  const id = blockTypeId.replace(/^minecraft:/, "").toLowerCase();

  if (IGNORED_BLOCKS.has(id)) return null;

  // --------------------------------------------------------------------------
  // A. SHOVEL: Dirt, soils, sands, gravel, mud, snow, concrete powder
  // --------------------------------------------------------------------------
  if (
    id.endsWith("concrete_powder") ||
    id.includes("sand") || // sand, red_sand, soul_sand, suspicious_sand
    id.includes("gravel") || // gravel, suspicious_gravel
    id.includes("clay") ||
    id.includes("dirt") || // dirt, coarse_dirt, rooted_dirt, dirt_path
    id.includes("grass") && (id.includes("block") || id.includes("path")) || // grass_block
    id.includes("podzol") ||
    id.includes("mycelium") ||
    id.includes("farmland") ||
    id.includes("mud") || // mud, packed_mud, muddy_mangrove_roots
    id.includes("soul_soil") ||
    id.includes("snow") // snow, snow_layer, powder_snow
  ) {
    return ToolCategory.SHOVEL;
  }

  // --------------------------------------------------------------------------
  // B. SHEARS / SWORD: Leaves, cobwebs, wool, vines, vegetation
  // --------------------------------------------------------------------------
  if (
    id.includes("leaves") || // oak_leaves, birch_leaves, cherry_leaves, azalea_leaves, etc.
    id.includes("wool") || // white_wool, red_wool, etc.
    id.includes("web") || // cobweb
    id.includes("vine") || // vine, cave_vines, weeping_vines, twisting_vines
    id.includes("fern") || // fern, large_fern
    id === "tallgrass" ||
    id === "seagrass" ||
    id === "hanging_roots" ||
    id === "deadbush" ||
    id === "tripwire"
  ) {
    return ToolCategory.SHEARS_OR_SWORD;
  }

  // --------------------------------------------------------------------------
  // C. HOE: Hay, target, sculk, sponges, moss, wart blocks
  // --------------------------------------------------------------------------
  if (
    id === "hay_block" ||
    id === "target" ||
    id === "sponge" ||
    id === "wet_sponge" ||
    id.includes("sculk") || // sculk, sculk_catalyst, sculk_shrieker, sculk_sensor, sculk_vein
    id.includes("moss_block") ||
    id.includes("moss_carpet") ||
    id.includes("wart_block") || // nether_wart_block, warped_wart_block
    id === "shroomlight"
  ) {
    return ToolCategory.HOE;
  }

  // --------------------------------------------------------------------------
  // D. AXE: Logs, wood, planks, fences, wooden furniture & workstations
  // --------------------------------------------------------------------------
  if (
    id.endsWith("_log") ||
    id.endsWith("_wood") ||
    id.endsWith("_stem") ||
    id.endsWith("_hyphae") ||
    id.startsWith("stripped_") ||
    id.includes("planks") ||
    id.includes("crafting_table") ||
    id.includes("cartography_table") ||
    id.includes("fletching_table") ||
    id.includes("smithing_table") ||
    id.includes("loom") ||
    id.includes("composter") ||
    id.includes("chest") || // chest, trapped_chest, ender_chest (pickaxe! handle below)
    id === "barrel" ||
    id.includes("bookshelf") ||
    id === "lectern" ||
    id.includes("pumpkin") || // pumpkin, carved_pumpkin, lit_pumpkin
    id.includes("melon") ||
    id === "cocoa" ||
    id.includes("beehive") ||
    id === "bee_nest" ||
    id.includes("ladder") ||
    id.includes("sign") || // sign, hanging_sign, standing_sign, wall_sign
    id.includes("mushroom_stem") ||
    id.includes("mushroom_block") ||
    id === "jukebox" ||
    id === "daylight_detector" ||
    id === "note_block" ||
    id.includes("bamboo_block") ||
    id.includes("bamboo_mosaic") ||
    (id.endsWith("_fence") && !id.includes("nether_brick")) ||
    id.endsWith("_fence_gate")
  ) {
    // Ender chest requires a pickaxe, not an axe!
    if (id === "ender_chest") return ToolCategory.PICKAXE;
    return ToolCategory.AXE;
  }

  // Wooden doors, trapdoors, buttons, pressure plates, stairs, and slabs
  const isWoodMaterial =
    id.includes("oak") ||
    id.includes("spruce") ||
    id.includes("birch") ||
    id.includes("jungle") ||
    id.includes("acacia") ||
    id.includes("dark_oak") ||
    id.includes("mangrove") ||
    id.includes("cherry") ||
    id.includes("bamboo") ||
    id.includes("crimson") ||
    id.includes("warped") ||
    id.includes("pale_oak");

  if (isWoodMaterial && !id.includes("petrified")) {
    if (
      id.endsWith("_door") ||
      id.endsWith("_trapdoor") ||
      id.endsWith("_button") ||
      id.endsWith("_pressure_plate") ||
      id.endsWith("_stairs") ||
      id.endsWith("_slab")
    ) {
      return ToolCategory.AXE;
    }
  }

  // --------------------------------------------------------------------------
  // E. PICKAXE: All stone, ores, deepslate, nether, end, metal, brick blocks
  // --------------------------------------------------------------------------
  if (
    id.includes("stone") ||
    id.includes("cobble") ||
    id.includes("deepslate") ||
    id.includes("ore") || // coal_ore, iron_ore, diamond_ore, etc.
    id.includes("granite") ||
    id.includes("diorite") ||
    id.includes("andesite") ||
    id.includes("tuff") ||
    id.includes("calcite") ||
    id.includes("basalt") ||
    id.includes("blackstone") ||
    id.includes("obsidian") ||
    id.includes("ancient_debris") ||
    id.includes("brick") || // stone_bricks, nether_bricks, brick_block, etc.
    id.includes("terracotta") ||
    (id.includes("concrete") && !id.endsWith("concrete_powder")) ||
    id.includes("sandstone") ||
    id.includes("prismarine") ||
    id.includes("netherrack") ||
    id.includes("end_stone") ||
    id.includes("purpur") ||
    id.includes("magma") ||
    id.includes("copper") ||
    id.includes("iron") ||
    id.includes("gold") ||
    id.includes("diamond") ||
    id.includes("emerald") ||
    id.includes("lapis") ||
    id.includes("redstone") ||
    id.includes("netherite") ||
    id.includes("amethyst") ||
    id.includes("dripstone") ||
    id.includes("furnace") ||
    id.includes("smoker") ||
    id.includes("blast_furnace") ||
    id.includes("hopper") ||
    id.includes("dispenser") ||
    id.includes("dropper") ||
    id.includes("cauldron") ||
    id.includes("anvil") ||
    id.includes("enchanting_table") ||
    id.includes("brewing_stand") ||
    id.includes("grindstone") ||
    id.includes("stonecutter") ||
    id.includes("bell") ||
    id.includes("lantern") ||
    id.includes("chain") ||
    id.includes("spawner") ||
    id.includes("vault") ||
    id.includes("crafter") ||
    id.includes("stairs") ||
    id.includes("slab") ||
    id.includes("wall")
  ) {
    return ToolCategory.PICKAXE;
  }

  // Default fallback for any remaining solid mining block
  return ToolCategory.PICKAXE;
}

// ==============================================================================
// 3. PASSIVE EXECUTION & INVENTORY SWAP LOGIC
// ==============================================================================

/**
 * Processes a single player's view direction and performs auto-switch if needed.
 *
 * @param {import("@minecraft/server").Player} player
 */
function processPlayerAutoSwitch(player) {
  // 1. Slot 1 Activation Rule: Must be selecting Hotbar Slot 1 (index 0)
  if (player.selectedSlotIndex !== 0) {
    return;
  }

  // 2. Block Raycasting: Check what block the player is actively targeting (up to 6 blocks)
  let hitResult;
  try {
    hitResult = player.getBlockFromViewDirection({ maxDistance: 6 });
  } catch {
    return;
  }

  if (!hitResult || !hitResult.block) {
    return;
  }

  const targetBlock = hitResult.block;
  const requiredCategory = getRequiredToolCategory(targetBlock.typeId);

  // If targeted block does not require a tool (e.g., air, fluid, void), exit
  if (!requiredCategory) {
    return;
  }

  // 3. Inspect player inventory container
  const inventoryComp =
    player.getComponent("minecraft:inventory") ??
    player.getComponent("inventory");

  if (!inventoryComp || !inventoryComp.container) {
    return;
  }

  const container = inventoryComp.container;

  // 4. Check current item in Slot 1 (index 0)
  const currentSlot1Item = container.getItem(0);

  // If Slot 1 already holds a matching tool for this category, keep it!
  if (isItemMatchingCategory(currentSlot1Item, requiredCategory)) {
    return;
  }

  // 5. Scan player's inventory (slots 1..size-1) to find the optimal tool
  let bestSlotIndex = -1;
  let highestScore = -1;

  for (let slot = 1; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (!item) continue;

    const score = evaluateToolScore(item, requiredCategory, slot);
    if (score > highestScore) {
      highestScore = score;
      bestSlotIndex = slot;
    }
  }

  // 6. If a matching tool exists in inventory, seamlessly swap into Slot 1
  if (bestSlotIndex !== -1 && highestScore > 0) {
    try {
      container.swapItems(bestSlotIndex, 0, container);
    } catch {
      // Graceful fallback if container is temporarily locked by another system
    }
  }
}

// ==============================================================================
// 4. MAIN ENGINE TICK LOOP
// ==============================================================================

/**
 * Periodic check loop: Runs every 2 ticks (10 times per second)
 * completely passively in the background.
 */
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    try {
      processPlayerAutoSwitch(player);
    } catch {}
  }
}, 2);

console.warn("[Passive Auto-Switch Tools] Engine initialized on stable @minecraft/server.");
