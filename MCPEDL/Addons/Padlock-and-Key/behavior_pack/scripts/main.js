import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";
import {
  HOPPER_ID,
  clearLock,
  dimensionFromCode,
  findLock,
  hasHopperBelow,
  hasSolidFloor,
  isContainer,
  isLockable,
  isLockedFloor,
  isOpenable,
  listLocks,
  lockCount,
  lockParts,
  lockPassword,
  lockPosition,
  locksNear,
  propertyKey,
  setLock,
} from "./lib/lockdata.js";
import { followLocks, isPending, isPiston, pistonAimedAt, pistonChainHitsLock } from "./lib/pistons.js";
import { holdShut, openState } from "./lib/doors.js";

const PADLOCK_ID = "pnk:padlock";
const KEY_ID = "pnk:key";
const GLOW_KEY_ID = "pnk:key_glow";
const KEY_IDS = new Set([KEY_ID, GLOW_KEY_ID]);
const NUGGET_ID = "minecraft:iron_nugget";
const REVEAL_PASSWORD_ON_DENY = false;
const HOPPER_CART_ID = "minecraft:hopper_minecart";
const DIMENSION_NAMES = ["overworld", "nether", "the_end"];

const recentKeyBlockUse = new Map();
const staleStrikes = new Map();
const SWEEP_BATCH = 40;
let sweepQueue = [];

function say(player, text) {
  player.onScreenDisplay.setActionBar(text);
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

function refuse(player, text) {
  say(player, text);
  player.playSound("break.amethyst_block");
}

function lockBlock(player, block, password) {
  const slot = getContainer(player)?.getSlot(player.selectedSlotIndex);
  if (!slot || !slot.hasItem() || slot.typeId !== PADLOCK_ID || slot.nameTag !== password) return;
  if (!isLockable(block) || findLock(block)) return;
  if (hasHopperBelow(block)) {
    refuse(player, "Can't lock! Remove the Hopper below first");
    return;
  }
  if (isContainer(block) && !hasSolidFloor(block)) {
    refuse(player, "Can't lock! Needs a block below (no Hopper, rail or liquid)");
    return;
  }
  if (lockParts(block).some((part) => pistonAimedAt(part))) {
    refuse(player, "Can't lock! A Piston is aimed at it");
    return;
  }
  const origin = lockPosition(block);
  setLock(propertyKey(block.dimension, origin.x, origin.y, origin.z), password);
  consumeOne(slot);
  giveNamed(player, GLOW_KEY_ID, password);
  say(player, `Locked! Key: ${password}`);
  player.playSound("random.anvil_use");
}

function releaseLock(player, dimension, at, lock) {
  const slot = findKeySlot(player, lock.password);
  clearLock(lock.key);
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

  const openable = isOpenable(block);
  const location = block.location;
  const wasOpen = openable ? openState(block) : undefined;

  if (!hasCorrectKey(player, lock.password)) {
    event.cancel = true;
    if (isFirstEvent) {
      system.run(() => {
        denyAccess(player, block, lock.password);
        if (openable) holdShut(block.dimension, location, wasOpen);
      });
    }
    return;
  }

  if (player.isSneaking) {
    event.cancel = true;
    if (isFirstEvent) system.run(() => unlockBlock(player, block, lock));
    return;
  }

  if (openable) {
    event.cancel = true;
    if (isFirstEvent) {
      system.run(() => {
        say(player, "Locked! Sneak and use the Key to unlock");
        holdShut(block.dimension, location, wasOpen);
      });
    }
  }
});

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const { player, block } = event;
  const lock = isLockable(block) ? findLock(block) : null;
  if (!lock) {
    if (isLockedFloor(block)) {
      event.cancel = true;
      system.run(() => say(player, "Protected! Unlock the block above first"));
    }
    return;
  }
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
      refuse(player, "Can't place! A Hopper would empty the locked block");
      return;
    }
  }
  if (isPiston(block) && pistonChainHitsLock(block)) {
    const typeId = block.typeId;
    block.setType("minecraft:air");
    getContainer(player)?.addItem(new ItemStack(typeId, 1));
    refuse(player, "Can't place! This Piston would move a locked block");
    return;
  }
  if (!isLockable(block)) return;
  const origin = lockPosition(block);
  const key = propertyKey(block.dimension, origin.x, origin.y, origin.z);
  if (lockPassword(key) !== undefined) clearLock(key);
});

world.afterEvents.playerLeave.subscribe((event) => {
  recentKeyBlockUse.delete(event.playerId);
});

world.beforeEvents.explosion.subscribe((event) => {
  if (lockCount() === 0) return;
  const impacted = event.getImpactedBlocks();
  if (impacted.length === 0) return;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const block of impacted) {
    const { x, z } = block.location;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  if (!locksNear(event.dimension, minX - 1, maxX + 1, minZ - 1, maxZ + 1)) return;
  event.setImpactedBlocks(impacted.filter((block) => !(isLockable(block) && findLock(block)) && !isLockedFloor(block)));
});

world.afterEvents.pistonActivate.subscribe(followLocks);

system.runInterval(() => {
  if (lockCount() === 0) return;
  for (const name of DIMENSION_NAMES) {
    try {
      const dimension = world.getDimension(name);
      for (const cart of dimension.getEntities({ type: HOPPER_CART_ID })) {
        const { x, y, z } = cart.location;
        const above = dimension.getBlock({ x: Math.floor(x), y: Math.floor(y) + 1, z: Math.floor(z) });
        if (!above || !isContainer(above) || !findLock(above)) continue;
        for (const player of dimension.getPlayers({ location: cart.location, maxDistance: 12 })) {
          say(player, "Hopper Minecart destroyed! It was under a locked block");
        }
        dimension.spawnParticle("minecraft:villager_angry", { x, y: y + 0.5, z });
        cart.kill();
      }
    } catch (error) {
      continue;
    }
  }
}, 10);

system.runInterval(() => {
  if (sweepQueue.length === 0) sweepQueue = listLocks();
  for (const entry of sweepQueue.splice(0, SWEEP_BATCH)) {
    if (lockPassword(entry.key) === undefined) {
      staleStrikes.delete(entry.key);
      continue;
    }
    if (isPending(entry.key)) continue;
    const dimension = dimensionFromCode(entry.code);
    if (!dimension) continue;
    let block;
    try {
      block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
    } catch (error) {
      continue;
    }
    if (!block) continue;
    if (isLockable(block) || block.typeId === "minecraft:moving_block") {
      staleStrikes.delete(entry.key);
      continue;
    }
    const strikes = (staleStrikes.get(entry.key) ?? 0) + 1;
    if (strikes >= 2) {
      clearLock(entry.key);
      staleStrikes.delete(entry.key);
    } else {
      staleStrikes.set(entry.key, strikes);
    }
  }
}, 40);
