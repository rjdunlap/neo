# Gear Garden, levels 1–3 (definition)

Defined 2026-10-22 as slice 1 of the [machines-and-tools study](../deep-dives/subjects/machines-tools.md#build-slices-in-order), from its [proposed ladder](../deep-dives/subjects/machines-tools.md#gear-garden-first-games-proposed-ladder) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#machines-and-tools-recommendations). Docs only: no game, ID registration, voice line, save field or band exists yet.

**Status: defined; the build (the study's slice 2) waits on one developer confirmation.** The [Waiting row](../WAITING-ON-DEVELOPER.md) "Machines/tools: reviewed models, practical cards and placement" asks for Tinker Lab capacity and the child/grown-up registration arrangement to be confirmed **before implementation**. This packet measures the capacity ([Home land](#home-land-and-capacity)) and gives a default arrangement (child `GAMES` only, below); the build starts when the developer accepts or changes those two defaults. No reviewer gates levels 1–3 otherwise: every gear is the same size, nothing is said about real machines, and there is no practical card. The science/mechanism reviewer gates levels 4–5 (ratios); the practical-safety reviewer gates any making or handling card.

**Fun action and purpose:** a little machine of big painted gears stands in a flower bed, a handle on the first gear and a flower on the last. She taps the machine and the gears turn, tooth in tooth, until the far flower spins and blooms. Then a gear is missing and she drops one into the gap; then she picks which of two machines to mend. The learning purpose is **contact transmits motion** (a gear only turns the next one when they touch, level 2) and **each touching gear turns the other way**, so a line of three keeps the handle's direction and a line of four reverses it (level 3, seen rather than asked). It answers the study's L, T, P and K rows ([audiences](../deep-dives/subjects/machines-tools.md#an-answer-for-every-audience)): an immediate effect, a single visible connection, a gap to fill, a choice between two machines.

## Identity and overlap

- **Quick Tricks** keeps its proposed crank microgame. Gear Garden has **no circular crank gesture** at any level: a tap is the whole input.
- **Chain Reaction** owns ball routing; **Ramp Race** owns ramps and glide; **Seesaw Balance** (and the proposed Mobile Maker) owns weight and torque; **Lift It** owns force and rope travel. Gear Garden simulates none of these: it moves rotation through touching gears and nothing else.
- **Attic Finds** shows an authored crank linkage to observe; it never builds one. Gear Garden is the island's only game where she connects a mechanism.
- **Puppet Workshop** (study slice 4, undefined) would make expressive motion with cams; Gear Garden's flowers only spin and bloom.

## The model (`logic.ts`)

- **Gears** are all the same size at levels 1–3: pitch radius `r` (layout units), **12 teeth**, tooth pitch `p = 2π / 12`.
- **A board** is a list of **sockets** in board coordinates, each `{ x, y, role }` with `role` `input` (carries the handle; always filled, fixed), `output` (carries the flower; always filled, fixed), `idler` (filled, fixed) or `gap` (empty; the only place a loose gear can go). Adjacent sockets lie on one straight line at centre distance exactly `2r`, the line tilted by `α ∈ {0°, +15°, −15°}` and drawn input-left or input-right (a seeded mirror).
- **Contacts:** `contacts(board, filled)` lists every pair of filled sockets whose centres are within `ε` of `2r`. Each is a mesh. `validate(board)` rejects a board where any two sockets are closer than `2r − ε` (overlap) or between `2r + ε` and `2.4r` (teeth tips would clash without meshing), so non-adjacent sockets (4r apart on a line) never touch and no unintended contact or locked loop can occur. A line board is acyclic by construction.
- **Turning:** `propagate(board, filled, inputTurns)` walks the contact graph from the input: `turns[j] = −turns[i]` for every mesh (the equal-gear case of the study's `turns[j] = −turns[i] · teeth[i] / teeth[j]`), exact quarter-turn integers, never pixel angles. A socket not reached from the input has `turns = 0` and does not move. `connected(board, filled)` is true when the output is reached.
- **Teeth phase:** a driven gear `j` meshing with `i` along direction `α` (from `i` to `j`) is drawn at `θ_j = −θ_i + 2α + π + p/2` (mod `p`), so a tooth of one always sits in a gap of the other. Animation samples this; rules never read it.
- **Input:** one tap = one **quarter turn** of the handle gear, clockwise; the Turn-back button = one quarter turn anticlockwise. Either direction counts toward completion.
- **Completion of one machine:** the output has turned **four quarter turns in total** (any mix of directions; the count is `|Δ|` summed, so a back-and-forth toddler still gets there) while connected. The flower opens one petal ring per quarter turn and blooms at four.
- **Level 2 board:** three sockets, `input – gap – output`; one loose gear in the tray. Exactly one completing placement.
- **Level 3 case:** two machine panels, **A** = three sockets `input – gap – output`, **B** = four sockets `input – idler – gap – output` or `input – gap – idler – output` (seeded), each with its own one loose gear. She opens one; either completed machine finishes the case. A completed A's flower turns **the same way** as the handle; B's turns **the other way**.
- **Hint:** `helpFor(state)` returns the move that completes the open board from the current state: at level 1 "turn"; at levels 2–3 "put the loose gear in the gap" (if the loose gear is in the tray), then "turn". The loose gear can only rest in the tray or the gap, so there is no conflicting placement to undo.
- **Variety:** seeded from `ctx.rng`: tilt, mirror, B's gap position, flower kind and colour (tulip, daisy, sunflower; palette colours), and the visitor who comes to sniff the bloom (`CRITTERS`). The rule graph never changes with the art. The first round of each level is authored (below) so the how-to card and demonstration open on the same story.

## Screen and controls

- **The machine** sits on a broad wooden panel, the **machine face**, in the middle of the screen: gears drawn with 12 rounded teeth, a big knob on the input's handle, the flower on the output's axle. A **tap anywhere on the machine face** (except on the loose gear) is one quarter turn. Touch-down presses the handle in at once; the turn takes about 0.3 s with a soft ratchet tick per tooth and a pentatonic chime (`src/audio/notes.ts`) as each petal ring opens. Taps during a turn queue at most one more.
- **Direction arrows:** after each turn a curved arrow shows beside the handle and beside the flower (the input's in one colour, the output's matching it), so direction is visible with sound off. Gears not reached show no arrow and stay still.
- **Turn-back:** a round curved-arrow button, at least 110×110, at the bottom right. Present at every level and band; at lap it simply turns the other way.
- **The loose gear (levels 2–3)** rests in a tray at the bottom centre, clear of the guide's bottom-left corner. It is dragged with `src/engine/drag.ts` (riding 40 units above the finger). A drop whose gear centre lands within `1.2r` of the gap's centre snaps in with a clunk; any other drop glides back to the tray while the gap pulses once (the socket cue). A placed loose gear can be dragged back out to the tray at any time (revision is free). A press on the loose gear that does not move past the drag threshold is a turn, like the rest of the face.
- **Level 3 choice:** two pictured panels side by side (stacked in portrait), each at least 300×220, showing its machine in miniature with the gap and loose gear drawn. Tapping one opens it full size; a small picture of **the other machine**, at least 120×120, stays at the right edge, and tapping it swaps boards (the first board resets, its loose gear back in its tray; free).
- **Sizing:** `gearLayout(view, board)` chooses `r` from the room left after the tray, the Turn-back button, the home button, the guide's corner and (level 3) the other-machine card, up to `r = 90`. Gears and the loose gear are drawn at tip radius `1.12r`, so the loose gear (the one drag target) is at least 100 units across when `r ≥ 45`. The worst case is board B (four gears, `8r` plus tips along the line) in portrait 768 wide: about `r = 80` with 40-unit margins. If a view cannot give `r ≥ 45` the layout returns **null** rather than shrink, and the test fails. Gear teeth and pegs are decoration, never precision targets.
- **Pause sheet:** Start again (the same seeded round from its first machine, keeping hints) and Show a hint (`Scene.pauseActions`).
- **Music:** Tinker Lab's island style keeps playing (she is not making music); ticks and chimes are synthesized.

## Levels

| Level | Name | Bands (default) | What she does | Round |
| --- | --- | --- | --- | --- |
| 1 | **Turn a flower** | lap, toddler, preschool | Taps the assembled machine (two gears) until the flower blooms; may turn back | Three flowers |
| 2 | **Bridge the gap** | preschool, pre-K | Drops the loose gear in the gap of a three-gear line, then turns | Three machines |
| 3 | **Two machines** | pre-K, school | Chooses one of two broken machines (three or four gears), mends it and turns; hears whether the flower went the same way or the other way | Three cases |

Ranges (a `BandLevels` table): lap `{1,1}`, toddler `{1,1}`, preschool `{1,2}`, prek `{2,3}`, school `{3,3}`. No `grownup` range and no `GROWNUP_GAMES` entry until levels 6–8 exist ([decision 1](#open-decisions)).

### First rounds

- **Level 1 (authored):** two gears, the handle on the left, a pink tulip on the right, line level. She taps the panel: the handle gear clicks a quarter turn clockwise, the tulip's gear turns anticlockwise, both arrows show, one petal ring opens. Three more taps and the tulip blooms; the duck waddles in to sniff it. Then a daisy (tilted +15°, mirrored), then a sunflower; after the third bloom the round finishes.
- **Level 2 (authored):** handle left, gap in the middle, daisy right. She taps the face first: the handle turns, the gap shows empty and the daisy stays still (free). She drags the loose gear and drops it short of the gap: it glides home and the gap pulses (free). She drops it in: clunk. Four taps; all three gears turn, the daisy blooms. Two more machines follow, one mirrored and one tilted.
- **Level 3 (authored):** panel A (three gears) and panel B (four gears, gap second from the handle). She opens B, drops the gear, taps: the flower turns the other way from the handle; "Your flower turns the other way!" She blooms it. The next case she opens A; "The same way as the handle!" The third case is seeded.

## Accounting, help and finishing

- **No misses, ever.** Turning a broken machine, dropping off the gap, pulling a gear back out, opening the other machine and turning back are all experiments ([study](../deep-dives/subjects/machines-tools.md#gear-garden-first-games-proposed-ladder)): `misses` is always 0. **Adaptation therefore rests on hints alone:** two rounds with at least two hints each step down; two rounds with no hints step up (the shell's ordinary rule, `src/progress/difficulty.ts`). This is deliberate, and a smooth round shows only that she completed the toy.
- **What counts as a hint** (at most **one per machine**, shared between all three):
  1. **Show a hint** in the pause sheet: at level 1 the handle glows and turns once by itself; at levels 2–3 the loose gear flies into the gap by itself (automatic placement).
  2. **The glow:** after **two still trials** on one machine (a *trial* is a run of turns with the output not moving; it ends when she next touches the loose gear or opens the other machine, so a first look at a broken machine is free), the gap glows and the loose gear wiggles.
  3. **Supported finish:** after the glow, two more still trials install the gear by itself, so every machine can finish.
  At level 3, Show a hint before a machine is open wiggles both panel pictures and counts nothing (either is right).
- **Level 1 cannot finish untouched.** The study offers Finish from the start, but a zero-touch finish would report a smooth 0/0 round and step a preschooler up. As Rainbow Fingers shows its frame only after she paints, level 1 finishes when the third flower blooms; she leaves earlier through Home or the pause sheet, which award nothing. This replaces the study's always-available Finish for levels 1–3.
- **Finish:** after the last machine, every flower waves and `ctx.finish({ misses: 0, hints })`; one ordinary sticker from the shell, with or without help. Nothing is kept, filed or saved.

## Speech (`voice-script.ts`)

Lines under `gears.*`: `intro`, `instruct.turn` ("Tap the machine to turn the flower!"), `instruct.gap` ("A gear is missing. Put it in the gap, then turn!"), `instruct.choose` ("Pick a machine to fix!"), `still` ("The flower can't turn yet. Something isn't touching."), `snap` ("Clunk! Now they touch."), `same` ("Your flower turns the same way as the handle!"), `other` ("Your flower turns the other way!"), `bloom`, `hint`, `done`. Every line is about **this machine**: "touching gears turn each other" and "the next gear turns the other way" describe the toy on screen. No line says what real gears, bikes or clocks do; that waits on the mechanism reviewer ([decision 3](#open-decisions)).

## Rule tests (`logic.test.ts`)

- **Contacts:** on every authored and seeded board (500 seeds per level), `validate` passes; contacts are exactly the adjacent filled pairs; no two sockets overlap or clash.
- **Turning:** one input quarter turn moves every connected gear exactly one quarter turn, alternating sign along the line; reset and repeat are deterministic; turning back returns every gear to its start.
- **Disconnected:** with the gap empty the output's `turns` stays 0 for any input sequence, and the board never completes.
- **Both directions:** a sequence of four clockwise, four anticlockwise, or any mix summing four quarter-turn steps completes a connected machine.
- **Full solution set (level 2):** of the loose gear's two resting places (tray, gap), exactly the gap completes.
- **Level 3 enumeration:** for each of A and B, exactly one completing placement; completed A's output sign equals the input's, completed B's is opposite; both of B's seeded gap positions are covered across seeds; the other-machine swap resets the left board.
- **Teeth phase:** at sampled input angles, the driven gear's nearest tooth to the contact direction is half a pitch from it.
- **Help:** `helpFor` in every reachable state leads to completion; a scripted level-2 machine (turn, drop short, turn, Show a hint, Show a hint again) counts one hint, and the glow and supported finish on another machine add one hint between them.
- **Authored first rounds** match the stories above.
- **Layout:** `gearLayout` at the four views `lands.test.ts` uses (landscape, portrait, phone, notch) for the level-1, level-2, A and B boards and the level-3 choice: loose gear, Turn-back, both panels and the other-machine card at least 100 units each way; nothing overlapping the home button or the guide's bottom-left corner; everything inside `view`; null rather than `r < 45`.
- **Registry, lands and how-to tests** pass with the new game, including Tinker Lab on one screen at every band.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` follows `helpFor`. Level 1: four taps on the machine face, one Turn-back tap on the second flower. Levels 2–3: the real drag of the loose gear into the gap, then taps; level 3 first taps panel B. No circular gesture.
- **How-to card** (`src/content/howto.ts`). Goal: "Make the flowers spin with a machine of gears."
  - Steps: "Tap the machine to turn the handle; the gears turn the flower" `{ from: 1, to: 1 }`; "Drag the loose gear into the gap, then tap to turn" `{ from: 2, to: 2 }`; "Pick one of two broken machines, put its gear in the gap and turn" `{ from: 3, to: 3 }`; "The round arrow turns it the other way" (all levels).
  - Finish: "Every flower has bloomed."
  - Notes: "Nothing here is ever wrong: turning a broken machine shows where the turning stops" (all levels); "Show a hint, the glow on the gap and the gear going in by itself each count as a hint, once per machine" `{ from: 2, to: 3 }`; "A machine of three gears turns the flower the same way as the handle, four the other way; she only watches this" `{ from: 3, to: 3 }`.
- **Registration:** ID `gear-garden`, name "Gear Garden", spoken title `game.gear-garden` ("Gear garden"). Region (subject) `tinker-lab`. Skills `['cause-and-effect', 'simple-machines', 'gears', 'direction']` (free strings in `types.ts`; `gears` and `direction` are new). Bands as above, child `GAMES` only ([decision 1](#open-decisions)). Hub icon: two meshed gears with a tulip on one. Sticker: a seeded flower blooming on a gear.
- **Art:** code-drawn in `src/games/gear-garden/art.ts` with `src/art/palette.ts`: gears, the panel, handle, tray, flowers, arrows. Visitors from `CRITTERS`. No imported art or audio.
- **Co-play:** one-device turns: the grown-up says "same way" or "other way" before she turns, and she checks; then swap. **Off-screen** (spoken tip): "Look for something at home that turns, and watch which way it goes." (noticing only; no handling or making instructions, which wait on the practical-safety reviewer).
- **Couch:** none. **Rework couplings:** none required and nothing saved.

## Home land and capacity

Measured 2026-10-22 with a throwaway `landLayout` probe at `964df9cc` (Tinker Lab's current games plus Gear Garden, visible from lap; the four `lands.test.ts` views; not committed):

| Band | Her games with Gear Garden | Signpost | Fits | One more |
| --- | --- | --- | --- | --- |
| lap | 3 | yes (10) | yes | yes |
| toddler | 5 | yes (8) | yes | yes |
| preschool | 6 | yes (7) | yes | yes |
| pre-K | 12 | yes (1) | yes | **no** |
| school | 12 | yes (1) | yes | **no** |
| grown-up | 13 | no | yes | **no** |

Default **Tinker Lab** (12 games today, 13 with Gear Garden), the subject's land and the study's destination. It is then **full**: a 14th game fails at pre-K, school and grown-up. Sense Detective's queued build also defaults to Tinker Lab (pre-K/school), and Rain Garden's definition does too, so only one of them can take the last place. **Rule:** whichever builds first takes it; Gear Garden's fallback is **Treehouse** (7 games, the making land; Sand Table names it only as a fallback). `lands.test.ts` decides at build time.

## Check tier

New-game tier: typecheck and unit tests (above, plus registry, lands and how-to); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 (a Turn-back, one bloom) and level 3 (open B, drop short, Show a hint, finish), one portrait screenshot of board B at full size, `fingerdemo` at levels 1 and 3, and `npm run build` because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a lap child connects a tap to the far flower; whether a three-year-old manages the drag on an iPad; whether the four-gear reversal is noticed without the spoken line; how the iPad says "the other way". Browser automation establishes none of these.

## What comes next

**Gear Garden 4–5** (study slice 5, after first play): *Turn this way* (an arrow request) and *Big and small* (12 and 24 teeth), defined and then built with geometry-backed ratio rules; the mechanism reviewer reads the drawn ratios first. Levels 6–8 or Mobile Maker follow audience observation (slice 6).

## Open decisions

1. **Registration arrangement (gates the build).** Default: a child game in `GAMES` at lap–school with the ranges above; no `grownup` range and no `GROWNUP_GAMES` variant until levels 6–8. Alternative: a later grown-up Gear Garden in Lantern Lake (12 games; its own capacity test).
2. **Home land (gates the build with 1).** Default Tinker Lab as measured, full afterwards; fallback Treehouse; first of Gear Garden and Sense Detective to build takes Tinker Lab.
3. **Real-world words.** Default: none at levels 1–3. A line connecting the toy to bikes or clocks joins after the mechanism reviewer.
4. **Glow as a hint.** Default: counted, as the study counts answer-revealing help. Alternative: an uncounted glow, which would make every preschool round read as smooth.
