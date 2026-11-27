# Draw a Ramp, levels 1–3 (definition)

Defined 2026-11-27 for [chunk 27](../ROADMAP.md#chunks) (physics games), from [PHYSICS-GAMES](../PHYSICS-GAMES.md) and its [IDEAS row](../IDEAS.md#candidates). **Ready to build:** every call below has a default the build uses under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4 deterministic handwritten solver in `logic.ts`, no physics library; S8 identity, land, band and accounting). None needs a content reviewer or the developer. Proposed game ID `draw-a-ramp`.

**Fun action and purpose:** a bright marble waits in a wooden chute above a meadow while a star balloon floats across the screen. She draws a rainbow ramp with her finger, taps **Go**, and watches the marble drop, roll along her line, and pop the balloon with a chime and sparkles. If it misses and rolls onto the grass or stalls in a dip, it leaves a faint dotted trail and hops right back to the chute so she can undo, redraw, and try again. The learning goal is **cause and effect, slope and reflection, and iterative design (`Run, watch, revise`)**: tilting a line makes a ball roll, steeper drops carry it farther, and banking a second ramp turns its path around an obstacle. There are no timers, lives, hazards, ink limits that lock her out, move pars, or star ratings.

## References

| Reference | What it shows | What Draw a Ramp takes or rejects |
| --- | --- | --- |
| *Physics Playground* & *Crayon Physics* (via [PHYSICS-GAMES](../PHYSICS-GAMES.md#what-the-research-says)) | Draw lines that become ramps and bridges so a ball reaches a balloon; many valid designs | Takes "draw a ramp, watch the ball roll to the balloon, many solutions". **Rejects** rigid-body physics libraries, pin-joint assemblies, and star/move scores. |
| *Line Rider* & *Magic Pen* (via [IDEAS](../IDEAS.md#candidates)) | Smoothly rolling along drawn curves; trying, watching the trail, and revising | Takes the dotted last-run trail and instant reset to the start chute. **Rejects** crash/fall penalties; the marble never breaks or gets lost. |
| *Thinkrolls 2* & *Where's My Water?* (via [PHYSICS-GAMES](../PHYSICS-GAMES.md#what-physics-games-do-and-what-to-borrow)) | One new spatial idea per chapter with the same simple gesture | Level 1 bridges a gap; level 2 climbs or clears a hurdle; level 3 switches back under a shelf. |
| [Chain Reaction](../games/chain-reaction.md) (built) | *Run, watch, revise*: failed runs are free experiments leaving a trail; a light-bulb hint shows one working step | Reuses free-experiment accounting (`misses = 0` on missed runs, faint trail, counted hint via bulb/pause or after two unchanged misses) and `upright: true`. |
| [Vine Snip](vine-snip.md) & [Block Topple](block-topple.md) (built) | Unscaled fixed board box centered in `view` with deterministic physics in `logic.ts` | Reuses the unscaled board pattern and Node-testable deterministic solver. Unlike Vine Snip/Block Topple, `draw-a-ramp` lays out cleanly for **upright phone play** from slice 1. |
| [`src/engine/ball.ts`](../../src/engine/ball.ts) (built) | Fixed `1/240` s substep Euler integration with push-out and velocity reflection | Keeps `src/engine/` untouched (S4 places the circle-vs-segment solver inside `src/games/draw-a-ramp/logic.ts`). Uses the same fixed-substep structure for circle-vs-capsule segments. |

## Overlap

- **Ramp Race** (Tinker Lab) picks among fixed ramp heights and floor surfaces to run a fair test. Draw a Ramp lets her draw any ramp shape freely.
- **Chain Reaction** (Tinker Lab) drags pre-built diagonal ramps into grid sockets. Draw a Ramp replaces discrete grid sockets with freehand drawn ramps and smooth rolling/banking.
- **Bouncy Launch** (Tinker Lab) pulls a sling to fly across clouds. Draw a Ramp releases a marble from a fixed chute onto player-drawn ramps.
- **Draw the Pattern** (Painted Canyon) traces hill/dip/loop glyphs to match or continue a sequence. Draw a Ramp uses strokes as physical surfaces.
- **Rainbow Road** ([IDEAS](../IDEAS.md#candidates)) is merged with Draw a Ramp in the notebook; `draw-a-ramp` is the built ID.

## The model (`logic.ts`)

All lengths are in **board units**. The board is a fixed **720 × 540** box, translated inside `view` and **never scaled**, so board units equal logical screen units in both landscape and upright views. `y` grows downward; time is in seconds.

- **Constants:**
  - `BOARD_W = 720`, `BOARD_H = 540`
  - `BALL_R = 20` (40 units across), `GOAL_R = 44` (hit when `hypot(ball - goal) <= BALL_R + GOAL_R = 64`)
  - `SEG_R = 8` (half-thickness of every ramp and fixed hurdle capsule; 16 units thick)
  - `GRAVITY = 980` units/s², `SUBSTEP = 1 / 240` s, `MAX_SECONDS = 8` s
  - `WALL_BOUNCE = 0.45`, `RAMP_BOUNCE = 0.25`, `RESTING_VN = 40` units/s (impacts gentler than `RESTING_VN` along the normal set normal velocity to `0` so a ball glides smoothly along multi-segment curves instead of micro-bouncing)
  - `TANGENT_DRAG = 0.04` per second (gentle rolling resistance, zero friction lock on slopes steeper than ~2°)
  - `STALL_SPEED = 12` units/s for `STALL_TIME = 0.6` s (detects a ball cradled in a U-dip and stops early)
  - `MIN_STROKE_LEN = 24`, `SAMPLE_STEP = 20`, `MAX_SEGS_PER_STROKE = 40`
  - Keep-out circles: `R_KEEP_START = 44` around the start chute center, `R_KEEP_GOAL = 58` around the balloon center (stroke points inside either keep-out circle are clipped/skipped so players cannot wall off the chute or draw inside the balloon)
- **World boundaries:** left `20`, right `700`, top `20` bounce softly (`WALL_BOUNCE`); floor `bottom = 520` stops the run cleanly as `'floor'` when `ball.y + BALL_R >= bottom`.
- **Single collision primitive (`Segment`):** `{ ax, ay, bx, by, r: SEG_R }`. Both player-drawn polyline segments and fixed wooden hurdles/chutes use the exact same circle-vs-capsule projection:
  1. Closest point `C` on segment `AB` (`t = clamp(dot(P - A, B - A) / |B - A|^2, 0, 1)`).
  2. If `hypot(P - C) < BALL_R + seg.r`, push `P` out along unit normal `n = (P - C) / d` (fallback `(0, -1)` if `d === 0`).
  3. Let `vn = vx * nx + vy * ny`. If `vn < 0`, subtract `(1 + (Math.abs(vn) < RESTING_VN ? 0 : RAMP_BOUNCE)) * vn * n` from `(vx, vy)` and apply gentle tangential damping.
- **Start chute:** each puzzle gives `start: { x, y, vx, vy }` plus a short fixed wooden starter shelf directly below `start` so the marble rolls reliably off the shelf edge at a steady pace into the play space.
- **Fixed obstacles (`fixed: Segment[]`):** level 1 has only the short starter shelf; level 2 adds one fixed vertical wooden hurdle between the chute and balloon; level 3 adds one fixed horizontal wooden shelf shielding the balloon underneath.
- **Public pure API in `logic.ts`:**
  - `planFor(level)` — returns level config (`id`, `maxStrokes`, `puzzlesPerRound`, `mode`).
  - `makeRound(plan, rng)` — builds 2 deterministic puzzles for the round (puzzle 0 at level 1–3 uses an authored showcase geometry; puzzle 1 mirrors/varies positions within verified bounds, retrying up to 50 seeds with an authored fallback asserted never needed across 500 seeds).
  - `sampleStroke(rawPoints, puzzle)` — enforces keep-out zones, thins to `SAMPLE_STEP = 20`, caps at `MAX_SEGS_PER_STROKE = 40`, and returns `null` if total length `< MIN_STROKE_LEN`.
  - `simulate(puzzle, strokes)` — runs the deterministic `SUBSTEP` loop and returns `{ hit: boolean, reason: 'goal' | 'floor' | 'stalled' | 'timeout', path: Point[], end: Point }`. `path` records samples at `1 / 30` s for playback and the faint dotted trail.
  - `referenceStrokes(puzzle)` — returns a verified `Stroke[]` solving the puzzle, used by rule tests, hints, and `autotouch()`.
  - `nextHintStroke(puzzle, currentStrokes)` — returns the next reference stroke not yet matched (or `null` if `simulate(puzzle, currentStrokes).hit` is already true).
  - `rampLayout(view)` — pure layout placing the unscaled `720 × 540` board and bottom action bar (`Go`, `Undo`, `Clear`, `Hint`) cleanly inside `view` for both `1024 × 768` landscape and `768 × 1024` upright (plus `390 × 844` and `375 × 601` phone views).

## Screen and controls

- **The scene:** soft meadow sky backdrop, grassy strip along `bottom = 520`, wooden start chute holding the marble, warm wooden planks for fixed hurdles/shelves, bright rainbow-striped or warm chalk-colored drawn ramps with rounded end caps (`palette.ts` colors), a floating star balloon with a gentle idle bob and ribbon, and a faint dotted trail of the previous failed run. Pixi `Graphics` only.
- **Layout (`rampLayout`, tested at all standard landscape and upright views):**
  - **Landscape (`1024 × 768`):** board at `x = 152..872`, `y = 104..644`. Bottom controls sit in a row at `y = 704` (`x = 302, 442, 582, 722`), completely clear of the top shell buttons (`y < 96`) and the bottom-left corner pet (`x < 150, y > 640`).
  - **Upright phone (`768 × 1024` and `390 × 844` / `375 × 601`):** board at `x = 24..744`, `y = 160..700`. Bottom controls sit at `y = 780` (`x = 174, 314, 454, 594`), clear of the top shell buttons and the bottom-left pet corner (`x < 150, y > 874`).
  - **Target sizes:** **Go** (`120 × 100`), **Undo** (`110 × 100`), **Clear** (`110 × 100`), and **Hint** (`100 × 100`) are all ≥ 100 logical units on every screen (`> 50` CSS px on a `390`-wide phone).
- **Drawing input:** custom pointer handling on the board layer (`palmOnGlass` rejection, window-level `pointercancel` listener removed in `destroy()`, leaving the board or releasing ends the stroke). Touch-down draws an immediate bright dot and live line preview.
  - At **level 1 (`maxStrokes = 1`)**, starting a new stroke automatically replaces the previous stroke (stored in undo history so **Undo** brings it back), so young children never hit a silent stroke limit.
  - At **levels 2–3 (`maxStrokes = 2` and `3`)**, strokes accumulate up to `maxStrokes`; attempting another when full gives a gentle spoken nudge (`draw-a-ramp.full`) and pulses **Undo**/**Clear** without counting a miss.
  - A tiny tap under `MIN_STROKE_LEN` gives a gentle nudge (`draw-a-ramp.drag-line`), not a miss.
- **Controls during a run:** tapping **Go** locks drawing and animates the marble along `simulate(puzzle, strokes).path` (or stepping live at the exact `SUBSTEP` clock). Tapping **Go** with zero strokes gives a gentle nudge (`draw-a-ramp.draw-first`). Tapping **Undo** or **Clear** while rolling cancels the run cleanly and snaps the marble back to the chute with no penalty.
- **Sound and feel:** soft chalk/whoosh tick while drawing, wooden chute click on **Go**, subtle pentatonic step (`src/audio/notes.ts`) when a rolling marble first touches each drawn ramp, happy chord + pop when it hits the balloon, gentle leaf *boing* when it hits the grass or stalls. Island background music keeps playing.
- **Speech:** `ctx.instruct` repeats the level's instruction from the corner pet. Navigation never needs reading.

## Levels

| ID | Name (`describeLevel`) | Fixed obstacles & strokes | What she decides | Puzzles per round | Plan filter (rule test) |
| --- | --- | --- | --- | --- | --- |
| 1 | Bridge the gap | Starter chute only; `maxStrokes = 1` | Draw one sloped bridge across the gap to the balloon | 2 | `referenceStrokes` reaches goal; `±15` endpoint perturbations still hit; straight drop with no ramp lands on floor |
| 2 | Over the block | Starter chute + vertical middle hurdle; `maxStrokes = 2` | Draw a high bridge or two-part ramp that clears the hurdle | 2 | Straight line from chute to goal crosses hurdle; `referenceStrokes` reaches goal cleanly with `±15` tolerance |
| 3 | Turn it around | Starter chute + horizontal shelf shielding the balloon below; `maxStrokes = 3` | Send the marble past the shelf edge, then bank it back under the shelf | 2 | Direct straight path hits shelf; `referenceStrokes` switches direction and reaches goal with `±15` tolerance |

**Bands (`BandLevels`):** `preschool: { min: 1, max: 2 }`, `prek: { min: 1, max: 3 }`, `school: { min: 2, max: 3 }`. No `order`. No lap, toddler, or grown-up levels in slice 1.

### First rounds

- **Level 1, puzzle 1 (authored):** marble in the left chute `(120, 140)`, balloon across on the right `(560, 340)`. "Draw a ramp to roll the marble to the star!" Drawing a gentle downward line from under the chute toward the balloon rolls the marble straight into the balloon. Puzzle 2 mirrors right-to-left with varied heights.
- **Level 2, puzzle 1 (authored):** left chute `(120, 120)`, vertical wooden block standing at `x = 360, y = 270..520`, balloon at `(580, 350)`. "Draw a path over the block!" A ramp passing above `y = 270` carries the marble over the hurdle and down to the balloon. Puzzle 2 mirrors or shifts the hurdle height/position.
- **Level 3, puzzle 1 (authored):** top-left chute `(130, 110)`, horizontal shelf `x = 80..440` at `y = 290`, balloon tucked underneath at `(180, 410)`. "Send it past the shelf, then turn it back!" One ramp carries the marble right past `x = 440`, and a second ramp below `y = 290` slopes left into `(180, 410)`. Puzzle 2 mirrors horizontally.

## Accounting, help and finishing

- **Free experiments (`misses = 0`):** pressing **Go** and landing on the grass (`'floor'`), stalling in a dip (`'stalled'`), or timing out (`'timeout'`) is **never a miss**. It leaves the faint dotted path on screen, plays a soft boing, says a helpful directional line (`draw-a-ramp.short`, `draw-a-ramp.stalled`, or `draw-a-ramp.blocked`), and returns the marble to the chute.
- **Hints (`hints++`):**
  - Tapping **Hint** (or **Show a hint** in the pause sheet) draws a pulsing dashed ghost ramp for `nextHintStroke(puzzle, strokes)` and increments `hints` once per puzzle (if the current drawing already hits the balloon, it says `"Press Go!"` and counts `0`).
  - After **two failed Go runs** on the same puzzle without asking for a hint, the dashed ghost ramp automatically fades in (counting `hints++` once per puzzle) so young players never stay stuck.
- **Finish:** completing both puzzles plays a celebratory balloon-pop note sequence and calls `ctx.finish({ misses: 0, hints })`, awarding one ordinary sticker with or without help. No creation or discovery journal entry is filed in slice 1.

## Rule tests (`logic.test.ts`)

- **Determinism:** identical `(puzzle, strokes)` produces bit-identical `path`, `end`, `hit`, and `reason` across repeated runs; no `NaN` or `Infinity` across 500 seeds and arbitrary stroke geometries.
- **Resting roll vs bounce:** a marble landing gently on a 20° polyline segment rolls down smoothly without bouncing off into space or tunneling through joints.
- **Keep-out clipping:** strokes passing over the start chute or balloon center are clipped outside `R_KEEP_START` / `R_KEEP_GOAL`; short strokes under `MIN_STROKE_LEN` return `null`.
- **Solvability & tolerance:** across 500 seeds for levels 1, 2, and 3, `simulate(puzzle, referenceStrokes(puzzle)).hit === true`, zero-stroke runs miss (`hit === false`), and perturbing reference stroke endpoints by `±15` units still hits.
- **Level separation:** on level 2 and level 3, a single straight ramp drawn directly from chute exit to balloon center is blocked by the fixed obstacle (`hit === false`).
- **Hints:** `nextHintStroke` returns a non-null stroke when unsolved and adding all returned hint strokes produces `hit === true`.
- **Layout:** `rampLayout(view)` at `1024 × 768`, `768 × 1024`, `390 × 844`, and `375 × 601` keeps the `720 × 540` board and all four ≥ 100-unit buttons inside `view`, non-overlapping, and clear of the pet corner and top shell buttons.
- **Registry, lands, upright, and how-to tests** pass with `draw-a-ramp`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`. `autotouch()` returns `{ trace, via }` following `nextHintStroke(puzzle, strokes)` when unsolved (or `{ tap: clearBtn }` first if strokes are full and unsolved), then `{ tap: goBtn }` once `simulate(puzzle, strokes).hit` is true. Returns `null` while rolling.
- **How-to card** (`src/content/howto.ts`):
  - Goal: `"Draw ramps so the marble rolls to the star balloon."`
  - Steps:
    - `"Drag a line to draw a ramp, then tap Go"` `{ from: 1, to: 1 }`
    - `"Draw one or two ramps over the block, then tap Go"` `{ from: 2, to: 2 }`
    - `"Send the marble past the shelf, then draw a ramp back to the balloon"` `{ from: 3, to: 3 }`
    - `"Use Undo or Clear any time to change your ramps"`
  - Finish: `"Pop the star balloon on both puzzles."`
  - Note: `"Trying a run that misses is always free and leaves a dotted trail to help you adjust. After two misses, or on Hint, a dashed guide shows one ramp that works."`
- **Voice lines** (`src/games/draw-a-ramp/voice.ts`, under `draw-a-ramp.*`): `intro`, `instruct-1`, `instruct-2`, `instruct-3`, `draw-first`, `drag-line`, `full`, `short`, `stalled`, `blocked`, `hint`, `ready-go`, `pop`, `done`.
- **Registration:** ID `draw-a-ramp`, name `"Draw a Ramp"`, spoken title `game.draw-a-ramp`. Region `tinker-lab`. Challenge `'space'`. Skills `['cause-and-effect', 'prediction', 'planning', 'revision']`. `upright: true`, `touchDemo: true`. Home land **Tinker Lab**. Hub icon: a slanted rainbow ramp under a marble and a star balloon. Sticker: seeded marble rolling down a ramp toward a star balloon.
- **Co-play:** `"Trace your finger through the air first to guess where the marble will roll before drawing."`
- **Off-screen:** `"Prop a cardboard tube or cereal box lid against books and roll a small ball into a paper cup—try steeper and gentler slopes."`

## Build slices

1. **Levels 1–3 as a registered game (new-game tier, `batch draw-a-ramp 1`):** `logic.ts` (deterministic circle-vs-capsule solver, generation, layout, hints), `logic.test.ts`, `index.ts` (Pixi scene, custom stroke input, Go/Undo/Clear/Hint buttons, trails, sound, `autotouch()`), `voice.ts`, `howto.ts`, registry and `tinker-lab` land entry, `browser-check.mjs` case, game page, and README update.

## Check tier

- **Slice 1:** `npm run typecheck`, `npm test` (including `logic.test.ts`, registry, lands, upright, and how-to tests), `npm run build`, one filtered scripted play (`draw-a-ramp` level 1 and level 3 with one failed run, one hint, and finish), `fingerdemo` at levels 1 and 3, and one portrait (`390 × 844` or `768 × 1024`) screenshot.

## Decisions (defaults the build uses)

**Decided under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) (S4, S8):**
1. **Physics solver:** closed-step deterministic circle-vs-capsule segment solver inside `src/games/draw-a-ramp/logic.ts` (no physics library, `src/engine/` unchanged).
2. **Bands:** `preschool: 1–2`, `prek: 1–3`, `school: 2–3`; no lap, toddler, or grown-up levels in slice 1.
3. **Accounting:** failed `Go` runs are free experiments (`misses = 0`) leaving a dotted trail; requested or two-miss auto-hints increment `hints`.
4. **Home land:** Tinker Lab (`upright: true` from slice 1).
5. **Journal / creations:** none filed in slice 1.
