import { BANKS, EXTRA_CORES, EXTRA_OPENERS, EXTRA_TAILS } from "./chat_lines_extra.js";
const OPENERS = ["", "yo", "bro", "ngl", "honestly", "wait", "lmao", "bruh", "ok", "oh", "nah", "dude", "hey", "ayo", "fr", "uh"];
const TAILS = ["", "lol", "lmao", "haha", "xD", "fr", "tbh", "ngl", "istg", "bruh", "lmaooo", "man", "dude", "mate", "honestly"];

const FLAVOR = {
  Builder: ["gotta finish my wall", "need more concrete", "still doing the roof", "palette check later", "my build is getting huge"],
  Redstoner: ["my farm is still glitchy", "need more observers", "clock is off by a tick", "hopper chain is cursed", "need to tidy my wires"],
  PvPer: ["need a rematch", "gap me later", "crits only", "my armor is mending", "duel at spawn?"],
  Wholesome: ["love this server", "you all are the best", "made cookies irl", "so cozy today", "<3"],
  Chaotic: ["i have a plan (bad)", "tnt is a lifestyle", "do not check my chest", "trust me", "chaos mode on"],
};

const C = {
  death_creeper: [
    "<PLAYER> got hugged by a creeper", "that creeper had perfect timing <PLAYER>", "ssssss... boom, rip <PLAYER>",
    "<PLAYER> why did you turn your back on <CAUSE>", "the creeper said hi <PLAYER>", "another creeper victim, <PLAYER> joins the club",
    "<PLAYER> check your items before they despawn", "creepers are undefeated against <PLAYER> today",
  ],
  death_lava: [
    "<PLAYER> took a swim in <CAUSE>", "lava strikes again, rip <PLAYER>", "<PLAYER> that was not water",
    "bucket clutch fail <PLAYER>?", "<PLAYER> your stuff is gone in the lava", "the floor is lava and <PLAYER> believed it",
    "nobody told <PLAYER> lava is hot", "<PLAYER> speedran the nether lava lake",
  ],
  death_fall: [
    "<PLAYER> forgot the water bucket", "gravity won again <PLAYER>", "<PLAYER> tried to fly without elytra",
    "that was a long fall <PLAYER>", "<PLAYER> hit the ground at full speed", "fall damage claims <PLAYER>",
    "<PLAYER> you needed feather falling", "<PLAYER> the ground is not soft",
  ],
  death_mob: [
    "<PLAYER> got jumped by <CAUSE>", "<CAUSE> got <PLAYER> good", "<PLAYER> should have had a shield up",
    "rip <PLAYER>, <CAUSE> is brutal", "<PLAYER> lost that fight to <CAUSE>", "<CAUSE> sent <PLAYER> back to spawn",
    "<PLAYER> grab your gear before it despawns", "<PLAYER> that mob fight was rough",
  ],
  death_void: [
    "<PLAYER> fell into the void", "the void took <PLAYER>", "<PLAYER> found the bottom of the world",
    "rip <PLAYER>, no items coming back", "<PLAYER> said hi to the void", "<PLAYER> do not look down in the end",
    "void death for <PLAYER>, painful", "<PLAYER> went out of bounds",
  ],
  death_generic: [
    "rip <PLAYER>", "<PLAYER> just died, are you ok", "oof <PLAYER>", "<PLAYER> respawn and get your stuff",
    "that was not <PLAYER>'s best moment", "<PLAYER> you good?", "<PLAYER> died again", "gg <PLAYER>, run it back",
  ],
  death_followup: [
    "same thing happened to me yesterday", "i can come help you get your stuff", "keep inventory would have saved you",
    "we have all been there", "it is always the one time you forget a bucket", "i will meet you at spawn",
    "respawn and breathe, you got this", "pro tip: bed near your base",
  ],
  support_reply: [
    "yeah for real", "totally agree", "that is so true", "i was thinking the same", "classic SMP moment",
    "you got this", "this server never disappoints", "ok that is actually funny",
  ],
  ore_diamond: [
    "<PLAYER> found <ITEM> <COORD_HINT>", "diamond luck for <PLAYER>, nice", "<PLAYER> hit <ITEM>, share some",
    "<PLAYER> is rich now with <ITEM>", "congrats <PLAYER> on <ITEM>", "<PLAYER> your mining luck is unreal",
    "<ITEM> found by <PLAYER>, sparkle sparkle", "<PLAYER> that vein was huge",
  ],
  ore_debris: [
    "<PLAYER> found <ITEM> <COORD_HINT>", "netherite incoming for <PLAYER>", "<PLAYER> your bed mining paid off",
    "<ITEM> from <PLAYER>, absolutely cracked", "<PLAYER> is going full netherite", "congrats <PLAYER>, <ITEM> is rare",
    "<PLAYER> upgrade time", "<PLAYER> that is the dream drop",
  ],
  ore_emerald: [
    "<PLAYER> found <ITEM> <COORD_HINT>", "emeralds for <PLAYER>, villager trades unlocked", "<PLAYER> the trading hall needs that",
    "<ITEM> from <PLAYER>, nice find", "<PLAYER> is about to buy everything", "<PLAYER> mountain mining pays off",
    "congrats <PLAYER> on <ITEM>", "<PLAYER> emerald vibes",
  ],
  ore_reply: [
    "okay i am so jealous", "i have been mining for an hour with nothing", "share the coords", "you always get the good luck",
    "bring some back to spawn shop", "that is a lot of loot", "mining god", "now i need to go mining too",
  ],
  greeting_anyone: [
    "anyone online?", "is anyone around?", "hello? anyone alive?", "who is online right now?",
    "anyone want to explore later?", "who wants to help with my build?", "anyone down for a nether trip?", "chat is quiet today",
  ],
  greeting_hello: [
    "hallo <PLAYER>", "hello <PLAYER>", "hi <PLAYER>, how is it going?", "hey <PLAYER>, what are you up to?",
    "<PLAYER> is here, hi", "morning <PLAYER>", "good to see you <PLAYER>", "hey <PLAYER>, come see my build",
  ],
  greeting_wb: [
    "wb <PLAYER>", "welcome back <PLAYER>", "<PLAYER> is back", "wb <PLAYER>, missed you",
    "<PLAYER> joined, the party can start", "wb <PLAYER>, ready to build?", "welcome <PLAYER>, grab a spot", "<PLAYER> you are just in time",
  ],
  banter_video: [
    "did you see the latest video?", "that new video was so good", "the thumbnail was clickbait but i loved it",
    "i watched the whole video in one sitting", "the editing in that video was crazy", "who is making the next video?",
    "i want a video of the spawn shop", "the build tour video needs a part two",
  ],
  banter_build: [
    "spawn shop is stacked", "the new build near spawn looks incredible", "i am redoing my base again",
    "my farm finally works", "we need a bigger storage room", "the mega build is coming along",
    "someone needs to light up the spawn area", "the shopping district is getting huge",
  ],
  drama_kill: [
    "<BOT_A> just clapped <BOT_B>", "<BOT_A> got <BOT_B> with a crit", "oh no, <BOT_A> and <BOT_B> are dueling",
    "<BOT_B> just lost to <BOT_A>", "<BOT_A> sniped <BOT_B> with an arrow", "<BOT_A> sent <BOT_B> back to spawn",
    "pvp at spawn, <BOT_A> wins", "<BOT_A> got the kill on <BOT_B>",
  ],
  drama_complain: [
    "<BOT_A> that was not fair", "i was afk, <BOT_A> cheated", "you hit me with a cheap hit, <BOT_A>",
    "rematch <BOT_A>, now", "i lost my good sword, <BOT_A>", "<BOT_A> you owe me a golden apple",
    "i was not even ready", "no totem, no mercy, <BOT_A>",
  ],
  drama_laugh: [
    "<BOT_B> got destroyed", "this server is gold", "<BOT_A> you are menacing", "i cannot stop laughing",
    "<BOT_B> is never going to live this down", "somebody clip that", "grab the popcorn", "best drama of the day",
  ],
  dim_nether: [
    "<PLAYER> is heading to the nether, watch the ghasts", "<PLAYER> took the nether portal", "nether trip for <PLAYER>, bring fire resistance",
    "<PLAYER> do not dig straight down in the nether", "<PLAYER> found the portal room", "careful in the nether <PLAYER>",
    "<PLAYER> where are you headed in the nether?", "<PLAYER> is a brave one",
  ],
  dim_end: [
    "<PLAYER> is going to the end", "<PLAYER> bring blocks for the void", "end trip for <PLAYER>, good luck",
    "<PLAYER> watch out for endermen", "<PLAYER> entered the end, wow", "bring a water bucket <PLAYER>",
    "<PLAYER> found the end portal", "<PLAYER> is going for the elytra",
  ],
  sleeping: [
    "<PLAYER> is sleeping, goodnight", "<PLAYER> skipped the night", "sweet dreams <PLAYER>",
    "<PLAYER> is in bed, no phantoms", "night skip by <PLAYER>, thanks", "<PLAYER> is catching some sleep",
    "bed time for <PLAYER>", "<PLAYER> got us through the night",
  ],
};

for (const k of Object.keys(EXTRA_CORES)) C[k] = (C[k] || []).concat(EXTRA_CORES[k]);
OPENERS.push(...EXTRA_OPENERS);
TAILS.push(...EXTRA_TAILS);

const recent = [];
const recentSet = new Set();
const MAX_RECENT = 400;

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function remember(line) {
  recent.push(line);
  recentSet.add(line);
  if (recent.length > MAX_RECENT) recentSet.delete(recent.shift());
}

export function coordHint(location, dimensionId) {
  const dim = String(dimensionId || "").replace("minecraft:", "");
  const where = dim === "nether" ? "in the nether" : dim === "the_end" ? "in the end" : "in the overworld";
  if (!location) return where;
  const x = Math.round(location.x / 100) * 100;
  const z = Math.round(location.z / 100) * 100;
  return pick([`near x ${x}`, `around z ${z}`, `${where}`, `somewhere near ${x}, ${z}`]);
}
function fillSlots(text) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (BANKS[k] ? pick(BANKS[k]) : m));
}

function resolve(raw, ctx) {
  const text = fillSlots(raw);
  const map = {
    "<PLAYER>": ctx.player || "someone",
    "<CAUSE>": ctx.cause || "something",
    "<ITEM>": ctx.item || "loot",
    "<COORD_HINT>": ctx.coordHint || "nearby",
    "<BOT_A>": ctx.botA || "someone",
    "<BOT_B>": ctx.botB || "someone",
    "<BOT_C>": ctx.botC || "someone",
  };
  return text.replace(/<(PLAYER|CAUSE|ITEM|COORD_HINT|BOT_A|BOT_B|BOT_C)>/g, (m) => map[m]);
}

const NO_FLAVOR = /^(death_|ore_|dim_|sleeping|drama_|support_|bot_|greeting_hello|greeting_wb)/;

export function assembleMessage(category, ctx = {}) {
  const cores = C[category] || C.death_generic;
  let line = "";
  for (let attempt = 0; attempt < 14; attempt++) {
    const core = pick(cores);
    const asks = core.indexOf("?") !== -1;
    const parts = [];
    if (Math.random() < (asks ? 0.4 : 0.8)) parts.push(pick(OPENERS));
    parts.push(core);
    if (!asks && Math.random() < 0.7) parts.push(pick(TAILS));
    let text = parts.filter(Boolean).join(" ");
    const flavors = !asks && !NO_FLAVOR.test(category) && ctx.speaker && FLAVOR[ctx.speaker.type];
    if (flavors && Math.random() < 0.25) text += ", " + pick(flavors);
    line = resolve(text, ctx);
    if (!recentSet.has(line)) break;
  }
  remember(line);
  return line;
}

export function renderLine(text, ctx = {}) {
  const line = resolve(text, ctx);
  remember(line);
  return line;
}

export const CATEGORY_NAMES = Object.keys(C);

function slotCombos(core) {
  let n = 1;
  for (const m of core.matchAll(/\{(\w+)\}/g)) n *= BANKS[m[1]] ? BANKS[m[1]].length : 1;
  return n;
}

export function totalVariations() {
  let total = 0;
  for (const k of CATEGORY_NAMES) {
    let cores = 0;
    for (const core of C[k]) cores += slotCombos(core);
    total += OPENERS.length * cores * TAILS.length;
  }
  return total;
}

export const ITEM_POOLS = {
  diamond: ["diamonds", "a diamond vein", "diamond ore", "a cluster of diamonds"],
  debris: ["ancient debris", "some ancient debris", "netherite scrap material"],
  emerald: ["emeralds", "emerald ore", "an emerald cluster"],
};
export const pickItem = (kind) => pick(ITEM_POOLS[kind] || ["loot"]);
