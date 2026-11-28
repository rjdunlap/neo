# Frog Hop, four entries and G1 *Hops of a hundred* (definition)

*Game `frog-hop` · levels 16–20 · lap, toddler, pre-K and grown-up · defined 2026-11-28 on `claude/nightly-define-frog-hop-entries` · [deep dive](../deep-dives/frog-hop.md#build-slices-in-order) slice 9 (the four entries in its [younger-band table](../deep-dives/frog-hop.md#levels-below-level-1-waiting-on-the-level-order-decisions)) and slice 11's next step, G1 of its grown-up window. Docs only; each build is a line in [READY](../READY.md), one per session, in ID order.*

The five slices share one page because they share one numbering and one band audit. Each section below is a complete build: a session reads the shared sections and its own.

## Numbering, bands and play order (shared)

Level 15 *Where does it go?* is the top of `PLANS` on `origin/main`, so the next free IDs are 16 to 20. Each entry takes its ID in build order, appended to `PLANS`; nothing is renumbered ([2026-10-23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules)). If another level takes an ID first, every later slice takes the next free ID and this page's numbers are read as names.

| ID | Mode | Name (the plan's `name`) | Bands | Placed |
| --- | --- | --- | --- | --- |
| 16 | `along` | Hop along: tap the pond and the frog hops pad by pad, 1 to 5, saying each number | lap, toddler | below level 1 |
| 17 | `dots` | Hop to the dots: the sign shows dots, she taps the pad with that many, 1 to 5 | toddler | after 16, below level 1 |
| 18 | `missing` | Which pad lost its number?: a leaf hides one numeral on a short run; choose its number card | pre-K | between 2 and 3 |
| 19 | `further` | Who is further along?: two frogs on the line; tap the one that has hopped further | pre-K | after 18, between 2 and 3 |
| 20 | `hundreds` | Hops of a hundred: a line of hundreds to 1000; start at a number and hop 1 to 4 hundreds on or back | grown-up | after the school ladder's top levels |

The `LEVELS` table after all five (each slice adds only its own row change; the intermediate tables follow from it):

```ts
export const LEVELS: BandLevels = {
  lap: { min: 16, max: 16 },
  toddler: { min: 16, max: 17 },
  preschool: { min: 1, max: 2 },
  prek: { min: 1, max: 19, order: [1, 2, 18, 19, 3, 4] },
  school: { min: 3, max: 15 },
  grownup: { min: 13, max: 20, order: [13, 14, 15, 20] },
};
```

- **`school.max` stops following `PLANS.length`** in slice 16: it becomes the literal 15, because 16 to 19 are younger and 20 is the grown-ups'. The rule test that the school ceiling follows the plans becomes "every plan is in at least one band, and `school` holds 3–15".
- **`entryLevels: [16, 17, 18, 19]`** on the module from slice 16 on (each slice adds its own ID). A saved level or pin of 18 carried into school by a birthday lands on school's easiest level, not "above the top" ([`landing`](../../src/progress/difficulty.ts)). Level 20 is not an entry: it is hard.
- **`bands`** becomes `['lap', 'toddler', 'preschool', 'prek', 'school']` in slice 16 and gains `'grownup'` in slice 20. Adding `lap` and `toddler` puts Frog Hop in Counting Cove for those ages and on their home spots: the build updates the README and roadmap band counts, runs `lands.test.ts` (every land fits one screen at every band; a full land pages rather than shrinks), and adds "Frog Hop's place in Counting Cove at lap and toddler" to the person checks. A grown-up today plays Frog Hop in the school band (`playBand` takes the highest band below); with slice 20 they play 13, 14, 15 and then 20, so their ladder does not open on level 3 and does not collapse to one level.
- **Couch:** unchanged. `COUCH_INFO['frog-hop'].level` keeps its stops; none of 16 to 20 is a couch stop.
- **`describeLevel`** reads each plan's name. The how-to gets one `LevelLine` per new ID (`{ from: 16, to: 16 }` and so on; level 15's open entry is bounded first). The woods `hop` loop's level list and `fingerdemo`'s levels add each ID as it lands.

## Voice (shared)

Every new line goes under the game's `hop.` prefix, which is not a rendered prefix in `scripts/voice-clips/clips.mjs`, so no clip must be rendered in a cloud session. Numbers ride a `{n}` slot as on the other levels. Lines are listed in each section.

## 16 *Hop along* (lap and toddler)

*Built 2026-11-28 on `claude/frog-hop-hop-along` ([PR #2364](https://github.com/rjdunlap/neo/pull/2364)); see the [game page](../games/frog-hop.md) for what was built and the one departure (no pause-sheet hint).*

**Fun action and purpose.** Five big lily pads in a row, numbered 1 to 5 with dots under each numeral (the existing `dotLayout`). The frog sits on a bank left of pad 1. She taps anywhere on the pond and the frog hops to the pad nearest her tap, pad by pad, saying each number it lands on and playing a rising note on each. Cause and effect, and the cue Siegler's line game teaches: further along is a bigger number, a higher note and more number names. There is no goal and nothing is wrong.

**A round.** Six taps. Each tap hops the frog from where it is to the nearest pad (forward or back, one pad per hop, each said: "2… 3… 4"). A tap on the pad the frog is on is a croak and a splash, and counts as a tap. A tap on the bank sends the frog home ("Home!"). After the sixth tap's hops end, the frog does a big splash and the round finishes with `{ misses: 0, hints: 0 }` (a creative-play finish: one sticker, always happy). Taps during a hop are ignored, not queued, with the touch-down ripple still shown.

**Screen.** Pads at a 150-unit pitch, hit areas at least 120 units square (the lap and toddler floor is the 100 of every band; these are bigger on purpose), the whole pond below the sign line is one tap target resolved to the nearest pad. Upright phones: the five pads in one row across the width if it fits at 150, otherwise two rows (1–3, 4–5) as `hopLayout` folds the longer lines. No sign, no cards, no hint button use (the pause sheet's hint does nothing new: it shows the ghost finger tapping pad 5).

**Sound.** Each landing plays `sfx.pop(5 + k)` for pad `k`, which already rises in pentatonic steps (`src/audio/notes.ts`); the bank plays the lowest. Music as the game's.

**Rules (`logic.ts`).** `alongPads(view)` (five positions), `nearestPad(point, pads)` (unique: ties go to the lower pad), `alongRoute(from, to)` (the pads crossed, in order, ending on `to`), `ALONG_TAPS = 6`.

**Voice.** The instruction `hop.along` is "Tap the pond, and the frog hops! Up to {n}." with `n` 5 (an invitation, since a lap child follows no instruction). Landings speak the numeral through the same counted-hop path as level 3. `hop.along.home` "Home! Ribbit, {n}!" with `n` the hops taken. `hop.along.done` "{n} big hops! Splash!" with `n` 6.

**Bot.** The ghost finger taps pads 1, 3, 5, 2, 4, 5. `autotouch` returns the nearest-pad point of the next in that list.

**Rule tests.** `nearestPad` is unique for every point in the pond at four views; every pad's hit area is at least 120 and on screen; `alongRoute` says exactly the pads between, in order, never the start; the notes for pads 1 to 5 strictly rise; the sixth tap ends the round and only the sixth.

**Tier.** Younger-band opening: typecheck, rule tests, registry and `lands.test.ts`, one filtered browser play at 16 (six taps, one on the bank) with a phone portrait screenshot, `fingerdemo` at 16.

## 17 *Hop to the dots* (toddler)

*In progress 2026-11-28 on `claude/frog-hop-hop-to-the-dots`.*

**Fun action and purpose.** Level 1 with dots for a child who cannot read numerals yet. The sign shows dots only (no numeral), in the five-frame grouping of `dotLayout`, and the voice says "Hop to three!" She taps the pad with that many dots; each pad shows its dots and its numeral, so the numeral sits beside the quantity. Give-N shaped: match a small quantity to its place on the line.

**A round.** Five questions. Questions 1 and 2 use pads 1 to 3 only; 3 to 5 use pads 1 to 5. The frog starts on the bank each question. A right pad: the frog hops there pad by pad, saying each number, then `hop.landed`. The asked number is 1 to 5 (1 to 3 on the short line), never the same as the previous question's.

**Mistakes.** A wrong pad: the frog hops there (the counted hops still say the numbers), says the number it is on and which way to go ("That is 4. Three is back this way!", `hop.wrong.dots-back` / `hop.wrong.dots-forward`), and returns to the bank. Two misses glow the right pad (one hint, as level 1 counts it). The third tap is always a supported finish of the question, as level 1.

**Screen.** As 16: 150 pitch, 120 hit areas, frog on the bank, the sign at the top with dots at least 36 units across. Three pads are centred on the first two questions, five after.

**Rules.** `dotsQuestions(plan, rng)`: five targets as above, no repeats twice running, at least one 4 or 5 on the long line. Miss direction from `target > tapped`. `answerSlot` returns the target pad (so the existing glow and `autotouch` path work).

**Voice.** `hop.dots` "Hop to {n}! Find the pad with {n} dots." (the instruction the pet repeats), `hop.wrong.dots-forward` "That is {m}. {n} is further along!", `hop.wrong.dots-back` "That is {m}. {n} is back this way!".

**Rule tests.** Targets in range by question, no repeat twice running, the sign's dot count equals the target, the glow is the target pad, every pad on screen and at least 120 at four views.

**Tier.** New levels on an existing interaction: typecheck, rule tests, `lands.test.ts`, one browser play at 17 (one wrong pad, the glow), `fingerdemo` at 17.

## 18 *Which pad lost its number?* (pre-K)

**Fun action and purpose.** A short run of pads (4 to 6 of them, such as 2, 3, ?, 5) with one numeral hidden under a leaf. Three number cards wait below. "Which number is hiding?" She taps a card; the leaf blows off and the numeral is there. The missing number between two known ones (K.CC.A.2), read off the line; absorbs the "place the missing frog" idea from Teaching Number Lines.

**A round.** Five questions. The run starts at 0 to 4 and ends at most 9; the hidden pad is interior (never the first or last), never the same run twice running, and the hidden numbers are distinct across the round. The frog sits on the run's first pad and, after a right card, hops along the run saying every number, the uncovered one included.

**Cards.** Three cards: the answer, one neighbour on the run (one more or one less than the answer, whichever is shown, so the slip "the number next to it" is a real choice) and one other number 0 to 9 not on the run's ends. Order shuffled with `ctx.rng`. Cards use the existing `CARD_HIT` (112 by 116) and the card row of levels 5 and 11.

**Mistakes.** A wrong card shakes and the pet says "That is {m}. Look at the pads on each side." (`hop.wrong.missing`). Two misses lift the leaf's corner so the numeral peeks out and the right card glows (one hint). A card tap on the shown neighbour adds "{m} is already here!".

**Rules.** `missingQuestions(plan, rng)` returning `start`, run length, hidden index and the three cards; `HopQuestion` gains `run?: number` and `cards?: number[]`. `answerSlot` returns the hidden pad (its glow is the card's, through the existing card glow path).

**Voice.** `hop.missing` "Which number is hiding under the leaf? It comes after {n}." (`n` the pad before the leaf), `hop.wrong.missing`, `hop.missing.here` "{m} is already here!", the closing hop-along says the numbers through the counted path.

**Rule tests.** The hidden pad is interior; run length 4–6 within 0–9; the three cards are distinct and include the answer and a neighbour; no run repeats twice running; hidden numbers distinct per round; layout at four views (run, leaf, cards on screen, apart, clear of the guide corner, targets at least 100).

**Tier.** New interaction: typecheck, rule tests, one filtered play at 18 (one wrong card, the hint), one portrait screenshot, `fingerdemo` at 18.

## 19 *Who is further along?* (pre-K)

**Fun action and purpose.** Two frogs sit on the 0–8 line, one on 3 and one on 7. "Who has hopped further?" She taps a frog. Which numeral is larger, read from its place on the line (K.CC.C.7), with a story: both frogs started at 0. Different from Duck Pond's *Which pond has more?*, which compares sets, not places.

**A round.** Five questions. The two frogs sit on different pads 1 to 8, 1 to 6 apart; the first question is authored, 3 and 7; at least one question per round has them one apart. Which frog (left or right of the screen is fixed by the line, so it is the further one by position) sits where is seeded; the answer is never a frog on the same pad two questions running. The second frog is the same frog art in a second colour from the palette, with its own crayon outline (`docs/ART-STYLE.md`), and Duck Pond's shared frog art fits if it reads better. A right tap: both frogs replay their hops from 0, side by side, each saying its count, and the further one croaks (`hop.further.yay` "{n} is further along than {m}!").

**Mistakes.** A wrong frog: "{m} is back here." (`hop.wrong.further`) and the tapped frog slides back to 0 and hops to its pad again, counting, so the shorter trip is seen. Two misses glow the right frog (one hint).

**Screen.** Each frog's hit area is its pad's column (`PAD_HIT`, 104 by 140 at least, grown to 120 tall over the frog) so a tap on either frog or its pad answers; other pads are inert with the existing free nudge. The sign shows two frog faces, no numbers.

**Rules.** `furtherQuestions(plan, rng)`: `start` and `target` reused as the two pads (`target` the further), differences 1–6, the first 3 and 7, one 1-apart question per round. `answerSlot` returns `target`.

**Voice.** `hop.further` "Both frogs hopped from 0. Who has hopped further?", `hop.wrong.further` "{m} is back here. Watch!", `hop.further.yay`.

**Rule tests.** The two pads differ by 1–6 and are on the line; the answer is the larger; the first question is 3 and 7; one 1-apart question per round; the two hit areas never overlap and each is at least 100 at four views.

**Tier.** New levels on an existing interaction: typecheck, rule tests, one browser play at 19 (one wrong frog, the glow), `fingerdemo` at 19.

## 20 G1 *Hops of a hundred* (grown-up)

**Fun action and purpose.** Level 13 a place value up. The pads read 0, 100, 200 … 1000 and slide to keep the start and the landing in view (11 pads, the existing 9-pad window, as level 13 slides to 100). The sign shows `340 + 300`: the frog stands **between** pads at 340 (a small marker on the line under it, written "340"), and she taps where it lands. Where ten and a hundred more or less land (2.NBT.B.8, 2.NBT.A.2), for a grown-up who wants something quick and real to do alongside her.

**Questions.** Five a round. The first is authored, 340 + 300 = 640. The others are seeded: a start that is a multiple of ten 110 to 790 and not a multiple of a hundred, 1 to 4 hundreds on or back (two of five go back, the first goes on), landing 10 to 990, never the same landing twice running. One question per round has a start that is a multiple of a hundred so 1000 can be a landing and the line shows 1000 at least once. Because the frog is off the pads, the answer is not a pad: the pads get **offset markers** for the round's question, so under each pad a small label reads the landing candidate (for 340: 40, 140, 240 … 940 under the pads 0 … 900) and the frog stands on the 340 marker. A tap on a pad's column answers with its marker's value. `HopQuestion` gains `offset?: number` (the start's tens and ones), and `padValue(plan, n, q)` becomes `n * stride + (q.offset ?? 0)`; existing callers pass no `q`, so every other level is unchanged.

**Mistakes.** As level 13: wrong side ("The frog hops on, to bigger numbers"), off by one hundred ("Count the hundreds: three hops"). Two misses demonstrate (the frog hops each hundred, saying "four hundred forty, five hundred forty, six hundred forty") and glow. One hint per question.

**Screen.** The `grownup` band allows 64-unit targets on a board that cannot fit, but this line fits at the normal pitch, so pads keep `PAD_HIT`. Labels to 4 characters ("1000", "940") must fit their pad at 1024×768, 768×1024, 390×844 and 844×390; the offset markers sit under the pads at a smaller size and never overlap the pad numerals.

**Voice.** `hop.hundreds` "Start at {n}. Hop {k} hundreds. Where will the frog land?", `hop.hundreds.back` "Start at {n}. Hop back {k} hundreds. Where will the frog land?", `hop.hundreds.one` / `hop.hundreds.oneback` for one hundred, as level 13's lines. Numbers are said by device speech ("three hundred forty"); that is an unchecked device item, parked with the tens words.

**Plan.** `{ mode: 'hundreds', top: 10, stride: 100, questions: 5, name: … }`. `saysNumbers` includes `hundreds`. Flowers on 500 and 1000. No couch stop.

**Rule tests.** The first question is 340 + 300; starts in range, multiples of ten, and all but one not a multiple of a hundred; landings 10–1000; two of five go back and the first goes on; no landing twice running; 1000 shown once per round; `padValue` with no question is unchanged for every existing plan; labels fit at four views.

**Tier.** New levels on an existing interaction, plus the `grownup` band audit: typecheck, rule tests, the registry test for bands, one browser play at 20 in a grown-up profile (one wrong pad, the hint) with a phone portrait screenshot, `fingerdemo` at 20.

## What is not here

Halves on the line (G2), below zero (G3), the 0–1000 estimate (G4) and the couch duel (G5) stay in the dive's grown-up window; define them after G1 lands. Hops of 2 and 5 and the vertical line stay sketches.

## Open decisions and defaults

1. **Hop along's tap count.** Default six taps a round, as the dive. A person check on the phone may shorten it; never a blocker.
2. **G1's offset markers.** Default: the markers under the pads, so any start can be answered on a pad. Alternative: starts only on hundreds (pads alone), which is level 13 times ten and teaches less. Default stands.
3. **The second frog's colour.** Default: a second palette colour on the same frog with its crayon outline; the build picks the colour against the four scenes.
