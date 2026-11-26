# 2026-11-25 — Define Sink or Float level 8, Garden Raft (PR #2197)

**Changed:** Defined `sink-float` level 8 *Garden Raft* in `docs/definitions/garden-raft.md` (a stones-held-up rule and an exact balance-span rule as pure `raftVerdict` and `raftFix`, three pallets with a revise round, a failed launch never a miss, hint-only adaptation, school `order` `[5, 6, 9, 7, 8, 10]`, layout, controller ring, voice lines, rule tests, check tier); updated the engineering-design study, recommendations, study backlog, roadmap row, deep-dive index and the Sink or Float dive; replaced the define line in `docs/ready/next/` with the level 8 build line. The enumeration counts in the definition (42, 29 and 29 accepted placements) were checked with a throwaway script, not committed.
**Ran:** `node scripts/check-links.mjs` and `git diff --check` (docs-only tier).
**Not run:** TypeScript, Vitest, Vite build and browser suites (docs only); CI runs format, lint, `npm test` and `npm run build` on the PR.
