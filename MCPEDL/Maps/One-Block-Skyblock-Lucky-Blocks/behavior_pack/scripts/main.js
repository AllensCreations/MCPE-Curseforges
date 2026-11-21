import { world, system, ItemStack } from "@minecraft/server";

const LUCKY = "allenscreations:lucky_block";
const TYPES = {
  "allenscreations:lucky_block": { theme: null, label: "§eAll-Round", weight: 22 },
  "allenscreations:lucky_farming": { theme: "farming", label: "§aFarming", weight: 16 },
  "allenscreations:lucky_building": { theme: "building", label: "§6Building", weight: 16 },
  "allenscreations:lucky_combat": { theme: "combat", label: "§cCombat", weight: 16 },
  "allenscreations:lucky_mining": { theme: "mining", label: "§bMining", weight: 16 },
  "allenscreations:lucky_mystic": { theme: "mystic", label: "§dMystic", weight: 12 },
  "allenscreations:lucky_treasure": { theme: "treasure", label: "§3Treasure", weight: 8 },
};
const THEME_BOOST = 8;
const THEME_NAMES = {
  farming: new Set([
    "Sapling Pack",
    "Seed Pouch",
    "Flower Bouquet",
    "Plains Wanderers",
    "Sapling Mix",
    "Apple Pickings",
    "Forest Friends",
    "Harvest Basket",
    "Farmer's Kit",
    "Cooked Feast",
    "Sugar Cane Cuttings",
    "Hay Bales",
    "Villager Visit",
    "Glow Berries",
    "Golden Carrots",
    "Celebration Cake",
    "Leaf Bundle",
  ]),
  building: new Set([
    "Dirt Delivery",
    "Oak Logs",
    "Birch Logs",
    "Plank Bundle",
    "Stick Bundle",
    "Grass Blocks",
    "Sand Pile",
    "Log Pile",
    "Leaf Bundle",
    "Stone Delivery",
    "Furnace and Fuel",
    "Sand and Gravel",
    "Torch Bundle",
    "Cave Torches",
    "Crafting Corner",
    "Iron Blocks",
    "Obsidian Stack",
    "Bookshelf Bundle",
    "Anvil Gift",
    "Nether Bricks",
    "Soul Sand and Netherrack",
    "Bed Set",
    "Obsidian Cache",
    "End Rods",
    "Prismarine Haul",
    "Sea Lanterns",
    "Purpur Stack",
    "Sculk Haul",
    "Ender Chest",
  ]),
  combat: new Set([
    "Wooden Sword",
    "Archer Starter",
    "Stone Sword",
    "Iron Blade",
    "Arrow Quiver",
    "Spare Shield",
    "Wolf Pup",
    "Sword and Shield",
    "Bow and Arrows",
    "Iron Armor Pair",
    "Diamond Armor Pair",
    "Netherite Armor Set",
    "Totem of Undying",
    "Twin Totems",
    "Golden Apples",
    "Golden Apple Stack",
    "Enchanted Golden Apples",
    "Strength Surge",
    "Fire Shield",
    "Regeneration Surge",
    "Trident",
    "Divine Aura",
  ]),
  mining: new Set([
    "Wooden Pickaxe",
    "Coal Starter",
    "Stone Pickaxe",
    "Wooden Tool Set",
    "Stone Tool Set",
    "Coal Stack",
    "Raw Iron Haul",
    "Copper Haul",
    "Coal Seam",
    "Empty Bucket",
    "Iron Ingots",
    "Iron Tool Kit",
    "Water Bucket",
    "Lava Bucket",
    "Gold Haul",
    "Redstone Dust",
    "Lapis Lazuli",
    "Amethyst Shards",
    "Night Sight",
    "Diamond Pair",
    "Diamond Pickaxe",
    "Haste Rush",
    "Quartz Haul",
    "Ancient Debris",
    "Ancient Debris Cache",
    "Netherite Scrap",
    "Diamond Haul",
    "Netherite Pickaxe",
    "Piglin Bribe",
    "Flint Stack",
    "Furnace and Fuel",
    "Torch Bundle",
    "Cave Torches",
  ]),
  mystic: new Set([
    "Experience Spark",
    "Book Stack",
    "Lapis Pinch",
    "XP Surge",
    "Bookshelf Bundle",
    "Enchanting Table",
    "Lapis Stack",
    "Experience Flood",
    "Nether Kit",
    "Glowstone Dust",
    "Nether Wart",
    "Brewing Kit",
    "Ender Pearls",
    "Eyes of Ender",
    "Eye Stack",
    "Blaze Rods",
    "Slow Falling",
    "Echo Shards",
    "Disc Fragment",
    "Quiet Steps",
    "Sea Blessing",
    "Experience Ascension",
    "Divine Aura",
    "Four-Leaf Fortune",
    "Golden Horseshoe",
    "Chorus Fruit",
    "Shulker Shells",
    "Amethyst Shards",
    "Anvil Gift",
  ]),
  treasure: new Set([
    "Emerald Find",
    "Lucky Coin",
    "Gold Haul",
    "Piglin Bribe",
    "Diamond Pair",
    "Diamond Haul",
    "Diamond Blocks",
    "Netherite Ingot",
    "Netherite Scrap",
    "Netherite Armor Set",
    "Netherite Pickaxe",
    "Ancient Debris Cache",
    "Elytra",
    "Beacon",
    "Nether Star",
    "Nether Star Pair",
    "Dragon Egg",
    "Dragon Head",
    "Ocean Treasures",
    "Trident",
    "Ender Chest",
    "Shulker Shells",
    "Echo Shards",
    "Enchanted Golden Apples",
    "Totem of Undying",
    "Twin Totems",
    "Four-Leaf Fortune",
    "Golden Horseshoe",
    "Villager Visit",
    "Celebration Cake",
  ]),
};

function nextBlockId() {
  const ids = Object.keys(TYPES);
  let roll = Math.random() * ids.reduce((sum, id) => sum + TYPES[id].weight, 0);
  for (const id of ids) {
    roll -= TYPES[id].weight;
    if (roll < 0) return id;
  }
  return LUCKY;
}
const LEDGER = "allenscreations:trader_ledger";
const TIP_KEY = "lucky_tip_shown";
const CORE = { x: 0, y: 64, z: 0 };
const BREAKS_KEY = "lucky_breaks";
const BONUS_KEY = "lucky_bonus";
const JINX_KEY = "lucky_jinx";
const STAGE_BREAKS = 30;
const MAX_BASE = 15;
const GOOD_CHANCE = 0.7;
const WINDOW = [50, 25, 12.5, 6.25, 6.25];

const GOOD_TIERS = [
  ["Common", "§7"], ["Uncommon", "§f"], ["Good", "§a"], ["Nice", "§2"], ["Great", "§3"],
  ["Rare", "§b"], ["Superb", "§9"], ["Excellent", "§1"], ["Fantastic", "§5"], ["Epic", "§d"],
  ["Heroic", "§e"], ["Majestic", "§6"], ["Glorious", "§e"], ["Radiant", "§6"], ["Exalted", "§d"],
  ["Legendary", "§5"], ["Ancient", "§b"], ["Celestial", "§3"], ["Divine", "§l§6"], ["Mythical", "§l§d"],
];

const BAD_TIERS = [
  ["Petty", "§7"], ["Unlucky", "§f"], ["Bad", "§e"], ["Nasty", "§6"], ["Rough", "§c"],
  ["Harsh", "§4"], ["Grim", "§c"], ["Dire", "§4"], ["Wicked", "§5"], ["Vile", "§d"],
  ["Savage", "§c"], ["Brutal", "§4"], ["Ruthless", "§5"], ["Sinister", "§c"], ["Dreadful", "§4"],
  ["Cursed", "§l§c"], ["Hexed", "§l§4"], ["Doomed", "§l§5"], ["Calamitous", "§l§c"], ["Mythical", "§l§4"],
];

const rand = (n) => Math.floor(Math.random() * n);
const num = (key) => {
  const v = world.getDynamicProperty(key);
  return typeof v === "number" ? v : 0;
};
const spot = (ctx, lift) => ({ x: ctx.top.x + rand(3) - 1, y: ctx.loc.y + lift, z: ctx.top.z + rand(3) - 1 });

const items = (list) => (ctx) => {
  for (const [id, n] of list) ctx.dimension.spawnItem(new ItemStack(id, n), ctx.top);
};
const kit = (...ids) => items(ids.map((id) => [id, 1]));
const mobs = (id, n, lift = 1) => (ctx) => {
  for (let i = 0; i < n; i++) ctx.dimension.spawnEntity(id, spot(ctx, lift));
};
const effect = (id, seconds, amplifier = 0) => (ctx) => {
  ctx.player.addEffect(id, seconds * 20, { amplifier });
};
const levels = (n) => (ctx) => {
  ctx.player.addLevels(n);
};
const tax = (n) => (ctx) => {
  ctx.player.addLevels(-Math.min(n, ctx.player.level));
};
const hurt = (n) => (ctx) => {
  ctx.player.applyDamage(n);
};
const bonus = (key, n) => () => {
  world.setDynamicProperty(key, num(key) + n);
};
const both = (...runs) => (ctx) => {
  for (const run of runs) run(ctx);
};
const later = (ticks, fn) => {
  system.runTimeout(() => {
    try {
      fn();
    } catch (e) {
      return;
    }
  }, ticks);
};
const strikes = (n) => (ctx) => {
  for (let i = 0; i < n; i++) later(i * 15 + 1, () => ctx.dimension.spawnEntity("minecraft:lightning_bolt", ctx.top));
};
const booms = (n, radius) => (ctx) => {
  for (let i = 0; i < n; i++) later(i * 20 + 1, () => ctx.dimension.createExplosion(ctx.top, radius, { breaksBlocks: false, causesFire: false }));
};
const fire = (seconds) => (ctx) => {
  ctx.player.setOnFire(seconds);
};

const thunderMob = (id) => (ctx) => {
  const where = spot(ctx, 1);
  ctx.dimension.spawnEntity(id, where);
  later(5, () => ctx.dimension.spawnEntity("minecraft:lightning_bolt", where));
};

const fallingAnvil = (ctx) => {
  const warn = (text) => {
    ctx.player.onScreenDisplay.setActionBar(text);
    ctx.player.playSound("note.bass");
  };
  later(20, () => warn("§c§lLook up! Something heavy is coming..."));
  later(40, () => warn("§4§lMOVE!"));
  later(60, () => {
    const at = ctx.player.location;
    const x = Math.floor(at.x);
    const z = Math.floor(at.z);
    const block = ctx.dimension.getBlock({ x, y: Math.floor(at.y) + 5, z });
    if (!block) return;
    block.setType("minecraft:anvil");
    later(30, () => {
      const now = ctx.player.location;
      for (let dy = 0; dy <= 1; dy++) {
        const cell = ctx.dimension.getBlock({ x: Math.floor(now.x), y: Math.floor(now.y) + dy, z: Math.floor(now.z) });
        if (cell && cell.typeId === "minecraft:anvil") cell.setType("minecraft:air");
      }
    });
  });
};

const butterfingers = (ctx) => {
  const inv = ctx.player.getComponent("minecraft:inventory")?.container;
  const slot = ctx.player.selectedSlotIndex;
  const item = inv?.getItem(slot);
  if (!item) throw new Error("empty hand");
  inv.setItem(slot, undefined);
  ctx.dimension.spawnItem(item, ctx.top);
};

const lavaSplash = (ctx) => {
  const block = ctx.dimension.getBlock({ x: ctx.loc.x, y: ctx.loc.y + 3, z: ctx.loc.z });
  if (!block) throw new Error("block not loaded");
  block.setType("minecraft:lava");
  later(80, () => {
    if (block.typeId === "minecraft:lava") block.setType("minecraft:air");
  });
};

const STAGES = [
  {
    good: [
      ["Sapling Pack", items([["minecraft:oak_sapling", 3], ["minecraft:birch_sapling", 2], ["minecraft:bone_meal", 4]]), 3],
      ["Dirt Delivery", items([["minecraft:dirt", 24]]), 4],
      ["Oak Logs", items([["minecraft:oak_log", 10]]), 3],
      ["Birch Logs", items([["minecraft:birch_log", 8]]), 2],
      ["Plank Bundle", items([["minecraft:oak_planks", 16], ["minecraft:stick", 8]]), 2],
      ["Stick Bundle", items([["minecraft:stick", 16]]), 2],
      ["Seed Pouch", items([["minecraft:wheat_seeds", 8], ["minecraft:beetroot_seeds", 4], ["minecraft:pumpkin_seeds", 3], ["minecraft:melon_seeds", 3]]), 2],
      ["Grass Blocks", items([["minecraft:grass_block", 12]]), 2],
      ["Sand Pile", items([["minecraft:sand", 12]])],
      ["Flower Bouquet", items([["minecraft:dandelion", 3], ["minecraft:poppy", 3]])],
      ["Plains Wanderers", both(mobs("minecraft:cow", 1), mobs("minecraft:sheep", 1))],
      ["Wooden Sword", kit("minecraft:wooden_sword"), 2],
      ["Wooden Pickaxe", kit("minecraft:wooden_pickaxe"), 2],
      ["Experience Spark", levels(2)],
    ],
    bad: [
      ["Hunger Pangs", effect("hunger", 10)],
      ["Heavy Legs", effect("slowness", 8)],
      ["Butterfingers", butterfingers],
      ["XP Tax", tax(2)],
      ["Stubbed Toe", hurt(2)],
      ["Falling Anvil", fallingAnvil],
    ],
  },
  {
    good: [
      ["Log Pile", items([["minecraft:oak_log", 8], ["minecraft:birch_log", 8]]), 3],
      ["Sapling Mix", items([["minecraft:spruce_sapling", 3], ["minecraft:dark_oak_sapling", 2], ["minecraft:acacia_sapling", 2]]), 3],
      ["Plank Bundle", items([["minecraft:oak_planks", 20], ["minecraft:stick", 12]]), 2],
      ["Apple Pickings", items([["minecraft:apple", 4]]), 2],
      ["Wooden Tool Set", kit("minecraft:wooden_pickaxe", "minecraft:wooden_axe", "minecraft:wooden_shovel", "minecraft:wooden_sword"), 2],
      ["Leaf Bundle", items([["minecraft:oak_leaves", 16]])],
      ["Forest Friends", both(mobs("minecraft:pig", 1), mobs("minecraft:chicken", 2))],
      ["Wolf Pup", both(mobs("minecraft:wolf", 1), items([["minecraft:bone", 4]]))],
      ["Archer Starter", items([["minecraft:bow", 1], ["minecraft:arrow", 12]])],
      ["Coal Starter", items([["minecraft:coal", 6]])],
      ["Book Stack", items([["minecraft:book", 4]])],
      ["Emerald Find", items([["minecraft:emerald", 3]])],
    ],
    bad: [
      ["Zombie Wanderer", mobs("minecraft:zombie", 1)],
      ["Spider Scare", mobs("minecraft:spider", 1)],
      ["Weak Wrists", effect("weakness", 15)],
      ["Thunder Pig", thunderMob("minecraft:pig")],
      ["Dizzy Spell", effect("nausea", 6)],
    ],
  },
  {
    good: [
      ["Stone Delivery", items([["minecraft:cobblestone", 32]]), 3],
      ["Stone Tool Set", kit("minecraft:stone_pickaxe", "minecraft:stone_axe", "minecraft:stone_shovel", "minecraft:stone_sword"), 2],
      ["Coal Stack", items([["minecraft:coal", 10]]), 2],
      ["Furnace and Fuel", items([["minecraft:furnace", 1], ["minecraft:charcoal", 8]]), 2],
      ["Sand and Gravel", items([["minecraft:sand", 16], ["minecraft:gravel", 16]]), 2],
      ["Torch Bundle", items([["minecraft:torch", 12], ["minecraft:coal", 4]])],
      ["Stone Sword", kit("minecraft:stone_sword")],
      ["Stone Pickaxe", kit("minecraft:stone_pickaxe")],
      ["Lapis Pinch", items([["minecraft:lapis_lazuli", 6]])],
      ["Lucky Coin", items([["minecraft:gold_ingot", 2]])],
    ],
    bad: [
      ["Zombie Pair", mobs("minecraft:zombie", 2)],
      ["Skeleton Scout", mobs("minecraft:skeleton", 1)],
      ["Silverfish Pests", mobs("minecraft:silverfish", 3)],
      ["Tired Arms", effect("mining_fatigue", 20)],
    ],
  },
  {
    good: [
      ["Harvest Basket", items([["minecraft:wheat", 8], ["minecraft:carrot", 6], ["minecraft:potato", 6]])],
      ["Farmer's Kit", items([["minecraft:stone_hoe", 1], ["minecraft:bone_meal", 8]])],
      ["Cooked Feast", items([["minecraft:cooked_beef", 6], ["minecraft:cooked_porkchop", 4], ["minecraft:bread", 4]])],
      ["Sugar Cane Cuttings", items([["minecraft:sugar_cane", 4]])],
      ["Hay Bales", items([["minecraft:hay_block", 3]])],
      ["Villager Visit", both(mobs("minecraft:villager", 1), items([["minecraft:emerald", 2]]))],
    ],
    bad: [
      ["Witch Visit", mobs("minecraft:witch", 1)],
      ["Pillager Scout", mobs("minecraft:pillager", 1)],
      ["Poison Sting", effect("poison", 8)],
      ["Sudden Darkness", effect("darkness", 8)],
      ["Thunder Villager", thunderMob("minecraft:villager")],
    ],
  },
  {
    good: [
      ["Raw Iron Haul", items([["minecraft:raw_iron", 6]])],
      ["Copper Haul", items([["minecraft:raw_copper", 8], ["minecraft:copper_ingot", 6]])],
      ["Coal Seam", items([["minecraft:coal", 16]])],
      ["Cave Torches", items([["minecraft:torch", 24]])],
      ["Empty Bucket", items([["minecraft:bucket", 1]])],
      ["Four-Leaf Fortune", bonus(BONUS_KEY, 5)],
    ],
    bad: [
      ["Cave Spider Nest", mobs("minecraft:cave_spider", 3)],
      ["Skeleton Pair", mobs("minecraft:skeleton", 2)],
      ["Slime Splat", mobs("minecraft:slime", 2)],
      ["Blind Spot", effect("blindness", 6)],
    ],
  },
  {
    good: [
      ["Iron Ingots", items([["minecraft:iron_ingot", 10]])],
      ["Iron Tool Kit", kit("minecraft:iron_pickaxe", "minecraft:iron_axe", "minecraft:iron_shovel")],
      ["Iron Armor Pair", kit("minecraft:iron_helmet", "minecraft:iron_chestplate")],
      ["Sword and Shield", kit("minecraft:iron_sword", "minecraft:shield")],
      ["Water Bucket", items([["minecraft:water_bucket", 1]])],
      ["Bow and Arrows", items([["minecraft:bow", 1], ["minecraft:arrow", 24]])],
      ["Lava Bucket", items([["minecraft:lava_bucket", 1]])],
      ["Crafting Corner", items([["minecraft:crafting_table", 1], ["minecraft:furnace", 1], ["minecraft:chest", 2]])],
    ],
    bad: [
      ["Zombie Pack", mobs("minecraft:zombie", 3)],
      ["Husk Pair", mobs("minecraft:husk", 2)],
      ["Stray Pair", mobs("minecraft:stray", 2)],
      ["Fire Starter", fire(4)],
    ],
  },
  {
    good: [
      ["Gold Haul", items([["minecraft:gold_ingot", 6]])],
      ["Redstone Dust", items([["minecraft:redstone", 20]])],
      ["Lapis Lazuli", items([["minecraft:lapis_lazuli", 16]])],
      ["Amethyst Shards", items([["minecraft:amethyst_shard", 8]])],
      ["Iron Blade", kit("minecraft:iron_sword")],
      ["Glow Berries", items([["minecraft:glow_berries", 8]])],
      ["Night Sight", effect("night_vision", 120)],
    ],
    bad: [
      ["Lava Splash", lavaSplash],
      ["Drowned Pair", mobs("minecraft:drowned", 2)],
      ["Zombie Mob", mobs("minecraft:zombie", 4)],
      ["Deep Hunger", effect("hunger", 30, 2)],
    ],
  },
  {
    good: [
      ["Diamond Pair", items([["minecraft:diamond", 2]])],
      ["Diamond Pickaxe", kit("minecraft:diamond_pickaxe")],
      ["Obsidian Stack", items([["minecraft:obsidian", 6]])],
      ["Iron Blocks", items([["minecraft:iron_block", 2]])],
      ["Arrow Quiver", items([["minecraft:arrow", 32]])],
      ["Haste Rush", effect("haste", 60, 1)],
      ["XP Surge", levels(6)],
    ],
    bad: [
      ["Pillager Patrol", mobs("minecraft:pillager", 3)],
      ["Vindicator Visit", mobs("minecraft:vindicator", 1)],
      ["Weighted Down", effect("slowness", 20, 2)],
      ["Cold Sweat", both(effect("weakness", 20, 1), effect("hunger", 15))],
    ],
  },
  {
    good: [
      ["Bookshelf Bundle", items([["minecraft:bookshelf", 4], ["minecraft:book", 6]])],
      ["Enchanting Table", kit("minecraft:enchanting_table")],
      ["Lapis Stack", items([["minecraft:lapis_lazuli", 24]])],
      ["Experience Flood", levels(10)],
      ["Anvil Gift", kit("minecraft:anvil")],
      ["Spare Shield", kit("minecraft:shield")],
    ],
    bad: [
      ["Witch Coven", mobs("minecraft:witch", 2)],
      ["Evoker Visit", mobs("minecraft:evoker", 1)],
      ["Poison Surge", effect("poison", 15, 1)],
      ["Memory Drain", tax(8)],
    ],
  },
  {
    good: [
      ["Nether Kit", items([["minecraft:obsidian", 10], ["minecraft:flint_and_steel", 1]])],
      ["Golden Apples", items([["minecraft:golden_apple", 2]])],
      ["Piglin Bribe", items([["minecraft:gold_ingot", 10]])],
      ["Fire Shield", effect("fire_resistance", 180)],
      ["Flint Stack", items([["minecraft:flint", 8]])],
    ],
    bad: [
      ["Lightning Strike", strikes(1)],
      ["Phantom Pair", mobs("minecraft:phantom", 2, 3)],
      ["Wither Touch", effect("wither", 4)],
      ["Jinx", bonus(JINX_KEY, 5)],
    ],
  },
  {
    good: [
      ["Quartz Haul", items([["minecraft:quartz", 16]])],
      ["Glowstone Dust", items([["minecraft:glowstone_dust", 16]])],
      ["Nether Wart", items([["minecraft:nether_wart", 8]])],
      ["Soul Sand and Netherrack", items([["minecraft:soul_sand", 8], ["minecraft:netherrack", 32]])],
      ["Ancient Debris", items([["minecraft:ancient_debris", 2]])],
    ],
    bad: [
      ["Piglin Brute", mobs("minecraft:piglin_brute", 1)],
      ["Hoglin Charge", mobs("minecraft:hoglin", 1)],
      ["Magma Cube Pair", mobs("minecraft:magma_cube", 2)],
      ["Burning Skin", fire(8)],
    ],
  },
  {
    good: [
      ["Blaze Rods", items([["minecraft:blaze_rod", 6]])],
      ["Ender Pearls", items([["minecraft:ender_pearl", 4]])],
      ["Brewing Kit", items([["minecraft:brewing_stand", 1], ["minecraft:blaze_powder", 4]])],
      ["Nether Bricks", items([["minecraft:netherbrick", 16]])],
      ["Strength Surge", effect("strength", 60, 1)],
    ],
    bad: [
      ["Blaze Ambush", mobs("minecraft:blaze", 2, 2)],
      ["Wither Skeleton Raid", mobs("minecraft:wither_skeleton", 2)],
      ["Loud Boom", booms(1, 1.5)],
      ["Skeleton Horde", mobs("minecraft:skeleton", 4)],
    ],
  },
  {
    good: [
      ["Eyes of Ender", items([["minecraft:ender_eye", 6]])],
      ["Golden Carrots", items([["minecraft:golden_carrot", 8]])],
      ["Slow Falling", effect("slow_falling", 120)],
      ["Bed Set", items([["minecraft:red_bed", 2]])],
      ["Regeneration Surge", effect("regeneration", 30, 1)],
    ],
    bad: [
      ["Zombie Horde", mobs("minecraft:zombie", 6)],
      ["Blaze Trio", mobs("minecraft:blaze", 3, 2)],
      ["Wasting Curse", both(effect("hunger", 20, 1), effect("weakness", 20), effect("slowness", 20))],
      ["Vex Swarm", mobs("minecraft:vex", 3, 2)],
    ],
  },
  {
    good: [
      ["Ender Chest", kit("minecraft:ender_chest")],
      ["Obsidian Cache", items([["minecraft:obsidian", 16]])],
      ["End Rods", items([["minecraft:end_rod", 8]])],
      ["Diamond Haul", items([["minecraft:diamond", 5]])],
      ["Eye Stack", items([["minecraft:ender_eye", 12]])],
    ],
    bad: [
      ["Phantom Swarm", mobs("minecraft:phantom", 4, 3)],
      ["Vindicator Squad", mobs("minecraft:vindicator", 3)],
      ["Wither Curse", effect("wither", 8, 1)],
      ["Ravager Charge", mobs("minecraft:ravager", 1)],
    ],
  },
  {
    good: [
      ["Echo Shards", items([["minecraft:echo_shard", 3]])],
      ["Sculk Haul", items([["minecraft:sculk", 8], ["minecraft:sculk_sensor", 2]])],
      ["Disc Fragment", items([["minecraft:disc_fragment_5", 1]])],
      ["Golden Apple Stack", items([["minecraft:golden_apple", 4]])],
      ["Quiet Steps", both(effect("speed", 60, 1), effect("night_vision", 180))],
    ],
    bad: [
      ["Evoker Duo", mobs("minecraft:evoker", 2)],
      ["Pillager Raid", mobs("minecraft:pillager", 5)],
      ["Storm of Lightning", strikes(3)],
      ["Total Darkness", both(effect("darkness", 15), effect("blindness", 8))],
    ],
  },
  {
    good: [
      ["Ancient Debris Cache", items([["minecraft:ancient_debris", 4]])],
      ["Netherite Scrap", items([["minecraft:netherite_scrap", 4]])],
      ["Diamond Armor Pair", kit("minecraft:diamond_helmet", "minecraft:diamond_chestplate")],
      ["Totem of Undying", kit("minecraft:totem_of_undying")],
      ["Celebration Cake", kit("minecraft:cake")],
    ],
    bad: [
      ["Wither Skeleton Squad", mobs("minecraft:wither_skeleton", 4)],
      ["Ravager Pair", mobs("minecraft:ravager", 2)],
      ["Blaze Barrage", mobs("minecraft:blaze", 4, 2)],
      ["Crushing Weight", both(effect("slowness", 30, 3), effect("mining_fatigue", 30, 2))],
    ],
  },
  {
    good: [
      ["Prismarine Haul", items([["minecraft:prismarine", 16], ["minecraft:prismarine_shard", 8]])],
      ["Sea Lanterns", items([["minecraft:sea_lantern", 6]])],
      ["Ocean Treasures", items([["minecraft:heart_of_the_sea", 1], ["minecraft:nautilus_shell", 2]])],
      ["Trident", kit("minecraft:trident")],
      ["Sea Blessing", both(effect("water_breathing", 300), effect("conduit_power", 120))],
    ],
    bad: [
      ["Lightning Barrage", strikes(4)],
      ["Husk Horde", mobs("minecraft:husk", 8)],
      ["Hoglin Pair", mobs("minecraft:hoglin", 2)],
      ["Vex Cloud", mobs("minecraft:vex", 6, 2)],
    ],
  },
  {
    good: [
      ["Elytra", kit("minecraft:elytra")],
      ["Shulker Shells", items([["minecraft:shulker_shell", 4]])],
      ["Chorus Fruit", items([["minecraft:chorus_fruit", 8]])],
      ["Dragon Head", kit("minecraft:dragon_head")],
      ["Purpur Stack", items([["minecraft:purpur_block", 16]])],
    ],
    bad: [
      ["Wither Skeleton Horde", mobs("minecraft:wither_skeleton", 6)],
      ["Evoker Trio", mobs("minecraft:evoker", 3)],
      ["Wither Rot", both(effect("wither", 12, 1), effect("poison", 10, 1))],
      ["Boom Chain", booms(3, 1.5)],
    ],
  },
  {
    good: [
      ["Netherite Ingot", items([["minecraft:netherite_ingot", 1]])],
      ["Beacon", kit("minecraft:beacon")],
      ["Nether Star", kit("minecraft:nether_star")],
      ["Netherite Pickaxe", kit("minecraft:netherite_pickaxe")],
      ["Diamond Blocks", items([["minecraft:diamond_block", 3]])],
      ["Golden Horseshoe", bonus(BONUS_KEY, 10)],
    ],
    bad: [
      ["Ravager Trio", mobs("minecraft:ravager", 3)],
      ["Piglin Brute Pack", mobs("minecraft:piglin_brute", 4)],
      ["Zombie Siege", mobs("minecraft:zombie", 10)],
      ["Great Boom", booms(2, 2)],
    ],
  },
  {
    good: [
      ["Netherite Armor Set", kit("minecraft:netherite_helmet", "minecraft:netherite_chestplate", "minecraft:netherite_leggings", "minecraft:netherite_boots")],
      ["Enchanted Golden Apples", items([["minecraft:enchanted_golden_apple", 3]])],
      ["Dragon Egg", kit("minecraft:dragon_egg")],
      ["Twin Totems", items([["minecraft:totem_of_undying", 2]])],
      ["Nether Star Pair", items([["minecraft:nether_star", 2]])],
      ["Divine Aura", both(effect("resistance", 120, 2), effect("regeneration", 60, 2), effect("absorption", 120, 4))],
      ["Experience Ascension", levels(30)],
    ],
    bad: [
      ["Warden's Wrath", mobs("minecraft:warden", 1)],
      ["Mythic Storm", both(strikes(5), effect("wither", 6, 1))],
      ["Hellfire", mobs("minecraft:blaze", 6, 2)],
      ["Warband", mobs("minecraft:vindicator", 6)],
    ],
  },
];

const FALLBACK = {
  good: ["Dirt Delivery", items([["minecraft:dirt", 16]])],
  bad: ["Heavy Legs", effect("slowness", 10, 1)],
};

let lastName = "";

function windowTier(base) {
  let roll = Math.random() * 100;
  for (let i = 0; i < WINDOW.length; i++) {
    if (roll < WINDOW[i]) return base + i;
    roll -= WINDOW[i];
  }
  return base;
}

function pickOutcome(kind, breaks, theme) {
  const base = Math.min(MAX_BASE, Math.floor((breaks - 1) / STAGE_BREAKS));
  const index = windowTier(base);
  const pool = STAGES[index][kind].filter((o) => o[0] !== lastName);
  const weight = (o) => (o[2] ?? 1) * (kind === "good" && theme && THEME_NAMES[theme].has(o[0]) ? THEME_BOOST : 1);
  const total = pool.reduce((sum, o) => sum + weight(o), 0);
  let roll = Math.random() * total;
  let outcome = pool[pool.length - 1];
  for (const o of pool) {
    roll -= weight(o);
    if (roll < 0) {
      outcome = o;
      break;
    }
  }
  lastName = outcome[0];
  return { outcome, index };
}

function rollKind(player) {
  let chance = GOOD_CHANCE;
  const plus = num(BONUS_KEY);
  if (plus > 0) {
    chance += 0.2;
    world.setDynamicProperty(BONUS_KEY, plus - 1);
  }
  const minus = num(JINX_KEY);
  if (minus > 0) {
    chance -= 0.2;
    world.setDynamicProperty(JINX_KEY, minus - 1);
  }
  chance = Math.min(0.95, Math.max(0.2, chance));
  return Math.random() < chance ? "good" : "bad";
}

function announce(ctx, kind, label, outcome, breaks) {
  const line = `${ctx.type.label}§r §8|§r ${label}§r: ${outcome[0]} §8#${breaks}`;
  try {
    ctx.player.onScreenDisplay.setActionBar(line);
    ctx.player.playSound(kind === "good" ? "random.levelup" : "note.bass");
    ctx.dimension.spawnParticle(kind === "good" ? "minecraft:villager_happy" : "minecraft:villager_angry", ctx.top);
  } catch (e) {
    return;
  }
}

function trigger(player, dimension, loc, type) {
  const breaks = num(BREAKS_KEY) + 1;
  world.setDynamicProperty(BREAKS_KEY, breaks);
  const ctx = { player, dimension, loc, type, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  const kind = rollKind(player);
  const names = kind === "good" ? GOOD_TIERS : BAD_TIERS;
  let { outcome, index } = pickOutcome(kind, breaks, type.theme);
  let tier = names[index];
  try {
    outcome[1](ctx);
  } catch (e) {
    outcome = FALLBACK[kind];
    tier = names[0];
    try {
      outcome[1](ctx);
    } catch (e2) {
      return;
    }
  }
  announce(ctx, kind, `${tier[1]}${tier[0]}`, outcome, breaks);
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const type = TYPES[event.brokenBlockPermutation.type.id];
  if (!type) return;
  const { player, dimension, block } = event;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  const isCore = dimension.id === "minecraft:overworld" && loc.x === CORE.x && loc.y === CORE.y && loc.z === CORE.z;
  system.run(() => {
    if (isCore) {
      const target = dimension.getBlock(loc);
      if (target && target.isAir) target.setType(nextBlockId());
    }
    trigger(player, dimension, loc, type);
  });
});

system.runInterval(() => {
  if (world.getPlayers({ tags: ["void_cleaned"] }).length === 0) return;
  try {
    const block = world.getDimension("overworld").getBlock(CORE);
    if (block && block.isAir) block.setType(nextBlockId());
  } catch (e) {
    return;
  }
}, 100);

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn || world.getDynamicProperty(TIP_KEY)) return;
  world.setDynamicProperty(TIP_KEY, true);
  system.runTimeout(() => {
    try {
      player.onScreenDisplay.setActionBar("§6Break the lucky block in the middle of the island. Open the chest on the corner first.");
    } catch (e) {
      return;
    }
  }, 100);
});

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack.typeId !== LEDGER) return;
  source.onScreenDisplay.setActionBar(`§6Luck Ledger§r §8|§r Breaks: ${num(BREAKS_KEY)} §8|§r Boosts: ${num(BONUS_KEY)} §8|§r Jinxes: ${num(JINX_KEY)}`);
});

const SETUP_TAG = "void_cleaned";
const BUILT_KEY = "island_built";
const SPAWN_BLOCK = { x: 0, y: 65, z: 0 };
const SPAWN_STAND = { x: 0.5, y: 65, z: 0.5 };
const CHEST_AT = { x: -1, y: 65, z: -1 };
const STARTER = [
  ["minecraft:oak_sapling", 3],
  ["minecraft:bone_meal", 4],
  ["minecraft:bread", 4],
  ["minecraft:bucket", 1],
  [LEDGER, 1],
];
let setupRunning = false;

function blockAt(dimension, x, y, z) {
  const block = dimension.getBlock({ x, y, z });
  if (!block) throw new Error("chunk not loaded");
  return block;
}

function buildIsland() {
  const dimension = world.getDimension("overworld");
  for (let x = -16; x <= 16; x++) {
    for (let z = -16; z <= 16; z++) blockAt(dimension, x, -64, z).setType("minecraft:air");
  }
  blockAt(dimension, 0, 63, 0).setType("minecraft:bedrock");
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) blockAt(dimension, x, 64, z).setType("minecraft:grass_block");
  }
  blockAt(dimension, CORE.x, CORE.y, CORE.z).setType(LUCKY);
  const chest = blockAt(dimension, CHEST_AT.x, CHEST_AT.y, CHEST_AT.z);
  chest.setType("minecraft:chest");
  const container = chest.getComponent("minecraft:inventory")?.container;
  if (!container) throw new Error("chest inventory missing");
  STARTER.forEach(([id, amount], slot) => container.setItem(slot, new ItemStack(id, amount)));
  world.setDefaultSpawnLocation(SPAWN_BLOCK);
  world.setDynamicProperty(BUILT_KEY, true);
}

function runSetup(player, tries) {
  try {
    buildIsland();
    player.teleport(SPAWN_STAND);
    player.addTag(SETUP_TAG);
    setupRunning = false;
  } catch (e) {
    if (tries >= 15) {
      setupRunning = false;
      return;
    }
    system.runTimeout(() => runSetup(player, tries + 1), 20);
  }
}

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn || setupRunning) return;
  try {
    if (player.hasTag(SETUP_TAG)) return;
    if (world.getDynamicProperty(BUILT_KEY)) {
      player.addTag(SETUP_TAG);
      return;
    }
  } catch (e) {
    return;
  }
  setupRunning = true;
  system.runTimeout(() => runSetup(player, 0), 20);
});
