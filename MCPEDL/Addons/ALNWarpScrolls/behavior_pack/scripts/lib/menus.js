import { system } from "@minecraft/server";
import { ModalFormData, ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { MAX_NAME, DIM_STYLE, FALLBACK_STYLE } from "./config.js";

function wait(ticks) {
  return new Promise((resolve) => system.runTimeout(resolve, ticks));
}

function cleanName(value) {
  return value
    .replace(/§./g, "")
    .replace(/[\u0000-\u001f]/g, "")
    .trim()
    .slice(0, MAX_NAME)
    .trim();
}

async function showWhenFree(player, makeForm) {
  for (let attempt = 0; attempt < 12; attempt++) {
    const response = await makeForm().show(player);
    if (!response.canceled) return response;
    if (response.cancelationReason !== FormCancelationReason.UserBusy) return undefined;
    await wait(10);
  }
  return undefined;
}

export async function askGateName(player, fallback) {
  try {
    const response = await showWhenFree(player, () =>
      new ModalFormData().title("Name Your Beacon Gate").textField("Waypoint name", "Home Base")
    );
    const value = response && response.formValues ? response.formValues[0] : "";
    const name = typeof value === "string" ? cleanName(value) : "";
    return name || fallback;
  } catch {
    return fallback;
  }
}

export async function chooseGate(player, gates) {
  try {
    const response = await showWhenFree(player, () => {
      const form = new ActionFormData().title("Warp Scroll").body("Choose a Beacon Gate to warp to.");
      for (const gate of gates) {
        const style = DIM_STYLE[gate.d] || FALLBACK_STYLE;
        form.button(style.color + gate.n + "\n§r§8" + style.label);
      }
      return form;
    });
    return response ? response.selection : undefined;
  } catch {
    return undefined;
  }
}
