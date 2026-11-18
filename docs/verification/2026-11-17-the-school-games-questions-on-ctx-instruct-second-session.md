# 2026-11-17 — The school games' questions on ctx.instruct, second session (PR #1779)

**Changed:** TotoLogic P3 slice 3, school games: Example Express' question after the surprise and Lost Layers' question after the first story (plus a new short which-story line once the look is spent at level 2) moved from `ctx.say` to `ctx.instruct` (each game's `index.ts` and `voice.ts`); six other school games were read and needed nothing.
**Ran:** `npm run typecheck`; full `npm test` (362 files, 8,053 tests, 1 skipped); filtered plays `BROWSER_SUITE=lostlayers` and `BROWSER_SUITE=exampleexpress` on a silent dev server (headless Chromium), both passed.
**Not run:** build (CI runs it on the PR), offline, `fingerdemo` (no bot or demonstrated action changed), any other suite, any check that reads the caption text in a browser.
