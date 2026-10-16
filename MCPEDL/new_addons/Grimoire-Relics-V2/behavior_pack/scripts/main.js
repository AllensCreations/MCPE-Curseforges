import { world, system, EquipmentSlot } from "@minecraft/server";

const EFFECT_TICKS = 60;
const NV_TICKS = 260;
const MELEE = "entityAttack";
const states = new Map();
const badParticles = new Set();
const SOIL_CROPS = ["minecraft:wheat", "minecraft:carrots", "minecraft:potatoes", "minecraft:beetroot", "minecraft:melon_stem", "minecraft:pumpkin_stem", "minecraft:nether_wart"];
const BLAST = ["blockExplosion", "entityExplosion", "fireworks"];
const GOOD = ["speed", "haste", "strength", "jump_boost", "regeneration", "resistance", "fire_resistance", "water_breathing", "invisibility", "night_vision", "health_boost", "absorption", "saturation", "slow_falling", "conduit_power", "dolphins_grace", "luck", "village_hero"];

function st(p) {
  let s = states.get(p.id);
  if (!s) {
    s = { relic: null, n: 0, ring: 0, peak: {}, light: null, lastXp: null, lastVoid: -99999, lastGolem: -99999 };
    states.set(p.id, s);
  }
  return s;
}

const now = () => system.currentTick;
const health = (e) => e.getComponent("minecraft:health");

function heal(e, amount) {
  const h = health(e);
  if (h) h.setCurrentValue(Math.min(h.effectiveMax, h.currentValue + amount));
}

function addFx(e, id, amp, ticks) {
  try {
    e.addEffect(id, ticks, { amplifier: amp, showParticles: false });
  } catch (err) {}
}

function dropFx(e, ids) {
  for (const id of ids) {
    try {
      e.removeEffect(id);
    } catch (err) {}
  }
}

function particle(dim, id, loc) {
  if (badParticles.has(id)) return;
  try {
    dim.spawnParticle(id, loc);
  } catch (err) {
    badParticles.add(id);
  }
}

function raining(dim) {
  try {
    if (typeof dim.getWeather === "function") {
      const w = dim.getWeather();
      return w === "Rain" || w === "Thunder";
    }
  } catch (err) {}
  return false;
}

function outdoors(p) {
  try {
    const top = p.dimension.getTopmostBlock({ x: Math.floor(p.location.x), z: Math.floor(p.location.z) });
    return !top || top.location.y < p.location.y;
  } catch (err) {
    return true;
  }
}

const isDay = () => world.getTimeOfDay() < 12000;
const isNight = () => {
  const t = world.getTimeOfDay();
  return t >= 13000 && t <= 23000;
};

function kick(e, up) {
  try {
    e.applyImpulse({ x: 0, y: up, z: 0 });
  } catch (err) {
    try {
      e.applyKnockback(0, 0, 0, up);
    } catch (err2) {}
  }
}

/* Tome registry: typeId -> configuration */
const RELICS = {
  "custom:tome_phoenix": {
    name: "Infernal Phoenix", info: ["Permanent Fire Resistance", "Attackers and your targets burn 5s"],
    particle: "minecraft:basic_flame_particle", py: 0.1, ids: ["fire_resistance"],
    effects: () => [["fire_resistance", 0]],
    onHurt: (p, ev, a) => {
      if (a && a.id !== p.id && ev.damageSource.cause === MELEE) {
        a.setOnFire(5, true);
        damageOffhand(p, 1);
      }
    },
    onHit: (p, ev, v) => {
      if (ev.damageSource.cause === MELEE) {
        v.setOnFire(5, true);
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_abyss": {
    name: "Abyssal Tide", info: ["Permanent Water Breathing", "Night Vision under water", "Dolphin's Grace while swimming"],
    particle: "minecraft:water_splash_particle", ids: ["water_breathing", "night_vision", "dolphins_grace"],
    effects: (p) => {
      const l = [["water_breathing", 0]];
      if (p.isInWater) l.push(["night_vision", 0]);
      if (p.isSwimming) l.push(["dolphins_grace", 0]);
      return l;
    }
  },
  "custom:tome_zephyr": {
    name: "Zephyr Wind", info: ["Speed II + Jump Boost I", "Auto Slow Falling when plunging", "No fall damage"],
    particle: "minecraft:white_smoke_particle", py: 0.3, ids: ["speed", "jump_boost", "slow_falling"],
    effects: (p) => {
      const l = [["speed", 1], ["jump_boost", 0]];
      if (!p.isOnGround && p.getVelocity().y < -0.5) l.push(["slow_falling", 0]);
      return l;
    },
    onHurt: (p, ev) => {
      if (ev.damageSource.cause === "fall") {
        heal(p, ev.damage);
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_lich": {
    name: "Necrotic Lich", info: ["Melee strikes inflict Wither II (3s)"],
    particle: "minecraft:soul_particle", ids: [],
    onHit: (p, ev, v) => {
      if (ev.damageSource.cause === MELEE) {
        addFx(v, "wither", 1, 60);
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_titan": {
    name: "Mountain Titan", info: ["Resistance II", "Knockback immunity", "Slowness I"],
    particle: "minecraft:basic_smoke_particle", ids: ["resistance", "slowness"],
    effects: () => [["resistance", 1], ["slowness", 0]],
    onHurt: (p, ev, a) => {
      if (a) {
        system.run(() => { try { p.clearVelocity(); } catch (err) {} });
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_vampire": {
    name: "Blood Vampire", info: ["Melee hits heal you 1 heart"],
    particle: "minecraft:heart_particle", ids: [],
    onHit: (p, ev) => {
      if (ev.damageSource.cause === MELEE) {
        heal(p, 2);
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_lunar": {
    name: "Lunar Eclipse", info: ["At night: Invisibility + Strength I"],
    particle: "minecraft:endrod", ids: ["invisibility", "strength"],
    effects: (p) => (p.dimension.id === "minecraft:overworld" && isNight() ? [["invisibility", 0], ["strength", 0]] : [])
  },
  "custom:tome_solar": {
    name: "Solar Dawn", info: ["Daytime under open sky:", "Saturation + Regeneration I"],
    particle: "minecraft:totem_particle", ids: ["saturation", "regeneration"],
    effects: (p) => (p.dimension.id === "minecraft:overworld" && isDay() && outdoors(p) ? [["saturation", 0], ["regeneration", 0]] : [])
  },
  "custom:tome_druid": {
    name: "Verdant Druid", info: ["Poison immunity", "Fertilizes crops and saplings within 3 blocks"],
    particle: "minecraft:villager_happy", ids: [],
    tick: (p, s) => {
      dropFx(p, ["poison", "fatal_poison"]);
      if (s.n % 6 !== 0) return;
      const l = p.location;
      const bx = Math.floor(l.x), by = Math.floor(l.y), bz = Math.floor(l.z);
      let fertilized = false;
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) for (let dy = -1; dy <= 1; dy++) {
        const b = p.dimension.getBlock({ x: bx + dx, y: by + dy, z: bz + dz });
        if (!b) continue;
        try {
          const perm = b.permutation;
          if (SOIL_CROPS.includes(b.typeId)) {
            const g = perm.getState("growth");
            if (typeof g === "number" && g < 7) {
              b.setPermutation(perm.withState("growth", g + 1));
              fertilized = true;
            }
          } else if (b.typeId.endsWith("_sapling")) {
            b.setPermutation(perm.withState("age_bit", true));
            fertilized = true;
          }
        } catch (err) {}
      }
      if (fertilized) damageOffhand(p, 1);
    }
  },
  "custom:tome_frost": {
    name: "Frost Weaver", info: ["Frost Walker II: walk on water", "Immune to powder snow freezing"],
    particle: "minecraft:snowflake_particle", ids: [],
    tick: (p) => {
      if (p.isSneaking) return;
      const l = p.location;
      const bx = Math.floor(l.x), by = Math.floor(l.y) - 1, bz = Math.floor(l.z);
      let froze = false;
      for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
        const b = p.dimension.getBlock({ x: bx + dx, y: by, z: bz + dz });
        const up = p.dimension.getBlock({ x: bx + dx, y: by + 1, z: bz + dz });
        if (b && up && b.typeId === "minecraft:water" && up.isAir) {
          b.setType("minecraft:frosted_ice");
          froze = true;
        }
      }
      if (froze) damageOffhand(p, 1);
    },
    onHurt: (p, ev) => {
      if (ev.damageSource.cause === "freezing") {
        heal(p, ev.damage);
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_storm": {
    name: "Stormcaller", info: ["Speed III outdoors in rain or thunder", "15% lightning on melee attackers"],
    particle: "minecraft:electric_spark_particle", ids: ["speed"],
    effects: (p) => (raining(p.dimension) && outdoors(p) ? [["speed", 2]] : []),
    onHurt: (p, ev, a) => {
      if (a && a.id !== p.id && ev.damageSource.cause === MELEE && Math.random() < 0.15) {
        a.dimension.spawnEntity("minecraft:lightning_bolt", a.location);
        damageOffhand(p, 2);
      }
    }
  },
  "custom:tome_delver": {
    name: "Deep Delver", info: ["Permanent Haste II", "Light block at your feet in the dark"],
    particle: "minecraft:lava_particle", ids: ["haste"],
    effects: () => [["haste", 1]],
    tick: (p, s) => {
      const l = p.location;
      const pos = { x: Math.floor(l.x), y: Math.floor(l.y), z: Math.floor(l.z) };
      const dark = !outdoors(p) && l.y < 55;
      if (s.light && (!dark || s.light.x !== pos.x || s.light.y !== pos.y || s.light.z !== pos.z)) clearLight(p, s);
      if (!dark || s.light) return;
      const b = p.dimension.getBlock(pos);
      if (!b || !b.isAir) return;
      for (const id of ["minecraft:light_block_12", "minecraft:light_block"]) {
        try {
          b.setType(id);
          s.light = pos;
          return;
        } catch (err) {}
      }
    },
    end: (p, s) => clearLight(p, s)
  },
  "custom:tome_void": {
    name: "Void Phantom", info: ["Void rescue in Overworld & The End", "5 minute cooldown"],
    particle: "minecraft:basic_portal_particle", ids: [],
    fast: (p, s) => {
      const dim = p.dimension.id;
      const isOverworld = dim === "minecraft:overworld";
      const isEnd = dim === "minecraft:the_end";
      if ((!isOverworld && !isEnd) || p.location.y > -20 || now() - s.lastVoid < 6000) return;
      if (isOverworld && p.location.y > -60) return;
      s.lastVoid = now();
      if (isEnd) {
        p.teleport({ x: 100.5, y: 49, z: 0.5 });
      } else {
        let targetY = 65;
        try {
          const top = p.dimension.getTopmostBlock({ x: Math.floor(p.location.x), z: Math.floor(p.location.z) });
          if (top) targetY = top.location.y + 1;
        } catch (err) {}
        p.teleport({ x: p.location.x, y: targetY, z: p.location.z });
      }
      addFx(p, "slow_falling", 0, 100);
      try { p.clearVelocity(); } catch (err) {}
      damageOffhand(p, 10);
      p.onScreenDisplay.setActionBar("§5The Void Phantom pulled you to safety");
    }
  },
  "custom:tome_golem": {
    name: "Iron Golem", info: ["4 Absorption hearts every 30s", "Melee hits launch targets upward"],
    particle: "minecraft:critical_hit_emitter", ids: ["absorption"],
    tick: (p, s) => {
      if (now() - s.lastGolem >= 600) {
        s.lastGolem = now();
        addFx(p, "absorption", 1, 640);
        damageOffhand(p, 1);
      }
    },
    onHit: (p, ev, v) => {
      if (ev.damageSource.cause === MELEE) {
        kick(v, 0.5);
        damageOffhand(p, 1);
      }
    }
  },
  "custom:tome_hydra": {
    name: "Venom Hydra", info: ["Immune to Poison and Wither", "Your hits inflict Poison II (5s)"],
    particle: "minecraft:mobspell_emitter", ids: [],
    tick: (p) => dropFx(p, ["poison", "fatal_poison", "wither"]),
    onHit: (p, ev, v) => {
      addFx(v, "poison", 1, 100);
      damageOffhand(p, 1);
    }
  },
  "custom:tome_alchemist": {
    name: "Cursed Alchemist", info: ["Refreshes your beneficial potion effects"],
    particle: "minecraft:witchspell_emitter", ids: [],
    tick: (p, s) => {
      const seen = {};
      let refreshed = false;
      for (const e of p.getEffects()) {
        const id = e.typeId.replace("minecraft:", "");
        if (!GOOD.includes(id) || e.duration < 0) continue;
        seen[id] = true;
        s.peak[id] = Math.max(s.peak[id] || 0, e.duration);
        if (e.duration < s.peak[id] - 20) {
          addFx(p, id, e.amplifier, s.peak[id]);
          refreshed = true;
        }
      }
      for (const id of Object.keys(s.peak)) if (!seen[id]) delete s.peak[id];
      if (refreshed) damageOffhand(p, 1);
    }
  },
  "custom:tome_seraph": {
    name: "Radiant Seraph", info: ["Permanent Regeneration II", "Immune to Blindness and Nausea"],
    particle: "minecraft:endrod", py: 2.1, ids: ["regeneration"],
    effects: () => [["regeneration", 1]],
    tick: (p) => dropFx(p, ["blindness", "nausea"])
  },
  "custom:tome_scholar": {
    name: "Arcane Scholar", info: ["Experience gained is tripled"],
    particle: "minecraft:enchanting_table_particle", ids: [],
    onEquip: (p, s) => { s.lastXp = null; },
    tick: (p, s) => {
      const x = p.getTotalXp();
      if (s.lastXp !== null && x > s.lastXp) {
        p.addExperience((x - s.lastXp) * 2);
        s.lastXp = p.getTotalXp();
        damageOffhand(p, 1);
      } else s.lastXp = x;
    }
  },
  "custom:tome_mirror": {
    name: "Mirror Trickster", info: ["25% to negate damage", "and blink 3 blocks backward"],
    particle: "minecraft:endrod", ids: [],
    onHurt: (p, ev) => {
      if (Math.random() >= 0.25) return;
      heal(p, ev.damage);
      damageOffhand(p, 2);
      const l = p.location, d = p.getViewDirection();
      const to = { x: l.x - d.x * 3, y: l.y, z: l.z - d.z * 3 };
      for (let i = 0; i < 8; i++) particle(p.dimension, "minecraft:basic_smoke_particle", { x: l.x, y: l.y + 0.3 + i * 0.2, z: l.z });
      const feet = p.dimension.getBlock(to);
      const head = p.dimension.getBlock({ x: to.x, y: to.y + 1, z: to.z });
      if (feet && head && feet.isAir && head.isAir) p.teleport(to);
    }
  },
  "custom:tome_dragon": {
    name: "Cataclysm Dragon", info: ["Strength II + Resistance I", "Immune to dragon breath and explosions"],
    particle: "minecraft:dragon_breath_trail", ids: ["strength", "resistance"],
    effects: () => [["strength", 1], ["resistance", 0]],
    onHurt: (p, ev) => {
      const c = ev.damageSource.cause;
      if (BLAST.includes(c) || (c === "magic" && p.dimension.id === "minecraft:the_end")) {
        heal(p, ev.damage);
        damageOffhand(p, 2);
      }
    }
  }
};

function clearLight(p, s) {
  if (!s.light) return;
  try {
    const b = p.dimension.getBlock(s.light);
    if (b && b.typeId.startsWith("minecraft:light_block")) b.setType("minecraft:air");
  } catch (err) {}
  s.light = null;
}

/* Offhand gate: every effect and trigger reads the live offhand slot */
function offhandItem(p) {
  const eq = p.getComponent("minecraft:equippable");
  return eq ? eq.getEquipment(EquipmentSlot.Offhand) : undefined;
}

function damageOffhand(p, amount = 1) {
  try {
    const eq = p.getComponent("minecraft:equippable");
    if (!eq) return;
    const item = eq.getEquipment(EquipmentSlot.Offhand);
    if (!item) return;
    const dur = item.getComponent("minecraft:durability");
    if (!dur) return;
    
    if (dur.damage + amount >= dur.maxDurability) {
      // Break the item
      eq.setEquipment(EquipmentSlot.Offhand, undefined);
      p.playSound("random.break");
      p.dimension.spawnParticle("minecraft:item_break", { x: p.location.x, y: p.location.y + 1, z: p.location.z });
      p.onScreenDisplay.setActionBar("§cYour Grimoire has shattered!");
    } else {
      dur.damage += amount;
      eq.setEquipment(EquipmentSlot.Offhand, item);
    }
  } catch (err) {}
}

function relicOf(p) {
  const item = offhandItem(p);
  return item ? RELICS[item.typeId] : undefined;
}

function loreFor(cfg) {
  return ["§8Offhand Relic", ...cfg.info.map((t) => "§7• " + t)];
}

function ensureLore(p) {
  const eq = p.getComponent("minecraft:equippable");
  const off = eq && eq.getEquipment(EquipmentSlot.Offhand);
  if (off && RELICS[off.typeId] && off.getLore().length === 0) {
    off.setLore(loreFor(RELICS[off.typeId]));
    eq.setEquipment(EquipmentSlot.Offhand, off);
  }
  const c = p.getComponent("minecraft:inventory").container;
  for (let i = 0; i < c.size; i++) {
    const item = c.getItem(i);
    if (item && RELICS[item.typeId] && item.getLore().length === 0) {
      item.setLore(loreFor(RELICS[item.typeId]));
      c.setItem(i, item);
    }
  }
}

function release(p, s) {
  const old = RELICS[s.relic];
  if (!old) return;
  dropFx(p, old.ids);
  if (old.end) old.end(p, s);
  s.peak = {};
}

function attune(p, s, id) {
  release(p, s);
  s.relic = id;
  const cfg = RELICS[id];
  if (!cfg) return;
  if (cfg.onEquip) cfg.onEquip(p, s);
  p.onScreenDisplay.setActionBar("§6[ ALLENS CREATIONS ] §d✦ Relic Attuned: " + cfg.name + " ✦");
  system.runTimeout(() => {
    try {
      if (s.relic === id) p.onScreenDisplay.setActionBar("§7" + cfg.info.join(" §8|§7 "));
    } catch (err) {}
  }, 50);
}

/* 10-tick passive loop */
let cycle = 0;
system.runInterval(() => {
  cycle++;
  for (const p of world.getAllPlayers()) {
    try {
      const s = st(p);
      const item = offhandItem(p);
      const id = item && RELICS[item.typeId] ? item.typeId : null;
      if (id !== s.relic) attune(p, s, id);
      const cfg = RELICS[id];
      if (cfg) {
        s.n++;
        if (cfg.effects) for (const [fx, amp] of cfg.effects(p, s)) addFx(p, fx, amp, fx === "night_vision" ? NV_TICKS : EFFECT_TICKS);
        if (cfg.tick) cfg.tick(p, s);
      }
      if (cycle % 4 === 0) ensureLore(p);
    } catch (err) {}
  }
}, 10);

/* Fast watch: only the Void Phantom needs it (a fall into the void is quicker than 10 ticks) */
system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    try {
      const s = states.get(p.id);
      const cfg = s && RELICS[s.relic];
      if (cfg && cfg.fast && relicOf(p) === cfg) cfg.fast(p, s);
    } catch (err) {}
  }
}, 2);

/* Aura particles every 8 ticks */
system.runInterval(() => {
  for (const p of world.getAllPlayers()) {
    try {
      const s = states.get(p.id);
      const cfg = s && RELICS[s.relic];
      if (!cfg) continue;
      s.ring += 0.6;
      const l = p.location;
      const y = l.y + (cfg.py === undefined ? 1 : cfg.py);
      for (let i = 0; i < 4; i++) {
        const a = s.ring + (i * Math.PI) / 2;
        particle(p.dimension, cfg.particle, { x: l.x + Math.cos(a) * 0.9, y, z: l.z + Math.sin(a) * 0.9 });
      }
    } catch (err) {}
  }
}, 8);

/* Combat triggers (live offhand check, so unequipping stops them at once) */
world.afterEvents.entityHurt.subscribe((ev) => {
  try {
    const victim = ev.hurtEntity;
    const atk = ev.damageSource.damagingEntity;
    if (victim.typeId === "minecraft:player") {
      const cfg = relicOf(victim);
      if (cfg && cfg.onHurt) cfg.onHurt(victim, ev, atk, st(victim));
    }
    if (atk && atk.typeId === "minecraft:player") {
      const cfg = relicOf(atk);
      if (cfg && cfg.onHit) cfg.onHit(atk, ev, victim, st(atk));
    }
  } catch (err) {}
});

world.afterEvents.playerLeave.subscribe((ev) => {
  const s = states.get(ev.playerId);
  if (s && s.light) {
    try {
      for (const dimName of ["overworld", "nether", "the_end"]) {
        const d = world.getDimension(dimName);
        const b = d && d.getBlock(s.light);
        if (b && b.typeId.startsWith("minecraft:light_block")) b.setType("minecraft:air");
      }
    } catch (err) {}
  }
  states.delete(ev.playerId);
});
