# Show each player's current OneCoins balance as actionbar text.
execute as @a[tag=void_cleaned] run titleraw @s actionbar {"rawtext":[{"text":"§6Dirtbound §8| §eBalance: §f"},{"score":{"name":"@s","objective":"dirtbound_coins"}},{"text":" §6OneCoins"}]}
