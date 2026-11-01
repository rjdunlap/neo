# Sink or Float deep dive

*ID `sink-float` · bands lap, toddler, preschool, pre-K, school · levels 1–7 on 2026-11-01 · session `claude/dive-sink-or-float`, [PR #1101](https://github.com/rjdunlap/neo/pull/1101)*

## The game today

Things arc into a water tank: floaters bob at the surface, sinkers drift down trailing bubbles and clunk on the bottom. Learning: predict, test and sort by a property she can only find out by trying; guesses are never misses. Home land Bubble Beach. Couch play uses level 6 only (`src/couch/catalog.ts`: guess with left/right, team face-off). Each thing that really goes into the water files a discovery-journal entry (nine of the journal's thirty-one).

| Level | Plan (`SINK_PLANS` in `logic.ts`) | Band windows | What she decides |
| --- | --- | --- | --- |
| 1 | `drop`, 5 things | lap | Which thing to drop next |
| 2 | `say`, 5 things, the voice names each result | lap, toddler | As 1 |
| 3 | `guess`, 5 familiar things, unscored | toddler, preschool | Float or sink, before each test |
| 4 | `sort`, 5 familiar things into two baskets | toddler, preschool, pre-K | Which basket (a wrong sort is a miss, tested in the water, then moved) |
| 5 | `sort`, 6 with surprises | preschool, pre-K, school | As 4, with the apple, leaf, coin and spoon |
| 6 | `guess`, 6 with surprises, unscored | pre-K, school | Float or sink for surprising things |
| 7 | `shape`, *Make it float*, two clay experiments | school | Flat, boat or leaky boat ([definition](../definitions/make-it-float.md)) |

`levels()` is a plain min/max function (lap 1–2, toddler 2–4, preschool 3–5, pre-K 4–6, school 5–7); there is no `order` or `entryLevels`.

**Content pools.** `THINGS` holds nine: obvious floaters duck, boat, ball; obvious sinkers rock, key; surprises leaf and apple (float), coin and spoon (sink). `thingsFor` takes `min(count, pool)` from the filtered pool, so **levels 1–4 show the same five things (duck, boat, ball, rock, key) every round**; only the order changes. With surprises the pool is nine and a round shows six. Level 7 draws three shape tiles in a seeded order and two of five clay colours.

**Known gaps.**
- The five-thing repeat above is the main content gap at the lap-to-preschool levels, where most rounds are played.
- `logic.test.ts` pins the seeded draws of levels 1–6 ("draws the same things … as before Make it float"); adding to `THINGS` changes every draw, so a content slice must re-pin that test on purpose (no save stores a draw, so nothing breaks).
- The journal is derived from `ALL_THINGS` (`src/content/journal.ts`), so every new thing adds a journal entry, a `journal.sink.*` line and art for the card; the "thirty-one observations" count in the [roadmap](../ROADMAP.md) moves with it.
- `sink.guess` speaks `{thing}` through a slot, so new names use device speech until slotted clips (V3).
- Level 7's couch ring branch is not reached by island keys (recorded in [GAMES.md](../GAMES.md#sink-or-float)).
- The off-screen bath-time card does not yet say the grown-up stays within reach ([off-screen study](subjects/off-screen-companions.md)); that belongs to the band-keyed `offScreenFor` work, not here.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| *Sink or Float* in PBS KIDS Play & Learn Science ([Brooklyn Public Library tech-play recipe](https://www.bklynlibrary.org/blog/2020/05/08/tech-play-recipe-sink-or); summary only, no PBS page opened) | Preschool app activity | Guess, drop, see; the recipe pairs it with a real tub of water and household objects | The app-then-tub pairing, as the game's off-screen card already does | Nothing harmful noted |
| *Objects Float or Sink in Water* ([App Store](https://apps.apple.com/us/app/objects-float-or-sink-in-water/id1621278768)) and Twinkl's *Everyday Items* ([resource](https://www.twinkl.com/resource/everyday-items-sink-or-float-interactive-game-au-st-1708425848)); summary only | Quiz-style sort | More objects, the same question | A broad pool of everyday things | Right/wrong scoring of a prediction; text answers |
| Khan Academy Kids circle time, *Sink or Float* ([video page](https://amara.org/videos/0KR4yZ1sKRvO/info/sink-or-float-water-science-experiment-for-kids-surfs-up-circle-time-with-khan-academy-kids)); summary only | Shown experiment | A grown-up predicts aloud, tests and explains | The pet's spoken "now we know" after a surprise | A video she only watches |
| PhET *Buoyancy: Basics* ([PhET](https://phet.colorado.edu/en/simulations/buoyancy-basics); the page body did not load, so summary only from a mirror's goals) | Upper-elementary simulation | Blocks of set mass and volume, fluids of different density; predict sink or float from both | Changing one thing (the liquid) with the same object; two tanks side by side | Numbers for density and force below school; sliders as the main action |
| Foil-boat penny challenge ([Science Buddies](https://www.sciencebuddies.org/stem-activities/aluminum-foil-boats-float) (blocked to the fetch, summary only); [Little Bins for Little Hands](https://littlebinsforlittlehands.com/penny-boat-challenge/); [UT Girl Day](https://girlday.utexas.edu/activity-utwme-foil-boat-challenge)) | Classroom engineering | Same foil, change the hull; add pennies one at a time until it sinks; compare counts | Load one at a time, the boat sitting lower each time; compare two hulls | Competition, a race against other children |
| Classroom float-and-sink tubs ([PreKinders](https://www.prekinders.com/float-and-sink/); [Play to Learn Preschool](https://playtolearnpreschool.us/sink-or-float-experiment/)) | Physical play | Predict on a chart, test, sort into two groups; the floating orange (peel on) as the classic surprise | A picture chart of predictions and results | — |

**What the research says.** Young children anchor on weight: "heavy sinks, light floats", one feature at a time ([summary of preschool studies](https://wordpressua.uark.edu/scimap/?p=543); a [Frontiers in Psychology 2020 study](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2020.01665/pdf) found common-object predictions rest on a single feature, while novel cubes drew more mass-and-volume reasoning; both read as summaries only). Hands-on play alone does not move the idea much; a scaffold that points at the material helps ([NTNU scaffolding study](https://scholar.lib.ntnu.edu.tw/zh/publications/using-scaffolding-strategies-to-promote-young-childrens-scientifi-2/), abstract only). That is the case for a **big-and-small** level: the same material at two sizes behaves the same, which breaks the weight rule without a lecture. NGSS 2-PS1-1 (classify materials by observable properties) and 2-PS1-2 (test materials for a purpose) fit the sorting and boat levels. The oceans study cited 5-ESS2-2 for Salty or Fresh, but that standard is about how much of Earth's water is salt or fresh and where it is, not buoyancy; Salty or Fresh should be justified by the game's own stated model instead.

## What makes sense here

The game's strength is a one-tap experiment with an honest answer from the water. Depth should keep that loop and widen *what* she tests: more everyday things (fresh content at every band), then things that break her own rule (big and small of one material), then changing the water instead of the thing (salty or fresh), then how much a boat carries (Build a Boat) and the rework's raft. Every new level keeps predictions unscored; only sorting and an evidence question ("which tank has the salt?") have a right answer.

The arc: lap and toddler drop and hear (1–2), toddler to pre-K guess and sort with a broader pool (3–6), pre-K and school test their size rule (new level 9), school changes the water (10), shapes clay (7), loads a boat (11) and floats the garden raft (8, decided).

**Handoffs answered.**
- **Salty or Fresh** ([oceans](subjects/oceans.md), [recommendation](subjects/RECOMMENDATIONS.md)): **in**, as level 10, defined in its own docs-only session (below). The stated model extends Make it float's: the same cupful of salty water weighs more than fresh, so it holds a thing up higher. The egg that sinks in fresh water and floats in very salty water is the classic, true demonstration.
- **Garden Raft** ([engineering design](subjects/engineering-design.md), decided 2026-10-23 as level 8 after a float-model check): **in, unchanged**. Level ID 8 stays reserved for it; its definition stays engineering's slice 3. Nothing in this dive takes ID 8.
- **Build a Boat** ([PHYSICS-GAMES](../PHYSICS-GAMES.md), [IDEAS](../IDEAS.md)): **in**, as level 11, defined after the Garden Raft definition so both share one load-and-waterline model.
- **Magnet Fishing** ([IDEAS](../IDEAS.md)): **out** of this game. Magnetism is a different property with a different action (pull, not drop); it stays an IDEAS candidate.
- **Repeat a test, a picture table** ([roadmap rows](../ROADMAP.md)): **in** through level 9's two-trial row and level 11's marble counts; no general results table.
- **Bath-time card, grown-up within reach** ([off-screen study](subjects/off-screen-companions.md)): **deferred** to that study's `offScreenFor` work; noted under known gaps.

## Experience and presentation

- **First unsupported action:** at level 1, any tap on a thing drops it; nothing is wrong.
- **Feel:** touch-down gives the arc at once; the splash, bob or bubble trail and clunk are the consequence; the thing stays in the tank, so the round ends with a picture of what floated and what sank.
- **Concrete code-drawn example: a waterline tick.** A short white tick on `tankFront`'s glass marks the water level; each thing that goes in nudges the water and the tick up a few units with a soft rising tone. It makes "pushes water out of the way" visible at every level without numbers, and at level 11 the same tick shows a loaded boat sitting lower. Keep it qualitative: "a little higher", never a measured volume.
- **Variety without a new rule:** the broader pool (batch 1) varies levels 1–4; tank positions, clay colours and the pairs in level 9 are seeded.
- **Reasoning versus motor:** taps and one drag (sort) on 120-unit things; no precision. Reading never needed.
- **Supported ending:** guesses never count; a wrong sort is shown in the water and then placed; hints glow. Each level ends with the tank's picture and the pet's "What a good scientist!".
- **Co-play:** one guesses aloud, the other taps; the couch's team guess already does this at level 6.
- **Person or device:** whether a toddler predicts at all at level 3 (or just taps), whether the waterline reads as "the water moved", and whether level 9's surprise lands with a four-year-old.

## Proposed ladder

### Fresh content inside existing levels

**Fresh things** (batch sink-float 1). Add things whose behaviour in plain tap water is unambiguous, so the obvious pool reaches seven and a five-thing round varies:
- obvious: **feather** (floats), **marble** (sinks);
- surprises: **wooden log** (big, floats), **ice cube** (hard, floats), **paperclip** (tiny, sinks).

Avoid crayons, buttons, sponges that soak, open cups and fruit that varies (grapes, carrots). Each gets `thingArt`, a `journal.sink.*` line and journal ordering (floaters first, as now); the pinned-draws test is replaced by property tests (both kinds in every round, surprises only where asked, every thing's `floats` matches a reviewed table, a five-draw at levels 1–4 differs across seeds). `tankArt`'s icon picks may stay as they are. The couch's level 6 inherits the pool unchanged.

### New levels on top

IDs 8 (Garden Raft) and 11 (Build a Boat) are reserved; 9 is the first to build. `SINK_PLANS` is a positional array clamped by level, so level 9 cannot ship before 8 without converting the plans to a table keyed by level ID and moving the bands to `order` (`order` lists only built IDs). That conversion belongs to level 9's slice.

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 8 | *Garden Raft* (decided, engineering's) | school | Defined in engineering's slice 3 | — | — | — | Float-model check first |
| 9 | *Big and small* | pre-K (`order [4, 5, 9, 6]`), school (`[5, 6, 9, 7]`) | Three pairs of one material at two sizes (log and twig, rock and pebble, big ball and small ball); the big one is tested, then she guesses the small one, then tests it | Does size change it? | Guesses unscored; after a surprise the pet says "Big or small, wood floats" (the material's line); misses and hints always 0 | Every pair shares one material and one result; the shown member differs in size by at least 1.6x; pairs are seeded, three per round, never repeated | Twig, pebble and small ball art; three material lines; `order` and keyed plans; bot taps the right guess; no journal entries (the things already have them, and a sorted pair adds nothing) |
| 10 | *Salty or fresh* (define first) | school | Two tanks, one with a salt shaker beside it; the same duck goes in both and sits higher in the salty one; then an egg sinks in one plain tank and floats in the other | Part 1 unscored; part 2: which tank has the salt? | Part 2: a wrong tank is a boing and "Salt water holds things up higher"; the glow after two | The egg's result follows the tank; the salty tank's floater sits higher by a visible margin | Two tanks in portrait; egg and salt art; voice lines; the model note on the how-to card |
| 11 | *How much can it carry?* (Build a Boat; define after Garden Raft) | school | Two foil boats from one sheet, wide and narrow; guess which carries more, then tap marbles in one at a time; each sits lower until water comes over the side | Which hull carries more; later, which of three carries a set load | Guesses unscored; a set-load boat that sinks is a retry, not a miss | Every round has a hull that carries the load; counts are monotonic with width in the stated model | Shares the raft's load model and the waterline; marble art exists from batch 1 |

### Younger-band openings

None needed: lap already plays 1–2. The fresh things reach lap and toddler through levels 1–4.

### Easier entries and levels between existing ones

Level 9 sits between 5 and 6 for pre-K and between 6 and 7 for school through `order`; no `entryLevels` change, since entries stay 1 and 2.

### Left out on purpose

- Density numbers, sliders or Archimedes' name below the `grownup` band.
- Sinking things on a timer, "how fast" scores, or counting a prediction as wrong.
- Magnet Fishing (a different property), and melting or dissolving (the matter study's Melt and Freeze and Stir and See own those).

## Decisions for the developer

None new. Garden Raft keeps level ID 8 as decided 2026-10-23; this dive builds level 9 around it rather than renumbering.

## Build slices, in order

1. **Fresh things** (batch sink-float 1; existing-interaction tier plus art): typecheck, the game's rule tests and the journal tests, one filtered regression play of level 4 on a seed with a new thing and of level 6 with a new surprise, one portrait screenshot of the new art in the tank, `npm run build` (journal and voice lines are shared). Bot unchanged.
2. **Level 9 *Big and small*** (batch sink-float 2), after batch 1 (the log and pebble art; new-level tier with `order`: typecheck, unit tests including order, lands and the keyed-plan clamp, one play of level 9 at school with a surprise guess, `fingerdemo` at 9, one portrait screenshot).
3. **Define Sink or Float 10 *Salty or fresh*** (docs only; status `define`): the stated model and its how-to note, the two-tank portrait layout, the egg, part 2's accounting and hint, the check tier.
4. **Define Sink or Float 11 *How much can it carry?*** (docs only), after engineering's Garden Raft definition: one load and waterline model shared with level 8.
5. Garden Raft (level 8) stays engineering design's slice 3.

## What was built in this session

Nothing: research only. Checks: `node scripts/check-links.mjs` and `git diff --check`.
