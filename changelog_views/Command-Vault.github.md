# Changelog — Command Vault

## [v3] - 2026-11-18 - Fix Submenu Transitions

### Fixed
- **Submenu Dialog Stalling**: Wrapped submenu transitions in `system.run()` to prevent Minecraft Bedrock from silently ignoring consecutive modal form requests when clicking Delete Command.

<details>
<summary><b>2.0.x</b> (1 release)</summary>

### [v2] - 2026-11-17

#### Added
- **Delete Command Button**: New main menu button opens a multi-select modal form.
- **Multi-Toggle Deletion Form**: Individual toggle per saved command; delete multiple macros in one operation.
- **Batch Delete Feedback**: Action bar shows count deleted and plays a break sound on success.

</details>

<details>
<summary><b>1.0.x</b> (1 release)</summary>

### [v1] - 2026-11-18

#### Added
- **Command Vault Form UI**: Action and modal menus for saving, browsing, and executing command macros.
- **Dynamic Property Storage**: Persistent per-player command list storage.
- **Anvil Key Activation**: Trigger the menu using an Anvil-renamed book.

</details>
