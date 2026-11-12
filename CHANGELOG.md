# Changelog — MCPE-Curseforges (whole repository)

---

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
