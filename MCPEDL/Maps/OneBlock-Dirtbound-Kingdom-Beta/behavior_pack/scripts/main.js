import { world, system, ItemStack, ItemTypes } from "@minecraft/server";
import { ActionFormData, MessageFormData } from "@minecraft/server-ui";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const ORIGIN = { x: 0, y: 0, z: 0 };
const BONUS_POS = { x: 1, y: 1, z: 0 };
const OVERWORLD = "minecraft:overworld";
// Core only initializes once some player has the "void_cleaned" tag (set by your own function/pack).
// Set to false if you don't use a void-cleanup step.
const REQUIRE_VOID_TAG = true;

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

// ---------------------------------------------------------------------------
// Shop data (items are listed once, in the earliest tier they appear in)
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

// Per-item prices (per single item). Anything not listed falls back to TIER_DEFAULT or gear math.
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
      let amount = SINGLES.has(raw) ? 1 : TIER_QTY[tier];
      try { amount = Math.max(1, Math.min(amount, new ItemStack(typeId, 1).maxAmount)); } catch { skipped.push(raw); continue; }
      seen.add(raw);
      items.push({ id: typeId, name: prettyName(raw) + " ×" + amount, amount, price: Math.max(1, Math.round(unitValue(raw, tier) * amount)) });
    }
    return { name: name + " Supplies", unlock, items };
  });
  if (skipped.length) console.warn("[Dirtbound] Skipped invalid item IDs: " + skipped.join(", "));
}

// ---------------------------------------------------------------------------
// Scoreboard helpers (players are passed directly so identities get created)
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

// Retries the form if the player's chat/menu was open (UserBusy)
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
function showMain(p) {
  initialize(p);
  const total = SHOPS.reduce((n, s) => n + s.items.length, 0);
  const tier = SHOPS[shopTierIndex(mined(p))];
  const form = new ActionFormData().title("DIRTBOUND TRADER")
    .body("OneCoins: §e" + balance(p) + "§r\nYour blocks mined: " + mined(p) + "\nShop tier (personal): " + (tier ? tier.name : "-") +
      "\nCore stage (shared): " + STAGES[stageFor(globalScore("#breaks"))].name + "\nPrestige " + prestige(p) +
      "\n" + total + " supplies across " + SHOPS.length + " tiers.")
    .button("Browse Supplies").button("Sell All Dirt").button("Recover Trader Ledger").button("Balance & Progress").button("Kingdom Prestige");
  showForm(form, p).then(r => {
    if (r.canceled) return;
    if (r.selection === 0) showShop(p);
    else if (r.selection === 1) sellDirt(p);
    else if (r.selection === 2) { if (recoverTrader(p)) tell(p, "Trader access restored."); else tell(p, "Make one inventory slot free, then recover the Ledger here."); }
    else if (r.selection === 3) {
      const next = SHOPS.find(s => s.unlock > mined(p));
      tell(p, "Balance: " + balance(p) + " OneCoins. Your blocks mined: " + mined(p) + ". Shared core stage: " + STAGES[stageFor(globalScore("#breaks"))].name +
        " (" + globalScore("#breaks") + " total breaks). " + (next ? "Next shop tier: " + next.name + " at " + next.unlock + " of your own breaks." : "All shop tiers unlocked."));
    } else if (r.selection === 4) showPrestige(p);
  }).catch(() => tell(p, "Trader UI failed to open. Interact with the Trader Post or Ledger again."));
}

function showShop(p) {
  const count = mined(p);
  const f = new ActionFormData().title("SUPPLY TIERS").body("Balance: " + balance(p) + " OneCoins\nChoose a tier. Locked tiers show how many of your own breaks they need.");
  for (const s of SHOPS) f.button(count >= s.unlock ? s.name + " (" + s.items.length + " items)" : s.name + "\n§8Unlock at " + s.unlock + " blocks");
  f.button("Back");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === SHOPS.length) return showMain(p);
    const s = SHOPS[r.selection]; if (!s) return;
    if (count < s.unlock) { tell(p, s.name + " unlocks after " + s.unlock + " personal blocks mined."); return showShop(p); }
    showProducts(p, s);
  }).catch(() => tell(p, "Supply Shop failed to open."));
}

function showProducts(p, s) {
  const f = new ActionFormData().title(s.name).body("Balance: " + balance(p) + " OneCoins\nChoose an item.");
  for (const item of s.items) f.button(item.name + "\n§e" + item.price + " OneCoins");
  f.button("Back to Tiers");
  showForm(f, p).then(r => {
    if (r.canceled) return;
    if (r.selection === s.items.length) return showShop(p);
    const item = s.items[r.selection];
    if (item) purchase(p, item, s);
  }).catch(() => tell(p, "Item list failed to open."));
}

// Charges first, then delivers; refunds anything not delivered.
function purchase(p, item, s) {
  initialize(p);
  if (mined(p) < s.unlock) return tell(p, "That tier is locked.");
  const funds = balance(p);
  if (funds < item.price) return tell(p, "Not enough OneCoins. Need " + item.price + ", have " + funds + ".");
  const inv = invOf(p);
  if (!inv || inv.emptySlotsCount < 1) return tell(p, "Make at least one free inventory slot first.");
  if (!setScore(COINS, p, funds - item.price)) return tell(p, "Could not update your balance. No items were given.");
  let delivered = 0;
  try {
    const left = inv.addItem(new ItemStack(item.id, item.amount));
    delivered = item.amount - (left?.amount ?? 0);
  } catch { delivered = 0; }
  const charged = delivered > 0 ? Math.ceil(item.price * delivered / item.amount) : 0;
  if (charged < item.price) setScore(COINS, p, balance(p) + (item.price - charged));
  if (delivered <= 0) return tell(p, "Purchase failed or inventory full. No coins were taken.");
  tell(p, delivered < item.amount
    ? "Limited space: delivered " + delivered + " item(s), charged " + charged + " OneCoins."
    : "Purchased " + item.name + " for " + charged + " OneCoins. Balance: " + balance(p) + ".");
}

function sellDirt(p) {
  initialize(p);
  const inv = invOf(p); if (!inv) return tell(p, "Inventory unavailable.");
  let sold = 0; const slots = [];
  for (let i = 0; i < inv.size; i++) {
    const st = inv.getItem(i);
    if (st?.typeId === "minecraft:dirt") { sold += st.amount; slots.push(i); }
  }
  if (!sold) return tell(p, "No Dirt to sell.");
  if (!setScore(COINS, p, balance(p) + sold)) return tell(p, "Balance is not ready; no Dirt was removed.");
  for (const i of slots) inv.setItem(i, undefined);
  tell(p, "Sold " + sold + " Dirt for " + sold + " OneCoins. Balance: " + balance(p) + ".");
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

function spawnBonus() {
  try {
    const dim = world.getDimension("overworld");
    const b = dim.getBlock(BONUS_POS);
    if (!b || b.typeId !== "minecraft:air") return false;
    b.setType("minecraft:emerald_block");
    setGlobal("#bonus", 1);
    world.sendMessage("§6[Dirtbound] §fA Bonus Core appeared beside the OneBlock! Break the Emerald Block for a coin reward.");
    return true;
  } catch { return false; }
}

// Places the correct stage block if the origin is empty (or holds an outdated stage block).
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

function onCoreBreak(p) {
  initialize(p);
  const personal = mined(p) + 1;
  const total = globalScore("#breaks") + 1;
  setScore(MINED, p, personal);
  setGlobal("#breaks", total);
  updateCoreStage();

  const pres = prestige(p);
  let gain = Math.max(1, Math.round(STAGES[stageFor(total)].reward * (1 + 0.1 * pres)));

  const stageReward = STAGE_REWARDS.find(r => r.blocks === personal);
  if (stageReward && pres === 0) { gain += stageReward.coins; tell(p, personal + " personal breaks! Stage bonus: +" + stageReward.coins + " OneCoins."); }
  if (personal % 250 === 0) { gain += 20; tell(p, "Milestone reached: " + personal + " personal breaks. +20 bonus OneCoins."); }
  if (total % 500 === 0) { gain += 50; tell(p, "Core Surge milestone! +50 OneCoins."); spawnMobWave(p); }
  setScore(COINS, p, balance(p) + gain);

  if (Math.random() < 1 / 40) spawnBonus();
  for (const s of SHOPS) if (s.unlock > 0 && s.unlock === personal) tell(p, "New shop unlocked: " + s.name + "!");
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

  // Bonus block: must actually have been the emerald block
  if (loc.x === BONUS_POS.x && loc.y === BONUS_POS.y && loc.z === BONUS_POS.z) {
    if (globalScore("#bonus") === 1 && e.brokenBlockPermutation.type.id === "minecraft:emerald_block") {
      setGlobal("#bonus", 0);
      setScore(COINS, p, balance(p) + 30);
      tell(p, "Bonus Core collected! +30 OneCoins.");
      if (Math.random() < 0.2) spawnMobWave(p);
    }
    return;
  }

  if (loc.x !== ORIGIN.x || loc.y !== ORIGIN.y || loc.z !== ORIGIN.z) return;
  system.run(() => { onCoreBreak(p); placeCore(b.dimension); });
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

// Watchdog: restores the core if explosions/pistons/etc. destroy it, and clears a stuck bonus flag
system.runInterval(() => {
  if (!coreReady) return;
  const dim = world.getDimension("overworld");
  placeCore(dim);
  if (globalScore("#bonus") === 1) {
    try {
      const b = dim.getBlock(BONUS_POS);
      if (b && b.typeId !== "minecraft:emerald_block") setGlobal("#bonus", 0);
    } catch {}
  }
}, 20);

system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    try { initialize(p); recoverTrader(p); } catch {}
  }
}, 40);

system.run(() => {
  objective(COINS); objective(MINED); objective(CORE); objective(PRESTIGE);
  buildShops();
  if (globalScore("#stage") === 0) setGlobal("#stage", 0);
  if (globalScore("#breaks") === 0) setGlobal("#breaks", 0);
  if (globalScore("#bonus") === 0) setGlobal("#bonus", 0);
});
