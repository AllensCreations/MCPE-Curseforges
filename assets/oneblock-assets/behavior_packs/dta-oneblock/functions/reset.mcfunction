# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!
tickingarea add 13568 2 13599  13583.30 52.17 13584.86 Harsh-dta false
 
execute unless entity @e[type=armor_stand,tag=DtA,r=2,x=13582,y=4,z=13585] run summon armor_stand 13582 4 13585
execute unless entity @e[type=armor_stand,tag=DtA,r=2,x=13578,y=3,z=13593] run summon armor_stand 13578 3 13593
execute unless entity @e[type=armor_stand,tag=DtA,r=2,x=13578,y=3,z=13596] run summon armor_stand 13578 3 13596
say Your One Block is resetted!

scoreboard objectives remove ticker
scoreboard objectives remove Block_place_rand
scoreboard objectives remove mob_rand
scoreboard objectives remove mob_rando
scoreboard objectives remove dta_level
scoreboard objectives remove ADHMY
scoreboard objectives remove Block_Count
scoreboard objectives remove devansh-ticker
scoreboard objectives remove tickerMod20
scoreboard objectives remove rand_chest
scoreboard objectives remove chest_adhmy
scoreboard objectives remove level_rand
scoreboard objectives remove infinite_chest

execute unless entity @e[type=armor_stand,tag=DtA,dx=0,dy=0,dz=0,x=13582,y=4,z=13585] run tag @e[type=armor_stand,r=2,x=13582,y=4,z=13585] add DtA
execute unless entity @e[type=armor_stand,tag=DtA,r=2,x=13578,y=3,z=13593] run tag @e[type=armor_stand,r=2,x=13578,y=3,z=13593] add DtA_Chest
execute unless entity @e[type=armor_stand,tag=DtA,r=2,x=13578,y=3,z=13596] run tag @e[type=armor_stand,r=2,x=13578,y=3,z=13596] add DtA_Barrel