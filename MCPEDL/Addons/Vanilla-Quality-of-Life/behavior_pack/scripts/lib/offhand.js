// Offhand quick-swap (sneak + use in the air).
import { world, system, EquipmentSlot } from "@minecraft/server";
import { CONFIG, SUPPORTED_OFFHAND_ITEMS } from "./config.js";
import { getQolState } from "./state.js";
import { cloneStack, describeItem, getContainer, getEquipment, shortId } from "./utils.js";

export function isPlainSupportedStack(item) {
  if (!item || !SUPPORTED_OFFHAND_ITEMS.has(item.typeId)) return false;
  try {
    if (item.nameTag) return false;
    if (item.getLore().length > 0) return false;
  } catch (e) {
    return false;
  }
  return true;
}

export function offhandMatches(equipment, item) {
  const readBack = equipment.getEquipment(EquipmentSlot.Offhand);
  if (!item) return !readBack;
  if (!readBack || readBack.typeId !== item.typeId || readBack.amount !== item.amount) return false;
  if (SUPPORTED_OFFHAND_ITEMS.has(item.typeId)) {
    return (readBack.nameTag || "") === (item.nameTag || "");
  }
  return true;
}

export function forceOffhand(player, item) {
  if (item && !isPlainSupportedStack(item)) return;
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
  for (const cmd of commands) {
    try {
      player.runCommand(cmd);
    } catch (e) {}
  }
}

export function writeOffhand(player, equipment, item) {
  if (item) {
    try {
      const copy = cloneStack(item);
      equipment.setEquipment(EquipmentSlot.Offhand, copy);
      if (offhandMatches(equipment, item)) return true;
    } catch (e) {}
  } else {
    try {
      equipment.setEquipment(EquipmentSlot.Offhand, undefined);
      if (offhandMatches(equipment, undefined)) return true;
    } catch (e) {}
  }
  forceOffhand(player, item);
  return offhandMatches(equipment, item);
}

export function writeMainhand(player, equipment, item) {
  try {
    const accepted = equipment.setEquipment(EquipmentSlot.Mainhand, item ? cloneStack(item) : undefined);
    if (accepted !== false) return true;
  } catch (e) {}
  try {
    const container = getContainer(player);
    if (container) {
      container.setItem(player.selectedSlotIndex, item ? cloneStack(item) : undefined);
      return true;
    }
  } catch (e) {}
  return false;
}

export function swapHands(player) {
  const state = getQolState(player.id);
  if (system.currentTick - state.lastSwapTick < CONFIG.SWAP_COOLDOWN_TICKS) return false;

  const equipment = getEquipment(player);
  if (!equipment) return false;

  let main;
  let off;
  try {
    main = equipment.getEquipment(EquipmentSlot.Mainhand);
    off = equipment.getEquipment(EquipmentSlot.Offhand);
  } catch (e) {
    return false;
  }

  const mainAllowed = main && SUPPORTED_OFFHAND_ITEMS.has(main.typeId);
  const offAllowed = off && SUPPORTED_OFFHAND_ITEMS.has(off.typeId);

  if (!mainAllowed && !offAllowed) {
    return false;
  }

  const mainCopy = cloneStack(main);
  const offCopy = cloneStack(off);

  if (!writeOffhand(player, equipment, mainCopy)) {
    writeOffhand(player, equipment, offCopy);
    writeMainhand(player, equipment, mainCopy);
    return false;
  }

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
  } catch (e) {}

  return true;
}

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
