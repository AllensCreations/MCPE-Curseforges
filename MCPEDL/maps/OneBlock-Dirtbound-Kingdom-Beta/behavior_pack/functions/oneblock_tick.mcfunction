# Critical recovery path: never depend on a scoreboard objective to place the first block or set world spawn.
# This changes the world's spawn location only; it does not teleport current players.
setworldspawn 0 65 0
gamerule spawnradius 0

# Keep the starting footing and permanent Trader Post available.
execute if block 0 63 0 air run setblock 0 63 0 bedrock
execute if block 2 65 0 air run setblock 2 65 0 barrel

# Restore the evolved OneBlock first when stage data is available.
execute if score #stage dirtbound_core matches 0 if block 0 64 0 air run setblock 0 64 0 dirt
execute if score #stage dirtbound_core matches 1 if block 0 64 0 air run setblock 0 64 0 stone
execute if score #stage dirtbound_core matches 2 if block 0 64 0 air run setblock 0 64 0 cobblestone
execute if score #stage dirtbound_core matches 3 if block 0 64 0 air run setblock 0 64 0 iron_ore
execute if score #stage dirtbound_core matches 4 if block 0 64 0 air run setblock 0 64 0 gold_ore
execute if score #stage dirtbound_core matches 5 if block 0 64 0 air run setblock 0 64 0 diamond_ore
execute if score #stage dirtbound_core matches 6 if block 0 64 0 air run setblock 0 64 0 ancient_debris
execute if score #stage dirtbound_core matches 7 if block 0 64 0 air run setblock 0 64 0 obsidian
execute if score #stage dirtbound_core matches 8 if block 0 64 0 air run setblock 0 64 0 crying_obsidian
execute if score #stage dirtbound_core matches 9 if block 0 64 0 air run setblock 0 64 0 netherite_block

# Last-resort fallback must come after stage-specific restoration.
execute if block 0 64 0 air run setblock 0 64 0 dirt
