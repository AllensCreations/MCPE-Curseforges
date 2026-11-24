import { world, system, ItemStack, EntityComponentTypes, StructureSaveMode } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const EMPTY_ID = "aln:soul_lantern";
const FILLED_ID = "aln:soul_lantern_filled";
const SPIRIT_ID = "aln:spirit";
const SPIRIT_TAG = "aln_spirit";
const SPIRIT_TICKS = 400;
const COOLDOWN_TICKS = 1200;
const DEBOUNCE_TICKS = 8;
const VERSION = "1.0.2";

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
  "minecraft:cat": { fig: 0, mode: "fast" },
  "minecraft:ocelot": { fig: 0, mode: "fast" },
  "minecraft:fox": { fig: 0, mode: "fast" },
  "minecraft:ravager": { fig: 0, mode: "heavy" },
  "minecraft:hoglin": { fig: 0, mode: "heavy" },
  "minecraft:zoglin": { fig: 0, mode: "heavy" },
  "minecraft:polar_bear": { fig: 0, mode: "heavy" },
  "minecraft:piglin_brute": { fig: 0, mode: "heavy" },
};

const KEY = {
  sid: "aln_sid",
  type: "aln_type",
  name: "aln_name",
  hp: "aln_hp",
  maxHp: "aln_max_hp",
  baby: "aln_baby",
  details: "aln_details",
  rename: "aln_rename",
};

const spirits = new Map();
const cooldowns = new Map();
const lastAction = new Map();

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

const busy = (player) => {
  const last = lastAction.get(player.id);
  return last !== undefined && system.currentTick - last < DEBOUNCE_TICKS;
};
const mark = (player) => lastAction.set(player.id, system.currentTick);

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
  const mark2 = component(entity, "minecraft:mark_variant")?.value;
  if (mark2 !== undefined) details.push(`Pattern ${mark2}`);
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
  const rename = get(KEY.rename, "");
  return {
    sid: get(KEY.sid, ""),
    type,
    species: prettyType(type) + (get(KEY.baby, false) ? " (Baby)" : ""),
    name: rename || get(KEY.name, ""),
    hp: get(KEY.hp, 0),
    maxHp: get(KEY.maxHp, 0),
    details: get(KEY.details, ""),
    rename,
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
  const stack = new ItemStack(FILLED_ID, 1);
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

function tryRelease(player, dim, blockLoc, slot) {
  const container = containerOf(player);
  const held = container?.getItem(slot);
  if (!container || held?.typeId !== FILLED_ID) return;
  const d = readStack(held);
  if (typeof d.sid !== "string" || !d.sid) {
    tell(player, "§c", "This lantern holds no soul.");
    return;
  }
  let cell;
  for (let up = 1; up <= 4 && !cell; up++) {
    const c = { x: blockLoc.x, y: blockLoc.y + up, z: blockLoc.z };
    const low = dim.getBlock(c);
    const high = dim.getBlock({ x: c.x, y: c.y + 1, z: c.z });
    if (low?.isAir && high?.isAir) cell = c;
  }
  if (!cell) {
    tell(player, "§e", "There is no free space to release the soul here.");
    return;
  }
  const center = { x: cell.x + 0.5, y: cell.y + 0.5, z: cell.z + 0.5 };
  const before = nearbyIds(dim, center);
  try {
    world.structureManager.place(d.sid, dim, cell, { includeBlocks: false, includeEntities: true });
  } catch (e) {
    tell(player, "§c", "The soul could not be released.");
    return;
  }
  container.setItem(slot, new ItemStack(EMPTY_ID, 1));
  burst(dim, center);
  play(player, "random.orb");
  tell(player, "§b", `Released: ${d.name || d.species}`);
  system.runTimeout(() => {
    if (d.rename) {
      for (const e of freshEntities(dim, center, before)) {
        try {
          e.nameTag = d.rename;
        } catch (err) {}
      }
    }
    try {
      world.structureManager.delete(d.sid);
    } catch (err) {}
  }, 4);
}

function cooldownLeft(player) {
  const until = cooldowns.get(player.id);
  return until === undefined ? 0 : Math.max(0, until - system.currentTick);
}

function endSpirit(id, message) {
  const s = spirits.get(id);
  if (!s) return;
  spirits.delete(id);
  try {
    if (s.entity.isValid !== false) {
      burst(s.entity.dimension, s.entity.location);
      s.entity.remove();
    }
  } catch (e) {}
  if (message && s.owner) tell(s.owner, "§b", message);
}

function summon(player, slot) {
  const container = containerOf(player);
  const held = container?.getItem(slot);
  if (held?.typeId !== FILLED_ID) return;
  const left = cooldownLeft(player);
  if (left > 0) {
    tell(player, "§e", `The lantern is recharging: ${Math.ceil(left / 20)}s`);
    return;
  }
  for (const [id, s] of spirits) {
    if (s.owner.id === player.id) endSpirit(id, undefined);
  }
  const d = readStack(held);
  const plan = SPECIES[d.type] ?? { fig: 0, mode: "melee" };
  const dim = player.dimension;
  const p = player.location;
  let spirit;
  try {
    spirit = dim.spawnEntity(SPIRIT_ID, { x: p.x + 1.5, y: p.y, z: p.z });
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
  spirits.set(spirit.id, { entity: spirit, owner: player, end: system.currentTick + SPIRIT_TICKS, mode: plan.mode });
  cooldowns.set(player.id, system.currentTick + COOLDOWN_TICKS);
  burst(dim, spirit.location);
  play(player, "block.amethyst_block.chime");
  tell(player, "§b", "Spectral Ally projected for 20 seconds.");
}

async function renameCaptured(player, slot) {
  const container = containerOf(player);
  const held = container?.getItem(slot);
  if (held?.typeId !== FILLED_ID) return;
  const d = readStack(held);
  const form = new ModalFormData()
    .title("§bRename Captured Mob")
    .textField("New name (leave empty to clear)", "Soul name", { defaultValue: d.rename || "" });
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res || res.canceled) return;
  const value = String(res.formValues?.[0] ?? "").trim().slice(0, 32);
  const fresh = container.getItem(slot);
  if (fresh?.typeId !== FILLED_ID) return;
  fresh.setDynamicProperty(KEY.rename, value === "" ? undefined : value);
  refreshDisplay(fresh);
  container.setItem(slot, fresh);
  tell(player, "§b", value === "" ? "The soul's name was cleared." : `The soul is now named ${value}.`);
}

async function openMenu(player) {
  const slot = player.selectedSlotIndex;
  const held = containerOf(player)?.getItem(slot);
  if (held?.typeId !== FILLED_ID) return;
  const d = readStack(held);
  const left = cooldownLeft(player);
  const body = [
    `§7Species: §f${d.species}`,
    `§7Name: §f${d.name || "None"}`,
    `§7Health: §f${d.hp}/${d.maxHp}`,
    `§7Details: §f${d.details || "None"}`,
    `§7Spectral Ally: §f${left > 0 ? `recharging ${Math.ceil(left / 20)}s` : "ready"}`,
  ].join("\n");
  const form = new ActionFormData()
    .title(`§l§6@ALNStudios §eSoul Lantern §r§7(v${VERSION})`)
    .body(body)
    .button("§bProject Spectral Ally (20s)")
    .button("§bRename Captured Mob")
    .button("Close");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res || res.canceled) return;
  if (res.selection === 0) summon(player, slot);
  else if (res.selection === 1) renameCaptured(player, slot);
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
  if (itemStack?.typeId !== FILLED_ID) return;
  ev.cancel = true;
  if (!isFirstEvent || busy(player)) return;
  mark(player);
  const slot = player.selectedSlotIndex;
  const dim = block.dimension;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  system.run(() => tryRelease(player, dim, loc, slot));
});

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === FILLED_ID) {
    if (busy(source)) return;
    mark(source);
    openMenu(source);
  } else if (itemStack?.typeId === EMPTY_ID) {
    tell(source, "§7", "Sneak and interact with a mob to seal it.");
  }
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const [id, s] of spirits) {
    let gone = s.entity.isValid === false || now >= s.end;
    if (!gone) {
      try {
        gone = s.owner.isValid === false;
      } catch (e) {
        gone = true;
      }
    }
    if (gone) {
      endSpirit(id, "Your Spectral Ally fades back into the lantern.");
      continue;
    }
    try {
      const dim = s.entity.dimension;
      const at = s.entity.location;
      const p = s.owner.location;
      const ownerGap = Math.hypot(p.x - at.x, p.z - at.z);
      if (s.owner.dimension.id !== dim.id || ownerGap > 16) {
        s.entity.teleport({ x: p.x + 1, y: p.y, z: p.z + 1 }, { dimension: s.owner.dimension });
        continue;
      }
      dim.spawnParticle("minecraft:endrod", { x: at.x, y: at.y + 0.7, z: at.z });
      if (s.mode === "kamikaze" && ownerGap > 3.5) {
        const foe = dim
          .getEntities({ location: at, maxDistance: 2.4, families: ["monster"] })
          .find((e) => e.id !== s.entity.id && !e.hasTag(SPIRIT_TAG));
        if (foe) {
          dim.createExplosion(at, 2.5, { breaksBlocks: false, causesFire: false, source: s.entity });
          endSpirit(id, "Your Kamikaze Spirit detonates.");
        }
      }
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
