import { world } from "@minecraft/server";
import { registerToggleListener } from "./visor_toggle.js";
import { startScannerLoop }       from "./visor_scanner.js";

world.afterEvents.worldLoad.subscribe(() => {
  registerToggleListener();
  startScannerLoop();
  world.sendMessage("§b[ALN:XRayVisor] §7Systems online. Craft the visor and right-click to toggle.");
});
