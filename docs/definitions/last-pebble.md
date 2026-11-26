# Last Pebble, levels 1–2 (definition)

Defined 2026-11-24 as slice **SG3** of the [strategy-games study](../deep-dives/subjects/strategy-games.md#build-slices-in-order) ([packet row](../deep-dives/subjects/RECOMMENDATIONS.md#strategy-games-recommendations)). The study's leans are adopted under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) and the [2026-11-17 record](../archive/DECISIONS-2026-11-17.md#games): a new game (`last-pebble`) rather than extra levels in `shell-rows`, Puzzle Peaks beside Shell Rows with existing land paging (`LAND_SPOTS = 13`, verified by `lands.test.ts`), `upright: true` because it includes the `grownup` band, and an **"about 10 and up"** note on the `school` ladder (never a gate). **Docs only:** no code, voice line, clip or art exists yet. One build batch (`last-pebble 1`, levels 1–2) follows below; levels 3–4 (choosing who goes first, changing the take, and misère "last stone loses") wait for their own follow-up definition (`SG3b`) after levels 1–2.

## What you do

A clear stream separates the near bank from the far bank, with numbered stepping-stone spots `1..T` across the water. She and the pet take turns laying **one or two stones** (`+1` or `+2`) forward along the spots. Whoever lays the stone onto the far-bank spot `T` reaches the far bank and finishes the crossing.

The learning goal is Common Core **MP7** and **MP1** (both opened in the study, along with NRICH's *Got It* teachers' notes): **work backwards from the far bank to find the stepping stones** (`T`, `T - 3`, `T - 6`, …) that force a win no matter whether the other player takes one or two next. Level 1 (*Near the far bank*) gives three short crossings starting close to the end (`rem = 2`, `4` and `5` spots left) so she discovers the `T - 3` stepping stone and sees it work in two turns. Level 2 (*Across the stream*) starts at the near bank (`pos = 0`) on a stream of `T ∈ {7, 8, 10, 11}` spots and plays the full crossing against the pet.

Use stable level IDs `1` and `2`, `bands: ['school', 'grownup']`, `levels(b)` returning `1..2` for both (`order` omitted), `region: 'puzzle-peaks'`, `challenge: 'logic'`, `skills: ['planning', 'logic', 'looking ahead']`, and `upright: true`. Home land **Puzzle Peaks** (`LANDS` in `src/content/lands.ts`, placed directly after `shell-rows`; `puzzle-peaks` already pages at 20 games and `lands.test.ts` checks capacity at every view and band). Classic round contract: level progress and one sticker; nothing is saved per round.

`describeLevel`:
- 1: `"Near the far bank: lay 1 or 2 stones to land on the far bank or three back (about 10 and up)"`
- 2: `"Across the stream: work backwards from the far bank to hit every stepping stone (about 10 and up)"`

## Identity and overlap

- **Shell Rows** (`shell-rows`, Puzzle Peaks) plays one-move 3×3 sand-grid puzzles and whole matches at pre-K and school 1–5. Last Pebble uses a linear stream board (`1..T`), Nim / *Got It* stepping-stone arithmetic, and a `school`-top + `grownup` audience (`about 10 and up`), so it is a new game rather than levels 6–7 of Shell Rows. It reuses Shell Rows' *show me why* replay idea (play the pet's reply, highlight the deciding stone or far bank, then rewind to her turning point) and `src/progress/coach.ts`.
- **Fence the Field** (`fence-the-field`, Lantern Lake) plays 3×3 dots-and-boxes endgames at `grownup` only; no overlap in board or mechanics.
- **Frog Hop** (`frog-hop`, Counting Cove) moves along a number line for addition, subtraction and fractions, with no turn-taking opponent.
- **Not here:** choosing who goes first or second, changing `maxTake` beyond `{1, 2}`, misère (last stone loses), multi-pile Nim, timers, scores/ratings, or lose screens.

## The Nim model (`logic.ts`)

Keep all rules, positions, solver helpers and layout pure in `src/games/last-pebble/logic.ts`:

- **Constants & state.** `MAX_TAKE = 2`, period `STEP = MAX_TAKE + 1 = 3`. A crossing state has `target: number` (`T`), `pos: number` (`0 <= pos <= T`, the highest spot currently holding a stone), and `stones: readonly ('her' | 'pet' | null)[]` of length `T` (spots `1..pos` hold stones; `pos + 1..T` are open water spots).
- **Winning set (stepping stones).** `steppingStones(target, maxTake = 2)` returns all `s` with `1 <= s <= target` and `(target - s) % (maxTake + 1) === 0` in ascending order (e.g., for `T = 10`, `[1, 4, 7, 10]`; for `T = 11`, `[2, 5, 8, 11]`). `isSteppingStone(pos, target, maxTake = 2)` is true iff `(target - pos) % (maxTake + 1) === 0` (meaning `pos` is a cold/winning-to-land-on position: the player who *just moved* onto `pos` holds a forced win, and the player *about to move* from `pos` is lost against best play).
- **Unique winning move.** `bestMove(pos, target, maxTake = 2): 1 | 2 | null`:
  - If `pos >= target` or `isSteppingStone(pos, target, maxTake)`, returns `null` (no winning move exists).
  - Otherwise returns `((target - pos) % (maxTake + 1)) as 1 | 2`, the unique legal move that lands on a stepping stone (`isSteppingStone(pos + d, target, maxTake) === true` and `pos + d <= target`).
- **Legal moves.** `legalMoves(pos, target, maxTake = 2)` returns `[1, 2]` when `target - pos >= 2`, `[1]` when `target - pos === 1`, and `[]` when `pos >= target`.
- **The pet's move.** `petMove(pos, target, seed, maxTake = 2): 1 | 2`:
  - Whenever `bestMove(pos, target, maxTake)` is non-null (`pos` is not a stepping stone), the pet plays `bestMove` (lands on a stepping stone, or reaches `target` immediately when `target - pos <= 2`).
  - Whenever `isSteppingStone(pos, target, maxTake)` is true (she hit a stepping stone, and `pos < target`), the pet has no winning move; `petMove` chooses deterministically from `legalMoves(pos, target, maxTake)` via a hash of `(pos, target, seed)` so both `+1` and `+2` appear across rounds while staying repeatable within a round after a rewind.
- **Turning point (for *show me why* rewinds).** Given `moves: readonly MoveRecord[]` where each record stores `{ player: 'her' | 'pet'; from: number; to: number }`:
  `turningPoint(moves, target, maxTake = 2)` scans backwards through `moves` for the most recent move by `'her'` where `bestMove(m.from, target, maxTake) !== null` and `isSteppingStone(m.to, target, maxTake) === false` (she had a winning move from `m.from` and missed it).
  - **Mathematical guarantee (tested in `logic.test.ts`):** Every crossing starts with `isSteppingStone(startPos, target, maxTake) === false`. Because `petMove` always moves to a stepping stone whenever one is reachable, the pet can reach `target` only if at least one of her moves started off a stepping stone and landed off a stepping stone. Thus `turningPoint` always returns a valid move index whenever the pet reaches `target`.

### Levels 1–2 pools and round structure

| Level | ID | Name | Round structure | Targets `T` and start `pos` |
| --- | --- | --- | --- | --- |
| 1 | `near` | Near the far bank | 3 short crossings in order (`rem = 2`, `4`, `5`) | Crossing 1: `T ∈ {6, 7}`, `pos = T - 2` (`rem = 2`). Crossing 2: `T ∈ {7, 8}`, `pos = T - 4` (`rem = 4`). Crossing 3: `T ∈ {8, 9}`, `pos = T - 5` (`rem = 5`). Seeded initial stones fill `1..pos` alternating `'her'`/`'pet'` ending on `'pet'` so she moves next. |
| 2 | `across` | Across the stream | 1 full crossing from `pos = 0` | `T` sampled from `{7, 8, 10, 11}` (`T % 3 !== 0`, so `0` is never a stepping stone and `bestMove(0, T)` always exists). |

- **Level 1 (`near`) play-out:**
  - **Crossing 1 (`rem = 2`):** Right move `+2` lands on `T` and finishes the crossing. Wrong move `+1` leaves `rem = 1`; the pet lays `+1` onto `T` (*"I reached the far bank! You could jump straight there."*, `lp.could-reach`), `T` glows, and the stream rewinds to `pos = T - 2`.
  - **Crossing 2 (`rem = 4`):** Right move `+1` lands on `T - 3` (stone `T - 3` pulses gently, `lp.good-stone`), the pet plays `+1` or `+2` (from `petMove`), and she lays the remaining `+2` or `+1` to reach `T`. Wrong move `+2` leaves `rem = 2`; the pet lays `+2` onto `T` (*"I reached the far bank! Leave three spots from the end instead."*, `lp.leave-three`), `T` glows, and the stream rewinds to `pos = T - 4`.
  - **Crossing 3 (`rem = 5`):** Right move `+2` lands on `T - 3` (`lp.good-stone`), the pet plays `+1` or `+2`, and she finishes onto `T`. Wrong move `+1` leaves `rem = 4`; the pet lays `+1` onto `T - 3` (*"I took the stepping stone three back! From here, I reach the bank next."*, `lp.took-stone`), stone `T - 3` glows with the pet's paw ring, and the stream rewinds to `pos = T - 5`.
  - If she has already hit `T - 3` on Crossing 2 or 3, the pet played `+1` (leaving `rem = 2`), and she then taps `+1` instead of `+2` on her final turn, the pet plays `+1` onto `T` (`lp.could-reach`) and `turningPoint` rewinds only back to `pos = T - 2` (never undoing her good `T - 3` move).
- **Level 2 (`across`) play-out:**
  - Any legal move (`+1` or `+2`) is laid on the stream immediately without blocking her.
  - The pet answers with `petMove(pos, T, seed)` at a readable pace (~0.5 s).
  - If she lands on `T`, the far bank lantern lights, rising pentatonic notes play across her stones, the pet says *"You reached the far bank!"* (`lp.you-win`), and the round finishes.
  - If the pet lands on `T`, the far bank glows with the pet's paw ring, the pet says *"I reached the far bank! Let us step back to where it turned."* (`lp.got-bank`), and the stream rewinds stone by stone back to `turningPoint(moves).from`.

## Screen, controls and upright layout

- **Layout (`streamLayout(view, target)` in `logic.ts`):**
  - Spots `1..T` are arranged in a continuous winding S-path of **4 columns × up to 3 rows** across the stream (row 0 left-to-right `1..4`, row 1 right-to-left `5..8`, row 2 left-to-right `9..T`), with soft curved water-path connectors between consecutive spots so reading order (`1 -> 2 -> … -> T`) is unmistakable.
  - **Spot size:** `128 × 128` units (`65.0 CSS px` at `390 × 844`, well above the 44-px thumb comfort line and the 100-unit school minimum), `gapX = 28`, `gapY = 44` upright (`36` landscape). Total grid width = `596` units; height = `2 * 128 + gapY` (2 rows for `T <= 8`) or `3 * 128 + 2 * gapY` (3 rows for `T >= 9`).
  - **Upright (`w = 768`, `UPRIGHT_VIEWS` and `short` 375×601):** centered horizontally (`x0 = 86` to `682`), vertically centered in `[210 .. v.h - 180]`, completely clear of the top-left Home/`?` keepout (`x < 115, y < 210`), the bottom-left guide (`x < 150, y > v.h - 170`), and the caption strip.
  - **Landscape (`1024 × 768`, `844 × 390`, notch):** centered horizontally in `[180 .. v.w - 20]` and vertically in `[40 .. v.h - 40]`, completely clear of Home/`?` and the pet's bottom-left corner.
  - **Banks & stones:** near bank sits beside spot `1` (decoration only, `eventMode = 'none'`); far-bank lantern marks spot `T`. Each spot displays its number (`1..T`), subtle ripple rings when it is a legal target (`pos + 1` or `pos + 2`), and once laid holds a stone marked by both colour and icon (a star/shell mark for hers, a paw mark for the pet's) so ownership never relies on colour alone.
- **Controls:**
  - `onTap` (`src/engine/input.ts`) on every spot `1..T` (immediate touch-down darken, stone laid on tap). Tapping `pos + 1` lays 1 stone; tapping `pos + 2` (when `<= T`) lays 2 stones.
  - Tapping a spot `<= pos` or `> pos + 2` wobbles gently, says *"Tap one or two stones ahead!"* (`lp.pick-ahead`, at most once per turn), and counts nothing.
  - Uses the shell's `hintLabel = 'Show me'` and `askForHint()` in the pause sheet (no extra canvas button).
- **Sound and music:** `STYLES.hub` keeps the island's loop; soft stone plink on tap (`src/audio/notes.ts`, rising pentatonic step per stone), lower pebble thud for the pet, gentle boing on a miss replay, chime on reaching `T`.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 1 (`near`) | Each wrong move (`missOnRequest`, triggers *show me why* + rewind) | Glow after 2 misses on one crossing, or `Show me` (`hinted`, max 1 per crossing from misses) | Taps on laid or out-of-reach spots (`<= pos` or `> pos + 2`); taps during pet move or rewind |
| 2 (`across`) | Each pet win at `T` (`missEvery`, triggers *show me why* + rewind to `turningPoint`) | Glow after every 2nd miss (`missEvery`), or `Show me` (`hinted`, max 1 per turn) | Any single legal move on her turn before a pet win; out-of-reach or laid spots; taps during pet move or rewind |

- **Guaranteed helpful hints (`hintTarget`):**
  - If `bestMove(pos, T) !== null`, the hint glows spot `pos + bestMove(pos, T)` and plays `lp.hint-reach` (if `pos + d === T`) or `lp.hint-step` (otherwise).
  - If at Level 2 she asks for `Show me` while already in a losing position (`bestMove(pos, T) === null`), `askForHint()` plays `lp.hint-rewind`, rewinds immediately to `turningPoint(moves).from`, and glows the winning spot there. Thus **following hints from any reachable state always reaches `T` and wins**.
  - Pressing `Show me` a second time while the winning spot is glowing triggers `autotouch()` / ghost tap on that spot (still 1 hint).
- **Finish:** `ctx.finish(tally(t))` when the last crossing reaches `T`, awarding one ordinary sticker whether or not help was used. Standard adaptation via `src/progress/difficulty.ts`.

## Voice, how-to card, ghost finger and co-play

- **Voice (`src/games/last-pebble/voice.ts`, prefix `lp.*`, all static strings so Kokoro can render every clip):**
  `game.last-pebble`, `lp.intro`, `lp.instruct.1`, `lp.instruct.2`, `lp.pick-ahead`, `lp.could-reach`, `lp.leave-three`, `lp.took-stone`, `lp.got-bank`, `lp.good-stone`, `lp.hint-reach`, `lp.hint-step`, `lp.hint-rewind`, `lp.you-win`, `lp.done`. All instructions use `ctx.instruct` (repeated when the pet is tapped); feedback uses `ctx.say`.
- **How-to card (`src/games/last-pebble/howto.ts`):**
  - `goal`: `"Take turns laying one or two stones across the stream to land on the far bank."`
  - `steps`: level 1 `"Tap one or two stones ahead to reach the far bank, or leave three spots at the end."`; level 2 `"Tap one or two stones ahead. Count back in threes from the far bank to find the stepping stones."`
  - `finish`: level 1 `"Three short crossings make a round; one sticker."`; level 2 `"Reach the far bank stone to finish the round; one sticker."`
  - `note`: names `"About 10 and up"`, explains the *show me why* rewind and miss/hint accounting, and states that tapping laid or out-of-reach stones is never counted.
- **Ghost finger:** `touchDemo: true`, `autotouch()` taps spot `pos + bestMove(pos, target)` on her turn (and never calls `finish` directly).
- **Co-play & off-screen:**
  - `coplayHint`: `"About 10 and up. Ask before she taps: count backwards in threes from the far bank—which stone stops the pet from reaching it?"`
  - `offScreen`: `"Line up ten or eleven spoons or pebbles on the table. Take turns picking up one or two; whoever takes the last one wins. Try changing the starting count!"`

## Build batch (`last-pebble 1`, levels 1–2)

One build batch implements `last-pebble` (levels 1–2) using `npm run new-game` ([NEW-GAME.md](../NEW-GAME.md)), registers it in `LANDS` (`puzzle-peaks`, directly after `shell-rows`), updates `src/games/grownup-thumbs.test.ts` and `src/games/registry.test.ts` (upright list), and generates the Kokoro voice clips if applicable.

**Check tier (new-game + new upright `grownup` game):**
- `npm run typecheck`
- Unit tests (`src/games/last-pebble/logic.test.ts`, `upright.test.ts`, `grownup-thumbs.test.ts`, `lands.test.ts`, `registry`, `howto`, `offscreen`, `voice` / `game-docs`):
  - `steppingStones`, `isSteppingStone`, `bestMove` uniqueness & correctness for `T ∈ 6..12`;
  - `petMove` optimality from every non-stepping-stone `pos` and seeded variety on stepping stones;
  - Exhaustive / seeded proof that whenever the pet reaches `T` from any Level 1 crossing or Level 2 stream (`T ∈ {7, 8, 10, 11}`), `turningPoint(moves)` exists and rewinding there restores a position with a valid `bestMove`;
  - Hint walk from every reachable state in Levels 1–2 (including losing states at Level 2 via rewind) always reaches `T` and wins;
  - Coach accounting (`missOnRequest` / `missEvery`, max 1 hint per crossing/turn, out-of-reach / laid / busy taps free);
  - `streamLayout` across all 4 landscape views and `UPRIGHT_VIEWS` (spots `≥ 128` units, `≥ 65 CSS px` at 390×844, no overlap, clear of Home/`?` and guide).
- One filtered scripted browser play (`BROWSER_SUITE=lastpebble` or equivalent) on an upright phone viewport (`390 × 625` / `390 × 844` with captions): Level 1 (one wrong move to verify *show me why* + rewind, second miss for glow, finish 3 crossings to sticker) and Level 2 (miss a stepping stone -> pet wins -> rewind to turning point, then `Show me` / stepping stones to reach `T` and finish); one upright portrait screenshot mid-crossing; `fingerdemo` at levels 1 and 2; `npm run build` (registry, lands, voice, how-to change).

**Follow-up work (not in this batch):**
- **SG3b · Levels 3–5, [defined 2026-11-24](last-pebble-3-5.md):** choose first or second player (NRICH's *"When is it better to go first and when is it better to let the computer go first?"*), variable `maxTake` (`1..3` or `1..4`), and misère (*last stone loses*), in two build batches.

## Source check

- **NRICH, *Got It*, teachers' notes** (opened in the [strategy-games study](../deep-dives/subjects/strategy-games.md#anchors-opened-at-their-source)): ages 7–14; addition/subtraction strategy; stepping stones working back from the target; deciding whether to go first or second (held for `SG3b`).
- **Common Core MP1 & MP7** (opened in the study): planning a solution pathway and discerning structure (`k + 1` stepping-stone spacing).
- Game board, stream theme, levels 1–2 split, *show me why* rewind, and miss/hint accounting are original island design consistent with [Shell Rows](shell-rows.md) and [Shell Rows 4–5](shell-rows-4-5.md).
