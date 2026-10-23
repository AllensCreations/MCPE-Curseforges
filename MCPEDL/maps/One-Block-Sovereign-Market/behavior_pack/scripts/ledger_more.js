// ledger_more.js - ledger screens for contracts, crates, teams, trade, milestones, prestige and beacons.
import { world } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { show, fmt } from "./ui_util.js";
import { getBalance, listSellable, countOf, SELL_AMOUNTS, getPhaseInfo, PHASES, prettyName, getPrice } from "./economy.js";
import { getContracts, claimContract } from "./contracts.js";
import { CRATES, openCrate } from "./crates.js";
import { getTeamOf, createTeam, addMember, leaveTeam, MAX_TEAM } from "./teams.js";
import { TRANSFER_AMOUNTS, PRICE_STEPS, transferCoins, listBoard, postListing, buyListing, cancelListing } from "./trade.js";
import { MILESTONES, getTitle, equipTitle } from "./milestones.js";
import { canPrestige, doPrestige, prestigeCount, REQ_RANK, REQ_PHASE } from "./prestige.js";
import { listOwned, setWorkerType, TYPES } from "./workers.js";
import { getRadius } from "./zoning.js";
import { getVault } from "./economy.js";

const say = (p, m) => p.sendMessage(`§6[Market] §f${m}`);
const others = (player) => world.getAllPlayers().filter((p) => p.id !== player.id);

// ---- Daily contracts ---------------------------------------------------------------------------
export async function contractsFlow(player) {
  while (true) {
    const list = getContracts(player);
    if (list.length === 0) { say(player, "No contracts available yet."); return; }
    const form = new ActionFormData().title("§6Daily Contracts")
      .body("§7Deliver items for a bonus. New contracts every day.");
    list.forEach((c) => form.button(c.done ? `§a[done] ${c.qty}x ${prettyName(c.item)}` : `${c.qty}x ${prettyName(c.item)}  (+${c.reward})\n§7You have ${countOf(player, c.item)}`));
    form.button("Back");
    const res = await show(player, form);
    if (res.canceled || res.selection === list.length) return;
    say(player, claimContract(player, res.selection).msg);
  }
}

// ---- Mystery crates -----------------------------------------------------------------------------
export async function cratesFlow(player) {
  while (true) {
    const phase = getPhaseInfo().index;
    const form = new ActionFormData().title("§6Mystery Crates")
      .body(`§fBalance: §6${fmt(getBalance(player))}\n§7Each crate gives 2 random rewards. Better crates unlock with phases.`);
    CRATES.forEach((c) => form.button(phase < c.phase ? `§8${c.name}\n§cLocked: ${PHASES[c.phase].name}` : `${c.name}\n§6${c.cost} coins`));
    form.button("Back");
    const res = await show(player, form);
    if (res.canceled || res.selection === CRATES.length) return;
    if (phase < CRATES[res.selection].phase) { say(player, `§cReach the ${PHASES[CRATES[res.selection].phase].name} first.`); continue; }
    say(player, openCrate(player, res.selection).msg);
  }
}

// ---- Teams --------------------------------------------------------------------------------------
async function invite(player, team) {
  if (team.members.length >= MAX_TEAM) { say(player, `Your team is full (${MAX_TEAM}).`); return; }
  const free = others(player).filter((p) => !getTeamOf(p.id));
  if (free.length === 0) { say(player, "No online players without a team."); return; }
  const form = new ActionFormData().title("§6Invite Player").body("Choose a player.");
  free.forEach((p) => form.button(p.name));
  form.button("Back");
  const res = await show(player, form);
  if (res.canceled || res.selection === free.length) return;
  const target = free[res.selection];
  say(player, `Invite sent to ${target.name}.`);
  const answer = await show(target, new ActionFormData().title("§6Team Invite")
    .body(`${player.name} invites you to join the team "${team.name}".\nTeams share a worker vault and the best island permit.`)
    .button("§2Accept").button("§cDecline"));
  if (!answer.canceled && answer.selection === 0 && addMember(team.id, target)) {
    say(target, `You joined ${team.name}.`); say(player, `${target.name} joined your team.`);
  } else say(player, `${target.name} did not join.`);
}

export async function teamFlow(player) {
  while (true) {
    const t = getTeamOf(player.id);
    if (!t) {
      const res = await show(player, new ActionFormData().title("§6Team")
        .body("Teams (max 4) share a worker vault and the best island permit.").button("Create Team").button("Back"));
      if (res.canceled || res.selection !== 0) return;
      const m = await show(player, new ModalFormData().title("Create Team").textField("Team name (3-16 letters)", "Dirt Kings"));
      if (m.canceled) continue;
      say(player, createTeam(player, m.formValues?.[0]).msg);
      continue;
    }
    const res = await show(player, new ActionFormData().title(`§6Team: ${t.name}`)
      .body(`§fMembers: §e${t.members.map((x) => x.n).join(", ")}\n§fShared permit radius: §a${getRadius(player)}\n§fTeam vault: §6${fmt(getVault(player.id))}`)
      .button("Invite Player").button("Leave Team").button("Back"));
    if (res.canceled || res.selection === 2) return;
    if (res.selection === 0) await invite(player, t);
    else { leaveTeam(player); say(player, "You left the team."); }
  }
}

// ---- Trade: coin transfers + trade board -----------------------------------------------------------
async function sendCoinsFlow(player) {
  const list = others(player);
  if (list.length === 0) { say(player, "No other players online."); return; }
  const f = new ActionFormData().title("§6Send Coins").body(`§fBalance: §6${fmt(getBalance(player))}`);
  list.forEach((p) => f.button(p.name));
  f.button("Back");
  const r1 = await show(player, f);
  if (r1.canceled || r1.selection === list.length) return;
  const target = list[r1.selection];
  const opts = TRANSFER_AMOUNTS.filter((a) => a <= getBalance(player));
  if (opts.length === 0) { say(player, "Not enough coins."); return; }
  const f2 = new ActionFormData().title(`§6Send to ${target.name}`);
  opts.forEach((a) => f2.button(`${a} coins`));
  f2.button("Back");
  const r2 = await show(player, f2);
  if (r2.canceled || r2.selection === opts.length) return;
  if (transferCoins(player, target, opts[r2.selection])) {
    say(player, `Sent ${opts[r2.selection]} coins to ${target.name}.`);
    say(target, `${player.name} sent you ${opts[r2.selection]} coins.`);
  } else say(player, "Transfer failed.");
}

async function postFlow(player) {
  const items = listSellable(player);
  if (items.length === 0) { say(player, "You have nothing to list."); return; }
  const f = new ActionFormData().title("§6Post Listing").body("Choose the item to list.");
  items.forEach((i) => f.button(`${prettyName(i.id)} x${i.amount}`));
  f.button("Back");
  const r1 = await show(player, f);
  if (r1.canceled || r1.selection === items.length) return;
  const id = items[r1.selection].id;
  const qtys = SELL_AMOUNTS.filter((n) => n <= countOf(player, id));
  const f2 = new ActionFormData().title("§6Amount");
  qtys.forEach((n) => f2.button(`${n}`));
  f2.button("Back");
  const r2 = await show(player, f2);
  if (r2.canceled || r2.selection === qtys.length) return;
  const qty = qtys[r2.selection];
  const f3 = new ActionFormData().title("§6Price").body("Price as a share of today's market value.");
  PRICE_STEPS.forEach((s) => f3.button(`${Math.round(s * 100)}%  -  ${Math.max(1, Math.round(getPrice(id) * qty * s))} coins`));
  f3.button("Back");
  const r3 = await show(player, f3);
  if (r3.canceled || r3.selection === PRICE_STEPS.length) return;
  say(player, postListing(player, id, qty, PRICE_STEPS[r3.selection]).msg);
}

async function boardFlow(player) {
  while (true) {
    const res = await show(player, new ActionFormData().title("§6Trade Board")
      .body(`§7${listBoard().length} listing(s). Items are held safely until sold or cancelled.`)
      .button("Buy").button("Post a Listing").button("My Listings").button("Back"));
    if (res.canceled || res.selection === 3) return;
    if (res.selection === 1) { await postFlow(player); continue; }
    const mine = res.selection === 2;
    const list = listBoard().filter((l) => (l.s === player.id) === mine);
    if (list.length === 0) { say(player, mine ? "You have no listings." : "No listings to buy."); continue; }
    const f = new ActionFormData().title(mine ? "§6My Listings" : "§6Buy");
    list.forEach((l) => f.button(`${mine ? "Cancel: " : ""}${l.q}x ${prettyName(l.id)}\n§6${l.p} coins${mine ? "" : ` §7(${l.sn})`}`));
    f.button("Back");
    const r = await show(player, f);
    if (r.canceled || r.selection === list.length) continue;
    const l = list[r.selection];
    say(player, (mine ? cancelListing(player, l.k) : buyListing(player, l.k)).msg);
  }
}

export async function tradeFlow(player) {
  while (true) {
    const res = await show(player, new ActionFormData().title("§6Trade & Transfers")
      .button("Send Coins").button("Trade Board").button("Back"));
    if (res.canceled || res.selection === 2) return;
    if (res.selection === 0) await sendCoinsFlow(player); else await boardFlow(player);
  }
}

// ---- Milestones & titles -----------------------------------------------------------------------------
export async function milestonesFlow(player) {
  while (true) {
    const cur = getTitle(player);
    const f = new ActionFormData().title("§6Milestones & Titles")
      .body(`§fShown above your head: §e${cur || "your rank"}\n\n${MILESTONES.map((m) => `${m.ok(player) ? "§a[x]" : "§8[ ]"} §f${m.title} §7- ${m.label}`).join("\n")}`);
    f.button("Use my rank as title");
    MILESTONES.forEach((m) => f.button(m.ok(player) ? `§2${m.title}${cur === m.title ? " (equipped)" : ""}` : `§8${m.title} (locked)`));
    f.button("Back");
    const res = await show(player, f);
    if (res.canceled || res.selection === MILESTONES.length + 1) return;
    if (res.selection === 0) { equipTitle(player, ""); continue; }
    const m = MILESTONES[res.selection - 1];
    say(player, equipTitle(player, m.title) ? `Title set: ${m.title}.` : `Locked: ${m.label}.`);
  }
}

// ---- Prestige ---------------------------------------------------------------------------------------------
export async function prestigeFlow(player) {
  const ok = canPrestige(player);
  const res = await show(player, new ActionFormData().title("§6Prestige")
    .body(`§fPrestige level: §e${prestigeCount(player)} §7(+${prestigeCount(player) * 10}% coins)\n\n§fRequires: §eMagnate rank (${REQ_RANK === 3 ? "10,000 coins earned" : ""}) and ${PHASES[REQ_PHASE].name}\n§fStatus: ${ok ? "§aReady" : "§cNot ready"}\n\n§cResets: §fyour coins, rank progress, personal permit and worker upgrades.\n§aKeeps: §fbeacons, vault, titles, milestones.\n§aGives: §f+10% coins for every prestige, forever.`)
    .button(ok ? "§2Prestige now" : "§8Not ready").button("Back"));
  if (res.canceled || res.selection !== 0 || !ok) return;
  const sure = await show(player, new ActionFormData().title("§cAre you sure?").body("This resets your coins, rank progress, permit and worker upgrades.").button("§cYes, prestige").button("Cancel"));
  if (sure.canceled || sure.selection !== 0) return;
  if (doPrestige(player)) world.sendMessage(`§6[Sovereign Market] §e${player.name} has prestiged! (level ${prestigeCount(player)})`);
}

// ---- Beacon types ------------------------------------------------------------------------------------------------
export async function beaconsFlow(player) {
  while (true) {
    const list = listOwned(player.id);
    if (list.length === 0) { say(player, "You have no beacons placed."); return; }
    const f = new ActionFormData().title("§6Manage Beacons").body("Pick a beacon to change its job.");
    list.forEach((w) => f.button(`(${w.x}, ${w.y}, ${w.z})\n§7${TYPES[w.t]?.label ?? "Farmer"}`));
    f.button("Back");
    const res = await show(player, f);
    if (res.canceled || res.selection === list.length) return;
    const w = list[res.selection];
    const keys = Object.keys(TYPES);
    const f2 = new ActionFormData().title("§6Beacon Job");
    keys.forEach((k) => f2.button(`${TYPES[k].label}\n§7${TYPES[k].text}`));
    f2.button("Back");
    const r2 = await show(player, f2);
    if (r2.canceled || r2.selection === keys.length) continue;
    setWorkerType(player.id, w.x, w.y, w.z, keys[r2.selection]);
    say(player, `Beacon is now a ${TYPES[keys[r2.selection]].label}.`);
  }
}
