import { world } from "@minecraft/server";
import {
  PROP,
  MAX_LISTINGS_PER_PLAYER,
  MAX_LISTINGS_TOTAL,
  MAX_TRADE_AMOUNT,
  MAX_PRICE,
  PRICE_MIN_RATIO,
  PRICE_MAX_RATIO,
  STARTER_COINS,
  COIN_NAME,
  LEDGER_ID,
  MARKET_FEE_RATIO,
  OFFER_LIFETIME_TICKS,
  DAY_TICKS,
  TRADE_BONUS,
  TRADE_BONUS_TRAIT,
} from "./config.js";
import {
  readJson,
  writeJson,
  countPlain,
  removePlain,
  giveItem,
  findPlayer,
  isValidItem,
  niceName,
  isCreative,
} from "./util.js";
import { priceInfo, recommendedTotal, serverPayout } from "./prices.js";
import { recordOfPlayerId } from "./slots.js";

const listingKey = (id) => PROP.LISTING_PREFIX + id;
const payoutKey = (playerId) => PROP.PAYOUT_PREFIX + playerId;
const coinKey = (playerId) => PROP.COIN_PREFIX + playerId;

export function coinsOf(playerId) {
  const stored = world.getDynamicProperty(coinKey(playerId));
  return typeof stored === "number" ? stored : STARTER_COINS;
}

export function addCoins(playerId, amount) {
  world.setDynamicProperty(coinKey(playerId), coinsOf(playerId) + amount);
}

const earnedKey = (playerId) => PROP.EARNED_PREFIX + playerId;

export function addEarned(playerId, amount) {
  const current = world.getDynamicProperty(earnedKey(playerId));
  world.setDynamicProperty(earnedKey(playerId), (typeof current === "number" ? current : 0) + amount);
}

export function takeEarned(playerId) {
  const current = world.getDynamicProperty(earnedKey(playerId));
  if (typeof current !== "number" || current <= 0) return 0;
  world.setDynamicProperty(earnedKey(playerId), undefined);
  return current;
}

function readIds() {
  return readJson(world, PROP.LISTING_IDS, []);
}

function writeIds(list) {
  writeJson(world, PROP.LISTING_IDS, list);
}

export function addPayout(playerId, itemId, amount) {
  const owed = readJson(world, payoutKey(playerId), {});
  owed[itemId] = (owed[itemId] ?? 0) + amount;
  writeJson(world, payoutKey(playerId), owed);
}

export function getListing(id) {
  const listing = readJson(world, listingKey(id), undefined);
  return listing && typeof listing.price === "number" && listing.give?.id !== LEDGER_ID ? listing : undefined;
}

export function allListings() {
  const ids = readIds();
  const found = [];
  const keep = [];
  const now = world.getAbsoluteTime();
  for (const id of ids) {
    const listing = readJson(world, listingKey(id), undefined);
    if (!listing) continue;
    if (listing.give?.id === LEDGER_ID) {
      world.setDynamicProperty(listingKey(id), undefined);
      continue;
    }
    if (typeof listing.price !== "number") {
      addPayout(listing.seller, listing.give.id, listing.give.amount);
      world.setDynamicProperty(listingKey(id), undefined);
      continue;
    }
    if (typeof listing.created !== "number") {
      listing.created = now;
      writeJson(world, listingKey(id), listing);
    } else if (now - listing.created >= OFFER_LIFETIME_TICKS) {
      addPayout(listing.seller, listing.give.id, listing.give.amount);
      world.setDynamicProperty(listingKey(id), undefined);
      findPlayer(listing.seller)?.sendMessage(
        `§6[ALN] §eYour offer for ${listing.give.amount}x ${niceName(listing.give.id)} expired. Collect the items from Collect Returned Items.`
      );
      continue;
    }
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

export function createListing(player, itemId, amount, price) {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TRADE_AMOUNT) {
    return fail(`The amount you sell must be a whole number from 1 to ${MAX_TRADE_AMOUNT}.`);
  }
  if (!Number.isInteger(price) || price < 1 || price > MAX_PRICE) {
    return fail(`The price must be a whole number of ${COIN_NAME} from 1 to ${MAX_PRICE}.`);
  }
  if (!isValidItem(itemId)) return fail("The item you want to sell is not valid.");
  if (itemId === LEDGER_ID) return fail("The TRADERS Item cannot be sold.");
  if (isCreative(player)) return fail("Players in Creative mode cannot sell items.");
  if (priceInfo(itemId).listed) {
    const rec = recommendedTotal(itemId, amount);
    const low = Math.max(1, Math.ceil(rec * PRICE_MIN_RATIO));
    const high = Math.floor(rec * PRICE_MAX_RATIO);
    if (price < low || price > high) {
      return fail(
        `For ${amount}x ${niceName(itemId)} the price must be between ${low} and ${high} ${COIN_NAME} (recommended ${rec}).`
      );
    }
  }
  const all = allListings();
  if (all.length >= MAX_LISTINGS_TOTAL) return fail("The Global Trade Hub is full. Try again later.");
  if (all.filter((l) => l.seller === player.id).length >= MAX_LISTINGS_PER_PLAYER) {
    return fail(`You can have at most ${MAX_LISTINGS_PER_PLAYER} offers open at once.`);
  }
  if (countPlain(player, itemId) < amount) {
    return fail(`You only carry ${countPlain(player, itemId)}x ${niceName(itemId)} without custom changes.`);
  }
  if (!removePlain(player, itemId, amount)) return fail("Could not take the items from your inventory.");
  const id = nextId();
  writeJson(world, listingKey(id), {
    id,
    seller: player.id,
    sellerName: player.name,
    give: { id: itemId, amount },
    price,
    created: world.getAbsoluteTime(),
  });
  writeIds([...readIds(), id]);
  return done(
    `Offer posted: ${amount}x ${niceName(itemId)} for ${price} ${COIN_NAME}. Your items are held safely until it sells.`
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

export function awardTradeBonus(sellerId, buyerId) {
  const buyer = findPlayer(buyerId);
  if (buyer && isCreative(buyer)) return 0;
  const today = Math.floor(world.getAbsoluteTime() / DAY_TICKS);
  const key = PROP.DAILY_PREFIX + sellerId;
  if (world.getDynamicProperty(key) === today) return 0;
  world.setDynamicProperty(key, today);
  const sellerTraitId = recordOfPlayerId(sellerId)?.record.trait;
  const buyerTraitId = recordOfPlayerId(buyerId)?.record.trait;
  const bonus = TRADE_BONUS + (sellerTraitId && buyerTraitId && sellerTraitId !== buyerTraitId ? TRADE_BONUS_TRAIT : 0);
  addCoins(sellerId, bonus);
  const seller = findPlayer(sellerId);
  if (seller) seller.sendMessage(`§6[ALN] §aDaily trade bonus: +${bonus} ${COIN_NAME}.`);
  else addEarned(sellerId, bonus);
  return bonus;
}

export function buyListing(buyer, id) {
  const listing = getListing(id);
  if (!listing) return fail("That offer is no longer available.");
  if (listing.seller === buyer.id) return fail("You cannot buy your own offer. Cancel it from My Offers.");
  const balance = coinsOf(buyer.id);
  if (balance < listing.price) {
    return fail(`You need ${listing.price} ${COIN_NAME} (you have ${balance}).`);
  }
  const net = listing.price - Math.floor(listing.price * MARKET_FEE_RATIO);
  dropListing(id);
  addCoins(buyer.id, -listing.price);
  addCoins(listing.seller, net);
  giveItem(buyer, listing.give.id, listing.give.amount);
  awardTradeBonus(listing.seller, buyer.id);
  const seller = findPlayer(listing.seller);
  if (seller) {
    seller.sendMessage(`§6[ALN] §a${buyer.name} bought your offer. You received ${net} ${COIN_NAME} after the market fee.`);
  } else {
    addEarned(listing.seller, net);
  }
  return done(
    `Purchase complete: you received ${listing.give.amount}x ${niceName(listing.give.id)} for ${listing.price} ${COIN_NAME}.`
  );
}
export function sellToServer(player, itemId, amount) {
  if (isCreative(player)) return fail("Creative mode players cannot sell to the market.");
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TRADE_AMOUNT) {
    return fail(`The amount you sell must be a whole number from 1 to ${MAX_TRADE_AMOUNT}.`);
  }
  if (!priceInfo(itemId).listed) return fail("The market only buys items that have a recommended price.");
  const pay = serverPayout(itemId, amount);
  if (pay < 1) return fail(`That is worth less than 1 ${COIN_NAME} to the market. Sell a larger amount.`);
  if (countPlain(player, itemId) < amount) {
    return fail(`You only carry ${countPlain(player, itemId)}x ${niceName(itemId)} without custom changes.`);
  }
  if (!removePlain(player, itemId, amount)) return fail("Could not take the items from your inventory.");
  addCoins(player.id, pay);
  return done(`Sold ${amount}x ${niceName(itemId)} to the market for ${pay} ${COIN_NAME}.`);
}
