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

The local implementation adds **Couch play**, a separate grown-up route with six lanterns to light. Each completed round lights one lantern and keeps one couch sticker, including rounds completed with help. Pick one of three games between rounds. Player 1 and Player 2 alternate choosing; either can operate the chooser and the single-player games. Passing one controller is fine. The child profile, level pins, adaptive history, stories and sticker book are independent.

| Action | Standard controller | Keyboard |
| --- | --- | --- |
| Choose a menu item | D-pad or left stick; release between moves | Arrow keys or Tab |
| Confirm / launch | Bottom face button | Enter or Space |
| Pause / resume | Start / +; right face button also opens/closes pause | Esc |
| Penguin Slide | D-pad or left stick | Arrow keys |
| Undo a slide | Left face button | Backspace |
| Bouncy Launch power | Hold left/right, then confirm to launch | Hold left/right, then Enter |
| Bounce Back blue paddle (Player 1) | First controller's stick / D-pad up/down | Up/down arrows |
| Bounce Back pink paddle (Player 2) | Second controller's stick / D-pad up/down | W/S (press once to join) |

Button prompts use **physical positions**, because Nintendo's printed A/B/X/Y letters can differ from other controllers' standard browser mapping. Single Joy-Con orientations and custom mappings are not implemented yet. A pet takes the pink paddle until a second controller or W/S joins. The supported pool is Penguin Slide levels 4–5, Bouncy Launch level 3, and Bounce Back level 3; other games still use touch/mouse.

A lost window focus or controller disconnect pauses the round. Reconnect, or resume using the keyboard. Pause also offers instruction replay, a different game, and return to start. The browser may need one mouse click or keyboard press before it will play sound; controller input alone may not unlock audio.

Finished stops and sticker counts save immediately on this browser/device. Reloading or leaving an unfinished round restarts that round with the same seed. The next choices do not reroll. Use **Couch backup** to download or restore the separate couch save. A restore replaces couch progress only. Child backup/reset does not include couch progress. Clearing site data removes both. Local couch storage is a versioned, bounded record: six recent trip rounds, one count/latest sticker seed per supported game, and completed-trip count.

## Put it on the TV

Connect the Mac to the TV with an available display connection, move the browser to the TV, and enter browser full screen. Try the TV's Game Mode if input feels delayed. Keep the Mac close enough for Bluetooth. Judge text size, paddle feel and sound delay before deciding whether the pacing needs changes.

Until these changes are pushed/deployed, run the working copy with `npm run dev` and visit **http://localhost:5173**. The [live site](https://rjdunlap.github.io/neo/) only contains code already deployed from `main`. This task does not deploy automatically.

Future work: a larger varied party pool, a longer Penguin Slide course with comparable personal records, explicit Joy-Con calibration, and real controller/TV validation. There are no leaderboards or competitive scores in this first shared-goal slice.
