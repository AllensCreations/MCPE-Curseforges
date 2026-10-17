# Jai Shree Ram # Om namah shivay!

execute unless entity @e[type=armor_stand,tag=OneBlockAnchor,r=2,x=13582,y=4,z=13585] run function reset
#Particle & Tp sys
particle minecraft:cauldron_explosion_emitter 0 50.50 0 
scoreboard players add @e[type=minecraft:armor_stand,tag=OneBlockAnchor] Block_Count 1

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1..35}] unless block 0 50 0 gravel run setblock 0 50 0 minecraft:grass_block

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=35}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 1
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=300}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 2
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=500}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 3
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=750}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 4
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1250}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 5
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1550}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1950}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 7
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2200}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 8
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2550}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 9
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2750}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 10
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3000}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 11
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3350}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 12
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3650}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 13
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3850}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 14
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4300}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 15
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4650}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] ob_level 16

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=35}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=300}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6 
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=500}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=750}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1250}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1550}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1950}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2200}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2550}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2750}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3000}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3350}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3650}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3850}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4300}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4650}] run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] rand_chest 1 6

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=35}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=300}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=500}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=750}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1250}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1550}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1950}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2200}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2550}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2750}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3000}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3350}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3650}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3850}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4300}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4650}] run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] chest_adhmy 0

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=35}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=300}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=500}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=750}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1250}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1550}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1950}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2200}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2550}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2750}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3000}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3350}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3650}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3850}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4300}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4650}] run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 0

execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=35}] run function ob-l-upg
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=300}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=500}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=750}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1250}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1550}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=1950}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2200}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2550}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=2750}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3000}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3350}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3650}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3850}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4300}] run setblock 0 50 0 bedrock
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4650}] run setblock 0 50 0 bedrock

function r-text
function chest-barrels/barrel