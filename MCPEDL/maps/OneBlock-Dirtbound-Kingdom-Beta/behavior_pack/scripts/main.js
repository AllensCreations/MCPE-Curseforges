import { world, system, ItemStack, ItemTypes, GameMode } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ORIGIN = { x: 0, y: 0, z: 0 };
const BONUS_POS = { x: 0, y: 1, z: 0 };
const OVERWORLD = "minecraft:overworld";
const REQUIRE_VOID_TAG = true;          // wait for a player with the "void_cleaned" tag
const ALWAYS_DROP_DIRT = 1;             // guaranteed dirt per core break (0 = off)
const BONUS_CHANCE = 1 / 100;            // chance per core break
const BONUS_LIFETIME_TICKS = 20 * 90;   // emerald despawns after 90s if nobody breaks it
const BONUS_FUNCTION = "bonus_spawn";   // optional bonus_spawn.mcfunction (falls back to setType)
const HUD_ENABLED = true;
const SHOP_ICONS = true;                // show item icons on shop buttons (set false if icons look wrong)
const MAX_BUY_QTY = 64;                 // max bundles per purchase
const CHEST_UI = true;                  // true = chest-grid menus (needs DirtboundTraderUI resource pack); false = standard list menus
const CHEST_PREFIX = "dbtrader:";       // must match the resource pack (ui/server_form.json)
const BACK_ICON = "textures/items/arrow";
const TIER_ICONS = [
  "textures/blocks/log_oak", "textures/items/stone_pickaxe", "textures/items/iron_pickaxe", "textures/items/minecart_normal",
  "textures/items/diamond", "textures/items/redstone_dust", "textures/items/blaze_rod", "textures/items/experience_bottle",
  "textures/items/elytra", "textures/items/netherite_ingot"
];
const CONFIRM_OVER = 200;               // purchases at or above this many coins ask for confirmation
// Block-items use a different texture folder than normal items. Add more here if an icon looks blank.
const ICON_OVERRIDES = {
  dirt: "textures/blocks/dirt", cobblestone: "textures/blocks/cobblestone", stone: "textures/blocks/stone",
  glass: "textures/blocks/glass", oak_log: "textures/blocks/log_oak", oak_planks: "textures/blocks/planks_oak",
  obsidian: "textures/blocks/obsidian", crying_obsidian: "textures/blocks/crying_obsidian",
  iron_ore: "textures/blocks/iron_ore", gold_ore: "textures/blocks/gold_ore", diamond_ore: "textures/blocks/diamond_ore",
  ancient_debris: "textures/blocks/ancient_debris_side", netherrack: "textures/blocks/netherrack",
  end_stone: "textures/blocks/end_stone", soul_sand: "textures/blocks/soul_sand"
};

const TRADER_ITEM = "allenscreations:trader_ledger";
const COINS = "dirtbound_coins", MINED = "dirtbound_blocks", CORE = "dirtbound_core", PRESTIGE = "dirtbound_prestige";

const STAGES = [
  { name: "Forgotten Soil", unlock: 0, block: "dirt", reward: 1 },
  { name: "Stone Core", unlock: 50, block: "stone", reward: 2 },
  { name: "Cobbleheart", unlock: 150, block: "cobblestone", reward: 2 },
  { name: "Iron Heart", unlock: 350, block: "iron_ore", reward: 3 },
  { name: "Golden Core", unlock: 700, block: "gold_ore", reward: 3 },
  { name: "Diamond Core", unlock: 1200, block: "diamond_ore", reward: 4 },
  { name: "Ancient Core", unlock: 2000, block: "ancient_debris", reward: 5 },
  { name: "Obsidian Core", unlock: 3000, block: "obsidian", reward: 6 },
  { name: "Crying Core", unlock: 4500, block: "crying_obsidian", reward: 7 },
  { name: "Kingdom Core", unlock: 6000, block: "netherite_block", reward: 8 }
];
const STAGE_BLOCK_IDS = new Set(STAGES.map(s => "minecraft:" + s.block));
const STAGE_REWARDS = [
  { blocks: 50, coins: 25 }, { blocks: 150, coins: 50 }, { blocks: 350, coins: 75 },
  { blocks: 700, coins: 100 }, { blocks: 1200, coins: 150 }, { blocks: 2000, coins: 200 },
  { blocks: 3000, coins: 300 }, { blocks: 4500, coins: 500 }, { blocks: 6000, coins: 1000 }
];

// What the "Sell Core Drops" button buys back (per item, before nothing else)
const SELL_VALUES = {
  "minecraft:dirt": 1, "minecraft:stone": 1, "minecraft:cobblestone": 1,
  "minecraft:iron_ore": 2, "minecraft:gold_ore": 3, "minecraft:diamond_ore": 4,
  "minecraft:ancient_debris": 6, "minecraft:obsidian": 4, "minecraft:crying_obsidian": 5
};

// ---------------------------------------------------------------------------
// Shop data
// ---------------------------------------------------------------------------
const RAW = [
  ["Castaway", 0, "oak_log oak_planks stick crafting_table wooden_pickaxe wooden_axe wooden_shovel torch bread wheat_seeds oak_sapling dirt cobblestone bowl baked_potato chest furnace bone_meal"],
  ["Settler", 50, "stone glass oak_fence oak_door lantern carrot potato beetroot_seeds wheat bucket water_bucket iron_nugget iron_ingot stone_pickaxe stone_axe stone_sword shield fishing_rod"],
  ["Homesteader", 150, "iron_pickaxe iron_axe iron_shovel iron_sword iron_hoe iron_helmet iron_chestplate iron_leggings iron_boots shears milk_bucket composter hay_block pumpkin_seeds melon_seeds lead name_tag campfire barrel smoker"],
  ["Miner", 350, "rail powered_rail minecart anvil redstone redstone_torch lever stone_button piston dispenser dropper iron_door cauldron compass clock bow arrow golden_apple stonecutter_block"],
  ["Explorer", 700, "diamond diamond_pickaxe diamond_axe diamond_sword diamond_shovel diamond_hoe enchanting_table book lapis_lazuli bookshelf empty_map spyglass potion golden_carrot ender_pearl obsidian crying_obsidian ender_eye"],
  ["Engineer", 1200, "hopper observer sticky_piston repeater comparator redstone_block target daylight_detector tripwire_hook trapped_chest blast_furnace loom cartography_table smithing_table lightning_rod crafter heavy_weighted_pressure_plate bell lectern"],
  ["Netherbound", 2000, "flint_and_steel fire_charge golden_sword golden_helmet magma_cream blaze_powder blaze_rod nether_wart soul_sand netherrack nether_brick quartz glowstone_dust ghast_tear spectral_arrow magma_block shroomlight warped_stem"],
  ["Enchanter", 3000, "experience_bottle enchanted_book grindstone totem_of_undying shulker_shell ender_chest beacon nether_star brewing_stand dragon_breath phantom_membrane turtle_helmet conduit heart_of_the_sea"],
  ["End Challenger", 4500, "diamond_helmet diamond_chestplate diamond_leggings diamond_boots trident crossbow firework_rocket end_crystal elytra shulker_box end_stone purpur_block chorus_fruit recovery_compass turtle_scute prismarine_crystals"],
  ["Kingdom Master", 6000, "netherite_ingot netherite_scrap netherite_upgrade_smithing_template netherite_pickaxe netherite_axe netherite_sword netherite_helmet netherite_chestplate netherite_leggings netherite_boots dragon_egg respawn_anchor enchanted_golden_apple lodestone"]
];

const TIER_DEFAULT = [2, 3, 5, 8, 12, 18, 24, 32, 45, 60];
const VALUES = {
  dirt: 3, oak_planks: 1, stick: 1, torch: 1, cobblestone: 1, stone: 2, glass: 3, oak_log: 3,
  bread: 3, baked_potato: 3, bone_meal: 2, chest: 6, furnace: 8, crafting_table: 6,
  iron_nugget: 2, iron_ingot: 10, bucket: 25, water_bucket: 28, shield: 30, fishing_rod: 14, shears: 22,
  milk_bucket: 28, name_tag: 30, lead: 14, compass: 40, clock: 40, anvil: 60, golden_apple: 60,
  arrow: 2, bow: 20, powered_rail: 8, minecart: 25, stonecutter_block: 18,
  diamond: 40, enchanting_table: 120, bookshelf: 40, lapis_lazuli: 6, spyglass: 30, ender_pearl: 15,
  obsidian: 10, crying_obsidian: 14, ender_eye: 25, crafter: 40, bell: 35, lectern: 20,
  magma_cream: 12, blaze_rod: 20, nether_wart: 6, ghast_tear: 40, golden_sword: 25, golden_helmet: 40,
  experience_bottle: 18, enchanted_book: 90, totem_of_undying: 200, shulker_shell: 40, ender_chest: 90,
  beacon: 600, nether_star: 500, dragon_breath: 40, phantom_membrane: 15, turtle_helmet: 70,
  conduit: 300, heart_of_the_sea: 150, trident: 250, crossbow: 40, elytra: 500, shulker_box: 80,
  end_crystal: 60, recovery_compass: 150, turtle_scute: 15, firework_rocket: 6,
  netherite_ingot: 400, netherite_scrap: 100, netherite_upgrade_smithing_template: 150,
  dragon_egg: 800, respawn_anchor: 120, enchanted_golden_apple: 400, lodestone: 90
};
const MAT = { wooden: 2, stone: 3, iron: 8, golden: 10, diamond: 30, netherite: 80 };
const PART = { pickaxe: 3, axe: 3, sword: 2, shovel: 1, hoe: 2, helmet: 5, chestplate: 8, leggings: 7, boots: 4 };
const SINGLES = new Set(["diamond", "netherite_ingot", "nether_star", "beacon", "elytra", "dragon_egg", "totem_of_undying",
  "trident", "conduit", "enchanted_golden_apple", "shulker_box", "ender_chest", "compass", "clock", "spyglass",
  "lodestone", "respawn_anchor", "enchanting_table", "anvil", "crafter", "lectern", "bell", "end_crystal",
  "recovery_compass", "heart_of_the_sea", "enchanted_book", "potion", "shield", "bow", "crossbow", "fishing_rod", "shears"]);
const TIER_QTY = [8, 8, 6, 4, 4, 3, 3, 2, 2, 1];

function unitValue(id, tier) {
  if (VALUES[id] !== undefined) return VALUES[id];
  const m = id.match(/^(wooden|stone|iron|golden|diamond|netherite)_(pickaxe|axe|sword|shovel|hoe|helmet|chestplate|leggings|boots)$/);
  if (m) return MAT[m[1]] * PART[m[2]];
  return TIER_DEFAULT[tier];
}
const prettyName = id => id.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
function itemExists(typeId) { try { return !!ItemTypes.get(typeId); } catch { return true; } }

let SHOPS = [];
function buildShops() {
  const seen = new Set(), skipped = [];
  SHOPS = RAW.map(([name, unlock, ids], tier) => {
    const items = [];
    for (const raw of ids.split(" ")) {
      if (seen.has(raw)) continue;
      const typeId = "minecraft:" + raw;
      if (!itemExists(typeId)) { skipped.push(raw); continue; }
      let amount = SINGLES.has(raw) ? 1 : TIER_QTY[tier], maxStack = 64;
      try { maxStack = new ItemStack(typeId, 1).maxAmount; amount = Math.max(1, Math.min(amount, maxStack)); } catch { skipped.push(raw); continue; }
      seen.add(raw);
      items.push({
        id: typeId, base: prettyName(raw), name: prettyName(raw) + " ×" + amount, amount, maxStack,
        price: Math.max(1, Math.round(unitValue(raw, tier) * amount)),
        icon: SHOP_ICONS ? (ICON_OVERRIDES[raw] ?? "textures/items/" + raw) : undefined
      });
    }
    return { name: name + " Supplies", unlock, items };
  });
  if (skipped.length) console.warn("[Dirtbound] Skipped invalid item IDs: " + skipped.join(", "));
}

// ---------------------------------------------------------------------------
// Scoreboard helpers
// ---------------------------------------------------------------------------
const objCache = new Map();
function objective(n) {
  let o = objCache.get(n);
  if (!o) {
    o = world.scoreboard.getObjective(n) ?? world.scoreboard.addObjective(n, n === COINS ? "§6Dirtbound Kingdom §8| §eOneCoins" : n);
    objCache.set(n, o);
  }
  return o;
}
function score(n, p) { try { return objective(n).getScore(p) ?? 0; } catch { objCache.delete(n); return 0; } }
function hasScore(n, p) { try { return objective(n).getScore(p) !== undefined; } catch { objCache.delete(n); return false; } }
function setScore(n, p, v) { try { objective(n).setScore(p, Math.max(0, Math.floor(v))); return true; } catch { objCache.delete(n); return false; } }
function globalScore(key) { try { return objective(CORE).getScore(key) ?? 0; } catch { objCache.delete(CORE); return 0; } }
function setGlobal(key, v) { try { objective(CORE).setScore(key, Math.max(0, Math.floor(v))); return true; } catch { objCache.delete(CORE); return false; } }

const ready = new Set();
function initialize(p) {
  if (ready.has(p.id)) return;
  let ok = true;
  if (!hasScore(COINS, p)) ok = setScore(COINS, p, 50) && ok;
  if (!hasScore(MINED, p)) ok = setScore(MINED, p, 0) && ok;
  if (!hasScore(PRESTIGE, p)) ok = setScore(PRESTIGE, p, 0) && ok;
  if (ok) ready.add(p.id);
}
const balance = p => score(COINS, p), mined = p => score(MINED, p), prestige = p => score(PRESTIGE, p);
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
function shortNum(n) { if (n >= 1e6) return +(n / 1e6).toFixed(1) + "M"; if (n >= 1000) return +(n / 1000).toFixed(1) + "k"; return String(n); }

// Menu helpers: one code path for chest-grid mode and standard list mode.
function uiForm(title, body) {
  const f = new ActionFormData().title(CHEST_UI ? CHEST_PREFIX + title : title);
  if (body) f.body(body);
  return f;
}
// chestLabel = the short text drawn on the slot (price/count). name+sub are used by the standard list.
function uiButton(f, name, sub, icon, chestLabel) {
  const label = CHEST_UI ? (chestLabel ?? sub ?? name) : (sub ? name + "\n" + sub : name);
  if (icon) f.button(label, icon); else f.button(label);
}
const sellIcon = id => SHOP_ICONS ? (ICON_OVERRIDES[id.replace("minecraft:", "")] ?? "textures/items/" + id.replace("minecraft:", "")) : undefined;
function stageBar() {
  const total = globalScore("#breaks"), st = stageFor(total), cur = STAGES[st], next = STAGES[st + 1];
  if (!next) return "§a" + "|".repeat(24) + " §6MAX";
  const n = Math.max(0, Math.min(24, Math.round(((total - cur.unlock) / (next.unlock - cur.unlock)) * 24)));
  return "§a" + "|".repeat(n) + "§8" + "|".repeat(24 - n) + " §7" + next.name;
}

// ---------------------------------------------------------------------------
// Misc helpers
// ---------------------------------------------------------------------------
function tell(p, m) { try { p.sendMessage("§6[Dirtbound] §f" + m); } catch {} }
function invOf(p) { return p.getComponent("minecraft:inventory")?.container; }
function hasTrader(p) {
  const inv = invOf(p); if (!inv) return false;
  for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === TRADER_ITEM) return true;
  return false;
}
function recoverTrader(p) {
  if (hasTrader(p)) return true;
  const inv = invOf(p);
  if (!inv || inv.emptySlotsCount < 1) return false;
  try { inv.addItem(new ItemStack(TRADER_ITEM, 1)); tell(p, "Your Trader Ledger was restored."); return true; } catch { return false; }
}
function stageFor(count) { let n = 0; for (let i = 0; i < STAGES.length; i++) if (count >= STAGES[i].unlock) n = i; return n; }
function shopTierIndex(count) { let n = 0; for (let i = 0; i < SHOPS.length; i++) if (count >= SHOPS[i].unlock) n = i; return n; }
function updateCoreStage() { setGlobal("#stage", stageFor(globalScore("#breaks"))); }
function coreCenter(pos, yOff = 0.5) { return { x: pos.x + 0.5, y: pos.y + yOff, z: pos.z + 0.5 }; }

function showForm(form, p, tries = 0) {
  return form.show(p).then(r => {
    if (r.canceled && r.cancelationReason === "UserBusy" && tries < 30)
      return new Promise(res => system.runTimeout(() => res(showForm(form, p, tries + 1)), 10));
    return r;
  });
}

// ---------------------------------------------------------------------------
// Menus
// ---------------------------------------------------------------------------
function progressText(p) {
  const total = globalScore("#breaks");
  const next = STAGES.find(s => s.unlock > total);
  return next ? "Next core stage: §e" + next.name + "§r in " + fmt(next.unlock - total) + " breaks" : "§aFinal core stage reached";
}

function showMain(p) {
  initialize(p);
  const total = SHOPS.reduce((n, s) => n + s.items.length, 0);
  const tier = SHOPS[shopTierIndex(mined(p))];
  const form = uiForm("Dirtbound Trader",
    "§6" + fmt(balance(p)) + " OneCoins §8| §bMined " + fmt(mined(p)) + (prestige(p) ? " §8| §dPrestige " + prestige(p) : "") +
    "\n" + stageBar() + "\n§7Shop: §f" + (tier ? tier.name : "-") + " §8| §7Core: §f" + STAGES[stageFor(globalScore("#breaks"))].name);
  uiButton(form, "Browse Supplies", total + " items across " + SHOPS.length + " tiers", "textures/items/emerald", "§aShop");
  uiButton(form, "Sell Items", "Choose what and how many", "textures/items/gold_ingot", "§eSell");
  uiButton(form, "Sell All Dirt", "Quick sell", "textures/blocks/dirt", "§fDirt");
  uiButton(form, "Recover Trader Ledger", "Get your Ledger back", "textures/items/book_normal", "§bBook");
  uiButton(form, "Balance & Progress", "Stats in chat", "textures/items/compass_item", "§7Stats");
  uiButton(form, "Kingdom Prestige", "Reset for permanent bonuses", "textures/items/nether_star", "§dPrest");
  showForm(form, p).then(r => {
    if (r.canceled) return;
    switch (r.selection) {
      case 0: return showShop(p);
      case 1: return showSell(p);
      case 2: return sellItems(p, id => id === "minecraft:dirt", "Dirt");
      case 3:
        if (recoverTrader(p)) tell(p, "Trader access restored.");
        else tell(p, "Make one inventory slot free, then recover the Ledger here.");
        return;
      case 4: {
        const next = SHOPS.find(s => s.unlock > mined(p));
        tell(p, "Balance: " + fmt(balance(p)) + " OneCoins. Your blocks mined: " + fmt(mined(p)) + ". Shared core: " + STAGES[stageFor(globalScore("#breaks"))].name +
          " (" + fmt(globalScore("#breaks")) + " total breaks). " + (next ? "Next shop tier: " + next.name + " at " + fmt(next.unlock) + " of your own breaks." : "All shop tiers unlocked."));
        return;
      }
      case 5: return showPrestige(p);
    }
  }).catch(() => tell(p, "Trader UI failed to open. Interact with the Trader Post or Ledger again."));
}

function showShop(p) {
  const count = mined(p);
  const f = uiForm("Supply Tiers", "§6" + fmt(balance(p)) + " OneCoins §8| §bMined " + fmt(count) + "\n§7Locked tiers need more of your own breaks.");
  SHOPS.forEach((s, i) => {
    const open = count >= s.unlock;
    uiButton(f, s.name, open ? s.items.length + " items" : "§8Unlock at " + fmt(s.unlock) + " blocks",
      open ? (TIER_ICONS[i] ?? "textures/items/emerald") : "textures/items/barrier", open ? "§a" + s.items.length : "§c" + shortNum(s.unlock));
  });
  uiButton(f, "Back", "", BACK_ICON, "§cBack");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === SHOPS.length) return showMain(p);
    const s = SHOPS[r.selection]; if (!s) return;
    if (count < s.unlock) { tell(p, s.name + " unlocks after " + fmt(s.unlock) + " personal blocks mined."); return showShop(p); }
    showProducts(p, s);
  }).catch(() => tell(p, "Supply Shop failed to open."));
}

function showProducts(p, s) {
  const f = uiForm(s.name, "§6" + fmt(balance(p)) + " OneCoins\n§7Tap an item to choose a quantity. Price shown on each slot.");
  for (const item of s.items) uiButton(f, item.name, "§e" + fmt(item.price) + " OneCoins", item.icon, "§e" + shortNum(item.price));
  uiButton(f, "Back to Tiers", "", BACK_ICON, "§cBack");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === s.items.length) return showShop(p);
    const item = s.items[r.selection];
    if (item) askQuantity(p, item, s);
  }).catch(() => tell(p, "Item list failed to open."));
}

// Slider helper: tries the classic signature first, then the newer options-object signature.
function addSlider(form, label, min, max, def) {
  try { form.slider(label, min, max, 1, def); }
  catch { form.slider(label, min, max, { valueStep: 1, defaultValue: def }); }
  return form;
}
const clampInt = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.floor(Number(v) || lo)));
const shortId = id => id.replace("minecraft:", "");

function maxBuyable(p, item) {
  const inv = invOf(p);
  const free = inv ? inv.emptySlotsCount : 0;
  const byCoins = Math.floor(balance(p) / item.price);
  const bySpace = Math.floor(free * item.maxStack / item.amount);
  return Math.max(0, Math.min(byCoins, bySpace, MAX_BUY_QTY));
}

function askQuantity(p, item, s) {
  initialize(p);
  const reopen = () => system.runTimeout(() => showProducts(p, s), 2);
  if (mined(p) < s.unlock) return tell(p, "That tier is locked.");
  if (balance(p) < item.price) { tell(p, "Not enough OneCoins. Need " + fmt(item.price) + ", have " + fmt(balance(p)) + "."); return reopen(); }
  const cap = maxBuyable(p, item);
  if (cap < 1) { tell(p, "Not enough free inventory space for that item."); return reopen(); }
  if (cap === 1) return confirmPurchase(p, item, s, 1);

  const unit = item.amount === 1 ? "Quantity" : "Bundles of " + item.amount;
  const form = new ModalFormData().title(item.base);
  addSlider(form, unit + " (" + fmt(item.price) + " coins each)\nBalance: " + fmt(balance(p)) + " | Max you can buy: " + cap, 1, cap, 1);
  showForm(form, p).then(r => {
    if (r.canceled) return reopen();
    confirmPurchase(p, item, s, clampInt(r.formValues?.[0] ?? 1, 1, cap));
  }).catch(() => tell(p, "Quantity menu failed to open."));
}

function confirmPurchase(p, item, s, qty) {
  const price = item.price * qty;
  if (price < CONFIRM_OVER) return purchase(p, item, s, qty);
  const form = new MessageFormData().title("CONFIRM PURCHASE")
    .body("Buy §e" + fmt(item.amount * qty) + "× " + item.base + "§r for §e" + fmt(price) + " OneCoins§r?\nBalance after: " + fmt(balance(p) - price))
    .button1("Cancel").button2("Buy");
  showForm(form, p).then(r => {
    if (r.canceled || r.selection !== 1) return system.runTimeout(() => showProducts(p, s), 2);
    purchase(p, item, s, qty);
  }).catch(() => tell(p, "Confirm screen failed to open."));
}

// Charges first, then delivers in stack-sized chunks; refunds anything not delivered. Reopens the tier afterwards.
function purchase(p, item, s, qty = 1) {
  initialize(p);
  const again = () => system.runTimeout(() => showProducts(p, s), 2);
  if (mined(p) < s.unlock) return tell(p, "That tier is locked.");
  const total = item.amount * qty, price = item.price * qty;
  const funds = balance(p);
  if (funds < price) { tell(p, "Not enough OneCoins. Need " + fmt(price) + ", have " + fmt(funds) + "."); return again(); }
  const inv = invOf(p);
  if (!inv || inv.emptySlotsCount < 1) return tell(p, "Make at least one free inventory slot first.");
  if (!setScore(COINS, p, funds - price)) return tell(p, "Could not update your balance. No items were given.");

  let delivered = 0, remaining = total;
  try {
    while (remaining > 0) {
      const n = Math.min(remaining, item.maxStack);
      const left = inv.addItem(new ItemStack(item.id, n));
      const put = n - (left?.amount ?? 0);
      delivered += put; remaining -= put;
      if (put < n) break;
    }
  } catch {}
  const charged = delivered > 0 ? Math.ceil(price * delivered / total) : 0;
  if (charged < price) setScore(COINS, p, balance(p) + (price - charged));
  if (delivered <= 0) { tell(p, "Purchase failed or inventory full. No coins were taken."); return again(); }
  tell(p, delivered < total
    ? "Limited space: delivered " + fmt(delivered) + " item(s), charged " + fmt(charged) + " OneCoins."
    : "Purchased " + fmt(total) + "× " + item.base + " for " + fmt(charged) + " OneCoins. Balance: " + fmt(balance(p)) + ".");
  try { p.playSound("random.orb"); } catch {}
  again();
}

// ---------------------------------------------------------------------------
// Selling
// ---------------------------------------------------------------------------
function sellable(p) {
  const out = new Map(), inv = invOf(p);
  if (!inv) return out;
  for (let i = 0; i < inv.size; i++) {
    const st = inv.getItem(i);
    if (st && SELL_VALUES[st.typeId] !== undefined) out.set(st.typeId, (out.get(st.typeId) ?? 0) + st.amount);
  }
  return out;
}

function removeItems(inv, typeId, amount) {
  let left = amount;
  for (let i = 0; i < inv.size && left > 0; i++) {
    const st = inv.getItem(i);
    if (!st || st.typeId !== typeId) continue;
    if (st.amount <= left) { left -= st.amount; inv.setItem(i, undefined); }
    else { st.amount -= left; left = 0; inv.setItem(i, st); }
  }
  return amount - left;
}

// Sells an exact amount of one item type.
function sellAmount(p, typeId, amount) {
  initialize(p);
  const inv = invOf(p); if (!inv) return tell(p, "Inventory unavailable.");
  const have = sellable(p).get(typeId) ?? 0;
  const n = Math.min(amount, have);
  if (n <= 0) return tell(p, "You no longer have that item.");
  const coins = n * SELL_VALUES[typeId];
  if (!setScore(COINS, p, balance(p) + coins)) return tell(p, "Balance is not ready; nothing was removed.");
  const removed = removeItems(inv, typeId, n);
  if (removed < n) setScore(COINS, p, balance(p) - (n - removed) * SELL_VALUES[typeId]);
  tell(p, "Sold " + fmt(removed) + "× " + prettyName(shortId(typeId)) + " for " + fmt(removed * SELL_VALUES[typeId]) + " OneCoins. Balance: " + fmt(balance(p)) + ".");
  try { p.playSound("random.orb"); } catch {}
}

// Sells every matching stack (used by Sell All Dirt and Sell Everything).
function sellItems(p, matches, label) {
  initialize(p);
  const inv = invOf(p); if (!inv) return tell(p, "Inventory unavailable.");
  const have = [...sellable(p).entries()].filter(([id]) => matches(id));
  if (!have.length) return tell(p, "No " + label + " to sell.");
  const count = have.reduce((n, [, c]) => n + c, 0);
  const coins = have.reduce((n, [id, c]) => n + c * SELL_VALUES[id], 0);
  if (!setScore(COINS, p, balance(p) + coins)) return tell(p, "Balance is not ready; nothing was removed.");
  for (const [id, c] of have) removeItems(inv, id, c);
  tell(p, "Sold " + fmt(count) + " " + label + " for " + fmt(coins) + " OneCoins. Balance: " + fmt(balance(p)) + ".");
  try { p.playSound("random.orb"); } catch {}
}

function showSell(p) {
  initialize(p);
  const have = sellable(p);
  if (!have.size) return tell(p, "The Trader buys nothing you are carrying. Mine the core for Dirt and ores.");
  const entries = [...have.entries()];
  const total = entries.reduce((n, [id, c]) => n + c * SELL_VALUES[id], 0);
  const f = uiForm("Sell Items", "§6" + fmt(balance(p)) + " OneCoins\n§7Pick an item to choose how many to sell.");
  uiButton(f, "Sell Everything", "§e+" + fmt(total) + " OneCoins", "textures/items/gold_ingot", "§e+" + shortNum(total));
  for (const [id, c] of entries) uiButton(f, prettyName(shortId(id)) + " ×" + fmt(c), "§e" + SELL_VALUES[id] + " each", sellIcon(id), "§f" + shortNum(c));
  uiButton(f, "Back", "", BACK_ICON, "§cBack");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === 0) return sellItems(p, () => true, "items");
    if (r.selection === entries.length + 1) return showMain(p);
    const [id, c] = entries[r.selection - 1] ?? [];
    if (id) showSellAmount(p, id, c);
  }).catch(() => tell(p, "Sell menu failed to open."));
}

function showSellAmount(p, id, have) {
  const again = () => system.runTimeout(() => showSell(p), 2);
  if (have <= 1) { sellAmount(p, id, 1); return again(); }
  const form = new ModalFormData().title("Sell " + prettyName(shortId(id)));
  addSlider(form, "Amount (" + SELL_VALUES[id] + " coins each, you have " + fmt(have) + ")", 1, have, Math.min(have, 16));
  try { form.toggle("Sell all " + fmt(have), false); } catch { form.toggle("Sell all " + fmt(have), { defaultValue: false }); }
  showForm(form, p).then(r => {
    if (r.canceled) return again();
    const amount = r.formValues?.[1] ? have : clampInt(r.formValues?.[0] ?? 1, 1, have);
    sellAmount(p, id, amount);
    again();
  }).catch(() => tell(p, "Sell amount menu failed to open."));
}

function showPrestige(p) {
  if (mined(p) < 6000) return tell(p, "Kingdom Prestige unlocks after 6,000 personal core breaks.");
  const form = new MessageFormData().title("KINGDOM PRESTIGE")
    .body("Reset your personal mining progress and shop unlocks for +500 OneCoins and a permanent Prestige level (+10% coins per core break each level)? Stage bonus payouts only count on your first run. The shared core stays at its current stage. This cannot be undone.")
    .button1("Cancel").button2("Prestige");
  showForm(form, p).then(r => {
    if (r.canceled || r.selection !== 1) return;
    if (mined(p) < 6000) return tell(p, "Kingdom Prestige unlocks after 6,000 personal core breaks.");
    const coins = balance(p) + 500, level = prestige(p) + 1;
    if (!setScore(MINED, p, 0)) return tell(p, "Prestige could not be completed. Try again.");
    setScore(COINS, p, coins);
    setScore(PRESTIGE, p, level);
    tell(p, "Prestige " + level + " reached! Personal progress reset; +500 OneCoins awarded. The shared core remains evolved.");
    try { p.playSound("random.levelup"); } catch {}
  }).catch(() => tell(p, "Prestige menu could not open."));
}

// ---------------------------------------------------------------------------
// Core + bonus logic
// ---------------------------------------------------------------------------
function spawnMobWave(p) {
  try {
    for (let i = 0; i < 3; i++) {
      p.dimension.spawnEntity(i === 1 ? "minecraft:spider" : "minecraft:zombie", { x: p.location.x + (i - 1) * 2, y: p.location.y, z: p.location.z + 2 });
    }
    tell(p, "§cCore Surge! Three hostile mobs have appeared. Defeat them for survival loot.");
  } catch { tell(p, "Core Surge triggered, but there was not enough room to spawn its challenge."); }
}

// The OneBlock always yields dirt, no matter which stage block was broken.
function dropGuaranteedDirt(p, dim, brokenId) {
  if (ALWAYS_DROP_DIRT <= 0) return;
  let creative = false;
  try { creative = p.getGameMode() === GameMode.Creative; } catch {}
  // A survival-broken dirt block already drops dirt naturally; don't double it.
  if (brokenId === "minecraft:dirt" && !creative) return;
  try { dim.spawnItem(new ItemStack("minecraft:dirt", ALWAYS_DROP_DIRT), coreCenter(ORIGIN, 1.0)); } catch {}
}

let bonusExpiresAt = 0;
function bonusActive(dim) {
  try { return dim.getBlock(BONUS_POS)?.typeId === "minecraft:emerald_block"; } catch { return false; }
}

// Emerald spawns at BONUS_POS (next to the OneBlock). Runs bonus_spawn.mcfunction if present, otherwise places it directly.
function spawnBonus() {
  try {
    const dim = world.getDimension("overworld");
    const b = dim.getBlock(BONUS_POS);
    if (!b || b.typeId !== "minecraft:air") return false;
    try { dim.runCommand("function " + BONUS_FUNCTION); } catch {}
    if (!bonusActive(dim)) b.setType("minecraft:emerald_block");
    if (!bonusActive(dim)) return false;
    setGlobal("#bonus", 1);
    bonusExpiresAt = system.currentTick + BONUS_LIFETIME_TICKS;
    dim.playSound("random.orb", coreCenter(BONUS_POS));
    world.sendMessage("§6[Dirtbound] §fA Bonus Core appeared beside the OneBlock! Break the Emerald Block within " + Math.round(BONUS_LIFETIME_TICKS / 20) + "s for a coin reward.");
    return true;
  } catch { return false; }
}

function clearBonus(dim, announce) {
  try {
    if (bonusActive(dim)) dim.getBlock(BONUS_POS).setType("minecraft:air");
  } catch {}
  setGlobal("#bonus", 0);
  bonusExpiresAt = 0;
  if (announce) world.sendMessage("§6[Dirtbound] §7The Bonus Core faded away.");
}

function placeCore(dimension) {
  try {
    const block = dimension.getBlock(ORIGIN);
    if (!block) return false;
    const target = "minecraft:" + STAGES[stageFor(globalScore("#breaks"))].block;
    const id = block.typeId;
    if (id === "minecraft:air" || id === "minecraft:grass_block" || (STAGE_BLOCK_IDS.has(id) && id !== target)) block.setType(target);
    return true;
  } catch { return false; }
}

function onCoreBreak(p, dim, brokenId) {
  initialize(p);
  const personal = mined(p) + 1;
  const total = globalScore("#breaks") + 1;
  setScore(MINED, p, personal);
  setGlobal("#breaks", total);
  updateCoreStage();

  dropGuaranteedDirt(p, dim, brokenId);

  const pres = prestige(p);
  let gain = Math.max(1, Math.round(STAGES[stageFor(total)].reward * (1 + 0.1 * pres)));

  const stageReward = STAGE_REWARDS.find(r => r.blocks === personal);
  if (stageReward && pres === 0) { gain += stageReward.coins; tell(p, fmt(personal) + " personal breaks! Stage bonus: +" + stageReward.coins + " OneCoins."); }
  if (personal % 250 === 0) { gain += 20; tell(p, "Milestone reached: " + fmt(personal) + " personal breaks. +20 bonus OneCoins."); }
  if (total % 500 === 0) { gain += 50; tell(p, "Core Surge milestone! +50 OneCoins."); spawnMobWave(p); }
  setScore(COINS, p, balance(p) + gain);

  if (Math.random() < BONUS_CHANCE) spawnBonus();
  for (const s of SHOPS) if (s.unlock > 0 && s.unlock === personal) { tell(p, "New shop unlocked: " + s.name + "!"); try { p.playSound("random.levelup"); } catch {} }
  const newStage = STAGES.find(s => s.unlock > 0 && s.unlock === total);
  if (newStage) world.sendMessage("§6[Dirtbound] §fThe central OneBlock evolved into the " + newStage.name + "! It is tougher to mine; use better pickaxes.");
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------
world.afterEvents.itemUse.subscribe(e => {
  if (e.itemStack?.typeId !== TRADER_ITEM) return;
  const p = e.source;
  if (p?.typeId === "minecraft:player") system.run(() => showMain(p));
});

world.afterEvents.playerBreakBlock.subscribe(e => {
  const b = e.block, loc = b.location, p = e.player;
  if (!p || b.dimension.id !== OVERWORLD) return;
  const brokenId = e.brokenBlockPermutation.type.id;

  // Bonus block
  if (loc.x === BONUS_POS.x && loc.y === BONUS_POS.y && loc.z === BONUS_POS.z) {
    if (globalScore("#bonus") === 1 && brokenId === "minecraft:emerald_block") {
      const reward = 30 + STAGES[stageFor(globalScore("#breaks"))].reward * 5;
      setGlobal("#bonus", 0);
      bonusExpiresAt = 0;
      setScore(COINS, p, balance(p) + reward);
      tell(p, "Bonus Core collected! +" + reward + " OneCoins.");
      try { p.playSound("random.levelup"); } catch {}
      if (Math.random() < 0.2) spawnMobWave(p);
    }
    return;
  }

  if (loc.x !== ORIGIN.x || loc.y !== ORIGIN.y || loc.z !== ORIGIN.z) return;
  const dim = b.dimension;
  system.run(() => { onCoreBreak(p, dim, brokenId); placeCore(dim); });
});

world.afterEvents.playerSpawn.subscribe(e => system.runTimeout(() => {
  try { initialize(e.player); recoverTrader(e.player); } catch {}
}, 5));
world.afterEvents.playerLeave.subscribe(e => ready.delete(e.playerId));

// ---------------------------------------------------------------------------
// Loops
// ---------------------------------------------------------------------------
let coreReady = false;
const initLoop = system.runInterval(() => {
  try {
    if (REQUIRE_VOID_TAG && !world.getAllPlayers().some(p => p.hasTag("void_cleaned"))) return;
    if (placeCore(world.getDimension("overworld"))) { coreReady = true; system.clearRun(initLoop); }
  } catch {}
}, 10);

// Watchdog: restores the core, handles bonus expiry and stuck flags
system.runInterval(() => {
  if (!coreReady) return;
  const dim = world.getDimension("overworld");
  placeCore(dim);
  if (globalScore("#bonus") === 1) {
    if (!bonusActive(dim)) { setGlobal("#bonus", 0); bonusExpiresAt = 0; }
    else if (!bonusExpiresAt) bonusExpiresAt = system.currentTick + BONUS_LIFETIME_TICKS;
    else if (system.currentTick >= bonusExpiresAt) clearBonus(dim, true);
  } else if (bonusActive(dim)) {
    setGlobal("#bonus", 1); // emerald placed by function/command: track it
    bonusExpiresAt = system.currentTick + BONUS_LIFETIME_TICKS;
  }
}, 20);

system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    try { initialize(p); recoverTrader(p); } catch {}
  }
}, 40);

// Actionbar HUD
if (HUD_ENABLED) system.runInterval(() => {
  if (!coreReady) return;
  const total = globalScore("#breaks");
  const next = STAGES.find(s => s.unlock > total);
  for (const p of world.getAllPlayers()) {
    try {
      if (!ready.has(p.id)) continue;
      p.onScreenDisplay.setActionBar("§6" + fmt(balance(p)) + " OneCoins §8| §bMined " + fmt(mined(p)) +
        (prestige(p) ? " §8| §dPrestige " + prestige(p) : "") +
        (next ? " §8| §7Next core in §e" + fmt(next.unlock - total) : " §8| §aMax core"));
    } catch {}
  }
}, 20);

system.run(() => {
  objective(COINS); objective(MINED); objective(CORE); objective(PRESTIGE);
  buildShops();
  if (globalScore("#stage") === 0) setGlobal("#stage", 0);
  if (globalScore("#breaks") === 0) setGlobal("#breaks", 0);
  if (globalScore("#bonus") === 0) setGlobal("#bonus", 0);
});
