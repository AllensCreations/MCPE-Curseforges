# Jai Shree Ram # Om namah shivay!

# Ancient City

setblock 0 50 0 minecraft:deepslate

# Random values (converted)
scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] Block_place_rand 1 150
scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rando 1 15
scoreboard players add @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..30}] run setblock 0 50 0 minecraft:stone
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=31..40}] run setblock 0 50 0 minecraft:calibrated_sculk_sensor
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=41..45}] run setblock 0 50 0 minecraft:sculk_sensor
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=46..60}] run setblock 0 50 0 minecraft:deepslate
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=61..68}] run setblock 0 50 0 minecraft:sculk_catalyst
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=69..75}] run setblock 0 50 0 minecraft:sculk
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=76..78}] run setblock 0 50 0 minecraft:sculk_vein
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=79..85}] run setblock 0 50 0 minecraft:copper_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=86..90}] run setblock 0 50 0 minecraft:iron_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=91..95}] run setblock 0 50 0 minecraft:lapis_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=96..100}] run setblock 0 50 0 minecraft:redstone_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=101..105}] run setblock 0 50 0 minecraft:gold_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=106..110}] run setblock 0 50 0 minecraft:diamond_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=111..115}] run setblock 0 50 0 minecraft:deepslate_redstone_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=116..120}] run setblock 0 50 0 minecraft:deepslate_gold_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=121..125}] run setblock 0 50 0 minecraft:deepslate_iron_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=126..130}] run setblock 0 50 0 minecraft:deepslate_coal_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=131..140}] run setblock 0 50 0 minecraft:deepslate
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=141..146}] run setblock 0 50 0 minecraft:gravel
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=147..149}] run setblock 0 50 0 minecraft:deepslate_diamond_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=150}] run setblock 0 50 0 minecraft:lava

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=13..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3},tag=OneBlockAnchor] level_rand 14
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={level_rand=14}] at @s run scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 1 12

# Regular Mobs
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon axolotl 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon drowned 0 51.5 0 ~~ minecraft:as_baby
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon zombie 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon skeleton 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon axolotl 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon zombie_villager 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=8,mob_rando=3}] run summon spider 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon bat 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon copper_golem 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=11,mob_rando=3}] run summon sulfur_cube 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=11..12,mob_rando=3}] run summon sulfur_cube 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3923}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3995}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4062}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4133}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4206}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4259}] run function chest-barrels/chest
execute at @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4252}] run summon minecraft:warden 0 51 0
