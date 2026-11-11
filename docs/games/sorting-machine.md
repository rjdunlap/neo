# Sorting Machine

<!-- generated: from src/games/sorting-machine; edit the text below the end mark (npm run game-docs) -->

**ID:** `sorting-machine` · **Land:** Tinker Lab · **Ages:** school · **Challenge:** logic · **Plays by:** touch · **Ghost finger:** yes

**Skills:** logic, rules, testing, systems

| Band | Levels, easiest first |
| --- | --- |
| school | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | See the signal |
| 2 | Choose the sensor |
| 3 | Both badges |

<!-- end generated -->

**Starts as:** send pictured critters through a toy machine and watch its door, then pick the sensor a sign asks for and Check it on all four critters

**Grows into:** levels 1–2: a fixed sensor and two critters, tap a friend then Send and see the reading (star, hollow ring) and the door open or stay shut, nothing counted; then pick the sensor for the sign, with an incomplete Check free, a wrong machine one miss on the first failing friend, a glow and Help after two, Undo/Start again and a Slow turtle step. Any accepted machine passes; level 3 (AND/OR) not built. Tinker Lab

## Design notes

*Levels 1–3 · [definition](../definitions/sorting-machine.md) · how-computers-work slice H2.* A toy machine with a sensor for one property (hat, whiskers or boots) and a door. A critter goes in, the sensor shows a reading token (star = yes, hollow ring = no, dotted ring with ? = no sensor yet) and the door opens or stays shut. The lines carry yes/no values, not current; no machine wording about electricity or power.

**1 See the signal:** a fixed sensor and two critters, one with the property and one without. Tap a friend, then Send, and watch the reading and the door. Done is dim until both are sent and ends the round. Nothing counts: 0 misses, 0 hints (the how-to card says it is a first look, not a test). **2 Choose the sensor:** four critters, one for each combination of two properties P and Q, and a sign (a picture: property, then open door) asking for P or Q. Tap the empty sensor slot to open a two-candidate picker. Send runs one friend (an empty slot reads "incomplete", no mark). Check runs all four at once.

**Misses and help.** Send, picking and an incomplete Check are free (the slot pulses). A complete wrong machine is one miss: the two mixed friends get a badge and the first failing friend runs. The second miss, and every second one after, glows the slot and counts one hint once. The pet's Help counts one hint a press: the first runs a telling friend, the second installs the right sensor (a Check still ends the round). Undo takes back a pick; Start again resets the machine; a Slow turtle toggle steps a run tap by tap. Any accepted machine passes. Taps are guarded during the finale. Co-play: one chooses the sensor, the other predicts the door; off-screen hints are in the module. Level 3 (AND/OR gate, H3) is not built. Ghost-finger demos at both levels. Device speech, iPad touch and a child's reading of the pictures remain open.
