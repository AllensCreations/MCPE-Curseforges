execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 0 1 0
execute as @a[tag=!void_cleaned] run setblock 0 -1 0 bedrock
execute as @a[tag=!void_cleaned] run setblock 0 0 0 minecraft:grass_block
execute as @a[tag=!void_cleaned] run setworldspawn 0 1 0
execute as @a[tag=!void_cleaned] run tellraw @a {"rawtext":[{"text":"§aDone cleaning"}]}
tag @a[tag=!void_cleaned] add void_cleaned