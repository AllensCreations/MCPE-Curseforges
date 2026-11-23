import { world } from "@minecraft/server";
import { PROP, MAX_LISTINGS_PER_PLAYER, MAX_LISTINGS_TOTAL, MAX_TRADE_AMOUNT } from "./config.js";
import {
  readJson,
  writeJson,
  countPlain,
  removePlain,
  giveItem,
  findPlayer,
  isValidItem,
  niceName,
} from "./util.js";

const listingKey = (id) => PROP.LISTING_PREFIX + id;
const payoutKey = (playerId) => PROP.PAYOUT_PREFIX + playerId;

function readIds() {
  return readJson(world, PROP.LISTING_IDS, []);
}

function writeIds(list) {
  writeJson(world, PROP.LISTING_IDS, list);
}

export function getListing(id) {
  return readJson(world, listingKey(id), undefined);
}

export function allListings() {
  const ids = readIds();
  const found = [];
  const keep = [];
  for (const id of ids) {
    const listing = getListing(id);
    if (!listing) continue;
    found.push(listing);
    keep.push(id);
  }
  if (keep.length !== ids.length) writeIds(keep);
  return found.sort((a, b) => b.id - a.id);
}

export function listingsOf(playerId) {
  return allListings().filter((l) => l.seller === playerId);
}

function dropListing(id) {
  world.setDynamicProperty(listingKey(id), undefined);
  writeIds(readIds().filter((x) => x !== id));
}

function nextId() {
  const current = world.getDynamicProperty(PROP.LISTING_SEQ);
  const id = (typeof current === "number" ? current : 0) + 1;
  world.setDynamicProperty(PROP.LISTING_SEQ, id);
  return id;
}

const fail = (message) => ({ ok: false, message });
const done = (message) => ({ ok: true, message });

export function createListing(player, giveId, giveAmount, wantId, wantAmount) {
  if (!Number.isInteger(giveAmount) || giveAmount < 1 || giveAmount > MAX_TRADE_AMOUNT) {
    return fail(`The amount you sell must be a whole number from 1 to ${MAX_TRADE_AMOUNT}.`);
  }
  if (!Number.isInteger(wantAmount) || wantAmount < 1 || wantAmount > MAX_TRADE_AMOUNT) {
    return fail(`The amount you want must be a whole number from 1 to ${MAX_TRADE_AMOUNT}.`);
  }
  if (!isValidItem(giveId)) return fail("The item you want to sell is not valid.");
  if (!isValidItem(wantId)) return fail("The item you asked for does not exist. Check the name.");
  if (giveId === wantId) return fail("Sell and ask for two different items.");
  const all = allListings();
  if (all.length >= MAX_LISTINGS_TOTAL) return fail("The Global Trade Hub is full. Try again later.");
  if (all.filter((l) => l.seller === player.id).length >= MAX_LISTINGS_PER_PLAYER) {
    return fail(`You can have at most ${MAX_LISTINGS_PER_PLAYER} offers open at once.`);
  }
  if (countPlain(player, giveId) < giveAmount) {
    return fail(`You only carry ${countPlain(player, giveId)}x ${niceName(giveId)} without custom changes.`);
  }
  if (!removePlain(player, giveId, giveAmount)) return fail("Could not take the items from your inventory.");
  const id = nextId();
  writeJson(world, listingKey(id), {
    id,
    seller: player.id,
    sellerName: player.name,
    give: { id: giveId, amount: giveAmount },
    want: { id: wantId, amount: wantAmount },
  });
  writeIds([...readIds(), id]);
  return done(
    `Offer posted: ${giveAmount}x ${niceName(giveId)} for ${wantAmount}x ${niceName(wantId)}. Your items are held safely until it sells.`
  );
}

export function cancelListing(player, id) {
  const listing = getListing(id);
  if (!listing) return fail("That offer is already gone.");
  if (listing.seller !== player.id) return fail("That offer is not yours.");
  dropListing(id);
  giveItem(player, listing.give.id, listing.give.amount);
  return done(`Offer cancelled. ${listing.give.amount}x ${niceName(listing.give.id)} returned to you.`);
}

function addPayout(playerId, itemId, amount) {
  const owed = readJson(world, payoutKey(playerId), {});
  owed[itemId] = (owed[itemId] ?? 0) + amount;
  writeJson(world, payoutKey(playerId), owed);
}

export function payoutSummary(playerId) {
  const owed = readJson(world, payoutKey(playerId), {});
  return Object.keys(owed).map((id) => ({ id, amount: owed[id] }));
}

export function collectPayout(player) {
  const list = payoutSummary(player.id);
  if (list.length === 0) return 0;
  world.setDynamicProperty(payoutKey(player.id), undefined);
  let total = 0;
  for (const entry of list) {
    giveItem(player, entry.id, entry.amount);
    total += entry.amount;
  }
  return total;
}

export function buyListing(buyer, id) {
  const listing = getListing(id);
  if (!listing) return fail("That offer is no longer available.");
  if (listing.seller === buyer.id) return fail("You cannot buy your own offer. Cancel it from My Listings.");
  const owned = countPlain(buyer, listing.want.id);
  if (owned < listing.want.amount) {
    return fail(`You need ${listing.want.amount}x ${niceName(listing.want.id)} (you have ${owned}).`);
  }
  if (!removePlain(buyer, listing.want.id, listing.want.amount)) return fail("Could not take the payment from your inventory.");
  dropListing(id);
  giveItem(buyer, listing.give.id, listing.give.amount);
  const seller = findPlayer(listing.seller);
  const summary = `${listing.want.amount}x ${niceName(listing.want.id)}`;
  if (seller) {
    giveItem(seller, listing.want.id, listing.want.amount);
    seller.sendMessage(`§6[ALN] §a${buyer.name} bought your offer. You received ${summary}.`);
  } else {
    addPayout(listing.seller, listing.want.id, listing.want.amount);
  }
  return done(`Trade complete: you received ${listing.give.amount}x ${niceName(listing.give.id)} for ${summary}.`);
}
