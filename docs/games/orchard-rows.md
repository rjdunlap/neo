# Orchard Rows

<!-- generated: from src/games/orchard-rows; edit the text below the end mark (npm run game-docs) -->

**ID:** `orchard-rows` · **Land:** Barnyard · **Ages:** school · **Challenge:** numbers · **Plays by:** touch · **Ghost finger:** yes

**Skills:** equal groups, arrays, skip counting, multiplication, division, factors, distributive property

| Band | Levels, easiest first |
| --- | --- |
| school | 1–9 |

| Level | Plays like |
| --- | --- |
| 1 | Plant equal rows and count by rows |
| 2 | Count by rows, then turn and count by columns |
| 3 | Find the missing row, then count two ways |
| 4 | Equal rows: choose a row count with none left over |
| 5 | Every way: plant every equal orchard for one basket |
| 6 | Only one long row: find the basket with no equal rows |
| 7 | A path at five: count each part, then the whole |
| 8 | Choose the path: split the orchard, count each part and the whole |
| 9 | A path at ten: rows of ten and the rest, then the whole |

<!-- end generated -->

**Starts as:** plant equal rows and count by groups

**Grows into:** turn the same orchard to count by columns, find and plant a missing row, then choose how many rows a basket of saplings deals into with none left over, plant every way, and find the basket that only makes one long row, then split a grown orchard with a path, count each part and the whole, choose where the path goes, and count with ten in each row

## Design notes

*Levels 1–9.* Tap a whole empty row to grow its trees, then tap every full row to count equal groups aloud and choose the total. The row bands are unscaled 100-unit controls; individual trees are pictures. Each seeded round selects two different orchards. Level 1 uses 2×2, 2×3, 3×2, 3×3 and 4×2 arrays with a running addition sentence. Level 2 uses 2×4, 3×4, 2×5, 4×3 and 5×2 (a round's two orchards are never one turned, and there is no square): after counting by rows, turn the same orchard to count by its columns and discover that its total stays the same. Level 3 uses 3×5, 4×5, 5×4, 5×5, 4×4 and 5×3 (4×4 and 5×5 have no row-count decoy): one row is missing; choose its tree count, plant it, then count the completed orchard both ways. Rows can be planted or counted in any order; replay never counts a group twice and is free support. Every wrong number choice is one miss, with an explanation; two misses on a question add one persistent answer glow and one hint. There is no further hint charge on that question. Two completed orchards finish through the shell for one sticker, including with help. **Levels 4–6 ([definition](../definitions/orchard-rows.md))** show the orchard as a picture beside a basket of saplings and a row-count control: up and down arrows pick how many rows and Plant deals the saplings into that many equal rows at once, any leftover staying in the basket. Level 4 *Equal rows* uses two baskets (12 at five rows first, then 14, 15, 16, 18, 20 or 21): find a row count with none left over. Level 5 *Every way* uses one basket of 12, 16, 18, 20 or 24 and a page of shape frames, one per factor pair: plant every different orchard, where the same orchard turned on its side fills the same frame. Level 6 *Only one long row* shows two sets of three baskets (the first is 12, 13 and 15): tap the basket that only makes one long row, then answer with the separate *One long row* button; *prime* is spoken only in that answer line. Arrows, the soft tick and wobble at the ends of the range, a shape already planted, loading a basket and repeating a claim are free. Each Plant with a leftover, and a first wrong claim on a basket, is one miss; a second miss glows the next arrow or Plant (at level 5, an unfound frame) or the prime basket and counts one hint, at most one per basket or set, and the arrows stay live while the reason plays. A tap mid-deal finishes the deal. The bot plays all three levels without a miss (rule-tested over 100 seeds). Co-play: packer and checker (the child chooses the rows, the grown-up says whether every row is full, then swap). **Levels 7–9 ([definition](../definitions/orchard-rows-path.md))** are a separate scene (`PathOrchard`) where a path splits a grown orchard into two parts, to practise the distributive property: count the top part, then the bottom part, then the whole, each from a pad of three numbers. Level 7 *A path at five* shows 7 rows of 4 with the path after row 5 (parts 20 and 8, whole 28); level 8 *Choose the path* has her slide the path with up and down arrows (free, a soft tick at the ends of the range) and lay it at any row, and any split is right; level 9 *A path at ten* runs the path down the orchard after ten trees in a row, so the parts are tens and the rest. Tapping a sign re-counts its part by rows (skip counts) only after that part is answered, so it never gives the answer away. A wrong pad is one miss with a spoken reason; two misses on one question glow the right pad and count one hint; a join line shows the finished orchard with its equation. Two orchards finish through the shell for one sticker. Level 8 has no hint for the split. Co-play: one chooses the path, the other counts the parts; off screen: split a tray of buttons into two rows and count each. The ghost-finger demonstration plays levels 7–9 through the same pads and arrows. Device speech of "rows of" and the skip counts is unchecked. A ghost-finger demonstration plays every mode through the same row and number controls. Reduced-motion instant dealing is not implemented because the app has no reduced-motion setting. Co-play: count the equal groups together; off screen: arrange blocks in rows, then view them from the side. Device speech and child understanding of grouping remain unjudged.

**Counting lines never hold the next tap (U7 fix batch 7, 2026-11-12).** Levels 1–3: a tapped row's planted or counted line starts with input open, so the next row's line cuts it as a running count (the sentence on screen keeps the total) and the last row's is heard out before the total's ask; at levels 2–3 the turn button shows as the right total's line starts and the turn line follows it, or is dropped if she presses Turn first. Level 5: the grown orchard's line and the new-shape line play as one sequence with the arrows live, so she can deal the next shape at once. Levels 7–9: a part's right answer starts and the next question's pads show at once; its spoken question waits for the line or her first press, which only says the question and is not judged. Between-board lines (`orchard.same`, level 1's `orchard.yes`) are unchanged.
