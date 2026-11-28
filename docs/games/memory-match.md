# Memory Match

<!-- generated: from src/games/memory-match; edit the text below the end mark (npm run game-docs) -->

**ID:** `memory-match` · **Land:** Puzzle Peaks · **Ages:** toddler–school · **Challenge:** noticing · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** memory, matching, number-sense, letters, telling-time

| Band | Levels, easiest first |
| --- | --- |
| toddler | 1 |
| preschool | 1–5 |
| pre-K | 3–9 |
| school | 8, 12, 13, 9, 10, 11, 14 |

| Level | Plays like |
| --- | --- |
| 1 | Four cards: two picture pairs |
| 2 | Six cards: three picture pairs |
| 3 | Eight cards: four picture pairs |
| 4 | Twelve cards: six picture pairs |
| 5 | Sixteen cards: eight picture pairs |
| 6 | Match numbers 1–4 to dots |
| 7 | Match numbers 1–8 to dots |
| 8 | Match both shape and color |
| 9 | Match uppercase and lowercase letters |
| 10 | Match number words one–ten to numerals |
| 11 | Match fraction pictures to names |
| 12 | Same time: match hour and half-hour clocks |
| 13 | Same total: two groups of dots and the number they make |
| 14 | Same share: equal fractions with different pieces |

<!-- end generated -->

**Starts as:** four named picture cards, shape/friend/fruit decks and free replay

**Grows into:** sixteen cards, number↔dots, shape + color, A↔a, number words↔numerals, rotated fraction squares↔names, analog↔digital hour/half-hour clocks, two pictured groups of dots↔the number they make

## Design notes

Picture levels 1–5 draw a seeded family of shapes, eight island friends (including Pip), six fruits plus a balloon and flower, or eight vehicles (car, bus, truck, train, boat, plane, rocket, tractor). Each board samples distinct pictures from its family, with exactly two cards per identity and matching spoken names. Grows from four to sixteen cards, then teaches number/dot (each card shows its dots in one of several arrangements: two columns, dice-like scatter, rows or a five-frame), two-attribute, upper/lowercase, and number-word/numeral matches (one through ten). Level 11 matches a shaded half, quarter or three-quarter square to its spoken name. Each round seeds the square rotations and which equal parts are shaded: two equal pieces for a half, four for quarters, always the same whole size. Level 12, Same time, selects three distinct hours from the twelve-hour clock, with both whole and half hours on every six-card board; one numbered analog face matches one digital display of each time. The short hand moves halfway for half past. School steps through IDs 8, 12, 9, 10, 11, putting the clock bridge before the reading modes while preserving saved IDs/pins; preschool and pre-K keep their windows. Clock reveals/replay name the time, and the stable hint explains both hand positions. Every revealed card names its contents; tap the first open card again for free replay without making another choice. Exploring unseen cards gets a neutral description and does not count as a miss: an incorrect pair counts only if the first card’s matching partner was already known. After two such misses, one known partner glows, charging one hint until a match clears it. Speech supports listening-assisted matching; completion does not establish independent reading or clock understanding. Find every pair to finish for one sticker, including with help.

**Challenge course (`The Card Tables`, `course.ts`, 2026-11-27).** Four frozen tables in `src/games/memory-match/course.ts` (version 1; three, four, six and eight picture pairs, pictures named by id so a pool change cannot alter a table), par `[8, 12, 18, 24]` (total 62) from `solverFlips`, the same remembering player that `autoplay()` and the how-to ghost use (a lucky player can beat it, so the screens say par, `reference: true`). Every card turned over is a flip and is saved at once through `progress()`; pressing the card already turned is free. Two known mismatches in a row glow the partner and mark the run assisted. `routes: true` replays each table with `autoplay()`. Played on the couch through the puzzle shelf at level 5.

**Upright (2026-11-17).** A pure `boardLayout` centres the grid on the whole width below the corner buttons and above the pet, with cards up to 170 units (about 116 before); sideways layouts are unchanged. Layout test: `src/games/upright-batch-7.test.ts`. **Since 2026-11-27** an upright board of six or fewer cards goes two across with cards up to 300 units, so a phone's six-card boards (levels 2, 11, 12 and 13) fill three rows rather than one short strip; on a 390×844 phone a card is about 150 CSS pixels instead of about 86.

**Same total (level 13, 2026-11-27).** Three pairs, school, placed after Same time in the order [8, 12, 13, 9, 10, 11]. `selectSums` picks three distinct totals from 2–10 and splits each into two groups of 1–5 dots with the seeded RNG (every total and all 25 ordered splits are reachable). One card shows the two groups either side of a centre line, teal left and orange right on every card so color never gives a pair away; its partner shows the total as a numeral. No plus sign or equation appears: the parts are always pictured. A groups card names its groups ("two and three"), a number card its number. A match says "Two and three make five. A pair!"; a groups card turned with the wrong number says "Two and three make five, not seven", and two groups cards name both totals, whether exploring or a known miss (only the known miss boings and counts). The hint after two known misses counts across both groups aloud ("one, two, three, four, five") before pointing to the glowing partner; the glow itself is unchanged and the counting is spoken, not drawn on the cards. Accounting, replay and the remembering bot are unchanged.
