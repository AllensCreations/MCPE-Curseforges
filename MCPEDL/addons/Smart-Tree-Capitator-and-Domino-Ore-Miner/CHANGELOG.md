# Changelog — Smart Tree Capitator and Domino Ore Miner

## [1.0.6] - 2026-10-16

### Added & Improved
- **The Leaf Scan (Player-Placed Leaves Ignored)**: Overworld tree canopy detection now evaluates natural leaf growth. Decorative leaves placed by players (sheared leaves) are recognized as custom decorations and completely ignored, protecting custom hedges, bushes, and decorative roof foliage from falsely triggering tree felling. Only naturally grown leaves and Nether canopies validate the tree canopy.
- **Mobile-Friendly Documentation**: Upgraded documentation to mobile card format for responsive viewing and integrated search keywords for discoverability.

---

## [1.0.5] - 2026-10-15

### Changed
- **Tree Capitator 26-Neighbor 3D Flood Fill**:
  - Upgraded tree log detection to a unified upward-biased 26-neighbor 3D breadth-first search (`dx, dy, dz ∈ [-1, 0, 1]` with `dy >= 0`).
  - Seamlessly fells contiguous straight trunks, complex diagonal branches (Acacia, Cherry, Large Oak), and sprawling mega trees in a single tick.
  - Maintains strict wood species matching (`isMatchingLog`) so adjacent trees of different species are untouched.
  - Preserves **House Protection** (`isTreeCanopy`), requiring leaf, wart block, or shroomlight canopy presence to prevent accidental felling of wooden builds and log cabins.

---

## [1.0.4] - 2026-10-15

### Added
- **Initial Release & Integration**:
  - Sneak-activated Tree Capitator with 128-block maximum tree capacity.
  - 26-neighbor contiguous Domino Ore Miner with stone/deepslate category normalization up to 64 blocks.
  - Durability Safety Guard stopping chain mining when tool reaches 5 durability.
  - Built-in Unbreaking enchantment calculations and Silk Touch / Fortune support.
