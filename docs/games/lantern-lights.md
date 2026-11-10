# Lantern Lights

<!-- generated: from src/games/lantern-lights; edit the text below the end mark (npm run game-docs) -->

**ID:** `lantern-lights` · **Land:** Lantern Lake · **Ages:** school–grown-up · **Challenge:** logic · **Plays by:** touch and controller, upright on a phone · **Ghost finger:** yes

**Skills:** logic, planning, pattern-finding

| Band | Levels, easiest first |
| --- | --- |
| school | 1–2 |
| grown-up | 1–9 |

| Level | Plays like |
| --- | --- |
| 1 | A 3 by 3 pond: find the one or two lanterns to press |
| 2 | A 3 by 3 pond with a few more presses to find |
| 3 | A 4 by 4 pond with a short way to light every lantern |
| 4 | A 4 by 4 pond that takes planning |
| 5 | A 5 by 5 pond with a short way to light every lantern |
| 6 | A 5 by 5 pond that takes planning |
| 7 | A 6 by 6 pond with a short way to light every lantern |
| 8 | A 6 by 6 pond that takes planning |
| 9 | Lily-pad ponds: a shaped pond where the pads stop the flips |

<!-- end generated -->

**Starts as:** a 3 by 3 pond of paper lanterns: press one to flip it and its four neighbours, and light them all (at the school band, about 7 and up, it plays levels 1–2, the 3 by 3 ponds, in 100-unit cells and buttons with no gate; `lantern.stuck-school` nudges toward Hint once a pond)

**Grows into:** 4 by 4 and 5 by 5 ponds that take planning, then 6 by 6 ponds (levels 7–8, one winning set), then lily-pond shapes (level 9: a pad is already lit and never pressed, so the pond is a ring, an L or a diamond); a hint that always brings the fewest presses down by one and says whether the pond has one short way or several; after a pond is lit by touch, a Show me a short way replay; one puzzle-shelf course scored in presses against an exactly worked-out par (Dusk on the Pond)

## Design notes

On an upright phone the pond sits below the corner controls, with the count above it and the round controls underneath.

**Decided 2026-10-23 (on the developer's delegation):** What counts as a miss in Lantern Lights by touch, and the other grown-up puzzles: Count a miss only where the game shows it: Lantern Lights stays 0; Sudoku Garden's wrong digit (against the solution) stays a miss and now gets the gentle boing and a spoken hint; Island Bridges' stray plank and Picture Logic's stray fill stop counting as misses (0, adapt on hints). ([record](../archive/DECISIONS-2026-10-23.md))

*grown-up couch play · after Lights Out, on a pond at dusk.* A square of paper lanterns, each lit or dark. Pressing one flips it and the lanterns above, below and beside it; the goal is every lantern lit. The cursor shows a faint glow over what a press would flip. **Controls:** the stick or D-pad moves (hold to repeat); the bottom button presses; the left button takes the last press back; the pause menu has **Show a hint** and **Start this pond again**.

**Score and help.** Every press counts, and a press taken back stays counted (taking it back is free); the fewest is the pond's par, so the score is presses over par. A hint (marks a challenge run as helped) points at a lantern in one of the fewest-press ways to light the pond from where it stands now, and the cursor goes to it; pressing it always brings the fewest down by exactly one, so a hint never leads away from the finish. A restart puts the pond back as it began, with the presses so far still counted. There are no misses to count: any press is allowed, and nothing is ever stuck, because every pond can always be lit.

**The rules** are in `logic.ts`. Pressing is its own undo and the order never matters, so a way to win is just which lanterns get pressed an odd number of times, and whether a set wins is a system of linear equations over two numbers. `solve` finds every winning set by Gaussian elimination over two numbers and picks the fewest, so a pond's par is worked out, never guessed (a 5 by 5 pond has four winning sets, a 4 by 4 sixteen, a 3 by 3 or 6 by 6 one). `makePond` lights every lantern and then presses a plan's number of different lanterns at random, so every pond can be lit, and drops one that turns out easier than the plan's `atLeast`. Nine levels: 3 by 3 with two, then four presses to find; 4 by 4 with four, then seven; 5 by 5 with five, then ten; 6 by 6 with seven (a short way to light every lantern), then twelve (planning); level 9 is lily-pad ponds (below). Rule tests assert the fewest against a brute force over every 3 by 3 and 4 by 4 board and over 4000 random 5 by 5 boards, 200 seeds at levels 7–8 check the pond has exactly one winning set and its par is exactly 7 or 12 (including the quarter that cannot be lit, which `solve` reports as none), every winning set lights the board, each level's par lies inside its plan, hints bring the fewest down by exactly one on every level, and the same seed gives the same ponds.

**Couch.** A trip stop (face-off `twin`: each plays their own seeded pond, scored in presses over the fewest) climbs levels 1–6 (the trips stop at 5 by 5 and the course is pinned at 6). One puzzle-shelf course of frozen ponds, **Dusk on the Pond**: a 4 by 4 pond and four 5 by 5 ponds with fewest presses 4, 5, 7, 9 and 11 (par 36); `course.ts` holds them with a `version`, and tests assert each can be lit, none starts lit, the par is the solver's, and the ponds climb. It opens in the last tier of trips and is on the shelf from the start. Not built on the couch: a 6 by 6 level, a replay of the best way (touch has one), lanterns with more than two states.

**Island touch (2026-10-13).** In Lantern Lake the game plays by touch: tap a lantern to press it (a layer over the pond works out which one, so every cell is at least about 100 units), and three buttons under the pond take the last press back, show a hint (the lantern to try rings; the voice says `lantern.hint-one`, "There is only one short way", or `lantern.hint-many`, "There are a few short ways", by whether the pond has exactly one fewest set, and the couch pause menu hint uses the same lines) and start the pond over. There is no cursor on touch. Misses are always 0 (a press is never wrong, and taking one back is free), each hint counts, and the round gives one island sticker. The ghost finger taps the lanterns of a fewest-press way. **Show me a short way (every pond, every band, touch only).** After the glow-up the three buttons give way to **Show me a short way ▷** (purple) and **Next pond ▶** (green; **All done ▶** on the last pond), and `lantern.after` is said once a round on the first wait. The replay resets the pond to its start and presses the pond's deterministic fewest-press way (`shortWay`, `solve(start).best[0]`) one lantern every 0.6 seconds with a white ring, flipping only the lanterns that change, then the rows bob with bells; it counts nothing (presses and hints unchanged) and can be repeated. Switching to keys or a pad while waiting goes straight on. The ghost finger presses Next pond. The buttons and tap layer are absent in couch play, which still drives the same board with `control()`. Levels 7–9 (6 by 6 and the lily-pad ponds) are grown-up only on the island. **Lily-pad ponds (level 9, grown-up only).** Some squares of a 5 by 5 pond are lily pads, shown as green notched leaves: a pad starts lit, never flips, and is never pressed, so a press flips only the lantern cells in its cross. Four authored shapes (`SHAPES`): the 21-lantern square with its corners as pads (3 free choices), a ring around a centre pad (24 lanterns, 2), an L (16, 1) and a diamond (13, 2). A round is two ponds of two different shapes, scrambled 6 presses, at least 5. A tap on a pad bobs it with a soft tick and counts nothing; the cursor stays put. The count reads "N of <lanterns> lit" (pads are not counted), and `lantern.pads` ("Lily pads float in this pond. They have no lantern, so a press flips only the lanterns beside it.") is said once after the instruction on the first pond. The rules carry a mask through `footprint`, `press`, `solve` (a pad's press is forced to 0), `fewestPresses`, the hints and `shortWay`; `parsePond` reads a space as a pad, and the couch course parses the same text with no mask. Rule tests brute-force every shape (sampled reachable boards against an exhaustive table, and an unreachable board returns null). **School (about 7 and up).** `school` joins `bands` and plays levels 1–2 (the 3 by 3 ponds, par 3 to 4 presses), no gate, home still Lantern Lake (Wonder Woods lists it by subject). Its instruction is `lantern.go-school`; a pond that reaches the fewest plus six presses gets `lantern.stuck-school` once (a nudge toward Hint; it counts nothing, misses stay 0). The how-to step and co-play text no longer say "four". When the room beside the pond is under 240 units (portrait, 5 by 5 and 6 by 6), the two counts share one line above the pond (`3 presses · 20 of 36 lit`) between the top corner buttons and the pond sits 60 units lower. A how-to step covers level 7 and up. Co-play: talk about which press lights the most; off screen, flip coins in a grid.
