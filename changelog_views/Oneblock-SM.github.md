# Changelog — OneBlock Sovereign Market

## [1.6.0] - 2026-10-29

### Fixed
- **Auto-Miner Without Setup**: The Auto-Miner no longer needs the welcome setup to have run for your character. It works for any player in the Overworld.
- **Auto-Miner Never Stalls**: A mined block that has no item form no longer stops the Auto-Miner as if the chest were full. It is skipped and mining continues.

<details>
<summary><b>1.5.x</b> (1 release)</summary>

### [1.5.0] - 2026-10-29

#### Fixed
- **Auto-Miner Start**: The Auto-Miner now mines whatever block is at the OneBlock position as soon as it is ON, without waiting for a hand break first.
- **Auto-Miner Warnings**: If a block above the OneBlock stops the collection chest from being placed, the Auto-Miner now tells you on the action bar instead of silently doing nothing.

</details>

<details>
<summary><b>1.4.x</b> (1 release)</summary>

### [1.4.0] - 2026-10-29

#### Fixed
- **Continuous Auto-Mining**: The Auto-Miner now moves straight on to the next block at its tool speed. A break that could not happen, such as while the OneBlock was being replaced, is retried on the next tick instead of after a full wait, and mining time no longer runs while the collection chest is full.

</details>

<details>
<summary><b>1.3.x</b> (1 release)</summary>

### [1.3.0] - 2026-10-29

#### Improved & Balanced
- **Tool-Named Auto-Miner**: The five Auto-Miner levels are now Wooden, Copper, Iron, Gold and Diamond. Speeds and prices are unchanged.

#### Fixed
- **Auto-Miner Break Effect**: Every Auto-Miner break now plays the block-destroy effect. Before, the two fastest levels showed it only on every fourth break.
- **Island Border Outside the Permit**: The border ring is now placed just outside the permitted area, so it can no longer be mined for Polished Deepslate. Rings left by earlier permits are removed when you buy the next one.

</details>

<details>
<summary><b>1.2.x</b> (1 release)</summary>

### [1.2.0] - 2026-10-29

#### Improved & Balanced
- **Auto-Miner Stone Drops**: The Auto-Miner now stores Cobblestone when the OneBlock is Stone, like mining by hand.
- **Island Size Check**: Placing, breaking and using blocks no longer rereads the saved world data to find the island size.

#### Fixed
- **Water and Lava Cleanup on Large Islands**: On islands of 81 x 81 and larger, stray water and lava were not removed. Cleanup now works on every island size.
- **Auto-Miner Toggle**: Switching the Auto-Miner ON and OFF repeatedly gave extra instant breaks. Each instant break now uses part of the day's mining time.
- **Auto-Miner Drops**: Deepslate, Clay, Melon, Nether Gold Ore, Mycelium and mushroom blocks mined by the Auto-Miner now become items the market buys.
- **Island Permit Charge**: A permit is no longer charged when part of the new border area is not loaded. You are asked to stand near the OneBlock and try again.
- **OneBlock Respawn**: The OneBlock could stay missing after being broken if an error happened while the next block was being created. It now recovers.
- **Plot Edge Protection**: Boats, minecarts, armor stands, item frames, paintings, end crystals, spawn eggs, flint and steel and fire charges can no longer be used at the edge of your island to place things outside the permitted area.
- **OneBlock Explosion Protection**: Explosions no longer destroy the OneBlock, the chest above it or the foundation Bedrock.

</details>
