# Tide Line

<!-- generated: from src/games/tide-line; edit the text below the end mark (npm run game-docs) -->

**ID:** `tide-line` · **Land:** Bubble Beach · **Ages:** lap–school · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** science, patterns, prediction

| Band | Levels, easiest first |
| --- | --- |
| lap | 1 |
| toddler | 1–2 |
| preschool | 2–3 |
| pre-K | 3–5 |
| school | 4–6 |

| Level | Plays like |
| --- | --- |
| 1 | Come in, go out: pull the sea up the sand and let it go |
| 2 | Stop at the line: put two pails above the seaweed line |
| 3 | Read the line: with the sea out, put a pail, a flag and a towel where they stay dry; then a windy-day line |
| 4 | In, out, in, out: finish a day's picture strip of the sea |
| 5 | Pool time: slide along the day, and mark a time the rock pool shows and a time the sea covers it |
| 6 | Read the chart: put the rock pool, the boat and the picnic on times that fit the line of the island's tide |

<!-- end generated -->

**Starts as:** pull the foam crest and the sea comes up the sand, let go and it eases back out

**Grows into:** levels 1–2: pull the sea in and out while the shells, anemone, sea star and hermit crab answer (nothing wrong; lap: a tap sends one whole wave), then drop a pail and the sea stops at the seaweed line, dry or floated (a floated pail is fetched back by the pet; the second miss glows the line). Level 3, with the sea out, drag a pail, a flag and a towel onto the sand by the seaweed line and tap the wave (a wet thing floats and is fetched back; round 2 adds a higher windy-day line); level 4, complete a strip of four shore pictures in, out, in, out from three cards (in, out, halfway). Level 5, slide a marker along the island's day (or tap sunrise, high sun, sunset or stars) and flag a time the rock pool shows, then a time the sea covers it; level 6, read the chart: the island day drawn as a line of water height over time with four windows, and a rock pool, a boat and a picnic card each dragged (or tapped) onto a window where the line fits it. Bubble Beach

## Design notes

*Levels 1–4 · after the oceans study; [definition](../definitions/tide-line.md).* A sandy shore with a foam-edged sea. Pull the sea up the sand by its foam crest (custom pointer pull, from x 230 rightwards so the pet's corner stays clear) and let go: it eases back over 1.5 s. A pentatonic marimba step sounds at each fifth of the sand, and the shore answers: a shell, an anemone (closes out of water, opens in it), a sea star and a hermit crab sit on rocks at heights 0.22–0.48, and a gull calls once. Art is shared in `src/art/shore.ts`.

Levels (lap 1, toddler 1–2, preschool 2–3, pre-K 3–4): 1 "Come in, go out": two full cycles (the sea above 0.6, then back below 0.1) finish it; nothing is counted, and on the lap band a touch anywhere (sea, sand or sky) sends one whole wave (`lapWaveH`, `LAP_WAVE`, `LAP_PEAK`, `lapGrab` in `logic.ts`): a tap while a wave runs gets a splash, or pokes the creature under it, and never restarts it; a tap while a pulled sea slides back starts the wave from the water's current height; the ghost finger shows a tap, and the lap line is "Tap anywhere, and in comes the sea!" (`tl.instruct.1.lap`). 2 "Stop at the line": two pails, one after the other, from a tray on the sea-side rocks at the right; a seeded seaweed (wrack) line sits at 0.45, 0.55 or 0.65 of the sand (the first round of a session 0.55). Drop a pail and only then the sea comes in to the top of the line: a dry pail goes on to the next; a wet pail floats, one miss, and the pet fetches it back to the tray. 3 "Read the line": with the sea out, drag a pail, a flag and a towel from the sea-side rocks onto the sand (touch boxes 120 wide, kept clear of the corner buttons and the pet), then tap the wave button; the sea comes up to the top of the highest seaweed line. Each wet thing floats (one miss each) and is fetched back; dry ones stay. A wave tapped before all three are placed is not counted. Round 2 adds a higher windy-day line (the first line + 0.15, at most 0.85) which the sea reaches. 4 "In, out, in, out": two strips of four shore pictures alternating in and out (seeded start and gap; the first strip of a session is authored: in, out, in, gap), three cards (in, out, halfway); the strip is one row of four in portrait too. A wrong card is a miss with a spoken reason (the halfway picture, or what comes after or before in and out); tapping a strip picture says in or out and is never counted.

Misses and hints: level 1 has none. A floated pail is a miss; the second miss on a pail glows the line and the dry sand (one hint, at most one per pail). The pause sheet's Show me (labelled "Show me") glows the same; asked again, the pet carries the pail above the line. Level 3 glows the line the sea will reach after two misses in a round or on Show me; asked again, the pet carries the unsettled things to dry spots (one hint per round). Level 4 glows the right card after two misses or on Show me; asked again, the pet taps it. Nothing is kept; one sticker per round. Level 6 is below. Not built: level 7 (review-gated). Off-screen line withheld until the Find the Line card's safety review.

**A right card never holds the next strip (U7 fix batch 4, 2026-11-11).** At level 4 `tl.right` starts after the card's glide; after a 0.6 s look at the finished strip the next strip is shown and its cards open while the line plays. `tl.next-strip` is said when the lesson ends, and is skipped (kept, not dropped) if she tapped a card or asked for a hint meanwhile. On the last strip the line is heard out.

**Level 5, Pool time (built 2026-11-18, PR #1805; pre-K 3–5, school opens at 4–5 and becomes 4–6 with level 6).** The scene is `day.ts`; the island-day rules shared with level 6 are in `logic.ts`: the curve, four stops (sunrise, high sun, sunset, stars), a window judged at its two ends and middle, and thresholds pool rim 0.20 (the pool shows), pool covered 0.30, boat 0.45 and picnic shelf 0.40 (the last two for level 6). She slides a round marker along the day strip, or taps a stop; the shore above shows the sea at that time continuously while sliding, and letting go settles on the nearest of four stops. A flag button, dim until a stop is chosen, marks it. Asks: a time the rock pool shows, then a time the sea covers it; either of the two fitting stops is accepted for each. Sliding, tapping and flagging the other state are exploration: named aloud, never a miss, and level 5 counts no misses. Help (Show me) lights both fitting stops (one hint per ask); asked again it moves the marker to the first fitting stop and flags it. Both flags are revisited before the round ends. Authored first round (and the demo) starts low with high 0.55; later rounds draw high from 0.55 and 0.65 and which state comes first. The how-to goal line is general ("…work out where the water will be") because this level has no seaweed-line task.

*Departures from the definition.* The flag button has a fixed place (right end of the strip in landscape, under the track when stacked), not beside the selection. "Covered" is water at or above the pool's far rim (0.30) for the whole window, a threshold the definition left to the build. Night is drawn as stars, not a moon, because the game's speech test forbids naming the moon.

**Level 6, Read the chart (built 2026-11-18, PR #1808; school 4–6, pre-K stays 3–5).** The scene is `chart.ts`, beside `day.ts`; the rules are `ChartRound`, `jobsFor`, `JOB_MARK` (each job's reference height and the side the line must keep to) and `chartLayout`/`windowAt` in `logic.ts`, over the same island-day curve, `fits` and `fitting` as level 5. The chart is titled "Island tide" with the axes "Time" and "Water height", sky icons along time and a low and a high shore silhouette on the height scale, and has four windows. One job card at a time (rock pool, boat, picnic; authored order on a session's first round and in demos, shuffled on seeded rounds) is dragged onto a window, or tapped and then the window tapped. A fitting window pairs the card with its time-of-day icon in a finished row (cards may share a window). A clashing window is one miss, a boing and the reason ("…the line is too low/high there"), and the card floats home. The second miss on a card, or Help, lights both fitting windows (one hint per card); Help again places the card on the earlier one. Looking is free: touching a window alone, or hovering a dragged card over one, moves a small shore picture to that time and a dot on the line to the same time, never counted; a card let go off the windows goes home uncounted. The three choices are reviewed before `ctx.finish`. Glow lines say only "The line is low/high at the glowing times"; the boat and picnic evidence lines were written to match the definition's pool example.

*Departures and choices the definition left open.* The windows are whole columns of the chart, so each is a tall target, with the short shaded interval inside. The current job's reference mark is a dashed line at its height with small arrows on the side the line must keep to, and the job's picture at the right end. The level 6 shore swaps level 5's rock for a picnic on a rock shelf and adds a paper boat that rests tipped on the sand until the water reaches its inlet. Review fixes: the next card's fade cannot be left faint by a quick grab, and the chart's mark changes when the next card is served, not mid-flight.
