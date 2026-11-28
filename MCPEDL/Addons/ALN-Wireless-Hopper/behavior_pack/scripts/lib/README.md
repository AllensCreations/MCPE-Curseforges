# ALN Wireless Hopper: script notes

Entry point: `scripts/main.js` imports the two init functions below and calls them once. Imports used: `@minecraft/server` (manifest dependency 2.0.0) and relative files only.

## Files

- `main.js`: calls `initWirelessLink()` and `initItemCatcher()`.
- `lib/constants.js`: ids (`aln:wireless_hopper`, `aln:wireless_remote`), receiver block types, dynamic property names, limits (24 receivers per hopper, 64 hoppers), dimension short codes. No dependencies.
- `lib/registry.js`: stores hopper-to-receiver links as one JSON string in a world dynamic property, with an in-memory cache. Exports `makeKey`, `blockKey`, `parseKey`, `getReceivers`, `hasLinks`, `linkedHopperKeys`, `toggleReceiver`, `dropReceiver`, `removeHopper`. Depends on `constants.js`.
- `lib/feedback.js`: action bar messages (green success, yellow warning, red error) and item name labels. No dependencies.
- `lib/distribute.js`: resolves receiver containers and splits an item stack evenly across them in rotating order, redistributing what full receivers reject. Skips receivers in unloaded chunks, removes receivers whose block is no longer a Chest, Barrel or Hopper. Depends on `registry.js`, `constants.js`.
- `lib/wireless_link.js`: right-click handling. Remote on a Wireless Hopper selects it (player dynamic property). Remote on a Chest, Barrel or Hopper links or unlinks it. Any other held item on a Wireless Hopper is beamed to the receivers and leftovers return to the player. Empty hand shows receiver status. Breaking a Wireless Hopper removes its links. Depends on `distribute.js`, `registry.js`, `feedback.js`, `constants.js`.
- `lib/item_catcher.js`: when a dropped item spawns within 6 blocks of a linked hopper, watches it for up to 5 seconds and beams it when it lands on the hopper. Remainders are respawned and ignored once. Depends on `distribute.js`, `registry.js`, `constants.js`.

## Ids and events

- Block `aln:wireless_hopper`, item `aln:wireless_remote`.
- Events: `world.beforeEvents.playerInteractWithBlock`, `world.afterEvents.playerBreakBlock`, `world.afterEvents.entitySpawn`.
- Dynamic properties: world `aln:wh_links`, player `aln:wh_selected`.

## Known limits

- A custom block has no inventory, so items enter by right-click or by landing on the block as a dropped item.
- Receivers in unloaded chunks are skipped.
- Hoppers destroyed by explosions or commands keep their stored links until the position is reused.
- Both halves of a double chest are separate links.
