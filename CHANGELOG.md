# Changelog — MCPE-Curseforges (whole repository)

---

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
