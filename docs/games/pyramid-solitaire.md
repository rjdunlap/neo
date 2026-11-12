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

**Grows into:** three finite seeded pyramids of 6/10/15 cards dealt from a real pack (at most four of a rank) and chosen by a measured band; a lifted pair fades and the cards it opened pulse, with a "pairs open" status line and a corner index on every card; exact clearing-route Hint with dead-end recovery, free Undo/Start over and spoken rank guide; touch only, no stock

## Design notes

*Touch/mouse only · complements to thirteen, planning and revision.* Lift two exposed cards whose ranks total thirteen, or an exposed king alone, to uncover and clear a small pyramid. A card is exposed only when both cards covering it have gone. All ranks are face-up; the visible guide and spoken support explain A = 1, J = 11, Q = 12 and K = 13. Clear the pyramid to finish through the shell with one sticker, including with help.

Three levels use 3/4/5 rows with 6/10/15 cards. Seeded generation assigns complementary ranks along a legal clearing order; an exact remaining-card mask solver proves a clearing route and accepts alternative solutions. These are finite practice pyramids, with no stock or draw pile, and ranks come from a real pack: never more than four of a rank. A deal dial draws up to 40 candidates from the round's one seeded rng and keeps the first whose exact random-play clear rate (the chance a player who lifts any legal pair clears it) is in the level's band: level 1 at least 95%, level 2 from 50% to under 95%, level 3 40–80%, else the closest. Kings appear only where the clearing order forces them, plus at most one by chance (15%) at levels 2–3; level 1 is always exactly two pairs and two kings (the top king and one forced). Deeper rounds add cover relationships and choices, with no timer or loss screen.

A lifted pair rises, drifts toward its partner and fades over 0.3 seconds (untappable while it leaves); each newly uncovered card swells once with a soft pentatonic bell step. The status line reads "N pairs open" (plus "· a king can go alone"), and every card has a top-left corner index (rank, with 1/11/12/13 under A/J/Q/K) so a covered face card keeps its value in landscape. Undo, Start over and hint recovery stop any lift or pulse still running and put the cards back in place.

Tap one exposed card and its complement; tap the selected card again to cancel. Covered-card taps explain the covers without counting a miss. A mismatched exposed pair removes nothing, gives a gentle boing and spoken reminder, and counts one miss; two consecutive mismatches show a counted hint. Hint outlines a next removal on a clearing route. Repeating it while visible adds no help. A legal removal that leaves a dead end is free exploration; Hint returns to the nearest solvable ancestor and outlines a clearing move, counting support once. Undo and Start over are free revision and preserve misses and hints. The how-to ghost finger plays through real taps using the same solver. Co-play predicts what a pair will uncover; off-screen play uses numbered paper cards. No controller, couch course or saved unfinished deal is built in this slice.
