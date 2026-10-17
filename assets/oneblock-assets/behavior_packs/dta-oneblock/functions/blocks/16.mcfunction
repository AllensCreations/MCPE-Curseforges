# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# The Infinite

scoreboard players random @e[type=minecraft:armor_stand,tag=DtA] level_rand 1 15
scoreboard players random @e[type=minecraft:armor_stand,tag=DtA] infinite_chest 1 1000
scoreboard players random @e[type=minecraft:armor_stand,tag=DtA] rand_chest 1 6

execute at @e[type=minecraft:armor_stand,tag=DtA,scores={chest_adhmy=6}] run scoreboard players set @e[type=minecraft:armor_stand,tag=DtA] chest_adhmy 0

execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=1}] run function blocks/1
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=2}] run function blocks/2
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=3}] run function blocks/3
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=4}] run function blocks/4
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=5}] run function blocks/5
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=6}] run function blocks/6
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=7}] run function blocks/7
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=8}] run function blocks/8
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=9}] run function blocks/9
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=10}] run function blocks/10
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=11}] run function blocks/11
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=12}] run function blocks/12
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=13}] run function blocks/13
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=14}] run function blocks/14
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=15}] run function blocks/15

execute at @e[type=minecraft:armor_stand,tag=DtA,scores={infinite_chest=1}] run function chest-barrels/chest
