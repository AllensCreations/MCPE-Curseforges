import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import { PACK_NAME, PACK_VERSION } from "./info.js";
import { FEATURES, isOn, applyValues, activeNames } from "./store.js";

const ABOUT_ICON = "textures/items/name_tag";
const EXIT_ICON = "textures/items/door_wood";

const plain = (s) => String(s ?? "").replace(/§./g, "");
const bold = (s) => `§l${plain(s)}§r`;
const mainTitle = () => `§l§6@ALNStudios §e${PACK_NAME}§r (v${PACK_VERSION})`;
const wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));
const opt = (form, name, ...args) => (typeof form[name] === "function" ? form[name](...args) : form);

function tell(player, color, text) {
  try {
    player.onScreenDisplay.setActionBar(`${color}${text}`);
  } catch (e) {}
}

async function present(form, player) {
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try {
      res = await form.show(player);
    } catch (e) {
      return undefined;
    }
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) {
      await wait(10);
      continue;
    }
    return res;
  }
  return undefined;
}

async function openAbout(player) {
  const body = [
    "Creator: ALNStudios",
    `${PACK_NAME} v${PACK_VERSION}`,
    "A pointer item that opens a menu of PVP toggles.",
    "CurseForge: allenscreations",
    "MCPEDL: alnstudios",
    "Not affiliated with Mojang.",
  ].join("\n");
  const form = new ActionFormData().title(bold("About ALNStudios")).body(bold(body)).button(bold("Back"));
  const res = await present(form, player);
  if (res && !res.canceled) openMain(player);
}

async function openToggles(player) {
  let form = new ModalFormData().title(bold("Combat Toggles"));
  form = opt(form, "header", bold(PACK_NAME));
  form = opt(form, "label", bold(`${activeNames(player).length} of ${FEATURES.length} on`));
  form = opt(form, "divider");
  for (const feature of FEATURES) {
    form = form.toggle(bold(feature.name), { defaultValue: isOn(player, feature.id) });
    form = opt(form, "label", bold(feature.info));
    form = opt(form, "divider");
  }
  form = opt(form, "submitButton", bold("Apply"));
  const res = await present(form, player);
  if (!res) return;
  if (res.canceled) {
    openMain(player);
    return;
  }
  const values = (res.formValues ?? []).filter((v) => typeof v === "boolean");
  if (values.length !== FEATURES.length) {
    tell(player, "§c", "The toggles could not be read.");
    return;
  }
  applyValues(player, values);
  const count = values.filter((v) => v).length;
  tell(player, "§a", `${count} of ${FEATURES.length} toggles on.`);
}

export async function openMain(player) {
  const active = activeNames(player);
  const body = active.length ? `On: ${active.join(", ")}` : "No toggles are on.";
  const form = new ActionFormData()
    .title(mainTitle())
    .body(bold(body))
    .button(bold("Combat Toggles"))
    .button(bold("About"), ABOUT_ICON)
    .button(bold("Exit"), EXIT_ICON);
  const res = await present(form, player);
  if (!res || res.canceled) return;
  if (res.selection === 0) openToggles(player);
  else if (res.selection === 1) openAbout(player);
}
