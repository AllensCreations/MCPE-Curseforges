execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 0.5 65 0.5
execute as @a[tag=!void_cleaned] run fill 0 -64 0 0 64 0 bedrock keep
execute as @a[tag=!void_cleaned] run setworldspawn 0 65 0
execute as @a[tag=!void_cleaned] if block 0 64 0 bedrock run tag @s add void_cleaned
