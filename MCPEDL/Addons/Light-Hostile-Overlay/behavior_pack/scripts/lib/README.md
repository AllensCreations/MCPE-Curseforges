# Scripts Overview

- `scripts/main.ts`: entry. Registers the `.light` command inside `world.afterEvents.worldLoad`. Depends on `lib/light_command`.
- `scripts/lib/config.ts`: constants (command, scan size, red/green threshold, marker cap, cooldown, particle id prefix `aln:lho_`). No dependencies.
- `scripts/lib/light_command.ts`: exports `registerLightCommand`. Cancels the `.light` chat message, runs the scan next tick, applies a 40 tick cooldown, sends a summary message. Depends on `config`, `light_scanner`.
- `scripts/lib/light_scanner.ts`: exports `scanLight`. Scans a 16 x 16 x 7 volume around the player, finds floor blocks with air above, reads the light level of the air block and spawns particle `aln:lho_<0-15>` above it. Depends on `config`.

Ids used: particles `aln:lho_0` to `aln:lho_15` (resource pack).

Known limits: markers are capped at 400 nearest floor blocks per scan; numbers disappear on their own after 5 seconds; not tested in game.
