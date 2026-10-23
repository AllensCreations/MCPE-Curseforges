import { world, system } from "@minecraft/server";
import { LEDGER_ID, DIRT_REWARD, CORE } from "./config.js";
import { inBounds } from "./store.js";
import { core, isCore, isFoundation, regenerate, coreWatch, credit, contractTick, ensureLedger } from "./game.js";
import { openLedger } from "./ui.js";

// Each subscription is isolated so one unsupported event cannot stop the rest of the add-on.
function on(label, fn) {
  try { fn(); } catch (e) { console.warn("[SovereignMarket] could not subscribe " + label + ": " + e); }
}

const warn = (p, msg) => system.run(() => { try { p.onScreenDisplay.setActionBar(msg); } catch (e) { /* ignore */ } });

on("itemUse", () => world.afterEvents.itemUse.subscribe((ev) => {
  if (ev.itemStack && ev.itemStack.typeId === LEDGER_ID) openLedger(ev.source);
}));

on("playerBreakBlock (after)", () => world.afterEvents.playerBreakBlock.subscribe((ev) => {
  if (!isCore(ev.block) || !core.armed) return;
  core.armed = false;
  core.pending = true;
  const player = ev.player;
  if (ev.brokenBlockPermutation.type.id === "minecraft:dirt") credit(player, DIRT_REWARD, "OneBlock Dirt");
  system.run(() => { if (!regenerate(player)) core.pending = false; });
}));

on("playerBreakBlock (before)", () => world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  const b = ev.block;
  if (isFoundation(b)) { ev.cancel = true; return; }
  if (b.dimension.id === "minecraft:overworld" && !inBounds(b.x, b.z)) { ev.cancel = true; warn(ev.player, "Outside your permitted island area"); }
}));

on("playerPlaceBlock (before)", () => world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
  const b = ev.block;
  if (b.dimension.id !== "minecraft:overworld") return;
  if (isCore(b) || isFoundation(b)) { ev.cancel = true; return; }
  if (!inBounds(b.x, b.z)) { ev.cancel = true; warn(ev.player, "Outside your permitted island area"); }
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
