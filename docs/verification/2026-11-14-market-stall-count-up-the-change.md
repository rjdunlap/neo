# 2026-11-14 — Market Stall count up the change (PR #1683)

**Changed:** Market Stall level 6 counts up the change (per-coin values, then the count from the price) with a ten strip under the price tag; rules `countsUp`, `countUpWords`, `countUpText`, `countUpSaid`, `tenStrip`.
**Ran:** `npm run typecheck`; `npm test` (351 files, 7098 tests) before the final speech tweak, then the market-stall and `src/content` tests after it; `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=6` (levels 6 and 7) with a screenshot of the level-6 strip showing the red over edge; `BROWSER_SUITE=fingerdemo FINGER_ONLY=market-stall FINGER_LEVELS=6`.
**Not run:** `npm run build` (no shared files or assets changed), other suites, and a real-phone listen to the "…" pause in device speech.
