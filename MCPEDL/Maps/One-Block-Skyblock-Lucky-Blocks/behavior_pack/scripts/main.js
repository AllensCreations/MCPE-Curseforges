// Entry point: wires the break event, the lucky block safety timer and the island setup together.
import { world, system } from "@minecraft/server";
import { TYPES, CORE, SETUP_TAG } from "./lib/config.js";
import { rand } from "./lib/helpers.js";
import { PRIZES } from "./lib/prizes.js";
import { takeTutorial, showTutorial } from "./lib/tutorial.js";
import { nextBlockId } from "./lib/types.js";
import { registerIsland } from "./lib/island.js";

function announce(ctx, prize) {
  const good = prize[1] === "g";
  const line = `${ctx.type.label}§r §7${ctx.type.chance}% §8|§r ${good ? "§a" : "§c"}${prize[0]}`;
  try {
    ctx.player.onScreenDisplay.setActionBar(line);
    ctx.player.playSound(good ? "random.levelup" : "note.bass");
    ctx.dimension.spawnParticle(good ? "minecraft:villager_happy" : "minecraft:villager_angry", ctx.top);
  } catch (e) {
    return;
  }
}

function trigger(player, dimension, loc, type) {
  const ctx = { player, dimension, loc, type, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  const pool = type.theme ? PRIZES.filter((p) => p[2].includes(type.theme)) : PRIZES;
  for (let attempt = 0; attempt < 6; attempt++) {
    const prize = pool[rand(pool.length)];
    try {
      prize[3](ctx);
    } catch (e) {
      continue;
    }
    announce(ctx, prize);
    return;
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const type = TYPES[event.brokenBlockPermutation.type.id];
  if (!type) return;
  const { player, dimension, block } = event;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  const isCore = dimension.id === "minecraft:overworld" && loc.x === CORE.x && loc.y === CORE.y && loc.z === CORE.z;
  system.run(() => {
    const step = isCore ? takeTutorial() : null;
    if (isCore) {
      const target = dimension.getBlock(loc);
      if (target && target.isAir) target.setType(nextBlockId());
    }
    if (step) showTutorial(player, dimension, loc, step);
    else trigger(player, dimension, loc, type);
  });
});

system.runInterval(() => {
  if (world.getPlayers({ tags: [SETUP_TAG] }).length === 0) return;
  try {
    const block = world.getDimension("overworld").getBlock(CORE);
    if (block && block.isAir) block.setType(nextBlockId());
  } catch (e) {
    return;
  }
}, 100);

registerIsland();
