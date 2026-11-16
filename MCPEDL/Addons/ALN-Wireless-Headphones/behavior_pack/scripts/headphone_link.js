import { world, system } from "@minecraft/server";
import {
  HEADPHONES_ID,
  PAIR_KEY,
  JUKEBOX_ID,
  getRecordPlayer,
  resetSession
} from "./headphone_common.js";

function hasDisc(block) {
  const recordPlayer = getRecordPlayer(block);
  if (!recordPlayer) {
    return false;
  }
  try {
    return recordPlayer.getRecord() !== undefined;
  } catch (error) {
    return false;
  }
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, block, itemStack } = event;
  if (!event.isFirstEvent) {
    return;
  }
  if (!itemStack || itemStack.typeId !== HEADPHONES_ID) {
    return;
  }
  if (!player.isSneaking) {
    return;
  }
  if (block.typeId !== JUKEBOX_ID) {
    return;
  }
  if (!hasDisc(block)) {
    player.onScreenDisplay.setActionBar("\u00a7c[Headphones] \u00a7fThat Jukebox has no music disc.");
    return;
  }
  const inventory = player.getComponent("minecraft:inventory");
  if (!inventory || !inventory.container) {
    return;
  }
  const slot = player.selectedSlotIndex;
  const held = inventory.container.getItem(slot);
  if (!held || held.typeId !== HEADPHONES_ID) {
    return;
  }
  const dimensionId = block.dimension.id;
  const location = {
    x: block.location.x,
    y: block.location.y,
    z: block.location.z,
    dimension: dimensionId
  };
  held.setDynamicProperty(PAIR_KEY, JSON.stringify(location));
  held.setLore([
    "\u00a77Paired Jukebox: " + location.x + ", " + location.y + ", " + location.z
  ]);
  inventory.container.setItem(slot, held);
  resetSession(dimensionId, location.x, location.y, location.z);
  system.run(() => {
    try {
      player.playSound("note.pling");
      player.onScreenDisplay.setActionBar("\u00a7a[Headphones] \u00a7fSuccessfully paired to Jukebox!");
    } catch (error) {
      return;
    }
  });
});
