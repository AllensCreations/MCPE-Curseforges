import { world } from "@minecraft/server";
import { RECEIVER_TYPES } from "./constants.js";
import { dropReceiver, getReceivers, parseKey } from "./registry.js";
const cursors = new Map();
function resolveContainer(key) {
    const info = parseKey(key);
    if (!info)
        return { state: "stale" };
    try {
        const block = world.getDimension(info.dimensionId).getBlock({ x: info.x, y: info.y, z: info.z });
        if (!block)
            return { state: "offline" };
        if (!RECEIVER_TYPES.has(block.typeId))
            return { state: "stale" };
        const container = block.getComponent("inventory")?.container;
        if (!container)
            return { state: "offline" };
        return { state: "ok", container };
    }
    catch {
        return { state: "offline" };
    }
}
export function resolveTargets(senderKey) {
    const targets = [];
    let offline = 0;
    for (const key of getReceivers(senderKey)) {
        const result = resolveContainer(key);
        if (result.state === "ok")
            targets.push({ key, container: result.container });
        else if (result.state === "stale")
            dropReceiver(senderKey, key);
        else
            offline += 1;
    }
    return { targets, offline };
}
export function distribute(senderKey, stack) {
    const { targets, offline } = resolveTargets(senderKey);
    const total = stack.amount;
    if (targets.length === 0)
        return { accepted: 0, remaining: total, receivers: 0, offline };
    let remaining = total;
    let active = targets.slice();
    const cursor = cursors.get(senderKey) ?? 0;
    while (remaining > 0 && active.length > 0) {
        const count = active.length;
        const base = Math.floor(remaining / count);
        let extra = remaining % count;
        const next = [];
        let progress = 0;
        for (let i = 0; i < count; i += 1) {
            const target = active[(cursor + i) % count];
            let share = base;
            if (extra > 0) {
                share += 1;
                extra -= 1;
            }
            if (share <= 0) {
                next.push(target);
                continue;
            }
            const part = stack.clone();
            part.amount = share;
            let rest;
            try {
                rest = target.container.addItem(part);
            }
            catch {
                continue;
            }
            const left = rest ? rest.amount : 0;
            const moved = share - left;
            if (moved > 0) {
                progress += moved;
                remaining -= moved;
            }
            if (left === 0)
                next.push(target);
        }
        active = next;
        if (progress === 0)
            break;
    }
    cursors.set(senderKey, (cursor + 1) % targets.length);
    return { accepted: total - remaining, remaining, receivers: targets.length, offline };
}
