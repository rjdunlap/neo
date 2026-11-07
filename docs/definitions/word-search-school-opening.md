# Word Search — a school opening (four picture words)

Definition, 2026-11-04, branch `claude/define-word-search-school`. This is dive slice 5 of the [Word Search dive](../deep-dives/word-search.md#build-slices-in-order) ([younger-band openings](../deep-dives/word-search.md#younger-band-openings)). **Docs only:** no game change, code or device evidence. It settles what the dive left open: the school level and its ID, the picture-word pool and a picture for every word, the land, the 100-unit layout (squares, picture list and buttons), the literacy wording, the accounting under "mistakes teach", the voice, the how-to card, the rule tests, the bot and the check tier.

## Scope and identity

**Fun action.** Find the hidden picture words: a small grid of big letters, four pictures beside it (a cat, a pig, a hen, a fox), and a finger that runs from a word's first letter to its last. A found word gets a coloured band, its picture hops and the word is said.

**Learning purpose.** Reading short words of three and four letters with replayable spoken support: hold a word's letters in mind from its picture and its printed form, then find the same letters in order in the grid. It practises reading short words and matching their letters; **it makes no phonics or decoding claim** (AGENTS: none before a device-speech check, and the words are spoken by device speech until slotted clips, V3).

**Standing rules applied.** S2 ([decision record](../archive/DECISIONS-2026-10-23.md#standing-rules)): `school` stays 6–12, a note gives the age, nothing gates. S8: this definition's leans below are adopted. No factual content: every word is an everyday object or animal already pictured in the island.

**What it is.** `word-search` gains `school` in `bands` (`['school', 'grownup']`) and **one new school level** on the existing interaction (tap first and last letter, or drag along a word in a grid that is all in view). No grown-up level is opened to school: every grown-up grid is 6 by 6 or larger with a full list of plain words and no pictures, and at 8 by 8 a square is at most 75 units (`floor(600 / 8)`) beside the list. Nothing younger than school: under six, matching a printed word letter by letter is a reading task this game cannot support with speech alone.

**Depends on batch word-search 2** (*A small grid to start*, level 5): it brings `order`, `entryLevels` and the 6 by 6 plan's larger square, all of which this level extends. The school build does not start before batch 2 lands.

**Age note.** About 6 and up: four short words across, a picture for each, every word spoken on a tap. In the GAMES entry, the README row and the how-to card's note, never a gate.

## Level and band orders

One plan with **ID 8, the next free ID after every built and queued grown-up level** (5, 6 and 7 are reserved by batches 2–4).

| ID | Name (`PLANS`) | Grid | Words | Directions | Pool |
| --- | --- | --- | --- | --- | --- |
| 8 | A 6 by 6 grid with four picture words, across | 6 by 6 | 4, of three or four letters | across only (`ALL_DIRS.slice(0, 1)`), at most one word in a row | the picture themes below, only |

**IDs never shift.** `planFor` indexes `PLANS[level − 1]` today, so appending a plan before 6 and 7 are built would make it level 6. The build adds an `id` to each `WordPlan` and `planFor` finds by it (falling back to the first plan as now), whether or not batches 3–4 have landed; level 8 is then 8 for good.

```ts
const LEVELS: BandLevels = {
  school: { min: 8, max: 8 },
  grownup: { /* unchanged: batch 2's range and order, which do not list 8 */ },
};
```

`entryLevels` gains 8 (beside batch 2's 5). A school player always plays 8; adaptation has nowhere to move at one level, as at any one-level band. A birthday or pin carrying 8 into grown-up lands on the grown-up order's first level through `landing()` in `src/progress/difficulty.ts` (batch 2's level 5, the small grid, the natural next grid). No grown-up level, plan, name or pin changes. `describeLevel(8)` is the plan's name.

**At most one word in a row** (lean, adopted): the plan gains `oneARow: true`, and `makeGrid` skips a spot in a row that already holds a word. Four words then sit in four of the six rows with filler between them and never run together ("PIGHEN"), so the line she marks has one clear start. A second school level (across and down, five words, crossings) is open, below.

## The picture words

The school level draws only from **`PICTURE_THEMES`**, a list beside `THEMES` in `words.ts`, never from `THEMES`; grown-up plans never draw it. Keeping it out of `THEMES` means `themesFor` and every grown-up seed (the couch trip's boards included) are unchanged. `themesFor(plan)` returns `PICTURE_THEMES` for a plan with `pictures: true` and today's filter otherwise.

| Theme id | Title (said and shown) | Words |
| --- | --- | --- |
| `animals` | Animal friends | CAT, DOG, PIG, HEN, COW, FOX |
| `pond-pictures` | By the pond | FROG, DUCK, LOG, BOAT, NET |
| `outside` | Look outside | SUN, MOON, RAIN, TREE, LEAF, NEST, BEE |

**A picture for every word, reused.** Each picture is `typingPicture(word)` from `src/art/word-pictures.ts` (shared with Pond Typing and Crossword). That function draws every word above: cat, dog, pig, cow and duck as `Critter`s; frog with `frogArt`; hen, fox, net, log, boat, rain and bee as code-drawn `Graphics`; leaf, moon, nest, sun and tree with Letter Trails' `letterPicture` (L, M, N, S, T are leaf, moon, nest, sun and tree in its `WORDS`). Left out of the pool on purpose: **PIP** (the old companion, not a word to read), **BUG** (drawn the same as BEE), **MUD** and **POND** (both a plain ellipse, too alike to tell apart), **HAT** and **CAKE** (no theme to hold them).

**Letter case: capitals** (lean, adopted). The grid is capitals, and the task is matching the same letters in order, so the word under each picture is in capitals too. Whether lowercase would read better for a six-year-old is a person check, not a blocker.

**Fair grids.** Beyond today's rules (every listed word exactly once, no blocked word), a school grid is kept only if **no other picture word, from any picture theme, can be read anywhere** in it, in any of the eight directions: a child who finds a real word she knows is never told it is wrong.

## Land and places

**Home land: stays Lantern Lake**, under the rule the [Island Bridges school opening](island-bridges-school-opening.md#land-and-places) settled, [Lantern Lights](lantern-lights-school-opening.md#land-and-places) followed and [Pond Conga](pond-conga-school-opening.md#land-and-places) adopted: a grown-up game that opens a small level to school keeps its grown-up home. With `school` its lowest band, Lantern Lake shows it to a school player as one of her own games, beside the signpost. Wonder Woods, the school home spot, lists it automatically: `gamesFor(band)` in `src/app/scenes/PlaceScene.ts` takes every game visible at the band and sorts by subject, so it appears with the Story Grove subject (`region: 'story-grove'`), beside Pond Typing and Read & Do (unlike the earlier openings, which are Puzzle Peaks). A full place pages, never shrinks. Explore's All games and the Arcade follow `visibleIn` and need nothing. The comment on `lantern-lake` in `src/content/lands.ts` adds Word Search to the games it names. Its `challenge` stays `words`.

## Layout at 100 units

Today's touch layout (`resizeTouch`) caps a square at 96 and floors it at 64, with a list column 262 wide and buttons 72 high. At 1024 × 768 the grid window is 572 wide, so a 6 by 6 square is `floor(548 / 6)` = 91. At `ctx.band === 'school'`:

- **Squares:** cap 100 and floor 100 (`MIN_TOUCH` and the 96 cap become per-band values; grown-up numbers unchanged).
- **List column (beside):** 210 wide, so the grid window is exactly 624 (600 of squares and the 24 of paper).
- **Picture tiles:** one tile a word, 100 by 100: the picture fitted in the top 64, the word beneath in capitals (28), and a small speaker glyph in the top-right corner as the sign that it speaks. The whole tile is the target.
- **Buttons:** Hint and Start over 100 high; beside, 100 wide each with the label on two lines ("Start / over ↺").

| View | Grid (squares) | List | Picture tiles (100 × 100) | Buttons |
| --- | --- | --- | --- | --- |
| 1024 × 768 (beside) | window x 150–774, y 100–744; paper y 110–734; squares x 162–762, y 122–722 | x 798–1008; title y 112 (26), tally y 144 (20) | two columns, x 798–898 and 908–1008; rows y 170–270 and 280–380 | x 798–898 and 908–1008, y 644–744 |
| 1024 × 1365 (beneath) | window x 24–1000, y 150–786; paper x 200–824, y 156–780; squares x 212–812, y 168–768 | from y 798 (the paper's foot plus 18), x 160; title y 806, tally x 490 | one row, y 846–946, x 160, 272, 384 and 496 (12 apart) | 200 × 100, x 160–360 and 372–572, y 1241–1341 |

The grid starts right of x 150 in landscape and below y 150 in portrait, as today, clear of the home and help buttons; the list and buttons start at x 160 in portrait and at x 798 in landscape, so the bottom-left pet is as clear as it is now. The view is never shorter than 768 nor narrower than 1024 (`computeView`), so wider iPads only widen the window and the grid centres in it; in portrait the list is placed under the grid (not from the bottom), so a taller view leaves room between the tiles and the buttons. The grid is always all in view, so a drag along a word works at school.

**What a tile shows.** Unfound: white with the picture and word. Hinted: the yellow marker, as the list entry has today. Found: tinted in the word's band colour, the word struck through, and the picture hops once (a `ctx.tw` scale pulse).

## Taps, misses and help

The interaction is unchanged: tap a first letter, then a last (a second tap on the same letter lets go; a tap off the line moves the start, free), or drag along the word. A line marked from the last letter back to the first still spells the word (`wordAt` reads either way) and is found.

| What she does | Counts as | Feedback |
| --- | --- | --- |
| A straight line that spells a listed word | found | as built: band, struck tile, `wordsearch.found` ("Fox!"), and the picture hops |
| A straight line that spells no listed word | **one miss** | boing and `wordsearch.miss-school`, **every time** (grown-up says its line once a grid) |
| The second miss in a grid | one miss | as above, and the first letter of the unfound word nearest her last touch rings and its tile turns yellow, with `wordsearch.hint`, **without counting a hint** (the glow after two misses) |
| A crooked mark, letting go, a tap off the line | nothing | as built |
| A tap on a picture tile | nothing | the tile sinks on touch-down and `wordsearch.word` says its word; any time, as often as she likes |
| Hint | one hint | as built (ring, the word named, `wordsearch.hint`) and the word's tile turns yellow |
| Start over | nothing | as built (misses already counted stay counted) |

**Why a wrong line is a miss at school.** She chose a line and checked it: a wrong answer in AGENTS' sense, so a boing, a spoken hint and the glow after two. On a four-word grid four misses is real struggle, so `isStruggle` reads it fairly; with one school level it only affects the round record, never a level change. **The grown-up accounting is unchanged** (no glow, the miss line once a grid).

Every grid finishes: the ring after two misses and the Hint lead to every word, and one sticker comes with every finished round, with or without help.

## Voice (planned IDs, not yet in `voice-script.ts`)

| ID | When | Line |
| --- | --- | --- |
| `wordsearch.go-school` | school only: the first instruction, through `ctx.instruct` so the pet repeats it, instead of `wordsearch.go-touch` | "Find the picture words! Tap a word's first letter, then its last letter. Tap a picture to hear its word." |
| `wordsearch.miss-school` | school only: on each miss | "That is not one of the picture words. Try another line." |
| `wordsearch.word` | school only: a tap on a picture tile | "{word}" (as `rhyme.word`) |

`wordsearch.found`, `wordsearch.hint`, `wordsearch.cleared` and `wordsearch.done` serve as they are; the root-family lines never play at school (`PICTURE_THEMES` have no `root`). `go-school` and `miss-school` are slot-free and render as clips on the next voice-script render; `wordsearch.word`, `found` and `hint` carry `{word}` and use device speech until slotted clips (V3), through the existing `spoken()` (FOX is said "Fox").

## Co-play, off-screen, how-to and bot

- **Co-play:** the existing string, which suits school: one reads the pictures aloud and the other hunts. **Off-screen:** unchanged (hide a few words in a grid on paper); at school a grown-up can draw the pictures beside the words.
- **How-to card:** one school step scoped `from: 8, to: 8`: "The words are pictures beside the grid: tap a picture to hear its word. Every word reads across, from left to right. You can also drag a finger along a word." The general steps (tap first and last letter; Hint and Start over) hold at 8; the scoped grown-up steps (`from: 1, to: 1`, `from: 2, to: 4`, batch 2's level 5) already exclude 8. The `note` adds: "At school (about 6 and up) she plays one small grid of four picture words, each spoken on a tap. It practises reading short words and matching their letters. A line that is not one of the words counts as a miss; after two, the start of a word is ringed for her without counting as help."
- **Sticker:** the existing seeded sticker.
- **Bot:** `autotouch` marks the listed words by their first and last letters, which works unchanged at 100-unit squares on a grid all in view; a demonstration grid keeps today's three words (`ctx.demo`). `fingerdemo` at school level 8 proves it.
- **Couch:** unchanged. `word-search` stays in `COUCH_IDS` with its trip stops (levels 1–3) and the two courses; the couch never sets `ctx.band` to school, and `PICTURE_THEMES` sit outside `THEMES`, so no grown-up seed or frozen grid changes.

## Rule tests the build needs

1. `levels('school')` is `{ min: 8, max: 8 }`; `levels('grownup')` is unchanged and does not list 8; `entryLevels` includes 8; no other band is listed. `planFor(8)` is the school plan whatever plans exist below it.
2. `landing(8, grown-up range, entryLevels)` is the grown-up order's first level.
3. Over 300 seeds, every level-8 grid is 6 by 6 with four words from one picture theme, every word across (left to right), at most one word in a row, each listed word read exactly once, no blocked word, and **no other picture word of any picture theme readable in any direction**.
4. `themesFor` gives only `PICTURE_THEMES` to the school plan and never gives a picture theme to a grown-up plan; every grown-up plan's themes are as before.
5. Every picture-theme word is three or four letters, is in Pond Typing's `PICTURE_WORDS`, and is not PIP, BUG, MUD, POND, HAT or CAKE; no picture word contains another of its theme, forwards or backwards (the existing test extended); every picture theme has at least four words.
6. The existing frozen-course and `course.test.ts` grids still parse unchanged.
7. `registry.test.ts`: the grown-up-only `ids` list (near line 312) drops `word-search` (and `pond-conga` if its school opening has landed first), and a case checks its bands are `['school', 'grownup']`. The lands tests pass with the game in Lantern Lake at school.
8. The three voice lines exist, and the how-to card test passes (no level-relative wording).

A logged 1024 × 768 and 1024 × 1365 check that every square, tile and button is at least 100 (a rule test cannot reach `resize()` without Pixi; the Island Bridges and Lantern Lights builds logged it the same way).

## Settled and open

**Settled here:** one school level, ID 8, 6 by 6, four picture words of three or four letters, across only, one a row; plans keyed by ID so 8 never shifts; after batch word-search 2; three picture themes (eighteen words) drawn from Pond Typing's pictures, outside `THEMES`; capitals; no other picture word readable in a grid; home stays Lantern Lake by the Island Bridges rule, Wonder Woods lists it with the Story Grove subject; 100-unit squares, tiles and buttons with the list beside in landscape and beneath in portrait; a wrong line is a miss with its line every time and the ring after two without counting a hint; a tile tap is free and says the word; reading-with-speech wording and no phonics claim; about 6 and up; couch unchanged.

**Open, not blocking:** a second school level (across and down, five words, crossings) once a person has watched a child play level 8; lowercase letters; more picture themes as more code-drawn pictures exist (each word needs a picture first); the spoken title of the theme at the start of a grid.

## Device and person checks

- Device speech says each of the eighteen words recognisably on the iPad (short words such as FOX, HEN, NET and LOG are the risk); until then the card makes no claim about hearing words.
- Whether a six-year-old starts from the spoken instruction alone, and whether she taps first and last letters or drags.
- Whether the pictures read as the words (the leaf, the net, the nest) without a grown-up naming them.

## Build order and check tier

**After batch word-search 2** (it shares `PLANS`, `LEVELS`, `entryLevels`, `order` and `resizeTouch` with batches 2–4, so whichever lands later rebases; the `lantern-lake` comment and the `registry.test.ts` grown-up list are shared with any other Lantern Lake opening, such as Pond Conga's). **New band entry with a layout change and a new list drawing:** typecheck, the game's rule tests and the registry, lands and how-to tests, one scripted school play of level 8 with one wrong line (hear `wordsearch.miss-school`), a second (the ring and yellow tile appear without counting a hint), a tile tap (the word is said, nothing counted), one Hint, then to the sticker; one portrait screenshot of the grid and its picture tiles; the logged 1024 × 768 and 1024 × 1365 sizes; and `fingerdemo` at school level 8. One build for the voice lines and `lands.ts`. `couchgames` is not needed (the couch path and every grown-up grid are untouched).

Files expected: `src/games/word-search/index.ts`, `logic.ts`, `words.ts`, `logic.test.ts`, `src/games/registry.test.ts`, `src/content/lands.ts` (the comment), `src/content/voice-script.ts`, `src/content/howto.ts`, the README row and `docs/GAMES.md`.
