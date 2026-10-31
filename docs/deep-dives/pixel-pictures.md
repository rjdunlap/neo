# Pixel Pictures deep dive

*ID `pixel-pictures` · bands preschool, pre-K, school · levels 1–6 on 2026-10-31 · session `claude/dive-pixel-pictures`, [PR #1071](https://github.com/rjdunlap/neo/pull/1071)*

## The game today

Tap squares on a grid to make a picture, in Paint Pier (`region: 'treehouse'`; the [GAMES entry](../GAMES.md#pixel-pictures)). A finished picture shows in its colours, is named ("It is a fish!") and the last one can be kept on the treehouse picture board. **Learning purpose:** copying by position on a grid, line symmetry, and from level 4 picture logic (nonograms): reading run numbers along rows and columns.

| Level | Plan name | Band window | What she decides | Pool / shown per round |
| --- | --- | --- | --- | --- |
| 1 | Copy a small picture on a 4 by 4 grid | preschool, pre-K | Which squares the little model fills | 5 / 3 |
| 2 | Copy a two-color picture: pick a color, then tap squares | preschool, pre-K | A colour, then its squares | **3 / 3** |
| 3 | Finish the other half: make both sides match like a mirror | pre-K, school | The right half from the drawn left half (6×6) | 4 / 2 |
| 4 | Picture logic: the numbers say how many squares in a row are filled | school | Squares the run numbers settle (5×5) | 5 / 2 |
| 5 | Bigger picture logic: 6 by 6, with numbers for runs like "2 1" | school | The same with two-run clues (6×6) | 7 / 2 |
| 6 | Two-color picture logic: each run has its own color | school | A colour and its squares from coloured run numbers | **2 / 2** |

Ranges: preschool 1–2, pre-K 1–3, school 3–6. Squares are 100 units (`CELL`), so a 6×6 board is 600 units in the 1024×768 design area.

**What a round draws from** (counted from `picturesFor` on this date, by running `logic.ts` outside the test runner): 4×4 has five one-colour pictures; 5×5 has five, of which three are two-colour (fish, house, tree) and two are three-colour (flower, ice pop: they appear only as one-colour logic at level 4); 6×6 has seven, four of them symmetric one-colour (mirror pool) and two two-colour (little cat, little sailboat). Every 5×5 and 6×6 picture is solvable by line logic; the 4×4 smile is not, and is used only for copying.

**Accounting today:** a square that should stay empty, or the wrong colour, is a miss with a spoken line (`pixel.notthere`, `notcolor`, `notmirror`, `notclue`); on logic levels the wrong square gets a grey cross. Two misses glow a square and count one hint (`pixel.hint`). Levels 4–5 glow a square line logic decides (`deduce`); levels 1–3 and **6** glow the first open square of the picture in reading order, and level 6 also selects its colour.

**Known gaps** (source reading, not play):

- **Levels 2 and 6 repeat exactly.** Each shows as many pictures as its pool holds (3 of 3, 2 of 2), so every round at those levels is the same set, only reordered. The rule test asserts `pool ≥ shown`, which equality passes.
- **Level 6 is not checked for colour logic.** `lineSolvable` is one-colour; no test asserts that a two-colour picture can be solved from its coloured clues alone, and its hint and the ghost finger walk the picture in reading order rather than by what the clues decide (the bot copies; it does not demonstrate the reasoning the level asks for).
- No `coplayHint` beyond "guess together"; a co-player has no role of their own. No couch entry ([Picture Logic](../GAMES.md#picture-logic) is the grown-up and couch nonogram game and reuses `placements`).
- The [device check](../DEVICE-CHECKS.md) still asks whether an older child can play the logic levels.

**Subject studies that point here:** [how computers work](subjects/how-computers-work.md) (*Picture Bytes*, H6: a four-bit row decoded into a picture; the study's own definition line), [ratio and proportion](subjects/ratio-proportion.md) (*big picture*, RP6: the scale factor), [ancient Mediterranean](subjects/ancient-mediterranean.md) (*Mosaic border* and *Mirror the emblem*, AM7, through reviewers), [making media](subjects/making-media.md) (*Pixel Flipbook*, MM7, after the storage decision), [area, volume and space](subjects/area-volume-space.md) (Meadow Pens shares the painting gesture but stays a separate game), [fractions](subjects/fractions.md) (Window Mosaic is not a Pixel Pictures mode). The [rework's pet integration](../rework/PET-INTEGRATION.md) names a pattern becoming a blanket or scarf.

## Similar games

| Game | Kind | How its progression grows | What to borrow | What to leave out |
| --- | --- | --- | --- | --- |
| [Mario's Picross](https://en.wikipedia.org/wiki/Mario%27s_Picross) (Game Boy, 1995) | Nonogram | 5×5, 10×10, 15×15 across three courses of 64; a hint roulette pre-fills one row and one column | Small grids first; a hint that fills something the player can then reason from | The 30-minute timer, mistakes costing 2, 4, then 8 minutes, and the game ending when time runs out |
| [Nonograms](https://en.wikipedia.org/wiki/Nonogram) generally (paper puzzle books, Picross DS, Cross Pix) | Logic puzzle | Size, then two-run clues, then colour nonograms | Colour clues as a later rung (level 6 already); only line-solvable pictures | Pictures that need guessing; tiny cells |
| [Pixel Art – Color by Number](https://apps.apple.com/app/1274972321) (Easybrain) | Colour-by-number app | Tens of thousands of pictures; pinch-zoom until numbered cells show; a camera turns a photo into a picture | Choose a colour, then its squares (level 2's gesture); the finished picture appearing | Endless content as the hook, in-app purchases and ads, tiny zoomed cells, no reasoning |
| [Mario Paint](https://en.wikipedia.org/wiki/Mario_Paint) (SNES, 1992) | Paint and stamp editor | A pixel stamp editor beside free painting, then frame animation | A square-by-square editor that makes her own stamp (proposed level 10) | — |
| [Fuse beads](https://en.wikipedia.org/wiki/Fuse_beads) (Hama, Perler) | Physical craft | Square-grid pegboards; copy a printed pattern bead by bead, then make your own | The off-screen activity; copying by position then designing | Small beads (choking hazard) for under-threes |
| [Lite-Brite](https://en.wikipedia.org/wiki/Lite-Brite) | Physical toy | Peg pictures on printed templates, then free designs | Lighting squares as the touch feedback | — |
| [CS Unplugged: Image representation](https://www.csunplugged.org/en/topics/image-representation/) | Unplugged lesson, ages 5–7 and 8–10 | *Colour by numbers* (a picture as numbers), then *Squeezing pictures into less space* | The Picture Bytes rung, already in the [how-computers-work study](subjects/how-computers-work.md) | Compression as arithmetic |
| [Puzzle Pals](../GAMES.md#puzzle-pals), [Tangram Town](../GAMES.md#tangram-town), [Picture Logic](../GAMES.md#picture-logic) (this island) | Pictures, shapes, grown-up nonograms | — | Code-drawn pictures; Picture Logic's line hints and sentence | Grown-up sizes and fill-counting score |

**Learning references:** line symmetry is [CCSS 4.G.A.3](https://www.thecorestandards.org/Math/Content/4/G/) ("Recognize a line of symmetry for a two-dimensional figure…", "Identify line-symmetric figures and draw lines of symmetry"); scale drawing is England Year 6 *similar shapes where the scale factor is known*, already cited in the [ratio study](subjects/ratio-proportion.md); representing a picture as bits is in the [how-computers-work study](subjects/how-computers-work.md). Grown-up wording claims only "copying, symmetry and picture logic".

## What makes sense here

The game's strength is that **the picture is the reward and the check**: every square she places either belongs to the picture or visibly does not, and the reveal names what she made. Depth should come from **new ways to know where a square goes** (copy, mirror, numbers, and next: two mirror lines, a bigger copy, her own design), each on the same tap, not from bigger grids. The 100-unit square fixes the board at 6×6 in the 1024×768 design area (an 8×8 board would need 800 units of height), so a larger picture is a ladder dead end; Picture Logic already owns grown-up sizes.

Timers, mistake penalties, endless libraries, pinch-zoom and photo conversion are left out. Colour-by-number has no reasoning, so it is not a mode.

**Long-term arc:** preschool copies one colour, then two (built) → pre-K mirrors a half (built) → school reads run numbers (built), mirrors across two lines (7) and copies at twice the size (8) → Picture Bytes (H6) and Mosaic border (AM7) through their study packets → Pixel Flipbook after its storage decision.

## Experience and presentation

- **First unsupported action:** level 1's model sits beside the grid; she taps a square and it fills with the model's colour and a pentatonic pop (`sfx.pop`, pitch by position). That is already right. New levels keep this: the first tap on level 7 is any square whose mirror image is already drawn, and on level 8 any square of the block under a model square.
- **Touch feedback and consequence:** touch-down fills the square at once; a wrong square boings and, on logic levels, greys with a cross; the finished picture redraws row by row with rising bells and a star burst. Level 8 adds one consequence: when a 2×2 block is complete its four squares merge into one rounded tile (the inner strokes fade), so "one little square became four" is seen, not said.
- **Art and feel example:** level 7 draws two dashed purple lines (the existing mirror line, `swatch.purple.line`, once vertical and once horizontal) and tints the given quarter's background with a faint `cream` wash; each square she fills draws a quick ghost outline on its three mirror images for 0.3 s (a `Graphics` stroke with alpha tween), which shows the rule without filling for her.
- **Variety without changing the rule:** a seeded picture from a bigger pool (slice 1), the seeded order, and on level 7 which quarter is given (top-left always for the first round, any quarter later).
- **Reasoning versus reading, memory and motor:** no reading; the model stays on screen (no memory load); every square is 100 units and taps are single. Level 7's hint glows a square whose mirror is filled, not just the next square.
- **Supported ending:** the glow after two misses always points at a square that belongs; each picture ends when it matches; level 10's own picture ends at Done.
- **Co-play:** level 10 gives a co-player a real role: a grown-up makes a picture that is kept, and she copies it next (a `coplayHint`: "Make a picture together: one of you picks the colour, the other places it"). Solo stays complete.
- **Needs a person or device:** whether a six-year-old sees the second mirror line as a rule rather than decoration; whether filling sixteen squares for a four-square model (level 8) feels like making something big or like a chore; whether a three- or four-year-old finds level 9's colour pick before tapping natural.

## Proposed ladder

### Fresh content inside existing levels

- **Level 2:** three more two-colour 5×5 pictures (a strawberry `r`+`g`, a duckling `y`+`o`, a mushroom `r`+`n`), so the pool is six for three shown.
- **Level 6:** three more two-colour 6×6 pictures (a sun `y`+`o`, a frog `g`+`n`, a fish `b`+`o`), each accepted only if **colour line logic** solves it: a `colorPlacements` / `colorLineSolvable` pair in `logic.ts` (same-colour runs need a gap, different colours may touch, matching `colorRuns`). The level-6 hint and ghost finger then use the colour deduction, as levels 4–5 already do with `deduce`, so the glow is a square the coloured numbers settle.
- A rule test that each level's pool is **larger** than the pictures it shows (strictly), so a round can differ.

### New levels on top

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 7 | Both ways: a picture with two mirror lines | school (range 3–7) | A 6×6 snowflake with the top-left 3×3 quarter drawn and two dashed lines | Squares in the other three quarters, each the mirror of a drawn square | A square whose mirror image is empty: boing and "Look across both lines" (a new `pixel.notmirror2`); two misses glow an open square nearest her last tap whose mirror is drawn | Every level-7 picture is one colour and symmetric across both axes; the given quarter determines every other square; the ghost finger fills only the three open quarters and never a wrong square | Four or more authored four-fold 6×6 pictures (snowflake, window, flower, star, gem); `PixelMode` gains `mirror2`; one instruction and one miss line; how-to step from 7; bot via `pixelTouch` |
| 8 | Twice as big: copy a little picture at double size | school (range 3–8) | A 3×3 plus sign beside the 6×6 grid, with a faint 2×2 block grid drawn on the board | Every 2×2 block that a model square becomes | A square outside the picture's blocks: boing and "Each little square makes a block of four" (`pixel.notbig`); two misses glow every open square of one block | `scaleUp(p, 2)` turns each model square into a complete aligned 2×2 block with four times as many filled squares; the hint block holds only open picture squares; the bot finishes block by block | Five 3×3 one-colour models (plus, cross, arrow, corner, smile); reveal line "Twice as wide and twice as tall!"; the kept creation is the 6×6 result (existing `size: 6` shape). The study's 4×4 → 8×8 does not fit at 100-unit squares; "scale factor" stays on the grown-up card only |

### Younger-band openings

**Light the picture (toddler, decision):** a 3×3 board whose picture squares are drawn as faint outlines; any tap on an outline fills it with a pop, a tap elsewhere only twinkles (never a miss). Adds `toddler` to the game's bands, so it waits on the developer.

### Easier entries and levels between existing ones

| Level | Name | Band window | First round | What she decides | Mistakes and hints | A rule test asserts | Cost and couplings |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | Two colours, small | preschool, pre-K; placed between 1 and 2 by `order` (1, 9, 2, 3, …) | A 4×4 ladybird (`r`+`n`) with two big swatches | A colour, then its squares, on the smaller grid | As level 2 (`pixel.notcolor`, the glow selects the colour) | Every level-9 picture is 4×4 with exactly two colours; `order` lists every ID once; `entryLevels` unchanged (level 1 stays the entry) | Four new 4×4 two-colour pictures; `order` on the module; how-to step scoped to 9 |
| 10 | My own picture | pre-K, school; top of the order (free level) | A blank 5×5 with four swatches and a Done button that appears after four squares | Anything: a free design | None: a tap on a filled square empties it, nothing is wrong; misses 0, hints 0 | A design with fewer than four squares cannot finish; the kept creation equals the board; the bot places a seeded small picture and presses Done | Done button (≥100 units); the creation uses the existing pixel shape; a `coplayHint`; demo shows the bot drawing a heart |

Level 10 is a free level like Rainbow Fingers' free painting: adaptation treats a free round as smooth, so it sits at the top of `order` where stepping up cannot pass it.

### Left out on purpose

- Bigger grids, pinch-zoom and grown-up nonograms: Picture Logic owns them.
- Timers, mistake costs, a picture library to collect, ads and purchases.
- Photo-to-pixel conversion; colour-by-number without reasoning.
- **Picture Bytes** (H6), **Mosaic border / Mirror the emblem** (AM7) and **Pixel Flipbook** (MM7) are defined by their studies' own packets and take the next free level IDs then; level 7 is the plain geometry that *Mirror the emblem* would later dress.

## Decisions for the developer

1. **A toddler opening** (*Light the picture*): add `toddler` to Pixel Pictures' bands with a no-miss 3×3 level, or leave the game at preschool and up.
2. The existing **Pixel Flipbook storage** decision ([IDEAS](../IDEAS.md#decisions-this-needs-from-the-developer), item 7) still gates frames; nothing new here.

## Build slices, in order

1. **Fresh pictures and colour logic (batch pixel-pictures 1).** Level 2 pool 3 → 6, level 6 pool 2 → 5 with `colorLineSolvable`; level-6 hint and ghost finger use colour deduction; the strict pool test. *Check:* typecheck and the game's rule tests; the hint/bot change adds one filtered regression play of level 6 (the `woods` suite's Pixel Pictures 6 case) and `fingerdemo` at 6.
2. **Levels 7–8: both ways and twice as big (batch pixel-pictures 2),** after batch 1. *Check:* new levels on an existing interaction: typecheck, rule tests, one browser play of level 8 (the new top) with one wrong square and the glow, a level-7 case in the same filtered run, `fingerdemo` at 7 and 8, one portrait screenshot of level 8. Stop after level 7 if the allowance cannot cover 8.
3. **Level 9: two colours, small (batch pixel-pictures 3).** *Check:* typecheck, rule tests (order/entry), one browser play of level 9 and `fingerdemo` at 9.
4. **Level 10: my own picture (batch pixel-pictures 4).** A new interaction (empty a square, Done). *Check:* typecheck, unit tests, one scripted play to Done with a kept design, one portrait screenshot, `fingerdemo` at 10, the `creations` suite filtered to Pixel Pictures only if the kept shape changes (it should not).
5. *Gated:* Light the picture (decision 1); Picture Bytes, Mosaic border, Flipbook through their packets.

## What was built in this session

Nothing: research and ideation only. Links and `git diff --check` ran.
