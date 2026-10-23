// ledger_ui.js - Sovereign Ledger (allenscreations:trader_ledger) menus.
import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import {
  getBalance, spendCoins, addVault, getVault, listSellable, countOf, sellItem, heldItemId, sellPrice,
  SELL_AMOUNTS, getMarketView, getActiveEvent, getPhaseInfo, getRankInfo, PHASES, prettyName,
} from "./economy.js";
import { PERMITS, getPermitLevel, setPermitLevel } from "./zoning.js";
import {
  BEACON_ID, WAGE, MAX_PER_PLAYER, UPGRADES, countOwned, getUpgradeLevel, setUpgradeLevel,
  upgradePhaseNeeded, wageFor,
} from "./workers.js";

export const LEDGER_ID = "allenscreations:trader_ledger";
const BEACON_COST = 100;
const TITLE = "§6[ SOVEREIGN MARKET LEDGER ]";
const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);
const sleep = (t) => new Promise((r) => system.runTimeout(r, t));

// Show a form; retry while the player's screen is busy (chat/inventory open).
async function show(player, form) {
  for (let i = 0; i < 20; i++) {
    const res = await form.show(player);
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) { await sleep(10); continue; }
    return res;
  }
  return { canceled: true };
}

// ---- Selling: pick an item, then 1 / 8 / 16 / 32 / 64 -------------------------------------
async function quantityFlow(player, id) {
  while (true) {
    const owned = countOf(player, id);
    const opts = SELL_AMOUNTS.filter((n) => n <= owned);
    if (opts.length === 0) return;
    const unit = sellPrice(player, id);
    const form = new ActionFormData().title(`§6Sell ${prettyName(id)}`)
      .body(`§fYou have §e${owned}§f. Price: §6${fmt(unit)}§f each.`);
    opts.forEach((n) => form.button(`Sell ${n}  -  ${fmt(unit * n)} coins`));
    form.button("Back");
    const res = await show(player, form);
    if (res.canceled || res.selection === opts.length) return;
    const r = sellItem(player, id, opts[res.selection]);
    if (r.sold > 0) player.sendMessage(`§6[Market] §fSold ${r.sold} ${prettyName(id)} for §6${fmt(r.total)} coins§f.`);
  }
}

async function sellFlow(player, heldOnly) {
  while (true) {
    let items = listSellable(player);
    if (heldOnly) { const h = heldItemId(player); items = items.filter((i) => i.id === h); }
    if (items.length === 0) { player.sendMessage("§6[Market] §7Nothing the market buys is available."); return; }
    const form = new ActionFormData().title(heldOnly ? "§6Sell Held Item" : "§6Sell Inventory")
      .body("Choose an item, then an amount (1, 8, 16, 32 or 64).");
    items.forEach((i) => form.button(`${prettyName(i.id)} x${i.amount}\n§6${fmt(sellPrice(player, i.id))} each`));
    form.button("Back");
    const res = await show(player, form);
    if (res.canceled || res.selection === items.length) return;
    await quantityFlow(player, items[res.selection].id);
  }
}

// ---- Permits (gated by world phase) ----------------------------------------------------------
async function permitFlow(player) {
  const lvl = getPermitLevel(player);
  const next = PERMITS[lvl + 1];
  if (!next) {
    await show(player, new ActionFormData().title("§6Island Permits")
      .body(`§aMaximum permit owned. Radius: ${PERMITS[lvl].radius} blocks.`).button("Back"));
    return;
  }
  const locked = getPhaseInfo().index < next.phase;
  const res = await show(player, new ActionFormData().title("§6Island Permits")
    .body(`Current radius: §e${PERMITS[lvl].radius}\n§fNext radius: §a${next.radius}\n§fCost: §6${next.cost} coins\n§fBalance: §6${fmt(getBalance(player))}${locked ? `\n§cRequires ${PHASES[next.phase].name}` : ""}`)
    .button(locked ? `§8Locked: ${PHASES[next.phase].name}` : `§2Buy permit (radius ${next.radius})`).button("Back"));
  if (res.canceled || res.selection !== 0) return;
  if (locked) { player.sendMessage(`§c[Market] Reach the ${PHASES[next.phase].name} first.`); return; }
  if (!spendCoins(player, next.cost)) { player.sendMessage("§c[Market] Not enough coins."); return; }
  setPermitLevel(player, lvl + 1);
  player.sendMessage(`§a[Market] Permit purchased! Build radius is now ${next.radius}.`);
}

// ---- Workers + upgrades -------------------------------------------------------------------------
async function upgradeFlow(player) {
  const phase = getPhaseInfo().index;
  const keys = Object.keys(UPGRADES);
  const form = new ActionFormData().title("§6Worker Upgrades")
    .body(`§fBalance: §6${fmt(getBalance(player))}\n§7Upgrades apply to all your beacons and raise their wage.`);
  const entries = [];
  for (const k of keys) {
    const u = UPGRADES[k];
    const lvl = getUpgradeLevel(player.id, k);
    if (lvl >= u.costs.length) { form.button(`${u.label}: MAX (${u.fmt(u.values[lvl])})`); entries.push(null); continue; }
    const need = upgradePhaseNeeded(lvl + 1);
    const locked = phase < need;
    form.button(`${u.label}: ${u.fmt(u.values[lvl])} -> ${u.fmt(u.values[lvl + 1])}\n${locked ? `§cLocked: ${PHASES[need].name}` : `§6${u.costs[lvl]} coins`}`);
    entries.push({ k, lvl, locked, need });
  }
  form.button("Back");
  const res = await show(player, form);
  if (res.canceled || res.selection >= keys.length) return;
  const e = entries[res.selection];
  if (!e) return;
  if (e.locked) { player.sendMessage(`§c[Market] Reach the ${PHASES[e.need].name} first.`); return; }
  if (!spendCoins(player, UPGRADES[e.k].costs[e.lvl])) { player.sendMessage("§c[Market] Not enough coins."); return; }
  setUpgradeLevel(player.id, e.k, e.lvl + 1);
  player.sendMessage(`§a[Market] ${UPGRADES[e.k].label} upgraded to level ${e.lvl + 1}.`);
}

async function hireFlow(player) {
  const res = await show(player, new ActionFormData().title("§6Hire Workers")
    .body(`§fVault: §6${fmt(getVault())} §7(your wage ${wageFor(player.id)}/work cycle)\n§fYour beacons: §e${countOwned(player.id)}/${MAX_PER_PLAYER}\n§fBalance: §6${fmt(getBalance(player))}`)
    .button(`Buy Worker Beacon (${BEACON_COST})`).button("Deposit 50 to Vault")
    .button("Deposit 500 to Vault").button("Deposit All to Vault").button("Upgrade Workers").button("Back"));
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
    case 4: await upgradeFlow(player); break;
  }
}

// ---- Trends, events and progression ----------------------------------------------------------------
async function trendsFlow(player) {
  const ev = getActiveEvent();
  const head = ev ? `§d${ev.name}: §f${ev.text} §7(${ev.minsLeft} min left)\n\n` : "§7No market event right now.\n\n";
  const rows = getMarketView().map((r) => {
    const arrow = r.change > 0.002 ? "§a↑" : r.change < -0.002 ? "§c↓" : "§7→";
    return `§f${prettyName(r.id)} §e${fmt(r.price)} ${arrow} §7${Math.round(r.x * 100)}%`;
  });
  await show(player, new ActionFormData().title("§6Market Stock Trends")
    .body(`${head}§7Prices fall when you sell and recover over time.\n\n${rows.join("\n")}`).button("Back"));
}

async function progressFlow(player) {
  const info = getPhaseInfo();
  const rank = getRankInfo(player);
  const list = PHASES.map((p, i) => `${i <= info.index ? "§a[x]" : "§8[ ]"} §f${p.name} §7(${p.min} breaks)`).join("\n");
  const nextPhase = info.nextMin === null ? "§aMax phase reached" : `§7Next: ${info.nextName} at ${info.nextMin} breaks`;
  const nextRank = rank.nextMin === null ? "§aMax rank" : `§7Next: ${rank.nextName} at ${rank.nextMin} coins earned`;
  await show(player, new ActionFormData().title("§6Progression")
    .body(`§fWorld breaks: §e${info.count}\n§fPhase: §e${info.name} §7(+${info.index * 10}% break coins)\n${nextPhase}\n\n§fRank: §e${rank.name} §7(+${rank.index * 5}% coins)\n§fEarned: §6${fmt(rank.earned)}\n${nextRank}\n\n${list}\n\n§7Phases unlock richer blocks, bigger permits and worker upgrades.`)
    .button("Back"));
}

// ---- Main menu ----------------------------------------------------------------------------------------
export async function openLedger(player) {
  try {
    while (true) {
      const info = getPhaseInfo();
      const rank = getRankInfo(player);
      const ev = getActiveEvent();
      const res = await show(player, new ActionFormData().title(TITLE)
        .body(`§fCoins: §6${fmt(getBalance(player))}\n§fPhase: §e${info.name} §7(${info.count}${info.nextMin === null ? "" : "/" + info.nextMin})\n§fRank: §e${rank.name}\n§fPermit radius: §a${PERMITS[getPermitLevel(player)].radius}\n§fVault: §6${fmt(getVault())}${ev ? `\n§dEvent: ${ev.name}` : ""}`)
        .button("Sell Inventory Contents").button("Sell Held Item").button("Buy Island Expansion Permits")
        .button("Hire Worker NPCs").button("View Market Stock Trends").button("Progression"));
      if (res.canceled) return;
      if (res.selection === 0) await sellFlow(player, false);
      else if (res.selection === 1) await sellFlow(player, true);
      else if (res.selection === 2) await permitFlow(player);
      else if (res.selection === 3) await hireFlow(player);
      else if (res.selection === 4) await trendsFlow(player);
      else if (res.selection === 5) await progressFlow(player);
    }
  } catch (e) { console.warn(`[Sovereign Market] ledger error: ${e}`); }
}

export function initLedger() {
  world.afterEvents.itemUse.subscribe((ev) => {
    if (ev.itemStack?.typeId === LEDGER_ID) openLedger(ev.source);
  });
}
