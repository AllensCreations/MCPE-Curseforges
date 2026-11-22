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

export const KEYS = {
  vault: "aln_pt:vault",
  bounties: "aln_pt:bounties",
  kept: "aln_pt:kept",
  chests: "aln_pt:chests"
};

export const TITLE = "§l§6@ALNStudios §ePirate Ledger§r §f(v1.0.0)";

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
  { key: "compass", label: "Treasure Hunter's Compass", price: 80, icon: "textures/items/compass_item", note: "Use it to locate buried treasure. Sneak and use it to locate shipwrecks." },
  { key: "cutlass", label: "Sea-Dog's Cutlass", price: 200, icon: "textures/items/iron_sword", note: "Speed while swimming and extra token drops." },
  { key: "breeze", label: "Bottled Sea Breeze", price: 40, icon: "textures/items/bottle_empty", note: "Dolphin's Grace and Water Breathing for 5 minutes." },
  { key: "prismarine", label: "Prismarine Mason Bundle", price: 60, icon: "textures/items/prismarine_shard", note: "32 Prismarine, 16 Prismarine Bricks, 8 Sea Lanterns." },
  { key: "shipwright", label: "Shipwright Bundle", price: 50, icon: "textures/items/boat", note: "64 Dark Oak Planks, 32 Dark Oak Logs, 16 Iron Nuggets." },
  { key: "treasure", label: "Treasure Hoarder Bundle", price: 120, icon: "textures/items/gold_ingot", note: "4 Chests, 2 Gold Blocks, 8 Emeralds." }
];

export const CRATES = [
  {
    key: "buccaneer",
    label: "Mystery Buccaneer Crate",
    price: 30,
    priceText: "3 Gold Doubloons",
    icon: "textures/items/aln_gold_doubloon",
    pool: [
      { w: 30, id: IDS.silver, amount: 12, label: "12 Silver Pirate Tokens" },
      { w: 18, id: IDS.gold, amount: 2, label: "2 Gold Pirate Doubloons" },
      { w: 16, id: "minecraft:emerald", amount: 10, label: "10 Emeralds" },
      { w: 10, id: "minecraft:diamond", amount: 2, label: "2 Diamonds" },
      { w: 10, id: "minecraft:gold_ingot", amount: 16, label: "16 Gold Ingots" },
      { w: 6, id: "minecraft:ender_pearl", amount: 4, label: "4 Ender Pearls" },
      { w: 5, id: "minecraft:golden_apple", amount: 2, label: "2 Golden Apples" },
      { w: 3, id: "minecraft:nautilus_shell", amount: 1, label: "Nautilus Shell", jackpot: true },
      { w: 2, id: "minecraft:heart_of_the_sea", amount: 1, label: "Heart of the Sea", jackpot: true },
      { w: 2, id: "minecraft:netherite_scrap", amount: 2, label: "2 Netherite Scrap", jackpot: true },
      { w: 1, id: "minecraft:enchanted_golden_apple", amount: 1, label: "Enchanted Golden Apple", jackpot: true }
    ]
  },
  {
    key: "cursed",
    label: "Cursed Captain's Crate",
    price: 100,
    priceText: "1 Cursed Captain's Coin",
    icon: "textures/items/aln_cursed_coin",
    pool: [
      { w: 25, id: IDS.gold, amount: 6, label: "6 Gold Pirate Doubloons" },
      { w: 20, id: "minecraft:diamond", amount: 6, label: "6 Diamonds" },
      { w: 10, id: IDS.cursed, amount: 1, label: "Cursed Captain's Coin" },
      { w: 10, id: "minecraft:totem_of_undying", amount: 1, label: "Totem of Undying" },
      { w: 8, id: "minecraft:netherite_ingot", amount: 1, label: "Netherite Ingot", jackpot: true },
      { w: 8, id: "minecraft:enchanted_golden_apple", amount: 2, label: "2 Enchanted Golden Apples", jackpot: true },
      { w: 8, id: "minecraft:heart_of_the_sea", amount: 1, label: "Heart of the Sea", jackpot: true },
      { w: 6, id: "minecraft:trident", amount: 1, label: "Trident", jackpot: true },
      { w: 3, id: "minecraft:beacon", amount: 1, label: "Beacon", jackpot: true },
      { w: 2, id: "minecraft:elytra", amount: 1, label: "Elytra", jackpot: true }
    ]
  }
];

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
