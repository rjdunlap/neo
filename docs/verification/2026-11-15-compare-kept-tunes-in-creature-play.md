# 2026-11-15 — Compare kept tunes in creature play (PR #1707)

**Changed:** Creature play opens two beat grids when both tune slots are occupied. The player can switch and replay tunes without saving anything.
**Ran:** Typecheck, `npm test -- --maxWorkers=5` (7,193 passed, five skipped), production build and `GAME_URL=http://localhost:5196 BROWSER_SUITE=home HOME_ONLY=tunes npm run test:browser` at `0ee5c3f9` plus this change. Checked switching, rotating, replaying, pausing, closing, exiting, undo, the single and hidden tune cases, and profile isolation. Reviewed the portrait capture.
**Not run:** Full Home browser suite, offline suite or audible listening. The browser harness verified the notes sent to the synthesizer with audio muted.
