import { system } from "@minecraft/server";
import { ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const PREFS_KEY = "aln_sort_prefs";
const SORT_MODES = [
  "Smart Category (Default)",
  "Alphabetical (A-Z)",
  "Stack Quantity (Highest First)",
];
const DEFAULTS = { sortMode: 0, includeHotbar: false, soundFeedback: true, keepOneInChest: false };

export function getPrefs(player) {
  try {
    const raw = player.getDynamicProperty(PREFS_KEY);
    if (typeof raw === "string") {
      const p = JSON.parse(raw);
      return {
        sortMode: Number.isInteger(p.sortMode) && p.sortMode >= 0 && p.sortMode < 3 ? p.sortMode : 0,
        includeHotbar: p.includeHotbar === true,
        soundFeedback: p.soundFeedback !== false,
        keepOneInChest: p.keepOneInChest === true,
      };
    }
  } catch {
  }
  return { ...DEFAULTS };
}

function savePrefs(player, prefs) {
  player.setDynamicProperty(PREFS_KEY, JSON.stringify(prefs));
}

export function isSettingsBook(item) {
  return (
    !!item &&
    item.typeId === "allenscreations:sort_settings_book"
  );
}

export function openSettings(player, attempt = 0) {
  const prefs = getPrefs(player);
  const form = new ModalFormData()
    .title("§aOneClickSort §7Settings")
    .dropdown("Sort Order", SORT_MODES, { defaultValueIndex: prefs.sortMode })
    .toggle("Sort Hotbar Slots (0-8) When Sorting Backpack", { defaultValue: prefs.includeHotbar })
    .toggle("Audio & Particle Feedback", { defaultValue: prefs.soundFeedback })
    .toggle("Leave 1 Item in Chest When Restocking", { defaultValue: prefs.keepOneInChest });

  form
    .show(player)
    .then((res) => {
      if (res.canceled) {
        if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 10) {
          system.runTimeout(() => openSettings(player, attempt + 1), 20);
        }
        return;
      }
      const [mode, hotbar, sound, keepOne] = res.formValues;
      savePrefs(player, {
        sortMode: Number(mode),
        includeHotbar: !!hotbar,
        soundFeedback: !!sound,
        keepOneInChest: !!keepOne,
      });
      player.onScreenDisplay.setActionBar("§a[OneClickSort] §fSettings saved!");
    })
    .catch((e) => console.warn(`[ALN:OneClickSort] Form error: ${e}`));
}
