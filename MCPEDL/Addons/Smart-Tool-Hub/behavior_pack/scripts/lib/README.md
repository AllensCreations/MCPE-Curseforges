# Smart Tool Hub: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Nothing here was run in game.

`scripts/lib/` holds no `.js` files. All code is in `scripts/main.js`.

## Files

| File | Purpose |
| :-- | :-- |
| `scripts/main.js` | Tool Hub settings menu, offhand-gated Passive Auto-Switch, Smart Tree Capitator, Domino Ore Miner |

## Imports

- `@minecraft/server`
- `@minecraft/server-ui` (`ModalFormData`, `FormCancelationReason`)

## Events

- `world.afterEvents.itemUse` (opens the menu when the Tool Hub is used)
- `world.afterEvents.entityHitBlock`
- `world.afterEvents.entityHitEntity`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerLeave`
- `system.runInterval` (cobweb check)
- `system.runTimeout` (swap retry, menu retry when the player is busy)

## Custom ids

- `aln:tool_hub` (item, `items/tool_hub.json`, icon key `aln_tool_hub`, `minecraft:wearable` slot `slot.weapon.offhand` so it can be equipped in the offhand)

## Behavior

- Per-player settings (`autoSwitch`, `treeCapitator`, `dominoMiner`, all default on) are stored as one JSON string in the dynamic property `aln_tool_hub_settings`.
- Auto Switch runs only when its setting is on AND the Tool Hub is in the offhand. It works on whichever hotbar slot is selected and swaps the best tool from any other inventory slot into it.
- Tree Capitator and Domino Ore Miner need sneaking and their own toggle. They do not need the Tool Hub in the offhand.

## Notes (AI review)

Not verified against the docs at the time of writing: `minecraft:wearable` with slot `slot.weapon.offhand` on a custom item, `world.afterEvents.itemUse`, `Entity.getDynamicProperty` / `setDynamicProperty`, `ModalFormData.toggle(label, defaultValue)` signature, whether `Entity.isValid` is a method or a property (`isAlive` accepts both), and the `@minecraft/server` 1.15.0 / `@minecraft/server-ui` 1.3.0 pairing (taken from another pack's manifest in this repo).
