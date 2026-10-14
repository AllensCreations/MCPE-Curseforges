/**
 * Vanilla Quality of Life — Offhand & Dynamic Handheld Lighting
 * Created for AllensCreations — MCPE Curseforges
 *
 * Features:
 * - Double-sneak quick swap for offhand utility items (Torches, Lanterns, Clocks, Compasses)
 * - Sneak + Use/Tap quick swap in air
 * - Command-backed offhand slot writing for guaranteed Bedrock engine parity
 * - Real-time handheld & offhand dynamic lighting using minecraft:light_block
 * - Safe block cleanup on player movement, dimension change, or logout
 */
import { world, system, EquipmentSlot, ItemStack, BlockPermutation } from "@minecraft/server";

const LOG = "[Vanilla QoL]";
const SWAP_WINDOW_TICKS = 14;
const SWAP_COOLDOWN_TICKS = 8;
const LIGHT_UPDATE_TICKS = 4;

// Strictly supported Vanilla QoL offhand items
const SUPPORTED_OFFHAND_ITEMS = new Set([
  "minecraft:torch",
  "minecraft:soul_torch",
  "minecraft:lantern",
  "minecraft:soul_lantern",
  "minecraft:clock",
  "minecraft:compass",
  "minecraft:recovery_compass"
]);

// Dynamic lighting levels for handheld and offhand light sources
const LIGHT_LEVELS = {
  "minecraft:torch": 14,
  "minecraft:soul_torch": 10,
  "minecraft:lantern": 15,
  "minecraft:soul_lantern": 10
};

/** @type {Map<string, any>} */
const playerState = new Map();

function log(message) {
  console.warn(`${LOG} ${message}`);
}

function getState(id) {
  let state = playerState.get(id);
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
      lightLevel: 0
    };
    playerState.set(id, state);
  }
  return state;
}

function describeItem(item) {
  if (!item) return "Empty";
  const name = item.nameTag ? `"${item.nameTag}"` : shortId(item.typeId);
  return item.amount > 1 ? `${name} x${item.amount}` : name;
}

function getEquipment(player) {
  try {
    return player.getComponent("minecraft:equippable") || player.getComponent("equippable");
  } catch (error) {
    return undefined;
  }
}

function getContainer(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    return inventory ? inventory.container : undefined;
  } catch (error) {
    return undefined;
  }
}

function cloneStack(item) {
  if (!item) return undefined;
  try {
    if (typeof item.clone === "function") return item.clone();
  } catch (error) {}
  try {
    const copy = new ItemStack(item.typeId, item.amount);
    if (item.nameTag) copy.nameTag = item.nameTag;
    return copy;
  } catch (error) {
    return undefined;
  }
}

function shortId(typeId) {
  return typeId && typeId.startsWith("minecraft:") ? typeId.slice("minecraft:".length) : typeId;
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
  for (const command of commands) {
    try {
      player.runCommand(command);
    } catch (error) {}
  }
}

function writeOffhand(player, equipment, item) {
  if (item) {
    try {
      const copy = cloneStack(item);
      equipment.setEquipment(EquipmentSlot.Offhand, copy);
      if (offhandMatches(equipment, item)) return true;
    } catch (error) {}
  } else {
    try {
      equipment.setEquipment(EquipmentSlot.Offhand, undefined);
      if (offhandMatches(equipment, undefined)) return true;
    } catch (error) {}
  }
  forceOffhand(player, item);
  return offhandMatches(equipment, item);
}

function writeMainhand(player, equipment, item) {
  try {
    const accepted = equipment.setEquipment(EquipmentSlot.Mainhand, item ? cloneStack(item) : undefined);
    if (accepted !== false) return true;
  } catch (error) {}
  try {
    const container = getContainer(player);
    if (container) {
      container.setItem(player.selectedSlotIndex, item ? cloneStack(item) : undefined);
      return true;
    }
  } catch (error) {}
  return false;
}

function swapHands(player) {
  const state = getState(player.id);
  if (system.currentTick - state.lastSwapTick < SWAP_COOLDOWN_TICKS) return false;

  const equipment = getEquipment(player);
  if (!equipment) return false;

  let main;
  let off;
  try {
    main = equipment.getEquipment(EquipmentSlot.Mainhand);
    off = equipment.getEquipment(EquipmentSlot.Offhand);
  } catch (error) {
    return false;
  }

  // Only allow swapping if at least one hand holds a supported Vanilla QoL item
  const mainAllowed = main && SUPPORTED_OFFHAND_ITEMS.has(main.typeId);
  const offAllowed = off && SUPPORTED_OFFHAND_ITEMS.has(off.typeId);

  if (!mainAllowed && !offAllowed) {
    return false;
  }

  const mainCopy = cloneStack(main);
  const offCopy = cloneStack(off);

  // Write main item to offhand
  if (!writeOffhand(player, equipment, mainCopy)) {
    writeOffhand(player, equipment, offCopy);
    writeMainhand(player, equipment, mainCopy);
    return false;
  }

  // Write off item to mainhand
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
  } catch (error) {}

  return true;
}

// -------------------------------------------------------------
// DYNAMIC HANDHELD LIGHTING
// -------------------------------------------------------------

function isLightBlock(typeId) {
  return typeId === "minecraft:light_block" || (typeId && typeId.startsWith("minecraft:light_block"));
}

function canHoldLight(block) {
  if (!block) return false;
  try {
    if (block.isAir) return true;
    return isLightBlock(block.typeId);
  } catch (error) {
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
  } catch (error) {}
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
  } catch (error) {
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
  if (!placed) {
    return;
  }

  // Cleanup old light block if player moved
  if (
    state.lightDim &&
    (state.lightDim !== dim || state.lightX !== x || state.lightY !== y || state.lightZ !== z)
  ) {
    try {
      const old = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
      if (old && isLightBlock(old.typeId)) {
        old.setPermutation(BlockPermutation.resolve("minecraft:air"));
      }
    } catch (error) {}
  }

  state.lightDim = dim;
  state.lightX = x;
  state.lightY = y;
  state.lightZ = z;
  state.lightLevel = level;
}

// -------------------------------------------------------------
// EVENT SUBSCRIPTIONS
// -------------------------------------------------------------

// Sneak + Use/Tap in air quick-swap trigger
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

// Double-sneak detection and dynamic lighting loop
system.runInterval(() => {
  let players;
  try {
    players = world.getAllPlayers();
  } catch (error) {
    return;
  }

  const tick = system.currentTick;
  const doLight = tick % LIGHT_UPDATE_TICKS === 0;

  for (const player of players) {
    try {
      const state = getState(player.id);
      const sneaking = !!player.isSneaking;

      // Detect sneak press
      if (sneaking && !state.sneakHeld) {
        state.sneakCount += 1;
        state.sneakTimer = 0;
      }
      state.sneakHeld = sneaking;

      // Timer window for double-sneak
      if (state.sneakCount > 0) {
        state.sneakTimer += 1;
        if (state.sneakTimer > SWAP_WINDOW_TICKS) {
          state.sneakCount = 0;
          state.sneakTimer = 0;
        }
      }

      // Trigger swap on double-sneak
      if (state.sneakCount >= 2) {
        state.sneakCount = 0;
        state.sneakTimer = 0;
        swapHands(player);
      }

      // Handheld lighting update
      if (doLight) {
        updatePlayerLight(player, state);
      }
    } catch (error) {}
  }
}, 1);

// Cleanup on player leave
world.afterEvents.playerLeave.subscribe((event) => {
  const id = event.playerId;
  if (!id) return;
  const state = playerState.get(id);
  if (state) clearPlacedLight(state);
  playerState.delete(id);
});

// Cleanup on dimension change
if (world.afterEvents.playerDimensionChange) {
  world.afterEvents.playerDimensionChange.subscribe((event) => {
    try {
      const state = getState(event.player.id);
      clearPlacedLight(state);
    } catch (error) {}
  });
}

// Custom script event trigger (/scriptevent qol:swap)
system.afterEvents.scriptEventReceive.subscribe((event) => {
  try {
    if (event.id === "qol:swap") {
      const player = event.sourceEntity;
      if (player && player.typeId === "minecraft:player") {
        swapHands(player);
      }
    }
  } catch (error) {}
});

log("Vanilla QoL Offhand & Dynamic Light system initialized.");
