# Harvest Intelligence — Technical Design

## Release target

- Add-on: Harvest Intelligence by AllensCreations
- Initial pack version: 1.0.0
- Minimum engine target: Minecraft Bedrock 1.26.0+
- Script dependency: `@minecraft/server` 2.10.0, stable
- Experimental toggles: none required by the planned implementation

The current stable Script API reference for Minecraft Bedrock 26.50 lists `@minecraft/server` 2.10.0. Microsoft’s module reference also lists 2.10.0 as the current stable 2.x module and separates it from beta versions. Jayly’s reference is used to inspect API members; Microsoft documentation remains the primary source for API policy and compatibility.

References:
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/minecraft-server?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/worldafterevents?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/scriptapi/minecraft/server/playerbreakblockafterevent?view=minecraft-bedrock-stable
- https://learn.microsoft.com/en-us/minecraft/creator/documents/scripting/versioning?view=minecraft-bedrock-stable
- https://jaylydev.github.io/scriptapi-docs/latest/

## Behavior contract

1. React only to a player breaking a supported crop block through normal gameplay.
2. Inspect the block permutation captured before the break and proceed only when its documented growth state is mature.
3. Never cancel the vanilla break or generate replacement drops. Vanilla loot, tool behavior, enchantments, and item drops remain responsible for the harvest.
4. Replant at most the one block that was broken. Consume exactly one matching planting item from the player's inventory only when replanting can proceed.
5. If no matching planting item is available, leave the normal harvest untouched and send a brief player notification. Rate-limit repeat notifications to avoid chat spam.
6. Do not overwrite a block that another action has placed in the crop location.
7. Skip automatic replanting in Creative and Spectator modes.
8. Do not change hunger, crop growth speed, vanilla drops, recipes, or tool durability.

## Replantable crop matrix

| Block | Mature state | Planting item | Replanted block |
| --- | --- | --- | --- |
| `minecraft:wheat` | `growth >= 7` | `minecraft:wheat_seeds` | `minecraft:wheat` |
| `minecraft:carrots` | `growth >= 7` | `minecraft:carrot` | `minecraft:carrots` |
| `minecraft:potatoes` | `growth >= 7` | `minecraft:potato` | `minecraft:potatoes` |
| `minecraft:beetroot` | `growth >= 3` | `minecraft:beetroot_seeds` | `minecraft:beetroot` |
| `minecraft:nether_wart` | `age >= 3` | `minecraft:nether_wart` | `minecraft:nether_wart` |
| `minecraft:torchflower_crop` | `growth >= 2` | `minecraft:torchflower_seeds` | `minecraft:torchflower_crop` |
| `minecraft:melon_stem` | `growth >= 7` | `minecraft:melon_seeds` | `minecraft:melon_stem` |
| `minecraft:pumpkin_stem` | `growth >= 7` | `minecraft:pumpkin_seeds` | `minecraft:pumpkin_stem` |

Growth states are read from the original block permutation, not the air block after breaking. If a state cannot be read, the handler safely skips that block rather than guessing its maturity.

## Melons, pumpkins, and other special plants

- `minecraft:melon_block` and `minecraft:pumpkin` fruit blocks keep vanilla drops and vanilla stem-driven regrowth. They do not need to be replanted as fruit blocks, so the add-on must not consume seeds when these are harvested.
- Sugar cane, bamboo, cactus, and kelp keep their normal base-supported regrowth; the add-on does not attempt to replant them.
- Sweet berry bushes, cocoa pods, and cave-vine berries are primarily harvested through interaction rather than normal block breaking. Interaction-harvest automation is outside this release's selected activation behavior.
- Pitcher crops are excluded from automatic replanting in v1 because their multi-block growth state needs dedicated upper/lower block handling to avoid placing a crop into the wrong half.

These exclusions preserve vanilla behavior rather than applying unsafe generic replant logic to unlike plant mechanics.

## API strategy

- Subscribe to stable `world.afterEvents.playerBreakBlock`.
- Use `brokenBlockPermutation` for the pre-break block type and growth state.
- Use the event's current block location only if the location is still air.
- Access the player's inventory container and consume one matching item transactionally.
- Set the crop block to its default state, which restarts growth at the normal initial stage.
- Restore the consumed item if block placement fails.
- Use `Player.sendMessage` for the no-supply notice and a short cooldown per player.
- Use no per-tick world scan, custom item, custom block, command, or beta-only API.

## Validation plan

Static validation:
- Parse all JSON manifests.
- Check JavaScript syntax with Node.js.
- Verify manifest version suffix, attribution, module entry path, and stable API dependency.
- Run the repository's add-on build/validation workflow when available.

In-game validation still required:
1. Mature and immature wheat, carrots, potatoes, and beetroot.
2. Mature nether wart and torchflower crops.
3. Mature melon and pumpkin stems.
4. Melon and pumpkin fruit blocks.
5. Replant with one matching item and with a stack.
6. Harvest with no matching planting item; verify normal drops and notification.
7. Verify no extra drops and no unrelated item loss.
8. Verify Creative/Spectator do not auto-replant.
9. Verify a block placed into the location is not overwritten.
10. Verify multiplayer harvesting affects only the player who broke the crop.

A successful static build does not prove in-game drop timing, inventory behavior, or achievement compatibility. Those require testing in the target Bedrock client.