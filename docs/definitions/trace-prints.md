# Stamp Studio levels 8–9: Trace Prints (definition)

Defined 2026-10-22 on `claude/define-trace-prints` ([PR #771](https://github.com/rjdunlap/neo/pull/771)), slice D3 of the [deep-time study](../deep-dives/subjects/deep-time.md#build-slices-in-order), from its [audience table](../deep-dives/subjects/deep-time.md#an-answer-for-every-audience) (rows L and T) and its [candidate row](../deep-dives/subjects/deep-time.md#candidates-and-overlap-decisions). Docs only; nothing is implemented. The build is queued as an [implementation batch](../GAME-BATCHES.md#stamp-studio-1-trace-prints).

**What it adds:** two appended levels of `stamp-studio` (`src/games/stamp-studio/`) in which the paper is soft mud and a stamp is a real thing that leaves its own shape:

- **Level 8, *Leaf prints*** (lap): every pat presses one big leaf into the mud; the leaf lifts away and its print is left behind.
- **Level 9, *Two feet*** (toddler): two big makers, a duck foot and a cat paw; she picks one and taps the mud, and each leaves its own print.

**Learning purpose:** a thing pressed into something soft leaves a mark with its shape; different things leave different marks. That is the seed of reading a trace (the study's Fossil Dig and Trackway Tales build on it at pre-K and school). These levels make **fresh prints only**: nothing turns to stone, nothing is old, and no line or picture says *fossil*, *long ago*, *dinosaur* or a time span.

- Levels 1–7, their IDs, rules, kept pictures and pins do not change. No band, land, game registration, save field, `STAMP_KINDS` entry, journal entry, creation slot or couch entry is added.
- **Reconciling with Stamp Studio's own dive.** The [deep dive](../deep-dives/stamp-studio.md#new-levels-on-top) proposes five levels on top (*Where does it go?* through *Wrapping paper*), named there 7–11 but not yet built; level 7 has since become *Pat the paper*. These two levels take **IDs 8 and 9**. Whichever of the dive's levels is built next numbers from 10 in the dive's order; their names, rules and band windows are unchanged by this definition.
- **The study's gates.** No new lap registration (these are levels of a game lap already plays); no "instant fossil" claim (see the wording test); no change to creative miss accounting (0 misses and 0 hints, as levels 1–7). The study's younger-input review is answered under [Bands and ranges](#bands-and-ranges) and [Open decisions](#open-decisions).

## Bands and ranges

| Band | Before | After |
| --- | --- | --- |
| lap | `{ min: 1, max: 7, order: [7, 1, 2] }` | `{ min: 1, max: 8, order: [7, 8, 1, 2] }` |
| toddler | `{ min: 2, max: 3 }` | `{ min: 2, max: 9, order: [9, 2, 3] }` |
| preschool, pre-K, school | unchanged | unchanged |

`entryLevels` becomes `[7, 8, 9]`, so a saved 8 or 9 carried by a birthday or a pin into a band that does not list it starts that band at its easiest level (`landing`), never at its top. A lap save at 1, 2 or 7 and a toddler save at 2 or 3 keep their level. A new toddler starts at 9.

**Why this order.** Lap: one pat, one leaf, the same input as *Pat the paper*, then the first chosen stamp. Toddler: choosing between two big makers is the same decision as level 2 (*a cat or a fish*), with the extra pay-off that the two marks look different. **Adaptation policy** (the study asks for one before registration): the trace levels report 0 misses and 0 hints, so two rounds step her along the order exactly as levels 1–7 do today; every step lands on another free creative level, never on an assessed one, and `describeLevel` never calls a trace level mastered. A grown-up's pin holds her on a trace level. No shared difficulty change.

## The screen

The tray is the existing paper rectangle (`paper` at 180, 135; `v.w − 350` by `v.h − 290`), drawn as mud: `swatch.brown.fill` fill, `swatch.brown.line` 7-unit border, a few soft darker blots for texture (`eventMode = 'none'`). Background, finish arrow (`v.w − 77`, 65) and back arrow (`v.w − 77`, `v.h − 77`) sit where the paper levels put them. Home and help stay top-left, the pet bottom-left; no new button sits left of the tray.

**A print** is a dent: the maker's outline filled in `swatch.brown.line` at 0.45 alpha, a 5-unit lighter rim (`swatch.brown.light`, alpha 0.9) offset 3 units up-left so it reads as pressed in, and the maker's inner lines (leaf veins; toe and pad gaps) as darker strokes. A print takes no touch (`eventMode = 'none'`); prints may overlap, as marks in mud do.

**Press and lift.** On touch-down the print appears at once with `sfx.squish()`; above it the maker is drawn pressed flat (scale 1.05), then lifts 40 units and fades over 0.35 s, leaving the print. Seeing the thing come away from its own mark is the comparison; nothing asks her to state it.

| | Level 8, *Leaf prints* | Level 9, *Two feet* |
| --- | --- | --- |
| Maker | One leaf: Fossil Dig's invented `star` outline (`leafOutline('star')`), scaled to 170 units across, green, with a midrib and four veins | **Duck foot**: three long webbed toes, `swatch.orange`. **Cat paw**: one round pad and four round toes, `swatch.pink`. Both 150 units across, so the marks differ in outline, not only colour |
| Choosing | Nothing to choose | Two `RoundButton`s of radius 60 (120 across) showing the maker, along the bottom at `spread(2, 185, v.w − 180, 135)`, y `v.h − 77`. The duck foot starts chosen; the unchosen one is at alpha 0.68. Choosing bounces it and says its name the first time (`sfx.animal('quack')` / `'meow'`). A tap on the mud therefore always prints |
| Tilt | Seeded per press from −20°, −10°, 0°, 10°, 20° (the leaf and its print share it) | None: a foot points up the tray, as walking does |
| Taps | Sheet `onTap` with `cooldown: 0`, so close pats are all kept; the existing palm rejection stays | Sheet `onTap` with the default cooldown |
| Finish | Green arrow visible after the first print (the study's optional Done); the **eighth** print finishes the round by itself, as *Pat the paper* does | Green arrow after the first print; the **tenth** print finishes by itself |
| Back arrow | Smooths away the latest print | Same |

**Pair moment (level 9).** The first time both makers have printed in a round, `ctx.say('stamp.pair')`: *Duck prints and paw prints! Each foot leaves its own shape.* It is said once, does not gate the arrow, and never asks her to make the second kind.

**Ending.** The finish freezes the tray, says `stamp.printsdone` (*Look at all your prints in the mud!*) with `sfx.sparkle()`, waits 0.9 s and calls `ctx.finish({ misses: 0, hints: 0 })` with **no `creation`**: nothing is kept, so the treehouse button does not appear (see [Open decisions](#open-decisions), 2). One sticker, as always. Undo, choosing and the sheet do nothing after the finish (the same `done` guard as the paper levels).

## Accounting

Every touch is creative play: 0 misses and 0 hints whatever she does. There is no wrong maker, no wrong place and no glow. The how-to card is not a hint. This is the study's "Trace Prints has no wrong choices" and leaves creative miss accounting unchanged.

## Logic (`logic.ts`)

- `TraceMakerId = 'leaf' | 'duck' | 'paw'` and `TRACE_MAKERS: Record<TraceMakerId, { name: string; across: number; toes: number; sound?: AnimalSound }>`: leaf `{ name: 'A leaf', across: 170, toes: 0 }`, duck `{ 'Duck foot', 150, 3, 'quack' }`, paw `{ 'Cat paw', 150, 4, 'meow' }`. Outlines are drawn in `art.ts` (`traceArt(id)`, `printArt(id)`); the leaf reuses `leafOutline('star')` from `../fossil-dig/logic`.
- `StampPlan` gains `trace?: { makers: readonly TraceMakerId[]; count: number; tilt: boolean }`. `PLANS` gains, at indices 7 and 8 (IDs 8 and 9):
  - `{ kinds: [], …, prompt: 'leaf', name: 'Leaf prints: pat the mud and the leaf leaves its shape', trace: { makers: ['leaf'], count: 8, tilt: true } }`
  - `{ kinds: [], …, prompt: 'feet', name: 'Two feet: a duck foot and a cat paw each leave their own print', trace: { makers: ['duck', 'paw'], count: 10, tilt: false } }`
  - `prompt` gains `'leaf' | 'feet'`; `color`, `move`, `transform`, `play` are all false.
- `place(x, y, w, h, margin = 70)` and `pixel(s, w, h, margin = 70)` gain the margin argument (default unchanged); trace prints use `margin = across / 2 + 5`, so a whole print always stays on the mud.
- `traceTilt(rng)` picks the seeded tilt; `pairNow(printed: TraceMakerId[], next)` is true only on the press that makes both of a plan's makers present for the first time.
- `traceDemo(plan, { prints, chosen })` (the ghost finger, which also feeds `autotouch`): level 8 presses `PAT_SPOTS` in order until the round ends itself; level 9 presses three duck prints at `DEMO_SPOTS[0..2]`, chooses the paw, presses two paw prints at `DEMO_SPOTS[3..4]`, then taps the green arrow, so the demonstration shows choosing, both marks and the optional finish.

## Implementation shape (`index.ts`, `trace.ts`, `art.ts`)

A separate `TracePrints implements Game` class in a new `trace.ts`, so the paper levels' class is untouched: `create: ctx => planFor(ctx.level).trace ? new TracePrints(ctx) : new StampStudio(ctx)`. It owns the tray, maker buttons, prints, arrows and the lift tweens through `ctx.tw`; `destroy()` has no drag handles or listeners to release (taps use `onTap`), and a late tween after the finish touches nothing destroyed (prints and makers live in the stage, which the scene releases). `levels` and `entryLevels` change as in [Bands and ranges](#bands-and-ranges); `skills`, `region`, music (`STYLES.paint`), sticker, hub icon and `touchDemo: true` are unchanged.

## Rule tests (`logic.test.ts`)

1. **Unchanged below.** `PLANS[0..6]` are deep-equal to a pinned copy, and `roundPlan(level, seed)` for levels 1–7 gives the same result as before for fixed seeds, so the append renumbers nothing; the sticker pin test still passes.
2. **Bands.** `levels('lap')` and `levels('toddler')` return the two ranges above; the other three are unchanged; `landing(8 or 9, preschool range, entryLevels)` is preschool's easiest level, and `landing(7, toddler range, entryLevels)` is 9.
3. **Big enough.** Every maker is at least 150 units across; the level-9 buttons are 120 across; at the smallest paper (674 by 478) and in portrait, a print placed anywhere through `place`/`pixel` with its margin stays wholly inside the tray.
4. **Different marks.** The duck foot and cat paw differ in toe count, and their drawn print bounds differ in aspect by at least 15%, so the two marks are not just recoloured.
5. **The finish.** For both plans, a simulated run ends exactly once at `count` prints, and `traceDemo` from an empty tray reaches a finish in at most `count + 3` moves; at level 9 it prints with both makers before finishing; every demo spot is inside the tray at four views.
6. **The pair moment** fires on exactly one press of a round that prints both makers (in either order) and never in a round that prints only one.
7. **Wording.** No `stamp.leaf*`, `stamp.feet`, `stamp.foot`, `stamp.pair` or `stamp.printsdone` line, and no level-8–9 how-to line, matches `/fossil|long ago|dinosaur|million|stone|extinct/i`.

## Voice lines (`voice-script.ts`)

New IDs: `stamp.leaf` (instruction: *Pat the mud! The leaf leaves its shape.*), `stamp.leafmark` (said after the first print: *Look! The leaf left its shape in the mud.*), `stamp.feet` (instruction: *Tap a foot, then tap the mud to make a footprint!*), `stamp.foot` (`{kind}`: *{kind}! Tap the mud.*, said once per maker when chosen), `stamp.pair`, `stamp.printsdone`. The instructions go through `ctx.instruct` so the pet repeats them; the rest are `ctx.say`. The maker names come from `TRACE_MAKERS`.

## How-to card (`howto.ts`)

- Steps: add `{ from: 8, to: 8, text: 'Pat the mud: the leaf presses its shape there. Pat as often as you like.' }` and `{ from: 9, to: 9, text: 'Tap the duck foot or the cat paw, then tap the mud to make its print.' }`; change the back-arrow line `{ to: 2 }` to two ranges `{ to: 2 }` and `{ from: 7, to: 9 }` (wording *The back arrow removes the latest stamp or print.* for 7–9) so it does not claim levels 3–6.
- Finish: `{ from: 8, to: 8, text: 'Tap the green arrow to finish; the eighth pat finishes by itself.' }` and `{ from: 9, to: 9, text: 'Tap the green arrow to finish; the tenth print finishes by itself.' }`.
- The `note` is a plain string, true at every level; today's *After the round, the tree house button hangs it up* is false at 8–9. It becomes *Every picture is welcome.*, and the tree-house sentence moves into the finish lines as `{ from: 1, to: 7 }`. The goal (*Make a picture with stamps.*) stays.
- Keep the card within the screen (it overflowed once): check the level-9 card in portrait.
- Co-play (README and GAMES only): after a walk in wet sand, snow or a puddle, look back at your own footprints together and find whose are whose.

## Build and check tier

A new interaction inside an existing game (a new `Game` class, a new kind of mark): `npm run typecheck`; unit tests (Stamp Studio's rule and finish tests, `howto.test.ts`, the registry and voice tests); one scripted play filtered to Stamp Studio of level 8 (eight pats end it) and level 9 (both makers, the back arrow, the green arrow) through the `creative` suite's `CREATIVE_ONLY=stamps` loop, extended to levels 8–9; `BROWSER_SUITE=fingerdemo FINGER_ONLY=stamp-studio` at 8 and 9; one portrait screenshot of level 9 with both prints. There is no wrong answer or hint to play. `npm run build` once, since `voice-script.ts` and `howto.ts` are shared. Only a person can tell whether a one-year-old notices that the mark matches the leaf, whether a two-year-old chooses between the feet on purpose, and whether *quack* and *meow* read as "whose foot" ([device checks](../DEVICE-CHECKS.md) at closeout).

### Expected files

`src/games/stamp-studio/logic.ts`, `trace.ts` (new), `art.ts`, `index.ts`, `logic.test.ts`; `src/content/voice-script.ts`, `src/content/howto.ts`; `scripts/browser-check.mjs`; README row, [GAMES.md](../GAMES.md), the [Stamp Studio dive](../deep-dives/stamp-studio.md) and the deep-time study's D3 line.

## Open decisions

Each has a default the build uses; none blocks it.

1. **Bands.** Default: level 8 lap only, level 9 toddler only. Alternatives: level 8 also first in toddler; a preschool comparison step ("which foot made this print?") later, which would be a checked answer and needs its own definition and accounting.
2. **Keeping a print picture.** Default: not kept (no `creation`), so no `STAMP_KINDS`, `cleanStamp` or treehouse-board change. Alternative: add `leaf`, `duck`, `paw` kinds (shipped in `STAMP_KINDS` before the art, as the dive's decision 3 orders it) and draw prints on the board's paper.
3. **Climbing out.** Default: two rounds move her along the order, like every other Stamp Studio level. Alternative: hold a band on its trace level until a grown-up moves it, which needs a shared difficulty rule this study did not authorize.
4. **The two makers.** Default: an invented cartoon duck foot and cat paw (familiar animals already on the island; no track-anatomy claim). Alternatives: a boot and a wheel, or the companion's own foot (which needs its spec in the game).
5. **Wording and the reviewer.** Default: *print*, *shape*, *mud*; never *fossil*, *long ago*, *stone* or a span of time, so the deep-time reviewer is not needed for these levels. Any later line linking fresh prints to fossils ("the mud became stone", as Fossil Dig says) waits for that reviewer and the study's extinction-framing decision.
