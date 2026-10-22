# Ready for Adventure, levels 1–3 (definition)

Defined 2026-10-22 as slice 1 of the [routines-and-self-care study](../deep-dives/subjects/routines-self-care.md#build-slices-in-order), from its [first game's proposed ladder](../deep-dives/subjects/routines-self-care.md#first-games-proposed-ladder) and the [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#routines-and-self-care-recommendations). Docs only: no game, ID registration, voice line, art or save field exists yet.

**Status: ready to build (RA2) on the defaults below.** Every prop is imaginary parade gear: no washing, dressing, teeth, toilet, food or sleep step is drawn or spoken, so the study's practical-care reviewer ([WAITING](../WAITING-ON-DEVELOPER.md), "Who reviews practical self-care instructions") does not gate it. The study asked only that land fit be checked before registration; [decision 1](#open-decisions) gives the default and the layout test that decides it. Levels 4–5 (a changed request, one shared workbench) are separate later packets.

**Fun action and purpose:** the companion is going to the island parade. A picture card shows what it wants to bring. On a broad bench lie the props, some not ready yet: a bare flagpole beside its ribbon, a drum beside its beater. She drags the ribbon onto the pole and it becomes a flag; she drags the finished flag into the bag. When the bag holds everything on the card, the companion pulls a little wagon across the screen and uses exactly what she packed: the flag waves, the drum booms. The learning purpose is **prerequisite reasoning**: a prop must be ready before it can be packed, and two independent jobs can be done in either order (Head Start P-PMP 4's growing responsibility within a routine, and the AAP/Sesame point that a routine has necessary steps and free choices). It claims nothing about real self-care.

## Identity and overlap

Rechecked 2026-10-22 against the catalog and the open proposals:

- **Weather Wardrobe** (Cozy Village, lap–pre-K) packs a suitcase at level 6 by **weather category**: every item is already wearable and the decision is which belong. Ready for Adventure's level 1 is also a single picture-to-bag pick, but only as the toddler entry onto the same bench, bag and parade; its identity is levels 2–3, where an object's **state** (pole or flag) decides whether it may be packed. No clothing, weather or forecast appears here.
- **Story Steps** and **Teddy Doctor** order steps. Story Steps arranges picture cards into a sequence; Teddy Doctor's check-ups follow a fixed card or spoken order. Here she never orders cards: actions happen **on the objects**, and level 3's four action pictures are a non-interactive **status rail** that ticks as jobs finish. Any order that respects the two dependencies is right, which neither game accepts.
- **Scoop Shop** builds an order by stacking scoops; any scoop can go on at any time. There is no "not ready yet" state.
- **Recipe Workshop** (cooking study, defined separately) owns pretend food and mixing. No food, drink or kitchen object appears here.
- **Toy Drawer: Make it Fit** (proposal) owns fitting shapes into limited space. The bag here has room for everything requested; space is never the puzzle.

## The model (`logic.ts`)

- **Props** and their states:

  | Prop | States, in order | Part it needs | Packable when |
  | --- | --- | --- | --- |
  | `flag` | `bare` (a pole) → `ready` (ribbon tied on) → `packed` | `ribbon` | `ready` |
  | `drum` | `bare` (no beater) → `ready` (beater clipped on) → `packed` | `beater` | `ready` |
  | `bell` | `ready` → `packed` | none | always |
  | `ball` | `ready` → `packed` (never requested; level 1's other choice) | none | never requested, so packing it is a miss |

  At level 1 every prop starts `ready`. At levels 2–3 the requested props start `bare` and their parts lie loose on the bench.
- **Actions** are `attach(part, prop)` and `pack(prop)`. `attach` is legal iff the part belongs to that prop and the prop is `bare`; it consumes the part and sets `ready`. `pack` is legal iff the prop is requested and `ready`; it sets `packed`. A part is never lost, duplicated or attached to two props.
- **Packed is final at levels 1–3.** Nothing comes out of the bag; an illegal pack is refused, so no state can become unsolvable. Unpacking arrives with level 4's changed request.
- **Jobs:** each requested prop is one job: its attach (if `bare`) then its pack. Level 3 has two jobs with actions A1 (ribbon → pole), A2 (pack flag), B1 (beater → drum), B2 (pack drum); the valid orders are every interleaving with A1 before A2 and B1 before B2, **six** in all.
- **`nextActions(state)`** returns every legal action that advances an unfinished job; `hintFor(state, job)` returns that job's single next action. `done(state)` is true when every requested prop is `packed`.
- **`judge(state, gesture)`** turns a deliberate gesture into one of: `attach`, `pack`, or a refusal with its reason (`notReady`, `wrongPart`, `notRequested`, `looseToBag`), plus the job a miss is charged to. Non-deliberate gestures (below) never reach it.
- **Authored first round** for each level so the how-to card and demonstration open on the same bench; later rounds are seeded from `ctx.rng` within each level's variation. Every generated round is finishable from its start.

## Levels

| Level | Name | Bands (default) | What she decides | Finish |
| --- | --- | --- | --- | --- |
| 1 | **Pack the flag** | toddler, preschool | Which of two finished props the card shows | The requested prop is packed, then the parade |
| 2 | **Make it ready** | preschool, pre-K | That the prop must get its part before it can go in | The prepared prop is packed, then the parade |
| 3 | **Two useful jobs** | pre-K | Which job to do first, keeping each prepare-before-pack | Both props packed in any valid order, then the parade |

No school or grown-up window in this build. Levels 4–5 are the school entry, defined later.

### First rounds

- **Level 1:** a finished flag and a ball on the bench, the bag on the right, the card showing the flag. Drag the flag into the bag; the bag zips and the parade starts. *Variation:* the request is seeded among flag, drum and bell (each drawn finished); the other choice is the ball or another finished prop; bench sides are seeded. The two choices always have different silhouettes.
- **Level 2:** a bare flagpole, its ribbon and the bag; the card shows the finished flag. Drag the ribbon onto the pole (or the pole onto the ribbon): the ribbon ties on with a twirl and the pole becomes the flag. Drag the flag into the bag. *Variation:* the job is seeded between flag (ribbon) and drum (beater); the flag's shape (triangle, swallowtail, square) and the ribbon's pattern (stripes, dots, zigzag) are seeded; the card always shows the finished prop's silhouette.
- **Level 3:** a bare pole, its ribbon, a drum without a beater, the beater, and the bag; the card shows the flag and the drum. Both jobs in any of the six orders. *Variation:* bench order and the flag and drum patterns. The two jobs are always flag and drum at this level (the bell has no preparation).

## Gestures and accounting

The primary input is a **drag** (`src/engine/drag.ts`: lift on touch-down, ride 40 units above the finger, float home if not accepted). A **tap-select, tap-place** alternative does the same thing for a hand that does not drag yet: a tap on a prop or part lifts it and rings it; a tap on a target performs the same gesture as dropping there; a tap on the selected object again, or on empty bench, puts it down. Both inputs call the same `judge`.

A **deliberate gesture** is a release (or a tap-place) inside a target's hit area: the bag, a prop or a part. Everything else is free:

| Gesture | Result | Counts |
| --- | --- | --- |
| Ribbon onto bare pole (or pole onto ribbon); beater onto drum (or drum onto beater) | Attach; the prop changes and its tick lands on the rail | Nothing; advances the job |
| A ready requested prop into the bag | Pack; it drops in, the bag lip bounces | Nothing; advances the job |
| A bare prop into the bag | Refused; floats back. "The flag needs its ribbon first." (or the drum's beater) | **1 miss**, that prop's job |
| A loose part into the bag | Refused. "The ribbon goes on the flagpole first." | **1 miss**, that part's job |
| A part onto the wrong prop (ribbon onto drum, beater onto pole), level 3 | Refused; floats back. "The ribbon goes on the flagpole." | **1 miss**, the part's job |
| The prop the card does not show into the bag (level 1) | Refused. "The card shows the flag. Let's bring the flag." | **1 miss**, the request job |
| Release anywhere else; passing over the bag; a prop dropped on a prop or a part on a part; a cancelled drag | Floats home | Nothing |
| Tap the card | Speaks the request ("Let's bring the flag and the drum") | Nothing |
| Tap the bag, a packed prop, the rail or the companion | Wiggle or chirp | Nothing |

**Two misses on the same job** glow that job's next action (the object and a dotted arc to its target) and count **1 hint**; that job's miss counter then resets. Misses on different jobs never combine toward a glow, though every miss counts toward the round. A job's counter also resets when the job advances. **Show a hint** (pause sheet) glows the next action of the unfinished job with the most misses, else the first unfinished job left to right, and counts **1 hint**; asking again while a glow is showing repeats the speech and counts nothing. **Assisted action:** while a glow shows, a tap on the glowing object makes the companion carry it to its target and perform the action, counting nothing more. Tapping a glowing object always works, so a supported round can always finish.

**Finishing:** after the last pack, the bag zips and the **parade** plays (about six seconds): the companion pulls a little wagon carrying exactly the packed props across a lane; the flag waves, the drum booms a pentatonic beat, the bell rings, with a cheer at the end. A tap anywhere skips to the end pose. `ctx.finish({ misses, hints })` runs once, when the parade ends or is skipped (`finished` guards a second call). One shell sticker, with or without help.

**Adaptation:** the shell's ordinary rule. An assisted round records its hints and is evidence of supported completion, not of independent planning; the how-to card says so.

**Pause sheet:** Start again (the same bench from its start, keeping the round's misses and hints) and Show a hint (`Scene.pauseActions`).

## Screen and controls

- **Bench:** a broad wooden bench across the lower middle, holding at most four objects (level 3) side by side. Props are at least 140×140 logical units, parts at least 110×110 hit boxes (the ribbon a curved striped strip, the beater a stick with a round head), all well apart. A bare pole and a bare drum read as unfinished by **shape**: the pole has an empty knot loop at its top, the drum an empty clip on its side, each with a faint dashed outline of the missing part; colour is never the only cue.
- **Bag:** a soft satchel at least 220×200 on the bench's right end, lip open. Touch-down on anything lifts or squashes it at once, with a soft pentatonic note from `src/audio/notes.ts`.
- **Request card:** top centre, at least 260×150, showing the finished props' silhouettes in their colours. It is a tap target only for replay.
- **Status rail** (levels 2–3): small action pictures (part → prop, prop → bag) under the card; `eventMode = 'none'`. A finished action ticks and slides to the right.
- **Companion:** `ctx.companion()`, standing behind the bench's left end, clear of the guide corner. It reacts on attach (`cheer`), on a refused gesture (`wiggle`) and pulls the parade wagon. Props ride the **wagon**, not the companion's hands: `part('hands')` is empty for some species (`PARTS[species].misfits`), and the wagon needs no new rig work ([decision 4](#open-decisions)).
- **Parade lane:** the bench slides down and the lane appears across the middle; the backdrop (bunting, a road, the village roofs) is seeded among three. No crowd, score or applause meter.
- **Sound:** synthesized only: a twirl for a ribbon, a click for a beater, a soft thump into the bag, the drum's beat and bell's ring in the parade. The island style keeps playing (she is not making the music, so no `silenced`); the parade's drum and bell fall on its beats through `music.beats()`.

`readyLayout(view, level)` returns every rectangle: card, rail, bench slots, bag, companion spot and parade lane. A test runs it at the four views the lands test uses and asserts: every target at least 100 logical units each way (props and bag larger, as above); no two targets overlap; at least 40 units between bench objects; the Home button (top-left) and the guide's bottom-left corner clear; everything inside `view`. If a view cannot fit level 3's four objects and the bag in one row, the layout puts the bag below-right of the bench; if that fails it returns null and the test fails rather than shrink.

### Layout sketches

**Landscape (1024×768):**

```
+------------------------------------------------------------+
| [Home]          [ card: flag + drum ]                       |
|                 [ rail: ⟶ ⟶ ⟶ ⟶ ]                           |
|                                                             |
|   companion                                                 |
|   ======================================== bench ========   |
|   [pole] [ribbon]   [drum] [beater]          [  bag  ]      |
|  pet                                                        |
+------------------------------------------------------------+
```

**Portrait (768×1024):**

```
+----------------------------------+
| [Home]   [ card: flag + drum ]   |
|          [ rail ]                |
|                                  |
|  companion                       |
|  ========= bench =========       |
|  [pole]  [ribbon]                |
|  [drum]  [beater]                |
|                     [  bag  ]    |
|  pet                             |
+----------------------------------+
```

In portrait level 3 uses two bench rows (each job's prop and part together) with the bag below-right; levels 1–2 use one row.

## Speech (`voice-script.ts`)

Instructions use `ctx.instruct` (the guide repeats them); everything else uses `ctx.say`.

- `ready.instruct.1`: "{pet} is going to the parade! Put what the card shows in the bag."
- `ready.instruct.2`: "Get it ready, then put it in the bag."
- `ready.instruct.3`: "Get both things ready and packed. You choose which first."
- `ready.request.flag` / `.drum` / `.bell` / `.flag-drum`: "Let's bring the flag." … "Let's bring the flag and the drum."
- `ready.ready.flag`: "The flag is ready!"; `ready.ready.drum`: "The drum is ready!"
- `ready.notyet.flag`: "The flag needs its ribbon first."; `ready.notyet.drum`: "The drum needs its beater first."
- `ready.part.ribbon`: "The ribbon goes on the flagpole."; `ready.part.beater`: "The beater goes with the drum."
- `ready.notcard`: "The card shows the {thing}. Let's bring the {thing}." (one line per requestable prop, no runtime substitution beyond `{pet}`)
- `ready.packed`: "In the bag!"; `ready.allpacked`: "All packed. Off to the parade!"
- `ready.hint.<action>`: "Try the ribbon on the flagpole." etc., one per action.
- `ready.parade`: "Wave the flag! Boom the drum!" (per packed set)

No line mentions getting dressed, washing, eating, bedtime or being late, and none tells a real child what to do before going out.

## Rule tests (`logic.test.ts`)

1. **Level 1 request:** every seeded round has the requested prop present exactly once, the other choice is a different prop with a different silhouette, and one pack finishes it.
2. **Prerequisites:** `pack` of a `bare` prop and of a loose part is refused with the right reason; `attach` to the wrong prop is refused; a refusal never changes state.
3. **All valid orders:** at level 3, every one of the six interleavings finishes; every sequence that packs a prop before its attach is refused at that step. Enumerate all 24 orders of A1, A2, B1, B2 and check exactly six succeed.
4. **Conservation:** across any sequence of gestures, each part is loose or attached to its own prop, never both, never twice; packed props never leave the bag.
5. **Always finishable:** from every reachable state, `nextActions` is non-empty until `done`, and following `hintFor` from any state reaches `done`.
6. **Accounting:** misses charge the job `judge` names; two misses on one job give exactly one glow and one hint and reset that job's counter; misses split across two jobs give no glow; a requested hint while a glow shows counts nothing; free gestures count nothing.
7. **Finish once:** `done` is false until every requested prop is packed; the scene's `finished` guard ignores a second finish (parade end after a skip).
8. **Seeded rounds:** each level's seeded rounds stay within its variation and never distinguish props by colour alone (silhouette IDs differ).
9. **Layout:** `readyLayout` at four views for each level, per [Screen and controls](#screen-and-controls).

## Ghost finger, how-to card and registration

- **Ghost finger:** `touchDemo: true`; `autotouch()` drags at the current level: level 1 the requested prop into the bag; level 2 the part onto its prop, then the prop into the bag; level 3 ribbon onto pole, beater onto drum, flag into bag, drum into bag (one of the six orders). It then waits for the parade, so `fingerdemo` proves the finish at levels 1 and 3.
- **How-to card** (`src/content/howto.ts`). Goal: "Get the parade things ready, pack them, and watch {pet} use them."
  - Steps: "Look at the card: it shows what to bring; tap it to hear it" (all levels); "Drag the thing on the card into the bag" `{ from: 1, to: 1 }`; "Put the ribbon on the pole (or the beater with the drum), then drag it into the bag" `{ from: 2, to: 2 }`; "Get the flag and the drum ready and packed, in either order" `{ from: 3, to: 3 }`.
  - Finish: "When the bag has what the card shows, the parade plays; a tap skips it" (all levels).
  - Notes: "Dragging or tapping both work: tap a thing, then tap where it goes" (all levels); "Packing something not ready yet, or the wrong thing, counts as a miss; two on the same job light up the next step and count as help" (all levels); "Show a hint lights the next step; tapping a lit thing lets {pet} do it, and finishing with help still earns the sticker" (all levels); "Pretend parade things only: this is about getting things ready in order, not a lesson in real getting-ready routines" (all levels).
- **Registration (default, [decision 1](#open-decisions)):** ID `ready-for-adventure`, name "Ready for Adventure", spoken title `game.ready-for-adventure` ("Ready for adventure"). Region (subject) `cozy-village`. Skills `['planning', 'sequencing', 'prerequisites', 'everyday-life']`. Bands (`BandLevels`): toddler 1–1, preschool 1–2, prek 2–3. Home land **Cozy Village**. Hub icon: a satchel with a flag poking out. Sticker (page `meadow`): the seeded flag with a drum or bell beside it.
- **Art:** code-drawn in `src/games/ready-for-adventure/art.ts` with `src/art/palette.ts`: bench, satchel (open, zipped), flagpole (bare knot loop, three flag shapes), ribbons (three patterns), drum (clip empty or holding the beater), beater, bell, ball, request card, rail pictures, wagon, three parade backdrops. No imported art or audio.
- **Co-play:** the grown-up points at the card and asks "What does it need first?"; the child does it; then swap who points. **Off-screen** (spoken tip): "Which toy would you bring to a pretend parade? What would it need first?" A conversation only: no real routine card or instruction.
- **Couch:** none. **Journal:** nothing filed. **Saves:** nothing new beyond the shell's round history.
- **Rework couplings:** the parade uses the companion through `ctx.companion()`; a later rework packet could let the parade gear be worn. Nothing here depends on it.

## Check tier

The build (RA2) is one new game, levels 1–3 in one worker and PR. New-game tier: typecheck and unit tests (the properties above, plus the registry, lands, `village.test.ts` and how-to tests); one scripted play through a new `browser-check.mjs` case (and its README row) at level 1 and level 3, covering **one early-pack miss** (a bare prop into the bag) and **one requested hint** with its assisted tap, and checking the parade finish. One portrait screenshot at level 3 (two bench rows). `fingerdemo` at levels 1 and 3. `npm run build`, because the registry, lands, voice and how-to files change.

Device and person checks stay open: whether a two-year-old drags or taps, whether a three-year-old sees why a bare pole is "not ready", whether free job order feels like a choice, and how iPad speech says the lines. Browser automation establishes none of these.

## What comes next

**RA4** (the study's slice 5): define level 4, *The request changed* (Check, unpacking, a revised parade), after this scene exists; then level 5, *One workbench*. Both are the school window.

## Open decisions

Each has a default the build uses; none blocks RA2.

1. **New game, bands and land.** Default: a new game (the overlap section says why it is not a Weather Wardrobe or Story Steps mode), toddler 1, preschool 1–2, pre-K 2–3, home **Cozy Village**: 12 games today, 13 with this one (14 if [Second Chance Shed](second-chance-shed.md), also defaulting there, lands first; Puzzle Peaks already lays out 13). `village.test.ts` and `lands.test.ts` decide. Fallback if Cozy Village's layout returns null: **Music Mountain** (6 games), where a drum-and-flag parade also fits. **Note (2026-10-22):** Recipe Workshop found Cozy Village full for decoration at 12 visible games (`village.test.ts`: no hedgerow fits at pre-K landscape), so expect the same layout failure here and plan the fallback land.
2. **What counts as a miss.** Default: a bare prop or loose part into the bag, a part on the wrong prop, and the unshown prop at level 1 each count one miss. Alternative: at level 2 only the bare-prop pack counts, if watching shows a loose ribbon in the bag is play rather than a mistake.
3. **Tap-select, tap-place.** Default: on alongside dragging, at every level. Alternative: drag only, if the two inputs confuse a toddler.
4. **Props on a wagon.** Default: the parade gear rides a wagon the companion pulls. Alternative: held in the companion's `hands` where the species has them, after RW05's part tables say a held prop reads at parade size.
5. **Level 1's other choice.** Default: the ball or another finished prop, seeded. Alternative: always the ball, so the request is never between two parade things.
