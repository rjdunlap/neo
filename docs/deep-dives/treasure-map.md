# Treasure Map deep dive

*ID `treasure-map` · bands pre-K, school · levels 1–5 on 2026-11-01 · session `claude/dive-treasure-map`, [PR #1103](https://github.com/rjdunlap/neo/pull/1103)*

## The game today

A parchment grid with row 1 at the bottom, as on maps and graphs. A sign at the top shows each request in pictures or letters and the voice says it; she taps a square to dig. Learning: locate a square by two coordinates (a column and a row), then follow and combine counted directions. Home land Rainbow Meadow. Couch play uses levels 2–5 (`src/couch/catalog.ts`: a teal ring moved square by square, the bottom button digs; wrong digs are the face-off score, lower wins).

| Level | Plan (`PLANS` in `logic.ts`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `pictures`, 4 by 4, 4 finds | pre-K, school | The square where a picture row meets a colour column ("the apple row, the red column") |
| 2 | `letters`, 4 by 4, 4 finds | pre-K, school | The square named by column letter and row number ("B3") |
| 3 | `place`, 5 by 5, 4 finds | school | As 2, and a tree, house, boat or flag appears there ("Put the tree at D2") |
| 4 | `steps`, 5 by 5, 4 finds | school | Where the pet ends after "3 right, then 1 up" from where it stands; on a right dig the pet walks it, counting |
| 5 | `clues`, 5 by 5, 4 finds | school | The square where two landmark clues meet ("the tree is 2 right", "the boat is 1 up") |

`LEVELS` is a plain `BandLevels` table (pre-K 1–2, school 1–5); there is no `order` or `entryLevels`.

**Content pools.** Column colours are `COLUMN_COLORS` (red, yellow, blue, green, purple) and row pictures `ROW_PICTURES` (apple, fish, star, flower, shell), always **in that order**, so level 1 shows the same four rows and four columns every round; only the four target squares vary. Places come from `THINGS` (tree, house, boat, flag). Squares, step vectors (1–3 each way, always a turn) and clue landmarks are seeded; the map itself (parchment, blue sea) never changes.

**What a mistake does.** A wrong dig is a miss: a boing, a scratch mark left on the square, and a spoken reason from `compare()` ("Right column! Now look up and down it for the row", "Right row!…", or "Find the column first"); level 4 repeats the directions instead. Two wrong digs light the target's column and row (level 5: the two clue lines) and charge one hint.

**Known gaps.**
- The how-to card's level-3 step says "Drag the thing to the named square", but level 3 is a tap like level 2 (`src/content/howto.ts`). The card is wrong, not the game.
- Level 5's hint draws the two clue lines, but its spoken hint is the shared `map.hint` ("Look where the glowing column and row cross"), which names a column and row that are not drawn.
- Level 4's hint lights the answer's column and row, which skips the counting the level teaches. A hint that leads somewhere would light the first leg of the walk from the pet.
- A wrong dig at level 4 says only "count the steps again"; nothing shows where her square was relative to the pet.
- Every level has four finds and no fresh map, so replay varies only the target squares (and, at level 1, not even the headers).
- `map.pictures`, `map.place` and `map.clues` speak names through slots, so new pictures or places use device speech until slotted clips (V3).
- No preschool window, though the [roadmap](../ROADMAP.md)'s chunk 18 lists Treasure Map among the preschool openings.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Battleship* (Milton Bradley 1967, Hasbro since 2009; [Wikipedia](https://en.wikipedia.org/wiki/Battleship_(game)), [rules summary](https://www.cs.nmsu.edu/~bdu/TA/487/brules.htm)) | Board game | Same grid; strategy grows from random calls to using hits to narrow a search | Call a square by letter and number; marks that stay where you tried, so the board is the record of evidence | Sinking an opponent, a winner and a loser |
| *Robot Turtles* (ThinkFun; [rulebook](https://rulespal.com/robot-turtles/rulebook), [review](https://geekdad.com/2014/08/robot-turtles-thinkfun-2/)) | Board game, 3–8 | First game uses only forward, left and right cards; later decks add lasers, walls and functions; an adult is the "Turtle Mover" who executes exactly what was laid | Laying a route before it runs, then watching it run exactly; a Bug card to undo | Turtle-relative turning at this stage: Treasure Map's directions are absolute (right, up) as on a graph |
| *Bee-Bot* floor robot and app (TTS; [Colorado CS resource](https://www.cde.state.co.us/computerscience/computer-science-resource-bank/detail/cs-rb-beebot), [K20 guide](https://learn.k20center.ou.edu/tech-tool/606)) | Toy and app, K–2 | Press arrows, then GO; longer sequences, then mats with targets and obstacles | Build a sequence of arrow steps, then Go; the route shows on the mat | Rotation-based turns; memory load of a hidden program |
| Treasure-hunt and grid-coordinate worksheets for England Years 4–6 ([NCETM curriculum tool](https://ncetm.org.uk/in-the-classroom/national-curriculum-resource-tool?topic=1667), [Third Space Learning summary](https://thirdspacelearning.com/blog/what-are-coordinates-explained/); summary only) | Classroom | First quadrant (Year 4), translations left/right and up/down (Year 4), reflections in lines parallel to the axes (Year 5), all four quadrants (Year 6) | The order of rungs: name, then slide, then mirror, then four quadrants | Text-heavy worksheets, timed quizzes |
| Hot-and-cold hiding games (the notebook's [Warm-and-Cool Dig](../IDEAS.md), after JumpStart 1st Grade's Detect-o-matic) | Physical and app play | One hidden thing; "warmer/colder" after each try | Each try returns how far, so the search is reasoning, not luck | A meter that only beeps (it must also show and speak) |
| *Mission Earthquest*'s Space Scan and *The Pirate Ship* (JumpStart; in the [notebook](../IDEAS.md)'s JumpStart rows) | Edutainment | Plot coordinates; sail a chart with latitude and longitude | A chart that is a real place to explore | The quiz-under-pressure pods; latitude and longitude below the older band |

**What the research says.** Preschoolers can find a hidden toy from a simple map, but they lean on what objects look like over how they are arranged; guided alignment that points out the correspondences between map and space helps a lot ([Yuan, Uttal and Gentner 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC3572713), summary; [Shusterman, Lee and Spelke](https://www.harvardlds.org/wp-content/uploads/2017/01/Shusterman_YoungChildSpontMap-1.pdf), already cited by the [Silk Road study](subjects/china-india-silk-road.md)). That supports level 1's pictures and colours over letters, and a preschool step that asks for **one** line before two. Above and below come before left and right ([Happy Numbers note](https://blog.happynumbers.com/above-below-k-2-math/), summary only), so a one-line preschool level asks for a row or a column, never "left of". Standards: CCSS [K.G.A.1](https://thecorestandards.org/Math/Content/K/G/A/1/) (positions: above, below, beside, next to), [5.G.A.1–2](https://www.thecorestandards.org/Math/Content/5/G/) (first-quadrant coordinates, already the area-volume study's anchor) and [6.NS.C.6.b and C.8](https://www.thecorestandards.org/Math/Content/6/NS/) (four quadrants, reflections across an axis); England's Years 4–6 position-and-direction strand as above.

## What makes sense here

The game's one action is a tap on a square that answers "here?", and the parchment keeps every try. Depth should keep that tap and turn the request around or widen it: she **gives** directions instead of following them, **searches** using what each dig tells her, **slides** a thing and predicts where it lands, then (an older rung) reads a map split by a river and a road into four sides. Every new level keeps one sticker for the round, a reason for every wrong dig, and a glow after two.

The arc: preschool asks for one line (new entry), pre-K pictures and letters (1–2), school places, follows and combines (3–5), gives directions (6), searches by distance (7), slides (8), and at the top of school, "about 10 and up", reads four sides of a river and road and mirrors across it (9–10, to define).

**Handoffs answered.**
- **Four quadrants** (*Treasure Map across the river*, [area-volume study](subjects/area-volume-space.md) decision 7, [RECOMMENDATIONS](subjects/RECOMMENDATIONS.md#area-volume-and-space-recommendations), [IDEAS](../IDEAS.md)): **in**, as levels 9–10, through their own definition. Words first ("2 right of the road, 1 below the river"), never signed numbers in that slice; signed numbers wait for the integers study's decision 6 ("negative" or "minus").
- **Translations** ("slide the house three right", England Year 4, the same study): **in**, as level 8.
- **Warm-and-Cool Dig** (the [Peekaround Island dive](peekaround-island.md) gave it here, [FAMILY-EXPERIENCE](../FAMILY-EXPERIENCE.md)): **in**, as level 7, with a counted distance (footprints) rather than only warm and cool, so each dig is evidence a school child can reason with. Its younger near/far version stays in the notebook; it needs no grid.
- **Give directions** (the ladder audit's round three): **in**, as level 6.
- **Maps of new places** (round three): **in**, as batch 1's seeded headers and map dressing.
- **Preschool opening** (chunk 18, round three): **in**, as level 11 *One line*, placed first by `order`.
- **World Chart** and **Number Munch Grid** ([IDEAS](../IDEAS.md)): **out**. World Chart needs geography review and latitude and longitude; Number Munch is a number-rule game that would only borrow the grid.

## Experience and presentation

- **First unsupported action:** at level 1 the sign shows the picture and the colour, and the matching headers sit at the edges; she can find the crossing without the voice.
- **Feel:** the dig answers on touch-down (`onTap` with a cooldown); a right dig pops the chest with stars and a sparkle, a wrong one leaves a scratch that stays as a record. Proposed: on touch-down the touched square darkens like turned sand and a soft pentatonic "scrape" plays, pitched by row (row 1 lowest), so the rows are heard as well as seen.
- **Concrete code-drawn example: footprints.** For levels 4, 6 and 7, a row of small oval `Graphics` footprints (two per square, alternating left and right, `wood.line` at 0.5 alpha) traces a walk. They show the pet's walk at 4, her own route at 6 before Go, and the distance from a wrong dig at 7. No new art pipeline is needed.
- **Variety without a new rule:** seeded header pictures and colour order, seeded map dressing (a sandy island, a snowy island, a meadow: parchment tint and two corner doodles), seeded places, and at 7–8 seeded hiding spots and things to slide.
- **Reasoning versus motor:** 100-unit squares, one tap per answer; level 6's arrow buttons are 120 units. Reading is never required: letters are spoken and every sign has a picture or an arrow.
- **Supported ending:** every miss explains, two glow, the round ends when the four finds are dug, and on the couch fewer wrong digs wins but nobody loses the round.
- **Co-play:** one reads the map aloud and the other digs (the existing co-play hint); at level 6 one says the route and the other taps the arrows; at 7 they argue about where the evidence points.
- **Person or device:** whether a four-year-old taps a row or column in *One line* or just taps; whether level 6's route reads as "my directions" rather than a puzzle; whether level 7's footprints read as distance; landscape and portrait fit of the arrow tray.

## Proposed ladder

### Fresh content inside existing levels

**Fresh maps and true hints** (batch treasure-map 1, existing-game fix tier). One batch, all in the built game:
- Level 1's headers draw a seeded set: row pictures from a pool of seven (apple, fish, star, flower, shell, plus a heart and a moon from `shapes.ts`) shuffled per round, and column colours shuffled from the five. `makeFinds` stays a pure function; a new `headersFor(plan, rng)` returns the order and the sign and voice read from it.
- A seeded map dressing per round (three tints and corner doodles), cosmetic only.
- Level 5 speaks a new `map.cluehint` ("Follow the two glowing lines to where they meet") instead of `map.hint`.
- Level 4's hint lights the first leg from the pet to the turning square, spoken "First go {first}", not the answer's row and column.
- The how-to card's level-3 step becomes a tap ("Find the square, like D2, and tap it to put the thing there").

Rule tests: headers are distinct, every pool member appears across seeds, the target's picture and colour are in the drawn headers, the step hint's square is on the map and on the walk, `digSpot` still reads back to the find. Bot unchanged (it digs the find). Check tier: typecheck, the game's rule tests, one filtered regression play of levels 1 and 4 with two wrong digs (the new hints), one portrait screenshot of level 1; one build for the voice lines.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | *Give directions* | school | The pet stands on the map and the chest is drawn on another square; "Help me get there! Tap the arrows, then Go." | A route of arrow steps (→ ← ↑ ↓) that reaches the chest; footprints show it before Go | Any route that ends on the chest is right, however long; Go on a route that ends elsewhere is a miss: the pet walks it, says where it stopped ("we're two too far right"), footprints stay, Undo and Clear stay. Two misses: the first leg glows | Every arrow sequence whose sum equals the vector is accepted; the spoken reason names the axis and the amount off; a route that leaves the map stops at the edge with "That's the edge!" (not a miss until Go) | New interaction (arrow tray, Undo, Clear, Go); voice lines; bot taps the shortest route then Go; couch: the stick enters arrows, the bottom button is Go |
| 7 | *How far?* | school | The chest is hidden; "Dig anywhere. I'll tell you how far it is." The first dig shows footprints counting the steps (across plus up) to the chest, without showing which way | Where to dig next, using the distances | A dig that fits every distance so far is exploration, never a miss, however far; a dig on a square the evidence already rules out is a miss with its reason ("that's 3 from your first dig, and it said 1"). Two misses: the squares that still fit glow. Bounded: a 4 by 4 map | Every hiding square is reached within five digs when each dig picks a square that still fits, and within three with best play (both checked by brute force on the 4 by 4 map); the distance is the across-plus-up count; the still-fits set always contains the chest and shrinks after each fitting dig | New rule on the same tap; the footprint drawing above; bot digs a corner then the best remaining square |
| 8 | *Slide it* | school | A raft of three squares with a flag sits on the map; "Slide the raft 2 right and 1 up. Tap where the flag ends up." Then the raft slides, every square moving the same | Where one marked part of a shape lands after a translation; second part of the round: which outline is the slid raft (the right one, a flipped one, one slid the wrong amount) | A wrong square is a miss with the column/row reason; a wrong outline is a miss with a named reason ("that one turned over"). Two misses glow the flag's walk | Every slide keeps the raft on the map; the distractor outlines are distinct from the answer and from each other; the answer outline is the shape plus the vector | Reuses the dig; three outline cards (100+ units each) beside the map; bot taps the flag's end, then the right outline |

All three append IDs 6–8 to `PLANS`; the school range becomes 1–8. Pre-K stays 1–2.

### Younger-band openings

**Level 11, *One line*** (preschool, entry). A 3 by 3 map with picture rows and colour columns, 120-unit squares; "Dig in the red column!" or "Dig in the fish row!": any square in that line is right, and the whole line shines. Four finds a round, rows and columns alternating. A wrong dig gets "that's the blue column; find red" and the line glows after two. `order` places 11 first, so preschool plays 11 then 1 (window 11–1), pre-K gains 11 at its start (11, 1, 2) and `entryLevels: [11]` lets a birthday land safely. Rule tests: every square in the named line is accepted, no other; the ordered window. Couplings: the land page gains Treasure Map at preschool (the lands test must pass); its how-to step; `fingerdemo` at 11. Level IDs 9–10 are kept for the quadrant rungs below.

### Easier entries and levels between existing ones

None besides *One line*. Level 3 *Put it at* is already a gentle step between 2 and 4.

### Left out on purpose

- Signed numbers and "negative" or "minus" until the integers study's decision 6 picks the word and a device check hears it.
- Turtle-relative turns ("turn left, go forward"): those belong to Robot Path; Treasure Map stays absolute, like a graph.
- A treasure count, a timer, or limited digs; level 7's search is bounded by the small map, never by a counter.
- Latitude, longitude and a world map (World Chart, above).

## Decisions for the developer

None. By the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) the leans above are adopted: levels 6–8 at the top of `school`, *One line* as a preschool entry (S9: a person watching a four-year-old is a device check, not a gate), quadrants with words first (the area-volume study's decision 7 lean). The integers study's decision 6 word stays open there, and nothing here depends on it.

## Build slices, in order

1. **Fresh maps and true hints** (batch treasure-map 1): above. Existing-game fix tier: typecheck, rule tests, one filtered regression play of levels 1 and 4 with two wrong digs each, one portrait screenshot of level 1, one build for the voice lines; bot unchanged, no `fingerdemo`.
2. **Level 6 *Give directions*** (batch treasure-map 2), after batch 1 (shares the footprints and the step hint): new-interaction tier: typecheck, rule tests, one scripted play with one route that stops short (a miss and its reason), a second for the glow, then a long but right route; one portrait screenshot with the arrow tray; `fingerdemo` at 6; `BROWSER_SUITE=couchgames` filtered to Treasure Map (the couch arrows).
3. **Level 7 *How far?*** (batch treasure-map 3), after batch 1 (shares the footprints): new-rule tier: typecheck, rule tests including the five-dig bound for fitting digs over every hiding square, one play of level 7 with two fitting digs, a ruled-out dig (a miss), then to the sticker; `fingerdemo` at 7; one portrait screenshot of the footprints.
4. **Level 8 *Slide it*** (batch treasure-map 4), after batch 1: new-interaction tier: typecheck, rule tests, one play with one wrong square and one wrong outline (named reason), then right; one portrait screenshot of the outline cards; `fingerdemo` at 8.
5. **Level 11 *One line*, the preschool opening** (batch treasure-map 5), after batch 1 (shares the headers): new-band tier: typecheck, unit tests including the lands, registry band and order/entry tests, one play of level 11 at preschool with one wrong line then two right, `fingerdemo` at 11, the preschool Rainbow Meadow page screenshot.
6. **Define *Across the river*, levels 9–10** (docs only; status `define`): a map split by a river (the horizontal axis) and a road (the vertical axis) with the squares named in words ("2 right of the road, 1 below the river"; level 9), then the mirror across the river or the road (level 10); the 6 by 6 geometry at 100-unit squares within the 768-unit short side with the sign, the spoken lines, accounting, hints, the bot and the check tier. Words only; signed numbers stay with the integers study.

## What was built in this session

Nothing: research and ideation only. Checks: Markdown links and `git diff --check`.
