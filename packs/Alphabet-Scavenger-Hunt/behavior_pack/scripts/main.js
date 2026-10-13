/**
 * Alphabet Scavenger Hunt Challenge
 * Bedrock Script API (@minecraft/server v1.13.0+)
 * Compatible with Minecraft Bedrock 1.21.0 - 1.26.x+
 * Created by AllensCreations
 */

import { world, system } from "@minecraft/server";

// ============================================================================
// 1. CONFIGURATION & GAME CONSTANTS
// ============================================================================

export const TOTAL_ROUNDS = 20;
export const ROUND_DURATION_SECONDS = 60;    // 60s to find the item
export const INTERMISSION_DURATION_SECONDS = 30; // 30s rest between rounds
export const HP_PENALTY_PER_FAILURE = 2;       // -2 Max HP (1 full heart) per failure
export const BASE_MAX_HEALTH = 20;            // Standard 20 HP (10 hearts)

// Balanced survival letter pool (Excludes Q, X, Z, Y, J, K, U, V)
export const FAIR_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I",
  "L", "M", "N", "O", "P", "R", "S", "T", "W"
];

// Sound IDs
const SOUND_SUCCESS = "random.levelup";
const SOUND_FAIL = "random.break";
const SOUND_CAVE = "ambient.cave";
const SOUND_COUNTDOWN = "random.click";
const SOUND_VICTORY = "ui.toast.challenge_complete";

// Bossbar identifier
const BOSSBAR_ID = "scavenger_hunt";

// Dynamic Property Keys
const PROP_PENALTY_HP = "scavenger_penalty_hp";
const PROP_ALLOWED_MAX_HP = "scavenger_allowed_max_hp";

// ============================================================================
// 2. GAME STATE MANAGEMENT
// ============================================================================

export const GameState = {
  IDLE: "IDLE",
  INTERMISSION: "INTERMISSION",
  ACTIVE: "ACTIVE",
  VICTORY: "VICTORY",
  FAILED: "FAILED"
};

class ScavengerHuntManager {
  constructor() {
    this.state = GameState.IDLE;
    this.currentRound = 0;
    this.targetLetter = "";
    this.timerSeconds = 0;
    this.lastLetter = "";
    this.autoStartCountdown = 10; // Auto-start 10s after player enters world
    this.hasAutoStarted = false;
    this.bossbarInitialized = false;
  }

  /**
   * Initializes or refreshes the native top-screen bossbar
   */
  initBossbar() {
    try {
      const overworld = world.getDimension("overworld");
      overworld.runCommand(`bossbar add ${BOSSBAR_ID} "Alphabet Scavenger Hunt"`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} players @a`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} style progress`);
      this.bossbarInitialized = true;
    } catch (e) {
      // Bossbar already registered or player not yet loaded
    }
  }

  /**
   * Updates the native top-screen bossbar
   * @param {string} title
   * @param {number} value
   * @param {number} max
   * @param {string} color (pink, blue, red, green, yellow, purple, white)
   */
  updateBossbar(title, value, max, color = "yellow") {
    try {
      const overworld = world.getDimension("overworld");
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} players @a`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} name "${title}"`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} max ${Math.max(1, max)}`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} value ${Math.max(0, value)}`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} color ${color}`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} visible true`);
    } catch (e) {
      // Dimension command fallback
    }
  }

  /**
   * Hides the native bossbar
   */
  hideBossbar() {
    try {
      const overworld = world.getDimension("overworld");
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} visible false`);
    } catch (e) {}
  }

  /**
   * Starts a brand new challenge run
   */
  startNewRun() {
    this.currentRound = 0;
    this.state = GameState.INTERMISSION;
    this.timerSeconds = 10; // 10s warmup for Round 1
    this.lastLetter = "";
    this.initBossbar();

    // Reset health penalties for all active players
    for (const player of world.getAllPlayers()) {
      this.resetPlayerPenalties(player);
      try {
        player.playSound("random.orb", { volume: 1.0, pitch: 1.0 });
      } catch (e) {}
    }

    world.sendMessage("§6§l========================================");
    world.sendMessage("§e§l   🔤 ALPHABET SCAVENGER HUNT CHALLENGE");
    world.sendMessage("§f   Find items starting with the assigned letter!");
    world.sendMessage(`§f   Survive §e${TOTAL_ROUNDS} Rounds §for suffer §cPermanent Max HP Decay§f!`);
    world.sendMessage("§6§l========================================");
  }

  /**
   * Begins an active round with a newly chosen letter
   */
  startNextRound() {
    this.currentRound++;
    if (this.currentRound > TOTAL_ROUNDS) {
      this.triggerVictory();
      return;
    }

    // Pick fair random letter without repeating the previous one
    let available = FAIR_LETTERS.filter((l) => l !== this.lastLetter);
    if (available.length === 0) available = FAIR_LETTERS;
    this.targetLetter = available[Math.floor(Math.random() * available.length)];
    this.lastLetter = this.targetLetter;

    this.state = GameState.ACTIVE;
    this.timerSeconds = ROUND_DURATION_SECONDS;

    // Sound alert
    for (const player of world.getAllPlayers()) {
      try {
        player.playSound("note.pling", { volume: 1.0, pitch: 1.2 });
      } catch (e) {}
    }

    world.sendMessage(
      `§e§l[ Round ${this.currentRound}/${TOTAL_ROUNDS} ] §fTarget Letter: §b§l[ ${this.targetLetter} ] §f— You have §c60 seconds§f!`
    );
  }

  /**
   * Marks round as successfully passed
   * @param {import("@minecraft/server").Player} player
   * @param {string} itemName
   */
  completeRound(player, itemName) {
    try {
      player.playSound(SOUND_SUCCESS, { volume: 1.0, pitch: 1.0 });
    } catch (e) {}

    world.sendMessage(
      `§a§l✔ [Round ${this.currentRound}/${TOTAL_ROUNDS}] §f${player.name} found §e${formatItemDisplayName(itemName)} §ffor Letter §b§l[ ${this.targetLetter} ]§f!`
    );

    if (this.currentRound >= TOTAL_ROUNDS) {
      this.triggerVictory();
      return;
    }

    // Enter 30-second intermission before the next round
    this.state = GameState.INTERMISSION;
    this.timerSeconds = INTERMISSION_DURATION_SECONDS;
  }

  /**
   * Handles failure when the 60-second round timer reaches 0
   */
  handleRoundFailure() {
    world.sendMessage(
      `§c§l✖ TIME EXPIRED! §fFailed to find an item for Letter §e§l[ ${this.targetLetter} ]§f!`
    );

    let anyPlayerAlive = false;

    for (const player of world.getAllPlayers()) {
      if (!player.isValid()) continue;

      const newAllowedHp = this.applyHealthPenalty(player);
      if (newAllowedHp > 0) {
        anyPlayerAlive = true;
      }
    }

    if (!anyPlayerAlive) {
      this.triggerGameOver();
      return;
    }

    if (this.currentRound >= TOTAL_ROUNDS) {
      this.triggerVictory();
      return;
    }

    // Enter intermission after failure
    this.state = GameState.INTERMISSION;
    this.timerSeconds = INTERMISSION_DURATION_SECONDS;
  }

  /**
   * Applies permanent maximum health penalty to a player
   * @param {import("@minecraft/server").Player} player
   * @returns {number} new allowed max health
   */
  applyHealthPenalty(player) {
    const currentPenalty = (player.getDynamicProperty(PROP_PENALTY_HP) ?? 0);
    const newPenalty = currentPenalty + HP_PENALTY_PER_FAILURE;
    const allowedMaxHp = Math.max(1, BASE_MAX_HEALTH - newPenalty);

    player.setDynamicProperty(PROP_PENALTY_HP, newPenalty);
    player.setDynamicProperty(PROP_ALLOWED_MAX_HP, allowedMaxHp);

    try {
      player.playSound(SOUND_FAIL, { volume: 1.0, pitch: 0.8 });
      player.playSound(SOUND_CAVE, { volume: 1.0, pitch: 1.0 });
    } catch (e) {}

    // Deal immediate punishment damage
    try {
      player.applyDamage(HP_PENALTY_PER_FAILURE, { cause: "magic" });
    } catch (e) {}

    // Clamp current health to new allowed maximum
    this.enforceHealthClamp(player);

    const heartsLost = (newPenalty / 2).toFixed(0);
    player.sendMessage(
      `§c§l💔 PERMANENT PENALTY! §fMax health reduced to §c${allowedMaxHp}/${BASE_MAX_HEALTH} HP §f(-${heartsLost} Hearts)!`
    );

    return allowedMaxHp;
  }

  /**
   * Strictly clamps player health so it cannot regenerate past the penalised max health
   * @param {import("@minecraft/server").Player} player
   */
  enforceHealthClamp(player) {
    if (!player.isValid()) return;
    const allowedMaxHp = player.getDynamicProperty(PROP_ALLOWED_MAX_HP) ?? BASE_MAX_HEALTH;
    if (allowedMaxHp >= BASE_MAX_HEALTH) return;

    try {
      const healthComp = player.getComponent("minecraft:health");
      if (healthComp && healthComp.currentValue > allowedMaxHp) {
        healthComp.setCurrentValue(allowedMaxHp);
      }
    } catch (e) {}
  }

  /**
   * Resets player health penalties and restores full 20 HP
   * @param {import("@minecraft/server").Player} player
   */
  resetPlayerPenalties(player) {
    if (!player.isValid()) return;
    player.setDynamicProperty(PROP_PENALTY_HP, 0);
    player.setDynamicProperty(PROP_ALLOWED_MAX_HP, BASE_MAX_HEALTH);

    try {
      const healthComp = player.getComponent("minecraft:health");
      if (healthComp) {
        healthComp.setCurrentValue(BASE_MAX_HEALTH);
      }
    } catch (e) {}
  }

  /**
   * Gets current penalty HP for display
   * @param {import("@minecraft/server").Player} player
   * @returns {number}
   */
  getPlayerPenaltyHp(player) {
    return (player.getDynamicProperty(PROP_PENALTY_HP) ?? 0);
  }

  /**
   * Triggers victory state with celebratory effects
   */
  triggerVictory() {
    this.state = GameState.VICTORY;
    this.updateBossbar("🏆 CHALLENGE COMPLETE (20/20)!", 100, 100, "green");

    world.sendMessage("§a§l========================================");
    world.sendMessage("§6§l🏆 CHALLENGE COMPLETE!");
    world.sendMessage("§a   You survived all 20 Rounds of the");
    world.sendMessage("§a   Alphabet Scavenger Hunt!");
    world.sendMessage("§a§l========================================");

    for (const player of world.getAllPlayers()) {
      if (!player.isValid()) continue;
      try {
        player.playSound(SOUND_VICTORY, { volume: 1.0, pitch: 1.0 });
        const loc = player.location;
        player.dimension.runCommand(
          `execute at @a run summon fireworks_rocket ~ ~2 ~`
        );
      } catch (e) {}
    }
  }

  /**
   * Triggers mission failure state
   */
  triggerGameOver() {
    this.state = GameState.FAILED;
    this.updateBossbar("💀 MISSION FAILED!", 0, 100, "red");

    world.sendMessage("§4§l========================================");
    world.sendMessage("§c§l💀 MISSION FAILED!");
    world.sendMessage("§c   Vitality exhausted from permanent penalties.");
    world.sendMessage("§c   Type §e!start §cor §e!scavenger §cto retry!");
    world.sendMessage("§4§l========================================");
  }
}

export const manager = new ScavengerHuntManager();

// ============================================================================
// 3. INVENTORY VERIFICATION & ITEM HELPERS
// ============================================================================

/**
 * Strips namespace and underscores to produce clean display names
 * @param {string} rawId Example: "minecraft:cooked_beef" -> "Cooked Beef"
 * @returns {string}
 */
export function formatItemDisplayName(rawId) {
  const stripped = rawId.replace(/^.*:/, "");
  return stripped
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Checks if an item's identifier starts with the target letter
 * @param {string} typeId
 * @param {string} letter
 * @returns {boolean}
 */
export function itemMatchesLetter(typeId, letter) {
  const rawId = typeId.replace(/^.*:/, "");
  return rawId.toUpperCase().startsWith(letter.toUpperCase());
}

/**
 * Scans player inventory for an item starting with the target letter
 * @param {import("@minecraft/server").Player} player
 * @param {string} letter
 * @returns {string|null} matching item typeId or null
 */
export function scanPlayerInventoryForLetter(player, letter) {
  try {
    const inv = player.getComponent("minecraft:inventory");
    if (!inv || !inv.container) return null;

    for (let slot = 0; slot < inv.container.size; slot++) {
      const item = inv.container.getItem(slot);
      if (item && item.typeId) {
        if (itemMatchesLetter(item.typeId, letter)) {
          return item.typeId;
        }
      }
    }
  } catch (e) {}
  return null;
}

// ============================================================================
// 4. CORE SECOND TICK LOOP & UI UPDATE
// ============================================================================

let secondTickAccumulator = 0;

system.runInterval(() => {
  const players = world.getAllPlayers();
  if (players.length === 0) return;

  // Enforce permanent health clamp on every tick for all players
  for (const player of players) {
    manager.enforceHealthClamp(player);
  }

  // 1-Second Timer Tick (every 20 ticks)
  secondTickAccumulator++;
  if (secondTickAccumulator >= 20) {
    secondTickAccumulator = 0;
    onSecondTick(players);
  }

  // Render top-screen UI on every tick for smooth countdown & actionbar
  renderTopScreenUI(players);
}, 1);

/**
 * Main 1-second game timer routine
 * @param {import("@minecraft/server").Player[]} players
 */
function onSecondTick(players) {
  // Auto-start game on first player entry if idle
  if (manager.state === GameState.IDLE) {
    if (!manager.hasAutoStarted) {
      if (manager.autoStartCountdown > 0) {
        manager.autoStartCountdown--;
        if (manager.autoStartCountdown === 0) {
          manager.hasAutoStarted = true;
          manager.startNewRun();
        }
      }
    }
    return;
  }

  // ACTIVE ROUND STATE
  if (manager.state === GameState.ACTIVE) {
    // 1. Scan player inventories for target letter item
    for (const player of players) {
      if (!player.isValid()) continue;
      const matchedItemId = scanPlayerInventoryForLetter(player, manager.targetLetter);
      if (matchedItemId) {
        manager.completeRound(player, matchedItemId);
        return;
      }
    }

    // 2. Decrement countdown
    if (manager.timerSeconds > 0) {
      manager.timerSeconds--;

      // Sound countdown cue for final 5 seconds
      if (manager.timerSeconds <= 5 && manager.timerSeconds > 0) {
        for (const player of players) {
          try {
            player.playSound(SOUND_COUNTDOWN, { volume: 0.8, pitch: 1.5 });
          } catch (e) {}
        }
      }

      // Timer expired: apply penalty!
      if (manager.timerSeconds <= 0) {
        manager.handleRoundFailure();
      }
    }
    return;
  }

  // INTERMISSION REST STATE
  if (manager.state === GameState.INTERMISSION) {
    if (manager.timerSeconds > 0) {
      manager.timerSeconds--;
      if (manager.timerSeconds <= 0) {
        manager.startNextRound();
      }
    }
  }
}

/**
 * Displays objective at top of screen strictly via Bossbar and Action Bar
 * @param {import("@minecraft/server").Player[]} players
 */
function renderTopScreenUI(players) {
  const round = manager.currentRound;
  const time = manager.timerSeconds;
  const letter = manager.targetLetter;

  for (const player of players) {
    if (!player.isValid()) continue;

    const penaltyHp = manager.getPlayerPenaltyHp(player);
    const penaltyText = penaltyHp > 0 ? `§c-${penaltyHp} HP` : `§aNormal`;

    let topText = "";
    let bossbarTitle = "";
    let bossbarColor = "yellow";
    let bossbarVal = time;
    let bossbarMax = ROUND_DURATION_SECONDS;

    switch (manager.state) {
      case GameState.IDLE:
        topText = `§e§l[ Alphabet Scavenger ] §fStarting in §c${manager.autoStartCountdown}s §f| Type §e!start`;
        bossbarTitle = `Alphabet Scavenger Hunt — Starting in ${manager.autoStartCountdown}s`;
        bossbarColor = "white";
        bossbarVal = manager.autoStartCountdown;
        bossbarMax = 10;
        break;

      case GameState.ACTIVE:
        // Format: [ Round 5/20 ] Letter: [ C ] | ⏳ 42s | 💔 -2 HP
        topText = `§e§l[ Round ${round}/${TOTAL_ROUNDS} ] §fLetter: §b§l[ ${letter} ] §f| ⏳ §c§l${time}s §f| 💔 ${penaltyText}`;
        bossbarTitle = `Round ${round}/${TOTAL_ROUNDS} | Letter: [ ${letter} ] | ⏳ ${time}s | 💔 ${penaltyText}`;
        bossbarColor = time <= 15 ? "red" : time <= 30 ? "yellow" : "green";
        bossbarVal = time;
        bossbarMax = ROUND_DURATION_SECONDS;
        break;

      case GameState.INTERMISSION:
        topText = `§a§l[ Round ${round}/${TOTAL_ROUNDS} Complete ] §fNext Letter In: §e§l${time}s §f| 💔 ${penaltyText}`;
        bossbarTitle = `Intermission | Next Letter in ${time}s | Round ${round}/${TOTAL_ROUNDS} | 💔 ${penaltyText}`;
        bossbarColor = "blue";
        bossbarVal = time;
        bossbarMax = INTERMISSION_DURATION_SECONDS;
        break;

      case GameState.VICTORY:
        topText = `§6§l🏆 [ CHALLENGE COMPLETE (20/20) ] §aAll 20 Rounds Conquered!`;
        bossbarTitle = `🏆 CHALLENGE COMPLETE (20/20 Rounds Conquered!)`;
        bossbarColor = "green";
        bossbarVal = 100;
        bossbarMax = 100;
        break;

      case GameState.FAILED:
        topText = `§4§l[ MISSION FAILED ] §cMax vitality depleted. Type §e!start §cto retry!`;
        bossbarTitle = `💀 MISSION FAILED! Type !start to retry.`;
        bossbarColor = "red";
        bossbarVal = 0;
        bossbarMax = 100;
        break;
    }

    // 1. Script API Action Bar strictly displayed at the top above hotbar
    try {
      player.onScreenDisplay.setActionBar(topText);
    } catch (e) {}

    // 2. Update Bossbar at the absolute very top of the screen
    manager.updateBossbar(bossbarTitle, bossbarVal, bossbarMax, bossbarColor);
  }
}

// ============================================================================
// 5. EVENT LISTENERS & CHAT COMMANDS
// ============================================================================

// Player Death Check: End run if killed by penalty or during challenge
world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead && dead.typeId === "minecraft:player") {
    if (manager.state === GameState.ACTIVE || manager.state === GameState.INTERMISSION) {
      manager.triggerGameOver();
    }
  }
});

// Chat commands for quick administration
world.beforeEvents.chatSend.subscribe((event) => {
  const msg = event.message.trim().toLowerCase();

  if (msg === "!start" || msg === "!scavenger" || msg === "!scavenger start") {
    event.cancel = true;
    system.run(() => {
      manager.startNewRun();
    });
  } else if (msg === "!reset") {
    event.cancel = true;
    system.run(() => {
      manager.state = GameState.IDLE;
      manager.currentRound = 0;
      for (const p of world.getAllPlayers()) {
        manager.resetPlayerPenalties(p);
      }
      manager.hideBossbar();
      world.sendMessage("§a[Scavenger Hunt] Game reset! All health penalties cleared.");
    });
  } else if (msg === "!status") {
    event.cancel = true;
    system.run(() => {
      world.sendMessage(
        `§e[Status] State: ${manager.state} | Round: ${manager.currentRound}/${TOTAL_ROUNDS} | Target: [${manager.targetLetter}] | Time: ${manager.timerSeconds}s`
      );
    });
  }
});

// Welcome / instructions on player join
world.afterEvents.playerSpawn.subscribe((event) => {
  const { player, initialSpawn } = event;
  if (initialSpawn) {
    system.runTimeout(() => {
      if (!player.isValid()) return;
      player.sendMessage("§6§l========================================");
      player.sendMessage("§e§l   🔤 ALPHABET SCAVENGER HUNT CHALLENGE");
      player.sendMessage("§f   Survive 20 Rounds! Find items matching the target letter.");
      player.sendMessage("§f   Commands: §e!start §f(begin run) | §e!reset §f(clear penalties)");
      player.sendMessage("§6§l========================================");
    }, 40);
  }
});
