import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import { PACK_NAME, PACK_VERSION } from "./info.js";
import { FEATURES, isOn, applyValues, activeNames } from "./store.js";
import { others, isFriend, applyFriends, friendNames } from "./friends.js";
import { TUNING, tune, applyTuning, resetTuning } from "./tuning.js";
import { spawnDummy } from "./extras.js";

const ABOUT_ICON = "textures/items/name_tag";
const EXIT_ICON = "textures/items/door_wood";

const plain = (s) => String(s ?? "").replace(/§./g, "");
const bold = (s) => `§l${plain(s)}§r`;
const mainTitle = () => `§l§6@ALNStudios §e${PACK_NAME}§r (v${PACK_VERSION})`;
const wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));
const opt = (form, name, ...args) => (typeof form[name] === "function" ? form[name](...args) : form);

export function tell(player, color, text) {
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
    "A cursor-shaped item that opens a menu of PVP toggles.",
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
    openHub(player);
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

async function openFriends(player) {
  const shown = others(player).slice(0, 30);
  if (!shown.length) {
    tell(player, "§e", "No other players are online.");
    openHub(player);
    return;
  }
  const saved = friendNames(player);
  let form = new ModalFormData().title(bold("Friends"));
  form = opt(form, "header", bold(PACK_NAME));
  form = opt(form, "label", bold("Tick a player to make them a friend. Aura Mode and Bow Aimbot skip your friends."));
  form = opt(form, "label", bold(saved.length ? `Saved friends: ${saved.join(", ")}` : "No friends saved yet."));
  form = opt(form, "divider");
  for (const other of shown) form = form.toggle(bold(other.name), { defaultValue: isFriend(player, other) });
  form = opt(form, "submitButton", bold("Apply"));
  const res = await present(form, player);
  if (!res) return;
  if (res.canceled) {
    openHub(player);
    return;
  }
  const values = (res.formValues ?? []).filter((v) => typeof v === "boolean");
  if (values.length !== shown.length) {
    tell(player, "§c", "The friends could not be read.");
    return;
  }
  applyFriends(player, shown, values);
  tell(player, "§a", `${friendNames(player).length} friends saved.`);
}

async function openTuning(player) {
  let form = new ModalFormData().title(bold("Tuning"));
  form = opt(form, "header", bold(PACK_NAME));
  form = opt(form, "label", bold("Drag the sliders and pick the options. Every player keeps their own values."));
  form = opt(form, "divider");
  for (const t of TUNING) {
    form = t.choices
      ? form.dropdown(bold(t.name), t.choices.map((c) => bold(c)), { defaultValueIndex: tune(player, t.id) })
      : form.slider(bold(t.name), t.min, t.max, { defaultValue: tune(player, t.id), valueStep: t.step });
  }
  form = opt(form, "divider");
  form = form.toggle(bold("Reset everything to the defaults"), { defaultValue: false });
  form = opt(form, "submitButton", bold("Apply"));
  const res = await present(form, player);
  if (!res) return;
  if (res.canceled) {
    openHub(player);
    return;
  }
  const values = res.formValues ?? [];
  const numbers = values.filter((v) => typeof v === "number");
  const flags = values.filter((v) => typeof v === "boolean");
  if (numbers.length !== TUNING.length) {
    tell(player, "§c", "The sliders could not be read.");
    return;
  }
  if (flags[0] === true) {
    resetTuning(player);
    tell(player, "§a", "Tuning reset to the defaults.");
    return;
  }
  applyTuning(player, numbers);
  tell(player, "§a", "Tuning saved.");
}

async function openHub(player) {
  const body = `${activeNames(player).length} of ${FEATURES.length} toggles on. ${friendNames(player).length} friends saved.`;
  const form = new ActionFormData()
    .title(bold("Combat Menu"))
    .body(bold(body))
    .button(bold("Combat Toggles"))
    .button(bold("Friends"))
    .button(bold("Tuning"))
    .button(bold("Practice Dummy"))
    .button(bold("Back"), EXIT_ICON);
  const res = await present(form, player);
  if (!res) return;
  if (res.canceled || res.selection === 4) {
    openMain(player);
    return;
  }
  if (res.selection === 3) {
    const ok = spawnDummy(player);
    tell(player, ok ? "§a" : "§c", ok ? "Practice Dummy spawned. It stays for 2 minutes." : "The Practice Dummy could not spawn here.");
    return;
  }
  [openToggles, openFriends, openTuning][res.selection](player);
}

export async function openMain(player) {
  const active = activeNames(player);
  const body = active.length ? `On: ${active.join(", ")}` : "No toggles are on.";
  const form = new ActionFormData()
    .title(mainTitle())
    .body(bold(body))
    .button(bold("Combat Menu"))
    .button(bold("About"), ABOUT_ICON)
    .button(bold("Exit"), EXIT_ICON);
  const res = await present(form, player);
  if (!res || res.canceled) return;
  if (res.selection === 0) openHub(player);
  else if (res.selection === 1) openAbout(player);
}
