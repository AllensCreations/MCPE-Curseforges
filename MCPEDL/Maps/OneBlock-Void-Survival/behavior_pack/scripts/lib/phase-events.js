import { ItemStack, system, world } from "@minecraft/server";
import { activeLuckyRush, activeCountdowns, ONEBLOCK_POS, lastProgressTick, TUTORIAL_BLOCKS } from "./config.js";
import { spawnOneBlockChest, getPhasesForDim, pickWeighted, getDimensionState } from "./helpers.js";
import { materializeIsland, checkRandomIslandSpawn } from "./island-spawn.js";
import { ISLAND_THEMES } from "./island-themes.js";

function spawnCelebrationFireworks(dimension) {
  try {
    for (let i = 0; i < 5; i++) {
      system.runTimeout(() => {
        try {
          const offsetX = (Math.random() - 0.5) * 4;
          const offsetZ = (Math.random() - 0.5) * 4;
          dimension.spawnEntity("minecraft:fireworks_rocket", {
            x: 0.5 + offsetX,
            y: 66.0,
            z: 0.5 + offsetZ
          });
        } catch (e) {}
      }, i * 15);
    }
  } catch (e) {}
}

// Spawn Phase Climax Mini-Boss strictly in Late-Game (Phase 10+ in Overworld, or Nether/End)
function spawnPhaseMiniBoss(dimKey, dimension, phaseIndex) {
  try {
    // Completely skip mini-bosses for the first 10 phases of Overworld (Phases 0 to 9 are peaceful / exploration focused!)
    if (dimKey === "overworld" && phaseIndex < 10) {
      return;
    }

    let bossType = "minecraft:zombie";
    let bossName = "§c§lZombie King§r";

    if (dimKey === "nether") {
      bossType = "minecraft:wither_skeleton";
      bossName = "§4§lWither Skeleton Warlord§r";
    } else if (dimKey === "end") {
      bossType = "minecraft:enderman";
      bossName = "§5§lVoid Assassin§r";
    } else {
      // Alternate Zombie King, Skeleton Captain, or Breeze in Late Overworld
      if (Math.random() < 0.5) {
        bossType = "minecraft:skeleton";
        bossName = "§c§lSkeleton Captain§r";
      }
    }

    const boss = dimension.spawnEntity(bossType, { x: 0.5, y: 65.0, z: 0.5 });
    boss.nameTag = bossName;
    boss.clearVelocity();

    dimension.spawnParticle("minecraft:huge_explosion_emitter", { x: 0.5, y: 65.0, z: 0.5 });
    dimension.playSound("mob.enderdragon.growl", { x: 0.5, y: 65.0, z: 0.5 }, { volume: 1.0, pitch: 0.8 });

    for (const p of world.getAllPlayers()) {
      p.sendMessage(`§c§l[PHASE CLIMAX] §4A ${bossName} §4burst from the OneBlock! Defeat it!`);
    }
  } catch (err) {}
}

// Start Lucky Rush event (10 seconds)
export function triggerLuckyRush(dimKey, dimension) {
  if (activeLuckyRush.get(dimKey)) return;
  activeLuckyRush.set(dimKey, 10);

  for (const p of world.getAllPlayers()) {
    p.onScreenDisplay.setTitle("§6§l★ LUCKY RUSH! ★", {
      stayDuration: 60,
      fadeInDuration: 5,
      fadeOutDuration: 10,
      subtitle: "§e10s of Golden Mineral Spawns!"
    });
    p.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });
  }

  let timer = 10;
  const loop = system.runInterval(() => {
    timer--;
    activeLuckyRush.set(dimKey, timer);

    try {
      dimension.spawnParticle("minecraft:villager_happy", { x: 0.5, y: 65.5, z: 0.5 });
    } catch (e) {}

    if (timer <= 0) {
      system.clearRun(loop);
      activeLuckyRush.delete(dimKey);
      for (const p of world.getAllPlayers()) {
        p.sendMessage("§6[Lucky Rush] §eThe Lucky Rush event has concluded!");
      }
    }
  }, 20);
}

// Start Void Surge event (10 seconds dark particles + lightning sound + hostile waves)
export function triggerVoidSurge(dimKey, dimension) {
  for (const p of world.getAllPlayers()) {
    p.onScreenDisplay.setTitle("§5§l⚡ VOID SURGE! ⚡", {
      stayDuration: 60,
      fadeInDuration: 5,
      fadeOutDuration: 10,
      subtitle: "§cSurvive the dark rift!"
    });
    p.playSound("ambient.weather.thunder", { pitch: 0.9, volume: 1.0 });
  }

  let surgeTimer = 10;
  const surgeLoop = system.runInterval(() => {
    surgeTimer -= 2;

    try {
      dimension.spawnParticle("minecraft:portal_particle", { x: 0.5, y: 65.5, z: 0.5 });
      dimension.playSound("ambient.weather.lightning.impact", { x: 0.5, y: 65.0, z: 0.5 }, { volume: 0.8, pitch: 1.0 });

      // Spawn surge hostile mob
      const mobPool = dimKey === "nether" ? ["minecraft:piglin_brute", "minecraft:magma_cube"] : ["minecraft:spider", "minecraft:zombie", "minecraft:skeleton"];
      const chosenMob = mobPool[Math.floor(Math.random() * mobPool.length)];
      const mob = dimension.spawnEntity(chosenMob, { x: 0.5, y: 65.0, z: 0.5 });
      mob.clearVelocity();
    } catch (e) {}

    if (surgeTimer <= 0) {
      system.clearRun(surgeLoop);
      for (const p of world.getAllPlayers()) {
        p.sendMessage("§5[Void Surge] §aThe dark rift has sealed! Island is safe again.");
      }
    }
  }, 40);
}

// Trigger Jackpot Geode Chest
export function triggerJackpot(dimension) {
  try {
    const jackpotMinerals = ["minecraft:diamond_block", "minecraft:emerald_block", "minecraft:iron_block", "minecraft:gold_block"];
    const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 mineral blocks
    const items = [];
    for (let i = 0; i < count; i++) {
      const mineralId = jackpotMinerals[Math.floor(Math.random() * jackpotMinerals.length)];
      items.push(new ItemStack(mineralId, 1));
    }
    spawnOneBlockChest(dimension, items);
    dimension.spawnParticle("minecraft:totem_particle", { x: 0.5, y: 65.5, z: 0.5 });
    dimension.playSound("ui.toast.challenge_complete", { x: 0.5, y: 65.0, z: 0.5 }, { volume: 1.0, pitch: 1.2 });

    for (const p of world.getAllPlayers()) {
      p.onScreenDisplay.setTitle("§e§lJACKPOT CHEST!§r", {
        stayDuration: 60,
        fadeInDuration: 5,
        fadeOutDuration: 10,
        subtitle: `§aUncovered ${count}x Precious Mineral Blocks in a Chest!`
      });
    }
  } catch (err) {}
}

function startPhaseTransition(dimKey, dimension, newPhaseIdx, isGameComplete) {
  const phases = getPhasesForDim(dimKey);
  const nextPhase = phases[newPhaseIdx];

  activeCountdowns.set(dimKey, true);

  try {
    const ob = dimension.getBlock(ONEBLOCK_POS);
    if (ob) ob.setType("minecraft:bedrock");
  } catch (e) {}

  let secondsLeft = 5;

  const timerId = system.runInterval(() => {
    // Keep bedrock locked firmly at (0,64,0) throughout the entire countdown
    try {
      const ob = dimension.getBlock(ONEBLOCK_POS);
      if (ob && ob.typeId !== "minecraft:bedrock") {
        ob.setType("minecraft:bedrock");
      }
    } catch (be) {}

    if (secondsLeft > 0) {
      for (const p of world.getAllPlayers()) {
        try {
          p.onScreenDisplay.setTitle(`§c§l${secondsLeft}`, {
            stayDuration: 20,
            fadeInDuration: 0,
            fadeOutDuration: 10,
            subtitle: `§ePhase Advancing in...`
          });
          p.playSound("note.pling", { pitch: 1.0 + (5 - secondsLeft) * 0.2, volume: 1.0 });
        } catch (e) {}
      }
      secondsLeft--;
    } else {
      system.clearRun(timerId);
      activeCountdowns.delete(dimKey);

      try {
        const ob = dimension.getBlock(ONEBLOCK_POS);
        if (ob) {
          const chosen = pickWeighted(nextPhase.blocks);
          ob.setType(chosen.id);
        }
      } catch (e) {}

      spawnCelebrationFireworks(dimension);

      if (isGameComplete) {
        for (const p of world.getAllPlayers()) {
          try {
            p.addTag("void_champion");
            p.nameTag = `§6[Void Champion] §f${p.name}`;
            p.onScreenDisplay.setTitle("§6§lCONGRATULATIONS!", {
              stayDuration: 140,
              fadeInDuration: 10,
              fadeOutDuration: 20,
              subtitle: "§a§lPRESTIGE TITLE UNLOCKED: VOID CHAMPION!§r"
            });
            p.sendMessage("\n§6==================================================");
            p.sendMessage("§e★ §6§lCONGRATULATIONS! YOU HAVE CONQUERED ALL PHASES! §e★");
            p.sendMessage("§fThank you so much for playing this map!");
            p.sendMessage("§aYou have earned the permanent prestige title: §6[Void Champion]§a!");
            p.sendMessage("§bCreator: §eAllensCreations");
            p.sendMessage("§aPlease support the game by downloading & rating on §6MCPEDL.COM§a!");
            p.sendMessage("§6==================================================\n");
            p.playSound("ui.toast.challenge_complete", { pitch: 1.0, volume: 1.0 });
          } catch (e) {}
        }
      } else {
        for (const p of world.getAllPlayers()) {
          try {
            p.onScreenDisplay.setTitle(`§a§lPHASE ${newPhaseIdx + 1}!`, {
              stayDuration: 80,
              fadeInDuration: 10,
              fadeOutDuration: 15,
              subtitle: `§6${nextPhase.name}`
            });
            p.sendMessage(`§d§l[OneBlocked] §eCongratulations! Reached §aPhase ${newPhaseIdx + 1}: ${nextPhase.name}§e! §7(by §bAllensCreations§7)`);
            p.playSound("random.levelup", { pitch: 1.0, volume: 1.0 });
          } catch (e) {}
        }
      }
    }
  }, 20);
}

export function incrementDimensionCount(dimKey, dimension) {
  const countProp = `ob_${dimKey}_count`;
  const prevState = getDimensionState(dimKey);
  const prevCount = prevState.count;
  const newCount = prevCount + 1;
  world.setDynamicProperty(countProp, newCount);
  lastProgressTick.set(dimKey, system.currentTick);

  const newState = getDimensionState(dimKey);
  const phases = getPhasesForDim(dimKey);

  // 1. Tutorial Step 15 Completion & Normal Starter Island Introduction:
  if (dimKey === "overworld" && prevCount === TUTORIAL_BLOCKS.length - 1 && newCount === TUTORIAL_BLOCKS.length) {
    // Solidify and lock bedrock anchor directly below OneBlock at (0, 63, 0)
    try {
      const bBedrock = dimension.getBlock({ x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z });
      if (bBedrock) bBedrock.setType("minecraft:bedrock");
    } catch (be) {}

    // Celebrate tutorial completion with celestial title and audio cues
    for (const p of world.getAllPlayers()) {
      try {
        p.onScreenDisplay.setTitle("§a§l★ TUTORIAL COMPLETE ★§r", {
          subtitle: "§eWelcome to OneBlock Void! Your journey begins now.",
          fadeInDuration: 10,
          stayDuration: 85,
          fadeOutDuration: 20
        });
        p.sendMessage("\n§a§l[OneBlock] ★ TUTORIAL COMPLETED! ★§r");
        p.sendMessage("§eBedrock anchor permanently solidified beneath your feet at §6(0, 63, 0)§e.");
        p.sendMessage("§bAn introductory floating island §a§lLush Floral Oasis§r §bhas materialized in the distance!\n");
        p.playSound("ui.toast.challenge_complete", { pitch: 1.0, volume: 1.0 });
      } catch (pe) {}
    }

    // Materialize Theme 0 ("sky_oasis" Lush Floral Oasis) as introductory normal island after tutorial celebration
    if (!world.getDynamicProperty("island_spawned_sky_oasis")) {
      world.setDynamicProperty("island_spawned_sky_oasis", true);
      system.runTimeout(() => {
        try {
          materializeIsland(dimension, ISLAND_THEMES[0], 0, newCount);
        } catch (me) {}
      }, 70);
    }
  }

  // 2. Stronghold End Chamber Milestone (Overworld Ring 4):
  // Automatically manifests when reaching Phase 11+ or Nether mined blocks >= 250
  const netherMined = world.getDynamicProperty("ob_nether_count") ?? 0;
  if (dimKey === "overworld" && (newState.phaseIndex >= 11 || netherMined >= 250)) {
    if (!world.getDynamicProperty("island_spawned_stronghold_portal")) {
      const strongholdTheme = ISLAND_THEMES.find(t => t.id === "stronghold_portal");
      if (strongholdTheme) {
        world.setDynamicProperty("island_spawned_stronghold_portal", true);
        materializeIsland(dimension, strongholdTheme, newState.phaseIndex, newCount);
        for (const p of world.getAllPlayers()) {
          try {
            p.onScreenDisplay.setTitle("§5§l✦ END PORTAL DUNGEON ✦§r", {
              subtitle: "§dThe Stronghold End Chamber has materialized in Ring 4!",
              fadeInDuration: 10,
              stayDuration: 90,
              fadeOutDuration: 20
            });
            p.sendMessage("\n§5§l★ LEGENDARY DUNGEON DISCOVERED ★§r");
            p.sendMessage("§dThe §5§lStronghold End Chamber§r §dhas materialized in the deep void!");
            p.sendMessage("§eFollow the starlight trail in Ring 4 to locate the 12-frame End Portal!\n");
            p.playSound("ui.toast.challenge_complete", { pitch: 0.9, volume: 1.0 });
          } catch (pe) {}
        }
      }
    }
  }

  // Random Chance Island Materialization with Pity Timer in current dimension
  checkRandomIslandSpawn(dimension, newState.phaseIndex, newCount);

  // Check if phase climax was just reached
  if (newState.phaseIndex > prevState.phaseIndex) {
    spawnPhaseMiniBoss(dimKey, dimension, newState.phaseIndex);
    startPhaseTransition(dimKey, dimension, newState.phaseIndex, false);
  } else if (dimKey === "end" && newState.phaseIndex === phases.length - 1 &&
             newState.progressInPhase === newState.currentPhaseLength &&
             !world.getDynamicProperty("game_complete")) {
    // Victory only when the final End phase is actually completed
    world.setDynamicProperty("game_complete", true);
    startPhaseTransition(dimKey, dimension, newState.phaseIndex, true);
  }

  // Check global island milestones
  const milestones = [
    { target: 500, title: "500 BLOCKS MINED!" },
    { target: 1000, title: "1,000 BLOCKS MINED!" },
    { target: 2000, title: "2,000 BLOCKS MINED!" },
    { target: 5000, title: "5,000 BLOCKS MINED!" }
  ];
  for (const m of milestones) {
    if (newCount === m.target) {
      for (const p of world.getAllPlayers()) {
        p.onScreenDisplay.setTitle(`§e★ ${m.title} ★`, {
          stayDuration: 80,
          fadeInDuration: 10,
          fadeOutDuration: 10,
          subtitle: `§6Global Island Milestone Reached!`
        });
        p.playSound("ui.toast.challenge_complete", { pitch: 1.0, volume: 1.0 });
      }
      break;
    }
  }

  return { newCount, newPhaseIdx: newState.phaseIndex };
}
