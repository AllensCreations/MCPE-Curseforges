# Jai Shree Ram # Om namah shivay!

# Deep Cave

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] Block_place_rand 1 140
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

setblock 0 50 0 stone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..3}] run setblock 0 50 0 big_dripleaf
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=4..15}] run setblock 0 50 0 stone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=16..18}] run setblock 0 50 0 small_dripleaf_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=19..40}] run setblock 0 50 0 deepslate
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=41..45}] run setblock 0 50 0 copper_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=46..48}] run setblock 0 50 0 granite
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=49..50}] run setblock 0 50 0 andesite
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=51..52}] run setblock 0 50 0 diorite
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=53..60}] run setblock 0 50 0 dripstone_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=61..62}] run setblock 0 50 0 cave_vines_head_with_berries
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=63..65}] run setblock 0 50 0 calcite
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=66..68}] run setblock 0 50 0 pointed_dripstone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=69..71}] run setblock 0 50 0 amethyst_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=71}] run setblock 0 50 0 budding_amethyst
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=72..73}] run setblock 0 50 0 amethyst_cluster
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=74..78}] run setblock 0 50 0 gravel
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=78..82}] run setblock 0 50 0 clay
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=83..85}] run setblock 0 50 0 deepslate_redstone_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=86..95}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=96..97}] run setblock 0 50 0 deepslate_coal_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=98..99}] run setblock 0 50 0 deepslate_diamond_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=100}] run setblock 0 50 0 lava
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=101..110}] run setblock 0 50 0 deepslate_copper_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=111..117}] run setblock 0 50 0 sulfur
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=118..120}] run setblock 0 50 0 water
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=119..120}] run setblock 0 49 0 potent_sulfur
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=119}] run setblock 0 48 0 lava
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=120}] run setblock 0 48 0 magma
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=121..126}] run setblock 0 50 0 cinnabar
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=127..135}] run setblock 0 50 0 potent_sulfur
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=136..140}] run setblock 0 50 0 sulfur_spike

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=12..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] level_rand 3
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={level_rand=3}] at @s run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rand 1 11

# MOBS
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon sulfur_cube 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=1..2,mob_rando=3}] run summon sulfur_cube 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon axolotl 0 51.50 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon zombie 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=4..5,mob_rando=3}] run summon zombie 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon skeleton 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=5..6,mob_rando=3}] run summon skeleton 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon axolotl 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7..8,mob_rando=3}] run summon axolotl 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon creeper 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon bat 0 51.50 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=11,mob_rando=3}] run summon slime 0 51.50 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=551}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=611}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=689}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=733}] run function chest-barrels/chest
