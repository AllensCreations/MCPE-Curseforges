import { system } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { CURRENCY, LICENSES, ISLAND_LEVELS, CONTRACTS, CATS, DIRT_REWARD, nice, ACHIEVEMENTS, UPGRADE_MAX, BIG_CONFIRM, BASIC_CHEST_CHANCE } from "./config.js";
import { loadPlayer, loadWorld, hasLic, islandLevel, highestTier, ITEMS, quote, snapshot, demandState } from "./store.js";
import { inventoryCounts, sell, buyLicense, buyIsland, buyContract, upgradeContract, upgradeCost, intervalFor, autoStatus, buyAutoLevel, toggleAuto } from "./game.js";

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

// One-tap shop screen. build(d) returns rows: { text, run?, cost?, confirm?, info? }.
// Tapping a row with run() buys it immediately and the same screen reopens with the result on top,
// the button already showing its next state (Buy -> Owned, Activate -> Upgrade Lv2 -> Lv3 -> MAX).
// Rows without run() are status rows: tapping one shows its info line. Only purchases of
// BIG_CONFIRM coins or more ask for a confirmation first.
async function shop(p, title, intro, build) {
  let msg = "";
  for (;;) {
    const d = loadPlayer(p);
    const rows = build(d);
    const f = new ActionFormData().title(title).body((msg ? msg + "\n\n" : "") + "Balance: " + d.coins + " " + CURRENCY + (intro ? "\n" + intro : ""));
    for (const r of rows) f.button(r.text);
    f.button("Back");
    const res = await show(p, f);
    if (res.canceled || res.selection === rows.length) return;
    const row = rows[res.selection];
    if (!row.run) { msg = row.info ? "\u00a77" + row.info : ""; continue; }
    if (row.cost >= BIG_CONFIRM && !(await confirm(p, title, row.confirm || "Spend " + row.cost + " " + CURRENCY + "?", "Buy for " + row.cost))) { msg = ""; continue; }
    try {
      const r = row.run();
      msg = (r.ok ? "\u00a7a" : "\u00a7c") + r.msg;
    } catch (e) {
      console.warn("[SovereignMarket] shop error: " + e);
      msg = "\u00a7cSomething went wrong. Nothing was charged.";
    }
  }
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
      .button("Island & Auto-Mine").button("Achievements").button("Exit"));
    if (r.canceled || r.selection === 6) return;
    const fn = [sellMenu, priceMenu, licenseMenu, contractMenu, perksMenu, achMenu][r.selection];
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

const blocksOf = (l) => { const n = Object.keys(l.blocks).map(nice); return n.slice(0, 12).join(", ") + (n.length > 12 ? ", and " + (n.length - 12) + " more" : ""); };

async function licenseMenu(p) {
  await shop(p, "Block Licenses", "Tap a license to buy it. Rare blocks stay rare.", (d) =>
    LICENSES.filter((l) => l.cost > 0).map((l) => {
      if (hasLic(d, l.id)) return { text: "\u00a72" + l.name + "\nOwned", info: l.name + " adds: " + blocksOf(l) };
      if (l.req && !hasLic(d, l.req)) return { text: "\u00a78" + l.name + "\nLocked", info: "Requires " + LICENSES.find((x) => x.id === l.req).name + " first." };
      return { text: l.name + "\nBuy for " + l.cost + " " + CURRENCY, cost: l.cost, confirm: l.name + "\nAdds: " + blocksOf(l), run: () => buyLicense(p, l.id) };
    }));
}

async function contractMenu(p) {
  await shop(p, "Natural Loot Contracts", "One button per contract: activate it, then upgrade the same button.", (d) =>
    CONTRACTS.map((c) => {
      if (!hasLic(d, c.req)) return { text: "\u00a78" + c.name + "\nLocked", info: "Requires " + LICENSES.find((l) => l.id === c.req).name + "." };
      if (!d.con.includes(c.id)) return { text: c.name + "\nActivate for " + c.cost + " " + CURRENCY, cost: c.cost, confirm: c.id === "basic" ? c.name + ": the OneBlock sometimes turns into a loot chest." : c.name + ": a chest about every " + Math.round(c.intervalMs / 60000) + " minutes, up to 3 at a time.", run: () => buyContract(p, c.id) };
      const lvl = (d.up && d.up[c.id]) || 1;
      if (lvl >= UPGRADE_MAX) return { text: "\u00a76" + c.name + "  Lv" + lvl + " MAX\n" + (c.id === "basic" ? "OneBlock chest chance " + Math.round(BASIC_CHEST_CHANCE * lvl * 100) + "%" : "Chest every ~" + Math.round(intervalFor(d, c) / 60000) + " min"), info: c.name + " is at the maximum level." };
      const cost = upgradeCost(c, lvl);
      return { text: "\u00a7a" + c.name + "  Lv" + lvl + "\nUpgrade to Lv" + (lvl + 1) + ": " + cost + " " + CURRENCY, cost, confirm: c.name + ": upgrade to level " + (lvl + 1) + ". Each level adds one loot roll and shortens the wait.", run: () => upgradeContract(p, c.id) };
    }));
}

async function perksMenu(p) {
  await shop(p, "Island & Auto-Mine", "The island and the auto-miner are shared by everyone in this world.", () => {
    const rows = [];
    const idx = islandLevel();
    const L = ISLAND_LEVELS[idx];
    const next = ISLAND_LEVELS[idx + 1];
    rows.push(next
      ? { text: "Island " + L.size + "x" + L.size + "\nExpand to " + next.size + "x" + next.size + ": " + next.cost + " " + CURRENCY, cost: next.cost, confirm: next.name + " (" + next.size + " x " + next.size + "). The island is shared by everyone in this world.", run: () => buyIsland(p, idx + 1) }
      : { text: "\u00a76Island " + L.size + "x" + L.size + " MAX\nEvery permit owned", info: "You own every island permit." });

    const s = autoStatus();
    const per = (n) => (n === 1 ? "every tick" : "every " + n + " ticks");
    rows.push(s.next
      ? { text: "Auto-Miner " + (s.level ? "Lv" + s.level : "(not owned)") + "\n" + (s.level ? "Upgrade to Lv" + (s.level + 1) : "Buy Lv1") + ": " + s.next.cost + " " + CURRENCY, cost: s.next.cost, confirm: "Auto-Miner Lv" + (s.level + 1) + ": breaks the OneBlock " + per(s.next.step) + " for about 2 minutes per Minecraft day. Drops go to the chest above the OneBlock.", run: () => buyAutoLevel(p) }
      : { text: "\u00a76Auto-Miner Lv" + s.level + " MAX\nBreaks the OneBlock " + per(s.step), info: "The Auto-Miner is at the maximum level." });
    if (s.level) rows.push({ text: "Auto-Miner: " + (s.on ? "\u00a72ON" : "\u00a7cOFF") + "\n" + (s.leftSecs > 0 ? s.leftSecs + "s left today. Tap to toggle" : "Exhausted. Recharges next day"), run: () => toggleAuto(p) });
    return rows;
  });
}

async function achMenu(p) {
  const d = loadPlayer(p);
  const done = d.ach || [];
  const lines = ACHIEVEMENTS.map((a) => (done.includes(a.id) ? "[Done] " : "[Locked] ") + a.name + "\n" + a.desc + " (+" + a.reward + " " + CURRENCY + ")");
  await note(p, "Achievements", done.length + " of " + ACHIEVEMENTS.length + " unlocked\n\n" + lines.join("\n\n"));
}
