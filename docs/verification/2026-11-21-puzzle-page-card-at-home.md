# 2026-11-21 — Puzzle page card at home (PR #1958)

**Changed:** PP8, a puzzle page card in the grown-ups' page At home section (`puzzlePageCard(band)` in `src/content/puzzle-page.ts`; four ideas, shown preschool to school); the `athome` browser case also asserts no card at lap and the four ideas at school.
**Ran:** `npm run typecheck`; `npm test` (465 files, 17417 tests); `npm run build`; `npm run lint`; prettier check of changed files; the new rule tests shown to fail with a marble, "every day", "brain", "island" and an unregistered game put in, then restored; `BROWSER_SUITE=athome` on a private dev server with one upright 390×844 screenshot.
**Not run:** other browser suites, offline (no persistence, assets or navigation change).
