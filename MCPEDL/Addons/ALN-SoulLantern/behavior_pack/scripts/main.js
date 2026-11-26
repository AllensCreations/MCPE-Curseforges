import { world, system, ItemStack, EntityComponentTypes, EntityDamageCause, StructureSaveMode } from "@minecraft/server";

const EMPTY_ID = "aln:soul_lantern";
const GENERIC_ID = "aln:soul_lantern_filled";
const LANTERN_PREFIX = "aln:soul_lantern_";
const SPIRIT_ID = "aln:spirit";
const SPIRIT_TAG = "aln_spirit";
const SPIRIT_TICKS = 400;
const COOLDOWN_TICKS = 200;
const DEBOUNCE_TICKS = 8;
const REGROW_STEP = 0.02;
const SHRUNK_SIZE = 0.3;
const SEEK_RANGE = 12;
const CHASE_STEP = 0.3;

const COMBAT = {
  melee: { reach: 2, dmg: 4, every: 20 },
  fast: { reach: 2, dmg: 3, every: 12 },
  heavy: { reach: 2.4, dmg: 8, every: 28 },
  kamikaze: { reach: 2.4, dmg: 0, every: 0 },
  archer: { reach: 10, dmg: 3, every: 30, ranged: true },
  snow: { reach: 8, dmg: 1, every: 20, ranged: true },
};

const KIND_NAMES = ["", "creeper", "skeleton", "zombie", "spider", "pig", "cow", "sheep", "chicken", "wolf", "villager", "iron_golem", "enderman", "blaze", "snow_golem", "cat", "horse", "bee", "axolotl", "fox", "witch", "slime", "ghast", "rabbit", "polar_bear"];
const BOSSES = new Set(["minecraft:ender_dragon", "minecraft:wither", "minecraft:warden", "minecraft:elder_guardian"]);
const NOT_SEALABLE = new Set(["minecraft:player", "minecraft:armor_stand", "minecraft:npc", "minecraft:agent"]);
const DYES = ["White", "Orange", "Magenta", "Light Blue", "Yellow", "Lime", "Pink", "Gray", "Light Gray", "Cyan", "Purple", "Blue", "Brown", "Green", "Red", "Black"];
const AXOLOTLS = ["Lucy", "Wild", "Gold", "Cyan", "Blue"];

const SPECIES = {
  "minecraft:creeper": { fig: 1, mode: "kamikaze" },
  "minecraft:skeleton": { fig: 2, mode: "archer" },
  "minecraft:stray": { fig: 2, mode: "archer" },
  "minecraft:bogged": { fig: 2, mode: "archer" },
  "minecraft:zombie": { fig: 3, mode: "melee" },
  "minecraft:husk": { fig: 3, mode: "melee" },
  "minecraft:drowned": { fig: 3, mode: "melee" },
  "minecraft:zombie_villager": { fig: 3, mode: "melee" },
  "minecraft:spider": { fig: 4, mode: "fast" },
  "minecraft:cave_spider": { fig: 4, mode: "fast" },
  "minecraft:pig": { fig: 5, mode: "melee" },
  "minecraft:cow": { fig: 6, mode: "melee" },
  "minecraft:mooshroom": { fig: 6, mode: "melee" },
  "minecraft:sheep": { fig: 7, mode: "melee" },
  "minecraft:chicken": { fig: 8, mode: "fast" },
  "minecraft:wolf": { fig: 9, mode: "fast" },
  "minecraft:villager": { fig: 10, mode: "melee" },
  "minecraft:wandering_trader": { fig: 10, mode: "melee" },
  "minecraft:iron_golem": { fig: 11, mode: "heavy" },
  "minecraft:enderman": { fig: 12, mode: "heavy" },
  "minecraft:blaze": { fig: 13, mode: "fast" },
  "minecraft:snow_golem": { fig: 14, mode: "snow" },
  "minecraft:cat": { fig: 15, mode: "fast" },
  "minecraft:ocelot": { fig: 15, mode: "fast" },
  "minecraft:fox": { fig: 19, mode: "fast" },
  "minecraft:ravager": { fig: 0, mode: "heavy" },
  "minecraft:hoglin": { fig: 0, mode: "heavy" },
  "minecraft:zoglin": { fig: 0, mode: "heavy" },
  "minecraft:polar_bear": { fig: 24, mode: "heavy" },
  "minecraft:piglin_brute": { fig: 0, mode: "heavy" },
  "minecraft:horse": { fig: 16, mode: "fast" },
  "minecraft:donkey": { fig: 16, mode: "fast" },
  "minecraft:mule": { fig: 16, mode: "fast" },
  "minecraft:bee": { fig: 17, mode: "fast" },
  "minecraft:axolotl": { fig: 18, mode: "melee" },
  "minecraft:witch": { fig: 20, mode: "melee" },
  "minecraft:slime": { fig: 21, mode: "melee" },
  "minecraft:magma_cube": { fig: 21, mode: "melee" },
  "minecraft:ghast": { fig: 22, mode: "melee" },
  "minecraft:rabbit": { fig: 23, mode: "fast" },
};

const KEY = {
  sid: "aln_sid",
  type: "aln_type",
  name: "aln_name",
  hp: "aln_hp",
  maxHp: "aln_max_hp",
  baby: "aln_baby",
  details: "aln_details",
};

const spirits = new Map();
const cooldowns = new Map();
const lastAction = new Map();
const releasing = new Set();

const tell = (player, color, text) => {
  try {
    player.onScreenDisplay.setActionBar(`${color}${text}`);
  } catch (e) {}
};

const play = (player, id) => {
  try {
    player.playSound(id);
  } catch (e) {}
};

const containerOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

const component = (entity, id) => {
  try {
    return entity.getComponent(id);
  } catch (e) {
    return undefined;
  }
};

const prettyType = (typeId) =>
  String(typeId)
    .replace(/^[^:]*:/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const newStructureId = () => `aln:soul_${system.currentTick.toString(36)}${Math.floor(Math.random() * 1679616).toString(36)}`;

const isFilled = (typeId) => typeof typeId === "string" && typeId.startsWith(LANTERN_PREFIX);

const busy = (player) => {
  const last = lastAction.get(player.id);
  return last !== undefined && system.currentTick - last < DEBOUNCE_TICKS;
};

const mark = (player) => lastAction.set(player.id, system.currentTick);

function lanternFor(type) {
  const fig = SPECIES[type]?.fig ?? 0;
  return fig > 0 ? `${LANTERN_PREFIX}${KIND_NAMES[fig]}` : GENERIC_ID;
}

function colorLabel(typeId, value) {
  if (typeId === "minecraft:axolotl") return `Variant ${AXOLOTLS[value] ?? value}`;
  if (typeId === "minecraft:sheep") return `Wool ${DYES[value] ?? value}`;
  if (typeId === "minecraft:wolf" || typeId === "minecraft:cat") return `Collar ${DYES[value] ?? value}`;
  return `Color ${DYES[value] ?? value}`;
}

function readInfo(entity) {
  const health = component(entity, "minecraft:health");
  const details = [];
  const color = component(entity, "minecraft:color")?.value;
  if (color !== undefined) details.push(colorLabel(entity.typeId, color));
  const variant = component(entity, "minecraft:variant")?.value;
  if (variant !== undefined && entity.typeId !== "minecraft:axolotl") details.push(`Variant ${variant}`);
  const pattern = component(entity, "minecraft:mark_variant")?.value;
  if (pattern !== undefined) details.push(`Pattern ${pattern}`);
  if (component(entity, "minecraft:is_tamed")) details.push("Tamed");
  return {
    type: entity.typeId,
    name: entity.nameTag ?? "",
    hp: health ? Math.round(health.currentValue * 10) / 10 : 0,
    maxHp: health ? Math.round(health.effectiveMax * 10) / 10 : 0,
    baby: component(entity, "minecraft:is_baby") !== undefined,
    details: details.join(", "),
  };
}

function readStack(stack) {
  const get = (k, fallback) => {
    const v = stack.getDynamicProperty(k);
    return v === undefined ? fallback : v;
  };
  const type = get(KEY.type, "minecraft:unknown");
  return {
    sid: get(KEY.sid, ""),
    type,
    species: prettyType(type) + (get(KEY.baby, false) ? " (Baby)" : ""),
    name: get(KEY.name, ""),
    hp: get(KEY.hp, 0),
    maxHp: get(KEY.maxHp, 0),
    details: get(KEY.details, ""),
  };
}

function refreshDisplay(stack) {
  const d = readStack(stack);
  stack.nameTag = `§b§lSoul Lantern§r §3- §b${d.name || d.species}`;
  stack.setLore([
    `§7Species: §f${d.species}`,
    `§7Name: §f${d.name || "None"}`,
    `§7Health: §f${d.hp}/${d.maxHp}`,
    `§7Details: §f${d.details || "None"}`,
    "§8Sneak + click: release  Use: Spectral Ally",
  ]);
}

function swirl(dim, center) {
  for (let step = 0; step < 10; step++) {
    system.runTimeout(() => {
      const radius = 1.4 - step * 0.13;
      for (let k = 0; k < 4; k++) {
        const angle = step * 0.7 + (k * Math.PI) / 2;
        try {
          dim.spawnParticle("minecraft:blue_flame_particle", {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + step * 0.05,
            z: center.z + Math.sin(angle) * radius,
          });
        } catch (e) {}
      }
    }, step * 2);
  }
}

function burst(dim, center) {
  for (let k = 0; k < 12; k++) {
    const angle = (k * Math.PI) / 6;
    try {
      dim.spawnParticle("minecraft:endrod", {
        x: center.x + Math.cos(angle) * 0.6,
        y: center.y + 0.3 + (k % 3) * 0.3,
        z: center.z + Math.sin(angle) * 0.6,
      });
    } catch (e) {}
  }
}

function tryCapture(player, target, slot) {
  const container = containerOf(player);
  const held = container?.getItem(slot);
  if (!container || held?.typeId !== EMPTY_ID) return;
  if (target.isValid === false) return;
  if (BOSSES.has(target.typeId)) {
    play(player, "random.break");
    tell(player, "§c", "The Soul Lantern trembles. This soul is too powerful to seal.");
    return;
  }
  if (NOT_SEALABLE.has(target.typeId) || target.hasTag(SPIRIT_TAG) || !component(target, "minecraft:health")) {
    tell(player, "§e", "The Soul Lantern cannot seal this.");
    return;
  }
  const info = readInfo(target);
  const loc = target.location;
  const dim = target.dimension;
  const cell = { x: Math.floor(loc.x), y: Math.floor(loc.y), z: Math.floor(loc.z) };
  const sid = newStructureId();
  try {
    world.structureManager.createFromWorld(sid, dim, cell, cell, {
      includeBlocks: false,
      includeEntities: true,
      saveMode: StructureSaveMode.World,
    });
  } catch (e) {
    tell(player, "§c", "The soul slipped away. Try again.");
    return;
  }
  const stack = new ItemStack(lanternFor(info.type), 1);
  stack.setDynamicProperty(KEY.sid, sid);
  stack.setDynamicProperty(KEY.type, info.type);
  stack.setDynamicProperty(KEY.name, info.name);
  stack.setDynamicProperty(KEY.hp, info.hp);
  stack.setDynamicProperty(KEY.maxHp, info.maxHp);
  stack.setDynamicProperty(KEY.baby, info.baby);
  stack.setDynamicProperty(KEY.details, info.details);
  refreshDisplay(stack);
  target.remove();
  container.setItem(slot, stack);
  swirl(dim, { x: loc.x, y: loc.y + 0.8, z: loc.z });
  play(player, "block.amethyst_block.chime");
  tell(player, "§b", `Sealed: ${info.name || prettyType(info.type)}`);
}

function findFree(dim, base, maxUp) {
  for (let up = 0; up <= maxUp; up++) {
    const c = { x: base.x, y: base.y + up, z: base.z };
    const low = dim.getBlock(c);
    const high = dim.getBlock({ x: c.x, y: c.y + 1, z: c.z });
    if (low?.isAir && high?.isAir) return c;
  }
  return undefined;
}

function airCell(player) {
  const p = player.location;
  let dx = 0;
  let dz = 1;
  try {
    const v = player.getViewDirection();
    const m = Math.hypot(v.x, v.z) || 1;
    dx = v.x / m;
    dz = v.z / m;
  } catch (e) {}
  return { x: Math.floor(p.x + dx * 2), y: Math.floor(p.y), z: Math.floor(p.z + dz * 2) };
}

function cooldownLeft(sid) {
  const until = cooldowns.get(sid);
  return until === undefined ? 0 : Math.max(0, until - system.currentTick);
}

function endSpirit(sid, message, recharge = true) {
  const s = spirits.get(sid);
  if (!s) return;
  spirits.delete(sid);
  if (recharge) cooldowns.set(sid, system.currentTick + COOLDOWN_TICKS);
  try {
    if (s.entity.isValid !== false) {
      burst(s.entity.dimension, s.entity.location);
      s.entity.remove();
    }
  } catch (e) {}
  if (message && s.owner) tell(s.owner, "§b", message);
}

function nearbyIds(dim, center) {
  try {
    return new Set(dim.getEntities({ location: center, maxDistance: 8 }).map((e) => e.id));
  } catch (e) {
    return new Set();
  }
}

function freshEntities(dim, center, before) {
  try {
    return dim.getEntities({ location: center, maxDistance: 8 }).filter((e) => !before.has(e.id));
  } catch (e) {
    return [];
  }
}

function findLantern(player, sid) {
  const container = containerOf(player);
  if (!container) return undefined;
  for (let i = 0; i < (container.size ?? 36); i++) {
    const item = container.getItem(i);
    if (isFilled(item?.typeId) && item.getDynamicProperty(KEY.sid) === sid) return { container, slot: i };
  }
  return undefined;
}

function confirmRelease(player, dim, center, before, d, attempt) {
  system.runTimeout(() => {
    const found = freshEntities(dim, center, before).length > 0;
    if (!found && attempt < 2) {
      confirmRelease(player, dim, center, before, d, attempt + 1);
      return;
    }
    releasing.delete(d.sid);
    try {
      if (!found) {
        tell(player, "§c", "The soul could not take shape here. Try another spot.");
        return;
      }
      const lantern = findLantern(player, d.sid);
      if (lantern) lantern.container.setItem(lantern.slot, new ItemStack(EMPTY_ID, 1));
      endSpirit(d.sid, undefined, false);
      burst(dim, center);
      play(player, "random.orb");
      tell(player, "§b", `Released: ${d.name || d.species}`);
    } catch (e) {}
    if (found) {
      try {
        world.structureManager.delete(d.sid);
      } catch (e) {}
    }
  }, attempt === 0 ? 2 : 8);
}

function tryRelease(player, dim, base, slot) {
  const container = containerOf(player);
  const held = container?.getItem(slot);
  if (!container || !isFilled(held?.typeId)) return;
  const d = readStack(held);
  if (typeof d.sid !== "string" || !d.sid) {
    container.setItem(slot, new ItemStack(EMPTY_ID, 1));
    tell(player, "§e", "This lantern held no soul and was emptied.");
    return;
  }
  if (releasing.has(d.sid)) return;
  const cell = findFree(dim, base, 3);
  if (!cell) {
    tell(player, "§e", "There is no free space to release the soul here.");
    return;
  }
  const center = { x: cell.x + 0.5, y: cell.y + 0.5, z: cell.z + 0.5 };
  const before = nearbyIds(dim, center);
  releasing.add(d.sid);
  try {
    world.structureManager.place(d.sid, dim, cell, { includeBlocks: false, includeEntities: true });
  } catch (e) {
    releasing.delete(d.sid);
    container.setItem(slot, new ItemStack(EMPTY_ID, 1));
    endSpirit(d.sid, undefined, false);
    tell(player, "§e", "This soul is gone. The lantern was emptied.");
    return;
  }
  confirmRelease(player, dim, center, before, d, 0);
}

function toggleSpirit(player, slot) {
  const container = containerOf(player);
  const held = container?.getItem(slot);
  if (!isFilled(held?.typeId)) return;
  const d = readStack(held);
  if (typeof d.sid !== "string" || !d.sid) return;
  if (spirits.has(d.sid)) {
    endSpirit(d.sid, "Your Spectral Ally returns to the lantern.");
    return;
  }
  const left = cooldownLeft(d.sid);
  if (left > 0) {
    tell(player, "§e", `The lantern is recharging: ${Math.ceil(left / 20)}s`);
    return;
  }
  const plan = SPECIES[d.type] ?? { fig: 0, mode: "melee" };
  const dim = player.dimension;
  const p = player.location;
  let spirit;
  try {
    spirit = dim.spawnEntity(SPIRIT_ID, { x: p.x + 1.2, y: p.y + 1.2, z: p.z });
  } catch (e) {
    tell(player, "§c", "The spirit could not take shape.");
    return;
  }
  try {
    spirit.triggerEvent(`aln:mode_${plan.mode}`);
    if (plan.fig > 0) spirit.triggerEvent(`aln:fig_${plan.fig}`);
  } catch (e) {}
  try {
    spirit.addTag(SPIRIT_TAG);
    spirit.nameTag = `§b${d.name || d.species} §3(Spirit)`;
    spirit.addEffect("resistance", SPIRIT_TICKS + 40, { amplifier: 4, showParticles: false });
  } catch (e) {}
  spirits.set(d.sid, { entity: spirit, owner: player, end: system.currentTick + SPIRIT_TICKS, mode: plan.mode, size: 1 });
  burst(dim, spirit.location);
  play(player, "block.amethyst_block.chime");
  tell(player, "§b", "Spectral Ally called. Hold again to recall it.");
}

function fight(s, dim, at, gap, now) {
  const rule = COMBAT[s.mode] ?? COMBAT.melee;
  if (s.mode === "kamikaze" && s.size < 1) return;
  let foes;
  try {
    foes = dim.getEntities({ location: at, maxDistance: SEEK_RANGE, families: ["monster"] });
  } catch (e) {
    return;
  }
  let foe;
  let best = Infinity;
  for (const e of foes) {
    if (e.id === s.entity.id || e.hasTag(SPIRIT_TAG)) continue;
    if (e.typeId === "minecraft:creeper" && s.mode !== "kamikaze") continue;
    const d = Math.hypot(e.location.x - at.x, e.location.y - at.y, e.location.z - at.z);
    if (d < best) {
      best = d;
      foe = e;
    }
  }
  if (!foe) return;
  const fl = foe.location;
  if (best > rule.reach) {
    const k = Math.min(CHASE_STEP, best - rule.reach * 0.8) / best;
    s.entity.teleport(
      { x: at.x + (fl.x - at.x) * k, y: at.y + (fl.y + 0.8 - at.y) * k, z: at.z + (fl.z - at.z) * k },
      { dimension: dim, facingLocation: { x: fl.x, y: fl.y + 1, z: fl.z } }
    );
    return;
  }
  if (s.mode === "kamikaze") {
    if (gap > 3.5) {
      dim.createExplosion(at, 2.5, { breaksBlocks: false, causesFire: false, source: s.entity });
      s.size = SHRUNK_SIZE;
      setSize(s.entity, s.size);
    }
    return;
  }
  if (now < (s.nextHit ?? 0)) return;
  s.nextHit = now + rule.every;
  foe.applyDamage(rule.dmg, { cause: EntityDamageCause.entityAttack, damagingEntity: s.owner });
  if (rule.ranged) {
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      dim.spawnParticle("minecraft:endrod", { x: at.x + (fl.x - at.x) * t, y: at.y + 0.7 + (fl.y + 1 - at.y - 0.7) * t, z: at.z + (fl.z - at.z) * t });
    }
  }
  dim.spawnParticle("minecraft:blue_flame_particle", { x: fl.x, y: fl.y + 1, z: fl.z });
}

function setSize(entity, value) {
  try {
    entity.setProperty("aln:size", value);
  } catch (e) {}
}

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target, itemStack } = ev;
  if (itemStack?.typeId !== EMPTY_ID || !player.isSneaking) return;
  ev.cancel = true;
  if (busy(player)) return;
  mark(player);
  const slot = player.selectedSlotIndex;
  system.run(() => tryCapture(player, target, slot));
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  const { player, block, itemStack, isFirstEvent } = ev;
  if (!isFilled(itemStack?.typeId) || !player.isSneaking) return;
  ev.cancel = true;
  if (!isFirstEvent || busy(player)) return;
  mark(player);
  const slot = player.selectedSlotIndex;
  const dim = block.dimension;
  const base = { x: block.location.x, y: block.location.y + 1, z: block.location.z };
  system.run(() => tryRelease(player, dim, base, slot));
});

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  const id = itemStack?.typeId;
  if (id === EMPTY_ID) {
    if (!busy(source)) tell(source, "§7", "Sneak and interact with a mob to seal it.");
    return;
  }
  if (!isFilled(id) || busy(source)) return;
  mark(source);
  const slot = source.selectedSlotIndex;
  if (source.isSneaking) tryRelease(source, source.dimension, airCell(source), slot);
  else toggleSpirit(source, slot);
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const [sid, s] of spirits) {
    let gone = s.entity.isValid === false || now >= s.end;
    if (!gone) {
      try {
        gone = s.owner.isValid === false;
      } catch (e) {
        gone = true;
      }
    }
    if (gone) {
      endSpirit(sid, "Your Spectral Ally fades back into the lantern.");
      continue;
    }
    try {
      const dim = s.entity.dimension;
      const at = s.entity.location;
      const p = s.owner.location;
      const gap = Math.hypot(p.x - at.x, p.z - at.z);
      if (s.owner.dimension.id !== dim.id || gap > 16 || Math.abs(p.y - at.y) > 8) {
        s.entity.teleport({ x: p.x + 1, y: p.y + 1.2, z: p.z + 1 }, { dimension: s.owner.dimension });
        continue;
      }
      dim.spawnParticle("minecraft:endrod", { x: at.x, y: at.y + 0.7, z: at.z });
      if (s.size < 1) {
        s.size = Math.min(1, s.size + REGROW_STEP);
        setSize(s.entity, s.size);
      }
      fight(s, dim, at, gap, now);
    } catch (e) {}
  }
}, 4);

world.afterEvents.worldLoad.subscribe(() => {
  for (const name of ["overworld", "nether", "the_end"]) {
    try {
      for (const e of world.getDimension(name).getEntities({ tags: [SPIRIT_TAG] })) e.remove();
    } catch (e) {}
  }
});
