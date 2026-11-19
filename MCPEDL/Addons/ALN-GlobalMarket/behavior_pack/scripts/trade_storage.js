import { world, ItemStack, ItemTypes } from "@minecraft/server";

const LISTINGS_KEY = "aln_market_listings";
const PAYOUTS_KEY = "aln_market_payouts";
const MAX_JSON_LENGTH = 30000;
const INV_SLOTS = 36;

const UNSUPPORTED = /shulker_box|bundle|potion|tipped_arrow|banner|firework|filled_map|written_book|writable_book|goat_horn|decorated_pot|suspicious_/;

function readJson(key, fallback) {
    try {
        const raw = world.getDynamicProperty(key);
        if (typeof raw !== "string") return fallback;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    const json = JSON.stringify(value);
    if (json.length > MAX_JSON_LENGTH) return false;
    world.setDynamicProperty(key, json);
    return true;
}

export function loadListings() {
    const data = readJson(LISTINGS_KEY, []);
    return Array.isArray(data) ? data : [];
}
export function saveListings(listings) {
    return writeJson(LISTINGS_KEY, listings);
}
function loadPayouts() {
    const data = readJson(PAYOUTS_KEY, {});
    return Array.isArray(data) ? {} : data;
}
function savePayouts(map) {
    return writeJson(PAYOUTS_KEY, map);
}

export function newListingId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function normalizeItemId(raw) {
    if (typeof raw !== "string") return undefined;
    let id = raw.trim().toLowerCase().replace(/\s+/g, "_");
    if (!id) return undefined;
    if (!id.includes(":")) id = "minecraft:" + id;
    return id;
}

export function resolveItemId(raw) {
    const id = normalizeItemId(raw);
    if (!id) return undefined;
    try {
        return ItemTypes.get(id)?.id;
    } catch {
        return undefined;
    }
}

export function prettyName(typeId) {
    const [ns, name] = typeId.includes(":") ? typeId.split(":") : ["minecraft", typeId];
    const nice = name.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    return ns === "minecraft" ? nice : `${nice} (${ns})`;
}

export function getContainer(player) {
    return player.getComponent("minecraft:inventory").container;
}

export function isPlainItem(item) {
    if (!item || item.nameTag || UNSUPPORTED.test(item.typeId)) return false;
    if (item.getLore().length > 0) return false;
    const ench = item.getComponent("minecraft:enchantable");
    if (ench && ench.getEnchantments().length > 0) return false;
    const dur = item.getComponent("minecraft:durability");
    if (dur && dur.damage > 0) return false;
    return true;
}

export function getSellableSummary(player) {
    const container = getContainer(player);
    const summary = new Map();
    for (let i = 0; i < Math.min(container.size, INV_SLOTS); i++) {
        const item = container.getItem(i);
        if (!isPlainItem(item)) continue;
        summary.set(item.typeId, (summary.get(item.typeId) ?? 0) + item.amount);
    }
    return summary;
}

export function countItem(player, typeId) {
    return getSellableSummary(player).get(typeId) ?? 0;
}

export function removeItem(player, typeId, amount) {
    if (countItem(player, typeId) < amount) return false;
    const container = getContainer(player);
    let remaining = amount;
    for (let i = 0; i < Math.min(container.size, INV_SLOTS) && remaining > 0; i++) {
        const item = container.getItem(i);
        if (!item || item.typeId !== typeId || !isPlainItem(item)) continue;
        const take = Math.min(remaining, item.amount);
        if (take === item.amount) {
            container.setItem(i, undefined);
        } else {
            item.amount -= take;
            container.setItem(i, item);
        }
        remaining -= take;
    }
    return remaining === 0;
}

export function giveItem(player, typeId, amount) {
    const container = getContainer(player);
    const max = new ItemStack(typeId, 1).maxAmount;
    let remaining = amount;
    while (remaining > 0) {
        const n = Math.min(remaining, max);
        const overflow = container.addItem(new ItemStack(typeId, n));
        if (overflow) player.dimension.spawnItem(overflow, player.location);
        remaining -= n;
    }
}

export function findOnlinePlayer(playerId) {
    return world.getAllPlayers().find((p) => p.id === playerId);
}

function buildPayoutEntry(listing, buyerName) {
    return {
        typeId: listing.wantTypeId,
        amount: listing.wantAmount,
        name: listing.wantDisplayName,
        sold: listing.sellDisplayName,
        buyer: buyerName,
    };
}

export function tryQueuePayout(listing, buyerName, commit = true) {
    const map = loadPayouts();
    (map[listing.sellerId] ??= []).push(buildPayoutEntry(listing, buyerName));
    if (!commit) return JSON.stringify(map).length <= MAX_JSON_LENGTH;
    return savePayouts(map);
}

export function routePayment(listing, buyerName) {
    const seller = findOnlinePlayer(listing.sellerId);
    if (seller) {
        giveItem(seller, listing.wantTypeId, listing.wantAmount);
        seller.onScreenDisplay.setActionBar(
            `§a[PlayerTrade] §f${buyerName} bought your ${listing.sellDisplayName}! Received ${listing.wantAmount}x ${listing.wantDisplayName}!`
        );
        seller.playSound("random.levelup");
        return true;
    }
    return tryQueuePayout(listing, buyerName, true);
}

export function deliverPayouts(player) {
    const map = loadPayouts();
    const entries = map[player.id];
    if (!Array.isArray(entries) || entries.length === 0) return;

    delete map[player.id];
    if (!savePayouts(map)) return;

    for (const e of entries) {
        giveItem(player, e.typeId, e.amount);
        player.sendMessage(
            `§a[PlayerTrade] §f${e.buyer} bought your ${e.sold}! Received ${e.amount}x ${e.name}!`
        );
    }
    player.playSound("random.levelup");
}
