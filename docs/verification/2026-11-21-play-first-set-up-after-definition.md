# 2026-11-21 — Play first, set up after definition (PR #1948)

**Changed:** docs only: `docs/definitions/play-first.md` (TotoLogic P1), its READY lines (two build slices), the TotoLogic P1 note and the docs map line. Nothing was built.
**Ran:** `node scripts/check-links.mjs` (links ok) and `git diff --check` (clean).
**Not run:** typecheck, unit tests and browser suites (no code changed).
