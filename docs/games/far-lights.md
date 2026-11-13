# Far Lights

<!-- generated: from src/games/far-lights; edit the text below the end mark (npm run game-docs) -->

**ID:** `far-lights` · **Land:** Tinker Lab · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** observation, comparing, distance, brightness

| Band | Levels, easiest first |
| --- | --- |
| lap | 9, 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–4 |
| school | 4–8 |

| Level | Plays like |
| --- | --- |
| 1 | Glow: tap a light and it floats close and glows up |
| 2 | Come closer: drag both lights to the window |
| 3 | Which looks brighter? Tap the brighter light |
| 4 | Make them match: move a light until both look the same |
| 5 | Behind the curtain: tap the farther light |
| 6 | Near to far: put three lights in order |
| 7 | Strong and gentle: which light is farther when both look the same? |
| 8 | Can't tell yet: both could fit, then step to the side |
| 9 | One big light: a touch anywhere floats it close, and a second and a third light wake |

<!-- end generated -->

**Starts as:** lap opens on one big light, a touch anywhere floats it close (level 9); then tap a light on a night lake and watch it glow in the window

**Grows into:** lap's own level 9 (one big light, then a second and a third wake); later drag lights nearer and see them look brighter, pick which of two looks brighter, and move a loose light until both look the same

## Design notes

**A right answer never holds the next lights (U7 fix batch 1, 2026-11-10).** All six right-answer lines (`far.right-brighter`, `far.same`, `far.right-farther`, `far.order-right`, `far.right-strong`, `far.right-step`) go through one helper: the line starts, the next lights follow the motion (a short bob at levels 3–4; the curtain's lift and the look behind it at levels 5, 6 and 8), and input opens while the lesson line still plays. The board's instruction is said when the lesson ends, unless a hint or a wrong-answer line was said meanwhile. The last board and level 7 (whose next board opens with its own held look) still wait for the line. The voice line `far.curtain` was removed, since it would have cut the lesson. Hints, `far.not-bigger`, the level 7 narration and `far.done` stay held.

*Levels 1–8 · slice 2 of the [astronomy study](../deep-dives/subjects/astronomy.md), [definition](../definitions/far-lights.md).* A quiet night lake seen two ways: a strip above shows the lake from the side with a little house and its round window at one end and two paths of floating lights running away from it (stops 1 to 4, nearest the window first); the window below shows the same lights over the dark water, each a fixed core inside a soft halo. All lights are the same, so only distance changes how bright one looks: the halo grows and brightens toward the window, and never changes the core (a toy model; the card says the halo shows how bright a light looks, not how big it is). One arrangement, the strip above the window, serves every view. Music is the hub style.

**Levels.** Level 1 *Tap a light* (lap, toddler): tap a light and it floats to the window and glows up with a chime, then drifts back; three counted taps finish, and a tap on a moving light is free. Level 2 *Bring them close* (toddler, preschool): drag each strip light along its path to stop 1; "Brighter!" once per stop per light as it crosses toward the window, "Dimmer." when it goes away; both at the window finishes. Level 3 *Which looks brighter?* (preschool, pre-K): two pairs; both views are shown, and she taps the light that looks brighter in the window. Level 4 *Make them match* (pre-K, school): two boards; a reference light is marked on its path and she drags the loose light until both look the same, then presses Check (board two swaps lanes and uses another reference stop). Bands: lap 1, toddler 1–2, preschool 2–3, pre-K 3–4, school 4.

**Level 9, One big light (2026-11-13, PR #1619).** Lap-only, after the ladder (levels 1–8 unchanged) and first in lap's order (9, then 1); a saved 9 lands at toddler's 1. One big light (core 80 units across, a soft glow around it; level 1's core is 20); a layer over the whole view takes every touch. A counted touch floats every awake light close (halo blooms, three rising bells, "Ooh, so bright!") and they drift back, then a new light wakes and stays (middle, left, right; "Another light woke up!"); three counted touches finish. A touch while they float gets a ring where she touched and a soft bell, free; every touch shows a ring at the touch point. Show a hint pulses the awake lights and repeats the instruction (`far.instruct.big`), counting nothing. Level 1's Show a hint now also only pulses a light: no hint counted and none of the three taps spent (before, each press counted a hint and floated a light). Nothing at level 9 is a miss or a hint.

**Misses and help.** Levels 1–2 count no misses or hints (the shell has no exploratory flag, so two smooth rounds still step the level up; the card says these levels are for looking). At level 3 a wrong tap is one miss with the named reason, and the brighter light glows after two. At level 4 dragging is free; a wrong Check is one miss ("This one looks brighter. Move it farther away." or "This one looks dimmer. Move it closer."), and the matching stop's post glows after two. Show a hint counts once per tap, pair or board (level 1 pulses and floats the nearest light, level 2 steps the farther light closer, level 3 pulses the brighter light, level 4 glides the loose light to the match and she still presses Check); asking again repeats the help without counting. Start again is always there; the hint's glide and the finish hold the lights still. Nothing is kept: no creation and no journal entry. Home land Tinker Lab (region `tinker-lab`). A Kokoro title clip (`game.far-lights`) and a ghost-finger bot that follows the hint rules. Co-play: at level 3 cover the strip with a hand, pick the brighter light from the window, then lift the hand to see which is nearer. Off-screen: look out of a window tonight and notice whether a near light or a far light looks brighter. Known gaps (2026-11-05, levels 1–4): no iPad or device speech check; whether a lap child links her tap to the swelling halo, whether a toddler keeps a light moving with one finger, whether a four-year-old reads the halo as brighter rather than bigger, and the stop-4 halo in a lit room are unchecked ([DEVICE-CHECKS](../archive/DEVICE-CHECKS-2026-11-09.md#far-lights-levels-14-astronomy-slice-2-2026-11-05)); no astronomy educator has reviewed the toy.

**Levels 5–6 (built 2026-11-06).** Level 5 *Behind the curtain* (school): a curtain hides the strip, so only the window shows; two lights glow at different brightness and she taps the farther one (the dimmer halo); the tassel lifts the curtain after her answer. Level 6 *Near to far* (school): three lights over the dark water, the curtain down, and she taps them to mark an order, nearest first, shown as order dots (no numbers) with faint stop lines for the strip; pulling the tassel checks the order and lifts the curtain on a right answer. School range {4,6}; the curtain drops again for the next board. **Misses and help (5–6).** A tassel pull at level 5 before answering is a free bob, and at level 6 a pull before three marks, and re-marking, are free. A wrong tap at 5 is one miss (the farther light glows after two); a wrong pull at 6 is one miss with the named reason, and it clears the marks from the first wrong one (earlier correct marks stay). Show a hint counts once per board; hint marks are locked and always a correct nearest-first prefix, and asking again on the same board marks the next light free. The idea that the tassel replays the lifted view after a board ends was not built. Known gaps: no iPad check ([DEVICE-CHECKS](../archive/DEVICE-CHECKS-2026-11-09.md#far-lights-levels-56-astronomy-2026-11-06)).

**Levels 7–8 (built 2026-11-06).** Level 7 *Strong and gentle* (school): two boards, each a different pair of lights from four (a strong light 4 or 9 over a gentle one at a nearer stop; the strong light is in lane A once and B once). The opening look puts both at the strong light's stop ("This one is a strong light"), the gentle light glides 1.2 s nearer ("Now they look the same!"), then the instruction; she taps the strong (farther) light. A gentle tap is one miss and two misses glow the strong light; the curtain lifts showing ray rings (1, 2 or 3 for glow 1, 4, 9). A finished level-7 round files the journal entry `far-lights:strong-far`. Level 8 *Can't tell yet* (school): two boards, each a 1@1 light with a 4@2 or 9@3 light, lanes swapped. Both could fit and step buttons sit along the window's bottom; the toy step shifts the view 120 per stop against far trees that stay put, leaving faint rings where the lights were; stepping again toggles back, free. A tap before the step is a guess ("Maybe!"), never a miss, and Both could fit never counts; after the first step a tap on the nearer light is one miss. Hints: before Both could fit it pulses that button, between that and the step it pulses the step button, and after the step it joins rings to lights with lines and pulses the farther light; once per board. School range {4,8}. The tassel does not replay after a board ends (as at 5–6). Known gaps: no iPad check ([DEVICE-CHECKS](../archive/DEVICE-CHECKS-2026-11-09.md#far-lights-levels-78-astronomy-2026-11-06)).
