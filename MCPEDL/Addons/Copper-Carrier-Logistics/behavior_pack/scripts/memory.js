import { ItemStack } from "@minecraft/server";

export const MAX_SLOTS = 54;
export const SCAN_RADIUS = 64;

const BUFFER_PROP = "cc:buffer";
const DATA_BEARING = [
  /^minecraft:(potion|splash_potion|lingering_potion|tipped_arrow|filled_map|written_book|enchanted_book|firework_rocket|firework_star|goat_horn|suspicious_stew|ominous_bottle|bundle)$/,
  /banner$/,
  /shulker_box$/,
];

const buffers = new Map();
const stackSizes = new Map();

function readJson(entity, prop, fallback) {
  try {
    const raw = entity.getDynamicProperty(prop);
    return typeof raw === "string" ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(entity, prop, value) {
  try {
    entity.setDynamicProperty(prop, JSON.stringify(value));
  } catch {
    return;
  }
}

export function isPlain(stack) {
  try {
    if (DATA_BEARING.some((pattern) => pattern.test(stack.typeId))) return false;
    if (stack.nameTag || stack.getLore().length > 0) return false;
    if (stack.getComponent("minecraft:inventory")) return false;
    const enchantable = stack.getComponent("minecraft:enchantable");
    if (enchantable && enchantable.getEnchantments().length > 0) return false;
    const durability = stack.getComponent("minecraft:durability");
    if (durability && durability.damage > 0) return false;
    return stack.getDynamicPropertyIds().length === 0;
  } catch {
    return false;
  }
}

export function maxStack(typeId) {
  if (!stackSizes.has(typeId)) {
    let size = 64;
    try {
      size = new ItemStack(typeId, 1).maxAmount;
    } catch {
      size = 64;
    }
    stackSizes.set(typeId, size);
  }
  return stackSizes.get(typeId);
}

function validSlot(slot) {
  return Array.isArray(slot) && typeof slot[0] === "string" && Number.isInteger(slot[1]) && slot[1] > 0;
}

export function getSlots(entity) {
  let slots = buffers.get(entity.id);
  if (!slots) {
    const stored = readJson(entity, BUFFER_PROP, []);
    slots = Array.isArray(stored) ? stored.filter(validSlot) : [];
    buffers.set(entity.id, slots);
  }
  return slots;
}

export function saveSlots(entity) {
  writeJson(entity, BUFFER_PROP, getSlots(entity));
}

export function pruneSlots(entity) {
  const slots = getSlots(entity);
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i][1] <= 0) slots.splice(i, 1);
  }
  saveSlots(entity);
}

export function slotCount(entity) {
  return getSlots(entity).length;
}

export function canAccept(entity, typeId) {
  const slots = getSlots(entity);
  if (slots.length < MAX_SLOTS) return true;
  const max = maxStack(typeId);
  return slots.some((slot) => slot[0] === typeId && slot[1] < max);
}

export function bufferAdd(entity, typeId, amount) {
  const slots = getSlots(entity);
  const max = maxStack(typeId);
  let left = amount;
  for (const slot of slots) {
    if (left <= 0) break;
    if (slot[0] === typeId && slot[1] < max) {
      const moved = Math.min(max - slot[1], left);
      slot[1] += moved;
      left -= moved;
    }
  }
  while (left > 0 && slots.length < MAX_SLOTS) {
    const moved = Math.min(max, left);
    slots.push([typeId, moved]);
    left -= moved;
  }
  saveSlots(entity);
  return amount - left;
}

export function clearBuffer(entityId, entity) {
  buffers.delete(entityId);
  try {
    if (entity && entity.isValid) entity.setDynamicProperty(BUFFER_PROP, undefined);
  } catch {
    return;
  }
}

export function dropBuffer(entityId, entity, dimension, location) {
  let slots = buffers.get(entityId);
  if (!slots && entity && entity.isValid) slots = getSlots(entity);
  if (!slots || !dimension || !location) return 0;
  let dropped = 0;
  for (const slot of slots) {
    try {
      dimension.spawnItem(new ItemStack(slot[0], slot[1]), location);
      dropped += slot[1];
    } catch {
      continue;
    }
  }
  slots.length = 0;
  return dropped;
}
