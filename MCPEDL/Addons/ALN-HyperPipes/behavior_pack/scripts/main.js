import { world, system } from "@minecraft/server";
import { WRENCH_ID, PIPE_FILTER, isPipeId } from "./lib/constants.js";
import { ensureRecord, loadRecords } from "./lib/state.js";
import { startNetwork } from "./lib/network.js";
import { rotatePipe } from "./lib/wrench.js";
import { configureFilter } from "./lib/filter.js";

function heldItem(player) {
  const inventory = player.getComponent("minecraft:inventory");
  const container = inventory ? inventory.container : undefined;
  return container ? container.getItem(player.selectedSlotIndex) : undefined;
}

function onInteract(event) {
  const { block, player } = event;
  if (!player || !block) return;
  const held = heldItem(player);
  if (held && held.typeId === WRENCH_ID) {
    rotatePipe(block, player, player.isSneaking);
    return;
  }
  if (block.typeId === PIPE_FILTER) configureFilter(block, player, held);
}

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("aln:pipe", {
    onPlace(event) {
      if (isPipeId(event.block.typeId)) ensureRecord(event.block);
    },
    onPlayerInteract: onInteract,
  });
});

world.afterEvents.playerPlaceBlock?.subscribe((event) => {
  if (isPipeId(event.block.typeId)) ensureRecord(event.block);
});

system.run(() => {
  loadRecords();
  startNetwork();
});
