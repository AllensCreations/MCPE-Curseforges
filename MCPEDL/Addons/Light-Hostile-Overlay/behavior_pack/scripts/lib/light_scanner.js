import { MARKER_HEIGHT, MAX_MARKERS, PARTICLE_PREFIX, SCAN_ABOVE, SCAN_BELOW, SCAN_HALF_XZ, UNSAFE_MAX_LIGHT, } from "./config.js";
export function scanLight(player) {
    const dimension = player.dimension;
    const cx = Math.floor(player.location.x);
    const cy = Math.floor(player.location.y);
    const cz = Math.floor(player.location.z);
    const markers = [];
    for (let dx = -SCAN_HALF_XZ; dx < SCAN_HALF_XZ; dx++) {
        for (let dz = -SCAN_HALF_XZ; dz < SCAN_HALF_XZ; dz++) {
            for (let dy = -SCAN_BELOW; dy < SCAN_ABOVE; dy++) {
                const x = cx + dx;
                const y = cy + dy;
                const z = cz + dz;
                try {
                    const floor = dimension.getBlock({ x, y, z });
                    if (!floor || floor.isAir || floor.isLiquid)
                        continue;
                    const space = dimension.getBlock({ x, y: y + 1, z });
                    if (!space || !space.isAir)
                        continue;
                    const light = Math.max(0, Math.min(15, Math.floor(space.getLightLevel())));
                    markers.push({
                        pos: { x: x + 0.5, y: y + MARKER_HEIGHT, z: z + 0.5 },
                        light,
                        dist: dx * dx + dy * dy + dz * dz,
                    });
                }
                catch (e) {
                    continue;
                }
            }
        }
    }
    markers.sort((a, b) => a.dist - b.dist);
    const shown = markers.slice(0, MAX_MARKERS);
    let unsafe = 0;
    for (const m of shown) {
        if (m.light <= UNSAFE_MAX_LIGHT)
            unsafe++;
        try {
            dimension.spawnParticle(PARTICLE_PREFIX + m.light, m.pos);
        }
        catch (e) {
            continue;
        }
    }
    return { total: shown.length, unsafe, safe: shown.length - unsafe };
}
