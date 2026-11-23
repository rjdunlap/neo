# Outcrop Detective, levels 1–2 (definition)

Documentation packet, 2026-11-23, branch `claude/define-outcrop-detective`, [PR #2064](https://github.com/rjdunlap/neo/pull/2064). Earth-materials slice **E6** from the [study](../deep-dives/subjects/earth-materials.md#build-slices-in-order) and its [older and parent case](../deep-dives/subjects/earth-materials.md#outcrop-detective-one-older-and-parent-case). Proposed game `outcrop-detective`; nothing is registered or implemented. **Docs only.** One build batch follows below.

## What you do

A small cliff on the island shows three rock layers and a dark band of rock that pushed up through some of them. Under the cliff hang four big event cards in a row, the **story ribbon**: *lay A*, *lay B*, *dark rock pushes in* and *lay C*. Swap any two cards and press **Play**: a second, empty frame beside the cliff builds the cliff as that story would make it, one card at a time, with the pet saying what each step does. Press **Check** when the story's cliff matches the real one. Then answer one question: **do the rocks tell this order for sure?**

At level 1 every contact can be seen and exactly one story fits, so the answer is *yes, only this story*. At level 2 a drift of sand hides where the dark rock meets layer B. Two stories fit what can be seen, so the honest answer is *not enough to tell*; then she picks **one more look**, brushes the sand away, and fixes the ribbon if it no longer fits.

The learning is the study's older step (NGSS 4-ESS1-1, rock patterns as evidence of change, and the USGS point that layer relationships order events): read a cross-section as a record of events, use *lower is older* and *what cuts a layer came after it*, tell missing evidence from contradicting evidence, and choose the observation that would decide.

Use stable level IDs 1 and 2, bands `school` and `grownup`, both 1–2 (`levels(b)` is 1 to 2 for each; no `order`). Region `tinker-lab` (with Sand Table, Fossil Dig and Lost Layers), challenge `logic`. Home land **Lantern Lake**, like Island Bridges, Lantern Lights, Pond Conga and Word Search, the grown-up puzzles that open their smallest levels to school; Wonder Woods lists it by subject. Lantern Lake pages, and the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games) made the lands tests its capacity test. Mark the game `upright: true` (a new `grownup` game ships upright, decision 7 of that record) and add it to the registry test's upright list. Classic round contract: level progress and one sticker; the ribbon, the looks and the answers are round state and nothing is saved.

`describeLevel`: 1 "Put four rock events in the order the cliff shows"; 2 "Two stories fit: find the look that tells them apart".

## The island's rock rules

The cliff is made up, and its rules are the island's, stated by the pet, on the how-to card and in a small sign by the cliff: **"Layers were laid flat, lower first. Nothing has been flipped. Dark rock cuts the layers that were already there."** A/B/C are pattern names (dotted, striped, pebbled), not minerals, and nothing has an age in years. Faults, tilting, erosion and fossils are outside this model; the how-to says so in one line ("Real cliffs can be bent or broken; this one is not.").

## The model

- **Cards:** `A`, `B`, `C` (deposits) and `X` (the dark rock). A **ribbon** is an ordering of the four; there are 24.
- **Preview rule** (the story's cliff), applied card by card: a deposit lays a flat layer on top of everything there; `X` cuts every layer that exists at that moment, up to the surface at that moment, and a later deposit lies across its top. So the dark rock never "knows" about a later layer: it cuts what is there and is covered by what comes after. `predict(ribbon)` gives the stack (the deposits bottom to top, in ribbon order) and, for each deposit, its contact with `X`: **cut** (laid before `X`) or **covers** (laid after `X`).
- **Edge previews** the renderer and voice must handle: `X` first (nothing to cut, so `X` is a dark lump on the floor and every layer covers it); `X` last (it cuts all three layers to the top); a reversed deposit order (the stack is drawn in that order and the cliff's order differs).
- **Observations:** the real cliff's stack and the visible contacts. **Level 1:** stack A, B, C; X cuts A, X cuts B, C covers X. **Level 2:** stack A, B, C; X cuts A; C covers X; the X/B contact is under a sand drift. The seed sets the hidden truth: **cut** (X reaches up through B to C's base) or **covers** (X stops flat under B), half the seeds each.
- **`fits(ribbon, obs)`:** the stack matches and every visible contact matches. Every contact the case shows is checked; a hidden one is never checked. No ribbon is rejected for disagreeing with a preferred story.

**Every accepted history** (the build's rule tests assert these counts over all 24 ribbons):

| Observations | Ribbons that fit |
| --- | --- |
| Level 1 | A→B→X→C only (1 of 24) |
| Level 2, sand in place | A→B→X→C and A→X→B→C (2 of 24) |
| Level 2, sand brushed off, X cuts B | A→B→X→C only |
| Level 2, sand brushed off, B covers X | A→X→B→C only |

So the hidden contact decides between the two stories either way, and the seed decides which story is true.

**The first broken rule** (for explanations): checked in a fixed order, the stack (A under B, B under C), then each visible cut (that layer before X), then each visible cover (X before that layer). `whyNot(ribbon, obs)` names the first broken one, in the pet's words: "In this story C is laid first, so C would be at the bottom." / "In this story the dark rock comes before B, so it couldn't cut B. Here it cuts B." / "In this story the dark rock comes last, so it would cut C too. Here C lies over it." Each wording is keyed to the rule, so all 23 wrong level-1 ribbons and all 22 wrong level-2 ones get a reason (rule test).

**Looks (level 2):** three look cards. `look-sand` (brush the sand off the X/B contact) is the only informative one: it reveals the hidden contact. `look-low` (look closely where the dark rock meets A) shows the cut already visible. `look-top` (look at the top of C) shows C's pebbles and nothing about X. `informative(case, look)` is true exactly when the look changes the set of fitting ribbons; only `look-sand`.

**A round** is seeded: the three layer patterns and colours (from the palette, three of five, never two alike), whether the dark rock sits left or right of centre, the cliff's outline, the opening ribbon, the order of the three look cards and, at level 2, the hidden truth. The rules and the four cards never vary. **Opening ribbon:** one of the 11 ribbons that need exactly two hints to reach a fitting one under the hint walk below (level 1; the corresponding set at level 2), so the round never opens solved or nearly solved.

## Screen and controls

- **Upright (768 wide, 1,024 or taller):** the **cliff** (300×340, with its sign) and the **story frame** (300×340) side by side at the top, 40 apart, from y 40; a **Play** button (200×100) under the story frame. Below them the **ribbon**: four event cards of 160×150 with 24 between (712 wide), from y 520, each a picture (a layer's pattern dropping in, or the dark rock pushing up) plus a short spoken label when touched. Below that, from y 700, a row for **Check** (200×110) on the right and the current step's buttons (the two answer buttons, 240×110 each, or the three look cards, 160×150 each, with **Look** 200×110 beside them) to its left, all right of the pet's 150-unit corner. Bottom of the last row ≤ 880, inside 1,024. Every target is at least 100 units, so the school band's minimum holds upright and the grown-up minimum of 64 is far exceeded. The lens (a 300-unit round inset over the cliff) opens on top of the cliff and closes with a tap anywhere.
- **Landscape (1024×768):** cliff and story frame at the left (two 300×340 frames), the ribbon under them (712 wide), the answer or look row and Check in a 220-wide column at the right.
- `outcropLayout(view, level, step)` returns every rectangle; the layout test asserts sizes and no overlaps at the four landscape views and at `UPRIGHT_VIEWS`, and the upright test records the smallest target in CSS pixels at 390 × 844 (decision 6 of the 2026-11-17 record).
- **Swapping:** tap one card (it lifts, with a soft stone click and a glow), tap another and the two swap; tapping the lifted card again drops it. A card can also be dragged onto another (`src/engine/drag.ts`) with the same swap; `pointercancel` or a release off the ribbon returns it. Nothing smaller than a card is a target.
- **Play:** builds the story's cliff in the story frame card by card (about 0.6 s a card, a soft pentatonic step per card and a low rumble for the dark rock) and the pet says each step ("A is laid down. B is laid on top. The dark rock pushes up through A and B. C is laid over it."). Free, as often as she likes. Swapping cards clears the story frame. Play is never a Check.
- **Sound and music:** stone click on lift, two-note pentatonic swap, rumble for the dark rock, chime on a fit, a glass ring when the lens opens; the land's music keeps playing (not `silenced`).

## Steps, answers and accounting

| Level | Step 1: **order** | Step 2: **for sure?** | Step 3: **look** (level 2) | Step 4: **order again** (level 2) |
| --- | --- | --- | --- | --- |
| 1 | Check a ribbon that fits | *Yes, only this story* is right | — | — |
| 2 | Check a ribbon that fits what can be seen (either one) | *Not enough to tell* is right | Commit `look-sand` | Check the one ribbon that still fits |

- **Check on a fitting ribbon:** chime, the story frame plays it if it has not been played, and the pet names why it fits. At level 2 step 1: "This story fits everything we can see."
- **Check on a ribbon that does not fit:** gentle boing, the first broken rule's contact pulses on both the cliff and the story frame, and the pet says `whyNot`. **One miss per distinct wrong ribbon per record state** (sand in place, or sand off); re-checking the same wrong ribbon is free and only repeats the reason.
- **For sure?** Level 1, *Not enough to tell*: one miss; the pet plays one other ribbon and shows where it breaks a contact: "Every other order breaks something the cliff shows. Only this one fits." The step then waits for *Yes*. Level 2, *Yes, only this story*: one miss; the ribbon swaps to the other fitting story, Play runs, "This story fits too! The sand hides the one place that would tell." The step then waits for *Not enough to tell*.
- **Look** (level 2): tapping a look card previews it (the lens icon hovers where it would look and the pet says what it can see), free. Commit a card with **Look**: `look-low` or `look-top` opens the lens on what it shows, boing, "That doesn't tell the two stories apart," one miss each, once. `look-sand` brushes the drift off: the lens shows the dark rock running up through B, or B lying across its flat top, and the cliff now shows that contact. The step passes.
- **Order again** (level 2): if her ribbon still fits, the pet says so and one Check closes it ("The stripes tell us: it was this story."); if not, the contact now visible pulses and she swaps. Wrong Checks count as in step 1, keyed to the sand-off state.
- **Never a miss:** swaps, drags, Play, previews of look cards, an incomplete action, tapping during feedback (ignored), repeating the instruction, closing the lens.
- **Glow and hints.** After two misses on a step, its target glows once (`hints++` once per step): in an order step, the card the hint walk would move next and its slot; in for-sure, the right button; in look, `look-sand`. **Show a hint** in the pause sheet (`Scene.pauseActions`) acts on the current step and counts one hint per press that changes something:
  - **order steps, the hint walk:** the target is the fitting ribbon that shares the longest opening run of cards with hers (ties: A→B→X→C first); the first card that differs swaps into place and the pet gives its reason ("A is at the bottom and the dark rock cuts it, so A came first."). The card is marked *helped*. From every one of the 24 ribbons, at most three hints reach a fitting ribbon (level 1: 1, 6, 11 and 6 ribbons need 0, 1, 2 and 3; level 2 with sand: 2, 9, 10, 3; each sand-off state: 1, 6, 11, 6). Before the look, the target is only one of the two fitting stories (the one nearer her ribbon), and the pet says "a story that fits", never "the story".
  - **for-sure:** the pet says what the evidence shows ("Is there a contact we can't see?") and the right button glows.
  - **look:** the pet points at the sand ("What is under the sand?") and `look-sand` glows.
  A further press after nothing is left to change only repeats the words. **Start again** rebuilds the same seeded round and keeps misses and hints.
- **Finish:** `ctx.finish({ misses, hints })` after the last step, helped or not: one ordinary sticker from the shell. Nothing is filed in the journal (the island's cliff is not an observation she could repeat outside the game).

## First rounds

- **Level 1 (dotted A, striped B, pebbled C; dark rock left of centre; opening A→X→C→B).** The pet: "This cliff tells a story. Lower is older, and dark rock cuts what was already there. Swap the cards until the story makes this cliff." She plays it: A is laid, the dark rock pushes up through A, C is laid over it, then B. She Checks anyway: boing, the top two layers pulse, "In this story C is laid before B, so C would be lower. Here B is lower," one miss. She swaps C and B (A→X→B→C) and Checks: boing, the dark rock's cut through B pulses, "In this story the dark rock comes before B, so it couldn't cut B. Here it cuts B," a second miss; the B card and the second slot glow (one hint). She swaps B and the dark rock: A→B→X→C, Play, Check: chime. "Do the rocks tell this order for sure?" She taps *Yes, only this story*: "Yes. Every other order breaks something the cliff shows." Finish: two misses, one hint.
- **Level 2 (hidden truth: covers; opening A→C→B→X).** The pet: "Some of this cliff is under sand. Make a story that fits what we can see." She swaps C and the dark rock: A→X→B→C, Check: "This story fits everything we can see." For sure? She taps *Yes*: one miss, the ribbon becomes A→B→X→C and plays: "This story fits too! The sand hides the one place that would tell." She taps *Not enough to tell*: "Right. Could one more look tell them apart?" She previews `look-top` (free), then commits `look-sand`: the lens shows B lying across the flat top of the dark rock, and the cliff now shows it. The ribbon on screen (A→B→X→C) no longer fits: the new contact pulses and the pet says "Now we can see B lies over the dark rock." She swaps B and the dark rock back, A→X→B→C, Check: "B came after the dark rock. It was this story." Finish: one miss, no hints.

## Voice, how-to and grown-ups' wording

- `voice.ts`: the instruction per level (above), the three rule lines, every `whyNot` reason, the Play narration lines (one per card kind and contact), the fit lines, both for-sure outcomes, three look previews and three look results (two for `look-sand`), the hint reasons, and the close. All `ctx.instruct` for the instruction (the pet repeats it), `ctx.say` otherwise.
- `howto.ts`: level 1 card shows a ghost finger swapping two cards, pressing Play, then Check; level 2 adds tapping *Not enough to tell* and the sand look. `autotouch()` plays a round through the real inputs: one wrong Check, one hint, the right ribbon, the right answer, and at level 2 the sand look.
- **Grown-ups' wording:** "Read a made-up cliff as a story: put events in order from what cuts what, and say when the rocks can't tell." No claim about scientific thinking in general, attention or school results.
- **Co-play:** one person swaps, the other plays the story and says where it breaks; the pet does it alone. **Off-screen:** draw three paper stripes and a dark band, cover one edge, and ask what can still be told (the study's paper card idea, wording only; no rocks, digging or field instructions).

## Identity and overlap

- **Lost Layers** (`lost-layers`, Bubble Beach) lays two cliffs side by side and slides one cliff's given pieces against the other: the order inside each cliff is never edited. Outcrop Detective has one cliff and the player builds its **history**, with a cutting relation Lost Layers does not have. The two share the honest *can't tell* answer and the "one more look" step; Lost Layers' lens drawing may be reused.
- **Timeline Trail** and **Story Steps** order authored pictures by what they show. Here the ribbon is not judged against an authored answer but against a cross-section the story itself builds; the preview is the interaction. If a later case reduces to ordering cards without a built preview, it belongs in Timeline Trail.
- **Workshop Detective** (defined today) chooses a test to separate two explanations of a lamp. Its separating-test step is the same kind of move as the look here; the evidence is a mechanism there and a record here.
- **Sand Table** and **Fossil Dig** own pouring sediment and uncovering one fossil; neither orders events.
- **Not here:** numerical ages, faults, folds, erosion surfaces, fossils, real place names, a timer or par, saved cliffs, typed answers, real rock identification or collecting advice.

## Build batch

1. **`outcrop-detective 1`, levels 1–2.** The new game: the cliff, the story frame and Play, the ribbon, Check, for-sure, the looks and lens, the hint walk and the close.

   **Checks:** typecheck and unit tests, which cover:
   - the preview rule: `predict` for all 24 ribbons (stack order, cut or covers per layer), including X first and X last;
   - the accepted-history table above, exactly, by enumerating all 24 ribbons in each of the four observation states;
   - `whyNot` gives a reason for every wrong ribbon in every state and names the first broken rule in the fixed order;
   - `informative`: only `look-sand`, and each sand-off outcome leaves exactly one fitting ribbon;
   - the hint walk: from every ribbon in every state at most three hints reach a fitting ribbon, with the counts above; before the look a hint's words never claim its target is the only story;
   - accounting: one miss per distinct wrong ribbon per record state, re-checks free, swaps, Play, previews and incomplete actions never counted; each for-sure and look miss as listed; glow once per step;
   - the seeded draw: patterns, side, opening ribbon (always in the two-hint set) and the hidden truth vary across seeds, and both hidden truths occur;
   - voice coverage, the layout test (four landscape views and `UPRIGHT_VIEWS`, every target ≥ 100), and registry, lands and paging.

   **Model wording:** the building session checks the sign, the how-to line and the grown-ups' wording against reputable sources (a geological survey, a university or museum page), lists them in the study and records the check in its verification entry. The rules stay labelled as the island's.

   **Browser and build:** one filtered `outcropdetective` play at 390 × 625 with captions, reaching Lantern Lake through the grown-up route and its page: level 1 with one wrong Check and one Show a hint, then level 2 with *Yes* (a miss), *Not enough to tell*, one uninformative look and the sand look, finishing with one sticker. One upright screenshot of the cliff, the story frame and the ribbon at level 2, `fingerdemo` at level 2, and a build with the generated voice assets.

Later proposals, not in this batch: a second dark rock (which intruded first?), a wavy erosion surface, a fault, a case where two hidden contacts need two looks, or a case where no look can decide. Each needs its own definition; faults and erosion need the study's model reviewer first.

## Source check

Nothing new was opened for this packet. The study's opened anchors stand as it recorded them: NGSS 4-ESS1-1 (rock patterns as evidence of landscape change), NGSS MS-ESS2-2 (compressed time must be disclosed, so Play is a story, not a rate) and the USGS *Geologic Time, Then and Now* page (layer relationships order events; numerical ages need other evidence; *older is lower* belongs to the stated undisturbed model only). The cliff, its rules, the cards and the accounting are invented game rules, checked here by enumerating all 24 ribbons in each observation state. Solving the case shows that the player ordered this cliff's events and said what its visible contacts support; it is not evidence about geology understanding in general.
