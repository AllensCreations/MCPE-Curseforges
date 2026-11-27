import { world, system } from "@minecraft/server";

const ENTITY_ID = "aln:legendary_piglin";
const DISPLAY_NAME = "The Legendary One";
const HOME = { x: 4.5, y: 65, z: 0.5 };
const STRUCTURE_ID = "aln:legendary_piglin";
const STRUCTURE_ORIGIN = { x: 4, y: 65, z: 0 };
const STATION_FLOOR = { x: 4, y: 64, z: 0 };
const NAME_DELAY = 5;
const MESSAGE = "§c[The Legendary One] §eI will never die!";
const RESPAWN_DELAY = 100;
const RETRY_DELAY = 100;
const MAX_RETRIES = 12;
const WATCH_INTERVAL = 40;
const PARTICLE = "minecraft:totem_particle";

let respawnPending = false;

function overworld() {
  return world.getDimension("minecraft:overworld");
}

function legendaryExists(dimension) {
  return dimension.getEntities({ type: ENTITY_ID }).length > 0;
}

function stationReady(dimension) {
  const floor = dimension.getBlock(STATION_FLOOR);
  return Boolean(floor) && floor.typeId !== "minecraft:air";
}

function nameLegendary(dimension) {
  for (const piglin of dimension.getEntities({ type: ENTITY_ID })) {
    if (piglin.nameTag !== DISPLAY_NAME) piglin.nameTag = DISPLAY_NAME;
  }
}

function spawnLegendary(dimension) {
  try {
    world.structureManager.place(STRUCTURE_ID, dimension, STRUCTURE_ORIGIN, {
      includeBlocks: false,
      includeEntities: true,
    });
  } catch (error) {
    dimension.spawnEntity(ENTITY_ID, HOME);
  }
  system.runTimeout(() => nameLegendary(dimension), NAME_DELAY);
}

function playEffect(dimension, location) {
  for (let i = 0; i < 12; i++) {
    const offset = {
      x: location.x + (Math.random() - 0.5) * 1.2,
      y: location.y + Math.random() * 2,
      z: location.z + (Math.random() - 0.5) * 1.2,
    };
    try {
      dimension.spawnParticle(PARTICLE, offset);
    } catch (error) {
      return;
    }
  }
}

function respawnWithRetry(attempt) {
  const dimension = overworld();
  try {
    if (!legendaryExists(dimension)) spawnLegendary(dimension);
    respawnPending = false;
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      respawnPending = false;
      return;
    }
    system.runTimeout(() => respawnWithRetry(attempt + 1), RETRY_DELAY);
  }
}

const watcher = system.runInterval(() => {
  if (world.getAllPlayers().length === 0) return;
  const dimension = overworld();
  if (!stationReady(dimension)) return;
  if (legendaryExists(dimension)) {
    system.clearRun(watcher);
    return;
  }
  try {
    spawnLegendary(dimension);
    system.clearRun(watcher);
  } catch (error) {
    console.warn("Legendary One spawn retry: " + error);
  }
}, WATCH_INTERVAL);

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (dead.typeId !== ENTITY_ID) return;
  if (respawnPending) return;
  respawnPending = true;
  let location = HOME;
  try {
    location = dead.location;
  } catch (error) {
    location = HOME;
  }
  playEffect(overworld(), location);
  world.sendMessage(MESSAGE);
  system.runTimeout(() => respawnWithRetry(0), RESPAWN_DELAY);
});
