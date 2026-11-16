import { EntityComponentTypes, EquipmentSlot, ItemStack, world } from "@minecraft/server";
import {
  COOKED_BY_RAW,
  FARM_ANIMAL_SET,
  LOOT,
  PERSISTENT_TAG,
  STACKABLE_MOBS,
  STACK_COUNT_PROPERTY,
  WOOL_BY_COLOR,
  applyStack,
  mobName,
  readMeta,
  restoreAppearance,
  spawnOptionsFor,
  stackCache,
} from "./stack_config.js";

const SAMPLE_LIMIT = 200;
const MAX_ITEM_ENTITIES = 512;

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function lootMultiplier(looting) {
  return 1 + Math.floor(Math.random() * (looting + 1));
}

function addTotal(totals, id, amount) {
  if (id && amount > 0) totals.set(id, (totals.get(id) ?? 0) + amount);
}

function pickWeighted(entries) {
  let sum = 0;
  for (const entry of entries) sum += entry[3];
  let roll = Math.random() * sum;
  for (const entry of entries) {
    roll -= entry[3];
    if (roll < 0) return entry;
  }
  return entries[entries.length - 1];
}

function rollUnit(typeId, def, meta, looting, totals) {
  for (const [id, min, max] of def.drops) {
    addTotal(totals, id, randomInt(min, max) * lootMultiplier(looting));
  }
  if (def.rolled) {
    const rolls = randomInt(def.rolled.rolls[0], def.rolled.rolls[1]);
    for (let r = 0; r < rolls; r++) {
      const entry = pickWeighted(def.rolled.entries);
      addTotal(totals, entry[0], randomInt(entry[1], entry[2]) * lootMultiplier(looting));
    }
  }
  if (def.rare) {
    for (const rare of def.rare) {
      if (Math.random() < rare.chance + rare.bonus * looting) {
        addTotal(totals, rare.ids[randomInt(0, rare.ids.length - 1)], 1);
      }
    }
  }
  if (typeId === "minecraft:sheep" && !meta.sheared) {
    const wool = WOOL_BY_COLOR[meta.color] ?? WOOL_BY_COLOR[0];
    addTotal(totals, wool, 1);
  }
}

function rollExperience(def, meta) {
  if (FARM_ANIMAL_SET.has(def.typeId) && meta.isBaby) return 0;
  if (def.xp === "variant") return meta.variant > 0 ? meta.variant : 1;
  if (meta.isBaby && def.babyXp) return def.babyXp;
  return randomInt(def.xp[0], def.xp[1]);
}

function computeDrops(typeId, meta, units, looting, burning) {
  const base = LOOT[typeId];
  const totals = new Map();
  let xp = 0;
  if (!base) return { totals, xp };
  const def = { ...base, typeId };
  const isBabyAnimal = FARM_ANIMAL_SET.has(typeId) && meta.isBaby;
  const sampled = Math.min(units, SAMPLE_LIMIT);
  const scale = units / sampled;
  for (let i = 0; i < sampled; i++) {
    xp += rollExperience(def, meta);
    if (!isBabyAnimal) rollUnit(typeId, def, meta, looting, totals);
  }
  if (scale !== 1) {
    xp = Math.round(xp * scale);
    for (const [id, amount] of totals) totals.set(id, Math.round(amount * scale));
  }
  if (burning) {
    for (const [raw, cooked] of Object.entries(COOKED_BY_RAW)) {
      const amount = totals.get(raw);
      if (amount) {
        totals.delete(raw);
        totals.set(cooked, amount);
      }
    }
  }
  return { totals, xp };
}

function spawnDrops(dimension, location, totals, xp) {
  let spawned = 0;
  for (const [id, amount] of totals) {
    let remaining = amount;
    let maxAmount = 64;
    try {
      maxAmount = new ItemStack(id, 1).maxAmount;
    } catch (error) {
      continue;
    }
    while (remaining > 0 && spawned < MAX_ITEM_ENTITIES) {
      const size = Math.min(remaining, maxAmount);
      try {
        dimension.spawnItem(new ItemStack(id, size), location);
      } catch (error) {
        break;
      }
      remaining -= size;
      spawned++;
    }
  }
  if (xp > 0) {
    try {
      dimension.spawnXp(location, xp);
    } catch (error) {
      return;
    }
  }
}

function isBurning(entity) {
  try {
    return entity.getComponent(EntityComponentTypes.OnFire) !== undefined;
  } catch (error) {
    return false;
  }
}

function lootingLevel(player) {
  try {
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    const item = equippable ? equippable.getEquipment(EquipmentSlot.Mainhand) : undefined;
    const enchantable = item ? item.getComponent("minecraft:enchantable") : undefined;
    const enchantment = enchantable ? enchantable.getEnchantment("looting") : undefined;
    return enchantment ? Math.max(0, Math.min(3, enchantment.level)) : 0;
  } catch (error) {
    return 0;
  }
}

function readDeadStack(dead) {
  const cached = stackCache.get(dead.id);
  stackCache.delete(dead.id);
  let count = 1;
  try {
    const value = dead.getDynamicProperty(STACK_COUNT_PROPERTY);
    if (typeof value === "number" && value >= 1) count = Math.floor(value);
  } catch (error) {
    count = cached ? cached.count : 1;
  }
  if (count <= 1 && cached) count = cached.count;
  let location = cached ? cached.location : undefined;
  let dimension;
  try {
    location = dead.location;
    dimension = dead.dimension;
  } catch (error) {
    dimension = undefined;
  }
  if (!dimension && cached) dimension = world.getDimension(cached.dimensionId);
  let meta = cached ? cached.meta : undefined;
  if (!meta) {
    try {
      meta = readMeta(dead);
    } catch (error) {
      meta = { isBaby: false, sheared: false, charged: false, color: -1, variant: -1, mark: -1, skin: -1 };
    }
  }
  return { count, location, dimension, meta };
}

function respawnStack(dimension, typeId, location, remaining, meta) {
  const entity = dimension.spawnEntity(typeId, location, spawnOptionsFor(typeId, meta, remaining > 1));
  restoreAppearance(entity, meta);
  if (remaining > 1) {
    entity.addTag(PERSISTENT_TAG);
    applyStack(entity, remaining, meta);
  }
}

function handleDeath(event) {
  const dead = event.deadEntity;
  const typeId = dead.typeId;
  if (!STACKABLE_MOBS.has(typeId)) return;
  const { count, location, dimension, meta } = readDeadStack(dead);
  if (count <= 1 || !location || !dimension) return;

  const killer = event.damageSource.damagingEntity;
  const isPlayerKill = killer !== undefined && killer.typeId === "minecraft:player";

  if (isPlayerKill && killer.isSneaking) {
    const looting = lootingLevel(killer);
    const { totals, xp } = computeDrops(typeId, meta, count - 1, looting, isBurning(dead));
    spawnDrops(dimension, location, totals, xp);
    killer.onScreenDisplay.setActionBar(
      "§6[MobStacker] §aCleared x" + count + " " + mobName(typeId, meta.isBaby) + " §7(Looting " + looting + ")"
    );
    return;
  }

  try {
    respawnStack(dimension, typeId, location, count - 1, meta);
  } catch (error) {
    return;
  }
}

export function startCombat() {
  world.afterEvents.entityDie.subscribe(handleDeath, { entityTypes: [...STACKABLE_MOBS] });
}
