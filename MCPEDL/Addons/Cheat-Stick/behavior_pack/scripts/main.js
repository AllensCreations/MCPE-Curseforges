import { world, GameMode, Difficulty, TimeOfDay, WeatherType } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const ITEM_ID = "minecraft:stick";
const TITLE = "@ALNStudio";
const PREFIX = "§b@ALNStudio§r ";

function say(player, text) {
  player.sendMessage(PREFIX + text);
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
    label: "Night Vision",
    run(player) {
      player.addEffect("night_vision", 12000, { showParticles: false });
      say(player, "Night Vision for 10 minutes.");
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
    label: "Return to Spawn",
    run(player) {
      const spawn = player.getSpawnPoint();
      if (spawn) {
        player.teleport(
          { x: spawn.x + 0.5, y: spawn.y, z: spawn.z + 0.5 },
          { dimension: spawn.dimension }
        );
        say(player, "Teleported to your spawn point.");
      } else {
        player.teleport(world.getDefaultSpawnLocation(), { dimension: world.getDimension("overworld") });
        say(player, "Teleported to the world spawn.");
      }
    },
  },
];

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
  options[choice].run(player);
}

async function openMain(player) {
  const choice = await ask(player, "Choose a cheat category.", ["Gamemode", "Time", "Weather", "Survival"], false);
  if (choice === 0) await openCategory(player, "Choose a game mode.", GAMEMODES);
  else if (choice === 1) await openCategory(player, "Choose the time of day.", TIMES);
  else if (choice === 2) await openCategory(player, "Choose the weather.", WEATHERS);
  else if (choice === 3) await openCategory(player, "Choose a survival helper.", SURVIVAL);
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
