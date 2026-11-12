# Tide Line

<!-- generated: from src/games/tide-line; edit the text below the end mark (npm run game-docs) -->

**ID:** `tide-line` · **Land:** Bubble Beach · **Ages:** lap–pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** science, patterns, prediction

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–4 |

| Level | Plays like |
| --- | --- |
| 1 | Come in, go out: pull the sea up the sand and let it go |
| 2 | Stop at the line: put two pails above the seaweed line |
| 3 | Read the line: with the sea out, put a pail, a flag and a towel where they stay dry; then a windy-day line |
| 4 | In, out, in, out: finish a day's picture strip of the sea |

<!-- end generated -->

**Starts as:** pull the foam crest and the sea comes up the sand, let go and it eases back out

**Grows into:** levels 1–2: pull the sea in and out while the shells, anemone, sea star and hermit crab answer (nothing wrong; lap: a tap sends one whole wave), then drop a pail and the sea stops at the seaweed line, dry or floated (a floated pail is fetched back by the pet; the second miss glows the line). Level 3, with the sea out, drag a pail, a flag and a towel onto the sand by the seaweed line and tap the wave (a wet thing floats and is fetched back; round 2 adds a higher windy-day line); level 4, complete a strip of four shore pictures in, out, in, out from three cards (in, out, halfway). Bubble Beach

## Design notes

*Levels 1–4 · after the oceans study; [definition](../definitions/tide-line.md).* A sandy shore with a foam-edged sea. Pull the sea up the sand by its foam crest (custom pointer pull, from x 230 rightwards so the pet's corner stays clear) and let go: it eases back over 1.5 s. A pentatonic marimba step sounds at each fifth of the sand, and the shore answers: a shell, an anemone (closes out of water, opens in it), a sea star and a hermit crab sit on rocks at heights 0.22–0.48, and a gull calls once. Art is shared in `src/art/shore.ts`.

Levels (lap 1, toddler 1–2, preschool 2–3, pre-K 3–4): 1 "Come in, go out": two full cycles (the sea above 0.6, then back below 0.1) finish it; nothing is counted, and on the lap band a touch anywhere (sea, sand or sky) sends one whole wave (`lapWaveH`, `LAP_WAVE`, `LAP_PEAK`, `lapGrab` in `logic.ts`): a tap while a wave runs gets a splash, or pokes the creature under it, and never restarts it; a tap while a pulled sea slides back starts the wave from the water's current height; the ghost finger shows a tap, and the lap line is "Tap anywhere, and in comes the sea!" (`tl.instruct.1.lap`). 2 "Stop at the line": two pails, one after the other, from a tray on the sea-side rocks at the right; a seeded seaweed (wrack) line sits at 0.45, 0.55 or 0.65 of the sand (the first round of a session 0.55). Drop a pail and only then the sea comes in to the top of the line: a dry pail goes on to the next; a wet pail floats, one miss, and the pet fetches it back to the tray. 3 "Read the line": with the sea out, drag a pail, a flag and a towel from the sea-side rocks onto the sand (touch boxes 120 wide, kept clear of the corner buttons and the pet), then tap the wave button; the sea comes up to the top of the highest seaweed line. Each wet thing floats (one miss each) and is fetched back; dry ones stay. A wave tapped before all three are placed is not counted. Round 2 adds a higher windy-day line (the first line + 0.15, at most 0.85) which the sea reaches. 4 "In, out, in, out": two strips of four shore pictures alternating in and out (seeded start and gap; the first strip of a session is authored: in, out, in, gap), three cards (in, out, halfway); the strip is one row of four in portrait too. A wrong card is a miss with a spoken reason (the halfway picture, or what comes after or before in and out); tapping a strip picture says in or out and is never counted.

Misses and hints: level 1 has none. A floated pail is a miss; the second miss on a pail glows the line and the dry sand (one hint, at most one per pail). The pause sheet's Show me (labelled "Show me") glows the same; asked again, the pet carries the pail above the line. Level 3 glows the line the sea will reach after two misses in a round or on Show me; asked again, the pet carries the unsettled things to dry spots (one hint per round). Level 4 glows the right card after two misses or on Show me; asked again, the pet taps it. Nothing is kept; one sticker per round. Not built: levels 5–7 (they need their own definition). Off-screen line withheld until the Find the Line card's safety review.

**A right card never holds the next strip (U7 fix batch 4, 2026-11-11).** At level 4 `tl.right` starts after the card's glide; after a 0.6 s look at the finished strip the next strip is shown and its cards open while the line plays. `tl.next-strip` is said when the lesson ends, and is skipped (kept, not dropped) if she tapped a card or asked for a hint meanwhile. On the last strip the line is heard out.
