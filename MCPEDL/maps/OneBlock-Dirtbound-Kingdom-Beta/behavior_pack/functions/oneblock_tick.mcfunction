# One-time platform setup. The core is at y=64, the bedrock footing at y=63, and world spawn is one block above the core.
execute unless score #setup dirtbound_core matches 1 run setworldspawn 0 65 0
execute unless score #setup dirtbound_core matches 1 run setblock 0 63 0 bedrock
execute unless score #setup dirtbound_core matches 1 run setblock 0 64 0 dirt
execute unless score #setup dirtbound_core matches 1 run scoreboard players set #setup dirtbound_core 1

# Keep the bedrock footing and trader station present.
execute if block 0 63 0 air run setblock 0 63 0 bedrock
execute if block 2 65 0 air run setblock 2 65 0 barrel

# Restore the evolved OneBlock after mining. Stage zero and the fallback are Dirt.
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
execute if block 0 64 0 air run setblock 0 64 0 dirt
