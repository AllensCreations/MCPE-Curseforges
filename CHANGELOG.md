# Changelog — MCPE-Curseforges (whole repository)

---

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
