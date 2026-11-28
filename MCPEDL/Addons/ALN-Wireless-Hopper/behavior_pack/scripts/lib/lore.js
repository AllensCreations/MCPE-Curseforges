import { makeKey, parseKey } from "./registry.js";
const PATTERN = /^§7Hopper: (-?\d+) (-?\d+) (-?\d+) \(([a-z_:]+)\)$/;
export function encodeSender(senderKey) {
    const info = parseKey(senderKey);
    if (!info)
        return [];
    const dimension = info.dimensionId.replace("minecraft:", "");
    return [
        `§7Hopper: ${info.x} ${info.y} ${info.z} (${dimension})`,
        "§7Right-click a container to link it.",
    ];
}
export function decodeSender(lore) {
    const line = lore.find((entry) => PATTERN.test(entry));
    if (!line)
        return undefined;
    const match = PATTERN.exec(line);
    if (!match)
        return undefined;
    const dimensionId = match[4].includes(":") ? match[4] : `minecraft:${match[4]}`;
    return makeKey(dimensionId, Number(match[1]), Number(match[2]), Number(match[3]));
}
