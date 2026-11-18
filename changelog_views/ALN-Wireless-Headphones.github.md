# Changelog — ALN Wireless Headphones

## [v6] - 2026-11-18 - Custom Disc Support

### Added
- **Custom Discs**: Music discs from other add-ons now play through the headphones when the disc item is named <namespace>:music_disc_<name> and its sound is record.<name>. Their total time shows as --:--.

<details>
<summary><b>5.0.x</b> (1 release)</summary>

### [v5] - 2026-11-18 - Muted Jukebox & Worn Model

#### Added
- **Worn Model**: The Wireless Headphones now show on your character's head.
- **Muted Jukebox**: Pairing mutes the Jukebox for everyone. Only players wearing the headphones hear the music.
- **Unpairing**: Sneak and use the headphones on their paired Jukebox again to unpair it and unmute it.

#### Improved & Balanced
- **Long Distance**: A paired Jukebox now stays loaded, so the music follows it from far away.
- **Paired Action Bar**: The Action Bar shows Paired while you wear the headphones, and the timer follows the audio you hear.
- **Empty Jukebox Pairing**: You can pair a Jukebox that has no disc, which suits a playlist.

#### Fixed
- **Pairing**: Sneak and use on a Jukebox now pairs the headphones instead of putting them on.

</details>

<details>
<summary><b>4.0.x</b> (1 release)</summary>

### [v4] - 2026-11-18 - Headphones Item Fix

#### Fixed
- **Wireless Headphones**: The headphones now load correctly, showing their icon, stacking to 1 and appearing in the Helmet group of the creative inventory.

</details>

<details>
<summary><b>3.0.x</b> (1 release)</summary>

### [v3] - 2026-11-18 - Direct Audio Streaming & Disconnect Feedback

#### Added
- **Direct Audio Streaming**: Wireless Headphones now actively stream the music disc audio straight into your ears using `playMusic`, letting you hear the music anywhere while the Jukebox is loaded.

#### Improved & Balanced
- **Disconnect State**: If the paired Jukebox chunk unloads or the dimension is unavailable, the Action Bar clearly displays `Disconnected` and stops audio streaming cleanly until reconnected.
- **Auto-Stop on Unequip**: Removing the Wireless Headphones immediately stops the streamed audio.

</details>

<details>
<summary><b>2.0.x</b> (1 release)</summary>

### [v2] - 2026-11-16 - First Release

#### Added
- **Wireless Headphones**: A craftable helmet made from 2 Iron Ingots, 1 Redstone Dust and 2 Leather that streams a paired Jukebox to your Action Bar.
- **Jukebox Pairing**: Sneak and use the headphones on a Jukebox with a music disc to pair it. A chime plays and the Action Bar confirms it.
- **Live Track Display**: While worn, the Action Bar shows the disc name with elapsed and total time, and clears when you take the headphones off.

</details>
