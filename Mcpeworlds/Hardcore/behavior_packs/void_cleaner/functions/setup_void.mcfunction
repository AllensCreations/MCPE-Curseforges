# First-join cleanup: clear only the 33x33 square on Y=-64, centered on X/Z=0.
execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 0 1 0
execute as @a[tag=!void_cleaned] run setblock 0 -1 0 bedrock
execute as @a[tag=!void_cleaned] run setblock 0 0 0 minecraft:grass_block
execute as @a[tag=!void_cleaned] run setworldspawn 0 1 0
execute as @a[tag=!void_cleaned] run tellraw @a {"rawtext":[{"text":"§aDone cleaning"}]}
execute as @a[tag=!void_cleaned] run execute if block 2 1 0 air run setblock 2 1 0 barrel
tag @a[tag=!void_cleaned] add void_cleaned
