# One-time per-player void cleanup and spawn setup for Dirtbound.
# Test fixes by importing the rebuilt Creative world as a new world; existing worlds keep their saved pack and player tags.
# Clear the full 33x33 square on Y=-64, from X/Z -16 through +16 (not just 0 through 15), then establish the starting block and spawn.
execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 0 1 0
execute as @a[tag=!void_cleaned] run setblock 0 -1 0 bedrock
execute as @a[tag=!void_cleaned] run setblock 0 0 0 minecraft:grass_block
execute as @a[tag=!void_cleaned] run setworldspawn 0 1 0
execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tellraw @s {"rawtext":[{"text":"§aDone cleaning"}]}
execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned
