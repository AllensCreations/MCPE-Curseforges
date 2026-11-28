# ALN ChestLog: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Scripts are written in TypeScript (`.ts`) and compiled to `.js` by the repo tooling. `scripts/lib/` holds no `.js` files.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.ts` | 10 | Entry: on world load starts sync, registration and UI. |
| `scripts/chest_sync.ts` | 720 | Saved chest entries, deposits, unloaded-chunk buffer, sorting, form helpers, menu lock. |
| `scripts/chest_register.ts` | 183 | Sneak + use on a chest: register, edit, unregister form; double chest partner detection. |
| `scripts/chest_ui.ts` | 181 | ALNStudios menu: Chests, About, Exit; deposit all; per-item deposit; item lore. |

## Imports

- `@minecraft/server` (in all four files)
- `@minecraft/server-ui` (in `chest_register.ts`, `chest_sync.ts`, `chest_ui.ts`)
- `./chest_sync.js` (in `main.ts`, `chest_register.ts`, `chest_ui.ts`)
- `./chest_register.js`, `./chest_ui.js` (in `main.ts`)

## Events

- `world.afterEvents.worldLoad`
- `world.afterEvents.itemUse`
- `world.beforeEvents.playerInteractWithBlock`

## Custom ids

- `aln:chest_log` (`chest_sync.ts`)
- plus 17 vanilla `minecraft:` id(s)

## Notes (AI review)

- Script version constant in `chest_sync.ts` must equal the manifest version.
- A per-player lock keeps one menu or form open at a time.
- Failed saves are retried by the 100-tick sweep; waiting items are only removed after they drop.
- Auto-sort is per chest (`autoSort`, on when missing). Double chest partner uses neighbor size, then facing as tie-break.
- Not run in game. Pixelify font and the shared About icon are not shipped yet; About uses the name tag icon.
