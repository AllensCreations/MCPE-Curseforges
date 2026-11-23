import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import { PAGE_SIZE, MAX_LISTINGS_PER_PLAYER, PROP } from "./config.js";
import { slotOf, slotCoords, recordOf, recordOfPlayerId } from "./slots.js";
import { traitInfo, traitLabel } from "./traits.js";
import { phaseIndexFor, phaseLabel, breaksToNextPhase } from "./phases.js";
import { globalBreaks } from "./island.js";
import {
  allListings,
  listingsOf,
  getListing,
  createListing,
  cancelListing,
  buyListing,
  payoutSummary,
  collectPayout,
} from "./market.js";
import { findPlayer, wait, niceName, normalizeId, plainInventory, countPlain } from "./util.js";
import { promptWelcome } from "./welcome.js";

const GOODS = [
  "minecraft:iron_ingot",
  "minecraft:raw_iron",
  "minecraft:copper_ingot",
  "minecraft:gold_ingot",
  "minecraft:coal",
  "minecraft:redstone",
  "minecraft:lapis_lazuli",
  "minecraft:diamond",
  "minecraft:emerald",
  "minecraft:wheat",
  "minecraft:carrot",
  "minecraft:potato",
  "minecraft:beetroot",
  "minecraft:pumpkin",
  "minecraft:melon_slice",
  "minecraft:sweet_berries",
  "minecraft:sugar_cane",
  "minecraft:oak_log",
  "minecraft:birch_log",
  "minecraft:spruce_log",
  "minecraft:stick",
  "minecraft:apple",
  "minecraft:cod",
  "minecraft:salmon",
  "minecraft:ink_sac",
  "minecraft:nautilus_shell",
  "minecraft:name_tag",
  "minecraft:leather",
  "minecraft:beef",
  "minecraft:porkchop",
  "minecraft:white_wool",
  "minecraft:feather",
  "minecraft:egg",
  "minecraft:bone",
  "minecraft:glowstone_dust",
  "minecraft:nether_wart",
  "minecraft:quartz",
  "minecraft:blaze_rod",
  "minecraft:obsidian",
];

const HUB_TITLE = "§6§lGlobal Trade Hub";

async function show(form, player) {
  for (let i = 0; i < 6; i++) {
    let res;
    try {
      res = await form.show(player);
    } catch (e) {
      return undefined;
    }
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
      await wait(10);
      continue;
    }
    return res;
  }
  return undefined;
}

function sellerTrait(sellerId) {
  const found = recordOfPlayerId(sellerId);
  return found ? traitLabel(found.record.trait) : "§7Unknown";
}

function offerText(l) {
  return `${l.give.amount}x ${niceName(l.give.id)}  §8for§r  ${l.want.amount}x ${niceName(l.want.id)}`;
}

function matches(listing, filter) {
  if (!filter) return true;
  const f = filter.toLowerCase();
  return (
    niceName(listing.give.id).toLowerCase().includes(f) ||
    niceName(listing.want.id).toLowerCase().includes(f) ||
    listing.sellerName.toLowerCase().includes(f)
  );
}

async function screenMain(player) {
  const slot = slotOf(player);
  const record = recordOf(slot);
  const offers = allListings().filter((l) => l.seller !== player.id).length;
  const mine = listingsOf(player.id).length;
  const owed = payoutSummary(player.id).reduce((sum, e) => sum + e.amount, 0);
  const phase = phaseIndexFor(globalBreaks());
  const form = new ActionFormData()
    .title(HUB_TITLE)
    .body(
      `§7Island #${slot} §8| ${traitLabel(record.trait)}\n§7World phase: ${phaseLabel(phase)}\n\n§fTrade surplus items with every island on the grid, no market building needed.`
    )
    .button(`Browse Offers\n§8${offers} open`)
    .button("Create Offer")
    .button(`My Offers\n§8${mine} / ${MAX_LISTINGS_PER_PLAYER}`)
    .button(`Collect Earnings\n§8${owed} items waiting`)
    .button("My Island")
    .button("Close");
  const res = await show(form, player);
  if (!res || res.canceled) return undefined;
  const next = ["browse", "create", "mine", "collect", "island"][res.selection];
  return next ? { name: next, page: 0, filter: "" } : undefined;
}

async function screenBrowse(player, state) {
  const all = allListings().filter((l) => l.seller !== player.id && matches(l, state.filter));
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const page = Math.min(state.page, pages - 1);
  const slice = all.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const filterNote = state.filter ? `\n§7Search: §f${state.filter}` : "";
  const form = new ActionFormData()
    .title(HUB_TITLE)
    .body(`§7Page ${page + 1} of ${pages} §8| §7${all.length} offers${filterNote}`);
  for (const l of slice) form.button(`${offerText(l)}\n§8${l.sellerName} ${sellerTrait(l.seller)}`);
  const extras = [{ label: "Search", next: () => ({ name: "search", page: 0, filter: state.filter }) }];
  if (page > 0) extras.push({ label: "Previous Page", next: () => ({ name: "browse", page: page - 1, filter: state.filter }) });
  if (page < pages - 1) extras.push({ label: "Next Page", next: () => ({ name: "browse", page: page + 1, filter: state.filter }) });
  if (state.filter) extras.push({ label: "Clear Search", next: () => ({ name: "browse", page: 0, filter: "" }) });
  extras.push({ label: "Back", next: () => ({ name: "main", page: 0, filter: "" }) });
  for (const e of extras) form.button(e.label);
  const res = await show(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection < slice.length) {
    return { name: "confirm", id: slice[res.selection].id, page, filter: state.filter };
  }
  return extras[res.selection - slice.length].next();
}

async function screenSearch(player, state) {
  const form = new ModalFormData().title(HUB_TITLE).textField("Item or seller name", "e.g. pumpkin");
  const res = await show(form, player);
  if (!res || res.canceled) return { name: "browse", page: 0, filter: state.filter };
  const text = String(res.formValues?.[0] ?? "").trim();
  return { name: "browse", page: 0, filter: text };
}

async function screenConfirm(player, state) {
  const listing = getListing(state.id);
  if (!listing) {
    player.sendMessage("§6[ALN] §cThat offer is no longer available.");
    return { name: "browse", page: state.page, filter: state.filter };
  }
  const have = countPlain(player, listing.want.id);
  const form = new ActionFormData()
    .title(HUB_TITLE)
    .body(
      `§fYou receive: §a${listing.give.amount}x ${niceName(listing.give.id)}\n§fYou pay: §e${listing.want.amount}x ${niceName(listing.want.id)}\n§7You carry: ${have}x\n\n§7Seller: ${listing.sellerName} ${sellerTrait(listing.seller)}`
    )
    .button("Buy Now")
    .button("Back");
  const res = await show(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection === 0) {
    const result = buyListing(player, state.id);
    player.sendMessage(`§6[ALN] ${result.ok ? "§a" : "§c"}${result.message}`);
  }
  return { name: "browse", page: state.page, filter: state.filter };
}

async function screenCreate(player) {
  const inventory = plainInventory(player);
  if (inventory.length === 0) {
    player.sendMessage("§6[ALN] §cYou carry no plain items to sell.");
    return { name: "main", page: 0, filter: "" };
  }
  const form = new ModalFormData()
    .title(HUB_TITLE)
    .dropdown("Item to sell", inventory.map((e) => `${niceName(e.id)} (have ${e.amount})`))
    .textField("Amount to sell", "e.g. 32")
    .dropdown("Item you want", GOODS.map((id) => niceName(id)))
    .textField("Or type any other item name (optional)", "e.g. golden apple")
    .textField("Amount you want", "e.g. 16");
  const res = await show(form, player);
  if (!res || res.canceled || !res.formValues) return { name: "main", page: 0, filter: "" };
  const [giveIndex, giveText, wantIndex, wantCustom, wantText] = res.formValues;
  const give = inventory[giveIndex];
  const wantId = String(wantCustom ?? "").trim() ? normalizeId(wantCustom) : GOODS[wantIndex];
  const result = createListing(
    player,
    give.id,
    Number.parseInt(String(giveText).trim(), 10),
    wantId,
    Number.parseInt(String(wantText).trim(), 10)
  );
  player.sendMessage(`§6[ALN] ${result.ok ? "§a" : "§c"}${result.message}`);
  return { name: "main", page: 0, filter: "" };
}

async function screenMine(player, state) {
  const mine = listingsOf(player.id);
  const form = new ActionFormData()
    .title(HUB_TITLE)
    .body(mine.length ? "§7Select an offer to cancel it and get your items back." : "§7You have no open offers.");
  for (const l of mine) form.button(offerText(l));
  form.button("Back");
  const res = await show(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection >= mine.length) return { name: "main", page: 0, filter: "" };
  return { name: "cancel", id: mine[res.selection].id, page: 0, filter: "" };
}

async function screenCancel(player, state) {
  const listing = getListing(state.id);
  if (!listing) return { name: "mine", page: 0, filter: "" };
  const form = new ActionFormData()
    .title(HUB_TITLE)
    .body(`§fCancel this offer?\n§7${offerText(listing)}`)
    .button("Cancel Offer")
    .button("Keep It");
  const res = await show(form, player);
  if (!res || res.canceled) return undefined;
  if (res.selection === 0) {
    const result = cancelListing(player, state.id);
    player.sendMessage(`§6[ALN] ${result.ok ? "§a" : "§c"}${result.message}`);
  }
  return { name: "mine", page: 0, filter: "" };
}

function screenCollect(player) {
  const total = collectPayout(player);
  player.sendMessage(
    total > 0 ? `§6[ALN] §aCollected ${total} items from your sales.` : "§6[ALN] §7You have no earnings waiting."
  );
  return { name: "main", page: 0, filter: "" };
}

async function screenIsland(player) {
  const slot = slotOf(player);
  const record = recordOf(slot);
  const info = traitInfo(record.trait);
  const c = slotCoords(slot);
  const total = globalBreaks();
  const left = breaksToNextPhase(total);
  const mine = player.getDynamicProperty(PROP.BREAKS) ?? 0;
  const form = new ActionFormData()
    .title("§6§lMy Island")
    .body(
      [
        `§7Island #${slot} at X: ${c.x}, Z: ${c.z}`,
        `§fRichness: ${traitLabel(record.trait)}`,
        `§7${info.blurb}`,
        `§fBest goods to export: §7${info.goods}`,
        "",
        `§fWorld phase: ${phaseLabel(phaseIndexFor(total))}`,
        left > 0 ? `§7Next phase in ${left} OneBlock breaks.` : "§7The world is in its final phase.",
        `§7Your breaks: ${mine} §8| §7World breaks: ${total}`,
      ].join("\n")
    )
    .button("Back");
  const res = await show(form, player);
  if (!res || res.canceled) return undefined;
  return { name: "main", page: 0, filter: "" };
}

export async function openLedger(player) {
  if (slotOf(player) === undefined) {
    promptWelcome(player);
    return;
  }
  let state = { name: "main", page: 0, filter: "" };
  while (state) {
    const p = findPlayer(player.id);
    if (!p) return;
    switch (state.name) {
      case "main":
        state = await screenMain(p);
        break;
      case "browse":
        state = await screenBrowse(p, state);
        break;
      case "search":
        state = await screenSearch(p, state);
        break;
      case "confirm":
        state = await screenConfirm(p, state);
        break;
      case "create":
        state = await screenCreate(p);
        break;
      case "mine":
        state = await screenMine(p, state);
        break;
      case "cancel":
        state = await screenCancel(p, state);
        break;
      case "collect":
        state = screenCollect(p);
        break;
      case "island":
        state = await screenIsland(p);
        break;
      default:
        state = undefined;
    }
  }
}
