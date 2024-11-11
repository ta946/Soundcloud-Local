# [Soundcloud Local](https://github.com/ta946/Soundcloud-Local)

interact with soundcloud on a custom website that speeds up the process of listening to tracks, adding to playlists and downloading

for first time setup, follow the instructions on this page. [setup](./setup.md)

## Usage

**WARNING! DO NOT MAKE ANY CHANGES DIRECTLY IN SOUNDCLOUD WHILE YOU ARE USING THIS PROGRAM!**

Setting playlists overwrites the playlist in soundcloud. if you add tracks in soundcloud directly, you can end up removing the track from the playlist!

Always make sure the current "state" of the program is up-to-date before you start using it by pressing `refresh state`

* Run the program
	1. WINDOWS: run `run_sc.bat`
	1. MACOS: run `run_sc.sh`
* Press `refresh state` to fetch all your likes and store the "state" in memory
* you can save the state on your computer by pressing `save state`, and load it again with `load state`. only do this if you need to close the program and open it up again and you are sure you have not made any changes in soundcloud directly!
* you can see the current index of your liked track, it is numbered in reverse, `0` being your latest track
* `index` input box lets you jump to a track if you know its index
* `NEXT UNASSIGNED` will jump to the next track that has not been added to any playlists
* `NEXT ASSIGNED` will jump to the next track that is in a playlist
* `filter playlist` will only show tracks in a selected playlist.
	* At the moment there is no way to return to the normal list after filtering a playlist
* `search` will search the track name and artist name.
	* next/prev will not work when you have searched!


## Hotkeys

* **SPACE**: pause / play
* **A / D**: seek forward/backward
* **shift + A / D**: large seek forward/backward
* **S / down**: next track
* **W / up**: previous track
* **shift + S / down**: volume down
* **shift + W / up**: volume up
* **0 - 9**: add to quick playlist
* \+: add to any playlist
* \-: unlike track
* **shift + 0 - 9**: seek to section of track
* **control**: hide alert banner
