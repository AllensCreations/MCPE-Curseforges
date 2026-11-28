import { world } from "@minecraft/server";
import { registerLightCommand } from "./lib/light_command.js";
world.afterEvents.worldLoad.subscribe(() => {
    registerLightCommand();
});
