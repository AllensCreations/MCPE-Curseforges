import { Player } from "@minecraft/server";

export type Kind = "ok" | "warn" | "error";

const COLORS: Record<Kind, string> = { ok: "§a", warn: "§e", error: "§c" };

export function notify(player: Player, text: string, kind: Kind): void {
  try {
    player.onScreenDisplay.setActionBar(`${COLORS[kind]}${text}`);
  } catch {
    return;
  }
}
