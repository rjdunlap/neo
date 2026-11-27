# 2026-11-26 — Bouncy Launch slice 8, lap level 2 and the magnet (PR #2228)

**Changed:** lap's order is now 13, 1, 2 (she can pull and let go after the tap level); on the star, numbered and near-or-far levels, four misses on one shot turn on a magnet that snaps a pull within 14 units of the right notch onto it and counts as one more hint (`magnetPull` in `logic.ts`).
**Ran:** `npm run typecheck`; `npx vitest run src/games/bouncy-launch src/content src/progress src/games/registry` (new magnet tests, lap order, registry); `BROWSER_SUITE=bouncylaunch LAUNCH_LEVEL=magnet` (phone landscape: lap level 2 pull with 0 misses and 0 hints; level 3 hints 0, 1, 1, 2 across four misses, a pull 9 units off snapped to the notch and landed).
**Not run:** `fingerdemo` (level 2's ghost finger is unchanged); full `npm test` (left to PR CI).
