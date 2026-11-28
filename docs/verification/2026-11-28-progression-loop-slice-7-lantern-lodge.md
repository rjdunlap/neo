# 2026-11-28 — Progression loop slice 7: Lantern Lodge

**Changed:**
- `src/content/lodge.ts` (new, pure): fifteen pieces with names, prices (1,890 shells in all) and the piece each rests on; `canBuild`, `build` (earning band only, once, support first, never below zero), `cleanLodge` (known pieces once, each with its chain of supports). `SaveData.lodge` with defaults and repair; `store.buildLodge`.
- `src/art/lodge.ts` (new): the 1200 × 800 lakeside picture and each piece, plain fills the paper pass turns to paper; `PIECE_AT` for tags and taps.
- `src/app/scenes/LodgeScene.ts` (new, route `lodge`): built pieces in place, the next ones faint with their price, a tap offers one with Build or "N more shells to go". A house button on Today's six for a band that earns.
- Docs: the definition's slice 7, DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; eslint and prettier on the changed files; `node scripts/check-links.mjs`; full `npm test` (565 files, 20,749 passed, 5 skipped); `npm run build`. Headless Chromium as an iPhone 13, upright and sideways: picked Grown-up, set 1,000 shells, opened the lodge from the six (fifteen pieces, seven faint with prices), built footing, walls, roof, door, windows, dock and flower bed (830 shells, 170 left), offered the lantern tree (250: "80 more shells to go"); the save held the seven pieces.

**Not run:** no browser suite. Chrome emulation is not a real phone.
