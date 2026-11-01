# Shell Rows, levels 1–3 (definition)

Defined 2026-10-31 as slice SG1 of the [strategy-games study](../deep-dives/subjects/strategy-games.md#build-slices-in-order) ([packet row](../deep-dives/subjects/RECOMMENDATIONS.md#strategy-games-recommendations)), [PR #1062](https://github.com/rjdunlap/neo/pull/1062). The study's leans are adopted under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) ([study](../deep-dives/subjects/strategy-games.md#decisions-for-the-developer)): a new game rather than a Garden Rows or Peg Garden mode (decision 1); Puzzle Peaks, paging rather than shrinking (decision 2); levels 1–3 are one-move puzzles only, no whole match (decision 3); the pet plays the pebbles (decision 5; a grown-up takes them only at level 5); no chess theme (decision 6). Levels 4–5 (SG2) are their own definition after 1–3 are played. One build batch follows ([batch plan](../GAME-BATCHES.md#shell-rows-1-finish-the-row-stop-the-row-win-first)).

**Built 2026-11-01** as batch `shell-rows 1` ([PR #1115](https://github.com/rjdunlap/neo/pull/1115), [checks](../VERIFICATION.md#2026-11-01--shell-rows-levels-13-strategy-games-sg1)). One deviation: shells are set on touch-down through the engine's `onTap`, like every other game, not on lift, so the "slide off before lifting" case does not arise. Yellow is dropped from the shell colours (low contrast on sand). Pool classes recounted by the rule tests: 39, 69, 81.

**Fun action and purpose:** a 3 by 3 grid drawn in wet sand; her shells, the pet's pebbles, a match already under way and her turn. She sets one shell: to finish her own row of three, to stop the pet's row, or, when both are on the board, to win first. A wrong square is answered by the pet's honest reply (*show me why*), then the board rewinds to her turn. Learning goal: *before you move, look at what the rows on the board need, yours and the other player's* (looking one move ahead for herself and for an opponent; Common Core MP1, opened by the study). The rule order follows Crowley and Siegler (1993): children's tic-tac-toe strategies are rule based and rules are added one at a time (abstract listing opened by the study; the rule names *win* and *block* and their order are **recalled**, not read, and stay marked so). No island game has an opponent whose move answers hers: Garden Rows and Peg Garden are solo, Memory Match's face-off shares a board without look-ahead.

## The accounting rule

Stated once and binding on every level:

- **Each position has exactly one right square** (proved for every position in the pool by the rule tests below). Setting the shell there completes the position; the round is three positions.
- **A wrong empty square is one miss.** The shell is set, the pet replies, the deciding row glows and the board rewinds to her turn with the same position. There is no lasting consequence: the wrong move and the reply both lift away.
- **Not counted:** a tap on a square that already holds a shell or a pebble (it wobbles, nothing is placed); a tap during the replay or a rewind (ignored); touching down and sliding off a square before lifting (nothing is set).
- **Help:** after a second miss on one position, the right square glows (one hint). *Show me* (`askForHint`, `hintLabel = 'Show me'`) glows it at once and counts the same single hint; asked again while the glow is on, the ghost finger sets the shell there (the supported finish, still one hint). At most one hint per position.
- **The pet never wins a round and never gloats.** Its win in a replay is a reply to one wrong square and is undone at once; the round always ends on her right square.

## Overlap and reuse

- **Art.** `shell()` from `src/art/shore.ts` draws her shells (two or three swatches from `palette.ts`, seeded per round). Pebbles, the sand grid (finger-drawn grooves with a darker wet edge) and the beach backdrop are drawn in the game's own `art.ts` with `Graphics`; nothing new in shared art. The pet is the corner guide (`ctx.companion()` for its reactions); its pebbles slide in from a little pile at its side of the board.
- **Input.** `onTap` from `src/engine/input.ts` on each square; no drag. Touch-down darkens the square at once (the study's first unsupported action), lifting on the same square sets the shell.
- **Help and the ghost.** As Rule Machine, Paint Mixer and Attic Finds: `askForHint` with a hint label, the glow, the ghost's move on a second ask.
- **Replay.** Scene-owned tweens (`ctx.tw`) for the slide-in, glow and lift; no new engine helper. The minimax and board model are the first pieces the notebook's *Board games against the pet* would share; they stay in this game's `logic.ts` until a second game needs them (no shared helper now).
- No save field, no render texture, nothing kept or filed.

## The model (`logic.ts`)

- **Board.** `Board = readonly Cell[]` of length 9, row by row, `Cell = 'shell' | 'pebble' | null`. `LINES` are the eight rows (three across, three down, two diagonals). `winsFor(board, side)` lists the empty squares that would complete a line for `side`.
- **Reachable positions.** A puzzle position has no completed line, her to move, and a legal count: shells equal pebbles (she went first) or pebbles one more than shells (the pet went first). The whole pool is enumerated at load from the empty board (a few thousand positions; cheap), never hand-typed.
- **Minimax.** `value(board, toMove)` returns +1, 0 or −1 from her side with perfect play, memoised on the board string. It proves the puzzles honest (below) and picks the pet's quiet move when no row is at stake.
- **The pet's reply** `petReply(board, level, target)`: (1) its own winning square if it has one; (2) otherwise a square that stops her row, preferring the level's `target` square (so level 1's reply always takes the gap she was asked to fill); (3) otherwise the first minimax-best square in the order centre, corners, edges. Tested to be minimax-optimal in every reachable position.
- **Symmetry.** Positions are stored as canonical classes under the board's eight symmetries; a drawn position gets a seeded rotation or reflection, so the same class looks different on replay.

| Level | ID | Window | Pool filter (all positions with her to move) | Pool size (classes) | Right square | The named wrong square and the pet's reply |
| --- | --- | --- | --- | --- | --- | --- |
| 1 Finish the row | `finish` | pre-K 1, school 1 | She has exactly one winning square; the pet has none; at most five pieces | 39 | Her winning square (the gap) | Any other square: the pet takes the gap, "I took your spot! Your two shells needed it." |
| 2 Stop the row | `stop` | pre-K 2, school 2 | The pet has exactly one winning square; she has none; at most five pieces; after her block, minimax still gives her at least a draw (no right answer walks into a lost game; 116 positions are dropped for this) | 69 | The pet's winning square | Any other square: the pet sets its third pebble, its row glows, "I got three! Can you stop me?" |
| 3 Win first | `first` | school 3 | She and the pet each have exactly one winning square, and they differ | 81 | Her winning square | The block: the pet stops her row while her winning square shimmers, "You could have had three!" Any other square: the pet wins its row, as at level 2 |

The pool sizes were counted by a throwaway enumeration in the defining session (canonical classes; level 1 at most five pieces has 39 classes of all 68, level 2 has 69 of all 117 after the honesty filter); the build's tests recount them rather than trust these numbers.

- **A round** is three positions from one level. Every round opens on the level's authored position, plain, a straight row or column with no diagonal threat, under a seeded symmetry (the eight symmetries map a row or column to a row or column, never to a diagonal, so the board differs without losing its plainness; the game keeps no round count, so there is no "first round only" rule):

  | Level | Shells | Pebbles | Right | Wrong reply shown |
  | --- | --- | --- | --- | --- |
  | 1 | top-left, top-middle | middle-left, bottom-right | top-right | the pet takes top-right |
  | 2 | centre | bottom-left, bottom-middle (the pet went first) | bottom-right | the pet completes the bottom row |
  | 3 | top-left, top-middle | bottom-left, bottom-middle | top-right | bottom-right blocks: the pet takes top-right; elsewhere: the pet takes bottom-right |

  Positions two and three are drawn by the seeded RNG from the level's pool, two different classes, neither the authored one's class, each with a seeded symmetry.

### Bands and ranges

`BandLevels`: `prek: { min: 1, max: 2 }`, `school: { min: 1, max: 3 }`. No `lap`, `toddler`, `preschool` or `grownup` window and no `order`. School's ceiling of 3 leaves 4 *Two ways to win* and 5 *Play it out* (SG2) to append without renumbering; pins stay valid.

## Screen and controls

- **The board.** Nine squares of 150 with 12-unit grooves: 474 square, inside a 20-unit sand border (514). The board sits right of the pet's corner in landscape and centred above the pet's row in portrait. A small pile of her shells sits at the board's left edge and the pet's pebble pile at its right; both are decoration (`eventMode = 'none'`) so they never steal a tap.
- **Landscape (1024 × 768).** Corner buttons 90, gap 30, board 514, leaving about 130 for insets and the pet's speech. The board's left edge clears the pet's bottom-left zone.
- **Portrait (768 × 1024).** Corner buttons 90, gap 60, board 514 centred, gap 40, then the pet's row: about 704, nothing shrinks. Squares are 150 at the iPad views and never below 100 at the phone-inset views; `layout(view)` returns null rather than shrink one below 100.
- **Feel.** `STYLES.hub` keeps the island's loop. Touch-down darkens the square; the shell settles with a soft pentatonic tap (`src/audio/notes.ts`); a finished row of three shines left to right with a rising three-note step; a pebble lands with a lower tap; a wrong square's reply ends on a gentle boing, never a buzzer. The pet claps on her win and does a surprised hop on her block ("Oh! You saw it!").
- **Replay timing.** Shell settles 0.3 s, pause 0.4 s, the pebble slides from its pile 0.6 s, the deciding row glows 0.8 s while the pet speaks, then the shell and pebble lift away 0.5 s. Reduced motion halves the movement and keeps the glow. Taps are ignored from the set until the rewind ends. The pet's line is awaited through `ctx.say`; the game's own timers are guarded so a destroyed scene stops cleanly.
- **Speech.** `ctx.instruct` states each level's ask and the pet repeats it: "Two shells in a row! Where does the third one go?" / "The pet has two pebbles in a row. Can you stop it?" / "You have two in a row, and so does the pet. What's the best move?" Tapping the pet repeats it. Nothing needs reading.
- **Layout audit.** `layout(view)` is pure and tested at the lands test's views (landscape, portrait, two phone insets): squares at least 100 (150 at the iPad views), nothing under the pet or the corner buttons, no two squares overlapping, the piles not interactive.

## Accounting, help and finishing

| Level | Counts a miss | Counts a hint (at most one per position) | Never counted |
| --- | --- | --- | --- |
| 1 | each wrong empty square | the glow after a second miss on the position, or *Show me* | occupied squares; taps during the replay |
| 2 | each wrong empty square | the same | the same |
| 3 | the block; any other wrong empty square | the same | the same |

- **Spoken reasons** (the pet, after its reply): level 1 "I took your spot! Your two shells needed it."; level 2 and level 3's neither-square "I got three! Can you stop me?"; level 3's block "You could have had three!" Then the instruction again.
- **Finishing.** The third right square ends the round: the row shines, the pet claps, `ctx.finish({ misses, hints })`, one ordinary sticker whether or not help was used. Nothing is kept.
- **Adaptation.** Standard: two smooth rounds step up within the band's window, two struggling rounds step down. Pre-K tops out at level 2. A round finished with the glow or the ghost is one sticker, not evidence that she looks ahead on her own; the game claims she found the square that finishes or stops a row, not that she plans.

## Rule tests (`logic.test.ts`)

- **Board and lines:** `winsFor` agrees with brute force (set the square, test every line) on every reachable position; `LINES` are the eight rows.
- **Minimax:** the empty board's value is 0 (a draw with perfect play); `value` matches a plain unmemoised search on a sample of positions.
- **Pools:** every pool position is reachable (legal counts, no completed line, her to move); each level's filter holds for every position; each pool has at least 20 canonical classes (the defining count was 39, 69 and 81); the authored first positions are in their pools.
- **Exactly one right square:** for every pool position, `rightSquare(level, board)` is the only square the level accepts; at level 3 it differs from the block.
- **Honest replies:** for every pool position and every wrong empty square, `petReply` is legal and minimax-optimal; at level 1 it is the gap; at level 2 and level 3's neither-square it completes the pet's row; at level 3's block it takes her winning square. After a right square at level 2, `value` is at least 0.
- **Rounds:** over 300 seeds per level the same seed gives the same three positions, symmetries and shell colours; the three are different classes; every round starts with the authored position's class, and its symmetry keeps the row straight (never a diagonal).
- **Accounting:** an occupied square and a tap during the replay count nothing; each wrong empty square is one miss; a second miss on one position glows the right square and counts one hint; *Show me* then the ghost counts one hint in all; hints never exceed one per position.
- **Help leads somewhere:** from every position, following the glow (or the ghost's move) is the right square and ends the position.
- **Layout:** `layout(view)` at the four views as above.
- **Registry, lands, how-to and off-screen tests** pass with the new game in Puzzle Peaks (below).

## Ghost finger, how-to card, voice and registration

- **Ghost finger:** `touchDemo: true`, `autotouch()` through the public squares, reading `game.state` and the current layout after every resize; it taps `rightSquare` for each position after the instruction ends and never calls finish.
- **How-to card** (`src/content/howto.ts`). Goal: "Set a shell on the sand to make or stop a row of three." Steps: "Two shells in a row: tap the square that makes three" `{ from: 1, to: 1 }`; "The pet has two pebbles in a row: tap the square that stops it" `{ from: 2, to: 2 }`; "Both have two in a row: take the square that makes your three first" `{ from: 3, to: 3 }`. Finish: "Three puzzles make a round; one sticker." Note: "A wrong square is answered by the pet's move, then the board goes back to her turn; that reply is the lesson."
- **Voice lines** under `sr.*`: `intro`, `instruct.1`–`instruct.3`, `took-spot`, `got-three`, `could-have`, `saw-it`, `three-in-a-row`, `full` (an occupied square, said at most once per position), `look-again`, `done`. `{pet}` optional. "Three in a row" and "stop the row" are plain words; the building session checks them against device speech, and no rule wording claims a source.
- **Registration:** ID `shell-rows`, name "Shell Rows", spoken title `game.shell-rows`, region `puzzle-peaks`, skills `['planning', 'prediction', 'logic']` (names already used in the registry). Bands `['prek', 'school']`. `describeLevel`: 1 "Finish the row: set the third shell", 2 "Stop the row: block the pet's two pebbles", 3 "Win first: make her own row rather than block" (no planning claim). Hub icon: a 3 by 3 sand grid with two shells and a pebble. Sticker: a seeded grid with a shining row of three shells. Music `STYLES.hub`.
- **Home land:** **Puzzle Peaks** (decision 2), beside Secret Code and Garden Rows. It holds 13 today, exactly `LAND_SPOTS`; Rule Machine is queued as its fourteenth, so Shell Rows is its fourteenth or fifteenth. Where they are all visible the land **pages** (under `landPages`, as Story Grove's sixteen already do; nothing shrinks). The build's lands test decides; no text may say "one page". Bubble Beach (the study's sand alternative) is the fallback only if the lands test fails.
- **Co-play:** the grown-up asks before she taps, "What will the pet do if you go there?", and lets the replay answer. **Off-screen:** noughts and crosses on paper or a steamy window; each player says aloud which square they are watching (the study's SG5 table-games card is a later, separate slice).
- **Couch:** none.

## Check tier (for the build)

- **Batch `shell-rows 1` (levels 1–3), new-game tier:** `npm run typecheck`; the rule tests above with the registry, lands, how-to and off-screen tests; one scripted play through a `browser-check.mjs` filter (level 1 with one wrong square, then a second for the glow and its hint, then the right square to the next position; level 3 with the block, then the right square, to its sticker); one portrait screenshot of level 3 mid-replay; `fingerdemo` at levels 1 and 3; `npm run build` because the registry, lands, voice and how-to change. Record the tested commit, filter and server URL.
- Not run in this docs slice: everything but `node scripts/check-links.mjs` and `git diff --check`. Device and person checks open at the build (the study's): does a five-year-old look at the pet's pebbles before setting a shell at level 2, or tap the last empty-looking square; does the *show me why* replay read as a lesson rather than a loss; are "three in a row" and the pet's lines clear in device speech.

## Open decisions

Each has a default the build uses; none blocks the batch.

1. **Pre-K window.** Default: levels 1–2. Level 3's choice between rules is school work (one rule at a time, Crowley and Siegler as recalled); a person check could widen it.
2. **Piece limit.** Default: at most five pieces at levels 1 and 2, any count at level 3. If play shows crowded boards confuse a pre-K child, level 1 could keep to four pieces (30 classes remain).
3. **Diagonals.** Default: diagonals appear from the second position on at every level. If a four-year-old does not see a diagonal row, pre-K positions could exclude diagonal threats; a filter change only.
4. **The level-1 reply.** Default: the pet takes the gap. The study's first wording had "nothing happens"; taking the gap is the honest best move and shows why the gap mattered.
5. **Land.** Default: Puzzle Peaks, paging; fallback Bubble Beach.
