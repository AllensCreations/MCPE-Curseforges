import { world, system, ItemStack, ItemTypes, DisplaySlotId, ObjectiveSortOrder, EquipmentSlot } from "@minecraft/server";
import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";

const CORE = { x: 0, y: 64, z: 0 };
const BEDROCK = { x: 0, y: 63, z: 0 };
const LEDGER = "allenscreations:trader_ledger";
const COINS = "obm_coins";
const BOARD = "obm_coins_board";
const MINED = "obm_mined";
const TOTAL = "obm_total";
const GLOBAL_KEY = "OneBlockNaturalMarket";
const READY_EVENT = "allenscreations:oneblock_ready";
const MCICON_DIR = "textures/ui/natural_market/icons/";
const CATEGORIES = [
  { name: "Natural Blocks", icon: MCICON_DIR + "stone" },
  { name: "Farming", icon: MCICON_DIR + "wheat" },
  { name: "Food", icon: MCICON_DIR + "beef" },
  { name: "Ores & Minerals", icon: MCICON_DIR + "diamond" },
  { name: "Mob Drops", icon: MCICON_DIR + "bone" },
  { name: "Nether", icon: MCICON_DIR + "netherrack" },
  { name: "Endgame", icon: MCICON_DIR + "ender_pearl" },
  { name: "Spawn Eggs", icon: MCICON_DIR + "cow_spawn_egg" }
];
const CORE_PREFIX = "allenscreations:core_";
const CORE_COUNT = 30;
const LEGACY_CORE = [
  "dirt", "coarse_dirt", "clay", "oak_log", "spruce_log", "birch_log",
  "jungle_log", "acacia_log", "cobblestone", "stone", "andesite", "diorite",
  "granite", "coal_ore", "copper_ore", "iron_ore", "gold_ore", "lapis_ore",
  "redstone_ore", "deepslate_iron_ore", "deepslate_gold_ore", "diamond_ore", "emerald_ore", "nether_gold_ore",
  "quartz_ore", "blackstone", "end_stone", "crying_obsidian", "ancient_debris", "obsidian"
];
const TIER_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 14, 15, 17, 18, 20, 22, 24, 26, 28, 31, 33, 36, 39, 42, 45, 49, 52, 56, 60];
const TIER_WEAR = [1, 1, 2, 2, 3, 3];
const CORE_ID = Array.from({ length: CORE_COUNT }, (_, i) => CORE_PREFIX + String(i + 1).padStart(2, "0") + "_note");
const MILESTONES = CORE_ID.map((id, i) => ({
  unlock: i === 0 ? 0 : Math.round(10000 * Math.pow(i / (CORE_COUNT - 1), 1.6) / 10) * 10,
  ids: [id],
  reward: TIER_VALUES[i]
}));
const BLOCK_TIER = new Map();
CORE_ID.forEach((id, i) => BLOCK_TIER.set(id, i));
LEGACY_CORE.forEach((slug, i) => BLOCK_TIER.set("minecraft:" + slug, i));
BLOCK_TIER.set("minecraft:stone_bricks", 25);
BLOCK_TIER.set("minecraft:quartz_block", 26);
BLOCK_TIER.set("minecraft:purpur_block", 26);
function coreTier(id) { return BLOCK_TIER.get(id) ?? 0; }
function blockValue(id) { return BLOCK_TIER.has(id) ? TIER_VALUES[BLOCK_TIER.get(id)] : 1; }
function blockName(id) {
  const note = /^allenscreations:core_(\d+)_note$/.exec(id);
  if (note) return "Currency Block " + Number(note[1]);
  return id.replace(/^[^:]*:/, "").split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}
const NAME_FIX = {
  beef: "Raw Beef", porkchop: "Raw Porkchop", chicken: "Raw Chicken", mutton: "Raw Mutton",
  rabbit: "Raw Rabbit", cod: "Raw Cod", salmon: "Raw Salmon"
};
function makeEntry(raw, price, amount, category, tier) {
  return {
    id: "minecraft:" + raw, raw, price, amount, category, tier,
    name: NAME_FIX[raw] ?? raw.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")
  };
}
const CATALOG = [
  ["dirt", 2, 16, "Natural Blocks", 0],
  ["sand", 2, 16, "Natural Blocks", 0],
  ["gravel", 2, 16, "Natural Blocks", 0],
  ["wheat_seeds", 2, 16, "Farming", 0],
  ["coarse_dirt", 2, 16, "Natural Blocks", 1],
  ["clay", 4, 8, "Natural Blocks", 2],
  ["oak_sapling", 4, 4, "Farming", 2],
  ["oak_log", 3, 8, "Natural Blocks", 3],
  ["carrot", 3, 8, "Farming", 3],
  ["potato", 3, 8, "Farming", 3],
  ["beetroot_seeds", 3, 8, "Farming", 3],
  ["spruce_log", 3, 8, "Natural Blocks", 4],
  ["wheat", 4, 8, "Farming", 4],
  ["pumpkin", 4, 4, "Farming", 4],
  ["beetroot", 3, 8, "Farming", 4],
  ["apple", 5, 8, "Food", 4],
  ["birch_log", 3, 8, "Natural Blocks", 5],
  ["white_wool", 6, 16, "Natural Blocks", 5],
  ["pumpkin_seeds", 4, 8, "Farming", 5],
  ["melon_seeds", 4, 8, "Farming", 5],
  ["melon_slice", 3, 8, "Food", 5],
  ["sugar_cane", 3, 8, "Farming", 5],
  ["feather", 5, 8, "Mob Drops", 5],
  ["jungle_log", 3, 8, "Natural Blocks", 6],
  ["bamboo", 4, 8, "Farming", 6],
  ["beef", 5, 8, "Food", 6],
  ["porkchop", 5, 8, "Food", 6],
  ["chicken", 4, 8, "Food", 6],
  ["bone", 8, 8, "Mob Drops", 6],
  ["rotten_flesh", 3, 8, "Mob Drops", 6],
  ["leather", 8, 8, "Mob Drops", 6],
  ["acacia_log", 3, 8, "Natural Blocks", 7],
  ["dark_oak_log", 3, 8, "Natural Blocks", 7],
  ["sweet_berries", 5, 8, "Farming", 7],
  ["mutton", 5, 8, "Food", 7],
  ["rabbit", 4, 8, "Food", 7],
  ["string", 8, 8, "Mob Drops", 7],
  ["mangrove_log", 4, 8, "Natural Blocks", 8],
  ["cherry_log", 4, 8, "Natural Blocks", 8],
  ["cobblestone", 3, 16, "Natural Blocks", 8],
  ["cocoa_beans", 4, 8, "Farming", 8],
  ["cod", 4, 8, "Food", 8],
  ["salmon", 5, 8, "Food", 8],
  ["coal", 8, 8, "Ores & Minerals", 8],
  ["spider_eye", 8, 8, "Mob Drops", 8],
  ["rabbit_hide", 6, 8, "Mob Drops", 8],
  ["stone", 5, 16, "Natural Blocks", 9],
  ["sandstone", 4, 16, "Natural Blocks", 9],
  ["gunpowder", 10, 8, "Mob Drops", 9],
  ["ink_sac", 7, 8, "Mob Drops", 9],
  ["andesite", 4, 16, "Natural Blocks", 10],
  ["red_sandstone", 5, 16, "Natural Blocks", 10],
  ["diorite", 4, 16, "Natural Blocks", 11],
  ["granite", 4, 16, "Natural Blocks", 12],
  ["terracotta", 8, 16, "Natural Blocks", 12],
  ["mossy_cobblestone", 7, 16, "Natural Blocks", 12],
  ["slime_ball", 18, 4, "Mob Drops", 12],
  ["moss_block", 8, 8, "Natural Blocks", 13],
  ["coal_ore", 12, 4, "Ores & Minerals", 13],
  ["raw_copper", 8, 8, "Ores & Minerals", 13],
  ["tuff", 6, 16, "Natural Blocks", 14],
  ["copper_ore", 10, 4, "Ores & Minerals", 14],
  ["raw_iron", 14, 8, "Ores & Minerals", 14],
  ["iron_ore", 18, 4, "Ores & Minerals", 15],
  ["packed_ice", 12, 8, "Natural Blocks", 16],
  ["raw_gold", 25, 4, "Ores & Minerals", 16],
  ["prismarine_shard", 18, 4, "Mob Drops", 16],
  ["prismarine_crystals", 20, 4, "Mob Drops", 16],
  ["calcite", 7, 16, "Natural Blocks", 17],
  ["gold_ore", 30, 4, "Ores & Minerals", 17],
  ["netherrack", 12, 16, "Nether", 17],
  ["lapis_lazuli", 18, 8, "Ores & Minerals", 18],
  ["soul_sand", 15, 8, "Nether", 18],
  ["deepslate", 8, 16, "Natural Blocks", 19],
  ["redstone", 14, 8, "Ores & Minerals", 19],
  ["basalt", 10, 16, "Nether", 19],
  ["blackstone", 10, 16, "Nether", 19],
  ["nautilus_shell", 45, 1, "Mob Drops", 20],
  ["ender_pearl", 35, 2, "Endgame", 20],
  ["crimson_stem", 8, 8, "Nether", 20],
  ["warped_stem", 8, 8, "Nether", 20],
  ["glowstone_dust", 15, 8, "Nether", 21],
  ["diamond", 60, 2, "Ores & Minerals", 22],
  ["blaze_rod", 40, 2, "Nether", 22],
  ["quartz", 24, 8, "Nether", 22],
  ["nether_wart", 18, 8, "Nether", 22],
  ["diamond_ore", 90, 4, "Ores & Minerals", 23],
  ["emerald", 65, 2, "Ores & Minerals", 23],
  ["emerald_ore", 95, 4, "Ores & Minerals", 24],
  ["ghast_tear", 55, 1, "Mob Drops", 24],
  ["trident", 280, 1, "Endgame", 25],
  ["end_stone", 25, 16, "Endgame", 25],
  ["shulker_shell", 75, 1, "Endgame", 26],
  ["heart_of_the_sea", 160, 1, "Endgame", 26],
  ["chorus_fruit", 20, 4, "Endgame", 26],
  ["crying_obsidian", 45, 4, "Nether", 27],
  ["totem_of_undying", 900, 1, "Endgame", 27],
  ["ancient_debris", 250, 2, "Nether", 28],
  ["nether_star", 600, 1, "Endgame", 28],
  ["elytra", 800, 1, "Endgame", 28],
  ["obsidian", 30, 4, "Nether", 29]
].map(row => makeEntry(...row));
const SPAWN_EGGS = [
    ["chicken", 50, 9], ["pig", 60, 9], ["cow", 60, 10], ["sheep", 60, 10], ["rabbit", 70, 10],
    ["cat", 90, 11], ["wolf", 110, 11], ["horse", 130, 12], ["donkey", 130, 12], ["llama", 140, 12],
    ["fox", 120, 13], ["bee", 100, 13], ["zombie", 120, 13], ["skeleton", 150, 13], ["mooshroom", 160, 14],
    ["goat", 130, 14], ["frog", 120, 14], ["spider", 130, 14], ["turtle", 150, 15], ["axolotl", 150, 15],
    ["creeper", 200, 15], ["slime", 180, 16], ["panda", 220, 16], ["witch", 260, 17], ["camel", 240, 17],
    ["enderman", 320, 19], ["blaze", 350, 20], ["magma_cube", 260, 20]
];
for (const [mob, price, tier] of SPAWN_EGGS) CATALOG.push(makeEntry(mob + "_spawn_egg", price, 1, "Spawn Eggs", tier));
const SELL_FIX = { ancient_debris: 40, obsidian: 10 };
const priceMult = tier => (tier <= 5 ? 1 : 1 + (tier - 5) * 0.4 + (tier - 5) * (tier - 5) * 0.012);
for (const item of CATALOG) {
  item.sell = item.category === "Spawn Eggs" ? 0 : (SELL_FIX[item.raw] ?? Math.max(1, Math.floor(item.price / 2)));
  item.price = Math.max(1, Math.round(item.price * priceMult(item.tier)));
  item.icon = MCICON_DIR + item.raw;
}
const MARKET_KEY = "obm_market";
const HEAT_STEP = 0.15;
const PRICE_CAP = 12;
const HEAT_CAP = Math.log(PRICE_CAP);
const TICKS_PER_MINUTE = 1200;
function loadMarket() {
  try {
    const raw = world.getDynamicProperty(MARKET_KEY);
    const data = typeof raw === "string" ? JSON.parse(raw) : {};
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}
function itemHeat(item, market, now) {
  const entry = market[item.raw];
  if (!Array.isArray(entry)) return 0;
  const age = Math.max(0, now - entry[1]);
  return entry[0] * Math.pow(0.5, age / ((8 + item.tier * 0.6) * TICKS_PER_MINUTE));
}
function unitPrice(item, heat) { return Math.max(1, Math.round(item.price * Math.min(PRICE_CAP, Math.exp(heat)))); }
function quote(item, heat, units = item.amount) {
  let total = 0;
  for (let i = 0; i < units; i++) total += unitPrice(item, Math.min(HEAT_CAP, heat + HEAT_STEP * i / item.amount));
  return total;
}
function demandPercent(heat) { return Math.round((Math.min(PRICE_CAP, Math.exp(heat)) - 1) * 100); }
function recordPurchase(item, units) {
  try {
    const now = world.getAbsoluteTime();
    const market = loadMarket();
    const next = {};
    for (const other of CATALOG) {
      const heat = other === item
        ? Math.min(HEAT_CAP, itemHeat(other, market, now) + HEAT_STEP * units / item.amount)
        : itemHeat(other, market, now);
      if (heat >= 0.02) next[other.raw] = [Math.round(heat * 1000) / 1000, now];
    }
    world.setDynamicProperty(MARKET_KEY, JSON.stringify(next));
  } catch (e) { logError("recordPurchase", e); }
}
const COOLDOWN_KEY = "obm_cooldown";
const BURST_KEY = "obm_burst";
const BURST_LIMIT = 50;
const BURST_SECONDS = 30;
const PHASE_SECONDS = 60;
const LEDGER_PENDING = "obm_ledger_pending";
const DEBUG_TAG = "obm_debug";
const STATUS_EVENT = "allenscreations:obm_status";
const logLast = new Map();
function log(level, message, key) {
  if (key !== undefined) {
    if (logLast.get(key) === message) return;
    logLast.set(key, message);
  }
  const line = "[OBM][" + level + "] " + message;
  console.warn(line);
  try {
    for (const p of world.getAllPlayers()) if (p.hasTag(DEBUG_TAG)) p.sendMessage("§f" + line);
  } catch {}
}
function logError(context, error) {
  const stack = error && error.stack ? " | " + String(error.stack).split("\n")[0] : "";
  log("ERROR", context + ": " + error + stack, "err:" + context);
}
function statusReport() {
  try {
    const players = world.getAllPlayers();
    let core = "unknown", bedrock = "unknown";
    try {
      const dimension = world.getDimension("overworld");
      core = dimension.getBlock(CORE)?.typeId ?? "unloaded";
      bedrock = dimension.getBlock(BEDROCK)?.typeId ?? "unloaded";
    } catch (e) { core = "error: " + e; }
    return "players=" + players.length + " void_cleaned=" + players.filter(p => p.hasTag("void_cleaned")).length +
      " core=" + core + " bedrock=" + bedrock + " pool=" + currentPool().length + " shared_breaks=" + totalBreaks();
  } catch (e) { return "status failed: " + e; }
}
const objectiveCache = new Map();
function objective(name) {
  let obj = objectiveCache.get(name);
  if (!obj) {
    obj = world.scoreboard.getObjective(name) ?? world.scoreboard.addObjective(name, name === BOARD ? "Coins" : name);
    objectiveCache.set(name, obj);
  }
  return obj;
}
function readScore(name, identity) {
  try { return objective(name).getScore(identity) ?? 0; } catch { return 0; }
}
function writeScore(name, identity, value) {
  try {
    objective(name).setScore(identity, Math.max(0, Math.floor(value)));
    if (name === COINS) updateBoard(identity, value);
    return true;
  } catch { return false; }
}
function balance(player) { return readScore(COINS, player); }
function personalBreaks(player) { return readScore(MINED, player); }
function totalBreaks() { return readScore(TOTAL, GLOBAL_KEY); }
function setBalance(player, amount) { return writeScore(COINS, player, amount); }
function inventoryOf(player) { return player.getComponent("minecraft:inventory")?.container; }
function itemAvailable(item) {
  try { return !!ItemTypes.get(item.id); } catch { return false; }
}
function tell(player, message) { try { player.onScreenDisplay.setActionBar("§6[Market] §r" + message); } catch {} }

function showBalance(player) {
  try { player.onScreenDisplay.setActionBar("§6Coins: §e" + balance(player) + " §f| §fBlocks: §f" + personalBreaks(player)); } catch {}
}
function hasLedger(player) {
  const inv = inventoryOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) if (inv.getItem(i)?.typeId === LEDGER) return true;
  return false;
}
function grantLedger(player) {
  if (hasLedger(player)) return true;
  const inv = inventoryOf(player);
  if (!inv || inv.emptySlotsCount < 1) {
    try { player.addTag(LEDGER_PENDING); } catch {}
    tell(player, "Free one inventory slot to receive your Natural Market Ledger.");
    return false;
  }
  try {
    inv.addItem(new ItemStack(LEDGER, 1));
    tell(player, "Your Natural Market Ledger is ready. Use it to open the market.");
    return true;
  } catch { return false; }
}
function restoreLedger(player) {
  if (hasLedger(player)) { try { player.removeTag(LEDGER_PENDING); } catch {} return; }
  const inv = inventoryOf(player);
  if (!inv || inv.emptySlotsCount < 1) { try { player.addTag(LEDGER_PENDING); } catch {} return; }
  try {
    for (const e of player.dimension.getEntities({ type: "minecraft:item", location: player.location, maxDistance: 24 })) {
      try { if (e.getComponent("minecraft:item")?.itemStack?.typeId === LEDGER) e.kill(); } catch {}
    }
  } catch {}
  try {
    inv.addItem(new ItemStack(LEDGER, 1));
    player.removeTag(LEDGER_PENDING);
    tell(player, "The Ledger returned to your inventory.");
  } catch (e) { logError("restoreLedger", e); }
}
function hasScore(name, player) {
  try { return objective(name).getScore(player) !== undefined; } catch { return false; }
}
function initializePlayer(player) {
  if (!hasScore(COINS, player)) writeScore(COINS, player, 50);
  if (!hasScore(MINED, player)) writeScore(MINED, player, 0);
  updateBoard(player, balance(player));
  showBalance(player);
  grantLedger(player);
}
function unlockedTier(player) {
  let tier = 0;
  const breaks = personalBreaks(player);
  for (let i = 0; i < MILESTONES.length; i++) if (breaks >= MILESTONES[i].unlock) tier = i;
  return tier;
}
function showForm(form, player, retries = 0) {
  return form.show(player).then(result => {
    if (result.canceled && result.cancelationReason === "UserBusy" && retries < 20) {
      return new Promise(resolve => system.runTimeout(() => resolve(showForm(form, player, retries + 1)), 10));
    }
    return result;
  });
}
function currentPool() {
  return [...new Set(MILESTONES.filter(m => totalBreaks() >= m.unlock).flatMap(m => m.ids))];
}
function coreBlock() {
  const pool = currentPool();
  return pool[Math.floor(Math.random() * pool.length)] ?? "minecraft:dirt";
}
function placeCore(block) {
  for (let i = 0; i < 5; i++) {
    try { const id = coreBlock(); block.setType(id); log("INFO", "Core placed: " + id); return; } catch (e) { logError("placeCore", e); }
  }
  try { block.setType("minecraft:dirt"); log("WARN", "Core placed with the Dirt fallback."); } catch (e) { logError("placeCore fallback", e); }
}
function ensureCore() {
  const players = world.getAllPlayers();
  if (!players.some(p => p.hasTag("void_cleaned"))) {
    log("WARN", "Core check skipped: no online player has the void_cleaned tag yet (the void_cleaner / tick function may not be running).", "core_wait");
    return;
  }
  try {
    const dimension = world.getDimension("overworld");
    const below = dimension.getBlock(BEDROCK);
    if (below && below.typeId === "minecraft:bedrock") below.setType("minecraft:air");
    const core = dimension.getBlock(CORE);
    if (!core) log("WARN", "Core location 0 64 0 is not loaded.", "core_unloaded");
    if (core && (core.typeId === "minecraft:air" || core.typeId === "minecraft:grass_block")) {
      log("INFO", "Core was " + core.typeId + "; placing a new core.");
      placeCore(core);
    }
  } catch (e) { logError("ensureCore", e); }
}
const HIDE_PREFIX = "obm_hide_";
function nameHidden(player) { return world.getDynamicProperty(HIDE_PREFIX + player.name) === true; }
function boardLabel(player, hidden) {
  if (!hidden) return player.name;
  let h = 0;
  for (const ch of player.name) h = (h * 31 + ch.charCodeAt(0)) % 9000;
  return "Hidden " + (h + 1000);
}
function updateBoard(player, value) {
  try { objective(BOARD).setScore(boardLabel(player, nameHidden(player)), Math.max(0, Math.floor(value))); } catch {}
}
function setNameHidden(player, hidden) {
  try {
    const board = objective(BOARD);
    board.removeParticipant(boardLabel(player, !hidden));
    world.setDynamicProperty(HIDE_PREFIX + player.name, hidden);
    board.setScore(boardLabel(player, hidden), balance(player));
    return true;
  } catch (e) {
    logError("setNameHidden", e);
    return false;
  }
}
function showBoard() {
  try {
    world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, { objective: objective(BOARD), sortOrder: ObjectiveSortOrder.Descending });
  } catch (e) { logError("showBoard", e); }
}
function showAbout(player) {
  let form = new ModalFormData().title("ABOUT - NATURAL MARKET");
  form = addOptional(form, "header", "OneBlock Natural Market");
  form = addOptional(form, "label",
    "by ALNStudios\n\n" +
    "Start in the void on a single regenerating block.\n" +
    "Break the core to earn Coins. Each block type pays its own value and takes its own time to break.\n" +
    "Use the Natural Market Ledger to buy natural supplies. Prices rise when a lot is bought and slowly settle back down.\n" +
    "After " + BURST_LIMIT + " breaks the core turns to Bedrock for " + BURST_SECONDS + " seconds, and for " + PHASE_SECONDS + " seconds at every new phase.\n\n" +
    "The Ledger cannot be dropped. It always returns to you.\n\n" +
    "Version: v17 | ALNStudios | CurseForge / MCPEDL");
  form = addOptional(form, "divider");
  form = form.toggle("Hide my name on the Coins scoreboard", { defaultValue: nameHidden(player) });
  form = form.submitButton("Save");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    const values = (r.formValues ?? []).filter(v => typeof v === "boolean");
    if (values.length !== 1) return tell(player, "The setting could not be read.");
    if (values[0] === nameHidden(player)) return;
    if (setNameHidden(player, values[0])) tell(player, values[0] ? "Your name is hidden on the scoreboard." : "Your name is shown on the scoreboard.");
    else tell(player, "The scoreboard setting could not be saved.");
  }).catch(e => { logError("showAbout", e); });
}
function marketMain(player) {
  const form = new ActionFormData()
    .title("NATURAL MARKET")
    .body("§6Coins: §e" + balance(player) + "§r\nPersonal breaks: " + personalBreaks(player) +
      "\nShared breaks: " + totalBreaks() + "\nUnlocked tier: " + (unlockedTier(player) + 1) + " / " + MILESTONES.length + "\n\nChoose a market section.");
  for (const c of CATEGORIES) form.button(c.name, c.icon);
  form
    .button("Search", MCICON_DIR + "spyglass")
    .button("Sell Items", MCICON_DIR + "gold_ingot")
    .button("About", "textures/ui/icon_recipe_nature");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection < CATEGORIES.length) return showCategory(player, CATEGORIES[r.selection].name);
    if (r.selection === CATEGORIES.length) return searchMarket(player);
    if (r.selection === CATEGORIES.length + 1) return showSellMenu(player);
    if (r.selection === CATEGORIES.length + 2) return showAbout(player);
  }).catch(e => { logError("marketMain", e); tell(player, "The market menu could not open. Try using the Ledger again."); });
}

function marketButtonText(item, market, now) {
  const heat = itemHeat(item, market, now);
  const demand = demandPercent(heat);
  return item.name + "\n§e" + item.amount + "x - " + quote(item, heat) + " Coins" + (demand >= 5 ? " §c+" + demand + "%" : "");
}
function searchMarket(player) {
  const form = new ModalFormData().title("SEARCH MARKET")
    .textField("Item name (unlocked supplies only)", "for example: diamond, log, egg");
  showForm(form, player).then(r => {
    if (r.canceled) return marketMain(player);
    const text = String(r.formValues?.[0] ?? "").trim().toLowerCase();
    if (!text) { tell(player, "Type part of an item name to search."); return marketMain(player); }
    return showSearchResults(player, text);
  }).catch(e => { logError("searchMarket", e); tell(player, "The search could not open."); });
}
function showSearchResults(player, text) {
  const tier = unlockedTier(player);
  const words = text.split(/\s+/).filter(Boolean);
  const matches = CATALOG.filter(item => {
    const hay = (item.name + " " + item.raw.replace(/_/g, " ")).toLowerCase();
    return words.every(w => hay.includes(w));
  });
  const items = matches.filter(item => item.tier <= tier && itemAvailable(item)).slice(0, 30);
  const lockedCount = matches.filter(item => item.tier > tier).length;
  if (!items.length) {
    tell(player, lockedCount ? "Matching supplies are still locked. Keep mining the core!" : "No supplies match \"" + text + "\".");
    return searchMarket(player);
  }
  const market = loadMarket();
  const now = world.getAbsoluteTime();
  const form = new ActionFormData().title("SEARCH: " + text.toUpperCase().slice(0, 20))
    .body("§6Coins: §e" + balance(player) + "§r\nTap a supply slot to buy the listed bundle." +
      (lockedCount ? "\n" + lockedCount + " more match(es) are still locked." : ""));
  for (const item of items) form.button(marketButtonText(item, market, now), item.icon || undefined);
  form.button("Search Again", MCICON_DIR + "spyglass");
  form.button("Back to Market", "textures/ui/arrow_left");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection < items.length) return purchase(player, items[r.selection]);
    if (r.selection === items.length) return searchMarket(player);
    return marketMain(player);
  }).catch(e => { logError("showSearchResults", e); tell(player, "The search results could not open."); });
}
function showCategory(player, category, page = 0) {
  const tier = unlockedTier(player);
  const items = CATALOG.filter(item => item.category === category && item.tier <= tier && itemAvailable(item));
  const locked = CATALOG.filter(item => item.category === category && item.tier > tier);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.max(0, Math.min(page, pageCount - 1));
  const visible = items.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const market = loadMarket();
  const now = world.getAbsoluteTime();
  const form = new ActionFormData().title(category.toUpperCase())
    .body("§6Coins: §e" + balance(player) + "§r  |  Page " + (safePage + 1) + "/" + pageCount +
      "\nTap a supply slot to buy the listed bundle. Prices rise when a lot is bought and settle back over time." +
      (locked.length ? "\nMore supplies unlock as you mine the core." : ""));
  for (const item of visible) form.button(marketButtonText(item, market, now), item.icon || undefined);
  if (safePage + 1 < pageCount) form.button("Next Page", "textures/ui/arrow_right");
  form.button("Back to Market", "textures/ui/arrow_left");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection < visible.length) return purchase(player, visible[r.selection]);
    const nextIndex = visible.length;
    if (safePage + 1 < pageCount && r.selection === nextIndex) return showCategory(player, category, safePage + 1);
    return marketMain(player);
  }).catch(e => { logError("showCategory", e); tell(player, "This category could not open."); });
}
function purchase(player, item) {
  if (item.tier > unlockedTier(player)) return tell(player, "Mine more central blocks to unlock this supply.");
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const funds = balance(player);
  const heat = itemHeat(item, loadMarket(), world.getAbsoluteTime());
  const totalPrice = quote(item, heat);
  if (funds < totalPrice) return tell(player, "Not enough Coins. You need " + totalPrice + " Coins.");
  let stack;
  try { stack = new ItemStack(item.id, item.amount); } catch { return tell(player, "This item is not available in the current game version."); }
  if (!setBalance(player, funds - totalPrice)) return tell(player, "Your balance could not be updated; no purchase was made.");
  let leftover;
  try { leftover = inv.addItem(stack); } catch { leftover = stack; }
  const delivered = item.amount - (leftover?.amount ?? 0);
  const charged = quote(item, heat, delivered);
  if (charged < totalPrice) setBalance(player, balance(player) + totalPrice - charged);
  if (delivered <= 0) return tell(player, "Inventory full. No Coins were taken.");
  recordPurchase(item, delivered);
  if (delivered < item.amount) tell(player, "Only " + delivered + " item(s) fit; charged " + charged + " Coins.");
  else tell(player, "Purchased " + delivered + " x " + item.name + " for " + charged + " Coins.");
  showBalance(player);
}
function scanSellable(inv, values) {
  const slots = [];
  let payout = 0, count = 0;
  for (let i = 0; i < inv.size; i++) {
    const stack = inv.getItem(i);
    if (!stack) continue;
    const unit = values.get(stack.typeId);
    if (!unit) continue;
    slots.push(i);
    payout += unit * stack.amount;
    count += stack.amount;
  }
  return { slots, payout, count };
}
const LOCK_PREFIX = "obm_locks_";
const DEFAULT_LOCKED = new Set(["trident", "elytra", "totem_of_undying"]);
function lockOverrides(player) {
  try {
    const raw = world.getDynamicProperty(LOCK_PREFIX + player.name);
    const data = typeof raw === "string" ? JSON.parse(raw) : {};
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch { return {}; }
}
function isLocked(overrides, item) {
  return Object.prototype.hasOwnProperty.call(overrides, item.raw) ? overrides[item.raw] === 1 : DEFAULT_LOCKED.has(item.raw);
}
function setLocked(player, items, locked) {
  const data = lockOverrides(player);
  for (const item of items) {
    if (locked === DEFAULT_LOCKED.has(item.raw)) delete data[item.raw];
    else data[item.raw] = locked ? 1 : 0;
  }
  try {
    world.setDynamicProperty(LOCK_PREFIX + player.name, JSON.stringify(data));
    return true;
  } catch (e) {
    logError("setLocked", e);
    tell(player, "Your lock list could not be saved.");
    return false;
  }
}
const addOptional = (form, method, ...args) => (typeof form[method] === "function" ? form[method](...args) : form);
function showLockForm(player, owned) {
  const locks = lockOverrides(player);
  let form = new ModalFormData().title("LOCK ITEMS");
  form = addOptional(form, "header", "Locked Items");
  form = addOptional(form, "label", "Switch an item on to lock it. Locked items are never sold.");
  for (const [item, amount] of owned) {
    form = form.toggle(item.name + " - " + amount + "x - " + item.sell + " Coins each", { defaultValue: isLocked(locks, item) });
  }
  form = form.submitButton("Save");
  showForm(form, player).then(r => {
    if (r.canceled) return showSellMenu(player);
    const values = (r.formValues ?? []).filter(v => typeof v === "boolean");
    if (values.length !== owned.length) {
      tell(player, "The lock list could not be read.");
      return showSellMenu(player);
    }
    const toLock = [], toUnlock = [];
    owned.forEach(([item], i) => (values[i] ? toLock : toUnlock).push(item));
    setLocked(player, toLock, true);
    setLocked(player, toUnlock, false);
    return showSellMenu(player);
  }).catch(e => { logError("showLockForm", e); tell(player, "The lock list could not open."); });
}
function showSellMenu(player) {
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const itemById = new Map(CATALOG.map(item => [item.id, item]));
  const totals = new Map();
  for (let i = 0; i < inv.size; i++) {
    const stack = inv.getItem(i);
    const item = stack && itemById.get(stack.typeId);
    if (item) totals.set(item, (totals.get(item) ?? 0) + stack.amount);
  }
  const owned = [...totals].sort((a, b) => a[0].name.localeCompare(b[0].name));
  if (!owned.length) return tell(player, "You have no market items to sell.");
  const locks = lockOverrides(player);
  let payout = 0, sellCount = 0, lockedCount = 0;
  for (const [item, amount] of owned) {
    if (isLocked(locks, item)) lockedCount += amount;
    else { payout += item.sell * amount; sellCount += amount; }
  }
  const form = new ActionFormData().title("SELL ITEMS")
    .body("Will sell: " + sellCount + " item(s) for " + payout + " Coins\nLocked: " + lockedCount + " item(s)")
    .button("§lLock / Unlock Items§r", MCICON_DIR + "iron_door")
    .button("§lSell All§r\nLocked items are kept", MCICON_DIR + "gold_ingot")
    .button("§lExit§r", MCICON_DIR + "oak_door");
  showForm(form, player).then(r => {
    if (r.canceled) return;
    if (r.selection === 0) return showLockForm(player, owned);
    if (r.selection === 1) return sellUnlocked(player);
  }).catch(e => { logError("showSellMenu", e); tell(player, "The sell menu could not open."); });
}
function sellUnlocked(player) {
  const inv = inventoryOf(player);
  if (!inv) return tell(player, "Your inventory is unavailable.");
  const locks = lockOverrides(player);
  const values = new Map(CATALOG.filter(item => !isLocked(locks, item)).map(item => [item.id, item.sell]));
  const { payout, count } = scanSellable(inv, values);
  if (!count) return tell(player, "You have no unlocked market items to sell.");
  const form = new MessageFormData().title("SELL UNLOCKED ITEMS")
    .body("Sell " + count + " unlocked item(s) for " + payout + " Coins? Locked items and items not listed in the market are kept.")
    .button1("Sell")
    .button2("Cancel");
  showForm(form, player).then(r => {
    if (r.canceled || r.selection !== 0) return;
    const again = scanSellable(inv, values);
    if (again.payout !== payout || again.count !== count) return tell(player, "Your inventory changed. Open the sell option again.");
    if (!setBalance(player, balance(player) + payout)) return tell(player, "Balance update failed; your items were kept.");
    for (const slot of again.slots) inv.setItem(slot, undefined);
    tell(player, "Sold " + count + " eligible item(s) for " + payout + " Coins.");
    showBalance(player);
  }).catch(e => { logError("sellEligible", e); tell(player, "The sell confirmation could not open."); });
}
const RING = [
  { x: 1, z: 0 }, { x: 1, z: 1 }, { x: 0, z: 1 }, { x: -1, z: 1 },
  { x: -1, z: 0 }, { x: -1, z: -1 }, { x: 0, z: -1 }, { x: 1, z: -1 }
];
const NOT_SOLID = new Set(["minecraft:air", "minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"]);
function tutorialStep(player, total) {
  if (total < 1 || total > RING.length) return;
  const spot = RING[total - 1];
  try {
    const block = world.getDimension("overworld").getBlock({ x: CORE.x + spot.x, y: CORE.y, z: CORE.z + spot.z });
    if (block && block.typeId === "minecraft:air") block.setType("minecraft:grass_block");
    log("INFO", "Tutorial " + total + "/" + RING.length + ": block placed at " + (CORE.x + spot.x) + " " + CORE.y + " " + (CORE.z + spot.z) + ".");
  } catch (e) { logError("tutorialStep", e); }
  tell(player, total < RING.length
    ? "§eTutorial " + total + "/" + RING.length + ": a block was added beside the core. Keep mining!"
    : "§aTutorial complete: your 3x3 platform is ready.");
}
function rescuePhased() {
  const dimension = world.getDimension("overworld");
  for (const player of world.getAllPlayers()) {
    try {
      if (player.dimension.id !== "minecraft:overworld" || !player.hasTag("void_cleaned")) continue;
      const p = player.location;
      if (p.y >= CORE.y + 0.95 || p.y + 1.75 <= CORE.y + 0.05) continue;
      let stuck = false;
      for (let x = Math.floor(p.x - 0.25); x <= Math.floor(p.x + 0.25) && !stuck; x++) {
        for (let z = Math.floor(p.z - 0.25); z <= Math.floor(p.z + 0.25) && !stuck; z++) {
          if (Math.abs(x - CORE.x) > 1 || Math.abs(z - CORE.z) > 1) continue;
          const block = dimension.getBlock({ x, y: CORE.y, z });
          if (block && !NOT_SOLID.has(block.typeId)) stuck = true;
        }
      }
      if (!stuck) continue;
      player.teleport({ x: CORE.x + 0.5, y: CORE.y + 1, z: CORE.z + 0.5 }, { keepVelocity: false });
      log("INFO", player.name + " was inside the core platform and was moved on top of the core.");
    } catch (e) { logError("rescuePhased", e); }
  }
}
function damageTool(player, heldId, brokenId) {
  try {
    let creative = false;
    try { creative = String(player.getGameMode()).toLowerCase() === "creative"; } catch {}
    if (creative || !heldId) return;
    const base = /_sword$/.test(heldId) ? 2 : /(pickaxe|_axe|_shovel|_hoe|shears)$/.test(heldId) ? 1 : 0;
    if (!base) return;
    const cost = base * (TIER_WEAR[Math.floor(coreTier(brokenId) / 5)] ?? 1);
    const slot = player.getComponent("minecraft:equippable")?.getEquipmentSlot(EquipmentSlot.Mainhand);
    const stack = slot?.getItem();
    const durability = stack?.getComponent("minecraft:durability");
    if (!stack || stack.typeId !== heldId || !durability) return;
    let level = 0;
    try { level = stack.getComponent("minecraft:enchantable")?.getEnchantment("unbreaking")?.level ?? 0; } catch {}
    let hits = 0;
    for (let i = 0; i < cost; i++) if (Math.random() < 1 / (level + 1)) hits++;
    if (!hits) return;
    if (durability.damage + hits >= durability.maxDurability) {
      slot.setItem(undefined);
      try { player.playSound("random.break"); } catch {}
      return;
    }
    durability.damage += hits;
    slot.setItem(stack);
  } catch (e) { logError("damageTool", e); }
}
function cooldownState() {
  try {
    const raw = world.getDynamicProperty(COOLDOWN_KEY);
    const data = typeof raw === "string" && raw ? JSON.parse(raw) : null;
    return data && typeof data.until === "number" ? data : null;
  } catch { return null; }
}
function coreCoolingDown() {
  const state = cooldownState();
  return !!state && world.getAbsoluteTime() < state.until;
}
function startCooldown(seconds, label) {
  try {
    world.setDynamicProperty(COOLDOWN_KEY, JSON.stringify({ until: world.getAbsoluteTime() + seconds * 20, label }));
    world.setDynamicProperty(BURST_KEY, 0);
    const block = world.getDimension("overworld").getBlock(CORE);
    if (block) block.setType("minecraft:bedrock");
    world.sendMessage("§6[Natural Market] §r" + label + ": the core is Bedrock for " + seconds + " seconds.");
    log("INFO", "Cooldown started: " + label + " " + seconds + "s.");
  } catch (e) { logError("startCooldown", e); }
}
function tickCooldown() {
  const state = cooldownState();
  if (!state) return;
  try {
    const left = state.until - world.getAbsoluteTime();
    if (left > 0) {
      const text = "§e" + state.label + ": the core returns in " + Math.ceil(left / 20) + "s";
      for (const p of world.getAllPlayers()) { try { p.onScreenDisplay.setActionBar(text); } catch {} }
      return;
    }
    world.setDynamicProperty(COOLDOWN_KEY, "");
    const block = world.getDimension("overworld").getBlock(CORE);
    if (block && ["minecraft:bedrock", "minecraft:air", "minecraft:grass_block"].includes(block.typeId)) placeCore(block);
    world.sendMessage("§6[Natural Market] §rThe core is back. Keep mining!");
  } catch (e) { logError("tickCooldown", e); }
}
let coreBreakPending = false;
function onCoreBreak(player, brokenId) {
  const personal = personalBreaks(player) + 1;
  const total = totalBreaks() + 1;
  writeScore(MINED, player, personal);
  writeScore(TOTAL, GLOBAL_KEY, total);
  tutorialStep(player, total);
  const value = blockValue(brokenId);
  writeScore(COINS, player, balance(player) + value);
  let cooldown = null;
  if (MILESTONES.some(m => m.unlock > 0 && m.unlock === total)) {
    world.sendMessage("§6[Natural Market] §rA new core milestone has been reached. More block types can now appear.");
    cooldown = { seconds: PHASE_SECONDS, label: "New phase" };
  } else {
    const burst = (Number(world.getDynamicProperty(BURST_KEY)) || 0) + 1;
    if (burst >= BURST_LIMIT) cooldown = { seconds: BURST_SECONDS, label: "Cooldown" };
    else world.setDynamicProperty(BURST_KEY, burst);
  }
  log("INFO", player.name + " mined the core: personal=" + personal + " shared=" + total + " block=" + brokenId + " reward=" + value + ".");
  tell(player, "Core mined: " + blockName(brokenId) + " +" + value + " Coins.");
  showBalance(player);
  return cooldown;
}
system.afterEvents.scriptEventReceive.subscribe(event => {
  if (event.id === STATUS_EVENT) {
    const msg = statusReport();
    console.warn("[OBM][STATUS] " + msg);
    try { event.sourceEntity?.sendMessage("§e[OBM] " + msg); } catch {}
    return;
  }
  if (event.id !== READY_EVENT) return;
  log("INFO", "Ready event received from the tick function.");
  try {
    if (totalBreaks() < RING.length) event.sourceEntity?.sendMessage("§6[Tutorial] §rBreak the block you are standing on. Each of the first " + RING.length + " breaks adds a block beside it until a 3x3 platform surrounds the core.");
  } catch {}
  system.run(() => ensureCore());
});
world.afterEvents.itemUse.subscribe(event => {
  if (event.itemStack?.typeId !== LEDGER) return;
  const player = event.source;
  if (player?.typeId === "minecraft:player") {
    log("INFO", "Ledger used by " + player.name + ".");
    system.run(() => marketMain(player));
  }
});
if (!world.afterEvents.itemThrow) log("WARN", "itemThrow event is not available in this API version; using the dropped-item scan for the Ledger instead.");
world.afterEvents.itemThrow?.subscribe(event => {
  if (event.itemStack?.typeId !== LEDGER) return;
  const player = event.source;
  if (!player || player.typeId !== "minecraft:player") return;
  system.runTimeout(() => {
    try {
      const dimension = player.dimension;
      const nearbyEntities = dimension.getEntities({
        location: player.location,
        maxDistance: 20,
        type: "minecraft:item"
      });
      for (const entity of nearbyEntities) {
        try {
          const itemComp = entity.getComponent("minecraft:item");
          if (itemComp?.itemStack?.typeId === LEDGER) {
            entity.kill();
            break;
          }
        } catch {}
      }
      if (!hasLedger(player)) {
        const inv = inventoryOf(player);
        if (inv) {
          inv.addItem(new ItemStack(LEDGER, 1));
          tell(player, "The Ledger returned to your inventory.");
        }
      }
    } catch (e) { logError("itemThrow ledger return", e); }
  }, 5);
});

world.beforeEvents.playerBreakBlock.subscribe(event => {
  const location = event.block.location;
  const player = event.player;
  if (!player || event.block.dimension.id !== "minecraft:overworld") return;
  if (location.x !== CORE.x || location.y !== CORE.y || location.z !== CORE.z) return;
  event.cancel = true;
  if (coreCoolingDown() || event.block.typeId === "minecraft:bedrock") return;
  if (coreBreakPending) return;
  const brokenId = event.block.typeId;
  const heldId = event.itemStack?.typeId;
  coreBreakPending = true;
  system.run(() => {
    try {
      log("INFO", "Core break detected by " + player.name + " (void_cleaned tag=" + player.hasTag("void_cleaned") + ").");
      if (player.hasTag("void_cleaned")) {
        const cooldown = onCoreBreak(player, brokenId);
        damageTool(player, heldId, brokenId);
        const block = world.getDimension("overworld").getBlock(CORE);
        if (cooldown) startCooldown(cooldown.seconds, cooldown.label);
        else if (block) placeCore(block);
      }
    } catch (e) { logError("core break", e); }
    coreBreakPending = false;
  });
});
world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(() => {
    log("INFO", "Player spawned: " + event.player.name + " (void_cleaned tag=" + event.player.hasTag("void_cleaned") + ").");
    initializePlayer(event.player);
    if (event.player.hasTag("void_cleaned")) ensureCore();
  }, 10);
});
world.afterEvents.playerLeave.subscribe(event => {
  objectiveCache.clear();
});
system.run(() => {
  objective(COINS);
  objective(BOARD);
  showBoard();
  objective(MINED);
  objective(TOTAL);
});
system.runInterval(() => {
  try { ensureCore(); } catch (e) { logError("ensureCore interval", e); }
  log("INFO", statusReport(), "status");
}, 40);
system.runInterval(rescuePhased, 5);
system.runInterval(tickCooldown, 20);
system.run(() => log("INFO", "Script started and handlers registered. Debug chat: /tag @s add obm_debug. Status: /scriptevent allenscreations:obm_status"));
system.runInterval(() => {
  try {
    const players = world.getAllPlayers();
    for (const p of players) if (p.hasTag(LEDGER_PENDING)) restoreLedger(p);
    for (const entity of world.getDimension("overworld").getEntities({ type: "minecraft:item" })) {
      try {
        if (entity.getComponent("minecraft:item")?.itemStack?.typeId !== LEDGER) continue;
        const owner = players.find(p => p.dimension.id === "minecraft:overworld" && !hasLedger(p) && Math.hypot(p.location.x - entity.location.x, p.location.y - entity.location.y, p.location.z - entity.location.z) < 24);
        if (owner) restoreLedger(owner);
      } catch {}
    }
  } catch (e) { logError("ledger return scan", e); }
}, 20);
