# Memory Desk

<!-- generated: from src/games/memory-desk; edit the text below the end mark (npm run game-docs) -->

**ID:** `memory-desk` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** systems, logic, testing

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Keep one |
| 2 | Open or shut |
| 3 | Fix the desk |

<!-- end generated -->

**Starts as:** put a pictured token on a toy desk's tray, Keep a copy in the drawer, change the tray, and Show what the drawer kept in the window

**Grows into:** level 1 is a free try-out round (two pictures, Keep, Show, Undo and a tick that lights once the window has shown the kept token beside a different tray; nothing is counted as wrong); level 2 gives each step of a two-picture queue a hatch she opens or shuts so the desk ends on a named picture; level 3 starts with a kept token and hatches already set wrong, and she repairs them, seeing the failed run stay as a dim trace row above hers

## Design notes

*Level 1 · [definition](../definitions/memory-desk.md) · how-computers-work slice H8.* A toy desk with three places: the **tray** (what is coming in, under an arrow going in), the **drawer** (what is kept, behind a glass front so its token always shows, under a little drawer) and the **window** (what comes out, under an arrow coming out). The point is that a machine has a state apart from its input and output: a store is a copy, the kept copy holds while the input changes, and nothing is written until the machine is told to write. The drawer is always visible, so this is about the desk's memory and never a test of hers.

Level 1 "Keep one": two of six pictured tokens (shell, leaf, star, acorn, feather, pebble: each its own outline as well as its own colour) sit on cards beside the tray. Tapping a card puts that token on the tray and the pet names it. **Keep** slides a copy from the tray into the drawer and the tray keeps its own; **Show** slides a copy from the drawer into the window and never reads the tray. An empty slot is a dotted outline. Keep on an empty tray does nothing ("Put something on the tray first") and Show on an empty drawer shows nothing ("Nothing is kept yet"). A press during a slide jumps to the settled picture.

**Finishing.** The tick is dim until the round's one contrast has been seen: a Keep, a change of the tray to the other token, and a Show, so the window shows the kept token while the tray holds a different one ("The tray changed, and the drawer still has it."). A dim tick names the next thing to try and hops it; that is not a miss. She may keep playing as long as she likes before the tick. One ordinary sticker; nothing is filed or kept between rounds.

**Misses and help.** Nothing at level 1 is a miss. **Undo** takes back the last press and Start again (pause sheet) empties the desk; neither counts. Help me (the pet, or the pause sheet) is one hint a press: the next control toward the contrast hops under a ring. Once the contrast has been seen, Help points at the tick (Done) and counts no hint. An unhelped round ends 0 misses, 0 hints, and the ordinary step-up rule applies: that is exposure, not evidence that she understands stored state, and the how-to card says it is a try-out.

**Layout and words.** Tray, drawer and window read left to right in landscape and top to bottom on an upright phone, where the three panels stack rather than shrink; every target is at least 100 units and clear of the pet and corners (`deskLayout`, tested at the landscape, portrait and upright phone views). The spoken words are "Keep", "Show" and "this toy desk", matching the study's stored-copy sources; nothing claims this is how a real computer's memory works. The ghost finger plays a picture, Keep, the other picture, Show and the tick through the same taps.

*Levels 2–3 · the hatch (`hatch.ts`, `HatchDesk`).* Each step of a short queue has a **hatch** (116-unit toggle) that either lets the new token in or keeps the old one; the desk's drawer shows what is kept. **Step** runs one step of her queue, **Slow** (the turtle) makes each Step tap do one part (arrive, write, read), **Undo** takes back a change and **Check** (the tick) runs all the steps whether or not she stepped. Panels pop in as a step arrives, writes and reads (no sliding copy); upright, they stack beside the button column under the step columns (`hatchLayout`, tested at six views with two and three steps).

Level 2 "Open or shut": a queue of two pictures and two hatches that start shut; two briefs a round (end on the second picture, then on the first), with a "next" sign and desk line between them. Level 3 "Fix the desk": the drawer starts with a kept token, there are three steps and the hatches are preset and wrong; two different repairs a round (the sign wants the kept token, the first arrival or the second), with the preset's failed run left as a dim trace row above hers. The "held" repair uses the queue [a, b, a], so only all-shut passes.

**Misses and help.** Check with no change is a nudge, not a miss. A failed Check after a hatch change is one miss, and the same wrong hatches checked again play again without a second miss; every second failed Check on a brief glows the hatch `helpFor` names and counts one hint. Help is one hint a press: the first runs slowly to that hatch's write with it glowing, the second sets it and points at Check. Check-fail speech is four short lines naming what ended up in the window and what the sign wants. The ghost finger sets the `helpFor` hatch, Steps the queue through at level 2 and Checks. Exposure accounting follows level 1: a clean round is not evidence she understands stored state.
