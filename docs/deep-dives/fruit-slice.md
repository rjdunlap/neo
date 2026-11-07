# Fruit Slice deep dive

*ID `fruit-slice` · bands toddler, preschool, pre-K, school · levels 1–9 on 2026-11-07 · session `claude/dive-fruit-slice` ([PR #1346](https://github.com/rjdunlap/neo/pull/1346))*

## The game today

Big fruit is tossed up from a basket and hangs near the top of a slow arc (about 1.8 s in the hang); a swipe across it splits it with a pop, juice drops and a rising pentatonic note. The motor purpose is the **crossing stroke** through a moving target; the thinking purpose grows from *which ones* (one kind, then fruit and not other things) to *how many* (stop at the sign and send the bowl), *which straight line* crosses exactly N, and counting pieces by twos. Built 2026-10-20 from its [definition](../definitions/fruit-slice.md) ([PR #667](https://github.com/rjdunlap/neo/pull/667)); home land Bubble Beach (14 games).

| Level | Plan name | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | Touch the fruit | toddler | Nothing: any touch slices (one aloft, 6 slices) |
| 2 | Swipe across | toddler, preschool | Move the finger through the fruit (two aloft, 8 slices) |
| 3 | Only the apples | preschool, pre-K | One seeded kind among others (three aloft, 6 of the kind) |
| 4 | Only fruit | preschool, pre-K | Fruit, not a balloon, flower, beach ball or shell |
| 5 | Just enough | pre-K, school | Stop at 3, 4, then 5 or 6, and tap the bowl to send |
| 6 | Two kinds, two numbers | pre-K, school | A two-row sign, each kind 1–4 |
| 7 | One straight swipe | school | One straight line through exactly N (2, 3, 3, 4) of four to six still fruit |
| 8 | Pieces by twos | school | Every fruit makes 2 pieces; signs 6, 8, then 10 or 12 on a still board of three pairs cut with the line tool |
| 9 | Two lines clear it | school | Two straight lines that together cut every fruit of a still board (two rows of 3+2, 2+2, 3+2, 3+3); a line through no fruit is free |
| 10 | Twos and threes | school | Apples make 2 pieces, oranges 3; signs 7, 9, then 10–12; a cut past the sign is a miss, one piece short is free: tap a fruit token above the bowl to put that fruit back |

`BandLevels`: toddler 1–2, preschool 2–4, pre-K 3–6, school 5–10; no `order`, no `entryLevels`, no lap or grown-up range.

**Content pools.** Nine fruit kinds (apple, orange, lemon, pear, blueberries, grapes, plus strawberry, banana and plum) and four not-fruit (balloon, flower, beach ball, shell), all art from `src/art/props.ts` (the three new fruit are `smallFruit()` there, moved from Bolt Boards' local drawing); each round draws a seeded mood from `MOODS` in `logic.ts` (morning, picnic with greener hills and a red-checked blanket, sunset with an orange-to-pink sky and a low sun), decoration only. Level 3 picks its kind from nine; level 6 picks two of nine with counts 1–4; level 7 boards are seeded (four to six fruit, with lines through N and N − 1, and N + 1 when N is below 4); level 8's pair board is seeded. Voice lines are per kind (`slice.instruct.only.<kind>`, `slice.not-kind.<kind>`), so a new kind needs two lines.

**Known gaps.** Rounds differ in kind and mood only (one basket, no weather beyond the three moods); a pre-K child meets the sign's count at level 5 straight from level 4's sorting, with 3 as the smallest count and three aloft; school ends at level 8 with no level that asks her to plan more than one line or to correct a total; the IDEAS fractions row still says it waits on the fractions study, which has since landed (see decision 1). Nothing is saved or filed in the journal, and there is no couch play (the swipe is the point). Device check open in [DEVICE-CHECKS](../DEVICE-CHECKS.md): palm and wrist contact on a toddler's swipe, whether the hang feels calm or slow, whether the level 7 line reads to a six-year-old.

## Similar games

Listings and reviews below were found by search this session, not played; the definition's references (Fruit Ninja, Math Master, Toca Kitchen 2, Aziz et al.) were opened there and are reused.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Halfbrick *Fruit Ninja* ([App Store](https://apps.apple.com/app/403858572), [Common Sense Media](https://www.commonsensemedia.org/app-reviews/fruit-ninja)) | Arcade slicing | Classic adds bombs and dropped-fruit strikes; Zen a 90-second clock; Arcade bonus bananas and combos for several in one swipe | Several fruit in one stroke as something she *chooses* (level 9's two lines are the slow, still version); more fruit kinds | Bombs, strikes, clocks, combos for speed, purchases |
| Halfbrick and Krome *Fruit Ninja Academy: Math Master* ([press release](https://halfbrick.com/press/halfbrick-launches-fruit-ninja-academy-math-master/)) | Slicing as a maths answer, 5–7 | Grade 1 topics in order: numbers, skip counting, sequences | Skip counting carried by pieces (level 8 already; level 10 mixes twos and threes) | Unlock-for-performance rewards |
| Com2uS *Slice It!* ([TouchArcade review](https://toucharcade.com/2010/09/08/slice-it-review-%e2%80%93-this-puzzle-game-will-have-you-in-pieces), [MobyGames](https://www.mobygames.com/game/53722?s=platform), [Nintendo eShop](https://www.nintendo.com/en-gb/Games/Nintendo-3DS-download-software/Slice-It--1082582.html)) | Line-cutting puzzle | A limited number of straight lines must make a set number of equal pieces; over 200 levels; later chapters add areas that cannot be cut and mirrors | **A fixed number of straight lines** as the planning constraint (level 9): the plan matters, not the finger | Star grades for evenness, tiny slivers from overlapping lines failing a solution |
| Ululab *Slice Fractions* 1 and 2 ([press kit](https://ululab.com/press-kit-slice-fractions/), cited by the [fractions study](subjects/fractions.md)) | Slicing physics puzzles | Each chapter adds one transformation before any notation | One new idea per level, many boards of it | Hazard theme, collectible hats as progression |
| Toca Boca *Toca Kitchen 2* ([parent page](https://tocaboca.com/for-parents/toca-kitchen-2-ios)) | Free chopping toy | No levels; any tool in any order | Each fruit sounds and splits its own way (an orange in wedges, a banana in rounds) | — |
| Melissa & Doug *Cutting Fruit Set* ([Rainbow Resource](https://www.rainbowresource.com/039272.html), [Do it Best](https://www.doitbest.com/product/BTYNCQ/melissa-doug-wood-cutting-fruit-set-btyncq)) | Wooden play food, 3+ | Seven fruit held together by hook-and-loop tabs, cut into 17 pieces, and stuck back together | **Putting a cut fruit back together** as a free, ordinary action (level 10's put-back); fruit that make different numbers of pieces | — |
| Bubble Pop, Puddle Gobble's put-back token (this repository) | Slow targets; undo of one choice | No loss pacing; tapping a strip token lets a thing go | The strip-token pattern for taking one choice back, free | — |

**Learning references** ([Common Core](https://www.thecorestandards.org/Math/)): K.CC.B.4–5 (count to tell how many, the last number names the set; up to 20 in a line) for the small counts of level 11; 2.NBT.A.2 (skip counting) and 2.OA.C.3 (odd and even by pairs) behind level 8; 1.OA.A.2 and 1.OA.C.6 (add three numbers, add within 20) behind level 10's mixed twos and threes; K.G and 1.G (positions, lines) are only loosely behind the straight-line levels, which teach planning more than geometry.

## What makes sense here

- **More to slice before more levels.** Toca Kitchen's appeal is that each food cuts its own way. Three more fruit (strawberry, banana, plum, already drawn in Bolt Boards' own art) and two beach not-fruit (a beach ball and a shell) widen levels 3–6 without a new rule, and a seeded mood (morning, picnic blanket, sunset) gives each round a look.
- **A gentler count for preschool and pre-K.** Level 5 asks for 3 to 6 with three aloft and opens pre-K's counting. A level of 2s and 3s with two aloft (K.CC's "how many" at a size a preschooler holds) gives preschool its first stop-and-send and pre-K a step between sorting and level 5.
- **Plan two lines (school).** *Slice It!*'s limited lines are the clearest next step after level 7: clear a still board with exactly two straight lines. It reuses the line tool and asks her to look ahead, not to be precise.
- **Make the number, then fix it (school).** The wooden cutting set's fruit come apart and stick back together, and its fruit make different numbers of pieces. Apples make 2 pieces and oranges 3; reach the sign exactly, and tap a fruit's pieces in the bowl to put it back whole. It adds revision (the AGENTS rule for older puzzles) and mixed addends within 20.
- **Not here:** halves and quarters (decision 1: the fractions study keeps equal shares in Pet Kitchen and length in Ribbon Workshop), bombs, combos for speed, faster or more fruit aloft, a timer, evenness grading, mirrors and blocked areas (a third rule on the line tool is more than one level of depth), the couch.

**The long arc.** Toddler touches, then swipes (1–2). Preschool chooses one kind and fruit over not-fruit (3–4), then stops at 2 or 3 (11). Pre-K sorts, stops at small then larger numbers, and counts two kinds at once (3–6, 11). School picks one line through N (7), counts by twos (8), plans two lines that clear a board (9), and makes an exact total from twos and threes with a put-back (10).

## Experience and presentation

- **First unsupported action:** at level 1 a toddler touches the hanging apple and it splits with a pop and a note; nothing she touches is wrong, and fruit that falls comes back.
- **Touch and consequence:** the sparkle trail starts at touch-down; a cut splits the fruit along the stroke, the halves tumble into the bowl and the note steps up. A refused cut bounces whole with a boing and its reason. At level 9 the first line stays drawn as a faint chalk mark, so she sees which fruit are left for the second; at level 10 a put-back fruit hops out of the bowl, its pieces snap together with a soft click, and it floats back into the basket.
- **Variety on replay:** nine fruit and four not-fruit, a seeded mood, seeded boards at 7–9, seeded signs at 5, 6, 8, 10 and 11. None of it changes a rule.
- **Concrete art example:** the sunset mood is the existing sky fill swapped for a two-band `Graphics` gradient (`swatch.orange.light` above `swatch.pink.light`, two rects with a 0.5-alpha seam), a `swatch.yellow.fill` half-sun circle behind the basket and the basket's weave lines in `swatch.brown.line`; drawn once in `draw()` with `eventMode: 'none'`. The orange's three wedges at level 10 are three `arc` sectors of the existing orange fill, each with a `swatch.white.fill` pith edge, so three pieces read as three without a number.
- **Reasoning versus precision:** the 75-unit hit circle and the slow hang keep the challenge on the choice; levels 9 and 10 use still boards or the slow hang, and every new tap target (the bowl's fruit tokens at level 10) is at least 100 units.
- **Supported ending and replay:** the two-miss glow and the pause sheet's "Show a hint" lead to the next right cut, line or put-back at every level; the bowl always reaches the sign. One sticker per finished round, help included; Start over keeps the round.
- **Co-play:** one person names the fruit to slice (today's hint); at level 9 one draws the first line and the other the second; at level 10 one says "two or three?" before the other cuts. Solo play is unchanged.
- **For a person or device to judge:** whether a preschooler at level 11 stops at the sign or keeps slicing for the fun of it (and whether the refused extra cut feels like a scold); whether the faint first line at level 9 reads as "that one is used"; whether a seven-year-old finds the put-back at level 10 without the hint; the existing toddler palm check.

## Proposed ladder

### Fresh content inside existing levels

- **Kinds:** strawberry, banana and plum join `FRUIT` (lifted from Bolt Boards' local drawings into `src/art/props.ts`, so both games draw the same fruit; Bolt Boards keeps its look). Each gets `slice.instruct.only.<kind>` and `slice.not-kind.<kind>` and a juice color. Level 3 picks from nine; level 6 from nine.
- **Not-fruit:** a beach ball and a shell join `NOT_FRUIT` at level 4 (beach things, never anything a child might call a fruit; no tomato, no nut). `slice.not-fruit` already speaks for any of them.
- **Moods:** a seeded morning, picnic-blanket or sunset backdrop per round, decoration only.
- A rule test asserts every kind has its two lines and a distinct silhouette entry, that no not-fruit is in `FRUIT`, and that `nextKind` still offers a right kind within the next toss with nine kinds.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | *Two lines clear it* | school (after 8) | Five still fruit in two seeded rows (three and two, crossing or apart, at least 160 units between fruit); the sign shows two lines. Later boards of four to six. Four boards | Which two straight lines together cut every fruit | A line that cuts fruit is never wrong. After the first line, if no single line can cut every fruit left, the pet says so at once ("One line can't reach all of those"), the cut fruit hop back together, and that is one miss; a second line that leaves fruit is the same. A line through no fruit or a cancelled line is free. At two misses on a board a dashed line from a two-line cover glows (consistent with the first line when it is part of one), one hint | Each board has a two-line cover from the line tool's candidates; no single candidate line cuts every fruit; the early check agrees with brute force over candidates for every reachable first line; the hint line belongs to a cover from the current state | Reuses level 7's line tool and `candidateLines`; voice for the instruction, the early check and the success; how-to step; bot traces the cover's two lines |
| 10 | *Twos and threes* | school (after 9) | Apples (2 pieces) and oranges (3) aloft, three at once; sign 7 in pieces. Then 9, then 10–12 | Which fruit to cut so the pieces make the sign exactly | A cut that would pass the sign is refused as at level 8 (one miss). A short total that no remaining cut can finish (one piece left to make) is never a miss: she taps a fruit token in the bowl strip to put that fruit back, free. At two misses the next cut or put-back from a solver glows, one hint | Every sign is reachable from an empty bowl; from every reachable bowl the hint reaches the sign in at most four steps; a put-back restores the exact count; `nextKind` always offers a kind that keeps the sign reachable within the next toss | **New interaction**: the bowl strip of fruit tokens (each at least 100 units, at most six, along the bottom right of the basket; needs a layout probe at 1024 × 768 portrait and landscape with the pet clear). Orange wedge art; voice for "apples make two, oranges make three", the put-back and "one more piece won't fit"; bot follows the hint |
| 11 | *Just a few* | preschool (after 4), pre-K (after 4, before 5) | Two aloft; the sign shows 2 (dots and a numeral). Then 3, then 3 | Stop at the small number, then tap the bowl | As level 5: a cut past a full bowl is refused, one miss; the bowl lids and glows at the count; at two misses the bowl or the next fruit glows, one hint. Tapping the bowl early says how many more, free | Signs are 2 or 3; two aloft; the plan's judging equals level 5's | Plan only, on level 5's code path; `order` for preschool and pre-K; how-to step range; voice reuses `slice.instruct.enough` |

**Orders:** preschool 2, 3, 4, 11 (max 11); pre-K 3, 4, 11, 5, 6; school 5–10 in numeric order (no `order` needed, max 10). `entryLevels` is unchanged: no band gains a new first level.

### Younger-band openings

- **Lap.** Decided 2026-10-23 (kept the built default): no lap level, since a lap tap-to-slice is Bubble Pop with fruit. Not reopened here.
- **Toddler 1–2** stays until the open palm and hang device check is done; nothing found supports a sorting rule (level 3) before about three.

### Easier entries and levels between existing ones

Level 11 is the easier step between level 4's sorting and level 5's counts, placed through `order` with a stable appended ID. A preschool 11 carried to pre-K is in pre-K's order and stays; nothing is renumbered.

### Left out on purpose

Halves and quarters (decision 1); evenness grading and line limits as stars (*Slice It!*); bombs, strikes, combos and clocks (Fruit Ninja); more than three aloft or faster arcs; mirrors and no-cut zones; a free curved stroke for level 9 (it would make two lines trivial, as decision 5 of the definition found for level 7); the couch.

## Decisions for the developer

1. **Close the fractions rung.** The [fractions study](subjects/fractions.md) has landed (2026-10-16, PR #480) and keeps equal shares in Pet Kitchen, length in Ribbon Workshop and number lines in Frog Hop; it gives Fruit Slice no rung. Close the IDEAS row as "nowhere in Fruit Slice"? Default: yes, closed; nothing in levels 1–11 names a half.
2. **Journal.** File each fruit kind in the discovery journal the first time she slices it? Default: no, nothing is filed.

Both are added to [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md). Slices 1–4 go ahead on the defaults.

## Build slices, in order

1. **More fruit, beach not-fruit and moods** (built 2026-11-07, PR #1382). Tier: typecheck and the game's rule tests (kinds, lines, `nextKind` with nine kinds), one filtered `fruitslice` play at level 3 with a new kind and one portrait screenshot in the sunset mood; `npm run build`, since `src/art/props.ts`, voice and Bolt Boards' drawing source change; no `fingerdemo` (bot unchanged); a filtered Bolt Boards regression play if its fruit drawing moves.
2. **Level 9 *Two lines clear it*** (built 2026-11-07, PR #1388). Tier: new level on the existing line interaction: typecheck, rule tests (cover, no single cover, early check, hint), one browser play of level 9 with one dead-end first line and one hint, `fingerdemo` at 9; build (voice, how-to).
3. **Level 10 *Twos and threes*** (built 2026-11-07, PR #1393). Tier: new interaction (the put-back strip): typecheck, unit tests, a layout probe first, then one scripted play (an overshoot refusal, a stuck total and a put-back, a hint, finish) and one portrait screenshot, `fingerdemo` at 10; build.
4. **Level 11 *Just a few*** (ready). Tier: new level on the existing interaction: typecheck, rule tests (plus registry and how-to tests for the new `order`s), one browser play of level 11, `fingerdemo` at 11; build (how-to, registry).
5. **Fractions closure and the journal:** decisions 1–2.

## What was built in this session

Slice 1 (2026-11-07, PR #1382): strawberry, banana and plum join `FRUIT`; beach ball and shell join `NOT_FRUIT`; a seeded mood per round; six new voice lines (`slice.instruct.fruit` now names beach balls and shells); rule tests for pool sizes, both lines per fruit, levels 3 and 6 able to ask every fruit, level 4 tossing every not-fruit and three moods. The `fruitslice` suite gained a level 3 upright sunset round asking a new fruit. Ran: typecheck, 350 unit tests across fruit-slice, bolt-boards and art, `fruitslice` and `boltboards` suites, build. Not run: `fingerdemo` (bot unchanged), device.

Slice 2 (2026-11-07, PR #1388): level 9 *Two lines clear it* (school; `LEVELS.school` is now 5–9). Four still boards of two seeded rows (3+2, 2+2, 3+2, 3+3 fruit, at least 160 units apart, the narrowest strip holding all fruit at least 170 so no single line clears one). She draws two straight lines that together cut every fruit; a line through no fruit is free. A first line that leaves fruit no single line can reach, or a second line that leaves any, is one miss: the pet says so at once, the fruit close up or hop back and the board resets. At every second miss, or on request, a dashed line glows (a cover's first line on a whole board, or the line that clears the rest after a good first line); it re-points without counting a new hint. New in `logic.ts`: `coverLines`, `clearingLine`, `oneLineClears`, `coverStep`, `coverHint`, `stripWidth`, `COVER_ROWS`, `coverBoardsFor`; five voice lines, a how-to step and note, and a level 9 segment in the `fruitslice` suite. Ran: typecheck; 45 fruit-slice rule tests (six new: boards, two-line cover with no single cover, early check against brute force, hint belongs to a cover, stuck cases, determinism); `npm test` (6,098 passed); `fruitslice` suite; `fingerdemo` at 9; build. Not run: offline, device; a six-year-old's reading of the two-line task is open.

Slice 3 (2026-11-07, PR #1393): level 10 *Twos and threes* (school; `LEVELS.school` is now 5–10). Apples make 2 pieces, oranges 3 (three wedges); signs 7, 9, then 10–12; only apples and oranges are tossed and `nextKind` brings a kind that keeps the sign reachable. A cut past the sign is refused and one miss. One piece short (no fruit makes one) is never a miss: tosses pause, slices bounce free, the pet says so, and she taps a fruit token in a strip above the bowl (one 104-unit token per landed fruit, at most six) to put that fruit back, free; a 0.5 s lock stops a double tap. A hint (two misses or on request) shows the solver's next cut, put-back or the bowl. New in `logic.ts`: `MIXED`, `piecesOf`, `piecesFor`, `finishable`, `stuck`, `putBack`, `mixedHint`, `keeps`, `STRIP_MAX`, `TOKEN`, `tokenAt`; four voice lines, how-to steps and note; a level 10 upright segment and a `FRUIT_LEVELS` filter in `fruitslice`. Ran: typecheck; 55 fruit-slice rule tests (ten new); `npm test` (6,126 passed); filtered `fruitslice` at 10 (stuck total, bowl tap, requested hint on a token, put-back, overshoot miss, finish; portrait screenshot); `fingerdemo` at 10 (11.2 s); build; game-reviewer findings applied. Not run: offline, device; whether a seven-year-old finds the put-back unaided is open.
