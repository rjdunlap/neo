# Hidden Sprouts: Sprout Shuffle levels 4–6 (definition G5)

Defined 2026-10-18 as slice **G5** of the [genetics study](../deep-dives/subjects/genetics.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/genetics.md#first-games-proposed-ladder-sprout-shuffle) and the [Hidden Sprouts case](../deep-dives/subjects/genetics.md#hidden-sprouts-one-older-family-case). It appends three levels to the [Sprout Shuffle definition](sprout-shuffle.md) (G1) and changes nothing in levels 1–3. Docs only: no game, ID, voice line, save field or band exists yet. **Not ready to build.** The builds (level 4 after G3, level 5 as G6, level 6 after it) wait on levels 1–3 being built and on the G1 calls (a reviewer, the school entry window, the level 1 accounting and the home land), plus the placement call below. Each open call has a default the build uses, listed in [Open decisions](#open-decisions) and tracked in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md).

**Fun action and purpose:** a spotted plant arrives with a sealed seed packet over its tray, so nobody can see which two copies it holds. She waters it beside a plain plant whose copies are known, watches its sprouts grow onto a record card, and keeps every pair of copies that could have made those sprouts. Sometimes the sprouts settle it. Sometimes they cannot, and "we can't tell yet" is the right answer. At the top level she chooses which known plant to water it with, and finds that one of them could never tell her anything. The learning goal is evidence against a model: a hidden thing can be worked out from what it makes, a result that could come from both explanations rules out neither, and a good test is one whose outcomes differ between them. Anchors are NGSS 3-LS3-1 and MS-LS3-2 for the model (as in G1) and NGSS practices 4 and 6 (analyzing data, constructing explanations) plus the [inquiry study](../deep-dives/subjects/inquiry.md)'s "a test that could separate two explanations." They are content anchors, not proof the levels teach them.

## The model (unchanged) and three new pieces

The toy rule is exactly G1's: two kinds of copy (spot `A`, plain `a`), two copies per plant, one spot copy is enough for spots, each parent gives either copy with equal chance, four routes per pair. Nothing is added to the biology. Three new screen pieces carry the new levels:

| Piece | What it is | Rule it shows |
| --- | --- | --- |
| **Hidden plant** | A spotted plant whose tray is covered by a seed packet with a question mark; its two tiles are face down | It is spotted, so it has at least one spot copy: it is `AA` or `Aa`, and nothing else. Both candidates are drawn on two **candidate cards**, with their tiles face up |
| **Tester** | A known plant with an open tray, standing in the other pot. Level 5 always uses plain `aa`; level 6 offers `AA` and `aa` | Its copies are known, so every sprout's look tells which copy the hidden plant gave |
| **Record card** | A long garden label under the pots with eight sprout slots. Watering grows sprouts into it, left to right | A candidate is **compatible** with the record when every sprout on the card is one its fan with the tester could make. The record is read by enumeration, never by counting how often a look appears |

Two facts the record can show, and the pet says in plain words:

- Against `aa`, a **plain sprout** rules out `AA`: no route of `AA × aa` makes plain. "Two spot copies can never make a plain sprout. So it has one spot copy."
- **Spotted sprouts rule out nothing**, however many there are: `Aa × aa` makes spotted by two of its four routes. "One spot copy can make spotted sprouts too. Three spotted sprouts don't tell us which."

`logic.ts` adds pure functions beside G1's: `compatible(candidate, tester, record)` (every look in the record is in `support(routes(candidate, tester))`), `candidates(tester, record)` (the compatible subset of `[AA, Aa]`), `couldTell(tester)` (true when some look is in one candidate's support and not the other's), `pairsAlways(pool, look)` for level 4, and `counterexample(...)` for each miss below. Cases are authored; which case a round plays, plant positions, petal colors and the order of cards are seeded.

## Level 4: which pairs always make spotted?

A warm-up for reading a whole fan as one claim, before a fan has to be read backwards. A friend from `CRITTERS` stands by an empty flower bed holding a picture of spotted sprouts: "Spotted sprouts for the whole bed, please. Every one!" Three **pair cards** (220 × 200 units, spread with `spread(3, 150, view.w - 40, gap)`) each show two plants with open trays. Tapping a card's small magnifier opens that pair's four-bud fan in the top half, replayable and free. Pressing the card itself toggles it and speaks its plants' copies.

Authored pools (one per round, seeded):

| Pool | Pairs | Accepted |
| --- | --- | --- |
| A | `AA × aa`, `Aa × aa`, `aa × aa` | `AA × aa` |
| B | `AA × Aa`, `Aa × Aa`, `aa × aa` | `AA × Aa` |
| C | `AA × AA`, `Aa × aa`, `AA × aa` | `AA × AA` and `AA × aa` |

"Choose every pair whose sprouts are always spotted." Check with the wrong set is one miss. For a chosen pair that is not always spotted, its plain route replays: "This way, both give a plain copy. That sprout is plain." For a missed pair that is always spotted, its fan opens with all four buds spotted: "Every way makes spots." Pool C's two accepted pairs show that a brief can have more than one answer; equivalent choices are accepted. Accepted: "Those pairs can only make spotted sprouts." Then `ctx.finish`.

Rule tests: `pairsAlways(pool, 'spotted')` equals the table; every pool has at least one accepted and one rejected pair; a rejected pair's counterexample route really makes plain; an accepted pair's fan has four spotted buds.

## Level 5: Hidden Sprouts

**Cast:** the hidden plant in the left pot, tester `aa` in the right pot with its tray open, a **watering can** (130 units) between them, the empty record card, and the two candidate cards (200 × 200) at the bottom. "This plant's copies are a secret. Let's grow its sprouts and find out." The grown-up letters on the candidate cards read `AA` and `Aa`; the spoken names are "two spot copies" and "one spot copy, one plain."

Two authored cases, seeded per round, with the same first half:

| Step | Case **one spot copy** (hidden `Aa`) | Case **two spot copies** (hidden `AA`) |
| --- | --- | --- |
| 1. Water | Three sprouts grow, 0.5 s apart: spotted, spotted, spotted | The same |
| 2. Choose | "Which copies could the hidden plant have? Choose every one that could." Accepted: **both** cards. The pet: "Both could. We can't tell yet." A *Can't tell yet* banner rises over the packet | The same |
| 3. Water again | Three more: spotted, **plain**, spotted (order seeded; the plain sprout bounces once) | Three more, all spotted |
| 4. Choose again | Accepted: **`Aa` only**. "A plain sprout! Two spot copies can never make plain. It has one spot copy." | Accepted: **both**, still. "Six spotted sprouts, and still both could. The sprouts can't tell us." |
| 5. Reveal | The packet peels open on `Aa`: "One spot copy and one plain, just as the plain sprout told us." | The packet opens on `AA`: "Two spot copies. Spotted sprouts alone could never tell us for sure." |

Step 2 is the heart of the level and is graded: choosing one card alone and pressing Check is one miss. Excluding `Aa`: the `Aa × aa` fan opens and its two spotted routes pulse: "One spot copy can make spotted sprouts too. Those three sprouts don't rule it out." Excluding `AA`: the `AA × aa` fan opens, all spotted: "Two spot copies make spotted every way. Those three sprouts fit." Step 4 is graded the same way; in the first case, keeping `AA` after a plain sprout is a miss, and the plain sprout on the record pulses while the `AA × aa` fan opens with no plain bud: "No way here makes plain, so it can't be two spot copies."

"Both" is not a third card. Choosing every card that could is the honest answer when the evidence does not decide, and the pet and the banner say so out loud, which is what the study's "evidence does not yet decide" requirement asks for. A separate *Can't tell* card would compete with choosing both and would need a rule for choosing it alongside a candidate.

**Try one (optional).** After step 1, a seed-packet button grows one more sprout, drawn with `ctx.rng` from the hidden plant's **true** copies and the tester, into the next empty slot. The record then holds up to eight sprouts, and the button goes quiet when the card is full. Grading always reads the record as shown, so a drawn plain sprout in the first case makes `Aa` the only accepted answer at the next Check, and no draw in the second case can ever show plain. It is free, never needed and never counted. The grown-up note says that drawing spotted sprouts, however many, never proves two spot copies.

Rule tests: `candidates(aa, [spotted × 3])` is `[AA, Aa]`; `candidates(aa, any record with a plain)` is `[Aa]`; `candidates(aa, [])` is `[AA, Aa]`; every authored record is compatible with its case's true copies, so the plain sprout only ever appears in the `Aa` case; a record with a plain sprout against tester `AA` is reported as a contradiction and no authored case contains one; `compatible` ignores order and count (two records with the same set of looks agree); records never exceed eight; a `Try one` draw from the true copies never makes a record its own case contradicts; every counterexample route makes the look it is spoken for.

## Level 6: which plant could tell us?

The hidden plant again, the watering can, the empty record, the candidate cards, and now **two testers on a bench**: spotted `AA` and plain `aa`, trays open, positions seeded. "Which plant should we grow it with, to find out?" Tapping a tester moves it into the right pot (tapping the other swaps it; free). Then she waters.

- **With `AA`:** three spotted sprouts grow. The two candidate fans open side by side above the record, `AA × AA` and `Aa × AA`, every bud spotted in both: "Spotted every way, whichever copies the hidden plant has. This plant can't tell us anything." The tester hops back to the bench, the record clears, and she chooses again. This is exploration, not a miss.
- **With `aa`:** the record grows as at level 5, from the round's authored case. The round's case is seeded as at level 5, so sometimes a plain sprout appears and sometimes six spotted sprouts leave both candidates.
- **Check** is the conclusion only, graded exactly as level 5's step 4: choose every candidate that could. In the still-ambiguous case the accepted answer is both, and the pet says the honest thing: "Even the plain plant couldn't tell us this time. Both still could." The packet then opens as at level 5.

Choosing `AA` first is a reasonable experiment, and the fans explain why it fails. The level never says one observation will settle it; `couldTell(aa)` is true because a plain sprout *could* appear, not because it will.

Rule tests: `couldTell(AA)` is false and `couldTell(aa)` is true; under tester `AA` every route of both candidates is spotted; under tester `aa` the candidates' supports differ exactly by `plain`; the conclusion's accepted set is `candidates(tester, record)` for the record actually grown.

## Accounting, help and finishing

G1's rules carry over, with the new free actions named:

- **Never a miss:** opening or replaying any fan, pressing a candidate or pair card, watering, Try one, choosing or swapping a tester, and an instruction repeat.
- **A miss:** a Check with a wrong nonempty choice. One miss per Check, with the boing and the spoken counterexample above. A Check is never offered with nothing chosen.
- **A hint:** the glow at a task's second miss (the accepted cards glow, and at level 5–6 the deciding sprout on the record glows with them), and the first use of Show me in a task. Show me selects the accepted cards and pulses Check; she presses Check herself.
- **Finish:** one case per round through `ctx.finish({ misses, hints })`, one sticker, with or without help. No creation, journal entry or discovery is filed; the packet reveal is a moment, not a possession. Leaving or replaying resets the case and loses nothing.
- **Adaptation** is the shell's unchanged rule. Level 6 is the top; smooth rounds there step nothing up, and two struggling rounds step down to 5.

## Registration and couplings (proposed)

- **Levels:** appended to `sprout-shuffle`, `school: { min: 1, max: 6 }` once all three are built (G3 leaves it at `max: 3`; each build widens it by the level it adds, in order 4, 5, 6). No `order`, no renumbering, no other band. Levels 4–6 are reached by stepping up or a grown-up's pin, and the how-to note names about 10 and up as their target. See [decisions 2–3](#open-decisions) for the 13+ question.
- **Layout.** Landscape: two pots at about x = 0.3·w and 0.7·w, the watering can between them, the record card under the pots, and the cards along the bottom with `spread(n, 150, view.w - 40, gap)`. Portrait: pots and can in the top third, record in the middle, cards in a row or 2 × 2 below. Fans open over the top half as in G1. Every control stays at least 100 logical units; the record's sprout slots are not touch targets. The bottom-left pet stays clear.
- **Art.** Pixi `Graphics` in `palette.ts` colors: a cream seed packet with a dark question mark and a peel-back flap, a wooden garden label for the record, a green watering can with three animated drops, and the G1 plants and tiles. New art, not reused from the pet or Bug Builder.
- **Voice lines** under `sprout.*`, added to G1's list: bed-ask, pair-counter-plain, pair-counter-spotted, pairs-done, hidden-intro, water, could-ask, both-could, cant-tell, plain-tells, only-one, counter-not-ruled-out, counter-fits, counter-no-plain, still-both, reveal-two, reveal-one, tester-ask, tester-all-spotted, tester-couldnt, try-one and the hint lines. `{pet}` optional. Wording waits for the reviewer.
- **How-to card.** The goal becomes whole-ladder: "Two plants each give a sprout one copy. Work out what their sprouts can be, and what a plant's sprouts tell about it." Steps as `LevelLine`s: give a copy from each plant (1–3); choose every pair whose sprouts are always spotted (4); water, then choose every pair of copies the hidden plant could have (5–6); first pick the plant to grow it with (6). Finish: "Check, then the packet opens" (5–6). Notes: the toy rule (1–6); spotted sprouts never prove two spot copies, however many (5–6); a plant that makes spotted every way cannot tell (6).
- **Ghost finger** (`autotouch()` at each level): level 4 taps the accepted pair cards and Check; level 5 taps the can, the accepted cards, Check, the can, the accepted cards, Check; level 6 taps the `aa` tester first, then as level 5. It never presses Try one and never opens a fan.
- **Couch:** none. **Creature world:** level 4's friend and bed are a plain request inside the round; turning a filled bed into a home decoration is an RW07 proposal, not this slice.
- **Overlap.** Who Am I? (zoo Z1, in definition) also keeps every card compatible with clues; the mechanics rhyme, and no shared helper is built until both exist. Species Comeback's pedigrees and Patchwork Conservatory's two loci stay separate. Sink or Float's unscored predictions are the accounting precedent for Try one and the tester choice.

## Reference games

Read, none played or handled:

- The [GenScope test-cross worksheet](https://genscope.concord.org/involved/testcross.html) (Concord Consortium, no longer maintained): breed an unwinged dragon with a known recessive partner to learn its hidden genotype from the offspring. Level 5 is this exercise with the counting replaced by "could this record come from each candidate?"
- [Geniventure](https://learn.concord.org/geniventure), Geniverse's successor: breeding virtual drakes to study heredity; the model of hiding a genotype behind a creature and inspecting crosses.
- [Dragon Genetics 1](https://serendipstudio.org/exchange/waldron/dragongenetics1) (Serendip, Waldron and Doherty): a paper activity whose homozygous-recessive parent makes the other parent's gametes readable in the phenotypes, the reason level 5 fixes the tester at `aa` and level 6 makes choosing it the point.
- [Animal Crossing: New Horizons flower breeding](https://nintendolife.com/guides/animal-crossing-new-horizons-flowers-how-to-grow-and-breed-hybrids-and-gold-roses-explained): seed-bag flowers have known genes and island flowers hidden ones, so players test-breed against known parents; proof that hidden-genotype play is enjoyable without any lesson framing. Its genes are community-mapped, not published.
- [Niche, a genetics survival game](https://store.playstation.com/en-us/concept/10002186) (Stray Fawn): dominant and recessive genes per body slot, read before pairing animals; the older-player appeal of inspecting copies, and the pressure (predators, sickness) this island leaves out.
- [PhET Natural Selection](https://clixplatform.tiss.edu/phet/files/activities/3936/phet-contribution-3936-7031.docx) (through classroom guides): a mutation set dominant or recessive, populations watched over generations; a reminder that population frequency is a different lesson from this level's enumeration, and is left out.

## Open decisions

Each has a default the build uses; the developer can change any.

1. **Reviewer** (shared with G1): the "two spot copies can never make a plain sprout" and "can't tell yet" lines need the same biology/education review. Default: build behind review, lines marked draft.
2. **Window:** levels 4–6 inside `school` with no gate, reached by stepping up or a pin, grown-up note "about 10 and up." Default: that. Alternative: hold level 6 until a grown-up has watched level 5.
3. **13+ and Lantern Lake:** Lantern Lake lists only `grownup` games, and whether a school game can also carry the `grownup` band needs a shell check first. Default: no 13+ entry now; a grown-up plays through a pin. A later `grownup` registration is a shell decision, not this slice's.
4. **Reveal:** the packet opens at the end of levels 5–6 (default), with the honest line in the ambiguous case; or it never opens, keeping "can't tell" the final word. The default was chosen because the reveal says why the sprouts could not tell.
5. **Try one** at levels 5–6: on by default, appending to the record with grading following the record; or off until a grown-up has seen whether a lucky plain draw confuses the ambiguous case.
6. **Level 4 framing:** pair cards (default) or a bench of three plants and two pots where she builds pairs herself.
7. **Build order:** level 4 as a new-levels slice after G3, level 5 as G6, level 6 after G6 (default), or 4 folded into G3.

## Checks for the builds

- **Level 4:** new-levels tier. Typecheck, the rule tests above, one browser play of level 4, `fingerdemo` at 4.
- **Level 5 (G6):** new-interaction tier. Typecheck, unit tests (rules, how-to, registry), one filtered scripted play of both cases with one wrong Check and one Show me, one portrait screenshot, `fingerdemo` at 5; build because the voice and how-to files change.
- **Level 6:** new-levels tier, with the top level played and `fingerdemo` at it.
- **Device and person checks, open until done:** whether "two spot copies" and "one spot copy" are clear by ear, whether the face-down tiles read as hidden rather than broken, whether a child accepts "can't tell yet" as finished rather than failed, and whether the `AA` tester's explanation lands. None is established here.
