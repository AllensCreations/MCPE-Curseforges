# Changelog

## 1.0.12
- Improve the join notification so players receive “Syncing shared inventory...” even if the mcfunction command cannot run.
- Keep the in-game title and project README title aligned with the release version.
- Keep creator attribution in the pack description instead of the title.

## 1.0.11
- Apply the versioned title and creator-description format to the release package.

## 1.0.10
- Fix the join notification with a direct player-message fallback if the mcfunction command cannot run.
- Show the version in the add-on title and keep “by AllensCreations” in the manifest description.

## 1.0.9
- Display a private “Syncing shared inventory...” message when a player joins.
- Use a dedicated mcfunction for the message; the gameplay system only detects the join and invokes the function.
- Do not repeat the join message on death respawns.

## 1.0.8
- Align the script's internal version and player-facing messages with Team Inventory branding.
- Update the root project overview to match the current synchronization interval, persistence, equipment sharing, and death-drop caveats.
- No inventory behavior changes are intended in this release.

## 1.0.7
- Renamed the add-on display name to Team Inventory; the existing world storage key remains unchanged.

## 1.0.6
- Synchronize every two game ticks.
- Persist shared inventory state across world restarts.
- Share armor, offhand, and selected hotbar slot.
- Add brief feedback for simultaneous slot conflicts.
- Remove the persistent status HUD and custom script-event commands.
- Stop forcing the world's keepInventory gamerule.
- Clarify death-drop and gameplay system limitations.
