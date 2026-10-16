# Changelog — Smart Tree Capitator and Domino Ore Miner

All notable changes to the **Smart Tree Capitator and Domino Ore Miner** add-on by AllensCreations will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
