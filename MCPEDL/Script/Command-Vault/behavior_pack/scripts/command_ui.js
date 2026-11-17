import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { deleteCommandsByIndex, getSavedCommands, saveCommand } from "./command_storage.js";

export function openMainMenu(player) {
  const commands = getSavedCommands(player);
  const form = new ActionFormData()
    .title("§3§lALN:CommandVault")
    .body(`§7Saved Commands: §b${commands.length}`)
    .button("§aCreate Command", "textures/items/book_writable")
    .button("§eExecute Command", "textures/items/repeater")
    .button("§cDelete Command", "textures/ui/cancel")
    .button("§bAbout", "textures/items/paper")
    .button("§8Exit", "textures/ui/cancel");

  form.show(player).then((res) => {
    if (res.canceled) return;

    system.run(() => {
      switch (res.selection) {
        case 0:
          openCreateCommandScreen(player);
          break;
        case 1:
          openExecuteCommandScreen(player);
          break;
        case 2:
          openDeleteCommandScreen(player);
          break;
        case 3:
          openAboutScreen(player);
          break;
        case 4:
        default:
          break;
      }
    });
  }).catch(() => {});
}

export function openCreateCommandScreen(player) {
  const form = new ModalFormData()
    .title("§a§lCreate Command")
    .textField("Command Name (Optional)", "e.g., Clear Weather / Full Heal")
    .textField("Enter Command", "e.g., /weather clear or time set day")
    .submitButton("Save Command");

  form.show(player).then((res) => {
    if (res.canceled) {
      system.run(() => openMainMenu(player));
      return;
    }

    const [labelInput, commandInput] = res.formValues;
    const result = saveCommand(player, labelInput, commandInput);

    if (result.success) {
      player.playSound("random.orb");
      player.onScreenDisplay.setActionBar(`§a[CommandVault] §fSaved command: §e/${result.command}`);
    } else {
      player.onScreenDisplay.setActionBar(`§c[CommandVault] §fError: ${result.message || "Failed to save command."}`);
    }

    system.run(() => openMainMenu(player));
  }).catch(() => {});
}

export function openExecuteCommandScreen(player) {
  const commands = getSavedCommands(player);
  if (commands.length === 0) {
    player.onScreenDisplay.setActionBar("§c[CommandVault] §fNo saved commands yet! Use Create Command first.");
    system.run(() => openMainMenu(player));
    return;
  }

  const dropdownItems = commands.map((c) => {
    if (c.label && c.label !== c.command) {
      return `${c.label} (/${c.command})`;
    }
    return `/${c.command}`;
  });

  const form = new ModalFormData()
    .title("§e§lExecute Command")
    .dropdown("Select Saved Command", dropdownItems)
    .submitButton("Execute Command");

  form.show(player).then((res) => {
    if (res.canceled) {
      system.run(() => openMainMenu(player));
      return;
    }

    const [selectedIndex] = res.formValues;
    const target = commands[selectedIndex];
    if (!target || !target.command) {
      system.run(() => openMainMenu(player));
      return;
    }

    try {
      player.runCommand(target.command);
      player.onScreenDisplay.setActionBar(`§a[CommandVault] §fExecuted: §e/${target.command}`);
    } catch (err) {
      player.onScreenDisplay.setActionBar(`§c[CommandVault] §fError: ${err?.message || "Execution failed."}`);
    }
  }).catch(() => {});
}

export function openDeleteCommandScreen(player) {
  const commands = getSavedCommands(player);
  if (commands.length === 0) {
    player.onScreenDisplay.setActionBar("§c[CommandVault] §fNo saved commands to delete!");
    system.run(() => openMainMenu(player));
    return;
  }

  const form = new ModalFormData()
    .title("§c§lDelete Commands");

  for (const c of commands) {
    const itemLabel = (c.label && c.label !== c.command)
      ? `${c.label} (/${c.command})`
      : `/${c.command}`;
    form.toggle(`Delete ${itemLabel}`, false);
  }

  form.submitButton("Delete Selected");

  form.show(player).then((res) => {
    if (res.canceled) {
      system.run(() => openMainMenu(player));
      return;
    }

    const indicesToDelete = [];
    if (Array.isArray(res.formValues)) {
      res.formValues.forEach((val, idx) => {
        if (val === true) {
          indicesToDelete.push(idx);
        }
      });
    }

    if (indicesToDelete.length === 0) {
      player.onScreenDisplay.setActionBar("§e[CommandVault] §fNo commands selected for deletion.");
    } else {
      const result = deleteCommandsByIndex(player, indicesToDelete);
      if (result.success) {
        player.playSound("random.break");
        player.onScreenDisplay.setActionBar(`§c[CommandVault] §fDeleted §e${result.deletedCount} §fcommand(s).`);
      } else {
        player.onScreenDisplay.setActionBar(`§c[CommandVault] §fError: ${result.message || "Failed to delete commands."}`);
      }
    }

    system.run(() => openMainMenu(player));
  }).catch(() => {});
}

export function openAboutScreen(player) {
  const form = new ActionFormData()
    .title("§b§lAbout ALN:CommandVault")
    .body(
      "ALN:CommandVault by ALNStudios\n\n" +
      "Save frequently used commands as quick-execute macros and trigger them from an interactive UI menu.\n\n" +
      "§eHow to Use:§r\n" +
      "1. Rename a vanilla Book or Quill to 'Command Vault' on an Anvil.\n" +
      "2. Right-click or hold the book to open the vault menu.\n" +
      "3. Use 'Create Command' to save commands with custom labels.\n" +
      "4. Execute saved macros directly with player command authority.\n" +
      "5. Use 'Delete Command' to toggle and remove multiple saved macros."
    )
    .button("§7Back to Menu", "textures/ui/refresh_light");

  form.show(player).then((res) => {
    if (res.canceled) return;
    system.run(() => openMainMenu(player));
  }).catch(() => {});
}
