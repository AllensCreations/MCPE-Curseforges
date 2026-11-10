import { world, system, ItemStack, EquipmentSlot } from "@minecraft/server";

const LUCKY = "allenscreations:lucky_block";
const CORE = { x: 0, y: 64, z: 0 };
const BREAKS_KEY = "lucky_breaks";
const BONUS_KEY = "lucky_bonus";
const JINX_KEY = "lucky_jinx";
const GOOD_STREAK = 30;

const TIERS = {
  good: [
    { id: "common", label: "Common Luck", color: "§a", weight: 60 },
    { id: "rare", label: "Rare Luck", color: "§b", weight: 30 },
    { id: "epic", label: "Epic Luck", color: "§d", weight: 10 },
  ],
  bad: [
    { id: "mischief", label: "Mischief", color: "§e", weight: 50 },
    { id: "bad", label: "Bad Luck", color: "§c", weight: 38 },
    { id: "cursed", label: "Cursed", color: "§4", weight: 12 },
  ],
};

const rand = (n) => Math.floor(Math.random() * n);
const num = (key) => {
  const v = world.getDynamicProperty(key);
  return typeof v === "number" ? v : 0;
};
const spot = (ctx, lift) => ({ x: ctx.top.x + rand(3) - 1, y: ctx.loc.y + lift, z: ctx.top.z + rand(3) - 1 });

const items = (list) => (ctx) => {
  for (const [id, n] of list) ctx.dimension.spawnItem(new ItemStack(id, n), ctx.top);
};
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
const bonus = (key, n) => () => {
  world.setDynamicProperty(key, num(key) + n);
};
const both = (...runs) => (ctx) => {
  for (const run of runs) run(ctx);
};
const good = (tier, name, run) => ({ luck: "good", tier, name, run });
const bad = (tier, name, run) => ({ luck: "bad", tier, name, run });

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
  system.runTimeout(() => {
    try {
      if (block.typeId === "minecraft:lava") block.setType("minecraft:air");
    } catch (e) {
      return;
    }
  }, 80);
};

const lightning = (ctx) => {
  ctx.dimension.spawnEntity("minecraft:lightning_bolt", ctx.top);
};

const boom = (ctx) => {
  ctx.dimension.createExplosion(ctx.top, 1.5, { breaksBlocks: false, causesFire: false });
};

const fire = (ctx) => {
  ctx.player.setOnFire(4);
};

const OUTCOMES = [
  good("common", "Sapling Pack", items([["minecraft:oak_sapling", 3], ["minecraft:birch_sapling", 2], ["minecraft:bone_meal", 6]])),
  good("common", "Seed Pouch", items([["minecraft:wheat_seeds", 8], ["minecraft:beetroot_seeds", 4], ["minecraft:pumpkin_seeds", 3], ["minecraft:melon_seeds", 3]])),
  good("common", "Log Pile", items([["minecraft:oak_log", 12]])),
  good("common", "Plank Bundle", items([["minecraft:oak_planks", 20], ["minecraft:stick", 12]])),
  good("common", "Stone Delivery", items([["minecraft:cobblestone", 32]])),
  good("common", "Dirt Delivery", items([["minecraft:dirt", 24]])),
  good("common", "Sand and Gravel", items([["minecraft:sand", 16], ["minecraft:gravel", 16]])),
  good("common", "Warm Meal", items([["minecraft:cooked_beef", 5], ["minecraft:bread", 6]])),
  good("common", "Torch Bundle", items([["minecraft:torch", 16], ["minecraft:coal", 8]])),
  good("common", "Coal Stack", items([["minecraft:coal", 12]])),
  good("common", "Sugar Cane Cuttings", items([["minecraft:sugar_cane", 4]])),
  good("common", "Fresh Fish", items([["minecraft:cooked_salmon", 4], ["minecraft:cooked_cod", 4]])),
  good("common", "Apple Pickings", items([["minecraft:apple", 4]])),
  good("common", "Flower Bouquet", items([["minecraft:dandelion", 3], ["minecraft:poppy", 3]])),
  good("common", "XP Sip", levels(3)),
  good("common", "Speed Burst", effect("speed", 30, 1)),
  good("common", "Feather Fall", effect("slow_falling", 60)),
  good("common", "Regeneration Sip", effect("regeneration", 10, 1)),

  good("rare", "Water Bucket", items([["minecraft:water_bucket", 1]])),
  good("rare", "Iron Haul", items([["minecraft:iron_ingot", 8]])),
  good("rare", "Gold Haul", items([["minecraft:gold_ingot", 4]])),
  good("rare", "Redstone and Lapis", items([["minecraft:redstone", 16], ["minecraft:lapis_lazuli", 10]])),
  good("rare", "Iron Tool Kit", items([["minecraft:iron_pickaxe", 1], ["minecraft:iron_axe", 1], ["minecraft:iron_shovel", 1]])),
  good("rare", "Sword and Shield", items([["minecraft:iron_sword", 1], ["minecraft:shield", 1]])),
  good("rare", "Bow and Arrows", items([["minecraft:bow", 1], ["minecraft:arrow", 24]])),
  good("rare", "Crafting Corner", items([["minecraft:crafting_table", 1], ["minecraft:furnace", 1], ["minecraft:chest", 2]])),
  good("rare", "Wool Delivery", items([["minecraft:white_wool", 6]])),
  good("rare", "Lava Bucket", items([["minecraft:lava_bucket", 1]])),
  good("rare", "Farm Friends", both(mobs("minecraft:cow", 1), mobs("minecraft:sheep", 1), mobs("minecraft:pig", 1), mobs("minecraft:chicken", 2))),
  good("rare", "Wolf Pup", both(mobs("minecraft:wolf", 1), items([["minecraft:bone", 4]]))),
  good("rare", "Diamond Pair", items([["minecraft:diamond", 2]])),
  good("rare", "Rabbit's Foot Pair", items([["minecraft:rabbit_foot", 2]])),
  good("rare", "Four-Leaf Fortune", bonus(BONUS_KEY, 5)),
  good("rare", "Haste Rush", effect("haste", 60, 1)),
  good("rare", "Night Sight", effect("night_vision", 120)),
  good("rare", "XP Surge", levels(6)),

  good("epic", "Nether Kit", items([["minecraft:obsidian", 10], ["minecraft:flint_and_steel", 1]])),
  good("epic", "Golden Apples", items([["minecraft:golden_apple", 3]])),
  good("epic", "Enchanted Golden Apple", items([["minecraft:enchanted_golden_apple", 1]])),
  good("epic", "Totem of Undying", items([["minecraft:totem_of_undying", 1]])),
  good("epic", "Diamond Haul", items([["minecraft:diamond", 5]])),
  good("epic", "Diamond Pickaxe", items([["minecraft:diamond_pickaxe", 1]])),
  good("epic", "Villager Visit", both(mobs("minecraft:villager", 1), items([["minecraft:emerald", 6]]))),
  good("epic", "Iron Golem Guard", mobs("minecraft:iron_golem", 1)),
  good("epic", "Ender Pearls", items([["minecraft:ender_pearl", 3]])),
  good("epic", "Horse and Saddle", both(mobs("minecraft:horse", 1), items([["minecraft:saddle", 1]]))),
  good("epic", "Golden Horseshoe", bonus(BONUS_KEY, 10)),
  good("epic", "XP Explosion", levels(12)),
  good("epic", "Iron Skin", both(effect("resistance", 60, 1), effect("absorption", 60, 2))),

  bad("mischief", "Hunger Pangs", effect("hunger", 20, 1)),
  bad("mischief", "Heavy Legs", effect("slowness", 15, 1)),
  bad("mischief", "Tired Arms", effect("mining_fatigue", 20)),
  bad("mischief", "Weak Wrists", effect("weakness", 20)),
  bad("mischief", "Dizzy Spell", effect("nausea", 8)),
  bad("mischief", "Sudden Darkness", effect("darkness", 10)),
  bad("mischief", "Blind Spot", effect("blindness", 6)),
  bad("mischief", "Butterfingers", butterfingers),
  bad("mischief", "XP Tax", tax(3)),

  bad("bad", "Zombie Pack", mobs("minecraft:zombie", 3)),
  bad("bad", "Skeleton Pair", mobs("minecraft:skeleton", 2)),
  bad("bad", "Spider Nest", both(mobs("minecraft:spider", 2), mobs("minecraft:cave_spider", 1))),
  bad("bad", "Slime Splat", mobs("minecraft:slime", 2)),
  bad("bad", "Pillager Patrol", mobs("minecraft:pillager", 2)),
  bad("bad", "Witch Visit", mobs("minecraft:witch", 1)),
  bad("bad", "Poison Sting", effect("poison", 10)),
  bad("bad", "Lava Splash", lavaSplash),
  bad("bad", "Phantom Pair", mobs("minecraft:phantom", 2, 3)),
  bad("bad", "Fire Starter", fire),
  bad("bad", "Jinx", bonus(JINX_KEY, 5)),

  bad("cursed", "Blaze Ambush", mobs("minecraft:blaze", 1, 2)),
  bad("cursed", "Wither Skeleton Raid", mobs("minecraft:wither_skeleton", 1)),
  bad("cursed", "Vex Swarm", mobs("minecraft:vex", 3, 2)),
  bad("cursed", "Lightning Strike", lightning),
  bad("cursed", "Loud Boom", boom),
  bad("cursed", "Wither Touch", effect("wither", 5)),
  bad("cursed", "Zombie Horde", mobs("minecraft:zombie", 6)),
];

const FALLBACK = {
  good: good("common", "Dirt Delivery", items([["minecraft:dirt", 16]])),
  bad: bad("mischief", "Heavy Legs", effect("slowness", 10, 1)),
};

let lastName = "";

function pickTier(kind) {
  const list = TIERS[kind];
  let roll = rand(100);
  for (const tier of list) {
    if (roll < tier.weight) return tier;
    roll -= tier.weight;
  }
  return list[0];
}

function pickOutcome(kind) {
  const tier = pickTier(kind);
  const pool = OUTCOMES.filter((o) => o.luck === kind && o.tier === tier.id && o.name !== lastName);
  const outcome = pool[rand(pool.length)];
  lastName = outcome.name;
  return { outcome, tier };
}

function useCharm(player) {
  const equip = player.getComponent("minecraft:equippable");
  const held = equip?.getEquipment(EquipmentSlot.Offhand);
  if (!held || held.typeId !== "minecraft:rabbit_foot") return false;
  if (held.amount > 1) {
    held.amount -= 1;
    equip.setEquipment(EquipmentSlot.Offhand, held);
  } else {
    equip.setEquipment(EquipmentSlot.Offhand, undefined);
  }
  return true;
}

function rollKind(player, breaks) {
  if (breaks <= GOOD_STREAK) return "good";
  let chance = 0.5;
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
  if (useCharm(player)) chance += 0.25;
  chance = Math.min(0.85, Math.max(0.15, chance));
  return Math.random() < chance ? "good" : "bad";
}

function announce(ctx, kind, tier, outcome, breaks) {
  const line = `${tier.color}${tier.label}§r: ${outcome.name}`;
  try {
    ctx.player.onScreenDisplay.setActionBar(line);
    ctx.player.sendMessage(`§7Break ${breaks}: §r${line}`);
    const sound = kind === "good" ? (tier.id === "epic" ? "random.totem" : "random.levelup") : tier.id === "cursed" ? "mob.wither.spawn" : "note.bass";
    ctx.player.playSound(sound);
    const particle = kind === "good" ? (tier.id === "epic" ? "minecraft:totem_particle" : "minecraft:villager_happy") : "minecraft:villager_angry";
    ctx.dimension.spawnParticle(particle, ctx.top);
  } catch (e) {
    return;
  }
}

function trigger(player, dimension, loc) {
  const breaks = num(BREAKS_KEY) + 1;
  world.setDynamicProperty(BREAKS_KEY, breaks);
  const ctx = { player, dimension, loc, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  const kind = rollKind(player, breaks);
  let { outcome, tier } = pickOutcome(kind);
  try {
    outcome.run(ctx);
  } catch (e) {
    outcome = FALLBACK[kind];
    tier = TIERS[kind][0];
    try {
      outcome.run(ctx);
    } catch (e2) {
      return;
    }
  }
  announce(ctx, kind, tier, outcome, breaks);
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
