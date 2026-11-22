import { ItemStack, system, world } from "@minecraft/server";
import { setupAdminStation, summonAllIslandsAdmin, toggleAdminAutoBreak, openAdminIslandMenu, summonNextIslandAdmin, isAutoBreakRunning } from "./admin.js";
import { ONEBLOCK_POS, activeCountdowns, SURROUNDING_OFFSETS, TUTORIAL_BLOCKS, activeLuckyRush, lastKnownOneBlockType, CHEST_CHANCE, MOB_CHANCE, LUCKY_RUSH_CHANCE, VOID_SURGE_CHANCE, JACKPOT_CHANCE, isAdmin, BASE_MODE, IS_ADMIN_BUILD, advanceTick, tickCounter } from "./config.js";
import { getDimKey, getDimensionState, spawnOneBlockChest, pickWeighted, getPlayerDims } from "./helpers.js";
import { handleIslandOneBlockBreak } from "./island-core.js";
import { materializeIsland } from "./island-spawn.js";
import { ISLAND_THEMES } from "./island-themes.js";
import { ensureOneBlock, renewOneBlock, clearScoreboardObjective } from "./oneblock.js";
import { triggerLuckyRush, triggerVoidSurge, triggerJackpot, incrementDimensionCount } from "./phase-events.js";
import { dimensionShifterState, getRandomInterval, clearShifterStall, tickDimensionShifters } from "./shifter.js";

// Entity hurt event: if Dimension Shifter is attacked or damaged, vanish instantly
export function onEntityHurt(event) {
  const { hurtEntity } = event;
  if (hurtEntity.hasTag("dimension_shifter")) {
    system.run(() => {
      try {
        const dimKey = getDimKey(hurtEntity.dimension.id);
        const state = dimensionShifterState[dimKey];
        if (state) {
          state.isPresent = false;
          state.nextVisitIn = getRandomInterval();
          clearShifterStall(dimKey);
        }
        hurtEntity.dimension.playSound("mob.endermen.portal", hurtEntity.location, { volume: 1.0, pitch: 0.8 });
        hurtEntity.remove();

        for (const p of world.getAllPlayers()) {
          p.sendMessage(`§c[Dimension Shifter] The Dimension Shifter was harmed and fled into the rift!`);
        }
      } catch (e) {}
    });
  }
}

// Handle block destruction via playerBreakBlock afterEvent
export function onPlayerBreakBlock(event) {
  const { block, player, dimension } = event;
  const { x, y, z } = block.location;

  if (x !== ONEBLOCK_POS.x || y !== ONEBLOCK_POS.y || z !== ONEBLOCK_POS.z) {
    handleIslandOneBlockBreak(dimension, block.location, player);
    return;
  }

  const dimKey = getDimKey(dimension.id);
  if (activeCountdowns.get(dimKey)) return;

  const state = getDimensionState(dimKey);
  const phase = state.phase;

  // Auto-elevation teleport strictly during the first 8 Dirts (steps 0 to 7) to ensure player never clips through while the perimeter auto-builds
  if (player && dimKey === "overworld" && state.count < SURROUNDING_OFFSETS.length) {
    const pLoc = player.location;
    if (Math.abs(pLoc.x - 0.5) < 0.9 && Math.abs(pLoc.z - 0.5) < 0.9 && pLoc.y < 65.1 && pLoc.y >= 63.8) {
      system.run(() => {
        try {
          player.teleport(
            { x: pLoc.x, y: 65.0, z: pLoc.z },
            { dimension: dimension, checkForBlocks: false }
          );
          player.clearVelocity();
        } catch (err) {}
      });
    }
  }

  // Determine next block to regenerate:
  let nextBlockType;
  if (dimKey === "overworld" && state.count < TUTORIAL_BLOCKS.length) {
    const tutorialStep = TUTORIAL_BLOCKS[state.count];

    // Automated platform placement for the first 8 Dirts (steps 0 to 7)
    if (state.count < SURROUNDING_OFFSETS.length) {
      const offset = SURROUNDING_OFFSETS[state.count];
      system.run(() => {
        try {
          const sideBlock = dimension.getBlock({ x: offset.x, y: 64, z: offset.z });
          if (sideBlock && sideBlock.isAir) {
            sideBlock.setType("minecraft:dirt");
            dimension.spawnParticle("minecraft:villager_happy", { x: offset.x + 0.5, y: 64.5, z: offset.z + 0.5 });
            dimension.playSound("dig.gravel", { x: offset.x, y: 64, z: offset.z }, { volume: 0.8, pitch: 1.2 });
          }
        } catch (err) {}
      });
    }

    // Clean, small on-screen guidance
    for (const p of world.getAllPlayers()) {
      p.onScreenDisplay.setActionBar(`§e${tutorialStep.msg}`);
      p.sendMessage(tutorialStep.msg);
      p.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
    }

    // At final step (completion), spawn a Starter Reward Chest with 2 Ice blocks and 1 Lava Bucket
    if (state.count === TUTORIAL_BLOCKS.length - 1) {
      try {
        const iceGift = new ItemStack("minecraft:ice", 2);
        const lavaGift = new ItemStack("minecraft:lava_bucket", 1);
        spawnOneBlockChest(dimension, [iceGift, lavaGift], "§b§l★ Starter Gift Chest ★§r");
        for (const p of world.getAllPlayers()) {
          p.sendMessage("§b[Starter Gift] §aA Starter Gift Chest appeared with 2x Ice Blocks & 1x Lava Bucket! Create infinite water & cobblestone generators!");
        }
        if (player) {
          system.run(() => {
            try {
              const pLoc = player.location;
              if (Math.abs(pLoc.x - 0.5) < 0.8 && Math.abs(pLoc.z - 0.5) < 0.8) {
                player.teleport({ x: 0.5, y: 65.0, z: -1.0 }, { dimension: dimension, checkForBlocks: false });
              }
            } catch (err) {}
          });
        }
      } catch (err) {}
    }

    if (state.count + 1 < TUTORIAL_BLOCKS.length) {
      nextBlockType = TUTORIAL_BLOCKS[state.count + 1].block;
    } else {
      nextBlockType = pickWeighted(phase.blocks).id;
    }
  } else if (activeLuckyRush.get(dimKey)) {
    const luckyBlocks = ["minecraft:gold_ore", "minecraft:iron_ore", "minecraft:diamond_ore", "minecraft:emerald_ore", "minecraft:lapis_ore"];
    nextBlockType = luckyBlocks[Math.floor(Math.random() * luckyBlocks.length)];
  } else {
    nextBlockType = pickWeighted(phase.blocks).id;
  }

  try {
    const targetBlock = dimension.getBlock(ONEBLOCK_POS);
    if (targetBlock && !activeCountdowns.get(dimKey)) {
      targetBlock.setType(nextBlockType);
      lastKnownOneBlockType[dimKey] = nextBlockType;
      if (targetBlock.isAir || targetBlock.typeId === "minecraft:air") {
        targetBlock.setType(dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt"));
      }
    }
  } catch (e) {}

  system.run(() => {
    try {
      // Ensure bedrock foundation directly below OneBlock
      const bFloor = dimension.getBlock({ x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z });
      if (bFloor && bFloor.typeId !== "minecraft:bedrock") {
        bFloor.setType("minecraft:bedrock");
      }

      const targetBlock = dimension.getBlock(ONEBLOCK_POS);
      if (targetBlock && !activeCountdowns.get(dimKey)) {
        targetBlock.setType(nextBlockType);
        lastKnownOneBlockType[dimKey] = nextBlockType;
      }
    } catch (e) {}
  });

  // Ensure drops never fall: teleport all item entities around (0, 64, 0) to hover safely atop the block
  system.runTimeout(() => {
    try {
      const nearbyItems = dimension.getEntities({
        type: "minecraft:item",
        location: { x: 0.5, y: 64.5, z: 0.5 },
        maxDistance: 2.5
      });
      for (const itemEnt of nearbyItems) {
        // For the first 8 dirts (steps 0 to 7), the dirt went into building the platform, so remove the dropped dirt item
        if (dimKey === "overworld" && state.count < SURROUNDING_OFFSETS.length) {
          try {
            const itemStack = itemEnt.getComponent("minecraft:item")?.itemStack;
            if (itemStack && itemStack.typeId === "minecraft:dirt") {
              itemEnt.remove();
              continue;
            }
          } catch (ie) {}
        }
        itemEnt.teleport({ x: 0.5, y: 65.2, z: 0.5 });
        itemEnt.clearVelocity();
      }

      // Also ensure player didn't pick up the dirt instantly on break
      if (dimKey === "overworld" && state.count < SURROUNDING_OFFSETS.length && player) {
        try {
          const inv = player.getComponent("minecraft:inventory")?.container;
          if (inv) {
            for (let s = 0; s < inv.size; s++) {
              const it = inv.getItem(s);
              if (it && it.typeId === "minecraft:dirt") {
                if (it.amount > 1) {
                  it.amount -= 1;
                  inv.setItem(s, it);
                } else {
                  inv.setItem(s, undefined);
                }
                break;
              }
            }
          }
        } catch (pe) {}
      }
    } catch (err) {}
  }, 1);

  // Pure Vanilla Block Drops: do not spawn an artificial duplicate item!
  // The block broken naturally drops its vanilla items (dirt drops dirt, stone drops cobblestone, coal ore drops coal with fortune/silk-touch).

  // Mid-Phase Events: strictly trigger in the middle window (30% to 70% of the phase)
  // Suppress all random events during Tutorial and early starter phases (Phases 0 to 3) in Overworld
  const isEarlyGame = (dimKey === "overworld" && (state.count < TUTORIAL_BLOCKS.length || state.phaseIndex <= 3));
  const minMid = Math.floor(state.currentPhaseLength * 0.3);
  const maxMid = Math.floor(state.currentPhaseLength * 0.7);
  if (!isEarlyGame && state.progressInPhase >= minMid && state.progressInPhase <= maxMid) {
    const roll = Math.random();

    if (roll < CHEST_CHANCE) {
      // Spawn a real mystery loot chest on the OneBlock!
      const itemsToPut = [];
      const numItems = Math.floor(Math.random() * 3) + 2; // 2 to 4 unique items
      for (let i = 0; i < numItems; i++) {
        const reward = pickWeighted(phase.chests);
        const count = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
        try {
          itemsToPut.push(new ItemStack(reward.id, count));
        } catch (ie) {}
      }
      spawnOneBlockChest(dimension, itemsToPut, "§6§l★ Mystery Chest ★§r");
      player.sendMessage("§6[OneBlock] §e★ A Mystery Entity Chest has appeared! Open it for phase loot! ★");
      player.playSound("random.chestopen", { pitch: 1.0, volume: 1.0 });
    } else if (roll < CHEST_CHANCE + MOB_CHANCE && phase.mobs && phase.mobs.length > 0) {
      const mobId = phase.mobs[Math.floor(Math.random() * phase.mobs.length)];
      try {
        const mob = dimension.spawnEntity(mobId, { x: 0.5, y: 65.0, z: 0.5 });
        mob.clearVelocity();
        player.playSound("random.orb", { pitch: 1.0, volume: 1.0 });
      } catch (err) {}
    } else if (roll < CHEST_CHANCE + MOB_CHANCE + LUCKY_RUSH_CHANCE) {
      triggerLuckyRush(dimKey, dimension);
    } else if (roll < CHEST_CHANCE + MOB_CHANCE + LUCKY_RUSH_CHANCE + VOID_SURGE_CHANCE) {
      triggerVoidSurge(dimKey, dimension);
    } else if (roll < CHEST_CHANCE + MOB_CHANCE + LUCKY_RUSH_CHANCE + VOID_SURGE_CHANCE + JACKPOT_CHANCE) {
      triggerJackpot(dimension);
    } else if (Math.random() < 0.001) {
      // 0.1% chance: Ancient Enchantment Relic inside a treasure chest
      try {
        const book = new ItemStack("minecraft:enchanted_book", 1);
        book.nameTag = "§6§lAncient Enchantment Relic§r";
        spawnOneBlockChest(dimension, [book], "§6§l★ Ancient Relic Chest ★§r");
        player.sendMessage("§6[OneBlock] §e★ A RELIC ENTITY CHEST APPEARED WITH AN ANCIENT ENCHANTED BOOK! ★");
        player.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
      } catch (e) {}
    } else if (Math.random() < 0.001) {
      // 0.1% chance: Ancient Totem of Undying inside a chest
      try {
        const totem = new ItemStack("minecraft:totem_of_undying", 1);
        spawnOneBlockChest(dimension, [totem], "§e§l★ Sacred Totem Chest ★§r");
        player.sendMessage("§e[OneBlock] §a★ A Sacred Entity Chest appeared with an Ancient Totem of Undying! ★");
        player.playSound("random.totem", { pitch: 1.0, volume: 1.0 });
      } catch (e) {}
    } else if (dimKey === "end" && Math.random() < 0.001) {
      // 0.1% chance in The End: Dragon Egg trophy inside a chest
      try {
        const egg = new ItemStack("minecraft:dragon_egg", 1);
        spawnOneBlockChest(dimension, [egg], "§5§l★ Dragon Egg Trophy Chest ★§r");
        player.sendMessage("§5[OneBlock] §d★ AN ENDER DRAGON EGG TROPHY ENTITY CHEST HAS APPEARED! ★");
        player.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
      } catch (e) {}
    }
  }

  incrementDimensionCount(dimKey, dimension);
}

// Portal Arrival Platform & Ender Dragon Bedrock Altar at (0,64,0) in The End
export function onPlayerDimensionChange(event) {
  const { player, toDimension } = event;
  const dimKey = getDimKey(toDimension.id);

  if (dimKey === "nether" || dimKey === "end") {
    system.run(() => {
      try {
        const padMaterial = dimKey === "nether" ? "minecraft:nether_brick" : "minecraft:end_bricks";
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const loc = { x: dx, y: 63, z: dz };
            const b = toDimension.getBlock(loc);
            if (b && b.isAir) {
              b.setType(padMaterial);
            }
          }
        }
        ensureOneBlock(toDimension);

        // Dragon Altar structure in The End (Bedrock frame anchor at 0,60,0)
        if (dimKey === "end") {
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
                const b = toDimension.getBlock({ x: dx, y: 63, z: dz });
                if (b && b.isAir) b.setType("minecraft:obsidian");
              }
            }
          }
        }

        const pLoc = player.location;
        const dist = Math.hypot(pLoc.x, pLoc.z);
        if (dist > 5) {
          player.sendMessage(`§e§l[OneBlock Guide] §aWelcome to the ${dimKey === "nether" ? "Nether" : "The End"}!`);
          player.sendMessage(`§6➤ Your Dimension OneBlock is waiting at coordinates: §bX: 0, Y: 64, Z: 0`);
          player.sendMessage(`§7Bridge toward (0, 64, 0) to find your infinite block!`);
        }
      } catch (err) {}
    });
  } else if (dimKey === "overworld") {
    system.run(() => {
      try {
        const netherMined = world.getDynamicProperty("ob_nether_count") ?? 0;
        if (netherMined >= 250 && !world.getDynamicProperty("island_spawned_stronghold_portal")) {
          const strongholdTheme = ISLAND_THEMES.find(t => t.id === "stronghold_portal");
          if (strongholdTheme) {
            world.setDynamicProperty("island_spawned_stronghold_portal", true);
            const owState = getDimensionState("overworld");
            materializeIsland(toDimension, strongholdTheme, owState.phaseIndex, owState.count);
            player.sendMessage("\n§5§l★ LEGENDARY DUNGEON DISCOVERED ★§r");
            player.sendMessage("§dReturning from the Nether has awakened the §5§lStronghold End Chamber§r §din the Overworld void!");
            player.sendMessage("§eFollow the starlight trail in Ring 4 to locate the 12-frame End Portal!\n");
          }
        }
      } catch (err) {}
    });
  }
}

// Wandering Trader Arrival Notification
export function onEntitySpawn(event) {
  try {
    const entity = event.entity;
    if (entity && entity.typeId === "minecraft:wandering_trader" && !entity.hasTag("dimension_shifter")) {
      for (const player of world.getAllPlayers()) {
        player.sendMessage("§e★ A Wandering Trader has arrived with mystery survival goods! §7(Accepts Emeralds, Gold, & Diamonds)");
        player.playSound("mob.villager.idle", { pitch: 1.1, volume: 1.0 });
      }
    }
  } catch (e) {}
}

// Player initial spawn & Welcome Introduction
export function onPlayerSpawn(event) {
  const { player, initialSpawn } = event;
  system.run(() => {
    try {
      // Ensure OneBlock is immediately active and renewed if air
      try {
        renewOneBlock(player.dimension);
      } catch (e) {}

      if (initialSpawn) {
        const loc = player.location;
        if (Math.abs(loc.x) < 5 && Math.abs(loc.z) < 5) {
          player.teleport({ x: 0.5, y: 65.0, z: 0.5 });
          player.clearVelocity();
        }
      }

      // Enforce the world mode on the spawning player
      if (!isAdmin(player)) {
        if (initialSpawn) {
          try {
            if (player.getGameMode && player.getGameMode() !== BASE_MODE) {
              player.setGameMode(BASE_MODE);
            }
          } catch (gme) {
            try { player.runCommand(`gamemode ${BASE_MODE} @s`); } catch (e2) {}
          }
        }
      } else {
        try { player.addTag("admin"); } catch (e) {}
        try { world.setDynamicProperty("is_admin_world", true); } catch (e) {}
      }

      // Cleanly wipe any lingering scoreboard sidebar
      clearScoreboardObjective();

      // Check if admin map or admin player: setup physical station & display zero-item control guide
      if (isAdmin(player)) {
        if (IS_ADMIN_BUILD) {
          try {
            setupAdminStation(player.dimension);
            player.setGameMode("creative");
            player.addEffect("night_vision", 999999, { showParticles: false });
            player.dimension.runCommand("weather clear");
            player.dimension.runCommand("time set noon");
          } catch (se) {}

          // Auto-manifest all 43 islands for photography on first world join
          if (!world.getDynamicProperty("admin_islands_manifested")) {
            system.runTimeout(() => {
              try {
                summonAllIslandsAdmin(player);
              } catch (me) {}
            }, 25);
          }
        }
        player.sendMessage("\n§6=== ONEBLOCK PHOTOGRAPHY & ADMIN STUDIO (ZERO ITEMS NEEDED) ===");
        player.sendMessage("§e1. Physical Buttons: §7Console at (3, 65, -2..2) right beside spawn");
        player.sendMessage("§e2. Double-Crouch: §7Double-tap Sneak anywhere to open Photo Studio & Inspector");
        player.sendMessage("§e3. Bedrock Command: §7Type §b/scriptevent ob:menu§7 or §b/scriptevent ob:all§r\n");
      }

      if (initialSpawn) {
        player.sendMessage("\n§6==================================================");
        player.sendMessage("§e★ §6§lWELCOME TO ONEBLOCK VOID SURVIVAL! §e★");
        player.sendMessage("§fThank you so much for playing my game!");
        player.sendMessage("§bCreated by: §eALNStudios");
        player.sendMessage("§aMore features & biomes to be updated soon!");
        player.sendMessage("§eLook at the floating holographic guide above the block to start!");
        player.sendMessage("§6==================================================\n");
        player.playSound("random.levelup", { pitch: 1.0, volume: 1.0 });
      }
      } catch (e) {}
    });
}

// Native Bedrock ScriptEvent hook (/scriptevent run or /scriptevent ob:run)
export function onScriptEvent(event) {
  try {
    const { id, sourceEntity } = event;
    const player = sourceEntity && sourceEntity.typeId === "minecraft:player" ? sourceEntity : null;
    if (!player || !isAdmin(player)) return;

    if (id === "run" || id === "ob:run" || id === "test:run") {
      toggleAdminAutoBreak(player);
    } else if (id === "all" || id === "ob:all" || id === "ob:summon_all") {
      summonAllIslandsAdmin(player);
    } else if (id === "menu" || id === "ob:menu" || id === "admin" || id === "ob:admin") {
      openAdminIslandMenu(player);
    } else if (id === "island" || id === "ob:island" || id === "next") {
      summonNextIslandAdmin(player);
    }
  } catch (e) {}
}

export function maintenanceTick() {
  try {
    advanceTick();

    try { tickDimensionShifters(); } catch (e) {}

    // Actionbar HUD & Gamemode Enforcement
    for (const player of world.getAllPlayers()) {
      try {
        // Actionbar HUD: Exclusively for Admin testing / when enabled
        if (isAdmin(player) && !player.hasTag("hide_hud") && !isAutoBreakRunning) {
          const dimKey = getDimKey(player.dimension.id);
          const state = getDimensionState(dimKey);
          const progressInPhase = state.progressInPhase;
          const phaseName = state.phase ? state.phase.name : "Starting";
          const dimPrefix = dimKey === "nether" ? "§c[Nether]" : (dimKey === "end" ? "§d[End]" : "§a[Overworld]");

          player.onScreenDisplay.setActionBar(
            `${dimPrefix} §ePhase ${state.phaseIndex + 1}: §f${phaseName} §7[§b${progressInPhase}§7/§b${state.currentPhaseLength}§7] §eTotal: §6${state.count}`
          );
        }
      } catch (e) {}
    }

    if (tickCounter % 2 === 0) {
      const active = getPlayerDims();
      if (active.nether) {
        try {
          const nether = world.getDimension("nether");
          if (nether) nether.spawnParticle("minecraft:endrod", { x: 0.5, y: 65.5, z: 0.5 });
        } catch (e) {}
      }
      if (active.end) {
        try {
          const end = world.getDimension("the_end");
          if (end) end.spawnParticle("minecraft:endrod", { x: 0.5, y: 65.5, z: 0.5 });
        } catch (e) {}
      }
    }
  } catch (err) {}
}
