# Ramp Race: truthful support (definition)

Defined 2026-10-17 as slice **Q1** of the [scientific inquiry study](../deep-dives/subjects/inquiry.md#build-slices-in-order), from its [recorded gaps](../deep-dives/subjects/inquiry.md#on-the-island-today). **Built 2026-10-20** ([PR #624](https://github.com/rjdunlap/neo/pull/624)) at the existing-game bug-fix tier. This is a correction to what Ramp Race (`src/games/ramp-race/`) already does. It adds no level, mode, band, land, save field or couch entry. Levels 1–4, pre-K 1–2, school 1–4, stable IDs and pins stay as they are. This is not a full game deep dive, so the `ramp-race` row in the [deep-dive tracker](../deep-dives/README.md) stays unclaimed.

**Why:** the how-to card, some spoken lines and the fair-test help say things the game does not do.
- The goal promises a star at levels 1 and 4, which have none.
- The note calls a roll past or short of the star "a free try", but levels 2–3 count it as a miss.
- Each finish line is wrong about how many rolls, stars or tests end the round.
- At level 4, an unfair pair from the second Check onward counts a hint but shows nothing.
- The ghost finger (`rampTouch`) gives up on an unfair pair, so it cannot recover from one.

## Accounting stays exactly as it is

| Level · mode | What counts | Help |
| --- | --- | --- |
| 1 · explore (4 rolls, wood) | Nothing: no misses, no hints | None needed |
| 2 · height (3 stars, wood) and 3 · both (3 stars) | Every roll that stops off the star is one miss (`onStar` within 0.3 marks) | On the second miss for a star: one hint, the existing ramp/floor glow and `ramp.hint`, at most once per star |
| 4 · fair (3 questions) | Go on an identical pair: no miss, a spoken nudge. Go on an unfair pair: one miss. Go on a fair pair: both cars roll and the question is answered | **Unchanged:** `hints++` on every unfair Check from the second on that question. **New:** the corrective glow (below) appears on the second unfair Check |

**Recorded, not fixed:** at level 4 the hint count goes up on every unfair Check after the first. The other levels count one hint per star. So a child who ignores the glow can collect several hints on one question, more than the help they were actually shown. Whether that changes to one hint per question is part of [inquiry decision 1](../deep-dives/subjects/inquiry.md#decisions-for-the-developer), and Q2 does not change it.

## Fair-test cases, enumerated

Each lane has 9 setups (heights 2/3/4 × carpet/wood/ice), so there are 81 ordered pairs of blue lane A (top) and orange lane B (bottom). The kinds below are counted for **each** question, and the counts are the same for the floor question and the height question.

| Kind | Floor question | Height question | Pairs | Today | Q2 |
| --- | --- | --- | --- | --- | --- |
| `same` | Same height and floor | Same height and floor | 9 | Nudge, no miss | Unchanged (`ramp.same.floor` / `ramp.same.height`) |
| `fair` | Same height, different floor | Different height, same floor | 18 | Both roll | Unchanged. No ties: glide 1 < 1.5 < 2.5 and heights 2 < 3 < 4, so the two distances always differ |
| `wrong-only` | Different height, **same** floor | Same height, **different** floor | 18 | Miss + `ramp.unfair.*`, which wrongly says the *other* thing differs "too" | Miss + a new line that names what actually changed |
| `both-changed` | Different height and floor | Different height and floor | 36 | Miss + `ramp.unfair.*` | Unchanged line (true here) |

## Logic (`logic.ts`)

```ts
export type FairKind = 'fair' | 'same' | 'wrong-only' | 'both-changed';
/** Which pair this is for the question; judgeFair stays as the collapsed form ('wrong-only' and 'both-changed' → 'unfair'). */
export function classifyFair(q: FairQuestion, a: Setup, b: Setup): FairKind;
/**
 * The next touch on the orange lane B that makes the pair fair, holding blue lane A: first make B's other
 * control match A's (the thing the question does not name), then, if the lanes are now identical, change B's named
 * control once. Null when the pair is already fair.
 */
export function fairRepair(q: FairQuestion, a: Setup, b: Setup): 'ramp' | 'floor' | null;
```

In fair mode `rampTouch` returns `'go'` when the pair is fair and `{ lane: 1, change: fairRepair(…) }` otherwise. It never returns null, so the ghost finger can recover from any pair a person leaves behind. Each tap moves a control one step through its cycle (`HEIGHTS` or `FLOORS`). So matching B's other control takes at most 2 taps, and an identical pair needs 1 more: never more than 3 taps. The star and explore branches stay as they are.

## The corrective glow (`index.ts`)

- **When:** on the second unfair Check of a question (`wrongs` reaches 2). A private flag records that the glow is on for this question. More unfair Checks never stack, restart or re-announce it. `next()` clears it with `wrongs`.
- **Where:** it is worked out every frame from the current setups. The two lanes are never frozen in a remembered target, so editing either lane is fine and any fair pair is accepted.
  - If `fairRepair` says `'ramp'`: a pulsing yellow ghost ramp on lane B. It is drawn at A's height when B's height differs from A's. When the lanes are identical, it is drawn at the next height in the cycle.
  - If it says `'floor'`: lane B's floor strip outlined.
  - If the pair is fair (null): a ring around the go button.
  - The glow is drawn only while the game is not busy. It is drawn in the existing `glow` graphic, which keeps `eventMode = 'none'`, so it never takes a touch. Star-mode drawing stays on lane 0 as now.
- **Speech:** the Check that turns the glow on says its kind line first, then `ramp.fairhint`. Later unfair Checks say only their kind line.

## Voice lines (`voice-script.ts`)

| ID | Text | Status |
| --- | --- | --- |
| `ramp.wrong.floor` | That changes the ramp, not the floor. Make both ramps the same height, then change one floor. | New: floor question, `wrong-only` |
| `ramp.wrong.height` | That changes the floor, not the ramp. Make both floors the same, then change one ramp. | New: height question, `wrong-only` |
| `ramp.unfair.floor` / `ramp.unfair.height` | (unchanged) | Kept, now only for `both-changed`, where "too" is true |
| `ramp.fairhint` | Change the glowing part of the orange lane, then press go. | New |
| `ramp.done.explore` | Four rolls! What a car tester. | New: level 1 finish. Deliberately claims no rule, because a person may roll one height four times |
| `ramp.done.stars` | Three stars! What a ramp builder. | New: levels 2–3 finish (also true with help) |
| `ramp.done` | What a scientist! You tested it fairly. | Kept, now spoken only at level 4 |

`ramp.went` reads the rounded distance, as now. Distances are whole or half marks, so no new rounding errors are possible.

## How-to card (`howto.ts`)

None of this wording uses "level", "later", "earlier" or "higher", so it passes `OTHER_LEVELS`. Each card stays far under the 840-character limit.

```ts
'ramp-race': {
  goal: 'Roll a toy car down a ramp and see how far it goes across the floor.',
  steps: [
    { to: 1, text: 'Tap the ramp to make it taller or shorter, then press go and watch how far the car rolls. The floor stays wood.' },
    { from: 2, to: 2, text: 'Tap the ramp to make it taller or shorter, then press go. Stop the car on the star; the floor stays wood.' },
    { from: 3, to: 3, text: 'Tap the ramp to change its height and the floor for carpet, wood or ice, then press go. Stop the car on the star.' },
    { from: 4, text: 'The sign shows what to test: floors or ramps. Change only that on one lane, keep everything else the same, then press go to race both cars.' },
  ],
  finish: [
    { to: 1, text: 'The round ends after four rolls.' },
    { from: 2, to: 3, text: 'The round ends after the car stops on three stars.' },
    { from: 4, text: 'The round ends after three fair tests.' },
  ],
  note: [
    { to: 1, text: 'Every roll is free: there is no star and nothing to get wrong.' },
    { from: 2, to: 3, text: 'A roll that stops short of the star or past it is a miss, and the pet says which way to change. After two on one star, the setup to try glows.' },
    { from: 4, text: 'Two lanes that are just the same get a reminder, not a miss. Pressing go when anything besides the thing on the sign differs is a miss; after two on one test, the part of the orange lane to change glows.' },
  ],
},
```

The module's `coplayHint` names the star, but levels 1 and 4 have no star. It becomes: *Guess together before each roll: how far will the car go, and why?*

## Rule tests (Q2, `logic.test.ts`)

1. For each question, `classifyFair` over all 81 pairs gives 9 `same`, 18 `fair`, 18 `wrong-only` and 36 `both-changed`. It agrees with `judgeFair` once collapsed.
2. Every fair pair has two different distances. The slipperier floor or the taller ramp goes farther, which is what `ramp.fairyay` reports.
3. Recovery: start from each of the 63 non-fair pairs for each question (126 in all). Apply `rampTouch` taps to lane B, each moving one step through its cycle. Every start reaches a fair pair and `'go'` in at most 3 taps. It never returns `'go'` on a non-fair pair and never touches lane 0.
4. Each non-fair kind maps to its line: `wrong-only` → `ramp.wrong.*`, `both-changed` → `ramp.unfair.*`, `same` → `ramp.same.*`. Put the mapping in `logic.ts` so it can be tested.

The existing how-to tests cover the card. Accounting needs no new rule test because it is unchanged.

## Q2 checks and closeout

This is the existing-game bug-fix tier:
- `npm run typecheck` and the Ramp Race rules (`npx vitest run src/games/ramp-race src/content/howto`).
- One filtered regression play at level 4: set up a `wrong-only` pair and press go twice, see the glow and hear the new line, repair the pair and finish all three tests. Record the round's misses/hints, which should show the unchanged accounting.
- `fingerdemo` for `ramp-race` at level 4, because `rampTouch` changes.
- No build unless shared files change. No navigation or offline sweep.
- Closeout: the GAMES.md entry wording.

Not established by any of this: whether a child connects the orange glow to "change this", or whether device speech reads half-marks well. Those stay in [DEVICE-CHECKS](../DEVICE-CHECKS.md).
