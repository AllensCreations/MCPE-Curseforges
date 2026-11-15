export const BANKS = {
  mob: ["creeper", "zombie", "skeleton", "enderman", "witch", "pillager", "phantom", "drowned", "piglin brute", "blaze", "ghast", "slime", "husk", "vindicator", "warden", "wither skeleton"],
  block: ["deepslate", "obsidian", "copper", "amethyst", "netherrack", "glowstone", "quartz", "sculk", "moss", "tuff", "basalt", "calcite", "dripstone", "prismarine", "concrete"],
  biome: ["cherry grove", "dark forest", "badlands", "mangrove swamp", "frozen peaks", "lush cave", "jungle", "desert", "mushroom island", "deep dark", "savanna", "taiga", "meadow", "ocean", "nether wastes"],
  build: ["castle", "treehouse", "lighthouse", "bridge", "tower", "market", "statue", "harbor", "tunnel", "monument", "farm hub", "cathedral", "windmill", "railway station", "dock"],
  farm: ["iron farm", "wheat farm", "gold farm", "sugar cane farm", "mob farm", "villager breeder", "kelp farm", "bamboo farm", "melon farm", "chicken farm", "tree farm", "sheep farm"],
  tool: ["pickaxe", "sword", "trident", "elytra", "shield", "bow", "crossbow", "fishing rod", "shovel", "axe", "spyglass", "mace", "totem", "compass"],
  food: ["golden carrots", "steak", "cake", "pumpkin pie", "baked potatoes", "cookies", "stew", "honey bottles", "apples", "bread"],
  adj: ["huge", "tiny", "cursed", "gorgeous", "messy", "insane", "clean", "unreal", "chunky", "cozy", "sketchy", "legendary"],
  mood: ["so tired", "hyped", "bored", "focused", "chilled", "a little lost", "ready", "curious", "pumped", "sleepy"],
  time: ["an hour", "ten minutes", "two days", "three hours", "half a day", "a week", "twenty minutes", "a long time"],
  num: ["three", "five", "a dozen", "about twenty", "two stacks of", "half a stack of", "way too many", "exactly seven"],
  mat: ["oak", "spruce", "stone bricks", "white concrete", "copper", "dark oak", "cherry planks", "bamboo", "sandstone", "blackstone"],
};

export const EXTRA_OPENERS = ["real talk", "so", "guys", "lowkey", "update:", "side note:", "random but", "plot twist:", "hot take:", "psa:", "ahem", "ok so", "hmm", "alright", "also", "no because", "sorry but", "imagine", "listen", "um"];
export const EXTRA_TAILS = ["right?", "anyone?", "thoughts?", "haha yeah", "i swear", "for real", "no joke", "xd", "lol same", "let's go", "send help", "classic", "so good", "as usual", "again", "honestly same"];

export const EXTRA_CORES = {
  death_creeper: [
    "<PLAYER> that creeper was waiting for you", "did <PLAYER> not hear the hiss", "<PLAYER> now we have a crater to fix",
    "creeper damage on the base again, <PLAYER>?", "<PLAYER> should have hit it first", "another hole in the ground thanks to <PLAYER>",
  ],
  death_lava: [
    "<PLAYER> lava swim champion", "<PLAYER> the lava pool wins again", "<PLAYER> should have kept the fire resistance potion",
    "lava is not a hot tub <PLAYER>", "<PLAYER> that lava came out of nowhere", "<PLAYER> next time place a block first",
  ],
  death_fall: [
    "<PLAYER> took the express route down", "<PLAYER> that cliff was higher than it looked", "water bucket would have saved <PLAYER>",
    "<PLAYER> forgot about fall damage", "<PLAYER> the ground came up fast", "<PLAYER> next time use a slow falling potion",
  ],
  death_mob: [
    "<PLAYER> lost to <CAUSE>, it happens", "<CAUSE> had the upper hand on <PLAYER>", "<PLAYER> did you fight <CAUSE> without armor",
    "<PLAYER> that <CAUSE> hits hard", "<CAUSE> ruined <PLAYER>'s evening", "<PLAYER> bring more food before the next fight",
  ],
  death_void: [
    "<PLAYER> found the edge of the world", "<PLAYER> do not forget your ender chest next time", "the void is hungry today, <PLAYER>",
    "<PLAYER> sorry about the gear", "<PLAYER> keep a bridge block handy", "<PLAYER> that was a long way down",
  ],
  death_generic: [
    "<PLAYER> how did that even happen", "<PLAYER> did you see what killed you", "respawn time <PLAYER>",
    "<PLAYER> that one hurt to watch", "<PLAYER> not your day huh", "<PLAYER> shake it off and go again",
  ],
  death_followup: [
    "i lost a full shulker once, you will be fine", "there is a spare sword in the spawn chest", "i made a bed point near the lava lake, take it",
    "walk slowly back to your items, they stay for five minutes", "i can lend you some food", "we should light up that area",
  ],
  ore_diamond: [
    "<PLAYER> struck diamonds <COORD_HINT>", "<PLAYER> found shiny stuff <COORD_HINT>", "<PLAYER> that is a lot of diamonds <COORD_HINT>",
    "<ITEM> for <PLAYER>, the luck is real", "<PLAYER> is going to craft a full set", "<PLAYER> you are carrying us today",
  ],
  ore_debris: [
    "<PLAYER> got <ITEM>, big upgrade coming", "<PLAYER> that debris is a great find <COORD_HINT>", "netherite armor soon for <PLAYER>",
    "<PLAYER> hit <ITEM>, time to smelt", "<PLAYER> the nether paid you back", "<ITEM> <COORD_HINT>, nice one <PLAYER>",
  ],
  ore_emerald: [
    "<PLAYER> struck emeralds <COORD_HINT>", "<PLAYER> time to trade for mending", "<ITEM> found, <PLAYER> is rich",
    "<PLAYER> emeralds are the best currency", "<PLAYER> the villagers will love you", "<PLAYER> that mountain had a secret",
  ],
  ore_reply: [
    "i will trade you iron for a few of those", "the luck on this server is wild", "mining at y minus 59 pays off", "save me a stack of those",
    "fortune three would have doubled that", "okay i am heading down there now",
  ],
  greeting_anyone: [
    "who is up for a nether run?", "need someone to hold my chest while i sort", "anyone seen my pickaxe?", "who wants to trade?",
    "is the spawn shop open?", "anyone want to build together?",
  ],
  greeting_hello: [
    "hey <PLAYER>, good to see you", "yo <PLAYER>, what are you building?", "<PLAYER> hi, the chat was quiet", "hello <PLAYER>, how is your day?",
    "<PLAYER> has arrived, hi", "hi <PLAYER>, come say hi at spawn",
  ],
  greeting_wb: [
    "wb <PLAYER>, grab some food first", "<PLAYER> welcome back, the base missed you", "wb <PLAYER>, we saved you a seat", "<PLAYER> good to have you back",
    "<PLAYER> returns, wb", "wb <PLAYER>, lots happened while you were gone",
  ],
  banter_video: [
    "the new episode has so much chaos in it", "i rewatched the build tour twice", "the intro of that video was so clean", "who edits those videos, they are great",
    "did you hear the music in the last video", "the community vote video was hilarious",
  ],
  banter_build: [
    "the roof on that tower is perfect", "i found a cool palette for the market", "the lake build looks so real", "the new bridge needs lanterns",
    "someone made a giant statue near spawn", "my {build} is finally taking shape",
  ],
  banter_lag: [
    "the server stuttered for a second", "did the chunks unload for anyone else", "my game froze when i opened the chest", "ping went up for a sec, now it is fine",
    "my fps drops near the farms", "is the tick rate normal again",
  ],
  drama_kill: [
    "<BOT_A> just won a duel against <BOT_B>", "<BOT_B> lost a duel to <BOT_A> at spawn", "<BOT_A> did the sweep attack on <BOT_B>", "<BOT_A> trapped <BOT_B> with lava",
    "<BOT_B> ran into <BOT_A>'s trap", "<BOT_A> ambushed <BOT_B> in the nether",
  ],
  drama_complain: [
    "<BOT_A> you ambushed me, that is not fair", "i was mid trade, <BOT_A>", "that trap was illegal, <BOT_A>", "<BOT_A> you owe me a new shield",
    "i demand a rematch, <BOT_A>", "my totem was in my other hand, <BOT_A>",
  ],
  drama_laugh: [
    "<BOT_A> is a menace", "<BOT_B> never learns", "i will add that to the hall of fame", "this server is never boring",
    "good thing we have chat to witness this", "i am going to tell this story for weeks",
  ],
  support_reply: [
    "same here", "that is relatable", "ok that is a good point", "i was just about to say that", "honestly yes", "true, true",
  ],
  dim_nether: [
    "<PLAYER> going to the nether, bring gold boots", "<PLAYER> do not forget the fire resistance", "<PLAYER> nether trip, good luck with the piglins",
    "<PLAYER> take a cobblestone stack for bridging", "<PLAYER> keep an eye out for ghasts", "<PLAYER> have fun in the nether",
  ],
  dim_end: [
    "<PLAYER> take some blocks for the end islands", "<PLAYER> do not look at the enderman", "<PLAYER> end trip, bring a water bucket",
    "<PLAYER> end cities are loot goldmines", "<PLAYER> grab a shulker box if you find one", "<PLAYER> be careful at the edge",
  ],
  sleeping: [
    "<PLAYER> night night", "<PLAYER> went to bed, no more phantoms", "<PLAYER> is sleeping, shh", "<PLAYER> gets the sleep bonus",
    "<PLAYER> morning is coming", "<PLAYER> thanks for skipping the night",
  ],
  locator_reply: [
    "wait is that a real dungeon?", "that spawner has loot nearby", "take a bucket of water just in case", "do not break the spawner, use it",
    "bring some torches, it is dark down there", "good find, tell us what is inside",
  ],

  weather_rain: [
    "it is raining at my base", "rain again, my {farm} is happy though", "the rain sounds so cozy", "rain means fishing time",
    "i love how the {biome} looks in the rain", "the lightning rod on my {build} finally has a job", "puddles everywhere near spawn",
    "it started drizzling, time to go indoors", "rain makes the whole server calm", "{mood} and it is raining, perfect",
  ],
  weather_storm: [
    "thunder just hit my roof", "that lightning was so close", "the storm is crazy at my base", "a thunderstorm, time to hide near the fireplace",
    "lightning charged a creeper near my {build}", "storm night, stay inside everyone", "did you see that lightning strike the {build}",
    "the sky went dark so fast", "thunder is loud when you wear headphones", "the storm means more mob spawns, careful",
  ],
  night_falls: [
    "it is getting dark, who is heading home", "night is coming, {num} mobs outside already", "i am going to sleep before the phantoms come",
    "the moon looks huge tonight", "night shift in the mine, anyone with me", "time to light up the {build}",
    "the {mob} spawns are crazy at night", "dusk is the best time to build", "everyone back to base, it is night", "torches are the answer to every night",
  ],
  morning: [
    "good morning smp", "morning everyone, {mood} today", "just woke up, anything happen", "morning, time to harvest the {farm}",
    "new day, new {build}", "sunrise looks amazing over the {biome}", "morning check: all chests sorted", "up early to work on the {build}",
    "good morning, who is online", "coffee first, then redstone",
  ],
  farm_talk: [
    "my {farm} finally works", "the {farm} gives {num} items per hour", "i rebuilt the {farm} for the third time", "the {farm} needs a hopper fix",
    "{adj} {farm}, you have to see it", "my {farm} is down to a few blocks of lag", "anyone want free {food} from the {farm}?", "i have been working on the {farm} for {time}",
    "the {farm} is almost auto", "collection system for the {farm} done",
  ],
  trade_talk: [
    "anyone selling {food}?", "i will trade {num} diamonds for a {tool}", "the spawn shop has a deal on {food}", "looking for {mat} blocks, can pay in emeralds",
    "who has a spare {tool}?", "trade offer: {food} for iron", "the villager gave me a {adj} deal", "emerald prices are crazy today",
    "i found a librarian with mending", "swapping {food} for {mat}",
  ],
  raid_talk: [
    "a pillager patrol is near my base", "bad omen incoming, i just killed a captain", "raid at the village, grab your swords", "the raid was {adj}, we saved the village",
    "the pillagers hit my {build}", "i got a totem from the raid", "ravager coming, shields up everyone", "we won the raid, free loot",
    "village defense is set, iron golems ready", "raid farm is on the way",
  ],
  base_tour: [
    "come see my base, the {build} is done", "base tour at my place in a minute", "my base has a hidden room now", "check out the {adj} {build} i made",
    "i added a {build} to my base", "my storage is finally sorted", "open house at my base, bring {food}", "the {build} in my base is {adj}",
    "my base is on the edge of the {biome}", "i built an underground vault",
  ],
  redstone_talk: [
    "my redstone clock is two ticks slow", "the sorter is jammed again", "observers are the best block", "i built a hidden door with pistons",
    "the {farm} needs better redstone", "comparator math is making my head hurt", "repeater delay fixed it", "the doors in my {build} are fully automatic",
    "i made a flying machine, it works", "redstone dust is everywhere in my base",
  ],
  pvp_talk: [
    "arena at spawn, who is in", "i am practicing crits all day", "pvp rules: no lava, no tnt", "sword fight at the {build}, loser buys {food}",
    "shield breaking is so annoying", "my {tool} is enchanted, wanna test it", "friendly duel tonight, who wants a match", "i just beat three players in a row",
    "good fight, gg", "need a healer, my {tool} broke",
  ],
  boss_dragon: [
    "going for the ender dragon tonight", "who wants to help with the dragon", "crystals first, then the dragon", "i packed {num} beds just in case",
    "dragon fight scheduled, bring {food}", "the dragon egg is on my shelf now", "the end is so spooky with {mob}s around", "we beat the dragon, wow",
    "bring a bow and lots of arrows for the dragon", "the dragon breath is nasty",
  ],
  boss_wither: [
    "building a wither tonight", "who wants to help with the wither", "wither fight, bring a {tool}", "nether star got! beacon time",
    "wither skeleton skulls are so rare", "i need {num} soul sand for the wither", "the wither blew a hole in my cave", "keep your distance, the wither is loud",
    "i set up an arena for the wither", "beacon pyramid is the best reward",
  ],
  nether_roof: [
    "the nether roof is silent and scary", "building a hub on the nether roof", "bedrock roof is a pain to cross", "i found a bastion near the portal",
    "the {mob} nearly got me at the nether ceiling", "nether highways are the best invention", "i built a bridge across the lava", "piglins keep trading with me",
    "the crimson forest looks eerie", "soul sand valley is so quiet",
  ],
  fishing: [
    "i caught a name tag fishing", "fishing in the rain is peaceful", "got a treasure from the {biome}", "my fishing rod has luck of the sea",
    "an enchanted book just popped up", "fish farm is giving {num} fish an hour", "nothing but kelp today", "fishing in the {biome} is calm",
    "reeling in {food} somehow", "we should have a fishing contest",
  ],
  explore: [
    "just found a {biome} with a village", "new {biome} discovered, it is {adj}", "i am lost in the {biome}", "exploring the {biome}, any tips",
    "the map says the {biome} is that way", "i marked a spot in the {biome} for a base", "went on a long trip through the {biome}", "the terrain in the {biome} is {adj}",
    "anyone seen a woodland mansion nearby", "ocean monument spotted at sea",
  ],
  pets: [
    "my wolf is following me again", "i tamed a cat near the village", "my parrot is dancing", "the dog is sitting on my chest",
    "a fox stole my {food}", "an axolotl in a bucket, so cute", "the cat scared away a creeper", "my pets are all in the {build}",
    "i named my wolf after a streamer", "baby llama following me around",
  ],
  horses_boats: [
    "my horse is fast as lightning", "boat race at the {biome}, who is in", "a minecart line to the {build} is done", "i found a skeleton horse in a storm",
    "ice boat roads are the fastest", "the horse needs a saddle, anyone has one?", "my horse armor is diamond now", "the camel carried us across the desert",
    "boat on the ice is insane", "ender pearls are faster than horses",
  ],
  food_talk: [
    "i made a huge {food} feast", "the cake in my {build} is a lie", "who wants {food}, i have extra", "i need {num} bread for the trip",
    "golden carrots are the best food", "honey and bread for the win", "cooked a whole stack of steak", "pumpkin pie is underrated",
    "nothing beats {food} after mining", "my stew is {adj}",
  ],
  music_talk: [
    "i found a music disc in a dungeon", "playing music in my {build}", "the jukebox plays all night at spawn", "that disc is a bop",
    "who wants to build a concert hall", "noteblocks are tricky but fun", "someone made a song with noteblocks", "my base has a lofi corner",
    "the disc 5 is rare", "need a creeper for another disc",
  ],
  server_event: [
    "event night at spawn, bring your best gear", "build battle next weekend, theme is {build}", "scavenger hunt idea: hide {num} chests", "let's host a race to the {biome}",
    "treasure hunt around the {biome}", "we should do a spawn cleanup day", "community project: a big {build}", "weekend plan: mine all day",
    "i vote for a hide and seek event", "fireworks show at spawn tonight",
  ],
  building_progress: [
    "{build} progress: {num} layers done", "the {build} is {adj} but not finished", "working on the {build} for {time}", "my {build} uses {mat} and {block}",
    "i am rebuilding the {build} with {mat}", "the {build} looks better with {block}", "roof of the {build} finally done", "the {build} needs more lighting",
    "i redo the {build} every week", "the {build} is my favorite so far",
  ],
  lost_items: [
    "i lost my {tool} somewhere", "has anyone seen a chest with {food}", "who took my {mat}", "my {tool} fell in the lava",
    "i dropped {num} diamonds in the water", "found a lost {tool} near spawn", "someone left a chest at the {build}", "my compass points to nothing",
    "lost my bed, no spawn point", "found {num} stacks in an old chest",
  ],
  mining_talk: [
    "strip mining at y minus 59", "found a huge geode full of amethyst", "the {block} here is endless", "branch mining is boring but works",
    "an ancient city is below my base", "i hit a lava lake at y minus 54", "found an old mineshaft with a spawner", "mining with efficiency five is so fast",
    "this cave has so much {block}", "my pickaxe has mending now",
  ],
  enchant_talk: [
    "finally got mending on my {tool}", "unbreaking three is great", "fortune three, here we go", "enchanting table maxed at level thirty",
    "anvil cost too high again", "looking for a librarian with sharpness five", "i enchanted a full set today", "soul speed boots are fun in the nether",
    "efficiency five takes the pain out of mining", "silk touch for the {block}",
  ],
};

export const DIALOGS = [
  [[0, "anyone want to go on a {biome} trip?"], [1, "i am in, need {food} first"], [2, "same, wait for me"], [0, "meet at spawn in five"]],
  [[0, "who stole my {tool}?"], [1, "not me, i swear"], [2, "i saw <BOT_B> with it earlier"], [1, "that was my own, <BOT_C>!"]],
  [[0, "the {farm} just broke again"], [1, "did you check the hoppers?"], [0, "yes, still jammed"], [1, "i will come take a look"]],
  [[0, "<PLAYER> have you seen the new {build}?"], [1, "it looks {adj}"], [2, "the {mat} palette is great"], [0, "thanks, took me {time}"]],
  [[0, "i just found a {mob} spawner"], [1, "free xp farm"], [2, "careful with the light levels"], [0, "will do, bringing torches"]],
  [[0, "does anyone have {num} {mat}?"], [1, "i have some in my storage"], [0, "can you drop them at spawn?"], [1, "sure, give me a minute"]],
  [[0, "what is the plan for tonight?"], [1, "let's finish the {build}"], [2, "i can bring the {mat}"], [0, "ok, see you at the site"]],
  [[0, "i died to a {mob} again"], [1, "you always say that"], [0, "it was a {adj} fight"], [2, "next time bring a shield"]],
  [[0, "nether trip tomorrow, anyone?"], [1, "yes, i need netherrack"], [2, "i will bring fire resistance"], [0, "perfect, we leave at noon"]],
  [[0, "who is best at redstone here?"], [1, "<BOT_C> by far"], [2, "stop, i am just average"], [0, "come help with the {farm}"]],
  [[0, "i have {num} diamonds, what should i craft?"], [1, "armor first"], [2, "a {tool} could be better"], [0, "armor it is"]],
  [[0, "new here, where is the spawn shop?"], [1, "just follow the path to the {build}"], [2, "it has a big sign on top"], [0, "thanks, found it"]],
  [[0, "the sunrise over the {biome} is amazing"], [1, "screenshot it"], [0, "already did"], [2, "post it in the screenshots chest"]],
  [[0, "i found a woodland mansion"], [1, "bring a lot of food and swords"], [2, "do not forget a totem"], [0, "thanks, going in at dawn"]],
  [[0, "building a {build} in the {biome}"], [1, "that sounds {adj}"], [2, "want some {mat}?"], [0, "yes please"]],
  [[0, "<BOT_B> your {farm} is the best"], [1, "thanks, it took {time}"], [2, "can i copy the design?"], [1, "of course"]],
  [[0, "creeper blew up my {build}"], [1, "again?"], [2, "i can help rebuild"], [0, "thanks, bring {mat}"]],
  [[0, "does the server have a map?"], [1, "yes, check the book at spawn"], [2, "i drew a new one yesterday"], [0, "great, i am lost"]],
  [[0, "i want to build a {build}, ideas?"], [1, "use {mat} and {block}"], [2, "add lanterns and moss"], [0, "okay that works"]],
  [[0, "the end is so {adj}"], [1, "did you find a city?"], [0, "yes, got an elytra"], [2, "wow, take me next time"]],
  [[0, "i need help with the {farm}"], [1, "what is wrong?"], [0, "nothing drops"], [1, "the spawn platform is too lit"]],
  [[0, "<PLAYER> is online, say hi"], [1, "hi <PLAYER>"], [2, "yo <PLAYER>, how is it going?"], [0, "welcome to the chat"]],
  [[0, "anyone want to trade {food}?"], [1, "i have {num} of it"], [0, "i will give you iron for it"], [1, "deal"]],
  [[0, "what music do you play while building?"], [1, "lofi beats"], [2, "game soundtracks mostly"], [0, "nice, i will try lofi"]],
  [[0, "i tamed {num} cats"], [1, "of course you did"], [2, "name one after me"], [0, "okay, it is called <BOT_C>"]],
  [[0, "lag at the {farm} again"], [1, "turn off the hoppers when not in use"], [2, "or limit the mobs"], [0, "good tips, thanks"]],
  [[0, "my {tool} broke mid fight"], [1, "bad luck"], [2, "mending would have saved it"], [0, "i know, next time"]],
  [[0, "did anyone see the storm?"], [1, "yes, it hit my roof"], [2, "lightning set my {build} on fire"], [0, "ouch, need water buckets"]],
  [[0, "i am going to sleep now"], [1, "good night"], [2, "night, see you tomorrow"], [0, "see you"]],
  [[0, "let's have a race to the {biome}"], [1, "i am in"], [2, "no elytra allowed"], [0, "deal, first one there wins"]],
  [[0, "found a village with a {adj} blacksmith"], [1, "free iron tools"], [2, "bring a pickaxe"], [0, "already did, no luck"]],
  [[0, "how do I make a faster {farm}?"], [1, "more spawn platforms"], [2, "and use a better kill chamber"], [0, "got it, thanks"]],
  [[0, "i hit bedrock at the nether roof"], [1, "be careful, there is nothing there"], [0, "it is so eerie"], [2, "just do not fall"]],
  [[0, "my base is full of {mob}s"], [1, "light it up"], [2, "and add a roof"], [0, "will do"]],
  [[0, "who wants to build a statue?"], [1, "of what?"], [0, "a giant {mob}"], [2, "i am in, bringing {mat}"]],
  [[0, "i found a shipwreck with a map"], [1, "buried treasure!"], [2, "dig carefully"], [0, "going now, wish me luck"]],
  [[0, "how do I get a trident?"], [1, "kill a drowned"], [2, "with a lot of luck"], [0, "ok, off to the ocean"]],
  [[0, "i love this server"], [1, "same, it is the best"], [2, "never leaving"], [0, "group hug"]],
  [[0, "<BOT_B> have you finished the {build}?"], [1, "almost, need more {mat}"], [0, "i can bring a stack"], [1, "thanks, you are the best"]],
  [[0, "is it just me or is it too quiet?"], [1, "yes, who is online?"], [2, "i am, and <BOT_A>"], [0, "ok good, hi all"]],
];
