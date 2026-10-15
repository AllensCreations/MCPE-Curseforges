/**
 * Configuration & Whitelists for Smart Tree Capitator & Domino Ore Miner
 * Created by AllensCreations — MCPE Curseforges
 */

export const CONFIG = {
  // Feature toggles
  TREE_CAPITATOR_ENABLED: true,
  DOMINO_ORE_MINER_ENABLED: true,

  // Search limits
  MAX_TREE_BLOCKS: 128,
  MAX_TREE_HEIGHT: 36,
  MAX_ORE_CLUSTER_SIZE: 64,
  MAX_ORE_SEARCH_DISTANCE: 16,

  // Processing pacing (blocks processed per tick to prevent server lag)
  BLOCKS_PER_TICK: 6,

  // Durability safety: stops secondary mining if tool drops to or below this remaining durability
  DURABILITY_SAFETY_THRESHOLD: 5,

  // Audio cue when tool protection stops mining
  ALERT_SOUND: "note.bass",
  ALERT_PITCH: 0.7,
  ALERT_VOLUME: 1.0,

  // Nether gold category policy: "nether_gold" (distinct) or "gold" (grouped with overworld gold)
  NETHER_GOLD_POLICY: "nether_gold",
};

/**
 * Whitelist of standard and custom axe identifiers
 */
export const AXE_IDENTIFIERS = new Set([
  "minecraft:wooden_axe",
  "minecraft:stone_axe",
  "minecraft:iron_axe",
  "minecraft:golden_axe",
  "minecraft:diamond_axe",
  "minecraft:netherite_axe",
]);

/**
 * Pickaxe tier definitions:
 * 1: Wood, Gold
 * 2: Stone
 * 3: Iron
 * 4: Diamond
 * 5: Netherite
 */
export const PICKAXE_TIERS = {
  "minecraft:wooden_axe": 1,
  "minecraft:golden_axe": 1,
  "minecraft:wooden_pickaxe": 1,
  "minecraft:golden_pickaxe": 1,
  "minecraft:stone_pickaxe": 2,
  "minecraft:iron_pickaxe": 3,
  "minecraft:diamond_pickaxe": 4,
  "minecraft:netherite_pickaxe": 5,
};

/**
 * Checks if the specified item identifier represents a supported axe.
 * @param {string} typeId
 * @returns {boolean}
 */
export function isAxe(typeId) {
  if (!typeId) return false;
  return AXE_IDENTIFIERS.has(typeId) || typeId.endsWith("_axe");
}

/**
 * Checks if the specified item identifier represents a supported pickaxe.
 * @param {string} typeId
 * @returns {boolean}
 */
export function isPickaxe(typeId) {
  if (!typeId) return false;
  return Boolean(PICKAXE_TIERS[typeId]) || typeId.endsWith("_pickaxe");
}

/**
 * Retrieves the mining tier of a pickaxe (defaults to 1 for unknown custom pickaxes).
 * @param {string} typeId
 * @returns {number}
 */
export function getPickaxeTier(typeId) {
  return PICKAXE_TIERS[typeId] || (typeId?.endsWith("_pickaxe") ? 3 : 0);
}

/**
 * Eligible log, wood, stem, and hyphae block identifiers
 */
export const ELIGIBLE_LOGS = new Set([
  // Oak
  "minecraft:oak_log", "minecraft:stripped_oak_log", "minecraft:oak_wood", "minecraft:stripped_oak_wood",
  // Spruce
  "minecraft:spruce_log", "minecraft:stripped_spruce_log", "minecraft:spruce_wood", "minecraft:stripped_spruce_wood",
  // Birch
  "minecraft:birch_log", "minecraft:stripped_birch_log", "minecraft:birch_wood", "minecraft:stripped_birch_wood",
  // Jungle
  "minecraft:jungle_log", "minecraft:stripped_jungle_log", "minecraft:jungle_wood", "minecraft:stripped_jungle_wood",
  // Acacia
  "minecraft:acacia_log", "minecraft:stripped_acacia_log", "minecraft:acacia_wood", "minecraft:stripped_acacia_wood",
  // Dark Oak
  "minecraft:dark_oak_log", "minecraft:stripped_dark_oak_log", "minecraft:dark_oak_wood", "minecraft:stripped_dark_oak_wood",
  // Mangrove
  "minecraft:mangrove_log", "minecraft:stripped_mangrove_log", "minecraft:mangrove_wood", "minecraft:stripped_mangrove_wood",
  "minecraft:mangrove_roots", "minecraft:muddy_mangrove_roots",
  // Cherry
  "minecraft:cherry_log", "minecraft:stripped_cherry_log", "minecraft:cherry_wood", "minecraft:stripped_cherry_wood",
  // Pale Oak (1.21.50+ / Winter Drop)
  "minecraft:pale_oak_log", "minecraft:stripped_pale_oak_log", "minecraft:pale_oak_wood", "minecraft:stripped_pale_oak_wood",
  // Nether Fungi (Crimson & Warped)
  "minecraft:crimson_stem", "minecraft:stripped_crimson_stem", "minecraft:crimson_hyphae", "minecraft:stripped_crimson_hyphae",
  "minecraft:warped_stem", "minecraft:stripped_warped_stem", "minecraft:warped_hyphae", "minecraft:stripped_warped_hyphae",
]);

/**
 * Checks if a block identifier is an eligible tree log or wood.
 * @param {string} blockId
 * @returns {boolean}
 */
export function isEligibleLog(blockId) {
  if (!blockId) return false;
  if (ELIGIBLE_LOGS.has(blockId)) return true;
  return /(log|wood|stem|hyphae|mangrove_roots)$/i.test(blockId);
}

/**
 * Ore Category definitions: Map block ID -> { category, minTier, rawItem, baseDropCount }
 */
export const ORE_DEFINITIONS = {
  // Coal (Tier 1: Wood+)
  "minecraft:coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:deepslate_coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },

  // Iron (Tier 2: Stone+)
  "minecraft:iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:deepslate_iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },

  // Copper (Tier 2: Stone+)
  "minecraft:copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:deepslate_copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },

  // Lapis Lazuli (Tier 2: Stone+)
  "minecraft:lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:deepslate_lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },

  // Gold (Tier 3: Iron+)
  "minecraft:gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:deepslate_gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },

  // Nether Gold (Tier 1: Wood+)
  "minecraft:nether_gold_ore": {
    category: CONFIG.NETHER_GOLD_POLICY,
    minTier: 1,
    dropItem: "minecraft:gold_nugget",
    minDrop: 2,
    maxDrop: 6,
  },

  // Redstone (Tier 3: Iron+)
  "minecraft:redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },

  // Diamond (Tier 3: Iron+)
  "minecraft:diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:deepslate_diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },

  // Emerald (Tier 3: Iron+)
  "minecraft:emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:deepslate_emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },

  // Nether Quartz (Tier 1: Wood+)
  "minecraft:quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:nether_quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },

  // Ancient Debris (Tier 4: Diamond+)
  "minecraft:ancient_debris": { category: "ancient_debris", minTier: 4, dropItem: "minecraft:ancient_debris" },
};

/**
 * Retrieves the normalized ore info if the block is a supported ore.
 * @param {string} blockId
 * @returns {{ category: string, minTier: number, dropItem?: string, minDrop?: number, maxDrop?: number } | null}
 */
export function getOreInfo(blockId) {
  if (!blockId) return null;
  return ORE_DEFINITIONS[blockId] || null;
}
