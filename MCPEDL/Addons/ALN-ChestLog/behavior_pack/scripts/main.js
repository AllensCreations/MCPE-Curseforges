import { world } from "@minecraft/server";
import { initSync } from "./chest_sync.js";
import { initRegister } from "./chest_register.js";
import { initUI } from "./chest_ui.js";
world.afterEvents.worldLoad.subscribe(() => {
    initSync();
    initRegister();
    initUI();
});
