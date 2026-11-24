# 2026-11-23 — Rain Garden level 6 definition (PR #2074)

**Changed:**
- `docs/definitions/rain-garden.md`: level 6, *rain again on wet ground* — two rains on level 4's two-bed board with storage carried between them, a two-row pond tray, an optional guess (more or the same, never a miss), exploration accounting (misses 0), school band 3–6, 11 new voice lines and the measured layouts.
- The weather-water study's slice 6, the study backlog row, the recommendation row and the game page's Grows into line.
- READY: Next ten line 410 (this definition) removed; the level 6 build line added.

**Ran:** `node scripts/check-links.mjs` and `git diff --check`. A scratch layout test applying level 4's layout-test rules at its eight views passed the level 6 coordinates; it was deleted, not committed.

**Not run:** code checks (docs only; nothing built). No game was opened or played. No coverage-summary row changed (no suite ran).
