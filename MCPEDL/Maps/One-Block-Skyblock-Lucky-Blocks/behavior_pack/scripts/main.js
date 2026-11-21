import { world, system, ItemStack } from "@minecraft/server";

const LUCKY = "allenscreations:lucky_block";
const TIP_KEY = "lucky_tip_shown";
const BUILT_KEY = "island_built";
const TUTORIAL_KEY = "tutorial_left";
const SETUP_TAG = "void_cleaned";
const CORE = { x: 0, y: 64, z: 0 };
const SPAWN_BLOCK = { x: 0, y: 65, z: 0 };
const SPAWN_STAND = { x: 0.5, y: 65, z: 0.5 };
const CHEST_AT = { x: -1, y: 65, z: -1 };
const STARTER = [
  ["minecraft:oak_sapling", 3],
  ["minecraft:bone_meal", 4],
  ["minecraft:bread", 4],
  ["minecraft:bucket", 1],
];

const TYPES = {
  "allenscreations:lucky_block": { theme: "", label: "§eAll-Round", weight: 17 },
  "allenscreations:lucky_farming": { theme: "F", label: "§aFarming", weight: 14 },
  "allenscreations:lucky_building": { theme: "B", label: "§6Building", weight: 20 },
  "allenscreations:lucky_combat": { theme: "C", label: "§cCombat", weight: 14 },
  "allenscreations:lucky_mining": { theme: "M", label: "§bMining", weight: 14 },
  "allenscreations:lucky_mystic": { theme: "Y", label: "§dMystic", weight: 12 },
  "allenscreations:lucky_treasure": { theme: "T", label: "§3Treasure", weight: 9 },
};

const rand = (n) => Math.floor(Math.random() * n);
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

const CHEST_LOOT = [
  ["minecraft:iron_ingot", 6],
  ["minecraft:gold_ingot", 4],
  ["minecraft:diamond", 2],
  ["minecraft:emerald", 4],
  ["minecraft:golden_apple", 1],
  ["minecraft:cooked_beef", 8],
  ["minecraft:ender_pearl", 2],
  ["minecraft:bread", 8],
  ["minecraft:coal", 12],
  ["minecraft:obsidian", 4],
  ["minecraft:lapis_lazuli", 8],
  ["minecraft:redstone", 12],
];

const lightningChest = (ctx) => {
  const player = ctx.player.location;
  const px = Math.floor(player.x);
  const pz = Math.floor(player.z);
  const y = ctx.loc.y + 1;
  const spots = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      const x = ctx.loc.x + dx;
      const z = ctx.loc.z + dz;
      if (x === px && z === pz) continue;
      const cell = ctx.dimension.getBlock({ x, y, z });
      if (!cell || !cell.isAir) continue;
      const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oz]) => {
        const near = ctx.dimension.getBlock({ x: x + ox, y, z: z + oz });
        return near && near.typeId === "minecraft:chest";
      });
      if (!next) spots.push({ x, z });
    }
  }
  if (spots.length === 0) throw new Error("no free spot");
  const at = spots[rand(spots.length)];
  const loot = [];
  const pool = CHEST_LOOT.slice();
  for (let i = 0; i < 5; i++) loot.push(pool.splice(rand(pool.length), 1)[0]);
  const place = (height) => {
    const block = ctx.dimension.getBlock({ x: at.x, y: height, z: at.z });
    if (!block) throw new Error("block not loaded");
    block.setType("minecraft:chest");
    const container = block.getComponent("minecraft:inventory")?.container;
    if (!container) throw new Error("chest inventory missing");
    loot.forEach(([id, n], slot) => container.setItem(slot, new ItemStack(id, n)));
  };
  const remove = (height) => {
    const block = ctx.dimension.getBlock({ x: at.x, y: height, z: at.z });
    if (block) block.setType("minecraft:air");
  };
  let height = y + 8;
  place(height);
  const fall = () => {
    remove(height);
    height -= 1;
    place(height);
    if (height > y) {
      later(2, fall);
      return;
    }
    for (let s = 0; s < 5; s++) {
      later(s * 20 + 1, () => {
        ctx.player.onScreenDisplay.setActionBar(`§eLoot chest! Lightning in ${5 - s}...`);
        ctx.player.playSound("note.bass");
      });
    }
    later(100, () => {
      const target = { x: at.x + 0.5, y, z: at.z + 0.5 };
      ctx.dimension.spawnEntity("minecraft:lightning_bolt", target);
      const block = ctx.dimension.getBlock({ x: at.x, y, z: at.z });
      if (!block || block.typeId !== "minecraft:chest") return;
      const container = block.getComponent("minecraft:inventory")?.container;
      if (container) {
        for (let slot = 0; slot < 27; slot++) {
          const item = container.getItem(slot);
          if (item) ctx.dimension.spawnItem(item, target);
        }
      }
      block.setType("minecraft:air");
    });
  };
  later(2, fall);
};

// 200 prizes: [name, kind, themes, run]. Themes: F farming, B building, C combat, M mining, Y mystic, T treasure.
const PRIZES = [
  ["Sapling Pack", "g", "F", items([["minecraft:oak_sapling", 3], ["minecraft:birch_sapling", 2], ["minecraft:bone_meal", 4]])],
  ["Dirt Delivery", "g", "B", items([["minecraft:dirt", 24]])],
  ["Oak Logs", "g", "B", items([["minecraft:oak_log", 10]])],
  ["Birch Logs", "g", "B", items([["minecraft:birch_log", 8]])],
  ["Plank Bundle", "g", "B", items([["minecraft:oak_planks", 16], ["minecraft:stick", 8]])],
  ["Stick Bundle", "g", "B", items([["minecraft:stick", 16]])],
  ["Seed Pouch", "g", "F", items([["minecraft:wheat_seeds", 8], ["minecraft:beetroot_seeds", 4], ["minecraft:pumpkin_seeds", 3], ["minecraft:melon_seeds", 3]])],
  ["Grass Blocks", "g", "B", items([["minecraft:grass_block", 12]])],
  ["Sand Pile", "g", "B", items([["minecraft:sand", 12]])],
  ["Flower Bouquet", "g", "F", items([["minecraft:dandelion", 3], ["minecraft:poppy", 3]])],
  ["Plains Wanderers", "g", "F", both(mobs("minecraft:cow", 1), mobs("minecraft:sheep", 1))],
  ["Wooden Sword", "g", "C", kit("minecraft:wooden_sword")],
  ["Wooden Pickaxe", "g", "M", kit("minecraft:wooden_pickaxe")],
  ["Experience Spark", "g", "Y", levels(2)],
  ["Sapling Mix", "g", "F", items([["minecraft:spruce_sapling", 3], ["minecraft:dark_oak_sapling", 2], ["minecraft:acacia_sapling", 2]])],
  ["Apple Pickings", "g", "F", items([["minecraft:apple", 4]])],
  ["Wooden Tool Set", "g", "M", kit("minecraft:wooden_pickaxe", "minecraft:wooden_axe", "minecraft:wooden_shovel", "minecraft:wooden_sword")],
  ["Leaf Bundle", "g", "FB", items([["minecraft:oak_leaves", 16]])],
  ["Forest Friends", "g", "F", both(mobs("minecraft:pig", 1), mobs("minecraft:chicken", 2))],
  ["Wolf Pup", "g", "C", both(mobs("minecraft:wolf", 1), items([["minecraft:bone", 4]]))],
  ["Archer Starter", "g", "C", items([["minecraft:bow", 1], ["minecraft:arrow", 12]])],
  ["Coal Starter", "g", "M", items([["minecraft:coal", 6]])],
  ["Book Stack", "g", "Y", items([["minecraft:book", 4]])],
  ["Emerald Find", "g", "T", items([["minecraft:emerald", 3]])],
  ["Stone Delivery", "g", "B", items([["minecraft:cobblestone", 32]])],
  ["Stone Tool Set", "g", "M", kit("minecraft:stone_pickaxe", "minecraft:stone_axe", "minecraft:stone_shovel", "minecraft:stone_sword")],
  ["Coal Stack", "g", "M", items([["minecraft:coal", 10]])],
  ["Furnace and Fuel", "g", "BM", items([["minecraft:furnace", 1], ["minecraft:charcoal", 8]])],
  ["Sand and Gravel", "g", "B", items([["minecraft:sand", 16], ["minecraft:gravel", 16]])],
  ["Torch Bundle", "g", "BM", items([["minecraft:torch", 12], ["minecraft:coal", 4]])],
  ["Stone Sword", "g", "C", kit("minecraft:stone_sword")],
  ["Stone Pickaxe", "g", "M", kit("minecraft:stone_pickaxe")],
  ["Lapis Pinch", "g", "Y", items([["minecraft:lapis_lazuli", 6]])],
  ["Lucky Coin", "g", "T", items([["minecraft:gold_ingot", 2]])],
  ["Harvest Basket", "g", "F", items([["minecraft:wheat", 8], ["minecraft:carrot", 6], ["minecraft:potato", 6]])],
  ["Farmer's Kit", "g", "F", items([["minecraft:stone_hoe", 1], ["minecraft:bone_meal", 8]])],
  ["Cooked Feast", "g", "F", items([["minecraft:cooked_beef", 6], ["minecraft:cooked_porkchop", 4], ["minecraft:bread", 4]])],
  ["Sugar Cane Cuttings", "g", "F", items([["minecraft:sugar_cane", 4]])],
  ["Hay Bales", "g", "F", items([["minecraft:hay_block", 3]])],
  ["Villager Visit", "g", "FT", both(mobs("minecraft:villager", 1), items([["minecraft:emerald", 2]]))],
  ["Raw Iron Haul", "g", "M", items([["minecraft:raw_iron", 6]])],
  ["Copper Haul", "g", "M", items([["minecraft:raw_copper", 8], ["minecraft:copper_ingot", 6]])],
  ["Empty Bucket", "g", "M", items([["minecraft:bucket", 1]])],
  ["Iron Ingots", "g", "M", items([["minecraft:iron_ingot", 10]])],
  ["Iron Tool Kit", "g", "M", kit("minecraft:iron_pickaxe", "minecraft:iron_axe", "minecraft:iron_shovel")],
  ["Iron Armor Pair", "g", "C", kit("minecraft:iron_helmet", "minecraft:iron_chestplate")],
  ["Sword and Shield", "g", "C", kit("minecraft:iron_sword", "minecraft:shield")],
  ["Water Bucket", "g", "M", items([["minecraft:water_bucket", 1]])],
  ["Bow and Arrows", "g", "C", items([["minecraft:bow", 1], ["minecraft:arrow", 24]])],
  ["Lava Bucket", "g", "M", items([["minecraft:lava_bucket", 1]])],
  ["Crafting Corner", "g", "B", items([["minecraft:crafting_table", 1], ["minecraft:furnace", 1], ["minecraft:chest", 2]])],
  ["Gold Haul", "g", "MT", items([["minecraft:gold_ingot", 6]])],
  ["Redstone Dust", "g", "M", items([["minecraft:redstone", 20]])],
  ["Lapis Lazuli", "g", "M", items([["minecraft:lapis_lazuli", 16]])],
  ["Amethyst Shards", "g", "MY", items([["minecraft:amethyst_shard", 8]])],
  ["Iron Blade", "g", "C", kit("minecraft:iron_sword")],
  ["Glow Berries", "g", "F", items([["minecraft:glow_berries", 8]])],
  ["Night Sight", "g", "M", effect("night_vision", 120)],
  ["Diamond Pair", "g", "MT", items([["minecraft:diamond", 2]])],
  ["Diamond Pickaxe", "g", "M", kit("minecraft:diamond_pickaxe")],
  ["Obsidian Stack", "g", "B", items([["minecraft:obsidian", 6]])],
  ["Iron Blocks", "g", "B", items([["minecraft:iron_block", 2]])],
  ["Arrow Quiver", "g", "C", items([["minecraft:arrow", 32]])],
  ["Haste Rush", "g", "M", effect("haste", 60, 1)],
  ["XP Surge", "g", "Y", levels(6)],
  ["Bookshelf Bundle", "g", "BY", items([["minecraft:bookshelf", 4], ["minecraft:book", 6]])],
  ["Enchanting Table", "g", "Y", kit("minecraft:enchanting_table")],
  ["Experience Flood", "g", "Y", levels(10)],
  ["Anvil Gift", "g", "BY", kit("minecraft:anvil")],
  ["Spare Shield", "g", "C", kit("minecraft:shield")],
  ["Nether Kit", "g", "Y", items([["minecraft:obsidian", 10], ["minecraft:flint_and_steel", 1]])],
  ["Golden Apples", "g", "C", items([["minecraft:golden_apple", 2]])],
  ["Piglin Bribe", "g", "MT", items([["minecraft:gold_ingot", 10]])],
  ["Fire Shield", "g", "C", effect("fire_resistance", 180)],
  ["Flint Stack", "g", "M", items([["minecraft:flint", 8]])],
  ["Quartz Haul", "g", "M", items([["minecraft:quartz", 16]])],
  ["Glowstone Dust", "g", "Y", items([["minecraft:glowstone_dust", 16]])],
  ["Nether Wart", "g", "Y", items([["minecraft:nether_wart", 8]])],
  ["Soul Sand and Netherrack", "g", "B", items([["minecraft:soul_sand", 8], ["minecraft:netherrack", 32]])],
  ["Ancient Debris", "g", "M", items([["minecraft:ancient_debris", 2]])],
  ["Blaze Rods", "g", "Y", items([["minecraft:blaze_rod", 6]])],
  ["Ender Pearls", "g", "Y", items([["minecraft:ender_pearl", 4]])],
  ["Brewing Kit", "g", "Y", items([["minecraft:brewing_stand", 1], ["minecraft:blaze_powder", 4]])],
  ["Nether Bricks", "g", "B", items([["minecraft:netherbrick", 16]])],
  ["Strength Surge", "g", "C", effect("strength", 60, 1)],
  ["Eyes of Ender", "g", "Y", items([["minecraft:ender_eye", 6]])],
  ["Golden Carrots", "g", "F", items([["minecraft:golden_carrot", 8]])],
  ["Slow Falling", "g", "Y", effect("slow_falling", 120)],
  ["Bed Set", "g", "B", items([["minecraft:red_bed", 2]])],
  ["Regeneration Surge", "g", "C", effect("regeneration", 30, 1)],
  ["Ender Chest", "g", "BT", kit("minecraft:ender_chest")],
  ["End Rods", "g", "B", items([["minecraft:end_rod", 8]])],
  ["Echo Shards", "g", "YT", items([["minecraft:echo_shard", 3]])],
  ["Sculk Haul", "g", "B", items([["minecraft:sculk", 8], ["minecraft:sculk_sensor", 2]])],
  ["Disc Fragment", "g", "Y", items([["minecraft:disc_fragment_5", 1]])],
  ["Quiet Steps", "g", "Y", both(effect("speed", 60, 1), effect("night_vision", 180))],
  ["Netherite Scrap", "g", "MT", items([["minecraft:netherite_scrap", 4]])],
  ["Diamond Armor Pair", "g", "C", kit("minecraft:diamond_helmet", "minecraft:diamond_chestplate")],
  ["Totem of Undying", "g", "CT", kit("minecraft:totem_of_undying")],
  ["Celebration Cake", "g", "FT", kit("minecraft:cake")],
  ["Prismarine Haul", "g", "B", items([["minecraft:prismarine", 16], ["minecraft:prismarine_shard", 8]])],
  ["Sea Lanterns", "g", "B", items([["minecraft:sea_lantern", 6]])],
  ["Ocean Treasures", "g", "T", items([["minecraft:heart_of_the_sea", 1], ["minecraft:nautilus_shell", 2]])],
  ["Trident", "g", "CT", kit("minecraft:trident")],
  ["Sea Blessing", "g", "Y", both(effect("water_breathing", 300), effect("conduit_power", 120))],
  ["Elytra", "g", "T", kit("minecraft:elytra")],
  ["Shulker Shells", "g", "YT", items([["minecraft:shulker_shell", 4]])],
  ["Chorus Fruit", "g", "Y", items([["minecraft:chorus_fruit", 8]])],
  ["Dragon Head", "g", "T", kit("minecraft:dragon_head")],
  ["Purpur Stack", "g", "B", items([["minecraft:purpur_block", 16]])],
  ["Netherite Ingot", "g", "T", items([["minecraft:netherite_ingot", 1]])],
  ["Beacon", "g", "T", kit("minecraft:beacon")],
  ["Nether Star", "g", "T", kit("minecraft:nether_star")],
  ["Netherite Pickaxe", "g", "MT", kit("minecraft:netherite_pickaxe")],
  ["Diamond Blocks", "g", "T", items([["minecraft:diamond_block", 3]])],
  ["Enchanted Golden Apples", "g", "CT", items([["minecraft:enchanted_golden_apple", 3]])],
  ["Dragon Egg", "g", "T", kit("minecraft:dragon_egg")],
  ["Divine Aura", "g", "CY", both(effect("resistance", 120, 2), effect("regeneration", 60, 2), effect("absorption", 120, 4))],
  ["Experience Ascension", "g", "Y", levels(30)],
  ["Hunger Pangs", "b", "F", effect("hunger", 10)],
  ["Heavy Legs", "b", "M", effect("slowness", 8)],
  ["Butterfingers", "b", "T", butterfingers],
  ["XP Tax", "b", "YT", tax(2)],
  ["Stubbed Toe", "b", "BM", hurt(2)],
  ["Falling Anvil", "b", "BM", fallingAnvil],
  ["Zombie Wanderer", "b", "C", mobs("minecraft:zombie", 1)],
  ["Spider Scare", "b", "C", mobs("minecraft:spider", 1)],
  ["Weak Wrists", "b", "C", effect("weakness", 15)],
  ["Thunder Pig", "b", "F", thunderMob("minecraft:pig")],
  ["Dizzy Spell", "b", "Y", effect("nausea", 6)],
  ["Zombie Pair", "b", "C", mobs("minecraft:zombie", 2)],
  ["Skeleton Scout", "b", "C", mobs("minecraft:skeleton", 1)],
  ["Silverfish Pests", "b", "MB", mobs("minecraft:silverfish", 3)],
  ["Tired Arms", "b", "M", effect("mining_fatigue", 20)],
  ["Witch Visit", "b", "YC", mobs("minecraft:witch", 1)],
  ["Pillager Scout", "b", "CT", mobs("minecraft:pillager", 1)],
  ["Poison Sting", "b", "Y", effect("poison", 8)],
  ["Sudden Darkness", "b", "YM", effect("darkness", 8)],
  ["Thunder Villager", "b", "YF", thunderMob("minecraft:villager")],
  ["Cave Spider Nest", "b", "MC", mobs("minecraft:cave_spider", 3)],
  ["Skeleton Pair", "b", "C", mobs("minecraft:skeleton", 2)],
  ["Slime Splat", "b", "M", mobs("minecraft:slime", 2)],
  ["Blind Spot", "b", "Y", effect("blindness", 6)],
  ["Zombie Pack", "b", "C", mobs("minecraft:zombie", 3)],
  ["Husk Pair", "b", "C", mobs("minecraft:husk", 2)],
  ["Stray Pair", "b", "C", mobs("minecraft:stray", 2)],
  ["Fire Starter", "b", "B", fire(4)],
  ["Lava Splash", "b", "BM", lavaSplash],
  ["Drowned Pair", "b", "C", mobs("minecraft:drowned", 2)],
  ["Deep Hunger", "b", "F", effect("hunger", 30, 2)],
  ["Weighted Down", "b", "MB", effect("slowness", 20, 2)],
  ["Cold Sweat", "b", "C", both(effect("weakness", 20, 1), effect("hunger", 15))],
  ["Poison Surge", "b", "Y", effect("poison", 15, 1)],
  ["Memory Drain", "b", "Y", tax(8)],
  ["Lightning Strike", "b", "Y", strikes(1)],
  ["Phantom Pair", "b", "CY", mobs("minecraft:phantom", 2, 3)],
  ["Magma Cube Pair", "b", "MC", mobs("minecraft:magma_cube", 2)],
  ["Burning Skin", "b", "M", fire(8)],
  ["Loud Boom", "b", "MB", booms(1, 1.5)],
  ["Bone Meal Pile", "g", "F", items([["minecraft:bone_meal", 16]])],
  ["Pie Time", "g", "F", items([["minecraft:pumpkin_pie", 4]])],
  ["Berry Bushel", "g", "F", items([["minecraft:sweet_berries", 12]])],
  ["Egg Basket", "g", "F", items([["minecraft:egg", 12]])],
  ["Rabbit Burrow", "g", "F", mobs("minecraft:rabbit", 2)],
  ["Bee Buddies", "g", "F", mobs("minecraft:bee", 2)],
  ["Glass Order", "g", "B", items([["minecraft:glass", 16]])],
  ["Spruce Logs", "g", "B", items([["minecraft:spruce_log", 10]])],
  ["Ladder Pack", "g", "B", items([["minecraft:ladder", 16]])],
  ["Door Set", "g", "B", items([["minecraft:oak_door", 3], ["minecraft:oak_trapdoor", 4]])],
  ["Lantern Set", "g", "B", items([["minecraft:lantern", 4]])],
  ["White Wool", "g", "B", items([["minecraft:white_wool", 12]])],
  ["Crossbow Kit", "g", "C", items([["minecraft:crossbow", 1], ["minecraft:arrow", 8]])],
  ["Iron Legwear", "g", "C", kit("minecraft:iron_leggings", "minecraft:iron_boots")],
  ["Diamond Sword", "g", "CT", kit("minecraft:diamond_sword")],
  ["Resistance Brew", "g", "C", effect("resistance", 60)],
  ["Speed Burst", "g", "C", effect("speed", 45)],
  ["Iron Golem Guard", "g", "C", mobs("minecraft:iron_golem", 1)],
  ["Iron Nuggets", "g", "M", items([["minecraft:iron_nugget", 24]])],
  ["Raw Gold", "g", "MT", items([["minecraft:raw_gold", 8]])],
  ["Coal Block", "g", "M", items([["minecraft:coal_block", 2]])],
  ["Golden Pickaxe", "g", "M", kit("minecraft:golden_pickaxe")],
  ["Shears", "g", "MF", kit("minecraft:shears")],
  ["Compass and Clock", "g", "MT", kit("minecraft:compass", "minecraft:clock")],
  ["Experience Bottles", "g", "Y", items([["minecraft:experience_bottle", 8]])],
  ["Name Tag", "g", "Y", kit("minecraft:name_tag")],
  ["Ghast Tear", "g", "Y", items([["minecraft:ghast_tear", 2]])],
  ["Rabbit's Foot", "g", "Y", items([["minecraft:rabbit_foot", 2]])],
  ["Water Breathing", "g", "Y", effect("water_breathing", 120)],
  ["Quick Vanish", "g", "Y", effect("invisibility", 60)],
  ["XP Burst", "g", "Y", levels(5)],
  ["Emerald Stack", "g", "T", items([["minecraft:emerald", 8]])],
  ["Gold Stack", "g", "T", items([["minecraft:gold_ingot", 12]])],
  ["Wandering Trader", "g", "T", mobs("minecraft:wandering_trader", 1)],
  ["Falling Chest", "g", "T", lightningChest],
  ["Rotten Lunch", "b", "F", items([["minecraft:rotten_flesh", 8]])],
  ["Spoiled Gift", "b", "Y", items([["minecraft:spider_eye", 4]])],
  ["Stomach Ache", "b", "F", both(effect("hunger", 15), effect("nausea", 8))],
  ["Heavy Head", "b", "M", effect("mining_fatigue", 12)],
  ["Shaky Knees", "b", "C", effect("slowness", 6, 1)],
  ["Bump on the Head", "b", "B", hurt(3)],
];

const TUTORIAL = [
  ["Oak Logs", items([["minecraft:oak_log", 12]]), "Craft logs into planks in your inventory"],
  ["Oak Planks", items([["minecraft:oak_planks", 24]]), "Planks make tables, tools and blocks"],
  ["Sticks", items([["minecraft:stick", 16]]), "Sticks are part of every tool"],
  ["Crafting Table", items([["minecraft:crafting_table", 1]]), "Place it to craft bigger recipes"],
  ["Wooden Pickaxe and Axe", kit("minecraft:wooden_pickaxe", "minecraft:wooden_axe"), "Pickaxe for stone, axe for wood"],
  ["Wooden Shovel and Sword", kit("minecraft:wooden_shovel", "minecraft:wooden_sword"), "A sword keeps early mobs away"],
  ["Leather Helmet and Chestplate", kit("minecraft:leather_helmet", "minecraft:leather_chestplate"), "Equip armor from your inventory"],
  ["Leather Leggings and Boots", kit("minecraft:leather_leggings", "minecraft:leather_boots"), "Wear all four pieces for full protection"],
  ["Dirt", items([["minecraft:dirt", 32]]), "Dirt helps you grow your island"],
  ["Cobblestone", items([["minecraft:cobblestone", 32]]), "Your first strong building block"],
  ["Sand", items([["minecraft:sand", 16]]), "Smelt sand in a furnace to make glass"],
  ["Furnace and Coal", items([["minecraft:furnace", 1], ["minecraft:coal", 8]]), "Furnaces cook food and smelt ores"],
  ["Torches", items([["minecraft:torch", 16]]), "Light keeps mobs from spawning"],
  ["Food Basket", items([["minecraft:bread", 8], ["minecraft:cooked_beef", 6]]), "Eat when your hunger bar drops"],
  ["Crop Seeds", items([["minecraft:wheat_seeds", 8], ["minecraft:carrot", 4], ["minecraft:potato", 4]]), "Plant seeds on dirt near water"],
  ["Saplings and Bone Meal", items([["minecraft:oak_sapling", 4], ["minecraft:bone_meal", 8]]), "Plant saplings on grass, then use bone meal"],
  ["Water Bucket", items([["minecraft:water_bucket", 1]]), "Water makes farmland and an endless supply"],
  ["Bed", items([["minecraft:red_bed", 1]]), "Sleep to skip the night and set your spawn"],
  ["Farm Animals", both(mobs("minecraft:cow", 1), mobs("minecraft:sheep", 1)), "Animals give food and wool"],
  ["Birch Logs", items([["minecraft:birch_log", 12]]), "Mix wood types for different looks"],
];

const tutorialRaw = () => world.getDynamicProperty(TUTORIAL_KEY);
const tutorialActive = () => tutorialRaw() !== "done";

function takeTutorial() {
  const raw = tutorialRaw();
  if (raw === "done") return null;
  const left = typeof raw === "string" && raw.length > 0 ? raw.split(",").map(Number) : TUTORIAL.map((entry, index) => index);
  const index = left.splice(rand(left.length), 1)[0];
  world.setDynamicProperty(TUTORIAL_KEY, left.length > 0 ? left.join(",") : "done");
  return { entry: TUTORIAL[index], number: TUTORIAL.length - left.length, last: left.length === 0 };
}

function showTutorial(player, dimension, loc, step) {
  const ctx = { player, dimension, loc, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  try {
    step.entry[1](ctx);
  } catch (e) {
    return;
  }
  try {
    player.onScreenDisplay.setActionBar(`§bTutorial ${step.number}/${TUTORIAL.length} §8|§r §a${step.entry[0]} §8-§r §7${step.entry[2]}`);
    player.playSound("random.levelup");
    dimension.spawnParticle("minecraft:villager_happy", ctx.top);
  } catch (e) {
    return;
  }
  if (step.last) later(80, () => player.onScreenDisplay.setActionBar("§6Tutorial complete! From now on every break is a random prize."));
}

function nextBlockId() {
  if (tutorialActive()) return LUCKY;
  const ids = Object.keys(TYPES);
  let roll = Math.random() * ids.reduce((sum, id) => sum + TYPES[id].weight, 0);
  for (const id of ids) {
    roll -= TYPES[id].weight;
    if (roll < 0) return id;
  }
  return LUCKY;
}

function announce(ctx, prize) {
  const good = prize[1] === "g";
  const line = `${ctx.type.label}§r §8|§r ${good ? "§a" : "§c"}${prize[0]}`;
  try {
    ctx.player.onScreenDisplay.setActionBar(line);
    ctx.player.playSound(good ? "random.levelup" : "note.bass");
    ctx.dimension.spawnParticle(good ? "minecraft:villager_happy" : "minecraft:villager_angry", ctx.top);
  } catch (e) {
    return;
  }
}

function trigger(player, dimension, loc, type) {
  const ctx = { player, dimension, loc, type, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  const pool = type.theme ? PRIZES.filter((p) => p[2].includes(type.theme)) : PRIZES;
  for (let attempt = 0; attempt < 6; attempt++) {
    const prize = pool[rand(pool.length)];
    try {
      prize[3](ctx);
    } catch (e) {
      continue;
    }
    announce(ctx, prize);
    return;
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const type = TYPES[event.brokenBlockPermutation.type.id];
  if (!type) return;
  const { player, dimension, block } = event;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  const isCore = dimension.id === "minecraft:overworld" && loc.x === CORE.x && loc.y === CORE.y && loc.z === CORE.z;
  system.run(() => {
    const step = isCore ? takeTutorial() : null;
    if (isCore) {
      const target = dimension.getBlock(loc);
      if (target && target.isAir) target.setType(nextBlockId());
    }
    if (step) showTutorial(player, dimension, loc, step);
    else trigger(player, dimension, loc, type);
  });
});

system.runInterval(() => {
  if (world.getPlayers({ tags: [SETUP_TAG] }).length === 0) return;
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
      player.onScreenDisplay.setActionBar("§6Break the lucky block under you. Open the chest first. The first 20 breaks are a safe tutorial.");
    } catch (e) {
      return;
    }
  }, 100);
});

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
