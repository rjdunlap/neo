# Puddle Lens, levels 1–4 (definition)

**Levels 5–6 are defined below ([2026-11-05](#levels-56-definition-2026-11-05)) and built 2026-11-05 ([PR #1281](https://github.com/rjdunlap/neo/pull/1281)).** Known gaps against the definition: the level-5 co-play pointing and off-screen tip are not built (the game has one co-play and one off-screen string for all levels, so the existing strings stay); "no two copies of a sample" was read as no pair twice at level 5, since pairs A and B share the swimmer.

Defined 2026-10-22 as slice 1 of the [cells-and-microbes study](../deep-dives/subjects/cells-microbes.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/cells-microbes.md#a-first-games-ladder-puddle-lens) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#cells-and-microbes-recommendations). Docs only: no game, ID registration, voice line, save field or band exists yet.


**Status: built 2026-10-24 (levels 1–4, [PR #935](https://github.com/rjdunlap/neo/pull/935)).** Known gaps against this definition: no visitor critter is drawn, and the dial is the brass ring with a pointer and stop marks around the lens rather than a separate knob. Stop order and feature windows were source-checked (decision 3): a ~10× hand lens shows leaf trichomes; plant cells and chloroplasts show under a light microscope at ~100–400× ([HHMI](https://www.hhmi.org/beautifulbiology/media-detail/stars-plains), [Microscope World](https://www.microscopeworld.com/blog/plant-research-under-the-microscope-imaging-trichomes-stomata-and-leaf-microstructures/)); paramecium-like swimmers are found at 40–100× and their cilia show near 400×, brightfield's limit ([Berdan](https://canadiannaturephotographer.com/rberdan_protozoa.html), [iNaturalist](https://spain.inaturalist.org/identifications/joswan12)). No line names a cell, microbe or germ. The original status text follows.

**Status: defined. The build (the study's slice 2) waits on the developer.** The [Waiting row](../WAITING-ON-DEVELOPER.md) "Cells and microbes: Puddle Lens identity, review and framing" asks for three things before registration. The first is identity (a new game, not Zoom Walk content), which this packet supports with the level-4 table ([decision 1](#open-decisions)). The second is the home land, measured below ([decision 2](#open-decisions)). The third is how levels 1–2 count ([decision 4](#open-decisions)). The existing science-and-scale-facts reviewer row ([Waiting, "Who reviews content?"](../WAITING-ON-DEVELOPER.md)) also covers the stop order and the drawings of the feature table, and it must read the [feature table](#the-model-logicts) and the level 3–4 lines before the build merges. Nothing here names a microbe, germ or illness. Levels 5–8 and Slide Files need a biology/microbiology educator and are not defined here.

**Fun action and purpose:** a big round lens hangs over a slide on a little puddle-side table: a leaf, a drop from the puddle, or a pinch of sand. She taps the lens and the leaf swells into view with a chime. Later she slides the lens over three things, and they look bigger while the companion's paw beside them stays its size. Then she turns a four-stop dial on a drop that looks empty until tiny swimmers appear. At the top she sets the dial to just the view the companion asks for: not so far that it is too small to see, not so close that it no longer fits. The learning purpose is **what you can see, and so what you can tell, depends on how close you look**. At levels 1–2 the claim is only "it looks bigger; it isn't bigger" (no microbe claim). At level 3 the claim is that some things are too small to see without a lens. At level 4 she chooses *how much* magnification a question needs. That answers the study's L, T, P and K rows ([audiences](../deep-dives/subjects/cells-microbes.md#an-answer-for-every-audience)).

## Identity and overlap

- **Zoom Walk** (notebook proposal) owns the slider tour across many sizes and its unscored "which is bigger?". Puddle Lens keeps **one fixed sample per question** and a decision about **how close is enough**. Level 4's table ([below](#level-4-questions)) gives a decision with real misses on both sides, so the identity test passes ([decision 1](#open-decisions)). If the developer folds it into Zoom Walk instead, the feature tables carry over as its small end.
- **Photo Safari** keeps "photograph the clue"; nothing here is photographed. **Sink or Float** keeps unpenalized predictions; Puddle Lens has no prediction step at levels 1–4. **Particle Lens** (matter proposal) shows particles, never organisms; no particle is drawn here. **Sense Detective** (queued) chooses a sense, not a scale.
- **Teddy Doctor** is unchanged: no hygiene, germ, illness or cleaning content anywhere in this game ([study](../deep-dives/subjects/cells-microbes.md#what-fits)).

## The model (`logic.ts`)

- **Stops, not numbers.** Four ordered stops, `1` *eyes*, `2` *hand lens*, `3` *microscope*, `4` *closer microscope*. No magnification number, unit or scale bar is drawn or spoken at levels 1–4.
- **Samples** (three, fixed): `leaf`, `drop`, `sand`. Level 3 also uses `drop-empty` (the same drop with grains but no swimmers). A sample's **feature table** maps each feature to an inclusive **window** `[first, last]`: it is drawn whole from `first`, and above `last` it no longer fits (it is drawn cropped past the view's edge, never removed). Below `first` it is not drawn at all.

| Sample | Feature (spoken name) | Window | Drawn as |
| --- | --- | --- | --- |
| leaf | the whole leaf | 1–2 | outline, stem and big veins; at stop 2 it nearly fills the view |
| leaf | the tiny hairs on its edge | 2–3 | soft spikes along the rim |
| leaf | the little boxes | 3–4 | a brick-like grid of cell walls |
| leaf | the green beads inside a box | 4–4 | green ovals inside each box |
| drop | the whole drop | 1–2 | a round dome on the slide |
| drop | the specks in the drop | 2–3 | small grains scattered inside |
| drop | the swimmers | 3–4 | two or three faceless oval swimmers (see below) |
| drop | the swimmer's tiny hairs | 4–4 | a fringe around each swimmer |
| sand | the whole pinch of sand | 1–1 | a small heap |
| sand | the separate grains | 2–3 | rounded grains of several palette colours |
| sand | the bumps and cracks on one grain | 3–4 | one grain filling the view, with bumps and cracks |
| drop-empty | (level 3 only) the drop's rows without the two swimmer rows, plus: one speck up close | 4–4 | a single speck filling the middle of the view, so stop 4 still shows something |

- **Totality:** `visibleAt(sample, stop)` lists the features drawn whole at that stop. It is defined for every sample at every stop 1–4, and every stop shows at least one feature of every sample. `fits(sample, feature, stop)` is true inside the window, `tooSmall` below it and `tooClose` above it.
- **One fixed sample.** The slide never changes while the dial turns; only the view does. Each stop's view is one pre-drawn layer per sample (four `Graphics` layers, `src/games/puddle-lens/art.ts`), cross-faded over 0.3 s, never a continuous zoom.
- **Swimmers** (drop, stops 3–4) are faceless science drawings ([decision 6](#open-decisions)): a rounded oval with a darker centre spot and, at stop 4, a fringe of hairs. They drift by themselves at no more than 30 units a second, turn gently at seeded random times and stay inside the drop. They **stop drifting while any finger is on the screen** and are never steered, chased or timed. Positions come from a seeded path, so a round replays exactly.
- **Size rule.** A tappable feature is drawn at least 100 units across at every stop where it can be tapped (only swimmers are tapped, at levels 3; at stop 3 each swimmer is about 130 units long, at stop 4 about 240).
- **The paw reference.** At levels 2–4 the companion's paw rests on the table edge **outside** the lens view, drawn at one fixed size that never changes with the dial. Under the lens at level 2 the paw also looks bigger, and when the lens moves off it is the same paw (honest optics).
- **Level 3 judging** (`judgeSwimmers(drop, stop, answer)`): the deciding stop is `3` (the swimmers' `first`). A tap on a swimmer is accepted at stops 3–4 on a populated drop. **No swimmers** is accepted at stops 3–4 on an empty drop. Before the deciding stop, **No swimmers** and taps on the drop are a free prompt (`'look-closer'`), never a miss, because the claim cannot be judged from that view. At stops 3–4, **No swimmers** on a populated drop is a miss (`'look-again'`). A tap off every swimmer at stops 3–4 resolves to the nearest swimmer within 90 units of its centre; if none is in range it is free (`'find-one'`).
- **Level 4 judging** (`judgeView(question, stop)`): `'ok'` when `fits`, `'too-small'` below the window, `'too-close'` above it.
- **Hint:** `helpFor(state)` returns the stop to turn to. At level 3 that is stop 3. At level 4 it is the window's lowest stop. At level 1 it returns "tap the lens"; at level 2 it returns the nearest thing not yet looked at.
- **Variety:** seeded from `ctx.rng`: question order, which drop is empty at level 3, swimmer count (2–3), shapes (round, long, bean) and paths, leaf kind (round, long, maple-like; the same window table), sand colours and the visitor who comes to look (`CRITTERS`). Each level's first round is authored (below), so the how-to card and demonstration open on the same story.

### Level 4 questions

Every question asks for one feature of one sample. **Accepted set** is the window. **Too small** and **too close** list the stops that miss each way.

| # | Sample | Question (spoken) | Accepted | Too small | Too close |
| --- | --- | --- | --- | --- | --- |
| 1 | leaf | "Show me the whole leaf." | 1, 2 | — | 3, 4 |
| 2 | leaf | "Show me the tiny hairs on its edge." | 2, 3 | 1 | 4 |
| 3 | leaf | "Show me the little boxes." | 3, 4 | 1, 2 | — |
| 4 | leaf | "Show me the green beads inside a box." | 4 | 1, 2, 3 | — |
| 5 | drop | "Show me the whole drop." | 1, 2 | — | 3, 4 |
| 6 | drop | "Show me the specks in the drop." | 2, 3 | 1 | 4 |
| 7 | drop | "Show me the swimmers." | 3, 4 | 1, 2 | — |
| 8 | drop | "Show me a swimmer's tiny hairs." | 4 | 1, 2, 3 | — |
| 9 | sand | "Show me the whole pinch of sand." | 1 | — | 2, 3, 4 |
| 10 | sand | "Show me the separate grains." | 2, 3 | 1 | 4 |
| 11 | sand | "Show me the bumps on one grain." | 3, 4 | 1, 2 | — |

No accepted set is empty or all four stops. Six questions (1, 2, 5, 6, 9, 10) can be **too close** and eight (2–4, 6–8, 10, 11) can be **too small**. A level-4 round is **three questions on one sample** (the slide stays put; [first round](#first-rounds)). Each round must include one question that can be too close and one with a window starting at stop 3 or above. All three samples meet that rule.

## Screen and controls

- **The lens view** is a large circle (the microscope's eyepiece at levels 3–4; the hand lens's glass at 1–2) showing the current stop's layer, centred in the room left by the controls. Its diameter is `min(room) − 40`, at least 360 in every view.
- **The dial (levels 3–4)** is drawn as a big round brass knob with a pointer, but it is driven by **four stop buttons** arranged beside it, each at least 110×110. In landscape they form a column on the right; in portrait a row under the lens. Each shows its stop's picture (an eye, a hand lens, a microscope, a microscope with a bigger lens) and one to four dots, so no reading is needed. **There is no rotary drag** (no circular gesture, as in Gear Garden). Tapping a stop turns the knob there, stepping through any stops in between. Each step clicks and plays a rising pentatonic note (`src/audio/notes.ts`) as the view cross-fades. Touch-down brightens the button and the lens ring at once. Turning is always free and never counted.
- **Level 3's answer button:** **No swimmers**, at least 120×120, showing a drop with a small empty circle, at the bottom right (beside the stop row in portrait). **Level 4's answer button:** **Show**, at least 120×120, a big eye with a sparkle, in the same place.
- **Level 1:** only the lens, a big circle at least 300 across in the centre, and the current thing on the table under it. The dial and buttons are hidden.
- **Level 2:** the hand lens (glass at least 240 across, with a handle) rests on the table. The three things lie in a row (stacked in portrait) on the table, each at least 160 across and separated by at least 60, with the paw on the table edge. The lens is dragged with `src/engine/drag.ts` move callbacks, riding 40 units above the finger. It has no drop target: a release leaves it where it is, clamped inside the table. Under the glass the covered part of the table is drawn from the stop-2 layer through a circular mask.
- **Sizing:** `lensLayout(view, level)` places the lens view, the stop buttons, the answer button and (level 2) the table row clear of the home button (top left), the `?` button and the guide's bottom-left corner, inside `view`. It returns **null** rather than give any button under 110, the lens under 360, or a level-2 thing under 160; the test fails then.
- **Pause sheet:** Start again (the same seeded round from its first question, keeping hints) and Show a hint (`Scene.pauseActions`).
- **Music:** Bubble Beach's island style keeps playing (she is not making music); clicks and notes are synthesized.

## Levels

| Level | Name | Bands (default) | What she does | Round |
| --- | --- | --- | --- | --- |
| 1 | **Look closer** | lap, toddler | Taps the lens; the thing under it swells into view with a chime, holds, then shrinks back and the next thing slides in | Three things: leaf, drop, sand |
| 2 | **Lens over** | toddler, preschool | Drags the hand lens over three things on the table, in any order; each looks bigger under the glass, and the paw outside it stays its size | Three things looked at |
| 3 | **Anyone there?** | preschool, pre-K | Turns the dial up on a drop until swimmers appear and taps one, or presses No swimmers on a drop with none | Three drops (at least two populated, at most one empty) |
| 4 | **Just enough** | pre-K, school | The companion asks for a view; she sets the dial and presses Show | Three questions on one sample |

Ranges (a `BandLevels` table): lap `{1,1}`, toddler `{1,2}`, preschool `{2,3}`, prek `{3,4}`, school `{4,4}`. No `grownup` range and no `GROWNUP_GAMES` entry until Slide Files is defined. School gets levels 5–6 later (study slice 3).

### First rounds

- **Level 1 (authored):** a round green leaf lies under the lens. She taps: the leaf swells to the stop-2 view with a chime and a sparkle, and the companion says "Look how big it looks!". After 2 s it shrinks back by itself (a tap during the hold shrinks it early; free). The drop slides in, then the sand. The round finishes 1.5 s after the third swell has shrunk back.
- **Level 2 (authored):** leaf, drop and sand in a row, the paw at the right. She drags the lens onto the drop. When the glass's centre stays within 50 units of the drop's centre for 0.6 s, the drop chimes and gets a small tick, and the companion says "Bigger under the lens!". She drags it over the paw: the paw looks bigger too; she drags off: "Same paw!" (free, once per round). She looks at the leaf and the sand, and the round finishes.
- **Level 3 (authored):** drop one is populated (two round swimmers). At stop 1 she taps the drop: "I can't see anyone yet. Turn the dial!" (free). She taps stop 2: specks appear, no swimmers; she presses No swimmers: "We can't tell from here. Look closer!" (free). She taps stop 3: two swimmers drift into view, "Something's moving!". She taps one: it wiggles and chimes, and the visitor waves. Drop two is seeded populated; drop three is seeded (empty or populated). At an empty drop at stop 3 she presses No swimmers: "No swimmers in this drop. Just specks!" (correct).
- **Level 4 (authored):** the leaf. "Show me the little boxes." She taps stop 2 and presses Show: "Too small to see yet. Look closer!" (a miss). She taps stop 4 and presses Show: correct ("There are the little boxes!"). "Show me the whole leaf." At stop 4 Show is "Too close. The whole leaf doesn't fit!" (a miss); she taps stop 1 and presses Show: correct. The third question is seeded from the leaf's remaining features.

## Accounting, help and finishing

- **Levels 1–2: no misses, ever.** Nothing there can be wrong ([study](../deep-dives/subjects/cells-microbes.md#proposed-levels-and-bands)). **The shell has no exploratory round flag:** `RoundResult` carries only `misses` and `hints`, and `src/progress/difficulty.ts` steps up after two smooth rounds (at most one miss, no hints). With the ranges above, the shell therefore does two things. A **toddler** at level 1 moves to level 2 after two rounds without Show a hint. A **preschooler** at level 2 moves to level 3 the same way. Two rounds with two hints each step back. **Default, with no shell change:** accept both steps. Level 1 to 2 is toy to toy. Level 2 to 3 means she has dragged and looked, which is level 3's prerequisite, and level 3's early answers are free. The study wanted exploratory rounds that "do not move the level as if mastered" ([decision 4](#open-decisions)). The alternative is to narrow preschool to `{3,3}` (level 2 then reachable only by a grown-up's pin) or to add an exploratory flag to `RoundResult`. That flag would be new shell infrastructure, shared with Far Lights' and Space's identical decision, and would **gate this build**.
- **Level 3 misses:** only **No swimmers** pressed at stop 3 or 4 on a populated drop. Everything before stop 3 is free ([model](#the-model-logicts)). Each miss gets a gentle boing and "Look again. Something's moving!". After **two misses on one drop**, the stop-3 button glows; it is a standing glow and counts nothing extra.
- **Level 4 misses:** every wrong Show is one miss, with its named reason ("Too small to see yet. Look closer!" / "Too close. The whole … doesn't fit!"). Turning is free. After two misses on one question, the accepted stops' buttons glow (not an extra hint).
- **Hints** (at most **one per question**, drop or thing): **Show a hint** in the pause sheet. At level 1 the lens pulses and swells by itself. At level 2 the lens glides to the nearest thing not yet looked at. At level 3 the dial turns to stop 3 by itself. At level 4 it turns to the window's lowest stop, and she still presses Show. Every question can therefore finish with help.
- **Supported completion:** at level 3 the glow plus a hint leaves only a tap on a visible swimmer or No swimmers at a deciding stop. At level 4 the glow and hint leave only Show. Nothing times out.
- **Finish:** after the last question every feature waves once and `ctx.finish({ misses, hints })`; one ordinary sticker from the shell, with or without help. Nothing is kept, filed or saved; no `discoveries` and no journal entry ([decision 7](#open-decisions)).

## Speech (`voice-script.ts`)

Lines under `lens.*`: `intro`; `instruct.tap` ("Tap the lens to look closer!"); `instruct.over` ("Slide the lens over everything!"); `instruct.anyone` ("Is anyone in this drop? Turn the dial to look closer!"); `instruct.enough` ("Turn the dial to just the right look, then press Show!"); `bigger` ("Look how big it looks!"); `same-paw` ("Same paw! It only looks bigger."); `not-yet` ("I can't see anyone yet. Turn the dial!"); `cant-tell` ("We can't tell from here. Look closer!"); `moving` ("Something's moving!"); `found` ("You found a swimmer!"); `none` ("No swimmers in this drop. Just specks!"); `look-again` ("Look again. Something's moving!"); `too-small` ("Too small to see yet. Look closer!"); `too-close` ("Too close. The whole {thing} doesn't fit!"); `just-right` ("There {they are}!"); one `ask.<feature>` line per [level-4 question](#level-4-questions); `hint`; `done`.

Every line describes **this lens and this slide**. "Swimmers", "specks", "little boxes" and "green beads" are what is drawn. No line says cell, microbe, bacteria, germ, alive or dirty, and none tells her to look at real water ([decisions 3 and 6](#open-decisions)). The science-and-scale-facts reviewer reads these lines with the feature table before the build merges.

## Rule tests (`logic.test.ts`)

- **Feature tables:** every window lies in 1–4 with `first ≤ last`; `visibleAt` is total and non-empty for every sample at every stop; `drop-empty` equals `drop` minus the swimmer rows plus its stop-4 speck; the whole leaf leaves at stop 3, the whole drop at 3, the pinch at 2.
- **Level-4 table:** every question's accepted set is non-empty and never all four stops; `judgeView` gives `'too-small'` exactly below and `'too-close'` exactly above the window; the table matches the [questions](#level-4-questions) row for row; across 500 seeds every round is three questions on one sample with one that can be too close and one starting at stop 3 or above; the authored first round matches its story.
- **Level-3 judging:** for both drop kinds at every stop and every answer, `judgeSwimmers` gives free prompts below stop 3, accepts a swimmer tap or No swimmers only as the model says, and misses only for No swimmers on a populated drop at stops 3–4; across 500 seeds every round has 3 drops, at least two populated, at most one empty.
- **Swimmers:** across seeded paths every swimmer stays inside the drop, never exceeds 30 units a second, and is at least 100 units long at stops 3 and 4; the nearest-swimmer rule picks the closest within 90 units and none outside.
- **Help:** `helpFor` names a stop where the asked thing becomes visible (level 3: a swimmer or the empty drop's specks; level 4: inside the window). A scripted level-4 question (wrong Show, Show a hint, Show a hint again, Show) counts two misses and one hint. A level-3 drop with two wrong No swimmers lights stop 3.
- **Level 2:** a thing counts as looked at only after 0.6 s within 50 units; each counts once; three finish; the lens is clamped inside the table.
- **Layout:** `lensLayout` at the four views `lands.test.ts` uses (landscape, portrait, phone, notch) for every level gives buttons at least 110, the lens at least 360, level-2 things at least 160 and 60 apart, nothing overlapping the home button, the `?` button or the guide's corner, everything inside `view`, and null rather than smaller.
- **Registry, lands and how-to tests** pass with the new game, including Bubble Beach on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` follows `helpFor`. Level 1: three taps on the lens, each after the previous thing has slid in. Level 2: the real drag of the lens onto each thing in turn, holding 0.8 s on each. Level 3: taps on stop 2 then stop 3, then a tap on a swimmer at **its current position, read when the ghost finger comes down** (swimmers hold still while a finger is down, so the tap lands). Level 4: taps the window's lowest stop, then Show.
- **How-to card** (`src/content/howto.ts`). Goal: "Look closer and closer with a lens."
  - Steps: "Tap the lens; each thing looks bigger, then goes back" `{ from: 1, to: 1 }`; "Drag the lens over all three things; the paw outside it stays the same size" `{ from: 2, to: 2 }`; "Tap the dial's pictures to look closer; tap a swimmer, or No swimmers if the drop has none" `{ from: 3, to: 3 }`; "Tap the dial to just the view the friend asks for, then Show" `{ from: 4, to: 4 }`.
  - Finish: "Three things looked at" `{ from: 1, to: 2 }`; "Every drop checked" `{ from: 3, to: 3 }`; "All three views shown" `{ from: 4, to: 4 }`.
  - Notes: "The lens makes things look bigger; it doesn't make them bigger" (all levels); "Nothing here is ever wrong" `{ from: 1, to: 2 }`; "Saying 'No swimmers' before the closest views is never wrong; it only asks to look closer" `{ from: 3, to: 3 }`; "Too far and too close are both misses; turning the dial never is" `{ from: 4, to: 4 }`; "Show a hint turns the dial for her and counts as a hint, once per question" `{ from: 3, to: 4 }`.
- **Registration:** ID `puddle-lens`, name "Puddle Lens", spoken title `game.puddle-lens` ("Puddle lens"). Region (subject) `tinker-lab` (science), home land **Bubble Beach**. The two differ, as for Sink or Float and Lost Layers. Skills `['observation', 'magnification', 'scale', 'science']` (free strings; `magnification` and `scale` are new). Bands as above, child `GAMES` only. Hub icon: a round lens over a leaf. Sticker: a seeded view of a leaf's little boxes or a drop's swimmers in a lens ring.
- **Art:** code-drawn in `src/games/puddle-lens/art.ts` with `src/art/palette.ts`: the table, slides, lens, brass knob, stop pictures and every stop layer of every sample. The companion's paw comes from `ctx.companion()`, with visitors from `CRITTERS`. No imported art or audio.
- **Co-play:** "Slide and lens" from the study ([audiences](../deep-dives/subjects/cells-microbes.md#an-answer-for-every-audience)): at level 4 the grown-up asks for a view, she sets it and they check together. **Off-screen** (spoken tip, no equipment): "Look at a leaf with just your eyes. What would a lens show?" No hand-lens, microscope, water-collecting or sunlight instruction ([decision 5](#open-decisions)).
- **Couch:** none. **Rework couplings:** none required. A lens tool in the creature home and slides as permanent unlocks are later rework work, not part of this build.

## Home land and capacity

Measured 2026-10-22 with a throwaway `landLayout` probe at `5e136276`. The probe added Bubble Beach's current ten games plus probe games visible from lap (the first lap–school, the rest lap–pre-K), checked in the four `lands.test.ts` views, and was not committed:

| Games added to Bubble Beach | Total | Fails at |
| --- | --- | --- |
| +1 (Puddle Lens) | 11 | none |
| +2 | 12 | none |
| +3 | 13 | none |
| +4 | 14 | school, grown-up |

Default **Bubble Beach** (10 games today, 11 with Puddle Lens), the study's lean; the Waiting row's "lists 4 games" is out of date. Two places remain after it. Sand Table's queued build also defaults to Bubble Beach and would take one. The study's other choice, the rework's Explore places, is for later. `lands.test.ts` decides at build time.

## Check tier

New-game tier: typecheck and unit tests (above, plus registry, lands and how-to). Then one scripted play through a new `browser-check.mjs` case (and its README row): level 1 (three taps) and level 4 (one too-small Show, one too-close Show, Show a hint, finish). Also one portrait screenshot of level 4's dial and lens, `fingerdemo` at levels 1 and 3 (the swimmer tap) and 4, and `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a lap child links her tap to the swelling; whether a toddler keeps the lens moving with one finger on an iPad; whether "too close" makes sense to a four-year-old; and how the iPad says "No swimmers". Browser automation establishes none of these.

## What comes next

**Puddle Lens 5–6** is [defined](#levels-56-definition-2026-11-05) (2026-11-05); built 2026-11-05. Next is the study's slice 4 (define 7–8, Wall clue and Why green?) and slice 5 (Slide Files, which also takes the dead-cell and clump cases set aside in 5–6).

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** Puddle Lens is a new game, home Bubble Beach (its 11th, within the measured 13), levels 1–2 on the ordinary rule with no shell change; levels 7–8 at the top of `school` and Slide Files on `grownup`; faceless science drawings only, with no germ, hygiene, illness or "bad microbe" content. The stop order, feature table and level 3–8 lines take the building session's check against cited sources instead of named reviewers; a hand-lens card takes the same check, and microscope, culturing, swab, body-sample, pond-collection or sunlight-through-lens instructions are not drafted.

1. **Identity (gates the build).** Default: a new game. Level 4's [table](#level-4-questions) has eleven questions with windows of one or two stops, six that can be too close and eight that can be too small, so "how close is enough" is a real decision on one fixed sample. Alternative: fold the feature tables into Zoom Walk's small end.
2. **Home land (gates the build).** Default Bubble Beach as measured, leaving two places (Sand Table defaults there too). Alternative: the rework's Explore places when they exist.
3. **Reviewer.** The science-and-scale-facts reviewer row covers the stop order, the feature windows and the level 3–4 lines; it reads them before the build merges. Until "Who reviews content?" is answered, no build merges.
4. **Levels 1–2 accounting (gates the build).** Default: no shell change, with the ranges above. Two smooth rounds step a toddler from 1 to 2 and a preschooler from 2 to 3 ([accounting](#accounting-help-and-finishing)). Alternatives: preschool `{3,3}`, or a new exploratory flag on `RoundResult` shared with Far Lights and Space. The flag would be shell work done first.
5. **Practical card.** None drafted. A hand-lens or microscope card needs a named reviewer; never culturing, swabs, body samples, pond collection or sunlight through a lens.
6. **Framing.** Faceless science drawings in the lens; the companion reacts beside them. No germ, hygiene, illness or "bad microbe" content.
7. **Journal.** Default: no journal entry or discoveries at levels 1–4. A "first swimmers seen" entry could join with a reviewed line later.

## Levels 5–6 (definition, 2026-11-05)

Defined 2026-11-05 as slice 3 of the [cells-and-microbes study](../deep-dives/subjects/cells-microbes.md#build-slices-in-order), from its [proposed levels](../deep-dives/subjects/cells-microbes.md#proposed-levels-and-bands). Docs only: no code, voice line or save field changes. It was written against the built game (`src/games/puddle-lens/logic.ts` at `e82d9cd3`), not only the 1–4 text above. The [October 23 decision](#open-decisions) applies: this session's source check (below) stands in for a named biology reviewer, and no reviewer gate remains.

**Fun action and purpose.** **Level 5, *Alive or can't tell yet*:** two specks share a drop and the companion rings one. She turns the dial and answers with one of three picture buttons: **alive**, **not alive** or **can't tell yet**. **Level 6, *One cell or many*:** one slide at a time sits under the lens. She turns the dial until she can see edges, then taps one of three trays: **one cell**, **many cells** or **not cells**. The purpose is the study's school claim ([NGSS MS-LS1-1](https://www.nextgenscience.org/pe/ms-ls1-1-molecules-organisms-structures-and-processes)): living things are made of cells, one or many, and **the scale you look at decides what you can tell**. Moving and being green are drawn but are never the evidence.

**Wording changes from levels 1–4.** These are the first lines in the game that say **alive** and **cell**. They still never say microbe, bacteria, germ, illness, dirty or clean, and they never name yeast (the study routes yeast to the cooking and food studies). Decision 6 stands: faceless science drawings only. **Stated simplification:** everything drawn in these fresh drops that shows a cell is alive. Dead cells, and things made of cells that are no longer alive, are left for Slide Files, and no line claims the opposite.

### Source check (this session)

| Claim the tables rely on | Source | How it was read |
| --- | --- | --- |
| Moving is not evidence of life: Brown and Brongniart "at first presumed a 'living' origin" for the jiggling, and "Brown subsequently showed that inorganic grains also demonstrated an irregular motion in suspension" | [Emory, *Brownian Motion* reading](https://faculty.college.emory.edu/sites/weeks/squishy/reading1.html) | Opened. Particle sizes are not given there, so specks are drawn drifting with the water, not as a size-specific jiggle |
| Air bubbles in a wet mount look like round things with a thick dark edge and a bright middle, and can be mistaken for structures | [microbehunter.com](https://www.microbehunter.com/what-are-the-effects-of-air-bubbles-under-the-cover-glass/) (opened: bubbles "cause some problems, especially for beginning microscopists"; it does not describe the look), [medicallabnotes.com](https://medicallabnotes.com/air-bubbles-microscopy-introduction-identification-and-keynotes/) (opened: "round, clear", "smooth borders", and recognising them prevents "misinterpretations") | The dark rim and bright centre are **known from search summaries only** (refractive-index explanations). The drawing uses a thick edge and an empty middle, which both opened pages fit |
| Spirogyra-like green threads are cells "rod shaped and attached end-to-end in long, filamentous chains", with "ribbon-like, spiral chloroplasts (visible inside each cell)", photographed at 100× | [Sierra College slide page](https://biosci.sierracollege.edu/resources/mslides-2016/mslides-bio4-pages2016/spirogyra.html) | Opened. The thread's boxes and spiral are drawn from stop 3 (the microscope stop the 1–4 status already ties to ~100×) |
| Onion skin cells form "a single layer" and "do not contain chloroplasts" | [Wikipedia, *Onion epidermal cell*](https://en.wikipedia.org/wiki/Onion_epidermal_cell) | Opened. That the walls show as long boxes under a light microscope comes from search summaries of school practical pages only. Level 7's *Wall clue* still has its own point (plant or animal by the wall, not the colour), so onion skin is used here only as "many cells" |
| A small round green alga (Chlorella-like) is one "spherical or ellipsoidal" cell, "2 to 12 µm", which "lack motility", with a cup-shaped chloroplast | [Freshwater Biodiversity of Bangladesh, *Chlorella vulgaris*](https://freshwaterbiodiversity.org.bd/?p=12292) | Opened (the Connecticut College key returned 403). At that size it is only a dot at stop 3 and shows its edge and green cup only at stop 4 |
| A paramecium-like swimmer is one cell, its outline shows near 100× and its hairs near 400× | Already cited in the [1–4 status](#puddle-lens-levels-14-definition) (Berdan; iNaturalist) | Not re-opened |

No size, number or species name is drawn or spoken. The drawings stay "a swimmer", "a green ball", "a green thread", "onion skin", "a leaf", "a grain of sand", "a mud speck" and "a bubble".

### The model, added to `logic.ts`

- **Evidence features, not every visible feature.** Each candidate has, per stop, a set of **evidence** marks: `edge` (an edge all round), `inside` (parts inside the edge), `hairs` (a fringe), `empty` (a thick edge with nothing inside), `ragged` (a rough edge with nothing inside), `boxes` (boxes side by side sharing walls) and `cracks` (bumps and cracks, no boxes). **Moving** and **colour** are drawn but are **never evidence**. This refines the study's rule test ("can't tell yet is accepted exactly when the two candidates share every *visible* feature"). Under that wording a swimmer and a drifting speck would differ by movement alone, which contradicts the study's own "movement alone never counts". It also keeps level 8's *Why green?* honest, since colour alone must never have decided anything earlier.
- **Level-5 candidates** (evidence by stop; nothing separate shows at stop 1, where the view is the whole drop):

| Candidate | Truth | Stop 2 | Stop 3 | Stop 4 | Moves | Colour |
| --- | --- | --- | --- | --- | --- | --- |
| `swimmer` (the built swimmer art) | alive | — (a speck) | edge, inside | edge, inside, hairs | swims and turns | pale |
| `green-ball` | alive | — (a speck) | — (a tiny dot) | edge, inside (a green cup) | still | green |
| `mud-speck` | not alive | — (a speck) | ragged | ragged | drifts with the water | brown |
| `silt` (a smaller speck) | not alive | — (a speck) | — (a tiny dot) | ragged | still | brown-green |
| `bubble` | not alive | — (a speck) | edge, empty | edge, empty | drifts with the water | clear |

- **Pairs are enumerated, never free.** A level-5 drop holds exactly one of three **reviewed pairs**, each one alive plus one not alive. Within every pair, **both move or both are still** (a test), so movement can never separate them. In pair C the colours differ but colour is not evidence.

| Pair | Candidates | Both | Deciding stop (lowest where evidence differs) |
| --- | --- | --- | --- |
| A | swimmer + mud speck | move | 3 |
| B | swimmer + bubble | move | 3 (the bubble's edge matches; *inside* versus *empty* decides) |
| C | green ball + silt | still | 4 |

- **`judgeLife(pair, ringed, stop, answer)`**, with `answer` one of `'alive' | 'not-alive' | 'cant-tell'`:
  - **Below the deciding stop** (the ringed and unringed candidates' evidence sets are equal): `'cant-tell'` gives `'right-for-now'` ("Right, we can't tell yet. What would show it?"). It is free and does not finish the speck. `'alive'` or `'not-alive'` gives `'could-be'`, free and **the same line for a true and a false guess** ("Could be. What would show it?"). So an early tap is never a free answer key, and nothing early counts.
  - **At or above the deciding stop:** the true answer is `'right'` and finishes the speck. `'cant-tell'` is a miss, `'can-tell-now'` ("We can tell now. Look at its edge and what's inside."). The false answer is a miss, `'look-at-it'`, with a line naming what the ringed thing's evidence shows, never the verdict: `look.inside` ("Look: it has parts inside its edge."), `look.empty` ("Look: just an edge, and nothing inside."), `look.ragged` ("Look: a rough edge, and nothing inside.").
  - **True answer:** `alive` exactly when the ringed candidate's evidence at that stop includes both `edge` and `inside`. A test checks this agrees with the table's Truth column at every deciding-or-higher stop.
- **Level-6 samples** (one slide at a time; the slide stays put while the dial turns). Each has a **class**, the evidence that shows it, and a **deciding stop** (the lowest stop where that evidence is drawn whole):

| Sample | Class | Evidence (from its deciding stop) | Deciding stop | Drawn below it |
| --- | --- | --- | --- | --- |
| `leaf` (built table, `boxes` 3–4) | many cells | boxes | 3 | the whole leaf, its edge hairs |
| `onion-skin` | many cells | boxes (long, no green; a faint dot in each from stop 4) | 3 | a thin clear piece (1–2) |
| `green-thread` | many cells | boxes end to end, each with a green spiral | 3 | a green wisp (1), a green thread (2) |
| `swimmer` | one cell | edge, inside | 3 | the drop, then a speck |
| `green-ball` | one cell | edge, inside | 4 | the drop, a speck, a tiny dot |
| `sand` (built table, `grain-bumps` 3–4) | not cells | cracks (irregular lines, never closed boxes) | 3 | the pinch, the separate grains |
| `bubble` | not cells | edge, empty | 3 | a speck |
| `mud-speck` | not cells | ragged | 3 | a speck |

  At stop 2 the sand's *separate grains* are many things but not many cells. Sorting there is the free prompt, which is part of the lesson.
- **`judgeSort(sample, stop, tray)`**: below the deciding stop, every tray gives `'look-closer'`, free and the same for every tray ("Could be. Turn the dial until you can see its edges."). At or above it, the right tray is `'right'` and the slide slides into the tray. A wrong tray is a miss with the line for what the view shows: `see.boxes` ("Look: lots of little boxes side by side."), `see.one` ("Look: one edge all round, with parts inside."), `see.empty`, `see.ragged` or `see.cracks` ("Look: bumps and cracks, but no boxes.").
- **Deviation from the study:** its level-6 round had "a clump of yeast-like cells" sorted as "one cell each". It is **dropped** because yeast belongs to the cooking and food studies. Also, telling loose separate cells from tissue that shares walls is a finer cue than these two levels teach, and putting a clump in the "one cell" tray contradicts the picture. The green ball is drawn alone, never clumped (the Chlorella source notes it can also occur "in irregular clumps"). A clump case can return with Slide Files.
- **Motion:** swimmers keep the built seeded paths (at most 30 units a second, turning gently, still while any finger is down). A drifting speck or bubble follows a slow seeded straight drift, also capped at 30 and also still while a finger is down. Still candidates do not move. Nothing is tapped on the drop at levels 5–6, so no target ever moves under a finger.
- **Variety:** seeded from `ctx.rng`: which pair each drop holds, which of the two is ringed, positions, swimmer shapes (round, long, bean), the leaf kind, and the sample order and choice at level 6.
- **Rounds:** **Level 5:** three drops. Across the three there is at least one pair decided at stop 3 (A or B) and pair C at least once, and the ringed speck is alive at least once and not alive at least once. **Level 6:** four slides with every class at least once and at least one sample decided at stop 4 (the green ball). Neither level draws two copies of a sample in one round.

### Screen and controls

- **Ringing:** the companion's ring (a soft dashed circle, at least 120 across at every stop, which follows its speck) marks which speck is asked about. **She never taps a speck**, so the specks' size at stop 2 does not matter for targets.
- **Level 5 buttons:** the four built stop buttons (110) plus three answer buttons, each at least 120 and picture-only. Each speaks its name on touch-down, so no reading is needed: **alive** (a sprouting seed), **not alive** (a pebble) and **can't tell yet** (a lens with a small "?" curl drawn, not lettered).
- **Level 6 trays:** three trays, each at least 120 and picture-only, speaking on touch-down: **one cell** (one round outline with a dot), **many cells** (a block of boxes) and **not cells** (a pebble). Each holds the slides sorted into it.
- **Layout:** `lensLayout(view, 5 | 6)` adds a three-button group. **Landscape:** two columns at the right, the stops (as now) and the three answers or trays beside them. That takes about 242 units of width, which at 1024×768 leaves a lens near 510. **Portrait:** the answer row runs along the bottom edge to the right of the guide's corner, with the stop row above it. That leaves a lens near 470 at 768×1024. A single row of seven does not fit portrait (about 872 units), and stacking the rows above the guide's corner leaves the lens under 360. Either way it **returns null rather than shrink** (buttons under 110 or 120, a lens under 360). The rule test runs it at the four `lands.test.ts` views (landscape, portrait, phone, notch) and fails on null. These widths are arithmetic from the built constants (`STOP_SIZE`, `ANSWER_SIZE`, `GAP`, the corners), not a probe.
- **Music, pause sheet:** as levels 3–4 (Start again replays the seeded round from its first question; Show a hint).

### Ranges

`school` changes from `{4,4}` to `{4,6}`. Every other band is unchanged (`prek` stays `{3,4}`), and nothing is renumbered, so saved levels and pins keep their meaning. Levels 7–8 later extend school to `{4,8}` (decision of 2026-10-23).

### First rounds (authored)

- **Level 5:** drop one holds pair A, with the swimmer ringed. The dial starts at stop 2: two specks drift. "Is this one alive?" She presses **alive** at stop 2: "Could be. What would show it?" (free). She presses **can't tell yet**: "Right, we can't tell yet. What would show it?" (free). She taps stop 3: an edge all round, with parts inside. She presses **not alive**: a boing and "Look: it has parts inside its edge." (one miss). She presses **alive**: "An edge all round and parts inside. It's alive!" Drop two is pair C with the silt ringed: at stop 3 both are tiny dots (one green, one brown), and **can't tell yet** is right-for-now. At stop 4 a ragged edge with nothing inside shows, and **not alive** is right. Drop three is seeded under the round rules.
- **Level 6:** the green thread, the swimmer, the sand and the green ball, in that order. Green thread: at stop 2 she taps **one cell** ("Could be. Turn the dial until you can see its edges.", free). At stop 3 the boxes appear, and **many cells** is right. Swimmer at stop 3: **many cells** is a miss ("Look: one edge all round, with parts inside."), then **one cell** is right. Sand at stop 3: **not cells**. Green ball: at stop 3 the tray taps are free. Show a hint turns the dial to 4, and **one cell** is right.

### Accounting, help and finishing

- **Misses:** only a committed answer at or above the deciding stop that is wrong (level 5: the false verdict or *can't tell yet*; level 6: a wrong tray). Turning the dial and every answer below the deciding stop are free. One miss per wrong press.
- **Glow:** after two misses on one speck or slide, the right button or tray glows. It is a standing glow and counts nothing extra.
- **Hints:** at most one per speck or slide, from Show a hint. It turns the dial to the deciding stop (`helpFor(5|6, …)` returns `{ do: 'turn', stop }`, reusing the built `Help` type), and the companion says the evidence line for what that stop shows (`look.*` / `see.*`). She still presses the answer, as at level 4. If the dial is already at or above the deciding stop, the hint only speaks the line.
- **Supported completion:** a hint plus the glow leave one press. Nothing times out; specks never leave the view.
- **Adaptation:** the shell's rule as built (two smooth rounds with at most one miss and no hints step up within school's `{4,6}`). Assisted finishes are not mastery; the hint counts.
- **Finish:** after the last speck or slide, everything waves once, then `ctx.finish({ misses, hints })`, and the shell gives one sticker. Still no journal entry or discoveries (decision 7). A "first living cell seen" entry needs its own line later.

### Speech (`voice-script.ts`)

New `lens.*` lines (the built keys keep their wording):
- `instruct.alive` ("Is this one alive? Look closer, then choose!")
- `instruct.cells` ("One cell, many cells, or not cells? Look closer, then choose!")
- the button names `say.alive`, `say.not-alive`, `say.cant-tell`, `say.one-cell`, `say.many-cells`, `say.not-cells`
- `could-be`, `right-for-now`, `can-tell-now`
- the evidence lines `look.inside`, `look.empty` and `look.ragged`
- `alive.yes` ("An edge all round and parts inside. It's alive!") and `alive.no` ("Nothing inside its edge. Not alive.")
- `look-closer-edges`
- the evidence lines `see.boxes`, `see.one`, `see.empty`, `see.ragged` and `see.cracks`
- the sorted lines `sorted.one` ("One cell, all by itself."), `sorted.many` ("Lots of cells, side by side.") and `sorted.not` ("No cells at all.")

None of them names a microbe, germ, species, size or number.

### Rule tests (`logic.test.ts`)

- **Candidates:** every evidence set is defined at stops 1–4. Evidence never shrinks as the stop rises, except where a feature leaves the view by the built windows; no level-5 or level-6 evidence leaves. Moving and colour are not in any evidence set.
- **Pairs:** exactly pairs A–C. Each has one alive and one not alive. Both members move or both are still. The deciding stop is the lowest stop where their evidence differs, it matches the table, and at stop 4 the pair always differs. `'cant-tell'` is `'right-for-now'` exactly below the deciding stop.
- **Judging:** at every stop and for every answer and ringed side, `judgeLife` gives the same verdict for `alive` and `not-alive` below the deciding stop (no oracle). At or above it, it misses only on the false verdict or *can't tell yet*, and the truth rule (`edge` and `inside`) agrees with the Truth column. `judgeSort` gives one identical free verdict for all trays below each sample's deciding stop and misses only on wrong trays above it. Each sample's class evidence is drawn at its deciding stop and at stop 4.
- **Rounds:** across 500 seeds, level 5 has three drops that satisfy the round rules, and level 6 has four distinct samples with every class and a stop-4 decider. The authored rounds match their stories.
- **Help:** `helpFor` names the deciding stop. A scripted speck (wrong verdict, Show a hint, Show a hint again, right verdict) counts one miss and one hint. Two wrong presses light the right button.
- **Motion:** drifting candidates stay inside the drop and under 30 units a second, and still candidates do not move.
- **Layout:** `lensLayout` at levels 5 and 6 at the four views gives buttons at least 110 or 120, the lens at least 360, no overlaps with the corners or each other, everything inside `view`, and null rather than smaller.
- **Registry, lands and how-to tests** pass with school `{4,6}`.

### Ghost finger and how-to card

- **Ghost finger:** `autotouch()` at levels 5–6 follows `helpFor`. It taps the deciding stop, then the right button or tray (the bot reads the truth from `logic.ts`), for each speck or slide in turn.
- **How-to card** (`src/content/howto.ts`, added to the existing card):
  - Steps: "Turn the dial until you can see the ringed speck's edge, then choose alive, not alive or can't tell yet" `{ from: 5, to: 5 }`; "Turn the dial until you can see the edges, then put the slide in one cell, many cells or not cells" `{ from: 6, to: 6 }`.
  - Finish: "Every ringed speck answered" `{ from: 5, to: 5 }`; "All four slides sorted" `{ from: 6, to: 6 }`.
  - Notes: "Moving or being green never proves something is alive; the edge and what's inside do" `{ from: 5, to: 6 }`; "Answering before the view can show it is never wrong; it only asks to look closer" `{ from: 5, to: 6 }`; extend the built Show-a-hint note's range from `{ from: 3, to: 4 }` to `{ from: 3, to: 6 }`.
- **Co-play:** "Slide and lens" at level 5: the grown-up rings a speck by pointing, and she says "alive", "not alive" or "can't tell yet" before each turn of the dial. **Off-screen** (spoken tip, no equipment): "Something moving isn't always alive. Leaves blow and bubbles float. What else moves but isn't alive?" Still no microscope, water-collecting, culturing or sunlight instruction (decision 5).
- **Couch:** none. **Rework couplings:** none.

### Check tier (the build)

New interaction on an existing game: typecheck, unit tests (above, plus registry, lands, how-to and voice), and one scripted play through the existing Puddle Lens `browser-check.mjs` case extended to levels 5 and 6. At level 5: one free early guess, one miss at the deciding stop, Show a hint, to the sticker. At level 6: one wrong tray and to the sticker. Also one portrait and one landscape screenshot of level 5's two button groups, `fingerdemo` at levels 5 and 6, and `npm run build` (voice and how-to change).

Device and person checks stay open: whether a six-year-old waits for the evidence or guesses, whether "can't tell yet" feels like a real answer, and how the iPad says the button names. Browser automation establishes none of these.
