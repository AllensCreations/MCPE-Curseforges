## [v8] - 2026-11-21 - [Apply Sounds]

- 2-in-1 Loot & XP Booster: Apply now plays a higher sound when the boosters are on and a lower sound when they are off.

## [v19] - 2026-11-20 - ALN-Pointer Aimbot Mob Types

- ALN-Pointer: Bow Aimbot mob type choices and Elder Guardian aim fix.

## [v18] - 2026-11-20 - ALN-Pointer Grouped Menu and Immortal

- ALN-Pointer: Grouped Combat Settings, Quick Presets, Immortal replaces Never Die, FOV moved to Tuning.

## [v7] - 2026-11-20 - [No Booster Limit]

- 2-in-1 Loot & XP Booster: Removed the drop and XP orb limits and all Action Bar messages.

## [v17] - 2026-11-20 - ALN-Pointer Circle Zoom

- ALN-Pointer: Aim circle now uses zoom and Bow Aimbot only targets inside it.

## [v144] - 2026-11-19 - Context7 Full Support, Build Pruning & AI Review Token Optimization

### Added
- **Context7 Configuration**: Added root `context7.json` and `llms.txt` with optimized exclusions and high-density Bedrock add-on development rules.
- **Build Snapshot Pruning**: Added `scripts/prune_old_builds.py` to prune builds while retaining at least 1 current and 1 old version snapshot per project, freeing 240+ MB.

### Improved & Balanced
- **Token-Efficient AI Review**: Streamlined `scripts/collect_ai_review.py` and `scripts/auto_ai_review.py` to use dynamic Action Notes (Update/Creation/Maintenance) and delegate instruction schemas and script formats to Context7 querying.
- **Cleaned Review Exports**: Excluded redundant upstream category READMEs and non-code marker files (`LOCK`, `.gitkeep`) from AI review bundles.
- **Build Retention Policy**: Updated `scripts/auto_bump_and_build.py` default `KEEP_VERSIONS` to 2.

---

## 2026-11-21 - New Addon ALN PortalDoors

### Added
- **ALN PortalDoors**: New addon project created from a pack script.

## [v198] - 2026-11-21 - Core Height Fix

### Fixed
- **Correct starting height:** The central block now sits at 0 64 0, with Bedrock at 0 63 0 and the world spawn at 0 65 0. The bonus Emerald Block appears at 1 65 0.

## [v197] - 2026-11-21 - Void Cleaner Guard

### Fixed
- **Reliable first-join setup:** Players are marked as set up only after the Bedrock footing exists, so setup retries if the starting chunk was not loaded yet.
- **No repeated notice:** The cleaning message is sent once, only to the player being set up.
- **Trader menu error text:** Removed the outdated Trader Post reference.
- **Shop item count:** Corrected the listed number of purchasable supplies to 173.

## [v196] - 2026-11-21 - Lucky Block Types

### Added
- **Lucky block types**: The center block now comes back as one of 7 types: All-Round, Farming, Building, Combat, Mining, Mystic or Treasure. Each has its own texture and favors matching good results.
- **14 new results**: Wooden Sword, Wooden Pickaxe, Experience Spark, Archer Starter, Coal Starter, Book Stack, Emerald Find, Stone Sword, Stone Pickaxe, Lapis Pinch, Lucky Coin, Iron Blade, Arrow Quiver and Spare Shield.
- **Falling Anvil**: A warning shows on the action bar, then an anvil drops from above you.
- **Thunder Pig and Thunder Villager**: A mob appears and lightning strikes it about a quarter of a second later.
### Improved & Balanced
- **Action bar only**: Results, the first-join tip and the Luck Ledger now show on the action bar instead of in chat.

## [v195] - 2026-11-21 - Island Setup Fix

### Improved & Balanced
- **Spawn point**: You now start standing on the lucky block in the center of the island, and the world spawn is set there.
- **Island setup on first join**: The island, lucky block, starter chest and spawn point are now built when you first join, and the empty-world platform below is cleared.

## [v194] - 2026-11-21 - MCicons, Lib READMEs, Samples In Build And Sync

- Minecraft icons now come from MCicons v2.1.1: `build-and-sync.yml` downloads the release file `mcicons-2.1.1.tgz` into `reference/mcicons/` (one file, hash-checked); recipe images and rule 1.5 use it first.
- Bedrock samples sync now runs inside `build-and-sync.yml` (Mondays, manual runs, or when `bedrock-samples.txt` is missing); `sync-bedrock-samples.yml` is removed.
- 53 packs got `behavior_pack/scripts/lib/README.md` (script notes for the AI review), made by `scripts/make_lib_readmes.py`.
- Old crafting and recipe image tests fixed (cairosvg tests skip when it is missing).

## [v193] - 2026-11-21 - OneBlock World Icon in mcworld

- OneBlock world builder: a `world_icon.jpeg` (or `world_icon.jpg`) in `MCPEDL/Maps/<map name>/` is now added automatically to every generated `.mcworld` as `world_icon.jpeg` in the world root, replacing any icon from the Mcpeworlds foundation. A file that is not a JPEG stops the build, and the archive check fails when the icon is missing.

## [v192] - 2026-11-21 - Stained Glass Recycling and Spider Fixes

### Fixed

- **Stained Glass Pane Recycling**: The recycle recipes for colored glass panes now give back the matching stained glass instead of failing to load.
- **Spider and Cave Spider**: Their models now load without animation errors.

## [v191] - 2026-11-21 - Leaf Clearing

### Added

- **Leaf Clearing**: Tree Capitator now clears the leaves of the tree it fells, and they still drop some saplings, sticks, and apples (Oak and Dark Oak only).

### Improved & Balanced

- **Auto-Switch Blocks**: Pistons, Sticky Pistons, and Observers now use a Pickaxe, Creaking Hearts and Cacti use an Axe, and Blocks of Dried Kelp use a Hoe.

## [v190] - 2026-11-21 - Kit Zips, Catalog Versions, OneBlock In Build And Sync

- Three kit zips only: `New-Pack.zip`, `Update-Pack.zip`, `Maintenance.zip` in `MCPEDL/AI Review/` (map text + scripts under `files/`); the six old kit files are removed.
- MCPEDL catalog versions now read `## [vN]` and `## [X.Y.Z]` changelog headings, fall back to the manifest, and warn when changelog and manifest differ.
- OneBlock world builds run inside `build-and-sync.yml` (optional `map_name` input); `build-oneblock-variants.yml` is removed.

## [v189] - 2026-11-21 - AI Review Folder

- AI review files, zips and kits now live in `MCPEDL/AI Review/` (links, workflow and scripts updated); the next build regenerates them and removes the old `ai-review/` folders.
- Every pack with a `main.js` also has `behavior_pack/scripts/lib/README.md` for the AI review (rule, checklist and payload warning).

## [v188] - 2026-11-21 - Tree Replanting

### Added

- **Tree Replanting**: After Tree Capitator fells a whole tree, a matching sapling is planted where the trunk stood, using one sapling from your inventory (free in Creative).

### Improved & Balanced

- **Crop Growth Setting**: The random tick speed the pack sets on first load is now listed in the description and can be turned off in the script settings.

## [v187] - 2026-11-21 - Startup Crash Fix

### Fixed
- Fixed the map script stopping at startup with "cannot read property 'subscribe' of undefined". The Ledger throw event is not available in the game's script version, so it was replaced with a scan that returns a dropped Ledger to its owner. The market, core regeneration and rewards run again.

## [v186] - 2026-11-21 - Inventory Icons And Core Height

### Fixed
- **Inventory icons**: market slots now use each item's inventory icon (the flat item sprite) wherever the game has one, and the block's own texture for full blocks. 26 slots with missing or wrong textures were corrected, including Lever, Hopper, Repeater, Comparator, Nautilus Shell, Dragon's Breath, Heart of the Sea, Furnace, Oak Door, Piston, Shulker Box, Bamboo, Observer, Tripwire Hook, Warped and Crimson Stem, Ender Chest, Conduit, Lantern and Sugar Cane.
- Shield and Magma Block have no flat icon in the game files, so they show text only instead of a broken picture.

### Changed
- **Core height**: the central block is now at 0, 64, 0 and the world spawn point is at 0, 65, 0 (on top of the block).
- Existing worlds: a block left at the old height (0, 0, 0) is not moved.

## [v185] - 2026-11-21 - Lucky Block Textures

### Added
- **Lucky block look**: The lucky block now has its own gold texture, with a question mark on the sides, a four-leaf clover on top and a plain gold bottom.

## [v184] - 2026-11-21 - Script Lib Folders

- Import-only Python modules moved to `scripts/lib/`; optional `behavior_pack/scripts/lib/` rule for pack scripts.

## [v183] - 2026-11-21 - Context7 Docs Folder

- Context7 now indexes only `docs/` (bedrock guide, instructions reference, scripts and workflows summary).
- AI review prompt is one short Context7 instruction; `docs/**` and `context7.json` pushes no longer start the build.
- Context7 lookups are batched: one query per library.

## [v182] - 2026-11-21 - Ledger Keep, Icon Fixes, Action Bar, About Button

- **OneBlock Natural Market v13**: Ledger keep/return, icon fixes, action bar feedback, About button.

## [v181] - 2026-11-20 - AI Review Kits: Directory Map and Skills

### Added
- **Context7 router skill** `.agents/skills/mcpe-context7/SKILL.md`: says which of the four Context7 libraries to query for what, and when a script must come from the kit zip.
- **Kit zips** `New-Pack_files.zip`, `Update-Pack_files.zip`, `tools_files.zip`: the complete, unchanged scripts a task has to run, as real files under `files/`. They cost no context.
- `scripts/test_ai_review_kits.py` (in CI).

### Changed
- **AI review kits are a directory map plus skills** (about 12 KB each, was 152 to 230 KB). The map lists directories only and is built from the working tree, so it cannot go stale.
- Per-package exports no longer include `changelog_views/*` and `Package/*.listing.md` (generated, never hand-edited) and no longer trigger on them. The prompt points to the skills instead of repeating their rules.
- Every package zip now carries the update scripts under `files/`.
- `context7.json`: indexes `.agents/skills`, stale exclude entries removed. `enrich_ai_review.py` no longer injects a repo map into the kits.

### Fixed
- `Update-Pack_tools.txt` was a byte-identical copy of `New-Pack_tools.txt` and had no update skill or update scripts.
- `mcpe-pack-update` pointed to the retired `collect-ai-review-files.yml`.

## [v180] - 2026-11-20 - AI Review Guard And Recipe Image Logger

### Added

- **Recipe image report**: Every build that generates recipe images now ends with a report that lists each pack, its recipes, the images in assets/recipes/ and the exact reason when a pack has no images. It shows in the run's Summary tab, as warnings in the log and as the recipe-image-report download.

### Improved & Balanced

- **AI review files**: The per-package AI review files in MCPEDL/*/*/ai-review/ are now rewritten only when that package changed, so unchanged packages no longer get a new commit on every build.

## [v179] - 2026-11-20 - Tutorial Platform Update

### Added
- **Tutorial platform**: each of the first 8 core breaks adds a grass block beside the core, building a 3x3 platform around it. Players get a short message for each step.
- **Anti-phase rescue**: a player inside the central block or the 3x3 platform is teleported on top of the central block.

### Changed
- **No bedrock**: the core no longer sits on a bedrock block. Existing worlds clear the old bedrock block automatically.
- **Standard market screen**: the market uses the game's standard form screen again. The chest-style screen files were moved to `resource_pack/ui_chest_disabled/` and are not loaded.

## [v178] - 2026-11-20 - Chest Market Screen Restored

### Fixed
- Fixed the blank chest-style market screen. The game's form container is 0 x 0 pixels, so the percentage sizes resolved to nothing. The container now fills the screen, and the market panel sizes itself from that.

### Changed
- The chest-style screen is active again. Run `/tag @s add obm_vanilla_ui` to use the game's standard form screen instead, and `/tag @s remove obm_vanilla_ui` to switch back.

## [v177] - 2026-11-20 - Standard Market Screen

### Fixed
- The market now opens in the game's standard form screen. The custom chest-style screen showed a blank menu in testing, and it also produced `Unknown property [orientation]` UI errors, so it has been taken out of the loaded resource pack.
- The market menus, purchases and selling work as before.

### Changed
- The chest-style screen files were moved to `resource_pack/ui_chest_disabled/` and are not loaded by the game. The `obm_vanilla_ui` tag from v9 is no longer needed.

## [v176] - 2026-11-20 - Standard Screen Option

### Added
- Added an option to use the game's standard form screen for the market. Run `/tag @s add obm_vanilla_ui` to switch to it, and `/tag @s remove obm_vanilla_ui` to switch back to the chest-style screen. The market menus and purchases work the same on both screens.

## [v175] - 2026-11-20 - Market Screen Fix

### Fixed
- Fixed the market screen showing blank. The screen is now created through the game's form factory, so it receives the form's title, text and slot buttons.

## [v174] - 2026-11-20 - Menu Icons Fix

### Added
- **Menu icons**: The Chest button, Deposit All and every chest in your list now show the ChestLog icon.

### Improved & Balanced
- **Readable text**: All gray text in the menus and item description is now white, yellow or aqua so it stands out from the background.
- **Simpler registration**: Chests are no longer labeled with a sign. The name you type shows in your Chest list.

### Fixed
- **Missing icons**: Menu buttons no longer show purple and black squares.

## [v173] - 2026-11-20 - Wireless Storage Upgrade

### Added
- **Unregister option**: Sneak and use the ChestLog on a registered chest and switch on Unregister to remove it. Waiting items are delivered or dropped.
- **Category sorting**: Chests now sort tools, armor, food, then everything else, alphabetically within each group.
- **Durability kept**: Items sent to an unloaded chest keep their durability as well as names, lore and enchantments.

### Improved & Balanced
- **Shared buffer**: Waiting items are stored per chest for the whole world and delivered as soon as the chunk loads, even while the owner is offline.
- **Busy screen retry**: The menu waits and reopens if another screen was open when you used the item.
- **Clearer messages**: Deposit All now says when nothing matched or when a chest could not buffer items.
- **Minimum version**: Requires Minecraft Bedrock 1.26.60 or newer.

### Fixed
- **Broken chests**: A registered chest that is broken is unregistered and its waiting items drop where it stood.
- **Double chests**: Breaking one half of a registered double chest keeps the other half registered.
- **Menu overlap**: The menu no longer opens on top of a chest screen.
- **Failed saves**: If a save fails, items stay in your inventory instead of being lost.
- **Shared chests**: Only the player who registered a chest can rename or unregister it.

## [v172] - 2026-11-20 - Offhand Torch, Grass, and Recipe Fixes

### Added

- **Redstone Torch Offhand**: Redstone Torches can now be held in your offhand like other torches.

### Improved & Balanced

- **Sleeping**: The add-on no longer changes how many players must sleep to skip the night.
- **Newer Game Support**: The Behavior Pack now targets the script version that ships with Minecraft 1.26.50.

### Fixed

- **Grass and Shears**: Auto-switch now also recognizes Short Grass and Tall Grass.
- **Stairs Recipes**: Stairs crafting recipes with uneven layouts now use full-width layouts, and the Bamboo Mosaic Stairs recipe file name is corrected.

## [v171] - 2026-11-20 - Script Split and Tool Fixes

### Improved & Balanced

- **Organized Scripts**: The add-on's code is now split into separate files in a lib folder, one for each feature, so it is easier to maintain. Nothing changes in game.

### Fixed

- **Auto-Switch Blocks**: Auto-switch now picks a Pickaxe for Blocks of Coal, Quartz blocks, Bone Blocks, Respawn Anchors, Conduits, and Lightning Rods, and Packed Mud no longer switches you to a shovel.
- **Fortune on Iron and Gold**: Domino Ore Miner now applies Fortune to Iron Ore and Gold Ore, including their Deepslate versions, like it already did for other ores.
- **Leaving the World**: Chain mining pause and pending tool wear are now cleared when a player leaves, so nothing carries over.

## [v170] - 2026-11-20 - Block Tool and Fortune Fixes

### Fixed

- **Auto-Switch Blocks**: Auto-switch now picks a Pickaxe for Blocks of Coal, Quartz blocks, Bone Blocks, Respawn Anchors, Conduits, and Lightning Rods, and Packed Mud no longer switches you to a shovel.
- **Fortune on Iron and Gold**: Domino Ore Miner now applies Fortune to Iron Ore and Gold Ore, including their Deepslate versions, like it already did for other ores.
- **Leaving the World**: Chain mining pause and pending tool wear are now cleared when a player leaves, so nothing carries over.

## [v169] - 2026-11-20 - Restock Get Everything

### Added
- **Get Everything**: A new toggle in the Sort Settings Book makes the Restock Feather pull every matching item from nearby chests, not just one full stack, until your inventory is full. It is off by default.

## [v168] - 2026-11-20 - Sneak Click Chest Controls

### Improved & Balanced
- **Chest Sorting**: Sneak and right-click a chest with the Auto-Sort Feather to sort it. Sorting your backpack stays a plain right-click.
- **Stock Chest**: Sneak and right-click a chest with the Restock Feather to stock it with the items your backpack shares with it. Restock stays a plain right-click.
- **Sneak Use**: Sneaking and right-clicking a feather in the air no longer does anything, so Quick Stack is gone.
- **Container Support**: Sorting, stocking and Restock now work with copper chests and every other chest type, as well as barrels and shulker boxes.

## [v167] - 2026-11-20 - Island Core Completion Fix

### Fixed

- **Finished Islands Keep No Bedrock**: When the last island block is mined, the bedrock under and around the core is now always cleared, the core turns into the island floor and the reward chest appears. Islands that got stuck with an empty core and leftover bedrock repair themselves within a few seconds of loading.
- **Completion Can't Be Skipped**: A failing sound or particle effect can no longer stop an island from finishing or from refilling its core.
- **Island Trees On Real Ground**: Trees now grow only on solid island ground. They no longer float at island edges or stand in empty space.
- **Right Soil For Every Tree**: Trees now stand on soil that suits them: grass, podzol, mud, moss, mycelium or nylium. A small soil patch is laid under a tree when the island floor is something else, but never over buildings.
- **No Stray Trees**: The Elytra Hangar no longer grows an oak tree on End stone, and second trees keep their distance from the first.
- **Effects Log Errors**: A few special effects no longer cause particle errors in the game log.
- **World Pack Reference**: The world's pack reference now matches the pack version, and map builds keep it in sync automatically.
- **Void End Dimension**: The End is now a void in every build of the map, matching the Overworld and Nether.

## [v166] - 2026-11-20 - Recipe Images For All Packs

### Improved & Balanced

- **Recipe images**: One generator now builds the crafting recipe images and item sprites for every pack, including Grand Banquets and Monster Companions. The two pack-specific generators and the --include-dedicated option are removed.

## [v165] - 2026-11-20 - Missing Recipe Images

### Improved & Balanced

- **Recipe images**: Build Changed Packs & Sync Catalogs now also generates crafting recipe images on a push when a pack has crafting recipes but no images in assets/recipes/.

## [v164] - 2026-11-20 - Recipe Image Trigger

### Improved & Balanced

- **Recipe images**: Build Changed Packs & Sync Catalogs now also regenerates crafting recipe images when a file in behavior_pack/items/ changes.

## [v163] - 2026-11-20 - Feather Only Chest Sorting

### Improved & Balanced
- **Chest Sorting**: Sneak and right-click now sorts a chest only while you hold the Auto-Sort Feather, so an empty hand no longer sorts it.

## [v162] - 2026-11-20 - Restock Stocking

### Added
- **Restock Stocking**: Sneak and right-click the Restock Feather to quick-stack your items into nearby chests, the same as the Auto-Sort Feather.
- **Leave 1 Item in Chest**: A new toggle in the Sort Settings Book keeps one item of each type in a chest when restocking, so Quick Stack still finds that chest.

## [v161] - 2026-11-20 - Add-on Package

### Improved & Balanced
- **Add-on Package**: The project is now built as a complete add-on with both packs, so it imports as one add-on file.

## [v160] - 2026-11-20 - Item Group

### Added
- **Item Group**: The Auto-Sort Feather, Restock Feather and Sort Settings Book are now grouped together as OneClickSort in the Creative inventory under Items.

## [v159] - 2026-11-20 - Crafting Recipes

### Added
- **Crafting Recipes**: Craft the Auto-Sort Feather from an Emerald, Feather and Hopper, the Restock Feather from a Gold Ingot, Feather and Chest, and the Sort Settings Book from a Book, Lapis Lazuli and Redstone Dust. All recipes are unlocked from the start.

## [v158] - 2026-11-20 - Custom Items

### Added
- **Custom Items**: The Auto-Sort Feather, Restock Feather and Sort Settings Book are now real items found in the Creative inventory under Items, so no Anvil renaming is needed.

### Improved & Balanced
- **Sort Settings**: Right-click the Sort Settings Book to open the menu.

### Fixed
- **Sorting**: Sorting a chest or backpack no longer fails when matching stacks merge completely into another stack.
- **Sort Settings**: The settings menu opens again.

## [v157] - 2026-11-20 - Pack Variants and Restock

### Added
- **Pack Variants**: Choose Simple (default) or Normal (with particles) in the pack settings; only Normal shows particles above sorted chests.
- **Restock**: Right-click a Feather renamed Restock to refill partial stacks in your hotbar and backpack from chests, trapped chests and barrels within 6 blocks.

## 2026-11-20 - New Script ALNOneClickSort

### Added
- **ALNOneClickSort**: New script project created from a pack script.

## [v156] - 2026-11-20 - Chest Market UI

### Fixed
- Fixed the UI errors `Unknown property [orientation]` for `dynamic_button`, `long_form_dynamic_buttons_panel` and `inside_header_panel`. The market screen no longer redefines the game's own form controls; it uses its own uniquely named controls instead.
- Other forms in your world (from other add-ons) use the normal game screen again. The market screen now appears only for Natural Market forms.

### Improved
- The market is now a large chest-style panel, 88% of the screen height, with 9 square slots per row. It scales with any screen size or UI scale.

## [v155] - 2026-11-20 - Responsive Market UI

### Fixed
- The market screen now sizes itself as a percentage of the screen, so it adjusts to any screen size or UI scale instead of using a fixed 460 x 350 panel.
- The slot grid is now 9 columns by 3 rows as described, instead of 3 columns by 9 rows, which ran past the bottom of the panel.

### Improved
- Slots, item icons and labels scale with the panel and keep square slots.

## [v154] - 2026-11-20 - README Sync Fix

### Fixed
- **OneBlock README sync**: a map with no current world archive no longer stops the whole build. The sync prints a warning and leaves that map's README unchanged, so the later build steps still run.

## [v153] - 2026-11-20 - Diagnostic Log

### Added
- Added a diagnostic log for map creators and testers. It records startup, core regeneration, Ledger use, core breaks, player spawns and errors in the content log.
- Added an optional in-game debug mode that shows the same messages in chat, and a status command that reports the current core state.

## [v152] - 2026-11-20 - Startup Fix

### Fixed
- Fixed the map script stopping during startup. Because of this, the Natural Market Ledger, core regeneration, Coin rewards and the automatic core restore from v3 did not run.
- The central block now regenerates after being broken, and is restored if something else removes it.

## [v151] - 2026-11-20 - Core Reliability Update

### Fixed
- The central block is now restored automatically if an explosion, piston or command removes it.
- Selling items no longer risks deleting items that were moved while the confirmation was open.
- Blocks that cannot stand on their own (torches, doors, saplings and similar) no longer enter the regeneration pool.
- The next-tier message now correctly shows personal breaks.

### Improved
- Saved regeneration-pool data is more compact and no longer repeats unlocked milestone blocks.

## 2026-11-20 - New Addon ALN ChestLog

### Added
- **ALN ChestLog**: New addon project created from a pack script.

## [v150] - 2026-11-20 - Island Trees And Effects Fix

### Fixed

- **Island Trees On Real Ground**: Trees now grow only on solid island ground. They no longer float at island edges or stand in empty space.
- **Right Soil For Every Tree**: Trees now stand on soil that suits them: grass, podzol, mud, moss, mycelium or nylium. A small soil patch is laid under a tree when the island floor is something else, but never over buildings.
- **No Stray Trees**: The Elytra Hangar no longer grows an oak tree on End stone, and second trees keep their distance from the first.
- **Effects Log Errors**: A few special effects no longer cause particle errors in the game log.
- **World Pack Reference**: The world's pack reference now matches the pack version, and map builds keep it in sync automatically.
- **Void End Dimension**: The End is now a void in every build of the map, matching the Overworld and Nether.

## [v149] - 2026-11-20 - World Loading Fix

### Fixed

- **World Pack Reference**: The world's pack reference now matches the pack version, and map builds keep it in sync automatically.
- **Void End Dimension**: The End is now a void in every build of the map, matching the Overworld and Nether.

## [v148] - 2026-11-20 - Leash Limit

### Improved & Balanced
- **Rope limit**: The tether is now 10 meters long. Partners can no longer get farther apart than that, including straight up or down, so building or flying away from your partner pulls you back.
- **Tension**: You feel tension from 6 meters and are pulled toward your partner beyond 8 meters. The pull now works up and down as well. Strain damage starts beyond 9 meters.
- **Leash look**: The beam is now a brown leash-style line that keeps the same color at every distance. The on-screen display still shows the four distance states.
- **Own beam particle**: The beam no longer uses the built-in flame, spark and happy particles, so it needs no extra particle variables.

## [v147] - 2026-11-20 - Test Dummy

### Added
- **Test Dummy**: The Controller has a new Spawn Test Dummy option for testing alone. It places a stand-in partner next to you that you are leashed to once you pick a role. Removing it, or ending the challenge, takes it away. A real partner who picks the other role replaces it.

## [v146] - 2026-11-20 - Faster Grinders

### Added
- **Grinder Batches**: A stack mob that dies to lava, fall damage, fire or anything else that is not a player now takes up to 5 stack mobs with it at once, dropping their normal items without experience or rare drops.

### Improved & Balanced
- **Idle Scanning**: Merging now checks less often after several quiet passes with nothing to merge, and checks normally again when a new mob appears.
- **Armor Drop Chance**: Looting now raises the chance that a Zombie or Husk stack drops armor in a Sneak Kill.

## [v145] - 2026-11-19 - Circle Size Matches Degrees

### Changed
- **Aim Circle**: The on-screen circle size is now exactly proportional to the Bow Aimbot angle. Each degree adds 1.6 pixels, so 25 degrees is the 40 by 40 size, 5 degrees is 8, 50 degrees is 80, and doubling the angle doubles the circle.

## [v120] - 2026-11-19 - Switch AI Review to Context7, Remove Bundled Reference Files

### Changed
- **AI Review**: Per-pack AI review downloads in `MCPEDL/README.md` now link directly to `<PackName>.txt`. Removed `bedrock-samples.txt`, `server.txt`, `server-ui.txt`, and `server-admin.txt` from per-pack zip bundles — no longer needed since Context7 provides live, up-to-date Minecraft Bedrock API and vanilla reference documentation.
- **Vanilla Reference Source**: Updated `scripts/collect_ai_review.py` instructions to use **Context7** (https://context7.com) as the primary vanilla reference API for AI agents working on pack updates.

### Cleanup
- Removed all 54 per-pack `ai-review/*.zip` files from `MCPEDL/*/ai-review/`.
- `scripts/auto_ai_review.py` no longer generates per-pack zip bundles.
- `scripts/build_mcpedl_readme.py` links `.txt` files directly in the AI Review column.

---

## [v143] - 2026-11-19 - Tome Lore Stories

### Added
- **Tome Lore Stories**: Every tome now shows a short legend in its tooltip under the ability list.
### Improved & Balanced
- **Frost Weaver Durability**: Frost Walker II now costs 1 durability for every 4 freezes instead of every freeze, so a tome lasts much longer when crossing water.
- **Refreshing Tooltips**: Tome tooltips update themselves when their text changes, so older tomes pick up the new ability text and legends.
### Fixed
- **Void Phantom Tooltip**: The two over-long tooltip lines are shortened so they are no longer cut off.

## [v142] - 2026-11-19 - Upload Intro and Loot Table Check

### Added
- **Loot table check**: `scripts/check_loot_tables.py --project <folder> --samples <bedrock-samples clone>` compares a pack's loot tables with the vanilla ones. It fails when a pack table is spelled differently from a vanilla table (it would override nothing) and lists vanilla entries that the pack copy lost or added.
### Fixed
- **Upload changelog intro**: a CurseForge changelog entry for a single update no longer starts with the filler line "Packed with the vX update" when the version is the same. The line stays for merged updates.

## [v141] - 2026-11-19 - Mob Loot Rolls

### Improved & Balanced

- **Mob loot rolls**: Mobs are now boosted by rolling their loot again with the weapon you killed with, so rare drops stay rare but get more chances to appear.
- **Lighter mob farms**: The booster no longer tracks nearby items for mob kills, which reduces lag and removes the 2x limit on rare drops.

## [v140] - 2026-11-19 - Faster Mob Loot

### Improved & Balanced

- **Faster mob kills**: The booster now remembers each mob's rare drop list instead of rebuilding it on every kill, which reduces lag in mob farms.

## [v139] - 2026-11-19 - Circle Size By Degrees

### Changed
- **Aim Circle**: The on-screen circle is now sized by the Bow Aimbot angle. At the default 25 degrees it is shown at the 40 by 40 picture's own size, and other angles are scaled from that in proportion to the angle, from 8 pixels at 5 degrees up to 102 pixels at 50 degrees.

## [v138] - 2026-11-19 - One Circle Picture

### Changed
- **Aim Circle**: The screen circle now uses one 16 by 16 picture, resource_pack/textures/particle/aln_circle.png, and the game stretches it to the size that matches the Bow Aimbot angle. The 10 separate aln_circle_4 to aln_circle_13 pictures are no longer used.

## [v137] - 2026-11-19 - Crosshair Circle On Screen

### Changed
- **Aim Circle**: The circle is now drawn on the screen at your crosshair instead of in the world, so it stays exactly on the crosshair and does not lag when you turn. It uses the same 10 circle pictures, aln_circle_4.png to aln_circle_13.png, chosen by the Bow Aimbot angle. This adds a resource pack file, ui/hud_screen.json, and it uses the screen title while you hold a bow with Target Highlight on.

## [v136] - 2026-11-19 - Aim Circle Pictures

### Changed
- **Aim Circle**: The circle around your crosshair is now a picture instead of flame dots. There are 10 circle pictures, 4 by 4 up to 13 by 13 pixels, one for each Bow Aimbot angle from 5 to 50 degrees. They are the files aln_circle_4.png to aln_circle_13.png in resource_pack/textures/particle.
- **Smooth Following**: The target picture and the aim circle now refresh every tick instead of 4 times a second, so they follow the target and your crosshair without flickering.
- **Bow Aimbot Angle**: The angle slider in Tuning now goes up to 50 degrees.

## [v135] - 2026-11-19 - Parry Text Removed

### Changed
- **Parry Effect**: Blocking a hit with Shield Always Active no longer shows "Parried!" on the action bar. The sparks, the shield sound and the push on a melee attacker stay.

## [v134] - 2026-11-19 - Shield Parry Effect

### Added
- **Parry Effect**: Every hit that Shield Always Active blocks now shows sparks in front of you, plays the shield sound, shows "Parried!" on the action bar and pushes a melee attacker back.

## [v133] - 2026-11-19 - Target Image and Line Of Sight

### Added
- **Target Picture**: Target Highlight now shows a small picture above the target Bow Aimbot picks, only visible to you. The picture is the file resource_pack/textures/particle/aln_target.png, a 16 by 16 image.
- **Aim Circle**: Target Highlight also draws a circle of flame dots around your crosshair that shows the Bow Aimbot aim range. A new Tuning choice switches it on or off.

### Changed
- **Line Of Sight**: Bow Aimbot now ignores mobs and players that are hidden behind blocks, and picks the one closest to your crosshair among those you can see.

## [v132] - 2026-11-19 - Water Clutch Cleanup

### Fixed
- **Water Cleanup**: Always Water Clutch now removes its water as soon as you land, including the water that spread sideways from it, instead of leaving it behind. It still removes the water after about 2 seconds at most.

## [v131] - 2026-11-19 - Gear and Dummy

### Added
- **Keep Gear On Death**: Your items, armor and off hand are set aside when you die and given back when you respawn, for you only and without changing the world rules.
- **No Knockback**: Cancels the push you get from melee hits.
- **Target Highlight**: Shows particles above the target Bow Aimbot picks and names it on the action bar while you hold a bow.
- **Practice Dummy**: A new Combat Menu button that spawns a harmless zombie 3 blocks in front of you for testing, for 2 minutes.
- **Knockback Slider**: A Tuning slider that makes the knockback you deal weaker or stronger, from 0 to 200 percent.
- **Aura Options**: Tuning choices for Aura Mode to hit mobs and players, mobs only or players only, and to turn you to face the target with a hit sound.
- **Totem Pop Effect**: Never Die now shows the totem particles and plays the totem sound when it saves you from a deadly hit.

### Changed
- **Combat Toggles**: The toggles screen now has 13 switches, and the Combat Menu has a Practice Dummy button before Back.

## [v130] - 2026-11-19 - Never Die

### Added
- **Never Die**: A new toggle that keeps you at half a heart instead of dying, even from a one-hit explosion such as a creeper. The void and the kill command still work. The combat toggles screen now has 10 switches.

### Fixed
- **Totem After A Pop**: Auto Totem and Infinite Totem no longer ignore deadly hits that land within a quarter second after a totem pops, such as the second damage of an explosion.

## [v129] - 2026-11-19 - Friends and Tuning

### Added
- **Friends**: Pick online players as friends in the new Combat Menu. Aura Mode and Bow Aimbot skip your friends, and the list is kept when they go offline.
- **Tuning**: Six sliders change Aura range, Aura damage, Aura targets, Bow Aimbot range, Bow Aimbot angle and Always Critical damage. The starting values match the old fixed numbers, and a reset switch restores them.
- **Auto Golden Apple**: Eats a golden apple from your inventory for you when your health is 4 hearts or less, with a 20 second wait between apples.
- **Damage Display**: Shows the damage of each hit you land on the action bar.
- **Quick Toggle**: Sneak while using the Combat Helper to switch all your toggles off, and do it again to bring them back.
- **Starter Item Setting**: A pack choice between No Starter Item (default) and Give Starter Item, which gives each player a Combat Helper the first time they join.

### Changed
- **Combat Menu**: The first main menu button is now Combat Menu, which opens Combat Toggles, Friends and Tuning. The combat toggles screen now has 9 switches.
- **Starter Item**: The Combat Helper is no longer given automatically on first join. Turn on Give Starter Item in the pack settings to get the old behavior.

## [v128] - 2026-11-19 - New Name

### Changed
- **New Name**: The add-on is now called Combat Helper. The item, its menus, the pack titles and the description all use the new name. The item still uses the cursor look, and your existing item, saved toggles and worlds keep working.

## [v127] - 2026-11-19 - Context7 MCP Documentation Lookup

### Added
- **Context7 lookup rule (1.16)**: documentation, API, vanilla data and repo scripts are now read through Context7 query-docs from four fixed libraries instead of pasted URLs.

### Improved & Balanced
- **Source references**: source priority, version refs and trusted sources now point to the Context7 libraries; the generator, new-pack skill and docs rules follow.

## [v126] - 2026-11-19 - Rare Mob Drops

### Improved & Balanced

- **Rare mob drops**: Rare mob drops still drop and are now boosted by a smaller amount, up to 2x, while common drops keep your full Loot level.

## [v125] - 2026-11-19 - Loot Tables and Commands

### Added

- **Booster command**: Type /aln:booster in chat to open the Booster menu without renaming a Book.
- **Loot switches**: The XP & Loot Booster menu now has Ores, Crops and Mobs switches, so you can choose which kinds of loot are boosted.
- **Limit message**: A short Action Bar message tells you when the booster limit is reached and some extras were skipped.

### Improved & Balanced

- **Real loot rolls**: Ores and crops are now boosted by rolling the block's own loot again, so only items the block can really drop are multiplied and a wrong tool gives no bonus.
- **Matching mob drops**: Mob loot is matched against what that mob can drop, so items thrown or dropped nearby are no longer multiplied.

### Fixed

- **Version number**: The menu title and About screen now show the current add-on version.

## [v124] - 2026-11-19 - Wool Recipe

### Added
- **Wool Recipe**: The ALN Pointer can now be crafted from 7 wool of any color in a cursor shape: the top row, the left and middle squares of the middle row, and the left and right squares of the bottom row. The recipe is unlocked from the start.

### Fixed
- **Menu Version**: The menu title now shows the same version as the pack.
- **Totem Exclusions**: Auto Totem and Infinite Totem now skip the kill command and script-set deaths, which a totem cannot stop in vanilla Minecraft, instead of reacting to them.

## [v123] - 2026-11-19 - Publish to CurseForge accepts vX headings

### Fixed
- **Publish to CurseForge**: the latest changelog heading check now accepts the vX version format (for example [v3]) as well as X.Y.Z, so packs on the new version scheme can be published.

## [v128] - 2026-11-19 - Monster Companions Mount Hint Text Fix

### Fixed

- **Monster Companions riding hint**: Rideable companions show a readable dismount hint.



## [v127] - 2026-11-19 - Monster Companions Primal Beast Biscuit Recipe

### Fixed

- **Monster Companions Primal Beast Biscuit**: The recipe loads without errors and uses a 2x2 layout.



## [v126] - 2026-11-19 - Monster Companions Golden Beast Biscuit Recipe

### Changed

- **Monster Companions Golden Beast Biscuit**: Now crafted with a Primal Beast Biscuit surrounded by 8 Gold Ingots.



## [v125] - 2026-11-19 - Monster Companions Biscuit Recipe Format Fix

### Fixed

- **Monster Companions recipes**: Both biscuit recipes use a newer recipe format to stop loading errors.



## [v124] - 2026-11-19 - Monster Companions Biscuit Recipe Fix

### Fixed

- **Monster Companions recipes**: Both biscuit recipes load without errors and are available from the start.



## [v123] - 2026-11-19 - Monster Companions Recipe and Hoglin Load Fixes

### Fixed

- **Monster Companions recipes**: Both biscuit recipes load without errors and unlock on picking up an ingredient.
- **Monster Companions Hoglin**: The tamed Hoglin loads correctly and still becomes a tamed Zoglin outside the Nether.
- **Monster Companions Zombie**: Removed an invalid animation entry from the Zombie in the Resource Pack.


## [v121] - 2026-11-19 - Monster Companions Error Fixes

### Fixed

- **Monster Companions**: Fixed Behavior Pack loading errors for taming feedback, companion damage protection and loyal Vex particles.

## [v122] - 2026-11-19 - Equal Taming Chances

### Improved & Balanced

- **Taming chances**: Every mob is now tamed with a 50% chance per Primal Beast Biscuit, including the Warden and the Wither.
- **Tamed Warden**: Melee damage is halved from 30 to 15 once tamed.
- **Taming protection**: A newly tamed Warden or Wither gets 10 seconds of Resistance.
- **Wither mount**: The rider sits higher above the Wither's heads, and the Wither flies a little faster when ridden.

## [v121] - 2026-11-19 - Warden and Wither Companions

### Added

- **Boss Subpack**: Choose Default to keep the Warden and the Wither as vanilla bosses, or With Bosses to tame them, in the Behavior Pack settings.
- **Tameable Warden**: On the With Bosses subpack, a Primal Beast Biscuit has a 10% chance to tame a Warden into a companion.
- **Tameable Wither**: On the With Bosses subpack, a Primal Beast Biscuit has a 10% chance to tame a Wither into a companion.
- **Rideable Warden**: A tamed Warden can be ridden and steered on the ground.
- **Rideable Wither**: A tamed Wither can be ridden and steered through the air.

## [v117] - 2026-11-19 - ALN Wireless Headphones Steadier Music

### Fixed
- **ALN Wireless Headphones**: The headphone music now starts in sync with the Jukebox, keeps playing longer while you are away, and loaded-area warnings and muting are more accurate.

---

## [v116] - 2026-11-19 - Boat and Switching Fixes

### Improved & Balanced

- **Universal Clutch v3**: Held items are no longer switched before it is time to place them, and falling checks less ground.

### Fixed

- **Universal Clutch v3**: Fixed an old boat being removed when you die long after a boat clutch.

## [v115] - 2026-11-18 - ALN Wireless Headphones Music Restored

### Fixed
- **ALN Wireless Headphones**: The headphones play the music again, and the paired Jukebox is no longer silenced for people wearing them.

---

## [v119] - 2026-11-18 - Switch AI review vanilla reference to bedrock.dev

- **Vanilla Reference Source**: Updated `scripts/collect_ai_review.py` to use `https://bedrock.dev/` as the primary vanilla reference API instead of the gzipped local file. bedrock.dev mirrors the official Mojang add-on documentation for every version.

## [v118] - 2026-11-18 - MCPEDL AI Review Revert & Vanilla Reference Link

- **MCPEDL Catalog & AI Review**: Reverted back to single `.txt` exports for AI reviews in `MCPEDL/README.md`, removing `.zip` bundle generation.
- **Vanilla Reference in Kits Table**: Added `Vanilla Bedrock Reference (JSON.gz)` to the AI Review Kits table in `MCPEDL/README.md` via `scripts/build_mcpedl_readme.py` and updated `scripts/collect_ai_review.py` instructions with the direct download URL for external AI agents.

## [v114] - 2026-11-18 - ALN Wireless Headphones Music Follows You

### Fixed
- **ALN Wireless Headphones**: The paired Jukebox is now silent for headphone wearers, so the music no longer fades with distance, and it keeps playing until the track ends if the Jukebox is not loaded.

---

## [v113] - 2026-11-18 - [ALN Wireless Headphones Audio Streaming & Fix]
### Added
- **ALN Wireless Headphones**: Enabled live disc audio streaming directly into the player's headphones via `player.playMusic()` when worn.
### Improved & Balanced
- **ALN Wireless Headphones**: Updated unloaded chunk feedback to `Disconnected` and cleanly halted audio streaming when disconnected or unequipped.

---

## [v114] - 2026-11-18 - Headphones Disc Names

### Improved & Balanced
- **ALN MoreDiscs**: All ten discs now use the music disc naming that ALN Wireless Headphones expects. Discs from earlier versions in existing worlds must be crafted again.

## [v117] - 2026-11-18 - Revert MCPEDL AI Review to Single Text Export

- **MCPEDL Catalog & AI Review**: Reverted back to single `.txt` exports for AI reviews in `MCPEDL/README.md`. Removed `.zip` bundle generation from `scripts/auto_ai_review.py` and `scripts/build_mcpedl_readme.py` to prevent redundant tool downloads and save tokens.

## [v116] - 2026-11-18 - MCPEDL AI Review Combined Zip Bundles

- **AI Review Bundles**: Updated `scripts/auto_ai_review.py` and `scripts/build_mcpedl_readme.py` to package `<PackName>.txt` and `<PackName>_tools.txt` into a single downloadable `<PackName>.zip` bundle for each pack in MCPEDL catalog.

## [v118] - 2026-11-18 - Music-Only Audio

### Improved & Balanced
- **ALN Wireless Headphones**: The headphone music always plays as music, with a steady volume.

---

## [v117] - 2026-11-18 - Custom Disc Support

### Added
- **ALN Wireless Headphones**: Custom music discs from other add-ons now play through the headphones.

---

## [v116] - 2026-11-18 - Muted Jukebox & Worn Model

### Added
- **ALN Wireless Headphones**: Worn model, muted paired Jukebox, unpairing and long-distance listening.

### Fixed
- **ALN Wireless Headphones**: Pairing now works with a sneak and use on a Jukebox.

---

## [v115] - 2026-11-18 - ALN MoreDiscs Vanilla Record Group Alignment

### Fixed
- **ALN MoreDiscs**: Aligned custom disc items and crafting item catalog to standard vanilla record group `minecraft:itemGroup.name.record`, preventing custom group registration conflicts on Bedrock.

## [v114] - 2026-11-18 - Item menu_category Namespace Validation & Reply Format Standard

### Fixed
- **Item Group Namespaces**: Prefixed all creative menu_category `group` strings with `minecraft:` across ALN Wireless Headphones, Expanded Basic Arsenal, Grimoire Relics V2, and Mining Helmet, preventing Bedrock parsing errors.
### Improved & Balanced
- **Instructions & AI Review**: Enforced mandatory namespace prefixing on all item/block `menu_category.group` entries in `INSTRUCTIONS.md` and `scripts/collect_ai_review.py`, and reaffirmed strict Reply Format requirements for AI reviews.

## [v114] - 2026-11-18 - Headphones Item Fix

### Fixed
- **ALN Wireless Headphones**: The item now loads correctly, with its icon, a stack size of 1 and its place in the Helmet group.

---

## [v112] - 2026-11-18 - [New Pack Kit Restoration]
### Fixed
- **collect_ai_review.py**: Resolved an issue where `skip_tools` suppressed `New-Pack_tools.txt` generation in `new_pack` mode.
- **MCPEDL Catalog**: Built and linked `ai-review/New-Pack_tools.txt` as the New Pack Kit download in `MCPEDL/README.md`.

---

## [v111] - 2026-11-18 - [AI Review Pipeline Consolidation]
### Improved & Balanced
- **Workflow Automation**: Integrated the AI review bundle artifact upload directly into `build-and-sync.yml` and removed redundant `collect-ai-review-files.yml`.
- **Graph Context Persistence**: Configured `auto_ai_review.py` to unconditionally run `enrich_ai_review.py`, preserving Graphify repo maps and dependency graphs across automated builds.

---

## [v110] - 2026-11-18 - [Specific Minigame Controller Identifiers]
### Improved & Balanced
- **Minigames**: Standardized all 6 minigame controllers from generic \`aln:minigame_controller\` to specific isolated identifiers \`aln:<minigame_name>_controller\` (e.g. \`aln:alphabet_scavenger_hunt_controller\`, \`aln:trivia_vault_controller\`, etc.) across all items, scripts, and mcfunctions.
- **Instruction Files**: Updated \`INSTRUCTIONS.md\` and \`PACK_GENERATOR_INSTRUCTIONS.md\` to mandate \`aln:<minigame_name>_controller\`.
- **Tools Bundle**: Regenerated \`ai-review/tools.txt\` and all minigame review files.

---

## [v109] - 2026-11-18 - [Instruction Optimization & Manifest Template Alignment]
### Improved & Balanced
- **PACK_GENERATOR_INSTRUCTIONS.md (4.3)**: Corrected manifest template name field from legacy \`Add-on Name (v1.0.0)\` to single-version \`Add-on Name (v1)\`.
- **Instruction Audit**: Verified all excerpt sections between \`INSTRUCTIONS.md\` and \`PACK_GENERATOR_INSTRUCTIONS.md\` are 100% synchronized with zero line divergence or truncation.
- **Tools Bundle**: Regenerated \`ai-review/tools.txt\` and \`Update-Pack_tools.txt\`.

---

## [v108] - 2026-11-18 - [Conflict Prevention Standards & Instruction Updates]
### Added
- **INSTRUCTIONS.md (1.12)**: Formally added Conflict Prevention & Isolation rules (mandatory `aln:<name>` namespace and Script API event delegation over vanilla entity JSON replacement).
### Improved & Balanced
- **Instruction Files**: Updated `allenscreations:controller` references to `aln:minigame_controller` in `INSTRUCTIONS.md` and `PACK_GENERATOR_INSTRUCTIONS.md`.
- **Tools Bundle**: Regenerated `ai-review/tools.txt` and `Update-Pack_tools.txt` with the latest rules.

---

## [v107] - 2026-11-18 - [Fix Duplicate UUIDs and Standardize Minigame Controller]
### Fixed
- **OneBlock-Void-Survival**: Generated unique manifest and module UUIDs for the embedded world behavior pack to avoid client duplicate-pack UUID collisions.
- **Minigames**: Migrated custom item identifier from `allenscreations:controller` to `aln:minigame_controller` across all 6 minigame packs (functions, items, scripts).
### Added
- **AI Review**: Refreshed all package AI reviews with standardized identifiers and graph linkages.

---

## [v106] - 2026-11-18 - [AI Review + Graphify Integration]
### Added
- **enrich_ai_review.py**: New script injecting `## Graph Context` from graph.json into every pack ai-review file — combined deep-code + repo-map in one upload.
- **Repo Map in tools.txt**: tools.txt now includes a full project-version map from the graph.
### Improved & Balanced
- **auto_ai_review.py**: Now auto-runs enrich_ai_review.py after every rebuild so graph context stays fresh.

---

# Changelog — MCPE-Curseforges (whole repository)

---

## [v105] - 2026-11-18 - Revert Stick Trigger in 2-in-1 Loot & XP Booster Addon

### Fixed
- **Reverted Stick Trigger to Book**: Reverted the 2-in-1 Loot & XP Booster Addon back to its v2 book trigger requirement. Stick triggering is now exclusive to the standalone Script pack.

## 2026-11-18 - New Script Loot and XP Stick

### Added
- **Loot and XP Stick**: New script project created from a pack script.

## [v103] - 2026-11-18 - Fix Submenu Transitions

### Fixed
- **Submenu Dialog Stalling**: Wrapped submenu transitions in `system.run()` to prevent Minecraft Bedrock from silently ignoring consecutive modal form requests when clicking Delete Command.

## [v102] - 2026-11-18 - Bold Parenthesized Naming Convention & Engaging Hook Questions

### Improved & Balanced
- **Bold Parenthesized Naming Convention in Instructions**: Updated naming documentation rules across `INSTRUCTIONS.md` and `PACK_GENERATOR_INSTRUCTIONS.md` to format name references in bold with parentheses (e.g. **`(<Shortcut> VX.<ext>)`**).
- **Hook Questions Guidance in Docs**: Clarified in `DOCS_RULES.md` that optional Common Questions should act as engaging hook Q&As connected to the pack's best highlights and benefits while keeping HTML description views minimal.

## [v101] - 2026-11-18 - Package Filename vX Scheme & Auto-Build Views on Pack Creation

### Added
- **Auto-build Views on Pack Script Execution**: `make_pack_script.py` now runs `build_listing_kits.py` and `build_changelog_views.py` when creating a new pack, staging `description_views/` and `changelog_views/` into the initial commit.

### Improved & Balanced
- **Package Filename `vX` Format**: Updated `INSTRUCTIONS.md`, `PACK_GENERATOR_INSTRUCTIONS.md`, and `manifest_tools.py` so package filenames format as `<Shortcut> VX.<ext>` (e.g. `V2` instead of `V2.0.0`) when minor and patch versions are zero, maintaining compatibility with legacy `X.Y.Z`.

## [v100] - 2026-11-18 - Delete Command Feature

### Added
- **Delete Command Button**: New main menu button opens a multi-select modal form.
- **Multi-Toggle Deletion Form**: Individual toggle per saved command; delete multiple macros in one operation.
- **Batch Delete Feedback**: Action bar shows count deleted and plays a break sound on success.

## [v99] - 2026-11-18 - AI Review Kits (3-mode), MCPEDL Catalog Kits Table & Auto-Commit Views

### Added
- **3-Mode AI Review Kits in `auto_ai_review.py`**: Now generates all three root kits on every build — `ai-review/New-Pack_tools.txt`, `ai-review/Update-Pack_tools.txt`, and `ai-review/tools.txt` (repo-maintenance) — with per-kit hash stamps so unchanged kits are skipped.
- **AI Review Kits table in `MCPEDL/README.md`**: `build_mcpedl_readme.py` now inserts a `## AI Review Kits` section above the category tables with direct download links to all three root kits.
- **`UPDATE` and `REPO` PATHS keywords in `collect_ai_review.py`**: `PATHS=UPDATE` builds an update-pack tools kit; `PATHS=REPO` / `MAINTENANCE` / `TOOLS` builds the full repo-maintenance kit; `PATHS=NEW` unchanged.

### Improved & Balanced
- **Auto-commit changelog and description views**: `collect-ai-review-files.yml` now always commits refreshed `changelog_views/` and `description_views/` (no checkbox needed); the `commit_changelog_views` input is removed.
- **Remove `refresh_package_files` toggle**: The per-package AI review auto-refresh checkbox is removed; the step always runs (auto=true path) and only commits when files changed.

## 2026-11-18 - New Script Command Vault

### Added
- **Command Vault**: New script project created from a pack script.

## [v98] - 2026-11-18 - Auto AI Review & MCPEDL Catalog Sync in Build Workflow

### Added
- **Automated AI Review in Build & Sync**: Added `python3 scripts/auto_ai_review.py` to `.github/workflows/build-and-sync.yml` so changed packs automatically receive updated review files in their respective `MCPEDL/*/*/ai-review/` directories and root `ai-review/tools.txt`.
- **Automated MCPEDL Catalog Sync**: Integrated `python3 scripts/build_mcpedl_readme.py` to auto-regenerate `MCPEDL/README.md` and committed it alongside `ai-review/` on every push/nightly build.

## [v97] - 2026-11-18 - AI Review update_pack Fallback & Instruction Policy Alignment

### Fixed
- **AI Review update_pack empty path fallback**: When `mode=update_pack` is dispatched with an empty `pack_path`, fallback to standard `repo_maintenance` export instead of failing with `Nothing matched`.

### Improved & Balanced
- **Instruction Policy Alignment (v25 & v27)**: Updated `INSTRUCTIONS.md` and `PACK_GENERATOR_INSTRUCTIONS.md` (Section 1.3, Termux script rules, and manifest rules) to document the single-number `vX` scheme (manifest `[X, 0, 0]`, title `(vX)`), the 3-mode AI review selector, and the gzipped Bedrock samples reference.

## [v96] - 2026-11-18 - Restore Pack Generator Tools to AI Review Export

### Fixed
- **AI Review new_pack tool files**: Restored essential pack-generator scripts (`make_pack_script.py`, `build_payload.py`, `import_project_payload.py`, `doc_template.py`, `pixel_json_to_png.py`, `crafting_template.py`, `CRAFTING_TABLE.svg`) to `New-Pack_tools.txt` in accordance with `PACK_GENERATOR_INSTRUCTIONS.md` and `SKILL.md`.

## [v95] - 2026-11-18 - Workflow Toggles, Publish Fix & Tooling Polish

### Fixed
- **CurseForge Publish**: Filter blank lines from `--list-pending` output so an empty project name never causes `--project is required` failures when publishing ALL packs.
- **apply_update.py VER regex**: Bare integers (e.g. `2`) now correctly rejected for pack-level `@@ version` specs; only `vX` or `X.Y.Z` are accepted. All 11 update-tool tests pass.

### Added
- **AI Review 3-Mode Toggle**: `collect-ai-review-files.yml` now exposes a `mode` choice dropdown (`update_pack`, `new_pack`, `repo_maintenance`) plus a `pack_path` text input, replacing the opaque free-text `paths` field.
- **`collect_ai_review.py` EXPORT_MODE**: `update_pack` skips `tools.txt` entirely (~80 k tokens saved); `new_pack` emits a lean kit (SKILL.md + instruction markdowns only, no Python scripts); `repo_maintenance` keeps the full bundle.

### Improved & Balanced
- **SKILL.md reference**: Updated stale `export-repo-to-txt.yml` link to `collect-ai-review-files.yml` in `.agents/skills/mcpe-pack-update/SKILL.md`.

## [v94] - 2026-11-17 - Single-Version vX Scheme & Tooling Migration

### Added
- **Single-version support**: Added vX format compatibility across changelog parser, AI review collector, and manifest tooling.
- **ALNSpawnControl and ALN Pointer reviews**: Added comprehensive AI review export files and source hashes for ALNSpawnControl and ALN Pointer.

### Improved & Balanced
- **Manifest tooling alignment**: Updated manifest tools and manifest title validator to correctly reconcile single-version titles `(vN)` with 3-integer Bedrock array versions `[N, 0, 0]`.
- **Changelog views**: Rebuilt all package changelog views to reflect the updated release headers.

## 2026-11-17 - New Script ALNSpawnControl

### Added
- **ALNSpawnControl**: New script project created from a pack script.

## 2026-11-17 - New Addon ALN Pointer

### Added
- **ALN Pointer**: New addon project created from a pack script.

## [v93] - 2026-11-17 - Clearer Workflow Name

### Improved & Balanced
- **Clearer workflow file name**: The build workflow file is now build-and-sync.yml, because it never bumps versions. The name shown in Actions (Build Changed Packs & Sync Catalogs) is the same, and every workflow that starts it was updated.
- **Stronger CI check**: CI now checks the YAML of every workflow file, and fails if a workflow starts another workflow by a file name that does not exist.

## [v92] - 2026-11-17 - Bone Meal and Drop Timing

### Fixed

- **Bone meal crops**: Crops sped up with bone meal are no longer multiplied when broken.
- **Nearby items left alone**: Only items that drop the instant you break a block or kill a mob are multiplied, so items thrown or dropped nearby a moment earlier or later are no longer multiplied.

## [v91] - 2026-11-17 - Crop and Carrier Fixes

### Fixed

- **Fully grown crops only**: Wheat, carrots, potatoes, beetroot, nether wart and sweet berries are multiplied only when fully grown, so replanting and breaking young crops no longer gives free items.
- **Carrier mobs skipped**: Donkeys, mules, llamas, allays, foxes and villagers no longer multiply the items they carry when killed.

## [v90] - 2026-11-17 - Smoother Boosters and Safer Loot

### Improved & Balanced

- **No place-and-break farming**: Ancient debris, melons, glowstone and sea lanterns are no longer multiplied, because they drop themselves or can be crafted back into the same block.
- **Lighter XP checks**: The XP booster now works out which player an orb belongs to once per pass and no longer moves orbs that are already next to you, which reduces lag in busy XP farms.
- **Item tracking limit**: The Loot booster stops tracking new item drops once a very large number are waiting, which protects busy servers.

## [v93] - 2026-11-17 - Lighter Performance

### Improved & Balanced

- **Universal Clutch 1.5.6**: Less work per tick for players who are not falling, and fewer inventory checks in Extreme Mode.

## [v92] - 2026-11-17 - Instant Boat Clutch

### Improved & Balanced

- **Universal Clutch 1.5.5**: The boat is placed and the player is seated in it at the same moment.

### Fixed

- **Universal Clutch 1.5.5**: Fixed being moved into the boat after respawning following a boat clutch death.

## [v91] - 2026-11-17 - Vanilla-Like Clutch Reach

### Improved & Balanced

- **Universal Clutch 1.5.4**: Clutch and boat placement reach is now capped at about 7 blocks above the ground.

## [v90] - 2026-11-17 - Higher Clutch Reach

### Improved & Balanced

- **Universal Clutch 1.5.3**: Clutch items and boats are now placed from higher above the ground.

### Fixed

- **Universal Clutch 1.5.3**: Fixed late placement and landing inside placed blocks.

## [v89] - 2026-11-17 - Gzip Bedrock Reference

### Improved & Balanced
- **Smaller Bedrock reference**: the vanilla reference is now stored as `bedrock-samples.min.json.gz` (about 8 MB instead of about 39 MB). The next Sync Bedrock Samples Reference run replaces the old plain file; unchanged upstream still commits nothing.

## [v88] - 2026-11-17 - AI Review Direct Link

### Improved & Balanced
- **AI review download**: the AI review column in `MCPEDL/README.md` now links straight to the raw file instead of the GitHub viewer page.

## [v87] - 2026-11-17 - One Build for AI Review and MCPEDL README

### Added
- **AI review in the main build**: Build Changed Packs & Sync Catalogs now refreshes every package's AI review file in the same run and commit, so each update ships with its review.

### Improved & Balanced
- **Minimal MCPEDL README**: `MCPEDL/README.md` lists Pack, Version, Source and AI review. The download column is gone and the AI review links to each package's own file.
- **One workflow**: the separate MCPEDL README workflow is removed and Collect Files for AI Review no longer starts after the build (manual runs stay).

### Fixed
- **AI review link**: the README now points at `MCPEDL/<Type>/<Name>/ai-review/<Name>.txt` instead of looking for a zip.

## [v86] - 2026-11-17 - MCPEDL Index README

### Added
- **MCPEDL README**: `MCPEDL/README.md` lists every pack grouped by type with Source, Download pack and AI review links; `mcpedl-readme.yml` rebuilds it on every pack or build change and after the catalog build.

### Improved & Balanced
- **Docs rules**: `DOCS_RULES.md` 2.1 names the generated `MCPEDL/README.md`.

### Fixed
- **Cleanup**: removes leftover retired files (`test_world.json`, Test worlds, retired scripts and workflows) when tracked; missing ones are skipped.

## [v85] - 2026-11-17 - Bedrock Reference and Auto Review

### Added
- **Bedrock Reference**: A weekly workflow converts the vanilla Bedrock samples into one JSON file in reference/bedrock-samples for add-on work.
- **Package AI Review Files**: Every package update now refreshes an AI review file inside the package folder, plus one shared tools file.

## [v84] - 2026-11-17 - Armor Drops and Smoother Loot

### Added
- **Armor Drops**: A Sneak Kill on Zombie and Husk stacks now has a small chance per extra mob to drop a piece of armor.

### Improved & Balanced
- **Smoother Loot**: Sneak Kill drops now appear over a few ticks instead of all at once, and a single kill spawns at most 256 item piles.
- **Baby Farm Stacks**: Baby farm animal stacks now keep their original mob, so its growth timer is no longer reset when the stack forms.

## [v83] - 2026-11-17 - Separate Baby Stacks

### Improved & Balanced
- **Baby and Adult Stacks**: Babies and adults of every mob type stay in separate stacks again, and a killed stack mob is replaced by the same kind.
- **Zombie Variants**: Zombies, Husks, Drowned and Zombified Piglins each keep their own stack, and armored ones stay separate again.

### Fixed
- **Random Babies**: Adult stacks no longer turn into random baby mobs when a mob is killed.

## [v82] - 2026-11-17 - Mixed Zombie Stacks

### Added
- **Random Spawn Stacks**: Zombie, Husk, Drowned and Zombified Piglin stacks now mix babies and adults, and each mob that replaces a killed one is a fresh random spawn that can be a baby or wear armor like a normal spawn.

### Improved & Balanced
- **Mixed Merging**: These four mobs now merge even when wearing armor or holding items, so their gear is not kept.
- **Sneak Kill Experience**: A Sneak Kill on these four mobs now counts about one baby in twenty for the baby experience bonus.

## [v81] - 2026-11-17 - Leaner Review Bundle

### Improved & Balanced
- **Smaller review bundle**: The standard AI review download no longer holds the combined text copy, a second SKILL.md at the root, or the generated changelog views. Only the files an update needs are left.
- **Shorter autobump workflow**: The five repeated steps that log a result and add it to the run summary now use one small helper script, with a test.
### Fixed
- **Recipe image rule**: The instructions now point to the autobump workflow for recipe images, because the manual workflow no longer starts on pushes.

## [1.0.80] - 2026-11-17 - Autobump Cleanup and Single Repo Version

### Improved & Balanced
- **Single repo version**: The repository version is now one number (v80) instead of X.Y.Z. Every update adds 1. Pack versions stay X.Y.Z.
- **Faster builds**: Python packages are now cached between runs and installed in their own step.
- **One OneBlock build**: On code pushes, OneBlock worlds are rebuilt by one workflow instead of two workflows saving the same files at once.
- **Build time limit**: The autobump workflow now stops itself after 45 minutes if something hangs.
- **Matching recipe images**: The manual recipe image workflow now also makes item sprites from recipes, like the autobump does.
### Fixed
- **Duplicate checks**: The CI no longer runs the same two tests twice.
- **Cleaner build script**: Removed a duplicated check and a copied block of code from the autobump script, and closed a file it left open.

## [1.0.79] - 2026-11-17 - Disc Group

### Added
- **Creative Group**: All ten discs now sit together in their own ALN MoreDiscs group in the Items tab of the creative inventory.

### Fixed
- **Disc Group**: The discs now use their own group name instead of the vanilla music disc group name.

## [1.0.78] - 2026-11-16 - Drop Limit and Cleaner Menus

### Improved & Balanced

- **Drop limit**: Extra Loot drops are now capped per moment, which protects busy servers and big farms.
- **Lighter farms**: The Loot booster no longer tracks item drops while nobody online has it turned on.
- **Clean Action Bar**: Pressing Apply twice quickly no longer shows an outdated Action Bar message.

## [1.0.77] - 2026-11-16 - Orb XP Restored

### Improved & Balanced

- **Orb XP back**: The XP booster multiplies XP orbs again, so Mending repairs your gear from the extra XP. Orbs near you are collected instantly.
- **Your orbs only**: Only the orbs closest to you are multiplied, so other players' orbs are never touched.
- **XP orb limit**: Extra orbs are capped per moment to protect busy servers.

## [1.0.76] - 2026-11-16 - Bedrock Developer Rules

### Added
- **Bedrock developer rules**: New section 1.15 in the instructions: official NPM packages first, the trusted source list, PNG and texture-registration split, and the failure procedure. Generator instructions mirror it.

## 2026-11-16 - Update Addon ALN MoreDiscs

### Added
- **ALN MoreDiscs**: Ten music discs with new vanilla-style icons (version 1.1.0).

## [1.0.75] - 2026-11-16 - Direct XP and Fair Drops

### Improved & Balanced
- **Exact XP**: The XP booster now adds the extra XP straight to you instead of spawning extra orbs, so the amount is exact and there is far less lag. XP orbs are no longer pulled to you instantly.
- **Your XP only**: Other players' XP orbs are never touched.
- **Real mobs only**: Armor stands, boats and minecarts are no longer treated as mob loot.
- **Fair drops**: Block and mob drops now go to the nearest player who caused them, so nobody multiplies another player's drops on a shared server.

## [1.0.74] - 2026-11-16 - Normal Font Restored

### Improved & Balanced
- **Normal font restored**: The Booster menus use the normal Minecraft font again. The pixel font and its files are removed.

## [1.0.73] - 2026-11-16 - Silk Touch and Pixel Text

### Improved & Balanced
- **Silk Touch safe**: Mining with Silk Touch now drops the block once. The Loot booster no longer multiplies it.
- **Pixel text**: The Booster menus now use the Pixelify Sans pixel font. Enable the Redesigned UI Resource Pack together with the Behavior Pack.

## [1.0.72] - 2026-11-16 - Book Only Trigger

### Improved & Balanced
- **Book only**: The Booster menu now opens only from a plain Book renamed to Booster. A Book and Quill no longer opens it.

## [1.0.71] - 2026-11-16 - Fortune and Looting Style Loot

### Improved & Balanced
- **More Fortune-style loot**: The Loot booster now also multiplies drops from amethyst clusters, glowstone, sea lanterns, melons, nether wart, sweet berries, wheat, carrots, potatoes and beetroot, on top of ores, ancient debris, gilded blackstone and mob loot.

## [1.0.70] - 2026-11-16 - Ores and Mob Loot Only

### Improved & Balanced
- **Loot only where it counts**: The Loot booster now multiplies drops from ores, ancient debris, gilded blackstone and mobs you kill. Normal blocks such as dirt, stone, wood and crops drop as usual.

## [1.0.69] - 2026-11-16 - Item Sprites In The Build

### Added
- **Item sprites from recipes**: `generate_recipe_images.py --items-from-recipes` copies the sprite of every custom item that has a crafting recipe to `assets/items/` (128x128, nearest-neighbor), and the build runs it, so the Custom Items section of each description fills itself.
### Improved & Balanced
- **Recipe rule**: agents no longer run the recipe generator; the build makes the recipe images and item sprites (`INSTRUCTIONS.md` 1.5).

## [1.0.68] - 2026-11-16 - Persistent Stacks

### Added
- **Rare Drops**: A Sneak Kill now rolls the rare drops of Rabbits (Rabbit's Foot), Zombies (Iron Ingot, Carrot or Potato), Zombified Piglins (Gold Ingot) and Drowned (Copper Ingot) at their vanilla chances, raised by Looting.

### Improved & Balanced
- **Persistent Stacks**: Merged stacks are now spawned to stay in the world, so they should not despawn when you walk away.
- **Batched Merging**: Merging is now done in small batches and skips dimensions with no players, so large farms should cause less stutter.

### Fixed
- **Guardian Drops**: A Sneak Kill on a stack of Guardians now includes Raw Fish and Prismarine Crystals.

## [1.0.67] - 2026-11-16 - Apply Closes Menu

### Improved & Balanced

- **Apply closes the menu**: Pressing Apply on the XP & Loot Booster screen now closes the menu instead of returning to the main menu.

## [1.0.66] - 2026-11-16 - Shoutout Mini Chats

### Added
- **Shoutout Mini Chats**: about half of the ALNStudios shoutouts are now short back-and-forth chats between two or three players, like asking who made the add-on and suggesting a follow. The other half stay the single plug with a reply.

## [1.0.65] - 2026-11-16 - Replies and Personality

### Added
- **Replies to Your Chat**: virtual players answer when you say hello, thank them, ask a question, laugh, say goodnight, or type one of their names.
- **Catchphrases**: each virtual player now has a catchphrase they use now and then.
- **Name Slips**: once in a while a virtual player slips and uses a made-up first name, and the others react.
- **Quiet Options**: each option now also comes in a Quiet version where the virtual players chat about half as often.
- **Shoutouts**: now and then a virtual player asks if you know ALNStudios and suggests following him, at most once every 20 minutes.

## [1.0.64] - 2026-11-16 - Better Writing

### Changed
- **Smoother Sentences**: openers and endings that read oddly with some lines were removed, so chat messages sound more natural.
- **Questions Stay Questions**: lines that ask something no longer get a statement ending tacked on.
- **Fitting Side Remarks**: the extra personality remark is now only added to casual chat, never to reactions to deaths, ores, sleeping or fights.
- **Better Amounts**: the counts used in lines (like a dozen or a couple of) read more naturally.

## 2026-11-16 - New Addon ALN MoreDiscs

### Added
- **ALN MoreDiscs**: New addon project created from a pack script.

## [1.0.63] - 2026-11-16 - Recipes and Descriptions In One Build

### Improved & Balanced
- **One build for images and descriptions**: Build Changed Packs & Sync Catalogs now renders pixel textures, regenerates the crafting recipe images and then rebuilds the Listing Kits in one run and one commit, so a new recipe or texture reaches the description right away. Generator problems are warnings and never block the build.
- **Recipe workflow**: Generate Crafting Recipe Images is now manual only.
### Fixed
- **Update script version**: a repo-level update script now refuses to run when its `@@ version` is not the next repo version, so the `.sh` name, the root changelog and `REPO_VERSION` always agree.

## [1.0.62] - 2026-11-16 - Soft Description Design

### Improved & Balanced
- **Description Design**: The CurseForge description HTML has a new look: a rounded hero with the tagline in a green pill, green heading chips, feature cards with a green title header and rounded step badges. The pack logo is no longer in the hero.
### Fixed
- **Commands**: A command with a colon in its name, such as `/give @s aln:item`, is no longer cut in half in the Commands table.

## 2026-11-16 - New Addon ALN Wireless Headphones

### Added
- **ALN Wireless Headphones**: New addon project created from a pack script.

## [1.0.61] - 2026-11-16 - Loot Cap and Boosters Switch

### Improved & Balanced
- **Loot back to 32x**: The Loot slider has six levels, 1x up to 32x. XP keeps seven levels up to 64x. A saved Loot level above 32x drops to 32x.
- **Boosters switch**: A new on/off switch on the XP & Loot Booster screen turns both boosters off and on without losing your levels.
- **XP orb limit**: Extra XP orbs are now capped per moment across all players, which protects busy servers.

## [1.0.60] - 2026-11-16 - Pack Options

### Added
- **Two Options**: the pack now has a Just Chat SMP option and a World Changes option. Just Chat SMP keeps everything as chat messages, and World Changes lets the bedtime night skip really change the time and weather.
- **Default**: Just Chat SMP is the default, so the night no longer skips unless you choose World Changes.

## [1.0.59] - 2026-11-16 - Night Skip

### Changed
- **Real Night Skip**: when a virtual player goes to bed on one of those nights, the night now really skips to morning after the goodnight chat, the weather clears, and someone says good morning.
- **Docs**: the description now says plainly that this changes the time of day for everyone.

## [1.0.58] - 2026-11-16 - Bedtime and Mishaps

### Added
- **Bedtime Chat**: on about one night in twenty, a virtual player says they are going to bed and one or two others wish them goodnight.
- **Virtual Deaths**: now and then a virtual player dies to a creeper, a zombie, a skeleton, a spider, lava, a fall, the void, drowning or fire. The usual death message appears in chat, then the victim and the others react.

## [1.0.57] - 2026-11-16 - Lighter Lock Checks

### Improved & Balanced
- **Lighter Lock Checks**: Explosions, Pistons, Hopper Minecart checks and lock cleanup now do far less work. Worlds with many locks or large redstone farms run smoother.

## [1.0.56] - 2026-11-16 - Piston Safety and Iron Door Feel

### Added
- **Piston Safety**: A Piston cannot be placed aimed at a locked block, and a block cannot be locked while a Piston is aimed at it. If a locked block still gets moved, for example in a Slime Block machine, its lock moves with it and the block stays locked.
- **Lock Cleanup**: Locks left behind by a block that no longer exists are removed automatically, so a new block placed there never inherits an old lock.

### Improved & Balanced
- **Iron Door Feel**: Locked doors, trapdoors and fence gates cannot be opened by hand, like an Iron Door. If one still opens, it snaps shut again. Redstone can still open them.
- **Protected Door Floor**: The block under a locked door can no longer be broken or blown up until the door is unlocked.

### Fixed
- **Pistons Unlocked Blocks**: Pushing or pulling a locked block with a Piston no longer leaves it unlocked.
- **Copper Chest Pairs**: A Copper Chest next to a locked Copper Chest now counts as part of the same lock.

## [1.0.55] - 2026-11-16 - Simplified Booster Sliders

### Improved & Balanced
- **Plain multiplier sliders**: The Loot and XP sliders now use the same seven levels, 1x, 2x, 4x, 8x, 16x, 32x and 64x, and the tier names are gone.
- **Loot up to 64x**: Loot can now reach 64x, matching XP. Your saved Loot and XP levels carry over unchanged.
- **ALNStudios look**: The menus follow the ALNStudios Redesigned UI standard with a gold title, bold buttons with icons and a Back button on About.
- **Menus keep going**: After Apply or Back the main menu opens again. Exit or the close button closes it.
- **Action Bar feedback**: Applied settings now show on the Action Bar instead of in chat.

## 2026-11-16 - New Addon Expanded Basic Arsenal

### Added
- **Expanded Basic Arsenal**: New addon project created from a pack script.

## [1.0.54] - 2026-11-16 - Fox Tool Balance

### Improved & Balanced
- **Material Damage**: A fox's damage now depends on the tool it holds. Wooden and golden tools hit the softest, then stone, iron, diamond, and netherite.
- **Effect Cooldowns**: Pickaxe slowness and hoe poison can only trigger once every 8 seconds.
- **Swap Protection**: Swapping tools starts the effect cooldown, so it cannot be reset by switching.
- **Attack Pace**: Axe attacks land every 1.5 seconds and hoe attacks every 1.2 seconds.
- **Warden Safety**: Tamed foxes no longer pick fights with wardens.

### Fixed
- **Shovel Reach**: A shovel now lets the fox attack from farther away than a bare fox, as described.

## [1.0.53] - 2026-11-16 - Fox Tool Attacks

### Added
- **Tool Arming**: Pickaxes, shovels, and hoes can now be handed to a tamed fox along with swords and axes.
- **Pickaxe Style**: A pickaxe fox deals 5 damage and slows what it hits for 3 seconds.
- **Shovel Style**: A shovel fox deals 5 damage and attacks from farther away.
- **Hoe Style**: A hoe fox deals 4 damage and poisons what it hits for 4 seconds.

### Improved & Balanced
- **Tool Prompt**: The prompt for handing over a tool now reads Give Tool.

## [1.0.52] - 2026-11-16 - Fox Combat Upgrade

### Added
- **Weapon Styles**: A fox holding a sword chases targets faster, and a fox holding an axe leaps higher.
- **Take Weapon Back**: Sneak and interact with an empty hand to take the weapon from your fox.
- **Hostile Mob Defense**: Tamed foxes attack hostile mobs they can see within 16 blocks, except creepers.

### Improved & Balanced
- **Owner Only Arming**: Only a fox's owner can hand it a weapon.
- **Translated Prompts**: The weapon prompts now use language files so they can be translated.

## [1.0.51] - 2026-11-16 - Give Weapon Prompt

### Fixed
- **Give Weapon Prompt**: The prompt for handing a tamed fox a sword or axe now reads Give Weapon instead of showing a raw text key.

## [1.0.50] - 2026-11-16 - Gear Safe Stacking

### Added
- **Cooked Meat Drops**: A Sneak Kill on a burning stack of Cows, Pigs, Sheep, Chickens, Rabbits or Mooshrooms now drops cooked meat.

### Improved & Balanced
- **Gear Safe Stacking**: Mobs wearing armor or holding items are no longer merged, so their gear is never lost. Skeletons, Strays and Boggeds holding only their bow still stack.

### Fixed
- **Sheep Mutton Drops**: A Sneak Kill on a stack of Sheep now drops Raw Mutton.

## 2026-11-16 - New Script ALN MobStacker

### Added
- **ALN MobStacker**: New script project created from a pack script.

## [1.0.49] - 2026-11-16 - Listing Kit Only

### Improved & Balanced
- **Listing Kit Only**: The separate description views (.curseforge.html) and the image_prompts folder are gone. The Listing Kit of each pack holds the name, summary, description HTML and image prompts.
- **Cleanup**: This update deletes the old description_views HTML files and the image_prompts folder. Build Changed Packs & Sync Catalogs no longer rebuilds them.

## [1.0.48] - 2026-11-16 - Listing Kits

### Added
- **Listing Kit**: Every pack gets description_views/<Name>.listing.md with the package name, a summary of at most 256 characters, the description HTML and the Logo and Banner AI image prompts. Each one is in its own code block, so GitHub shows a Copy button.

### Improved & Balanced
- **Auto Refresh**: Build Changed Packs & Sync Catalogs and Collect Files now rebuild the Listing Kits. The summary is the DESCRIPTION tagline, shortened to 256 characters if needed.

## [1.0.47] - 2026-11-16 - Controller ALN UI

### Improved & Balanced
- **Controller Menu**: The Controller now opens the ALN UI Redesign main menu with Start, About and Exit, the ALNStudios title, bold text and the Pixelify font.
- **About Page**: Every minigame gets an About page with creator, version, a short pack line and profiles.
- **Skin Files**: The importer copies the skin font and About icon from assets/aln-ui-redesign into each minigame.
- **Controller Options**: registerController now needs version (same as the Behavior Pack version) and about.

## [1.0.46] - 2026-11-15 - Locator Removed

### Removed
- **Location Tips**: the virtual players no longer point out dungeons, strongholds, trial chambers or ancient cities, and the matching coordinate corrections are gone too.
- **Lighter Pack**: the background search for nearby structures was removed completely, so there is nothing left that scans blocks around you.

## [1.0.45] - 2026-11-15 - Structure Tips

### Changed
- **More Than Dungeons**: the rare location tip can now point to a real dungeon, stronghold, trial chamber or ancient city near you, with real coordinates.
- **Rarer Tips**: every 2 to 4 minutes there is only a 5% chance a search even starts, and tips stay at least 15 minutes apart. Rarer searches also mean less work for the game.
- **Why Not the Locate Command**: the game gives add-ons no way to read what the locate command finds, so the tip checks for real structure blocks close to you instead.

## [1.0.44] - 2026-11-15 - Smoother Performance

### Fixed
- **Lag Spikes**: the search for nearby spawners is now spread over a few seconds in small steps instead of one big sweep, and it skips repeat searches when you have not moved.
- **Lighter Background Work**: the checks for sleeping and dimension changes run half as often, and the startup count of chat lines was removed.
- **No Lag Jokes**: the virtual players no longer joke about lag spikes, so real lag is not confused with chat.

## [1.0.43] - 2026-11-15 - Piston Safety and Iron Door Feel

### Added
- **Piston Safety**: A Piston cannot be placed aimed at a locked block, and a block cannot be locked while a Piston is aimed at it. If a locked block still gets moved, for example in a Slime Block machine, its lock moves with it and the block stays locked.
- **Lock Cleanup**: Locks left behind by a block that no longer exists are removed automatically, so a new block placed there never inherits an old lock.

### Improved & Balanced
- **Iron Door Feel**: Locked doors, trapdoors and fence gates cannot be opened by hand, like an Iron Door. If one still opens, it snaps shut again. Redstone can still open them.
- **Protected Door Floor**: The block under a locked door can no longer be broken or blown up until the door is unlocked.

### Fixed
- **Pistons Unlocked Blocks**: Pushing or pulling a locked block with a Piston no longer leaves it unlocked.
- **Copper Chest Pairs**: A Copper Chest next to a locked Copper Chest now counts as part of the same lock.

## 2026-11-15 - New Script Gameplay Optimizer

### Added
- **Gameplay Optimizer**: New script project created from a pack script.

## [1.0.42] - 2026-11-15 - Give Weapon Prompt

### Fixed
- **Give Weapon Prompt**: The prompt for handing a tamed fox a sword or axe now reads Give Weapon instead of showing a raw text key.

## [1.0.41] - 2026-11-15 - Fox Arming and Healing

### Added
- **Weapon Arming**: Hand a tamed fox a sword or axe to raise its attack to 6 or 8 damage.
- **Healing Support**: Feeding a hurt tamed fox sweet berries or glow berries restores 4 health.

### Improved & Balanced
- **Berry Taming Chance**: Each berry has a 75% chance of taming a wild fox.
- **Snowy Foxes**: Foxes that spawn on snow are arctic foxes again.
- **Leads and Name Tags**: Foxes can be leashed and named again.

### Fixed
- **Fox Pack Folder**: The fox now sits in the same Behavior Pack folder as the pack manifest so it is included in the package.
- **Fox Settings**: Corrected misspelled and unsupported fox settings for leaping, equipment drops, name tags, taming chance, and sitting.

## [1.0.40] - 2026-11-15 - Burst Smoothing

### Fixed
- **Lag Spikes**: Large bursts of drops, such as a big tree, TNT or a mob farm, are now swapped a few at a time instead of all in one moment, so the game stays smooth.

## [1.0.39] - 2026-11-15 - Smoother Drops

### Fixed
- **Lag Spikes**: Drop swapping no longer scans the area around every broken block or defeated mob, so mining and fighting stay smooth.
### Removed
- **Chaos Drop Feed**: Rare swaps no longer show the original and the new item on the action bar.
### Improved & Balanced
- **Mystery Messages**: Starting and reshuffling now show scrambled text that signals something is happening, instead of an item count and a run code.

## [1.0.38] - 2026-11-15 - Status Effects and Defeated Flash

### Added

- **Status Effects**: Key effects on the target, such as Poison II 13s, now show with their level and time left, and Burning shows while the target is on fire.
- **Defeated Flash**: When you finish off a mob or player, Defeated and its name flash on the Action Bar for a moment.

### Improved & Balanced

- **Compact Layout**: When the line is too long for the screen, it switches to a shorter version with a 10-segment bar, shorter names and fewer effects.
- **Gear Reading**: Armor and the held item are now read piece by piece, so one unreadable piece no longer hides the rest.

### Fixed

- **Name Colors**: Mobs renamed with color or format codes no longer recolor or garble the display.
- **Dead Targets**: A target with no health left is no longer shown at 0 health.

## [1.0.37] - 2026-11-15 - Pack Skill and Assets

### Added
- **New Pack Skill**: Every AI review zip now has a SKILL.md at its root with the reading order and the checks for a new pack, so an AI follows the instructions.
- **Pack Assets Folder**: Every new pack gets assets/snapshots, assets/recipes and assets/items automatically.

### Improved & Balanced
- **Register CurseForge ID**: After the ID is saved it starts Build Changed Packs & Sync Catalogs by itself.
- **Test World Removed**: Add-ons, scripts and minigames no longer get a test world. A payload with test_world.json is rejected.

## [1.0.36] - 2026-11-15 - Controller Auto Destroy

### Improved & Balanced
- **Controller Auto Destroy**: The Controller is now used up when a game starts (Creative mode keeps it), and the host receives a new one when the game ends.

## [1.0.35] - 2026-11-15 - Min Engine Form

### Fixed
- **Minimum Game Version**: The instructions now require the minimum game version in the form 1.26.60 (1, release, patch), never 26.60, so packs import in Minecraft.

## [1.0.34] - 2026-11-15 - Import Fix

### Fixed
- **Pack Import**: The packs now import in Minecraft. The minimum game version they declared was higher than Minecraft accepts.

## 2026-11-15 - New Minigame Minecraft But Every Drop is Random Chaos Edition

### Added
- **Minecraft But Every Drop is Random Chaos Edition**: New minigame project created from a pack script.

## [1.0.33] - 2026-11-15 - Big Chat Expansion

### Added
- **40 Virtual Players**: 22 new virtual players join the roster of 18, and between 6 and 14 are online at a time.
- **550 New Lines and 24 New Topics**: weather, night and morning, farms, trading, raids, base tours, redstone, PvP, the dragon and the wither, the nether roof, fishing, exploring, pets, horses and boats, food, music, server events, build progress, lost items, mining and enchanting.
- **Scripted Mini Chats**: 40 short back-and-forth conversations between two or three players.
- **Bigger Variety**: new openers, endings and word banks lift the pool to millions of different lines, and the same line is not repeated back to back.

## [1.0.32] - 2026-11-15 - Spawner Tips

### Added
- **Spawner Tips**: once in a while a virtual player tells you the real position of a Monster Spawner close to you, usually a dungeon, and a second player replies. About one in three tips drops a minus sign and is corrected by the same player about two minutes later. Each spawner is announced only once, and nothing is said when none is nearby.

## 2026-11-15 - New Script Living SMP Chat

### Added
- **Living SMP Chat**: New script project created from a pack script.

## [1.0.31] - 2026-11-15 - Island Build And Shifter Safety Fixes

### Fixed

- **Islands Built Complete**: An island is now only generated once all of the chunks around it are loaded, so islands no longer appear with missing chunks, cut-off edges or missing buildings. If the area is not ready yet, the island is built as soon as you get close enough.
- **Island Trees**: Trees now grow on every island that is meant to have one, including the second tree on grassy and forest islands and the bee nests on the Cherry and Bee islands.
- **Dimension Shifter Purchases**: Buying from the Dimension Shifter can no longer take your payment without giving you the item. Items that do not stack, such as the double Elytra deal in the End, now arrive as separate items, and your payment is returned if a purchase cannot be completed.
- **Welcome Message**: The welcome message now shows only when you join the world, no longer every time you respawn after falling into the void.

## [1.0.30] - 2026-11-15 - Performance and Stability

### Added
- **Waiting for partner**: If your partner leaves or has not chosen a role yet, the screen says you are waiting and the leash timers pause.
- **Role menu protection**: Players are protected for five seconds while the role menu is open.
### Improved & Balanced
- **Smoother gameplay**: The leash, restrictions and on-screen display do far less work, which cuts lag, especially on phones and busy worlds.
- **Lighter beam**: The leash beam is drawn less often with fewer particles, and is hidden when partners are very close.
- **Steadier on-screen display**: The leash distance is shown in half-meter steps and only refreshes when it changes.
- **No cost between games**: The pack does no leash work until a challenge is started and stops when it ends.
### Fixed
- **Restriction messages**: Messages explaining blocked actions now appear right away, even before both roles are chosen.
- **Controller after respawn**: The host or an operator gets the Controller back after respawning when no challenge is running.

## [1.0.29] - 2026-11-15 - Victory Celebration

### Added

- **Victory Celebration**: Finishing all 20 rounds now shows a Congratulations title and a fireworks display, then the Controller comes back so you can play again.

### Improved & Balanced

- **Smoother Performance**: The challenge now updates once per second instead of every tick, which greatly reduces lag.
- **Co-op Eliminations**: A player who dies is eliminated, and the challenge only ends when every player is out.
- **Fair Matching**: Renaming an item in an anvil no longer counts toward a round.
- **Clearer Warm-up**: The countdown before Round 1 now shows Get Ready.

### Fixed

- **Round One Start**: The challenge no longer stops by itself when the first round begins.
- **Restart After Winning**: The Controller works again after a victory.
- **Health Penalties**: Lost maximum health is restored when a challenge ends.

## 2026-11-15 - Shared Hivemind Inventory 1.22.6 Personal Layout Removal

### Improved & Balanced

- **Personal Layout Removed**: Team Inventory no longer has the Personal layout, so every player shares one identical inventory and the add-on runs lighter.

## 2026-11-15 - Shared Hivemind Inventory 1.22.5 Death Drops and Joining Fix

### Fixed

- **Death Drops**: Team Inventory now reliably drops the shared inventory where a player dies.
- **Joining Players**: Players who join mid-game now add their own items to the team.

## 2026-11-15 - Shared Hivemind Inventory 1.22.4 Personal Layout Throw Fix

### Fixed

- **Thrown Items**: Team Inventory now removes items a player throws away from the whole team in Personal layout.

## [1.0.28] - 2026-11-14 - Description Rewrite

### Improved & Balanced
- **Clearer Description**: The listing now follows the new layout with an overview, feature cards, step-by-step instructions, common questions, and a compatibility summary.

### Fixed
- **Leash Details**: The description no longer says the Warden and Wither can be leashed, and no longer claims a fixed number of leashable mobs.
- **Creator Links**: The MCPEDL profile link and its image now appear once and point to the correct page.

## [1.0.29] - 2026-11-14 - [Universal Clutch Toggle]

### Added

- **Universal Clutch**: Per-player on/off commands.

### Improved & Balanced

- **Universal Clutch**: No camera movement or velocity reset; Extreme Mode no longer needs looking down.

## [1.0.28] - 2026-11-14 - [Universal Clutch Script Move]

### Improved & Balanced

- **Universal Clutch**: Moved to the Script catalog as a .mcpack release with safer landings and a Full Mode default.

### Fixed

- **Universal Clutch**: Twisting Vines support, creative and spectator handling, totem fail-safe, and fall tracking fixes.

## [1.0.27] - 2026-11-14 - Safer Update Scripts

### Fixed
- **Pull no longer blocked**: update and pack scripts now discard the generated view and prompt folders and use an autostash pull, so uncommitted generated files no longer stop a script with "cannot pull with rebase".

## [1.0.26] - 2026-11-14 - Image Prompts Keep Brand

### Improved & Balanced
- **Logo and Banner prompts**: the attached logo is now a brand reference only (colors and mood). The generator must make a new, original design with a different main symbol, not a copy or small tweak. "ALNStudios" always stays on the image and is never removed or changed.

## [1.0.25] - 2026-11-14 - Image Prompts And Changed-Only Views

### Added
- **Logo and Banner image prompts**: every pack gets `image_prompts/<n>.md` with a Logo Prompt and a Banner Prompt built from its DESCRIPTION. Each prompt tells the image generator to use your attached logo and your in-game snapshots as references. Run `python3 scripts/build_image_prompts.py --all`.
### Improved & Balanced
- **Changed-only views**: Build Changed Packs & Sync Catalogs now rebuilds CurseForge description views and image prompts only for packs whose description, changelog, icon or images changed, using `--changed`. A first run builds everything once.

## [1.0.24] - 2026-11-14 - Description Views On Build

### Improved & Balanced
- **Description Views Refresh**: CurseForge description pages in `description_views/` are now rebuilt and committed by Build Changed Packs & Sync Catalogs on every run, so new and changed projects stay current without a manual export.

## 2026-11-14 - New Script Always Critical

### Added
- **Always Critical**: New script project created from a pack script.

## [1.0.23] - 2026-11-14 - Byline Under Title

### Improved & Balanced
- **Byline**: the description page shows "by ALNStudios" under the pack title, in both styles.

## [1.0.22] - 2026-11-14 - Image Galleries and Pixel Textures

### Added
- **Description galleries**: the CurseForge page shows Screenshots, Custom Items and Crafting Recipes from each pack's `assets/snapshots`, `assets/items` and `assets/recipes` folders; the file name is the caption.
- **Minimal description style**: `build_description_views.py --style minimal` follows the reader's CurseForge theme; `--style all` builds both styles.
- **Pixel textures**: `pixel_json_to_png.py` turns `texture_sources/*.json` into PNG textures (standard library only); `PACK_GENERATOR_INSTRUCTIONS.md` 4.13 tells the agent how to write the JSON.
### Improved & Balanced
- **General recipe generator**: `generate_recipe_images.py` now covers every pack, lists all unresolved ingredients together, writes nothing on any problem and exports item sprites with `--item`; the workflow no longer names one pack.
- **Responsive dark description page**: tighter padding, wrapping cards and badges, icon beside the title.
- **Asset rule**: custom recipes and items always get their images in the pack's `assets` folders (`INSTRUCTIONS.md` 1.5, `DOCS_RULES.md`).

## [1.0.21] - 2026-11-14 - Remove Dead Code

### Improved & Balanced
- **Dead code removed**: six functions that nothing calls (`detect_unregistered_projects`, `patch_numeric_tag`, `add_root_numeric_tag`, `full_of`, `changelog_style`, `render_rollup`) and four unused imports.

## [1.0.20] - 2026-11-14 - Merge Docs Files and Shared Requirements

### Improved & Balanced
- **One docs file**: the audit procedure and Wiki and Samples references are now Part 3 of `DOCS_RULES.md`; `CHECKRM_REFERENCE.md` is removed.
- **Instructions**: the workflow entry-point list in 1.8 is removed because it drifts; read the workflow file instead.
- **Workflows**: one `requirements.txt` for every Python install, and one commit identity for all automated commits.

## [1.0.19] - 2026-11-14 - Rename And Move Removed

### Improved & Balanced
- **Rename And Move Removed**: The Rename and Move buttons are gone from the main menu. Name a slot when you save it, and save into the same slot again to change its name.
- **Empty Name**: Leaving the name empty when you save now always shows the coordinates, even on a slot that had a name.

## [1.0.18] - 2026-11-14 - Move Slots

### Added
- **Move Slot**: A new Move button on the main menu changes where a waypoint sits in your list. Pick the slot, then pick where it goes, and a filled slot swaps places with it.

## [1.0.17] - 2026-11-14 - Name On Save And Faster Fade

### Added
- **Name On Save**: After you pick a slot, Save now asks you to name it. Leave the name empty to show the coordinates, or to keep the slot's current name.

### Improved & Balanced
- **Menu Fade-In**: Menus fade in again with a quick 0.12 second fade, much faster than the old animation.

## [1.0.16] - 2026-11-14 - Bold Countdown Number

### Improved & Balanced
- **Countdown Number**: The seconds in the teleport countdown are now bold and white so they stand out from the rest of the message.

## [1.0.15] - 2026-11-14 - Tidy CI and Generator Rules

### Fixed
- **CI tests**: `test_rename_packages.py` was listed twice in the CI test step; it now runs once.
- **Build Center CI**: `actions/setup-node` is pinned to a commit SHA like the other workflows.

### Improved & Balanced
- **Vanilla limits rule**: the generator instructions now point to `INSTRUCTIONS.md` 1.12 instead of carrying a second copy.
- **Controller line**: removed a section number that does not exist in the generator instructions.

## [1.0.14] - 2026-11-14 - Single Source for Docs Rules

### Improved & Balanced
- **Docs rules in one file**: every README, DESCRIPTION and CHANGELOG rule and template now lives only in `DOCS_RULES.md`; both instruction files point to it, removing about 19 KB of duplicated text.
- **Generator excerpt**: the Part 1 excerpt in the generator instructions is synced to `INSTRUCTIONS.md`, and `check_instruction_files.py` now fails when any excerpt line differs.
- **Instruction sizes**: `INSTRUCTIONS.md` 32.8 KB (was 43.4 KB), generator instructions 33.2 KB (was 43.4 KB).

## [1.0.13] - 2026-11-14 - Instructions Cleanup

### Improved & Balanced
- **Instructions v12**: duplicate and contradicting rules removed; the docs audit part moved to `CHECKRM_REFERENCE.md`; the Dirtbound spec moved to its project folder; scripts are reference-only for AI agents (only test and spec-building scripts may run); size cap is now 60,000 bytes.

## 2026-11-14 - New Addon ALN Quiver

### Added
- **ALN Quiver**: New addon project created from a pack script.

## [1.0.12] - 2026-11-14 - Dimension Colors In Menus

### Improved & Balanced
- **Dimension Colors In Menus**: Saved slots and the Last Death button now show their text in green for the Overworld, red for the Nether and yellow for The End.

## [1.0.11] - 2026-11-14 - Swap-Back and Chain Mining Polish

### Added
- **Swap-Back After Mining**: A moment after you stop mining or fighting, the item that was in Slot 1 returns to its original slot instead of staying swapped.
- **Tree Size Message**: An action-bar message now tells you when a tree was too large to fell completely.

### Improved & Balanced
- **Faster Auto-Switch**: Auto-switch now waits only about a tenth of a second after a block breaks, so it keeps up with instant-break blocks.
- **Hotbar-Only Tool Search**: Auto-switch now only uses tools from your hotbar, so items in your backpack are never moved.
- **Chain Mining Experience**: Chain mining now spawns at most 10 experience orbs per chain and gives any extra experience straight to you, so far fewer orbs appear.
- **Lighter Held Light Checks**: The held-light update does less work while you carry no light item.

## [1.0.10] - 2026-11-14 - Smooth Bar and Mob Gear

### Added

- **Held Item**: The item in the target's main hand now appears beside its armor.
- **Armor on Mobs**: Mobs that wear armor now show their armor points, not only players.
- **Pet Owners**: Pets tamed by other players now show as Tamed with the owner's name when that player is online.

### Improved & Balanced

- **Smooth Health Bar**: The bar now has 20 segments and turns from green to yellow to red as health drops.
- **Adaptive Refresh**: The display updates every tick in a fight, every 2 ticks on a target and every 5 ticks while idle.
- **Steadier Display**: An unchanged line is no longer sent over and over, which removes needless flicker.
- **Absorption Marker**: A gold plus sign appears beside the health numbers when the target has Absorption.
- **More Mobs Recognized**: More vanilla mobs have a type, and unknown mobs use their game family before falling back to Neutral.
- **Any Tamed Animal**: Tamed animals other than Wolves and Cats now show as Tamed.

### Fixed

- **Hidden Targets**: Invisible mobs, invisible players and players in Spectator mode no longer show their health.

## [1.0.9] - 2026-11-14 - Last Death And Slot Cleanup

### Added
- **Last Death**: Your death location is now saved automatically and shown as the first button in Load.
- **Remove Extra Slots**: Delete now removes empty extra slots from the end of the list. The first 10 slots always stay.

### Fixed
- **Cooldown After Reload**: The teleport wait now carries over when the world reloads or you rejoin.

## [1.0.8] - 2026-11-14 - Delete And Safer Teleports

### Added
- **Delete Slot**: A new Delete button on the main menu clears a saved slot after you confirm.
- **Cancel On Move Or Damage**: Moving or taking damage during the countdown cancels the teleport.
- **Teleport Cooldown**: There is a 10 second wait after each teleport before you can teleport again.
- **Arrival Effect**: A portal particle effect plays where you arrive.
- **Fall Protection**: You get 5 seconds of slow falling after you arrive.

### Improved & Balanced
- **Menu Colors**: Menu buttons and text now use the default color. Colors only appear in the title bar and on action bar messages.
- **Action Bar Messages**: Rename, delete and spawn point messages now show on the action bar instead of in chat.

## [1.0.7] - 2026-11-13 - CI Test Coverage and Logo Icons

### Improved & Balanced
- **CI tests**: `test_rename_packages.py` now runs in the CI test step.
- **Agent rules**: `INSTRUCTIONS.md` now says scripts are reference only for AI agents; only test scripts may run.
- **Build Center CI**: `actions/checkout` pinned to the same commit SHA as the other workflows.
- **CurseForge logo**: registering a CurseForge ID now uses the project's CurseForge logo as `pack_icon.png` for any pack that has none (needs the `CURSEFORGE_API_KEY` secret). Packs with an icon are skipped.

## [1.0.6] - 2026-11-13 - CI Test Coverage

### Improved & Balanced
- **CI tests**: `test_rename_packages.py` now runs in the CI test step.
- **Build Center CI**: `actions/checkout` pinned to the same commit SHA as the other workflows.

## [1.0.5] - 2026-11-13 - Behavior Pack Add-on Tag

### Fixed
- **Add-on Tag**: The Behavior Pack is now marked as an add-on, matching the Resource Pack, so both packs are listed together as one add-on.

## [1.0.4] - 2026-11-13 - Safe Teleport Landing

### Added
- **Solid Ground Landing**: After a teleport, the Waypoint Helper checks the spot you arrive at. If it is now empty air you land on the ground below, and if it is inside blocks you are moved up to open space.

### Fixed
- **Mid-Air Landing**: Loading a waypoint whose spot is now in the air no longer drops you from a height.

## [1.0.3] - 2026-11-13 - Teleport Countdown And Sounds

### Added
- **Teleport Countdown**: Loading a waypoint now counts down 3 seconds on the action bar before you teleport.
- **Teleport Sounds**: A click plays on each countdown second and a teleport sound plays when you arrive.

### Improved & Balanced
- **Dimension Colors**: The save message is now green in the Overworld, red in the Nether and yellow in The End.
- **Action Bar Messages**: Save and teleport messages now show on the action bar instead of in chat.

## [1.0.2] - 2026-11-13 - Head Drops, Abilities and Fixes

### Fixed
- **Dragon Head in subpacks**: The Dragon variant was missing from the Natural Spawn and Manual Only subpacks, so the Dragon Head transformation could not apply there. All subpacks now include it.
- **Health mismatch**: The main file gave the default Ghast 40 HP while subpacks gave 10. Health is now defined per variant and identical across subpacks.
- **Creeper description**: The attack is no longer described as high-explosive. It uses the standard fireball; the Creeper's danger is now its death explosion.

### Added
- **Head drops on death**: Transformed Ghasts can drop their head when killed by a player (33%, Dragon 50%, Looting increases the chance) along with Ghast Tears and Gunpowder.
- **Per-head abilities**: Wither aura (Wither within 8 blocks), Zombie summons, Creeper death explosion, and Piglin calming with a Gold Ingot (30s).
- **Hard Mode subpack**: Doubled health and more frequent heads.

### Improved & Balanced
- **Per-variant health**: Classic 10, Skeleton 20, Wither 30, Zombie 25, Player 25, Creeper 20, Piglin 15, Dragon 100.
- **Fire rates**: Skeleton fires every 1.2s (was 1.0s); Piglin every 1.0s (was 0.8s).
- **XP**: Dragon kills give 50 XP; Wither Ghasts give 10 XP.
- **Compatibility notes**: The description now states what is and is not verified and warns about other Ghast add-ons.

### Needs in-game testing
- **New abilities**: They use `minecraft:on_death`, `minecraft:mob_effect`, `minecraft:spawn_entity` and `minecraft:timer`, which have not been run in Minecraft.

## [1.0.1] - 2026-11-13 - Public Repo README

### Improved & Balanced
- **Public Repo README**: The main README is now a short introduction for players: what ALNStudios makes, where to download, how to install, and links to each category list. It no longer lists every add-on, and the build no longer edits it.

## [1.0.0] - 2026-11-13 - Repo Version

### Added
- **Repo Version**: The whole repository now has one version, kept in REPO_VERSION. Every update raises it by one patch. It is the version in the root changelog headings, in the AI review bundle name and in its environment info.

## 2026-11-13 - ALNStudios UI Icon Rule

### Improved & Balanced
- **ALNStudios UI Icon Rule**: The main action button shows an icon that matches the pack only when the pack needs one and a verified icon exists.

## 2026-11-13 - ALNStudios UI Standard

### Added
- **ALNStudios Redesigned UI Standard**: Every add-on with a menu now follows one standard: a 3-button main menu, a fixed title, plain readable text, verified icons, an About screen and action bar feedback.

## 2026-11-13 - Enchanter Spear Icons and Readable Menus

### Improved & Balanced
- **Enchanter Readable Menus**: Menu text no longer uses colors that blend into the panel.

### Fixed
- **Enchanter Spear Icons**: Spears now show their icons in the item list.
- **Enchanter Nautilus Armor Icons**: Nautilus armor now shows its icon in the item list.

## 2026-11-13 - ALN UI Redesign and Publish ALL

### Added
- **Publish ALL**: The Publish to CurseForge workflow has a new ALL choice. It uploads every registered pack that was never published or is behind its newest changelog version, one pack at a time, each saved on its own, with failures listed at the end.
- **ALN UI Redesign rule**: Any pack that adds or changes a menu, form, HUD or screen now follows the shared ALN UI Redesign skin and ships it in its Resource Pack.

### Improved & Balanced
- **ALN UI Redesign**: The Cheatstick UI folder is now assets/aln-ui-redesign, and its README and design file are included in the AI tools export.

## 2026-11-13 - Enchanter Menu Redesign

### Added
- **Enchanter Main Menu**: Using the Enchanter Book opens a menu with Enchanter, About and Exit.
- **Enchanter About Screen**: Shows the creator, the version and where to find ALNStudios.
- **Enchanter Item Header**: The chosen item's name, slot and current enchantments appear above the sliders.

### Improved & Balanced
- **Enchanter Slider Dividers**: A divider now separates every slider.
- **Enchanter Action Bar Messages**: Results and warnings appear above the hotbar instead of in chat.
- **Enchanter Menus**: Gold and yellow title with the version, colored labels, button icons and Back buttons.

## 2026-11-13 - Shared Hivemind Inventory 1.22.3 Controller Merge

### Improved & Balanced

- **Single Controller**: Team Inventory now has the Team Settings options inside the Controller menu and no longer has a separate Team Settings item.

## 2026-11-13 - Team Inventory 1.22.2

### Added
- **Team Inventory Team Settings**: A new item holds the Mode and Layout switches, Hard Mode health and hunger options, and a team list.
- **Team Inventory Start Countdown**: Start now begins a five second countdown.

### Improved & Balanced
- **Team Inventory Controller**: The Controller now uses the standard menu, and inventory changes are picked up from the game's inventory-change event.
- **Team Inventory Package Name**: The download is now named TeamInventory.

## 2026-11-13 - Update Size Rule

### Improved & Balanced
- **Update size rule**: The AI now picks the method by size. A small update uses exact search-and-replace edits. A large update, such as most of a file, many new files or a redesign, uses the best method (new or fully replaced files in the same script) instead of many fragile edits.

## 2026-11-13 - Search And Replace Updates

### Added
- **Search-and-replace updates**: Every pack update is now a small list of exact find-and-replace edits instead of rewritten files. `scripts/make_update_script.py` builds the `.sh`, and `scripts/apply_update.py` applies the edits all-or-nothing, skips anything already applied, refuses a stale version, checks JSON and JavaScript, sets the manifest version and writes the pack and root changelog entries.

### Improved & Balanced
- **Smaller scripts**: The edits travel inside the `.sh` as readable text, so scripts are small, fast to review and cannot silently overwrite unrelated content.

## 2026-11-13 - One Reply Format And Vanilla Workarounds

### Added
- **Vanilla limit workarounds**: The AI instructions now say what to do when vanilla Minecraft hard-blocks a mechanic: use the lightest data-driven, script or structural workaround, keep each one in its own reusable module, never invent an API, and note the trade-off in the description.

### Improved & Balanced
- **One reply format**: Every reply, including a new pack, is now File Needed, Changelog and Termux Script. The Summary section is gone, and run commands sit alone in their own bash block.

## 2026-11-13 - New Addon Enchanter

### Added
- **Enchanter**: New addon project created from a pack script.

## 2026-11-13 - Shared Hivemind Inventory 1.22.2 Death Drops Fix

### Fixed

- **Death Drops**: Team Inventory now drops the shared inventory where a player dies and empties it for the team.

## 2026-11-13 - Team Inventory 1.22.1

### Added
- **Team Inventory Offline Shares**: Players who are offline when the game ends receive their share the next time they join.
- **Team Inventory End Game Confirmation**: The Controller menu asks for confirmation before ending the game.
- **Team Inventory Hard Mode Message**: Chat names the player whose death ended a Hard Mode game.

### Improved & Balanced
- **Team Inventory Version Line**: Version numbering continues from 1.22.0 again, and the changelog is cleaned up to the template.
- **Team Inventory Menu**: Start message shows Mode and Layout, locked buttons are marked, and the Controller is named ALNStudios Controller.
- **Team Inventory Saves**: Larger shared inventories can be saved, and item checks reuse earlier results.

### Fixed
- **Team Inventory Lost Items**: Items that did not fit when the game ended now drop on the ground.
- **Team Inventory Docs**: Fixed the duplicated creator links, outdated manifest description and the extra Compatibility lines in the description.

## 2026-11-13 - Team Inventory End Game Safety

### Added
- **Team Inventory End Game Confirmation**: The Controller menu asks for confirmation before ending the game.

### Improved & Balanced
- **Team Inventory Menu**: Start message shows Mode and Layout, locked buttons are marked, and the Controller is named ALNStudios Controller.

### Fixed
- **Team Inventory Lost Items**: Items that did not fit when the game ended now drop on the ground.
- **Team Inventory Docs**: Fixed the duplicated creator links in the description and the outdated manifest description.

## 2026-11-13 - New Packs As One Script

### Added
- **Pack script for new projects**: A new add-on, map, script or minigame now comes as ONE `.sh` file that carries the whole project inside it as base64. Run it in Termux with `bash <file>.sh`, which creates the project, builds the worlds, commits and pushes. `scripts/make_pack_script.py` builds it.
- **Run through GitHub**: `bash <file>.sh stage` copies the file to MCPEDL/incoming and pushes. Create Project from Base64 now accepts that `.sh` as payload_file and only reads its payload block; it never runs the file.

### Improved & Balanced
- **No loose files**: The AI no longer delivers separate zip, pack, json, js or base64 files. The instructions and the Collect Files for AI Review prompt require everything to live inside the one `.sh`.

## 2026-11-13 - Mining Helmet Mob Light and Falloff

### Added

- **Mining Helmet mob light**: Cursor Light lights the mob you look at.

### Improved & Balanced

- **Mining Helmet light tuning**: Distance falloff, a fixed level 2 self light, safer water handling and fewer checks while your view is steady.

## 2026-11-13 - Manifest Version On Every Update

### Improved & Balanced
- **Every update changes the build**: Update scripts now set the new version in every source manifest of the pack as well as in the CHANGELOG, using `python3 scripts/manifest_tools.py --project <folder> --set X.Y.Z`. The tool changes header, metadata, title, module and dependency versions together, keeps every pack UUID, and refuses to lower a version.
- **AI instructions**: The Termux script rules in INSTRUCTIONS.md, PACK_GENERATOR_INSTRUCTIONS.md and the Collect Files for AI Review prompt now require this step.

## 2026-11-13 - Mining Helmet Water Light

### Added

- **Mining Helmet water light**: Cursor Light works on water and underwater.

### Improved & Balanced

- **Mining Helmet dim self light**: The light at you is now level 1 to 3.

## 2026-11-13 - Mining Helmet Light From You

### Improved & Balanced

- **Mining Helmet light from you**: Cursor Light also glows just in front of you so the light looks like it comes from you.

## 2026-11-13 - Mining Helmet Unlimited Cursor Light

### Improved & Balanced

- **Mining Helmet cursor range**: Cursor Light has no distance limit and no longer falls back to the head when nothing is in view.

## 2026-11-13 - Mining Helmet Cursor Light

### Added

- **Mining Helmet cursor light**: The helmet light follows the block you are looking at, with a Head Light subpack to keep the old behavior.

### Improved & Balanced

- **Mining Helmet default mode**: Cursor Light is the default light mode.

## 2026-11-13 - Immortal Pets 1.10.1

### Improved & Balanced

- **Immortal Pets 1.10.1**: Streamlined damage checks and a clearer description page with a How to Use section.

### Fixed

- **Immortal Pets MCPEDL link**: The description page now links to the correct MCPEDL profile.

## 2026-11-13 - Description Page Questions and Notes

### Improved & Balanced
- **Common Questions on the page**: The CurseForge description page now shows the Common Questions section from DESCRIPTION.md instead of leaving it out.
- **Cleaner feature cards**: Each card shows what happens in normal text, and extra notes such as How It Works and Good To Know appear below it in smaller grey text.

## 2026-11-13 - Description Page Title Fix

### Fixed
- **Description pages for every pack**: The CurseForge description page now builds for packs whose DESCRIPTION.md title uses a different dash, a colon, a version tag or no subtitle at all. A missing title falls back to the folder name.
- **Export no longer stops**: A description page that cannot be built now shows a warning instead of failing Collect Files for AI Review.

## 2026-11-13 - CurseForge Description Page

### Added
- **CurseForge description page**: Every pack now gets a ready-to-paste CurseForge page built from its DESCRIPTION.md: a banner with the pack name and tagline, feature cards, short install steps, a compatibility table and collapsed permissions. It uses only the HTML and styling CurseForge supports. The Verification line stays in DESCRIPTION.md and is not shown on the page.

### Improved & Balanced
- **One AI export**: Collect Files for AI Review is now a single mode. Type pack folders in paths and get the pack as one .txt plus one tools .txt, or type NEW for a new-pack kit. The separate Pack Creator Kit toggle is gone.

## 2026-11-12 - Short Pack Filenames

### Added
- **Short package names**: Every package is now named like `MiningHelmet V1.0.2.mcaddon`, a short name close to the add-on name followed by the version. The long "by ALNStudios" part, hyphens, underscores and parentheses are gone, so imports no longer fail on long file names.
- **Rename run**: `scripts/rename_packages.py` renames every existing package, including saved version snapshots, and fixes every README and build file that mentioned the old names.

### Improved & Balanced
- **CurseForge uploads**: The uploaded file uses the same short name instead of the long "Release - ... v(1.0.0)" name.

### Fixed
- **README links**: Download links in READMEs now follow the new short names.

## 2026-11-12 - Emissive Glowing Ores source added

### Added
- **Emissive Glowing Ores by ALNStudios**: Resource Pack source for glowing ore veins with no light emission, plus the script that builds the package.

## 2026-11-12 - Names On Every Changelog

### Added
- **Repository changelog**: This file now tracks every repo-wide change, one named entry per update.
- **Entry names**: Every changelog heading, in packs and here, now ends with a short name saying what is new.
- **AI review bundle**: The Collect Files for AI Review bundle now includes this changelog.

### Improved & Balanced
- **Publish grouping**: Grouped CurseForge changelogs now list the names of the updates they include.
- **Changelog views**: GitHub and CurseForge changelog views show each entry name.

## 2026-11-12 - Passive Build, Separate Publish, Delete Package

### Added
- **Publish to CurseForge**: Publishing is now its own workflow. It does not bump versions; it uploads the newest changelog version and groups every entry since the last publish.
- **Delete Package**: Deletes a package and everything it touches: builds, changelog views, CurseForge registry entry, catalog rows, overview section, badge count and publish dropdown option.
- **Self-deleting scripts**: Update scripts remove themselves after a successful push.

### Improved & Balanced
- **Build Changed Packs & Sync Catalogs**: Runs on every push, always builds all packs, and never bumps a version.

### Fixed
- **Delete workflow**: It no longer crashes after deleting files, and it writes a correct Collection Size badge.
- **Publish version**: The new version can no longer land below the changelog entries it groups.
