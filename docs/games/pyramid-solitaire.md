# Pyramid Solitaire

<!-- generated: from src/games/pyramid-solitaire; edit the text below the end mark (npm run game-docs) -->

**ID:** `pyramid-solitaire` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** number-complements, planning, revision

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–3 |

| Level | Plays like |
| --- | --- |
| 1 | Six face-up cards: complements to thirteen |
| 2 | Ten cards: uncover the next pair |
| 3 | Fifteen cards: plan through five rows |

<!-- end generated -->

**Starts as:** lift exposed pairs totaling thirteen, or a king alone, to clear six face-up cards

**Grows into:** three finite seeded pyramids of 6/10/15 cards; exact clearing-route Hint with dead-end recovery, free Undo/Start over and spoken rank guide; touch only, no stock

## Design notes

*Touch/mouse only · complements to thirteen, planning and revision.* Lift two exposed cards whose ranks total thirteen, or an exposed king alone, to uncover and clear a small pyramid. A card is exposed only when both cards covering it have gone. All ranks are face-up; the visible guide and spoken support explain A = 1, J = 11, Q = 12 and K = 13. Clear the pyramid to finish through the shell with one sticker, including with help.

Three levels use 3/4/5 rows with 6/10/15 cards. Seeded generation assigns complementary ranks along a legal clearing order; an exact remaining-card mask solver proves a clearing route and accepts alternative solutions. These are finite practice pyramids, with no stock, draw pile or conventional 52-card deck restriction. Deeper rounds add cover relationships and choices, with no timer or loss screen.

Tap one exposed card and its complement; tap the selected card again to cancel. Covered-card taps explain the covers without counting a miss. A mismatched exposed pair removes nothing, gives a gentle boing and spoken reminder, and counts one miss; two consecutive mismatches show a counted hint. Hint outlines a next removal on a clearing route. Repeating it while visible adds no help. A legal removal that leaves a dead end is free exploration; Hint returns to the nearest solvable ancestor and outlines a clearing move, counting support once. Undo and Start over are free revision and preserve misses and hints. The how-to ghost finger plays through real taps using the same solver. Co-play predicts what a pair will uncover; off-screen play uses numbered paper cards. No controller, couch course or saved unfinished deal is built in this slice.
