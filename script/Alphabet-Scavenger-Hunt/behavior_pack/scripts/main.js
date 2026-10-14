/**
 * Alphabet Scavenger Hunt Challenge
 * Bedrock Script API (@minecraft/server v1.13.0+)
 * Compatible with Minecraft Bedrock 1.21.0 - 1.26.x+
 * Sourced from PrismarineJS/minecraft-data
 * Created by AllensCreations
 * Note: ZERO EMOJIS in all display strings, chat messages, and UI bars.
 */

import { world, system } from "@minecraft/server";
import { itemMatchesTargetLetter, getFriendlyItemName } from "./item_data.js";

// ============================================================================
// 1. CONFIGURATION & GAME CONSTANTS
// ============================================================================

export const TOTAL_ROUNDS = 20;
export const ROUND_DURATION_SECONDS = 60;       // 60s to find the item
export const INTERMISSION_DURATION_SECONDS = 30; // 30s rest between rounds
export const HP_PENALTY_PER_FAILURE = 2;          // -2 Max HP (1 full heart) per failure
export const BASE_MAX_HEALTH = 20;               // Standard 20 HP (10 hearts)

// Balanced survival letter pool (Excludes Q, X, Z, Y, J, K, U, V)
export const FAIR_LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I",
  "L", "M", "N", "O", "P", "R", "S", "T", "W"
];

// Sound Cue Identifiers
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
    this.autoStartCountdown = 15; // Auto-start 15s after world loads
    this.hasAutoStarted = false;
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
    } catch (e) {
      // Bossbar may already exist
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
    } catch (e) {}
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

    world.sendMessage("========================================");
    world.sendMessage("[START] ALPHABET SCAVENGER HUNT CHALLENGE");
    world.sendMessage("Find items matching the target letter in your inventory!");
    world.sendMessage(`Complete all ${TOTAL_ROUNDS} Rounds or suffer Permanent Max HP Loss!`);
    world.sendMessage("========================================");
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
      `§e[Round ${this.currentRound}/${TOTAL_ROUNDS}] §fTarget Letter: §b[ ${this.targetLetter} ] §f-- Time: §c60 seconds§f!`
    );
  }

  /**
   * Marks round as successfully passed
   * @param {import("@minecraft/server").Player} player
   * @param {string} typeId
   */
  completeRound(player, typeId) {
    try {
      player.playSound(SOUND_SUCCESS, { volume: 1.0, pitch: 1.0 });
    } catch (e) {}

    const friendlyName = getFriendlyItemName(typeId);
    world.sendMessage(
      `§a[PASS] [Round ${this.currentRound}/${TOTAL_ROUNDS}] §f${player.name} found §e${friendlyName} §ffor Letter §b[ ${this.targetLetter} ]§f!`
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
      `§c[FAIL] TIME EXPIRED! Failed to find an item for Letter [ ${this.targetLetter} ]!`
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
      `§c[PENALTY] Permanent Max Health reduced to ${allowedMaxHp}/${BASE_MAX_HEALTH} HP (-${heartsLost} Hearts)!`
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
    this.updateBossbar("[VICTORY] CHALLENGE COMPLETE (20/20)!", 100, 100, "green");

    world.sendMessage("========================================");
    world.sendMessage("[VICTORY] CHALLENGE COMPLETE!");
    world.sendMessage("You survived all 20 Rounds of the Alphabet Scavenger Hunt!");
    world.sendMessage("========================================");

    for (const player of world.getAllPlayers()) {
      if (!player.isValid()) continue;
      try {
        player.playSound(SOUND_VICTORY, { volume: 1.0, pitch: 1.0 });
        player.dimension.runCommand(`execute at @a run summon fireworks_rocket ~ ~2 ~`);
      } catch (e) {}
    }
  }

  /**
   * Triggers mission failure state
   */
  triggerGameOver() {
    this.state = GameState.FAILED;
    this.updateBossbar("[GAME OVER] MISSION FAILED!", 0, 100, "red");

    world.sendMessage("========================================");
    world.sendMessage("[GAME OVER] MISSION FAILED!");
    world.sendMessage("Vitality depleted from permanent penalties.");
    world.sendMessage("Run /scriptevent scavenger:start to retry!");
    world.sendMessage("========================================");
  }
}

export const manager = new ScavengerHuntManager();

// ============================================================================
// 3. INVENTORY VERIFICATION USING PRISMARINEJS MINECRAFT-DATA
// ============================================================================

/**
 * Scans player inventory for an item starting with the target letter.
 * Supports identifier tokens, official display names, and anvil renames.
 *
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
        const customName = item.nameTag || null;
        if (itemMatchesTargetLetter(item.typeId, letter, customName)) {
          return item.typeId;
        }
      }
    }
  } catch (e) {}
  return null;
}

// ============================================================================
// 4. CORE ENGINE TICK LOOP & TOP-SCREEN UI
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

  // Render top-screen UI strictly without emojis
  renderTopScreenUI(players);
}, 1);

/**
 * Main 1-second game timer routine
 * @param {import("@minecraft/server").Player[]} players
 */
function onSecondTick(players) {
  // Auto-start game on first player entry after countdown
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
      const matchedTypeId = scanPlayerInventoryForLetter(player, manager.targetLetter);
      if (matchedTypeId) {
        manager.completeRound(player, matchedTypeId);
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
 * Displays objective at top of screen strictly via Bossbar and Action Bar.
 * ZERO emojis used in all display strings.
 *
 * @param {import("@minecraft/server").Player[]} players
 */
function renderTopScreenUI(players) {
  const round = manager.currentRound;
  const time = manager.timerSeconds;
  const letter = manager.targetLetter;

  for (const player of players) {
    if (!player.isValid()) continue;

    const penaltyHp = manager.getPlayerPenaltyHp(player);
    const penaltyText = penaltyHp > 0 ? `-${penaltyHp} HP` : `0 HP`;

    let topText = "";
    let bossbarTitle = "";
    let bossbarColor = "yellow";
    let bossbarVal = time;
    let bossbarMax = ROUND_DURATION_SECONDS;

    switch (manager.state) {
      case GameState.IDLE:
        topText = `§e[ Alphabet Scavenger ] §fStarting in §c${manager.autoStartCountdown}s §f| Run: /scriptevent scavenger:start`;
        bossbarTitle = `Alphabet Scavenger Hunt -- Starting in ${manager.autoStartCountdown}s`;
        bossbarColor = "white";
        bossbarVal = manager.autoStartCountdown;
        bossbarMax = 15;
        break;

      case GameState.ACTIVE:
        // Format: [ Round 5/20 ] Letter: [ C ] | Time: 42s | Penalty: -2 HP
        topText = `§e[ Round ${round}/${TOTAL_ROUNDS} ] §fLetter: §b[ ${letter} ] §f| Time: §c${time}s §f| Penalty: §c${penaltyText}`;
        bossbarTitle = `Round ${round}/${TOTAL_ROUNDS} | Letter: [ ${letter} ] | Time: ${time}s | Penalty: ${penaltyText}`;
        bossbarColor = time <= 15 ? "red" : time <= 30 ? "yellow" : "green";
        bossbarVal = time;
        bossbarMax = ROUND_DURATION_SECONDS;
        break;

      case GameState.INTERMISSION:
        topText = `§a[ Round ${round}/${TOTAL_ROUNDS} Complete ] §fNext Letter In: §e${time}s §f| Penalty: §c${penaltyText}`;
        bossbarTitle = `Intermission | Next Letter in ${time}s | Round ${round}/${TOTAL_ROUNDS} | Penalty: ${penaltyText}`;
        bossbarColor = "blue";
        bossbarVal = time;
        bossbarMax = INTERMISSION_DURATION_SECONDS;
        break;

      case GameState.VICTORY:
        topText = `§6[ CHALLENGE COMPLETE (20/20) ] §aAll 20 Rounds Conquered!`;
        bossbarTitle = `[ VICTORY ] All 20 Rounds Conquered!`;
        bossbarColor = "green";
        bossbarVal = 100;
        bossbarMax = 100;
        break;

      case GameState.FAILED:
        topText = `§4[ MISSION FAILED ] §cRun /scriptevent scavenger:start to retry.`;
        bossbarTitle = `[ MISSION FAILED ] Vitality exhausted.`;
        bossbarColor = "red";
        bossbarVal = 0;
        bossbarMax = 100;
        break;
    }

    // 1. Script API Action Bar displayed at top of screen above hotbar
    try {
      player.onScreenDisplay.setActionBar(topText);
    } catch (e) {}

    // 2. Update Bossbar at the absolute very top of the screen
    manager.updateBossbar(bossbarTitle, bossbarVal, bossbarMax, bossbarColor);
  }
}

// ============================================================================
// 5. ROBUST COMMAND TRIGGERS (SCRIPT-EVENT, ITEM USE, & CHAT)
// ============================================================================

/**
 * 1. Native Bedrock Script-Event Commands (100% reliable on all platforms):
 *    /scriptevent scavenger:start
 *    /scriptevent scavenger:reset
 *    /scriptevent scavenger:status
 */
system.afterEvents.scriptEventReceive.subscribe((event) => {
  const id = event.id.toLowerCase();

  if (id === "scavenger:start" || id === "hunt:start") {
    manager.startNewRun();
  } else if (id === "scavenger:reset" || id === "hunt:reset") {
    manager.state = GameState.IDLE;
    manager.currentRound = 0;
    for (const p of world.getAllPlayers()) {
      manager.resetPlayerPenalties(p);
    }
    manager.hideBossbar();
    world.sendMessage("[Scavenger Hunt] Game reset! All penalties cleared.");
  } else if (id === "scavenger:status" || id === "hunt:status") {
    world.sendMessage(
      `[Status] State: ${manager.state} | Round: ${manager.currentRound}/${TOTAL_ROUNDS} | Letter: [${manager.targetLetter}] | Time: ${manager.timerSeconds}s`
    );
  }
});

/**
 * 2. Item Interaction Trigger (Zero typing required!):
 *    Holding a Compass, Clock, or Stick and sneaking + right-clicking (or tapping)
 *    immediately starts or restarts the run.
 */
world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const item = event.itemStack;
  if (!player || !item) return;

  const typeId = item.typeId;
  if (
    typeId === "minecraft:compass" ||
    typeId === "minecraft:clock" ||
    typeId === "minecraft:stick"
  ) {
    if (player.isSneaking) {
      if (manager.state === GameState.IDLE || manager.state === GameState.FAILED || manager.state === GameState.VICTORY) {
        manager.startNewRun();
      } else {
        player.sendMessage(`[Status] Round: ${manager.currentRound}/${TOTAL_ROUNDS} | Letter: [${manager.targetLetter}] | Time: ${manager.timerSeconds}s`);
      }
    }
  }
});

/**
 * 3. Chat Commands (Non-cancelling afterEvents fallback):
 *    Works even if chat beforeEvents cancellation is restricted or blocked.
 */
world.afterEvents.chatSend.subscribe((event) => {
  const msg = event.message.trim().toLowerCase();

  if (msg === "!start" || msg === "start" || msg === "!scavenger" || msg === "!scavenger start") {
    system.run(() => {
      manager.startNewRun();
    });
  } else if (msg === "!reset" || msg === "reset") {
    system.run(() => {
      manager.state = GameState.IDLE;
      manager.currentRound = 0;
      for (const p of world.getAllPlayers()) {
        manager.resetPlayerPenalties(p);
      }
      manager.hideBossbar();
      world.sendMessage("[Scavenger Hunt] Game reset! All health penalties cleared.");
    });
  } else if (msg === "!status" || msg === "status") {
    system.run(() => {
      world.sendMessage(
        `[Status] State: ${manager.state} | Round: ${manager.currentRound}/${TOTAL_ROUNDS} | Letter: [${manager.targetLetter}] | Time: ${manager.timerSeconds}s`
      );
    });
  }
});

// Player Death Check: End run if killed by penalty or in combat during run
world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead && dead.typeId === "minecraft:player") {
    if (manager.state === GameState.ACTIVE || manager.state === GameState.INTERMISSION) {
      manager.triggerGameOver();
    }
  }
});

// Welcome / instructions on player join (Zero emojis)
world.afterEvents.playerSpawn.subscribe((event) => {
  const { player, initialSpawn } = event;
  if (initialSpawn) {
    system.runTimeout(() => {
      if (!player.isValid()) return;
      player.sendMessage("========================================");
      player.sendMessage("[INFO] ALPHABET SCAVENGER HUNT CHALLENGE");
      player.sendMessage("Survive 20 Rounds! Find items matching the target letter.");
      player.sendMessage("Starts automatically in 15s, or run:");
      player.sendMessage("  /scriptevent scavenger:start");
      player.sendMessage("  or type !start in chat, or Sneak + Right-Click with a stick/compass.");
      player.sendMessage("========================================");
    }, 40);
  }
});
