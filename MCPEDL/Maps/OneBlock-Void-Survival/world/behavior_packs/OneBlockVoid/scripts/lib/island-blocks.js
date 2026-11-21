export const buildStats = { placed: 0 };

// Strictly places blocks only where air currently exists.
// Never overwrites player-placed blocks, structures, or bridges!
export function safeAirOnlySetBlock(dimension, loc, typeId) {
  try {
    const b = dimension.getBlock(loc);
    if (b && (b.isAir || b.typeId === "minecraft:air")) {
      b.setType(typeId);
      buildStats.placed++;
      return true;
    }
  } catch (e) {}
  return false;
}

// =========================================================================
// REALISTIC NATURAL FLOATING ISLAND GENERATOR
// =========================================================================
// - Authentic Geological Strata: Stone, Andesite, Diorite, Granite, Tuff, Deepslate
// - Subsoil: Dirt, Coarse Dirt, Rooted Dirt, Gravel, Clay
// - Surface: Grass Block, Podzol, Mycelium, Sand, Nylium + Wildflowers & Vegetation
// - Embedded Ore Veins: Coal, Copper, Iron, Gold, Lapis, Redstone, Diamond, Emerald
// - Scale Varieties: Huge (R~11), Big (R~8.5), Medium (R~6.5), Compact (R~5)
// - Specialized Traits: Village, Animals, Water Spring / Waterfall, Lava Spring / Cascade,
//   Ore-Rich Mine, Dungeon / Mobs, Lush Flora Tree, Ancient Shrine

export function getRockBlock(theme, dx, dz, d, seed) {
  if (theme.biome === "the_end") {
    const eh = Math.abs((dx * 31 + dz * 19 + d * 13 + seed) % 100);
    return eh < 65 ? "minecraft:end_stone" : (eh < 88 ? "minecraft:end_bricks" : "minecraft:purpur_block");
  }
  if (theme.biome.includes("nether") || theme.biome.includes("valley") || theme.biome.includes("deltas")) {
    const nh = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    if (d >= 6 && nh < 35) return "minecraft:crying_obsidian";
    if (nh < 45) return "minecraft:netherrack";
    if (nh < 75) return "minecraft:blackstone";
    if (nh < 90) return "minecraft:basalt";
    return "minecraft:polished_blackstone";
  }
  if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
    // Authentic Mojang Badlands Horizontal Terracotta Strata (7 distinct colors):
    const band = (d + Math.floor(Math.abs(dx * 0.15 + dz * 0.1))) % 7;
    if (d >= 6 && Math.abs((dx * 17 + dz * 23 + seed) % 100) < 40) return "minecraft:red_sandstone";
    if (band === 0) return "minecraft:hardened_clay";
    if (band === 1) return "minecraft:orange_terracotta";
    if (band === 2) return "minecraft:yellow_terracotta";
    if (band === 3) return "minecraft:red_sandstone";
    if (band === 4) return "minecraft:red_terracotta";
    if (band === 5) return "minecraft:brown_terracotta";
    return "minecraft:white_terracotta";
  }
  if (theme.biome === "desert") {
    const dh = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    if (d >= 6 && dh < 50) return "minecraft:hardened_clay";
    return dh < 40 ? "minecraft:sandstone" : (dh < 65 ? "minecraft:smooth_sandstone" : (dh < 85 ? "minecraft:cut_sandstone" : "minecraft:chiseled_sandstone"));
  }
  if (theme.biome.includes("ocean") || theme.biome.includes("warm_ocean")) {
    const oh = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    if (d >= 5 && oh < 40) return "minecraft:smooth_sandstone";
    return oh < 45 ? "minecraft:prismarine" : (oh < 75 ? "minecraft:dark_prismarine" : "minecraft:prismarine_bricks");
  }
  if (theme.biome.includes("ice") || theme.biome.includes("frozen")) {
    const ih = Math.abs((dx * 31 + dz * 17 + d * 7 + seed) % 100);
    return ih < 40 ? "minecraft:packed_ice" : (ih < 70 ? "minecraft:blue_ice" : (ih < 85 ? "minecraft:snow" : "minecraft:calcite"));
  }
  if (theme.id === "amethyst_geode") {
    return d <= 2 ? "minecraft:calcite" : (d <= 5 ? "minecraft:smooth_basalt" : "minecraft:tuff");
  }
  if (theme.biome === "deep_dark" || d >= 7) {
    const ddh = Math.abs((dx * 19 + dz * 29 + d * 11 + seed) % 100);
    if (ddh < 45) return "minecraft:deepslate";
    if (ddh < 75) return "minecraft:cobbled_deepslate";
    if (ddh < 90) return "minecraft:tuff";
    return "minecraft:polished_deepslate";
  }
  // Integrate biome-specific base rock at lower depths:
  if (d >= 4 && theme.base && theme.base !== "minecraft:stone") {
    const bh = Math.abs((dx * 37 + dz * 23 + d * 11 + seed) % 100);
    if (bh < 55) return theme.base;
  }
  // Realistic natural multi-rock mix (stone, andesite, diorite, granite, tuff, calcite):
  const h = Math.abs((dx * 43 + dz * 29 + d * 13 + seed) % 100);
  if (h < 35) return "minecraft:stone";
  if (h < 52) return "minecraft:andesite";
  if (h < 68) return "minecraft:diorite";
  if (h < 82) return "minecraft:granite";
  if (h < 92) return "minecraft:tuff";
  return "minecraft:calcite";
}

export function getOreBlock(theme, depth, dx, dz, seed) {
  // Badlands / Mesa: Super rich in Gold Ore, Deepslate Gold, and Raw Gold Blocks (Mojang Mesa signature!)
  if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
    const gh = Math.abs((dx * 53 + dz * 31 + depth * 17 + seed) % 100);
    if (gh < 50) return "minecraft:gold_ore";
    if (gh < 75) return "minecraft:raw_gold_block";
    return depth >= 5 ? "minecraft:deepslate_gold_ore" : "minecraft:gold_ore";
  }
  // Deepslate Forge: Ore rich in Iron, Deepslate Iron, Raw Iron Blocks & Diamonds
  if (theme.id === "deepslate_forge") {
    const fh = Math.abs((dx * 47 + dz * 37 + depth * 13 + seed) % 100);
    if (fh < 40) return "minecraft:deepslate_iron_ore";
    if (fh < 65) return "minecraft:raw_iron_block";
    if (fh < 85) return "minecraft:deepslate_diamond_ore";
    return "minecraft:deepslate_gold_ore";
  }
  // Bastion Treasury: Nether Gold, Gilded Blackstone, Ancient Debris
  if (theme.id === "bastion_treasury") {
    const bh = Math.abs((dx * 41 + dz * 29 + depth * 19 + seed) % 100);
    if (bh < 45) return "minecraft:nether_gold_ore";
    if (bh < 75) return "minecraft:gilded_blackstone";
    if (bh < 90) return "minecraft:gold_block";
    return "minecraft:ancient_debris";
  }
  // Ancient Crypt: Sandstone Crypt with Gold, Lapis, Emerald
  if (theme.id === "ancient_crypt") {
    const ch = Math.abs((dx * 43 + dz * 31 + depth * 17 + seed) % 100);
    if (ch < 45) return "minecraft:gold_ore";
    if (ch < 75) return "minecraft:lapis_ore";
    if (ch < 90) return "minecraft:raw_gold_block";
    return "minecraft:emerald_ore";
  }
  // Tuff Golem Sanctuary: Copper Ore & Raw Copper Blocks
  if (theme.id === "tuff_golem_sanctuary") {
    const th = Math.abs((dx * 37 + dz * 23 + depth * 19 + seed) % 100);
    if (th < 50) return "minecraft:copper_ore";
    if (th < 80) return "minecraft:raw_copper_block";
    return "minecraft:iron_ore";
  }

  const isNether = theme.biome.includes("nether") || theme.biome.includes("valley") || theme.biome.includes("deltas");
  if (isNether) {
    const no = Math.abs((dx * 19 + dz * 23 + seed) % 100);
    if (no < 50) return "minecraft:quartz_ore";
    if (no < 90) return "minecraft:nether_gold_ore";
    return theme.tier >= 3 ? "minecraft:ancient_debris" : "minecraft:nether_gold_ore";
  }

  const isDeep = depth >= 6 || theme.biome === "deep_dark";
  const oh = Math.abs((dx * 71 + dz * 37 + depth * 19 + seed) % 100);

  if (theme.tier === 1) {
    return oh < 55 ? "minecraft:coal_ore" : (oh < 85 ? "minecraft:copper_ore" : "minecraft:iron_ore");
  }
  if (theme.tier === 2) {
    if (isDeep) {
      return oh < 40 ? "minecraft:deepslate_iron_ore" : (oh < 70 ? "minecraft:deepslate_gold_ore" : "minecraft:deepslate_redstone_ore");
    }
    return oh < 40 ? "minecraft:iron_ore" : (oh < 65 ? "minecraft:copper_ore" : (oh < 85 ? "minecraft:lapis_ore" : "minecraft:gold_ore"));
  }
  if (theme.tier === 3) {
    if (isDeep) {
      return oh < 35 ? "minecraft:deepslate_iron_ore" : (oh < 65 ? "minecraft:deepslate_gold_ore" : (oh < 85 ? "minecraft:deepslate_redstone_ore" : "minecraft:deepslate_diamond_ore"));
    }
    return oh < 30 ? "minecraft:gold_ore" : (oh < 60 ? "minecraft:redstone_ore" : (oh < 85 ? "minecraft:lapis_ore" : "minecraft:diamond_ore"));
  }
  // Tier 4
  if (isDeep) {
    return oh < 40 ? "minecraft:deepslate_diamond_ore" : (oh < 70 ? "minecraft:deepslate_redstone_ore" : (oh < 90 ? "minecraft:deepslate_emerald_ore" : "minecraft:ancient_debris"));
  }
  return oh < 45 ? "minecraft:diamond_ore" : (oh < 75 ? "minecraft:gold_ore" : "minecraft:emerald_ore");
}

export function getSubsoilBlock(theme, dx, dz, seed) {
  const sh = Math.abs((dx * 37 + dz * 29 + seed) % 100);

  if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
    if (sh < 35) return "minecraft:hardened_clay";
    if (sh < 65) return "minecraft:red_sandstone";
    if (sh < 85) return "minecraft:orange_terracotta";
    return "minecraft:yellow_terracotta";
  }
  if (theme.floor.includes("red_sand")) {
    return sh < 50 ? "minecraft:red_sandstone" : "minecraft:smooth_red_sandstone";
  }
  if (theme.floor.includes("sand")) {
    if (sh < 45) return "minecraft:sandstone";
    if (sh < 75) return "minecraft:smooth_sandstone";
    return "minecraft:cut_sandstone";
  }
  if (theme.floor.includes("nylium") || theme.biome.includes("nether")) {
    if (sh < 45) return "minecraft:netherrack";
    if (sh < 70) return "minecraft:soul_soil";
    if (sh < 88) return "minecraft:blackstone";
    return "minecraft:soul_sand";
  }
  if (theme.floor.includes("end_stone") || theme.biome === "the_end") {
    if (sh < 60) return "minecraft:end_stone";
    if (sh < 85) return "minecraft:end_bricks";
    return "minecraft:purpur_block";
  }
  if (theme.floor.includes("tuff") || theme.biome === "deep_dark") {
    if (sh < 40) return "minecraft:tuff";
    if (sh < 70) return "minecraft:polished_tuff";
    if (sh < 88) return "minecraft:deepslate";
    return "minecraft:cobbled_deepslate";
  }
  if (theme.biome.includes("ocean") || theme.biome.includes("warm_ocean")) {
    if (sh < 45) return "minecraft:sand";
    if (sh < 70) return "minecraft:gravel";
    if (sh < 88) return "minecraft:clay";
    return "minecraft:prismarine";
  }
  if (theme.biome.includes("swamp")) {
    if (sh < 40) return "minecraft:mud";
    if (sh < 70) return "minecraft:clay";
    if (sh < 88) return "minecraft:coarse_dirt";
    return "minecraft:dirt_with_roots";
  }
  if (theme.biome.includes("ice") || theme.biome.includes("frozen")) {
    if (sh < 45) return "minecraft:packed_ice";
    if (sh < 75) return "minecraft:snow";
    return "minecraft:diorite";
  }

  // Standard organic flora & forest subsoil blend:
  if (sh < 45) return "minecraft:dirt";
  if (sh < 70) return "minecraft:coarse_dirt";
  if (sh < 85) return "minecraft:dirt_with_roots";
  if (sh < 94) return "minecraft:gravel";
  return "minecraft:mud";
}

// Ground-check validator: ensures plants and vegetation are placed strictly on valid solid ground, never on air!
export function isSolidGroundForPlant(dimension, loc, plantTypeId) {
  try {
    const ground = dimension.getBlock(loc);
    if (!ground || ground.isAir || ground.typeId === "minecraft:air") return false;
    const gType = ground.typeId;
    if (gType.includes("water") || gType.includes("lava")) return false;

    if (plantTypeId === "minecraft:deadbush" || plantTypeId === "minecraft:cactus") {
      return gType.includes("sand") || gType.includes("terracotta") || gType.includes("gravel") || gType.includes("dirt");
    }
    if (plantTypeId.includes("crimson") || plantTypeId.includes("warped")) {
      return gType.includes("nylium") || gType.includes("netherrack") || gType.includes("dirt") || gType.includes("soul");
    }
    if (plantTypeId.includes("mushroom") || plantTypeId.includes("fungus")) {
      return gType.includes("mycelium") || gType.includes("podzol") || gType.includes("nylium") || gType.includes("dirt") || gType.includes("stone");
    }
    // Grass, flowers, saplings, pink petals, sweet berries, bamboo, ferns:
    return gType.includes("grass") || gType.includes("dirt") || gType.includes("podzol") ||
           gType.includes("mycelium") || gType.includes("moss") || gType.includes("mud") ||
           gType.includes("sand") || gType.includes("clay") || gType.includes("terracotta") ||
           gType.includes("tuff");
  } catch (e) {
    return false;
  }
}

function safePlantSetBlock(dimension, groundLoc, plantLoc, plantTypeId) {
  if (!isSolidGroundForPlant(dimension, groundLoc, plantTypeId)) return false;
  return safeAirOnlySetBlock(dimension, plantLoc, plantTypeId);
}

export function getThemeFenceType(theme) {
  const d = (theme && theme.dimension) || "overworld";
  const b = (theme && theme.biome) || "";
  const id = (theme && theme.id) || "";
  if (d === "nether") {
    if (b.includes("crimson")) return "minecraft:crimson_fence";
    if (b.includes("warped")) return "minecraft:warped_fence";
    return "minecraft:nether_brick_fence";
  }
  if (d === "the_end") return "minecraft:birch_fence";
  if (b.includes("cherry") || id.includes("cherry")) return "minecraft:cherry_fence";
  if (b.includes("bamboo") || id.includes("bamboo")) return "minecraft:bamboo_fence";
  if (b.includes("mangrove") || b.includes("swamp")) return "minecraft:mangrove_fence";
  if (b.includes("birch")) return "minecraft:birch_fence";
  if (b.includes("dark_forest") || b.includes("deep_dark") || id.includes("pale")) return "minecraft:dark_oak_fence";
  if (b.includes("taiga") || b.includes("ice") || b.includes("snow")) return "minecraft:spruce_fence";
  if (b.includes("jungle")) return "minecraft:jungle_fence";
  if (b.includes("mesa") || b.includes("badlands") || b.includes("savanna") || b.includes("desert")) return "minecraft:acacia_fence";
  return "minecraft:oak_fence";
}

export function getThemeLanternType(theme) {
  const d = (theme && theme.dimension) || "overworld";
  const b = (theme && theme.biome) || "";
  if (d === "nether" || b.includes("soul") || b.includes("deep_dark")) {
    return "minecraft:soul_lantern";
  }
  return "minecraft:lantern";
}

// Places a lantern strictly on top of a fence.
// Guarantees 100% that a lantern is NEVER placed without a valid fence underneath!
export function placeLanternWithFence(dimension, fenceLoc, fenceType = "minecraft:oak_fence", lanternType = "minecraft:lantern") {
  try {
    const fenceBlock = dimension.getBlock(fenceLoc);
    if (!fenceBlock) return false;

    // Fence can replace air or soft foliage (flowers, tall grass, crops, petals, etc.)
    if (!fenceBlock.isAir && fenceBlock.typeId !== "minecraft:air") {
      const ft = fenceBlock.typeId;
      // Do not overwrite chests, bedrock, lodestone, portals, or walls
      if (ft.includes("chest") || ft.includes("bedrock") || ft.includes("lodestone") || ft.includes("portal") || ft.includes("frame") || ft.includes("wall")) {
        return false;
      }
      const isSoft = ft.includes("grass") || ft.includes("flower") || ft.includes("petal") || 
                     ft.includes("fern") || ft.includes("bush") || ft.includes("roots") || 
                     ft.includes("fungus") || ft.includes("deadbush") || ft.includes("crop") ||
                     ft.includes("carrot") || ft.includes("wheat") || ft.includes("potato") ||
                     ft.includes("beetroot") || ft.includes("pumpkin") || ft.includes("melon") ||
                     (ft.includes("nether_brick") && fenceType.includes("nether_brick")) ||
                     (ft.includes("sculk") && fenceType.includes("fence"));
      if (!isSoft && !ft.includes("fence")) return false;
    }

    const lanternLoc = { x: fenceLoc.x, y: fenceLoc.y + 1, z: fenceLoc.z };
    const lanternBlock = dimension.getBlock(lanternLoc);
    if (!lanternBlock) return false;

    // Ensure the lantern spot is air or replaceable foliage (never solid rock or chest)
    if (!lanternBlock.isAir && lanternBlock.typeId !== "minecraft:air") {
      const lt = lanternBlock.typeId;
      const isLanternSoft = lt.includes("air") || lt.includes("leaves") || lt.includes("grass") || lt.includes("flower") || lt.includes("petal");
      if (!isLanternSoft) return false;
    }

    // Set fence first
    fenceBlock.setType(fenceType);
    buildStats.placed++;

    // Set lantern directly on top of fence
    lanternBlock.setType(lanternType);
    buildStats.placed++;
    return true;
  } catch (e) {
    return false;
  }
}

export function placeSurfaceVegetation(dimension, theme, loc, seed) {
  const { x, y, z } = loc;
  try {
    const roll = Math.random();

    if (theme.id === "badlands_mesa" || theme.biome === "mesa") {
      if (roll < 0.12) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:deadbush");
      } else if (roll < 0.18) {
        if (safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:cactus")) {
          if (Math.random() < 0.4) safeAirOnlySetBlock(dimension, { x, y: y + 2, z }, "minecraft:cactus");
        }
      }
    } else if (theme.biome === "cherry_grove" || theme.id === "cherry_sanctuary") {
      // Natural scattered pink petals (pure organic distribution like vanilla cherry groves)
      if (roll < 0.48) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:pink_petals");
      }
    } else if (theme.id === "bamboo_monastery") {
      // Organic bamboo cluster with variable heights and short grass
      if (roll < 0.22) {
        if (safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:bamboo")) {
          if (Math.random() < 0.65 && safeAirOnlySetBlock(dimension, { x, y: y + 2, z }, "minecraft:bamboo")) {
            if (Math.random() < 0.35) safeAirOnlySetBlock(dimension, { x, y: y + 3, z }, "minecraft:bamboo");
          }
        }
      } else if (roll < 0.55) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      }
    } else if (theme.id === "pumpkin_patch") {
      // Scattered pumpkins and grass
      if (roll < 0.16) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, Math.random() < 0.25 ? "minecraft:carved_pumpkin" : "minecraft:pumpkin");
      } else if (roll < 0.50) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      }
    } else if (theme.id === "melon_greenhouse") {
      if (roll < 0.18) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:melon_block");
      } else if (roll < 0.50) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      }
    } else if (theme.id === "bee_apiary") {
      // Lush wildflower meadow
      if (roll < 0.15) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:dandelion");
      else if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:poppy");
      else if (roll < 0.40) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:cornflower");
      else if (roll < 0.52) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:allium");
      else if (roll < 0.62) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:oxeye_daisy");
      else if (roll < 0.78) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
    } else if (theme.floor === "minecraft:grass_block") {
      // Natural vanilla meadow: irregular grass, scattered flowers, and open spaces
      if (roll < 0.32) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:short_grass");
      } else if (roll < 0.36) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:dandelion");
      } else if (roll < 0.40) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:poppy");
      } else if (roll < 0.44) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:cornflower");
      } else if (roll < 0.47) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:oxeye_daisy");
      } else if (roll < 0.50) {
        safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:azure_bluet");
      }
    } else if (theme.floor === "minecraft:podzol") {
      if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:fern");
      else if (roll < 0.42) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:sweet_berry_bush");
      else if (roll < 0.50) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:large_fern");
    } else if (theme.floor.includes("sand")) {
      if (roll < 0.12) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:deadbush");
    } else if (theme.floor === "minecraft:crimson_nylium") {
      if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:crimson_roots");
      else if (roll < 0.40) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:crimson_fungus");
    } else if (theme.floor === "minecraft:warped_nylium") {
      if (roll < 0.28) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:warped_roots");
      else if (roll < 0.40) safePlantSetBlock(dimension, loc, { x, y: y + 1, z }, "minecraft:warped_fungus");
    }
  } catch (e) {}
}

// 5 Geological Archetypes Classifier:
// atoll (sunken lagoon crater), spire (needle peak & deep vertical root),
// terrace (stepped flat plateaus), archipelago (cluster islets), rolling (organic hills)
export function getIslandArchetype(theme) {
  if (theme.archetype) return theme.archetype;
  const id = theme.id;
  const feat = theme.feature || "";

  // 1. ATOLL / LAGOON / CRATER:
  if (id === "aquarium_atoll" || id === "ocean_monument_shrine" || id === "meteorite_crater" || id === "amethyst_geode" || id === "slime_biosphere") {
    return "atoll";
  }
  // 2. SPIRE / PEAK:
  if (id.includes("spire") || id.includes("peak") || feat === "copper_spire" || id === "end_city_tower" || id === "glowstone_meteor" || id === "ice_spike_peak" || id === "elytra_hangar") {
    return "spire";
  }
  // 3. TERRACE / STEPPED PLATEAU:
  if (id === "badlands_mesa" || id === "ancient_crypt" || id === "fossil_excavation" || id === "blacksmith_workshop" || id === "armory_vault" || id === "tuff_golem_sanctuary" || id === "bastion_treasury" || id === "trial_vault" || id === "stronghold_portal") {
    return "terrace";
  }
  // 4. ARCHIPELAGO / ISLETS:
  if (id === "mushroom_haven" || id === "cherry_sanctuary" || id === "bamboo_monastery" || id === "crimson_forest_isle" || id === "warped_forest_isle" || id === "void_gateway_outpost") {
    return "archipelago";
  }
  // 5. ROLLING (Organic hills & bluffs):
  return "rolling";
}

export function getIslandBlockPool(theme) {
  const pools = {
    sky_oasis: ["minecraft:grass_block", "minecraft:oak_log", "minecraft:oak_planks", "minecraft:moss_block", "minecraft:melon_block", "minecraft:emerald_ore", "minecraft:hay_block"],
    ancient_crypt: ["minecraft:sandstone", "minecraft:cut_sandstone", "minecraft:chiseled_sandstone", "minecraft:gold_ore", "minecraft:raw_gold_block", "minecraft:lapis_ore"],
    trial_vault: ["minecraft:copper_block", "minecraft:cut_copper", "minecraft:polished_tuff", "minecraft:tuff", "minecraft:copper_ore", "minecraft:iron_block"],
    stronghold_portal: ["minecraft:stone_bricks", "minecraft:cracked_stone_bricks", "minecraft:mossy_stone_bricks", "minecraft:iron_block", "minecraft:bookshelf", "minecraft:chiseled_stone_bricks"],
    cherry_sanctuary: ["minecraft:cherry_log", "minecraft:cherry_leaves", "minecraft:cherry_planks", "minecraft:cherry_wood", "minecraft:bee_nest", "minecraft:honey_block"],
    pale_garden_spire: ["minecraft:dark_oak_log", "minecraft:dark_oak_planks", "minecraft:dark_oak_leaves", "minecraft:moss_block", "minecraft:podzol", "minecraft:deepslate"],
    mushroom_haven: ["minecraft:mycelium", "minecraft:red_mushroom_block", "minecraft:brown_mushroom_block", "minecraft:mushroom_stem", "minecraft:dirt"],
    badlands_mesa: ["minecraft:red_sand", "minecraft:hardened_clay", "minecraft:orange_terracotta", "minecraft:yellow_terracotta", "minecraft:gold_ore", "minecraft:raw_gold_block"],
    ice_spike_peak: ["minecraft:snow", "minecraft:packed_ice", "minecraft:blue_ice", "minecraft:ice"],
    jungle_temple: ["minecraft:jungle_log", "minecraft:jungle_leaves", "minecraft:bamboo_block", "minecraft:mossy_cobblestone", "minecraft:chiseled_stone_bricks"],
    nether_fortress_spire: ["minecraft:nether_brick", "minecraft:red_nether_brick", "minecraft:quartz_ore", "minecraft:nether_gold_ore", "minecraft:soul_sand"],
    bastion_treasury: ["minecraft:blackstone", "minecraft:polished_blackstone_bricks", "minecraft:gilded_blackstone", "minecraft:gold_block", "minecraft:crying_obsidian"],
    crimson_forest_isle: ["minecraft:crimson_nylium", "minecraft:crimson_stem", "minecraft:crimson_hyphae", "minecraft:shroomlight", "minecraft:nether_wart_block"],
    warped_forest_isle: ["minecraft:warped_nylium", "minecraft:warped_stem", "minecraft:warped_hyphae", "minecraft:shroomlight", "minecraft:warped_wart_block"],
    soul_sand_valley: ["minecraft:soul_sand", "minecraft:soul_soil", "minecraft:bone_block", "minecraft:basalt"],
    amethyst_geode: ["minecraft:amethyst_block", "minecraft:budding_amethyst", "minecraft:calcite", "minecraft:smooth_basalt", "minecraft:tinted_glass"],
    witch_swamp_hut: ["minecraft:mud", "minecraft:mud_bricks", "minecraft:mangrove_log", "minecraft:redstone_ore", "minecraft:glowstone"],
    pillager_watchtower: ["minecraft:dark_oak_log", "minecraft:dark_oak_planks", "minecraft:cobblestone", "minecraft:iron_ore", "minecraft:hay_block"],
    desert_well_oasis: ["minecraft:sand", "minecraft:sandstone", "minecraft:smooth_sandstone", "minecraft:clay", "minecraft:cut_sandstone"],
    bamboo_monastery: ["minecraft:bamboo_mosaic", "minecraft:moss_block", "minecraft:grass_block", "minecraft:bamboo_block", "minecraft:bamboo_planks"],
    deepslate_forge: ["minecraft:deepslate", "minecraft:deepslate_iron_ore", "minecraft:raw_iron_block", "minecraft:blast_furnace", "minecraft:iron_block"],
    ocean_monument_shrine: ["minecraft:prismarine", "minecraft:prismarine_bricks", "minecraft:dark_prismarine", "minecraft:sea_lantern", "minecraft:sponge"],
    glowstone_meteor: ["minecraft:glowstone", "minecraft:basalt", "minecraft:blackstone", "minecraft:magma", "minecraft:obsidian"],
    end_city_tower: ["minecraft:purpur_block", "minecraft:purpur_pillar", "minecraft:end_bricks", "minecraft:diamond_ore", "minecraft:end_stone"],
    fossil_excavation: ["minecraft:bone_block", "minecraft:coarse_dirt", "minecraft:dirt_with_roots", "minecraft:coal_ore", "minecraft:iron_ore"],
    blacksmith_workshop: ["minecraft:smooth_stone", "minecraft:iron_ore", "minecraft:raw_iron_block", "minecraft:iron_block", "minecraft:furnace"],
    library_observatory: ["minecraft:bookshelf", "minecraft:chiseled_bookshelf", "minecraft:stone_bricks", "minecraft:lapis_ore", "minecraft:lapis_block"],
    alchemist_laboratory: ["minecraft:podzol", "minecraft:redstone_block", "minecraft:gold_ore", "minecraft:redstone_ore", "minecraft:glass"],
    spider_nest: ["minecraft:mossy_stone_bricks", "minecraft:cobblestone", "minecraft:infested_stone", "minecraft:iron_ore"],
    creeper_dungeon: ["minecraft:mossy_cobblestone", "minecraft:tnt", "minecraft:mossy_stone_bricks", "minecraft:cobblestone", "minecraft:sand"],
    slime_biosphere: ["minecraft:moss_block", "minecraft:clay", "minecraft:slime", "minecraft:mud"],
    bee_apiary: ["minecraft:bee_nest", "minecraft:honeycomb_block", "minecraft:honey_block", "minecraft:yellow_terracotta", "minecraft:hay_block"],
    pumpkin_patch: ["minecraft:pumpkin", "minecraft:carved_pumpkin", "minecraft:lit_pumpkin", "minecraft:hay_block", "minecraft:dirt"],
    melon_greenhouse: ["minecraft:melon_block", "minecraft:glass", "minecraft:dirt", "minecraft:grass_block", "minecraft:jungle_log"],
    sculk_laboratory: ["minecraft:sculk", "minecraft:sculk_catalyst", "minecraft:deepslate_tiles", "minecraft:deepslate", "minecraft:deepslate_bricks"],
    armory_vault: ["minecraft:stone_bricks", "minecraft:iron_block", "minecraft:raw_iron_block", "minecraft:chiseled_stone_bricks", "minecraft:cracked_stone_bricks"],
    bakery_windmill: ["minecraft:hay_block", "minecraft:barrel", "minecraft:dried_kelp_block", "minecraft:spruce_planks", "minecraft:spruce_log"],
    aquarium_atoll: ["minecraft:sand", "minecraft:tube_coral_block", "minecraft:brain_coral_block", "minecraft:prismarine", "minecraft:sponge"],
    tuff_golem_sanctuary: ["minecraft:tuff", "minecraft:polished_tuff", "minecraft:deepslate", "minecraft:chiseled_stone_bricks", "minecraft:stone"],
    meteorite_crater: ["minecraft:blackstone", "minecraft:crying_obsidian", "minecraft:obsidian", "minecraft:magma", "minecraft:ancient_debris"],
    golden_pantheon: ["minecraft:quartz_block", "minecraft:smooth_quartz", "minecraft:gold_block", "minecraft:raw_gold_block", "minecraft:sea_lantern"],
    void_gateway_outpost: ["minecraft:end_bricks", "minecraft:purpur_block", "minecraft:obsidian", "minecraft:crying_obsidian", "minecraft:purpur_pillar"],
    elytra_hangar: ["minecraft:purpur_block", "minecraft:end_bricks", "minecraft:purpur_pillar", "minecraft:end_rod", "minecraft:diamond_block", "minecraft:end_stone"]
  };
  return pools[theme.id] || [theme.floor, theme.subfloor, theme.base];
}

export function decorateSteppingPaths(dimension, theme, center, seed) {
  const { x: cx, y: cy, z: cz } = center;
  // Offset paths by distance >= 2 to keep adjacent cobblestone collar around the island OneBlock clean
  const pathBlocks = [
    { x: cx, y: cy, z: cz + 2 },
    { x: cx, y: cy, z: cz - 2 },
    { x: cx + 2, y: cy, z: cz },
    { x: cx - 2, y: cy, z: cz },
    { x: cx - 3, y: cy, z: cz - 1 },
    { x: cx + 3, y: cy, z: cz + 1 }
  ];
  for (let i = 0; i < pathBlocks.length; i++) {
    const p = pathBlocks[i];
    const b = dimension.getBlock(p);
    if (b && b.typeId === theme.floor) {
      if (Math.random() < 0.5) {
        b.setType("minecraft:grass_path");
      } else {
        b.setType(theme.biome.includes("nether") ? "minecraft:blackstone" : "minecraft:cobblestone");
      }
    }
  }
}

export const PASSABLE_BLOCKS = /(short_grass|tall_grass|^minecraft:grass$|fern|flower|tulip|orchid|allium|azure_bluet|oxeye|cornflower|lily_of_the_valley|poppy|dandelion|sapling|_bush|vine|petals|crimson_roots|warped_roots|hanging_roots|torch|lantern|carpet|snow_layer|rail|button|pressure_plate|candle|sea_pickle|fire|sign|banner|torchflower|pitcher|spore_blossom|berries|red_mushroom$|brown_mushroom$|fungus|sprouts|chain|dead_bush|deadbush|cobweb|web)/;

export function isPassableBlock(b) {
  if (!b) return false;
  if (b.isAir || b.typeId === "minecraft:air") return true;
  return PASSABLE_BLOCKS.test(b.typeId);
}

export function isStandableBlock(b) {
  if (!b || b.isAir || b.typeId === "minecraft:air") return false;
  if (b.typeId.includes("water") || b.typeId.includes("lava")) return false;
  return !PASSABLE_BLOCKS.test(b.typeId);
}
