# Patchwork Conservatory: Sprout Shuffle levels 7–8 (definition G7)

Defined 2026-10-31 as slice **G7** of the [genetics study](../deep-dives/subjects/genetics.md#build-slices-in-order), from its [Patchwork Conservatory case](../deep-dives/subjects/genetics.md#patchwork-conservatory-later-parent-puzzle) and the [recommendation](../deep-dives/subjects/RECOMMENDATIONS.md#genetics-recommendations) to define it "later within Sprout Shuffle". It appends two levels to the [Sprout Shuffle definition](sprout-shuffle.md) (G1, levels 1–3, built) after the [Hidden Sprouts definition](hidden-sprouts.md) (G5, levels 4–6, defined, not built), and changes nothing in levels 1–6. Docs only: no level, voice line, save field or band exists yet. The build waits on levels 4–6 being built, because a level range is `min..max` and level numbers are never renumbered; it uses the October 23 standing rules (the building session's source check replaces a named reviewer, school-top placement, no 13+ entry), so it needs no new developer call.

**Fun action and purpose:** a friend wants a conservatory bed where every sprout is spotted *and* has a coloured rim. She plants two of the bench plants side by side, looks through a spots lens and a rim lens at every way their sprouts can grow, and finds a pair that can never miss. The plant that already looks just right turns out to be a risky parent, because it carries copies that do not show. At the top level two different pairs both work, and either is a good plan. The learning goal is reasoning with a model over every outcome: a *guarantee* means no route fails, each trait has to be guaranteed on its own, and a plant's look does not tell you every copy it can give. Anchors are the study's NGSS MS-LS3-2 (one copy from each parent, modeled with diagrams) and practices 2 and 6 (using models, constructing explanations). They are content anchors, not proof the levels teach them.

**Why a Sprout Shuffle mode, not a new game.** The study allows a separate title only for a distinct implemented action. Here the action is new (choose the parents, then inspect one trait at a time), but the model, tiles, fans and accounting are Sprout Shuffle's, and the guarantee over two traits is exactly two one-locus checks. So it stays inside `sprout-shuffle` as levels 7–8, named *Patchwork Conservatory* on the grown-up card. No new game ID, land spot or registration.

## The model: G1's rule twice, declared independent

The spot rule is G1's, unchanged. One new marking is added with the same kind of rule, and the two are declared independent in this toy.

| Marking | Copies | Tile (shape tells the marking, marks tell the copy) | Letter (grown-up aid) | Shows when | Spoken as |
| --- | --- | --- | --- | --- | --- |
| Spots (G1) | spot, plain | **Round** cream tile: three dark ovals, or an empty outlined ring | `A`, `a` | at least one spot copy | "a spot copy", "a plain copy" |
| Rim (new) | rim, no-rim | **Petal-shaped** cream tile: a thick coloured edge, or a thin dotted outline | `B`, `b` | at least one rim copy | "a rim copy", "a no-rim copy" |

- **Each plant holds two copies of each marking,** four tiles in its tray: two round, two petal-shaped. A plant's look is the pair of looks: spotted or plain, rimmed or not.
- **Each parent gives one copy of each marking.** For one marking, a pair of parents has G1's four routes. The two markings are given **independently in this toy**: which spot copy a parent gives says nothing about which rim copy it gives. The grown-up note says this is a rule chosen for the game, true of some real gene pairs and not of others (genes close together on a chromosome tend to travel together), and never says genes in general sort independently.
- **The guarantee does not lean on independence.** A pair guarantees "spotted and rimmed" exactly when every spot route is spotted and every rim route is rimmed, whatever the link between the markings. Independence only matters for which *mixtures* can appear (spotted with no rim, say), and these levels never ask that. The rule tests check both facts, so a later level that does ask about mixtures starts from a tested model.
- **Never sixteen at once.** The sixteen combined routes are never drawn. She inspects one marking at a time: four buds, as in G1.
- **Words.** *Dominant*, *recessive*, *gene*, *allele*, *dihybrid* and *Punnett* stay out of her lines; the grown-up note may use them as G1's note does. Rim colour is seeded and carries no meaning; the rim edge and dotted outline carry it. Nothing is "better", "stronger" or "rare": the friend just wants this look for a bed.
- **Left out on purpose:** linked markings, more than two markings, blending, mutation, percentages, counting how many of the sixteen work, and any real flower or animal. The saved companion is never a parent; bench plants exist only inside the round; no garden persists ([RW work items](../rework/WORK-ITEMS.md)'s no-speculative-breeding rule).

`logic.ts` adds pure functions beside G1's, generalising without changing G1's: `Plant2 = { spots: Genotype, rim: Genotype }`, `looks2(plant)`, `locusRoutes(left, right, 'spots' | 'rim')` (G1's `routes` on one marking), `guaranteed(left, right, brief)` (true when `always` holds on every marking the brief names), `failingRoute(left, right, brief)` (the first marking and route that misses the brief, or null), `acceptedPairs(bench, brief)` (every unordered pair of distinct bench plants that is guaranteed), and `combinedRoutes(left, right)` (all sixteen, for tests only). Benches are authored; plant positions, rim and petal colours, and which pot each plant lands in are seeded.

## Screen and controls

- **Brief card.** Top centre, 260 × 180: the friend from `CRITTERS` beside a sprout that is spotted with a rim, and a short row of the same sprout behind it. Pressing it repeats the brief: "Every sprout spotted, and every one with a rim, please."
- **Bench.** The authored plants stand along the bottom as **plant cards** (200 × 240), spread with `spread(n, 150, view.w - 40, gap)` so the bottom-left pet stays clear; each card shows the plant's petals and its tray of four tiles. Pressing a card depresses it and speaks the plant's copies ("two spot copies, two no-rim copies").
- **Two pots** sit in the middle, about x = 0.38·w and 0.62·w. Tapping a bench plant moves it into the first empty pot along a short arc; a drag with `src/engine/drag.ts` onto either pot does the same. Tapping a potted plant sends it back to its bench place: that is the undo, and it is free. A plant cannot be in both pots; with both pots full, tapping a third bench plant swaps it into the pot most recently filled. A drop anywhere else springs back silently. Cancelling, leaving the screen and resizing cancel a pending drag.
- **Two lenses** appear under the pots once both are full: a **spots lens** (a round magnifier showing a round tile) and a **rim lens** (showing a petal tile), each 130 units. Pressing one opens that marking's four-bud fan over the bench (G1's bud cards, 180 × 200, with arrows from the exact source tiles, closed until tapped). Only one lens is open at a time; the other marking's tiles dim in the trays. A close button (100 units) or the other lens closes it. Opening, closing and tapping buds are free, and nothing is marked on the brief card: she reads the fan herself.
- **Check** (G1's green leaf, 140 units) appears once both pots are full. Before that it is not drawn, so an empty Check cannot happen.
- **Portrait.** Brief card at the top, pots and lenses in the middle third, the bench as a row (three plants) or 2 × 2 (four plants) in the lower third; an open fan covers the bench as a 2 × 2 grid, so bench cards are hidden, not shrunk, while a lens is open. Every control stays at least 100 logical units in both orientations; tiles inside cards are not touch targets.
- **Speech, feel and sound** follow G1: `ctx.instruct` for the brief and each phase, choice and plant cards speak on press, a pentatonic pluck on planting, G1's music style.

## Level 7: one pair never misses

**Bench (authored, three plants):**

| Plant | Copies | Looks |
| --- | --- | --- |
| Spotted, no rim | `AA bb` | spotted, no rim |
| Plain, rimmed | `aa BB` | plain, rimmed |
| Spotted, rimmed | `Aa Bb` | spotted, rimmed, just like the brief |

**Instruction:** "Plant two that will always make sprouts like this. Look through the lenses to see every way."

| Pair | Spots routes | Rim routes | Guaranteed? |
| --- | --- | --- | --- |
| `AA bb` × `aa BB` | 4 of 4 spotted | 4 of 4 rimmed | **yes, the only accepted pair** |
| `AA bb` × `Aa Bb` | 4 of 4 spotted | 2 of 4 rimmed | no: rim fails |
| `aa BB` × `Aa Bb` | 2 of 4 spotted | 4 of 4 rimmed | no: spots fail |

1. She plants any two and opens either lens as often as she likes.
2. **Check.** The accepted pair: both lenses open in turn with every bud lit ("Every way spotted. Every way a rim."), then the bed fills with spotted, rimmed sprouts: "These two can only make sprouts like this." Then `ctx.finish`.
3. **Check with a pair that can fail** is one miss: the boing, then the failing marking's lens opens by itself and its failing route replays its two paths. For `AA bb` × `Aa Bb`: "This way, both give a no-rim copy. That sprout has no rim." For `aa BB` × `Aa Bb`: "This way, both give a plain copy. That sprout is plain." Then the plant that looks like the brief pulses once: "This plant has spots and a rim, but it carries a plain copy and a no-rim copy too." The pots stay as they are; she changes them herself.

The trap is the point. The obvious choice includes the plant that matches the picture, and both pairs with it can fail; the two plants that each show one trait, and nothing hidden, can never fail.

## Level 8: two good plans

**Bench (authored, four plants, six pairs):**

| Plant | Copies | Looks |
| --- | --- | --- |
| Spotted, no rim | `AA bb` | spotted, no rim |
| Plain, rimmed | `aa BB` | plain, rimmed |
| Spotted, rimmed | `Aa BB` | spotted, rimmed |
| Plain, no rim | `aa bb` | plain, no rim |

| Pair | Spots | Rim | Guaranteed? |
| --- | --- | --- | --- |
| `AA bb` × `aa BB` | always | always | **yes** |
| `AA bb` × `Aa BB` | always | always | **yes** |
| `AA bb` × `aa bb` | always | never | no: rim fails |
| `aa BB` × `Aa BB` | 2 of 4 | always | no: spots fail |
| `aa BB` × `aa bb` | never | always | no: spots fail |
| `Aa BB` × `aa bb` | 2 of 4 | always | no: spots fail |

**Instruction:** as level 7.

1. **Check with either accepted pair** is a success, spoken and shown as at level 7. Equivalent plans are both right; the round never asks for one in particular.
2. **Another way? (free).** The bed fills, the pots empty, and the pet asks: "Is there another pair that always works?" A Finish leaf (140 units) is drawn at once. Planting the *other* accepted pair and pressing Check grows a second bed beside the first: "Two different plans, and both always work." A Check with a pair that can fail here gets the same spoken counterexample as step 3 of level 7 with no boing and **no miss**; re-planting the pair already found says "That's the plan we found. Can you find a different one?" and is free. Finish, or the second bed, ends the round through `ctx.finish`.
3. **Check with a pair that can fail before the first success** is one miss, explained as at level 7. Note the contrast with level 7: here the spotted, rimmed plant (`Aa BB`) *can* be part of a plan, because its rim copies are both rim. The pet says so if she finds that pair: "This one has two rim copies, so it always gives a rim."

Rule tests (levels 7–8): `acceptedPairs` equals the tables above for both benches; every rejected pair's `failingRoute` names a marking the brief asks for and its route really makes the missing look; every accepted pair has every route of both markings showing the brief; `guaranteed` agrees with a brute-force check over `combinedRoutes` (all sixteen combined routes show both traits) for every pair of every bench; under the declared independence, the set of combined looks equals the product of the two markings' supports for every pair; level 7 has exactly one accepted pair and it excludes the plant that shows both traits; level 8 has exactly two accepted pairs and one of them includes a plant that shows both traits; no bench plant is the saved companion; seeded presentation never changes a plant's copies.

## Accounting, help and finishing

G1 and G5's rules carry over, with the new free actions named:

- **Never a miss:** planting, swapping or un-planting a plant, a stray drop, pressing a plant or brief card, opening a lens or tapping a bud, anything in level 8's *Another way?* step, and an instruction repeat.
- **A miss:** a Check with a pair that can fail, before the round's first success. One miss per Check, with the boing and the spoken counterexample. Check is never drawn without two plants potted.
- **A hint:** the glow at the second miss (the accepted pair's plant cards glow; at level 8, the accepted pair sharing a plant with what is potted, else `AA bb` × `aa BB`), and the first use of Show me (in the pause sheet, `askForHint`), which plants an accepted pair and pulses Check. She presses Check herself.
- **Finish:** one brief per round through `ctx.finish({ misses, hints })`, one sticker, with or without help. The beds are a moment, not a creation: nothing is saved, filed in the journal or added to the companion. Leaving or replaying resets the round.
- **Adaptation** is the shell's unchanged rule. Level 8 is the top; two struggling rounds there step down to 7, and two at 7 step down to 6.

## Registration and couplings (proposed)

- **Levels:** appended to `sprout-shuffle`, `school: { min: 1, max: 8 }` once both are built (Hidden Sprouts leaves `max: 6`; this batch widens it to 8, in order). No `order`, no renumbering, no other band. **Older destination:** school top, reached by stepping up or a grown-up's pin, with "about 11 and up" on the grown-up card, as the October 23 decision put 11–12 at the school top. A 13+ player plays it through a pin on a school profile; a `grownup` registration or Lantern Lake entry is a later shell decision ([G5 decision 3](hidden-sprouts.md#open-decisions)), not this slice's.
- **Land:** none changes; the game already lives in Rainbow Meadow.
- **Art.** Pixi `Graphics` in `palette.ts` colors: G1's plants and round tiles; new petal-shaped tiles (thick seeded-colour edge, or a thin dotted outline); a rim drawn as a band around each petal; two terracotta pots; two brass-ringed lenses; a wooden bed that fills with sprouts. New art, not reused from the pet or Bug Builder.
- **Voice lines** under `sprout.*`, added to G1 and G5's: `pc-brief`, `pc-plant-two`, `pc-lens-spots`, `pc-lens-rim`, `pc-every-spotted`, `pc-every-rim`, `pc-always-works`, `pc-counter-rim`, `pc-counter-plain`, `pc-hidden-copies`, `pc-two-rim-copies`, `pc-another-way`, `pc-same-plan`, `pc-two-plans`, plant-copy readings for each authored plant, and the hint lines. Wording is checked in the building session against the sources below, as decided 2026-10-23.
- **How-to card.** The whole-ladder goal from G5 stays. Steps as `LevelLine`s: plant two from the bench, look through the spots lens and the rim lens, then Check (7–8); find a second plan if you like, or Finish (8). Notes (7–8): the toy's two markings are given independently, a rule chosen for the game; a plant's look does not show every copy it carries; either working pair is right.
- **Ghost finger** (`autotouch()`): level 7 taps `AA bb`, then `aa BB`, opens the spots lens and the rim lens, then Check; level 8 does the same with `AA bb` and `Aa BB`, then Finish. It never makes a miss, so its demonstration shows the lenses, not the trap.
- **Co-play:** one person picks a pair and says "always"; the other opens the lenses to check it. **Off-screen:** none new; G8 decides any card.
- **Overlap.** Species Comeback's pedigrees read relatedness off a tree and have no traits or loci; the two never share a helper ([its definition](species-comeback.md)). Garden Grow's conditions are G8's subject. Mossy Path and Rule Machine's "test every case" rhyme in spirit only.

## Sources checked (2026-10-31)

The toy rule and its wording were checked against reputable sources, as the October 23 decision asks of the session:

- OpenStax, [*Biology 2e*, 12.3 Laws of Inheritance](https://openstax.org/books/biology-2e/pages/12-3-laws-of-inheritance) (Rice University, opened): independent assortment as "genes do not influence each other with regard to the sorting of alleles into gametes", the 4 × 4 dihybrid square of 16 equally likely combinations, multiplying along forked-line paths, and the caveat that genes "physically close to each other on the same chromosome are more likely to be inherited as a pair". Consequences: the declared-toy-rule wording, the linkage sentence in the grown-up note, and a guarantee computed per marking.
- NGSS [MS-LS3-2](https://www.nextgenscience.org/pe/ms-ls3-2-heredity-inheritance-and-variation-traits) and NHGRI [Introduction to Genomics](https://www.genome.gov/About-Genomics/Introduction-to-Genomics), as opened by the study on 2026-10-16: invented plants, no real-human traits, no claim of covering the whole expectation.

The building session repeats the check for its final voice lines and records it in its VERIFICATION entry.

## Reference games

Read, none played: [Geniventure](https://learn.concord.org/geniventure) (Concord Consortium) asks players to breed drakes that match a target with several traits, the nearest model for a brief; Animal Crossing's hybrid flowers ([guide](https://nintendolife.com/guides/animal-crossing-new-horizons-flowers-how-to-grow-and-breed-hybrids-and-gold-roses-explained)) show that a parent that looks right can carry hidden copies, the source of level 7's trap; [Niche](https://store.playstation.com/en-us/concept/10002186) shows the appeal of reading copies before pairing, without its pressure. All three were already read by the G5 session.

## Open decisions

None blocks the build; each default stands unless the developer changes it.

1. **Bench size.** Three plants at 7 and four at 8 (default), or four at both. Four at 7 would add a second trap pair but more to read.
2. **Another way? at level 8.** Free and optional (default), or required, with the second plan graded. Required would test the same reasoning twice.
3. **Show me at level 8** plants the accepted pair sharing a plant with what is potted, else `AA bb` × `aa BB` (default), or always `AA bb` × `aa BB`.

## Checks for the builds

- **Levels 7–8 (one batch, after Sprout Shuffle level 6 is built):** new-interaction tier (the bench, pots and lenses are new). Typecheck; unit tests (the rule properties above, how-to and registry); one filtered scripted play of level 7 with a Check on `AA bb` × `Aa Bb` (one miss and its counterexample), a second miss and the glow, then the accepted pair, and of level 8 with both plans found; one portrait screenshot with a lens open; `fingerdemo` at 7 and 8; build, because the voice and how-to files change.
- **Device and person checks, open until done:** whether round and petal-shaped tiles read as two markings without letters or colour, whether "a rim copy" and "a no-rim copy" are clear by ear, whether a child reads "always" across two lenses unaided, whether level 7's trap reads as a discovery rather than a trick, and whether picking parents reads as controlling reproduction. None is established here.
