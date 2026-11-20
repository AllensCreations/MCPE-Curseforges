import { world, system, EntityComponentTypes, EntityDamageCause, EquipmentSlot, ItemStack } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { isOn } from "./store.js";
import { tune } from "./tuning.js";
import { saveGear, restoreGear, hasStash } from "./gear.js";

const TOTEM = "minecraft:totem_of_undying";
const SHIELD = "minecraft:shield";
const SPARKS = "minecraft:critical_hit_emitter";
const IMMORTAL_FLOOR = 2;

const NO_TOTEM = new Set([EntityDamageCause.void, EntityDamageCause.selfDestruct, EntityDamageCause.override]);
const BLOCKED = new Set([EntityDamageCause.entityAttack, EntityDamageCause.projectile]);

const slot = (p, which) => p.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(which);
const bag = (p) => p.getComponent(EntityComponentTypes.Inventory)?.container;
const hands = (p) => [slot(p, EquipmentSlot.Mainhand)?.getItem()?.typeId, slot(p, EquipmentSlot.Offhand)?.getItem()?.typeId];

function totemIndex(p) {
  const inv = bag(p);
  for (let i = 0; inv && i < inv.size; i++) if (inv.getItem(i)?.typeId === TOTEM) return i;
  return -1;
}

function equipTotem(p) {
  const off = slot(p, EquipmentSlot.Offhand);
  if (!off || hands(p).includes(TOTEM)) return;
  const inv = bag(p);
  const i = totemIndex(p);
  const old = off.getItem();
  if (i >= 0) {
    off.setItem(inv.getItem(i));
    inv.setItem(i, old);
    return;
  }
  off.setItem(new ItemStack(TOTEM, 1));
  const left = old && (inv ? inv.addItem(old) : old);
  if (left) p.dimension.spawnItem(left, p.location);
}

function facing(p, src) {
  const o = src.damagingProjectile?.location ?? src.damagingEntity?.location;
  if (!o) return false;
  const v = p.getViewDirection();
  const dx = o.x - p.location.x;
  const dz = o.z - p.location.z;
  return dx * v.x + dz * v.z > 0;
}

function replayOptions(src) {
  const by = src.damagingEntity?.isValid ? src.damagingEntity : undefined;
  const proj = src.damagingProjectile?.isValid ? src.damagingProjectile : undefined;
  return proj ? { damagingEntity: by, damagingProjectile: proj } : { cause: src.cause, damagingEntity: by };
}

function parry(victim, src) {
  const foe = src.damagingEntity;
  system.run(() => {
    if (!victim.isValid) return;
    const view = victim.getViewDirection();
    const head = victim.getHeadLocation();
    const at = { x: head.x + view.x * 0.9, y: head.y - 0.4 + view.y * 0.9, z: head.z + view.z * 0.9 };
    victim.playSound("item.shield.block");
    victim.dimension.spawnParticle(SPARKS, at);
    victim.dimension.spawnParticle(SPARKS, { x: at.x, y: at.y + 0.2, z: at.z });
    try {

      if (foe?.isValid && src.cause === EntityDamageCause.entityAttack) {
        const dx = foe.location.x - victim.location.x;
        const dz = foe.location.z - victim.location.z;
        const size = Math.hypot(dx, dz) || 1;
        foe.applyKnockback({ x: (dx / size) * 0.6, z: (dz / size) * 0.6 }, 0.25);
      }
    } catch (e) {}
  });
}

function onHurt(event) {
  const victim = event.hurtEntity;
  const src = event.damageSource;
  const hitter = src.damagingEntity;
  if (src.cause === EntityDamageCause.entityAttack && hitter?.typeId === PLAYER_ID && isOn(hitter, "alwaysCritical") && !hitter.isFalling) {
    event.damage *= tune(hitter, "critPercent") / 100;
    system.run(() => victim.isValid && victim.dimension.spawnParticle(SPARKS, victim.getHeadLocation()));
  }
  if (victim.typeId !== PLAYER_ID) return;
  if (isOn(victim, "shield") && BLOCKED.has(src.cause) && hands(victim).includes(SHIELD) && facing(victim, src)) {
    event.cancel = true;
    parry(victim, src);
    return;
  }
  if (isOn(victim, "immortal")) {
    const left = victim.getComponent(EntityComponentTypes.Health)?.currentValue ?? 0;
    if (left > 0 && event.damage > left - IMMORTAL_FLOOR) {
      const safe = Math.max(0, left - IMMORTAL_FLOOR);
      if (safe > 0) event.damage = safe;
      else event.cancel = true;
      return;
    }
  }
  if (isOn(victim, "keepGear") && !hasStash(victim)) {
    const life = victim.getComponent(EntityComponentTypes.Health);
    const totemSaves =
      !NO_TOTEM.has(src.cause) &&
      (hands(victim).includes(TOTEM) || isOn(victim, "infiniteTotem") || (isOn(victim, "autoTotem") && totemIndex(victim) >= 0));
    if (life && !totemSaves && life.currentValue - event.damage <= 0) {
      const dealt = event.damage;
      event.cancel = true;
      system.run(() => {
        if (!victim.isValid) return;
        saveGear(victim);
        victim.applyDamage(dealt, replayOptions(src));
        system.runTimeout(() => {
          try {
            if (victim.isValid && victim.getComponent(EntityComponentTypes.Health).currentValue > 0) restoreGear(victim);
          } catch (e) {}
        }, 3);
      });
      return;
    }
  }
  const infinite = isOn(victim, "infiniteTotem");
  if (!infinite && !isOn(victim, "autoTotem")) return;
  if (NO_TOTEM.has(src.cause) || hands(victim).includes(TOTEM)) return;
  if (!infinite && totemIndex(victim) < 0) return;
  const health = victim.getComponent(EntityComponentTypes.Health);
  if (!health || health.currentValue - event.damage > 0) return;
  const amount = event.damage;
  event.cancel = true;
  system.run(() => {
    if (!victim.isValid) return;
    equipTotem(victim);
    if (hands(victim).includes(TOTEM)) victim.applyDamage(amount, replayOptions(src));
  });
}

export function initCombat() {
  world.beforeEvents.entityHurt.subscribe(onHurt);
}
