import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import {
  PROP,
  LEDGER_ID,
  SPAWN_Y,
  COIN_NAME,
  MAX_TRADE_AMOUNT,
  MAX_PRICE,
  PRICE_MIN_RATIO,
  PRICE_MAX_RATIO,
  MARKET_FEE_RATIO,
  OFFER_LIFETIME_TICKS,
  TRUST_LIMIT,
  COOP_MAX_MEMBERS,
  MAX_REQUESTS_PER_PLAYER,
  MAX_REQUESTS_TOTAL,
  REQUEST_LIST_LIMIT,
  VISIT_COOLDOWN_TICKS,
} from "./config.js";
import {
  slotOf,
  recordOf,
  readSlots,
  slotCoords,
  slotNear,
  trustedOf,
  setTrusted,
  coopMembers,
  setCoopMembers,
  canBuild,
  setInvite,
} from "./slots.js";
import { coinsOf, addCoins, addPayout, addEarned, awardTradeBonus } from "./market.js";
import { priceInfo, recommendedTotal } from "./prices.js";
import {
  findPlayer,
  later,
  wait,
  niceName,
  normalizeId,
  isValidItem,
  plainInventory,
  countPlain,
  removePlain,
  giveItem,
  isCreative,
  readJson,
  writeJson,
  overworld,
} from "./util.js";
import { hasIsland } from "./claim.js";
import { teleportToLobby } from "./lobby.js";
import { promptWelcome } from "./welcome.js";

const BACK = { name: "main", page: 0, filter: "" };
const warned = new Map();
const visitUsed = new Map();

async function ask(form, player, tries = 6, delay = 10) {
  for (let i = 0; i < tries; i++) {
    let res;
    try {
      res = await form.show(player);
    } catch (e) {
      return undefined;
    }
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
      await wait(delay);
      continue;
    }
    return res;
  }
  return undefined;
}

function say(player, text, good = true) {
  try {
    player.sendMessage(`§6[ALN] ${good ? "§a" : "§c"}${text}`);
  } catch (e) {}
}

function notify(playerId, text) {
  const target = findPlayer(playerId);
  if (target) say(target, text);
  return target;
}

function deliver(targetId, itemId, amount) {
  const target = findPlayer(targetId);
  if (target) giveItem(target, itemId, amount);
  else addPayout(targetId, itemId, amount);
}

function labelOf(person) {
  return `${person.name} (${findPlayer(person.id) ? "online" : "offline"})`;
}

function islandPeople(excludeId) {
  const seen = new Set();
  const list = [];
  const slots = readSlots();
  for (const key of Object.keys(slots)) {
    const record = slots[key];
    if (!record) continue;
    for (const person of [{ id: record.id, name: record.name }, ...coopMembers(Number(key))]) {
      if (!person.id || !person.name || person.id === excludeId || seen.has(person.id)) continue;
      seen.add(person.id);
      list.push({ id: person.id, name: person.name, slot: Number(key) });
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

function warnDenied(player, slot) {
  system.run(() => {
    try {
      const now = world.getAbsoluteTime();
      if (now - (warned.get(player.id) ?? -100) < 40) return;
      warned.set(player.id, now);
      const name = recordOf(slot)?.name ?? "another player";
      player.sendMessage(`§6[ALN] §cThis island belongs to ${name}. Ask them to trust you.`);
    } catch (e) {}
  });
}

function guard(event, interact) {
  const block = event.block;
  if (block.dimension.id !== "minecraft:overworld") return;
  const slot = slotNear(block.x, block.z);
  if (slot === undefined || canBuild(event.player.id, slot)) return;
  if (interact && event.itemStack?.typeId === LEDGER_ID) return;
  event.cancel = true;
  warnDenied(event.player, slot);
}

export function startProtection() {
  world.beforeEvents.playerBreakBlock.subscribe((event) => {
    try {
      guard(event, false);
    } catch (e) {}
  });
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    try {
      guard(event, true);
    } catch (e) {}
  });
}

function teleportVisit(visitor, slot) {
  const c = slotCoords(slot);
  try {
    visitor.teleport({ x: c.x + 0.5, y: SPAWN_Y, z: c.z + 0.5 }, { dimension: overworld() });
  } catch (e) {}
}

async function requestVisit(visitor, target) {
  const record = recordOf(target.slot);
  if (!record) return;
  if (target.slot === slotOf(visitor)) {
    say(visitor, "That is your own island. Use Go Home.", false);
    return;
  }
  if (canBuild(visitor.id, target.slot)) {
    teleportVisit(visitor, target.slot);
    say(visitor, `Visiting ${record.name}'s island. Use Go Home to return.`);
    return;
  }
  const owner = findPlayer(record.id);
  if (!owner) {
    say(visitor, "The island owner must be online to approve your visit.", false);
    return;
  }
  const now = world.getAbsoluteTime();
  const last = visitUsed.get(visitor.id);
  if (last !== undefined && now - last < VISIT_COOLDOWN_TICKS) {
    say(visitor, `You can send another visit request in ${Math.ceil((VISIT_COOLDOWN_TICKS - (now - last)) / 20)} seconds.`, false);
    return;
  }
  visitUsed.set(visitor.id, now);
  say(visitor, `Visit request sent to ${owner.name}.`);
  const form = new ActionFormData()
    .title("§6§lVisit Request")
    .body(`§f${visitor.name} §7wants to visit your island.\n§7Visitors cannot build or break blocks unless you trust them.`)
    .button("Accept")
    .button("Decline");
  const res = await ask(form, owner, 15, 40);
  const arrived = findPlayer(visitor.id);
  if (!arrived) return;
  if (!res || res.canceled || res.selection !== 0) {
    say(arrived, `${owner.name} did not accept your visit.`, false);
    return;
  }
  teleportVisit(arrived, target.slot);
  say(arrived, `Visiting ${owner.name}'s island. Use Go Home to return.`);
}

async function screenVisit(player) {
  const own = slotOf(player);
  const slots = readSlots();
  const targets = [];
  for (const key of Object.keys(slots)) {
    const slot = Number(key);
    const record = slots[key];
    if (!record || slot === own) continue;
    if (findPlayer(record.id) || canBuild(player.id, slot)) targets.push({ slot, name: record.name, id: record.id });
  }
  targets.sort((a, b) => a.name.localeCompare(b.name));
  if (targets.length === 0) {
    say(player, "No island owners are online to visit right now.", false);
    return "menu";
  }
  const form = new ActionFormData().title("§6§lVisit an Island").body("§7The island owner must approve your visit.");
  for (const t of targets) form.button(`${t.name}\n§8Island #${t.slot} | ${findPlayer(t.id) ? "online" : "offline"}`);
  form.button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection < targets.length) await requestVisit(player, targets[res.selection]);
  return "menu";
}

async function addTrusted(player, slot) {
  const trusted = trustedOf(slot);
  if (trusted.length >= TRUST_LIMIT) {
    say(player, `You can trust at most ${TRUST_LIMIT} players.`, false);
    return;
  }
  const skip = new Set([player.id, ...trusted.map((t) => t.id), ...coopMembers(slot).map((m) => m.id)]);
  const candidates = world.getAllPlayers().filter((p) => !skip.has(p.id));
  if (candidates.length === 0) {
    say(player, "No other players are online to trust.", false);
    return;
  }
  const form = new ModalFormData().title("§6§lTrust Player").dropdown("Player to trust", candidates.map((p) => p.name));
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return;
  const target = candidates[res.formValues[0]];
  if (!target) return;
  setTrusted(slot, [...trusted, { id: target.id, name: target.name }]);
  say(player, `${target.name} can now build on your island.`);
  say(target, `${player.name} trusts you. You can build on their island.`);
}

async function removeTrusted(player, slot) {
  const trusted = trustedOf(slot);
  if (trusted.length === 0) {
    say(player, "You do not trust anyone yet.", false);
    return;
  }
  const form = new ModalFormData().title("§6§lRemove Trusted Player").dropdown("Player to remove", trusted.map((t) => t.name));
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return;
  const target = trusted[res.formValues[0]];
  if (!target) return;
  setTrusted(slot, trusted.filter((t) => t.id !== target.id));
  say(player, `${target.name} can no longer build on your island.`);
  notify(target.id, `${player.name} no longer trusts you.`);
}

async function screenTrust(player) {
  const slot = slotOf(player);
  const record = slot === undefined ? undefined : recordOf(slot);
  if (!record) {
    say(player, "You need an island first.", false);
    return "menu";
  }
  const owner = record.id === player.id;
  const trusted = trustedOf(slot);
  const lines = ["§7Trusted players can build, break and use blocks on your island. Everyone else can only look.", ""];
  if (trusted.length === 0) lines.push("§7Nobody is trusted yet.");
  for (const t of trusted) lines.push(`§f${t.name}`);
  if (!owner) lines.push("", "§7Only the island owner can change this list.");
  const form = new ActionFormData().title("§6§lTrusted Players").body(lines.join("\n"));
  if (owner) form.button("Trust a Player").button("Remove a Player");
  form.button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (owner && res.selection === 0) await addTrusted(player, slot);
  else if (owner && res.selection === 1) await removeTrusted(player, slot);
  else return "menu";
  return "trust";
}

function dropMember(slot, memberId) {
  setCoopMembers(slot, coopMembers(slot).filter((m) => m.id !== memberId));
  const target = findPlayer(memberId);
  if (!target) return;
  target.setDynamicProperty(PROP.SLOT, undefined);
  target.setDynamicProperty(PROP.TRAIT, undefined);
  teleportToLobby(target);
  later(() => promptWelcome(target), 20);
}

async function invitePlayer(player, slot, record) {
  if (coopMembers(slot).length >= COOP_MAX_MEMBERS) {
    say(player, `Your co-op island is full (${COOP_MAX_MEMBERS + 1} players).`, false);
    return;
  }
  const candidates = world.getAllPlayers().filter((p) => !hasIsland(p));
  if (candidates.length === 0) {
    say(player, "Only players who have not claimed an island yet can be invited, and nobody like that is online.", false);
    return;
  }
  const form = new ModalFormData().title("§6§lInvite Player").dropdown("Player to invite", candidates.map((p) => p.name));
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return;
  const target = candidates[res.formValues[0]];
  if (!target) return;
  setInvite(target.id, { slot, owner: record.name });
  say(player, `Invitation sent to ${target.name}.`);
  say(target, `${record.name} invited you to share their island. Close the window and choose Join when it opens again.`);
}

async function removeMember(player, slot) {
  const members = coopMembers(slot);
  if (members.length === 0) {
    say(player, "You have no co-op members.", false);
    return;
  }
  const form = new ModalFormData().title("§6§lRemove Member").dropdown("Member to remove", members.map((m) => m.name));
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return;
  const target = members[res.formValues[0]];
  if (!target) return;
  dropMember(slot, target.id);
  say(player, `${target.name} left your co-op island.`);
  notify(target.id, `${player.name} removed you from their island.`);
}

async function leaveCoop(player, slot) {
  const form = new ActionFormData()
    .title("§6§lLeave Co-op")
    .body("§7You will return to the lobby and can claim your own island. Your coins stay with you.")
    .button("Leave Co-op")
    .button("Stay");
  const res = await ask(form, player);
  if (!res || res.canceled || res.selection !== 0) return false;
  dropMember(slot, player.id);
  return true;
}

async function screenCoop(player) {
  const slot = slotOf(player);
  const record = slot === undefined ? undefined : recordOf(slot);
  if (!record) {
    say(player, "You need an island first.", false);
    return "menu";
  }
  const owner = record.id === player.id;
  const members = coopMembers(slot);
  const lines = [
    `§7A co-op island is shared by up to ${COOP_MAX_MEMBERS + 1} players. Everyone uses the same OneBlock and phase, and everyone keeps their own coins.`,
    "",
    `§fOwner: §e${record.name}`,
  ];
  if (members.length === 0) lines.push("§7No co-op members yet.");
  for (const m of members) lines.push(`§fMember: §e${m.name}`);
  const form = new ActionFormData().title("§6§lCo-op Island").body(lines.join("\n"));
  if (owner) form.button("Invite a Player").button("Remove a Member");
  else form.button("Leave Co-op");
  form.button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (owner && res.selection === 0) await invitePlayer(player, slot, record);
  else if (owner && res.selection === 1) await removeMember(player, slot);
  else if (!owner && res.selection === 0) return (await leaveCoop(player, slot)) ? undefined : "coop";
  else return "menu";
  return "coop";
}

async function giftCoins(player) {
  if (isCreative(player)) return say(player, "Players in Creative mode cannot send gifts.", false);
  const people = islandPeople(player.id);
  if (people.length === 0) return say(player, "There is nobody to send a gift to yet.", false);
  const form = new ModalFormData()
    .title("§6§lSend Coins")
    .dropdown("Send to", people.map(labelOf))
    .textField(`Amount (you have ${coinsOf(player.id)} ${COIN_NAME})`, "e.g. 50");
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return undefined;
  const target = people[res.formValues[0]];
  const amount = Number(String(res.formValues[1] ?? "").trim());
  if (!target || !Number.isInteger(amount) || amount < 1) return say(player, "Enter a whole number of coins.", false);
  if (amount > coinsOf(player.id)) return say(player, `You only have ${coinsOf(player.id)} ${COIN_NAME}.`, false);
  addCoins(player.id, -amount);
  addCoins(target.id, amount);
  say(player, `Sent ${amount} ${COIN_NAME} to ${target.name}.`);
  if (!notify(target.id, `${player.name} sent you ${amount} ${COIN_NAME}.`)) addEarned(target.id, amount);
  return undefined;
}

async function giftItem(player) {
  if (isCreative(player)) return say(player, "Players in Creative mode cannot send gifts.", false);
  const people = islandPeople(player.id);
  if (people.length === 0) return say(player, "There is nobody to send a gift to yet.", false);
  const items = plainInventory(player);
  if (items.length === 0) return say(player, "You carry no items that can be sent.", false);
  const form = new ModalFormData()
    .title("§6§lSend Item")
    .dropdown("Send to", people.map(labelOf))
    .dropdown("Item", items.map((i) => `${niceName(i.id)} (x${i.amount})`))
    .textField("Amount (empty = all)", "e.g. 16");
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return undefined;
  const target = people[res.formValues[0]];
  const item = items[res.formValues[1]];
  const text = String(res.formValues[2] ?? "").trim();
  const amount = text === "" ? item?.amount : Number(text);
  if (!target || !item || !Number.isInteger(amount) || amount < 1 || amount > item.amount) {
    return say(player, `Enter a whole amount from 1 to ${item?.amount ?? 1}.`, false);
  }
  if (!removePlain(player, item.id, amount)) return say(player, "Could not take the items from your inventory.", false);
  deliver(target.id, item.id, amount);
  say(player, `Sent ${amount}x ${niceName(item.id)} to ${target.name}.`);
  notify(target.id, `${player.name} sent you ${amount}x ${niceName(item.id)}.`);
  return undefined;
}

async function screenGift(player) {
  const form = new ActionFormData()
    .title("§6§lSend a Gift")
    .body("§7Send coins or items to another island player, online or offline.")
    .button("Send Coins")
    .button("Send Item")
    .button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection === 0) await giftCoins(player);
  else if (res.selection === 1) await giftItem(player);
  else return "menu";
  return "gift";
}

const reqKey = (id) => PROP.REQ_PREFIX + id;

function readReqIds() {
  return readJson(world, PROP.REQ_IDS, []);
}

function writeReqIds(list) {
  writeJson(world, PROP.REQ_IDS, list);
}

function nextReqId() {
  const current = world.getDynamicProperty(PROP.REQ_SEQ);
  const id = (typeof current === "number" ? current : 0) + 1;
  world.setDynamicProperty(PROP.REQ_SEQ, id);
  return id;
}

function dropRequest(id) {
  world.setDynamicProperty(reqKey(id), undefined);
  writeReqIds(readReqIds().filter((x) => x !== id));
}

function allRequests() {
  const now = world.getAbsoluteTime();
  const ids = readReqIds();
  const found = [];
  const keep = [];
  for (const id of ids) {
    const req = readJson(world, reqKey(id), undefined);
    if (!req) continue;
    if (now - req.created >= OFFER_LIFETIME_TICKS) {
      addCoins(req.buyer, req.price);
      world.setDynamicProperty(reqKey(id), undefined);
      const buyer = findPlayer(req.buyer);
      if (buyer) say(buyer, `Your buy request for ${req.give.amount}x ${niceName(req.give.id)} expired. ${req.price} ${COIN_NAME} returned.`);
      else addEarned(req.buyer, req.price);
      continue;
    }
    found.push(req);
    keep.push(id);
  }
  if (keep.length !== ids.length) writeReqIds(keep);
  return found.sort((a, b) => b.id - a.id);
}

async function createRequest(player) {
  const all = allRequests();
  if (all.length >= MAX_REQUESTS_TOTAL) return say(player, "The request board is full. Try again later.", false);
  if (all.filter((r) => r.buyer === player.id).length >= MAX_REQUESTS_PER_PLAYER) {
    return say(player, `You can have at most ${MAX_REQUESTS_PER_PLAYER} requests open at once.`, false);
  }
  const form = new ModalFormData()
    .title("§6§lNew Buy Request")
    .textField("Item name", "e.g. pumpkin")
    .textField("Amount", "e.g. 32")
    .textField(`Total price in ${COIN_NAME} (empty = recommended)`, "e.g. 100");
  const res = await ask(form, player);
  if (!res || res.canceled || !res.formValues) return undefined;
  const itemId = normalizeId(res.formValues[0]);
  if (!isValidItem(itemId) || itemId === LEDGER_ID) return say(player, "That is not an item that can be requested.", false);
  const amountText = String(res.formValues[1] ?? "").trim();
  const amount = amountText === "" ? priceInfo(itemId).amount : Number(amountText);
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TRADE_AMOUNT) {
    return say(player, `The amount must be a whole number from 1 to ${MAX_TRADE_AMOUNT}.`, false);
  }
  const rec = recommendedTotal(itemId, amount);
  const priceText = String(res.formValues[2] ?? "").trim();
  const price = priceText === "" ? rec : Number(priceText);
  if (!Number.isInteger(price) || price < 1 || price > MAX_PRICE) {
    return say(player, `The price must be a whole number of ${COIN_NAME} from 1 to ${MAX_PRICE}.`, false);
  }
  if (priceInfo(itemId).listed) {
    const low = Math.max(1, Math.ceil(rec * PRICE_MIN_RATIO));
    const high = Math.floor(rec * PRICE_MAX_RATIO);
    if (price < low || price > high) {
      return say(player, `For ${amount}x ${niceName(itemId)} the price must be between ${low} and ${high} ${COIN_NAME}.`, false);
    }
  }
  if (coinsOf(player.id) < price) {
    return say(player, `You need ${price} ${COIN_NAME} to post this request. They are held until it is filled or cancelled.`, false);
  }
  addCoins(player.id, -price);
  const id = nextReqId();
  writeJson(world, reqKey(id), {
    id,
    buyer: player.id,
    buyerName: player.name,
    give: { id: itemId, amount },
    price,
    created: world.getAbsoluteTime(),
  });
  writeReqIds([...readReqIds(), id]);
  say(player, `Request posted: ${amount}x ${niceName(itemId)} for ${price} ${COIN_NAME}. The coins are held until it is filled or cancelled.`);
  return undefined;
}

function fillRequest(player, id) {
  const req = readJson(world, reqKey(id), undefined);
  if (!req) return say(player, "That request is no longer available.", false);
  if (req.buyer === player.id) return say(player, "You cannot fill your own request.", false);
  if (isCreative(player)) return say(player, "Players in Creative mode cannot sell items.", false);
  if (countPlain(player, req.give.id) < req.give.amount) {
    return say(player, `You need ${req.give.amount}x ${niceName(req.give.id)} without custom changes.`, false);
  }
  if (!removePlain(player, req.give.id, req.give.amount)) return say(player, "Could not take the items from your inventory.", false);
  dropRequest(id);
  const net = req.price - Math.floor(req.price * MARKET_FEE_RATIO);
  addCoins(player.id, net);
  deliver(req.buyer, req.give.id, req.give.amount);
  notify(req.buyer, `${player.name} filled your request for ${req.give.amount}x ${niceName(req.give.id)}.`);
  say(player, `You received ${net} ${COIN_NAME} after the market fee.`);
  awardTradeBonus(player.id, req.buyer);
  return undefined;
}

async function screenFill(player, id) {
  const req = readJson(world, reqKey(id), undefined);
  if (!req) {
    say(player, "That request is no longer available.", false);
    return "requests";
  }
  const net = req.price - Math.floor(req.price * MARKET_FEE_RATIO);
  const lines = [
    `§fRequested by: §e${req.buyerName}`,
    `§fYou give: §e${req.give.amount}x ${niceName(req.give.id)}`,
    `§fYou receive: §e${net} ${COIN_NAME} §7(after the market fee)`,
    `§7You carry: ${countPlain(player, req.give.id)}x ${niceName(req.give.id)}`,
  ];
  const form = new ActionFormData().title("§6§lFill Request").body(lines.join("\n")).button("Fill Request").button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection === 0) fillRequest(player, id);
  return "requests";
}

async function screenBrowse(player) {
  const list = allRequests()
    .filter((r) => r.buyer !== player.id)
    .slice(0, REQUEST_LIST_LIMIT);
  if (list.length === 0) {
    say(player, "There are no buy requests from other players right now.", false);
    return "requests";
  }
  const form = new ActionFormData().title("§6§lBuy Requests").body("§7Pick a request to fill it from your inventory.");
  for (const r of list) form.button(`${r.give.amount}x ${niceName(r.give.id)} for ${r.price} ${COIN_NAME}\n§8${r.buyerName}`);
  form.button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection >= list.length) return "requests";
  return screenFill(player, list[res.selection].id);
}

async function screenMine(player) {
  const list = allRequests().filter((r) => r.buyer === player.id);
  if (list.length === 0) {
    say(player, "You have no open buy requests.", false);
    return "requests";
  }
  const form = new ActionFormData().title("§6§lMy Requests").body("§7Pick a request to cancel it and get your coins back.");
  for (const r of list) form.button(`${r.give.amount}x ${niceName(r.give.id)} for ${r.price} ${COIN_NAME}`);
  form.button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection >= list.length) return "requests";
  const req = list[res.selection];
  const confirm = new ActionFormData()
    .title("§6§lCancel Request")
    .body(`§7Cancel your request for ${req.give.amount}x ${niceName(req.give.id)} and get ${req.price} ${COIN_NAME} back?`)
    .button("Cancel Request")
    .button("Keep");
  const answer = await ask(confirm, player);
  if (answer && !answer.canceled && answer.selection === 0 && readJson(world, reqKey(req.id), undefined)) {
    dropRequest(req.id);
    addCoins(player.id, req.price);
    say(player, `Request cancelled. ${req.price} ${COIN_NAME} returned.`);
  }
  return "requests";
}

async function screenRequests(player) {
  const form = new ActionFormData()
    .title("§6§lBuy Requests")
    .body("§7Post what you need and other players can fill it. Your coins are held until it is filled or cancelled.")
    .button("Browse Requests")
    .button("New Request")
    .button("My Requests")
    .button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection === 0) return screenBrowse(player);
  if (res.selection === 1) {
    await createRequest(player);
    return "requests";
  }
  if (res.selection === 2) return screenMine(player);
  return "menu";
}

async function screenMenu(player) {
  const form = new ActionFormData()
    .title("§6§lFriends & Co-op")
    .body("§7Visit islands, share yours, send gifts and trade with requests.")
    .button("Visit an Island")
    .button("Trusted Players")
    .button("Co-op Island")
    .button("Send a Gift")
    .button("Buy Requests")
    .button("Back");
  const res = await ask(form, player);
  if (!res || res.canceled) return undefined;
  return ["visit", "trust", "coop", "gift", "requests", "back"][res.selection];
}

export async function openSocial(player, start = "menu") {
  let state = start;
  while (state) {
    const p = findPlayer(player.id);
    if (!p) return undefined;
    switch (state) {
      case "menu":
        state = await screenMenu(p);
        break;
      case "visit":
        state = await screenVisit(p);
        break;
      case "trust":
        state = await screenTrust(p);
        break;
      case "coop":
        state = await screenCoop(p);
        break;
      case "gift":
        state = await screenGift(p);
        break;
      case "requests":
        state = await screenRequests(p);
        break;
      case "back":
        return BACK;
      default:
        state = undefined;
    }
  }
  return undefined;
}
