// zoning.js - island permit levels + boundary guard.
import { world, system, ItemStack } from "@minecraft/server";
import { ORIGIN } from "./economy.js";

// Level 0 is free. Radius is measured in blocks from the origin on X and Z.
// "phase" is the minimum world phase index (see economy.js PHASES) needed to buy that level.
export const PERMITS = [
  { radius: 8, cost: 0, phase: 0 }, { radius: 16, cost: 50, phase: 1 }, { radius: 32, cost: 250, phase: 2 },
  { radius: 64, cost: 1000, phase: 3 }, { radius: 128, cost: 5000, phase: 4 },
];
export const WARNING = "§c[ZONING] §fPermit required to build in this sector!";

export function getPermitLevel(player) {
  const v = player.getDynamicProperty("sv_permit");
  return typeof v === "number" ? Math.min(Math.max(0, v), PERMITS.length - 1) : 0;
}
export const setPermitLevel = (player, lvl) => player.setDynamicProperty("sv_permit", lvl);
export const getRadius = (player) => PERMITS[getPermitLevel(player)].radius;
export const isInside = (radius, x, z) => Math.abs(x - ORIGIN.x) <= radius && Math.abs(z - ORIGIN.z) <= radius;

const lastSafe = new Map(); // player id -> last location inside the permit

function sendBack(player) {
  const spot = lastSafe.get(player.id) ?? { x: ORIGIN.x + 0.5, y: ORIGIN.y + 1, z: ORIGIN.z + 0.5 };
  try { player.teleport(spot, { dimension: world.getDimension("overworld") }); } catch { /* ignore */ }
  player.onScreenDisplay.setActionBar(WARNING);
}

export function initZoning() {
  // 1. Position check (twice a second). Admins can bypass with: /tag <name> add sv_zoning_bypass
  system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
      if (!p.hasTag("void_cleaned") || p.hasTag("sv_zoning_bypass")) continue;
      if (p.dimension.id !== "minecraft:overworld") continue;
      const { x, y, z } = p.location;
      if (isInside(getRadius(p), x, z)) lastSafe.set(p.id, { x, y, z });
      else sendBack(p);
    }
  }, 10);

  // 2. Placement guard: undo blocks placed outside the permit (and refund the item).
  world.afterEvents.playerPlaceBlock.subscribe((ev) => {
    const { player, block } = ev;
    if (player.hasTag("sv_zoning_bypass") || block.dimension.id !== "minecraft:overworld") return;
    if (isInside(getRadius(player), block.location.x, block.location.z)) return;
    const id = block.typeId;
    block.setType("minecraft:air");
    try { player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(id, 1)); } catch { /* ignore */ }
    sendBack(player);
  });

  world.afterEvents.playerLeave.subscribe((ev) => lastSafe.delete(ev.playerId));
}
