# 2026-11-23 — Rain Garden level 5 definition (PR #2059)

**Changed:**
- `docs/definitions/rain-garden.md`: level 5, *three beds downhill* — three sockets in one chain, six authored boards (a fixed tree's bed, a fixed stone path, a four-drop cloud, one or two marked beds), outcome tables for every arrangement, tie-broken hints, composed narration clips, the upright and landscape layouts and the build's rule tests.
- The weather-water study's slice 5, the study backlog row, the recommendation row (its stale "build waits on the developer"), the game page's Grows into line.
- READY: Next ten line 350 (this definition) removed; the level 5 build line added.

**Ran:** `node scripts/check-links.mjs` and `git diff --check`. A scratch simulator (the level-4 `runRoute` rule) produced every outcome table, and a scratch script applying the level-4 layout test's rules at its eight views (four upright) passed the level-5 coordinates for every marked-bed set; neither is committed.

**Not run:** code checks (docs only; nothing built). No game was opened or played.
