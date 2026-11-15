import { world, system } from "@minecraft/server";

export const ROSTER = [
  { name: "BrickByBrick_Finn", color: "6", type: "Builder" },
  { name: "QuartzQuill", color: "b", type: "Builder" },
  { name: "SpawnShopSteve", color: "e", type: "Builder" },
  { name: "RedstoneRex", color: "c", type: "Redstoner" },
  { name: "ObserverOwen", color: "9", type: "Redstoner" },
  { name: "HopperHaley", color: "3", type: "Redstoner" },
  { name: "ClutchKing_Dax", color: "4", type: "PvPer" },
  { name: "NetheriteNoah", color: "8", type: "PvPer" },
  { name: "CritCaleb", color: "7", type: "PvPer" },
  { name: "SunnySprout", color: "a", type: "Wholesome" },
  { name: "Cozy_Cora", color: "d", type: "Wholesome" },
  { name: "KindKelp", color: "2", type: "Wholesome" },
  { name: "MelonMaddie", color: "e", type: "Wholesome" },
  { name: "ChaosGoblin99", color: "5", type: "Chaotic" },
  { name: "TNT_Tess", color: "c", type: "Chaotic" },
  { name: "LlamaLarry", color: "6", type: "Chaotic" },
  { name: "NoodleNinja_X", color: "9", type: "Chaotic" },
  { name: "PhantomPax", color: "3", type: "Chaotic" },
  { name: "ObsidianOllie", color: "8", type: "Builder" },
  { name: "CopperCleo", color: "6", type: "Builder" },
  { name: "CathedralCal", color: "b", type: "Builder" },
  { name: "LanternLeo", color: "e", type: "Builder" },
  { name: "TerracottaTess", color: "6", type: "Builder" },
  { name: "ComparatorCass", color: "9", type: "Redstoner" },
  { name: "PistonPete", color: "3", type: "Redstoner" },
  { name: "ClockworkCal", color: "7", type: "Redstoner" },
  { name: "SorterSid", color: "b", type: "Redstoner" },
  { name: "TridentTobi", color: "3", type: "PvPer" },
  { name: "ShieldSage", color: "8", type: "PvPer" },
  { name: "BladeBrooke", color: "c", type: "PvPer" },
  { name: "ArrowAsh", color: "7", type: "PvPer" },
  { name: "AxolotlAmy", color: "d", type: "Wholesome" },
  { name: "MooshroomMia", color: "c", type: "Wholesome" },
  { name: "HoneyHana", color: "e", type: "Wholesome" },
  { name: "BeaconBen", color: "b", type: "Wholesome" },
  { name: "PiglinPete", color: "6", type: "Chaotic" },
  { name: "WardenWill", color: "5", type: "Chaotic" },
  { name: "SculkSam", color: "2", type: "Chaotic" },
  { name: "EndermanEli", color: "5", type: "Chaotic" },
  { name: "GlitchGus", color: "9", type: "Chaotic" },
];
export const MIN_ONLINE = 6;
export const MAX_ONLINE = 14;
const SAVE_KEY = "alnstudios:living_smp_online";

const online = new Set();

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function formatChat(bot, text) {
  return `<§${bot.color}${bot.name}§r> ${text}`;
}

export function isOnline(bot) {
  return online.has(bot.name);
}

export function getOnline() {
  return ROSTER.filter((b) => online.has(b.name));
}

export function pickOnline(n, excludeNames = []) {
  return shuffle(getOnline().filter((b) => !excludeNames.includes(b.name))).slice(0, n);
}

function save() {
  try {
    world.setDynamicProperty(SAVE_KEY, JSON.stringify([...online]));
  } catch (e) {}
}

function load() {
  try {
    const raw = world.getDynamicProperty(SAVE_KEY);
    if (typeof raw === "string") {
      const names = JSON.parse(raw);
      for (const n of names) if (ROSTER.some((b) => b.name === n)) online.add(n);
    }
  } catch (e) {}
}

function broadcast(msg) {
  world.sendMessage(msg);
}

function toggleOne() {
  const count = online.size;
  let join;
  if (count <= MIN_ONLINE) join = true;
  else if (count >= MAX_ONLINE) join = false;
  else join = Math.random() < 0.5;

  const pool = join
    ? ROSTER.filter((b) => !online.has(b.name))
    : ROSTER.filter((b) => online.has(b.name));
  if (pool.length === 0) return;
  const bot = pool[rand(0, pool.length - 1)];
  if (join) online.add(bot.name);
  else online.delete(bot.name);
  broadcast(`§e${bot.name} ${join ? "joined" : "left"} the game`);
  save();
}

export function startSessionSimulator() {
  load();
  if (online.size < MIN_ONLINE || online.size > MAX_ONLINE) {
    online.clear();
    for (const b of shuffle(ROSTER).slice(0, rand(8, 11))) online.add(b.name);
    save();
  }
  const schedule = () => {
    system.runTimeout(() => {
      if (world.getAllPlayers().length > 0) toggleOne();
      schedule();
    }, rand(1200, 3600));
  };
  schedule();
}
