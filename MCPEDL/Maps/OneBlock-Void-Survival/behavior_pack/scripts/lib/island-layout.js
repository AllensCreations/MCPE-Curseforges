import { OVERWORLD_ISLAND_ORDER, ISLAND_THEMES } from "./island-themes.js";

export function getIslandLocation(index, total, theme, lastPos = null) {
  const targetDim = (theme && theme.dimension) || "overworld";

  let distance;
  let angle;

  if (targetDim === "overworld") {
    let slotIdx = -1;
    if (theme && theme.id) {
      slotIdx = OVERWORLD_ISLAND_ORDER.indexOf(theme.id);
    }
    if (slotIdx < 0) {
      slotIdx = index % 33;
    }

    if (slotIdx < 6) {
      // Ring 1: 6 islands @ 72m (Offset 0°: 0°, 60°, 120°, 180°, 240°, 300° -> 0% diagonals, min diff 26m)
      distance = 72;
      angle = slotIdx * (360 / 6);
    } else if (slotIdx < 14) {
      // Ring 2: 8 islands @ 125m (Offset 22.5°: 22.5°, 67.5°, 112.5°... -> 0% diagonals, min diff 67m)
      distance = 125;
      angle = 22.5 + (slotIdx - 6) * (360 / 8);
    } else if (slotIdx < 24) {
      // Ring 3: 10 islands @ 180m (Offset 0°: 0°, 36°, 72°, 108°... -> 0% diagonals, min diff 40m)
      distance = 180;
      angle = (slotIdx - 14) * (360 / 10);
    } else {
      // Ring 4: 9 islands @ 240m (Offset 0°: 0°, 40°, 80°, 120°... -> 0% diagonals, min diff 30m)
      distance = 240;
      angle = (slotIdx - 24) * (360 / 9);
    }
  } else if (targetDim === "nether") {
    const netherThemes = ISLAND_THEMES.filter(t => t.dimension === "nether");
    let nIdx = theme ? netherThemes.findIndex(t => t.id === theme.id) : index;
    if (nIdx < 0) nIdx = index % 7;
    distance = 75;
    angle = nIdx * (360 / 7);
  } else {
    // The End (3 islands: end_city_tower, void_gateway_outpost, elytra_hangar @ 30°, 150°, 270°)
    const endThemes = ISLAND_THEMES.filter(t => t.dimension === "the_end");
    let eIdx = theme ? endThemes.findIndex(t => t.id === theme.id) : index;
    if (eIdx < 0) eIdx = index % 3;
    distance = 85;
    angle = 30 + eIdx * 120;
  }

  const rad = (angle * Math.PI) / 180;
  const cx = Math.round(distance * Math.cos(rad));
  const cz = Math.round(distance * Math.sin(rad));

  // Thematic Y Level: Skyblock height kept accessible (Y=60 to Y=72)
  const cy = (theme && typeof theme.y === "number") ? Math.min(72, Math.max(60, theme.y)) : 64;

  let cardinal = "North";
  if (Math.abs(cx) > Math.abs(cz)) {
    cardinal = cx > 0 ? "East" : "West";
  } else {
    cardinal = cz > 0 ? "South" : "North";
  }

  return {
    center: { x: cx, y: cy, z: cz },
    distance,
    cardinal: `${cardinal} (X: ${cx}, Z: ${cz})`
  };
}

// Physical existence verification: checks if island anchor or surface blocks physically exist
export function isIslandPhysicallyBuilt(dimension, center) {
  try {
    const under = dimension.getBlock({ x: center.x, y: center.y - 1, z: center.z });
    if (!under) return false; // Chunk unloaded
    if (under.typeId === "minecraft:bedrock") {
      const offBlock = dimension.getBlock({ x: center.x + 3, y: center.y, z: center.z });
      if (offBlock && !offBlock.isAir && offBlock.typeId !== "minecraft:air") return true;
    }
    const b = dimension.getBlock(center);
    if (b && !b.isAir && b.typeId !== "minecraft:air") return true;
    return false;
  } catch (e) {
    return false;
  }
}

const ISLAND_FOOTPRINT = 26;

export function isIslandFootprintLoaded(dimension, center) {
  try {
    const firstChunkX = (center.x - ISLAND_FOOTPRINT) >> 4;
    const lastChunkX = (center.x + ISLAND_FOOTPRINT) >> 4;
    const firstChunkZ = (center.z - ISLAND_FOOTPRINT) >> 4;
    const lastChunkZ = (center.z + ISLAND_FOOTPRINT) >> 4;
    for (let chunkX = firstChunkX; chunkX <= lastChunkX; chunkX++) {
      for (let chunkZ = firstChunkZ; chunkZ <= lastChunkZ; chunkZ++) {
        if (!dimension.getBlock({ x: chunkX * 16 + 8, y: center.y, z: chunkZ * 16 + 8 })) return false;
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}
