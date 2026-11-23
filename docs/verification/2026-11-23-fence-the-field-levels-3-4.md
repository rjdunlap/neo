# 2026-11-23 — Fence the Field levels 3–4 (PR #2042)

**Changed:** `fence-the-field` registers levels 3 (*Smallest first*) and 4 (*Leave two*), adds their how-to steps, says the leave-two line on a claim whose turn only a leave-two finishes well, and plays *show me why* on until the pet has taken plots (a costly claim now replays her own claims and forced give first). The `fencethefield` suite gains a level-4 segment, `FENCE_FROM=4` to play it alone.

**Ran (2026-11-23, this Mac):** `npm run typecheck`, `npm run lint`, prettier check on the game folder and `scripts/browser`, `npm test` (495 files, 18,424 tests passed, 1 skipped; the game's rule tests cover the level 3–4 first rails, level 4's leave-two test and take-all replay, the replay rule for every costly rail in all four pools, the hint walk and voice coverage), `npm run build`.

**Ran in Chromium (headless shell, dev server on http://localhost:5191 with `VITE_SPEECH=off`):** `FENCE_FROM=4 BROWSER_SUITE=fencethefield` passed (1 check) at 390 × 625 with captions via the Lantern Lake page route: the whole run taken (her claims, the give and the pet taking plots replayed, then stepped back: one miss), Help gave the leave-two hint (one hint), followed to the last rail, one sticker, return to the same land page. `BROWSER_SUITE=fingerdemo FINGER_ONLY=fence-the-field FINGER_LEVELS=4 FINGER_BAND=grownup` passed (13.6 s). The whole `BROWSER_SUITE=fencethefield` (levels 1, 2 and 4) then passed once more, since the suite file was restructured. Screenshot looked at (not committed): upright 390 × 625 mid-run with the leave-two glow and its caption; strip, field, Help and caption fit without overlap.

**Not run:** the offline suite, `world`, any other browser suite.
