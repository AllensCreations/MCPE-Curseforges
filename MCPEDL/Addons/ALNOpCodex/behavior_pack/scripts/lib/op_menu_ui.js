import { system } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { deliverKit } from "./op_item_distributor.js";

const TITLE = "§c§lALN:OpCodex";

async function show(player, form, attempt = 0) {
  let response;
  try {
    response = await form.show(player);
  } catch (e) {
    return undefined;
  }
  if (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
    await new Promise((resolve) => system.runTimeout(resolve, 10));
    return show(player, form, attempt + 1);
  }
  return response.canceled ? undefined : response;
}

export async function openRootMenu(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body("§7Select an option below:")
    .button("Tools and Armor")
    .button("About")
    .button("Exit");
  const response = await show(player, form);
  if (!response) return;
  if (response.selection === 0) openGearMenu(player);
  else if (response.selection === 1) openAboutMenu(player);
}

async function openGearMenu(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body("§7Each choice gives one filled shulker box:")
    .button("Tools")
    .button("Armor")
    .button("Back");
  const response = await show(player, form);
  if (!response) return;
  if (response.selection === 0) deliverKit(player, "tools");
  else if (response.selection === 1) deliverKit(player, "armor");
  else openRootMenu(player);
}

async function openAboutMenu(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body("Creator: ALNStudios\nALN:OpCodex v3\nGod tier Netherite kits from one book.\nCurseForge: allenscreations\nMCPEDL: alnstudios\nNot affiliated with Mojang.")
    .button("Back");
  const response = await show(player, form);
  if (response) openRootMenu(player);
}
