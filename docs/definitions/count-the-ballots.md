# Count the Ballots (definition)

Defined 2026-11-26 as slice **CC3** of the [community-civics study](../deep-dives/subjects/community-civics.md#build-slices-in-order) (branch `claude/define-civics-cc3`). Docs only: no code, no registration, no save field. Decision 3 was taken 2026-10-23 on the developer's delegation: the home is **Lantern Lake** with the 11–12 signpost. Game id `count-the-ballots`; grown-up name *Count the Ballots*; spoken title "Count the Ballots". This packet defines **levels 1–2**; level 3 (a fourth candidate, twelve ballots) is named at the end and left for its own slice.

**Fun action and purpose.** Nine villagers have each ranked three fairground rides, best first, on a paper ballot. She sorts each ballot into the pile of its first choice. No pile reaches a majority (five), so the smallest pile is **out** and its ballots move to their next choice that is still in. She repeats until one pile holds a majority and that ride is built. The learning is a counting procedure with a rule that can change the answer: a majority, an elimination, a transfer, and (level 2) the difference between "most first choices" and "most villagers can live with". The study's text: nothing is timed, nothing is lost, and the lesson is shown, not preached.

## Overlap and reuse

- **Identity check.** No built game sorts ranked ballots. **Village Vote** (levels 1–6, [definition](village-vote.md)) counts raised paws for a one-choice vote and, at level 4, sends two dropped friends to a second choice once; Count the Ballots is the grown-up form of that run-off with every ballot carrying a full ranking, so it does not extend Village Vote (a different action, a different band, a different home), but it reuses its vocabulary: the same pictures, the same "tally" idea and the same rule that the vote builds something.
- Reuse `onTap` (`src/engine/input.ts`) for ballots and piles, `src/engine/drag.ts` for dropping a ballot on a pile (a refused drop floats home), Market Stall's coin-tap pattern for a pile's running count, `ctx.particles` for the build sparkle and `src/progress/coach.ts` for miss and hint counting. The deal generator, the count and the run-off are new and live in `logic.ts`.
- **Placement.** Lantern Lake (`src/content/lands.ts`), appended after the current last game (Market Days, if it has been built; otherwise after `outcrop-detective`). The capacity test is a property, not a hope: [location pages](location-capacity.md) mean a full Lantern Lake pages rather than shrinks, and `landLayout` returning null is caught by the lands test at every band. The build adds the game and runs that test; it does not change `LAND_SPOTS`.
- **Civics on screen.** Rides, villagers and paper are the island's own. No real election, party, candidate or voting system is named, drawn or spoken, and the voice never says "better" about either counting rule: it says what each rule found. The word *run-off* is used only on the grown-up card.

## The model (`logic.ts`)

- **Candidates.** Three rides, drawn from a pool of six (wheel, carousel, boat swing, bumper cars, slide tower, balloon ride) by the seed. Each has an id `0`, `1`, `2`, a name for the voice and a picture **and a shape-and-colour badge**, so a ballot reads without colour (a ballot is never colour-only; colours come from `src/art/palette.ts`).
- **A ballot** is a permutation of the three candidates, best first. There are six. A **deal** is a count for each of the six rankings, summing to **9**. The majority is `floor(9 / 2) + 1 = 5`.
- **Count (`count(deal, out)`).** The first-choice count of a candidate that is still *in*: each ballot belongs to its highest-ranked candidate that is not in `out`.
- **Run-off (`runoff(deal)`).** Count with `out = {}`. If a candidate holds a majority, it wins (a round is never dealt this way; see the invariants). Otherwise the candidate with the fewest first choices is out, count again, and the winner is the candidate with a majority. With three candidates this takes **exactly one elimination**.
- **Plurality winner** is the candidate with the most first choices in the first count.
- **The deal generator** enumerates the compositions of 9 into six parts (2,002 of them, cheap at runtime), keeps those meeting the invariants for the level, and picks one with the seeded RNG. The seed then picks which three rides appear, which ride is which candidate id, and the order the nine ballot cards lie in the hand. The invariants are unchanged by any of these.
- **Facts proved by enumeration while writing this definition, to be pinned by test.**
  - Of the 2,002 deals, **360** have no first-round majority, a unique largest pile and a unique smallest pile (a tie at either would make the step ambiguous). In **every one** the first-choice piles are exactly **4, 3 and 2**: a deal with no majority and no tie has only that shape. So the first count never surprises her with a different shape; what varies is who holds which pile and where the smallest pile's ballots go.
  - In **240** of the 360 the run-off winner is the plurality winner (the largest pile). In **120** it is not (the **level 2** deals): the ride with four first choices loses to a ride that the eliminated ballots lift from three or two to five.
  - Each class of deal has six relabellings (the pile sizes 4-3-2 force the candidates to be distinguishable), so there are **60** distinct deals at level 1 and **20** at level 2 up to which ride is which. The seed multiplies these with the ride trio (20 triples from the pool of six, in a seeded order) and the hand order, so rounds are varied without any new rule.
  - One example level-2 deal: four ballots *carousel, boat swing, wheel*; two ballots *wheel, boat swing, carousel*; three ballots *boat swing, carousel, wheel*. First choices: wheel 2, carousel 4, boat swing 3. The wheel is out; its two ballots move to the boat swing, which holds 5 and wins. The plurality winner (the carousel, 4) loses.
  - One example level-1 deal, where the two agree: two ballots *wheel, boat swing, carousel*; three *carousel, boat swing, wheel*; one *boat swing, wheel, carousel*; three *boat swing, carousel, wheel*. First choices: wheel 2, carousel 3, boat swing 4. The wheel is out; its two ballots move to the boat swing, which holds 6 and wins. The level-1 generator filters `runoff(deal) === plurality(deal)` (240 deals) and the build's test asserts it.
- **Invariants (rule tests).** Every dealt round has nine ballots; no first-round majority; a unique largest and a unique smallest first-choice pile (the 4-3-2 shape); one elimination reaches a majority and never a tie; level 1 deals have `runoff = plurality`; level 2 deals have `runoff ≠ plurality`; a ballot is always a permutation of the three candidates.

## Levels

| Level | Name | What changes |
| --- | --- | --- |
| 1 | *Count first choices* | A deal with `runoff = plurality`. Nine ballots, three pile slots. She sorts each ballot into the pile of its first choice; when all nine are sorted the piles are counted aloud; then the smallest pile is out and she sends each of its ballots to its next choice still standing; when she finishes the new winner is named and the ride is built. |
| 2 | *Does the first count tell the truth?* | A deal with `runoff ≠ plurality`. The same steps. After the run-off winner is built, the game asks "Count only first choices: who wins?" and she taps; the plurality winner is shown beside the run-off winner and the voice says what each rule found ("Most first choices: the carousel. Most villagers who can live with it: the boat swing."). |

**Bands.** `grownup` levels 1–2 and `school` levels 1–2 (school's top, 11–12, through the lake's signpost; the build decides with the lands test, as Market Days does). The build writes the `BandLevels` table, reads it with `rangeFor`, and gives `describeLevel` plain text. Level 3 is not part of this packet, and level 2's closing question is an extra step of level 2, not a miss source.

## Screen and controls

- **Layout.** Landscape 1024 × 768: the hand of nine ballot cards at the left (a 3 × 3 block, each card about 120 × 190 showing its three ranked pictures with the numerals 1, 2 and 3), and the three pile slots at the right, each a tall tray showing its ride, with a running tally of paper slips. Portrait lays the hand at the top and the piles at the bottom from `view`, never from `window`. The pet sits in the lower-left corner, clear of the hand (`companion()` repeats the instruction). **A ballot card is the tap target** and is at least 100 logical units after scaling at `school`; at `grownup` it may be 64 and the hand may scroll if a view cannot fit it (the band rule). A layout test at four views asserts both before any art.
- **Sorting.** Tap a ballot (lift and outline on touch-down; the ballot's first choice is highlighted), then tap a pile; or drag the ballot to a pile through `drag.ts`. A ballot dropped in a pile that is not its first choice floats home with a wobble and the spoken hint (a miss). Nothing needs reading: the first choice is a picture and a numeral 1.
- **The run-off.** When every ballot is sorted the piles are counted aloud, one slip at a time, and a pile that holds five (never at the first count) would build at once. The smallest pile's tray dims and a "Out" badge sits on it. Its ballots stay in place, each now highlighting its **second** choice (the next still standing), and she moves each to that pile. A ballot whose second choice is already out highlights its third.
- **No clock, no score, no lives.** One sticker per round (as for every game); Undo steps back one move; Restart redeals the same seed. Neither is counted.
- Keys and a pad: arrow keys move a ring over ballots and piles in layout order; 1–3 pick a pile; Enter moves; Esc goes through `App.escape()`.

## Accounting, help and finishing

- **Misses** are counted only on **moving a ballot to a pile that is wrong** (a pile other than its first choice at the first count, or other than its next choice still standing at the run-off) and on **naming the wrong plurality winner at level 2**. Picking up a ballot, lifting it back, counting a pile and reading the board are free.
- **Hint rule.** After two misses on a ballot, the right pile glows (one hint per ballot, counted). The Help button glows the right pile for the lifted ballot and counts the same single hint. At level 2's question, after one wrong tap the largest first-count pile glows (one hint).
- **Sorting two ballots in a row to the right pile wins no extra; helping is never silent** and an assisted completion is counted as a hint, not as independent mastery (as for every game).
- **Finish.** The last legal move builds the ride (the shell's celebration), `ctx.finish({ misses, hints })` is called once. Nothing is kept: no creation, no journal entry, no history line beyond the shell's.

## Rule tests (`logic.test.ts`)

- **Exhaustive counts.** Over all 2,002 deals: exactly 360 pass the no-majority-and-unique-extremes filter, all with first-choice piles 4, 3, 2; 240 of them have `runoff = plurality`; 120 have `runoff ≠ plurality`; and each class has exactly one relabelling per permutation of the candidates.
- The level generators draw only from their classes over a few hundred seeds; every dealt hand has nine ballots, each a permutation of the three candidates.
- **Run-off equals the definition.** For every deal in the 360, an independent brute-force (try each candidate as the one eliminated and keep the one whose elimination leaves a majority) agrees with `runoff`; no elimination step ever has a tie.
- Next-choice routing: each ballot of the eliminated pile moves to its highest-ranked candidate not out, never to the eliminated one; the hint always names that pile; a hint is never named for a ballot already correctly placed.
- The level 2 question: the plurality winner is a different candidate from the run-off winner in every dealt round and is never the eliminated one.
- Layout: the hand and three piles fit at four views, with every tap target at least the band's minimum after scaling and clear of the pet's corner.

## Ghost finger, how-to card, voice and registration

- **Ghost finger.** The `autotouch()` bot taps ballot, then pile, in hand order, makes one deliberate wrong drop at level 1 for the wobble, then the Help hint, then moves the eliminated pile's ballots and at level 2 taps the plurality winner.
- **How-to card** (`howto.ts`, level-scoped): level 1 "Put each ballot in the pile of the ride it likes best. If no pile has five, the smallest pile is out: move those ballots to their next choice."; level 2 "Now count only the first choices. Is it the same ride?"
- **Voice lines** in `voice.ts`: the instruction the pet repeats, the wrong-pile hint ("That one likes the carousel best."), the count-along, "No ride has five yet. The wheel is out.", the finish ("The boat swing has five!"), level 2's two findings. Run `node scripts/content-barrels.mjs` after.
- **Registration.** `src/games/count-the-ballots/index.ts` exports a `GameModule` listed in Lantern Lake's `games`, `challenge` set (a puzzle), skills `counting`, `comparing`, `rules and fairness`, a hub icon (a ballot box) and a sticker art (a paper slip with a tick). Stable id `count-the-ballots`; no save field, no pin special case.
- **Co-play and off-screen.** Two people share: one reads each ballot's first choice aloud and the other puts it in its pile. Off-screen: nine slips of paper with three favourite ice creams ranked on each, sorted into piles on the table, and the smallest pile's slips moved to their next choice.
- **Couch play.** None. The couch catalog is a separate route and a sort-and-count puzzle for one player has nothing for a shared screen; the player guide ([COUCH-PLAY](../COUCH-PLAY.md)) needs no change.

## Check tier (for the build)

New game: typecheck, unit tests (the exhaustive counts above run in milliseconds), **one** filtered scripted play of level 1 and level 2 with one wrong pile and one hint, one portrait screenshot, `fingerdemo` at level 2, the lands test (capacity and one-land) for Lantern Lake at every band, and `npm run game-docs`. `npm run build` only if shared files or assets change. Docs: the game's page `docs/games/count-the-ballots.md`, the study's CC3 row and a verification entry.

## Open decisions

- **Whether school gets levels 1–2.** The default here is yes (the study says an 11–12-year-old reaches the game through the signpost, and Lantern Lake already holds school-level puzzles); a strictly grown-up game would set `bands: ['grownup']` and drop the school range. The 100-unit target rule at school is the price: the hand's nine cards must fit at that size, which the layout test settles.
- **Level 3** (a fourth candidate and twelve ballots, a majority of seven, up to two eliminations) is not defined here. It needs its own enumeration of tie-free deals and a decision on a tie *within* an elimination (the study's rule is that every dealt deal has a unique smallest pile at every step).
- **Whether the voice ever calls one rule "fairer".** This packet keeps the study's recommendation: it names what each rule found and judges neither (the values call is the developer's; see the study's decision 4, which settled the same for *Chip in*).
