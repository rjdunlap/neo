# Paint Mixer, levels 5–6 (definition)

Defined 2026-11-02 as the definition half of slice 4 of the [ratio and proportion study](../deep-dives/subjects/ratio-proportion.md#build-slices-in-order) ([packet row RP2](../deep-dives/subjects/RECOMMENDATIONS.md#ratio-and-proportion-recommendations)), [PR #1117](https://github.com/rjdunlap/neo/pull/1117). Levels 1–4 are built ([definition](paint-mixer.md), PRs #1026 and #1107) and this packet appends to the same game, the same `school` window and the same pots, rows, table, Check and glow; read that definition first, since everything not restated here is unchanged. Decisions 1–7 of the study were taken 2026-10-23 on the developer's delegation; decision 7 (a mixed colour joins the pet's palette as a permanent unlock) is specified below as its own later batch so the levels do not wait on it.

**Fun action and purpose.** Level 5: the sample jar holds **three** pots' drops (1 red, 2 yellow, 1 white: a peach), and the bucket's line is two or three batches deep; she keeps three counts in step while the table fills a column per complete batch. Level 6: **which jars match?** Four lidded jars stand on a shelf, each labelled with its counts (4 : 6, 3 : 5, 6 : 9, 4 : 5); she taps every jar that is the sample's colour, using the labels and the sample's table, then Check; lifting a lid is help. Learning goal: level 5, *the same multiplier on every pot, even three* (6.RP.A.1, 6.RP.A.3.a's table extended to a third quantity); level 6, *equivalent ratios found from the numbers alone* (6.RP.A.3.a, "use tables to compare ratios"). The first mixed colours are filed on a **paint shelf** in the discovery journal.

## The colour rule at three pots and between labels, measured

Measured at definition time with the built `mix()` and `distance()` (`src/games/paint-mixer/logic.ts`: the palette's pots, the drop-weighted mean in linear RGB, Oklab distance ×100, where about 1–2 is a just-noticeable step side by side).

**Which triples.** Only two sets of three pots avoid blue + yellow (which averages to grey and is never authored): **red + yellow + white** and **red + blue + white**. Those are the only triples; a test proves no triple holds blue and yellow together. Red + yellow + white contains the yellow + white (cream) pair that levels 1–4 withhold; inside a triple that sub-pair is never judged on its own (the red drops are always there), so the withholding does not apply, and the triple's own steps are measured below.

| Recipe (pots in order) | Colour | Name | 1:2:1 against one more of each (2:3:2) | against one pot doubled (2:2:1, 1:2:2) | against 1:1:1 |
| --- | --- | --- | --- | --- | --- |
| red, yellow, white 1:2:1 | `#fccc97` | peach | 1.1 | 3.9, 3.7 | 2.5 |
| red, yellow, white 2:1:1 | `#f9b599` | coral | — | — | — |
| red, yellow, white 1:1:2 | `#fcd8c3` | blush | — | — | — |
| red, blue, white 1:2:1 | `#bdb4df` | lavender | 1.6 | 3.9, 5.3 | 3.9 |
| red, blue, white 2:1:1 | `#dca7c1` | rose | — | — | — |
| red, blue, white 1:1:2 | `#dfcde2` | lilac | — | — | — |

Within each triple the three recipes are 5.3–9.5 apart (peach set 6.0, 5.3, 8.7; lavender set 6.0, 8.5, 9.5), so the six shelf colours are honestly different swatches. One more of each is again a careful-look step (1.1–1.6) and one more of a single pot (1:3:1 against 1:2:1) is 1.6 for peach and 2.5 for lavender, so, as at levels 1–4, **the drop rows and the table judge; the colour is the feel and the exact-swatch reward.** Leaving the third pot out (1:2:0) is 7.4 and 10.9 away: forgetting the white is a glance.

**Between level 6's labels.** The jars' labels are two-pot ratios of the authored pairs, and the near ones are invisible as colour: against 2 : 3, a 3 : 5 jar is 0.7–0.8 away, 3 : 4 0.8–1.0, 4 : 5 1.3–1.5 (all four pairs); only the reversed 3 : 2 is plainly different (5.8–7.3). **So an opened lid cannot be a colour reveal**: a child who lifts the 3 : 5 lid would see "the same colour", choose it and be told it is wrong, a hint that leads nowhere. This is the packet's one deviation from the study's level 6 (which made the lid show the colour): **an opened lid shows the jar's counts placed against the sample's ratio table**, with the colour beside it as the feel. That is also exactly 6.RP.A.3.a's tool. The table, not the drop rows, carries it because a 6 : 9 jar is 15 drops and does not fit the bucket's 12-place picture, while 6 : 9 is the third column of 2 : 3's table.

## The model (`logic.ts`)

### Level 5: an n-pot sample

The built `Sample` is a pair with two counts (`pair`, `counts: [a, b]`), and `total`, `sampleCounts`, `rows`, `completeBatches`, `multipleOf`, `nearestMultiple`, `check`, `aimFor`, `glowFor`, `ratioTable` and `stickerSample` read the pair. Level 5 generalizes the sample, not the rules:

- **`Sample` becomes `{ pots: readonly Pot[]; counts: readonly number[]; stray?; strayAt? }`** with two or three pots (levels 1–4 keep two; their `pair` reads become `pots`). Every function above iterates `pots` instead of the pair; the rule statements in the [levels 1–4 definition](paint-mixer.md#the-model-logicts) were already written per pot ("batch `k` is complete when every pot's count is at least `k × sample[pot]`", "the pot with the largest `|count − t[pot]|`, ties to pot A"), so they hold unchanged with ties to the earliest pot. Levels 1–4's draws must stay seed-identical (a test compares a fixed seed's samples before and after).
- **Pool.** Two triples (above) × three orders: `1:2:1`, `2:1:1`, `1:1:2`, each total 4. **Bucket line:** `batches × 4` with `batches` drawn 2 or 3 (8 or 12 drops, the study's sizes; 12 is the cap). Two buckets per round, one from each triple (the second avoids the first's triple, as `makeSample`'s `avoid` does for pairs).
- **No stray pot at level 5.** Three counts are the new demand, and three pots on screen is exactly levels 3–4's layout (the pair and one stray), already audited at the four views; a fourth pot would put the leftmost one beside the bottom-left pet in portrait. If a building session wants a stray at 5, it first proves a four-pot `layout()` at all four views.
- **Plan.** `{ level: 5, kind: 'line', name: 'Three pots', … moreSameWay: true }`: level 3's kind, so the line, "more, the same way" below it (not a miss), Check, the glow and the ghost pour behave exactly as level 3's. The pet says the recipe with three slots ("For every 1 red, 2 yellow and 1 white").
- **Table.** `TABLE_H` gains a pot row (header plus three rows, 4 × 36); columns stay at most three at level 5 (12 / 4). The layout test proves the taller table clears the bucket in both orientations (landscape: under the jar; portrait: right of the jar, as built).
- **Rows.** A row is the sample's three-pot row (pot A's drops, then B's, then C's, with their marks), at most four places wide for a total of 4, so three rows of four fit the bucket's twelve places.

### Level 6: which jars match?

- **Case.** One sample (an authored pair and a base ratio in lowest terms from `1:2, 2:1, 1:3, 3:1, 2:3, 3:2`, its total at most 5) and **four jars**, each a two-pot label `[x, y]` over the same pair. **Matching jars** are `k × base` for `k` in `1..4` (each count at most 12, so every label is a short numeral and a small spoken slot; `k = 1` at most once per case, since a copy of the sample is a giveaway). **Non-matching jars** are drawn from three seeded kinds, each a classic wrong strategy:
  - *half right*: `[k·a, k·b ± 1]` or `[k·a ± 1, k·b]` (one count sits in the table, the other does not; 4 : 5 against 2 : 3);
  - *added, not multiplied*: `[a + n, b + n]` for `n` in `1..3` (3 : 4, 4 : 5, 5 : 6 against 2 : 3; the additive answer Boyer and colleagues found 6–9-year-olds give);
  - *swapped*: `[b, a]` when `a ≠ b` (3 : 2).
  Every case has **one to three matching and one to three non-matching jars**, four distinct labels, every count between 1 and 12, and no non-matching label that is secretly a multiple (cross-products unequal, as integers). The right answer is the set of matching jars, so **exactly one correct set** holds by construction and a test proves it. Jar order is seeded.
- **On screen.** The sample jar with its recipe row and its ratio table showing **only column 1** (the sample), columns 2–4 headed and empty; the four lidded jars on a shelf where the bucket stood (the bucket is not on screen at level 6), each with its label written as the two pots' marks and numerals (`● 4 : ▬ 6`); Check. No pots, Undo or Tip out.
- **Inputs.** `toggle(jar)`: tap a jar to choose it (it lifts and rings) or put it back (free). `lift(jar)`: a tap on a jar's **lid** knob opens that lid (help, below). `check()`: the commit. A Check with nothing chosen is not a miss ("Tap every jar that's the sample's colour").
- **The reveal** (`reveal(base, label)`, a pure function the tests read). The opened jar's colour shows inside it, and its label slides into the sample's table: if `label = k × base` the table fills columns 1..k and the label sits on column `k`, which glows ("4 red, 6 yellow: two batches, the same way"). Otherwise the label stands beside the table and **the count that breaks it is circled**: when the first pot's count is in the table (`x = k·a`), the second is circled with the table's number for that column ("For 4 red, the table says 6 yellow. This jar has 5"); when it is not, the first is circled ("3 red isn't in the table's red row"). A swapped jar is a first-count break. Every non-matching reveal shows a break and every matching reveal fills; a test enumerates both.
- **Check.** `checkJars(case, chosen)` returns `match` when `chosen` is exactly the matching set; otherwise `wrong` with **one named jar**: the leftmost jar whose choice is wrong (a chosen non-match or a missed match) wiggles, and the pet says which way ("This one isn't the same way" / "One more jar is the same colour"). **One miss per Check.**
- **Help.** After the **second miss on a case**, or on Help, the named jar's lid lifts and its reveal plays; `hints++` **once per case** however many lids open (by Help, by the glow or by her own tap on a lid knob: opening a lid is help, so the first opened lid in a case is its hint, and later ones cost nothing more). A second Help press after an open lid is the supported finish: the right jars choose themselves one by one (a ghost tap each, one per second) and Check glows; still one hint for that case. Following the help from any chosen set reaches `match`.
- **Rounds.** Two cases per round, from two different pairs; the round finishes on the second match through `ctx.finish({ misses, hints })` with one ordinary sticker, help or not.

### Bands and ranges

`LEVELS = { school: { min: 1, max: 6 } }`. Appending keeps every saved level and pin valid (no renumbering); `describeLevel` gains "Three pots: keep three counts in step to the line" and "Which jars match: compare ratios from their labels". No `order`.

## Screen and controls

- **Level 5** is level 3's screen with a third pot in the stray's place and a three-row table; nothing moves or shrinks. Every input stays at least 100 units (pots 120 × 130, buttons 130 × 110).
- **Level 6.** Landscape: the sample jar and its table upper left as at level 3; the four jars in a row across the centre where the bucket stood, each **150 × 190** (the sample jar's size; the whole jar is the choose target, its lid knob a 100 × 60 zone across the jar's top that opens the lid instead); Check to the jars' right. Portrait: jar and table, then the four jars as a 2 × 2 grid, then Check; nothing under the bottom-left pet or the corner buttons. `layoutJars(view)` is audited at the four views (landscape, portrait, two phone insets) by the layout test. Labels are at least 36-unit numerals with each pot's mark, so colour is never the only cue.
- **Touch-down feedback.** A jar lifts as the finger lands; a lid knob tilts the lid. Check slides the chosen jars beside the sample.
- **Speech** through `ctx.instruct`: level 5 "Fill the bucket to the line: three pots, the same way every time"; level 6 "Which jars are the sample's colour? Read their labels, tap every one that matches, then Check". New feedback lines name a jar and a pot count, never a colour judgement of her choice. Counts are slot values in slotted lines, as `pm.for-every` and `pm.recipe` already are (device speech; slotted lines stay out of the clip renderer until the voice plan's V3).

## The paint shelf (journal)

- **Six entries**, `paint-mixer:peach`, `:coral`, `:blush`, `:lavender`, `:rose`, `:lilac` (stable ids forever), one per authored level-5 recipe. `JournalGame` gains `'paint-mixer'`. Each card shows a small jar in the recipe's computed colour with its recipe row (three pots' marks and counts) and speaks one line ("Peach: for every 1 red, 2 yellow and 1 white"); its source text is "make the bucket the sample's colour with 1 red, 2 yellow and 1 white" / "the bucket was peach: 1 red, 2 yellow and 1 white".
- **Filed only for what the round showed:** a level-5 bucket that reached `match` (her pour or the supported finish; help does not withhold it) reports its recipe's id in `RoundResult.discoveries`, and the shell files the new ones at round end, as every journal game does. Levels 1–4 and 6 file nothing (levels 1–4 by the earlier definition; level 6 makes no colour). Nothing is lost, decays or is asked for again.
- The journal pages at eight cards with dots (`JournalScene`, `PER_PAGE = 8`), so six more cards add pages, never shrink; the journal's own tests (every entry has a source, a line and a known game) cover the new ids.

## The palette unlock (decision 7), a separate later batch

Decided: a colour she has mixed joins the pet's palette permanently. Specified here so its batch is ready, but **not part of the levels 5–6 build**, because `PET_COLORS` feeds the rework's hatching, friends, the grown-ups' colour select and save repair, and [RW10](../rework/WORK-ITEMS.md#rw10-collection-book-and-chosen-unlock-goals) owns how chosen unlocks are shown.

- **What unlocks:** each paint-shelf colour on her shelf. **Derived, not stored:** the unlocked colours are read from the journal's filed entries, so there is **no new save field**, a supported finish unlocks the same colour, a replay is idempotent, and nothing can be lost.
- **What it needs:** the six colours as `ColorName`s in `src/art/palette.ts` (fill = the measured mix; `line` and `light` derived as the other swatches are), added to the set save repair **accepts** for a friend's colour (valid whether or not unlocked, so a restore or a profile copy never loses a colour), and offered as extra colour choices only where a colour is chosen.
- **Where it shows:** today a child chooses a colour only at hatching (`HatchScene`'s colour step) and a grown-up on the grown-ups' page; recolouring an existing friend is not a scene yet. The batch adds the unlocked colours to the hatch colour step (one more row of swatches, at least 100 units, paging rather than shrinking) and the grown-ups' select; a Dress or collection-book recolour waits for RW10's packet. If RW10 lands first, the batch follows its unlock presentation instead.
- **Tier:** shell, save and navigation (typecheck, unit tests with save repair and profile isolation, build, a `world` filtered check of hatching, the production offline check because persistence changes).

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 5 | each Check whose counts are not the line's multiple (one per Check) | the glow after the second miss on a bucket, or asked-for help; at most one per bucket | pouring, undo, tip-out, the full slosh, tapping the jar, "more, the same way" below the line |
| 6 | each Check whose chosen set is not exactly the matching jars | the first lid opened in a case, by her, by Help or after two misses; at most one per case | choosing and un-choosing jars, Check with nothing chosen, tapping the sample jar, further lids in the same case |

Supported finish on both levels: the help always reaches `match` (level 5 by the ghost pour, level 6 by the jars choosing themselves), so every round ends with one sticker. Two smooth rounds step up and two struggling rounds step down, clamped to school 1–6. Assisted completion is not evidence that she compares ratios: level 6 with every lid opened is a supported finish, and the grown-ups' card says so.

## Rule tests (`logic.test.ts`)

- **Triples and colour:** the level-5 pool holds only the two triples (never blue with yellow); `mix(k × recipe)` is bit-identical to `mix(recipe)` for every recipe and every `k` that fits; each recipe's colour equals its shelf entry's swatch; within a triple the three recipes are at least 5 apart; one recipe against its one-more-of-each neighbour is at least 1.0 and against the third pot left out at least 6 (the measured table, re-derived; defaults the device check may raise).
- **Generalized model:** levels 1–4 produce the same samples, rows, verdicts and glows for 300 seeds as before the change (a fixed snapshot); at level 5 over 300 seeds the line is 8 or 12, two buckets use different triples, `rows` has no gaps or loose drops iff the counts are a positive multiple, `check` names the stray-free farthest pot with ties to the earliest, and following `glowFor` from every reachable three-pot bucket up to 12 drops reaches `match` within `SOLVE_STEPS`.
- **Jar cases (level 6):** over 300 seeds, four distinct labels, every count 1–12, one to three matching and one to three non-matching, `k = 1` at most once, every non-match has unequal cross-products and is one of the three named kinds, exactly one correct set; `reveal` fills for every match and circles a break for every non-match (the circled count is the second when the first is in the table); `checkJars` names the leftmost wrong jar; from every subset of the four jars, the help sequence (open the named lid, then the supported finish) reaches `match`, and a case counts at most one hint.
- **Layout:** level 5's three-pot layout with the four-row table and `layoutJars` at the four views: every input at least 100 units, jars 150 × 190, lid knobs at least 100 × 60 and inside their jar, nothing under the pet or the corner buttons, the table clear of the jars and the bucket, portrait stacks rather than shrinks.
- **Journal:** six `paint-mixer:*` entries with lines and sources; a level-5 round reports exactly the recipes whose buckets matched; levels 1–4 and 6 report none.

## Ghost finger, how-to card and voice

- **Ghost finger:** level 5 pours three-pot batches in the sample's order to the line, Check, twice; level 6 taps the matching jars (the solver's set) and Check, then the second case. The bot never opens a lid, never chooses a non-match and never calls finish.
- **How-to steps:** "Three pots: pour batch by batch to the line; every pot keeps the same number per batch" `{ from: 5, to: 5 }`; "Read each jar's label against the sample's table, tap every jar that matches, then Check; lifting a lid shows how its label fits the table" `{ from: 6, to: 6 }`. From level 5 the card's note carries the study's left-out list: real paint doesn't mix by averaging; thickness, drying and brand are left out; there is no colour wheel here; more paint is not a stronger colour. And at 6: "A jar's colour is not enough to tell: some different labels look the same, which is why the labels and the table decide."
- **Voice lines** under `pm.*`: `instruct.5`, `instruct.6`, `for-every-3` (three slots), `pot.white` reuse, `jars.choose`, `jars.not-same`, `jars.one-more`, `jars.table-says` (slots: count, pot, count, pot, count), `jars.not-in-row`, `jars.batches` (slot: count), `colour.peach` … `colour.lilac`, and the six `journal.paint.*` lines. "For every … and …" with three quantities is source-checked in the building session against CCSS 6.RP.A.1's ratio language.

## Build batches and check tiers

- **Batch `paint-mixer 3` (levels 5–6 and the paint shelf), new-interaction tier:** the n-pot model, level 5, the jar shelf, the reveal, the journal entries, card, voice and layout. Typecheck; the rule tests above with the journal and how-to tests; one scripted play through a `browser-check.mjs` Paint Mixer filter (level 5 with one wrong Check and a match; level 6 with a wrong set twice, the lid opening and its reveal, then the right set) and one portrait screenshot of level 6 with a lid open; `fingerdemo` at levels 5 and 6; `npm run build` because voice, card and journal change. If the allowance cannot cover both levels, stop after a complete level 5 with its shelf, checkpointed in the draft PR.
- **Batch `paint-mixer 4` (palette unlock), shell/save tier**, after batch `paint-mixer 3` and after RW10's packet if that is defined first; it is not a routine pick until then.
- Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. Device checks open at the build: whether the six shelf colours read as six on an iPad; whether a three-pot one-more-of-each (1.1–1.6) is seen at all; whether a child reads a jar label as two counts or as one number; whether the circled count in a reveal is understood without the speech.

## Open decisions

Each has a default the build uses; none blocks batch `paint-mixer 3`.

1. **The lid reveal.** Default: the jar's label placed against the sample's table, colour beside it (measured above: colour alone misleads). Not taken: the study's colour-only reveal.
2. **The table at level 6.** Default: column 1 only, so the labels must be compared by multiplying. Alternative: all four columns shown from the start (a lookup), as an easier first case if play shows level 6 as a cliff.
3. **A stray pot at level 5.** Default: none (three pots on screen, the audited layout).
4. **Lids and hints.** Default: the first lid in a case is its one hint. Alternative: every lid a hint, which would turn exploring all four into a struggling round; not taken.
5. **Shelf names.** Peach, coral, blush, lavender, rose, lilac; renamable before the build without changing ids' meaning only until the first build ships (ids are permanent after).

## Built: levels 5-6 and the paint shelf (2026-11-02)

Batch `paint-mixer 3`, [PR #1135](https://github.com/rjdunlap/neo/pull/1135); LEVELS is now school 1-6. The sample generalised from a pair to n pots (levels 1-4 proven seed-identical against a snapshot taken first). Level 6 is its own scene (`shelf.ts`, rules in `jars.ts`). Deviations from this definition:

- Level 6 landscape puts Check under the right end of the jar row (no room beside four jars at 1024).
- After help, a glow follows the next jar to change, then Check (as levels 1-5).
- The reveal follows the rule "first count in the table, so the second is circled": a swapped label whose first count is a multiple (2:1 against 1:2) circles the second count, not the first as the prose above says. A "first" reveal fills all four columns so the first row shows.
- The closed lid is drawn to fill the lid tap zone (a review fix).
- Rule-test note: "third pot left out, distance 6 or more" is tested for the third pot (white), as measured above; leaving out red from peach (0:2:1) is 5.84.
- Checks: typecheck, 88 Paint Mixer rule tests, full units, build, `paintmixer` levels 5-6 twice and `fingerdemo` at 5 and 6. Levels 1-4 browser play not rerun; offline not run. Open device checks are in [DEVICE-CHECKS](../archive/DEVICE-CHECKS-2026-11-09.md#paint-mixer-levels-56).
- Not built: the palette unlock (batch `paint-mixer 4`), which stays waiting.
