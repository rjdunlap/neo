# Dot Link deep dive

*ID `dot-link` · bands lap, toddler, preschool, pre-K · levels 1–6 on 2026-10-14 · session `claude/dot-link-deep-dive` ([PR #342](https://github.com/rjdunlap/neo/pull/342))*

## The game today

She pops colored dots: tap one, drag a line through neighbors of one color, and new dots drop in from the top. Learning: color matching and fine-motor control first, then counting a chain, planning which line to draw, and a loop (a closed square clears a whole color). Source baseline: `origin/main` `c0992cd`; inspected `src/games/dot-link/` (`logic.ts`, `index.ts`, `logic.test.ts`), its [GAMES.md](../GAMES.md#dot-link) entry, its how-to card and voice lines (`dots.*`). No couch entry, no journal entry, no picnic step.

Band windows (`LEVELS`): lap 1, toddler 1–2, preschool 2–4, pre-K 3–6. No school window.

| Level | Plan | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | Tap dots to pop them (4×5, 3 colors, 12 pops) | lap, toddler | Nothing: any tap pops. A move always exists |
| 2 | Link two dots of one color (4×4, 3 colors, 6 links) | toddler, preschool | Which neighboring pair |
| 3 | Pop 8 dots of one named color (5×5, 4 colors) | preschool, pre-K | Which color's lines to draw; longer lines pop more |
| 4 | Three chains of 4 (5×6, 4 colors) | preschool, pre-K | A line of at least four; shorter lines pop but do not count |
| 5 | Close a square twice (5×6, 4 colors) | pre-K | Find a 2×2 of one color and go around it |
| 6 | Three chains of exactly 5 | pre-K | A line of five, not four or six |

Content: colors are a seeded draw of 3–4 from five (red, blue, yellow, green, purple); boards are random with `ensureMove` repainting a row or a 2×2 when no counting move exists; refills are random. Misses: a line that pops but does not count (wrong color, too short or long, not closed) is one miss with a spoken hint (`dots.notthat`, `dots.longer`, `dots.around`, `dots.exact`); two in a row glow a real move, and so does twelve idle seconds (each glow counts one hint). Everything pops either way, so nothing is lost. Known gaps: no person check of the toddler drag yet (see [DEVICE-CHECKS](../DEVICE-CHECKS.md)); red and green are both in the palette and the dots differ only by color; no school window.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Dots](https://en.wikipedia.org/wiki/Dots_(video_game)) (Playdots, 2013–2023) | Touch chain game | Link same-colored neighbors; a 60-second round, later a 30-move mode and an endless mode | The pure drag-and-pop feel; a square clearing the color is the original delight | The 60-second timer and the move cap |
| [Two Dots](https://www.gamezebo.com/reviews/twodots-review-brother-can-you-spare-a-dot/) (2014) | Level-based sequel | Goals such as "50 red, 50 blue" in a limited number of moves; a new obstacle roughly every 20 levels: anchors that must fall to the bottom, ice cleared in several passes, fire | Two-color goals; anchors as a "clear what is underneath" goal (a dot that falls to the bottom) | The move limit; fire that spreads; paid lives |
| Flow Free / Numberlink ([overview](https://strategywiki.org/wiki/Flow_Free/Walkthrough)) | Pair-connect puzzle | Same rule, bigger board (5×5 to 15×15) and more pairs; a star for the fewest moves, which equals the number of pairs | Par as an optional second goal, found by a solver; bridges and warps as later modes | The time-trial mode |
| Connecto Colors and similar toddler apps ([example](https://microsoft.com/en-us/p/connecto-colors/9wzdncrdmfnk)) | Baby and toddler drag | A touch-each-color mode for the youngest and a drag-a-line mode for the next step | The touch-only entry; this matches level 1 | Ads and paywalls |
| Bejeweled / Candy Crush and children's match-3 ([commentary](https://www.progkids.com/en/blog/uchimsya-igraya-match-3)) | Match-3 | Swap tiles for runs of three or more; falls and chains; obstacles added in stages | Gravity and refill (already here) | Move limits, lives, boosters sold for money. The planning claims come from marketing text, not studies |
| Dot-to-dot books ([parent-facing summary](https://library.peoplespharmacy.com/connect-dots-kids)) | Print activity | Count 1–10, then 1–20, then 1–100; alphabet order | Number order belongs to the proposed **Star Dots** ([IDEAS](../IDEAS.md)), a separate game. The sources are low quality and cite no research | Not a Dot Link mode |

No standard is claimed: the pre-writing and counting benefits above are asserted by product pages, not measured. Chains of 4 and 5 count along (the game already says the count as she draws).

## What makes sense here

The game has one idea (a same-color neighbor line) and three decisions already (color, length, loop). Depth should come from new decisions, not from a clock or moves: a pattern across colors (links Pattern Train), a total that she builds from several lines (a bridge to addition), and a fixed board with a fewest-lines par (planning, the Flow idea, with no refill). Two Dots' limited moves, ice and fire are left out: pressure and clutter. Anchors suit a calm goal ("bring the acorns to the ground") and are listed as a fresh-content idea. The arc: lap taps, toddler pairs, preschool color and length, pre-K shape and exactness, then school patterns, sums and a fixed puzzle.

## Experience and presentation

- **First unsupported action:** a lap child's tap pops a dot and nothing can go wrong; a toddler drags between two dots that glow as a pair.
- **Touch and consequence:** the line grows with a rising note per dot (`sfx.pop(5 + len)`, pentatonic) and every line pops with a burst, so even a miss is satisfying; the reminder is spoken, never a buzzer. Dots bob when hinted.
- **Variety on replay without a rule change:** seeded colors (3–4 of five), board shape (rectangles now; boards with a few empty cells would make a heart or a ring and change how lines can go), dot art (round, plus a small mark inside each: star, moon, leaf), and the refill.
- **Reasoning versus motor:** levels 1–2 are motor and color; 3–6 add a number or a shape she must keep in mind while drawing; the proposed levels add reading a sign (pattern, sum), kept to pictured signs. Drag precision is forgiving (`cellAt` accepts 0.45 of a cell).
- **Accessibility:** red and green differ only by color; a mark inside each color's dot (also a possible grown-up setting) makes the game playable for color-blind adults and gives co-play a new word ("star dots"). This is the first fresh-content item.
- **Supported finish and stopping:** the round ends when the goal is reached; help glows a real move. A level that ends early is unchanged. No timers, move limits or lives anywhere.
- **Co-play:** one draws, one counts the dots aloud (already the co-play tip). In the pattern and sum levels the grown-up can read the sign.
- **Needs a person or device:** whether a one-year-old's whole-hand drag registers as a line at all (palm rejection can eat it); whether the sum level's remainder sign reads at a glance; the mark art at 34-unit dots on a real iPad.

## Proposed ladder

### Fresh content inside existing levels

- **Marks in the dots** (star, moon, leaf, heart, drop) to pair with the five colors, always on in the dot art or a grown-up switch; no rule change.
- **Boards with empty cells** at levels 3–6 (a seeded shape from a short list; `ensureMove` and `collapse` must treat holes as walls).
- **Longer lines at level 3** by a seeded goal (8–12 dots), and **chain length 3/4/5** drawn at level 4 so the sign changes by round.
- **Anchors** (an acorn or a ball that sits on a dot and falls with the column): bring two to the bottom; a later pre-K level, see below.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | **Two colors** | pre-K | Sign shows a red dot with "6" and a blue dot with "4"; pop that many of each (5×5, 4 colors) | Which color to chase first; a loop pops a whole color and may overshoot, which is fine (counts stop at the goal) | A wrong-color line pops but counts for nothing: `dots.notthat`; glow after two | A seeded board always has enough of each named color to finish; the goals never exceed the board's dots plus refills | One sign, one more count; the bot reuses color mode |
| 8 | **Same, different** | pre-K, school | A pictured pattern (red, blue, red, blue) above the board; draw one line through that color pattern, not one color | The first dot's color from the pattern; a line may repeat the pattern | A line that breaks the pattern is not rejected while drawing; it pops, one miss, "Follow the colors: red, blue, red"; hint glows a real pattern | `findPattern(grid, pattern)` returns a path; `ensureMove` guarantees one; adjacent path obeys `step` except for the same-color rule | New `step` variant, new voice lines, a pattern sign; the bot needs `demoMove` for patterns; shares Pattern Train's AB/ABC idea |
| 9 | **Make ten** | school (and a stretch for pre-K) | A big "10" sign with a counter; each line pops its length; build 10 from several lines | Line lengths adding to exactly 10 (4+3+3, 5+5, 2+8) | A line longer than what is left stops at the limit with "only 3 more"; free undo by stepping back; a sum with a single leftover needs one-dot taps allowed | For every seeded board and every remainder from 10 to 2 a counting line exists; remainder 1 allowed by tap; no unwinnable state | New sign; the bot picks lengths that sum; links to Market Stall's "make a total", not to Number Trails; opens a `school` window (decision) |
| 10 | **Clear the garden** | school | A fixed 4×4 board of three colors, no refill; clear every dot in as few lines as possible | The order and path of lines; loops clear all | Never a failure; undo steps back one line; a star for the fewest lines, found by an exact solver, shown after clearing, never withheld | The solver finds the minimum, the board is always clearable, and the hint's first line belongs to a minimum-line solution | Solver in `logic.ts` (bounded by board size); new sticker-free "par" display; a reviewed seed list |

Levels 7–10 are appended on top; nothing is renumbered.

### Younger-band openings

- **Lap: one more entry.** Level 1 already works for lap (any tap pops). A better first lap level is a **big-dot** board (3×3, two colors, dots 1.5× larger) where every tap pops one; it is level 1 with a seeded `plan` change, so no new ID, and the `order` window stays as is.
- **Toddler: Find my buddy** (appended ID 11, placed with `order` before level 2, declared in `entryLevels`): a 3×3 board of two colors where exactly one adjacent same-color pair pulses; draw between them; any other drag wobbles. The pulse is the hint from the first second. Rule test: the pair exists, is adjacent, and nothing else is highlighted.

### Easier entries and levels between existing ones

- Level 11 **Find my buddy**, above, goes into toddler's `order` as `[1, 11, 2]` and `entryLevels: [11]`, so a one-year-old's saved level for a game she has never finished starts at level 1 as today and a child past 2 is not moved back.
- Preschool level 3 could use a **slower start** of a 4×4 board; skip until a person watches the first color level.

### Left out on purpose

- Move limits, timers, fire spreading, ice with a count, lives, boosters, a "no moves" fail state.
- Number-order dot-to-dot (that is Star Dots, a separate game).
- A rules change to level 5's loop (it clears the whole color; the idea works).
- Bigger-than-5×6 boards: targets are 100 logical units.

## Decisions for the developer

Both decided by the developer on 2026-10-14:

1. **Open a `school` window**: yes. Levels 8–10 (pattern line, make ten, clear the garden) are school play; the window is added in the slice that builds level 8, with a rule test over the band table.
2. **Marks in the dots**: always on, no setting.

## Build slices, in order

1. **Marks in the dots** (built 2026-10-15; see [completed work](../archive/COMPLETED-2026-10-09.md#dot-link-marks-in-the-dots-2026-10-15)).
2. **Level 11 Find my buddy** (built 2026-10-17; see [completed work](../archive/COMPLETED-2026-10-09.md#dot-link-level-11-find-my-buddy-2026-10-17)). Readings: a full two-color 3×3 always has at least two same-color neighbor pairs, so "one pair" means exactly one pair lit (seeded `pickBuddy`), and the goal is 4 buddies (the dive gave none).
3. **Level 7 Two colors** (a second count; new-level tier).
4. **Level 8 Same, different** (a pattern line; new interaction tier: rules first, one scripted play, one portrait screenshot, `fingerdemo`).
5. **Level 9 Make ten** (the school window is decided).
6. **Level 10 Clear the garden** with the exact solver.
7. **Boards with empty cells** and the anchors.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Links and `git diff --check` ran.
