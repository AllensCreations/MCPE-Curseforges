export const ORB_ID = "aln:spirit_orb";

export const FULL_TICKS = 50;
export const BURST_TICK = 50;
export const OVER_TICKS = 70;
export const MIN_HOLD = 4;
export const MAX_ORB_AGE = 120;

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
];

export const MODE_BY_ITEM = new Map(MODES.map((m, i) => [m.itemId, i]));

export const state = {
  tick: 0,
};
