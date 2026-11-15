import { world, system } from "@minecraft/server";
import { formatChat, isOnline, pickOnline } from "./smp_roster.js";
import { assembleMessage, pickItem } from "./chat_generator.js";

const MIN_DELAY = 35;
const MAX_DELAY = 100;
const GAP_BETWEEN_CONVERSATIONS = 80;
const MAX_QUEUE = 4;

const queue = [];
let busy = false;

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

function runNext() {
  if (busy || queue.length === 0) return;
  const lines = queue.shift();
  busy = true;
  let t = rand(20, 50);
  for (const line of lines) {
    system.runTimeout(() => {

      if (line.bot && !isOnline(line.bot)) return;
      world.sendMessage(line.bot ? formatChat(line.bot, line.text) : line.text);
    }, t);
    t += rand(MIN_DELAY, MAX_DELAY);
  }
  system.runTimeout(() => {
    busy = false;
    runNext();
  }, t + GAP_BETWEEN_CONVERSATIONS);
}

export function playConversation(linesArray, options = {}) {
  const lines = (linesArray || []).filter((l) => l && l.text);
  if (lines.length === 0) return false;
  if (options.priority) queue.unshift(lines);
  else if (busy || queue.length > 0) return false;
  else queue.push(lines);
  while (queue.length > MAX_QUEUE) queue.pop();
  runNext();
  return true;
}

function chain(bots, categories, ctx) {
  return bots.map((bot, i) => ({
    bot,
    text: assembleMessage(categories[Math.min(i, categories.length - 1)], { ...ctx, speaker: bot }),
  }));
}

export function reactToDeath(player, kind, cause, hint) {
  const n = rand(2, 4);
  const bots = pickOnline(n);
  if (bots.length < 2) return;
  const first = `death_${kind}`;
  const cats = [first, "death_followup", "support_reply", "death_followup"];
  playConversation(chain(bots, cats, { player, cause, coordHint: hint }), { priority: true });
}

export function reactToOre(player, oreKind, count, hint) {
  const bots = pickOnline(count >= 4 ? 3 : 2);
  if (bots.length < 2) return;
  const item = pickItem(oreKind);
  const cats = [`ore_${oreKind}`, "ore_reply", "support_reply"];
  const lines = chain(bots, cats, { player, item, coordHint: hint });
  playConversation(lines, { priority: true });
}

export function welcomeBack(player) {
  const bots = pickOnline(rand(2, 3));
  if (bots.length < 2) return;
  playConversation(chain(bots, ["greeting_wb", "greeting_hello", "greeting_anyone"], { player }), { priority: true });
}

export function reactToEvent(player, category) {
  const bots = pickOnline(2);
  if (bots.length < 2) return;
  playConversation(chain(bots, [category, "support_reply"], { player }), { priority: true });
}

function dramaChain() {
  const bots = pickOnline(3);
  if (bots.length < 3) return false;
  const [a, b, c] = bots;
  const ctx = { botA: a.name, botB: b.name };
  return playConversation([
    { bot: a, text: assembleMessage("drama_kill", { ...ctx, speaker: a }) },
    { bot: b, text: assembleMessage("drama_complain", { ...ctx, speaker: b }) },
    { bot: c, text: assembleMessage("drama_laugh", { ...ctx, speaker: c }) },
  ]);
}

export function ambientConversation() {
  const players = world.getAllPlayers();
  if (players.length === 0) return;
  const player = players[rand(0, players.length - 1)].name;
  const roll = Math.random();
  if (roll < 0.25) return void dramaChain();
  const cats = roll < 0.45
    ? ["banter_video", "banter_video", "support_reply", "banter_video", "support_reply"]
    : roll < 0.65
      ? ["banter_build", "banter_build", "support_reply", "banter_lag"]
      : roll < 0.8
        ? ["banter_lag", "support_reply", "banter_build"]
        : ["greeting_anyone", "greeting_hello", "support_reply"];
  const n = Math.min(cats.length, rand(2, 5));
  const bots = pickOnline(n);
  if (bots.length < 2) return;
  playConversation(chain(bots, cats, { player }));
}

const formatCoords = (a) => "x " + a[0] + ", y " + a[1] + ", z " + a[2];

export function announceSpawner(player, loc) {
  const bots = pickOnline(2);
  if (bots.length < 2) return false;
  const real = [loc.x, loc.y, loc.z];
  const negatives = [0, 1, 2].filter((i) => real[i] < 0);
  const slip = negatives.length > 0 && Math.random() < 0.35;
  const shown = real.slice();
  if (slip) {
    const i = negatives[rand(0, negatives.length - 1)];
    shown[i] = Math.abs(shown[i]);
  }
  const lines = chain(bots, ["locator_spawner", "locator_reply"], { player, coords: formatCoords(shown) });
  if (!playConversation(lines)) return false;
  if (slip) {
    system.runTimeout(() => {
      const bot = isOnline(bots[0]) ? bots[0] : pickOnline(1)[0];
      if (!bot) return;
      const text = assembleMessage("locator_fix", { player, coords: formatCoords(real), speaker: bot });
      playConversation([{ bot, text }], { priority: true });
    }, rand(2000, 3000));
  }
  return true;
}
