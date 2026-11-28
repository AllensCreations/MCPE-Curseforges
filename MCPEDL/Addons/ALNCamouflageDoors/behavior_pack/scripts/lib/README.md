# Script library

- `scripts/main.js`: entry point. Registers the two block components on startup and starts the door events one tick later.
- `lib/palette.js`: the list of paintable blocks (id, display name, key), the stored property names, and name helpers. Imported by every other file.
- `lib/inventory_utils.js`: inventory helpers (scan slots, check and consume items, give or drop an item). Depends on `@minecraft/server`.
- `lib/painter_anvil_ui.js`: registers the Door Painter right-click component and shows the Anvil-style forms (door, bottom block, top block, result). Exports `registerPainterBlock`. Depends on `@minecraft/server-ui`, `palette.js`, `inventory_utils.js`, `painted_door_handler.js`.
- `lib/painted_door_handler.js`: builds the painted door item (dynamic properties plus lore), registers the open and close component, and handles placing and breaking of both door halves. Exports `createPaintedDoorItem`, `registerPaintedDoor`, `initPaintedDoorEvents`. Depends on `@minecraft/server`, `palette.js`.
- `lib/logger.js`: `createLogger(name)` with info, step, warn, error and guard. Writes to the content log and, while `DEBUG_CHAT` is true, to chat. Keeps the last 200 lines. Depends on `@minecraft/server`.
- `lib/diagnostics.js`: start-up checks that the needed events, item methods, forms and both custom blocks exist, then reports the result to each player on first spawn. Depends on `@minecraft/server`, `@minecraft/server-ui`, `logger.js`, `palette.js`.
- Custom ids used: block `aln:door_painter`, block `aln:painted_door`, components `aln:door_painter_use` and `aln:painted_door_use`.
- Script events used: block startup registration, interact-with-block (before), block placed (after), block broken (after), player leave (after).
- Known limits: only the listed blocks can be painted; explosions break a painted door without a drop; item and event members were not verified against the docs.
