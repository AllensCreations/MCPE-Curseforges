// workers.js - Worker Beacons. Each beacon has a type (Farmer / Miner / Lumberjack) and works the chest
// above it on its own timer. Wages come from the owner's vault (team vault if in a team).
import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";
import { ORIGIN, spendVault, getVault, regenerateOrigin, countCoreBreak, sellContainer } from "./economy.js";
import { getRadius, isInside } from "./zoning.js";

export const BEACON_ID = "custom:worker_beacon";
export const WAGE = 2;              // base coins per productive work cycle (+1 per upgrade level)
export const MAX_PER_PLAYER = 5;
const MINE_RANGE = 5;
const AUTOSELL_RATE = 0.8;          // Auto-Sell pays 80% (20% fee)

export const TYPES = {
  farmer: { label: "Farmer", text: "harvests mature crops" },
  miner: { label: "Miner", text: "mines the OneBlock when within 5 blocks" },
  lumberjack: { label: "Lumberjack", text: "chops logs in range" },
};

// Upgrades apply to all of an owner's beacons. Level n needs world phase index >= n + 1.
export const UPGRADES = {
  speed: { label: "Work Speed", costs: [150, 500, 1500], values: [1200, 900, 600, 400], fmt: (v) => `every ${v / 20}s` },
  range: { label: "Work Range", costs: [100, 400, 1200], values: [4, 6, 8, 10], fmt: (v) => `${v} blocks` },
  yield: { label: "Yield", costs: [250, 1000], values: [1, 2, 3], fmt: (v) => `x${v}` },
  autosell: { label: "Auto-Sell", costs: [400], values: [0, 1], fmt: (v) => (v ? "on (20% fee)" : "off") },
};
export const upgradePhaseNeeded = (newLevel) => newLevel + 1;

const CROPS = {
  "minecraft:wheat": [["minecraft:wheat", 1], ["minecraft:wheat_seeds", 1]],
  "minecraft:carrots": [["minecraft:carrot", 2]],
  "minecraft:potatoes": [["minecraft:potato", 2]],
  "minecraft:beetroot": [["minecraft:beetroot", 1], ["minecraft:beetroot_seeds", 1]],
};

const parse = (key, fallback) => {
  const raw = world.getDynamicProperty(key);
  if (typeof raw !== "string") return fallback;
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : fallback; } catch { return fallback; }
};
const load = () => { const a = parse("sv_workers", []); return Array.isArray(a) ? a : []; };
const save = (a) => world.setDynamicProperty("sv_workers", JSON.stringify(a));
export const countOwned = (ownerId) => load().filter((w) => w.o === ownerId).length;
export const listOwned = (ownerId) => load().filter((w) => w.o === ownerId).map((w) => ({ x: w.x, y: w.y, z: w.z, t: w.t ?? "farmer" }));
export function setWorkerType(ownerId, x, y, z, type) {
  if (!TYPES[type]) return;
  const list = load();
  const w = list.find((q) => q.o === ownerId && q.x === x && q.y === y && q.z === z);
  if (w) { w.t = type; save(list); }
}

export const getUpgradeLevel = (ownerId, key) => parse("sv_wupg", {})[ownerId]?.[key] ?? 0;
export function setUpgradeLevel(ownerId, key, level) {
  const all = parse("sv_wupg", {});
  all[ownerId] = { ...(all[ownerId] ?? {}), [key]: level };
  world.setDynamicProperty("sv_wupg", JSON.stringify(all));
}
export function resetUpgrades(ownerId) {
  const all = parse("sv_wupg", {});
  delete all[ownerId];
  world.setDynamicProperty("sv_wupg", JSON.stringify(all));
}
export const wageFor = (ownerId) => WAGE + Object.keys(UPGRADES).reduce((s, k) => s + getUpgradeLevel(ownerId, k), 0);
const cycleTicks = (ownerId) => UPGRADES.speed.values[getUpgradeLevel(ownerId, "speed")];

const findPlayer = (id) => world.getAllPlayers().find((p) => p.id === id);
function notify(ownerId, msg) { findPlayer(ownerId)?.onScreenDisplay.setActionBar(msg); }
function stash(container, dim, loc, id, amount) {
  const left = container.addItem(new ItemStack(id, amount));
  if (left) dim.spawnItem(left, { x: loc.x + 0.5, y: loc.y + 1.5, z: loc.z + 0.5 });
}

function runWorker(w, dim) {
  const base = dim.getBlock({ x: w.x, y: w.y, z: w.z });
  if (!base) return "skip";                       // unloaded chunk: retry next cycle
  if (base.typeId !== BEACON_ID) return "gone";   // beacon destroyed: unregister
  const storage = dim.getBlock({ x: w.x, y: w.y + 1, z: w.z })?.getComponent("minecraft:inventory")?.container;
  if (!storage) { notify(w.o, "§e[WORKER] §fPlace a chest directly above the beacon."); return "ok"; }

  const type = w.t ?? "farmer";
  const wage = wageFor(w.o);
  let msg = "";
  if (getVault(w.o) < wage) {
    notify(w.o, "§e[WORKER] §fVault is empty - deposit coins in the ledger.");
  } else {
    const r = UPGRADES.range.values[getUpgradeLevel(w.o, "range")];
    const mult = UPGRADES.yield.values[getUpgradeLevel(w.o, "yield")];
    let done = 0;
    if (type === "farmer") {
      for (let dy = -1; dy <= 1 && done < 16; dy++)
        for (let dx = -r; dx <= r && done < 16; dx++)
          for (let dz = -r; dz <= r && done < 16; dz++) {
            const b = dim.getBlock({ x: w.x + dx, y: w.y + dy, z: w.z + dz });
            const yields = b && CROPS[b.typeId];
            if (!yields || b.permutation.getState("growth") !== 7) continue;
            for (const [id, n] of yields) stash(storage, dim, base.location, id, n * mult);
            b.setPermutation(BlockPermutation.resolve(b.typeId, { growth: 0 }));
            done++;
          }
      msg = `harvested ${done}`;
    } else if (type === "lumberjack") {
      for (let dy = 0; dy <= 6 && done < 16; dy++)
        for (let dx = -r; dx <= r && done < 16; dx++)
          for (let dz = -r; dz <= r && done < 16; dz++) {
            const b = dim.getBlock({ x: w.x + dx, y: w.y + dy, z: w.z + dz });
            if (!b || !b.typeId.endsWith("_log")) continue;
            const id = b.typeId;
            b.setType("minecraft:air");
            stash(storage, dim, base.location, id, mult);
            done++;
          }
      msg = `chopped ${done}`;
    } else if (Math.abs(w.x - ORIGIN.x) <= MINE_RANGE && Math.abs(w.z - ORIGIN.z) <= MINE_RANGE && Math.abs(w.y - ORIGIN.y) <= 6) {
      const core = dim.getBlock(ORIGIN);
      if (core && core.typeId !== "minecraft:air") {
        const item = core.getItemStack(1);
        if (item) stash(storage, dim, base.location, item.typeId, mult);
        countCoreBreak();
        regenerateOrigin(dim);
        done = 1;
      }
      msg = `mined ${done}`;
    }
    if (done > 0) { spendVault(w.o, wage); msg = `§a[WORKER] §f${TYPES[type].label} ${msg} §7(-${wage} vault)`; notify(w.o, msg); }
  }

  // Auto-Sell: convert the chest contents to coins for the owner (needs the owner online).
  if (getUpgradeLevel(w.o, "autosell") > 0) {
    const owner = findPlayer(w.o);
    if (owner) {
      const s = sellContainer(storage, owner, AUTOSELL_RATE);
      if (s.count > 0) notify(w.o, `§6[AUTO-SELL] §fSold ${s.count} items for ${s.total.toFixed(2)} coins`);
    }
  }
  return "ok";
}

export function initWorkers() {
  world.afterEvents.playerPlaceBlock.subscribe((ev) => {
    const { player, block } = ev;
    if (block.typeId !== BEACON_ID) return;
    const { x, y, z } = block.location;
    if (!player.hasTag("sv_zoning_bypass") && !isInside(getRadius(player), x, z)) return; // zoning removes it
    const list = load();
    if (list.filter((w) => w.o === player.id).length >= MAX_PER_PLAYER) {
      block.setType("minecraft:air");
      try { player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(BEACON_ID, 1)); } catch { /* ignore */ }
      player.sendMessage(`§c[WORKER] §fLimit reached (${MAX_PER_PLAYER} beacons).`);
      return;
    }
    list.push({ x, y, z, o: player.id, t: "farmer" });
    save(list);
    player.sendMessage("§a[WORKER] §fBeacon active (Farmer). Put a chest on top and set its type in the ledger.");
  });

  world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (ev.brokenBlockPermutation.type.id !== BEACON_ID) return;
    const { x, y, z } = ev.block.location;
    save(load().filter((w) => !(w.x === x && w.y === y && w.z === z)));
  });

  // Every second: run each beacon whose own timer (set by Work Speed) is due.
  const lastRun = new Map();
  system.runInterval(() => {
    if (world.getAllPlayers().length === 0) return;
    const now = system.currentTick;
    const dim = world.getDimension("overworld");
    const list = load();
    const keep = [];
    for (const w of list) {
      const key = `${w.x},${w.y},${w.z}`;
      if (!lastRun.has(key)) lastRun.set(key, now);
      let result = "ok";
      if (now - lastRun.get(key) >= cycleTicks(w.o)) {
        lastRun.set(key, now);
        try { result = runWorker(w, dim); } catch { result = "skip"; }
      }
      if (result === "gone") lastRun.delete(key); else keep.push(w);
    }
    if (keep.length !== list.length) save(keep);
  }, 20);
}
