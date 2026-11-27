# Common Ground, level 3: Two residents (definition)

Defined 2026-11-26 as slice **4** of the [social-emotional study](../deep-dives/subjects/social-emotional.md#build-slices-in-order): the study's [older-family case](../deep-dives/subjects/social-emotional.md#common-ground-first-older-family-case) written as the next level of [`common-ground`](common-ground.md), after [level 2](common-ground-2.md). Docs only: no code, ID, voice line, art or save field exists yet. Levels 1 and 2 are unchanged and every number below is separate from theirs.

**Fun action and purpose:** two friends share a small room and each has said what they will do in it. One draws and needs the window; one plays drums. She drags a drawing easel and a drum onto the same 2×3 floor and presses *Visit*, and both friends start their activity. Each friend also has one *wish* (a nice extra, not a need). The learning purpose is **sharing one space between two people with different wants**: tell a *need* from a *wish*, keep both needs, see which wish a plan serves, and notice that the two wishes cannot both be kept in this room, so either choice is fair. Nobody is more deserving; the game never ranks a wish, scores a plan or asks whose turn it is to give way.

## Overlap

Checked against `origin/main` at `85c2ac31e`. Level 1–2's table stands.

| Game | What it already owns | Why this is different |
| --- | --- | --- |
| Common Ground 1–2 | One friend's two requests, a room, a changed request | One friend, no competing wish. Here two people's requests sit on one floor and a rule couples them |
| Playdate Workshop 1–3 | Two friends' pictured craft requests and shared-material plan | Materials and turns, not space; no wish that cannot be had together |
| Village Planner, Picnic Pantry | Ordering jobs and counting a shared supply | A schedule or a count, with no need-versus-wish split |
| Toy Drawer, Tap Then Place | Fitting footprints into cells | A fit, not a rule about two people's activities |
| Story Steps 14 (Two Viewpoints) | Hear two accounts and choose a story ending | Narrated enactment vs placing on a floor |

Alternative with the two activities in separate pictured scenes (a later *take turns* mode) is **not** a hidden answer here: this board has no turn, no clock and no second scene.

## The model (`logic.ts`)

Integers on the level-1 floor, cells numbered `0 1 2 / 3 4 5`. New names sit beside the levels 1–2 exports; nothing earlier changes.

- **Pieces:** `drawing` (an easel, quiet) and `drums` (loud). One piece to a cell. `place` swaps on an occupied cell and never refuses a drop. No plant at this level.
- **Fixed room:** the window is on the top wall, the shelf is the top-left cell (`0`), the doorway is the bottom-left cell (`3`). The room is not mirrored at this level.
- **Needs (both kept to be accepted):** (1) the drawing is *at the window*, the top row `0 1 2`; (2) the drums are *not orthogonally beside* the drawing. A diagonal is allowed **as a stated toy rule**, not an acoustic claim, and the voice says "the drums are not right next to my drawing", never that a diagonal is quiet.
- **Wishes (optional, never judged):** the drawer wishes the drawing at the shelf (cell `0`); the drummer wishes the drums at the doorway (cell `3`). A wish never changes whether a plan is accepted.
- **Verdict `check3(state)`:** `unplaced` (a piece is in the tray); then `ok`; or `window` (the drawing is not in the top row; reported first when more than one fails); or `beside` (the drawing is at the window but the drums are orthogonally beside it); or `clash` (the one arrangement drawing `0`, drums `3`, which is `beside` and is exactly the two wishes together). Accepted only on `ok`.
- **`served(state)`:** for an `ok` plan, which wishes it serves: `{ shelf: drawing === 0, doorway: drums === 3 }`.
- **Counts the tests re-derive,** over the 30 ordered placements of two pieces on six cells: **8 accepted**, 15 `window` (the drawing in the bottom row; 7 of those also have the drums beside it), 6 `beside` and 1 `clash` (together the 7 top-row-drawing placements with the drums orthogonally beside). The accepted eight are, as (drawing, drums): (0,2) (0,4) (0,5) (1,3) (1,5) (2,0) (2,3) (2,4).
- **Which wish each accepted plan serves:** shelf only: **3** plans (drawing at `0`); doorway only: **2** plans, (1,3) and (2,3); neither: **3** plans, (1,5), (2,0), (2,4); **both: none**, because drawing `0` with drums `3` is the one `clash`. The study's two examples are (0,4) (the shelf) and (2,3) (the doorway).
- **Seeded appearance only.** The seed picks the two friends (distinct animals) and colours, and **which friend is the drawer**, so neither animal is always the quiet one, and the **order they speak in**, so the first speaker's wish is not favoured. It never changes the rules or counts.
- **`hintAction3(state)`** is one legal move toward `ok` that **never names a wish**: a piece in the tray or an unaccepted drawing goes to the first top-row cell (reading order) that leaves the drums a legal cell; drums that are beside the drawing go to the first legal cell in reading order. It is one move that works, not the only one, and the tests show it reaches `ok` from every state in at most two moves without caring which wish it serves.

## The level

| Level | Name (`describeLevel`) | What it is |
| --- | --- | --- |
| 1 | *A place for you: arrange two things so a friend’s two requests are kept* | Unchanged |
| 2 | *A request changed: the friend asks for the basket on a different side, so revise the room* | Unchanged |
| 3 | *Two residents: place a drawing and a drum so both friends’ needs are kept, then choose a plan* | New: needs, wishes and a shared floor |

**Band placement (frozen):** `LEVELS = { school: { min: 1, max: 3 }, grownup: { min: 3, max: 3 } }` and `bands: ['school', 'grownup']`. Two smooth level-2 rounds in `school` step up to level 3 through `difficulty.ts`; two struggling rounds step down; `grownup` starts at 3 because levels 1–2 are too short for 13 and up, and pins work as everywhere. No middle band, no pre-K, no `lap`–`prek`. Saved levels and pins are not renumbered. **Land: Story Grove** (the game's land); `grownup` needs the lands test to report the page fits at that band, and if a full page would force a shrink the build pages it, never shrinks a target.

### First round

The bunny draws, the cat drums. "I need a place by the window to draw, and it would be nice to have the shelf." "I need a place for my drums, and it would be nice to be by the doorway." She puts the easel top-middle and the drums bottom-left, presses *Visit*, and both start. The doorway wish is shown as kept; the shelf wish as "not this time". She presses *Try another*, moves the easel to the shelf corner and the drums to the middle of the bottom row (a plan that serves the shelf), and presses *Keep this plan*.

## Screen and controls

Level 1's room, tray, drag rules and pet clearance apply (cells `min(160, (view.w − 80) / 3)`, never under 100). Added:

- **Two request cards** above the room, one per friend, each with a *need* row (a solid-bordered picture: easel by the window, or drums with a "not right beside" arrow to the easel) and a *wish* row (a dotted star picture: easel at the shelf, or drums at the doorway). Tapping a card replays that friend's words. Needs carry a green tick when kept in the current arrangement; wishes carry a star when served. A wish with no star is shown neutrally ("not this time"), never in a warning colour.
- **Visit** (disabled until both pieces are placed). On `ok` both friends start; the two wish marks resolve and *Keep this plan* and *Try another* appear (each at least 100 units with the 10-unit pad). *Try another* returns both pieces to where they were with Visit available again; it is free. *Keep this plan* finishes the round.
- **On `window` or `beside`** the friend whose need is unmet stops and that card pulses.
- **On `clash`** the two wish cards pulse together and the voice says they cannot both be kept in this room; she is never told which to give up.
- Nothing is read for navigation; pictures and the voice carry the cards.

## Accounting, help and finishing

- **Misses:** a Visit that is `window` or `beside` is one miss and names one unmet need (the window first). A `clash` is **not** a miss: trying for both wishes is an experiment, and the verdict is shown, not scored. *Try another* and moving pieces are free.
- **Hints:** Help, or the glow after two misses, plays `hintAction3` (one piece and cell glow, a tap or drag completes it); using it is a hint. After two hints in a round a third is carried out by the pet, so the round can always finish; it is supported, not independent.
- **Adaptation:** `ctx.finish({ misses, hints })` after *Keep this plan*. Which wish the kept plan serves is never recorded as a score: all three kinds (shelf, doorway, neither) finish identically with one sticker. If the first Visit is already `ok` with no miss, the round is smooth whatever the plan serves.
- **Finish:** the friends carry on a moment, then the finishing line, then the shell awards the sticker (the final room, drawn from its seed as in level 1). Nothing is saved and no creation is kept.

## Speech (`voice.ts`)

`{name}` is her name; `{a}` and `{b}` are the friends' animals. Lines carry `{name}` or an animal so they stay on device speech; no voice clip is rendered in the build slice. The friends only state what they need or wish for; no line says whose wish matters more, calls a plan selfish or tells a friend how to feel.

| Moment | Line |
| --- | --- |
| Start (`ctx.instruct`) | "{name}, two friends share this room. Listen to what each one needs." |
| Drawer | "I need a place by the window to draw. It would be nice to have the shelf." |
| Drummer | "I need a place for my drums. It would be nice to be by the doorway." |
| `window` | "My easel is not by the window yet." |
| `beside` | "My drums are right next to the drawing. They need a different place." |
| `clash` | "The shelf and the doorway wishes can not both happen in this room. Which plan would you like to try, {name}?" |
| Hint | "Try the glowing piece, {name}. It goes in the glowing place." |
| `ok`, shelf wish served | "Both needs are kept, and the drawing is by the shelf." |
| `ok`, doorway wish served | "Both needs are kept, and the drums are by the doorway." |
| `ok`, neither | "Both needs are kept. The wishes are for another plan." |
| Try another | "Let us try another plan." |
| Finish | "You found a plan that keeps what each friend needs." |

## Rule tests (`logic.test.ts`)

1. `check3` over all 30 ordered placements returns `ok` for exactly the 8 listed, `window` for 15, `beside` for 6 and `clash` for exactly drawing `0` with drums `3`, each against a plain adjacency and row rule; adjacency is orthogonal only.
2. `served` over the 8: shelf only 3, doorway only 2, neither 3, **both 0**; the study's two example plans are accepted and serve exactly the one wish each.
3. A wish never changes a verdict: for every placement `check3` equals the verdict of the needs alone.
4. `place` swaps on an occupied cell and never refuses a drop.
5. `hintAction3` from every reachable incomplete state is a legal move, reaches `ok` in at most two moves, never moves a piece that already satisfies its need, and does not read the wishes (the same hint for two states that differ only in which wish a result would serve).
6. Seeded rounds show both friends as drawer across seeds, both speaking orders, and never change the rule or counts; the same drawer is never drawn twice in a row.
7. `LEVELS` is `school` 1–3 and `grownup` 3–3; levels 1 and 2 and their tests and counts still pass unchanged; `describeLevel` has all three.

## Ghost finger, how-to card and registration

- **How-to card:** a level-3 card in `howto.ts`: the two request cards, a finger dragging the easel to the window row and the drums to a cell that is not beside it, *Visit*, then *Keep this plan*.
- **Ghost finger:** `autotouch()` at level 3 picks one of the 8 accepted plans from the seeded rng, places both pieces, presses *Visit* and then *Keep this plan*; a unit test runs 50 seeds and every one reaches `ok` with no miss and the runs include all three kinds of plan. `fingerdemo` plays level 3 once.
- **Files:** `src/games/common-ground/` (`logic.ts`, `logic.test.ts`, `index.ts` for the band and levels, `howto.ts`, `voice.ts`, `art.ts` for the easel, drum, shelf and doorway, `layout.ts` only if the request cards need room), `docs/games/common-ground.md` (the Grows into line, `npm run game-docs`) and a verification entry. No new land or ID. Run `node scripts/content-barrels.mjs` after `voice.ts` and `howto.ts`.

## Check tier

New interaction on an existing game: typecheck, rule tests, the lands and registry tests (band and page fit), one filtered scripted play at level 3 (a Visit with the drawing outside the window row, a `clash` Visit that is not a miss, a hint, an accepted plan that serves a wish, *Try another*, then *Keep this plan*), one portrait screenshot, and `fingerdemo` at level 3; `npm run build` only if shared files change. Whether a six-to-eight-year-old, a tween or a parent finds this fun, and whether the toy adjacency rule reads fairly, stay person checks, not gates.

## Open decisions

1. **Grown-up start.** Default: `grownup` plays level 3 only. If a 13-and-up player finds a 2×3 board too thin, a larger floor is a separate later definition, not a change here.
2. **The clash rule.** Default: `clash` is shown but not a miss. If it is seen as hiding a real error, count it; the rule tests change only the accounting line.
3. **Wish marks.** Default: a star on a served wish and a neutral "not this time" otherwise. If the neutral mark still reads as a loss, hide wish marks until *Keep this plan*.
4. **Later cases.** Separating a character's assumption from a confirmed requirement, and a genuinely infeasible case where the valid ending is adding a space or a separate scene, are the study's later sessions; each needs its own definition.
