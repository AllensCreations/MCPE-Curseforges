import { world, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";

const WORN = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet, EquipmentSlot.Offhand];
const stash = new Map();

export const hasStash = (p) => stash.has(p.id);

export function saveGear(p) {
  if (stash.has(p.id)) return;
  const box = p.getComponent(EntityComponentTypes.Inventory)?.container;
  const gear = p.getComponent(EntityComponentTypes.Equippable);
  if (!box || !gear) return;
  const items = [];
  for (let i = 0; i < box.size; i++) {
    const item = box.getItem(i);
    if (!item) continue;
    items.push([i, item]);
    box.setItem(i, undefined);
  }
  const worn = [];
  for (const which of WORN) {
    const slot = gear.getEquipmentSlot(which);
    const item = slot.getItem();
    if (!item) continue;
    worn.push([which, item]);
    slot.setItem(undefined);
  }
  stash.set(p.id, { items, worn });
}

export function restoreGear(p) {
  const saved = stash.get(p.id);
  if (!saved) return;
  stash.delete(p.id);
  const box = p.getComponent(EntityComponentTypes.Inventory)?.container;
  const gear = p.getComponent(EntityComponentTypes.Equippable);
  if (!box || !gear) return;
  for (const [i, item] of saved.items) {
    const left = box.getItem(i) ? box.addItem(item) : (box.setItem(i, item), undefined);
    if (left) p.dimension.spawnItem(left, p.location);
  }
  for (const [which, item] of saved.worn) {
    const slot = gear.getEquipmentSlot(which);
    if (!slot.getItem()) slot.setItem(item);
    else {
      const left = box.addItem(item);
      if (left) p.dimension.spawnItem(left, p.location);
    }
  }
}

export function initGear() {
  world.afterEvents.playerSpawn.subscribe(({ player }) => restoreGear(player));
}
