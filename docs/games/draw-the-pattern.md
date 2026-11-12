# Draw the Pattern

<!-- generated: from src/games/draw-the-pattern; edit the text below the end mark (npm run game-docs) -->

**ID:** `draw-the-pattern` · **Land:** Painted Canyon · **Ages:** lap–pre-K · **Challenge:** hands · **Plays by:** touch · **Ghost finger:** yes

**Skills:** fine-motor, writing, patterns

| Band | Levels, easiest first |
| --- | --- |
| lap | 1, 10 |
| toddler | 1, 10, 2, 3 |
| preschool | 3–5 |
| pre-K | 5, 9, 6, 7, 8 |

| Level | Plays like |
| --- | --- |
| 1 | Make a mark: any touch draws on the paper, four touches finish a strip |
| 2 | Straight across, straight down: a long line, then short lines from the top |
| 3 | Zigzag and wave: carry on the pattern the pet starts |
| 4 | Round and round: a circle either way, then a row of loops |
| 5 | From memory: the dashes fade, dots show where the pattern turns |
| 6 | Cross, square, triangle: each line from its own ring, in order |
| 7 | What comes next? Two kinds take turns; draw the one that continues |
| 8 | Two, then one: patterns like hill, hill, dip; draw what comes next |
| 9 | Slanting lines: rain from a cloud, then an X, each line from its own ring |
| 10 | Dot to dot: tap the shining dot and the crayon draws to it; a line, then a zigzag |

<!-- end generated -->

**Starts as:** the pet starts a line or pattern on a long paper strip with a crayon and she carries on from the green ring, and the strip rolls up into the host's picture

**Grows into:** free marks, a long line and short down-lines, zigzags and waves, a circle (either way round) and loops, dashes that fade to stepping stones, slanting lines and an X, a tap-the-shiny-dot line and zigzag (lap and toddler), a cross, square and triangle, then continuing a pattern of strokes by choosing between two faint candidates; a stroke that leaves the line stops the crayon with a boing, no clock

## Design notes

*After occupational-therapy pre-writing progressions; [definition](../definitions/draw-the-pattern.md) Deep dive: [draw-the-pattern.md](../deep-dives/draw-the-pattern.md).* A long paper strip lies across the screen; the pet's crayon draws a line or pattern by itself, then holds the crayon out and she carries on from the green ring with Letter Trails' tracer (`sampleStroke`, `advanceTrace`, `offTrail`), a note climbing with each checkpoint; there is no clock. At lap levels 1 and 10 play (2026-10-24, [PR #942](https://github.com/rjdunlap/neo/pull/942), then level 10 in [PR #1306](https://github.com/rjdunlap/neo/pull/1306)): tracing along dashes needs a finger that stays down, which starts at toddler, so lap's second level is taps. Her strokes turn into the picture, one of three pieces per stroke chosen by the round's seed: level 1 flowers (meadow), fish (pond) or birds (sky); a long line becomes ground, a washing line or a road with a car; down-lines a fence, rain from a cloud or candles on a cake; a zigzag mountains, crocodile teeth or a crown; a wave the sea, a snake or a kite's tail; a circle the sun, a balloon or a cart wheel; loops sheep, clouds or chimney smoke; level 6 swaps whole sets (window, house and roof; ribbon, present and bow; mast, cabin and sail), and the bridge or flags remain at levels 7–8; the finished strip rolls up by squashing and the piece appears. Levels: 1 Free marks (tap or scribble, never a miss), 2 A long line and short down-lines, 3 Zigzag and wave, 4 Circle and loops (the circle either way round; four loops, the pet drawing one, each roll 0.72 wide so a lobe's back stays two corridors from the next), 5 Stepping stones (zigzag and wave over dashes that fade to stones, five units with the pet drawing two; the tracer's corridor stays), 6 Cross, square and triangle (no pet part, so the first stroke is shown faintly first), 7 Hill, dip, peak or valley (an AB or AAB/ABB pattern of strokes on seven units 3.2/7 wide), 8 the same on nine units 3.2/9 wide, 9 Slanting lines (pre-K, played after 5 and before 6: rain from a cloud, three short `\` lines from rings with the pet drawing the first, then an X drawn `\` then `/` that becomes a kite's crossed sticks or a treasure mark; corridor 0.15, strays as at 3–6), 10 Dot to dot (lap and toddler, entry level placed second: six dots a unit apart, at least 120 units at the smallest strip, first on a long line and then on a zigzag's peaks and troughs; the pet draws dot 1 to 2, the next dot shines as a yellow disc as big as its 120-unit tap area, and a tap on it draws the crayon there in 0.4 s; a drag along the dashes works too; a tap elsewhere is a soft tick and a stray drag counts nothing, so there are no misses or hints and Hint repeats "Tap the shiny dot!"; corridor 0.18). At 7–8 two faint candidates for the next stroke are offered and every pair is "one goes up, one goes down" so the first move tells them apart and the candidates never share a corridor at narrow units (hill/dip, peak/valley, peak/dip, hill/valley); same-direction pairs such as tall/short and loop/hill could not keep two corridors apart and were dropped from the definition. The pet says each unit's word during its part at 7–8. Undecided ways (the circle, the candidates) wait at the last checkpoint where both paths are within a corridor (`forkOf`). Replaying the pet's part is a tap on the picture, not on the pet (the corner guide belongs to the shell and repeats the instruction). Lap 1 and 10 (order 1, 10), toddler 1–3 and 10 (order 1, 10, 2, 3), preschool 3–5, pre-K 5–9 (order 5, 9, 6, 7, 8); no school level. A miss is a drag that leaves the corridor (levels 3–8, one per drag; the crayon waits where it stopped, a boing, and the pet says it, progress kept); at 7–8 it is also starting toward the wrong candidate (one miss, the stroke resets, and the pet says "Look at the pattern again. Next comes a <kind>"). Levels 1–2 never miss. Every second miss lights the next checkpoints and a paper bee flies them on lift; each glow is one hint, and the pause sheet's "Show a hint" gives the same. One sticker per round; the strip is not saved, there is no couch play, and the music is the land's `STYLES.paint`. Off-screen: a fat crayon on a long strip of paper, a zigzag for her to carry on.

**A finished strip never holds the next one (U7 fix batch 6, 2026-11-12).** The strip's line starts as it rolls into the picture, and the next strip unrolls and the pet's demonstration starts with it. The demonstration still holds input (at levels 7–8 its spoken units cut the line), and the instruction at its end is unchanged. The last strip's line is heard out before the closing line.
