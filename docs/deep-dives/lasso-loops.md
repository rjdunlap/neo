# Lasso Loops deep dive

*ID `lasso-loops` · bands preschool 1–3, pre-K 2–4, school 3–6 · levels 1–6 on 2026-10-31 · session `claude/dive-lasso-loops` ([PR #1080](https://github.com/rjdunlap/neo/pull/1080))*

## The game today

She draws a loop round fireflies with one finger and the ones inside fly into a jar, counted as they land. The loop always closes back to its start, so a nearly closed loop counts; a loop round none is only explained. The learning purpose is grouping: loops of an exact size, then fives and tens with the rest on a leaf (tens and ones), then equal groups as the first idea of multiplying, and at school an estimate checked by tens. Counting Cove; music `STYLES.lullaby`; one round is one meadow and one sticker.

| Level | Plan | Bands whose window includes it | What she decides |
| --- | --- | --- | --- |
| 1 | `free`: loop any fireflies; each loop fills the next jar | preschool | Where to draw a closed loop (8 fireflies, 6 jars; nothing can be wrong) |
| 2 | `exact`: loop exactly 2 or 3 per jar | preschool, pre-K | How many are inside before closing (three jars of 2 or 3, two spare fireflies) |
| 3 | `fives`: jars of 5, the rest on the leaf, then "how many in all?" | preschool, pre-K, school | Group by five, then count by fives and ones (11–19) |
| 4 | `tens`: jars of 10, then the total | pre-K, school | Group by ten, then read tens and ones (21–39, always 1–9 ones) |
| 5 | `groups`: "make 3 groups of 4", then the total | school | Equal groups, then how many (products 6–16, two or three spare fireflies fly home) |
| 6 | `tens` + `guess`: *About how many?* | school (top) | A free guess from three far-apart cards, a benchmark jar of ten, keep or change, then the level-4 count ([definition](../definitions/lasso-loops-about-how-many.md)) |

**Content pools.** Level 1 is fixed (8 fireflies, 6 jars). Level 2 shuffles three jars from {2, 3}. Level 3 is 2–3 jars of five plus 1–4 ones; level 4 is 2–3 jars of ten plus 1–9 ones; level 5 picks 2–4 groups of 2–5 with a product of 6–16; level 6 is level 4's round (21–39, fixed by its definition). Fireflies sit one to a cell of a jittered grid (`gridFor`: at most five rows), so a finger can pass between them. The total question offers three pads: the answer, the swapped tens and ones where they differ, ten more or less, one more or less, or one group more or less.

**Mistakes and help.** A wrong-sized loop lets the fireflies go with a boing and "That loop went around 4. This jar wants 3." (one miss); the second puts white rings round the leftmost free firefly's nearest group of the right size (one hint a round). A wrong total counts aloud the way the jars show it (by fives, by tens and ones, by groups); two wrong totals glow the right pad. Guesses never count.

**Checked for this dive.** A probe over 500 seeds per level found that the hint's ringed group never has another firefly inside its outline, so the hint always leads to a loop that works. Level 4 never shows a number with no ones (20 or 30) or a teen (one jar), the two place-value cases a child most needs to see; level 1 is the same meadow every time.

**Known gaps and checks.** Device check open for level 6 (whether a six-year-old changes a guess after the benchmark; [DEVICE-CHECKS](../DEVICE-CHECKS.md)). No couch entry; the ghost finger draws a rectangle from `demoLoop` and answers through the pads.

**Space.** In portrait (768 wide) the meadow is about 558 by 330 units: 39 fireflies already make a 9-by-5 grid of cells about 62 units wide, and three jars of 108 fill the bottom row beside the leaf. Numbers above 39 cannot simply add fireflies or jars without losing the finger's lane, so this dive stays within 39 loose fireflies and three jars.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Pokémon Ranger](https://strategywiki.org/wiki/Pok%C3%A9mon_Ranger/Catching_Pok%C3%A9mon) (DS), the capture loop | Action, touch | Each creature needs a number of loops; moving creatures break the line; assists change the loop count | The pleasure of a closed loop, already the game's core | Breaking lines, damage, loop counts against a moving target |
| Goomba Wrangler, *Super Mario 64 DS* minigame (recalled; [IDEAS](../IDEAS.md#gestures-the-island-does-not-use-yet)) | Minigame | More and faster creatures; circling a Bob-omb costs half the catch | A loop round several things at once counts them all | The 20-second timer and the penalty |
| [Number Pieces](https://www.mathlearningcenter.org/apps/number-pieces) (Math Learning Center, iPad) | Free virtual base-ten pieces | Ones join into a ten and a ten breaks into ones; teachers set "build 34, then add ten" ([MLC place-value activities](https://mathlearningcenter.org/blog/place-value-activities-and-number-pieces-app)) | Building a number rather than only reading it; ten loose ones becoming one ten | An open sandbox with no goal or spoken support |
| Number Frames (Math Learning Center; recalled) | Ten frames | Five and ten frames, then several frames for teens | A full frame read at a glance; teens as one ten and some ones | — |
| [DragonBox Numbers](https://www.commonsensemedia.org/app-reviews/dragonbox-numbers) | Number-sense toy | Nooms 1–10 stack, eat and split; children drive the activity, no quizzes | Composition as play the child starts | Its place-value coverage is thin by reviewers' account; a subscription |
| Montessori golden beads (recalled) | Classroom material | Unit beads, ten-bars, hundred-squares; exchange ten of one for one of the next | The exchange: ten on the leaf become one jar | Hundreds (owned by the number-structure study, below) |
| Bundling straws with rubber bands (classroom practice; the game's off-screen line) | Physical | Bundle tens, count bundles and loose ones; then "ten more" is one bundle | Ten more and ten less as one jar in or out | — |

**Learning references.** [CCSS K.NBT.A.1](https://www.thecorestandards.org/Math/Content/K/NBT/) (compose 11–19 as ten ones and some more ones), [1.NBT.B.2](https://www.thecorestandards.org/Math/Content/1/NBT/) (a ten is a bundle of ten ones; 11–19 and the decades 10, 20 … 90 as tens and zero ones) and 1.NBT.C.5 (find ten more or ten less mentally, and explain it). The current ladder reads two-digit numbers at level 4 but never shows a decade, a teen, or building a number on request.

## What makes sense here

The loop is the game's action and the jar of ten is its representation; both carry further without new art. What fits:

- **Fresh content** that shows every kind of tens-and-ones number up to 39: teens, decades with nothing on the leaf, and a meadow that changes at level 1.
- **Building a number** (school): she is asked for a number and makes it with loops, where a leaf that fills to ten becomes a jar. That is 1.NBT.B.2's bundle in the child's hands.
- **Ten more, ten less** (school): the jars start full; one jar in or out changes the tens digit and leaves the ones alone (1.NBT.C.5).

What does not fit, or belongs elsewhere: numbers past 39 (the space note above); hundreds (a crate of ten jars is the [number-structure study](subjects/number-structure.md)'s NS6 sketch, its home decided at its own definition); larger equal groups and factor pairs (Orchard Rows 4–6 and Monster Munch's division levels own them); timers or moving fireflies.

**Long arc.** Preschool loops and exact small groups; pre-K fives and tens; school reads, builds and changes two-digit numbers and estimates (6, and E2 when defined); hundreds and estimating a whole from a part stay with their studies.

## Experience and presentation

- **First unsupported action:** at level 1, any closed loop round any fireflies, which always fills a jar. At the new levels, any loop of ten or fewer goes somewhere (a jar or the leaf), so drawing is never wrong; only the *Done* answer is judged.
- **Touch and consequence:** the trail draws from touch-down (built); a closed loop rises a bell per firefly as they land. New: when the leaf reaches ten, the ten lift together, glow, and fly into the next empty jar with a rising run of five pentatonic bells and "Ten on the leaf! They fill a jar." A jar tapped tips back and its ten flutter home to the meadow.
- **Art example:** the leaf already draws with `Graphics` bezier curves; for building a number, nine faint dots on the leaf (hollow `circle` strokes, five then four, like a ten frame) fill as fireflies land, so "one more makes ten" shows before it happens.
- **Variety without a rule change:** seeded counts and scatters, the jars' order of targets, which of ten more or ten less comes first.
- **Reasoning versus motor:** loops can be generous (a loop of more than ten is let go with "Ten at most in one loop", never a miss); the decision is how many tens and ones, not drawing precision.
- **Supported ending:** after two wrong *Done* answers the part to change glows (the leaf, a jar, or an empty jar to fill) and the pet counts what is there; she finishes with help and gets the sticker.
- **Co-play:** one person says the number, the other loops it; or a grown-up builds a number with straws while she builds it in the meadow. Solo play is unchanged.
- **Needs a person or device:** whether the leaf turning into a jar reads as "the same fireflies, now a ten" to a six-year-old, or as fireflies vanishing; whether "ten more" is heard as "ten" (a jar of ten) or "more"; whether *Done* is found without a reminder.

## Proposed ladder

### Fresh content inside existing levels

- **Level 1, a fresh meadow:** 6 to 9 fireflies and as many jars as fireflies, the scatter already seeded. A rule test asserts every count stays one firefly per cell.
- **Level 3, fives:** 1 to 3 jars (6–19), and one round in about five with no ones (10 or 15), saying "None left over!" instead of resting fireflies on the leaf.
- **Level 4, tens (not level 6):** a seeded mix of a teen (one jar and 1–9 ones), a decade (20 or 30, nothing on the leaf, no leaf drawn) and the built 21–39. The count-aloud line has a no-ones form ("3 jars of ten make 30. None left over.") and the pads offer ten more or less and one more or less where the swap does not apply. Level 6 keeps its own 21–39 round, as its definition fixes.

### New levels on top

**Level 7 stays reserved** for the estimation study's E2 *Too few, too many* ([estimation study](subjects/estimation.md#first-games-proposed-ladder-lasso-loops-6-and-7)), defined only after a child has played level 6 (its decision 2). This dive numbers its own levels from 8. Because `planFor` reads `PLANS` by position, level 8 cannot ship before a level 7 exists: either E2 is built first, or the developer agrees that this dive's first new level takes ID 7 and E2 takes the next free ID, placed after 6 with `order` (decision 1). Until then, levels 8–9 are written here but not queued.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | *Make the number* | school | A sign says **23** and the pet says "Catch 23 fireflies." 30 fireflies, three empty jars, a leaf with nine hollow dots, a *Done* button. A loop of exactly ten fills a jar; a loop of fewer rests on the leaf; when the leaf would reach ten, ten fly into the next jar. She taps *Done* | How many tens and how many ones make the number, and when to stop | Loops are never misses (more than ten is let go, free). Tapping a jar or the leaf lets its fireflies go home (free undo). A wrong *Done* is one miss: the pet counts the jars and leaf aloud ("2 jars of ten make 20, and 5 more make 25. We want 23."). The second glows the part to change and counts one hint a round | For every target 13–36 the meadow holds at least three more than the target, never more than 39; three jars are enough; every loop sequence that catches the target total is accepted, including 13 ones regrouped to a ten and 3; the regroup moves exactly ten | Leaf dots, *Done* button, three voice lines; the bot loops tens then ones and taps *Done*; a how-to step; no couch, journal or picnic coupling |
| 9 | *Ten more, ten less* | school (top) | The jars already hold 24 (two full jars and four on the leaf). The sign says **34** and the pet says "Make it ten more." After *Done*: "Now make it ten less" to 24 or 14 | Which changes the number by ten: a jar in or out, the ones untouched | As level 8: free loops and undo; a wrong *Done* is one miss with the count aloud and the pet naming what changed ("You changed the ones. Ten more is a whole jar."); two glow the empty jar or a full one; one hint per ask | Starting numbers keep both answers within 11–39 and the jars within three; ten more and ten less each come once a round in seeded order; changing only the ones never passes | Reuses level 8's leaf, undo and *Done*; two asks per round; one voice line each way; the bot adds or removes one jar |

### Younger-band openings

**Toddler** (about 2–3) is possible only as a loop that always catches: three or four large fireflies spaced far apart, any closed scribble round one or more catching them, no counts. It would be an appended ID with `entryLevels` and toddler `order` first. Closing a loop is a motor skill many two-year-olds lack, and the game's preschool level 1 already asks nothing more; whether a toddler can close a loop is a device question. Not queued (decision 2).

### Easier entries and levels between existing ones

The fresh level-4 teens give pre-K an easier tens round without a new ID. No other in-between level is needed: preschool's 1–3 and pre-K's 2–4 overlap as built.

### Left out on purpose

- **Hundreds** (a crate of ten jars): number-structure NS6, a sketch whose home game is chosen at its definition.
- **Bead frame:** the silk-road study's CS7 packet ([study](subjects/china-india-silk-road.md)), gated on its decision 9; and the Roman provenance line, the ancient-Mediterranean AM7 packet, review-gated.
- **Count a patch** (estimation E4): its home game is undecided between this game and Orchard Rows.
- **A two-seat loop** ([IDEAS](../IDEAS.md), joint attention: both loops must close round the same firefly): a sketch; two hands on one iPad needs its own definition.
- **Bigger equal groups and factor pairs:** Orchard Rows and Monster Munch own them.
- **Moving fireflies, timers, a best time:** speed is not the skill.

## Decisions for the developer

1. **Level numbering.** Keep 7 for the estimation study's E2 and build this dive's levels only after E2 (lean), or let *Make the number* take ID 7 now and give E2 the next free ID placed after 6 with `order`.
2. **A toddler opening** (a loop that always catches), only after watching a two-year-old try to close a loop.

## Build slices, in order

1. **Teens, decades and a fresh meadow (batch lasso-loops 2).** Level 1's seeded 6–9 fireflies; level 3's 1–3 jars with an occasional no-ones round; level 4's teen, decade and 21–39 mix; the no-ones voice lines and pad choices. Level 6 unchanged. *Check:* fresh content on the existing interaction: typecheck, the game's rule tests (every plan's fireflies fit one per cell; a teen, a decade and a 21–39 round all occur at level 4 within a few hundred seeds; level 6 still 21–39; pads stay three distinct positive numbers including the answer; no leaf when there are no ones), one filtered regression play of level 4 on a decade seed with one wrong total, `fingerdemo` at 4 (the bot meets a round with no leaf).
2. *After decision 1:* **Make the number** (level 8, or 7 by decision 1). New interaction tier: typecheck, rule tests (above), one play with a loop of more than ten, a regroup on the leaf, one wrong *Done* and the glow, then to the sticker; one portrait screenshot of three jars and the leaf; `fingerdemo` at the new level.
3. *After slice 2:* **Ten more, ten less** (the next level). New levels on level 8's interaction: typecheck, rule tests, one play with a ones-only change (a miss) then the right jar, `fingerdemo` at the new level.
4. *Decision 2:* a toddler opening, defined only after a device observation.

## What was built in this session

Nothing: a deep dive session is research and ideation only. A one-off hint probe (`test-results/`, not kept) ran over the built rules; links (`node scripts/check-links.mjs`) and `git diff --check` ran.
