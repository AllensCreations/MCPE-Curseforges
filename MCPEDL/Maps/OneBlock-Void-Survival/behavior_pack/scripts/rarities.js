// 20 Rarity Tiers and their exact percentage distribution (totaling 100%)
export const RARITY_TIERS = [
  { name: "Common", weight: 35.00, color: "§f", currency: "minecraft:iron_ingot", costMin: 4, costMax: 10 },
  { name: "Plentiful", weight: 20.00, color: "§7", currency: "minecraft:iron_ingot", costMin: 8, costMax: 16 },
  { name: "Standard", weight: 15.00, color: "§a", currency: "minecraft:iron_ingot", costMin: 12, costMax: 24 },
  { name: "Typical", weight: 10.00, color: "§2", currency: "minecraft:gold_ingot", costMin: 4, costMax: 8 },
  { name: "Sub-Uncommon", weight: 6.00, color: "§b", currency: "minecraft:gold_ingot", costMin: 6, costMax: 12 },
  { name: "Uncommon", weight: 4.00, color: "§3", currency: "minecraft:gold_ingot", costMin: 10, costMax: 18 },
  { name: "Refined", weight: 3.00, color: "§9", currency: "minecraft:gold_ingot", costMin: 14, costMax: 24 },
  { name: "Distinct", weight: 2.00, color: "§1", currency: "minecraft:diamond", costMin: 1, costMax: 2 },
  { name: "Scarce", weight: 1.50, color: "§d", currency: "minecraft:diamond", costMin: 2, costMax: 3 },
  { name: "Rare", weight: 1.00, color: "§5", currency: "minecraft:diamond", costMin: 3, costMax: 4 },
  { name: "Elite", weight: 0.80, color: "§6", currency: "minecraft:diamond", costMin: 4, costMax: 5 },
  { name: "Superior", weight: 0.60, color: "§g", currency: "minecraft:diamond", costMin: 5, costMax: 6 },
  { name: "Exceptional", weight: 0.45, color: "§e", currency: "minecraft:diamond", costMin: 6, costMax: 8 },
  { name: "Pristine", weight: 0.30, color: "§u", currency: "minecraft:diamond", costMin: 8, costMax: 10 },
  { name: "Exotic", weight: 0.15, color: "§c", currency: "minecraft:diamond", costMin: 10, costMax: 14 },
  { name: "Heroic", weight: 0.10, color: "§4", currency: "minecraft:diamond", costMin: 14, costMax: 18 },
  { name: "Epic", weight: 0.05, color: "§d§l", currency: "minecraft:diamond", costMin: 18, costMax: 24 },
  { name: "Legendary", weight: 0.03, color: "§6§l", currency: "minecraft:diamond", costMin: 24, costMax: 32 },
  { name: "Fabled", weight: 0.015, color: "§b§l", currency: "minecraft:netherite_ingot", costMin: 1, costMax: 2 },
  { name: "Mythic", weight: 0.005, color: "§e§l", currency: "minecraft:netherite_ingot", costMin: 3, costMax: 4 }
];

// Dimension Item Pools mapped to tier index (0 to 19)
export const DIMENSION_TRADE_POOLS = {
  overworld: [
    { id: "minecraft:bread", count: 8 },                       // 0: Common
    { id: "minecraft:torch", count: 16 },                      // 1: Plentiful
    { id: "minecraft:arrow", count: 16 },                      // 2: Standard
    { id: "minecraft:cooked_beef", count: 8 },                 // 3: Typical
    { id: "minecraft:iron_pickaxe", count: 1 },                // 4: Sub-Uncommon
    { id: "minecraft:shears", count: 1 },                      // 5: Uncommon
    { id: "minecraft:water_bucket", count: 1 },                // 6: Refined
    { id: "minecraft:lava_bucket", count: 1 },                 // 7: Distinct
    { id: "minecraft:saddle", count: 1 },                      // 8: Scarce
    { id: "minecraft:name_tag", count: 2 },                    // 9: Rare
    { id: "minecraft:sponge", count: 2 },                      // 10: Elite
    { id: "minecraft:amethyst_cluster", count: 4 },            // 11: Superior
    { id: "minecraft:golden_apple", count: 2 },                // 12: Exceptional
    { id: "minecraft:heart_of_the_sea", count: 1 },            // 13: Pristine
    { id: "minecraft:nautilus_shell", count: 4 },              // 14: Exotic
    { id: "minecraft:totem_of_undying", count: 1 },            // 15: Heroic
    { id: "minecraft:nether_star", count: 1 },                 // 16: Epic
    { id: "minecraft:enchanted_golden_apple", count: 1 },      // 17: Legendary
    { id: "minecraft:elytra", count: 1 },                      // 18: Fabled
    { id: "minecraft:dragon_egg", count: 1 }                   // 19: Mythic
  ],
  nether: [
    { id: "minecraft:cooked_porkchop", count: 8 },             // 0: Common
    { id: "minecraft:fire_charge", count: 6 },                 // 1: Plentiful
    { id: "minecraft:soul_torch", count: 16 },                 // 2: Standard
    { id: "minecraft:quartz", count: 16 },                     // 3: Typical
    { id: "minecraft:magma_cream", count: 4 },                 // 4: Sub-Uncommon
    { id: "minecraft:golden_carrot", count: 8 },               // 5: Uncommon
    { id: "minecraft:glowstone", count: 8 },                   // 6: Refined
    { id: "minecraft:ghast_tear", count: 2 },                  // 7: Distinct
    { id: "minecraft:blaze_rod", count: 4 },                   // 8: Scarce
    { id: "minecraft:nether_wart", count: 8 },                 // 9: Rare
    { id: "minecraft:blaze_powder", count: 4 },                      // 10: Elite
    { id: "minecraft:wither_skeleton_skull", count: 1 },       // 11: Superior
    { id: "minecraft:crying_obsidian", count: 6 },             // 12: Exceptional
    { id: "minecraft:ancient_debris", count: 2 },              // 13: Pristine
    { id: "minecraft:respawn_anchor", count: 1 },              // 14: Exotic
    { id: "minecraft:totem_of_undying", count: 1 },            // 15: Heroic
    { id: "minecraft:netherite_upgrade_smithing_template", count: 1 }, // 16: Epic
    { id: "minecraft:enchanted_golden_apple", count: 1 },      // 17: Legendary
    { id: "minecraft:nether_star", count: 1 },                 // 18: Fabled
    { id: "minecraft:beacon", count: 1 }              // 19: Mythic
  ],
  end: [
    { id: "minecraft:chorus_fruit", count: 12 },               // 0: Common
    { id: "minecraft:arrow", count: 24 },                      // 1: Plentiful
    { id: "minecraft:end_rod", count: 6 },                     // 2: Standard
    { id: "minecraft:ender_pearl", count: 8 },                 // 3: Typical
    { id: "minecraft:golden_apple", count: 2 },                // 4: Sub-Uncommon
    { id: "minecraft:experience_bottle", count: 16 },          // 5: Uncommon
    { id: "minecraft:phantom_membrane", count: 4 },            // 6: Refined
    { id: "minecraft:ender_chest", count: 1 },                 // 7: Distinct
    { id: "minecraft:shulker_shell", count: 2 },               // 8: Scarce
    { id: "minecraft:enchanting_table", count: 1 },               // 9: Rare
    { id: "minecraft:end_crystal", count: 2 },                 // 10: Elite
    { id: "minecraft:dragon_breath", count: 4 },               // 11: Superior
    { id: "minecraft:undyed_shulker_box", count: 1 },          // 12: Exceptional
    { id: "minecraft:totem_of_undying", count: 1 },            // 13: Pristine
    { id: "minecraft:nether_star", count: 1 },                 // 14: Exotic
    { id: "minecraft:dragon_head", count: 1 },                 // 15: Heroic
    { id: "minecraft:enchanted_golden_apple", count: 2 },      // 16: Epic
    { id: "minecraft:elytra", count: 1 },                      // 17: Legendary
    { id: "minecraft:elytra", count: 2 },                      // 18: Fabled
    { id: "minecraft:dragon_egg", count: 1 }                   // 19: Mythic
  ]
};
