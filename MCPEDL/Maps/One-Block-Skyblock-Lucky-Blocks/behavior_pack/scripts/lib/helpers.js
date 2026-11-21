// Small building blocks used by prizes: random picks, item and mob spawns, effects, delayed tasks.
import { system, ItemStack } from "@minecraft/server";

export const rand = (n) => Math.floor(Math.random() * n);
export const spot = (ctx, lift) => ({ x: ctx.top.x + rand(3) - 1, y: ctx.loc.y + lift, z: ctx.top.z + rand(3) - 1 });

export const items = (list) => (ctx) => {
  for (const [id, n] of list) ctx.dimension.spawnItem(new ItemStack(id, n), ctx.top);
};
export const kit = (...ids) => items(ids.map((id) => [id, 1]));
export const mobs = (id, n, lift = 1) => (ctx) => {
  for (let i = 0; i < n; i++) ctx.dimension.spawnEntity(id, spot(ctx, lift));
};
export const effect = (id, seconds, amplifier = 0) => (ctx) => {
  ctx.player.addEffect(id, seconds * 20, { amplifier });
};
export const levels = (n) => (ctx) => {
  ctx.player.addLevels(n);
};
export const tax = (n) => (ctx) => {
  ctx.player.addLevels(-Math.min(n, ctx.player.level));
};
export const hurt = (n) => (ctx) => {
  ctx.player.applyDamage(n);
};
export const both = (...runs) => (ctx) => {
  for (const run of runs) run(ctx);
};
export const later = (ticks, fn) => {
  system.runTimeout(() => {
    try {
      fn();
    } catch (e) {
      return;
    }
  }, ticks);
};
export const strikes = (n) => (ctx) => {
  for (let i = 0; i < n; i++) later(i * 15 + 1, () => ctx.dimension.spawnEntity("minecraft:lightning_bolt", ctx.top));
};
export const booms = (n, radius) => (ctx) => {
  for (let i = 0; i < n; i++) later(i * 20 + 1, () => ctx.dimension.createExplosion(ctx.top, radius, { breaksBlocks: false, causesFire: false }));
};
export const fire = (seconds) => (ctx) => {
  ctx.player.setOnFire(seconds);
};
