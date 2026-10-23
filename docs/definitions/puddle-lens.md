# Puddle Lens, levels 1–4 (definition)

Defined 2026-10-22 as slice 1 of the [cells-and-microbes study](../deep-dives/subjects/cells-microbes.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/cells-microbes.md#a-first-games-ladder-puddle-lens) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#cells-and-microbes-recommendations). Docs only: no game, ID registration, voice line, save field or band exists yet.

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

**Puddle Lens 5–6** (study slice 3, docs only): alive / not alive / can't tell yet, and one cell or many. It needs a named biology/microbiology educator first, since those levels make the first claims about living things. Slide Files (slice 5) follows 5–6.

## Open decisions

**Decided 2026-10-23 (on the developer's delegation):** Puddle Lens is a new game, home Bubble Beach (its 11th, within the measured 13), levels 1–2 on the ordinary rule with no shell change; levels 7–8 at the top of `school` and Slide Files on `grownup`; faceless science drawings only, with no germ, hygiene, illness or "bad microbe" content. The stop order, feature table and level 3–8 lines take the building session's check against cited sources instead of named reviewers; a hand-lens card takes the same check, and microscope, culturing, swab, body-sample, pond-collection or sunlight-through-lens instructions are not drafted.

1. **Identity (gates the build).** Default: a new game. Level 4's [table](#level-4-questions) has eleven questions with windows of one or two stops, six that can be too close and eight that can be too small, so "how close is enough" is a real decision on one fixed sample. Alternative: fold the feature tables into Zoom Walk's small end.
2. **Home land (gates the build).** Default Bubble Beach as measured, leaving two places (Sand Table defaults there too). Alternative: the rework's Explore places when they exist.
3. **Reviewer.** The science-and-scale-facts reviewer row covers the stop order, the feature windows and the level 3–4 lines; it reads them before the build merges. Until "Who reviews content?" is answered, no build merges.
4. **Levels 1–2 accounting (gates the build).** Default: no shell change, with the ranges above. Two smooth rounds step a toddler from 1 to 2 and a preschooler from 2 to 3 ([accounting](#accounting-help-and-finishing)). Alternatives: preschool `{3,3}`, or a new exploratory flag on `RoundResult` shared with Far Lights and Space. The flag would be shell work done first.
5. **Practical card.** None drafted. A hand-lens or microscope card needs a named reviewer; never culturing, swabs, body samples, pond collection or sunlight through a lens.
6. **Framing.** Faceless science drawings in the lens; the companion reacts beside them. No germ, hygiene, illness or "bad microbe" content.
7. **Journal.** Default: no journal entry or discoveries at levels 1–4. A "first swimmers seen" entry could join with a reviewed line later.
