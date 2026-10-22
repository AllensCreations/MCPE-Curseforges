// workers.js - Worker Beacons: every 60 s each beacon checks the chest above it,
// harvests mature crops within 4 blocks and mines the OneBlock if it is within 5 blocks.
// Wages are deducted from the shared vault (see economy.js).
import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";
import { ORIGIN, spendVault, getVault, regenerateOrigin, countCoreBreak } from "./economy.js";
import { getRadius, isInside } from "./zoning.js";

export const BEACON_ID = "custom:worker_beacon";
export const WAGE = 2;          // coins per productive work cycle
export const MAX_PER_PLAYER = 5;
const CYCLE_TICKS = 1200;       // 60 seconds
const CROP_RADIUS = 4;
const MINE_RANGE = 5;

// crop block -> items added to storage when harvested
const CROPS = {
  "minecraft:wheat": [["minecraft:wheat", 1], ["minecraft:wheat_seeds", 1]],
  "minecraft:carrots": [["minecraft:carrot", 2]],
  "minecraft:potatoes": [["minecraft:potato", 2]],
  "minecraft:beetroot": [["minecraft:beetroot", 1], ["minecraft:beetroot_seeds", 1]],
};

const load = () => {
  const raw = world.getDynamicProperty("sv_workers");
  if (typeof raw !== "string") return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
};
const save = (a) => world.setDynamicProperty("sv_workers", JSON.stringify(a));
export const countOwned = (ownerId) => load().filter((w) => w.o === ownerId).length;

function notify(ownerId, msg) {
  const p = world.getAllPlayers().find((pl) => pl.id === ownerId);
  if (p) p.onScreenDisplay.setActionBar(msg);
}

function stash(container, dim, loc, id, amount) {
  const left = container.addItem(new ItemStack(id, amount));
  if (left) dim.spawnItem(left, { x: loc.x + 0.5, y: loc.y + 1.5, z: loc.z + 0.5 });
}

function runWorker(w, dim) {
  const base = dim.getBlock({ x: w.x, y: w.y, z: w.z });
  if (!base) return "skip";                       // unloaded chunk: try again next cycle
  if (base.typeId !== BEACON_ID) return "gone";   // beacon destroyed: unregister
  const storage = dim.getBlock({ x: w.x, y: w.y + 1, z: w.z })?.getComponent("minecraft:inventory")?.container;
  if (!storage) { notify(w.o, "§e[WORKER] §fPlace a chest directly above the beacon."); return "ok"; }
  if (getVault() < WAGE) { notify(w.o, "§e[WORKER] §fVault is empty - deposit coins in the ledger."); return "ok"; }

  let crops = 0, mined = 0;
  for (let dy = -1; dy <= 1 && crops < 16; dy++)
    for (let dx = -CROP_RADIUS; dx <= CROP_RADIUS && crops < 16; dx++)
      for (let dz = -CROP_RADIUS; dz <= CROP_RADIUS && crops < 16; dz++) {
        const b = dim.getBlock({ x: w.x + dx, y: w.y + dy, z: w.z + dz });
        const yields = b && CROPS[b.typeId];
        if (!yields || b.permutation.getState("growth") !== 7) continue;
        for (const [id, n] of yields) stash(storage, dim, base.location, id, n);
        b.setPermutation(BlockPermutation.resolve(b.typeId, { growth: 0 }));
        crops++;
      }

  if (Math.abs(w.x - ORIGIN.x) <= MINE_RANGE && Math.abs(w.z - ORIGIN.z) <= MINE_RANGE && Math.abs(w.y - ORIGIN.y) <= 6) {
    const core = dim.getBlock(ORIGIN);
    if (core && core.typeId !== "minecraft:air") {
      const item = core.getItemStack(1);
      if (item) stash(storage, dim, base.location, item.typeId, 1);
      countCoreBreak();
      regenerateOrigin(dim);
      mined = 1;
    }
  }

  if (crops + mined > 0) {
    spendVault(WAGE);
    notify(w.o, `§a[WORKER] §fHarvested ${crops}, mined ${mined} §7(-${WAGE} vault)`);
  }
  return "ok";
}

export function initWorkers() {
  world.afterEvents.playerPlaceBlock.subscribe((ev) => {
    const { player, block } = ev;
    if (block.typeId !== BEACON_ID) return;
    const { x, y, z } = block.location;
    // Outside the permit: the zoning guard removes the block, so don't register it.
    if (!player.hasTag("sv_zoning_bypass") && !isInside(getRadius(player), x, z)) return;
    const list = load();
    if (list.filter((w) => w.o === player.id).length >= MAX_PER_PLAYER) {
      block.setType("minecraft:air");
      try { player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(BEACON_ID, 1)); } catch { /* ignore */ }
      player.sendMessage(`§c[WORKER] §fLimit reached (${MAX_PER_PLAYER} beacons).`);
      return;
    }
    list.push({ x, y, z, o: player.id });
    save(list);
    player.sendMessage("§a[WORKER] §fBeacon active. Put a chest on top of it and fund the vault.");
  });

  world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (ev.brokenBlockPermutation.type.id !== BEACON_ID) return;
    const { x, y, z } = ev.block.location;
    save(load().filter((w) => !(w.x === x && w.y === y && w.z === z)));
  });

  system.runInterval(() => {
    if (world.getAllPlayers().length === 0) return;
    const dim = world.getDimension("overworld");
    const list = load();
    const keep = [];
    for (const w of list) {
      let r = "skip";
      try { r = runWorker(w, dim); } catch { r = "skip"; }
      if (r !== "gone") keep.push(w);
    }
    if (keep.length !== list.length) save(keep);
  }, CYCLE_TICKS);
}
