# 2026-11-26 — Define Two Viewpoints (Story Steps level 14) and refill Next ten (PR #2240)

**Changed:** Defined `social-emotional` slice 3 (*Two Viewpoints*) as `story-steps` level 14 (`docs/definitions/two-viewpoints.md`); updated `docs/README.md`, `docs/deep-dives/subjects/social-emotional.md`, `docs/deep-dives/subjects/RECOMMENDATIONS.md`, `docs/STUDY-BACKLOG.md`, `docs/ROADMAP.md`, and `docs/READY.md`; queued the unblocked `story-steps` level 14 build slice and refilled `docs/ready/next/` (`little-conductor` 7–8 plus three eligible study definitions: `social-emotional` slice 4, `weather-water` slice 7, and `genetics` G8).
**Ran:** `node scripts/check-links.mjs`, `node scripts/ready.mjs`, and `git diff --check` (docs-only tier).
**Not run:** `npm run typecheck`, `npm test`, `npm run build`, and browser/offline suites (not needed for docs-only changes; CI will run format, lint, unit tests, and build on the PR merge commit).
