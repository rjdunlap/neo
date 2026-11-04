# Light Lab — Split the sunbeam (level 12): one half-mirror, two beams, two flowers

Definition, 2026-11-04, branch `claude/define-light-lab-split-sunbeam`. This is dive slice 6 of the [Light Lab dive](../deep-dives/light-lab.md#build-slices-in-order). **Docs only:** no game change, code or device evidence. It settles what the dive left open: the half-mirror's rule, a branching `trace` whose loops end, a generator that makes the split necessary, a hint over the nearest solution, the level's number and place in the band, accounting, art, voice IDs, rule tests, the bot, the couch question and the check tier.

## Scope and identity

**Fun action.** A half-mirror stands on the board, a pale glassy mirror with a silver stripe. When the sunbeam reaches it, the light goes **both ways**: one beam carries straight on and one bounces a quarter turn, just as a mirror would send it. Two flowers sleep, one on each side of the split. She tilts the mirrors and the half-mirror, then taps the sun and watches both beams grow together.

**Learning purpose.** Planning two outcomes from one cause: one choice (the half-mirror's tilt) sets two paths at once, and each path must still be planned through its own mirrors. It extends the dive's planning ladder (levels 3–7) rather than adding a science standard. The half-mirror is real: a beam splitter, partly silvered glass like a one-way window, and an ordinary window pane does it a little too. See the toy rule below.

**What it is.** Level 12 of `light-lab`, for school only. It adds no new game, land or band. It is built **after batch light-lab 5** (level 11, *Through, bounce or stop?*), because `PLANS` is indexed by level and cannot have gaps, and because it reuses that batch's dim beam.

## The toy rule

- A half-mirror tilts `/` or `\`, like a mirror, and she taps it to tilt it the other way.
- Light arriving from any side **passes straight through and also reflects** by the same `reflect(dir, tilt)` a mirror uses. Both beams leave the cell at the same moment.
- **Both arms are dim.** A real half-mirror sends about half the light each way, so each arm after a split uses batch 5's `dim` stroke. As at level 11, a dim beam still wakes a flower. A dim beam that splits again stays dim, since there is one dim level and no dimmer.
- A rock stops only the arm that meets it. An arm that leaves the board ends there. The other arm carries on.
- This is truthful in kind (light really does both), and simplified in amount: only one dim step. `describeLevel` says so.

## The branching trace

`traceAll(p, tilts)` in `logic.ts` replaces the single walk for boards that hold a half-mirror. It returns:

```ts
interface Arm {
  /** Cells this arm passes through, in order; the last is where it stops or leaves. */
  cells: { x: number; y: number; tint: Tint; dim?: boolean; step: number }[];
  end: 'edge' | 'rock' | 'loop';
  /** The arm it split from (-1 for the sun's beam) and the half-mirror index where it began. */
  parent: number;
  from: number;
}
interface SplitTrace { arms: Arm[]; woken: number[]; wrongColor: number[]; split: boolean }
```

- **`step`** is the distance from the sun in cells, so arms that started at the same half-mirror grow together. `drawBeam(upTo)` draws every arm's cells with `step <= upTo`, each arm as its own line. The shine loop runs `upTo` from 1 to the largest step, and a flower wakes at the step its cell is reached.
- **Order.** Arms are walked breadth first: on a split, the straight arm continues in the current arm and the bounced arm is queued. Arm 0 is always the sun's beam carried straight on through any half-mirrors.
- **Loops end.** One seen-set keyed `x,y,dir` is shared by every arm. An arm that enters a cell in a direction any arm has already used ends there with `end: 'loop'`. That also ends an arm that comes back into a half-mirror the way another arm already went, so the walk visits at most `cols × rows × 4` cell-directions and always finishes.
- **`woken`** is the union over arms. On a split board there is no glass, so `wrongColor` stays empty.
- **`trace` stays.** On boards without a half-mirror the existing `trace` keeps running as it does after batch 5. A rule test checks that on such boards `traceAll` gives exactly one arm whose cells equal `trace`'s cell for cell, with `step` equal to the index plus one.
- **`beamEnd` and `predictionChoices`** are unchanged and never see a half-mirror, because predict mode (level 7) never holds one.

## The half-mirror thing

- **A new kind:** `{ kind: 'half'; x; y }`. It is not a `mirror` with a flag, so the existing `kind === 'mirror'` checks in `predictionChoices`, the start flips and the couch keep meaning a full mirror.
- **Tiltable.** It takes a tilt from the same `tilts` array and the same tap. A helper `tiltable(p)` lists the indices of mirrors and half-mirrors. `nearestSolutions`, `minTurns`, `hintMirror` and the start's flips read `tiltable` instead of filtering on `mirror`. Their output on boards without a half-mirror is unchanged, which a rule test checks.
- **Enumeration bound.** Level 12 has at most seven tiltable things (three path mirrors, the half-mirror, three spares at most), so every search stays within 128 arrangements, as today.
- **`mirrorPuzzle`** maps the half-mirror like a mirror: its column mirrors and its tilt flips. A rule test checks that a mirrored split board, with mirrored tilts, solves exactly when the original does.

## The board and the generator

**Plan for level 12:** `{ mode: 'plan', cols: 7, rows: 5, turns: 1, decoys: 2, rocks: 1, flowers: 2, glass: false, split: true, puzzles: 2, startWrong: 2, startDark: true, eitherSide: true }`. `LightPlan` gains `split: boolean`, false for every other level.

**Built backwards, like today.**

1. The trunk: from the sun, `turns` (one) quarter turns through path mirrors, then a run to the half-mirror's cell.
2. At the half-mirror, choose the bounce direction (a quarter turn either way). Its tilt in the solution is `tiltFor(dir, bounce)`.
3. The straight arm continues in the trunk's direction, with zero or one mirror (seeded), and ends on a flower.
4. The bounced arm leaves in the bounce direction, with zero or one mirror, and ends on a flower.
5. Every run is 1–3 cells. The trunk and both arms share one `used` set, so no cell is on two of them and nothing sits on the sun's cell.
6. Spare mirrors and one rock fill free cells, as today.

**Accepted only when every rule holds:**

- The known solution wakes both flowers, with one flower on each arm, and has no loop.
- **The split is required.** Replace the half-mirror with a full mirror of either tilt, then with an empty cell. In each case, no arrangement of the other tilts wakes both flowers.
- The start meets the floor. At least `startWrong` (two) trunk-or-arm tiltables are flipped, the spares are flipped at random, `minTurns` from the start is at least two, and the start wakes no flower (`startDark`).
- Then, half the time, the board is mirrored with the sun on the right.

**Probe (throwaway, not committed):** a sketch of this generator and the branching trace over 400 seeds, at 7×5 with one trunk turn, two spares and one rock. It accepted every seed within the 500-attempt budget, averaging 3.5 attempts. Every board had at most seven tiltables, and the start floor held. With two trunk turns and three spares it still accepted all 400 within about four attempts. Two puzzles a round is affordable.

## The round

- Two puzzles, then one sticker, as at levels 4–6.
- It is a `plan` board. Tilting is free and is never a miss. She taps the sun to shine, and both arms grow step by step.
- **Solved** when every flower is awake. The pet says `light.yay`, then the next puzzle or the end.

### Mistakes and hints

- A shine that leaves a flower asleep is **one miss**, with a spoken reason from `whyNot`, which gains one reason:
  - `'unsplit'`: the light never reached the half-mirror. Line `light.miss.unsplit`.
  - When the half-mirror is lit and one flower wakes: the existing `light.miss.sleeping`.
  - When the half-mirror is lit and none wakes: `light.miss.split`.
  - Edge and rock lines are used only when the beam never splits, since with two arms they would not say which arm.
- **Two missed shines glow one tiltable** (one hint): `hintMirror` over `traceAll(nearest)`. Walk the nearest solution's cells in `step` order, breaking ties by arm index (the straight arm first). Glow the first tiltable whose tilt differs. The known answer is preferred among the nearest, as today. The line is `light.hint.split` when the glowing thing is the half-mirror, otherwise the existing `light.hint`.
- Free tilting before a shine never counts.

### Accounting

- Misses come only from shines. Smooth (at most one miss, no hint) and struggling (four or more misses, or two hints) follow the shared rule.
- The round ends after the second puzzle wakes both flowers.

## Level number and band order

| Band | After batch 5 | With this level |
| --- | --- | --- |
| pre-K | `{ min: 1, max: 11, order: [1, 2, 3, 4, 11] }` | unchanged |
| school | `{ min: 2, max: 11, order: [2, 3, 4, 11, 5, 6, 7, 8, 9, 10] }` | `{ min: 2, max: 12, order: [2, 3, 4, 11, 5, 6, 7, 8, 9, 10, 12] }` |

- **School top.** It is the hardest planning board: two arms, each with its own mirror, plus the half-mirror's tilt. The placement and hidden-mirror modes (8–10) come first, as the dive orders them.
- **Not pre-K.** The dive keeps the pre-K window below the planning levels until the school modes are seen played.
- **No renumbering.** It is a new ID appended to the order, so no saved level or pin changes. No `entryLevels` change is needed.

## Couch

It stays out of the couch route and out of *Sunbeam Run* (batch light-lab 2). The couch plays levels 4–6, and its `level(stop)` mapping is unchanged. The couch controls would work as they are, since the highlight moves to any tiltable and Enter tilts it, and par would be `minTurns` over tiltables. Adding a split board to a course is a later proposal, not part of this level.

## Art (code-drawn, `Graphics`, palette colors)

- **Half-mirror:** the mirror's diagonal bar drawn as pale blue glass (0.35 alpha fill) with a thin silver centre stripe and two small white glints, so it reads as "glass and mirror". Same 100-unit cell and hit area as a mirror. The glow and touch-down pulse are the mirror's.
- **Split moment:** a small white sparkle burst (`ctx.particles`) at the half-mirror's cell on the step both arms leave it.
- **Arms:** batch 5's dim stroke on each arm after the split; the trunk keeps the full stroke.

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | Line |
| --- | --- |
| `light.split` | "This is a half-mirror. It splits the sunbeam in two: one beam goes straight, and one bounces. Turn the mirrors so both beams wake a flower, then tap the sun!" (instruction; the pet repeats it) |
| `light.split.yay` | "Two beams, two flowers!" (said once a puzzle is solved, before `light.yay`'s pool on the second) |
| `light.miss.unsplit` | "The light didn't reach the half-mirror. Turn a mirror to send it there." |
| `light.miss.split` | "The light split in two, but both flowers are still asleep. Follow each beam. Where does it go?" |
| `light.hint.split` | "Try turning the glowing half-mirror." |

`light.miss.sleeping` ("One flower woke up, but one is still sleeping. Can the light reach both?") and `light.hint` are reused as they are.

## Layout and presentation

- **Board:** 7×5 at 100 units is the existing level 4–7 board. There is no tray, so the 5-row board fits landscape as it does today.
- **Shine:** the existing step timer, now advancing a step for all arms together. Taps on the sun or tiltables are ignored while the beam shines, as today.
- **Pet and corners:** unchanged from levels 4–7.

## Co-play, off-screen, how-to and bot

- **Co-play:** before the shine, a grown-up points at the half-mirror and asks "Where will each beam go?" The child traces both with a finger.
- **Off-screen:** in a dim room, shine a torch at a window pane at an angle. Some light goes through to the garden and some bounces back onto the wall. This goes in the GAMES entry, since `offScreen` is one line.
- **How-to (level-scoped).** Existing steps written `{ from: 3, to: 6 }` and `{ to: 6 }` already exclude 12. Check that batch 3–5's steps end at `to: 11` or below, and narrow any that are open-ended. New steps for `{ from: 12, to: 12 }`:
  - "The half-mirror splits the sunbeam: one beam goes straight, one bounces."
  - "Turn the mirrors and the half-mirror so both beams wake a flower, then tap the sun."
  - Finish: "The round ends when both puzzles' flowers are awake."
  - Note: "Turning is free; a shine that leaves a flower asleep is a miss, and the glowing mirror is a hint."
- **Bot (`autotouch`).** Unchanged in kind: it taps `hintMirror`'s tiltable until the board solves, then the sun. This now includes the half-mirror.
- **`describeLevel(12)`:** "Split the sunbeam: a half-mirror sends the light straight on and bounces it too; plan both beams to wake two flowers (a toy rule: each beam is dimmer, but still wakes a flower)".

## Rule tests the build needs

In `logic.test.ts`, over 400 seeds at level 12 unless stated:

1. **Regression.** On every plan 1–11, `traceAll` gives one arm equal to `trace` cell for cell, with `step` equal to index plus one. `nearestSolutions`, `minTurns` and `hintMirror` give the same results as before on those boards (a few hundred seeds per level).
2. **Split rule.** A hand-built board checks each direction into a half-mirror of each tilt: one straight arm plus one arm turned by `reflect`. A board where an arm returns to the half-mirror ends with `end: 'loop'` and finitely many arms.
3. **Generator.** The known solution wakes both flowers, one per arm, with no loop. Nothing sits on the sun's cell. At most seven tiltables.
4. **Split required.** With the half-mirror swapped for a mirror of either tilt, or for nothing, no arrangement wakes both flowers.
5. **Fair start.** Not solved, `minTurns` at least 2, no flower awake.
6. **Hint.** From the start and from 50 random tilt arrangements per board, following `hintMirror` reaches a solution in exactly `minTurns` taps. The hint never points at a tiltable that every nearest solution keeps.
7. **Mirror image.** `mirrorPuzzle` of a split board solves exactly when the original does, with mirrored tilts.
8. **`whyNot`.** It gives `'unsplit'` when the half-mirror is unlit and a flower sleeps, `'sleeping'` with one flower awake after a split, and `'split'` with none. Every reason has a voice line.
9. **Ladder.** `rangeFor` at school gives `[2, 3, 4, 11, 5 … 10, 12]`, stepping up from 10 reaches 12, and pre-K is unchanged.

## Settled and open

**Settled here:**
- a half-mirror as a new tiltable kind with both beams leaving at once
- dim arms after a split, reusing level 11's rule that dim light still wakes a flower
- a shared seen-set keyed `x,y,dir` so every walk ends
- `traceAll` with steps, beside an unchanged `trace` for older boards
- the split-required rule (mirror of either tilt, or nothing, cannot solve)
- the hint's step-then-arm order over the nearest solution
- level 12, school only, after batch 5
- no couch, no prediction mode

**Left out:**
- glass and colour on split boards (two tinted arms could cross and invite colour mixing, which the dive leaves out)
- level 11's materials on split boards
- two half-mirrors on one board, or a second split in the generator (the trace allows it, the generator never builds it)
- a split in predict mode (level 7)
- boards wider than 7 or taller than 5

## Device and person checks

These go in [DEVICE-CHECKS](../DEVICE-CHECKS.md) once the level is built:

- Whether the two dim arms read clearly as two beams on an iPad, in sunlight and indoors.
- Whether the half-mirror looks different enough from a mirror at arm's length.
- Whether device speech says "half-mirror" clearly.

## Build order and check tier

**One build slice: "`light-lab`, level 12 *Split the sunbeam*", after batch light-lab 5.**

New levels on an existing interaction (the tap-to-tilt and shine verbs are unchanged), plus a screenshot because the beam drawing changes:
- typecheck
- the game's rule tests, including those above
- one scripted play of level 12 with one missed shine and its line, a second miss for the glow, then the solve to the sticker
- one portrait screenshot mid-shine with both arms showing
- `fingerdemo` at 12

Files expected:
- `src/games/light-lab/logic.ts`, `logic.test.ts`, `index.ts`
- `src/content/voice-script.ts`, `src/content/howto.ts`
- the README row, `docs/GAMES.md`

Run `npm run build` only if a shared file beyond those changes.
