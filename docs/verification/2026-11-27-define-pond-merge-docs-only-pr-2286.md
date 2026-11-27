# 2026-11-27 — Define Pond Merge (docs only, PR #2286)

**Changed:** Defined [Pond Merge levels 1–3](../definitions/pond-merge.md) (`pond-merge`, a fixed-step circle-pile solver in `logic.ts`, no fail line, free take-back, `upright: true`, Tinker Lab) for chunk 27; updated the [ROADMAP](../ROADMAP.md#chunks) row and the [docs map](../README.md); queued its build in Next ten.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`.
**Not run:** `npm run typecheck`, `npm test`, `npm run build` and browser suites (docs-only tier). The definition's solvability cap is a build-time measurement, not yet run.
