# Moon Window

<!-- generated: from src/games/moon-window; edit the text below the end mark (npm run game-docs) -->

**ID:** `moon-window` · **Land:** Tinker Lab · **Ages:** lap–pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** observing, moon-appearance, matching, comparing

| Band | Levels, easiest first |
| --- | --- |
| lap | 4, 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3 |

| Level | Plays like |
| --- | --- |
| 1 | Look again: press Later three times and watch the Moon change |
| 2 | Same view: tap the card that matches the Moon in the window, two boards |
| 3 | More light: tap the Moon that shows more, or less, light; three comparisons |
| 4 | Big window: a touch anywhere turns the window to the Moon some days later, three times |

<!-- end generated -->

**Starts as:** lap opens on a big window and a touch anywhere turns it to the Moon some days later (level 4); then look out of a round window at the Moon and press Later to see it some days on

**Grows into:** lap's own level 4, then the Later button; later match the window's Moon to a card, or pick the card with more or less light

## Design notes

*Space slice 2 of the [space study](../deep-dives/subjects/space.md), [definition](../definitions/moon-window.md).* A round window on a night sky shows the Moon at one of eight stops of a single lit-fraction cycle (lit = (1 − cos θ)/2, an ellipse terminator, lit on the right as it fills and on the left as it empties). The views are honest snapshots some days apart, not consecutive nights; no phase, night or cause words are spoken, and the amounts are named only as no light, a little light, half, most and all. Music is the lullaby style.

**Levels.** Level 1 *Look again* (lap, toddler): a big Later button; each of three presses dims the shutter and opens on the Moon some days on (the first round goes stops 1, 2, 3, 4), and a ribbon of thumbnails along the bottom replays any view's line. Level 2 *Same view* (toddler, preschool): two boards; tap the card whose Moon matches the window's. The two cards differ in lit amount by at least 0.3, so they are never mirrored twins or most-versus-full; the opening boards are [slice, half] with half the target, then [full, slice] with full the target. The right card flies into the window. Level 3 *More light* (preschool, pre-K): three comparisons; the window shows sky only and two cards hold Moons at one size, with a request card (a big glowing Moon and an arrow up for more, a small one and an arrow down for less; tap it to hear the request again). Both requests appear and the answer is not always on one side; the opening rounds are [full, slice] more, [most, half] less, then one seeded. Bands: lap 4 then 1, toddler 1–2, preschool 2–3, pre-K 3.

**Level 4, Big window (2026-11-13, PR #1621).** Lap-only, after the ladder and first in lap's order (4, then 1); toddler still starts at 1, and a saved 4 lands at toddler's 1. There is no Later button: a full-view catcher under the window takes a touch anywhere (a 200 ms cooldown). Each touch shows a ring at the touch point and a soft squash of the window; when the window is still it turns (shutter, two bells, "Some days later…" and the view's line) to the next view. Three touches show four views in model order (the authored first round goes slice, half, most, full), each joining the row of thumbnails along the bottom, then the round ends (glow, done line, sticker). A touch while the window turns, or after the last turn, gets a ring and a soft note and changes nothing. Thumbnails sit above the catcher and still replay their line without turning. The window is 440 units with a Moon of radius 120 (level 1: 340 and 90), centered. Input is open from the start; the opening says "Look out of the window!" then `moonwindow.instruct.big` ("Touch anywhere to see how the Moon looks later."). Show a hint pulses the window, repeats the instruction and counts nothing; nothing at level 4 is a miss or a hint. The ghost finger taps the wall beside the window. Lap co-play now reads "Before {name} looks again, …".

**Misses and help.** Level 1 counts no misses or hints; Show a hint pulses Later and counts nothing. At levels 2–3 a wrong card is one miss per board: it slides beside the window (clear of the other card) and the pet compares in words ("This one has a little light. The window has half."); at level 3 both lit parts are outlined. After the miss the right card glows (not a counted hint). Show a hint before any tap counts one hint per board, and is ignored while the right card is flying in. Home land Tinker Lab (region `tinker-lab`). A Kokoro title clip and a ghost-finger bot: it presses Later (with one free thumbnail replay) and taps the right card; the demo shortens to two presses or one board. Co-play: ask which Moon has more light before she taps. Off-screen: look at a real Moon on a clear night with a grown-up and say how much of it is lit, without a promise that it will be there. Known gaps (2026-10-27): no iPad or device speech check; whether a toddler presses Later alone, whether a slice reads at iPad size and whether "more light" is heard as more lit are unchecked ([DEVICE-CHECKS](../archive/DEVICE-CHECKS-2026-11-09.md#moon-window-levels-13-space-slice-2-2026-10-27)).

**The friend's line never holds the next cards (U7 fix batch 25, 2026-11-12).** Levels 2-3: the right card's `moonwindow.right` (level 2) or the tapped card's view line (level 3) starts and the next two cards slide in about 0.9-1.1 s later, over the line. The board's request waits for the line, the guide or her first tap: the right card goes ahead (judged), the other card or the request card says the request (never a miss). Show a hint drops the waiting request; restart says it. The last board's line is heard out before `moonwindow.done`. The ghost finger waits for the request.
