# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# Ocean

setblock 0 50 0 prismarine

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=DtA] Block_place_rand 1 115
scoreboard players random @e[type=armor_stand,tag=DtA] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=1}] run setblock 0 50 0 tube_coral
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=2}] run setblock 0 50 0 brain_coral
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=3}] run setblock 0 50 0 bubble_coral
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=4}] run setblock 0 50 0 fire_coral
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=5}] run setblock 0 50 0 horn_coral
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=6..10}] run setblock 0 50 0 dirt
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=11..15}] run setblock 0 50 0 sand
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=16..20}] run setblock 0 50 0 gravel
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=21..25}] run setblock 0 50 0 prismarine
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=26..30}] run setblock 0 50 0 prismarine_bricks
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=31..35}] run setblock 0 50 0 dark_prismarine
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=36..40}] run setblock 0 50 0 sea_lantern
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=41}] run setblock 0 50 0 water
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=42..45}] run setblock 0 50 0 sponge
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=46}] run setblock 0 50 0 seagrass
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=47..50}] run setblock 0 50 0 sea_pickle
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=51..55}] run setblock 0 50 0 coal_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=56..60}] run setblock 0 50 0 iron_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=61..65}] run setblock 0 50 0 redstone_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=66..70}] run setblock 0 50 0 lapis_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=71..72}] run setblock 0 50 0 gold_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=73..75}] run setblock 0 50 0 diamond_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=76..85}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=86..90}] run setblock 0 50 0 deepslate_redstone_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=91..94}] run setblock 0 50 0 deepslate_lapis_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=95..97}] run setblock 0 50 0 deepslate_gold_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=98}] run setblock 0 50 0 deepslate_diamond_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=99..100}] run setblock 0 50 0 gold_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=101}] run setblock 0 50 0 sulfur
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=102..105}] run setblock 0 50 0 cinnabar
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=106..110}] run setblock 0 50 0 potent_sulfur
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=111..115}] run setblock 0 50 0 sulfur_spike


execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=17..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=DtA,scores={mob_rando=3},tag=DtA] level_rand 8
execute as @e[type=armor_stand,tag=DtA,scores={level_rand=8}] at @s run scoreboard players random @e[type=armor_stand,tag=DtA] mob_rand 1 16

# Tiny Takeover - Baby Mobs (Ocean)
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] run setblock 0 50 0 water
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] run summon dolphin 0 50.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon turtle 0 50.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon glow_squid 0 50.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=4,mob_rando=3}] run summon drowned 0 50.5 0 ~~ minecraft:as_baby
# Regular Mobs
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=5,mob_rando=3}] run summon nautilus 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon dolphin 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon dolphin 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon turtle 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon turtle 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run summon pufferfish 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] run summon tropicalfish 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] run summon cod 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] run summon salmon 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=12,mob_rando=3}] run summon glow_squid 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=12,mob_rando=3}] run summon glow_squid 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run summon squid 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run summon drowned 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon guardian 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon guardian 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon guardian 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=15,mob_rando=3}] run summon elder_guardian 0 50.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=16,mob_rando=3}] run summon zombie_nautilus 0 50.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=2272}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=2339}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=2395}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=2491}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=2548}] run function chest-barrels/chest
