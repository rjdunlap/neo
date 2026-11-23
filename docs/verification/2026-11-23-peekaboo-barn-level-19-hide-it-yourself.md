# 2026-11-23 — Peekaboo Barn level 19, Hide it yourself (PR #2063)

**Changed:** `hide` mode: an animal waits above the middle of three houses, she drags it (or taps it, then a place) to a house, a drop anywhere goes to the nearest house across, and the pet looks in at least one empty house first, then finds it. Three hides, nothing a miss; it hops and calls after 6 s idle, not while held. Toddler reaches 19 through `order` (1, 2, 17, 3, 18, 4, 19, 5) and preschool through 4, 19, 5, 6, 7, 8; no saved level moves.

**Ran:** `npm run typecheck`; full `npm test` (501 files, 18610 tests passed); `BROWSER_SUITE=originals ORIGINALS_ONLY=peekaboo PEEK_LEVELS=19` passed (drag to the first house, tap then tap to the second, a drop in the sky at the right edge went to the third; the seeker looked in empty houses first; score [0,0] and sticker saved); portrait screenshot `test-results/browser/originals/peekaboo-barn-19-portrait.png`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=peekaboo-barn FINGER_LEVELS=19 FINGER_BAND=toddler` finished in 24.5 s. A game-reviewer pass found no blockers; its one fix (the idle hop waits while the piece is tap-held) is in.

**Not run:** build (no shared files or assets changed), other levels, suites or offline.
