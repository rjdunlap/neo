# 2026-11-21 — Define Vine Snip level 6, Where will it land? (docs only, PR #1947)

**Changed:** new definition `docs/definitions/vine-snip-where-will-it-land.md`; the Vine Snip dive's slice 1, level 6 row and slice 2 point at it; docs map line; READY Queued line for the build, Next ten line 400 removed (three lines remain in Next ten; the header gives no refill rule).
**Ran:** `node scripts/check-links.mjs`, `git diff --check`; the definition's numbers were computed by running the shipped `logic.ts`, `view.ts` and `caption-layout.ts` functions with node.
**Not run:** code checks (nothing built).
