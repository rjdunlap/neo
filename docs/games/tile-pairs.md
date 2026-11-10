# Tile Pairs

<!-- generated: from src/games/tile-pairs; edit the text below the end mark (npm run game-docs) -->

**ID:** `tile-pairs` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** noticing · **Plays by:** touch and controller, upright on a phone · **Ghost finger:** yes

**Skills:** spatial-planning, matching

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–6 |

| Level | Plays like |
| --- | --- |
| 1 | Open rows · 12 tiles |
| 2 | A raised square · 20 tiles |
| 3 | Three layers · 24 tiles |
| 4 | Long bridge · 24 tiles |
| 5 | Twin terraces · 24 tiles |
| 6 | Crown · 24 tiles, six of each picture |

<!-- end generated -->

**Starts as:** remove matching tiles with a clear top and an open left or right side

**Grows into:** six seeded, solvable layouts: 12/20/24 tiles, then a 24-tile bridge, twin terraces and crown with more matching choices; Undo, a clearing-route Hint, and Shuffle into open rows; touch and controller demos; no clock or loss screen

## Design notes

On an upright phone the three controls sit above the guide, below the full-width tile stacks.

*Spatial matching and planning, after Mahjong solitaire.* Tap two tiles with the same picture to remove them. Each must have a clear top and an open left or right side on its layer; bright tiles are free, muted tiles are blocked. Pictures differ by both shape and color. Tap a selected tile again to cancel it. Touch answers on press; on the couch, the stick or D-pad moves between free tiles and the bottom button selects.

**Ladder.** Level 1 has twelve tiles in three open rows; 2 has twenty with a raised central square; 3 has twenty-four across three layers, with four copies of each picture allowing alternative pair choices. Level 4 stretches the stack into a six-column bridge with a raised middle row; 5 splits the raised tiles into twin terraces with five pictures (some appear six times); 6 cuts the bottom corners into a crown, with two raised rows and six copies of each of four pictures. Levels 4–6 keep twenty-four tiles and the same target size; choosing which copy to pair changes the paths into the stack. Levels 1–3 retain their original seeded assignments. Every seeded board is assigned along a geometric clearing route. A memoized exhaustive solver checks the remaining stack, so a Hint outlines a pair that leads to clearing, rather than merely any matching pair. A legal pair can leave no clearing route; the game explains this and keeps Undo and Shuffle available.

**Revision, help and completion.** Undo (left button on the couch) restores the last removed pair or shuffle, including its whole arrangement; each actual undo is counted, with no cost or limit. Shuffle (the couch pause menu's “Shuffle remaining tiles”) preserves exactly the remaining pictures and puts them in solvable open rows. Removed tiles stay removed; each shuffle counts once in the shuffle tally and once as help. Hint clears a partial selection and rings a clearing pair; asking again while that hint is visible counts no extra help. On an unsolvable remainder Hint first performs a counted Shuffle, then counts and shows the pair. A mismatch removes nothing, gives a soft boing and spoken reminder, and counts one miss; after two mismatches since a match, a Hint is shown. Touching a blocked tile is exploration, not a miss. No clock or loss screen. Removing the last pair finishes through the shell with one sticker, including with support. Couch face-off compares undos plus shuffles (lower wins); mismatches and hints stay separately recorded. Both demos act through the real input handlers. No frozen course in this slice.
