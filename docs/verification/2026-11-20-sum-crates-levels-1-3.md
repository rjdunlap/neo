# 2026-11-20 — Sum Crates levels 1-3 (PR #1920)

**Changed:** new game `sum-crates` (Lantern Lake), levels 1-3, upright from the first slice: `src/games/sum-crates/`, `lands.ts`, the thumbs table, the registry upright list, browser suite `sumcrates`, how-to card, spoken title clip and game page; `fruit()` in Fruit Sums is exported with a `dots` option.
**Ran:** typecheck; the full unit suite (all passed once the how-to card was shortened and the title clip rendered); `BROWSER_SUITE=sumcrates` (level 1: a full wrong stack is one miss, the identical stack free, a changed one the second miss with one glow hint, a requested hint, finish; level 3: hint, the answer, no misses) and `SUMCRATES_ONLY=upright` (390x844 phone, screenshots read); `fingerdemo` at levels 1 and 3 (ghost finger finished both).
**Not run:** `npm run build` locally (CI builds), the offline suite.
