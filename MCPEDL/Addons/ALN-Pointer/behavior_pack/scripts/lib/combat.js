import { world, system, EntityComponentTypes, EntityDamageCause, EquipmentSlot, ItemStack } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { isOn } from "./store.js";

const TOTEM = "minecraft:totem_of_undying";
const SHIELD = "minecraft:shield";
const SPARKS = "minecraft:critical_hit_emitter";
const CRIT = 1.5;
const NO_TOTEM = new Set([EntityDamageCause.void, EntityDamageCause.suicide]);
const BLOCKED = new Set([EntityDamageCause.entityAttack, EntityDamageCause.projectile]);
const replaying = new Set();

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

function onHurt(event) {
  const victim = event.hurtEntity;
  const src = event.damageSource;
  const hitter = src.damagingEntity;
  if (src.cause === EntityDamageCause.entityAttack && hitter?.typeId === PLAYER_ID && isOn(hitter, "alwaysCritical") && !hitter.isFalling) {
    event.damage *= CRIT;
    system.run(() => victim.isValid && victim.dimension.spawnParticle(SPARKS, victim.getHeadLocation()));
  }
  if (victim.typeId !== PLAYER_ID) return;
  if (isOn(victim, "shield") && BLOCKED.has(src.cause) && hands(victim).includes(SHIELD) && facing(victim, src)) {
    event.cancel = true;
    system.run(() => victim.isValid && victim.playSound("item.shield.block"));
    return;
  }
  const infinite = isOn(victim, "infiniteTotem");
  if (!infinite && !isOn(victim, "autoTotem")) return;
  if (NO_TOTEM.has(src.cause) || replaying.has(victim.id) || hands(victim).includes(TOTEM)) return;
  if (!infinite && totemIndex(victim) < 0) return;
  const health = victim.getComponent(EntityComponentTypes.Health);
  if (!health || health.currentValue - event.damage > 0) return;
  const amount = event.damage;
  event.cancel = true;
  replaying.add(victim.id);
  system.run(() => {
    if (victim.isValid) {
      equipTotem(victim);
      victim.applyDamage(amount, replayOptions(src));
    }
    system.runTimeout(() => replaying.delete(victim.id), 5);
  });
}

export function initCombat() {
  world.beforeEvents.entityHurt.subscribe(onHurt);
}
