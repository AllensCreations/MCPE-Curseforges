# Jai Shree Ram # Om namah shivay!

# Teleportation CMD--------
execute as @a at @s if block 0 50 0 minecraft:air positioned ~ ~ ~ if entity @s[x=0,y=50,z=0,dx=0,dy=2,dz=0] run tp @s ~ 51.52 ~
execute as @a at @s if block 0 50 0 minecraft:bedrock run function ob-upg-counter

execute if block 0 50 0 air run function ob-n-block
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1..23}] run kill @e[type=minecraft:item,x=0,y=50,z=0,dx=0,dy=1,dz=0,name=gravel]
scoreboard players add @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ticker 1

# Level System
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=1}] run function blocks/1
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=2}] run function blocks/2
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=3}] run function blocks/3
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=4}] run function blocks/4
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=5}] run function blocks/5
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=6}] run function blocks/6
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=7}] run function blocks/7
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=8}] run function blocks/8
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=9}] run function blocks/9
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=10}] run function blocks/10
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=11}] run function blocks/11
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=12}] run function blocks/12
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=13}] run function blocks/13
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=14}] run function blocks/14
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=15}] run function blocks/15
execute if block 0 50 0 air at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ob_level=16}] run function blocks/16

execute as @e[type=minecraft:item,x=0,y=50,z=0,dx=0,dy=1,dz=0] at @s run tp @s 0 51.5 0
execute as @e[type=minecraft:item,x=0,y=50,z=0,dx=0,dy=1,dz=0] at @s run tp @s 0 51.5 0
execute as @e[type=minecraft:item,x=0,y=50,z=0,dx=0,dy=1,dz=0] at @s run tp @s 0 51.5 0

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10}] run particle minecraft:end_chest 0 51 0

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10}] positioned 0 50.10 0 if block 0 50 0 minecraft:barrel run particle minecraft:heart_particle ~0.3 ~1.2 ~-0.4
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10}] positioned 0 50.10 0 if block 0 50 0 minecraft:barrel run particle minecraft:heart_particle ~-0.5 ~0.9 ~0.2
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10}] positioned 0 50.10 0 if block 0 50 0 minecraft:barrel run particle minecraft:heart_particle ~0.1 ~1.4 ~0.5
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10}] positioned 0 50.10 0 if block 0 50 0 minecraft:barrel run particle minecraft:heart_particle ~-0.2 ~1.1 ~-0.3
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10}] positioned 0 50.10 0 if block 0 50 0 minecraft:barrel run particle minecraft:heart_particle ~0.5 ~1.0 ~0.1

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={ticker=10..}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ticker 0

scoreboard objectives add ticker dummy d 
scoreboard objectives add Block_place_rand dummy dd
scoreboard objectives add mob_rand dummy dddd
scoreboard objectives add mob_rando dummy dy
scoreboard objectives add ob_level dummy AllensCreations
scoreboard objectives add ADHMY dummy OB_Chest
scoreboard objectives add Block_Count dummy OneBlock
scoreboard objectives add devansh-ticker dummy dzd
scoreboard objectives add rand_chest dummy OneBlock
scoreboard objectives add chest_adhmy dummy dydd
scoreboard objectives add level_rand dummy OB_Chest
scoreboard objectives add infinite_chest dummy dx

gamerule sendcommandfeedback false
gamerule commandblockoutput false

execute at @a[tag=!ob_joined] run spawnpoint @s 0 52 0
tp @a[tag=!ob_joined] 0 52 0
tag @a[tag=!ob_joined] add ob_joined