import { world, system, EquipmentSlot } from "@minecraft/server";

// Allowed utility items for offhand quick-swap
const OFFHAND_ALLOWED_ITEMS = new Set([
  "minecraft:torch",
  "minecraft:soul_torch",
  "minecraft:lantern",
  "minecraft:soul_lantern",
  "minecraft:clock",
  "minecraft:compass",
  "minecraft:recovery_compass"
]);

/**
 * Sneak + Right-Click / Tap Quick-Swap Mechanic
 * Allows players to swap torches, lanterns, clocks, and compasses
 * directly between their main hand and offhand slot.
 */
world.beforeEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const itemStack = event.itemStack;

  // Only trigger when sneaking with an eligible offhand item
  if (!player || !player.isSneaking) return;
  if (!itemStack || !OFFHAND_ALLOWED_ITEMS.has(itemStack.typeId)) return;

  // Prevent default air use
  event.cancel = true;

  // Execute swap on next tick
  system.run(() => {
    try {
      const equippable = player.getComponent("minecraft:equippable");
      if (!equippable) return;

      const mainhandItem = equippable.getEquipment(EquipmentSlot.Mainhand);
      const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);

      // Perform swap
      equippable.setEquipment(EquipmentSlot.Mainhand, offhandItem);
      equippable.setEquipment(EquipmentSlot.Offhand, mainhandItem);

      // Tactile audio feedback
      player.playSound("armor.equip_generic", { pitch: 1.1, volume: 0.8 });
    } catch (e) {
      // Graceful error handling
    }
  });
});
