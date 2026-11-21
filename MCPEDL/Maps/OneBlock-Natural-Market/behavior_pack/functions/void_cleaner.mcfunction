execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 0 65 0
execute as @a[tag=!void_cleaned] if block 0 63 0 bedrock run setblock 0 63 0 air
execute as @a[tag=!void_cleaned] if block 0 64 0 air run setblock 0 64 0 minecraft:grass_block
execute as @a[tag=!void_cleaned] run setworldspawn 0 65 0
execute as @a[tag=!void_cleaned] run tellraw @s {"rawtext":[{"text":"§aOneBlock Natural Market is ready."}]}
execute as @a[tag=!void_cleaned] unless block 0 64 0 air run tag @s add void_cleaned
