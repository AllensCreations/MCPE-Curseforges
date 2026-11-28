export const VANILLA_KEY = "vanilla";
export const PAINTED_DOOR_ID = "aln:painted_door";

export const PALETTE = [
  { key: "oak_planks", item: "minecraft:oak_planks", name: "Oak Planks" },
  { key: "spruce_planks", item: "minecraft:spruce_planks", name: "Spruce Planks" },
  { key: "birch_planks", item: "minecraft:birch_planks", name: "Birch Planks" },
  { key: "dark_oak_planks", item: "minecraft:dark_oak_planks", name: "Dark Oak Planks" },
  { key: "stone", item: "minecraft:stone", name: "Stone" },
  { key: "cobblestone", item: "minecraft:cobblestone", name: "Cobblestone" },
  { key: "stone_bricks", item: "minecraft:stone_bricks", name: "Stone Bricks" },
  { key: "bricks", item: "minecraft:brick_block", name: "Bricks" },
  { key: "sandstone", item: "minecraft:sandstone", name: "Sandstone" },
  { key: "dirt", item: "minecraft:dirt", name: "Dirt" },
  { key: "iron_block", item: "minecraft:iron_block", name: "Block of Iron" },
  { key: "quartz_block", item: "minecraft:quartz_block", name: "Block of Quartz" },
  { key: "netherrack", item: "minecraft:netherrack", name: "Netherrack" },
  { key: "white_wool", item: "minecraft:white_wool", name: "White Wool" },
  { key: "coal_block", item: "minecraft:coal_block", name: "Block of Coal" },
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
