export const VANILLA_KEY = "vanilla";
export const PAINTED_DOOR_ID = "aln:painted_door";

export const PALETTE = [
  { key: "oak_planks", item: "minecraft:oak_planks", name: "Oak Planks", icon: "textures/blocks/planks_oak" },
  { key: "spruce_planks", item: "minecraft:spruce_planks", name: "Spruce Planks", icon: "textures/blocks/planks_spruce" },
  { key: "birch_planks", item: "minecraft:birch_planks", name: "Birch Planks", icon: "textures/blocks/planks_birch" },
  { key: "dark_oak_planks", item: "minecraft:dark_oak_planks", name: "Dark Oak Planks", icon: "textures/blocks/planks_big_oak" },
  { key: "stone", item: "minecraft:stone", name: "Stone", icon: "textures/blocks/stone" },
  { key: "cobblestone", item: "minecraft:cobblestone", name: "Cobblestone", icon: "textures/blocks/cobblestone" },
  { key: "stone_bricks", item: "minecraft:stone_bricks", name: "Stone Bricks", icon: "textures/blocks/stonebrick" },
  { key: "bricks", item: "minecraft:brick_block", name: "Bricks", icon: "textures/blocks/brick" },
  { key: "sandstone", item: "minecraft:sandstone", name: "Sandstone", icon: "textures/blocks/sandstone_normal" },
  { key: "dirt", item: "minecraft:dirt", name: "Dirt", icon: "textures/blocks/dirt" },
  { key: "iron_block", item: "minecraft:iron_block", name: "Block of Iron", icon: "textures/blocks/iron_block" },
  { key: "quartz_block", item: "minecraft:quartz_block", name: "Block of Quartz", icon: "textures/blocks/quartz_block_side" },
  { key: "netherrack", item: "minecraft:netherrack", name: "Netherrack", icon: "textures/blocks/netherrack" },
  { key: "white_wool", item: "minecraft:white_wool", name: "White Wool", icon: "textures/blocks/wool_colored_white" },
  { key: "coal_block", item: "minecraft:coal_block", name: "Block of Coal", icon: "textures/blocks/coal_block" },
];

const BY_ITEM = new Map(PALETTE.map((entry) => [entry.item, entry]));
const BY_KEY = new Map(PALETTE.map((entry) => [entry.key, entry]));

export function paletteByItem(typeId) {
  return BY_ITEM.get(typeId);
}

export function paletteByKey(key) {
  return BY_KEY.get(key);
}

export function keyForName(name) {
  for (const entry of PALETTE) {
    if (entry.name === name) {
      return entry.key;
    }
  }
  return VANILLA_KEY;
}

export function nameForKey(key) {
  const entry = BY_KEY.get(key);
  return entry ? entry.name : "Vanilla";
}

export function isDoorItem(typeId) {
  return typeof typeId === "string" && typeId.startsWith("minecraft:") && typeId.endsWith("_door");
}

export function doorKind(typeId) {
  return typeId.includes("iron") || typeId.includes("copper") ? "iron" : "wood";
}

export function prettyName(typeId) {
  const raw = typeId.includes(":") ? typeId.split(":")[1] : typeId;
  return raw.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export function itemLabel(typeId) {
  const entry = BY_ITEM.get(typeId);
  return entry ? entry.name : prettyName(typeId);
}

export function iconForItem(typeId) {
  const entry = BY_ITEM.get(typeId);
  if (entry) {
    return entry.icon;
  }
  if (isDoorItem(typeId)) {
    return doorKind(typeId) === "iron" ? "textures/items/door_iron" : "textures/items/door_wood";
  }
  return undefined;
}
