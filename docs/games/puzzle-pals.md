# Puzzle Pals

<!-- generated: from src/games/puzzle-pals; edit the text below the end mark (npm run game-docs) -->

**ID:** `puzzle-pals` · **Land:** Puzzle Peaks · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** spatial-reasoning, part-whole, fine-motor

| Band | Levels, easiest first |
| --- | --- |
| lap | 8, 1, 2 |
| toddler | 2–4 |
| preschool | 4–6 |
| pre-K | 5–7 |
| school | 6–7 |

| Level | Plays like |
| --- | --- |
| 1 | Finish a picture: one half is already in place |
| 2 | Put two halves together over a faint picture |
| 3 | Three strips over a faint picture |
| 4 | Four pieces over a faint picture |
| 5 | Six pieces with only an empty frame |
| 6 | Nine pieces with only an empty frame |
| 7 | Twelve pieces with only an empty frame |
| 8 | One big piece at a time: a touch anywhere hops it into a two- or three-piece picture |

<!-- end generated -->

**Starts as:** at lap, one big piece beside the frame that a touch anywhere hops into place, then the next piece of a two- or three-strip picture; at toddler, tap or carry a piece to finish a two-piece picture

**Grows into:** two pieces with nothing in place, then three to twelve pieces, first over a faint picture, then an empty frame with marked outer edges and spoken spatial hints; visible landmarks in every piece built ([PR #292](https://github.com/rjdunlap/neo/pull/292))

## Design notes

Level **8, One big piece at a time** (built 2026-11-13, lap's first; lap order 8, 1, 2, entry level 8) sets one piece at the frame's own size beside the frame (right of it sideways, under it upright). A touch anywhere (the piece, the frame, the background, a placed piece or any let-go of a drag) hops it into its place, and the next piece of a two- or three-strip picture (the seeded RNG picks) slides in from the right edge. Nothing can be a miss or a hint. Levels 1 and 2 are toddler's from here, and their opening line says "Tap a piece, and it hops onto the picture where it matches!" (`puzzle.lap`, `puzzle.tap`) instead of "Drag".

Twelve code-drawn scenes (a cow on the farm, a duck in the pond, a pig in the mud, a cat at night, a dog in the rain, and so on) are rendered once into a texture and cut into 2 to 12 pieces. Faint pictures guide the early levels; later ones show only an empty frame. On the one- and two-piece pictures (levels 1–2, the lap levels) a piece that is tapped, picked up and let go where it was, hops into its place by itself (2026-10-24, [PR #942](https://github.com/rjdunlap/neo/pull/942)); bigger puzzles keep the carry. At levels 5–7, thick flat rims mark outer sides (two at a corner). Dropping off the frame is exploration; a wrong place is a gentle miss. After two misses, the same waiting piece and destination glow while the pet names its position: corner first, then an edge beside a placed piece, then another adjacent piece. A successful placement clears the hint; each two-miss run charges one hint. The finished picture comes alive and the animal says hello. A round draws any of the twelve; stickers and the map icon always show one of the first six, so a saved sticker never changes picture.

**Built 2026-10-14 ([PR #292](https://github.com/rjdunlap/neo/pull/292)):** all twelve play scenes add seeded kites, different middle-edge landmarks and different foreground silhouettes; moon and rainy scenes also have a sky bird. Every piece at existing levels 1–7 has a distinct set of substantial filled visual cues, checked without counting empty drawing bounds. Saved sticker and map-icon art stays unchanged. The box lid remains a separate person-check-dependent proposal ([build note](../archive/COMPLETED-2026-10-09.md#puzzle-pals-visible-cues-and-fairness-2026-10-14)).
