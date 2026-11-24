# 2026-11-24 — Monster Munch level 5 overfeed and hand back (PR #2117)

**Changed:** Monster Munch level 5 (number-only exact order, ages 3–7) sets `overfeed: true`: a monster accepts a food past its order (no `munch.enough` miss); at the bell `overfed()` returns the extras to the tray with `munch.hand-back`, not a miss, and she rings again. A bell with too few is still a miss; levels 4 and 6 still refuse as a miss. Voice line, how-to card (level 5 split from 4) and a unit test added.
**Ran:** typecheck; monster-munch unit tests (84); full `npm test` passed; one headless browser play of level 5 (overfed by 2, the bell handed exactly 2 back with 0 misses, the second bell won, an early bell on the next round counted 1 miss).
**Not run:** `fingerdemo` (the bot never overfeeds and is unchanged; the existing ghost-finger unit test covers it), `npm run build`, offline.
