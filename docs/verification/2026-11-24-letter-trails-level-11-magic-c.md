# 2026-11-24 — Letter Trails level 11 Magic c (PR #2122)

**Changed:** Letter Trails level 11 (school 7–11): little a, d, g as a magic-c curve then a stem; the in-frame corridor (levels 10 and 11) narrowed from 0.075 to 0.06, so level 10 behaves differently too.
**Ran:** typecheck; unit tests for `src/games/letter-trails`, `src/learning/tracing` and `src/content` (with `npm run game-docs`); browser suite `letters10` (also in `letters`) on a 390×844 phone viewport, playing level 11 "a" and "g" (g with a wander and a hint): passed, 4 checks.
**Not run:** full build, other suites, device speech; stroke forms not checked against the HWT lowercase chart.
