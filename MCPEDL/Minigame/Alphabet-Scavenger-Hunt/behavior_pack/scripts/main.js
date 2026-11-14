/**
 * Alphabet Scavenger Hunt Challenge
 * Bedrock Script API (@minecraft/server v1.13.0+)
 * Compatible with Minecraft Bedrock 1.21.0 - 1.26.x+
 * Sourced from PrismarineJS/minecraft-data
 * Created by ALNStudios
 * Note: ZERO EMOJIS in all display strings, chat messages, and UI bars.
 */

import { world, system } from "@minecraft/server";
import { itemMatchesTargetLetter, getFriendlyItemName } from "./item_data.js";
import { registerController, endGame } from "./controller.js";

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
const SOUND_FIREWORKS = ["firework.blast", "firework.large_blast", "firework.twinkle"];

// Victory celebration (kept small on purpose so it never lags)
const CELEBRATION_BURST_INTERVAL_TICKS = 10;  // one burst every half second
const CELEBRATION_BURST_COUNT = 14;           // about 7 seconds of fireworks
const CELEBRATION_MAX_ROCKETS_PER_BURST = 4;  // hard cap on live rockets
const CELEBRATION_MAX_SPOTS_PER_BURST = 4;    // hard cap on particle spots
const CELEBRATION_END_DELAY_TICKS = 240;      // 12s, then the run is closed
const CELEBRATION_PARTICLES = ["minecraft:totem_particle", "minecraft:endrod", "minecraft:villager_happy"];
const FIREWORK_ROCKET_ID = "minecraft:fireworks_rocket";

// Bossbar identifier
const BOSSBAR_ID = "scavenger_hunt";
const BOSSBAR_MAX_FAILURES = 3;

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

    // Players who died during the current run (co-op: the run only fails when all are out)
    this.eliminated = new Set();

    // Celebration handles
    this.fireworksRun = null;
    this.celebrationEnd = null;

    // Bossbar throttling
    this.bossbarReady = false;
    this.bossbarBroken = false;
    this.bossbarFailures = 0;
    this.lastBossbarKey = "";
  }

  // --------------------------------------------------------------------------
  // Bossbar (throttled: only sends commands when something actually changed)
  // --------------------------------------------------------------------------

  initBossbar() {
    try {
      const overworld = world.getDimension("overworld");
      overworld.runCommand(`bossbar add ${BOSSBAR_ID} "Alphabet Scavenger Hunt"`);
    } catch (e) {
      // Bossbar may already exist
    }
    try {
      const overworld = world.getDimension("overworld");
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} players @a`);
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} style progress`);
    } catch (e) {}
    this.bossbarReady = true;
  }

  /**
   * Updates the native top-screen bossbar. Skips the work when nothing changed.
   * After repeated failures the bossbar is switched off for the session so it
   * never wastes server time (the action bar still shows everything).
   */
  updateBossbar(title, value, max, color = "yellow") {
    if (this.bossbarBroken) return;
    const key = `${title}|${value}|${max}|${color}`;
    if (key === this.lastBossbarKey) return;
    this.lastBossbarKey = key;
    if (!this.bossbarReady) this.initBossbar();

    const safeTitle = String(title).replace(/"/g, "'");
    let ok = false;
    try {
      const overworld = world.getDimension("overworld");
      const res = overworld.runCommand(`bossbar set ${BOSSBAR_ID} name "${safeTitle}"`);
      ok = !res || res.successCount === undefined || res.successCount > 0;
      if (ok) {
        overworld.runCommand(`bossbar set ${BOSSBAR_ID} players @a`);
        overworld.runCommand(`bossbar set ${BOSSBAR_ID} max ${Math.max(1, max)}`);
        overworld.runCommand(`bossbar set ${BOSSBAR_ID} value ${Math.max(0, value)}`);
        overworld.runCommand(`bossbar set ${BOSSBAR_ID} color ${color}`);
        overworld.runCommand(`bossbar set ${BOSSBAR_ID} visible true`);
      }
    } catch (e) {
      ok = false;
    }

    if (ok) {
      this.bossbarFailures = 0;
    } else {
      this.bossbarFailures++;
      if (this.bossbarFailures >= BOSSBAR_MAX_FAILURES) this.bossbarBroken = true;
    }
  }

  hideBossbar() {
    this.lastBossbarKey = "";
    if (this.bossbarBroken) return;
    try {
      const overworld = world.getDimension("overworld");
      overworld.runCommand(`bossbar set ${BOSSBAR_ID} visible false`);
    } catch (e) {}
  }

  // --------------------------------------------------------------------------
  // Run lifecycle
  // --------------------------------------------------------------------------

  /**
   * Starts a brand new challenge run
   */
  startNewRun() {
    this.stopCelebration();
    this.eliminated.clear();
    this.currentRound = 0;
    this.state = GameState.INTERMISSION;
    this.timerSeconds = 10; // 10s warmup for Round 1
    this.lastLetter = "";
    this.lastBossbarKey = "";
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
   * Called by the Controller when the run ends (manual End, game over, or after the victory show)
   */
  handleEnd() {
    this.stopCelebration();
    const previous = this.state;
    if (previous === GameState.ACTIVE || previous === GameState.INTERMISSION) {
      this.state = GameState.IDLE;
      this.hideBossbar();
      world.sendMessage("[Scavenger Hunt] The challenge has ended.");
    } else if (previous === GameState.VICTORY) {
      this.state = GameState.IDLE;
      this.hideBossbar();
    }
    // Penalties only last for one run
    this.resetAllPenalties();
    this.eliminated.clear();
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
      if (!player.isValid() || this.eliminated.has(player.id)) continue;

      const newAllowedHp = this.applyHealthPenalty(player);
      if (newAllowedHp > 0) {
        anyPlayerAlive = true;
      }
    }

    // A penalty hit may have just finished the last player
    if (this.state === GameState.FAILED) return;

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

  resetAllPenalties() {
    for (const player of world.getAllPlayers()) this.resetPlayerPenalties(player);
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
   * A player died during the run. In co-op the run continues until everyone is out.
   * @param {import("@minecraft/server").Entity} dead
   */
  handlePlayerDeath(dead) {
    if (this.state !== GameState.ACTIVE && this.state !== GameState.INTERMISSION) return;
    this.eliminated.add(dead.id);
    try {
      world.sendMessage(`§c[OUT] ${dead.name} was eliminated.`);
    } catch (e) {}

    const everyoneOut = world.getAllPlayers().every((p) => this.eliminated.has(p.id));
    if (everyoneOut) this.triggerGameOver();
  }

  // --------------------------------------------------------------------------
  // Victory celebration
  // --------------------------------------------------------------------------

  /**
   * Triggers victory state with title, sounds and fireworks
   */
  triggerVictory() {
    if (this.state === GameState.VICTORY) return;
    this.state = GameState.VICTORY;
    this.updateBossbar("[VICTORY] CHALLENGE COMPLETE (20/20)!", 100, 100, "green");

    world.sendMessage("========================================");
    world.sendMessage("§6[VICTORY] CONGRATULATIONS! CHALLENGE COMPLETE!");
    world.sendMessage("§aYou survived all 20 Rounds of the Alphabet Scavenger Hunt!");
    world.sendMessage("========================================");

    this.startCelebration();
  }

  startCelebration() {
    this.stopCelebration();

    for (const player of world.getAllPlayers()) {
      if (!player.isValid()) continue;
      try {
        player.onScreenDisplay.setTitle("§6§lCONGRATULATIONS!", {
          subtitle: `§aAll ${TOTAL_ROUNDS} rounds complete!`,
          fadeInDuration: 10,
          stayDuration: 120,
          fadeOutDuration: 30,
        });
        player.playSound(SOUND_VICTORY, { volume: 1.0, pitch: 1.0 });
        player.playSound(SOUND_SUCCESS, { volume: 1.0, pitch: 1.0 });
      } catch (e) {}
    }

    let bursts = 0;
    this.fireworksRun = system.runInterval(() => {
      if (this.state !== GameState.VICTORY || bursts >= CELEBRATION_BURST_COUNT) {
        this.stopFireworks();
        return;
      }
      bursts++;
      this.fireworkBurst();
    }, CELEBRATION_BURST_INTERVAL_TICKS);

    // Close the run after the show so the Controller comes back and a new run can start
    this.celebrationEnd = system.runTimeout(() => {
      this.celebrationEnd = null;
      if (this.state === GameState.VICTORY) endGame();
    }, CELEBRATION_END_DELAY_TICKS);
  }

  /**
   * One capped burst: a few rockets, a few particle spots, firework sounds.
   * Total entities and particles per burst stay small so nothing lags.
   */
  fireworkBurst() {
    let rockets = 0;
    let spots = 0;

    for (const player of world.getAllPlayers()) {
      if (!player.isValid()) continue;
      if (rockets >= CELEBRATION_MAX_ROCKETS_PER_BURST && spots >= CELEBRATION_MAX_SPOTS_PER_BURST) break;

      const base = player.location;
      const dimension = player.dimension;
      const angle = Math.random() * Math.PI * 2;
      const distance = 3 + Math.random() * 5;
      const x = base.x + Math.cos(angle) * distance;
      const z = base.z + Math.sin(angle) * distance;

      if (rockets < CELEBRATION_MAX_ROCKETS_PER_BURST) {
        try {
          dimension.spawnEntity(FIREWORK_ROCKET_ID, { x, y: base.y, z });
          rockets++;
        } catch (e) {}
      }

      if (spots < CELEBRATION_MAX_SPOTS_PER_BURST) {
        const y = base.y + 7 + Math.random() * 4;
        for (const name of CELEBRATION_PARTICLES) {
          try {
            dimension.spawnParticle(name, { x, y, z });
          } catch (e) {}
        }
        spots++;
      }

      try {
        const sound = SOUND_FIREWORKS[Math.floor(Math.random() * SOUND_FIREWORKS.length)];
        player.playSound(sound, { volume: 1.0, pitch: 0.9 + Math.random() * 0.3 });
      } catch (e) {}
    }
  }

  stopFireworks() {
    if (this.fireworksRun !== null) {
      system.clearRun(this.fireworksRun);
      this.fireworksRun = null;
    }
  }

  stopCelebration() {
    this.stopFireworks();
    if (this.celebrationEnd !== null) {
      system.clearRun(this.celebrationEnd);
      this.celebrationEnd = null;
    }
  }

  /**
   * Triggers mission failure state
   */
  triggerGameOver() {
    if (this.state === GameState.FAILED) return;
    this.state = GameState.FAILED;
    this.updateBossbar("[GAME OVER] MISSION FAILED!", 0, 100, "red");

    world.sendMessage("========================================");
    world.sendMessage("[GAME OVER] MISSION FAILED!");
    world.sendMessage("Every player was eliminated.");
    world.sendMessage("========================================");
    endGame();
  }
}

export const manager = new ScavengerHuntManager();

registerController({
  title: "Alphabet Scavenger Hunt",
  gameInfo: "Type: Survival scavenger challenge\nPlayers: Solo or co-op\nGoal: Complete 20 rounds by finding an inventory item that begins with each target letter.",
  howToPlay: "Start the challenge from the Controller. Each round gives players 60 seconds to find an item whose name begins with the displayed letter. A missed round permanently reduces maximum health. Complete 20 rounds to win and enjoy the fireworks; if every player is eliminated, the challenge ends. The Controller can end or restart the run.",
  onStart: () => manager.startNewRun(),
  onEnd: () => manager.handleEnd(),
});

// ============================================================================
// 3. INVENTORY VERIFICATION USING PRISMARINEJS MINECRAFT-DATA
// ============================================================================

// Match results are cached per item type and letter, so each item is only analysed once.
const matchCache = new Map();

function typeMatchesLetter(typeId, letter) {
  const key = `${letter}|${typeId}`;
  let result = matchCache.get(key);
  if (result === undefined) {
    // Anvil renames are intentionally ignored so a renamed item can not win a round
    result = itemMatchesTargetLetter(typeId, letter, null);
    matchCache.set(key, result);
  }
  return result;
}

/**
 * Scans player inventory for an item starting with the target letter.
 * Supports identifier tokens and official display names.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} letter
 * @returns {string|null} matching item typeId or null
 */
export function scanPlayerInventoryForLetter(player, letter) {
  try {
    const inv = player.getComponent("minecraft:inventory");
    if (!inv || !inv.container) return null;

    const container = inv.container;
    for (let slot = 0; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && item.typeId && typeMatchesLetter(item.typeId, letter)) {
        return item.typeId;
      }
    }
  } catch (e) {}
  return null;
}

// ============================================================================
// 4. CORE ENGINE LOOPS & TOP-SCREEN UI
// ============================================================================

// Game logic and UI: once per second (was every tick)
system.runInterval(() => {
  const players = world.getAllPlayers();
  if (players.length === 0) return;
  onSecondTick(players);
  renderTopScreenUI(players);
}, 20);

// Health clamp: twice per second, and it exits instantly for players without a penalty
system.runInterval(() => {
  if (manager.state === GameState.IDLE) return;
  for (const player of world.getAllPlayers()) {
    manager.enforceHealthClamp(player);
  }
}, 10);

/**
 * Main 1-second game timer routine
 * @param {import("@minecraft/server").Player[]} players
 */
function onSecondTick(players) {
  if (manager.state === GameState.IDLE) return;

  // ACTIVE ROUND STATE
  if (manager.state === GameState.ACTIVE) {
    // 1. Scan player inventories for target letter item
    for (const player of players) {
      if (!player.isValid() || manager.eliminated.has(player.id)) continue;
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
 * Displays objective at top of screen via Bossbar (once, shared) and Action Bar (per player).
 * ZERO emojis used in all display strings.
 *
 * @param {import("@minecraft/server").Player[]} players
 */
function renderTopScreenUI(players) {
  const round = manager.currentRound;
  const time = manager.timerSeconds;
  const letter = manager.targetLetter;

  let bossbarTitle = "";
  let bossbarColor = "yellow";
  let bossbarVal = time;
  let bossbarMax = ROUND_DURATION_SECONDS;

  switch (manager.state) {
    case GameState.IDLE:
      bossbarTitle = "Alphabet Scavenger Hunt";
      bossbarColor = "white";
      bossbarVal = 0;
      bossbarMax = 1;
      break;
    case GameState.ACTIVE:
      bossbarTitle = `Round ${round}/${TOTAL_ROUNDS} | Letter: [ ${letter} ] | Time: ${time}s`;
      bossbarColor = time <= 15 ? "red" : time <= 30 ? "yellow" : "green";
      break;
    case GameState.INTERMISSION:
      bossbarTitle = round === 0
        ? `Get Ready | First Letter in ${time}s`
        : `Intermission | Next Letter in ${time}s | Round ${round}/${TOTAL_ROUNDS}`;
      bossbarColor = "blue";
      bossbarMax = round === 0 ? 10 : INTERMISSION_DURATION_SECONDS;
      break;
    case GameState.VICTORY:
      bossbarTitle = `[ VICTORY ] All ${TOTAL_ROUNDS} Rounds Conquered!`;
      bossbarColor = "green";
      bossbarVal = 100;
      bossbarMax = 100;
      break;
    case GameState.FAILED:
      bossbarTitle = "[ MISSION FAILED ] Every player was eliminated.";
      bossbarColor = "red";
      bossbarVal = 0;
      bossbarMax = 100;
      break;
  }

  // One shared bossbar update (skipped automatically when nothing changed)
  manager.updateBossbar(bossbarTitle, bossbarVal, bossbarMax, bossbarColor);

  for (const player of players) {
    if (!player.isValid()) continue;

    const penaltyHp = manager.getPlayerPenaltyHp(player);
    const penaltyText = penaltyHp > 0 ? `-${penaltyHp} HP` : `0 HP`;
    let topText = "";

    switch (manager.state) {
      case GameState.IDLE:
        topText = "§e[ Alphabet Scavenger ] §fUse the Controller to start";
        break;
      case GameState.ACTIVE:
        // Format: [ Round 5/20 ] Letter: [ C ] | Time: 42s | Penalty: -2 HP
        topText = `§e[ Round ${round}/${TOTAL_ROUNDS} ] §fLetter: §b[ ${letter} ] §f| Time: §c${time}s §f| Penalty: §c${penaltyText}`;
        break;
      case GameState.INTERMISSION:
        topText = round === 0
          ? `§a[ Get Ready ] §fFirst Letter In: §e${time}s`
          : `§a[ Round ${round}/${TOTAL_ROUNDS} Complete ] §fNext Letter In: §e${time}s §f| Penalty: §c${penaltyText}`;
        break;
      case GameState.VICTORY:
        topText = `§6[ CHALLENGE COMPLETE (${TOTAL_ROUNDS}/${TOTAL_ROUNDS}) ] §aAll ${TOTAL_ROUNDS} Rounds Conquered!`;
        break;
      case GameState.FAILED:
        topText = "§4[ MISSION FAILED ] §cUse the Controller to restart.";
        break;
    }

    try {
      player.onScreenDisplay.setActionBar(topText);
    } catch (e) {}
  }
}

// ============================================================================
// Player Death Check: a death eliminates that player; the run ends when all are out
world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead && dead.typeId === "minecraft:player") {
    manager.handlePlayerDeath(dead);
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
      player.sendMessage("Use the Controller item to start, end, or restart the challenge.");
      player.sendMessage("========================================");
    }, 40);
  }
});
