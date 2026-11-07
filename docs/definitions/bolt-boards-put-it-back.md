# Bolt Boards level 9, *Put it back*: definition

*Game `bolt-boards` · level 9 · school · defined 2026-11-07 on `claude/define-bolt-boards-9` · [deep dive](../deep-dives/bolt-boards.md#build-slices-in-order) slice 3; the build is slice 4*

**Built:** level 9 (PR #1354); the whole file is one level, so read “Boards” for the authored board and “Hint” for the build hint.

Every level so far takes a wall apart. Level 9 is the other half of the physical take-apart toy and of [NGSS 2-PS1-3](https://www.nextgenscience.org/pe/2-ps1-3-matter-and-its-interactions): the boards lie on the woodpile, a picture card shows the finished wall, and she bolts the boards back up. The "on top" rule runs backwards, so the board at the back goes up first. This page fixes the rule, the screen, the accounting, the bot, the voice lines and the tests, so the build session has nothing left to guess. It corrects one claim in the dive. The dive says that from any reachable state the hint is a board whose holes are all open. A probe of the real rules found that false: 28 of the authored board's 64 reachable states cannot be finished, and so does at least one state of every frozen level-3 and level-4 board.

## Bands and ranges

| Band | Today | With level 9 |
| --- | --- | --- |
| school | `{ min: 4, max: 8, order: [4, 5, 8, 6, 7] }` | `{ min: 4, max: 9, order: [4, 5, 8, 6, 7, 9] }` |
| toddler, preschool, pre-K | unchanged | unchanged |

Level 9 is an appended ID, so nothing is renumbered and saved levels and pins keep their meaning. `entryLevels` stays unset. `describeLevel(9)` is `'Put it back'`.

## The rule (`logic.ts`)

**State.** The same `State` as today: bolt `b` is in hole `b` or in the toolbox (−1). A level-9 round starts with every bolt at −1 (`emptyState(p)`), so every board is down on the woodpile. The goal is `startState(p)`: every bolt in its own hole (`built(p, s)`, true when `s[b] === b` for every `b`). Poses come from the existing `pose()`. A board with no bolts in is down, one with one bolt in hangs straight below that bolt, and one with two is pinned level. So the first bolt of a two-bolt board makes it swing up on that bolt, and the second pins it level, the swing of level 4 run backwards.

**Placing a bolt.** `place(p, s, b)` puts bolt `b` into its own hole. It is refused as `'gone'` when `s[b] !== −1` and as `'covered'` when `covered(p, s, b)`, which means a board on a higher layer, in its current pose, lies over the hole. A lower board never blocks, so a front board can go up while the boards behind it are still down. `buildMoves(p, s)` lists the bolts that can be placed now. There is no taking out at level 9: a placed bolt comes back only through undo.

**Why the reverse of a removal is a build (two sentences for the code comment).** Placing bolt `b` changes the pose of its own board only, and `covered(b)` looks only at boards on higher layers, so whether `b` is covered is the same just before and just after it goes in. A build order is therefore legal exactly when its reverse is a legal toolbox removal order (levels 1–5), and the reverse of any removal order of a frozen board is a build of that board.

**Dead ends.** Bolting a front board up before a board behind it can cover a hole that the back board still needs. Once a hole is covered by a pinned board it stays covered, since nothing comes down. `canFinish(p, s)` is a breadth-first search over placements from `s` (`solveBuild(p, s)` returns the shortest list of placements, `[]` when built and `null` when the wall can no longer be finished). With at most eight bolts there are at most 256 states (the probe's largest was 256, a level-4 board), so the search runs after every placement at no visible cost. Every dead state has at least one unplaced bolt that is covered right now. This holds because, when no unplaced bolt is covered, placing the rest from the back layer forward always finishes. So the pet can always name a covering board. The probe checked this on all 2,561 dead states of the authored board and the level-3 and level-4 lists.

**Hint.** `hintBuild(p, s)` gives the first placement of `solveBuild(p, s)`, or `{ undo: true }` when that is `null`. An "open" board is not enough: in the empty state the front board's holes are all open, and bolting it up first is exactly what causes the dead end.

## Boards

`PUZZLES[9]` holds one frozen board, the authored first board, and is written by `scripts/bolt-boards-puzzles.ts` like levels 1, 6 and 8 (it throws if the board fails its checks). Other scenes reuse the frozen lists by reference rather than copying them. The plan row names the lists: `{ id: 9, name: 'Put it back', goal: 'all', holes: false, litHoles: false, coveredMiss: true, scenes: 2, build: [3, 4] }`. Scene 1 draws from `PUZZLES[3]` (3–4 boards, two layers, mostly one bolt each), and scene 2 draws from `PUZZLES[4]` (four boards of two bolts, three layers, with swings). Both are mirrored by seed as today. A session's first level-9 round starts with the authored board in scene 1 (`authoredShown` gains 9; never in a demo).

**The authored first board** (probe-checked against the real `logic.ts`): two small boards with one big board across them.

| Board | Centre, size, layer | Bolts | Note |
| --- | --- | --- | --- |
| 0, small left | (220, 300), 180 × 160, z 1 | (180, 245) and (260, 340) | the first bolt lies under the big board |
| 1, small right | (480, 300), 180 × 160, z 2 | (520, 245) and (440, 340) | the first bolt lies under the big board |
| 2, big | (350, 200), 420 × 160, z 3 | (280, 155) and (420, 155) | covers one hole of each small board |

As built, the small boards' bolts sit at y 254 and 345 (not 245 and 340) so the bolt heads stay on the board and 120 apart; the table's figures below were measured at the original positions and the built board keeps 64 reachable states, 28 dead.

Results: 64 reachable states, 28 of them dead ends. The empty state can be finished. Every pose of every board stays inside the wall. The closest two bolts are 124 apart (the touch circle is 120), and every bolt is at least 57 from its board's centre (`MIN_ARM` is 40). Bolting the big board up first covers both small boards' first holes. That is the lesson, and undo takes it back.

## Screen and layout

- **Wall.** `boardLayout` is unchanged. At level 9 the basket and the toolbox are hidden: there is no fruit or friend behind the boards, and each bolt spins in at its hole. That frees the bottom strip for the woodpile.
- **Woodpile** (`woodpileLayout(v, n)`, n = 3 or 4 boards). It is a row of slots in the bottom strip, from x = `PET_W + 20` to the undo arrow, which moves to `v.w − 90` at level 9. Slots are at least 120 wide and 130 tall, and at most 200 wide, and the row is centred. Measured: in landscape 1024 × 768 and portrait 1024 × 1365 (logical), four slots of 160 at x 220–860; in phone 1662 × 768, slots capped at 200 and centred. Each board is drawn small in its slot (at most half the wall scale, fitted to 150 × 120). A board that is up leaves an empty slot behind, which keeps its place so slots never shift.
- **Picture card** (`cardLayout(v, L)`, 170 × 136 view units, the wall at about a quarter scale on a cream card with a pin at the top). It goes to the right of the wall when at least 190 is free there: landscape x 843–1013, y 130–266, and phone in the right column. Otherwise it goes in the band above the wall when that band is at least 156 tall: portrait x 427–597, y 172–308. Otherwise it goes left of the wall, above the pet corner. The card draws `poses(p, startState(p))`, not the `BoardDef` positions, because most level-3 boards hang rotated from one bolt. Each board that matches its target pose gets a tick of two rounded strokes on its tiny copy. A hanging board that has not yet been pinned gets no tick. The card does not respond to taps.
- **Picked board.** Touching a slot lifts its board a little and outlines it, and only that board's empty holes glow on the wall. An open hole glows; a covered one shows as a dim ring with no glow. Other target holes are not drawn: the picture shows where boards go, and the holes say only where the picked one can be bolted. A board stays picked until all its bolts are in. Picking another slot switches. A board that hangs from one bolt is picked again by tapping its body on the wall.
- **Layout test.** At the four standard views (landscape, portrait, phone, notch) and every level-9 board, mirrored and not: every slot and the card lie inside `view`, below the header (y ≥ 120), clear of the pet corner and of the shell's corner buttons, and off the wall rectangle. Slots do not overlap each other or the undo arrow, and every slot is at least 120 × 130 on screen. Existing pose checks already cover every pose a level-9 state can reach, because each board's pose depends only on its own bolts.

## A round, step by step

1. The wall is empty, the boards lie on the woodpile, and the card shows the finished wall. The pet: `bolt.instruct-build`.
2. She taps a slot. The board lifts and its holes glow. She taps a glowing hole: the ratchet plays downward and the board swings up on that bolt (with `bolt.swing` the first time in a round), or settles level when it is its last bolt.
3. When a placement leaves the wall unable to finish, the board stays up, undo pulses, and the pet names the covering board: `bolt.covers.<color>`. This is not a miss.
4. When every bolt is in, the card's last tick appears, a little bell rings, and `bolt.built` plays. Then comes scene 2 or the finish.

## Misses, hints and glow

- **A tap on a covered hole** of the picked board counts one miss while the wall can still be finished (a hanging board can cover a hole for a while), with `bolt.hole-closed`. At a dead end the same tap is free and repeats `bolt.covers.<color>`, since undo is the answer and the pet has said so.
- **Free:** picking any board, including one whose holes are all covered (it lifts, its holes show dim, nothing is counted); a wrong-order placement; a tap on the wall with nothing picked (the woodpile wobbles); undo. Undo takes back one bolt, the last placement, as often as she likes.
- **Glow after two misses** shows the hint: the slot (or hanging board) to pick, then its hole. It counts one hint, as at every level. At a dead end the hint is the undo pulse with `bolt.covers.<color>` and is not counted, as level 6–7's "Stuck!". There is no wander hint: every build places each bolt exactly once, so there is no par to drift past.
- Adaptation uses misses and hints as today. A dead end she undoes on her own is not a struggle.

## The bot (`autotouch`)

The bot follows `hintBuild` from the current state. If the hinted bolt's board is not picked, it taps that board's slot (or its body on the wall). If the board is picked, it taps the hole. At a dead end it taps undo. The demo starts from the empty wall, so it shows a clean back-to-front build. `fingerdemo` at 9 must finish both scenes.

## Voice lines (`voice-script.ts`)

| ID | Lines |
| --- | --- |
| `bolt.instruct-build` | 'Make the wall look like the picture. Pick a board, then tap its holes.' |
| `bolt.covers.red` … `bolt.covers.orange` (the six board colors) | 'The red board is covering a hole. Let's take it back.' (one per color, as `bolt.on-top.*`) |
| `bolt.built` | 'It looks just like the picture!', 'Just like the picture. What a good builder!' |

Reused: `bolt.swing`, `bolt.hole-closed`, `bolt.hint`. The named board is the topmost up board that lies over some unplaced bolt's hole. `instruction()` gains `case 9: return 'bolt.instruct-build'`.

## How-to card (`howto.ts`)

- **Goal** (one string for every level): 'Take the boards down by their bolts, or bolt them back up to match a picture.'
- **Steps:** add `{ from: 9, to: 9, text: 'Pick a board from the woodpile, then tap its glowing holes. Make the wall look like the picture: the board at the back goes up first.' }`. Extend the existing two-bolts step to `to: 9`. The "waits until that board is gone" step stays at `to: 8`.
- **Finish:** `{ from: 9, to: 9, text: 'The wall matches the picture.' }`.
- **Note:** `{ from: 9, to: 9, text: 'The round arrow takes back the last bolt, as often as you like. Tapping a covered hole counts as a mistake, unless the wall is already stuck.' }`.

## Rule tests (`logic.test.ts`)

- **Reversal.** For every board in `PUZZLES[3]`, `PUZZLES[4]` and `PUZZLES[9]`, mirrored and not, 50 random legal toolbox removal orders reversed are legal `place` sequences that end `built`. Conversely, every random legal build that ends `built`, reversed, is a legal removal order.
- **Buildable.** `solveBuild(p, emptyState(p))` is non-null for every board.
- **The order matters.** Every board has at least one reachable dead end (`canFinish` false), so no level-9 scene can be built in any order.
- **The hint helps.** From every reachable state that can still finish, the hint's placement is legal and keeps it able to finish. From every dead state the hint is `undo`. Since the empty wall can always be finished, repeated undo always gets back to a wall that can.
- **A name for every dead end.** Every reachable dead state has an unplaced bolt that is covered, so `bolt.covers.<color>` always has a board to name.
- **The authored board.** It is `PUZZLES[9][0]`, compared by value. It has two small boards under one big board, and bolting the big board first is a dead end.
- **The search stays cheap.** The largest reachable state count over all level-9 boards is at most 256.
- **Layout** as above. **Registry, how-to and voice:** school's window and `order`, `describeLevel(9)`, level-scoped how-to wording, and every new line ID present.

## Build and check tier (slice 4)

New interaction: typecheck, unit tests (above), one scripted play of level 9 through a `boltboards` filter (both scenes, one covered-hole miss, one glow hint, one dead end undone) with one portrait screenshot showing the woodpile and the card, `fingerdemo` at 9, and `npm run build` since voice, how-to and the puzzle file change. Expected files: `src/games/bolt-boards/{logic.ts,index.ts,logic.test.ts,puzzles.ts}`, `scripts/bolt-boards-puzzles.ts`, `src/content/voice-script.ts`, `src/content/howto.ts`, `scripts/browser-check.mjs` (the level-9 case), and the README row and [GAMES.md](../GAMES.md) entry at closeout.

## Needs a person or device

Whether a six-year-old reads the picture card as "make this" rather than as decoration, and whether "the back goes first" is found without the glow. This joins the game's existing [device check](../DEVICE-CHECKS.md).

## Open decisions

None blocking. Two defaults a reviewer might revisit: there is no taking out at level 9, only undo (taking out is levels 1–8's whole game, and allowing it here makes a tap on a placed bolt ambiguous); and the woodpile hides the holes of unpicked boards, so she plans from the picture, not from the wall.
