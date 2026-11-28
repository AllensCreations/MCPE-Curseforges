import { system } from "@minecraft/server";
import { createLogger } from "./lib/logger.js";
import { registerPainterBlock } from "./lib/painter_anvil_ui.js";
import { registerPaintedDoor, initPaintedDoorEvents } from "./lib/painted_door_handler.js";
import { initDiagnostics } from "./lib/diagnostics.js";

const log = createLogger("main");

log.step("main.js loaded");

system.beforeEvents.startup.subscribe((initEvent) => {
  log.step("startup event fired");
  log.guard("register painter component", () => registerPainterBlock(initEvent.blockComponentRegistry));
  log.guard("register painted door component", () => registerPaintedDoor(initEvent.blockComponentRegistry));
});

system.run(() => {
  log.step("first tick: starting door events and diagnostics");
  log.guard("init door events", () => initPaintedDoorEvents());
  initDiagnostics();
});
