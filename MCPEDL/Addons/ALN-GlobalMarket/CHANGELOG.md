# Changelog — ALN-GlobalMarket

---

## [1.0.1] - 2026-11-21 - Icon Fixes

### Added
- **Payment Item Checks**: Air and other items that cannot be held are now rejected as payment.

### Improved & Balanced
- **Payment Limits**: The payment amount is capped by how many of that item fit in an inventory, so unstackable items cannot flood the world.

### Fixed
- **Missing Icons**: Listings now show icons only for items with a known icon, so the purple and black placeholder squares are gone.

## [1.0.0] - 2026-11-19 - Initial Release

### Added
- **Global Market**: Rename a Book to "Player Trade" on an Anvil and use it to open the market from anywhere.
- **Sell and Purchase**: List items for barter, browse listings with filters, sorting and search, and buy from a details screen.
- **Offline Payouts**: Sellers receive their payment when they next join if they were offline during the sale.

### Improved & Balanced
- **Unmodified Items Only**: Enchanted, renamed, damaged and container items cannot be listed, so nothing is lost in escrow.

### Fixed
- **Safe Purchases**: A listing that sold while you were browsing can no longer be bought twice.
