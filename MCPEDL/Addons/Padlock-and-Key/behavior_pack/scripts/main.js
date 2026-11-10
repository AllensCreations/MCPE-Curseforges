import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";

const PADLOCK_ID = "pnk:padlock";
const KEY_ID = "pnk:key";
const GLOW_KEY_ID = "pnk:key_glow";
const KEY_IDS = new Set([KEY_ID, GLOW_KEY_ID]);
const NUGGET_ID = "minecraft:iron_nugget";
const HOPPER_ID = "minecraft:hopper";
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

function say(player, text) {
  player.onScreenDisplay.setActionBar(text);
}

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

function hasHopperBelow(block) {
  const parts = [block];
  if (CHEST_IDS.has(block.typeId)) {
    for (const side of SIDES) {
      const neighbor = block.dimension.getBlock({
        x: block.location.x + side.x,
        y: block.location.y,
        z: block.location.z + side.z,
      });
      if (neighbor && neighbor.typeId === block.typeId) parts.push(neighbor);
    }
  }
  return parts.some((part) => part.below()?.typeId === HOPPER_ID);
}

function getContainer(player) {
  return player.getComponent("minecraft:inventory")?.container;
}

function findKeySlot(player, password) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return undefined;
  for (const id of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand]) {
    const slot = equippable.getEquipmentSlot(id);
    if (slot.hasItem() && KEY_IDS.has(slot.typeId) && slot.nameTag === password) return slot;
  }
  return undefined;
}

function hasCorrectKey(player, password) {
  return findKeySlot(player, password) !== undefined;
}

function consumeOne(slot) {
  if (slot.amount > 1) slot.amount -= 1;
  else slot.setItem(undefined);
}

function giveNamed(player, id, name) {
  const item = new ItemStack(id, 1);
  item.nameTag = name;
  const leftover = getContainer(player)?.addItem(item);
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
  if (hasHopperBelow(block)) {
    say(player, "Can't lock! Remove the Hopper below first");
    player.playSound("break.amethyst_block");
    return;
  }
  const origin = lockPosition(block);
  world.setDynamicProperty(propertyKey(block.dimension, origin.x, origin.y, origin.z), password);
  consumeOne(slot);
  giveNamed(player, GLOW_KEY_ID, password);
  say(player, `Locked! Key: ${password}`);
  player.playSound("random.anvil_use");
}

function releaseLock(player, dimension, at, lock) {
  const slot = findKeySlot(player, lock.password);
  world.setDynamicProperty(lock.key, undefined);
  if (slot) consumeOne(slot);
  giveNamed(player, PADLOCK_ID, lock.password);
  dimension.spawnParticle("minecraft:totem_particle", at);
  dimension.spawnParticle("minecraft:villager_happy", at);
  player.playSound("random.orb");
}

function unlockBlock(player, block, lock) {
  releaseLock(player, block.dimension, effectLocation(block, 1.2), lock);
  say(player, "Unlocked! Key dispersed, Padlock returned");
}

function denyAccess(player, block, password) {
  const hint = REVEAL_PASSWORD_ON_DENY
    ? `Locked! Need key named: ${password}`
    : "Locked! Need a key with the correct name";
  say(player, hint);
  player.playSound("break.amethyst_block");
  block.dimension.spawnParticle("minecraft:villager_angry", effectLocation(block, 1.2));
}

function copyKey(player) {
  if (recentKeyBlockUse.get(player.id) >= system.currentTick - 2) return;
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return;
  const key = equippable.getEquipment(EquipmentSlot.Mainhand);
  const nuggetSlot = equippable.getEquipmentSlot(EquipmentSlot.Offhand);
  if (!key || !KEY_IDS.has(key.typeId) || !key.nameTag) return;
  if (!nuggetSlot.hasItem() || nuggetSlot.typeId !== NUGGET_ID) return;
  consumeOne(nuggetSlot);
  giveNamed(player, GLOW_KEY_ID, key.nameTag);
  say(player, `Key copied! Key: ${key.nameTag}`);
  player.playSound("random.orb");
}

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, block, itemStack, isFirstEvent } = event;
  if (itemStack && KEY_IDS.has(itemStack.typeId)) recentKeyBlockUse.set(player.id, system.currentTick);
  if (!isLockable(block)) return;
  const lock = findLock(block);

  if (!lock) {
    if (itemStack?.typeId !== PADLOCK_ID) return;
    event.cancel = true;
    if (!isFirstEvent) return;
    const password = itemStack.nameTag;
    if (!password) {
      system.run(() => say(player, "Rename the Padlock on an anvil first. The name is the password."));
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
  if (!isLockable(block)) return;
  const lock = findLock(block);
  if (!lock) return;
  if (!hasCorrectKey(player, lock.password)) {
    event.cancel = true;
    system.run(() => say(player, "Locked! Hold the matching Key to break it"));
    return;
  }
  const dimension = block.dimension;
  const at = effectLocation(block, 0.8);
  system.run(() => {
    releaseLock(player, dimension, at, lock);
    say(player, "Lock removed! Key dispersed, Padlock returned");
  });
});

world.beforeEvents.itemUse.subscribe((event) => {
  const { source, itemStack } = event;
  if (!itemStack || !KEY_IDS.has(itemStack.typeId) || !itemStack.nameTag) return;
  system.run(() => copyKey(source));
});

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const { block, player } = event;
  if (block.typeId === HOPPER_ID) {
    const above = block.above();
    if (above && isLockable(above) && findLock(above)) {
      block.setType("minecraft:air");
      getContainer(player)?.addItem(new ItemStack(HOPPER_ID, 1));
      say(player, "Can't place! A Hopper would empty the locked block");
      player.playSound("break.amethyst_block");
      return;
    }
  }
  if (!isLockable(block)) return;
  const origin = lockPosition(block);
  const key = propertyKey(block.dimension, origin.x, origin.y, origin.z);
  if (world.getDynamicProperty(key) !== undefined) world.setDynamicProperty(key, undefined);
});

world.afterEvents.playerLeave.subscribe((event) => {
  recentKeyBlockUse.delete(event.playerId);
});

world.beforeEvents.explosion.subscribe((event) => {
  const safe = event.getImpactedBlocks().filter((block) => !(isLockable(block) && findLock(block)));
  event.setImpactedBlocks(safe);
});
