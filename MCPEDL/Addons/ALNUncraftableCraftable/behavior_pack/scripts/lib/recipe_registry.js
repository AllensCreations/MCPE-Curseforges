export const RECIPES = [
  {
    id: "elytra",
    name: "Elytra",
    output: { type: "minecraft:elytra", count: 1 },
    inputs: [
      { type: "minecraft:phantom_membrane", count: 8, name: "Phantom Membrane" },
      { type: "minecraft:shulker_shell", count: 2, name: "Shulker Shell" },
      { type: "minecraft:nether_star", count: 1, name: "Nether Star" },
      { type: "aln:phantom_core", count: 1, name: "Phantom Core" },
    ],
  },
  {
    id: "totem_of_undying",
    name: "Totem of Undying",
    output: { type: "minecraft:totem_of_undying", count: 1 },
    inputs: [
      { type: "minecraft:nether_star", count: 1, name: "Nether Star" },
      { type: "minecraft:emerald_block", count: 4, name: "Emerald Block" },
      { type: "aln:dragon_essence", count: 1, name: "Dragon Essence" },
    ],
  },
  {
    id: "nether_star",
    name: "Nether Star",
    output: { type: "minecraft:nether_star", count: 1 },
    inputs: [
      { type: "minecraft:wither_skeleton_skull", count: 3, name: "Wither Skeleton Skull" },
      { type: "minecraft:soul_sand", count: 4, name: "Soul Sand" },
      { type: "aln:void_shard", count: 1, name: "Void Shard" },
    ],
  },
  {
    id: "trident",
    name: "Trident",
    output: { type: "minecraft:trident", count: 1 },
    inputs: [
      { type: "minecraft:heart_of_the_sea", count: 1, name: "Heart of the Sea" },
      { type: "minecraft:prismarine_shard", count: 4, name: "Prismarine Shard" },
      { type: "minecraft:nautilus_shell", count: 1, name: "Nautilus Shell" },
      { type: "aln:void_shard", count: 1, name: "Void Shard" },
    ],
  },
  {
    id: "dragon_head",
    name: "Dragon Head",
    output: { type: "minecraft:dragon_head", count: 1 },
    inputs: [
      { type: "minecraft:netherite_ingot", count: 1, name: "Netherite Ingot" },
      { type: "aln:dragon_essence", count: 1, name: "Dragon Essence" },
      { type: "aln:void_shard", count: 2, name: "Void Shard" },
      { type: "minecraft:skeleton_skull", count: 1, name: "Skeleton Skull" },
    ],
  },
];

export function getRecipe(id) {
  return RECIPES.find((recipe) => recipe.id === id);
}
