import { system } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { IDS, COIN_ICON, TITLE, SHOP, CRATES, BOUNTY_POOL, TIERS, iconOf, tierOf, crateOdds } from "./config.js";
import {
  getBalance, setBalance, describeValue, looseCounts, countsValue, depositAll,
  withdrawCoin, withdrawAll, compressLoose
} from "./vault.js";
import { getBounties, claim, msLeft } from "./bounties.js";
import { deliver } from "./shop.js";
import { rollCrate, animateCrate, grantPrize } from "./crates.js";

const sleep = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));

async function show(form, player) {
  for (let i = 0; i < 40; i++) {
    let res;
    try {
      res = await form.show(player);
    } catch (e) {
      return undefined;
    }
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
      await sleep(10);
      continue;
    }
    return res;
  }
  return undefined;
}

const pick = (res) => (res && res.selection !== undefined ? res.selection : -1);

const header = (player) => {
  const loose = countsValue(looseCounts(player));
  return `§eVault: §f${describeValue(getBalance(player))}§r\n§eCarried: §f${describeValue(loose)}§r\n`;
};

async function vaultMenu(player) {
  let note = "";
  for (;;) {
    const form = new ActionFormData()
      .title(`${TITLE}`)
      .body(`§l§6Pirate Vault§r\n${header(player)}\n${note}`)
      .button("§l§aDeposit All Coins\n§r§fMove carried coins into the vault", COIN_ICON[IDS.gold])
      .button("§l§bWithdraw Coins\n§r§fTake coins out of the vault", COIN_ICON[IDS.silver])
      .button("§l§eCompress Carried Coins\n§r§f10 Silver = 1 Gold, 10 Gold = 1 Cursed", COIN_ICON[IDS.cursed])
      .button("§l§cBack");
    const sel = pick(await show(form, player));
    if (sel === -1) return false;
    if (sel === 3) return true;
    if (sel === 0) {
      const total = depositAll(player);
      note = total > 0 ? `§aDeposited ${describeValue(total)}§r\n` : "§cYou carry no pirate coins.\n";
    } else if (sel === 1) {
      const out = await withdrawMenu(player);
      if (out === false) return false;
      note = "";
    } else if (sel === 2) {
      note = compressLoose(player) ? "§aCoins compressed into higher coins.\n" : "§eNothing to compress yet.\n";
    }
  }
}

const WITHDRAW = [
  { label: "1 Silver Token", id: IDS.silver, n: 1 },
  { label: "10 Silver Tokens", id: IDS.silver, n: 10 },
  { label: "1 Gold Doubloon", id: IDS.gold, n: 1 },
  { label: "10 Gold Doubloons", id: IDS.gold, n: 10 },
  { label: "1 Cursed Captain's Coin", id: IDS.cursed, n: 1 }
];

async function withdrawMenu(player) {
  let note = "";
  for (;;) {
    const form = new ActionFormData().title(`${TITLE}`).body(`§l§6Withdraw§r\n${header(player)}\n${note}`);
    for (const w of WITHDRAW) form.button(`§l§f${w.label}`, COIN_ICON[w.id]);
    form.button("§l§aWithdraw Everything\n§r§fBest coins, auto-converted", COIN_ICON[IDS.cursed]);
    form.button("§l§cBack");
    const sel = pick(await show(form, player));
    if (sel === -1) return false;
    if (sel === WITHDRAW.length + 1) return true;
    if (sel === WITHDRAW.length) {
      const v = withdrawAll(player);
      note = v > 0 ? `§aWithdrew ${describeValue(v)}§r\n` : "§cThe vault is empty.\n";
    } else {
      const w = WITHDRAW[sel];
      note = withdrawCoin(player, w.id, w.n) ? `§aWithdrew ${w.label}\n` : "§cNot enough in the vault.\n";
    }
  }
}

const bar = (p, goal) => {
  const n = Math.min(10, Math.floor((p / goal) * 10));
  return `§a${"|".repeat(n)}§c${"|".repeat(10 - n)}`;
};

async function bountyMenu(player) {
  let note = "";
  for (;;) {
    const state = getBounties(player);
    const hours = Math.floor(msLeft() / 3600000);
    const mins = Math.floor((msLeft() % 3600000) / 60000);
    let body = `§l§6Pirate Bounties§r\n§eNew bounties in §f${hours}h ${mins}m§r\n\n${note}`;
    const claimable = [];
    state.b.forEach((entry, idx) => {
      const def = BOUNTY_POOL[entry.i];
      const done = entry.p >= def.goal;
      const status = entry.c ? "§aClaimed" : done ? "§6Ready to claim" : `§f${entry.p}/${def.goal}`;
      body += `§l§b${def.title}§r\n§f${def.text}\n${bar(entry.p, def.goal)} ${status}§r §e(Reward: ${def.reward} Doubloons)§r\n\n`;
      if (done && !entry.c) claimable.push(idx);
    });
    const form = new ActionFormData().title(`${TITLE}`).body(body);
    for (const idx of claimable) {
      const def = BOUNTY_POOL[state.b[idx].i];
      form.button(`§l§6[ Claim Doubloons ]\n§r§f${def.title} (+${def.reward})`, COIN_ICON[IDS.gold]);
    }
    form.button("§l§cBack");
    const sel = pick(await show(form, player));
    if (sel === -1) return false;
    if (sel === claimable.length) return true;
    const reward = claim(player, claimable[sel]);
    note = reward > 0 ? `§aClaimed ${reward} Gold Doubloons into your vault.§r\n\n` : "";
  }
}

const priceText = (value) => describeValue(value);

async function marketMenu(player) {
  let note = "";
  for (;;) {
    const form = new ActionFormData().title(`${TITLE}`).body(`§l§6Black Market§r\n${header(player)}\n${note}`);
    for (const item of SHOP) form.button(`§l§f${item.label}\n§r§e${priceText(item.price)}`, item.icon);
    form.button("§l§cBack");
    const sel = pick(await show(form, player));
    if (sel === -1) return false;
    if (sel === SHOP.length) return true;
    const item = SHOP[sel];
    if (getBalance(player) < item.price) {
      note = `§cNot enough in the vault for ${item.label}.\n`;
      continue;
    }
    setBalance(player, getBalance(player) - item.price);
    deliver(player, item.key);
    player.playSound("random.orb");
    note = `§aPurchased ${item.label}. §f${item.note}\n`;
  }
}

async function previewCrate(player, crate) {
  const odds = crateOdds(crate).sort((m, n) => TIERS.findIndex((q) => q.key === n.prize.tier) - TIERS.findIndex((q) => q.key === m.prize.tier));
  const tierTotal = Object.keys(crate.tiers).reduce((s, k) => s + crate.tiers[k], 0);
  let body = `§l§6${crate.label}§r\n§ePrice: §f${crate.priceText}\n`;
  for (const tier of [...TIERS].reverse()) {
    if (crate.tiers[tier.key] > 0) body += `${tier.color}${tier.name}: §f${((crate.tiers[tier.key] / tierTotal) * 100).toFixed(0)}%§r  `;
  }
  const form = new ActionFormData().title(`${TITLE}`).body(body);
  for (const o of odds) {
    const tier = tierOf(o.prize);
    form.button(`§l${tier.color}${o.prize.label}\n§r${tier.color}${tier.name} §e${o.chance.toFixed(2)}%`, iconOf(o.prize.id));
  }
  form.button("§l§cBack");
  await show(form, player);
}

async function crateMenu(player) {
  let note = "";
  for (;;) {
    const form = new ActionFormData().title(`${TITLE}`).body(`§l§6Mystery Crates§r\n${header(player)}\n${note}`);
    for (const c of CRATES) form.button(`§l§f${c.label}\n§r§e${c.priceText}`, c.icon);
    for (const c of CRATES) form.button(`§l§bPrizes: ${c.key === "cursed" ? "Cursed Crate" : "Buccaneer Crate"}`);
    form.button("§l§cBack");
    const sel = pick(await show(form, player));
    if (sel === -1) return false;
    if (sel === CRATES.length * 2) return true;
    if (sel >= CRATES.length) {
      await previewCrate(player, CRATES[sel - CRATES.length]);
      continue;
    }
    const crate = CRATES[sel];
    if (getBalance(player) < crate.price) {
      note = `§cYou need ${crate.priceText} in your vault.\n`;
      continue;
    }
    setBalance(player, getBalance(player) - crate.price);
    const prize = rollCrate(crate);
    await animateCrate(player, crate, prize);
    grantPrize(player, prize);
    try {
      player.onScreenDisplay.setActionBar(`§a§lYou won §f${prize.label}`);
    } catch (e) {}
    return false;
  }
}

export async function openLedger(player) {
  try {
    for (;;) {
      const form = new ActionFormData()
        .title(`${TITLE}`)
        .body(`§bWelcome aboard, Captain.§r\n${header(player)}`)
        .button("§l§6Pirate Vault\n§r§fBank your coins", COIN_ICON[IDS.gold])
        .button("§l§bPirate Bounties\n§r§fDaily challenges", COIN_ICON[IDS.ledger])
        .button("§l§aBlack Market\n§r§fGear and bundles", COIN_ICON[IDS.silver])
        .button("§l§dMystery Crates\n§r§fSpin for treasure", COIN_ICON[IDS.cursed]);
      const sel = pick(await show(form, player));
      if (sel === -1) return;
      const fn = [vaultMenu, bountyMenu, marketMenu, crateMenu][sel];
      const keepOpen = await fn(player);
      if (keepOpen === false) return;
    }
  } catch (e) {}
}

export async function openCrates(player) {
  try {
    await crateMenu(player);
  } catch (e) {}
}
