# 2026-11-23 — Market Stall level 11, Change from twenty (PR #2075)

**Changed:** Market Stall level 11 (`PLANS[10]`, mode `change`, coins 1/2/5, prices 11–19, paid 20 through the new `paid` plan field); two rows of ten on the strip; count-up hint; three new Kokoro clips.
**Ran:** typecheck; `npm test` (507 files, all passing after rendering the clips); `npm run build`; `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=10` passed (levels 10 and 11; level 11 at 390 × 844: giving back the price missed with `shop.price20`, one too much missed, count-up hint coins and line, screenshot with two strips of ten); `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=11 FINGER_BAND=school` passed (17.5 s).
**Not run:** offline check; other suites.
