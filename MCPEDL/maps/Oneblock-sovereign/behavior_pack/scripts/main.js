// main.js - One-Block: Sovereign Market by AllensCreations (entry point).
import { world, system, ItemStack } from "@minecraft/server";
import { initEconomy } from "./economy.js";
import { initZoning } from "./zoning.js";
import { initWorkers } from "./workers.js";
import { initLedger, LEDGER_ID } from "./ledger_ui.js";

initEconomy();
initZoning();
initWorkers();
initLedger();

function giveLedger(player) {
  const left = player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(LEDGER_ID, 1));
  if (left) player.dimension.spawnItem(left, player.location);
}

// Give each player a ledger once (after void_cleaner has tagged them).
system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    if (p.hasTag("void_cleaned") && p.getDynamicProperty("sv_ledger") !== true) {
      giveLedger(p);
      p.setDynamicProperty("sv_ledger", true);
    }
  }
}, 40);

// Restore a missing ledger when a returning player joins.
function hasLedger(player) {
  const c = player.getComponent("minecraft:inventory")?.container;
  if (!c) return true;
  for (let i = 0; i < c.size; i++) if (c.getItem(i)?.typeId === LEDGER_ID) return true;
  return false;
}
world.afterEvents.playerSpawn.subscribe((ev) => {
  if (ev.initialSpawn && ev.player.getDynamicProperty("sv_ledger") === true && !hasLedger(ev.player)) giveLedger(ev.player);
});

// Lost your ledger?  /scriptevent sv:ledger
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (ev.id === "sv:ledger" && ev.sourceEntity?.typeId === "minecraft:player") giveLedger(ev.sourceEntity);
});
