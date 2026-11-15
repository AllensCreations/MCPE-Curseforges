import { EntityComponentTypes, EquipmentSlot, GameMode, ItemComponentTypes } from "@minecraft/server";

export function isCreative(player) {
  return player.getGameMode() === GameMode.Creative;
}

function mainHandSlot(player) {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Mainhand);
}

export function heldItem(player) {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
}

export function clearHeldItem(player) {
  mainHandSlot(player)?.setItem(undefined);
}

export function inventoryOf(player) {
  return player.getComponent(EntityComponentTypes.Inventory)?.container;
}

export function findAmmo(player, typeIds) {
  const container = inventoryOf(player);
  if (!container) return undefined;
  for (const typeId of typeIds) {
    for (let slot = 0; slot < container.size; slot++) {
      if (container.getItem(slot)?.typeId === typeId) return { slot, typeId };
    }
  }
  return undefined;
}

export function takeOne(player, slot) {
  const container = inventoryOf(player);
  const item = container?.getItem(slot);
  if (!item) return;
  if (item.amount > 1) {
    item.amount -= 1;
    container.setItem(slot, item);
  } else {
    container.setItem(slot, undefined);
  }
}

export function wearHeldItem(player, amount) {
  if (isCreative(player)) return false;
  const slot = mainHandSlot(player);
  const item = slot?.getItem();
  const durability = item?.getComponent(ItemComponentTypes.Durability);
  if (!durability) return false;
  if (durability.damage + amount >= durability.maxDurability) {
    slot.setItem(undefined);
    player.playSound("random.break");
    return true;
  }
  durability.damage += amount;
  slot.setItem(item);
  return false;
}

export function muzzle(player, distance) {
  const head = player.getHeadLocation();
  const dir = player.getViewDirection();
  return { x: head.x + dir.x * distance, y: head.y + dir.y * distance - 0.1, z: head.z + dir.z * distance };
}

export function shoot(projectile, owner, direction, speed) {
  const component = projectile.getComponent("minecraft:projectile");
  component.owner = owner;
  component.shoot({ x: direction.x * speed, y: direction.y * speed, z: direction.z * speed });
}
