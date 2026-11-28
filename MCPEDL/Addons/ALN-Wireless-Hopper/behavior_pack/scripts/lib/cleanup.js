import { world } from "@minecraft/server";
import { RECEIVER_TYPES } from "./constants.js";
import { dropReceiverEverywhere, makeKey, removeHopper } from "./registry.js";
export function initCleanup() {
    world.afterEvents.playerBreakBlock.subscribe((event) => {
        try {
            if (!RECEIVER_TYPES.has(event.brokenBlockPermutation.type.id))
                return;
            const location = event.block.location;
            const key = makeKey(event.dimension.id, location.x, location.y, location.z);
            removeHopper(key);
            dropReceiverEverywhere(key);
        }
        catch {
            return;
        }
    });
}
