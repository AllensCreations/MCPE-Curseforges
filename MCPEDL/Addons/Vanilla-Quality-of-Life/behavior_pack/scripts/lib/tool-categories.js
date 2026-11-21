import { normalizeId } from "./utils.js";

export const ToolCategory = {
  PICKAXE: "pickaxe",
  AXE: "axe",
  SHOVEL: "shovel",
  LEAVES: "leaves",
  WEB: "web",
  SHEARS_OR_SWORD: "shears_or_sword",
  HOE: "hoe",
  WEAPON: "weapon",
  SILK: "silk",
};

export const IGNORED_BLOCKS = new Set([
  "air", "cave_air", "void_air", "water", "flowing_water", "lava", "flowing_lava",
  "bedrock", "barrier", "structure_void", "light_block", "portal", "end_portal",
  "end_portal_frame", "end_gateway",
  "redstone_torch", "unlit_redstone_torch", "redstone_wire",
]);

export function getRequiredToolCategory(typeId) {
  if (!typeId) return null;
  const id = normalizeId(typeId);
  if (IGNORED_BLOCKS.has(id)) return null;

  if (
    id === "glass" || id === "glass_pane" || id === "tinted_glass" ||
    id === "stained_glass" || id === "stained_glass_pane" ||
    id.endsWith("_stained_glass") || id.endsWith("_stained_glass_pane") ||
    id === "ice" || id === "packed_ice" || id === "blue_ice"
  ) {
    return ToolCategory.SILK;
  }

  if (id === "web" || id.includes("cobweb")) return ToolCategory.WEB;
  if (id.includes("mangrove_roots")) return ToolCategory.AXE;

  if (id.includes("sandstone") || id.includes("mud_brick") || id === "packed_mud") return ToolCategory.PICKAXE;

  if (
    id.endsWith("concrete_powder") || id.includes("sand") || id.includes("gravel") ||
    id.includes("clay") || id.includes("dirt") || id === "grass_block" ||
    id.includes("podzol") || id.includes("mycelium") || id.includes("farmland") ||
    id.includes("mud") || id.includes("soul_soil") || id.includes("snow")
  ) {
    return ToolCategory.SHOVEL;
  }

  if (id === "ender_chest") return ToolCategory.PICKAXE;
  if (id.includes("leaves")) return ToolCategory.LEAVES;

  if (
    id.includes("wool") || id.includes("vine") || id.includes("fern") ||
    id === "tallgrass" || id === "short_grass" || id === "tall_grass" || id === "seagrass" || id === "hanging_roots" ||
    id === "deadbush" || id === "tripwire"
  ) {
    return ToolCategory.SHEARS_OR_SWORD;
  }

  if (
    id === "hay_block" || id === "target" || id === "sponge" || id === "wet_sponge" ||
    id.includes("sculk") || id.includes("moss_block") || id.includes("moss_carpet") ||
    id.includes("wart_block") || id === "shroomlight" || id === "dried_kelp_block"
  ) {
    return ToolCategory.HOE;
  }

  if (
    id.endsWith("_log") || id.endsWith("_wood") || id.endsWith("_stem") || id.endsWith("_hyphae") ||
    id.startsWith("stripped_") || id.includes("planks") || id.includes("crafting_table") ||
    id.includes("cartography_table") || id.includes("fletching_table") || id.includes("smithing_table") ||
    id.includes("loom") || id.includes("composter") || id === "chest" || id === "trapped_chest" ||
    id === "barrel" || id.includes("bookshelf") || id === "lectern" || id.includes("pumpkin") ||
    id.includes("melon") || id === "cocoa" || id.includes("beehive") || id === "bee_nest" ||
    id.includes("ladder") || id.includes("sign") || id.includes("mushroom_stem") ||
    id.includes("mushroom_block") || id === "jukebox" || id === "daylight_detector" ||
    id === "note_block" || id === "creaking_heart" || id === "cactus" ||
    id.includes("bamboo_block") || id.includes("bamboo_mosaic") ||
    (id.endsWith("_fence") && !id.includes("nether_brick")) || id.endsWith("_fence_gate")
  ) {
    return ToolCategory.AXE;
  }

  const woodMaterials = [
    "oak", "spruce", "birch", "jungle", "acacia", "dark_oak",
    "mangrove", "cherry", "bamboo", "crimson", "warped", "pale_oak",
  ];
  if (
    woodMaterials.some((mat) => id.includes(mat)) && !id.includes("petrified") &&
    (id.endsWith("_door") || id.endsWith("_trapdoor") || id.endsWith("_button") ||
     id.endsWith("_pressure_plate") || id.endsWith("_stairs") || id.endsWith("_slab"))
  ) {
    return ToolCategory.AXE;
  }

  if (
    id.includes("stone") || id.includes("cobble") || id.includes("deepslate") ||
    id.includes("ore") || id.includes("granite") || id.includes("diorite") ||
    id.includes("andesite") || id.includes("tuff") || id.includes("calcite") ||
    id.includes("basalt") || id.includes("blackstone") || id.includes("obsidian") ||
    id.includes("ancient_debris") || id.includes("brick") || id.includes("terracotta") ||
    (id.includes("concrete") && !id.endsWith("concrete_powder")) || id.includes("sandstone") ||
    id.includes("prismarine") || id.includes("netherrack") || id.includes("end_stone") ||
    id.includes("purpur") || id.includes("magma") || id.includes("copper") ||
    id.includes("iron") || id.includes("gold") || id.includes("diamond") ||
    id.includes("emerald") || id.includes("lapis") || id.includes("redstone") ||
    id.includes("netherite") || id.includes("amethyst") || id.includes("dripstone") ||
    id.includes("furnace") || id.includes("smoker") || id.includes("hopper") ||
    id.includes("dispenser") || id.includes("dropper") || id.includes("cauldron") ||
    id.includes("anvil") || id.includes("enchanting_table") || id.includes("brewing_stand") ||
    id.includes("grindstone") || id.includes("stonecutter") || id.includes("bell") ||
    id.includes("lantern") || id.includes("chain") || id.includes("spawner") ||
    id.includes("vault") || id.includes("crafter") || id.includes("quartz") ||
    id === "coal_block" || id === "bone_block" || id === "respawn_anchor" ||
    id === "conduit" || id === "lightning_rod" ||
    id === "piston" || id === "sticky_piston" || id === "observer"
  ) {
    return ToolCategory.PICKAXE;
  }

  return null;
}
