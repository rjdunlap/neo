# 2026-11-19 — Swap Meet upright on phones (PR #1847)

**Changed:** Swap Meet plays upright (`upright: true`). Its layout was already a pure `layout` in `logic.ts`; the new per-level test found that on tall views the first friend row at y 300 put the friend panel corner and its request bubble under the undo and help buttons (bottoms at y 260) on levels 2–4. Held upright the first row is now max(420, min(560, 0.3 × height)) with the second row 380 below it. Sideways is unchanged.
**Ran:** `npm run typecheck`; vitest `src/games` (all passed, including the new `upright.test.ts` over every stage shape of every case on the five upright views plus 360 × 800 and 768 × 1024); prettier.
**Ran:** `BROWSER_SUITE=uprightgames` Swap Meet school level 4, completed with one sticker. A headless probe screenshotted toddler 1, preschool 2–3 and pre-K 4 (preschool 3 and pre-K 4 looked at, nothing overlapping); the harness intermittently listed no games for the lower bands, so those levels were not played to completion. Headless Chrome only.
**Not run:** `uprightsweep`, build, offline, other suites.
