import { world, system } from "@minecraft/server";
import { deliverPayouts } from "./trade_storage.js";
import { registerTradeUI } from "./trade_ui.js";

function scheduleDelivery(player) {
    system.runTimeout(() => {
        if (player.isValid) deliverPayouts(player);
    }, 40);
}

world.afterEvents.worldLoad.subscribe(() => {
    registerTradeUI();

    world.afterEvents.playerSpawn.subscribe((event) => {
        if (event.initialSpawn) scheduleDelivery(event.player);
    });

    for (const player of world.getAllPlayers()) scheduleDelivery(player);
});
