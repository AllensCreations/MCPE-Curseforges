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
const DEFAULT_MODE = "full";

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
  "minecraft:ladder": {
    name: "Ladder",
    category: "ladder",
    blockId: "minecraft:ladder",
    placeSound: "block.ladder.place"
  },
  "minecraft:sweet_berries": {
    name: "Sweet Berries",
    category: "sweet_berries",
    blockId: "minecraft:sweet_berry_bush",
    placeSound: "block.sweet_berry_bush.place"
  }
};

/**
 * Priority order when searching inventory in Full Mode.
 */
const CLUTCH_PRIORITY = [
  "minecraft:water_bucket",
  "minecraft:slime",
  "minecraft:web",
  "minecraft:hay_block",
  "boat",
  "minecraft:ladder",
  "minecraft:sweet_berries"
];

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
function findBestClutchItemInInventory(container) {
  if (!container) return null;

  for (const pKey of CLUTCH_PRIORITY) {
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
 * Used for Extreme Mode doom condition detection.
 */
function hasAnyClutchItem(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (equippable) {
      const main = equippable.getEquipment("Mainhand");
      if (resolveClutchItem(main)) return true;
      const off = equippable.getEquipment("Offhand");
      if (resolveClutchItem(off)) return true;
    }

    const inventory = player.getComponent("minecraft:inventory");
    const container = inventory?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (resolveClutchItem(item)) return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Acquires a clutch item.
 * - Simple Mode: only checks mainhand & offhand.
 * - Full Mode: checks hands first; if none, auto-switches hotbar or swaps directly from inventory.
 */
function acquireClutchItem(player, mode) {
  const equippable = player.getComponent("minecraft:equippable");
  const invComp = player.getComponent("minecraft:inventory");
  const container = invComp?.container;

  // 1. Check Mainhand
  const mainhand = equippable?.getEquipment("Mainhand");
  const mainDef = resolveClutchItem(mainhand);
  if (mainDef && mainhand) {
    return {
      itemStack: mainhand,
      isOffhand: false,
      containerSlot: player.selectedSlotIndex,
      definition: mainDef,
      autoSwitched: null
    };
  }

  // 2. Check Offhand
  const offhand = equippable?.getEquipment("Offhand");
  const offDef = resolveClutchItem(offhand);
  if (offDef && offhand) {
    return {
      itemStack: offhand,
      isOffhand: true,
      containerSlot: null,
      definition: offDef,
      autoSwitched: null
    };
  }

  // If Simple Mode, no inventory search
  if (mode === "simple" || !container) {
    return null;
  }

  // 3. Full Mode: Auto-switch from inventory
  const match = findBestClutchItemInInventory(container);
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
      definition,
      autoSwitched: {
        type: "hotbar_index",
        previousSlot: originalHotbarSlot
      }
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
        definition,
        autoSwitched: {
          type: "inv_swap",
          originalInvSlot: match.slot,
          hotbarSlot: originalHotbarSlot
        }
      };
    } catch {
      return null;
    }
  }
}

/**
 * Restores previous hotbar slot or swaps back inventory item.
 */
function restoreAutoSwitched(player, autoSwitched) {
  if (!player || !player.isValid() || !autoSwitched) return;

  try {
    if (autoSwitched.type === "hotbar_index") {
      player.selectedSlotIndex = autoSwitched.previousSlot;
    } else if (autoSwitched.type === "inv_swap") {
      const inventory = player.getComponent("minecraft:inventory");
      const container = inventory?.container;
      if (container) {
        const currentHotbar = container.getItem(autoSwitched.hotbarSlot);
        const currentInv = container.getItem(autoSwitched.originalInvSlot);
        container.setItem(autoSwitched.hotbarSlot, currentInv);
        container.setItem(autoSwitched.originalInvSlot, currentHotbar);
      }
    }
  } catch {}
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

// =============================================================================
// Clutch Execution Logic
// =============================================================================

function placeLadderClutch(dimension, airBlock, player) {
  const { x, y, z } = airBlock.location;

  const wallChecks = [
    { dir: 2, pos: { x, y, z: z - 1 } },
    { dir: 3, pos: { x, y, z: z + 1 } },
    { dir: 4, pos: { x: x - 1, y, z } },
    { dir: 5, pos: { x: x + 1, y, z } }
  ];

  for (const check of wallChecks) {
    try {
      const wall = dimension.getBlock(check.pos);
      if (wall && !wall.isAir && !wall.isLiquid && !PASSABLE_OR_AIR_BLOCKS.has(wall.typeId)) {
        const perm = BlockPermutation.resolve("minecraft:ladder", {
          facing_direction: check.dir
        });
        airBlock.setPermutation(perm);
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Places boat and auto-rides player to absorb fall damage.
 * Note: Player stays in the boat (NO auto-eject).
 */
function placeBoatClutch(dimension, airBlock, entityType, player) {
  try {
    const spawnPos = {
      x: airBlock.location.x + 0.5,
      y: airBlock.location.y,
      z: airBlock.location.z + 0.5
    };
    const boat = dimension.spawnEntity(entityType, spawnPos);
    if (!boat) return false;

    // Auto-ride: immediately seat the player inside the boat to absorb 100% of the fall
    try {
      const rideable = boat.getComponent("minecraft:rideable");
      if (rideable) {
        rideable.addRider(player);
      }
    } catch {}

    // Clear velocity so impact is absorbed cleanly by the boat
    try {
      player.clearVelocity();
    } catch {}

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

    // If auto-switched, restore previous item / hotbar slot
    if (clutchData.autoSwitched) {
      restoreAutoSwitched(player, clutchData.autoSwitched);
    }
  } finally {
    activeWaterClutches.delete(clutch.player.id);
  }
}

function executeClutch(player, velocity, clutchData, ground) {
  const { definition, autoSwitched } = clutchData;
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

        // Momentary 10-tick (0.5s) slow falling to prevent tick-boundary fall damage glitch
        try {
          player.addEffect("slow_falling", 10, { amplifier: 0, showParticles: false });
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

    case "block": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeClutchItem(player, clutchData);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }
      } catch {}
      break;
    }

    case "ladder": {
      if (placeLadderClutch(dimension, airBlockAbove, player)) {
        consumeClutchItem(player, clutchData);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }
      }
      break;
    }

    case "boat": {
      if (placeBoatClutch(dimension, airBlockAbove, definition.entityType, player)) {
        consumeClutchItem(player, clutchData);
        placementSuccess = true;

        // Restore held hotbar slot 5 ticks later so active slot returns to previous weapon while riding
        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 5);
        }
      }
      break;
    }

    case "sweet_berries": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeClutchItem(player, clutchData);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }
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

  // 2. Scan all players for clutch conditions
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
        const hasItem = hasAnyClutchItem(player);
        if (!hasItem) {
          // Doom condition: no clutch item anywhere in hands or inventory.
          // Do not adjust camera, do not intervene. Player falls to their doom.
          continue;
        }

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

      // Debounce: prevent multiple clutches within the same 25 ticks
      const lastTick = lastClutchTick.get(player.id) ?? 0;
      if (currentTick - lastTick < 25) continue;

      // Pitch Check: player must be looking down towards ground (rot.x >= 55 degrees)
      const rot = player.getRotation();
      if (mode !== "extreme" && rot.x < 55) continue;

      // Speed-based 1-2 tick impact prediction window
      const fallSpeed = Math.abs(vel.y);
      const predictionWindow = Math.max(2.2, fallSpeed * 1.6 + 0.4);

      // Trigger strictly within 1-2 ticks before ground impact
      if (distToSurface > predictionWindow) continue;

      // In extreme mode, guarantee downward rotation right at placement
      if (mode === "extreme" && rot.x < 70) {
        try {
          player.setRotation({ x: 82, y: rot.y });
        } catch {}
      }

      // Acquire clutch item (from hands or auto-switched from inventory)
      const clutchData = acquireClutchItem(player, mode);
      if (!clutchData) continue;

      // Execute clutch!
      executeClutch(player, vel, clutchData, ground);
    } catch {}
  }
}, 1);

// Startup notification (server console only)
world.afterEvents.worldInitialize.subscribe(() => {
  console.warn(`[Universal Clutch] Initialized. Default Mode: ${DEFAULT_MODE} | Fall Threshold: ${DEFAULT_THRESHOLD} blocks.`);
});
