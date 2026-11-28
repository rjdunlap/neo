# 2026-11-28 — Pad pointer: keys and a pad play every touch round

**Changed:**
- `src/app/pad-pointer.ts` (new): `PointerMotion` (pure: first press shows the hand, an arrow tap jumps to the nearest touchable thing that way or steps where none is within reach, holding glides, the bottom button is a finger held down) and `PadPointer`, which draws the guide's hand and sends real pointer events to the canvas with id `PAD_POINTER`. `touchSpots` finds what answers a touch.
- `GameScene` runs it in every round that has no controller play at its level; `App` runs one on any screen with `Scene.padPointer` (Home, Today's six and the rest; off on the chooser, couch play, map, lands and rounds). A real touch hides it; neither treats its presses as a finger.
- `GameModule.ownKeys` on Count the Ballots, Crossword, Market Days, Two Tablets and Word Code: the hand takes only a pad there (`CouchInput.pads`). `drawHand` exported from the ghost finger.
- Docs: DESIGN's app-and-scenes row, roadmap Lands stage C.

**Ran:** `npx tsc --noEmit`; `npx vitest run src/app/pad-pointer.test.ts` (5 tests); full `npm test` (558 files, 20,605 passed, 5 skipped); eslint and prettier on the changed files; `npm run build`. Browser suites `livekeys`, `landkeys`, `countballots` passed (system Chromium via `BROWSER_EXECUTABLE`). Scripted keys in headless Chromium at 1366 by 768: Grown-up opened Village Planner from Today's six, Enter started it, the hand appeared on the first arrow, a tap picked a job and two steps up and Enter placed it; Shape Sorter (toddler) took a hold-Space-and-Up drag into the box; Memory Match off its couch levels flipped a card; Market Days kept its own arrow keys with no hand; Backspace to Today's six, arrows moved the hand between the six cards and Enter opened Meadow Pens through its card into the round.

**Not run:** no physical controller (parked, [DEVICE-CHECKS](../DEVICE-CHECKS.md)); `world` and `couch` suites. Headless Chromium is not a real laptop or pad.
