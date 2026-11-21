export const CATEGORIES = ["All Items", "Ores & Resources", "Tools & Weapons", "Armor", "Food", "Blocks", "Other"];
export const SORTS = ["Newest First", "Oldest First", "Item A-Z", "Seller A-Z"];

export const POPULAR_PAYMENTS = [
    "minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot", "minecraft:iron_ingot",
    "minecraft:netherite_ingot", "minecraft:copper_ingot", "minecraft:lapis_lazuli",
    "minecraft:redstone", "minecraft:coal",
];

const shortName = (typeId) => typeId.replace(/^[^:]*:/, "");

const ITEM_ICONS = {};
const addIcon = (id, texture = id) => { ITEM_ICONS[id] = texture; };

["diamond", "emerald", "iron_ingot", "gold_ingot", "netherite_ingot", "copper_ingot", "coal", "charcoal",
 "apple", "bread", "carrot", "potato", "baked_potato", "beetroot", "cookie", "stick", "string", "feather",
 "bone", "leather", "flint", "gunpowder", "blaze_rod", "blaze_powder", "slime_ball", "ender_pearl",
 "ender_eye", "quartz", "amethyst_shard", "netherite_scrap", "raw_iron", "raw_gold", "raw_copper",
 "glowstone_dust", "clay_ball", "brick", "paper", "arrow", "shears", "flint_and_steel", "bucket", "sugar",
 "egg", "wheat", "snowball", "nether_star", "pumpkin_pie", "mushroom_stew", "dried_kelp", "spider_eye",
 "rotten_flesh", "name_tag", "trident", "elytra", "saddle", "lead"].forEach((n) => addIcon(n));

const ALIASES = {
    redstone: "redstone_dust", book: "book_normal", beef: "beef_raw", cooked_beef: "beef_cooked",
    porkchop: "porkchop_raw", cooked_porkchop: "porkchop_cooked", chicken: "chicken_raw",
    cooked_chicken: "chicken_cooked", mutton: "mutton_raw", cooked_mutton: "mutton_cooked",
    rabbit: "rabbit_raw", cooked_rabbit: "rabbit_cooked", cod: "fish_raw", cooked_cod: "fish_cooked",
    salmon: "fish_salmon_raw", cooked_salmon: "fish_salmon_cooked", golden_apple: "apple_golden",
    golden_carrot: "carrot_golden", melon_slice: "melon", water_bucket: "bucket_water",
    lava_bucket: "bucket_lava", milk_bucket: "bucket_milk", bow: "bow_standby", totem_of_undying: "totem",
};
for (const [id, tex] of Object.entries(ALIASES)) addIcon(id, tex);

const TOOL_TIERS = { wooden: "wood", stone: "stone", iron: "iron", golden: "gold", diamond: "diamond", netherite: "netherite" };
for (const [tier, tex] of Object.entries(TOOL_TIERS)) {
    for (const kind of ["sword", "pickaxe", "axe", "shovel", "hoe"]) addIcon(`${tier}_${kind}`, `${tex}_${kind}`);
}
const ARMOR_TIERS = { leather: "leather", chainmail: "chainmail", iron: "iron", golden: "gold", diamond: "diamond", netherite: "netherite" };
for (const [tier, tex] of Object.entries(ARMOR_TIERS)) {
    for (const piece of ["helmet", "chestplate", "leggings", "boots"]) addIcon(`${tier}_${piece}`, `${tex}_${piece}`);
}

const BLOCK_ICONS = {
    stone: "stone", cobblestone: "cobblestone", dirt: "dirt", sand: "sand", gravel: "gravel",
    glass: "glass", obsidian: "obsidian", netherrack: "netherrack", bedrock: "bedrock",
    diamond_block: "diamond_block", emerald_block: "emerald_block", gold_block: "gold_block",
    iron_block: "iron_block", coal_block: "coal_block", lapis_block: "lapis_block",
    redstone_block: "redstone_block", oak_planks: "planks_oak", oak_log: "log_oak",
    spruce_planks: "planks_spruce", spruce_log: "log_spruce", birch_planks: "planks_birch",
    birch_log: "log_birch", diamond_ore: "diamond_ore", emerald_ore: "emerald_ore",
    gold_ore: "gold_ore", iron_ore: "iron_ore", coal_ore: "coal_ore",
};

export function iconFor(typeId) {
    if (!typeId.startsWith("minecraft:")) return undefined;
    const n = shortName(typeId);
    if (BLOCK_ICONS[n]) return `textures/blocks/${BLOCK_ICONS[n]}`;
    if (ITEM_ICONS[n]) return `textures/items/${ITEM_ICONS[n]}`;
    return undefined;
}

const TOOLS = /(_sword|_pickaxe|_axe|_shovel|_hoe)$|^(bow|crossbow|trident|shears|fishing_rod|mace|flint_and_steel|shield|spyglass|brush)$/;
const ARMOR = /(_helmet|_chestplate|_leggings|_boots)$|^elytra$/;
const FOOD = /^(apple|golden_apple|enchanted_golden_apple|bread|beef|cooked_beef|porkchop|cooked_porkchop|mutton|cooked_mutton|chicken|cooked_chicken|rabbit|cooked_rabbit|cod|cooked_cod|salmon|cooked_salmon|carrot|golden_carrot|potato|baked_potato|beetroot|melon_slice|cookie|cake|pumpkin_pie|mushroom_stew|rabbit_stew|beetroot_soup|sweet_berries|glow_berries|honey_bottle|dried_kelp|chorus_fruit)$/;
const RESOURCE = /(ingot|nugget|_ore$|lapis|quartz|amethyst_shard|netherite_scrap|blaze_rod|ender_pearl|gunpowder|glowstone_dust|slime_ball)|^(raw_.*|diamond|emerald|coal|charcoal|redstone|string|leather|bone|flint|copper_ingot)$/;
const BLOCKISH = /(_block|_planks|_log|_wood|_slab|_stairs|_wall|_fence|_fence_gate|_door|_trapdoor|_glass|_wool|_concrete|_terracotta|_bricks?|_leaves|_sapling|_button|_pressure_plate)$|^(glass|stone|cobblestone|dirt|grass_block|sand|gravel|obsidian|netherrack|end_stone|tnt|glowstone|sea_lantern|bookshelf|chest|barrel|furnace|crafting_table)$/;

export function categoryOf(typeId) {
    const n = shortName(typeId);
    if (TOOLS.test(n)) return 2;
    if (ARMOR.test(n)) return 3;
    if (FOOD.test(n)) return 4;
    if (RESOURCE.test(n)) return 1;
    if (BLOCKISH.test(n)) return 5;
    return 6;
}

export function timeAgo(timestamp) {
    const s = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}
