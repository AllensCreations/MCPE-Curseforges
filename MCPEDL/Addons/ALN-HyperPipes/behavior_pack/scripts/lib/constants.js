export const PIPE_STANDARD = "aln:pipe_standard";
export const PIPE_RECEIVER = "aln:pipe_receiver";
export const PIPE_FILTER = "aln:pipe_filter";
export const PIPE_JUNCTION = "aln:pipe_junction";
export const WRENCH_ID = "aln:pipe_wrench";
export const STATE_OUT = "aln:out";

export const FACES = ["up", "north", "south", "east", "west", "down"];

export const FACE_LABELS = {
  up: "Top",
  north: "North",
  south: "South",
  east: "East",
  west: "West",
  down: "Down",
};

export const OFFSETS = {
  up: { x: 0, y: 1, z: 0 },
  down: { x: 0, y: -1, z: 0 },
  north: { x: 0, y: 0, z: -1 },
  south: { x: 0, y: 0, z: 1 },
  east: { x: 1, y: 0, z: 0 },
  west: { x: -1, y: 0, z: 0 },
};

export const OPPOSITE = {
  up: "down",
  down: "up",
  north: "south",
  south: "north",
  east: "west",
  west: "east",
};

export const SIDES = {
  north: ["east", "west"],
  south: ["east", "west"],
  east: ["north", "south"],
  west: ["north", "south"],
  up: ["east", "west"],
  down: ["east", "west"],
};

export const STEP_TICKS = 3;
export const PULL_EVERY = 4;
export const SWEEP_EVERY = 200;
export const MAX_BATCH = 4;
export const FURNACE_SLOT_INPUT = 0;
export const FURNACE_SLOT_FUEL = 1;
export const FURNACE_SLOT_OUTPUT = 2;

export const FUEL_IDS = [
  "minecraft:coal",
  "minecraft:charcoal",
  "minecraft:coal_block",
  "minecraft:blaze_rod",
  "minecraft:dried_kelp_block",
  "minecraft:stick",
];

export const PROP_PREFIX = "hp_";

export const PIPE_TYPES = [PIPE_STANDARD, PIPE_RECEIVER, PIPE_FILTER, PIPE_JUNCTION];

export function isPipeId(typeId) {
  return PIPE_TYPES.includes(typeId);
}

export function isFurnaceId(typeId) {
  return typeof typeId === "string" && (typeId.includes("furnace") || typeId.includes("smoker"));
}

export function prettyName(typeId) {
  const raw = String(typeId).split(":").pop().replace(/_/g, " ");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
