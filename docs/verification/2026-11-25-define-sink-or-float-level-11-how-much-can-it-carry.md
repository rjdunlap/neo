# 2026-11-25 — Define Sink or Float level 11, How much can it carry? (PR #2207)

**Changed:** Defined `sink-float` level 11 *How much can it carry?* (Build a Boat) in `docs/definitions/build-a-boat.md`: a hull-width capacity rule that shares the raft's low rule through an extracted `holdsLoad`, three rounds (wide against narrow, a pile of four, a pile of seven), a spill that is never a miss, hint-only adaptation, school `order` `[5, 6, 9, 7, 8, 11, 10]`, layout, controller ring, voice lines, rule tests and check tier. Updated the Sink or Float dive and the study backlog; replaced the define line in `docs/ready/next/` with the level 11 build line. The capacities (8 and 4; 2, 4 and 6; 4, 6 and 8) were worked by hand, no script.
**Ran:** `node scripts/check-links.mjs` and `git diff --check` (docs-only tier).
**Not run:** TypeScript, Vitest, Vite build and browser suites (docs only); CI runs format, lint, `npm test` and `npm run build` on the PR.
