import { world, system } from "@minecraft/server";
import { openAltar } from "./lib/altar_form.js";

let ready = false;

system.beforeEvents.startup.subscribe(({ blockComponentRegistry }) => {
  blockComponentRegistry.registerCustomComponent("aln:fabrication_altar", {
    onPlayerInteract(event) {
      if (!ready) {
        return;
      }
      const player = event.player;
      const block = event.block;
      if (!player || !block) {
        return;
      }
      system.run(() => {
        openAltar(player, block).catch(() => {});
      });
    },
  });
});

world.afterEvents.worldLoad.subscribe(() => {
  ready = true;
});
