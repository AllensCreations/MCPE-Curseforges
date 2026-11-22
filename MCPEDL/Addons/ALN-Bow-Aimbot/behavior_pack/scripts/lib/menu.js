import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";
import { PACK_NAME, PACK_VERSION } from "./info.js";
import { FEATURES, isOn, applyValues, activeNames } from "./store.js";
import { others, isFriend, applyFriends, friendNames } from "./friends.js";
import { TUNING, tune, applyTuning, resetTuning } from "./tuning.js";

const ABOUT_ICON = "textures/items/name_tag";
const EXIT_ICON = "textures/items/door_wood";

const plain = (s) => String(s ?? "").replace(/§./g, "");
const bold = (s) => `§l${plain(s)}§r`;
const mainTitle = () => `§l§6@ALNStudios §e${PACK_NAME}§r (v${PACK_VERSION})`;
const note = (s) => `§7${plain(s)}§r`;
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
    "A bow-and-arrow item that opens the Bow Aimbot menu.",
    "CurseForge: allenscreations",
    "MCPEDL: alnstudios",
    "Not affiliated with Mojang.",
  ].join("\n");
  const form = new ActionFormData().title(bold("About ALNStudios")).body(bold(body)).button(bold("Back"));
  const res = await present(form, player);
  if (res && !res.canceled) openMain(player);
}

const LAYOUT = [
  {
    title: "Bow Aimbot",
    items: [["f", "bowAimbot"], ["t", "aimRange"], ["t", "aimZoom"], ["t", "bowZoom"], ["f", "targetHighlight"], ["t", "aimCircle"], ["t", "aimHostile"], ["t", "aimNeutral"], ["t", "aimPassive"], ["t", "aimPlayers"]],
  },
];

async function openSettings(player) {
  let form = new ModalFormData().title(bold("Bow Aimbot Settings"));
  form = opt(form, "header", bold(PACK_NAME));
  form = opt(form, "label", bold(`${activeNames(player).length} of ${FEATURES.length} on`));
  const schema = [];
  for (const group of LAYOUT) {
    form = opt(form, "divider");
    form = opt(form, "header", bold(group.title));
    for (const [kind, id] of group.items) {
      if (kind === "f") {
        const f = FEATURES.find((x) => x.id === id);
        form = form.toggle(bold(f.name), { defaultValue: isOn(player, id) });
        form = opt(form, "label", note(f.info));
      } else {
        const t = TUNING.find((x) => x.id === id);
        form = t.choices
          ? form.dropdown(bold(t.name), t.choices.map((c) => bold(c)), { defaultValueIndex: tune(player, id) })
          : form.slider(bold(t.name), t.min, t.max, { defaultValue: tune(player, id), valueStep: t.step });
      }
      schema.push([kind, id]);
    }
  }
  form = opt(form, "divider");
  form = opt(form, "submitButton", bold("Apply"));
  const res = await present(form, player);
  if (!res) return;
  if (res.canceled) {
    openHub(player);
    return;
  }
  const values = (res.formValues ?? []).filter((v) => typeof v === "boolean" || typeof v === "number");
  if (values.length !== schema.length) {
    tell(player, "§c", "The settings could not be read.");
    return;
  }
  const flags = new Map();
  const nums = new Map();
  schema.forEach(([kind, id], i) => (kind === "f" ? flags : nums).set(id, values[i]));
  applyValues(player, FEATURES.map((f) => (flags.has(f.id) ? flags.get(f.id) === true : isOn(player, f.id))));
  applyTuning(player, TUNING.map((t) => (nums.has(t.id) ? nums.get(t.id) : tune(player, t.id))));
  tell(player, "§a", `${activeNames(player).length} of ${FEATURES.length} on. Settings saved.`);
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
  form = opt(form, "label", bold("Tick a player to make them a friend. Bow Aimbot skips your friends."));
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

const FOVS = Array.from({ length: 81 }, (_, i) => 30 + i);

async function openTuning(player) {
  const fov = TUNING.find((t) => t.id === "screenFov");
  let form = new ModalFormData().title(bold("Tuning"));
  form = opt(form, "header", bold(PACK_NAME));
  form = opt(form, "label", bold("Set your FOV to the Field of View in Settings > Video so the aim circle matches. Nothing saves unless Confirm changes is on."));
  form = opt(form, "divider");
  form = form.dropdown(bold(fov.name), FOVS.map((n) => bold(String(n))), { defaultValueIndex: tune(player, "screenFov") - 30 });
  form = opt(form, "divider");
  form = form.toggle(bold("Confirm changes"), { defaultValue: false });
  form = form.toggle(bold("Reset all tuning to the defaults"), { defaultValue: false });
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
  if (numbers.length !== 1 || flags.length !== 2) {
    tell(player, "§c", "The tuning could not be read.");
    return;
  }
  if (flags[0] !== true) {
    tell(player, "§e", "Nothing changed. Turn on Confirm changes to save.");
    return;
  }
  if (flags[1] === true) {
    resetTuning(player);
    tell(player, "§a", "Tuning reset to the defaults.");
    return;
  }
  applyTuning(player, TUNING.map((t) => (t.id === "screenFov" ? FOVS[numbers[0]] : tune(player, t.id))));
  tell(player, "§a", `FOV set to ${FOVS[numbers[0]]}.`);
}

async function openHub(player) {
  const body = `${activeNames(player).length} of ${FEATURES.length} toggles on. ${friendNames(player).length} friends saved.`;
  const form = new ActionFormData()
    .title(bold("Bow Aimbot Menu"))
    .body(bold(body))
    .button(bold("Bow Aimbot Settings"))
    .button(bold("Friends"))
    .button(bold("Tuning"))
    .button(bold("Back"), EXIT_ICON);
  const res = await present(form, player);
  if (!res) return;
  if (res.canceled || res.selection === 3) {
    openMain(player);
    return;
  }
  [openSettings, openFriends, openTuning][res.selection](player);
}

export async function openMain(player) {
  const active = activeNames(player);
  const body = active.length ? `On: ${active.join(", ")}` : "No toggles are on.";
  const form = new ActionFormData()
    .title(mainTitle())
    .body(bold(body))
    .button(bold("Bow Aimbot Menu"))
    .button(bold("About"), ABOUT_ICON)
    .button(bold("Exit"), EXIT_ICON);
  const res = await present(form, player);
  if (!res || res.canceled) return;
  if (res.selection === 0) openHub(player);
  else if (res.selection === 1) openAbout(player);
}
