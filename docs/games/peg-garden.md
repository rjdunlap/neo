# Peg Garden

<!-- generated: from src/games/peg-garden; edit the text below the end mark (npm run game-docs) -->

**ID:** `peg-garden` · **Land:** Bubble Beach · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** cause-and-effect, tracking, counting, aiming

| Band | Levels, easiest first |
| --- | --- |
| lap | 8, 1 |
| toddler | 8, 1, 2 |
| preschool | 2–4 |
| pre-K | 3–7 |

| Level | Plays like |
| --- | --- |
| 1 | Tap the top to drop a pearl through the flowers |
| 2 | Make every flower bloom |
| 3 | Bloom the four orange flowers (counted aloud) |
| 4 | Aim the launcher to hit a numbered flower: "hit 3" |
| 5 | Hit numbered flowers 1, 2, 3 in order |
| 6 | Into the cup: aim the pearl into the cup with that many dots |
| 7 | Plant a bud: drag a seed onto a marked spot so the dropped pearl rolls into the cup |
| 8 | Four huge flowers: any pearl that touches one makes it bloom |

<!-- end generated -->

**Starts as:** tap the top and a pearl tumbles through flower pegs on a seeded board and backdrop, then rolls into a shell tray

**Grows into:** bloom every flower, the four orange ones, aim for a numbered flower, then 1, 2, 3 in order; four huge buds for the youngest (level 8); pre-K top: aim into the cup with that many dots (level 6), then plant a bud so the pearl reaches the friend's cup (level 7)

## Design notes

*After Peggle and pachinko.* A pearl drops through a sea garden; each flower bud it touches blooms and chimes, and nothing is lost. Later levels ask for every flower, the orange ones, then aiming a launcher at a numbered flower and at 1, 2, 3 in order. `engine/ball.ts` simulates every board, so each numbered peg is reachable by some aim. Level 8, *Big buds* (the lap and toddler entry; lap order 8, 1 and toddler 8, 1, 2): four huge buds (radius 60) sit in a diamond, every touch drops a pearl and blooms one, with no misses or hints. Level 6, *Into the cup* (pre-K): four cups along the sand show 1–4 dots and the pet asks for one ("Put the pearl in the cup with three!"), three asks per round, each a different cup; another cup is a miss and its count is said, two misses show the full path and glow the asked cup, and the cutoff counts nothing. Level 7, *Plant a bud* (pre-K top; the pre-K window is now 3–7): one fixed pearl button sits on the ledge and a friend's cup (with a fish) is missed as the board stands. She drags one of two sprouted seeds from its dish onto one of 3–5 marked white rings (at least 120 board units apart; it snaps to the nearest free ring within 100, else goes back to its dish, and planted seeds can be moved again), then taps the pearl to run it (deterministic, no drift). A run with nothing planted is a free look, not a miss; a planted run that misses counts a miss; after two misses a glowing seed outline sits over one ring that works alone and seeds on other rings go back to their dishes. The round ends when the pearl rolls into the cup, leaving a faint trail after each run; only the seeds and the pearl button take touches. Otherwise it stays at one lap level. The bloom level always finishes: after two pearls in a row that wake no new flower (the same spot tapped again and again), the next tap's pearl is let go over a waiting flower instead of the tapped spot, and at that level there is no drift and the hint adds a ring on the ledge at that spot. On the island the whole screen takes touches (the sea beside the board maps to the nearest point of the ledge), and every touch at levels 1–3 makes a ring of bubbles; a touch while a pearl falls makes no second pearl (at level 1 it queues the next, one at most, never past six). Dropped pearls step at a fixed 1/240 s so play matches the simulation; aimed levels and couch keep frame-step physics. A cancelled aim fires nothing. At the numbered levels (4–5) only the asked number opens: another numbered bud chimes and wiggles, and plain buds still bloom; after each aimed shot its real path stays as faint dots until the next shot starts (feedback only, counts nothing). Finished pearls roll into a scalloped shell tray in the sand (twelve visible slots) and pour back up at the finish. Each seeded round draws one of four board shapes (rows, diamond, hourglass, waves) over one of three backdrops (shallows, reef, kelp forest); the newer shapes keep buds at least 64 units from the side walls. Couch play keeps the first look (rows, shallows) with no tray or trail, so its boards are unchanged. Known open: on the `rows` shape a pearl dropped near the wall can wedge until the 10-second cutoff ends the shot ([dive gap 12](../deep-dives/peg-garden.md#the-game-today)).
