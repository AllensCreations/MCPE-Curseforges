export const IDS = {
  silver: "aln:silver_token",
  gold: "aln:gold_doubloon",
  cursed: "aln:cursed_coin",
  ledger: "aln:captains_ledger"
};

export const VALUE = {
  "aln:silver_token": 1,
  "aln:gold_doubloon": 10,
  "aln:cursed_coin": 100
};

export const COIN_NAME = {
  "aln:silver_token": "Silver Pirate Token",
  "aln:gold_doubloon": "Gold Pirate Doubloon",
  "aln:cursed_coin": "Cursed Captain's Coin"
};

export const COIN_ICON = {
  "aln:silver_token": "textures/items/aln_silver_token",
  "aln:gold_doubloon": "textures/items/aln_gold_doubloon",
  "aln:cursed_coin": "textures/items/aln_cursed_coin",
  "aln:captains_ledger": "textures/items/aln_captains_ledger"
};

export const mc = (typeId) => `textures/ui/aln_icons/${typeId.replace("minecraft:", "")}`;

export const iconOf = (typeId) => COIN_ICON[typeId] ?? mc(typeId);

export const KEYS = {
  vault: "aln_pt:vault",
  bounties: "aln_pt:bounties",
  kept: "aln_pt:kept",
  chests: "aln_pt:chests"
};

export const TITLE = "§l§6@ALNStudios §ePirate Ledger";

export const MOB_DROPS = {
  "minecraft:drowned": [{ id: IDS.silver, chance: 0.25, min: 1, max: 2 }],
  "minecraft:guardian": [{ id: IDS.silver, chance: 0.35, min: 1, max: 3 }],
  "minecraft:elder_guardian": [{ id: IDS.gold, chance: 1, min: 1, max: 2 }],
  "minecraft:pillager": [{ id: IDS.silver, chance: 0.25, min: 1, max: 2 }],
  "minecraft:ravager": [
    { id: IDS.silver, chance: 1, min: 2, max: 4 },
    { id: IDS.gold, chance: 0.15, min: 1, max: 1 }
  ],
  "minecraft:wither": [
    { id: IDS.gold, chance: 1, min: 3, max: 5 },
    { id: IDS.cursed, chance: 0.35, min: 1, max: 1 }
  ]
};

export const FISHING_TREASURE = [
  "minecraft:bow",
  "minecraft:enchanted_book",
  "minecraft:fishing_rod",
  "minecraft:name_tag",
  "minecraft:nautilus_shell",
  "minecraft:saddle"
];

export const SHIPWRECK_SIGNS = [
  "minecraft:paper",
  "minecraft:wheat",
  "minecraft:carrot",
  "minecraft:potato",
  "minecraft:coal",
  "minecraft:rotten_flesh",
  "minecraft:pumpkin",
  "minecraft:bamboo",
  "minecraft:gunpowder",
  "minecraft:tnt",
  "minecraft:iron_nugget",
  "minecraft:gold_nugget",
  "minecraft:experience_bottle"
];

export const CUTLASS_NAME = "Sea-Dog's Cutlass";
export const COMPASS_NAME = "Treasure Hunter's Compass";
export const BREEZE_NAME = "Bottled Sea Breeze";

export const SHOP = [
  { key: "compass", label: "Hunter's Compass", price: 80, icon: mc("minecraft:compass"), note: "Use it to locate buried treasure. Sneak and use it to locate shipwrecks." },
  { key: "cutlass", label: "Sea-Dog's Cutlass", price: 200, icon: mc("minecraft:iron_sword"), note: "Speed while swimming and extra token drops." },
  { key: "breeze", label: "Bottled Sea Breeze", price: 40, icon: mc("minecraft:glass_bottle"), note: "Dolphin's Grace and Water Breathing for 5 minutes." },
  { key: "prismarine", label: "Prismarine Mason Bundle", price: 60, icon: mc("minecraft:prismarine"), note: "32 Prismarine, 16 Prismarine Bricks, 8 Sea Lanterns." },
  { key: "shipwright", label: "Shipwright Bundle", price: 50, icon: mc("minecraft:dark_oak_boat"), note: "64 Dark Oak Planks, 32 Dark Oak Logs, 16 Iron Nuggets." },
  { key: "treasure", label: "Treasure Hoarder Bundle", price: 120, icon: mc("minecraft:chest"), note: "4 Chests, 2 Gold Blocks, 8 Emeralds." }
];

export const TIERS = [
  { key: "common", name: "Common", color: "§f" },
  { key: "uncommon", name: "Uncommon", color: "§a" },
  { key: "rare", name: "Rare", color: "§b" },
  { key: "epic", name: "Epic", color: "§d" },
  { key: "legendary", name: "Legendary", color: "§6" }
];

export const tierOf = (prize) => TIERS.find((x) => x.key === prize.tier) ?? TIERS[0];

const P = (tier, id, amount, label, w = 1) => ({ tier, id, amount, label, w });

export const PRIZES = [
  P("common", IDS.silver, 12, "12 Silver Pirate Tokens", 2),
  P("common", "minecraft:cooked_salmon", 16, "16 Cooked Salmon"),
  P("common", "minecraft:cooked_cod", 16, "16 Cooked Cod"),
  P("common", "minecraft:bread", 16, "16 Bread"),
  P("common", "minecraft:dark_oak_planks", 32, "32 Dark Oak Planks"),
  P("common", "minecraft:iron_ingot", 16, "16 Iron Ingots"),
  P("common", "minecraft:gold_nugget", 16, "16 Gold Nuggets"),
  P("common", "minecraft:coal", 32, "32 Coal"),
  P("common", "minecraft:arrow", 32, "32 Arrows"),
  P("common", "minecraft:dried_kelp", 32, "32 Dried Kelp"),
  P("common", "minecraft:sea_pickle", 8, "8 Sea Pickles"),
  P("common", "minecraft:prismarine_shard", 16, "16 Prismarine Shards"),
  P("common", "minecraft:ink_sac", 8, "8 Ink Sacs"),
  P("common", "minecraft:lapis_lazuli", 16, "16 Lapis Lazuli"),

  P("uncommon", IDS.gold, 2, "2 Gold Pirate Doubloons", 2),
  P("uncommon", "minecraft:emerald", 10, "10 Emeralds"),
  P("uncommon", "minecraft:gold_ingot", 16, "16 Gold Ingots"),
  P("uncommon", "minecraft:prismarine_crystals", 12, "12 Prismarine Crystals"),
  P("uncommon", "minecraft:sea_lantern", 6, "6 Sea Lanterns"),
  P("uncommon", "minecraft:experience_bottle", 12, "12 XP Bottles"),
  P("uncommon", "minecraft:ender_pearl", 4, "4 Ender Pearls"),
  P("uncommon", "minecraft:golden_apple", 2, "2 Golden Apples"),
  P("uncommon", "minecraft:name_tag", 2, "2 Name Tags"),
  P("uncommon", "minecraft:obsidian", 6, "6 Obsidian"),
  P("uncommon", "minecraft:spyglass", 1, "Spyglass"),
  P("uncommon", "minecraft:firework_rocket", 16, "16 Firework Rockets"),

  P("rare", "minecraft:diamond", 3, "3 Diamonds"),
  P("rare", IDS.gold, 5, "5 Gold Pirate Doubloons", 2),
  P("rare", "minecraft:emerald_block", 2, "2 Emerald Blocks"),
  P("rare", "minecraft:totem_of_undying", 1, "Totem of Undying"),
  P("rare", "minecraft:nautilus_shell", 1, "Nautilus Shell"),
  P("rare", "minecraft:saddle", 1, "Saddle"),
  P("rare", "minecraft:netherite_scrap", 3, "3 Netherite Scrap"),
  P("rare", "minecraft:turtle_helmet", 1, "Turtle Shell Helmet"),
  P("rare", "minecraft:diamond_pickaxe", 1, "Diamond Pickaxe"),
  P("rare", "minecraft:diamond_sword", 1, "Diamond Sword"),

  P("epic", IDS.cursed, 1, "Cursed Captain's Coin", 2),
  P("epic", "minecraft:diamond_block", 2, "2 Diamond Blocks"),
  P("epic", "minecraft:ancient_debris", 4, "4 Ancient Debris"),
  P("epic", "minecraft:heart_of_the_sea", 1, "Heart of the Sea"),
  P("epic", "minecraft:netherite_ingot", 1, "Netherite Ingot"),
  P("epic", "minecraft:trident", 1, "Trident"),
  P("epic", "minecraft:enchanted_golden_apple", 1, "Enchanted Golden Apple"),
  P("epic", "minecraft:diamond_horse_armor", 1, "Diamond Horse Armor"),
  P("epic", "minecraft:conduit", 1, "Conduit"),
  P("epic", "minecraft:netherite_axe", 1, "Netherite Axe"),

  P("legendary", IDS.cursed, 5, "5 Cursed Captain's Coins", 2),
  P("legendary", "minecraft:beacon", 1, "Beacon"),
  P("legendary", "minecraft:elytra", 1, "Elytra"),
  P("legendary", "minecraft:nether_star", 1, "Nether Star"),
  P("legendary", "minecraft:netherite_sword", 1, "Netherite Sword"),
  P("legendary", "minecraft:netherite_ingot", 4, "4 Netherite Ingots"),
  P("legendary", "minecraft:dragon_egg", 1, "Dragon Egg"),
  P("legendary", "minecraft:enchanted_golden_apple", 3, "3 Enchanted Golden Apples")
];

export const CRATES = [
  {
    key: "buccaneer",
    label: "Mystery Buccaneer Crate",
    price: 30,
    priceText: "3 Gold Doubloons",
    icon: COIN_ICON[IDS.gold],
    tiers: { common: 50, uncommon: 30, rare: 14, epic: 5, legendary: 1 }
  },
  {
    key: "cursed",
    label: "Cursed Captain's Crate",
    price: 100,
    priceText: "1 Cursed Captain's Coin",
    icon: COIN_ICON[IDS.cursed],
    tiers: { common: 0, uncommon: 25, rare: 45, epic: 22, legendary: 8 }
  }
];

export function crateOdds(crate) {
  const weights = {};
  for (const p of PRIZES) weights[p.tier] = (weights[p.tier] ?? 0) + p.w;
  const active = PRIZES.filter((p) => (crate.tiers[p.tier] ?? 0) > 0);
  const tierTotal = Object.keys(crate.tiers).reduce((s, k) => s + crate.tiers[k], 0);
  return active.map((p) => ({ prize: p, chance: ((crate.tiers[p.tier] / tierTotal) * 100 * p.w) / weights[p.tier] }));
}

export const poolOf = (crate) => crateOdds(crate).map((o) => o.prize);

export const BOUNTY_POOL = [
  { title: "Drowned Hunter", text: "Defeat 10 Drowned", kind: "kill", targets: ["minecraft:drowned"], goal: 10, reward: 3 },
  { title: "Deep Sea Angler", text: "Reel in 8 catches while fishing", kind: "fish", targets: [], goal: 8, reward: 2 },
  { title: "Treasure Seeker", text: "Open 1 shipwreck or buried treasure chest", kind: "chest", targets: [], goal: 1, reward: 3 },
  { title: "Monument Raider", text: "Defeat 4 Guardians", kind: "kill", targets: ["minecraft:guardian", "minecraft:elder_guardian"], goal: 4, reward: 4 },
  { title: "Raider Slayer", text: "Defeat 6 Pillagers", kind: "kill", targets: ["minecraft:pillager"], goal: 6, reward: 3 },
  { title: "Beast Breaker", text: "Defeat 1 Ravager", kind: "kill", targets: ["minecraft:ravager"], goal: 1, reward: 5 },
  { title: "Tide Reaper", text: "Defeat 20 Drowned", kind: "kill", targets: ["minecraft:drowned"], goal: 20, reward: 5 },
  { title: "Dread Captain Duel", text: "Defeat the Wither", kind: "kill", targets: ["minecraft:wither"], goal: 1, reward: 20 }
];
