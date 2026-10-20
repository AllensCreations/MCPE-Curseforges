import { world, system } from "@minecraft/server";

const FIGURINE_BLOCK = "melody:melody_figurine";
const SOUND_ID = "melody:melody_song";
const DANCE_RADIUS = 20;
const SONG_DURATION_TICKS = 1330;
const UPDATE_INTERVAL_TICKS = 4;
const COLOR_PULSE_INTERVAL_STEPS = 2;

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

function pulsePlayer(player, step) {
  try {
    // The stable camera fade API does not expose alpha/opacity. A zero-hold,
    // gradual fade keeps the tint moving instead of covering the view with a solid color.
    player.camera.fade({
      fadeTime: { fadeInTime: 0.18, holdTime: 0, fadeOutTime: 0.38 },
      fadeColor: RAINBOW[step % RAINBOW.length]
    });
  } catch {}
}

function animateFigurine(dimension, location, step) {
  // Orbiting musical sparkles give the placed statue a lively active-session effect.
  const angle = step * 0.72;
  const sparkleLocation = {
    x: location.x + Math.cos(angle) * 0.28,
    y: location.y + 0.55 + Math.sin(angle * 0.8) * 0.12,
    z: location.z + Math.sin(angle) * 0.28
  };

  try {
    dimension.spawnParticle("minecraft:note_particle", sparkleLocation);
  } catch {}

  if (step % 2 === 0) {
    try {
      dimension.spawnParticle("minecraft:enchanting_table_particle", {
        x: location.x + Math.cos(angle + Math.PI) * 0.2,
        y: location.y + 0.35,
        z: location.z + Math.sin(angle + Math.PI) * 0.2
      });
    } catch {}
  }
}

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const block = event.block;
  const player = event.player;
  if (!block || block.typeId !== FIGURINE_BLOCK || !player) return;

  const dimension = block.dimension;
  const location = {
    x: block.location.x + 0.5,
    y: block.location.y + 0.5,
    z: block.location.z + 0.5
  };
  const key = sessionKey(dimension, block.location);

  if (activeSessions.has(key)) {
    try { player.sendMessage("The Melody Figurine is already playing."); } catch {}
    return;
  }

  const session = { elapsed: 0, step: 0, runId: undefined };
  activeSessions.set(key, session);

  try {
    dimension.playSound(SOUND_ID, location, { volume: 1.0, pitch: 1.0 });
  } catch (error) {
    try {
      player.sendMessage("Melody Figurine could not play its song. Check that the Resource Pack is active and the Music volume is turned up.");
      player.sendMessage(String(error));
    } catch {}
  }

  try { player.sendMessage("The Melody Figurine is playing! Nearby mobs are dancing."); } catch {}

  session.runId = system.runInterval(() => {
    session.elapsed += UPDATE_INTERVAL_TICKS;
    session.step += 1;

    let nearby = [];
    try {
      nearby = dimension.getEntities({ location, maxDistance: DANCE_RADIUS });
    } catch {}

    for (const entity of nearby) {
      if (!isDanceable(entity)) continue;

      try {
        const rotation = entity.getRotation();
        entity.teleport(entity.location, {
          rotation: { x: rotation.x, y: rotation.y + 28 },
          keepVelocity: true
        });

        // Frequent, small hops make the dance easy to notice without launching mobs high into the air.
        if (session.step % 2 === 0) {
          entity.applyImpulse({ x: 0, y: 0.22, z: 0 });
        }

        if (session.step % 4 === 0) {
          entity.addEffect("jump_boost", 10, {
            amplifier: 1,
            showParticles: false
          });
        }
      } catch {}

      if (session.step % 2 === 0) {
        try {
          const particle = PARTICLES[session.step % PARTICLES.length];
          dimension.spawnParticle(particle, {
            x: entity.location.x,
            y: entity.location.y + 1,
            z: entity.location.z
          });
        } catch {}
      }
    }

    animateFigurine(dimension, location, session.step);

    if (session.step % COLOR_PULSE_INTERVAL_STEPS === 0) {
      let nearbyPlayers = [];
      try {
        nearbyPlayers = dimension.getPlayers({ location, maxDistance: DANCE_RADIUS });
      } catch {}
      for (const nearbyPlayer of nearbyPlayers) pulsePlayer(nearbyPlayer, session.step);
    }

    if (session.elapsed >= SONG_DURATION_TICKS) {
      system.clearRun(session.runId);
      activeSessions.delete(key);
    }
  }, UPDATE_INTERVAL_TICKS);
});
