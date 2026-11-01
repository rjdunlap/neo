# Light Lab deep dive

*ID `light-lab` · bands pre-K 1–4, school 2–7 · levels 1–7 on 2026-10-31 · session `claude/dive-light-lab` ([PR #1081](https://github.com/rjdunlap/neo/pull/1081))*

## The game today

Mirrors on a grid turn a sunbeam a quarter; she taps a mirror to tilt it the other way (`/` or `\`). Flowers wake when the light reaches them and let it pass on; pink glass tints the beam and a pink flower only wakes in pink light (a stated toy rule, not a model of colour filters). The learning purpose is planning a path and cause and effect: light travels straight until something turns or stops it. Tinker Lab; one round is two to four puzzles and one sticker. Puzzles are built backwards from a seeded random path (`makePuzzle` in `logic.ts`), so each has a known answer; spare mirrors and rocks sit off that path and the mirrors start tilted so it is not yet solved.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | `live`, 6×4, one turn, 3 puzzles | pre-K | Which way one mirror leans; the beam redraws as she taps (nothing can be missed) |
| 2 | `live`, 6×4, two turns, a spare mirror and a rock | pre-K, school | Two mirrors, with something off the path to leave alone |
| 3 | `plan`, 6×4, two turns, then tap the sun | pre-K, school | The whole path before she sees it; a shine that misses is a miss |
| 4 | `plan`, 7×5, three turns, two flowers on one beam | pre-K, school | A path that passes one flower on the way to the other |
| 5 | `plan`, 7×5, pink glass before the pink flower, a blue glass off the path | school | Order along the path: the yellow flower before the glass, the pink one after |
| 6 | `plan`, 7×5, four turns, three spares, two rocks | school | A longer plan among more distractors |
| 7 | `predict` then `plan`: three locked boards, then one to plan | school (top) | Where the locked beam stops (one of three rock or edge endpoints, unscored), then a full plan |

**Content pools.** Every board is generated: the sun's row, run lengths (1–4 cells) and turn directions are seeded; flowers and glass sit on the path's passing cells; spares, rocks and the blue glass fill free cells. The sun always sits in column 0 and shines right. Puzzles per round: 3, 3, 3, 2, 2, 2, then 3 predictions and 1 plan.

**Mistakes and help.** Levels 1–2 cannot be missed. From level 3 a shine that wakes nothing (or not every flower) is one miss, and the pet says why (`whyNot`: off the edge, a rock, the wrong colour, one still asleep). Two missed shines glow the next mirror on the *known* path that is tilted the other way (`hintMirror`), one hint. Predictions are never misses. The couch route plays levels 4–6 and scores extra turns and tries against `needed`, the count of known-path mirrors that start wrong.

**Checked for this dive** (a throwaway probe over 400 seeds per level, not committed):

- **Starts are often nearly solved.** Mirrors that must turn at the start, by level: 2–3 need one or two (about half each); 4–5 need one in a quarter of boards; 6 ("a longer path: four mirrors") needs only one in 12% and averages 2.5; 7's final board averages 2.4. At levels 4 and 5 the starting tilts already wake one flower in half and in 71% of boards, so the "two flowers" plan is often a one-turn fix.
- **The hint follows the built path, not the nearest answer.** Spare mirrors sometimes open a different working route needing fewer turns (3% of boards at 6, 2% at 7); there the hint can point at a mirror the nearest answer leaves alone, and the couch's `needed` overstates the par. Rare, but the couch scores it.
- **Prediction endpoints** already have a rule test (three distinct reachable endpoints including the real one).

**Space.** `CELL` is 100 units, so 7 columns (700 plus the frame) is the widest board that fits the 768-unit portrait width without shrinking a target. Landscape height is 768: a 5-row board plus its 110-unit top leaves no room for a tray under it, so any tray level uses 4 rows.

**Known gaps and checks.** Open device check: Light Lab 7's endpoint targets and spoken replay on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md)). The couch par course for Light Lab is still unbuilt ([roadmap chunk 8](../ROADMAP.md#next-up)). The ghost finger taps the hint mirror, then the sun.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Laser Maze](https://www.thinkfun.com/products/laser-maze/) (ThinkFun) | Single-player board puzzle, 8+ | 60 cards from beginner to expert: some pieces fixed on the grid, the rest handed over to place; then beam splitters, a double mirror, a cell blocker and a checkpoint the beam must cross | Placing a mirror from the hand, not only turning one; the splitter as a late piece | Printed answer cards; a dozen piece types at once |
| [Laser Maze Jr.](https://www.thinkfun.com/products/laser-maze-jr/) (ThinkFun) | Same, 6+ | Characters instead of abstract pieces, fewer pieces per card | A friendly target (the flower already is one) | — |
| Lazors (Pyrosphere, touch; recalled) | Drag blocks into slots | Reflect blocks, then opaque blocks, then a refract block that splits the beam; several targets to hit at once | Drag-to-slot placement; one new block kind per stage | Hints sold in-app |
| [Deflektor](https://en.wikipedia.org/wiki/Deflektor) (Gremlin, 1987) | Arcade | Rotate mirrors to reach a receiver through mines and fibre optics | Rotating mirrors as the whole verb | The overheating meter and the energy timer |
| [Black Box](https://en.wikipedia.org/wiki/Black_Box_(game)) (Eric Solomon, 1976) | Deduction | Fire rays into a hidden grid and reason back from where they come out | Inferring a hidden turn from where the beam goes in and comes out | Scoring by rays fired; many hidden pieces at once |
| [Khet](https://en.wikipedia.org/wiki/Khet_(game)) | Two-player laser chess | Opponents' mirrors and a fired laser | Nothing beyond the beam | Capturing, competition |
| Hand mirror and a torch on a wall (classroom; the game's off-screen line) | Physical | Bounce a sunbeam onto a wall, then onto a toy; add a second mirror | A real beam that turns where the mirror leans | — |

**Learning references.** [NGSS 1-PS4-3](https://www.nextgenscience.org/pe/1-ps4-3-waves-and-their-applications-technologies-information-transfer) (investigate what happens when objects of different materials are placed in a beam of light: transparent, translucent, opaque and reflective), [1-PS4-2](https://www.nextgenscience.org/pe/1-ps4-2-waves-and-their-applications-technologies-information-transfer) (objects can be seen only when lit) and [4-PS4-2](https://www.nextgenscience.org/pe/4-ps4-2-waves-and-their-applications-technologies-information-transfer) (light reflecting from objects into the eye). The game covers reflective and opaque today; transparent glass appears only as a colour toy. Planning and evidence-based inference are the reasoning goals.

## What makes sense here

The tap-to-turn mirror and the generated board carry further without new art. What fits:

- **Fresh content** that makes the planning levels ask for as much planning as their names say, a hint that leads to the nearest answer, and a sun that sometimes shines from the other side.
- **Placing a mirror** (school): choosing *where* a turn happens, not only which way, the step Laser Maze and Lazors both take after rotation.
- **Where's the mirror?** (school): reading evidence backwards, Black Box's idea at its smallest: the beam goes in here and comes out there, so the turn must be at their crossing.
- **Through, bounce or stop?** (pre-K–school, a definition first): 1-PS4-3's materials on the beam, with a free prediction before each shine.
- **A splitter** (school top, a definition first): the energy-waves study's seed; one beam waking flowers in two directions.

What does not fit, or belongs elsewhere: comparing two replayed paths (the energy-waves seed) adds little the level-7 replay does not already show, and Chain Reaction owns replay comparison; colour mixing (additive light) needs a real model and is left out; Shadow Stage stays the separate geometry seed; timers, moving targets and anything that burns or overheats stay out.

**Long arc.** Pre-K turns one or two mirrors with the beam live; school plans, places and predicts; the top reasons backwards from evidence and splits a beam. A preschool opening waits on a person (below).

## Experience and presentation

- **First unsupported action:** at level 1, tapping the one mirror; the beam redraws immediately and the flower opens. At the new levels, picking up a mirror from the tray and putting it anywhere is never wrong; only a shine is judged.
- **Touch and consequence:** a mirror's tilt flips on touch-down with a click (built). New: a mirror lifted from the tray rides 40 units above the finger (`drag.ts`), the cell under it lights pale yellow, and dropping it there sounds a soft pentatonic tick; tapping a placed mirror turns it, as now. On *Where's the mirror?* a tapped cloud cell puffs away to show what was under it.
- **Art example:** the cloud for *Where's the mirror?* is a row of overlapping white `circle` fills over each cell with a pale blue stroke, the same code-drawn style as the floor tiles; the beam is drawn over the cloud where it enters and leaves, and hidden inside it.
- **Variety without a rule change:** seeded board, run lengths, turn directions, the sun's side, which of two flowers is nearer, where the spares sit.
- **Reasoning versus motor:** every target is a 100-unit cell; drops snap to the nearest free cell, and a drop off the board returns the mirror to the tray, free. The decision is the path, not precision.
- **Supported completion:** two missed shines glow a mirror (or, on the new levels, the cell for the next mirror); following the glows always finishes. The round ends with every flower awake; replay is the usual round arrow.
- **Co-play:** the built hint (trace the path together with a finger) carries over; at *Where's the mirror?* one player points where the beam went in, the other where it came out.
- **Needs a person:** whether a four-year-old reads the live beam as the mirror's doing (the preschool opening); whether a six-year-old drags or taps a tray mirror first; whether the cloud level reads as a puzzle rather than a guessing game.

## Proposed ladder

### Fresh content inside existing levels

- **A fairer start** (levels 4–7): at least two path mirrors start wrong at 4–5 and at least three at 6 and on level 7's final board, and at 4–5 the starting tilts wake no flower. Levels 2–3 stay as they are (one or two). Rule test: over 400 seeds a level, every start meets its floor and is still unsolved.
- **The nearest answer for hints and par.** Enumerate every tilt arrangement (at most seven mirrors, 128 cases), take the solutions needing the fewest turns from the current tilts, and glow the first mirror along that solution's beam that differs. `needed` becomes that minimum at the start, so the couch par is the true fewest turns. Rule tests: from the start and from random mid-play tilts, following hints reaches a solution in exactly the minimum number of turns; the hint never points at a mirror every nearest solution keeps.
- **A sun on either side** (levels 3–7; 1–2 keep the left sun while she learns the verb): a seeded mirror image puts the sun in the last column shining left (`sunCol`, `sunDir` on the puzzle; `trace`, `beamEnd`, `predictionChoices` and the sun's art and couch spot read them). Rule test: a mirrored puzzle with mirrored tilts solves exactly when the original does, and nothing sits on the sun's cell.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | *Place a mirror* | school | 6×4, one fixed path mirror tilted wrong, one mirror in a tray below the board, three puzzles | Which empty cell the tray mirror goes in, then both tilts, then shine | A drop is free (off the board: back to the tray); a missed shine is a miss with `whyNot`'s line; two glow the nearest working cell (one hint), then that mirror's tilt as the built glow | Every board has at least one placement that solves and none without placing; the flower is never in the sun's row; the hint cell plus some tilt solves from the current fixed tilts | New tray and drag (`drag.ts`), new voice lines, the bot drags then taps, a how-to step; 4 rows so the tray fits landscape |
| 9 | *Two to place* | school | 7×4, two tray mirrors, one rock on the straight line, two puzzles | Two cells and the order the beam meets them | As level 8; the glow names the next cell along the nearest solution | Solutions exist with both mirrors placed and none with one; hints from any placement reach a solution | Shares level 8's tray; the bot places in path order |
| 10 | *Where's the mirror?* | school (top) | 6×4 under a cloud; one hidden mirror; the beam shown entering from the sun and leaving at an edge flower; three boards | Which cloud cell hides the mirror | A wrong cell is a miss: the cloud there puffs away and a ghost beam shows where a mirror there would send the light; two glow the sun's row and the exit column (one hint) | Exactly one cell is consistent with entry and exit; the hint's row and column cross at it | New overlay and tap-a-cell mode; no drag; voice lines; the bot taps the crossing |

Level 10 is built after 8–9 so the school range rises one built level at a time (`min..max`, no `order` needed).

### Younger-band openings

**Preschool, levels 1–2** (roadmap [chunk 18](../ROADMAP.md#next-up)'s preschool batch): no new level, since level 1 is already one live mirror on 100-unit cells. It waits on that batch's lands check and on a person seeing whether a three- or four-year-old connects her tap with the beam's turn, and is not queued here.

### Easier entries and levels between existing ones

None needed: pre-K starts at 1 and school at 2, and the jump from 7 to the new levels is a new mode, not a harder board.

### Definitions (docs only)

- **Through, bounce or stop?** (pre-K top, school): a picture object sits on the beam (a clear jar, waxed paper, a cardboard square, a spoon); she makes a free prediction (through, bounce, stop) and shines. Needs the materials table source-checked against NGSS 1-PS4-3 and a toy rule for translucent (dimmer but through), the art list and the level's number.
- **Split the sunbeam** (school top): a half-mirror sends light both straight on and turned. Needs a branching `trace` with a shared seen-set so loops end, a generator that guarantees the split is required, a hint over the nearest solution, and the couch question (left out of courses until defined).

### Left out on purpose

Comparing two replays; additive colour mixing; a timer or moving beam; more than seven columns or five rows (targets would shrink); a pre-K window above 4 until the new school modes are seen played.

## Decisions for the developer

None. Placement and new levels stay inside the built bands and land; the preschool opening follows its roadmap batch and a device observation; the two definitions are docs sessions.

## Build slices, in order

1. **Fair starts, nearest hints and a sun on either side** (existing-interaction tier: typecheck, rule tests, one filtered regression play at level 6 with a right-hand sun and one hint; `fingerdemo` at 6 only if the bot's play changes). Logic first; the index reads the sun's side.
2. **Couch course *Sunbeam Run*** (couch catalog tier: a frozen board list, par from slice 1's minimum, course tests, `BROWSER_SUITE=couchgames` filtered to Light Lab): after slice 1. Roadmap chunk 8's remaining Light Lab par course.
3. **Levels 8–9 *Place a mirror* and *Two to place*** (new-interaction tier: typecheck, rule tests, one play of level 8 with a drop off the board, a missed shine and the glowing cell, level 9 to its sticker, one portrait screenshot with the tray, `fingerdemo` at 8 and 9; stop after 8 if the allowance cannot cover 9). School range rises to 9.
4. **Level 10 *Where's the mirror?*** (new-interaction tier: typecheck, rule tests, one play with one wrong cell and its ghost beam, a second for the glow, then the right cell, one portrait screenshot of the cloud, `fingerdemo` at 10): after slice 3, since the school range rises past 9.
5. **Define *Through, bounce or stop?*** (docs only).
6. **Define *Split the sunbeam*** (docs only): after slice 1 (the nearest-solution search it extends).

## What was built in this session

Nothing: research and ideation only. Links and `git diff --check` ran; a throwaway probe of the current generator (400 seeds a level) informed the known gaps and was not committed.
