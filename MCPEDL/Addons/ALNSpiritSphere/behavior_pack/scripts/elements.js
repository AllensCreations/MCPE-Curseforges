export const ORB_ID = "aln:spirit_orb";

export const FULL_TICKS = 50;
export const BURST_TICK = 50;
export const OVER_TICKS = 62;
export const DECAY_TICKS = 60;
export const MIN_POWER = 0.4;
export const COOLDOWN_TICKS = 60;
export const MIN_HOLD = 4;
export const MAX_ORB_AGE = 6000;

export const MODES = [
  {
    id: "aero",
    sfx: "aln.spirit.aero",
    itemId: "aln:aero_sphere",
    name: "Aero Vortex",
    code: "§b",
    color: { red: 0.45, green: 1.0, blue: 1.0 },
    speed: 1.0,
  },
  {
    id: "blaze",
    sfx: "aln.spirit.blaze",
    itemId: "aln:blaze_sphere",
    name: "Blaze Solar",
    code: "§6",
    color: { red: 1.0, green: 0.6, blue: 0.1 },
    speed: 1.0,
  },
  {
    id: "frost",
    sfx: "aln.spirit.frost",
    itemId: "aln:frost_sphere",
    name: "Frost Nova",
    code: "§9",
    color: { red: 0.55, green: 0.85, blue: 1.0 },
    speed: 1.0,
  },
  {
    id: "storm",
    sfx: "aln.spirit.storm",
    itemId: "aln:storm_sphere",
    name: "Storm Surge",
    code: "§5",
    color: { red: 0.7, green: 0.25, blue: 1.0 },
    speed: 1.4,
  },
  {
    id: "void",
    sfx: "aln.spirit.void",
    itemId: "aln:void_sphere",
    name: "Void Singularity",
    code: "§d",
    color: { red: 0.65, green: 0.05, blue: 0.5 },
    speed: 0.9,
  },
  {
    id: "terra",
    sfx: "aln.spirit.terra",
    itemId: "aln:terra_sphere",
    name: "Terra Quake",
    code: "§e",
    color: { red: 0.8, green: 0.55, blue: 0.25 },
    speed: 0.8,
  },
  {
    id: "toxic",
    sfx: "aln.spirit.toxic",
    itemId: "aln:toxic_sphere",
    name: "Toxic Bloom",
    code: "§2",
    color: { red: 0.45, green: 0.95, blue: 0.2 },
    speed: 1.0,
  },
  {
    id: "gravity",
    sfx: "aln.spirit.gravity",
    itemId: "aln:gravity_sphere",
    name: "Gravity Warp",
    code: "§1",
    color: { red: 0.45, green: 0.4, blue: 1.0 },
    speed: 0.95,
  },
  {
    id: "life",
    sfx: "aln.spirit.life",
    itemId: "aln:life_sphere",
    name: "Life Bloom",
    code: "§c",
    color: { red: 1.0, green: 0.55, blue: 0.7 },
    speed: 1.1,
  },
  {
    id: "chrono",
    sfx: "aln.spirit.chrono",
    itemId: "aln:chrono_sphere",
    name: "Chrono Stasis",
    code: "§3",
    color: { red: 0.4, green: 0.9, blue: 0.95 },
    speed: 0.45,
  },
];

export const MODE_BY_ITEM = new Map(MODES.map((m, i) => [m.itemId, i]));

export const state = {
  tick: 0,
  cooldowns: new Map(),
};

export function powerOf(held) {
  if (held <= FULL_TICKS) return held / FULL_TICKS;
  if (held <= OVER_TICKS) return 1;
  return Math.max(MIN_POWER, 1 - ((1 - MIN_POWER) * (held - OVER_TICKS)) / DECAY_TICKS);
}
