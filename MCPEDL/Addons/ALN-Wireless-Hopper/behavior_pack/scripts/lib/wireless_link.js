import { world, system } from "@minecraft/server";
import { HOPPER_ID, PROP_SELECTED, RECEIVER_TYPES, REMOTE_ID } from "./constants.js";
import { distribute, resolveTargets } from "./distribute.js";
import { itemLabel, notify } from "./feedback.js";
import { blockKey, getReceivers, makeKey, parseKey, removeHopper, toggleReceiver } from "./registry.js";

function safeBlock(dimension, loc) {
  try {
    return dimension.getBlock(loc);
  } catch {
    return undefined;
  }
}

function selectHopper(player, dimension, loc) {
  const block = safeBlock(dimension, loc);
  if (!block || block.typeId !== HOPPER_ID) {
    notify(player, "That Wireless Hopper is gone.", "error");
    return;
  }
  const key = makeKey(dimension.id, loc.x, loc.y, loc.z);
  try {
    player.setDynamicProperty(PROP_SELECTED, key);
  } catch {
    notify(player, "Could not store the selection.", "error");
    return;
  }
  const count = getReceivers(key).length;
  notify(player, `Wireless Hopper selected (${count} linked). Right-click a container to link it.`, "ok");
}

function readSelection(player) {
  let key;
  try {
    key = player.getDynamicProperty(PROP_SELECTED);
  } catch {
    key = undefined;
  }
  if (typeof key !== "string") {
    notify(player, "Select a Wireless Hopper first: right-click it with the Remote.", "warn");
    return undefined;
  }
  const info = parseKey(key);
  if (!info) {
    notify(player, "Select a Wireless Hopper first: right-click it with the Remote.", "warn");
    return undefined;
  }
  let block;
  try {
    block = world.getDimension(info.dimensionId).getBlock({ x: info.x, y: info.y, z: info.z });
  } catch {
    block = undefined;
  }
  if (!block) {
    notify(player, "The selected Wireless Hopper is not loaded right now.", "warn");
    return undefined;
  }
  if (block.typeId !== HOPPER_ID) {
    removeHopper(key);
    try {
      player.setDynamicProperty(PROP_SELECTED, undefined);
    } catch {
      return undefined;
    }
    notify(player, "The selected Wireless Hopper no longer exists.", "error");
    return undefined;
  }
  return key;
}

function bindContainer(player, dimension, loc) {
  const hopperKey = readSelection(player);
  if (!hopperKey) return;
  const block = safeBlock(dimension, loc);
  if (!block || !RECEIVER_TYPES.has(block.typeId)) {
    notify(player, "That is not a Chest, Barrel or Hopper.", "error");
    return;
  }
  const result = toggleReceiver(hopperKey, makeKey(dimension.id, loc.x, loc.y, loc.z));
  const count = getReceivers(hopperKey).length;
  if (result === "added") notify(player, `Receiver linked (${count} total).`, "ok");
  else if (result === "removed") notify(player, `Receiver unlinked (${count} total).`, "warn");
  else if (result === "full") notify(player, "This Wireless Hopper has the maximum number of receivers.", "error");
  else notify(player, "The world has the maximum number of Wireless Hoppers with receivers.", "error");
}

function showStatus(player, dimension, loc) {
  const block = safeBlock(dimension, loc);
  if (!block || block.typeId !== HOPPER_ID) return;
  const key = blockKey(block);
  const { targets, offline } = resolveTargets(key);
  const suffix = offline > 0 ? `, ${offline} offline` : "";
  notify(player, `Wireless Hopper: ${targets.length} receivers online${suffix}.`, "ok");
}

function deposit(player, dimension, loc) {
  const block = safeBlock(dimension, loc);
  if (!block || block.typeId !== HOPPER_ID) return;
  const key = blockKey(block);
  const container = player.getComponent("inventory")?.container;
  if (!container) return;
  const slot = player.selectedSlotIndex;
  const held = container.getItem(slot);
  if (!held || held.typeId === REMOTE_ID) return;
  if (getReceivers(key).length === 0) {
    notify(player, "No receivers linked. Use the Wireless Remote first.", "warn");
    return;
  }
  const result = distribute(key, held);
  if (result.accepted === 0) {
    notify(player, "Receivers are full or offline. Nothing was sent.", "error");
    return;
  }
  if (result.remaining > 0) {
    held.amount = result.remaining;
    container.setItem(slot, held);
  } else {
    container.setItem(slot, undefined);
  }
  const label = itemLabel(held.typeId);
  const kind = result.remaining > 0 ? "warn" : "ok";
  const tail = result.remaining > 0 ? ` ${result.remaining} returned.` : "";
  notify(player, `Beamed ${result.accepted} ${label} to ${result.receivers} receivers.${tail}`, kind);
}

export function initWirelessLink() {
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (!event.isFirstEvent) return;
    const { player, block, itemStack } = event;
    const typeId = block.typeId;
    const dimension = block.dimension;
    const loc = { x: block.location.x, y: block.location.y, z: block.location.z };

    if (itemStack && itemStack.typeId === REMOTE_ID) {
      if (typeId === HOPPER_ID) {
        event.cancel = true;
        system.run(() => selectHopper(player, dimension, loc));
      } else if (RECEIVER_TYPES.has(typeId)) {
        event.cancel = true;
        system.run(() => bindContainer(player, dimension, loc));
      }
      return;
    }

    if (typeId !== HOPPER_ID) return;
    if (itemStack) {
      event.cancel = true;
      system.run(() => deposit(player, dimension, loc));
    } else {
      system.run(() => showStatus(player, dimension, loc));
    }
  });

  const afterBreak = world.afterEvents.playerBreakBlock;
  if (afterBreak) {
    afterBreak.subscribe((event) => {
      try {
        if (event.brokenBlockPermutation.type.id !== HOPPER_ID) return;
        const l = event.block.location;
        removeHopper(makeKey(event.dimension.id, l.x, l.y, l.z));
      } catch {
        return;
      }
    });
  }
}
