# 2026-11-13 — attic-finds level 3 finishes itself (PR #1618)

**Changed:** `attic-finds` level 3 (lap's and toddler's first level) finishes by itself after the third half turn: no Finish picture, a queued touch is dropped, last up or down line and a 0.9 s look, then the bell, shelf line and shelf. Level 4 keeps its Finish picture. `finishesItself` and `finishOnTurn` in `logic.ts`; how-to card lines split for 3 and 4.
**Ran:** `npm run typecheck`; `npx vitest run src/games/attic-finds` (68 tests, 3 files) and `src/content` (203); `BROWSER_SUITE=atticlever` PASS (levels 3–6; level 3 ends by itself with a touch queued); `BROWSER_SUITE=fingerdemo FINGER_ONLY=attic-finds FINGER_LEVELS=3 FINGER_BAND=lap` PASS (7.4 s); `npm run game-docs` no change; prettier clean.
**Not run:** full `npm test` (CI runs it), build (no shared files or assets changed), offline, `world`.

Coverage row: [`atticlever` and `fingerdemo` (`attic-finds`)](../VERIFICATION.md#coverage-summary).
