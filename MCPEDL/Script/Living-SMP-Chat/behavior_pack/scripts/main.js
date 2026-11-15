import { world, system, BlockVolume } from "@minecraft/server";
import { startSessionSimulator } from "./smp_roster.js";
import { coordHint } from "./chat_generator.js";
import { announceSpawner, ambientConversation, reactToDeath, reactToOre, reactToEvent, welcomeBack } from "./chat_director.js";

const ORES = {
  "minecraft:diamond_ore": "diamond",
  "minecraft:deepslate_diamond_ore": "diamond",
  "minecraft:ancient_debris": "debris",
};
const ORE_COOLDOWN = 1200;
const EVENT_COOLDOWN = 3600;

const ENABLE_SPAWNER_TIPS = true;
const SCAN_RADIUS = 16;
const SCAN_DEPTH = 40;
const SCAN_UP = 10;
const SLAB = 4;
const SCAN_STEP_TICKS = 5;
const announcedSpawners = new Set();
let nextLocator = 0;
let locatorTimer = 0;
let scanJob = null;
let lastEmptyScan = null;
function startScan(player) {
  if (player.dimension.id !== "minecraft:overworld") return false;
  const p = player.location;
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  const z = Math.floor(p.z);
  if (lastEmptyScan && Math.abs(lastEmptyScan.x - x) < 8 && Math.abs(lastEmptyScan.y - y) < 8 && Math.abs(lastEmptyScan.z - z) < 8) return false;
  const range = player.dimension.heightRange;
  scanJob = {
    name: player.name,
    dimension: player.dimension,
    x,
    y,
    z,
    nextY: Math.max(range.min, y - SCAN_DEPTH),
    maxY: Math.min(range.max - 1, y + SCAN_UP),
    best: null,
    bestDist: Infinity,
  };
  return true;
}

function finishScan(job) {
  scanJob = null;
  if (!job.best) {
    lastEmptyScan = { x: job.x, y: job.y, z: job.z };
    nextLocator = rand(9000, 18000);
    return;
  }
  lastEmptyScan = null;
  if (announceSpawner(job.name, job.best)) {
    announcedSpawners.add(job.best.x + "," + job.best.y + "," + job.best.z);
    if (announcedSpawners.size > 200) announcedSpawners.clear();
    nextLocator = rand(18000, 30000);
  } else {
    nextLocator = rand(6000, 12000);
  }
}

system.runInterval(() => {
  const job = scanJob;
  if (!job) return;
  try {
    const top = Math.min(job.nextY + SLAB - 1, job.maxY);
    const volume = new BlockVolume(
      { x: job.x - SCAN_RADIUS, y: job.nextY, z: job.z - SCAN_RADIUS },
      { x: job.x + SCAN_RADIUS, y: top, z: job.z + SCAN_RADIUS }
    );
    const found = job.dimension.getBlocks(volume, { includeTypes: ["minecraft:mob_spawner"] }, false);
    for (const loc of found.getBlockLocationIterator()) {
      const key = loc.x + "," + loc.y + "," + loc.z;
      if (announcedSpawners.has(key)) continue;
      const dist = (loc.x - job.x) ** 2 + (loc.y - job.y) ** 2 + (loc.z - job.z) ** 2;
      if (dist < job.bestDist) {
        job.bestDist = dist;
        job.best = { x: loc.x, y: loc.y, z: loc.z };
      }
    }
    job.nextY = top + 1;
    if (job.nextY > job.maxY) finishScan(job);
  } catch (e) {
    scanJob = null;
    nextLocator = rand(6000, 12000);
  }
}, SCAN_STEP_TICKS);

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

system.run(() => {
  startSessionSimulator();
});

function classifyDeath(damageSource) {
  const cause = damageSource ? damageSource.cause : "none";
  const attacker = damageSource ? damageSource.damagingEntity : undefined;
  const typeId = attacker ? attacker.typeId : "";
  const mobName = typeId ? "a " + typeId.replace("minecraft:", "").replace(/_/g, " ") : "a mob";
  if (typeId === "minecraft:creeper" || (cause === "entityExplosion" && !attacker)) return ["creeper", "a creeper"];
  if (cause === "lava") return ["lava", "lava"];
  if (cause === "fall") return ["fall", "fall damage"];
  if (cause === "void") return ["void", "the void"];
  if (attacker && typeId !== "minecraft:player") return ["mob", mobName];
  return ["generic", "something"];
}

world.afterEvents.entityDie.subscribe((ev) => {
  const dead = ev.deadEntity;
  if (!dead || dead.typeId !== "minecraft:player") return;
  try {
    const [kind, cause] = classifyDeath(ev.damageSource);
    const hint = coordHint(dead.location, dead.dimension.id);
    system.runTimeout(() => reactToDeath(dead.name, kind, cause, hint), rand(20, 50));
  } catch (e) {}
});

const oreState = new Map();
world.afterEvents.playerBreakBlock.subscribe((ev) => {
  const kind = ORES[ev.brokenBlockPermutation.type.id];
  if (!kind) return;
  const key = ev.player.id + ":" + kind;
  const now = system.currentTick;
  const st = oreState.get(key);
  if (st && now < st.until) {
    st.count++;
    return;
  }
  const entry = { until: now + ORE_COOLDOWN, count: 1 };
  oreState.set(key, entry);
  const name = ev.player.name;
  const hint = coordHint(ev.player.location, ev.player.dimension.id);

  system.runTimeout(() => reactToOre(name, kind, entry.count, hint), 60);
});

world.afterEvents.playerSpawn.subscribe((ev) => {
  if (!ev.initialSpawn) return;
  const name = ev.player.name;
  system.runTimeout(() => welcomeBack(name), rand(60, 140));
});

const playerState = new Map();
let nextAmbient = rand(1800, 3600);
nextLocator = rand(6000, 12000);
let ambientTimer = 0;

system.runInterval(() => {
  ambientTimer += 40;
  locatorTimer += 40;
  const now = system.currentTick;
  const players = world.getAllPlayers();

  for (const p of players) {
    try {
      const dim = p.dimension.id;
      const sleeping = p.isSleeping;
      const st = playerState.get(p.id) || { dim, sleeping: false, last: {} };
      if (dim !== st.dim) {
        const cat = dim === "minecraft:nether" ? "dim_nether" : dim === "minecraft:the_end" ? "dim_end" : null;
        if (cat && now - (st.last[cat] || -EVENT_COOLDOWN) >= EVENT_COOLDOWN) {
          st.last[cat] = now;
          const n = p.name;
          system.runTimeout(() => reactToEvent(n, cat), rand(40, 90));
        }
      }
      if (sleeping && !st.sleeping && now - (st.last.sleep || -EVENT_COOLDOWN) >= EVENT_COOLDOWN) {
        st.last.sleep = now;
        const n = p.name;
        system.runTimeout(() => reactToEvent(n, "sleeping"), rand(30, 70));
      }
      st.dim = dim;
      st.sleeping = sleeping;
      playerState.set(p.id, st);
    } catch (e) {}
  }
  if (oreState.size > 20) {
    for (const [k, v] of oreState) if (now >= v.until) oreState.delete(k);
  }

  if (ENABLE_SPAWNER_TIPS && !scanJob && players.length > 0 && locatorTimer >= nextLocator) {
    locatorTimer = 0;
    const target = players[rand(0, players.length - 1)];
    let started = false;
    try {
      started = startScan(target);
    } catch (e) {}
    if (!started) nextLocator = rand(9000, 18000);
  }

  if (players.length > 0 && ambientTimer >= nextAmbient) {
    ambientTimer = 0;
    nextAmbient = rand(1800, 3600);
    ambientConversation();
  }
}, 40);

world.afterEvents.playerLeave.subscribe((ev) => {
  playerState.delete(ev.playerId);
});
