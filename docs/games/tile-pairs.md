# Tile Pairs

<!-- generated: from src/games/tile-pairs; edit the text below the end mark (npm run game-docs) -->

**ID:** `tile-pairs` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** noticing · **Plays by:** touch and controller, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-planning, matching

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–8 |

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

<!-- end generated -->

**Starts as:** remove matching tiles with a clear top and an open left or right side

**Grows into:** seven solvable layouts (12/20/24 tiles, then a 24-tile bridge, twin terraces, a crown and a four-layer tall tower with more matching choices), dealt in one of three picture looks by seed, each cleared by a different seeded pairing every round; a removed pair lifts away and the tiles it frees pulse; Undo, a clearing-route Hint, Shuffle into open rows, and Peek at covered pictures; touch and controller demos; no clock or loss screen

## Design notes

On an upright phone, Undo, Hint, Shuffle and Peek sit above the guide and below the full-width tile stacks.

*Spatial matching and planning, after Mahjong solitaire.* Tap two tiles with the same picture to remove them. Each must have a clear top and an open left or right side on its layer; bright tiles are free, muted tiles are blocked. Pictures differ by both shape and color. Tap a selected tile again to cancel it. Touch answers on press; on the couch, the stick or D-pad moves between free tiles and the bottom button selects.

**Peek.** The Peek button, P key or top controller button opens a view of every remaining picture. Tile bodies with another tile beneath them fade to quarter opacity. The pictures in each stack sit side by side, from the bottom tile on the left to the top tile on the right; a four-deep stack shows them in a 2 × 2 grid, bottom first, in reading order. All Peek pictures are drawn against 72 units so neighbours never touch. Press the same control again or choose any tile to close Peek. A tile press that closes Peek leaves the current selection alone. Looking leaves all counters and the face-off score alone.

**Ladder.** Level 1 has twelve tiles in three open rows; 2 has twenty with a raised central square; 3 has twenty-four across three layers, with four copies of each picture allowing alternative pair choices. Level 4 stretches the stack into a six-column bridge with a raised middle row; 5 splits the raised tiles into twin terraces with five pictures (some appear six times); 6 cuts the bottom corners into a crown, with two raised rows and six copies of each of four pictures. Levels 4–6 keep twenty-four tiles and the same target size; choosing which copy to pair changes the paths into the stack. Level 7 stacks four layers (a 4 × 3 base, 2 × 3, 2 × 2 and two on top), so twelve tiles start covered, with four copies of each of six pictures; its clear band is 0.45–0.9, and over 100 seeds on a Mac random play cleared candidates 11–98% of the time (median 57%), with about a third having a first pair that leaves no route, so Peek does real work.

**Looks.** Each round picks one of three picture sets from the seed, after the board is dealt, so a seed keeps the same board in every look. Look 1 is the six original shapes in rainbow colours; look 2 is oval, rectangle, diamond, pentagon, trapezoid and star in other colours; look 3 is six island props (strawberry, orange, banana, pear, shell, grapes). A test checks six distinct pictures and colours in each. The look stays through undo and shuffle; stickers and the hub icon keep look 1. Every board is assigned along a geometric clearing route that the seed chooses, so one layout clears by a different pairing each round (the positions are fixed, the partners are not); each level deals up to 40 such routes and keeps the first whose measured random-play clear rate sits in that level's band (levels 1–4 95–100%, level 5 85–100%, level 6 75–100%), else the closest, from the one seed, so a seed still gives one board and the couch face-off shares it. Shuffle still lays the remainder in open rows. A memoized exhaustive solver checks the remaining stack, so a Hint outlines a pair that leads to clearing, rather than merely any matching pair. A legal pair can leave no clearing route; the game explains this and keeps Undo and Shuffle available.

**Revision, help and completion.** Undo (left button on the couch) restores the last removed pair or shuffle, including its whole arrangement; each actual undo is counted, with no cost or limit. Shuffle (the couch pause menu's “Shuffle remaining tiles”) preserves exactly the remaining pictures and puts them in solvable open rows. Removed tiles stay removed; each shuffle counts once in the shuffle tally and once as help. Hint clears a partial selection and rings a clearing pair; asking again while that hint is visible counts no extra help. On an unsolvable remainder Hint first performs a counted Shuffle, then counts and shows the pair. A mismatch removes nothing, gives a soft boing and spoken reminder, and counts one miss; after two mismatches since a match, a Hint is shown. Touching a blocked tile is exploration, not a miss. No clock or loss screen. A matched pair lifts, swells and fades over a third of a second rather than vanishing, and every tile it frees, uncovered or with a side opened, pulses once; the tally reads, for example, “24 tiles · 10 pairs open · 0 undos · 0 shuffles”, the matching pairs free right now. Removing the last pair finishes through the shell with one sticker, including with support. Couch face-off compares undos plus shuffles (lower wins); mismatches and hints stay separately recorded. Both demos act through the real input handlers. No frozen course in this slice.
