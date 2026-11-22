# Shell Rows, levels 4–5 (definition)

**Built 2026-11-22** as batch `shell-rows 2` (levels 4–5, [PR #2000](https://github.com/rjdunlap/neo/pull/2000)); to build the grown-up seat (batch `shell-rows 3`), read “Build batches”. Correction from the build: the minimax-best, forks-first player (the ghost, Show me) wins 58.3% and ties 41.7%, never losing; the 92.7% below is a win-seeking player (among squares that cannot lose, the best chance of three).

Defined 2026-11-22 as slice SG2 of the [strategy-games study](../deep-dives/subjects/strategy-games.md#build-slices-in-order), from its [ladder](../deep-dives/subjects/strategy-games.md#a-first-games-ladder-shell-rows) row for school and its [slice table](../deep-dives/subjects/strategy-games.md) row SG2 (*Make two rows at once; play a whole gentle match*). The study's slice line said "after 1–3 are played"; the developer admitted Shell Rows 4–5 for definition on the study's leans without waiting for play on [2026-11-17](../archive/DECISIONS-2026-11-17.md#games). It extends the built game ([levels 1–3 definition](shell-rows.md), batch `shell-rows 1`, [PR #1115](https://github.com/rjdunlap/neo/pull/1115)) and keeps its board, art, layout, replay timing, speech rules and accounting unless this page says otherwise. The study's leans hold: whole matches complete on her win or a tie and a pet win replays to the turning point as one miss (decision 3); the pet plays the pebbles, and a grown-up may take them at level 5 only (decision 5), here deferred to a second, small batch. Docs only: no code, voice line, clip or art exists yet.

**Fun action and purpose.** Level 4, *Two ways to win*: a match under way, nobody has two in a row yet, and one square would give her **two** rows of two at once; she sets a shell there, the pet can stop only one, and her next shell makes three. Level 5, *Play it out*: a whole match on an empty board, she sets the first shell and the pet answers every move; the round ends on her three in a row or on a full board with no row (a tie is a good ending). The learning purpose is the study's next step after *win* and *block*: **look for a move that makes two threats at once, and in a whole game keep checking both sides' rows every turn** (looking ahead for herself and the opponent; Common Core MP1, opened by the study). The rule order still follows Crowley and Siegler (1993) as the study recalls it (forks come after win and block); no wording claims more.

## Identity and overlap

Rechecked 2026-11-22 against the catalog and `git log origin/main`: no island game has a fork puzzle or a whole two-sided match on one board. Memory Match's face-off is turn-taking without look-ahead; Garden Rows and Peg Garden are solo. Both levels are the same action as levels 1–3 (tap one square, the pet answers), so they extend Shell Rows rather than start a game. **Last Pebble** (SG3) stays its own definition after level 5 is built; it reuses the replay.

## Bands and ladder

`BandLevels`: `prek: { min: 1, max: 2 }` (unchanged), `school: { min: 1, max: 5 }`. Levels 4 and 5 append above 3 without renumbering, so saves and pins stay valid. No `order`. `grownup` gets no window here (the study's 13+ follow-up is Last Pebble).

| Level | ID | Name (`describeLevel`) | A round |
| --- | --- | --- | --- |
| 4 Two ways to win | `fork` | "Two ways to win: set a shell that makes two rows at once" | Three positions, as levels 1–3 |
| 5 Play it out | `match` | "Play it out: a whole game with the pet; a tie is a good ending" | One whole match |

## Level 4, Two ways to win

**Pool filter** (all reachable positions with her to move, the same enumeration as levels 1–3): neither side has a winning square; at least one square is a **fork square** (setting a shell there gives her two or more winning squares); and every square whose minimax value is a win for her is a fork square. The last clause drops the two classes in which a quieter move also wins by force, because there a "wrong" square would win anyway and no honest reply could show why it was wrong. A throwaway enumeration in the defining session counted **24 canonical classes**: 17 with exactly one fork square and 7 with two or more. The build's tests recount them.

**Right squares (an amendment to the 1–3 accounting rule).** Every fork square is right, and in this pool every fork square wins by force, so accepting them all is honest (the rule's accepted alternatives). `rightSquare(4, b)` returns the first fork square in `PREFERENCE` order for the glow and the ghost; a new `accepts(level, b, i)` answers for every level (one square at 1–3, any fork square at 4) and is what `Score.answer` is given. The "exactly one right square" rule still holds for 1–3. The level-4 pool's floor is 20 classes, as for 1–3.

**The authored first position** (plain rows and columns, no diagonal, under a seeded symmetry as at 1–3): shells top-middle and middle-right, pebbles centre and bottom-middle (she went first). The right square is top-right, which makes the top row and the right column each two shells with a gap. Positions two and three are drawn from the pool as at 1–3: two different classes, neither the authored class.

**The pet's reply to a wrong square** (`petReply` keeps its shape, with one change: when no row is at stake it now prefers, among its minimax-best squares, one of the position's fork squares, then `PREFERENCE`. At levels 1–3 every reply is a win or a block, never a quiet move, so their replies do not change):

| Her wrong square | The pet's reply | What glows | The pet says |
| --- | --- | --- | --- |
| Makes one row of two (48 of the 76 wrong empty squares across the 24 classes) | Blocks that row (forced, so minimax-best) | Her stopped row, as at 1–3 | "I stopped your row! Can you make two rows at once?" (`sr.stopped-one`) |
| Makes no row, and the pet's best move is one of her fork squares (19 of the remaining 28) | Takes that fork square | Her two rows through that square, each with one shell and two empty squares | "I took your best spot! From there you had two rows." (`sr.took-best`) |
| Makes no row, and the pet's best move is elsewhere (9 of 28) | Its minimax-best square | Nothing | "Look for a square that makes two rows at once." (`sr.look-two`) |

The reply never wins for the pet (no pebble threat exists in the pool and her move cannot make one). Every reply is minimax-best, so the existing honesty test stays true at level 4. Then the board rewinds to her turn as at 1–3. `decidingLine` returns `null` for the third kind instead of asserting a line (today's `LINES.find(...)!` would be undefined there).

**Right square:** her shell settles, the two rows of two shimmer, the pet sets one pebble to block one of them (the first in `PREFERENCE`), the pet says "Two ways! I can only stop one." (`sr.two-ways`), and her third shell slides into the other gap on its own as the row shines ("Three in a row!"). The position is complete when her shell lands on a fork square; the follow-through is animation, not a second tap, so a fork is never counted twice and never needs a second answer. Taps during it are ignored.

## Level 5, Play it out

**The match.** An empty board; she sets the first shell (the gentler default, below). The pet answers each shell with `petMove(b, seed)`, a new function separate from `petReply` so the 1–3 optimality tests stay true:

1. its own winning square, if it has one;
2. otherwise a square that stops her row (with two of her rows open, the first in `PREFERENCE`; she then wins);
3. otherwise a **quiet move**: a uniform choice among the empty squares, drawn from a hash of the board and the round's seed, so the same board always gets the same reply within a round (a rewind repeats the same consequence).

That is the handicap: the pet never misses a win or a block but does not plan, so her forks can work. The defining session's model of this pet (a throwaway dynamic program, recounted by the build's tests): when she goes first, best (win-seeking) play wins 92.7% of matches and ties the rest; a child who always takes a win and always blocks but otherwise picks at random wins about 31%, ties about 52% and has the pet win about 17%. With the pet going first those figures are about 17%, 52% and 31%. **She always goes first** (open decision 1).

**Endings.** Her three in a row: the row shines, the pet claps, "You got three!" (`sr.you-win`), and the round finishes. A full board with no row: the board glows softly, "A tie! Nobody got three. That's good playing!" (`sr.tie`), and the round finishes. Both are ordinary completions with one sticker.

**A pet win is a replay, not an ending.** The pet's row glows, "I got three! Let's go back to where it turned." (`sr.go-back`), and the board rewinds to her **turning point**: the most recent of her moves made from a position with a non-losing square (minimax value at least 0) that left the pet a forced win (value −1). Such a move always exists: the empty board is a draw, and only her moves can lower the value (each pet move is at least as good for her as the pet's best). The pieces after it lift away, newest first, at the 1–3 lift timing; she plays on from there. The pet's quiet moves after the rewind come from the same hash, so a repeated mistake meets the same answer.

**Show me at level 5** glows one square for this turn: her winning square if she has one; otherwise a square that stops the pet's row; otherwise her minimax-best square, preferring a fork square, then `PREFERENCE`. If she is already lost (every square is −1), it glows the square that stops the pet's row, if any, else the first in `PREFERENCE` (the board then plays out and rewinds as above). Asked again while the glow is on, the ghost sets that shell.

## Accounting, help and finishing

The 1–3 rule holds, with these level rows:

| Level | Counts a miss | Counts a hint | Never counted |
| --- | --- | --- | --- |
| 4 | each wrong empty square (any of the three reply kinds) | the glow after a second miss on the position, or *Show me*; at most one per position | occupied squares; taps during a reply, a rewind or the fork follow-through |
| 5 | each pet win (one per rewind) | *Show me* on a turn (at most one per turn); after a second pet win in one match, the turning-point turn glows its non-losing square (one hint, at most one per match from this rule) | any quiet move, including one that leaves the pet a forced win it then does not take; occupied squares; taps during the pet's move or a rewind |

A level-5 move is never "wrong" by itself: only the pet's actual three counts, so a loose move the pet does not punish is exploration, not a mistake. Standard adaptation: two smooth rounds (at most one miss, no hints) step up, two struggling rounds (at least four misses or two hints) step down. School tops out at 5. A round finished with the glow or the ghost is one sticker and not evidence of planning; the game claims she set a shell that made two rows, or finished a game, not that she plans ahead.

## Model and rule tests (`logic.ts`, `logic.test.ts`)

New: `LevelId` gains `'fork' | 'match'`; `forkSquares(b)`; `accepts(level, b, i)`; `petMove(b, seed)`; `turningPoint(moves)` over her and the pet's move list; `showMeSquare(b)`. `AUTHORED.fork` as above; `match` has no authored position. Tests:

- **Level 4 pool:** every position reachable, nobody with a winning square, at least one fork square, every minimax-winning square a fork square and every fork square winning; at least 20 classes; the authored position in the pool with top-right its only fork square.
- **Level 4 answers:** `accepts` is true exactly on the fork squares; `rightSquare(4, b)` is one of them; following the glow or the ghost ends the position.
- **Level 4 replies:** for every pool position and wrong empty square, `petReply` is legal and minimax-best; the reply kind matches the table (one row: the block; no row: a fork square when one is among the pet's best); `decidingLine` is the stopped row, the two rows through the taken fork square, or `null`; the pet never completes a row.
- **The 1–3 tests** pass unchanged after `petReply`'s fork preference (no 1–3 pool position has a quiet reply).
- **`petMove`:** over every reachable position with the pet to move, it takes a win when it has one and otherwise blocks when she has a winning square; it is deterministic for a board and seed; over many seeds its quiet moves cover every empty square.
- **Rewind:** for every match the bot loses against `petMove` over 300 seeds (a random rule-following player), the turning point exists, its position has a non-losing square, and the glowed square is one; replaying the glowed square from there never loses by force.
- **Matches:** the minimax-best, forks-first bot (the ghost) never has the pet win and, as built, wins 58.3% and ties 41.7%; the 92.7% belongs to a win-seeking player; the rule-following player's win, tie and loss rates were confirmed at 31%, 51.5% and 17.4%.
- **Accounting:** level 4 as at 1–3 with `accepts`; level 5 counts a miss only on a pet three, at most one hint per turn from *Show me*, and the second-loss glow at most once per match.
- **Layout:** unchanged (`layout`, `upright.test.ts`); level 5's lines are spoken, nothing new on screen.

## Speech, how-to, ghost and registration

- **Instructions** (`ctx.instruct`, repeated by the pet): level 4 "Nobody has two in a row yet. Find a square that makes two rows at once!" (`sr.instruct.4`); level 5 "Let's play a whole game! You go first. Make three in a row, and watch my pebbles too." (`sr.instruct.5`).
- **New voice lines** under `sr.*`: `instruct.4`, `instruct.5`, `stopped-one`, `took-best`, `look-two`, `two-ways`, `you-win`, `tie`, `go-back`, `your-turn` ("Your turn!", said after the pet's level-5 move only when she has not tapped for six seconds, at most once a turn). `sr` is a rendered clip prefix (`scripts/voice-clips/clips.mjs`), so the build renders the new clips with `scripts/voice-clips/render.mjs` and records the size added. "Two rows at once" and "a tie" are plain words; the build listens to them in device speech on the phone.
- **How-to card** (`howto.ts`): steps "Nobody has two in a row: tap the square that makes two rows at once" `{ from: 4, to: 4 }` and "A whole game: you go first; make three, and stop the pet's rows" `{ from: 5, to: 5 }`; finish becomes a list: "Three puzzles make a round; one sticker." `{ to: 4 }`, "A game ends when someone gets three or the sand is full; a tie finishes the round too." `{ from: 5 }`; note adds "At level 5, if the pet gets three, the board goes back to where the game turned." `{ from: 5 }`.
- **Ghost finger** (`autotouch()`): level 4 taps `rightSquare`; level 5 taps her minimax-best square each turn (forks first), which never loses, so the demo ends on a win or a tie and never calls finish.
- **Co-play** (`coplayHint`, unchanged at 1–3): at 4–5 the grown-up asks "Which two rows could you make?" before she taps. **Off-screen:** the existing noughts and crosses card, now with "try to make two rows at once".
- **Sticker, icon, land, music:** unchanged (Puzzle Peaks, `STYLES.hub`); level 5's sticker is the same seeded shining row.

## Build batches

1. **`shell-rows 2` (levels 4–5 with the pet).** Everything above.
2. **`shell-rows 3` (the grown-up seat at level 5; the study's decision 5 and its "Your turn, my turn" co-play role), after batch 1.** On level 5 only, a 100-unit "grown-up plays" toggle beside the pebble pile, usable only before the first shell; when on, the pet steps aside and pebble turns are taps on the same board. Any ending completes the round, a pebble win does not rewind and counts no miss, and *Show me* stays hers. Defined here in outline; the batch confirms the toggle's place in `layout` at the phone views and its accounting before building.

## Check tier

- **Batch `shell-rows 2`, new interaction tier:** `npm run typecheck`; unit tests (the rule tests above, with the difficulty, how-to, registry, lands, clips and `upright.test.ts` walks that read every level); one filtered scripted play with `BROWSER_SUITE=shellrows` on an upright phone viewport, after the suite learns levels 4 and 5 (level 4: one wrong square that makes one row, a second for the glow and its hint, then a fork square to the next position; level 5: one match the suite loses on purpose to see the rewind and its miss, then a tie to the sticker); one upright phone screenshot of level 4 mid-follow-through; `fingerdemo` at 4 and 5; `npm run build` and the offline check, because voice lines and clips are added. Record the tested commit, filter and server URL.
- **Batch `shell-rows 3`:** the same tier, with one level-5 play in grown-up mode.
- **This docs slice:** `node scripts/check-links.mjs` and `git diff --check` only; the counts come from one throwaway script in the session's scratch folder, not committed.

## Open decisions

Each has a default the build uses; none blocks batch 1.

1. **Who goes first at level 5.** Default: she does (the pet wins about 17% of a rule-following child's games rather than 31%). Taking turns by round is a one-line change if play shows she wants it.
2. **The pet's quiet moves.** Default: uniform among empty squares. If wins come too easily or too rarely in phone play, weight the quiet choice toward the pet's minimax-best squares; a `petMove` change only, and the rate tests move with it.
3. **The fork follow-through.** Default: her third shell slides in on its own. If testers want to finish the row themselves, the position could wait for a second tap on the open gap (counted as nothing if wrong).
4. **Pre-K.** Default: pre-K stays at 1–2; forks and whole games are school work.
