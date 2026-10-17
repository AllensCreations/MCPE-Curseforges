# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# Plains

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=DtA] Block_place_rand 1 100
scoreboard players random @e[type=armor_stand,tag=DtA] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=1..40}] at @s run setblock 0 50 0 grass_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=41..50}] at @s run setblock 0 50 0 dirt
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=51..60}] at @s run setblock 0 50 0 mycelium
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=61..70}] at @s run setblock 0 50 0 dirt_with_roots
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=71..75}] at @s run setblock 0 50 0 oak_log
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=76..80}] at @s run setblock 0 50 0 birch_log
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=81..83}] at @s run setblock 0 50 0 oak_leaves
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=84..86}] at @s run setblock 0 50 0 birch_leaves
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=87..91}] at @s run setblock 0 50 0 hay_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=92..94}] at @s run setblock 0 50 0 clay
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=95}] at @s run setblock 0 50 0 bone_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=96..97}] at @s run setblock 0 50 0 gravel
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=98..100}] at @s run setblock 0 50 0 pumpkin

execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=12..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=DtA] level_rand 1
execute as @e[type=armor_stand,tag=DtA,scores={level_rand=1}] at @s run scoreboard players random @e[type=armor_stand,tag=DtA] mob_rand 1 11

# Tiny Takeover - Baby Mobs (Plains)
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] at @s run summon chicken 0 52 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon cow 0 52 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon sheep 0 52 0 ~~ minecraft:entity_born
# Regular Mobs
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=4,mob_rando=3}] run summon cow 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=5,mob_rando=3}] at @s run summon chicken 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] at @s run summon pig 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] at @s run summon mooshroom 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] at @s run summon sheep 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] at @s run summon goat 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] at @s run summon armadillo 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] at @s run summon armadillo 0 52 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] at @s run summon zombie_horse 0 52 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=69}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=131}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=188}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=234}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=289}] run function chest-barrels/chest
