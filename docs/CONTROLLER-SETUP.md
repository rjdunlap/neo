# Couch play on a Mac

Saved for your next play session. This is the computer/browser route; the game does not run on the Switch console. Controller code can be exercised with simulated devices, but physical Switch controllers, Joy-Con pairing and TV latency still need your hands-on check.

## Pair your original Switch controllers

1. On the Mac, open **System Settings → Bluetooth**.
2. Hold **SYNC** until the player lights flash. On a **Pro Controller**, SYNC is beside the USB-C port. On a **Joy-Con**, detach it from the Switch and use the small SYNC button on its inner rail.
3. Select the controller in the Mac's Bluetooth list and connect. Pair each Joy-Con separately if trying the pair.
4. Open Puddle Island in an up-to-date desktop browser, focus the tab, and press a controller button. Use **Couch play** on the title screen (or the **C** key). A standard controller's bottom face button can also enter couch play after being released and pressed again.
5. Open **Controller setup** in couch play and check the detected count. The first standard controller is Player 1; the second is Player 2. If the browser reports an unmapped controller, use the keyboard or an already-owned Pro Controller for this prototype. Do not assume two Joy-Con halves are exposed as two usable standard controllers.

Mac controller customization, when available, is under **System Settings → Game Controllers**. If a controller keeps returning to the Switch, wake/pair it with the Mac again. To return it to the Switch later, use the Switch's **Controllers → Change Grip/Order** pairing screen (or the original Joy-Con rails).

References: [Apple's Bluetooth controller connection guide](https://support.apple.com/en-us/111099), [Nintendo Pro Controller diagram](https://en-americas-support.nintendo.com/app/answers/detail/a_id/27538/), [Nintendo Joy-Con diagram](https://en-americas-support.nintendo.com/app/answers/detail/a_id/22634/). The development Mac was running macOS 26.6.2 when these notes were made. Bluetooth pairing alone does not verify browser/game compatibility.

## Play tonight, including without controllers

**Couch play** is a separate grown-up route with its own save. A trip has six stops; each completed round lights one lantern and keeps one couch sticker, including rounds completed with help. Players take turns choosing from three games. The child profile, level pins, adaptive history, stories and sticker book are independent. Either player can operate the chooser; passing one controller is fine.

**Starting a trip.** Choose **Together** (shared lanterns, nobody wins or loses) or **Face-off** (each stop has a winner; both players still light every lantern). **Start another trip** after a finished one returns to this choice.

**How to play.** The first time a game is chosen, a screen shows its name, a spoken one-sentence goal, a drawn controller with the buttons it uses, and a window where a bot plays a real round with the same controls. **Play** (bottom button) starts; **Back** (right button or Esc) returns to the choices and leaves the game unchosen. After that, the game shows a short name card (press the bottom button to skip). **How to play** is always in the pause menu and returns to the pause menu.

**Earning games.** Three games are open at the start. Each finished trip, in either mode, opens the next group; the trip-complete screen names the games just opened and says how many more are still to come. Opened games are marked NEW until their how-to screen has been seen. Nothing locks again, nothing expires, and the choice of games never depends on how well anyone played. A free **Shuffle the choices** appears once more than three games are open.

**Face-off.** Penguin Slide, Bouncy Launch, Light Lab, Secret Code and Peg Garden give each player their own fresh board in turn (never the same hidden board twice), scored against that board's own best, so different boards compare fairly: slides over the best route; distance from the cloud centres; extra turns and missed shines; guesses; shots. Lower wins. Memory Match is one shared board where players alternate and a match earns another turn; most pairs wins. Bounce Back, Rhythm Neighbors and Bumper Garden are team stops: both players score. Ties score for both. A stop's first turn is saved, so leaving between the two turns changes nothing. One couch sticker is kept per stop, not per turn.

| Action | Standard controller | Keyboard |
| --- | --- | --- |
| Choose a menu item | D-pad or left stick; release between moves | Arrow keys or Tab |
| Confirm / launch / place / flip a card | Bottom face button | Enter or Space |
| Pause / resume | Start / +; right face button also opens/closes pause | Esc |
| Penguin Slide | D-pad or left stick; left face button undoes | Arrow keys; Backspace |
| Bouncy Launch power | Hold left/right, then bottom button to launch | Hold left/right, then Enter |
| Bounce Back blue paddle (Player 1) | First controller's stick / D-pad up/down | Up/down arrows |
| Bounce Back pink paddle (Player 2) | Second controller's stick / D-pad up/down | W/S (press once to join) |
| Memory Match | D-pad/stick moves the highlight; bottom button turns a card | Arrow keys; Enter |
| Rhythm Neighbors | Left/right play the two frogs; bottom button sends the answer; left face button replays the call | Left/right arrows; Enter; Backspace |
| Light Lab | D-pad/stick moves between mirrors and the sun; bottom button turns a mirror (or shines on the sun); left face button shines | Arrow keys; Enter; Backspace |
| Secret Code | Left/right choose a stone; bottom button places it, or turns the key when every slot is full; left face button takes the last stone back | Left/right arrows; Enter; Backspace |
| Peg Garden | Hold left/right to swing the launcher; bottom button lets the pearl go | Left/right arrows; Enter |
| Bumper Garden | One controller: left/right flip the left/right flipper. Two: Player 1 any button for the left flipper, Player 2 for the right | Left/right arrows (W/S joins Player 2) |

Button prompts use **physical positions**, because Nintendo's printed A/B/X/Y letters can differ from other controllers' standard browser mapping. Single Joy-Con orientations and custom mappings are not implemented yet. A pet takes the pink paddle in Bounce Back until a second controller or W/S joins.

A lost window focus or controller disconnect pauses the round. Reconnect, or resume using the keyboard. Pause also offers how to play, instruction replay, a different game, and return to start. The browser may need one mouse click or keyboard press before it will play sound; controller input alone may not unlock audio.

Finished stops and sticker counts save immediately on this browser/device. Reloading or leaving an unfinished round restarts that round with the same seed. The next choices do not reroll unless you press Shuffle. Use **Couch backup** to download or restore the separate couch save (version 2; older version 1 saves are upgraded). A restore replaces couch progress only. Child backup/reset does not include couch progress. Clearing site data removes both. Local couch storage is a versioned, bounded record: the trip's six stops, a pending first turn, one count/latest sticker seed per game, the games already explained, and the completed-trip count (which is what opens games).

Each couch game has a bot used for its how-to demo. The browser suite also uses it to prove the controls can complete a round: `BROWSER_SUITE=couchgames` plays every game, `BROWSER_SUITE=couch` plays a full trip and a face-off trip. Hold keys for at least ~120 ms when scripting key presses: the couch scene samples input once per frame, and a new couch scene ignores input for its first 0.35 s.

## Put it on the TV

Connect the Mac to the TV with an available display connection, move the browser to the TV, and enter browser full screen. Try the TV's Game Mode if input feels delayed. Keep the Mac close enough for Bluetooth. Judge text size, paddle feel and sound delay before deciding whether the pacing needs changes.

Until these changes are pushed/deployed, run the working copy with `npm run dev` and visit **http://localhost:5173**. The [live site](https://rjdunlap.github.io/neo/) only contains code already deployed from `main`. This task does not deploy automatically.

Future work: more couch games (a larger pool keeps unlocks meaningful), a longer Penguin Slide course with comparable personal records, the daughter joining as a co-pilot, simultaneous face-off boards, explicit Joy-Con calibration, and real controller/TV validation. There are no leaderboards across trips; a face-off compares only the two players in the same trip.
