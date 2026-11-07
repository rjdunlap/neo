# Crossword, levels 1–6 (definition)

Documentation packet, 2026-11-05, branch `claude/define-crossword`, [PR #1290](https://github.com/rjdunlap/neo/pull/1290), source base `dfd3d4b9`. Queued by the developer the same day ([READY](../READY.md#next-ten)); design notes from the [puzzle-pages study](../deep-dives/subjects/puzzle-pages.md#crossword). Proposed game `crossword`; nothing is registered or implemented. **Docs only; each level's build is its own session**, and that session writes and reviews only its own level's words and clues.

The fun is finishing a little grid where one letter fills two words at once. The learning is spelling a word from its picture, its spoken clue or its written clue, and using a letter that is already there (the crossing) to decide what goes next. It is the sibling of [Word Search](../GAMES.md#word-search): that game finds a word that is already written; this one writes it.

## Identity and overlap

- **Word Monsters** levels 5–6 and 8 drag letters into one word's slots. The crossword adds what only a crossing gives: one letter serves two words, so a square is decided by both its words. Its level 1 blanks *only* the crossing square, so this is the first thing she does.
- **Word Search** shares the themes (`src/learning/words/themes.ts`), the block list (`blocked.ts`), the frozen-grid helpers (`parseGrid`, `rowsOf`) and the school picture words. It keeps finding; the crossword never asks her to search.
- **Pond Typing** owns typing words to a target; the crossword's grown-up keyboard is only the input for its written-clue levels.
- **Not here:** daily puzzles, timers, a mistake cap, cryptic clues, an open dictionary, and a preschool rung (a two-word picture cross with one letter is Word Monsters' job at that age, as the study says).

## Levels

Each level names its own word set, how many words a round draws, the grid and the clue kind. The build session of that level writes the set as data (`src/games/crossword/words-<level>.ts`, or one table per level in `words.ts`) with a test against `BLOCKED`; no session authors another level's words.

| Level | Bands | Word set (written in that level's build) | One round | Clue | Blank squares | Letter bank |
| --- | --- | --- | --- | --- | --- | --- |
| 1 *One letter, two words* | pre-K | The 13 three-letter words of Pond Typing's `PICTURE_WORDS` (hat, cat, dog, pig, hen, cow, bee, net, sun, mud, log, fox, bug); no new art | Three little puzzles: two words crossing at one square, one across and one down, in a grid of at most 4 by 4 including the two clue squares | The picture in the clue square at each word's head, with an arrow; tapping it says the word | Only the crossing square | The right letter and two decoys (3 tiles) |
| 2 *Two crossings* | pre-K, school | The 23 drawn `PICTURE_WORDS` (pip left out), three or four letters | Two puzzles: three words in a chain, two crossing squares, at most 5 by 5 including clue squares | As level 1 | The two crossing squares and each word's first letter | The active word's missing letters and one decoy (at most 4 tiles) |
| 3 *Picture criss-cross* | school | Word Search's three `PICTURE_THEMES` (Animal friends, By the pond, Look outside); one theme a round, named as the title. **As built:** Animal friends and By the pond cannot cross four words in 6 by 6 (exhaustive search: zero layouts), so level 3 widens them with drawn level-2 picture words (animals + duck, frog, bee, bug; pond + pond, mud, bug) | One grid of four words, at most 6 by 6 including clue squares | As level 1 | Every letter square | The active word's missing letters and two decoys (at most 6 tiles) |
| 4 *Say what it is* | school | One authored set of 12–15 picturable words of three to five letters in one or two themes, each with one spoken riddle ("It says moo, and it gives us milk"); a word without a drawn picture gets a code-drawn one in that build. **As built:** 15 already-drawn picture words, no new art and no spoken theme title (cow, pig, hen, duck, cat, dog, fox, frog, bee, sun, moon, rain, tree, boat, cake) | One grid of four or five words, at most 6 by 6 including clue squares (**as built:** four words; five did not fit with this set) | A speaker in the clue square: tap to hear the riddle; **Show me** turns it into the picture (counts one hint) | Every letter square | As level 3 |
| 5 *Written clues* | grown-up | Three of Word Search's everyday themes (about 40 words), each word given one written clue, plain and family-friendly | One free criss-cross of seven or eight words on at most 9 by 9 at 64-unit squares, no clue squares | Written clue in a clue bar above the grid, read aloud on request | Every letter square | An on-screen A–Z keyboard (and a hardware keyboard) |
| 6 *The mini* | grown-up | Six frozen, authored, fully checked 5 by 5 grids, each with its 8–10 written clues | One mini | As level 5 | Every letter square | As level 5 |

- **Ranges (`BandLevels`):** `prek: { min: 1, max: 2 }`, `school: { min: 2, max: 4 }` (level 4 built 2026-11-06), `grownup: { min: 5, max: 6 }` (built 2026-11-06). School starts at 2, one step above pre-K's opening; no lap, toddler or preschool.
- **Generation (levels 1–5):** a seeded placer in `logic.ts` picks the round's words from the level's set and lays them crossing on shared letters (levels 1–4 reserve a clue square at each word's head, before the first letter), rejecting a layout where two words run together, touch side by side without crossing, or any listed or blocked word reads by accident. Level 1's 13 words make 26 crossing pairs, enough for three different puzzles a round.
- **Frozen grids (level 6):** a fully checked mini needs a big dictionary to generate, so its six grids are authored data in `parseGrid`'s row format (`#` a block), checked by tests. A round picks one with the seeded RNG. (As built it does not prefer one not played last.)

## Screen and controls

**Levels 1–4 (touch, children):** a word is **active** when she taps its clue square or one of its squares (tapping a crossing square again switches to the other word). The active word's squares outline at once. Letter tiles in the bank are dragged into its squares with `draggable` (`src/engine/drag.ts`, riding 40 units above the finger, as Word Monsters' letters do); a tile dropped near a blank square snaps to the nearest one, and a square's tile can be dragged back out. Each tile and square says its letter's name on touch-down. Squares and tiles are at least 100 by 100 units.

**Levels 5–6 (grown-ups):** tap a square to select it and its across word; tap it again for the down word. The keyboard (three rows, keys at least 64 units) types into the selected square and moves on; a backspace key clears. A hardware keyboard works the same. Squares are at least 64 units; a 9 by 9 fits beside the clue bar at 1024 by 768.

**Layout plan** (logical units from `view`; the build proves it, these are not screenshot proof): landscape 1024 by 768 keeps the top 140 for the shell and the pet's corner x0–160, y548–768. Grid x180–800, y150–770 at most (6 by 6 at 100 with 4-unit gaps); bank on the right x830–1000 in up to three rows of two 100-unit tiles from y180; Help 120 by 100 at x850–970, y600–700. Portrait 768 by 1024: grid centred at y150–770; bank in two rows of three tiles at x200–540, y790–1004; Help at x600–720, y850–950. Levels 1–2's smaller grids centre in the same box. Every target stays clear of the pet and corner buttons; nothing shrinks to fit.

## Accounting, help and finishing

- **Trying is free.** Moving tiles in, out and between squares is never judged, and nor is a word that is not yet full.
- **A full word is judged.** When the last blank of a word fills, a right word sounds out letter by letter and its clue picture smiles; a crossing square that completes two words at once is judged once. A wrong full word is **one miss** (a soft boing, its wrong tiles hop back to the bank, right letters and right crossings stay) and the pet names what the picture is ("That spells *hut*. The picture is a *hat*."). A decoy that spells another real word is allowed and is still a miss, because the clue decides.
- **After two misses on the same word**, its next right tile and square glow (automatic, not counted as a hint), and the glow never blocks a touch.
- **Help** (the pet or a Help button) places one right letter in the active word, preferring a crossing square, and counts one hint each time. At level 4, Show me also counts one hint.
- **Grown-ups (5–6)** are judged only when every square is filled: a check with any wrong word is **one miss** (whatever the number of wrong words), and the wrong squares get a soft circle and stay editable. Help reveals one letter of the selected word, preferring a crossing, and counts one hint.
- **Adaptation:** a round has several words, so misses add up toward the four-miss struggling threshold; that is intended, since each judged word is an answer. A placement that completes two wrong words at a crossing still counts one miss.
- **Finishing:** the last right word finishes the round with `ctx.finish({ misses, hints })`, once; one sticker, including with help. There is no give-up path to fail; Help can always finish a word.

## Speech (`voice-script.ts`)

Instructions by level (`ctx.instruct`, which the pet repeats): "Which letter fits both words?" / "Fill in the words. One letter is in both." / "Tap a picture, then fill in its word." / "Listen to the riddle, then spell the answer." / "Tap a square and type the answer to its clue." Each picture word, riddle and letter name is a replayable line; misses name the spelled word and the clue's word. Grown-up clues are read aloud on request (`crossword.clue` with a `{clue}` slot), and the grown-up levels never require it. Device speech of a spelled non-word is unchecked until an iPad listen.

## Rule tests (`logic.test.ts`)

Every level's set is free of `BLOCKED` words forwards and backwards, and every word has its clue (picture, riddle or written clue). Every placed word crosses another; no two words run together or sit side by side; no unlisted word or blocked word reads in any across or down run. Every blank can be filled from the bank; the bank holds the right letters plus the stated decoys, and level 1's decoys spell neither word's picture word. A crossing square is judged once. Help's letter is always right, prefers a crossing, and repeated Help finishes any word. **Level 6:** each frozen grid is 5 by 5 with every letter square in an across and a down word of three or more letters (fully checked, no two-letter runs), every run is a word with a clue, blocks are rotationally symmetric, and nothing on `BLOCKED` reads anywhere. Grids fit at every supported view at 100 units (64 for grown-up levels), clear of the pet.

## Ghost finger, how-to card, registration

- **`autotouch()`** taps a clue square, then drags each right tile into its square (levels 1–4), or taps squares and keyboard keys (5–6), through the real controls; it never edits the grid or calls `finish`.
- **How-to card** steps scoped by level: level 1 drag the letter that fits both words; 2 fill the crossing squares and first letters; 3–4 tap a clue, then fill its word (4: listen, or Show me); 5–6 tap a square, type, and the grid checks when full. Grown-up wording names spelling from clues and crossings, with no "brain" or school claim.
- **Registration (default):** ID `crossword`, name "Crossword", spoken title `game.crossword`. Region `story-grove`, Word Search's subject. Skills `['spelling', 'letters', 'vocabulary']`. Home land **Story Grove**, beside Word Monsters and Pond Typing, since its lowest band is pre-K and Lantern Lake is the grown-up land; fallback **Puzzle Peaks**. Both are past `LAND_SPOTS` (13) and page, which the lands contract allows; `lands.test.ts` decides at build. Hub icon: two crossing words of squares with a cat picture at one head. Sticker: a seeded picture in a crossword square.
- **Music:** the land's style stays (she does not make music). **Co-play:** at 1–4 a grown-up says the word slowly while she finds the letters; at 5–6 the grown-up reads a clue and the child drags or types a letter. **Off-screen** (spoken tip): "Think of a word that starts with the last letter of mine."
- **Couch:** none in these builds. A couch version of levels 5–6 (a cursor on the grid and a letter wheel, like Word Search's pad controls) is a later definition; it needs `COUCH_IDS`, `UNLOCK_TIERS`, a catalog entry and a `control()` bot. **Saves:** nothing new.

## Check tier

Each build is new-game tier for its first slice: **levels 1–2 together** (the new game, its placer and the drag interaction; pre-K's whole range), then **level 3**, then **level 4** (riddles and Show me), then **levels 5–6 together** (the grown-up keyboard and frozen minis). The first slice runs typecheck and unit tests (the properties above plus registry, lands and how-to tests), one scripted play through a new `browser-check.mjs` case at levels 1 and 2 with one wrong tile and one Help, one portrait screenshot, `fingerdemo` at 1 and 2, and `npm run build`. Later slices are "new levels on an existing interaction" except 5–6, a new interaction. Device speech of letter names and spelled words, and whether a four-year-old sees that one letter serves two words, stay open for a person.

## What comes next

**Levels 1–2 are built** (2026-11-05, [PR #1294](https://github.com/rjdunlap/neo/pull/1294); [build note](../archive/COMPLETED-2026-10-09.md#crossword-levels-1-2-2026-11-05)) and **level 3 is built** (2026-11-05, [PR #1297](https://github.com/rjdunlap/neo/pull/1297); [build note](../archive/COMPLETED-2026-10-09.md#crossword-level-3-2026-11-05)); **level 4 is built** (2026-11-06, [PR #1300](https://github.com/rjdunlap/neo/pull/1300); [build note](../archive/COMPLETED-2026-10-09.md#crossword-level-4-2026-11-06)); **levels 5–6 are built** (2026-11-06, [PR #1308](https://github.com/rjdunlap/neo/pull/1308); [build note](../archive/COMPLETED-2026-10-09.md#crossword-levels-5-6-2026-11-06)). As built: level 5 is at most 8 by 8 (not 9 by 9) so 64-unit squares and the keyboard fit at 1024 x 768, words may cross more than one placed word, 44 words (farm 14, kitchen 14, garden 16); level 6 minis are koala, toast, haven, trend, limit, opera (10 words each) and a round picks one by the seeded RNG without avoiding the last (no new save field). Open: Animal friends has only 2 distinct four-word sets (pond 3, outside 7); level 4 has about 33 distinct grids per 100 seeds. Later definitions: an upper-school rung (a 5 by 5 with written clues read aloud, at 100-unit squares) and the couch version of levels 5–6.

## Defaults (October 23 standing rules)

Each default stands under the [October 23 standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) unless the developer says otherwise:

1. **Register Crossword** as above (pre-K 1–2, school 2–4, grown-up 5–6), home Story Grove, fallback Puzzle Peaks.
2. **Level 6 uses frozen authored grids**, not generation, because a fully checked mini needs a dictionary the island does not have.
3. **No couch in the first builds**; touch only.
4. **Word sets are written per level**, in that level's build session, as the READY line requires.
