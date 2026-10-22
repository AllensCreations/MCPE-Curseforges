// ledger_ui.js - Sovereign Ledger (custom:sovereign_ledger) menus.
import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import {
  getBalance, spendCoins, addVault, getVault, previewSale, sellInventory,
  getMarketView, prettyName,
} from "./economy.js";
import { PERMITS, getPermitLevel, setPermitLevel } from "./zoning.js";
import { BEACON_ID, WAGE, MAX_PER_PLAYER, countOwned } from "./workers.js";

export const LEDGER_ID = "custom:sovereign_ledger";
const BEACON_COST = 100;
const TITLE = "§6[ SOVEREIGN MARKET LEDGER ]";
const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);
const sleep = (t) => new Promise((r) => system.runTimeout(r, t));

// Show a form; retry while the player's screen is busy (e.g. chat/inventory open).
async function show(player, form) {
  for (let i = 0; i < 20; i++) {
    const res = await form.show(player);
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) { await sleep(10); continue; }
    return res;
  }
  return { canceled: true };
}

async function sellFlow(player) {
  const pv = previewSale(player);
  if (pv.count === 0) { player.sendMessage("§6[Market] §7You have nothing the market buys."); return; }
  const lines = pv.lines.slice(0, 12).map((l) => `§f${l.amount}x ${prettyName(l.id)} §7= §e${fmt(l.value)}`);
  if (pv.lines.length > 12) lines.push(`§7...and ${pv.lines.length - 12} more`);
  const res = await show(player, new ActionFormData().title("§6Confirm Sale")
    .body(`${lines.join("\n")}\n\n§aTotal: §6${fmt(pv.total)} coins`)
    .button("§2Sell All").button("§cCancel"));
  if (res.canceled || res.selection !== 0) return;
  const done = sellInventory(player); // re-scans the inventory, so it is safe if it changed
  player.sendMessage(`§6[Market] §fSold ${done.count} items for §6${fmt(done.total)} coins§f.`);
}

async function permitFlow(player) {
  const lvl = getPermitLevel(player);
  const next = PERMITS[lvl + 1];
  if (!next) {
    await show(player, new ActionFormData().title("§6Island Permits")
      .body(`§aMaximum permit owned. Radius: ${PERMITS[lvl].radius} blocks.`).button("Back"));
    return;
  }
  const res = await show(player, new ActionFormData().title("§6Island Permits")
    .body(`Current radius: §e${PERMITS[lvl].radius}\n§fNext radius: §a${next.radius}\n§fCost: §6${next.cost} coins\n§fBalance: §6${fmt(getBalance(player))}`)
    .button(`§2Buy permit (radius ${next.radius})`).button("Back"));
  if (res.canceled || res.selection !== 0) return;
  if (!spendCoins(player, next.cost)) { player.sendMessage("§c[Market] Not enough coins."); return; }
  setPermitLevel(player, lvl + 1);
  player.sendMessage(`§a[Market] Permit purchased! Build radius is now ${next.radius}.`);
}

async function hireFlow(player) {
  const res = await show(player, new ActionFormData().title("§6Hire Workers")
    .body(`§fVault: §6${fmt(getVault())} §7(wage ${WAGE}/work cycle)\n§fYour beacons: §e${countOwned(player.id)}/${MAX_PER_PLAYER}\n§fBalance: §6${fmt(getBalance(player))}`)
    .button(`Buy Worker Beacon (${BEACON_COST})`).button("Deposit 50 to Vault")
    .button("Deposit 500 to Vault").button("Deposit All to Vault").button("Back"));
  if (res.canceled) return;
  switch (res.selection) {
    case 0:
      if (!spendCoins(player, BEACON_COST)) { player.sendMessage("§c[Market] Not enough coins."); return; }
      {
        const left = player.getComponent("minecraft:inventory").container.addItem(new ItemStack(BEACON_ID, 1));
        if (left) player.dimension.spawnItem(left, player.location);
      }
      player.sendMessage("§a[Market] Worker Beacon purchased. Place it, put a chest on top.");
      break;
    case 1: case 2: {
      const amt = res.selection === 1 ? 50 : 500;
      if (!spendCoins(player, amt)) { player.sendMessage("§c[Market] Not enough coins."); return; }
      addVault(amt); player.sendMessage(`§a[Market] Deposited ${amt} coins.`); break;
    }
    case 3: {
      const amt = Math.floor(getBalance(player));
      if (amt < 1 || !spendCoins(player, amt)) { player.sendMessage("§c[Market] Nothing to deposit."); return; }
      addVault(amt); player.sendMessage(`§a[Market] Deposited ${amt} coins.`); break;
    }
  }
}

async function trendsFlow(player) {
  const rows = getMarketView().map((r) => {
    const arrow = r.change > 0.002 ? "§a↑" : r.change < -0.002 ? "§c↓" : "§7→";
    return `§f${prettyName(r.id)} §e${fmt(r.price)} ${arrow} §7${Math.round(r.x * 100)}%`;
  });
  await show(player, new ActionFormData().title("§6Market Stock Trends")
    .body(`§7Prices fall when you sell and recover over time.\n\n${rows.join("\n")}`).button("Back"));
}

export async function openLedger(player) {
  try {
    while (true) {
      const res = await show(player, new ActionFormData().title(TITLE)
        .body(`§fCoins: §6${fmt(getBalance(player))}\n§fPermit radius: §a${PERMITS[getPermitLevel(player)].radius}\n§fVault: §6${fmt(getVault())}`)
        .button("Sell Inventory Contents").button("Buy Island Expansion Permits")
        .button("Hire Worker NPCs").button("View Market Stock Trends"));
      if (res.canceled) return;
      if (res.selection === 0) await sellFlow(player);
      else if (res.selection === 1) await permitFlow(player);
      else if (res.selection === 2) await hireFlow(player);
      else if (res.selection === 3) await trendsFlow(player);
    }
  } catch (e) { console.warn(`[Sovereign Market] ledger error: ${e}`); }
}

export function initLedger() {
  world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack?.typeId === LEDGER_ID) openLedger(ev.source);
  });
}
