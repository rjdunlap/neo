# 2026-11-25 — Progression loop slice 2: shells for grown-ups (PR #2143)

**Changed:**
- `src/content/shells.ts` (new, pure): `ShellsSave`, `earnShells` (5 a round, at most 15 per game per local day, `grownup` only, capped at 999 999), `cleanShells`, `emptyShells`, `earnsShells`. `SaveData.shells` with defaults and repair in `save.ts`; `store.earnShells(id, day)`.
- `GameScene.finish` earns after the sticker and before the flush; the result draws "+5 shells" on a cream pill under the sticker (nothing at the cap or for another band). `src/ui/shells.ts` draws the tag.
- `DailyScene` shows the balance after the date for a band that earns.
- Docs: the definition's built line, DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; `npx vitest run src/content/shells.test.ts src/progress` (7 files, 167 tests) and `src/progress/store.test.ts` with the new shells case; full `npm test` (512 files, 19,148 passed, 5 skipped); `npm run build`; eslint and prettier on the changed files; `node scripts/check-links.mjs`. Headless Chromium as an iPhone 13 (Playwright device profile) on the dev server: picked Grown-up on "Who's playing?", earned 5 via `kit.store`, opened Today's six (balance "5" beside the date, title plate widened to fit), opened the first card (Word Code) and finished a round through the scene: the result showed "+5 shells" under the sticker and the save read `{ balance: 10, earned: { 'tile-pairs': 5, 'word-code': 5 } }`.

Then the same as an iPhone 13 held sideways, finishing with a journal discovery: the journal card takes the room under the sticker, so the tag moves beside the sticker (it sits under it whenever the view is tall enough or there is no card).

**Not run:** no browser suite. Chrome emulation is not a real phone.
