const COLORS = { ok: "§a", warn: "§e", error: "§c" };
export function notify(player, text, kind) {
    try {
        player.onScreenDisplay.setActionBar(`${COLORS[kind]}${text}`);
    }
    catch {
        return;
    }
}
