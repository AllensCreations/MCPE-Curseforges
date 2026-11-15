import { world, system, BlockVolume } from "@minecraft/server";
import { startSessionSimulator } from "./smp_roster.js";
import { coordHint, totalVariations } from "./chat_generator.js";
import { announceSpawner, ambientConversation, reactToDeath, reactToOre, reactToEvent, welcomeBack } from "./chat_director.js";

const ORES = {
  "minecraft:diamond_ore": "diamond",
  "minecraft:deepslate_diamond_ore": "diamond",
  "minecraft:ancient_debris": "debris",
};
const ORE_COOLDOWN = 1200;
const EVENT_COOLDOWN = 3600;

const SCAN_RADIUS = 16;
const SCAN_DEPTH = 40;
const announcedSpawners = new Set();
let nextLocator = 0;
let locatorTimer = 0;

function scanForSpawner(player) {
  if (player.dimension.id !== "minecraft:overworld") return false;
  const range = player.dimension.heightRange;
  const p = player.location;
  const x = Math.floor(p.x);
  const y = Math.floor(p.y);
  const z = Math.floor(p.z);
  const volume = new BlockVolume(
    { x: x - SCAN_RADIUS, y: Math.max(range.min, y - SCAN_DEPTH), z: z - SCAN_RADIUS },
    { x: x + SCAN_RADIUS, y: Math.min(range.max - 1, y + 10), z: z + SCAN_RADIUS }
  );
  let best = null;
  let bestDist = Infinity;
  try {
    const found = player.dimension.getBlocks(volume, { includeTypes: ["minecraft:mob_spawner"] }, false);
    for (const loc of found.getBlockLocationIterator()) {
      const key = loc.x + "," + loc.y + "," + loc.z;
      if (announcedSpawners.has(key)) continue;
      const dist = (loc.x - x) ** 2 + (loc.y - y) ** 2 + (loc.z - z) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = loc;
      }
    }
  } catch (e) {
    return false;
  }
  if (!best) return false;
  if (!announceSpawner(player.name, best)) return false;
  announcedSpawners.add(best.x + "," + best.y + "," + best.z);
  if (announcedSpawners.size > 200) announcedSpawners.clear();
  return true;
}

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

system.run(() => {
  startSessionSimulator();
  console.warn(`[Living SMP Chat by ALNStudios] ready, ${totalVariations()}+ base variations`);
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
nextLocator = rand(12000, 24000);
let ambientTimer = 0;

system.runInterval(() => {
  ambientTimer += 20;
  locatorTimer += 20;
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

  if (players.length > 0 && locatorTimer >= nextLocator) {
    locatorTimer = 0;
    const target = players[rand(0, players.length - 1)];
    let ok = false;
    try {
      ok = scanForSpawner(target);
    } catch (e) {}
    nextLocator = ok ? rand(18000, 30000) : rand(6000, 12000);
  }

  if (players.length > 0 && ambientTimer >= nextAmbient) {
    ambientTimer = 0;
    nextAmbient = rand(1800, 3600);
    ambientConversation();
  }
}, 20);

world.afterEvents.playerLeave.subscribe((ev) => {
  playerState.delete(ev.playerId);
});
