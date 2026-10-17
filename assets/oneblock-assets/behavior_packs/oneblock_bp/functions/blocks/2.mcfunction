# Jai Shree Ram # Om namah shivay!

# UnderGround

# Random values (converted)
scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] Block_place_rand 1 100
scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rando 1 17
scoreboard players add @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..40}] run setblock 0 50 0 minecraft:stone
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=41..50}] run setblock 0 50 0 minecraft:gravel
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=51..58}] run setblock 0 50 0 minecraft:iron_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=59..65}] run setblock 0 50 0 minecraft:copper_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=66..72}] run setblock 0 50 0 minecraft:oak_log
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=73..79}] run setblock 0 50 0 minecraft:oak_planks
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=80..86}] run setblock 0 50 0 minecraft:oak_fence
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=87..100}] run setblock 0 50 0 minecraft:coal_ore

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=10..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor] level_rand 2
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={level_rand=2}] at @s run scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 1 9

# Tiny Takeover - Baby Mob (Underground)
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon minecraft:zombie 0 51.5 0 ~~ minecraft:as_baby
# Regular Mobs
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon minecraft:zombie 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon minecraft:zombie 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon minecraft:spider 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon minecraft:skeleton 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=5..6,mob_rando=3}] run summon minecraft:skeleton 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon minecraft:cow 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=8,mob_rando=3}] run summon minecraft:pig 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon minecraft:chicken 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=331}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=378}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=444}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=496}] run function chest-barrels/chest
