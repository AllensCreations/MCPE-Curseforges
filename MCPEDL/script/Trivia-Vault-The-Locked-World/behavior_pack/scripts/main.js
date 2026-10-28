import { world, system, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { registerController, endGame } from "./controller.js";
import { QUESTIONS } from "./questions.js";
import { CONSEQUENCES } from "./consequences.js";

const GAME_KEY = "game_state";
const playerStats = new Map();
const pending = new Map();
const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
const statsFor = (player) => {
  if (!playerStats.has(player.id)) playerStats.set(player.id, { lifelines: 3, multiplier: 1, multiplierUntil: 0, correct: 0, asked: new Set() });
  return playerStats.get(player.id);
};
function unlockProperty(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return `tv_unlocked_${(hash >>> 0).toString(16)}`;
}
function isBlockUnlocked(key) {
  try { return world.getDynamicProperty(unlockProperty(key)) === true; } catch (e) { return false; }
}
function permanentlyUnlockBlock(key) {
  try { world.setDynamicProperty(unlockProperty(key), true); return true; } catch (e) { return false; }
}
const invOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

function say(player, message) {
  try { player.sendMessage(`§6[Trivia Vault]§r ${message}`); } catch (e) {}
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

function removeMatchingBlocksInRadius(player, target) {
  if (!target?.location || !target?.typeId || !target?.dimension) {
    say(player, "The block-disappearing penalty could not find its target.");
    return;
  }
  const center = { x: Math.floor(target.location.x), y: Math.floor(target.location.y), z: Math.floor(target.location.z) };
  const radius = 20;
  const typeId = target.typeId;
  let removed = 0;
  function* scan() {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dy * dy + dz * dz > radius * radius) continue;
          try {
            const block = target.dimension.getBlock({ x: center.x + dx, y: center.y + dy, z: center.z + dz });
            if (block && block.typeId === typeId) {
              block.setType("minecraft:air");
              removed++;
            }
          } catch (e) {}
        }
      }
      yield;
    }
    say(player, `Wrong answer. ${removed} matching ${typeId.replace("minecraft:", "")} blocks disappeared within a 20-block radius.`);
  }
  system.runJob(scan());
}

function applyConsequence(player, target) {
  const outcome = CONSEQUENCES[rand(CONSEQUENCES.length)];
  switch (outcome.kind) {
    case "blocks_radius": removeMatchingBlocksInRadius(player, target); break;
    case "hotbar": removeHotbarItem(player); break;
    case "anvil": dropAnvil(player); break;
    case "creepers": spawnNear(player, "minecraft:creeper", 10, 10); spawnNear(player, "minecraft:creeper", 2, 5); break;
    case "damage": player.applyDamage(10 + rand(11)); break;
    case "hunger": player.addEffect("hunger", 20 * 60, { amplifier: 3 }); break;
    case "poison": player.addEffect("poison", 20 * 18, { amplifier: 1 }); break;
    case "weakness": player.addEffect("weakness", 20 * 50, { amplifier: 2 }); break;
    case "slowness": player.addEffect("slowness", 20 * 30, { amplifier: 3 }); break;
    case "blindness": player.addEffect("blindness", 20 * 12, { amplifier: 0 }); break;
    case "fire": player.setOnFire(12, true); break;
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
    case "phantoms": spawnNear(player, "minecraft:phantom", 5, 10); break;
    case "spiders": spawnNear(player, "minecraft:spider", 7, 10); break;
    case "skeletons": spawnNear(player, "minecraft:skeleton", 7, 10); break;
    case "zombies": spawnNear(player, "minecraft:zombie", 7, 10); break;
    case "silverfish": spawnNear(player, "minecraft:silverfish", 10, 8); break;
    case "slimes": spawnNear(player, "minecraft:slime", 6, 8); break;
    default: player.applyDamage(5); break;
  }
  if (outcome.kind !== "blocks_radius") say(player, `Wrong answer. ${outcome.message}`);
}

function newQuestion(player, key, target) {
  const stats = statsFor(player);
  let pool = QUESTIONS.filter((q) => !stats.asked.has(q.question));
  if (!pool.length) { stats.asked.clear(); pool = QUESTIONS; }
  const q = pool[rand(pool.length)];
  stats.asked.add(q.question);
  const wrong = [...new Set(q.wrong.filter((a) => a !== q.answer))].slice(0, 3);
  if (wrong.length !== 3) { say(player, "This question could not be loaded safely. Try breaking the block again."); return; }
  const choices = shuffle([q.answer, ...wrong]).map((text) => ({ text, correct: text === q.answer }));
  pending.set(player.id, { q, choices, key, target });
  showQuestion(player);
}

async function showQuestion(player) {
  const state = pending.get(player.id);
  if (!state) return;
  const stats = statsFor(player);
  if (!state.ready) {
    state.ready = true;
    pending.set(player.id, state);
    const menu = new ActionFormData()
      .title("Trivia Vault | Locked Block")
      .body(`A trivia question is ready.\nFour answer choices will appear on the next screen.\nLifelines remaining: ${stats.lifelines}`)
      .button("Answer the question")
      .button("Use a lifeline");
    let menuResponse;
    try { menuResponse = await menu.show(player); } catch (e) { return; }
    if (menuResponse.canceled) { pending.delete(player.id); return; }
    if (menuResponse.selection === 1) { await showLifeline(player); return; }
  }
  const form = new ActionFormData()
    .title(`Trivia Vault | ${state.q.category}`)
    .body(`${state.q.question}\n\nChoose one of the four answers. Wrong answers trigger severe penalties.`);
  state.choices.forEach((c) => form.button(c.text));
  let response;
  try { response = await form.show(player); } catch (e) { return; }
  if (response.canceled) { pending.delete(player.id); return; }
  const chosen = state.choices[response.selection];
  pending.delete(player.id);
  if (chosen?.correct) {
    stats.correct++;
    const unlocked = permanentlyUnlockBlock(state.key);
    say(player, unlocked ? "Correct answer! This block type is now permanently unlocked. All blocks of this type across the world can now be broken without another question." : "Correct answer! This block type is unlocked for this run; permanent storage was unavailable.");
  } else {
    applyConsequence(player, state.target);
  }
}

async function showLifeline(player) {
  const stats = statsFor(player);
  if (stats.lifelines <= 0) { say(player, "No lifelines remain."); return; }
  const form = new ActionFormData()
    .title("Trivia Vault | Lifeline")
    .body("Use one of your limited lifelines before answering. The question will still show exactly four choices.")
    .button("Cryptic hint")
    .button("Return to question");
  try {
    const response = await form.show(player);
    if (response.canceled || response.selection !== 0) { showQuestion(player); return; }
    const state = pending.get(player.id);
    if (!state) return;
    stats.lifelines--;
    say(player, `Cryptic hint: the answer begins with “${state.q.answer.slice(0, 1)}” and contains ${state.q.answer.length} characters.`);
    showQuestion(player);
  } catch (e) {}
}

world.beforeEvents.playerBreakBlock.subscribe((event) => {
  if (world.getDynamicProperty(GAME_KEY) !== "running") return;
  if (event.player.getGameMode() === GameMode.Creative) return;
  const block = event.block;
  const key = `block_${block.typeId}`;
  if (isBlockUnlocked(key)) return;
  event.cancel = true;
  const target = { typeId: block.typeId, location: { ...block.location }, dimension: event.player.dimension };
  system.run(() => newQuestion(event.player, key, target));
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
});

registerController({
  title: "Trivia Vault: The Locked World",
  gameInfo: "Type: Survival trivia challenge\nPlayers: Solo\nGoal: Answer general-knowledge and Minecraft questions correctly to unlock block types.",
  howToPlay: "Goal: Survive the Trivia Vault by answering trivia questions correctly.\nControls: In Survival, attempt to break a block to open a general-knowledge or Minecraft trivia question with exactly four answer choices.\nCorrect: That block type is permanently unlocked in the world, so every block of that type can be broken without another question. Unlocking the block is the only reward.\nWrong: Face randomized penalties, including a chance for matching blocks within a 20-block radius of the targeted block to disappear.\nLifelines: Three hint lifelines per run; they never remove answer choices.\nCreative: Block breaking is not intercepted.\nHow it ends: Your death ends the run. Use the Controller to start another run.",
  onStart: (player) => {
    playerStats.clear();
    pending.clear();
    playerStats.set(player.id, { lifelines: 3, multiplier: 1, multiplierUntil: 0, correct: 0, asked: new Set() });
    world.sendMessage("§6Trivia Vault: The Locked World§r has opened. Every locked Survival block type triggers a trivia question.");
    say(player, `Trivia question bank: ${QUESTIONS.length} entries. Four choices per question. No rewards are given for correct answers. Penalties: ${CONSEQUENCES.length}.`);
  },
  onEnd: () => {
    pending.clear();
    world.sendMessage("§6Trivia Vault§r is closed. Start again with the Controller when ready.");
  },
});
