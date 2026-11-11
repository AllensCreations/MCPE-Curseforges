import { world, GameMode, Difficulty, TimeOfDay, WeatherType } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const ITEM_ID = "allenscreations:cheat_stick";
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
  const choice = await ask(player, "Choose a cheat category.", ["Gamemode", "Time", "Weather"], false);
  if (choice === 0) await openCategory(player, "Choose a game mode.", GAMEMODES);
  else if (choice === 1) await openCategory(player, "Choose the time of day.", TIMES);
  else if (choice === 2) await openCategory(player, "Choose the weather.", WEATHERS);
}

world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== ITEM_ID) return;
  openMain(source).catch(() => {});
});
