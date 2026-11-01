# Picture Graph deep dive

*ID `picture-graph` · bands pre-K 1–2, school 1–7 · levels 1–7 on 2026-11-01 · session `claude/dive-picture-graph` ([PR #1087](https://github.com/rjdunlap/neo/pull/1087))*

## The game today

Critters play in a meadow; she counts each kind and taps above its column to add a block (on the bar takes one away), then the green check. The learning purpose is representing counts she made herself and reading them back: most and fewest, how many more, how many in all, a key where one block is two critters, and tally marks grouped by five. Puddle Island has it in Counting Cove (fourteen games, so the land pages), music `STYLES.hub`, a ghost-finger bot (`graphMove`, `tallyMove`), no couch entry.

| Level | Plan (`PLANS`) | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | `build`: two kinds, 1–4 each, two graphs | pre-K, school | How many blocks each bar needs |
| 2 | `most`: three kinds, 1–5, no ties at top or bottom | pre-K, school | Build, then which bar is most, which fewest |
| 3 | `more`: three kinds, 1–6, distinct | school | Build, then how many more of one than another (number pads) |
| 4 | `read`: four kinds, 1–6, exactly one equal pair, prebuilt | school | How many in all; which two bars are the same |
| 5 | `scale`: three kinds, 1–4 blocks of two critters | school | Count pairs into blocks; how many more critters |
| 6 | `scaleread`: three kinds, 1–5 blocks of two, prebuilt | school | How many critters in all, how many more, with the key |
| 7 | `tally`: three kinds, 4–7, one graph | school | Tally in groups of five, then build the bars, then how many more |

**Content pools.** Six critter kinds (`KINDS`: duck, pig, bunny, cat, cow, dog; `bear` exists in `src/art/critter.ts` and is unused), one meadow backdrop (seed 81), counts from the plan, two graphs a round (one at level 7). The questions come from `questionsFor`; number choices are the answer and two neighbours, or with a key the answer, the number of blocks and whole blocks away (`choicesFor`).

**Known gaps found while reading** (none fixed here):

- **Critters overlap at level 7.** One-per-critter meadows (levels 1–3 and 7) scatter by 60 random tries for 70 units of clearance and place the critter anyway when the tries run out. An approximate throwaway probe (5,000 rounds a level, the 1024×768 view, the plan's distinct-count rule; deleted) found two critters with centres under 45 units apart (bodies overlapping) in **10.7%** of level-7 rounds, 0.1% at level 3, none at 1–2. Overlapping critters make counting wrong through no fault of hers. Pairs already use `groupSpots` on a grid; singles can too (`groupSpots(n, 1, …)` gives 9 × 3 = 27 slots, enough for level 7's 21).
- **Singles can stand on the graph.** The singles' feet go down to y = 380, while the graph panel's top is h − 412 = 356 at 768 tall; `meadowArea` (used for pairs) already caps at h − 430.
- **"Which two are the same?" has no visible first pick.** The first tap only pops; a second tap on the same bar makes the pair `[i, i]`, a miss, so a quick double tap (cooldown 120 ms) costs a miss. Its hint glows only `answer[0]`, which may be the bar she has already picked.
- **The question hint gives the answer away.** After two misses on "how many more", the answer pad glows. Nothing shows *why*: the part of the taller bar above the shorter one.
- **"How many more" has no tempting wrong answer without a key.** The neighbours are ±1 and ±2; the classic error, reading the taller bar's height, is never offered.

Person checks: none recorded for this game in [DEVICE-CHECKS](../DEVICE-CHECKS.md) or [OBSERVATIONS](../OBSERVATIONS.md).

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Classroom real-object and floor graphs ([UEN lesson](https://www.uen.org/lessonplan/view/18799), [PreKinders floor graphs](https://www.prekinders.com/floor-graph-ideas/), [Virginia K plan](https://doe.virginia.gov/home/showpublisheddocument/16426/638037043968970000); search results read, pages not opened) | Physical play | Human graph → real objects in columns → pictures → tallies and tables; "what if two more came?" | The concrete first step: the things themselves lined up, one per square, so "more" is visible by matching | Nothing |
| Graph Club, Tom Snyder Productions ([district guide](https://www.pisd.edu//cms/lib/TX02215173/Centricity/Domain/1327/GraphClub2.pdf), [Education World review](https://www.educationworld.com/a_tech/tech128.shtml); search results read) | 1990s K–4 software | The same data shown as picture, bar, line and circle graphs; drag a bar's top or drop icons; the scale maximum can change | One dataset, several pictures of it: the core of *Two pictures, one meadow* | Free-form chart editing and pie charts below school |
| [TinkerPlots](https://www.wikipedia.org/wiki/TinkerPlots) (Konold and Miller, UMass; search results read) | Grades 4–8 data tool | Order, stack and separate icons until a plot emerges | Building the display from the things themselves | Open datasets, many-variable plots |
| [CODAP](https://codap.concord.org/) (Concord Consortium; recalled, not opened) | Free web data tool | Linked tables and graphs: select in one, it lights in the other | Linking: a tally card and its graph light together | Data import and free analysis |
| Khan Academy Kids graphing activities ([app](https://learn.khanacademy.org/khan-academy-kids/); recalled, not opened) | Touch app, 2–8 | Count pictures, drag them into a graph, answer most/fewest | Short rounds, spoken questions | Its avatar collection loop is not needed here |
| SplashLearn and similar worksheet apps ([3.MD.B.3 games](https://www.education.com/games/CCSS-Math-Content-3-MD-B-3/); search results read) | Worksheet games | Scaled bar graphs with keys of 2, 5 and 10 | The key of five with "how many more" | Coins, streaks, timed rounds |
| [Spinner Fair](../GAMES.md#spinner-fair) (built here) | Puddle Island | Bars as the record of chance | Reuses this game's bars and `BLOCK_H` look | Chance stays there |

Learning references: CCSS 1.MD.C.4 (organize up to three categories, how many more), 2.MD.D.10 (picture and bar graph with up to four categories) and 3.MD.B.3, whose text is "Draw a scaled picture graph and a scaled bar graph to represent a data set with several categories" with one- and two-step "how many more" and "how many less" problems ([Illustrative Mathematics, 3.MD.B.3](https://tasks.illustrativemathematics.org/content-standards/3/MD/B/3.html); search result read). England's Year 2 statistics (pictograms, tally charts, block diagrams) is the anchor [chance-statistics](subjects/chance-statistics.md) opened. Curcio's three levels (read the data, read between the data, read beyond the data) come from the [informational-reading study](subjects/informational-reading.md) as a search-only note.

## What makes sense here

The game already goes from building to reading to a key to tallies. What is missing is the bottom and the side: the concrete step before blocks (things themselves lined up), a bigger key that the school standard asks for (five), and the idea that two different-looking pictures can show the same counts. Handoffs, each answered here:

- **Beach Tally** ([oceans](subjects/oceans.md#candidates-and-recommended-order)) becomes level 8 *Line them up*, the real-object graph: shells, stones, driftwood and feathers, never litter. Identical items within a kind, kinds told apart by shape as well as colour.
- **Same Meadow, Two Pictures** ([data-ai-literacy D7](subjects/data-ai-literacy.md)) becomes level 10, one representation comparison inside the ladder.
- **Curcio** becomes level 11 with the [chance-statistics](subjects/chance-statistics.md) boundary kept: every claim is decided by what is on the screen, and "the graph can't say" means the graph does not measure that, never a guess about another meadow. Predictions and samples stay with Spinner Fair and Sample Safari.
- **Genetics' offspring graph** stays a bounded display elsewhere; there is no second graph builder.
- **Ladder audit round three** ("more critter kinds and meadows"; preschool at level 1) becomes slice 1's fresh content and a preschool decision on level 8, not level 1.

Long-term arc: pre-K lines things up and builds plain bars; school builds, reads, scales by two and five, tallies, compares two pictures and judges claims. Line plots and fractional keys (half a block) are later, for a school band that reaches 9–11.

## Experience and presentation

- **First unsupported action:** at level 8, tap a shell on the sand; it hops into the shell row. At level 1, tap above a bar.
- **Touch and consequence:** touch-down squash on the thing or a block outline at the bar's top; the thing hops with a rising `sfx.pop` and the row's slot fills; the voice counts ("three shells"). Ready again immediately, nothing waits on the voice.
- **Variety on replay:** seeded kinds (add `bear`, plural "bears"), a seeded meadow from two or three backdrop seeds, and at level 8 seeded shore scatters. The rule never changes with the look.
- **Reasoning versus precision:** whole columns and rows are the targets (110 wide, full height); comparing is the skill, never fine aim. Reading is never needed: every question and claim is spoken, with faces on every row and card.
- **Supported ending:** after two misses the glow points at something useful (the extra blocks above the shorter bar, the unmatched things in a row) and the round still ends with one sticker.
- **Co-play:** at level 8 a grown-up can be the one who "finds" things (hands them to her by pointing) while she lines them up; at 11 the grown-up makes up a claim aloud and she stamps it. Solo play is unchanged.
- **Art example:** level 8's driftwood is one `Graphics` path: a long rounded bezier in `wood.fill` with two darker grain strokes and a knot circle; a feather is a quill line with five short curved barbs a side in `swatch.teal`; shells reuse `shell()` from `src/art/shore.ts`; a pebble is `stoneArt`'s ellipse with a lighter highlight.
- **Needs a person:** whether a four-year-old lines up without being told what "most" means from the rows; whether a six-year-old understands "the graph can't say" (level 11).

## Proposed ladder

### Fresh content inside existing levels

- **Fair meadows** (levels 1–3, 7): singles through `groupSpots(n, 1, meadowArea(…))`, so no two critters touch and none stands on the graph. Rule test: every placement over 300 seeds per level at 1024×768 keeps critters 70 apart and above the panel.
- **A first pick you can see** ("which two are the same?"): the first bar lifts and outlines; tapping it again lifts it back down, free. The hint glows both answer bars, or the one not yet chosen.
- **A tempting wrong answer for "how many more"** (levels 3, 7): the taller bar's count is always among the choices when it is not the answer, with its own line ("That's how many ducks. How many *more* than pigs? Look above the pigs' bar"). Still a miss.
- **A hint that shows why:** after two misses on "how many more" or "how many in all", a dashed line runs from the shorter bar's top across the taller bar and the blocks above it glow (with a key, they count by twos aloud). The pad still glows after that, as now.
- **More kinds and meadows:** `bear` joins `KINDS` with its plural; two or three seeded backdrops.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | *Line them up* (Beach Tally) | pre-K order `[8, 1, 2]` with 8 in `entryLevels`; school order `[1, 2, 8, 3, 4, 5, 6, 7, …]` | A shore with 2 kinds (pre-K) or 3 (school), 2–6 of each, scattered; a tray with one row per kind, a picture at each row's start, slots lined up so rows match one to one | Tap each thing to line it up (always right, no miss); then "which row has the most?" (tap a row), and at school "how many more shells than stones?" | Lining up is never wrong; a wrong row or number is a miss with "look at the rows again"; after two, lines join the rows one to one and the unmatched things glow | Distinct counts where most/fewest is asked; every count fits its row's slots; choices include the longer row's count | New interaction (tap-to-row) and tray layout; driftwood and feather art in `shore.ts`; Bubble Beach-style sand backdrop; voice lines `graph.line.*`; bot taps each thing then answers; how-to steps `from: 8`; the lands test (no new game) |
| 9 | *A key of five* | school | Three tally cards (10–35 each, grouped by five) where the meadow was; a key card "block = five dots" | How many blocks each bar needs, then how many more | A bar with one block per mark, or the wrong count, is a miss ("each block is five; count the fives"); after two, that card's groups of five glow. Picking the number of blocks says "that's how many blocks; each block is five" | Counts are whole fives with at most 7 blocks, distinct; `choicesFor(answer, rng, 5)` includes the blocks and whole fives away | `per: 5` generalises the key art (five dots), the side scale (5, 10, 15) and voice (`graph.buildfives`, `recountfives`, `morefives`, `fives`); a tally card drawer (level 7's tally drawing reused); bot unchanged except the source |
| 10 | *Two pictures, one meadow* | school | A tally card and three small finished graphs side by side (each a 300-wide tap target): one plain graph of the card, one keyed (block = two) graph of the card, and one plain graph whose bars are exactly as tall as the keyed one's, from a different meadow | "Which two graphs show these critters?" Tap two graphs | The trap (same heights, different counts) or one graph alone gets "count with the key: 2, 4, 6"; a miss; after two, the keyed graph counts by twos aloud beside the tally card and both right graphs glow | The trap's block heights equal the keyed graph's; the keyed graph's critters equal the card's; no other pair matches | New interaction (choose two graphs); refactor `draw()` into a reusable small-graph drawer; voice lines; bot taps the two; the "first pick" lift from slice 1 |
| 11 | *What the graph can say* | school | A built graph (three kinds) and three spoken claims, one at a time, each on a picture card (faces with a bigger/smaller arrow, or a face with a picture of the thing claimed) | Stamp each claim yes, no, or "the graph can't say" | A wrong stamp is a miss with the bars the claim names lit; for a can't-say claim, the line "the graph shows how many, not who is biggest"; after two, the right stamp glows | Every yes/no claim is decided by the counts; can't-say claims come only from a fixed list of things the graph does not measure (who came first, who is biggest, who is fastest); one claim of each kind a round | New interaction (three stamps, 100+ units); slotted claim lines (device speech until V3); picture cards; bot stamps; a person check |

### Younger-band openings

**Preschool on level 8** (lining things up, two kinds, "which row has more?" only), rather than level 1 as round three suggested: the real-object graph is the step before blocks, and lining up cannot go wrong. It adds the `preschool` band, so the band audit (levels, lands page, how-to, birthdays) and a device fit check come with it. This is a decision; levels 8–11 go ahead without it.

### Easier entries and levels between existing ones

Level 8 is the appended easy entry: first in pre-K's `order` and declared in `entryLevels` so a pre-K birthday lands on it safely; second-tier in school's order after level 2. Levels 1–7, their IDs and pins stay as they are; nothing is renumbered.

### Left out on purpose

Pie charts and line graphs (later school); a half-block key (later, with fractions); timed counting; a graph of real family data in the app (that is the off-screen activity); predictions about another meadow (Spinner Fair and Sample Safari own sampling and chance); litter on the shore.

## Decisions for the developer

1. **A Picture Graph preschool opening on level 8 *Line them up*?** Adds the `preschool` band. Recommended: yes, after level 8 is built and played at pre-K, with roadmap chunk 18's preschool batch.

## Build slices, in order

1. **Fair meadows, a visible first pick and hints that show why** (existing-game fix tier: typecheck, rule tests including the placement sweep for levels 1–3 and 7 and the "how many more" distractor, one filtered regression play at levels 4 and 7 with a double tap on one bar and two wrong "how many more" answers; `fingerdemo` only if the bot's taps change): the gaps above plus `bear` and two seeded backdrops.
2. **Level 8, *Line them up*** (new-interaction tier: typecheck, unit tests including order, entry and lands, one scripted play at pre-K and one at school with one wrong row and the matching-lines hint, one portrait screenshot of the tray, `fingerdemo` at 8, one build for the art and voice).
3. **Level 9, *A key of five*** (new-level tier: typecheck, rule tests, one play of level 9 with a one-per-mark bar and the blocks answer, `fingerdemo` at 9, one portrait screenshot): independent of slice 2 except the level number; build after it.
4. **Level 10, *Two pictures, one meadow*** (new-interaction tier: typecheck, rule tests, one play with the trap then the right pair, one portrait screenshot, `fingerdemo` at 10): after slice 1 (the first-pick lift).
5. **Level 11, *What the graph can say*** (new-interaction tier: typecheck, rule tests, one play with one wrong can't-say stamp and the glow, one portrait screenshot, `fingerdemo` at 11, one build for the voice): after slice 4; a person check stays open.

## What was built in this session

Nothing: research and ideation only. Checks: `node scripts/check-links.mjs` and `git diff --check`; the meadow overlap probe ran once as a throwaway script and was deleted.
