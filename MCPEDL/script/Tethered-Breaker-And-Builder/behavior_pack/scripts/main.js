import { world, system, GameMode, EntityDamageCause } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { registerController, endGame } from "./controller.js";

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
  MAX_BEAM_PARTICLES: 32,
  MAX_PULL: 0.6,
  RESPAWN_DELAY_TICKS: 10,
  RESPAWN_GRACE_TICKS: 100,
  NOTICE_TICKS: 60,
  PROMPT_SWEEP_TICKS: 200
};

const ROLE_PROP = "tether:role";
const BREAKER = "breaker";
const BUILDER = "builder";

const FORBIDDEN_EXACT = new Set([
  "minecraft:flint_and_steel", "minecraft:fire_charge", "minecraft:armor_stand",
  "minecraft:end_crystal", "minecraft:item_frame", "minecraft:glow_item_frame",
  "minecraft:painting", "minecraft:bone_meal", "minecraft:ender_eye"
]);

const notices = new Map();
const lastSound = new Map();
const promptPending = new Set();
const tether = { dimTicks: 0, farTicks: 0, strainTicks: 0, soundCd: 0 };

const running = () => world.getDynamicProperty("game_state") === "running";

function isPlacerItem(id) {
  if (!id) return false;
  if (FORBIDDEN_EXACT.has(id)) return true;
  if (id === "minecraft:milk_bucket" || id === "minecraft:bucket") return false;
  return id.endsWith("_bucket") || id.endsWith("_spawn_egg") || id.endsWith("_boat") ||
    id.endsWith("_chest_boat") || id.endsWith("_raft") || id.endsWith("_chest_raft") || id.endsWith("minecart");
}

function getRole(player) {
  try { return player?.getDynamicProperty(ROLE_PROP); } catch { return undefined; }
}

function setRole(player, role) {
  try {
    player.setDynamicProperty(ROLE_PROP, role);
    player.removeTag("role_breaker");
    player.removeTag("role_builder");
    if (role) player.addTag(role === BREAKER ? "role_breaker" : "role_builder");
  } catch {}
}

const canPlace = (p) => !running() || getRole(p) === BUILDER;
const canBreak = (p) => !running() || getRole(p) === BREAKER;
const canAttack = (p) => !running() || getRole(p) === BREAKER;

function roleTaken(role, except) {
  return world.getAllPlayers().some((p) => p.id !== except?.id && getRole(p) === role);
}

function notify(player, text) {
  const now = system.currentTick;
  notices.set(player.id, { text, until: now + CONFIG.NOTICE_TICKS });
  if ((lastSound.get(player.id) ?? -100) + 20 > now) return;
  lastSound.set(player.id, now);
  system.run(() => {
    try { if (player.isValid) player.playSound("note.bass", { volume: 0.5, pitch: 0.6 }); } catch {}
  });
}

function promptRole(player) {
  try {
    if (!running() || !player?.isValid || getRole(player) || promptPending.has(player.id)) return;
    promptPending.add(player.id);
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
        if (!running() || !player.isValid || getRole(player) || res.canceled) return;
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

system.runInterval(() => {
  if (!running()) return;
  for (const p of world.getAllPlayers()) if (!getRole(p)) promptRole(p);
}, CONFIG.PROMPT_SWEEP_TICKS);

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  if (!running()) return;
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
  if (canBreak(ev.player)) return;
  ev.cancel = true;
  notify(ev.player, "§cOnly the Breaker can break blocks!");
});

world.beforeEvents.entityHurt.subscribe((ev) => {
  const attacker = ev.damageSource?.damagingEntity;
  if (attacker?.typeId !== "minecraft:player" || attacker.id === ev.hurtEntity?.id || canAttack(attacker)) return;
  ev.cancel = true;
  notify(attacker, "§cOnly the Breaker can attack!");
});

function getPair() {
  const players = world.getAllPlayers().filter((p) => p.isValid);
  const breaker = players.find((p) => getRole(p) === BREAKER);
  const builder = players.find((p) => getRole(p) === BUILDER);
  return breaker && builder ? { breaker, builder } : null;
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
  const n = notices.get(p.id);
  try { p.onScreenDisplay.setActionBar(n && n.until > system.currentTick ? n.text : text); } catch {}
}

function resetTether() {
  tether.dimTicks = 0;
  tether.farTicks = 0;
  tether.strainTicks = 0;
  tether.soundCd = 0;
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
  const steps = Math.min(CONFIG.MAX_BEAM_PARTICLES, Math.max(2, Math.floor(dist)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    try {
      dim.spawnParticle(particle, {
        x: a.x + (b.x - a.x) * t,
        y: a.y + 1.1 + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t
      });
    } catch {}
  }
}

function pull(p, dx, dz, strength) {
  const m = mode(p);
  if (m === GameMode.Creative || m === GameMode.Spectator) return;
  try { p.applyKnockback({ x: dx * strength, z: dz * strength }, 0); } catch {}
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

function tick() {
  const pair = running() ? getPair() : null;
  if (!pair) { resetTether(); return; }
  const { breaker: A, builder: B } = pair;
  const step = CONFIG.TICK_STEP;

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
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (dist > CONFIG.RECALL_DISTANCE) {
    tether.farTicks += step;
    tether.strainTicks = 0;
    const left = Math.max(0, Math.ceil((CONFIG.RECALL_TICKS - tether.farTicks) / 20));
    const text = `§c[LEASH: SNAPPED] §f${Math.floor(dist)}m apart. Recall in ${left}s`;
    hud(A, text);
    hud(B, text);
    if (tether.farTicks >= CONFIG.RECALL_TICKS) {
      safeTeleport(B, A);
      tether.farTicks = 0;
    }
    return;
  }
  tether.farTicks = 0;

  const d = dist.toFixed(1);
  let particle = "minecraft:villager_happy";
  let text = `§a[LEASH: SLACK] §fDistance: ${d}m`;
  if (dist >= CONFIG.TENSE_DISTANCE && dist <= CONFIG.MAX_TETHER_DISTANCE) {
    particle = "minecraft:electric_spark_particle";
    text = `§e[LEASH: TENSE] §fDistance: ${d}m`;
  } else if (dist > CONFIG.MAX_TETHER_DISTANCE && dist <= CONFIG.DAMAGE_DISTANCE) {
    particle = "minecraft:basic_flame_particle";
    text = `§6[LEASH: OVERSTRETCHED] §fDistance: ${d}m`;
  } else if (dist > CONFIG.DAMAGE_DISTANCE) {
    particle = "minecraft:basic_flame_particle";
    text = `§c[LEASH: STRAINED] §fDistance: ${d}m! Damage incoming`;
  }

  renderBeam(A.dimension, la, lb, dist, particle);
  hud(A, text);
  hud(B, text);

  if (dist <= CONFIG.MAX_TETHER_DISTANCE) {
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

  if (dist <= CONFIG.DAMAGE_DISTANCE) {
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

system.runInterval(tick, CONFIG.TICK_STEP);

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!running()) return;
  if (initialSpawn) {
    if (!getRole(player)) system.runTimeout(() => promptRole(player), 40);
    return;
  }
  system.runTimeout(() => {
    try {
      if (!running() || !player.isValid) return;
      if (!getRole(player)) { promptRole(player); return; }
      const pair = getPair();
      if (!pair || (player.id !== pair.breaker.id && player.id !== pair.builder.id)) return;
      const partner = player.id === pair.breaker.id ? pair.builder : pair.breaker;
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
  lastSound.delete(playerId);
  promptPending.delete(playerId);
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (!running() || deadEntity?.typeId !== "minecraft:ender_dragon") return;
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
  if (!running()) return;
  if (ev.id === "tether:reset") {
    for (const p of world.getAllPlayers()) setRole(p, undefined);
    world.sendMessage("§c[TETHERED] All roles have been reset.");
  } else if (ev.id === "tether:swap") {
    const pair = getPair();
    if (!pair) return;
    setRole(pair.breaker, BUILDER);
    setRole(pair.builder, BREAKER);
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
    for (const p of world.getAllPlayers()) setRole(p, undefined);
    world.sendMessage("§c[TETHERED] The challenge has ended. Restrictions are lifted.");
  }
});
