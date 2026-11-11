# Sorting Machine

<!-- generated: from src/games/sorting-machine; edit the text below the end mark (npm run game-docs) -->

**ID:** `sorting-machine` · **Land:** Tinker Lab · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** logic, rules, testing, systems

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |
| grown-up | 3, 9, 8 |

| Level | Plays like |
| --- | --- |
| 1 | See the signal |
| 2 | Choose the sensor |
| 3 | Both badges |
| 8 | Festival Signals |
| 9 | Fix the lantern |

<!-- end generated -->

**Starts as:** send pictured critters through a toy machine and watch its door, then pick the sensor a sign asks for and Check it on all four critters; at the grown-up band, build or repair a four-part festival lantern machine

**Grows into:** levels 1–2: a fixed sensor and two critters, tap a friend then Send and see the reading (star, hollow ring) and the door open or stay shut, nothing counted; then pick the sensor for the sign, with an incomplete Check free, a wrong machine one miss on the first failing friend, a glow and Help after two, Undo/Start again and a Slow turtle step. Any accepted machine passes; then level 3: two fixed sensors and one gate slot (and / or); grown-up levels 8 and 9 build and repair a flat four-slot machine that lights a lantern for exactly one of two badges, see the design notes. Tinker Lab

## Design notes

*Levels 1–3 · [definition](../definitions/sorting-machine.md) · how-computers-work slices H2 and H3; levels 8–9 are in the paragraph before “Misses and help” · [definition](../definitions/festival-signals.md) · slice H5.* A toy machine with a sensor for one property (hat, whiskers or boots) and a door. A critter goes in, the sensor shows a reading token (star = yes, hollow ring = no, dotted ring with ? = no sensor yet) and the door opens or stays shut. The lines carry yes/no values, not current; no machine wording about electricity or power.

**1 See the signal:** a fixed sensor and two critters, one with the property and one without. Tap a friend, then Send, and watch the reading and the door. Done is dim until both are sent and ends the round. Nothing counts: 0 misses, 0 hints (the how-to card says it is a first look, not a test). **2 Choose the sensor:** four critters, one for each combination of two properties P and Q, and a sign (a picture: property, then open door) asking for P or Q. Tap the empty sensor slot to open a two-candidate picker. Send runs one friend (an empty slot reads "incomplete", no mark). Check runs all four at once.

**3 Both badges:** two fixed sensors, P and Q in seeded order, sit above one gate slot. Tapping the slot opens a two-tile picker (a gate picture with its word, "and" or "or"); the sign reads "P and Q → open door" and always asks for both. A run shows each sensor's reading under it, then the gate's answer half a stage later, then the door. Picking, Send, Undo, Slow and an incomplete Check are free. A complete wrong gate (OR) fails exactly the two one-badge friends: one miss, and the first failing friend runs. Help press 1 runs a one-badge friend (even if the gate is already right); press 2 installs AND. Voice lines are per pair, not templated. At levels 2 and 3 the help falls back to a telling friend when the machine is already right.

**8 Festival Signals and 9 Fix the lantern (grown-up; order 3, 9, 8):** a flat machine of four gate slots beside levels 1–3's tree, with an overview along the top (wide) or under the friends (upright), friends on cards (each with a small board showing the lantern the sign wants, and the last result under it), and a selected-slot inspector. Two badges P and Q (a seeded pair), and the lantern must light for exactly one of them; the lantern is a festival signal, not a door, so every friend gets in. Level 8 starts empty; level 9 starts with a machine that lights for three friends (the both-badges friend lights wrongly) and a lantern wire she can move to another slot. Any of the 24 accepted machines passes (`accepted.ts`, re-derived over all 2,005,696 fillings in `flat.test.ts`). Sending a friend and an incomplete Check are free and open the first gap; a complete wrong machine is one miss, a second miss glows the slot, Help counts a hint a press (first press opens the first empty slot's inspector while the path has a gap, then a run, then one fix that keeps her slots; on a right machine it says Check). Undo and Start again. Ghost finger at level 8. Every other sticker hangs a lit lantern. The game is upright-ready.

**Misses and help.** Send, picking and an incomplete Check are free (the slot pulses). A complete wrong machine is one miss: the two mixed friends get a badge and the first failing friend runs. The second miss, and every second one after, glows the slot (the gate slot at level 3) and counts one hint once. The pet's Help counts one hint a press: the first runs a telling friend, the second installs the right sensor (a Check still ends the round). Undo takes back a pick; Start again resets the machine; a Slow turtle toggle steps a run tap by tap. Any accepted machine passes. Taps are guarded during the finale. Co-play: one chooses the sensor, the other predicts the door; off-screen hints are in the module. Ghost-finger demos at all three levels.
