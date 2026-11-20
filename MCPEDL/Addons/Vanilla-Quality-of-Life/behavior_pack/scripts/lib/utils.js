// Small helpers for items, containers and targets.
import { world, EquipmentSlot, ItemStack } from "@minecraft/server";
import { CONFIG } from "./config.js";

export function isGameMode(player, mode) {
  try {
    return world.getPlayers({ gameMode: mode, name: player.name }).length > 0;
  } catch (e) {}
  try {
    return !!player.matches({ gameMode: mode });
  } catch (e) {}
  return false;
}

export function shortId(typeId) {
  return typeId && typeId.startsWith("minecraft:") ? typeId.slice("minecraft:".length) : typeId;
}

export function describeItem(item) {
  if (!item) return "Empty";
  const name = item.nameTag ? `"${item.nameTag}"` : shortId(item.typeId);
  return item.amount > 1 ? `${name} x${item.amount}` : name;
}

export function getEquipment(player) {
  try {
    return player.getComponent("minecraft:equippable") || player.getComponent("equippable");
  } catch (e) {
    return undefined;
  }
}

export function getContainer(player) {
  try {
    const inv = player.getComponent("minecraft:inventory") || player.getComponent("inventory");
    return inv ? inv.container : undefined;
  } catch (e) {
    return undefined;
  }
}

export function cloneStack(item) {
  if (!item) return undefined;
  try {
    if (typeof item.clone === "function") return item.clone();
  } catch (e) {}
  try {
    const copy = new ItemStack(item.typeId, item.amount);
    if (item.nameTag) copy.nameTag = item.nameTag;
    return copy;
  } catch (e) {
    return undefined;
  }
}

export function normalizeId(id) {
  return (id ?? "").replace(/^minecraft:/, "").toLowerCase();
}

export function blockKey(block) {
  if (!block) return "";
  const { x, y, z } = block.location;
  return `${block.typeId}@${x},${y},${z}`;
}

export function getTargetBlock(player) {
  try {
    return player.getBlockFromViewDirection({
      maxDistance: CONFIG.RAYCAST_DISTANCE,
      includeLiquidBlocks: false,
      includePassableBlocks: true,
    })?.block;
  } catch {
    return undefined;
  }
}

export function getMainhandTool(player) {
  try {
    const eq = getEquipment(player);
    return eq ? eq.getEquipment(EquipmentSlot.Mainhand) : undefined;
  } catch (e) {
    return undefined;
  }
}
