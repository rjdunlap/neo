# 2026-11-19 — Clock Tower upright on phones (PR #1845)

**Changed:** Clock Tower plays upright (`upright: true`). The layout moved into a pure `towerLayout` in `layout.ts`. Held upright the request sign rides above the tower roof (level 6's "later" comparison to its right) and the hand key and bell sit in a row under the face; on the reading level the face shrinks to 60% with the three pretend-plan cards stacked beneath it (side by side they needed 900 of 768 units). Sideways is unchanged.
**Ran:** `npm run typecheck`; vitest for Clock Tower (new `upright.test.ts` over all 7 levels on the upright views plus 360 × 800 and 768 × 1024) and the registry (97 tests passed); prettier.
**Ran:** `BROWSER_SUITE=uprightgames` for Clock Tower, every level (pre-K 1–4, school 2–7), all completed with one sticker each; screenshots of levels 5 and 6 looked at (nothing overlapping, content placed sensibly). Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, other suites.
