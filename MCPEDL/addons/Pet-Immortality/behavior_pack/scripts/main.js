import { world, system } from "@minecraft/server";

const KEY = "ac_pet_immortality";
const TYPES = {
  "1": "minecraft:cat",
  "2": "minecraft:wolf",
  "3": "minecraft:parrot",
  "4": "minecraft:horse"
};
const DEFAULTS = {
  "1": false,
  "2": false,
  "3": false,
  "4": false,
  "5": false
};

let settings = { ...DEFAULTS };

function loadSettings() {
  try {
    const saved = world.getDynamicProperty(KEY);
    if (typeof saved === "string") {
      const parsed = JSON.parse(saved);
      settings = { ...DEFAULTS, ...parsed };
    }
  } catch {}
}

function saveSettings() {
  world.setDynamicProperty(KEY, JSON.stringify(settings));
}

function isTamed(entity) {
  try {
    const component = entity.getComponent("minecraft:is_tamed");
    if (component) return true;
  } catch {}
  try {
    const tameable = entity.getComponent("minecraft:tameable");
    if (tameable && tameable.isTamed) return true;
  } catch {}
  return false;
}

function isProtected(entity) {
  if (!entity || !entity.isValid) return false;
  const type = entity.typeId;
  for (const [key, targetType] of Object.entries(TYPES)) {
    if (settings[key] && type === targetType) return true;
  }
  return settings["5"] && isTamed(entity);
}

function restoreHealth(entity) {
  if (!isProtected(entity)) return;
  try {
    const health = entity.getComponent("minecraft:health");
    if (health && health.currentValue < health.effectiveMax) {
      health.setCurrentValue(health.effectiveMax);
    }
  } catch {}
}

function statusText() {
  return [
    "Pet Immortality",
    `1 Cat: ${settings["1"] ? "ON" : "OFF"}`,
    `2 Wolf: ${settings["2"] ? "ON" : "OFF"}`,
    `3 Parrot: ${settings["3"] ? "ON" : "OFF"}`,
    `4 Horse: ${settings["4"] ? "ON" : "OFF"}`,
    `5 All tamed pets: ${settings["5"] ? "ON" : "OFF"}`,
    "Use !pets <1-5> <on|off> or !pets status"
  ].join("\n");
}

world.afterEvents.worldLoad.subscribe(() => {
  loadSettings();
});

world.afterEvents.chatSend.subscribe((event) => {
  const message = event.message.trim().toLowerCase();
  if (!message.startsWith("!pets")) return;

  event.cancel = true;
  const player = event.sender;
  const parts = message.split(/\s+/);

  if (parts.length === 1 || parts[1] === "status" || parts[1] === "help") {
    player.sendMessage(statusText());
    return;
  }

  const option = parts[1];
  const value = parts[2];

  if (!["1", "2", "3", "4", "5"].includes(option) ||
      !["on", "off", "toggle"].includes(value)) {
    player.sendMessage("Use !pets <1-5> <on|off|toggle> or !pets status");
    return;
  }

  settings[option] = value === "toggle" ? !settings[option] : value === "on";
  saveSettings();
  player.sendMessage(statusText());
});

world.afterEvents.entityHurt.subscribe((event) => {
  restoreHealth(event.hurtEntity);
});

system.runInterval(() => {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      const dimension = world.getDimension(dimensionId);
      for (const entity of dimension.getEntities()) {
        if (isProtected(entity)) restoreHealth(entity);
      }
    } catch {}
  }
}, 1);
