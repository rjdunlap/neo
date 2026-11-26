# Ribbon Workshop, How Many Pieces Fit?: level 8 (definition)

**Status:** defined 2026-11-25 as slice **R7** of the [fractions study](../deep-dives/subjects/fractions.md#build-slices-in-order); **Built:** 2026-11-25 ([PR #2193](https://github.com/rjdunlap/neo/pull/2193), [verification](../verification/2026-11-25-ribbon-workshop-level-8-how-many-pieces-fit.md)): as defined, with one added line `ribbon.fit.pick` ("Pick an answer card first.") for an empty Check on tag 2, the voice IDs spelled `ribbonfit.*` instead of `ribbon.fit.*` (the `ribbon` prefix is one the voice-clip test requires a rendered clip for, and the build run does not render clips, so the lines use device speech until a Better voice pass renders them under the `ribbon` prefix), and the tied gift standing past the spool's end rather than at the order's end so it never covers the unit labels. Every [open decision](#open-decisions) has a default the build uses.

Defined from the [fractions study's candidates row](../deep-dives/subjects/fractions.md#candidates-and-fit), [recommendation row](../deep-dives/subjects/RECOMMENDATIONS.md#fractions-recommendations) and [anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits). It is one new level of the existing game `ribbon-workshop`, not a new game.

**Fun action and purpose:** an order ribbon ¾ of the spool long lies on the bench below the 1-whole spool. She measures it using **½-spool pieces**. One piece fits cleanly, and a second piece hangs past the end of the order. She takes that second piece back, snips it in half with the scissors into two halves of a piece, and lays one snipped half alongside the first piece so the order is filled. Then the second tag asks: *How many ½-spool pieces fit?* She picks `1½` pieces (not `1¼`, which mistakes the leftover ¼ of the whole spool for ¼ of a piece). The learning goal is **measurement division of fractions (`¾ ÷ ½ = 1½`) with explicit units**: finding how many copies of a fractional measuring piece fit into a target length, and keeping the unit of the remainder (¼ of the whole spool) distinct from the unit of the quotient (½ of the measuring piece) (CCSS `5.NF.B.7` and `6.NS.A.1`, on the pages the [study's anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) opened).

## References and source check

No new source was opened for this definition. The study's [anchors](../deep-dives/subjects/fractions.md#anchors-and-evidence-limits) and [similar-games table](../deep-dives/subjects/fractions.md#similar-games-and-tools) apply (`CCSS 5.NF.B.7` on interpreting division of fractions visually, and `6.NS.A.1` on explaining the meaning of the quotient rather than applying invert-and-multiply). The study asked for a content review and explicit unit labels before build, and warned: *"do not turn the residual length 1/4 into a quotient of 1/4."* Under the [October 23 record](../archive/DECISIONS-2026-10-23.md#standing-rules), the building session's source check is to read every line in the [voice table](#voice) and every label in `fit.ts` and confirm that:

1. Every fraction names its reference unit explicitly (`of the spool` for the order and the ½-spool piece, `of a piece` / `pieces` for the snipped half and the quotient).
2. No line calls the residual `¼` of the spool a quotient of `¼`, and the `1¼` check feedback explicitly names why `¼` of the spool is `½` of a ½-spool piece.

## Overlap

Checked against `origin/main` at `e3b66ed44` (GAMES entries, `src/games/ribbon-workshop/`, `src/games/inchworm/`, `src/games/measuring-post/`, `src/games/pet-kitchen/`).

| Game or level | What it already owns | Why How Many Pieces Fit? is different |
| --- | --- | --- |
| Ribbon Workshop 1–3 | Composing a target ribbon length from halves and quarters of one spool | Builds a target length; never asks how many copies of a fractional measuring piece fit into another fraction |
| Ribbon Workshop 6, Whole Switch | Reframing one fixed ribbon against a short (12-tick) or long (24-tick) spool | Compares wholes for a whole-number fit (2 or 4); never splits a piece or produces a fractional quotient |
| Ribbon Workshop 7, Ribbon Cases | Sharing one tray across two orders and repairing after a change | Adds and decomposes fractions with a fixed whole; no measurement division |
| Inchworm Measure, Measuring Post | Counting how many whole inchworms or unit sticks fit along a path | Whole-number measurement only; never splits the measuring unit into a fractional piece |
| Pet Kitchen 14–15 | Equal sharing of food and equivalent cup measures | Partitive sharing / equivalent sums; no measurement division of length by a fractional unit |

**Identity:** level 8 of `ribbon-workshop` in Counting Cove, reusing the spool, workbench, scissors, bow, undo and two-tags-one-sticker round.

## The model (`logic.ts`)

All lengths are whole numbers of ticks with `TICKS = 4` to one whole spool, matching levels 1–3 and 7. Nothing is compared in pixels. This level adds its own small model (`FitBench`, `fitSolve`, `fitHint`, `fitJudgeMeasure`, `fitJudgeCount`) at the end of `src/games/ribbon-workshop/logic.ts` without modifying levels 1–3, 6 or 7.

- **Constants:**
  - `FIT_ORDER = 3` (the order ribbon is ¾ of the spool).
  - `FIT_CAPACITY = 4` (1 whole spool; the bench allows placing a second whole ½-spool piece so the player can see the `1`-tick overhang past the ¾ order).
  - `FIT_UNIT_PIECE = 2` (one whole measuring piece = ½ of the spool).
  - `FIT_HALF_PIECE = 1` (half of a measuring piece = ¼ of the spool).
  - `FIT_CHOICES = ['1', '1_1/4', '1_1/2', '2'] as const` (the four Tag-2 answer cards).
- **Tag 1, *Measure the ¾ ribbon*:**
  - **Initial state:** `tray: [{ id: 0, size: 2 }, { id: 1, size: 2 }]`, `bench: []`, `nextId: 2`.
  - **Actions:**
    - `place(id)`: moves a tray piece to the end of `bench`. Refused (returns `null`, no change) if `total(bench) + piece.size > FIT_CAPACITY`.
    - `return(id)`: moves a placed piece from `bench` back to the end of `tray`.
    - `snip(id)`: replaces a tray piece with `size === 2` (a whole ½-spool piece) with two pieces of `size === 1` (`½` of that piece) in the same tray position. A placed piece on the bench cannot be snipped; it must be returned first.
    - `undo()`: restores the state before the last `place`, `return` or `snip`.
  - **Verdicts from `fitJudgeMeasure(state)`:**

    | Verdict | When | Counts |
    | --- | --- | --- |
    | `empty` | `bench.length === 0` | nothing |
    | `short` | `0 < total(bench) < 3` | one miss; gap flashes |
    | `long` | `total(bench) > 3` | one miss; overhang past the ¾ mark flashes |
    | `right` | `total(bench) === 3` | finishes Tag 1 |

    Consistent with levels 1–3 and 7, every bench arrangement summing to 3 ticks is accepted (`[2, 1]`, `[1, 2]`, or `[1, 1, 1]` if both pieces were snipped).
- **Tag 2, *How many pieces fit?*:**
  - **State:** `{ choice: FitChoice | null }`, with an undo stack of earlier choices (reset when Tag 2 begins so undo never reaches back into Tag 1). The bench stays visible in its accepted Tag-1 arrangement with each piece's unit label (`1 piece`, `½ piece`).
  - **Actions:** `choose(choice)` replaces `choice`; `undo()` restores the previous choice.
  - **Verdicts from `fitJudgeCount(choice)`:**

    | Verdict | When | Counts |
    | --- | --- | --- |
    | `empty` | `choice === null` | nothing |
    | `wrong_unit` | `choice === '1_1/4'` | one miss; plays the unit-comparison pulse |
    | `wrong` | `choice === '1'` or `'2'` | one miss |
    | `right` | `choice === '1_1/2'` | finishes Tag 2 and the round |

- **Solver (`fitSolve`) and hint (`fitHint`):**
  - On Tag 1, `fitSolve(state)` is a breadth-first search over `place`, `return` and `snip` (preferring fewest returns, then fewest snips, then fewest steps, then tray order) to `total(bench) === 3`. From the start, the shortest path is 4 actions (`place(0)`, `snip(1)`, `place(2)`, bow check). `fitHint` returns the first step of `fitSolve`, or `{ kind: 'check' }` when `total(bench) === 3`.
  - On Tag 2, `fitHint(choice)` returns `{ kind: 'choose', choice: '1_1/2' }` when `choice !== '1_1/2'`, else `{ kind: 'check' }`.

### What the enumeration says

Tag 1 starts with two pieces of size 2 (`total = 4`). By inspection, every reachable state has `total(tray) + total(bench) === 4`, at most 4 pieces exist (when both size-2 pieces are snipped), and `total(bench) <= 4`. From any reachable state (whether empty, overfull at `4`, or snipped), `fitSolve` finds a path to `total(bench) === 3` in at most 5 actions (e.g., from `[2, 2]` on the bench: return one `2`, snip it into `[1, 1]`, place one `1` -> 3 actions plus bow).

## The level

| Level | Name | The frozen case | What it adds |
| --- | --- | --- | --- |
| 8 | *How Many Pieces Fit?* | Order: ¾ of the spool. Tray: two ½-spool pieces + scissors. Tag 1: cover the ¾ order using ½-spool pieces (snipping one in half). Tag 2: choose how many ½-spool pieces fit (`1`, `1¼`, `1½`, `2`) | Measurement division (`¾ ÷ ½ = 1½`): splits the measuring unit visibly and separates the residual length (`¼` of the spool) from the fraction of a piece (`½` of a ½-spool piece) |

There is one case, as in Whole Switch (level 6) and Ribbon Cases (level 7). The seed varies the ribbon colour and the display order of the four Tag-2 answer cards, never the quantities.

**Numbering and bands.** Level IDs 4 and 5 stay reserved and undefined. Level 8 is appended: `LEVEL_IDS` becomes `[1, 2, 3, 6, 7, 8]`, `school` becomes `{ min: 1, max: 8, order: [1, 2, 3, 6, 7, 8] }`, and `grownup` becomes `{ min: 6, max: 8, order: [6, 7, 8] }`. Saved levels and pins at 1, 2, 3, 6 and 7 are untouched.

### First round

The 1-whole spool sits above the bench. Below it lies a ¾-spool order ribbon marked "¾ spool". In the tray wait two ½-spool strips, each marked "½ spool". "Here is a three-quarter ribbon. Measure it with these half-spool pieces. Tap pieces onto the ribbon, then tap the bow."

1. She taps the first ½-spool piece. It lays along the order from the left edge: "One piece."
2. She taps the second ½-spool piece. It reaches past the ¾ mark to the end of 1 whole. She taps the bow: it is a miss, and the extra ¼ overhang flashes. "Too long! That second piece sticks out past the ribbon. Take it back and snip it in half."
3. She taps the second piece on the bench to return it to the tray, taps the **scissors**, then taps the ½-spool piece in the tray: "Snipped in half! Now each bit is half of a piece."
4. She taps one snipped half-piece onto the bench. It fills the remaining gap cleanly up to ¾! She taps the bow: "It fits! One whole piece, and half of another piece."
5. Tag 2. The bench stays visible with brackets showing "1 piece" over the full ½-spool strip and "½ piece" over the snipped bit. Four answer cards appear below: `1`, `1¼`, `1½`, `2`. "How many half-spool pieces fit along the three-quarter ribbon?"
6. Suppose she taps `1¼` and the bow (a miss). Both halves of the snipped piece pulse beside one full ½-spool piece: "Careful! That little bit is a quarter of the whole spool, not a quarter of the piece. Two of these bits make one half-spool piece, so the bit is half of a piece!"
7. She taps `1½` and the bow: "Yes! One and a half half-spool pieces fit in three quarters of the spool." The gift ties and the round finishes.

## Screen and controls

Scene file `src/games/ribbon-workshop/fit.ts`, using `frameFor(ctx.view)` (`src/games/ribbon-workshop/frame.ts`) and shared drawings from `art.ts`, so it renders identically sideways (1024×768) and upright on a phone (768×1024 / 390×844). All timers and tweens are scene-owned and cleared in `destroy()`.

- **Spool (reference whole, top):** the 560-unit striped bar (`UNIT = 140` logical units per tick) starting at `x0`, labelled `1 whole spool`. Tap repeats the instruction (`ctx.instruct`).
- **Order ribbon and bench (centre):** a ¾-spool (`420`-unit) dashed/tinted target strip starting at `x0`, with an end-mark and tag `¾ spool`. Placed measuring pieces sit end to end on top of it from `x0` (a full ½-spool piece is `280` units wide, labelled `1 piece (½ spool)`; a snipped half-piece is `140` units wide, labelled `½ piece`). Each placed piece's hit area is its full length × `120` logical units tall (`>= 140×120`). A tap returns it to the tray during Tag 1; during Tag 2, tapping the bench only gives a gentle pulse and repeats the unit brackets.
- **Tray (bottom, Tag 1):** uses `trayLayout` with `frame.trayLeft` (clearing the bottom-left guide corner). Each ½-spool piece card is `280×110`, and each snipped half-piece card is `140×110` (`>= 100` on every side).
- **Answer cards (bottom, Tag 2):** four cards (`1`, `1¼`, `1½`, `2`), each `220×110` (arranged in a 2×2 grid starting at `frame.trayLeft` with 16-unit gap, total width `456`, clearing both the pet corner and the right button column in both portrait and landscape). Each card shows the mixed number and a small matching strip icon (`1` full piece, `1` + `¼` of a piece, `1` + `½` of a piece, `2` full pieces) so the visual ratio matches the label.
- **Unit-comparison pulse (on `wrong_unit` Check):** a ghost copy of the snipped half-piece flashes beside the other half of that piece inside a `1 piece` outline for ~1.0 s (scene-owned timing, skippable by any tap, guarded in `destroy()`), showing two half-pieces = one measuring piece.
- **Buttons (right column, `120×120` RoundButtons):** **bow** (Check), **scissors** (Tag 1 only; hidden on Tag 2), and **undo**.

**Input:** ordinary taps through `onTap`, with touch-down feedback. No drag. Every target is at least `110` logical units on its shortest side.

## Accounting, help and finishing

- **Free:** placing, returning, snipping, undo, choosing/changing a Tag-2 card, tapping the spool label to repeat the instruction, and an `empty` Check on either tag.
- **Miss:** a `short` or `long` Check on Tag 1 counts one miss (flashing the gap or overhang); a `wrong` or `wrong_unit` Check on Tag 2 counts one miss.
- **Help:** `GiftTally` tracks misses and hints per tag. After the second miss on a tag, one persistent glow appears on `fitHint`'s target and counts **one hint**. The pause sheet's **Show a hint** shows the same glow and counts one hint unless the glow is already up.
- **Restart:** resets the current tag (on Tag 1 back to two whole ½-spool pieces in the tray; on Tag 2 back to no answer card chosen while keeping the Tag-1 bench). Misses and hints already counted stay.
- **Finish:** after Tag 2 is `right`, calls `ctx.finish({ misses, hints })` with the round's totals. One sticker, also with help. No timer or move counter.

## Rule tests (`logic.test.ts`)

1. **Conservation:** across any sequence of Tag-1 actions, `total(tray) + total(bench) === 4`, no piece ID is duplicated, and `total(bench) <= FIT_CAPACITY`.
2. **Tag-1 verdicts:** `fitJudgeMeasure` returns `empty` on empty bench, `short` for 1–2 ticks, `long` for 4 ticks, and `right` for 3 ticks (`[2, 1]`, `[1, 2]`, `[1, 1, 1]`).
3. **Tag-2 verdicts:** `fitJudgeCount` returns `empty` for `null`, `wrong_unit` for `'1_1/4'`, `wrong` for `'1'` and `'2'`, and `right` for `'1_1/2'`.
4. **Hints lead somewhere:** from every reachable Tag-1 state (including overfull `[2, 2]` and both-snipped), following `fitHint` reaches `right` in at most 5 steps without dead ends; on Tag 2, following `fitHint` reaches `right` in at most 2 steps.
5. **Undo:** undoing after any sequence of Tag-1 or Tag-2 actions restores exact state; Tag-2 undo cannot cross back into Tag 1.
6. **Seeded rounds 0–199:** all four Tag-2 answer cards appear, card orders vary across seeds, and levels 1–3, 6 and 7 produce the same rounds for a seed as before level 8 existed.
7. **Registration & voice:** `LEVELS.school.order` is `[1, 2, 3, 6, 7, 8]`, `LEVELS.grownup.order` is `[6, 7, 8]`, `clampLevel` preserves saved/pinned 1–3, 6, 7, every `ribbon.fit.*` line exists in `voice.ts`, and no `ribbon.fit.*` line calls the residual `¼` of the spool a quotient of `¼`.

## Ghost finger, how-to card, voice and registration

- **Ghost finger (`autotouch`, `touchDemo`):** follows `fitHint` on Tag 1 (place piece, scissors, snip other piece, place half-piece, bow) and Tag 2 (tap `1½` card, bow). Finishes the round unaided.
- **How-to card (`howto.ts`), level 8 only:** goal extension plus `{ from: 8, to: 8 }` steps:
  - Steps: `"Tap a half-spool piece to lay it along the ribbon."`, `"Use the scissors to snip a piece in half."`, `"Tap the bow when the ribbon is filled."`, `"Then pick how many half-spool pieces fit."`
  - Finish: `{ from: 8, to: 8, text: 'Two steps, one sticker.' }`
  - Note: `{ from: 8, to: 8, text: 'Count how many measuring pieces fit: one whole piece and half of another piece is one and a half pieces, not one and a quarter.' }`
- **Off-screen:** appended to the game's line: `"For How Many Pieces Fit?, cut a three-quarter paper strip and measure it with half-strips to see one and a half half-strips fit."`
- **Registration:** `describeLevel(8)`: `"How Many Pieces Fit?: measure a three-quarter ribbon with half-spool pieces, then count one and a half pieces"`. Land, skills, music, icon and sticker unchanged. No journal entry.

### Voice

These lines go in `src/games/ribbon-workshop/voice.ts`. Every line explicitly names its reference unit:

| ID | Line |
| --- | --- |
| `ribbon.fit.ask` | `Here is a three-quarter ribbon. Measure it with these half-spool pieces. Tap pieces onto the ribbon, then tap the bow.` |
| `ribbon.fit.ask2` | `How many half-spool pieces fit along the three-quarter ribbon?` |
| `ribbon.fit.piece` | `One half-spool piece.` |
| `ribbon.fit.halfPiece` | `Half of a piece.` |
| `ribbon.fit.snip` | `Snipped in half! Each bit is half of a piece.` |
| `ribbon.fit.short` | `Not filled yet. There is still space at the end.` |
| `ribbon.fit.long` | `Too long! That piece sticks out past the ribbon. Take it back and snip it in half.` |
| `ribbon.fit.made` | `It fits! One whole piece, and half of another piece.` |
| `ribbon.fit.made.halves` | `It fits! Three half-pieces make one whole piece and half of another piece.` |
| `ribbon.fit.wrongUnit` | `Careful! The leftover bit is a quarter of the whole spool, which is half of a half-spool piece.` |
| `ribbon.fit.wrong` | `Look at the pieces on the ribbon: one whole piece, plus half of another piece.` |
| `ribbon.fit.done` | `Yes! One and a half half-spool pieces fit in three quarters of the spool.` |

Reused as they are: `ribbon.empty`, `ribbon.full`, `ribbon.snip.on`, `ribbon.snip.none`, `ribbon.snip.quarter`, `ribbon.hint`.

## Check tier

The build is a **new interaction on an existing game**: typecheck; unit tests (`npx vitest run src/games/ribbon-workshop src/content/barrels.test.ts src/content/game-docs.test.ts src/content/lands.test.ts` plus upright layout tests in `src/games/upright-catch-up.test.ts`); one filtered scripted play (`BROWSER_SUITE=ribbon` extended with a level 8 case: an empty Check, placing two ½-spool pieces and seeing the `long` miss, returning and snipping, filling Tag 1, tapping `1¼` on Tag 2 to verify `wrong_unit`, then `1½` to finish); one portrait screenshot of Tag 2; and `BROWSER_SUITE=fingerdemo FINGER_ONLY=ribbon-workshop` at level 8. `npm run build` only if shared files change. Do not run the voice-clip renderer here; device speech is the fallback until a `Better voice` pass.

### Expected files

`src/games/ribbon-workshop/{logic.ts, logic.test.ts, index.ts, fit.ts, art.ts, voice.ts, howto.ts}`, `src/games/upright-catch-up.test.ts`, `scripts/browser-check.mjs` (the `ribbon` suite), and at closeout `docs/games/ribbon-workshop.md` (`npm run game-docs`), this file's `**Built:**` line, `docs/deep-dives/subjects/fractions.md`, `docs/STUDY-BACKLOG.md`, `docs/ROADMAP.md`, `docs/READY.md`, and a verification entry.

## Open decisions

Each has a default the build uses. None waits on the developer.

1. **One frozen case (`¾ ÷ ½ = 1½`).** Default: one authored case matching the study's R7 specification. A second division case (such as `⅚ ÷ ⅓` or `⅔ ÷ ½`) waits for its own definition if wanted later.
2. **Allow snipping both pieces (`[1, 1, 1]`).** Default: accepted as equivalent (`total === 3`), consistent with Ribbon Workshop's rule that every equivalent construction is accepted; `fitSolve` prefers snipping only the second piece.
3. **Tag-2 question inside the same level.** Default: Tag 2 asks for the quotient (`1`, `1¼`, `1½`, `2`) right after Tag 1 measures the ribbon, so the `1¼` vs `1½` unit distinction is explicitly faced and explained visually.
4. **Bands.** Default: `school` (`[1, 2, 3, 6, 7, 8]`) and `grownup` (`[6, 7, 8]`), matching Whole Switch and Ribbon Cases.
5. **Source check.** Default: the building session reads every line in the [voice table](#voice) and asserts the unit-language invariant in `logic.test.ts`, per the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules).
