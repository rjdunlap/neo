# 2026-11-17 — Melt and Freeze levels 6–7 definition (matter slice 3, docs only, PR #1781)

**Changed:** new definition `docs/definitions/melt-and-freeze-predictions.md` (`melt-freeze` level 6 *Will it melt?* and level 7 *Can it go back?*; IDs 6 and 7 because ID 5 is the lap opening); pointers in the earlier definition, the matter study, the study backlog and the recommendations row (its stale "build gated on the developer" corrected). The landed Next ten line is removed and the build is queued as a new Next ten line.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. Nothing under `src/` changed; nothing built.
**Not run:** no code checks and no new source opened; `npm test` not run.
