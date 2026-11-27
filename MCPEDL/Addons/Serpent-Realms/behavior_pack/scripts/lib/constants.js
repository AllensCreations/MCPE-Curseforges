export const SNAKE_IDS = {
  VIPER: "aln:forest_viper",
  ANACONDA: "aln:titan_anaconda",
  RACER: "aln:desert_racer",
  PYTHON: "aln:gluttonous_python",
  CORAL: "aln:coral_snake",
};

export const SNAKE_ID_SET = new Set(Object.values(SNAKE_IDS));

export const SWELL_EVENT = "aln:swell";

export const SMALL_PREY = new Set([
  "minecraft:chicken",
  "minecraft:rabbit",
  "minecraft:frog",
  "minecraft:parrot",
  "minecraft:bat",
]);

export const PREY_WINDOW_TICKS = 200;

export const LATCH = {
  durationTicks: 100,
  intervalTicks: 20,
  damage: 2,
  slownessTicks: 40,
  slownessAmplifier: 1,
  maxDistance: 4.5,
};
