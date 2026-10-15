/**
 * Universal Clutch by AllensCreations
 * 
 * Standalone Minecraft Bedrock Script API (@minecraft/server v1.13.0+) Add-on.
 * Single-file implementation (no external script dependencies or module imports).
 * 
 * Automatically performs clutch placements when falling from dangerous heights,
 * featuring 1-2 tick impact prediction, authentic arm swing animations,
 * placement sounds, native waterlogged block handling, automatic water scooping,
 * and Full / Simple mode support.
 * 
 * Modes:
 * - Full Mode (Default): Automatically scans hotbar & inventory for clutch items,
 *   auto-switches/equips them to clutch, and restores the previous item upon landing.
 * - Simple Mode: Only triggers if a clutch item is actively held in mainhand or offhand.
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
 * Options: "full" (auto-switch inventory) or "simple" (held item only)
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
 * Resolves player operating mode ("full" or "simple").
 * Prioritizes tags: "clutch_mode:full", "clutch_mode:simple".
 */
function getPlayerMode(player) {
  try {
    const tags = player.getTags();
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
      // If player jumped upward before falling, reset apex startY
      if (loc.y > tracker.startY) {
        tracker.startY = loc.y;
      }
      tracker.lastY = loc.y;
      tracker.fallDist = Math.max(0, tracker.startY - loc.y);
    }
    return tracker.fallDist;
  } else {
    // Player landed or is stationary
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
 * Acquires a clutch item.
 * - Simple Mode: only checks mainhand & offhand.
 * - Full Mode: checks hands first; if none, auto-switches hotbar or swaps from upper inventory.
 */
function acquireClutchItem(player, mode) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return null;

  // 1. Check Mainhand
  const mainhand = equippable.getEquipment("Mainhand");
  const mainDef = resolveClutchItem(mainhand);
  if (mainDef && mainhand) {
    return { itemStack: mainhand, slot: "Mainhand", definition: mainDef, autoSwitched: null };
  }

  // 2. Check Offhand
  const offhand = equippable.getEquipment("Offhand");
  const offDef = resolveClutchItem(offhand);
  if (offDef && offhand) {
    return { itemStack: offhand, slot: "Offhand", definition: offDef, autoSwitched: null };
  }

  // If Simple Mode, no inventory search
  if (mode === "simple") {
    return null;
  }

  // 3. Full Mode: Auto-switch from inventory
  const inventory = player.getComponent("minecraft:inventory");
  if (!inventory || !inventory.container) return null;
  const container = inventory.container;

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
      slot: "Mainhand",
      definition,
      autoSwitched: {
        type: "hotbar_index",
        previousSlot: originalHotbarSlot
      }
    };
  } else {
    // Swap item from upper inventory into the active hotbar slot
    try {
      container.swapItems(match.slot, originalHotbarSlot, container);
      const swappedItem = container.getItem(originalHotbarSlot);
      const definition = resolveClutchItem(swappedItem);
      if (!definition) return null;

      return {
        itemStack: swappedItem,
        slot: "Mainhand",
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
      if (inventory && inventory.container) {
        inventory.container.swapItems(autoSwitched.originalInvSlot, autoSwitched.hotbarSlot, inventory.container);
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
      block = dimension.getBlock({ x: px, y: y, z: pz });
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
 * Safely consumes 1 item from the specified equipment slot.
 */
function consumeHeldItem(player, slot, replacementTypeId) {
  try {
    // Check creative mode safely
    let isCreative = false;
    try {
      isCreative = player.matches({ gameMode: "creative" });
    } catch {}

    if (isCreative) return;

    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return;

    const currentItem = equippable.getEquipment(slot);
    if (!currentItem) return;

    if (replacementTypeId) {
      equippable.setEquipment(slot, new ItemStack(replacementTypeId, 1));
    } else {
      if (currentItem.amount > 1) {
        currentItem.amount -= 1;
        equippable.setEquipment(slot, currentItem);
      } else {
        equippable.setEquipment(slot, undefined);
      }
    }
  } catch {}
}

/**
 * Restores 1 water bucket to player inventory or equipment after auto-scooping.
 */
function restoreWaterBucket(player, preferredSlot) {
  try {
    let isCreative = false;
    try {
      isCreative = player.matches({ gameMode: "creative" });
    } catch {}

    if (isCreative) return;

    const equippable = player.getComponent("minecraft:equippable");
    if (equippable) {
      const item = equippable.getEquipment(preferredSlot);
      if (item && item.typeId === "minecraft:bucket") {
        equippable.setEquipment(preferredSlot, new ItemStack("minecraft:water_bucket", 1));
        return;
      }

      const altSlot = preferredSlot === "Mainhand" ? "Offhand" : "Mainhand";
      const altItem = equippable.getEquipment(altSlot);
      if (altItem && altItem.typeId === "minecraft:bucket") {
        equippable.setEquipment(altSlot, new ItemStack("minecraft:water_bucket", 1));
        return;
      }
    }

    const inventory = player.getComponent("minecraft:inventory");
    if (inventory && inventory.container) {
      const container = inventory.container;
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

function placeBoatClutch(dimension, airBlock, entityType) {
  try {
    const spawnPos = {
      x: airBlock.location.x + 0.5,
      y: airBlock.location.y,
      z: airBlock.location.z + 0.5
    };
    dimension.spawnEntity(entityType, spawnPos);
    return true;
  } catch {
    return false;
  }
}

function executeAutoScoop(clutch) {
  try {
    const { player, targetPos, dimension, wasWaterlogged, heldSlot, autoSwitched } = clutch;

    if (!player || !player.isValid()) return;

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
    restoreWaterBucket(player, heldSlot);

    // If auto-switched, restore previous item / hotbar slot
    if (autoSwitched) {
      restoreAutoSwitched(player, autoSwitched);
    }

    try {
      player.onScreenDisplay.setActionBar("§b✦ Water Clutch: Auto-Scooped!§r");
    } catch {}
  } finally {
    activeWaterClutches.delete(clutch.player.id);
  }
}

function executeClutch(player, velocity, clutchData, ground) {
  const { slot, definition, autoSwitched } = clutchData;
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
        consumeHeldItem(player, slot, "minecraft:bucket");

        activeWaterClutches.set(player.id, {
          player,
          targetPos,
          dimension,
          wasWaterlogged,
          deployedTick: system.currentTick,
          scheduled: false,
          heldSlot: slot,
          autoSwitched
        });

        const prefix = autoSwitched ? "§e✦ [Auto-Switch] " : "§9✦ ";
        try {
          player.onScreenDisplay.setActionBar(`${prefix}Water Clutch Deployed!§r`);
        } catch {}
      }
      break;
    }

    case "block": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeHeldItem(player, slot);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }

        const prefix = autoSwitched ? "§e✦ [Auto-Switch] " : "§a✦ ";
        try {
          player.onScreenDisplay.setActionBar(`${prefix}${definition.name} Clutch Deployed!§r`);
        } catch {}
      } catch {}
      break;
    }

    case "ladder": {
      if (placeLadderClutch(dimension, airBlockAbove, player)) {
        consumeHeldItem(player, slot);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }

        const prefix = autoSwitched ? "§e✦ [Auto-Switch] " : "§6✦ ";
        try {
          player.onScreenDisplay.setActionBar(`${prefix}Ladder Clutch Deployed!§r`);
        } catch {}
      }
      break;
    }

    case "boat": {
      if (placeBoatClutch(dimension, airBlockAbove, definition.entityType)) {
        consumeHeldItem(player, slot);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }

        const prefix = autoSwitched ? "§e✦ [Auto-Switch] " : "§e✦ ";
        try {
          player.onScreenDisplay.setActionBar(`${prefix}Boat Clutch Deployed!§r`);
        } catch {}
      }
      break;
    }

    case "sweet_berries": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeHeldItem(player, slot);
        placementSuccess = true;

        if (autoSwitched) {
          system.runTimeout(() => restoreAutoSwitched(player, autoSwitched), 4);
        }

        const prefix = autoSwitched ? "§e✦ [Auto-Switch] " : "§c✦ ";
        try {
          player.onScreenDisplay.setActionBar(`${prefix}Sweet Berry Bush Clutch Deployed!§r`);
        } catch {}
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

      // Track fall distance manually (entity.fallDistance is not available in 1.13.0)
      const currentFallDist = trackPlayerFall(player, vel);

      // Debounce: prevent multiple clutches within the same 25 ticks
      const lastTick = lastClutchTick.get(player.id) ?? 0;
      if (currentTick - lastTick < 25) continue;

      // Pitch Check: player must be looking down towards ground (rot.x >= 55 degrees)
      const rot = player.getRotation();
      if (rot.x < 55) continue;

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

      // Speed-based 1-2 tick impact prediction window
      const fallSpeed = Math.abs(vel.y);
      const predictionWindow = Math.max(2.0, fallSpeed * 1.8 + 0.4);

      // Trigger strictly within 1-2 ticks before ground impact
      if (distToSurface > predictionWindow) continue;

      // Resolve operating mode (full vs simple)
      const mode = getPlayerMode(player);

      // Acquire clutch item (from hands or auto-switched from inventory)
      const clutchData = acquireClutchItem(player, mode);
      if (!clutchData) continue;

      // Execute clutch!
      executeClutch(player, vel, clutchData, ground);
    } catch {}
  }
}, 1);

// Startup notification
world.afterEvents.worldInitialize.subscribe(() => {
  console.warn(`[Universal Clutch] Initialized successfully. Default Mode: ${DEFAULT_MODE} | Fall Threshold: ${DEFAULT_THRESHOLD} blocks.`);
});
