// Physical prizes: thunder mobs, falling anvil, falling loot chest, baby shower, lava splash, butterfingers.
import { ItemStack } from "@minecraft/server";
import { rand, spot, later } from "./helpers.js";

export const thunderMob = (id) => (ctx) => {
  const where = spot(ctx, 1);
  ctx.dimension.spawnEntity(id, where);
  later(5, () => ctx.dimension.spawnEntity("minecraft:lightning_bolt", where));
};

const BABY_KINDS = ["minecraft:cow", "minecraft:pig", "minecraft:sheep", "minecraft:chicken"];

export const babyShower = (ctx) => {
  for (let i = 0; i < 10; i++) {
    ctx.dimension.spawnEntity(`${BABY_KINDS[rand(BABY_KINDS.length)]}<minecraft:entity_born>`, spot(ctx, 1));
  }
};

export const butterfingers = (ctx) => {
  const inv = ctx.player.getComponent("minecraft:inventory")?.container;
  const slot = ctx.player.selectedSlotIndex;
  const item = inv?.getItem(slot);
  if (!item) throw new Error("empty hand");
  inv.setItem(slot, undefined);
  ctx.dimension.spawnItem(item, ctx.top);
};

export const lavaSplash = (ctx) => {
  const block = ctx.dimension.getBlock({ x: ctx.loc.x, y: ctx.loc.y + 3, z: ctx.loc.z });
  if (!block) throw new Error("block not loaded");
  block.setType("minecraft:lava");
  later(80, () => {
    if (block.typeId === "minecraft:lava") block.setType("minecraft:air");
  });
};

let anvilBusy = false;

export const fallingAnvil = (ctx) => {
  if (anvilBusy) throw new Error("an anvil is already falling");
  anvilBusy = true;
  const warn = (text) => {
    ctx.player.onScreenDisplay.setActionBar(text);
    ctx.player.playSound("note.bass");
  };
  later(20, () => warn("§c§lLook up! Something heavy is coming..."));
  later(40, () => warn("§4§lMOVE!"));
  later(60, () => {
    const at = ctx.player.location;
    const x = Math.floor(at.x);
    const z = Math.floor(at.z);
    const top = Math.floor(at.y) + 5;
    const block = ctx.dimension.getBlock({ x, y: top, z });
    if (!block) {
      anvilBusy = false;
      return;
    }
    block.setType("minecraft:anvil");
    later(20, () => {
      if (block.typeId === "minecraft:anvil") block.setType("minecraft:air");
    });
    later(70, () => {
      for (let y = top; y >= top - 8; y--) {
        const cell = ctx.dimension.getBlock({ x, y, z });
        if (cell && cell.typeId === "minecraft:anvil") cell.setType("minecraft:air");
      }
      anvilBusy = false;
    });
  });
  later(200, () => {
    anvilBusy = false;
  });
};

const CHEST_LOOT = [
  ["minecraft:iron_ingot", 6],
  ["minecraft:gold_ingot", 4],
  ["minecraft:diamond", 2],
  ["minecraft:emerald", 4],
  ["minecraft:golden_apple", 1],
  ["minecraft:cooked_beef", 8],
  ["minecraft:ender_pearl", 2],
  ["minecraft:bread", 8],
  ["minecraft:coal", 12],
  ["minecraft:obsidian", 4],
  ["minecraft:lapis_lazuli", 8],
  ["minecraft:redstone", 12],
];

export const lightningChest = (ctx) => {
  const player = ctx.player.location;
  const px = Math.floor(player.x);
  const pz = Math.floor(player.z);
  const y = ctx.loc.y + 1;
  const spots = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      const x = ctx.loc.x + dx;
      const z = ctx.loc.z + dz;
      if (x === px && z === pz) continue;
      const cell = ctx.dimension.getBlock({ x, y, z });
      if (!cell || !cell.isAir) continue;
      const next = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ox, oz]) => {
        const near = ctx.dimension.getBlock({ x: x + ox, y, z: z + oz });
        return near && near.typeId === "minecraft:chest";
      });
      if (!next) spots.push({ x, z });
    }
  }
  if (spots.length === 0) throw new Error("no free spot");
  const at = spots[rand(spots.length)];
  const loot = [];
  const pool = CHEST_LOOT.slice();
  for (let i = 0; i < 5; i++) loot.push(pool.splice(rand(pool.length), 1)[0]);
  const place = (height) => {
    const block = ctx.dimension.getBlock({ x: at.x, y: height, z: at.z });
    if (!block) throw new Error("block not loaded");
    block.setType("minecraft:chest");
    const container = block.getComponent("minecraft:inventory")?.container;
    if (!container) throw new Error("chest inventory missing");
    loot.forEach(([id, n], slot) => container.setItem(slot, new ItemStack(id, n)));
  };
  const remove = (height) => {
    const block = ctx.dimension.getBlock({ x: at.x, y: height, z: at.z });
    if (block) block.setType("minecraft:air");
  };
  let height = y + 8;
  place(height);
  const fall = () => {
    remove(height);
    height -= 1;
    place(height);
    if (height > y) {
      later(2, fall);
      return;
    }
    for (let s = 0; s < 5; s++) {
      later(s * 20 + 1, () => {
        ctx.player.onScreenDisplay.setActionBar(`§eLoot chest! Lightning in ${5 - s}...`);
        ctx.player.playSound("note.bass");
      });
    }
    later(100, () => {
      const target = { x: at.x + 0.5, y, z: at.z + 0.5 };
      ctx.dimension.spawnEntity("minecraft:lightning_bolt", target);
      const block = ctx.dimension.getBlock({ x: at.x, y, z: at.z });
      if (!block || block.typeId !== "minecraft:chest") return;
      const container = block.getComponent("minecraft:inventory")?.container;
      if (container) {
        for (let slot = 0; slot < 27; slot++) {
          const item = container.getItem(slot);
          if (item) ctx.dimension.spawnItem(item, target);
        }
      }
      block.setType("minecraft:air");
    });
  };
  later(2, fall);
};
