# Tile Pairs

<!-- generated: from src/games/tile-pairs; edit the text below the end mark (npm run game-docs) -->

**ID:** `tile-pairs` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** noticing · **Plays by:** touch and controller, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-planning, matching

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1, 2, 17, 3, 18, 4, 19, 5, 20, 6, 7, 8, 9, 10, 21 |

| Level | Plays like |
| --- | --- |
| 1 | Open rows · 12 tiles |
| 2 | A raised square · 20 tiles |
| 3 | Three layers · 24 tiles |
| 4 | Long bridge · 24 tiles |
| 5 | Twin terraces · 24 tiles |
| 6 | Crown · 24 tiles, six of each picture |
| 7 | Tall tower · four layers |
| 8 | Flower friends · any two flowers pair |
| 9 | Wide stack · 30 tiles |
| 10 | Tricky twins · a pair that strands a terrace |
| 17 | Twins on twins · a lesson |
| 18 | Three free copies · a lesson |
| 19 | Crossed stacks · a lesson |
| 20 | The long row · a lesson |
| 21 | Two pairs ahead · a lesson |

<!-- end generated -->

**Starts as:** remove matching tiles with a clear top and an open left or right side

**Grows into:** ten solvable layouts (12/20/24 tiles, then a 24-tile bridge, twin terraces, a crown, a four-layer tall tower with more matching choices, a crown where any two of four different flowers pair, a 30-tile wide stack, and twin terraces dealt from frozen tricky boards where one pair strands a terrace), dealt in one of three picture looks by seed, each cleared by a different seeded pairing every round; a removed pair lifts away and the tiles it frees pulse; Undo, a clearing-route Hint, Shuffle into open rows, and Peek at covered pictures; touch and controller demos; no clock or loss screen

## Design notes

On an upright phone, Undo, Hint, Shuffle and Peek sit above the guide and below the full-width tile stacks.

*Spatial matching and planning, after Mahjong solitaire.* Tap two tiles with the same picture to remove them. Each must have a clear top and an open left or right side on its layer; bright tiles are free, muted tiles are blocked. Pictures differ by both shape and color. Tap a selected tile again to cancel it. Touch answers on press; on the couch, the stick or D-pad moves between free tiles and the bottom button selects.

**Peek.** The Peek button, P key or top controller button opens a view of every remaining picture. Tile bodies with another tile beneath them fade to quarter opacity. The pictures in each stack sit side by side, from the bottom tile on the left to the top tile on the right; a four-deep stack shows them in a 2 × 2 grid, bottom first, in reading order. All Peek pictures are drawn against 72 units so neighbours never touch. Press the same control again or choose any tile to close Peek. A tile press that closes Peek leaves the current selection alone. Looking leaves all counters and the face-off score alone.

**Ladder.** Level 1 has twelve tiles in three open rows; 2 has twenty with a raised central square; 3 has twenty-four across three layers, with four copies of each picture allowing alternative pair choices. Level 4 stretches the stack into a six-column bridge with a raised middle row; 5 splits the raised tiles into twin terraces with five pictures (some appear six times); 6 cuts the bottom corners into a crown, with two raised rows and six copies of each of four pictures. Levels 4–6 keep twenty-four tiles and the same target size; choosing which copy to pair changes the paths into the stack. Level 7 stacks four layers (a 4 × 3 base, 2 × 3, 2 × 2 and two on top), so twelve tiles start covered, with four copies of each of six pictures; its clear band is 0.45–0.9, and over 100 seeds on a Mac random play cleared candidates 11–98% of the time (median 57%), with about a third having a first pair that leaves no route, so Peek does real work. Level 8 *Flower friends* repeats the crown with five ordinary pictures (four of each) and four flower tiles, each a different drawing (five-petal, daisy, tulip, four-petal) in a shared pale-pink petal frame; any two flowers pair, so four tiles give six possible pairs. Deals put flowers in twos on the seeded route and Shuffle keeps them in twos; a flower tapped with another picture boings and hears “flowers”, and level 8 has its own spoken instruction. Its clear band is 0.45–0.9; over 100 seeds on a Mac random play cleared 45–90% of candidates (median 68%, mean 1.35 candidates per deal). Levels 1–7 deal the same boards as before.

Level 9 *Wide stack · 30 tiles* fills the 6 × 3 base (18), raises a 4 × 2 block on rows 0–1 (8) and a 2 × 2 on that (4): 30 tiles of six pictures (three appear six times, three four times), no flowers. Its clear band is 0.45–0.9; over 100 seeds all deals land in band, raw seeded routes cleared 17–97% of the time (median 70%) and the worst deal took 24 ms on a Mac. `solve` counts its search nodes, and a test holds every state of random play-outs to a dead end under 20,000 nodes (worst measured about 5,000 states, 2.6 ms; levels 6–8 700–1,200). The board mask is 2^30−1, the most the present 32-bit mask holds. Some first pairs on some seeds leave no route, so Undo, Hint and Shuffle matter here.

Level 10 *Tricky twins · a pair that strands a terrace* reuses level 5's twin-terrace layout, dealt from 24 frozen boards in `pools.ts` (written offline by `node scripts/tile-pairs-pool.mjs`, which kept 24 of 11,825 seeded deals). Each kept board clears; random play clears at most 30% of 400 play-outs (the level band is [0, 0.35]); some legal first pair leaves no route; and a "fair trap" check passes: a player who always takes a pair with the best two-pair lookahead (most open pairs after it and one more pair) clears it under every tie-break, so the trap is one she can plan around. At play the seed picks a board, may mirror it left to right (the layout is symmetric) and renames the pictures. The deal dial's bands for levels 3–6 are harder: levels 3–4 [0.6, 0.95], levels 5–6 [0.3, 0.8] (levels 1–2 stay [0.95, 1]; 7–9 [0.45, 0.9]); on a Mac 60%, 69%, 75% and 73% of candidates land in band for levels 3–6, so the 40-candidate dial does not run out. The grown-up range is 1–10 with no `order`. No new voice, how-to or couch change.

**Lessons (levels 17–21).** *Twins on twins*, *Three free copies*, *Crossed stacks* and *The long row* are 14-tile boards and *Two pairs ahead* an 18-tile one, designed to teach one habit each, chosen offline by `scripts/tile-pairs-pool.mjs` (a placement search on a sketched layout, kept when the first move teaches the lesson; 8 boards each from 54, 1,826, 5,240, 29,478 and 176 placements) and frozen in `puzzles.ts`, dealt with mirror and renaming over the look's six pictures. Taking the losing pair is not a miss; after the stuck line a per-lesson line (`tile-pairs.lesson.twins|three|crossed|long|ahead`) is spoken when the first pair taken left no route, unless she has already undone or shuffled, and Undo puts her back before the choice. *The long row* is one flat layer, a row of six between two rows of four, so nothing is covered and only row ends are free. On *Two pairs ahead* every losing first pair still leaves at least two pairs on every line before the board strands, and the fair-trap check passes. The grown-up band's order is 1, 2, 17, 3, 18, 4, 19, 5, 20, 6, 7, 8, 9, 10, 21, so each lesson comes just before the board that needs it (21 last, before the bigger boards it will serve).
**Looks.** Each round picks one of three picture sets from the seed, after the board is dealt, so a seed keeps the same board in every look. Look 1 is the six original shapes in rainbow colours; look 2 is oval, rectangle, diamond, pentagon, trapezoid and star in other colours; look 3 is six island props (strawberry, orange, banana, pear, shell, grapes). A test checks six distinct pictures and colours in each. The look stays through undo and shuffle; stickers and the hub icon keep look 1. Every board is assigned along a geometric clearing route that the seed chooses, so one layout clears by a different pairing each round (the positions are fixed, the partners are not); each level deals up to 40 such routes and keeps the first whose measured random-play clear rate sits in that level's band (levels 1–4 95–100%, level 5 85–100%, level 6 75–100%), else the closest, from the one seed, so a seed still gives one board and the couch face-off shares it. Shuffle still lays the remainder in open rows. A memoized exhaustive solver checks the remaining stack, so a Hint outlines a pair that leads to clearing, rather than merely any matching pair. A legal pair can leave no clearing route; the game explains this and keeps Undo and Shuffle available.

**Revision, help and completion.** Undo (left button on the couch) restores the last removed pair or shuffle, including its whole arrangement; each actual undo is counted, with no cost or limit. Shuffle (the couch pause menu's “Shuffle remaining tiles”) preserves exactly the remaining pictures and puts them in solvable open rows (at most four rows of six; past 24 remaining tiles, level 9 only, up to six extras are raised on the middle of rows 1–2, still placed along a clearing route, so the board stays on screen above the buttons). Removed tiles stay removed; each shuffle counts once in the shuffle tally and once as help. Hint clears a partial selection and rings a clearing pair; asking again while that hint is visible counts no extra help. On an unsolvable remainder Hint first performs a counted Shuffle, then counts and shows the pair. A mismatch removes nothing, gives a soft boing and spoken reminder, and counts one miss; after two mismatches since a match, a Hint is shown. Touching a blocked tile is exploration, not a miss. No clock or loss screen. A matched pair lifts, swells and fades over a third of a second rather than vanishing, and every tile it frees, uncovered or with a side opened, pulses once; the tally reads, for example, “24 tiles · 10 pairs open · 0 undos · 0 shuffles”, the matching pairs free right now. Removing the last pair finishes through the shell with one sticker, including with support. Couch face-off compares undos plus shuffles (lower wins); mismatches and hints stay separately recorded. Both demos act through the real input handlers. No frozen course in this slice.
