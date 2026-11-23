export const FOCUS_ID = "aln:spirit_focus";
export const ORB_ID = "aln:spirit_orb";

export const FULL_TICKS = 50;
export const BURST_TICK = 50;
export const OVER_TICKS = 70;
export const MIN_HOLD = 4;
export const MAX_ORB_AGE = 120;

export const MODES = [
  {
    id: "aero",
    name: "Aero Vortex",
    code: "§b",
    color: { red: 0.45, green: 1.0, blue: 1.0 },
    speed: 1.0,
    lore: "Wind spirals. Heavy knockback and a clean blast without fire.",
  },
  {
    id: "blaze",
    name: "Blaze Solar",
    code: "§6",
    color: { red: 1.0, green: 0.6, blue: 0.1 },
    speed: 1.0,
    lore: "Orange-gold plasma. Ghast-style blast that sets the area on fire.",
  },
  {
    id: "frost",
    name: "Frost Nova",
    code: "§9",
    color: { red: 0.55, green: 0.85, blue: 1.0 },
    speed: 1.0,
    lore: "Ice crystals. Freezes nearby water and applies heavy Slowness.",
  },
  {
    id: "storm",
    name: "Storm Surge",
    code: "§5",
    color: { red: 0.7, green: 0.25, blue: 1.0 },
    speed: 1.4,
    lore: "Purple lightning. Fastest orb, strikes lightning on impact.",
  },
  {
    id: "void",
    name: "Void Singularity",
    code: "§d",
    color: { red: 0.65, green: 0.05, blue: 0.5 },
    speed: 0.9,
    lore: "Dark magenta core. Pulls nearby mobs in while it flies.",
  },
];

export const state = {
  tick: 0,
  modes: new Map(),
};

export function modeIndexOf(player) {
  return state.modes.get(player.id) ?? 0;
}
