import { world, system } from "@minecraft/server";

const FIGURINE_BLOCK = "melody:melody_figurine";
const SOUND_ID = "melody:melody_song";
const DANCE_RADIUS = 20;

// Update this value to match the duration of the .ogg song you add to the resource pack.
// 1200 ticks = 60 seconds. The sound itself is non-looping and ends naturally.
const SONG_DURATION_TICKS = 1200;
const UPDATE_INTERVAL_TICKS = 10;

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

const activeSessions = new Map();

function sessionKey(dimension, location) {
  return dimension.id + ":" +
    Math.floor(location.x) + "," +
    Math.floor(location.y) + "," +
    Math.floor(location.z);
}

function isDanceable(entity) {
  try {
    return entity.isValid() && !EXCLUDED_TYPES.has(entity.typeId);
  } catch {
    return false;
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
    try {
      player.sendMessage("The Melody Figurine is already playing.");
    } catch {}
    return;
  }

  const session = { elapsed: 0, step: 0, runId: undefined };
  activeSessions.set(key, session);

  try {
    dimension.playSound(SOUND_ID, location, { volume: 1.0, pitch: 1.0 });
  } catch (error) {
    try {
      player.sendMessage("The Melody Figurine song could not start. Make sure the custom OGG song is installed in the Resource Pack.");
    } catch {}
  }

  try {
    player.sendMessage("The Melody Figurine is playing. Nearby mobs are dancing!");
  } catch {}

  session.runId = system.runInterval(() => {
    session.elapsed += UPDATE_INTERVAL_TICKS;
    session.step += 1;

    let nearby = [];
    try {
      nearby = dimension.getEntities({
        location,
        maxDistance: DANCE_RADIUS
      });
    } catch {}

    for (const entity of nearby) {
      if (!isDanceable(entity)) continue;

      try {
        const rotation = entity.getRotation();
        entity.teleport(entity.location, {
          rotation: { x: rotation.x, y: rotation.y + (session.step % 2 ? 28 : -28) }
        });

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

    if (session.elapsed >= SONG_DURATION_TICKS) {
      system.clearRun(session.runId);
      activeSessions.delete(key);
    }
  }, UPDATE_INTERVAL_TICKS);
});
