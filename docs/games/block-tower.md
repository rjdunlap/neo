# Block Tower

<!-- generated: from src/games/block-tower; edit the text below the end mark (npm run game-docs) -->

**ID:** `block-tower` · **Land:** Tinker Lab · **Ages:** lap–school · **Challenge:** space · **Plays by:** touch · **Ghost finger:** yes

**Skills:** stacking, measuring height, comparing, balance

| Band | Levels, easiest first |
| --- | --- |
| lap | 1–2 |
| toddler | 2–3 |
| preschool | 3–4 |
| pre-K | 4–5 |
| school | 5–6 |

| Level | Plays like |
| --- | --- |
| 1 | Tap to stack blocks, then knock the tower down |
| 2 | Stack until the tower is as tall as a friend, then knock it down |
| 3 | Build up to the flag (3 to 6 blocks), then ring the bell |
| 4 | Compare with Duck's tower: just as tall, one block taller, or one shorter |
| 5 | Which tower will stand? Guess, then let go and see (a guess is never wrong) |
| 6 | Stack blocks out past the table edge to touch the star without tipping |

<!-- end generated -->

**Starts as:** tap anywhere to stack six blocks, then knock down two towers

**Grows into:** tap anywhere for three friend-height towers, up to the numbered kite flag, three distinct reference heights, as tall as Duck's (or one taller or shorter), three unscored predictions of which leaning tower will stand, freely replayable observations and explicit Continue, then two standing stacks reaching a star past opposite table edges in seeded order, one settled block at a time

## Design notes

*After stacking blocks, Jenga and Art of Balance.* Stacking and knocking down, with one explicit balance rule: a block stays up when the middle of it and everything on top is over the block below, and not on its edge (`topples` in `logic.ts`; positions are in eighths of a block, so checks are exact). Levels: tap anywhere to stack six and tap to tumble (lap); tap anywhere to stack as tall as a friend, then tap again to knock it down (no basket or removal here); build up to a kite flag with a matching numeral and countable dots from a basket, tap the tower to take the top off, and ring the bell (too short or too tall is a miss, two bring counting together); compare with Duck's tower (as tall, one taller, one shorter); tap which of two leaning towers will stand; the ropes release automatically (either prediction is unscored; fallen outlines show the unsupported group's middle at or past its supporting edge, and the survivor's green line shows support. At result, the round arrow watches the identical release again and the forward arrow continues; the third Continue finishes once); and reach: drag blocks onto a table so one touches a star line past its edge without toppling (two blocks to half a block out, then three to five eighths; one task reaches left and the other right, in seeded order). A topple is a miss, explained with the middle line; two bring a glowing place for the next block (found by searching every slot) or a glow on the top block to take off. The stars were chosen by counting solutions: one block alone can never reach either. Levels 3–4 draw three distinct reference heights from a seeded shuffled 3–6 deck, without reroll exhaustion; level 4 includes all three relations (targets 2–7). The comparison is to the tower, not Duck’s body. Each sticker round contains two knockdowns at 1, three friend-height knockdowns at 2, three bell-checked tasks at 3–4, three explicitly continued prediction/observation pairs at 5, or two standing star-reaching stacks at 6. At 5 a seeded authored seven-pair pool supplies three distinct clear contrasts for pre-K, or two distinct clear pairs then one equal-reach/different-support pair for school. Mirroring and survivor sides each use a balanced three-value bag; both towers share colors, and every presentation choice is frozen on replay. Replays write no progress. At 6 the top block can be moved or returned to the tray. Drop previews, hints and the demonstration share the -12..8 canonical outward eighth-width slots, reflected about the active table edge before snapping; another pickup waits for landing and its result. A cancelled drag returns to the tray without a miss, and lifting clears the old help position. Off-screen play uses blocks or cups on the floor.


**The friend's cheer never holds the knock (U7 fix batch 23, 2026-11-12).** Level 2's `tower.as-tall` starts as the friend cheers and the knock opens at once; `tower.knock` waits for it or the guide, or is dropped when she knocks (its crash cuts the cheer). Level 1 is unchanged.
