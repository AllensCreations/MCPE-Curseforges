import { world, system } from "@minecraft/server";
import { LEDGER_ID } from "./lib/config.js";
import { setupLobby, teleportToLobby } from "./lib/lobby.js";
import { hasIsland, returnToIsland } from "./lib/claim.js";
import { promptWelcome } from "./lib/welcome.js";
import { startOneBlock } from "./lib/oneblock.js";
import { openLedger } from "./lib/ledger.js";
import { collectPayout, payoutSummary } from "./lib/market.js";
import { later } from "./lib/util.js";

const joining = new Set();

function readyPlayer(player) {
  if (!hasIsland(player)) {
    teleportToLobby(player);
    later(() => promptWelcome(player), 20);
    return;
  }
  returnToIsland(player);
  if (payoutSummary(player.id).length > 0) {
    later(() => {
      const total = collectPayout(player);
      if (total > 0) player.sendMessage(`§6[ALN] §aWhile you were away, ${total} items from your sales were delivered.`);
    }, 40);
  }
}

world.afterEvents.playerJoin.subscribe((event) => {
  joining.add(event.playerId);
});

world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (event.initialSpawn) {
    joining.delete(player.id);
    readyPlayer(player);
    return;
  }
  if (!hasIsland(player)) {
    teleportToLobby(player);
    later(() => promptWelcome(player), 20);
  }
});

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack?.typeId !== LEDGER_ID) return;
  const player = event.source;
  system.run(() => {
    openLedger(player);
  });
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "aln:menu") return;
  const player = event.sourceEntity;
  if (player && player.typeId === "minecraft:player") promptWelcome(player);
});

world.afterEvents.worldLoad.subscribe(() => {
  setupLobby();
  startOneBlock();
  for (const player of world.getAllPlayers()) {
    if (!joining.has(player.id)) readyPlayer(player);
  }
});
