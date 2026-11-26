# 2026-11-26 — Define Market Days, medieval-life ML4 (docs only, PR #2226)

**Changed:** new definition `docs/definitions/market-days.md` (map model, day's-walk neighbour rule, exhaustive-count rule tests, levels 1–3, hint and dead-end rules, registration in Lantern Lake, couch note); the medieval-life dive's ML4 row; READY (the define line removed, the build line added to Next ten).
**Ran:** a throwaway Python enumeration of the `fair` map (13 neighbour pairs, six triangles, no 2-colouring, 6 proper 3-colourings forming one partition, 768 proper 4-colourings), `node scripts/check-links.mjs`, `git diff --check`.
**Not run:** code checks and browser plays (nothing built; the packet is a definition).
