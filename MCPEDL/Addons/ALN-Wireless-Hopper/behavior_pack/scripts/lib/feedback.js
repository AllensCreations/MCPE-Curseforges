const COLORS = { ok: "§a", warn: "§e", error: "§c" };

export function notify(player, text, kind) {
  try {
    player.onScreenDisplay.setActionBar(`${COLORS[kind] ?? COLORS.warn}${text}`);
  } catch {
    return;
  }
}

export function itemLabel(typeId) {
  const name = typeId.includes(":") ? typeId.split(":")[1] : typeId;
  return name.replace(/_/g, " ");
}
