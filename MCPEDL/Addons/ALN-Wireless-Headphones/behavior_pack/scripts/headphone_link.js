import { world, system, EquipmentSlot } from "@minecraft/server";
import {
  HEADPHONES_ID,
  PAIR_KEY,
  JUKEBOX_ID,
  parsePairing,
  samePos,
  isRegistered,
  addToRegistry,
  removeFromRegistry,
  keepLoaded,
  releaseLoaded,
  resetSession
} from "./headphone_common.js";

function findHeadphones(player) {
  const inventory = player.getComponent("minecraft:inventory");
  if (inventory && inventory.container) {
    const slot = player.selectedSlotIndex;
    const held = inventory.container.getItem(slot);
    if (held && held.typeId === HEADPHONES_ID) {
      return { item: held, save: (item) => inventory.container.setItem(slot, item) };
    }
  }
  const equippable = player.getComponent("minecraft:equippable");
  if (equippable) {
    const head = equippable.getEquipment(EquipmentSlot.Head);
    if (head && head.typeId === HEADPHONES_ID) {
      return { item: head, save: (item) => equippable.setEquipment(EquipmentSlot.Head, item) };
    }
  }
  return undefined;
}

function pairOrUnpair(player, pos) {
  const found = findHeadphones(player);
  if (!found) {
    return;
  }
  const current = parsePairing(found.item);
  if (current && samePos(current, pos)) {
    found.item.setDynamicProperty(PAIR_KEY, undefined);
    found.item.setLore([]);
    found.save(found.item);
    removeFromRegistry(pos);
    releaseLoaded(pos);
    resetSession(pos.dimension, pos.x, pos.y, pos.z);
    player.playSound("note.bass");
    player.onScreenDisplay.setActionBar("\u00a7e[Headphones] \u00a7fUnpaired. The Jukebox is audible again.");
    return;
  }
  if (current) {
    removeFromRegistry(current);
    releaseLoaded(current);
  }
  found.item.setDynamicProperty(PAIR_KEY, JSON.stringify(pos));
  found.item.setLore([
    "\u00a77Paired Jukebox: " + pos.x + ", " + pos.y + ", " + pos.z,
    "\u00a78" + pos.dimension.replace("minecraft:", "")
  ]);
  found.save(found.item);
  const alreadyRegistered = isRegistered(pos);
  addToRegistry(pos);
  const kept = alreadyRegistered ? true : keepLoaded(pos);
  resetSession(pos.dimension, pos.x, pos.y, pos.z);
  player.playSound("note.pling");
  if (kept) {
    player.onScreenDisplay.setActionBar("\u00a7a[Headphones] \u00a7fPaired! The Jukebox is muted. Wear the headphones to listen.");
  } else {
    player.onScreenDisplay.setActionBar("\u00a7a[Headphones] \u00a7fPaired! \u00a7eThe Jukebox can only stay loaded while you are near (loaded-area limit reached).");
  }
}

const beforeInteract = world.beforeEvents.playerInteractWithBlock;
if (beforeInteract) {
  beforeInteract.subscribe((event) => {
    const { player, block, itemStack } = event;
    if (!event.isFirstEvent) {
      return;
    }
    if (block.typeId !== JUKEBOX_ID || !player.isSneaking) {
      return;
    }
    if (!itemStack || itemStack.typeId !== HEADPHONES_ID) {
      return;
    }
    event.cancel = true;
    const pos = {
      x: block.location.x,
      y: block.location.y,
      z: block.location.z,
      dimension: block.dimension.id
    };
    system.run(() => {
      try {
        pairOrUnpair(player, pos);
      } catch (error) {
        return;
      }
    });
  });
}
