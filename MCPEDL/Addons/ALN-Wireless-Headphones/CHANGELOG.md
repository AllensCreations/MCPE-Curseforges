# Changelog — ALN Wireless Headphones

---

## [v11] - 2026-11-19 - Steadier Music

### Improved & Balanced
- **Far Away Listening**: Discs from other add-ons keep playing for up to 10 minutes while the Jukebox is not loaded.
- **Loaded-Area Retry**: A Jukebox that could not be kept loaded is retried every few seconds.
- **Loaded-Area Check**: The Jukebox now keeps only its own chunk loaded, and the game's capacity is checked before pairing.
- **Mid-Track Sync**: When the game supports seeking within a sound, the headphones join a track in sync instead of waiting for the next one.

### Fixed
- **Headphone Sync**: The headphone music now starts together with the Jukebox. If you put the headphones on mid-track, they wait for the next track and the Jukebox stays audible until then.
- **Loaded-Area Warning**: Pairing a Jukebox that already has a loaded area no longer shows a false limit warning.
- **Other Jukeboxes**: Muting now only affects players within 96 blocks of the paired Jukebox, so the same disc playing elsewhere is no longer silenced for faraway players.

---

## [v10] - 2026-11-18 - Music Restored

### Fixed
- **Silent Headphones**: The headphones play the music again. The paired Jukebox is no longer silenced for people wearing them.

---

## [v9] - 2026-11-18 - Music Follows You

### Improved & Balanced
- **Far Away Listening**: If the paired Jukebox is not loaded while you are away, the music keeps playing until the track ends instead of cutting out.

### Fixed
- **Fading Music**: The paired Jukebox is now silent for you as well, so the music no longer fades as you walk away. Discs from other add-ons may still fade with distance.

---

## [v8] - 2026-11-18 - Music-Only Audio

### Improved & Balanced
- **Headphone Audio**: The headphone music always plays as music, so its volume stays steady wherever you walk and follows your Music volume setting.

---

## [v6] - 2026-11-18 - Custom Disc Support

### Added
- **Custom Discs**: Music discs from other add-ons now play through the headphones when the disc item is named <namespace>:music_disc_<name> and its sound is record.<name>. Their total time shows as --:--.

---

## [v5] - 2026-11-18 - Muted Jukebox & Worn Model

### Added
- **Worn Model**: The Wireless Headphones now show on your character's head.
- **Muted Jukebox**: Pairing mutes the Jukebox for everyone. Only players wearing the headphones hear the music.
- **Unpairing**: Sneak and use the headphones on their paired Jukebox again to unpair it and unmute it.

### Improved & Balanced
- **Long Distance**: A paired Jukebox now stays loaded, so the music follows it from far away.
- **Paired Action Bar**: The Action Bar shows Paired while you wear the headphones, and the timer follows the audio you hear.
- **Empty Jukebox Pairing**: You can pair a Jukebox that has no disc, which suits a playlist.

### Fixed
- **Pairing**: Sneak and use on a Jukebox now pairs the headphones instead of putting them on.

---

## [v4] - 2026-11-18 - Headphones Item Fix

### Fixed
- **Wireless Headphones**: The headphones now load correctly, showing their icon, stacking to 1 and appearing in the Helmet group of the creative inventory.

---

## [v3] - 2026-11-18 - Direct Audio Streaming & Disconnect Feedback

### Added
- **Direct Audio Streaming**: Wireless Headphones now actively stream the music disc audio straight into your ears using `playMusic`, letting you hear the music anywhere while the Jukebox is loaded.

### Improved & Balanced
- **Disconnect State**: If the paired Jukebox chunk unloads or the dimension is unavailable, the Action Bar clearly displays `Disconnected` and stops audio streaming cleanly until reconnected.
- **Auto-Stop on Unequip**: Removing the Wireless Headphones immediately stops the streamed audio.

---

## [v2] - 2026-11-16 - First Release

### Added
- **Wireless Headphones**: A craftable helmet made from 2 Iron Ingots, 1 Redstone Dust and 2 Leather that streams a paired Jukebox to your Action Bar.
- **Jukebox Pairing**: Sneak and use the headphones on a Jukebox with a music disc to pair it. A chime plays and the Action Bar confirms it.
- **Live Track Display**: While worn, the Action Bar shows the disc name with elapsed and total time, and clears when you take the headphones off.
