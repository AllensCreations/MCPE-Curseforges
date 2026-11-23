import { system, ItemStack } from "@minecraft/server";
import { giveStack } from "./vault.js";
import { crateOdds, poolOf, tierOf } from "./config.js";

const sleep = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));

export function rollCrate(crate) {
  const odds = crateOdds(crate);
  let r = Math.random() * 100;
  for (const o of odds) {
    r -= o.chance;
    if (r < 0) return o.prize;
  }
  return odds[odds.length - 1].prize;
}

const run = (player, cmd) => {
  try {
    player.runCommand(cmd);
  } catch (e) {}
};

export async function animateCrate(player, crate, prize) {
  const delays = [2, 2, 2, 2, 3, 3, 4, 4, 5, 6, 7, 8, 10, 12];
  const pool = poolOf(crate);
  let pitch = 0.6;
  for (let i = 0; i < delays.length; i++) {
    const shown = i === delays.length - 1 ? prize : pool[Math.floor(Math.random() * pool.length)];
    try {
      player.onScreenDisplay.setActionBar(`§l§e>> §f${shown.label} §e<<`);
    } catch (e) {}
    run(player, `playsound note.hat @s ~ ~ ~ 1 ${pitch.toFixed(2)}`);
    run(player, `playsound note.bd @s ~ ~ ~ 0.6 ${(pitch * 0.8).toFixed(2)}`);
    pitch = Math.min(2, pitch + 0.1);
    await sleep(delays[i]);
  }
  run(player, "playsound note.pling @s ~ ~ ~ 1.5 2");
  run(player, "playsound random.levelup @s ~ ~ ~ 1 1");
  for (let k = 0; k < 8; k++) {
    const dx = (Math.random() * 2 - 1) * 1.5;
    const dz = (Math.random() * 2 - 1) * 1.5;
    const dy = 0.5 + Math.random() * 1.8;
    run(player, `particle minecraft:totem_particle ~${dx.toFixed(2)} ~${dy.toFixed(2)} ~${dz.toFixed(2)}`);
  }
  const tier = tierOf(prize);
  run(player, `title @s title ${prize.tier === "legendary" ? "§6§lJACKPOT" : `${tier.color}§l${tier.name.toUpperCase()}`}`);
  run(player, `title @s subtitle §f${prize.label}`);
}

export function grantPrize(player, prize) {
  let left = prize.amount;
  while (left > 0) {
    const n = Math.min(64, left);
    giveStack(player, new ItemStack(prize.id, n));
    left -= n;
  }
}
