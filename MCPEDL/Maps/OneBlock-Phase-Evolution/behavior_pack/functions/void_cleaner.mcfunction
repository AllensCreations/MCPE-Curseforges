execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] at @s run tp @s 0 1 0
execute as @a[tag=!void_cleaned] run setblock 0 -1 0 bedrock
execute as @a[tag=!void_cleaned] if block 0 0 0 air run setblock 0 0 0 grass_block
execute as @a[tag=!void_cleaned] run setworldspawn 0 1 0
execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tellraw @s {"rawtext":[{"text":"Your OneBlock world is ready."}]}
execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned
