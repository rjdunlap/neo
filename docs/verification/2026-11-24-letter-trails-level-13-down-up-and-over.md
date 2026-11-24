# 2026-11-24 — Letter Trails level 13 Down, up and over (PR #2138)

**Changed:** Letter Trails level 13 (school 7–13): little p, r, n, m, h and b in the four-line frame at the little-letter corridor; each is one stroke that goes down its stem, back up it and over in a hump (n, m, h, r) or a bowl (p, b).
**Ran:** typecheck; unit tests for `src/games/letter-trails` and `src/content` (with `npm run game-docs`); browser suite `letters10` on a 390×844 phone viewport, playing level 13 "m" and "b" (b with a wander), plus screenshots of m and b.
**Not run:** `fingerdemo` as a separate pass (the suite's bot route is the same demonstrated trace), full build, other suites, device speech; stroke forms not checked against the HWT lowercase chart.
