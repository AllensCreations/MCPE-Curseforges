import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import {
    loadListings, saveListings, newListingId, resolveItemId, prettyName,
    getSellableSummary, countItem, removeItem, giveItem,
    findOnlinePlayer, routePayment, tryQueuePayout,
} from "./trade_storage.js";
import { CATEGORIES, SORTS, POPULAR_PAYMENTS, iconFor, categoryOf, timeAgo } from "./trade_catalog.js";

const TRADE_BOOKS = new Set(["minecraft:book", "minecraft:writable_book"]);
const BOOK_NAME = "player trade";
const MAX_WANT = 2304;
const PAGE_SIZE = 8;
const activeUsers = new Set();

const sleep = (ticks) => new Promise((res) => system.runTimeout(res, ticks));
const bar = (player, msg) => player.onScreenDisplay.setActionBar(msg);

async function showForm(form, player) {
    for (let i = 0; i < 30; i++) {
        const res = await form.show(player);
        if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
            await sleep(10);
            continue;
        }
        return res;
    }
    return { canceled: true };
}

function parseInt10(text, min, max) {
    const s = String(text ?? "").trim();
    if (!/^\d+$/.test(s)) return undefined;
    const n = Number(s);
    return n >= min && n <= max ? n : undefined;
}

export function registerTradeUI() {
    world.afterEvents.itemUse.subscribe((event) => {
        const player = event.source;
        const item = event.itemStack;
        if (!item || !TRADE_BOOKS.has(item.typeId)) return;
        if (item.nameTag?.trim().toLowerCase() !== BOOK_NAME) return;
        if (activeUsers.has(player.id)) return;

        activeUsers.add(player.id);
        showMainMenu(player)
            .catch((e) => console.warn(`[ALN:GlobalMarket] ${e}`))
            .finally(() => activeUsers.delete(player.id));
    });
}

async function showMainMenu(player) {
    while (true) {
        const all = loadListings();
        const mine = all.filter((l) => l.sellerId === player.id).length;

        const form = new ActionFormData()
            .title("§6§lALN:GlobalMarket")
            .header("§6§lGLOBAL MARKET")
            .label(`§7Welcome, §f${player.name}§7! Trade safely with every player on the server.`)
            .divider()
            .label(`§7Active Market Listings: §e${all.length}\n§7Your Listings: §a${mine}`)
            .divider()
            .button("§a§lSell\n§r§7List an item for barter", "textures/items/emerald")
            .button("§b§lPurchase\n§r§7Browse the marketplace", "textures/items/diamond")
            .button("§e§lAbout\n§r§7How the market works", "textures/items/book_normal")
            .button("§c§lExit", "textures/ui/cancel");

        const res = await showForm(form, player);
        if (res.canceled || res.selection === 3) return;

        if (res.selection === 0) await showSell(player);
        else if (res.selection === 1) await showPurchase(player);
        else if (res.selection === 2) await showAbout(player);
    }
}

async function showSell(player, prefill = {}) {
    const entries = [...getSellableSummary(player).entries()];
    if (entries.length === 0) {
        bar(player, "§c[PlayerTrade] §fYou have no sellable items (enchanted, renamed or damaged items are excluded).");
        return;
    }

    const itemLabels = entries.map(([id, n]) => `${prettyName(id)} §8(x${n})`);
    const payLabels = POPULAR_PAYMENTS.map(prettyName);

    const form = new ModalFormData()
        .title("§a§lCreate Trade Listing")
        .dropdown("§a§l1. §r§aItem to Sell §7(from your inventory)", itemLabels, { defaultValueIndex: prefill.item ?? 0 })
        .textField("§a§l2. §r§aQuantity to Sell", "e.g., 16", { defaultValue: prefill.sellAmt ?? "1" })
        .dropdown("§b§l3. §r§bPayment Wanted §7(popular items)", payLabels, { defaultValueIndex: prefill.pay ?? 0 })
        .textField("§b§l4. §r§bOr Type Any Item §7(overrides the list above)", "e.g., netherite_ingot", { defaultValue: prefill.custom ?? "" })
        .textField("§b§l5. §r§bPayment Quantity", "e.g., 2", { defaultValue: prefill.wantAmt ?? "1" })
        .submitButton("Post Trade Listing");

    const res = await showForm(form, player);
    if (res.canceled) return;

    const [itemIdx, sellRaw, payIdx, customRaw, wantAmtRaw] = res.formValues;
    const retry = (msg) => {
        bar(player, `§c[PlayerTrade] §f${msg}`);
        return showSell(player, { item: itemIdx, sellAmt: sellRaw, pay: payIdx, custom: customRaw, wantAmt: wantAmtRaw });
    };

    const [sellTypeId] = entries[itemIdx];
    const available = countItem(player, sellTypeId);
    const sellAmount = parseInt10(sellRaw, 1, available);
    if (sellAmount === undefined) return retry(`Quantity to sell must be a whole number from 1 to ${available}.`);

    const custom = String(customRaw ?? "").trim();
    const wantTypeId = custom ? resolveItemId(custom) : POPULAR_PAYMENTS[payIdx];
    if (!wantTypeId) return retry(`"${custom}" is not a valid item. Try diamond, emerald, iron_ingot...`);

    const wantAmount = parseInt10(wantAmtRaw, 1, MAX_WANT);
    if (wantAmount === undefined) return retry(`Payment quantity must be a whole number from 1 to ${MAX_WANT}.`);

    if (!removeItem(player, sellTypeId, sellAmount)) return retry("Could not take the items from your inventory.");

    const listing = {
        id: newListingId(),
        sellerId: player.id,
        sellerName: player.name,
        sellTypeId,
        sellDisplayName: prettyName(sellTypeId),
        sellAmount,
        wantTypeId,
        wantDisplayName: prettyName(wantTypeId),
        wantAmount,
        timestamp: Date.now(),
    };

    const listings = loadListings();
    listings.push(listing);
    if (!saveListings(listings)) {
        giveItem(player, sellTypeId, sellAmount);
        bar(player, "§c[PlayerTrade] §fThe market is full right now. Your items were returned.");
        return;
    }

    player.playSound("random.orb");
    for (const p of world.getAllPlayers()) {
        bar(p, `§6[PlayerTrade] §f${player.name} listed §e${sellAmount}x ${listing.sellDisplayName} §ffor §b${wantAmount}x ${listing.wantDisplayName}`);
    }
}

function applyFilters(all, st, player, have) {
    const q = st.search.trim().toLowerCase();
    const out = all.filter((l) => {
        if (st.mine && l.sellerId !== player.id) return false;
        if (st.category > 0 && categoryOf(l.sellTypeId) !== st.category) return false;
        if (st.afford && (l.sellerId === player.id || (have.get(l.wantTypeId) ?? 0) < l.wantAmount)) return false;
        if (q) {
            const hit = l.sellDisplayName.toLowerCase().includes(q)
                || l.sellTypeId.includes(q.replace(/\s+/g, "_"))
                || l.sellerName.toLowerCase().includes(q);
            if (!hit) return false;
        }
        return true;
    });
    const sorters = [
        (a, b) => b.timestamp - a.timestamp,
        (a, b) => a.timestamp - b.timestamp,
        (a, b) => a.sellDisplayName.localeCompare(b.sellDisplayName),
        (a, b) => a.sellerName.localeCompare(b.sellerName),
    ];
    return out.sort(sorters[st.sort]);
}

async function showPurchase(player) {
    const st = { category: 0, sort: 0, search: "", mine: false, afford: false, page: 0 };

    while (true) {
        const all = loadListings();
        const have = getSellableSummary(player);
        const mineCount = all.filter((l) => l.sellerId === player.id).length;
        const list = applyFilters(all, st, player, have);
        const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
        st.page = Math.min(st.page, pages - 1);
        const slice = list.slice(st.page * PAGE_SIZE, (st.page + 1) * PAGE_SIZE);

        const active = [`§f${CATEGORIES[st.category]}`, `§f${SORTS[st.sort]}`];
        if (st.search.trim()) active.push(`§fSearch: "${st.search.trim()}"`);
        if (st.mine) active.push("§fMy listings");
        if (st.afford) active.push("§fAffordable");

        const form = new ActionFormData()
            .title("§b§lGlobal Market")
            .header("§b§lMARKETPLACE")
            .label(`§7Showing §e${list.length}§7 of §e${all.length}§7 listings  §8|  §7Page §e${st.page + 1}§7/§e${pages}\n§7${active.join("§8 • §7")}`);

        const actions = [];
        const add = (text, icon, fn) => { form.button(text, icon); actions.push(fn); };

        add("§l§9Filters & Search\n§r§7Category, sort, find items", "textures/items/compass", async () => {
            await showFilters(player, st);
        });
        add(`§l§6My Listings\n§r§7${mineCount} active`, "textures/items/name_tag", async () => {
            st.mine = !st.mine;
            st.page = 0;
        });

        form.divider();
        if (slice.length === 0) {
            form.label("§7No listings match your filters. Try changing the category or search.");
        }
        for (const l of slice) {
            const canPay = l.sellerId !== player.id && (have.get(l.wantTypeId) ?? 0) >= l.wantAmount;
            const priceColor = l.sellerId === player.id ? "§e" : canPay ? "§a" : "§c";
            add(
                `§f§l${l.sellAmount}x ${l.sellDisplayName}\n§r§7Wants ${priceColor}${l.wantAmount}x ${l.wantDisplayName} §8| §7${l.sellerName}`,
                iconFor(l.sellTypeId),
                async () => { await showListingDetail(player, l.id); }
            );
        }

        form.divider();
        if (st.page > 0) add("§7< Previous Page", undefined, async () => { st.page--; });
        if (st.page < pages - 1) add("§7Next Page >", undefined, async () => { st.page++; });
        add("§7Back to Menu", "textures/ui/cancel", async () => "back");

        const res = await showForm(form, player);
        if (res.canceled) return;
        const result = await actions[res.selection]?.();
        if (result === "back") return;
    }
}

async function showFilters(player, st) {
    const form = new ModalFormData()
        .title("§9§lFilters & Search")
        .dropdown("§l§9Category", CATEGORIES, { defaultValueIndex: st.category })
        .dropdown("§l§9Sort By", SORTS, { defaultValueIndex: st.sort })
        .textField("§l§9Search §r§7(item or seller name)", "e.g., diamond", { defaultValue: st.search })
        .toggle("§aOnly my listings", { defaultValue: st.mine })
        .toggle("§aOnly what I can afford", { defaultValue: st.afford })
        .submitButton("Apply");

    const res = await showForm(form, player);
    if (res.canceled) return;
    [st.category, st.sort, st.search, st.mine, st.afford] = res.formValues;
    st.search = String(st.search ?? "");
    st.page = 0;
}

async function showListingDetail(player, listingId) {
    const l = loadListings().find((x) => x.id === listingId);
    if (!l) {
        bar(player, "§c[PlayerTrade] §fThat listing is no longer available.");
        return;
    }
    const own = l.sellerId === player.id;
    const have = countItem(player, l.wantTypeId);
    const haveColor = have >= l.wantAmount ? "§a" : "§c";

    const form = new ActionFormData()
        .title(own ? "§6§lYour Listing" : "§b§lListing Details")
        .header(`§f§l${l.sellAmount}x ${l.sellDisplayName}`)
        .label(`§7Category: §f${CATEGORIES[categoryOf(l.sellTypeId)]}\n§7Seller: §e${l.sellerName}${own ? " §7(you)" : ""}\n§7Listed: §f${timeAgo(l.timestamp)}`)
        .divider()
        .label(`§7Price: §b${l.wantAmount}x ${l.wantDisplayName}\n§7You have: ${haveColor}${have}§7 / §f${l.wantAmount}`)
        .divider();

    if (own) form.button("§c§lCancel Listing\n§r§7Reclaim your escrow items", "textures/ui/cancel");
    else form.button(`§a§lBuy Now\n§r§7Pay ${l.wantAmount}x ${l.wantDisplayName}`, iconFor(l.sellTypeId));
    form.button("§7Back to Market");

    const res = await showForm(form, player);
    if (res.canceled || res.selection !== 0) return;

    if (own) cancelListing(player, l.id);
    else attemptPurchase(player, l.id);
}

function cancelListing(player, listingId) {
    const listings = loadListings();
    const idx = listings.findIndex((l) => l.id === listingId && l.sellerId === player.id);
    if (idx < 0) {
        bar(player, "§c[PlayerTrade] §fThat listing is no longer available.");
        return;
    }
    const [l] = listings.splice(idx, 1);
    if (!saveListings(listings)) {
        bar(player, "§c[PlayerTrade] §fCould not cancel the listing. Try again.");
        return;
    }
    giveItem(player, l.sellTypeId, l.sellAmount);
    player.playSound("random.orb");
    bar(player, `§a[PlayerTrade] §fListing cancelled. Reclaimed ${l.sellAmount}x ${l.sellDisplayName}.`);
}

function attemptPurchase(buyer, listingId) {
    const listings = loadListings();
    const idx = listings.findIndex((l) => l.id === listingId);
    if (idx < 0) {
        bar(buyer, "§c[PlayerTrade] §fThat listing is no longer available.");
        return;
    }
    const l = listings[idx];
    if (l.sellerId === buyer.id) return;

    if (countItem(buyer, l.wantTypeId) < l.wantAmount) {
        bar(buyer, `§c[PlayerTrade] §fYou need §b${l.wantAmount}x ${l.wantDisplayName} §fto buy this!`);
        return;
    }
    if (!findOnlinePlayer(l.sellerId) && !tryQueuePayout(l, buyer.name, false)) {
        bar(buyer, "§c[PlayerTrade] §fThe seller's payout vault is full. Try again later.");
        return;
    }

    if (!removeItem(buyer, l.wantTypeId, l.wantAmount)) {
        bar(buyer, "§c[PlayerTrade] §fPayment failed. No items were taken.");
        return;
    }
    listings.splice(idx, 1);
    if (!saveListings(listings)) {
        giveItem(buyer, l.wantTypeId, l.wantAmount);
        bar(buyer, "§c[PlayerTrade] §fTrade failed. Your payment was returned.");
        return;
    }

    giveItem(buyer, l.sellTypeId, l.sellAmount);
    routePayment(l, buyer.name);
    buyer.playSound("random.levelup");
    bar(buyer, `§a[PlayerTrade] §fBought ${l.sellAmount}x ${l.sellDisplayName} for ${l.wantAmount}x ${l.wantDisplayName}!`);
}

async function showAbout(player) {
    const form = new ActionFormData()
        .title("§e§lAbout ALN:GlobalMarket")
        .header("§6§lHOW IT WORKS")
        .label("§eEscrow\n§fItems you list leave your inventory and are held safely until sold or cancelled.")
        .divider()
        .label("§eItem IDs\n§fType friendly names like §bdiamond§f, §bemerald§f, §biron_ingot§f or §bminecraft:diamond§f.")
        .divider()
        .label("§eCancel a Listing\n§fOpen §bPurchase§f, tap §6My Listings§f, choose your listing, then Cancel Listing.")
        .divider()
        .label("§ePayouts\n§fIf the seller is offline, payment is vaulted and delivered when they next join.")
        .divider()
        .label("§7Only unmodified items can be traded (no enchanted, renamed, damaged, potion or container items).\n\n§8Made by §7ALNStudios")
        .button("§7Back to Menu", "textures/ui/cancel");
    await showForm(form, player);
}
