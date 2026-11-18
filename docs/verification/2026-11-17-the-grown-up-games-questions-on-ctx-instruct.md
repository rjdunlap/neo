# 2026-11-17 — The grown-up games' questions on ctx.instruct (PR #1777)

**Changed:** TotoLogic P3 slice 3, grown-up games: Mystery Grid's "Who has the pie?" and its second-board instruction, and Secret Code's phase asks and the pet's first try, moved from `ctx.say` to `ctx.instruct` (`src/games/logic-grid/index.ts`, `src/games/secret-code/index.ts` and `voice.ts`).
**Ran:** `npm run typecheck`; `npx vitest run src/games/logic-grid src/games/secret-code src/ui src/content src/audio` (410 passed, 1 skipped, including the 180-character caption budget test); `BROWSER_SUITE=logicgrid` (levels 1-8 to the sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=secret-code`.
**Not run:** build (no shared files or assets changed), offline, the full unit suite locally (CI runs it), a two-seat Secret Code browser play, any check that reads the caption text in a browser. `code.markagain` has no rendered clip yet (device speech).
