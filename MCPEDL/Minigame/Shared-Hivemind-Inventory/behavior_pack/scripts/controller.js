import { world, system, ItemStack, EntityComponentTypes, GameMode } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const CONTROLLER_ID = "allenscreations:controller";
const STATE_KEY = "game_state";
const OPERATOR_LEVEL = 2;

let config = null;
let registered = false;

const getState = () => {
  const v = world.getDynamicProperty(STATE_KEY);
  return typeof v === "string" ? v : "idle";
};
const setState = (s) => world.setDynamicProperty(STATE_KEY, s);
const isCreative = (player) => player.getGameMode() === GameMode.Creative;
const isHost = (player) => (typeof player.isOp === "function" ? player.isOp() : player.playerPermissionLevel === OPERATOR_LEVEL);
const containerOf = (player) => player.getComponent(EntityComponentTypes.Inventory)?.container;

function hasController(player) {
  const inv = containerOf(player);
  if (!inv) return false;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) return true;
  }
  return false;
}

function giveController(player) {
  if (hasController(player)) return;
  containerOf(player)?.addItem(new ItemStack(CONTROLLER_ID, 1));
}

function consumeController(player) {
  if (isCreative(player)) return;
  const inv = containerOf(player);
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) {
      inv.setItem(i, undefined);
      player.playSound("random.break");
      player.sendMessage("The Controller broke.");
      return;
    }
  }
}

function runStart(player) {
  if (getState() === "running") {
    player.sendMessage("Already running.");
    return;
  }
  setState("running");
  if (config.consumeOnStart) consumeController(player);
  try {
    config.onStart(player);
  } catch (e) {
    setState("idle");
    giveController(player);
    player.sendMessage("The game could not start.");
  }
}

export function endGame() {
  if (getState() !== "running") return;
  setState("ended");
  try {
    config?.onEnd();
  } catch (e) {
    world.sendMessage("The game ended with an error.");
  }
  for (const p of world.getAllPlayers()) if (isHost(p)) giveController(p);
}

async function showHowToPlay(player) {
  const form = new ActionFormData().title("How to play").body(config.howToPlay).button("Back");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (!res.canceled && res.selection === 0) openController(player);
}

async function confirmEnd(player) {
  if (getState() !== "running") {
    player.sendMessage("No game is running.");
    return;
  }
  const form = new ActionFormData()
    .title("End game?")
    .body("This stops the game that is running now.")
    .button("End Game")
    .button("Back");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) return;
  if (res.selection === 0) {
    if (getState() !== "running") {
      player.sendMessage("The game already ended.");
      return;
    }
    world.sendMessage(`${player.name} ended the game.`);
    endGame();
  } else {
    openController(player);
  }
}

export async function openController(player, attempt = 0) {
  const running = getState() === "running";
  const note = running
    ? "End Game stops the current game."
    : config.consumeOnStart
      ? (isCreative(player) ? "Creative: the Controller is kept." : "Start uses up the Controller.")
      : "The Controller is kept.";
  const extras = config.extras(player);
  const form = new ActionFormData()
    .title(config.title)
    .body(`${config.gameInfo}\n\nState: ${getState()}\n${note}`)
    .button(running ? "End Game" : "Start")
    .button("How to play");
  for (const extra of extras) form.button(extra.label);
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) {
    if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
      system.runTimeout(() => openController(player, attempt + 1), 10);
    }
    return;
  }
  if (res.selection === 0) {
    if (running) confirmEnd(player);
    else runStart(player);
  } else if (res.selection === 1) {
    showHowToPlay(player);
  } else {
    extras[res.selection - 2]?.run(player);
  }
}

export function registerController(options) {
  if (registered) return;
  registered = true;
  config = {
    title: options?.title ?? "Controller",
    gameInfo: options?.gameInfo ?? "",
    howToPlay: options?.howToPlay ?? "",
    consumeOnStart: options?.consumeOnStart === true,
    onStart: options?.onStart ?? (() => {}),
    onEnd: options?.onEnd ?? (() => {}),
    extras: options?.extras ?? (() => []),
  };

  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack?.typeId === CONTROLLER_ID && isHost(source)) openController(source);
  });

  system.afterEvents.scriptEventReceive.subscribe(({ id }) => {
    if (id === "allenscreations:end") endGame();
  });

  world.afterEvents.worldLoad.subscribe(() => {
    if (getState() === "running") setState("idle");
    for (const p of world.getAllPlayers()) if (isHost(p)) giveController(p);
  });

  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!isHost(player)) return;
    if (config.consumeOnStart) {
      if (initialSpawn && (isCreative(player) || getState() !== "running")) giveController(player);
      return;
    }
    giveController(player);
  });
}
