import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const ONEBLOCK = { x: 0, y: 64, z: 0 };
const BEDROCK = { x: 0, y: 63, z: 0 };
const SPAWN = { x: 0.5, y: 65, z: 0.5 };
const COINS = "obcoins";
const MINED = "obmined";

const SHOPS = [
  { name: "Phase 1 — Castaway", unlock: 0, items: [
    { name: "Oak Log ×1", id: "minecraft:oak_log", amount: 1, price: 10 },
    { name: "Oak Planks ×8", id: "minecraft:oak_planks", amount: 8, price: 8 },
    { name: "Bread ×3", id: "minecraft:bread", amount: 3, price: 15 },
    { name: "Wheat Seeds ×4", id: "minecraft:wheat_seeds", amount: 4, price: 12 },
    { name: "Cobblestone ×8", id: "minecraft:cobblestone", amount: 8, price: 25 },
    { name: "Wooden Pickaxe ×1", id: "minecraft:wooden_pickaxe", amount: 1, price: 20 },
    { name: "Torch ×4", id: "minecraft:torch", amount: 4, price: 12 }
  ]},
  { name: "Phase 2 — Settler", unlock: 20, items: [
    { name: "Stone ×16", id: "minecraft:stone", amount: 16, price: 30 },
    { name: "Oak Sapling ×2", id: "minecraft:oak_sapling", amount: 2, price: 35 },
    { name: "Furnace ×1", id: "minecraft:furnace", amount: 1, price: 40 },
    { name: "Chest ×2", id: "minecraft:chest", amount: 2, price: 30 },
    { name: "Water Bucket ×1", id: "minecraft:water_bucket", amount: 1, price: 100 },
    { name: "Carrot ×4", id: "minecraft:carrot", amount: 4, price: 35 },
    { name: "Iron Ingot ×2", id: "minecraft:iron_ingot", amount: 2, price: 100 }
  ]},
  { name: "Phase 3 — Adventurer", unlock: 50, items: [
    { name: "Iron Pickaxe ×1", id: "minecraft:iron_pickaxe", amount: 1, price: 220 },
    { name: "Shield ×1", id: "minecraft:shield", amount: 1, price: 300 },
    { name: "Bow ×1", id: "minecraft:bow", amount: 1, price: 250 },
    { name: "Arrow ×16", id: "minecraft:arrow", amount: 16, price: 100 },
    { name: "Glass ×16", id: "minecraft:glass", amount: 16, price: 90 },
    { name: "Lantern ×4", id: "minecraft:lantern", amount: 4, price: 100 },
    { name: "Diamond ×1", id: "minecraft:diamond", amount: 1, price: 450 }
  ]}
];

function objective(name) {
  const current = world.scoreboard.getObjective(name);
  return current ?? world.scoreboard.addObjective(name, name);
}
function getScore(name, player) {
  try { const id = player.scoreboardIdentity; return id ? (objective(name).getScore(id) ?? 0) : 0; }
  catch { return 0; }
}
function setScore(name, player, value) {
  const id = player.scoreboardIdentity;
  if (id) objective(name).setScore(id, Math.max(0, Math.floor(value)));
}
const balance = player => getScore(COINS, player);
const mined = player => getScore(MINED, player);
function tell(player, message) {
  try { player.sendMessage("§6[Dirtbound] §f" + message); } catch {}
}
function setupWorld() {
  const dim = world.getDimension("overworld");
  try {
    dim.getBlock(BEDROCK)?.setType("minecraft:bedrock");
    dim.getBlock(ONEBLOCK)?.setType("minecraft:dirt");
    world.setDefaultSpawnLocation({ x: 0, y: 65, z: 0 });
  } catch {}
}
function ensurePlayer(player) {
  const coins = objective(COINS);
  const count = objective(MINED);
  try {
    if (player.scoreboardIdentity && coins.getScore(player.scoreboardIdentity) === undefined) {
      setScore(COINS, player, 50);
      tell(player, "Welcome! You received 50 OneCoins. Break the dirt block, then use !sell and !shop.");
    }
    if (player.scoreboardIdentity && count.getScore(player.scoreboardIdentity) === undefined) setScore(MINED, player, 0);
  } catch {}
}
function showShop(player) {
  const blocks = mined(player);
  const available = SHOPS.filter(shop => blocks >= shop.unlock);
  const form = new ActionFormData().title("ONEBLOCK EXCHANGE")
    .body("Balance: §e" + balance(player) + " OneCoins§r\nBlocks mined: " + blocks + "\n\nPhase 2 unlocks at 20 blocks; Phase 3 at 50.");
  for (const shop of available) form.button(shop.name);
  form.button("Sell All Dirt");
  form.button("Balance & Help");
  form.show(player).then(response => {
    if (response.canceled) return;
    if (response.selection < available.length) return showProducts(player, available[response.selection]);
    if (response.selection === available.length) return sellDirt(player);
    tell(player, "Balance: " + balance(player) + " OneCoins. Commands: !shop, !sell, !balance, !help.");
  }).catch(() => tell(player, "The shop could not open. Please try !shop again."));
}
function showProducts(player, shop) {
  const form = new ActionFormData().title(shop.name)
    .body("Your balance: " + balance(player) + " OneCoins\nSelect an item to purchase.");
  for (const item of shop.items) form.button(item.name + "\n§e" + item.price + " OneCoins");
  form.button("Back to Shop");
  form.show(player).then(response => {
    if (response.canceled) return;
    if (response.selection === shop.items.length) return showShop(player);
    const item = shop.items[response.selection];
    if (item) purchase(player, item, shop);
  }).catch(() => tell(player, "The item list could not open. Please try again."));
}
function purchase(player, item, shop) {
  if (mined(player) < shop.unlock) return tell(player, "That phase is still locked.");
  const current = balance(player);
  if (current < item.price) return tell(player, "Not enough OneCoins. You need " + item.price + " and have " + current + ".");
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory || inventory.emptySlotsCount < 1) return tell(player, "Make at least one free inventory slot before purchasing.");
  try {
    const leftover = inventory.addItem(new ItemStack(item.id, item.amount));
    if (leftover) return tell(player, "Your inventory cannot fit that purchase. No coins were taken.");
    setScore(COINS, player, current - item.price);
    tell(player, "Purchased " + item.name + " for " + item.price + " OneCoins. Balance: " + balance(player) + ".");
  } catch {
    tell(player, "That item could not be delivered. No coins were taken.");
  }
}
function sellDirt(player) {
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!inventory) return tell(player, "Your inventory could not be accessed.");
  let sold = 0;
  for (let slot = 0; slot < inventory.size; slot++) {
    const stack = inventory.getItem(slot);
    if (stack?.typeId !== "minecraft:dirt") continue;
    sold += stack.amount;
    inventory.setItem(slot, undefined);
  }
  if (!sold) return tell(player, "You have no dirt to sell. Break the OneBlock first.");
  setScore(COINS, player, balance(player) + sold);
  tell(player, "Sold " + sold + " dirt for " + sold + " OneCoins. Balance: " + balance(player) + ".");
}
function handleCommand(player, message) {
  const command = message.trim().toLowerCase();
  if (command === "!shop" || command === "!store") showShop(player);
  else if (command === "!sell") sellDirt(player);
  else if (command === "!balance" || command === "!money") tell(player, "Balance: " + balance(player) + " OneCoins.");
  else if (command === "!help") tell(player, "Break the dirt at (0, 64, 0), sell with !sell, and shop with !shop. Phase 2 unlocks at 20 blocks; Phase 3 at 50.");
}
world.afterEvents.playerBreakBlock.subscribe(event => {
  const block = event.block;
  if (block.dimension.id !== "minecraft:overworld" || block.x !== ONEBLOCK.x || block.y !== ONEBLOCK.y || block.z !== ONEBLOCK.z) return;
  const player = event.player;
  if (!player) return;
  system.run(() => {
    try {
      setupWorld();
      const count = mined(player) + 1;
      setScore(MINED, player, count);
      for (const shop of SHOPS) if (shop.unlock > 0 && shop.unlock === count) tell(player, "Phase unlocked: " + shop.name + "!");
      player.onScreenDisplay.setActionBar("§6Dirtbound Kingdom §8| §fBlocks: " + count + " §8| §eOneCoins: " + balance(player));
    } catch {}
  });
});
world.afterEvents.playerSpawn.subscribe(event => {
  system.runTimeout(() => {
    ensurePlayer(event.player);
    setupWorld();
    if (event.initialSpawn) {
      try { event.player.teleport(SPAWN, { dimension: world.getDimension("overworld"), checkForBlocks: false }); } catch {}
    }
  }, 5);
});
try {
  world.beforeEvents.chatSend.subscribe(event => {
    const message = event.message.trim().toLowerCase();
    if (!["!shop", "!store", "!sell", "!balance", "!money", "!help"].includes(message)) return;
    event.cancel = true;
    system.run(() => handleCommand(event.sender, message));
  });
} catch {
  world.afterEvents.chatSend.subscribe(event => handleCommand(event.sender, event.message));
}
system.runInterval(() => {
  setupWorld();
  for (const player of world.getAllPlayers()) {
    try { player.onScreenDisplay.setActionBar("§6Dirtbound Kingdom §8| §fBlocks: " + mined(player) + " §8| §eOneCoins: " + balance(player)); } catch {}
  }
}, 100);
system.run(() => { objective(COINS); objective(MINED); setupWorld(); });
