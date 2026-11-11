# Memory Desk

<!-- generated: from src/games/memory-desk; edit the text below the end mark (npm run game-docs) -->

**ID:** `memory-desk` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** systems, logic, testing

| Band | Levels, easiest first |
| --- | --- |
| school | 1 |

| Level | Plays like |
| --- | --- |
| 1 | Keep one |

<!-- end generated -->

**Starts as:** put a pictured token on a toy desk's tray, Keep a copy in the drawer, change the tray, and Show what the drawer kept in the window

**Grows into:** level 1 only so far: a free try-out round with two pictures, Keep, Show, Undo and a tick that lights once the window has shown the kept token beside a different tray; nothing is counted as wrong

## Design notes

*Level 1 · [definition](../definitions/memory-desk.md) · how-computers-work slice H8.* A toy desk with three places: the **tray** (what is coming in, under an arrow going in), the **drawer** (what is kept, behind a glass front so its token always shows, under a little drawer) and the **window** (what comes out, under an arrow coming out). The point is that a machine has a state apart from its input and output: a store is a copy, the kept copy holds while the input changes, and nothing is written until the machine is told to write. The drawer is always visible, so this is about the desk's memory and never a test of hers.

Level 1 "Keep one": two of six pictured tokens (shell, leaf, star, acorn, feather, pebble: each its own outline as well as its own colour) sit on cards beside the tray. Tapping a card puts that token on the tray and the pet names it. **Keep** slides a copy from the tray into the drawer and the tray keeps its own; **Show** slides a copy from the drawer into the window and never reads the tray. An empty slot is a dotted outline. Keep on an empty tray does nothing ("Put something on the tray first") and Show on an empty drawer shows nothing ("Nothing is kept yet"). A press during a slide jumps to the settled picture.

**Finishing.** The tick is dim until the round's one contrast has been seen: a Keep, a change of the tray to the other token, and a Show, so the window shows the kept token while the tray holds a different one ("The tray changed, and the drawer still has it."). A dim tick names the next thing to try and hops it; that is not a miss. She may keep playing as long as she likes before the tick. One ordinary sticker; nothing is filed or kept between rounds.

**Misses and help.** Nothing at level 1 is a miss. **Undo** takes back the last press and Start again (pause sheet) empties the desk; neither counts. Help me (the pet, or the pause sheet) is one hint a press: the next control toward the contrast hops under a ring. Once the contrast has been seen, Help points at the tick (Done) and counts no hint. An unhelped round ends 0 misses, 0 hints, and the ordinary step-up rule applies: that is exposure, not evidence that she understands stored state, and the how-to card says it is a try-out.

**Layout and words.** Tray, drawer and window read left to right in landscape and top to bottom on an upright phone, where the three panels stack rather than shrink; every target is at least 100 units and clear of the pet and corners (`deskLayout`, tested at the landscape, portrait and upright phone views). The spoken words are "Keep", "Show" and "this toy desk", matching the study's stored-copy sources; nothing claims this is how a real computer's memory works. The ghost finger plays a picture, Keep, the other picture, Show and the tick through the same taps.

Levels 2–3 (a hatch per step that lets the new token in or keeps the old one) are [defined](../definitions/memory-desk.md#the-model-logicts) and not built.
