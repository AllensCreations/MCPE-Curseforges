# Changelog — Trivia Vault: The Locked World

---

## [Unreleased]

### Fixed
- Reverted crafting interception so crafting remains unchanged.
- Prevented rapid or instant-break block interactions from opening multiple trivia forms for the same player.
- Made death immediately close the run, clear open questions, and stop further trivia handling.

### Changed
- Trivia questions now appear directly, without the extra “Answer the question” screen.
- Removed hints and lifelines.


## [1.0.18] - 2026-10-29

### Improved & Balanced

- **Maintenance release**: Repackaged the pack; no gameplay changes were recorded.

## [1.0.14] - 2026-10-28

### Added
- Added a selectable Hardmode behavior-pack subpack.
- Added crafting unlock questions: crafted outputs of locked item types are held until a correct answer, then returned and unlocked.

### Improved & Balanced
- Hardmode disables lifelines and adds damage after wrong-answer penalties.
- Normal mode retains three hint lifelines.
- Preserved the 20-block-radius limit for matching-block removal.

## [1.0.13] - 2026-10-28

### Added
- Added five sample questions across general knowledge and Minecraft.
- Added randomized answer placement for each question.
- Changed permanent unlocks from individual coordinates to block types.
- Updated player instructions for the sample question bank and block-type progression.

### Improved & Balanced
- Removed item and experience rewards; unlocking the block type is the only reward.
- Added a randomized consequence that removes matching blocks within a 20-block radius of the targeted block.
- Kept hint lifelines without removing answer choices.
