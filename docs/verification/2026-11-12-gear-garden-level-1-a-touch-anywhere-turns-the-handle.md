# 2026-11-12 — Gear Garden level 1, a touch anywhere turns the handle (PR #1588)

**Changed:** `gear-garden` level 1 (lap and toddler): a touch on the garden around the machine turns the handle like the panel; a touch while a flower blooms or during the finale rings a bell and puffs stars, counting nothing; Show a hint turns the handle without counting a hint at level 1 (levels 2–3 unchanged); new `Plan.anywhere` flag with one rule test; the how-to card's level-1 step and note follow.
**Ran:** `npm run typecheck`; `npx vitest run src/games/gear-garden src/content` (22 files, 230 passed); `BROWSER_SUITE=gears npm run test:browser` passed (headless Playwright on a local Vite dev server, extended level-1 block).
**Not run:** `fingerdemo` (the demonstrated action is unchanged), `npm run build` (no shared files or assets), full `npm test` (CI runs it), other suites.
