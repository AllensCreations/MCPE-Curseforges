import { world, system } from "@minecraft/server";

/* ------------------------------ Configuration ------------------------------ */
const GRACE_SECONDS = 15;
const NEAR_MISS_BAND = 0.05;      // roll in [fatal, fatal + band) is a "near-miss"
const WARNING_GAP_SECONDS = 10;   // minimum time between two warning stages
const FINAL_GAP_SECONDS = 5;      // minimum time between Stage 3 and the fatal strike
const JUMPSCARE_TICKS = 40;       // length of the jumpscare before the kill
const RESET_KEY = "sdr:race_over";

const WARNINGS = [
  "",
  "§8[!] §cThe Grim is near... his cold breath brushes against your neck.",
  "§8[!] §4The Grim is near... heavy footsteps echo behind the stone.",
  "§8[!] §4THE GRIM IS HERE... YOUR TIME HAS SLIPPED AWAY."
];

// Escalation: per-second chance of a fatal roll by elapsed seconds.
function fatalChance(seconds) {
  if (seconds < 60) return 0.0035;
  if (seconds < 180) return 0.0075;
  return 0.015;
}

/* --------------------------------- State ----------------------------------- */
const states = new Map();
let raceOver = false;
try {
  raceOver = world.getDynamicProperty(RESET_KEY) === true;
} catch (e) {}

function getState(player) {
  let s = states.get(player.id);
  if (!s) {
    s = { start: system.currentTick, stage: 0, lastWarn: -9999, dying: false, dead: false };
    states.set(player.id, s);
  }
  return s;
}

function elapsedSeconds(s) {
  return (system.currentTick - s.start) / 20;
}

/* --------------------------------- Helpers --------------------------------- */
function sound(player, id, volume, pitch) {
  try {
    player.playSound(id, { volume, pitch });
  } catch (e) {}
}

function effect(player, id, amplifier, ticks) {
  try {
    player.addEffect(id, ticks, { amplifier, showParticles: false });
  } catch (e) {}
}

function burst(dimension, id, loc, count, spread) {
  for (let i = 0; i < count; i++) {
    try {
      dimension.spawnParticle(id, {
        x: loc.x + (Math.random() - 0.5) * spread,
        y: loc.y + Math.random() * 2,
        z: loc.z + (Math.random() - 0.5) * spread
      });
    } catch (e) {
      return;
    }
  }
}

function hasDiamond(player) {
  const inventory = player.getComponent("minecraft:inventory");
  if (!inventory || !inventory.container) return false;
  const container = inventory.container;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId === "minecraft:diamond") return true;
  }
  return false;
}

function clearScreen(player) {
  for (const id of ["blindness", "slowness"]) {
    try {
      player.removeEffect(id);
    } catch (e) {}
  }
  try {
    player.runCommand("title @s clear");
  } catch (e) {}
  try {
    if (player.camera) player.camera.clear();
  } catch (e) {}
}

/* ------------------------------ Warning system ------------------------------ */
function warn(player, s, now) {
  s.stage += 1;
  s.lastWarn = now;
  player.onScreenDisplay.setTitle(" ", {
    subtitle: WARNINGS[s.stage],
    fadeInDuration: 5,
    stayDuration: 80,
    fadeOutDuration: 20
  });
  if (s.stage === 1) {
    sound(player, "ambient.cave", 1, 0.8);
  } else if (s.stage === 2) {
    sound(player, "note.bass", 1, 0.6);
    sound(player, "mob.warden.heartbeat", 1, 1);
  } else {
    sound(player, "mob.elder_guardian.curse", 1, 1);
    effect(player, "blindness", 0, 30);
  }
}

/* --------------------------- Elimination jumpscare --------------------------- */
function snapCamera(player) {
  const rot = player.getRotation();
  try {
    if (player.camera && typeof player.camera.setCamera === "function") {
      const l = player.location;
      player.camera.setCamera("minecraft:free", {
        location: { x: l.x, y: l.y + 1.62, z: l.z },
        rotation: { x: 90, y: rot.y },
        easeOptions: { easeTime: 0.2 }
      });
    }
  } catch (e) {}
  try {
    player.setRotation({ x: 90, y: rot.y });
  } catch (e) {}
  try {
    player.runCommand("camerashake add @s 1 2 rotational");
  } catch (e) {}
}

function jumpscare(player, s) {
  s.dying = true;
  const dimension = player.dimension;
  const loc = player.location;

  effect(player, "slowness", 255, JUMPSCARE_TICKS + 20);
  effect(player, "blindness", 0, 40);

  player.onScreenDisplay.setTitle("§0§k||||||||||||||||||||§r", {
    subtitle: "§4HE FOUND YOU.",
    fadeInDuration: 0,
    stayDuration: 30,
    fadeOutDuration: 5
  });

  sound(player, "mob.ghast.scream", 1, 1.8);
  sound(player, "mob.warden.roar", 1, 1);
  sound(player, "ambient.weather.thunder", 1, 1);

  snapCamera(player);

  try {
    dimension.spawnEntity("minecraft:lightning_bolt", loc);
  } catch (e) {}
  burst(dimension, "minecraft:soul_particle", loc, 24, 3);
  burst(dimension, "minecraft:huge_explosion_emitter", loc, 2, 1);

  system.runTimeout(() => {
    try {
      try {
        if (player.camera) player.camera.clear();
      } catch (e) {}
      if (raceOver) {
        s.dying = false;
        return;
      }
      s.dead = true;
      player.kill();
      world.sendMessage("§8[ROULETTE] §c" + player.name + " failed to find diamonds before the Grim claimed their soul.");
    } catch (e) {
      s.dying = false;
    }
  }, JUMPSCARE_TICKS);
}

/* ---------------------------------- Victory ---------------------------------- */
function declareVictory(winner) {
  if (raceOver) return;
  raceOver = true;
  try {
    world.setDynamicProperty(RESET_KEY, true);
  } catch (e) {}
  world.sendMessage("§a[SURVIVOR] §f" + winner.name + " found Diamonds and banished the Grim!");
  for (const player of world.getAllPlayers()) {
    try {
      const s = getState(player);
      s.stage = 0;
      s.dying = false;
      clearScreen(player);
      sound(player, "random.levelup", 1, 1);
      sound(player, "ui.toast.challenge_complete", 1, 1);
      player.onScreenDisplay.setActionBar("§a[ GRIM LOTTERY ] §fThe Grim has been banished");
    } catch (e) {}
  }
}

/* --------------------------------- Main loops -------------------------------- */
function hud(player, s) {
  const total = Math.floor(elapsedSeconds(s));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  player.onScreenDisplay.setActionBar(
    "§4[ GRIM LOTTERY ] §fTime: " + minutes + "m " + seconds + "s §8| §cThreat: Stage " + s.stage + "/3 §8| §bObjective: Diamond"
  );
}

// Once per second: HUD, then the death lottery.
system.runInterval(() => {
  if (raceOver) return;
  const now = system.currentTick;
  for (const player of world.getAllPlayers()) {
    try {
      const s = getState(player);
      if (s.dead || s.dying) continue;
      hud(player, s);

      const seconds = elapsedSeconds(s);
      if (seconds < GRACE_SECONDS) continue;

      const fatal = fatalChance(seconds);
      const roll = Math.random();
      const sinceWarn = (now - s.lastWarn) / 20;

      if (s.stage >= 3) {
        if (roll < fatal && sinceWarn >= FINAL_GAP_SECONDS) jumpscare(player, s);
      } else if (roll < fatal + NEAR_MISS_BAND && sinceWarn >= WARNING_GAP_SECONDS) {
        // A fatal roll before Stage 3 becomes a near-miss, so every run gets all three warnings.
        warn(player, s, now);
      }
    } catch (e) {}
  }
}, 20);

// Diamond scan runs more often than the roll so a pickup ends the race almost at once.
system.runInterval(() => {
  if (raceOver) return;
  for (const player of world.getAllPlayers()) {
    try {
      const s = getState(player);
      if (s.dead || s.dying) continue;
      if (hasDiamond(player)) {
        declareVictory(player);
        return;
      }
    } catch (e) {}
  }
}, 5);

world.afterEvents.playerLeave.subscribe((event) => {
  states.delete(event.playerId);
});

// Optional: /scriptevent sdr:reset restarts the challenge for everyone.
try {
  if (system.afterEvents && system.afterEvents.scriptEventReceive) {
    system.afterEvents.scriptEventReceive.subscribe((event) => {
      if (event.id !== "sdr:reset") return;
      raceOver = false;
      try {
        world.setDynamicProperty(RESET_KEY, false);
      } catch (e) {}
      states.clear();
      for (const player of world.getAllPlayers()) clearScreen(player);
      world.sendMessage("§8[ROULETTE] §7The Grim stirs again. The race restarts.");
    });
  }
} catch (e) {}
