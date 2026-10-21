# OneBlock: Dirtbound Kingdom Beta (v0.1.20)

Download a OneBlock world for Minecraft Bedrock Edition. Creative, Survival, and Hardcore worlds are rebuilt automatically using their matching references in Mcpeworlds/.

## World Downloads

**[Download Creative World (MCWORLD)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/MCPEDL/maps/OneBlock-Dirtbound-Kingdom-Beta/OneBlock%20Dirtbound%20Kingdom%20Beta%20-%20Creative.mcworld)**

Use Creative as the only tester for checking the starting block, footing, spawn, Trader access, OneCoins, selling, purchases, and progression.

**[Download Survival World (MCWORLD)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/MCPEDL/maps/OneBlock-Dirtbound-Kingdom-Beta/OneBlock%20Dirtbound%20Kingdom%20Beta%20-%20Survival.mcworld)**

**[Download Hardcore World (MCWORLD)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/MCPEDL/maps/OneBlock-Dirtbound-Kingdom-Beta/OneBlock%20Dirtbound%20Kingdom%20Beta%20-%20Hardcore.mcworld)**

World archives are regenerated automatically after map-source or reference changes. Edit the Creative, Survival, and Hardcore source folders directly under Mcpeworlds/. There are no duplicate .mcworld.zip files or nested Extracted/ folder. The current references do not contain LevelDB, so the builder uses a separate complete world only as a database carrier. Mode settings come from the matching reference, but terrain/chunks may differ from it. Structural validation does not prove the map works in Minecraft.

## Creative Test Checklist

1. Import the newly generated Creative world as a **new world**. Importing an updated world archive does not update an already-imported Minecraft world.
2. Confirm the OneBlock core is at **0 0 0**, Bedrock is directly below at **0 -1 0**, and world spawn is **0 1 0**.
3. Confirm the initial cleanup clears the 33 × 33 square from **-16 -64 -16** through **16 -64 16**, on the single layer **Y = -64**.
4. Break the central block and verify that it returns and advances through the stages correctly.
5. Confirm the permanent Trader Post is at **2 1 0**, then test the Trader Ledger, OneCoins balance, Dirt selling, purchases, and progression.
6. Check that the block remains in place without teleporting players.
7. Report any failure before treating the mechanics as verified.

For gameplay details and known testing limitations, read [DESCRIPTION.md](DESCRIPTION.md).
