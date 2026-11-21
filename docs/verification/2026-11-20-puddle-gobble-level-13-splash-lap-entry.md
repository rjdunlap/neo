# 2026-11-20 — Puddle Gobble level 13 Splash, lap entry (PR #1922)

**Changed:** new lap band (13) and `entryLevels` [13] for `puddle-gobble`: a touch hops the puddle across with a spray, three shells at tier-2 width, no growth, nothing refused; voice line, how-to rows, rule tests and a `PUDDLE_ONLY=13` browser case.
**Ran:** typecheck; vitest on `src/games/puddle-gobble`, `registry` and `content` (320 passed); eslint; prettier; `BROWSER_SUITE=puddlegobble PUDDLE_ONLY=13` passed with an 820x1100 portrait screenshot.
**Not run:** `npm run build`, offline, `fingerdemo` (bot unchanged), the full `puddlegobble` suite.
