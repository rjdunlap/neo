# Pyramid Solitaire

<!-- generated: from src/games/pyramid-solitaire; edit the text below the end mark (npm run game-docs) -->

**ID:** `pyramid-solitaire` · **Land:** Lantern Lake · **Ages:** grown-up · **Challenge:** numbers · **Plays by:** touch, upright on a phone · **Ghost finger:** yes

**Skills:** number-complements, planning, revision

| Band | Levels, easiest first |
| --- | --- |
| grown-up | 1–8 |

| Level | Plays like |
| --- | --- |
| 1 | Six face-up cards: complements to thirteen |
| 2 | Ten cards: uncover the next pair |
| 3 | Fifteen cards: plan through five rows |
| 4 | Twenty-one cards: spend copies over six rows |
| 5 | Lift the cover: a card with the one under it |
| 6 | The shelf: five open spare cards |
| 7 | The classic pyramid: twenty-eight cards, seven rows |
| 8 | Three columns: dig into two-card spare columns |

<!-- end generated -->

**Starts as:** lift exposed pairs totaling thirteen, or a king alone, to clear six face-up cards

**Grows into:** eight finite seeded layouts of 6/10/15/21/15/20/28/21 cards dealt from a real pack (at most four of a rank) and chosen by a measured band; level 5 lets an open card lift with the one card still lying on it; level 6 adds a shelf of five always-open spare cards under (or beside) a five-row pyramid; level 7 is the classic seven-row, 28-card pyramid, where sideways the buttons stand in a column beside it; level 8 is five rows with three columns of two spare cards, only the front card of a column open (beside the pyramid sideways, under it on a phone); a lifted pair fades and the cards it opened pulse, with a "pairs open" status line and a corner index on every card; exact clearing-route Hint with dead-end recovery, free Undo/Start over and spoken rank guide; touch only, no stock

## Design notes

*Touch/mouse only · complements to thirteen, planning and revision.* Lift two exposed cards whose ranks total thirteen, or an exposed king alone, to uncover and clear a small pyramid. A card is exposed only when both cards covering it have gone. All ranks are face-up; the visible guide and spoken support explain A = 1, J = 11, Q = 12 and K = 13. Clear the pyramid to finish through the shell with one sticker, including with help.

Eight levels use 3/4/5/6/5/5/7/5 rows with 6/10/15/21/15/20/28/21 cards (level 6's twenty are five rows plus a shelf of five spare cards that are never covered, so a copy can be saved or spent there; upright the shelf is a row under the pyramid, sideways a column at the right; level 7 is a full seven-row pyramid of 28 cards under the strict rule, band 30–70%, with the three buttons in a column left of it when sideways rows would be under 64 apart; level 8 is five rows plus three columns, each a back card lying under a front card, so a spare is open only once the one in front has gone, band 30–70%, and tapping a covered back card says to remove the front one first, with no miss). Seeded generation assigns complementary ranks along a legal clearing order; an exact remaining-card mask solver proves a clearing route and accepts alternative solutions. These are finite practice pyramids, with no stock or draw pile, and ranks come from a real pack: never more than four of a rank. A deal dial draws up to 40 candidates from the round's one seeded rng and keeps the first whose exact random-play clear rate (the chance a player who lifts any legal pair clears it) is in the level's band: level 1 at least 95%, level 2 from 50% to under 95%, level 3 40–80%, level 4 (six rows, 21 cards) 30–75%, level 5 (five rows) 40–80%, else the closest. Undialled, a six-row candidate clears 59% of random play at the median and 73% hold a dead end; dialled, every seed lands in band and at most 61 positions are reachable. Level 5, *Lift the cover*, adds one rule: an open non-king card may lift with the one card that is the only one still lying on it, when they make thirteen (a wrong sum is a miss as usual). The deal walks backward with cover-lift steps, so the top card need not be a king and most deals cannot clear without a lift; undialled the rule makes deals easy (the median candidate clears 100% of random play), so the 40–80% dial does the work (median 67%). Tapping a covered card whose one cover is open says to choose that cover first, and the selected card's lift candidates get a thin purple outline. Kings appear only where the clearing order forces them, plus at most one by chance (15%) at levels 2–3; level 1 is always exactly two pairs and two kings (the top king and one forced). Deeper rounds add cover relationships and choices, with no timer or loss screen.

A lifted pair rises, drifts toward its partner and fades over 0.3 seconds (untappable while it leaves); each newly uncovered card swells once with a soft pentatonic bell step. The status line reads "N pairs open" (plus "· a king can go alone"), and every card has a top-left corner index (rank, with 1/11/12/13 under A/J/Q/K) so a covered face card keeps its value in landscape (six rows keep upright rows 104 apart; in landscape they are about 60 apart and the index carries covered cards). Undo, Start over and hint recovery stop any lift or pulse still running and put the cards back in place.

Tap one exposed card and its complement; tap the selected card again to cancel. Covered-card taps explain the covers without counting a miss. A mismatched exposed pair removes nothing, gives a gentle boing and spoken reminder, and counts one miss; two consecutive mismatches show a counted hint. Hint outlines a next removal on a clearing route. Repeating it while visible adds no help. A legal removal that leaves a dead end is free exploration; Hint returns to the nearest solvable ancestor and outlines a clearing move, counting support once. Undo and Start over are free revision and preserve misses and hints. The how-to ghost finger plays through real taps using the same solver. Co-play predicts what a pair will uncover; off-screen play uses numbered paper cards. No controller, couch course or saved unfinished deal is built in this slice.
