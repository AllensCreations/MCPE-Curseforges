import { system } from "@minecraft/server";
import { ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const PREFS_KEY = "aln_sort_prefs";
const SORT_MODES = [
  "Smart Category (Default)",
  "Alphabetical (A-Z)",
  "Stack Quantity (Highest First)",
];
const AUTOMATION_MODES = ["Off", "Auto Stock", "Auto Restock"];
const DEFAULTS = { sortMode: 0, includeHotbar: false, soundFeedback: true, keepOneInChest: false, getEverything: false, automation: 0 };

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
        getEverything: p.getEverything === true,
        automation:
          Number.isInteger(p.automation) && p.automation >= 0 && p.automation < 3
            ? p.automation
            : p.autoRestock === true
              ? 2
              : 0,
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
    .toggle("Leave 1 Item in Chest When Restocking", { defaultValue: prefs.keepOneInChest })
    .toggle("Get Everything When Restocking (Not Just One Stack)", { defaultValue: prefs.getEverything })
    .dropdown("Automation (Needs Restock Feather in Inventory)", AUTOMATION_MODES, { defaultValueIndex: prefs.automation });

  form
    .show(player)
    .then((res) => {
      if (res.canceled) {
        if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 10) {
          system.runTimeout(() => openSettings(player, attempt + 1), 20);
        }
        return;
      }
      const [mode, hotbar, sound, keepOne, getAll, auto] = res.formValues;
      savePrefs(player, {
        sortMode: Number(mode),
        includeHotbar: !!hotbar,
        soundFeedback: !!sound,
        keepOneInChest: !!keepOne,
        getEverything: !!getAll,
        automation: Number(auto),
      });
      player.onScreenDisplay.setActionBar("§a[OneClickSort] §fSettings saved!");
    })
    .catch((e) => console.warn(`[ALN:OneClickSort] Form error: ${e}`));
}
