# Script library

Scripts for ALN:MultiIslandOneBlock. All helper files live in this folder and are imported by relative path from scripts/main.js.

- scripts/main.js: entry point. Subscribes to player join, player spawn, item use, script events and world load, then starts the lobby and OneBlock logic.
- lib/config.js: constants (lobby coordinates, property names, limits, startup window text).
- lib/util.js: shared helpers for JSON properties, item counting and moving, chunk-loaded checks, ticking areas and commands.
- lib/slots.js: island slot allocator. Slots 1 to 8 are the square around the lobby, 9 to 24 the second ring, 25 to 120 the outer rings. Stores ownership in a world property.
- lib/traits.js: the six Richness traits, their block boosts and bonus drop tables, and random trait picking.
- lib/phases.js: the eight shared OneBlock phases, their thresholds and weighted block pools.
- lib/island.js: builds a new island after loading its chunks and regenerates the OneBlock.
- lib/lobby.js: sets the default spawn location, keeps the lobby chunk loaded and teleports unassigned players to the lobby. The bedrock pillar, world spawn and first teleport are done by the Behavior Pack functions, not by scripts.
- lib/claim.js: assigns a slot and trait, builds the island, teleports the player and sets the personal spawn point.
- lib/welcome.js: the Start / About startup window for players without an island.
- lib/oneblock.js: handles broken OneBlocks, global phase counting, bonus drops and the island self-repair check.
- lib/market.js: global listing storage, ALN Coins balances, purchases and cancellations.
- lib/prices.js: recommended price and amount for each item, and what the market pays for it.
- lib/board.js: the @ALNStudios sidebar scoreboard that ranks every island owner by ALN Coins.
- lib/ledger.js: the Global Trade Hub forms opened by the TRADERS Item.
- lib/keeper.js: keeps the TRADERS Item permanent. A thrown copy returns to the player, and a copy owed to a player with a full inventory is delivered as soon as a slot is free.

Script events: aln:menu opens the startup window for a player who has no island yet.
Custom item: aln:pirate_ledger (shown as TRADERS Item).
Known limits: listings only accept items without custom names, lore, enchantments or damage. Ticking areas are used briefly while an island is built, and the world allows only a limited number of them.
