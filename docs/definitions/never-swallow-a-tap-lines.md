# Never swallow a tap: which lines hold (U7d, classification)

*Status: the 25 games ready for upright play (the pool a phone's Today's six draws from first) are classified, read at `origin/main` `a3ac3b70`, 2026-11-10. The other 133 games with an awaited line are listed as candidates, not read. Docs only: nothing here is built.*

This is [R4](never-swallow-a-tap.md#r4-a-tapped-name-never-holds-input)'s list: per game, the spoken lines the game **awaits**, sorted by whether R4 lets them hold input. The rule is R4's: a line that names or answers what she just tapped never holds input; an instruction, a hint after a miss and a step's spoken result may.

## How it was read

- **The search.** In each game folder (tests left out): `await` on `ctx.say`, `ctx.sayIn` or the game's own `say`/`speak` wrapper, and a line with `.then(` chained on it. A line started with `void` holds nothing and is not listed.
- **The reading.** For each awaited line: what was just tapped, whether `busy` (or the game's own gate) is set while it plays, what waits behind it, and the line's words in `voice.ts`.
- **What this is not.** Nothing was played, and nothing was timed. A game whose pacing comes from a tween or a timer rather than a line is outside R4 and not listed.

## The four kinds

| Kind | What it is | R4 |
| --- | --- | --- |
| **Cut** | A tapped thing's name, a right answer's confirmation or a free choice's reaction, awaited with input closed and more of the same board or round behind it | Fix: start the line, reopen input (or start the next ask) at once |
| **Between boards** | Praise for a finished board, awaited before the next board of the same round fades in. Nothing is left to tap, so no tap is swallowed, but she waits out the line (a muted line too) before she can play on | Not R4's case as written; a second, optional batch |
| **Closing** | The round's last line, awaited before `ctx.finish`. The board is done and the result follows | Leave |
| **Held** | An instruction or its companion sentence, a hint after a miss, a demonstration's narration, or a step's spoken result the next step builds on | Leave; R5 shows the hold |

## The games ready for upright play

Six await no line at all: `bubble-pop`, `log-roll`, `marble-jump`, `sing-along-barn`, `size-parade` and `stamp-studio`. Two more, `number-nook` and `pyramid-solitaire`, only chain `ctx.finish` on their closing line (`nook.done`, `pyramid.done`).

| Game | Cut | Between boards | Closing | Held |
| --- | --- | --- | --- | --- |
| `animal-snack` | `snack.yum` after a right friend in *who* rounds (the next ask waits; the feeding rounds already start it with `void`); `snack.full` after the bell on the right count | | `snack.done` | `snack.toomany`, `snack.more` (hints after a miss) |
| `far-lights` | The right answer's line with `busy` set before the next lights: `far.right-brighter`, `far.right-farther`, `far.order-right`, `far.same`, and `far.right-strong`, `far.right-step` through `reveal`. *They carry the lesson ("That one's nearer, so it looks brighter!"), so the fix lets the line play over the next lights rather than dropping it* | | `far.done` | `far.not-bigger` (the walk's result); `far.strong-look`, `far.same-now` (the demonstration's narration) |
| `block-garden` | | `block-garden.done` | (the last garden's `block-garden.done`) | `block-garden.two-lines` (after the instruction, input open) |
| `island-bridges` | | `bridges.joined` | `bridges.done`, `bridges.done-school` | |
| `lantern-lights` | | `lantern.lit` | `lantern.done` | `lantern.pads` (after the instruction) |
| `pond-conga` | | `conga.pond` | `conga.done` | |
| `sudoku-garden` | | `sudoku.bloom` | `sudoku.done` | |
| `word-search` | | `wordsearch.cleared` | `wordsearch.done` | `wordsearch.message` (the hidden message read out, a result) |
| `picture-logic` | | `picture.reveal` ("It is {name}!", then a 1.2 s look) | `picture.done` | |
| `logic-grid` | | `lg.next` | `lg.done` | `lg.solved`, the event line and the `lg.reveal` lines (the mystery's answer, a result); the opening mystery, `lg.slide` and the clues read aloud (input open) |
| `crossword` | | | `cw.done`, `cw.solved`; `cw.spellout` holds only when the word finished the puzzle | `cw.theme` (before the instruction, input open) |
| `hat-band` | | | `hat-band.bow` | `hat-band.intro` (a greeting awaited ahead of the instruction; the hats wake after both) |
| `species-comeback` | | | `comeback.done` | `comeback.intro` (the story's opening, pairing already open); `comeback.hatched` (a result) |
| `brain-break`, `gem-swap`, `tile-pairs`, `snowball-merge` | | | `brain.done`, `gem-swap.done`, `tile-pairs.done`, `snowball.done` | |

**What it comes to.** Two of the 25 hold input on a line R4 says must not: `animal-snack` and `far-lights`. Eight praise a finished board before showing the next. Every other awaited line is a closing line or a proper hold. Day by Day, the pilot, is built ([U7b](never-swallow-a-tap.md#u7b-as-built-2026-11-10)) and is not upright-ready.

## Fix batches

Each is the existing-game bug-fix tier (typecheck, the game's rule tests, one filtered regression play; `fingerdemo` only if the bot's timing changes), and has a line in [READY](../READY.md).

1. **`animal-snack` and `far-lights`, the cut lines.** The right answer's line starts and the next ask or the next lights follow at once (after the existing eat or lift motion, not after the line). The next ask's own line cuts the confirmation, as any new line does; in `far-lights`, where the confirmation is the lesson, the next lights are shown and input opens while it plays. Hints and results stay held.
2. **Between boards, optional.** In the eight games above, the next board's fade starts as the praise starts, so the praise plays over the 0.3 s change. Worth doing only if a phone playtest finds the pause between boards slow: the praise is also the beat in which she looks at the finished board (`picture-logic` adds a 1.2 s look on purpose), so this batch waits for a [playtest note](../OBSERVATIONS.md) rather than being built on the rule alone.

## The other games: candidates, not read

133 more game folders await at least one line (the count of awaited calls follows each name; a high count is a reason to read, not evidence of a held name). They are not in a phone's first pool, so they are read when each game is next worked on, or by the Queued line that classifies them a land at a time:

`adventure-walk` 2, `attic-finds` 12, `beat-builder` 6, `block-topple` 2, `block-tower` 15, `bolt-boards` 2, `bond-beads` 5, `bounce-back` 1, `bouncy-launch` 10, `bumper-garden` 1, `caravan-days` 9, `chain-reaction` 4, `clap-syllables` 11, `clock-tower` 6, `critter-crossing` 6, `critter-sort` 4, `cue-studio` 2, `cut-along` 4, `day-by-day` 14, `domino-run` 10, `dot-link` 1, `draw-the-pattern` 3, `drift-cards` 8, `drops-journey` 5, `duck-pond` 14, `duckling-parade` 4, `egg-catch` 1, `feelings-faces` 8, `ferry-jam` 3, `fill-dump` 3, `fluffy-salon` 5, `food-web-workshop` 4, `forecast-detective` 4, `fossil-dig` 6, `frog-hop` 10, `fruit-slice` 2, `fruit-sums` 4, `gadget-bench` 15, `garden-grow` 8, `garden-rows` 2, `gear-garden` 2, `goodnight-room` 12, `habitat-helpers` 13, `helper-house` 2, `inchworm` 9, `jar-sort` 1, `jelly-drums` 3, `keep-house` 18, `lasso-loops` 13, `lemonade-stand` 11, `letter-trails` 1, `lift-it` 7, `light-lab` 9, `little-conductor` 1, `little-helpers` 7, `look-it-up` 5, `lost-layers` 9, `mail-carrier` 17, `maker-lane` 11, `market-stall` 6, `meadow-pens` 24, `melt-freeze` 3, `monster-munch` 9, `moon-window` 7, `not-always` 11, `notice-board` 10, `number-trails` 11, `opposites` 2, `orchard-rows` 5, `owl-walk` 10, `paint-mixer` 14, `peekaboo-barn` 2, `peekaround-island` 16, `peg-garden` 3, `penguin-slide` 4, `pet-kitchen` 1, `pet-says` 3, `photo-safari` 13, `picture-graph` 20, `pile-match` 2, `pixel-pictures` 4, `playdate-workshop` 1, `pond-typing` 3, `puddle-gobble` 2, `puddle-lens` 5, `puppet-stage` 8, `puzzle-pals` 1, `quick-tricks` 5, `rain-garden` 8, `rainbow-fingers` 5, `ramp-race` 20, `read-do` 22, `relay-woods` 4, `rhyme-time` 19, `river-tablets` 25, `robot-path` 3, `roundup` 13, `rule-machine` 9, `sand-table` 3, `scoop-shop` 5, `sea-lift` 9, `second-chance-shed` 21, `secret-code` 9, `seed-travelers` 1, `seesaw-balance` 16, `sense-detective` 18, `shape-buddies` 3, `shape-sorter` 2, `shell-rows` 4, `sink-float` 18, `sorting-machine` 2, `sound-garden` 10, `spinner-fair` 25, `splish-splash` 1, `sprout-shuffle` 14, `stop-and-go` 1, `story-steps` 11, `story-weaver` 14, `swap-meet` 1, `swing-pals` 14, `teddy-doctor` 17, `thought-bubbles` 8, `tide-line` 2, `timeline-trail` 1, `trackway-tales` 6, `treasure-map` 17, `village-vote` 5, `vine-snip` 2, `water-road` 1, `weather-wardrobe` 2, `who-am-i` 6, `word-glue` 4, `word-monsters` 6.
