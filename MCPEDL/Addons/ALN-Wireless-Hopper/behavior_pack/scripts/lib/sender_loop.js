import { world, system } from "@minecraft/server";
import { HOPPER_TYPE, SEND_INTERVAL } from "./constants.js";
import { distribute } from "./distribute.js";
import { hasLinks, linkedHopperKeys, parseKey, removeHopper } from "./registry.js";
function drain(senderKey) {
    const info = parseKey(senderKey);
    if (!info) {
        removeHopper(senderKey);
        return;
    }
    let block;
    try {
        block = world.getDimension(info.dimensionId).getBlock({ x: info.x, y: info.y, z: info.z });
    }
    catch {
        return;
    }
    if (!block)
        return;
    if (block.typeId !== HOPPER_TYPE) {
        removeHopper(senderKey);
        return;
    }
    const container = block.getComponent("inventory")?.container;
    if (!container)
        return;
    for (let slot = 0; slot < container.size; slot += 1) {
        const item = container.getItem(slot);
        if (!item)
            continue;
        const result = distribute(senderKey, item);
        if (result.receivers === 0)
            return;
        if (result.accepted === 0)
            continue;
        if (result.remaining > 0) {
            item.amount = result.remaining;
            container.setItem(slot, item);
        }
        else {
            container.setItem(slot, undefined);
        }
    }
}
export function initSenderLoop() {
    system.runInterval(() => {
        if (!hasLinks())
            return;
        for (const senderKey of linkedHopperKeys()) {
            try {
                drain(senderKey);
            }
            catch {
                continue;
            }
        }
    }, SEND_INTERVAL);
}
