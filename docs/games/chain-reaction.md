# Chain Reaction

<!-- generated: from src/games/chain-reaction; edit the text below the end mark (npm run game-docs) -->

**ID:** `chain-reaction` · **Land:** Tinker Lab · **Ages:** pre-K–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** prediction, cause-and-effect, planning, revision

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 7, 8, 1, 2, 3 |
| school | 3, 4, 5, 6, 9 |

| Level | Plays like |
| --- | --- |
| 1 | Put one ramp in place so the marble rings the bell |
| 2 | Add one ramp to a machine that already has a ramp |
| 3 | Place two ramps so the marble reaches the bell |
| 4 | Use two ramps to touch the little chime, then ring the bell |
| 5 | Complete a five-part machine: chime first, bell last |
| 6 | Find one of several working designs for the chime and bell |
| 7 | Tap the coloured ramps to turn them so the marble rings the bell |
| 8 | Which bell? Tap the bell the marble will ring, then run it |
| 9 | Two marbles: each one rings the bell of its own colour |

<!-- end generated -->

**Starts as:** drag a loose ramp into a large socket, run the machine and watch the marble ring a bell

**Grows into:** level 7 (pre-K entry) turns two preplaced ramps by tapping; level 8 predicts which of three bells a finished machine will ring; level 9 (school top) sends a red and a blue marble to their own bells on one board, one ramp each; fixed and loose ramps together, two-piece revisions, touching a little chime before the bell, then several valid designs; failed runs are experiments, and the light bulb shows one useful placement

## Design notes

*After The Incredible Machine.* Drag loose ramps into large sockets, run the machine and watch the marble; then move one part and run again. Nine levels with two small machines per round (three at level 8): a single loose ramp, fixed and loose ramps together, two-piece revisions, touching a little chime before the final bell, and several valid designs. Level 9, *Two marbles* (school top; the school order is 3, 4, 5, 6, 9, so 7 and 8 stay pre-K entries), is described below. Level 8, *Which bell?*, is a pre-K entry after level 7 and before level 1 (the pre-K order is 7, 8, 1, 2, 3; a school player carried to 7 or 8 lands on 3): a finished fixed machine (four columns, three rows, two fixed ramps on the marble's path and sometimes a third it never reaches; the marble always stays on the board and may end in a corner or back under the cup, so the ramps have to be read) with three bells along the bottom. She taps the bell she predicts (a blue backdrop marks it), then the green arrow runs it; running before choosing only asks for a bell. A match says "You knew which bell it would ring!"; a different bell rings anyway, the pet says which, the red trail stays briefly and the next machine follows, never a miss. The light bulb glows the start cup and says to follow the marble down with a finger, and is not counted as a hint. Three machines make a round, with one sticker; the ghost finger taps the correct bell, then run. Replay is deterministic. A run that misses is an experiment, never a miss; loose ramps can go back to their tray. After a run that misses, a faint red path of the marble stays on the board until the next run or machine, and tapping the blue start cup replays that run without changing misses or hints. The light bulb gives (and counts as a hint) one useful placement that keeps correct work. Rule tests enumerate every visibly different placement across many seeds per level and require the planned solution count, solvability and a useful hint.

Level 9, *Two marbles*, puts a red and a blue marble on one 5x4 board with one fixed ramp, two loose ramps and three decoy sockets. Each cup shows a red or blue dot and each bell is tinted with its marble on its face. Run sends red, then blue, and the machine works only when both ring their own bell. Each marble's way down needs its own loose ramp and the two ways never share a cell; the spare sockets include one on a marble's way, so a ramp put there for one marble can knock the other off course (some placement rings one bell while the other misses, in both directions). A run that fails is a free experiment, not a miss, and leaves a red and a blue trail; tapping either cup replays both. The bulb counts a hint and glows a ramp that matters to the marble that missed. Two machines make a round, one sticker, with help too; the ghost finger plays it. Rule tests check that every seed has one to three accepted designs and the one-bell-only placements. A ramp in the bottom row partly covers the bell beneath it (also on levels 3 to 6).

Level 7, *Tap to turn*, has three rows, one fixed wooden ramp and two coloured ramps already in their sockets. Tap a coloured ramp to reverse its groove, then run the marble to the bell. Every seeded board starts unsolved and has a working flip set. The bulb glows one ramp toward the nearest working set and counts a requested hint; asking on a solved machine only says to run it. Experiments and replay are free, and any working flip set completes the machine. Both machines earn one sticker, including with help. The ghost finger taps ramps, then Run. Existing level IDs, pins, school range and supported bands are unchanged; younger openings remain proposals.
