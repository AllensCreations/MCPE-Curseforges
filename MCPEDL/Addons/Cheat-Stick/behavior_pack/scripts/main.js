import { world, GameMode, Difficulty, TimeOfDay, WeatherType } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const ITEM_ID = "minecraft:stick";
const VERSION = "1.0.4";
const TITLE = "§l§6@ALNStudios §eCheatstick §7(" + VERSION + ")";
const PREFIX = "§l§6@ALNStudios §eCheatstick§r §8»§r §a";
const SLOT_COUNT = 5;
const EFFECT_TICKS = 12000;
const CLEAR_RADIUS = 32;

// Private to the player who used the Stick: shown on that player's action bar only.
function say(player, text) {
  player.onScreenDisplay.setActionBar(PREFIX + text);
}

function saveSpot(key, player) {
  const { x, y, z } = player.location;
  world.setDynamicProperty(
    key + player.id,
    JSON.stringify({ x, y, z, dimension: player.dimension.id })
  );
}

function readSpot(key, player) {
  const raw = world.getDynamicProperty(key + player.id);
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function goToSpot(player, spot) {
  player.teleport(
    { x: spot.x, y: spot.y, z: spot.z },
    { dimension: world.getDimension(spot.dimension) }
  );
}

const DIMENSION_NAMES = {
  "minecraft:overworld": "Overworld",
  "minecraft:nether": "Nether",
  "minecraft:the_end": "The End",
};

function describeSpot(spot) {
  return (
    Math.floor(spot.x) + ", " + Math.floor(spot.y) + ", " + Math.floor(spot.z) +
    " (" + (DIMENSION_NAMES[spot.dimension] ?? spot.dimension) + ")"
  );
}

function slotKey(slot) {
  return "cheatstick:slot" + slot + ":";
}

function effectOption(label, effectId, amplifier) {
  return {
    label,
    run(player) {
      player.addEffect(effectId, EFFECT_TICKS, { amplifier, showParticles: false });
      say(player, label + " for 10 minutes.");
    },
  };
}

const GAMEMODES = [
  {
    label: "Survival",
    run(player) {
      player.setGameMode(GameMode.Survival);
      say(player, "Game mode: Survival.");
    },
  },
  {
    label: "Creative",
    run(player) {
      player.setGameMode(GameMode.Creative);
      say(player, "Game mode: Creative.");
    },
  },
  {
    label: "Hardcore",
    run(player) {
      player.setGameMode(GameMode.Survival);
      world.setDifficulty(Difficulty.Hard);
      say(player, "Hardcore style: Survival on Hard difficulty.");
    },
  },
];

const TIMES = [
  ["Day", TimeOfDay.Day],
  ["Noon", TimeOfDay.Noon],
  ["Sunset", TimeOfDay.Sunset],
  ["Night", TimeOfDay.Night],
  ["Midnight", TimeOfDay.Midnight],
  ["Sunrise", TimeOfDay.Sunrise],
].map(([label, value]) => ({
  label,
  run(player) {
    world.setTimeOfDay(value);
    say(player, "Time set to " + label + ".");
  },
}));

const WEATHERS = [
  ["Clear", WeatherType.Clear],
  ["Rain", WeatherType.Rain],
  ["Thunder", WeatherType.Thunder],
].map(([label, value]) => ({
  label,
  run(player) {
    player.dimension.setWeather(value);
    say(player, "Weather set to " + label + ".");
  },
}));

const SURVIVAL = [
  {
    label: "Heal & Feed",
    run(player) {
      player.getComponent("minecraft:health")?.resetToMaxValue();
      player.addEffect("saturation", 20, { amplifier: 20, showParticles: false });
      say(player, "Health and hunger restored.");
    },
  },
  {
    label: "Toggle Keep Inventory",
    run(player) {
      const next = !world.gameRules.keepInventory;
      world.gameRules.keepInventory = next;
      say(player, "Keep Inventory is now " + (next ? "ON" : "OFF") + " for the world.");
    },
  },
  {
    label: "Set Spawn Here",
    run(player) {
      const { x, y, z } = player.location;
      player.setSpawnPoint({
        dimension: player.dimension,
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
      });
      say(player, "Spawn point set to your current position.");
    },
  },
  {
    label: "Clear Nearby Hostile Mobs",
    run(player) {
      let removed = 0;
      for (const mob of player.dimension.getEntities({
        location: player.location,
        maxDistance: CLEAR_RADIUS,
        families: ["monster"],
      })) {
        try {
          mob.remove();
          removed++;
        } catch {}
      }
      say(player, "Removed " + removed + " hostile mobs.");
    },
  },
];

const EFFECTS = [
  effectOption("Haste", "haste", 1),
  effectOption("Speed", "speed", 1),
  effectOption("Night Vision", "night_vision", 0),
  effectOption("Jump Boost", "jump_boost", 1),
  effectOption("Water Breathing", "water_breathing", 0),
  effectOption("Fire Resistance", "fire_resistance", 0),
  effectOption("Regeneration", "regeneration", 0),
];

const TRAVEL = [
  {
    label: "Back to Death Point",
    run(player) {
      const spot = readSpot("cheatstick:death:", player);
      if (!spot) {
        say(player, "No death point saved yet.");
        return;
      }
      goToSpot(player, spot);
      say(player, "Teleported to your last death point.");
    },
  },
  {
    label: "Save",
    run: (player) => openSlots(player, true),
  },
  {
    label: "Load",
    run: (player) => openSlots(player, false),
  },
];

async function openSlots(player, saving) {
  const labels = [];
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    const spot = readSpot(slotKey(slot), player);
    labels.push("Slot " + slot + ": " + (spot ? describeSpot(spot) : "Empty"));
  }
  const choice = await ask(
    player,
    saving ? "Choose a slot to save your position in." : "Choose a slot to teleport to.",
    labels,
    true
  );
  if (choice < 0) return;
  if (choice === SLOT_COUNT) {
    await openCategory(player, "Choose a travel helper.", TRAVEL);
    return;
  }
  const slot = choice + 1;
  if (saving) {
    saveSpot(slotKey(slot), player);
    say(player, "Saved slot " + slot + ": " + describeSpot(readSpot(slotKey(slot), player)));
    return;
  }
  const spot = readSpot(slotKey(slot), player);
  if (!spot) {
    say(player, "Slot " + slot + " is empty.");
    return;
  }
  goToSpot(player, spot);
  say(player, "Loaded slot " + slot + ": " + describeSpot(spot));
}

async function ask(player, body, labels, withBack) {
  const form = new ActionFormData().title(TITLE).body(body);
  for (const label of labels) form.button(label);
  if (withBack) form.button("Back");
  const response = await form.show(player);
  if (response.canceled) return -1;
  return response.selection;
}

async function openCategory(player, body, options) {
  const choice = await ask(
    player,
    body,
    options.map((option) => option.label),
    true
  );
  if (choice < 0) return;
  if (choice === options.length) {
    await openMain(player);
    return;
  }
  await options[choice].run(player);
}

async function openMain(player) {
  const choice = await ask(
    player,
    "Choose a cheat category.",
    ["Gamemode", "Time", "Weather", "Survival", "Effects", "Travel"],
    false
  );
  if (choice === 0) await openCategory(player, "Choose a game mode.", GAMEMODES);
  else if (choice === 1) await openCategory(player, "Choose the time of day.", TIMES);
  else if (choice === 2) await openCategory(player, "Choose the weather.", WEATHERS);
  else if (choice === 3) await openCategory(player, "Choose a survival helper.", SURVIVAL);
  else if (choice === 4) await openCategory(player, "Choose an effect (10 minutes).", EFFECTS);
  else if (choice === 5) await openCategory(player, "Choose a travel helper.", TRAVEL);
}

const menuOpen = new Set();

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== ITEM_ID) return;
  if (menuOpen.has(source.id)) return;
  menuOpen.add(source.id);
  openMain(source)
    .catch(() => {})
    .finally(() => menuOpen.delete(source.id));
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  if (deadEntity.typeId !== "minecraft:player") return;
  try {
    saveSpot("cheatstick:death:", deadEntity);
  } catch {}
});

