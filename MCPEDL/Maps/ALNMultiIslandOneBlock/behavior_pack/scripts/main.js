import { world, system } from "@minecraft/server";
import { LEDGER_ID } from "./lib/config.js";
import { setupLobby, teleportToLobby } from "./lib/lobby.js";
import { hasIsland, returnToIsland } from "./lib/claim.js";
import { promptWelcome, startWelcomeGuard } from "./lib/welcome.js";
import { startOneBlock } from "./lib/oneblock.js";
import { openLedger } from "./lib/ledger.js";
import { startLedgerKeeper, ensureLedger } from "./lib/keeper.js";
import { startCoinBoard } from "./lib/board.js";
import { collectPayout, payoutSummary, takeEarned } from "./lib/market.js";
import { later } from "./lib/util.js";

const joining = new Set();

function readyPlayer(player) {
  if (!hasIsland(player)) {
    teleportToLobby(player);
    later(() => promptWelcome(player), 20);
    return;
  }
  returnToIsland(player);
  later(() => {
    const earned = takeEarned(player.id);
    if (earned > 0) player.sendMessage(`§6[ALN] §aWhile you were away you earned ${earned} ALN Coins from your sales.`);
  }, 60);
  if (payoutSummary(player.id).length > 0) {
    later(() => {
      const total = collectPayout(player);
      if (total > 0) player.sendMessage(`§6[ALN] §aWhile you were away, ${total} items returned from your old offers were delivered.`);
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
    return;
  }
  const id = player.id;
  later(() => ensureLedger(id), 20);
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
  startLedgerKeeper();
  startCoinBoard();
  startWelcomeGuard();
  for (const player of world.getAllPlayers()) {
    if (!joining.has(player.id)) readyPlayer(player);
  }
});
