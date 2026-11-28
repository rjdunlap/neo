# 2026-11-28 — D8: the starting view

**Changed:**
- `SaveData.settings.startView` (`'explore' | 'six'`, default `explore`; `migrate` keeps `six` and repairs anything else to `explore`; version stays 3).
- `exitFor` in `src/app/chooser.ts`, used at the end of `ChooserScene.begin`: a player with a friend goes to `go.daily()` when set to Today's six, else `go.hub()`; no friend still hatches. `hub` is untouched, so Back and Home stay Home.
- `src/rework.ts`: the root's `daily` route clears a pending `?daily`, so the six's Back cannot open the six again.
- Grown-ups' page: the Finding games section now shows at the root too, with an *Opens with* select (Home / Today's six at the root, The map / Today's six at `classic/`) and its note, from `startCopy` in `src/parent/copy.ts`.
- `BROWSER_SUITE=profiles` gains a `PROFILES_ONLY=start-view` step.

**Ran:** `npm run typecheck`; `npm test` (20,604 passed, 5 skipped), including new cases in `save.test.ts` (default, garbage repaired, kept through a backup), `store.test.ts` (two players keep their own value across switches), `chooser.test.ts` (`exitFor`) and `copy.test.ts` (both apps' wording; the root's copy still never says map); `npm run build`; lint and format check; `BROWSER_SUITE=profiles PROFILES_ONLY=start-view` on the dev server at 1024×768: the row saved Mia's choice at the root and at `classic/`, Mia's card opened Today's six (step 0: the six draws and works at `classic/`), Back went to Home (root) and the map (`classic/`), Sam on the default opened Home and the map, and `/?daily` with Mia set to the six opened it once with Back to Home. Passed first time.

**Not run:** the full `profiles` suite and `world` (the `hub` route and every other route are unchanged; the chooser's other exits are covered by the unit test of `exitFor`); offline (only the new field touched persistence). The phone, guest, new-player and pad paths are unchanged in code (the phone's root shows the six from either route) and were not re-driven in a browser.
