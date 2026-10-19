# Seesaw Balance deep dive

*ID `seesaw-balance` · bands toddler, preschool, pre-K, school · levels 1–10 built and 11 defined on 2026-10-19 · session `claude/dive-seesaw-balance-finish` ([PR #619](https://github.com/rjdunlap/neo/pull/619), resuming the claim in [PR #602](https://github.com/rjdunlap/neo/pull/602))*

Audited `src/games/seesaw-balance/index.ts`, `logic.ts` and `logic.test.ts` on `4fd0dc8c`, the [GAMES.md](../GAMES.md#seesaw-balance) entry, the how-to card, the voice lines, the journal entries, the Woodland Picnic's use of level 7, the [level 11 definition](../definitions/seesaw-two-boxes.md) and every notebook and audit mention. Nothing under `src/` changed.

## The game today

A springy seesaw with a level tray at each end, so only weight matters and never how far out a thing sits (the code says so and the how-to repeats it). Friends, unit blocks, number weights, look-alike presents and mystery boxes drag from the grass to a tray or back. Dropping on a tray clunks, the plank leans by `tilt()` (more for a bigger difference, capped), and the pet speaks the result. The learning purpose runs from "heavier goes down" through balancing with units, comparing and measuring, to the early-algebra moves of taking the same off both sides. Home: Tinker Lab, subject science; skills comparison, measurement, equality, counting; music `STYLES.stickers`; a ghost-finger bot (`touchDemo`, `autotouch`) for every mode; no couch entry.

| Level | Plan | Mode | Window | What she decides |
| --- | --- | --- | --- | --- |
| 1 | Make a little friend go up | `up`, 4 rounds | toddler | A duck or bunny sits on one tray; two bigger friends wait. She drags one to the *other* tray: any of them lifts the rider. The only miss is the same side. |
| 2 | Heavy enough? | `heavy`, 4 rounds | toddler, preschool | A bunny or pig rides; one lighter and one heavier friend wait. Which friend lifts the rider; too light or the same side is a miss and the friend walks home. |
| 3 | Make it level with blocks | `level`, 3 rounds | preschool, pre-K | A friend of weight 2–4 on one tray, `w + 2` blocks on the grass. Blocks one at a time; the count is said; one too many tips it ("Too heavy! Take one off.") and is a miss. |
| 4 | The heaviest present | `heaviest`, 3 rounds | preschool, pre-K | Three same-looking presents of weights drawn from 1–4. Testing pairs is never a miss (a present dropped on an occupied tray swaps with the one there); the wrong present in the wagon is. |
| 5 | Same weight, different pieces | `parts`, 3 rounds | pre-K | Two number weights making 4–7 sit on one tray; weights 1–4 wait. Any combination that matches counts; over is a miss. |
| 6 | Weigh a mystery box | `mystery`, 3 rounds | pre-K, school | A box of weight 2–5 and six blocks. Balance it, then tap one of three number pads; a wrong pad is a miss with the blocks counted aloud, the second wrong pad glows the right one (a hint). |
| 7 | Two identical boxes | `mystery` ×2, 3 rounds | pre-K, school | Two boxes of weight 2–3 each and seven blocks. Balance both, then say what *one* weighs: a wrong pad demonstrates the two equal groups aloud. The Woodland Picnic's *baskets* step plays this level. |
| 8 | The box alone | `same`, 3 rounds | school | Starts level: a box and `k` blocks against `m + k` blocks. Anything comes off. A tip is spoken and never a miss; two tips in a row glow the thing whose twin should come off (a hint). Box alone and level: say its weight. |
| 9 | Boxes on both sides | `same` with two boxes, 3 rounds | school | As 8 with a box on each tray: a box for a box, a block for a block. |
| 10 | Share the blocks | `share`, 3 rounds | school | Three boxes and `k` blocks against one box and `2m + k` blocks. Take the same off both sides, then share the remaining blocks between two boxes. |
| 11 | Two boxes (*defined, not built*) | `pair`, 2 pairs | school | Read the square box's weight, then take the same off both sides with the tagged box worth its number until the round box is alone. [Definition](../definitions/seesaw-two-boxes.md), on the ready list. |

Windows: toddler 1–2, preschool 2–4, pre-K 3–7, school 6–10 (6–11 once level 11 lands). Two smooth rounds step up, two struggles step down, as everywhere.

**Content pools.** Four friends by weight (`FRIEND_FOR`: duck 1, bunny 2, pig 3, bear 4; the bigger the heavier, drawn at `0.3 + 0.07 × weight` scale); unit blocks; number weights 1–4 in teal, yellow, orange and purple; presents in pink, blue, green and purple; one box drawing. Each round picks a fresh number against the last round's (`fresh()`), the fixed side is a coin flip, and the answer pads offer the answer with two near neighbours (`numberChoices`). That is the whole variety: the same four faces, one box, one plank, one meadow.

**Accounting.** `miss()` counts a miss and, on the second wrong in a round, a hint; `drawGlow()` then rings the empty tray (1–2), the heavier friend (2), the heaviest present (4) or the excess blocks (3, 5, 6, 7). On 8–10 a tip is free and the glow after two tips counts the hint. Pads glow after the second wrong number.

**Journal.** Two entries, filed only after a tray change shows them: *heavy-down* and *equal-level* (`balanceObservation`).

**Known gaps found in the audit** (for the build slices, not fixed here):

- **The card says tap; the game needs a drag.** Every loose thing is `draggable`; a plain tap only pokes a friend (`onPick`), and a drop at the same spot is off every tray, so nothing happens. The how-to's levels 1–2 line ("Tap a friend to put it on the other side") is untrue, and a toddler's first instinct does nothing.
- **A silent hint at 3, 5, 6 and 7.** The second over counts a hint, but the glow rings the excess only while it is still on the tray; once she takes it back off, nothing shows what to do next, though the hint is recorded.
- **Level 1 has no "too light."** Both offered friends are heavier than the rider, so the level's single lesson is "the other side". That is right for a toddler; the ladder below keeps it and puts comparison words at 13.
- **One face per weight.** The rider, the lifter and the offered friends are always the same four animals; replay changes only numbers and sides.
- **No lap band.** Nothing in the game needs an adult's answer, yet the one-year-old has no rung: level 1 asks for a drag across the whole plank.
- **No couch, no story beyond 7, no idle hint.** None of these is a gap the ladder needs to close; the pet's instruction repeats on the card and the glow arrives after two wrongs.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Hasee Bounce](https://pinkpt.com/neodex/index.php/Hasee_Bounce) (Neopets), the game's named reference | Two Hasees on a seesaw launch each other at fruit | Score inside a 2:25 timer; letters add time | The feel: one friend's weight sends the other up with a bounce, which level 1 keeps and the lap rung below makes the whole game | The timer, the score, the dung, the one-use cheat |
| [Learning Resources Primary Bucket Balance](https://www.staples.ca/products/1920557-en-learning-resources-primary-bucket-balance) (ages 3+) | Classroom pan balance | The maker's activity: guess the heaviest of household objects, line them up, then check on the balance | Guess, then line up, then test (levels 14 and 15 below); the pans stay level so only weight counts, as here | Nothing to leave out; it is a tool, not a game |
| [Montessori baric tablets](https://montessorialbum.com/montessori/index.php/Baric_Tablets) (3–5) | Look-alike tablets that differ only in weight | Three weights, then finer grades; the child sorts by hand, often blindfolded | Look-alikes that only the balance can tell apart (level 4 already; level 14 orders them) | Blindfolds; a screen cannot give weight in the hand, so the seesaw is the hand |
| [PhET Equality Explorer: Basics](https://www.elmirador.edu.co/contenidos/phet/en/simulation/equality-explorer-basics.html) | Balance with objects of hidden value | Find what a cat is worth if a dog is 1; the full sim moves to `x` and two variables | The one-box, two-box and two-unknown steps (levels 6–11 already) and "find the most unbalanced setup" as a free play prompt | The symbolic screens; the grade 6–12 pitch |
| [PhET Balancing Act](https://clixplatform.tiss.edu/phet/en/simulation/balancing-act.html) | Teeter-totter with distance | Masses at set distances, then predict where a heavier brick balances; a game mode with levels | Prediction before release (level 17 below) | Distance from the fulcrum: it is a different model from this game's level trays (decision 4) |
| [DragonBox Algebra 5+](https://dragonbox.com/) | Isolate the box | Every operation on both sides; pictures become symbols over many chapters | Already the shape of 8–11 | Chapters as unlock gates; the symbol switch |
| [SolveMe Mobiles](https://apps.apple.com/app/id977720372) | Hanging mobiles | A weight found on one beam is carried into the next | Level 11's carried tag; a "which beam first" reasoning that level 16 touches | Hundreds of puzzles behind a login; score |
| Guess the Weight of the Marrow (Neopets), the notebook's [Guess the Pumpkin](../IDEAS.md#new-ideas-from-the-gap-review) row | Fairground guessing | One guess a day, a prize for the closest | An unscored guess before the weighing (level 15) | The daily limit and the prize |
| Siegler's balance-scale task ([Filion & Sirois 2021](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2021.702524/full); [Schapiro & McClelland 2009](https://stanford.edu/%7Ejlmcc/papers/SchapiroMcC09BalScale.pdf)) | Developmental study | Children under about eight use a weight-only rule (Rule I); distance comes later | The game's model is exactly Rule I made honest: weight only, trays level. Prediction problems (balance, weight) are what level 17 asks | Conflict problems: distance never varies here |

**Learning references.** [CCSS K.MD.A.2](https://tasks.illustrativemathematics.org/content-standards/K/MD/A/2) (directly compare two objects with a measurable attribute and describe the difference: *heavier*, *lighter*, levels 2 and 13); kindergarten measurement vocabulary and seriation (ordering three by weight, level 14); non-standard units and estimation (levels 3, 6 and 15); additive comparison, "how many more" (1.OA, level 16); equality as a balance and solving by equal moves (levels 8–11, 6.EE in symbols, here with trays). The weight-only rule children hold before eight ([Siegler, summarized](https://pmc.ncbi.nlm.nih.gov/articles/PMC8419348)) is why the game keeps distance out.

References were read from store pages, teacher guides, wiki pages and search summaries on 2026-10-19; none played.

## What makes sense here

Seesaw Balance's identity is the tray that tips and the pet saying what the tip means. Every proposal keeps that: a friend goes up, a tray goes down, or the plank lies flat, and she decides what to put on or take off. The ladder below adds the rungs the audit missed: a lap rung where the seesaw simply bounces at her touch; the comparison words (heavier, lighter) that today's levels show but never ask; ordering three look-alikes, the step after finding the heaviest; an estimate before a measurement; a difference read off the blocks that level the trays; and a prediction before a release, which is the balance-scale task every developmental study uses. Level 11 stays the top of the algebra line.

The references' progression devices stay out: timers and scores (Hasee Bounce), chapters that unlock (DragonBox), logins and puzzle counts (SolveMe). Lever distance stays out of this game (decision 4): it changes the stated model, and a child under eight reads weight only, so a distance level would be a trick rather than a lesson. Mobile Maker and Fairground Lift from the notebook are other pictures of the same action and do not earn a level here.

## Experience and presentation

- **First unsupported action.** Today it is a drag of a bigger friend across the plank, and a toddler's tap does nothing. Slice 1 makes a tap hop the friend to the empty tray, and level 12 makes any touch on the empty end bring a friend bouncing in, so a one-year-old's first touch sends a duck up with a "Wheee!"
- **Acknowledgment and consequence.** Pick-up ticks and pokes the friend; the drop clunks and the plank leans at once, more for a bigger difference; the pet says what happened (level, tipped, too heavy, wheee). A wrong friend walks home on its own, so the seesaw never looks like it swallowed a mistake. On 8–11 a tip is spoken and free, so the seesaw explains without scolding.
- **A concrete art and sound example.** *Who is heavier?* needs no new art: two `Critter`s from `CRITTERS` at `friendScale(weight)`, the plank tipped by `tilt()`, and the asked word underlined by sound: a two-note seesaw from `src/audio/notes.ts`, low then high for "heavier", high then low for "lighter", the same note twice when level. *Guess the pumpkin* draws a pumpkin with `Graphics` ellipses and a curved stem in the palette's orange at the box's footprint, so the tray stacking code is unchanged.
- **Variety on replay.** Seeded faces per weight (duck or cat at 1, bunny or dog at 2, pig or cow at 3, bear at 4), present wrappings, box looks, which side is fixed, the numbers; never a smaller tray or a faster plank.
- **Reasoning versus precision.** The drag is the only motor part and it is generous (a tray hit area 330 wide and 360 tall). The new levels keep it: 13 and 17 are taps, 14 drags the same presents, 15 and 16 add blocks as 3 does. No level asks for a precise drop or a quick one.
- **Supported ending and replay.** A glow after two wrongs on every level, a glow after two tips on 8–11, pads that glow after the second wrong number; again replays the level with new numbers, next plays the one above. A round never ends in anything but a sticker.
- **Roles.** Solo stays the default. At 15 a grown-up or sibling can make the guess while she measures (the guess is unscored, so a shared guess costs nothing); at 17 two people can each tap a side before the release.
- **Person or device checks.** Whether a one-year-old's touch lands on the empty tray or on the friend; whether "heavier" and "lighter" are understood from the pet's voice alone (the words are spoken, never read); whether a three-year-old reads the tip as "that one is heavier" or as "that one moved"; whether the pumpkin's guess feels like a game or a quiz; whether the release at 17 reads as her prediction being tested rather than the seesaw ignoring her tap.

## Proposed ladder

### Fresh content inside existing levels

- **Two faces per weight** (logic): `FRIEND_FOR` becomes a pool per weight (1 duck or cat, 2 bunny or dog, 3 pig or cow, 4 bear), drawn per round from the seeded RNG with the rider and the lifters never sharing a face; `{animal}` in the voice lines already takes any name. Size still says weight: faces at the same weight draw at the same scale. A rule test asserts that every round's friends have distinct faces and that scale is a function of weight alone.
- **Wrapping and boxes** (art): presents at 4 and 14 get a seeded wrapping (plain, dots, stripes) over their color; the mystery box at 6–7 is a parcel or a crate (same footprint), leaving the hatbox to level 11's round box.
- **More words** (voice): a second variant for `seesaw.tipped`'s family at 3 ("Down it goes! One too many.") and a third for `seesaw.balanced`.
- **Support truth** (the audit's gaps): a tap on a loose friend at 1–2 hops it to the empty tray (a tap on the rider's side still says "the same side" and counts as today); after two overs on 3, 5, 6 and 7 the glow rings the block on the grass to add next when the tray is under, so a recorded hint always shows something; the how-to's levels 1–2 line reads "Tap or drag a friend onto the other side"; `numberChoices` never offers a number that the visible blocks could not make (it already stays at or above 1).

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 12 | *Wheee!* | lap (`order [12]`), toddler (`order [12, 1, 2]`); `entryLevels` gains 12 | A duck sits on one tray. Any touch on the empty tray, or anywhere on that half of the plank, brings the next friend (always bigger) hopping on; the plank tips, the duck rises with a giggle and "Wheee!"; after a breath both hop off and a new little friend sits. Four wheees finish. | Only when to touch. | None; a touch on the rider's half pokes the rider and repeats the instruction, free. Finishes by itself after four, so a round is always complete. | `makeRounds` for `bounce` gives four rounds with a lifter strictly heavier than the rider; `seesawTouch` returns one touch on the empty tray per round; no round can miss. | A new `bounce` mode, one instruction and one cheer line, `bands` gains `lap`; the bot is one tap; a portrait check that the empty tray's touch rectangle is at least 100 units on a phone-sized logical view. |
| 13 | *Who is heavier?* | preschool (`order [2, 13, 3, 4]`); `entryLevels` gains 13 | Two friends of different weights already sit on the trays, tipped. "Who is heavier? Tap the heavy one." From the second round the question alternates with "Who is lighter?" | Which friend the word names, read off the tilt. | The other friend is a miss: "That one went *up*, so it is lighter. The heavy one went *down*." The second miss glows the asked friend and counts a hint; the right tap cheers and the two-note seesaw plays. | Every round's two friends differ in weight; the asked friend is unique; a 3-round plan asks "heavier" first and both words by the end; `seesawTouch` taps the asked friend. | Tap-only (`onTap` on body-centred hit circles); two instruction lines and two hint lines; faces from the pool. |
| 14 | *Line them up* | pre-K (`order [3, 4, 14, 5, 6, 7]`) | Three look-alike presents and three shelf spots marked light, middle and heavy by a small, medium and big block picture. Test pairs on the seesaw as at 4 (never a miss), then drag each present to its spot. | The order of three weights from pair tests. | A present on the wrong spot boings and slides back: "That one is heavier than the one in the middle. Try them on the seesaw." Two misses glow the right spot for the present in hand. | Weights are distinct; the order is unique; at most three pair tests sort three presents and the bot does exactly that (sort by comparison, no peeking at weights beyond a tray result); the shelf accepts the lightest first or the heaviest first. | A `sort` mode reusing `heaviest`'s swap-on-tray and the wagon code as three spots; the bot extends the tournament; the shelf art is three plinths. |
| 15 | *Guess the pumpkin* | pre-K (`order [3, 4, 14, 5, 6, 7, 15]`), school (`order [6, 7, 15, 8, 9, 10, 11]`) | A pumpkin on one tray, blocks on the grass. Before anything moves, three pads ask "How many blocks heavy? Guess!" The guess is spoken back and written on a sign, never scored. Then blocks until level, then the real number on the pads; the pet compares aloud: "You guessed 3. It weighs 4. Close!" | The guess, then the measurement. | The guess is never a miss. Over while measuring and a wrong final pad count as at 6. The final pads never glow the guess. | The pumpkin weighs 2–6; the guess pads hold the answer and two neighbours at least 1; six blocks suffice; the spoken comparison names the guess, the answer and "close" (within 1), "just right" or "a bit more / less"; the bot guesses (any pad), measures, then answers. | A `guess` mode with a `prediction` field on the round; pumpkin, watermelon and cabbage drawings at the box footprint; four voice lines. Rounds stay 3. |
| 16 | *How much heavier?* | school (`order [6, 7, 15, 16, 8, 9, 10, 11]`) | Two tagged number weights (say 5 and 3) sit on the trays, tipped. "The 5 is heavier. How much heavier? Add blocks to the light side until it is level." Then the pads: "How many blocks did it take?" | Which side needs blocks (the up side), then the difference. | A block on the heavy side says "That side is already down" and comes back, free. One block too many is a miss as at 3. A wrong difference is a miss with the added blocks counted; the second glows the pad. | Weights 2–6 differ by 1–4; the difference equals the blocks that level it; the light side is the up side; the bot adds exactly `difference` blocks then answers. | A `difference` mode reusing `level`'s weigh/excess code with a fixed total of both trays; number weights drawn as at 5 with any 1–6 value. |
| 17 | *Which way will it tip?* | school (`order [6, 7, 15, 16, 17, 8, 9, 10, 11]`) | The seesaw is held level by a prop with tagged weights on both trays (say 4 + 2 against 5). "Which side will go down? Or will it stay level? Tap." Three targets: each tray and the middle. The prop releases and the plank shows the answer with the sums spoken. | A prediction from adding two small numbers and comparing. | Never a miss (an unscored prediction, as in Sink or Float and Block Tower 5): a wrong tap is explained by the release ("4 and 2 make 6. 6 is more than 5, so this side went down."). Three predictions per round, at least one level case over a round; the third Continue finishes. | Over 300 seeds each round has three cases drawing from down-left, down-right and level with at least one level per round; sums stay at most 8; the explanation names the sums; the bot taps the true answer. | A `predict` mode with a prop drawing, the release animation (the existing tween to `tilt()`), three tap targets, and a Continue button; four voice lines. No journal entry (decision 5). |

### Younger-band openings

Level 12 opens the lap band: `bands` gains `lap` with `{ min: 12, max: 12, order: [12] }`, toddler becomes `{ min: 1, max: 12, order: [12, 1, 2] }`, and `entryLevels: [12, 13]` so a birthday or pin carries neither high ID into a band as "the hardest". A lap child's save at 12 landing in preschool (which does not list it) starts at preschool's easiest, 2.

### Easier entries and levels between existing ones

The appended IDs 13–17 are placed by each band's `order` above: 13 before preschool's 3, 14 between pre-K's 4 and 5, 15 after pre-K's 7 and after school's 7, 16 and 17 between school's 15 and 8. Levels 1–11 keep their IDs, windows and plans; nothing is renumbered, and the school orders are written with 11 in place (drop it from the array until the level 11 slice lands). A pre-K save at 14 carried into school by a birthday lands on 15 (the nearest listed ID), an early school rung, which is the intended landing; it needs no `entryLevels` entry.

### Left out on purpose

- **Lever distance** ([PhET Balancing Act](https://clixplatform.tiss.edu/phet/en/simulation/balancing-act.html); the notebook's 8–10 row and *Mobile Maker*): a different stated model, and a trick to a child who holds the weight-only rule. A separate game at school or grown-up, if ever (decision 4).
- **Fairground Lift**: a pulley picture of level 3; the action already exists.
- **Blindfold weighing** (baric tablets): a screen has no weight in the hand.
- **A couch entry**: the game is a drag-and-tip toy with nothing to race; a controller would move a cursor over trays for no gain.
- **A journal entry for the prediction level** ("adding tells you before the seesaw does"): a candidate for a later session, not here (decision 5).

## Decisions for the developer

Each has a default below; the build proceeds on it.

1. **A lap band with level 12.** Default: `bands` gains `lap` with `order [12]`, and toddler gets `order [12, 1, 2]`. Alternative: no lap band; 12 is a toddler entry only.
2. **"Too heavy" at level 3.** Default: unchanged, one block too many is a miss, since the glow then rings the excess and the pet says what to do. Alternative: the first over in a round is a free observation and the second counts, as tips are free on 8–11.
3. **The unit at 15.** Default: the game's blocks, so the measurement matches 6. Alternative: apples, which the notebook's row names and the pet would count as "apples".
4. **Lever distance.** Default: never in this game; a separate school or grown-up game if the physics plan wants it. Alternative: a level 18 with notched trays, which would need the model statement, the how-to note and the journal lines rewritten.
5. **A prediction journal entry.** Default: none at 17. Alternative: file "adding told me before the seesaw did" once a round has shown a right prediction, as the two observations file today.

## Build slices, in order

1. **Support truth** (existing-game bug fix tier: typecheck, `logic.test.ts`, one filtered play of levels 1 and 6, `fingerdemo` at 1): a tap on a loose friend hops it to the empty tray at 1–2; the glow after two overs rings the next block on the grass when the tray is under; the how-to's levels 1–2 line says tap or drag; the new voice variants. IDs and windows unchanged.
2. **Two faces per weight, wrappings and boxes** (logic tier, plus one filtered play of 2 and 4): the friend pool per weight with its distinct-faces test, seeded present wrappings, parcel and crate boxes at 6–7.
3. **Level 12 *Wheee!* with the lap band** (new interaction tier: typecheck, units, one scripted play at lap and toddler, one portrait screenshot, `fingerdemo` at 12): the `bounce` mode, `bands` gains `lap`, lap `order [12]`, toddler `order [12, 1, 2]`, `entryLevels: [12]`.
4. **Level 13 *Who is heavier?*** (new interaction tier, taps on friends: typecheck, rule tests, one play of 13 with one wrong tap and one hint, `fingerdemo` at 13): preschool `order [2, 13, 3, 4]`, `entryLevels: [12, 13]`.
5. **Level 14 *Line them up*** (new levels on an existing interaction: typecheck, rule tests, one play of 14, `fingerdemo` at 14): pre-K `order [3, 4, 14, 5, 6, 7]`.
6. **Level 15 *Guess the pumpkin*** (new levels tier, plus a portrait screenshot for the guess sign): pre-K `order [3, 4, 14, 5, 6, 7, 15]`, school `order [6, 7, 15, 8, 9, 10, 11]` (without 11 until it lands).
7. **Level 16 *How much heavier?*** (new levels tier): school `order [6, 7, 15, 16, 8, 9, 10, 11]`.
8. **Level 17 *Which way will it tip?*** (new interaction tier: typecheck, rule tests over 300 seeds, one play of 17 with a wrong prediction, one portrait screenshot, `fingerdemo` at 17): school `order [6, 7, 15, 16, 17, 8, 9, 10, 11]`.

Level 11 *Two boxes* keeps its own ready line from its [definition](../definitions/seesaw-two-boxes.md) and can be built before or after any slice here. Each slice that touches `voice-script.ts` or `howto.ts` runs `npm run build`. Gated: nothing; every decision above has a default.

## What was built in this session

Nothing: a deep dive session is research and ideation only. Ran `node scripts/check-links.mjs` and `git diff --check`.
