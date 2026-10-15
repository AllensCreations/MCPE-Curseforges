/**
 * Universal Clutch by AllensCreations
 * 
 * Vanilla-faithful Bedrock Script API (@minecraft/server v1.13.0+) Add-on.
 * Automatically performs clutch placements when falling from dangerous heights,
 * featuring realistic 1-2 tick impact prediction, authentic arm swing animations,
 * placement sounds, native waterlogged block handling, automatic water scooping,
 * and Full / Simple subpack mode support.
 * 
 * Modes:
 * - Full Mode: Automatically scans hotbar & inventory for clutch items, auto-switches/equips them, and restores previous items after landing.
 * - Simple Mode: Only triggers if a clutch item is actively held in the mainhand or offhand.
 * 
 * Compatible with Minecraft Bedrock 1.21+ / v1.26+ standards.
 */

import {
  world,
  system,
  BlockPermutation,
  ItemStack
} from "@minecraft/server";

import {
  AUTO_SWITCH_INVENTORY,
  FALL_DISTANCE_THRESHOLD,
  SUBPACK_NAME
} from "./config.js";

// =============================================================================
// Constants & Supported Clutch Items Definition
// =============================================================================

/**
 * Registry of supported clutch items with placement properties and sound cues.
 */
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
 * Selection priority order when searching inventory in Full Mode.
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
 * Replaceable or passable foliage/air blocks that a falling player traverses.
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

// Map tracking recent clutch trigger ticks to debounce and avoid duplicate triggers per fall
// Key: player.id -> number (system tick)
const lastClutchTick = new Map();

// =============================================================================
// Helper Functions: Mode, Tags, Inventory, and Vector Raycasting
// =============================================================================

/**
 * Resolves whether the player operates in "full" or "simple" mode.
 * Supports player tag overrides ("clutch_mode:full", "clutch_mode:simple") or falls back to active subpack config.
 * @param {import("@minecraft/server").Player} player
 * @returns {"full" | "simple"}
 */
function getPlayerMode(player) {
  try {
    const tags = player.getTags();
    if (tags.includes("clutch_mode:full")) return "full";
    if (tags.includes("clutch_mode:simple")) return "simple";
  } catch {}
  return AUTO_SWITCH_INVENTORY ? "full" : "simple";
}

/**
 * Retrieves the effective fall distance threshold for a player.
 * Supports dynamic player tag overrides (e.g. "clutch_threshold:15") or falls back to active subpack config.
 * @param {import("@minecraft/server").Player} player
 * @returns {number} Threshold in blocks
 */
function getEffectiveThreshold(player) {
  try {
    const tags = player.getTags();
    for (const tag of tags) {
      if (tag.startsWith("clutch_threshold:")) {
        const val = parseInt(tag.split(":")[1], 10);
        if (!isNaN(val) && val > 0) {
          return val;
        }
      }
    }
  } catch {}
  return FALL_DISTANCE_THRESHOLD;
}

/**
 * Checks whether an item stack qualifies as a supported clutch item.
 * @param {import("@minecraft/server").ItemStack | undefined} itemStack
 * @returns {object | null} Clutch definition if supported, otherwise null.
 */
function resolveClutchItem(itemStack) {
  if (!itemStack || !itemStack.typeId) return null;
  const typeId = itemStack.typeId;

  // Exact registry lookup
  if (CLUTCH_REGISTRY[typeId]) {
    return { ...CLUTCH_REGISTRY[typeId], typeId };
  }

  // Multi-item Boat / Raft check (e.g. oak_boat, spruce_boat, bamboo_raft, chest_boat)
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

/**
 * Checks if an item stack matches a priority key.
 */
function itemMatchesPriority(itemStack, priorityKey) {
  if (!itemStack || !itemStack.typeId) return false;
  if (priorityKey === "boat") {
    return itemStack.typeId.endsWith("_boat") || itemStack.typeId.endsWith("_raft");
  }
  return itemStack.typeId === priorityKey;
}

/**
 * Searches the player's inventory container for the best available clutch item.
 * Checks hotbar (0-8) first, then upper inventory (9-35).
 * @param {import("@minecraft/server").Container} container
 * @returns {{ slot: number, item: import("@minecraft/server").ItemStack, inHotbar: boolean } | null}
 */
function findBestClutchItemInInventory(container) {
  if (!container) return null;

  for (const pKey of CLUTCH_PRIORITY) {
    // 1. Search hotbar (0 to 8) first
    for (let slot = 0; slot < 9 && slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && itemMatchesPriority(item, pKey)) {
        return { slot, item, inHotbar: true };
      }
    }
    // 2. Search upper inventory (9 to 35)
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
 * Resolves the clutch item to use for the player.
 * - Simple Mode: Only checks mainhand and offhand.
 * - Full Mode: Checks mainhand/offhand first; if none, automatically switches hotbar or swaps from inventory.
 * @param {import("@minecraft/server").Player} player
 * @param {"full" | "simple"} mode
 * @returns {{ itemStack: import("@minecraft/server").ItemStack, slot: string, definition: object, autoSwitched: object | null } | null}
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

  // 3. Simple mode stops here (held items only)
  if (mode === "simple") {
    return null;
  }

  // 4. Full Mode: Auto-switch from inventory
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
        previousSlot: originalHotbarSlot,
        newSlot: match.slot
      }
    };
  } else {
    // Swap item from upper inventory into the player's active hotbar slot
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
 * Restores the previous hotbar slot or swaps back inventory items after auto-switching.
 * @param {import("@minecraft/server").Player} player
 * @param {object} autoSwitched
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
 * Checks if a block is air or passable foliage that can be safely occupied/replaced.
 * @param {import("@minecraft/server").Block | null} block
 * @returns {boolean}
 */
function isPassableOrAir(block) {
  if (!block) return false;
  if (block.isAir) return true;
  return PASSABLE_OR_AIR_BLOCKS.has(block.typeId);
}

/**
 * Scans downward along the player's vertical column to find the impact surface block.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} location
 * @returns {{ surfaceBlock: import("@minecraft/server").Block, airBlockAbove: import("@minecraft/server").Block, surfaceY: number } | null}
 */
function findGroundBelow(dimension, location) {
  const px = Math.floor(location.x);
  const pz = Math.floor(location.z);
  const startY = Math.floor(location.y);
  const minY = Math.max(dimension.minHeight ?? -64, startY - 12);

  for (let y = startY; y >= minY; y--) {
    const block = dimension.getBlock({ x: px, y: y, z: pz });
    if (!block) break;

    if (!isPassableOrAir(block)) {
      const airAbove = dimension.getBlock({ x: px, y: y + 1, z: pz });
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
 * Determines if a surface block natively supports waterlogging.
 * @param {import("@minecraft/server").Block} block
 * @returns {boolean} True if waterloggable and not already waterlogged
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
 * Safely consumes or replaces 1 item from the specified equipment slot in survival/adventure mode.
 * @param {import("@minecraft/server").Player} player
 * @param {string} slot Equipment slot ("Mainhand" or "Offhand")
 * @param {string} [replacementTypeId] Optional replacement item ID (e.g. "minecraft:bucket")
 */
function consumeHeldItem(player, slot, replacementTypeId) {
  try {
    const gameMode = player.getGameMode?.();
    if (gameMode === "creative") return;

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
 * @param {import("@minecraft/server").Player} player
 * @param {string} preferredSlot Equipment slot where bucket was originally used
 */
function restoreWaterBucket(player, preferredSlot) {
  try {
    const gameMode = player.getGameMode?.();
    if (gameMode === "creative") return;

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

/**
 * Performs ladder clutch placement against an adjacent vertical wall at ground level.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Block} airBlock
 * @param {import("@minecraft/server").Player} player
 * @returns {boolean} True if successfully placed
 */
function placeLadderClutch(dimension, airBlock, player) {
  const { x, y, z } = airBlock.location;

  const wallChecks = [
    { dir: 2, pos: { x, y, z: z - 1 } },
    { dir: 3, pos: { x, y, z: z + 1 } },
    { dir: 4, pos: { x: x - 1, y, z } },
    { dir: 5, pos: { x: x + 1, y, z } }
  ];

  for (const check of wallChecks) {
    const wall = dimension.getBlock(check.pos);
    if (wall && !wall.isAir && !wall.isLiquid && !PASSABLE_OR_AIR_BLOCKS.has(wall.typeId)) {
      try {
        const perm = BlockPermutation.resolve("minecraft:ladder", {
          facing_direction: check.dir
        });
        airBlock.setPermutation(perm);
        return true;
      } catch {}
    }
  }

  return false;
}

/**
 * Performs boat clutch placement by summoning a boat entity at the impact position.
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Block} airBlock
 * @param {string} entityType
 * @returns {boolean}
 */
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

/**
 * Executes the auto-scoop mechanic 3-4 ticks after player touchdown.
 * Restores waterlogged state or removes placed water block, plays sound, returns bucket,
 * and restores previous item slot if auto-switched.
 * @param {object} clutch Clutch record
 */
function executeAutoScoop(clutch) {
  try {
    const { player, targetPos, dimension, wasWaterlogged, heldSlot, autoSwitched } = clutch;

    if (!player || !player.isValid()) return;

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

    // Play authentic scoop sound cue
    try {
      dimension.playSound("bucket.fill_water", player.location, { volume: 1.0, pitch: 1.0 });
    } catch {}

    // Play arm animation
    try {
      player.playAnimation("animation.player.attack_bare_hand");
    } catch {}

    // Restore water bucket to player inventory
    restoreWaterBucket(player, heldSlot);

    // If auto-switched in Full Mode, restore previously held item / hotbar slot
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

/**
 * Main clutch handler invoked when all activation, pitch, and speed criteria are satisfied.
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").Vector3} velocity
 * @param {object} clutchData Held/acquired clutch item data
 * @param {object} ground Surface and impact block info
 */
function executeClutch(player, velocity, clutchData, ground) {
  const { slot, definition, autoSwitched } = clutchData;
  const { surfaceBlock, airBlockAbove } = ground;
  const dimension = player.dimension;

  // 1. Natural hand animation 1-2 ticks prior to impact
  try {
    player.playAnimation("animation.player.attack_bare_hand");
  } catch {}

  // 2. Play item placement sound cue
  try {
    dimension.playSound(definition.placeSound, player.location, { volume: 1.0, pitch: 1.0 });
  } catch {}

  let placementSuccess = false;

  // 3. Category-specific placement mechanics
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

        // Register active water clutch for auto-scoop upon touchdown
        activeWaterClutches.set(player.id, {
          player,
          targetPos,
          dimension,
          wasWaterlogged,
          placedTick: system.currentTick,
          landed: false,
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

  // Process active water clutches awaiting player touchdown
  for (const [playerId, clutch] of activeWaterClutches.entries()) {
    const player = clutch.player;
    if (!player || !player.isValid()) {
      activeWaterClutches.delete(playerId);
      continue;
    }

    if (!clutch.landed) {
      const isLanded =
        player.isOnGround === true ||
        (player.fallDistance ?? 0) === 0 ||
        Math.abs(player.getVelocity().y) < 0.08 ||
        player.isFalling === false;

      if (isLanded) {
        clutch.landed = true;
        system.runTimeout(() => {
          executeAutoScoop(clutch);
        }, 3);
      }
    }
  }

  // Scan all active players for freefall clutch conditions
  for (const player of world.getAllPlayers()) {
    try {
      // 1. Basic Player State Validations
      if (!player.isValid()) continue;
      if (player.isGliding || player.isInWater || player.isSwimming) continue;

      // 2. Debounce Check: Prevent re-triggering in rapid succession
      const lastTick = lastClutchTick.get(player.id) ?? 0;
      if (currentTick - lastTick < 25) continue;

      // 3. Pitch Check: Player must be looking down towards ground (pitch >= 65 degrees)
      const rotation = player.getRotation();
      if (rotation.x < 65) continue;

      // 4. Fall State & Velocity Check: Freefall state or downward velocity <= -0.6
      const velocity = player.getVelocity();
      const isFreefalling = player.isFalling === true || velocity.y <= -0.6;
      if (!isFreefalling) continue;

      // 5. Dynamic Height Threshold Check
      const fallDistance = player.fallDistance ?? 0;
      const threshold = getEffectiveThreshold(player);
      if (fallDistance < threshold) continue;

      // 6. Subpack Mode Resolution (Full Mode vs Simple Mode)
      const mode = getPlayerMode(player);

      // 7. Clutch Item Resolution (Held or Auto-Switched)
      const clutchData = acquireClutchItem(player, mode);
      if (!clutchData) continue;

      // 8. Ground Raycasting & 1-2 Tick Impact Prediction
      const ground = findGroundBelow(player.dimension, player.location);
      if (!ground) continue;

      const distanceToSurface = player.location.y - (ground.surfaceY + 1);
      if (distanceToSurface < 0.05) continue;

      const fallSpeed = Math.abs(velocity.y);
      const predictionWindow = Math.max(1.8, fallSpeed * 1.8 + 0.3);

      if (distanceToSurface <= predictionWindow) {
        executeClutch(player, velocity, clutchData, ground);
      }
    } catch {
      // Per-player loop resilience
    }
  }
}, 1);

// Log pack activation
world.afterEvents.worldInitialize.subscribe(() => {
  console.warn(
    `[Universal Clutch] Initialized. Subpack: "${SUBPACK_NAME}" | Threshold: ${FALL_DISTANCE_THRESHOLD} blocks | Auto-Switch: ${AUTO_SWITCH_INVENTORY}`
  );
});
