import { world, system } from "@minecraft/server";
import { LEDGER_ID, CORE } from "./config.js";
import { inBounds, loadWorld, ITEMS, snapshot, loadPlayer, savePlayer } from "./store.js";
import { core, isCore, isFoundation, regenerate, coreWatch, onHandBreak, tutorialDone, contractTick, ensureLedger, auditLoot, sweepLiquids, grantAch, clearDroppedLedgers, autoMineTick } from "./game.js";
import { openLedger, runTutorial } from "./ui.js";

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

// Mandatory How to Play guide: until it is finished the player cannot move, build, break or open the Ledger.
const tutLocked = new Set();
const tutSession = new Set();
const unlocked = new Set();
function setMove(p, enabled) {
  try { p.runCommand("inputpermission set @s movement " + (enabled ? "enabled" : "disabled")); } catch (e) { /* command unavailable */ }
}

on("itemUse", () => world.afterEvents.itemUse.subscribe((ev) => {
  if (tutLocked.has(ev.source.id)) return;
  if (ev.itemStack && ev.itemStack.typeId === LEDGER_ID) openLedger(ev.source);
}));

on("playerBreakBlock (after)", () => world.afterEvents.playerBreakBlock.subscribe((ev) => {
  if (!isCore(ev.block) || !core.armed) return;
  core.armed = false;
  core.pending = true;
  const player = ev.player;
  try {
    onHandBreak(player, ev.brokenBlockPermutation.type.id);
    if (/diamond_ore$/.test(ev.brokenBlockPermutation.type.id)) {
      const dd = loadPlayer(player);
      grantAch(player, dd, "first_diamond");
      savePlayer(player, dd);
    }
  } catch (e) { console.warn("[SovereignMarket] break reward: " + e); }
  system.run(() => {
    let ok = false;
    try { ok = regenerate(player); } catch (e) { console.warn("[SovereignMarket] regenerate: " + e); }
    if (!ok) core.pending = false;
  });
}));

on("playerBreakBlock (before)", () => world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  if (tutLocked.has(ev.player.id)) { ev.cancel = true; return; }
  const b = ev.block;
  if (isFoundation(b)) { ev.cancel = true; return; }
  if (b.dimension.id === "minecraft:overworld" && !inBounds(b.x, b.z)) { ev.cancel = true; warn(ev.player, PLOT_MSG); }
}));

on("playerPlaceBlock (before)", () => world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
  if (tutLocked.has(ev.player.id)) { ev.cancel = true; return; }
  const b = ev.block;
  if (b.dimension.id !== "minecraft:overworld") return;
  if (isCore(b) || isFoundation(b)) { ev.cancel = true; return; }
  if (!inBounds(b.x, b.z)) { ev.cancel = true; warn(ev.player, PLOT_MSG); }
}));

const FACE = { Up: [0, 1, 0], Down: [0, -1, 0], North: [0, 0, -1], South: [0, 0, 1], East: [1, 0, 0], West: [-1, 0, 0] };
const EDGE_ITEMS = /bucket$|flint_and_steel$|fire_charge$|spawn_egg$|_boat$|_raft$|minecart$|armor_stand$|end_crystal$|item_frame$|painting$/;

on("playerInteractWithBlock (before)", () => world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  if (tutLocked.has(ev.player.id)) { ev.cancel = true; return; }
  const b = ev.block;
  if (b.dimension.id !== "minecraft:overworld") return;
  if (!inBounds(b.x, b.z)) { ev.cancel = true; return; }
  // Buckets, boats, minecarts, fire and similar items act on the far side of the clicked face, so check that target too.
  const id = ev.itemStack && ev.itemStack.typeId;
  const f = FACE[String(ev.blockFace)];
  if (id && EDGE_ITEMS.test(id) && f && !inBounds(b.x + f[0], b.z + f[2])) { ev.cancel = true; warn(ev.player, PLOT_MSG); }
}));

// Backup enforcement. If a "before" event is missing or misses a case, the block is undone right after it happens.
on("playerPlaceBlock (after, plot guard)", () => world.afterEvents.playerPlaceBlock.subscribe((ev) => {
  const b = ev.block;
  if (b.dimension.id !== "minecraft:overworld" || inBounds(b.x, b.z)) return;
  const player = ev.player;
  system.run(() => {
    try {
      const stack = b.getItemStack(1, true);
      b.setType("minecraft:air");
      const gm = String(player.getGameMode()).toLowerCase();
      if (stack && (gm === "survival" || gm === "adventure")) player.getComponent("minecraft:inventory").container.addItem(stack);
    } catch (e) { /* ignore */ }
    warn(player, PLOT_MSG);
  });
}));

on("playerBreakBlock (after, plot guard)", () => world.afterEvents.playerBreakBlock.subscribe((ev) => {
  const b = ev.block;
  if (b.dimension.id !== "minecraft:overworld" || inBounds(b.x, b.z)) return;
  const perm = ev.brokenBlockPermutation;
  system.run(() => {
    try {
      b.setPermutation(perm);
      for (const e of b.dimension.getEntities({ type: "minecraft:item", location: { x: b.x + 0.5, y: b.y + 0.5, z: b.z + 0.5 }, maxDistance: 2 })) e.remove();
    } catch (e) { /* ignore */ }
    warn(ev.player, PLOT_MSG);
  });
}));

// Explosions cannot remove the OneBlock, the collection chest above it or the foundation Bedrock.
on("explosion (before)", () => world.beforeEvents.explosion.subscribe((ev) => {
  try {
    const all = ev.getImpactedBlocks();
    const keep = all.filter((b) => !(b.dimension.id === "minecraft:overworld" && b.x === CORE.x && b.z === CORE.z && b.y >= CORE.y - 1 && b.y <= CORE.y + 1));
    if (keep.length !== all.length) ev.setImpactedBlocks(keep);
  } catch (e) { /* ignore */ }
}));

on("playerSpawn", () => world.afterEvents.playerSpawn.subscribe((ev) => {
  const p = ev.player;
  system.runTimeout(() => { try { ensureLedger(p); } catch (e) { /* player left */ } }, 40);
}));

// Opens the mandatory guide for anyone who has not finished it, and frees players who have.
// Operators can skip it for a player with: /tag <player> add tutorial_done
system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    try {
      if (!p.hasTag("void_cleaned")) continue; // starter island not built yet
      if (tutorialDone(p, loadPlayer(p))) {
        tutLocked.delete(p.id);
        if (!unlocked.has(p.id)) { setMove(p, true); unlocked.add(p.id); }
        continue;
      }
      if (tutSession.has(p.id)) continue;
      tutSession.add(p.id);
      tutLocked.add(p.id);
      unlocked.delete(p.id);
      setMove(p, false);
      runTutorial(p).catch((e) => console.warn("[SovereignMarket] tutorial: " + e)).finally(() => tutSession.delete(p.id));
    } catch (e) { /* player left */ }
  }
}, 20);

on("playerLeave", () => world.afterEvents.playerLeave.subscribe((ev) => {
  tutLocked.delete(ev.playerId);
  tutSession.delete(ev.playerId);
  unlocked.delete(ev.playerId);
  lastWarn.delete(ev.playerId);
}));

system.runInterval(() => { try { coreWatch(); } catch (e) { console.warn("[SovereignMarket] watch: " + e); } }, 20);
system.runInterval(() => { try { autoMineTick(); } catch (e) { console.warn("[SovereignMarket] auto-mine: " + e); } }, 1);
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

// Keep the Trader's Ledger in hotbar slot 9 at all times, and return it if it is thrown away.
system.runInterval(() => {
  for (const p of world.getAllPlayers()) { try { ensureLedger(p); } catch (e) { /* player left */ } }
}, 10);
system.runInterval(() => {
  for (const p of world.getAllPlayers()) clearDroppedLedgers(p);
}, 40);
