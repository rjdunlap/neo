# Fruit Sums deep dive

*ID `fruit-sums` · bands school · levels 1–4 on 2026-11-07 · build slices 1–2 built ([PR #1362](https://github.com/rjdunlap/neo/pull/1362), [PR #1413](https://github.com/rjdunlap/neo/pull/1413)) · session `claude/dive-fruit-sums` ([PR #1358](https://github.com/rjdunlap/neo/pull/1358))*

## The game today

A hanging sign names a number (at level 4, shows a sum of two fruit) and the tree holds five or six numbered fruit. She taps two fruit into two boxes (at level 3 also a plus or take-away leaf) and taps the green check. **Any way that makes the number counts**, and a round asks for **two different ways**; the found ways are listed under the sign as "7 + 5 = 12". The learning purpose is number sense and choosing an operation, and seeing that many routes reach one answer (CCSS 1.OA.C.6 and 2.OA.B.2, adding and taking away within 20). Built 2026-10-13 from the notebook's *Make Twelve* (after Donkey Kong Jr. Math's *Calculate* mode); no definition file, the plan is in [GAMES](../GAMES.md#fruit-sums) and the [IDEAS row](../IDEAS.md).

| Level | Plan name (`describeLevel`) | Bands | What she decides |
| --- | --- | --- | --- |
| 1 | Make a number up to 10 by adding two fruit, two different ways | school | Which two fruit (of five, up to 9) add to a target of 4–10, then a different pair |
| 2 | Make a number up to 20 by adding two fruit, two different ways | school | The same with targets 11–20 and fruit up to 19 |
| 3 | Make a number up to 15 by adding or taking away, two different ways | school | Two of six fruit (up to 20) and a sign leaf; the fruit tapped first is the one to start from; targets 5–15 |
| 4 | Add two fruit to make the same as the sum on the sign, two different ways | school | Tray of five fruit (up to 9); the sign shows a sum such as "7 + 5" in fruit, targets 6–14; any pair with that total counts, and the sign's own pair (either order) is "the same as the sign", not a miss |
| 5 | Clear the tree: six fruit make three pairs to the number | school | Tray of six fruit (1–9); target 6–10; tap pairs that make the target, each right pair goes into a basket and leaves the tree; the round ends when the tree is empty (three pairs); counted by fruit, so a second 3 + 7 is a new pair |

`LEVELS` is `{ school: { min: 1, max: 5, order: [1, 5, 2, 4, 3] } }`, with no `entryLevels`.

**Content pools.** The tray is generated (`makeRound` in `logic.ts`): two planted ways (two sums, or at level 3 a sum and a take-away), padded with random fruit; whatever else the padding makes is accepted too. Six fruit colours by tray position; one backdrop (green sky, hills, `seed: 57`); one fruit drawing (a round fruit with a stem and a leaf); the sticker is one fruit with a numeral 2–9.

**Accounting.** A wrong total is a miss and the check shows what it made ("8"), spoken "3 plus 5 makes 8. We need 12."; the fruit stay so she can swap one. "The same way" (the same pair, or the same sum the other way round) and "we cannot take 9 away from 4" are not misses. After two misses on a sum the first fruit of an unfound way glows (one hint, counted when it appears).

**Known gaps.**
- The hint lights only the *first* fruit of a way; once that fruit is in a box, nothing guides the partner. A second glow on the partner (still one hint) would make the hint lead to a finish rather than a half-step.
- The fruit appear in place at the start; GAMES says "the tree drops" them, but nothing drops. Every round looks the same (one sky, one tree, one fruit shape).
- The sticker's numeral is from the seed, not the round's number.
- No couch entry (`src/couch/catalog.ts` has none) and no journal coupling.
- Person checks: none recorded for this game in [OBSERVATIONS](../OBSERVATIONS.md); whether a six-year-old reads "take away" leaves as signs or needs the spoken word each time is a person question.

**Browser coverage.** `fruitsums` covers levels 1, 3, 4 and 5 (`FROM_LEVEL=5` plays only level 5: portrait 768×1024, one wrong pair as a miss, three pairs into the basket, the tree empty, one sticker, screenshot `fruit-sums-5-portrait-basket`; `FROM_LEVEL=4` plays only level 4: sign 7 + 5, one wrong total as a miss, two ways, one sticker, portrait; a check before picking, two wrong totals and a hint, the same sum reversed, a take-away by leaf, portrait, one sticker).

## Similar games

Sources marked *search summary* were read through search results only, not opened.

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Donkey Kong Jr. Math](https://en.wikipedia.org/wiki/Donkey_Kong_Jr._Math) (NES, 1983; *search summary*) | Console arcade | *Calculate A*: Donkey Kong holds up a target and players climb vines to collect digits and signs to reach it, starting from zero; *Calculate B* starts from a random number, with larger or negative targets | The held-up number and the fruit/sign tree are already the game's frame; "start from a number you are given" is the missing-part idea of level 6's partner round | Racing another player to the target; precision climbing as the input |
| [Krypto](https://en.wikipedia.org/wiki/Krypto_(game)) (card game, 1963; *search summary*) and NCTM's [Primary Krypto](https://www.nctm.org/Classroom-Resources/Illuminations/Interactives/Primary-Krypto/) (page not opened: paywalled) | Card game, classroom interactive | Five cards and a target card; every card used once with any of the four operations; Primary Krypto is a small-number version for young pupils | Using *all* the given numbers as a finish condition (level 5 *Clear the tree*, in pairs) | The race to be first; an all-five, four-operation expression is far past school-band working memory |
| [The 24 Game](https://www.h2g2.com/edited_entry/A933121) (Suntex, 1988; *search summary*) | Card game | Four numbers make 24 with any operations; decks grow from single digits to add/subtract primers, double digits, fractions and variables; not every set of four is solvable | Separate primer decks (add/subtract only) before mixed operations, as this ladder already does; the grown-up "make 24" form | Timed classroom races; unsolvable cards (every tray here is built solvable) |
| [Shut the Box](https://en.wikipedia.org/wiki/Shut_the_box) (traditional; *search summary*) | Dice and tiles | Roll two dice and shut tiles whose values add to the roll; score is what stays open | Closing the numbers you used, so the tray empties as the round goes | Dice luck, a losing score, being stuck with nothing to shut |
| Countdown numbers round ([rules summary](https://incoherency.co.uk/countdown/pages/numbers-game); *search summary*) | TV quiz | Six numbers, a three-digit target, any operations, each number once, as close as possible | Not every number has to be used | The clock, "as close as possible" scoring |
| [DragonBox Numbers](https://www.commonsensemedia.org/app-reviews/dragonbox-numbers) (*search summary*) | Touch app, 4–9 | Number creatures 1–10 combine and split; a structured ladder earns new creatures | Numbers as bodies that join and split, which is the bond picture | Coins that buy levels |
| Singapore-maths [number bonds](https://en.wikipedia.org/wiki/Number_bond) (*search summary*) and [Maths — No Problem!](https://mathsnoproblem.com/en/approach/number-bonds) (*search summary*) | Classroom model | Part-part-whole circles; pictures before numerals; bonds to ten first; "2 and 4 make 6" and "4 and 2 make 6" are the same bond | The same-bond rule the game already has; making ten as the strategy for three-fruit sums | Worksheet drill |

**Learning references.**
- [CCSS 1.OA.D.7](https://thecorestandards.org/Math/Content/1/OA/D/7/) (opened through its search result): understand the meaning of the equal sign and judge equations such as 5 + 2 = 2 + 5 and 4 + 1 = 5 + 2 true or false. Level 4 *Same as the sign* is this standard with two sums.
- CCSS 1.OA.B.3 (*search summary*, [Illustrative Mathematics](https://tasks.illustrativemathematics.org/2.OA.B.html)): properties as strategies, including 2 + 6 + 4 by first making ten. Level 6 *Three fruit* is this.
- CCSS 1.OA.C.6 and 2.OA.B.2 (*search summary*, same source): add and subtract within 20, fluently with mental strategies by the end of grade 2. Levels 1–3 today.
- CCSS 1.OA.D.8, the unknown in any position (from the [algebra-balance study](subjects/algebra-balance.md)): level 5 hides nothing, but *Clear the tree* makes every pick a "what goes with this one?" question.
- The [algebra-balance study](subjects/algebra-balance.md) (Knuth et al. on the equal sign read as "the answer comes next") asks for a relational sign without "=": its *Both trees* candidate (AB7 in [RECOMMENDATIONS](subjects/RECOMMENDATIONS.md)) was waiting on this dive.

## What makes sense here

The game's point is the second way: many routes to one number. The ladder grows by changing *what the number is made from* and *what the two ways are compared with*, never by speed or a larger board.

- **Fits:** a sign that is itself a sum (relational equals, school); using up every fruit in pairs (bonds, school entry); three fruit (making ten); a times leaf (upper school). Fresh trees, moods and a real drop. A partner glow so the hint finishes what it starts.
- **Later or gated:** the grown-up "make 24" (four fruit, all four operations, brackets) needs a band decision and an expression interaction; a pre-K entry (bonds to 5 with dot fruit) needs a band decision.
- **Out:** racing (Krypto, 24, Calculate A), clocks and closeness scoring (Countdown), unsolvable trays, dice luck.
- **Overlaps checked.** Monster Munch and Duck Pond do one operation on one answer; Frog Hop is a number line; Little Helpers 8 *Strong helpers* composes a number from bodies counted by twos and ones (its dive already notes the overlap: parts as bodies there, numerals here); the proposed PP5 *Sum Crates* (Kakuro, in [puzzle pages](subjects/puzzle-pages.md)) fills crossing runs so each adds to a label, which is partitions under two constraints, not a free choice of route. *Clear the tree* is the nearest: it partitions the whole tray, but into pairs for one number with no crossing constraint, and Sum Crates should check it when defined.

**Long-term arc.** School 6–7: two ways to 10, then to 20, then the take-away leaf, *Clear the tree* and *Same as the sign*. School 7–8: three fruit and making ten. School 8–9 and up: times. Grown-up (decision): make 24.

## Experience and presentation

- **First unsupported action.** Tapping a fruit: it hops into a box with a marimba note and its number spoken. Any two fruit and the check give an honest answer ("3 plus 5 makes 8"), so the first try teaches even when it misses.
- **Touch and consequence.** A fruit pops on touch-down and springs (`ease.outBack`) into its box; the check shows the total it made in place of the tick; a right way bursts stars and is written under the sign. Slice 1 adds the drop: at the start each fruit falls from the canopy to its place with a small bounce and a leaf rustle (`sfx.pop` with a falling pentatonic step), and a found way's two fruit take a little hop back.
- **Variety without changing the rule.** Seeded trees and moods: an orchard morning (today's), a cove palm with coconut-brown fruit at sunset (Counting Cove is the land), and an autumn tree with pears and plums in a golden sky. Fruit shapes vary by tree (round, pear, plum) from one drawing function with a shape parameter; colours stay six. The numbers come from `makeRound`, so replay already varies.
- **Concrete art example.** A pear is `ellipse(0, 14, 40, 44)` over `circle(0, -22, 30)` filled from the same swatch, with the stem and leaf of today's `fruit()`; a coconut is a brown circle with three `circle(±10, -10, 5)` eyes and no leaf. The numeral stays at 60 units (50 for two digits).
- **Reasoning versus reading and precision.** Numbers and signs are spoken on tap; no reading is needed. Every target is a 110-unit fruit or 120-unit box; nothing moves while she decides. Memory load is two numbers in the boxes, three at level 6.
- **Supported ending.** The hint glows a start fruit and (slice 1) then its partner, so even a stuck round finishes; the round ends after two ways (or an empty tree at level 5) and the shell gives one sticker.
- **Co-play.** Today's prompt (one picks the first fruit, the other finds its partner) becomes *the* rule at level 5, so a grown-up and child naturally share it: one picks, one finds the partner. Solo play is unchanged.
- **Person or device questions.** Whether "is the same as" (level 4) is understood as "is worth the same" by a six-year-old, rather than "looks the same"; whether three boxes at level 6 crowd a 768-wide portrait iPad.

## Proposed ladder

### Fresh content inside existing levels

- **Trees and moods** (all levels): three seeded looks as above, chosen from the round's RNG; the backdrop gets the mood's sky and hills.
- **The drop**: fruit fall in at the start (tweened, scene-owned; nothing waits on it, and taps are taken once a fruit lands).
- **A hint that follows through**: after the glowing start fruit is in a box, its partner glows instead (and at level 3 the needed leaf, if the sign is wrong). Still one hint per sum, counted when the first glow appears. Rule test: `hintWay` given a tray, the found ways and the fruit already in the first box returns a way that starts with that fruit if one exists.
- **Sticker**: the round's number on the fruit (the shell passes only a seed, so this stays as is unless the sticker seed carries the target; leave it).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | *Same as the sign* | school | The sign holds two small fruit, "6 + 4", instead of a numeral; the tray of five fruit has two other pairs that make 10 | Two fruit worth the same as the sign's pair; then a different pair. Each way is spoken "7 plus 5 is the same as 6 plus 4" and written "7 + 5 = 6 + 4" under the sign | The sign's own pair (either order) is "the same way", not a miss; a wrong total is a miss, spoken "3 plus 5 makes 8. 6 plus 4 makes 10."; the two-miss glow as today | Every seeded round has at least two ways other than the sign's own pair; targets 6–14; `judge` with the sign's key pre-found returns `same` for it | Sign art (two scaled `fruit()` and a plus, inside today's 260-wide sign); three voice lines; the bot already plays from `hintWay`. This is the algebra study's *Both trees* (AB7) in a one-tray form |
| 5 | *Clear the tree* | school (entry, placed after 1) | A sign "10" and six fruit that make three pairs to 10 (for example 3, 7, 4, 6, 5, 5) | Which fruit goes with which; each right pair drops into a basket and leaves the tree, and the round ends when the tree is empty | A wrong total is a miss as today and the fruit stay to swap; the hint glows a fruit and then its partner. **Counted by fruit, not by value:** a second 3 + 7 is a new pair here (the level skips the `same` verdict), since a tray may hold two equal pairs | The no-dead-end invariant: in every seeded tray each value's count equals its partner's count (an even count at half the target), and removing any right pair keeps it, so any order of right picks empties the tree. Targets 6–10 at the entry; trays of 6 | Basket art and a short fruit-to-basket tween; used fruit untracked; two voice lines ("Into the basket!", "The tree is empty!"); bot: `hintWay` over the fruit still on the tree |
| 6 | *Three fruit* | school | "12" and six fruit; three boxes joined by two plus signs | Three fruit that add to the number, then a different three; a pair that makes ten is the natural strategy (2 + 8 + 2) | Two fruit and the check says "tap a third fruit first" (not a miss); a wrong total is a miss; the hint glows the first two fruit of a way that makes ten if one exists, else a start fruit | Every tray has at least two distinct triples (sorted keys) for targets 10–18; at least one of them contains a pair that makes ten; layout at 768×1024: all boxes ≥100 units and on screen | Layout change: today's row spans 586 units with a 134-unit pitch; three boxes at that pitch need about 854, over the 768-unit portrait width, so the row packs at `SLOT` 110 with 50-unit sign gaps (about 680 units). Needs a layout probe first. `Way` gains a third index; voice for three-part sums |
| 7 | *A times leaf* | school (upper, 8 and up) | "12", six fruit up to 12, and three leaves: plus, take away, times | Two fruit and a sign; any of the three that makes the number counts; two different ways | As level 3; times is commutative like plus (`wayKey` sorts it); the hint prefers a way with a sign she has not used yet | Every tray has at least one times way and at least two ways in all; targets from a list of composite numbers 6–24; three leaves ≥100 units and clear of each other at five views | A times sign (two crossed bars, as `signArt` draws plus); voice "times"; leaves row widens to three |

### Younger-band openings

- **Pre-K *Partners to five*** (decision): dot fruit (one to five dots instead of numerals), a sign of 5, and *Clear the tree*'s rule with three pairs. It would open `prek` to the game. Needs the developer: band, and whether dots on fruit duplicate Number Trails or Bubble Pop counting.

### Easier entries and levels between existing ones

- Level 5 *Clear the tree* (to 10) is easier than level 2 (to 20). Place it with `order: [1, 5, 2, 4, 3, 6, 7]` on the school band; levels 4, 6 and 7 follow their numbers. No `entryLevels` change: level 1 stays the entry. Appending never renumbers a saved level or pin.

### Left out on purpose

- Racing an opponent or a clock (Krypto, 24, Countdown, Calculate A).
- "As close as you can" scoring; every tray is solvable.
- Division and brackets in the school band.
- *Both trees* as two separate trays side by side: level 4 delivers its relational sentence on one tray; the two-tray form would need a second tray row and stays open behind a layout probe if level 4 shows a need for it.

## Decisions for the developer

- Open `prek` with *Partners to five* (dot fruit)?
- A grown-up "make 24" level or couch puzzle (four fruit, all four operations, brackets)?

(Both added to [Waiting on the developer](../WAITING-ON-DEVELOPER.md).)

## Build slices, in order

1. **Trees, moods, the drop and a hint that follows through** (built, PR #1362; all levels; typecheck, rule tests for the partner hint, one filtered `fruitsums` play at level 3 with one hint and one portrait screenshot in the cove sunset look; no `fingerdemo`, since the bot path is unchanged; build only if shared art files change).
2. **Level 4 *Same as the sign*** (built, PR #1413; new level on the existing interaction: typecheck, rule tests, one browser play of level 4, `fingerdemo` at 4).
3. **Level 5 *Clear the tree*** with the school `order` (built, PR #1419; same interaction with a basket; typecheck, rule tests including the no-dead-end invariant, registry/how-to tests, one browser play of level 5 with one wrong pair, one portrait screenshot, `fingerdemo` at 5).
4. **Level 6 *Three fruit*** (new interaction, a third box: layout probe at 768×1024 first, unit tests, one scripted play with a two-fruit check and one hint, one portrait screenshot, `fingerdemo` at 6).
5. **Level 7 *A times leaf*** after slice 4's layout work is merged only if the leaves row needs it (new level on the sign-choice interaction: typecheck, rule tests, one browser play of 7, `fingerdemo` at 7).

## What was built in this session

Dive session: nothing (research only). **Slice 1 built 2026-11-07 (PR #1362, `claude/fruit-sums-trees`).** Three seeded looks per round (`LOOKS`, chosen by the round's RNG after the tray): orchard morning (round fruit), cove palm at sunset (coconuts ringed in the tray colour, teal sea and sand), autumn (pears and plums alternating, golden sky). The drop: fruit fall from above the top edge, staggered 0.09 s (`DROP_GAP`), landing on falling pentatonic pops; a fruit takes taps only once landed and `autotouch` waits for it. A found way's two fruit hop. `hintWay(..., first)` prefers a way starting from the fruit in the first box and `hintGlow` glows start fruit, partner, needed leaf (level 3), then the check; a dead-end first-box fruit glows so a tap sends it home. Still one hint per sum, counted when the glow first appears; `fsums.hint` now says "Follow the glow! It shows the next step." Sticker unchanged. Not run: `fingerdemo` (bot path unchanged), the level-3 hint in a browser (unit-tested, including a simulation that following the glow from every box state finishes an unfound way at levels 1 and 3).

**Slice 2 built 2026-11-07 (PR #1413, `claude/fruit-sums-same-as-sign`).** Level 4: the sign shows a sum of two fruit (pink fruit in the round's look, scale 0.7) instead of a numeral; tray of five fruit (up to 9), targets 6–14. `makeRound` for level 4 (`pairRound`) plants the sign pair's half and two other distinct pairs, then pads one random fruit; `TreeRound.sign` carries the pair. `takenWays(round, found)` prepends the sign key, so `judge`, `hintGlow` and the bot's `hintWay` treat the sign's own pair (either order) as `same` (no miss, spoken `fsums.samesign`). Found ways are written "x + y = p + q". New voice lines: `fsums.start4`, `right4`, `wrong4`, `again4`, `samesign`, `done4`. The how-to card's goal now says "what the sign shows" and the level-3-only lines are scoped `from 3 to 3`. Ran: typecheck; `npm test` (6229 passed); `BROWSER_SUITE=fruitsums FROM_LEVEL=4`; `fingerdemo` at 4. Not run: build, levels 1–3 browser play, the sign's-own-pair tap in a browser (unit-tested in `judge`), offline.

**Slice 3 built 2026-11-08 (PR #1419, `claude/fruit-sums-clear-the-tree`).** Level 5 (school): six fruit make three pairs to a target of 6–10 (fruit 1–9). `clearRound` picks three halves with replacement and requires at least two distinct ones, so a wrong pair always exists; the tree always empties (equal counts of each value and its partner, an even count at half the target, and an exhaustive test that every order of right picks finishes). Each right pair tweens into a woven basket below the tray and leaves the tree; the round ends when the tree is empty (`waysNeeded` = 3). Counted by fruit, not by number: `takenWays` returns [] at level 5, so a second 3 + 7 is a new pair and there is no "same way" verdict. `solutions`, `hintWay` and `hintGlow` take a `gone` array so the hint, its glow and the bot skip fruit in the basket; the two-miss glow hint is unchanged (a start fruit, then its partner, once per pair). `LEVELS.school` is `{ min: 1, max: 5, order: [1, 5, 2, 4, 3] }`. The found-ways line scales to fit the screen width. New voice lines `fsums.start5`, `right5`, `again5`, `done5`; the how-to card's level-4 entries are scoped `to: 4` and new `from: 5` step, finish and note entries added. Ran: typecheck; `npm test` (329 files, 6253 passed, 1 skipped); `BROWSER_SUITE=fruitsums FROM_LEVEL=5`; `fingerdemo` at 5 (15.8 s); game-reviewer found no defects. Not run: build (no shared files or assets changed), levels 1–4 in a browser, offline, the level-5 hint glow in a browser (unit-tested only), iPad or child play.
