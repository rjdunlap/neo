# Puzzle pages: the newspaper and activity-book shelf, as a book that never runs out

**Subject:** `puzzle-pages` · **Audiences:** T, P, K, S, U, M and G, as defined in the [subject tracker](../subjects.md#the-audiences) (L: none, below) · **Requested:** by the developer on 2026-11-05 ("what other newspaper type games we would add … extensive research"), right after the [crossword and logic-grid definitions](../../READY.md#next-ten) were queued · **Researched:** 2026-11-05 · **Session:** `claude/research-puzzle-pages`, [PR #1283](https://github.com/rjdunlap/neo/pull/1283).

**Research and proposals only; nothing here is built.** "Puzzle pages" means the puzzles a newspaper, a puzzle magazine or a children's activity book prints: crosswords and word games, number grids, pencil-logic puzzles, mazes, dot-to-dots, hidden pictures and spot-the-difference. Four parallel research passes covered (1) newspaper and daily-app lineups, (2) children's activity books and what each age can do, (3) pencil-logic and number-grid genres and (4) word puzzles and logic-grid mysteries. Each source below is marked **opened**, **search summary** (a result snippet, page not opened) or **recalled**.

**What the island already has.** It covers more of the puzzle page than it looks: sudoku, nonograms, Hashi bridges, Lights Out, sliding tiles, word search, a Mastermind code, a Zip-style path (Mossy Path), Latin squares (Garden Rows), and notebook rows for about a dozen more genres (the [map below](#on-the-island-today)). It has **no maze**, **no domino puzzle**, **no number-crossing grid** (Kakuro) and **no adjacency-placement puzzle** (Star Battle, Tents). Its word puzzles stop at Word Search and phonics games. The [crossword](../../READY.md#next-ten) and [logic-grid whodunit](../../READY.md#next-ten) definitions queued the same day fill the largest word and deduction gaps.

**Recommendation.** Keep the two queued definitions first and give them this study's [design notes](#design-notes-for-the-two-queued-definitions). Then define, in order:

1. **A maze opening for Mossy Path** (toddler to pre-K, then a school rung). This is the best-evidenced gap: Kumon's maze books step from age 2, and four-year-olds plan one step ahead in a maze while five-year-olds plan two (Völter and Call 2014).
2. **Domino Pond**, after NYT's Pips and Tatham's Dominosa: lay dominoes so each patch meets its sign. It is counting dots at pre-K and sums and inequalities for grown-ups, and any valid placement is accepted.
3. **Bunny Patches**, the notebook's Garden Queens renamed: Star Battle or Queens, one bunny per row, column and patch, none touching. It reaches young children (a beginner version written for pre-K to grade 2) and grown-ups at 8 by 8.
4. **"The bee counts tall flowers"** in Garden Rows (Skyscrapers), already filed by its dive. A primary lesson for ages 6–9 builds it with cubes.
5. **Word Code**, the notebook's Wordle-style sibling of Secret Code: the closest of all to ready, since it reuses Secret Code's feedback and its par rule was decided on 2026-10-23. It is school and grown-up play, so it follows the younger openings.

Every board comes from a seeded generator with a solver in `logic.ts`. **Nothing is daily**: the newspaper's Monday-to-Saturday ramp becomes the level ladder, and the bank never expires.

## Anchors and evidence limits

Standards opened at their source by the research passes, as destinations, not gates:

- **Common Core Mathematics:** [K.CC](https://www.thecorestandards.org/Math/Content/K/CC/) (count on from a given number, K.CC.A.2; count to tell how many, K.CC.B.4–5; compare, K.CC.C.6–7). K.OA, K.G, 1.OA, 1.NBT and 3.OA were opened for the number-grid table: K.OA.A.3 (decompose numbers to 10) for Kakuro runs, 1.OA.C.6 (add within 20), 1.NBT.B.3 (compare with > and <) for inequality grids, and K.G.A.1 (in front of, behind, beside) for Skyscrapers and Tents.
- **Common Core ELA:** [RF.K.2.e](https://www.thecorestandards.org/ELA-Literacy/RF/K/), "Add or substitute individual sounds (phonemes) in simple, one-syllable words to make new words", is an oral skill, so it fits a spoken word ladder. RF.K.3.d (tell similarly spelled words apart by the letters that differ) fits a printed one.
- **Word Building** (McCandliss, Beck, Sandak and Perfetti 2003, *Scientific Studies of Reading* 7(1); PDF **opened**): chains of words one grapheme apart ("progressive minimal contrasts") gave poor decoders aged 7–10 greater gains than a waiting list. The sample was small (24 completed) and these were struggling readers, not typical four-year-olds. It is the best evidence found for any word-ladder-like activity.

Evidence limits, recorded as gaps:

- **No source shows a puzzle type improves executive function or "thinking".** The spatial findings are associations. Jigsaw play at 26–46 months predicted spatial transformation at 54 months (Levine et al. 2012, n = 53, [summary opened](https://www.sciencedaily.com/releases/2012/02/120217101906.htm)). Frequent puzzle, block and board-game play went with higher Block Design scores at 4–7 (Jirout and Newcombe 2015, n = 847, parent-reported, [summary opened](https://www.sciencedaily.com/releases/2015/01/150128131323.htm)).
- **Crosswords:** only small pre/post classroom studies with no control group (e.g. a grade 4 EFL class, [opened](https://elitejournal.org/index.php/ELITE/article/view/152)), and nothing under age 6. Claim practice, not vocabulary gains.
- **Older adults:** a trial in mild cognitive impairment favoured crosswords over computer games (Devanand 2022, **search summary**, with no inactive control). The island's rules forbid brain-training claims in any case, and KenKen's own "training the brain" wording must not be copied ([KenKen](https://en.wikipedia.org/wiki/KenKen), opened).
- **Not found:** 4×4 sudoku norms below school age, dot-to-dot as a task in its own right, spot-the-difference norms before 6, maze planning below 3, and anything on hidden pictures for preschoolers specifically.
- **Publisher age labels are not evidence.** They are reported here as what the books say, and they sometimes conflict (Highlights High Five is labelled 2–6 on one page and 3–5 on another).

## What people can do, by age

| Age | What they can do | Source | Caveat |
| --- | --- | --- | --- |
| 23 months – 2½ | Reason by exclusion (go to the bucket that is not empty); the either-or cups task fails at 2½ | Mody and Carey 2016 ([opened](https://pmc.ncbi.nlm.nih.gov/articles/PMC4939102/)) | A replication found 2½-year-olds above chance (search summary): disputed |
| 3 / 4 / 5 | Pass the same either-or task 58% / 64% / 76% of the time | Mody and Carey 2016 | Whether this is deduction is debated |
| 2–4 | Kumon's *Easy Mazes* (2–4), after its tracing books; *My First Book of Mazes* (3–5) | [Kumon listing](https://www.abebooks.com/9781933241241/Book-Easy-Mazes-Kumon-1933241241/plp), [My First Book of Mazes](https://collinsbooks.com.au/p/activity-books-my-first-book-of-mazes-kumon-ages-3-4-5) (opened) | Publisher labels |
| 39–70 months | Route planning on a touchscreen grid improves with age; nearer goal first on 71% (younger) and 83% (older) of trials | Miyata et al. 2014 ([opened](https://pmc.ncbi.nlm.nih.gov/articles/PMC4270727/)) | n = 29; no year-by-year results |
| 4 vs 5 | In a maze, 4-year-olds plan one step ahead and 5-year-olds two; shifting attention across a sequence of subgoals held them back | Völter and Call 2014 ([opened](https://research-portal.st-andrews.ac.uk/en/publications/younger-apes-and-human-children-plan-their-moves-in-a-maze-task/)) | n = 24 |
| 3–6 / 4–7 / 7+ | Highlights' ladder: *My First Hidden Pictures* 3–6; *Puzzle Buzz* 4–7, the first level; *Puzzlemania* 7+; *Hidden Pictures with Clues* 6–9, *Super Challenge* 8+, so support is taken away as children grow | [Puzzle Buzz](https://shop.highlights.com/puzzle-buzz), [Puzzlemania](https://shop.highlights.com/puzzlemania), [Hidden Pictures series](https://www.penguinrandomhouse.com/series/8HP/highlights-hidden-pictures) (opened) | Publisher labels |
| 3–5 → 5–8 | Dot-to-dot ranges grow 1–25 (3–5), 1–70 (3–5), 1–101 (5–8), 1–150 (pre-K–1) | Kumon, School Zone and Dover listings (search summaries) | Labels only |
| 2–12 | Organised search improves with age, mostly by 12; single-feature search is near ceiling at all ages | Woods et al. 2013 ([opened](https://pmc.ncbi.nlm.nih.gov/articles/PMC3651801)) | Cross-sectional |
| 6–12 | Spotting changes between scenes approaches adult level by 10–12; meaningful objects are found first at every age | Fletcher-Watson et al. 2009 (search summary) | A flicker task, not side-by-side pictures |
| 5–8 | Picture-clue crosswords: K–1 worksheets give the picture and ask only for a missing first sound; picture-clue books are labelled 5–8 | [K5 Learning](https://www.k5learning.com/blog/picture-crosswords-workbook) (opened); Merrell (search summary) | Practice materials, not studies |
| 6–9 | Skyscrapers taught with multilink cubes | [Robertson Program, University of Toronto](https://www.oise.utoronto.ca/robertson/lesson-plans/skyscrapers) (opened) | A lesson plan |
| 4–7 (aimed) | A beginner Star Battle "created with PreK–2nd grade students in mind" | JRMF (search summary; the PDF returned 404); [JRMF all-ages list](https://jrmf.org/puzzle/for-all-ages/) (opened) | Unconfirmed at the source |
| 8–12 | Logic-grid mysteries for children (*Murdle Jr.*, 2024–25); reviews say a first grid often needs a grown-up beside the child | [Murdle](https://en.wikipedia.org/wiki/Murdle) (opened); reviews (search summary) | Publisher label |
| 8–14 | Kids' newspaper puzzle sections (NYT for Kids, *The Week Junior*) | search summaries | Labels only |
| ≤11 | KenKen's youngest tournament division | [KenKen](https://en.wikipedia.org/wiki/KenKen) (opened) | Competition, not a norm |
| Teens and adults | Daily word and logic apps at very large scale (NYT: over 10 million daily players in 2024) | [NYT Games](https://en.wikipedia.org/wiki/The_New_York_Times_Games) (opened) | No age breakdown is published |

**Middle school (M).** No study of what 11–14-year-olds choose among puzzle apps was found (a gap). The adult products are rated 4+ or 13+, and the kids' sections are labelled 8–14, so the island's answer is the same boards as grown-ups at a gentler step: `school`'s top levels until 12, `grownup` from 13. No new band is needed.

## On the island today

How the puzzle page maps onto what exists. "Row" means an [IDEAS](../../IDEAS.md) proposal.

| Puzzle-page genre | On the island | State |
| --- | --- | --- |
| Crossword, mini crossword | `crossword` | [Defined](../../definitions/crossword.md) 2026-11-05; levels 1–4 built by 2026-11-06, levels 5–6 queued; [notes below](#crossword) |
| Logic grid (Murdle, Dell logic problems, zebra puzzle) | `logic-grid` | [Defined](../../definitions/logic-grid.md) 2026-11-05; levels 1–6 built 2026-11-05/06, levels 7–8 queued; [notes below](#logic-grid-whodunit) |
| Word search, themed word search (Strands) | [Word Search](../../GAMES.md#word-search) | Built (grown-up; school opening queued). A Strands-style "theme covers the board" level is a possible later mode |
| Sudoku, mini sudoku, killer sudoku | [Sudoku Garden](../../GAMES.md#sudoku-garden), [Garden Rows](../../GAMES.md#garden-rows) | Built; cage sums (level 10) in READY |
| KenKen / Calcudoku | Sudoku Garden | Proposal: a cage mode with + − × ÷ after level 10 ([garden-rows dive](../garden-rows.md) filed it as a proposal) |
| Futoshiki, Skyscrapers | Garden Rows | Filed as proposals by the [garden-rows dive](../garden-rows.md); Skyscrapers is PP4 here |
| Takuzu / Binairo / Tango | Garden Rows | Row *Two-flower beds*, planned as a later level |
| Nonogram, Mosaic (Fill-a-Pix) | [Picture Logic](../../GAMES.md#picture-logic) | Built; Mosaic would be a mode |
| Hashi (Bridges) | [Island Bridges](../../GAMES.md#island-bridges) | Built |
| Lights Out (Tatham's Flip) | Lantern Lights | Built (couch) |
| Sliding fifteen | Number Nook | Built |
| Mastermind; Wordle; hangman | [Secret Code](../../GAMES.md#secret-code); row *Word Code* | Built; Word Code is an idea with a par rule decided |
| Zip (numbered path through every cell), Numbrix | [Mossy Path](../../GAMES.md#mossy-path) | Built (school 1–3); numbered stones would be a mode |
| **Maze** | none | **Gap**: PP1 |
| Mahjong solitaire; Tiles (layered pairs) | Tile Pairs | Built; a layered-attribute mode is a later idea |
| Star Battle / Queens | row *Garden Queens* | Idea; PP3 here, renamed |
| Nurikabe, Shikaku (LinkedIn's Patches), Light Up | rows *Islands and Sea*, *Pen Planner*, *Lamp Lighter* | Ideas |
| Minesweeper (no-guess) | row *Garden Sweep* | Idea |
| Net (rotate pipes) | row *Puddle Pipes* | Idea (younger form) |
| Connections, Pinpoint | row *Sort Four* (picture form) | Idea, already second in its section's order |
| Spelling Bee, word wheel, Letter Boxed, Jumble | row *Letter Pond* (three modes on one reviewed list) | Idea |
| Cryptogram, Codeword | row *Decoder Ring* | Idea |
| Word ladder (Doublets, Crossclimb) | [Word Monsters](../word-monsters.md) level 16 *Change one sound* and grown-up G1 | Planned in its dive |
| Dot-to-dot | Draw the Pattern level 10 *Dot to dot* (READY, queued); row *Star Dots* (number order) | Queued / idea |
| Spot the difference | Photo Safari's *What changed?* (built); row *Photo Hunt* (grown-up) | Covered for children |
| Hidden pictures | rows *Critter Spotter*, *Hidden Pond* | Ideas; Photo Safari covers "find the named one" |
| **Domino puzzles** (Pips, Dominosa) | none (Domino Run is toppling, not placement) | **Gap**: PP2 |
| **Kakuro** (cross sums) | none (Fruit Sums makes one sum from two fruit) | **Gap**: PP5 |
| **Tents** | none | **Gap**: PP6 |
| **What's wrong? (absurd scene)** | none | **Gap**: PP7 |

## Similar games, apps and books

| Source | Kind | How it grows | Borrow | Leave out |
| --- | --- | --- | --- | --- |
| NYT Games ([opened](https://en.wikipedia.org/wiki/The_New_York_Times_Games); [Letter Boxed](https://thenewyorktimeshelpcenter.helpjuice.com/28527193547028-Letter-Boxed) and [Tiles](https://thenewyorktimeshelpcenter.helpjuice.com/360029050872-Tiles) help pages opened) | Daily word and logic app | Crossword gets harder Monday to Saturday; Mini 5×5 (7×7 Saturday), Midi 9–11, daily 15×15. Spelling Bee ranks are shares of the day's maximum. Connections colour tiers; Pips Easy, Medium and Hard | The weekday ramp as a level ladder; praise bands with a Done at any rank; Tiles' endless calm mode | Daily expiry, streaks, the paywall, Connections' four-mistake cap, timers |
| LinkedIn Games ([help page opened](https://www.linkedin.com/help/linkedin/answer/a6863543); [GamesBeat on Patches](https://gamesbeat.com/how-linkedins-new-game-patches-demonstrates-its-shift-away-from-word-games/) opened) | Daily logic and word | Patches ramps Monday to Sunday | Queens, Zip and Patches as small solver-checked boards; its reason for moving to logic games: word games are hard to localise "across 20, 30 or 40 different languages" | Streaks, leaderboards, retention metrics (86% return the next day) |
| Puzzmo ([App Store listing opened](https://apps.apple.com/us/app/-/id6714482734)) | Daily puzzle suite | Per-game difficulty; an optional easier hint per crossword clue | The softer hint per clue | Paid archive, leaderboards, clubs |
| The Times and Guardian puzzle pages (sites blocked; the Times app listing opened; [Word polygon](https://en.wikipedia.org/wiki/Word_polygon) opened) | Newspaper | Polygon grows from 7 letters (Monday) to 10 (Saturday) with three praise targets | Letter count as the level step; "good, very good, excellent" | Two-week archive limits |
| Penny Dell and Dell magazines ([opened](https://www.pennydellpuzzles.com/)); Dell logic problems rated 1 to 5 stars (search summary) | Puzzle magazines and books | Star ratings across a book | A bound "book" in a fixed easy-to-hard order: the island's model | Nothing particular |
| [Simon Tatham's Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/) and [his guide to writing a puzzle](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/devel/writing.html) (opened) | 40 logic genres, each with a generator | Size and a difficulty setting graded by the deduction techniques the solver needs | The generator pattern: a solver inside the generator ensures one solution; capping difficulty is easy, guaranteeing it is harder. MIT licence, so ported code keeps the notice | Its hardest Solo level needs guessing |
| Highlights (above) | Children's magazines and books | Support is taken away: picture key and clues, then names only, then none | Remove a support per rung, not add speed | Tiny disguised objects in crowded black-and-white scenes |
| Kumon maze and number books (above) | Activity books | Tracing → easy mazes → mazes → intricate mazes; dot ranges 1–25 → 1–150 | The wide-corridor first maze | Scoring wall touches (the Porteus test does, [opened](https://en.wikipedia.org/wiki/Porteus_Maze_test)) |
| *Murdle* ([Vol. 1 preview opened](https://profilebooks.com/wp-content/uploads/wpallimport/files/PDFs/9781800818026_preview.pdf)) | Logic-grid mystery books | Elementary (3 suspects × 3 weapons × 3 places), then more categories, motives and witness statements | Picture cards that clues point through; a final event clue; cross out a known pairing's row and column | Murder, a speed challenge, "the killer always lies" for children |
| Rasinski's *Daily Word Ladders* (listing opened; sheets search summary) | Classroom books, K–6 | Grade bands; "change one letter" rungs with a spoken or written clue | A clue on each rung | Claims beyond the publisher's |
| Spark AI Games ([reviewed 2026-11-10](../../SPARK-AI-GAMES.md): all 202 game pages read, eight first boards played at phone size) | Free browser portal; 40 puzzle games on one template | A Journey of levels where each world adds one twist; a Queens game opens with a 12-step lesson on a 5 by 5 board | The rule as three chips above the board all through play; a crossword of sums (Sumgrid) and pair paths (Dotline) as genres this study lacks; solver-checked boards, hints that explain, free undo as stated promises | Daily streaks, Rush clocks, leaderboards, coins, hearts, hints that cost a star; its code, art and levels |

Unplugged equivalents: drawing a maze for each other, dominoes on a table, a word ladder said aloud in the car, *I spy* in a picture book.

## The daily format, and what replaces it

The newspaper format is built on one puzzle a day, a streak and tomorrow's answer. The island forbids streaks, and nothing in it gates, expires or rotates, so none of that comes across. What replaces it:

- **A book, not a day.** Each game's levels are seeded boards in a fixed easy-to-hard order: the crossword's Monday-to-Saturday ramp, Polygon's 7-to-10 letters and Dell's 1-to-5 stars all become level steps. A round is always available and never goes away.
- **Unlimited tries.** Attempt caps (Wordle's six, Connections' four) become unlimited tries with the usual spoken hint and a glow after two misses.
- **Open-ended word games** (honeycomb, word wheel) get a Done at any praise band. Nothing chases the maximum.
- **An optional endless calm mode** where a genre suits it, after Tiles' Zen mode.
- **Grown-up par** stays the island's existing rule: a fixed reference count, never a fail.

## What fits

- **Fits:** solver-checked logic boards (the generator and solver live in `logic.ts`, and every property is a unit test); puzzles whose first rung needs no reading (mazes, dominoes, Star Battle, picture logic grids, picture crosswords); puzzles that grow by adding a decision (another fork, another category, another clue kind) rather than speed.
- **A mode, not a new game, when the action is the same:** the maze in Mossy Path (stepping a route through tiles); Skyscrapers and Futoshiki in Garden Rows; KenKen cages in Sudoku Garden; Mosaic in Picture Logic; word ladders in Word Monsters; Strands in Word Search.
- **Touch budget.** At 100 units a cell, 768 units of height hold 7×7 at most: 6×6 with a header, 5×5 with clues round the edge. Grown-up games at 64 units reach 9×9 to 10×10. So Slitherlink and Masyu, whose edges are about half a cell wide, are grown-up only.
- **Does not fit:** daily rotation and streaks; mistake caps; leaderboards; Crossplay-style two-player word battles (a strategy question for the [strategy study](strategy-games.md)); solo chess; poker-hand grids; quotation acrostics; any open-dictionary word game without a reviewed list and block list.
- **Languages.** Logic and number puzzles need only their voice lines translated. Word puzzles need a reviewed list per language, which matters for the [European Portuguese plan](world-languages.md).

## An answer for every audience

| Audience | First action | Deeper rung |
| --- | --- | --- |
| **L** (lap) | *None, and why:* every puzzle-page genre needs a goal and a rule; lap play is cause and effect, which Peekaboo Barn and Bubble Pop already give | — |
| **T** (toddler) | Follow one winding moss corridor with no fork to the pond (Kumon's easy mazes start at 2) | One fork whose wrong branch ends in sight |
| **P** (preschool) | One fork; a hidden-picture key of three big objects; a picture crossword's missing first letter, the picture spoken | A dead end one step deep; the key becomes spoken names only |
| **K** (pre-K) | Domino Pond: lay a domino whose two halves match a patch's dots; Bunny Patches 4×4 with colour patches and one bunny given | Mazes with one-step look-ahead; a 2×3 picture logic grid with one negative clue; dot-to-dot 1–20 |
| **S** (school 6–8) | 3×3 logic grid with picture cards; 5×5 crossword of 4–6 words with a letter bank; Skyscrapers 3×3 with every clue | Sum Crates two-cell runs; Tents 4×4; Domino Pond sums; the maze's collect-on-the-way rung |
| **U** (upper school 9–12) | 4×4 logic grids with either-or and ordering clues; Bunny Patches 6×6 with nothing given; 6×6 cage sums | Codeword-style Decoder Ring; Letter Pond's honeycomb; Futoshiki |
| **M** (11–14) | The grown-up boards at `school`'s top levels until 12, then `grownup` from 13; a fully checked 5×5 crossword with written clues | Queens 8×8 at par; a 4×5 logic grid. No future band needed |
| **G, for a parent alone** | A Lantern Lake puzzle shelf: the 5×5 to Midi crossword, Bunny Patches 8×8 to 10×10, Domino Pond Hard, Sum Crates 6×6 (par: fewest moves, never a fail) | Lamp Lighter, Islands and Sea, Pen Planner on the same solver pattern |
| **G, with the child** | The grown-up reads the logic grid's clue cards aloud while she marks yes and no; she drags the crossword's letters while the grown-up reads a written clue; take turns laying Domino Pond's stones | The child explains why a square is crossed out ("the red hat friend was at the pond") |
| **G, the grown-ups' page** | A *puzzle page at the table* card (plain HTML): draw a maze for each other, say a word ladder in the car (cat, hat, hot), count domino dots, play *I spy* in a picture book | No learning claim; no "brain" wording |

## Candidates and recommended order

| # | Name (working) | After | Fun action | What she decides | Audiences | Home | Effort | Infrastructure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | **Crossword** | Picture crosswords, the Mini, the arrowword | Drag letters into crossing words | Which word fits the clue and the crossing letters | K–G | new game ([defined](../../definitions/logic-grid.md)) | M | Seeded placer; per-level reviewed lists |
| — | **Logic Grid** | *Murdle*, Dell logic problems, the zebra puzzle | Mark yes and no until one answer per row is left, then name who took the pie | Which possibility a clue rules out | P–G | new game (definition queued) | M | Generator plus a human-style solver |
| PP1 | **Mossy Path: find the way** | Kumon mazes | Step the turtle through hedges to the pond | Which branch reaches it; looking ahead from a fork | T–S | Mossy Path (new levels and bands) | M | A maze generator in `logic.ts` |
| PP2 | **Domino Pond** | Pips (NYT 2025), Dominosa | Lay stepping-stone dominoes so each patch meets its sign | Which domino, which way round, where | K–G | new game | M | Random tiling → derive conditions → solver; accept any valid placement |
| PP3 | **Bunny Patches** (IDEAS *Garden Queens*) | Star Battle, LinkedIn Queens | One bunny in every row, column and patch, none touching | Where a bunny is forced; crossing out squares a bunny rules out | K–G | new game | M | Place → grow regions → solver ([a no-backtracking solver is documented](https://mspiegel.github.io/queens-without-backtracking/QUEENS.html)) |
| PP4 | **The bee counts tall flowers** | Skyscrapers | Plant flowers of different heights so the bee at each gate sees the right number | Which height goes where, from what the bee can see | S–U | Garden Rows (new level) | S–M | Latin square plus visibility clues |
| PP5 | **Sum Crates** | Kakuro | Fill runs of fruit crates so each run adds to its label, no repeats | Which partition of the sum fits both crossing runs | S–G | new game (check Fruit Sums first) | M | Small boards searched exhaustively |
| PP6 | **Campsite** | Tents (Tatham) | Pitch each critter's tent beside its own tree, no two touching, matching the row counts | Which tree a tent belongs to | S–G | new game | M | Tatham's generator needs no guessing |
| PP7 | **Silly Scene** | Highlights' *What's Wrong?* | Tap the impossible thing (a fish in a tree); the pet laughs and says why | What cannot be true | P–S | new small game, or a mode (check Not Always and Who Am I) | S | Authored scenes |
| PP9 | **Word Code** (IDEAS row) | Wordle, Secret Code | Guess a word; each letter is marked right, elsewhere or absent, with shapes as well as colours | Which letters the marks still allow | S–G | new game beside Secret Code (Puzzle Peaks or Lantern Lake) | M | Secret Code's feedback rule on letters; a reviewed word list and block list per level; the decided par (a fixed reference solver's guess count) |
| PP8 | **A puzzle page at the table** | Unplugged | — | — | G | grown-ups' page | S | None |
| — | Re-ranked rows | Sort Four (picture form), Letter Pond, Decoder Ring (also a logic-grid clue kind), KenKen cages, Lamp Lighter, Two-flower beds | as their rows say | | | existing rows | | |

Sort Four's picture form stays high: it reaches preschool with no reading and needs a uniqueness test that its row already names.

## A first game's ladder: Mossy Path, *find the way*

[Mossy Path](../../GAMES.md#mossy-path) is school-only today. Tap an adjacent moss tile and the turtle steps there; levels 1–3 visit every tile and reach the pond last. A maze uses the same stepping on the same tiles with a different goal, so it is an opening for that game rather than a new one. New level IDs keep the old ones stable, with `order` easiest first.

| Level (new ID) | Bands | First round | What she decides | Mistakes and hints |
| --- | --- | --- | --- | --- |
| 4 *Follow the moss* | toddler, preschool | One winding corridor two tiles wide between hedges, no fork; drag or tap along it | Nothing yet: where the path goes | Nothing is counted (0 misses). A tap off the path does nothing; the next tile glows after a pause |
| 5 *Which way?* | preschool, pre-K | One fork; the wrong branch ends in sight, two tiles long | Which branch reaches the pond | Entering the short branch is exploration and free; the turtle sniffs the hedge and turns back |
| 6 *Look before you go* | pre-K, school | Two or three forks, dead ends one step deep that can be seen from the fork (four-year-olds plan one step ahead) | Looking ahead before stepping | A step into a dead end she could see is a miss: a soft boing and "that way stops at the hedge". After two misses the right branch glows. A hint lights the next tile on the shortest route |
| 7 *Snack on the way* | school | Dead ends two branches deep and a berry to collect before the pond (five-year-olds plan two steps; subgoals in order are the hard part) | The order of two goals | As level 6; also a miss if she reaches the pond without the berry (the pond waits, the pet asks for the snack) |

- **Rule tests:** every maze is a tree, so there is exactly one route; the dead-end depth matches the level; corridors stay at least 100 units at every view size; the hint's next tile always lies on the shortest route; level 7's berry is on a branch off the route.
- **Bot:** the ghost finger follows the solver's route.
- **Cost:** a definition, then one build session. It adds bands to an existing game (registry, lands and how-to tests) plus one new interaction: dragging through tiles, beside tapping.

## Design notes for the two queued definitions

### Crossword

- **Grid ladder.** Pre-K: an arrowword (the clue picture sits in a cell with an arrow), two or three CVC words, every letter given except the crossing or first letter, dragged from two or three tiles while the pet says the word and its sound. School 6–8: a free criss-cross on 5×5 to 6×6, four to six words of three to five letters, a bank of the needed letters plus one or two decoys. Upper school and grown-up: a fully checked American 5×5 (no unchecked squares, no two-letter words) of 8–10 entries, the Mini's size. Preschool: none (a two-word picture cross is really Word Monsters).
- **Clue ladder:** a picture; a picture plus the spoken word; a spoken definition ("it says moo"); a spoken definition with the picture behind *show me*; a written clue, read aloud on request; a fill-in-the-blank phrase. Fill-it-ins (the word list given, no clues) make a gentle bottom rung for school.
- **Wrong letters.** Nothing is judged until a word is full: trying tiles is exploration. A full but wrong word is one miss (a boing, the wrong tiles hop back, a spoken hint about the sound). After two misses the next right tile and cell glow. A hint places one right letter, preferring a crossing. Right crossing letters stay.
- **Words per level.** Hand-authored, reviewed sets: six to nine picturable CVC words per pre-K level, a themed set of 10–15 per school level with four to six drawn a round. About 150–250 words across the ladder, each needing art and a voice line: that per-level cost is why each level's build session authors only its own set.
- **Tests:** every word crosses another; the bank covers every empty cell; the American level forms no unlisted word; every word is on the level's list. Share themes with Word Search.

### Logic-grid whodunit

- **Grid ladder.** Preschool: 2 friends × 3 places, direct spoken clues, drag the friends to their places. Pre-K: the same with one negative clue, then an event clue ("crumbs by the pond"). School 6–8: 3 × 3 (friend, place, thing) with yes and no marks, then 3 × 4, then 4 × 4. Grown-up: 4 × 5. *Murdle*'s Elementary case is exactly 3 × 3 × 3.
- **Clue kinds, in ladder order:** direct; negative; a picture-card lookup ("the friend in the red hat…", which needs no reading); different-person; either-or; neither-nor; ordering on a time row; transitive or unaligned pair ([Puzzle Baron's clue tutorials](https://logic.puzzlebaron.com/help), opened). Truth-and-lie statements model lying, so they are a decision below (default: left out).
- **Story.** The pie was borrowed for a surprise picnic; nobody is punished.
- **Misses.** Her marks are free exploration and never judged. Only a wrong accusation counts: a boing, and the pet replays and highlights the clue that rules it out. After two misses the next solver step's cell glows. A hint fills that cell and speaks its clue.
- **Generator** (seeded, `logic.ts`, after [ZebraLogic](https://arxiv.org/html/2502.01100v2), opened): permute a solution per category; list every true clue of the level's kinds; prune clues while an exact solver still finds one solution; then a **human gate**, where a rule solver (elimination plus the level's clue kinds, no trial and error) must finish or the board is rejected. Cap a 3 × 3 at about five clues. The event clue alone must not decide it. Keep the solver's steps for hints and the ghost-finger bot.
- **Tests:** exactly one solution; the human solver finishes; no clue is redundant to that solver; every hint is right.
- **Name.** Use a generic name. *Murdle*, the [zebra puzzle](https://en.wikipedia.org/wiki/Zebra_Puzzle) and Dell are references only.

## Experience and presentation

- **The first unsupported action:** a tap on the next moss tile; laying one domino on a patch; one bunny on a 4×4; one dragged letter into a picture crossword.
- **Touch-down feedback:** the tile, stone or square lifts under the finger at once; a placed piece settles with a pentatonic step; a cross-out mark is a soft pencil sound.
- **Replay variety:** every board is seeded, so each round differs while the level's rules stay fixed.
- **Off-screen:** the PP8 card. Draw a maze on paper for each other, play dominoes by counting dots, say a word ladder aloud.

## Fit with the creature-world rework

Each candidate is a game module with seeded, frozen boards per level, so it carries into the [rework](../../rework/README.md) unchanged. A creature's request can open a board (help the critters pitch their tents). Nothing here needs new shell infrastructure, and nothing depends on a save format.

## Decisions for the developer

Each has a default under the [October 23 standing rules](../../archive/DECISIONS-2026-10-23.md#standing-rules); none blocks a definition.

1. **Where the maze lives.** Default: a Mossy Path opening (PP1), because the stepping action is the same. The alternative is a new maze game, with its own drawn corridors and a dragged pet.
2. **Truth-and-lie clues in the logic grid.** Default: left out. The alternative is grown-up levels only, worded as "one friend remembers it wrong".
3. **Names.** Default: Bunny Patches for the notebook's *Garden Queens* (Queens is LinkedIn's name), Domino Pond, Sum Crates and Campsite. Trademarked product names (Wordle, Connections, Spelling Bee, Pips, Queens, Murdle, Jumble, KenKen) appear only as references.
4. **How many to queue now.** Default: this study queues PP1 only, as the procedure asks (its first eligible definition); PP2–PP9 wait in the [packet](RECOMMENDATIONS.md#puzzle-pages-recommendations) until the developer admits more.

## Build slices, in order

Each is one session; definitions are docs only.

1. **Define `crossword`**: defined in [crossword.md](../../definitions/crossword.md); levels 1–4 built by 2026-11-06 and levels 5–6 queued in READY. Notes: [crossword](#crossword).
2. **Define `logic-grid`**: defined in [logic-grid.md](../../definitions/logic-grid.md); levels 1–2 built 2026-11-05 and levels 3–4 queued in READY. Notes: [logic-grid](#logic-grid-whodunit).
3. **PP1: define Mossy Path levels 4–7, *find the way*** (toddler to school; [ladder above](#a-first-games-ladder-mossy-path-find-the-way)): defined in [mossy-path.md](../../definitions/mossy-path.md#levels-47-find-the-way-definition-pp1) 2026-11-06; built 2026-11-06 ([PR #1312](https://github.com/rjdunlap/neo/pull/1312)).
4. **PP2: define Domino Pond 1–3** (pre-K: match a patch's dots; then sums; then signs).
5. **PP3: define Bunny Patches 1–3** (pre-K or school 4×4, 5×5, 6×6; grown-up 8×8 at par as a later rung).
6. **PP4: define Garden Rows' *bee counts tall flowers*** after Garden Rows' queued levels.
7. **PP9: define Word Code 1–3** (school: three- and four-letter picture words with spoken support; grown-up: five letters at the decided par). Unlimited tries, no daily word, Secret Code's rule that ignoring a still-visible mark is the miss, and a reviewed list and block list as data.
8. **PP5–PP7** (Sum Crates, Campsite, Silly Scene): define once the first of PP2–PP3 is built, checking Fruit Sums, Not Always and Who Am I for overlap.
9. **PP8: the *puzzle page at the table* card**, written after the first of these games is built.

## What was built and what ran

Nothing was built. This is docs only: `node scripts/check-links.mjs` and `git diff --check`.

Blocked during research: nytimes.com, puzzmo.com, the Guardian and The Times sites; the Usborne maze listing, the Fast Company kids'-crossword article, the *Murdle Jr.* listings and the JRMF beginner Star Battle PDF (403 or 404). Their claims above are marked as search summaries.
