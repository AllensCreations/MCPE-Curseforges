import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { registerController, endGame } from "./controller.js";
import { QUESTIONS } from "./questions.js";
import { REWARDS } from "./rewards.js";
import { CONSEQUENCES } from "./consequences.js";

const GAME_KEY = "game_state";
const playerStats = new Map();
const bypass = new Map();
const pending = new Map();
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const statsFor = (player) => {
  if (!playerStats.has(player.id)) playerStats.set(player.id, { lifelines: 3, multiplier: 1, multiplierUntil: 0, correct: 0, asked: new Set() });
  return playerStats.get(player.id);
};
const posKey = (player, loc, dimensionId) => `${player.id}|${dimensionId}|${loc.x},${loc.y},${loc.z}`;
const invOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

function say(player, message) {
  try { player.sendMessage(`§6[Trivia Vault]§r ${message}`); } catch (e) {}
}

function giveItem(player, typeId, count) {
  const inv = invOf(player);
  if (!inv) return;
  let remaining = count;
  while (remaining > 0) {
    const stack = new ItemStack(typeId, Math.min(remaining, 64));
    const leftover = inv.addItem(stack);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    remaining -= stack.amount;
  }
}

function award(player) {
  const stats = statsFor(player);
  const reward = REWARDS[rand(REWARDS.length)];
  const multiplier = system.currentTick <= stats.multiplierUntil ? stats.multiplier : 1;
  giveItem(player, reward.item, reward.count);
  if (reward.xp > 0) player.addExperience(Math.floor(reward.xp * multiplier));
  if (Math.random() < 0.16) {
    stats.multiplier = 2;
    stats.multiplierUntil = system.currentTick + 20 * 60;
    say(player, "XP multiplier activated: 2x for the next 60 seconds.");
  }
  say(player, `${reward.message} Correct answers: ${stats.correct}.`);
}

function removeHotbarItem(player) {
  const inv = invOf(player);
  if (!inv) return;
  const filled = [];
  for (let i = 0; i < Math.min(9, inv.size); i++) if (inv.getItem(i)) filled.push(i);
  if (!filled.length) { player.applyDamage(4); return; }
  const slot = filled[rand(filled.length)];
  inv.setItem(slot, undefined);
}

function spawnNear(player, type, count, radius = 10) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 2 + Math.random() * radius;
    const loc = { x: player.location.x + Math.cos(angle) * distance, y: player.location.y, z: player.location.z + Math.sin(angle) * distance };
    try { player.dimension.spawnEntity(type, loc); } catch (e) {}
  }
}

function dropAnvil(player) {
  const x = Math.floor(player.location.x);
  const y = Math.floor(player.location.y) + 4;
  const z = Math.floor(player.location.z);
  try {
    const block = player.dimension.getBlock({ x, y, z });
    if (block && block.isAir) block.setType("minecraft:anvil");
    else player.applyDamage(6);
  } catch (e) { player.applyDamage(6); }
}

function applyConsequence(player) {
  const outcome = CONSEQUENCES[rand(CONSEQUENCES.length)];
  switch (outcome.kind) {
    case "hotbar": removeHotbarItem(player); break;
    case "anvil": dropAnvil(player); break;
    case "creepers": spawnNear(player, "minecraft:creeper", 10, 10); break;
    case "damage": player.applyDamage(6 + rand(7)); break;
    case "hunger": player.addEffect("hunger", 20 * 45, { amplifier: 2 }); break;
    case "poison": player.addEffect("poison", 20 * 12, { amplifier: 1 }); break;
    case "weakness": player.addEffect("weakness", 20 * 35, { amplifier: 1 }); break;
    case "slowness": player.addEffect("slowness", 20 * 20, { amplifier: 2 }); break;
    case "blindness": player.addEffect("blindness", 20 * 8, { amplifier: 0 }); break;
    case "fire": player.setOnFire(8, true); break;
    case "lightning": {
      const l = player.location;
      try { player.dimension.spawnEntity("minecraft:lightning_bolt", { x: l.x + 2, y: l.y, z: l.z + 2 }); } catch (e) { player.applyDamage(5); }
      break;
    }
    case "teleport": {
      const l = player.location;
      try { player.teleport({ x: l.x + rand(17) - 8, y: l.y + 1, z: l.z + rand(17) - 8 }); } catch (e) { player.applyDamage(4); }
      break;
    }
    case "xp": player.addEffect("mining_fatigue", 20 * 25, { amplifier: 1 }); break;
    case "drop": {
      const inv = invOf(player);
      if (inv) {
        const filled = [];
        for (let i = 0; i < inv.size; i++) if (inv.getItem(i)) filled.push(i);
        if (filled.length) {
          const slot = filled[rand(filled.length)];
          const stack = inv.getItem(slot);
          inv.setItem(slot, undefined);
          try { player.dimension.spawnItem(stack, player.location); } catch (e) {}
        } else player.applyDamage(4);
      }
      break;
    }
    case "phantoms": spawnNear(player, "minecraft:phantom", 3, 10); break;
    case "spiders": spawnNear(player, "minecraft:spider", 5, 10); break;
    case "skeletons": spawnNear(player, "minecraft:skeleton", 5, 10); break;
    case "zombies": spawnNear(player, "minecraft:zombie", 5, 10); break;
    case "silverfish": spawnNear(player, "minecraft:silverfish", 8, 8); break;
    case "slimes": spawnNear(player, "minecraft:slime", 4, 8); break;
    default: player.applyDamage(5); break;
  }
  say(player, `Wrong answer. ${outcome.message}`);
}

function newQuestion(player, key, reduced = false) {
  const stats = statsFor(player);
  let pool = QUESTIONS.filter((q) => !stats.asked.has(q.question));
  if (!pool.length) {
    stats.asked.clear();
    pool = QUESTIONS;
  }
  const q = pool[rand(pool.length)];
  stats.asked.add(q.question);
  const choices = shuffle([q.answer, ...q.wrong]).map((text) => ({ text, correct: text === q.answer }));
  pending.set(player.id, { q, choices, key, reduced });
  showQuestion(player);
}

async function showQuestion(player) {
  const state = pending.get(player.id);
  if (!state) return;
  const stats = statsFor(player);
  const visible = state.reduced ? state.choices.filter((c) => c.correct || Math.random() < 0.34) : state.choices;
  const options = visible.length > 2 ? visible.slice(0, 2).concat(visible.filter((c) => c.correct).slice(0, 1)) : visible;
  const finalOptions = options.some((c) => c.correct) ? options : [state.choices.find((c) => c.correct), ...options.slice(0, 1)];
  const uniqueOptions = [...new Map(finalOptions.map((c) => [c.text, c])).values()];
  const form = new ActionFormData()
    .title(`Trivia Vault | ${state.q.category}`)
    .body(`${state.q.question}\n\nChoose one answer. A wrong answer triggers a random penalty.\nLifelines remaining: ${stats.lifelines}`);
  uniqueOptions.slice(0, 4).forEach((c) => form.button(c.text));
  if (!state.reduced && stats.lifelines > 0) form.button("Use Lifeline — remove wrong answers");
  else if (state.reduced && stats.lifelines > 0) form.button("Use Lifeline — cryptic hint");
  let response;
  try { response = await form.show(player); } catch (e) { return; }
  if (response.canceled) { pending.delete(player.id); return; }
  const lifelineIndex = uniqueOptions.slice(0, 4).length;
  if (response.selection === lifelineIndex && stats.lifelines > 0) {
    stats.lifelines--;
    if (!state.reduced) {
      state.reduced = true;
      state.choices = state.choices.filter((c) => c.correct || Math.random() < 0.34);
      if (!state.choices.some((c) => c.correct)) state.choices[0] = { text: state.q.answer, correct: true };
      state.choices = shuffle(state.choices);
      pending.set(player.id, state);
      showQuestion(player);
    } else {
      say(player, `Hint: the answer begins with “${state.q.answer.slice(0, 1)}” and has ${state.q.answer.length} characters.`);
      showQuestion(player);
    }
    return;
  }
  const chosen = uniqueOptions[response.selection];
  pending.delete(player.id);
  if (chosen?.correct) {
    stats.correct++;
    bypass.set(state.key, system.currentTick + 100);
    award(player);
    say(player, "Block unlocked. Break that same block again to harvest it.");
  } else {
    applyConsequence(player);
  }
}

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  if (world.getDynamicProperty(GAME_KEY) !== "running") return;
  if (event.player.getGameMode() === GameMode.Creative) return;
  const block = event.block;
  const loc = { x: block.location.x, y: block.location.y, z: block.location.z };
  const key = posKey(event.player, loc, event.dimension.id);
  const expiry = bypass.get(key);
  if (expiry && expiry >= system.currentTick) {
    bypass.delete(key);
    return;
  }
  event.cancel = true;
  system.run(() => newQuestion(event.player, key));
});

world.afterEvents.entityDie.subscribe((event) => {
  const entity = event.deadEntity;
  if (entity.typeId !== "minecraft:player") return;
  if (world.getDynamicProperty(GAME_KEY) !== "running") return;
  say(entity, "You have been eliminated. The vault closes.");
  endGame();
});

world.afterEvents.playerLeave.subscribe((event) => {
  playerStats.delete(event.playerId);
  pending.delete(event.playerId);
  for (const key of bypass.keys()) if (key.startsWith(`${event.playerId}|`)) bypass.delete(key);
});

registerController({
  title: "Trivia Vault: The Locked World",
  gameInfo: "Type: Survival trivia challenge\nPlayers: Solo\nGoal: Answer Minecraft questions correctly to unlock blocks and earn rewards.",
  howToPlay: "Goal: Survive the Trivia Vault and collect rare rewards.\nControls: In Survival, attempt to break a block to open a four-choice trivia question. Choose an answer in the form.\nCorrect: Receive a random reward, then break the same block again to harvest it.\nWrong: Receive a randomized penalty, including lost hotbar items, an anvil hazard, or ten creepers.\nLifelines: Three per run. Use one to remove wrong answers or reveal a cryptic hint.\nCreative: Block breaking is not intercepted.\nHow it ends: Your death ends the run. Use the Controller to start another run.",
  onStart: (player) => {
    playerStats.clear();
    pending.clear();
    bypass.clear();
    playerStats.set(player.id, { lifelines: 3, multiplier: 1, multiplierUntil: 0, correct: 0, asked: new Set() });
    world.sendMessage("§6Trivia Vault: The Locked World§r has opened. Every Survival block break is a question.");
    say(player, `Question bank: ${QUESTIONS.length} entries. Rewards: ${REWARDS.length}. Penalties: ${CONSEQUENCES.length}.`);
  },
  onEnd: () => {
    pending.clear();
    bypass.clear();
    world.sendMessage("§6Trivia Vault§r is closed. Start again with the Controller when ready.");
  },
});
