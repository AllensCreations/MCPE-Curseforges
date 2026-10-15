/**
 * Universal Clutch by AllensCreations
 * 
 * Standalone Minecraft Bedrock Script API (@minecraft/server v1.13.0+) Add-on.
 * Single-file implementation (no external script dependencies or module imports).
 * 
 * Automatically performs clutch placements when falling from dangerous heights,
 * featuring 1-2 tick impact prediction, authentic arm swing animations,
 * placement sounds, native waterlogged block handling, automatic water scooping,
 * auto-ride boat clutching (without auto-eject), and Full / Simple mode support.
 * Zero HUD text displays for authentic vanilla gameplay feel.
 * 
 * Modes:
 * - Full Mode (Default): Automatically scans hotbar & inventory for clutch items,
 *   auto-switches/equips them to clutch, and restores the previous item upon landing.
 * - Simple Mode: Only triggers if a clutch item is actively held in mainhand or offhand.
 * - Extreme Mode: Automatically smoothly looks down towards the ground and auto-switches
 *   to any available clutch item in inventory. If no clutch item exists, player faces certain doom.
 */

import {
  world,
  system,
  BlockPermutation,
  ItemStack
} from "@minecraft/server";

// =============================================================================
// Pack Configuration
// =============================================================================

/**
 * Default operating mode if not overridden by player tag.
 * Options: "full" (auto-switch inventory), "simple" (held item only), or "extreme" (auto-aim & switch)
 */
const DEFAULT_MODE = "simple";

/**
 * Minimum fall distance (in blocks) required to trigger the clutch system.
 */
const DEFAULT_THRESHOLD = 8;

// =============================================================================
// Registry of Supported Clutch Items
// =============================================================================

const CLUTCH_REGISTRY = {
  "minecraft:water_bucket": {
    name: "Water Bucket",
    category: "water",
    placeSound: "bucket.empty_water",
    scoopSound: "bucket.fill_water"
  },
  "minecraft:powder_snow_bucket": {
    name: "Powder Snow Bucket",
    category: "powder_snow",
    placeSound: "bucket.empty_powder_snow",
    scoopSound: "bucket.fill_powder_snow"
  },
  "minecraft:twisted_vines": {
    name: "Twisted Vines",
    category: "vines",
    blockId: "minecraft:twisted_vines",
    placeSound: "dig.grass"
  },
  "minecraft:hay_block": {
    name: "Hay Bale",
    category: "block",
    blockId: "minecraft:hay_block",
    placeSound: "dig.grass"
  },
  "minecraft:web": {
    name: "Cobweb",
    category: "block",
    blockId: "minecraft:web",
    placeSound: "dig.cloth"
  },
  "minecraft:slime": {
    name: "Slime Block",
    category: "block",
    blockId: "minecraft:slime",
    placeSound: "block.slime_block.place"
  },
  "minecraft:scaffolding": {
    name: "Scaffolding",
    category: "block",
    blockId: "minecraft:scaffolding",
    placeSound: "block.scaffolding.place"
  },
  "minecraft:sweet_berries": {
    name: "Sweet Berries",
    category: "sweet_berries",
    blockId: "minecraft:sweet_berry_bush",
    placeSound: "block.sweet_berry_bush.place"
  }
};

/**
 * Priority order for Overworld and The End dimensions.
 */
const OVERWORLD_CLUTCH_PRIORITY = [
  "minecraft:water_bucket",
  "minecraft:slime",
  "minecraft:web",
  "minecraft:hay_block",
  "minecraft:powder_snow_bucket",
  "minecraft:twisted_vines",
  "boat",
  "minecraft:scaffolding",
  "minecraft:sweet_berries"
];

/**
 * Priority order for the Nether dimension (water bucket is excluded).
 * Twisted Vines > Powder Snow Bucket > Hay Bale > Slime Block > Cobweb > Boat > Scaffolding
 */
const NETHER_CLUTCH_PRIORITY = [
  "minecraft:twisted_vines",
  "minecraft:powder_snow_bucket",
  "minecraft:hay_block",
  "minecraft:slime",
  "minecraft:web",
  "boat",
  "minecraft:scaffolding"
];

function getClutchPriority(dimensionId) {
  if (dimensionId === "minecraft:nether") {
    return NETHER_CLUTCH_PRIORITY;
  }
  return OVERWORLD_CLUTCH_PRIORITY;
}

/**
 * Passable foliage/air blocks that a falling player traverses.
 */
const PASSABLE_OR_AIR_BLOCKS = new Set([
  "minecraft:air",
  "minecraft:cave_air",
  "minecraft:void_air",
  "minecraft:short_grass",
  "minecraft:tall_grass",
  "minecraft:fern",
  "minecraft:large_fern",
  "minecraft:snow_layer",
  "minecraft:deadbush",
  "minecraft:dandelion",
  "minecraft:poppy",
  "minecraft:blue_orchid",
  "minecraft:allium",
  "minecraft:azure_bluet",
  "minecraft:red_tulip",
  "minecraft:orange_tulip",
  "minecraft:white_tulip",
  "minecraft:pink_tulip",
  "minecraft:oxeye_daisy",
  "minecraft:cornflower",
  "minecraft:lily_of_the_valley",
  "minecraft:wither_rose",
  "minecraft:sunflower",
  "minecraft:lilac",
  "minecraft:rose_bush",
  "minecraft:peony"
]);

// Map of active water clutches awaiting player touchdown & auto-scoop
// Key: player.id -> ClutchRecord
const activeWaterClutches = new Map();

// Map of active powder snow clutches awaiting player touchdown & auto-scoop
// Key: player.id -> ClutchRecord
const activePowderSnowClutches = new Map();

// Map tracking recent clutch trigger ticks to debounce per player
// Key: player.id -> number (tick)
const lastClutchTick = new Map();

// Map tracking fall start height per player to calculate true fall distance
// Key: player.id -> { startY: number, lastY: number, fallDist: number }
const fallTrackers = new Map();

// =============================================================================
// Helper Functions: Mode, Fall Tracking, Inventory, and Raycasting
// =============================================================================

/**
 * Resolves player operating mode ("full", "simple", or "extreme").
 * Prioritizes tags: "clutch_mode:extreme", "clutch_mode:full", "clutch_mode:simple".
 */
function getPlayerMode(player) {
  try {
    const tags = player.getTags();
    if (tags.includes("clutch_mode:extreme")) return "extreme";
    if (tags.includes("clutch_mode:full")) return "full";
    if (tags.includes("clutch_mode:simple")) return "simple";
  } catch {}
  return DEFAULT_MODE;
}

/**
 * Retrieves the effective fall distance threshold for a player.
 * Supports tag override: "clutch_threshold:<blocks>"
 */
function getPlayerThreshold(player) {
  try {
    const tags = player.getTags();
    for (const tag of tags) {
      if (tag.startsWith("clutch_threshold:")) {
        const val = parseInt(tag.split(":")[1], 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }
  } catch {}
  return DEFAULT_THRESHOLD;
}

/**
 * Tracks player vertical displacement every tick to calculate accurate fall distance.
 * Resolves the issue where entity.fallDistance is undefined in Bedrock Script API 1.13.0+.
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").Vector3} vel
 * @returns {number} Fall distance in blocks
 */
function trackPlayerFall(player, vel) {
  const loc = player.location;
  let tracker = fallTrackers.get(player.id);

  // Consider falling when downward velocity is non-trivial and not standing on ground
  const isFallingDown = vel.y < -0.15 && !player.isOnGround;

  if (isFallingDown) {
    if (!tracker) {
      tracker = { startY: loc.y, lastY: loc.y, fallDist: 0 };
      fallTrackers.set(player.id, tracker);
    } else {
      if (loc.y > tracker.startY) {
        tracker.startY = loc.y;
      }
      tracker.lastY = loc.y;
      tracker.fallDist = Math.max(0, tracker.startY - loc.y);
    }
    return tracker.fallDist;
  } else {
    fallTrackers.delete(player.id);
    return 0;
  }
}

/**
 * Resolves clutch item definition from an ItemStack.
 */
function resolveClutchItem(itemStack) {
  if (!itemStack || !itemStack.typeId) return null;
  const typeId = itemStack.typeId;

  if (CLUTCH_REGISTRY[typeId]) {
    return { ...CLUTCH_REGISTRY[typeId], typeId };
  }

  // Any boat or raft
  if (typeId.endsWith("_boat") || typeId.endsWith("_raft")) {
    const isChestBoat = typeId.includes("chest_boat") || typeId.includes("chest_raft");
    return {
      name: "Boat",
      category: "boat",
      typeId: typeId,
      entityType: isChestBoat ? "minecraft:chest_boat" : "minecraft:boat",
      placeSound: "step.wood"
    };
  }

  return null;
}

function itemMatchesPriority(itemStack, priorityKey) {
  if (!itemStack || !itemStack.typeId) return false;
  if (priorityKey === "boat") {
    return itemStack.typeId.endsWith("_boat") || itemStack.typeId.endsWith("_raft");
  }
  return itemStack.typeId === priorityKey;
}

/**
 * Searches player container for the best available clutch item.
 */
/**
 * Searches player container for the best available clutch item based on dimension.
 */
function findBestClutchItemInInventory(container, dimensionId) {
  if (!container) return null;
  const priorityList = getClutchPriority(dimensionId);

  for (const pKey of priorityList) {
    // 1. Check hotbar first (slots 0 to 8)
    for (let slot = 0; slot < 9 && slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && itemMatchesPriority(item, pKey)) {
        return { slot, item, inHotbar: true };
      }
    }
    // 2. Check upper inventory (slots 9 to 35)
    for (let slot = 9; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && itemMatchesPriority(item, pKey)) {
        return { slot, item, inHotbar: false };
      }
    }
  }

  return null;
}

/**
 * Fast check to verify if the player possesses any valid clutch item
 * in mainhand, offhand, hotbar, or upper inventory.
 * Dimension-aware: Water Buckets are disregarded in the Nether.
 */
function hasAnyClutchItem(player) {
  try {
    const isNether = player.dimension?.id === "minecraft:nether";

    const equippable = player.getComponent("minecraft:equippable");
    if (equippable) {
      const main = equippable.getEquipment("Mainhand");
      if (main && (!isNether || main.typeId !== "minecraft:water_bucket") && resolveClutchItem(main)) return true;
      const off = equippable.getEquipment("Offhand");
      if (off && (!isNether || off.typeId !== "minecraft:water_bucket") && resolveClutchItem(off)) return true;
    }

    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && (!isNether || item.typeId !== "minecraft:water_bucket") && resolveClutchItem(item)) {
          return true;
        }
      }
    }
  } catch {}
  return false;
}

/**
 * Fast check to verify if the player possesses a Totem of Undying
 * in hands or anywhere in inventory.
 */
function hasTotemOfUndying(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (equippable) {
      if (equippable.getEquipment("Offhand")?.typeId === "minecraft:totem_of_undying") return true;
      if (equippable.getEquipment("Mainhand")?.typeId === "minecraft:totem_of_undying") return true;
    }

    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        if (container.getItem(i)?.typeId === "minecraft:totem_of_undying") return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Totem of Undying Fail-Safe:
 * If the player has no clutch item and is about to hit the ground,
 * searches the inventory for a Totem of Undying and safely equips it into the Offhand slot,
 * swapping any existing offhand item into the inventory slot that held the Totem.
 */
function tryTriggerTotemFailSafe(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return false;

    // Check if player is already holding a Totem in Offhand or Mainhand
    const currentOffhand = equippable.getEquipment("Offhand");
    if (currentOffhand && currentOffhand.typeId === "minecraft:totem_of_undying") {
      return true;
    }
    const currentMainhand = equippable.getEquipment("Mainhand");
    if (currentMainhand && currentMainhand.typeId === "minecraft:totem_of_undying") {
      return true;
    }

    // Search inventory for Totem of Undying
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (!container) return false;

    let totemSlot = -1;
    for (let slot = 0; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && item.typeId === "minecraft:totem_of_undying") {
        totemSlot = slot;
        break;
      }
    }

    if (totemSlot === -1) return false;

    // Swap existing offhand item into the inventory slot that held the Totem
    const totemItem = container.getItem(totemSlot);

    if (currentOffhand) {
      container.setItem(totemSlot, currentOffhand);
    } else {
      if (totemItem.amount > 1) {
        totemItem.amount -= 1;
        container.setItem(totemSlot, totemItem);
      } else {
        container.setItem(totemSlot, undefined);
      }
    }

    // Equip Totem of Undying into Offhand
    equippable.setEquipment("Offhand", new ItemStack("minecraft:totem_of_undying", 1));

    // Arm swing animation & subtle armor equip sound
    try {
      player.playAnimation("animation.player.attack_bare_hand");
      player.dimension.playSound("armor.equip_generic", player.location, { volume: 1.0, pitch: 1.0 });
    } catch {}

    return true;
  } catch {
    return false;
  }
}

/**
 * Acquires a clutch item.
 * - Simple Mode: only checks mainhand & offhand.
 * - Full / Extreme Mode: checks hands first; if none, auto-switches hotbar or swaps directly from inventory.
 */
function acquireClutchItem(player, mode) {
  const equippable = player.getComponent("minecraft:equippable");
  const invComp = player.getComponent("minecraft:inventory");
  const container = invComp?.container;
  const isNether = player.dimension?.id === "minecraft:nether";

  // 1. Check Mainhand
  const mainhand = equippable?.getEquipment("Mainhand");
  if (mainhand && (!isNether || mainhand.typeId !== "minecraft:water_bucket")) {
    const mainDef = resolveClutchItem(mainhand);
    if (mainDef) {
      return {
        itemStack: mainhand,
        isOffhand: false,
        containerSlot: player.selectedSlotIndex,
        definition: mainDef
      };
    }
  }

  // 2. Check Offhand
  const offhand = equippable?.getEquipment("Offhand");
  if (offhand && (!isNether || offhand.typeId !== "minecraft:water_bucket")) {
    const offDef = resolveClutchItem(offhand);
    if (offDef) {
      return {
        itemStack: offhand,
        isOffhand: true,
        containerSlot: null,
        definition: offDef
      };
    }
  }

  // If Simple Mode, no inventory search
  if (mode === "simple" || !container) {
    return null;
  }

  // 3. Full / Extreme Mode: Auto-switch from inventory using dimension priority
  const match = findBestClutchItemInInventory(container, player.dimension?.id);
  if (!match) return null;

  const originalHotbarSlot = player.selectedSlotIndex;

  if (match.inHotbar) {
    // Switch active hotbar slot index directly
    player.selectedSlotIndex = match.slot;
    const switchedItem = container.getItem(match.slot);
    const definition = resolveClutchItem(switchedItem);
    if (!definition) return null;

    return {
      itemStack: switchedItem,
      isOffhand: false,
      containerSlot: match.slot,
      definition
    };
  } else {
    // Swap item directly between upper inventory and active hotbar slot via container.setItem
    try {
      const hotbarItem = container.getItem(originalHotbarSlot);
      const invItem = container.getItem(match.slot);

      container.setItem(originalHotbarSlot, invItem);
      container.setItem(match.slot, hotbarItem);

      const switchedItem = container.getItem(originalHotbarSlot);
      const definition = resolveClutchItem(switchedItem);
      if (!definition) return null;

      return {
        itemStack: switchedItem,
        isOffhand: false,
        containerSlot: originalHotbarSlot,
        definition
      };
    } catch {
      return null;
    }
  }
}

/**
 * Checks if a block is air or passable foliage.
 */
function isPassableOrAir(block) {
  if (!block) return false;
  if (block.isAir) return true;
  return PASSABLE_OR_AIR_BLOCKS.has(block.typeId);
}

/**
 * Scans downward beneath player to locate the impact surface block.
 */
function findGroundBelow(dimension, location) {
  const px = Math.floor(location.x);
  const pz = Math.floor(location.z);
  const startY = Math.floor(location.y);
  const minY = Math.max(dimension.minHeight ?? -64, startY - 16);

  for (let y = startY; y >= minY; y--) {
    let block;
    try {
      block = dimension.getBlock({ x: px, y, z: pz });
    } catch {
      break;
    }
    if (!block) break;

    if (!isPassableOrAir(block)) {
      let airAbove;
      try {
        airAbove = dimension.getBlock({ x: px, y: y + 1, z: pz });
      } catch {}
      if (airAbove) {
        return {
          surfaceBlock: block,
          airBlockAbove: airAbove,
          surfaceY: y
        };
      }
      break;
    }
  }

  return null;
}

/**
 * Checks if a block natively supports waterlogging.
 */
function isWaterloggableBlock(block) {
  if (!block || !block.permutation) return false;

  try {
    const state = block.permutation.getState("waterlogged");
    if (state !== undefined) {
      return state === false;
    }
  } catch {}

  const id = block.typeId;
  const isCandidate =
    id.includes("_stairs") ||
    id.includes("_slab") ||
    id.includes("fence") ||
    id.includes("wall") ||
    id.includes("_trapdoor");

  if (isCandidate) {
    try {
      const perm = block.permutation.withState("waterlogged", true);
      return perm !== undefined;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Safely consumes 1 item from the accurate container slot or offhand.
 */
function consumeClutchItem(player, clutchData, replacementTypeId) {
  try {
    let isCreative = false;
    try {
      isCreative = player.matches({ gameMode: "creative" });
    } catch {}

    if (isCreative) return;

    if (clutchData.isOffhand) {
      const equippable = player.getComponent("minecraft:equippable");
      if (!equippable) return;
      const offhand = equippable.getEquipment("Offhand");
      if (!offhand) return;

      if (replacementTypeId) {
        equippable.setEquipment("Offhand", new ItemStack(replacementTypeId, 1));
      } else {
        if (offhand.amount > 1) {
          offhand.amount -= 1;
          equippable.setEquipment("Offhand", offhand);
        } else {
          equippable.setEquipment("Offhand", undefined);
        }
      }
    } else {
      const inventory = player.getComponent("minecraft:inventory");
      const container = inventory?.container;
      if (!container || clutchData.containerSlot === null) return;

      const currentItem = container.getItem(clutchData.containerSlot);
      if (!currentItem) return;

      if (replacementTypeId) {
        container.setItem(clutchData.containerSlot, new ItemStack(replacementTypeId, 1));
      } else {
        if (currentItem.amount > 1) {
          currentItem.amount -= 1;
          container.setItem(clutchData.containerSlot, currentItem);
        } else {
          container.setItem(clutchData.containerSlot, undefined);
        }
      }
    }
  } catch {}
}

/**
 * Restores 1 water bucket to player inventory or equipment after auto-scooping.
 */
function restoreWaterBucket(player, clutchData) {
  try {
    let isCreative = false;
    try {
      isCreative = player.matches({ gameMode: "creative" });
    } catch {}
    if (isCreative) return;

    if (clutchData.isOffhand) {
      const equippable = player.getComponent("minecraft:equippable");
      if (equippable) {
        const off = equippable.getEquipment("Offhand");
        if (off && off.typeId === "minecraft:bucket") {
          equippable.setEquipment("Offhand", new ItemStack("minecraft:water_bucket", 1));
          return;
        }
      }
    } else {
      const inventory = player.getComponent("minecraft:inventory");
      const container = inventory?.container;
      if (container && clutchData.containerSlot !== null) {
        const item = container.getItem(clutchData.containerSlot);
        if (item && item.typeId === "minecraft:bucket") {
          container.setItem(clutchData.containerSlot, new ItemStack("minecraft:water_bucket", 1));
          return;
        }
      }
    }

    // General fallback: search inventory for first bucket
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && item.typeId === "minecraft:bucket") {
          if (item.amount === 1) {
            container.setItem(i, new ItemStack("minecraft:water_bucket", 1));
          } else {
            item.amount -= 1;
            container.setItem(i, item);
            container.addItem(new ItemStack("minecraft:water_bucket", 1));
          }
          return;
        }
      }
    }
  } catch {}
}

/**
 * Restores 1 powder snow bucket to player inventory or equipment after auto-scooping.
 */
function restorePowderSnowBucket(player, clutchData) {
  try {
    let isCreative = false;
    try {
      isCreative = player.matches({ gameMode: "creative" });
    } catch {}
    if (isCreative) return;

    if (clutchData.isOffhand) {
      const equippable = player.getComponent("minecraft:equippable");
      if (equippable) {
        const off = equippable.getEquipment("Offhand");
        if (off && off.typeId === "minecraft:bucket") {
          equippable.setEquipment("Offhand", new ItemStack("minecraft:powder_snow_bucket", 1));
          return;
        }
      }
    } else {
      const inventory = player.getComponent("minecraft:inventory");
      const container = inventory?.container;
      if (container && clutchData.containerSlot !== null) {
        const item = container.getItem(clutchData.containerSlot);
        if (item && item.typeId === "minecraft:bucket") {
          container.setItem(clutchData.containerSlot, new ItemStack("minecraft:powder_snow_bucket", 1));
          return;
        }
      }
    }

    // General fallback: search inventory for first bucket
    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (item && item.typeId === "minecraft:bucket") {
          if (item.amount === 1) {
            container.setItem(i, new ItemStack("minecraft:powder_snow_bucket", 1));
          } else {
            item.amount -= 1;
            container.setItem(i, item);
            container.addItem(new ItemStack("minecraft:powder_snow_bucket", 1));
          }
          return;
        }
      }
    }
  } catch {}
}

// =============================================================================
// Clutch Execution Logic
// =============================================================================

/**
 * Places boat at ground surface first at user's max placing length,
 * then auto-rides player with a slight delay upon touchdown.
 * Strictly NO teleporting. Player remains seated in the boat after absorbing impact.
 */
function placeBoatClutch(dimension, airBlock, entityType, player, distToSurface, fallSpeed) {
  try {
    const spawnPos = {
      x: airBlock.location.x + 0.5,
      y: airBlock.location.y,
      z: airBlock.location.z + 0.5
    };
    const boat = dimension.spawnEntity(entityType, spawnPos);
    if (!boat) return false;

    // Calculate slight delay (1 to 2 ticks) so boat visibly spawns first before player enters
    const speed = Math.max(0.5, Math.abs(fallSpeed));
    const delayTicks = Math.max(1, Math.min(2, Math.round(distToSurface / speed)));

    // Delayed auto-entry: player enters boat natively via rideable component. Strictly NO teleporting!
    system.runTimeout(() => {
      try {
        if (boat.isValid() && player.isValid()) {
          const rideable = boat.getComponent("minecraft:rideable");
          if (rideable) {
            rideable.addRider(player);
            try {
              player.clearVelocity();
            } catch {}
          }
        }
      } catch {}
    }, delayTicks);

    return true;
  } catch {
    return false;
  }
}

function executeAutoScoop(clutch) {
  try {
    const { player, targetPos, dimension, wasWaterlogged, clutchData } = clutch;

    if (!player || !player.isValid()) return;

    // Do NOT scoop water if the player died
    let health = 20;
    try {
      health = player.getComponent("minecraft:health")?.currentValue ?? 20;
    } catch {}
    if (health <= 0) return;

    try {
      const block = dimension.getBlock(targetPos);
      if (block) {
        if (wasWaterlogged) {
          try {
            if (block.permutation.getState("waterlogged") === true) {
              block.setPermutation(block.permutation.withState("waterlogged", false));
            }
          } catch {}
        } else {
          if (block.typeId === "minecraft:water" || block.typeId === "minecraft:flowing_water") {
            block.setType("minecraft:air");
          }
        }
      }
    } catch {}

    // Sound and animation
    try {
      dimension.playSound("bucket.fill_water", player.location, { volume: 1.0, pitch: 1.0 });
    } catch {}

    try {
      player.playAnimation("animation.player.attack_bare_hand");
    } catch {}

    // Restore water bucket in inventory
    restoreWaterBucket(player, clutchData);
  } finally {
    activeWaterClutches.delete(clutch.player.id);
  }
}

function executeAutoScoopPowderSnow(clutch) {
  try {
    const { player, targetPos, dimension, clutchData } = clutch;

    if (!player || !player.isValid()) return;

    // Do NOT scoop if the player died
    let health = 20;
    try {
      health = player.getComponent("minecraft:health")?.currentValue ?? 20;
    } catch {}
    if (health <= 0) return;

    let isStillPowderSnow = false;
    try {
      const block = dimension.getBlock(targetPos);
      if (block && block.typeId === "minecraft:powder_snow") {
        isStillPowderSnow = true;
        block.setType("minecraft:air");
      }
    } catch {}

    // Only restore powder snow bucket if the block was NOT melted/extinguished by fire
    if (isStillPowderSnow) {
      try {
        dimension.playSound("bucket.fill_powder_snow", player.location, { volume: 1.0, pitch: 1.0 });
      } catch {}

      try {
        player.playAnimation("animation.player.attack_bare_hand");
      } catch {}

      restorePowderSnowBucket(player, clutchData);
    }
  } finally {
    activePowderSnowClutches.delete(clutch.player.id);
  }
}

function executeClutch(player, velocity, clutchData, ground, distToSurface) {
  const { definition } = clutchData;
  const { surfaceBlock, airBlockAbove } = ground;
  const dimension = player.dimension;

  // 1. Arm swing animation 1-2 ticks prior to impact
  try {
    player.playAnimation("animation.player.attack_bare_hand");
  } catch {}

  // 2. Play item placement sound cue
  try {
    dimension.playSound(definition.placeSound, player.location, { volume: 1.0, pitch: 1.0 });
  } catch {}

  let placementSuccess = false;

  // 3. Category placement
  switch (definition.category) {
    case "water": {
      const canWaterlog = isWaterloggableBlock(surfaceBlock);
      let wasWaterlogged = false;
      let targetPos = null;

      if (canWaterlog) {
        try {
          surfaceBlock.setPermutation(surfaceBlock.permutation.withState("waterlogged", true));
          wasWaterlogged = true;
          targetPos = surfaceBlock.location;
          placementSuccess = true;
        } catch {}
      }

      if (!wasWaterlogged) {
        try {
          airBlockAbove.setType("minecraft:water");
          wasWaterlogged = false;
          targetPos = airBlockAbove.location;
          placementSuccess = true;
        } catch {}
      }

      if (placementSuccess && targetPos) {
        // Clear velocity to eliminate fatal impact momentum
        try {
          player.clearVelocity();
        } catch {}

        consumeClutchItem(player, clutchData, "minecraft:bucket");

        activeWaterClutches.set(player.id, {
          player,
          targetPos,
          dimension,
          wasWaterlogged,
          deployedTick: system.currentTick,
          scheduled: false,
          clutchData
        });
      }
      break;
    }

    case "powder_snow": {
      try {
        airBlockAbove.setType("minecraft:powder_snow");
        placementSuccess = true;

        try {
          player.clearVelocity();
        } catch {}

        consumeClutchItem(player, clutchData, "minecraft:bucket");

        activePowderSnowClutches.set(player.id, {
          player,
          targetPos: airBlockAbove.location,
          dimension,
          deployedTick: system.currentTick,
          scheduled: false,
          clutchData
        });
      } catch {}
      break;
    }

    case "vines": {
      try {
        airBlockAbove.setType(definition.blockId);
        if (airBlockAbove.typeId === definition.blockId) {
          consumeClutchItem(player, clutchData);
          placementSuccess = true;

          try {
            player.clearVelocity();
          } catch {}
        }
      } catch {}
      break;
    }

    case "block": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeClutchItem(player, clutchData);
        placementSuccess = true;
      } catch {}
      break;
    }

    case "boat": {
      if (placeBoatClutch(dimension, airBlockAbove, definition.entityType, player, distToSurface, velocity.y)) {
        consumeClutchItem(player, clutchData);
        placementSuccess = true;
      }
      break;
    }

    case "sweet_berries": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeClutchItem(player, clutchData);
        placementSuccess = true;
      } catch {}
      break;
    }
  }

  if (placementSuccess) {
    lastClutchTick.set(player.id, system.currentTick);
  }
}

// =============================================================================
// Core Game Loop
// =============================================================================

system.runInterval(() => {
  const currentTick = system.currentTick;

  // 1. Process active water clutches awaiting player touchdown
  for (const [playerId, clutch] of activeWaterClutches.entries()) {
    const player = clutch.player;
    if (!player || !player.isValid()) {
      activeWaterClutches.delete(playerId);
      continue;
    }

    if (!clutch.scheduled) {
      let vel = { x: 0, y: 0, z: 0 };
      try {
        vel = player.getVelocity();
      } catch {}

      const hasLanded = player.isOnGround === true || Math.abs(vel.y) < 0.1 || (currentTick - clutch.deployedTick > 15);

      if (hasLanded) {
        clutch.scheduled = true;
        system.runTimeout(() => {
          executeAutoScoop(clutch);
        }, 3);
      }
    }
  }

  // 2. Process active powder snow clutches awaiting player touchdown
  for (const [playerId, clutch] of activePowderSnowClutches.entries()) {
    const player = clutch.player;
    if (!player || !player.isValid()) {
      activePowderSnowClutches.delete(playerId);
      continue;
    }

    if (!clutch.scheduled) {
      let vel = { x: 0, y: 0, z: 0 };
      try {
        vel = player.getVelocity();
      } catch {}

      const hasLanded = player.isOnGround === true || Math.abs(vel.y) < 0.1 || (currentTick - clutch.deployedTick > 15);

      if (hasLanded) {
        clutch.scheduled = true;
        system.runTimeout(() => {
          executeAutoScoopPowderSnow(clutch);
        }, 3);
      }
    }
  }

  // 3. Scan all players for clutch conditions & Totem fail-safe
  for (const player of world.getAllPlayers()) {
    try {
      if (!player.isValid()) continue;

      let vel = { x: 0, y: 0, z: 0 };
      try {
        vel = player.getVelocity();
      } catch {
        continue;
      }

      // Check gliding / swimming / in-water
      let isSwimmingOrGliding = false;
      try {
        isSwimmingOrGliding = player.isGliding || player.isInWater || player.isSwimming;
      } catch {}
      if (isSwimmingOrGliding) continue;

      // Track fall distance manually
      const currentFallDist = trackPlayerFall(player, vel);

      // Downward velocity check: must be actively falling downward
      if (vel.y > -0.5) continue;

      // Threshold check
      const threshold = getPlayerThreshold(player);

      // Raycast downward to find impact surface
      const ground = findGroundBelow(player.dimension, player.location);
      if (!ground) continue;

      // Distance from player feet to surface face
      const distToSurface = player.location.y - (ground.surfaceY + 1);
      if (distToSurface < 0.1) continue;

      // Total cliff height (apex to ground)
      const tracker = fallTrackers.get(player.id);
      const totalDropHeight = tracker ? (tracker.startY - (ground.surfaceY + 1)) : currentFallDist;

      // Verify that this fall meets the height requirement
      if (currentFallDist < threshold && totalDropHeight < threshold) continue;

      // Resolve operating mode (full, simple, or extreme)
      const mode = getPlayerMode(player);

      // Extreme Mode: Auto smooth look-down & doom condition
      if (mode === "extreme") {
        const hasClutch = hasAnyClutchItem(player);
        const hasTotem = hasTotemOfUndying(player);

        if (!hasClutch && !hasTotem) {
          // Doom condition: no clutch item and no totem anywhere.
          // Do not adjust camera, do not intervene. Player falls to their doom.
          continue;
        }

        if (hasClutch) {
          // Auto smooth look-down: smoothly tilt camera pitch downward towards impact surface
          const currentRot = player.getRotation();
          const TARGET_PITCH = 82; // optimal placement pitch directly at feet
          if (currentRot.x < TARGET_PITCH) {
            const step = Math.min(TARGET_PITCH - currentRot.x, Math.max(12, (TARGET_PITCH - currentRot.x) * 0.5));
            const newPitch = Math.min(TARGET_PITCH, currentRot.x + step);
            try {
              player.setRotation({ x: newPitch, y: currentRot.y });
            } catch {}
          }
        }
      }

      // Debounce: prevent multiple clutches within the same 25 ticks
      const lastTick = lastClutchTick.get(player.id) ?? 0;
      if (currentTick - lastTick < 25) continue;

      // Pitch Check: player must be looking down towards ground (rot.x >= 55 degrees)
      const rot = player.getRotation();
      if (mode !== "extreme" && rot.x < 55) continue;

      // Acquire clutch item (from hands or auto-switched from inventory)
      const clutchData = acquireClutchItem(player, mode);

      // Trigger distance:
      // If boat clutch, use user's max placement reach distance (4.5 blocks in vanilla Survival).
      // For all other clutches, use speed-based 1-2 tick impact prediction window.
      const fallSpeed = Math.abs(vel.y);
      const isBoat = clutchData?.definition?.category === "boat";
      const maxTriggerDistance = isBoat ? 4.5 : Math.max(2.2, fallSpeed * 1.6 + 0.4);

      // Trigger strictly within reaching/prediction distance
      if (distToSurface > maxTriggerDistance) continue;

      // In extreme mode, guarantee downward rotation right at placement
      if (mode === "extreme" && rot.x < 70) {
        try {
          player.setRotation({ x: 82, y: rot.y });
        } catch {}
      }

      if (clutchData) {
        // Execute clutch!
        executeClutch(player, vel, clutchData, ground, distToSurface);
      } else {
        // Clutch item unavailable or placement impossible -> Totem of Undying Fail-Safe!
        tryTriggerTotemFailSafe(player);
      }
    } catch {}
  }
}, 1);

// Startup notification (server console only)
world.afterEvents.worldInitialize.subscribe(() => {
  console.warn(`[Universal Clutch] Initialized. Default Mode: ${DEFAULT_MODE} | Fall Threshold: ${DEFAULT_THRESHOLD} blocks.`);
});
