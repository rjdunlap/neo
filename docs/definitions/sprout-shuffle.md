# Sprout Shuffle, levels 1–3 (definition G1)

Defined 2026-10-17 as slice **G1** of the [genetics study](../deep-dives/subjects/genetics.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/genetics.md#first-games-proposed-ladder-sprout-shuffle). Docs only: no game, ID registration, voice line, save field or band exists yet. **Not ready to build.** Building (G2, then G3) needs four things from the developer first: a named biology/education reviewer for the model and wording, the school entry window, the level 1 accounting choice and the home land. These are listed in [Open decisions](#open-decisions) and tracked in [WAITING-ON-DEVELOPER](../WAITING-ON-DEVELOPER.md). This document proposes an answer to each but settles none.

**Fun action and purpose:** two plants each hand a sprout one copy of a petal tile, and the sprout opens spotted or plain. Then she opens every bud that the same two plants could make. The learning goal is the idea of inheritance as a model: each parent gives one of its two copies, every pairing is a possible route, and "it could happen" is a different claim from "it always happens." Anchors are NGSS 3-LS3-1 (offspring inherit traits from parents, with variation) and the MS-LS3-2 idea of one copy from each parent. They are the study's content anchors, not proof the game teaches them.

## The model (frozen for G1)

One invented plant, one petal marking and two kinds of copy. The model is a declared toy rule, not a claim about any real flower.

| Copy | Tile | Letter (grown-up aid) | Spoken as |
| --- | --- | --- | --- |
| Spot copy | Round cream tile with three dark oval marks | `A` | "a spot copy" |
| Plain copy | Round cream tile with an empty outlined ring | `a` | "a plain copy" |

- **Each plant holds two copies.** A plant with at least one spot copy (`AA` or `Aa`) has spotted petals. Only a plant with two plain copies (`aa`) has plain petals. Spoken lines say "one spot copy is enough to make spots." The words *dominant*, *recessive*, *gene* and *allele* stay out of her lines. The grown-up note may use them, saying that "dominant" means "shows with one copy" in this toy, never stronger, better or more common.
- **Each parent gives one of its two copies,** either one with equal chance. A pair of parents therefore has exactly **four routes**: the left plant's copy 1 or 2, paired with the right plant's copy 1 or 2. Duplicate routes stay separate cards even when they make the same sprout. The fan never merges them.
- **Shape tells the copies apart, and so does color.** The marks and the empty ring are shown on every tile. Petal colors are seeded, but they never carry meaning. Letters are printed small on each tile for the grown-up and are never spoken, because device speech blurs "big A" and "little a."
- **Building is not choosing.** When she picks which copy each parent gives, she is building one possible route, not deciding what a real plant would make. The how-to card's note says this. Level 3's optional **Try one** button is the only random draw (see [level 3](#level-3-could-be-or-always)).
- **Left out on purpose:** real petal patterns, more than one marking, copies that blend, mutation, linked traits and percentages. Each would need its own reviewed definition. The saved companion is never a parent and never evaluated. Trial plants exist only inside the round. This matches the rework's rule of no speculative breeding systems ([RW work items](../rework/WORK-ITEMS.md)).

`logic.ts` holds the model as plain functions so tests can check it: `routes(left, right)` returns the four `{ from: [i, j], sprout }` routes, `looks(genotype)` returns `'spotted' | 'plain'`, `support(routes)` returns the set of looks, `checkLooks(chosen, routes)` returns ok or a counterexample route, and `always(look, routes)` says whether every route has that look. The plans are authored crosses with a seeded presentation. Positions, petal color, which side each parent stands on and which bud is missing at level 2 are seeded; the rules and crosses are not.

## Screen and controls

- **Layout.** Landscape: the left plant stands at about x = 0.18·w, the right plant at 0.82·w, and the sprout sits between them in the upper middle. Each plant has a tray below it holding its two copy tiles, 120 units across with at least 30 units between them. The sprout's two slots are each 130 units, one under each side and outlined in its parent's color. The **bud fan** is a row of four bud cards, 180 × 200 units each, spread along the bottom with `spread(4, 150, view.w - 40, gap)` so the bottom-left pet stays clear. Portrait (taller logical view): the plants and sprout keep the top half, and the fan becomes a 2 × 2 grid in the lower half. Every control stays at least 100 logical units on screen. Nothing shrinks to fit, because there are never more than four buds.
- **Giving a copy.** Pressing a tile depresses it and lights it immediately. Releasing it on the tray sends it along a path in its parent's color into **that parent's** slot. Each parent has its own slot, so a single tap is the whole action and no target needs choosing. A drag with `src/engine/drag.ts` onto the slot does the same. Tapping the plant's other tile swaps it in, which is a free edit. A slot never accepts the other parent's tile; a drop there springs back silently and does not count as a miss. Cancelling, leaving the screen and resizing all cancel a pending drag.
- **The sprout opens** when both slots are full. It uncurls over about 0.8 s, both paths glow, and a pentatonic pluck plays. Its petals show the marks or the empty ring.
- **A bud card** shows two small slot circles with arrows from the exact source tiles of its route. Tapping a closed bud fills it and opens it, replaying that route's paths. A bud that the level asks her to build (levels 2 and 3) instead lights its two source tiles, and she taps them as in the sprout.
- **Choice cards (levels 2–3)** are 200 × 200 picture cards. Pressing one speaks its meaning and toggles it. A large **Check** button (a green leaf, 140 units) appears once something is chosen. Before that, Check is not drawn, so an empty Check can never happen.
- **Speech.** `ctx.instruct` gives each phase's instruction, which the corner pet repeats. Every choice card speaks on press. Navigation never needs reading.
- **Feel and sound.** Pixi `Graphics` in `palette.ts` colors: soft green stems and cream petals. The art is new, not reused from the pet or Bug Builder's wings. Music is a calm existing style (Garden Grow's `STYLES.paint` is the proposal), not `silenced`, because she is not making music.

## Level 1: one route, then every route

**Cross:** spotted `AA` × plain `aa`. **Instruction:** "Give the sprout one copy from each plant."

1. She taps a tile in each tray (or drags them). The sprout opens spotted. "One spot copy is enough to make spots."
2. The fan appears with four closed buds. "These plants can make a sprout four ways. Open every bud." She taps each one. All four open spotted. The route she built lights up as one of the four.
3. After the fourth bud: "Every way makes a spotted sprout." Then `ctx.finish`.

There is no wrong answer at this level. A tap on an empty spot repeats the instruction. **Show a hint** (`askForHint`, in the pause sheet, hint label "Show me") does the next missing step: it gives the next copy, or opens the next bud. It counts as one hint, once per round, however often she uses it.

## Level 2: which sprouts could grow?

**Cross:** spotted `Aa` × plain `aa`. Seeded side and colors.

1. **Build one route,** as in level 1. Whichever copies she picks are welcome. Picking the spot copy makes a spotted sprout, and the plain copy makes a plain one.
2. **Finish the fan.** Three buds are already open (two spotted, one plain, or one spotted and two plain, depending on which bud is seeded missing). The missing bud lights its two source tiles, and she taps them to grow it. This is guided and not graded.
3. **Choose.** "Which sprouts could these plants make? Choose every one." Two choice cards: a spotted sprout and a plain sprout. Accepted: both. Check with only one card chosen is **one miss**. A boing plays, and a route that makes the missing look pulses and replays while the pet says, for example, "This way gives a plain copy and a plain copy. That makes a plain sprout." On the second miss in the task, that route's card and the missing choice card keep glowing.
4. Accepted: "Spotted or plain: both can grow." Then `ctx.finish`.

Rule tests: `routes(Aa, aa)` gives looks `{spotted: 2, plain: 2}` with four distinct `from` pairs. The only accepted set equals `support`. Every wrong nonempty set gets a counterexample route whose look is missing from it.

## Level 3: could be, or always?

**Cross:** spotted `Aa` × spotted `Aa`. Both parents are spotted. "Both plants are spotted. Let's see what their sprouts can be."

1. **Build all four buds.** Each bud in turn lights its route's two source tiles, and she taps them. Three open spotted and one opens plain. The plain bud's two plain-copy paths glow a little longer.
2. **Choose a claim.** "Will their sprouts always be spotted?" There are two choice cards. One shows a spotted sprout beside a plain one, spoken "Spotted sometimes. Plain can grow too." The other shows a row of spotted sprouts, spoken "Always spotted." Accepted: sometimes. Choosing "Always" and pressing Check is one miss. The boing plays and the plain route replays its paths: "This way, each plant gives a plain copy. That sprout is plain, so spotted is not always." The second-miss glow follows the level 2 rule.
3. **Try one (optional).** A seed-packet button, available after step 1, draws one random route with `ctx.rng` and grows it in the sprout. Each press is a new draw. It is free, never needed, never counted and never gates Check or Finish. Tapping a bud replays that bud. Four draws need not show all four routes. The grown-up note says so, and no line implies it.
4. Accepted: "Spotted most ways, plain one way. Spotted can happen, but not always." Then `ctx.finish`.

Rule tests: route looks for `Aa × Aa` are `{spotted: 3, plain: 1}`, and the genotypes are AA 1, Aa 2, aa 1. `always('spotted')` is false and `support` contains spotted. The counterexample for "Always" is the `aa` route. Finish is reachable with no Try one press. Every plan's counterexample route really has the contradicting look.

## Accounting, help and finishing

- **Never a miss:** giving or swapping a copy, a cross-parent drop, opening or replaying a bud, Try one, pressing a choice card, and an instruction repeat.
- **A miss:** a Check with a wrong nonempty choice at level 2 or 3. That is one miss per Check, with the boing and a spoken counterexample.
- **A hint:** the glow at a task's second miss (`hints++`, as Sink or Float counts it), and the first use of Show me in a task. Repeating a hint is free. Show me at a choice step selects the right cards and pulses Check. She still presses Check herself, so supported completion stays in her hands.
- **Finish:** one short case per round through `ctx.finish({ misses, hints })`, for one ordinary sticker, with or without help. No creation, journal entry or discovery is filed in G2/G3. Leaving or replaying resets the case and loses nothing.
- **Adaptation** uses the shell's unchanged rule (two smooth rounds step up, two struggling rounds step down). Level 1 cannot produce a miss, so two plays of it step her up to level 2. See [decision 3](#open-decisions).

## Registration (proposed)

- ID `sprout-shuffle`, title "Sprout Shuffle", region `rainbow-meadow`, skills `['inheritance', 'modeling', 'possible outcomes']`, `bands: ['school']`. G2 registers `school: { min: 1, max: 2 }`, and G3 widens it to `max: 3`. No `order` is needed. No other band, and no couch entry.
- **Home land:** Rainbow Meadow, next to Garden Grow's plants. It goes from 7 games to 8, which a school player sees with no signpost. Tinker Lab and Puzzle Peaks already hold 13 each and pass the every-band, four-view `lands.test.ts`. Puzzle Peaks includes the school-only Mossy Path, so the Meadow at 8 is well inside what is tested. Tinker Lab at 14 would be untested, which is the reason to prefer the Meadow.
- **Hub icon and sticker:** a two-petal sprout with one spotted and one plain petal, plus seeded sticker sprouts.
- **How-to card** (`src/content/howto.ts`). Goal: "Two plants each give a sprout one copy. Open every way their sprouts can grow." Steps as `LevelLine`s: give a copy from each plant (levels 1–3); open every bud (1); finish the missing bud, then choose every sprout that could grow (2); build all four buds, then say whether spotted is always (3). Note: the toy rule, that building a route is not choosing what a real plant makes, and that Try one's four draws need not show every way.
- **Ghost finger:** `touchDemo` with `autotouch()`. It taps one tile in each tray, opens or builds the buds, then picks the accepted cards and Check. It never presses Try one.
- **Voice lines** under `sprout.*`: intro, give, sprout-spotted, sprout-plain, one-copy, fan, open-all, every-spotted, fill-bud, choose-could, both-grow, choose-always, card-sometimes, card-always, counter-plain, counter-spotted, counter-not-always, sometimes-done, try-one, and the hint lines. `{pet}` is optional. The final wording waits for the reviewer.
- **Co-play suggestion:** one person predicts with a choice card before the fan opens, and the other opens the buds to check. **Off-screen:** draw two plants and four arrows together. This is a later, reviewed plain-HTML card ([G8](../deep-dives/subjects/genetics.md#build-slices-in-order)), never about real family members.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** 1: the session's source check replaces the named reviewer (voice lines no longer marked draft once checked). 2: option (a), register for school at level 1 with the "about 9 and up" note; the watched prototype becomes a device check. 3: option (a). 4: Rainbow Meadow if its layout test passes. G2 is unblocked.

Built 2026-10-27 as levels 1–2 ([PR #1014](https://github.com/rjdunlap/neo/pull/1014)); the placement check passed with location capacity. Level 3 built 2026-10-30 ([PR #1033](https://github.com/rjdunlap/neo/pull/1033), G3), with one deviation: Try one grows the drawn route in its bud card, not the centre sprout, because the claim cards stand in the sprout's place.

**Placement check, 2026-10-24 (the G2 session, [PR #912](https://github.com/rjdunlap/neo/pull/912)):** decision 4's condition fails. Rainbow Meadow now holds 12 games, not 7. With this school-only game added, the school view has 13 spots and the prek view has 12 plus a signpost. Either way, at 4:3 landscape the field fills the screen from y≈120 down, leaving no free 40-unit cell, so `meadow.test.ts` finds no room for its six flowers. A fallback to the hill behind the field cannot help, because the top row of spots already sits above the horizon. Every other land fails its own location test with the game added, and Tinker Lab and Puzzle Peaks also fail `lands.test.ts` (`landLayout` returns null). Under standing rule S8 the home stays Rainbow Meadow, and G2 waited for location capacity. The code was backed out; the build itself is unchanged. The [location-capacity build](location-capacity.md) landed 2026-10-24 ([PR #915](https://github.com/rjdunlap/neo/pull/915)): a full land now turns a page, so G2 re-runs its placement check against the capacity sweep.

The developer makes these calls. Each has a proposal, and none is settled.

1. **Reviewer.** Name a biology/education reviewer for the toy rule, the "one spot copy is enough" wording, and inclusive parent/sprout language before G2 ships. Proposal: build G2 behind review, with the voice lines marked draft until reviewed.
2. **School entry.** `bands: ['school']` puts the game on every school player's map, including a 6-year-old's. The shell has no age gate inside a band, and nothing gates by design. Options: **(a)** register for school at level 1, since level 1 has no wrong answers and is harmless early, with the grown-up note naming about 9 and up as the target; **(b)** wait to register until a grown-up has watched the level 1 prototype. Proposal: (b) for the first device look, then (a). This stays open; G2 is blocked on it.
3. **Level 1 accounting.** Level 1 always finishes 0 misses, so it steps up after two plays without showing understanding. Options: **(a)** accept it as adaptation, not mastery. Free creative rounds already finish 0/0 and step up the same way (Stamp Studio's `finish({ misses: 0, hints: 0, … })`), and the grown-up page must not read level 2 as "understands inheritance"; **(b)** drop level 1 as a separate level and make its build-and-open fan the first task of every level 2 round, so every round has a graded Check. Proposal: (a), since it keeps the first round complete and unpressured. The study's warning stays on the record either way.
4. **Home land.** Rainbow Meadow is proposed above. Discovery Marsh remains proposed only and is not a destination.

Not decided here: Hidden Sprouts (G5) and any 13+ or Lantern Lake entry, Patchwork Conservatory (G7, since [defined](patchwork-conservatory.md) as levels 7–8), younger comparisons (G4) and Paper Sprouts (G8).

## Checks for the builds

- **G2 (levels 1–2):** new-game tier. Typecheck; unit tests (the rule properties above, plus registry, lands and how-to tests); one filtered scripted play of level 1 and level 2 with one wrong Check and one Show me; one portrait screenshot; `fingerdemo` at level 2; build, because the registry, lands, voice and how-to files change.
- **G3 (level 3), built 2026-10-30:** the new-interaction tier for the claim cards and Try one, with the top level played and `fingerdemo` at it.
- **Device and person checks, open until done:** device speech of "spot copy" and "plain copy," whether tiles read as distinct without letters or color, whether building a route reads as controlling reproduction, whether a child grasps sometimes versus always unaided, and target comfort. None of these is established by this definition.
