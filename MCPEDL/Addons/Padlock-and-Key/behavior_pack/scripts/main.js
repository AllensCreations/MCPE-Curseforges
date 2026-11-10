import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";

const PADLOCK_ID = "pnk:padlock";
const KEY_ID = "pnk:key";
const NUGGET_ID = "minecraft:iron_nugget";
const PROPERTY_PREFIX = "lock:";
const REVEAL_PASSWORD_ON_DENY = false;

const EXACT_NAMES = new Set([
  "chest",
  "trapped_chest",
  "barrel",
  "furnace",
  "lit_furnace",
  "blast_furnace",
  "lit_blast_furnace",
  "smoker",
  "lit_smoker",
  "hopper",
  "brewing_stand",
  "dispenser",
  "dropper",
  "chiseled_bookshelf",
]);
const NAME_SUFFIXES = ["_door", "trapdoor", "fence_gate", "shulker_box"];
const CHEST_IDS = new Set(["minecraft:chest", "minecraft:trapped_chest"]);
const DIMENSION_CODES = {
  "minecraft:overworld": "o",
  "minecraft:nether": "n",
  "minecraft:the_end": "e",
};
const SIDES = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

const recentKeyBlockUse = new Map();

function isLockable(block) {
  const id = block.typeId;
  if (!id.startsWith("minecraft:")) return false;
  const name = id.slice(10);
  return EXACT_NAMES.has(name) || NAME_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

function isUpperDoorHalf(block) {
  return block.typeId.endsWith("_door") && block.permutation.getState("upper_block_bit") === true;
}

function lockPosition(block) {
  const { x, y, z } = block.location;
  return { x, y: isUpperDoorHalf(block) ? y - 1 : y, z };
}

function propertyKey(dimension, x, y, z) {
  const code = DIMENSION_CODES[dimension.id] ?? dimension.id;
  return `${PROPERTY_PREFIX}${code}:${x},${y},${z}`;
}

function findLock(block) {
  const origin = lockPosition(block);
  const ownKey = propertyKey(block.dimension, origin.x, origin.y, origin.z);
  const own = world.getDynamicProperty(ownKey);
  if (typeof own === "string") return { key: ownKey, password: own };
  if (!CHEST_IDS.has(block.typeId)) return null;
  for (const side of SIDES) {
    const x = origin.x + side.x;
    const z = origin.z + side.z;
    const neighbor = block.dimension.getBlock({ x, y: origin.y, z });
    if (!neighbor || neighbor.typeId !== block.typeId) continue;
    const neighborKey = propertyKey(block.dimension, x, origin.y, z);
    const value = world.getDynamicProperty(neighborKey);
    if (typeof value === "string") return { key: neighborKey, password: value };
  }
  return null;
}

function getContainer(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

function hasCorrectKey(player, password) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return false;
  for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand]) {
    const item = equippable.getEquipment(slot);
    if (item && item.typeId === KEY_ID && item.nameTag === password) return true;
  }
  return false;
}

function consumeOne(slot) {
  if (slot.amount > 1) slot.amount -= 1;
  else slot.setItem(undefined);
}

function giveKey(player, password) {
  const key = new ItemStack(KEY_ID, 1);
  key.nameTag = password;
  const leftover = getContainer(player)?.addItem(key);
  if (leftover) player.dimension.spawnItem(leftover, player.location);
}

function effectLocation(block, lift) {
  const { x, y, z } = block.location;
  return { x: x + 0.5, y: y + lift, z: z + 0.5 };
}

function lockBlock(player, block, password) {
  const slot = getContainer(player)?.getSlot(player.selectedSlotIndex);
  if (!slot || !slot.hasItem() || slot.typeId !== PADLOCK_ID || slot.nameTag !== password) return;
  if (!isLockable(block) || findLock(block)) return;
  const origin = lockPosition(block);
  world.setDynamicProperty(propertyKey(block.dimension, origin.x, origin.y, origin.z), password);
  consumeOne(slot);
  giveKey(player, password);
  player.sendMessage(`Locked! Key: ${password}`);
  player.playSound("random.anvil_use");
}

function unlockBlock(player, block, lock) {
  world.setDynamicProperty(lock.key, undefined);
  player.sendMessage("Unlocked! Chest is now public");
  player.playSound("random.orb");
  block.dimension.spawnParticle("minecraft:villager_happy", effectLocation(block, 1.2));
}

function denyAccess(player, block, password) {
  const hint = REVEAL_PASSWORD_ON_DENY
    ? `Locked! Need key named: ${password}`
    : "Locked! Need a key with the correct name";
  player.sendMessage(hint);
  player.playSound("break.amethyst_block");
  block.dimension.spawnParticle("minecraft:villager_angry", effectLocation(block, 1.2));
}

function copyKey(player) {
  if (recentKeyBlockUse.get(player.id) >= system.currentTick - 2) return;
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return;
  const key = equippable.getEquipment(EquipmentSlot.Mainhand);
  const nuggetSlot = equippable.getEquipmentSlot(EquipmentSlot.Offhand);
  if (!key || key.typeId !== KEY_ID || !key.nameTag) return;
  if (!nuggetSlot.hasItem() || nuggetSlot.typeId !== NUGGET_ID) return;
  consumeOne(nuggetSlot);
  giveKey(player, key.nameTag);
  player.sendMessage(`Key copied! Key: ${key.nameTag}`);
  player.playSound("random.orb");
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, block, itemStack, isFirstEvent } = event;
  if (itemStack?.typeId === KEY_ID) recentKeyBlockUse.set(player.id, system.currentTick);
  if (!isLockable(block)) return;
  const lock = findLock(block);

  if (!lock) {
    if (itemStack?.typeId !== PADLOCK_ID) return;
    event.cancel = true;
    if (!isFirstEvent) return;
    const password = itemStack.nameTag;
    if (!password) {
      system.run(() => player.sendMessage("Rename the Padlock on an anvil first. The name is the password."));
      return;
    }
    system.run(() => lockBlock(player, block, password));
    return;
  }

  if (!hasCorrectKey(player, lock.password)) {
    event.cancel = true;
    if (isFirstEvent) system.run(() => denyAccess(player, block, lock.password));
    return;
  }

  if (player.isSneaking) {
    event.cancel = true;
    if (isFirstEvent) system.run(() => unlockBlock(player, block, lock));
  }
});

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const { player, block } = event;
  if (!isLockable(block) || !findLock(block)) return;
  event.cancel = true;
  system.run(() => player.sendMessage("Can't break! Locked. Sneak + Key to unlock first"));
});

world.beforeEvents.itemUse.subscribe((event) => {
  const { source, itemStack } = event;
  if (itemStack?.typeId !== KEY_ID || !itemStack.nameTag) return;
  system.run(() => copyKey(source));
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const { block } = event;
  if (!isLockable(block)) return;
  const origin = lockPosition(block);
  const key = propertyKey(block.dimension, origin.x, origin.y, origin.z);
  if (world.getDynamicProperty(key) !== undefined) world.setDynamicProperty(key, undefined);
});

world.afterEvents.playerLeave.subscribe((event) => {
  recentKeyBlockUse.delete(event.playerId);
});
