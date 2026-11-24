# 2026-11-24 — Jar Clues lens above the thumb

**Changed:** Jar Clues shows a lens while a finger is on the board: the touched number large in a ring above the thumb (red and struck through when crossed off), following the finger and going on lift, in every phase. Ten cells across cannot reach 44 CSS px on a 390 px screen, so the board keeps its size (37.6 px); the thumbs test now lists the game as lensed rather than as an open fix, and the READY line is removed. A fix found by the browser play: the first version used `removeChildren(1)` on a container with one child, which Pixi rejects; the lens now keeps one text it updates.

**Ran (2026-11-24, this Mac, `origin/main` plus the branch):** `npm run typecheck`; `npx vitest run src/games/jar-clues src/games/grownup-thumbs.test.ts` (76 passed); `BROWSER_SUITE=jarclues` against a dev server on http://localhost:5417 with `VITE_SPEECH=off` (passed, no page errors, after the fix above).

**Screenshot looked at (not committed):** a press on 37 at 390 × 625 shows the "37" lens over the board, clear of the thumb.

**Not run:** the crossed-off lens look in a screenshot (same code path, colours only), `fingerdemo` (the bot taps cells unchanged), full `npm test` and build here (CI runs them), a real phone.
