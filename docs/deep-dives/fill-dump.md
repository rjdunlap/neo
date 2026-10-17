# Fill and Dump deep dive

*ID `fill-dump` · bands lap, toddler, preschool · levels 1–5 on 2026-10-17 · session `claude/fill-dump-deep-dive` ([PR #513](https://github.com/rjdunlap/neo/pull/513))*

## The game today

Tip a basket of fruit out, tap the fruit back in; from level 3 put in a stated number and tap the green check; at level 5 pull a jug right to pour water to a line. Purpose: containment, cause and effect, counting into a set, then capacity (`skills: containment, counting, cause-effect, capacity`). Land: Counting Cove. It is one of the three games in the frozen lap/toddler discovery pool (`DISCOVERY_IDS` in `src/content/discovery.ts`, roadmap D2a and [RW03](../rework/HOME-NAVIGATION.md)), so its early levels are often the first thing a one-year-old is offered.

| Level | Plan | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | Tip out 3, scoop back once | lap, toddler, preschool | Nothing can go wrong: tap the basket, tap fruit (or the basket) to put them back |
| 2 | Tip out 4, twice | lap, toddler, preschool | Same, and the basket is full again between tips |
| 3 | Put in 1–3 of 5, then check | toddler, preschool | How many to put in; when to tap the check; the basket takes the latest one out (free undo) |
| 4 | Put in 3–5 of 7, then check | toddler, preschool | Same, larger numbers |
| 5 | Pour to a line in three cups (½, then ¼ and ¾ seeded) | preschool | How far to pull; whether to empty the cup into the tray and pour again; when to check |

Ranges: lap 1–2, toddler 1–4, preschool 1–5 (no `order`). `create` sends `ctx.level >= 5` to `PourGame` (`pour.ts`); `planFor` clamps into `FILL_PLANS` (four entries); `describeFill` also treats every level ≥ 5 as pouring.

**Content pools.** Six fruits (apple, orange, lemon, pear, blueberries, grapes; `FRUIT_FOR` in `src/art/props.ts`), mixed in levels 1–2 (at most four pieces, all different) and one kind for every piece in levels 3–4. One basket, one meadow, seeded landing spots in grid cells 128 units apart. Pour: one jug of three cups, one cup, a tray, three line heights. Voice: 20 `fill.*` lines; the instructions say "fruit" and "purple line".

**Known gaps** (written down, not fixed; this session changes no code):

- **Taps during the tip are silent.** `touchBasket` returns before `squish()` while `busy`, so for about 1.5 s of the tip-out animation a touch gets no response. This is the problem [V2](../definitions/visual-identity.md#v2--animal-snack-an-answer-to-every-touch) solved in Animal Snack; its rule says to apply the lesson to one other tap game only after a person has played that pilot.
- **Open grass does nothing.** In levels 1–2 a tap that misses the basket and the fruit gets nothing, though no tap there can be wrong. Lap entries elsewhere (Bubble Pop's anywhere entry, Splish Splash's *Pat the bubbles*) answer every touch.
- **The count is spoken only.** Levels 3–4 show no picture of the asked number; with sound off or speech unheard, the job is invisible.
- **Pouring is nearly silent and flat.** One tick when the jug is grabbed; no sound while water moves, no ripple, the cup's water is a flat rectangle, and the stream is a fixed-width line. The line is purple with a triangle marker, but the spoken instruction names only the color.
- **No idle invitation** in any level.
- **Coupling traps for any appended level:** the `>= 5` routing and `describeFill`; `planFor`'s array index; the how-to card's level-5 `LevelLine`s are open-ended (`{ from: 5 }`) and would silently describe every new level (the how-to test will not catch it); the `originals` browser case and `fingerdemo` levels.

Person checks already open: pouring on an iPad ([DEVICE-CHECKS](../DEVICE-CHECKS.md), "Fill and Dump pouring on an iPad"). No couch entry, journal entry or story step uses this game.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| Water table and sensory bins ([Playvolution, filling and emptying schema](https://playvolutionhq.com/filling-and-emptying-schema/), opened; Athey's schema work via [Chartered College](https://my.chartered.college/impact_article/investigating-young-childrens-learning-through-a-schema-lens-how-can-schema-theory-inform-practice-in-an-early-years-class-in-a-special-school/), search summary only) | Physical play | Not levelled: new containers, new materials (shells, water, sand), new tools (spoon, ladle, funnel) | Vary *what* is filled and *what it goes in*, keep the action; "full" and "empty" as words | Mess as the point; real-world adult cleanup |
| Montessori practical life pouring ([Montessori Mom, pouring exercises](https://montessorimom.com/lesson-day-83-pouring-exercises/); [Montessori album, dry pouring](https://montessorialbum.com/montessori/index.php/Dry_Pouring); search summaries, not opened) | Classroom sequence | Dry before wet; large pieces to small; pitcher to pitcher, then one jug into two, then pouring to a mark; spills are sponged up as part of the work | The already-built ladder shape (pieces → water → a mark); spills as part of the job, not a failure | Fine-motor precision as the goal |
| Nesting and stacking cups ([Lovevery](https://blog.lovevery.com/child-development/stacking-nesting-and-matching-when-do-they-happen/), opened; [Fragaszy et al. 2002](https://www.psychology.uga.edu/sites/default/files/CVs/Fragaszy%20et%20al._2002_Developmental%20Science.pdf), search summary only) | Toy | Two cups, then three or more; from pairing to ordered sets over the second year | Size and "which fits inside" as a toddler comparison before any number | Memory or speed |
| Illustrative Mathematics K, Unit 7 Lesson 9, *Compare Capacity* ([lesson](https://im.kendallhunt.com/K5/teachers/kindergarten/unit-7/lesson-9/lesson.html), opened) | Curriculum (CCSS K.MD.A.2) | An obviously different pair first (pitcher, small cup); then two cups that are hard to judge by eye; then short-wide against tall-thin; predict, then pour one into the other (overflow or room left), or count small cups | Predict → pour → see overflow or room; obvious pairs first, tricky ones later; counting small cups as an alternative test | Sticky-note prediction as a graded answer |
| Piaget's liquid conservation task ([Simply Psychology](https://www.simplypsychology.org/conservation-in-psychology.html), search summary only) | Developmental research | Children younger than about 7 tend to judge the taller glass as holding more | Tall-thin against short-wide is a real surprise for preschoolers, so a pour that shows the truth teaches; the prediction must never be marked wrong | Treating a preschooler's height judgement as a mistake |
| *Where's My Water?* ([Wikipedia](https://en.wikipedia.org/wiki/Where%27s_My_Water%3F), opened) | Touch puzzle (Disney) | 20-level chapters that each add a mechanic (valves, fans, ooze); ducks collected unlock groups | Water as a satisfying, legible material; one new mechanic per chapter | Duck-gated chapters, ad/IAP chapter unlocks, failure when the water is lost (here water is conserved) |
| The two-jugs puzzle (3 and 5 make 4) ([Programming Praxis](https://programmingpraxis.com/2016/09/23/), search summary only) | Classic logic puzzle | One target per puzzle; larger jugs and targets | A school-age horizon for capacity reasoning with exact units | Step counts or par as pressure |
| Toca Boca / Sago Mini pretend kitchens (**recalled**, no pouring title found by [search](https://en.wikipedia.org/wiki/Sago_Mini)) | Toy apps | Not levelled: a sandbox of objects that react | Every object answers a touch | Subscriptions and locked content |

**Developmental anchors.** CDC's 2022 list (as reproduced by [Understood](https://www.understood.org/en/articles/developmental-milestones-for-typical-1-year-olds), opened) puts "puts things into a container, like a block in a cup" at 12 months, so level 1's scoop back is already within reach of a one-year-old; dumping out comes first in practice. Head Start's infant-toddler math guidance ([page](https://www.headstart.gov/publication/supporting-math-skills-infants-toddlers), returned 403; search summary only) names filling and dumping as early measurement and "full"/"empty" as words to use.

## What makes sense here

- **Lap stays tap-only and cannot go wrong.** The one-year-old's rungs grow by answering every touch and by fresh things to put away, not by new decisions. No drag in the lap window.
- **Toddler gets one real comparison before counting:** full against empty, judged by looking (fruit peeking over a rim), which the dumping play has been showing all along.
- **Preschool turns pouring into capacity comparison**, the question the [family experience review](../FAMILY-EXPERIENCE.md#research-sessions-worth-doing) asks of this game: same jug gesture, an obvious pair, an unscored prediction, the overflow as evidence. Capacity stays a transparent limited model: straight-sided containers whose water height is volume over width, nothing slows near the line, nothing is lost.
- **Pre-K and school are horizons**, not current bands: tricky pairs (Piaget), counting cups, then the two-jugs puzzle. Each opens a band, which is the developer's call.
- **Rework fit.** Filling a cup that the companion then drinks, or a bucket that waters something at home, is the kind of visible result the [rework brief](../rework/README.md#learning-belongs-in-the-story) wants; it belongs to its RW packets, not to this game's slices. Nothing here adds lives, timers, streaks or loss.
- **Elsewhere already:** dry sand pouring and scooping is [Sand Table](subjects/earth-materials.md)'s; equal sharing by pouring belongs to the fractions research (PR #480), not here; Jar Sort ([IDEAS](../IDEAS.md#candidates)) owns pour-to-sort; "count small cups to fill a big jug" comes from the [Pour and Fill idea](../IDEAS.md#hands-on-science-and-simulations) row and is used at level 9 below. Quick Tricks' third show shares the pour gesture test, so a gesture change touches it.

## Experience and presentation

- **First unsupported action.** Level 1: touch the basket. Within a second it squishes, clunks and tips; each fruit tumbles with its own bell, lands with a pop and a hop. That consequence-from-one-touch is the game's pleasure and must stay the first thing she meets.
- **Touch-down and readiness.** Basket and fruit answer on touch-down; the gaps are the silent tip window and the grass (above). Proposal: during the tip, a touch makes the nearest falling fruit wink and the basket give a small extra wobble, queueing nothing (V2's rule; gated on its person check). On open grass in levels 1–2, a touch sends the nearest fruit hopping in, so every touch does the next thing.
- **Variety on replay without changing the rule.** Things to put away: fruit in a basket (today), balls in a bucket, blocks in a toy box, bath ducks in a tub. Seeded per round, one set per round, voice lines naming the set's thing ("Tap the balls!"). Each set has its own landing sound pitch on the same pentatonic steps.
- **Reasoning versus motor.** Levels 1–4 and 6–7's answers are taps on large targets; level 5 and 7's pour measures the furthest pull, not steadiness or time. Nothing depends on reading; the count sign makes the number visible as dots.
- **Concrete art/feel example (input to chunk 21's V3, not its definition).** At level 5, tie one event to tilt, stream, level, ripple and sound: the stream's width follows how much this frame's pull poured (thin trickle to thick pour, `Graphics` stroke width 6–18); where it meets the water, a ring of two ellipses expands and fades (`ctx.tw`); the water's surface is a shallow quadratic curve that wobbles and settles; each tenth of a cup rises one pentatonic step on `sfx.marimba` (a bottle filling sounds higher as it fills); spilled water drips into the tray with `sfx.splash`. With sound off the level, ring and stream still say the same thing, and the line keeps its triangle marker so color is not the only cue. The capacity model, the tolerance and the gesture do not change.
- **Supported ending and replay.** Lap rounds end when everything is back in; counting and pouring end on a correct check, with the glow after two misses. The celebration's again and next level do the rest; no new ending UI.
- **Co-play.** Today's tip (grown-up) and fill (child) split stays. For level 7: the grown-up says a guess aloud while she makes hers, then the pour settles it for both. Solo works throughout.
- **Only a person can judge:** whether a one-year-old notices the grass taps or keeps aiming at the basket; whether full/empty reads from fruit peeking over the rim; whether a three-year-old pulls far enough to pour a whole container; whether the tall-thin surprise delights or upsets.

## Proposed ladder

### Fresh content inside existing levels

1. **Count sign** (levels 3–4): beside the basket, a card of *n* hollow dots; each fruit that goes in fills one; a fruit beyond *n* hangs as an extra dot outside the card, so "too many" is visible without color. The check and accounting are unchanged. Rule test: dots filled equal `insideCount`, extras equal `max(0, inside − target)`.
2. **Lap reach and an invitation** (levels 1–2): a tap on open ground is `{ on: 'basket', pick: nearest-to-touch }` when the basket is not full and a tip when it is; after six idle seconds the next thing wiggles (the basket or the nearest fruit). The wiggle is an invitation, never a hint: `hints` stays 0. Levels 3–5 ignore ground taps as now. Rule test: random taps including ground taps finish levels 1–2 with no miss and no hint.
3. **Things to put away** (levels 1–4): three code-drawn sets beside fruit (balls/bucket, blocks/toy box, ducks/tub), seeded per round, with noun-neutral or per-set voice lines. Rule test: every set has its voice lines and at least four distinct pieces for the tip-out levels; counting levels use one kind.
4. **Pouring feel** (level 5): the V3 example above. Gated on the chunk-21 V3 definition.
5. **Busy-window acknowledgment** (levels 1–4): gated on V2's person check.

### New levels on top

All appended with stable IDs; each slice moves routing to a plan table keyed by ID (basket, pour, compare) and bounds the level-5 how-to lines to `to: 5`.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | **Full and empty** | toddler, preschool (placed after 2 by `order`) | Every request shows a fresh seeded pair: one basket with three fruit peeking over the rim, one empty, and a small pile on the grass. "Tip out the full one!" tips it. "Fill the empty one!" sends the pile hopping into it. Four requests, alternating | Which basket is full, which is empty, by looking (nothing to remember between requests) | Tipping the empty one: a wiggle, a gentle boing and "Nothing in there to tip!"; filling the full one: "No room, it's full!"; one miss each; after two, the right basket glows (one hint) | Each request has exactly one right basket; the bot finishes with no miss; both baskets plus the pile fit every view at 100-unit targets; requests alternate | Second basket and layout; about six voice lines; bot; how-to `LevelLine`s; `order` toddler `[1, 2, 6, 3, 4]` (range 1–6), preschool `[1, 2, 6, 3, 4, 5]`; `originals` case and `fingerdemo` at 6 |
| 7 | **Which holds more?** | preschool (top) | A full big bowl on the left, an empty small cup on the right. "Which holds more? Tap your guess." Then she pours the left one into the right with the level-5 pull: water overflows into the tray, or room is left. "Tap the one that holds more." Three pairs, all obviously different (capacities at least 1.6 times apart) | A guess (free); then the answer from the evidence | The guess is never marked; after the pour, tapping the smaller is one miss with "Look — the water spilled over" or "Look — there is room left"; after two, the tray or the gap glows (one hint per pair). Spills and re-pours free | Pairs are distinct and ≥ 1.6× apart; water is conserved; overflow occurs iff left > right; the guess never changes `misses`; both containers, tray and check fit every view at 100-unit targets; the bot finishes | Reuses `PourGame`'s jug, tray, pull and cleanup; new container art (straight-sided bowl, bucket, cup, mug) with height = volume ÷ width; about eight voice lines; how-to; bot drag; preschool range 1–7 |
| 8 | **Tricky pairs** | pre-K (decision 1) | A tall thin glass and a short wide one, capacities 15–30% apart; same guess → pour → answer | As level 7, where the eye misleads | As level 7; the voice names what happened ("The short one held more!"), never "you were wrong" | Pairs pit height against capacity (the taller holds less at least once in three); the rest as level 7 | Needs the pre-K window and Counting Cove's fit at pre-K; whether to offer "the same" (decision 2) |
| 9 | **How many cups?** | pre-K (decision 1) | Two bowls; a small cup scoops from a tub (tap) and pours into a bowl (tap); each cupful counted aloud with a tally beside the bowl. Fill both, then "Which bowl took more cups?" | Counting cupfuls; comparing the two counts | A wrong pick: one miss and the two tallies are counted aloud side by side; glow after two | Each bowl holds a whole number of cups (2–6), the counts differ, the tallies match the pours | Taps only; tally art; voice counts; bot; source: the [Pour and Fill](../IDEAS.md#hands-on-science-and-simulations) idea's "count small cups to fill a big jug" |

**School horizon (sketch, decision 4):** *Two jugs*: a 3 and a 5 make 4, with fill, empty and pour-across buttons, free undo and no par. Points at Jar Sort for identity before anything is built.

### Younger-band openings

Lap already opens at level 1, which matches a twelve-month milestone. No new lap level: the lap rungs grow through fresh content items 2, 3 and 5. A drag-to-pour rung ("Pour it out", no line, done when the jug is empty) fits toddlers at a water table but breaks the game's tap-only promise for small hands; it waits on a person watching a two-year-old pull the level-5 jug (decision 3).

### Easier entries and levels between existing ones

Level 6 is the only in-between level: built with the band's `order` (toddler `[1, 2, 6, 3, 4]`, preschool `[1, 2, 6, 3, 4, 5]`, then `7` appended for preschool). It is not an entry, so no `entryLevels`. A saved toddler level stays where it is; nothing is renumbered.

### Left out on purpose

- A lap level below 1 (the basket empties itself, she only watches): less than she can already do.
- Flow that slows near the line (the original sketch): it changes the capacity model V3 says to keep.
- Cups of differing widths at level 5: the line would stop tracking volume; width belongs to level 7's comparison, where the model is stated.
- Equal-share pours (fractions research) and dry sand (Sand Table).
- Any timer, score, par or lost water.

## Decisions for the developer

1. **Open pre-K** for levels 8–9 (and check Counting Cove's land layout at pre-K). Lean: yes, after level 7 is built and watched.
2. **"Holds the same"** pairs at level 8: a third answer button, and whether younger players ever meet a pair that looks different but holds the same. Lean: not before a person sees level 8.
3. **Toddler drag-to-pour rung**, after a person watches a two-year-old pull the jug. Lean: only if she pulls without help.
4. **School Two jugs**: open the school window for this game, or give the puzzle to Jar Sort.

Not developer decisions but gates: item 4 (pouring feel) waits on chunk 21's V3 definition; item 5 (busy window) waits on V2's person check.

## Build slices, in order

Build one Fill and Dump slice at a time, in this order: slices 3 and 4 both rewrite the level routing, `LEVELS`/`order` and the how-to lines, and level 7 assumes 6 exists. Each slice that adds a level updates `describeFill`, the how-to card (bounding level-5 lines to `to: 5`), the README row, [GAMES.md](../GAMES.md), the `originals` fill case in `scripts/browser-check.mjs` and the `fingerdemo` levels.

1. **Count sign** (ready). Tier: existing-game change on an unchanged interaction: typecheck, the game's rule tests, one filtered regression play (`ORIGINALS_ONLY=fill`) and one portrait screenshot of level 4.
2. **Lap reach and idle invitation** (ready). Tier: typecheck, rule tests (ground taps in the any-taps test), `ORIGINALS_ONLY=fill` once and `fingerdemo` at level 1.
3. **Level 6, Full and empty**, with the plan table keyed by ID (ready). Tier: new level on an existing interaction: typecheck, rule tests, the how-to and difficulty tests, one browser play of level 6 and `fingerdemo` at 6.
4. **Level 7, Which holds more?** (ready). Tier: new interaction: typecheck, unit tests, one scripted play of level 7 (one wrong answer, one hint), one portrait screenshot, `fingerdemo` at 7.
5. **Things to put away** (ready). Tier: content: typecheck, rule tests, one screenshot per new set.
6. **Pouring feel** (after the V3 definition). Tier: rule tests unchanged, one filtered play of level 5, `fingerdemo` at 5, landscape and portrait screenshots.
7. **Busy-window acknowledgment** (after V2's person check). Tier: rule tests, a rapid-tap regression play.
8. **Levels 8–9** (decisions 1–2), then the toddler pour rung (decision 3) and Two jugs (decision 4).

## What was built in this session

Nothing: a research-only deep dive. Ran `node scripts/check-links.mjs` and `git diff --check`.
