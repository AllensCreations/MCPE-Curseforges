import { system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { CURRENCY, LICENSES, ISLAND_LEVELS, CONTRACTS, CATS, DIRT_REWARD, nice, ACHIEVEMENTS, UPGRADE_MAX } from "./config.js";
import { loadPlayer, loadWorld, hasLic, islandLevel, highestTier, ITEMS, quote, snapshot, demandState } from "./store.js";
import { inventoryCounts, sell, buyLicense, buyIsland, buyContract, cancelContract, upgradeContract, upgradeCost, intervalFor, autoMineStatus, buyAutoMine } from "./game.js";

const wait = (t) => new Promise((r) => system.runTimeout(r, t));
const busy = new Set();
const fmt = (n) => (Math.round(n * 10) / 10).toString();

async function show(p, form) {
  for (let i = 0; i < 15; i++) {
    const r = await form.show(p);
    if (r.canceled && r.cancelationReason === "UserBusy") { await wait(20); continue; }
    return r;
  }
  return { canceled: true };
}

async function note(p, title, body) {
  await show(p, new ActionFormData().title(title).body(body).button("Back"));
}

async function confirm(p, title, body, yes) {
  const r = await show(p, new ActionFormData().title(title).body(body).button(yes).button("Cancel"));
  return !r.canceled && r.selection === 0;
}

export async function openLedger(p) {
  if (busy.has(p.id)) return;
  busy.add(p.id);
  try { await mainMenu(p); } catch (e) { console.warn("[SovereignMarket] ledger error: " + e); } finally { busy.delete(p.id); }
}

async function mainMenu(p) {
  for (;;) {
    const d = loadPlayer(p);
    const L = ISLAND_LEVELS[islandLevel()];
    const next = ISLAND_LEVELS[islandLevel() + 1];
    const hot = CATS.find((c) => demandState(c).label === "High");
    const body = "Balance: " + d.coins + " " + CURRENCY + "\nOneBlock tier: " + highestTier(d) + " of 10\nIsland: " + L.size + " x " + L.size +
      (next ? " (next permit: " + next.cost + ")" : " (maximum)") + "\nMarket: high demand for " + hot + " goods\nActive contracts: " + d.con.length +
      "\n\nDirt pays a fixed " + DIRT_REWARD + " " + CURRENCY + " each time you mine the OneBlock.";
    const r = await show(p, new ActionFormData().title("Trader's Ledger").body(body)
      .button("Sell Items").button("Market Prices").button("Block Licenses").button("Natural Loot Contracts")
      .button("Island Expansion Permits").button("Auto-Mining Subscription").button("Transaction History").button("Achievements").button("Exit"));
    if (r.canceled || r.selection === 8) return;
    const fn = [sellMenu, priceMenu, licenseMenu, contractMenu, islandMenu, autoMineMenu, historyMenu, achMenu][r.selection];
    await fn(p);
  }
}

async function sellMenu(p) {
  for (;;) {
    const counts = inventoryCounts(p);
    const d = loadPlayer(p);
    const w = loadWorld();
    const rows = [...counts.entries()].filter(([id]) => hasLic(d, ITEMS.get(id).lic));
    if (!rows.length) return note(p, "Sell Items", "You have no items the market will buy right now.\nSome items need a block license first.");
    const f = new ActionFormData().title("Sell Items").body("Balance: " + d.coins + " " + CURRENCY + "\nChoose an item.");
    for (const [id, n] of rows) f.button(nice(id) + "  x" + n + "\nNow " + fmt(snapshot(w, id).price) + " each");
    f.button("Back");
    const r = await show(p, f);
    if (r.canceled || r.selection === rows.length) return;
    await sellItem(p, rows[r.selection][0]);
  }
}

async function sellItem(p, id) {
  const have = inventoryCounts(p).get(id) || 0;
  if (!have) return;
  const opts = [1, 10, 32, 64].filter((q) => q < have);
  opts.push(have);
  const f = new ActionFormData().title(nice(id)).body("You have " + have + ". Choose how many to sell.");
  for (const q of opts) f.button(q === have ? "Sell all (" + q + ")" : "Sell " + q);
  f.button("Back");
  const r = await show(p, f);
  if (r.canceled || r.selection === opts.length) return;
  const qty = opts[r.selection];
  const est = quote(loadWorld(), id, qty);
  if (!est) return;
  const ok = await confirm(p, "Confirm Sale", "Sell " + qty + " " + nice(id) + "\nEstimated total: " + est.total + " " + CURRENCY + "\nThe final price is recalculated when you confirm.", "Confirm sale");
  if (!ok) return;
  const res = sell(p, id, qty);
  await note(p, res.ok ? "Sale Complete" : "Sale Failed", res.msg);
}

async function priceMenu(p) {
  for (;;) {
    const f = new ActionFormData().title("Market Prices").body("Choose a category. Dirt is not traded: it pays a fixed " + DIRT_REWARD + " " + CURRENCY + " per OneBlock mining event.");
    for (const c of CATS) f.button(c[0].toUpperCase() + c.slice(1) + " goods" + (demandState(c).label === "High" ? "\nHigh demand" : ""));
    f.button("Back");
    const r = await show(p, f);
    if (r.canceled || r.selection === CATS.length) return;
    const w = loadWorld();
    const cat = CATS[r.selection];
    const lines = [];
    for (const it of ITEMS.values()) {
      if (it.cat !== cat) continue;
      const s = snapshot(w, it.id);
      lines.push(nice(it.id) + "\nBase " + it.base + "  Now " + fmt(s.price) + "  (" + it.min + " to " + it.max + ")\nSupply " + s.supply + ", demand " + s.demand + ", " + s.dir + "\n" + s.why + "\n");
    }
    await note(p, cat + " goods", lines.join("\n"));
  }
}

async function licenseMenu(p) {
  for (;;) {
    const d = loadPlayer(p);
    const buyable = LICENSES.filter((l) => l.cost > 0);
    const f = new ActionFormData().title("Block Licenses").body("Balance: " + d.coins + " " + CURRENCY + "\nA license adds blocks to the OneBlock pool. Rare blocks stay rare.");
    for (const l of buyable) {
      const status = hasLic(d, l.id) ? "Owned" : l.req && !hasLic(d, l.req) ? "Locked" : l.cost + " " + CURRENCY;
      f.button(l.name + "\n" + status);
    }
    f.button("Back");
    const r = await show(p, f);
    if (r.canceled || r.selection === buyable.length) return;
    const l = buyable[r.selection];
    if (hasLic(d, l.id)) { await note(p, l.name, "Owned. Blocks: " + Object.keys(l.blocks).map(nice).join(", ")); continue; }
    if (l.req && !hasLic(d, l.req)) { await note(p, l.name, "Locked. Requires " + LICENSES.find((x) => x.id === l.req).name + "."); continue; }
    const ok = await confirm(p, l.name, "Cost: " + l.cost + " " + CURRENCY + "\nBalance: " + d.coins + "\nAdds: " + Object.keys(l.blocks).map(nice).join(", "), "Buy license");
    if (!ok) continue;
    const res = buyLicense(p, l.id);
    await note(p, res.ok ? "Purchase Complete" : "Purchase Failed", res.msg);
  }
}

async function contractMenu(p) {
  for (;;) {
    const d = loadPlayer(p);
    const f = new ActionFormData().title("Natural Loot Contracts").body("Balance: " + d.coins + " " + CURRENCY + "\nActive contracts spawn loot chests on your island over time. Loot follows your licenses.");
    for (const c of CONTRACTS) f.button(c.name + "\n" + (d.con.includes(c.id) ? "Active" : hasLic(d, c.req) ? c.cost + " " + CURRENCY : "Locked"));
    f.button("Back");
    const r = await show(p, f);
    if (r.canceled || r.selection === CONTRACTS.length) return;
    const c = CONTRACTS[r.selection];
    if (d.con.includes(c.id)) {
      const lvl = (d.up && d.up[c.id]) || 1;
      const acts = [];
      const f2 = new ActionFormData().title(c.name).body("Level " + lvl + " of " + UPGRADE_MAX + "\nNext chest in about " + Math.round(intervalFor(d, c) / 60000) + " minutes.\n" +
        (lvl < UPGRADE_MAX ? "Upgrade to level " + (lvl + 1) + " costs " + upgradeCost(c, lvl) + " " + CURRENCY + ". Each level adds one loot roll and shortens the wait." : "Maximum level reached."));
      if (lvl < UPGRADE_MAX) { acts.push("up"); f2.button("Upgrade to level " + (lvl + 1)); }
      acts.push("cancel"); f2.button("Cancel contract");
      acts.push("back"); f2.button("Back");
      const r2 = await show(p, f2);
      if (r2.canceled) continue;
      const act = acts[r2.selection];
      if (act === "up") {
        const res = upgradeContract(p, c.id);
        await note(p, res.ok ? "Upgrade Complete" : "Upgrade Failed", res.msg);
      } else if (act === "cancel") {
        if (await confirm(p, c.name, "Cancelling stops new chests and gives no refund.", "Cancel contract")) {
          const res = cancelContract(p, c.id);
          await note(p, "Contract", res.msg);
        }
      }
      continue;
    }
    if (!hasLic(d, c.req)) { await note(p, c.name, "Locked. Requires " + LICENSES.find((l) => l.id === c.req).name + "."); continue; }
    if (await confirm(p, c.name, "Cost: " + c.cost + " " + CURRENCY + "\nA chest appears about every " + Math.round(c.intervalMs / 60000) + " minutes, up to 3 at a time.", "Activate")) {
      const res = buyContract(p, c.id);
      await note(p, res.ok ? "Contract Active" : "Purchase Failed", res.msg);
    }
  }
}


async function autoMineMenu(p) {
  const s = autoMineStatus();
  const remaining = Math.ceil(s.remainingTicks / 20);
  const body = s.active
    ? "Subscription active for this Minecraft day.\nTime remaining: " + remaining + " seconds.\nDrops are stored in the chest directly above the OneBlock. The subscription expires when the next Minecraft day begins."
    : "Cost: " + s.cost + " " + CURRENCY + "\nIncludes up to 30 seconds of OneBlock automation during the current Minecraft day. The subscription expires when the next Minecraft day begins.\n\nAutomation requires space in the chest directly above the OneBlock.";
  if (s.active) return note(p, "Auto-Mining Subscription", body);
  if (!(await confirm(p, "Auto-Mining Subscription", body, "Purchase for " + s.cost + " " + CURRENCY))) return;
  const res = buyAutoMine(p);
  await note(p, res.ok ? "Subscription Purchased" : "Purchase Failed", res.msg);
}

async function islandMenu(p) {
  const d = loadPlayer(p);
  const idx = islandLevel();
  const L = ISLAND_LEVELS[idx];
  const next = ISLAND_LEVELS[idx + 1];
  if (!next) return note(p, "Island Expansion Permits", "Current island: " + L.size + " x " + L.size + "\nYou own every available permit.");
  const body = "Current island: " + L.size + " x " + L.size + " (" + L.name + ")\nNext: " + next.name + ", " + next.size + " x " + next.size + "\nPrice: " + next.cost + " " + CURRENCY + "\nBalance: " + d.coins +
    "\n\nThe island is shared by everyone in this world. Building is only allowed inside the permitted area.";
  if (!(await confirm(p, "Island Expansion Permits", body, "Buy permit"))) return;
  const res = buyIsland(p, idx + 1);
  await note(p, res.ok ? "Permit Granted" : "Purchase Failed", res.msg);
}

async function historyMenu(p) {
  const d = loadPlayer(p);
  await note(p, "Transaction History", "OneBlock Dirt mined: " + d.mined + " (" + d.mined * DIRT_REWARD + " " + CURRENCY + " earned from Dirt)\n\n" + (d.hist.length ? d.hist.join("\n") : "No purchases or sales yet."));
}

async function achMenu(p) {
  const d = loadPlayer(p);
  const done = d.ach || [];
  const lines = ACHIEVEMENTS.map((a) => (done.includes(a.id) ? "[Done] " : "[Locked] ") + a.name + "\n" + a.desc + " (+" + a.reward + " " + CURRENCY + ")");
  await note(p, "Achievements", done.length + " of " + ACHIEVEMENTS.length + " unlocked\n\n" + lines.join("\n\n"));
}
