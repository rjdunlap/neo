# Fossil Dig

<!-- generated: from src/games/fossil-dig; edit the text below the end mark (npm run game-docs) -->

**ID:** `fossil-dig` · **Land:** Tinker Lab · **Ages:** pre-K · **Challenge:** noticing · **Plays by:** touch · **Ghost finger:** yes

**Skills:** observation, comparing, evidence, recording

| Band | Levels, easiest first |
| --- | --- |
| pre-K | 1–2 |

| Level | Plays like |
| --- | --- |
| 1 | A leaf left a clue: brush, mark where, match the shape |
| 2 | Look more closely: brush, mark where, match the edge up close |

<!-- end generated -->

**Starts as:** rub the dust off a stone in one of three dig squares until a leaf print shows, tap the flag of the square it was found in, then tap the pinned reference leaf it matches and Check

**Grows into:** level 2 matches by the leaf's edge, toothed or smooth, read with a magnifier; a wrong flag or a wrong leaf is a gentle miss

## Design notes

*After the NPS Florissant leaf-margin exercise and digital dig toys such as Sago Mini Dinosaurs; [definition](../definitions/fossil-dig.md).* Three dig squares sit on a cliff shelf (a red circle, a blue triangle and a yellow square flag), with a dusty stone in one of them. She rubs the dust off with a finger (brush reach 55 screen units; the print shows once 70% of its cells are clear, always within about twelve pats) and a leaf print appears. She taps the flag of the square it was found in, then taps the pinned reference leaf it matches and Check. Level 1 *By its shape*: star (lobed) against ribbon (long and plain). Level 2 *By its edge*: saw-star (toothed) against star (smooth), with the same outline, so the shape cannot decide; look-closer badges under each card and a touch on the shown stone open the print's edge in a magnifier. Three invented leaves, four authored cases; the first round of each level per session is authored (level 1 the star in the blue square, level 2 the saw-star in the yellow square). A finished round slides the record card into the field notebook (top right, left of the shell button) and gives one sticker.

Misses: a wrong flag and a wrong Check (a wrong leaf). Free: brushing, flag, leaf or Check taps that come too early (the card wiggles and the pet says the step), Check with nothing picked, swapping or returning a leaf, and the magnifier. Two misses on a step glow that step's answer, which is one hint for the step; "Show a hint" counts at most once per step (during brushing it only repeats the words; at level 2 it opens the print's edge only). Brushing is never a miss. The pet says one sentence when the print shows ("A leaf pressed into mud, and the mud became stone"); the edge line ("toothed" or "smooth") is spoken only at level 2. Start again rebuilds the round and keeps its misses and hints (old continuations are stopped). Nothing is saved, filed in the journal or shown as real; no couch play. Layout: squares 290x230 landscape and 236x200 portrait, the stone scaled (0.7 / 0.57) to sit inside its square; the record card is horizontal in both orientations. Not built as drawn in the definition: a separate magnifier badge on the stone (a touch on the stone opens it). The ghost-finger bot plays both levels. The brushing sound is `sfx.brush()`. Music: the land's quiet paint style keeps playing. Co-play: one brushes, the other picks the flag and the leaf, then swap; with look-alike leaves both say which edge they see before Check. Off-screen: with a grown-up, look at one fallen leaf's edge outside, say "smooth" or "teeth", and put it back.

**The find's line never holds the flags (U7 fix batch 25, 2026-11-12).** `fossil-dig.found` starts and the flags open at once, `instruct-where` said when the line ends, by the guide, or at a wrong flag tap in place of a miss (the right flag goes ahead). A right flag's `where-recorded` starts and the like cards open at once, the shape/edge instruction waiting the same way; leaf taps leave it waiting and Check says it (not judged). At level 2 the magnifier's spoken edge line is skipped while an instruction waits so it does not cut `found`. Show a hint and restart drop the waiting instruction. The finished find's `match-*` is heard out. The ghost finger waits for it.
