# 2026-11-28 — Stir and See levels 1–5 (PR #2312)

**Changed:** new game `stir-see` (Bubble Beach, toddler–school, upright-ready), levels 1–5 per [the definition](../definitions/stir-and-see.md); four journal entries.
**Ran:** `npm run typecheck`; `npx vitest run src/games/stir-see src/content src/games/registry.test.ts src/ui` (rule, accounting, upright and sideways layout, forbidden-words, journal, lands, registry, game-docs tests pass); `BROWSER_SUITE=stirsee` against the dev server with Chromium: level 1 two spoons and the shimmer, level 3 a wrong cup one miss, the same cup again none, Show a hint twice one hint, saved 1/1; level 5 free look, filing first, a wrong tray one miss, saved 1/0; journal entries; upright phone screenshots of levels 1, 3 and 5.
**Not run:** `npm run build` (no shared assets changed; CI runs it); `fingerdemo` at level 5; level 2 and 4 in the browser (covered by rule tests).
