# 2026-11-20 — Bunny Patches levels 1–3 definition (PR #1907)

**Changed:** Defined Bunny Patches (PP3) as `bunny-patches`: pre-K 4×4 with a given bunny, school 5×5 and 6×6, the rules, the miss and hint rules, the human-solver gate, upright layout and Puzzle Peaks as home. Queued its build in Next ten and updated the docs map, puzzle-pages study and study backlog.
**Ran:** A brute-force solver over the three example boards (the 4×4 has two arrangements and the given bunny picks one; the 5×5 and 6×6 boards, found by a seeded search, each have exactly one solution). Counted Puzzle Peaks' registered games (17) from `lands.ts`. Links and diff checks.
**Not run:** Typecheck, unit tests, build and browser suites (outside the docs-only tier). Page counts per band, patch-size balance and the layout numbers are build checks.
