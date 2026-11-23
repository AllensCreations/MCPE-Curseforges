import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import { TITLE, WELCOME_BODY, RULES_BODY, WELCOME_RETRY_LIMIT } from "./config.js";
import { findPlayer, wait } from "./util.js";
import { hasIsland, claimIsland } from "./claim.js";

const open = new Set();

async function showRules(player) {
  const form = new ActionFormData().title("§6§lAbout / Rules").body(RULES_BODY).button("Back");
  try {
    await form.show(player);
  } catch (e) {}
}

export async function promptWelcome(player, attempt = 0) {
  const id = player.id;
  if (open.has(id)) return;
  open.add(id);
  let tries = attempt;
  try {
    while (true) {
      const p = findPlayer(id);
      if (!p || hasIsland(p)) return;
      const form = new ActionFormData()
        .title(TITLE)
        .body(WELCOME_BODY)
        .button("Start / Claim Island")
        .button("About / Rules");
      let res;
      try {
        res = await form.show(p);
      } catch (e) {
        return;
      }
      if (res.canceled) {
        tries++;
        if (tries > WELCOME_RETRY_LIMIT) {
          p.sendMessage("§6[ALN] §7Rejoin the world or respawn to see the startup window again.");
          return;
        }
        await wait(res.cancelationReason === FormCancelationReason.UserBusy ? 10 : 100);
        continue;
      }
      if (res.selection === 0) {
        claimIsland(p);
        return;
      }
      await showRules(p);
    }
  } finally {
    open.delete(id);
  }
}
