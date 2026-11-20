// Shared settings and item tables.
import { MINING_OPTIONS } from "../mining-options.js";

export const LOG_PREFIX = "[Vanilla QoL]";

export const CONFIG = {
  SWAP_WINDOW_TICKS: 14,
  SWAP_COOLDOWN_TICKS: 8,
  LIGHT_UPDATE_TICKS: 1,
  IDLE_LIGHT_CHECK_TICKS: 5,
  STILL_SPEED_LIMIT: 0.03,

  AUTO_SWITCH_SLOT: 0,
  SWITCH_MARGIN: 3,
  TOOL_TIE_TOLERANCE: 1,
  SILK_BLOCK_BONUS: 60,
  LOW_DURABILITY_USES: 15,
  LOW_DURABILITY_PENALTY: 100,
  RAYCAST_DISTANCE: 6,
  RETRY_TICKS: 2,
  COMBAT_COOLDOWN_TICKS: 10,
  MINING_ACTIVE_TICKS: 10,
  BREAK_SWITCH_DELAY_TICKS: 2,
  SWAP_RESTORE_TICKS: 4,
  SWAP_BACK_TICKS: 30,
  TOOL_SEARCH_LAST_SLOT: 8,
  PROTECTED_SLOTS: [],
  WEB_CHECK_INTERVAL: 2,
  WEB_INTERACTION_WINDOW: 12,
  WEB_COMBAT_COOLDOWN: 40,

  TREE_CAPITATOR_ENABLED: MINING_OPTIONS.TREE_CAPITATOR_ENABLED,
  MAX_TREE_BLOCKS: 128,
  MAX_TREE_HEIGHT: 320,
  TREE_MAX_HORIZONTAL_SPREAD: 8,
  MATCH_TREE_SPECIES: true,

  DOMINO_ORE_MINER_ENABLED: MINING_OPTIONS.DOMINO_ORE_MINER_ENABLED,
  MAX_ORE_CLUSTER_SIZE: 64,
  MAX_ANCIENT_DEBRIS_CLUSTER_SIZE: 4,
  NETHER_GOLD_POLICY: "nether_gold",

  CHAIN_PAUSE_TICKS: 40,
  DROP_GROUP_SIZE: 5,
  XP_ORB_LIMIT: 10,

  DURABILITY_SAFETY_THRESHOLD: 0,
  ALERT_SOUND: "note.bass",
  ALERT_PITCH: 0.7,
  ALERT_VOLUME: 1.0,

  STARTUP_DELAY_TICKS: 40,
  RANDOM_TICK_SPEED: 4,
  SLEEP_PERCENTAGE: 0,
};

export const SUPPORTED_OFFHAND_ITEMS = new Set([
  "minecraft:torch",
  "minecraft:soul_torch",
  "minecraft:redstone_torch",
  "minecraft:lantern",
  "minecraft:soul_lantern",
  "minecraft:clock",
  "minecraft:compass",
  "minecraft:recovery_compass",
]);

export const LIGHT_LEVELS = {
  "minecraft:torch": 14,
  "minecraft:soul_torch": 10,
  "minecraft:redstone_torch": 7,
  "minecraft:lantern": 15,
  "minecraft:soul_lantern": 10,
  "minecraft:glowstone": 15,
  "minecraft:sea_lantern": 15,
  "minecraft:shroomlight": 15,
  "minecraft:lit_pumpkin": 15,
};
