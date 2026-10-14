/**
 * =============================================================================
 * PASSIVE AUTO-SWITCH TOOLS -- MINECRAFT BEDROCK SCRIPT API
 * =============================================================================
 * Version: 1.3.0
 * Target Engine: Minecraft Bedrock 1.21.0+ / v1.26 Standards
 * API Module: @minecraft/server v1.13.0+ (STABLE)
 * Author: AllensCreations
 *
 * System Architecture:
 * 1. Event-Driven Block Breaking Activation:
 *    - Listens to world.afterEvents.entityHitBlock to trigger tool selection ONLY
 *      when the player actively starts hitting / breaking a block.
 *    - Completely eliminates passive looking-at-block auto-switch, preventing
 *      unwanted hotbar swapping when merely looking around or walking.
 *
 * 2. Mob Combat Auto-Switch:
 *    - Listens to world.afterEvents.entityHitEntity to auto-switch to a combat
 *      weapon (Sword or Axe) whenever the player attacks a mob or combat target.
 *    - Retains the player's active weapon if Slot 1 already holds a sword or axe.
 *
 * 3. Slot 1 Activation Rule:
 *    - Hotbar index 0 corresponds to Slot 1 in the player's HUD.
 *    - The auto-switch engine ONLY activates when player.selectedSlotIndex === 0.
 *    - When holding slots 1 through 8 (food, building blocks, torches, weapons),
 *      the script remains 100% idle and transparent.
 *
 * 4. Intelligent Block-to-Tool Classification:
 *    - Pickaxe: Stones, deepslate, ores, obsidian, netherrack, bricks, terracotta,
 *      concrete, mineral blocks, metal containers, anvils, hoppers, furnaces.
 *    - Axe: Logs, wood, planks, fences, gates, wooden doors/trapdoors, chests,
 *      crafting tables, pumpkins, melons, bookshelves, ladders, composters.
 *    - Shovel: Dirt, grass, sand, gravel, clay, soul sand, mud, snow, concrete powder.
 *    - Shears / Sword: Leaves, cobwebs, wool, vines. Shears prioritized for wool/leaves.
 *    - Hoe: Hay blocks, target blocks, sculk blocks, sponges, moss, wart blocks.
 *    - Weapon (Combat): Highest tier Sword or Axe when attacking entities.
 *
 * 5. Safe In-Place Inventory Swapping:
 *    - Slot 1 is kept if it already holds a matching tool, UNLESS a clearly better one
 *      exists (higher tier, better enchantments, healthier durability).
 *    - Enchantment aware: Silk Touch for glass/ice/bookshelves, Fortune for ores,
 *      Efficiency / Sharpness as bonuses.
 *    - Nearly broken tools (15 uses or fewer) are avoided when alternatives exist.
 *    - Your original Slot 1 item is returned after you stop mining/fighting.
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
  WEAPON: "weapon",
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

  // Weapon evaluation (Sword or Axe for mob combat)
  if (targetCategory === ToolCategory.WEAPON) {
    const isSword = rawId.includes("sword");
    const isAxe = rawId.includes("axe") && !rawId.includes("pickaxe");
    if (!isSword && !isAxe) return -1;

    let score = getMaterialTier(rawId);
    if (isSword) score += 2; // Slight Bedrock preference for swords due to base damage
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

// ------------------------------------------------------------------------------
// Smart scoring: tier + enchantments + durability
// ------------------------------------------------------------------------------

/** A candidate must beat the held tool by this much before we swap (prevents flip-flopping). */
const SWITCH_MARGIN = 3;

/** Tools with this many uses (or fewer) left are treated as "nearly broken". */
const LOW_DURABILITY_USES = 15;
const LOW_DURABILITY_PENALTY = 100;

/** Reads the enchantments we care about from an item (all 0 if none). */
function readEnchants(item) {
  const result = { silk: 0, fortune: 0, efficiency: 0, sharpness: 0 };
  try {
    const comp = item.getComponent("minecraft:enchantable");
    if (!comp) return result;
    result.silk = comp.getEnchantment("silk_touch")?.level ?? 0;
    result.fortune = comp.getEnchantment("fortune")?.level ?? 0;
    result.efficiency = comp.getEnchantment("efficiency")?.level ?? 0;
    result.sharpness = comp.getEnchantment("sharpness")?.level ?? 0;
  } catch {}
  return result;
}

/** Returns { remaining, fraction } for damageable items, or null. */
function readDurability(item) {
  try {
    const comp = item.getComponent("minecraft:durability");
    if (!comp) return null;
    const remaining = comp.maxDurability - comp.damage;
    return { remaining, fraction: remaining / comp.maxDurability };
  } catch {
    return null;
  }
}

/** Ores that benefit from Fortune (and are wasted by Silk Touch). */
function isFortuneBlock(id) {
  return id.endsWith("_ore");
}

/** Blocks you generally want to collect intact with Silk Touch. */
function isSilkPreferredBlock(id) {
  return (
    id === "glass" ||
    id.endsWith("_glass") ||
    id.endsWith("glass_pane") ||
    /(^|_)ice$/.test(id) ||
    id === "bookshelf" ||
    id === "ender_chest"
  );
}

/**
 * Full score for one inventory item against the current job.
 * @returns {number} Score (can be negative for nearly-broken tools), or -Infinity if not a match.
 */
function scoreItem(item, targetCategory, slotIndex, blockId) {
  const base = evaluateToolScore(item, targetCategory, slotIndex);
  if (base < 0) return -Infinity;

  let score = base;
  const ench = readEnchants(item);

  // Efficiency: mines faster. Sharpness: hits harder.
  score += ench.efficiency;
  if (targetCategory === ToolCategory.WEAPON) score += ench.sharpness;

  // Silk Touch / Fortune context
  if (blockId) {
    if (isSilkPreferredBlock(blockId) && ench.silk > 0) score += 60;
    if (isFortuneBlock(blockId)) {
      score += ench.fortune * 1.5;
      if (ench.silk > 0) score -= 8;
    }
  }

  // Durability: avoid nearly broken tools, small bonus for healthier ones
  const dur = readDurability(item);
  if (dur) {
    if (dur.remaining <= LOW_DURABILITY_USES) score -= LOW_DURABILITY_PENALTY;
    else score += dur.fraction;
  }

  return score;
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
    case ToolCategory.WEAPON:
      return rawId.includes("sword") || (rawId.includes("axe") && !rawId.includes("pickaxe"));
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
// 3. COMBAT TARGET FILTER & TOOL SWAP EXECUTION
// ==============================================================================

/**
 * Entities that should not trigger combat tool auto-switch (non-mobs/projectiles).
 */
const NON_COMBAT_ENTITIES = new Set([
  "item",
  "arrow",
  "xp_orb",
  "experience_orb",
  "snowball",
  "egg",
  "splash_potion",
  "lingering_potion",
  "ender_pearl",
  "eye_of_ender_signal",
  "lightning_bolt",
  "armor_stand",
  "painting",
  "item_frame",
  "glow_item_frame",
  "leash_knot",
  "boat",
  "chest_boat",
  "minecart",
  "chest_minecart",
  "hopper_minecart",
  "tnt_minecart",
  "command_block_minecart",
  "tnt",
  "falling_block",
]);

/**
 * Determines whether an entity is a valid combat target (living mob or player).
 *
 * @param {import("@minecraft/server").Entity} entity
 * @returns {boolean}
 */
function isCombatTarget(entity) {
  if (!entity || !entity.typeId) return false;
  const rawId = entity.typeId.replace(/^minecraft:/, "").toLowerCase();
  if (NON_COMBAT_ENTITIES.has(rawId)) return false;

  try {
    return (
      rawId === "player" ||
      entity.hasComponent("minecraft:health") ||
      entity.hasComponent("health")
    );
  } catch {
    return true;
  }
}

/**
 * Where the player's original Slot 1 item went after we swapped it out,
 * so we can put it back when they stop mining/fighting.
 * Key = player.id.
 * @type {Map<string, { slot: number, typeId: string | undefined, lastActive: number }>}
 */
const swapHomes = new Map();

/** Marks the player as still active so we don't swap back mid-work. */
function touchHome(playerId) {
  const home = swapHomes.get(playerId);
  if (home) home.lastActive = system.currentTick;
}

/** Remembers where the original Slot 1 item was moved to. */
function recordHome(playerId, fromSlot, originalTypeId) {
  const home = swapHomes.get(playerId);
  if (!home) {
    swapHomes.set(playerId, {
      slot: fromSlot,
      typeId: originalTypeId,
      lastActive: system.currentTick,
    });
  } else if (fromSlot === home.slot) {
    // We just pulled the original item back into Slot 1 - nothing left to restore.
    swapHomes.delete(playerId);
  } else {
    home.lastActive = system.currentTick;
  }
}

/** Swaps `fromSlot` into Slot 1 and records where the old Slot 1 item went. */
function performSwap(player, container, fromSlot) {
  const apply = () => {
    const originalTypeId = container.getItem(0)?.typeId;
    container.swapItems(fromSlot, 0, container);
    recordHome(player.id, fromSlot, originalTypeId);
  };
  try {
    apply();
  } catch {
    // Defer to next tick if the game engine locks the container during event dispatch
    system.run(() => {
      try {
        apply();
      } catch {}
    });
  }
}

/** Puts the player's original Slot 1 item back (only if it's still where we left it). */
function swapBackOriginal(player, home) {
  try {
    const inv =
      player.getComponent("minecraft:inventory") ?? player.getComponent("inventory");
    const container = inv?.container;
    if (!container) return;
    const atHome = container.getItem(home.slot);
    if (atHome?.typeId === home.typeId) {
      container.swapItems(home.slot, 0, container);
    }
  } catch {}
}

/**
 * Equips the best matching tool or weapon into Slot 1 (hotbar index 0).
 * Swaps if Slot 1 holds the wrong kind of tool, OR if a clearly better one
 * (higher tier / better enchants / healthier durability) exists in the inventory.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} targetCategory
 * @param {string} [blockTypeId] Targeted block, used for Silk Touch / Fortune decisions.
 */
function switchPlayerSlot1Tool(player, targetCategory, blockTypeId) {
  // 1. Slot 1 Activation Rule: Must be selecting Hotbar Slot 1 (index 0)
  if (player.selectedSlotIndex !== 0) return;

  // 2. Inspect player inventory container
  const inventoryComp =
    player.getComponent("minecraft:inventory") ??
    player.getComponent("inventory");
  if (!inventoryComp || !inventoryComp.container) return;
  const container = inventoryComp.container;

  const blockId = blockTypeId
    ? blockTypeId.replace(/^minecraft:/, "").toLowerCase()
    : "";

  // 3. Score what's currently in Slot 1 (-Infinity if it's the wrong kind of tool)
  const currentScore = scoreItem(container.getItem(0), targetCategory, 0, blockId);

  // 4. Find the best candidate in the rest of the inventory
  let bestSlotIndex = -1;
  let bestScore = -Infinity;
  for (let slot = 1; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (!item) continue;
    const score = scoreItem(item, targetCategory, slot, blockId);
    if (score > bestScore) {
      bestScore = score;
      bestSlotIndex = slot;
    }
  }
  if (bestSlotIndex === -1 || bestScore === -Infinity) return;

  // 5. Keep the current tool unless the candidate is clearly better
  if (currentScore !== -Infinity && bestScore < currentScore + SWITCH_MARGIN) return;

  performSwap(player, container, bestSlotIndex);
}

// ==============================================================================
// 4. EVENT-DRIVEN ACTIVATION + CONTINUOUS MINING TRACKER
// ==============================================================================

/** Ticks a "mining session" stays alive after the last block hit (20 ticks = 1 sec). */
const MINING_SESSION_TICKS = 30;

/** How often (ticks) the tracker re-checks what block you're aiming at. */
const POLL_INTERVAL_TICKS = 2;

/** Max raycast distance (blocks) - covers survival (5) and creative (6) reach. */
const RAYCAST_DISTANCE = 6;

/** Ticks of no mining/fighting before your original Slot 1 item is put back. */
const SWAP_BACK_DELAY_TICKS = 60;

/**
 * Active mining sessions. Key = player.id.
 * @type {Map<string, { expireTick: number, lastKey: string | null }>}
 */
const miningSessions = new Map();

/** Unique key for a block (type + position) so we can detect block changes. */
function blockKey(block) {
  const { x, y, z } = block.location;
  return `${block.typeId}@${x},${y},${z}`;
}

/**
 * Event 1: Block Hit / Start Break
 * Starts (or refreshes) a mining session and switches tools for the hit block.
 */
world.afterEvents.entityHitBlock.subscribe((event) => {
  try {
    const player = event.damagingEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== 0) return;

    const hitBlock = event.hitBlock;
    if (!hitBlock) return;

    touchHome(player.id);
    miningSessions.set(player.id, {
      expireTick: system.currentTick + MINING_SESSION_TICKS,
      lastKey: blockKey(hitBlock),
    });

    const requiredCategory = getRequiredToolCategory(hitBlock.typeId);
    if (!requiredCategory) return;

    switchPlayerSlot1Tool(player, requiredCategory, hitBlock.typeId);
  } catch {}
});

/**
 * Main loop. Does nothing unless someone is mining or has an item waiting to be
 * swapped back.
 *  - Mining sessions: watches the aimed block; when it changes, re-picks the tool.
 *  - Swap-back: after SWAP_BACK_DELAY_TICKS of inactivity, restores the original
 *    Slot 1 item.
 */
system.runInterval(() => {
  if (miningSessions.size === 0 && swapHomes.size === 0) return;

  const now = system.currentTick;
  const players = new Map(world.getAllPlayers().map((p) => [p.id, p]));

  // --- Continuous mining detection ---
  for (const [id, session] of miningSessions) {
    const player = players.get(id);
    if (!player || now > session.expireTick) {
      miningSessions.delete(id);
      continue;
    }

    try {
      if (player.selectedSlotIndex !== 0) continue;

      const hit = player.getBlockFromViewDirection({
        maxDistance: RAYCAST_DISTANCE,
        includeLiquidBlocks: false,
        includePassableBlocks: false,
      });

      if (!hit || !hit.block) {
        session.lastKey = null;
        continue;
      }

      const key = blockKey(hit.block);
      if (key === session.lastKey) continue;
      session.lastKey = key;

      const requiredCategory = getRequiredToolCategory(hit.block.typeId);
      if (!requiredCategory) continue;

      switchPlayerSlot1Tool(player, requiredCategory, hit.block.typeId);
    } catch {}
  }

  // --- Swap original Slot 1 item back after inactivity ---
  for (const [id, home] of swapHomes) {
    const player = players.get(id);
    if (!player || player.selectedSlotIndex !== 0) {
      swapHomes.delete(id); // left, or moved to another slot - don't touch their inventory
      continue;
    }
    if (now - home.lastActive < SWAP_BACK_DELAY_TICKS) continue;

    swapBackOriginal(player, home);
    swapHomes.delete(id);
  }
}, POLL_INTERVAL_TICKS);

world.afterEvents.playerLeave.subscribe((event) => {
  miningSessions.delete(event.playerId);
  swapHomes.delete(event.playerId);
});

/**
 * Event 2: Entity / Mob Combat Attack
 * Auto-switches to best weapon (axe or sword) when attacking a mob or combat target.
 */
world.afterEvents.entityHitEntity.subscribe((event) => {
  try {
    const player = event.damagingEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== 0) return;

    const targetEntity = event.hitEntity;
    if (!targetEntity || !isCombatTarget(targetEntity)) return;

    // Fighting, not mining - end any mining session
    miningSessions.delete(player.id);
    touchHome(player.id);

    switchPlayerSlot1Tool(player, ToolCategory.WEAPON);
  } catch {}
});

console.warn("[Passive Auto-Switch Tools v1.3.0] Smart tool scoring, continuous mining and swap-back initialized.");
