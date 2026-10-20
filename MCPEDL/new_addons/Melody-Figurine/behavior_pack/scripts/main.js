import { world, system } from "@minecraft/server";

const FIGURINE_BLOCK = "melody:melody_figurine";
const SOUND_ID = "melody:melody_song";
const DANCE_RADIUS = 20;
const SONG_DURATION_TICKS = 1330;
const UPDATE_INTERVAL_TICKS = 10;
const COLOR_FLASH_INTERVAL_STEPS = 10;

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

function flashPlayer(player, step) {
  try {
    player.camera.fade({
      fadeTime: { fadeInTime: 0.12, holdTime: 0.04, fadeOutTime: 0.28 },
      fadeColor: RAINBOW[step % RAINBOW.length]
    });
  } catch {}
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
  flashPlayer(player, 0);

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
        const yaw = rotation.y + (session.step % 2 ? 32 : -32);
        entity.teleport(entity.location, {
          rotation: { x: rotation.x, y: yaw },
          keepVelocity: true
        });

        if (session.step % 5 === 0) {
          entity.applyImpulse({ x: 0, y: 0.16, z: 0 });
        }

        if (session.step % 4 === 0) {
          entity.addEffect("jump_boost", 14, {
            amplifier: 1,
            showParticles: false
          });
        }
      } catch {}

      if (session.step % 3 === 0) {
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

    if (session.step % COLOR_FLASH_INTERVAL_STEPS === 0) {
      let nearbyPlayers = [];
      try {
        nearbyPlayers = dimension.getPlayers({ location, maxDistance: DANCE_RADIUS });
      } catch {}
      for (const nearbyPlayer of nearbyPlayers) flashPlayer(nearbyPlayer, session.step);
    }

    if (session.elapsed >= SONG_DURATION_TICKS) {
      system.clearRun(session.runId);
      activeSessions.delete(key);
    }
  }, UPDATE_INTERVAL_TICKS);
});
