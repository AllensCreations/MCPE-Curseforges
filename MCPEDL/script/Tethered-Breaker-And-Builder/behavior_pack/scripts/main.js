/**
 * ==============================================================================
 * TETHERED: BREAKER & BUILDER -- 2-PLAYER ASYMMETRIC CO-OP
 * ==============================================================================
 * Version: 1.0.0
 * Target Engine: Minecraft Bedrock 1.21.0+ / v1.26 Standards
 * API Modules: @minecraft/server v1.13.0+, @minecraft/server-ui v1.3.0+
 * Author: AllensCreations
 *
 * System Architecture:
 * 1. Asymmetric Roles:
 *    - role_breaker: Can mine blocks freely; has exclusive melee combat rights.
 *      Cannot place blocks, fluids, or fire.
 *    - role_builder: Can place blocks and fluids freely; exclusive utility crafting.
 *      Cannot mine blocks or attack entities.
 * 2. Dynamic Leash Physics (Anchor-Aware Elastic Spring):
 *    - 15-meter maximum tether distance.
 *    - Color-coded particle beam connects players every tick.
 *    - Overstretched (>15m) applies an elastic spring vector toward each other.
 *    - Anchor logic: Grounded partner acts as an anchor to reel in falling/airborne partners.
 *    - Overstretch damage (>18m): 2 damage points per second until regrouped.
 * 3. Co-op Respawn & Re-anchor:
 *    - Dead player respawns directly beside their surviving partner with grace effects.
 * 4. Persistent HUD Action Bar:
 *    - Displays Slack, Tense, or Overstretched status with exact metric distance.
 * ==============================================================================
 */

import {
  world,
  system,
  EntityDamageCause
} from "@minecraft/server";
import {
  ActionFormData
} from "@minecraft/server-ui";

// ==============================================================================
// 1. CONSTANTS & CONFIGURATION
// ==============================================================================

const CONFIG = {
  MAX_TETHER_DISTANCE: 15.0,
  DAMAGE_DISTANCE: 18.0,
  TENSE_DISTANCE: 10.0,
  OVERSTRETCH_DAMAGE: 2, // 1 full heart
  DAMAGE_INTERVAL_TICKS: 20, // 1 second
  PARTICLE_STEP: 1.0, // Distance between beam particles
  RESPAWN_GRACE_TICKS: 100 // 5 seconds of protection
};

// Forbidden items for Breaker (bucket fluids, ignition, building utilities)
const BREAKER_FORBIDDEN_ITEMS = new Set([
  "minecraft:water_bucket",
  "minecraft:lava_bucket",
  "minecraft:powder_snow_bucket",
  "minecraft:cod_bucket",
  "minecraft:salmon_bucket",
  "minecraft:tropical_fish_bucket",
  "minecraft:pufferfish_bucket",
  "minecraft:axolotl_bucket",
  "minecraft:tadpole_bucket",
  "minecraft:flint_and_steel",
  "minecraft:fire_charge"
]);

// Runtime tracking variables
let overstretchDamageTimer = 0;
let soundWarningCooldown = 0;

// ==============================================================================
// 2. ROLE MANAGEMENT & MODAL UI
// ==============================================================================

/**
 * Checks if a player holds the Breaker role.
 * @param {Player} player
 * @returns {boolean}
 */
function isBreaker(player) {
  return player?.hasTag("role_breaker") ?? false;
}

/**
 * Checks if a player holds the Builder role.
 * @param {Player} player
 * @returns {boolean}
 */
function isBuilder(player) {
  return player?.hasTag("role_builder") ?? false;
}

/**
 * Assigns an exclusive role to a player and removes any conflicting roles.
 * @param {Player} player
 * @param {"role_breaker" | "role_builder"} role
 */
function assignRole(player, role) {
  player.removeTag("role_breaker");
  player.removeTag("role_builder");
  player.addTag(role);
}

/**
 * Displays the role selection modal form to a player.
 * @param {Player} player
 */
function showRoleSelectionForm(player) {
  const form = new ActionFormData()
    .title("TETHERED: CHOOSE ROLE")
    .body(
      "Select your asymmetric co-op role:\n\n" +
      "BREAKER:\n" +
      "- Mines all blocks freely\n" +
      "- Exclusive melee & weapon combat ability\n" +
      "- CANNOT place blocks, fluids, or fire\n\n" +
      "BUILDER:\n" +
      "- Places blocks & fluids freely\n" +
      "- Exclusive crafting & utility access\n" +
      "- CANNOT break blocks or attack entities\n\n" +
      "Rule: You are tethered within 15 meters. Stay close to survive!"
    )
    .button("Play as BREAKER")
    .button("Play as BUILDER");

  form.show(player).then((response) => {
    if (response.canceled) return;

    if (response.selection === 0) {
      assignRole(player, "role_breaker");
      player.sendMessage("§a[TETHERED] You are now the §lBREAKER§r§a! Mine blocks and protect your Builder in battle.");
      player.playSound("random.levelup", { location: player.location, volume: 1.0, pitch: 1.2 });
    } else if (response.selection === 1) {
      assignRole(player, "role_builder");
      player.sendMessage("§e[TETHERED] You are now the §lBUILDER§r§e! Construct structures and support your Breaker.");
      player.playSound("random.levelup", { location: player.location, volume: 1.0, pitch: 1.0 });
    }
  }).catch(() => {});
}

// Prompt unassigned players on world join
world.afterEvents.playerSpawn.subscribe((event) => {
  const player = event.player;
  if (!isBreaker(player) && !isBuilder(player)) {
    system.runTimeout(() => {
      showRoleSelectionForm(player);
    }, 40); // 2 second delay after spawn
  }
});

// ==============================================================================
// 3. EVENT RESTRICTIONS (ASYMMETRIC ROLE RULES)
// ==============================================================================

/**
 * Rule: Breakers CANNOT place blocks.
 */
world.beforeEvents.playerPlaceBlock.subscribe((event) => {
  const player = event.player;
  if (isBreaker(player)) {
    event.cancel = true;
    system.run(() => {
      player.onScreenDisplay.setActionBar("§cYou cannot build! Only Builder can place blocks!");
      player.playSound("note.bass", { location: player.location, volume: 0.5, pitch: 0.6 });
    });
  }
});

/**
 * Rule: Breakers CANNOT use fluid buckets or ignite fire.
 */
world.beforeEvents.itemUseOn.subscribe((event) => {
  const player = event.source;
  if (player?.typeId === "minecraft:player" && isBreaker(player)) {
    const item = event.itemStack;
    if (item && BREAKER_FORBIDDEN_ITEMS.has(item.typeId)) {
      event.cancel = true;
      system.run(() => {
        player.onScreenDisplay.setActionBar("§cYou cannot place fluids or fire!");
        player.playSound("note.bass", { location: player.location, volume: 0.5, pitch: 0.6 });
      });
    }
  }
});

/**
 * Rule: Builders CANNOT break blocks.
 */
world.beforeEvents.playerBreakBlock.subscribe((event) => {
  const player = event.player;
  if (isBuilder(player)) {
    event.cancel = true;
    system.run(() => {
      player.onScreenDisplay.setActionBar("§cYou cannot mine! Only Breaker can break blocks!");
      player.playSound("note.bass", { location: player.location, volume: 0.5, pitch: 0.6 });
    });
  }
});

/**
 * Rule: Builders CANNOT attack mobs or players (Breaker handles combat).
 */
world.beforeEvents.entityHitEntity.subscribe((event) => {
  const attacker = event.damagingEntity;
  if (attacker?.typeId === "minecraft:player" && isBuilder(attacker)) {
    event.cancel = true;
    system.run(() => {
      attacker.onScreenDisplay.setActionBar("§cYou cannot fight! Only Breaker can attack!");
      attacker.playSound("note.bass", { location: attacker.location, volume: 0.5, pitch: 0.7 });
    });
  }
});

// ==============================================================================
// 4. PAIR DETECTION & TETHER PHYSICS ENGINE
// ==============================================================================

/**
 * Finds the active tethered pair in the world.
 * Matches a Breaker and a Builder, or the first two active players.
 * @returns {{ playerA: Player, playerB: Player } | null}
 */
function getTetheredPair() {
  const players = world.getAllPlayers();
  if (players.length < 2) return null;

  const breaker = players.find(p => isBreaker(p));
  const builder = players.find(p => isBuilder(p));

  if (breaker && builder && breaker.id !== builder.id) {
    return { playerA: breaker, playerB: builder };
  }

  // Fallback to first two players if roles are not yet selected
  return { playerA: players[0], playerB: players[1] };
}

/**
 * Renders a particle beam connecting two player coordinates.
 * @param {Dimension} dimension
 * @param {Vector3} start
 * @param {Vector3} end
 * @param {number} distance
 * @param {string} particleType
 */
function renderParticleBeam(dimension, start, end, distance, particleType) {
  if (distance <= 0) return;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;

  const steps = Math.max(1, Math.floor(distance / CONFIG.PARTICLE_STEP));
  const stepX = dx / steps;
  const stepY = dy / steps;
  const stepZ = dz / steps;

  for (let i = 1; i < steps; i++) {
    const px = start.x + stepX * i;
    const py = start.y + stepY * i;
    const pz = start.z + stepZ * i;
    try {
      dimension.spawnParticle(particleType, { x: px, y: py, z: pz });
    } catch {}
  }
}

/**
 * Main physics, particle, and HUD loop. Runs every tick.
 */
system.runInterval(() => {
  const pair = getTetheredPair();
  if (!pair) return;

  const { playerA, playerB } = pair;
  if (!playerA?.isValid || !playerB?.isValid) return;

  // Check if players are in different dimensions
  if (playerA.dimension.id !== playerB.dimension.id) {
    playerA.onScreenDisplay.setActionBar("§c[LEASH: BROKEN] §fDimensional Rift: Partners in Different Worlds!");
    playerB.onScreenDisplay.setActionBar("§c[LEASH: BROKEN] §fDimensional Rift: Partners in Different Worlds!");
    return;
  }

  const dimension = playerA.dimension;
  const locA = playerA.location;
  const locB = playerB.location;

  // Center beam at chest height (y + 1.1)
  const beamStart = { x: locA.x, y: locA.y + 1.1, z: locA.z };
  const beamEnd = { x: locB.x, y: locB.y + 1.1, z: locB.z };

  const dx = locB.x - locA.x;
  const dy = locB.y - locA.y;
  const dz = locB.z - locA.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // ----------------------------------------------------------------------------
  // A. Dynamic Particle Beam & HUD Tension State
  // ----------------------------------------------------------------------------
  let particleType = "minecraft:villager_happy";
  let hudText = "";
  const formattedDistance = distance.toFixed(1);

  if (distance < CONFIG.TENSE_DISTANCE) {
    // Slack state (< 10m): Green sparkles
    particleType = "minecraft:villager_happy";
    hudText = `§a[LEASH: SLACK] §fDistance: ${formattedDistance}m`;
  } else if (distance <= CONFIG.MAX_TETHER_DISTANCE) {
    // Tense state (10m - 15m): Golden electric sparks
    particleType = "minecraft:electric_spark_particle";
    hudText = `§e[LEASH: TENSE] §fDistance: ${formattedDistance}m`;
  } else {
    // Overstretched state (> 15m): Bright flame & critical particles
    particleType = "minecraft:basic_flame_particle";
    hudText = `§c[LEASH: OVERSTRETCHED] §fDistance: ${formattedDistance}m!`;
  }

  // Render the visual connection beam
  renderParticleBeam(dimension, beamStart, beamEnd, distance, particleType);

  // Update persistent Action Bar HUD
  playerA.onScreenDisplay.setActionBar(hudText);
  playerB.onScreenDisplay.setActionBar(hudText);

  // ----------------------------------------------------------------------------
  // B. Overstretched Physics Pulling (Anchor-Aware Elastic Spring)
  // ----------------------------------------------------------------------------
  if (distance > CONFIG.MAX_TETHER_DISTANCE) {
    const excess = distance - CONFIG.MAX_TETHER_DISTANCE;
    const dirX = dx / distance;
    const dirZ = dz / distance;

    // Progressive spring strength bounded between 0.35 and 1.2
    const springStrength = Math.min(1.2, 0.35 + excess * 0.12);

    // Audio cue every 15 ticks while overstretched
    soundWarningCooldown++;
    if (soundWarningCooldown >= 15) {
      soundWarningCooldown = 0;
      playerA.playSound("note.bass", { location: locA, volume: 0.8, pitch: 0.5 });
      playerB.playSound("note.bass", { location: locB, volume: 0.8, pitch: 0.5 });
    }

    const aGrounded = playerA.isOnGround;
    const bGrounded = playerB.isOnGround;

    if (aGrounded && !bGrounded) {
      // Player A is an anchor: pull airborne/falling Player B back toward Player A
      try {
        playerB.applyKnockback(-dirX, -dirZ, springStrength * 1.4, Math.max(0.15, -dy / distance * 0.4));
      } catch {}
    } else if (bGrounded && !aGrounded) {
      // Player B is an anchor: pull airborne/falling Player A back toward Player B
      try {
        playerA.applyKnockback(dirX, dirZ, springStrength * 1.4, Math.max(0.15, dy / distance * 0.4));
      } catch {}
    } else {
      // Both grounded or both airborne: pull mutually inward toward midpoint
      try {
        playerA.applyKnockback(dirX, dirZ, springStrength * 0.85, 0.1);
        playerB.applyKnockback(-dirX, -dirZ, springStrength * 0.85, 0.1);
      } catch {}
    }

    // --------------------------------------------------------------------------
    // C. Overstretch Strain Damage (> 18m)
    // --------------------------------------------------------------------------
    if (distance > CONFIG.DAMAGE_DISTANCE) {
      overstretchDamageTimer++;
      if (overstretchDamageTimer >= CONFIG.DAMAGE_INTERVAL_TICKS) {
        overstretchDamageTimer = 0;
        try {
          playerA.applyDamage(CONFIG.OVERSTRETCH_DAMAGE, { cause: EntityDamageCause.contact });
          playerB.applyDamage(CONFIG.OVERSTRETCH_DAMAGE, { cause: EntityDamageCause.contact });
          playerA.playSound("random.break", { location: locA, volume: 0.9, pitch: 1.1 });
          playerB.playSound("random.break", { location: locB, volume: 0.9, pitch: 1.1 });
        } catch {}
      }
    } else {
      overstretchDamageTimer = 0;
    }
  } else {
    overstretchDamageTimer = 0;
    soundWarningCooldown = 0;
  }
}, 1);

// ==============================================================================
// 5. CO-OP RESPAWN & RE-ANCHOR ENGINE
// ==============================================================================

/**
 * When a player respawns after dying, automatically teleport them to their
 * living tether partner with brief invulnerability grace effects.
 */
world.afterEvents.playerSpawn.subscribe((event) => {
  const respawned = event.player;
  const pair = getTetheredPair();
  if (!pair) return;

  const partner = pair.playerA.id === respawned.id ? pair.playerB : pair.playerA;
  if (!partner || !partner.isValid) return;

  // Defer teleport 1 tick to ensure player entity is fully attached to the world
  system.runTimeout(() => {
    try {
      respawned.teleport(
        { x: partner.location.x, y: partner.location.y, z: partner.location.z },
        { dimension: partner.dimension }
      );

      // Apply grace period effects (Resistance V and Regeneration II)
      respawned.addEffect("resistance", CONFIG.RESPAWN_GRACE_TICKS, { amplifier: 4, showParticles: false });
      respawned.addEffect("regeneration", CONFIG.RESPAWN_GRACE_TICKS, { amplifier: 1, showParticles: false });

      respawned.sendMessage("§a[TETHERED] You have respawned and re-anchored directly to your partner!");
      partner.sendMessage(`§a[TETHERED] ${respawned.name} has respawned and re-anchored to your position!`);

      respawned.playSound("random.orb", { location: respawned.location, volume: 1.0, pitch: 1.0 });
      partner.playSound("random.orb", { location: partner.location, volume: 1.0, pitch: 1.0 });
    } catch {}
  }, 5);
});

// ==============================================================================
// 6. SCRIPT EVENT COMMANDS (OPERATOR CONTROLS)
// ==============================================================================

/**
 * Native `/scriptevent` command handler:
 * - `/scriptevent tether:start`: Re-prompts the role selection modal for all players.
 * - `/scriptevent tether:breaker`: Sets caller or first player to Breaker.
 * - `/scriptevent tether:builder`: Sets caller or first player to Builder.
 * - `/scriptevent tether:reset`: Clears all role tags.
 */
system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id === "tether:start") {
    for (const player of world.getAllPlayers()) {
      showRoleSelectionForm(player);
    }
    world.sendMessage("§a[TETHERED] Role selection dialog opened for all connected players.");
  } else if (event.id === "tether:reset") {
    for (const player of world.getAllPlayers()) {
      player.removeTag("role_breaker");
      player.removeTag("role_builder");
    }
    world.sendMessage("§c[TETHERED] All role tags have been reset.");
  } else if (event.id === "tether:breaker") {
    const target = event.sourceEntity ?? world.getAllPlayers()[0];
    if (target?.typeId === "minecraft:player") {
      assignRole(target, "role_breaker");
      target.sendMessage("§a[TETHERED] Assigned to role: BREAKER.");
    }
  } else if (event.id === "tether:builder") {
    const target = event.sourceEntity ?? world.getAllPlayers()[0];
    if (target?.typeId === "minecraft:player") {
      assignRole(target, "role_builder");
      target.sendMessage("§e[TETHERED] Assigned to role: BUILDER.");
    }
  }
});
