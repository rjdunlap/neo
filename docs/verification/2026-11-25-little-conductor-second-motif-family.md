# 2026-11-25 — Little Conductor second motif family (PR #2158)

**Changed:** `MOTIFS` in `src/games/little-conductor/logic.ts` grows from three tunes to six: `skip`, `rock` and `sway` join `hop`, `slide` and `wave`, with the same shape (four pentatonic notes inside one octave, bass on beats 1 and 3, drum on every beat). Rounds draw one by seed, so every level repeats less. No save, layout, voice or accounting change.
**Ran:** typecheck; vitest little-conductor, barrels and game-docs (54 passed): the motif test now covers six distinct tunes, the pace-independence test runs once per tune (same notes and order at either pace, timing differing by 90/60), the 500-run no-skipped-or-repeated-beat test rotates over all six, and the round-seeding tests see all six motifs; prettier; eslint.
**Not run:** browser play, `fingerdemo`, build and the full unit suite (rule-table change only; PR CI runs the full suite).
