# 2026-11-16 — Peekaboo Barn level 17 Where did it go? (PR #1717)

**Changed:** `went` mode: an animal trots across the front and drops behind one of two houses; she taps where it went. A wrong tap counts a miss and says "Nobody home!"; the second miss counts one hint and wiggles the right house. Lap and toddler reach 17 through `order`; no saved level moves.

**Ran:** `npm run typecheck`; `npm test` (353 files, all pass); `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=17,3` passed (17: both houses empty during the walk, one holds the animal after, two misses and one hint saved, portrait screenshot; 3 as a regression of the suite's changed right-place lookup); `fingerdemo` `FINGER_ONLY=peekaboo-barn FINGER_LEVELS=17 FINGER_BAND=toddler` passed (30.5 s).

**Not run:** `npm run build` (no shared files or assets changed; CI builds), other Peekaboo levels, other suites, offline.
