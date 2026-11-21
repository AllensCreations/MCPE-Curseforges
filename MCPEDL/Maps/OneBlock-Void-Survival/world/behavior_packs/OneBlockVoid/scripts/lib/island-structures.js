import { ItemStack, system } from "@minecraft/server";
import { isStandableBlock, isPassableBlock, buildStats, safeAirOnlySetBlock, placeLanternWithFence } from "./island-blocks.js";

function findSafeSpawn(dimension, typeId, loc) {
  const offsets = [[0, 0]];
  for (let r = 1; r <= 4; r++) {
    for (let ox = -r; ox <= r; ox++) {
      for (let oz = -r; oz <= r; oz++) {
        if (Math.max(Math.abs(ox), Math.abs(oz)) === r) offsets.push([ox, oz]);
      }
    }
  }
  for (const [ox, oz] of offsets) {
    const x = loc.x + ox;
    const z = loc.z + oz;
    for (let dy = 5; dy >= -5; dy--) {
      const y = Math.floor(loc.y) + dy;
      try {
        if (isStandableBlock(dimension.getBlock({ x: Math.floor(x), y: y - 1, z: Math.floor(z) })) &&
            isPassableBlock(dimension.getBlock({ x: Math.floor(x), y, z: Math.floor(z) })) &&
            isPassableBlock(dimension.getBlock({ x: Math.floor(x), y: y + 1, z: Math.floor(z) }))) {
          return dimension.spawnEntity(typeId, { x, y, z });
        }
      } catch (e) {}
    }
  }
  return dimension.spawnEntity(typeId, loc);
}

export function spawnMobSafe(dimension, typeId, loc) {
  system.runTimeout(() => {
    try { findSafeSpawn(dimension, typeId, loc); } catch (e) {}
  }, 10);
}

function placeStructureChest(dimension, loc, items) {
  try {
    const b = dimension.getBlock(loc);
    if (!b || (!b.isAir && b.typeId !== "minecraft:air")) return;
    const below = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
    if (below && (below.isAir || below.typeId === "minecraft:air")) {
      let support = "minecraft:stone_bricks";
      for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nb = dimension.getBlock({ x: loc.x + ox, y: loc.y - 1, z: loc.z + oz });
        if (isStandableBlock(nb)) { support = nb.typeId; break; }
      }
      try { below.setType(support); buildStats.placed++; } catch (se) {}
    }
    b.setType("minecraft:chest");
    buildStats.placed++;
    const inv = b.getComponent("minecraft:inventory")?.container;
    if (inv && items && items.length > 0) {
      for (let i = 0; i < items.length && i < inv.size; i++) {
        try {
          const it = items[i];
          inv.setItem(i, new ItemStack(it.id, it.count || 1));
        } catch (ie) {}
      }
    }
  } catch (e) {}
}

export function buildThemedStructure(dimension, theme, center) {
  const { x: cx, y: cy, z: cz } = center;
  const feat = theme.feature;
  let mobSpawned = false;

  switch (feat) {
    case "watchtower": {
      // 1. Pillager Sky Outpost (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:cobblestone");
        }
      }
      for (let y = 0; y <= 4; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:dark_oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:dark_oak_log");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:dark_oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:dark_oak_log");
      }
      for (let y = 0; y <= 2; y++) {
        for (let x = 1; x <= 3; x++) {
          const mat = (y === 1 && x === 2) ? "minecraft:birch_fence" : "minecraft:dark_oak_planks";
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz }, mat);
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz + 4 }, mat);
        }
        for (let z = 1; z <= 3; z++) {
          const mat = (y === 1 && z === 2) ? "minecraft:birch_fence" : "minecraft:dark_oak_planks";
          safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + z }, mat);
          safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + z }, mat);
        }
      }
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:dark_oak_planks");
          if (x === 0 || x === 4 || z === 0 || z === 4) {
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 5, z: sz + z }, "minecraft:dark_oak_fence");
          }
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 6, z: sz }, "minecraft:birch_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 6, z: sz }, "minecraft:birch_fence");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 6, z: sz + 4 }, "minecraft:birch_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 6, z: sz + 4 }, "minecraft:birch_fence");
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 7, z: sz + z }, "minecraft:dark_oak_slab");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:fletching_table");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:target");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz + 1 }, "minecraft:torch");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:crossbow", count: 1 },
        { id: "minecraft:arrow", count: 16 },
        { id: "minecraft:emerald", count: 6 },
        { id: "minecraft:dark_oak_log", count: 8 },
        { id: "minecraft:iron_ingot", count: 3 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:pillager", { x: sx + 2.5, y: sy + 5, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "furnace": {
      // 2. Sky Blacksmith Forge (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:smooth_stone" : "minecraft:cobblestone");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:stone_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:stone_bricks");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:stone_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:stone_bricks");
      }
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:stone_brick_slab");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:cobblestone");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:lava");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:blast_furnace");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:stonecutter_block");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:smithing_table");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:crafting_table");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 3 }, [
        { id: "minecraft:iron_ingot", count: 8 },
        { id: "minecraft:raw_iron", count: 12 },
        { id: "minecraft:iron_pickaxe", count: 1 },
        { id: "minecraft:coal", count: 16 },
        { id: "minecraft:bread", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:villager_v2", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "sand_well": {
      // 3. Desert Mirage Well (5x5 offset at cx-4, cz-4)
      const sx = cx - 4;
      const sz = cz - 4;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:cut_sandstone");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 1 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 1 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 3 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 3 }, "minecraft:chiseled_sandstone");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:water");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:water");
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 3, z: sz + z }, "minecraft:sandstone_slab");
        }
      }
      placeLanternWithFence(dimension, { x: sx, y: sy, z: sz + 1 }, "minecraft:birch_fence", "minecraft:lantern");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz + 2 }, "minecraft:crafting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 2 }, "minecraft:cauldron");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 2 }, [
        { id: "minecraft:emerald", count: 6 },
        { id: "minecraft:sand", count: 16 },
        { id: "minecraft:gold_nugget", count: 12 },
        { id: "minecraft:deadbush", count: 2 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:camel", { x: sx + 2.5, y: sy, z: sz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "cauldron": {
      // 4. Witch Brew Hut (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz + 4 }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 4 }, "minecraft:oak_log");
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 1, z: sz + z }, "minecraft:spruce_planks");
        }
      }
      for (let y = 2; y <= 3; y++) {
        for (let x = 0; x <= 4; x++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz }, "minecraft:spruce_planks");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + y, z: sz + 4 }, "minecraft:spruce_planks");
        }
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + z }, "minecraft:spruce_planks");
          safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + z }, "minecraft:spruce_planks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 3, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz + 2 }, "minecraft:glass_pane");
      for (let x = -1; x <= 5; x++) {
        for (let z = -1; z <= 5; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:dark_oak_planks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 2, z: sz + 3 }, "minecraft:cauldron");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 2, z: sz + 3 }, "minecraft:brewing_stand");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 2, z: sz + 1 }, "minecraft:crafting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 2, z: sz + 1 }, "minecraft:red_mushroom_block");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 2, z: sz + 3 }, [
        { id: "minecraft:glass_bottle", count: 4 },
        { id: "minecraft:redstone", count: 8 },
        { id: "minecraft:glowstone_dust", count: 4 },
        { id: "minecraft:spider_eye", count: 3 },
        { id: "minecraft:sugar", count: 6 },
        { id: "minecraft:gunpowder", count: 2 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:witch", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        spawnMobSafe(dimension, "minecraft:cat", { x: sx + 1.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "copper_spire": {
      // 5. Trial & Breeze Vault (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:polished_tuff" : "minecraft:tuff_bricks");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:cut_copper");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:cut_copper");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:cut_copper");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:cut_copper");
      }
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:copper_grate");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz + 2 }, "minecraft:copper_bulb");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_tuff");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:tuff_stairs");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:tuff_stairs");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, [
        { id: "minecraft:trial_key", count: 2 },
        { id: "minecraft:wind_charge", count: 8 },
        { id: "minecraft:heavy_core", count: 1 },
        { id: "minecraft:copper_ingot", count: 12 },
        { id: "minecraft:diamond", count: 2 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:breeze", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "blaze_altar": {
      // 6. Nether Fortress Outpost (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:nether_brick");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:nether_brick");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:nether_brick");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:nether_brick");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:nether_brick");
      }
      for (let x = 1; x <= 3; x++) {
        safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz }, "minecraft:nether_brick_fence");
        safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz + 4 }, "minecraft:nether_brick_fence");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:soul_sand");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:nether_wart");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:soul_sand");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 1 }, "minecraft:nether_wart");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_nether_bricks");
      placeLanternWithFence(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:brewing_stand");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:blaze_rod", count: 4 },
        { id: "minecraft:nether_wart", count: 8 },
        { id: "minecraft:magma_cream", count: 4 },
        { id: "minecraft:gold_ingot", count: 6 },
        { id: "minecraft:nether_brick", count: 16 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:blaze", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "gold_monolith": {
      // 7. Bastion Piglin Treasury (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:polished_blackstone_bricks");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:gilded_blackstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:gilded_blackstone");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:gilded_blackstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:gilded_blackstone");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:gold_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:gold_block");
      placeLanternWithFence(dimension, { x: sx + 2, y: sy + 2, z: sz + 2 }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:smithing_table");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:crying_obsidian");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:netherite_scrap", count: 1 },
        { id: "minecraft:gold_block", count: 2 },
        { id: "minecraft:gold_ingot", count: 12 },
        { id: "minecraft:golden_axe", count: 1 },
        { id: "minecraft:crying_obsidian", count: 3 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:piglin_brute", { x: sx + 2.5, y: sy, z: sz + 1.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "hay_spire": {
      // 8. Windmill Grain Haven (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:smooth_stone");
        }
      }
      for (let y = 0; y <= 4; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 1 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 1 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 3 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 3 }, "minecraft:oak_log");
        safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + y, z: sz + 1 }, "minecraft:white_wool");
        safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + y, z: sz + 3 }, "minecraft:white_wool");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 2 }, "minecraft:white_wool");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 2 }, "minecraft:white_wool");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 3, z: sz }, "minecraft:oak_log");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 5, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 3, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 3, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 3, z: sz }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz }, "minecraft:white_wool");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz + 4 }, "minecraft:composter");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 4 }, "minecraft:hay_block");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 1, z: sz + 4 }, "minecraft:hay_block");

      // Dedicated Irrigated Wheat & Carrot Plot (100% Hydrated with permanent water canal)
      const fx = cx + 2;
      const fz = cz - 2;
      safeAirOnlySetBlock(dimension, { x: fx, y: cy - 1, z: fz }, "minecraft:stone");
      safeAirOnlySetBlock(dimension, { x: fx, y: cy, z: fz }, "minecraft:water");
      for (let ox = -1; ox <= 1; ox++) {
        for (let oz = -1; oz <= 1; oz++) {
          if (ox !== 0 || oz !== 0) {
            safeAirOnlySetBlock(dimension, { x: fx + ox, y: cy, z: fz + oz }, "minecraft:farmland");
            safeAirOnlySetBlock(dimension, { x: fx + ox, y: cy + 1, z: fz + oz }, (ox + oz) % 2 === 0 ? "minecraft:wheat" : "minecraft:carrots");
          }
        }
      }

      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 4 }, [
        { id: "minecraft:bread", count: 8 },
        { id: "minecraft:wheat", count: 16 },
        { id: "minecraft:wheat_seeds", count: 12 },
        { id: "minecraft:emerald", count: 4 },
        { id: "minecraft:apple", count: 6 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:villager_v2", { x: sx + 2.5, y: sy, z: sz + 4.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "gateway_beam": {
      // 9. Ruined Void Portal (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:magma" : "minecraft:netherrack");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 2, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 3, z: sz + 2 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 2, z: sz + 2 }, "minecraft:crying_obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 4, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz + 2 }, "minecraft:obsidian");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:gold_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:gold_block");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 1 }, [
        { id: "minecraft:golden_apple", count: 1 },
        { id: "minecraft:obsidian", count: 4 },
        { id: "minecraft:flint_and_steel", count: 1 },
        { id: "minecraft:fire_charge", count: 3 },
        { id: "minecraft:golden_boots", count: 1 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:zombie_pigman", { x: sx + 2.5, y: sy, z: sz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "portal_frame": {
      // 10. Stronghold End Chamber (Authentic 7x7 Vanilla 12-Frame Portal Room)
      const sy = cy + 4;
      // Stone Brick Chamber Foundation
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          if (Math.abs(x) <= 1 && Math.abs(z) <= 1) {
            if (Math.abs(x) === 1 && Math.abs(z) === 1) {
              const b = dimension.getBlock({ x: cx + x, y: sy - 1, z: cz + z });
              if (b) b.setType("minecraft:lava");
            }
          } else {
            safeAirOnlySetBlock(dimension, { x: cx + x, y: sy - 1, z: cz + z }, (x + z) % 2 === 0 ? "minecraft:stone_bricks" : "minecraft:cracked_stone_bricks");
          }
        }
      }
      // Chamber Perimeter Stone Columns
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: cx - 3, y: sy + y, z: cz - 3 }, "minecraft:mossy_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: sy + y, z: cz - 3 }, "minecraft:mossy_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: cx - 3, y: sy + y, z: cz + 3 }, "minecraft:mossy_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: sy + y, z: cz + 3 }, "minecraft:mossy_stone_bricks");
      }

      // Helper to place native inward-facing end portal frame
      const placePortalFrame = (fx, fy, fz, dir) => {
        if (safeAirOnlySetBlock(dimension, { x: fx, y: fy, z: fz }, "minecraft:end_portal_frame")) {
          try {
            dimension.runCommand(`setblock ${fx} ${fy} ${fz} end_portal_frame ["direction": ${dir}] replace`);
          } catch (e) {}
        }
      };

      // 12 Authentic Inward-Facing End Portal Frames:
      // North Edge (faces South, dir 0)
      placePortalFrame(cx - 1, sy, cz - 2, 0);
      placePortalFrame(cx, sy, cz - 2, 0);
      placePortalFrame(cx + 1, sy, cz - 2, 0);

      // South Edge (faces North, dir 2)
      placePortalFrame(cx - 1, sy, cz + 2, 2);
      placePortalFrame(cx, sy, cz + 2, 2);
      placePortalFrame(cx + 1, sy, cz + 2, 2);

      // West Edge (faces East, dir 3)
      placePortalFrame(cx - 2, sy, cz - 1, 3);
      placePortalFrame(cx - 2, sy, cz, 3);
      placePortalFrame(cx - 2, sy, cz + 1, 3);

      // East Edge (faces West, dir 1)
      placePortalFrame(cx + 2, sy, cz - 1, 1);
      placePortalFrame(cx + 2, sy, cz, 1);
      placePortalFrame(cx + 2, sy, cz + 1, 1);

      // Corner Steps & Pillars
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy, z: cz - 2 }, "minecraft:stone_bricks");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy, z: cz - 2 }, "minecraft:stone_bricks");
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy, z: cz + 2 }, "minecraft:stone_bricks");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy, z: cz + 2 }, "minecraft:stone_bricks");

      // Hanging Iron Bars & Spawner Pedestal above the lava pool
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 2, z: cz }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 3, z: cz }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 1, z: cz }, "minecraft:mob_spawner");

      // Stronghold Loot Chest (Guaranteed 12 Eyes of Ender for vanilla activation)
      placeStructureChest(dimension, { x: cx - 3, y: sy, z: cz }, [
        { id: "minecraft:ender_eye", count: 12 },
        { id: "minecraft:diamond_sword", count: 1 },
        { id: "minecraft:golden_apple", count: 3 },
        { id: "minecraft:iron_block", count: 2 },
        { id: "minecraft:enchanted_book", count: 1 },
        { id: "minecraft:bookshelf", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:silverfish", { x: cx + 0.5, y: sy + 1.2, z: cz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "end_ship": {
      // 31. End Ship Hangar (Purpur Dock & Dragon Prow)
      const sy = cy + 1;
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: cx + x, y: sy - 1, z: cz + z }, "minecraft:purpur_block");
        }
      }
      // Purpur Pillars & End Rods
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy + 1, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx - 2, y: sy + 2, z: cz - 2 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy + 1, z: cz - 2 }, "minecraft:purpur_pillar");
      safeAirOnlySetBlock(dimension, { x: cx + 2, y: sy + 2, z: cz - 2 }, "minecraft:end_rod");

      // Ship Prow with Dragon Head & Brewing Stand
      safeAirOnlySetBlock(dimension, { x: cx, y: sy, z: cz + 2 }, "minecraft:purpur_stairs");
      safeAirOnlySetBlock(dimension, { x: cx, y: sy + 1, z: cz + 2 }, "minecraft:dragon_head");
      safeAirOnlySetBlock(dimension, { x: cx - 1, y: sy, z: cz }, "minecraft:brewing_stand");

      // End Ship Loot Chest (Elytra, Fireworks, Potions, Shulker Shells)
      placeStructureChest(dimension, { x: cx + 1, y: sy, z: cz }, [
        { id: "minecraft:elytra", count: 1 },
        { id: "minecraft:firework_rocket", count: 32 },
        { id: "minecraft:potion", count: 2 },
        { id: "minecraft:diamond", count: 4 },
        { id: "minecraft:shulker_shell", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:shulker", { x: cx + 0.5, y: sy + 1, z: cz + 0.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "sea_lanterns": {
      // 11. Prismarine Ocean Shrine (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:dark_prismarine");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:prismarine_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:prismarine_bricks");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:prismarine_bricks");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:prismarine_bricks");
      }
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 3, z: sz }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 3, z: sz + 4 }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + 3, z: sz + 4 }, "minecraft:sea_lantern");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:sponge");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:water");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:prismarine_slab");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:prismarine_slab");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:prismarine_shard", count: 12 },
        { id: "minecraft:prismarine_crystals", count: 8 },
        { id: "minecraft:nautilus_shell", count: 1 },
        { id: "minecraft:heart_of_the_sea", count: 1 },
        { id: "minecraft:salmon", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:guardian", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "pillars": {
      // 12. Ancient Sandstone Crypt (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:cut_sandstone" : "minecraft:orange_terracotta");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:chiseled_sandstone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:chiseled_sandstone");
      }
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:cut_sandstone_slab");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_sandstone");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:sandstone_stairs");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:sandstone_stairs");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, [
        { id: "minecraft:diamond", count: 2 },
        { id: "minecraft:gold_ingot", count: 8 },
        { id: "minecraft:saddle", count: 1 },
        { id: "minecraft:iron_horse_armor", count: 1 },
        { id: "minecraft:bone", count: 8 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:husk", { x: sx + 2.5, y: sy, z: sz + 1.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "enchanting_setup": {
      // 13. Arcane Sky Observatory (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:polished_deepslate");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 1 }, "minecraft:bookshelf");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:enchanting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:grindstone");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:lapis_block");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:enchanted_book", count: 2 },
        { id: "minecraft:lapis_lazuli", count: 16 },
        { id: "minecraft:book", count: 6 },
        { id: "minecraft:ender_pearl", count: 4 },
        { id: "minecraft:experience_bottle", count: 3 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:allay", { x: sx + 2.5, y: sy + 1.5, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "brewing_setup": {
      // 14. Void Alchemist Laboratory (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:spruce_planks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:brewing_stand");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:cauldron");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:crafting_table");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:nether_wart");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy - 1, z: sz + 3 }, "minecraft:soul_sand");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:glass_bottle", count: 6 },
        { id: "minecraft:fermented_spider_eye", count: 2 },
        { id: "minecraft:blaze_powder", count: 4 },
        { id: "minecraft:magma_cream", count: 2 },
        { id: "minecraft:glowstone_dust", count: 6 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:witch", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "fossil_rib": {
      // 15. Prehistoric Fossil Dig (6x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 5; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:mud" : "minecraft:coarse_dirt");
        }
      }
      for (const rx of [1, 3, 5]) {
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy, z: sz + 1 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 1, z: sz + 1 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 2, z: sz + 2 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 2, z: sz + 3 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy + 1, z: sz + 4 }, "minecraft:bone_block");
        safeAirOnlySetBlock(dimension, { x: sx + rx, y: sy, z: sz + 4 }, "minecraft:bone_block");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:moss_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:sniffer_egg");
      safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy, z: sz + 2 }, "minecraft:composter");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 2 }, [
        { id: "minecraft:torchflower_seeds", count: 2 },
        { id: "minecraft:pitcher_pod", count: 2 },
        { id: "minecraft:bone", count: 12 },
        { id: "minecraft:bone_meal", count: 8 },
        { id: "minecraft:sniffer_egg", count: 1 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:sniffer", { x: sx + 3.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "glass_dome": {
      // 16. Tropical Melon Greenhouse (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:jungle_planks");
          if (x === 0 || x === 4 || z === 0 || z === 4) {
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz + z }, "minecraft:jungle_log");
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 1, z: sz + z }, "minecraft:glass");
            safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 2, z: sz + z }, "minecraft:glass");
          }
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 3, z: sz + z }, "minecraft:glass");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz }, "minecraft:air");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:water");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy - 1, z: sz + 2 }, "minecraft:farmland");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy - 1, z: sz + 2 }, "minecraft:farmland");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:melon_block");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:carved_pumpkin");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:bamboo");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:composter");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:melon_seeds", count: 8 },
        { id: "minecraft:melon_slice", count: 16 },
        { id: "minecraft:bamboo", count: 8 },
        { id: "minecraft:shears", count: 1 },
        { id: "minecraft:jungle_sapling", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:parrot", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "bamboo_grove": {
      // 17. Jungle Ruined Temple (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, (x + z) % 2 === 0 ? "minecraft:mossy_cobblestone" : "minecraft:chiseled_stone_bricks");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:mossy_cobblestone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:mossy_cobblestone");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:mossy_cobblestone");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:mossy_cobblestone");
      }
      for (let by = 0; by <= 4; by++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + by, z: sz + 1 }, "minecraft:bamboo");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + by, z: sz + 1 }, "minecraft:bamboo");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_stone_bricks");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:dispenser");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:emerald", count: 6 },
        { id: "minecraft:arrow", count: 16 },
        { id: "minecraft:bamboo", count: 12 },
        { id: "minecraft:gold_ingot", count: 4 },
        { id: "minecraft:mossy_cobblestone", count: 8 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:ocelot", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "end_rod": {
      // 18. End City Spire (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:purpur_block");
        }
      }
      for (let y = 0; y <= 4; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 1 }, "minecraft:purpur_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 1 }, "minecraft:purpur_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + y, z: sz + 3 }, "minecraft:purpur_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + y, z: sz + 3 }, "minecraft:purpur_pillar");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 5, z: sz + 1 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 5, z: sz + 1 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 5, z: sz + 3 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 5, z: sz + 3 }, "minecraft:end_rod");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:purpur_block");
      placeStructureChest(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, [
        { id: "minecraft:chorus_fruit", count: 12 },
        { id: "minecraft:ender_pearl", count: 4 },
        { id: "minecraft:iron_ingot", count: 6 },
        { id: "minecraft:diamond", count: 1 },
        { id: "minecraft:purpur_block", count: 8 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:shulker", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "sculk_shrieker": {
      // 19. Ancient Sculk Laboratory (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:deepslate_tiles");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:sculk_catalyst");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:sculk_sensor");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:sculk_shrieker");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:sculk");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:sculk");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy, z: sz }, "minecraft:cobbled_deepslate_wall");
      placeLanternWithFence(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:echo_shard", count: 3 },
        { id: "minecraft:disc_fragment_5", count: 2 },
        { id: "minecraft:amethyst_shard", count: 6 },
        { id: "minecraft:sculk", count: 8 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:bat", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "anvil_stand": {
      // 20. Knight Sky Armory (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:stone_bricks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:smithing_table");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:grindstone");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:blast_furnace");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:iron_bars");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:iron_chestplate", count: 1 },
        { id: "minecraft:iron_helmet", count: 1 },
        { id: "minecraft:iron_sword", count: 1 },
        { id: "minecraft:iron_block", count: 1 },
        { id: "minecraft:shield", count: 1 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:iron_golem", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "copper_bulb": {
      // 21. Tuff Golem Sanctuary (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:tuff_bricks");
        }
      }
      for (let y = 0; y <= 2; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:chiseled_tuff");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:chiseled_tuff");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:chiseled_tuff");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:chiseled_tuff");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:copper_bulb");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:copper_grate");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:copper_ingot", count: 16 },
        { id: "minecraft:raw_copper", count: 12 },
        { id: "minecraft:honeycomb", count: 4 },
        { id: "minecraft:tuff", count: 16 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:iron_golem", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "lava_forge": {
      // 22. Ancient Deepslate Forge (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:deepslate_bricks");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:lava");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 1 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 3 }, "minecraft:iron_bars");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:blast_furnace");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:anvil");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:stonecutter_block");
      placeStructureChest(dimension, { x: sx + 3, y: sy, z: sz + 3 }, [
        { id: "minecraft:diamond", count: 2 },
        { id: "minecraft:raw_iron", count: 12 },
        { id: "minecraft:coal", count: 16 },
        { id: "minecraft:obsidian", count: 4 }
      ]);
      break;
    }

    case "tnt_barrel": {
      // 23. Volatile Gunpowder Depot (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:polished_andesite");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:barrel");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:barrel");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:tnt");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:tnt");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:target");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 3 }, [
        { id: "minecraft:tnt", count: 3 },
        { id: "minecraft:gunpowder", count: 12 },
        { id: "minecraft:sand", count: 12 },
        { id: "minecraft:flint_and_steel", count: 1 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:creeper", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "webs": {
      // 24. Cobweb Cave Nest (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:mossy_cobblestone");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:chiseled_stone_bricks");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 3 }, "minecraft:web");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 3 }, "minecraft:web");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:string", count: 16 },
        { id: "minecraft:spider_eye", count: 8 },
        { id: "minecraft:fermented_spider_eye", count: 2 },
        { id: "minecraft:iron_ingot", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:cave_spider", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "slime_core": {
      // 25. Gelatinous Slime Isle (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:moss_block");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:emerald_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:slime");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 2 }, "minecraft:slime");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 2 }, "minecraft:slime");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:slime_ball", count: 16 },
        { id: "minecraft:lead", count: 2 },
        { id: "minecraft:sticky_piston", count: 2 },
        { id: "minecraft:emerald", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:slime", { x: sx + 2.5, y: sy + 1, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "beehive": {
      // 26. Sunlit Honey Apiary (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:grass_block");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 3, y: sy + 1, z: sz + 1 }, "minecraft:oak_fence");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy - 1, z: sz + 2 }, "minecraft:campfire");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:bee_nest");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz + 2 }, "minecraft:flowering_azalea");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 3 }, [
        { id: "minecraft:honey_bottle", count: 4 },
        { id: "minecraft:honeycomb", count: 6 },
        { id: "minecraft:shears", count: 1 },
        { id: "minecraft:honey_block", count: 2 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:bee", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        spawnMobSafe(dimension, "minecraft:bee", { x: sx + 1.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "huge_mushroom": {
      // 27. Giant Mushroom Haven (5x5 offset at cx+3, cz-5)
      const sx = cx + 3;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:mycelium");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + y, z: sz + 2 }, "minecraft:mushroom_stem");
      }
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 4, z: sz + z }, "minecraft:red_mushroom_block");
        }
      }
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:mushroom_stew", count: 3 },
        { id: "minecraft:red_mushroom", count: 12 },
        { id: "minecraft:brown_mushroom", count: 12 },
        { id: "minecraft:mycelium", count: 4 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:mooshroom", { x: sx + 2.5, y: sy, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "ice_spike": {
      // 28. Glacial Ice Spire (5x5 offset at cx-5, cz+3)
      const sx = cx - 5;
      const sz = cz + 3;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:packed_ice");
        }
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:blue_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:blue_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 2, z: sz + 2 }, "minecraft:blue_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 3, z: sz + 2 }, "minecraft:packed_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 4, z: sz + 2 }, "minecraft:packed_ice");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 5, z: sz + 2 }, "minecraft:packed_ice");
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 2 }, [
        { id: "minecraft:blue_ice", count: 8 },
        { id: "minecraft:packed_ice", count: 16 },
        { id: "minecraft:snowball", count: 16 },
        { id: "minecraft:cod", count: 6 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:polar_bear", { x: sx + 2.5, y: sy, z: sz + 3.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "coral_pool": {
      // 29. Coral Reef Biosphere (5x5 offset at cx+3, cz+3)
      const sx = cx + 3;
      const sz = cz + 3;
      const sy = cy + 1;
      // Foundation rim:
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 2, z: sz + z }, "minecraft:prismarine");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:cut_sandstone");
        }
      }
      // Rich 2-deep clear coral lagoon with sea lantern base and vibrant live corals!
      for (let x = 1; x <= 3; x++) {
        for (let z = 1; z <= 3; z++) {
          const bedBlock = (x === 2 && z === 2) ? "minecraft:sea_lantern" : ((x + z) % 2 === 0 ? "minecraft:tube_coral_block" : "minecraft:brain_coral_block");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, bedBlock);
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy, z: sz + z }, "minecraft:water");
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy + 1, z: sz + z }, "minecraft:water");
        }
      }
      placeStructureChest(dimension, { x: sx + 1, y: sy, z: sz + 1 }, [
        { id: "minecraft:tube_coral_block", count: 8 },
        { id: "minecraft:brain_coral_block", count: 8 },
        { id: "minecraft:bubble_coral_block", count: 8 },
        { id: "minecraft:sea_pickle", count: 8 },
        { id: "minecraft:sponge", count: 2 },
        { id: "minecraft:heart_of_the_sea", count: 1 },
        { id: "minecraft:nautilus_shell", count: 2 }
      ]);
      try {
        spawnMobSafe(dimension, "minecraft:axolotl", { x: sx + 2.5, y: sy + 2, z: sz + 2.5 });
        mobSpawned = true;
      } catch (e) {}
      break;
    }

    case "god_altar": {
      // 30. Pantheon of the Gods (5x5 offset at cx-5, cz-5)
      const sx = cx - 5;
      const sz = cz - 5;
      const sy = cy + 1;
      for (let x = 0; x <= 4; x++) {
        for (let z = 0; z <= 4; z++) {
          safeAirOnlySetBlock(dimension, { x: sx + x, y: sy - 1, z: sz + z }, "minecraft:quartz_block");
        }
      }
      for (let y = 0; y <= 3; y++) {
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz }, "minecraft:quartz_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz }, "minecraft:quartz_pillar");
        safeAirOnlySetBlock(dimension, { x: sx, y: sy + y, z: sz + 4 }, "minecraft:quartz_pillar");
        safeAirOnlySetBlock(dimension, { x: sx + 4, y: sy + y, z: sz + 4 }, "minecraft:quartz_pillar");
      }
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy, z: sz + 2 }, "minecraft:gold_block");
      safeAirOnlySetBlock(dimension, { x: sx + 2, y: sy + 1, z: sz + 2 }, "minecraft:sea_lantern");
      placeStructureChest(dimension, { x: sx + 2, y: sy, z: sz + 1 }, [
        { id: "minecraft:netherite_ingot", count: 1 },
        { id: "minecraft:golden_apple", count: 2 },
        { id: "minecraft:diamond", count: 4 },
        { id: "minecraft:totem_of_undying", count: 1 }
      ]);
      break;
    }

    default: {
      const tr = theme.trait;
      if (tr === "village" || feat === "well") {
        const hx = cx - 4;
        const hz = cz - 4;
        const hy = cy + 1;
        for (let x = 0; x <= 3; x++) {
          for (let z = 0; z <= 3; z++) {
            safeAirOnlySetBlock(dimension, { x: hx + x, y: hy - 1, z: hz + z }, "minecraft:cobblestone");
            const isCorner = (x === 0 || x === 3) && (z === 0 || z === 3);
            const mat = isCorner ? "minecraft:oak_log" : "minecraft:oak_planks";
            for (let y = 0; y <= 2; y++) {
              safeAirOnlySetBlock(dimension, { x: hx + x, y: hy + y, z: hz + z }, mat);
            }
            safeAirOnlySetBlock(dimension, { x: hx + x, y: hy + 3, z: hz + z }, "minecraft:oak_planks");
          }
        }
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy, z: hz }, "minecraft:air");
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy + 1, z: hz }, "minecraft:air");
        safeAirOnlySetBlock(dimension, { x: hx + 2, y: hy + 1, z: hz + 3 }, "minecraft:glass_pane");
        safeAirOnlySetBlock(dimension, { x: hx + 2, y: hy, z: hz + 2 }, "minecraft:bed");
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy, z: hz + 2 }, "minecraft:crafting_table");
        safeAirOnlySetBlock(dimension, { x: hx + 2, y: hy, z: hz + 1 }, "minecraft:furnace");
        safeAirOnlySetBlock(dimension, { x: hx + 1, y: hy + 2, z: hz + 1 }, "minecraft:torch");
        placeStructureChest(dimension, { x: hx + 1, y: hy, z: hz + 1 }, [
          { id: "minecraft:emerald", count: 8 },
          { id: "minecraft:bread", count: 6 },
          { id: "minecraft:wheat_seeds", count: 8 },
          { id: "minecraft:golden_carrot", count: 4 }
        ]);
        const fx = cx + 3;
        const fz = cz - 2;
        for (let fxo = -1; fxo <= 1; fxo++) {
          for (let fzo = -1; fzo <= 1; fzo++) {
            if (fxo === 0 && fzo === 0) {
              safeAirOnlySetBlock(dimension, { x: fx + fxo, y: cy, z: fz + fzo }, "minecraft:water");
            } else {
              safeAirOnlySetBlock(dimension, { x: fx + fxo, y: cy, z: fz + fzo }, "minecraft:farmland");
              safeAirOnlySetBlock(dimension, { x: fx + fxo, y: cy + 1, z: fz + fzo }, (fxo + fzo) % 2 === 0 ? "minecraft:wheat" : "minecraft:carrots");
            }
          }
        }
        safeAirOnlySetBlock(dimension, { x: cx + 2, y: cy + 1, z: cz + 3 }, "minecraft:oak_fence");
        safeAirOnlySetBlock(dimension, { x: cx + 2, y: cy + 2, z: cz + 3 }, "minecraft:bell");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: cy + 1, z: cz + 3 }, "minecraft:hay_block");
        safeAirOnlySetBlock(dimension, { x: cx + 3, y: cy + 2, z: cz + 3 }, "minecraft:hay_block");
        try {
          spawnMobSafe(dimension, "minecraft:villager_v2", { x: hx + 1.5, y: hy, z: hz + 1.5 });
          mobSpawned = true;
        } catch (ve) {}
      } else if (tr === "animals") {
        const px = cx - 3;
        const pz = cz + 3;
        safeAirOnlySetBlock(dimension, { x: px - 1, y: cy + 1, z: pz - 1 }, "minecraft:cauldron");
        safeAirOnlySetBlock(dimension, { x: px + 1, y: cy + 1, z: pz - 1 }, "minecraft:hay_block");
        safeAirOnlySetBlock(dimension, { x: px, y: cy + 1, z: pz + 2 }, "minecraft:carved_pumpkin");
        placeStructureChest(dimension, { x: px, y: cy + 1, z: pz }, [
          { id: "minecraft:wheat", count: 8 },
          { id: "minecraft:lead", count: 2 },
          { id: "minecraft:saddle", count: 1 }
        ]);
      } else if (tr === "water_spring") {
        const wx = cx - 3;
        const wz = cz - 2;
        safeAirOnlySetBlock(dimension, { x: wx, y: cy, z: wz }, "minecraft:water");
        safeAirOnlySetBlock(dimension, { x: wx - 1, y: cy, z: wz }, "minecraft:water");
        safeAirOnlySetBlock(dimension, { x: wx - 2, y: cy, z: wz }, "minecraft:water");
        for (let yDrop = 0; yDrop <= 5; yDrop++) {
          safeAirOnlySetBlock(dimension, { x: wx - 3, y: cy - yDrop, z: wz }, "minecraft:water");
        }
        safeAirOnlySetBlock(dimension, { x: wx, y: cy + 1, z: wz + 1 }, "minecraft:reeds");
        safeAirOnlySetBlock(dimension, { x: wx, y: cy + 2, z: wz + 1 }, "minecraft:reeds");
        safeAirOnlySetBlock(dimension, { x: wx - 1, y: cy + 1, z: wz }, "minecraft:waterlily");
      } else if (tr === "lava_spring") {
        const lx = cx - 2;
        const lz = cz - 3;
        safeAirOnlySetBlock(dimension, { x: lx, y: cy, z: lz }, "minecraft:lava");
        safeAirOnlySetBlock(dimension, { x: lx - 1, y: cy, z: lz }, "minecraft:magma");
        safeAirOnlySetBlock(dimension, { x: lx + 1, y: cy, z: lz }, "minecraft:magma");
        safeAirOnlySetBlock(dimension, { x: lx, y: cy, z: lz - 1 }, "minecraft:crying_obsidian");
        for (let yDrop = 0; yDrop <= 6; yDrop++) {
          safeAirOnlySetBlock(dimension, { x: lx, y: cy - yDrop, z: lz - 2 }, "minecraft:lava");
        }
      } else if (tr === "ore_rich") {
        const mx = cx + 3;
        const mz = cz - 3;
        safeAirOnlySetBlock(dimension, { x: mx, y: cy + 1, z: mz }, "minecraft:raw_iron_block");
        safeAirOnlySetBlock(dimension, { x: mx + 1, y: cy + 1, z: mz }, "minecraft:gold_ore");
        safeAirOnlySetBlock(dimension, { x: mx, y: cy + 2, z: mz }, "minecraft:diamond_ore");
        safeAirOnlySetBlock(dimension, { x: mx + 1, y: cy + 2, z: mz }, "minecraft:raw_gold_block");
        safeAirOnlySetBlock(dimension, { x: mx - 1, y: cy + 1, z: mz }, "minecraft:anvil");
        safeAirOnlySetBlock(dimension, { x: mx - 1, y: cy + 1, z: mz + 1 }, "minecraft:rail");
        safeAirOnlySetBlock(dimension, { x: mx, y: cy + 1, z: mz + 1 }, "minecraft:rail");
      } else if (tr === "dungeon") {
        const dx = cx - 3;
        const dz = cz + 2;
        for (let x = -1; x <= 1; x++) {
          for (let z = -1; z <= 1; z++) {
            safeAirOnlySetBlock(dimension, { x: dx + x, y: cy, z: dz + z }, Math.random() < 0.5 ? "minecraft:mossy_cobblestone" : "minecraft:cracked_stone_bricks");
          }
        }
        safeAirOnlySetBlock(dimension, { x: dx - 1, y: cy + 1, z: dz - 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx + 1, y: cy + 1, z: dz - 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx - 1, y: cy + 1, z: dz + 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx + 1, y: cy + 1, z: dz + 1 }, "minecraft:iron_bars");
        safeAirOnlySetBlock(dimension, { x: dx, y: cy + 1, z: dz }, "minecraft:chiseled_stone_bricks");
        safeAirOnlySetBlock(dimension, { x: dx, y: cy + 2, z: dz }, "minecraft:web");
        placeStructureChest(dimension, { x: dx, y: cy + 1, z: dz + 1 }, [
          { id: "minecraft:iron_ingot", count: 6 },
          { id: "minecraft:gunpowder", count: 8 },
          { id: "minecraft:string", count: 8 }
        ]);
        if (theme.mob) {
          try {
            spawnMobSafe(dimension, theme.mob, { x: dx + 0.5, y: cy + 1, z: dz + 0.5 });
            mobSpawned = true;
          } catch (me) {}
        }
      }
      break;
    }
  }

  return mobSpawned;
}
