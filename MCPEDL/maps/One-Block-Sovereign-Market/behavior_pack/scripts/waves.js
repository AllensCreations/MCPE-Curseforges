// waves.js - a mob wave defends the core at every phase-up; kill them for coins.
import { world, system } from "@minecraft/server";
import { ORIGIN, onPhaseUp, addCoins } from "./economy.js";
import { bumpStat } from "./stats.js";

let wave = null; // { ids:Set, hitters:Set, phase }

function endWave(cleared) {
  if (!wave) return;
  const w = wave;
  wave = null;
  if (cleared) {
    const reward = 150 * w.phase;
    const winners = world.getAllPlayers().filter((p) => w.hitters.has(p.id));
    for (const p of winners) addCoins(p, reward);
    world.sendMessage(`§6[Wave] §aWave cleared! §f${winners.length ? winners.map((p) => p.name).join(", ") + ` earn ${reward} coins.` : "No rewards (nobody landed a kill)."}`);
  } else {
    for (const id of w.ids) { try { world.getEntity(id)?.remove(); } catch { /* gone */ } }
    world.sendMessage("§6[Wave] §7The wave faded away.");
  }
}

function startWave(phase) {
  if (wave || !world.getAllPlayers().some((p) => p.hasTag("void_cleaned"))) return;
  const dim = world.getDimension("overworld");
  const types = phase >= 3 ? ["minecraft:zombie", "minecraft:skeleton"] : ["minecraft:zombie"];
  const count = 3 + 2 * phase;
  const ids = new Set();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, d = 3 + Math.random() * 3;
    try {
      const e = dim.spawnEntity(types[i % types.length], { x: ORIGIN.x + 0.5 + Math.cos(a) * d, y: ORIGIN.y, z: ORIGIN.z + 0.5 + Math.sin(a) * d });
      ids.add(e.id);
    } catch { /* chunk not loaded */ }
  }
  if (ids.size === 0) return;
  wave = { ids, hitters: new Set(), phase };
  world.sendMessage(`§6[Wave] §c${ids.size} monsters attack the core! §7Defeat them within 5 minutes.`);
  system.runTimeout(() => endWave(false), 20 * 300);
}

export function initWaves() {
  onPhaseUp((phase) => startWave(phase));
  world.afterEvents.entityDie.subscribe((ev) => {
    if (!wave || !wave.ids.has(ev.deadEntity.id)) return;
    wave.ids.delete(ev.deadEntity.id);
    const killer = ev.damageSource?.damagingEntity;
    if (killer && killer.typeId === "minecraft:player") { wave.hitters.add(killer.id); bumpStat(killer, "kills"); }
    if (wave.ids.size === 0) endWave(true);
  });
}
