import { system } from "@minecraft/server";
import { registerPainterBlock } from "./lib/painter_anvil_ui.js";
import { registerPaintedDoor, initPaintedDoorEvents } from "./lib/painted_door_handler.js";

system.beforeEvents.startup.subscribe((initEvent) => {
  registerPainterBlock(initEvent.blockComponentRegistry);
  registerPaintedDoor(initEvent.blockComponentRegistry);
});

system.run(() => {
  initPaintedDoorEvents();
});
