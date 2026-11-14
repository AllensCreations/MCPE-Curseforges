import { world, system, GameMode, EntityDamageCause } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { registerController, endGame, isRunning, onStateChange } from "./controller.js";

const CONFIG = {
  TICK_STEP: 2,
  TENSE_DISTANCE: 10,
  MAX_TETHER_DISTANCE: 15,
  DAMAGE_DISTANCE: 18,
  RECALL_DISTANCE: 64,
  RECALL_TICKS: 100,
  DIMENSION_RECALL_TICKS: 300,
  STRAIN_GRACE_TICKS: 60,
  STRAIN_DAMAGE: 2,
  STRAIN_INTERVAL_TICKS: 20,
  STRAIN_MIN_HEALTH: 2,
  BEAM_INTERVAL_TICKS: 4,
  BEAM_MIN_DISTANCE: 4,
  BEAM_SPACING: 1.25,
  MAX_BEAM_PARTICLES: 12,
  HUD_REFRESH_TICKS: 20,
  WAIT_HUD_TICKS: 20,
  MAX_PULL: 0.6,
  RESPAWN_DELAY_TICKS: 10,
  RESPAWN_GRACE_TICKS: 100,
  PROMPT_GRACE_TICKS: 100,
  NOTICE_TICKS: 60,
  NOTICE_REPEAT_TICKS: 20,
  PROMPT_SWEEP_TICKS: 200
};

const TENSE_SQ = CONFIG.TENSE_DISTANCE * CONFIG.TENSE_DISTANCE;
const MAX_SQ = CONFIG.MAX_TETHER_DISTANCE * CONFIG.MAX_TETHER_DISTANCE;
const DAMAGE_SQ = CONFIG.DAMAGE_DISTANCE * CONFIG.DAMAGE_DISTANCE;
const RECALL_SQ = CONFIG.RECALL_DISTANCE * CONFIG.RECALL_DISTANCE;
const BEAM_MIN_SQ = CONFIG.BEAM_MIN_DISTANCE * CONFIG.BEAM_MIN_DISTANCE;

const ROLE_PROP = "tether:role";
const BREAKER = "breaker";
const BUILDER = "builder";
const WAIT_TEXT = "§7[LEASH: WAITING] §fWaiting for your partner";
const PARTICLES = [
  "minecraft:villager_happy",
  "minecraft:electric_spark_particle",
  "minecraft:basic_flame_particle",
  "minecraft:basic_flame_particle"
];

const FORBIDDEN_EXACT = new Set([
  "minecraft:flint_and_steel", "minecraft:fire_charge", "minecraft:armor_stand",
  "minecraft:end_crystal", "minecraft:item_frame", "minecraft:glow_item_frame",
  "minecraft:painting", "minecraft:bone_meal", "minecraft:ender_eye"
]);

const notices = new Map();
const hudState = new Map();
const roles = new Map();
const placerCache = new Map();
const promptPending = new Set();
const tether = { dimTicks: 0, farTicks: 0, strainTicks: 0, soundCd: 0, beamCd: 0, waitCd: 0, key: -1, text: "" };
const beamPos = { x: 0, y: 0, z: 0 };
const kb = { x: 0, z: 0 };

let pair = null;
let pairDirty = true;
let tickId;
let sweepId;

function computePlacer(id) {
  if (FORBIDDEN_EXACT.has(id)) return true;
  if (id === "minecraft:milk_bucket" || id === "minecraft:bucket") return false;
  return id.endsWith("_bucket") || id.endsWith("_spawn_egg") || id.endsWith("_boat") ||
    id.endsWith("_chest_boat") || id.endsWith("_raft") || id.endsWith("_chest_raft") || id.endsWith("minecart");
}

function isPlacerItem(id) {
  if (!id) return false;
  let v = placerCache.get(id);
  if (v === undefined) {
    v = computePlacer(id);
    placerCache.set(id, v);
  }
  return v;
}

function getRole(player) {
  const id = player?.id;
  if (id === undefined) return undefined;
  const cached = roles.get(id);
  if (cached !== undefined) return cached || undefined;
  let v;
  try { v = player.getDynamicProperty(ROLE_PROP); } catch { return undefined; }
  const role = v === BREAKER || v === BUILDER ? v : undefined;
  roles.set(id, role ?? "");
  return role;
}

function setRole(player, role) {
  try {
    player.setDynamicProperty(ROLE_PROP, role);
    roles.set(player.id, role ?? "");
    player.removeTag("role_breaker");
    player.removeTag("role_builder");
    if (role) player.addTag(role === BREAKER ? "role_breaker" : "role_builder");
  } catch {}
  pairDirty = true;
}

const canPlace = (p) => !isRunning() || getRole(p) === BUILDER;
const canBreak = (p) => !isRunning() || getRole(p) === BREAKER;
const canAttack = (p) => !isRunning() || getRole(p) === BREAKER;

function roleTaken(role, except) {
  return world.getAllPlayers().some((p) => p.id !== except?.id && getRole(p) === role);
}

function notify(player, text) {
  const now = system.currentTick;
  let n = notices.get(player.id);
  if (!n) {
    n = { text, until: 0, shown: -1000, sound: -1000 };
    notices.set(player.id, n);
  }
  n.text = text;
  n.until = now + CONFIG.NOTICE_TICKS;
  const showNow = now - n.shown >= CONFIG.NOTICE_REPEAT_TICKS;
  const soundNow = now - n.sound >= CONFIG.NOTICE_REPEAT_TICKS;
  if (!showNow && !soundNow) return;
  if (showNow) n.shown = now;
  if (soundNow) n.sound = now;
  system.run(() => {
    try {
      if (!player.isValid) return;
      if (showNow) player.onScreenDisplay.setActionBar(text);
      if (soundNow) player.playSound("note.bass", { volume: 0.5, pitch: 0.6 });
    } catch {}
  });
}

function promptRole(player) {
  try {
    if (!isRunning() || !player?.isValid || getRole(player) || promptPending.has(player.id)) return;
    promptPending.add(player.id);
    try { player.addEffect("resistance", CONFIG.PROMPT_GRACE_TICKS, { amplifier: 4, showParticles: false }); } catch {}
    const takenBreaker = roleTaken(BREAKER, player);
    const takenBuilder = roleTaken(BUILDER, player);
    new ActionFormData()
      .title("TETHERED: CHOOSE ROLE")
      .body(
        "Select your role (one player per role):\n\n" +
        "BREAKER:\n- Mines blocks and fights\n- CANNOT place blocks, fluids, fire or spawn things\n\n" +
        "BUILDER:\n- Places blocks and fluids\n- CANNOT mine blocks or attack\n\n" +
        "You are tethered within 15 meters. Until you pick a role you cannot build, mine or fight."
      )
      .button(takenBreaker ? "BREAKER (taken)" : "Play as BREAKER")
      .button(takenBuilder ? "BUILDER (taken)" : "Play as BUILDER")
      .show(player)
      .then((res) => {
        promptPending.delete(player.id);
        if (!isRunning() || !player.isValid || getRole(player) || res.canceled) return;
        const role = res.selection === 0 ? BREAKER : BUILDER;
        if (roleTaken(role, player)) {
          player.sendMessage("§c[TETHERED] That role is already taken. Pick the other one.");
          system.runTimeout(() => promptRole(player), 20);
          return;
        }
        setRole(player, role);
        player.sendMessage(role === BREAKER
          ? "§a[TETHERED] You are the §lBREAKER§r§a! Mine blocks and protect your Builder."
          : "§e[TETHERED] You are the §lBUILDER§r§e! Construct and support your Breaker.");
        player.playSound("random.levelup", { volume: 1, pitch: role === BREAKER ? 1.2 : 1.0 });
      })
      .catch(() => promptPending.delete(player.id));
  } catch {
    promptPending.delete(player?.id);
  }
}

function sweep() {
  if (!isRunning()) return;
  for (const p of world.getAllPlayers()) if (!getRole(p)) promptRole(p);
}

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  if (!isRunning()) return;
  const p = ev.player;
  const id = ev.itemStack?.typeId;
  if (!id) return;
  if (!canPlace(p)) {
    if (!isPlacerItem(id)) return;
    ev.cancel = true;
    if (ev.isFirstEvent) notify(p, "§cOnly the Builder can place blocks, fluids, fire or spawn things!");
    return;
  }
  const lighter = id === "minecraft:flint_and_steel" || id === "minecraft:fire_charge";
  if (id === "minecraft:tnt_minecart" || (lighter && ev.block?.typeId === "minecraft:tnt")) {
    ev.cancel = true;
    if (ev.isFirstEvent) notify(p, "§cThe Builder cannot detonate TNT!");
  }
});

world.afterEvents.playerPlaceBlock.subscribe((ev) => {
  if (!isRunning()) return;
  const p = ev.player;
  if (canPlace(p)) return;
  try {
    const block = ev.block;
    let refund;
    try { refund = block.getItemStack(1, true); } catch {}
    block.setType("minecraft:air");
    if (refund && p.getGameMode() !== GameMode.Creative) {
      const left = p.getComponent("minecraft:inventory")?.container?.addItem(refund);
      if (left) p.dimension.spawnItem(left, p.location);
    }
    notify(p, "§cOnly the Builder can place blocks!");
  } catch {}
});

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
  if (!isRunning() || canBreak(ev.player)) return;
  ev.cancel = true;
  notify(ev.player, "§cOnly the Breaker can break blocks!");
});

world.beforeEvents.entityHurt.subscribe((ev) => {
  if (!isRunning()) return;
  const attacker = ev.damageSource?.damagingEntity;
  if (attacker?.typeId !== "minecraft:player" || attacker.id === ev.hurtEntity?.id || canAttack(attacker)) return;
  ev.cancel = true;
  notify(attacker, "§cOnly the Breaker can attack!");
});

function computePair() {
  let breaker;
  let builder;
  for (const p of world.getAllPlayers()) {
    if (!p.isValid) continue;
    const r = getRole(p);
    if (r === BREAKER && !breaker) breaker = p;
    else if (r === BUILDER && !builder) builder = p;
  }
  return breaker && builder ? { breaker, builder } : null;
}

function getPair() {
  if (!pairDirty && (pair === null || (pair.breaker.isValid && pair.builder.isValid))) return pair;
  pairDirty = false;
  pair = computePair();
  return pair;
}

function mode(p) {
  try { return p.getGameMode(); } catch { return GameMode.Survival; }
}

function isAlive(p) {
  try {
    const h = p.getComponent("minecraft:health");
    return !h || h.currentValue > 0;
  } catch { return false; }
}

function hud(p, text) {
  const now = system.currentTick;
  const n = notices.get(p.id);
  const out = n && n.until > now ? n.text : text;
  let s = hudState.get(p.id);
  if (s === undefined) {
    s = { text: "", tick: -1000 };
    hudState.set(p.id, s);
  }
  if (s.text === out && now - s.tick < CONFIG.HUD_REFRESH_TICKS) return;
  s.text = out;
  s.tick = now;
  try { p.onScreenDisplay.setActionBar(out); } catch {}
}

function resetTether() {
  tether.dimTicks = 0;
  tether.farTicks = 0;
  tether.strainTicks = 0;
  tether.soundCd = 0;
  tether.beamCd = 0;
  tether.key = -1;
}

function safeTeleport(p, target) {
  const dest = { x: target.location.x, y: target.location.y, z: target.location.z };
  try {
    p.teleport(dest, { dimension: target.dimension, checkForBlocks: true });
  } catch {
    try { p.teleport(dest, { dimension: target.dimension }); } catch {}
  }
}

function renderBeam(dim, a, b, dist, particle) {
  const steps = Math.min(CONFIG.MAX_BEAM_PARTICLES, Math.max(2, Math.floor(dist / CONFIG.BEAM_SPACING)));
  const sx = (b.x - a.x) / steps;
  const sy = (b.y - a.y) / steps;
  const sz = (b.z - a.z) / steps;
  try {
    for (let i = 1; i < steps; i++) {
      beamPos.x = a.x + sx * i;
      beamPos.y = a.y + 1.1 + sy * i;
      beamPos.z = a.z + sz * i;
      dim.spawnParticle(particle, beamPos);
    }
  } catch {}
}

function pull(p, dx, dz, strength) {
  const m = mode(p);
  if (m === GameMode.Creative || m === GameMode.Spectator) return;
  kb.x = dx * strength;
  kb.z = dz * strength;
  try { p.applyKnockback(kb, 0); } catch {}
}

function anchored(p) {
  try { return p.isOnGround || p.isInWater || p.isClimbing; } catch { return false; }
}

function strain(p) {
  try {
    const h = p.getComponent("minecraft:health");
    if (!h || h.currentValue - CONFIG.STRAIN_DAMAGE < CONFIG.STRAIN_MIN_HEALTH) return;
    p.applyDamage(CONFIG.STRAIN_DAMAGE, { cause: EntityDamageCause.contact });
    p.playSound("random.break", { volume: 0.9, pitch: 1.1 });
  } catch {}
}

function leashText(level, d) {
  if (level === 0) return `§a[LEASH: SLACK] §fDistance: ${d}m`;
  if (level === 1) return `§e[LEASH: TENSE] §fDistance: ${d}m`;
  if (level === 2) return `§6[LEASH: OVERSTRETCHED] §fDistance: ${d}m`;
  return `§c[LEASH: STRAINED] §fDistance: ${d}m! Damage incoming`;
}

function waitForPartner(step) {
  resetTether();
  tether.waitCd += step;
  if (tether.waitCd < CONFIG.WAIT_HUD_TICKS) return;
  tether.waitCd = 0;
  for (const p of world.getAllPlayers()) if (getRole(p)) hud(p, WAIT_TEXT);
}

function tick() {
  if (!isRunning()) return;
  const step = CONFIG.TICK_STEP;
  const pr = getPair();
  if (!pr) { waitForPartner(step); return; }
  const { breaker: A, builder: B } = pr;

  if (!isAlive(A) || !isAlive(B)) { resetTether(); return; }
  if (mode(A) === GameMode.Spectator || mode(B) === GameMode.Spectator) {
    hud(A, "§7[LEASH: PAUSED] §fSpectator");
    hud(B, "§7[LEASH: PAUSED] §fSpectator");
    resetTether();
    return;
  }

  if (A.dimension.id !== B.dimension.id) {
    tether.dimTicks += step;
    const left = Math.max(0, Math.ceil((CONFIG.DIMENSION_RECALL_TICKS - tether.dimTicks) / 20));
    const text = `§c[LEASH: STRETCHED ACROSS DIMENSIONS] §fFollow your partner! Recall in ${left}s`;
    hud(A, text);
    hud(B, text);
    if (tether.dimTicks >= CONFIG.DIMENSION_RECALL_TICKS) {
      safeTeleport(B, A);
      tether.dimTicks = 0;
    }
    return;
  }
  tether.dimTicks = 0;

  const la = A.location;
  const lb = B.location;
  const dx = lb.x - la.x;
  const dy = lb.y - la.y;
  const dz = lb.z - la.z;
  const d2 = dx * dx + dy * dy + dz * dz;

  if (d2 > RECALL_SQ) {
    tether.farTicks += step;
    tether.strainTicks = 0;
    const left = Math.max(0, Math.ceil((CONFIG.RECALL_TICKS - tether.farTicks) / 20));
    const text = `§c[LEASH: SNAPPED] §f${Math.floor(Math.sqrt(d2))}m apart. Recall in ${left}s`;
    hud(A, text);
    hud(B, text);
    tether.key = -1;
    if (tether.farTicks >= CONFIG.RECALL_TICKS) {
      safeTeleport(B, A);
      tether.farTicks = 0;
    }
    return;
  }
  tether.farTicks = 0;

  let level = 0;
  if (d2 > DAMAGE_SQ) level = 3;
  else if (d2 > MAX_SQ) level = 2;
  else if (d2 >= TENSE_SQ) level = 1;

  const dist = Math.sqrt(d2);
  const half = Math.round(dist * 2);
  const key = level * 10000 + half;
  if (key !== tether.key) {
    tether.key = key;
    tether.text = leashText(level, (half / 2).toFixed(1));
  }

  tether.beamCd += step;
  if (tether.beamCd >= CONFIG.BEAM_INTERVAL_TICKS) {
    tether.beamCd = 0;
    if (d2 >= BEAM_MIN_SQ) renderBeam(A.dimension, la, lb, dist, PARTICLES[level]);
  }
  hud(A, tether.text);
  hud(B, tether.text);

  if (level < 2) {
    tether.strainTicks = 0;
    tether.soundCd = 0;
    return;
  }

  const hd = Math.sqrt(dx * dx + dz * dz);
  if (hd > 0.01) {
    const ux = dx / hd;
    const uz = dz / hd;
    const s = Math.min(CONFIG.MAX_PULL, 0.2 + (dist - CONFIG.MAX_TETHER_DISTANCE) * 0.04);
    const anchorA = anchored(A);
    const anchorB = anchored(B);
    if (anchorA && !anchorB) pull(B, -ux, -uz, s);
    else if (anchorB && !anchorA) pull(A, ux, uz, s);
    else {
      pull(A, ux, uz, s * 0.6);
      pull(B, -ux, -uz, s * 0.6);
    }
  }

  tether.soundCd += step;
  if (tether.soundCd >= 16) {
    tether.soundCd = 0;
    try {
      A.playSound("note.bass", { volume: 0.8, pitch: 0.5 });
      B.playSound("note.bass", { volume: 0.8, pitch: 0.5 });
    } catch {}
  }

  if (level === 2) {
    tether.strainTicks = 0;
    return;
  }
  tether.strainTicks += step;
  const over = tether.strainTicks - CONFIG.STRAIN_GRACE_TICKS;
  if (over >= 0 && over % CONFIG.STRAIN_INTERVAL_TICKS < step) {
    strain(A);
    strain(B);
  }
}

function syncLoops() {
  if (isRunning()) {
    if (tickId === undefined) tickId = system.runInterval(tick, CONFIG.TICK_STEP);
    if (sweepId === undefined) sweepId = system.runInterval(sweep, CONFIG.PROMPT_SWEEP_TICKS);
    return;
  }
  if (tickId !== undefined) {
    system.clearRun(tickId);
    tickId = undefined;
  }
  if (sweepId !== undefined) {
    system.clearRun(sweepId);
    sweepId = undefined;
  }
  pair = null;
  hudState.clear();
  resetTether();
  tether.waitCd = 0;
}

onStateChange(() => {
  pairDirty = true;
  syncLoops();
});
system.run(syncLoops);

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  pairDirty = true;
  if (initialSpawn) roles.delete(player.id);
  if (!isRunning()) return;
  if (initialSpawn) {
    if (!getRole(player)) system.runTimeout(() => promptRole(player), 40);
    return;
  }
  system.runTimeout(() => {
    try {
      if (!isRunning() || !player.isValid) return;
      if (!getRole(player)) { promptRole(player); return; }
      const pr = getPair();
      if (!pr || (player.id !== pr.breaker.id && player.id !== pr.builder.id)) return;
      const partner = player.id === pr.breaker.id ? pr.builder : pr.breaker;
      if (!partner.isValid || !isAlive(partner)) return;
      safeTeleport(player, partner);
      player.addEffect("resistance", CONFIG.RESPAWN_GRACE_TICKS, { amplifier: 4, showParticles: false });
      player.addEffect("regeneration", CONFIG.RESPAWN_GRACE_TICKS, { amplifier: 1, showParticles: false });
      player.sendMessage("§a[TETHERED] You respawned and re-anchored to your partner!");
      partner.sendMessage(`§a[TETHERED] ${player.name} respawned at your position.`);
    } catch {}
  }, CONFIG.RESPAWN_DELAY_TICKS);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  notices.delete(playerId);
  hudState.delete(playerId);
  roles.delete(playerId);
  promptPending.delete(playerId);
  pairDirty = true;
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (!isRunning() || deadEntity?.typeId !== "minecraft:ender_dragon") return;
  world.sendMessage("§6[TETHERED] The Ender Dragon has fallen. The tethered pair wins!");
  endGame();
});

function resolveTarget(ev) {
  if (ev.sourceEntity?.typeId === "minecraft:player") return ev.sourceEntity;
  const name = ev.message?.trim();
  return name ? world.getAllPlayers().find((p) => p.name === name) : undefined;
}

function forceRole(target, role) {
  for (const o of world.getAllPlayers()) if (o.id !== target.id && getRole(o) === role) setRole(o, undefined);
  setRole(target, role);
  target.sendMessage(`§a[TETHERED] Assigned to role: ${role.toUpperCase()}.`);
}

system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (!isRunning()) return;
  if (ev.id === "tether:reset") {
    for (const p of world.getAllPlayers()) setRole(p, undefined);
    world.sendMessage("§c[TETHERED] All roles have been reset.");
  } else if (ev.id === "tether:swap") {
    const pr = getPair();
    if (!pr) return;
    setRole(pr.breaker, BUILDER);
    setRole(pr.builder, BREAKER);
    world.sendMessage("§e[TETHERED] Roles swapped.");
  } else if (ev.id === "tether:breaker" || ev.id === "tether:builder") {
    const target = resolveTarget(ev);
    if (!target) return;
    forceRole(target, ev.id === "tether:breaker" ? BREAKER : BUILDER);
  }
});

registerController({
  title: "Tethered: Breaker and Builder",
  gameInfo: "Type: Co-op challenge\nPlayers: 2 (one Breaker, one Builder)\nGoal: Defeat the Ender Dragon together while tethered within 15 meters.",
  howToPlay: "Goal: Defeat the Ender Dragon as a pair.\nRoles: The Breaker mines and fights but cannot place anything. The Builder places blocks and fluids but cannot mine or attack.\nLeash: Stay within 15 meters. Beyond that you are pulled together, and beyond 18 meters you take strain damage.\nHow it ends: The Ender Dragon dies, or an operator uses the end game function.",
  onStart: () => {
    resetTether();
    for (const p of world.getAllPlayers()) {
      setRole(p, undefined);
      promptRole(p);
    }
    world.sendMessage("§a[TETHERED] The challenge has started. Choose your roles.");
  },
  onEnd: () => {
    resetTether();
    notices.clear();
    hudState.clear();
    for (const p of world.getAllPlayers()) setRole(p, undefined);
    world.sendMessage("§c[TETHERED] The challenge has ended. Restrictions are lifted.");
  }
});
