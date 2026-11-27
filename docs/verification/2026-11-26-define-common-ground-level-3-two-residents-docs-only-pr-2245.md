# 2026-11-26 — Define Common Ground level 3, two residents (docs only, PR #2245)

**Changed:** Defined `social-emotional` slice 4 (*Common Ground*'s older-family case) as `common-ground` level 3 (`docs/definitions/common-ground-3.md`): the 2×3 drawing and drums floor, needs against wishes, 8 accepted plans of 30 placements (shelf only 3, doorway only 2, neither 3, both none), `school` 1–3 and `grownup` 3. Counts were re-derived with a short script, not by hand alone. Updated `docs/README.md`, the social-emotional study, `RECOMMENDATIONS.md` and `STUDY-BACKLOG.md`, and replaced the claimed Next ten line with the queued build line.
**Ran:** `node scripts/check-links.mjs`, `node scripts/ready.mjs` and `git diff --check` (docs-only tier).
**Not run:** typecheck, unit tests, build, browser and offline suites (docs only; CI runs format, lint, tests and build on the PR).
