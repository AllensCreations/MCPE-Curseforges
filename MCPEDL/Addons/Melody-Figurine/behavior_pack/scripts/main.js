import { world, system } from "@minecraft/server";

const FIGURINE_BLOCK = "melody:melody_figurine";
const SOUND_ID = "melody:melody_song";
const DANCE_RADIUS = 20;
const SONG_DURATION_TICKS = 1330;
const UPDATE_INTERVAL_TICKS = 4;
const FINALE_TICKS = 100;

const MODE_ORDER = ["party", "chill", "battle", "music"];
const MODE_LABELS = {
  party: "Party Mode",
  chill: "Chill Mode",
  battle: "Dance Battle",
  music: "Music Only"
};

const EXCLUDED_TYPES = new Set([
  "minecraft:player",
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:snowball",
  "minecraft:egg",
  "minecraft:armor_stand",
  "minecraft:boat",
  "minecraft:minecart",
  "minecraft:tnt",
  "minecraft:area_effect_cloud"
]);

const FLYING_MOBS = new Set([
  "bee", "bat", "parrot", "allay", "vex", "phantom", "ghast",
  "blaze", "ender_dragon", "wither", "happy_ghast"
]);
const HOPPING_MOBS = new Set([
  "chicken", "rabbit", "frog", "slime", "magma_cube", "goat"
]);
const SWAYING_MOBS = new Set([
  "cow", "pig", "sheep", "horse", "donkey", "mule", "llama",
  "trader_llama", "camel", "wolf", "cat", "ocelot", "fox",
  "panda", "polar_bear", "mooshroom", "turtle"
]);
const ROBOT_MOBS = new Set([
  "zombie", "husk", "drowned", "zombie_villager", "skeleton",
  "stray", "wither_skeleton", "creeper", "witch", "pillager",
  "vindicator", "evoker", "ravager", "iron_golem", "snow_golem"
]);

const PARTICLES = [
  "minecraft:note_particle",
  "minecraft:heart_particle",
  "minecraft:happy_villager_particle",
  "minecraft:totem_particle",
  "minecraft:enchanting_table_particle"
];

const RAINBOW = [
  { red: 1, green: 0.15, blue: 0.35 },
  { red: 1, green: 0.45, blue: 0.1 },
  { red: 1, green: 0.85, blue: 0.15 },
  { red: 0.15, green: 1, blue: 0.35 },
  { red: 0.1, green: 0.65, blue: 1 },
  { red: 0.45, green: 0.2, blue: 1 },
  { red: 1, green: 0.2, blue: 0.8 }
];

const activeSessions = new Map();
const selectedModes = new Map();

function sessionKey(dimension, location) {
  return dimension.id + ":" +
    Math.floor(location.x) + "," +
    Math.floor(location.y) + "," +
    Math.floor(location.z);
}

function isEntityValid(entity) {
  try {
    return typeof entity.isValid === "function" ? entity.isValid() : entity.isValid !== false;
  } catch {
    return false;
  }
}

function isDanceable(entity) {
  try {
    return isEntityValid(entity) && !EXCLUDED_TYPES.has(entity.typeId);
  } catch {
    return false;
  }
}

function mobKind(entity) {
  const typeId = entity.typeId || "";
  return typeId.includes(":") ? typeId.slice(typeId.indexOf(":") + 1) : typeId;
}

function nextMode(key) {
  const current = selectedModes.get(key) || "party";
  const next = MODE_ORDER[(MODE_ORDER.indexOf(current) + 1) % MODE_ORDER.length];
  selectedModes.set(key, next);
  return next;
}

function pulsePlayer(player, step, mode, finale) {
  // Stable camera fades have no alpha/opacity control. Brief, no-hold fades
  // limit how long the color covers the view; this is not a true transparent overlay.
  const pulse = finale ? 2 : (mode === "chill" ? 8 : 4);
  if (step % pulse !== 0) return;

  try {
    player.camera.fade({
      fadeTime: {
        fadeInTime: finale ? 0.06 : (mode === "chill" ? 0.12 : 0.08),
        holdTime: 0,
        fadeOutTime: finale ? 0.2 : (mode === "chill" ? 0.32 : 0.24)
      },
      fadeColor: RAINBOW[Math.floor(step / pulse) % RAINBOW.length]
    });
  } catch {}
}

function animateFigurine(dimension, location, step, mode, finale) {
  // The block model stays still; orbiting particles provide its small animation.
  const speed = mode === "chill" ? 0.28 : mode === "battle" ? 1.05 : 0.72;
  const radius = finale ? 0.42 : 0.28;
  const angle = step * speed;
  const sparkleLocation = {
    x: location.x + Math.cos(angle) * radius,
    y: location.y + 0.55 + Math.sin(angle * 0.8) * (mode === "chill" ? 0.06 : 0.12),
    z: location.z + Math.sin(angle) * radius
  };

  try {
    dimension.spawnParticle("minecraft:note_particle", sparkleLocation);
  } catch {}

  const secondParticleEvery = mode === "chill" ? 4 : 2;
  if (step % secondParticleEvery === 0 || finale && step % 2 === 0) {
    try {
      dimension.spawnParticle("minecraft:enchanting_table_particle", {
        x: location.x + Math.cos(angle + Math.PI) * (finale ? 0.32 : 0.2),
        y: location.y + 0.35 + (finale ? 0.2 : 0),
        z: location.z + Math.sin(angle + Math.PI) * (finale ? 0.32 : 0.2)
      });
    } catch {}
  }

  if (finale && step % 4 === 0) {
    for (let i = 0; i < PARTICLES.length; i++) {
      const burstAngle = angle + (Math.PI * 2 * i) / PARTICLES.length;
      try {
        dimension.spawnParticle(PARTICLES[i], {
          x: location.x + Math.cos(burstAngle) * 0.45,
          y: location.y + 0.45 + (i % 2) * 0.25,
          z: location.z + Math.sin(burstAngle) * 0.45
        });
      } catch {}
    }
  }
}

function rememberRotation(session, entity) {
  try {
    if (!session.originalRotations.has(entity.id)) {
      session.originalRotations.set(entity.id, {
        entity,
        rotation: entity.getRotation()
      });
    }
  } catch {}
}

function restoreMobRotations(session) {
  for (const saved of session.originalRotations.values()) {
    const entity = saved.entity;
    if (!isEntityValid(entity)) continue;
    try {
      entity.teleport(entity.location, {
        rotation: { x: saved.rotation.x, y: saved.rotation.y },
        keepVelocity: true
      });
    } catch {}
  }
  session.originalRotations.clear();
}

function stopSession(key, session) {
  try {
    if (session.runId !== undefined) system.clearRun(session.runId);
  } catch {}
  restoreMobRotations(session);
  activeSessions.delete(key);
}

function danceMob(entity, session, finale) {
  if (!isDanceable(entity)) return;
  rememberRotation(session, entity);

  const kind = mobKind(entity);
  const mode = session.mode;
  const chill = mode === "chill";
  const battle = mode === "battle";
  const finaleBoost = finale ? 1.5 : 1;
  let turn = chill ? 5 : battle ? 42 : 28;

  if (SWAYING_MOBS.has(kind)) {
    // Grazers and companion animals get a gentle side-to-side dance.
    turn = (session.step % 2 === 0 ? 1 : -1) * (chill ? 3 : battle ? 24 : 13);
  } else if (FLYING_MOBS.has(kind)) {
    // Flying mobs twirl and sparkle without being pushed upward.
    turn = chill ? 5 : battle ? 48 : 30;
  } else if (ROBOT_MOBS.has(kind)) {
    // Undead and hostile mobs get a deliberately jerky, robotic turn.
    turn = chill ? 7 : battle ? 58 : 36;
  } else if (HOPPING_MOBS.has(kind)) {
    turn = chill ? 4 : battle ? 50 : 24;
  }

  try {
    const rotation = entity.getRotation();
    entity.teleport(entity.location, {
      rotation: { x: rotation.x, y: rotation.y + turn * finaleBoost },
      keepVelocity: true
    });
  } catch {}

  const hopInterval = chill ? 6 : 2;
  const shouldHop = !FLYING_MOBS.has(kind) && session.step % hopInterval === 0;
  if (shouldHop) {
    try {
      const height = finale ? 0.28 : chill ? 0.12 : battle ? 0.26 : 0.2;
      entity.applyImpulse({ x: 0, y: height, z: 0 });
    } catch {}
  }

  if (!chill && session.step % (battle ? 1 : 4) === 0) {
    try {
      entity.addEffect("jump_boost", 6, {
        amplifier: battle ? 1 : 0,
        showParticles: false
      });
    } catch {}
  }

  const particleInterval = chill ? 6 : battle ? 1 : 2;
  if (session.step % particleInterval === 0 || finale && session.step % 2 === 0) {
    try {
      const particle = PARTICLES[session.step % PARTICLES.length];
      dimensionSafeParticle(entity, particle, finale);
    } catch {}
  }
}

function dimensionSafeParticle(entity, particle, finale) {
  const location = entity.location;
  const dimension = entity.dimension;
  dimension.spawnParticle(particle, {
    x: location.x,
    y: location.y + (finale ? 1.2 : 1),
    z: location.z
  });
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const block = event.block;
  const player = event.player;
  if (!block || block.typeId !== FIGURINE_BLOCK || !player) return;

  const dimension = block.dimension;
  const blockLocation = block.location;
  const location = {
    x: blockLocation.x + 0.5,
    y: blockLocation.y + 0.5,
    z: blockLocation.z + 0.5
  };
  const key = sessionKey(dimension, blockLocation);

  // Sneak-interacting cycles the mode for the next activation.
  if (player.isSneaking) {
    const mode = nextMode(key);
    try {
      player.sendMessage("Melody Figurine mode set to " + MODE_LABELS[mode] + ".");
    } catch {}
    return;
  }

  if (activeSessions.has(key)) {
    try { player.sendMessage("The Melody Figurine is already playing."); } catch {}
    return;
  }

  const mode = selectedModes.get(key) || "party";
  const session = {
    elapsed: 0,
    step: 0,
    mode,
    runId: undefined,
    originalRotations: new Map()
  };
  activeSessions.set(key, session);

  try {
    dimension.playSound(SOUND_ID, location, { volume: 1.0, pitch: 1.0 });
  } catch (error) {
    try {
      player.sendMessage("Melody Figurine could not play its song. Check that the Resource Pack is active and the Music volume is turned up.");
      player.sendMessage(String(error));
    } catch {}
  }

  try {
    player.sendMessage("Melody Figurine started: " + MODE_LABELS[mode] + ". Sneak-interact to change the mode for next time.");
  } catch {}

  session.runId = system.runInterval(() => {
    session.elapsed += UPDATE_INTERVAL_TICKS;
    session.step += 1;

    const finale = session.elapsed >= SONG_DURATION_TICKS - FINALE_TICKS;
    const musicOnly = mode === "music";

    let nearby = [];
    try {
      nearby = dimension.getEntities({ location, maxDistance: DANCE_RADIUS });
    } catch {}

    if (!musicOnly) {
      for (const entity of nearby) danceMob(entity, session, finale);
    }

    animateFigurine(dimension, location, session.step, mode, finale);

    if (!musicOnly && (mode !== "chill" || session.step % 2 === 0)) {
      let nearbyPlayers = [];
      try {
        nearbyPlayers = dimension.getPlayers({ location, maxDistance: DANCE_RADIUS });
      } catch {}
      for (const nearbyPlayer of nearbyPlayers) pulsePlayer(nearbyPlayer, session.step, mode, finale);
    }

    if (session.elapsed >= SONG_DURATION_TICKS) {
      // Return surviving mobs to their original facing and stop all recurring effects.
      stopSession(key, session);
      try {
        for (const nearbyPlayer of dimension.getPlayers({ location, maxDistance: DANCE_RADIUS })) {
          nearbyPlayer.sendMessage("The Melody Figurine party has ended.");
        }
      } catch {}
    }
  }, UPDATE_INTERVAL_TICKS);
});
