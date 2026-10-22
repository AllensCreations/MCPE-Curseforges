import { world, system, ItemStack, ItemTypes, BlockPermutation } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

const CUR = ":minecoin:";
const CURRENCY_INFO = [
  "§6" + CUR + " §fis the Dirtbound Kingdom currency (the OneCoin).",
  "§7- §aEarned by§f: breaking the OneBlock, selling Dirt and ores, milestones and Prestige.",
  "§7- §aSpent on§f: Trader supplies (items, tools, armor).",
  "§7- §cNot real money§f: it is NOT Marketplace Minecoins and cannot be bought, traded or refunded with real money.",
  "§7- §cNot XP§f: it is separate from experience levels and is never lost on death.",
  "§7- §cNot an item§f: it is a score stored per player, so it cannot be dropped, stolen or put in chests.",
  "§7- §bWorld-only§f: your balance stays in this world and does not carry over to other worlds."
].join("\n");

const ORIGIN = { x: 0, y: 0, z: 0 };
const OVERWORLD = "minecraft:overworld";
const REQUIRE_VOID_TAG = true;
const ALWAYS_DROP_DIRT = 1;
const HUD_ENABLED = false;
const SHOP_ICONS = true;
const MAX_BUY_QTY = 64;
const CHEST_UI = true;
const CHEST_PREFIX = "dbtrader:";
const CONFIRM_OVER = 200;
const ICON_BASE = "textures/dbk/icons/";
const ICON_IDS = new Set(["ancient_debris", "anvil", "arrow", "baked_potato", "barrel", "barrier", "beacon", "beetroot_seeds", "bell", "blast_furnace", "blaze_powder", "blaze_rod", "bone_meal", "book", "bookshelf", "bow", "bowl", "bread", "brewing_stand", "bucket", "campfire", "carrot", "cartography_table", "cauldron", "chest", "chorus_fruit", "clock", "cobblestone", "comparator", "compass", "composter", "conduit", "crafter", "crafting_table", "crossbow", "crying_obsidian", "daylight_detector", "diamond", "diamond_axe", "diamond_boots", "diamond_chestplate", "diamond_helmet", "diamond_hoe", "diamond_leggings", "diamond_ore", "diamond_pickaxe", "diamond_shovel", "diamond_sword", "dirt", "dispenser", "dragon_breath", "dragon_egg", "dropper", "elytra", "emerald", "empty_map", "enchanted_book", "enchanted_golden_apple", "enchanting_table", "end_crystal", "end_stone", "ender_chest", "ender_eye", "ender_pearl", "experience_bottle", "fire_charge", "firework_rocket", "fishing_rod", "flint_and_steel", "furnace", "ghast_tear", "glass", "glowstone_dust", "gold_ingot", "gold_ore", "golden_apple", "golden_carrot", "golden_helmet", "golden_sword", "grindstone", "hay_block", "heart_of_the_sea", "heavy_weighted_pressure_plate", "hopper", "iron_axe", "iron_boots", "iron_chestplate", "iron_door", "iron_helmet", "iron_hoe", "iron_ingot", "iron_leggings", "iron_nugget", "iron_ore", "iron_pickaxe", "iron_shovel", "iron_sword", "lantern", "lapis_lazuli", "lead", "lectern", "lever", "lightning_rod", "lodestone", "loom", "magma_block", "magma_cream", "melon_seeds", "milk_bucket", "minecart", "name_tag", "nether_brick", "nether_star", "nether_wart", "netherite_axe", "netherite_boots", "netherite_chestplate", "netherite_helmet", "netherite_ingot", "netherite_leggings", "netherite_pickaxe", "netherite_scrap", "netherite_sword", "netherite_upgrade_smithing_template", "netherrack", "oak_door", "oak_fence", "oak_log", "oak_planks", "oak_sapling", "observer", "obsidian", "paper", "phantom_membrane", "piston", "potato", "potion", "powered_rail", "prismarine_crystals", "pumpkin_seeds", "purpur_block", "quartz", "rail", "recovery_compass", "redstone", "redstone_block", "redstone_torch", "repeater", "respawn_anchor", "shears", "shroomlight", "shulker_box", "shulker_shell", "smithing_table", "smoker", "soul_sand", "spectral_arrow", "spyglass", "stick", "sticky_piston", "stone", "stone_axe", "stone_button", "stone_pickaxe", "stone_sword", "stonecutter_block", "target", "torch", "totem_of_undying", "trapped_chest", "trident", "tripwire_hook", "turtle_helmet", "turtle_scute", "warped_stem", "water_bucket", "wheat", "wheat_seeds", "wooden_axe", "wooden_pickaxe", "wooden_shovel"]);
const ico = n => ICON_BASE + n;
function iconFor(raw) { return ICON_IDS.has(raw) ? ico(raw) : undefined; }

const BACK_ICON = ico("arrow");
const TIER_ICONS = ["oak_log", "stone_pickaxe", "iron_pickaxe", "minecart", "diamond", "redstone", "blaze_rod", "experience_bottle", "elytra", "netherite_ingot"].map(ico);
const TRADER_ITEM = "allenscreations:trader_ledger";
const COINS = "dirtbound_coins", MINED = "dirtbound_blocks", CORE = "dirtbound_core", PRESTIGE = "dirtbound_prestige";

const STAGES = [
  { name: "Forgotten Soil", unlock: 0, reward: 1, mineTime: "0.5s", tool: "Any shovel or hand", desc: "The starting block. Loose, quick to break, and the foundation of the whole Kingdom." },
  { name: "Stone Core", unlock: 50, reward: 2, mineTime: "1.5s", tool: "Wooden pickaxe or better", desc: "Packed stone. The core hardens as the shared break count climbs." },
  { name: "Cobbleheart", unlock: 150, reward: 2, mineTime: "2s", tool: "Wooden pickaxe or better", desc: "Rough cobbled rock that pays the same as stone but takes longer to chip." },
  { name: "Iron Heart", unlock: 350, reward: 3, mineTime: "3s", tool: "Stone pickaxe or better", desc: "Iron-veined rock. Payouts rise to 3 per break." },
  { name: "Golden Core", unlock: 700, reward: 3, mineTime: "3s", tool: "Iron pickaxe or better", desc: "Gold-flecked stone with a steady payout." },
  { name: "Diamond Core", unlock: 1200, reward: 4, mineTime: "4s", tool: "Iron pickaxe or better", desc: "Diamond-rich rock. Mining gets noticeably slower." },
  { name: "Ancient Core", unlock: 2000, reward: 5, mineTime: "6s", tool: "Diamond pickaxe or better", desc: "Ancient debris. Very hard and worth 5 per break." },
  { name: "Obsidian Core", unlock: 3000, reward: 6, mineTime: "10s", tool: "Diamond pickaxe or better", desc: "Obsidian-dark and slow to mine without a strong pickaxe." },
  { name: "Crying Core", unlock: 4500, reward: 7, mineTime: "12s", tool: "Diamond or netherite pickaxe", desc: "Weeping obsidian. Payout of 7 per break." },
  { name: "Kingdom Core", unlock: 6000, reward: 8, mineTime: "15s", tool: "Netherite pickaxe", desc: "The final stage and the highest payout. Prestige unlocks here." }
];
const CORE_BLOCK = "dbk:core";
const STAGE_STATE = "dbk:stage";
const stageTexture = i => "textures/blocks/dbk/stage_" + String(i + 1).padStart(2, "0");
const STAGE_REWARDS = [
  { blocks: 50, coins: 25 }, { blocks: 150, coins: 50 }, { blocks: 350, coins: 75 },
  { blocks: 700, coins: 100 }, { blocks: 1200, coins: 150 }, { blocks: 2000, coins: 200 },
  { blocks: 3000, coins: 300 }, { blocks: 4500, coins: 500 }, { blocks: 6000, coins: 1000 }
];

const SELL_VALUES = {
  "minecraft:dirt": 1, "minecraft:stone": 1, "minecraft:cobblestone": 1,
  "minecraft:iron_ore": 2, "minecraft:gold_ore": 3, "minecraft:diamond_ore": 4,
  "minecraft:ancient_debris": 6, "minecraft:obsidian": 4, "minecraft:crying_obsidian": 5
};

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
        icon: SHOP_ICONS ? iconFor(raw) : undefined
      });
    }
    return { name: name + " Supplies", unlock, items };
  });
  if (skipped.length) console.warn("[Dirtbound] Skipped invalid item IDs: " + skipped.join(", "));
}

const objCache = new Map();
function objective(n) {
  let o = objCache.get(n);
  if (!o) {
    o = world.scoreboard.getObjective(n) ?? world.scoreboard.addObjective(n, n === COINS ? "§6Dirtbound Kingdom §8| §e" + CUR : n);
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
const money = n => fmt(n) + " " + CUR;
function shortNum(n) { if (n >= 1e6) return +(n / 1e6).toFixed(1) + "M"; if (n >= 1000) return +(n / 1000).toFixed(1) + "k"; return String(n); }

function uiForm(title, body) {
  const f = new ActionFormData().title(CHEST_UI ? CHEST_PREFIX + title : title);
  if (body) f.body(body);
  return f;
}
function uiButton(f, name, sub, icon, chestLabel) {
  const label = CHEST_UI ? (chestLabel ?? sub ?? name) : (sub ? name + "\n" + sub : name);
  if (icon) f.button(label, icon); else f.button(label);
}
const sellIcon = id => SHOP_ICONS ? iconFor(id.replace("minecraft:", "")) : undefined;
function stageBar() {
  const total = globalScore("#breaks"), st = stageFor(total), cur = STAGES[st], next = STAGES[st + 1];
  if (!next) return "§2" + "|".repeat(24) + " §6MAX";
  const n = Math.max(0, Math.min(24, Math.round(((total - cur.unlock) / (next.unlock - cur.unlock)) * 24)));
  return "§2" + "|".repeat(n) + "§c" + "|".repeat(24 - n) + " §7" + next.name;
}

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

function progressText(p) {
  const total = globalScore("#breaks");
  const next = STAGES.find(s => s.unlock > total);
  return next ? "Next core stage: §6" + next.name + "§r in " + fmt(next.unlock - total) + " breaks" : "§2Final core stage reached";
}

function showCurrencyInfo(p) {
  const form = new MessageFormData().title("About " + CUR)
    .body(CURRENCY_INFO + "\n\n§7Your balance: §6" + money(balance(p)))
    .button1("Close").button2("Back to Trader");
  showForm(form, p).then(r => {
    if (!r.canceled && r.selection === 1) system.runTimeout(() => showMain(p), 2);
  }).catch(() => tell(p, CUR + " is the Dirtbound Kingdom currency. It is not Marketplace Minecoins and has no real-money value."));
}

function stageStatus(i) {
  const total = globalScore("#breaks"), cur = stageFor(total);
  if (i < cur) return "§aCleared";
  if (i === cur) return "§eCurrent";
  return "§cLocked §7(" + fmt(STAGES[i].unlock - total) + " breaks to go)";
}

function showStages(p) {
  initialize(p);
  const total = globalScore("#breaks"), cur = stageFor(total);
  const f = uiForm("Core Stages", "§7The shared OneBlock evolves through " + STAGES.length + " stages as the whole server breaks it. Stage unlocks use shared breaks (" + fmt(total) + " so far). Tap a stage for details.\n" + stageBar());
  STAGES.forEach((st, i) => uiButton(f, (i + 1) + ". " + st.name, i === cur ? "§eCurrent stage" : stageStatus(i), i <= cur ? stageTexture(i) : ico("barrier"), (i === cur ? "§e" : i < cur ? "§a" : "§c") + (i + 1)));
  uiButton(f, "Back", "", BACK_ICON, "§cBack");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === STAGES.length) return showMain(p);
    showStageDetail(p, r.selection);
  }).catch(() => tell(p, "Stage list failed to open."));
}

function showStageDetail(p, i) {
  const st = STAGES[i], next = STAGES[i + 1], pres = prestige(p);
  const pay = Math.max(1, Math.round(st.reward * (1 + 0.1 * pres)));
  const bonus = STAGE_REWARDS.find(r => r.blocks === st.unlock);
  const body = [
    "§6" + st.name + " §7(Stage " + (i + 1) + " of " + STAGES.length + ")",
    "§7" + st.desc,
    "",
    "§fStatus: " + stageStatus(i),
    "§fUnlocks at: §b" + fmt(st.unlock) + " §fshared core breaks",
    "§fPayout: §6" + money(st.reward) + " §fper break" + (pres ? " §7(yours with Prestige " + pres + ": " + money(pay) + ")" : ""),
    "§fFirst-run reach bonus: " + (bonus ? "§6" + money(bonus.coins) + " §fat " + fmt(bonus.blocks) + " of your own breaks" : "§7none"),
    "§fMining time: §b" + st.mineTime + " §7(bare hands)",
    "§fRecommended tool: §b" + st.tool,
    "§fDrops: §b" + ALWAYS_DROP_DIRT + "x Dirt §fper break (sell it for " + money(SELL_VALUES["minecraft:dirt"]) + " each)",
    "§fNext stage: " + (next ? "§6" + next.name + " §fat " + fmt(next.unlock) + " breaks" : "§2none, this is the final stage"),
    "",
    "§7" + CUR + " is the Dirtbound currency, not Marketplace Minecoins."
  ].join("\n");
  const form = new MessageFormData().title("Stage " + (i + 1) + ": " + st.name).body(body).button1("All Stages").button2("Back to Trader");
  showForm(form, p).then(r => {
    if (r.canceled) return;
    system.runTimeout(() => (r.selection === 1 ? showMain(p) : showStages(p)), 2);
  }).catch(() => tell(p, "Stage details failed to open."));
}

function showMain(p) {
  initialize(p);
  const total = SHOPS.reduce((n, s) => n + s.items.length, 0);
  const tier = SHOPS[shopTierIndex(mined(p))];
  const form = uiForm("Dirtbound Trader",
    "§6" + money(balance(p)) + " §c| §bMined " + fmt(mined(p)) + (prestige(p) ? " §c| §dPrestige " + prestige(p) : "") +
    "\n§7" + CUR + " = Dirtbound currency. Not real-money Minecoins." +
    "\n" + stageBar() + "\n§7Shop: §f" + (tier ? tier.name : "-") + " §c| §7Core: §f" + STAGES[stageFor(globalScore("#breaks"))].name);
  uiButton(form, "Browse Supplies", total + " items across " + SHOPS.length + " tiers", ico("emerald"), "§2Shop");
  uiButton(form, "Sell Items", "Choose what and how many", ico("gold_ingot"), "§6Sell");
  uiButton(form, "Sell All Dirt", "Quick sell", ico("dirt"), "§fDirt");
  uiButton(form, "Recover Trader Ledger", "Get your Ledger back", ico("book"), "§bBook");
  uiButton(form, "Balance & Progress", "Stats in chat", ico("compass"), "§7Stats");
  uiButton(form, "Kingdom Prestige", "Reset for permanent bonuses", ico("nether_star"), "§dPrest");
  uiButton(form, "Core Stages", "All " + STAGES.length + " core stages explained", stageTexture(stageFor(globalScore("#breaks"))), "§eStages");
  uiButton(form, "About " + CUR, "What the currency is and isn't", ico("paper"), "§eInfo");
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
        tell(p, "Balance: " + money(balance(p)) + " (Dirtbound currency, not Marketplace Minecoins). Your blocks mined: " + fmt(mined(p)) + ". Shared core: " + STAGES[stageFor(globalScore("#breaks"))].name +
          " (" + fmt(globalScore("#breaks")) + " total breaks). " + (next ? "Next shop tier: " + next.name + " at " + fmt(next.unlock) + " of your own breaks." : "All shop tiers unlocked."));
        return;
      }
      case 5: return showPrestige(p);
      case 6: return showStages(p);
      case 7: return showCurrencyInfo(p);
    }
  }).catch(() => tell(p, "Trader UI failed to open. Interact with the Trader Post or Ledger again."));
}

function showShop(p) {
  const count = mined(p);
  const f = uiForm("Supply Tiers", "§6" + money(balance(p)) + " §c| §bMined " + fmt(count) + "\n§7Locked tiers need more of your own core breaks.\n§7Prices are in " + CUR + " (Dirtbound currency).");
  SHOPS.forEach((s, i) => {
    const open = count >= s.unlock;
    uiButton(f, s.name, open ? s.items.length + " items" : "§cUnlock at " + fmt(s.unlock) + " blocks",
      open ? (TIER_ICONS[i] ?? ico("emerald")) : ico("barrier"), open ? "§2" + s.items.length : "§c" + shortNum(s.unlock));
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
  const f = uiForm(s.name, "§6" + money(balance(p)) + "\n§7Tap an item to choose a quantity. Price in " + CUR + " shown on each slot.");
  for (const item of s.items) uiButton(f, item.name, "§6" + money(item.price), item.icon, "§6" + shortNum(item.price));
  uiButton(f, "Back to Tiers", "", BACK_ICON, "§cBack");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === s.items.length) return showShop(p);
    const item = s.items[r.selection];
    if (item) askQuantity(p, item, s);
  }).catch(() => tell(p, "Item list failed to open."));
}

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
  if (balance(p) < item.price) { tell(p, "Not enough " + CUR + ". Need " + money(item.price) + ", have " + money(balance(p)) + "."); return reopen(); }
  const cap = maxBuyable(p, item);
  if (cap < 1) { tell(p, "Not enough free inventory space for that item."); return reopen(); }
  if (cap === 1) return confirmPurchase(p, item, s, 1);

  const unit = item.amount === 1 ? "Quantity" : "Bundles of " + item.amount;
  const form = new ModalFormData().title(item.base);
  addSlider(form, unit + " (" + money(item.price) + " each)\nBalance: " + money(balance(p)) + " | Max you can buy: " + cap, 1, cap, 1);
  showForm(form, p).then(r => {
    if (r.canceled) return reopen();
    confirmPurchase(p, item, s, clampInt(r.formValues?.[0] ?? 1, 1, cap));
  }).catch(() => tell(p, "Quantity menu failed to open."));
}

function confirmPurchase(p, item, s, qty) {
  const price = item.price * qty;
  if (price < CONFIRM_OVER) return purchase(p, item, s, qty);
  const form = new MessageFormData().title("CONFIRM PURCHASE")
    .body("Buy §6" + fmt(item.amount * qty) + "× " + item.base + "§r for §6" + money(price) + "§r?\nBalance after: " + money(balance(p) - price) + "\n§7(" + CUR + " is Dirtbound currency, not real money.)")
    .button1("Cancel").button2("Buy");
  showForm(form, p).then(r => {
    if (r.canceled || r.selection !== 1) return system.runTimeout(() => showProducts(p, s), 2);
    purchase(p, item, s, qty);
  }).catch(() => tell(p, "Confirm screen failed to open."));
}

function purchase(p, item, s, qty = 1) {
  initialize(p);
  const again = () => system.runTimeout(() => showProducts(p, s), 2);
  if (mined(p) < s.unlock) return tell(p, "That tier is locked.");
  const total = item.amount * qty, price = item.price * qty;
  const funds = balance(p);
  if (funds < price) { tell(p, "Not enough " + CUR + ". Need " + money(price) + ", have " + money(funds) + "."); return again(); }
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
  if (delivered <= 0) { tell(p, "Purchase failed or inventory full. No " + CUR + " were taken."); return again(); }
  tell(p, delivered < total
    ? "Limited space: delivered " + fmt(delivered) + " item(s), charged " + money(charged) + "."
    : "Purchased " + fmt(total) + "× " + item.base + " for " + money(charged) + ". Balance: " + money(balance(p)) + ".");
  try { p.playSound("random.orb"); } catch {}
  again();
}

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
  tell(p, "Sold " + fmt(removed) + "× " + prettyName(shortId(typeId)) + " for " + money(removed * SELL_VALUES[typeId]) + ". Balance: " + money(balance(p)) + ".");
  try { p.playSound("random.orb"); } catch {}
}

function sellItems(p, matches, label) {
  initialize(p);
  const inv = invOf(p); if (!inv) return tell(p, "Inventory unavailable.");
  const have = [...sellable(p).entries()].filter(([id]) => matches(id));
  if (!have.length) return tell(p, "No " + label + " to sell.");
  const count = have.reduce((n, [, c]) => n + c, 0);
  const coins = have.reduce((n, [id, c]) => n + c * SELL_VALUES[id], 0);
  if (!setScore(COINS, p, balance(p) + coins)) return tell(p, "Balance is not ready; nothing was removed.");
  for (const [id, c] of have) removeItems(inv, id, c);
  tell(p, "Sold " + fmt(count) + " " + label + " for " + money(coins) + ". Balance: " + money(balance(p)) + ".");
  try { p.playSound("random.orb"); } catch {}
}

function showSell(p) {
  initialize(p);
  const have = sellable(p);
  if (!have.size) return tell(p, "The Trader buys nothing you are carrying. Mine the core for Dirt and ores, then sell them here for " + CUR + ".");
  const entries = [...have.entries()];
  const total = entries.reduce((n, [id, c]) => n + c * SELL_VALUES[id], 0);
  const f = uiForm("Sell Items", "§6" + money(balance(p)) + "\n§7Pick an item to choose how many to sell. You are paid in " + CUR + ".");
  uiButton(f, "Sell Everything", "§6+" + money(total), ico("gold_ingot"), "§6+" + shortNum(total));
  for (const [id, c] of entries) uiButton(f, prettyName(shortId(id)) + " ×" + fmt(c), "§6" + SELL_VALUES[id] + " " + CUR + " each", sellIcon(id), "§f" + shortNum(c));
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
  addSlider(form, "Amount (" + SELL_VALUES[id] + " " + CUR + " each, you have " + fmt(have) + ")", 1, have, Math.min(have, 16));
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
    .body("Reset your personal mining progress and shop unlocks for +" + money(500) + " and a permanent Prestige level (+10% " + CUR + " per core break each level)? Stage bonus payouts only count on your first run. The shared core stays at its current stage. This cannot be undone.")
    .button1("Cancel").button2("Prestige");
  showForm(form, p).then(r => {
    if (r.canceled || r.selection !== 1) return;
    if (mined(p) < 6000) return tell(p, "Kingdom Prestige unlocks after 6,000 personal core breaks.");
    const coins = balance(p) + 500, level = prestige(p) + 1;
    if (!setScore(MINED, p, 0)) return tell(p, "Prestige could not be completed. Try again.");
    setScore(COINS, p, coins);
    setScore(PRESTIGE, p, level);
    tell(p, "Prestige " + level + " reached! Personal progress reset; +" + money(500) + " awarded. The shared core remains evolved.");
    try { p.playSound("random.levelup"); } catch {}
  }).catch(() => tell(p, "Prestige menu could not open."));
}

function spawnMobWave(p) {
  try {
    for (let i = 0; i < 3; i++) {
      p.dimension.spawnEntity(i === 1 ? "minecraft:spider" : "minecraft:zombie", { x: p.location.x + (i - 1) * 2, y: p.location.y, z: p.location.z + 2 });
    }
    tell(p, "§cCore Surge! Three hostile mobs have appeared. Defeat them for survival loot.");
  } catch { tell(p, "Core Surge triggered, but there was not enough room to spawn its challenge."); }
}

function replaceDrops(dim) {
  try {
    if (ALWAYS_DROP_DIRT > 0) dim.spawnItem(new ItemStack("minecraft:dirt", ALWAYS_DROP_DIRT), coreCenter(ORIGIN, 1.0));
  } catch {}
}

function placeCore(dimension) {
  try {
    const block = dimension.getBlock(ORIGIN);
    if (!block) return false;
    const stage = stageFor(globalScore("#breaks"));
    const id = block.typeId;
    if (id === "minecraft:air" || id === "minecraft:grass_block") {
      block.setPermutation(BlockPermutation.resolve(CORE_BLOCK, { [STAGE_STATE]: stage }));
    } else if (id === CORE_BLOCK && block.permutation.getState(STAGE_STATE) !== stage) {
      block.setPermutation(BlockPermutation.resolve(CORE_BLOCK, { [STAGE_STATE]: stage }));
    }
    return true;
  } catch { return false; }
}

function onCoreBreak(p, dim) {
  initialize(p);
  const personal = mined(p) + 1;
  const total = globalScore("#breaks") + 1;
  setScore(MINED, p, personal);
  setGlobal("#breaks", total);
  updateCoreStage();

  const pres = prestige(p);
  let gain = Math.max(1, Math.round(STAGES[stageFor(total)].reward * (1 + 0.1 * pres)));

  const stageReward = STAGE_REWARDS.find(r => r.blocks === personal);
  if (stageReward && pres === 0) { gain += stageReward.coins; tell(p, fmt(personal) + " personal breaks! Stage bonus: +" + money(stageReward.coins) + "."); }
  if (personal % 250 === 0) { gain += 20; tell(p, "Milestone reached: " + fmt(personal) + " personal breaks. +" + money(20) + " bonus."); }
  if (total % 500 === 0) { gain += 50; tell(p, "Core Surge milestone! +" + money(50) + "."); spawnMobWave(p); }
  setScore(COINS, p, balance(p) + gain);

  for (const s of SHOPS) if (s.unlock > 0 && s.unlock === personal) { tell(p, "New shop unlocked: " + s.name + "!"); try { p.playSound("random.levelup"); } catch {} }
  const newStage = STAGES.find(s => s.unlock > 0 && s.unlock === total);
  if (newStage) world.sendMessage("§6[Dirtbound] §fThe central OneBlock evolved into the " + newStage.name + "! It is tougher to mine; use better pickaxes.");
}

world.afterEvents.itemUse.subscribe(e => {
  if (e.itemStack?.typeId !== TRADER_ITEM) return;
  const p = e.source;
  if (p?.typeId === "minecraft:player") system.run(() => showMain(p));
});

world.afterEvents.playerBreakBlock.subscribe(e => {
  const b = e.block, loc = b.location, p = e.player;
  if (!p || b.dimension.id !== OVERWORLD) return;
  if (loc.x !== ORIGIN.x || loc.y !== ORIGIN.y || loc.z !== ORIGIN.z) return;
  const dim = b.dimension;
  system.run(() => { onCoreBreak(p, dim); placeCore(dim); });
  system.runTimeout(() => replaceDrops(dim), 2);
});

world.afterEvents.playerSpawn.subscribe(e => system.runTimeout(() => {
  try {
    initialize(e.player); recoverTrader(e.player);
    if (e.initialSpawn) tell(e.player, "§6" + CUR + "§f is the Dirtbound currency. It is not Marketplace Minecoins. Open your Trader Ledger and tap §eAbout " + CUR + "§f for details.");
  } catch {}
}, 5));
world.afterEvents.playerLeave.subscribe(e => ready.delete(e.playerId));

let coreReady = false;
const initLoop = system.runInterval(() => {
  try {
    if (REQUIRE_VOID_TAG && !world.getAllPlayers().some(p => p.hasTag("void_cleaned"))) return;
    if (placeCore(world.getDimension("overworld"))) { coreReady = true; system.clearRun(initLoop); }
  } catch {}
}, 10);

system.runInterval(() => {
  if (!coreReady) return;
  const dim = world.getDimension("overworld");
  placeCore(dim);
}, 20);

system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    try { initialize(p); recoverTrader(p); } catch {}
  }
}, 40);

if (HUD_ENABLED) system.runInterval(() => {
  if (!coreReady) return;
  const total = globalScore("#breaks");
  const next = STAGES.find(s => s.unlock > total);
  for (const p of world.getAllPlayers()) {
    try {
      if (!ready.has(p.id)) continue;
      p.onScreenDisplay.setActionBar("§6" + money(balance(p)) + " §8| §bMined " + fmt(mined(p)) +
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
});
