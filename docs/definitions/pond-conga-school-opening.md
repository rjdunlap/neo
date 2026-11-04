# Pond Conga — a school opening (two step-by-step ponds)

Definition, 2026-11-04, branch `claude/define-pond-conga-school`. This is dive slice 5 of the [Pond Conga dive](../deep-dives/pond-conga.md#build-slices-in-order) ([younger-band openings](../deep-dives/pond-conga.md#younger-band-openings)). **Docs only:** no game change, code or device evidence. It settles what the dive left open: which ponds a school player gets, the land, the 100-unit layout (cells and buttons), how she moves the line, the accounting under "mistakes teach", the voice, the how-to card, the rule tests, the bot and the check tier. Real-time steering for 6–8 stays open and is not part of this opening.

## Scope and identity

**Fun action.** Lead a little line of ducklings round a pond to each bite of duck food; every bite adds a duckling to the tail. At school the line moves one step each time she swipes or taps, and waits otherwise.

**Learning purpose.** Planning a route on a grid with a body that follows: which way to step so the leader reaches the food, and later round a lily pad without the growing tail getting in the way. Step by step separates the plan from a quick hand, so a slow swipe is never the reason for a bump.

**Standing rules applied.** S2 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)): `school` stays 6–12, a note gives the age, nothing gates. S8: this definition's leans below are adopted. No factual content beyond the batch-1 duck food (peas, sweetcorn, oats), already sourced in the dive.

**What it is.** `pond-conga` gains `school` in `bands` (`['school', 'grownup']`) and two **new school levels** on batch 3's step-by-step rule (`paced: false`). No grown-up level is opened to school: every grown-up pond is 11 by 7 or larger, and beside the corner buttons at 1024 units across that is at most 79 units a cell (`floor(876 / 11)`; cells are a legibility floor here, see the layout), and every grown-up plan but level 8 is real-time. Nothing younger than school: under six, a line whose tail follows and blocks is a rule to be told, not discovered.

**Depends on batch pond-conga 3** (*Step by step*, level 8): the school ponds reuse its `paced: false` update (one step per queued turn, no movement without input), its controller path and its one-stroke-per-step `autotouch`. The school build does not start before batch 3 lands.

**Age note.** About 6 and up: the first pond is open water with three bites, and nothing moves until she does. In the GAMES entry, the README row and the how-to card's note, never a gate.

## Levels and band orders

Two plans appended to `PLANS` with **the next two free IDs after every built and queued grown-up level: 10 and 11** (7, 8 and 9 are reserved by batches 2–4). Saved IDs only exist once shipped; if batch 2 or 4 is still unbuilt when this lands, the school build numbers its plans the way batch 3 handled level 8 without level 7, and keeps 10 and 11.

| ID | Name (`PLANS`) | Pond | Pads | Bites | Legs | Pace | Start |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 10 | A little pond, one step at a time | 6 by 4 | 0 | 3 | 2–5 | `paced: false` | 3 ducklings, as today |
| 11 | Round the lily pads, one step at a time | 7 by 4 | 2 | 4 | 3–6 | `paced: false` | 3 ducklings, as today |

Both use `makePond` as built (open water stays one piece, a clear runway ahead of the start, each bite kept only if a bonk-free route as short as `lowerBound` exists), the batch-1 seeded food and reeds, and one pond per round as today. The line ends at 6 or 7 ducklings: long enough that the tail starts to matter on the 7 by 4 pond, short enough that the pond never fills.

```ts
const LEVELS: BandLevels = {
  school: { min: 10, max: 11 },
  grownup: { /* unchanged: batch 3's range and order, which do not list 10 or 11 */ },
};
```

`entryLevels` gains 10 and 11 (beside batch 3's 8). A school player starts at 10; two smooth rounds step up to 11; two struggling rounds at 11 step back to 10. A birthday or pin carrying 10 or 11 into grown-up lands on the grown-up order's first level through `landing()` in `src/progress/difficulty.ts` (that is batch 3's level 8, step by step, the natural next pond). No grown-up level, plan, name or pin changes; `describeLevel` names the pond, as it does today.

## Land and places

**Home land: stays Lantern Lake**, under the rule the [Island Bridges school opening](island-bridges-school-opening.md#land-and-places) settled and [Lantern Lights](lantern-lights-school-opening.md#land-and-places) followed: a grown-up game that opens small levels to the top of school keeps its grown-up home. The READY line's "a home land in Wonder Woods" is a place, not a land: Wonder Woods, the school home spot, lists the game under its subject automatically (`region: 'puzzle-peaks'`; places pick games by subject through `gamesFor(band)` in `src/app/scenes/PlaceScene.ts`). The game stays in exactly one land; Explore's All games and the Arcade follow `visibleIn` and need nothing. This is the third case of the rule: the comment on `lantern-lake` in `src/content/lands.ts` (which names Island Bridges and Lantern Lights) adds Pond Conga.

It is the first *arcade* game in the school Puzzle Peaks list; its subject stays Puzzle Peaks (route planning), and its `challenge` stays `hands`.

## Layout at 100 units

The current touch layout (`resizeTouch`) caps a cell at 80 with buttons 76 high beneath the pond (`rest` = 16 + 76 + 44 + 12 = 148). The pond itself is one swipe target, so the 100-unit floor binds the **buttons**; 100-unit cells are this opening's legibility choice (big ducklings, a big food item, a tap that reads as "that way"). At `ctx.band === 'school'`:

- **Cells:** cap 100 and floor 100 (the 80 cap and `MIN_TOUCH` become per-band values: 100 at school; grown-up numbers unchanged).
- **Buttons:** Hint and Start over 100 high (so `rest` = 16 + 100 + 44 + 12 = 172), width as built, `max(100, min(210, floor((w − 340) / 2)))`.

Why 4 rows, not the dive's 7 by 5: with Hint and Start over beneath the pond, the beside arrangement gives `floor((768 − 132 − 172) / 5)` = 92 at 5 rows, so a 5-row pond cannot reach 100 on the 768-unit short side. At 4 rows it is 116, capped at 100. Nothing else in the arrangement moves.

| View | Pond | Beside: `min(100, (w − 148)/cols, (h − 304)/rows)` | Chosen | Pond on screen | Buttons (two, 16 apart) |
| --- | --- | --- | --- | --- | --- |
| 1024 × 768 | 6 by 4 | 100 (146, 116) | beside (below is 96) | 600 × 400, x 212–812, y 132–532 | 210 × 100, x 294–504 and 520–730, y 548–648; help line y 676 |
| 1024 × 768 | 7 by 4 | 100 (125, 116) | beside (below is 96) | 700 × 400, x 162–862, y 132–532 | the same |
| 1024 × 1365 | 6 by 4 / 7 by 4 | 100 | beside (ties go beside) | as above, y 132–532 | the same; the rest of the view is open |

The pond starts right of x 124 (the home and help buttons) as today, and its bottom edge (532) is higher than the grown-up level-1 pond's (about 615), so the bottom-left pet is clearer than it is now. The view is never shorter than 768 (`computeView` grows the spare side), so wider iPads and insets only add room. Food art and ducklings already scale with the cell (`cell / 70`); hint dots are `cell × 0.13`, 13 units.

## How she moves the line

Batch 3 builds the step-by-step input: a swipe queues a turn and the line takes one step; a touch that lifts without a swipe takes one step straight on; a swipe straight back is ignored. At school one thing changes:

- **A tap steps toward where she tapped** (lean, adopted). At 100-unit cells "tap where they should go" is the most direct first action for a six-year-old, and it never needs swipe skill. The direction is the larger of the two distances from the leader's centre to the touch-up point; a tap on the leader's own cell, or one that points straight back, does nothing (no step, nothing counted, the touch-down ring still shows). Swipes work exactly as in batch 3. A pure helper in `logic.ts`, `tapToward(leader: Cell, x: number, y: number, cell: number, heading: Dir): Dir | null`, holds the rule.

Grown-up step by step keeps batch 3's "a tap goes straight on". The couch path (one step per D-pad press) is unchanged and never sees `school`.

## Taps, misses and help

### A bump at school

Today a bump turns the whole line about (the old tail leads) and counts as a step. That keeps a real-time line from bumping again at once; with nothing moving until she moves, a child does not need it, and a line that suddenly leads from the other end is hard to follow at six. At school (lean, adopted):

- **A bump is a refused step:** the line stays exactly where it was, with a boing, a small shake of the leader and a spoken line. Her next swipe or tap tries again from the same place.
- **Only when every way is shut** (each of the three non-back steps would bump) the line turns about as today, with `conga.bonk`, so she can never be stuck. Start over is always there too.

The rule stays in `logic.ts`: `step` is unchanged; a helper (`schoolStep(pond, state, dir)` or a `refuse` option) returns the old state on a bump unless every non-back step bumps, in which case it returns `step`'s turned-about state.

### Accounting

| What she does | Counts as | Feedback |
| --- | --- | --- |
| A step onto open water or a bite | nothing | as built ("Yum, peas!" and a duckling joins) |
| A tap on the leader or straight back | nothing | the touch-down ring only |
| A bump (pad, bank or the line) | **one miss** | boing, `conga.bonk-school` |
| The second bump on a pond | one miss | as above, and the hint dots to the next bite show by themselves, without counting a hint (the glow after two misses) |
| Hint | one hint | the hint dots and `conga.hint`, as built |
| Start over | nothing | as built (bumps already counted stay counted) |

**Why a bump is a miss at school.** In step by step a bump is a step she chose, not a timing slip: it is a wrong answer in AGENTS' sense, so it gets the boing, a spoken hint and the glow after two. On a 3–4 bite pond, four bumps is real struggle, so `isStruggle` reads it fairly.

**The grown-up accounting is unchanged** and still waits on the developer ([Waiting on the developer](../WAITING-ON-DEVELOPER.md): "Should a bonk count as a miss for level adaptation?"). That call is about real-time bumps by a careful grown-up; this school row is separate. If the developer decides the grown-up question, the school row stays as written unless they say it should follow.

Every pond finishes: bumps never end anything, the dots lead on from any state (`hintPath`), and one sticker comes with every finished round, with or without help.

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | When | Line |
| --- | --- | --- |
| `conga.go-school` | school only: the first instruction, through `ctx.instruct` so the pet repeats it, instead of `conga.go-touch` | "Help the ducklings find their food! Swipe, or tap where they should go. They take one step each time." |
| `conga.bonk-school` | school only: on each bump (first time per pond in full; later bumps the boing only, as `conga.bonk` is said once today) | "Boing! Something's in the way. Try another way." |

`conga.go` and `conga.go-touch` say "a bump counts as a step" and "the whole line turns about", neither true at school. `conga.yum.*`, `conga.hint`, `conga.pond`, `conga.done` and `conga.bonk` (for the rare every-way-shut turn-about) serve as they are. Both new lines are on device speech until the voice script's next render.

## Co-play, off-screen, how-to and bot

- **Co-play:** unchanged string for every band, if it still fits after batch 3; the dive's "two people can take swipes in turn" suits school well. **Off-screen:** the follow-the-leader duckling walk from the dive, unchanged.
- **How-to card:** school steps scoped `from: 10, to: 11` (no level-relative wording): "Swipe the way the ducklings should go, or tap a spot beside the leader. The line takes one step each time and waits for you." and "If something is in the way, the line stays put. Try another way. Hint shows dots to the next bite." The grown-up steps get `to:` bounds that exclude 10–11. The `note` adds: "At school she plays two small step-by-step ponds (about 6 and up). A bump counts as a miss there; the line does not turn about."
- **Sticker:** the existing seeded sticker.
- **Bot:** batch 3's one-stroke-per-step `autotouch` follows `hintPath` and never bumps, so it plays the school ponds unchanged; `fingerdemo` at school level 11 proves it. A demo pond uses `firstCrumbs` as today (two bites).
- **Couch:** unchanged. `COUCH_IDS`, the trip stops (levels 1–5) and the course *Crumb Trail* are grown-up couch content; the school levels are never on the trip or a course, and the school rules read `ctx.band`, which couch play never sets to school.

## Rule tests the build needs

1. `levels('school')` is `{ min: 10, max: 11 }`; `levels('grownup')` is unchanged and does not list 10 or 11; `entryLevels` includes 10 and 11; no other band is listed.
2. Over 300 seeds each, every level-10 pond is 6 by 4 with no pads and three bites, every level-11 pond is 7 by 4 with two pads and four bites, and each has a bonk-free route of length `lowerBound` (the existing par property).
3. `landing(10 | 11, grown-up range, entryLevels)` is the grown-up order's first level.
4. `tapToward`: a tap one cell right of the leader steps right, and likewise for each direction; the larger distance wins; a tap on the leader's cell or straight back returns null.
5. The school step: a bump returns the same state (body, heading, bites eaten) when another non-back step is open; when every non-back step bumps, it returns `step`'s turned-about state, from which a step is open or `hintPath` leads on.
6. From the start, following `hintPath` one step at a time through the school step reaches every bite in exactly `par` steps with no bump.
7. `registry.test.ts`: the grown-up-only `ids` list (near line 312) drops `pond-conga`, and a case checks its bands are `['school', 'grownup']`. The lands tests pass with the game in Lantern Lake at school.
8. `conga.go-school` and `conga.bonk-school` exist in the voice script, and the how-to card test passes (no level-relative wording).

A logged 1024 × 768 check that cells and both buttons are at least 100 (a rule test cannot reach `resize()` without Pixi; the Island Bridges and Lantern Lights builds logged it the same way).

## Settled and open

**Settled here:** two new school-only step-by-step levels (10: 6 by 4, three bites, no pads; 11: 7 by 4, four bites, two pads), entries for a birthday; after batch 3; home stays Lantern Lake by the Island Bridges rule, Wonder Woods lists it by subject; 100-unit cells and buttons on 4-row ponds with no other layout change; a tap steps toward the touch; a bump is a refused step (turn-about only when every way is shut) and counts as a miss at school, with the glow after two; the grown-up accounting untouched and still with the developer; about 6 and up; couch unchanged.

**Open, not blocking:** real-time steering for 6–8 (a slow paced pond at school) after a person has watched a child play the step-by-step ponds; a third school pond with a longer line if level 11 proves easy; a 5-row pond if buttons ever move beside the pond in landscape.

## Device and person checks

- Whether a six-year-old starts from the spoken instruction alone, and whether she taps or swipes.
- Whether a refused step reads as "blocked, try another way" or as "nothing happened".
- Whether the tail gets in her way on the 7 by 4 pond, and whether that is fun or frustrating.

## Build order and check tier

**After batch pond-conga 3** (it shares `index.ts`, `PLANS`, `LEVELS` and `entryLevels` with batches 2–4, so whichever lands later rebases; the `lantern-lake` comment and `registry.test.ts` grown-up list are shared with any further Lantern Lake opening). **New band entry with a layout change and a school-only input rule:** typecheck, the game's rule tests and the registry and lands tests, one scripted school play of level 10 with one bump (hear `conga.bonk-school`, the line stays put), a second bump (the dots appear without counting a hint), then a tap-toward step and the sticker, then level 11 to its sticker, one portrait screenshot of the 7 by 4 pond at school, the logged 1024 × 768 sizes, and `fingerdemo` at school level 11. One build for the voice lines. `couchgames` is not needed (the couch path is untouched).

Files expected: `src/games/pond-conga/index.ts`, `logic.ts`, `logic.test.ts`, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.
