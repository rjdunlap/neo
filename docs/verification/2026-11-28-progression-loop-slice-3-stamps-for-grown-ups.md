# 2026-11-28 — Progression loop slice 3: stamps for grown-ups

**Changed:**
- `src/content/stamps.ts` (new, pure): `goalsFor` (first, middle, top, clean from a band's ladder in order), `newStamps` (grown-up band only, help counts but for clean), `awardStamps` (once each, bonus 10/20/30/40 within the largest balance), `cleanStamps`, `stampLabel`. `SaveData.stamps` with defaults and repair; `store.earnStamps`.
- `GameScene.finish` earns stamps for a game listing `grownup` after the round's shells; the result adds the bonus to "+N shells" and a lantern pill under it ("New stamp: …", three or more counted). `src/ui/shells.ts` gains `lantern` and `stampTag`.
- `src/ui/stamps-sheet.ts` (new, plain HTML) and a lantern button on Today's six for a band that earns: every grown-up game's goals as paper lanterns, lit and dated when held. Styles in `src/style.css`.
- Docs: the definition's slice 3, DESIGN's save row, roadmap row 32.

**Ran:** `npx tsc --noEmit`; `npx vitest run src/content/stamps.test.ts src/content/shells.test.ts src/progress` (8 files, 183 tests, including a registry check that every grown-up game has goals with words); eslint and prettier on the changed files; `node scripts/check-links.mjs`; full `npm test` (557 files, 20,592 passed, 5 skipped). Headless Chromium as an iPhone 13, upright and sideways, on the dev server: picked Grown-up, opened the first of Today's six (Species Comeback) at its top level and finished it clean through the scene: four stamps and 105 shells (5 + 100) saved, the result showed both pills (sideways the four were named, which led to counting three or more so an upright phone fits); the six showed 105 and the lantern button (beside the notes upright, above them sideways); the stamps page listed 146 goals with Species Comeback's four lit and dated, and Done closed it.

**Not run:** no browser suite. Chrome emulation is not a real phone.
