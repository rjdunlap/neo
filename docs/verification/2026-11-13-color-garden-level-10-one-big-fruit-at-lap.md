# 2026-11-13 — Color Garden level 10, one big fruit at lap (PR #1608)

**Changed:** `color-garden` level 10 *One big fruit*, first in lap's order `[10, 9]`, an entry level (a saved 10 carried into toddler plays 9). One big fruit (1.6×) in the canopy; a touch anywhere hops it into its own color's basket with the color named, and the next fruit grows on that touch. Six fruit, two colors; after about six quiet seconds the fruit wiggles, counting no hint. Registry test fixed and game docs regenerated.
**Ran:** `npm run typecheck`; `npm test` (all pass); `BROWSER_SUITE=originals ORIGINALS_ONLY=garden GARDEN_LEVELS=10` passed (portrait, touches on sky, basket, tree and grass; zero misses and hints; score and sticker saved); `BROWSER_SUITE=fingerdemo FINGER_ONLY=color-garden FINGER_LEVELS=10 FINGER_BAND=lap` finished in 11.8 s.
**Not run:** `npm run build` (no shared files or assets changed), other suites and the other color-garden levels.
