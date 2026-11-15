import { world, system, ItemStack, ItemComponentTypes, EntityDamageCause } from "@minecraft/server";
import { isCreative, heldItem, clearHeldItem, findAmmo, takeOne, wearHeldItem, muzzle, shoot } from "./lib/common.js";

const PLAYER = "minecraft:player";
const CLUB = "aln:wooden_club";
const DAGGER = "aln:copper_dagger";
const SPEAR = "aln:flint_spear";
const SPEAR_PROJECTILE = "aln:flint_spear_projectile";
const BLOWGUN = "aln:blowgun";
const DART = "aln:blowgun_dart";
const SPIDER_EYE = "minecraft:spider_eye";
const SEEDS = ["minecraft:wheat_seeds", "minecraft:beetroot_seeds", "minecraft:melon_seeds", "minecraft:pumpkin_seeds"];

const CLUB_PUSH = 0.9;
const CLUB_LIFT = 0.25;
const SLOWNESS_TICKS = 30;
const DAGGER_DAMAGE = 4;
const BACKSTAB_MULTIPLIER = 1.5;
const BACKSTAB_DOT = 0.5;
const SPEAR_MIN_HOLD = 10;
const SPEAR_FULL_HOLD = 25;
const SPEAR_SPEED_MIN = 1.4;
const SPEAR_SPEED_MAX = 2.4;
const SPEAR_LIFETIME = 200;
const WEAR_TAG = "aln_wear_";
const DART_SPEED = 2.2;
const DART_GAP = 9;
const DART_LIFETIME = 60;
const POISON_TICKS = 60;

const spearStart = new Map();
const spears = new Map();
const darts = new Map();
const lastBlow = new Map();

function horizontal(vector) {
  const length = Math.hypot(vector.x, vector.z);
  return length > 0.001 ? { x: vector.x / length, z: vector.z / length } : undefined;
}

function clubHit(attacker, target) {
  const push = horizontal(attacker.getViewDirection());
  if (push) {
    try {
      target.applyKnockback({ x: push.x * CLUB_PUSH, z: push.z * CLUB_PUSH }, CLUB_LIFT);
    } catch (error) {
      return;
    }
  }
  try {
    target.addEffect("slowness", SLOWNESS_TICKS, { amplifier: 0 });
  } catch (error) {
    return;
  }
}

function daggerHit(attacker, target) {
  let behind = false;
  try {
    const a = horizontal(attacker.getViewDirection());
    const t = horizontal(target.getViewDirection());
    behind = a !== undefined && t !== undefined && a.x * t.x + a.z * t.z > BACKSTAB_DOT;
  } catch (error) {
    return;
  }
  if (!behind) return;
  try {
    target.applyDamage(DAGGER_DAMAGE * BACKSTAB_MULTIPLIER, { cause: EntityDamageCause.entityAttack, damagingEntity: attacker });
    target.dimension.spawnParticle("minecraft:critical_hit_emitter", target.getHeadLocation());
  } catch (error) {
    return;
  }
}

world.afterEvents.entityHitEntity.subscribe(({ damagingEntity, hitEntity }) => {
  if (damagingEntity.typeId !== PLAYER || !hitEntity.isValid) return;
  const typeId = heldItem(damagingEntity)?.typeId;
  if (typeId === CLUB) clubHit(damagingEntity, hitEntity);
  else if (typeId === DAGGER) daggerHit(damagingEntity, hitEntity);
});

function throwSpear(player, held) {
  const item = heldItem(player);
  if (item?.typeId !== SPEAR) return;
  const durability = item.getComponent(ItemComponentTypes.Durability);
  const wear = (durability?.damage ?? 0) + 1;
  const breaks = durability !== undefined && wear >= durability.maxDurability;
  const creative = isCreative(player);
  const power = Math.min(held, SPEAR_FULL_HOLD) / SPEAR_FULL_HOLD;
  const speed = SPEAR_SPEED_MIN + (SPEAR_SPEED_MAX - SPEAR_SPEED_MIN) * power;
  const projectile = player.dimension.spawnEntity(SPEAR_PROJECTILE, muzzle(player, 1));
  try {
    shoot(projectile, player, player.getViewDirection(), speed);
  } catch (error) {
    if (projectile.isValid) projectile.remove();
    return;
  }
  spears.set(projectile.id, { wear, returns: !creative && !breaks });
  if (!creative) clearHeldItem(player);
  if (breaks && !creative) player.playSound("random.break");
  player.playSound("random.bow");
  system.runTimeout(() => {
    const info = spears.get(projectile.id);
    if (info && projectile.isValid) finishSpear(projectile.id, projectile.dimension, projectile.location, projectile);
  }, SPEAR_LIFETIME);
}

function finishSpear(id, dimension, location, projectile) {
  const info = spears.get(id);
  spears.delete(id);
  if (projectile?.isValid) projectile.remove();
  if (!info || !info.returns) return;
  const stack = new ItemStack(SPEAR, 1);
  const durability = stack.getComponent(ItemComponentTypes.Durability);
  if (durability) durability.damage = info.wear;
  dimension.spawnItem(stack, location);
}

function backOff(location, vector) {
  const length = Math.hypot(vector.x, vector.y, vector.z);
  if (length < 0.001) return { x: location.x, y: location.y + 0.2, z: location.z };
  const k = 0.4 / length;
  return { x: location.x - vector.x * k, y: location.y - vector.y * k + 0.1, z: location.z - vector.z * k };
}

world.afterEvents.itemStartUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === SPEAR) spearStart.set(source.id, system.currentTick);
});

world.afterEvents.itemReleaseUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== SPEAR) return;
  const started = spearStart.get(source.id);
  spearStart.delete(source.id);
  if (started === undefined) return;
  const held = system.currentTick - started;
  if (held >= SPEAR_MIN_HOLD) throwSpear(source, held);
});

world.afterEvents.projectileHitBlock.subscribe(({ projectile, location, hitVector, dimension }) => {
  const id = projectile.id;
  if (spears.has(id)) finishSpear(id, dimension, backOff(location, hitVector), projectile);
  darts.delete(id);
});

world.afterEvents.projectileHitEntity.subscribe((event) => {
  const id = event.projectile.id;
  if (spears.has(id)) {
    finishSpear(id, event.dimension, event.location, event.projectile);
    return;
  }
  const poison = darts.get(id);
  darts.delete(id);
  if (!poison) return;
  const target = event.getEntityHit()?.entity;
  if (!target?.isValid) return;
  try {
    target.addEffect("poison", POISON_TICKS, { amplifier: 0 });
  } catch (error) {
    return;
  }
});

function fireBlowgun(player) {
  const creative = isCreative(player);
  const order = player.isSneaking ? [SPIDER_EYE, ...SEEDS] : [...SEEDS, SPIDER_EYE];
  const ammo = findAmmo(player, order);
  if (!ammo && !creative) {
    player.onScreenDisplay.setActionBar("§cNo seeds or Spider Eyes");
    player.playSound("random.click");
    return;
  }
  const poison = ammo ? ammo.typeId === SPIDER_EYE : player.isSneaking;
  const dart = player.dimension.spawnEntity(DART, muzzle(player, 0.9));
  try {
    shoot(dart, player, player.getViewDirection(), DART_SPEED);
  } catch (error) {
    if (dart.isValid) dart.remove();
    return;
  }
  darts.set(dart.id, poison);
  if (ammo && !creative) takeOne(player, ammo.slot);
  wearHeldItem(player, 1);
  player.playSound("random.pop");
  system.runTimeout(() => {
    darts.delete(dart.id);
    if (dart.isValid) dart.remove();
  }, DART_LIFETIME);
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== BLOWGUN) return;
  const now = system.currentTick;
  if (now - (lastBlow.get(source.id) ?? -DART_GAP) < DART_GAP) return;
  lastBlow.set(source.id, now);
  fireBlowgun(source);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  spearStart.delete(playerId);
  lastBlow.delete(playerId);
});
