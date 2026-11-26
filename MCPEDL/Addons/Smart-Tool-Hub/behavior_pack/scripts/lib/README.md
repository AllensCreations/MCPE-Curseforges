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
- `system.runInterval` (1-tick mining re-check, 2-tick cobweb check)
- `system.runTimeout` (swap retry, menu retry when the player is busy)

## Custom ids

- `aln:tool_hub` (item, `items/tool_hub.json`, icon key `aln_tool_hub`, `minecraft:wearable` slot `slot.weapon.offhand` so it can be equipped in the offhand; recipe `recipes/tool_hub.json`, shaped, iron ingots and redstone around a diamond, always unlocked)

## Behavior

- While a player keeps hitting a block (a hit within the last 10 ticks), a 1-tick interval re-checks the block under the crosshair and swaps in the best tool every tick. The switch margin stops it flipping between similar tools.
- Per-player settings are stored as one JSON string in the dynamic property `aln_tool_hub_settings`. Toggles: `autoSwitch`, `keepCurrentTool`, `ignoreSwordsMining`, `treeCapitator`, `naturalTreesOnly`, `dominoMiner`, `requireHubForMiners`. Sliders: `maxTreeBlocks` (16 to 256, default 128), `maxOreBlocks` (8 to 128, default 64). Defaults: `keepCurrentTool`, `ignoreSwordsMining` and `requireHubForMiners` off, all others on.
- After a swap, the same tool category cannot swap again for 5 ticks, so a block is not re-swapped while it is being broken.
- A 10-tick poll shows an action bar message when the Tool Hub enters or leaves the offhand.
- Auto Switch runs only when its setting is on AND the Tool Hub is in the offhand. It works on whichever hotbar slot is selected and swaps the best tool from any other inventory slot into it.
- Tree Capitator and Domino Ore Miner need sneaking and their own toggle. They need the Tool Hub in the offhand only when `requireHubForMiners` is on.
- Natural trees only: stripped logs, `_wood` and `_hyphae` blocks are skipped, and at least 4 non-persistent leaf, wart block or shroomlight blocks must be near the top logs. This is a guess from block types, so it cannot tell a placed log from a natural one inside a real tree.

## Notes (AI review)

Not verified against the docs at the time of writing: `minecraft:wearable` with slot `slot.weapon.offhand` on a custom item, whether `Entity.isValid` is a method or a property (`isAlive` accepts both), and the `@minecraft/server` 1.15.0 / `@minecraft/server-ui` 1.3.0 pairing (taken from another pack's manifest in this repo).
