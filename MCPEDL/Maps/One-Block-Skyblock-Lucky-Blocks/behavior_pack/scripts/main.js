import { world, system, ItemStack } from "@minecraft/server";

const LUCKY = "allenscreations:lucky_block";
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
    ],
    bad: [
      ["Hunger Pangs", effect("hunger", 10)],
      ["Heavy Legs", effect("slowness", 8)],
      ["Butterfingers", butterfingers],
      ["XP Tax", tax(2)],
      ["Stubbed Toe", hurt(2)],
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
    ],
    bad: [
      ["Zombie Wanderer", mobs("minecraft:zombie", 1)],
      ["Spider Scare", mobs("minecraft:spider", 1)],
      ["Weak Wrists", effect("weakness", 15)],
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

function pickOutcome(kind, breaks) {
  const base = Math.min(MAX_BASE, Math.floor((breaks - 1) / STAGE_BREAKS));
  const index = windowTier(base);
  const pool = STAGES[index][kind].filter((o) => o[0] !== lastName);
  const total = pool.reduce((sum, o) => sum + (o[2] ?? 1), 0);
  let roll = Math.random() * total;
  let outcome = pool[pool.length - 1];
  for (const o of pool) {
    roll -= o[2] ?? 1;
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
  const line = `${label}§r: ${outcome[0]}`;
  try {
    ctx.player.onScreenDisplay.setActionBar(line);
    ctx.player.sendMessage(`§7Break ${breaks}: §r${line}`);
    ctx.player.playSound(kind === "good" ? "random.levelup" : "note.bass");
    ctx.dimension.spawnParticle(kind === "good" ? "minecraft:villager_happy" : "minecraft:villager_angry", ctx.top);
  } catch (e) {
    return;
  }
}

function trigger(player, dimension, loc) {
  const breaks = num(BREAKS_KEY) + 1;
  world.setDynamicProperty(BREAKS_KEY, breaks);
  const ctx = { player, dimension, loc, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  const kind = rollKind(player);
  const names = kind === "good" ? GOOD_TIERS : BAD_TIERS;
  let { outcome, index } = pickOutcome(kind, breaks);
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
  if (event.brokenBlockPermutation.type.id !== LUCKY) return;
  const { player, dimension, block } = event;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  const isCore = dimension.id === "minecraft:overworld" && loc.x === CORE.x && loc.y === CORE.y && loc.z === CORE.z;
  system.run(() => {
    if (isCore) {
      const target = dimension.getBlock(loc);
      if (target && target.isAir) target.setType(LUCKY);
    }
    trigger(player, dimension, loc);
  });
});

system.runInterval(() => {
  if (world.getPlayers({ tags: ["void_cleaned"] }).length === 0) return;
  try {
    const block = world.getDimension("overworld").getBlock(CORE);
    if (block && block.isAir) block.setType(LUCKY);
  } catch (e) {
    return;
  }
}, 100);

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn || world.getDynamicProperty(TIP_KEY)) return;
  world.setDynamicProperty(TIP_KEY, true);
  system.runTimeout(() => {
    try {
      player.sendMessage("§6Break the lucky block in the middle of the island. Open the chest on the corner first.");
    } catch (e) {
      return;
    }
  }, 100);
});

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack.typeId !== LEDGER) return;
  source.sendMessage(`§6Luck Ledger§r\nBreaks: ${num(BREAKS_KEY)}\nLuck boosts left: ${num(BONUS_KEY)}\nJinxes left: ${num(JINX_KEY)}`);
});
