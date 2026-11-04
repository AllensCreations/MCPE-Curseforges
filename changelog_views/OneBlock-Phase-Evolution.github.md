# Changelog — OneBlock Phase Evolution

## [1.0.0] - 2026-11-03

### Added
- **Automatic Team Inventory**: Combined main inventory, armor, offhand, and Ender Chest for eligible multiplayer participants.
- **Persistent shared items**: Restored shared inventory after world restarts and dropped shared main inventory and equipment once when a participant dies.
- **Twelve cumulative phases**: Expanded the regenerating block pool as the shared break counter reaches progression milestones.

### Improved & Balanced
- **Two-tick synchronization**: Kept the shared inventory responsive while avoiding a full inventory scan every single tick.
- **Weighted resource pool**: Kept all unlocked phases eligible, with the newest phase receiving the highest phase-selection weight.

### Fixed
- **Separate progression state**: Kept the OneBlock break counter independent from shared inventory storage.
