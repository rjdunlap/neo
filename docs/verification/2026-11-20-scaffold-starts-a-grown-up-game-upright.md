# 2026-11-20 — Scaffold starts a grown-up game upright

**Changed:** `npm run new-game` with `--band grownup` now writes `upright: true` into the starter module and an `upright.test.ts` stub of todo tests; other bands are unchanged. NEW-GAME.md says so.
**Ran:** `scripts/new-game.test.mjs` (21 passed, including a new test for the grown-up and non-grown-up cases), `npm run typecheck`.
**Not run:** full unit suite, build and browser suites (tooling-only change, no shared game code touched).
