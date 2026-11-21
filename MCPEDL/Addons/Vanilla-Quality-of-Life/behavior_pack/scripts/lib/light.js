import { world, EquipmentSlot, BlockPermutation } from "@minecraft/server";
import { LIGHT_LEVELS } from "./config.js";
import { getQolState, qolPlayerState } from "./state.js";
import { getEquipment } from "./utils.js";

export function isLightBlock(typeId) {
  return typeId === "minecraft:light_block" || (typeId && typeId.startsWith("minecraft:light_block"));
}

export function canHoldLight(block) {
  if (!block) return false;
  try {
    if (block.isAir) return true;
    return isLightBlock(block.typeId);
  } catch (e) {
    return false;
  }
}

let lightsCleaned = false;

export function persistLights() {
  if (!lightsCleaned) return;
  try {
    const list = [];
    for (const st of qolPlayerState.values()) {
      if (st.lightDim !== undefined && st.lightX !== undefined) {
        list.push([st.lightDim.id, st.lightX, st.lightY, st.lightZ]);
      }
    }
    world.setDynamicProperty("qol:lights", JSON.stringify(list));
  } catch (e) {}
}

export function clearPlacedLight(state) {
  if (!state || state.lightDim === undefined || state.lightX === undefined) return;
  try {
    const block = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
    if (block && isLightBlock(block.typeId)) {
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
    }
  } catch (e) {}
  state.lightDim = undefined;
  state.lightX = undefined;
  state.lightY = undefined;
  state.lightZ = undefined;
  state.lightLevel = 0;
  persistLights();
}

export function placeLightBlock(dim, x, y, z, level) {
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

export function getHeldLightLevel(main, off) {
  const offLevel = off ? LIGHT_LEVELS[off.typeId] || 0 : 0;
  const mainLevel = main ? LIGHT_LEVELS[main.typeId] || 0 : 0;
  return Math.max(offLevel, mainLevel);
}

export function updatePlayerLight(player, state) {
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
  } catch (e) {
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
  if (!placed) return;

  if (
    state.lightDim &&
    (state.lightDim !== dim || state.lightX !== x || state.lightY !== y || state.lightZ !== z)
  ) {
    try {
      const old = state.lightDim.getBlock({ x: state.lightX, y: state.lightY, z: state.lightZ });
      if (old && isLightBlock(old.typeId)) {
        old.setPermutation(BlockPermutation.resolve("minecraft:air"));
      }
    } catch (e) {}
  }

  state.lightDim = dim;
  state.lightX = x;
  state.lightY = y;
  state.lightZ = z;
  state.lightLevel = level;
  persistLights();
}

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  try {
    const player = event.player;
    const state = qolPlayerState.get(player.id);
    if (!state || state.lightX === undefined) return;
    const placed = event.block;
    if (placed.x !== state.lightX || placed.y !== state.lightY || placed.z !== state.lightZ) return;
    state.lightX = undefined;
    state.lightY = undefined;
    state.lightZ = undefined;
    state.lightLevel = 0;
    updatePlayerLight(player, state);
  } catch (e) {}
});

if (world.afterEvents.playerDimensionChange) {
  world.afterEvents.playerDimensionChange.subscribe((event) => {
    try {
      const state = getQolState(event.player.id);
      clearPlacedLight(state);
    } catch (e) {}
  });
}

export function markLightsCleaned() {
  lightsCleaned = true;
}
