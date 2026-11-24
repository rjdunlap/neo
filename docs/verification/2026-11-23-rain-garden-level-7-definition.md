# 2026-11-23 — Rain Garden level 7 definition (PR #2088)

**Changed:** docs only: the [level 7 definition](../definitions/rain-garden.md#level-7-one-garden-for-two-rains-definition) (one garden for two rain cards), the weather-and-water dive's slice 7 note, and the READY line swap (define line removed, build line added).
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** no code, unit tests, typecheck, build or browser play (nothing built yet). No coverage-summary row changed: the `raingarden` row still records the level 6 code pass.
