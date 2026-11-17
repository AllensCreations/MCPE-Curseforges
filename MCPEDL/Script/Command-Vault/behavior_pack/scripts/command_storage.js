const PROP_KEY = "aln_saved_commands";

export function getSavedCommands(player) {
  try {
    const raw = player.getDynamicProperty(PROP_KEY);
    if (!raw || typeof raw !== "string") {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function sanitizeCommand(commandStr) {
  if (!commandStr || typeof commandStr !== "string") return "";
  let trimmed = commandStr.trim();
  while (trimmed.startsWith("/")) {
    trimmed = trimmed.substring(1).trim();
  }
  return trimmed;
}

export function saveCommand(player, label, commandStr) {
  const sanitized = sanitizeCommand(commandStr);
  if (!sanitized) {
    return { success: false, command: "", message: "Command cannot be empty." };
  }

  const cleanLabel = (label && typeof label === "string" && label.trim().length > 0)
    ? label.trim()
    : sanitized;

  const current = getSavedCommands(player);
  current.push({
    label: cleanLabel,
    command: sanitized,
  });

  try {
    player.setDynamicProperty(PROP_KEY, JSON.stringify(current));
    return { success: true, command: sanitized };
  } catch (err) {
    return { success: false, command: sanitized, message: String(err) };
  }
}
export function deleteCommandsByIndex(player, indicesToDelete) {
  const current = getSavedCommands(player);
  const deleteSet = new Set(indicesToDelete);
  const remaining = current.filter((_, idx) => !deleteSet.has(idx));

  try {
    player.setDynamicProperty(PROP_KEY, JSON.stringify(remaining));
    return { success: true, deletedCount: current.length - remaining.length };
  } catch (err) {
    return { success: false, deletedCount: 0, message: String(err) };
  }
}
