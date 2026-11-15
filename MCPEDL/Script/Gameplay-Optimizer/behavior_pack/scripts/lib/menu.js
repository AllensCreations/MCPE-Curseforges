import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import {
  getSettings,
  saveSettings,
  ITEM_LIMIT_MIN,
  ITEM_LIMIT_MAX,
  ITEM_LIMIT_STEP,
} from "./settings.js";
import { resetItemTracking } from "./itemcap.js";

const PACK_NAME = "Gameplay Optimizer";
const PACK_VERSION = "1.0.0";
const OPEN_ITEM = "minecraft:clock";
const OPERATOR_LEVEL = 2;
const ABOUT_ICON = "textures/items/name_tag";
const TITLE = `§l§6@ALNStudios §e${PACK_NAME}§r (v${PACK_VERSION})`;

const isOperator = (player) =>
  typeof player.isOp === "function" ? player.isOp() : player.playerPermissionLevel === OPERATOR_LEVEL;

const canEdit = (player) => isOperator(player) || world.getAllPlayers().length === 1;

const addOptional = (form, method, ...args) => (typeof form[method] === "function" ? form[method](...args) : form);

const onOff = (flag) => (flag ? "On" : "Off");

function notify(player, message) {
  try {
    player.onScreenDisplay.setActionBar(message);
  } catch (e) {
    return;
  }
}

function statusBody(settings) {
  return [
    `§lDropped item limit:§r ${settings.itemCap ? `On, ${settings.itemLimit} per dimension` : "Off"}`,
    `§lHide effect particles:§r ${onOff(settings.hideParticles)}`,
    `§lPortal preloading:§r ${onOff(settings.portalPreload)}`,
  ].join("\n");
}

async function showAbout(player) {
  const body = [
    "§lCreator:§r ALNStudios",
    `§l${PACK_NAME}:§r version ${PACK_VERSION}`,
    "Limits dropped items, hides potion effect particles and preloads portal destinations.",
    "CurseForge: ALNStudios (allenscreations)",
    "MCPEDL: alnstudios",
    "This is an unofficial community creation, not affiliated with Mojang or Microsoft.",
  ].join("\n");
  const form = new ActionFormData().title("About ALNStudios").body(body).button("Back", ABOUT_ICON);
  try {
    await form.show(player);
  } catch (e) {
    return;
  }
  openMain(player);
}

async function showSettings(player) {
  const settings = getSettings();
  if (!canEdit(player)) {
    notify(player, "§cOnly an operator can change these settings.");
    return openMain(player);
  }
  let form = new ModalFormData().title(`${PACK_NAME} Settings`);
  form = addOptional(form, "header", "Dropped Items");
  form = addOptional(form, "label", `Now: ${settings.itemCap ? "On" : "Off"}`);
  form = form.toggle("Limit dropped items", { defaultValue: settings.itemCap });
  form = addOptional(form, "divider");
  form = form.slider("Items kept per dimension", ITEM_LIMIT_MIN, ITEM_LIMIT_MAX, {
    defaultValue: settings.itemLimit,
    valueStep: ITEM_LIMIT_STEP,
  });
  form = addOptional(form, "divider");
  form = addOptional(form, "header", "Effects");
  form = addOptional(form, "label", `Now: ${onOff(settings.hideParticles)}`);
  form = form.toggle("Hide effect particles", { defaultValue: settings.hideParticles });
  form = addOptional(form, "divider");
  form = addOptional(form, "header", "Portals");
  form = addOptional(form, "label", `Now: ${onOff(settings.portalPreload)}`);
  form = form.toggle("Preload portal destination", { defaultValue: settings.portalPreload });
  form = addOptional(form, "divider");
  form = form.submitButton("Save");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) return openMain(player);
  const values = (res.formValues ?? []).filter((v) => typeof v === "boolean" || typeof v === "number");
  if (values.length !== 4) {
    notify(player, "§cThe settings could not be read.");
    return openMain(player);
  }
  const [itemCap, itemLimit, hideParticles, portalPreload] = values;
  const saved = saveSettings({ itemCap, itemLimit, hideParticles, portalPreload });
  if (!itemCap) resetItemTracking();
  notify(player, saved ? "§aSettings saved." : "§cThe settings could not be saved.");
  return openMain(player);
}

async function openMain(player, attempt = 0) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(statusBody(getSettings()))
    .button("Optimizer Settings")
    .button("About", ABOUT_ICON)
    .button("Exit");
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) {
    if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
      system.runTimeout(() => openMain(player, attempt + 1), 10);
    }
    return;
  }
  if (res.selection === 0) return showSettings(player);
  if (res.selection === 1) return showAbout(player);
}

export function startMenu() {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack?.typeId === OPEN_ITEM && source.isSneaking) openMain(source);
  });
}
