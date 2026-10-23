// platform.js - the island floor grows with the permit radius (void world). A one-block-thick grass
// floor is laid on the same layer as the core's Bedrock, only where there is air, only in loaded chunks
// near players, and only inside the player's permit.
import { world, system } from "@minecraft/server";
import { ORIGIN } from "./economy.js";
import { getRadius } from "./zoning.js";

const FLOOR_Y = ORIGIN.y - 1;
const done = new Set(); // "chunkX,chunkZ,radius" already filled this session

export function initPlatform() {
  system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
      if (!p.hasTag("void_cleaned") || p.dimension.id !== "minecraft:overworld") continue;
      const r = getRadius(p);
      const cx = Math.floor(p.location.x / 16), cz = Math.floor(p.location.z / 16);
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
        const key = `${cx + dx},${cz + dz},${r}`;
        if (done.has(key)) continue;
        const x1 = Math.max((cx + dx) * 16, ORIGIN.x - r), x2 = Math.min((cx + dx) * 16 + 15, ORIGIN.x + r);
        const z1 = Math.max((cz + dz) * 16, ORIGIN.z - r), z2 = Math.min((cz + dz) * 16 + 15, ORIGIN.z + r);
        if (x1 > x2 || z1 > z2) { done.add(key); continue; }
        try {
          // Only fill when the chunk corners are loaded.
          if (!p.dimension.getBlock({ x: x1, y: FLOOR_Y, z: z1 }) || !p.dimension.getBlock({ x: x2, y: FLOOR_Y, z: z2 })) continue;
          p.dimension.runCommand(`fill ${x1} ${FLOOR_Y} ${z1} ${x2} ${FLOOR_Y} ${z2} grass_block replace air`);
          done.add(key);
        } catch { /* try again next pass */ }
      }
    }
  }, 40);
}
