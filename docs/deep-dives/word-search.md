# Word Search deep dive

*ID `word-search` · band grown-up · levels 1–4 on 2026-11-01 · session `claude/dive-word-search`, [PR #1104](https://github.com/rjdunlap/neo/pull/1104)*

## The game today

A grid of letters hides the words of a themed list, shown beside it with the theme as the page title ("By the pond"). By touch she (here: the grown-up player) taps a word's first letter, then its last, and the straight line between them is checked; on a grid that is all in view a drag along the word does the same. On the couch the stick moves a cursor and the bottom button marks and checks. A word reads either way. A found word keeps a coloured band, its list entry is struck through, and the word is spoken. What it practises: visual scanning for a held target, spelling as a letter sequence, and vocabulary grouped by theme. Home land Lantern Lake (grown-up, `region: 'story-grove'`); `bands: ['grownup']`.

| Level | Plan (`PLANS` in `logic.ts`) | Band window | What she decides |
| --- | --- | --- | --- |
| 1 | 8 by 8, five words, across and down | grown-up | Where each listed word starts and which way it runs, two directions only |
| 2 | 10 by 10, seven words, slants added | grown-up | As 1, in three directions (right, down, down-right) |
| 3 | 12 by 12, nine words, every direction | grown-up | As 2, and words may read backwards |
| 4 | 14 by 14, twelve words, every direction | grown-up | As 3 on a grid that slides in a window on every view |

`LEVELS` is `{ grownup: { min: 1, max: 4 } }`, with no `order` or `entryLevels`. Every plan has `grids: 1`.

**Content pools.** Nine themes in `words.ts` (pond, garden, kitchen, weather, farm, bakery, sea, woods, cozy evening), 12–16 words each, three to eight letters. A seed picks the theme and the words; `makeGrid` places them longest first (half the time crossing a word already there), redraws only the filler until every listed word occurs exactly once in all eight directions and no word in `blocked.ts` can be read. Couch: a trip stop on levels 1–3 (face-off `twin`), and two frozen puzzle-shelf courses in `course.ts` (*Pond Words*, *The Big Hunt*) with versions.

**What a mistake does.** A checked line that is not a listed word is a miss (spoken once a grid: "That line is not one of the words"); a crooked mark and letting go are free. **Hint** rings the first letter of the unfound word nearest the cursor or last touch, names the word, and slides the grid to show it; it counts as help. **Start over** clears found words; guesses made still count. The couch scores guesses over the number of words.

**Known gaps.**
- `weather` lists both RAIN and RAINBOW. RAIN can be read inside RAINBOW, so a grid that picks both always fails the "exactly once" rule and the generator silently retries; the two never share a grid. No test says a theme word must not contain another (forwards or backwards).
- The smallest grid is 8 by 8 at 64-unit squares. The grown-up research ([IDEAS](../IDEAS.md), the touch and grandparents review) puts older adults' comfortable targets nearer 11–16 mm and asks for a gentler way in; the sibling puzzles' dives each plan one ([Sudoku Garden](sudoku-garden.md)'s 4 by 4, [Picture Logic](picture-logic.md)'s 5 by 5) but Word Search has none.
- Every grid shows its full word list, so the game never asks for recall, only search; a theme title is decoration.
- Found words and hints speak the word through a `{word}` slot (`wordsearch.found`, `wordsearch.hint`), so those lines use device speech until slotted clips (V3).
- Replay varies the theme and positions only; nine themes is a small shelf for a grown-up who plays daily.
- The vocabulary study's first Root Words step, a **root-family theme list** ([VW6](subjects/vocabulary-word-parts.md#build-slices-in-order)), is still unbuilt.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| The classic word search (newspaper and puzzle-book format; [Wikipedia](https://en.wikipedia.org/wiki/Word_search); summary only) | Paper puzzle | Bigger grids, more directions, backwards words, then variants: the list replaced by clues, a hidden message in the unused letters | Leftover letters spelling a message once every word is found; a list given as a theme instead of words | Nothing; it is the source |
| Hidden-message ("hunt") word searches (puzzle-book convention; [JetPunk discussion](https://www.jetpunk.com/message-board/t/hidden-messages-in-word-search), [WorksheetGenius how-to](https://worksheetgenius.com/blog/?p=999); search excerpts only) | Paper puzzle | The message is readable only after the puzzle is solved; more common on denser grids where most letters are used | The message as the ending of a grid, read left to right, top to bottom | Anagrammed leftovers (an extra unscramble step with nothing to check it) |
| *Strands* (The New York Times, 2024; [Today summary](https://www.today.com/today/amp/rcna145619), [TechRadar rules](https://www.techradar.com/computing/websites-apps/nyt-strands); summary only) | Daily app puzzle | No word list: a cryptic theme title; every letter belongs to a theme word; a *spangram* touches two opposite sides; hints are earned by finding non-theme words | A theme with blanks instead of a list; non-theme words that cost nothing; a hint that reveals a theme word's letters | Paths that bend letter to letter (a new interaction, and Letter Pond's idea), the daily streak and share grid |
| *Boggle* (Parker Brothers 1972, Hasbro; [Wikipedia](https://en.wikipedia.org/wiki/Boggle); summary only) | Board game | Bigger trays (4 by 4, 5 by 5, 6 by 6); scoring by word length | — (already the notebook's **Letter Pond**, which needs a reviewed dictionary) | The sand timer; competitive crossing-out |
| Large-print word-search books for adults (e.g. Sterling's *Large Print Word Search Puzzles*, [Hachette listing](https://shop.hachettebookgroup.com/products/large-print-word-search-puzzles-3-9781454968962); listing only) | Paper puzzle | Large type, small grids, fewer directions to start; themes for variety | A small, big-lettered grid as a way in | The "brain boost" claims on their covers |
| Phone word-search apps (category; e.g. Wordscapes' word games; not opened) | Free-to-play app | Levels of growing grids, coins for hints, daily puzzles | Themes by the dozen | Coins, ads, streaks and paid hints |

**What the research says.** Older adults search letter displays more slowly and are more affected by the attentional load of a search than young adults, while accuracy holds up, and a search is easier when letters form words (Madden 1987 and later age and visual-search work, [search summary](https://drepo.sdl.edu.sa/items/044805c5-1047-4b8e-9fe3-28f4f071266e/full); search excerpt only). Searching a display for several remembered targets at once ("hybrid search", which is what a word list asks) appears largely preserved with age ([Wiegand and Wolfe](https://eye.hms.harvard.edu/publications/age-doesnt-matter-much-hybrid-visual-and-memory-search-preserved-older-adults); title and abstract excerpt only). The evidence that word searches improve cognition is weak and mostly promotional; per the project's rules the grown-up wording names what the game asks (finding words, spelling, themes) and never claims a benefit.

## What makes sense here

The one action is a line from a first letter to a last, checked against a list. Depth should keep it: start smaller and bigger-lettered for a newcomer or grandparent, give a reason to finish the last word (a message in the leftovers), and then take the list away so the theme has to be recalled. Every grid stays one round, one sticker, no clock.

The arc on the grown-up band: *A small grid to start* (new entry, ID 5) then the built 1–4, then *A message in the leftovers* (6) and *Just the theme* (7). A school opening (children about 6–8 reading and spelling simple words, with pictures beside the list) is plausible but touches band, land and literacy rules together, so it gets its own definition.

**Handoffs answered.**
- **Root-family theme list** ([vocabulary study](subjects/vocabulary-word-parts.md) VW6 first step, [RECOMMENDATIONS](subjects/RECOMMENDATIONS.md#vocabulary-and-word-parts-recommendations), [IDEAS](../IDEAS.md) *Root Words / 13+*): **in**, in batch 1 as two root themes. Root Words and Root Garden themselves stay sketches under that study's decision 4.
- **More boards per level** (the short-ladder audit's note on the grown-up puzzles, [archive](../archive/IDEAS-SHORT-LADDER-AUDITS-2026-10-09.md)): **in**, as batch 1's new themes.
- **A gentler way in** (the touch and grandparents review, [IDEAS](../IDEAS.md)): **in**, as level 5.
- **Letter Pond** ([IDEAS](../IDEAS.md), roadmap step 10): **out** of this game: bending paths and a dictionary are a different game.
- **Her own word lists** and **typed answers** (roadmap step 10): **out** for now; typing a list needs the grown-ups' page and a reviewed path for arbitrary words through the block list, with no slice asking for it.

## Experience and presentation

- **First unsupported action:** at level 5 the six-by-six grid and four words are all in view at a large size; a newcomer can trace the first word with a finger without being told.
- **Feel:** the first letter lights on touch-down; a right line lays its coloured band and strikes the list entry, a wrong one fades with a boing. Proposed for the message level: as each word is found its letters dim slightly, so the leftovers stand out; on the last word the leftover letters lift one by one in reading order with a rising pentatonic run (one step a letter, from `src/audio/notes.ts`) and the message is spoken.
- **Concrete code-drawn example: stones.** Level 6 needs grid cells that hold no letter: a pale grey rounded square `Graphics` with a darker rim, drawn in the paper layer, that a line cannot pass through. Stones let the generator use only as many open cells as the message has letters.
- **Variety without a new rule:** fifteen or more themes (batch 1), seeded word picks, seeded crossings; at level 6 a message per theme from a small authored set.
- **Reasoning versus motor:** level 5's squares are as large as the view allows (at least 96 units in both orientations, to be measured); a drag stays available where the grid is all in view. Reading the list is part of the game at this band; every found word is spoken.
- **Supported ending:** Hint is always one tap; a grid ends when every word is found; level 7's non-theme lines cost nothing.
- **Co-play:** one reads the list aloud and the other hunts; at level 7 one says theme words they think of and the other looks for them.
- **Person or device:** whether a grandparent finds level 5 comfortable on an iPad held in the lap; whether the message's reveal reads as a reward rather than another task; whether *Just the theme* feels fair without a list (the blanks and their lengths should carry it).

## Proposed ladder

### Fresh content inside existing levels

**Fresh themes and root families** (batch word-search 1, existing-interaction tier):
- Six new everyday themes from plain words of three to eight letters (proposed: *In the orchard*, *Birds*, *At the market*, *The night sky*, *In the toolbox*, *Making music*); each with at least twelve words so every level can draw it. Words reviewed in the building session for plainness, regional spelling (British and American both read; prefer words spelled the same) and the block list.
- Two **root-family themes** for the vocabulary study's VW6: *Words that carry* (Latin *port*: REPORT, SUPPORT, IMPORT, EXPORT, PORTER, DEPORT, PORTABLE) and *Words that look* (Latin *spect*: INSPECT, RESPECT, SUSPECT, EXPECT, PROSPECT, SPECTRUM). Etymologies checked against a dictionary in the building session's ordinary content review; homograph roots (the harbour *port* of AIRPORT) are left out. These lists are shorter than twelve, so a theme gains an eligibility rule: `makeGrids` draws only themes with enough words that fit the plan (root themes play at levels 1–2 and 5). On the first word found in a root theme the pet says the root's meaning once ("*Port* means carry"); a new line, `wordsearch.root`, slot-free per theme.
- Remove RAIN from `weather` (RAINBOW stays; the frozen *Pond Words* course uses RAINBOW and not RAIN, so its version is unchanged).

Rule tests: no theme word contains another of its theme, forwards or backwards; every theme can make a grid for every plan it is eligible for, over a dozen seeds; root themes are drawn only for eligible plans; no theme word contains a blocked word (the existing test extended to the new lists); course grids still parse. Check tier: typecheck, the game's rule tests, one filtered regression play of level 1 with a root theme forced by seed; bot unchanged, no `fingerdemo`; one build for the voice line.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 6 | *A message in the leftovers* | grown-up | An 8 by 8 grid packed with nine words across, down and on a slant; the list shows the words, and below it a row of blanks for the message ("_ _ _ _ _   _ _ _ _"). When the last word is found, the letters no word uses spell a short themed sentence, top row first, left to right ("FROGS SING AT DUSK"); any other open square is a stone, and there are few (at most eight) | A denser search than level 1, now with the message filling in as words are found: the leftover letters can be read early, which is a free clue to where the words are not | As today: a wrong line is a miss, Hint rings and names a word. Reading the message is never checked; it is the grid's ending, spoken | The unused letters in reading order equal the message exactly; stones are never part of a word or the message and number at most eight, so the grid stays a search; every listed word is in the grid once; no blocked word can be read across letters (stones break a line); every authored message passes the block list | `logic.ts`: stones in `letters` (a reserved character), a `messageFor(theme)` set (two or three short sentences per theme, authored), placement that leaves exactly the message's count of open cells by adding stones; `index.ts`: stones, blanks, the reveal; `wordsearch.message` (slotted: device speech); how-to line; bot unchanged (it finds the listed words) |
| 7 | *Just the theme* | grown-up | A 10 by 10 grid with six words in every direction; the list shows only the theme and six blanks with their lengths ("By the pond: _ _ _ _ (4)"). "Find six pond words. I won't tell you which!" | Which words a theme could hold, held in mind while scanning: recall as well as search | A checked line that spells no hidden word is free and spoken as "Not one of the hidden words" (it is an experiment, not a wrong answer); Hint first fills the first letter of the shortest unfound blank, then a second Hint rings its start in the grid, each counted as help. No glow (there are no misses) | No other word of the theme (hidden or not) can be read anywhere in the grid; blanks match the hidden words' lengths; a hint's letter is the right word's first letter; the free-line rule never adds a miss | The blanks in the list, the two-step hint, two voice lines; the couch trip stays on 1–3; the bot finds the hidden words |

Both append IDs 6–7 after 5; `order` becomes `[5, 1, 2, 3, 4, 6, 7]`. The couch trip stays pinned to levels 1–3 and the courses do not change.

### Younger-band openings

**Define Word Search school opening** (docs only; status `define`): a 6 by 6 grid at 100-unit squares with four words of three or four letters, across only, each list entry with a code-drawn picture and a speaker to hear it, for school (about 6–8). The definition must settle the land (the game lives in one land, Lantern Lake, and a land shows her age and younger: either the school band reaches it through Lantern Lake's signpost rules or the game moves, which the lands tests must allow), the literacy wording (practises reading with replayable spoken support; no phonics claim before a device-speech check), a picture for every word in the chosen pool, accounting and the check tier.

### Easier entries and levels between existing ones

**Level 5, *A small grid to start*** (grown-up entry): a 6 by 6 grid, four words of three to six letters, across and down only, at the largest square the view allows (at least 96 units, measured in both orientations), always all in view so a drag works. `order` `[5, 1, 2, 3, 4]` and `entryLevels: [5]`. Rule tests: every word fits, exactly once, across or down only; order and entry tests. The how-to card's drag step covers 1 and 5.

### Left out on purpose

- Bending letter-to-letter paths and dictionary words (Letter Pond's idea and a separate game).
- A clock, a daily puzzle, streaks, or coins for hints.
- Anagrammed messages, and any cover claim that word searches keep a mind young.
- Shaped grids (a fish or a heart outline): cosmetic only; possible later on level 6's stones, written in the notebook rather than queued.

## Decisions for the developer

None. By the [standing rules](../archive/DECISIONS-2026-10-23.md#standing-rules) the leans above are adopted: level 5 as a grown-up entry, levels 6–7 on top, root themes as content after an ordinary review. The school opening is a definition, not a decision.

## Build slices, in order

1. **Fresh themes and root families** (batch word-search 1): above. Existing-interaction tier: typecheck, the game's rule tests, one filtered regression play of level 1 with a root theme forced by seed, one build for the voice line; bot unchanged, no `fingerdemo`.
2. **Level 5, A small grid to start** (batch word-search 2): new level on the existing interaction: typecheck, rule tests including order and entry, one browser play of level 5 with one wrong line and one hint, one portrait and one landscape screenshot (the square size is the point), `fingerdemo` at 5.
3. **Level 6, A message in the leftovers** (batch word-search 3), after batch 2 (its ID follows 5): new-rule tier with a new grid drawing (stones): typecheck, rule tests, one play of level 6 with one wrong line, one hint, then to the message reveal, one portrait screenshot of the revealed message, `fingerdemo` at 6, and `BROWSER_SUITE=couchgames` filtered to Word Search, since `makeGrid` changes.
4. **Level 7, Just the theme** (batch word-search 4), after batch 3: new-interaction tier (the blanks and the two-step hint): typecheck, rule tests, one play of level 7 with a free non-theme line, two hints on one word, then to the sticker, one portrait screenshot of the blanks, `fingerdemo` at 7.
5. *Define:* **Word Search school opening** (docs only; status `define`): above.

## What was built in this session

Nothing: research and ideation only. Checks: Markdown links (`node scripts/check-links.mjs`) and `git diff --check`.
