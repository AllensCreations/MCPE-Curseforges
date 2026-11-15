import { world, system } from "@minecraft/server";
import { formatChat, isOnline, pickOnline } from "./smp_roster.js";
import { assembleMessage, pickItem, renderLine } from "./chat_generator.js";
import { DIALOGS } from "./chat_lines_extra.js";

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

const TOPICS = [
  "weather_rain", "weather_storm", "night_falls", "morning", "farm_talk", "trade_talk", "raid_talk", "base_tour",
  "redstone_talk", "pvp_talk", "boss_dragon", "boss_wither", "nether_roof", "fishing", "explore", "pets",
  "horses_boats", "food_talk", "music_talk", "server_event", "building_progress", "lost_items", "mining_talk", "enchant_talk",
];

function topicChat(player) {
  const topic = TOPICS[rand(0, TOPICS.length - 1)];
  const bots = pickOnline(rand(2, 4));
  if (bots.length < 2) return;
  playConversation(chain(bots, [topic, topic, "support_reply", topic], { player }));
}

function dialogChat(player) {
  const script = DIALOGS[rand(0, DIALOGS.length - 1)];
  const need = Math.min(3, script.reduce((m, l) => Math.max(m, l[0] + 1), 1));
  const bots = pickOnline(need);
  if (bots.length < need) return;
  const ctx = {
    player,
    botA: bots[0].name,
    botB: bots[1] ? bots[1].name : "",
    botC: bots[2] ? bots[2].name : "",
  };
  playConversation(script.map(([i, text]) => ({ bot: bots[i], text: renderLine(text, { ...ctx, speaker: bots[i] }) })));
}

export function ambientConversation() {
  const players = world.getAllPlayers();
  if (players.length === 0) return;
  const player = players[rand(0, players.length - 1)].name;
  const roll = Math.random();
  if (roll < 0.15) return void dramaChain();
  if (roll < 0.4) return void dialogChat(player);
  if (roll < 0.7) return void topicChat(player);
  const cats = roll < 0.8
    ? ["banter_video", "banter_video", "support_reply", "banter_video", "support_reply"]
    : roll < 0.9
      ? ["banter_build", "banter_build", "support_reply", "banter_build"]
      : roll < 0.95
        ? ["banter_video", "support_reply", "banter_build"]
        : ["greeting_anyone", "greeting_hello", "support_reply"];
  const n = Math.min(cats.length, rand(2, 5));
  const bots = pickOnline(n);
  if (bots.length < 2) return;
  playConversation(chain(bots, cats, { player }));
}
