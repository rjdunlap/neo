# 2026-11-13 — Vine Snip hint counts nothing at levels 1 and 2 (PR #1623)

**Changed:** `askForHint()` in `src/games/vine-snip/index.ts` counts a hint only when `plan.counts` (levels 3–5); at levels 1 and 2 Show a hint still glows the vine and says "Snip the glowing vine." but counts nothing, as the card says. The `Plan.counts` comment and a rule test name were updated; the `vinesnip` play now asks for a hint at level 1.
**Ran:** `npm run typecheck` (pass); vitest `src/games/vine-snip` (23 passed); `BROWSER_SUITE=vinesnip` filtered play (pass: level 1 a requested hint glowed the vine and counted nothing, three taps fed every friend 0/0; level 3 1/1; level 4; level 5 1/0).
**Not run:** `fingerdemo` (demonstrated action unchanged), build (no shared files), other suites.
