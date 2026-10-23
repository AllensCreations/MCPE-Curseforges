import { world, system } from "@minecraft/server";
import { LEDGER_ID, DIRT_REWARD, CORE } from "./config.js";
import { inBounds, loadWorld, ITEMS, snapshot, loadPlayer, savePlayer } from "./store.js";
import { core, isCore, isFoundation, regenerate, coreWatch, credit, contractTick, ensureLedger, auditLoot, sweepLiquids, grantAch } from "./game.js";
import { openLedger } from "./ui.js";

// Each subscription is isolated so one unsupported event cannot stop the rest of the add-on.
function on(label, fn) {
  try { fn(); } catch (e) { console.warn("[SovereignMarket] could not subscribe " + label + ": " + e); }
}

const lastWarn = new Map();
const PLOT_MSG = "Plot not owned. You can only build inside your island area. Buy the next permit at the Trader's Ledger.";
const warn = (p, msg) => {
  const t = Date.now();
  if (t - (lastWarn.get(p.id) || 0) < 1500) return;
  lastWarn.set(p.id, t);
  system.run(() => {
    try {
      p.onScreenDisplay.setTitle("\u00a7cPlot not owned", { subtitle: "Buy the next permit at the Trader's Ledger", fadeInDuration: 4, stayDuration: 50, fadeOutDuration: 10 });
      p.sendMessage("\u00a7c" + msg);
    } catch (e) { /* ignore */ }
  });
};

on("itemUse", () => world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack && ev.itemStack.typeId === LEDGER_ID) openLedger(ev.source);
}));

on("playerBreakBlock (after)", () => world.afterEvents.playerBreakBlock.subscribe((ev) => {
  if (!isCore(ev.block) || !core.armed) return;
  core.armed = false;
  core.pending = true;
  const player = ev.player;
  if (ev.brokenBlockPermutation.type.id === "minecraft:dirt") credit(player, DIRT_REWARD, "OneBlock Dirt");
  if (/diamond_ore$/.test(ev.brokenBlockPermutation.type.id)) {
    const dd = loadPlayer(player);
    grantAch(player, dd, "first_diamond");
    savePlayer(player, dd);
  }
  system.run(() => { if (!regenerate(player)) core.pending = false; });
}));

on("playerBreakBlock (before)", () => world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  const b = ev.block;
  if (isFoundation(b)) { ev.cancel = true; return; }
  if (b.dimension.id === "minecraft:overworld" && !inBounds(b.x, b.z)) { ev.cancel = true; warn(ev.player, PLOT_MSG); }
}));

on("playerPlaceBlock (before)", () => world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
  const b = ev.block;
  if (b.dimension.id !== "minecraft:overworld") return;
  if (isCore(b) || isFoundation(b)) { ev.cancel = true; return; }
  if (!inBounds(b.x, b.z)) { ev.cancel = true; warn(ev.player, PLOT_MSG); }
}));

on("playerInteractWithBlock (before)", () => world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  const b = ev.block;
  if (b.dimension.id === "minecraft:overworld" && !inBounds(b.x, b.z)) ev.cancel = true;
}));

on("playerSpawn", () => world.afterEvents.playerSpawn.subscribe((ev) => {
  const p = ev.player;
  system.runTimeout(() => { try { ensureLedger(p); } catch (e) { /* player left */ } }, 40);
}));

system.runInterval(() => { try { coreWatch(); } catch (e) { console.warn("[SovereignMarket] watch: " + e); } }, 20);
system.runInterval(() => { try { contractTick(); } catch (e) { console.warn("[SovereignMarket] contracts: " + e); } }, 200);

// Admin market report: /scriptevent osm:market (sender needs the osm_admin tag: /tag @s add osm_admin)
on("scriptEvent", () => system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id !== "osm:market") return;
  const p = ev.sourceEntity;
  if (!p || p.typeId !== "minecraft:player" || !p.hasTag("osm_admin")) return;
  const w = loadWorld();
  for (const id of ITEMS.keys()) {
    const s = snapshot(w, id);
    p.sendMessage(id.replace("minecraft:", "") + "  price " + (Math.round(s.price * 10) / 10) + "  supply " + s.supply + "  demand " + s.demand + "  " + s.dir);
  }
}));

system.runTimeout(() => { try { auditLoot(); } catch (e) { console.warn("[SovereignMarket] audit: " + e); } }, 40);
system.runInterval(() => { try { sweepLiquids(); } catch (e) { console.warn("[SovereignMarket] liquid sweep: " + e); } }, 600);
