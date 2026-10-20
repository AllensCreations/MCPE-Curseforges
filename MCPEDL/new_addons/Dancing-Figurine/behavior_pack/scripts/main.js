import { world, system } from "@minecraft/server";

/*
 * Dancing Figurine by AllensCreations
 * Interact with a figurine to start or stop a 20-second dance party.
 * Nearby living mobs hop gently and emit party particles. Nearby players
 * receive rotating camera fades and an action-bar message.
 */

const FIGURINE_ID = "custom:cute_figurine";
const RADIUS = 12;
const PARTY_TICKS = 20 * 20;
const DANCE_INTERVAL = 10;
const COLOR_INTERVAL = 20;
const SOUND_INTERVAL = 80;
const SOUND_ID = "music.cute_dance_song";
const PARTY_MESSAGE = "§d♪ §e[PARTY TIME!] §dDancing with the Figurine! ♪";

const COLORS = [
  { red: 1.0, green: 0.25, blue: 0.35 },
  { red: 1.0, green: 0.35, blue: 0.75 },
  { red: 0.2, green: 0.9, blue: 1.0 },
  { red: 1.0, green: 0.85, blue: 0.2 },
  { red: 0.65, green: 0.3, blue: 1.0 }
];

const parties = new Map();
let nextPartyId = 0;

function makeKey(dimensionId, location) {
  return [dimensionId, location.x, location.y, location.z].join(":");
}

function safelyPlaySound(dimension, location) {
  try {
    dimension.playSound(SOUND_ID, location, { volume: 1, pitch: 1 });
  } catch {
    // A missing or unavailable custom sound must not stop the party.
  }
}

function safelyStopSound(player) {
  try {
    player.stopSound(SOUND_ID);
  } catch {
    // Sound stopping is best-effort; the current audio segment may end naturally.
  }
}

function showPartyMessage(player) {
  try {
    player.onScreenDisplay.setActionBar(PARTY_MESSAGE);
  } catch {
    // The player may have left the world while this tick was running.
  }
}

function fadePlayer(player, color) {
  try {
    player.camera.fade({
      fadeColor: color,
      fadeTime: { fadeInTime: 0.15, stayTime: 0.35, fadeOutTime: 0.5 }
    });
  } catch {
    // Continue the party if camera effects are unavailable on this client.
  }
}

function isLivingEntity(entity) {
  try {
    if (!entity.isValid || entity.typeId === "minecraft:player") return false;
    const health = entity.getComponent("minecraft:health");
    return !!health && health.currentValue > 0;
  } catch {
    return false;
  }
}

function spawnParticle(dimension, particleId, location) {
  try {
    dimension.spawnParticle(particleId, location);
  } catch {
    // Unknown particle identifiers are skipped without interrupting the party.
  }
}

function danceMob(entity, dimension, elapsedTicks) {
  if (!isLivingEntity(entity)) return;

  try {
    const phase = elapsedTicks / 3;
    entity.applyImpulse({
      x: Math.sin(phase + entity.location.x) * 0.08,
      y: 0.22,
      z: Math.cos(phase + entity.location.z) * 0.08
    });

    const head = {
      x: entity.location.x,
      y: entity.location.y + 1.1,
      z: entity.location.z
    };

    spawnParticle(
      dimension,
      elapsedTicks % 20 < 10 ? "minecraft:heart_particle" : "minecraft:note_particle",
      head
    );
  } catch {
    // Some entity types or states may reject impulses.
  }
}

function stopParty(key) {
  const party = parties.get(key);
  if (!party) return;

  for (const timerName of ["danceTimer", "colorTimer", "soundTimer"]) {
    if (party[timerName] !== undefined) system.clearRun(party[timerName]);
  }

  try {
    const dimension = world.getDimension(party.dimensionId);
    for (const player of dimension.getPlayers({
      location: party.location,
      maxDistance: RADIUS
    })) {
      safelyStopSound(player);
      try {
        player.onScreenDisplay.setActionBar("");
      } catch {
        // Ignore players that are no longer available.
      }
    }
  } catch {
    // The dimension may no longer be available.
  }

  parties.delete(key);
}

function startParty(dimension, blockLocation, key) {
  const party = {
    id: ++nextPartyId,
    dimensionId: dimension.id,
    location: {
      x: blockLocation.x + 0.5,
      y: blockLocation.y,
      z: blockLocation.z + 0.5
    },
    elapsedTicks: 0,
    colorIndex: 0
  };

  parties.set(key, party);
  safelyPlaySound(dimension, party.location);

  // Replay the short custom tune during the 20-second party.
  party.soundTimer = system.runInterval(() => {
    if (parties.get(key)?.id !== party.id) return;
    safelyPlaySound(dimension, party.location);
  }, SOUND_INTERVAL);

  party.danceTimer = system.runInterval(() => {
    if (parties.get(key)?.id !== party.id) return;

    party.elapsedTicks += DANCE_INTERVAL;
    if (party.elapsedTicks >= PARTY_TICKS) {
      stopParty(key);
      return;
    }

    try {
      const mobs = dimension.getEntities({
        location: party.location,
        maxDistance: RADIUS
      });

      for (const mob of mobs) danceMob(mob, dimension, party.elapsedTicks);

      for (const player of dimension.getPlayers({
        location: party.location,
        maxDistance: RADIUS
      })) showPartyMessage(player);
    } catch {
      stopParty(key);
    }
  }, DANCE_INTERVAL);

  party.colorTimer = system.runInterval(() => {
    if (parties.get(key)?.id !== party.id) return;

    const color = COLORS[party.colorIndex % COLORS.length];
    party.colorIndex++;

    for (const player of dimension.getPlayers({
      location: party.location,
      maxDistance: RADIUS
    })) {
      fadePlayer(player, color);
      showPartyMessage(player);
    }
  }, COLOR_INTERVAL);
}

// Right-clicking the figurine toggles the party at that location.
world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const block = event.block;
  if (!block || block.typeId !== FIGURINE_ID) return;

  const key = makeKey(block.dimension.id, block.location);
  if (parties.has(key)) {
    stopParty(key);
  } else {
    startParty(block.dimension, block.location, key);
  }
});

// Stop active parties if their figurine is removed.
system.runInterval(() => {
  for (const [key, party] of parties.entries()) {
    try {
      const block = world.getDimension(party.dimensionId).getBlock(party.location);
      if (!block || block.typeId !== FIGURINE_ID) stopParty(key);
    } catch {
      stopParty(key);
    }
  }
}, 20);
