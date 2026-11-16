# Changelog — Living SMP Chat

## [1.0.10] - 2026-11-16 - Replies and Personality

### Added
- **Replies to Your Chat**: virtual players answer when you say hello, thank them, ask a question, laugh, say goodnight, or type one of their names.
- **Catchphrases**: each virtual player now has a catchphrase they use now and then.
- **Name Slips**: once in a while a virtual player slips and uses a made-up first name, and the others react.
- **Quiet Options**: each option now also comes in a Quiet version where the virtual players chat about half as often.
- **Shoutouts**: now and then a virtual player asks if you know ALNStudios and suggests following him, at most once every 20 minutes.

<details>
<summary><b>1.0.x</b> (5 releases)</summary>

### [1.0.9] - 2026-11-16 - Better Writing

#### Changed
- **Smoother Sentences**: openers and endings that read oddly with some lines were removed, so chat messages sound more natural.
- **Questions Stay Questions**: lines that ask something no longer get a statement ending tacked on.
- **Fitting Side Remarks**: the extra personality remark is now only added to casual chat, never to reactions to deaths, ores, sleeping or fights.
- **Better Amounts**: the counts used in lines (like a dozen or a couple of) read more naturally.

### [1.0.8] - 2026-11-16

#### Added
- **Two Options**: the pack now has a Just Chat SMP option and a World Changes option. Just Chat SMP keeps everything as chat messages, and World Changes lets the bedtime night skip really change the time and weather.
- **Default**: Just Chat SMP is the default, so the night no longer skips unless you choose World Changes.
- **Bedtime Chat**: on about one night in twenty, a virtual player says they are going to bed and one or two others wish them goodnight.
- **Virtual Deaths**: now and then a virtual player dies to a creeper, a zombie, a skeleton, a spider, lava, a fall, the void, drowning or fire. The usual death message appears in chat, then the victim and the others react.

#### Changed
- **Real Night Skip**: when a virtual player goes to bed on one of those nights, the night now really skips to morning after the goodnight chat, the weather clears, and someone says good morning.
- **Docs**: the description now says plainly that this changes the time of day for everyone.

### [1.0.5] - 2026-11-15

#### Removed
- **Location Tips**: the virtual players no longer point out dungeons, strongholds, trial chambers or ancient cities, and the matching coordinate corrections are gone too.
- **Lighter Pack**: the background search for nearby structures was removed completely, so there is nothing left that scans blocks around you.

#### Changed
- **More Than Dungeons**: the rare location tip can now point to a real dungeon, stronghold, trial chamber or ancient city near you, with real coordinates.
- **Rarer Tips**: every 2 to 4 minutes there is only a 5% chance a search even starts, and tips stay at least 15 minutes apart. Rarer searches also mean less work for the game.
- **Why Not the Locate Command**: the game gives add-ons no way to read what the locate command finds, so the tip checks for real structure blocks close to you instead.

#### Fixed
- **Lag Spikes**: the search for nearby spawners is now spread over a few seconds in small steps instead of one big sweep, and it skips repeat searches when you have not moved.
- **Lighter Background Work**: the checks for sleeping and dimension changes run half as often, and the startup count of chat lines was removed.
- **No Lag Jokes**: the virtual players no longer joke about lag spikes, so real lag is not confused with chat.

### [1.0.2] - 2026-11-15

#### Added
- **40 Virtual Players**: 22 new virtual players join the roster of 18, and between 6 and 14 are online at a time.
- **550 New Lines and 24 New Topics**: weather, night and morning, farms, trading, raids, base tours, redstone, PvP, the dragon and the wither, the nether roof, fishing, exploring, pets, horses and boats, food, music, server events, build progress, lost items, mining and enchanting.
- **Scripted Mini Chats**: 40 short back-and-forth conversations between two or three players.
- **Bigger Variety**: new openers, endings and word banks lift the pool to millions of different lines, and the same line is not repeated back to back.
- **Spawner Tips**: once in a while a virtual player tells you the real position of a Monster Spawner close to you, usually a dungeon, and a second player replies. About one in three tips drops a minus sign and is corrected by the same player about two minutes later. Each spawner is announced only once, and nothing is said when none is nearby.

### [1.0.0] - 2026-11-15

#### Added
- **Virtual SMP Roster**: 18 virtual players in five personality types (Builder, Redstoner, PvPer, Wholesome, Chaotic). Between 5 and 10 are online at a time and they join and leave with the usual yellow messages.
- **Death Reactions**: when you die to a creeper, lava, a fall, the void, a mob or anything else, two to four virtual players react and offer to help.
- **Ore Celebrations**: mining Diamond Ore, Deepslate Diamond Ore or Ancient Debris starts one celebration chat per vein instead of one per block.
- **Welcome Back, Sleep and Travel Chat**: virtual players greet you when you join and comment when you sleep or enter the Nether or the End.
- **Ambient SMP Banter**: every 1.5 to 3 minutes the server chat fills with 2 to 5 message conversations about videos, builds, lag and small PvP dramas.

</details>
