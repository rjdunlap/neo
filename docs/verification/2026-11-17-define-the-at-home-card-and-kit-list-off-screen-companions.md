# 2026-11-17 — Define the At-home card and kit list (off-screen-companions slice 4)

**Changed:** new `docs/definitions/at-home-card.md` (the At home section on the grown-ups' page: three ideas, Try, Notice and Say lines for a first eight games, a kit line from a fixed vocabulary); the off-screen companions study, study backlog, recommendations, IDEAS and roadmap pointers; READY: the define line removed, the build line added at the head of Next ten. Docs only; nothing is built.
**Ran:** `node scripts/check-links.mjs` and `git diff --check`. The definition's counts (176 games, 167 with an off-screen line, per-band counts) came from one throwaway vitest file run against `origin/main` at d5c1e6ed and deleted, not kept.
**Not run:** typecheck, unit tests, build and browser suites (docs-only tier); no code, test or asset changed.
