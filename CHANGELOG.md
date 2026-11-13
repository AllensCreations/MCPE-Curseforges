# Changelog — MCPE-Curseforges (whole repository)

---

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
