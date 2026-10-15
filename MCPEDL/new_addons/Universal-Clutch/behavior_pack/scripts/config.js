/**
 * Universal Clutch by AllensCreations
 * Root Configuration (Default Subpack: Full Mode - Auto-Switch Inventory, 8+ Blocks)
 */

/**
 * Whether the system automatically switches and equips clutch items from inventory.
 * - true: Full Mode (Auto-searches hotbar & inventory, equips clutch item, uses it)
 * - false: Simple Mode (Only uses clutch items actively held in mainhand/offhand)
 */
export const AUTO_SWITCH_INVENTORY = true;

/**
 * The minimum fall distance (in blocks) required to trigger the clutch system.
 * Configured dynamically via Behavior Pack subpack settings.
 * Default: 8 blocks.
 */
export const FALL_DISTANCE_THRESHOLD = 8;

/**
 * Display name for the active subpack preset.
 */
export const SUBPACK_NAME = "Full Mode (Auto-Switch Inventory - 8+ Blocks)";
